import { audioManager } from './AudioManager.js';

function beep({ freq = 440, freqEnd, type = 'square', duration = 0.1, gain = 0.08 }) {
  const ctx = audioManager.getCtx();
  const dest = audioManager.getMaster();
  if (!ctx || !dest) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + duration);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + duration);
}

export const SFX = {
  jump: () => beep({ freq: 420, freqEnd: 680, type: 'square', duration: 0.09, gain: 0.06 }),
  sword: () => beep({ freq: 880, freqEnd: 220, type: 'sawtooth', duration: 0.1, gain: 0.07 }),
  hit: () => beep({ freq: 180, freqEnd: 80, type: 'square', duration: 0.12, gain: 0.1 }),
  hurt: () => beep({ freq: 300, freqEnd: 90, type: 'sawtooth', duration: 0.2, gain: 0.09 }),
  heal: () => beep({ freq: 520, freqEnd: 880, type: 'sine', duration: 0.18, gain: 0.07 }),
  pickup: () => beep({ freq: 660, freqEnd: 990, type: 'triangle', duration: 0.12, gain: 0.07 }),
  fireball: () => beep({ freq: 200, freqEnd: 120, type: 'sawtooth', duration: 0.16, gain: 0.08 }),
  dash: () => beep({ freq: 200, freqEnd: 900, type: 'square', duration: 0.14, gain: 0.08 }),
  transform: () => beep({ freq: 400, freqEnd: 160, type: 'triangle', duration: 0.35, gain: 0.1 }),
};
