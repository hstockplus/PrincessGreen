import { GAME, UI, COLORS, PX } from '../core/Constants.js';
import defeatQuotes from '../../assets/dialogues/defeat_quotes.json';

export class DefeatOverlay {
  constructor(scene, { onRetry }) {
    this.scene = scene;
    this.onRetry = onRetry;

    this.container = scene.add.container(0, 0).setDepth(1200).setVisible(false);

    this.backdrop = scene.add.rectangle(
      GAME.WIDTH / 2,
      GAME.HEIGHT / 2,
      GAME.WIDTH,
      GAME.HEIGHT,
      0x000000,
      0.72
    );

    this.title = scene.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.22, '战败', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.TITLE_RATIO * 0.7)}px`,
      color: '#ff6666',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.quote = scene.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.42, '', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.BODY_RATIO)}px`,
      color: COLORS.UI_TEXT,
      align: 'center',
      wordWrap: { width: GAME.WIDTH * 0.75 },
      lineSpacing: 8 * PX,
    }).setOrigin(0.5);

    this.speaker = scene.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.58, '—— 勇士', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#f5d78a',
    }).setOrigin(0.5);

    const btnW = GAME.WIDTH * 0.28;
    const btnH = GAME.HEIGHT * 0.07;
    this.btnBg = scene.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT * 0.72, btnW, btnH, COLORS.BTN_PRIMARY, 1)
      .setStrokeStyle(3 * PX, 0xc9a227)
      .setInteractive({ useHandCursor: true });

    this.btnText = scene.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.72, '再战', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.BODY_RATIO)}px`,
      color: COLORS.BTN_TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.btnBg.on('pointerdown', () => this.retry());
    this.btnText.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.retry());

    this.container.add([this.backdrop, this.title, this.quote, this.speaker, this.btnBg, this.btnText]);
  }

  show() {
    const quotes = defeatQuotes.quotes;
    const text = quotes[Math.floor(Math.random() * quotes.length)];
    this.quote.setText(`「${text}」`);
    this.container.setVisible(true);
    this.scene.input.keyboard.once('keydown-SPACE', () => this.retry());
  }

  hide() {
    this.container.setVisible(false);
  }

  retry() {
    this.hide();
    this.onRetry?.();
  }

  destroy() {
    this.container.destroy();
  }
}
