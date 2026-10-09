// Synthesize the sea's sounds as WAV files for the Godot project — no samples to licence, and
// every sound is a few lines of physics-flavoured noise shaping.
//   node tools/synth-audio.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
const SR = 22050;
function wav(name, samples) {
  const n = samples.length, buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  let peak = 1e-6; for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const g = 0.92 / peak;
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i] * g)) * 32767), 44 + i * 2);
  mkdirSync('godot/audio', { recursive: true });
  writeFileSync(`godot/audio/${name}.wav`, buf);
  console.log(name, (n / SR).toFixed(2) + 's');
}
let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
// One-pole lowpass / highpass helpers.
const lp = (cut) => { let y = 0; const a = 1 - Math.exp(-2 * Math.PI * cut / SR); return (x) => (y += a * (x - y)); };
const hp = (cut) => { const l = lp(cut); return (x) => x - l(x); };

// Water lapping at the hull: pink-ish noise, slowly breathing, with little bubbles. Seamless loop.
{
  const len = SR * 8, out = new Float32Array(len);
  const l1 = lp(900), l2 = lp(300), h1 = hp(80);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const breath = 0.55 + 0.45 * Math.sin(2 * Math.PI * t / 8) * Math.sin(2 * Math.PI * t / 2.7 + 1);
    const n = l1(rnd()) * 0.7 + l2(rnd()) * 0.6;
    const ripple = Math.sin(2 * Math.PI * (3.1 * t) + 2 * Math.sin(2 * Math.PI * 0.37 * t)) * 0.08;
    out[i] = h1(n * breath + n * ripple);
  }
  // Crossfade the tail into the head so the loop has no seam.
  const x = SR * 0.5; for (let i = 0; i < x; i++) { const a = i / x; out[len - x + i] = out[len - x + i] * (1 - a) + out[i] * a; }
  wav('water_loop', out);
}
// Wind: a soft broadband bed that swells.
{
  const len = SR * 6, out = new Float32Array(len);
  const l = lp(500), h = hp(120);
  for (let i = 0; i < len; i++) { const t = i / SR; out[i] = h(l(rnd())) * (0.5 + 0.5 * Math.sin(2 * Math.PI * t / 6 + 0.5) ** 2); }
  const x = SR * 0.6; for (let i = 0; i < x; i++) { const a = i / x; out[len - x + i] = out[len - x + i] * (1 - a) + out[i] * a; }
  wav('wind_loop', out);
}
// Paddle splashes: a soft plant (low thump + burst) then a trailing fizz; three takes.
for (let k = 0; k < 3; k++) {
  const len = Math.floor(SR * 0.9), out = new Float32Array(len);
  const burst = lp(1800 + 400 * k), fizz = hp(1500), fl = lp(5000);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const envB = Math.exp(-t * 14), envF = Math.max(0, t - 0.03) * Math.exp(-t * 6) * 3;
    const thump = Math.sin(2 * Math.PI * (90 + 60 * k * 0.3) * t) * Math.exp(-t * 22) * 0.6;
    out[i] = burst(rnd()) * envB * 1.2 + fl(fizz(rnd())) * envF * 0.35 + thump;
  }
  wav(`splash_${k + 1}`, out);
}
// Drips off the blade: a few short tonal plinks.
for (let k = 0; k < 2; k++) {
  const len = Math.floor(SR * 0.7), out = new Float32Array(len);
  const drops = [[0.0, 2200], [0.11, 1700], [0.25, 2600], [0.42, 1500]];
  for (const [t0, f0] of drops) for (let i = Math.floor(t0 * SR); i < len; i++) {
    const t = i / SR - t0; if (t > 0.12) break;
    out[i] += Math.sin(2 * Math.PI * (f0 * (1 + 0.1 * k)) * t * (1 + 2 * t)) * Math.exp(-t * 45) * 0.5;
  }
  wav(`drip_${k + 1}`, out);
}
// Hull slap when a wave hits the side.
{
  const len = Math.floor(SR * 0.5), out = new Float32Array(len); const l = lp(600);
  for (let i = 0; i < len; i++) { const t = i / SR; out[i] = l(rnd()) * Math.exp(-t * 18) * 1.4 + Math.sin(2 * Math.PI * 70 * t) * Math.exp(-t * 20) * 0.5; }
  wav('hull_slap', out);
}
// Ferry horn: two blasts, a thick low chord with a slow attack.
{
  const len = SR * 4, out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR, b = t < 1.6 ? t : t > 2.0 ? t - 2.0 : -1;
    if (b < 0) continue;
    const env = Math.min(1, b * 6) * Math.min(1, (1.6 - b) * 4);
    let s = 0; for (const [f, a] of [[92, 1], [138, 0.6], [184, 0.5], [276, 0.25], [368, 0.15]]) s += Math.sin(2 * Math.PI * f * t + Math.sin(t * 3) * 0.2) * a;
    out[i] = s * env * 0.25;
  }
  wav('ferry_horn', out);
}
// Gull: a descending cry.
{
  const len = Math.floor(SR * 0.6), out = new Float32Array(len);
  for (let i = 0; i < len; i++) { const t = i / SR; const f = 1400 - 500 * t + 40 * Math.sin(2 * Math.PI * 28 * t); out[i] = (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * 2 * f * t)) * Math.sin(Math.PI * t / 0.6) ** 1.5 * 0.4; }
  wav('gull', out);
}

// Orca blow: a hard, breathy burst — the exhale is a short noise crack with a falling body, the
// inhale a softer draw right after. Heard across the water before the fin is seen.
{
  const len = Math.floor(SR * 0.9), out = new Float32Array(len); const l = lp(2600), h = hp(180);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const ex = t < 0.32 ? Math.min(1, t * 90) * Math.exp(-t * 9) : 0;
    const inh = t > 0.36 ? Math.exp(-(t - 0.36) * 7) * Math.min(1, (t - 0.36) * 20) * 0.35 : 0;
    out[i] = h(l(rnd())) * (ex * 1.6 + inh);
  }
  wav('blow', out);
}
// Bald eagle: not the hawk's scream the films use — a thin, stuttering chitter of rising whistles.
{
  const len = Math.floor(SR * 1.3), out = new Float32Array(len);
  const notes = [0.0, 0.14, 0.27, 0.39, 0.5, 0.63, 0.78, 0.95];
  for (const t0 of notes) for (let i = Math.floor(t0 * SR); i < len; i++) {
    const t = i / SR - t0; if (t > 0.11) break;
    const f = 2600 + 900 * t / 0.11 + 60 * Math.sin(2 * Math.PI * 90 * t);
    out[i] += (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * 2 * f * t)) * Math.sin(Math.PI * t / 0.11) * 0.28;
  }
  wav('eagle', out);
}
// A diesel at idle, heard across the water: a low, even thrum with a slow unevenness. Seamless loop.
{
  const len = SR * 4, out = new Float32Array(len); const l = lp(220);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const pulse = Math.max(0, Math.sin(2 * Math.PI * 11.5 * t)) ** 3;
    out[i] = l(rnd()) * (0.4 + 0.8 * pulse) + Math.sin(2 * Math.PI * 46 * t) * 0.18 * (0.8 + 0.2 * Math.sin(2 * Math.PI * 0.5 * t));
  }
  const x = SR * 0.5; for (let i = 0; i < x; i++) { const a = i / x; out[len - x + i] = out[len - x + i] * (1 - a) + out[i] * a; }
  wav('engine_idle', out);
}
// Raccoons in the night: a short quarrel of chitters and a growl, from the dark beyond the tent.
{
  const len = Math.floor(SR * 1.6), out = new Float32Array(len); const l = lp(1400);
  const chits = [0.0, 0.07, 0.13, 0.2, 0.55, 0.61, 0.68, 1.1, 1.17];
  for (const t0 of chits) for (let i = Math.floor(t0 * SR); i < len; i++) {
    const t = i / SR - t0; if (t > 0.06) break;
    out[i] += Math.sin(2 * Math.PI * (1500 + 400 * Math.sin(2 * Math.PI * 60 * t)) * t) * Math.sin(Math.PI * t / 0.06) * 0.22;
  }
  for (let i = Math.floor(0.75 * SR); i < Math.floor(1.05 * SR); i++) { const t = i / SR - 0.75; out[i] += l(rnd()) * Math.sin(Math.PI * t / 0.3) * (0.5 + 0.5 * Math.max(0, Math.sin(2 * Math.PI * 28 * t))) * 0.35; }
  wav('raccoons', out);
}

// Rain on the water and the deck: a hiss of filtered noise with a scatter of heavier drops. Seamless loop.
{
  const len = SR * 6, out = new Float32Array(len); const l = lp(3200), h = hp(400), l2 = lp(900);
  let drop = 0, dropT = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    if (Math.random() < 0.0009) { drop = 0.9 + Math.random() * 0.5; dropT = 0; }
    const d = drop > 0 ? Math.sin(2 * Math.PI * (900 + 400 * Math.random()) * dropT) * Math.exp(-dropT * 90) * drop : 0;
    dropT += 1 / SR; if (dropT > 0.08) drop = 0;
    const swell = 0.8 + 0.2 * Math.sin(2 * Math.PI * t / 3.3);
    out[i] = (h(l(rnd())) * 0.5 + l2(rnd()) * 0.2) * swell + d * 0.25;
  }
  const x = SR * 0.5; for (let i = 0; i < x; i++) { const a = i / x; out[len - x + i] = out[len - x + i] * (1 - a) + out[i] * a; }
  wav('rain_loop', out);
}
