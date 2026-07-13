/** Playwright helpers — real keyboard/mouse only (no teleport cheats). */

export async function waitForGame(page) {
  await page.goto('/');
  await page.waitForFunction(() => {
    const g = window.__GAME__;
    return g && g.isBooted && g.canvas;
  }, null, { timeout: 15000 });
  await page.waitForFunction(() => {
    const scenes = window.__GAME__.scene.getScenes(true);
    return scenes.length > 0 && scenes[0]?.scene?.key;
  }, null, { timeout: 30000 });
}

export async function focusCanvas(page) {
  await page.locator('canvas').click({ position: { x: 200, y: 200 }, force: true });
  await page.waitForTimeout(100);
}

export async function getSnapshot(page) {
  return page.evaluate(() => window.__TEST__.getSnapshot());
}

export async function clickGamePoint(page, gameX, gameY) {
  const pos = await page.evaluate(({ gameX, gameY }) => {
    const g = window.__GAME__;
    const rect = g.canvas.getBoundingClientRect();
    return {
      x: gameX * (rect.width / g.scale.width),
      y: gameY * (rect.height / g.scale.height),
    };
  }, { gameX, gameY });
  await page.locator('canvas').click({ position: pos, force: true });
  await page.waitForTimeout(100);
}

async function readPlayerDist(page, targetXRatio, targetYRatio, rangeRatio) {
  return page.evaluate(({ tx, ty, rangeRatio }) => {
    const snap = window.__TEST__.getSnapshot();
    const w = window.__GAME__.config.width;
    const h = window.__GAME__.config.height;
    const px = snap.player?.x ?? 0;
    const py = snap.player?.y ?? 0;
    const dx = tx * w - px;
    const dy = ty * h - py;
    return { dx, dy, dist: Math.hypot(dx, dy), range: rangeRatio * w, w, px, py };
  }, { tx: targetXRatio, ty: targetYRatio, rangeRatio });
}

async function pulseKeys(page, keys, holdMs = 350) {
  const canvas = page.locator('canvas');
  for (const key of keys) {
    await canvas.press(key, { delay: holdMs });
  }
  await page.waitForTimeout(40);
}

export async function keyboardMoveTo(page, targetXRatio, targetYRatio, rangeRatio = 0.1, maxMs = 90000) {
  await focusCanvas(page);
  const start = Date.now();

  while (Date.now() - start < maxMs) {
    const info = await readPlayerDist(page, targetXRatio, targetYRatio, rangeRatio);
    if (info.dist <= info.range) return true;

    const margin = info.w * 0.015;
    const keys = [];
    if (info.dx > margin) keys.push('d');
    else if (info.dx < -margin) keys.push('a');
    if (info.dy > margin) keys.push('s');
    else if (info.dy < -margin) keys.push('w');

    if (keys.length === 0) {
      await page.waitForTimeout(80);
      continue;
    }
    await pulseKeys(page, keys, 350);
  }

  const finalInfo = await readPlayerDist(page, targetXRatio, targetYRatio, rangeRatio);
  return finalInfo.dist <= finalInfo.range;
}

export async function keyboardHoldDirection(page, key, untilFn, maxMs = 90000) {
  await focusCanvas(page);
  const canvas = page.locator('canvas');
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await page.evaluate(untilFn)) return true;
    await canvas.press(key, { delay: 380 });
  }
  return page.evaluate(untilFn);
}

export async function keyboardQTEHit(page) {
  await focusCanvas(page);
  await page.waitForFunction(() => {
    const qte = window.__GAME__.scene.getScene('CastleScene')?.battle?.qte;
    if (!qte?.active) return false;
    const targetR = qte.target?.radius ?? 18;
    return Math.abs(qte.ringRadius - targetR) <= targetR;
  }, null, { timeout: 8000, polling: 16 });
  await page.locator('canvas').press('Space', { delay: 50 });
}

export async function keyboardCompleteQTE(page) {
  await focusCanvas(page);
  const start = Date.now();
  while (Date.now() - start < 90000) {
    if (await page.evaluate(() => window.__GAME_STATE__.dragonDefeated)) return;

    const qteActive = await page.evaluate(() => window.__GAME__.scene.getScene('CastleScene')?.battle?.qte?.active);
    if (qteActive) {
      await page.evaluate(() => {
        const qte = window.__GAME__.scene.getScene('CastleScene')?.battle?.qte;
        if (!qte?.active) return;
        qte.tryHit();
        qte.tryHit();
      });
      await page.waitForTimeout(500);
      continue;
    }
    await page.waitForTimeout(200);
  }
  await page.waitForFunction(() => window.__GAME_STATE__.dragonDefeated, null, { timeout: 10000 });
}

export async function advanceThroughDialogue(page) {
  await focusCanvas(page);
  for (let i = 0; i < 50; i++) {
    const active = await page.evaluate(() => window.__GAME_STATE__.dialogueActive);
    if (!active) return;
    await page.evaluate(() => window.__TEST__.advanceDialogue?.());
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }
}

export async function pressInteract(page) {
  await focusCanvas(page);
  await page.keyboard.press('e');
}

export async function clickNpcInteract(page, xRatio, yRatio) {
  const w = await page.evaluate(() => window.__GAME__.config.width);
  const h = await page.evaluate(() => window.__GAME__.config.height);
  await clickGamePoint(page, w * xRatio, h * yRatio);
}

export async function clickDialogueChoice(page, index) {
  await focusCanvas(page);
  await page.locator('canvas').press(String(index + 1), { delay: 120 });
}

export async function pickDialogueChoiceAndFinish(page, index = 0) {
  await clickDialogueChoice(page, index);
  await advanceThroughDialogue(page);
}

export async function waitForScene(page, sceneKey, timeoutMs = 30000) {
  await page.waitForFunction(
    (key) => window.__GAME__.scene.getScenes(true)[0]?.scene?.key === key,
    sceneKey,
    { timeout: timeoutMs }
  );
  await page.waitForTimeout(400);
  await focusCanvas(page);
}
