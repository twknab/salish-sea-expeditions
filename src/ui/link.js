// Outbound links. They open in a new tab so the game (and the trip) stays where it was; progress
// is saved first in case the browser swaps the page out instead.
import { persist } from '../state.js';

export const LINKS = {
  kayak: 'https://www.trakkayaks.com/',
  maker: 'https://timknab.dev/',
};

export function openLink(url) {
  persist();
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (!w) window.location.href = url; // pop-ups blocked: go there directly; the save is kept
}
