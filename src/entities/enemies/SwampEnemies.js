import Phaser from 'phaser';
import { ENEMIES, COLORS, WORLD, GAME } from '../../utils/constants.js';
import { fitSpriteHeight } from '../../art/AssetLoader.js';
import { eventBus, Events } from '../../core/EventBus.js';

function ensureTextures(scene) {
  if (scene.textures.exists('enemy_bug')) return;

  // TODO: 替换为实际美术资源
  const mk = (key, draw) => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(g);
    g.generateTexture(key, 48, 40);
    g.destroy();
  };

  mk('enemy_bug', (g) => {
    g.fillStyle(0x3d5c2e, 1);
    g.fillEllipse(24, 22, 40, 24);
    g.fillStyle(0x88aa44, 1);
    g.fillCircle(14, 16, 3);
    g.fillCircle(30, 16, 3);
  });

  mk('enemy_spitter', (g) => {
    g.fillStyle(0x6a3a7a, 1);
    g.fillEllipse(24, 20, 28, 22);
    g.fillStyle(0xc080e0, 1);
    g.fillTriangle(36, 18, 48, 20, 36, 24);
    g.fillCircle(18, 14, 4);
  });

  mk('enemy_charger', (g) => {
    g.fillStyle(0x4a3020, 1);
    g.fillRoundedRect(4, 12, 40, 22, 6);
    g.fillStyle(0x8a6040, 1);
    g.fillTriangle(40, 14, 48, 22, 40, 30);
    g.fillStyle(0xffcc66, 1);
    g.fillCircle(14, 18, 3);
  });

  mk('enemy_slammer', (g) => {
    g.fillStyle(0x5a5a68, 1);
    g.fillRoundedRect(6, 10, 36, 26, 4);
    g.fillStyle(0x8a8a98, 1);
    g.fillRect(10, 6, 28, 10);
    g.fillStyle(0xff6644, 1);
    g.fillCircle(16, 20, 3);
    g.fillCircle(32, 20, 3);
  });
}

/**
 * 沼泽小怪基类
 */
class SwampEnemy {
  constructor(scene, x, y, type) {
    ensureTextures(scene);
    this.scene = scene;
    this.type = type;
    this.cfg = ENEMIES[type];
    this.hp = this.cfg.HP;
    this.maxHp = this.cfg.HP;
    this.alive = true;
    this.dir = Math.random() > 0.5 ? 1 : -1;
    this.wanderTimer = 0;
    this.attackCd = 400 + Math.random() * 600;
    this.state = 'idle';
    this.projectiles = [];
    this.hitbox = null;
    this.telegraph = null;

    this.sprite = scene.physics.add.sprite(x, y, this.cfg.TEXTURE);
    this.sprite.body.setAllowGravity(false);
    fitSpriteHeight(this.sprite, this.cfg.HEIGHT);
    this.sprite.setDepth(5);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(30, 20);
    this.sprite.setData('entity', this);
    this.sprite.setTint(this.cfg.TINT);

    this.nameTag = scene.add.text(x, y - this.cfg.HEIGHT - 8, this.cfg.NAME, {
      fontFamily: '"STKaiti", serif',
      fontSize: '12px',
      color: '#c9b896',
    }).setOrigin(0.5).setDepth(6);

    this.hpBar = scene.add.graphics().setDepth(6);
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.hp -= amount;
    this.sprite.setTint(0xff8888);
    this.scene.time.delayedCall(80, () => {
      if (this.alive) this.sprite.setTint(this.cfg.TINT);
    });
    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.clearHitbox();
    this.clearTelegraph();
    this.projectiles.forEach((p) => p.destroy());
    this.projectiles = [];
    this.sprite.destroy();
    this.hpBar.destroy();
    this.nameTag.destroy();
  }

  clearHitbox() {
    if (this.hitbox) {
      this.hitbox.destroy();
      this.hitbox = null;
    }
  }

  clearTelegraph() {
    if (this.telegraph) {
      this.telegraph.destroy();
      this.telegraph = null;
    }
  }

  drawHp() {
    this.hpBar.clear();
    if (!this.alive) return;
    const x = this.sprite.x - 22;
    const y = this.sprite.y - this.cfg.HEIGHT - 4;
    this.nameTag.setPosition(this.sprite.x, y - 10);
    this.hpBar.fillStyle(0x222222, 0.8);
    this.hpBar.fillRect(x, y, 44, 5);
    this.hpBar.fillStyle(this.cfg.BAR || 0xaa3333, 1);
    this.hpBar.fillRect(x, y, 44 * (this.hp / this.maxHp), 5);
  }

  clampY() {
    const yMin = GAME.HEIGHT * WORLD.WALK_Y_MIN;
    const yMax = GAME.HEIGHT * WORLD.WALK_Y_MAX;
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, yMin, yMax);
  }

  facePlayer(dx) {
    this.sprite.setFlipX(dx < 0);
  }

  /** @returns {{ damage: number, source: string }|null} 本帧对玩家的接触/技能伤害请求 */
  update(time, delta, playerX, playerY) {
    if (!this.alive || !this.sprite.active) return null;
    this.attackCd -= delta;
    this.projectiles = this.projectiles.filter((p) => p.active);
    let dmg = null;
    switch (this.type) {
      case 'bug': dmg = this.updateBug(time, delta, playerX, playerY); break;
      case 'spitter': dmg = this.updateSpitter(time, delta, playerX, playerY); break;
      case 'charger': dmg = this.updateCharger(time, delta, playerX, playerY); break;
      case 'slammer': dmg = this.updateSlammer(time, delta, playerX, playerY); break;
      default: break;
    }
    this.clampY();
    this.drawHp();
    return dmg;
  }

  // —— 毒虫：贴身追咬 ——
  updateBug(time, delta, px, py) {
    const dx = px - this.sprite.x;
    const dy = py - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    this.wanderTimer -= delta;

    if (dist < this.cfg.AGGRO) {
      this.sprite.setVelocity((dx / dist) * this.cfg.SPEED, (dy / dist) * this.cfg.SPEED);
      this.facePlayer(dx);
      if (dist < 36 && this.attackCd <= 0) {
        this.attackCd = this.cfg.ATTACK_CD;
        return { damage: this.cfg.DAMAGE, source: 'bite' };
      }
    } else {
      if (this.wanderTimer <= 0) {
        this.dir *= -1;
        this.wanderTimer = 1000 + Math.random() * 1000;
      }
      this.sprite.setVelocity(this.dir * this.cfg.SPEED * 0.45, Math.sin(time / 380) * 18);
      this.sprite.setFlipX(this.dir < 0);
    }
    return null;
  }

  // —— 沼蛊：保持距离，吐毒液 ——
  updateSpitter(time, delta, px, py) {
    const dx = px - this.sprite.x;
    const dy = py - this.sprite.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.facePlayer(dx);

    if (dist < this.cfg.AGGRO) {
      // 太近则后退，中距吐息，太远则靠近
      if (dist < this.cfg.KEEP_MIN) {
        this.sprite.setVelocity(-(dx / dist) * this.cfg.SPEED, -(dy / dist) * this.cfg.SPEED * 0.6);
      } else if (dist > this.cfg.KEEP_MAX) {
        this.sprite.setVelocity((dx / dist) * this.cfg.SPEED * 0.7, (dy / dist) * this.cfg.SPEED * 0.5);
      } else {
        this.sprite.setVelocity(Math.sin(time / 300) * 40, Math.cos(time / 280) * 30);
        if (this.attackCd <= 0) {
          this.attackCd = this.cfg.ATTACK_CD;
          this.spitAt(px, py);
        }
      }
    } else {
      this.sprite.setVelocity(Math.sin(time / 500) * 30, Math.cos(time / 450) * 20);
    }
    return null;
  }

  spitAt(px, py) {
    const sx = this.sprite.x;
    const sy = this.sprite.y - 10;
    // TODO: 替换为实际美术资源
    const ball = this.scene.add.circle(sx, sy, 8, 0xb060d0, 0.95);
    this.scene.physics.add.existing(ball);
    ball.body.setAllowGravity(false);
    ball.body.setCircle(8);
    ball.setData('damage', this.cfg.DAMAGE);
    ball.setData('enemyShot', true);
    const dx = px - sx;
    const dy = py - sy;
    const dist = Math.max(1, Math.hypot(dx, dy));
    ball.body.setVelocity((dx / dist) * this.cfg.SHOT_SPEED, (dy / dist) * this.cfg.SHOT_SPEED);
    this.projectiles.push(ball);
    this.scene.time.delayedCall(2200, () => { if (ball.active) ball.destroy(); });
    eventBus.emit(Events.SFX, { name: 'fireball' });
  }

  // —— 蛮鳄：蓄力冲锋 ——
  updateCharger(time, delta, px, py) {
    const dx = px - this.sprite.x;
    const dy = py - this.sprite.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (this.state === 'charging') {
      // 冲锋中由 velocity 驱动，碰玩家由场景判定 hitbox
      return null;
    }

    if (this.state === 'windup') {
      this.sprite.setVelocity(0, 0);
      return null;
    }

    this.facePlayer(dx);
    if (dist < this.cfg.AGGRO && dist > 80 && this.attackCd <= 0) {
      this.startCharge(px, py);
      return null;
    }

    if (dist < this.cfg.AGGRO) {
      this.sprite.setVelocity((dx / dist) * this.cfg.SPEED * 0.55, (dy / dist) * this.cfg.SPEED * 0.55);
    } else {
      this.sprite.setVelocity(this.dir * this.cfg.SPEED * 0.35, Math.sin(time / 420) * 15);
    }
    return null;
  }

  startCharge(px, py) {
    this.state = 'windup';
    this.attackCd = this.cfg.ATTACK_CD;
    this.sprite.setVelocity(0, 0);
    this.sprite.setTint(0xffaa66);

    const dx = px - this.sprite.x;
    const dy = py - this.sprite.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / dist;
    const ny = dy / dist;

    // 预警线
    this.telegraph = this.scene.add.rectangle(
      this.sprite.x + nx * 90,
      this.sprite.y + ny * 90,
      180,
      28,
      0xff4422,
      0.25,
    ).setAngle(Phaser.Math.RadToDeg(Math.atan2(ny, nx))).setDepth(4);

    this.scene.time.delayedCall(450, () => {
      if (!this.alive) return;
      this.clearTelegraph();
      this.state = 'charging';
      this.sprite.setTint(this.cfg.TINT);
      this.sprite.setVelocity(nx * this.cfg.CHARGE_SPEED, ny * this.cfg.CHARGE_SPEED);
      this.hitbox = this.scene.add.rectangle(this.sprite.x, this.sprite.y, 50, 36, 0xff6644, 0.001);
      this.scene.physics.add.existing(this.hitbox);
      this.hitbox.body.setAllowGravity(false);

      this.scene.time.delayedCall(420, () => {
        if (!this.alive) return;
        this.state = 'idle';
        this.sprite.setVelocity(0, 0);
        this.clearHitbox();
      });
    });
  }

  // —— 石蟹：缓慢靠近，砸地范围伤害 ——
  updateSlammer(time, delta, px, py) {
    const dx = px - this.sprite.x;
    const dy = py - this.sprite.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (this.state === 'slamming') {
      this.sprite.setVelocity(0, 0);
      return null;
    }

    this.facePlayer(dx);
    if (dist < this.cfg.SLAM_RANGE && this.attackCd <= 0) {
      this.startSlam();
      return null;
    }

    if (dist < this.cfg.AGGRO) {
      this.sprite.setVelocity((dx / dist) * this.cfg.SPEED, (dy / dist) * this.cfg.SPEED);
    } else {
      this.sprite.setVelocity(Math.sin(time / 600) * 20, Math.cos(time / 550) * 15);
    }
    return null;
  }

  startSlam() {
    this.state = 'slamming';
    this.attackCd = this.cfg.ATTACK_CD;
    this.sprite.setVelocity(0, 0);

    // 预警圈
    this.telegraph = this.scene.add.circle(this.sprite.x, this.sprite.y, this.cfg.SLAM_RANGE, 0xff6644, 0.2)
      .setStrokeStyle(2, 0xffaa66, 0.7)
      .setDepth(4);

    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.15,
      scaleY: this.sprite.scaleY * 0.85,
      duration: 280,
      yoyo: true,
    });

    this.scene.time.delayedCall(380, () => {
      if (!this.alive) return;
      this.clearTelegraph();
      this.hitbox = this.scene.add.circle(this.sprite.x, this.sprite.y, this.cfg.SLAM_RANGE, 0xff4422, 0.35)
        .setDepth(7);
      this.scene.physics.add.existing(this.hitbox);
      this.hitbox.body.setAllowGravity(false);
      this.hitbox.body.setCircle(this.cfg.SLAM_RANGE);
      this.scene.cameras.main.shake(100, 0.006);
      eventBus.emit(Events.SFX, { name: 'hit' });

      this.scene.time.delayedCall(160, () => {
        this.clearHitbox();
        this.state = 'idle';
      });
    });
  }

  getAttackHitbox() {
    return this.hitbox;
  }

  getProjectiles() {
    return this.projectiles;
  }

  destroy() {
    if (this.alive) this.die();
  }
}

export function createSwampEnemy(scene, type, x, y) {
  return new SwampEnemy(scene, x, y, type);
}

export const SWAMP_ENEMY_TYPES = ['bug', 'spitter', 'charger', 'slammer'];
