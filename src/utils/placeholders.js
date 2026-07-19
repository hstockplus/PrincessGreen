import { registerAllSprites } from '../sprites/index.js';
import { ASSETS } from '../art/AssetLoader.js';

/**
 * 注册 fallback 小件；角色立绘优先使用 AI 水墨图覆盖像素占位。
 */
export function ensurePlaceholderTextures(scene) {
  registerAllSprites(scene);

  const map = [
    [ASSETS.WARRIOR, 'tex_warrior'],
    [ASSETS.DRAGON, 'tex_dragon'],
    [ASSETS.PRINCESS, 'tex_princess'],
    [ASSETS.FROG, 'tex_frog'],
    [ASSETS.FROG_BEAST, 'tex_frog_princess'],
    [ASSETS.LINGZHI, 'tex_lingzhi'],
  ];
  map.forEach(([src, alias]) => {
    if (!scene.textures.exists(src)) return;
    try {
      if (scene.textures.exists(alias)) scene.textures.remove(alias);
      const img = scene.textures.get(src).getSourceImage();
      if (img) scene.textures.addImage(alias, img);
    } catch (e) {
      console.warn('texture alias failed', alias, e);
    }
  });
}
