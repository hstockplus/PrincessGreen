import Phaser from 'phaser';
import { GAME, WORLD, PLAYER, COLORS } from '../utils/constants.js';
import { gameState } from '../utils/gameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import { ASSETS } from '../art/AssetLoader.js';
import { BladeQi } from './BladeQi.js';

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

    const key = scene.textures.exists(ASSETS.WARRIOR) ? ASSETS.WARRIOR : null;
    if (key) {
      this.sprite = scene.physics.add.sprite(x, y, key);
      this.sprite.setOrigin(0.5, 0.92);
      const targetH = GAME.HEIGHT * 0.38;
      this.sprite.setScale(targetH / this.sprite.height);
    } else {
      // TODO: 替换为实际美术资源 — 灰衣斗笠侠客
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(COLORS.WARRIOR, 1);
      g.fillRect(10, 20, 20, 36);
      g.fillTriangle(4, 22, 20, 4, 36, 22);
      g.generateTexture('ph_warrior', 40, 60);
      g.destroy();
      this.sprite = scene.physics.add.sprite(x, y, 'ph_warrior');
      this.sprite.setOrigin(0.5, 0.92);
    }

    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setAllowGravity(false);
    const bw = 28;
    const bh = 20;
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
      if (p.x < 200 || p.x > GAME.WIDTH - 200) return; // 避开触控 UI
      this.aimFromPointer(p);
      this.tryAttack();
    });
  }

  setMobileState(m) { this.mobile = m; }

  aimFromPointer(p) {
    const a = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y - 30, p.worldX, p.worldY);
    this.aimAngle = a;
    this.facing = Math.cos(a) >= 0 ? 1 : -1;
    this.sprite.setFlipX(this.facing < 0);
  }

  update(dtOrBlocked = 16, blockedFlag = false) {
    // 兼容 update(blocked) / update(delta, blocked)
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

    // 内力回复
    if (!blocked && !gameState.dialogueActive) {
      gameState.mp = Math.min(gameState.maxMp, gameState.mp + PLAYER.MP_REGEN * (dt / 1000));
    }

    if (blocked || gameState.dialogueActive) {
      this.sprite.body.setVelocity(0, 0);
      return;
    }

    const m = this.mobile || {};
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.keys.a.isDown || m.left) vx -= 1;
    if (this.cursors.right.isDown || this.keys.d.isDown || m.right) vx += 1;
    if (this.cursors.up.isDown || this.keys.w.isDown || m.up) vy -= 1;
    if (this.cursors.down.isDown || this.keys.s.isDown || m.down) vy += 1;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * PLAYER.SPEED;
      vy = (vy / len) * PLAYER.SPEED;
      this.aimAngle = Math.atan2(vy, vx);
      if (vx !== 0) {
        this.facing = vx > 0 ? 1 : -1;
        this.sprite.setFlipX(this.facing < 0);
      }
    }

    // 鼠标瞄准优先（若按住键移动仍可用鼠标改朝向攻击）
    const ptr = this.scene.input.activePointer;
    if (ptr?.isDown && ptr.x > 200 && ptr.x < GAME.WIDTH - 200) {
      this.aimFromPointer(ptr);
    }

    this.sprite.body.setVelocity(vx, vy);
    this.clampWalkBand();

    // 边走边打：攻击不打断速度
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

  clampWalkBand() {
    const yMin = GAME.HEIGHT * WORLD.WALK_Y_MIN;
    const yMax = GAME.HEIGHT * WORLD.WALK_Y_MAX;
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, yMin, yMax);
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 40, this.scene.physics.world.bounds.width - 40);
  }

  refreshAimFromMouse() {
    const ptr = this.scene.input.activePointer;
    if (!ptr || ptr.x < 0) return;
    // 触控区外才用鼠标瞄准
    if (ptr.x < 200 || ptr.x > GAME.WIDTH - 200) return;
    this.aimFromPointer(ptr);
  }

  tryAttack() {
    const now = this.scene.time.now;
    if (now - this.lastAttack < PLAYER.ATTACK_COOLDOWN) return null;
    this.refreshAimFromMouse();
    this.lastAttack = now;
    eventBus.emit(Events.PLAYER_ATTACK);

    const ang = this.aimAngle;
    const ox = this.sprite.x + Math.cos(ang) * 42;
    const oy = this.sprite.y - 36 + Math.sin(ang) * 24;

    // TODO: 替换为实际美术资源 — 刀光
    const rect = this.scene.add.rectangle(ox, oy, PLAYER.ATTACK_RANGE_W, PLAYER.ATTACK_RANGE_H, 0xffe8a0, 0.35)
      .setAngle(Phaser.Math.RadToDeg(ang))
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
    gameState.mp -= PLAYER.QI_COST;
    eventBus.emit(Events.PLAYER_ATTACK);

    const ang = this.aimAngle;
    const qx = this.sprite.x + Math.cos(ang) * 36;
    const qy = this.sprite.y - 40 + Math.sin(ang) * 20;
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
    this.scene.cameras.main.flash(120, 80, 200, 120);
    return true;
  }

  takeDamage(amount) {
    const now = this.scene.time.now;
    if (now < this.invulnUntil) return false;
    gameState.hp = Math.max(0, gameState.hp - amount);
    this.invulnUntil = now + PLAYER.INVULN_MS;
    eventBus.emit(Events.PLAYER_HURT);
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
