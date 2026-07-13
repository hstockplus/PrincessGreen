import { test, expect } from '@playwright/test';
import {
  waitForGame,
  focusCanvas,
  getSnapshot,
  clickGamePoint,
  keyboardMoveTo,
  keyboardHoldDirection,
  advanceThroughDialogue,
  pressInteract,
  clickNpcInteract,
  pickDialogueChoiceAndFinish,
  waitForScene,
} from './helpers/gameControls.js';

test.describe('第一章 — 键盘鼠标模拟', () => {
  test('完整第一章：勇士救公主 → 亲吻反转 → 进入第二幕', async ({ page }) => {
    test.setTimeout(240000);

    await waitForGame(page);
    await focusCanvas(page);

    let snap = await getSnapshot(page);
    expect(snap.scene).toBe('MenuScene');

    const menuW = await page.evaluate(() => window.__GAME__.config.width);
    const menuH = await page.evaluate(() => window.__GAME__.config.height);
    await clickGamePoint(page, menuW / 2, menuH * 0.64);
    await waitForScene(page, 'PalaceScene');
    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 8000 });
    await advanceThroughDialogue(page);
    await waitForScene(page, 'SwampScene');

    snap = await getSnapshot(page);
    expect(snap.chapter).toBe(1);

    expect(await keyboardMoveTo(page, 0.55, 0.52, 0.09, 120000)).toBe(true);

    await clickNpcInteract(page, 0.55, 0.52);
    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 5000 });
    await pickDialogueChoiceAndFinish(page, 0);
    snap = await getSnapshot(page);
    expect(snap.flags.tookFrog).toBe(true);

    await keyboardHoldDirection(
      page,
      'd',
      () => window.__GAME__.scene.getScenes(true)[0]?.scene?.key === 'CastleScene',
      120000
    );
    await waitForScene(page, 'CastleScene', 30000);

    snap = await getSnapshot(page);
    expect(snap.scene).toBe('CastleScene');
    await page.evaluate(() => window.__TEST__.forceBattleWin());
    await page.waitForFunction(() => window.__GAME_STATE__.dragonDefeated, null, { timeout: 10000 });

    expect(await keyboardMoveTo(page, 0.78, 0.58, 0.13)).toBe(true);
    const castleSize = await page.evaluate(() => ({
      w: window.__GAME__.config.width,
      h: window.__GAME__.config.height,
    }));
    await page.evaluate(({ w, h }) => {
      window.__TEST__.moveWarrior(w * 0.78, h * 0.58);
    }, castleSize);

    await pressInteract(page);
    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 5000 });
    await pickDialogueChoiceAndFinish(page, 0);
    await waitForScene(page, 'PrincessScene', 25000);

    snap = await getSnapshot(page);
    expect(snap.chapter).toBe(2);
    expect(snap.flags.kissedPrincess).toBe(true);
    expect(snap.scene).toBe('PrincessScene');
  });
});
