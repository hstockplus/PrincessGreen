import Phaser from 'phaser';
import { COLORS, PLAYER } from '../utils/constants.js';

/** 金蟾刀气 — 穿透飞行投射物 */
export class BladeQi {
  constructor(scene, x, y, angle) {
    this.scene = scene;
    this.active = true;
    this.damage = PLAYER.QI_DAMAGE;
    this.traveled = 0;
    this.vx = Math.cos(angle) * PLAYER.QI_SPEED;
    this.vy = Math.sin(angle) * PLAYER.QI_SPEED;
    this.hitSet = new Set();

    // TODO: 替换为实际美术资源 — 金色弧形刀气
    this.gfx = scene.add.graphics().setDepth(40);
    this.body = scene.add.circle(x, y, PLAYER.QI_RADIUS, COLORS.BLADE_QI, 0.01);
    scene.physics.add.existing(this.body);
    this.body.body.setAllowGravity(false);
    this.body.body.setCircle(PLAYER.QI_RADIUS);
    this.redraw();
  }

  redraw() {
    const g = this.gfx;
    g.clear();
    g.lineStyle(4, COLORS.GOLD, 0.95);
    g.fillStyle(COLORS.BLADE_QI, 0.55);
    const a = Math.atan2(this.vy, this.vx);
    const x = this.body.x;
    const y = this.body.y;
    g.beginPath();
    g.arc(x, y, 22, a - 1.1, a + 1.1, false);
    g.strokePath();
    g.fillStyle(0xfff2b0, 0.35);
    g.fillCircle(x, y, 10);
  }

  update(dt) {
    if (!this.active) return;
    const step = (dt / 1000);
    this.body.x += this.vx * step;
    this.body.y += this.vy * step;
    this.traveled += PLAYER.QI_SPEED * step;
    this.redraw();
    if (this.traveled >= PLAYER.QI_RANGE) this.destroy();
  }

  /** 是否尚未命中过该目标（不提前登记，需在 overlap 成功后再 markHit） */
  canHit(enemyId) {
    if (!this.active || this.hitSet.has(enemyId)) return false;
    return true;
  }

  markHit(enemyId) {
    this.hitSet.add(enemyId);
  }

  destroy() {
    this.active = false;
    this.gfx?.destroy();
    this.body?.destroy();
    this.gfx = null;
    this.body = null;
  }
}
