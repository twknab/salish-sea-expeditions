// Pause at a moment's notice. Every gameplay scene gets a pause button (top right), the P key and
// Escape; the game also pauses itself — and saves — the moment the page is hidden, so a phone can
// go straight back into a pocket. The menu is its own scene (scenes/Pause.js) over the paused one.
import { iconButton } from './widgets.js';
import { COLOR, layout, px } from './theme.js';
import { persist } from '../state.js';

/** Give a scene a pause button. `at` overrides the position (points). Returns the button. */
export function pauseButton(scene, at = {}) {
  scene.pausable = true;
  const b = iconButton(scene, at.x ?? layout.W - 30, at.y ?? layout.safe.top + 24, '', () => openPause(scene), 38);
  b.setScrollFactor(0).setDepth(at.depth ?? 95);
  // Two bars, drawn rather than typed: a pause glyph is not in every phone's fonts.
  const bars = scene.add.graphics();
  bars.fillStyle(COLOR.foam, 1);
  bars.fillRoundedRect(px(-6), px(-7), px(4), px(14), px(1.5));
  bars.fillRoundedRect(px(2), px(-7), px(4), px(14), px(1.5));
  b.add(bars);
  scene.onBack = () => openPause(scene);
  const kb = scene.input.keyboard;
  const onKey = (e) => { if ((e.key === 'p' || e.key === 'P') && !e.repeat) openPause(scene); };
  kb?.on('keydown', onKey);
  scene.events.once('shutdown', () => kb?.off('keydown', onKey));
  return b;
}

/** Save what the scene knows, then pause it under the menu. */
export function openPause(scene) {
  const sp = scene.scene;
  if (!sp.isActive() || sp.isActive('Pause')) return;
  scene.saveProgress?.();
  persist();
  sp.pause();
  sp.launch('Pause', { from: sp.key });
  sp.bringToTop('Pause');
}

/** Pause whichever gameplay scene is running (used when the page is hidden). */
export function pauseRunning(game) {
  persist();
  if (game.scene.isActive('Pause')) return;
  const running = game.scene.getScenes(true).filter((s) => s.pausable);
  const top = running.at(-1);
  if (top) openPause(top);
  else for (const s of game.scene.getScenes(true)) s.saveProgress?.();
}
