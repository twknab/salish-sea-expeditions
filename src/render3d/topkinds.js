// How each species with a water view behaves on the map — kept free of three.js (see keys.js).
// span: metres covered by the baked image; min: smallest on-screen size in points.
export const SPECIES_TOP = {
  humpback: { span: 16, depths: true, cycle: 14 },
  minke: { span: 10, depths: true, cycle: 9 },
  dallsPorpoise: { span: 3, depths: true, cycle: 2.5, splash: true, min: 22 },
  harbourPorpoise: { span: 2.4, depths: true, cycle: 4, min: 20 },
  stellerSeaLion: { span: 4, min: 26 },
  californiaSeaLion: { span: 3, min: 24 },
  seaOtter: { span: 1.8, min: 22 },
  riverOtter: { span: 1.6, min: 20 },
  baldEagle: { span: 2.6, fly: true, min: 30 },
  oystercatcher: { span: 1.2, min: 16 },
  moonJelly: { span: 0.6, under: true, min: 14 },
  lionsMane: { span: 1.2, under: true, min: 20 },
  friedEggJelly: { span: 0.9, under: true, min: 18 },
  waterJelly: { span: 0.4, under: true, min: 12 },
  bullKelp: { span: 4, bed: true, min: 30 },
  sugarKelp: { span: 2.2, bed: true, min: 22 },
};
