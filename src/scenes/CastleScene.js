import Phaser from 'phaser';
import { GAME, UI, INTERACT, PRINCESS, TRANSITION, FROG } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import { Warrior } from '../entities/Warrior.js';
import { Dragon } from '../entities/Dragon.js';
import { DialogueManager } from '../systems/DialogueManager.js';
import { BattleSystem } from '../systems/BattleSystem.js';
import { DefeatOverlay } from '../ui/DefeatOverlay.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { showSceneBackground, BG_KEYS } from '../art/BackgroundArt.js';
import { createDecorSprite, TEXTURE_KEYS, SHEET_KEYS } from '../art/AssetRegistry.js';
import { createMobileControls } from '../ui/MobileControls.js';
import castleDialogue from '../../assets/dialogues/castle.json';

export class CastleScene extends Phaser.Scene {
  constructor() {
    super('CastleScene');
  }

  create() {
    gameState.phase = 'castle';
    this.physics.world.gravity.y = 0;

    showSceneBackground(this, BG_KEYS.CASTLE);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.06, '恶龙城堡', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.HEADING_RATIO)}px`,
      color: '#ffd878',
      stroke: '#301020',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);

    this.warrior = new Warrior(this, GAME.WIDTH * 0.12, GAME.HEIGHT * 0.62);
    this.dragonEntity = new Dragon(this, GAME.WIDTH * 0.5, GAME.HEIGHT * 0.48);

    this.princess = createDecorSprite(
      this, GAME.WIDTH * 0.78, GAME.HEIGHT * 0.58,
      TEXTURE_KEYS.PRINCESS, PRINCESS.HEIGHT, 28, 0, SHEET_KEYS.PRINCESS
    );
    this.princess.setVisible(false);
    this.princess.setInteractive({ useHandCursor: true });
    this.princess.on('pointerdown', () => {
      if (this.princess.visible && !gameState.dialogueActive) {
        this.dialogue.start(castleDialogue);
      }
    });

    this.dialogue = new DialogueManager(this);

    this.defeatOverlay = new DefeatOverlay(this, {
      onRetry: () => this.battle?.retry(),
    });

    this.battle = new BattleSystem(this, {
      warrior: this.warrior,
      dragon: this.dragonEntity,
      onVictory: () => this.onDragonDefeated(),
      onDefeat: () => this.defeatOverlay.show(),
    });

    this.state = gameState.dragonDefeated ? 'explore' : 'battle';
    this.hint = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.93, '', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#d8c8e8',
    }).setOrigin(0.5).setDepth(50);

    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.mobile = createMobileControls(this, {
      attackLabel: '普攻',
      skillLabels: ['斩', '谈', ''],
      skillEnabled: [true, true, false],
    });

    if (!gameState.dragonDefeated) {
      this.hint.setText('WASD 闪避 · 恶龙虚弱时按空格/普攻反击');
      this.mobile.setLabels({ attack: '普攻', skills: ['斩', '谈', ''] });
      this.battle.start();
      this.dragonEntity.sprite.setVisible(true);
    } else {
      this.onDragonDefeated(false);
      this.dragonEntity.sprite.setVisible(false);
      this.battle.active = false;
      this.battle.hint.setVisible(false);
      this.battle.warriorBar.container.setVisible(false);
      this.battle.dragonBar.container.setVisible(false);
    }

    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);

    registerTestHandler('pickDialogueChoice', (index) => this.dialogue.pickChoice(index));
    registerTestHandler('forceQTESuccess', () => {
      if (this.battle?.qte?.active) this.battle.qte.finish(true);
    });
    registerTestHandler('forceBattleWin', () => {
      if (this.state !== 'battle' || !this.battle) return;
      this.battle.dragonHp = 0;
      this.battle.active = false;
      this.onDragonDefeated();
    });
    registerTestHandler('moveWarrior', (x, y) => {
      this.warrior.sprite.setPosition(x, y);
      this.warrior.sprite.body.setVelocity(0, 0);
    });
  }

  onDragonDefeated(animate = true) {
    gameState.dragonDefeated = true;
    eventBus.emit(Events.DRAGON_DEFEATED);
    this.dragonEntity.sprite.setVisible(false);
    this.battle.active = false;
    this.battle.hint.setVisible(false);
    this.battle.warriorBar.container.setVisible(false);
    this.battle.dragonBar.container.setVisible(false);
    this.battle.warning.setVisible(false);
    this.princess.setVisible(true);
    this.state = 'explore';
    this.hint.setText('靠近公主，交互键对话');
    this.mobile.setLabels({ attack: '交互', skills: ['谈', '行', ''] });
    if (animate) this.cameras.main.flash(200, 255, 220, 180);
  }

  onDialogueTrigger(trigger) {
    if (trigger === 'chapterTwo') this.startChapterTwo();
  }

  onDialogueComplete() {}

  startChapterTwo() {
    gameState.chapter = 2;
    gameState.phase = 'princess';
    eventBus.emit(Events.KISS_REVEAL);
    eventBus.emit(Events.CHAPTER_CHANGED, { chapter: 2 });

    this.princess.setFrame(2);
    this.princess.setVisible(false);
    const frogReveal = createDecorSprite(this, this.princess.x, this.princess.y, TEXTURE_KEYS.FROG, FROG.HEIGHT * 1.1, 35);
    this.tweens.add({ targets: frogReveal, scaleX: frogReveal.scaleX * 1.3, scaleY: frogReveal.scaleY * 1.3, duration: 600 });

    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.time.delayedCall(900, () => this.scene.start('PrincessScene'));
  }

  update() {
    const inQte = gameState.qteActive;

    if (this.state === 'battle' && this.battle.active) {
      this.mobile.setEnabled(!gameState.dialogueActive && !inQte);

      if (gameState.dialogueActive) {
        this.warrior.sprite.body.setVelocity(0, 0);
        const btn = this.mobile.consumeButtons();
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
          this.dialogue.advance();
        }
        this.dialogue.pickFromMobileButtons(btn);
        return;
      }

      const btn = this.mobile.consumeButtons();
      if (inQte && (btn.attack || btn.skill1 || Phaser.Input.Keyboard.JustDown(this.spaceKey))) {
        this.battle.qte.tryHit();
      }

      const move = this.mobile.getMovement();
      this.battle.update(
        {
          left: this.wasd.left.isDown || move.left,
          right: this.wasd.right.isDown || move.right,
          up: this.wasd.up.isDown || move.up,
          down: this.wasd.down.isDown || move.down,
        },
        this.time.now
      );
      return;
    }

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

    if (this.state !== 'explore') return;

    const move = this.mobile.getMovement();
    this.warrior.update({
      left: this.wasd.left.isDown || move.left,
      right: this.wasd.right.isDown || move.right,
      up: this.wasd.up.isDown || move.up,
      down: this.wasd.down.isDown || move.down,
    });

    const btn = this.mobile.consumeButtons();
    const interact = Phaser.Input.Keyboard.JustDown(this.interactKey) || btn.attack || btn.skill1;
    if (interact && this.isNearPrincess()) {
      this.dialogue.start(castleDialogue);
    }
  }

  isNearPrincess() {
    if (!this.princess.visible) return false;
    const dx = this.warrior.x - this.princess.x;
    const dy = this.warrior.y - this.princess.y;
    return Math.hypot(dx, dy) < INTERACT.RANGE * 1.2;
  }
}
