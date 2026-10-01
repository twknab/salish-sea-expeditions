// The 3D models and the stroke: every model builds finite geometry, and the stroke is physical.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hullGeometries, halfBeam, heights, KAYAK } from '../src/render3d/kayak.js';
import { strokePose, restPose, shoulders, elbow, paddleLine, BODY } from '../src/render3d/stroke.js';
import { loft } from '../src/render3d/wildlife.js';

const finite = (g) => {
  const a = g.attributes.position.array;
  for (const v of a) assert.ok(Number.isFinite(v), 'non-finite vertex');
  return a.length;
};

test('the hull lofts to finite geometry, closes to stems at both ends, and keeps its true beam', () => {
  const h = hullGeometries();
  for (const panel of ['bottom', 'side', 'deck']) for (const g of h[panel]) assert.ok(finite(g) > 100);
  assert.ok(halfBeam(0) < 1e-6 && halfBeam(1) < 1e-6, 'ends close');
  const widest = Math.max(...Array.from({ length: 101 }, (_, i) => halfBeam(i / 100)));
  assert.ok(Math.abs(widest * 2 - KAYAK.B) < 0.03, `beam ${widest * 2}`);
  for (let i = 0; i <= 50; i++) {
    const t = heights(i / 50);
    assert.ok(t.keel <= t.chine + 1e-9 && t.chine <= t.sheer && t.sheer <= t.ridge + 1e-9, `section order at ${i / 50}`);
  }
});

test('the stroke: hands stay within reach, the blade enters on the stroke side, and the torso winds up', () => {
  const reach = BODY.upperArm + BODY.forearm;
  for (let i = 0; i < 64; i++) {
    const p = strokePose(i / 64), sh = shoulders(p.twist);
    for (const [S, H] of [[sh.R, p.R], [sh.L, p.L]]) assert.ok(Math.hypot(H[0] - S[0], H[1] - S[1], H[2] - S[2]) < reach + 0.05, `reach at ${i}`);
    const E = elbow(sh.R, p.R, 1);
    assert.ok(E.every(Number.isFinite));
  }
  // Starboard catch: starboard shoulder forward, starboard blade low and out to starboard.
  const catchR = strokePose(0.1), pl = paddleLine(catchR.R, catchR.L);
  assert.ok(catchR.twist > 0.2, 'wound up to starboard');
  assert.equal(catchR.wet, 1);
  assert.ok(pl.tipR[1] < 0 && pl.tipR[2] > 0.4, 'starboard blade in the water beside the boat');
  // Port side mirrors it.
  const catchL = strokePose(0.6), pr = paddleLine(catchL.R, catchL.L);
  assert.ok(catchL.twist < -0.2 && catchL.wet === -1 && pr.tipL[1] < 0 && pr.tipL[2] < -0.4);
  // Resting: the paddle lies across the deck, out of the water.
  const r = paddleLine(restPose().R, restPose().L);
  assert.ok(r.tipR[1] > 0 && r.tipL[1] > 0);
});

test('lofted bodies have colours and finite vertices', () => {
  const g = loft(2, () => ({ w: 0.2, h: 0.1, y: 0 }), () => [0.5, 0.5, 0.5], 10, 8);
  finite(g);
  assert.equal(g.attributes.color.count, g.attributes.position.count);
});
