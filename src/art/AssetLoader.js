import { ACTOR } from '../utils/constants.js';

/** 水墨武侠美术资源键 — 由提示词 AI 生成 */
export const ASSETS = {
  BG_PALACE: 'bg_palace',
  BG_SWAMP: 'bg_swamp',
  BG_CASTLE: 'bg_castle',
  BG_CHASE: 'bg_chase',
  BG_ENDING: 'bg_ending',
  WARRIOR: 'img_warrior',
  PRINCESS: 'img_princess',
  DRAGON: 'img_dragon',
  FROG: 'img_frog',
  FROG_BEAST: 'img_frog_beast',
  LINGZHI: 'img_lingzhi',
  SKILL_DASH: 'img_skill_dash',
};

export function preloadGameImages(scene) {
  scene.load.image(ASSETS.BG_PALACE, 'assets/backgrounds/palace.jpg');
  scene.load.image(ASSETS.BG_SWAMP, 'assets/backgrounds/swamp.jpg');
  scene.load.image(ASSETS.BG_CASTLE, 'assets/backgrounds/castle.jpg');
  scene.load.image(ASSETS.BG_CHASE, 'assets/backgrounds/chase.jpg');
  scene.load.image(ASSETS.BG_ENDING, 'assets/backgrounds/ending.jpg');
  scene.load.image(ASSETS.WARRIOR, 'assets/characters/warrior.png');
  scene.load.image(ASSETS.PRINCESS, 'assets/characters/princess.png');
  scene.load.image(ASSETS.DRAGON, 'assets/characters/dragon.png');
  scene.load.image(ASSETS.FROG, 'assets/characters/frog_guardian.png');
  scene.load.image(ASSETS.FROG_BEAST, 'assets/characters/frog_princess_beast.png');
  scene.load.image(ASSETS.LINGZHI, 'assets/items/lingzhi.png');
  scene.load.image(ASSETS.SKILL_DASH, 'assets/ui/skill_dash.png');
}

/** 全屏铺背景 */
export function showBackground(scene, key, depth = -10) {
  const { width, height } = scene.scale.gameSize;
  const img = scene.add.image(width / 2, height / 2, key).setDepth(depth);
  const scale = Math.max(width / img.width, height / img.height);
  img.setScale(scale);
  return img;
}

/** 按目标高度缩放立绘 */
export function fitSpriteHeight(sprite, targetH) {
  if (!sprite?.height) return sprite;
  sprite.setScale(targetH / sprite.height);
  return sprite;
}

/** 统一角色身高（脚底对齐用 origin 0.5,1） */
export function fitActor(sprite, role = 'warrior') {
  const map = {
    warrior: ACTOR.WARRIOR_H,
    princess: ACTOR.PRINCESS_H,
    dragon: ACTOR.DRAGON_H,
    frog: ACTOR.FROG_H,
    frogBeast: ACTOR.FROG_BEAST_H,
    bug: ACTOR.BUG_H,
  };
  return fitSpriteHeight(sprite, map[role] ?? ACTOR.WARRIOR_H);
}

/**
 * 设置水平朝向。默认立绘朝右：facing>0 不翻转，facing<0 翻转。
 * @param {Phaser.GameObjects.Sprite|Phaser.GameObjects.Image} sprite
 * @param {number} facing 1右 / -1左
 * @param {{ artFacesRight?: boolean }} [opts]
 */
export function setFacing(sprite, facing, opts = {}) {
  const artRight = opts.artFacesRight !== false;
  if (artRight) {
    sprite.setFlipX(facing < 0);
  } else {
    // 立绘本身朝左（如恶龙）
    sprite.setFlipX(facing > 0);
  }
}
