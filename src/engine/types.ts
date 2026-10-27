// Core domain types for the SAYR simulator. All times are minutes since 08:00.

export type Priority = 'urgent' | 'standard' | 'routine';
export type ResType = 'registration' | 'vitals' | 'consult' | 'lab' | 'checkout';
export type PolicyId = 'fifo' | 'priority' | 'spt';
export type PathwayId = 'standard' | 'lab';
export type ScenarioId = 'normal' | 'staff' | 'surge' | 'lab' | 'room';

export interface ResourceDef {
  id: string;
  label: string;
  type: ResType;
  skills: string[];
  clinician?: string; // consultation stations are a clinician–room pair
  room?: string;
}

export interface Disruption {
  id: string;
  resourceId: string;
  from: number;
  until: number;
  label: string;
  kind: 'staff' | 'room';
}

export interface PatientDef {
  id: string;
  code: string; // synthetic journey code, e.g. J-014
  pathway: PathwayId;
  priority: Priority; // externally assigned, non-clinical demonstration input
  walkIn: boolean;
  surge: boolean; // belongs to the walk-in surge scenario
  sched: number; // scheduled arrival (walk-ins: the arrival time)
  lateBy: number; // minutes late (0 if on time)
  noShow: boolean;
  jobIds: string[];
}

export interface JobDef {
  id: string;
  patientId: string;
  k: number; // stage index in journey
  type: ResType;
  skill?: string;
  followUp?: boolean;
  expDur: number; // what the planner knows
  actDur: number; // what actually happens
  priority: Priority;
  predId?: string;
  gap: number; // transfer minutes after predecessor completes
}

export interface ScenarioParams {
  seed: number;
  scenario: ScenarioId;
  scheduled: number;
  walkIns: number;
  protectedShare: number;
  lateRate: number;
  noShowRate: number;
  cv: number; // realised duration variability
  labShare: number;
  desks: number;
  vitals: number;
  stations: number; // consultation stations (clinician + room)
  outage: { kind: 'staff' | 'room'; resourceId: string; from: number; length: number } | null;
  surge: { count: number; at: number } | null;
  labSlow: { factor: number; from: number } | null;
}

export interface Scenario {
  params: ScenarioParams;
  scenarioId: ScenarioId;
  resources: ResourceDef[];
  patients: PatientDef[];
  jobs: Record<string, JobDef>;
  jobOrder: string[];
  disruptions: Disruption[];
  labSlow: { factor: number; from: number } | null;
  shiftEnd: number;
  otCap: number; // hard overtime cap per resource (minutes)
}

export const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, standard: 1, routine: 2 };

/** Priority classes are externally assigned operational inputs. SAYR never infers clinical urgency. */
export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: 'Protected slot',
  standard: 'Standard',
  routine: 'Flexible',
};

export const TYPE_LABEL: Record<ResType, string> = {
  registration: 'Registration',
  vitals: 'Vital signs',
  consult: 'Consultation',
  lab: 'Laboratory',
  checkout: 'Checkout',
};

export const PATHWAY_LABEL: Record<PathwayId, string> = {
  standard: 'Standard visit',
  lab: 'Visit with laboratory test',
};

export const SCENARIO_LABEL: Record<ScenarioId, string> = {
  normal: 'Normal operations',
  staff: 'Staff unavailability',
  surge: 'Walk-in surge',
  lab: 'Laboratory bottleneck',
  room: 'Room closure',
};

export function fmtClock(m: number): string {
  const total = Math.round(8 * 60 + m);
  const h = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function fmtMin(m: number): string {
  const r = Math.round(m);
  return `${r} min`;
}
