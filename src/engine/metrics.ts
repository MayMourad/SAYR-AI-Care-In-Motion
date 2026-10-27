// Every figure shown in the Minutes Ledger is computed here from a finished simulation state.
import { compatible } from './sim';
import type { SimState } from './sim';
import { PATHWAY_LABEL } from './types';
import type { Priority, ResType, Scenario } from './types';

export interface PatientWait {
  patientId: string;
  code: string;
  priority: Priority;
  pathway: string;
  walkIn: boolean;
  arrival: number;
  wait: number;
  maxJobWait: number;
  endsAt: number;
  journey: number; // arrival to departure
}

export interface GroupStat {
  id: string;
  label: string;
  n: number;
  mean: number;
  p90: number;
}

export interface Episode {
  type: ResType;
  from: number;
  to: number;
  peak: number;
  unresolved: boolean;
}

export interface Violation {
  id: string;
  label: string;
  count: number;
  checked: number;
}

export interface Metrics {
  patients: PatientWait[];
  totalWait: number;
  mean: number;
  median: number;
  p90: number;
  maxWait: number;
  overtimeTotal: number;
  overtimeByRes: Record<string, number>;
  completedInShift: number;
  completedTotal: number;
  scheduledTotal: number;
  noShows: number;
  utilByRes: Record<string, number>;
  utilOverall: number;
  episodes: Episode[];
  unresolved: number;
  fairness: {
    urgentMedian: number;
    urgentP90: number;
    urgentWithinTarget: number;
    urgentCount: number;
    inversions: number;
    gini: number;
    p90OverMedian: number;
    pathwayGap: number;
    medianByPriority: Record<Priority, number>;
    meanByPathway: { pathway: string; mean: number; n: number }[];
  };
  violations: Violation[];
  violationTotal: number;
  endOfDay: number;
  meanJourney: number;
  delayedAppts: number;
  appts: number;
  incompleteAt16: number;
  groups: GroupStat[];
}

export const URGENT_TARGET = 15;
export const DELAYED_APPT_MIN = 15;
const QUEUE_THRESHOLD: Record<ResType, number> = { registration: 3, vitals: 3, consult: 4, lab: 3, checkout: 3 };
export const UNRESOLVED_MIN = 40;

export function pct(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function gini(values: number[]): number {
  const v = values.slice().sort((a, b) => a - b);
  const n = v.length;
  const sum = v.reduce((s, x) => s + x, 0);
  if (!n || sum === 0) return 0;
  let acc = 0;
  v.forEach((x, i) => (acc += (i + 1) * x));
  return (2 * acc) / (n * sum) - (n + 1) / n;
}

export function queueSeries(sc: Scenario, st: SimState): Record<ResType, { t: number; n: number }[]> {
  const out = {} as Record<ResType, { t: number; n: number }[]>;
  const count = {} as Record<ResType, number>;
  for (const k of ['registration', 'vitals', 'consult', 'lab', 'checkout'] as ResType[]) {
    out[k] = [{ t: 0, n: 0 }];
    count[k] = 0;
  }
  for (const e of st.log) {
    if (e.kind !== 'ready' && e.kind !== 'start') continue;
    const ty = sc.jobs[e.jobId!].type;
    count[ty] += e.kind === 'ready' ? 1 : -1;
    out[ty].push({ t: e.t, n: count[ty] });
  }
  return out;
}

export function computeMetrics(sc: Scenario, st: SimState): Metrics {
  const patients: PatientWait[] = [];
  let noShows = 0;
  let delayedAppts = 0;
  let appts = 0;
  for (const p of sc.patients) {
    if (p.noShow) {
      noShows++;
      continue;
    }
    let wait = 0;
    let mx = 0;
    let end = 0;
    let done = true;
    for (const id of p.jobIds) {
      const js = st.jobs[id];
      if (js.status !== 'done') {
        done = false;
        continue;
      }
      const w = js.start! - js.readyAt!;
      wait += w;
      mx = Math.max(mx, w);
      end = Math.max(end, js.end!);
      if (w >= DELAYED_APPT_MIN) delayedAppts++;
      appts++;
    }
    const first = st.jobs[p.jobIds[0]];
    const arrival = first.readyAt ?? p.sched;
    if (done) patients.push({ patientId: p.id, code: p.code, priority: p.priority, pathway: PATHWAY_LABEL[p.pathway], walkIn: p.walkIn, arrival, wait, maxJobWait: mx, endsAt: end, journey: end - arrival });
  }
  const waits = patients.map((p) => p.wait).sort((a, b) => a - b);
  const totalWait = waits.reduce((s, x) => s + x, 0);

  // overtime and utilisation
  const overtimeByRes: Record<string, number> = {};
  const utilByRes: Record<string, number> = {};
  let overtimeTotal = 0;
  let busyAll = 0;
  let availAll = 0;
  let endOfDay = 0;
  for (const r of sc.resources) {
    let last = 0;
    let busy = 0;
    for (const id of sc.jobOrder) {
      const js = st.jobs[id];
      if (js.status !== 'done' || js.resourceId !== r.id) continue;
      last = Math.max(last, js.end!);
      busy += Math.max(0, Math.min(js.end!, sc.shiftEnd) - Math.min(js.start!, sc.shiftEnd));
    }
    endOfDay = Math.max(endOfDay, last);
    const ot = Math.max(0, last - sc.shiftEnd);
    overtimeByRes[r.id] = ot;
    overtimeTotal += ot;
    const down = sc.disruptions
      .filter((d) => d.resourceId === r.id)
      .reduce((s, d) => s + Math.max(0, Math.min(d.until, sc.shiftEnd) - Math.min(d.from, sc.shiftEnd)), 0);
    const avail = sc.shiftEnd - down;
    utilByRes[r.id] = avail > 0 ? busy / avail : 0;
    busyAll += busy;
    availAll += avail;
  }

  // bottleneck episodes from the queue series
  const series = queueSeries(sc, st);
  const episodes: Episode[] = [];
  for (const ty of Object.keys(series) as ResType[]) {
    const th = QUEUE_THRESHOLD[ty];
    let open: { from: number; peak: number } | null = null;
    for (const pt of series[ty]) {
      if (pt.n >= th) {
        if (!open) open = { from: pt.t, peak: pt.n };
        else open.peak = Math.max(open.peak, pt.n);
      } else if (open) {
        episodes.push({ type: ty, from: open.from, to: pt.t, peak: open.peak, unresolved: pt.t - open.from >= UNRESOLVED_MIN });
        open = null;
      }
    }
  }
  episodes.sort((a, b) => a.from - b.from);

  // fairness
  const urgent = patients.filter((p) => p.priority === 'urgent');
  const uw = urgent.map((p) => p.wait).sort((a, b) => a - b);
  const medOf = (list: PatientWait[]) => pct(list.map((p) => p.wait).sort((a, b) => a - b), 0.5);
  const byPath = new Map<string, number[]>();
  for (const p of patients) byPath.set(p.pathway, [...(byPath.get(p.pathway) ?? []), p.wait]);
  const meanByPathway = [...byPath.entries()].map(([pathway, w]) => ({ pathway, mean: w.reduce((s, x) => s + x, 0) / w.length, n: w.length }));
  const means = meanByPathway.filter((m) => m.n >= 3).map((m) => m.mean);
  const median = pct(waits, 0.5);
  const p90 = pct(waits, 0.9);

  // independent audit of the realised schedule
  const audit = auditRun(sc, st);

  return {
    patients,
    totalWait,
    mean: waits.length ? totalWait / waits.length : 0,
    median,
    p90,
    maxWait: waits.length ? waits[waits.length - 1] : 0,
    overtimeTotal,
    overtimeByRes,
    completedInShift: patients.filter((p) => p.endsAt <= sc.shiftEnd).length,
    completedTotal: patients.length,
    scheduledTotal: sc.patients.length - noShows,
    noShows,
    utilByRes,
    utilOverall: availAll ? busyAll / availAll : 0,
    episodes,
    unresolved: episodes.filter((e) => e.unresolved).length,
    fairness: {
      urgentMedian: pct(uw, 0.5),
      urgentP90: pct(uw, 0.9),
      urgentWithinTarget: urgent.length ? urgent.filter((p) => p.maxJobWait <= URGENT_TARGET).length / urgent.length : 1,
      urgentCount: urgent.length,
      inversions: st.inversions,
      gini: gini(waits),
      p90OverMedian: median > 0 ? p90 / median : 0,
      pathwayGap: means.length ? Math.max(...means) - Math.min(...means) : 0,
      medianByPriority: {
        urgent: medOf(urgent),
        standard: medOf(patients.filter((p) => p.priority === 'standard')),
        routine: medOf(patients.filter((p) => p.priority === 'routine')),
      },
      meanByPathway,
    },
    violations: audit,
    violationTotal: audit.reduce((s, v) => s + v.count, 0),
    endOfDay,
    meanJourney: patients.length ? patients.reduce((s, p) => s + p.journey, 0) / patients.length : 0,
    delayedAppts,
    appts,
    incompleteAt16: patients.filter((p) => p.endsAt > sc.shiftEnd).length + (sc.patients.length - noShows - patients.length),
    groups: [
      groupStat('sched', 'Scheduled', patients.filter((p) => !p.walkIn)),
      groupStat('walkin', 'Walk-in', patients.filter((p) => p.walkIn)),
      groupStat('am', 'Morning arrivals (before 12:00)', patients.filter((p) => p.arrival < 240)),
      groupStat('pm', 'Afternoon arrivals (12:00 onward)', patients.filter((p) => p.arrival >= 240)),
    ],
  };
}

function groupStat(id: string, label: string, list: PatientWait[]): GroupStat {
  const w = list.map((p) => p.wait).sort((a, b) => a - b);
  return { id, label, n: w.length, mean: w.length ? w.reduce((s, x) => s + x, 0) / w.length : 0, p90: pct(w, 0.9) };
}

export function auditRun(sc: Scenario, st: SimState): Violation[] {
  const v = {
    overlap: { id: 'overlap', label: 'Resource double-booking', count: 0, checked: 0 },
    precedence: { id: 'precedence', label: 'Journey order broken', count: 0, checked: 0 },
    skill: { id: 'skill', label: 'Skill or type mismatch', count: 0, checked: 0 },
    outage: { id: 'outage', label: 'Service started during outage', count: 0, checked: 0 },
    ready: { id: 'ready', label: 'Started before patient ready', count: 0, checked: 0 },
    cap: { id: 'cap', label: `Overtime cap (${sc.otCap} min) exceeded`, count: 0, checked: 0 },
  };
  const rmap = Object.fromEntries(sc.resources.map((r) => [r.id, r]));
  const byRes: Record<string, [number, number][]> = {};
  for (const id of sc.jobOrder) {
    const js = st.jobs[id];
    if (js.status !== 'done') continue;
    const jd = sc.jobs[id];
    (byRes[js.resourceId!] ??= []).push([js.start!, js.end!]);
    v.skill.checked++;
    if (!compatible(rmap[js.resourceId!], jd)) v.skill.count++;
    v.ready.checked++;
    if (js.start! < js.readyAt! - 1e-9) v.ready.count++;
    v.precedence.checked++;
    if (jd.predId) {
      const ps = st.jobs[jd.predId];
      if (ps.status !== 'done' || js.start! < ps.end! + jd.gap - 1e-9) v.precedence.count++;
    }
    v.outage.checked++;
    if (sc.disruptions.some((d) => d.resourceId === js.resourceId && js.start! >= d.from && js.start! < d.until)) v.outage.count++;
  }
  for (const list of Object.values(byRes)) {
    list.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < list.length; i++) {
      v.overlap.checked++;
      if (list[i][0] < list[i - 1][1] - 1e-9) v.overlap.count++;
    }
  }
  for (const r of sc.resources) {
    v.cap.checked++;
    const last = Math.max(0, ...(byRes[r.id] ?? []).map((x) => x[1]));
    if (last - sc.shiftEnd > sc.otCap + 1e-9) v.cap.count++;
  }
  return Object.values(v);
}
