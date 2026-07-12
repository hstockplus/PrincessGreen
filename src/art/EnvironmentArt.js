import Phaser from 'phaser';
import { GAME } from '../core/Constants.js';

// 《月影传说》场景色 — 柔和暖调、天蓝远景、鎏金点缀
const C = {
  ink: 0x282030,
  skyTop: 0x5898d0,
  skyBot: 0xa8d8f0,
  skyNightTop: 0x182848,
  skyNightBot: 0x304868,
  sunWarm: 0xffe8a0,
  grassDark: 0x488030,
  grassMid: 0x68a848,
  grassLight: 0x88c868,
  waterDeep: 0x286880,
  waterLight: 0x48a0b8,
  waterShine: 0x78c8e0,
  path: 0xc0a878,
  pathLight: 0xe0c898,
  roof: 0x504038,
  roofTile: 0x685040,
  pillar: 0xc04040,
  wall: 0xe0d0b0,
  gold: 0xffd060,
  bamboo: 0x489040,
  lotus: 0xf0a0b8,
  moon: 0xfff8e0,
  moonGlow: 0xfff8e080,
  mountainFar: 0x6888a8,
  mountainMid: 0x486878,
  mountainNear: 0x385060,
  mist: 0xe8f0f8,
  plum: 0xf0a0b0,
  plumBranch: 0x504030,
  crane: 0xfff8f0,
  petal: 0xf0b8c8,
  palaceWall: 0xd8c8a8,
  palaceFloor: 0xb0a090,
  palaceNight: 0x281838,
  lantern: 0xf04040,
};

function s(v) {
  return v * (GAME.WIDTH / 960);
}

function drawPaintedSky(g, topColor, bottomColor, height = GAME.HEIGHT) {
  const steps = 48;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const r = Phaser.Math.Linear((topColor >> 16) & 0xff, (bottomColor >> 16) & 0xff, t);
    const gr = Phaser.Math.Linear((topColor >> 8) & 0xff, (bottomColor >> 8) & 0xff, t);
    const b = Phaser.Math.Linear(topColor & 0xff, bottomColor & 0xff, t);
    g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b), 1);
    g.fillRect(0, (height / steps) * i, GAME.WIDTH, height / steps + 1);
  }
}

function drawSoftMountains(g, baseY, layers) {
  layers.forEach(({ color, alpha, peaks }) => {
    g.fillStyle(color, alpha);
    peaks.forEach(([x1, y1, x2, y2, x3, y3]) => {
      g.fillTriangle(s(x1), baseY * y1, s(x2), baseY * y2, s(x3), baseY * y3);
    });
  });
}

function drawWarmSun(g, x, y, radius) {
  g.fillStyle(C.sunWarm, 0.15);
  g.fillCircle(x, y, radius * 2.2);
  g.fillStyle(C.sunWarm, 0.35);
  g.fillCircle(x, y, radius * 1.4);
  g.fillStyle(0xfff0c0, 0.9);
  g.fillCircle(x, y, radius);
}

function drawMoon(g, x, y, radius) {
  g.fillStyle(C.moon, 0.12);
  g.fillCircle(x, y, radius * 2.5);
  g.fillStyle(C.moon, 0.92);
  g.fillCircle(x, y, radius);
  g.fillStyle(C.skyNightTop, 0.2);
  g.fillCircle(x + radius * 0.25, y - radius * 0.15, radius * 0.85);
}

function drawMistBands(g, count = 3, baseY = 0.5, light = true) {
  for (let i = 0; i < count; i++) {
    g.fillStyle(C.mist, light ? 0.08 + i * 0.03 : 0.05 + i * 0.02);
    g.fillEllipse(
      GAME.WIDTH * (0.35 + i * 0.12),
      GAME.HEIGHT * (baseY + i * 0.05),
      GAME.WIDTH * (0.75 + i * 0.04),
      s(28 + i * 6),
    );
  }
}

function drawPlumBranch(g, x, y, scale = 1) {
  const sc = scale;
  g.lineStyle(s(2.5 * sc), C.plumBranch, 0.75);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x - s(28 * sc), y - s(18 * sc));
  g.lineTo(x - s(48 * sc), y - s(8 * sc));
  g.strokePath();
  for (let i = 0; i < 5; i++) {
    const px = x - s((8 + i * 9) * sc);
    const py = y - s((4 + i * 5) * sc);
    g.fillStyle(C.plum, 0.9);
    g.fillCircle(px, py, s(3.5 * sc));
    g.fillStyle(0xffc8d8, 0.55);
    g.fillCircle(px - s(1), py - s(1.5), s(2 * sc));
  }
}

function drawCrane(g, x, y, scale = 1, flip = false) {
  const dir = flip ? -1 : 1;
  g.fillStyle(C.crane, 0.8);
  g.fillEllipse(x, y, s(20 * scale), s(7 * scale));
  g.fillTriangle(x + dir * s(14 * scale), y, x + dir * s(30 * scale), y - s(5 * scale), x + dir * s(30 * scale), y + s(5 * scale));
  g.lineStyle(s(1.5), C.crane, 0.65);
  g.beginPath();
  g.moveTo(x - dir * s(5 * scale), y - s(2 * scale));
  g.lineTo(x - dir * s(5 * scale), y - s(16 * scale));
  g.lineTo(x - dir * s(12 * scale), y - s(20 * scale));
  g.strokePath();
}

function drawFallingPetals(g, count = 10) {
  for (let i = 0; i < count; i++) {
    const px = GAME.WIDTH * (0.04 + (i * 0.09) % 1);
    const py = GAME.HEIGHT * (0.06 + (i * 0.11) % 0.65);
    g.fillStyle(C.petal, 0.4 + (i % 3) * 0.08);
    g.fillEllipse(px, py, s(3.5), s(5.5));
  }
}

function drawWaterRipples(g, cx, cy, rx, ry) {
  for (let i = 0; i < 3; i++) {
    g.lineStyle(1.5, C.waterShine, 0.2 - i * 0.05);
    g.strokeEllipse(cx, cy + i * s(5), rx * (0.55 + i * 0.12), ry * (0.28 + i * 0.06));
  }
}

/** 主菜单 — 月影传说经典月夜亭台 */
export function drawMenuBackdrop(scene) {
  const g = scene.add.graphics().setDepth(0);
  drawPaintedSky(g, C.skyNightTop, C.skyNightBot);

  drawSoftMountains(g, GAME.HEIGHT, [
    { color: C.mountainFar, alpha: 0.4, peaks: [[0, 0.62, 220, 0.28, 440, 0.62], [340, 0.65, 560, 0.2, 820, 0.65]] },
    { color: C.mountainMid, alpha: 0.6, peaks: [[60, 0.55, 300, 0.18, 540, 0.55]] },
    { color: C.mountainNear, alpha: 0.8, peaks: [[0, 0.7, 200, 0.42, 400, 0.7], [520, 0.68, 740, 0.38, 960, 0.68]] },
  ]);

  drawMoon(g, GAME.WIDTH * 0.76, GAME.HEIGHT * 0.17, s(50));
  drawPavilion(g, GAME.WIDTH * 0.34, GAME.HEIGHT * 0.63, 1.25);
  drawPlumBranch(g, GAME.WIDTH * 0.1, GAME.HEIGHT * 0.32, 1.0);
  drawCrane(g, GAME.WIDTH * 0.52, GAME.HEIGHT * 0.2, 0.95);
  drawCrane(g, GAME.WIDTH * 0.6, GAME.HEIGHT * 0.26, 0.75, true);
  drawFallingPetals(g, 8);
  drawMistBands(g, 3, 0.52, false);

  g.fillStyle(C.waterDeep, 0.35);
  g.fillRect(0, GAME.HEIGHT * 0.7, GAME.WIDTH, GAME.HEIGHT * 0.3);
  g.fillStyle(C.moon, 0.1);
  g.fillEllipse(GAME.WIDTH * 0.76, GAME.HEIGHT * 0.84, s(36), s(7));
}

/** 绝望沼泽 — 月影暖色午后荷塘 */
export function drawSwampEnvironment(scene) {
  const g = scene.add.graphics().setDepth(0);
  drawPaintedSky(g, C.skyTop, C.skyBot, GAME.HEIGHT * 0.5);
  drawWarmSun(g, GAME.WIDTH * 0.82, GAME.HEIGHT * 0.12, s(36));

  drawSoftMountains(g, GAME.HEIGHT, [
    { color: 0x78a878, alpha: 0.35, peaks: [[0, 0.38, 280, 0.2, 560, 0.38]] },
    { color: 0x588858, alpha: 0.5, peaks: [[400, 0.4, 680, 0.18, 960, 0.4]] },
  ]);

  g.fillGradientStyle(C.grassDark, C.grassDark, C.grassMid, C.grassLight, 1);
  g.fillRect(0, GAME.HEIGHT * 0.32, GAME.WIDTH, GAME.HEIGHT * 0.68);

  g.fillStyle(C.waterDeep, 0.75);
  g.fillEllipse(GAME.WIDTH * 0.5, GAME.HEIGHT * 0.58, GAME.WIDTH * 0.76, GAME.HEIGHT * 0.36);
  g.fillStyle(C.waterLight, 0.4);
  g.fillEllipse(GAME.WIDTH * 0.48, GAME.HEIGHT * 0.56, GAME.WIDTH * 0.52, GAME.HEIGHT * 0.2);
  drawWaterRipples(g, GAME.WIDTH * 0.5, GAME.HEIGHT * 0.58, GAME.WIDTH * 0.28, GAME.HEIGHT * 0.1);

  drawStonePath(g, GAME.WIDTH * 0.05, GAME.HEIGHT * 0.53, GAME.WIDTH * 0.92, GAME.HEIGHT * 0.59);

  for (let i = 0; i < 9; i++) {
    const lx = GAME.WIDTH * (0.22 + i * 0.068);
    const ly = GAME.HEIGHT * (0.5 + (i % 3) * 0.032);
    g.fillStyle(0x308848, 0.88);
    g.fillEllipse(lx, ly, s(24), s(15));
    if (i % 2 === 0) {
      g.fillStyle(C.lotus, 0.92);
      g.fillCircle(lx, ly - s(9), s(5.5));
      g.fillStyle(0xffc0d8, 0.6);
      g.fillCircle(lx, ly - s(11), s(3));
    }
  }

  drawBamboo(g, GAME.WIDTH * 0.05, GAME.HEIGHT * 0.36, 6);
  drawBamboo(g, GAME.WIDTH * 0.14, GAME.HEIGHT * 0.33, 5);
  drawBamboo(g, GAME.WIDTH * 0.86, GAME.HEIGHT * 0.35, 7);
  drawBridge(g, GAME.WIDTH * 0.35, GAME.HEIGHT * 0.55, GAME.WIDTH * 0.26);
  drawSwampHut(g, GAME.WIDTH * 0.74, GAME.HEIGHT * 0.49);
  drawPavilion(g, GAME.WIDTH * 0.9, GAME.HEIGHT * 0.43, 0.9);
  drawMistBands(g, 2, 0.36);
}

/** 恶龙城堡 — 月影朱墙金瓦宫殿 */
export function drawCastleEnvironment(scene) {
  const g = scene.add.graphics().setDepth(0);
  drawPaintedSky(g, C.palaceNight, 0x3a2048);

  drawSoftMountains(g, GAME.HEIGHT, [
    { color: 0x382848, alpha: 0.45, peaks: [[0, 0.32, 400, 0.12, 800, 0.32]] },
  ]);

  g.fillStyle(0x302038, 0.88);
  g.fillRect(GAME.WIDTH * 0.03, GAME.HEIGHT * 0.2, GAME.WIDTH * 0.94, GAME.HEIGHT * 0.6);

  drawCastleGate(g, GAME.WIDTH * 0.5, GAME.HEIGHT * 0.35, 1.55);

  for (let i = 0; i < 5; i++) {
    drawLantern(g, GAME.WIDTH * (0.14 + i * 0.17), GAME.HEIGHT * 0.24);
  }

  for (let i = 0; i < 6; i++) {
    drawPillar(g, GAME.WIDTH * (0.1 + i * 0.14), GAME.HEIGHT * 0.26, GAME.HEIGHT * 0.52);
  }

  g.lineStyle(s(5), C.gold, 0.55);
  g.beginPath();
  g.moveTo(GAME.WIDTH * 0.04, GAME.HEIGHT * 0.24);
  g.lineTo(GAME.WIDTH * 0.96, GAME.HEIGHT * 0.24);
  g.strokePath();

  drawPalaceFloor(g, GAME.WIDTH * 0.04, GAME.HEIGHT * 0.64, GAME.WIDTH * 0.92, GAME.HEIGHT * 0.15);

  g.fillStyle(C.gold, 0.28);
  g.fillRect(GAME.WIDTH * 0.65, GAME.HEIGHT * 0.49, GAME.WIDTH * 0.26, GAME.HEIGHT * 0.1);
  g.fillStyle(C.pillar, 0.88);
  g.fillRect(GAME.WIDTH * 0.69, GAME.HEIGHT * 0.45, GAME.WIDTH * 0.18, GAME.HEIGHT * 0.08);
  g.fillStyle(C.gold, 0.65);
  g.fillTriangle(
    GAME.WIDTH * 0.67, GAME.HEIGHT * 0.45,
    GAME.WIDTH * 0.78, GAME.HEIGHT * 0.38,
    GAME.WIDTH * 0.89, GAME.HEIGHT * 0.45,
  );
}

/** 公主复仇 — 月影黄昏古道垂柳 */
export function drawPrincessEnvironment(scene) {
  const g = scene.add.graphics().setDepth(0);
  drawPaintedSky(g, 0x6898c0, 0xf0d8a8, GAME.HEIGHT * 0.48);
  drawWarmSun(g, GAME.WIDTH * 0.75, GAME.HEIGHT * 0.14, s(30));

  drawSoftMountains(g, GAME.HEIGHT, [
    { color: 0x88a878, alpha: 0.45, peaks: [[0, 0.46, 280, 0.2, 560, 0.46], [480, 0.48, 720, 0.18, 960, 0.48]] },
  ]);

  g.fillGradientStyle(C.grassDark, C.grassMid, C.grassLight, 0xa8d888, 1);
  g.fillRect(0, GAME.HEIGHT * 0.42, GAME.WIDTH, GAME.HEIGHT * 0.58);

  drawStonePath(g, GAME.WIDTH * 0.03, GAME.HEIGHT * 0.75, GAME.WIDTH * 0.97, GAME.HEIGHT * 0.79);
  drawWillow(g, GAME.WIDTH * 0.08, GAME.HEIGHT * 0.5);
  drawWillow(g, GAME.WIDTH * 0.92, GAME.HEIGHT * 0.48);
  drawPlumBranch(g, GAME.WIDTH * 0.8, GAME.HEIGHT * 0.28, 0.85);
  drawWatchtower(g, GAME.WIDTH * 0.78, GAME.HEIGHT * 0.39);
  drawCrane(g, GAME.WIDTH * 0.38, GAME.HEIGHT * 0.16, 0.85);
  drawFallingPetals(g, 12);

  for (let i = 0; i < 16; i++) {
    const gx = GAME.WIDTH * (0.06 + i * 0.058);
    g.fillStyle(C.grassLight, 0.7);
    g.fillTriangle(gx, GAME.HEIGHT * 0.77, gx - s(5), GAME.HEIGHT * 0.73, gx + s(5), GAME.HEIGHT * 0.73);
  }
  drawMistBands(g, 2, 0.4);
}

function drawLantern(g, x, y) {
  g.lineStyle(s(1.5), C.gold, 0.75);
  g.beginPath();
  g.moveTo(x, y - s(14));
  g.lineTo(x, y);
  g.strokePath();
  g.fillStyle(C.lantern, 0.9);
  g.fillEllipse(x, y + s(9), s(11), s(15));
  g.fillStyle(C.gold, 0.55);
  g.fillRect(x - s(7), y + s(22), s(14), s(3));
  g.fillStyle(0xffa848, 0.18);
  g.fillCircle(x, y + s(9), s(20));
}

function drawStonePath(g, x1, y, x2) {
  g.fillStyle(C.path, 0.82);
  g.fillRect(x1, y - s(10), x2 - x1, s(20));
  for (let x = x1; x < x2; x += s(24)) {
    g.fillStyle(C.pathLight, 0.5);
    g.fillRect(x + s(2), y - s(7), s(18), s(14));
    g.lineStyle(1, C.ink, 0.08);
    g.strokeRect(x + s(2), y - s(7), s(18), s(14));
  }
}

function drawBamboo(g, x, baseY, count) {
  for (let i = 0; i < count; i++) {
    const bx = x + i * s(12);
    const h = s(95 + i * 16);
    g.fillStyle(C.bamboo, 0.88);
    g.fillRect(bx, baseY - h, s(5), h);
    g.fillStyle(0x286028, 0.65);
    for (let j = 1; j < 5; j++) {
      g.fillRect(bx - s(1), baseY - h * (j / 5), s(7), s(2));
    }
    g.fillStyle(C.bamboo, 0.7);
    g.fillTriangle(bx - s(11), baseY - h, bx, baseY - h - s(16), bx + s(11), baseY - h);
  }
}

function drawBridge(g, x, y, w) {
  g.fillStyle(0x806040, 0.88);
  g.fillRect(x, y, w, s(11));
  for (let i = 0; i < 6; i++) {
    g.fillStyle(0x604028, 0.9);
    g.fillRect(x + i * (w / 6), y + s(11), s(5), s(24));
  }
  g.lineStyle(s(2.5), 0x907050, 0.75);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - s(14));
  g.lineTo(x + w, y - s(14));
  g.lineTo(x + w, y);
  g.strokePath();
}

function drawSwampHut(g, x, y) {
  g.fillStyle(C.wall, 0.92);
  g.fillRect(x - s(34), y - s(44), s(68), s(44));
  g.fillStyle(C.roofTile, 0.94);
  g.fillTriangle(x - s(42), y - s(44), x, y - s(76), x + s(42), y - s(44));
  g.lineStyle(s(2), C.gold, 0.45);
  g.strokeTriangle(x - s(42), y - s(44), x, y - s(76), x + s(42), y - s(44));
  g.fillStyle(C.pillar, 0.78);
  g.fillRect(x - s(32), y - s(42), s(7), s(40));
  g.fillRect(x + s(25), y - s(42), s(7), s(40));
  g.fillStyle(0x382820, 0.55);
  g.fillRect(x - s(10), y - s(22), s(20), s(22));
}

function drawPavilion(g, x, y, scale = 1) {
  const sc = scale;
  g.fillStyle(C.pillar, 0.9);
  g.fillRect(x - s(44 * sc), y - s(54 * sc), s(9 * sc), s(54 * sc));
  g.fillRect(x + s(35 * sc), y - s(54 * sc), s(9 * sc), s(54 * sc));
  g.fillRect(x - s(9 * sc), y - s(54 * sc), s(9 * sc), s(54 * sc));
  g.fillStyle(C.roof, 0.94);
  g.fillTriangle(x - s(60 * sc), y - s(54 * sc), x, y - s(94 * sc), x + s(60 * sc), y - s(54 * sc));
  g.lineStyle(s(2.5), C.gold, 0.7);
  g.strokeTriangle(x - s(60 * sc), y - s(54 * sc), x, y - s(94 * sc), x + s(60 * sc), y - s(54 * sc));
  g.fillStyle(C.wall, 0.5);
  g.fillRect(x - s(48 * sc), y - s(24 * sc), s(96 * sc), s(5 * sc));
  g.fillStyle(C.roof, 0.82);
  g.fillTriangle(x - s(60 * sc), y - s(54 * sc), x - s(72 * sc), y - s(49 * sc), x - s(56 * sc), y - s(60 * sc));
  g.fillTriangle(x + s(60 * sc), y - s(54 * sc), x + s(72 * sc), y - s(49 * sc), x + s(56 * sc), y - s(60 * sc));
}

function drawCastleGate(g, x, y, scale) {
  const sc = scale;
  g.fillStyle(C.roof, 0.94);
  g.fillTriangle(x - s(88 * sc), y, x, y - s(68 * sc), x + s(88 * sc), y);
  g.fillStyle(C.roofTile, 0.9);
  for (let i = -4; i <= 4; i++) {
    g.fillRect(x + i * s(19 * sc) - s(8), y - s(60 * sc), s(17 * sc), s(10 * sc));
  }
  g.fillStyle(C.pillar, 0.94);
  g.fillRect(x - s(74 * sc), y, s(20 * sc), s(88 * sc));
  g.fillRect(x + s(54 * sc), y, s(20 * sc), s(88 * sc));
  g.fillStyle(C.gold, 0.88);
  g.fillCircle(x, y + s(24 * sc), s(15 * sc));
  g.fillStyle(0x201028, 0.65);
  g.fillRect(x - s(52 * sc), y + s(12 * sc), s(104 * sc), s(78 * sc));
  g.lineStyle(s(3), C.gold, 0.55);
  g.strokeRect(x - s(52 * sc), y + s(12 * sc), s(104 * sc), s(78 * sc));
}

function drawPillar(g, x, y, h) {
  g.fillStyle(C.pillar, 0.94);
  g.fillRect(x - s(10), y, s(20), h);
  g.fillStyle(C.gold, 0.6);
  g.fillRect(x - s(12), y, s(24), s(8));
  g.fillRect(x - s(12), y + h - s(8), s(24), s(8));
}

function drawPalaceFloor(g, x, y, w, h) {
  g.fillStyle(C.palaceFloor, 0.94);
  g.fillRect(x, y, w, h);
  g.lineStyle(1, C.gold, 0.25);
  for (let i = 0; i < 8; i++) {
    g.strokeRect(x + i * (w / 8), y, w / 8, h);
  }
}

function drawWillow(g, x, y) {
  g.fillStyle(0x504030, 0.92);
  g.fillRect(x - s(6), y, s(12), s(58));
  for (let i = 0; i < 9; i++) {
    const ox = (i - 4) * s(10);
    g.fillStyle(0x68a858, 0.5);
    g.fillEllipse(x + ox, y + s(14 + i * 5), s(8), s(34));
    g.fillStyle(0x88c878, 0.3);
    g.fillEllipse(x + ox + s(2), y + s(20 + i * 5), s(6), s(26));
  }
}

function drawWatchtower(g, x, y) {
  g.fillStyle(C.wall, 0.94);
  g.fillRect(x - s(30), y, s(60), s(78));
  g.fillStyle(C.roof, 0.96);
  g.fillTriangle(x - s(38), y, x, y - s(42), x + s(38), y);
  g.lineStyle(s(2), C.gold, 0.55);
  g.strokeTriangle(x - s(38), y, x, y - s(42), x + s(38), y);
  g.fillStyle(C.pillar, 0.78);
  g.fillRect(x - s(12), y + s(24), s(24), s(38));
  g.fillStyle(C.gold, 0.6);
  g.fillRect(x - s(24), y + s(64), s(48), s(8));
  g.lineStyle(s(2), 0x604838, 0.8);
  g.beginPath();
  g.moveTo(x, y - s(42));
  g.lineTo(x, y - s(68));
  g.strokePath();
  g.fillStyle(C.lantern, 0.88);
  g.fillTriangle(x, y - s(68), x + s(22), y - s(60), x, y - s(54));
}
