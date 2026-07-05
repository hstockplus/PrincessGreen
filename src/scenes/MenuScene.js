import Phaser from 'phaser';
import { GAME, UI, TRANSITION } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import { drawMenuBackdrop } from '../art/EnvironmentArt.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    gameState.reset();
    gameState.phase = 'menu';
    drawMenuBackdrop(this);

    const titleStyle = {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.TITLE_RATIO)}px`,
      color: '#f5d78a',
      stroke: '#3a2010',
      strokeThickness: Math.round(4 * (GAME.WIDTH / 960)),
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 6, fill: true },
    };

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.26, '青蛙公主', titleStyle).setOrigin(0.5).setDepth(10);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.38, '背叛与复仇的故事', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.HEADING_RATIO)}px`,
      color: '#d4c4a8',
    }).setOrigin(0.5).setDepth(10);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.5, '第一幕 — 勇士篇', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.BODY_RATIO)}px`,
      color: '#a8c8ff',
    }).setOrigin(0.5).setDepth(10);

    const btnBg = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT * 0.64, GAME.WIDTH * 0.32, GAME.HEIGHT * 0.08, 0x6b1a1a, 0.9)
      .setStrokeStyle(3, 0xc9a227).setDepth(10).setInteractive({ useHandCursor: true });

    const startBtn = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.64, '按 Enter 开始游戏', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.BODY_RATIO)}px`,
      color: '#fff8e0',
    }).setOrigin(0.5).setDepth(11);

    const start = () => {
      if (gameState.started) return;
      gameState.started = true;
      gameState.phase = 'swamp';
      eventBus.emit(Events.GAME_START);
      this.cameras.main.fadeOut(TRANSITION.FADE_DURATION, 0, 0, 0);
      this.time.delayedCall(TRANSITION.FADE_DURATION, () => {
        this.scene.start('SwampScene');
      });
    };

    btnBg.on('pointerdown', start);
    startBtn.setInteractive({ useHandCursor: true }).on('pointerdown', start);
    this.input.keyboard.once('keydown-ENTER', start);
    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);
  }
}
