---
description: "Tasks for First Voyage"
---

# Tasks: First Voyage

**Input**: `specs/001-first-voyage/` — plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by constitution IX for all simulation logic (`node:test`), plus a smoke test.

**Order**: Build order follows story priority. US0 (Boat School), US1 (the crossing) and US9 (the
sea looks and sounds alive) together are the MVP.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Create `package.json` (Phaser 4.2, Vite; scripts dev/build/preview/test/smoke), `.gitignore`, `vite.config.js`
- [ ] T002 [P] Create `index.html` with viewport-fit=cover, safe-area CSS, theme colour, font, rotate prompt
- [ ] T003 [P] Create `public/manifest.webmanifest`, `public/sw.js` and generated icons
- [ ] T004 [P] Create `README.md` and `CLAUDE.md` (constitution pointer, layout, commands)

## Phase 2: Foundational

- [ ] T005 [P] `src/sim/geo.js` — projection and unit helpers; tests in `tests/sim/geo.test.js`
- [ ] T006 [P] `src/content/tripDay.js` + `src/sim/tides.js` — tide height, current at time/place; tests
- [ ] T007 [P] `src/sim/wind.js` — wind and sea state incl. wind against tide; tests
- [ ] T008 [P] `src/content/chart.js` — islands, landmarks, route, kelp beds, eddies (approximate, flagged)
- [ ] T009 [P] `src/content/credits.js`, `lessons.js`, `anatomy.js`, `gear.js`, `species.js`, `places.js`, `acknowledgment.js`
- [ ] T010 `tests/content.test.js` — every sourceId resolves; species/lessons complete; cultural content has reviewStatus
- [ ] T011 [P] `src/sim/save.js` — injected storage, versioned key, migrate/discard; tests
- [ ] T012 [P] `src/ui/theme.js` + `src/ui/widgets.js` — type scale, palette, panel, button, lesson card, meters
- [ ] T013 [P] `src/audio/soundscape.js` — buses (sea, wildlife, music), unlock on gesture, synthesised voices
- [ ] T014 `src/main.js`, `src/scenes/Boot.js` — game config at device resolution, quality tier, scene registry

## Phase 3: US0 — Boat School (P1) 🎯 MVP

- [ ] T015 [P] [US0] `src/sim/kayak.js` — physics step from PaddlerInput (rotation efficiency, edge-sharpened sweeps, rocker, trim, current, wind); tests
- [ ] T016 [P] [US0] `src/sim/stability.js` — heel from waves and edge, brace with hip snap and head down, capsize; tests
- [ ] T017 [P] [US0] `src/sim/energy.js`, `src/sim/skills.js`; tests
- [ ] T018 [US0] `src/ui/touchControls.js` — thumb zones and hips strip → PaddlerInput; keyboard fallback
- [ ] T019 [US0] `src/render/kayakArt.js` — kayak (side anatomy view and top-down), paddler, paddle
- [ ] T020 [US0] `src/scenes/BoatSchool.js` — anatomy tap-to-learn, fit check, paddle grip, then calm-water drills (forward, sweep on edge, brace + hip snap)

## Phase 4: US1 + US9 — The crossing, and the living sea (P1) 🎯 MVP

- [ ] T021 [P] [US9] `src/render/landMask.js` — rasterise + blur chart polygons into a texture
- [ ] T022 [P] [US9] `src/render/waterShader.js` — water/land shader: depth, sun glint, swell, wind ripples, current streaks, rips, foam, fog, time of day
- [ ] T023 [P] [US1] `src/sim/partner.js` — AI PaddlerInput: keep station, ferry angle, pace; tests
- [ ] T024 [US1] `src/scenes/Paddle.js` — camera, HUD (compass, speed over ground, current arrow, energy, time), ferry-angle prompt, kelp/eddy rest, arrival
- [ ] T025 [US9] Paddle soundscape wiring — strokes, drips, wind, swell, rip, gulls

## Phase 5: US2 — Capsize and rescue (P2)

- [ ] T026 [P] [US2] `src/sim/coldWater.js`, `src/sim/rescue.js` — 1-10-1 clock, step sequences, odds with/without paddle float; tests
- [ ] T027 [US2] `src/scenes/Rescue.js` — overlay: choose roll / self-rescue / T-rescue; gesture per step; pump out; debrief line

## Phase 6: US3 — Planning (P3)

- [ ] T028 [US3] `src/scenes/Planning.js` — chart with route and distance, tide/current/wind table, launch-time scrubber showing predicted conditions; lesson on slack and wind against tide

## Phase 7: US4 — Assembly and packing (P4)

- [ ] T029 [P] [US4] `src/sim/assembly.js`, `src/sim/packing.js`; tests
- [ ] T030 [US4] `src/scenes/Assembly.js` — ordered steps with heritage lesson; `src/scenes/Packing.js` — dry bags into flotation bags through the cockpit, trim indicator

## Phase 8: US5 — Camp, tide pools, debrief (P5)

- [ ] T031 [P] [US5] `src/sim/camp.js`, `src/sim/score.js`; tests
- [ ] T032 [US5] `src/scenes/Camp.js`, `src/scenes/TidePools.js`, `src/scenes/Debrief.js` (share card via Web Share / clipboard)

## Phase 9: US6 — Wildlife and field guide (P6)

- [ ] T033 [P] [US6] `src/sim/wildlife.js` — encounter spawn, closest approach, respectful rule; tests
- [ ] T034 [US6] `src/render/wildlifeArt.js`; encounters in Paddle; `src/scenes/FieldGuide.js`

## Phase 10: US7 — Title, acknowledgment, ferry (P7)

- [ ] T035 [US7] `src/scenes/Title.js`, `Acknowledgment.js`, `StartChoice.js`, `Ferry.js`, `About.js`, `Credits.js`

## Phase 11: US8 — Cockpit POV (P8)

- [ ] T036 [US8] `src/render/povShader.js` + POV mode in Paddle for the tide rip; settings toggle

## Phase 12: Polish

- [ ] T037 `src/render/quality.js` — measure fps, step down shader tiers
- [ ] T038 `tests/smoke/smoke.mjs` — Playwright walk-through at 390x844 with screenshots and fps
- [ ] T039 Update README with screenshots; record follow-ups (NOAA data, coastline, recordings, cultural review, brand permission)

## Dependencies

- Setup → Foundational → US0 → US1/US9 → (US2, US3, US4, US5, US6, US7, US8 in any order)
- Within a story, `[P]` sim modules and their tests come before the scene that uses them.
