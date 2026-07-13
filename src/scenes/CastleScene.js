import Phaser from 'phaser';
import { GAME, UI, PRINCESS, TRANSITION, FROG } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import { Warrior } from '../entities/Warrior.js';
import { Dragon } from '../entities/Dragon.js';
import { DialogueManager } from '../systems/DialogueManager.js';
import { BattleSystem } from '../systems/BattleSystem.js';
import { playHelpCry } from '../systems/SimpleSFX.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { showSceneBackground, BG_KEYS } from '../art/BackgroundArt.js';
import { createDecorSprite, TEXTURE_KEYS, SHEET_KEYS } from '../art/AssetRegistry.js';
import { createMobileControls } from '../ui/MobileControls.js';
import castleIntro from '../../assets/dialogues/castle_intro.json';
import castleWin from '../../assets/dialogues/castle_win.json';
import castleLose from '../../assets/dialogues/castle_lose.json';

const REVEAL_X = GAME.WIDTH * 0.52;
const REVEAL_Y = GAME.HEIGHT * 0.52;
const APPROACH_TRIGGER = GAME.WIDTH * 0.38;

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
    this.dragonEntity = new Dragon(this, REVEAL_X, REVEAL_Y);
    this.dragonEntity.sprite.setVisible(false);

    this.princess = createDecorSprite(
      this, GAME.WIDTH * 0.85, GAME.HEIGHT * 0.58,
      TEXTURE_KEYS.PRINCESS, PRINCESS.HEIGHT, 28, 0, SHEET_KEYS.PRINCESS,
    );
    this.princess.setVisible(false);

    this.helpText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.18, '', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.HEADING_RATIO)}px`,
      color: '#ff8888',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(60).setVisible(false);

    this.dialogue = new DialogueManager(this);

    this.battle = new BattleSystem(this, {
      warrior: this.warrior,
      dragon: this.dragonEntity,
      onVictory: () => this.onBattleVictory(),
      onDefeat: () => this.onBattleDefeat(),
    });
    this.battle.warriorBar.container.setVisible(false);
    this.battle.dragonBar.container.setVisible(false);
    this.battle.hint.setVisible(false);

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

    this.revealDone = false;
    this.postDialogue = null;

    if (gameState.dragonDefeated) {
      this.state = 'done';
      this.hint.setVisible(false);
    } else {
      this.state = 'approach';
      this.hint.setText('朝城堡深处前进……');
      this.mobile.setLabels({ attack: '交互', skills: ['行', '谈', ''] });
      this.playHelpCry();
    }

    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);

    registerTestHandler('pickDialogueChoice', (index) => this.dialogue.pickChoice(index));
    registerTestHandler('advanceDialogue', () => this.dialogue.advance());
    registerTestHandler('forceBattleWin', () => {
      if (this.state === 'battle' && this.battle?.active) {
        this.battle.dragonHp = 0;
        this.battle.active = false;
        this.onBattleVictory();
      } else if (this.state === 'approach' || this.state === 'confirm') {
        this.skipToBattle();
        this.battle.dragonHp = 0;
        this.battle.active = false;
        this.onBattleVictory();
      }
    });
    registerTestHandler('forceBattleLose', () => {
      if (this.state === 'battle' && this.battle?.active) {
        this.battle.warriorHp = 0;
        this.battle.active = false;
        this.onBattleDefeat();
      } else if (this.state === 'approach' || this.state === 'confirm') {
        this.skipToBattle();
        this.battle.warriorHp = 0;
        this.battle.active = false;
        this.onBattleDefeat();
      }
    });
    registerTestHandler('moveWarrior', (x, y) => {
      this.warrior.sprite.setPosition(x, y);
      this.warrior.sprite.body.setVelocity(0, 0);
    });
  }

  playHelpCry() {
    this.helpText.setText('救命——！');
    this.helpText.setVisible(true);
    playHelpCry();
    this.time.delayedCall(1200, () => {
      if (this.state === 'approach') {
        this.helpText.setText('救命——！（这声音不像公主……）');
      }
    });
  }

  skipToBattle() {
    this.helpText.setVisible(false);
    this.princess.setVisible(false);
    this.dragonEntity.sprite.setVisible(true);
    this.dragonEntity.reset(REVEAL_X, REVEAL_Y);
    this.state = 'battle';
    this.battle.start();
    this.hint.setText('WASD 移动 · 空格/普攻发射激光');
    this.mobile.setLabels({ attack: '激光', skills: ['斩', '谈', ''] });
  }

  triggerReveal() {
    if (this.revealDone) return;
    this.revealDone = true;
    this.state = 'reveal';
    this.helpText.setVisible(false);
    this.hint.setText('');

    this.dragonEntity.sprite.setVisible(true);
    this.dragonEntity.sprite.setPosition(REVEAL_X + 40, REVEAL_Y);
    this.princess.setVisible(true);
    this.princess.setPosition(GAME.WIDTH * 0.78, GAME.HEIGHT * 0.55);

    this.tweens.add({
      targets: this.dragonEntity.sprite,
      x: REVEAL_X - 30,
      duration: 600,
      yoyo: true,
      repeat: 2,
    });
    this.tweens.add({
      targets: this.princess,
      x: REVEAL_X + 20,
      duration: 1800,
      onComplete: () => {
        this.state = 'confirm';
        this.dialogue.start(castleIntro);
      },
    });
  }

  onDialogueTrigger(trigger) {
    if (trigger === 'startBattle') {
      this.startBattle();
    } else if (trigger === 'chapterTwo') {
      this.playFrogTransform();
    }
  }

  onDialogueComplete() {}

  startBattle() {
    this.state = 'battle';
    this.princess.setVisible(false);
    this.dragonEntity.reset(REVEAL_X, REVEAL_Y);
    this.dragonEntity.sprite.setVisible(true);
    this.warrior.sprite.setPosition(GAME.WIDTH * 0.2, GAME.HEIGHT * 0.6);
    this.battle.start();
    this.hint.setText('WASD 移动 · 空格/普攻发射激光');
    this.mobile.setLabels({ attack: '激光', skills: ['斩', '谈', ''] });
  }

  onBattleVictory() {
    gameState.setFlag('battleOutcome', 'win');
    gameState.dragonDefeated = true;
    eventBus.emit(Events.DRAGON_DEFEATED);
    this.dragonEntity.sprite.setVisible(false);
    this.battle.stop();
    this.princess.setVisible(true);
    this.princess.setPosition(GAME.WIDTH * 0.65, GAME.HEIGHT * 0.55);
    this.state = 'postBattle';
    this.postDialogue = castleWin;
    this.dialogue.start(castleWin);
  }

  onBattleDefeat() {
    gameState.setFlag('battleOutcome', 'lose');
    this.battle.stop();
    this.state = 'postBattle';
    this.runLoseCutscene();
  }

  runLoseCutscene() {
    this.princess.setVisible(true);
    this.princess.setPosition(GAME.WIDTH * 0.75, GAME.HEIGHT * 0.55);
    this.dragonEntity.sprite.setVisible(true);

    this.tweens.add({
      targets: this.princess,
      x: this.dragonEntity.x,
      duration: 800,
      onComplete: () => {
        this.cameras.main.flash(300, 255, 255, 255);
        this.dragonEntity.sprite.setVisible(false);
        gameState.dragonDefeated = true;
        eventBus.emit(Events.DRAGON_DEFEATED);
        this.postDialogue = castleLose;
        this.dialogue.start(castleLose);
      },
    });
  }

  playFrogTransform() {
    gameState.setFlag('kissedPrincess', true);
    gameState.setFlag('princessRevealedFrog', true);
    gameState.dragonDefeated = true;
    gameState.chapter = 2;
    eventBus.emit(Events.KISS_REVEAL);
    eventBus.emit(Events.CHAPTER_CHANGED, { chapter: 2 });

    const px = this.princess.x;
    const py = this.princess.y;
    this.princess.setVisible(false);

    const frogReveal = createDecorSprite(this, px, py, TEXTURE_KEYS.FROG, FROG.HEIGHT * 1.1, 35);
    frogReveal.setScale(0.3);
    this.tweens.add({
      targets: frogReveal,
      scaleX: frogReveal.scaleX * 4,
      scaleY: frogReveal.scaleY * 4,
      duration: 2000,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.time.delayedCall(900, () => this.scene.start('PrincessScene'));
      },
    });
  }

  update() {
    if (this.state === 'done') return;

    if (gameState.dialogueActive) {
      this.warrior.sprite.body.setVelocity(0, 0);
      this.mobile.setEnabled(true);
      const btn = this.mobile.consumeButtons();
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.dialogue.advance();
      }
      this.dialogue.pickFromMobileButtons(btn);
      return;
    }

    if (this.state === 'approach') {
      this.mobile.setEnabled(true);
      const move = this.mobile.getMovement();
      this.warrior.update({
        left: this.wasd.left.isDown || move.left,
        right: this.wasd.right.isDown || move.right,
        up: this.wasd.up.isDown || move.up,
        down: this.wasd.down.isDown || move.down,
      });
      this.clampWarriorExplore();

      if (this.warrior.x >= APPROACH_TRIGGER) {
        this.triggerReveal();
      }
      return;
    }

    if (this.state === 'reveal') return;

    if (this.state === 'battle' && this.battle.active) {
      this.mobile.setEnabled(true);
      const btn = this.mobile.consumeButtons();
      const fire = Phaser.Input.Keyboard.JustDown(this.spaceKey) || btn.attack || btn.skill1;

      this.battle.update(
        {
          left: this.wasd.left.isDown || this.mobile.getMovement().left,
          right: this.wasd.right.isDown || this.mobile.getMovement().right,
          up: this.wasd.up.isDown || this.mobile.getMovement().up,
          down: this.wasd.down.isDown || this.mobile.getMovement().down,
        },
        this.time.now,
        fire,
      );
    }
  }

  clampWarriorExplore() {
    const x = Phaser.Math.Clamp(this.warrior.x, GAME.WIDTH * 0.05, GAME.WIDTH * 0.95);
    const y = Phaser.Math.Clamp(this.warrior.y, GAME.HEIGHT * 0.4, GAME.HEIGHT * 0.75);
    this.warrior.sprite.setPosition(x, y);
  }
}
