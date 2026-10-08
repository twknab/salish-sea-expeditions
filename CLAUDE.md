# Salish Sea Expeditions — agent context

Read first: `.specify/memory/constitution.md` (the principles — teaching real sea kayaking and
beauty are non-negotiable; cultural content follows Principle III). Then the active feature in
`specs/` (spec → plan → research → contracts → tasks).

## Layout

- `src/sim/` pure rules and physics (no Phaser imports) — every change needs a `node:test` test.
- `src/content/` teaching data; every `sourceIds` entry must resolve in `credits.js`
  (`tests/content.test.js` enforces it).
- `src/render/`, `src/audio/`, `src/ui/`, `src/scenes/` — Phaser 4 presentation.
- `src/render3d/` — three.js models (kayak, Greenland paddle, paddler + stroke, every field-guide species in
  `species3d.js`) photographed once
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
- Screens never pan or clip: content fits, or it is split into zoomed sub-screens (Kayak School).
- Smoke helper: `INIT='{"sse.save.v1":{...}}'` seeds the save before `tests/smoke/shot.mjs` loads.
- Spec Kit: non-trivial features go specify → plan → tasks → implement; commit the artifacts.

## Godot rewrite (branch `experiment/godot-rewrite`)

- `godot/` is a Godot 4.5 project (Compatibility renderer, web export without threads). Pure
  logic lives in `class_name` scripts with static functions (`waves.gd`, `hull.gd`,
  `stroke_math.gd`) so `tests/run_tests.gd` can run them headless; scene scripts stay thin.
- GDScript gotchas paid for: a value pulled out of a Dictionary is a Variant, so `var x := d.key`
  fails to infer — write `var x: float = d.key`. Run `--import` once before tests or export so
  the global class cache knows the `class_name`s.
- The sea shader and `waves.gd` must stay the same formula; the kayak floats on what is drawn.
- Export size is the risk: 38 MB wasm. Measure on a phone before porting anything else
  (`specs/007-godot-rewrite/spec.md`, go/no-go table).
- Content, sounds and the soundtrack are generated: `node tools/export-content.mjs`,
  `node tools/synth-audio.mjs`, `node tools/synth-pieces.mjs` (four MP3 pieces via lamejs); outputs are
  committed under `godot/content` and `godot/audio`. `App` (autoload) owns the scene order; `Sound`
  owns loops, one-shots and the pieces (a mood names a piece; two players crossfade). The four pieces are
  excluded from the web pack and fetched from `audio/` beside the page after the first frame (CI copies
  them there); the editor and headless runs load them from the project. `?scene=ferry` jumps to a screen in the web build.
- `tests/debug_scenes.gd` instantiates every scene headless; run it before an export.
- The figure is `BodyMesh`: arrays built by hand with analytic normals. SurfaceTool will not merge
  vertices that carry bone weights, so its generated normals come out faceted — do not go back to it
  for skinned geometry.
- The islands are data: `tools/geo/build_terrain.py` → `godot/terrain/{height.i16,cover.u8,terrain.json}`,
  read by `terrain.gd` (`class_name Terrain`). Never put an image in `godot/terrain/`: Godot imports it
  as a texture and packs it. The DEM flattens harbours to +1…2 m, so water is decided by cover **and**
  height; the harbour bottom is synthesized by distance from shore until real soundings land.
- `gdlint` runs in CI with `godot/.gdlintrc`; run it from `godot/` (it finds the config from the
  working directory, not from the files).
- Terrain triangles are wound `a → b → c` (x east, z south): counter-clockwise from above. The other
  winding renders at sea level (slopes face the camera) and vanishes from altitude.
- The sea shader is opaque on purpose. Writing `ALPHA`, even `1.0`, moves it to the transparent pass.
- Headless Chromium runs game time ~8× slow (Godot caps a frame's delta at 8 physics ticks); the
  ferry takes `?at=0.3` to open part way, and `WAIT=` on `godot-desktop-shot.mjs` sets the wait.
- The flow is `App.FLOW`: title → acknowledgment → outfit → ferry → assemble → school → pack → plan → trip → camp.
  `?scene=assemble|pack|plan|camp|debrief` open the stations (`&step=N` for the assembly, `&demo=1`
  fills the debrief); `?scene=school&drill=rescue` opens Kayak School on a drill;
  `?scene=trip&near=jones` starts 900 m off the cove (`&leg=1&near=orcas` meets the pod); `?about=1` opens About on the title; `?scene=camp&step=4&glow=1` is the night in the cove (`&pack=none` shows what an empty boat costs);
  `?launch=15` chooses the launch hour (the afternoon southerly on an ebb puts the bail-outs card up);
  `?pack=bow|ideal` packs the boat for a check (everything in the bow, or the suggested layout). The
  expedition is `godot/content/legs.json` (geometry, from `tools/geo/leg_routes.py`) merged with the
  legs in `src/content/expedition.js` (teaching) by `Leg`; `?leg=1` opens day two, `?leg=2` day three.
- `?perf=1` on any screen shows the go/no-go numbers (fps, worst fps, frame time, time to first frame,
  memory, device) at the foot of the screen and prints them once at ten seconds.
- `tests/smoke/godot-stations.mjs` opens every station from its check URL in a fresh page and fails on any
  script error; CI runs it after the export, so a new station belongs in its list with its check URL.
- `run/main_scene` must be `title.tscn`. Smoke scripts that pass `?scene=` never exercise the main
  scene; `tests/smoke/godot-desktop-shot.mjs` loads the bare page and is the check for that.
