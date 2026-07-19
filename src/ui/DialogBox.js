import Phaser from 'phaser';
import { GAME, COLORS, FONT } from '../utils/constants.js';

/**
 * 底部半透明对话框 + 选项按钮
 */
export class DialogBox {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(1000).setVisible(false);
    this.active = false;
    this.queue = [];
    this.onComplete = null;
    this.choiceResolve = null;

    const boxY = GAME.HEIGHT - 150;
    this.bg = scene.add.rectangle(GAME.WIDTH / 2, boxY + 60, GAME.WIDTH - 40, 140, COLORS.UI_BG, 0.88)
      .setStrokeStyle(2, COLORS.GOLD, 0.6);
    this.speaker = scene.add.text(40, boxY + 12, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '22px',
      color: COLORS.GOLD_LIGHT,
    });
    this.body = scene.add.text(40, boxY + 44, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '20px',
      color: COLORS.UI_TEXT,
      wordWrap: { width: GAME.WIDTH - 100 },
      lineSpacing: 6,
    });
    this.hint = scene.add.text(GAME.WIDTH - 48, boxY + 118, '空格继续', {
      fontFamily: FONT.FAMILY,
      fontSize: '14px',
      color: COLORS.UI_MUTED,
    }).setOrigin(1, 0.5);

    this.choiceBtns = [];
    this.container.add([this.bg, this.speaker, this.body, this.hint]);

    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  /**
   * @param {Array<{speaker?:string,text:string,choices?:Array<{label:string,id:string}>}>} lines
   * @returns {Promise<string|null>} 最终选项 id，或 null
   */
  show(lines) {
    return new Promise((resolve) => {
      this.queue = [...lines];
      this.onComplete = resolve;
      this.active = true;
      this.container.setVisible(true);
      this.clearChoices();
      this.next();
    });
  }

  next() {
    this.clearChoices();
    if (this.queue.length === 0) {
      this.hide();
      this.onComplete?.(null);
      return;
    }
    const line = this.queue.shift();
    this.speaker.setText(line.speaker || '');
    this.body.setText(line.text || '');
    this.hint.setVisible(!line.choices?.length);

    if (line.choices?.length) {
      this.showChoices(line.choices);
    }
  }

  showChoices(choices) {
    const startY = GAME.HEIGHT - 210;
    choices.forEach((c, i) => {
      const x = GAME.WIDTH / 2 + (i - (choices.length - 1) / 2) * 280;
      const btn = this.scene.add.rectangle(x, startY, 240, 44, COLORS.BLOOD, 0.9)
        .setStrokeStyle(2, COLORS.GOLD)
        .setInteractive({ useHandCursor: true })
        .setDepth(1001);
      const label = this.scene.add.text(x, startY, c.label, {
        fontFamily: FONT.FAMILY,
        fontSize: '18px',
        color: COLORS.UI_TEXT,
      }).setOrigin(0.5).setDepth(1002);

      btn.on('pointerover', () => btn.setFillStyle(0xa03030));
      btn.on('pointerout', () => btn.setFillStyle(COLORS.BLOOD));
      btn.on('pointerdown', () => {
        this.hide();
        this.onComplete?.(c.id);
      });
      this.choiceBtns.push(btn, label);
    });
  }

  clearChoices() {
    this.choiceBtns.forEach((o) => o.destroy());
    this.choiceBtns = [];
  }

  update() {
    if (!this.active || this.choiceBtns.length) return;
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.next();
    }
  }

  hide() {
    this.active = false;
    this.container.setVisible(false);
    this.clearChoices();
  }

  destroy() {
    this.hide();
    this.container.destroy();
  }
}
