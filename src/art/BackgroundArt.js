import { GAME } from '../core/Constants.js';
import { TEXTURE_KEYS } from '../sprites/characters.js';

export const BG_KEYS = {
  SWAMP: 'bg_swamp',
  CASTLE: 'bg_castle',
};

/** 图片资源路径（对应用户提供的 6 张概念图） */
export const IMAGE_MANIFEST = [
  { key: TEXTURE_KEYS.WARRIOR, path: 'assets/characters/warrior.png', role: '勇士·靛青长衫' },
  { key: TEXTURE_KEYS.PRINCESS, path: 'assets/characters/princess.png', role: '公主·白衣罗裙' },
  { key: TEXTURE_KEYS.FROG, path: 'assets/characters/frog.png', role: '诅咒形态·碧玉灵蛙' },
  { key: TEXTURE_KEYS.DRAGON, path: 'assets/characters/dragon.png', role: '恶龙·紫鳞金须' },
  { key: BG_KEYS.SWAMP, path: 'assets/backgrounds/swamp.jpg', role: '沼泽荷塘·月夜' },
  { key: BG_KEYS.CASTLE, path: 'assets/backgrounds/castle.jpg', role: '宫殿王座·朱墙' },
];

export function preloadImageAssets(scene) {
  for (const { key, path } of IMAGE_MANIFEST) {
    scene.load.image(key, path);
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
