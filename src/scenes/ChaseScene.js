import Phaser from 'phaser';
import { GAME, COLORS, FONT, CHASE } from '../utils/constants.js';
import { HUD } from '../ui/HUD.js';
import { WarriorController } from '../utils/WarriorController.js';
import { gameState } from '../utils/gameState.js';
import { sound } from '../utils/sound.js';
import { eventBus, Events } from '../core/EventBus.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { MobileControls, isTouchDevice } from '../ui/MobileControls.js';

const LEVEL_WIDTH = GAME.WIDTH * 4.5;

export class ChaseScene extends Phaser.Scene {
  constructor() {
    super('ChaseScene');
  }

  create() {
    gameState.phase = 'chase';
    sound.playBgm('chase');
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.cameras.main.flash(200, 60, 20, 20);
    gameState.hp = Math.max(gameState.hp, 40);

    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME.HEIGHT);
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, GAME.HEIGHT);

    this.drawTunnel();
    this.createGroundAndHazards();

    this.warrior = new WarriorController(this, 200, GAME.HEIGHT - 180);
    this.physics.add.collider(this.warrior.sprite, this.ground);
    this.cameras.main.startFollow(this.warrior.sprite, true, 0.12, 0.08);

    // 替换为精灵图资源 — 巨大化青蛙公主
    this.frogPrincess = this.physics.add.sprite(40, GAME.HEIGHT - 160, 'tex_frog_princess');
    this.frogPrincess.setScale(2.2);
    this.frogPrincess.body.setAllowGravity(false);
    this.frogPrincess.setImmovable(true);

    this.hud = new HUD(this);
    this.hud.setHint(isTouchDevice()
      ? '强制前进！跳躲避 · 轻功无敌冲刺'
      : '强制前进！空格跳跃 · Shift 金蟾脱壳（无敌冲刺）');
    this.mobile = new MobileControls(this, { showDash: true, showInteract: false, showAttack: false });
    this.add.text(GAME.WIDTH / 2, 36, '第四幕 · 青蛙公主复仇记', {
      fontFamily: FONT.FAMILY,
      fontSize: '24px',
      color: COLORS.GOLD_LIGHT,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(800);

    this.lastDash = -9999;
    this.scrollX = 0;
    this.failed = false;
    this.won = false;

    this.dashText = this.add.text(GAME.WIDTH - 24, 70, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '16px',
      color: COLORS.GOLD_LIGHT,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(900);

    registerTestHandler('forceEscape', () => this.win());
    registerTestHandler('moveWarrior', (x, y) => {
      this.warrior.sprite.setPosition(x, y);
      this.warrior.sprite.body.setVelocity(0, 0);
    });
  }

  drawTunnel() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x120810, 0x120810, 0x1a1018, 0x1a1018, 1);
    g.fillRect(0, 0, LEVEL_WIDTH, GAME.HEIGHT);
    for (let i = 0; i < 30; i++) {
      const x = i * 180;
      g.fillStyle(0x2a1820, 0.5);
      g.fillRect(x, 0, 40, 80 + (i % 4) * 20);
      g.fillRect(x + 60, GAME.HEIGHT - 160, 50, 160);
    }
  }

  createGroundAndHazards() {
    this.ground = this.physics.add.staticGroup();
    const tiles = Math.ceil(LEVEL_WIDTH / 64);
    for (let i = 0; i < tiles; i++) {
      this.ground.create(i * 64 + 32, GAME.HEIGHT - 40, 'tex_platform').refreshBody();
    }

    // gaps / platforms
    const plats = [
      [600, 500], [900, 430], [1200, 500], [1500, 400],
      [1900, 480], [2300, 420], [2700, 500], [3100, 440],
      [3500, 480], [4000, 420], [4500, 500],
    ];
    plats.forEach(([x, y]) => {
      this.ground.create(x, y, 'tex_platform').setScale(2.5, 1).refreshBody();
    });

    // spikes — 视觉三角 + 矩形碰撞
    this.hazards = this.physics.add.staticGroup();
    [800, 1600, 2500, 3300, 4100].forEach((x) => {
      this.add.triangle(x, GAME.HEIGHT - 70, 0, 30, 15, 0, 30, 30, COLORS.BLOOD);
      const body = this.hazards.create(x, GAME.HEIGHT - 62, 'tex_platform');
      body.setVisible(false).setSize(28, 28).refreshBody();
    });
  }

  tryDash() {
    const now = this.time.now;
    if (now - this.lastDash < CHASE.DASH_COOLDOWN) return;
    this.lastDash = now;
    eventBus.emit(Events.DASH);
    this.warrior.sprite.x += CHASE.DASH_DISTANCE;
    this.warrior.invulnUntil = now + CHASE.DASH_INVULN;
    this.warrior.sprite.setTint(0xffd700);
    this.time.delayedCall(CHASE.DASH_INVULN, () => this.warrior.sprite.clearTint());
    this.cameras.main.flash(80, 255, 220, 100);
  }

  fail() {
    if (this.failed || this.won) return;
    this.failed = true;
    sound.play('hurt');
    this.add.text(this.cameras.main.scrollX + GAME.WIDTH / 2, GAME.HEIGHT / 2, '被追上了……重来', {
      fontFamily: FONT.FAMILY,
      fontSize: '36px',
      color: '#ff8888',
    }).setOrigin(0.5).setDepth(1000);
    this.time.delayedCall(1200, () => {
      gameState.hp = 80;
      this.scene.restart();
    });
  }

  win() {
    if (this.won || this.failed) return;
    this.won = true;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(520, () => this.scene.start('EndingScene'));
  }

  update(time, delta) {
    if (this.failed || this.won) return;

    // auto-scroll pressure: push warrior right-ish via camera left bound advancing
    this.scrollX += CHASE.SCROLL_SPEED * (delta / 1000) * 0.35;
    const minX = this.scrollX;
    if (this.warrior.x < minX + 80) {
      this.warrior.sprite.x = minX + 80;
    }

    const pad = this.mobile.consume();
    // 逃生关强制向右倾向
    if (!pad.left && !pad.right) pad.right = true;
    this.warrior.setMobileState(pad);
    this.warrior.update(false);

    // frog princess chases
    const targetX = this.warrior.x - 120;
    const dx = targetX - this.frogPrincess.x;
    this.frogPrincess.x += Math.sign(dx) * Math.min(Math.abs(dx), CHASE.PRINCESS_SPEED * (delta / 1000) * 1.2);
    this.frogPrincess.y = this.warrior.y - 10;

    if (this.warrior.justDash()) {
      this.tryDash();
    }

    // catch
    if (this.physics.overlap(this.warrior.sprite, this.frogPrincess)) {
      if (this.warrior.takeDamage(CHASE.CATCH_DAMAGE)) {
        this.hud.refresh();
        this.warrior.sprite.x += 40;
      }
    }

    this.physics.overlap(this.warrior.sprite, this.hazards, () => {
      this.warrior.takeDamage(10);
      this.hud.refresh();
    });

    const cd = Math.max(0, CHASE.DASH_COOLDOWN - (time - this.lastDash));
    this.dashText.setText(cd > 0
      ? `金蟾脱壳 ${Math.ceil(cd / 1000)}s`
      : (isTouchDevice() ? '金蟾脱壳就绪 [轻功]' : '金蟾脱壳就绪 [Shift]'));

    this.hud.refresh();
    if (gameState.hp <= 0) this.fail();
    if (this.warrior.x > LEVEL_WIDTH - 120) this.win();
  }
}
