// The living sea behind menu screens: the world shader drifting slowly, dimmed for legibility.
import { WorldView } from '../render/world.js';
import { toLocal } from '../sim/geo.js';
import { wind } from '../sim/wind.js';
import { sound } from '../audio/soundscape.js';
import { layout, px } from './theme.js';

export function backdrop(scene, { lat = 48.575, lon = -123.03, viewW = 1400, minute = 1150, dim = 0.55, drift = 4, fog = 0, glow = 0 } = {}) {
  const world = new WorldView(scene, { viewW });
  const p = toLocal(lat, lon);
  world.cam.x = p.x; world.cam.y = p.y;
  const shade = scene.add.graphics().setScrollFactor(0).setDepth(1);
  shade.fillStyle(0x0b2b33, dim);
  shade.fillRect(0, 0, px(layout.W), px(layout.H));
  let t = 0;
  const b = { world, minute, fog, glow, sea: 0.25, drift };
  scene.events.on('update', (_time, dms) => {
    const dt = dms / 1000;
    t += dt;
    sound.update(dt);
    world.cam.x = p.x + Math.sin(t * 0.03) * 120;
    world.cam.y = p.y + t * b.drift;
    world.setConditions({ minute: b.minute, wind: wind(b.minute), current: { x: -0.15, y: 0.35 }, sea: b.sea, boat: world.cam, time: t, fog: b.fog, glow: b.glow, ripStrength: [0.4, 0.2] });
  });
  return b;
}

/** Make a scene's content scroll vertically by dragging, below a fixed header of `headerH` points. */
export function scrollable(scene, contentHeight, headerH = 0) {
  const cam = scene.cameras.main;
  const max = Math.max(0, px(contentHeight - layout.H + headerH * 0));
  let start = null, from = 0;
  scene.input.on('pointerdown', (p) => { start = p.y; from = cam.scrollY; });
  scene.input.on('pointermove', (p) => {
    if (start == null || !p.isDown) return;
    cam.scrollY = Math.min(max, Math.max(0, from - (p.y - start)));
  });
  scene.input.on('pointerup', () => { start = null; });
  scene.input.on('wheel', (_p, _o, _dx, dy) => { cam.scrollY = Math.min(max, Math.max(0, cam.scrollY + dy)); });
}
