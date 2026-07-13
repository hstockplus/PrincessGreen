import Phaser from 'phaser';
import { GAME, DRAGON, BATTLE } from '../core/Constants.js';
import { createCharacterSprite, ySort, TEXTURE_KEYS, SHEET_KEYS } from '../art/AssetRegistry.js';
import { LaserProjectile } from './LaserProjectile.js';
import { playLaserFire } from '../systems/SimpleSFX.js';

export class Dragon {
  constructor(scene, x, y) {
    this.scene = scene;
    this.patrolDir = 1;
    this.lastFireAt = 0;
    this.invulnUntil = 0;

    this.sprite = createCharacterSprite(scene, x, y, TEXTURE_KEYS.DRAGON, DRAGON.HEIGHT, SHEET_KEYS.DRAGON);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);
    const tex = scene.textures.get(SHEET_KEYS.DRAGON);
    const frameH = tex.frames['0'].height;
    this.baseScale = DRAGON.HEIGHT / frameH;

    this.arena = {
      xMin: GAME.WIDTH * BATTLE.ARENA.X_MIN,
      xMax: GAME.WIDTH * BATTLE.ARENA.X_MAX,
      yMin: GAME.HEIGHT * BATTLE.ARENA.Y_MIN,
      yMax: GAME.HEIGHT * BATTLE.ARENA.Y_MAX,
    };

    this.setFrame(0);
    this.clampPosition();
  }

  setFrame(frame) {
    if (this.sprite?.setFrame) this.sprite.setFrame(frame);
  }

  clampPosition() {
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, this.arena.xMin, this.arena.xMax);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, this.arena.yMin, this.arena.yMax);
  }

  update(warriorX, warriorY, now) {
    this.sprite.body.setVelocityX(this.patrolDir * DRAGON.SPEED * 0.5);
    this.sprite.body.setVelocityY(Math.sin(now * 0.002) * DRAGON.SPEED * 0.2);
    this.clampPosition();

    if (this.sprite.x >= this.arena.xMax || this.sprite.x <= this.arena.xMin) {
      this.patrolDir *= -1;
      this.sprite.setFlipX(this.patrolDir < 0);
    }

    if (now - this.lastFireAt >= BATTLE.DRAGON_FIRE_COOLDOWN_MS) {
      this.fireLaser(warriorX, warriorY, now);
    }

    ySort(this.sprite, 28);
  }

  fireLaser(targetX, targetY, now) {
    this.lastFireAt = now;
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const angle = Math.atan2(dy, dx);
    this.sprite.setFlipX(dx < 0);
    this.setFrame(1);
    this.scene.time.delayedCall(120, () => this.setFrame(0));
    playLaserFire();
    return new LaserProjectile(this.scene, this.sprite.x, this.sprite.y - DRAGON.HEIGHT * 0.3, angle, 'dragon');
  }

  onHit(now) {
    this.invulnUntil = now + BATTLE.INVULN_MS;
    this.setFrame(2);
    this.scene.time.delayedCall(200, () => this.setFrame(0));
  }

  isInvulnerable(now) {
    return now < this.invulnUntil;
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  reset(x, y) {
    this.sprite.setPosition(x, y);
    this.sprite.setScale(this.baseScale);
    this.sprite.body.setVelocity(0, 0);
    this.patrolDir = 1;
    this.lastFireAt = 0;
    this.invulnUntil = 0;
    this.setFrame(0);
  }

  destroy() {
    this.sprite.destroy();
  }
}
