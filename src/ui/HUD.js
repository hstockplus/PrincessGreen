import Phaser from 'phaser';
import { GAME, COLORS, FONT, ITEM } from '../utils/constants.js';
import { gameState } from '../utils/gameState.js';
import { ASSETS } from '../art/AssetLoader.js';

/**
 * 左上：头像 + 血条 + 内力条；右上：任务提示；背包灵芝
 */
export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(900).setScrollFactor(0);

    // 头像框
    this.avatarBg = scene.add.rectangle(52, 52, 72, 72, 0x1a1410, 0.9)
      .setStrokeStyle(2, COLORS.GOLD, 0.7);
    if (scene.textures.exists(ASSETS.WARRIOR)) {
      this.avatar = scene.add.image(52, 52, ASSETS.WARRIOR).setDisplaySize(64, 64);
    } else {
      // TODO: 替换为实际美术资源
      this.avatar = scene.add.circle(52, 52, 28, COLORS.WARRIOR, 1);
    }

    this.hpBg = scene.add.rectangle(100, 28, 220, 16, 0x220808, 0.85).setOrigin(0, 0.5)
      .setStrokeStyle(1, COLORS.GOLD, 0.5);
    this.hpBar = scene.add.rectangle(102, 28, 216, 12, COLORS.BLOOD, 1).setOrigin(0, 0.5);
    this.hpText = scene.add.text(330, 28, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '14px',
      color: COLORS.UI_TEXT,
    }).setOrigin(0, 0.5);

    this.mpBg = scene.add.rectangle(100, 52, 220, 14, 0x081422, 0.85).setOrigin(0, 0.5)
      .setStrokeStyle(1, COLORS.MP, 0.5);
    this.mpBar = scene.add.rectangle(102, 52, 216, 10, COLORS.MP, 1).setOrigin(0, 0.5);
    this.mpText = scene.add.text(330, 52, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '14px',
      color: COLORS.UI_MUTED,
    }).setOrigin(0, 0.5);

    this.bagText = scene.add.text(100, 74, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '15px',
      color: COLORS.GOLD_LIGHT,
    });

    this.questBox = scene.add.rectangle(GAME.WIDTH - 16, 16, 260, 72, 0x0a0a0c, 0.75)
      .setOrigin(1, 0)
      .setStrokeStyle(1, COLORS.GOLD, 0.4);
    this.questTitle = scene.add.text(GAME.WIDTH - 28, 28, '任务', {
      fontFamily: FONT.FAMILY,
      fontSize: '14px',
      color: COLORS.GOLD,
    }).setOrigin(1, 0);
    this.questText = scene.add.text(GAME.WIDTH - 28, 50, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '15px',
      color: COLORS.UI_TEXT,
      align: 'right',
      wordWrap: { width: 230 },
    }).setOrigin(1, 0);

    this.hint = scene.add.text(GAME.WIDTH / 2, GAME.HEIGHT - 28, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '15px',
      color: COLORS.UI_MUTED,
    }).setOrigin(0.5);

    this.container.add([
      this.avatarBg, this.avatar,
      this.hpBg, this.hpBar, this.hpText,
      this.mpBg, this.mpBar, this.mpText,
      this.bagText, this.questBox, this.questTitle, this.questText, this.hint,
    ]);
    this.refresh();
  }

  setHint(text) {
    this.hint.setText(text);
  }

  setQuest(text) {
    this.questText.setText(text || '');
  }

  refresh() {
    const hpRatio = Phaser.Math.Clamp(gameState.hp / gameState.maxHp, 0, 1);
    const mpRatio = Phaser.Math.Clamp(gameState.mp / gameState.maxMp, 0, 1);
    this.hpBar.width = 216 * hpRatio;
    this.mpBar.width = 216 * mpRatio;
    this.hpText.setText(`气血 ${Math.ceil(gameState.hp)}/${gameState.maxHp}`);
    this.mpText.setText(`内力 ${Math.ceil(gameState.mp)}/${gameState.maxMp}`);
    this.bagText.setText(`墨色灵芝 ×${gameState.lingzhi}/${ITEM.BAG_MAX}  [Q]使用`);
  }

  destroy() {
    this.container.destroy();
  }
}
