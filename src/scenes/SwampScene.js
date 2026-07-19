import Phaser from 'phaser';
import { GAME, COLORS, FONT, ITEM } from '../utils/constants.js';
import { DialogBox } from '../ui/DialogBox.js';
import { HUD } from '../ui/HUD.js';
import { Warrior } from '../entities/Warrior.js';
import { createSwampEnemy } from '../entities/enemies/SwampEnemies.js';
import { gameState } from '../utils/gameState.js';
import { sound } from '../utils/sound.js';
import { eventBus, Events } from '../core/EventBus.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { MobileControls, isTouchDevice } from '../ui/MobileControls.js';
import { ASSETS, fitActor, fitSpriteHeight } from '../art/AssetLoader.js';
import { ParallaxBackground, setupFollowCamera } from '../world/ParallaxBackground.js';
import { CombatFX } from '../fx/CombatFX.js';

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

    this.parallax = new ParallaxBackground(this, ASSETS.BG_SWAMP, worldW, { overlay: 0.2 });
    this.createLingzhi();
    this.createFrog();
    this.createEnemies();

    const walkY = GAME.HEIGHT * 0.72;
    this.warrior = new Warrior(this, 140, walkY);
    setupFollowCamera(this, this.warrior.sprite, { lerp: 0.12 });

    this.hud = new HUD(this);
    this.hud.setQuest('前往地图东侧恶龙城堡');
    this.hud.setHint(isTouchDevice()
      ? '摇杆移动 · 攻/刀气 · 小心不同小怪的攻击'
      : 'WASD 移动 · J 攻 · K 刀气 · 毒虫贴身 / 沼蛊吐息 / 蛮鳄冲锋 / 石蟹砸地');
    this.dialog = new DialogBox(this);
    this.mobile = new MobileControls(this, {
      showInteract: true,
      showAttack: true,
      showSkill: true,
    });
    this.talkedFrog = false;
    this.leaving = false;

    this.add.text(GAME.WIDTH / 2, 36, '第二幕 · 绝望沼泽', {
      fontFamily: FONT.FAMILY,
      fontSize: '24px',
      color: COLORS.GOLD_LIGHT,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(800);

    // 图例
    this.add.text(24, GAME.HEIGHT - 52, '毒虫·贴身  沼蛊·吐息  蛮鳄·冲锋  石蟹·砸地', {
      fontFamily: FONT.FAMILY,
      fontSize: '13px',
      color: COLORS.UI_MUTED,
    }).setScrollFactor(0).setDepth(800);

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
      fitActor(this.frog, 'frog');
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

  createEnemies() {
    this.enemies = [];
    // 沿途混合布置四种小怪
    const spots = [
      ['bug', 880, 0.66],
      ['spitter', 1100, 0.58],
      ['bug', 1350, 0.76],
      ['charger', 1580, 0.68],
      ['slammer', 1850, 0.72],
      ['spitter', 2050, 0.55],
      ['charger', 2280, 0.7],
      ['slammer', 2480, 0.64],
      ['bug', 2650, 0.78],
      ['spitter', 2800, 0.6],
    ];
    spots.forEach(([type, x, yR]) => {
      this.enemies.push(createSwampEnemy(this, type, x, GAME.HEIGHT * yR));
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
      if (d < 70 && gameState.lingzhi < ITEM.BAG_MAX) {
        item.setData('taken', true);
        item.setVisible(false);
        gameState.lingzhi += 1;
        eventBus.emit(Events.ITEM_PICKUP, { id: 'lingzhi', amount: 1, left: gameState.lingzhi });
        eventBus.emit(Events.HUD_REFRESH);
        CombatFX.pickupPop(this, item.x, item.y, '+灵芝');
        this.hud.refresh();
      }
    });
  }

  resolveCombat() {
    const box = this.warrior.attackBox;
    if (box?.rect?.active) {
      this.enemies.forEach((enemy, i) => {
        if (!enemy.alive) return;
        if (box.hitSet.has(i)) return;
        if (this.physics.overlap(box.rect, enemy.sprite)) {
          box.hitSet.add(i);
          enemy.takeDamage(box.damage);
          eventBus.emit(Events.HIT);
          CombatFX.hitSpark(this, enemy.sprite.x, enemy.sprite.y - 20);
        }
      });
    }

    this.warrior.projectiles.forEach((qi) => {
      if (!qi.active) return;
      this.enemies.forEach((enemy, i) => {
        if (!enemy.alive) return;
        const id = `e-${i}`;
        if (!qi.canHit(id)) return;
        if (this.physics.overlap(qi.body, enemy.sprite)) {
          qi.markHit(id);
          enemy.takeDamage(qi.damage);
          eventBus.emit(Events.HIT);
          CombatFX.hitSpark(this, enemy.sprite.x, enemy.sprite.y - 20);
        }
      });
    });

    // 各小怪特殊攻击判定
    this.enemies.forEach((enemy) => {
      if (!enemy.alive) return;

      // 冲锋 / 砸地 hitbox
      const hb = enemy.getAttackHitbox?.();
      if (hb?.active && this.physics.overlap(this.warrior.sprite, hb)) {
        if (this.warrior.takeDamage(enemy.cfg.DAMAGE)) {
          this.hud.refresh();
        }
      }

      // 沼蛊毒液弹
      enemy.getProjectiles?.().forEach((shot) => {
        if (!shot.active) return;
        if (this.physics.overlap(this.warrior.sprite, shot)) {
          const dmg = shot.getData('damage') || enemy.cfg.DAMAGE;
          shot.destroy();
          if (this.warrior.takeDamage(dmg)) this.hud.refresh();
        }
      });
    });
  }

  update(_time, delta) {
    this.dialog.update();
    this.mobile.setEnabled(!this.dialog.active);
    const pad = this.mobile.consume();
    this.warrior.setMobileState(pad);
    this.warrior.update(delta, this.dialog.active);
    this.hud.refresh();

    // 同步冲锋 hitbox 位置
    this.enemies.forEach((e) => {
      const dmgReq = e.update(_time, delta, this.warrior.x, this.warrior.y);
      if (dmgReq && !this.dialog.active) {
        if (this.warrior.takeDamage(dmgReq.damage)) this.hud.refresh();
      }
      if (e.state === 'charging' && e.hitbox?.active && e.sprite?.active) {
        e.hitbox.x = e.sprite.x;
        e.hitbox.y = e.sprite.y;
      }
    });

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
