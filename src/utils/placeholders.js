import { registerAllSprites } from '../sprites/index.js';

/**
 * 注册全部像素精灵纹理（add-assets）
 * // 替换为精灵图资源 — 已用像素矩阵实现，可换成外部 PNG
 */
export function ensurePlaceholderTextures(scene) {
  registerAllSprites(scene);
}
