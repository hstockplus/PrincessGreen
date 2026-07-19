import Phaser from 'phaser';
import { GAME, COLORS, FONT } from '../utils/constants.js';
import { gameState } from '../utils/gameState.js';

/**
 * 底部半透明对话框 + 选项按钮（支持触控点击继续）
 */
export class DialogBox {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(1000).setVisible(false);
    this.active = false;
    this.queue = [];
    this.onComplete = null;
    this.choiceBtns = [];
    this._lastChoices = [];
    this.openedAt = 0;
    this._pointerHandler = null;

    const boxY = GAME.HEIGHT - 160;

    // 全屏透明点击层：无选项时点击任意处继续
    this.tapZone = scene.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.001)
      .setInteractive()
      .setDepth(998)
      .setVisible(false);

    this.bg = scene.add.rectangle(GAME.WIDTH / 2, boxY + 70, GAME.WIDTH - 24, 160, COLORS.UI_BG, 0.92)
      .setStrokeStyle(2, COLORS.GOLD, 0.7)
      .setInteractive({ useHandCursor: true });

    this.speaker = scene.add.text(36, boxY + 16, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '24px',
      color: COLORS.GOLD_LIGHT,
    });
    this.body = scene.add.text(36, boxY + 52, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '22px',
      color: COLORS.UI_TEXT,
      wordWrap: { width: GAME.WIDTH - 80 },
      lineSpacing: 8,
    });
    this.hint = scene.add.text(GAME.WIDTH - 40, boxY + 132, '点击继续', {
      fontFamily: FONT.FAMILY,
      fontSize: '16px',
      color: COLORS.GOLD_LIGHT,
    }).setOrigin(1, 0.5);

    this.container.add([this.bg, this.speaker, this.body, this.hint]);

    this.spaceKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    const onTap = () => this.tryAdvanceByTap();
    this.tapZone.on('pointerup', onTap);
    this.bg.on('pointerup', onTap);

    // 全局 pointerup 兜底（部分移动浏览器对矩形命中不稳）
    this._pointerHandler = (pointer) => {
      if (!this.active || this.choiceBtns.length) return;
      if (pointer.downElement && pointer.downElement !== this.scene.game.canvas) return;
      this.tryAdvanceByTap();
    };
    scene.input.on('pointerup', this._pointerHandler);
  }

  tryAdvanceByTap() {
    if (!this.active || this.choiceBtns.length) return;
    if (this.scene.time.now - this.openedAt < 280) return;
    this.openedAt = this.scene.time.now;
    this.next();
  }

  /**
   * @param {Array<{speaker?:string,text:string,choices?:Array<{label:string,id:string}>}>} lines
   * @returns {Promise<string|null>}
   */
  show(lines) {
    return new Promise((resolve) => {
      this.queue = [...lines];
      this.onComplete = resolve;
      this.active = true;
      gameState.dialogueActive = true;
      this.container.setVisible(true);
      this.tapZone.setVisible(true);
      this.clearChoices();
      this.openedAt = this.scene.time.now;
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
    this.tapZone.setVisible(!line.choices?.length);
    this.openedAt = this.scene.time.now;

    if (line.choices?.length) {
      this.showChoices(line.choices);
    }
  }

  showChoices(choices) {
    this._lastChoices = choices;
    const startY = GAME.HEIGHT - 230;
    const btnW = Math.min(300, GAME.WIDTH * 0.4);
    const btnH = 56;
    choices.forEach((c, i) => {
      const x = GAME.WIDTH / 2 + (i - (choices.length - 1) / 2) * (btnW + 24);
      const btn = this.scene.add.rectangle(x, startY, btnW, btnH, COLORS.BLOOD, 0.95)
        .setStrokeStyle(3, COLORS.GOLD)
        .setInteractive({ useHandCursor: true })
        .setDepth(1002);
      const label = this.scene.add.text(x, startY, c.label, {
        fontFamily: FONT.FAMILY,
        fontSize: '20px',
        color: COLORS.UI_TEXT,
      }).setOrigin(0.5).setDepth(1003);

      // 扩大点击区域：文字也响应
      label.setInteractive({ useHandCursor: true });

      const pick = () => {
        this.hide();
        this.onComplete?.(c.id);
      };
      btn.on('pointerover', () => btn.setFillStyle(0xa03030));
      btn.on('pointerout', () => btn.setFillStyle(COLORS.BLOOD));
      btn.on('pointerup', pick);
      label.on('pointerup', pick);
      this.choiceBtns.push(btn, label);
    });
  }

  clearChoices() {
    this.choiceBtns.forEach((o) => o.destroy());
    this.choiceBtns = [];
  }

  update() {
    if (!this.active || this.choiceBtns.length) return;
    if (
      (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey))
      || (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey))
    ) {
      this.next();
    }
  }

  hide() {
    this.active = false;
    gameState.dialogueActive = false;
    this.container.setVisible(false);
    this.tapZone.setVisible(false);
    this.clearChoices();
  }

  forceAdvance() {
    if (!this.active) return;
    if (this.choiceBtns.length) return;
    this.next();
  }

  forcePick(idOrIndex) {
    if (!this.active) return;
    const choices = this._lastChoices || [];
    let id = idOrIndex;
    if (typeof idOrIndex === 'number') id = choices[idOrIndex]?.id;
    if (!id && choices[0]) id = choices[0].id;
    this.hide();
    this.onComplete?.(id ?? null);
  }

  destroy() {
    if (this._pointerHandler) {
      this.scene.input.off('pointerup', this._pointerHandler);
    }
    this.hide();
    this.tapZone.destroy();
    this.container.destroy();
  }
}
