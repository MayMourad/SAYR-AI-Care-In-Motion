import { useMemo, useState } from 'react';
import { FlowCanvas } from '../ui/FlowCanvas';
import type { LinkMode } from '../ui/FlowCanvas';
import { Legend, PageHead, StatusGlyph, r0 } from '../ui/common';
import { useLiveModel } from '../ui/useModel';
import { useSayr } from '../state';
import { fmtClock, PATHWAY_LABEL, PRIORITY_LABEL, SCENARIO_LABEL, TYPE_LABEL } from '../engine/types';
import { DELAY_THRESHOLD, GROUPS } from '../ui/flowModel';
import { POLICY_LABEL } from '../engine/ledger';
import { forecastDemand } from '../engine/forecast';
import type { PolicyId } from '../engine/types';

export function ControlRoom() {
  const { sc, now, setNow, selected, select, policy, setPolicy, liveRun, startReflow, go, interventions, t, scenarioId, ripple } = useSayr();
  const { model, stats } = useLiveModel(true);
  const [links, setLinks] = useState<LinkMode>('delays');
  const fin = liveRun.final;
  const tick = Math.floor(now);

  const inSystem = sc.patients.filter((p) => {
    const first = fin.jobs[p.jobIds[0]];
    const last = fin.jobs[p.jobIds[p.jobIds.length - 1]];
    return first.status === 'done' && first.readyAt! <= tick && !(last.status === 'done' && last.end! <= tick);
  }).length;
  let startedWaits = 0;
  let startedN = 0;
  for (const id of sc.jobOrder) {
    const js = fin.jobs[id];
    if (js.status === 'done' && js.start! <= tick) {
      startedWaits += js.start! - js.readyAt!;
      startedN++;
    }
  }
  const down = model.downs.filter((d) => d.ongoing);
  const available = sc.resources.length - down.length;
  let bottleneck = '';
  let bq = 0;
  for (const ty of GROUPS) {
    if (model.queues[ty].length > bq) {
      bq = model.queues[ty].length;
      bottleneck = TYPE_LABEL[ty];
    }
  }

  const alerts: { tone: 'bad' | 'ok'; text: string }[] = [];
  for (const ty of GROUPS) {
    const q = model.queues[ty];
    if (q.length >= 3) alerts.push({ tone: 'bad', text: `${TYPE_LABEL[ty]} queue: ${q.length} waiting, longest ${Math.round(q[0].waited)} min` });
  }
  for (const dn of down) alerts.push({ tone: 'bad', text: `${dn.label} until ${fmtClock(dn.to)}` });
  const late = Object.values(model.queues).flat().filter((c) => c.priority === 'urgent' && c.waited >= DELAY_THRESHOLD);
  if (late.length) alerts.push({ tone: 'bad', text: `${late.length} protected-slot patient${late.length > 1 ? 's' : ''} past 15 min` });
  if (!alerts.length) alerts.push({ tone: 'ok', text: 'Queues are within limits at this moment' });

  // compact event timeline, straight from the simulation log
  const events = useMemo(() => {
    const out: { at: number; text: string }[] = [];
    const label = (id: string) => sc.resources.find((r) => r.id === id)?.label ?? id;
    for (let i = fin.log.length - 1; i >= 0 && out.length < 9; i--) {
      const e = fin.log[i];
      if (e.t > tick) continue;
      const code = e.patientId ? sc.patients.find((p) => p.id === e.patientId)?.code : '';
      if (e.kind === 'down') out.push({ at: e.t, text: `${sc.disruptions.find((d) => d.id === e.disruptionId)?.label ?? 'Resource unavailable'}` });
      else if (e.kind === 'up') out.push({ at: e.t, text: `${label(e.resourceId!)} available again` });
      else if (e.kind === 'noshow') out.push({ at: e.t, text: `${code} did not attend` });
      else if (e.kind === 'start' && (e.wait ?? 0) >= DELAY_THRESHOLD) out.push({ at: e.t, text: `${code} started ${TYPE_LABEL[sc.jobs[e.jobId!].type].toLowerCase()} after ${Math.round(e.wait!)} min` });
      else if (e.kind === 'ready' && sc.patients.find((p) => p.id === e.patientId)?.surge && sc.jobs[e.jobId!].k === 0) out.push({ at: e.t, text: `${code} arrived (walk-in surge)` });
    }
    return out;
  }, [fin, sc, tick]);

  const fc = useMemo(() => forecastDemand(sc), [sc]);
  const fmax = Math.max(...fc.forecast, ...fc.actualToday, 1);
  const running = new Map(model.blocks.filter((b) => b.kind === 'running').map((b) => [b.resourceId, b]));
  const sel = selected ? sc.patients.find((p) => p.id === selected) : null;

  return (
    <>
      <PageHead id="control" lede="The live view of the clinic. Queues stack in front of the clock, an outage hatches the lane it hits, and the dashed blocks are what today’s plan projects will happen next.">
        <div className="seg" role="group" aria-label="Journey lines">
          {(['delays', 'all', 'selected', 'none'] as LinkMode[]).map((m) => (
            <button key={m} aria-pressed={links === m} onClick={() => setLinks(m)}>{m === 'delays' ? 'Delays' : m === 'all' ? 'All paths' : m === 'selected' ? 'Selected' : 'Off'}</button>
          ))}
        </div>
        <select value={policy} onChange={(e) => setPolicy(e.target.value as PolicyId)} aria-label="Scheduling policy">
          {(Object.keys(POLICY_LABEL) as PolicyId[]).map((p) => <option key={p} value={p}>{POLICY_LABEL[p]}</option>)}
        </select>
        {ripple && <button className="btn" onClick={() => go('ripple')}>{t('Ripple Trace')}</button>}
        <button className="btn copper" onClick={() => (startReflow(), go('reflow'))}>{t('Reflow Studio')} · {fmtClock(Math.floor(now / 5) * 5)}</button>
      </PageHead>

      <div className="kpi-strip" style={{ marginBottom: 16 }}>
        <div className="kpi"><div className="big num">{fmtClock(now)}</div><div className="stat-l">{t('simulation time')}</div><div className="stat-n">{t(SCENARIO_LABEL[scenarioId])}</div></div>
        <div className="kpi"><div className="big num">{inSystem}</div><div className="stat-l">Patients in system</div><div className="stat-n">{stats.completed} departed of {stats.total}</div></div>
        <div className="kpi"><div className={`big num ${stats.waiting >= 6 ? 'delta-bad' : ''}`}>{stats.waiting}</div><div className="stat-l">Waiting now</div><div className="stat-n">longest {r0(stats.longest)} min</div></div>
        <div className="kpi"><div className="big num">{available}<span className="u">/ {sc.resources.length}</span></div><div className="stat-l">Resources available</div><div className="stat-n">{down.length ? down.map((d) => d.label).join(', ') : 'none unavailable'}</div></div>
        <div className="kpi"><div className="big num">{startedN ? r0(startedWaits / startedN) : 0}<span className="u">min</span></div><div className="stat-l">Average wait per appointment</div><div className="stat-n">{startedN} started so far</div></div>
        <div className="kpi"><div className="big sm num" style={{ marginTop: 8 }}>{bq >= 2 ? bottleneck : 'None'}</div><div className="stat-l">Active bottleneck</div><div className="stat-n">{bq >= 2 ? `${bq} waiting` : 'no queue above 1'}</div></div>
      </div>

      <div className="grid side">
        <div className="stack">
          <div className="panel flush">
            <div className="flow-scroll">
              <FlowCanvas sc={sc} model={model} now={now} onNow={setNow} selected={selected} onSelect={select} links={links} />
            </div>
            <Legend />
          </div>
          <div className="grid g2">
            <section className="panel">
              <div className="panel-h"><h2 className="panel-t">Event timeline</h2><span className="eyebrow">latest first · from the log</span></div>
              {events.length ? events.map((e, i) => <div className="evt" key={i}><span className="mono">{fmtClock(e.at)}</span><span>{e.text}</span></div>) : <p className="small muted">Nothing notable has happened yet.</p>}
            </section>
            <section className="panel">
              <div className="panel-h"><h2 className="panel-t">{t('Demand forecast')}</h2><span className="eyebrow">arrivals per hour</span></div>
              <svg viewBox="0 0 300 110" style={{ width: '100%' }} role="img" aria-label="Forecast and actual arrivals per hour">
                {fc.forecast.map((f, h) => {
                  const x = 8 + h * 41;
                  return (
                    <g key={h}>
                      <rect x={x} y={90 - (f / fmax) * 76} width={15} height={(f / fmax) * 76} fill="var(--navy-2)" opacity={0.55} />
                      <rect x={x + 16} y={90 - (fc.actualToday[h] / fmax) * 76} width={15} height={(fc.actualToday[h] / fmax) * 76} fill="var(--teal)" />
                      <text x={x + 15} y={103} textAnchor="middle" fontSize={8.5} fontFamily="var(--mono)" fill="var(--mut)">{fc.hourLabels[h].slice(0, 2)}</text>
                    </g>
                  );
                })}
              </svg>
              <div className="row small" style={{ gap: 14 }}><span><i className="dot" style={{ background: 'var(--navy-2)', opacity: 0.55 }} />forecast</span><span><i className="dot" style={{ background: 'var(--teal)' }} />arrivals today</span></div>
              <p className="small muted" style={{ marginTop: 8 }}>
                {fc.models.find((m) => m.id === fc.chosen)!.label}: held-out error {fc.models.find((m) => m.id === fc.chosen)!.mae.toFixed(2)} patients/hour. Forecast {r0(fc.totalForecast)}, actual {fc.totalActual}. A baseline on synthetic history, not a machine-learning model. Details under About, methods &amp; credits.
              </p>
            </section>
          </div>
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">{t('Needs attention')}</h2><span className="eyebrow">{fmtClock(now)}</span></div>
            <div className="stack" style={{ gap: 8 }}>
              {alerts.map((a, i) => (
                <div className="row" key={i} style={{ alignItems: 'flex-start' }}>
                  <StatusGlyph kind={a.tone === 'ok' ? 'ok' : 'bad'} />
                  <span className="small">{a.text}</span>
                </div>
              ))}
            </div>
            {interventions.length > 0 && <div className="chip teal" style={{ marginTop: 10 }}>Running an approved plan</div>}
          </section>

          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">{t('Resources')}</h2></div>
            <table className="t">
              <tbody>
                {sc.resources.map((r) => {
                  const dn = down.some((d) => d.resourceId === r.id);
                  const b = running.get(r.id);
                  return (
                    <tr key={r.id}>
                      <td style={{ width: 22 }}><StatusGlyph kind={dn ? 'down' : b ? 'busy' : 'idle'} /></td>
                      <td className="mono">{r.id}</td>
                      <td className="small muted">{dn ? 'Unavailable' : b ? `${b.code} · since ${fmtClock(b.x0)}` : 'Idle'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {sel && (
            <section className="panel">
              <div className="panel-h"><h2 className="panel-t">{sel.code}</h2><button className="btn sm ghost" onClick={() => select(null)}>Clear</button></div>
              <p className="small">{PATHWAY_LABEL[sel.pathway]} · {sel.walkIn ? 'walk-in' : 'scheduled'} · {PRIORITY_LABEL[sel.priority].toLowerCase()}</p>
              <p className="small muted">{sel.walkIn ? 'Arrived' : 'Scheduled'} {fmtClock(sel.sched)}{sel.lateBy ? `, arrived ${sel.lateBy} min late` : ''}. Stage-by-stage view in Journey Lines.</p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
