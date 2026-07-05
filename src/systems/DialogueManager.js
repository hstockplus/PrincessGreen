import { GAME, UI, COLORS, PX } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

const PANEL_PAD = 20 * PX;
const LINE_GAP = 10 * PX;
const CHOICE_GAP = 12 * PX;

export class DialogueManager {
  constructor(scene) {
    this.scene = scene;
    this.data = null;
    this.currentNodeId = null;
    this.choiceTexts = [];
    this.blockInput = false;

    this.panelTop = GAME.HEIGHT * 0.68;
    this.basePanelH = GAME.HEIGHT * 0.3;

    this.container = scene.add.container(0, 0).setDepth(1000).setVisible(false);

    this.panel = scene.add.rectangle(
      GAME.WIDTH / 2,
      0,
      GAME.WIDTH * 0.92,
      this.basePanelH,
      0x1a1020,
      0.94
    );
    this.panel.setStrokeStyle(4 * PX, 0xc9a227);

    this.headerBar = scene.add.rectangle(
      GAME.WIDTH / 2,
      0,
      GAME.WIDTH * 0.88,
      3 * PX,
      0x9b2222,
      0.8
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
      node.choices.forEach((choice, index) => {
        const label = `${index + 1}. ${choice.label}`;
        const text = this.scene.add.text(left, y, label, {
          fontFamily: UI.FONT,
          fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
          color: '#c8d8ff',
          backgroundColor: '#2a2040',
          padding: { x: 10 * PX, y: 6 * PX },
        });
        text.setInteractive({ useHandCursor: true });
        text.on('pointerover', () => text.setColor('#ffffff'));
        text.on('pointerout', () => text.setColor('#c8d8ff'));
        text.on('pointerdown', () => this.pickChoice(index));
        this.choiceTexts.push(text);
        this.container.add(text);
        y += text.height + CHOICE_GAP;
      });
    }

    const contentH = y - this.panelTop + PANEL_PAD;
    const panelH = Math.max(this.basePanelH, contentH);
    this.layoutPanel(panelH);

    if (node.choices?.length) return;

    if (node.next) {
      this.scene.time.delayedCall(400, () => this.showNode(node.next));
      return;
    }

    this.finishNode(node);
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

  finishNode(node) {
    if (node.setFlag) {
      gameState.setFlag(node.setFlag);
    }
    if (node.trigger === 'chapterTwo') {
      this.close();
      this.scene.onDialogueTrigger?.('chapterTwo');
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
    eventBus.emit(Events.DIALOGUE_END);
  }

  clearChoices() {
    this.choiceTexts.forEach((t) => t.destroy());
    this.choiceTexts = [];
  }

  destroy() {
    this.clearChoices();
    this.container.destroy();
  }
}
