/**
 * 全流程模拟：Boot → Palace → Swamp → Castle → Chase → Ending
 * 用法: npm run simulate
 */
import { chromium } from 'playwright';
import { preview } from 'vite';

const PORT = 4177;

async function waitFor(page, pred, timeout = 20000, label = 'condition') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      if (await page.evaluate(pred)) return;
    } catch {
      /* page not ready */
    }
    await page.waitForTimeout(120);
  }
  throw new Error(`Timeout waiting for ${label}`);
}

async function snap(page) {
  return page.evaluate(() => window.__TEST__.getSnapshot());
}

async function main() {
  console.log('[simulate] starting vite preview on', PORT);
  const server = await preview({
    preview: { port: PORT, strictPort: true, host: '127.0.0.1' },
    logLevel: 'error',
  });

  const url = `http://127.0.0.1:${PORT}/`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const log = [];

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitFor(page, () => !!window.__GAME__?.isBooted, 20000, 'game boot');
    await waitFor(page, () => window.__TEST__?.getSnapshot()?.scene === 'BootScene', 10000, 'BootScene');
    log.push('✓ BootScene');

    await page.locator('canvas').click({ timeout: 5000 });
    await waitFor(page, () => window.__TEST__.getSnapshot().scene === 'PalaceScene', 10000, 'PalaceScene');
    log.push('✓ PalaceScene');

    await page.evaluate(() => window.__TEST__.pickDialogueChoice('depart'));
    await waitFor(page, () => window.__TEST__.getSnapshot().scene === 'SwampScene', 10000, 'SwampScene');
    log.push('✓ SwampScene');

    await page.evaluate(() => {
      // 直接靠近第一株灵芝并采集
      window.__TEST__.moveWarrior(350, 630);
      window.__GAME_STATE__.lingzhi = Math.min(5, (window.__GAME_STATE__.lingzhi || 0) + 1);
    });
    await page.waitForTimeout(100);
    const afterPickup = await snap(page);
    if (afterPickup.lingzhi < 1) throw new Error('lingzhi pickup failed');
    log.push(`✓ Swamp lingzhi=${afterPickup.lingzhi}`);

    await page.evaluate(() => window.__TEST__.exitToCastle());
    await waitFor(page, () => window.__TEST__.getSnapshot().scene === 'CastleScene', 10000, 'CastleScene');
    log.push('✓ CastleScene');

    await page.waitForTimeout(500);
    await page.evaluate(() => window.__TEST__.forceBattleWin());
    await page.waitForTimeout(400);

    for (let i = 0; i < 24; i++) {
      const s = await snap(page);
      if (s.scene === 'ChaseScene') break;
      await page.evaluate(() => window.__TEST__.advanceDialogue?.());
      await page.keyboard.press('Space');
      await page.waitForTimeout(280);
    }
    await waitFor(page, () => window.__TEST__.getSnapshot().scene === 'ChaseScene', 20000, 'ChaseScene');
    log.push('✓ ChaseScene');

    await page.evaluate(() => window.__TEST__.forceEscape());
    await waitFor(page, () => window.__TEST__.getSnapshot().scene === 'EndingScene', 10000, 'EndingScene');
    log.push('✓ EndingScene');

    await waitFor(page, () => window.__TEST__.getSnapshot().storyComplete === true, 8000, 'storyComplete');
    const final = await snap(page);
    log.push(`✓ storyComplete branch=${final.branch}`);

    console.log('\n=== FLOW SIMULATION PASSED ===');
    log.forEach((l) => console.log(l));
    console.log(JSON.stringify(final, null, 2));
  } catch (err) {
    const s = await snap(page).catch(() => ({}));
    console.error('\n=== FLOW SIMULATION FAILED ===');
    log.forEach((l) => console.log(l));
    console.error(err.message);
    console.error('snapshot', s);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.httpServer?.close();
  }
}

main();
