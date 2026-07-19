import Phaser from 'phaser';
import { GAME, COLORS, FONT } from '../utils/constants.js';
import { sound } from '../utils/sound.js';
import { gameState } from '../utils/gameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import { registerTestHandler } from '../testing/TestAPI.js';

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('EndingScene');
  }

  create() {
    gameState.phase = 'ending';
    sound.playBgm('ending');
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.drawSunset();

    this.add.text(GAME.WIDTH / 2, 48, '第五幕 · 回归原形', {
      fontFamily: FONT.FAMILY,
      fontSize: '28px',
      color: COLORS.GOLD_LIGHT,
    }).setOrigin(0.5);

    const toad = this.add.image(GAME.WIDTH * 0.35, GAME.HEIGHT * 0.62, 'tex_toad').setScale(2);

    const g = this.add.graphics();
    g.fillStyle(0x3a2a10, 0.5);
    for (let i = 0; i < 6; i++) {
      g.fillEllipse(GAME.WIDTH * 0.38 + i * 40, GAME.HEIGHT * 0.68 + (i % 2) * 6, 10, 6);
    }

    this.tweens.add({
      targets: toad,
      x: GAME.WIDTH * 0.55,
      y: GAME.HEIGHT * 0.7,
      duration: 2200,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.tweens.add({
          targets: toad,
          alpha: 0,
          x: GAME.WIDTH * 0.62,
          duration: 1000,
        });
      },
    });

    this.time.delayedCall(2800, () => {
      const line = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.42, '她从未原谅他。', {
        fontFamily: FONT.FAMILY,
        fontSize: '40px',
        color: COLORS.UI_TEXT,
        stroke: '#1a1008',
        strokeThickness: 4,
      }).setOrigin(0.5).setAlpha(0).setDepth(10);
      this.tweens.add({ targets: line, alpha: 1, duration: 1200 });
      gameState.storyComplete = true;
      eventBus.emit(Events.STORY_COMPLETE);
    });

    registerTestHandler('forceEscape', () => {
      gameState.storyComplete = true;
    });

    this.time.delayedCall(5500, () => {
      const hint = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.82, '按 Enter 或点击返回主菜单', {
        fontFamily: FONT.FAMILY,
        fontSize: '18px',
        color: COLORS.UI_MUTED,
      }).setOrigin(0.5);

      this.tweens.add({
        targets: hint,
        alpha: { from: 1, to: 0.35 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      });

      const go = () => {
        sound.stopBgm();
        this.scene.start('BootScene');
      };
      this.input.once('pointerdown', go);
      this.input.keyboard.once('keydown-ENTER', go);
    });
  }

  drawSunset() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x2a1810, 0x2a1810, 0x8a4020, 0xc86820, 1);
    g.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    g.fillStyle(0xffaa44, 0.9);
    g.fillCircle(GAME.WIDTH * 0.75, GAME.HEIGHT * 0.35, 70);
    g.fillStyle(0x1a2818, 0.85);
    g.fillEllipse(GAME.WIDTH * 0.3, GAME.HEIGHT * 0.78, 500, 120);
    g.fillEllipse(GAME.WIDTH * 0.7, GAME.HEIGHT * 0.82, 600, 100);
    g.lineStyle(3, 0x2a3a20, 0.8);
    for (let i = 0; i < 40; i++) {
      const x = 40 + i * 30;
      g.lineBetween(x, GAME.HEIGHT * 0.75, x + Phaser.Math.Between(-8, 8), GAME.HEIGHT * 0.55);
    }
  }
}
