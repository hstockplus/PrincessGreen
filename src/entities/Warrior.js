import Phaser from 'phaser';
import { GAME, WORLD, PLAYER, COLORS, ACTOR } from '../utils/constants.js';
import { gameState } from '../utils/gameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import { ASSETS, fitActor, setFacing } from '../art/AssetLoader.js';
import { BladeQi } from './BladeQi.js';
import { CombatFX } from '../fx/CombatFX.js';
import { applyDepthScale } from '../world/ParallaxBackground.js';

/**
 * 月影传说式 ARPG 勇士：八向移动、边走边打、金蟾刀气
 */
export class Warrior {
  constructor(scene, x, y) {
    this.scene = scene;
    this.facing = 1; // 1右 -1左
    this.aimAngle = 0;
    this.lastAttack = 0;
    this.lastQi = 0;
    this.invulnUntil = 0;
    this.attackBox = null;
    this.mobile = null;
    this.projectiles = [];
    this.baseScale = 1;
    this.walkPhase = 0;
    this.attackAnimUntil = 0;

    const key = scene.textures.exists(ASSETS.WARRIOR) ? ASSETS.WARRIOR : null;
    if (key) {
      this.sprite = scene.physics.add.sprite(x, y, key);
      this.sprite.setOrigin(0.5, 1);
      fitActor(this.sprite, 'warrior');
    } else {
      // TODO: 替换为实际美术资源 — 灰衣斗笠侠客
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(COLORS.WARRIOR, 1);
      g.fillRect(10, 20, 20, 36);
      g.fillTriangle(4, 22, 20, 4, 36, 22);
      g.generateTexture('ph_warrior', 40, 60);
      g.destroy();
      this.sprite = scene.physics.add.sprite(x, y, 'ph_warrior');
      this.sprite.setOrigin(0.5, 1);
    }

    this.baseScale = this.sprite.scaleX;
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setAllowGravity(false);
    this.sprite.setDepth(10);
    this.applyFacing();
    const bw = 28;
    const bh = 22;
    this.sprite.body.setSize(bw / this.sprite.scaleX, bh / this.sprite.scaleY);
    this.sprite.body.setOffset(
      (this.sprite.width - bw / this.sprite.scaleX) * 0.5,
      this.sprite.height - bh / this.sprite.scaleY - 2,
    );

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      j: Phaser.Input.Keyboard.KeyCodes.J,
      k: Phaser.Input.Keyboard.KeyCodes.K,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });

    scene.input.on('pointerdown', (p) => {
      if (gameState.dialogueActive || p.button !== 0) return;
      // 避开左右触控区，避免点按钮时误瞄准改朝向
      if (p.x < 220 || p.x > GAME.WIDTH - 220) return;
      this.aimFromPointer(p);
      this.tryAttack();
    });
  }

  setMobileState(m) { this.mobile = m; }

  applyFacing() {
    setFacing(this.sprite, this.facing, { artFacesRight: ACTOR.FACE_RIGHT });
  }

  aimFromPointer(p) {
    const a = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y - 40, p.worldX, p.worldY);
    this.aimAngle = a;
    this.facing = Math.cos(a) >= 0 ? 1 : -1;
    this.applyFacing();
  }

  update(dtOrBlocked = 16, blockedFlag = false) {
    let dt = 16;
    let blocked = blockedFlag;
    if (typeof dtOrBlocked === 'boolean') {
      blocked = dtOrBlocked;
      dt = this.scene.game.loop.delta || 16;
    } else {
      dt = dtOrBlocked || 16;
    }

    if (!this.sprite?.body) return;
    this.projectiles = this.projectiles.filter((q) => {
      if (!q.active) return false;
      q.update(dt);
      return q.active;
    });

    if (!blocked && !gameState.dialogueActive) {
      gameState.mp = Math.min(gameState.maxMp, gameState.mp + PLAYER.MP_REGEN * (dt / 1000));
    }

    if (blocked || gameState.dialogueActive) {
      this.sprite.body.setVelocity(0, 0);
      this.refreshDepthScale(0);
      return;
    }

    const m = this.mobile || {};
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.keys.a.isDown || m.left) vx -= 1;
    if (this.cursors.right.isDown || this.keys.d.isDown || m.right || m.forward) vx += 1;
    if (this.cursors.up.isDown || this.keys.w.isDown || m.up) vy -= 1;
    if (this.cursors.down.isDown || this.keys.s.isDown || m.down) vy += 1;

    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * PLAYER.SPEED;
      vy = (vy / len) * PLAYER.SPEED;
      this.aimAngle = Math.atan2(vy, vx);
      // 水平分量决定朝向；纯上下时保持原朝向
      if (Math.abs(vx) > 0.01) {
        this.facing = vx > 0 ? 1 : -1;
        this.applyFacing();
      }
    }

    // 仅在非触控 UI 区域按住指针时才用鼠标改朝向（避免点「跑/攻」扭头）
    const ptr = this.scene.input.activePointer;
    if (ptr?.isDown && ptr.x > 220 && ptr.x < GAME.WIDTH - 220 && !m.forward && !m.left && !m.right) {
      this.aimFromPointer(ptr);
    }

    this.sprite.body.setVelocity(vx, vy);
    this.clampWalkBand();
    this.refreshDepthScale(moving ? dt : 0);

    if (Phaser.Input.Keyboard.JustDown(this.keys.j) || m.attack) this.tryAttack();
    if (Phaser.Input.Keyboard.JustDown(this.keys.k) || m.skill) this.tryBladeQi();
    if (Phaser.Input.Keyboard.JustDown(this.keys.q) || m.use) this.useLingzhi();

    if (this.scene.time.now < this.invulnUntil) {
      this.sprite.setAlpha(0.55 + Math.sin(this.scene.time.now * 0.04) * 0.25);
    } else {
      this.sprite.setAlpha(1);
    }

    if (this.attackBox && this.scene.time.now > this.attackBox.until) {
      this.attackBox.rect?.destroy();
      this.attackBox = null;
    }
  }

  refreshDepthScale(dt) {
    const yMin = GAME.HEIGHT * WORLD.WALK_Y_MIN;
    const yMax = GAME.HEIGHT * WORLD.WALK_Y_MAX;
    applyDepthScale(this.sprite, this.baseScale, this.sprite.y, yMin, yMax);

    // 走路轻颤（攻击动画期间减弱）
    if (dt > 0 && this.scene.time.now > this.attackAnimUntil) {
      this.walkPhase += dt * 0.014;
      const bob = Math.sin(this.walkPhase) * 2.2;
      this.sprite.setAngle(Math.sin(this.walkPhase * 0.5) * 1.8 * this.facing);
      // 用 origin 微调视觉上下颤，不改物理 y
      this.sprite.setOrigin(0.5, 1 - bob * 0.002);
    } else if (this.scene.time.now > this.attackAnimUntil) {
      this.sprite.setAngle(0);
      this.sprite.setOrigin(0.5, 1);
    }
  }

  clampWalkBand() {
    const yMin = GAME.HEIGHT * WORLD.WALK_Y_MIN;
    const yMax = GAME.HEIGHT * WORLD.WALK_Y_MAX;
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, yMin, yMax);
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 40, this.scene.physics.world.bounds.width - 40);
  }

  refreshAimFromMouse() {
    const ptr = this.scene.input.activePointer;
    if (!ptr || ptr.x < 0) return;
    if (ptr.x < 220 || ptr.x > GAME.WIDTH - 220) return;
    this.aimFromPointer(ptr);
  }

  tryAttack() {
    const now = this.scene.time.now;
    if (now - this.lastAttack < PLAYER.ATTACK_COOLDOWN) return null;
    this.refreshAimFromMouse();
    this.lastAttack = now;
    this.attackAnimUntil = now + 220;
    eventBus.emit(Events.PLAYER_ATTACK);

    const ang = this.facing > 0 ? 0 : Math.PI;
    // 若有明确瞄准角且非纯上下，用瞄准角
    if (Math.abs(Math.cos(this.aimAngle)) > 0.2) {
      // keep aimAngle
    } else {
      this.aimAngle = ang;
    }
    const attackAng = this.aimAngle;
    const ox = this.sprite.x + Math.cos(attackAng) * 48;
    const oy = this.sprite.y - 52 + Math.sin(attackAng) * 20;

    CombatFX.slash(this.scene, ox, oy, attackAng);
    CombatFX.lunge(this.sprite, this.facing, 12);
    this.sprite.setAngle(this.facing * -8);
    this.scene.time.delayedCall(160, () => {
      if (this.sprite?.active) this.sprite.setAngle(0);
    });

    const rect = this.scene.add.rectangle(ox, oy, PLAYER.ATTACK_RANGE_W, PLAYER.ATTACK_RANGE_H, 0xffe8a0, 0.2)
      .setAngle(Phaser.Math.RadToDeg(attackAng))
      .setDepth(45);
    this.scene.physics.add.existing(rect);
    rect.body.setAllowGravity(false);
    rect.body.setImmovable(true);

    this.attackBox = {
      rect,
      damage: PLAYER.ATTACK_DAMAGE,
      until: now + PLAYER.ATTACK_DURATION,
      hitSet: new Set(),
    };
    this.scene.time.delayedCall(PLAYER.ATTACK_DURATION, () => {
      rect.destroy();
      if (this.attackBox?.rect === rect) this.attackBox = null;
    });
    return this.attackBox;
  }

  tryBladeQi() {
    const now = this.scene.time.now;
    if (now - this.lastQi < PLAYER.QI_COOLDOWN) return null;
    if (gameState.mp < PLAYER.QI_COST) return null;
    this.refreshAimFromMouse();
    this.lastQi = now;
    this.attackAnimUntil = now + 280;
    gameState.mp -= PLAYER.QI_COST;
    eventBus.emit(Events.PLAYER_SKILL);
    eventBus.emit(Events.HUD_REFRESH);

    const ang = Math.abs(Math.cos(this.aimAngle)) > 0.15
      ? this.aimAngle
      : (this.facing > 0 ? 0 : Math.PI);
    this.aimAngle = ang;
    const qx = this.sprite.x + Math.cos(ang) * 40;
    const qy = this.sprite.y - 56 + Math.sin(ang) * 16;
    CombatFX.skillBurst(this.scene, qx, qy, ang);
    CombatFX.lunge(this.sprite, this.facing, 16);

    const qi = new BladeQi(this.scene, qx, qy, ang);
    this.projectiles.push(qi);
    return qi;
  }

  useLingzhi() {
    if (gameState.lingzhi <= 0) return false;
    if (gameState.hp >= gameState.maxHp) return false;
    gameState.lingzhi -= 1;
    gameState.hp = Math.min(gameState.maxHp, gameState.hp + gameState.maxHp * PLAYER.HEAL_RATIO);
    eventBus.emit(Events.PLAYER_HEAL);
    eventBus.emit(Events.ITEM_USE, { id: 'lingzhi', left: gameState.lingzhi });
    eventBus.emit(Events.HUD_REFRESH);
    this.scene.cameras.main.flash(120, 80, 200, 120);
    CombatFX.pickupPop(this.scene, this.sprite.x, this.sprite.y - 80, '气血+30%');
    return true;
  }

  takeDamage(amount) {
    const now = this.scene.time.now;
    if (now < this.invulnUntil) return false;
    gameState.hp = Math.max(0, gameState.hp - amount);
    this.invulnUntil = now + PLAYER.INVULN_MS;
    eventBus.emit(Events.PLAYER_HURT);
    eventBus.emit(Events.HUD_REFRESH);
    this.scene.cameras.main.shake(140, 0.01);
    return true;
  }

  justInteract() {
    const m = this.mobile || {};
    return !!(Phaser.Input.Keyboard.JustDown(this.keys.e) || m.interact);
  }

  justDash() {
    const m = this.mobile || {};
    return !!(Phaser.Input.Keyboard.JustDown(this.keys.shift) || m.dash);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  destroy() {
    this.projectiles.forEach((p) => p.destroy());
    this.attackBox?.rect?.destroy();
    this.sprite.destroy();
  }
}
