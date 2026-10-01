// Judging a launch time (US3): average current along the route (+ helps: the route runs north with
// the flood), the worst chop, and whether wind opposes the tide during a ~2-hour crossing.
import { channelCurrentKn } from './tides.js';
import { seaState, windAgainstTide } from './wind.js';

export function judge(launch, hours = 2) {
  let cur = 0, worst = 0, against = false, n = 0;
  for (let m = launch; m <= launch + hours * 60; m += 10, n++) {
    cur += channelCurrentKn(m);
    worst = Math.max(worst, seaState(m));
    against = against || windAgainstTide(m);
  }
  cur /= n;
  const good = cur >= 0.2 && worst < 0.3 && !against;
  const poor = against || worst > 0.45 || cur < -0.8;
  return { cur, worst, against, verdict: good ? 'good' : poor ? 'poor' : 'fair' };
}
