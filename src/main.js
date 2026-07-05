import Phaser from 'phaser';
import { GameConfig } from './core/GameConfig.js';
import { eventBus, Events } from './core/EventBus.js';
import { gameState } from './core/GameState.js';
import { getGameSnapshot, getTestHandlers } from './testing/TestAPI.js';

const game = new Phaser.Game(GameConfig);

game.events.once('ready', () => {
  if (game.canvas) {
    game.canvas.setAttribute('tabindex', '1');
    game.canvas.style.outline = 'none';
  }
});

window.__GAME__ = game;
window.__GAME_STATE__ = gameState;
window.__EVENT_BUS__ = eventBus;
window.__EVENTS__ = Events;

window.render_game_to_text = () => JSON.stringify(getGameSnapshot(game));

window.__TEST__ = {
  getSnapshot: () => getGameSnapshot(game),
  pickDialogueChoice: (index) => getTestHandlers().pickDialogueChoice?.(index),
  forceQTESuccess: () => getTestHandlers().forceQTESuccess?.(),
  moveWarrior: (x, y) => getTestHandlers().moveWarrior?.(x, y),
  waitForPhase: (phase, timeoutMs = 10000) =>
    new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        if (gameState.phase === phase) return resolve(true);
        if (Date.now() - start > timeoutMs) return reject(new Error(`timeout waiting for phase ${phase}`));
        requestAnimationFrame(tick);
      };
      tick();
    }),
  waitForScene: (sceneKey, timeoutMs = 10000) =>
    new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        const snap = getGameSnapshot(game);
        if (snap.scene === sceneKey) return resolve(true);
        if (Date.now() - start > timeoutMs) return reject(new Error(`timeout waiting for scene ${sceneKey}`));
        requestAnimationFrame(tick);
      };
      tick();
    }),
};

window.advanceTime = (ms) =>
  new Promise((resolve) => {
    const start = performance.now();
    function step() {
      if (performance.now() - start >= ms) return resolve();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
