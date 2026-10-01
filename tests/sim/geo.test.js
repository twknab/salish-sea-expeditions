import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toLocal, toLatLon, bearing, angleDiff, inside, clock, knots, ms } from '../../src/sim/geo.js';

test('local projection round-trips', () => {
  const p = toLocal(48.6128, -123.0445);
  const b = toLatLon(p.x, p.y);
  assert.ok(Math.abs(b.lat - 48.6128) < 1e-9 && Math.abs(b.lon + 123.0445) < 1e-9);
});

test('Friday Harbor to Jones Island is about 4.5 nm, roughly north-north-west', () => {
  const a = toLocal(48.5385, -123.015), b = toLocal(48.6128, -123.0445);
  const d = Math.hypot(b.x - a.x, b.y - a.y) / 1852;
  assert.ok(d > 4 && d < 5.2, `distance ${d}`);
  const brg = (bearing(a.x, a.y, b.x, b.y) * 180) / Math.PI;
  assert.ok(brg > 320 && brg < 350, `bearing ${brg}`);
});

test('angles and units', () => {
  assert.ok(Math.abs(angleDiff(0.1, Math.PI * 2 - 0.1) - 0.2) < 1e-9);
  assert.equal(clock(485), '08:05');
  assert.ok(Math.abs(knots(ms(3)) - 3) < 1e-9);
  assert.ok(inside([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }], 5, 5));
});
