import Phaser from 'phaser';
import { GAME, UI, WARRIOR, FROG_PRINCESS, TRANSITION } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import { FrogPrincess } from '../entities/FrogPrincess.js';
import { showChapterTitle } from '../ui/ChapterTitle.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { showSceneBackground, BG_KEYS } from '../art/BackgroundArt.js';
import { createDecorSprite, TEXTURE_KEYS, SHEET_KEYS } from '../art/AssetRegistry.js';
import { createMobileControls } from '../ui/MobileControls.js';

export class PrincessScene extends Phaser.Scene {
  constructor() {
    super('PrincessScene');
  }

  create() {
    gameState.phase = 'princess';
    gameState.chapter = 2;
    this.physics.world.gravity.y = 600;

    showSceneBackground(this, BG_KEYS.PRINCESS_PATH);

    const ground = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT * 0.86, GAME.WIDTH, GAME.HEIGHT * 0.04, 0x000000, 0);
    this.physics.add.existing(ground, true);

    this.player = new FrogPrincess(this, GAME.WIDTH * 0.2, GAME.HEIGHT * 0.72);
    this.physics.add.collider(this.player.sprite, ground);

    this.warrior = createDecorSprite(this, GAME.WIDTH * 0.75, GAME.HEIGHT * 0.72, TEXTURE_KEYS.WARRIOR, WARRIOR.HEIGHT, 30);

    this.hint = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.93, 'WASD 移动 · 空格 跳跃 · J 吐舌攻击', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#d0e8c8',
    }).setOrigin(0.5).setDepth(50);

    this.endText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.48, '', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.HEADING_RATIO)}px`,
      color: '#f5e8c0',
      align: 'center',
      stroke: '#1a2010',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50).setVisible(false);

    this.wasd = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);

    this.mobile = createMobileControls(this, {
      attackLabel: '普攻',
      skillLabels: ['跳', '舌', ''],
      skillEnabled: [true, true, false],
    });

    this.controlsEnabled = false;
    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);

    showChapterTitle(this, '第二幕', '青蛙公主 — 复仇记', () => {
      this.controlsEnabled = true;
    });

    registerTestHandler('moveWarrior', (x, y) => {
      this.player.sprite.setPosition(x, y);
      this.player.sprite.body.setVelocity(0, 0);
    });
  }

  update() {
    if (!this.controlsEnabled || gameState.storyComplete) return;

    this.mobile.setEnabled(true);
    const move = this.mobile.getMovement();
    const btn = this.mobile.consumeButtons();

    const jump = Phaser.Input.Keyboard.JustDown(this.spaceKey) || btn.skill1;
    this.player.update({
      left: this.wasd.left.isDown || move.left,
      right: this.wasd.right.isDown || move.right,
    }, jump);

    const attack = Phaser.Input.Keyboard.JustDown(this.attackKey) || btn.attack || btn.skill2;
    if (attack) {
      this.player.fireTongue();
      const dx = this.player.x - this.warrior.x;
      const dy = this.player.y - this.warrior.y;
      if (Math.hypot(dx, dy) < FROG_PRINCESS.TONGUE_RANGE) this.onWarriorHit();
    }
  }

  onWarriorHit() {
    if (gameState.warriorDefeated) return;
    gameState.warriorDefeated = true;
    gameState.storyComplete = true;
    eventBus.emit(Events.WARRIOR_DEFEATED);
    eventBus.emit(Events.STORY_COMPLETE);

    this.warrior.setVisible(false);
    this.hint.setVisible(false);
    this.endText.setText(
      gameState.affection >= 50
        ? '结局 A — 和平\n公主选择原谅勇士。'
        : '结局 B — 复仇\n勇士被变成青蛙，永远困在沼泽。'
    );
    this.endText.setVisible(true);
    this.cameras.main.flash(300, 180, 255, 120);
  }
}
