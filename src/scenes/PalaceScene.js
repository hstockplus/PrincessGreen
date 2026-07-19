import Phaser from 'phaser';
import { GAME, COLORS, FONT } from '../utils/constants.js';
import { DialogBox } from '../ui/DialogBox.js';
import { sound } from '../utils/sound.js';

export class PalaceScene extends Phaser.Scene {
  constructor() {
    super('PalaceScene');
  }

  create() {
    sound.playBgm('palace');
    this.drawPalace();

    this.add.text(GAME.WIDTH / 2, 48, '第一幕 · 王宫悬赏', {
      fontFamily: FONT.FAMILY,
      fontSize: '28px',
      color: COLORS.GOLD_LIGHT,
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(400, 0, 0, 0);

    // 国王剪影（像素后续可替换）
    this.add.rectangle(GAME.WIDTH * 0.55, GAME.HEIGHT * 0.52, 50, 90, COLORS.GOLD, 0.85);
    this.add.triangle(GAME.WIDTH * 0.55, GAME.HEIGHT * 0.52 - 60, 0, 30, 25, 0, 50, 30, COLORS.GOLD_LIGHT);
    this.add.image(GAME.WIDTH * 0.32, GAME.HEIGHT * 0.58, 'tex_warrior').setScale(1.6);

    this.add.particles(GAME.WIDTH * 0.5, 100, 'tex_fireball', {
      tint: 0xc9a227,
      scale: { start: 0.1, end: 0.35 },
      alpha: { start: 0.35, end: 0 },
      speedY: { min: 10, max: 40 },
      lifespan: 3000,
      frequency: 220,
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-400, 0, 800, 40) },
      blendMode: 'ADD',
    });

    this.dialog = new DialogBox(this);
    this.runIntro();
  }

  drawPalace() {
    // 暗黑水墨宫殿背景
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a0c10, 0x0a0c10, 0x1a1510, 0x1a1510, 1);
    g.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    g.fillStyle(0x121820, 0.8);
    g.fillRect(0, GAME.HEIGHT * 0.7, GAME.WIDTH, GAME.HEIGHT * 0.3);
    // pillars
    for (let i = 0; i < 6; i++) {
      const x = 100 + i * 210;
      g.fillStyle(0x2a2418, 0.7);
      g.fillRect(x, 80, 36, GAME.HEIGHT * 0.62);
      g.fillStyle(COLORS.GOLD, 0.25);
      g.fillRect(x - 8, 80, 52, 12);
    }
    // ink wash clouds
    g.fillStyle(0xffffff, 0.03);
    g.fillEllipse(200, 120, 280, 60);
    g.fillEllipse(900, 100, 320, 50);
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
