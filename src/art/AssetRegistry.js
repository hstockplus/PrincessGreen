import { renderPixelArt } from '../core/PixelRenderer.js';
import { MOON_PALETTE, SPRITE_SCALE } from '../sprites/palette.js';
import {
  FROG_PRINCESS_PIXELS,
  TEXTURE_KEYS,
  SHEET_KEYS,
} from '../sprites/characters.js';
import { preloadImageAssets } from './BackgroundArt.js';

export function preloadGameAssets(scene) {
  preloadImageAssets(scene);
}

export function registerGameAssets(scene) {
  if (!scene.textures.exists(TEXTURE_KEYS.FROG_PRINCESS)) {
    renderPixelArt(scene, FROG_PRINCESS_PIXELS, MOON_PALETTE, TEXTURE_KEYS.FROG_PRINCESS, SPRITE_SCALE);
  }
}

export function createCharacterSprite(scene, x, y, textureKey, targetHeight, sheetKey = null) {
  const useSheet = sheetKey && scene.textures.exists(sheetKey);
  const texKey = useSheet ? sheetKey : textureKey;
  const img = scene.textures.get(texKey).getSourceImage();
  const frameH = useSheet ? scene.textures.get(texKey).frames['0'].height : img.height;
  const scale = targetHeight / frameH;
  const sprite = scene.physics.add.sprite(x, y, texKey, useSheet ? 0 : undefined);
  sprite.setScale(scale);
  sprite.setOrigin(0.5, 0.92);
  const bodyW = (useSheet ? scene.textures.get(texKey).frames['0'].width : img.width) * scale * 0.35;
  sprite.body.setSize(bodyW, targetHeight * 0.3);
  sprite.body.setOffset(bodyW * 0.075, targetHeight * 0.58);
  sprite.body.setCollideWorldBounds(true);
  if (useSheet) sprite.setData('sheetKey', sheetKey);
  return sprite;
}

export function createDecorSprite(scene, x, y, textureKey, targetHeight, depth = 20, frame = 0, sheetKey = null) {
  const useSheet = sheetKey && scene.textures.exists(sheetKey);
  const texKey = useSheet ? sheetKey : textureKey;
  const img = scene.textures.get(texKey).getSourceImage();
  const frameH = useSheet ? scene.textures.get(texKey).frames[String(frame)].height : img.height;
  const scale = targetHeight / frameH;
  const sprite = scene.add.sprite(x, y, texKey, useSheet ? frame : undefined)
    .setScale(scale).setOrigin(0.5, 0.92).setDepth(depth);
  return sprite;
}

export function setSheetFrame(sprite, frame) {
  if (sprite?.setTexture && sprite.texture.key.startsWith('sheet_')) {
    sprite.setFrame(frame);
  }
}

export function ySort(sprite, base = 30) {
  if (sprite?.setDepth) sprite.setDepth(base + sprite.y * 0.05);
}

export { TEXTURE_KEYS, SHEET_KEYS };
