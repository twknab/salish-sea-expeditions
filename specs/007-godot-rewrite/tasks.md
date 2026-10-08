# Tasks: Godot Rewrite

## Slice 1 — on the water

- [x] T001 Godot 4.5 project, Compatibility renderer, portrait, touch emulation
- [x] T002 Web export preset without threads; server serves wasm/pck
- [x] T003 Gerstner sea shader with ripple normals, Fresnel, foam and shallows
- [x] T004 waves.gd: the same field on the CPU, with tests
- [x] T005 hull.gd: the kayak's lines ported from kayak.js, lofted to a mesh, with tests
- [x] T006 stroke_math.gd: rotation grading, yaw, buoyancy spring, with tests
- [x] T007 kayak.gd: seven-probe buoyancy, keel drag, stroke/sweep/reverse impulses, edging
- [x] T008 paddler.gd: procedural paddler with torso wind-up and a Greenland paddle
- [x] T009 controls.gd: blade zones, hip line, hips bar, coaching labels, keyboard
- [x] T010 island.gd: noise island with sand, meadow, forest and instanced conifers
- [x] T011 sea.gd + sea.tscn: sky, sun, fog, HUD, wiring
- [x] T012 tests/smoke/godot-shot.mjs and .github/workflows/godot.yml
- [x] T013 specs 007: spec, research, plan, tasks; README and CLAUDE.md sections

## Slice 1b — the opening, in order

- [x] T013a Content exported to JSON (tools/export-content.mjs) and loaded by the App autoload
- [x] T013b Title with the kayak drifting behind it; land acknowledgment and safety note
- [x] T013c Outfitting on the dock: skin picker on the 3D boat, dressing a standing figure layer by layer, the kit by where it rides, the legal minimum
- [x] T013d The ferry crossing from Anacortes (mandatory): a 3D ferry, islands named as they come abeam, the horn
- [x] T013e Kayak School: camera tour of the boat's parts, the body and the paddle on the real models, then the five drills
- [x] T013f Water, wind, splash, drip, hull-slap, horn and gull sounds synthesized (tools/synth-audio.mjs)
- [x] T013g Psychedelic techno soundtrack as six synced stems with a mood per scene (tools/synth-soundtrack.mjs)
- [x] T013h Paddler rebuilt as one skinned mesh on a Skeleton3D (body_mesh.gd): lofted trunk and limbs with analytic normals, joints blended across bones, dress layers, IK arms, a lofted Greenland paddle
- [x] T013i Kayak School reachable from the title in one tap; ferry crossing shortened

## Slice 1c — the real islands and the gates (the first pull request to main)

- [x] T013j Real geography: `tools/geo/build_terrain.py` builds heights (AWS Terrain Tiles) and land cover (ESA WorldCover) into a 48 m grid in local metres with the origin at Friday Harbor; shipped as raw arrays (`height.i16`, `cover.u8`, `terrain.json`)
- [x] T013k `terrain.gd`: chunked land meshes coloured from the cover, full resolution near the paddler and coarse beyond, built a few per frame and cached for the session; instanced conifers; `height_at` / `is_land` / `place`; the harbours the DEM flattened get a sloping bottom in the build
- [x] T013l The sea reads the real seabed: `Terrain.height_texture()` feeds `sea.gdshader` for shallows and shore foam; a flat far plane carries the water to the horizon; fog thinned so Orcas is a shape in the haze
- [x] T013m `sea.tscn` opens in the harbour at Friday Harbor with the channel north; running aground stops the hull; outfitting stands on the real Anacortes shore; `island.gd` remains only under the ferry until the chart-style crossing lands
- [x] T013n CI gates in `godot.yml`: gdlint (`godot/.gdlintrc`), content tests, headless unit and scene tests, export, bare-page desktop and phone smoke that fails on page or script errors, and the `Dockerfile.godot` image answering `/health`
- [x] T013o Deploy framed, off: `Dockerfile.godot`, the `expedition` job in `deploy.yml` behind `EXPEDITION_DEPLOY`, and the `salish-sea-expedition` service in `infra/service` behind `expedition_image`
- [ ] T013p Datasets and libraries ADR for the rewrite (terrain tiles, WorldCover, the sound libraries to come)

## Slice 2 — the crossing as a chart

- [x] T013q `tools/geo/ferry_route.py`: the WSF track Anacortes → Friday Harbor laid over the terrain's water cells (A* with a shore penalty between charted waypoints, thinned), written to `godot/content/ferry_route.json` with the places to introduce abeam
- [x] T013r `ferry.gd` rewritten: chart camera 2.6 km up following the track over the real islands, dashed route ribbon, island names floated over their land, cards abeam from `places`, 1×/2×/4× (26 s at 1×), rail view on the sun deck, `?at=` and `?view=rail` for checks
- [x] T013s Rendering fixes the chart exposed: terrain triangles were wound back-face-first (flat land vanished from above), the sea shader was in the transparent pass for no reason, the seabed mesh z-fought the water, and sea-level fog whited out the chart; `fog_density` is now per scene

## Slice 3 — paddling that feels like paddling

- [x] T013t `controls.gd` rewritten: hold to paddle at a 60-a-minute cadence alternating sides (W/↑ or a thumb on the water), lean to steer (A/D or sliding the thumb), slide up or hold S to back off, a flick or Z/C for a sweep, two thumbs or J/L/Space for a brace, the hips bar or Q/E for edge, and phone tilt as an option kept in the save; coaching is about rhythm (a tap is an arm stroke)
- [x] T013u `kayak.steer`: a lean bends the course in proportion to the way on; good strokes drip (`Sound.dip`) instead of splashing; the drills' copy and keys say the new verbs; the smoke script can hold keys (`KEYS=w:16000`) to prove the boat moves

## Slice 4 — the compass, the names, the mark

- [x] T013v `compass.gd`: a drawn dome compass upper right — a card with ticks and the cardinals turning under a fixed lubber line, liquid-damped, degrees beneath; under the note on a phone, beside it on a desktop
- [x] T013w `place_labels.gd`: names floated over their land, shared by the ferry's chart and the water scenes (the gazetteer's landings, coves and islands within 12 km)
- [x] T013x The aft mark: an orca's fin rising through a wave on the aft deck, in the panel colour with a black fin — or the hull's white on a dark deck — never a logo

## Slice 5 — the first leg, and camp

- [x] T013y Content: `src/content/expedition.js` — the float plan (route, tide and current, traffic, bail-outs, file it) and the camp (above the tide, the pad, the raccoons, drying out, the night), every step sourced; `tripDay` exported with it
- [x] T013z `leg.gd`: the leg Friday Harbor → Jones north cove as waypoints checked against the water (the gazetteer's Jones point is mid-island; `Leg.COVE` is the cove's water), length, bearing, the day's clock
- [x] T014a `plan.gd` + `plan.tscn`: the float plan on a chart — the leg drawn with `ChartRibbon` over the real islands, names floated, the plan read card by card, then Launch; `ChartRibbon` shared with the ferry (and no longer back-face culled)
- [x] T014b The leg on the water: destination line (name, distance, bearing, clock), the compass's destination mark, the groove — a steady hold settles and the miles and hours pass over the chart, the sun moving with `Seascape.apply_hour` — and landing in the cove at 220 m
- [x] T014c `camp.gd` + `camp.tscn`: the boat at the tide line of the real cove, the camera out on the water, the tent going up on the pad at the second step, the evening coming on card by card; "Tomorrow's float plan" saves the day and returns to the title for now
- [x] T014d Tide and current on the leg from `tripDay`: `tides.gd` (pure, tested) reads height, current and wind by the minute; the current carries the boat over the ground, scaled with the groove's hours; the HUD names the set ("flood 1.0 kn setting 330°") and the wind, and the float plan says what the launch rides. Still to come: a real sounding set for the channels

## Slice 6 — who's paddling

- [x] T014e `src/content/paddlers.js`: six ready-made paddlers (Mina, Tomás, Ayla, Kai, Noor, Sam) and the parts — six skin tones, six hair colours, five styles (short, close crop, long tied back, bun, head wrap), three builds, four PFD colours — with no gender declared for any of them
- [x] T014f `App.paddler()` resolves the look from the save; `BodyMesh` draws the hair styles and the build scales the rig; `Paddler` takes its skin, hair and PFD from it everywhere the figure appears
- [x] T014g Outfitting opens on "Who's paddling": the presets as a row of faces and the parts beneath, wrapping on a phone, the standing figure rebuilding as you choose

## Slice 7 — the wildlife, as themselves

- [x] T014h `wildlife.gd`: harbour seals hauled out on their rock, a great blue heron in the shallows, a bald eagle on a fir on the point, a bed of bull kelp with floats and streaming blades, a harbour porpoise rolling through the surface — each its own built model with its own small life
- [x] T014i Sightings on the leg: the heron off the Labs, the eagle on Point Caution, the porpoise mid-channel, the kelp and the seals at the islet by Yellow Island, each placed on the shore or water the terrain has there; coming within reach names it once from the field guide (blurb, a fact, the keep-off distance for marine mammals) and keeps it in the save
- [x] T014j The field guide's species exported to the Godot content; `?scene=trip&near=yellow|labs` open on the sightings for checks

## Slice 8 — four pieces

- [x] T014k `tools/synth-pieces.mjs`: four full-length melodic pieces on one 122 bpm grid — Dawn (half-time, D minor, a slow lead), Crossing (four on the floor, acid arp, a bright A minor lead), Night (no kick, long pads, F major), Harbor (a warm house groove with a plucked lead) — arranged in sections with crossfaded gains, per-section loudness printed so a dead section is caught without ears, encoded as 64 kbps MP3 with lamejs (4.9 MB for ten minutes of music; the six looping stems were 8.3 MB of WAV)
- [x] T014l `Sound` plays one piece at a time through two players crossfading over 2.5 s; a scene's mood names the piece; the paddling cadence is two beats of the grid (0.984 s)
- [x] T014m The Chamberlin filter is clamped to a sane cutoff: the bass's wobble used to swing below zero and run away to infinity within a second — the old stems' bass had been doing the same
- [ ] T014n Listen on real speakers and tune the mixes; the renders were judged by their numbers

## Slice 9 — the water of the day

- [x] T014o `tides.gd`: the authored July day by the minute — height, current along the flood set, wind — pure and tested; the current carries the boat over the ground on the leg, in the groove and out; the HUD names the set and the wind; the plan's header says what the launch rides

## Slice 10 — choose your launch

- [x] T014p `TideGraph`: the day's water as a graph in the float plan's tide step — current filled above and below slack, wind, tide height, the night shaded — with the launch as a cursor you drag, tap, or move with ← → when the graph has focus; the leg's hours shaded from it
- [x] T014q `Tides.judge` and `verdict_line`: the old Phaser verdict ported and tested — mean current over the leg, worst chop, wind against tide — read out under the graph in a sentence
- [x] T014r The chosen launch is the save's `launchHour`: the chart's light follows it as you drag, the leg starts its clock from it, and the camp's evening starts from the hour you landed (`arrivedHour`, held to the evening)

## Slice 11 — day two

- [x] T014s `tools/geo/water_route.py` (shared with the ferry's track) and `tools/geo/leg_routes.py` → `godot/content/legs.json`: each leg's waypoints found over the real water between chart-read vias, its cove, its labels; the ferry's track regenerates byte-for-byte
- [x] T014t `src/content/expedition.js` is a list of legs — teaching per leg (float plan steps, landing, camp steps) under the same ids — with day two from Jones Island through Spieden Channel to Posey Island, a one-acre marine state park at the mouth of Roche Harbor; places and a Washington State Parks credit for Posey; the content test checks the legs chain
- [x] T014u `Leg` reads the legs (geometry merged with teaching) and the save's `legIndex`; the plan frames whichever leg is current, the trip launches from where the last one landed with that leg's sightings, the landing card and the camp are the leg's own, and camp's last card goes on to tomorrow's float plan with the tide fifty minutes later (`App.day()`), or home after the last leg. `?leg=1&scene=plan|trip|camp`, `?near=spieden|posey` for checks

## Slice 12 — the chart in the deck bag

- [x] T014v `ChartTile` + `chart.gdshader`: a north-up window of the real islands around the boat on the trip HUD, painted from the same height texture the water reads — land, shoal, deep, an inked coastline — with the leg's track dashed, the cove ringed, the boat as an arrow, a north mark and a kilometre bar; tap or press M to fold it to a corner mark (folded by default on a phone; the choice is kept in the save)

## Slice 13 — the water of the hour

- [x] T014w The sea on the trip is the hour's: `Tides.sea_state` (wind, and wind against the stream) sets the seascape, the hull and the sound as the day passes, so a launch into the afternoon southerly over the ebb is a different leg from the morning flood
- [x] T014x Rips, authored per leg in `leg_routes.py` (off Point Caution; the narrows of Spieden Channel; off Davison Head): `Leg.flow_at` scales the stream inside them with a smooth edge, the HUD names the rip and its factor, and in a rip the boat takes a wave on the beam every few seconds that the paddler braces for

## Slice 14 — small things seen on the water

- [x] T014y Place labels declutter: the nearer place keeps its name and a label that would land on it waits until it clears (Posey Island and Davison Head sat on one another from the channel)
- [x] T014z The title's Continue names the day as well as the station

## Slice 15 — over, and back in

- [x] T014aa Secondary stability in `StrokeMath.righting`: the righting torque peaks with the chine buried, dies at the point of no return and turns against the boat beyond it, so a boat not braced in time goes over and stays over (the roll is now read full-range); tested
- [x] T014ab On the trip a capsize is taught where it happens: 1-10-1, the wet exit, the paddle-float re-entry and pumping out as cards from the field lessons, then back in the boat fifteen minutes later with the warning to make the next landing the bail-out; swims are counted in the save. In Kayak School the boat comes back up with a word about bracing earlier. `?scene=trip&capsize=1` opens in the water for checks

## Slice 16 — the field guide and the credits

- [x] T014ac `guide.tscn` from the title: every species in the content by group, the ones met on the water marked from the save, then every source the game cites with its licence and a button to open it (the WorldCover attribution the data's licence asks for lives here). `?scene=guide&at=credits` scrolls to the sources

## Slice 17 — the shore at low tide

- [x] T014ad At camp, once the tent is up, "Walk the shore": the field guide's species for that beach (authored per leg in `leg_routes.py`: firs, Turkish towel, ochre stars, anemones and sea lettuce on Jones; madrone, stars, a nudibranch and sugar kelp on Posey) as cards in the order you meet them walking down, each kept in the save; the walk takes half an hour of the evening. A content test checks every shore id is a species. `?scene=camp&walk=1` opens on the shore
- [x] T014ae The HUD's channel line wraps on a phone instead of running off the screen, and the chart tile sits below it

## Slice 18 — day three, home on the ebb

- [x] T014af Leg 3 in `leg_routes.py` and the content: Posey Island east through Spieden Channel as it empties and south down San Juan Channel to the town float at Friday Harbor, sixteen kilometres; float plan, landing, and a take-out in place of a camp (close the plan, rinse and fold, what you learned, the ferry home) with no tent and "Look under the float" for the harbour's jellies and eelgrass
- [x] T014ag Each leg says which stream it rides (`favours`): `Tides.judge` and the verdict read the ebb as helping on the way home, tested; the last card of the expedition carries the tally — days, kilometres, species met, swims

## Slice 2 — measure and decide

- [ ] T014 Deploy the export to a second Cloud Run service and measure on an iPhone
- [ ] T015 Record the go/no-go in spec.md

## Slice 3 — port (only on go)

- [ ] T016 Port src/sim modules with tests
- [ ] T017 Content export to JSON and a loader
- [ ] T018 Kayak School scene
- [ ] T019 Crossing with partner, tides and currents
- [ ] T020 Wildlife, rescue, camp, tide pools, debrief, field guide, Help, About
- [ ] T021 Soundscape
