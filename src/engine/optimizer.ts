// Reflow: constraint-aware re-planning of every unstarted appointment.
// Search space: resource assignment + sequence per resource. Schedules are decoded semi-actively
// (every appointment starts as early as precedence, readiness and the resource allow).
import { mulberry32 } from './rng';
import { FREEZE, HARM_CAP, allPass, baselinePlan, buildProblem, decode, jobCompat, planStats, validatePlan } from './plan';
import type { CheckResult, Plan, PlanItem, PlanStats, Problem, Seq } from './plan';
import type { SimState } from './sim';
import type { Priority, Scenario } from './types';

export type ProfileId = 'throughput' | 'protect' | 'steady';

export interface Profile {
  id: ProfileId;
  label: string;
  blurb: string;
  w: Record<Priority, number>;
  wMax: number;
  wOT: number;
  wChange: number;
  kicks: number;
}

export const PROFILES: Profile[] = [
  {
    id: 'throughput',
    label: 'Fewest waiting minutes',
    blurb: 'Minimises total planned waiting across all patients.',
    w: { urgent: 3, standard: 1, routine: 1 },
    wMax: 0.15,
    wOT: 2,
    wChange: 0,
    kicks: 7,
  },
  {
    id: 'protect',
    label: 'Protect priority and the longest waits',
    blurb: 'Weights urgent patients heavily and penalises the longest individual wait.',
    w: { urgent: 12, standard: 1, routine: 0.7 },
    wMax: 1.2,
    wOT: 2,
    wChange: 0,
    kicks: 6,
  },
  {
    id: 'steady',
    label: 'Fewest changes',
    blurb: 'Trades some waiting minutes for far fewer moved appointments.',
    w: { urgent: 3, standard: 1, routine: 1 },
    wMax: 0.15,
    wOT: 2,
    wChange: 2.5,
    kicks: 4,
  },
];

export interface Change {
  jobId: string;
  patientId: string;
  kind: 'reassigned' | 'resequenced' | 'retimed';
  fromRes: string;
  toRes: string;
  fromStart: number;
  toStart: number;
  waitBefore: number;
  waitAfter: number;
}

export interface Candidate {
  profile: Profile;
  plan: Plan;
  objective: number;
  baseObjective: number;
  stats: PlanStats;
  changes: Change[];
  checks: CheckResult[];
  feasible: boolean;
  trace: number[]; // objective after each improvement step
  evaluations: number;
}

export interface Progress {
  stage: 'capture' | 'search' | 'validate' | 'compose';
  profile?: ProfileId;
  step: number;
  total: number;
  objective?: number;
  baseObjective?: number;
  note: string;
}

export interface ReflowResult {
  t: number;
  problem: Problem;
  base: Plan;
  baseStats: PlanStats;
  candidates: Candidate[];
  recommendedId: ProfileId | null;
  evaluations: number;
}

export interface Ctx {
  pb: Problem;
  base: Plan;
  baseStats: PlanStats;
  baseOT: Record<string, number>;
  prevOf: Record<string, string | null>;
  frozen: Set<string>;
  movable: string[];
}

export function makeCtx(pb: Problem, base: Plan): Ctx {
  const baseStats = planStats(pb, base);
  const prevOf: Record<string, string | null> = {};
  for (const rid of Object.keys(base.seq)) base.seq[rid].forEach((id, i) => (prevOf[id] = i ? base.seq[rid][i - 1] : null));
  const frozen = new Set<string>();
  for (const id of pb.order) if (base.items[id].start < pb.t + FREEZE) frozen.add(id);
  const movable = pb.order.filter((id) => !frozen.has(id));
  return { pb, base, baseStats, baseOT: baseStats.otByRes, prevOf, frozen, movable };
}

function evalObjective(ctx: Ctx, p: Profile, plan: Plan, seq: Seq): { J: number; stats: PlanStats; ok: boolean } {
  const { pb, base } = ctx;
  const stats = planStats(pb, plan);
  let ok = true;
  let J = 0;
  let changes = 0;
  for (const id of pb.order) {
    const it = plan.items[id];
    const b = base.items[id];
    const j = pb.jobs[id];
    J += p.w[j.prio] * it.wait;
    if (j.prio === 'urgent' && it.wait > b.wait + 1e-6) ok = false;
    if (it.wait > b.wait + HARM_CAP) ok = false;
    if (ctx.frozen.has(id) && (it.resourceId !== b.resourceId || it.start > b.start + 1e-6)) ok = false;
    if (it.resourceId !== b.resourceId) changes += 3;
  }
  if (p.wChange > 0) {
    for (const rid of Object.keys(seq)) {
      const s = seq[rid];
      for (let i = 0; i < s.length; i++) {
        const prev = i ? s[i - 1] : null;
        if (plan.items[s[i]].resourceId === base.items[s[i]].resourceId && prev !== ctx.prevOf[s[i]]) changes += 1;
      }
    }
  }
  for (const r of pb.resources) {
    const ot = stats.otByRes[r.id];
    if (ot > ctx.baseOT[r.id] + 1e-6) ok = false;
  }
  J += p.wOT * stats.overtime + p.wMax * stats.maxWait + p.wChange * changes;
  return { J, stats, ok };
}

function cloneSeq(s: Seq): Seq {
  const o: Seq = {};
  for (const k of Object.keys(s)) o[k] = s[k].slice();
  return o;
}

function relocate(seq: Seq, id: string, toRes: string, pos: number): Seq {
  const o = cloneSeq(seq);
  for (const k of Object.keys(o)) {
    const i = o[k].indexOf(id);
    if (i >= 0) {
      o[k].splice(i, 1);
      if (k === toRes && pos > i) pos--;
      break;
    }
  }
  o[toRes].splice(Math.min(pos, o[toRes].length), 0, id);
  return o;
}

function resOf(seq: Seq, id: string): string {
  for (const k of Object.keys(seq)) if (seq[k].includes(id)) return k;
  throw new Error('job not in sequence');
}

export function* searchProfile(
  ctx: Ctx,
  profile: Profile,
  seed: number,
): Generator<Progress, Candidate> {
  const { pb, base } = ctx;
  const rng = mulberry32(seed);
  const trace: number[] = [];
  let evaluations = 0;

  const ev = (seq: Seq) => {
    evaluations++;
    const plan = decode(pb, seq);
    if (!plan) return null;
    const r = evalObjective(ctx, profile, plan, seq);
    return { plan, seq, ...r };
  };

  let best = ev(cloneSeq(base.seq))!;
  const baseObjective = best.J;
  trace.push(best.J);

  function* localSearch(start: NonNullable<ReturnType<typeof ev>>, label: string) {
    let cur = start;
    for (let pass = 0; pass < 10; pass++) {
      let improved = false;
      const order = ctx.movable
        .slice()
        .sort((a, b) => cur.plan.items[b].wait * profile.w[pb.jobs[b].prio] - cur.plan.items[a].wait * profile.w[pb.jobs[a].prio]);
      for (const id of order) {
        if (cur.plan.items[id].wait < 0.5 && profile.wChange === 0) continue;
        const j = pb.jobs[id];
        let bestMove: typeof cur | null = null;
        for (const r of pb.resources) {
          if (!jobCompat(r, j)) continue;
          const len = cur.seq[r.id].length;
          for (let pos = 0; pos <= len; pos++) {
            const cand = relocate(cur.seq, id, r.id, pos);
            if (cand[r.id].join() === cur.seq[r.id].join() && resOf(cur.seq, id) === r.id) continue;
            const e = ev(cand);
            if (!e || !e.ok) continue;
            if (e.J < (bestMove ? bestMove.J : cur.J) - 1e-6) bestMove = e;
          }
        }
        if (bestMove) {
          cur = bestMove;
          improved = true;
          trace.push(cur.J);
        }
      }
      yield {
        stage: 'search' as const,
        profile: profile.id,
        step: pass + 1,
        total: 10,
        objective: cur.J,
        baseObjective,
        note: `${label} · pass ${pass + 1}`,
      };
      if (!improved) break;
    }
    return cur;
  }

  best = yield* localSearch(best, 'Local search');
  for (let k = 0; k < profile.kicks; k++) {
    // perturb: relocate a few waiting appointments to random compatible slots, then re-optimise
    let seq = cloneSeq(best.seq);
    const waiting = ctx.movable.filter((id) => best.plan.items[id].wait > 1);
    if (!waiting.length) break;
    for (let n = 0; n < 3; n++) {
      const id = waiting[Math.floor(rng() * waiting.length)];
      const opts = pb.resources.filter((r) => jobCompat(r, pb.jobs[id]));
      const r = opts[Math.floor(rng() * opts.length)];
      seq = relocate(seq, id, r.id, Math.floor(rng() * (seq[r.id].length + 1)));
    }
    const kicked = ev(seq);
    if (!kicked || !kicked.ok) continue;
    const improved = yield* localSearch(kicked, `Perturbation ${k + 1}/${profile.kicks}`);
    if (improved.J < best.J - 1e-6) best = improved;
  }

  const changes = describeChanges(ctx, best.plan);
  const checks = validatePlan(pb, base, best.plan.items);
  return {
    profile,
    plan: best.plan,
    objective: best.J,
    baseObjective,
    stats: best.stats,
    changes,
    checks,
    feasible: allPass(checks),
    trace,
    evaluations,
  };
}

export function describeChanges(ctx: Ctx, plan: Plan): Change[] {
  const out: Change[] = [];
  for (const id of ctx.pb.order) {
    const a = ctx.base.items[id];
    const b = plan.items[id];
    const moved = a.resourceId !== b.resourceId;
    const prevBase = ctx.prevOf[id];
    const seq = plan.seq[b.resourceId];
    const prevNow = seq.indexOf(id) > 0 ? seq[seq.indexOf(id) - 1] : null;
    const reseq = !moved && prevBase !== prevNow && Math.abs(a.start - b.start) >= 1;
    const retimed = !moved && !reseq && Math.abs(a.start - b.start) >= 1;
    if (!moved && !reseq && !retimed) continue;
    out.push({
      jobId: id,
      patientId: ctx.pb.jobs[id].patientId,
      kind: moved ? 'reassigned' : reseq ? 'resequenced' : 'retimed',
      fromRes: a.resourceId,
      toRes: b.resourceId,
      fromStart: a.start,
      toStart: b.start,
      waitBefore: a.wait,
      waitAfter: b.wait,
    });
  }
  return out;
}

export function captureProblem(sc: Scenario, snap: SimState) {
  const pb = buildProblem(sc, snap);
  const base = baselinePlan(sc, snap, pb);
  return { pb, base, ctx: makeCtx(pb, base) };
}

export function* reflow(sc: Scenario, snap: SimState, seed = 11): Generator<Progress, ReflowResult> {
  yield { stage: 'capture', step: 0, total: 1, note: 'Capturing the current operational plan' };
  const { pb, base, ctx } = captureProblem(sc, snap);
  yield {
    stage: 'capture',
    step: 1,
    total: 1,
    note: `${pb.order.length} unstarted appointments · ${pb.resources.length} resources · ${Object.keys(pb.running).length} in progress`,
  };
  const candidates: Candidate[] = [];
  let evals = 0;
  for (const p of PROFILES) {
    const c = yield* searchProfile(ctx, p, seed + p.kicks);
    evals += c.evaluations;
    candidates.push(c);
  }
  yield { stage: 'validate', step: 1, total: 1, note: 'Re-checking every constraint on every candidate' };
  const result: ReflowResult = {
    t: pb.t,
    problem: pb,
    base,
    baseStats: ctx.baseStats,
    candidates,
    recommendedId: recommend(ctx.baseStats, candidates),
    evaluations: evals,
  };
  yield { stage: 'compose', step: 1, total: 1, note: 'Composing the recommended adjustment' };
  return result;
}

/** Recommended = largest weighted saving net of the cost of moving people, among feasible candidates. */
export function recommend(baseStats: PlanStats, cands: Candidate[]): ProfileId | null {
  let best: Candidate | null = null;
  let bestScore = 0;
  for (const c of cands) {
    if (!c.feasible || !c.changes.length) continue;
    const saved = baseStats.totalWait - c.stats.totalWait;
    const score = saved - 0.35 * c.changes.length - 0.2 * Math.max(0, c.stats.maxWait - baseStats.maxWait);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best ? best.profile.id : null;
}

/** Synchronous convenience wrapper (tests, ledger previews). */
export function reflowSync(sc: Scenario, snap: SimState, seed = 11): ReflowResult {
  const g = reflow(sc, snap, seed);
  for (;;) {
    const n = g.next();
    if (n.done) return n.value;
  }
}

export type { PlanItem };
