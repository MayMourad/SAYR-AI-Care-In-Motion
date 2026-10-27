import { useState } from 'react';
import { PageHead, StatusGlyph, r0, signed } from '../ui/common';
import { ChangeList, ChecksList, kindSummary } from '../ui/proposalParts';
import { useSayr } from '../state';
import type { Proposal } from '../state';
import { fmtClock } from '../engine/types';

export function ActionDesk() {
  const { proposals, sc, accept, reject, interventions, log, startReflow, go, reflowUi, undoAll, t } = useSayr();
  const [open, setOpen] = useState<string | null>(null);
  const ordered = proposals.slice().sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || Number(b.recommended) - Number(a.recommended));
  const openId = open ?? ordered.find((p) => p.status === 'pending' && p.recommended)?.id ?? null;

  return (
    <>
      <PageHead id="desk" lede="Every proposed change waits here for a decision: what it would do, whether it is feasible, and the evidence for each constraint. Nothing is applied until it is accepted, and a rejection leaves today’s plan untouched.">
        <button className="btn copper" onClick={() => (startReflow(), go('reflow'))}>{t('Run Reflow')}</button>
        {(interventions.length > 0 || proposals.length > 0) && <button className="btn" onClick={undoAll}>{t('Restore baseline')}</button>}
      </PageHead>

      <div className="grid side">
        <div className="deck" role="list">
          {!ordered.length && (
            <div className="empty">
              <b>No proposals yet</b>
              Run Reflow, or drag appointments on the Resource Board and send the draft here.
              <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
                <button className="btn" onClick={() => go('board')}>Open Resource Board</button>
              </div>
            </div>
          )}
          {ordered.map((p) => (
            <Card key={p.id} p={p} open={openId === p.id} toggle={() => setOpen(openId === p.id ? '' : p.id)} />
          ))}
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">{t('Audit trail')}</h2><span className="eyebrow">{log.length} entries</span></div>
            {log.length ? (
              <ol style={{ margin: 0, paddingInlineStart: 18 }} className="small">
                {log.map((l, i) => (
                  <li key={i} style={{ margin: '8px 0' }}>
                    <span className="mono muted">{fmtClock(l.at)}</span> {l.text}
                    {l.detail && (
                      <details className="small muted" style={{ marginTop: 3 }}>
                        <summary style={{ cursor: 'pointer' }}>Audit detail</summary>
                        <ul style={{ margin: '4px 0 0', paddingInlineStart: 16 }}>{l.detail.map((d, k) => <li key={k}>{d}</li>)}</ul>
                      </details>
                    )}
                  </li>
                ))}
              </ol>
            ) : <p className="small muted">Every proposal and decision is recorded here with the scenario, seed, objective, constraints and metrics involved.</p>}
          </section>
          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">Situation</h2></div>
            <div className="row small"><StatusGlyph kind={reflowUi.phase === 'done' ? 'ok' : 'idle'} /> {reflowUi.phase === 'done' ? `Plan captured at ${fmtClock(reflowUi.t)}` : 'No plan captured'}</div>
            <div className="row small" style={{ marginTop: 6 }}><StatusGlyph kind={interventions.length ? 'ok' : 'idle'} /> {interventions.length ? `${interventions.length} plan${interventions.length > 1 ? 's' : ''} in force` : 'Running the baseline policy'}</div>
            <div className="row small" style={{ marginTop: 6 }}><StatusGlyph kind="idle" /> {sc.patients.length} patients scheduled</div>
          </section>
        </div>
      </div>
    </>
  );
}

function Card({ p, open, toggle }: { p: Proposal; open: boolean; toggle: () => void }) {
  const { sc, accept, reject, interventions, go, t } = useSayr();
  const saved = p.baseStats.totalWait - p.stats.totalWait;
  const stale = p.status === 'pending' && p.version !== interventions.length;
  return (
    <article className={`card${open ? ' open' : ''}${p.recommended && p.status === 'pending' ? ' rec' : ''}${p.status !== 'pending' ? ' done' : ''}`} role="listitem">
      <button className="card-h" onClick={toggle} aria-expanded={open}>
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <span className="eyebrow">{p.source === 'manual' ? 'Manual draft' : 'Reflow'} · captured {fmtClock(p.t)}</span>
            {p.recommended && <span className="chip copper">{t('Recommended')}</span>}
            <span className={`chip ${p.status === 'accepted' ? 'teal' : ''}`}>{t(p.status)}</span>
            {stale && <span className="chip">out of date</span>}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{p.label}</div>
          <div className="small muted">{p.changes.length} appointments · {kindSummary(p.changes)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="big sm num" style={{ color: saved > 0 ? 'var(--teal)' : saved < 0 ? 'var(--copper)' : undefined }}>{signed(-saved)}</div>
          <div className="small muted row" style={{ justifyContent: 'flex-end' }}>
            <StatusGlyph kind={p.feasible ? 'ok' : 'bad'} /> {p.feasible ? `${p.checks.length}/${p.checks.length} constraints kept` : 'infeasible'}
          </div>
        </div>
      </button>
      {open && (
        <div className="card-b">
          <div className="grid g4" style={{ marginTop: 14 }}>
            <Mini label="Planned waiting" a={p.baseStats.totalWait} b={p.stats.totalWait} unit="min" />
            <Mini label="Longest wait" a={p.baseStats.maxWait} b={p.stats.maxWait} unit="min" />
            <Mini label="Protected-slot patients’ wait" a={p.baseStats.urgentWait} b={p.stats.urgentWait} unit="min" />
            <Mini label="Overtime" a={p.baseStats.overtime} b={p.stats.overtime} unit="min" />
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>{t('Why this proposal')}</div>
            <ul className="small" style={{ margin: 0, paddingInlineStart: 18 }}>{p.explanation.map((l, i) => <li key={i} style={{ margin: '4px 0' }}>{l}</li>)}</ul>
          </div>
          <div className="grid g2">
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Feasibility</div>
              <ChecksList checks={p.checks} />
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>What would change</div>
              <ChangeList sc={sc} changes={p.changes} limit={7} />
            </div>
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {p.status === 'pending' ? (
              <>
                <button className="btn primary" disabled={!p.feasible || stale} onClick={() => accept(p.id)}>{t('Approve and apply')}</button>
                <button className="btn" onClick={() => reject(p.id)}>{t('Reject')}</button>
                {stale && <span className="small muted">Built on an earlier plan. Run Reflow again.</span>}
              </>
            ) : p.status === 'accepted' ? (
              <button className="btn" onClick={() => go('ledger')}>See the measured outcome</button>
            ) : <span className="small muted">Closed.</span>}
            <span className="sp" />
            {p.source === 'reflow' && <button className="btn sm ghost" onClick={() => go('reflow')}>Replay in Reflow Studio</button>}
          </div>
          <p className="small muted">{t('Proposed schedule pending human approval')}. Planned values use booked appointment lengths; approval applies the plan to the simulation only, and the ledger then measures what happened. This application never changes real hospital operations.</p>
        </div>
      )}
    </article>
  );
}

function Mini({ label, a, b, unit }: { label: string; a: number; b: number; unit: string }) {
  const d = b - a;
  return (
    <div>
      <div className="stat-l" style={{ marginTop: 0 }}>{label}</div>
      <div className="num" style={{ fontFamily: 'var(--serif)', fontSize: 26 }}>{r0(b)} <span className="small muted" style={{ fontFamily: 'var(--sans)' }}>{unit}</span></div>
      <div className={`small mono ${d < -0.5 ? 'delta-good' : d > 0.5 ? 'delta-bad' : 'muted'}`}>{Math.abs(d) < 0.5 ? 'unchanged' : `${signed(d)} from ${r0(a)}`}</div>
    </div>
  );
}
