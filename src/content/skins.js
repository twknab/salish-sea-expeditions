// Kayak skins, drawn from the real colourways of the folding kayak this game is a nod to: three
// black decks with a coloured stern panel (silver, green, blue), a red deck with a white panel, and
// a yellow deck with a two-tone blue chevron. Every hull is white below a black perimeter line, as
// the real ones are, so an upturned boat is easy to spot after a capsize.
//
// The maker's name and logo stay out of the game (constitution VIII). The chevron here is a plain
// forward-pointing band, not their mark; colour names are descriptive.
//
// panel / panelLo: the stern-deck panel, lit and shaded halves (null = no panel, deck shows through).
// mark / markLo:   the chevron on the stern deck, lit and shaded halves.

const BLACK = { deckHi: '#4a5056', deck: '#1b1e21', deckLo: '#0d0f11' };

export const SKINS = [
  { id: 'blackBlue', name: 'Black & Blue', ...BLACK, panel: '#2d9be0', panelLo: '#1c77b5', mark: '#1b1e21', markLo: '#3d4349' },
  { id: 'blackGreen', name: 'Black & Green', ...BLACK, panel: '#4fc43a', panelLo: '#2f9a2a', mark: '#1b1e21', markLo: '#3d4349' },
  { id: 'blackSilver', name: 'Black & Silver', ...BLACK, panel: '#eceef0', panelLo: '#aeb3b8', mark: '#1b1e21', markLo: '#4a4f55' },
  { id: 'red', name: 'Red & White', deckHi: '#ef6a7c', deck: '#d21f3c', deckLo: '#9a1229', panel: '#f6f6f4', panelLo: '#cbc7c3', mark: '#d21f3c', markLo: '#b3182f' },
  { id: 'yellow', name: 'Yellow & Blue', deckHi: '#fbe985', deck: '#f2d016', deckLo: '#c6a80c', panel: null, panelLo: null, mark: '#7cc0e4', markLo: '#1a6f98' },
];

/** The frame is colour-coded: blue tubes forward of the cockpit, red aft. Ribs are carbon. */
export const FRAME = { fore: '#2c86cf', aft: '#cf2a3e', rib: '#2a2c2f', stem: '#141618', bag: '#5d6468', jack: '#cfd5d8' };

export const skinById = Object.fromEntries(SKINS.map((s) => [s.id, s]));
export const DEFAULT_SKIN = 'blackBlue';

/** Old saves may name a skin that no longer exists. */
export const skinOf = (id) => skinById[id] ?? skinById[DEFAULT_SKIN];

export const hex = (css) => parseInt(css.slice(1), 16);

/** The colour that stands for a skin in small places (a swatch, a map dot). */
export const signature = (s) => s.panel && s.deck === BLACK.deck ? s.panel : s.deck;
