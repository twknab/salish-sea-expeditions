// The soundtrack: psychedelic techno stems at 122 bpm, rendered offline so the web build spends
// nothing on synthesis. Every stem is the same bar length and starts on the one, so they loop in
// sync; moods are just which stems are up. Dm9 → Bbmaj7 → Fmaj7 → Cadd9, four bars each.
//   node tools/synth-soundtrack.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
const SR = 22050, BPM = 122, BEAT = 60 / BPM, BAR = BEAT * 4, BARS = 16, LEN = Math.floor(SR * BAR * BARS);
const note = (n) => 440 * Math.pow(2, (n - 69) / 12);
const CHORDS = [[62, 65, 69, 72, 76], [58, 62, 65, 69, 72], [53, 57, 60, 64, 67], [60, 64, 67, 71, 74]]; // Dm9 Bbmaj7 Fmaj7(9) Cadd9
const chordAt = (t) => CHORDS[Math.floor(t / (BAR * 4)) % 4];
let seed = 99; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
function wav(name, s) {
  const n = s.length, buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  let peak = 1e-6; for (const v of s) peak = Math.max(peak, Math.abs(v));
  const g = 0.9 / peak;
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s[i] * g)) * 32767), 44 + i * 2);
  mkdirSync('godot/audio', { recursive: true }); writeFileSync(`godot/audio/${name}.wav`, buf);
  console.log(name, (n / SR).toFixed(1) + 's');
}
// A resonant 2-pole lowpass (Chamberlin SVF) — the acid sound and the pad's breathing.
function svf() { let lo = 0, band = 0; return (x, cut, q) => { const f = 2 * Math.sin(Math.PI * Math.min(cut, SR * 0.22) / SR); lo += f * band; const hi = x - lo - q * band; band += f * hi; return lo; }; }
const sidechain = (t) => { const p = (t % BEAT) / BEAT; return 0.35 + 0.65 * Math.min(1, p * 3.2) ** 1.4; };
const delay = (len, fb, mix) => { const buf = new Float32Array(len); let i = 0; return (x) => { const y = buf[i]; buf[i] = x + y * fb; i = (i + 1) % len; return x + y * mix; }; };

// Kick + clap/rim: a tight four-on-the-floor with a pitched thump and a clap on 2 and 4.
{
  const out = new Float32Array(LEN);
  for (let i = 0; i < LEN; i++) {
    const t = i / SR, tb = t % BEAT, beat = Math.floor(t / BEAT);
    const f = 48 + 110 * Math.exp(-tb * 38);
    out[i] = Math.sin(2 * Math.PI * f * tb + 0.6 * Math.sin(2 * Math.PI * 2 * f * tb)) * Math.exp(-tb * 7) * 1.0 + rnd() * Math.exp(-tb * 120) * 0.6;
    if (beat % 2 === 1) { const e = tb < 0.012 ? 1 : Math.exp(-(tb - 0.012) * 26) * 0.9; out[i] += rnd() * e * 0.55 * (1 + 0.4 * Math.sin(tb * 500)); }
  }
  wav('music_kick', out);
}
// Bass: a rubbery sub following the chord root, off-beat accents, sidechained to the kick.
{
  const out = new Float32Array(LEN); const flt = svf();
  for (let i = 0; i < LEN; i++) {
    const t = i / SR, root = chordAt(t)[0] - 24, step = Math.floor(t / (BEAT / 2)) % 8, ts = t % (BEAT / 2);
    const pattern = [1, 0, 0.8, 0, 1, 0.5, 0.8, 0][step], n = step === 6 ? root + 7 : root;
    const env = Math.exp(-ts * 6) * pattern;
    const saw = ((note(n) * t) % 1) * 2 - 1;
    out[i] = flt(saw * env, 180 + 900 * env + 300 * Math.sin(t * 0.7), 0.9) * sidechain(t) * 1.2 + Math.sin(2 * Math.PI * note(n) * t) * env * 0.5 * sidechain(t);
  }
  wav('music_bass', out);
}
// Hats and shaker: open hat off the beat, 16ths shaker with swing, a slow stereo-less phase wobble.
{
  const out = new Float32Array(LEN);
  for (let i = 0; i < LEN; i++) {
    const t = i / SR, s16 = Math.floor(t / (BEAT / 4)), t16 = t % (BEAT / 4), swing = s16 % 2 ? 0.02 : 0;
    const ts = Math.max(0, t16 - swing);
    const hp = rnd() - (out[i - 1] || 0) * 0.1;
    const closed = Math.exp(-ts * 60) * (s16 % 4 === 2 ? 1.0 : 0.45);
    const open = (s16 % 4 === 2) ? Math.exp(-ts * 9) * 0.7 : 0;
    const shaker = Math.exp(-ts * 30) * 0.3 * (0.6 + 0.4 * Math.sin(t * 0.9));
    out[i] = hp * (closed + open + shaker);
  }
  wav('music_hats', out);
}
// Acid arp: a 303-ish line through the chord tones, slides, a resonant filter that breathes over
// four bars and a dub delay. This is the psychedelic part.
{
  const out = new Float32Array(LEN); const flt = svf(); const dly = delay(Math.floor(SR * BEAT * 0.75), 0.42, 0.5);
  let freq = 220;
  for (let i = 0; i < LEN; i++) {
    const t = i / SR, ch = chordAt(t), s16 = Math.floor(t / (BEAT / 4)), t16 = t % (BEAT / 4);
    const seq = [0, 2, 4, 1, 3, 4, 2, 0, 1, 4, 3, 2, 0, 3, 1, 4];
    const oct = (Math.floor(s16 / 16) % 2) * 12 + (s16 % 7 === 3 ? 12 : 0);
    const target = note(ch[seq[s16 % 16]] + oct);
    freq += (target - freq) * (s16 % 3 === 0 ? 0.0025 : 0.02); // slides on every third step
    const gate = s16 % 8 === 5 ? 0 : 1;
    const env = Math.exp(-t16 * 9) * gate;
    const saw = ((freq * t) % 1) * 2 - 1;
    const sweep = 0.5 + 0.5 * Math.sin(2 * Math.PI * t / (BAR * 4) - Math.PI / 2);
    const cut = 300 + 2600 * sweep * (0.4 + 0.6 * env);
    const v = flt(saw, cut, 1.6) * env;
    out[i] = dly(v) * sidechain(t) * 0.9;
  }
  wav('music_arp', out);
}
// Pad: detuned saws through a slow filter, chord tones, long attack, a chorus-like wobble.
{
  const out = new Float32Array(LEN); const flt = svf();
  for (let i = 0; i < LEN; i++) {
    const t = i / SR, ch = chordAt(t), tc = t % (BAR * 4);
    const env = Math.min(1, tc / 2.5) * Math.min(1, (BAR * 4 - tc) / 1.5 + 0.2);
    let v = 0;
    for (const n of ch.slice(0, 4)) for (const d of [-0.4, 0.3]) v += ((note(n) * (1 + d / 100 + 0.0008 * Math.sin(t * 0.8 + n)) * t) % 1) * 2 - 1;
    v /= 8;
    const cut = 500 + 1400 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t / (BAR * 8)));
    out[i] = flt(v, cut, 0.5) * env * sidechain(t) * 0.9;
  }
  wav('music_pad', out);
}
// Texture: a reversed-feeling shimmer — filtered noise swells on the bar, pitched risers every 8.
{
  const out = new Float32Array(LEN); const flt = svf();
  for (let i = 0; i < LEN; i++) {
    const t = i / SR, tb = t % BAR, t8 = t % (BAR * 8);
    const swell = Math.pow(tb / BAR, 3) * 0.6;
    const riser = t8 > BAR * 6 ? Math.pow((t8 - BAR * 6) / (BAR * 2), 2) : 0;
    const tone = Math.sin(2 * Math.PI * (110 + 1800 * riser) * t) * riser * 0.25;
    out[i] = flt(rnd(), 400 + 6000 * (swell + riser), 0.7) * (swell + riser * 0.6) + tone;
  }
  wav('music_tex', out);
}
