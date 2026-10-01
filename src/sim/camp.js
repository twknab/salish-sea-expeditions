// Camp on Jones Island (FR-017). Elevations are metres above mean lower low water.
import { highestBetween } from './tides.js';

export const TENT_SITES = [
  { id: 'beach', name: 'Flat sand on the beach', elevation: 1.9, text: 'Soft, flat and close to the boat. Tempting.' },
  { id: 'wrack', name: 'Behind the drift logs', elevation: 2.6, text: 'Just above the line of logs and dried seaweed.' },
  { id: 'terrace', name: 'The campsite on the grassy terrace', elevation: 4.5, text: 'An established site above the beach, with a food locker.' },
];

export const FOOD_OPTIONS = [
  { id: 'tent', name: 'In the tent with you', safe: false },
  { id: 'vestibule', name: 'In the vestibule', safe: false },
  { id: 'locker', name: 'In the hard-sided food locker', safe: true },
];

/**
 * The night: does the tide reach the tent? Wave run-up adds a little on top of still water.
 * `arriveMinute` is when camp is made; the night runs until 06:00 next day.
 */
export function night(siteId, foodId, arriveMinute) {
  const site = TENT_SITES.find((s) => s.id === siteId);
  const high = highestBetween(arriveMinute, 1440 + 360);
  const flooded = site.elevation < high + 0.3;
  const raided = !FOOD_OPTIONS.find((f) => f.id === foodId).safe;
  const established = siteId === 'terrace';
  return { high, flooded, raided, established, clean: !flooded && !raided && established };
}
