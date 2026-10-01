import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FERRY_ROUTE, ORCA_ROUTE, ISLANDS } from '../../src/content/chart.js';
import { clearance, createMover, stepMover, pathLength } from '../../src/sim/route.js';
import { onLand, shoreDistance } from '../../src/sim/field.js';
import { avoidLand } from '../../src/sim/partner.js';
import { createOrcaPass, stepOrcaPass } from '../../src/sim/wildlife.js';
import { toLocal } from '../../src/sim/geo.js';

// The drawn shoreline is roughened up to ~80 m from the chart line, and a ferry is ~110 m long.
test('the ferry route never crosses land, with room to spare', () => {
  assert.ok(clearance(FERRY_ROUTE, { endSkip: 120 }) > 150);
});

test('the ferry passes on the inside (north-west) of Brown Island', () => {
  const brown = ISLANDS.find((i) => i.id === 'brown');
  const top = Math.max(...brown.poly.map((p) => p.y));
  const west = Math.min(...brown.poly.map((p) => p.x));
  const east = Math.max(...brown.poly.map((p) => p.x));
  const m = createMover(FERRY_ROUTE, 7);
  let passedNorth = false;
  while (!m.done) {
    stepMover(m, 1);
    if (m.x > west && m.x < east) assert.ok(m.y > top, 'abeam of Brown Island, the ferry is north of it');
    if (m.x > west && m.x < east) passedNorth = true;
  }
  assert.ok(passedNorth);
});

test('the orca route stays mid-channel', () => {
  assert.ok(clearance(ORCA_ROUTE) > 250);
});

test('an orca pod never swims over land', () => {
  const player = { ...toLocal(48.567, -123.022), vx: 0, vy: 0 };
  const pod = createOrcaPass(player, 0);
  for (let i = 0; i < 4000 && pod.state !== 'gone'; i++) {
    stepOrcaPass(pod, player, 1);
    for (const m of pod.members) assert.ok(!onLand(pod.x + m.dx, pod.y + m.dy), `on land at step ${i}`);
  }
  assert.equal(pod.state, 'gone');
});

test('steering toward a shore turns away from it', () => {
  // Just off Friday Harbor, heading straight at Brown Island.
  const brown = ISLANDS.find((i) => i.id === 'brown');
  const cx = brown.poly.reduce((s, p) => s + p.x, 0) / brown.poly.length;
  const cy = brown.poly.reduce((s, p) => s + p.y, 0) / brown.poly.length;
  const west = Math.min(...brown.poly.map((p) => p.x));
  const x = west - 70, y = cy;
  const toward = Math.atan2(cx - x, cy - y);
  const t = avoidLand(x, y, toward);
  const ahead = { x: x + Math.sin(t) * 60, y: y + Math.cos(t) * 60 };
  assert.ok(shoreDistance(x, y) > 0, 'starts on the water');
  assert.ok(shoreDistance(ahead.x, ahead.y) > 0, 'the new track is on the water');
  assert.notEqual(t, toward);
});
