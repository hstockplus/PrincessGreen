import Phaser from 'phaser';
import { BUG, ACTOR } from '../utils/constants.js';
import { fitSpriteHeight } from '../art/AssetLoader.js';

/**
 * 沼泽毒虫 — 平面游荡小怪
 */
export class SwampBug {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    this.scene = scene;
    this.hp = BUG.HP;
    this.maxHp = BUG.HP;
    this.alive = true;
    this.dir = Math.random() > 0.5 ? 1 : -1;
    this.wanderTimer = 0;

    // TODO: 替换为实际美术资源
    if (!scene.textures.exists('bug_placeholder')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x3d5c2e, 1);
      g.fillEllipse(22, 16, 40, 26);
      g.fillStyle(0x1a2a12, 1);
      g.fillCircle(10, 12, 5);
      g.fillCircle(34, 12, 5);
      g.fillStyle(0x88aa44, 1);
      g.fillCircle(14, 10, 2);
      g.fillCircle(30, 10, 2);
      g.generateTexture('bug_placeholder', 44, 32);
      g.destroy();
    }

    this.sprite = scene.physics.add.sprite(x, y, 'bug_placeholder');
    this.sprite.body.setAllowGravity(false);
    fitSpriteHeight(this.sprite, ACTOR.BUG_H);
    this.sprite.setDepth(5);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(28, 18);
    this.sprite.setData('entity', this);

    this.hpBar = scene.add.graphics().setDepth(6);
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this.sprite.setTint(0xff6666);
    this.scene.time.delayedCall(80, () => {
      if (this.alive) this.sprite.clearTint();
    });
    if (this.hp <= 0) {
      this.alive = false;
      this.sprite.destroy();
      this.hpBar.destroy();
    }
  }

  update(time, delta, playerX, playerY) {
    if (!this.alive || !this.sprite.active) return;

    this.wanderTimer -= delta;
    const dx = playerX - this.sprite.x;
    const dy = playerY - this.sprite.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 220) {
      const nx = dx / dist;
      const ny = dy / dist;
      this.sprite.setVelocity(nx * BUG.SPEED, ny * BUG.SPEED);
      this.sprite.setFlipX(dx < 0);
    } else {
      if (this.wanderTimer <= 0) {
        this.dir *= -1;
        this.wanderTimer = 1200 + Math.random() * 1000;
      }
      this.sprite.setVelocity(this.dir * BUG.SPEED * 0.5, Math.sin(time / 400) * 20);
      this.sprite.setFlipX(this.dir < 0);
    }

    this.drawHp();
  }

  drawHp() {
    this.hpBar.clear();
    if (!this.alive) return;
    const x = this.sprite.x - 20;
    const y = this.sprite.y - 28;
    this.hpBar.fillStyle(0x222222, 0.8);
    this.hpBar.fillRect(x, y, 40, 5);
    this.hpBar.fillStyle(0xaa3333, 1);
    this.hpBar.fillRect(x, y, 40 * (this.hp / this.maxHp), 5);
  }

  destroy() {
    if (this.sprite?.active) this.sprite.destroy();
    if (this.hpBar) this.hpBar.destroy();
  }
}
