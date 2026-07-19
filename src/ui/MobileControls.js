import { GAME, COLORS, FONT } from '../utils/constants.js';
import { ASSETS } from '../art/AssetLoader.js';

/**
 * 移动端：左摇杆 + 右按钮（跳/攻/互动/冲刺）
 */
export class MobileControls {
  constructor(scene, { showAttack = false, showDash = false, showInteract = true } = {}) {
    this.scene = scene;
    this.enabled = true;
    this.vector = { x: 0, y: 0 };
    this.jumpPressed = false;
    this.attackPressed = false;
    this.interactPressed = false;
    this.dashPressed = false;
    this.usePressed = false;

    const depth = 1100;
    const joyX = 120;
    const joyY = GAME.HEIGHT - 120;
    const btnX = GAME.WIDTH - 120;
    const btnY = GAME.HEIGHT - 120;

    this.base = scene.add.circle(joyX, joyY, 70, 0xffffff, 0.15)
      .setStrokeStyle(3, COLORS.GOLD, 0.5)
      .setScrollFactor(0)
      .setDepth(depth)
      .setInteractive();
    this.thumb = scene.add.circle(joyX, joyY, 32, COLORS.GOLD, 0.55)
      .setScrollFactor(0)
      .setDepth(depth + 1);
    this.joyOrigin = { x: joyX, y: joyY };
    this.maxDrag = 52;
    this.pointerId = null;

    this.base.on('pointerdown', (p) => {
      if (!this.enabled) return;
      this.pointerId = p.id;
      this._moveThumb(p.x, p.y);
    });
    scene.input.on('pointermove', (p) => {
      if (!this.enabled || this.pointerId !== p.id) return;
      this._moveThumb(p.x, p.y);
    });
    const endJoy = (p) => {
      if (this.pointerId !== p.id) return;
      this.pointerId = null;
      this.thumb.setPosition(this.joyOrigin.x, this.joyOrigin.y);
      this.vector = { x: 0, y: 0 };
    };
    scene.input.on('pointerup', endJoy);
    scene.input.on('pointerupoutside', endJoy);

    this.btns = [];
    const mkBtn = (x, y, r, label, color, onDown) => {
      const c = scene.add.circle(x, y, r, color, 0.72)
        .setStrokeStyle(3, COLORS.GOLD, 0.7)
        .setScrollFactor(0)
        .setDepth(depth)
        .setInteractive();
      const t = scene.add.text(x, y, label, {
        fontFamily: FONT.FAMILY,
        fontSize: '18px',
        color: COLORS.UI_TEXT,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
      c.on('pointerdown', () => {
        if (!this.enabled) return;
        c.setAlpha(1);
        onDown();
      });
      c.on('pointerup', () => c.setAlpha(0.72));
      c.on('pointerout', () => c.setAlpha(0.72));
      this.btns.push(c, t);
      return c;
    };

    mkBtn(btnX, btnY, 48, '跳', 0x2868b0, () => { this.jumpPressed = true; });
    if (showInteract) {
      mkBtn(btnX - 100, btnY - 10, 40, '互动', 0x2d6a4f, () => { this.interactPressed = true; });
    }
    if (showAttack) {
      mkBtn(btnX - 20, btnY - 100, 42, '攻', COLORS.BLOOD, () => { this.attackPressed = true; });
    }
    if (showDash) {
      if (scene.textures.exists(ASSETS.SKILL_DASH)) {
        const icon = scene.add.image(btnX - 110, btnY - 90, ASSETS.SKILL_DASH)
          .setDisplaySize(72, 72)
          .setScrollFactor(0)
          .setDepth(depth)
          .setInteractive({ useHandCursor: true });
        icon.on('pointerdown', () => { if (this.enabled) this.dashPressed = true; });
        this.btns.push(icon);
      } else {
        mkBtn(btnX - 110, btnY - 90, 40, '轻功', 0x8a6020, () => { this.dashPressed = true; });
      }
    }
    mkBtn(btnX + 10, btnY - 175, 34, '药', 0x4a2060, () => { this.usePressed = true; });

    this.root = [this.base, this.thumb, ...this.btns];
  }

  _moveThumb(x, y) {
    // pointer.x/y 已是游戏逻辑坐标（适配 Scale.FIT）
    const dx = x - this.joyOrigin.x;
    const dy = y - this.joyOrigin.y;
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, this.maxDrag);
    const nx = (dx / len) * clamped;
    const ny = (dy / len) * clamped;
    this.thumb.setPosition(this.joyOrigin.x + nx, this.joyOrigin.y + ny);
    const dead = 0.28;
    const vx = nx / this.maxDrag;
    const vy = ny / this.maxDrag;
    this.vector = {
      x: Math.abs(vx) < dead ? 0 : vx,
      y: Math.abs(vy) < dead ? 0 : vy,
    };
  }

  setVisible(v) {
    this.root.forEach((o) => o.setVisible(v));
  }

  setEnabled(v) {
    this.enabled = v;
    this.setVisible(v);
    if (!v) {
      this.vector = { x: 0, y: 0 };
      this.pointerId = null;
      this.thumb.setPosition(this.joyOrigin.x, this.joyOrigin.y);
    }
  }

  /** 每帧读取后清除一次性按键 */
  consume() {
    const out = {
      left: this.vector.x < -0.28,
      right: this.vector.x > 0.28,
      up: this.vector.y < -0.45,
      down: this.vector.y > 0.45,
      jump: this.jumpPressed,
      attack: this.attackPressed,
      interact: this.interactPressed,
      dash: this.dashPressed,
      use: this.usePressed,
    };
    this.jumpPressed = false;
    this.attackPressed = false;
    this.interactPressed = false;
    this.dashPressed = false;
    this.usePressed = false;
    return out;
  }

  destroy() {
    this.root.forEach((o) => o.destroy());
  }
}

export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).has('touch')) return true;
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}
