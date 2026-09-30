// The route from Friday Harbor to Jones Island, San Juan Channel.
//
// APPROXIMATE: outlines are hand-authored from general geography, not surveyed data, because the
// NOAA/USGS services were unreachable when this slice was built (research.md, R4). Names and
// relative positions are real; shapes are simplified. Replace with NOAA/USGS shoreline via
// scripts/fetch-coastline.mjs, and do not use this game for navigation.

import { toLocal } from '../sim/geo.js';

const ll = (pts) => pts.map(([lat, lon]) => toLocal(lat, lon));

export const CHART_APPROXIMATE = true;

export const ISLANDS = [
  {
    id: 'sanJuan', name: 'San Juan Island',
    poly: ll([
      [48.660, -123.170], [48.640, -123.125], [48.628, -123.108], [48.622, -123.098],
      [48.612, -123.086], [48.600, -123.072], [48.590, -123.058], [48.584, -123.048],
      [48.577, -123.036], [48.571, -123.034], [48.566, -123.026], [48.562, -123.018],
      [48.556, -123.016], [48.549, -123.013], [48.544, -123.015], [48.541, -123.018],
      [48.538, -123.019], [48.535, -123.016], [48.533, -123.008], [48.531, -122.998],
      [48.529, -122.986], [48.526, -122.979], [48.520, -122.977], [48.510, -122.985],
      [48.495, -123.010], [48.480, -123.060], [48.480, -123.170],
    ]),
  },
  {
    id: 'brown', name: 'Brown Island',
    poly: ll([[48.5392, -123.0078], [48.5394, -123.0035], [48.5378, -123.0012], [48.5362, -123.0030], [48.5366, -123.0072]]),
  },
  {
    id: 'turn', name: 'Turn Island',
    poly: ll([[48.5335, -122.9745], [48.5337, -122.9690], [48.5315, -122.9675], [48.5305, -122.9720]]),
  },
  {
    id: 'shaw', name: 'Shaw Island',
    poly: ll([
      [48.598, -122.978], [48.592, -122.990], [48.584, -122.988], [48.576, -122.984],
      [48.568, -122.980], [48.560, -122.971], [48.553, -122.958], [48.548, -122.938],
      [48.552, -122.905], [48.580, -122.890], [48.605, -122.900], [48.606, -122.945],
    ]),
  },
  {
    id: 'orcas', name: 'Orcas Island',
    poly: ll([
      [48.690, -123.040], [48.656, -123.036], [48.646, -123.024], [48.636, -123.012],
      [48.628, -123.002], [48.620, -122.994], [48.616, -122.980], [48.614, -122.960],
      [48.618, -122.930], [48.640, -122.890], [48.690, -122.890],
    ]),
  },
  {
    id: 'jones', name: 'Jones Island',
    poly: ll([
      [48.6222, -123.0508], [48.6232, -123.0455], [48.6218, -123.0402], [48.6190, -123.0372],
      [48.6152, -123.0385], [48.6126, -123.0418], [48.6122, -123.0468], [48.6140, -123.0515],
      [48.6178, -123.0535],
    ]),
  },
  {
    id: 'oneal', name: "O'Neal Island",
    poly: ll([[48.5850, -123.0455], [48.5855, -123.0420], [48.5838, -123.0405], [48.5826, -123.0432]]),
  },
  {
    id: 'yellow', name: 'Yellow Island',
    poly: ll([[48.5942, -123.0232], [48.5946, -123.0190], [48.5932, -123.0178], [48.5926, -123.0215]]),
  },
  {
    id: 'crane', name: 'Crane Island',
    poly: ll([[48.6010, -123.0110], [48.6005, -122.9990], [48.5975, -122.9965], [48.5962, -123.0035], [48.5980, -123.0100]]),
  },
  {
    id: 'cliff', name: 'Cliff Island',
    poly: ll([[48.6060, -123.0260], [48.6062, -123.0215], [48.6040, -123.0205], [48.6035, -123.0245]]),
  },
  {
    id: 'spieden', name: 'Spieden Island',
    poly: ll([[48.6420, -123.1450], [48.6445, -123.1200], [48.6405, -123.0900], [48.6370, -123.0950], [48.6385, -123.1300]]),
  },
];

export const PLACES = {
  launch: { name: 'Friday Harbor', ...toLocal(48.5385, -123.0172) },
  destination: { name: 'Jones Island — south cove', ...toLocal(48.6113, -123.0445) },
  pointCaution: { name: 'Point Caution', ...toLocal(48.5625, -123.0175) },
  rockyBay: { name: 'Rocky Bay', ...toLocal(48.5745, -123.0300) },
  labs: { name: 'Friday Harbor Laboratories', ...toLocal(48.5455, -123.0135) },
  sealRocks: { name: 'Seal haul-out rocks', ...toLocal(48.5905, -123.0335) },
};

// Kelp beds: sheltered water, slow current, a place to rest — and to hold onto.
export const KELP = [
  { ...toLocal(48.5605, -123.0200), r: 180 },
  { ...toLocal(48.5790, -123.0360), r: 160 },
  { ...toLocal(48.6115, -123.0440), r: 200 },
  { ...toLocal(48.5930, -123.0205), r: 120 },
];

// Eddies: behind points the current curls back on itself. `during` says which tide makes it.
export const EDDIES = [
  { ...toLocal(48.5700, -123.0290), r: 380, during: 'flood', name: 'Rocky Bay' },
  { ...toLocal(48.5585, -123.0165), r: 260, during: 'ebb', name: 'south of Point Caution' },
  { ...toLocal(48.6105, -123.0420), r: 260, during: 'flood', name: 'Jones Island south cove' },
];

// Where current meets a point, the water stands up: a tide rip.
export const RIPS = [
  { ...toLocal(48.5635, -123.0140), r: 320, name: 'off Point Caution' },
  { ...toLocal(48.6095, -123.0385), r: 220, name: 'off the south-east point of Jones Island' },
];

export const ROUTE = [
  PLACES.launch,
  toLocal(48.5405, -123.0110),
  toLocal(48.5560, -123.0105),
  toLocal(48.5700, -123.0215),
  toLocal(48.5860, -123.0320),
  toLocal(48.6010, -123.0405),
  PLACES.destination,
];

export const BOUNDS = (() => {
  const a = toLocal(48.515, -123.075), b = toLocal(48.640, -122.975);
  return { minX: a.x, minY: a.y, maxX: b.x, maxY: b.y };
})();

// Routes for vessels and animals, checked against the shoreline by tests/sim/routes.test.js.
// The inbound ferry crosses from Upright Channel, passes on the inside (north-west) of Brown
// Island and turns into the Friday Harbor terminal. Outbound runs the same line in reverse.
export const FERRY_TERMINAL = toLocal(48.5357, -123.0130);
export const FERRY_ROUTE = ll([
  [48.5440, -122.9500], [48.5450, -122.9720], [48.5440, -122.9900], [48.5418, -123.0020],
  [48.5415, -123.0070], [48.5398, -123.0110], [48.5370, -123.0128], [48.5357, -123.0130],
]);

// Orcas travel mid-channel, up San Juan Channel toward Spieden Channel.
export const ORCA_ROUTE = ll([
  [48.540, -122.992], [48.550, -122.998], [48.560, -123.004], [48.572, -123.012],
  [48.585, -123.020], [48.600, -123.035], [48.614, -123.060], [48.628, -123.075],
]);
