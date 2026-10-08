# Feature Specification: Godot Rewrite (experiment)

**Feature Branch**: `experiment/godot-rewrite`

**Created**: 2026-10-06

**Status**: Experiment — thirty-three slices merged (see "What exists today" below and
tasks.md); go/no-go pending the mobile Safari measurement from the Cloud Run URL (see research.md
and the table at the end)

**Input**: "Let's rethink the game entirely. Swap to Godot and make this as realistic as possible."

**Constitution principles served** (v1.1.0): V (beauty — a real 3D sea with lit water and a boat
that sits on it), VII (mobile-first and smooth — the whole point of the measurement), I and VI
(the stroke and edging rules carry over unchanged). II, III, IV, VIII are untouched by the engine
change and will port their content data as-is.

## What exists today

The Godot build on `main` is a complete three-day expedition, not a tech demo:

- **The opening**: title, land acknowledgment and safety note, outfitting (six paddler presets or
  a custom look, kit, skins), the ferry from Anacortes as a chart flyover over the real route with
  a rail view, the boat assembled on the beach (the frame into the skin, the jacks tensioned by
  hand, and the hull only as good as its tension), Kayak School (boat, body and paddle, then six
  drills, the last of them the solo rescue), and packing the boat on the
  float: heavy low and central, the essentials or you go without, and the trim you chose is the
  boat you paddle.
- **Three days on real water**: Friday Harbor to Jones Island, Jones through Spieden Channel to
  Posey Island, and home on the ebb to the town float. The islands are real elevation and land
  cover (`tools/geo/build_terrain.py`), the legs are laid over the water by the same router as the
  ferry's track (`tools/geo/leg_routes.py` → `godot/content/legs.json`), and the teaching per leg
  lives in `src/content/expedition.js`.
- **Before each launch**, a float plan on the chart with the day's water as a graph: choose the
  launch, read the verdict (mean stream over the leg, chop, wind against tide), see the chart's
  light follow the hour.
- **On the water**: hold-to-paddle with lean, reverse, brace and edge; the dome compass; a chart
  tile of the real islands; the tide carrying the boat and the wind pushing it; rips off the points; the bail-outs offered when the wind is up; the sea state of the
  hour; a partner holding station; the ferry working the channel with a card, a horn and a wake;
  wildlife as its own models with field-guide sightings, a pod of killer whales in Spieden Channel among them, and seals that flush if you come too close; a capsize with secondary stability and
  the rescue taught in the water.
- **Ashore**: camp on Jones and Posey with the shore walk at low tide, the stars and the
  bioluminescence of the cove at night, the take-out at Friday
  Harbor with the tally, then the debrief: each day as it went, the score by the Phaser rules,
  the drills and the species; the field guide and every source a button away from the title.
- **Pause**: Escape, P, a chip, or the page going into a pocket holds the boat and the clock
  under a card; About carries the acknowledgment and the safety note at all times.
- **Sound**: four full-length pieces fetched beside the page after the first frame, the sea and
  the strokes synthesized; sound and music switches on every screen.
- **Delivery**: the export is served precompressed with ETags (about 13 MB on the wire for the
  first frame against 45 MB raw), the Docker image and Terraform are framed behind a repository
  variable, and a private demo page tracks `main`.

## What changes, and what does not

The Phaser game on `main` stays the shipped game until the Godot version is better on a phone,
not merely newer. The rewrite keeps:

- Every teaching rule (torso rotation grading, edging, sweep-on-edge, rocker, buoyancy and trim,
  the 1-10-1 rule, Be Whale Wise distances) — the sim rules in `src/sim` are the spec, and the
  tests there are ported first.
- Every piece of content: credits and sources, kit, anatomy, species, places, lessons, the
  acknowledgment. Content is data and moves engine to engine.
- The TRAK-inspired folding kayak as the only boat, by the same hull lines.
- The touch vocabulary players already learned: blade zones, hip line, hips bar.

It replaces the presentation: a true 3D world instead of baked sprites on a 2D canvas.

## User Scenarios & Testing

### User Story 1 — On the water, for real (Priority: P1, this slice)

A player opens the game on a phone and is on the water at Friday Harbor in a kayak that floats:
it rides the swell, heels when they edge, turns when they sweep, and runs straight and fast when
they paddle with rotation. The water is lit by the sun, reflects the sky, shows wind ripple and
crests, and warms toward sand near the shore. An island with a conifer forest sits across the
bay.

**Independent test**: the web export loads on a phone, holds a smooth frame rate, and three
rotation strokes move the boat visibly faster than three arm strokes.

**Acceptance scenarios**:

1. **Given** the scene has loaded, **When** no input is given, **Then** the kayak floats level on
   the waves and does not drift off or sink.
2. **Given** a swipe from the top of a blade zone to the hip line, **When** it ends, **Then** the
   paddler strokes on that side, the boat accelerates and yaws slightly away from the blade.
3. **Given** the hips bar is dragged, **When** held, **Then** the boat heels toward that side and
   recovers when released.
4. **Given** a sweep while edged toward the blade, **When** compared with a flat sweep, **Then**
   the boat turns more.

### User Story 2 — Everything the Phaser game teaches (Priority: P2, later)

Kayak School, outfitting, planning, the crossing with partner, wildlife, rescue, camp, tide pools,
debrief, field guide, Help, About. Each ports scene by scene behind the same acceptance criteria
as specs 001–006, reading the same content modules.

## Requirements

- **FR-001** Web export MUST run on iPhone Safari without cross-origin isolation (no threads).
- **FR-002** Buoyancy MUST sample the same wave function the shader draws.
- **FR-003** Stroke grading MUST match `src/sim/input.js` (ported with tests).
- **FR-004** The hull MUST be the same lines as `src/render3d/kayak.js` (ported with tests).
- **FR-005** Unit tests run headless in CI; the web export is produced and smoked in CI.
- **FR-006** No TRAK name or logo in the art or the UI.

## Go / no-go for the rewrite

Measured on the owner's iPhone from the Cloud Run URL of the experiment build. The image serves the
export precompressed (brotli: engine 6.5 MB, pack 5.9 MB, about 13 MB in all against 45 MB raw) with
ETags, so the first-frame row is measured on that, and a second visit revalidates rather than downloads.

| Measure                          | Go                    | No-go                       |
| -------------------------------- | --------------------- | --------------------------- |
| Time to first frame on cellular  | under 8 s             | over 15 s                   |
| Frame rate in the sea scene      | 50+ fps steady        | under 30 fps or thermal dip |
| Memory (Safari tab survives)     | no reloads in 10 min  | tab reloads                 |
| Touch strokes land as intended   | 9 of 10               | fewer                       |

If no-go, the lessons (true 3D water, buoyancy, procedural paddler) are ported back into the
three.js studio on `main`, which already renders real 3D.
