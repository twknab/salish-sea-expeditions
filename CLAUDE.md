# Salish Sea Expeditions — agent context

Read first: `.specify/memory/constitution.md` (the principles — teaching real sea kayaking and
beauty are non-negotiable; cultural content follows Principle III). Then the active feature in
`specs/` (spec → plan → research → contracts → tasks).

## Layout

- `src/sim/` pure rules and physics (no Phaser imports) — every change needs a `node:test` test.
- `src/content/` teaching data; every `sourceIds` entry must resolve in `credits.js`
  (`tests/content.test.js` enforces it).
- `src/render/`, `src/audio/`, `src/ui/`, `src/scenes/` — Phaser 4 presentation.
- `src/render3d/` — three.js models (kayak, paddler + stroke, orca, seals, ferry) photographed once
  into Phaser textures (`bake.js`); `keys.js` is three-free so scenes can use the names without
  loading the 3D chunk. Look at models with `npx vite` → `/tools/art-preview.html`, or
  `node tests/smoke/art.mjs out.png [only=top|side|paddler|wild]`.

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
- Phaser 4 multi-texture batching dropped one triangle of a quad when many canvas textures were on
  screen (a sprite with a straight-edged bite out of it): `render.maxTextures: 1` in `main.js`.
- three.js colours: vertex colours are linear (convert from sRGB), CanvasTextures are flipped (v = 1
  is the top of the canvas), and transparent materials draw after opaque ones — the water plane
  that hides what is below the surface is a separate depth-only mesh drawn first.
- Spec Kit: non-trivial features go specify → plan → tasks → implement; commit the artifacts.
