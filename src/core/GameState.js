class GameState {
  constructor() {
    this.isMuted = localStorage.getItem('muted') === 'true';
    this.reset();
  }

  reset() {
    this.chapter = 1;
    this.phase = 'menu';
    this.affection = 50;
    this.evolutionLevel = 0;
    this.crystalCount = 0;
    this.flags = {};
    this.dragonDefeated = false;
    this.warriorDefeated = false;
    this.storyComplete = false;
    this.dialogueActive = false;
    this.qteActive = false;
    this.started = false;
    this.gameOver = false;
  }

  setFlag(key, value = true) {
    this.flags[key] = value;
  }

  hasFlag(key) {
    return Boolean(this.flags[key]);
  }

  addAffection(delta) {
    this.affection = Math.min(100, Math.max(0, this.affection + delta));
  }
}

export const gameState = new GameState();
