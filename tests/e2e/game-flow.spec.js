import { test, expect } from '@playwright/test';
import { advanceThroughDialogue, pickDialogueChoiceAndFinish } from './helpers/gameControls.js';

async function waitForGame(page) {
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

async function getSnapshot(page) {
  return page.evaluate(() => window.__TEST__.getSnapshot());
}

async function getGameSize(page) {
  return page.evaluate(() => ({
    w: window.__GAME__.config.width,
    h: window.__GAME__.config.height,
  }));
}

test.describe('青蛙公主 — 核心流程', () => {
  test('完整故事流程：菜单 → 王宫 → 沼泽 → 城堡 → 公主 → 结局', async ({ page }) => {
    test.setTimeout(240000);
    await waitForGame(page);

    let snap = await getSnapshot(page);
    expect(snap.scene).toBe('MenuScene');

    await page.locator('canvas').click();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GAME__.scene.getScenes(true)[0]?.scene?.key === 'PalaceScene', null, { timeout: 30000 });
    snap = await getSnapshot(page);
    expect(snap.scene).toBe('PalaceScene');
    expect(snap.phase).toBe('palace');

    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 8000 });
    await advanceThroughDialogue(page);
    await page.waitForFunction(() => window.__GAME__.scene.getScenes(true)[0]?.scene?.key === 'SwampScene', null, { timeout: 15000 });
    snap = await getSnapshot(page);
    expect(snap.scene).toBe('SwampScene');
    expect(snap.flags.acceptedBounty).toBe(true);
    expect(snap.flags.warriorIsToad).toBe(true);

    const size = await getGameSize(page);
    await page.evaluate(({ w, h }) => {
      window.__TEST__.moveWarrior(w * 0.55, h * 0.52);
    }, size);
    await page.keyboard.press('e');
    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 5000 });
    await pickDialogueChoiceAndFinish(page, 0);
    snap = await getSnapshot(page);
    expect(snap.flags.tookFrog).toBe(true);
    expect(snap.affection).toBeGreaterThan(50);

    await page.evaluate(({ w, h }) => {
      window.__TEST__.moveWarrior(w * 0.9, h * 0.55);
      window.__TEST__.exitToCastle();
    }, size);
    await page.waitForFunction(() => window.__GAME__.scene.getScenes(true)[0]?.scene?.key === 'CastleScene', null, { timeout: 30000 });
    snap = await getSnapshot(page);
    expect(snap.scene).toBe('CastleScene');

    await page.evaluate(() => window.__TEST__.forceBattleWin());
    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 10000 });
    await advanceThroughDialogue(page);
    await page.waitForFunction(() => window.__GAME__.scene.getScenes(true)[0]?.scene?.key === 'PrincessScene', null, { timeout: 25000 });
    snap = await getSnapshot(page);
    expect(snap.scene).toBe('PrincessScene');
    expect(snap.chapter).toBe(2);
    expect(snap.flags.kissedPrincess).toBe(true);

    await page.waitForTimeout(2500);

    await page.evaluate(() => window.__TEST__.forceEscape());
    await page.waitForFunction(() => window.__GAME_STATE__.storyComplete, null, { timeout: 10000 });
    snap = await getSnapshot(page);
    expect(snap.storyComplete).toBe(true);
    expect(snap.warriorEscaped).toBe(true);
  });

  test('菜单显示中文标题', async ({ page }) => {
    await waitForGame(page);
    const title = await page.evaluate(() => {
      const scene = window.__GAME__.scene.getScene('MenuScene');
      return scene?.children?.list?.find((c) => c.type === 'Text' && c.text === '青蛙公主')?.text;
    });
    expect(title).toBe('青蛙公主');
  });
});
