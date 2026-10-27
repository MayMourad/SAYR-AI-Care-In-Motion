// Planning model shared by the optimizer, the validator and the Resource Board.
import { forecast } from './sim';
import type { ApplyItem, SimState } from './sim';
import { compatible } from './sim';
import type { Priority, ResourceDef, Scenario } from './types';

export const HARM_CAP = 30; // no patient's projected wait may grow by more than this
export const FREEZE = 5; // starts inside this window are committed and cannot be reassigned

export interface PJob {
  id: string;
  patientId: string;
  k: number;
  type: string;
  skill?: string;
  dur: number;
  prio: Priority;
  predId?: string; // predecessor only when it is also unstarted (inside the problem)
  gap: number;
  baseReady: number; // ready time when predecessor is outside the problem
}

export interface Problem {
  sc: Scenario;
  t: number;
  jobs: Record<string, PJob>;
  order: string[];
  resources: ResourceDef[];
  avail: Record<string, number>;
  running: Record<string, { jobId: string; start: number; end: number }>;
  shiftEnd: number;
  otCap: number;
}

export interface PlanItem {
  jobId: string;
  resourceId: string;
  start: number;
  end: number;
  ready: number;
  wait: number;
}

export type Seq = Record<string, string[]>;

export interface Plan {
  seq: Seq;
  items: Record<string, PlanItem>;
}

export function buildProblem(sc: Scenario, snap: SimState): Problem {
  const t = snap.t;
  const jobs: Record<string, PJob> = {};
  const order: string[] = [];
  const pending = new Map<string, number>();
  for (const e of snap.queue) if (e.kind === 'ready') pending.set(e.id, e.t);
  const open = (id: string) => snap.jobs[id].status === 'future' || snap.jobs[id].status === 'waiting';
  for (const id of sc.jobOrder) {
    const js = snap.jobs[id];
    if (!open(id)) continue;
    const jd = sc.jobs[id];
    let predId: string | undefined;
    let baseReady = 0;
    if (js.status === 'waiting') {
      baseReady = js.readyAt!;
    } else if (jd.k === 0) {
      const p = sc.patients.find((x) => x.id === jd.patientId)!;
      baseReady = Math.max(p.sched, t);
    } else {
      const ps = snap.jobs[jd.predId!];
      if (open(jd.predId!)) predId = jd.predId;
      else if (ps.status === 'running') {
        const pj = sc.jobs[jd.predId!];
        baseReady = Math.max(ps.start! + pj.expDur * (sc.labSlow && pj.type === 'lab' && t >= sc.labSlow.from && ps.start! >= sc.labSlow.from ? sc.labSlow.factor : 1), t + 0.5) + jd.gap;
      }
      else baseReady = pending.get(id) ?? t;
    }
    jobs[id] = {
      id,
      patientId: jd.patientId,
      k: jd.k,
      type: jd.type,
      skill: jd.skill,
      dur: jd.expDur * (sc.labSlow && jd.type === 'lab' && t >= sc.labSlow.from ? sc.labSlow.factor : 1),
      prio: jd.priority,
      predId,
      gap: jd.gap,
      baseReady,
    };
    order.push(id);
  }
  const avail: Record<string, number> = {};
  const running: Problem['running'] = {};
  for (const r of sc.resources) {
    let a = t;
    const rs = snap.res[r.id];
    if (rs.busyJob) {
      const js = snap.jobs[rs.busyJob];
      const rj = sc.jobs[rs.busyJob];
      const end = Math.max(js.start! + rj.expDur * (sc.labSlow && rj.type === 'lab' && t >= sc.labSlow.from && js.start! >= sc.labSlow.from ? sc.labSlow.factor : 1), t + 0.5);
      running[r.id] = { jobId: rs.busyJob, start: js.start!, end };
      a = Math.max(a, end);
    }
    if (rs.down) {
      const d = sc.disruptions.find((x) => x.resourceId === r.id && x.from <= t && x.until > t);
      if (d) a = Math.max(a, d.until);
    }
    avail[r.id] = a;
  }
  return { sc, t, jobs, order, resources: sc.resources, avail, running, shiftEnd: sc.shiftEnd, otCap: sc.otCap };
}

export function jobCompat(r: ResourceDef, j: PJob): boolean {
  return r.type === j.type && (!j.skill || r.skills.includes(j.skill));
}

export function decode(pb: Problem, seq: Seq): Plan | null {
  const items: Record<string, PlanItem> = {};
  const rids = pb.resources.map((r) => r.id);
  const idx: Record<string, number> = {};
  const prevEnd: Record<string, number> = {};
  for (const r of rids) {
    idx[r] = 0;
    prevEnd[r] = pb.avail[r];
  }
  let remaining = 0;
  for (const r of rids) remaining += seq[r]?.length ?? 0;
  let progress = true;
  while (remaining > 0 && progress) {
    progress = false;
    for (const r of rids) {
      const s = seq[r];
      if (!s) continue;
      while (idx[r] < s.length) {
        const j = pb.jobs[s[idx[r]]];
        let ready = j.baseReady;
        if (j.predId) {
          const pi = items[j.predId];
          if (!pi) break;
          ready = pi.end + j.gap;
        }
        const start = Math.max(ready, pb.t, prevEnd[r]);
        const end = start + j.dur;
        items[j.id] = { jobId: j.id, resourceId: r, start, end, ready, wait: start - ready };
        prevEnd[r] = end;
        idx[r]++;
        remaining--;
        progress = true;
      }
    }
  }
  return remaining === 0 ? { seq, items } : null;
}

export function seqFromItems(pb: Problem, items: Record<string, { resourceId: string; start: number }>): Seq {
  const seq: Seq = {};
  for (const r of pb.resources) seq[r.id] = [];
  for (const id of pb.order) {
    const it = items[id];
    if (it) seq[it.resourceId].push(id);
  }
  for (const r of Object.keys(seq)) seq[r].sort((a, b) => items[a].start - items[b].start || (a < b ? -1 : 1));
  return seq;
}

/** The "before" plan: what the current dispatch policy is projected to do, expressed as sequences. */
export function baselinePlan(sc: Scenario, snap: SimState, pb: Problem): Plan {
  const fc = forecast(sc, snap);
  const items: Record<string, { resourceId: string; start: number }> = {};
  for (const id of pb.order) {
    const js = fc.jobs[id];
    items[id] = { resourceId: js.resourceId!, start: js.start! };
  }
  const plan = decode(pb, seqFromItems(pb, items));
  if (!plan) throw new Error('baseline plan failed to decode');
  return plan;
}

export interface PlanStats {
  totalWait: number;
  maxWait: number;
  overtime: number;
  otByRes: Record<string, number>;
  urgentWait: number;
}

export function planStats(pb: Problem, plan: Plan): PlanStats {
  let total = 0;
  let max = 0;
  let urgent = 0;
  const last: Record<string, number> = {};
  for (const r of pb.resources) last[r.id] = pb.running[r.id]?.end ?? 0;
  for (const id of pb.order) {
    const it = plan.items[id];
    total += it.wait;
    if (it.wait > max) max = it.wait;
    if (pb.jobs[id].prio === 'urgent') urgent += it.wait;
    if (it.end > last[it.resourceId]) last[it.resourceId] = it.end;
  }
  const otByRes: Record<string, number> = {};
  let overtime = 0;
  for (const r of pb.resources) {
    const ot = Math.max(0, last[r.id] - pb.shiftEnd);
    otByRes[r.id] = ot;
    overtime += ot;
  }
  return { totalWait: total, maxWait: max, overtime, otByRes, urgentWait: urgent };
}

export interface CheckResult {
  id: string;
  label: string;
  rule: string;
  checked: number;
  violations: number;
  detail: string[];
}

const EPS = 1e-6;

/** Independent validation of a plan (explicit start times) against the baseline plan. */
export function validatePlan(pb: Problem, base: Plan, items: Record<string, PlanItem>): CheckResult[] {
  const res = (id: string, label: string, rule: string): CheckResult => ({ id, label, rule, checked: 0, violations: 0, detail: [] });
  const c1 = res('exclusive', 'Resource exclusivity', 'One appointment per resource at a time; in-progress work is never overlapped.');
  const c2 = res('precedence', 'Journey order and transfers', 'Each stage starts after the previous stage ends plus its transfer time.');
  const c3 = res('skill', 'Skill compatibility', 'Each appointment sits on a resource of the right type and skill.');
  const c4 = res('time', 'Not before ready or now', 'No appointment starts before the patient is ready or before the present moment.');
  const c5 = res('outage', 'Outages respected', 'Nothing is placed on a resource while it is unavailable.');
  const c6 = res('priority', 'Protected slots', 'No protected-slot patient (an externally assigned, non-clinical class) waits longer than in the current plan.');
  const c7 = res('harm', 'Bounded individual harm', `No patient’s wait grows by more than ${HARM_CAP} min.`);
  const c8 = res('overtime', 'Overtime not increased', 'No resource finishes later past shift end than in the current plan.');
  const c9 = res('commit', 'Committed starts kept', `Appointments starting within ${FREEZE} min keep their resource and time.`);

  const byRes: Record<string, PlanItem[]> = {};
  for (const r of pb.resources) byRes[r.id] = [];
  for (const id of pb.order) {
    const it = items[id];
    if (!it) continue;
    byRes[it.resourceId]?.push(it);
  }
  const rmap = Object.fromEntries(pb.resources.map((r) => [r.id, r]));

  for (const rid of Object.keys(byRes)) {
    const list = byRes[rid].sort((a, b) => a.start - b.start);
    let prevEnd = pb.avail[rid];
    const run = pb.running[rid];
    for (const it of list) {
      c1.checked++;
      if (it.start < prevEnd - EPS) {
        c1.violations++;
        c1.detail.push(`${it.jobId} starts ${it.start.toFixed(1)} before ${prevEnd.toFixed(1)} on ${rid}`);
      }
      prevEnd = Math.max(prevEnd, it.end);
    }
    void run;
  }
  const lastEnd: Record<string, number> = {};
  for (const r of pb.resources) lastEnd[r.id] = pb.running[r.id]?.end ?? 0;
  for (const id of pb.order) {
    const it = items[id];
    const j = pb.jobs[id];
    const b = base.items[id];
    if (!it) continue;
    if (it.end > lastEnd[it.resourceId]) lastEnd[it.resourceId] = it.end;
    c2.checked++;
    if (j.predId) {
      const pi = items[j.predId];
      if (!pi || it.start < pi.end + j.gap - EPS) {
        c2.violations++;
        c2.detail.push(`${id} starts before its predecessor plus transfer`);
      }
    } else if (it.start < j.baseReady - EPS) {
      c2.violations++;
      c2.detail.push(`${id} starts before predecessor completes`);
    }
    c3.checked++;
    if (!jobCompat(rmap[it.resourceId], j)) {
      c3.violations++;
      c3.detail.push(`${id} needs ${j.skill ?? j.type}, ${it.resourceId} cannot provide it`);
    }
    c4.checked++;
    if (it.start < Math.max(pb.t, j.baseReady) - EPS) {
      c4.violations++;
      c4.detail.push(`${id} starts before it is ready`);
    }
    c5.checked++;
    if (it.start < pb.avail[it.resourceId] - EPS) {
      c5.violations++;
      c5.detail.push(`${id} placed while ${it.resourceId} is unavailable`);
    }
    const bw = b.wait;
    if (j.prio === 'urgent') {
      c6.checked++;
      if (it.wait > bw + EPS) {
        c6.violations++;
        c6.detail.push(`Protected slot ${id} waits ${(it.wait - bw).toFixed(1)} min longer`);
      }
    }
    c7.checked++;
    if (it.wait > bw + HARM_CAP + EPS) {
      c7.violations++;
      c7.detail.push(`${id} waits ${(it.wait - bw).toFixed(1)} min longer than planned`);
    }
    c9.checked++;
    if (b.start < pb.t + FREEZE - EPS && (it.resourceId !== b.resourceId || it.start > b.start + EPS)) {
      c9.violations++;
      c9.detail.push(`${id} was committed to ${b.resourceId} at ${b.start.toFixed(1)}`);
    }
  }
  const baseLast: Record<string, number> = {};
  for (const r of pb.resources) baseLast[r.id] = pb.running[r.id]?.end ?? 0;
  for (const id of pb.order) {
    const b = base.items[id];
    if (b.end > baseLast[b.resourceId]) baseLast[b.resourceId] = b.end;
  }
  for (const r of pb.resources) {
    c8.checked++;
    const ot = Math.max(0, lastEnd[r.id] - pb.shiftEnd);
    const bot = Math.max(0, baseLast[r.id] - pb.shiftEnd);
    if (ot > bot + EPS || ot > Math.max(pb.otCap, bot) + EPS) {
      c8.violations++;
      c8.detail.push(`${r.id} overtime ${ot.toFixed(0)} min vs ${bot.toFixed(0)} min planned`);
    }
  }
  return [c1, c2, c3, c4, c5, c6, c7, c8, c9];
}

export const allPass = (checks: CheckResult[]) => checks.every((c) => c.violations === 0);

/** Plan → dispatch instructions. Order always follows the plan; resources are reserved only where the plan reassigns. */
export function planToApply(plan: Plan, base?: Plan): Record<string, ApplyItem> {
  const out: Record<string, ApplyItem> = {};
  for (const [id, it] of Object.entries(plan.items)) {
    out[id] = { resourceId: it.resourceId, start: it.start, pin: base ? base.items[id].resourceId !== it.resourceId : false };
  }
  return out;
}

export { compatible };
