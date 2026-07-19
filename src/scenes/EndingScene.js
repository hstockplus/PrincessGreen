import Phaser from 'phaser';
import { GAME, COLORS, FONT } from '../utils/constants.js';
import { sound } from '../utils/sound.js';
import { gameState } from '../utils/gameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { ASSETS, showBackground, fitActor } from '../art/AssetLoader.js';

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('EndingScene');
  }

  create() {
    gameState.phase = 'ending';
    sound.playBgm('ending');
    this.cameras.main.fadeIn(500, 0, 0, 0);
    showBackground(this, ASSETS.BG_ENDING);
    this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.2).setDepth(0);

    this.add.text(GAME.WIDTH / 2, 48, '第五幕 · 回归原形', {
      fontFamily: FONT.FAMILY,
      fontSize: '28px',
      color: COLORS.GOLD_LIGHT,
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);

    // 小金蟾：用青蛙守护者立绘缩小 + 金色调
    const toadKey = this.textures.exists(ASSETS.FROG) ? ASSETS.FROG : 'tex_toad';
    const toad = this.add.image(GAME.WIDTH * 0.32, GAME.HEIGHT * 0.72, toadKey)
      .setOrigin(0.5, 1)
      .setTint(0xffe08a)
      .setDepth(10);
    fitActor(toad, 'frog');
    toad.setScale(toad.scaleX * 0.85);

    const g = this.add.graphics().setDepth(9);
    g.fillStyle(0x3a2a10, 0.45);
    for (let i = 0; i < 7; i++) {
      g.fillEllipse(GAME.WIDTH * 0.36 + i * 48, GAME.HEIGHT * 0.74 + (i % 2) * 5, 12, 6);
    }

    this.tweens.add({
      targets: toad,
      x: GAME.WIDTH * 0.58,
      duration: 2400,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.tweens.add({
          targets: toad,
          alpha: 0,
          x: GAME.WIDTH * 0.68,
          duration: 1100,
        });
      },
    });

    this.time.delayedCall(2800, () => {
      const line = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.4, '她从未原谅他。', {
        fontFamily: FONT.FAMILY,
        fontSize: '42px',
        color: COLORS.UI_TEXT,
        stroke: '#1a1008',
        strokeThickness: 5,
      }).setOrigin(0.5).setAlpha(0).setDepth(20);
      this.tweens.add({ targets: line, alpha: 1, duration: 1200 });
      gameState.storyComplete = true;
      eventBus.emit(Events.STORY_COMPLETE);
    });

    registerTestHandler('forceEscape', () => {
      gameState.storyComplete = true;
    });

    this.time.delayedCall(5500, () => {
      const hint = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.82, '点击返回标题', {
        fontFamily: FONT.FAMILY,
        fontSize: '18px',
        color: COLORS.UI_MUTED,
      }).setOrigin(0.5).setDepth(20);

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
      this.input.keyboard?.once('keydown-ENTER', go);
    });
  }
}
