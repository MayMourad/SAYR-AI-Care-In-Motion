// Evidence across several synthetic days: the same scenario, different seeds. One run is a demonstration;
// this shows how much the result varies.
import { totalWait } from './ledger';
import { reflowSync } from './optimizer';
import { planToApply } from './plan';
import { baselineParams, buildScenario } from './scenario';
import { pct } from './metrics';
import { runBaseline, runFromSnapshot, runFull, snapshotAt } from './sim';
import type { PolicyId, ScenarioParams } from './types';

export interface SeedRow {
  seed: number;
  normal: number;
  disrupted: number;
  optimized: number | null; // null when Reflow found nothing feasible and beneficial
  saved: number;
  changes: number;
}

export function eventTimeOf(p: ScenarioParams): number {
  const t = p.outage ? p.outage.from + 15 : p.surge ? p.surge.at + 15 : p.labSlow ? p.labSlow.from + 15 : 150;
  return Math.floor(t / 5) * 5;
}

export function evaluateSeed(params: ScenarioParams, seed: number, policy: PolicyId): SeedRow {
  const p = { ...params, seed };
  const sc = buildScenario(p);
  const normalSc = buildScenario(baselineParams(p));
  const normal = totalWait(normalSc, runFull(normalSc, policy));
  const run = runBaseline(sc, policy);
  const disrupted = totalWait(sc, run.final);
  const t = eventTimeOf(p);
  const snap = snapshotAt(run, t);
  const res = reflowSync(sc, snap);
  const cand = res.candidates.find((c) => c.profile.id === res.recommendedId);
  if (!cand) return { seed, normal, disrupted, optimized: null, saved: 0, changes: 0 };
  const opt = totalWait(sc, runFromSnapshot(sc, snap, planToApply(cand.plan, res.base)));
  return { seed, normal, disrupted, optimized: opt, saved: disrupted - opt, changes: cand.changes.length };
}

export function summarize(rows: SeedRow[]) {
  const saved = rows.map((r) => r.saved).sort((a, b) => a - b);
  return {
    n: rows.length,
    improved: rows.filter((r) => r.saved > 0).length,
    worse: rows.filter((r) => r.saved < 0).length,
    meanSaved: saved.reduce((s, x) => s + x, 0) / Math.max(1, saved.length),
    median: pct(saved, 0.5),
    min: saved[0] ?? 0,
    max: saved[saved.length - 1] ?? 0,
  };
}
