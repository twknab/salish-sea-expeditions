// Kayak skins, inspired by the folding kayak's real colourways: the Rebel series (Legacy Green,
// Chrome Silver, Emerald Green, Ruby Blue) and the black-deck skins. Every skin is white below the
// waterline, as the real ones are, so an upturned boat is easy to spot after a capsize.
// Brand names stay out of the game until the manufacturer agrees; colour names are descriptive.

export const SKINS = [
  { id: 'emerald', name: 'Emerald Green', deckHi: '#8fd0b0', deck: '#1f7a55', deckLo: '#145a3e', accent: '#15181b' },
  { id: 'rubyBlue', name: 'Ruby Blue', deckHi: '#7fa6e6', deck: '#1f4f8f', deckLo: '#163a6a', accent: '#9b1b30' },
  { id: 'chrome', name: 'Chrome Silver', deckHi: '#eef2f4', deck: '#9aa3a8', deckLo: '#6b747a', accent: '#15181b' },
  { id: 'legacy', name: 'Legacy Green', deckHi: '#9fb57a', deck: '#46602f', deckLo: '#2f441f', accent: '#d9b36a' },
  { id: 'blackGreen', name: 'Black & Green', deckHi: '#5a6268', deck: '#1c1f22', deckLo: '#0e1012', accent: '#2fae66' },
  { id: 'blackBlue', name: 'Black & Blue', deckHi: '#5a6268', deck: '#1c1f22', deckLo: '#0e1012', accent: '#2f7fd6' },
];

export const skinById = Object.fromEntries(SKINS.map((s) => [s.id, s]));
export const DEFAULT_SKIN = 'emerald';

export const hex = (css) => parseInt(css.slice(1), 16);
