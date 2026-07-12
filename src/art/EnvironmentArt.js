import Phaser from 'phaser';
import { GAME } from '../core/Constants.js';

const C = {
  ink: 0x141010,
  mist: 0x8aaa90,
  mistLight: 0xc8d8c8,
  waterDeep: 0x1a3040,
  waterLight: 0x3a6070,
  waterShine: 0x5a90a0,
  grassDark: 0x1a3828,
  grassMid: 0x2a5838,
  grassLight: 0x4a7848,
  path: 0x7a6a50,
  pathLight: 0x9a8a70,
  roof: 0x5a2818,
  roofTile: 0x7a3820,
  pillar: 0x8b1818,
  wall: 0xc8a878,
  gold: 0xd4a830,
  bamboo: 0x2a5a2a,
  lotus: 0xe888a8,
  night: 0x080c18,
  nightMid: 0x141c30,
  moon: 0xf0e8c8,
  mountainFar: 0x2a3848,
  mountainMid: 0x1e3040,
  mountainNear: 0x142830,
  plum: 0xd87090,
  plumBranch: 0x3a2820,
  crane: 0xf0ece8,
  petal: 0xe8a0b0,
  palacePurple: 0x1a0828,
  palaceFloor: 0x3a3040,
};

function s(v) {
  return v * (GAME.WIDTH / 960);
}

function drawInkSky(g, topColor, bottomColor, height = GAME.HEIGHT) {
  const steps = 32;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const r = Phaser.Math.Linear((topColor >> 16) & 0xff, (bottomColor >> 16) & 0xff, t);
    const gr = Phaser.Math.Linear((topColor >> 8) & 0xff, (bottomColor >> 8) & 0xff, t);
    const b = Phaser.Math.Linear(topColor & 0xff, bottomColor & 0xff, t);
    g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b), 1);
    g.fillRect(0, (height / steps) * i, GAME.WIDTH, height / steps + 1);
  }
}

function drawInkMountains(g, baseY, layers) {
  layers.forEach(({ color, alpha, peaks }) => {
    g.fillStyle(color, alpha);
    peaks.forEach(([x1, y1, x2, y2, x3, y3]) => {
      g.fillTriangle(s(x1), baseY * y1, s(x2), baseY * y2, s(x3), baseY * y3);
    });
  });
}

function drawMistBands(g, count = 4, baseY = 0.5) {
  for (let i = 0; i < count; i++) {
    const alpha = 0.06 + i * 0.03;
    g.fillStyle(C.mistLight, alpha);
    g.fillEllipse(
      GAME.WIDTH * (0.3 + i * 0.15),
      GAME.HEIGHT * (baseY + i * 0.06),
      GAME.WIDTH * (0.7 + i * 0.05),
      s(30 + i * 8),
    );
  }
}

function drawPlumBranch(g, x, y, scale = 1) {
  const sc = scale;
  g.lineStyle(s(2 * sc), C.plumBranch, 0.8);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x - s(30 * sc), y - s(20 * sc));
  g.lineTo(x - s(50 * sc), y - s(10 * sc));
  g.strokePath();
  g.lineStyle(s(2 * sc), C.plumBranch, 0.6);
  g.beginPath();
  g.moveTo(x - s(15 * sc), y - s(8 * sc));
  g.lineTo(x - s(35 * sc), y - s(35 * sc));
  g.strokePath();
  for (let i = 0; i < 6; i++) {
    const px = x - s((10 + i * 8) * sc);
    const py = y - s((5 + i * 6) * sc);
    g.fillStyle(C.plum, 0.85);
    g.fillCircle(px, py, s(3 * sc));
    g.fillStyle(0xffb0c0, 0.5);
    g.fillCircle(px - s(1), py - s(1), s(1.5 * sc));
  }
}

function drawCrane(g, x, y, scale = 1, flip = false) {
  const dir = flip ? -1 : 1;
  g.fillStyle(C.crane, 0.75);
  g.fillEllipse(x, y, s(18 * scale), s(6 * scale));
  g.fillTriangle(x + dir * s(12 * scale), y, x + dir * s(28 * scale), y - s(4 * scale), x + dir * s(28 * scale), y + s(4 * scale));
  g.lineStyle(s(1.5), C.crane, 0.6);
  g.beginPath();
  g.moveTo(x - dir * s(4 * scale), y - s(2 * scale));
  g.lineTo(x - dir * s(4 * scale), y - s(14 * scale));
  g.lineTo(x - dir * s(10 * scale), y - s(18 * scale));
  g.strokePath();
}

function drawFallingPetals(g, count = 12) {
  for (let i = 0; i < count; i++) {
    const px = GAME.WIDTH * (0.05 + (i * 0.083) % 1);
    const py = GAME.HEIGHT * (0.08 + (i * 0.13) % 0.7);
    g.fillStyle(C.petal, 0.35 + (i % 3) * 0.1);
    g.fillEllipse(px, py, s(3), s(5));
    g.fillStyle(0xffc0d0, 0.2);
    g.fillEllipse(px + s(1), py - s(1), s(2), s(3));
  }
}

function drawWaterRipples(g, cx, cy, rx, ry) {
  for (let i = 0; i < 4; i++) {
    g.lineStyle(1, C.waterShine, 0.15 - i * 0.03);
    g.strokeEllipse(cx, cy + i * s(6), rx * (0.6 + i * 0.1), ry * (0.3 + i * 0.05));
  }
}

/** 水墨唯美主菜单 — 月夜远山、亭台、飞鹤 */
export function drawMenuBackdrop(scene) {
  const g = scene.add.graphics().setDepth(0);
  drawInkSky(g, C.night, C.nightMid);

  drawInkMountains(g, GAME.HEIGHT, [
    {
      color: C.mountainFar,
      alpha: 0.35,
      peaks: [[0, 0.65, 200, 0.3, 400, 0.65], [300, 0.68, 500, 0.22, 700, 0.68]],
    },
    {
      color: C.mountainMid,
      alpha: 0.55,
      peaks: [[80, 0.58, 280, 0.2, 480, 0.58], [320, 0.6, 560, 0.15, 820, 0.6]],
    },
    {
      color: C.mountainNear,
      alpha: 0.75,
      peaks: [[0, 0.72, 180, 0.45, 360, 0.72], [500, 0.7, 700, 0.4, 960, 0.7]],
    },
  ]);

  // 明月
  g.fillStyle(C.moon, 0.92);
  g.fillCircle(GAME.WIDTH * 0.78, GAME.HEIGHT * 0.16, s(52));
  g.fillStyle(C.night, 0.25);
  g.fillCircle(GAME.WIDTH * 0.78 + s(14), GAME.HEIGHT * 0.16 - s(10), s(42));
  g.fillStyle(C.moon, 0.15);
  g.fillCircle(GAME.WIDTH * 0.78, GAME.HEIGHT * 0.16, s(70));

  drawPavilion(g, GAME.WIDTH * 0.35, GAME.HEIGHT * 0.64, 1.3);
  drawPlumBranch(g, GAME.WIDTH * 0.12, GAME.HEIGHT * 0.35, 1.1);
  drawCrane(g, GAME.WIDTH * 0.55, GAME.HEIGHT * 0.22, 0.9);
  drawCrane(g, GAME.WIDTH * 0.62, GAME.HEIGHT * 0.28, 0.7, true);
  drawFallingPetals(g, 10);
  drawMistBands(g, 4, 0.55);

  // 水面倒影
  g.fillStyle(C.waterDeep, 0.3);
  g.fillRect(0, GAME.HEIGHT * 0.72, GAME.WIDTH, GAME.HEIGHT * 0.28);
  g.fillStyle(C.moon, 0.08);
  g.fillEllipse(GAME.WIDTH * 0.78, GAME.HEIGHT * 0.85, s(40), s(8));
}

/** 绝望沼泽 — 水墨竹林、荷塘、断桥、烟雨 */
export function drawSwampEnvironment(scene) {
  const g = scene.add.graphics().setDepth(0);
  drawInkSky(g, 0x0a1810, C.grassMid, GAME.HEIGHT * 0.55);

  drawInkMountains(g, GAME.HEIGHT, [
    { color: 0x1a3028, alpha: 0.4, peaks: [[0, 0.4, 300, 0.2, 600, 0.4]] },
    { color: 0x142820, alpha: 0.6, peaks: [[400, 0.42, 650, 0.18, 960, 0.42]] },
  ]);

  g.fillGradientStyle(C.grassDark, C.grassDark, C.grassLight, C.grassMid, 0.9);
  g.fillRect(0, GAME.HEIGHT * 0.35, GAME.WIDTH, GAME.HEIGHT * 0.65);

  // 荷塘
  g.fillStyle(C.waterDeep, 0.8);
  g.fillEllipse(GAME.WIDTH * 0.5, GAME.HEIGHT * 0.6, GAME.WIDTH * 0.78, GAME.HEIGHT * 0.38);
  g.fillStyle(C.waterLight, 0.35);
  g.fillEllipse(GAME.WIDTH * 0.48, GAME.HEIGHT * 0.58, GAME.WIDTH * 0.55, GAME.HEIGHT * 0.22);
  drawWaterRipples(g, GAME.WIDTH * 0.5, GAME.HEIGHT * 0.6, GAME.WIDTH * 0.3, GAME.HEIGHT * 0.1);

  drawStonePath(g, GAME.WIDTH * 0.06, GAME.HEIGHT * 0.54, GAME.WIDTH * 0.9, GAME.HEIGHT * 0.6);

  // 莲叶荷花
  for (let i = 0; i < 10; i++) {
    const lx = GAME.WIDTH * (0.2 + i * 0.065);
    const ly = GAME.HEIGHT * (0.52 + (i % 4) * 0.035);
    g.fillStyle(0x1a5030, 0.85);
    g.fillEllipse(lx, ly, s(22), s(14));
    g.fillStyle(0x2a6840, 0.5);
    g.fillEllipse(lx - s(3), ly - s(2), s(14), s(8));
    if (i % 2 === 0) {
      g.fillStyle(C.lotus, 0.9);
      g.fillCircle(lx, ly - s(8), s(5));
      g.fillStyle(0xffb0c8, 0.6);
      g.fillCircle(lx, ly - s(10), s(3));
    }
  }

  drawBamboo(g, GAME.WIDTH * 0.06, GAME.HEIGHT * 0.38, 6);
  drawBamboo(g, GAME.WIDTH * 0.16, GAME.HEIGHT * 0.34, 5);
  drawBamboo(g, GAME.WIDTH * 0.84, GAME.HEIGHT * 0.36, 7);
  drawBamboo(g, GAME.WIDTH * 0.92, GAME.HEIGHT * 0.4, 4);

  drawBridge(g, GAME.WIDTH * 0.36, GAME.HEIGHT * 0.56, GAME.WIDTH * 0.24);
  drawSwampHut(g, GAME.WIDTH * 0.72, GAME.HEIGHT * 0.5);
  drawPavilion(g, GAME.WIDTH * 0.88, GAME.HEIGHT * 0.44, 0.95);

  drawPlumBranch(g, GAME.WIDTH * 0.04, GAME.HEIGHT * 0.28, 0.8);
  drawFallingPetals(g, 8);
  drawMistBands(g, 5, 0.38);
  g.fillStyle(C.mist, 0.15);
  g.fillEllipse(GAME.WIDTH * 0.5, GAME.HEIGHT * 0.48, GAME.WIDTH * 0.95, s(50));
}

/** 恶龙城堡 — 紫霄殿、金龙纹、宫灯 */
export function drawCastleEnvironment(scene) {
  const g = scene.add.graphics().setDepth(0);
  drawInkSky(g, C.palacePurple, 0x2a1040);

  drawInkMountains(g, GAME.HEIGHT, [
    { color: 0x1a0830, alpha: 0.5, peaks: [[0, 0.35, 400, 0.15, 800, 0.35]] },
  ]);

  g.fillStyle(0x1a1028, 0.85);
  g.fillRect(GAME.WIDTH * 0.04, GAME.HEIGHT * 0.22, GAME.WIDTH * 0.92, GAME.HEIGHT * 0.58);

  drawCastleGate(g, GAME.WIDTH * 0.5, GAME.HEIGHT * 0.36, 1.5);

  // 宫灯
  for (let i = 0; i < 4; i++) {
    const lx = GAME.WIDTH * (0.15 + i * 0.22);
    drawLantern(g, lx, GAME.HEIGHT * 0.26);
  }

  for (let i = 0; i < 6; i++) {
    const px = GAME.WIDTH * (0.1 + i * 0.14);
    drawPillar(g, px, GAME.HEIGHT * 0.28, GAME.HEIGHT * 0.5);
  }

  // 金龙纹饰
  g.lineStyle(s(2), C.gold, 0.3);
  for (let i = 0; i < 3; i++) {
    const y = GAME.HEIGHT * (0.32 + i * 0.12);
    g.beginPath();
    g.moveTo(GAME.WIDTH * 0.08, y);
    for (let x = 0; x < 8; x++) {
      g.lineTo(GAME.WIDTH * (0.08 + x * 0.11), y + (x % 2 ? s(6) : -s(6)));
    }
    g.strokePath();
  }

  g.lineStyle(s(4), C.gold, 0.5);
  g.beginPath();
  g.moveTo(GAME.WIDTH * 0.05, GAME.HEIGHT * 0.26);
  g.lineTo(GAME.WIDTH * 0.95, GAME.HEIGHT * 0.26);
  g.strokePath();

  drawPalaceFloor(g, GAME.WIDTH * 0.05, GAME.HEIGHT * 0.66, GAME.WIDTH * 0.9, GAME.HEIGHT * 0.14);

  // 王座
  g.fillStyle(C.gold, 0.25);
  g.fillRect(GAME.WIDTH * 0.66, GAME.HEIGHT * 0.5, GAME.WIDTH * 0.24, GAME.HEIGHT * 0.1);
  g.fillStyle(C.pillar, 0.85);
  g.fillRect(GAME.WIDTH * 0.7, GAME.HEIGHT * 0.46, GAME.WIDTH * 0.16, GAME.HEIGHT * 0.08);
  g.fillStyle(C.gold, 0.6);
  g.fillTriangle(
    GAME.WIDTH * 0.68, GAME.HEIGHT * 0.46,
    GAME.WIDTH * 0.78, GAME.HEIGHT * 0.4,
    GAME.WIDTH * 0.88, GAME.HEIGHT * 0.46,
  );

  drawMistBands(g, 2, 0.2);
}

/** 公主复仇 — 边关古道、垂柳、烽火台、落英 */
export function drawPrincessEnvironment(scene) {
  const g = scene.add.graphics().setDepth(0);
  drawInkSky(g, 0x081810, 0x2a4838);

  drawInkMountains(g, GAME.HEIGHT, [
    { color: 0x142820, alpha: 0.5, peaks: [[0, 0.48, 250, 0.22, 500, 0.48], [450, 0.5, 700, 0.2, 960, 0.5]] },
    { color: 0x0a1810, alpha: 0.7, peaks: [[100, 0.55, 400, 0.3, 700, 0.55]] },
  ]);

  g.fillGradientStyle(0x1a3828, 0x1a3828, 0x3a6848, 0x4a7858, 1);
  g.fillRect(0, GAME.HEIGHT * 0.45, GAME.WIDTH, GAME.HEIGHT * 0.55);

  drawStonePath(g, GAME.WIDTH * 0.04, GAME.HEIGHT * 0.76, GAME.WIDTH * 0.96, GAME.HEIGHT * 0.8);

  drawWillow(g, GAME.WIDTH * 0.1, GAME.HEIGHT * 0.52);
  drawWillow(g, GAME.WIDTH * 0.9, GAME.HEIGHT * 0.5);
  drawPlumBranch(g, GAME.WIDTH * 0.78, GAME.HEIGHT * 0.3, 0.9);

  drawWatchtower(g, GAME.WIDTH * 0.76, GAME.HEIGHT * 0.4);
  drawCrane(g, GAME.WIDTH * 0.4, GAME.HEIGHT * 0.18, 0.8);
  drawFallingPetals(g, 14);

  for (let i = 0; i < 14; i++) {
    const gx = GAME.WIDTH * (0.08 + i * 0.065);
    g.fillStyle(0x3a7a48, 0.65);
    g.fillTriangle(gx, GAME.HEIGHT * 0.78, gx - s(5), GAME.HEIGHT * 0.74, gx + s(5), GAME.HEIGHT * 0.74);
  }

  drawMistBands(g, 3, 0.42);
}

function drawLantern(g, x, y) {
  g.lineStyle(s(1.5), C.gold, 0.7);
  g.beginPath();
  g.moveTo(x, y - s(15));
  g.lineTo(x, y);
  g.strokePath();
  g.fillStyle(0xc02020, 0.85);
  g.fillEllipse(x, y + s(8), s(10), s(14));
  g.fillStyle(C.gold, 0.5);
  g.fillRect(x - s(6), y + s(20), s(12), s(3));
  g.fillStyle(0xffa040, 0.2);
  g.fillCircle(x, y + s(8), s(18));
}

function drawStonePath(g, x1, y, x2, y2) {
  g.fillStyle(C.path, 0.8);
  g.fillRect(x1, y - s(10), x2 - x1, s(20));
  for (let x = x1; x < x2; x += s(22)) {
    g.fillStyle(C.pathLight, 0.45);
    g.fillRect(x + s(2), y - s(7), s(16), s(14));
    g.lineStyle(1, C.ink, 0.12);
    g.strokeRect(x + s(2), y - s(7), s(16), s(14));
  }
}

function drawBamboo(g, x, baseY, count) {
  for (let i = 0; i < count; i++) {
    const bx = x + i * s(11);
    const h = s(90 + i * 18);
    g.fillStyle(C.bamboo, 0.85);
    g.fillRect(bx, baseY - h, s(5), h);
    g.fillStyle(0x1a4020, 0.7);
    for (let j = 1; j < 5; j++) {
      g.fillRect(bx - s(1), baseY - h * (j / 5), s(7), s(2));
    }
    g.fillStyle(C.bamboo, 0.65);
    g.fillTriangle(bx - s(10), baseY - h, bx, baseY - h - s(14), bx + s(10), baseY - h);
    g.fillTriangle(bx - s(6), baseY - h - s(8), bx + s(2), baseY - h - s(18), bx + s(10), baseY - h - s(6));
  }
}

function drawBridge(g, x, y, w) {
  g.fillStyle(0x4a3020, 0.85);
  g.fillRect(x, y, w, s(10));
  g.lineStyle(s(1), C.ink, 0.2);
  for (let i = 0; i < 6; i++) {
    g.strokeRect(x + i * (w / 6), y, w / 6, s(10));
  }
  for (let i = 0; i < 5; i++) {
    g.fillStyle(0x3a2018, 0.9);
    g.fillRect(x + i * (w / 5), y + s(10), s(5), s(22));
  }
  // 栏杆
  g.lineStyle(s(2), 0x5a4030, 0.7);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - s(12));
  g.lineTo(x + w, y - s(12));
  g.lineTo(x + w, y);
  g.strokePath();
}

function drawSwampHut(g, x, y) {
  g.fillStyle(C.wall, 0.88);
  g.fillRect(x - s(32), y - s(42), s(64), s(42));
  g.fillStyle(C.roofTile, 0.92);
  g.fillTriangle(x - s(40), y - s(42), x, y - s(72), x + s(40), y - s(42));
  g.lineStyle(s(2), C.gold, 0.4);
  g.strokeTriangle(x - s(40), y - s(42), x, y - s(72), x + s(40), y - s(42));
  g.fillStyle(C.pillar, 0.75);
  g.fillRect(x - s(30), y - s(40), s(6), s(38));
  g.fillRect(x + s(24), y - s(40), s(6), s(38));
  g.fillStyle(0x2a1810, 0.6);
  g.fillRect(x - s(8), y - s(20), s(16), s(20));
}

function drawPavilion(g, x, y, scale = 1) {
  const sc = scale;
  g.fillStyle(C.pillar, 0.88);
  g.fillRect(x - s(42 * sc), y - s(52 * sc), s(8 * sc), s(52 * sc));
  g.fillRect(x + s(34 * sc), y - s(52 * sc), s(8 * sc), s(52 * sc));
  g.fillRect(x - s(8 * sc), y - s(52 * sc), s(8 * sc), s(52 * sc));
  g.fillStyle(C.roof, 0.95);
  g.fillTriangle(x - s(58 * sc), y - s(52 * sc), x, y - s(90 * sc), x + s(58 * sc), y - s(52 * sc));
  g.lineStyle(s(2), C.gold, 0.65);
  g.strokeTriangle(x - s(58 * sc), y - s(52 * sc), x, y - s(90 * sc), x + s(58 * sc), y - s(52 * sc));
  g.fillStyle(C.wall, 0.45);
  g.fillRect(x - s(46 * sc), y - s(22 * sc), s(92 * sc), s(5 * sc));
  // 翘角
  g.fillStyle(C.roof, 0.8);
  g.fillTriangle(x - s(58 * sc), y - s(52 * sc), x - s(68 * sc), y - s(48 * sc), x - s(55 * sc), y - s(58 * sc));
  g.fillTriangle(x + s(58 * sc), y - s(52 * sc), x + s(68 * sc), y - s(48 * sc), x + s(55 * sc), y - s(58 * sc));
}

function drawCastleGate(g, x, y, scale) {
  const sc = scale;
  g.fillStyle(C.roof, 0.92);
  g.fillTriangle(x - s(85 * sc), y, x, y - s(65 * sc), x + s(85 * sc), y);
  g.fillStyle(C.roofTile, 0.88);
  for (let i = -4; i <= 4; i++) {
    g.fillRect(x + i * s(18 * sc) - s(8), y - s(58 * sc), s(16 * sc), s(9 * sc));
  }
  g.fillStyle(C.pillar, 0.92);
  g.fillRect(x - s(72 * sc), y, s(18 * sc), s(85 * sc));
  g.fillRect(x + s(54 * sc), y, s(18 * sc), s(85 * sc));
  g.fillStyle(C.gold, 0.85);
  g.fillCircle(x, y + s(22 * sc), s(14 * sc));
  g.fillStyle(0x1a0818, 0.7);
  g.fillRect(x - s(50 * sc), y + s(10 * sc), s(100 * sc), s(75 * sc));
  g.lineStyle(s(3), C.gold, 0.5);
  g.strokeRect(x - s(50 * sc), y + s(10 * sc), s(100 * sc), s(75 * sc));
}

function drawPillar(g, x, y, h) {
  g.fillStyle(C.pillar, 0.92);
  g.fillRect(x - s(9), y, s(18), h);
  g.fillStyle(C.gold, 0.55);
  g.fillRect(x - s(11), y, s(22), s(7));
  g.fillRect(x - s(11), y + h - s(7), s(22), s(7));
  g.lineStyle(1, C.gold, 0.3);
  g.strokeRect(x - s(9), y, s(18), h);
}

function drawPalaceFloor(g, x, y, w, h) {
  g.fillStyle(C.palaceFloor, 0.92);
  g.fillRect(x, y, w, h);
  g.lineStyle(1, C.gold, 0.22);
  for (let i = 0; i < 8; i++) {
    g.strokeRect(x + i * (w / 8), y, w / 8, h);
  }
  for (let i = 0; i < 3; i++) {
    g.lineStyle(1, C.gold, 0.15);
    g.strokeRect(x + w * 0.3, y + h * 0.2, w * 0.4, h * 0.6);
  }
}

function drawWillow(g, x, y) {
  g.fillStyle(0x3a2818, 0.9);
  g.fillRect(x - s(5), y, s(10), s(55));
  g.fillStyle(0x3a6840, 0.55);
  for (let i = 0; i < 8; i++) {
    const ox = (i - 4) * s(9);
    g.fillEllipse(x + ox, y + s(12 + i * 6), s(7), s(32));
    g.fillStyle(0x4a7850, 0.35);
    g.fillEllipse(x + ox + s(2), y + s(18 + i * 6), s(5), s(24));
    g.fillStyle(0x3a6840, 0.55);
  }
}

function drawWatchtower(g, x, y) {
  g.fillStyle(C.wall, 0.92);
  g.fillRect(x - s(28), y, s(56), s(75));
  g.fillStyle(C.roof, 0.95);
  g.fillTriangle(x - s(36), y, x, y - s(40), x + s(36), y);
  g.lineStyle(s(2), C.gold, 0.5);
  g.strokeTriangle(x - s(36), y, x, y - s(40), x + s(36), y);
  g.fillStyle(C.pillar, 0.75);
  g.fillRect(x - s(10), y + s(22), s(20), s(35));
  g.fillStyle(C.gold, 0.55);
  g.fillRect(x - s(22), y + s(60), s(44), s(7));
  // 旗帜
  g.lineStyle(s(2), 0x5a4030, 0.8);
  g.beginPath();
  g.moveTo(x, y - s(40));
  g.lineTo(x, y - s(65));
  g.strokePath();
  g.fillStyle(0xc02020, 0.85);
  g.fillTriangle(x, y - s(65), x + s(20), y - s(58), x, y - s(52));
}
