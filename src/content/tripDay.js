// A representative summer day in San Juan Channel.
//
// Authored, not live: NOAA's prediction service was unreachable when this slice was built
// (see specs/001-first-voyage/research.md, R5). The shape is realistic for the channel — mixed
// semidiurnal tides at Friday Harbor, flood setting north-northwest up the channel and ebb
// south-southeast, an afternoon southerly that opposes the ebb. `scripts/fetch-noaa.mjs` is the
// planned replacement with real predictions for a chosen date.

export const TRIP_DAY = {
  label: 'A July day',
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
