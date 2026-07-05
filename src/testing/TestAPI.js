import { gameState } from '../core/GameState.js';

const handlers = {
  pickDialogueChoice: null,
  forceQTESuccess: null,
  moveWarrior: null,
};

export function registerTestHandler(name, fn) {
  handlers[name] = fn;
}

export function getTestHandlers() {
  return handlers;
}

export function getGameSnapshot(game) {
  const activeScenes = game?.scene?.getScenes(true) ?? [];
  const scene = activeScenes[0];

  return {
    coords: 'origin:top-left x:right y:down',
    phase: gameState.phase,
    chapter: gameState.chapter,
    affection: gameState.affection,
    flags: { ...gameState.flags },
    dragonDefeated: gameState.dragonDefeated,
    warriorDefeated: gameState.warriorDefeated,
    storyComplete: gameState.storyComplete,
    dialogueActive: gameState.dialogueActive,
    qteActive: gameState.qteActive,
    started: gameState.started,
    scene: scene?.scene?.key ?? null,
    scenes: activeScenes.map((s) => s.scene.key),
    player: scene?.warrior
      ? { x: Math.round(scene.warrior.x), y: Math.round(scene.warrior.y) }
      : scene?.player
        ? { x: Math.round(scene.player.x), y: Math.round(scene.player.y) }
        : null,
    qte: scene?.qte?.active
      ? { ringRadius: scene.qte.ringRadius, hits: scene.qte.hits, targetRadius: scene.qte.target?.radius }
      : null,
  };
}
