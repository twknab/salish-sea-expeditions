// The soundscape (Principle V, FR-027): synthesised in code so every voice can react to the sim
// and nothing needs a licence. Three buses — sea, wildlife, music — plus quiet UI ticks. Licensed
// field recordings can later replace any voice behind the same functions.

let ctx = null;
let bus = null;
let amb = null;
const vol = { sea: 0.9, wildlife: 0.9, music: 0.4 };

function noiseBuffer(kind = 'white', seconds = 4) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0, b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    else if (kind === 'pink') { b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; d[i] = (b0 + b1 + b2 + w * 0.05) * 0.9; }
    else d[i] = w;
  }
  return buf;
}

function loopNoise(buf) {
  const s = ctx.createBufferSource();
  s.buffer = buf; s.loop = true; s.start(0, Math.random() * buf.duration);
  return s;
}

function filter(type, freq, q = 0.7) {
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  return f;
}

function gain(v = 0) {
  const g = ctx.createGain();
  g.gain.value = v;
  return g;
}

function panner(p = 0) {
  if (ctx.createStereoPanner) { const s = ctx.createStereoPanner(); s.pan.value = Math.max(-1, Math.min(1, p)); return s; }
  return gain(1);
}

function build() {
  const master = gain(0.9);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 3;
  master.connect(comp).connect(ctx.destination);
  bus = { master, sea: gain(vol.sea), wildlife: gain(vol.wildlife), music: gain(vol.music * 0.6), ui: gain(0.35) };
  for (const k of ['sea', 'wildlife', 'music', 'ui']) bus[k].connect(master);

  const brown = noiseBuffer('brown', 6), pink = noiseBuffer('pink', 5), white = noiseBuffer('white', 3);
  amb = { white, pink, brown };

  // Swell: low wash that breathes with the waves.
  const swellSrc = loopNoise(brown);
  const swellLp = filter('lowpass', 380);
  const swellG = gain(0);
  swellSrc.connect(swellLp).connect(swellG).connect(bus.sea);
  // Lap: water on the hull and shore, brighter.
  const lapSrc = loopNoise(pink);
  const lapBp = filter('bandpass', 1400, 0.6);
  const lapG = gain(0);
  lapSrc.connect(lapBp).connect(lapG).connect(bus.sea);
  // Wind.
  const windSrc = loopNoise(pink);
  const windBp = filter('bandpass', 700, 0.9);
  const windG = gain(0);
  windSrc.connect(windBp).connect(windG).connect(bus.sea);
  // Rip: confused, chattering water.
  const ripSrc = loopNoise(white);
  const ripBp = filter('bandpass', 1100, 1.4);
  const ripG = gain(0);
  ripSrc.connect(ripBp).connect(ripG).connect(bus.sea);
  // Surf on a beach.
  const surfSrc = loopNoise(pink);
  const surfLp = filter('lowpass', 900);
  const surfG = gain(0);
  surfSrc.connect(surfLp).connect(surfG).connect(bus.sea);

  amb.nodes = { swellG, swellLp, lapG, lapBp, windG, windBp, ripG, surfG };
  amb.target = { sea: 0.2, wind: 0.1, rip: 0, surf: 0, calm: 1 };
  amb.t0 = ctx.currentTime;
  scheduleMusic();
}

function env(g, t, a, peak, d) {
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function burst(dest, { freq = 1200, q = 1, type = 'bandpass', a = 0.01, peak = 0.3, d = 0.3, sweepTo, pan = 0, buf }) {
  const t = ctx.currentTime;
  const s = ctx.createBufferSource();
  s.buffer = buf ?? amb.white;
  const f = filter(type, freq, q);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + a + d);
  const g = gain(0);
  const p = panner(pan);
  s.connect(f).connect(g).connect(p).connect(dest);
  env(g, t, a, peak, d);
  s.start(t, Math.random() * 1.5);
  s.stop(t + a + d + 0.05);
}

function tone(dest, { f0, f1, type = 'sine', a = 0.01, peak = 0.2, d = 0.3, when = 0, pan = 0, vibrato = 0 }) {
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + a + d);
  if (vibrato) {
    const l = ctx.createOscillator(); const lg = gain(vibrato);
    l.frequency.value = 22; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + a + d + 0.05);
  }
  const g = gain(0);
  const p = panner(pan);
  o.connect(g).connect(p).connect(dest);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  o.start(t); o.stop(t + a + d + 0.05);
}

// Sparse music: a slow pentatonic pad now and then, never over the sea.
function scheduleMusic() {
  const notes = [196, 220, 246.9, 293.7, 329.6, 392, 440];
  const play = () => {
    if (!ctx) return;
    const base = notes[Math.floor(Math.random() * 3)];
    const chord = [base, base * 1.5, base * 2 * (Math.random() < 0.5 ? 1.125 : 1.25)];
    chord.forEach((f, i) => tone(bus.music, { f0: f, type: 'triangle', a: 2.5, peak: 0.05, d: 6, when: i * 0.9, pan: (i - 1) * 0.4 }));
    setTimeout(play, 22000 + Math.random() * 26000);
  };
  setTimeout(play, 6000);
}

export const sound = {
  get ready() { return !!ctx && ctx.state === 'running'; },

  /** Call from a user gesture (iOS will not start audio otherwise). */
  unlock() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        build();
      }
      if (ctx.state !== 'running') ctx.resume();
    } catch { /* audio is optional */ }
  },

  setVolumes(v) {
    Object.assign(vol, v);
    if (!bus) return;
    bus.sea.gain.value = vol.sea;
    bus.wildlife.gain.value = vol.wildlife;
    bus.music.gain.value = vol.music * 0.6;
  },

  /**
   * Ambience targets, 0..1 each: sea (wave energy), wind, rip, surf; smoothed per frame.
   */
  ambience(target) {
    if (!amb) return;
    Object.assign(amb.target, target);
  },

  /** Advance ambience smoothing and the swell's breathing. Call once per frame. */
  update(dt) {
    if (!amb || !ctx) return;
    const n = amb.nodes, tg = amb.target, t = ctx.currentTime - amb.t0;
    const k = Math.min(1, dt * 1.5);
    const breathe = 0.55 + 0.45 * Math.sin(t * 0.72) * Math.sin(t * 0.31 + 1);
    const lap = 0.5 + 0.5 * Math.sin(t * 1.9 + Math.sin(t * 0.7) * 2);
    const set = (param, v) => { param.value += (v - param.value) * k; };
    set(n.swellG.gain, (0.1 + 0.35 * tg.sea) * breathe);
    set(n.swellLp.frequency, 280 + 500 * tg.sea);
    set(n.lapG.gain, (0.02 + 0.1 * tg.sea) * lap * (tg.calm ?? 1));
    set(n.windG.gain, 0.12 * tg.wind * (0.7 + 0.3 * Math.sin(t * 0.23) * Math.sin(t * 1.3)));
    set(n.windBp.frequency, 500 + 700 * tg.wind);
    set(n.ripG.gain, 0.16 * tg.rip * (0.6 + 0.4 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 3.1))));
    set(n.surfG.gain, 0.22 * tg.surf * Math.pow(Math.max(0, Math.sin(t * 0.85)), 3));
  },

  /** A paddle stroke: the catch, then drips. `q` = rotation quality, `pan` −1..1. */
  stroke(q = 0.8, pan = 0) {
    if (!ctx) return;
    burst(bus.sea, { freq: 1800, sweepTo: 420, q: 0.8, a: 0.02, peak: 0.16 + 0.1 * q, d: 0.32, pan });
    burst(bus.sea, { freq: 160, type: 'lowpass', a: 0.01, peak: 0.12, d: 0.12, pan });
    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
      const f = 1400 + Math.random() * 1800;
      tone(bus.sea, { f0: f, f1: f * 1.6, a: 0.003, peak: 0.018 + Math.random() * 0.02, d: 0.07, when: 0.35 + Math.random() * 0.5, pan: pan * 0.7 });
    }
  },

  splash(size = 1, pan = 0) {
    if (!ctx) return;
    burst(bus.sea, { freq: 900, sweepTo: 200, q: 0.5, a: 0.02, peak: 0.35 * size, d: 0.9 * size, pan });
  },

  hullSlap(pan = 0) {
    if (!ctx) return;
    burst(bus.sea, { freq: 220, type: 'lowpass', a: 0.005, peak: 0.25, d: 0.18, pan });
  },

  /** The blow of an orca: a sharp exhale. `near` 0..1. */
  orcaBlow(pan = 0, near = 0.5) {
    if (!ctx) return;
    burst(bus.wildlife, { freq: 700, sweepTo: 320, q: 0.9, a: 0.08, peak: 0.12 + 0.3 * near, d: 1.1, pan, buf: amb.pink });
    tone(bus.wildlife, { f0: 95, f1: 70, a: 0.1, peak: 0.05 * near, d: 0.8, pan });
  },

  gull(pan = 0) {
    if (!ctx) return;
    for (let i = 0; i < 3; i++) tone(bus.wildlife, { f0: 1900, f1: 1150, type: 'sawtooth', a: 0.03, peak: 0.02, d: 0.28, when: i * 0.42, pan, vibrato: 30 });
  },

  eagle(pan = 0) {
    if (!ctx) return;
    // A bald eagle's call is a thin, high, stuttering whistle.
    const seq = [0, 0.16, 0.26, 0.34, 0.41, 0.47];
    seq.forEach((w, i) => tone(bus.wildlife, { f0: 2900 - i * 60, f1: 3300 - i * 80, a: 0.01, peak: 0.03, d: 0.07, when: w, pan }));
  },

  seaLion(pan = 0) {
    if (!ctx) return;
    for (let i = 0; i < 3; i++) tone(bus.wildlife, { f0: 190, f1: 150, type: 'sawtooth', a: 0.02, peak: 0.05, d: 0.22, when: i * 0.4, pan });
  },

  horn() {
    if (!ctx) return;
    tone(bus.wildlife, { f0: 110, type: 'sawtooth', a: 0.4, peak: 0.07, d: 2.4 });
    tone(bus.wildlife, { f0: 138.6, type: 'sawtooth', a: 0.4, peak: 0.05, d: 2.4 });
  },

  success() {
    if (!ctx) return;
    [523.3, 659.3, 784].forEach((f, i) => tone(bus.ui, { f0: f, type: 'sine', a: 0.01, peak: 0.08, d: 0.5, when: i * 0.09 }));
  },

  warn() {
    if (!ctx) return;
    tone(bus.ui, { f0: 440, f1: 330, type: 'triangle', a: 0.01, peak: 0.1, d: 0.35 });
  },

  ui(kind = 'tap') {
    if (!ctx) return;
    if (kind === 'tap') tone(bus.ui, { f0: 1320, f1: 990, a: 0.002, peak: 0.05, d: 0.06 });
  },
};
