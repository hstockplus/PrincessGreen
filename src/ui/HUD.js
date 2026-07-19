import Phaser from 'phaser';
import { GAME, COLORS, FONT, ITEM, PLAYER } from '../utils/constants.js';
import { gameState } from '../utils/gameState.js';
import { ASSETS } from '../art/AssetLoader.js';
import { eventBus, Events } from '../core/EventBus.js';

/**
 * 左上：头像 + 血条 + 内力条 + 背包详情；右上：任务提示
 */
export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(900).setScrollFactor(0);

    this.avatarBg = scene.add.rectangle(52, 52, 72, 72, 0x1a1410, 0.9)
      .setStrokeStyle(2, COLORS.GOLD, 0.7);
    if (scene.textures.exists(ASSETS.WARRIOR)) {
      this.avatar = scene.add.image(52, 52, ASSETS.WARRIOR).setDisplaySize(64, 64);
    } else {
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

    // 背包面板
    this.bagPanel = scene.add.rectangle(100, 118, 280, 72, 0x0a0a0c, 0.78)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, COLORS.GOLD, 0.35);
    if (scene.textures.exists(ASSETS.LINGZHI)) {
      this.bagIcon = scene.add.image(124, 110, ASSETS.LINGZHI).setDisplaySize(36, 36);
    } else {
      this.bagIcon = scene.add.circle(124, 110, 14, COLORS.LINGZHI, 1);
    }
    this.bagTitle = scene.add.text(150, 96, '背包 · 墨色灵芝', {
      fontFamily: FONT.FAMILY,
      fontSize: '15px',
      color: COLORS.GOLD_LIGHT,
    });
    this.bagCount = scene.add.text(150, 118, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '16px',
      color: COLORS.UI_TEXT,
    });
    this.bagDesc = scene.add.text(150, 138, `恢复 ${Math.round(PLAYER.HEAL_RATIO * 100)}% 气血 · [Q]/药`, {
      fontFamily: FONT.FAMILY,
      fontSize: '13px',
      color: COLORS.UI_MUTED,
    });

    this.questBox = scene.add.rectangle(GAME.WIDTH - 16, 16, 280, 88, 0x0a0a0c, 0.75)
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
      wordWrap: { width: 250 },
    }).setOrigin(1, 0);

    this.hint = scene.add.text(GAME.WIDTH / 2, GAME.HEIGHT - 28, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '15px',
      color: COLORS.UI_MUTED,
    }).setOrigin(0.5);

    this.toast = scene.add.text(GAME.WIDTH / 2, 120, '', {
      fontFamily: FONT.FAMILY,
      fontSize: '20px',
      color: COLORS.GOLD_LIGHT,
      stroke: '#1a1008',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.container.add([
      this.avatarBg, this.avatar,
      this.hpBg, this.hpBar, this.hpText,
      this.mpBg, this.mpBar, this.mpText,
      this.bagPanel, this.bagIcon, this.bagTitle, this.bagCount, this.bagDesc,
      this.questBox, this.questTitle, this.questText, this.hint, this.toast,
    ]);

    this._onRefresh = () => this.refresh();
    this._onPickup = (payload) => {
      this.refresh();
      this.showToast(`获得 墨色灵芝 ×${payload?.amount || 1}（剩余 ${gameState.lingzhi}/${ITEM.BAG_MAX}）`);
    };
    this._onUse = () => {
      this.refresh();
      this.showToast(`使用灵芝 · 剩余 ${gameState.lingzhi}/${ITEM.BAG_MAX}`);
    };
    eventBus.on(Events.HUD_REFRESH, this._onRefresh);
    eventBus.on(Events.ITEM_PICKUP, this._onPickup);
    eventBus.on(Events.ITEM_USE, this._onUse);

    this.refresh();
  }

  showToast(msg) {
    this.toast.setText(msg);
    this.toast.setAlpha(1);
    this.scene.tweens.killTweensOf(this.toast);
    this.scene.tweens.add({
      targets: this.toast,
      alpha: 0,
      delay: 900,
      duration: 400,
    });
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
    const n = gameState.lingzhi;
    this.bagCount.setText(`剩余 ${n} / ${ITEM.BAG_MAX}${n <= 0 ? '  （空）' : ''}`);
    this.bagCount.setColor(n <= 0 ? '#886666' : COLORS.UI_TEXT);
    this.bagIcon.setAlpha(n <= 0 ? 0.35 : 1);
  }

  destroy() {
    eventBus.off(Events.HUD_REFRESH, this._onRefresh);
    eventBus.off(Events.ITEM_PICKUP, this._onPickup);
    eventBus.off(Events.ITEM_USE, this._onUse);
    this.container.destroy();
  }
}
