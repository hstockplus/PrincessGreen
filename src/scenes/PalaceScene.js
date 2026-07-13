import Phaser from 'phaser';
import { GAME, UI, WARRIOR, KING, TRANSITION } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import { Warrior } from '../entities/Warrior.js';
import { DialogueManager } from '../systems/DialogueManager.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { showSceneBackground, BG_KEYS } from '../art/BackgroundArt.js';
import { createDecorSprite, TEXTURE_KEYS } from '../art/AssetRegistry.js';
import { createMobileControls } from '../ui/MobileControls.js';
import palaceDialogue from '../../assets/dialogues/palace.json';

export class PalaceScene extends Phaser.Scene {
  constructor() {
    super('PalaceScene');
  }

  create() {
    gameState.phase = 'palace';
    gameState.chapter = 1;
    this.physics.world.gravity.y = 0;

    showSceneBackground(this, BG_KEYS.PALACE);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.06, '王宫大殿', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.HEADING_RATIO)}px`,
      color: '#ffd878',
      stroke: '#301020',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);

    this.king = createDecorSprite(this, GAME.WIDTH * 0.5, GAME.HEIGHT * 0.48, TEXTURE_KEYS.PRINCESS, KING.HEIGHT, 25);
    this.warrior = new Warrior(this, GAME.WIDTH * 0.28, GAME.HEIGHT * 0.62);

    this.dialogue = new DialogueManager(this);
    this.hint = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.93, '参见国王，等待宣旨……', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#d8c8e8',
    }).setOrigin(0.5).setDepth(50);

    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.dialogueStarted = false;

    this.mobile = createMobileControls(this, {
      attackLabel: '交互',
      skillLabels: ['谈', '行', ''],
      skillEnabled: [true, false, false],
    });

    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);

    registerTestHandler('pickDialogueChoice', (index) => this.dialogue.pickChoice(index));
    registerTestHandler('moveWarrior', (x, y) => {
      this.warrior.sprite.setPosition(x, y);
      this.warrior.sprite.body.setVelocity(0, 0);
    });

    this.time.delayedCall(500, () => {
      if (!this.dialogueStarted) this.startDialogue();
    });
  }

  startDialogue() {
    if (this.dialogueStarted) return;
    this.dialogueStarted = true;
    gameState.setFlag('warriorIsToad');
    this.dialogue.start(palaceDialogue);
    this.hint.setText('阅读对话……');
  }

  onDialogueTrigger(trigger) {
    if (trigger === 'departSwamp') {
      eventBus.emit(Events.BOUNTY_ACCEPTED);
      this.goToSwamp();
    }
  }

  onDialogueComplete() {}

  goToSwamp() {
    gameState.phase = 'swamp';
    this.hint.setText('前往绝望沼泽 →');
    this.cameras.main.fadeOut(TRANSITION.FADE_DURATION, 0, 0, 0);
    this.time.delayedCall(TRANSITION.FADE_DURATION, () => {
      this.scene.start('SwampScene');
    });
  }

  update() {
    this.mobile.setEnabled(!gameState.dialogueActive);

    if (gameState.dialogueActive) {
      this.warrior.sprite.body.setVelocity(0, 0);
      const btn = this.mobile.consumeButtons();
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.dialogue.advance();
      }
      this.dialogue.pickFromMobileButtons(btn);
      return;
    }

    const interact = Phaser.Input.Keyboard.JustDown(this.interactKey);
    const btn = this.mobile.consumeButtons();
    if ((interact || btn.attack || btn.skill1) && !this.dialogueStarted) {
      this.startDialogue();
    }
  }
}
