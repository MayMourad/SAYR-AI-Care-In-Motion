import { useMemo, useState } from 'react';
import { PageHead, r0 } from '../ui/common';
import { useSayr } from '../state';
import { journeySegments, tMaxFor } from '../ui/flowModel';
import { fmtClock, PATHWAY_LABEL, TYPE_LABEL } from '../engine/types';
import type { Priority } from '../engine/types';

type Sort = 'wait' | 'arrival' | 'priority';

export function JourneyLines() {
  const { sc, liveRun, now, selected, select, metricsLive } = useSayr();
  const [sort, setSort] = useState<Sort>('wait');
  const [pri, setPri] = useState<Priority | 'all'>('all');
  const fin = liveRun.final;
  const tMax = tMaxFor(sc, fin);

  const rows = useMemo(() => {
    const waits = new Map(metricsLive.patients.map((p) => [p.patientId, p.wait]));
    let list = sc.patients.filter((p) => !p.noShow && (pri === 'all' || p.priority === pri));
    const rank = { urgent: 0, standard: 1, routine: 2 };
    list = list.slice().sort((a, b) => (sort === 'wait' ? (waits.get(b.id) ?? 0) - (waits.get(a.id) ?? 0) : sort === 'arrival' ? a.sched - b.sched : rank[a.priority] - rank[b.priority] || a.sched - b.sched));
    return list.map((p) => ({ p, wait: waits.get(p.id) ?? 0, segs: journeySegments(sc, fin, p.id) }));
  }, [sc, fin, metricsLive, sort, pri]);

  const W = 900;
  const x = (t: number) => (t / tMax) * W;
  const sel = selected ? sc.patients.find((p) => p.id === selected) : null;
  const selSegs = sel ? journeySegments(sc, fin, sel.id) : [];

  return (
    <>
      <PageHead id="journeys" lede="Each line is one anonymous patient across the day: navy where they are in service, copper where they wait, a thin gap while they move between stages. The longest lines of copper are where the system failed them.">
        <div className="seg" role="group" aria-label="Sort">
          {(['wait', 'arrival', 'priority'] as Sort[]).map((s) => <button key={s} aria-pressed={sort === s} onClick={() => setSort(s)}>{s === 'wait' ? 'Longest wait' : s === 'arrival' ? 'Arrival' : 'Priority'}</button>)}
        </div>
        <div className="seg" role="group" aria-label="Priority filter">
          {(['all', 'urgent', 'standard', 'routine'] as const).map((s) => <button key={s} aria-pressed={pri === s} onClick={() => setPri(s)}>{s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}</button>)}
        </div>
      </PageHead>

      <div className="grid side">
        <div className="panel">
          <div className="row small muted" style={{ marginBottom: 6 }}>
            <span style={{ width: 118 }}>Journey</span>
            <svg viewBox={`0 0 ${W} 14`} style={{ flex: 1, height: 14 }} aria-hidden>
              {Array.from({ length: Math.floor(tMax / 60) + 1 }, (_, i) => i * 60).map((t) => (
                <text key={t} x={x(t) + 2} y={10} fontSize={9.5} fontFamily="var(--mono)" fill="var(--mut)">{fmtClock(t)}</text>
              ))}
            </svg>
            <span style={{ width: 70, textAlign: 'right' }}>Wait</span>
          </div>
          <div style={{ maxHeight: 560, overflowY: 'auto' }} role="listbox" aria-label="Journeys">
            {rows.map(({ p, wait, segs }) => (
              <div key={p.id} className="jl" role="option" aria-selected={selected === p.id} tabIndex={0} onClick={() => select(selected === p.id ? null : p.id)} onKeyDown={(e) => e.key === 'Enter' && select(p.id)}>
                <div className="jl-code"><span className={`pri ${p.priority}`} title={p.priority} />{p.code}</div>
                <svg className="jl-svg" viewBox={`0 0 ${W} 18`} preserveAspectRatio="none" aria-hidden>
                  <line x1={x(sc.shiftEnd)} x2={x(sc.shiftEnd)} y1={0} y2={18} stroke="var(--copper)" strokeWidth={1} opacity={0.5} />
                  <line x1={x(now)} x2={x(now)} y1={0} y2={18} stroke="var(--ink)" strokeWidth={1.2} />
                  {segs.map((s, i) => s.kind === 'transfer'
                    ? <line key={i} x1={x(s.from)} x2={x(s.to)} y1={9} y2={9} stroke="var(--mut-2)" strokeWidth={1} />
                    : <rect key={i} x={x(s.from)} y={s.kind === 'service' ? 3 : 6} width={Math.max(1.5, x(s.to) - x(s.from))} height={s.kind === 'service' ? 12 : 6} rx={1.5} fill={s.kind === 'service' ? 'var(--navy)' : 'var(--copper)'} opacity={s.to > now && s.from > now ? 0.35 : 1} />)}
                </svg>
                <div className="jl-w" style={{ color: wait >= 30 ? 'var(--copper)' : undefined }}>{r0(wait)} min</div>
              </div>
            ))}
          </div>
        </div>

        <section className="panel">
          {sel ? (
            <>
              <div className="eyebrow">Selected journey</div>
              <h2 className="panel-t" style={{ fontSize: 30, margin: '4px 0' }}>{sel.code}</h2>
              <p className="small muted">{PATHWAY_LABEL[sel.pathway]} · {sel.priority === 'urgent' ? 'protected priority' : sel.priority} · scheduled {fmtClock(sel.sched)}{sel.lateBy ? `, ${sel.lateBy} min late` : ''}</p>
              <hr className="rule" />
              <div className="tl">
                {sel.jobIds.map((id) => {
                  const js = fin.jobs[id];
                  if (js.status !== 'done') return null;
                  const w = js.start! - js.readyAt!;
                  const cause = js.cause?.kind === 'outage' ? 'held while the resource was out' : js.cause?.kind === 'resource' && w > 0 ? `waited for the previous appointment on ${js.resourceId}` : null;
                  const state = js.end! <= now ? 'done' : js.start! <= now ? 'now' : '';
                  return (
                    <div key={id} className={`tl-i ${state}`}>
                      <div className="tl-t">{TYPE_LABEL[sc.jobs[id].type]}</div>
                      <div className="small">{js.resourceId} · {fmtClock(js.start!)}–{fmtClock(js.end!)}</div>
                      <div className="small" style={{ color: w >= 15 ? 'var(--copper)' : 'var(--mut)' }}>{w >= 1 ? `Waited ${r0(w)} min` : 'No wait'}{cause ? ` — ${cause}` : ''}</div>
                    </div>
                  );
                })}
              </div>
              <p className="small muted">Total wait {r0(selSegs.filter((s) => s.kind === 'wait').reduce((a, s) => a + s.to - s.from, 0))} min across the visit.</p>
            </>
          ) : (
            <div className="empty"><b>Pick a line</b>Select a journey to see each stage, the resource it used and why it waited.</div>
          )}
        </section>
      </div>
    </>
  );
}
