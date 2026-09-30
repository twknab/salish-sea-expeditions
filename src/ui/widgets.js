// A small, consistent UI kit: glass panels, pill buttons, lesson cards, meters.
import Phaser from 'phaser';
import { COLOR, CSS, layout, px, textStyle } from './theme.js';
import { sound } from '../audio/soundscape.js';
import { creditById } from '../content/credits.js';
import { focusRing } from './focus.js';

export function glass(scene, x, y, w, h, opts = {}) {
  const g = scene.add.graphics();
  g.fillStyle(opts.color ?? COLOR.ink, opts.alpha ?? 0.72);
  g.fillRoundedRect(px(x), px(y), px(w), px(h), px(opts.radius ?? 18));
  g.lineStyle(px(1), 0xffffff, opts.stroke ?? 0.08);
  g.strokeRoundedRect(px(x), px(y), px(w), px(h), px(opts.radius ?? 18));
  return g;
}

export function text(scene, x, y, str, size = 15, opts = {}) {
  const t = scene.add.text(px(x), px(y), str, textStyle(size, opts));
  if (opts.origin) t.setOrigin(...opts.origin);
  return t;
}

/** Pill button. Returns a container with .setEnabled(). */
export function button(scene, x, y, label, onClick, opts = {}) {
  const w = opts.w ?? 220, h = opts.h ?? 50;
  const c = scene.add.container(px(x), px(y));
  const g = scene.add.graphics();
  const primary = opts.primary ?? true;
  const draw = (pressed, enabled = true) => {
    g.clear();
    const fill = primary ? COLOR.foam : COLOR.ink;
    g.fillStyle(fill, enabled ? (pressed ? 0.78 : primary ? 0.94 : 0.55) : 0.25);
    g.fillRoundedRect(px(-w / 2), px(-h / 2), px(w), px(h), px(h / 2));
    if (!primary) { g.lineStyle(px(1), 0xffffff, 0.35); g.strokeRoundedRect(px(-w / 2), px(-h / 2), px(w), px(h), px(h / 2)); }
  };
  draw(false);
  const t = scene.add.text(0, 0, label, textStyle(opts.size ?? 16, { color: primary ? CSS.ink : CSS.foam, weight: '600' })).setOrigin(0.5);
  c.add([g, t]);
  c.setSize(px(w), px(h));
  c.setInteractive({ useHandCursor: true });
  let enabled = true;
  c.on('pointerdown', () => { if (enabled) { draw(true); c.setScale(0.97); } });
  c.on('pointerout', () => { draw(false, enabled); c.setScale(1); });
  c.on('pointerup', () => {
    draw(false, enabled); c.setScale(1);
    if (!enabled) return;
    sound.ui('tap');
    onClick?.();
  });
  c.setEnabled = (v) => { enabled = v; draw(false, v); t.setAlpha(v ? 1 : 0.5); return c; };
  c.label = t;
  // Keyboard: focusable with Tab / arrows, pressed with Enter or Space.
  focusRing(scene).add({
    alive: () => c.active && c.visible && enabled && c.alpha > 0.05,
    bounds: () => ({ x: c.x / layout.S - w / 2, y: c.y / layout.S - h / 2, w, h }),
    scroll: c.scrollFactorY !== 0,
    activate: () => { sound.ui('tap'); onClick?.(); },
  });
  return c;
}

/** A lesson card: title, one or two sentences, and the sources in small type. */
export function lessonCard(scene, lesson, opts = {}) {
  const W = layout.W, margin = 16;
  const w = W - margin * 2;
  const c = scene.add.container(0, 0).setDepth(opts.depth ?? 50);
  const title = text(scene, margin + 18, 0, lesson.title, 17, { serif: true, weight: '600', color: CSS.sun, wrap: w - 36 });
  const body = text(scene, margin + 18, 0, lesson.text, 14.5, { wrap: w - 36, color: CSS.foam, lineSpacing: 5 });
  const srcNames = (lesson.sourceIds ?? []).map((id) => creditById[id]?.author).filter(Boolean);
  const src = srcNames.length ? text(scene, margin + 18, 0, `Source: ${[...new Set(srcNames)].join(' · ')}`, 10.5, { color: CSS.mist, wrap: w - 36 }) : null;
  const pad = 16;
  const th = title.height / layout.S, bh = body.height / layout.S, sh = src ? src.height / layout.S + 8 : 0;
  const h = pad + th + 6 + bh + (src ? 8 + sh : 0) + pad + (opts.action ? 50 : 0);
  const y0 = opts.y ?? layout.safe.top + 70;
  const bg = glass(scene, margin, 0, w, h, { alpha: 0.86, radius: 20 });
  title.y = px(pad); body.y = px(pad + th + 6); if (src) src.y = px(pad + th + 6 + bh + 8);
  c.add([bg, title, body, ...(src ? [src] : [])]);
  if (opts.action) {
    const b = button(scene, W / 2, h - pad - 20, opts.action, () => opts.onAction?.(), { w: 160, h: 40, size: 15 });
    c.add(b);
  }
  c.y = px(y0);
  c.height = h;
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, y: px(y0) - px(0), duration: 380, ease: 'Sine.easeOut' });
  c.dismiss = () => scene.tweens.add({ targets: c, alpha: 0, duration: 260, onComplete: () => c.destroy() });
  if (opts.autoHide) scene.time.delayedCall(opts.autoHide, () => c.active && c.dismiss());
  return c;
}

/** Horizontal meter. */
export function meter(scene, x, y, w, h, color) {
  const g = scene.add.graphics();
  g.set = (v) => {
    g.clear();
    g.fillStyle(0xffffff, 0.14);
    g.fillRoundedRect(px(x), px(y), px(w), px(h), px(h / 2));
    g.fillStyle(typeof color === 'function' ? color(v) : color, 0.95);
    g.fillRoundedRect(px(x), px(y), px(Math.max(h, w * Phaser.Math.Clamp(v, 0, 1))), px(h), px(h / 2));
  };
  g.set(1);
  return g;
}

/** A small round icon button (e.g. pause, zoom). */
export function iconButton(scene, x, y, glyph, onClick, size = 40) {
  const c = scene.add.container(px(x), px(y));
  const g = scene.add.graphics();
  g.fillStyle(COLOR.ink, 0.6);
  g.fillCircle(0, 0, px(size / 2));
  g.lineStyle(px(1), 0xffffff, 0.2);
  g.strokeCircle(0, 0, px(size / 2));
  const t = scene.add.text(0, 0, glyph, textStyle(size * 0.42, { color: CSS.foam, weight: '600' })).setOrigin(0.5);
  c.add([g, t]).setSize(px(size), px(size)).setInteractive({ useHandCursor: true });
  c.on('pointerup', () => { sound.ui('tap'); onClick(); });
  c.label = t;
  focusRing(scene).add({
    alive: () => c.active && c.visible,
    bounds: () => ({ x: c.x / layout.S - size / 2, y: c.y / layout.S - size / 2, w: size, h: size }),
    activate: () => { sound.ui('tap'); onClick(); },
  });
  return c;
}

export function fadeIn(scene) {
  scene.cameras.main.fadeIn(520, 11, 43, 51);
}
