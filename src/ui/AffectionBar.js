import { GAME, UI, PX } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class AffectionBar {
  constructor(scene, x, y) {
    this.scene = scene;
    this.container = scene.add.container(x, y).setDepth(500);

    const w = GAME.WIDTH * 0.18;
    const h = 14 * PX;
    this.bg = scene.add.rectangle(0, 0, w, h, 0x222222, 0.8).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(0, 0, w, h, 0xe74c3c, 0.9).setOrigin(0, 0.5);
    this.label = scene.add.text(-4 * PX, -22 * PX, '好感度', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    this.container.add([this.bg, this.fill, this.label]);
    this.maxWidth = w;
    this.refresh();

    this._onChange = () => this.refresh();
    eventBus.on(Events.AFFECTION_CHANGED, this._onChange);
  }

  refresh() {
    const ratio = gameState.affection / 100;
    this.fill.width = this.maxWidth * ratio;
    this.fill.x = 0;
  }

  destroy() {
    eventBus.off(Events.AFFECTION_CHANGED, this._onChange);
    this.container.destroy();
  }
}
