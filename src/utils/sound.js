import { eventBus, Events } from '../core/EventBus.js';

/** 统一音频门面 — 经 EventBus → AudioBridge */
export const sound = {
  unlock() {
    eventBus.emit(Events.AUDIO_INIT);
  },

  play(name) {
    eventBus.emit(Events.AUDIO_INIT);
    eventBus.emit(Events.SFX, { name });
  },

  playBgm(name) {
    eventBus.emit(Events.AUDIO_INIT);
    eventBus.emit(Events.MUSIC_PLAY, { track: name });
  },

  stopBgm() {
    eventBus.emit(Events.MUSIC_STOP);
  },

  toggleMute() {
    eventBus.emit(Events.AUDIO_TOGGLE_MUTE);
  },
};
