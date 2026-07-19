class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.currentBgm = null;
    this.unlocked = false;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);
  }

  async unlock() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.unlocked = this.ctx.state === 'running';
  }

  getCtx() {
    this.init();
    return this.ctx;
  }

  getMaster() {
    this.init();
    return this.master;
  }

  playMusic(patternFn) {
    this.stopMusic();
    const ctx = this.getCtx();
    const master = this.getMaster();
    if (!ctx || !master || !patternFn) return;
    try {
      this.currentBgm = patternFn(ctx, master);
    } catch (e) {
      console.warn('[Audio] BGM error', e);
    }
  }

  stopMusic() {
    if (this.currentBgm) {
      try { this.currentBgm.stop(); } catch { /* ignore */ }
      this.currentBgm = null;
    }
  }
}

export const audioManager = new AudioManager();
