# Feature Specification: Lifelike art — crisp, lit, real

**Feature Branch**: `claude/game-concept-discussion-uuwa07`

**Created**: 2026-10-01

**Status**: In progress

**Input**: "Step up the drawings all together. They all need to be crisper, more realistic and
better. Deep dive; use any mainstream library that will help."

**Constitution principles served** (v1.1.0): V (beauty and elegance), I (the boat, body and paddle
shown truthfully — hull shape, posture, the stroke), VII (smooth on a phone), VIII (drawn by us).

## Diagnosis (what was wrong)

1. **Flat vector clip-art.** Hand-written SVG shapes with gradients have no light, no material and
   no form; at a glance they read as icons, not boats and animals.
2. **Soft and shimmering in motion.** Sprites were rasterised once at a fixed size and scaled on
   screen without mipmaps: blurry when enlarged, shimmering when shrunk and rotated.
3. **One thing drawn several ways.** The same kayak existed as a side SVG, a top SVG, a cutaway
   SVG and procedural shapes — each a separate approximation that drifts from the others.

## Decision

Model the subjects once in 3D with **three.js** (MIT; the mainstream WebGL library) and render
them in the browser at load — physically based materials, a sun, sky light and soft shadows —
into sprite sheets at device resolution, on power-of-two canvases, with mipmapped filtering in
Phaser. One model per subject feeds every view (top-down, side, close-up).

Considered and rejected:
- **Photographs**: no licensed set reachable from the build; Principle VIII forbids unlicensed.
- **More SVG detail**: does not fix light and form; cost grows without the result.
- **Running three.js live per frame alongside Phaser**: two WebGL contexts each frame on a phone;
  pre-rendered sheets give the same look at a fraction of the cost.
- **A heavier engine (Babylon.js)**: capable, but larger; three.js is enough for offline renders.

## User Stories

- **US1 (P1)** The kayaks on the water are lit 3D boats in the chosen skin, with a paddler whose
  torso rotates and whose blades enter and leave the water through a smooth 24-frame stroke.
- **US2 (P1)** Orcas, harbour seals on their rock, and the ferry are lit 3D models.
- **US3 (P1)** Boat School's kayak side view is rendered from the same model, with the frame
  visible through a translucent skin, and the part hotspots projected from the model.
- **US4 (P2)** Everything is crisp at any zoom: mipmaps, device-resolution rasters.

## Requirements

- **FR-001** `src/render3d/` holds the studio (renderer, lights, capture) and one module per model.
- **FR-002** Renders happen once per session per skin/size and are cached as Phaser textures.
- **FR-003** If WebGL for the studio is unavailable, the existing SVG sprites remain the fallback.
- **FR-004** Smoke test covers every scene; a render test checks every model builds finite geometry.
