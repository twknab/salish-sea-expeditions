// Dev page: photographs every 3D model and shows the results. npx vite, then /tools/art-preview.html
import { capture } from '../src/render3d/studio.js';
import { buildKayak, KAYAK } from '../src/render3d/kayak.js';
import { SKINS } from '../src/content/skins.js';

const out = document.getElementById('out');
const show = (c, label, cssW) => {
  const f = document.createElement('figure');
  c.style.width = `${cssW ?? c.width / 2}px`;
  f.append(c, Object.assign(document.createElement('figcaption'), { textContent: label }));
  out.append(f);
};
window.renders = {};
const only = new URLSearchParams(location.search).get('only') ?? '';
if (!only || only.includes('top')) for (const sk of SKINS) {
  const { group } = buildKayak(sk);
  show(capture(group, { w: 128, h: 1024, spanX: KAYAK.L + 0.2, spanZ: (KAYAK.L + 0.2) / 8 }), sk.id, 64);
}
if (!only || only.includes('side')) {
  const { group } = buildKayak(SKINS[0], { ghost: true });
  show(capture(group, { w: 2048, h: 256, spanX: KAYAK.L + 0.2, spanZ: (KAYAK.L + 0.2) / 8, cz: 0.05, view: 'side', water: false }), 'side ghost', 1000);
  const k2 = buildKayak(SKINS[3]);
  show(capture(k2.group, { w: 2048, h: 256, spanX: KAYAK.L + 0.2, spanZ: (KAYAK.L + 0.2) / 8, cz: 0.05, view: 'side', water: false }), 'side', 1000);
}

// Paddler frames composited over the boat, in metres, exactly as WorldView will stack them.
import { buildPaddler, deckShadowCatcher } from '../src/render3d/paddler.js';
import { Group } from 'three';
if (!only || only.includes('paddler')) {
  const BOAT = { spanX: KAYAK.L + 0.2, spanZ: 1.27, w: 256, h: 1024 };
  const PAD = { spanX: 2.0, spanZ: 2.8, w: 512, h: 512, cx: 0.15 };
  const boat = capture(buildKayak(SKINS[0]).group, BOAT);
  const scale = 0.3; // css px per canvas px of the boat
  const ppm = (BOAT.h * scale) / BOAT.spanX;
  for (const ph of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.65, 'rest']) {
    const grp = new Group();
    grp.add(buildPaddler(ph === 'rest' ? { rest: true } : { phase: ph }));
    grp.add(deckShadowCatcher());
    const pc = capture(grp, PAD);
    const box = document.createElement('div');
    box.style.cssText = `position:relative;width:${PAD.spanZ * ppm}px;height:${BOAT.h * scale}px`;
    const b = boat.cloneNode(); b.getContext('2d').drawImage(boat, 0, 0);
    b.style.cssText = `position:absolute;left:${(PAD.spanZ * ppm - BOAT.spanZ * ppm) / 2}px;top:0;width:${BOAT.spanZ * ppm}px;height:${BOAT.h * scale}px`;
    // Paddler centre sits PAD.cx metres forward of the cockpit; the boat image centre is the cockpit.
    const top = (BOAT.h * scale) / 2 - PAD.cx * ppm - (PAD.spanX * ppm) / 2;
    pc.style.cssText = `position:absolute;left:0;top:${top}px;width:${PAD.spanZ * ppm}px;height:${PAD.spanX * ppm}px`;
    box.append(b, pc);
    const f = document.createElement('figure');
    f.append(box, Object.assign(document.createElement('figcaption'), { textContent: String(ph) }));
    out.append(f);
  }
}

import { buildOrca, buildSeal, buildRock, SEAL_SPOTS, buildFerry } from '../src/render3d/wildlife.js';
if (!only || only.includes('wild')) {
  for (const bull of [true, false]) for (const dy of [-1.2, -0.45, -0.15, 0.1]) {
    const o = buildOrca({ bull });
    o.position.y = dy * o.userData.girth;
    show(capture(o, { w: 128, h: 512, spanX: 8.4, spanZ: 2.1, tilt: 0.35, water: dy > -1 }), `orca ${bull ? 'bull' : 'cow'} ${dy}`, 64);
  }
  const reef = new Group();
  reef.add(buildRock());
  SEAL_SPOTS.forEach(([x, y, z, h], i) => { const s = buildSeal({ tone: i, seed: i * 7 }); s.position.set(x, y, z); s.rotation.y = h; reef.add(s); });
  show(capture(reef, { w: 512, h: 512, spanX: 16, spanZ: 16 }), 'seals on the reef', 256);
  const s1 = buildSeal({ tone: 1 });
  show(capture(s1, { w: 128, h: 256, spanX: 2, spanZ: 1, water: false }), 'seal', 64);
  show(capture(buildFerry(), { w: 128, h: 512, spanX: 120, spanZ: 30 }), 'ferry', 64);
}
window.done = true;
