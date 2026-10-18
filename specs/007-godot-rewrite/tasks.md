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
- [x] T013p Datasets and libraries ADR for the rewrite (`adr-datasets-and-libraries.md`): the terrain tiles, WorldCover, the routes laid over the grid, the authored water, sound synthesized in code with lamejs at build time only, DejaVu, and what was turned down

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

## Slice 19 — the switches

- [x] T014ah Sound and music chips beside the Title button on every screen, kept in the save and applied at start: the autoload had the switches and nothing reached them, and a web game must be muteable
- [x] T014ai Once the expedition is done the title offers each day again, from its float plan

## Slice 20 — the engine on the wire

- [x] T014aj `server/precompress.mjs` writes brotli and gzip siblings at image build (`Dockerfile.godot`); the server sends a sibling with `Content-Encoding` when the browser accepts it and falls back to gzip on the fly; every file carries an ETag so a revalidation of the engine is a 304. Measured: the 38 MB engine is 6.5 MB as brotli, the 7.8 MB pack 5.9 MB; the whole export goes from 45 MB to about 13 MB on the wire, the first lever on the go/no-go "time to first frame" row

## Slice 21 — the music arrives after the first frame

- [x] T014ak The four pieces are excluded from the web pack (7.8 MB → 2.9 MB) and fetched from `audio/` beside the page once the scene asks for them, cached, and crossfaded in when they land; the editor and headless runs load them from the project as before; CI copies them beside the export

## Slice 22 — the ferry in the channel

- [x] T014al `Traffic`: an island ferry shuttles the San Juan Channel stretch of the real ferry track at sixteen knots with a dwell at each landing, coming down the channel to meet you on day one and in to meet you on the way home; within 800 m a card says to hold position and cross the wake bow-on, within 450 m one long blast, within 260 m its wake arrives on the beam and the brace is needed. Track maths tested headless; `?scene=trip&near=ferry` opens with it 600 m ahead

## Slice 23 — the partner

- [x] T014am `Partner`: a second boat, another preset and another skin, holding station off your starboard quarter, closing at your pace, riding the same water and stroking in the cadence; the opening line names them. With a partner alongside the rescue is the T-rescue (the paddle float stays the solo drill of Kayak School) and the time in the water is nine minutes, not fifteen. Station and preset choice tested headless

## Slice 24 — packing the boat

- [x] T014an `Packing` (the rules of `src/sim/packing.js`: arms per bag, pitch, mass at the ends, deck mass, the essentials) and a packing screen between Kayak School and the float plan: the real planform from above with the five places a dry bag can go, tap an item then a place, a trim line in words, "Pack it for me" for the suggested layout, and the essentials still on the beach named before you go. The trim is physics: the centre of mass moves with the pitch (a bow-heavy boat sits 3° bow-down, measured headless, and pushes water), mass at the ends slows the turn, deck mass softens the righting, and every stroke pays the Phaser sim's trim penalty. What is left behind is gone: no pump and the rescue bails with a sponge, no headlamp and the camp chores run in the dark. Sim tested headless; `?scene=pack`, `?pack=bow|ideal`

## Slice 25 — the debrief

- [x] T014ao `Score` (the rules of `src/sim/score.js`) and the record it counts: each leg landed keeps its launch and the tide's verdict on it, the landing hour, the swims, and the wildlife given room or approached inside the field guide's distance (a "too close" line on the water as it happens); each camp left is a night out and a clean camp; each drill finished in Kayak School is kept. The take-out ends in the debrief: miles, nights, score, each day as it went, how the points came, the drills, the species, and a share button (Web Share, else the clipboard). "Begin at Anacortes" starts a fresh record; the field guide and the drills are kept for good. Score and record tested headless; `?scene=debrief&demo=1`

## Slice 26 — the boat goes together

- [x] T014ap `Assembly` (the rules of `src/sim/assembly.js`: eight steps in order, half the mean and half the two jacks, never under 0.3) and the beach at Friday Harbor off the ferry: the skin unrolled flat, the colour-coded frame (`FrameModel`, keel and sheer tubes and ribs lofted from the same `Hull` as the skin, blue forward and red aft) snapped together beside it and slid in bow first, the coaming, the seat, then the two side jacks and the keel jack as holds with a right length — let go early and the hull is slack, hang on and it is forced — and the check. The heritage and hull-tension lessons on their steps. The boat you build is the boat you paddle: the quality is kept and the kayak loses keel and wanders by it, with "slack hull" on the water line. Rules tested headless; `?scene=assemble&step=N`

## Slice 27 — the rescue drill

- [x] T014aq Kayak School ends with the drill you hope never to need: the boat goes over on its own in the harbour's flat water and the solo rescue is taught in it — wet exit, the paddle-float re-entry, pump out — then "Back in the boat" rights it and the drill is demonstrated for the debrief. The trip's capsize keeps the partner's T-rescue, and the two share one card machinery. `?scene=school&drill=rescue`

## Slice 28 — the wind on the boat

- [x] T014ar `Windage`: the day's wind, already on the HUD line, now acts on the boat — a drift downwind at three per cent of the wind's speed against the keel's grip, and with way on the bow comes up into a beam wind, a stern-heavy boat more so (the packing's stern-heavy wander is this now, not a sine). Rules tested headless

## Slice 29 — pause, and About

- [x] T014as Pause on the water and in Kayak School: a chip, Escape or P, and the page going into a pocket (focus lost) all stop the physics and the clock under a card that says so and saves the place; Continue or Title from it. About on the title grows up: the game and its independence, the land acknowledgment and the safety note always reachable, the maker's link, and the way to the field guide and sources. `?about=1`

## Slice 30 — the wind is up

- [x] T014at The float plan's bail-outs are real on the water: each leg names its landings of refuge (`bailouts` in `src/content/expedition.js`, checked against the chart's places), and when the sea state the hour makes crosses rough a card names them with their distances and offers the choice — push on, or wait it out in the nearest lee for an hour and a half, after which the water is read again. The wait is kept in the day's record and the debrief says so. `?launch=15` on day one meets the afternoon southerly against the ebb

## Slice 31 — the night in the cove

- [x] T014au The night is a night: the last camp card waits for full dark, the seascape carries a star dome (points on a sphere, brighter along one band, fading in with the dark and following the viewer), and the cove is bioluminescent — a tap on the water at night stirs a burst of light, the way a hand or a paddle does in a warm Salish Sea August. `?scene=camp&step=4&glow=1`

## Slice 32 — the whales

- [x] T014av A pod of Bigg's killer whales works Spieden Channel on day two: a bull with the tall fin and two smaller animals, black with the eye patch and the saddle, each surfacing on its own beat with the bull's blow, travelling the channel and coming back round. The pod is a sighting like the rest — the field guide's card at 1.4 km, Be Whale Wise's thousand yards as the line, given room or too close in the day's record — and the sightings' distance now follows an animal that moves, not the water it started in. `?scene=trip&leg=1&near=orcas`

## Slice 33 — let seals rest

- [x] T014aw The hauled-out seals keep the hundred yards the field guide now gives them: inside it every head comes up and turns to the water, inside fifty metres they flush off the rock and are gone, with a line saying what that is — the disturbance the distance prevents. The approach counts as given room or too close in the day's record like the whales. Kayak School's tour now says six drills. `?scene=trip&near=yellow&close=1`

## Slice 34 — the camp keeps the packing's word

- [x] T014ax What was left on the beach at Friday Harbor is felt at camp, on the card where it would have been used: no tent at the pitch, no food at the raccoons, no water on Posey, no warm layers at drying out, no sleeping bag at night, and the headlamp as before — one plain line each

## Slice 35 — every station, every push

- [x] T014ay `tests/smoke/godot-stations.mjs`: every station of the export opened from its check URL in a fresh page, a page error or a GDScript error anywhere failing the run, the screenshots kept as artifacts. CI runs it after the export, so the sweep that was done by hand after each slice is done by the machine on every push

## Slice 36 — the numbers on the phone

- [x] T014az `?perf=1` shows the go/no-go rows where they matter, on the phone in the hand: frames per second now and the worst of the last ten seconds, the frame time, the time from the page starting to load to the first frame, the engine's memory, and the device; printed once to the console at ten seconds for a smoke run. Kayak School's last card now says "Pack the boat", which is where it goes

## Slice 37 — the kelp

- [x] T014ba A kelp bed is a thing the boat feels: inside seventy metres of a bull kelp sighting the hull drags on the fronds (a linear drag that makes every stroke a short one) and the swell lies down — a kelp bed is a lee, and a slow one — with a line saying so the first time. `?scene=trip&near=yellow` starts in it

## Slice 38 — the wake, bow-on or on the beam

- [x] T014bb The ferry's wake is taken as the card taught: a boat turned across the ferry's track, bow into the waves, takes a few pitches; a boat left parallel takes the full roll on the beam, and the line says to turn the bow into it next time. `Traffic.wake_beam` and `wake_kick` tested headless; the ferry start joins the stations sweep

## Slice 39 — the crossing rule, kept or not

- [x] T014bc The ferry encounter is judged as the card taught: a boat that holds from the horn to the wake "held for the ferry"; a boat that paddled on as it came "paddled on as the ferry came", said at the wake and kept in the day's record for the debrief

## Slice 40 — a fresh expedition is fresh

- [x] T014bd "Begin at Anacortes" clears the swims and the ferries met with the rest of the record, and the take-out's tally counts this expedition's swims from the days' record rather than a lifetime total; the field guide and the drills stay yours for good

## Slice 41 — the long way home has its wildlife too

- [x] T014be Day three, the longest day, had three sightings to the others' five: the pod works Spieden Channel again on the way home, west on the ebb this time, and the eagle sits on Jones Island's south point as the boat comes down the channel

## Slice 42 — fog on the first-light launch

- [x] T014bf Day three leaves Posey at first light on the ebb, and first light on cold water is fog: the leg carries `fog: {until, burn}`, the float plan says so at a launch inside it, and on the water the sky, the sun and the haze close to a couple of hundred metres (`Fog`, `Seascape.set_fog`). The chart keeps its last fix (a hollow arrow, "fog · last fix") and the destination line swaps the distance for the visibility and "steer 047°"; the note teaches the compass, the stroke count and the partner. The ferry sounds a long blast every two minutes (Rule 35) while it is within earshot, heard from a direction, and the fog burns off over the hour after `until`. The day's record carries `fog`; `?fog=1` socks any leg in for a check; `trip-fog` joins the stations sweep.

## Slice 43 — the fog lifts, and the compass work is judged

- [x] T014bg When the fog burns off, the note says where the compass put you: on the line you planned, or how many metres off it (`Leg.off_track_m`), with the cove's bearing to carry on by. The day's record keeps when the fog closed in and how far off the line it lifted, and the debrief's day line says so ("in fog from 06:00, came out 260 m off the line"). `?fog=lift` lifts it after a second for a check; `trip-fog-lifts` joins the sweep.

## Slice 44 — where the boat sleeps

- [x] T014bh The first camp card reads the tide table aloud — tonight’s high water, when, and how far above the afternoon’s — and asks where the boat sleeps: the water’s edge, the wrack line, or the grass (`HaulOut`). The boat moves to the spot; the night card says what the water did (found it and you hauled it up wet in the dark; came within a hand; slept dry), and a boat the tide found is back in the shallows on the night card. The day's record keeps the spot and the verdict and the debrief's day line says so. `?boat=edge|wrack|grass` for checks; `camp-floated` joins the sweep.

## Slice 45 — where the food sleeps

- [x] T014bi The raccoons card on Jones asks where the food sleeps — the tent, the boat’s hatch, or the hard box hung — and the night card says what came of it (the breakfast gone and a torn mesh door; claw marks in the skin a hand from the seam; the box swinging untouched). The choice row is shared with the boat’s (`_choice_row`), the day's record keeps `foodVerdict`, and the debrief says so. `?food=tent|hatch|hung`; `camp-raccoons` joins the sweep.

## Slice 46 — a September day to paddle it again on

- [x] T014bj The title offers the day to paddle on: the settled July day, or a September spring tide with the first autumn southerly behind it (bigger tides, a 2.8-knot ebb, twenty-one knots by early afternoon, the light gone by seven). `TRIP_DAYS` in `src/content/tripDay.js` is the list, `App.chosen_day()` the choice (`save.dayId`, `?day=` for checks); the float plan's head and the debrief's kicker name the day. Everything that read the one day reads the chosen one: the tide graph, the verdicts, the sea state, the bail-outs, the stream, the night's high water. `trip-september` joins the sweep.

## Slice 47 — the day's own light

- [x] T014bk The sky, the sun and the night follow the chosen day's sunrise and sunset rather than a fixed July (`Daylight.dusk_at / night_at / sun_elevation`, pure and tested; `Seascape` reads the day from `App` when it has one, so every scene follows). A September evening is dark by half past eight. The float plan's verdict is poor when the launch would land after the light (`Tides.lands_in_the_dark`), with the sunset in the line; night on the water puts up a note once, the day's record keeps `dark`, and the debrief says "landed in the dark". The camp's night card waits for the day's own dark. `?hour=20` sets the trip's clock for checks; `trip-dark` joins the sweep.

## Slice 48 — the ferry home

- [x] T014bl The expedition ends the way it began: from the take-out the last boat runs the ferry's real track back to Anacortes in the evening light, the islands coming abeam in the reverse order, each one you paddled under saying so (`Leg.places_paddled`), then the slip at Anacortes and the debrief. `App.advance_leg` sends the last leg to the ferry with `save.ferryHome`; `?scene=ferry&home=1` for checks; `ferry-home` joins the sweep.

## Slice 49 — the seamanship calls

- [x] T014bm The debrief reads the judgement calls back from the days' record (`Seamanship`, pure and tested): the launch windows, the boat above the tide, the food out of reach, daylight for the landing, the ferry held for, the line held in fog, room given to wildlife, the boat kept upright — each listed only when it came up, kept or not, with a note in plain words. The share line counts them.

## Slice 50 — the water on Posey

- [x] T014bn Posey has no water, and the card now asks what happens to the eight litres that came in the boat: drink your fill, ration it, or cross to Roche Harbor for the tap in the morning (`WaterPlan`, pure and tested). Drink it and the long day home is paddled thirsty — the stroke is 85 % of itself (`Kayak.effort`) and a note says so at the first stroke; the tap costs an hour, so the float plan's earliest launch moves to 07:00 (`Leg.earliest_launch`) and the plan says why, which on the ebb is the whole lesson. The record keeps it, the debrief and the seamanship calls say so. `?water=fill|ration|roche`; `camp-water` joins the sweep.

## Slice 51 — the loop closes

- [x] T014bo The debrief ends with "Paddle it again · a september day" (or the July day, from September): a fresh record on the other day, from the first float plan, with the boat built, Kayak School behind you and the packing standing (`App.paddle_again`, `App.fresh_record` — Begin uses the same list, now with the water run and the ferry-home flag in it). The title remembers the last expedition in a line: the day, the miles, the seamanship calls kept, the score.

## Slice 52 — the partner's voice

- [x] T014bp The partner speaks at the moments that matter, a few words in front of the note or the card — the ferry ("Hold here. Let it go by."), the sea standing up, fog closing in and lifting, the pod, the seals' rock, a capsize, the dark, the kelp, the wake, the landing (`PartnerVoice`, pure and tested: every line under seventy characters, silent when there is nothing to say). Never on a drill, where you are alone.

## Slice 53 — the whale-watch fleet

- [x] T014bq Every pod in the channel has a whale-watch boat on it, holding off abeam at the field guide's distance for the species, parallel to the animals, engine at idle (`WhaleWatch`, its station pure and tested). Coming within reach of it says so once: the fleet keeps the distance you are asked to keep, and it is watching where you are too. It is there on both passes of the pod; `?leg=1&near=fleet` starts beside it, and `trip-fleet` joins the sweep.

## Slice 54 — the sounds of the channel

- [x] T014br Four more synthesized sounds (`tools/synth-audio.mjs`): the orca's blow, heard loud alongside and as a breath on the wind at a kilometre (`Wildlife.breathed` → `Sound.blow` by distance); the bald eagle's thin chitter when it is sighted; a diesel at idle that comes up as the whale-watch boat nears and glides away (`Sound.set_engine`, a loop, silenced when the water scene goes); and the raccoons' quarrel from the dark on the night card when the food was not hung.

## Slice 55 — the docs catch up

- [x] T014bs README's Godot paragraph describes the expedition as it is after fifty-four slices (the two days, the fog, the fleet, the camp's choices, the ferry home, the seamanship calls) and the check URLs that open each of them; CLAUDE.md gains the gotchas paid for this run (autoload-reading classes hang the headless tests, `signal` after `extends`, the spawn-before-near order).

## Slice 56 — a bearing held on the compass

- [x] T014bt Kayak School teaches the compass before the fog needs it: a seventh drill, before the rescue, puts a mark on the dome seventy degrees round from the bow and asks for the bearing held within ten degrees for twelve seconds under way (`compass` in `src/content/anatomy.js`; the mark is the trip's own destination mark, cleared when the drill ends). The tour says seven drills; the debrief counts them. `?scene=school&drill=compass`; `school-compass` joins the sweep.

## Slice 57 — the call ashore

- [x] T014bu The take-out's first card, closing the float plan, asks when the call goes in: from the float, after the boat is packed, or on the ferry (`FloatPlanClose`, pure and tested). The last take-out card says what came of it — a Coast Guard boat out of Friday Harbor looking for two paddlers on the car deck, a late call with the phone already in someone's hand, or nothing, which is the point. The record keeps it, the debrief and the seamanship calls say so. `?close=now|later|forgot`; `takeout-close` joins the sweep.

## Slice 58 — the sweep runs three abreast

- [x] T014bv `tests/smoke/godot-stations.mjs` opens its stations through a small worker pool (`CONCURRENCY`, three by default) instead of one after another: each station is a twelve-second wait, not a load, so the sweep of twenty-eight stations takes a third of the time and CI's Godot job comes back under twenty minutes. The report is in finishing order, with each station's errors under its line.

## Slice 59 — the squall

- [x] T014bw The September day carries a rain table (`rain: [{t, r}]`, read by `Tides.rain`): the front comes through with the early-afternoon wind. On the water the sky goes slate, the light flat, and streaks fall around the boat (`Seascape.set_rain`, CPUParticles following the sea's follow node); a synthesized rain loop comes up with it (`Sound.set_rain`); the partner says hood up and the note says the wind behind the front is the thing to watch. The day's record keeps it and the debrief says "paddled through a squall". `?hour=14` on the September day, or `&rain=1` on any leg; `trip-squall` joins the sweep.

## Slice 60 — the field notes

- [x] T014bx Every note the water puts up on a leg — the fog closing in, the blast, the kelp, the seals' heads coming up, the ferry's wake, the partner's words in front of them — is kept in order (the opening line and the stroke counts aside, two dozen at most) and lands in the day's record; the debrief lists them day by day under "Field notes", so the teaching the trip gave in passing can be read back afterwards.

## Slice 61 — the names stay off the HUD

- [x] T014by The place names floated over the land no longer land on the HUD: `PlaceLabels.keep_out` seeds the collision rects with the speed, note and destination lines, the compass and the chart tile (a taller, wider set on a phone), so a cove's name that would sit under the note waits until it clears.

## Slice 62 — the chart of the expedition

- [x] T014bz The debrief draws the whole expedition on one chart (`ExpeditionChart`, from the same height texture the water reads): the three legs' tracks, the camps as rings, and a numbered mark where each field note was said — the notes carry the boat's position now (`noteAt`), and the list numbers them to match. The window is the legs' own extent with a margin, so nothing is cropped on a phone.

## Slice 63 — the squall is in the plan and on the water

- [x] T014ca The float plan's verdict names the squall when the leg runs into it ("A squall comes through at 14:00"), rain lies the chop down a quarter while it falls, and the shore names go with the shore as the visibility closes to a couple of kilometres.

## Slice 64 — the white light

- [x] T014cb After dark and in fog both boats show the white all-round light a boat under oars carries (Rule 25(d), the one the kit list asked for): a small lamp on the stern deck with its own glow on the water, lit from the water scene when the night comes or the fog closes in, and off again when they go.

## Slice 65 — the docs catch up again

- [x] T014cc README's Godot paragraph carries slices 56–64: seven drills, the squall, the white light, the call ashore, the field notes on the chart of the expedition.

## Slice 66 — the shore walk's own tide

- [x] T014cd The shore walk reads the tide it really has (`Tides.next_low`): its kicker carries the water standing on the shore now and when the next low comes, and when the pools are still under water the first card says so and that the walk is what the low will uncover — on a September spring tide that is a different shore from July's.

## Slice 67 — a clean camp is earned

- [x] T014ce A night out no longer counts as a clean camp by itself: on Jones, food the raccoons took is wrappers in the salal by morning, so that camp is not clean (`FoodStore.leaves_clean`), the night card says so, and the score's 250 for it goes with it. Posey, with no raccoon card, still counts.

## Slice 68 — the stream on the chart

- [x] T014cf The chart in the deck bag draws the stream where the boat is: an arrow the way the water sets, longer as it runs harder, and its knots beside it — rips included, so the narrows of Spieden Channel show a longer arrow than the open channel. It reads from the same current vector that carries the boat.

## Slice 69 — the ferry angle

- [x] T014cg Crossing a stream is taught where it happens: the chart draws the course the boat is making good over the ground as a dashed line beside the arrow of its heading, and when the stream sets the boat more than twelve degrees off, the note says by how much and what to steer to hold the line to the cove — the ferry angle, `asin(cross-stream / boat speed)` up into the stream — or that no angle holds it when the stream across the line outruns the boat (`FerryGlide`, pure and tested).

## Slice 70 — the crossing, scored

- [x] T014ch A stream crossing is a seamanship call when one came up: the water scene times every second under way in a stream of more than half a knot, and the seconds the course made good stays within twelve degrees of the line to the landing (`FerryGlide.off_line`). On the line three-fifths of the way is a crossing held (`FerryGlide.held`); under a minute in a stream is not judged. The debrief's Each day names it ("ferried across the stream on the line", or "set down the stream, 48% of the crossing on the line") and Seamanship carries "Crossed the stream on a ferry angle".

## Slice 71 — the ferry angle in Kayak School

- [x] T014ci Kayak School teaches the crossing before the water does: an eighth drill, "Ferry angle: cross a stream", between the compass and the rescue. A knot of stream runs across the line from the left (`FerryGlide.across`), the compass marks the line, and the note shows the course made good once the boat is moving. Making good the line within ten degrees for twelve seconds completes it. The drills' lines are now taken from the bow as it is, not from last tick's heading.
- [x] T014cj The phone HUD stops overlapping itself: the ferry-angle note has a two-line phone form (`FerryGlide.note(…, short)`), the opening hint is shorter on a phone, and the compass sits under the note and the trip lines (no higher than 222 pt, lower when the note runs long).

## Slice 72 — waiting for slack

- [x] T014ck When the stream outruns the boat on its line, head-on or across, the water says so and offers the real choice. `FerryGlide.headway` is how fast a boat at touring pace makes good along the line while steering the ferry angle. Under half a knot, once the boat is moving, a card "Faster than you paddle" names the stream and the hour of slack water (`Tides.next_slack`: the stream under half a knot, or turned), says when slack comes after sunset, and offers "Push on" or "Wait for slack · HH:MM". Waiting moves the clock to slack (the September afternoon ebb in the Spieden narrows: 3.5 kn at 16:30, slack at 20:00, in the dark). The day's record keeps it ("waited for slack water to cross"), apart from waiting out the wind. The ferry-angle note no longer fires when no angle can hold the line, and its heading is worked for a boat under way rather than one just starting.
- [x] T014cl `sea.gd` shows every card through `_show`, which clears the last one; Kayak School's tour card counts eight drills; `godot-desktop-shot.mjs` takes `CLICK=` and `THEN=` (clicks before and after `KEYS`) so a check can press a card's button.

## Slice 73 — the docs catch up with the stream

- [x] T014cm README's Godot paragraph carries slices 68–72: the stream on the chart beside the course made good, the ferry angle, slack water when the stream outruns the boat, and the crossing among the seamanship calls.

## Slice 74 — slack on the float plan

- [x] T014cn The float plan's tide graph marks slack water: a diamond on the zero line wherever the stream turns (`Tides.slacks`), with its time to the five minutes, so a crossing can be planned for the turn before launching rather than discovered on the water. The legend is laid out by measure and fits a phone. `Leg.clock` rounds to the nearest minute (it floored, so 7 h 50 m held as 7.8333 read 07:49).

## Slice 75 — the turn inside the leg

- [x] T014co The plan's verdict names a slack that falls inside the leg (`Tides.turn_line`): "The stream turns at 13:20, partway through, and runs against you after it" — or carries you, on a leg that favours the ebb. A turn in the first or last quarter hour is the launch's or the landing's and goes unsaid. A poor verdict for chop no longer says the stream is "near slack for the whole leg"; it names the wind's rough sea, and "for the whole leg" is kept for a leg that really runs against the stream.

## Slice 76 — words on the water

- [x] T014cp The field guide carries "Words on the water": thirteen terms the chart, the plan and the notes use — flood and ebb, slack water, set and drift, course made good, ferry angle, tide rip, eddy, wind against tide, lee, float plan, bail-out, 1-10-1, the white light — each in a sentence or two with its sources (`src/content/glossary.js`, exported with the content; `tests/content.test.js` resolves every source). `?scene=guide&at=words` opens on it.

## Slice 77 — the crossing in its own class

- [x] T014cq The water scene's crossing logic moves out of `sea.gd` into `CrossingWatch` (`crossing_watch.gd`, pure, a `RefCounted` the scene feeds each frame): the course made good, the seconds in a real stream and on the line, and when to say the ferry note or put up the slack card. Behaviour is unchanged (the July ferry note and the September slack card match frame for frame); the headless tests now drive it directly — a beam stream, the ferry angle held, a head stream, fog and a boat not yet under way — and `sea.gd` is back under the lint's thousand lines with room for what comes next.

## Slice 78 — the turn felt on the water

- [x] T014cr When the channel's stream turns during a leg, the partner feels it ("Feel that? It's turning.") and the note says which way the water runs now and what that means for this leg — the flood starting with you, or the ebb building against you, with the shore's eddies or a landing to wait for the next turn (`CrossingWatch.turned`, `CrossingWatch.turn_note`, a two-line form on a phone). Not in fog, and not over a card.

## Slice 79 — the note keeps the line

- [x] T014cs A time-critical note — the turn of the stream, the ferry angle — keeps the note line for eight seconds (`NOTE_HOLD`) before the squall's or the night's note, which go up once and can wait, may take it. On the September day the stream turns at 13:20 inside the squall; the turn's note now holds while the rain falls, and the rain's note follows when the hold is spent. `?scene=trip&day=september&hour=13.33` is a few seconds before that turn.

## Slice 80 — the docs catch up with the turn

- [x] T014ct README's Godot paragraph carries slices 74–79: slack marked on the float plan's graph, the verdict naming a turn inside the leg, the moment the stream turns felt on the water, and the words on the water in the field guide.

## Slice 81 — the rip you can hear

- [x] T014cu A tide rip is heard as well as seen: a new seeded loop (`rip_loop`, `tools/synth-audio.mjs`) — a chatter of short slaps and glugs over a low rush — comes up as the boat runs into a rip at the run of the stream and falls away to nothing in open water and at slack (`CrossingWatch.rip_level`, `Sound.set_rip`). Leaving the water now hushes the engine, the rain and the rip at once (`Sound.hush_water`): before, one gliding step per call left them sounding under the camp and the debrief.

## Slice 82 — the shore's eddies

- [x] T014cv The advice the turn gives — work up the shore inside the eddies — is now true on the water: the stream eases toward the shore, full beyond 240 m and a third of itself inside 80 m (`CrossingWatch.eddy_factor`), measured each frame by a coarse ring probe for land (`Terrain.shore_distance`). The chart's stream arrow, the course made good and the slack card all read the eased stream. The first time the boat finds an eddy with a real stream running outside it, the partner says so and the note says how a paddler uses it.

## Slice 83 — the eddy, checked

- [x] T014cw The water scene's fixed check starts move into a table (`CheckStarts`, `check_starts.gd`; the starts that depend on what spawned stay in the scene), and a new one, `?scene=trip&leg=1&near=eddy`, puts the boat 80 m off Spieden Island's south shore in the narrows — with `&day=september&hour=16.5&underway=1` the September ebb runs 3.2 kn outside and 0.9 kn in the eddy, and the eddy's note is on screen. Seeing it found that the ferry-angle note took the line from the eddy's a frame later: the ferry angle is now taught in open water only, and the eddy's note holds the line like the turn's. The stations sweep opens the new start.

## Slice 84 — the hardest water

- [x] T014cx Each day's record keeps the hardest stream the boat met, as it reached the boat (after the shore's eddies), and where — the rip's name when it was in one — and whether the boat worked up the shore in an eddy (`CrossingWatch.max_kn`, `max_at`, `hardest_line`). The debrief's Each day names it: "the stream at 3.2 kn in the narrows of Spieden Channel · up the shore in the eddies". A day that never ran a knot says nothing of it.

## Slice 85 — the eddy line

- [x] T014cy Crossing an eddy line — out of the shore's eddy into the stream, or back in — with more than a knot and a half running outside it is felt (`CrossingWatch.line_dir`, at most once in twenty seconds; the first reading only says which side the boat is on). Edged toward where the new water pushes — downstream coming out, into the turn going in (`CrossingWatch.line_edged`, from the hips bar against the boat's beam) — the hull slides over; flat or edged the wrong way, the line rolls the boat (`kayak.kick`), the partner calls it, and the note says how to cross the next one, with a brace if it bites.

## Slice 86 — the README catches up

- [x] T014cz The README's account of the game carries slices 81–85: the rip heard as well as seen, the shore's eddies and the eddy line on the leg, the hardest water each day met in the debrief, and the `near=eddy` check start.

## Slice 87 — the eddy line, in words

- [x] T014da The field guide's words on the water gain the eddy line (`src/content/glossary.js`, exported to `godot/content/content.json`): the seam where an eddy meets the stream, and how to cross it — edged toward where the new water pushes, with a brace ready. The content test now requires the eddy and the eddy line among the words, beside slack, the ferry angle, the course made good and the float plan.

## Slice 88 — the eddy line, in Kayak School

- [x] T014db Kayak School gains a ninth drill before the rescue: the eddy line (`src/content/anatomy.js`). The boat sits in still water; twelve metres ahead, past a pale seam drawn on the water, a knot and a half of stream runs across from the left (`DrillWater`, `drill_water.gd`, which now also starts the ferry drill's stream). Crossed on an edge toward where the new water pushes, the crossing counts; crossed flat, the line rolls the boat and the note says how to cross the next one, using the same `CrossingWatch.line_edged` and `line_note` as the leg. Two edged crossings, out and back in, complete it. `?scene=school&drill=eddyline` opens it, and the stations sweep opens it too.

## Slice 89 — the school's tour, as data

- [x] T014dc Kayak School's walk around the boat, the body and the paddle moves out of the water scene into a pure class (`SchoolTour`, `school_tour.gd`): one stop per part in the content, each with where the camera looks and from how far, then the drills. The scene passes in the figure's anchors and the source line, so the tests can walk the tour without the autoloads. They check that every part, body point and paddle part has a stop, from the intro to the drills; that every stop has somewhere for the camera to look from; and that the tour's count of drills matches the drills there are. `sea.gd` drops from 999 lines to 970, under the lint limit of 1000, with room for what comes next.

## Slice 90 — the eddy lines, remembered

- [x] T014dd Each day's record counts the eddy lines the boat crossed on an edge and the ones that tripped it (`CrossingWatch.crossed_line`, `lines_edged`, `lines_tripped`; record fields `linesEdged`, `linesTripped`). The debrief's Each day names them: "3 eddy lines: 2 on an edge, 1 tripped the boat", "across an eddy line on an edge once" or "tripped by an eddy line twice". A day that crossed none says nothing. The demo debrief carries an example on day two.

## Slice 91 — the eddy lines, a seamanship call

- [x] T014de The debrief's seamanship calls gain "Crossed eddy lines on an edge", read across the days from `linesEdged` and `linesTripped` (`Seamanship.calls`). It is kept when no line tripped the boat ("on an edge every time, 3 of 3"), missed when one did ("tripped once, 3 of 4 on an edge"), and absent on an expedition that crossed no eddy line, like every call that only counts when it came up. The demo debrief now reads twelve calls.

## Slice 92 — the datasets and libraries, on record

- [x] T014df `adr-datasets-and-libraries.md` closes T013p. It records each dataset and library under the rewrite: how it is used, its licence and what it obliges, and what was considered and turned down. It notes that lamejs (LGPL-3.0) runs only at build time, and that the WorldCover and DejaVu credits are not guarded by the content test.

## Slice 93 — the attributions, guarded

- [x] T014dg The credits the Godot build relies on (the engine, the terrain tiles, WorldCover, DejaVu and the original-work credit) are exempt from the unused-credit check, so a content test of their own now fails if one goes missing, if WorldCover's CC BY 4.0 attribution to the European Space Agency changes, or if DejaVu's Bitstream Vera licence changes. The datasets ADR says so, in place of the warning it carried.

## Slice 94 — the partner, when it goes right

- [x] T014dh The partner spoke at an eddy line only when it tripped the boat. Now they speak when it is crossed on an edge too (`PartnerVoice` key `eddyline_edged`: "That’s it. You rode it over."), so the nerve the partner carries is for the good crossings as well as the bad ones.

## Slice 95 — the drills, on a phone

- [x] T014di On a phone the drills hid their keyboard line and said nothing in its place, so nobody was told to drag the hips bar to edge, slide up to back off, or put two thumbs down to brace. Every drill now carries a `touch` line beside its `keys` (`src/content/anatomy.js`), shown as "On the screen: …" on a touchscreen and "Keyboard: …" elsewhere. The content test requires both for every drill.

## Slice 96 — the cards, on a phone

- [x] T014dj On a phone, the night in the cove ran off the right edge of the screen: its three buttons (Back, Walk the shore, Tomorrow’s float plan) set the card's width, and the text and the last button were cut off. A card's buttons now sit in an `HFlowContainer` (`UIKit.card`), which wraps them onto a second row when they do not fit, as the outfitting presets already did. Desktop cards are unchanged. All 36 stations pass the sweep.

## Slice 97 — the pack list, on a phone

- [x] T014dk On a phone, the packing screen's gear rows clipped the end of a long line, which is where the weight is: "Sleeping bag & pad · 2", "Chart & compass · 0.3". On a narrow screen a row now wraps to two lines instead (`Button.autowrap_mode`), and a non-breaking space keeps the number and "kg" together. Desktop rows are unchanged.

## Slice 98 — the place names, on screen

- [x] T014dl Place names floated over the land could sit half off the screen or under the Title, Sound and Music chips; on a phone the plan showed "eden Island" cut off under them. A name now shows only when the whole of it fits on the screen below the chips (`PlaceLabels.TOP_BAND`). The nearer-wins overlap rule is unchanged. All 36 stations pass the sweep.

## Slice 99 — the place names, clear of the panels

- [x] T014dm On a phone the ferry drew "Lopez Island" inside its see-through top panel, where it read as part of the panel. Place names now stay off any control in `PlaceLabels.avoid`, wherever it is that frame. The ferry registers its top panel and each card, the float plan its day panel and each card. The fixed `keep_out` rectangles the water scene uses are unchanged.

## Slice 100 — the go/no-go table, whole again

- [x] T014dn The "To measure" paragraph in `spec.md` had been inserted inside the go/no-go table, which cut its last two rows (memory, and touch strokes landing) out of it: rendered, they read as stray text with pipes. The paragraph now follows the table, and the table has all four measures again.

## Slice 101 — the place names, tested

- [x] T014do The decision of whether a place name can show moves out of `PlaceLabels.update` into two pure functions: `room` (the screen below the chips) and `placeable` (the whole name in the room, overlapping nothing already taken). The headless tests now check what slices 98 and 99 relied on screenshots for: a clear name shows; a name under the chips or half off the screen stays hidden; a name stays off a panel and shows just below it.

## Slice 102 — the draw stroke

- [x] T014dp The boat can now be moved sideways. A draw plants the blade out to the side and pulls it in to the hull, sliding the boat toward it: the stroke that closes on a partner to raft up, or brings the boat in beside a dock (`Kayak.draw`). Shift+A or Shift+D draws, and the paddler reaches out and pulls in. The sideways push and the keel's resistance are shared constants (`StrokeMath.DRAW_DV`, `KEEL_DRAG`, `draw_drift`): one draw carries the boat about a quarter metre. Measured headless on the water, four draws moved it 0.88 m sideways and 0.01 m forward. The camp script's header also stops saying the camp returns to the title. Touch and a Kayak School drill come next.

## Slice 103 — the draw, on a phone and in Kayak School

- [x] T014dq On a phone, two quick taps on one side of the water now draw toward it (`StrokeMath.double_tap_side`). A single tap waits 0.28 s to see whether a second follows, then is the arm stroke it always was. Kayak School gains a tenth drill before the rescue: slide two metres sideways without turning the bow more than fifteen degrees, with a keyboard line and a touch line like the others. Measured headless, ten draws finish the drill and hand over to the rescue. `?scene=school&drill=draw` opens it, and the stations sweep includes it.

## Slice 104 — rafting up

- [x] T014dr On the water the partner held a fixed station two boat lengths off, so the new draw stroke had nobody to come alongside. Now each draw toward the partner closes a share of the station (`Partner.drew`, `gap`), and three draws raft the boats up, hulls touching. The partner says "Got your deck. Breathe.", and a note says what a raft is for and that paddling on breaks it (the station opens again at `SPREAD` once the boat is under way). Measured headless on a trip: the boats went from 9.6 m to 1.7 m apart. The field guide's words on the water gain Rafting up.

## Slice 105 — the rafts, remembered

- [x] T014ds Each day's record counts the times the boats rafted up (`Partner.rafts`, record field `rafts`). A raft is counted once however long it lasts, and drawing on while rafted adds none. The debrief's Each day names them ("rafted up once", "twice", "3 times"), and says nothing of a day without one. The demo debrief shows one on day two.

## Slice 106 — a raft is steady

- [x] T014dt The raft's note called it the steadiest place on the water, and now it is. Rafted up, the kayak holds and rights its roll three times as hard (`StrokeMath.RAFT_HOLD`) and cannot go over while a hand is on the other boat (`Kayak.rafted`, set each frame from the partner). Measured headless with the same kick, the boat rolled 40° alone and 15° rafted. The wind's drift now reads the keel's resistance from `StrokeMath.KEEL_DRAG` too, not a second copy of the number.

## Slice 107 — raft up in a blow

- [x] T014du The bail-outs card, up when the afternoon southerly stands against the ebb, now offers a third way through it: "Raft up with <partner>". The partner comes alongside at once (`Partner.raft_now()`, counted once in the day's rafts), the boats hold steady as in slice 106, and the note says so. Paddling on breaks the raft as before. The stream's ferry and eddy notes now wait while another note still holds the line, so the raft's note is not replaced by them the moment the card closes.

## Slice 108 — letting the wind blow through

- [x] T014dv The day's record counts the times the wind-is-up card went up (`blows`) and the times the paddler pushed on into it (`pushes`). Seamanship reads them back as a new call, "Let the wind blow through": kept when every blow was waited out in a lee or rafted out, missed with "pushed on into it 1 of 3 times" when not, and absent on a day the wind never rose. The demo debrief's day two has a blow, waited out.

## Slice 109 — pushing on, with a word

- [x] T014dw Choosing "Push on" at the wind-is-up card used to close it in silence. Now the partner answers ("Right. Stay close — I’ll call the big ones.") and the note says how to go on in it: stay within a shout, take the waves off the bow rather than on the beam, brace on the steep faces. The raft's note is shortened to two lines so neither runs into the line below it.

## Slice 110 — README catch-up

- [x] T014dx The README's tour of the Godot build names the three answers to a blow (wait in a lee, raft up, push on), the seamanship call for letting the wind blow through, and the rafts in each day's record.

## Slice 111 — glossary: Beam sea

- [x] T014dy The field guide's words on the water gain "Beam sea" (waves on the side of the boat, where a kayak rolls most), the term behind the push-on note's advice to take the waves off the bow. Sources: ACA, USCG.

## Slice 112 — raft up in a squall

- [x] T014dz With a partner along, the squall's note now says what rafting up is for and how to get there: "If it blows, raft up: Shift+A/D draws you alongside" (on a touchscreen, "double-tap a side to draw alongside"). Paddling alone, the note is unchanged. The copy moved into `Partner.rain_note`, with a test, which also keeps `sea.gd` under the linter's file length.

## Slice 113 — the school's drills, measured where the tests can reach

- [x] T014ea The six Kayak School drills that are only the boat's own motion (forward, reverse, edge, compass, draw, sweep) are measured by `SchoolDrill.measure`, a pure static, instead of inside the water scene. Five new tests paddle them headless: an edge held and let go, a draw with the bow kept and turned, a sweep on an edge and flat, a bearing held and missed, strokes counted. The drills with water or a capsize in them stay in `sea.gd`, which drops to 979 lines and has headroom again under the linter's 1000.

## Slice 114 — the push, in the day's line

- [x] T014eb The debrief's Each day now says when the paddler pushed on into the wind ("pushed on into the wind once", "twice" as "2 times"), beside the existing "waited out the wind". The demo's day two has two blows, one waited out and one pushed through, so its seamanship call shows missed.

## Slice 115 — the tide pools' manners, and a rock

- [x] T014ec The evening shore walk now reaches the tide pools properly. At the first animal of the intertidal (the ochre sea star, on Jones and on Posey) the card carries the tide-pool manners from the lessons (look, one wet finger, never pull an animal off, turn any rock you lift back as it was) and asks about a rock: "Lift the rock, set it back" finds a small Giant Pacific octopus in its den and puts it in the field guide, while "Leave the rock" says why leaving it is just as good. The take-out's float has no rock. `TidePool` (pure, tested) holds where the pools begin and the rock's two answers. `?scene=camp&walk=3` opens the walk on that card, and the stations sweep checks it (`camp-pools`). Part of T020's tide pools.

## Slice 116 — README catch-up

- [x] T014ed The README's tour names the squall as a time to raft up and the shore walk's tide-pool manners and rock.

## Slice 117 — kelp is a harbour

- [x] T014ee The kelp lesson the content has carried since the Phaser build ("Drape a stalk over your deck and you can rest without drifting") is now true on the water. A bull kelp bed slows the stream through it, by half at its heart, and a boat stopped deep in one is held: measured headless off Yellow Island, 0.02 m of drift in 300 frames in the bed against 1.01 m in open water nearby. The first time the boat rests there the note says so: "Kelp is a harbour: a stalk over the deck, and the stream goes by without you." `Kelp` (pure, tested) holds the depth and pace that count as held, and what the stream still carries.

## Slice 118 — one lesson lookup

- [x] T014ef Four scenes (assembly, packing, the water, camp) each carried their own copy of the lesson lookup; it is now `App.lesson(id)`, once. `sea.gd` is back to 979 lines, which leaves room for the roll. The source-line example in `app.gd`'s comment no longer names a brand.

## Slice 119 — the roll

- [x] T014eg Going over on a trip no longer goes straight to the swim. The first card is the roll (the content's roll lesson, unused until now): "Roll up" or "Wet exit". A paddler who learned the brace drill's hip snap in Kayak School comes up in anything short of a steep sea (`Roll.STEEP`, sea state 0.7), in seconds, with no swim counted and no time lost. Without the hip snap, or in a steep sea, the card says why it stayed over, and the wet exit leads into the rescue as before, where the swim is counted. Checked headless both ways. `Roll` is pure and tested.

## Slice 120 — the rolls, remembered

- [x] T014eh Each day's record counts the rolls (`rolls`), kept apart from the swims. The debrief's Each day says "rolled back up once", and the seamanship call "Stayed upright" stays kept with "no swims; over and rolled back up once": a roll is going over and coming back, not a swim. The demo's day two has one.

## Slice 121 — the sightings, as data

- [x] T014ei The table of what is met on each day's water (species, where, which way it faces, how close it notices you) moved out of the water scene into `Sightings.ALL`. `sea.gd` drops from 998 to 972 lines. A new content test checks every sighting is a field-guide species on one of the three days.

## Slice 122 — the brace's hips are the roll's

- [x] T014ej Finishing Kayak School's brace drill now says what it taught beyond the brace: the content's hip-snap lesson ("A sharp knee lift that rolls the boat back under you…"), and that on a trip the same snap is the roll (slice 119). The next drill waits six seconds instead of one so the note can be read.

## Slice 123 — reading the chart

- [x] T014ek Every day's route card in the float plan gives the leg as the chart does: "On the chart: 6.0 nautical miles, the first course 351° true" (`Leg.chart_line`, tested). On the first day it also carries the content's chart-reading lesson, unused until now: nautical miles as a minute of latitude, true bearings off the compass rose, depths in the water. Checked on desktop and on a phone, where the card still fits.

## Slice 124 — the rescue you give

- [x] T014el The partner can go over too. After about 25 seconds in a steep sea (the drawn sea's state 0.45, about where the bail-outs card goes up), out of a raft and with no card up, the partner capsizes once a leg: "I'm over! Come to my bow!" Their boat floats hull up where it went over. Paddle within four metres and the T-rescue is yours to give, in three cards from the rescuer's side: to the bow, drain it over your deck, hold it while they climb in. Each day's record counts the rescues given (`rescuesGiven`) and the debrief names them. `?scene=trip&over=1` puts the partner over for checks, and the stations sweep checks it (`trip-over`). Checked headless from a natural capsize at 15:00 through all three cards.
- [x] The roll's "steep sea" from slice 119 was measured against a scale the drawn sea never reaches (it runs 0.10 to 0.70), so a practised roll could never fail. `Roll.STEEP` is now 0.55 on that scale.

## Slice 125 — the HUD, built apart

- [x] T014em The water scene's heads-up pieces (the compass, the place names and where they keep out of the way, the set-and-drift and destination lines, and the dark rim that makes a line read against fog) are built by `SeaHud`, not inline in `sea.gd`'s `_ready`. `sea.gd` drops from 997 to 974 lines. Checked unchanged on desktop and phone, and the stations sweep passes.

## Slice 126 — reaching a swimmer fast

- [x] T014en When the partner goes over, the time they spend in the water before you are alongside is kept (`Partner.reach_s`, the record's `reachS`). Seamanship reads it back as a new call, "Got to a swimmer fast": kept inside a minute and a half ("alongside in 40 s"), missed past it with the reason ("4 minutes before you were alongside; nine-degree water takes the strength in about ten"), and absent on a day nobody went over. The demo's day two reaches the partner in 48 s.

## Slice 127 — README catch-up

- [x] T014eo The README's tour names kelp as a harbour, the roll, the partner's capsize and the T-rescue you give, the chart's miles and course on the float plan, and the swimmer-reached call.

## Slice 128 — a swimmer beside the boat

- [x] T014ep While the partner is over, the paddler figure leaves the upturned boat and a swimmer floats beside the cockpit: a head and the shoulders of a lifejacket at the surface, in the partner's own skin, hair and jacket colours, riding the same swell (`Partner.swimmer`). The jacket's colour is what you see first, which is the point of a bright one. Back in the boat after the T-rescue, the figure returns.

## Slice 129 — your paddler, all the way through

- [x] T014eq Bug: the paddler you pick on the outfitting screen seemed to vanish later. Two causes. On the water the figure wore a dark skull cap that hid the hair and the hairstyle, the two things that most tell one paddler from another, so only the lifejacket colour carried over. At camp nobody was drawn at all, only the empty boat. Now the water keeps the sunglasses and shows the paddler's own hair and style, and at camp the paddler stands on the beach by the boat, still in the lifejacket. Checked in the browser by picking Ayla (red hair, long, teal jacket) and opening Kayak School, the trip and camp after the save had synced. (The save itself was never lost: it reaches the browser's storage a few seconds after a change, slower in a headless test.)

## Slice 130 — the paddler you just picked, in the boat

- [x] T014er Bug: on the outfitting screen, "Your boat" (the page after "Pick your paddler") showed whoever was in the save when the screen opened, not the paddler just picked. The boat's figure was built once with the screen. `Kayak.refresh_paddler()` now redresses it from the save whenever the boat page shows. Checked in the browser by picking Ayla and turning to "Your boat".

## Slice 131 — leave no trace

- [x] T014es Each camp now ends with a morning before the next float plan: the light cuts to 07:00, the tent is struck, and the card carries the content's Leave No Trace lesson, unused until now (durable surfaces, pack out what you pack in, leave the island as you found it). After a raccoon night it adds that what they scattered up the bank goes out too. The take-out, which is not a camp, goes straight on as before.

## Slice 132 — re-entry without a float

- [x] T014et Kayak School's solo rescue drill now ends with the content's "Re-entry without a float" lesson, unused until now: a belly-down scramble onto the back deck works in calm water with practice and is much harder in waves, which is why the float earns its place.

## Slice 133 — the paddle float, and a card that fits

- [x] T014eu The packing screen's "Still on the beach" card now carries the content's paddle-float lesson when the float is one of the things left behind: it turns the paddle into an outrigger for climbing back in alone. The card also sat half off the bottom of a desktop window, its title a list of every missing item. It is now centred whatever its size, titled with the count ("10 essentials"), with the names in its body. Checked on desktop and phone.

## Slice 134 — the forecast on the VHF

- [x] T014ev The float plan's tide card now reads the wind off the radio, under the graph: "On the VHF's weather channel: wind S 10 knots at launch, building to S 14 knots by 15:00. Plan to be in a lee before then." It follows the launch as you drag it, and only advises a lee for a wind of 12 knots or more. If the VHF was left on the beach at packing, it says so instead: no radio, no forecast. `Forecast` (pure, tested) samples the authored day's wind across the leg's hours. New credit: NOAA Weather Radio (National Weather Service); new glossary term: Weather channel.

## Slice 135 — the ferry, heard first

- [x] T014ew With a VHF packed, the ferry card begins with the radio: "The VHF heard it first: the ferry calling its position to the other traffic." Without one, the card is as before. The card's words moved to `Traffic.card_text`, with a test.

## Slice 136 — README catch-up

- [x] T014ex The README's tour names the VHF's forecast on the float plan, the ferry heard on the radio, and the morning that leaves no trace.

## Slice 137 — carried the essentials

- [x] T014ey Each day's record keeps how many essentials were left on the beach at packing (`missing`), and Seamanship reads it back as a call: "Carried the essentials", kept with "pump, float, radio and the rest, every day", missed with "2 left on the beach". The demo's first day shows it kept.

## Slice 138 — no light, no being seen

- [x] T014ez A headlamp left on the beach now matters after dark: your boat shows no white light, and the night note says so. With a partner, it tells you to stay on their quarter, inside their light; alone, that nothing on the water can see you. A packed light reads as before.

## Slice 139 — no chart in the fog

- [x] T014fa A chart and compass left on the beach now matters in fog: the destination line reads "no compass" instead of a bearing to steer, and the fog note says so. With a partner, stay on their stern, because the bearing is in that boat; alone, keep the swell on one side, go slowly and stop for a long blast. A packed chart and compass reads as before.

## Slice 140 — the first-aid kit, and the tarp

- [x] T014fb The first camp card now says when the first-aid kit stayed on the beach: the blister from the paddle shaft goes untaped. With no tent packed, the camp draws the low grey tarp over the paddles that the card already describes, not an orange tent. New station `camp-unpacked` (`?scene=camp&step=1&pack=none`).

## Slice 141 — the spare paddle

- [x] T014fc If you swim in a steep sea, the paddle goes with the wave while you hold the boat. With the spare packed, the split spare comes off the deck lines and nothing is lost. Without it, the partner chases the paddle down: the rescue card says so, and the clock loses three more minutes in the water. In a moderate sea you keep hold of both, and nothing changes. `Roll.paddle_line()`, with a test.

## Slice 142 — no chart, no compass on deck

- [x] T014fd The chart and compass left on the beach are gone from the screen as well as from the notes. The chart inset is not shown on the water at all, and in fog the compass dome goes too, because the dome is the deck compass. `?pack=none` now works on the water. New station `trip-fog-unpacked`.

## Slice 143 — nothing dry to pull on

- [x] T014fe Back in the boat after a swim, the note depends on the warm layers. If they were packed, the warm layer goes on over the wet one and you paddle to warm up. If they were left on the beach, the note sends you to the nearest landing, out of the wind. `Roll.righted_note()`, with a test.

## Slice 144 — left on the beach

- [x] T014ff The debrief gets a "Left on the beach" card when essentials stayed behind at Friday Harbor. It lists each one, in the kit list's order, with what the trip charges for it: the same consequences the water and the camp already enforce, gathered where the trip is read back. A content test makes sure every essential has a cost written for it. `?scene=debrief&demo=1&pack=none` shows the empty boat's account; new station `debrief-unpacked`.

## Slice 145 — the words for the rescue and the fog

- [x] T014fg The field guide's words on the water gain four the game already uses: wet exit, paddle float, deck lines (where the pump, chart, float and split spare ride) and dead reckoning (what the fog leaves you, and why the fix after it matters). Each is cited, like every glossary entry.

## Slice 146 — rafted up in the squall

- [x] T014fh The partner's squall advice is now judged. Rafting up while it is raining is kept in the day's record (`rainRafted`). Seamanship gains "Rafted up in the squall": kept with "side by side while it blew through", missed with "rode it apart" (or how many squalls of how many). The call only appears on a trip that met rain. The demo's second day shows it kept.

## Slice 147 — showed a white light

- [x] T014fi Once the dark or the fog calls for the white light, the day's record keeps whether the boat showed one (`light`: "lit" or "unlit"). Seamanship gains "Showed a white light": kept with "on deck after dark and in the fog", missed with "the headlamp stayed on the beach: unseen once". The call only appears on a trip that met the dark or the fog. The demo's second day shows it kept.

## Slice 148 — the day's line tells the squall and the light

- [x] T014fj The debrief's "Each day" line reads the two new records. A squall ridden out side by side is "rafted up through a squall" (otherwise still "paddled through a squall"), and a boat that showed no light when it needed one adds "no white light after dark".

## Slice 149 — the deadhead

- [x] T014fk A deadhead rides near each day's line: a waterlogged log floating on end, a hand of grey wood above the surface (`Deadhead`, placed 45% along the waypoints and 14 m to one side, checked to sit in deep water on all three legs). Inside 40 m the note says what it is and to give it room. A bow on it at paddling speed jars the boat (a kick and a hull slap) and says so; drifting onto it does not. The day's record keeps `logStruck`. Check start `?scene=trip&near=log`; new station `trip-log`.

## Slice 150 — room in the water scene

- [x] T014fl The water scene had reached 995 of the lint's 1000 lines. Where the whale-watch fleet holds abeam of a pod (the side that is water along the pod's whole pass, or the nearer standoff if neither is) now lives on `WhaleWatch.abeam()` beside `station_for`, and `sea.gd` drops to 983. No change on screen; the whale and fleet stations still pass.

## Slice 151 — gave the deadheads room

- [x] T014fm The deadhead is judged. Seamanship gains "Gave the deadheads room": kept with "saw the grey wood and went round", missed with "the bow found one once" (or how many times). The call appears once a day's record carries `logStruck`. A day that hit one adds "the bow found a deadhead" to its line. The demo's second day shows it kept.

## Slice 152 — the word for the log

- [x] T014fn "Deadhead" joins the field guide's words on the water: what it is, why a chop hides it, what it does to a bow at speed, and to give it room. Cited like every entry.

## Slice 153 — clapotis under the cliffs

- [x] T014fo Under a steep shore the waves come back off the rock. `Clapotis` reads the steepest land within 30 and 60 m of the boat (the terrain is a 48 m grid, so nearer only sees a smoothed shore) and lifts the sea state by up to two thirds hard under a cliff. A beach adds nothing. Once a leg, in a sea worth the word, the note says what it is and to stand off a few boat lengths. The bail-out card still reads the channel's own sea, not the cliff's. A survey of the map puts the steepest water under Spieden Island's south shore: check start `?scene=trip&leg=1&near=cliff&launch=15`, station `trip-cliff`. "Clapotis" joins the glossary.

## Slice 154 — the partner calls the log and the cliff

- [x] T014fp The partner has words for the deadhead ("Log! Off your bow — go round it."), for a bow that found one ("You okay? Check the hull for cracks.") and for the clapotis ("Out from the rock — it's bouncing back at us."), spoken ahead of each note as for every other event.

## Slice 155 — the peregrine on Spieden's cliff, and one card at a time

- [x] T014fq The field guide's peregrine falcon is now met on the water. It perches on the lip of Spieden Island's steep south shore, above the clapotis, with a slate back, pale breast, dark hood and yellow cere (`Wildlife._peregrine`), placed on the terrain like the eagle and seals.
- [x] T014fr Fixed: two sightings coming into reach on the same frame used to show both cards one after the other, and the second overwrote the first, so the first was marked seen but never shown. Now only one sighting card shows at a time; the next waits until the first is noted. Station `trip-peregrine`.

## Slice 156 — the black oystercatcher

- [x] T014fs The field guide's black oystercatcher works the tide line beside the seals' rock on day one and again on the way home: all black, the long orange-red bill, pale legs (`Wildlife._oystercatcher`). With slice 155's fix, the kelp, the oystercatcher and the seals come up as cards one after another rather than over each other (checked headless). Station `trip-oystercatcher`.

## Slice 157 — the kingfisher on the piling

- [x] T014ft The field guide's belted kingfisher watches the harbour from an old dock piling a few boat lengths up from the launch: blue-grey, the shaggy crest, the white collar, the dagger bill (`Wildlife._kingfisher`). Its reach is short (90 m), so the trip opens clean and the card comes up as you paddle past (checked headless).

## Slice 158 — seabirds on the water

- [x] T014fu Two more of the field guide's birds are met on day one, sitting low on the water a few together (`Wildlife._seabird`, one shape coloured per species): rhinoceros auklets, sooty with an orange bill, out in mid-channel; and pigeon guillemots, black with the white wing patch, off the rocks below Jones Island. Check start `?scene=trip&near=auklets`, station `trip-auklets`; the guillemots' card was checked headless.

## Slice 159 — Dall's porpoise in the narrows

- [x] T014fv The field guide's Dall's porpoise runs through the deep, fast narrows of Spieden Channel on day two. It is the harbour porpoise's shape made stockier and black, with the bright white flank patches (`_porpoise(true)`), rolling on the same circuit. Its card was checked headless.

## Slice 160 — a river otter into Posey

- [x] T014fw The field guide's river otter swims the last stretch in to Posey Island on day two, ahead of the boat: a long dark-brown back, the flat head held up, a pale muzzle, a thick tapering tail (`Wildlife._otter`). Its card comes up well before the landing (checked headless).

## Slice 161 — a humpback on the way home

- [x] T014fx The field guide's humpback travels north up San Juan Channel on day three, off to the east of the line home (`Wildlife._humpback`). Twelve metres of dark back rolls up three times to breathe, then the pale-undersided fluke lifts as it sounds, on a thirty-second cycle. Its blow carries like the orcas', loud alongside and faint at a kilometre. The card asks for the field guide's 91 m, and the "too close" rule applies. Check start `?scene=trip&leg=2&near=humpback&launch=9`, station `trip-humpback`.

## Slice 162 — Steller sea lions, in their season

- [x] T014fy A sighting can now keep to its season: an optional `day` names the only trip day it is there, and a content test checks that day exists. Steller sea lions, which the field guide says are here "mostly autumn to spring", haul out on the low rocks west of Spieden only on the September day: a big reddish bull and two tan cows, heads up on thick necks, propped on their fore-flippers (`Wildlife._sealions`). On the July day the rocks are bare (checked headless). Check start `?scene=trip&leg=1&day=september&near=sealions`, station `trip-sealions`.

## Slice 163 — cormorants nesting on the cliff

- [x] T014fz Pelagic cormorants nest on Spieden's south cliff ledges in their season (the field guide says April to August, so the July day only), beside the peregrine (`Wildlife._cormorants`). Four slim, glossy black birds stand upright on thin necks, with the breeding season's white flank patch, and one holds its wings open to dry. Their card follows the peregrine's at the cliff.

## Slice 164 — red, right, returning

- [x] T014ga A red nun buoy marks the channel into Friday Harbor, just to the right of the line home (`NavBuoy`), on day one going out and on the last day coming in. Within 70 m the note teaches the rule the right way round for the direction: coming in, the reds stay on your right; going out, on your left; keep to the channel's edge (both checked headless). On the September day a California sea lion is sprawled across it, as they are on every buoy that will hold them (`Wildlife._buoylion`, seasonal like the Steller sea lions). "Red, right, returning" joins the glossary. Check start `?scene=trip&leg=2&day=september&near=buoy&launch=9`, station `trip-buoy`.

## Slice 165 — the day's record leaves the water scene

- [x] T014gb Making room again: `sea.gd` had reached 995 lines. The day's record for the debrief (the launch and its verdict, the landing, the swims, the wildlife given room, and the rest of the record's 38 fields) is now built by `DayRecord.keep(sea)`, and the water scene drops to 962 lines. No change in behaviour: an arrival checked headless still records the day with every field.

## Slice 166 — moon jellies in the harbour

- [x] T014gc Moon jellies drift in the calm of Friday Harbor in summer (the July day): nine pale translucent bells with the four pink horseshoes showing through, each pulsing slowly on its own beat (`Wildlife._jellies`). They sit just under the surface film, because the sea shader is opaque and lets nothing deeper read. Check start `?scene=trip&near=jellies`, station `trip-jellies`.

## Slice 167 — the madrona on Jones Island's bluff

- [x] T014gd The field guide's Pacific madrona leans out over the water from the edge of Jones Island's sunny bluff, the one tree on these shores that is not a dark cone: a bright peeling orange-red trunk and twisting limbs under a broad rounded crown, scaled to stand as tall as the firs so the red reads from the water (`Wildlife._madrona`). Check start `?scene=trip&near=madrona`, station `trip-madrona`.

## Slice 168 — the lion's mane and the fried egg

- [x] T014ge The moon jelly's bell now serves the bigger jellies too (`_jellies(n, r, bell, centre)`). A pair of lion's mane jellies, red-brown with a gold heart, drift on day two's line through the channel in summer (the July day). Three fried egg jellies, pale with a yolk-yellow centre, are in the open water of day three's crossing in late summer and autumn (the September day). Check start `?scene=trip&leg=1&near=lionsmane`, station `trip-lionsmane`; the fried egg card was checked headless.

## Slice 169 — a Garry oak in its meadow

- [x] T014gf The field guide's Garry oak stands alone in the dry meadow above the seals' rock on day one and on the way home (`Wildlife._oak`): a short, thick, gnarled trunk, crooked limbs spreading out more than up, and a lumpy rounded crown over gold grass. It reads from the water as the one rounded shape among the firs. The western red cedar is left for later: its damp north-facing slope near the route is Jones Island's north cove, where its card would land on top of the arrival.

## Slice 170 — a minke over the banks

- [x] T014gg A minke whale works alone over the west end of Spieden Channel on day two (`Wildlife._minke`): seven metres of sleek dark grey with a pointed head, a curved fin, and the white band on each flipper. It rides the humpback's surfacing cycle but never lifts a fluke, and its blow carries like the other whales'. Its card follows the orcas' when both are in reach (checked headless). Check start `?scene=trip&leg=1&near=minke`, station `trip-minke`.

## Slice 171 — the glow counts as met

- [x] T014gh The cove's bioluminescence was in the field guide but never counted as met, though the night card shows it and a tap stirs it. Now the first spark, from the night's own glow or the paddler's hand, is kept in the save like any other meeting, and the field guide's "met on the water" count includes it (checked headless).

## Slice 172 — a gillnet across the line

- [x] T014gi On the September day (the fall salmon openings) a gillnet is set across day two's line (`Gillnet`): 350 m of corks on the surface, with an orange end buoy carrying a pole and flag at each end, the net hanging below. Within 60 m the note says what it is and to go round an end, never over. A boat that crosses the cork line between the buoys has the net take its skeg: it stops dead, and the note says to back off, go round, and that a fisher's net is a livelihood. Going round an end is fine. The geometry is pure and tested. "Gillnet" joins the glossary. Check start `?scene=trip&leg=1&day=september&near=gillnet`, station `trip-gillnet`.

## Slice 173 — went round the net

- [x] T014gj The net is judged. The day's record keeps `netSnagged`: -1 on days no net was set, otherwise how many times the boat went over the corks. Seamanship gains "Went round the net": kept with "round the end buoy, clear of the corks", missed with "over the corks once, and the skeg in the mesh". It appears only on a trip that met the net. A day that went over adds "caught in a gillnet" to its debrief line.

## Slice 174 — every species has a place

- [x] T014gk A content test now makes sure every species in the field guide is met somewhere in the game: a sighting on the water, a shore walk at camp, or the cove's glow. The few the trip honestly would not meet (Southern Resident orcas, sea otter, giant Pacific octopus, sunflower star, western red cedar) are named in the test, so a new species cannot be added to the guide unmet without someone deciding it should be.

## Slice 175 — the ferry's lights

- [x] T014gl After dark and in fog the ferry shows its navigation lights (`FerryModel.set_lights`): white masthead lights high fore and aft, red to port, green to starboard, unshaded so they carry across the water. The ferry card after dark teaches reading them: the masthead lights high up, red on its port side and green on its starboard, and "see red and green together and it is coming straight at you". It still fits on a phone. Station `trip-ferry-night`.

## Slice 176 — the sea lions are heard

- [x] T014gm The field guide says sea lions are often heard before they are seen, and now they are. A synthesized run of hoarse barks (`sealion.wav`: a buzzy fundamental near 300 Hz with a rough flutter and breath) plays when the California sea lion on the harbour buoy comes into reach. The same sound slowed into a deeper roar plays for the Steller sea lions on their rocks. The recipe is the last in `tools/synth-audio.mjs`, so its draws on the shared seeded noise leave every existing sound byte-for-byte the same.

## Slice 177 — the oystercatcher pipes, the kingfisher rattles

- [x] T014gn The two birds the field guide describes by their call are now heard when they come into reach. The black oystercatcher gives a quick run of loud clear pipes near 3 kHz (`piping.wav`), and the belted kingfisher gives its dry rattle, a fast train of woody clicks (`rattle.wav`). Both recipes are appended at the end of the synth tool, so no existing sound changes.

## Slice 178 — the peregrine calls from the cliff

- [x] T014go The peregrine on Spieden's cliff is heard as well as seen: its harsh, repeated "kak-kak-kak", short nasal bursts near 1.8 kHz (`kak.wav`), when it comes into reach. The bird calls now come through one `Sound.bird(call)`.

## Slice 179 — the sécurité call in the fog

- [x] T014gp With a VHF packed, the ferry in fog is heard on the radio before its horn. The long-blast note now opens with the ferry's sécurité call giving its position; without a radio there is only the horn. The note moved into `Traffic.fog_note()` with a test, and the water scene's version of it went with it.

## Slice 180 — the partner's word on a sighting

- [x] T014gq The partner used to speak up only for the orcas' card. Now any sighting the partner has a word for opens with it: the humpback's blow, a quick minke, a lion's mane ("Hands out of the water — that one stings"), the sea lions on rock and buoy, the Dall's porpoise's rooster tails, and the seals and kelp they already had lines for. A tree gets no remark. One `_said(kind)` serves every card.

## Slice 181 — the guillemots whistle

- [x] T014gr The pigeon guillemots off Jones Island are heard: a thin, high, wheezy whistle that rises and trills (`whistle.wav`), appended last in the synth tool like the other new calls.

## Slice 182 — the partner points out the otter and the eagle

- [x] T014gs The partner has a word on the river otter, bald eagle and harbour porpoise cards (an otter at its meal, the white head on the snag, the single puff), and stays quiet for the trees.

## Slice 183 — the heron croaks

- [x] T014gt The great blue heron is heard when its card comes up: a deep, hoarse “frahnk” croak (`croak.wav`), appended last in the synth tool so the earlier sounds keep their noise.

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
