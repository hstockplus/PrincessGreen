import Phaser from 'phaser';
import { GAME, MOBILE, UI, isTouchDevice } from '../core/Constants.js';

const NOOP = {
  getMovement: () => ({ left: false, right: false, up: false, down: false }),
  consumeButtons: () => ({ attack: false, skill1: false, skill2: false, skill3: false }),
  setEnabled: () => {},
  setLabels: () => {},
  setSkillVisible: () => {},
  destroy: () => {},
};

/**
 * 王者荣耀式移动端操控：左下虚拟摇杆 + 右下普攻/技能一二三
 */
export function createMobileControls(scene, options = {}) {
  if (!isTouchDevice()) return NOOP;

  const labels = {
    attack: options.attackLabel ?? '普攻',
    skills: options.skillLabels ?? ['一', '二', '三'],
  };
  const skillEnabled = [...(options.skillEnabled ?? [true, true, true])];

  const m = MOBILE;
  const c = m.COLORS;

  const joyCx = m.MARGIN_X + m.JOY_BASE;
  const joyCy = GAME.HEIGHT - m.MARGIN_BOTTOM - m.JOY_BASE;
  const attackX = GAME.WIDTH - m.MARGIN_X - m.ATTACK_SIZE * 0.5;
  const attackY = GAME.HEIGHT - m.MARGIN_BOTTOM - m.ATTACK_SIZE * 0.5;

  const skillOffsets = [
    { x: -m.ATTACK_SIZE * 0.95, y: -m.SKILL_SIZE * 0.35 },
    { x: -m.ATTACK_SIZE * 0.55, y: -m.ATTACK_SIZE * 0.95 },
    { x: -m.ATTACK_SIZE * 1.45, y: -m.SKILL_SIZE * 0.85 },
  ];

  let enabled = true;
  let joyActive = false;
  let joyPointerId = null;
  let joyVec = { x: 0, y: 0 };
  const pending = { attack: false, skill1: false, skill2: false, skill3: false };

  const root = scene.add.container(0, 0).setDepth(m.DEPTH).setScrollFactor(0);

  function updateJoystick(pointer) {
    const dx = pointer.x - joyCx;
    const dy = pointer.y - joyCy;
    const dist = Math.hypot(dx, dy);
    const max = m.JOY_MAX_DRAG;
    const clamped = dist > max ? max / dist : 1;
    const tx = dx * clamped;
    const ty = dy * clamped;
    joyThumb.setPosition(joyCx + tx, joyCy + ty);
    joyVec = dist < 8 ? { x: 0, y: 0 } : { x: tx / max, y: ty / max };
  }

  function releaseJoystick(pointer) {
    if (pointer.id !== joyPointerId) return;
    joyActive = false;
    joyPointerId = null;
    joyVec = { x: 0, y: 0 };
    joyThumb.setPosition(joyCx, joyCy);
  }

  const joyBase = scene.add.circle(joyCx, joyCy, m.JOY_BASE, c.joyBase, m.ALPHA.base)
    .setStrokeStyle(3, c.stroke, 0.45);
  const joyThumb = scene.add.circle(joyCx, joyCy, m.JOY_THUMB, c.joyThumb, m.ALPHA.thumb)
    .setStrokeStyle(2, c.stroke, 0.65);
  const joyZone = scene.add.circle(joyCx, joyCy, m.JOY_BASE + 12, 0x000000, 0.001).setInteractive();
  joyZone.on('pointerdown', (pointer) => {
    if (!enabled) return;
    joyActive = true;
    joyPointerId = pointer.id;
    updateJoystick(pointer);
  });

  const onMove = (pointer) => {
    if (!joyActive || pointer.id !== joyPointerId) return;
    updateJoystick(pointer);
  };
  const onUp = (pointer) => releaseJoystick(pointer);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  scene.input.on('pointerupoutside', onUp);
  scene.events.once('shutdown', () => {
    scene.input.off('pointermove', onMove);
    scene.input.off('pointerup', onUp);
    scene.input.off('pointerupoutside', onUp);
  });

  function makeButton(x, y, radius, fill, label, onPress) {
    const g = scene.add.circle(x, y, radius, fill, m.ALPHA.btn)
      .setStrokeStyle(3, c.stroke, 0.75)
      .setInteractive();
    const t = scene.add.text(x, y, label, {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(radius * 0.72)}px`,
      color: c.label,
      stroke: '#301010',
      strokeThickness: 2,
    }).setOrigin(0.5);

    g.on('pointerdown', () => {
      if (!enabled) return;
      g.setFillStyle(fill, m.ALPHA.btnPress);
      g.setScale(0.92);
      onPress();
    });
    g.on('pointerup', () => { g.setFillStyle(fill, m.ALPHA.btn); g.setScale(1); });
    g.on('pointerout', () => { g.setFillStyle(fill, m.ALPHA.btn); g.setScale(1); });

    root.add([g, t]);
    return { g, t };
  }

  const attackBtn = makeButton(
    attackX, attackY, m.ATTACK_SIZE * 0.5, c.attack, labels.attack,
    () => { pending.attack = true; },
  );

  const skillBtns = [];
  skillOffsets.forEach((off, i) => {
    const key = `skill${i + 1}`;
    const btn = makeButton(
      attackX + off.x, attackY + off.y, m.SKILL_SIZE * 0.5, c.skill, labels.skills[i],
      () => { pending[key] = true; },
    );
    skillBtns.push(btn);
  });

  function applySkillVisibility() {
    skillBtns.forEach((btn, i) => {
      const vis = skillEnabled[i];
      btn.g.setVisible(vis);
      btn.t.setVisible(vis);
      if (vis) btn.g.setInteractive();
      else btn.g.disableInteractive();
    });
  }
  applySkillVisibility();

  root.add([joyBase, joyThumb, joyZone]);

  return {
    getMovement() {
      const { x, y } = joyVec;
      const dz = m.DEAD_ZONE;
      return {
        left: x < -dz,
        right: x > dz,
        up: y < -dz,
        down: y > dz,
      };
    },

    consumeButtons() {
      const out = { ...pending };
      pending.attack = false;
      pending.skill1 = false;
      pending.skill2 = false;
      pending.skill3 = false;
      return out;
    },

    setEnabled(value) {
      enabled = value;
      root.setAlpha(value ? 1 : 0.35);
    },

    setLabels({ attack, skills } = {}) {
      if (attack) attackBtn.t.setText(attack);
      if (skills) {
        skills.forEach((text, i) => {
          if (skillBtns[i] && text) skillBtns[i].t.setText(text);
        });
      }
    },

    setSkillVisible(flags) {
      flags.forEach((vis, i) => { skillEnabled[i] = vis; });
      applySkillVisibility();
    },

    destroy() {
      root.destroy();
    },
  };
}
