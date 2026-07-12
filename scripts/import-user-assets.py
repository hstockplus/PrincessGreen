#!/usr/bin/env python3
"""Rename & process user-uploaded UUID assets from public/."""
from pathlib import Path
from PIL import Image

ROOT = Path('/workspace')
SRC = ROOT / 'public'
OUT_BG = ROOT / 'public/assets/backgrounds'
OUT_CHAR = ROOT / 'public/assets/characters'
OUT_UI = ROOT / 'public/assets/ui'

# Content-based mapping (verified by visual inspection)
MAP = {
    'C57396D8-8A6A-4213-9A02-EE3B62684322.png': ('backgrounds/menu.jpg', 'jpg'),
    '3BD9822F-115F-4F65-B8BB-DBC38721CBE5.png': ('backgrounds/princess_path.jpg', 'jpg'),
    'E8FD93C2-91D7-4691-996C-E4C07707B6CA.png': ('characters/frog_princess.png', 'png'),
    '25660DF1-6B73-4EC4-8565-52EBBB2CFC62.png': ('characters/warrior_sheet.png', 'png'),
    'A3689FF7-2A44-45DB-88E4-843602925A2E.png': ('characters/frog_princess_sheet.png', 'png'),
    '17692226-9687-4ECD-BAB1-D92FE1573F0B.png': ('characters/princess_sheet.png', 'png'),
    'BA1DB382-E015-4EBF-AAC9-DF07844EC7EC.png': ('characters/dragon_sheet.png', 'png'),
}

OUT_BG.mkdir(parents=True, exist_ok=True)
OUT_CHAR.mkdir(parents=True, exist_ok=True)
OUT_UI.mkdir(parents=True, exist_ok=True)


def trim_alpha(img: Image.Image) -> Image.Image:
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def save_jpg(img: Image.Image, dest: Path, quality=92):
    rgb = img.convert('RGB')
    rgb.save(dest, 'JPEG', quality=quality, optimize=True)


def split_ui_sheet(src: Path):
    img = Image.open(src).convert('RGBA')
    w, h = img.size
    mid = w // 2
    left = trim_alpha(img.crop((0, 0, mid, h)))
    right = trim_alpha(img.crop((mid, 0, w, h)))
    left.resize((256, 256), Image.Resampling.LANCZOS).save(OUT_UI / 'ui_joystick.png', 'PNG')
    # preserve aspect for skill button
    rw, rh = right.size
    scale = 128 / max(rw, rh)
    nw, nh = max(1, int(rw * scale)), max(1, int(rh * scale))
    right.resize((nw, nh), Image.Resampling.LANCZOS).save(OUT_UI / 'ui_skill_btn.png', 'PNG')


def main():
    for name, (rel, fmt) in MAP.items():
        src = SRC / name
        if not src.exists():
            raise SystemExit(f'missing {src}')
        dest = ROOT / 'public/assets' / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        img = Image.open(src)
        if fmt == 'jpg':
            save_jpg(img, dest)
        else:
            img.save(dest, 'PNG')
        print(f'ok {name} -> {rel}')

    ui_src = SRC / '7329B650-E7DA-413B-B27D-1CD27D6FCCD3.png'
    if ui_src.exists():
        split_ui_sheet(ui_src)
        print('ok UI sheet split -> ui/ui_joystick.png + ui/ui_skill_btn.png')


if __name__ == '__main__':
    main()
