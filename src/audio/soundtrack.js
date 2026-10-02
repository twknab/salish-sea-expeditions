// The soundtrack: melodic, driving electronica, generated live in Web Audio. No samples.
// 122 bpm in D minor. Four-on-the-floor kick, a sidechained supersaw pad and plucked arp that pump
// against it, a rolling sub bass, claps on two and four, offbeat open hats, 16-bar phrases with an
// eight-bar build (riser, snare roll, filter opening) into a drop — then a breakdown where the
// drums fall away and the pad breathes.
//
// Moods follow the game: 'calm' (menus, ferry, Kayak School — no kick, pad and arp float),
// 'drive' (on the water — everything), 'night' (deeper, wetter, half-time hats), 'under'
// (capsized — the whole mix heard from underwater).

const BPM = 122;
const STEP = 60 / BPM / 4;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Eight-bar cycle: Dm9 · Dm9 · Bbmaj7 · Bbmaj7 · Fmaj7 · Fmaj7 · C(add9) · C(add9).
const CHORDS = [
  { bars: 2, root: 38, tones: [62, 65, 69, 72, 76] },
  { bars: 2, root: 34, tones: [58, 62, 65, 69, 74] },
  { bars: 2, root: 41, tones: [60, 65, 69, 72, 76] },
  { bars: 2, root: 36, tones: [60, 64, 67, 71, 74] },
];
const chordAt = (bar) => {
  let b = bar % 8;
  for (const c of CHORDS) { if (b < c.bars) return c; b -= c.bars; }
  return CHORDS[0];
};

const MOODS = {
  calm: { pad: 1, arp: 0.7, pluck: 0.5, kick: 0, clap: 0, bass: 0.35, hats: 0.25, sweep: 0.5, cutoff: 1600, wet: 0.55, level: 0.75, duck: 0 },
  drive: { pad: 0.9, arp: 1, pluck: 1, kick: 1, clap: 1, bass: 1, hats: 1, sweep: 1, cutoff: 3200, wet: 0.4, level: 1, duck: 1 },
  night: { pad: 1.1, arp: 0.8, pluck: 0.9, kick: 0.9, clap: 0.6, bass: 1, hats: 0.5, sweep: 1, cutoff: 2000, wet: 0.65, level: 1, duck: 1 },
  under: { pad: 1, arp: 0.4, pluck: 0.3, kick: 0.7, clap: 0, bass: 1, hats: 0, sweep: 0.3, cutoff: 800, wet: 0.85, level: 0.9, duck: 0.6 },
};

export function createSoundtrack(ctx, out) {
  const now = () => ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 18000;
  master.connect(tone).connect(out);

  // Reverb.
  const verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 3.2);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
  }
  verb.buffer = ir;
  const verbIn = ctx.createGain();
  verbIn.gain.value = 0.4;
  verbIn.connect(verb).connect(master);

  // Ping-pong echo on the dotted eighth.
  const pan = (p) => { const s = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(); if (s.pan) s.pan.value = p; return s; };
  const echoIn = ctx.createGain();
  const mkDelay = (time, p) => {
    const d = ctx.createDelay(2), fb = ctx.createGain(), lp = ctx.createBiquadFilter(), pn = pan(p);
    d.delayTime.value = time; fb.gain.value = 0.42; lp.type = 'lowpass'; lp.frequency.value = 3200;
    echoIn.connect(d); d.connect(lp).connect(fb).connect(d);
    lp.connect(pn).connect(master); pn.connect(verbIn);
  };
  mkDelay(STEP * 3, -0.7);
  mkDelay(STEP * 6, 0.7);

  // The sidechain: pad, arp and pluck all pass through this gain, which the kick ducks.
  const duck = ctx.createGain();
  duck.gain.value = 1;
  duck.connect(master);
  const duckSend = ctx.createGain(); duckSend.gain.value = 0.3; duck.connect(duckSend).connect(verbIn);

  // Arp chain: resonant low-pass that opens through each build.
  const arpFilter = ctx.createBiquadFilter();
  arpFilter.type = 'lowpass'; arpFilter.Q.value = 7; arpFilter.frequency.value = 1600;
  const arpBus = ctx.createGain(); arpBus.gain.value = 0.9;
  arpFilter.connect(arpBus).connect(duck);
  const arpSend = ctx.createGain(); arpSend.gain.value = 0.4; arpBus.connect(arpSend).connect(echoIn);

  const bus = (dry, wet, to = master) => { const g = ctx.createGain(); g.gain.value = dry; g.connect(to); const w = ctx.createGain(); w.gain.value = wet; g.connect(w).connect(verbIn); return g; };
  const padBus = bus(0.5, 0.7, duck);
  const pluckBus = bus(0.6, 0.35, duck);
  const bassBus = bus(0.85, 0.0);
  const drumBus = bus(0.6, 0.12);
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
    // Supersaw: seven detuned saws per note through a slow filter.
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.Q.value = 0.8;
    f.frequency.setValueAtTime(500, t);
    f.frequency.linearRampToValueAtTime(mood.cutoff, t + dur * 0.6);
    f.frequency.linearRampToValueAtTime(600, t + dur);
    f.connect(g).connect(padBus);
    env(g, t, 1.2, 0.03 * mood.pad, Math.max(0.1, dur - 1.2), 2);
    for (const n of tones.slice(0, 4)) {
      for (const [det, p] of [[-14, -0.7], [-7, -0.35], [0, 0], [7, 0.35], [14, 0.7]]) {
        const o = ctx.createOscillator(), pn = pan(p);
        o.type = 'sawtooth'; o.frequency.value = midi(n - 12); o.detune.value = det;
        o.connect(pn).connect(f);
        o.start(t); o.stop(t + dur + 2.2);
      }
    }
  }

  function arp(n, t, vel) {
    const g = ctx.createGain();
    for (const [type, det] of [['sawtooth', -6], ['sawtooth', 6]]) {
      const o = ctx.createOscillator();
      o.type = type; o.frequency.value = midi(n); o.detune.value = det;
      o.connect(g);
      o.start(t); o.stop(t + STEP * 1.6);
    }
    g.connect(arpFilter);
    env(g, t, 0.003, 0.045 * vel * mood.arp, STEP * 0.25, STEP * 0.9);
  }

  function pluck(n, t, vel = 1) {
    // A bright plucked lead: a square through a fast-closing filter, with echo.
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), pn = pan(Math.random() * 0.6 - 0.3);
    o.type = 'square'; o.frequency.value = midi(n);
    f.type = 'lowpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(4200, t);
    f.frequency.exponentialRampToValueAtTime(500, t + 0.18);
    o.connect(f).connect(g).connect(pn).connect(pluckBus);
    pn.connect(echoIn);
    env(g, t, 0.002, 0.06 * vel * mood.pluck, 0.02, 0.22);
    o.start(t); o.stop(t + 0.3);
  }

  function bass(n, t, len = STEP * 0.9) {
    // Rolling offbeat sub with a touch of saw for the speakers that have no sub.
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = midi(n);
    o2.type = 'sawtooth'; o2.frequency.value = midi(n); o2.detune.value = 5;
    f.type = 'lowpass'; f.frequency.value = 320; f.Q.value = 3;
    o.connect(g); o2.connect(f).connect(g);
    g.connect(bassBus);
    env(g, t, 0.006, 0.22 * mood.bass, len * 0.5, len * 0.6);
    o.start(t); o2.start(t); o.stop(t + len * 1.3); o2.stop(t + len * 1.3);
  }

  function kick(t, vel = 1) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    o.connect(g).connect(drumBus);
    env(g, t, 0.002, 0.7 * mood.kick * vel, 0.02, 0.26);
    o.start(t); o.stop(t + 0.4);
    // Click on the transient.
    hiss(t, { freq: 3000, type: 'bandpass', q: 1, peak: 0.08 * mood.kick * vel, rel: 0.02 });
    // The sidechain pump: everything melodic dips and swells back over the beat.
    if (mood.duck) {
      const d = 1 - 0.55 * mood.duck;
      duck.gain.cancelScheduledValues(t);
      duck.gain.setValueAtTime(1, t);
      duck.gain.linearRampToValueAtTime(d, t + 0.012);
      duck.gain.linearRampToValueAtTime(1, t + STEP * 3.6);
    }
  }

  function clap(t, vel = 1) {
    for (let i = 0; i < 3; i++) hiss(t + i * 0.011, { freq: 1500, type: 'bandpass', q: 0.9, peak: 0.1 * vel * mood.clap, rel: i === 2 ? 0.16 : 0.03, p: (i - 1) * 0.3 });
  }

  function hiss(t, { freq, type = 'highpass', q = 0.7, peak, rel, p = 0 }) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), pn = pan(p);
    s.buffer = noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    s.connect(f).connect(g).connect(pn).connect(drumBus);
    env(g, t, 0.002, peak, 0.005, rel);
    s.start(t, Math.random() * 1.5); s.stop(t + rel + 0.05);
  }

  function riser(t, bars) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    const dur = STEP * 16 * bars;
    s.buffer = noise; s.loop = true;
    f.type = 'bandpass'; f.Q.value = 4;
    f.frequency.setValueAtTime(250, t);
    f.frequency.exponentialRampToValueAtTime(9000, t + dur);
    s.connect(f).connect(g).connect(fxBus);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09 * mood.sweep, t + dur * 0.97);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    s.start(t); s.stop(t + dur + 0.1);
    // The arp filter opens with it.
    arpFilter.frequency.cancelScheduledValues(t);
    arpFilter.frequency.setValueAtTime(900, t);
    arpFilter.frequency.exponentialRampToValueAtTime(mood.cutoff * 1.6, t + dur);
  }

  function impact(t) {
    // The drop: a sub thump and a reverse-less cymbal wash.
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    o.connect(g).connect(drumBus);
    env(g, t, 0.004, 0.5 * Math.max(mood.kick, 0.3), 0.05, 0.9);
    o.start(t); o.stop(t + 1.2);
    hiss(t, { freq: 6000, peak: 0.12 * Math.max(mood.hats, 0.3), rel: 1.4 });
  }

  // 32-step melodic hook over the chord, played on the pluck in the drop; rests are 0.
  const HOOK = [0, 0, 2, 0, 4, 0, 0, 2, 0, 5, 0, 4, 0, 2, 0, 0, 0, 0, 2, 0, 4, 0, 7, 0, 5, 0, 4, 0, 2, 0, 1, 0];
  const FIGURE = [0, 2, 4, 2, 5, 4, 7, 4];
  let step = 0, next = 0, timer = null, playing = false;

  // Sections of a 32-bar phrase: 0–15 groove, 16–23 breakdown (no drums), 24–31 build, then drop.
  const section = (bar) => { const b = bar % 32; return b < 16 ? 'groove' : b < 24 ? 'break' : 'build'; };

  function schedule(t) {
    const bar = Math.floor(step / 16), s = step % 16, sec = section(bar), b32 = bar % 32;
    const c = chordAt(bar);
    const drums = mood.kick > 0 && sec !== 'break';
    const beat = s % 4 === 0;
    if (s === 0 && bar % 2 === 0) pad(c.tones, t, STEP * 32);
    if (s === 0 && b32 === 24) riser(t, 8);
    if (s === 0 && b32 === 0 && step > 0) impact(t);
    // Arp: 16ths through the chord, accent on the beat, gated in the groove for bounce.
    const tones = [...c.tones, ...c.tones.map((n) => n + 12)];
    const k = FIGURE[step % FIGURE.length];
    const gate = sec === 'groove' ? (s % 8 === 7 ? 0 : 1) : 1;
    if (gate) arp(tones[k % tones.length], t, beat ? 1 : s % 2 ? 0.55 : 0.75);
    // The hook on the pluck, in the groove and the drop's first bars.
    if (sec === 'groove' && mood.pluck) { const h = HOOK[step % 32]; if (h) pluck(c.tones[h % c.tones.length] + (h >= 5 ? 12 : 0), t, 1); }
    if (sec === 'break' && mood.pluck && s % 8 === 0) pluck(c.tones[(bar + s / 8) % c.tones.length] + 12, t, 0.7);
    // Drums.
    if (drums && beat) kick(t, b32 >= 24 && s === 0 && bar % 2 ? 1 : 1);
    if (drums && (s === 4 || s === 12)) clap(t);
    if (drums && s % 4 === 2) hiss(t, { freq: 8000, peak: 0.05 * mood.hats, rel: 0.12, p: 0.25 }); // open hat on the offbeat
    if (drums && s % 2 === 1 && mood.hats) hiss(t, { freq: 10000, peak: 0.018 * mood.hats, rel: 0.03, p: -0.2 }); // closed 16ths
    // Build: snare roll doubling every two bars, kick drops out in the last bar.
    if (sec === 'build') {
      const bb = b32 - 24;
      const every = bb < 4 ? 4 : bb < 6 ? 2 : 1;
      if (s % every === 0) clap(t, 0.5 + 0.5 * (bb / 8));
    }
    // Bass: rolling offbeat eighths in the groove, long notes in the break.
    if (mood.bass && sec !== 'break' && s % 4 === 2) bass(c.root, t);
    if (mood.bass && sec === 'groove' && s % 8 === 7 && bar % 2) bass(c.root + 12, t, STEP * 0.5);
    if (mood.bass && sec === 'break' && s === 0) bass(c.root, t, STEP * 14);
    // Calm mood: no kick, so the pad does the moving — a slow filter wave through the arp.
    if (!mood.kick && s === 0) { arpFilter.frequency.cancelScheduledValues(t); arpFilter.frequency.setValueAtTime(900 + 700 * Math.sin(bar * 0.6), t); }
  }

  function tick() {
    while (next < now() + 0.25) { schedule(next); next += STEP; step++; }
  }

  return {
    start() {
      if (!playing) { playing = true; step = 0; next = now() + 0.1; timer = setInterval(tick, 50); }
      master.gain.cancelScheduledValues(now());
      master.gain.setTargetAtTime(mood.level, now(), 2.0);
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
