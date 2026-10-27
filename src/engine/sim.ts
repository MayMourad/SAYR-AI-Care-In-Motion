// Discrete-event simulator. State is plain data so it can be snapshotted and cloned.
import { PRIORITY_RANK } from './types';
import type { JobDef, PolicyId, ResourceDef, Scenario } from './types';

export type JobStatus = 'future' | 'waiting' | 'running' | 'done' | 'cancelled';

export interface Cause {
  kind: 'ready' | 'resource' | 'outage';
  ref?: string; // job id for 'resource', disruption id for 'outage'
}

export interface JobState {
  status: JobStatus;
  readyAt?: number;
  start?: number;
  end?: number;
  resourceId?: string;
  cause?: Cause;
  pin?: string; // plan-following: only this resource may serve the job
  rank?: number; // plan-following: planned start used as dispatch key
  inversion?: boolean;
}

export interface ResState {
  busyJob?: string;
  down: boolean;
  lastJob?: string;
  lastEnd: number;
  upAt: number;
  upRef?: string;
}

type EvKind = 'complete' | 'up' | 'down' | 'noshow' | 'ready';
const EV_ORDER: Record<EvKind, number> = { complete: 0, up: 1, down: 2, noshow: 3, ready: 4 };

export interface QEvent {
  t: number;
  kind: EvKind;
  id: string;
}

export interface LogEvent {
  t: number;
  kind: 'ready' | 'start' | 'end' | 'down' | 'up' | 'noshow';
  jobId?: string;
  patientId?: string;
  resourceId?: string;
  cause?: Cause;
  wait?: number;
  disruptionId?: string;
  inversion?: boolean;
}

export interface SimState {
  t: number;
  dm: 'actual' | 'expected';
  policy: PolicyId;
  jobs: Record<string, JobState>;
  res: Record<string, ResState>;
  queue: QEvent[];
  log: LogEvent[];
  inversions: number;
  labKnown?: boolean; // forecasts only: the planner has seen the laboratory slowdown begin
}

/** Laboratory slowdown multiplier for a job starting at t. The planner only knows it once it has begun. */
export function durFactor(sc: Scenario, st: { dm: 'actual' | 'expected'; labKnown?: boolean }, jd: JobDef, t: number): number {
  if (!sc.labSlow || jd.type !== 'lab' || t < sc.labSlow.from) return 1;
  return st.dm === 'actual' || st.labKnown ? sc.labSlow.factor : 1;
}

export function pushEvent(q: QEvent[], e: QEvent) {
  let lo = 0;
  let hi = q.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const m = q[mid];
    if (m.t < e.t || (m.t === e.t && EV_ORDER[m.kind] <= EV_ORDER[e.kind])) lo = mid + 1;
    else hi = mid;
  }
  q.splice(lo, 0, e);
}

export const PIN_RELEASE = 10;

export function compatible(r: ResourceDef, j: JobDef): boolean {
  return r.type === j.type && (!j.skill || r.skills.includes(j.skill));
}

export function initState(sc: Scenario, policy: PolicyId): SimState {
  const st: SimState = { t: 0, dm: 'actual', policy, jobs: {}, res: {}, queue: [], log: [], inversions: 0 };
  for (const id of sc.jobOrder) st.jobs[id] = { status: 'future' };
  for (const r of sc.resources) st.res[r.id] = { down: false, lastEnd: 0, upAt: -1 };
  for (const p of sc.patients) {
    if (p.noShow) {
      pushEvent(st.queue, { t: p.sched + 10, kind: 'noshow', id: p.id });
    } else {
      pushEvent(st.queue, { t: p.sched + p.lateBy, kind: 'ready', id: p.jobIds[0] });
    }
  }
  for (const d of sc.disruptions) {
    pushEvent(st.queue, { t: d.from, kind: 'down', id: d.id });
    pushEvent(st.queue, { t: d.until, kind: 'up', id: d.id });
  }
  return st;
}

// Dispatch key on a common "virtual time" scale: lower = served sooner.
export function policyKey(policy: PolicyId, j: JobDef, readyAt: number): number {
  switch (policy) {
    case 'fifo':
      return readyAt;
    case 'priority':
      return readyAt - (j.priority === 'urgent' ? 90 : j.priority === 'routine' ? -15 : 0);
    case 'spt':
      return readyAt + 5 * j.expDur;
  }
}

function dispatch(sc: Scenario, st: SimState) {
  const waiting: string[] = [];
  for (const id of sc.jobOrder) if (st.jobs[id].status === 'waiting') waiting.push(id);
  if (!waiting.length) return;
  const key = (id: string) => {
    const js = st.jobs[id];
    return js.rank ?? policyKey(st.policy, sc.jobs[id], js.readyAt!);
  };
  waiting.sort((a, b) => key(a) - key(b) || sc.jobs[a].k - sc.jobs[b].k || (a < b ? -1 : 1));
  const started = new Set<string>();
  for (const id of waiting) {
    const jd = sc.jobs[id];
    const js = st.jobs[id];
    let chosen: ResourceDef | undefined;
    for (const r of sc.resources) {
      // a pinned job may use any compatible idle resource once it is running well behind its planned start
      const released = js.pin !== undefined && js.rank !== undefined && st.t - js.rank > PIN_RELEASE && compatible(r, jd);
      if (js.pin && !released ? r.id !== js.pin : !compatible(r, jd)) continue;
      const rs = st.res[r.id];
      if (rs.busyJob || rs.down) continue;
      chosen = r;
      break;
    }
    if (!chosen) continue;
    // priority inversion: a more urgent job that could have used this resource is still waiting
    let inversion = false;
    for (const other of waiting) {
      if (other === id || started.has(other)) continue;
      const od = sc.jobs[other];
      if (PRIORITY_RANK[od.priority] >= PRIORITY_RANK[jd.priority]) continue;
      const oj = st.jobs[other];
      if (oj.pin ? oj.pin === chosen.id : compatible(chosen, od)) {
        inversion = true;
        break;
      }
    }
    started.add(id);
    startJob(sc, st, id, chosen.id, inversion);
  }
}

function startJob(sc: Scenario, st: SimState, id: string, rid: string, inversion: boolean) {
  const t = st.t;
  const js = st.jobs[id];
  const rs = st.res[rid];
  const jd = sc.jobs[id];
  let cause: Cause;
  if (js.readyAt === t) cause = { kind: 'ready' };
  else if (rs.lastJob && rs.lastEnd === t) cause = { kind: 'resource', ref: rs.lastJob };
  else if (rs.upAt === t) cause = { kind: 'outage', ref: rs.upRef };
  else cause = { kind: 'resource', ref: rs.lastJob };
  const dur = (st.dm === 'actual' ? jd.actDur : jd.expDur) * durFactor(sc, st, jd, t);
  js.status = 'running';
  js.start = t;
  js.end = t + dur;
  js.resourceId = rid;
  js.cause = cause;
  js.inversion = inversion;
  rs.busyJob = id;
  if (inversion) st.inversions++;
  st.log.push({ t, kind: 'start', jobId: id, patientId: jd.patientId, resourceId: rid, cause, wait: t - js.readyAt!, inversion });
  pushEvent(st.queue, { t: t + dur, kind: 'complete', id });
}

function nextJobOf(sc: Scenario, id: string): JobDef | undefined {
  const jd = sc.jobs[id];
  return sc.jobs[`${jd.patientId}.${jd.k + 1}`];
}

export function advance(sc: Scenario, st: SimState, until: number) {
  const dis = (id: string) => sc.disruptions.find((d) => d.id === id)!;
  while (st.queue.length && st.queue[0].t <= until) {
    const tt = st.queue[0].t;
    st.t = tt;
    while (st.queue.length && st.queue[0].t === tt) {
      const ev = st.queue.shift()!;
      switch (ev.kind) {
        case 'complete': {
          const js = st.jobs[ev.id];
          const rs = st.res[js.resourceId!];
          js.status = 'done';
          js.end = tt;
          rs.busyJob = undefined;
          rs.lastJob = ev.id;
          rs.lastEnd = tt;
          st.log.push({ t: tt, kind: 'end', jobId: ev.id, patientId: sc.jobs[ev.id].patientId, resourceId: js.resourceId });
          const nx = nextJobOf(sc, ev.id);
          if (nx) pushEvent(st.queue, { t: tt + nx.gap, kind: 'ready', id: nx.id });
          break;
        }
        case 'up': {
          const d = dis(ev.id);
          const rs = st.res[d.resourceId];
          rs.down = false;
          rs.upAt = tt;
          rs.upRef = d.id;
          st.log.push({ t: tt, kind: 'up', resourceId: d.resourceId, disruptionId: d.id });
          break;
        }
        case 'down': {
          const d = dis(ev.id);
          st.res[d.resourceId].down = true;
          st.log.push({ t: tt, kind: 'down', resourceId: d.resourceId, disruptionId: d.id });
          break;
        }
        case 'noshow': {
          const p = sc.patients.find((x) => x.id === ev.id)!;
          for (const jid of p.jobIds) st.jobs[jid].status = 'cancelled';
          st.log.push({ t: tt, kind: 'noshow', patientId: p.id });
          break;
        }
        case 'ready': {
          const js = st.jobs[ev.id];
          if (js.status !== 'future') break;
          js.status = 'waiting';
          js.readyAt = tt;
          st.log.push({ t: tt, kind: 'ready', jobId: ev.id, patientId: sc.jobs[ev.id].patientId });
          break;
        }
      }
    }
    dispatch(sc, st);
  }
  if (Number.isFinite(until)) st.t = until;
}

export function clone<T>(x: T): T {
  return structuredClone(x);
}

export interface BaselineRun {
  final: SimState;
  snaps: SimState[]; // snapshot at every SNAP_STEP minutes (index = minute / SNAP_STEP)
}

export const SNAP_STEP = 5;

export function runBaseline(sc: Scenario, policy: PolicyId): BaselineRun {
  const st = initState(sc, policy);
  const snaps: SimState[] = [];
  const maxT = 900;
  for (let t = 0; t <= maxT; t += SNAP_STEP) {
    advance(sc, st, t);
    snaps.push(clone(st));
    if (!st.queue.length && t >= sc.shiftEnd) break;
  }
  advance(sc, st, Infinity);
  return { final: st, snaps };
}

export function snapshotAt(run: BaselineRun, t: number): SimState {
  const i = Math.min(run.snaps.length - 1, Math.max(0, Math.floor(t / SNAP_STEP)));
  return run.snaps[i];
}

/** Run a scenario to the end without keeping snapshots. */
export function runFull(sc: Scenario, policy: PolicyId): SimState {
  const st = initState(sc, policy);
  advance(sc, st, Infinity);
  return st;
}

/**
 * Build a deterministic forecast from a snapshot: only information the planner has.
 * Expected durations, scheduled (not actual) arrivals, no unannounced future outages or no-shows.
 */
export function makeForecast(sc: Scenario, snap: SimState): SimState {
  const fc = clone(snap);
  fc.dm = 'expected';
  const t = snap.t;
  fc.labKnown = !!sc.labSlow && t >= sc.labSlow.from;
  const known: QEvent[] = [];
  const activeDis = new Set(
    sc.disruptions.filter((d) => d.from <= t && d.until > t).map((d) => d.id),
  );
  for (const e of fc.queue) {
    if (e.kind === 'complete') continue;
    if (e.kind === 'noshow') {
      // the planner cannot know who will not turn up: treat the patient as arriving on schedule
      const p = sc.patients.find((x) => x.id === e.id)!;
      known.push({ t: Math.max(p.sched, t), kind: 'ready', id: p.jobIds[0] });
      continue;
    }
    if (e.kind === 'down') continue;
    if (e.kind === 'up' && !activeDis.has(e.id)) continue;
    if (e.kind === 'ready') {
      const jd = sc.jobs[e.id];
      if (jd.k === 0) {
        const p = sc.patients.find((x) => x.id === jd.patientId)!;
        known.push({ t: Math.max(p.sched, t + 0), kind: 'ready', id: e.id });
        continue;
      }
    }
    known.push(e);
  }
  fc.queue = [];
  for (const e of known) pushEvent(fc.queue, e);
  for (const id of sc.jobOrder) {
    const js = fc.jobs[id];
    if (js.status === 'running') {
      js.end = Math.max(js.start! + sc.jobs[id].expDur * durFactor(sc, fc, sc.jobs[id], js.start!), t + 0.5);
      pushEvent(fc.queue, { t: js.end, kind: 'complete', id });
    }
  }
  return fc;
}

export function forecast(sc: Scenario, snap: SimState): SimState {
  const fc = makeForecast(sc, snap);
  advance(sc, fc, Infinity);
  return fc;
}

/** Apply plan pins/ranks to every unstarted job, then dispatch at the snapshot time. */
export interface ApplyItem {
  resourceId: string;
  start: number;
  pin?: boolean; // reserve this resource (only for genuine reassignments)
}

export function applyPlanToState(sc: Scenario, st: SimState, items: Record<string, ApplyItem>) {
  for (const id of Object.keys(items)) {
    const js = st.jobs[id];
    if (!js || js.status === 'running' || js.status === 'done' || js.status === 'cancelled') continue;
    js.pin = items[id].pin ? items[id].resourceId : undefined;
    js.rank = items[id].start;
  }
  dispatchNow(sc, st);
}

export function dispatchNow(sc: Scenario, st: SimState) {
  dispatch(sc, st);
}

/** Continue a snapshot (real durations) under a plan until the end of the day. */
export function runFromSnapshot(sc: Scenario, snap: SimState, items: Record<string, ApplyItem>): SimState {
  const st = clone(snap);
  applyPlanToState(sc, st, items);
  advance(sc, st, Infinity);
  return st;
}
