import Phaser from 'phaser';
import { ASSETS, fitActor, setFacing } from '../art/AssetLoader.js';
import { GAME, DRAGON, COLORS, FONT } from '../utils/constants.js';

/**
 * 恶龙 BOSS — 爪击 + 抛物线火球，半血后加快火球
 */
export class DragonBoss {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    this.scene = scene;
    this.hp = DRAGON.MAX_HP;
    this.maxHp = DRAGON.MAX_HP;
    this.alive = true;
    this.phase = 'idle';
    this.timer = 800;
    this.fireballs = scene.physics.add.group();
    this.clawHitbox = null;
    this.onDefeat = null;

    if (!scene.textures.exists(ASSETS.DRAGON)) {
      // TODO: 替换为实际美术资源
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x1a3d28, 1);
      g.fillRoundedRect(0, 20, 140, 50, 12);
      g.fillStyle(0x0f2818, 1);
      g.fillTriangle(140, 30, 180, 45, 140, 60);
      g.fillStyle(0x2a5a38, 1);
      g.fillEllipse(40, 18, 50, 30);
      g.fillStyle(0xff4422, 1);
      g.fillCircle(155, 42, 6);
      g.generateTexture('dragon_placeholder', 180, 80);
      g.destroy();
    }

    const key = scene.textures.exists(ASSETS.DRAGON) ? ASSETS.DRAGON : 'dragon_placeholder';
    this.sprite = scene.physics.add.sprite(x, y, key);
    this.sprite.setDepth(5);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setAllowGravity(false);
    this.sprite.setOrigin(0.5, 1);
    if (key === ASSETS.DRAGON) {
      fitActor(this.sprite, 'dragon');
      this.sprite.body.setSize(this.sprite.width * 0.5, this.sprite.height * 0.35);
      this.sprite.body.setOffset(this.sprite.width * 0.25, this.sprite.height * 0.55);
    } else {
      this.sprite.body.setSize(160, 60);
    }
    this.sprite.setData('entity', this);
    // 恶龙立绘默认朝左
    setFacing(this.sprite, 1, { artFacesRight: false });

    this.hpBarBg = scene.add.rectangle(GAME.WIDTH / 2, 48, 520, 18, 0x1a1210, 0.9)
      .setDepth(30).setStrokeStyle(1, 0x6a4030);
    this.hpBar = scene.add.rectangle(GAME.WIDTH / 2 - 250, 48, 500, 12, 0x8b2020, 1)
      .setOrigin(0, 0.5).setDepth(31);
    this.hpLabel = scene.add.text(GAME.WIDTH / 2, 28, '恶龙 · 沼渊之主', {
      fontFamily: FONT.FAMILY,
      fontSize: '16px',
      color: COLORS.UI_TEXT,
    }).setOrigin(0.5).setDepth(31);

    this.setHpVisible(false);
  }

  setHpVisible(v) {
    this.hpBarBg.setVisible(v);
    this.hpBar.setVisible(v);
    this.hpLabel.setVisible(v);
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp = Math.max(0, this.hp - amount);
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(100, () => {
      if (this.alive) this.sprite.clearTint();
    });
    this.refreshHpBar();
    if (this.hp <= 0) {
      this.alive = false;
      this.sprite.setVelocity(0, 0);
      this.fireballs.clear(true, true);
      if (this.onDefeat) this.onDefeat();
    }
  }

  refreshHpBar() {
    this.hpBar.width = 500 * (this.hp / this.maxHp);
  }

  update(time, delta, playerX, playerY) {
    if (!this.alive) return;

    this.timer -= delta;
    const dx = playerX - this.sprite.x;
    setFacing(this.sprite, dx >= 0 ? 1 : -1, { artFacesRight: false });

    if (this.phase === 'idle' || this.phase === 'chase') {
      const dist = Math.hypot(dx, playerY - this.sprite.y);
      if (dist > 180) {
        const nx = dx / dist;
        const ny = (playerY - this.sprite.y) / dist;
        this.sprite.setVelocity(nx * DRAGON.SPEED, ny * DRAGON.SPEED * 0.7);
      } else {
        this.sprite.setVelocity(0, 0);
      }
    }

    if (this.timer > 0) return;

    const half = this.hp / this.maxHp <= 0.5;
    const fireCd = half ? DRAGON.FIREBALL_CD_RAGE : DRAGON.FIREBALL_CD;

    if (this.phase === 'idle' || this.phase === 'chase') {
      const dist = Math.hypot(dx, playerY - this.sprite.y);
      if (dist < 160) {
        this.doClaw(playerX, playerY);
        this.timer = DRAGON.CLAW_CD;
      } else {
        this.doFireball(playerX, playerY);
        this.timer = fireCd;
      }
    }
  }

  doClaw(px, py) {
    this.phase = 'claw';
    this.sprite.setVelocity(0, 0);
    const dir = px >= this.sprite.x ? 1 : -1;
    const hx = this.sprite.x + dir * 90;
    const hy = this.sprite.y - 20;

    // TODO: 替换为实际美术资源
    this.clawHitbox = this.scene.add.rectangle(hx, hy, 100, 70, 0xff4422, 0.35);
    this.scene.physics.add.existing(this.clawHitbox);
    this.clawHitbox.body.setAllowGravity(false);

    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + dir * 40,
      duration: 120,
      yoyo: true,
    });

    this.scene.time.delayedCall(220, () => {
      if (this.clawHitbox) {
        this.clawHitbox.destroy();
        this.clawHitbox = null;
      }
      this.phase = 'idle';
    });
  }

  doFireball(px, py) {
    this.phase = 'fire';
    const startX = this.sprite.x + (px >= this.sprite.x ? 70 : -70);
    const startY = this.sprite.y - 10;

    // TODO: 替换为实际美术资源
    const ball = this.scene.add.circle(startX, startY, 14, 0xff6622, 1);
    this.scene.physics.add.existing(ball);
    ball.body.setAllowGravity(false);
    ball.body.setCircle(14);
    this.fireballs.add(ball);

    const dx = px - startX;
    const dy = py - startY;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = DRAGON.FIREBALL_SPEED;
    ball.body.setVelocity((dx / dist) * speed, (dy / dist) * speed - 180);
    ball.body.setAcceleration(0, 420);

    this.scene.time.delayedCall(2800, () => {
      if (ball.active) ball.destroy();
    });

    this.phase = 'idle';
  }

  getClawHitbox() {
    return this.clawHitbox;
  }

  destroy() {
    this.fireballs.clear(true, true);
    if (this.clawHitbox) this.clawHitbox.destroy();
    if (this.sprite?.active) this.sprite.destroy();
    this.hpBarBg?.destroy();
    this.hpBar?.destroy();
    this.hpLabel?.destroy();
  }
}
