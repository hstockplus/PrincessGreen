import Phaser from 'phaser';
import { GAME, COLORS, FONT } from '../utils/constants.js';
import { DialogBox } from '../ui/DialogBox.js';
import { sound } from '../utils/sound.js';
import { gameState } from '../utils/gameState.js';
import { registerTestHandler } from '../testing/TestAPI.js';
import { ASSETS, showBackground, fitActor } from '../art/AssetLoader.js';

export class PalaceScene extends Phaser.Scene {
  constructor() {
    super('PalaceScene');
  }

  create() {
    gameState.phase = 'palace';
    sound.playBgm('palace');
    showBackground(this, ASSETS.BG_PALACE);
    this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.25).setDepth(0);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.cameras.main.flash(250, 40, 30, 20);

    this.add.text(GAME.WIDTH / 2, 48, '第一幕 · 王宫悬赏', {
      fontFamily: FONT.FAMILY,
      fontSize: '28px',
      color: COLORS.GOLD_LIGHT,
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);

    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT - 28, '点击屏幕继续对话', {
      fontFamily: FONT.FAMILY,
      fontSize: '16px',
      color: COLORS.UI_MUTED,
    }).setOrigin(0.5).setDepth(50);

    // 立绘：勇士左、悬赏画像右（统一身高比例）
    const warrior = this.add.image(GAME.WIDTH * 0.28, GAME.HEIGHT * 0.92, ASSETS.WARRIOR)
      .setOrigin(0.5, 1).setDepth(10);
    fitActor(warrior, 'warrior');
    warrior.setScale(warrior.scaleX * 1.55);

    if (this.textures.exists(ASSETS.PRINCESS)) {
      const portrait = this.add.image(GAME.WIDTH * 0.72, GAME.HEIGHT * 0.55, ASSETS.PRINCESS)
        .setOrigin(0.5, 1).setAlpha(0.4).setDepth(5);
      fitActor(portrait, 'princess');
      portrait.setScale(portrait.scaleX * 1.2);
    }

    this.dialog = new DialogBox(this);
    registerTestHandler('advanceDialogue', () => this.dialog.forceAdvance());
    registerTestHandler('pickDialogueChoice', (id) => this.dialog.forcePick(id));
    this.runIntro();
  }

  async runIntro() {
    const choice = await this.dialog.show([
      { speaker: '国王', text: '恶龙掳走了我的女儿！谁能救回公主，赏黄金千两、封爵位！' },
      { speaker: '勇士', text: '陛下，我愿接此悬赏。我乃修炼五百年的金蟾转世，专克邪祟妖龙！' },
      { speaker: '大臣', text: '金蟾转世？哼……满朝文武无人敢接，你一个小小游侠……' },
      { speaker: '国王', text: '罢了！既然无人敢去，便由你一试。救出公主，悬赏全数奉上！' },
      {
        speaker: '旁白',
        text: '勇士领命，将穿过绝望沼泽，前往恶龙城堡……',
        choices: [{ label: '出发', id: 'depart' }],
      },
    ]);

    if (choice === 'depart' || choice === null) {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, () => this.scene.start('SwampScene'));
    }
  }

  update() {
    this.dialog?.update();
  }
}
