import Phaser from 'phaser';
import { GAME, COLORS, FONT, CHASE, WORLD } from '../utils/constants.js';
import { HUD } from '../ui/HUD.js';
import { Warrior } from '../entities/Warrior.js';
import { gameState } from '../utils/gameState.js';
import { sound } from '../utils/sound.js';
import { eventBus, Events } from '../core/EventBus.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { MobileControls, isTouchDevice } from '../ui/MobileControls.js';
import { ASSETS, fitActor, setFacing } from '../art/AssetLoader.js';

const LEVEL_WIDTH = GAME.WIDTH * 4.5;

/**
 * 强制向右卷轴逃亡 — 上下躲避障碍，非平台跳跃
 */
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
    this.createHazards();

    const walkY = GAME.HEIGHT * 0.7;
    this.warrior = new Warrior(this, 220, walkY);
    this.cameras.main.startFollow(this.warrior.sprite, true, 0.12, 0.08);

    let beastKey = ASSETS.FROG_BEAST;
    if (!this.textures.exists(beastKey)) {
      // TODO: 替换为实际美术资源 — 巨大绿色青蛙
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(COLORS.FROG, 1);
      g.fillEllipse(60, 50, 120, 90);
      g.fillCircle(40, 30, 28);
      g.fillCircle(80, 30, 28);
      g.fillStyle(0xffee88, 1);
      g.fillCircle(32, 24, 6);
      g.fillCircle(72, 24, 6);
      g.generateTexture('frog_beast_ph', 120, 100);
      g.destroy();
      beastKey = 'frog_beast_ph';
    }
    this.frogPrincess = this.physics.add.sprite(40, walkY, beastKey);
    this.frogPrincess.setOrigin(0.5, 1);
    fitActor(this.frogPrincess, 'frogBeast');
    this.frogPrincess.body.setAllowGravity(false);
    this.frogPrincess.setImmovable(true);
    this.frogPrincess.setDepth(8);
    setFacing(this.frogPrincess, 1); // 追击时朝右（玩家前方）

    this.hud = new HUD(this);
    this.hud.setQuest('逃出密道！');
    this.hud.setHint(isTouchDevice()
      ? '强制右移！上下躲障 · 轻功瞬移无敌'
      : '强制右移！W/S 上下躲避 · Shift 金蟾脱壳');
    this.mobile = new MobileControls(this, {
      showDash: true,
      showInteract: false,
      showAttack: false,
      showSkill: false,
    });

    this.add.text(GAME.WIDTH / 2, 36, '第四幕 · 城堡密道逃亡', {
      fontFamily: FONT.FAMILY,
      fontSize: '24px',
      color: COLORS.GOLD_LIGHT,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(800);

    this.lastDash = -9999;
    this.scrollX = 0;
    this.failed = false;
    this.won = false;
    this.hazardCd = 0;

    this.dashText = this.add.text(GAME.WIDTH - 24, 100, '', {
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
    const tileW = GAME.WIDTH;
    for (let i = 0; i * tileW < LEVEL_WIDTH + tileW; i++) {
      const bg = this.add.image(i * tileW + tileW / 2, GAME.HEIGHT / 2, ASSETS.BG_CHASE).setDepth(-10);
      bg.setDisplaySize(tileW + 4, GAME.HEIGHT);
    }
    this.add.rectangle(LEVEL_WIDTH / 2, GAME.HEIGHT / 2, LEVEL_WIDTH, GAME.HEIGHT, 0x000000, 0.15).setDepth(-9);
  }

  createHazards() {
    // 上下分布的障碍柱 — 需上下躲避，非跳台
    this.hazards = this.physics.add.staticGroup();
    const layout = [
      [900, 0.55], [1300, 0.78], [1700, 0.5], [2200, 0.8],
      [2700, 0.58], [3200, 0.75], [3700, 0.52], [4200, 0.7], [4800, 0.6],
    ];
    layout.forEach(([x, yR]) => {
      // TODO: 替换为实际美术资源
      const rock = this.add.rectangle(x, GAME.HEIGHT * yR, 40, 48, 0x4a3020, 0.9)
        .setStrokeStyle(2, COLORS.BLOOD, 0.6);
      this.physics.add.existing(rock, true);
      this.hazards.add(rock);
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
      gameState.mp = gameState.maxMp;
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

    // 强制卷轴：镜头与下限持续右移
    this.scrollX += CHASE.SCROLL_SPEED * (delta / 1000);
    const minX = this.scrollX;
    if (this.warrior.x < minX + 90) {
      this.warrior.sprite.x = minX + 90;
    }
    this.cameras.main.scrollX = Math.max(this.cameras.main.scrollX, minX);

    const pad = this.mobile.consume();
    // 默认向右推进，仍可上下躲避、略微减速
    if (!pad.left && !pad.right) pad.right = true;
    this.warrior.setMobileState(pad);
    this.warrior.update(delta, false);

    // 限制在行走带
    const yMin = GAME.HEIGHT * WORLD.WALK_Y_MIN;
    const yMax = GAME.HEIGHT * WORLD.WALK_Y_MAX;
    this.warrior.sprite.y = Phaser.Math.Clamp(this.warrior.sprite.y, yMin, yMax);

    // 青蛙公主追击（身后）
    const targetX = this.warrior.x - 140;
    const dx = targetX - this.frogPrincess.x;
    this.frogPrincess.x += Math.sign(dx) * Math.min(Math.abs(dx), CHASE.PRINCESS_SPEED * (delta / 1000) * 1.15);
    this.frogPrincess.y = Phaser.Math.Clamp(
      Phaser.Math.Linear(this.frogPrincess.y, this.warrior.y, 0.08),
      yMin,
      yMax,
    );

    if (this.warrior.justDash()) this.tryDash();

    if (this.physics.overlap(this.warrior.sprite, this.frogPrincess)) {
      if (this.warrior.takeDamage(CHASE.CATCH_DAMAGE)) {
        this.hud.refresh();
        this.warrior.sprite.x += 50;
      }
    }

    if (this.physics.overlap(this.warrior.sprite, this.hazards)) {
      if (time > this.hazardCd) {
        this.hazardCd = time + 500;
        this.warrior.takeDamage(10);
      }
    }

    const cd = Math.max(0, CHASE.DASH_COOLDOWN - (time - this.lastDash));
    this.dashText.setText(cd > 0
      ? `金蟾脱壳 ${Math.ceil(cd / 1000)}s`
      : (isTouchDevice() ? '金蟾脱壳就绪 [轻功]' : '金蟾脱壳就绪 [Shift]'));

    this.hud.refresh();
    if (gameState.hp <= 0) this.fail();
    if (this.warrior.x > LEVEL_WIDTH - 120) this.win();
  }
}
