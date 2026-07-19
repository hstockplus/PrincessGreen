import Phaser from 'phaser';
import { GAME, COLORS } from './utils/constants.js';
import { BootScene } from './scenes/BootScene.js';
import { PalaceScene } from './scenes/PalaceScene.js';
import { SwampScene } from './scenes/SwampScene.js';
import { CastleScene } from './scenes/CastleScene.js';
import { ChaseScene } from './scenes/ChaseScene.js';
import { EndingScene } from './scenes/EndingScene.js';

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

// eslint-disable-next-line no-new
new Phaser.Game(config);
