import { gameState } from '../utils/gameState.js';

const handlers = {};

export function registerTestHandler(name, fn) {
  handlers[name] = fn;
}

export function getTestHandlers() {
  return handlers;
}

export function getGameSnapshot(game) {
  const scenes = game?.scene?.getScenes?.(true) || [];
  const active = scenes[0];
  const key = active?.sys?.settings?.key || active?.scene?.key || null;
  return {
    scene: key,
    phase: gameState.phase || null,
    hp: gameState.hp,
    lingzhi: gameState.lingzhi,
    tookFrog: gameState.tookFrog,
    branch: gameState.branch,
    dialogueActive: !!active?.dialog?.active,
    battleActive: active?.state === 'battle',
    storyComplete: !!gameState.storyComplete,
  };
}
