# Salish Sea Expeditions — agent context

Read first: `.specify/memory/constitution.md` (the principles — teaching real sea kayaking and
beauty are non-negotiable; cultural content follows Principle III). Then the active feature in
`specs/` (spec → plan → research → contracts → tasks).

## Layout

- `src/sim/` pure rules and physics (no Phaser imports) — every change needs a `node:test` test.
- `src/content/` teaching data; every `sourceIds` entry must resolve in `credits.js`
  (`tests/content.test.js` enforces it).
- `src/render/`, `src/audio/`, `src/ui/`, `src/scenes/` — Phaser 4 presentation.

## Commands

`npm test` · `npm run build` · `npm run smoke` (needs a build) · `node tests/smoke/shot.mjs "<Scene>" out.png`
with `npx vite preview --port 4173` running, for a single screenshot.

## Gotchas already paid for

- Phaser **4**, not 3: filters replace FX, `Shader` takes a config object, textures are GL
  orientation (y up). Bundled docs: `node_modules/phaser/docs` and `node_modules/phaser/skills`.
- GLSL ES 1.0: `flat` is a reserved word; shader compile errors only show in the browser console.
- Everything is laid out in points; multiply by `layout.S` (`px()`) for device pixels.
- Headless Chromium renders at ~5 fps and Phaser caps the time step, so timers and fades barely
  advance in smoke tests. Gestures use event timestamps for the same reason.
- The ferry-angle sign once pointed the boat downstream: the partner test now guards it.
- Spec Kit: non-trivial features go specify → plan → tasks → implement; commit the artifacts.
