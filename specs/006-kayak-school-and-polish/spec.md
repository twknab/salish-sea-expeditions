# Feature Specification: Kayak School, the first lesson, and a polish pass

**Feature Branch**: `claude/game-concept-discussion-uuwa07`

**Created**: 2026-10-02

**Status**: Implemented (first pass)

**Input**: "I paddled a ton and never satisfied the six rotation strokes. The stroke sounds are too
abrasive. Give the paddler a Greenland paddle and skip the feathered Euro blade. Don't call it Boat
School — Kayak School. In orientation learn the basic strokes: forward, backward, brace, edge, turn.
The boat walkthrough should not be clipped and draggable: zoom into each part as successive
screens. Rule: content always fits the screen. A cooler, more rhythmic, EDM-inspired soundtrack.
Step up every drawing: water, land, waves, ferry, the paddler in the kayak."

**Constitution principles served** (v1.1.0): I (teach real sea kayaking: the strokes, and an
honest grading of them), V (beauty), VII (mobile-first: everything fits a phone screen).

## What changed and why

- **The first lesson was unwinnable.** A stroke counted as "rotation" only above a quality score of
  0.7, which on a phone needed a swipe over 300 ms ending in a 13% band at the hip, and each stroke
  graded "arms" subtracted one from the count. Now: the bar is 0.6, a full reach is any start in the
  top third of the zone, the hip band is 22%, only a real jab (< 180 ms) is penalised, and arm
  strokes simply do not count. Six rotation strokes, cumulative. Verified in the smoke harness:
  seven swipes → six counted → drill complete.
- **Strokes to learn:** forward, reverse (new), edging, turning with the sweep, bracing.
- **Greenland paddle:** one piece of cedar, long narrow unfeathered blades, modelled in 3D
  (`render3d/paddler.js`) and used by every paddler and in the paddle lesson. The feather lesson is
  replaced by loom, shoulders, tip and cant.
- **Kayak School** everywhere (the scene key stays `BoatSchool` in code).
- **The screen rule:** nothing is panned or clipped. The boat lesson shows the whole boat, then one
  zoomed screen per part with Back / Next (also ← →). The body lesson is the 3D paddler seated in a
  see-through boat; the hotspots are projected from the model.
- **Sounds:** the stroke is a soft low catch, a hush and a few drips; a better stroke is quieter.
- **Soundtrack:** 122 bpm, four-on-the-floor, sidechained supersaw pad and arp, plucked hook,
  claps, offbeat hats, 32-bar phrases with breakdown, build and drop. Moods as before.
- **Water and land:** seabed with sand, eelgrass and boulders under caustics in the shallows;
  breaking crests as the sea gets up; a wet margin and wrack line at the shore; canopy relief.

## Not done yet (tracked)

- The outfitting figure, the postcards and the kit flat lay are still 2D illustrations.
- The ferry deck and the camp scene have had no pass.
