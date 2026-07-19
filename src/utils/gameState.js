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
  }
}

export const gameState = new GameState();
