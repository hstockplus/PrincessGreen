import Phaser from 'phaser';
import { COLORS } from '../utils/constants.js';

/**
 * 战斗打击反馈：刀光弧、冲击波、受击闪白
 */
export class CombatFX {
  static slash(scene, x, y, angle, { color = 0xffe08a, scale = 1 } = {}) {
    const g = scene.add.graphics().setDepth(60);
    const a = angle;
    const r = 48 * scale;

    g.lineStyle(5 * scale, color, 0.95);
    g.beginPath();
    g.arc(x, y, r, a - 1.0, a + 0.35, false);
    g.strokePath();
    g.lineStyle(2 * scale, 0xfff8d0, 0.85);
    g.beginPath();
    g.arc(x, y, r * 0.72, a - 0.85, a + 0.2, false);
    g.strokePath();

    // 刀尖火花
    for (let i = 0; i < 5; i++) {
      const t = a - 0.5 + Math.random() * 0.9;
      const d = r * (0.7 + Math.random() * 0.5);
      g.fillStyle(color, 0.8);
      g.fillCircle(x + Math.cos(t) * d, y + Math.sin(t) * d, 2 + Math.random() * 2);
    }

    scene.tweens.add({
      targets: g,
      alpha: 0,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => g.destroy(),
    });
    return g;
  }

  static skillBurst(scene, x, y, angle) {
    CombatFX.slash(scene, x, y, angle, { color: COLORS.BLADE_QI, scale: 1.55 });
    const ring = scene.add.circle(x, y, 10, COLORS.GOLD, 0.5).setDepth(59);
    scene.tweens.add({
      targets: ring,
      scaleX: 3.2,
      scaleY: 3.2,
      alpha: 0,
      duration: 280,
      onComplete: () => ring.destroy(),
    });
  }

  static hitSpark(scene, x, y) {
    const g = scene.add.graphics().setDepth(70);
    g.lineStyle(2, 0xffffff, 1);
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + Math.random() * 0.3;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16);
      g.strokePath();
    }
    scene.tweens.add({
      targets: g,
      alpha: 0,
      duration: 160,
      onComplete: () => g.destroy(),
    });
  }

  /** 角色出刀时身体前倾 */
  static lunge(sprite, facing, dist = 10) {
    if (!sprite?.active) return;
    const ox = sprite.x;
    sprite.scene.tweens.add({
      targets: sprite,
      x: ox + facing * dist,
      duration: 70,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  static pickupPop(scene, x, y, text = '+1') {
    const t = scene.add.text(x, y - 20, text, {
      fontFamily: '"STKaiti", serif',
      fontSize: '20px',
      color: '#ffd878',
      stroke: '#1a1008',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(80);
    scene.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }
}
