import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKayak, stepKayak } from '../../src/sim/kayak.js';
import { emptyInput } from '../../src/sim/input.js';
import { createPartner, partnerInput, ferryHeading } from '../../src/sim/partner.js';

test('a ferry angle holds a straight track across a current', () => {
  const current = { x: 0.5, y: 0 }; // 1 kn setting east
  const k = createKayak();
  const p = { energy: 1, fit: 1, skills: {} };
  let side = 'left';
  for (let i = 0; i < 30 * 240; i++) {
    const inp = emptyInput();
    const want = ferryHeading(0, Math.max(0.8, k.speed), current); // track due north
    const err = Math.atan2(Math.sin(want - k.heading), Math.cos(want - k.heading));
    if (i % 22 === 0) {
      inp.stroke = { side: Math.abs(err) > 0.05 ? (err > 0 ? 'left' : 'right') : side, kind: 'forward', reach: 1, smoothness: 1, exitAtHip: true };
      side = side === 'left' ? 'right' : 'left';
    }
    stepKayak(k, inp, { time: i / 30, current, wind: { x: 0, y: 0 }, sea: 0 }, p, 1 / 30);
  }
  assert.ok(k.y > 250, `made progress north: ${k.y}`);
  assert.ok(Math.abs(k.x) < k.y * 0.2, `stayed on track: drift ${k.x} over ${k.y}`);
});

test('the partner keeps station beside a moving player', () => {
  const player = createKayak();
  const me = createKayak({ x: 60, y: -40 });
  const brain = createPartner();
  const p = { energy: 1, fit: 1, skills: {} };
  const env = { time: 0, current: { x: 0.2, y: 0.1 }, wind: { x: 0, y: 0 }, sea: 0 };
  for (let i = 0; i < 30 * 180; i++) {
    player.speed = 1.3; player.heading = 0;
    stepKayak(player, emptyInput(), env, p, 1 / 30);
    const inp = partnerInput(brain, { me, player, current: env.current, playerResting: false, playerCapsized: false }, 1 / 30);
    stepKayak(me, inp, env, p, 1 / 30);
  }
  const d = Math.hypot(me.x - player.x, me.y - player.y);
  assert.ok(d < 45, `partner within hailing distance: ${d}`);
});
