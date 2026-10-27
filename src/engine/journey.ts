// Patient-facing estimates: many plausible futures from the planner's point of view, reported as ranges.
import { mulberry32, normal } from './rng';
import { advance, makeForecast, pushEvent } from './sim';
import type { SimState } from './sim';
import { pct } from './metrics';
import type { Scenario } from './types';

export interface StageEstimate {
  jobId: string;
  startLo: number;
  startMid: number;
  startHi: number;
  endMid: number;
}

export function journeyEstimate(sc: Scenario, snap: SimState, patientId: string, n = 40, seed = 5): Record<string, StageEstimate> {
  const rng = mulberry32(seed);
  const p = sc.patients.find((x) => x.id === patientId)!;
  const open = p.jobIds.filter((id) => snap.jobs[id].status === 'future' || snap.jobs[id].status === 'waiting');
  const starts: Record<string, number[]> = {};
  const ends: Record<string, number[]> = {};
  for (const id of open) {
    starts[id] = [];
    ends[id] = [];
  }
  const cv = sc.params.cv;
  for (let i = 0; i < n; i++) {
    const jobs2 = { ...sc.jobs };
    for (const id of sc.jobOrder) {
      const jd = sc.jobs[id];
      jobs2[id] = { ...jd, actDur: Math.max(2, Math.round(jd.expDur * Math.exp(cv * normal(rng) - (cv * cv) / 2) * 2) / 2) };
    }
    const sc2: Scenario = { ...sc, jobs: jobs2 };
    const fc = makeForecast(sc2, snap);
    fc.dm = 'actual';
    fc.queue = fc.queue.filter((e) => e.kind !== 'complete');
    for (const id of sc.jobOrder) {
      const js = fc.jobs[id];
      if (js.status === 'running') {
        js.end = Math.max(js.start! + jobs2[id].actDur, snap.t + 0.5);
        pushEvent(fc.queue, { t: js.end, kind: 'complete', id });
      }
    }
    advance(sc2, fc, Infinity);
    for (const id of open) {
      const js = fc.jobs[id];
      if (js.status === 'done') {
        starts[id].push(js.start!);
        ends[id].push(js.end!);
      }
    }
  }
  const out: Record<string, StageEstimate> = {};
  for (const id of open) {
    const s = starts[id].sort((a, b) => a - b);
    const e = ends[id].sort((a, b) => a - b);
    if (!s.length) continue;
    out[id] = { jobId: id, startLo: pct(s, 0.1), startMid: pct(s, 0.5), startHi: pct(s, 0.9), endMid: pct(e, 0.5) };
  }
  return out;
}
