import { renderPixelArt } from '../core/PixelRenderer.js';
import { MOON_PALETTE, SPRITE_SCALE } from '../sprites/palette.js';
import {
  WARRIOR_PIXELS,
  PRINCESS_PIXELS,
  FROG_PIXELS,
  FROG_PRINCESS_PIXELS,
  DRAGON_PIXELS,
  TEXTURE_KEYS,
} from '../sprites/characters.js';

export function registerGameAssets(scene) {
  renderPixelArt(scene, WARRIOR_PIXELS, MOON_PALETTE, TEXTURE_KEYS.WARRIOR, SPRITE_SCALE);
  renderPixelArt(scene, PRINCESS_PIXELS, MOON_PALETTE, TEXTURE_KEYS.PRINCESS, SPRITE_SCALE);
  renderPixelArt(scene, FROG_PIXELS, MOON_PALETTE, TEXTURE_KEYS.FROG, SPRITE_SCALE);
  renderPixelArt(scene, FROG_PRINCESS_PIXELS, MOON_PALETTE, TEXTURE_KEYS.FROG_PRINCESS, SPRITE_SCALE);
  renderPixelArt(scene, DRAGON_PIXELS, MOON_PALETTE, TEXTURE_KEYS.DRAGON, SPRITE_SCALE);
}

export function createCharacterSprite(scene, x, y, textureKey, targetHeight) {
  const img = scene.textures.get(textureKey).getSourceImage();
  const scale = targetHeight / img.height;
  const sprite = scene.physics.add.sprite(x, y, textureKey);
  sprite.setScale(scale);
  sprite.setOrigin(0.5, 0.92);
  sprite.body.setSize(img.width * scale * 0.45, targetHeight * 0.35);
  sprite.body.setOffset(img.width * scale * 0.275, targetHeight * 0.55);
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
