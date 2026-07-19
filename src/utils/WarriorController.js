import Phaser from 'phaser';
import { PLAYER, ITEM } from './constants.js';
import { gameState } from './gameState.js';
import { sound } from './sound.js';

/**
 * 勇士移动 / 二段跳 / 攻击 / 灵芝
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

    this.sprite = scene.physics.add.sprite(x, y, 'tex_warrior');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0);
    this.sprite.body.setSize(PLAYER.WIDTH * 0.7, PLAYER.HEIGHT * 0.9);

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
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
      if (this.canAttack && p.leftButtonDown()) this.tryAttack();
    });
  }

  update(blocked = false) {
    if (blocked || !this.sprite?.body) {
      this.sprite?.body?.setVelocityX(0);
      return;
    }

    const left = this.cursors.left.isDown || this.keys.a.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.keys.w)
      || Phaser.Input.Keyboard.JustDown(this.keys.space);

    if (left) {
      this.sprite.setVelocityX(-PLAYER.SPEED);
      this.facing = -1;
      this.sprite.setFlipX(true);
    } else if (right) {
      this.sprite.setVelocityX(PLAYER.SPEED);
      this.facing = 1;
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
    }

    if (this.sprite.body.blocked.down || this.sprite.body.touching.down) {
      this.jumps = 0;
    }

    if (jumpPressed && this.jumps < PLAYER.MAX_JUMPS) {
      this.sprite.setVelocityY(PLAYER.JUMP);
      this.jumps += 1;
      sound.play('jump');
    }

    if (this.canAttack && Phaser.Input.Keyboard.JustDown(this.keys.j)) {
      this.tryAttack();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.q)) {
      this.useLingzhi();
    }

    if (this.scene.time.now < this.invulnUntil) {
      this.sprite.setAlpha(0.5 + Math.sin(this.scene.time.now * 0.03) * 0.3);
    } else {
      this.sprite.setAlpha(1);
    }
  }

  tryAttack() {
    const now = this.scene.time.now;
    if (now - this.lastAttack < PLAYER.ATTACK_COOLDOWN) return null;
    this.lastAttack = now;
    sound.play('sword');

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
    sound.play('heal');
    this.scene.cameras.main.flash(120, 80, 200, 120);
    return true;
  }

  takeDamage(amount) {
    const now = this.scene.time.now;
    if (now < this.invulnUntil) return false;
    gameState.hp = Math.max(0, gameState.hp - amount);
    this.invulnUntil = now + PLAYER.INVULN_MS;
    sound.play('hurt');
    this.scene.cameras.main.shake(160, 0.01);
    return true;
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  destroy() {
    this.sprite.destroy();
  }
}
