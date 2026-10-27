import { advance, applyPlanToState, clone, SNAP_STEP } from './sim';
import type { ApplyItem, BaselineRun } from './sim';
import type { Scenario } from './types';

/** Accept a plan at time t: continue the run from its snapshot with the plan applied, keeping earlier snapshots. */
export function applyIntervention(sc: Scenario, run: BaselineRun, t: number, items: Record<string, ApplyItem>): BaselineRun {
  const i = Math.floor(t / SNAP_STEP);
  const st = clone(run.snaps[i]);
  applyPlanToState(sc, st, items);
  const snaps = run.snaps.slice(0, i);
  for (let tt = i * SNAP_STEP; tt <= 900; tt += SNAP_STEP) {
    advance(sc, st, tt);
    snaps.push(clone(st));
    if (!st.queue.length && tt >= sc.shiftEnd) break;
  }
  advance(sc, st, Infinity);
  return { final: st, snaps };
}
