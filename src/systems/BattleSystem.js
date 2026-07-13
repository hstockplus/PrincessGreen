import Phaser from 'phaser';
import { GAME, UI, BATTLE, PX } from '../core/Constants.js';
import { BattleHpBar } from '../ui/BattleHpBar.js';
import { startBattleMusic, stopBattleMusic, stopAllMusic } from './SimpleSFX.js';

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
    this.lasers = [];
    this.lastDt = 0;

    this.warriorStart = { x: warrior.x, y: warrior.y };
    this.dragonStart = { x: dragon.x, y: dragon.y };

    this.warriorBar = new BattleHpBar(scene, GAME.WIDTH * 0.12, GAME.HEIGHT * 0.1, '勇士', 0xc0392b);
    this.dragonBar = new BattleHpBar(scene, GAME.WIDTH * 0.88, GAME.HEIGHT * 0.1, '恶龙', 0x8e44ad, true);

    this.hint = scene.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.16, 'WASD 移动 · 空格/普攻发射激光 · 躲开对方光束 · 先被击中 3 次者败', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#d8c8e8',
    }).setOrigin(0.5).setDepth(850);

    this.arenaGfx = scene.add.graphics().setDepth(5);
    this.drawArena();

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
      GAME.HEIGHT * (a.Y_MAX - a.Y_MIN),
    );
  }

  start() {
    this.active = true;
    this.warriorHp = BATTLE.WARRIOR_HP;
    this.dragonHp = BATTLE.DRAGON_HP;
    this.stunnedUntil = 0;
    this.clearLasers();
    this.warriorBar.container.setVisible(true);
    this.dragonBar.container.setVisible(true);
    this.hint.setVisible(true);
    this.updateBars();
    startBattleMusic();
  }

  stop() {
    this.active = false;
    this.clearLasers();
    this.warriorBar.container.setVisible(false);
    this.dragonBar.container.setVisible(false);
    this.hint.setVisible(false);
    stopBattleMusic();
  }

  clearLasers() {
    this.lasers.forEach((l) => l.destroy());
    this.lasers = [];
  }

  resetPositions() {
    this.warrior.sprite.setPosition(this.warriorStart.x, this.warriorStart.y);
    this.warrior.sprite.body.setVelocity(0, 0);
    this.dragon.reset(this.dragonStart.x, this.dragonStart.y);
  }

  updateBars() {
    this.warriorBar.setHp(this.warriorHp, BATTLE.WARRIOR_HP);
    this.dragonBar.setHp(this.dragonHp, BATTLE.DRAGON_HP);
  }

  update(keys, now, firePressed, dt = 16) {
    if (!this.active) return;

    this.lastDt = dt;

    if (this.stunnedUntil > now) {
      this.warrior.sprite.body.setVelocity(0, 0);
    } else {
      this.warrior.update(keys);
      this.clampWarrior();
      if (firePressed) {
        const laser = this.warrior.fireLaser(now);
        if (laser) this.lasers.push(laser);
      }
    }

    const dragonLaser = this.dragon.update(this.warrior.x, this.warrior.y, now);
    if (dragonLaser) this.lasers.push(dragonLaser);

    this.lasers.forEach((laser) => {
      laser.update(dt);
      if (!laser.active) return;

      if (laser.owner === 'dragon' && !this.warrior.isInvulnerable(now)) {
        if (laser.checkHit(this.warrior.x, this.warrior.y)) {
          this.damageWarrior(now);
        }
      } else if (laser.owner === 'warrior' && !this.dragon.isInvulnerable(now)) {
        if (laser.checkHit(this.dragon.x, this.dragon.y)) {
          this.damageDragon(now);
        }
      }
    });

    this.lasers = this.lasers.filter((l) => l.active);
  }

  clampWarrior() {
    const a = BATTLE.ARENA;
    const x = Phaser.Math.Clamp(this.warrior.x, GAME.WIDTH * a.X_MIN, GAME.WIDTH * a.X_MAX);
    const y = Phaser.Math.Clamp(this.warrior.y, GAME.HEIGHT * a.Y_MIN, GAME.HEIGHT * a.Y_MAX);
    this.warrior.sprite.setPosition(x, y);
  }

  damageWarrior(now) {
    this.warriorHp -= 1;
    this.warrior.onHit(now);
    this.updateBars();
    this.stunnedUntil = now + BATTLE.STUN_MS;
    this.scene.cameras.main.shake(200, 0.008);
    this.scene.cameras.main.flash(120, 255, 80, 80);

    if (this.warriorHp <= 0) {
      this.active = false;
      this.clearLasers();
      this.onDefeat?.();
    }
  }

  damageDragon(now) {
    this.dragonHp -= 1;
    this.dragon.onHit(now);
    this.updateBars();
    this.scene.cameras.main.flash(150, 255, 220, 100);

    if (this.dragonHp <= 0) {
      this.active = false;
      this.clearLasers();
      this.onVictory?.();
    }
  }

  destroy() {
    stopAllMusic();
    this.clearLasers();
    this.warriorBar.destroy();
    this.dragonBar.destroy();
    this.hint.destroy();
    this.arenaGfx.destroy();
  }
}
