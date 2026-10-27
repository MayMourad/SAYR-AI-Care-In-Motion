import { useMemo } from 'react';
import { PageHead, r0, pct0, signed } from '../ui/common';
import { useSayr } from '../state';
import { DEFAULT_PARAMS, SCENARIO_DESC } from '../engine/scenario';
import { queueSeries } from '../engine/metrics';
import { fmtClock, SCENARIO_LABEL, TYPE_LABEL } from '../engine/types';
import type { ResType, ScenarioId, ScenarioParams } from '../engine/types';

const IDS: ScenarioId[] = ['normal', 'staff', 'surge', 'lab', 'room'];
const COLORS: Record<ResType, string> = { registration: 'var(--teal-2)', vitals: 'var(--navy-2)', consult: 'var(--copper)', lab: 'var(--mut)', checkout: '#a98a3a' };

export function StressControls() {
  const { params, setParams, sc, metricsBase, metricsNormal, resetScenario, baseRun, scenarioId, setScenario, t } = useSayr();
  const set = (patch: Partial<ScenarioParams>) => setParams({ ...params, ...patch });
  const series = useMemo(() => queueSeries(sc, baseRun.final), [sc, baseRun]);
  const W = 640;
  const H = 190;
  const tMax = 540;
  const maxQ = Math.max(6, ...Object.values(series).flatMap((s) => s.map((x) => x.n)));
  const x = (v: number) => 34 + (v / tMax) * (W - 44);
  const y = (n: number) => H - 24 - (n / maxQ) * (H - 40);
  const step = (s: { t: number; n: number }[]) => {
    let d = '';
    s.forEach((pt, i) => {
      d += i ? `L${x(pt.t).toFixed(1)},${y(s[i - 1].n).toFixed(1)} L${x(pt.t).toFixed(1)},${y(pt.n).toFixed(1)} ` : `M${x(pt.t)},${y(pt.n)} `;
    });
    return d;
  };
  const stations = sc.resources.filter((r) => r.type === 'consult');
  const dWait = metricsBase.totalWait - metricsNormal.totalWait;

  return (
    <>
      <PageHead id="stress" lede="Introduce a disruption and watch it spread. Each scenario changes the simulation itself, so the Flow Canvas, Ripple Trace, Reflow and the Ledger all respond. The same patients, durations and seed are held constant, so any difference is caused by the disruption. Changing the day clears any approved plan.">
        <button className="btn" onClick={resetScenario}>{t('Reset to demo state')}</button>
      </PageHead>

      <div className="scn-grid" role="radiogroup" aria-label={t('Scenario')}>
        {IDS.map((id, i) => (
          <button key={id} role="radio" aria-checked={scenarioId === id} className={`scn${scenarioId === id ? ' on' : ''}`} onClick={() => setScenario(id)}>
            <span className="scn-n">{String(i + 1).padStart(2, '0')}</span>
            <span className="scn-t">{t(SCENARIO_LABEL[id])}</span>
            <span className="scn-d">{t(SCENARIO_DESC[id])}</span>
          </button>
        ))}
      </div>

      <div className="grid side" style={{ marginTop: 18 }}>
        <div className="stack">
          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">Scenario parameters</h2><span className="eyebrow">{t(SCENARIO_LABEL[scenarioId])}</span></div>
            {scenarioId === 'normal' && <p className="small muted">Normal operations has no disruption. Choose a scenario above to introduce one, or adjust the clinic below.</p>}
            {(scenarioId === 'staff' || scenarioId === 'room') && params.outage && (
              <div className="grid g3">
                <div className="field">
                  <label htmlFor="o-res">{scenarioId === 'staff' ? 'Clinician' : 'Room'}</label>
                  <select id="o-res" value={params.outage.resourceId} onChange={(e) => set({ outage: { ...params.outage!, resourceId: e.target.value } })}>
                    {stations.map((r) => <option key={r.id} value={r.id}>{scenarioId === 'staff' ? r.clinician : r.room}</option>)}
                  </select>
                </div>
                <Slider label="Starts" v={params.outage.from} min={0} max={420} step={5} fmt={fmtClock} on={(v) => set({ outage: { ...params.outage!, from: v } })} />
                <Slider label="Lasts" v={params.outage.length} min={15} max={300} step={15} fmt={(v) => `${v} min`} on={(v) => set({ outage: { ...params.outage!, length: v } })} />
              </div>
            )}
            {scenarioId === 'surge' && params.surge && (
              <div className="grid g2">
                <Slider label="Extra walk-in patients" v={params.surge.count} min={2} max={20} step={1} fmt={(v) => String(v)} on={(v) => set({ surge: { ...params.surge!, count: v } })} />
                <Slider label="Around" v={params.surge.at} min={30} max={360} step={15} fmt={fmtClock} on={(v) => set({ surge: { ...params.surge!, at: v } })} />
              </div>
            )}
            {scenarioId === 'lab' && params.labSlow && (
              <div className="grid g2">
                <Slider label="Laboratory duration" v={params.labSlow.factor} min={1.1} max={2.5} step={0.1} fmt={(v) => `+${Math.round((v - 1) * 100)}%`} on={(v) => set({ labSlow: { ...params.labSlow!, factor: v } })} />
                <Slider label="From" v={params.labSlow.from} min={0} max={420} step={15} fmt={fmtClock} on={(v) => set({ labSlow: { ...params.labSlow!, from: v } })} />
              </div>
            )}
            <hr className="rule" />
            <div className="eyebrow" style={{ marginBottom: 8 }}>Clinic and population (custom)</div>
            <div className="grid g3">
              <Slider label="Scheduled patients" v={params.scheduled} min={20} max={70} step={1} fmt={(v) => String(v)} on={(v) => set({ scheduled: v })} />
              <Slider label="Walk-in patients" v={params.walkIns} min={0} max={24} step={1} fmt={(v) => String(v)} on={(v) => set({ walkIns: v })} />
              <Slider label="Needing the laboratory" v={params.labShare} min={0} max={0.6} step={0.05} fmt={pct0} on={(v) => set({ labShare: v })} />
              <Slider label="Protected-slot share" v={params.protectedShare} min={0} max={0.25} step={0.01} fmt={pct0} on={(v) => set({ protectedShare: v })} hint="Externally assigned, non-clinical." />
              <Slider label="Arriving late" v={params.lateRate} min={0} max={0.5} step={0.01} fmt={pct0} on={(v) => set({ lateRate: v })} />
              <Slider label="Duration variability" v={params.cv} min={0} max={0.6} step={0.05} fmt={(v) => v.toFixed(2)} on={(v) => set({ cv: v })} />
              <Slider label="Registration desks" v={params.desks} min={1} max={2} step={1} fmt={(v) => String(v)} on={(v) => set({ desks: v })} />
              <Slider label="Vital-sign stations" v={params.vitals} min={1} max={2} step={1} fmt={(v) => String(v)} on={(v) => set({ vitals: v })} />
              <Slider label="Consultation stations" v={params.stations} min={2} max={3} step={1} fmt={(v) => String(v)} on={(v) => set({ stations: v })} />
            </div>
            <hr className="rule" />
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <div className="field" style={{ width: 150 }}>
                <label htmlFor="seed">Random seed <span className="v">{params.seed}</span></label>
                <input id="seed" type="number" value={params.seed} onChange={(e) => set({ seed: Number(e.target.value) || 1 })} />
              </div>
              <button className="btn" onClick={() => set({ seed: Math.floor(Math.random() * 9000) + 1 })}>New random day</button>
              <button className="btn ghost" onClick={() => set({ ...DEFAULT_PARAMS, scenario: params.scenario, outage: params.outage, surge: params.surge, labSlow: params.labSlow })}>Restore clinic defaults</button>
              <span className="hint">The same seed always gives the same patients, lateness and durations.</span>
            </div>
          </section>

          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">Queue pressure through the day</h2><span className="eyebrow">patients waiting, by service</span></div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Queue length over time by service">
              {[0, 120, 240, 360, 480].map((v) => (
                <g key={v}>
                  <line x1={x(v)} x2={x(v)} y1={10} y2={H - 24} stroke="var(--line)" />
                  <text x={x(v) + 3} y={H - 8} fontSize={10} fontFamily="var(--mono)" fill="var(--mut)">{fmtClock(v)}</text>
                </g>
              ))}
              {[0, Math.round(maxQ / 2), maxQ].map((n) => <text key={n} x={28} y={y(n) + 3} fontSize={10} fontFamily="var(--mono)" fill="var(--mut)" textAnchor="end">{n}</text>)}
              {sc.disruptions.map((d) => <rect key={d.id} x={x(d.from)} y={10} width={x(d.until) - x(d.from)} height={H - 34} fill="url(#hatch-copper)" opacity={0.3} />)}
              {(Object.keys(series) as ResType[]).map((k) => <path key={k} d={step(series[k])} fill="none" stroke={COLORS[k]} strokeWidth={1.8} />)}
            </svg>
            <div className="row small" style={{ flexWrap: 'wrap', gap: 14 }}>
              {(Object.keys(series) as ResType[]).map((k) => <span key={k} className="row" style={{ gap: 5 }}><i style={{ width: 14, height: 3, background: COLORS[k], display: 'inline-block' }} />{TYPE_LABEL[k]}</span>)}
            </div>
          </section>
        </div>

        <aside className="stack">
          <section className="panel">
            <div className="eyebrow">Disruption impact · same patients</div>
            <div className={`big num ${dWait > 0 ? 'delta-bad' : ''}`} style={{ marginTop: 6 }}>{signed(dWait)}<span className="u">min</span></div>
            <div className="stat-l">total patient waiting vs normal operations</div>
            <hr className="rule" />
            <table className="t">
              <thead><tr><th /><th className="r">Normal</th><th className="r">{t(SCENARIO_LABEL[scenarioId])}</th></tr></thead>
              <tbody>
                <tr><td>Total waiting</td><td className="r">{r0(metricsNormal.totalWait)}</td><td className="r">{r0(metricsBase.totalWait)}</td></tr>
                <tr><td>Median wait</td><td className="r">{r0(metricsNormal.median)}</td><td className="r">{r0(metricsBase.median)}</td></tr>
                <tr><td>90th percentile</td><td className="r">{r0(metricsNormal.p90)}</td><td className="r">{r0(metricsBase.p90)}</td></tr>
                <tr><td>Overtime</td><td className="r">{r0(metricsNormal.overtimeTotal)}</td><td className="r">{r0(metricsBase.overtimeTotal)}</td></tr>
                <tr><td>Done by 16:00</td><td className="r">{metricsNormal.completedInShift}</td><td className="r">{metricsBase.completedInShift}</td></tr>
                <tr><td>Unresolved bottlenecks</td><td className="r">{metricsNormal.unresolved}</td><td className="r">{metricsBase.unresolved}</td></tr>
                <tr><td>Patients</td><td className="r">{metricsNormal.scheduledTotal}</td><td className="r">{metricsBase.scheduledTotal}</td></tr>
              </tbody>
            </table>
            <p className="small muted" style={{ marginTop: 10 }}>Both columns come from full replays of the same day. Nothing here is hard-coded.</p>
          </section>
        </aside>
      </div>
    </>
  );
}

function Slider({ label, v, min, max, step, fmt, on, hint }: { label: string; v: number; min: number; max: number; step: number; fmt: (v: number) => string; on: (v: number) => void; hint?: string }) {
  const id = 'sl-' + label.replace(/\W+/g, '-');
  return (
    <div className="field">
      <label htmlFor={id}>{label}<span className="v">{fmt(v)}</span></label>
      <input id={id} className="sl" type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(Number(e.target.value))} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}
