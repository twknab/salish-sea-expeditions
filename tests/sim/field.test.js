import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTE, PLACES, ISLANDS, KELP } from '../../src/content/chart.js';
import { onLand, currentAt, shoreDistance } from '../../src/sim/field.js';

test('every route waypoint is on the water', () => {
  for (const p of ROUTE) assert.equal(onLand(p.x, p.y), false, JSON.stringify(p));
});

test('the landing is close to Jones Island', () => {
  const d = shoreDistance(PLACES.destination.x, PLACES.destination.y);
  assert.ok(d > 0 && d < 150, `landing ${d} m from shore`);
});

test('island centres are on land', () => {
  for (const is of ISLANDS) {
    const cx = is.poly.reduce((s, p) => s + p.x, 0) / is.poly.length;
    const cy = is.poly.reduce((s, p) => s + p.y, 0) / is.poly.length;
    assert.ok(onLand(cx, cy), is.name);
  }
});

test('mid-channel current is stronger than current in kelp', () => {
  const t = 610; // max flood
  const mid = currentAt(t, ROUTE[3].x + 600, ROUTE[3].y);
  const kelp = currentAt(t, KELP[0].x, KELP[0].y);
  assert.ok(Math.abs(mid.kn) > Math.abs(kelp.kn) * 2, `${mid.kn} vs ${kelp.kn}`);
});
