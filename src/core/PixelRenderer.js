/**
 * Renders 2D pixel matrices to Phaser canvas textures.
 * softPaint=true mimics 《月影传说》柔和手绘精灵质感。
 */

function hexToRgb(hex) {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

function rgbStr(r, g, b, a = 1) {
  return a < 1 ? `rgba(${r},${g},${b},${a})` : `rgb(${r},${g},${b})`;
}

function shade(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amount * 255)));
  return rgbStr(f(r), f(g), f(b));
}

export function renderPixelArt(scene, pixels, palette, key, scale = 5, softPaint = true) {
  if (scene.textures.exists(key)) return;

  const h = pixels.length;
  const w = pixels[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = pixels[y][x];
      if (idx === 0 || palette[idx] == null) continue;
      const color = palette[idx];
      const px = x * scale;
      const py = y * scale;
      const cx = px + scale / 2;
      const cy = py + scale / 2;

      if (softPaint && idx !== 1) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.72);
        grad.addColorStop(0, shade(color, 0.1));
        grad.addColorStop(0.55, shade(color, 0));
        grad.addColorStop(1, shade(color, -0.12));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, scale * 0.48, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const [r, g, b] = hexToRgb(color);
        ctx.fillStyle = rgbStr(r, g, b);
        ctx.fillRect(px, py, scale, scale);
      }
    }
  }

  scene.textures.addCanvas(key, canvas);
}

export function getTextureDisplaySize(scene, key, targetHeight) {
  const tex = scene.textures.get(key);
  const scale = targetHeight / tex.getSourceImage().height;
  return { scale, width: tex.getSourceImage().width * scale, height: targetHeight };
}
