// Minutes Ledger helpers: policy comparison and the measured waterfall decomposition.
import { computeMetrics } from './metrics';
import type { Metrics } from './metrics';
import type { Change } from './optimizer';
import { planToApply } from './plan';
import type { Plan } from './plan';
import { runFromSnapshot, runFull } from './sim';
import type { SimState } from './sim';
import type { PolicyId, Scenario } from './types';

export const POLICY_LABEL: Record<PolicyId, string> = {
  fifo: 'First come, first served',
  priority: 'Priority with aging',
  spt: 'Shortest task first (aged)',
};

export interface PolicyRow {
  id: string;
  label: string;
  metrics: Metrics;
}

export function policyTable(sc: Scenario): PolicyRow[] {
  return (['fifo', 'priority', 'spt'] as PolicyId[]).map((p) => ({
    id: p,
    label: POLICY_LABEL[p],
    metrics: computeMetrics(sc, runFull(sc, p)),
  }));
}

export function totalWait(sc: Scenario, st: SimState): number {
  let w = 0;
  for (const id of sc.jobOrder) {
    const js = st.jobs[id];
    if (js.status === 'done') w += js.start! - js.readyAt!;
  }
  return w;
}

export interface WaterfallStep {
  id: string;
  label: string;
  kind: 'total' | 'delta';
  value: number; // total level or signed delta in waiting minutes
  level: number; // running level after this step
  note: string;
  jobIds: string[];
}

export interface Waterfall {
  steps: WaterfallStep[];
  baseline: number;
  final: number;
  finalState: SimState;
  projectedSaving: number;
}

/**
 * Decompose the measured change in total waiting minutes into the operational changes that produced it.
 * Each bar is a real replay: the snapshot is continued with real durations under a plan that applies
 * the groups so far. The bars therefore sum exactly to the measured difference.
 */
export function waterfall(
  sc: Scenario,
  baselineFinal: SimState,
  snap: SimState,
  before: Plan,
  after: Plan,
  changes: Change[],
  labelOf: (rid: string) => string,
  projectedSaving: number,
): Waterfall {
  const baseline = totalWait(sc, baselineFinal);
  const steps: WaterfallStep[] = [{ id: 'base', label: 'Live dispatch today', kind: 'total', value: baseline, level: baseline, note: 'Total patient waiting minutes if nothing changes', jobIds: [] }];

  const beforeItems = planToApply(before);
  const afterItems = planToApply(after, before);
  const lockedState = runFromSnapshot(sc, snap, beforeItems);
  const locked = totalWait(sc, lockedState);
  steps.push({
    id: 'lock',
    label: 'Hold the current plan fixed',
    kind: 'delta',
    value: locked - baseline,
    level: locked,
    note: 'Following the projected plan rather than re-dispatching live. This is the cost or benefit of plan-following itself, before any change.',
    jobIds: [],
  });

  // group changes by what was done
  const groupMap = new Map<string, { label: string; jobs: string[]; note: string }>();
  for (const c of changes) {
    const key = c.kind === 'reassigned' ? `to:${c.toRes}` : `seq:${c.toRes}`;
    const label = c.kind === 'reassigned' ? `Moved to ${labelOf(c.toRes)}` : `Re-sequenced on ${labelOf(c.toRes)}`;
    const g = groupMap.get(key) ?? { label, jobs: [], note: '' };
    g.jobs.push(c.jobId);
    groupMap.set(key, g);
  }
  let groups = [...groupMap.values()].sort((a, b) => b.jobs.length - a.jobs.length);
  // small groups are folded together so every bar is a meaningful operational change
  const big = groups.filter((g) => g.jobs.length >= 3).slice(0, 4);
  const small = groups.filter((g) => !big.includes(g));
  groups = big;
  if (small.length) {
    const merged = { label: 'Other adjustments', jobs: small.flatMap((g) => g.jobs), note: '' };
    if (groups.length) groups.push(merged);
    else groups = [merged];
  }

  const applied = { ...beforeItems };
  let level = locked;
  let finalState = lockedState;
  groups.forEach((g, i) => {
    const last = i === groups.length - 1;
    let items: Record<string, { resourceId: string; start: number }>;
    if (last) items = afterItems;
    else {
      for (const id of g.jobs) applied[id] = afterItems[id];
      items = applied;
    }
    const st = runFromSnapshot(sc, snap, items);
    const w = totalWait(sc, st);
    steps.push({
      id: `g${i}`,
      label: g.label,
      kind: 'delta',
      value: w - level,
      level: w,
      note: `${g.jobs.length} appointment${g.jobs.length === 1 ? '' : 's'} changed`,
      jobIds: g.jobs,
    });
    level = w;
    finalState = st;
  });
  steps.push({ id: 'final', label: 'With the proposal', kind: 'total', value: level, level, note: 'Measured on the same patients and the same realised durations', jobIds: [] });
  return { steps, baseline, final: level, finalState, projectedSaving };
}
