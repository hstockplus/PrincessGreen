let ctx = null;
let musicHandle = null;
let musicMode = null;

const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00, A3: 220.00,
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
  C5: 523.25, D5: 587.33, E5: 659.25,
};

function getCtx() {
  if (ctx) return ctx;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    return ctx;
  } catch {
    return null;
  }
}

function resumeAudio() {
  const audio = getCtx();
  if (!audio) return null;
  if (audio.state === 'suspended') {
    audio.resume().catch(() => {});
  }
  return audio;
}

let pendingMode = 'ambient';

function attachAudioUnlock() {
  if (attachAudioUnlock.done) return;
  attachAudioUnlock.done = true;
  const audio = getCtx();
  if (!audio) return;
  const onRunning = () => {
    if (audio.state === 'running' && pendingMode && pendingMode !== 'none') {
      if (musicMode !== pendingMode) setMusicMode(pendingMode);
      else ensureMusicPlaying();
    }
  };
  audio.addEventListener('statechange', onRunning);
  onRunning();
}

function runSequencer(audio, { bpm, stepsPerBeat = 2, layers }) {
  const stepDuration = 60 / bpm / stepsPerBeat;
  let stepIndex = 0;
  let nextStepTime = audio.currentTime + 0.05;
  let stopped = false;
  let timerId = null;

  const schedule = () => {
    if (stopped) return;
    while (nextStepTime < audio.currentTime + 0.12) {
      for (const layer of layers) {
        const note = layer[stepIndex % layer.length];
        if (note?.freq > 0) {
          const osc = audio.createOscillator();
          osc.type = note.type || 'triangle';
          osc.frequency.setValueAtTime(note.freq, nextStepTime);
          const gain = audio.createGain();
          const noteGain = note.gain ?? 0.05;
          gain.gain.setValueAtTime(noteGain, nextStepTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nextStepTime + stepDuration * (note.hold ?? 0.9));
          const filter = audio.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(note.lpf ?? 2400, nextStepTime);
          osc.connect(filter).connect(gain).connect(audio.destination);
          osc.start(nextStepTime);
          osc.stop(nextStepTime + stepDuration);
        }
      }
      stepIndex += 1;
      nextStepTime += stepDuration;
    }
    timerId = setTimeout(schedule, 30);
  };

  schedule();
  return {
    stop() {
      stopped = true;
      if (timerId) clearTimeout(timerId);
    },
  };
}

function runAmbientSequencer(audio) {
  const melody = [
    { freq: NOTES.E4, type: 'sine', gain: 0.045, lpf: 2200 }, { freq: 0 },
    { freq: NOTES.G4, type: 'sine', gain: 0.04, lpf: 2200 }, { freq: NOTES.A4, type: 'sine', gain: 0.04, lpf: 2200 },
    { freq: NOTES.G4, type: 'sine', gain: 0.038, lpf: 2200 }, { freq: 0 },
    { freq: NOTES.E4, type: 'sine', gain: 0.042, lpf: 2200 }, { freq: NOTES.D4, type: 'sine', gain: 0.038, lpf: 2200 },
    { freq: NOTES.C4, type: 'sine', gain: 0.04, lpf: 2000 }, { freq: 0 },
    { freq: NOTES.D4, type: 'sine', gain: 0.038, lpf: 2000 }, { freq: NOTES.E4, type: 'sine', gain: 0.04, lpf: 2200 },
    { freq: NOTES.G4, type: 'sine', gain: 0.042, lpf: 2200 }, { freq: NOTES.A4, type: 'sine', gain: 0.04, lpf: 2200 },
    { freq: NOTES.G4, type: 'sine', gain: 0.038, lpf: 2200 }, { freq: 0 }, { freq: 0 }, { freq: 0 },
  ];
  const harmony = [
    { freq: NOTES.C4, type: 'triangle', gain: 0.028, lpf: 1600 }, { freq: 0 }, { freq: 0 }, { freq: 0 },
    { freq: NOTES.G3, type: 'triangle', gain: 0.026, lpf: 1500 }, { freq: 0 }, { freq: 0 }, { freq: 0 },
    { freq: NOTES.A3, type: 'triangle', gain: 0.026, lpf: 1500 }, { freq: 0 }, { freq: 0 }, { freq: 0 },
    { freq: NOTES.E3, type: 'triangle', gain: 0.028, lpf: 1400 }, { freq: 0 }, { freq: 0 }, { freq: 0 },
  ];
  const bass = [
    { freq: NOTES.C3, type: 'triangle', gain: 0.032, lpf: 900 }, { freq: 0 },
    { freq: NOTES.C3, type: 'triangle', gain: 0.03, lpf: 900 }, { freq: 0 },
    { freq: NOTES.G3, type: 'triangle', gain: 0.03, lpf: 900 }, { freq: 0 },
    { freq: NOTES.E3, type: 'triangle', gain: 0.03, lpf: 900 }, { freq: 0 },
    { freq: NOTES.C3, type: 'triangle', gain: 0.032, lpf: 900 }, { freq: 0 },
    { freq: NOTES.C3, type: 'triangle', gain: 0.03, lpf: 900 }, { freq: 0 },
    { freq: NOTES.G3, type: 'triangle', gain: 0.03, lpf: 900 }, { freq: 0 },
    { freq: NOTES.E3, type: 'triangle', gain: 0.03, lpf: 900 }, { freq: 0 },
  ];
  return runSequencer(audio, { bpm: 76, stepsPerBeat: 2, layers: [melody, harmony, bass] });
}

function runBattleSequencer(audio) {
  const melody = [
    { freq: NOTES.E4, type: 'square', gain: 0.07 }, { freq: 0 },
    { freq: NOTES.G4, type: 'square', gain: 0.07 }, { freq: NOTES.A4, type: 'square', gain: 0.07 },
    { freq: NOTES.G4, type: 'square', gain: 0.07 }, { freq: 0 },
    { freq: NOTES.E4, type: 'square', gain: 0.07 }, { freq: NOTES.D4, type: 'square', gain: 0.07 },
    { freq: NOTES.C4, type: 'square', gain: 0.07 }, { freq: 0 },
    { freq: NOTES.D4, type: 'square', gain: 0.07 }, { freq: NOTES.E4, type: 'square', gain: 0.07 },
    { freq: NOTES.G4, type: 'square', gain: 0.07 }, { freq: NOTES.A4, type: 'square', gain: 0.07 },
    { freq: NOTES.G4, type: 'square', gain: 0.07 }, { freq: 0 },
  ];
  const bass = [
    { freq: NOTES.E3, type: 'triangle', gain: 0.1 }, { freq: 0 },
    { freq: NOTES.E3, type: 'triangle', gain: 0.1 }, { freq: 0 },
    { freq: NOTES.C4, type: 'triangle', gain: 0.09 }, { freq: 0 },
    { freq: NOTES.G3, type: 'triangle', gain: 0.09 }, { freq: 0 },
    { freq: NOTES.E3, type: 'triangle', gain: 0.1 }, { freq: 0 },
    { freq: NOTES.E3, type: 'triangle', gain: 0.1 }, { freq: 0 },
    { freq: NOTES.C4, type: 'triangle', gain: 0.09 }, { freq: 0 },
    { freq: NOTES.G3, type: 'triangle', gain: 0.09 }, { freq: 0 },
  ];
  return runSequencer(audio, { bpm: 128, stepsPerBeat: 2, layers: [melody, bass] });
}

function setMusicMode(mode) {
  if (musicMode === mode && musicHandle) return;
  if (musicHandle) {
    musicHandle.stop();
    musicHandle = null;
  }
  musicMode = mode;
  if (mode === 'none') return;
  pendingMode = mode;
  const audio = resumeAudio();
  if (!audio || audio.state !== 'running') return;
  musicHandle = mode === 'battle' ? runBattleSequencer(audio) : runAmbientSequencer(audio);
}

export function ensureMusicPlaying() {
  const audio = resumeAudio();
  if (!audio) return;
  const mode = musicMode && musicMode !== 'none' ? musicMode : pendingMode;
  if (!mode || mode === 'none') return;
  if (audio.state !== 'running') {
    pendingMode = mode;
    return;
  }
  if (musicMode !== mode) setMusicMode(mode);
  else {
    const saved = musicMode;
    setMusicMode('none');
    setMusicMode(saved);
  }
}

export function initAudio() {
  getCtx();
  attachAudioUnlock();
  pendingMode = 'ambient';
  startAmbientMusic();
}

export function unlockAudio() {
  const audio = resumeAudio();
  if (!audio) return Promise.resolve(false);
  return audio.resume().then(() => {
    ensureMusicPlaying();
    return audio.state === 'running';
  }).catch(() => false);
}

export function startAmbientMusic() {
  pendingMode = 'ambient';
  setMusicMode('ambient');
}

export function startBattleMusic() {
  pendingMode = 'battle';
  setMusicMode('battle');
}

export function stopBattleMusic() {
  if (musicMode === 'battle') setMusicMode('ambient');
}

export function stopAllMusic() {
  setMusicMode('none');
}

export function playHelpCry() {
  const audio = resumeAudio();
  if (!audio) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(680, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(420, audio.currentTime + 0.35);
  gain.gain.setValueAtTime(0.12, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.45);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.45);
}

export function playLaserFire() {
  const audio = resumeAudio();
  if (!audio) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(880, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(220, audio.currentTime + 0.08);
  gain.gain.setValueAtTime(0.06, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.1);
}
