import { GAME, UI, PX } from '../core/Constants.js';

export class BattleHpBar {
  constructor(scene, x, y, label, color, alignRight = false) {
    this.barW = GAME.WIDTH * 0.18;
    this.barH = 10 * PX;
    this.alignRight = alignRight;

    this.container = scene.add.container(x, y).setDepth(860);

    this.label = scene.add.text(alignRight ? -this.barW : 0, -16 * PX, label, {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO * 0.85)}px`,
      color: '#f5d78a',
    }).setOrigin(alignRight ? 1 : 0, 0.5);

    this.bg = scene.add.rectangle(
      alignRight ? -this.barW / 2 : this.barW / 2,
      0,
      this.barW,
      this.barH,
      0x000000,
      0.5
    ).setOrigin(alignRight ? 1 : 0, 0.5);

    this.fill = scene.add.rectangle(
      alignRight ? -this.barW : 0,
      0,
      this.barW,
      this.barH,
      color,
      0.95
    ).setOrigin(alignRight ? 1 : 0, 0.5);

    this.container.add([this.label, this.bg, this.fill]);
  }

  setHp(current, max) {
    const ratio = Math.max(0, current / max);
    this.fill.width = this.barW * ratio;
    if (this.alignRight) {
      this.fill.x = -this.barW + this.fill.width / 2;
    } else {
      this.fill.x = this.fill.width / 2;
    }
  }

  destroy() {
    this.container.destroy();
  }
}
