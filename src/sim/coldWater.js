// The 1-10-1 principle (Giesbrecht): ~1 minute of cold shock, ~10 minutes of meaningful movement,
// ~1 hour before hypothermia takes consciousness. Salish Sea water is ~10–12 °C even in summer.

export function coldStage(seconds) {
  if (seconds < 60) return { id: 'shock', title: 'Cold shock', text: 'Gasping, fast breathing. Float, keep your airway clear and get your breathing under control.' };
  if (seconds < 600) return { id: 'functional', title: 'Useful minutes', text: 'Your hands still work. This is the time to get out of the water.' };
  if (seconds < 3600) return { id: 'impaired', title: 'Losing strength', text: 'Cold hands and arms are weakening. Simplify: accept help, keep hold of the boat.' };
  return { id: 'hypothermic', title: 'Hypothermia', text: 'Consciousness is at risk. Your partner and a call on the VHF are what matter now.' };
}

/** Strength and dexterity 1..0.25 as time in the water passes. */
export function coldStrength(seconds) {
  if (seconds <= 60) return 0.85 + 0.15 * (seconds / 60); // breathlessness first
  if (seconds <= 600) return 1;
  return Math.max(0.25, 1 - ((seconds - 600) / 1800) * 0.75);
}
