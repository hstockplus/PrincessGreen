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

export function renderSpriteSheet(scene, frames, palette, key, scale = 3) {
  if (scene.textures.exists(key)) return;
  const h = frames[0].length;
  const w = frames[0][0].length;
  const frameW = w * scale;
  const frameH = h * scale;
  const canvas = document.createElement('canvas');
  canvas.width = frameW * frames.length;
  canvas.height = frameH;
  const ctx = canvas.getContext('2d');
  frames.forEach((pixels, fi) => {
    const offsetX = fi * frameW;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = pixels[y][x];
        if (!idx || palette[idx] == null) continue;
        const color = palette[idx];
        ctx.fillStyle = `rgb(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255})`;
        ctx.fillRect(offsetX + x * scale, y * scale, scale, scale);
      }
    }
  });
  scene.textures.addCanvas(key, canvas);
  scene.textures.get(key).add('__BASE', 0, 0, 0, canvas.width, canvas.height);
  for (let i = 0; i < frames.length; i++) {
    scene.textures.get(key).add(String(i), 0, i * frameW, 0, frameW, frameH);
  }
}
