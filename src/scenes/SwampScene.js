import Phaser from 'phaser';
import { GAME, COLORS, FONT, ITEM } from '../utils/constants.js';
import { DialogBox } from '../ui/DialogBox.js';
import { HUD } from '../ui/HUD.js';
import { WarriorController } from '../utils/WarriorController.js';
import { gameState } from '../utils/gameState.js';
import { sound } from '../utils/sound.js';
import { eventBus, Events } from '../core/EventBus.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { MobileControls, isTouchDevice } from '../ui/MobileControls.js';
import { ASSETS, fitSpriteHeight } from '../art/AssetLoader.js';

export class SwampScene extends Phaser.Scene {
  constructor() {
    super('SwampScene');
  }

  create() {
    gameState.phase = 'swamp';
    sound.playBgm('swamp');
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.cameras.main.flash(200, 20, 40, 20);
    const worldW = GAME.WIDTH * 2.4;
    this.physics.world.setBounds(0, 0, worldW, GAME.HEIGHT);
    this.cameras.main.setBounds(0, 0, worldW, GAME.HEIGHT);

    this.drawSwamp(worldW);
    this.createGround(worldW);
    this.createLingzhi();
    this.createFrog();

    this.warrior = new WarriorController(this, 140, GAME.HEIGHT - 70);
    this.cameras.main.startFollow(this.warrior.sprite, true, 0.08, 0.08);
    this.physics.add.collider(this.warrior.sprite, this.ground);

    this.hud = new HUD(this);
    this.hud.setHint(isTouchDevice()
      ? '左摇杆前进 · 互动采集/对话 · 走到最右侧'
      : '← → 前进 · E 采集/对话 · 前往最右侧恶龙城堡');
    this.dialog = new DialogBox(this);
    this.mobile = new MobileControls(this, { showInteract: true, showAttack: false });
    this.talkedFrog = false;
    this.leaving = false;

    this.add.text(GAME.WIDTH / 2, 36, '第二幕 · 绝望沼泽', {
      fontFamily: FONT.FAMILY,
      fontSize: '24px',
      color: COLORS.GOLD_LIGHT,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(800);

    registerTestHandler('advanceDialogue', () => this.dialog.forceAdvance());
    registerTestHandler('pickDialogueChoice', (id) => this.dialog.forcePick(id));
    registerTestHandler('moveWarrior', (x, y) => {
      this.warrior.sprite.setPosition(x, y);
      this.warrior.sprite.body.setVelocity(0, 0);
    });
    registerTestHandler('exitToCastle', () => this.goToCastle());
  }

  goToCastle() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => this.scene.start('CastleScene'));
  }

  drawSwamp(worldW) {
    // 横向平铺水墨沼泽背景（去马里奥色块感）
    const tileW = GAME.WIDTH;
    for (let i = 0; i * tileW < worldW + tileW; i++) {
      const bg = this.add.image(i * tileW + tileW / 2, GAME.HEIGHT / 2, ASSETS.BG_SWAMP).setDepth(-10);
      bg.setDisplaySize(tileW + 4, GAME.HEIGHT);
    }
    this.add.rectangle(worldW / 2, GAME.HEIGHT / 2, worldW, GAME.HEIGHT, 0x000000, 0.18).setDepth(-9);

    this.add.particles(0, 0, 'tex_fireball', {
      x: { min: 0, max: worldW },
      y: { min: GAME.HEIGHT * 0.3, max: GAME.HEIGHT * 0.7 },
      tint: COLORS.SWAMP_FOG,
      scale: { start: 0.5, end: 1.4 },
      alpha: { start: 0.22, end: 0 },
      speedY: { min: -18, max: -4 },
      lifespan: 4200,
      frequency: 220,
      blendMode: 'ADD',
    });
  }

  createGround(worldW) {
    // 隐形地面碰撞 — 视觉完全交给背景
    this.ground = this.physics.add.staticGroup();
    const ground = this.add.rectangle(worldW / 2, GAME.HEIGHT - 28, worldW, 56, 0x000000, 0);
    this.physics.add.existing(ground, true);
    this.ground.add(ground);
  }

  createLingzhi() {
    this.lingzhiGroup = this.physics.add.staticGroup();
    const key = this.textures.exists(ASSETS.LINGZHI) ? ASSETS.LINGZHI : 'tex_lingzhi';
    const spots = [420, 780, 1200, 1650, 2100, 2550];
    spots.forEach((x) => {
      const item = this.lingzhiGroup.create(x, GAME.HEIGHT - 95, key);
      item.setOrigin(0.5, 1);
      fitSpriteHeight(item, 56);
      item.refreshBody();
      item.setData('taken', false);
      this.tweens.add({
        targets: item,
        y: item.y - 6,
        duration: 900 + Phaser.Math.Between(0, 200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  createFrog() {
    const key = this.textures.exists(ASSETS.FROG) ? ASSETS.FROG : 'tex_frog';
    this.frog = this.physics.add.staticImage(620, GAME.HEIGHT - 70, key).setOrigin(0.5, 1);
    fitSpriteHeight(this.frog, 90);
    this.frog.refreshBody();
    this.tweens.add({
      targets: this.frog,
      y: this.frog.y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
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
        eventBus.emit(Events.ITEM_PICKUP);
        this.hud.refresh();
      }
    });
  }

  update() {
    this.dialog.update();
    this.mobile.setEnabled(!this.dialog.active);
    const pad = this.mobile.consume();
    this.warrior.setMobileState(pad);
    this.warrior.update(this.dialog.active);
    this.hud.refresh();

    if (this.dialog.active) return;

    if (this.warrior.justInteract()) {
      const dFrog = Phaser.Math.Distance.Between(this.warrior.x, this.warrior.y, this.frog.x, this.frog.y);
      if (!this.talkedFrog && dFrog < 70) this.talkFrog();
      else this.tryCollect();
    }

    if (!this.leaving && this.warrior.x > GAME.WIDTH * 2.2) {
      this.goToCastle();
    }
  }
}
