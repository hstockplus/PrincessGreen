import Phaser from 'phaser';
import { WARRIOR, BATTLE } from '../core/Constants.js';
import { createCharacterSprite, setSheetFrame, ySort, TEXTURE_KEYS, SHEET_KEYS } from '../art/AssetRegistry.js';
import { LaserProjectile } from './LaserProjectile.js';
import { playLaserFire } from '../systems/SimpleSFX.js';

export class Warrior {
  constructor(scene, x, y) {
    this.scene = scene;
    this.facingRight = true;
    this.lastFireAt = 0;
    this.invulnUntil = 0;
    this.goldenUntil = 0;
    this.baseSpeed = WARRIOR.SPEED;

    this.sprite = createCharacterSprite(scene, x, y, TEXTURE_KEYS.WARRIOR, WARRIOR.HEIGHT, SHEET_KEYS.WARRIOR);
    this.sprite.body.setAllowGravity(false);
  }

  update(keys) {
    if (!this.sprite?.body) return;
    const now = this.scene.time.now;
    const speed = now < this.goldenUntil ? this.baseSpeed * 1.8 : this.baseSpeed;

    let vx = 0;
    let vy = 0;
    if (keys.left) {
      vx = -speed;
      this.facingRight = false;
    } else if (keys.right) {
      vx = speed;
      this.facingRight = true;
    }
    if (keys.up) vy = -speed;
    if (keys.down) vy = speed;
    this.sprite.body.setVelocity(vx, vy);
    this.sprite.setFlipX(!this.facingRight);

    const moving = vx !== 0 || vy !== 0;
    setSheetFrame(this.sprite, moving ? 1 : 0);

    if (now < this.goldenUntil) {
      this.sprite.setTint(0xffd700);
    } else {
      this.sprite.clearTint();
    }

    ySort(this.sprite);
  }

  fireLaser(now) {
    if (now - this.lastFireAt < BATTLE.WARRIOR_FIRE_COOLDOWN_MS) return null;
    this.lastFireAt = now;
    const angle = this.facingRight ? 0 : Math.PI;
    playLaserFire();
    setSheetFrame(this.sprite, 2);
    this.scene.time.delayedCall(100, () => setSheetFrame(this.sprite, 0));
    return new LaserProjectile(
      this.scene,
      this.sprite.x + (this.facingRight ? 20 : -20),
      this.sprite.y - WARRIOR.HEIGHT * 0.35,
      angle,
      'warrior',
    );
  }

  activateGoldenForm(durationMs = 3000) {
    this.goldenUntil = this.scene.time.now + durationMs;
    this.sprite.setTint(0xffd700);
  }

  isGolden() {
    return this.scene.time.now < this.goldenUntil;
  }

  onHit(now) {
    this.invulnUntil = now + BATTLE.INVULN_MS;
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

  destroy() {
    this.sprite.destroy();
  }
}
