import Phaser from 'phaser';
import { GAME, COLORS, FONT } from '../utils/constants.js';
import { ensurePlaceholderTextures } from '../utils/placeholders.js';
import { gameState } from '../utils/gameState.js';
import { sound } from '../utils/sound.js';
import { ASSETS, preloadGameImages, showBackground } from '../art/AssetLoader.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // 简陋加载条
    const barBg = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 80, 320, 12, 0x222222);
    const bar = this.add.rectangle(GAME.WIDTH / 2 - 158, GAME.HEIGHT / 2 + 80, 4, 8, COLORS.GOLD).setOrigin(0, 0.5);
    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 40, '墨色入卷……', {
      fontFamily: FONT.FAMILY, fontSize: '18px', color: COLORS.UI_MUTED,
    }).setOrigin(0.5);
    this.load.on('progress', (v) => { bar.width = 316 * v; });
    preloadGameImages(this);
  }

  create() {
    gameState.reset();
    ensurePlaceholderTextures(this); // 平台/刀光等小件 fallback
    this.cameras.main.fadeIn(600, 0, 0, 0);

    showBackground(this, ASSETS.BG_PALACE, -10);
    this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.45).setDepth(0);

    const title = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40, '青蛙公主', {
      fontFamily: FONT.FAMILY,
      fontSize: '64px',
      color: COLORS.GOLD_LIGHT,
      stroke: '#1a1008',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    const sub = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 30, '背叛与复仇的故事', {
      fontFamily: FONT.FAMILY,
      fontSize: '22px',
      color: COLORS.UI_MUTED,
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    const hint = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 100, '点击屏幕开始 · 横屏游玩', {
      fontFamily: FONT.FAMILY,
      fontSize: '18px',
      color: COLORS.GOLD,
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.tweens.add({ targets: title, alpha: 1, y: title.y - 8, duration: 800, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: sub, alpha: 1, delay: 300, duration: 700 });
    this.tweens.add({
      targets: hint, alpha: { from: 0.3, to: 1 }, delay: 600, duration: 900, yoyo: true, repeat: -1,
    });

    // 右下角立绘剪影
    if (this.textures.exists(ASSETS.WARRIOR)) {
      const w = this.add.image(GAME.WIDTH * 0.82, GAME.HEIGHT * 0.72, ASSETS.WARRIOR)
        .setOrigin(0.5, 1).setAlpha(0.85).setDepth(5);
      w.setScale((GAME.HEIGHT * 0.55) / w.height);
    }

    const go = async () => {
      await sound.unlock();
      sound.playBgm('palace');
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, () => this.scene.start('PalaceScene'));
    };
    this.input.once('pointerdown', go);
    this.input.keyboard?.once('keydown-ENTER', go);
  }
}
