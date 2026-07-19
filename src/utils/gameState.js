import { PLAYER } from './constants.js';

class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.hp = PLAYER.MAX_HP;
    this.maxHp = PLAYER.MAX_HP;
    this.mp = PLAYER.MAX_MP;
    this.maxMp = PLAYER.MAX_MP;
    this.lingzhi = 0;
    this.tookFrog = false;
    this.choseFightDragon = null;
    this.branch = null; // 'win' | 'lose' | 'question'
    this.phase = 'boot';
    this.storyComplete = false;
    this.dialogueActive = false;
  }
}

export const gameState = new GameState();
