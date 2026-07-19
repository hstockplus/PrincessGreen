import Phaser from 'phaser';
import { PLAYER, ITEM, GAME } from './constants.js';
import { gameState } from './gameState.js';
import { eventBus, Events } from '../core/EventBus.js';
import { ASSETS } from '../art/AssetLoader.js';

/**
 * 勇士移动 / 二段跳 / 攻击 / 灵芝
 * mobile: { left,right,up,down,jump,attack,interact,dash,use } 一次性/持续状态
 */
export class WarriorController {
  constructor(scene, x, y, { canAttack = false } = {}) {
    this.scene = scene;
    this.canAttack = canAttack;
    this.jumps = 0;
    this.lastAttack = 0;
    this.invulnUntil = 0;
    this.facing = 1;
    this.lastHitBox = null;
    this.mobile = null;

    const key = scene.textures.exists(ASSETS.WARRIOR) ? ASSETS.WARRIOR : 'tex_warrior';
    this.sprite = scene.physics.add.sprite(x, y, key);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    // 立绘比例：约半屏高，碰撞盒收窄脚底
    const targetH = GAME.HEIGHT * 0.42;
    this.sprite.setScale(targetH / this.sprite.height);
    this.sprite.setOrigin(0.5, 1);
    const bw = this.sprite.displayWidth * 0.28;
    const bh = this.sprite.displayHeight * 0.22;
    this.sprite.body.setSize(bw / this.sprite.scaleX, bh / this.sprite.scaleY);
    this.sprite.body.setOffset(
      (this.sprite.width - bw / this.sprite.scaleX) / 2,
      this.sprite.height - bh / this.sprite.scaleY - 4,
    );
    this.baseScale = Math.abs(this.sprite.scaleX);
    this.baseScaleY = Math.abs(this.sprite.scaleY);

    this.sprite.setAlpha(0);
    this.sprite.y -= 80;
    scene.tweens.add({
      targets: this.sprite,
      y,
      alpha: 1,
      duration: 450,
      ease: 'Sine.easeOut',
      onComplete: () => scene.cameras.main.shake(60, 0.003),
    });

    this.cursors = scene.input.keyboard?.createCursorKeys?.();
    this.keys = scene.input.keyboard?.addKeys?.({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      j: Phaser.Input.Keyboard.KeyCodes.J,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });

    scene.input.on('pointerdown', (p) => {
      if (gameState.dialogueActive) return;
      if (!this.canAttack) return;
      // 忽略 UI 区域点击（右侧/左侧控制区）
      const sx = p.x;
      if (sx < 220 || sx > GAME_SAFE_RIGHT()) return;
      this.tryAttack();
    });
  }

  setMobileState(mobile) {
    this.mobile = mobile;
  }

  update(blocked = false) {
    if (blocked || gameState.dialogueActive || !this.sprite?.body) {
      this.sprite?.body?.setVelocityX(0);
      return;
    }

    const m = this.mobile || {};
    const left = !!(this.cursors?.left?.isDown || this.keys?.a?.isDown || m.left);
    const right = !!(this.cursors?.right?.isDown || this.keys?.d?.isDown || m.right);
    const jumpPressed = !!(
      (this.cursors?.up && Phaser.Input.Keyboard.JustDown(this.cursors.up))
      || (this.keys?.w && Phaser.Input.Keyboard.JustDown(this.keys.w))
      || (this.keys?.space && Phaser.Input.Keyboard.JustDown(this.keys.space))
      || m.jump
      || m.up
    );

    let moving = false;
    if (left) {
      this.sprite.setVelocityX(-PLAYER.SPEED);
      this.facing = -1;
      this.sprite.setFlipX(true);
      moving = true;
    } else if (right) {
      this.sprite.setVelocityX(PLAYER.SPEED);
      this.facing = 1;
      this.sprite.setFlipX(false);
      moving = true;
    } else {
      this.sprite.setVelocityX(0);
    }

    // 立绘不做帧动画，仅用轻微缩放表达步伐
    if (moving) {
      this.sprite.setScale(
        Math.sign(this.sprite.scaleX) * Math.abs(this.baseScale || this.sprite.scaleX),
        (this.baseScaleY || Math.abs(this.sprite.scaleY)) * (1 + Math.sin(this.scene.time.now * 0.02) * 0.02),
      );
    }

    if (this.sprite.body.blocked.down || this.sprite.body.touching.down) {
      this.jumps = 0;
    }

    if (jumpPressed && this.jumps < PLAYER.MAX_JUMPS) {
      this.sprite.setVelocityY(PLAYER.JUMP);
      this.jumps += 1;
      eventBus.emit(Events.PLAYER_JUMP);
    }

    if (this.canAttack && (
      (this.keys?.j && Phaser.Input.Keyboard.JustDown(this.keys.j)) || m.attack
    )) {
      this.tryAttack();
    }

    if ((this.keys?.q && Phaser.Input.Keyboard.JustDown(this.keys.q)) || m.use) {
      this.useLingzhi();
    }

    if (this.scene.time.now < this.invulnUntil) {
      this.sprite.setAlpha(0.5 + Math.sin(this.scene.time.now * 0.03) * 0.3);
    } else {
      this.sprite.setAlpha(1);
    }
  }

  justInteract() {
    const m = this.mobile || {};
    return !!(
      (this.keys?.e && Phaser.Input.Keyboard.JustDown(this.keys.e))
      || m.interact
    );
  }

  justDash() {
    const m = this.mobile || {};
    return !!(
      (this.keys?.shift && Phaser.Input.Keyboard.JustDown(this.keys.shift))
      || m.dash
    );
  }

  tryAttack() {
    if (gameState.dialogueActive) return null;
    const now = this.scene.time.now;
    if (now - this.lastAttack < PLAYER.ATTACK_COOLDOWN) return null;
    this.lastAttack = now;
    eventBus.emit(Events.PLAYER_ATTACK);

    const slash = this.scene.add.image(
      this.sprite.x + this.facing * 36,
      this.sprite.y - 8,
      'tex_slash',
    ).setFlipX(this.facing < 0).setDepth(50);
    this.scene.tweens.add({
      targets: slash,
      alpha: 0,
      x: slash.x + this.facing * 30,
      duration: 180,
      onComplete: () => slash.destroy(),
    });

    this.lastHitBox = {
      x: this.sprite.x + this.facing * 40,
      y: this.sprite.y,
      w: 50,
      h: 40,
      damage: PLAYER.ATTACK_DAMAGE,
      until: now + 120,
    };
    return this.lastHitBox;
  }

  consumeHitBox() {
    const now = this.scene.time.now;
    if (!this.lastHitBox || now > this.lastHitBox.until) {
      this.lastHitBox = null;
      return null;
    }
    const hit = this.lastHitBox;
    this.lastHitBox = null;
    return hit;
  }

  useLingzhi() {
    if (gameState.lingzhi <= 0) return false;
    if (gameState.hp >= gameState.maxHp) return false;
    gameState.lingzhi -= 1;
    gameState.hp = Math.min(gameState.maxHp, gameState.hp + gameState.maxHp * ITEM.LINGZHI_HEAL);
    eventBus.emit(Events.PLAYER_HEAL);
    this.scene.cameras.main.flash(120, 80, 200, 120);
    return true;
  }

  takeDamage(amount) {
    const now = this.scene.time.now;
    if (now < this.invulnUntil) return false;
    gameState.hp = Math.max(0, gameState.hp - amount);
    this.invulnUntil = now + PLAYER.INVULN_MS;
    eventBus.emit(Events.PLAYER_HURT);
    this.scene.cameras.main.shake(160, 0.01);
    this.scene.cameras.main.flash(80, 180, 40, 40);
    return true;
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  destroy() {
    this.sprite.destroy();
  }
}

function GAME_SAFE_RIGHT() {
  return 1280 - 240;
}
