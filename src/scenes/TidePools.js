// Morning low tide at Jones Island (US5): look closely, touch gently, put things back.
import Phaser from 'phaser';
import { focusRing } from '../ui/focus.js';
import { text, button, lessonCard, fadeIn } from '../ui/widgets.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { speciesById } from '../content/species.js';
import { lessonById } from '../content/lessons.js';
import { lesson, observe, go, persist, trip } from '../state.js';
import { award } from '../sim/skills.js';
import { state } from '../state.js';
import { sound } from '../audio/soundscape.js';

export class TidePools extends Phaser.Scene {
  constructor() { super('TidePools'); }

  create() {
    fadeIn(this);
    const W = layout.W, H = layout.H;
    this.cx = W / 2; this.cy = H * 0.5;
    this.g = this.add.graphics();
    this.caustic = this.add.graphics();
    this.crit = this.add.graphics();
    this.t = 0;
    this.found = new Set();
    this.rockLifted = false;
    this.spots = [
      { id: 'seaStar', x: this.cx - 92, y: this.cy - 40, r: 34 },
      { id: 'anemone', x: this.cx + 70, y: this.cy + 70, r: 30 },
      { id: 'nudibranch', x: this.cx - 30, y: this.cy + 120, r: 22 },
      { id: 'eelgrass', x: this.cx + 110, y: this.cy - 120, r: 34 },
      { id: 'octopus', x: this.cx + 20, y: this.cy - 10, r: 50, hidden: true },
    ];
    this.drawPool();
    text(this, W / 2, layout.safe.top + 16, 'Low tide, 06:50', 13, { color: CSS.mist, origin: [0.5, 0], tracking: 1 }).setDepth(20);
    text(this, W / 2, layout.safe.top + 36, 'The tide pools', 26, { serif: true, weight: '600', origin: [0.5, 0] }).setDepth(20);
    this.hint = text(this, W / 2, H - layout.safe.bottom - 110, 'Tap what you see. Hold the big rock to lift it — gently.', 13, { color: CSS.fog, origin: [0.5, 0.5], align: 'center', wrap: W - 60 }).setDepth(20);
    lesson('tidepools');
    this.card = lessonCard(this, lessonById.tidepools, { y: layout.safe.top + 76, depth: 40, autoHide: 8000 });
    this.input.on('pointerdown', (p) => this.down(p));
    for (const s of this.spots) {
      focusRing(this).add({
        bounds: () => ({ x: s.x - s.r * 0.7, y: s.y - s.r * 0.7, w: s.r * 1.4, h: s.r * 1.4 }),
        activate: () => {
          this.down({ x: s.x * layout.S, y: s.y * layout.S });
          if (s.hidden) this.time.delayedCall(950, () => this.up());
        },
      });
    }
    this.input.on('pointerup', () => this.up());
    button(this, W / 2, H - layout.safe.bottom - 50, 'Pack up and debrief', () => this.leave()).setDepth(30);
    sound.ambience({ sea: 0.15, wind: 0.05, surf: 0.3, rip: 0 });
  }

  drawPool() {
    const g = this.g, W = layout.W, H = layout.H, cx = this.cx, cy = this.cy;
    g.clear();
    // Rock shelf.
    g.fillStyle(0x5d5a52, 1);
    g.fillRect(0, 0, px(W), px(H));
    for (let i = 0; i < 90; i++) {
      g.fillStyle([0x6b675d, 0x4f4c45, 0x77726a][i % 3], 1);
      g.fillEllipse(px((i * 71) % W), px((i * 131) % H), px(40 + (i % 5) * 18), px(26 + (i % 4) * 10));
    }
    // Barnacles and mussels.
    for (let i = 0; i < 260; i++) {
      const a = (i * 2.4) % (Math.PI * 2), r = 160 + (i % 40) * 3;
      g.fillStyle(i % 4 ? 0xe8e4d8 : 0x1d2a44, 0.9);
      g.fillCircle(px(cx + Math.cos(a) * r * 1.05), px(cy + Math.sin(a) * r * 1.35), px(i % 4 ? 2 : 4));
    }
    // Rockweed.
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      g.lineStyle(px(4), 0x6b5a2a, 0.9);
      const x0 = cx + Math.cos(a) * 150, y0 = cy + Math.sin(a) * 200;
      g.lineBetween(px(x0), px(y0), px(x0 + Math.cos(a + 0.6) * 30), px(y0 + Math.sin(a + 0.6) * 30));
    }
    // The pool.
    const pts = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const r = 1 + 0.12 * Math.sin(a * 3 + 1) + 0.07 * Math.sin(a * 7);
      pts.push({ x: px(cx + Math.cos(a) * 150 * r), y: px(cy + Math.sin(a) * 200 * r) });
    }
    g.fillStyle(0x1b4a4c, 1);
    g.fillPoints(pts, true);
    // Pink coralline crust at the rim.
    g.lineStyle(px(6), 0xc98a9a, 0.6);
    g.strokePoints(pts, true);
    // The big rock in the pool.
    g.fillStyle(0x6e695f, 1);
    g.fillEllipse(px(cx + 20), px(cy - 10), px(110), px(80));
    g.fillStyle(0x86806f, 1);
    g.fillEllipse(px(cx + 10), px(cy - 22), px(80), px(46));
  }

  drawCritters() {
    const g = this.crit, t = this.t;
    g.clear();
    const S = this.spots;
    // Ochre sea star, purple.
    const st = S[0];
    g.fillStyle(0x7a3a8a, 1);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
      g.fillTriangle(px(st.x), px(st.y), px(st.x + Math.cos(a - 0.35) * 10), px(st.y + Math.sin(a - 0.35) * 10), px(st.x + Math.cos(a) * 30), px(st.y + Math.sin(a) * 30));
      g.fillTriangle(px(st.x), px(st.y), px(st.x + Math.cos(a + 0.35) * 10), px(st.y + Math.sin(a + 0.35) * 10), px(st.x + Math.cos(a) * 30), px(st.y + Math.sin(a) * 30));
    }
    g.fillStyle(0xe8d8f0, 0.5);
    for (let k = 0; k < 12; k++) g.fillCircle(px(st.x + Math.cos(k) * 12), px(st.y + Math.sin(k * 1.3) * 12), px(1.2));
    // Giant green anemone.
    const an = S[1];
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2, sw = Math.sin(t * 1.3 + k) * 2;
      g.lineStyle(px(3), 0x3fa070, 0.9);
      g.lineBetween(px(an.x), px(an.y), px(an.x + Math.cos(a) * (20 + sw)), px(an.y + Math.sin(a) * (20 + sw)));
    }
    g.fillStyle(0x7ad0a0, 1);
    g.fillCircle(px(an.x), px(an.y), px(9));
    // Opalescent nudibranch.
    const nu = S[2];
    const nx = nu.x + Math.sin(t * 0.2) * 6;
    g.fillStyle(0xf0f0f0, 1);
    g.fillEllipse(px(nx), px(nu.y), px(26), px(8));
    g.fillStyle(0xf0a040, 1);
    for (let k = 0; k < 8; k++) g.fillCircle(px(nx - 10 + k * 3), px(nu.y - 3 + (k % 2) * 6), px(2.2));
    g.lineStyle(px(1), 0x4aa0ff, 0.9);
    g.lineBetween(px(nx - 12), px(nu.y), px(nx + 12), px(nu.y));
    // Eelgrass blades swaying.
    const eg = S[3];
    for (let k = 0; k < 9; k++) {
      g.lineStyle(px(3), 0x4a8a3a, 0.9);
      const x0 = eg.x - 20 + k * 5;
      g.lineBetween(px(x0), px(eg.y + 30), px(x0 + Math.sin(t + k) * 10), px(eg.y - 26));
    }
    // Octopus under the lifted rock.
    if (this.rockLifted) {
      const o = S[4];
      g.fillStyle(0xa0442c, 1);
      g.fillEllipse(px(o.x), px(o.y), px(34), px(26));
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        g.lineStyle(px(4), 0xb85a3a, 1);
        const cx = o.x + Math.cos(a) * 16, cy = o.y + Math.sin(a) * 12;
        g.lineBetween(px(cx), px(cy), px(cx + Math.cos(a + Math.sin(t + k)) * 22), px(cy + Math.sin(a + Math.sin(t + k)) * 22));
      }
      g.fillStyle(0x151515, 1);
      g.fillCircle(px(o.x - 6), px(o.y - 4), px(2.5));
      g.fillCircle(px(o.x + 6), px(o.y - 4), px(2.5));
    }
  }

  down(p) {
    sound.unlock();
    const x = p.x / layout.S, y = p.y / layout.S;
    const rock = this.spots[4];
    if (!this.rockLifted && Math.hypot(x - rock.x, y - rock.y) < 55) {
      this.holding = this.time.delayedCall(900, () => {
        this.rockLifted = true;
        this.g.setAlpha(1);
        this.found.add('octopus');
        if (observe('octopus')) sound.success();
        this.show('octopus', 'Under the rock, a giant Pacific octopus — young, and not pleased. Put the rock back exactly as it was.');
        this.time.delayedCall(4500, () => { this.rockLifted = false; this.hint.setText('Rock put back. Everything under it can breathe again.'); });
      });
      return;
    }
    for (const s of this.spots) {
      if (s.hidden) continue;
      if (Math.hypot(x - s.x, y - s.y) < s.r) {
        if (!this.found.has(s.id)) {
          this.found.add(s.id);
          if (observe(s.id)) sound.success(); else sound.ui('tap');
        }
        this.show(s.id);
      }
    }
  }

  up() {
    this.holding?.remove();
    this.holding = null;
  }

  show(id, extra) {
    const sp = speciesById[id];
    this.card?.active && this.card.destroy();
    this.card = lessonCard(this, { title: sp.common, text: extra ?? `${sp.blurb} ${sp.facts[0]}`, sourceIds: sp.sourceIds }, { y: layout.safe.top + 76, depth: 40 });
  }

  leave() {
    if (this.found.size >= 3) { lesson('tidepools', 'demonstrated'); award(state.save.skills, 'campcraft', 10); }
    persist();
    go(this, 'Debrief');
  }

  update(_t, dms) {
    const dt = dms / 1000;
    this.t += dt;
    sound.update(dt);
    this.drawCritters();
    // Light dancing on the pool floor.
    const c = this.caustic, cx = this.cx, cy = this.cy;
    c.clear();
    for (let i = 0; i < 14; i++) {
      const y = cy - 170 + i * 26 + Math.sin(this.t * 0.9 + i) * 6;
      c.lineStyle(px(2), 0xbfe8e0, 0.08 + 0.05 * Math.sin(this.t * 2 + i));
      c.beginPath();
      for (let k = 0; k <= 12; k++) {
        const x = cx - 130 + k * 22;
        const yy = y + Math.sin(this.t * 1.7 + k * 0.8 + i) * 5;
        k ? c.lineTo(px(x), px(yy)) : c.moveTo(px(x), px(yy));
      }
      c.strokePath();
    }
  }
}
