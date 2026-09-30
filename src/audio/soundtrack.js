// The soundtrack: hypnotic, psychedelic downtempo electronica, generated live in Web Audio.
// No samples, no licences. 96 bpm around a D drone (Dorian colour).
//
// The hook is a filter-swept synth arpeggio whose seven-note figure runs against the 16-step bar,
// so it realigns only every seven bars and never quite repeats. Around it: a wide detuned pad,
// a ducking sub bass, soft four-on-the-floor, shaker and open hats, stereo ping-pong echo, a
// phaser swirl, filtered sweeps every eight bars and the occasional water-drop blip.
//
// Moods follow the game: 'calm' (menus, ferry, Boat School — pad, arp, shaker), 'drive' (on the
// water — everything), 'night' (everything, deeper and wetter), 'under' (capsized — the whole mix
// heard from underwater).

const BPM = 96;
const STEP = 60 / BPM / 4;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Eight-bar cycle over a D drone: Dm9 ×4, Bbmaj7#11 ×2, C6/9 ×2.
const CHORDS = [
  { bars: 4, root: 38, tones: [62, 65, 69, 72, 76] },
  { bars: 2, root: 34, tones: [58, 62, 65, 69, 76] },
  { bars: 2, root: 36, tones: [60, 64, 67, 69, 74] },
];
const chordAt = (bar) => {
  let b = bar % 8;
  for (const c of CHORDS) { if (b < c.bars) return c; b -= c.bars; }
  return CHORDS[0];
};

const MOODS = {
  calm: { pad: 1, arp: 0.8, kick: 0, bass: 0, hats: 0, shaker: 0.7, sweep: 0.6, cutoff: 1400, wet: 0.5, level: 0.8 },
  drive: { pad: 0.9, arp: 1, kick: 1, bass: 1, hats: 1, shaker: 1, sweep: 1, cutoff: 2600, wet: 0.45, level: 1 },
  night: { pad: 1.1, arp: 0.9, kick: 0.8, bass: 1, hats: 0.6, shaker: 0.8, sweep: 1, cutoff: 1800, wet: 0.7, level: 1 },
  under: { pad: 1, arp: 0.5, kick: 0.6, bass: 1, hats: 0, shaker: 0, sweep: 0.4, cutoff: 900, wet: 0.8, level: 0.9 },
};

export function createSoundtrack(ctx, out) {
  const now = () => ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0;
  // A master low-pass: opens and closes with the mood (and drops right down underwater).
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 18000;
  master.connect(tone).connect(out);

  // Reverb.
  const verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 3.8);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
  }
  verb.buffer = ir;
  const verbIn = ctx.createGain();
  verbIn.gain.value = 0.5;
  verbIn.connect(verb).connect(master);

  // Stereo ping-pong echo: left repeats on the dotted eighth, right on the quarter.
  const pan = (p) => { const s = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(); if (s.pan) s.pan.value = p; return s; };
  const echoIn = ctx.createGain();
  const mkDelay = (time, p) => {
    const d = ctx.createDelay(2), fb = ctx.createGain(), lp = ctx.createBiquadFilter(), pn = pan(p);
    d.delayTime.value = time; fb.gain.value = 0.46; lp.type = 'lowpass'; lp.frequency.value = 2600;
    echoIn.connect(d); d.connect(lp).connect(fb).connect(d);
    lp.connect(pn).connect(master); pn.connect(verbIn);
  };
  mkDelay(STEP * 3, -0.75);
  mkDelay(STEP * 4, 0.75);

  // Phaser: four all-pass stages swept by a slow LFO — the psychedelic swirl on the arp.
  const phIn = ctx.createGain(), phOut = ctx.createGain();
  let node = phIn;
  const phLfo = ctx.createOscillator(), phDepth = ctx.createGain();
  phLfo.frequency.value = 0.09; phDepth.gain.value = 900;
  phLfo.connect(phDepth);
  for (let i = 0; i < 4; i++) {
    const ap = ctx.createBiquadFilter();
    ap.type = 'allpass'; ap.frequency.value = 700 + i * 350; ap.Q.value = 0.7;
    phDepth.connect(ap.frequency);
    node.connect(ap); node = ap;
  }
  const phMix = ctx.createGain(); phMix.gain.value = 0.8;
  node.connect(phMix).connect(phOut);
  phIn.connect(phOut); // dry + phased = notches that move
  phLfo.start();

  // Arp voice chain: resonant low-pass whose cutoff breathes on a very slow LFO.
  const arpFilter = ctx.createBiquadFilter();
  arpFilter.type = 'lowpass'; arpFilter.Q.value = 9; arpFilter.frequency.value = 1400;
  const arpLfo = ctx.createOscillator(), arpDepth = ctx.createGain();
  arpLfo.frequency.value = 0.035; arpDepth.gain.value = 1100;
  arpLfo.connect(arpDepth).connect(arpFilter.frequency);
  arpLfo.start();
  const arpBus = ctx.createGain();
  arpBus.gain.value = 0.9;
  arpFilter.connect(phIn);
  phOut.connect(arpBus);
  arpBus.connect(master);
  const arpSend = ctx.createGain(); arpSend.gain.value = 0.55; arpBus.connect(arpSend).connect(echoIn);
  const arpVerb = ctx.createGain(); arpVerb.gain.value = 0.3; arpBus.connect(arpVerb).connect(verbIn);

  const bus = (dry, wet) => { const g = ctx.createGain(); g.gain.value = dry; g.connect(master); const w = ctx.createGain(); w.gain.value = wet; g.connect(w).connect(verbIn); return g; };
  const padBus = bus(0.45, 0.8);
  const bassBus = bus(0.8, 0.02);
  const drumBus = bus(0.55, 0.18);
  const fxBus = bus(0.35, 1.0);

  const noise = (() => {
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();

  const env = (g, t, a, peak, hold, rel) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  };

  let mood = MOODS.calm;

  function pad(tones, t, dur) {
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.Q.value = 0.6;
    f.frequency.setValueAtTime(420, t);
    f.frequency.linearRampToValueAtTime(mood.cutoff * 0.7, t + dur * 0.5);
    f.frequency.linearRampToValueAtTime(500, t + dur);
    f.connect(g).connect(padBus);
    env(g, t, 2, 0.045 * mood.pad, Math.max(0.1, dur - 2), 3);
    for (const n of tones.slice(0, 4)) {
      for (const [det, p] of [[-11, -0.6], [-4, -0.2], [4, 0.2], [11, 0.6]]) {
        const o = ctx.createOscillator(), pn = pan(p);
        o.type = 'sawtooth'; o.frequency.value = midi(n - 12); o.detune.value = det;
        o.connect(pn).connect(f);
        o.start(t); o.stop(t + dur + 3.2);
      }
    }
  }

  function arp(n, t, vel) {
    const g = ctx.createGain();
    for (const [type, det] of [['sawtooth', -5], ['square', 5]]) {
      const o = ctx.createOscillator();
      o.type = type; o.frequency.value = midi(n); o.detune.value = det;
      o.connect(g);
      o.start(t); o.stop(t + STEP * 2.2);
    }
    g.connect(arpFilter);
    env(g, t, 0.004, 0.05 * vel * mood.arp, STEP * 0.4, STEP * 1.4);
  }

  function bass(n, t) {
    // Pulsing eighths that duck under the kick (the "breathing" of the groove).
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = midi(n);
    o2.type = 'sawtooth'; o2.frequency.value = midi(n); o2.detune.value = 7;
    f.type = 'lowpass'; f.frequency.value = 260; f.Q.value = 2;
    o.connect(g); o2.connect(f).connect(g);
    g.connect(bassBus);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.2 * mood.bass, t + STEP * 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + STEP * 1.9);
    o.start(t); o2.start(t); o.stop(t + STEP * 2); o2.stop(t + STEP * 2);
  }

  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.14);
    o.connect(g).connect(drumBus);
    env(g, t, 0.002, 0.55 * mood.kick, 0.03, 0.3);
    o.start(t); o.stop(t + 0.45);
  }

  function hiss(t, { freq, type = 'highpass', q = 0.7, peak, rel, p = 0 }) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), pn = pan(p);
    s.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    s.connect(f).connect(g).connect(pn).connect(drumBus);
    env(g, t, 0.002, peak, 0.005, rel);
    s.start(t, Math.random() * 1.5); s.stop(t + rel + 0.05);
  }

  function sweep(t, bars = 2) {
    // A filtered noise riser into the next section.
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    const dur = STEP * 16 * bars;
    s.buffer = noise; s.loop = true;
    f.type = 'bandpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(6000, t + dur);
    s.connect(f).connect(g).connect(fxBus);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06 * mood.sweep, t + dur * 0.9);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    s.start(t); s.stop(t + dur + 0.1);
  }

  function drop(t) {
    // A water-drop blip: a sine that falls in pitch, drenched in echo.
    const o = ctx.createOscillator(), g = ctx.createGain(), p = pan(Math.random() * 1.4 - 0.7);
    o.frequency.setValueAtTime(1800 + Math.random() * 900, t);
    o.frequency.exponentialRampToValueAtTime(420, t + 0.12);
    o.connect(g).connect(p).connect(fxBus);
    p.connect(echoIn);
    env(g, t, 0.002, 0.05, 0.01, 0.12);
    o.start(t); o.stop(t + 0.2);
  }

  // The hypnotic figure: seven steps through the chord's tones across two octaves.
  const FIGURE = [0, 2, 4, 1, 3, 5, 2];
  let step = 0, next = 0, timer = null, playing = false;

  function schedule(t) {
    const bar = Math.floor(step / 16), s = step % 16;
    const c = chordAt(bar);
    const swing = s % 2 ? STEP * 0.08 : 0;
    if (s === 0 && bar % 8 === 0) pad(CHORDS[0].tones, t, STEP * 16 * 4);
    if (s === 0 && bar % 8 === 4) pad(CHORDS[1].tones, t, STEP * 16 * 2);
    if (s === 0 && bar % 8 === 6) pad(CHORDS[2].tones, t, STEP * 16 * 2);
    // Arp: 16ths, the 7-step figure against the 16-step bar.
    const tones = [...c.tones, ...c.tones.map((n) => n + 12)];
    const k = FIGURE[step % FIGURE.length] + (Math.floor(step / 7) % 3 === 2 ? 3 : 0);
    const accent = s % 4 === 0 ? 1 : s % 2 === 0 ? 0.75 : 0.55;
    if (!(bar % 16 >= 14 && s % 2)) arp(tones[k % tones.length], t + swing, accent);
    // Groove.
    if (mood.kick && s % 4 === 0 && bar % 16 < 14) kick(t);
    if (mood.bass && s % 2 === 0 && s % 4 !== 0) bass(s % 8 === 6 ? c.root + 12 : c.root, t);
    if (mood.hats && s % 4 === 2) hiss(t, { freq: 7500, peak: 0.045 * mood.hats, rel: 0.18, p: 0.2 });
    if (mood.shaker) hiss(t + swing, { freq: 9000, type: 'bandpass', q: 1.5, peak: (s % 2 ? 0.012 : 0.02) * mood.shaker, rel: 0.05, p: -0.3 });
    if (mood.kick && (s === 4 || s === 12) && bar % 2 === 1) hiss(t, { freq: 1500, type: 'bandpass', q: 1, peak: 0.07 * mood.kick, rel: 0.25 });
    // Transitions and colour.
    if (s === 0 && bar % 8 === 6) sweep(t, 2);
    if (s === 11 && (bar * 7) % 5 === 1) drop(t);
  }

  function tick() {
    while (next < now() + 0.2) { schedule(next); next += STEP; step++; }
  }

  return {
    start() {
      if (!playing) { playing = true; step = 0; next = now() + 0.1; timer = setInterval(tick, 50); }
      master.gain.cancelScheduledValues(now());
      master.gain.setTargetAtTime(mood.level, now(), 2.5);
    },
    stop() {
      if (!playing) return;
      master.gain.cancelScheduledValues(now());
      master.gain.setTargetAtTime(0, now(), 1.2);
      setTimeout(() => { if (master.gain.value < 0.02 && timer) { clearInterval(timer); timer = null; playing = false; } }, 6000);
    },
    mood(name) {
      const m = MOODS[name] ?? MOODS.calm;
      mood = m;
      tone.frequency.setTargetAtTime(name === 'under' ? 520 : 18000, now(), name === 'under' ? 0.3 : 1.5);
      verbIn.gain.setTargetAtTime(m.wet, now(), 1);
      if (playing) master.gain.setTargetAtTime(m.level, now(), 1.5);
    },
    get playing() { return playing; },
  };
}
