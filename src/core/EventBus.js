export const Events = {
  GAME_START: 'game:start',
  GAME_OVER: 'game:over',
  GAME_RESTART: 'game:restart',
  CHAPTER_CHANGED: 'chapter:changed',
  AFFECTION_CHANGED: 'affection:changed',
  DIALOGUE_START: 'dialogue:start',
  DIALOGUE_END: 'dialogue:end',
  QTE_START: 'qte:start',
  QTE_SUCCESS: 'qte:success',
  QTE_FAIL: 'qte:fail',
  DRAGON_DEFEATED: 'dragon:defeated',
  KISS_REVEAL: 'story:kissReveal',
  WARRIOR_DEFEATED: 'warrior:defeated',
  STORY_COMPLETE: 'story:complete',
  BOUNTY_ACCEPTED: 'story:bountyAccepted',
};

class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (!this.listeners[event]) return this;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    return this;
  }

  emit(event, data) {
    if (!this.listeners[event]) return this;
    this.listeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (err) {
        console.error(`EventBus error in ${event}:`, err);
      }
    });
    return this;
  }

  removeAll() {
    this.listeners = {};
    return this;
  }
}

export const eventBus = new EventBus();
