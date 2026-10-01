// Assembling the folding kayak (FR-006). Order matters, and a rushed tension step costs tracking.

export const ASSEMBLY_STEPS = [
  { id: 'unroll', label: 'Unroll the skin on a clean, flat spot', gesture: 'swipeOut' },
  { id: 'frame', label: 'Snap the frame sections together', gesture: 'tapRhythm' },
  { id: 'insert', label: 'Slide the frame into the skin, bow first', gesture: 'swipeUp' },
  { id: 'coaming', label: 'Seat the coaming and close the deck', gesture: 'circle' },
  { id: 'seat', label: 'Fit the seat, backband and foot pegs', gesture: 'tapRhythm' },
  { id: 'jackSides', label: 'Tension the two side jacks', gesture: 'hold' },
  { id: 'jackKeel', label: 'Tension the keel jack — sets the rocker', gesture: 'hold' },
  { id: 'check', label: 'Check: skin tight, frame seated, no wrinkles', gesture: 'tapRhythm' },
];

/** Overall assembly quality 0..1 from per-step qualities (missing steps count as 0.4). */
export function assemblyQuality(results) {
  const q = ASSEMBLY_STEPS.map((s) => results[s.id] ?? 0.4);
  const tension = (q[5] + q[6]) / 2;
  const mean = q.reduce((a, b) => a + b, 0) / q.length;
  return Math.max(0.3, Math.min(1, 0.5 * mean + 0.5 * tension));
}
