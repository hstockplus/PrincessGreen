import { GAME, UI, TRANSITION } from '../core/Constants.js';

export function showChapterTitle(scene, title, subtitle, onComplete) {
  const overlay = scene.add.rectangle(
    GAME.WIDTH / 2,
    GAME.HEIGHT / 2,
    GAME.WIDTH,
    GAME.HEIGHT,
    0x000000,
    1
  ).setDepth(2000).setAlpha(1);

  const titleText = scene.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.42, title, {
    fontFamily: UI.FONT,
    fontSize: `${Math.round(GAME.HEIGHT * UI.TITLE_RATIO)}px`,
    color: '#ffffff',
  }).setOrigin(0.5).setDepth(2001).setAlpha(0);

  const subText = scene.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.52, subtitle, {
    fontFamily: UI.FONT,
    fontSize: `${Math.round(GAME.HEIGHT * UI.HEADING_RATIO)}px`,
    color: '#cccccc',
  }).setOrigin(0.5).setDepth(2001).setAlpha(0);

  scene.tweens.add({
    targets: [titleText, subText],
    alpha: 1,
    duration: TRANSITION.FADE_DURATION,
    onComplete: () => {
      scene.time.delayedCall(1200, () => {
        scene.tweens.add({
          targets: [overlay, titleText, subText],
          alpha: 0,
          duration: TRANSITION.FADE_DURATION,
          onComplete: () => {
            overlay.destroy();
            titleText.destroy();
            subText.destroy();
            onComplete?.();
          },
        });
      });
    },
  });
}
