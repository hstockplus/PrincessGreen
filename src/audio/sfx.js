import { audioManager } from './AudioManager.js';

function beep({ freq = 440, freqEnd, type = 'square', duration = 0.1, gain = 0.08, delay = 0 }) {
  const ctx = audioManager.getCtx();
  const dest = audioManager.getMaster();
  if (!ctx || !dest) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + duration);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function noiseBurst({ duration = 0.08, gain = 0.05, freq = 800 } = {}) {
  const ctx = audioManager.getCtx();
  const dest = audioManager.getMaster();
  if (!ctx || !dest) return;
  const t = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(filter).connect(g).connect(dest);
  src.start(t);
  src.stop(t + duration);
}

export const SFX = {
  jump: () => beep({ freq: 420, freqEnd: 680, type: 'square', duration: 0.09, gain: 0.06 }),
  sword: () => {
    noiseBurst({ duration: 0.07, gain: 0.06, freq: 2200 });
    beep({ freq: 980, freqEnd: 260, type: 'sawtooth', duration: 0.11, gain: 0.09 });
    beep({ freq: 1400, freqEnd: 400, type: 'square', duration: 0.06, gain: 0.04, delay: 0.02 });
  },
  qi: () => {
    beep({ freq: 520, freqEnd: 1100, type: 'sine', duration: 0.16, gain: 0.08 });
    beep({ freq: 880, freqEnd: 220, type: 'sawtooth', duration: 0.2, gain: 0.06, delay: 0.04 });
    noiseBurst({ duration: 0.12, gain: 0.05, freq: 1400 });
  },
  hit: () => {
    beep({ freq: 180, freqEnd: 70, type: 'square', duration: 0.12, gain: 0.11 });
    noiseBurst({ duration: 0.06, gain: 0.07, freq: 400 });
  },
  hurt: () => beep({ freq: 300, freqEnd: 90, type: 'sawtooth', duration: 0.2, gain: 0.09 }),
  heal: () => {
    beep({ freq: 520, freqEnd: 880, type: 'sine', duration: 0.18, gain: 0.07 });
    beep({ freq: 660, freqEnd: 990, type: 'triangle', duration: 0.14, gain: 0.05, delay: 0.05 });
  },
  pickup: () => {
    beep({ freq: 700, freqEnd: 1200, type: 'triangle', duration: 0.1, gain: 0.09 });
    beep({ freq: 900, freqEnd: 1400, type: 'sine', duration: 0.12, gain: 0.06, delay: 0.05 });
  },
  fireball: () => beep({ freq: 200, freqEnd: 120, type: 'sawtooth', duration: 0.16, gain: 0.08 }),
  dash: () => beep({ freq: 200, freqEnd: 900, type: 'square', duration: 0.14, gain: 0.08 }),
  transform: () => beep({ freq: 400, freqEnd: 160, type: 'triangle', duration: 0.35, gain: 0.1 }),
};
