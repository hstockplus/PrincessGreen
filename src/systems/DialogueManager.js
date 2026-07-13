import { GAME, UI, COLORS, PX } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { registerTestHandler } from '../testing/TestAPI.js';

const PANEL_PAD = 20 * PX;
const LINE_GAP = 10 * PX;
const CHOICE_GAP = 12 * PX;
const CHOICE_MIN_H = 44 * PX;
const DIALOGUE_DEPTH = 1100;

export class DialogueManager {
  constructor(scene) {
    this.scene = scene;
    this.data = null;
    this.currentNodeId = null;
    this.choiceItems = [];
    this.blockInput = false;
    this.awaitingContinue = false;
    this.pendingNext = null;
    this.pendingFinishNode = null;

    this.panelTop = GAME.HEIGHT * 0.68;
    this.basePanelH = GAME.HEIGHT * 0.3;

    this.container = scene.add.container(0, 0).setDepth(DIALOGUE_DEPTH).setVisible(false);

    this.panel = scene.add.rectangle(
      GAME.WIDTH / 2,
      0,
      GAME.WIDTH * 0.92,
      this.basePanelH,
      0x1a1020,
      0.94,
    );
    this.panel.setStrokeStyle(4 * PX, 0xc9a227);

    this.headerBar = scene.add.rectangle(
      GAME.WIDTH / 2,
      0,
      GAME.WIDTH * 0.88,
      3 * PX,
      0x9b2222,
      0.8,
    );

    this.speakerText = scene.add.text(0, 0, '', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#f5d78a',
    });

    this.bodyText = scene.add.text(0, 0, '', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.BODY_RATIO)}px`,
      color: COLORS.UI_TEXT,
      wordWrap: { width: GAME.WIDTH * 0.84 },
      lineSpacing: 6 * PX,
    });

    this.container.add([this.panel, this.headerBar, this.speakerText, this.bodyText]);
    this.layoutPanel(this.basePanelH);

    scene.input.keyboard.on('keydown-ONE', () => this.pickChoice(0));
    scene.input.keyboard.on('keydown-TWO', () => this.pickChoice(1));
    scene.input.keyboard.on('keydown-THREE', () => this.pickChoice(2));
    scene.input.keyboard.on('keydown-SPACE', () => this.advance());
    scene.input.keyboard.on('keydown-ENTER', () => this.advance());
  }

  layoutPanel(height) {
    const panelH = height;
    const panelCenterY = this.panelTop + panelH / 2;
    this.panel.setSize(GAME.WIDTH * 0.92, panelH);
    this.panel.setPosition(GAME.WIDTH / 2, panelCenterY);
    this.headerBar.setPosition(GAME.WIDTH / 2, this.panelTop + 6 * PX);
  }

  start(dialogueData) {
    this.data = dialogueData;
    this.currentNodeId = dialogueData.start;
    gameState.dialogueActive = true;
    eventBus.emit(Events.DIALOGUE_START);
    this.container.setVisible(true);
    this.scene.mobile?.setDialogueMode?.(true);
    registerTestHandler('advanceDialogue', () => this.advance());
    this.showNode(this.currentNodeId);
  }

  showNode(nodeId) {
    const node = this.data.nodes[nodeId];
    if (!node) return;

    this.currentNodeId = nodeId;
    this.clearChoices();

    this.speakerText.setText(node.speaker || '');
    this.bodyText.setText(node.text || '');

    const left = GAME.WIDTH * 0.06;
    let y = this.panelTop + PANEL_PAD;

    this.speakerText.setPosition(left, y);
    y += this.speakerText.height + LINE_GAP;

    this.bodyText.setPosition(left, y);
    y += this.bodyText.height + LINE_GAP * 1.5;

    if (node.choices?.length) {
      const rowW = GAME.WIDTH * 0.88;
      node.choices.forEach((choice, index) => {
        const label = `${index + 1}. ${choice.label}`;
        const rowH = CHOICE_MIN_H;
        const rowCenterY = y + rowH / 2;

        const hit = this.scene.add.rectangle(
          GAME.WIDTH / 2,
          rowCenterY,
          rowW,
          rowH,
          0x2a2040,
          0.92,
        )
          .setStrokeStyle(2 * PX, 0x6a5a9a)
          .setDepth(DIALOGUE_DEPTH + 1)
          .setInteractive({ useHandCursor: true });

        const text = this.scene.add.text(left + 8 * PX, rowCenterY, label, {
          fontFamily: UI.FONT,
          fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
          color: '#c8d8ff',
        }).setOrigin(0, 0.5).setDepth(DIALOGUE_DEPTH + 2);

        const pick = () => this.pickChoice(index);
        hit.on('pointerover', () => {
          hit.setFillStyle(0x3a3060, 0.95);
          text.setColor('#ffffff');
        });
        hit.on('pointerout', () => {
          hit.setFillStyle(0x2a2040, 0.92);
          text.setColor('#c8d8ff');
        });
        hit.on('pointerdown', pick);
        text.setInteractive({ useHandCursor: true });
        text.on('pointerdown', pick);

        this.choiceItems.push(hit, text);
        y += rowH + CHOICE_GAP;
      });
    }

    const contentH = y - this.panelTop + PANEL_PAD;
    const panelH = Math.max(this.basePanelH, contentH);
    this.layoutPanel(panelH);

    if (node.choices?.length) {
      this.awaitingContinue = false;
      return;
    }

    this.awaitingContinue = true;
    this.pendingNext = node.next || null;
    this.pendingFinishNode = node;
    this.showContinueButton(y);
  }

  showContinueButton(y) {
    const rowW = GAME.WIDTH * 0.88;
    const rowH = CHOICE_MIN_H;
    const rowCenterY = y + rowH / 2;
    const label = '点击继续 ▶';

    const hit = this.scene.add.rectangle(
      GAME.WIDTH / 2,
      rowCenterY,
      rowW,
      rowH,
      0x3a2818,
      0.92,
    )
      .setStrokeStyle(2 * PX, 0xc9a227)
      .setDepth(DIALOGUE_DEPTH + 1)
      .setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(GAME.WIDTH / 2, rowCenterY, label, {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#ffd878',
    }).setOrigin(0.5).setDepth(DIALOGUE_DEPTH + 2);

    const pick = () => this.advance();
    hit.on('pointerover', () => {
      hit.setFillStyle(0x5a3828, 0.95);
      text.setColor('#fff8e0');
    });
    hit.on('pointerout', () => {
      hit.setFillStyle(0x3a2818, 0.92);
      text.setColor('#ffd878');
    });
    hit.on('pointerdown', pick);
    text.setInteractive({ useHandCursor: true });
    text.on('pointerdown', pick);

    this.choiceItems.push(hit, text);

    const contentH = y + rowH + PANEL_PAD - this.panelTop + PANEL_PAD;
    const panelH = Math.max(this.basePanelH, contentH);
    this.layoutPanel(panelH);
  }

  advance() {
    if (!gameState.dialogueActive || this.blockInput || !this.awaitingContinue) return;

    this.awaitingContinue = false;
    this.clearChoices();

    if (this.pendingNext) {
      this.showNode(this.pendingNext);
      return;
    }

    this.finishNode(this.pendingFinishNode || {});
  }

  pickChoice(index) {
    if (!gameState.dialogueActive || this.blockInput) return;
    const node = this.data.nodes[this.currentNodeId];
    const choice = node?.choices?.[index];
    if (!choice) return;

    if (choice.affection) {
      gameState.addAffection(choice.affection);
      eventBus.emit(Events.AFFECTION_CHANGED, { affection: gameState.affection });
    }
    if (choice.setFlag) {
      gameState.setFlag(choice.setFlag);
    }

    if (choice.next) {
      this.showNode(choice.next);
    } else {
      this.finishNode({});
    }
  }

  /** 移动端：普攻/技能键映射选项 0/1/2，或继续下一句 */
  pickFromMobileButtons({ attack, skill1, skill2, skill3 }) {
    if (this.awaitingContinue && (attack || skill1)) {
      this.advance();
      return true;
    }
    if (attack || skill1) return this.pickChoice(0);
    if (skill2) return this.pickChoice(1);
    if (skill3) return this.pickChoice(2);
    return false;
  }

  finishNode(node) {
    if (node.setFlag) {
      gameState.setFlag(node.setFlag);
    }
    if (node.trigger === 'chapterTwo') {
      this.close();
      this.scene.onDialogueTrigger?.('chapterTwo');
      return;
    }
    if (node.trigger === 'departSwamp') {
      this.close();
      this.scene.onDialogueTrigger?.('departSwamp');
      return;
    }
    if (node.end) {
      this.close();
      this.scene.onDialogueComplete?.();
    }
  }

  close() {
    this.clearChoices();
    this.layoutPanel(this.basePanelH);
    this.container.setVisible(false);
    gameState.dialogueActive = false;
    this.scene.mobile?.setDialogueMode?.(false);
    eventBus.emit(Events.DIALOGUE_END);
  }

  clearChoices() {
    this.choiceItems.forEach((item) => item.destroy());
    this.choiceItems = [];
  }

  destroy() {
    this.clearChoices();
    this.container.destroy();
  }
}
