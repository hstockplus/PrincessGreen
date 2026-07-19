class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this.listeners.get(event)?.delete(fn);
  }

  emit(event, payload) {
    this.listeners.get(event)?.forEach((fn) => {
      try { fn(payload); } catch (e) { console.warn('[EventBus]', event, e); }
    });
  }

  clear() {
    this.listeners.clear();
  }
}

export const Events = {
  AUDIO_INIT: 'audio:init',
  MUSIC_PLAY: 'music:play',
  MUSIC_STOP: 'music:stop',
  AUDIO_TOGGLE_MUTE: 'audio:toggle_mute',
  SFX: 'sfx:play',
  SCENE_ENTER: 'scene:enter',
  PLAYER_JUMP: 'player:jump',
  PLAYER_ATTACK: 'player:attack',
  PLAYER_HURT: 'player:hurt',
  PLAYER_HEAL: 'player:heal',
  ITEM_PICKUP: 'item:pickup',
  DASH: 'player:dash',
  HIT: 'combat:hit',
  TRANSFORM: 'story:transform',
  FIREBALL: 'combat:fireball',
  STORY_COMPLETE: 'story:complete',
};

export const eventBus = new EventBus();
