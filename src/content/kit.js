// Outfitting (spec 003): what a sea kayaker wears and carries for a night on Jones Island.
// Researched, not assumed — every entry carries its sources (credits.js).

/** Water temperatures that decide the clothing (°C). */
export const SEA_TEMP = { winter: 8, summer: [10, 12], immersionBelow: 21 };

/** Dressing for immersion, in the order you put it on. */
export const LAYERS = [
  {
    id: 'base', name: 'Base layer', art: 'wearBase',
    text: 'Wool or synthetic, next to the skin. It moves sweat away so you stay dry inside everything else. Cotton holds water and stops insulating — leave it at home.',
    sourceIds: ['rei-wear', 'pm-wear'],
  },
  {
    id: 'insulation', name: 'Insulating layer', art: 'wearMid',
    text: 'Fleece top and bottoms, chosen for the water, not the air. The Salish Sea is about 8 °C in winter and only 10–12 °C in summer — dress for a swim whenever it is below about 21 °C.',
    sourceIds: ['pm-wear', 'guillemot'],
  },
  {
    id: 'drysuit', name: 'Drysuit', art: 'wearDry',
    text: 'A waterproof, breathable shell with latex gaskets at the neck and wrists and built-in socks. It keeps the water out; the layers underneath keep you warm. Crouch and let the trapped air out before you close the zip.',
    sourceIds: ['drysuit', 'guillemot'],
  },
  {
    id: 'pfd', name: 'Spray skirt & PFD', art: 'wearPfd',
    text: 'The skirt seals you into the cockpit — grab loop outside, always. The PFD goes on last and stays on: a whistle on its cord, a blunt-tipped rescue knife, the VHF in a pocket.',
    sourceIds: ['aca', 'bask'],
  },
  {
    id: 'extremities', name: 'Head, hands & feet', art: 'wearExt',
    text: 'A neoprene cap, gloves or pogies, and booties. Head and hands lose warmth fast, and booties save your feet from barnacles and oyster shell when you land. Sunglasses for the glare off the water.',
    sourceIds: ['guillemot', 'pm-wear'],
  },
];

/**
 * The weekend kit, laid out on a tarp (src/art/kit-flatlay.svg, 700 × 1000). x, y are the item's
 * centre as fractions of the drawing. `gear` names the matching item in the packing game.
 */
export const KIT_GROUPS = [
  { id: 'pfd', name: 'On you', text: 'Worn, or clipped to your PFD — it has to come with you if the boat does not.' },
  { id: 'deck', name: 'On deck', text: 'Under the deck lines, where you can reach it without opening anything.' },
  { id: 'inside', name: 'Inside the boat', text: 'In dry bags, loaded through the cockpit — this kayak has no hatches.' },
];

export const KIT = [
  { id: 'pfdVest', group: 'pfd', name: 'PFD', x: 130 / 700, y: 175 / 1000, text: 'Worn every minute on the water, zipped and snug. It only works if you have it on.', sourceIds: ['cgaux-paddlers'] },
  { id: 'whistle', group: 'pfd', name: 'Whistle', x: 300 / 700, y: 115 / 1000, text: 'Required in both countries. Carries farther than a shout and never loses its voice.', sourceIds: ['cgaux-paddlers', 'mec-mandatory'] },
  { id: 'knife', group: 'pfd', name: 'Rescue knife', x: 300 / 700, y: 235 / 1000, text: 'Blunt-tipped, on the PFD, for a tangled line. Reachable with either hand.', sourceIds: ['bask'] },
  { id: 'vhf', gear: 'vhf', group: 'pfd', name: 'VHF radio', x: 455 / 700, y: 175 / 1000, text: 'On you, not in the boat. Channel 16 reaches the Coast Guard and the ferries; you can hear traffic before you see it.', sourceIds: ['bask'] },
  { id: 'headlamp', gear: 'headlamp', group: 'pfd', name: 'Light', x: 595 / 700, y: 175 / 1000, text: 'Camp after sunset — and the white light the rules ask you to have ready if you are on the water after dark.', sourceIds: ['colregs', 'mec-mandatory'] },
  { id: 'pump', gear: 'pump', group: 'deck', name: 'Bilge pump', x: 130 / 700, y: 430 / 1000, text: 'After a re-entry the cockpit is full of water. Required in Canada (a pump or a bailer).', sourceIds: ['bask', 'mec-mandatory'] },
  { id: 'paddleFloat', gear: 'paddleFloat', group: 'deck', name: 'Paddle float', x: 350 / 700, y: 430 / 1000, text: 'Turns your paddle into an outrigger so you can climb back in alone.', sourceIds: ['bask'] },
  { id: 'throwbag', group: 'deck', name: 'Throw bag, 15 m', x: 570 / 700, y: 430 / 1000, text: 'A buoyant heaving line. Required in Canadian waters — you will cross into them.', sourceIds: ['mec-mandatory'] },
  { id: 'towline', group: 'deck', name: 'Tow line', x: 130 / 700, y: 565 / 1000, text: 'On a quick-release belt. For a tired partner, or a boat that has lost its paddler.', sourceIds: ['bask', 'kitsap-list'] },
  { id: 'chart', gear: 'chart', group: 'deck', name: 'Chart & compass', x: 350 / 700, y: 565 / 1000, text: 'In a clear case on the deck in front of you. The phone is a backup, not the plan.', sourceIds: ['kitsap-list'] },
  { id: 'spare', gear: 'spare', group: 'deck', name: 'Spare paddle', x: 570 / 700, y: 565 / 1000, text: 'In two halves under the deck lines. Paddles do get dropped.', sourceIds: ['bask'] },
  { id: 'tent', gear: 'tent', group: 'inside', name: 'Tent', x: 130 / 700, y: 745 / 1000, text: 'Poles out of the bag and packed flat: long, thin things fit a folding kayak best.', sourceIds: ['kitsap-list'] },
  { id: 'sleep', gear: 'sleep', group: 'inside', name: 'Sleeping bag & pad', x: 350 / 700, y: 745 / 1000, text: 'In your driest bag. A wet sleeping bag makes a cold night colder.', sourceIds: ['kitsap-list'] },
  { id: 'food', gear: 'food', group: 'inside', name: 'Food & stove', x: 570 / 700, y: 745 / 1000, text: 'Food in a hard canister: Jones Island’s raccoons open zips.', sourceIds: ['wa-parks-jones'] },
  { id: 'water', gear: 'water', group: 'inside', name: 'Water, 8 L', x: 130 / 700, y: 900 / 1000, text: 'Jones Island’s tap normally runs May to September, but it is off until further notice. Carry it all.', sourceIds: ['wa-parks-jones'] },
  { id: 'layers', gear: 'layers', group: 'inside', name: 'Camp clothes', x: 350 / 700, y: 900 / 1000, text: 'Dry clothes that never touch the sea: a warm layer, a hat, dry socks.', sourceIds: ['guillemot'] },
  { id: 'firstAid', gear: 'firstAid', group: 'inside', name: 'First-aid kit', x: 570 / 700, y: 900 / 1000, text: 'Blisters, cuts, and the day you need more — plus a way to call for help.', sourceIds: ['kitsap-list'] },
];

/** What the law asks for, per country. The trip crosses between them. */
export const LEGAL = [
  { country: 'United States', items: ['A wearable life jacket (PFD) for each person', 'A whistle or horn', 'A white light — a torch will do — ready to show from sunset to sunrise and in fog'], sourceIds: ['cgaux-paddlers', 'colregs'] },
  { country: 'Canada', items: ['A PFD or lifejacket for each person', 'A whistle', 'A 15 m buoyant heaving line', 'A bailer or a pump', 'A light, if out after dark or in fog'], sourceIds: ['mec-mandatory'] },
];
