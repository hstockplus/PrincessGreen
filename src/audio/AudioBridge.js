import { eventBus, Events } from '../core/EventBus.js';
import { audioManager } from './AudioManager.js';
import { BGM_MAP } from './music.js';
import { SFX } from './sfx.js';

let wired = false;
let currentTrack = null;

export function initAudioBridge() {
  if (wired) return;
  wired = true;

  eventBus.on(Events.AUDIO_INIT, async () => {
    await audioManager.unlock();
  });

  eventBus.on(Events.MUSIC_PLAY, ({ track } = {}) => {
    if (!track || currentTrack === track) return;
    currentTrack = track;
    const fn = BGM_MAP[track];
    if (fn) audioManager.playMusic(fn);
  });

  eventBus.on(Events.MUSIC_STOP, () => {
    currentTrack = null;
    audioManager.stopMusic();
  });

  eventBus.on(Events.AUDIO_TOGGLE_MUTE, () => {
    audioManager.toggleMute();
  });

  eventBus.on(Events.SFX, ({ name } = {}) => {
    SFX[name]?.();
  });

  // convenience direct SFX events
  [
    [Events.PLAYER_JUMP, 'jump'],
    [Events.PLAYER_ATTACK, 'sword'],
    [Events.PLAYER_HURT, 'hurt'],
    [Events.PLAYER_HEAL, 'heal'],
    [Events.ITEM_PICKUP, 'pickup'],
    [Events.DASH, 'dash'],
    [Events.HIT, 'hit'],
    [Events.TRANSFORM, 'transform'],
    [Events.FIREBALL, 'fireball'],
  ].forEach(([evt, name]) => {
    eventBus.on(evt, () => SFX[name]?.());
  });
}
