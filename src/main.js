import Phaser from 'phaser';
import { GAME, COLORS, FONT } from './utils/constants.js';
import { BootScene } from './scenes/BootScene.js';
import { PalaceScene } from './scenes/PalaceScene.js';
import { SwampScene } from './scenes/SwampScene.js';
import { CastleScene } from './scenes/CastleScene.js';
import { ChaseScene } from './scenes/ChaseScene.js';
import { EndingScene } from './scenes/EndingScene.js';
import { initAudioBridge } from './audio/AudioBridge.js';
import { eventBus, Events } from './core/EventBus.js';
import { gameState } from './utils/gameState.js';
import { getGameSnapshot, getTestHandlers } from './testing/TestAPI.js';
import { sound } from './utils/sound.js';

initAudioBridge();

const config = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.BG_DARK,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GAME.GRAVITY },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PalaceScene, SwampScene, CastleScene, ChaseScene, EndingScene],
};

const game = new Phaser.Game(config);

game.events.once('ready', () => {
  if (game.canvas) {
    game.canvas.setAttribute('tabindex', '1');
    game.canvas.style.outline = 'none';
  }

  // Mute toggle [M]
  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      sound.toggleMute();
    }
  });
});

window.__GAME__ = game;
window.__GAME_STATE__ = gameState;
window.__EVENT_BUS__ = eventBus;
window.__EVENTS__ = Events;

window.__TEST__ = {
  getSnapshot: () => getGameSnapshot(game),
  advanceDialogue: () => getTestHandlers().advanceDialogue?.(),
  pickDialogueChoice: (id) => getTestHandlers().pickDialogueChoice?.(id),
  forceBattleWin: () => getTestHandlers().forceBattleWin?.(),
  forceEscape: () => getTestHandlers().forceEscape?.(),
  exitToCastle: () => getTestHandlers().exitToCastle?.(),
  moveWarrior: (x, y) => getTestHandlers().moveWarrior?.(x, y),
  waitForScene: (sceneKey, timeoutMs = 15000) =>
    new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        const snap = getGameSnapshot(game);
        if (snap.scene === sceneKey) return resolve(true);
        if (Date.now() - start > timeoutMs) return reject(new Error(`timeout waiting for ${sceneKey}`));
        requestAnimationFrame(tick);
      };
      tick();
    }),
};

window.render_game_to_text = () => JSON.stringify(getGameSnapshot(game));
