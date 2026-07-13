let ctx = null;
let battleBgm = null;

const BATTLE_NOTES = {
  E3: 164.81, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
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
  if (audio?.state === 'suspended') audio.resume();
  return audio;
}

function runBattleSequencer(audio) {
  const bpm = 128;
  const stepDuration = 60 / bpm / 2;
  const melody = [
    { freq: BATTLE_NOTES.E4 }, { freq: 0 }, { freq: BATTLE_NOTES.G4 }, { freq: BATTLE_NOTES.A4 },
    { freq: BATTLE_NOTES.G4 }, { freq: 0 }, { freq: BATTLE_NOTES.E4 }, { freq: BATTLE_NOTES.D4 },
    { freq: BATTLE_NOTES.C4 }, { freq: 0 }, { freq: BATTLE_NOTES.D4 }, { freq: BATTLE_NOTES.E4 },
    { freq: BATTLE_NOTES.G4 }, { freq: BATTLE_NOTES.A4 }, { freq: BATTLE_NOTES.G4 }, { freq: 0 },
  ];
  const bass = [
    { freq: BATTLE_NOTES.E3, type: 'triangle', gain: 0.1 }, { freq: 0 },
    { freq: BATTLE_NOTES.E3, type: 'triangle', gain: 0.1 }, { freq: 0 },
    { freq: BATTLE_NOTES.C4, type: 'triangle', gain: 0.09 }, { freq: 0 },
    { freq: BATTLE_NOTES.G3, type: 'triangle', gain: 0.09 }, { freq: 0 },
    { freq: BATTLE_NOTES.E3, type: 'triangle', gain: 0.1 }, { freq: 0 },
    { freq: BATTLE_NOTES.E3, type: 'triangle', gain: 0.1 }, { freq: 0 },
    { freq: BATTLE_NOTES.C4, type: 'triangle', gain: 0.09 }, { freq: 0 },
    { freq: BATTLE_NOTES.G3, type: 'triangle', gain: 0.09 }, { freq: 0 },
  ];
  const layers = [melody, bass];
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
          osc.type = note.type || 'square';
          osc.frequency.setValueAtTime(note.freq, nextStepTime);
          const gain = audio.createGain();
          const noteGain = note.gain ?? 0.07;
          gain.gain.setValueAtTime(noteGain, nextStepTime);
          gain.gain.exponentialRampToValueAtTime(0.001, nextStepTime + stepDuration * 0.85);
          const filter = audio.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2800, nextStepTime);
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

export function startBattleMusic() {
  stopBattleMusic();
  const audio = resumeAudio();
  if (!audio) return;
  battleBgm = runBattleSequencer(audio);
}

export function stopBattleMusic() {
  if (battleBgm) {
    battleBgm.stop();
    battleBgm = null;
  }
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
