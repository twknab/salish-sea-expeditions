# Contract: PaddlerInput

Every seat in a kayak is driven by a controller that returns one `PaddlerInput` per simulation
tick. The simulation never knows whether a human, the computer or (later) a remote player produced
it. This is what lets a human take the partner's seat in a future multiplayer feature (FR-010).

```js
/** @typedef {Object} PaddlerInput
 * @property {null | {side: 'left'|'right', kind: 'forward'|'sweep'|'reverse',
 *                    reach: number,      // 0..1 — how far forward the catch was (rotation)
 *                    smoothness: number, // 0..1 — steady pull vs jab
 *                    exitAtHip: boolean  // stroke ended at the hip, not behind it
 *                   }} stroke   A stroke completed this tick, if any.
 * @property {number} edge       -1..1 — hips input; which knee is lifted, and how far.
 * @property {null | {side: 'left'|'right'}} brace   Blade slapped flat on that side this tick.
 * @property {boolean} hipSnap   The hips returned to centre fast this tick.
 * @property {boolean} headDown  The head stayed low through the snap.
 * @property {number} rocker     0..1 — requested hull-jack setting.
 * @property {boolean} rest      Paddle across the deck, resting.
 */
```

Rules:

- A controller MUST NOT read or write kayak state directly; it only returns intent.
- The same physics (`src/sim/kayak.js`) applies to every seat.
- The AI controller MAY read public world state (positions, current, the other kayak) — the same
  information a human sees on screen.
