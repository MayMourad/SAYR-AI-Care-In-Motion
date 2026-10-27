import { useEffect } from 'react';
import { FlowCanvas } from '../ui/FlowCanvas';
import { Legend, r0 } from '../ui/common';
import { useLiveModel } from '../ui/useModel';
import { useReducedMotion, useSayr } from '../state';
import { fmtClock, SCENARIO_LABEL } from '../engine/types';
import type { ResType } from '../engine/types';
import { DELAY_THRESHOLD } from '../ui/flowModel';
import { scenarioHeadline } from '../engine/scenario';

let autoplayed = false;

const NODES: { type: ResType; x: number; y: number; label: string }[] = [
  { type: 'registration', x: 90, y: 120, label: 'Registration' },
  { type: 'vitals', x: 270, y: 120, label: 'Vital signs' },
  { type: 'consult', x: 470, y: 120, label: 'Consultation' },
  { type: 'lab', x: 470, y: 225, label: 'Laboratory' },
  { type: 'checkout', x: 670, y: 120, label: 'Checkout' },
];

/** A route map of the clinic. Every dot is a patient in the simulation at the current clock time. */
function RouteMap() {
  const { model } = useLiveModel(false);
  const { sc, liveRun, now, t } = useSayr();
  const running = (ty: ResType) => model.blocks.filter((b) => b.kind === 'running' && b.type === ty).length;
  let done = 0;
  for (const p of sc.patients) {
    const last = liveRun.final.jobs[p.jobIds[p.jobIds.length - 1]];
    if (last.status === 'done' && last.end! <= now) done++;
  }
  return (
    <svg className="route-svg" viewBox="0 0 780 300" role="img" aria-label="Route map of patients moving through the clinic" style={{ width: '100%', display: 'block' }}>
      <g fill="none" stroke="var(--line-2)" strokeWidth={2}>
        <path d="M20 120 H72" />
        <path d="M108 120 H252" />
        <path d="M288 120 H452" />
        <path d="M488 120 H652" />
        <path d="M470 138 V205" />
        <path d="M688 120 H760" />
      </g>
      <g fill="none" stroke="var(--teal-2)" strokeWidth={2} opacity={0.8}>
        <path className="flow" d="M20 120 H72" />
        <path className="flow" d="M108 120 H252" />
        <path className="flow" d="M288 120 H452" />
        <path className="flow" d="M488 120 H652" />
        <path className="flow" d="M470 138 V205" />
        <path className="flow" d="M688 120 H760" />
      </g>
      {NODES.map((n) => {
        const q = model.queues[n.type];
        const busy = running(n.type);
        const capacity = sc.resources.filter((r) => r.type === n.type).length;
        const down = model.downs.some((d) => d.ongoing && sc.resources.find((r) => r.id === d.resourceId)?.type === n.type);
        return (
          <g key={n.type}>
            {q.slice(0, 16).map((c, i) => (
              <circle key={c.jobId} cx={n.x - 34 - (i % 8) * 9} cy={n.y - 34 - Math.floor(i / 8) * 10} r={3.6} fill={c.waited >= DELAY_THRESHOLD ? 'var(--copper)' : 'var(--navy-2)'} stroke={c.priority === 'urgent' ? 'var(--ink)' : 'none'} />
            ))}
            <circle cx={n.x} cy={n.y} r={19} fill={down ? 'url(#hatch-copper)' : 'var(--paper-2)'} stroke={down ? 'var(--copper)' : busy ? 'var(--teal)' : 'var(--navy)'} strokeWidth={2} />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fontFamily="var(--mono)" fontSize={12} fontWeight={700} fill="var(--ink)">{busy}/{capacity}</text>
            <text x={n.x} y={n.y + 38} textAnchor="middle" fontSize={12.5} fontWeight={600} fill="var(--ink)">{t(n.label)}</text>
            <text x={n.x} y={n.y + 53} textAnchor="middle" fontFamily="var(--mono)" fontSize={10.5} fill={q.length >= 4 ? 'var(--copper)' : 'var(--mut)'}>{q.length} waiting</text>
          </g>
        );
      })}
      <text x={760} y={100} textAnchor="end" fontFamily="var(--mono)" fontSize={11} fill="var(--teal)">{done} departed</text>
      <text x={20} y={100} fontFamily="var(--mono)" fontSize={11} fill="var(--mut)">arrivals</text>
    </svg>
  );
}

export function SystemInMotion() {
  const s = useSayr();
  const { sc, now, setNow, playing, setPlaying, selected, select, go, t, scenarioId } = s;
  const reduced = useReducedMotion();
  const { model, stats } = useLiveModel(true);

  useEffect(() => {
    if (!autoplayed && !reduced) {
      autoplayed = true;
      setPlaying(true);
    }
  }, [reduced, setPlaying]);

  const count = (ty: ResType) => sc.resources.filter((r) => r.type === ty).length;
  const scheduled = sc.patients.filter((p) => !p.walkIn).length;
  const walk = sc.patients.length - scheduled;

  return (
    <>
      <section className="hero">
        <div>
          <div className="row" style={{ gap: 10, marginBottom: 10 }}>
            <span className="chip copper">{t('Synthetic demonstration')}</span>
            <span className="chip">{t('Al Dhafra Health Forum · Developing Healthcare Services')}</span>
          </div>
          <div className="hero-word">SAYR <span>AI</span></div>
          <div className="hero-tag">{t('Care in Motion')}.</div>
          <p className="hero-sub">{t('Every minute matters. Every decision moves the system.')}</p>
          <p className="page-lede" style={{ marginTop: 14 }}>
            SAYR models an outpatient clinic as an interconnected system. See delays form, trace how one disruption spreads, test a feasible re-plan before it touches a patient, and measure the result. It is a simulation-driven decision-support prototype: a person approves every change.
          </p>
          <div className="actions" style={{ marginTop: 18 }}>
            <button className="btn primary" onClick={() => go('control')}>{t('Enter Control Room')} →</button>
            <button className="btn" onClick={() => setPlaying(!playing)}>{playing ? t('Pause') : t('Play')}</button>
          </div>
        </div>
        <div className="panel" style={{ padding: '14px 16px' }}>
          <div className="row" style={{ marginBottom: 4 }}>
            <span className="eyebrow">{fmtClock(now)} · {t(SCENARIO_LABEL[scenarioId])}</span>
            <span className="sp" />
            <span className="small muted">{stats.waiting} waiting · {stats.inService} in service</span>
          </div>
          <RouteMap />
        </div>
      </section>

      <div className="panel" style={{ margin: '18px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>The simulated clinic · fictional, 08:00–16:00</div>
        <div className="row small" style={{ flexWrap: 'wrap', gap: '8px 26px' }}>
          <span><b className="num">{sc.patients.length}</b> patients ({scheduled} scheduled, {walk} walk-in)</span>
          <span><b className="num">{count('registration')}</b> registration</span>
          <span><b className="num">{count('vitals')}</b> vital-sign stations</span>
          <span><b className="num">{count('consult')}</b> consultation stations (clinician + room)</span>
          <span><b className="num">{count('lab')}</b> laboratory</span>
          <span><b className="num">{count('checkout')}</b> checkout</span>
          <span><b className="num">≈{r0((sc.patients.filter((p) => p.pathway === 'lab').length / sc.patients.length) * 100)}%</b> need the laboratory</span>
        </div>
        {sc.disruptions[0] || sc.params.surge || sc.params.labSlow ? <p className="small" style={{ marginTop: 8, color: 'var(--copper)' }}>Active disruption: {scenarioHeadline(sc)}</p> : <p className="small muted" style={{ marginTop: 8 }}>No disruption active. Open Stress Controls to introduce one.</p>}
      </div>

      <div className="panel flush">
        <div className="flow-scroll">
          <FlowCanvas sc={sc} model={model} now={now} onNow={setNow} selected={selected} onSelect={select} links="delays" caption="Flow Canvas of the whole clinic day" />
        </div>
        <Legend />
      </div>

      <div style={{ marginTop: 18 }} className="flowstep">
        {[
          ['01 · Disrupt', 'Stress Controls', 'stress', 'Introduce a staff absence, walk-in surge, laboratory slowdown or room closure.'],
          ['02 · Trace', 'Ripple Trace', 'ripple', 'See how the disruption propagates, from events in the log.'],
          ['03 · Reflow', 'Reflow Studio', 'reflow', 'Generate a feasible alternative plan and watch it replace the current one.'],
          ['04 · Measure', 'Minutes Ledger', 'ledger', 'Compare baseline, disrupted and optimized, with every number computed.'],
        ].map(([k, title, to, body]) => (
          <div key={k}>
            <div className="fs-n">{k}</div>
            <div className="fs-t">{t(title)}</div>
            <p className="small muted">{body} <button className="link" onClick={() => go(to as never)}>{t(title)}</button></p>
          </div>
        ))}
      </div>
    </>
  );
}
