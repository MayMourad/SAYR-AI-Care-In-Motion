import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { baselineParams, buildScenario, DEFAULT_PARAMS, withScenario } from './engine/scenario';
import { explainProposal } from './engine/explain';
import { eventTimeOf } from './engine/seeds';
import { translate } from './i18n';
import type { Lang } from './i18n';
import { computeMetrics } from './engine/metrics';
import type { Metrics } from './engine/metrics';
import { reflow, recommend } from './engine/optimizer';
import type { Change, Progress, ReflowResult } from './engine/optimizer';
import { allPass, planStats, planToApply } from './engine/plan';
import type { CheckResult, Plan, PlanStats, Problem } from './engine/plan';
import { rippleTrace } from './engine/ripple';
import type { RippleResult } from './engine/ripple';
import { applyIntervention } from './engine/run';
import { runBaseline, runFull, snapshotAt, SNAP_STEP } from './engine/sim';
import type { BaselineRun, SimState } from './engine/sim';
import type { PolicyId, Scenario, ScenarioId, ScenarioParams } from './engine/types';
import { SCENARIO_LABEL, fmtClock } from './engine/types';

export type ScreenId = 'motion' | 'control' | 'journeys' | 'board' | 'stress' | 'reflow' | 'ripple' | 'desk' | 'ledger' | 'my';

export const SCREENS: { id: ScreenId; name: string; blurb: string }[] = [
  { id: 'motion', name: 'The System in Motion', blurb: 'A clinic day, moving' },
  { id: 'control', name: 'Control Room', blurb: 'Live operations' },
  { id: 'journeys', name: 'Journey Lines', blurb: 'Every patient path' },
  { id: 'board', name: 'Resource Board', blurb: 'Drag, check, reject' },
  { id: 'stress', name: 'Stress Controls', blurb: 'Bend the day' },
  { id: 'reflow', name: 'Reflow Studio', blurb: 'Re-plan under constraints' },
  { id: 'ripple', name: 'Ripple Trace', blurb: 'Follow a disruption' },
  { id: 'desk', name: 'Action Desk', blurb: 'Decide on proposals' },
  { id: 'ledger', name: 'Minutes Ledger', blurb: 'Time, accounted for' },
  { id: 'my', name: 'My Journey', blurb: 'The patient view' },
];

export interface Proposal {
  id: string;
  source: 'reflow' | 'manual';
  profileId?: string;
  label: string;
  blurb: string;
  t: number;
  version: number; // index of the live run version it was built on
  problem: Problem;
  base: Plan;
  plan: Plan;
  baseStats: PlanStats;
  stats: PlanStats;
  changes: Change[];
  checks: CheckResult[];
  feasible: boolean;
  recommended: boolean;
  trace?: number[];
  explanation: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'superseded';
  decidedAt?: number;
}

export interface Intervention {
  proposal: Proposal;
  prevRun: BaselineRun;
  nextRun: BaselineRun;
}

export interface ReflowUi {
  phase: 'idle' | 'running' | 'done';
  t: number;
  steps: Progress[];
  last?: Progress;
  result?: ReflowResult;
  ms?: number;
}

export interface DecisionLog {
  at: number;
  text: string;
  detail?: string[]; // audit detail: scenario, seed, objective, constraints, metrics, decision
}

interface Store {
  key: BaselineRun;
  interventions: Intervention[];
  proposals: Proposal[];
  reflow: ReflowUi;
  log: DecisionLog[];
}

const freshStore = (key: BaselineRun): Store => ({ key, interventions: [], proposals: [], reflow: { phase: 'idle', t: 0, steps: [] }, log: [] });

interface Ctx {
  params: ScenarioParams;
  setParams: (p: ScenarioParams) => void;
  sc: Scenario;
  policy: PolicyId;
  setPolicy: (p: PolicyId) => void;
  baseRun: BaselineRun;
  liveRun: BaselineRun;
  version: number;
  now: number;
  setNow: (t: number) => void;
  playing: boolean;
  setPlaying: (b: boolean) => void;
  speed: number;
  setSpeed: (n: number) => void;
  screen: ScreenId;
  go: (s: ScreenId) => void;
  selected: string | null;
  select: (id: string | null) => void;
  interventions: Intervention[];
  proposals: Proposal[];
  reflowUi: ReflowUi;
  startReflow: () => void;
  accept: (id: string) => void;
  reject: (id: string) => void;
  addManual: (p: Omit<Proposal, 'id' | 'status' | 'version' | 'recommended' | 'source' | 'explanation'>) => string;
  undoAll: () => void;
  log: DecisionLog[];
  metricsLive: Metrics; // the plan in force (optimized once a proposal is approved)
  metricsBase: Metrics; // the selected scenario without any approved change
  metricsNormal: Metrics; // the same patients under normal operations
  normalSc: Scenario;
  normalFinal: SimState;
  ripple: RippleResult | null;
  aboutOpen: boolean;
  setAbout: (b: boolean) => void;
  resetScenario: () => void;
  scenarioId: ScenarioId;
  setScenario: (id: ScenarioId) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string) => string;
}

const C = createContext<Ctx>(null as unknown as Ctx);
export const useSayr = () => useContext(C);

export function useReducedMotion(): boolean {
  const [r, setR] = useState(() => (typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false));
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const h = () => setR(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return r;
}

function readHash(): ScreenId {
  const h = window.location.hash.replace('#/', '');
  return (SCREENS.find((s) => s.id === h)?.id ?? 'motion') as ScreenId;
}

export function SayrProvider({ children }: { children: ReactNode }) {
  const [params, setParamsRaw] = useState<ScenarioParams>(DEFAULT_PARAMS);
  const [policy, setPolicyRaw] = useState<PolicyId>('fifo');
  const sc = useMemo(() => buildScenario(params), [params]);
  const baseRun = useMemo(() => runBaseline(sc, policy), [sc, policy]);
  const [store, setStore] = useState<Store>(() => freshStore(baseRun));
  const S = store.key === baseRun ? store : freshStore(baseRun);
  const liveRun = S.interventions.length ? S.interventions[S.interventions.length - 1].nextRun : baseRun;
  const version = S.interventions.length;

  const [now, setNowRaw] = useState(120);
  const [lang, setLang] = useState<Lang>('en');
  const t = useCallback((en: string) => translate(lang, en), [lang]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(6);
  const [screen, setScreen] = useState<ScreenId>(readHash);
  const [selected, select] = useState<string | null>(null);
  const [aboutOpen, setAbout] = useState(false);

  const endT = useMemo(() => Math.ceil(liveRun.final.t / 5) * 5 + 5, [liveRun]);
  const setNow = useCallback((t: number) => setNowRaw(Math.max(0, Math.min(t, 600))), []);

  useEffect(() => {
    const h = () => setScreen(readHash());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  const go = useCallback((s: ScreenId) => {
    window.location.hash = `#/${s}`;
    setScreen(s);
  }, []);

  // simulation clock
  const raf = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const loop = (ts: number) => {
      const dt = (ts - last) / 1000;
      last = ts;
      setNowRaw((n) => {
        const nx = n + dt * speed;
        if (nx >= endT) {
          setPlaying(false);
          return endT;
        }
        return nx;
      });
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, speed, endT]);

  const setParams = useCallback((p: ScenarioParams) => setParamsRaw(p), []);
  const setPolicy = useCallback((p: PolicyId) => setPolicyRaw(p), []);
  const resetScenario = useCallback(() => {
    setParamsRaw(DEFAULT_PARAMS);
    setPolicyRaw('fifo');
    setNowRaw(120);
    setPlaying(false);
    select(null);
  }, []);
  const setScenario = useCallback((id: ScenarioId) => {
    const next = withScenario(paramsRef.current, id);
    setParamsRaw(next);
    setNowRaw(id === 'normal' ? 120 : eventTimeOf(next) + 5);
    setPlaying(false);
    select(null);
  }, []);

  const patch = useCallback(
    (fn: (s: Store) => Partial<Store>) => setStore((prev) => {
      const cur = prev.key === baseRun ? prev : freshStore(baseRun);
      return { ...cur, ...fn(cur) };
    }),
    [baseRun],
  );

  const paramsRef = useRef(params);
  paramsRef.current = params;
  const auditDetail = useCallback(
    (prop: Proposal, decision: string) => [
      `Scenario: ${SCENARIO_LABEL[sc.scenarioId]} · seed ${sc.params.seed} · baseline policy ${policy}`,
      `Objective optimised: ${prop.label}`,
      `Constraints applied: ${prop.checks.map((c) => c.label).join('; ')}`,
      `Appointments changed: ${prop.changes.length}`,
      'Metrics recalculated: total waiting, median, p90, throughput, utilisation, overtime',
      `Decision: ${decision}`,
    ],
    [sc, policy],
  );
  const liveRef = useRef(liveRun);
  liveRef.current = liveRun;
  const nowRef = useRef(now);
  nowRef.current = now;
  const versionRef = useRef(version);
  versionRef.current = version;

  const startReflow = useCallback(() => {
    const run = liveRef.current;
    const t = Math.max(0, Math.min(Math.floor(nowRef.current / SNAP_STEP) * SNAP_STEP, (run.snaps.length - 1) * SNAP_STEP));
    const snap = snapshotAt(run, t);
    const ver = versionRef.current;
    setPlaying(false);
    setNowRaw(t);
    const t0 = performance.now();
    const steps: Progress[] = [];
    patch(() => ({ reflow: { phase: 'running', t, steps: [] } }));
    const gen = reflow(sc, snap, 11);
    const tick = () => {
      const n = gen.next();
      if (n.done) {
        const result = n.value;
        const rec = recommend(result.baseStats, result.candidates);
        const proposals: Proposal[] = result.candidates.map((c) => ({
          id: `R${t}-${c.profile.id}`,
          source: 'reflow' as const,
          profileId: c.profile.id,
          label: c.profile.label,
          blurb: c.profile.blurb,
          t,
          version: ver,
          problem: result.problem,
          base: result.base,
          plan: c.plan,
          baseStats: result.baseStats,
          stats: c.stats,
          changes: c.changes,
          checks: c.checks,
          feasible: c.feasible,
          recommended: c.profile.id === rec,
          trace: c.trace,
          explanation: explainProposal(sc, result.problem, result.base, c.plan, c.changes, result.baseStats, c.stats, c.checks),
          status: 'pending' as const,
        }));
        patch((s) => ({
          reflow: { phase: 'done', t, steps, last: steps[steps.length - 1], result: { ...result, recommendedId: rec }, ms: performance.now() - t0 },
          proposals: [...s.proposals.filter((p) => p.source === 'manual' || p.version !== ver), ...proposals],
          log: [
            ...s.log,
            {
              at: t,
              text: `Reflow captured the plan at ${fmtClock(t)} and produced ${proposals.length} alternatives, pending approval.`,
              detail: [`Scenario: ${SCENARIO_LABEL[sc.scenarioId]} · seed ${sc.params.seed}`, `Plans evaluated: ${result.evaluations}`, `Recommended: ${proposals.find((p) => p.recommended)?.label ?? 'none (no feasible improvement)'}`],
            },
          ],
        }));
        return;
      }
      steps.push(n.value);
      patch(() => ({ reflow: { phase: 'running', t, steps: steps.slice(), last: n.value } }));
      setTimeout(tick, 0);
    };
    setTimeout(tick, 30);
  }, [sc, patch]);

  const accept = useCallback(
    (id: string) => {
      setStore((prev) => {
        const cur = prev.key === baseRun ? prev : freshStore(baseRun);
        const prop = cur.proposals.find((p) => p.id === id);
        if (!prop || prop.status !== 'pending' || !prop.feasible) return cur;
        const prevRun = cur.interventions.length ? cur.interventions[cur.interventions.length - 1].nextRun : baseRun;
        if (cur.interventions.length !== prop.version) return cur;
        const nextRun = applyIntervention(sc, prevRun, prop.t, planToApply(prop.plan, prop.base));
        const accepted: Proposal = { ...prop, status: 'accepted', decidedAt: prop.t };
        return {
          ...cur,
          interventions: [...cur.interventions, { proposal: accepted, prevRun, nextRun }],
          proposals: cur.proposals.map((p) => (p.id === id ? accepted : p.status === 'pending' ? { ...p, status: 'superseded' as const } : p)),
          log: [...cur.log, { at: prop.t, text: `Approved “${prop.label}” (${prop.changes.length} appointment changes). It is now the active plan.`, detail: auditDetail(prop, 'approved by the user') }],
        };
      });
    },
    [baseRun, sc, auditDetail],
  );

  const reject = useCallback(
    (id: string) =>
      patch((s) => {
        const prop = s.proposals.find((p) => p.id === id);
        return {
          proposals: s.proposals.map((p) => (p.id === id && p.status === 'pending' ? { ...p, status: 'rejected' as const, decidedAt: p.t } : p)),
          log: prop ? [...s.log, { at: prop.t, text: `Rejected “${prop.label}”. The current plan stays in force.`, detail: auditDetail(prop, 'rejected by the user; active schedule unchanged') }] : s.log,
        };
      }),
    [patch, auditDetail],
  );

  const addManual = useCallback(
    (p: Omit<Proposal, 'id' | 'status' | 'version' | 'recommended' | 'source' | 'explanation'>) => {
      const id = `M${p.t}-${Date.now() % 100000}`;
      const ver = versionRef.current;
      patch((s) => ({
        proposals: [
          ...s.proposals,
          { ...p, id, source: 'manual' as const, version: ver, recommended: false, explanation: explainProposal(sc, p.problem, p.base, p.plan, p.changes, p.baseStats, p.stats, p.checks), status: 'pending' as const },
        ],
        log: [...s.log, { at: p.t, text: `Manual adjustment drafted on the Resource Board (${p.changes.length} changes).` }],
      }));
      return id;
    },
    [patch, sc],
  );

  const undoAll =useCallback(() => patch(() => ({ interventions: [], proposals: [], reflow: { phase: 'idle' as const, t: 0, steps: [] }, log: [] })), [patch]);

  const metricsLive = useMemo(() => computeMetrics(sc, liveRun.final), [sc, liveRun]);
  const metricsBase = useMemo(() => (liveRun === baseRun ? metricsLive : computeMetrics(sc, baseRun.final)), [sc, liveRun, baseRun, metricsLive]);
  const normalSc = useMemo(() => buildScenario(baselineParams(params)), [params]);
  const normalFinal = useMemo(() => runFull(normalSc, policy), [normalSc, policy]);
  const metricsNormal = useMemo(() => computeMetrics(normalSc, normalFinal), [normalSc, normalFinal]);
  const ripple = useMemo(() => rippleTrace(sc, policy, baseRun.final), [sc, policy, baseRun]);

  const value: Ctx = {
    params,
    setParams,
    sc,
    policy,
    setPolicy,
    baseRun,
    liveRun,
    version,
    now,
    setNow,
    playing,
    setPlaying,
    speed,
    setSpeed,
    screen,
    go,
    selected,
    select,
    interventions: S.interventions,
    proposals: S.proposals,
    reflowUi: S.reflow,
    startReflow,
    accept,
    reject,
    addManual,
    undoAll,
    log: S.log,
    metricsLive,
    metricsBase,
    metricsNormal,
    normalSc,
    normalFinal,
    ripple,
    aboutOpen,
    setAbout,
    resetScenario,
    scenarioId: sc.scenarioId,
    setScenario,
    lang,
    setLang,
    t,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

export { allPass, planStats };
