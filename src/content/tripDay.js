// A representative summer day in San Juan Channel.
//
// Authored, not live: NOAA's prediction service was unreachable when this slice was built
// (see specs/001-first-voyage/research.md, R5). The shape is realistic for the channel — mixed
// semidiurnal tides at Friday Harbor, flood setting north-northwest up the channel and ebb
// south-southeast, an afternoon southerly that opposes the ebb. `scripts/fetch-noaa.mjs` is the
// planned replacement with real predictions for a chosen date.

export const TRIP_DAY = {
  id: 'july',
  label: 'A July day',
  blurb: 'Settled summer weather: a light morning, a fresh southerly by mid-afternoon, modest tides.',
  real: false,
  // Friday Harbor tide (metres above mean lower low water). Times are minutes since midnight.
  tides: [
    { t: -40, h: 1.3 },
    { t: 50, h: 2.4 },
    { t: 430, h: -0.2 },
    { t: 820, h: 1.9 },
    { t: 1110, h: 1.2 },
    { t: 1430, h: 2.5 },
    { t: 1850, h: 0.1 },
  ],
  // San Juan Channel current. + is flood (setting FLOOD_SET), − is ebb.
  current: [
    { t: 90, kn: 0 },
    { t: 270, kn: -1.6 },
    { t: 460, kn: 0 },
    { t: 610, kn: 1.4 },
    { t: 790, kn: 0 },
    { t: 980, kn: -2.0 },
    { t: 1170, kn: 0 },
    { t: 1320, kn: 1.2 },
    { t: 1490, kn: 0 },
  ],
  floodSetDeg: 330,
  // Wind: speed in knots, `fromDeg` is the direction it blows FROM.
  wind: [
    { t: 0, kn: 3, fromDeg: 200 },
    { t: 360, kn: 2, fromDeg: 190 },
    { t: 600, kn: 5, fromDeg: 185 },
    { t: 780, kn: 10, fromDeg: 180 },
    { t: 900, kn: 14, fromDeg: 180 },
    { t: 1080, kn: 12, fromDeg: 185 },
    { t: 1260, kn: 5, fromDeg: 200 },
    { t: 1440, kn: 3, fromDeg: 200 },
  ],
  sunrise: 330,
  sunset: 1270,
};

// The same channel on a September spring tide, with the first autumn southerly behind it: bigger
// tides, a stronger stream, a wind that is a real decision by noon and a short day to do it in.
// Same shape as the July day, so everything that reads one reads the other.
export const SEPTEMBER_DAY = {
  id: 'september',
  label: 'A September day',
  blurb: 'A spring tide and the first autumn southerly: a stronger stream, twenty knots by early afternoon, and the light gone by seven.',
  real: false,
  tides: [
    { t: -40, h: 1.6 },
    { t: 60, h: 2.9 },
    { t: 440, h: -0.6 },
    { t: 830, h: 2.3 },
    { t: 1100, h: 1.0 },
    { t: 1420, h: 3.0 },
    { t: 1850, h: -0.2 },
  ],
  current: [
    { t: 100, kn: 0 },
    { t: 280, kn: -2.4 },
    { t: 470, kn: 0 },
    { t: 620, kn: 2.0 },
    { t: 800, kn: 0 },
    { t: 990, kn: -2.8 },
    { t: 1180, kn: 0 },
    { t: 1330, kn: 1.8 },
    { t: 1500, kn: 0 },
  ],
  floodSetDeg: 330,
  wind: [
    { t: 0, kn: 6, fromDeg: 190 },
    { t: 360, kn: 4, fromDeg: 185 },
    { t: 600, kn: 9, fromDeg: 180 },
    { t: 720, kn: 15, fromDeg: 180 },
    { t: 840, kn: 21, fromDeg: 175 },
    { t: 1020, kn: 19, fromDeg: 180 },
    { t: 1200, kn: 11, fromDeg: 190 },
    { t: 1440, kn: 6, fromDeg: 195 },
  ],
  sunrise: 410,
  sunset: 1140,
};

// The days an expedition can be paddled on, in the order the title offers them.
export const TRIP_DAYS = [TRIP_DAY, SEPTEMBER_DAY];
