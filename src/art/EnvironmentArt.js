import { GAME, PX } from '../core/Constants.js';

const C = {
  ink: 0x1a1208,
  mist: 0x7a9e6a,
  waterDeep: 0x1a3a4a,
  waterLight: 0x2a5a6a,
  grassDark: 0x2d5016,
  grassLight: 0x4a7a32,
  path: 0x8a7a60,
  pathLight: 0xa89878,
  roof: 0x6b3020,
  roofTile: 0x8b4513,
  pillar: 0x9b2222,
  wall: 0xc9a87c,
  gold: 0xc9a227,
  bamboo: 0x3a6b3a,
  lotus: 0xff88aa,
  night: 0x0a1020,
  moon: 0xf0e8c0,
  mountain: 0x2a3a4a,
};

function s(v) {
  return v * (GAME.WIDTH / 960);
}

/** Ink-wash menu backdrop with moon and mountains */
export function drawMenuBackdrop(scene) {
  const g = scene.add.graphics().setDepth(0);
  g.fillGradientStyle(C.night, C.night, 0x1a2840, 0x1a2840, 1);
  g.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

  // Mountains
  g.fillStyle(C.mountain, 0.7);
  g.fillTriangle(s(80), GAME.HEIGHT * 0.55, s(280), GAME.HEIGHT * 0.22, s(480), GAME.HEIGHT * 0.55);
  g.fillStyle(0x1e3040, 0.8);
  g.fillTriangle(s(320), GAME.HEIGHT * 0.58, s(560), GAME.HEIGHT * 0.18, s(820), GAME.HEIGHT * 0.58);

  // Moon
  g.fillStyle(C.moon, 0.95);
  g.fillCircle(GAME.WIDTH * 0.78, GAME.HEIGHT * 0.18, s(48));
  g.fillStyle(C.night, 0.3);
  g.fillCircle(GAME.WIDTH * 0.78 + s(12), GAME.HEIGHT * 0.18 - s(8), s(40));

  // Pavilion silhouette
  drawPavilion(g, GAME.WIDTH * 0.35, GAME.HEIGHT * 0.62, 1.2);

  // Mist bands
  for (let i = 0; i < 3; i++) {
    g.fillStyle(C.mist, 0.08 + i * 0.04);
    g.fillEllipse(GAME.WIDTH * 0.5, GAME.HEIGHT * (0.65 + i * 0.08), GAME.WIDTH * 0.9, s(40));
  }
}

/** Despair swamp — bamboo, lotus, wooden bridge, pavilion */
export function drawSwampEnvironment(scene) {
  const g = scene.add.graphics().setDepth(0);

  g.fillGradientStyle(C.grassDark, C.grassDark, C.grassLight, C.mist, 1);
  g.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

  // Water pool
  g.fillStyle(C.waterDeep, 0.85);
  g.fillEllipse(GAME.WIDTH * 0.5, GAME.HEIGHT * 0.58, GAME.WIDTH * 0.75, GAME.HEIGHT * 0.35);
  g.fillStyle(C.waterLight, 0.25);
  g.fillEllipse(GAME.WIDTH * 0.48, GAME.HEIGHT * 0.56, GAME.WIDTH * 0.5, GAME.HEIGHT * 0.2);

  // Stone path
  drawStonePath(g, GAME.WIDTH * 0.08, GAME.HEIGHT * 0.52, GAME.WIDTH * 0.88, GAME.HEIGHT * 0.58);

  // Lotus pads
  for (let i = 0; i < 8; i++) {
    const lx = GAME.WIDTH * (0.25 + i * 0.07);
    const ly = GAME.HEIGHT * (0.52 + (i % 3) * 0.04);
    g.fillStyle(0x2a6b3a, 0.9);
    g.fillCircle(lx, ly, s(14));
    if (i % 2 === 0) {
      g.fillStyle(C.lotus, 0.85);
      g.fillCircle(lx, ly - s(6), s(5));
    }
  }

  // Bamboo clusters
  drawBamboo(g, GAME.WIDTH * 0.08, GAME.HEIGHT * 0.35, 5);
  drawBamboo(g, GAME.WIDTH * 0.18, GAME.HEIGHT * 0.32, 4);
  drawBamboo(g, GAME.WIDTH * 0.82, GAME.HEIGHT * 0.38, 6);

  // Wooden bridge
  drawBridge(g, GAME.WIDTH * 0.38, GAME.HEIGHT * 0.54, GAME.WIDTH * 0.22);

  // Swamp hut + pavilion
  drawSwampHut(g, GAME.WIDTH * 0.72, GAME.HEIGHT * 0.48);
  drawPavilion(g, GAME.WIDTH * 0.88, GAME.HEIGHT * 0.42, 0.9);

  // Mist
  g.fillStyle(C.mist, 0.12);
  g.fillEllipse(GAME.WIDTH * 0.5, GAME.HEIGHT * 0.45, GAME.WIDTH, s(60));
}

/** Dragon castle — palace hall with red pillars and golden roof */
export function drawCastleEnvironment(scene) {
  const g = scene.add.graphics().setDepth(0);

  g.fillGradientStyle(0x1a0828, 0x1a0828, 0x2a1040, 0x3a1850, 1);
  g.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

  // Distant gate
  drawCastleGate(g, GAME.WIDTH * 0.5, GAME.HEIGHT * 0.38, 1.4);

  // Palace hall interior
  g.fillStyle(0x2a2030, 0.9);
  g.fillRect(GAME.WIDTH * 0.05, GAME.HEIGHT * 0.25, GAME.WIDTH * 0.9, GAME.HEIGHT * 0.55);

  // Pillars
  for (let i = 0; i < 6; i++) {
    const px = GAME.WIDTH * (0.12 + i * 0.14);
    drawPillar(g, px, GAME.HEIGHT * 0.3, GAME.HEIGHT * 0.48);
  }

  // Golden roof beams
  g.lineStyle(s(4), C.gold, 0.6);
  g.beginPath();
  g.moveTo(GAME.WIDTH * 0.05, GAME.HEIGHT * 0.28);
  g.lineTo(GAME.WIDTH * 0.95, GAME.HEIGHT * 0.28);
  g.strokePath();

  // Ornate floor pattern
  drawPalaceFloor(g, GAME.WIDTH * 0.05, GAME.HEIGHT * 0.68, GAME.WIDTH * 0.9, GAME.HEIGHT * 0.12);

  // Throne platform
  g.fillStyle(C.gold, 0.3);
  g.fillRect(GAME.WIDTH * 0.68, GAME.HEIGHT * 0.52, GAME.WIDTH * 0.22, GAME.HEIGHT * 0.08);
  g.fillStyle(C.pillar, 0.8);
  g.fillRect(GAME.WIDTH * 0.72, GAME.HEIGHT * 0.48, GAME.WIDTH * 0.14, GAME.HEIGHT * 0.06);
}

/** Princess revenge scene — border path, willows, watchtower */
export function drawPrincessEnvironment(scene) {
  const g = scene.add.graphics().setDepth(0);

  g.fillGradientStyle(0x0a2018, 0x1a3828, 0x2a5038, 0x3a6848, 1);
  g.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

  // Distant mountains
  g.fillStyle(0x1a3028, 0.6);
  g.fillTriangle(0, GAME.HEIGHT * 0.5, GAME.WIDTH * 0.3, GAME.HEIGHT * 0.25, GAME.WIDTH * 0.6, GAME.HEIGHT * 0.5);

  drawStonePath(g, GAME.WIDTH * 0.05, GAME.HEIGHT * 0.78, GAME.WIDTH * 0.95, GAME.HEIGHT * 0.82);

  // Willow trees
  drawWillow(g, GAME.WIDTH * 0.12, GAME.HEIGHT * 0.55);
  drawWillow(g, GAME.WIDTH * 0.88, GAME.HEIGHT * 0.52);

  // Watchtower at border
  drawWatchtower(g, GAME.WIDTH * 0.78, GAME.HEIGHT * 0.42);

  // Grass tufts
  for (let i = 0; i < 12; i++) {
    const gx = GAME.WIDTH * (0.1 + i * 0.07);
    g.fillStyle(0x3a7a40, 0.7);
    g.fillTriangle(gx, GAME.HEIGHT * 0.8, gx - s(4), GAME.HEIGHT * 0.76, gx + s(4), GAME.HEIGHT * 0.76);
  }
}

function drawStonePath(g, x1, y, x2, y2) {
  g.fillStyle(C.path, 0.85);
  g.fillRect(x1, y - s(8), x2 - x1, s(16));
  for (let x = x1; x < x2; x += s(20)) {
    g.fillStyle(C.pathLight, 0.4);
    g.fillRect(x + s(2), y - s(6), s(14), s(12));
    g.lineStyle(1, C.ink, 0.15);
    g.strokeRect(x + s(2), y - s(6), s(14), s(12));
  }
}

function drawBamboo(g, x, baseY, count) {
  for (let i = 0; i < count; i++) {
    const bx = x + i * s(10);
    const h = s(80 + i * 15);
    g.fillStyle(C.bamboo, 0.9);
    g.fillRect(bx, baseY - h, s(5), h);
    g.fillStyle(0x2a502a, 0.8);
    for (let j = 1; j < 4; j++) {
      g.fillRect(bx - s(1), baseY - h * (j / 4), s(7), s(2));
    }
    g.fillStyle(C.bamboo, 0.7);
    g.fillTriangle(bx - s(8), baseY - h, bx, baseY - h - s(12), bx + s(8), baseY - h);
  }
}

function drawBridge(g, x, y, w) {
  g.fillStyle(0x5a4030, 0.9);
  g.fillRect(x, y, w, s(8));
  for (let i = 0; i < 5; i++) {
    g.fillStyle(0x4a3020, 0.9);
    g.fillRect(x + i * (w / 5), y + s(8), s(4), s(20));
  }
}

function drawSwampHut(g, x, y) {
  g.fillStyle(C.wall, 0.9);
  g.fillRect(x - s(30), y - s(40), s(60), s(40));
  g.fillStyle(C.roofTile, 0.95);
  g.fillTriangle(x - s(38), y - s(40), x, y - s(68), x + s(38), y - s(40));
  g.fillStyle(C.pillar, 0.7);
  g.fillRect(x - s(28), y - s(38), s(6), s(36));
  g.fillRect(x + s(22), y - s(38), s(6), s(36));
}

function drawPavilion(g, x, y, scale = 1) {
  const sc = scale;
  g.fillStyle(C.pillar, 0.85);
  g.fillRect(x - s(40 * sc), y - s(50 * sc), s(8 * sc), s(50 * sc));
  g.fillRect(x + s(32 * sc), y - s(50 * sc), s(8 * sc), s(50 * sc));
  g.fillRect(x - s(8 * sc), y - s(50 * sc), s(8 * sc), s(50 * sc));
  g.fillStyle(C.roof, 0.95);
  g.fillTriangle(x - s(55 * sc), y - s(50 * sc), x, y - s(85 * sc), x + s(55 * sc), y - s(50 * sc));
  g.lineStyle(s(2), C.gold, 0.7);
  g.strokeTriangle(x - s(55 * sc), y - s(50 * sc), x, y - s(85 * sc), x + s(55 * sc), y - s(50 * sc));
  g.fillStyle(C.wall, 0.5);
  g.fillRect(x - s(44 * sc), y - s(20 * sc), s(88 * sc), s(4 * sc));
}

function drawCastleGate(g, x, y, scale) {
  const sc = scale;
  g.fillStyle(C.roof, 0.9);
  g.fillTriangle(x - s(80 * sc), y, x, y - s(60 * sc), x + s(80 * sc), y);
  g.fillStyle(C.roofTile, 0.85);
  for (let i = -3; i <= 3; i++) {
    g.fillRect(x + i * s(18 * sc) - s(8), y - s(55 * sc), s(16 * sc), s(8 * sc));
  }
  g.fillStyle(C.pillar, 0.9);
  g.fillRect(x - s(70 * sc), y, s(16 * sc), s(80 * sc));
  g.fillRect(x + s(54 * sc), y, s(16 * sc), s(80 * sc));
  g.fillStyle(C.gold, 0.8);
  g.fillCircle(x, y + s(20 * sc), s(12 * sc));
}

function drawPillar(g, x, y, h) {
  g.fillStyle(C.pillar, 0.9);
  g.fillRect(x - s(8), y, s(16), h);
  g.fillStyle(C.gold, 0.5);
  g.fillRect(x - s(10), y, s(20), s(6));
  g.fillRect(x - s(10), y + h - s(6), s(20), s(6));
}

function drawPalaceFloor(g, x, y, w, h) {
  g.fillStyle(0x4a4048, 0.9);
  g.fillRect(x, y, w, h);
  g.lineStyle(1, C.gold, 0.25);
  for (let i = 0; i < 8; i++) {
    g.strokeRect(x + i * (w / 8), y, w / 8, h);
  }
}

function drawWillow(g, x, y) {
  g.fillStyle(0x4a3020, 0.9);
  g.fillRect(x - s(4), y, s(8), s(50));
  g.fillStyle(0x3a6840, 0.6);
  for (let i = 0; i < 6; i++) {
    g.fillEllipse(x + (i - 3) * s(8), y + s(10 + i * 5), s(6), s(30));
  }
}

function drawWatchtower(g, x, y) {
  g.fillStyle(C.wall, 0.9);
  g.fillRect(x - s(25), y, s(50), s(70));
  g.fillStyle(C.roof, 0.95);
  g.fillTriangle(x - s(32), y, x, y - s(35), x + s(32), y);
  g.fillStyle(C.pillar, 0.7);
  g.fillRect(x - s(8), y + s(20), s(16), s(30));
  g.fillStyle(C.gold, 0.6);
  g.fillRect(x - s(20), y + s(55), s(40), s(6));
}
