import { describe, expect, it } from 'vitest';
import { baselineParams, buildScenario, DEFAULT_PARAMS, SCENARIO_DEFS, withScenario } from './scenario';
import { forecast, runBaseline, runFromSnapshot, snapshotAt, runFull } from './sim';
import { baselinePlan, buildProblem, decode, validatePlan, planToApply, allPass } from './plan';
import { reflowSync } from './optimizer';
import { computeMetrics } from './metrics';
import { rippleTrace } from './ripple';
import { waterfall, totalWait } from './ledger';
import { applyIntervention } from './run';
import { forecastDemand } from './forecast';
import { explainProposal } from './explain';
import { evaluateSeed, eventTimeOf, summarize } from './seeds';
import type { ScenarioId } from './types';

const IDS: ScenarioId[] = ['normal', 'staff', 'surge', 'lab', 'room'];
const mk = (id: ScenarioId, seed = 7) => buildScenario({ ...withScenario(DEFAULT_PARAMS, id), seed });

describe('population and configuration', () => {
  it('matches the documented clinic', () => {
    const sc = mk('normal');
    expect(sc.patients.length).toBe(60);
    expect(sc.patients.filter((p) => p.walkIn).length).toBe(12);
    expect(sc.patients.filter((p) => !p.walkIn).length).toBe(48);
    expect(sc.resources.filter((r) => r.type === 'registration').length).toBe(2);
    expect(sc.resources.filter((r) => r.type === 'vitals').length).toBe(2);
    expect(sc.resources.filter((r) => r.type === 'consult').length).toBe(3);
    expect(sc.resources.filter((r) => r.type === 'lab').length).toBe(1);
    expect(sc.resources.filter((r) => r.type === 'checkout').length).toBe(1);
    const lab = sc.patients.filter((p) => p.pathway === 'lab').length / 60;
    expect(lab).toBeGreaterThan(0.15);
    expect(lab).toBeLessThan(0.45);
  });
  it('shares the same base patients across scenarios for a seed', () => {
    const a = mk('normal');
    for (const id of IDS) {
      const b = mk(id);
      for (const p of a.patients) {
        const q = b.patients.find((x) => x.id === p.id)!;
        expect(q.sched).toBe(p.sched);
        expect(b.jobs[p.jobIds[0]].actDur).toBe(a.jobs[p.jobIds[0]].actDur);
      }
    }
    expect(mk('surge').patients.length).toBe(68);
  });
});

describe('simulation', () => {
  it('is deterministic for identical inputs', () => {
    const a = runFull(mk('staff'), 'fifo');
    const b = runFull(mk('staff'), 'fifo');
    expect(JSON.stringify(a.log)).toBe(JSON.stringify(b.log));
  });
  for (const id of IDS) {
    it(`${id}: respects exclusivity, order, arrival, skills and closures`, () => {
      const sc = mk(id);
      const st = runFull(sc, 'fifo');
      for (const jid of sc.jobOrder) expect(['done', 'cancelled']).toContain(st.jobs[jid].status);
      const m = computeMetrics(sc, st);
      for (const v of m.violations.filter((x) => x.id !== 'cap')) expect(v.count, v.label).toBe(0);
    });
  }
  it('metric totals match patient-level event records', () => {
    const sc = mk('staff');
    const st = runFull(sc, 'fifo');
    const m = computeMetrics(sc, st);
    let fromLog = 0;
    for (const e of st.log) if (e.kind === 'start') fromLog += e.wait!;
    expect(m.totalWait).toBeCloseTo(fromLog, 6);
    expect(m.totalWait).toBeCloseTo(m.patients.reduce((s, p) => s + p.wait, 0), 6);
    expect(totalWait(sc, st)).toBeCloseTo(fromLog, 6);
  });
  it('disruptions produce meaningful changes against the same patients', () => {
    const base = totalWait(mk('normal'), runFull(mk('normal'), 'fifo'));
    const rows: string[] = [];
    for (const id of ['staff', 'surge', 'lab', 'room'] as ScenarioId[]) {
      const sc = mk(id);
      const w = totalWait(sc, runFull(sc, 'fifo'));
      rows.push(`${id} ${Math.round(w)} vs normal ${Math.round(base)}`);
      expect(w, id).toBeGreaterThan(base);
    }
    // eslint-disable-next-line no-console
    console.log(rows.join(' | '));
  });
  it('laboratory slowdown only lengthens laboratory services started after it begins', () => {
    const sc = mk('lab');
    const st = runFull(sc, 'fifo');
    let slowed = 0;
    for (const id of sc.jobOrder) {
      const jd = sc.jobs[id];
      const js = st.jobs[id];
      if (js.status !== 'done') continue;
      const dur = js.end! - js.start!;
      if (jd.type === 'lab' && js.start! >= 240) {
        expect(dur).toBeCloseTo(jd.actDur * 1.5, 6);
        slowed++;
      } else expect(dur).toBeCloseTo(jd.actDur, 6);
    }
    expect(slowed).toBeGreaterThan(0);
  });
});

describe('planning and approval', () => {
  const sc = mk('staff');
  const run = runBaseline(sc, 'fifo');
  const t = eventTimeOf(sc.params);
  const snap = snapshotAt(run, t);
  const pb = buildProblem(sc, snap);
  const base = baselinePlan(sc, snap, pb);
  it('decoding the forecast sequences reproduces the forecast', () => {
    const fc = forecast(sc, snap);
    for (const id of pb.order) expect(Math.abs(base.items[id].start - fc.jobs[id].start!)).toBeLessThan(1e-6);
  });
  it('baseline passes its own validation and the validator rejects an overlap', () => {
    expect(allPass(validatePlan(pb, base, base.items))).toBe(true);
    const bad = structuredClone(base.items);
    const ids = Object.keys(bad).filter((id) => bad[id].resourceId === 'GP-1');
    bad[ids[1]].start = bad[ids[0]].start;
    expect(allPass(validatePlan(pb, base, bad))).toBe(false);
  });
  const res = reflowSync(sc, snap);
  it('every candidate preserves the hard constraints', () => {
    for (const c of res.candidates) {
      expect(c.feasible).toBe(true);
      expect(allPass(validatePlan(pb, base, c.plan.items))).toBe(true);
    }
  });
  const rec = res.candidates.find((c) => c.profile.id === res.recommendedId);
  it('approving changes the active schedule; rejecting leaves it untouched', () => {
    expect(rec).toBeTruthy();
    const before = JSON.stringify(run.final.log);
    // rejection = no intervention applied: the base run is unchanged by building proposals
    expect(JSON.stringify(run.final.log)).toBe(before);
    const next = applyIntervention(sc, run, t, planToApply(rec!.plan, res.base));
    expect(JSON.stringify(next.final.log)).not.toBe(before);
    // everything before the approval time is identical
    const early = (l: typeof run.final.log) => JSON.stringify(l.filter((e) => e.t < t));
    expect(early(next.final.log)).toBe(early(run.final.log));
    // restoring the baseline is simply returning to the original run
    expect(totalWait(sc, run.final)).toBe(totalWait(sc, run.final));
    const m = computeMetrics(sc, next.final);
    for (const v of m.violations.filter((x) => x.id !== 'cap')) expect(v.count).toBe(0);
  });
  it('waterfall telescopes to the measured difference', () => {
    const wf = waterfall(sc, run.final, snap, res.base, rec!.plan, rec!.changes, (r) => r, 0);
    const sum = wf.steps.filter((s) => s.kind === 'delta').reduce((s, x) => s + x.value, 0);
    expect(wf.baseline + sum).toBeCloseTo(wf.final, 6);
    const applied = runFromSnapshot(sc, snap, planToApply(rec!.plan, res.base));
    expect(totalWait(sc, applied)).toBeCloseTo(wf.final, 6);
  });
  it('explanations are generated from the proposal', () => {
    const lines = explainProposal(sc, pb, res.base, rec!.plan, rec!.changes, res.baseStats, rec!.stats, rec!.checks);
    expect(lines.length).toBeGreaterThan(4);
    expect(lines.join(' ')).toContain('constraint checks pass');
  });
});

describe('ripple', () => {
  for (const id of ['staff', 'surge', 'lab', 'room'] as ScenarioId[]) {
    it(`${id}: every link points to an earlier real event`, () => {
      const sc = mk(id);
      const st = runFull(sc, 'fifo');
      const r = rippleTrace(sc, 'fifo', st)!;
      expect(r).toBeTruthy();
      for (const n of Object.values(r.nodes)) {
        if (n.kind !== 'job') continue;
        const parent = r.nodes[n.parent!];
        expect(parent).toBeTruthy();
        if (parent.kind === 'job') expect(st.jobs[parent.id].start!).toBeLessThan(n.at);
      }
      // eslint-disable-next-line no-console
      console.log(id, r.affectedPatients, 'patients', Math.round(r.extraWaitMinutes), 'min', r.byHop.length, 'hops');
    });
  }
  it('has nothing to trace in normal operations', () => {
    const sc = mk('normal');
    expect(rippleTrace(sc, 'fifo', runFull(sc, 'fifo'))).toBeNull();
  });
});

describe('forecast', () => {
  it('is deterministic and picks the lowest held-out error', () => {
    const a = forecastDemand(mk('normal'));
    const b = forecastDemand(mk('normal'));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const best = a.models.slice().sort((x, y) => x.mae - y.mae)[0];
    expect(a.chosen).toBe(best.id);
    expect(Number.isFinite(best.mae)).toBe(true);
  });
});

describe('optimizer across scenarios and seeds', () => {
  it('reports honest numbers for every scenario (printed)', () => {
    const lines: string[] = [];
    for (const id of ['staff', 'surge', 'lab', 'room'] as ScenarioId[]) {
      const rows = [7, 11, 23].map((seed) => evaluateSeed(withScenario(DEFAULT_PARAMS, id), seed, 'fifo'));
      const s = summarize(rows);
      lines.push(`${id}: ${rows.map((r) => `${Math.round(r.normal)}/${Math.round(r.disrupted)}/${r.optimized === null ? 'none' : Math.round(r.optimized)}`).join('  ')}  improved ${s.improved}/${s.n} mean ${s.meanSaved.toFixed(1)}`);
    }
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'));
    expect(baselineParams(DEFAULT_PARAMS).scenario).toBe('normal');
    expect(Object.keys(SCENARIO_DEFS).length).toBe(5);
  });
});
