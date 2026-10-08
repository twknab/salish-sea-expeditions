<!--
Sync Impact Report
- Version change: 1.1.0 → 1.2.0 (MINOR: guidance materially expanded after the first playable
  pass and the move to Godot; no principle removed)
- Principles:
  I. Teach Real Sea Kayaking (unchanged)
  II. Teach the Whole Place → expanded: the world is built from real geographic data
  III. A Place of First Peoples (unchanged)
  IV. Honest About Safety (unchanged)
  V. Beauty and Elegance → expanded: sound is a co-star; good paddling is near-silent; the
     soundtrack is full pieces, not loops
  VI. Simulation With a Game Layer → expanded: the game mirrors a real expedition's day rhythm
  VII. Mobile-First and Smooth → VII. Desktop and Phone, Both Smooth
  VIII. Real Imagery, Legally Sourced → expanded: the boat is an uncredited-by-name homage; the
     maker's name and marks never appear
  IX. Simple, Testable, Deployable → expanded: Godot 4 on the rewrite; mainstream libraries and
     real datasets are preferred over hand-rolled approximations when they raise quality
- Added sections: none
- Templates: ✅ plan/spec/tasks templates derive gates from this file; no edit needed
- Follow-up TODOs:
  TRAK_PERMISSION — share the game with TRAK Kayaks as a love letter; names and marks stay out
  until they say otherwise.
  CULTURAL_REVIEW — contact Coast Salish Tribes and First Nations cultural offices before any
  cultural content ships (see III).
-->

# Salish Sea Expeditions Constitution

## Core Principles

### I. Teach Real Sea Kayaking (NON-NEGOTIABLE)

Every scene MUST teach at least one true, transferable sea-kayaking skill: chart reading, compass
bearings and dead reckoning, tide and current tables, ferry angle, strokes and bracing, rolling,
self-rescue (a paddle float makes it easier but MUST NOT be required), assisted rescues, cold-water
survival (1-10-1), packing and trim, and campcraft.

- Good seamanship is what earns reward. A player who plans a crossing at slack water MUST fare
  better than one who does not.
- Lessons are woven into play (a prompt at the moment it matters, a debrief afterwards), not
  delivered as walls of text before play.
- Factual and safety content MUST be accurate and carry a source reference in the content data.

Rationale: the game exists to make the person holding the phone a stronger sea kayaker.

### II. Teach the Whole Place

The game is as much about the Salish Sea as about paddling it. It is set in the real San Juan
Islands (United States) and Gulf Islands (Canada), under their real names, with real geography and
realistic tide and current behaviour — including crossing Haro Strait and the border check-in a
paddler actually makes. Education extends beyond kayaking to three further subjects:

- **Natural history.** Organisms are native, accurately drawn and behave truthfully: orca (Southern
  and Bigg's), humpback, harbour seal, Steller and California sea lions, river otter, harbour
  porpoise, giant Pacific octopus, sea stars, anemones, nudibranchs, moon jellies, bioluminescent
  plankton, bull kelp and eelgrass, bald eagle, pigeon guillemot, rhinoceros auklet, great blue
  heron, black oystercatcher, madrona, Douglas fir, western red cedar, Garry oak. Each has a
  field-guide entry the player unlocks by observing it, with facts that are sourced.
- **Community.** The islands are lived-in places: ferry towns, marine parks, research stations,
  the people who steward them. The game introduces them truthfully and warmly.
- **History.** Including the history of paddling itself (see III).
- Leave No Trace and Be Whale Wise approach distances are game rules with consequences, not
  flavour text.
- **The world is the real one.** Coastlines, depths, elevation, land cover, towns, docks,
  campsites and the ferry routes come from real datasets (hydrographic charts, elevation models,
  land-cover maps, OpenStreetMap) turned into game terrain by a build script. Islands have their
  real shapes at real scale; a tree stands only where the land cover says forest. Nothing is
  invented where data exists.

### III. A Place of First Peoples

The Salish Sea has been home to Coast Salish peoples since time immemorial, and the game frames
itself that way from its first screen: the player is a visitor paddling waters that were — and
remain — the homelands and highways of First Peoples on both sides of the border.

- The game opens with a land acknowledgment and names the peoples of the places the player visits,
  using their own names and, where appropriate and verified, place names in their languages.
- Coast Salish culture appears where it genuinely belongs — the cedar canoe, cedar itself,
  reef-net fishing, village sites, living traditions such as Tribal Canoe Journeys — and is
  presented as living culture, not only history.
- Paddling history is told accurately: the kayak comes from Arctic peoples (Inuit, Yup'ik,
  Unangan/Aleut) and the skin-on-frame folding kayak descends directly from their boats; the
  traditional watercraft of the Salish Sea is the cedar canoe. The game honours both and never
  conflates them.
- The game MUST NOT depict sacred or ceremonial practices, invent cultural content, or use
  cultural designs as decoration. Cultural content is drawn from sources published by the Nations
  themselves and SHOULD be reviewed by, or developed with, Coast Salish cultural representatives
  before it ships. When in doubt, leave it out.

### IV. Honest About Safety

Consequences MUST be realistic — wind against tide, fog, capsize, forgotten gear, cold water — and
never gratuitous. The game MUST NOT present an unsafe technique as correct, and MUST state clearly
(at first launch and in About) that it is not a substitute for instruction and on-water practice.

### V. Beauty and Elegance (NON-NEGOTIABLE)

This MUST be a gorgeous game. Beauty is not polish added at the end; it is a requirement every
feature is judged against.

- **The ocean is the star.** Living water: light that changes through the day, reflections of
  the islands, wind ripples and swell, foam, current lines and tide rips you can read, fog banks,
  glassy calm, sunset, and bioluminescence on a night paddle.
- **Sound is half the experience.** A layered, realistic soundscape: paddle strokes and drips,
  water on the hull, wind, gulls and eagles, the blow of an orca or humpback, sea lions barking,
  surf on a pocket beach, rain on the tent, the ferry horn. Music is sparse and never covers the
  sea.
- **Organisms are drawn beautifully and truthfully** — an octopus changing colour in a tide pool, a
  moon jelly drifting beneath the hull, a kelp forest swaying in current.
- **Elegance in the interface.** Calm, uncluttered, typographically refined; the interface
  recedes so the place can be seen. Somewhat realistic and colourful, never cartoonish.
- **Sound is a co-star, not a bed.** Good paddling is nearly silent: a clean stroke is a soft
  plant and a drip. The sea layer never drops out. The soundtrack is full pieces of music, three
  to five minutes each, melodic and EDM-inspired, with arrangements that travel, one per mood,
  rendered in stereo at full sample rate. Play talks to the music: cadence lands on the beat.
- **Stunning, not merely correct.** Lit water with reflections, foam and depth colour; a boat
  drawn with love down to its deck rigging; a human figure that moves like a paddler; a dome
  compass that swings and settles. Where a mainstream library or a real dataset raises the
  quality beyond what we can hand-roll, we bring it in (IX).
- A feature that works but looks or sounds ordinary is not finished.

### VI. Simulation With a Game Layer

The feel is a somewhat-realistic simulator with game rewards on top.

- Skills improve through practice (the tenth roll is easier than the first).
- Score comes from nights out, nautical miles, crossings made, wildlife observed at a respectful
  distance, field-guide entries, and clean camps.
- A trip MUST mix activity types (planning, packing, paddling, navigating, rescuing, camping,
  exploring tide pools, observing wildlife) so the game is never only paddling.
- The boat is a skin-on-frame folding sea kayak — the only boat in the game — and its real
  characteristics (assembly, packability, adjustable hull, float bags) are part of play.
- **The game mirrors a real expedition's rhythm.** Paddling is the spine; each paddle leads to a
  short hands-on station and back: float plan, pack and trim, launch, paddle the leg, land, make
  camp, explore, night out, next morning's float plan. Each station teaches one or two real
  practices in two to five minutes. This is how the skills of sea kayaking are actually learned.
- The first stroke comes within two minutes of the title. Everything else arrives when the trip
  needs it.

### VII. Desktop and Phone, Both Smooth

The game is built and tested on desktop first, because that is where it is developed, and it
MUST be equally at home on a phone, because that is where it will be played.

- Controls are intent-based, not gesture-per-stroke: hold to paddle at a cadence, lean the hold
  to steer, accent a stroke to practise technique, reverse, brace, edge. Desktop has keys and
  mouse; the phone has touch and tilt. Each gets first-time callouts and a Controls page.
- Every screen is checked in both a wide desktop window and a phone-portrait window, loading the
  bare page (no debug parameters), before it ships.
- Sustain 60 fps on a recent laptop and a recent iPhone; any effect that cannot is scaled down
  gracefully, never shipped janky.
- Camera perspective (chase, cockpit, high) is decided by prototype, not by assumption.

### VIII. Real Imagery, Legally and Respectfully Sourced

Art is made from or derived from real references. Only public-domain or properly licensed sources
may be used (for example NOAA charts and tide predictions, USGS data, NPS and Wikimedia Commons
images under compatible licences), recordings under compatible licences, or photos and recordings
supplied by the owner.

- Every external source is recorded in a credits data file and shown on an in-game Credits screen.
- Cultural material follows III: sourced from the Nations' own publications, credited, and never
  used where permission is unclear.
- The boat is a homage to a real folding kayak. Its colourways, rigging and internals are
  studied and modelled; the maker's name and marks never appear in art, text or interface, and
  the credits name the inspiration plainly. The game will be shared with the maker as a gift.
- Species, plants and places are each their own real asset, modelled on references, credited.

### IX. Simple, Testable, Deployable

- The shipped game on `main` is Phaser 4 + three.js; the rewrite on `experiment/godot-rewrite`
  is Godot 4 with the Compatibility renderer and a web export without threads. Each stays honest
  about what it is until the go/no-go in spec 007 is decided.
- Simulation logic (tides, currents, wind, energy, cold-water timer, skill progression, scoring)
  lives in pure functions with unit tests (`node:test` in JavaScript, headless `run_tests.gd` in
  GDScript), separate from scenes.
- **Mainstream libraries and real datasets over hand-rolled approximations** whenever they raise
  quality: terrain from elevation tiles, land cover from satellite maps, audio rendered through
  a real Web Audio engine, models from CC0 libraries where they fit. Each is recorded in an ADR
  with its licence, and in the credits.
- Infrastructure is Terraform; nothing is clicked into existence. No secrets in source.

## Platform & Deployment Constraints

- Stack: Phaser 4 + Vite on `main`, Godot 4 on the rewrite branch; either is built into a
  container served by a small dependency-free Node server, deployed to Google Cloud Run. Firestore backs any shared state (leaderboard). Terraform follows
  the `infra/bootstrap` + `infra/service` pattern proven in Plumber Wars.
- Progress saves locally in the browser; no account is required to play.
- The game MUST work offline once loaded, except for leaderboard features.

## Development Workflow & Quality Gates

- Non-trivial features go through Spec Kit: specify → clarify → plan → tasks → analyze → implement.
- Every spec MUST list which principles it serves and how its lessons are verified as accurate.
- Before merge: `npm test` passes, `npm run build` succeeds (and the Godot tests, export and
  bare-page screenshots on the rewrite), and the change is checked in a desktop window and a
  phone-sized viewport — looking and listening, not only functioning (V, VII).
- Any change that adds cultural content lists its sources and review status in the PR (III).
- Small, focused commits; one branch per feature.

## Governance

This constitution supersedes other project practices. Amendments are made by pull request that
updates this file, states the reason, and bumps the version: MAJOR for removing or redefining a
principle, MINOR for adding a principle or materially expanding guidance, PATCH for wording. Plans
and reviews MUST check compliance; any deviation is justified in the plan's Complexity Tracking
table.

**Version**: 1.2.0 | **Ratified**: 2026-09-30 | **Last Amended**: 2026-10-08
