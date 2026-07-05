import Phaser from 'phaser';
import { GAME, QTE, UI, PX } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class QTESystem {
  constructor(scene, { onComplete, onFail }) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.onFail = onFail;
    this.active = false;
    this.hits = 0;
    this.ringRadius = QTE.RING_START;
    this.shrinkStart = 0;

    this.container = scene.add.container(GAME.WIDTH / 2, GAME.HEIGHT * 0.42).setDepth(900);
    this.target = scene.add.circle(0, 0, QTE.SUCCESS_WINDOW, 0x2ecc71, 0.35);
    this.ring = scene.add.circle(0, 0, QTE.RING_START, 0xffffff, 0).setStrokeStyle(4 * PX, 0xffffff);
    this.label = scene.add.text(0, QTE.RING_START + 40 * PX, '在绿色区域按空格！', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#ffffff',
    }).setOrigin(0.5);
    this.progress = scene.add.text(0, -QTE.RING_START - 30 * PX, '', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(GAME.HEIGHT * UI.SMALL_RATIO)}px`,
      color: '#ffd700',
    }).setOrigin(0.5);

    this.container.add([this.target, this.ring, this.label, this.progress]);
    this.container.setVisible(false);

    this.container.setInteractive(
      new Phaser.Geom.Circle(0, 0, QTE.RING_START + 40 * PX),
      Phaser.Geom.Circle.Contains
    );
    this.container.on('pointerdown', () => this.tryHit());

    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.target.setInteractive({ useHandCursor: true });
    this.target.on('pointerdown', (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.tryHit();
    });
  }

  tryHit() {
    if (!this.active) return;
    this.hits += 1;
    if (this.hits >= QTE.HITS_REQUIRED) {
      this.finish(true);
    } else {
      this.beginRound();
    }
  }

  start() {
    this.active = true;
    this.hits = 0;
    gameState.qteActive = true;
    this.container.setVisible(true);
    eventBus.emit(Events.QTE_START);
    this.beginRound();
  }

  beginRound() {
    this.ringRadius = QTE.RING_START;
    this.shrinkStart = this.scene.time.now;
    this.progress.setText(`命中 ${this.hits}/${QTE.HITS_REQUIRED}`);
  }

  update() {
    if (!this.active) return;

    const elapsed = this.scene.time.now - this.shrinkStart;
    const t = Math.min(1, elapsed / QTE.SHRINK_MS);
    this.ringRadius = QTE.RING_START - (QTE.RING_START - QTE.RING_END) * t;
    this.ring.setRadius(this.ringRadius);

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      const elapsed = this.scene.time.now - this.shrinkStart;
      const t = Math.min(1, elapsed / QTE.SHRINK_MS);
      const diff = Math.abs(this.ringRadius - QTE.SUCCESS_WINDOW);
      if (diff <= QTE.SUCCESS_WINDOW * 1.8 || t >= 0.82) {
        this.tryHit();
      } else {
        this.finish(false);
      }
    }

    if (t >= 1) {
      this.finish(false);
    }
  }

  finish(success) {
    this.active = false;
    gameState.qteActive = false;
    this.container.setVisible(false);
    if (success) {
      eventBus.emit(Events.QTE_SUCCESS);
      this.onComplete?.();
    } else {
      eventBus.emit(Events.QTE_FAIL);
      this.onFail?.();
    }
  }

  destroy() {
    this.container.destroy();
  }
}
