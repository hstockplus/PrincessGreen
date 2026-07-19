import Phaser from 'phaser';
import { GAME, COLORS, FONT, ITEM } from '../utils/constants.js';
import { DialogBox } from '../ui/DialogBox.js';
import { HUD } from '../ui/HUD.js';
import { WarriorController } from '../utils/WarriorController.js';
import { gameState } from '../utils/gameState.js';
import { sound } from '../utils/sound.js';

export class SwampScene extends Phaser.Scene {
  constructor() {
    super('SwampScene');
  }

  create() {
    sound.playBgm('swamp');
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.physics.world.setBounds(0, 0, GAME.WIDTH * 2.2, GAME.HEIGHT);
    this.cameras.main.setBounds(0, 0, GAME.WIDTH * 2.2, GAME.HEIGHT);

    this.drawSwamp();
    this.createGround();
    this.createLingzhi();
    this.createFrog();

    this.warrior = new WarriorController(this, 120, GAME.HEIGHT - 160);
    this.cameras.main.startFollow(this.warrior.sprite, true, 0.08, 0.08);
    this.physics.add.collider(this.warrior.sprite, this.ground);

    this.hud = new HUD(this);
    this.hud.setHint('← → 移动 · 空格跳跃（二段跳）· E 采集/对话 · 前往最右侧');
    this.dialog = new DialogBox(this);
    this.talkedFrog = false;
    this.leaving = false;

    this.add.text(GAME.WIDTH / 2, 36, '第二幕 · 绝望沼泽', {
      fontFamily: FONT.FAMILY,
      fontSize: '24px',
      color: COLORS.GOLD_LIGHT,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(800);
  }

  drawSwamp() {
    const w = GAME.WIDTH * 2.2;
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a140e, 0x0a140e, COLORS.SWAMP, COLORS.SWAMP, 1);
    g.fillRect(0, 0, w, GAME.HEIGHT);

    // dead trees — 替换为精灵图资源
    for (let i = 0; i < 12; i++) {
      const x = 80 + i * 180 + Phaser.Math.Between(-20, 20);
      g.lineStyle(4, 0x1a2818, 0.9);
      g.lineBetween(x, GAME.HEIGHT - 120, x, GAME.HEIGHT - 280 - (i % 3) * 30);
      g.lineBetween(x, GAME.HEIGHT - 220, x - 40, GAME.HEIGHT - 260);
      g.lineBetween(x, GAME.HEIGHT - 240, x + 35, GAME.HEIGHT - 270);
    }

    // purple miasma particles
    this.add.particles(0, 0, 'tex_fireball', {
      x: { min: 0, max: w },
      y: { min: GAME.HEIGHT * 0.35, max: GAME.HEIGHT * 0.75 },
      tint: COLORS.SWAMP_FOG,
      scale: { start: 0.4, end: 1.2 },
      alpha: { start: 0.25, end: 0 },
      speedY: { min: -20, max: -5 },
      lifespan: 4000,
      frequency: 200,
      blendMode: 'ADD',
    });
  }

  createGround() {
    this.ground = this.physics.add.staticGroup();
    const tiles = Math.ceil((GAME.WIDTH * 2.2) / 64);
    for (let i = 0; i < tiles; i++) {
      const p = this.ground.create(i * 64 + 32, GAME.HEIGHT - 40, 'tex_platform');
      p.refreshBody();
    }
    // floating platforms
    [[400, 480], [700, 420], [1100, 500], [1500, 440], [1900, 480]].forEach(([x, y]) => {
      const p = this.ground.create(x, y, 'tex_platform');
      p.setScale(2, 1).refreshBody();
    });
  }

  createLingzhi() {
    this.lingzhiGroup = this.physics.add.staticGroup();
    const spots = [350, 680, 980, 1400, 1750, 2100];
    spots.forEach((x) => {
      // 替换为精灵图资源
      const item = this.lingzhiGroup.create(x, GAME.HEIGHT - 90, 'tex_lingzhi');
      item.setData('taken', false);
    });
  }

  createFrog() {
    // 替换为精灵图资源
    this.frog = this.physics.add.staticImage(520, GAME.HEIGHT - 88, 'tex_frog').setScale(1.6);
  }

  async talkFrog() {
    if (this.talkedFrog || this.dialog.active) return;
    this.talkedFrog = true;
    const choice = await this.dialog.show([
      {
        speaker: '会说话的青蛙',
        text: '旅人……你身上有金蟾之气。我是被诅咒公主的守护者。愿意带我去恶龙城堡吗？',
        choices: [
          { label: '带你一起走', id: 'yes' },
          { label: '你自己想办法', id: 'no' },
        ],
      },
    ]);
    if (choice === 'yes') {
      gameState.tookFrog = true;
      await this.dialog.show([{ speaker: '会说话的青蛙', text: '谢谢你，勇者。我会跟着你穿过这片沼泽。' }]);
      this.frog.setVisible(false);
    } else {
      await this.dialog.show([{ speaker: '会说话的青蛙', text: '好吧……我就在芦苇里看着。' }]);
    }
  }

  tryCollect() {
    this.lingzhiGroup.getChildren().forEach((item) => {
      if (item.getData('taken')) return;
      const d = Phaser.Math.Distance.Between(this.warrior.x, this.warrior.y, item.x, item.y);
      if (d < 50 && gameState.lingzhi < ITEM.BAG_MAX) {
        item.setData('taken', true);
        item.setVisible(false);
        gameState.lingzhi += 1;
        sound.play('pickup');
        this.hud.refresh();
      }
    });
  }

  update() {
    this.dialog.update();
    this.warrior.update(this.dialog.active);
    this.hud.refresh();

    if (this.dialog.active) return;

    if (Phaser.Input.Keyboard.JustDown(this.warrior.keys.e)) {
      const dFrog = Phaser.Math.Distance.Between(this.warrior.x, this.warrior.y, this.frog.x, this.frog.y);
      if (!this.talkedFrog && dFrog < 70) this.talkFrog();
      else this.tryCollect();
    }

    if (!this.leaving && this.warrior.x > GAME.WIDTH * 2.05) {
      this.leaving = true;
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, () => this.scene.start('CastleScene'));
    }
  }
}
