import Phaser from 'phaser';
import { GAME, UI, BATTLE, PX } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { QTESystem } from './QTESystem.js';
import { BattleHpBar } from '../ui/BattleHpBar.js';

export class BattleSystem {
  constructor(scene, { warrior, dragon, onVictory, onDefeat }) {
    this.scene = scene;
    this.warrior = warrior;
    this.dragon = dragon;
    this.onVictory = onVictory;
    this.onDefeat = onDefeat;

    this.warriorHp = BATTLE.WARRIOR_HP;
    this.dragonHp = BATTLE.DRAGON_HP;
    this.active = false;
    this.stunnedUntil = 0;
    this.pendingQte = false;

    this.warriorStart = { x: warrior.x, y: warrior.y };
    this.dragonStart = { x: dragon.x, y: dragon.y };

    this.warriorBar = new BattleHpBar(scene, GAME.WIDTH * 0.12, GAME.HEIGHT * 0.1, '勇士', 0xc0392b);
    this.dragonBar = new BattleHpBar(scene, GAME.WIDTH * 0.88, GAME.HEIGHT * 0.1, '恶龙', 0x8e44ad, true);

    this.warning = scene.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.22, '', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.HEADING_RATIO)}px`,
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(850).setVisible(false);

    this.hint = scene.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.16, '闪避恶龙冲刺，在它虚弱时按空格反击', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#d8c8e8',
    }).setOrigin(0.5).setDepth(850);

    this.arenaGfx = scene.add.graphics().setDepth(5);
    this.drawArena();

    this.qte = new QTESystem(scene, {
      onComplete: () => this.onQteSuccess(),
      onFail: () => this.onQteFail(),
    });

    this.updateBars();
  }

  drawArena() {
    const a = BATTLE.ARENA;
    this.arenaGfx.clear();
    this.arenaGfx.lineStyle(2 * PX, 0xc9a227, 0.25);
    this.arenaGfx.strokeRect(
      GAME.WIDTH * a.X_MIN,
      GAME.HEIGHT * a.Y_MIN,
      GAME.WIDTH * (a.X_MAX - a.X_MIN),
      GAME.HEIGHT * (a.Y_MAX - a.Y_MIN)
    );
  }

  start() {
    this.active = true;
    this.warriorHp = BATTLE.WARRIOR_HP;
    this.dragonHp = BATTLE.DRAGON_HP;
    this.stunnedUntil = 0;
    this.updateBars();
  }

  resetPositions() {
    this.warrior.sprite.setPosition(this.warriorStart.x, this.warriorStart.y);
    this.warrior.sprite.body.setVelocity(0, 0);
    this.dragon.reset(this.dragonStart.x, this.dragonStart.y);
  }

  retry() {
    this.warriorHp = BATTLE.WARRIOR_HP;
    this.dragonHp = BATTLE.DRAGON_HP;
    this.stunnedUntil = 0;
    this.pendingQte = false;
    this.qte.container.setVisible(false);
    this.resetPositions();
    this.updateBars();
    this.active = true;
    this.hint.setVisible(true);
    this.warning.setVisible(false);
  }

  updateBars() {
    this.warriorBar.setHp(this.warriorHp, BATTLE.WARRIOR_HP);
    this.dragonBar.setHp(this.dragonHp, BATTLE.DRAGON_HP);
  }

  update(keys, now) {
    if (!this.active) return;

    this.qte.update();

    if (this.stunnedUntil > now) {
      this.warrior.sprite.body.setVelocity(0, 0);
      return;
    }

    if (this.dragon.isWindup()) {
      this.warning.setText('快躲开！');
      this.warning.setVisible(true);
    } else {
      this.warning.setVisible(false);
    }

    if (!gameState.qteActive) {
      this.warrior.update(keys);
      this.clampWarrior();
    }

    this.dragon.update(this.warrior.x, this.warrior.y, now);

    if (this.dragon.checkLungeHit(this.warrior.x, this.warrior.y)) {
      this.damageWarrior();
    }

    if (this.dragon.isInRecover() && !this.pendingQte && !gameState.qteActive) {
      this.pendingQte = true;
      this.qte.start();
    }
  }

  clampWarrior() {
    const a = BATTLE.ARENA;
    const x = Phaser.Math.Clamp(this.warrior.x, GAME.WIDTH * a.X_MIN, GAME.WIDTH * a.X_MAX);
    const y = Phaser.Math.Clamp(this.warrior.y, GAME.HEIGHT * a.Y_MIN, GAME.HEIGHT * a.Y_MAX);
    this.warrior.sprite.setPosition(x, y);
  }

  damageWarrior() {
    this.warriorHp -= 1;
    this.updateBars();
    this.stunnedUntil = this.scene.time.now + BATTLE.STUN_MS;
    this.scene.cameras.main.shake(200, 0.008);
    this.scene.cameras.main.flash(120, 255, 80, 80);

    if (this.warriorHp <= 0) {
      this.active = false;
      this.onDefeat?.();
    }
  }

  onQteSuccess() {
    this.pendingQte = false;
    this.dragon.markQteUsed();
    this.dragon.onHurt();
    this.dragonHp -= 1;
    this.updateBars();
    this.scene.cameras.main.flash(150, 255, 220, 100);

    if (this.dragonHp <= 0) {
      this.active = false;
      this.onVictory?.();
    }
  }

  onQteFail() {
    this.pendingQte = false;
    this.dragon.markQteUsed();
    this.damageWarrior();
  }

  destroy() {
    this.qte.destroy();
    this.warriorBar.destroy();
    this.dragonBar.destroy();
    this.warning.destroy();
    this.hint.destroy();
    this.arenaGfx.destroy();
  }
}
