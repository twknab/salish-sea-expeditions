// Night music: light ambient downtempo, generated live in Web Audio (no samples, no licences).
// 84 bpm, D minor. A four-bar progression — Dm9, Bbmaj7, Fmaj7, C(add9) — with warm pads, a
// soft sub bass, a hushed kick and brushed hats, and a melodic electric-piano line through echo
// and reverb. The arrangement breathes: pads first, then keys, then the beat, then a breakdown.

const BPM = 84;
const STEP = 60 / BPM / 4; // sixteenth note, seconds

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
// Chord tones as MIDI notes (bass root, then voicing).
const PROGRESSION = [
  { root: 38, voicing: [62, 65, 69, 72, 76] }, // Dm9
  { root: 34, voicing: [58, 62, 65, 69] },     // Bbmaj7
  { root: 41, voicing: [60, 65, 69, 76] },     // Fmaj7
  { root: 36, voicing: [60, 64, 67, 74] },     // Cadd9
];
const SCALE = [62, 64, 65, 67, 69, 72, 74, 76, 77, 79]; // D minor, middle register

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function createNightMusic(ctx, out) {
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(out);

  // Reverb from a generated, softly decaying impulse.
  const verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 3.2);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  verb.buffer = ir;
  const verbGain = ctx.createGain();
  verbGain.gain.value = 0.55;
  verb.connect(verbGain).connect(master);

  // Dotted-eighth echo, darkened each repeat.
  const delay = ctx.createDelay(2);
  delay.delayTime.value = STEP * 3;
  const fb = ctx.createGain();
  fb.gain.value = 0.38;
  const dlp = ctx.createBiquadFilter();
  dlp.type = 'lowpass'; dlp.frequency.value = 2200;
  delay.connect(dlp).connect(fb).connect(delay);
  const delayOut = ctx.createGain();
  delayOut.gain.value = 0.5;
  dlp.connect(delayOut).connect(master);
  delayOut.connect(verb);

  const bus = (dry, wet, echo = 0) => {
    const g = ctx.createGain();
    g.gain.value = dry;
    g.connect(master);
    const w = ctx.createGain(); w.gain.value = wet; g.connect(w).connect(verb);
    if (echo) { const e = ctx.createGain(); e.gain.value = echo; g.connect(e).connect(delay); }
    return g;
  };
  const padBus = bus(0.5, 0.7);
  const keysBus = bus(0.55, 0.45, 0.45);
  const bassBus = bus(0.7, 0.05);
  const drumBus = bus(0.55, 0.2);

  const noise = (() => {
    const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();

  function env(g, t, a, peak, hold, rel) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  }

  function pad(notes, t, dur) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = 0.4;
    f.frequency.setValueAtTime(500, t);
    f.frequency.linearRampToValueAtTime(1300, t + dur * 0.5);
    f.frequency.linearRampToValueAtTime(600, t + dur);
    const g = ctx.createGain();
    f.connect(g).connect(padBus);
    env(g, t, 1.6, 0.06, dur - 1.6, 2.5);
    for (const n of notes) {
      for (const det of [-7, 6]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = midi(n);
        o.detune.value = det;
        o.connect(f);
        o.start(t); o.stop(t + dur + 2.6);
      }
    }
  }

  // Electric piano: a sine carrier with a bell-like FM partial that fades quickly.
  function keys(n, t, vel = 1) {
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    car.frequency.value = midi(n);
    mod.frequency.value = midi(n) * 14;
    mg.gain.setValueAtTime(midi(n) * 1.1, t);
    mg.gain.exponentialRampToValueAtTime(1, t + 0.35);
    mod.connect(mg).connect(car.frequency);
    car.connect(g).connect(keysBus);
    env(g, t, 0.005, 0.11 * vel, 0.05, 1.4);
    car.start(t); mod.start(t); car.stop(t + 1.6); mod.stop(t + 1.6);
  }

  function bass(n, t, dur) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = midi(n);
    o2.type = 'triangle'; o2.frequency.value = midi(n);
    f.type = 'lowpass'; f.frequency.value = 320;
    o.connect(g); o2.connect(f).connect(g);
    g.connect(bassBus);
    env(g, t, 0.02, 0.22, dur * 0.6, dur * 0.5);
    o.start(t); o2.start(t); o.stop(t + dur * 1.2); o2.stop(t + dur * 1.2);
  }

  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    o.connect(g).connect(drumBus);
    env(g, t, 0.003, 0.5, 0.02, 0.35);
    o.start(t); o.stop(t + 0.5);
  }

  function hat(t, vel) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise;
    f.type = 'highpass'; f.frequency.value = 7000;
    s.connect(f).connect(g).connect(drumBus);
    env(g, t, 0.002, 0.05 * vel, 0.005, 0.06);
    s.start(t, Math.random() * 0.5); s.stop(t + 0.1);
  }

  function rim(t) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise;
    f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 1.2;
    s.connect(f).connect(g).connect(drumBus);
    env(g, t, 0.002, 0.12, 0.01, 0.18);
    s.start(t, Math.random() * 0.5); s.stop(t + 0.3);
  }

  let step = 0, next = 0, timer = null, playing = false;
  const rand = rng(7);
  let phrase = [];

  function newPhrase() {
    // A gentle melody: mostly stepwise through the scale, with rests.
    phrase = [];
    let i = 4 + Math.floor(rand() * 3);
    for (let s = 0; s < 16; s++) {
      const play = [0, 3, 6, 8, 10, 13].includes(s) ? rand() < 0.8 : rand() < 0.15;
      if (play) {
        i = Math.max(0, Math.min(SCALE.length - 1, i + Math.round((rand() - 0.5) * 3)));
        phrase.push({ s, n: SCALE[i], v: 0.6 + rand() * 0.4 });
      }
    }
  }

  function schedule(t) {
    const bar = Math.floor(step / 16), s = step % 16;
    const chord = PROGRESSION[bar % 4];
    const section = bar % 32;
    const beat = section >= 8 && section < 24;
    const hats = section >= 4 && section < 28;
    const keysOn = section >= 2 && section < 30;
    const swing = s % 2 ? STEP * 0.12 : 0;
    if (s === 0) {
      pad(chord.voicing, t, STEP * 16);
      if (bar % 2 === 0) newPhrase();
    }
    if (beat) {
      if (s === 0 || s === 7 || s === 10) kick(t);
      if (s === 4 || s === 12) rim(t + swing);
      if (s === 0) bass(chord.root, t, STEP * 7);
      if (s === 10) bass(chord.root + 7, t, STEP * 5);
    }
    if (hats && s % 2 === 0) hat(t + swing, s % 4 === 2 ? 1 : 0.5);
    if (keysOn) for (const p of phrase) if (p.s === s) keys(p.n, t + swing, p.v);
  }

  function tick() {
    while (next < ctx.currentTime + 0.2) {
      schedule(next);
      next += STEP;
      step++;
    }
  }

  return {
    start(level = 1) {
      if (!playing) {
        playing = true;
        step = 0;
        next = ctx.currentTime + 0.1;
        timer = setInterval(tick, 50);
      }
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.9 * level, ctx.currentTime, 2.5); // a slow fade in
    },
    stop() {
      if (!playing) return;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 1.5);
      setTimeout(() => { if (master.gain.value < 0.02) { clearInterval(timer); playing = false; } }, 6000);
    },
    get playing() { return playing; },
  };
}
