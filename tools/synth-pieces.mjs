// The soundtrack: four full-length melodic pieces, techno and house in the Salish Sea's colours,
// rendered offline so the web build spends nothing on synthesis, and encoded as MP3 so four pieces
// cost less than the old six looping stems. All four share one beat grid at 122 bpm — the paddling
// cadence is two beats — and each is an arrangement of the same voices in its own key and mood:
//   dawn      the title, the school, the float plan: half-time, pads, a slow lead over D minor
//   crossing  the ferry and the open water: four on the floor, acid arp, a bright lead in A minor
//   night     camp: no kick, long pads, a far-off lead, F major by way of D minor
//   harbor    the dock and the landing: a warm house groove in F major with a plucked lead
//   node tools/synth-pieces.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
// lamejs 1.2.1's module build leaves MPEGMode, Lame and BitStream as implied globals; give it them.
const require = createRequire(import.meta.url);
globalThis.MPEGMode = require('lamejs/src/js/MPEGMode.js');
globalThis.Lame = require('lamejs/src/js/Lame.js');
globalThis.BitStream = require('lamejs/src/js/BitStream.js');
const lamejs = require('lamejs');

const SR = 22050, BPM = 122, BEAT = 60 / BPM, BAR = BEAT * 4;
const note = (n) => 440 * Math.pow(2, (n - 69) / 12);
let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
// The Chamberlin SVF is stable for cutoffs between a few tens of hertz and about a fifth of the sample rate; a
// negative cutoff (the bass's wobble used to swing below zero) runs away to infinity within a second.
const svf = () => { let lo = 0, band = 0; return (x, cut, q) => { const f = 2 * Math.sin(Math.PI * Math.max(40, Math.min(cut, SR * 0.22)) / SR); lo += f * band; const hi = x - lo - q * band; band += f * hi; return lo; }; };
const delay = (len, fb, mix) => { const buf = new Float32Array(len); let i = 0; return (x) => { const y = buf[i]; buf[i] = x + y * fb; i = (i + 1) % len; return x + y * mix; }; };
const sidechain = (t, depth = 0.65) => { const p = (t % BEAT) / BEAT; return (1 - depth) + depth * Math.min(1, p * 3.2) ** 1.4; };
const smooth = (a, b, x) => a + (b - a) * (x * x * (3 - 2 * x));

// ---- voices: each takes the time, the chord and a few knobs, returns a sample ----
function makeVoices() {
  const bassF = svf(), arpF = svf(), padF = svf(), leadF = svf(), texF = svf();
  const arpD = delay(Math.floor(SR * BEAT * 0.75), 0.42, 0.5);
  const leadD = delay(Math.floor(SR * BEAT * 1.5), 0.35, 0.4);
  let arpFreq = 220, leadFreq = 440, lastHat = 0;
  return {
    kick(t, halfTime) {
      const period = halfTime ? BEAT * 2 : BEAT, tb = t % period;
      const f = 48 + 110 * Math.exp(-tb * 38);
      return Math.sin(2 * Math.PI * f * tb + 0.6 * Math.sin(2 * Math.PI * 2 * f * tb)) * Math.exp(-tb * 7) + rnd() * Math.exp(-tb * 120) * 0.6;
    },
    clap(t) {
      const beat = Math.floor(t / BEAT), tb = t % BEAT;
      if (beat % 2 !== 1) return 0;
      const e = tb < 0.012 ? 1 : Math.exp(-(tb - 0.012) * 26) * 0.9;
      return rnd() * e * 0.55 * (1 + 0.4 * Math.sin(tb * 500));
    },
    bass(t, chord, pattern) {
      const root = chord[0] - 24, step = Math.floor(t / (BEAT / 2)) % 8, ts = t % (BEAT / 2);
      const pat = pattern[step], n = step === 6 ? root + 7 : root;
      const env = Math.exp(-ts * 6) * pat;
      const saw = ((note(n) * t) % 1) * 2 - 1;
      return bassF(saw * env, 180 + 900 * env + 300 * Math.sin(t * 0.7), 0.9) * 1.2 + Math.sin(2 * Math.PI * note(n) * t) * env * 0.5;
    },
    hats(t, busy) {
      const s16 = Math.floor(t / (BEAT / 4)), t16 = t % (BEAT / 4), swing = s16 % 2 ? 0.02 : 0;
      const ts = Math.max(0, t16 - swing);
      const hp = rnd() - lastHat * 0.1; lastHat = hp;
      const closed = Math.exp(-ts * 60) * (s16 % 4 === 2 ? 1.0 : (busy ? 0.45 : 0.0));
      const open = (s16 % 4 === 2) ? Math.exp(-ts * 9) * 0.7 : 0;
      const shaker = busy ? Math.exp(-ts * 30) * 0.3 * (0.6 + 0.4 * Math.sin(t * 0.9)) : 0;
      return hp * (closed + open + shaker);
    },
    arp(t, chord, sweepBars) {
      const s16 = Math.floor(t / (BEAT / 4)), t16 = t % (BEAT / 4);
      const seq = [0, 2, 4, 1, 3, 4, 2, 0, 1, 4, 3, 2, 0, 3, 1, 4];
      const oct = (Math.floor(s16 / 16) % 2) * 12 + (s16 % 7 === 3 ? 12 : 0);
      const target = note(chord[seq[s16 % 16] % chord.length] + oct);
      arpFreq += (target - arpFreq) * (s16 % 3 === 0 ? 0.0025 : 0.02);
      const gate = s16 % 8 === 5 ? 0 : 1;
      const env = Math.exp(-t16 * 9) * gate;
      const saw = ((arpFreq * t) % 1) * 2 - 1;
      const sweep = 0.5 + 0.5 * Math.sin(2 * Math.PI * t / (BAR * sweepBars) - Math.PI / 2);
      return arpD(arpF(saw, 300 + 2600 * sweep * (0.4 + 0.6 * env), 1.6) * env) * 0.9;
    },
    pad(t, chord, cycleBars) {
      const tc = t % (BAR * cycleBars);
      const env = Math.min(1, tc / 2.5) * Math.min(1, (BAR * cycleBars - tc) / 1.5 + 0.2);
      let v = 0;
      for (const n of chord.slice(0, 4)) for (const d of [-0.4, 0.3]) v += ((note(n) * (1 + d / 100 + 0.0008 * Math.sin(t * 0.8 + n)) * t) % 1) * 2 - 1;
      v /= 8;
      return padF(v, 500 + 1400 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t / (BAR * 8))), 0.5) * env * 0.9;
    },
    // The lead: a melody in the piece's scale, each note a degree and a length in eighths. A detuned
    // pair through a filter that opens with the note, a long delay behind it.
    lead(t, melody, scale, root, tone) {
      const eighth = BEAT / 2;
      let pos = Math.floor(t / eighth) % melody.total, idx = 0, acc = 0, noteStart = 0;
      for (; idx < melody.notes.length; idx++) { const len = melody.notes[idx][1]; if (pos < acc + len) { noteStart = acc; break; } acc += len; }
      const [deg, len] = melody.notes[idx] ?? [null, 1];
      if (deg === null) return 0;
      const n = root + scale[((deg % scale.length) + scale.length) % scale.length] + 12 * Math.floor(deg / scale.length);
      const target = note(n);
      leadFreq += (target - leadFreq) * (tone.glide ? 0.03 : 0.5);
      const tn = (t - (Math.floor(t / (eighth * melody.total)) * melody.total + noteStart) * eighth);
      const env = Math.min(1, tn / tone.attack) * Math.exp(-Math.max(0, tn - len * eighth * 0.7) * 6) * Math.min(1, Math.max(0.0, (len * eighth - tn) / 0.08));
      let v = 0;
      if (tone.kind === 'pluck') { v = (((leadFreq * t) % 1) * 2 - 1) * 0.6 + Math.sin(2 * Math.PI * leadFreq * t) * 0.4; }
      else { for (const d of [-0.6, 0.6]) v += ((leadFreq * (1 + d / 100) * t) % 1) * 2 - 1; v *= 0.5; }
      const cut = tone.cutoff + tone.cutoff * 1.5 * Math.exp(-tn * (tone.kind === 'pluck' ? 12 : 2));
      return leadD(leadF(v, cut, tone.q) * env) * tone.gain;
    },
    tex(t) {
      const tb = t % BAR, t8 = t % (BAR * 8);
      const swell = Math.pow(tb / BAR, 3) * 0.6;
      const riser = t8 > BAR * 6 ? Math.pow((t8 - BAR * 6) / (BAR * 2), 2) : 0;
      const tone = Math.sin(2 * Math.PI * (110 + 1800 * riser) * t) * riser * 0.25;
      return texF(rnd(), 400 + 6000 * (swell + riser), 0.7) * (swell + riser * 0.6) + tone;
    },
  };
}

// ---- pieces: key, chords, melody, arrangement ----
const MIN = [0, 2, 3, 5, 7, 8, 10], MAJ = [0, 2, 4, 5, 7, 9, 11];
const PIECES = {
  dawn: {
    root: 62, scale: MIN, halfTime: true, bassPattern: [1, 0, 0, 0, 0.8, 0, 0, 0], busyHats: false, sweepBars: 8, padCycle: 4,
    chords: [[62, 65, 69, 72, 76], [58, 62, 65, 69, 72], [53, 57, 60, 64, 67], [60, 64, 67, 71, 74]],
    melody: { notes: [[4, 6], [5, 2], [4, 4], [2, 4], [0, 8], [null, 8], [2, 4], [4, 2], [5, 2], [7, 8], [4, 8], [null, 8]] },
    tone: { kind: 'saw', attack: 0.4, cutoff: 700, q: 0.6, gain: 0.45, glide: true },
    sections: [ // [bars, kick, clap, bass, hats, arp, pad, lead, tex]
      [8, 0, 0, 0, 0, 0, 1, 0, 0.6], [8, 0, 0, 0.5, 0, 0.2, 1, 0.8, 0.6], [16, 0.9, 0, 0.9, 0.6, 0.35, 1, 1, 0.5],
      [8, 0, 0, 0.4, 0.3, 0.3, 1, 0.9, 0.6], [16, 1, 0, 1, 0.7, 0.5, 0.9, 1, 0.4], [8, 0, 0, 0, 0, 0, 1, 0.6, 0.6], [8, 0, 0, 0, 0, 0, 0.8, 0, 0.3],
    ],
  },
  crossing: {
    root: 57, scale: MIN, halfTime: false, bassPattern: [1, 0, 0.8, 0, 1, 0.5, 0.8, 0], busyHats: true, sweepBars: 4, padCycle: 4,
    chords: [[57, 60, 64, 67, 71], [53, 57, 60, 64, 67], [60, 64, 67, 71, 74], [55, 59, 62, 65, 69]],
    melody: { notes: [[7, 2], [7, 1], [9, 1], [7, 2], [4, 2], [5, 2], [4, 1], [2, 1], [0, 4], [null, 2], [2, 1], [4, 1], [7, 2], [9, 2], [11, 2], [9, 2], [7, 6], [null, 2]] },
    tone: { kind: 'saw', attack: 0.02, cutoff: 1400, q: 1.1, gain: 0.5, glide: false },
    sections: [
      [8, 0, 0, 0, 0.5, 0.4, 0.8, 0, 0.6], [8, 1, 0, 0.8, 0.8, 0.5, 0.7, 0, 0.6], [16, 1, 1, 1, 1, 0.6, 0.6, 1, 0.5],
      [8, 0, 0, 0.3, 0.4, 0.9, 1, 0.6, 0.7], [16, 1, 1, 1, 1, 0.8, 0.5, 1, 0.5], [16, 1, 1, 1, 1, 0.5, 0.7, 0.9, 0.5], [8, 0, 0, 0.5, 0.5, 0.3, 0.9, 0, 0.5], [8, 0, 0, 0, 0, 0, 0.7, 0, 0.3],
    ],
  },
  night: {
    root: 65, scale: MAJ, halfTime: true, bassPattern: [1, 0, 0, 0, 0, 0, 0, 0], busyHats: false, sweepBars: 16, padCycle: 8,
    chords: [[53, 57, 60, 64, 67], [50, 53, 57, 60, 64], [58, 62, 65, 69, 72], [48, 52, 55, 59, 62]],
    melody: { notes: [[4, 8], [2, 4], [0, 12], [null, 8], [5, 8], [4, 4], [2, 12], [null, 8]] },
    tone: { kind: 'saw', attack: 0.8, cutoff: 500, q: 0.4, gain: 0.35, glide: true },
    sections: [
      [8, 0, 0, 0, 0, 0, 1, 0, 0.5], [16, 0, 0, 0.4, 0.2, 0, 1, 0.8, 0.5], [16, 0, 0, 0.5, 0.3, 0.15, 1, 1, 0.4],
      [16, 0, 0, 0.3, 0.2, 0, 1, 0.7, 0.4], [16, 0, 0, 0, 0, 0, 1, 0.5, 0.3], [8, 0, 0, 0, 0, 0, 0.8, 0, 0.2],
    ],
  },
  harbor: {
    root: 65, scale: MAJ, halfTime: false, bassPattern: [1, 0, 0.6, 0, 1, 0, 0.6, 0.4], busyHats: true, sweepBars: 8, padCycle: 4,
    chords: [[53, 57, 60, 64, 67], [57, 60, 64, 67, 71], [58, 62, 65, 69, 72], [60, 64, 67, 71, 74]],
    melody: { notes: [[0, 2], [2, 2], [4, 2], [7, 2], [4, 4], [2, 2], [0, 2], [null, 4], [4, 1], [5, 1], [7, 2], [9, 2], [7, 2], [4, 2], [2, 4], [null, 4]] },
    tone: { kind: 'pluck', attack: 0.005, cutoff: 1800, q: 0.8, gain: 0.5, glide: false },
    sections: [
      [8, 0, 0, 0, 0.4, 0, 0.8, 0.6, 0.4], [8, 1, 0, 0.8, 0.7, 0, 0.7, 0.8, 0.4], [16, 1, 1, 1, 1, 0.3, 0.6, 1, 0.4],
      [8, 0.5, 0, 0.6, 0.5, 0.2, 0.9, 0.9, 0.5], [16, 1, 1, 1, 1, 0.4, 0.6, 1, 0.4], [8, 0, 0, 0.3, 0.3, 0, 0.9, 0.7, 0.4], [8, 0, 0, 0, 0, 0, 0.7, 0, 0.3],
    ],
  },
};

function render(name, p) {
  p.melody.total = p.melody.notes.reduce((a, [, l]) => a + l, 0);
  const bars = p.sections.reduce((a, s) => a + s[0], 0), len = Math.floor(SR * BAR * bars);
  const out = new Float32Array(len), v = makeVoices();
  const starts = []; let acc = 0; for (const s of p.sections) { starts.push(acc); acc += s[0]; }
  const mixAt = (bar) => { // section gains, crossfaded over the bar before each boundary
    let i = 0; while (i + 1 < starts.length && bar >= starts[i + 1]) i++;
    const cur = p.sections[i], next = p.sections[i + 1] ?? cur, end = starts[i] + cur[0];
    const x = Math.max(0, Math.min(1, bar - (end - 1)));
    return cur.map((g, k) => k === 0 ? 0 : smooth(g, next[k], x));
  };
  for (let i = 0; i < len; i++) {
    const t = i / SR, bar = t / BAR, chord = p.chords[Math.floor(bar / 4) % 4];
    const [, gk, gc, gb, gh, ga, gp, gl, gt] = mixAt(bar);
    const sc = sidechain(t, gk > 0.2 ? 0.65 : 0.15);
    let s = v.kick(t, p.halfTime) * gk + v.clap(t) * gc;
    s += (v.bass(t, chord, p.bassPattern) * gb + v.arp(t, chord, p.sweepBars) * ga + v.pad(t, chord, p.padCycle) * gp + v.lead(t, p.melody, p.scale, p.root, p.tone) * gl) * sc;
    s += v.hats(t, p.busyHats) * gh + v.tex(t) * gt * 0.6;
    out[i] = s;
  }
  // Per-section loudness, printed: a piece whose sections all read the same has no arrangement.
  const rms = p.sections.map((s, i) => { const a = Math.floor(starts[i] * BAR * SR), b = Math.floor((starts[i] + s[0]) * BAR * SR); let e = 0; for (let k = a; k < b; k++) e += out[k] * out[k]; return Math.sqrt(e / (b - a)); });
  console.log(`  sections rms: ${rms.map((r) => r.toFixed(2)).join(' ')}`);
  // A gentle fade at both ends, normalise, encode.
  const fade = Math.floor(SR * 2.0);
  for (let i = 0; i < fade; i++) { out[i] *= i / fade; out[len - 1 - i] *= i / fade; }
  let peak = 1e-6; for (const x of out) peak = Math.max(peak, Math.abs(x));
  const g = 0.89 / peak;
  const pcm = new Int16Array(len); for (let i = 0; i < len; i++) pcm[i] = Math.round(Math.max(-1, Math.min(1, out[i] * g)) * 32767);
  const enc = new lamejs.Mp3Encoder(1, SR, 64), parts = [];
  for (let i = 0; i < len; i += 1152) { const b = enc.encodeBuffer(pcm.subarray(i, i + 1152)); if (b.length) parts.push(Buffer.from(b)); }
  const tail = enc.flush(); if (tail.length) parts.push(Buffer.from(tail));
  const file = Buffer.concat(parts);
  mkdirSync('godot/audio', { recursive: true });
  writeFileSync(`godot/audio/piece_${name}.mp3`, file);
  console.log(`piece_${name}.mp3  ${bars} bars  ${(len / SR / 60).toFixed(1)} min  ${(file.length / 1024).toFixed(0)} KB`);
}
if (process.env.DIAG) {
  // Each voice alone for twelve seconds, peak and whether it stayed finite: finds an unstable filter.
  for (const [name, p] of Object.entries(PIECES)) {
    p.melody.total = p.melody.notes.reduce((a, [, l]) => a + l, 0);
    const v = makeVoices(), n = SR * 12, peaks = {};
    const voices = { kick: (t) => v.kick(t, p.halfTime), clap: (t) => v.clap(t), bass: (t) => v.bass(t, p.chords[0], p.bassPattern), hats: (t) => v.hats(t, p.busyHats), arp: (t) => v.arp(t, p.chords[0], p.sweepBars), pad: (t) => v.pad(t, p.chords[0], p.padCycle), lead: (t) => v.lead(t, p.melody, p.scale, p.root, p.tone), tex: (t) => v.tex(t) };
    for (const [k, f] of Object.entries(voices)) { let pk = 0; for (let i = 0; i < n; i++) { const x = f(i / SR); pk = Math.max(pk, Math.abs(x)); if (!Number.isFinite(x)) { pk = Infinity; break; } } peaks[k] = pk.toFixed(2); }
    console.log(name, JSON.stringify(peaks));
  }
} else {
  for (const [name, p] of Object.entries(PIECES)) render(name, p);
}
