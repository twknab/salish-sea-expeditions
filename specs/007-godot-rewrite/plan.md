# Implementation Plan: Godot Rewrite

## Layout

```
godot/                 the Godot 4.5 project (opens in the editor; runs headless in CI)
  project.godot        portrait 390×844, Compatibility renderer, touch emulation
  export_presets.cfg   Web preset, no threads, exports to ../build/web
  scenes/sea.tscn      the sea scene: water, island, kayak, camera rig, UI
  shaders/             sea.gdshader (Gerstner + ripple + Fresnel + foam), land.gdshader
  scripts/             waves.gd (CPU twin of the shader), hull.gd (ported lines),
                       stroke_math.gd (ported grading), kayak.gd (buoyancy + strokes),
                       paddler.gd (procedural figure), controls.gd (touch vocabulary),
                       camera_rig.gd, island.gd, sea.gd
  tests/run_tests.gd   headless unit tests
build/web/             export output (ignored)
tests/smoke/godot-shot.mjs   Playwright smoke of the export
.github/workflows/godot.yml  tests → export → smoke, on this branch
```

## Phases

1. **Slice 1 (this branch, done)**: the sea, a floating kayak, strokes, edging, sweeps, a paddler,
   an island, touch and keys, tests, export, smoke, CI.
2. **Measure on a phone** (owner): the go/no-go table in spec.md. Deploy the export with the
   existing server and Dockerfile (a second Cloud Run service, `salish-sea-godot`).
3. **Port the sim with its tests**: tides, currents, wind, ferry angle, energy, stability and
   capsize, rescue, packing and trim — one GDScript per JS module, tests first.
4. **Port content as data**: a script that emits JSON from `src/content/*.js`, loaded by Godot.
5. **Scenes**: Kayak School, outfitting, planning, crossing with partner, wildlife, camp, tide
   pools, debrief, field guide, Help, About — in the order spec 001 lists them.
6. **Real terrain**: the San Juan shoreline from chart data instead of a noise island.
7. **Audio**: soundscape first (water, strokes, wind, birds), then the soundtrack.

## Running it

```bash
# editor
godot --path godot
# tests
godot --headless --path godot -s res://tests/run_tests.gd
# export + smoke
godot --headless --path godot --export-release Web ../build/web/index.html
node tests/smoke/godot-shot.mjs
# serve the export locally
STATIC_DIR=build/web node server/server.mjs
```
