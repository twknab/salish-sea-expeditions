# Contract: Save format

Stored in `localStorage` under `sse.save.v1` as JSON. A missing or unparseable save starts a new
game; an older `v` is migrated or discarded, never crashes the game.

```json
{
  "v": 1,
  "seenIntro": true,
  "skills": { "forward": 120, "edging": 40, "brace": 15 },
  "totals": { "nm": 4.6, "nights": 1, "trips": 1, "score": 820 },
  "fieldGuide": { "orca": "2026-09-30", "harbourSeal": "2026-09-30" },
  "lessons": { "slackWater": "demonstrated", "ferryAngle": "met" },
  "trip": {
    "scene": "Paddle",
    "start": "ferry",
    "launchMinute": 480,
    "packing": { "bow": ["tent"], "stern": ["food"], "deck": ["pump"], "left": ["headlamp"] },
    "assembly": 0.92,
    "kayak": { "x": 0, "y": 0, "heading": 0 },
    "minute": 530,
    "log": []
  },
  "settings": { "sea": 0.9, "wildlife": 0.9, "music": 0.4, "pov": true }
}
```

`trip` is `null` between trips. Saves are written at scene boundaries (SC-008).
