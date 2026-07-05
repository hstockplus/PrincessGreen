import Phaser from 'phaser';
import { GAME, COLORS, DPR } from './Constants.js';
import { BootScene } from '../scenes/BootScene.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { SwampScene } from '../scenes/SwampScene.js';
import { CastleScene } from '../scenes/CastleScene.js';
import { PrincessScene } from '../scenes/PrincessScene.js';

export const GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.SKY,
  roundPixels: true,
  antialias: true,
  render: {
    preserveDrawingBuffer: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / DPR,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, SwampScene, CastleScene, PrincessScene],
};
