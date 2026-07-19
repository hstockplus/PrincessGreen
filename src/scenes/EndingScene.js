import Phaser from 'phaser';
import { GAME, COLORS, FONT } from '../utils/constants.js';
import { sound } from '../utils/sound.js';

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('EndingScene');
  }

  create() {
    sound.playBgm('ending');
    this.drawSunset();

    this.add.text(GAME.WIDTH / 2, 48, '第五幕 · 回归原形', {
      fontFamily: FONT.FAMILY,
      fontSize: '28px',
      color: COLORS.GOLD_LIGHT,
    }).setOrigin(0.5);

    // 替换为精灵图资源 — 小金蟾
    const toad = this.add.circle(GAME.WIDTH * 0.35, GAME.HEIGHT * 0.62, 14, 0xffd700);
    this.add.circle(GAME.WIDTH * 0.35 - 6, GAME.HEIGHT * 0.62 - 6, 4, 0x222222);
    this.add.circle(GAME.WIDTH * 0.35 + 6, GAME.HEIGHT * 0.62 - 6, 4, 0x222222);

    // footprints
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
      this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.42, '她从未原谅他。', {
        fontFamily: FONT.FAMILY,
        fontSize: '40px',
        color: COLORS.UI_TEXT,
      }).setOrigin(0.5).setAlpha(0).setDepth(10)
        .setStroke(COLORS.BG_DARK, 4);

      const line = this.children.list[this.children.list.length - 1];
      this.tweens.add({ targets: line, alpha: 1, duration: 1200 });
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
    // reeds
    g.lineStyle(3, 0x2a3a20, 0.8);
    for (let i = 0; i < 40; i++) {
      const x = 40 + i * 30;
      g.lineBetween(x, GAME.HEIGHT * 0.75, x + Phaser.Math.Between(-8, 8), GAME.HEIGHT * 0.55);
    }
  }
}
