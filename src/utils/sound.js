import { audioManager } from '../audio/AudioManager.js';
import { BGM_MAP } from '../audio/music.js';
import { SFX } from '../audio/sfx.js';

let currentTrack = null;

export const sound = {
  async unlock() {
    await audioManager.unlock();
  },

  play(name) {
    audioManager.unlock();
    SFX[name]?.();
  },

  playBgm(name) {
    if (currentTrack === name) return;
    currentTrack = name;
    audioManager.unlock().then(() => {
      const fn = BGM_MAP[name];
      if (fn) audioManager.playMusic(fn);
    });
  },

  stopBgm() {
    currentTrack = null;
    audioManager.stopMusic();
  },
};
