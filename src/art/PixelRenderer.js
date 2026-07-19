export function renderPixelArt(scene, pixels, palette, key, scale = 3) {
  if (scene.textures.exists(key)) return;
  const h = pixels.length;
  const w = pixels[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = pixels[y][x];
      if (!idx || palette[idx] == null) continue;
      const color = palette[idx];
      ctx.fillStyle = `rgb(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255})`;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  scene.textures.addCanvas(key, canvas);
}
