import { FROG } from '../core/Constants.js';
import { createDecorSprite, ySort, TEXTURE_KEYS } from '../art/AssetRegistry.js';

export class FrogCompanion {
  constructor(scene, x, y) {
    this.scene = scene;
    this.following = false;
    this.sprite = createDecorSprite(scene, x, y, TEXTURE_KEYS.FROG, FROG.HEIGHT * 0.85, 25);
    this.sprite.setVisible(false);
  }

  enableFollow() {
    this.following = true;
    this.sprite.setVisible(true);
  }

  update(targetX, targetY) {
    if (!this.following) return;
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    if (dist > FROG.WIDTH * 1.5) {
      const dt = this.scene.game.loop.delta / 1000;
      this.sprite.x += (dx / dist) * FROG.SPEED * dt;
      this.sprite.y += (dy / dist) * FROG.SPEED * dt;
    }
    ySort(this.sprite, 25);
  }

  destroy() {
    this.sprite.destroy();
  }
}
