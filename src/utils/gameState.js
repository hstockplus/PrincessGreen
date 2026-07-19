class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.hp = 100;
    this.maxHp = 100;
    this.lingzhi = 0;
    this.tookFrog = false;
    this.choseFightDragon = null;
    this.branch = null; // 'win' | 'lose' | 'question'
    this.phase = 'boot';
    this.storyComplete = false;
  }
}

export const gameState = new GameState();
