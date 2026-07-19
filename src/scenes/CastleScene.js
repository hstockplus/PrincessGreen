import Phaser from 'phaser';
import { GAME, COLORS, FONT, PLAYER, DRAGON } from '../utils/constants.js';
import { DialogBox } from '../ui/DialogBox.js';
import { HUD } from '../ui/HUD.js';
import { WarriorController } from '../utils/WarriorController.js';
import { gameState } from '../utils/gameState.js';
import { sound } from '../utils/sound.js';
import { eventBus, Events } from '../core/EventBus.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { MobileControls, isTouchDevice } from '../ui/MobileControls.js';
import { ASSETS, showBackground, fitSpriteHeight } from '../art/AssetLoader.js';

export class CastleScene extends Phaser.Scene {
  constructor() {
    super('CastleScene');
  }

  create() {
    gameState.phase = 'castle';
    sound.playBgm('castle');
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.cameras.main.flash(220, 30, 20, 40);
    this.drawCastle();
    this.createGround();

    this.warrior = new WarriorController(this, 160, GAME.HEIGHT - 70, { canAttack: true });
    this.physics.add.collider(this.warrior.sprite, this.ground);

    const dKey = this.textures.exists(ASSETS.DRAGON) ? ASSETS.DRAGON : 'tex_dragon';
    this.dragon = this.physics.add.sprite(GAME.WIDTH * 0.7, GAME.HEIGHT - 70, dKey);
    this.dragon.setOrigin(0.5, 1);
    fitSpriteHeight(this.dragon, GAME.HEIGHT * 0.28);
    this.dragon.setCollideWorldBounds(true);
    this.dragon.body.setAllowGravity(false);
    this.dragon.body.setSize(this.dragon.width * 0.5, this.dragon.height * 0.35);
    this.dragonHp = DRAGON.MAX_HP;
    this.dragonDir = -1;
    this.lastFire = 0;
    this.physics.add.collider(this.dragon, this.ground);

    const pKey = this.textures.exists(ASSETS.PRINCESS) ? ASSETS.PRINCESS : 'tex_princess';
    this.princess = this.add.image(GAME.WIDTH * 0.85, GAME.HEIGHT - 70, pKey).setOrigin(0.5, 1);
    fitSpriteHeight(this.princess, GAME.HEIGHT * 0.48);

    this.fireballs = this.physics.add.group();
    this.hud = new HUD(this);
    this.hud.setHint(isTouchDevice()
      ? '左摇杆移动 · 攻/跳 · 药回血 · 点击对话框继续'
      : 'J / 左键攻击 · Q 用灵芝 · 躲开火球 · 点击继续对话');
    this.dialog = new DialogBox(this);
    this.mobile = new MobileControls(this, { showAttack: true, showInteract: false });
    this.mobile.setEnabled(false);

    this.dragonBarBg = this.add.rectangle(GAME.WIDTH - 240, 24, 200, 16, 0x201010, 0.85).setOrigin(0, 0.5).setDepth(900);
    this.dragonBar = this.add.rectangle(GAME.WIDTH - 238, 24, 196, 12, 0x5a8a60, 1).setOrigin(0, 0.5).setDepth(901);
    this.dragonLabel = this.add.text(GAME.WIDTH - 240, 42, '恶龙', {
      fontFamily: FONT.FAMILY, fontSize: '14px', color: COLORS.UI_MUTED,
    }).setDepth(900);

    this.state = 'intro';
    this.setBattleUi(false);

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
      this.dragonHp = 0;
      this.dragon.setVisible(false);
      this.setBattleUi(false);
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

  setBattleUi(on) {
    this.dragonBarBg.setVisible(on);
    this.dragonBar.setVisible(on);
    this.dragonLabel.setVisible(on);
  }

  drawCastle() {
    showBackground(this, ASSETS.BG_CASTLE);
    this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.2).setDepth(-5);
    this.add.text(GAME.WIDTH / 2, 36, '第三幕 · 恶龙城堡', {
      fontFamily: FONT.FAMILY,
      fontSize: '24px',
      color: COLORS.GOLD_LIGHT,
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50);
  }

  createGround() {
    this.ground = this.physics.add.staticGroup();
    const ground = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT - 28, GAME.WIDTH, 56, 0x000000, 0);
    this.physics.add.existing(ground, true);
    this.ground.add(ground);
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
          { label: 'A. 按悬赏杀龙', id: 'fight' },
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
    await this.runKissReveal('lose');
  }

  startBattle() {
    this.state = 'battle';
    this.setBattleUi(true);
    this.princess.setVisible(false);
    this.mobile.setEnabled(true);
    this.hud.setHint(isTouchDevice()
      ? '摇杆走位 · 攻打龙 · 药回血'
      : 'J / 左键「金蟾刀法」· Q 灵芝回血 · 躲开火球');
    sound.playBgm('battle');
  }

  updateDragonHpBar() {
    const r = Phaser.Math.Clamp(this.dragonHp / DRAGON.MAX_HP, 0, 1);
    this.dragonBar.width = 196 * r;
  }

  spawnFireball() {
    const fb = this.fireballs.create(this.dragon.x - 40, this.dragon.y - 10, 'tex_fireball');
    fb.setBounce(0.2);
    fb.setVelocity(-220 + Phaser.Math.Between(-40, 40), -280);
    fb.setGravityY(GAME.GRAVITY);
    eventBus.emit(Events.FIREBALL);
    this.time.delayedCall(4000, () => fb.destroy());
  }

  updateBattle() {
    const pad = this.mobile.consume();
    this.warrior.setMobileState(pad);
    this.warrior.update(false);
    this.hud.refresh();
    this.updateDragonHpBar();

    this.dragon.setVelocityX(this.dragonDir * DRAGON.SPEED);
    if (this.dragon.x < GAME.WIDTH * 0.45) this.dragonDir = 1;
    if (this.dragon.x > GAME.WIDTH * 0.9) this.dragonDir = -1;
    this.dragon.setFlipX(this.dragonDir > 0);

    const now = this.time.now;
    if (now - this.lastFire > DRAGON.FIRE_COOLDOWN) {
      this.lastFire = now;
      this.spawnFireball();
    }

    // contact damage
    if (this.physics.overlap(this.warrior.sprite, this.dragon)) {
      this.warrior.takeDamage(DRAGON.CONTACT_DAMAGE);
      this.hud.refresh();
    }

    this.physics.overlap(this.warrior.sprite, this.fireballs, (w, fb) => {
      fb.destroy();
      this.warrior.takeDamage(DRAGON.FIRE_DAMAGE);
      this.hud.refresh();
    });

    // attack hit (tryAttack 已在 warrior.update 中触发)
    const hit = this.warrior.consumeHitBox();
    if (hit) {
      const dx = Math.abs(this.dragon.x - hit.x);
      const dy = Math.abs(this.dragon.y - hit.y);
      if (dx < 70 && dy < 50) {
        this.dragonHp -= hit.damage;
        this.dragon.setTint(0xffffff);
        this.time.delayedCall(80, () => this.dragon.clearTint());
        eventBus.emit(Events.HIT);
      }
    }

    if (this.dragonHp <= 0) {
      this.state = 'aftermath';
      this.dragon.setVisible(false);
      this.setBattleUi(false);
      gameState.branch = 'win';
      this.runKissReveal('win');
      return;
    }
    if (gameState.hp <= 0) {
      this.state = 'aftermath';
      this.setBattleUi(false);
      gameState.branch = 'lose';
      gameState.hp = 1;
      this.runKissReveal('lose');
    }
  }

  async runKissReveal(result) {
    this.state = 'reveal';
    this.mobile.setEnabled(false);
    this.warrior.sprite.setVelocity(0, 0);
    this.princess.setVisible(true).setPosition(GAME.WIDTH * 0.55, GAME.HEIGHT - 70);

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

    const beast = this.textures.exists(ASSETS.FROG_BEAST) ? ASSETS.FROG_BEAST : 'tex_frog_princess';
    this.princess.setTexture(beast);
    fitSpriteHeight(this.princess, GAME.HEIGHT * 0.42);
    this.cameras.main.flash(400, 40, 120, 60);
    eventBus.emit(Events.TRANSFORM);

    this.time.delayedCall(900, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(520, () => this.scene.start('ChaseScene'));
    });
  }

  update() {
    this.dialog.update();
    if (this.state === 'battle') this.updateBattle();
    else if (this.state === 'intro' || this.state === 'reveal' || this.state === 'aftermath') {
      this.mobile.setEnabled(false);
      this.warrior.update(true);
    }
  }
}
