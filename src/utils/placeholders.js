import { registerPixelSprites } from '../art/sprites.js';

/**
 * 注册实体纹理。
 * 优先使用像素精灵（add-assets）；若需回退色块可在此扩展。
 * // 替换为精灵图资源 — 已由像素矩阵实现，后续可换成外部 PNG
 */
export function ensurePlaceholderTextures(scene) {
  registerPixelSprites(scene);
}
