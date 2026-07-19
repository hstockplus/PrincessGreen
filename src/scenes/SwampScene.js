import Phaser from 'phaser';
import { GAME, COLORS, FONT, ITEM, BUG, WORLD } from '../utils/constants.js';
import { DialogBox } from '../ui/DialogBox.js';
import { HUD } from '../ui/HUD.js';
import { Warrior } from '../entities/Warrior.js';
import { SwampBug } from '../entities/SwampBug.js';
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
    this.createLingzhi();
    this.createFrog();
    this.createBugs();

    const walkY = GAME.HEIGHT * 0.72;
    this.warrior = new Warrior(this, 140, walkY);
    this.cameras.main.startFollow(this.warrior.sprite, true, 0.08, 0.08);

    this.hud = new HUD(this);
    this.hud.setQuest('前往地图东侧恶龙城堡');
    this.hud.setHint(isTouchDevice()
      ? '摇杆八向移动 · 互动采集/对话 · 攻/刀气练手'
      : 'WASD 八向移动 · J 攻击 · K 刀气 · E 采集/对话');
    this.dialog = new DialogBox(this);
    this.mobile = new MobileControls(this, {
      showInteract: true,
      showAttack: true,
      showSkill: true,
    });
    this.talkedFrog = false;
    this.leaving = false;
    this.bugHitCd = new Map();

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
    const tileW = GAME.WIDTH;
    for (let i = 0; i * tileW < worldW + tileW; i++) {
      const bg = this.add.image(i * tileW + tileW / 2, GAME.HEIGHT / 2, ASSETS.BG_SWAMP).setDepth(-10);
      bg.setDisplaySize(tileW + 4, GAME.HEIGHT);
    }
    this.add.rectangle(worldW / 2, GAME.HEIGHT / 2, worldW, GAME.HEIGHT, 0x000000, 0.18).setDepth(-9);

    // 平面地面纹理提示（非平台）
    // TODO: 替换为实际美术资源
    const floor = this.add.graphics().setDepth(-8);
    floor.fillStyle(0x1a2418, 0.35);
    floor.fillRect(0, GAME.HEIGHT * WORLD.WALK_Y_MIN, worldW, GAME.HEIGHT * (WORLD.WALK_Y_MAX - WORLD.WALK_Y_MIN + 0.05));
  }

  createLingzhi() {
    this.lingzhiGroup = this.physics.add.staticGroup();
    const key = this.textures.exists(ASSETS.LINGZHI) ? ASSETS.LINGZHI : null;
    const spots = [
      [420, 0.68], [780, 0.75], [1200, 0.62], [1650, 0.78], [2100, 0.7], [2550, 0.66],
    ];
    spots.forEach(([x, yR]) => {
      let item;
      if (key) {
        item = this.lingzhiGroup.create(x, GAME.HEIGHT * yR, key);
        item.setOrigin(0.5, 1);
        fitSpriteHeight(item, 56);
      } else {
        // TODO: 替换为实际美术资源 — 紫黑蘑菇
        const g = this.add.circle(x, GAME.HEIGHT * yR, 14, COLORS.LINGZHI, 1);
        this.physics.add.existing(g, true);
        item = g;
        this.lingzhiGroup.add(g);
      }
      item.refreshBody?.();
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
    const key = this.textures.exists(ASSETS.FROG) ? ASSETS.FROG : null;
    const fy = GAME.HEIGHT * 0.7;
    if (key) {
      this.frog = this.physics.add.staticImage(620, fy, key).setOrigin(0.5, 1);
      fitSpriteHeight(this.frog, 90);
      this.frog.refreshBody();
    } else {
      // TODO: 替换为实际美术资源 — 绿色小圆+金冠
      this.frog = this.add.circle(620, fy, 22, COLORS.FROG, 1);
      this.add.circle(620, fy - 18, 8, COLORS.GOLD, 1);
      this.physics.add.existing(this.frog, true);
    }
    this.tweens.add({
      targets: this.frog,
      y: this.frog.y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createBugs() {
    this.bugs = [];
    const spots = [
      [900, 0.65], [1400, 0.78], [1900, 0.6], [2300, 0.72],
    ];
    spots.forEach(([x, yR]) => {
      this.bugs.push(new SwampBug(this, x, GAME.HEIGHT * yR));
    });
  }

  async talkFrog() {
    if (this.talkedFrog || this.dialog.active) return;
    this.talkedFrog = true;
    const choice = await this.dialog.show([
      {
        speaker: '青蛙守护者',
        text: '旅人……你身上有金蟾之气。我是被诅咒公主的守护者。愿意带我去恶龙城堡吗？',
        choices: [
          { label: '带她同行', id: 'yes' },
          { label: '你自己想办法', id: 'no' },
        ],
      },
    ]);
    if (choice === 'yes') {
      gameState.tookFrog = true;
      await this.dialog.show([{ speaker: '青蛙守护者', text: '谢谢你，勇者。我会跟着你穿过这片沼泽。' }]);
      this.frog.setVisible(false);
      this.hud.setQuest('带上守护者，前往东侧城堡');
    } else {
      await this.dialog.show([{ speaker: '青蛙守护者', text: '好吧……我就在芦苇里看着。' }]);
    }
  }

  tryCollect() {
    this.lingzhiGroup.getChildren().forEach((item) => {
      if (item.getData('taken')) return;
      const d = Phaser.Math.Distance.Between(this.warrior.x, this.warrior.y, item.x, item.y);
      if (d < 60 && gameState.lingzhi < ITEM.BAG_MAX) {
        item.setData('taken', true);
        item.setVisible(false);
        gameState.lingzhi += 1;
        eventBus.emit(Events.ITEM_PICKUP);
        this.hud.refresh();
      }
    });
  }

  resolveCombat() {
    const box = this.warrior.attackBox;
    if (box?.rect?.active) {
      this.bugs.forEach((bug, i) => {
        if (!bug.alive) return;
        if (box.hitSet.has(i)) return;
        if (this.physics.overlap(box.rect, bug.sprite)) {
          box.hitSet.add(i);
          bug.takeDamage(box.damage);
          eventBus.emit(Events.HIT);
        }
      });
    }

    this.warrior.projectiles.forEach((qi) => {
      if (!qi.active) return;
      this.bugs.forEach((bug, i) => {
        if (!bug.alive) return;
        const id = `bug-${i}`;
        if (!qi.canHit(id)) return;
        if (this.physics.overlap(qi.body, bug.sprite)) {
          qi.markHit(id);
          bug.takeDamage(qi.damage);
          eventBus.emit(Events.HIT);
        }
      });
    });

    const now = this.time.now;
    this.bugs.forEach((bug, i) => {
      if (!bug.alive) return;
      if (this.physics.overlap(this.warrior.sprite, bug.sprite)) {
        const last = this.bugHitCd.get(i) || 0;
        if (now - last >= BUG.ATTACK_CD) {
          this.bugHitCd.set(i, now);
          this.warrior.takeDamage(BUG.DAMAGE);
        }
      }
    });
  }

  update(_time, delta) {
    this.dialog.update();
    this.mobile.setEnabled(!this.dialog.active);
    const pad = this.mobile.consume();
    this.warrior.setMobileState(pad);
    this.warrior.update(delta, this.dialog.active);
    this.hud.refresh();

    this.bugs.forEach((b) => b.update(_time, delta, this.warrior.x, this.warrior.y));

    if (this.dialog.active) return;

    this.resolveCombat();

    if (this.warrior.justInteract()) {
      const dFrog = Phaser.Math.Distance.Between(this.warrior.x, this.warrior.y, this.frog.x, this.frog.y);
      if (!this.talkedFrog && dFrog < 80) this.talkFrog();
      else this.tryCollect();
    }

    if (!this.leaving && this.warrior.x > GAME.WIDTH * 2.2) {
      this.goToCastle();
    }
  }
}
