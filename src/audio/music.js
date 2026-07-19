const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00,
  B4: 493.88, C5: 523.25, E5: 659.25, R: 0,
};

function parsePattern(str, type = 'triangle', gain = 0.1, lpf = 2400) {
  return str.split(/\s+/).map((n) => {
    if (n === 'R' || n === '~') return { freq: 0 };
    return { freq: NOTES[n] || 0, type, gain, lpf };
  });
}

function sequencer(ctx, dest, layers, bpm, stepsPerBeat = 2) {
  const stepDuration = 60 / bpm / stepsPerBeat;
  let nextStepTime = ctx.currentTime + 0.05;
  let stepIndex = 0;
  let stopped = false;
  let timerId = null;

  const schedule = () => {
    if (stopped) return;
    while (nextStepTime < ctx.currentTime + 0.12) {
      for (const layer of layers) {
        const note = layer[stepIndex % layer.length];
        if (note?.freq > 0 && Math.random() > 0.08) {
          const osc = ctx.createOscillator();
          osc.type = note.type || 'triangle';
          osc.frequency.setValueAtTime(note.freq, nextStepTime);
          const g = ctx.createGain();
          g.gain.setValueAtTime(note.gain ?? 0.08, nextStepTime);
          g.gain.exponentialRampToValueAtTime(0.001, nextStepTime + stepDuration * 0.85);
          const f = ctx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.setValueAtTime(note.lpf || 2400, nextStepTime);
          osc.connect(f).connect(g).connect(dest);
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
  return { stop() { stopped = true; clearTimeout(timerId); } };
}

export function palaceBGM(ctx, dest) {
  return sequencer(ctx, dest, [
    parsePattern('E4 R G4 A4 G4 R E4 D4 C4 R D4 E4 G4 A4 G4 R', 'sine', 0.07, 2000),
    parsePattern('C3 R R R G3 R R R A3 R R R E3 R R R', 'triangle', 0.08, 900),
  ], 72, 2);
}

export function swampBGM(ctx, dest) {
  return sequencer(ctx, dest, [
    parsePattern('E4 R R G4 R E4 R D4 R R C4 R D4 R E4 R', 'sine', 0.06, 1800),
    parsePattern('C3 R E3 R G3 R E3 R C3 R E3 R G3 R E3 R', 'triangle', 0.07, 800),
  ], 68, 2);
}

export function castleBGM(ctx, dest) {
  return sequencer(ctx, dest, [
    parsePattern('A4 R E4 R G4 R E4 A4 R D4 R E4 R R R', 'triangle', 0.07, 1900),
    parsePattern('A3 R R A3 R R E3 R R E3 R R A3 R R R', 'triangle', 0.09, 700),
  ], 80, 2);
}

export function battleBGM(ctx, dest) {
  return sequencer(ctx, dest, [
    parsePattern('E4 G4 A4 G4 E4 D4 E4 C4 D4 E4 G4 A4 G4 R E4 R', 'square', 0.08, 2600),
    parsePattern('E3 R E3 R C4 R G3 R E3 R E3 R C4 R G3 R', 'triangle', 0.1, 900),
  ], 128, 2);
}

export function chaseBGM(ctx, dest) {
  return sequencer(ctx, dest, [
    parsePattern('A4 A4 R G4 A4 R E5 R D5 C5 R A4 R G4 R', 'square', 0.08, 2800),
    parsePattern('A3 R A3 R E3 R E3 R F3 R F3 R E3 R E3 R', 'triangle', 0.1, 800),
  ], 140, 2);
}

export function endingBGM(ctx, dest) {
  return sequencer(ctx, dest, [
    parsePattern('E4 R D4 R C4 R A3 R G3 R E3 R R R R R', 'sine', 0.08, 1600),
    parsePattern('A3 A3 A3 A3 G3 G3 G3 G3 E3 E3 E3 E3 R R R R', 'triangle', 0.06, 1000),
  ], 56, 2);
}

export const BGM_MAP = {
  palace: palaceBGM,
  swamp: swampBGM,
  castle: castleBGM,
  battle: battleBGM,
  chase: chaseBGM,
  ending: endingBGM,
};
