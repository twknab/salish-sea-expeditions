// Who is paddling. Six ready-made paddlers that look like the people on the water in the Salish
// Sea, and the parts they are made of for anyone who wants their own. No gender is declared for
// any of them: hair, build and colour are all that is drawn, and the player decides the rest.

export const SKIN_TONES = [
  { id: 'deep', hex: '#4b2e21' }, { id: 'brown', hex: '#7a4a2e' }, { id: 'tan', hex: '#a8714a' },
  { id: 'olive', hex: '#c0946a' }, { id: 'light', hex: '#dcb79a' }, { id: 'fair', hex: '#f0d2bd' },
];
export const HAIR_COLOURS = [
  { id: 'black', hex: '#15110f' }, { id: 'dark', hex: '#3a2a20' }, { id: 'brown', hex: '#6a4a32' },
  { id: 'red', hex: '#8d4a24' }, { id: 'blond', hex: '#c9a66b' }, { id: 'grey', hex: '#a8a6a0' },
];
export const HAIR_STYLES = [
  { id: 'short', name: 'Short' }, { id: 'crop', name: 'Close crop' }, { id: 'long', name: 'Long, tied back' },
  { id: 'bun', name: 'Bun' }, { id: 'wrap', name: 'Head wrap' },
];
export const BUILDS = [
  { id: 'small', name: 'Small', scale: 0.92 }, { id: 'medium', name: 'Medium', scale: 1.0 }, { id: 'tall', name: 'Tall', scale: 1.08 },
];
export const PFD_COLOURS = [
  { id: 'sun', hex: '#f2d016' }, { id: 'coral', hex: '#e2563a' }, { id: 'teal', hex: '#1f8a8f' }, { id: 'violet', hex: '#6b4fa3' },
];

export const PADDLERS = [
  { id: 'mina', name: 'Mina', skin: 'deep', hair: 'black', style: 'crop', build: 'medium', pfd: 'coral' },
  { id: 'tomas', name: 'Tomás', skin: 'tan', hair: 'dark', style: 'short', build: 'tall', pfd: 'sun' },
  { id: 'ayla', name: 'Ayla', skin: 'fair', hair: 'red', style: 'long', build: 'medium', pfd: 'teal' },
  { id: 'kai', name: 'Kai', skin: 'light', hair: 'black', style: 'bun', build: 'small', pfd: 'violet' },
  { id: 'noor', name: 'Noor', skin: 'brown', hair: 'dark', style: 'wrap', build: 'medium', pfd: 'sun' },
  { id: 'sam', name: 'Sam', skin: 'olive', hair: 'grey', style: 'short', build: 'tall', pfd: 'teal' },
];
