import { FROG_PRINCESS } from '../core/Constants.js';
import { createCharacterSprite, setSheetFrame, ySort, TEXTURE_KEYS, SHEET_KEYS } from '../art/AssetRegistry.js';

export class FrogPrincess {
  constructor(scene, x, y) {
    this.scene = scene;
    this.onGround = true;
    this.tongueActive = false;
    this.tongue = null;
    this.sprite = createCharacterSprite(
      scene, x, y, TEXTURE_KEYS.FROG_PRINCESS, FROG_PRINCESS.HEIGHT * 1.2, SHEET_KEYS.FROG_PRINCESS,
    );
  }

  update(keys, jumpPressed) {
    const body = this.sprite.body;
    let vx = 0;
    if (keys.left) vx = -FROG_PRINCESS.SPEED;
    if (keys.right) vx = FROG_PRINCESS.SPEED;
    body.setVelocityX(vx);
    if (vx !== 0) this.sprite.setFlipX(vx < 0);

    this.onGround = body.blocked.down;
    if (jumpPressed && this.onGround) {
      body.setVelocityY(FROG_PRINCESS.JUMP_VELOCITY);
      setSheetFrame(this.sprite, 1);
    } else if (!this.tongueActive) {
      setSheetFrame(this.sprite, vx !== 0 ? 1 : 0);
    }

    ySort(this.sprite);
  }

  fireTongue() {
    if (this.tongueActive) return null;
    this.tongueActive = true;
    setSheetFrame(this.sprite, 2);
    const dir = this.sprite.flipX ? -1 : 1;
    const startX = this.sprite.x + dir * FROG_PRINCESS.WIDTH * 0.3;
    const startY = this.sprite.y - FROG_PRINCESS.HEIGHT * 0.2;
    this.tongue = this.scene.add.ellipse(startX, startY, 12, 8, 0xff4466).setDepth(this.sprite.depth + 1);
    this.scene.tweens.add({
      targets: this.tongue,
      x: startX + dir * FROG_PRINCESS.TONGUE_RANGE * 0.6,
      duration: 280,
      yoyo: true,
      onComplete: () => {
        this.tongue?.destroy();
        this.tongue = null;
        this.tongueActive = false;
        setSheetFrame(this.sprite, 0);
      },
    });
    return this.tongue;
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  destroy() {
    this.tongue?.destroy();
    this.sprite.destroy();
  }
}
