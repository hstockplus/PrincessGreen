import Phaser from 'phaser';
import { GAME } from '../utils/constants.js';

/**
 * 多层视差背景：远景慢、中景中、近景跟镜头，营造纵深
 */
export class ParallaxBackground {
  /**
   * @param {Phaser.Scene} scene
   * @param {string} textureKey
   * @param {number} worldW
   * @param {{ tint?: number, overlay?: number }} [opts]
   */
  constructor(scene, textureKey, worldW, opts = {}) {
    this.scene = scene;
    this.layers = [];
    this.worldW = worldW;

    const specs = [
      { scroll: 0.22, depth: -20, alpha: 0.85, scaleY: 1.05, y: GAME.HEIGHT * 0.42 },
      { scroll: 0.55, depth: -12, alpha: 0.95, scaleY: 1.0, y: GAME.HEIGHT * 0.5 },
      { scroll: 1.0, depth: -6, alpha: 1, scaleY: 1.0, y: GAME.HEIGHT * 0.52 },
    ];

    specs.forEach((sp, idx) => {
      const tileW = GAME.WIDTH * (idx === 0 ? 1.15 : 1);
      const count = Math.ceil(worldW / tileW) + 2;
      for (let i = 0; i < count; i++) {
        const img = scene.add.image(i * tileW + tileW / 2, sp.y, textureKey)
          .setDepth(sp.depth)
          .setAlpha(sp.alpha)
          .setScrollFactor(sp.scroll, 1);
        img.setDisplaySize(tileW + 6, GAME.HEIGHT * sp.scaleY);
        if (opts.tint != null) img.setTint(opts.tint);
        this.layers.push(img);
      }
    });

    // 近景暗角/地面雾，强化“走到近处看清近景”
    this.nearFog = scene.add.rectangle(
      worldW / 2,
      GAME.HEIGHT * 0.82,
      worldW,
      GAME.HEIGHT * 0.4,
      0x000000,
      opts.overlay ?? 0.22,
    ).setDepth(-5).setScrollFactor(1);

    // 远景天色罩
    this.skyWash = scene.add.rectangle(
      worldW / 2,
      GAME.HEIGHT * 0.18,
      worldW,
      GAME.HEIGHT * 0.4,
      0x0a1218,
      0.18,
    ).setDepth(-19).setScrollFactor(0.15);
  }

  destroy() {
    this.layers.forEach((l) => l.destroy());
    this.nearFog?.destroy();
    this.skyWash?.destroy();
  }
}

/**
 * 根据行走带 Y 做近大远小，增强纵深
 */
export function applyDepthScale(sprite, baseScale, y, yMin, yMax) {
  const t = Phaser.Math.Clamp((y - yMin) / Math.max(1, yMax - yMin), 0, 1);
  // 越靠屏幕下方（近景）越大
  const s = baseScale * (0.82 + t * 0.28);
  sprite.setScale(s);
}

/**
 * 配置镜头：跟角色、留死区、平滑插值
 */
export function setupFollowCamera(scene, target, { lerp = 0.1, deadzone = true } = {}) {
  const cam = scene.cameras.main;
  cam.startFollow(target, true, lerp, lerp * 0.8);
  cam.setZoom(1.05); // 略拉近，近景感
  if (deadzone) {
    cam.setDeadzone(GAME.WIDTH * 0.18, GAME.HEIGHT * 0.2);
  }
  return cam;
}
