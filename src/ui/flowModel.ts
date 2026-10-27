// View-models for the Flow Canvas. Everything here is derived from simulation state.
import { forecast, snapshotAt } from '../engine/sim';
import type { BaselineRun, SimState } from '../engine/sim';
import type { Priority, ResType, Scenario } from '../engine/types';

export type BlockKind = 'done' | 'running' | 'plan' | 'ghost' | 'preview';

export interface FBlock {
  key: string;
  jobId: string;
  patientId: string;
  code: string;
  k: number;
  resourceId: string;
  laneF?: number; // fractional lane index override (animation)
  x0: number;
  x1: number;
  kind: BlockKind;
  priority: Priority;
  type: ResType;
  wait: number; // minutes waited before this block started (actual or projected)
  changed?: boolean;
  opacity?: number;
  openEnd?: boolean;
  cause?: string;
}

export interface QueueChip {
  jobId: string;
  code: string;
  priority: Priority;
  waited: number;
}

export interface FlowModel {
  blocks: FBlock[];
  queues: Record<ResType, QueueChip[]>;
  downs: { resourceId: string; from: number; to: number; ongoing: boolean; label: string }[];
  tMax: number;
}

export const GROUPS: ResType[] = ['registration', 'vitals', 'consult', 'lab', 'checkout'];

export const GROUP_LABEL: Record<ResType, string> = {
  registration: 'Registration',
  vitals: 'Vital signs',
  consult: 'Consultation',
  lab: 'Laboratory',
  checkout: 'Checkout',
};

export const DELAY_THRESHOLD = 15;
export const LINK_THRESHOLD = 22;

const fcCache = new WeakMap<BaselineRun, Map<number, SimState>>();
export function forecastCached(sc: Scenario, run: BaselineRun, now: number): SimState {
  const idx = Math.floor(now / 5);
  let m = fcCache.get(run);
  if (!m) fcCache.set(run, (m = new Map()));
  let f = m.get(idx);
  if (!f) m.set(idx, (f = forecast(sc, snapshotAt(run, now))));
  return f;
}

export interface NowStats {
  waiting: number;
  longest: number;
  inService: number;
  completed: number;
  total: number;
  accrued: number;
}

export function nowStats(sc: Scenario, fin: SimState, model: FlowModel, now: number): NowStats {
  let waiting = 0;
  let longest = 0;
  for (const ty of GROUPS) {
    waiting += model.queues[ty].length;
    for (const c of model.queues[ty]) longest = Math.max(longest, c.waited);
  }
  let accrued = 0;
  for (const id of sc.jobOrder) {
    const js = fin.jobs[id];
    if (js.status !== 'done' || js.readyAt! > now) continue;
    accrued += Math.min(js.start!, now) - js.readyAt!;
  }
  let completed = 0;
  let total = 0;
  for (const p of sc.patients) {
    if (p.noShow) continue;
    total++;
    const last = fin.jobs[p.jobIds[p.jobIds.length - 1]];
    if (last.status === 'done' && last.end! <= now) completed++;
  }
  return { waiting, longest, inService: model.blocks.filter((b) => b.kind === 'running').length, completed, total, accrued };
}

export function emptyQueues(): Record<ResType, QueueChip[]> {
  return { registration: [], vitals: [], consult: [], lab: [], checkout: [] };
}

export function buildLiveModel(sc: Scenario, run: BaselineRun, now: number, showForecast = true): FlowModel {
  const fin = run.final;
  const blocks: FBlock[] = [];
  const started = new Set<string>();
  const codes = new Map(sc.patients.map((p) => [p.id, p.code]));
  for (const id of sc.jobOrder) {
    const js = fin.jobs[id];
    if (js.status !== 'done' || js.start! > now) continue;
    const jd = sc.jobs[id];
    started.add(id);
    const running = js.end! > now;
    blocks.push({
      key: id,
      jobId: id,
      patientId: jd.patientId,
      code: codes.get(jd.patientId)!,
      k: jd.k,
      resourceId: js.resourceId!,
      x0: js.start!,
      x1: running ? now : js.end!,
      kind: running ? 'running' : 'done',
      priority: jd.priority,
      type: jd.type,
      wait: js.start! - js.readyAt!,
      openEnd: running,
      cause: js.cause?.kind === 'outage' ? 'outage' : js.cause?.kind === 'resource' ? `after ${js.cause.ref}` : 'ready',
    });
  }
  if (showForecast) {
    const fc = forecastCached(sc, run, now);
    for (const id of sc.jobOrder) {
      if (started.has(id)) continue;
      const js = fc.jobs[id];
      if (js.status !== 'done' || js.start === undefined) continue;
      const jd = sc.jobs[id];
      const s = Math.max(js.start, now);
      blocks.push({
        key: id,
        jobId: id,
        patientId: jd.patientId,
        code: codes.get(jd.patientId)!,
        k: jd.k,
        resourceId: js.resourceId!,
        x0: s,
        x1: s + jd.expDur,
        kind: 'plan',
        priority: jd.priority,
        type: jd.type,
        wait: js.start - js.readyAt!,
      });
    }
  }
  // queues at `now`: ready, not yet started, not cancelled
  const queues = emptyQueues();
  for (const id of sc.jobOrder) {
    const js = fin.jobs[id];
    if (js.status !== 'done') continue;
    if (js.readyAt! <= now && js.start! > now) {
      const jd = sc.jobs[id];
      queues[jd.type].push({ jobId: id, code: codes.get(jd.patientId)!, priority: jd.priority, waited: now - js.readyAt! });
    }
  }
  for (const ty of GROUPS) queues[ty].sort((a, b) => b.waited - a.waited);
  return { blocks, queues, downs: downsAt(sc, now), tMax: tMaxFor(sc, fin) };
}

export function downsAt(sc: Scenario, now: number) {
  return sc.disruptions
    .filter((d) => d.from <= now)
    .map((d) => ({ resourceId: d.resourceId, from: d.from, to: d.until, ongoing: now < d.until, label: d.label }));
}

export function tMaxFor(sc: Scenario, st: SimState): number {
  let m = sc.shiftEnd + 30;
  for (const id of sc.jobOrder) {
    const js = st.jobs[id];
    if (js.status === 'done' && js.end! > m) m = js.end!;
  }
  return Math.ceil((m + 10) / 30) * 30;
}

/** Patient journey segments for a finished run (Journey Lines). */
export interface Segment {
  kind: 'service' | 'wait' | 'transfer';
  from: number;
  to: number;
  type: ResType;
  resourceId?: string;
}

export function journeySegments(sc: Scenario, st: SimState, patientId: string): Segment[] {
  const p = sc.patients.find((x) => x.id === patientId)!;
  const out: Segment[] = [];
  let prevEnd: number | null = null;
  for (const id of p.jobIds) {
    const js = st.jobs[id];
    if (js.status !== 'done') continue;
    const jd = sc.jobs[id];
    if (prevEnd !== null && js.readyAt! > prevEnd) out.push({ kind: 'transfer', from: prevEnd, to: js.readyAt!, type: jd.type });
    if (js.start! > js.readyAt!) out.push({ kind: 'wait', from: js.readyAt!, to: js.start!, type: jd.type, resourceId: js.resourceId });
    out.push({ kind: 'service', from: js.start!, to: js.end!, type: jd.type, resourceId: js.resourceId });
    prevEnd = js.end!;
  }
  return out;
}
