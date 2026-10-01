// Debrief (US5, FR-018): what you paddled, what you saw, what you learned — and share it.
import Phaser from 'phaser';
import { text, button, glass, meter, fadeIn } from '../ui/widgets.js';
import { backdrop, scrollable } from '../ui/backdrop.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { tripScore } from '../sim/score.js';
import { SKILLS, level, progress } from '../sim/skills.js';
import { lessonById } from '../content/lessons.js';
import { speciesById } from '../content/species.js';
import { state, trip, persist, go } from '../state.js';
import { sound } from '../audio/soundscape.js';

export class Debrief extends Phaser.Scene {
  constructor() { super('Debrief'); }

  create() {
    fadeIn(this);
    const b = backdrop(this, { lat: 48.6115, lon: -123.0445, minute: 420, viewW: 900, dim: 0.72, drift: 1 });
    b.world.shader.setScrollFactor(0);
    const W = layout.W;
    const t = trip();
    if (!t) { go(this, 'Title'); return; }
    const r = t.record;
    r.nm = r.nm || 4.6;
    const score = tripScore(r);
    // Bank the trip once.
    if (!t.banked) {
      t.banked = true;
      const tot = state.save.totals;
      tot.nm += r.nm; tot.nights += r.nights; tot.trips += 1; tot.score += score.total;
      persist();
    }
    let y = layout.safe.top + 20;
    text(this, W / 2, y, 'FIRST VOYAGE', 11, { tracking: 3, color: CSS.mist, origin: [0.5, 0] }).setDepth(10);
    text(this, W / 2, y + 20, 'Friday Harbor → Jones Island', 22, { serif: true, weight: '600', origin: [0.5, 0] }).setDepth(10);
    y += 64;
    // Headline numbers.
    const stat = (x, big, small) => {
      text(this, x, y, big, 28, { serif: true, weight: '600', origin: [0.5, 0], color: CSS.sun }).setDepth(10);
      text(this, x, y + 38, small, 10, { tracking: 1, color: CSS.mist, origin: [0.5, 0] }).setDepth(10);
    };
    stat(W * 0.2, r.nm.toFixed(1), 'NAUTICAL MILES');
    stat(W * 0.5, String(r.nights), r.nights === 1 ? 'NIGHT OUT' : 'NIGHTS OUT');
    stat(W * 0.8, String(score.total), 'SCORE');
    y += 72;
    // Score parts.
    const section = (title, h) => { glass(this, 12, y, W - 24, h, { alpha: 0.7 }).setDepth(9); text(this, 28, y + 12, title, 15, { serif: true, weight: '600' }).setDepth(10); };
    const parts = score.parts;
    section('How the points came', 44 + parts.length * 22);
    parts.forEach(([k, v], i) => {
      text(this, 28, y + 40 + i * 22, k, 12.5, { color: CSS.fog }).setDepth(10);
      text(this, W - 28, y + 40 + i * 22, `${v > 0 ? '+' : ''}${v}`, 12.5, { weight: '600', color: v >= 0 ? CSS.good : CSS.danger, origin: [1, 0] }).setDepth(10);
    });
    y += 56 + parts.length * 22;
    // Skills.
    const sk = Object.keys(SKILLS).filter((id) => state.save.skills[id]);
    section('Skills', 44 + sk.length * 30);
    sk.forEach((id, i) => {
      const xp = state.save.skills[id];
      text(this, 28, y + 38 + i * 30, `${SKILLS[id]} · level ${level(xp)}`, 12.5).setDepth(10);
      meter(this, 28, y + 56 + i * 30, W - 56, 4, COLOR.good).setDepth(10).set(progress(xp));
    });
    y += 56 + sk.length * 30;
    // Lessons.
    const ls = t.lessons.map((id) => lessonById[id]).filter(Boolean);
    const lh = 44 + ls.length * 20;
    section(`What you learned (${ls.length})`, lh);
    ls.forEach((l, i) => {
      const how = state.save.lessons[l.id];
      text(this, 28, y + 40 + i * 20, `${how === 'demonstrated' ? '●' : '○'}  ${l.title}`, 12, { color: how === 'demonstrated' ? CSS.good : CSS.fog }).setDepth(10);
    });
    y += lh + 12;
    // Species.
    const sp = t.sightings.map((id) => speciesById[id]).filter(Boolean);
    section(`Seen on this trip (${sp.length})`, 44 + Math.ceil(sp.length / 2) * 20);
    sp.forEach((s, i) => text(this, 28 + (i % 2) * ((W - 56) / 2), y + 40 + Math.floor(i / 2) * 20, s.common, 12, { color: CSS.fog }).setDepth(10));
    y += 56 + Math.ceil(sp.length / 2) * 20;
    text(this, W / 2, y + 4, '● demonstrated   ○ met', 10.5, { color: CSS.mist, origin: [0.5, 0] }).setDepth(10);
    y += 36;
    button(this, W / 2, y, 'Share this trip', () => this.share(r, score, sp)).setDepth(10);
    button(this, W / 2, y + 60, 'Field guide', () => go(this, 'FieldGuide'), { primary: false }).setDepth(10);
    button(this, W / 2, y + 120, 'Home', () => { state.save.trip = null; persist(); go(this, 'Title'); }, { primary: false }).setDepth(10);
    scrollable(this, y + 180);
    sound.success();
    sound.mood('drive');
  }

  async share(r, score, sp) {
    const msg = `Salish Sea Expeditions — First Voyage: Friday Harbor → Jones Island. ${r.nm.toFixed(1)} nm, ${r.nights} night out, ${sp.length} species seen, score ${score.total}.`;
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: 'Salish Sea Expeditions', text: msg, url });
      else { await navigator.clipboard.writeText(`${msg} ${url}`); this.flash('Copied to the clipboard'); }
    } catch { /* cancelled */ }
  }

  flash(msg) {
    const t = text(this, layout.W / 2, layout.H - layout.safe.bottom - 30, msg, 13, { color: CSS.good, origin: [0.5, 1] }).setScrollFactor(0).setDepth(20);
    this.tweens.add({ targets: t, alpha: 0, delay: 1800, duration: 500, onComplete: () => t.destroy() });
  }
}
