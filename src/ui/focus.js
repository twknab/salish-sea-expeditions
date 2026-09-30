// Keyboard access for every screen: Tab / Shift+Tab or the arrow keys move a visible focus ring
// between the things you can press or tap; Enter or Space activates; Escape goes back.
// Buttons register themselves (widgets.js); scenes register tap targets (hotspots, cards, chips).
import { COLOR, layout, px } from './theme.js';

export class FocusRing {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.index = -1;
    this.visible = false; // the ring shows once the keyboard is used, not on touch
    this.g = scene.add.graphics().setDepth(900).setScrollFactor(0);
    const kb = scene.input.keyboard;
    if (!kb) return;
    this.onKey = (e) => this.key(e);
    kb.on('keydown', this.onKey);
    scene.input.on('pointerdown', () => { this.visible = false; this.draw(); });
    scene.events.on('update', () => this.draw());
    scene.events.once('shutdown', () => kb.off('keydown', this.onKey));
  }

  /**
   * item: { bounds(): {x, y, w, h} in points (screen space), activate(), label?, scroll? }
   * Returns a handle with remove().
   */
  add(item) {
    this.items.push(item);
    return { remove: () => { this.items = this.items.filter((i) => i !== item); } };
  }

  live() {
    return this.items.filter((i) => (i.alive ? i.alive() : true));
  }

  key(e) {
    // Leave gameplay keys alone while a scene has claimed them (e.g. paddling).
    if (this.scene.keyboardGameplay && !['Tab', 'Enter', 'Escape'].includes(e.key)) return;
    // While a gesture is waiting for keys, only Tab and Escape belong to the focus ring.
    if (this.scene.arrowsClaimed && !['Tab', 'Escape'].includes(e.key)) return;
    const items = this.live();
    if (e.key === 'Escape') { this.scene.onBack?.(); return; }
    if (!items.length) return;
    const move = (d) => {
      this.visible = true;
      this.index = ((this.index < 0 ? (d > 0 ? -1 : 0) : this.index) + d + items.length) % items.length;
      const it = items[this.index];
      it.onFocus?.();
      // Keep the focused thing on screen in scrolling pages.
      if (it.scroll) {
        const cam = this.scene.cameras.main, b = it.bounds();
        const top = cam.scrollY / layout.S, H = layout.H;
        if (b.y < top + 80) cam.scrollY = Math.max(0, (b.y - 80) * layout.S);
        else if (b.y + b.h > top + H - 60) cam.scrollY = (b.y + b.h - H + 60) * layout.S;
      }
      this.draw();
    };
    const cur = items[this.index];
    if (e.key === 'Tab') { e.preventDefault?.(); move(e.shiftKey ? -1 : 1); }
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && cur?.adjust && this.visible) cur.adjust(e.key === 'ArrowRight' ? 1 : -1);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { if (!this.scene.arrowsClaimed) move(1); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { if (!this.scene.arrowsClaimed) move(-1); }
    else if ((e.key === 'Enter' || e.key === ' ') && this.index >= 0 && items[this.index]) {
      this.visible = true;
      items[this.index].activate();
    }
  }

  draw() {
    const g = this.g;
    g.clear();
    if (!this.visible) return;
    const items = this.live();
    const it = items[this.index];
    if (!it) return;
    const b = it.bounds();
    const scrollY = it.scroll ? this.scene.cameras.main.scrollY / layout.S : 0;
    const pad = 5;
    g.lineStyle(px(2.5), COLOR.sun, 0.95);
    g.strokeRoundedRect(px(b.x - pad), px(b.y - pad - scrollY), px(b.w + pad * 2), px(b.h + pad * 2), px(Math.min(16, (b.h + pad * 2) / 2)));
  }
}

export function focusRing(scene) {
  if (!scene.focusRing || scene.focusRing.scene !== scene || !scene.focusRing.g.active) scene.focusRing = new FocusRing(scene);
  return scene.focusRing;
}
