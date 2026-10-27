import { mulberry32, normal } from './rng';
import type { Rng } from './rng';
import type {
  Disruption,
  JobDef,
  PathwayId,
  PatientDef,
  Priority,
  ResourceDef,
  ResType,
  Scenario,
  ScenarioId,
  ScenarioParams,
} from './types';
import { SCENARIO_LABEL } from './types';

/**
 * Development assumptions for a fictional outpatient clinic. These are not measured regional statistics.
 * 60 patients (48 scheduled + 12 walk-in), 2 registration, 2 vital-sign stations, 3 consultation
 * stations (clinician + room), 1 laboratory station, 1 checkout station, about 30% needing the laboratory.
 */
export const DEFAULT_PARAMS: ScenarioParams = {
  seed: 7,
  scenario: 'normal',
  scheduled: 48,
  walkIns: 12,
  protectedShare: 0.1,
  lateRate: 0.18,
  noShowRate: 0.04,
  cv: 0.25,
  labShare: 0.3,
  desks: 2,
  vitals: 2,
  stations: 3,
  outage: null,
  surge: null,
  labSlow: null,
};

/** Event times in minutes after 08:00: 10:30 = 150, 11:00 = 180, 12:00 = 240, 13:00 = 300. */
export const SCENARIO_DEFS: Record<ScenarioId, Pick<ScenarioParams, 'outage' | 'surge' | 'labSlow'>> = {
  normal: { outage: null, surge: null, labSlow: null },
  staff: { outage: { kind: 'staff', resourceId: 'GP-2', from: 150, length: 180 }, surge: null, labSlow: null },
  surge: { outage: null, surge: { count: 8, at: 180 }, labSlow: null },
  lab: { outage: null, surge: null, labSlow: { factor: 1.5, from: 240 } },
  room: { outage: { kind: 'room', resourceId: 'GP-3', from: 300, length: 180 }, surge: null, labSlow: null },
};

export const SCENARIO_DESC: Record<ScenarioId, string> = {
  normal: 'Routine outpatient activity. This is the baseline every other scenario is compared with.',
  staff: 'At 10:30 one clinician becomes unavailable for three hours. A consultation station is lost.',
  surge: 'Around 11:00, eight additional walk-in patients arrive and queue for registration and vital signs.',
  lab: 'From 12:00 laboratory service durations increase by 50%.',
  room: 'At 13:00 one consultation room closes until the end of the shift.',
};

export function withScenario(p: ScenarioParams, id: ScenarioId): ScenarioParams {
  return { ...p, scenario: id, ...SCENARIO_DEFS[id] };
}

/** The same patients with no disruption: the baseline for comparisons. */
export function baselineParams(p: ScenarioParams): ScenarioParams {
  return { ...p, scenario: 'normal', outage: null, surge: null, labSlow: null };
}

const CLIN = ['A', 'B', 'C', 'D'];

export function buildResources(p: ScenarioParams): ResourceDef[] {
  const r: ResourceDef[] = [];
  for (let i = 1; i <= p.desks; i++) r.push({ id: `REG-${i}`, label: `Registration ${i}`, type: 'registration', skills: [] });
  for (let i = 1; i <= p.vitals; i++) r.push({ id: `VIT-${i}`, label: `Vital signs ${i}`, type: 'vitals', skills: [] });
  for (let i = 1; i <= p.stations; i++)
    r.push({ id: `GP-${i}`, label: `Station ${i}`, type: 'consult', skills: ['general'], clinician: `Clinician ${CLIN[i - 1]}`, room: `Room ${i}` });
  r.push({ id: 'LAB-1', label: 'Laboratory', type: 'lab', skills: ['lab'] });
  r.push({ id: 'CHK-1', label: 'Checkout', type: 'checkout', skills: [] });
  return r;
}

// Arrival density over the clinic day: morning and early-afternoon peaks.
const DENSITY: [number, number, number][] = [
  [0, 60, 0.8],
  [60, 180, 1.5],
  [180, 270, 0.7],
  [270, 360, 1.3],
  [360, 420, 0.7],
];

function sampleArrival(rng: Rng): number {
  const total = DENSITY.reduce((s, [a, b, w]) => s + (b - a) * w, 0);
  let r = rng() * total;
  for (const [a, b, w] of DENSITY) {
    const mass = (b - a) * w;
    if (r <= mass) return Math.round(a + r / w);
    r -= mass;
  }
  return 60;
}

export const HOURLY_PROFILE = DENSITY;

const roundHalf = (x: number) => Math.round(x * 2) / 2;

interface Stage {
  type: ResType;
  mean: number;
  spread: number;
  followUp?: boolean;
}

const PATHWAYS: Record<PathwayId, Stage[]> = {
  standard: [
    { type: 'registration', mean: 4, spread: 0.2 },
    { type: 'vitals', mean: 6, spread: 0.25 },
    { type: 'consult', mean: 15, spread: 0.45 },
    { type: 'checkout', mean: 3.5, spread: 0.2 },
  ],
  lab: [
    { type: 'registration', mean: 4, spread: 0.2 },
    { type: 'vitals', mean: 6, spread: 0.25 },
    { type: 'consult', mean: 15, spread: 0.45 },
    { type: 'lab', mean: 14, spread: 0.3 },
    { type: 'consult', mean: 7, spread: 0.4, followUp: true },
    { type: 'checkout', mean: 3.5, spread: 0.2 },
  ],
};

function makePatient(
  rng: Rng,
  id: string,
  num: number,
  sched: number,
  walkIn: boolean,
  surge: boolean,
  p: ScenarioParams,
  jobs: Record<string, JobDef>,
): PatientDef {
  const pathway: PathwayId = rng() < p.labShare ? 'lab' : 'standard';
  const pr = rng();
  // protected slots are an externally assigned, non-clinical demonstration input
  const priority: Priority = !walkIn && pr < p.protectedShare ? 'urgent' : pr < p.protectedShare + 0.5 ? 'standard' : 'routine';
  const lateBy = !walkIn && rng() < p.lateRate ? Math.round(5 + rng() * 20) : 0;
  const noShow = !walkIn && rng() < p.noShowRate;
  const patient: PatientDef = {
    id,
    code: `J-${String(num).padStart(3, '0')}`,
    pathway,
    priority,
    walkIn,
    surge,
    sched,
    lateBy,
    noShow,
    jobIds: [],
  };
  PATHWAYS[pathway].forEach((st, k) => {
    const jid = `${id}.${k}`;
    const booked = st.mean * Math.exp(st.spread * normal(rng) - (st.spread * st.spread) / 2);
    const exp = Math.min(Math.max(2, booked), st.mean * 2.6);
    const act = Math.max(2, exp * Math.exp(p.cv * normal(rng) - (p.cv * p.cv) / 2));
    jobs[jid] = {
      id: jid,
      patientId: id,
      k,
      type: st.type,
      followUp: st.followUp,
      expDur: roundHalf(exp),
      actDur: roundHalf(act),
      priority,
      predId: k === 0 ? undefined : `${id}.${k - 1}`,
      gap: k === 0 ? 0 : st.type === 'lab' ? 3 : 2,
    };
    patient.jobIds.push(jid);
  });
  return patient;
}

export function buildScenario(params: ScenarioParams): Scenario {
  const rng = mulberry32(params.seed);
  const resources = buildResources(params);
  const patients: PatientDef[] = [];
  const jobs: Record<string, JobDef> = {};

  // The base population (scheduled + walk-in) uses its own random stream, so every scenario
  // for a given seed shares the same patients. Surge patients come from a separate stream.
  const entries: { sched: number; walkIn: boolean }[] = [];
  for (let i = 0; i < params.scheduled; i++) entries.push({ sched: sampleArrival(rng), walkIn: false });
  for (let i = 0; i < params.walkIns; i++) entries.push({ sched: sampleArrival(rng), walkIn: true });
  entries.sort((a, b) => a.sched - b.sched);
  entries.forEach((e, i) => {
    const pid = `P${String(i + 1).padStart(3, '0')}`;
    patients.push(makePatient(rng, pid, i + 1, e.sched, e.walkIn, false, params, jobs));
  });

  if (params.surge) {
    const srng = mulberry32(params.seed * 7919 + 13);
    const base = patients.length;
    const times = Array.from({ length: params.surge.count }, () => Math.max(0, Math.round(params.surge!.at + (srng() - 0.5) * 30))).sort((a, b) => a - b);
    times.forEach((t, i) => {
      const n = base + i + 1;
      patients.push(makePatient(srng, `P${String(n).padStart(3, '0')}`, n, t, true, true, params, jobs));
    });
  }

  const disruptions: Disruption[] = [];
  if (params.outage && resources.some((r) => r.id === params.outage!.resourceId) && params.outage.length > 0) {
    const o = params.outage;
    const res = resources.find((r) => r.id === o.resourceId)!;
    disruptions.push({
      id: 'D1',
      resourceId: o.resourceId,
      from: o.from,
      until: o.from + o.length,
      kind: o.kind,
      label: o.kind === 'staff' ? `${res.clinician} unavailable` : `${res.room} closed`,
    });
  }

  return {
    params,
    scenarioId: params.scenario,
    resources,
    patients,
    jobs,
    jobOrder: patients.flatMap((p) => p.jobIds),
    disruptions,
    labSlow: params.labSlow,
    shiftEnd: 480,
    otCap: 45,
  };
}

export function scenarioHeadline(sc: Scenario): string {
  const p = sc.params;
  if (sc.disruptions[0]) return sc.disruptions[0].label;
  if (p.surge) return `Walk-in surge: ${p.surge.count} extra patients`;
  if (p.labSlow) return `Laboratory service +${Math.round((p.labSlow.factor - 1) * 100)}%`;
  return SCENARIO_LABEL[sc.scenarioId];
}
