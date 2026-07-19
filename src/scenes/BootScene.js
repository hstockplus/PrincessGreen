import Phaser from 'phaser';
import { GAME, COLORS, FONT } from '../utils/constants.js';
import { ensurePlaceholderTextures } from '../utils/placeholders.js';
import { gameState } from '../utils/gameState.js';
import { sound } from '../utils/sound.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    gameState.reset();
    ensurePlaceholderTextures(this);
    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // ink wash atmosphere
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a0c10, 0x0a0c10, 0x1a2018, 0x2a1810, 1);
    g.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    g.fillStyle(0xffffff, 0.03);
    g.fillEllipse(300, 200, 400, 80);
    g.fillEllipse(900, 160, 360, 60);

    const title = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40, '青蛙公主', {
      fontFamily: FONT.FAMILY,
      fontSize: '64px',
      color: COLORS.GOLD_LIGHT,
      stroke: '#1a1008',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);

    const sub = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 30, '背叛与复仇的故事', {
      fontFamily: FONT.FAMILY,
      fontSize: '22px',
      color: COLORS.UI_MUTED,
    }).setOrigin(0.5).setAlpha(0);

    const hint = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 100, '点击或按 Enter 开始 · 进入即播放音乐', {
      fontFamily: FONT.FAMILY,
      fontSize: '18px',
      color: COLORS.GOLD,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, y: title.y - 8, duration: 800, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: sub, alpha: 1, delay: 300, duration: 700 });
    this.tweens.add({
      targets: hint,
      alpha: { from: 0.3, to: 1 },
      delay: 600,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    // floating gold dust
    this.add.particles(0, 0, 'tex_fireball', {
      x: { min: 0, max: GAME.WIDTH },
      y: GAME.HEIGHT + 10,
      tint: 0xc9a227,
      scale: { start: 0.15, end: 0.4 },
      alpha: { start: 0.5, end: 0 },
      speedY: { min: -60, max: -20 },
      speedX: { min: -20, max: 20 },
      lifespan: 5000,
      frequency: 180,
      blendMode: 'ADD',
    });

    const go = async () => {
      await sound.unlock();
      sound.playBgm('palace');
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, () => this.scene.start('PalaceScene'));
    };
    this.input.once('pointerdown', go);
    this.input.keyboard.once('keydown-ENTER', go);
  }
}
