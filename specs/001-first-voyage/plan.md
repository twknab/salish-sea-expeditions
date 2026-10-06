# Implementation Plan: First Voyage

**Branch**: `claude/game-concept-discussion-uuwa07` | **Date**: 2026-09-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-first-voyage/spec.md`

## Summary

Build the first playable slice of Salish Sea Expeditions as a portrait, touch-first web game:
Kayak School on the beach at Friday Harbor (kayak anatomy, hip connection, edging, hip snap,
torso-driven strokes), assembly and packing of the folding kayak, planning a launch from a tide and
current table, a top-down paddle up San Juan Channel to Jones Island with a computer partner,
wildlife under Be Whale Wise rules, a capsize with three rescues, a cockpit point-of-view moment,
camp and tide pools, and a debrief with skills, field guide and share card.

Technical approach: Phaser 4 scenes for flow and UI; all rules and physics in pure, unit-tested
simulation modules; the world drawn by one full-screen water-and-land shader over a land-mask
texture; a synthesised Web Audio soundscape; content (lessons, species, anatomy, credits) as
reviewable data.

## Technical Context

**Language/Version**: JavaScript (ES2022 modules), GLSL ES 1.0 shaders; Node 22 for tooling

**Primary Dependencies**: Phaser 4.2 (rendering, scenes, input, filters); Vite (build)

**Storage**: Browser `localStorage` (save); no server state in this slice

**Testing**: `node:test` for simulation and content; Playwright (pre-installed Chromium) smoke
test at iPhone viewport with screenshots and a frame-rate sample

**Target Platform**: iPhone Safari (iOS 17+) first; desktop Chrome/Safari/Firefox supported

**Project Type**: Single-page web game (static build served by a small Node server later)

**Performance Goals**: 60 fps on a recent iPhone while paddling; never below 30 fps on a
three-year-old iPhone; initial download under 3 MB gzipped

**Constraints**: Portrait; safe areas; offline once loaded; no secrets; audio starts only on a user
gesture; all information carried by sound also shown visually

**Scale/Scope**: About 14 scenes, 12+ species, about 25 lessons, one route of about 5 nm

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan satisfies it | Status |
| --- | --- | --- |
| I. Teach real sea kayaking | Kayak School first; controls map to technique (R7); lessons are data with sources; seamanship changes outcomes (launch window, ferry angle, brace) | Pass |
| II. Teach the whole place | Real names and route; field guide with 12+ species; Friday Harbor and research station; tide pools | Pass (coastlines approximate, R4 follow-up) |
| III. A place of First Peoples | Land acknowledgment frames the game; kayak-history lesson distinguishes Arctic kayak from cedar canoe; cultural content limited to acknowledgment until review; `reviewStatus` in data | Pass |
| IV. Honest about safety | Safety note on first launch and in About; cold-water model; no death but honest consequences; techniques reviewed | Pass |
| V. Beauty and elegance | Full-screen water shader with time-of-day, reflections, swell, foam, current streaks, rips, fog; soundscape on three buses; refined UI type; filters for glow and vignette | Pass |
| VI. Simulation with a game layer | Skills from practice; score; varied activities; folding-kayak rocker jacks in play | Pass |
| VII. Mobile-first and smooth | Portrait, safe areas, PWA, quality tiers that scale shader cost by measured frame rate | Pass |
| VIII. Legally and respectfully sourced | All art and sound generated in code; data sources credited; brand name withheld | Pass |
| IX. Simple, testable, deployable | Plain JS modules; pure `src/sim` with `node:test`; deploy (Terraform/Cloud Run) is a separate feature | Pass |

Deviation to note (not a violation): the spec assumes real published tide predictions; this slice
ships a realistic authored day because NOAA is unreachable from the build environment (R5). The
data is isolated behind `src/sim/tides.js` and a fetch script is planned.

## Project Structure

### Documentation (this feature)

```text
specs/001-first-voyage/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── paddler-input.md
│   ├── save-format.md
│   └── content-schema.md
└── tasks.md
```

### Source Code (repository root)

```text
index.html                 # viewport, safe areas, manifest, font
vite.config.js
public/
├── manifest.webmanifest
├── sw.js                  # offline cache
└── icons/
src/
├── main.js                # Phaser game config, scene list, quality tier
├── sim/                   # pure rules and physics — no Phaser imports
│   ├── geo.js             # lat/lon ↔ local metres, units
│   ├── tides.js           # tide height, current at time and place
│   ├── wind.js            # wind and sea state
│   ├── kayak.js           # physics step from PaddlerInput + conditions
│   ├── stability.js       # heel, brace, capsize, roll
│   ├── energy.js          # effort and recovery
│   ├── coldWater.js       # 1-10-1 model
│   ├── rescue.js          # rescue step sequences and success odds
│   ├── partner.js         # AI controller (PaddlerInput)
│   ├── packing.js         # trim, buoyancy, missing items
│   ├── assembly.js        # assembly quality
│   ├── wildlife.js        # encounters and distance rules
│   ├── camp.js            # tent site vs high water, food, trace
│   ├── skills.js          # xp and levels
│   ├── score.js           # trip score and debrief lines
│   └── save.js            # load/save/migrate (storage injected)
├── content/               # reviewable teaching data (contracts/content-schema.md)
│   ├── lessons.js  species.js  anatomy.js  gear.js  places.js
│   ├── chart.js           # island polygons, route, hazards, kelp beds
│   ├── tripDay.js         # the day's tide, current and wind events
│   ├── acknowledgment.js
│   └── credits.js
├── render/
│   ├── landMask.js        # rasterise + blur island polygons into a texture
│   ├── waterShader.js     # top-down world shader (GLSL string + uniforms)
│   ├── povShader.js       # cockpit view shader
│   ├── kayakArt.js        # procedural kayak, paddler, paddle textures
│   ├── wildlifeArt.js     # orca, seal, eagle, kelp, tide-pool creatures
│   └── quality.js         # tiers from measured frame rate
├── audio/
│   └── soundscape.js      # Web Audio buses and synthesised voices
├── ui/
│   ├── theme.js           # type scale, colours, spacing
│   ├── widgets.js         # panel, button, lesson card, meter
│   └── touchControls.js   # thumb zones, hips strip → PaddlerInput
└── scenes/
    Boot.js Title.js Acknowledgment.js StartChoice.js Ferry.js BoatSchool.js Assembly.js
    Packing.js Planning.js Paddle.js Rescue.js Camp.js TidePools.js Debrief.js
    FieldGuide.js Credits.js About.js
tests/
├── sim/*.test.js          # node:test
├── content.test.js        # every sourceId resolves; every species complete
└── smoke/smoke.mjs        # Playwright at 390x844, screenshots + fps sample
```

**Structure Decision**: Single web project at the repository root, like Plumber Wars. `src/sim`
and `src/content` import nothing from Phaser, so they run under `node:test`. Server and Terraform
arrive with the deploy feature and slot in as `server/` and `infra/` without moving anything.

## Complexity Tracking

No constitution violations to justify.
