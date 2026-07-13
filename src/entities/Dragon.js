import Phaser from 'phaser';
import { GAME, DRAGON, BATTLE } from '../core/Constants.js';
import { createCharacterSprite, ySort, TEXTURE_KEYS, SHEET_KEYS } from '../art/AssetRegistry.js';

const STATES = {
  PATROL: 'patrol',
  WINDUP: 'windup',
  LUNGE: 'lunge',
  RECOVER: 'recover',
  HURT: 'hurt',
};

const FRAMES = {
  IDLE: 0,
  WINDUP: 1,
  LUNGE: 2,
  HURT: 1,
};

export class Dragon {
  constructor(scene, x, y) {
    this.scene = scene;
    this.state = STATES.PATROL;
    this.patrolDir = 1;
    this.stateUntil = 0;
    this.lungeTarget = { x: 0, y: 0 };
    this.hitThisLunge = false;
    this.recoverQteUsed = false;

    this.sprite = createCharacterSprite(scene, x, y, TEXTURE_KEYS.DRAGON, DRAGON.HEIGHT, SHEET_KEYS.DRAGON);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);
    const tex = scene.textures.get(SHEET_KEYS.DRAGON);
    const frameH = tex.frames['0'].height;
    this.baseScale = DRAGON.HEIGHT / frameH;

    this.arena = {
      xMin: GAME.WIDTH * BATTLE.ARENA.X_MIN,
      xMax: GAME.WIDTH * BATTLE.ARENA.X_MAX,
      yMin: GAME.HEIGHT * BATTLE.ARENA.Y_MIN,
      yMax: GAME.HEIGHT * BATTLE.ARENA.Y_MAX,
    };

    this.setFrame(FRAMES.IDLE);
    this.clampPosition();
    this.schedulePatrolEnd();
  }

  schedulePatrolEnd() {
    this.state = STATES.PATROL;
    this.setFrame(FRAMES.IDLE);
    this.stateUntil = this.scene.time.now + BATTLE.PATROL_MS;
  }

  startWindup(targetX, targetY) {
    this.state = STATES.WINDUP;
    this.lungeTarget = { x: targetX, y: targetY };
    this.hitThisLunge = false;
    this.setFrame(FRAMES.WINDUP);
    this.sprite.body.setVelocity(0, 0);
    this.stateUntil = this.scene.time.now + BATTLE.WINDUP_MS;
  }

  startLunge() {
    this.state = STATES.LUNGE;
    this.setFrame(FRAMES.LUNGE);
    const dx = this.lungeTarget.x - this.sprite.x;
    const dy = this.lungeTarget.y - this.sprite.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.sprite.body.setVelocity(
      (dx / dist) * DRAGON.LUNGE_SPEED,
      (dy / dist) * DRAGON.LUNGE_SPEED
    );
    this.sprite.setFlipX(dx < 0);
    this.stateUntil = this.scene.time.now + BATTLE.LUNGE_MS;
  }

  startRecover() {
    this.state = STATES.RECOVER;
    this.recoverQteUsed = false;
    this.setFrame(FRAMES.HURT);
    this.sprite.body.setVelocity(0, 0);
    this.stateUntil = this.scene.time.now + BATTLE.RECOVER_MS;
  }

  onHurt() {
    this.state = STATES.HURT;
    this.setFrame(FRAMES.HURT);
    this.sprite.body.setVelocity(0, 0);
    this.stateUntil = this.scene.time.now + 400;
  }

  setFrame(frame) {
    if (this.sprite?.setFrame) {
      this.sprite.setFrame(frame);
    }
  }

  clampPosition() {
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, this.arena.xMin, this.arena.xMax);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, this.arena.yMin, this.arena.yMax);
  }

  update(warriorX, warriorY, now) {
    if (this.state === STATES.PATROL) {
      this.sprite.body.setVelocityX(this.patrolDir * DRAGON.SPEED * 0.6);
      this.sprite.body.setVelocityY(Math.sin(now * 0.002) * DRAGON.SPEED * 0.15);
      this.clampPosition();
      if (this.sprite.x >= this.arena.xMax || this.sprite.x <= this.arena.xMin) {
        this.patrolDir *= -1;
        this.sprite.setFlipX(this.patrolDir < 0);
      }
      if (now >= this.stateUntil) {
        this.startWindup(warriorX, warriorY);
      }
    } else if (this.state === STATES.WINDUP) {
      this.sprite.body.setVelocity(0, 0);
      const pulse = 1 + Math.sin(now * 0.02) * 0.05;
      this.sprite.setScale(this.baseScale * pulse);
      if (now >= this.stateUntil) {
        this.sprite.setScale(this.baseScale);
        this.startLunge();
      }
    } else if (this.state === STATES.LUNGE) {
      this.clampPosition();
      if (now >= this.stateUntil) {
        this.startRecover();
      }
    } else if (this.state === STATES.RECOVER) {
      this.sprite.body.setVelocity(0, 0);
      if (now >= this.stateUntil) {
        this.sprite.setScale(this.baseScale);
        this.setFrame(FRAMES.IDLE);
        this.schedulePatrolEnd();
      }
    } else if (this.state === STATES.HURT) {
      if (now >= this.stateUntil) {
        this.startRecover();
      }
    }

    ySort(this.sprite, 28);
  }

  isInRecover() {
    return this.state === STATES.RECOVER && !this.recoverQteUsed;
  }

  isWindup() {
    return this.state === STATES.WINDUP;
  }

  checkLungeHit(warriorX, warriorY) {
    if (this.state !== STATES.LUNGE || this.hitThisLunge) return false;
    const dx = warriorX - this.sprite.x;
    const dy = warriorY - this.sprite.y;
    if (Math.hypot(dx, dy) < BATTLE.HIT_RANGE) {
      this.hitThisLunge = true;
      return true;
    }
    return false;
  }

  markQteUsed() {
    this.recoverQteUsed = true;
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  reset(x, y) {
    this.sprite.setPosition(x, y);
    this.sprite.setScale(this.baseScale);
    this.sprite.body.setVelocity(0, 0);
    this.hitThisLunge = false;
    this.recoverQteUsed = false;
    this.patrolDir = 1;
    this.setFrame(FRAMES.IDLE);
    this.schedulePatrolEnd();
  }

  destroy() {
    this.sprite.destroy();
  }
}
