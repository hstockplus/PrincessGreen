import { WARRIOR } from '../core/Constants.js';
import { createCharacterSprite, ySort, TEXTURE_KEYS } from '../art/AssetRegistry.js';

export class Warrior {
  constructor(scene, x, y) {
    this.scene = scene;
    this.facingRight = true;
    this.sprite = createCharacterSprite(scene, x, y, TEXTURE_KEYS.WARRIOR, WARRIOR.HEIGHT);
    this.sprite.body.setAllowGravity(false);
  }

  update(keys) {
    if (!this.sprite?.body) return;
    let vx = 0;
    let vy = 0;
    if (keys.left) {
      vx = -WARRIOR.SPEED;
      this.facingRight = false;
    } else if (keys.right) {
      vx = WARRIOR.SPEED;
      this.facingRight = true;
    }
    if (keys.up) vy = -WARRIOR.SPEED;
    if (keys.down) vy = WARRIOR.SPEED;
    this.sprite.body.setVelocity(vx, vy);
    this.sprite.setFlipX(!this.facingRight);
    ySort(this.sprite);
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
