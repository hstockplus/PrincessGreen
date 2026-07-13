import Phaser from 'phaser';
import { GAME, UI, INTERACT, TRANSITION, FROG } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { Warrior } from '../entities/Warrior.js';
import { FrogCompanion } from '../entities/FrogCompanion.js';
import { DialogueManager } from '../systems/DialogueManager.js';
import { AffectionBar } from '../ui/AffectionBar.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { showSceneBackground, BG_KEYS } from '../art/BackgroundArt.js';
import { createDecorSprite, ySort, TEXTURE_KEYS } from '../art/AssetRegistry.js';
import { createMobileControls } from '../ui/MobileControls.js';
import swampDialogue from '../../assets/dialogues/swamp.json';

export class SwampScene extends Phaser.Scene {
  constructor() {
    super('SwampScene');
  }

  create() {
    gameState.phase = 'swamp';
    gameState.chapter = 1;
    this.physics.world.gravity.y = 0;

    showSceneBackground(this, BG_KEYS.SWAMP);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.06, '绝望沼泽', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.HEADING_RATIO)}px`,
      color: '#ffd878',
      stroke: '#283820',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);

    this.warrior = new Warrior(this, GAME.WIDTH * 0.15, GAME.HEIGHT * 0.55);
    this.frogNpc = createDecorSprite(this, GAME.WIDTH * 0.55, GAME.HEIGHT * 0.52, TEXTURE_KEYS.FROG, FROG.HEIGHT);
    this.frogNpc.setInteractive({ useHandCursor: true });
    this.frogNpc.on('pointerdown', () => {
      if (!gameState.dialogueActive) {
        this.dialogue.start(swampDialogue);
      }
    });
    this.companion = new FrogCompanion(this, GAME.WIDTH * 0.5, GAME.HEIGHT * 0.58);

    this.add.text(GAME.WIDTH * 0.9, GAME.HEIGHT * 0.32, '恶龙城堡 →', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#f5d78a',
    }).setOrigin(0.5).setDepth(50);

    this.dialogue = new DialogueManager(this);
    this.affectionBar = new AffectionBar(this, GAME.WIDTH * 0.04, GAME.HEIGHT * 0.12);
    this.canExit = false;

    this.hint = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.93, 'WASD 移动 · E 对话 · 前往右侧城堡', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#d8e8d0',
    }).setOrigin(0.5).setDepth(50);

    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.mobile = createMobileControls(this, {
      attackLabel: '交互',
      skillLabels: ['谈', '行', ''],
      skillEnabled: [true, true, false],
    });

    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);

    registerTestHandler('pickDialogueChoice', (index) => this.dialogue.pickChoice(index));
    registerTestHandler('moveWarrior', (x, y) => {
      this.warrior.sprite.setPosition(x, y);
      this.warrior.sprite.body.setVelocity(0, 0);
      ySort(this.warrior.sprite);
    });
    registerTestHandler('exitToCastle', () => this.goToCastle());
  }

  onDialogueComplete() {
    if (gameState.hasFlag('tookFrog')) {
      this.companion.sprite.setPosition(this.warrior.x - 40, this.warrior.y);
      this.companion.enableFollow();
    }
    this.canExit = true;
    this.hint.setText('沿石径向东，前往恶龙城堡 →');
  }

  update() {
    if (gameState.hasFlag('tookFrog')) {
      this.canExit = true;
    }

    this.mobile.setEnabled(!gameState.dialogueActive && !gameState.qteActive);

    if (gameState.dialogueActive) {
      this.warrior.sprite.body.setVelocity(0, 0);
      const btn = this.mobile.consumeButtons();
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.dialogue.advance();
      }
      this.dialogue.pickFromMobileButtons(btn);
      return;
    }

    if (gameState.qteActive) {
      this.warrior.sprite.body.setVelocity(0, 0);
      return;
    }

    const move = this.mobile.getMovement();
    this.warrior.update({
      left: this.wasd.left.isDown || move.left,
      right: this.wasd.right.isDown || move.right,
      up: this.wasd.up.isDown || move.up,
      down: this.wasd.down.isDown || move.down,
    });

    if (this.companion.following) {
      this.companion.update(this.warrior.x, this.warrior.y);
    }
    ySort(this.frogNpc);

    const btn = this.mobile.consumeButtons();
    const interact = Phaser.Input.Keyboard.JustDown(this.interactKey) || btn.attack || btn.skill1;
    if (interact && this.isNearFrog()) {
      this.dialogue.start(swampDialogue);
    }

    if (btn.skill2 && this.canExit) {
      this.goToCastle();
    }

    if (this.canExit && this.warrior.x > GAME.WIDTH * 0.80) {
      this.goToCastle();
    }
  }

  isNearFrog() {
    const dx = this.warrior.x - this.frogNpc.x;
    const dy = this.warrior.y - this.frogNpc.y;
    return Math.hypot(dx, dy) < INTERACT.RANGE;
  }

  goToCastle() {
    if (this._leaving) return;
    this._leaving = true;
    gameState.phase = 'castle';
    this.cameras.main.fadeOut(TRANSITION.FADE_DURATION, 0, 0, 0);
    this.time.delayedCall(TRANSITION.FADE_DURATION, () => {
      this.scene.start('CastleScene');
    });
  }
}
