import Phaser from 'phaser';
import { GAME, COLORS, FONT, DRAGON, WORLD } from '../utils/constants.js';
import { DialogBox } from '../ui/DialogBox.js';
import { HUD } from '../ui/HUD.js';
import { Warrior } from '../entities/Warrior.js';
import { DragonBoss } from '../entities/DragonBoss.js';
import { gameState } from '../utils/gameState.js';
import { sound } from '../utils/sound.js';
import { eventBus, Events } from '../core/EventBus.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { MobileControls, isTouchDevice } from '../ui/MobileControls.js';
import { ASSETS, showBackground, fitActor } from '../art/AssetLoader.js';
import { CombatFX } from '../fx/CombatFX.js';

export class CastleScene extends Phaser.Scene {
  constructor() {
    super('CastleScene');
  }

  create() {
    gameState.phase = 'castle';
    sound.playBgm('castle');
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.cameras.main.flash(220, 30, 20, 40);
    this.physics.world.setBounds(0, 0, GAME.WIDTH, GAME.HEIGHT);

    showBackground(this, ASSETS.BG_CASTLE);
    this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.2).setDepth(-5);
    this.add.text(GAME.WIDTH / 2, 36, '第三幕 · 恶龙城堡', {
      fontFamily: FONT.FAMILY,
      fontSize: '24px',
      color: COLORS.GOLD_LIGHT,
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50);

    const walkY = GAME.HEIGHT * 0.72;
    this.warrior = new Warrior(this, 160, walkY);

    this.boss = new DragonBoss(this, GAME.WIDTH * 0.68, walkY - 20);
    this.boss.onDefeat = () => {
      if (this.state !== 'battle') return;
      this.state = 'aftermath';
      this.boss.setHpVisible(false);
      gameState.branch = 'win';
      this.runKissReveal('win');
    };

    const pKey = this.textures.exists(ASSETS.PRINCESS) ? ASSETS.PRINCESS : null;
    if (pKey) {
      this.princess = this.add.image(GAME.WIDTH * 0.85, walkY, pKey).setOrigin(0.5, 1).setDepth(6);
      fitActor(this.princess, 'princess');
      this.princess.setFlipX(true); // 侧视朝右的立绘，面向恶龙（左）
    } else {
      // TODO: 替换为实际美术资源 — 红衣持剑女
      this.princess = this.add.rectangle(GAME.WIDTH * 0.85, walkY - 40, 36, 80, COLORS.PRINCESS, 1).setDepth(6);
    }

    this.hud = new HUD(this);
    this.hud.setQuest('探明公主与恶龙的真相');
    this.hud.setHint(isTouchDevice()
      ? '点击对话框继续 · 战斗时摇杆走位'
      : '空格继续对话 · 战斗：J 攻击 / K 刀气');
    this.dialog = new DialogBox(this);
    this.mobile = new MobileControls(this, {
      showAttack: true,
      showSkill: true,
      showInteract: false,
    });
    this.mobile.setEnabled(false);

    this.state = 'intro';

    registerTestHandler('advanceDialogue', () => this.dialog.forceAdvance());
    registerTestHandler('pickDialogueChoice', (id) => this.dialog.forcePick(id));
    registerTestHandler('forceBattleWin', () => {
      if (this.state === 'intro' || this.state === 'reveal') {
        this.dialog.hide();
        this.dialog.onComplete = null;
      }
      if (this.state !== 'battle' && this.state !== 'aftermath' && this.state !== 'reveal') {
        this.startBattle();
      }
      this.boss.hp = 0;
      this.boss.alive = false;
      this.boss.sprite.setVisible(false);
      this.boss.setHpVisible(false);
      gameState.branch = 'win';
      this.state = 'aftermath';
      this.runKissReveal('win');
    });
    registerTestHandler('moveWarrior', (x, y) => {
      this.warrior.sprite.setPosition(x, y);
      this.warrior.sprite.body.setVelocity(0, 0);
    });

    this.runIntro();
  }

  async runIntro() {
    const choice = await this.dialog.show([
      { speaker: '远处', text: '救命——！救命——！' },
      { speaker: '勇士', text: '这声音……不像公主。前面有动静。' },
      { speaker: '旁白', text: '你走近一看——恶龙缩在角落喊救命，公主正举着剑追它！' },
      { speaker: '勇士', text: '恶龙在喊救命？公主在追它？我完全看不懂了……' },
      ...(gameState.tookFrog
        ? [{ speaker: '青蛙守护者', text: '（低语）小心……事情也许不是悬赏令上写的那样。' }]
        : []),
      {
        speaker: '选择',
        text: '你要如何行动？',
        choices: [
          { label: 'A. 杀龙', id: 'fight' },
          { label: 'B. 质问公主', id: 'question' },
        ],
      },
    ]);

    if (choice === 'question') {
      gameState.choseFightDragon = false;
      gameState.branch = 'question';
      await this.runQuestionBranch();
    } else {
      gameState.choseFightDragon = true;
      this.startBattle();
    }
  }

  async runQuestionBranch() {
    await this.dialog.show([
      { speaker: '勇士', text: '公主殿下！这恶龙……为何是你在追杀它？' },
      { speaker: '公主', text: '少管闲事！这龙的魔力对我很重要——' },
      { speaker: '旁白', text: '公主一剑斩退恶龙，余波却将你震倒在地……' },
    ]);
    gameState.hp = Math.max(1, gameState.hp * 0.2);
    this.cameras.main.shake(400, 0.02);
    this.boss.sprite.setVisible(false);
    await this.runKissReveal('lose');
  }

  startBattle() {
    this.state = 'battle';
    this.boss.setHpVisible(true);
    this.princess.setVisible(false);
    this.mobile.setEnabled(true);
    this.hud.setQuest('击败恶龙');
    this.hud.setHint(isTouchDevice()
      ? '八向走位 · 攻/刀气打龙 · 药回血'
      : 'WASD 走位 · J 普攻 · K 金蟾刀气 · Q 灵芝');
    sound.playBgm('battle');
  }

  resolvePlayerHits() {
    const box = this.warrior.attackBox;
    if (box?.rect?.active && this.boss.alive) {
      if (!box.hitSet.has('dragon') && this.physics.overlap(box.rect, this.boss.sprite)) {
        box.hitSet.add('dragon');
        this.boss.takeDamage(box.damage);
        eventBus.emit(Events.HIT);
        CombatFX.hitSpark(this, this.boss.sprite.x, this.boss.sprite.y - 40);
      }
    }

    this.warrior.projectiles.forEach((qi) => {
      if (!qi.active || !this.boss.alive) return;
      if (!qi.canHit('dragon')) return;
      if (this.physics.overlap(qi.body, this.boss.sprite)) {
        qi.markHit('dragon');
        this.boss.takeDamage(qi.damage);
        eventBus.emit(Events.HIT);
        CombatFX.hitSpark(this, this.boss.sprite.x, this.boss.sprite.y - 40);
      }
    });
  }

  resolveBossHits() {
    if (!this.boss.alive) return;

    const claw = this.boss.getClawHitbox();
    if (claw?.active && this.physics.overlap(this.warrior.sprite, claw)) {
      this.warrior.takeDamage(DRAGON.CLAW_DAMAGE);
    }

    this.physics.overlap(this.warrior.sprite, this.boss.fireballs, (_w, fb) => {
      fb.destroy();
      this.warrior.takeDamage(DRAGON.FIRE_DAMAGE);
      eventBus.emit(Events.FIREBALL);
    });

    // 近身碰撞轻伤
    if (this.physics.overlap(this.warrior.sprite, this.boss.sprite)) {
      this.warrior.takeDamage(Math.floor(DRAGON.CLAW_DAMAGE * 0.5));
    }
  }

  updateBattle(time, delta) {
    const pad = this.mobile.consume();
    this.warrior.setMobileState(pad);
    this.warrior.update(delta, false);
    this.hud.refresh();

    this.boss.update(time, delta, this.warrior.x, this.warrior.y);
    this.resolvePlayerHits();
    this.resolveBossHits();

    if (this.state !== 'battle') return;

    if (gameState.hp <= 0) {
      this.state = 'aftermath';
      this.boss.setHpVisible(false);
      gameState.branch = 'lose';
      gameState.hp = 1;
      this.runKissReveal('lose');
    }
  }

  async runKissReveal(result) {
    this.state = 'reveal';
    this.mobile.setEnabled(false);
    this.warrior.sprite.setVelocity(0, 0);
    const walkY = GAME.HEIGHT * WORLD.WALK_Y_MAX * 0.95;
    this.princess.setVisible(true);
    if (this.princess.setPosition) {
      this.princess.setPosition(GAME.WIDTH * 0.55, GAME.HEIGHT * 0.72);
    }

    if (result === 'win') {
      await this.dialog.show([
        { speaker: '旁白', text: '恶龙倒下了。公主冲过来，脸色煞白。' },
        { speaker: '公主', text: '我的老天爷，你咋把它打死了呢？那样就没有了魔法，我只能寻找其他的龙……' },
        { speaker: '旁白', text: '公主气晕过去。你俯身吻了她，想把她唤醒。' },
      ]);
    } else {
      await this.dialog.show([
        { speaker: '旁白', text: '你倒在地上——公主冲过来，几招便将恶龙击退！' },
        { speaker: '勇士', text: '公主……你救了我。我……太感动了。' },
        { speaker: '旁白', text: '勇士情不自禁，送给公主一个吻。' },
      ]);
    }

    await this.dialog.show([
      { speaker: '公主', text: '你偷袭我！我想起小蝌蚪的童年，在夕阳下游泳……' },
      { speaker: '旁白', text: '公主的身体慢慢缩小，皮肤泛起绿色——她变回了青蛙。' },
    ]);

    const beast = this.textures.exists(ASSETS.FROG_BEAST) ? ASSETS.FROG_BEAST : null;
    if (beast && this.princess.setTexture) {
      this.princess.setTexture(beast);
      fitActor(this.princess, 'frogBeast');
      this.princess.setFlipX(false);
    } else if (this.princess.setFillStyle) {
      // TODO: 替换为实际美术资源 — 美人蛙公主
      this.princess.setFillStyle(COLORS.FROG, 1);
    }
    this.cameras.main.flash(400, 40, 120, 60);
    eventBus.emit(Events.TRANSFORM);

    this.time.delayedCall(900, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('ChaseScene'));
    });
  }

  update(time, delta) {
    this.dialog.update();
    if (this.state === 'battle') this.updateBattle(time, delta);
    else {
      this.mobile.setEnabled(false);
      this.warrior.update(delta, true);
      this.hud.refresh();
    }
  }
}
