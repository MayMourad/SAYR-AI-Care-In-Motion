import { useMemo, useRef, useState } from 'react';
import { PageHead, r0, pct0, signed } from '../ui/common';
import { useSayr } from '../state';
import { policyTable, POLICY_LABEL, totalWait, waterfall } from '../engine/ledger';
import type { Waterfall, WaterfallStep } from '../engine/ledger';
import { snapshotAt } from '../engine/sim';
import { computeMetrics, DELAYED_APPT_MIN, URGENT_TARGET, UNRESOLVED_MIN } from '../engine/metrics';
import type { Metrics } from '../engine/metrics';
import { HARM_CAP } from '../engine/plan';
import { evaluateSeed, eventTimeOf, summarize } from '../engine/seeds';
import type { SeedRow } from '../engine/seeds';
import { fmtClock, SCENARIO_LABEL, TYPE_LABEL } from '../engine/types';
import { scenarioHeadline } from '../engine/scenario';

interface Row {
  name: string;
  note?: string;
  vals: [number, number, number | null];
  fmt: (v: number) => string;
  lower: boolean;
  unit?: string;
  neutral?: boolean; // a change is reported, not judged good or bad
}

const SEEDS = [7, 11, 23, 31, 42, 57, 64, 88];

export function MinutesLedger() {
  const { sc, policy, liveRun, interventions, reflowUi, metricsBase, metricsNormal, normalSc, normalFinal, go, t, scenarioId, params } = useSayr();
  const accepted = interventions[interventions.length - 1];
  const result = reflowUi.result;

  const wf: { w: Waterfall; preview: boolean; label: string; projected: number; changes: number } | null = useMemo(() => {
    const labelOf = (rid: string) => rid;
    if (accepted) {
      const pr = accepted.proposal;
      const snap = snapshotAt(accepted.prevRun, pr.t);
      const w = waterfall(sc, accepted.prevRun.final, snap, pr.base, pr.plan, pr.changes, labelOf, pr.baseStats.totalWait - pr.stats.totalWait);
      return { w, preview: false, label: pr.label, projected: pr.baseStats.totalWait - pr.stats.totalWait, changes: pr.changes.length };
    }
    if (result && result.recommendedId) {
      const c = result.candidates.find((x) => x.profile.id === result.recommendedId)!;
      const snap = snapshotAt(liveRun, result.t);
      const w = waterfall(sc, liveRun.final, snap, result.base, c.plan, c.changes, labelOf, result.baseStats.totalWait - c.stats.totalWait);
      return { w, preview: true, label: c.profile.label, projected: result.baseStats.totalWait - c.stats.totalWait, changes: c.changes.length };
    }
    return null;
  }, [sc, accepted, result, liveRun]);

  const policies = useMemo(() => policyTable(sc), [sc]);
  const dis: Metrics = accepted ? computeMetrics(sc, accepted.prevRun.final) : metricsBase;
  const opt: Metrics | null = wf ? computeMetrics(sc, wf.w.finalState) : null;
  const base = metricsNormal;
  const measured = wf ? wf.w.final - wf.w.baseline : 0;
  const normalTotal = useMemo(() => totalWait(normalSc, normalFinal), [normalSc, normalFinal]);

  const rows: Row[] = [
    { name: 'Total patient waiting', note: 'minutes from ready to served, summed', vals: [base.totalWait, dis.totalWait, opt?.totalWait ?? null], fmt: r0, lower: true, unit: 'min' },
    { name: 'Mean wait per patient', vals: [base.mean, dis.mean, opt?.mean ?? null], fmt: r0, lower: true, unit: 'min' },
    { name: 'Median wait per patient', vals: [base.median, dis.median, opt?.median ?? null], fmt: r0, lower: true, unit: 'min' },
    { name: '90th-percentile wait', note: 'the worst-off tenth of patients', vals: [base.p90, dis.p90, opt?.p90 ?? null], fmt: r0, lower: true, unit: 'min' },
    { name: 'Throughput (journeys done by 16:00)', note: `of ${dis.scheduledTotal} who attended`, vals: [base.completedInShift, dis.completedInShift, opt?.completedInShift ?? null], fmt: r0, lower: false },
    { name: 'Incomplete journeys at 16:00', vals: [base.incompleteAt16, dis.incompleteAt16, opt?.incompleteAt16 ?? null], fmt: r0, lower: true },
    { name: 'Average journey duration', note: 'arrival to departure', vals: [base.meanJourney, dis.meanJourney, opt?.meanJourney ?? null], fmt: r0, lower: true, unit: 'min' },
    { name: 'Delayed appointments', note: `waited ${DELAYED_APPT_MIN}+ min, of ${dis.appts}`, vals: [base.delayedAppts, dis.delayedAppts, opt?.delayedAppts ?? null], fmt: r0, lower: true },
    { name: 'Resource utilisation', note: 'busy ÷ available within the shift', vals: [base.utilOverall * 100, dis.utilOverall * 100, opt ? opt.utilOverall * 100 : null], fmt: (v) => `${Math.round(v)}%`, lower: false, unit: ' pts' },
    { name: 'Staff overtime', note: 'resource-minutes past 16:00', vals: [base.overtimeTotal, dis.overtimeTotal, opt?.overtimeTotal ?? null], fmt: r0, lower: true, unit: 'min' },
    { name: 'Rescheduled appointments', note: 'changed by the approved plan', vals: [0, 0, wf ? wf.changes : null], fmt: r0, lower: true, neutral: true },
    { name: 'Unresolved bottlenecks', note: `queues held past their limit ${UNRESOLVED_MIN}+ min`, vals: [base.unresolved, dis.unresolved, opt?.unresolved ?? null], fmt: r0, lower: true },
    { name: 'Constraint violations', note: 'audited from the realised log', vals: [base.violationTotal, dis.violationTotal, opt?.violationTotal ?? null], fmt: r0, lower: true },
  ];

  // patients made worse off by the optimized plan, matched by patient
  const worse = useMemo(() => {
    if (!opt) return null;
    const before = new Map(dis.patients.map((p) => [p.patientId, p]));
    const list = opt.patients
      .map((p) => ({ p, d: p.wait - (before.get(p.patientId)?.wait ?? p.wait) }))
      .filter((x) => x.d >= 5)
      .sort((a, b) => b.d - a.d);
    const better = opt.patients.filter((p) => p.wait - (before.get(p.patientId)?.wait ?? p.wait) <= -5).length;
    return { list, better, n: opt.patients.length };
  }, [dis, opt]);

  const [seedRows, setSeedRows] = useState<SeedRow[]>([]);
  const [seedBusy, setSeedBusy] = useState(false);
  const cancel = useRef(false);
  const runSeeds = () => {
    setSeedRows([]);
    setSeedBusy(true);
    cancel.current = false;
    const out: SeedRow[] = [];
    const step = (i: number) => {
      if (i >= SEEDS.length || cancel.current) return setSeedBusy(false);
      out.push(evaluateSeed(params, SEEDS[i], policy));
      setSeedRows(out.slice());
      setTimeout(() => step(i + 1), 20);
    };
    setTimeout(() => step(0), 30);
  };
  const seedSum = seedRows.length ? summarize(seedRows) : null;

  const steps: WaterfallStep[] | null = wf
    ? [
        { id: 'normal', label: 'Normal operations', kind: 'total', value: normalTotal, level: normalTotal, note: 'The same patients with no disruption', jobIds: [] },
        { id: 'disr', label: interventions.length > 1 ? 'Disruption and earlier approvals' : scenarioId === 'normal' ? 'Normal day, live dispatch' : `Disruption: ${t(SCENARIO_LABEL[scenarioId])}`, kind: 'delta', value: wf.w.baseline - normalTotal, level: wf.w.baseline, note: 'Extra waiting the disruption causes under live dispatch', jobIds: [] },
        ...wf.w.steps.slice(1),
      ]
    : null;

  return (
    <>
      <PageHead id="ledger" lede="Operational performance as an accountable balance of time and capacity. Every figure is computed from the simulation records, on the same patients and the same seed. Fewer waiting minutes is an operational measure only: this ledger makes no claim of clinical benefit.">
        <button className="btn" onClick={() => go('desk')}>{t('Open the Action Desk')}</button>
      </PageHead>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.35fr) minmax(0,1.15fr)', alignItems: 'start' }}>
        <section className="panel">
          <div className="panel-h">
            <h2 className="panel-t">{t('Where the minutes went')}</h2>
            {wf && <span className={`chip ${wf.preview ? 'copper' : 'teal'}`}>{wf.preview ? 'Preview · not approved' : 'Approved plan, measured'}</span>}
          </div>
          {wf && steps ? (
            <>
              <div className="row" style={{ gap: 26, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 6 }}>
                <div>
                  <div className={`big num ${measured <= 0 ? 'delta-good' : 'delta-bad'}`}>{signed(measured)}<span className="u">min</span></div>
                  <div className="stat-l">simulated change in waiting · {wf.w.baseline ? signed((measured / wf.w.baseline) * 100, 1) : '0'}%</div>
                </div>
                <div>
                  <div className="big md num muted">{signed(-wf.projected)}<span className="u">min</span></div>
                  <div className="stat-l">what the planner projected</div>
                </div>
              </div>
              <WaterfallChart steps={steps} />
              <p className="small muted">
                {wf.preview ? 'Replay of the recommended proposal under synthetic assumptions; approve it to make it the plan in force. ' : ''}
                Each bar is its own replay of the day, so the bars sum exactly to the difference. “Hold the current plan fixed” is the effect of following a fixed plan instead of dispatching live. Projection and measurement differ because the planner only knows booked lengths. A drop in waiting minutes does not by itself mean better care.
              </p>
            </>
          ) : (
            <>
              <div className="row" style={{ gap: 26, marginBottom: 8, flexWrap: 'wrap' }}>
                <div><div className="big num">{r0(normalTotal)}</div><div className="stat-l">normal operations</div></div>
                <div><div className={`big num ${dis.totalWait > normalTotal ? 'delta-bad' : ''}`}>{r0(dis.totalWait)}</div><div className="stat-l">{t(SCENARIO_LABEL[scenarioId])}</div></div>
              </div>
              <div className="empty">
                <b>No proposal to account for yet</b>
                Run Reflow, and the ledger will decompose the simulated difference into the changes that caused it.
                <div style={{ marginTop: 12 }}><button className="btn copper" onClick={() => go('reflow')}>{t('Reflow Studio')}</button></div>
              </div>
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel-h"><h2 className="panel-t">{t('The balance')}</h2><span className="eyebrow">Δ = optimized − disrupted</span></div>
          <div className="ledger-row l5 head"><span /><span>{t('Baseline')}</span><span>{t('Disrupted')}</span><span>{t('Optimized')}</span><span>Δ</span></div>
          {rows.map((r) => <LedgerRow key={r.name} r={r} t={t} />)}
        </section>
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <section className="panel">
          <div className="panel-h"><h2 className="panel-t">{t('Fairness across operational groups')}</h2><span className="eyebrow">mean · p90 wait, min</span></div>
          <table className="t">
            <thead><tr><th>Group</th><th className="r">n</th><th className="r">{t('Baseline')}</th><th className="r">{t('Disrupted')}</th><th className="r">{t('Optimized')}</th></tr></thead>
            <tbody>
              {dis.groups.map((g, i) => (
                <tr key={g.id}>
                  <td>{t(g.label)}</td>
                  <td className="r">{g.n}</td>
                  <td className="r">{r0(base.groups[i].mean)} · {r0(base.groups[i].p90)}</td>
                  <td className="r">{r0(g.mean)} · {r0(g.p90)}</td>
                  <td className="r">{opt ? <b>{r0(opt.groups[i].mean)} · {r0(opt.groups[i].p90)}</b> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr className="rule" />
          <div className="eyebrow" style={{ marginBottom: 6 }}>{t('Fairness and protected slots')}</div>
          <div className="row small" style={{ gap: 22, flexWrap: 'wrap' }}>
            <span>Protected-slot median wait <b className="num">{r0(dis.fairness.urgentMedian)}{opt ? ` → ${r0(opt.fairness.urgentMedian)}` : ''} min</b></span>
            <span>Within {URGENT_TARGET} min <b className="num">{pct0(dis.fairness.urgentWithinTarget)}{opt ? ` → ${pct0(opt.fairness.urgentWithinTarget)}` : ''}</b></span>
            <span>Priority inversions <b className="num">{dis.fairness.inversions}{opt ? ` → ${opt.fairness.inversions}` : ''}</b></span>
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>Protected slots are externally assigned, non-clinical inputs. Fairness checks on synthetic data do not establish fairness in a real deployment.</p>
        </section>

        <section className="panel">
          <div className="panel-h"><h2 className="panel-t">{t('Patients made worse off')}</h2><span className="eyebrow">optimized vs disrupted, ≥ 5 min</span></div>
          {worse ? (
            <>
              <div className="row" style={{ gap: 26, marginBottom: 8 }}>
                <div><div className="big md num delta-bad">{worse.list.length}</div><div className="stat-l">wait longer</div></div>
                <div><div className="big md num delta-good">{worse.better}</div><div className="stat-l">wait less</div></div>
                <div><div className="big md num">{worse.n - worse.list.length - worse.better}</div><div className="stat-l">about the same</div></div>
              </div>
              {worse.list.slice(0, 6).map(({ p, d }) => (
                <div key={p.patientId} className="row small" style={{ padding: '5px 0', borderBottom: '1px dashed var(--line)' }}>
                  <b className="mono">{p.code}</b><span className="muted">{p.walkIn ? 'walk-in' : 'scheduled'}</span><span className="sp" /><span className="mono delta-bad">+{r0(d)} min</span>
                </div>
              ))}
              {!worse.list.length && <p className="small muted">No patient waits 5 minutes or more longer under the approved plan.</p>}
              <p className="small muted" style={{ marginTop: 8 }}>No one’s planned wait may grow by more than {HARM_CAP} min; the replay uses realised durations, so a few can differ.</p>
            </>
          ) : <p className="small muted">Appears once a proposal is approved or previewed. It lists every patient the plan leaves waiting longer, so an average cannot hide them.</p>}
        </section>
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <section className="panel">
          <div className="panel-h"><h2 className="panel-t">{t('Distribution of patient waiting')}</h2><span className="eyebrow">patients per wait band</span></div>
          <Histogram series={[{ label: t('Baseline'), m: base, color: 'var(--mut-2)' }, { label: t('Disrupted'), m: dis, color: 'var(--copper-2)' }, ...(opt ? [{ label: t('Optimized'), m: opt, color: 'var(--teal)' }] : [])]} />
        </section>
        <section className="panel">
          <div className="panel-h"><h2 className="panel-t">{t('Evidence across seeds')}</h2><button className="btn sm" disabled={seedBusy} onClick={runSeeds}>{seedBusy ? `Running ${seedRows.length}/${SEEDS.length}…` : `Run ${SEEDS.length} seeds`}</button></div>
          <p className="small muted" style={{ marginBottom: 8 }}>
            One run is a demonstration. This repeats <b>{t(SCENARIO_LABEL[scenarioId])}</b> on {SEEDS.length} other synthetic days, runs Reflow at {fmtClock(eventTimeOf(params))}, and replays the recommended plan. Nothing is cherry-picked: days where Reflow found no beneficial change are shown too.
          </p>
          {scenarioId === 'normal' ? <p className="small muted">Choose a disruption scenario in Stress Controls first.</p> : seedRows.length ? (
            <>
              <table className="t">
                <thead><tr><th>Seed</th><th className="r">Normal</th><th className="r">{t('Disrupted')}</th><th className="r">{t('Optimized')}</th><th className="r">Saved</th></tr></thead>
                <tbody>
                  {seedRows.map((r) => (
                    <tr key={r.seed}><td className="mono">{r.seed}</td><td className="r">{r0(r.normal)}</td><td className="r">{r0(r.disrupted)}</td><td className="r">{r.optimized === null ? 'no change' : r0(r.optimized)}</td><td className={`r ${r.saved > 0 ? 'delta-good' : r.saved < 0 ? 'delta-bad' : 'muted'}`}>{r.optimized === null ? '—' : signed(-r.saved)}</td></tr>
                  ))}
                </tbody>
              </table>
              {seedSum && <p className="small" style={{ marginTop: 8 }}>Improved on <b>{seedSum.improved}</b> of {seedSum.n} days; worse on {seedSum.worse}. Mean saving {seedSum.meanSaved.toFixed(1)} min (median {seedSum.median.toFixed(1)}, range {seedSum.min.toFixed(0)} to {seedSum.max.toFixed(0)}). Saving is relative to the disrupted day.</p>}
            </>
          ) : <p className="small muted">Press the button to run it. It takes a few seconds.</p>}
        </section>
      </div>

      <div className="grid g3" style={{ marginTop: 18 }}>
        <section className="panel">
          <div className="panel-h"><h2 className="panel-t">{t('Resources')}</h2></div>
          {sc.resources.map((r) => {
            const m = opt ?? dis;
            return (
              <div key={r.id} style={{ marginBottom: 8 }}>
                <div className="row small"><span className="mono">{r.id}</span><span className="sp" /><span className="mono">{pct0(m.utilByRes[r.id])}{m.overtimeByRes[r.id] > 0 ? ` · +${r0(m.overtimeByRes[r.id])}m OT` : ''}</span></div>
                <div className={`bar ${m.overtimeByRes[r.id] > 0 ? 'copper' : ''}`}><i style={{ width: `${Math.min(100, m.utilByRes[r.id] * 100)}%` }} /></div>
              </div>
            );
          })}
        </section>
        <section className="panel">
          <div className="panel-h"><h2 className="panel-t">{t('Unresolved bottlenecks')}</h2><span className="eyebrow">{(opt ?? dis).episodes.length} episodes</span></div>
          {(opt ?? dis).episodes.length ? (opt ?? dis).episodes.map((e, i) => (
            <div key={i} className="row small" style={{ padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
              <span className="mono">{fmtClock(e.from)}–{fmtClock(e.to)}</span><span>{TYPE_LABEL[e.type]}</span><span className="sp" /><span className="mono muted">peak {e.peak}</span>
              {e.unresolved && <span className="chip copper">unresolved</span>}
            </div>
          )) : <p className="small muted">No queue stayed past its limit.</p>}
        </section>
        <section className="panel">
          <div className="panel-h"><h2 className="panel-t">{t('Scheduling policies, same day')}</h2></div>
          <table className="t">
            <thead><tr><th>Policy</th><th className="r">Total</th><th className="r">p90</th><th className="r">Inv.</th></tr></thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.id} className={p.id === policy ? 'hl' : ''}><td>{POLICY_LABEL[p.id as keyof typeof POLICY_LABEL]}</td><td className="r">{r0(p.metrics.totalWait)}</td><td className="r">{r0(p.metrics.p90)}</td><td className="r">{p.metrics.fairness.inversions}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="small muted" style={{ marginTop: 8 }}>The fewest total minutes is not automatically the fairest: compare inversions (a less urgent patient started first).</p>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-h"><h2 className="panel-t">{t('Methodology')}</h2><span className="eyebrow">seed {sc.params.seed} · fixed</span></div>
        <div className="grid g3 small">
          <div>
            <b>Dataset and scenario</b>
            <p className="muted">Synthetic: {sc.patients.length} patients ({sc.patients.filter((p) => !p.walkIn).length} scheduled, {sc.patients.filter((p) => p.walkIn).length} walk-in), generated from seed {sc.params.seed}. Scenario: {scenarioHeadline(sc)}. Baseline, disrupted and optimized runs share the same base patients, arrivals and realised durations.</p>
          </div>
          <div>
            <b>Simulation and optimization</b>
            <p className="muted">A deterministic discrete-event simulation. Reflow is a constraint-aware local search over assignments and order (not machine learning), with the current policy ({POLICY_LABEL[policy]}) as the baseline. Planning uses booked lengths; the replay uses realised ones.</p>
          </div>
          <div>
            <b>Definitions and limits</b>
            <p className="muted">Waiting = minutes between becoming ready and starting service; transfers and service are excluded. Percentages use the patients who attended as denominator. A single run is a demonstration; the seeds panel shows the spread. Results hold only under these synthetic assumptions.</p>
          </div>
        </div>
      </section>
    </>
  );
}

function LedgerRow({ r, t }: { r: Row; t: (s: string) => string }) {
  const [b, d, o] = r.vals;
  const delta = o !== null ? o - d : d - b;
  const zero = Math.abs(delta) < 0.05;
  const good = r.lower ? delta < 0 : delta > 0;
  const shown = Math.abs(delta) < 10 && !Number.isInteger(delta) ? 1 : 0;
  return (
    <div className="ledger-row l5">
      <div className="nm">{t(r.name)}{r.note && <small>{r.note}</small>}</div>
      <div className="v muted">{r.fmt(b)}</div>
      <div className="v">{r.fmt(d)}</div>
      <div className="v" style={{ color: o === null ? 'var(--mut-2)' : undefined }}>{o === null ? '—' : r.fmt(o)}</div>
      <div className={`d ${zero || r.neutral ? 'muted' : good ? 'delta-good' : 'delta-bad'}`} title={o !== null ? 'optimized − disrupted' : 'disrupted − baseline'}>{zero ? '±0' : signed(delta, shown)}</div>
    </div>
  );
}

function Histogram({ series }: { series: { label: string; m: Metrics; color: string }[] }) {
  const edges = [0, 5, 10, 20, 30, 45, 60, 90, Infinity];
  const labels = ['0–5', '5–10', '10–20', '20–30', '30–45', '45–60', '60–90', '90+'];
  const counts = series.map((s) => edges.slice(0, -1).map((lo, i) => s.m.patients.filter((p) => p.wait >= lo && p.wait < edges[i + 1]).length));
  const mx = Math.max(1, ...counts.flat());
  const W = 520;
  const H = 190;
  const gw = (W - 30) / labels.length;
  const bw = Math.min(14, (gw - 6) / series.length);
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }} role="img" aria-label="Number of patients by waiting-time band">
        {labels.map((l, i) => (
          <g key={l}>
            {series.map((s, k) => {
              const h = (counts[k][i] / mx) * (H - 50);
              return (
                <g key={s.label}>
                  <rect x={24 + i * gw + k * (bw + 1)} y={H - 28 - h} width={bw} height={h} fill={s.color} rx={1.5}><title>{`${s.label}: ${counts[k][i]} patients waited ${l} min`}</title></rect>
                  {counts[k][i] > 0 && <text x={24 + i * gw + k * (bw + 1) + bw / 2} y={H - 31 - h} textAnchor="middle" fontSize={8.5} fontFamily="var(--mono)" fill="var(--ink-2)">{counts[k][i]}</text>}
                </g>
              );
            })}
            <text x={24 + i * gw + (gw - 6) / 2} y={H - 12} textAnchor="middle" fontSize={9.5} fontFamily="var(--mono)" fill="var(--mut)">{l}</text>
          </g>
        ))}
        <line x1={20} x2={W - 6} y1={H - 28} y2={H - 28} stroke="var(--line-2)" />
      </svg>
      <div className="row small" style={{ gap: 14, flexWrap: 'wrap' }}>{series.map((s) => <span key={s.label}><i className="dot" style={{ background: s.color }} />{s.label}</span>)}</div>
    </>
  );
}

function WaterfallChart({ steps }: { steps: WaterfallStep[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 800;
  const H = 330;
  const m = { l: 56, r: 12, t: 30, b: 78 };
  const levels = steps.map((s) => s.level);
  const mn = Math.min(...levels);
  const mx = Math.max(...levels);
  const pad = Math.max(20, (mx - mn) * 0.2);
  const y0 = Math.floor((mn - pad) / 10) * 10;
  const y1 = Math.ceil((mx + pad * 0.6) / 10) * 10;
  const y = (v: number) => m.t + (1 - (v - y0) / (y1 - y0)) * (H - m.t - m.b);
  const bw = (W - m.l - m.r) / steps.length;
  const ticks = Array.from({ length: 5 }, (_, i) => y0 + ((y1 - y0) * i) / 4);
  let prev = steps[0].level;
  const wrap = (s: string) => {
    const words = s.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > 15) {
        lines.push(cur);
        cur = w;
      } else cur = (cur + ' ' + w).trim();
    }
    lines.push(cur);
    return lines.slice(0, 3);
  };
  return (
    <div style={{ position: 'relative' }}>
      <svg className="wf-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Waterfall of waiting minutes: normal, disruption, then each operational change">
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={m.l} x2={W - m.r} y1={y(tk)} y2={y(tk)} stroke="var(--line)" strokeWidth={0.8} strokeDasharray="2 3" />
            <text x={m.l - 8} y={y(tk) + 4} textAnchor="end" className="wf-lbl" style={{ fontFamily: 'var(--mono)', fontSize: 10.5 }}>{r0(tk)}</text>
          </g>
        ))}
        <text x={m.l} y={14} className="wf-lbl" style={{ fontSize: 10.5 }}>Total patient waiting minutes · axis starts at {r0(y0)}</text>
        {steps.map((s, i) => {
          const x = m.l + i * bw + bw * 0.16;
          const w = bw * 0.68;
          const top = s.kind === 'total' ? s.level : Math.max(prev, s.level);
          const bot = s.kind === 'total' ? y0 : Math.min(prev, s.level);
          const fill = s.kind === 'total' ? 'var(--navy)' : s.value <= 0 ? 'var(--teal)' : 'var(--copper)';
          const el = (
            <g key={s.id} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} opacity={hover === null || hover === i ? 1 : 0.55} style={{ transition: 'opacity .15s' }}>
              <rect className="wf-bar" x={x} y={y(top)} width={w} height={Math.max(2, y(bot) - y(top))} rx={2} fill={fill} />
              {i < steps.length - 1 && <line x1={x + w} x2={x + bw} y1={y(s.level)} y2={y(s.level)} stroke="var(--mut-2)" strokeWidth={1} strokeDasharray="2 2" />}
              <text className="wf-val" x={x + w / 2} y={y(top) - 6} textAnchor="middle" fill={s.kind === 'total' ? 'var(--ink)' : s.value <= 0 ? 'var(--teal)' : 'var(--copper)'}>
                {s.kind === 'total' ? r0(s.value) : signed(s.value)}
              </text>
              {wrap(s.label).map((ln, k) => (
                <text key={k} className="wf-lbl" x={x + w / 2} y={H - m.b + 18 + k * 13} textAnchor="middle">{ln}</text>
              ))}
              <rect x={x - 6} y={m.t} width={w + 12} height={H - m.t - m.b + 50} fill="transparent" />
            </g>
          );
          prev = s.level;
          return el;
        })}
      </svg>
      {hover !== null && (
        <div className="tip" style={{ left: `${((m.l + hover * bw + bw / 2) / W) * 100}%`, top: 36, transform: 'translateX(-50%)' }}>
          <b>{steps[hover].label}</b>
          <div className="tip-row">{steps[hover].kind === 'total' ? `${r0(steps[hover].value)} min` : `${signed(steps[hover].value)} min`} · {steps[hover].note}</div>
          {steps[hover].jobIds.length > 0 && <div className="tip-row">{steps[hover].jobIds.length} appointments</div>}
        </div>
      )}
    </div>
  );
}
