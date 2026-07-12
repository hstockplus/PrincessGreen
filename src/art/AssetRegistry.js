import { renderPixelArt } from '../core/PixelRenderer.js';
import { MOON_PALETTE, SPRITE_SCALE } from '../sprites/palette.js';
import {
  FROG_PRINCESS_PIXELS,
  TEXTURE_KEYS,
} from '../sprites/characters.js';
import { preloadImageAssets } from './BackgroundArt.js';

export function preloadGameAssets(scene) {
  preloadImageAssets(scene);
}

export function registerGameAssets(scene) {
  // 蛙仙形态暂无立绘，保留像素 fallback
  if (!scene.textures.exists(TEXTURE_KEYS.FROG_PRINCESS)) {
    renderPixelArt(scene, FROG_PRINCESS_PIXELS, MOON_PALETTE, TEXTURE_KEYS.FROG_PRINCESS, SPRITE_SCALE);
  }
}

export function createCharacterSprite(scene, x, y, textureKey, targetHeight) {
  const img = scene.textures.get(textureKey).getSourceImage();
  const scale = targetHeight / img.height;
  const sprite = scene.physics.add.sprite(x, y, textureKey);
  sprite.setScale(scale);
  sprite.setOrigin(0.5, 0.92);
  sprite.body.setSize(img.width * scale * 0.35, targetHeight * 0.3);
  sprite.body.setOffset(img.width * scale * 0.325, targetHeight * 0.58);
  sprite.body.setCollideWorldBounds(true);
  return sprite;
}

export function createDecorSprite(scene, x, y, textureKey, targetHeight, depth = 20) {
  const img = scene.textures.get(textureKey).getSourceImage();
  const scale = targetHeight / img.height;
  const sprite = scene.add.sprite(x, y, textureKey).setScale(scale).setOrigin(0.5, 0.92).setDepth(depth);
  return sprite;
}

export function ySort(sprite, base = 30) {
  if (sprite?.setDepth) sprite.setDepth(base + sprite.y * 0.05);
}

export { TEXTURE_KEYS };
