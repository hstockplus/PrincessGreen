import { test, expect } from '@playwright/test';
import {
  waitForGame,
  focusCanvas,
  getSnapshot,
  clickGamePoint,
  advanceThroughDialogue,
  pressInteract,
  pickDialogueChoiceAndFinish,
  waitForScene,
} from './helpers/gameControls.js';

test.describe('城堡对话 — 触控选项', () => {
  test('击败恶龙后点击对话选项可推进剧情', async ({ page }) => {
    test.setTimeout(180000);
    await waitForGame(page);
    await focusCanvas(page);

    const size = await page.evaluate(() => ({
      w: window.__GAME__.config.width,
      h: window.__GAME__.config.height,
    }));

    await clickGamePoint(page, size.w / 2, size.h * 0.64);
    await waitForScene(page, 'PalaceScene');
    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 8000 });
    await advanceThroughDialogue(page);
    await waitForScene(page, 'SwampScene');

    await page.evaluate(({ w, h }) => {
      window.__TEST__.moveWarrior(w * 0.55, h * 0.52);
    }, size);
    await page.keyboard.press('e');
    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 5000 });
    await pickDialogueChoiceAndFinish(page, 0);

    await page.evaluate(({ w, h }) => {
      window.__TEST__.moveWarrior(w * 0.9, h * 0.55);
      window.__TEST__.exitToCastle();
    }, size);
    await waitForScene(page, 'CastleScene', 30000);

    await page.evaluate(() => window.__TEST__.forceBattleWin());
    await page.waitForFunction(() => window.__GAME_STATE__.dragonDefeated, null, { timeout: 10000 });

    await page.evaluate(({ w, h }) => {
      window.__TEST__.moveWarrior(w * 0.78, h * 0.58);
    }, size);
    await pressInteract(page);
    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 5000 });

    const choiceY = await page.evaluate(() => window.__TEST__.getDialogueChoiceY(0));
    expect(choiceY).toBeGreaterThan(0);

    const pos = await page.evaluate(({ y }) => {
      const g = window.__GAME__;
      const rect = g.canvas.getBoundingClientRect();
      return {
        x: (g.config.width * 0.5) * (rect.width / g.scale.width),
        y: y * (rect.height / g.scale.height),
      };
    }, { y: choiceY });

    await page.locator('canvas').click({ position: pos, force: true });
    await page.waitForTimeout(400);
    await advanceThroughDialogue(page);

    const snap = await getSnapshot(page);
    expect(snap.flags.kissedPrincess).toBe(true);
    await waitForScene(page, 'PrincessScene', 20000);
  });
});
