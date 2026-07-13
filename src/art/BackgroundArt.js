import { GAME } from '../core/Constants.js';
import { TEXTURE_KEYS, SHEET_KEYS, SHEET_FRAMES, UI_KEYS } from '../sprites/characters.js';

export const BG_KEYS = {
  MENU: 'bg_menu',
  PALACE: 'bg_castle',
  SWAMP: 'bg_swamp',
  CASTLE: 'bg_castle',
  PRINCESS_PATH: 'bg_princess_path',
};

const IMAGE_ASSETS = [
  { key: TEXTURE_KEYS.WARRIOR, path: 'assets/characters/warrior.png' },
  { key: TEXTURE_KEYS.PRINCESS, path: 'assets/characters/princess.png' },
  { key: TEXTURE_KEYS.FROG, path: 'assets/characters/frog.png' },
  { key: TEXTURE_KEYS.DRAGON, path: 'assets/characters/dragon.png' },
  { key: TEXTURE_KEYS.FROG_PRINCESS, path: 'assets/characters/frog_princess.png' },
  { key: BG_KEYS.MENU, path: 'assets/backgrounds/menu.jpg' },
  { key: BG_KEYS.SWAMP, path: 'assets/backgrounds/swamp.jpg' },
  { key: BG_KEYS.CASTLE, path: 'assets/backgrounds/castle.jpg' },
  { key: BG_KEYS.PRINCESS_PATH, path: 'assets/backgrounds/princess_path.jpg' },
  { key: UI_KEYS.JOYSTICK, path: 'assets/ui/ui_joystick.png' },
  { key: UI_KEYS.SKILL_BTN, path: 'assets/ui/ui_skill_btn.png' },
];

export function preloadImageAssets(scene) {
  for (const { key, path } of IMAGE_ASSETS) {
    scene.load.image(key, path);
  }
  for (const [key, spec] of Object.entries(SHEET_FRAMES)) {
    scene.load.spritesheet(key, spec.path, {
      frameWidth: spec.frameWidth,
      frameHeight: spec.frameHeight,
    });
  }
}

/** 横版全屏铺满背景图（cover） */
export function showSceneBackground(scene, textureKey, depth = 0) {
  if (!scene.textures.exists(textureKey)) return null;
  const bg = scene.add.image(GAME.WIDTH / 2, GAME.HEIGHT / 2, textureKey).setDepth(depth);
  const scale = Math.max(GAME.WIDTH / bg.width, GAME.HEIGHT / bg.height);
  bg.setScale(scale);
  return bg;
}

export { SHEET_KEYS };
