#!/usr/bin/env python3
"""Remove baked-in white/checkerboard backgrounds from character PNGs."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'public/assets/characters'

SHEETS = {
  'warrior_sheet.png': 4,
  'frog_princess_sheet.png': 4,
  'princess_sheet.png': 3,
  'dragon_sheet.png': 3,
}


def is_bg(r, g, b):
  if r > 232 and g > 232 and b > 232:
    return True
  if abs(r - g) < 10 and abs(g - b) < 10 and r > 195:
    return True
  return False


def flood_clear(im: Image.Image) -> Image.Image:
  rgba = im.convert('RGBA')
  w, h = rgba.size
  px = rgba.load()
  seen = set()
  stack = []

  for x in range(w):
    for y in (0, h - 1):
      if is_bg(*px[x, y][:3]):
        stack.append((x, y))
  for y in range(h):
    for x in (0, w - 1):
      if is_bg(*px[x, y][:3]):
        stack.append((x, y))

  while stack:
    x, y = stack.pop()
    if (x, y) in seen or x < 0 or y < 0 or x >= w or y >= h:
      continue
    if not is_bg(*px[x, y][:3]):
      continue
    seen.add((x, y))
    px[x, y] = (px[x, y][0], px[x, y][1], px[x, y][2], 0)
    stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

  return rgba


def process_frame_strip(path: Path, frames: int):
  im = Image.open(path)
  fw = im.width // frames
  fh = im.height
  out = Image.new('RGBA', im.size)
  for i in range(frames):
    frame = im.crop((i * fw, 0, (i + 1) * fw, fh))
    out.paste(flood_clear(frame), (i * fw, 0))
  out.save(path, 'PNG')
  print(f'sheet {path.name} ({frames} frames)')


def process_standalone(path: Path):
  flood_clear(Image.open(path)).save(path, 'PNG')
  print(f'standalone {path.name}')


def main():
  for name, frames in SHEETS.items():
    p = ROOT / name
    if p.exists():
      process_frame_strip(p, frames)

  for p in sorted(ROOT.glob('*.png')):
    if p.name in SHEETS:
      continue
    process_standalone(p)


if __name__ == '__main__':
  main()
