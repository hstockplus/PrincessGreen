import Phaser from 'phaser';
import { GAME, UI, WARRIOR, FROG, TRANSITION } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import { Warrior } from '../entities/Warrior.js';
import { showChapterTitle } from '../ui/ChapterTitle.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { showSceneBackground, BG_KEYS } from '../art/BackgroundArt.js';
import { createDecorSprite, ySort, TEXTURE_KEYS } from '../art/AssetRegistry.js';
import { createMobileControls } from '../ui/MobileControls.js';
import { startAmbientMusic } from '../systems/SimpleSFX.js';

const EXIT_X = GAME.WIDTH * 0.92;
const CHASE_SPEED = WARRIOR.SPEED * 0.85;

export class PrincessScene extends Phaser.Scene {
  constructor() {
    super('PrincessScene');
  }

  create() {
    gameState.phase = 'princess';
    gameState.chapter = 2;
    this.physics.world.gravity.y = 0;

    showSceneBackground(this, BG_KEYS.PRINCESS_PATH);

    this.add.text(GAME.WIDTH * 0.08, GAME.HEIGHT * 0.06, '逃离 ←', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#f5d78a',
    }).setDepth(50);

    this.warrior = new Warrior(this, GAME.WIDTH * 0.15, GAME.HEIGHT * 0.62);
    this.frogPrincess = createDecorSprite(
      this, GAME.WIDTH * 0.05, GAME.HEIGHT * 0.65,
      TEXTURE_KEYS.FROG, FROG.HEIGHT * 1.2, 25,
    );

    this.hint = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.93, 'WASD 移动 · 逃到右侧 · J 化金蟾加速', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#d0e8c8',
    }).setOrigin(0.5).setDepth(50);

    this.endText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.48, '', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.HEADING_RATIO)}px`,
      color: '#f5e8c0',
      align: 'center',
      wordWrap: { width: GAME.WIDTH * 0.7 },
      stroke: '#1a2010',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50).setVisible(false);

    this.wasd = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
    });
    this.transformKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);

    this.mobile = createMobileControls(this, {
      attackLabel: '金蟾',
      skillLabels: ['跑', '冲', ''],
      skillEnabled: [true, true, false],
    });

    this.controlsEnabled = false;
    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);

    showChapterTitle(this, '第二幕', '青蛙公主 — 复仇记', () => {
      this.controlsEnabled = true;
    });

    registerTestHandler('moveWarrior', (x, y) => {
      this.warrior.sprite.setPosition(x, y);
      this.warrior.sprite.body.setVelocity(0, 0);
    });
    registerTestHandler('forceEscape', () => {
      this.onEscapeSuccess();
    });
    startAmbientMusic();
  }

  update() {
    if (!this.controlsEnabled || gameState.storyComplete) return;

    this.mobile.setEnabled(true);
    const move = this.mobile.getMovement();
    const btn = this.mobile.consumeButtons();

    this.warrior.update({
      left: this.wasd.left.isDown || move.left,
      right: this.wasd.right.isDown || move.right,
      up: this.wasd.up.isDown || move.up,
      down: this.wasd.down.isDown || move.down,
    });

    const transform = Phaser.Input.Keyboard.JustDown(this.transformKey) || btn.attack || btn.skill2;
    if (transform) {
      this.warrior.activateGoldenForm(3000);
      this.hint.setText('金蟾形态！快逃！');
    }

    this.clampWarrior();
    this.updateChase();

    if (this.warrior.x >= EXIT_X) {
      this.onEscapeSuccess();
    }

    const dist = Math.hypot(this.warrior.x - this.frogPrincess.x, this.warrior.y - this.frogPrincess.y);
    if (dist < GAME.WIDTH * 0.06 && !this.warrior.isGolden()) {
      this.hint.setText('公主追上来了！按 J 化金蟾逃跑！');
    }
  }

  clampWarrior() {
    const x = Phaser.Math.Clamp(this.warrior.x, GAME.WIDTH * 0.05, GAME.WIDTH * 0.98);
    const y = Phaser.Math.Clamp(this.warrior.y, GAME.HEIGHT * 0.4, GAME.HEIGHT * 0.75);
    this.warrior.sprite.setPosition(x, y);
  }

  updateChase() {
    const dx = this.warrior.x - this.frogPrincess.x;
    const dy = this.warrior.y - this.frogPrincess.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = this.warrior.isGolden() ? CHASE_SPEED * 0.6 : CHASE_SPEED;
    this.frogPrincess.x += (dx / dist) * speed * (this.game.loop.delta / 1000);
    this.frogPrincess.y += (dy / dist) * speed * (this.game.loop.delta / 1000);
    this.frogPrincess.setFlipX(dx < 0);
    ySort(this.frogPrincess, 25);
    ySort(this.warrior.sprite);
  }

  onEscapeSuccess() {
    if (gameState.storyComplete) return;
    gameState.warriorEscaped = true;
    gameState.storyComplete = true;
    eventBus.emit(Events.STORY_COMPLETE);

    this.controlsEnabled = false;
    this.hint.setVisible(false);
    this.warrior.activateGoldenForm(5000);
    this.endText.setText(
      '公主没有原谅你。\n你化作金蟾，消失在夕阳下的沼泽里……',
    );
    this.endText.setVisible(true);
    this.cameras.main.flash(300, 255, 215, 80);
  }
}
