import { useMemo } from 'react';
import { PageHead } from '../ui/common';
import { useSayr } from '../state';
import { journeyEstimate } from '../engine/journey';
import { snapshotAt } from '../engine/sim';
import { fmtClock, PATHWAY_LABEL, TYPE_LABEL } from '../engine/types';
import { useLiveModel } from '../ui/useModel';

const SPOKEN: Record<string, string> = {
  registration: 'Check in at registration',
  vitals: 'Vital-sign check',
  consult: 'See the clinician',
  lab: 'Laboratory test',
  checkout: 'Check out',
};

export function MyJourney() {
  const { sc, liveRun, baseRun, interventions, now, selected, select, metricsLive } = useSayr();
  const { model } = useLiveModel(false);
  const fin = liveRun.final;
  const attendees = sc.patients.filter((p) => !p.noShow);
  const pid = selected && attendees.some((p) => p.id === selected) ? selected : (attendees.find((p) => p.code === 'J-024') ?? attendees[0]).id;
  const patient = sc.patients.find((p) => p.id === pid)!;
  const t = Math.floor(now);
  const est = useMemo(() => journeyEstimate(sc, snapshotAt(liveRun, t), pid), [sc, liveRun, t, pid]);
  // the same patient's expectation under the plan in force before any approved change
  const estBefore = useMemo(() => (interventions.length ? journeyEstimate(sc, snapshotAt(baseRun, t), pid) : null), [sc, baseRun, interventions.length, t, pid]);

  const steps = patient.jobIds.map((id) => {
    const js = fin.jobs[id];
    const jd = sc.jobs[id];
    const done = js.status === 'done' && js.end! <= t;
    const inService = js.status === 'done' && js.start! <= t && js.end! > t;
    const waiting = js.status === 'done' && js.readyAt! <= t && js.start! > t;
    const e = est[id];
    const ahead = waiting ? model.queues[jd.type].filter((c) => c.jobId !== id && c.waited > t - js.readyAt!).length : 0;
    return { id, jd, js, done, inService, waiting, e, ahead };
  });
  const currentIdx = steps.findIndex((s) => s.inService || s.waiting);
  const finished = steps.every((s) => s.done);
  const patientWait = metricsLive.patients.find((p) => p.patientId === pid);

  return (
    <>
      <PageHead id="my" lede="The same simulation seen from one patient’s side: where you are, what happens next, and an honest range for when. You appear only as an anonymous journey code. Estimates move as the day unfolds.">
        <label className="small row">Journey
          <select value={pid} onChange={(e) => select(e.target.value)} aria-label="Choose a journey">
            {attendees.map((p) => <option key={p.id} value={p.id}>{p.code} · {PATHWAY_LABEL[p.pathway]}</option>)}
          </select>
        </label>
      </PageHead>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)' }}>
        <section className="panel" style={{ background: 'var(--paper-2)' }}>
          <div className="eyebrow">Your journey today</div>
          <div className="big num" style={{ margin: '6px 0 4px' }}>{patient.code}</div>
          <p className="small muted">{PATHWAY_LABEL[patient.pathway]} · expected at {fmtClock(patient.sched)}{patient.lateBy ? ` (arrived ${patient.lateBy} min late)` : ''}</p>
          <hr className="rule" />
          {finished ? (
            <p style={{ fontFamily: 'var(--serif)', fontSize: 24 }}>Your visit is complete.{patientWait ? ` You waited ${Math.round(patientWait.wait)} minutes in total.` : ''}</p>
          ) : t < patient.sched + patient.lateBy ? (
            <p style={{ fontFamily: 'var(--serif)', fontSize: 24 }}>Your visit starts at {fmtClock(patient.sched)}.</p>
          ) : currentIdx >= 0 ? (
            <p style={{ fontFamily: 'var(--serif)', fontSize: 24 }}>
              {steps[currentIdx].inService ? 'You are being seen now: ' : 'You are waiting for: '}
              {SPOKEN[steps[currentIdx].jd.type].toLowerCase()}.
            </p>
          ) : (
            <p style={{ fontFamily: 'var(--serif)', fontSize: 24 }}>Moving to your next step.</p>
          )}
          {currentIdx >= 0 && steps[currentIdx].waiting && (
            <p className="small" style={{ marginTop: 8 }}>
              About {steps[currentIdx].ahead} {steps[currentIdx].ahead === 1 ? 'person' : 'people'} ahead of you in this queue. Someone with an urgent need may be called first.
              {steps[currentIdx].e && ` Most likely between ${fmtClock(steps[currentIdx].e!.startLo)} and ${fmtClock(steps[currentIdx].e!.startHi)}.`}
            </p>
          )}
          <hr className="rule" />
          <p className="small muted">
            Times are estimates built from many possible versions of the rest of the day, shown as a range. They are not a commitment by any hospital, and the clinic may change the order of waiting patients. This is a simulation with a synthetic patient, using the same state as the administrative screens.
          </p>
        </section>

        <section className="panel">
          <div className="panel-h"><h2 className="panel-t">Your steps</h2><span className="eyebrow">{fmtClock(t)}</span></div>
          <div className="tl">
            {steps.map((s, i) => {
              const state = s.done ? 'done' : i === currentIdx ? 'now' : '';
              return (
                <div key={s.id} className={`tl-i ${state}`}>
                  <div className="tl-t">{SPOKEN[s.jd.type]}</div>
                  <div className="small muted">{TYPE_LABEL[s.jd.type]}</div>
                  {s.done && <div className="small">Done · {fmtClock(s.js.start!)}–{fmtClock(s.js.end!)}{s.js.start! - s.js.readyAt! >= 1 ? ` · waited ${Math.round(s.js.start! - s.js.readyAt!)} min` : ''}</div>}
                  {s.inService && <div className="small" style={{ color: 'var(--teal)', fontWeight: 600 }}>In progress since {fmtClock(s.js.start!)}</div>}
                  {s.waiting && <div className="small" style={{ color: 'var(--copper)', fontWeight: 600 }}>Waiting since {fmtClock(s.js.readyAt!)}</div>}
                  {!s.done && !s.inService && s.e && (
                    <div className="small">
                      Expected {s.e.startLo === s.e.startHi ? fmtClock(s.e.startMid) : `${fmtClock(s.e.startLo)} – ${fmtClock(s.e.startHi)}`}
                      <span className="muted"> · usually around {fmtClock(s.e.startMid)}</span>
                      {estBefore?.[s.id] && Math.abs(estBefore[s.id].startMid - s.e.startMid) >= 2 && (
                        <div style={{ color: estBefore[s.id].startMid > s.e.startMid ? 'var(--teal)' : 'var(--copper)', fontWeight: 600 }}>
                          After the approved change: {estBefore[s.id].startMid > s.e.startMid ? 'about' : 'about'} {Math.round(Math.abs(estBefore[s.id].startMid - s.e.startMid))} min {estBefore[s.id].startMid > s.e.startMid ? 'earlier' : 'later'} than before (was around {fmtClock(estBefore[s.id].startMid)}).
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
