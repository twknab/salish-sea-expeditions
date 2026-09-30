<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- Principles defined: I. Teach Real Sea Kayaking; II. Real Place, Told With Respect;
  III. Honest About Safety; IV. Simulation With a Game Layer; V. Beautiful and Mobile-First;
  VI. Real Imagery, Legally Sourced; VII. Simple, Testable, Deployable
- Added sections: Platform & Deployment Constraints; Development Workflow & Quality Gates
- Removed sections: none
- Templates:
  ✅ .specify/templates/plan-template.md — "Constitution Check" derives gates from this file; no edit needed
  ✅ .specify/templates/spec-template.md — no mandatory-section change required
  ✅ .specify/templates/tasks-template.md — no new task category required (tests are covered by VII)
- Follow-up TODOs: TRAK_PERMISSION — confirm with TRAK Kayaks whether the name and likeness may be used.
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

### II. Real Place, Told With Respect

The game is set in the real San Juan Islands (United States) and Gulf Islands (Canada), under their
real names, with real geography and realistic tide and current behaviour — including crossing Haro
Strait and the border check-in a paddler actually makes.

- Wildlife and plants are native and correctly portrayed: orca, humpback, harbour seal, sea lion,
  giant Pacific octopus, bald eagle, madrona, Douglas fir, western red cedar, bull kelp.
- The game carries a Coast Salish land acknowledgment.
- Leave No Trace and Be Whale Wise approach distances are game rules with consequences, not
  flavour text.

### III. Honest About Safety

Consequences MUST be realistic — wind against tide, fog, capsize, forgotten gear, cold water — and
never gratuitous. The game MUST NOT present an unsafe technique as correct, and MUST state clearly
(at first launch and in About) that it is not a substitute for instruction and on-water practice.

### IV. Simulation With a Game Layer

The feel is a somewhat-realistic simulator with game rewards on top: colourful and beautiful, not
cartoonish.

- Skills improve through practice (the tenth roll is easier than the first).
- Score comes from nights out, nautical miles, crossings made, wildlife observed at a respectful
  distance, and clean camps.
- A trip MUST mix activity types (planning, packing, paddling, navigating, rescuing, camping,
  exploring) so the game is never only paddling.
- The boat is a TRAK folding sea kayak — the only boat in the game — and its real characteristics
  (assembly, packability, adjustable hull) are part of play.

### V. Beautiful and Mobile-First

iPhone Safari is the primary target.

- Render at native device resolution; use WebGL shaders and post-effects for water, light, fog.
- Touch-first controls usable one-handed where possible; respect safe areas; installable as a PWA.
- Sustain 60 fps on a recent iPhone; any effect that cannot is scaled down, not shipped janky.
- Camera perspective (top-down, bow POV, or a mix) is decided by prototype, not by assumption.

### VI. Real Imagery, Legally Sourced

Art is made from or derived from real references. Only public-domain or properly licensed sources
may be used (for example NOAA charts and tide predictions, USGS data, NPS and Wikimedia Commons
images under compatible licences) or photos supplied by the owner.

- Every external source is recorded in a credits data file and shown on an in-game Credits screen.
- Third-party trademarks (including TRAK) are used only with the owner's permission; until then
  the boat is described generically.

### VII. Simple, Testable, Deployable

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
  phone-sized viewport.
- Small, focused commits; one branch per feature.

## Governance

This constitution supersedes other project practices. Amendments are made by pull request that
updates this file, states the reason, and bumps the version: MAJOR for removing or redefining a
principle, MINOR for adding a principle or materially expanding guidance, PATCH for wording. Plans
and reviews MUST check compliance; any deviation is justified in the plan's Complexity Tracking
table.

**Version**: 1.0.0 | **Ratified**: 2026-09-30 | **Last Amended**: 2026-09-30
