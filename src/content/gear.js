// Gear for the trip. `enables` names what the item makes possible later; leaving it behind removes
// that option (FR-007). Masses are typical.

export const GEAR = [
  { id: 'tent', name: 'Tent', massKg: 2.2, essential: false, bulky: true, enables: ['shelter'], text: 'A night out needs a roof.' },
  { id: 'sleep', name: 'Sleeping bag & pad', massKg: 2.0, essential: false, bulky: true, enables: ['sleep'], text: 'Keep it in the driest bag you have.' },
  { id: 'water', name: 'Water, 8 L', massKg: 8.0, essential: true, bulky: false, enables: ['hydration'], text: 'There is no fresh water on Jones Island in summer. Heavy — pack it low and central.' },
  { id: 'food', name: 'Food & stove', massKg: 3.5, essential: true, bulky: false, enables: ['dinner'], text: 'Pack it in a hard canister; raccoons are waiting.' },
  { id: 'layers', name: 'Warm layers', massKg: 1.0, essential: true, bulky: true, enables: ['warmth'], text: 'Even in July, the Salish Sea is about 10–12 °C.' },
  { id: 'firstAid', name: 'First-aid kit', massKg: 0.6, essential: true, bulky: false, enables: ['firstAid'], text: 'Blisters, cuts, and the day you need more.' },
  { id: 'pump', name: 'Bilge pump', massKg: 0.6, essential: true, deck: true, bulky: false, enables: ['pumpOut'], text: 'Clip it on deck: after a re-entry you need it immediately.' },
  { id: 'paddleFloat', name: 'Paddle float', massKg: 0.4, essential: true, deck: true, bulky: false, enables: ['pfRescue'], text: 'Makes solo re-entry far easier. Keep it on deck, within reach.' },
  { id: 'spare', name: 'Spare paddle', massKg: 1.0, essential: true, deck: true, bulky: false, enables: ['spare'], text: 'Split paddle under the deck lines.' },
  { id: 'vhf', name: 'VHF radio', massKg: 0.3, essential: true, deck: true, bulky: false, enables: ['radio'], text: 'Channel 16 for emergencies; you can hear ferry traffic too.' },
  { id: 'headlamp', name: 'Headlamp', massKg: 0.1, essential: true, bulky: false, enables: ['light'], text: 'Camp chores after sunset, and a light to be seen by.' },
  { id: 'chart', name: 'Chart & compass', massKg: 0.3, essential: true, deck: true, bulky: false, enables: ['navigation'], text: 'In a clear bag on the deck, where you can read it.' },
];

export const gearById = Object.fromEntries(GEAR.map((g) => [g.id, g]));
