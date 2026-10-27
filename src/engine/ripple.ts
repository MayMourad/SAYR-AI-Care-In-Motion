// Ripple Trace: follow a disruption through the event log to the delays it caused downstream.
// The with/without comparison replays the same base patients with the same realised durations.
import { baselineParams, buildScenario } from './scenario';
import { runFull } from './sim';
import type { SimState } from './sim';
import type { PolicyId, Scenario } from './types';

export interface RippleNode {
  id: string; // 'D1' or a job id
  kind: 'disruption' | 'job';
  parent?: string;
  via?: 'outage' | 'resource' | 'precedence' | 'reorder' | 'injected';
  delay: number; // start delayed by this many minutes vs the baseline replay
  waitAdded: number; // extra waiting minutes for that appointment
  depth: number;
  resourceId: string;
  patientId?: string;
  code?: string;
  at: number; // actual start time
  subtree: number; // delay minutes carried by this node and everything below it
  children: string[];
}

export interface RippleResult {
  disruptionId: string;
  label: string;
  resourceId: string;
  from: number;
  until: number;
  nodes: Record<string, RippleNode>;
  rootId: string;
  affectedPatients: number;
  extraWaitMinutes: number; // patient waiting minutes caused (vs the baseline replay)
  byResource: { resourceId: string; minutes: number }[];
  byHop: { depth: number; jobs: number; minutes: number }[];
  carriers: { id: string; label: string; subtree: number }[];
  extraOvertime: number;
  summary: string;
}

const THRESHOLD = 3; // minutes of start delay that counts as "affected"

function rootOf(sc: Scenario): { label: string; resourceId: string; from: number; until: number } | null {
  const d = sc.disruptions[0];
  if (d) return { label: d.label, resourceId: d.resourceId, from: d.from, until: d.until };
  const p = sc.params;
  if (p.surge) return { label: `Walk-in surge: ${p.surge.count} extra patients`, resourceId: 'REG-1', from: p.surge.at - 15, until: p.surge.at + 15 };
  if (p.labSlow) return { label: `Laboratory service +${Math.round((p.labSlow.factor - 1) * 100)}%`, resourceId: 'LAB-1', from: p.labSlow.from, until: sc.shiftEnd };
  return null;
}

export function rippleTrace(sc: Scenario, policy: PolicyId, actual: SimState): RippleResult | null {
  const root = rootOf(sc);
  if (!root) return null;
  const baseSc = buildScenario(baselineParams(sc.params));
  const without = runFull(baseSc, policy);
  const inBase = (id: string) => without.jobs[id] !== undefined;
  const waitOf = (s: SimState, id: string) => s.jobs[id].start! - s.jobs[id].readyAt!;
  const delayOf = (id: string) => {
    const a = actual.jobs[id];
    if (a.status !== 'done') return 0;
    if (!inBase(id)) return waitOf(actual, id); // an injected appointment: its own wait is the cost it brings
    const b = without.jobs[id];
    if (b.status !== 'done') return 0;
    return a.start! - b.start!;
  };
  const affected = sc.jobOrder.filter((id) => delayOf(id) >= THRESHOLD);
  const nodes: Record<string, RippleNode> = {};
  nodes.D1 = {
    id: 'D1',
    kind: 'disruption',
    delay: root.until - root.from,
    waitAdded: 0,
    depth: 0,
    resourceId: root.resourceId,
    at: root.from,
    subtree: 0,
    children: [],
  };
  const isAffected = new Set(affected);
  const parentOf = (id: string): { parent: string; via: RippleNode['via'] } => {
    const js = actual.jobs[id];
    const jd = sc.jobs[id];
    const options: { parent: string; via: RippleNode['via']; delay: number }[] = [];
    if (js.cause?.kind === 'outage') options.push({ parent: 'D1', via: 'outage', delay: Infinity });
    if (js.cause?.kind === 'resource' && js.cause.ref && isAffected.has(js.cause.ref)) options.push({ parent: js.cause.ref, via: 'resource', delay: delayOf(js.cause.ref) });
    if (jd.predId && isAffected.has(jd.predId)) options.push({ parent: jd.predId, via: 'precedence', delay: delayOf(jd.predId) });
    if (!options.length) return { parent: 'D1', via: inBase(id) ? 'reorder' : 'injected' };
    options.sort((a, b) => b.delay - a.delay);
    return options[0];
  };
  for (const id of affected) {
    const jd = sc.jobs[id];
    const p = sc.patients.find((x) => x.id === jd.patientId)!;
    const { parent, via } = parentOf(id);
    nodes[id] = {
      id,
      kind: 'job',
      parent,
      via,
      delay: delayOf(id),
      waitAdded: waitOf(actual, id) - (inBase(id) ? waitOf(without, id) : 0),
      depth: 0,
      resourceId: actual.jobs[id].resourceId!,
      patientId: jd.patientId,
      code: p.code,
      at: actual.jobs[id].start!,
      subtree: 0,
      children: [],
    };
  }
  // attach children; parents always start earlier, which also guards against cycles
  const sorted = affected.slice().sort((a, b) => actual.jobs[a].start! - actual.jobs[b].start!);
  for (const id of sorted) {
    const n = nodes[id];
    if (!nodes[n.parent!] || (n.parent !== 'D1' && actual.jobs[n.parent!].start! >= n.at)) {
      n.parent = 'D1';
      n.via = inBase(id) ? 'reorder' : 'injected';
    }
    nodes[n.parent!].children.push(id);
  }
  const setDepth = (id: string, depth: number) => {
    nodes[id].depth = depth;
    for (const c of nodes[id].children) setDepth(c, depth + 1);
  };
  setDepth('D1', 0);
  const sub = (id: string): number => {
    const n = nodes[id];
    n.subtree = (n.kind === 'job' && n.waitAdded > 0 ? n.waitAdded : 0) + n.children.reduce((s, c) => s + sub(c), 0);
    return n.subtree;
  };
  sub('D1');

  const patientsAffected = new Set(affected.map((id) => sc.jobs[id].patientId));
  let extra = 0;
  for (const id of sc.jobOrder) {
    if (actual.jobs[id].status !== 'done') continue;
    extra += waitOf(actual, id) - (inBase(id) && without.jobs[id].status === 'done' ? waitOf(without, id) : 0);
  }
  const resMin = new Map<string, number>();
  for (const id of affected) {
    const n = nodes[id];
    resMin.set(n.resourceId, (resMin.get(n.resourceId) ?? 0) + Math.max(0, n.waitAdded));
  }
  const maxDepth = Math.max(...Object.values(nodes).map((n) => n.depth));
  const byHop = [];
  for (let h = 1; h <= maxDepth; h++) {
    const lvl = Object.values(nodes).filter((n) => n.depth === h);
    byHop.push({ depth: h, jobs: lvl.length, minutes: lvl.reduce((s, n) => s + Math.max(0, n.waitAdded), 0) });
  }
  const carriers = Object.values(nodes)
    .filter((n) => n.kind === 'job' && n.children.length)
    .map((n) => ({ id: n.id, label: `${n.code} · ${n.resourceId}`, subtree: n.subtree }))
    .sort((a, b) => b.subtree - a.subtree)
    .slice(0, 5);
  const extraOvertime = overtime(sc, actual) - overtime(baseSc, without);
  const hops = byHop.length;
  const summary = `${root.label}. ${patientsAffected.size} patients reached a later start by 3 minutes or more, across ${hops} hop${hops === 1 ? '' : 's'}. ${Math.round(extra)} extra waiting minutes compared with the same day without the disruption; overtime changed by ${Math.round(extraOvertime)} min.`;
  return {
    disruptionId: 'D1',
    label: root.label,
    resourceId: root.resourceId,
    from: root.from,
    until: root.until,
    nodes,
    rootId: 'D1',
    affectedPatients: patientsAffected.size,
    extraWaitMinutes: extra,
    byResource: [...resMin.entries()].map(([resourceId, minutes]) => ({ resourceId, minutes })).sort((a, b) => b.minutes - a.minutes),
    byHop,
    carriers,
    extraOvertime,
    summary,
  };
}

function overtime(sc: Scenario, st: SimState): number {
  let total = 0;
  for (const r of sc.resources) {
    let last = 0;
    for (const id of sc.jobOrder) {
      const js = st.jobs[id];
      if (js.status === 'done' && js.resourceId === r.id) last = Math.max(last, js.end!);
    }
    total += Math.max(0, last - sc.shiftEnd);
  }
  return total;
}
