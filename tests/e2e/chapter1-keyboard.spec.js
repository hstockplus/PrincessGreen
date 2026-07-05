import { test, expect } from '@playwright/test';
import {
  waitForGame,
  focusCanvas,
  getSnapshot,
  clickGamePoint,
  keyboardMoveTo,
  keyboardHoldDirection,
  keyboardCompleteQTE,
  pressInteract,
  clickNpcInteract,
  clickDialogueChoice,
  waitForScene,
} from './helpers/gameControls.js';

test.describe('第一章 — 键盘鼠标模拟', () => {
  test('完整第一章：勇士救公主 → 亲吻反转 → 进入第二幕', async ({ page }) => {
    test.setTimeout(180000);

    await waitForGame(page);
    await focusCanvas(page);

    let snap = await getSnapshot(page);
    expect(snap.scene).toBe('MenuScene');

    const menuW = await page.evaluate(() => window.__GAME__.config.width);
    const menuH = await page.evaluate(() => window.__GAME__.config.height);
    await clickGamePoint(page, menuW / 2, menuH * 0.64);
    await waitForScene(page, 'SwampScene');

    snap = await getSnapshot(page);
    expect(snap.chapter).toBe(1);

    expect(await keyboardMoveTo(page, 0.55, 0.52, 0.09, 120000)).toBe(true);

    await clickNpcInteract(page, 0.55, 0.52);
    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 5000 });
    await clickDialogueChoice(page, 0);
    await page.waitForFunction(() => !window.__GAME_STATE__.dialogueActive, null, { timeout: 5000 });
    snap = await getSnapshot(page);
    expect(snap.flags.tookFrog).toBe(true);

    await keyboardHoldDirection(
      page,
      'd',
      () => window.__GAME__.scene.getScenes(true)[0]?.scene?.key === 'CastleScene',
      90000
    );
    await waitForScene(page, 'CastleScene', 5000);

    snap = await getSnapshot(page);
    expect(snap.scene).toBe('CastleScene');
    await keyboardCompleteQTE(page, 2);
    expect((await getSnapshot(page)).dragonDefeated).toBe(true);

    expect(await keyboardMoveTo(page, 0.78, 0.58, 0.13)).toBe(true);

    await clickNpcInteract(page, 0.78, 0.58);
    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 5000 });
    await clickDialogueChoice(page, 0);
    await waitForScene(page, 'PrincessScene', 25000);

    snap = await getSnapshot(page);
    expect(snap.chapter).toBe(2);
    expect(snap.flags.kissedPrincess).toBe(true);
    expect(snap.scene).toBe('PrincessScene');
  });
});
