// The field guide (US6, FR-028): every organism you observe unlocks a page.
import Phaser from 'phaser';
import { focusRing } from '../ui/focus.js';
import { text, button, glass, lessonCard, fadeIn } from '../ui/widgets.js';
import { backdrop, scrollable } from '../ui/backdrop.js';
import { COLOR, CSS, layout, px } from '../ui/theme.js';
import { SPECIES, SPECIES_GROUPS } from '../content/species.js';
import { state, go } from '../state.js';
import { creditById } from '../content/credits.js';

// A small drawn emblem per group, tinted with the species' colour.
function emblem(g, x, y, r, s, seen) {
  g.fillStyle(seen ? 0x0e3a45 : 0x0b2b33, 1);
  g.fillCircle(x, y, r);
  g.lineStyle(px(1), 0xffffff, seen ? 0.35 : 0.12);
  g.strokeCircle(x, y, r);
  const c = seen ? s.colour : 0x2a4a50;
  g.fillStyle(c, 1);
  const k = r / px(28);
  if (s.group === 'Marine mammals') {
    g.fillEllipse(x, y + px(4) * k, px(40) * k, px(16) * k);
    g.fillTriangle(x - px(4) * k, y - px(2) * k, x + px(4) * k, y - px(2) * k, x, y - px(s.id === 'orca' ? 16 : 8) * k);
    g.fillTriangle(x + px(18) * k, y + px(4) * k, x + px(28) * k, y - px(4) * k, x + px(28) * k, y + px(12) * k);
  } else if (s.group === 'Birds') {
    g.fillTriangle(x - px(22) * k, y - px(6) * k, x, y + px(4) * k, x - px(4) * k, y - px(2) * k);
    g.fillTriangle(x + px(22) * k, y - px(6) * k, x, y + px(4) * k, x + px(4) * k, y - px(2) * k);
    g.fillEllipse(x, y + px(2) * k, px(10) * k, px(14) * k);
  } else if (s.group === 'Trees') {
    g.fillTriangle(x - px(14) * k, y + px(14) * k, x + px(14) * k, y + px(14) * k, x, y - px(18) * k);
    g.fillStyle(0x5a3a22, 1);
    g.fillRect(x - px(2) * k, y + px(14) * k, px(4) * k, px(6) * k);
  } else if (s.group === 'Kelp & seagrass') {
    g.lineStyle(px(3) * k, c, 1);
    for (let i = -1; i <= 1; i++) g.lineBetween(x + px(i * 6) * k, y + px(16) * k, x + px(i * 10) * k, y - px(14) * k);
    g.fillCircle(x, y - px(14) * k, px(4) * k);
  } else {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      g.fillTriangle(x, y, x + Math.cos(a - 0.4) * px(7) * k, y + Math.sin(a - 0.4) * px(7) * k, x + Math.cos(a) * px(18) * k, y + Math.sin(a) * px(18) * k);
      g.fillTriangle(x, y, x + Math.cos(a + 0.4) * px(7) * k, y + Math.sin(a + 0.4) * px(7) * k, x + Math.cos(a) * px(18) * k, y + Math.sin(a) * px(18) * k);
    }
  }
}

export class FieldGuide extends Phaser.Scene {
  constructor() { super('FieldGuide'); }

  create() {
    fadeIn(this);
    const b = backdrop(this, { minute: 700, dim: 0.78 });
    b.world.shader.setScrollFactor(0);
    const W = layout.W;
    const seen = state.save.fieldGuide;
    const n = SPECIES.filter((s) => seen[s.id]).length;
    let y = layout.safe.top + 18;
    text(this, W / 2, y, 'Field guide', 28, { serif: true, weight: '600', origin: [0.5, 0] }).setDepth(10);
    text(this, W / 2, y + 40, `${n} of ${SPECIES.length} observed · every page unlocks by seeing it`, 12, { color: CSS.mist, origin: [0.5, 0] }).setDepth(10);
    y += 76;
    const g = this.add.graphics().setDepth(10);
    const cols = 3, cw = (W - 24) / cols;
    this.hits = [];
    for (const grp of SPECIES_GROUPS) {
      text(this, 18, y, grp.toUpperCase(), 10.5, { tracking: 1.5, color: CSS.sun }).setDepth(10);
      y += 22;
      const list = SPECIES.filter((s) => s.group === grp);
      list.forEach((s, i) => {
        const cx = 12 + cw * (i % cols) + cw / 2, cy = y + Math.floor(i / cols) * 104 + 34;
        emblem(g, px(cx), px(cy), px(28), s, !!seen[s.id]);
        text(this, cx, cy + 36, seen[s.id] ? s.common : '— not yet seen —', 11, { color: seen[s.id] ? CSS.foam : CSS.mist, origin: [0.5, 0], align: 'center', wrap: cw - 10 }).setDepth(10);
        this.hits.push({ s, x: cx, y: cy, open: !!seen[s.id] });
      });
      y += Math.ceil(list.length / cols) * 104 + 14;
    }
    button(this, W / 2, y + 20, 'Back', () => go(this, this.scene.settings.data?.from ?? 'Title'), { primary: false }).setDepth(10);
    scrollable(this, y + 80);
    this.onBack = () => go(this, this.scene.settings.data?.from ?? 'Title');
    const open = (hit) => {
      this.card?.active && this.card.destroy();
      const s = hit.s;
      const body = hit.open ? `${s.scientific}\n\n${s.blurb}\n\n${s.facts.map((f) => `· ${f}`).join('\n')}\n\nWhere: ${s.where}` : 'Not yet observed. Keep your eyes open on the water, in the air, in the tide pools and along the shore.';
      this.card = lessonCard(this, { title: hit.open ? s.common : '?', text: body, sourceIds: hit.open ? s.sourceIds : [] }, { y: layout.safe.top + 60, depth: 60, action: 'Close', onAction: () => this.card.dismiss() });
      this.card.setScrollFactor(0);
    };
    for (const hit of this.hits) focusRing(this).add({ scroll: true, bounds: () => ({ x: hit.x - 32, y: hit.y - 32, w: 64, h: 64 }), activate: () => open(hit) });
    let downY = 0;
    this.input.on('pointerdown', (p) => { downY = p.y; });
    this.input.on('pointerup', (p) => {
      if (Math.abs(p.y - downY) > 10) return;
      const wy = (p.y + this.cameras.main.scrollY) / layout.S, wx = p.x / layout.S;
      const hit = this.hits.find((h) => Math.hypot(h.x - wx, h.y - wy) < 36);
      if (!hit) return;
      open(hit);
    });
  }
}
