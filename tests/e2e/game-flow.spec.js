import { test, expect } from '@playwright/test';

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
  test('完整故事流程：菜单 → 沼泽 → 城堡 → 公主 → 结局', async ({ page }) => {
    await waitForGame(page);

    let snap = await getSnapshot(page);
    expect(snap.scene).toBe('MenuScene');

    await page.locator('canvas').click();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__GAME__.scene.getScenes(true)[0]?.scene?.key === 'SwampScene', null, { timeout: 30000 });
    snap = await getSnapshot(page);
    expect(snap.scene).toBe('SwampScene');

    const size = await getGameSize(page);
    await page.evaluate(({ w, h }) => {
      window.__TEST__.moveWarrior(w * 0.55, h * 0.52);
    }, size);
    await page.keyboard.press('e');
    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 5000 });
    await page.evaluate(() => window.__TEST__.pickDialogueChoice(0));
    await page.waitForFunction(() => !window.__GAME_STATE__.dialogueActive, null, { timeout: 5000 });
    snap = await getSnapshot(page);
    expect(snap.flags.tookFrog).toBe(true);
    expect(snap.affection).toBeGreaterThan(50);

    await page.evaluate(({ w, h }) => {
      window.__TEST__.moveWarrior(w * 0.9, h * 0.55);
    }, size);
    await page.waitForFunction(() => window.__GAME__.scene.getScenes(true)[0]?.scene?.key === 'CastleScene', null, { timeout: 15000 });
    snap = await getSnapshot(page);
    expect(snap.scene).toBe('CastleScene');

    await page.evaluate(() => window.__TEST__.forceQTESuccess());
    await page.waitForFunction(() => window.__GAME_STATE__.dragonDefeated, null, { timeout: 10000 });

    await page.evaluate(({ w, h }) => {
      window.__TEST__.moveWarrior(w * 0.78, h * 0.58);
    }, size);
    await page.keyboard.press('e');
    await page.waitForFunction(() => window.__GAME_STATE__.dialogueActive, null, { timeout: 5000 });
    await page.evaluate(() => window.__TEST__.pickDialogueChoice(0));
    await page.waitForFunction(() => window.__GAME__.scene.getScenes(true)[0]?.scene?.key === 'PrincessScene', null, { timeout: 20000 });
    snap = await getSnapshot(page);
    expect(snap.scene).toBe('PrincessScene');
    expect(snap.chapter).toBe(2);

    await page.waitForTimeout(2500);

    const size2 = await getGameSize(page);
    await page.evaluate(({ w, h }) => {
      window.__TEST__.moveWarrior(w * 0.68, h * 0.68);
    }, size2);
    await page.keyboard.press('j');
    await page.waitForFunction(() => window.__GAME_STATE__.storyComplete, null, { timeout: 10000 });
    snap = await getSnapshot(page);
    expect(snap.storyComplete).toBe(true);
    expect(snap.warriorDefeated).toBe(true);
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
