# Quickstart: First Voyage

## Prerequisites

- Node 22 and npm.
- For the smoke test: Chromium via Playwright (pre-installed in the cloud environment; locally run
  `npx playwright install chromium` once).

## Run

```bash
npm install
npm run dev          # http://localhost:5173 — open on a phone on the same network, or use
                     # the browser's device toolbar at 390x844 (iPhone 15)
```

## Validate

```bash
npm test             # simulation and content rules (node:test)
npm run build        # production build succeeds
npm run smoke        # boots the build at 390x844, walks the scenes, saves screenshots to
                     # tests/smoke/out/ and prints a frame-rate sample
```

## Scenario checks (by hand, on a phone)

1. **Kayak School**: tap five kayak parts and read their names; fit feet, knees, backband and skirt
   until "connected"; paddle with long smooth strokes and see the efficiency meter beat short jabs;
   edge and sweep for a sharper turn; brace with a hip snap.
2. **Planning**: launch at 08:00 (young flood, calm) and at 16:00 (ebb against a southerly breeze);
   the second shows steep chop and costs more energy (SC-003).
3. **Crossing**: point straight at Jones Island in the flood and watch the drift; hold a ferry angle
   and see the track straighten; rest in the kelp.
4. **Wildlife**: stop for the orcas and log them respectfully; paddle toward them and see the
   warning and penalty.
5. **Capsize**: complete a roll, a paddle-float rescue, a rescue without the float, and a T-rescue
   with the partner.
6. **Camp**: pitch below the high-water line and lose the clean-camp bonus; store food; explore
   the tide pools.
7. **Debrief**: see miles, nights, species, lessons; share; reload and see the save restored.
8. **Sound**: with the screen covered, tell calm water from the tide rip and hear the orca blow.
