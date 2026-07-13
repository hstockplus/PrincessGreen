import Phaser from 'phaser';
import { GAME, BATTLE, PX } from '../core/Constants.js';

export class LaserProjectile {
  constructor(scene, x, y, angle, owner) {
    this.scene = scene;
    this.owner = owner;
    this.active = true;
    this.hit = false;

    const arenaW = GAME.WIDTH * (BATTLE.ARENA.X_MAX - BATTLE.ARENA.X_MIN);
    const speed = arenaW / BATTLE.LASER_TRAVEL_MS;

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    const color = owner === 'warrior' ? 0x44aaff : 0xff4444;
    this.gfx = scene.add.rectangle(x, y, BATTLE.LASER_LENGTH, BATTLE.LASER_WIDTH, color, 0.95)
      .setDepth(40)
      .setRotation(angle);
    this.gfx.setStrokeStyle(2 * PX, owner === 'warrior' ? 0x88ccff : 0xff8888);
  }

  update(dt) {
    if (!this.active) return;
    this.gfx.x += this.vx * dt;
    this.gfx.y += this.vy * dt;

    const margin = BATTLE.LASER_LENGTH;
    if (
      this.gfx.x < -margin || this.gfx.x > GAME.WIDTH + margin
      || this.gfx.y < -margin || this.gfx.y > GAME.HEIGHT + margin
    ) {
      this.destroy();
    }
  }

  checkHit(targetX, targetY) {
    if (!this.active || this.hit) return false;
    const dx = targetX - this.gfx.x;
    const dy = targetY - this.gfx.y;
    if (Math.hypot(dx, dy) < BATTLE.HIT_RANGE) {
      this.hit = true;
      this.destroy();
      return true;
    }
    return false;
  }

  destroy() {
    this.active = false;
    this.gfx?.destroy();
    this.gfx = null;
  }
}
