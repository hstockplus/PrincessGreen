import Phaser from 'phaser';
import { GAME, UI, TRANSITION } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import { showSceneBackground, BG_KEYS } from '../art/BackgroundArt.js';

const ML = {
  titleGold: '#ffd878',
  titleStroke: '#382010',
  subGold: '#e8c888',
  bodyBlue: '#a8d0f8',
  btnFill: 0x8b2020,
  btnStroke: 0xffd060,
  btnText: '#fff8e8',
};

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    gameState.reset();
    gameState.phase = 'menu';
    showSceneBackground(this, BG_KEYS.MENU);

    const stroke = Math.round(4 * (GAME.WIDTH / 960));
    const titleStyle = {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.TITLE_RATIO)}px`,
      color: ML.titleGold,
      stroke: ML.titleStroke,
      strokeThickness: stroke,
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 8, fill: true },
    };

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.26, '青蛙公主', titleStyle).setOrigin(0.5).setDepth(10);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.38, '背叛与复仇的故事', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.HEADING_RATIO)}px`,
      color: ML.subGold,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.5, '第一幕 — 勇士篇', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.BODY_RATIO)}px`,
      color: ML.bodyBlue,
    }).setOrigin(0.5).setDepth(10);

    const btnW = GAME.WIDTH * 0.34;
    const btnH = GAME.HEIGHT * 0.085;
    const btnY = GAME.HEIGHT * 0.64;

    const btnBg = this.add.rectangle(GAME.WIDTH / 2, btnY, btnW, btnH, ML.btnFill, 0.92)
      .setStrokeStyle(4, ML.btnStroke).setDepth(10).setInteractive({ useHandCursor: true });

    this.add.rectangle(GAME.WIDTH / 2, btnY, btnW + 8, btnH + 8, 0x000000, 0)
      .setStrokeStyle(2, ML.btnStroke, 0.4).setDepth(9);

    const startBtn = this.add.text(GAME.WIDTH / 2, btnY, '按 Enter 开始游戏', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.BODY_RATIO)}px`,
      color: ML.btnText,
      stroke: '#402010',
      strokeThickness: 2,
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
