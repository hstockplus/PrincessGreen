import Phaser from 'phaser';
import { GAME, COLORS, FONT, ITEM } from '../utils/constants.js';
import { gameState } from '../utils/gameState.js';

/**
 * 血条 + 灵芝背包数量
 */
export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(900);

    this.hpBg = scene.add.rectangle(24, 24, 220, 18, 0x220808, 0.85).setOrigin(0, 0.5)
      .setStrokeStyle(1, COLORS.GOLD, 0.5);
    this.hpBar = scene.add.rectangle(26, 24, 216, 14, COLORS.BLOOD, 1).setOrigin(0, 0.5);
    this.hpText = scene.add.text(250, 24, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '16px',
      color: COLORS.UI_TEXT,
    }).setOrigin(0, 0.5);

    this.bagText = scene.add.text(24, 48, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '16px',
      color: COLORS.GOLD_LIGHT,
    });

    this.hint = scene.add.text(GAME.WIDTH / 2, GAME.HEIGHT - 28, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '15px',
      color: COLORS.UI_MUTED,
    }).setOrigin(0.5);

    this.container.add([this.hpBg, this.hpBar, this.hpText, this.bagText, this.hint]);
    this.refresh();
  }

  setHint(text) {
    this.hint.setText(text);
  }

  refresh() {
    const ratio = Phaser.Math.Clamp(gameState.hp / gameState.maxHp, 0, 1);
    this.hpBar.width = 216 * ratio;
    this.hpText.setText(`气血 ${Math.ceil(gameState.hp)}/${gameState.maxHp}`);
    this.bagText.setText(`墨色灵芝 ×${gameState.lingzhi}/${ITEM.BAG_MAX}  [Q]使用`);
  }

  destroy() {
    this.container.destroy();
  }
}
