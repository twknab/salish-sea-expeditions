<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (MINOR: new principles added, education materially expanded;
  nothing removed)
- Principles:
  I. Teach Real Sea Kayaking (unchanged)
  II. Real Place, Told With Respect → II. Teach the Whole Place (expanded: natural history,
      island communities, paddling history)
  NEW III. A Place of First Peoples
  III. Honest About Safety → IV (renumbered)
  NEW V. Beauty and Elegance (NON-NEGOTIABLE) — absorbs the visual half of old V
  IV. Simulation With a Game Layer → VI (renumbered)
  V. Beautiful and Mobile-First → VII. Mobile-First and Smooth (visual half moved to V)
  VI. Real Imagery, Legally Sourced → VIII (renumbered; adds cultural-content sourcing)
  VII. Simple, Testable, Deployable → IX (renumbered)
- Added sections: none (principles only)
- Templates: ✅ plan/spec/tasks templates derive gates from this file; no edit needed
- Follow-up TODOs:
  TRAK_PERMISSION — confirm with TRAK Kayaks whether the name and likeness may be used.
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
- A feature that works but looks or sounds ordinary is not finished.

### VI. Simulation With a Game Layer

The feel is a somewhat-realistic simulator with game rewards on top.

- Skills improve through practice (the tenth roll is easier than the first).
- Score comes from nights out, nautical miles, crossings made, wildlife observed at a respectful
  distance, field-guide entries, and clean camps.
- A trip MUST mix activity types (planning, packing, paddling, navigating, rescuing, camping,
  exploring tide pools, observing wildlife) so the game is never only paddling.
- The boat is a TRAK folding sea kayak — the only boat in the game — and its real characteristics
  (assembly, packability, adjustable hull) are part of play.

### VII. Mobile-First and Smooth

iPhone Safari is the primary target.

- Render at native device resolution; WebGL shaders and post-effects carry the beauty in V.
- Touch-first controls usable one-handed where possible; respect safe areas; installable as a PWA.
- Sustain 60 fps on a recent iPhone; any effect that cannot is scaled down gracefully, never
  shipped janky.
- Camera perspective (top-down, cockpit POV, or a mix) is decided by prototype, not by assumption.

### VIII. Real Imagery, Legally and Respectfully Sourced

Art is made from or derived from real references. Only public-domain or properly licensed sources
may be used (for example NOAA charts and tide predictions, USGS data, NPS and Wikimedia Commons
images under compatible licences), recordings under compatible licences, or photos and recordings
supplied by the owner.

- Every external source is recorded in a credits data file and shown on an in-game Credits screen.
- Cultural material follows III: sourced from the Nations' own publications, credited, and never
  used where permission is unclear.
- Third-party trademarks (including TRAK) are used only with the owner's permission; until then
  the boat is described generically.

### IX. Simple, Testable, Deployable

- Plain JavaScript ES modules; no framework beyond Phaser 3 without an explicit decision.
- Simulation logic (tides, currents, wind, energy, cold-water timer, skill progression, scoring)
  lives in pure functions with `node:test` unit tests, separate from Phaser scenes.
- Infrastructure is Terraform; nothing is clicked into existence. No secrets in source.

## Platform & Deployment Constraints

- Stack: Phaser 3 + Vite, built into a container served by a small dependency-free Node server,
  deployed to Google Cloud Run. Firestore backs any shared state (leaderboard). Terraform follows
  the `infra/bootstrap` + `infra/service` pattern proven in Plumber Wars.
- Progress saves locally in the browser; no account is required to play.
- The game MUST work offline once loaded, except for leaderboard features.

## Development Workflow & Quality Gates

- Non-trivial features go through Spec Kit: specify → clarify → plan → tasks → analyze → implement.
- Every spec MUST list which principles it serves and how its lessons are verified as accurate.
- Before merge: `npm test` passes, `npm run build` succeeds, and the change is checked on a
  phone-sized viewport — looking and listening, not only functioning (V).
- Any change that adds cultural content lists its sources and review status in the PR (III).
- Small, focused commits; one branch per feature.

## Governance

This constitution supersedes other project practices. Amendments are made by pull request that
updates this file, states the reason, and bumps the version: MAJOR for removing or redefining a
principle, MINOR for adding a principle or materially expanding guidance, PATCH for wording. Plans
and reviews MUST check compliance; any deviation is justified in the plan's Complexity Tracking
table.

**Version**: 1.1.0 | **Ratified**: 2026-09-30 | **Last Amended**: 2026-09-30
