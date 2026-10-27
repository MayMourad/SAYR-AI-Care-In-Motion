import { useEffect, useMemo } from 'react';
import { REFERENCES, SCHOOL, TEAM } from '../references';
import { useSayr } from '../state';
import { forecastDemand } from '../engine/forecast';
import { HARM_CAP } from '../engine/plan';

function Block({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div style={{ margin: '10px 0 16px' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 4 }}>{title}</div>
      <dl className="dl">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function About() {
  const { aboutOpen, setAbout, t, sc } = useSayr();
  useEffect(() => {
    if (!aboutOpen) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setAbout(false);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [aboutOpen, setAbout]);
  const fc = useMemo(() => (aboutOpen ? forecastDemand(sc) : null), [aboutOpen, sc]);
  if (!aboutOpen || !fc) return null;
  const best = fc.models.find((m) => m.id === fc.chosen)!;
  return (
    <>
      <div className="scrim" onClick={() => setAbout(false)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="About SAYR AI">
        <div className="row">
          <div className="sp">
            <div className="kicker">{t('Care in Motion')}</div>
            <h3>SAYR AI</h3>
          </div>
          <button className="btn sm" onClick={() => setAbout(false)}>{t('Close')}</button>
        </div>
        <p className="muted">
          A simulation-driven healthcare operations prototype. SAYR (سَيْر) means movement and progression. It models a fictional outpatient clinic, shows how a disruption spreads, proposes feasible schedule changes for a person to approve, and measures the simulated effect. {t('Al Dhafra Health Forum · Developing Healthcare Services')}.
        </p>

        <h4>{t('Responsible AI')}</h4>
        <ul className="small">
          <li>{t('All patients are synthetic and anonymous. No real patient information is used.')}</li>
          <li>{t('SAYR supports operational decisions only. It does not diagnose, triage or infer clinical urgency.')}</li>
          <li>{t('Every proposed schedule waits for a person to approve it. Nothing changes automatically.')}</li>
          <li>{t('Results are simulated under stated assumptions. They do not show real-world effectiveness.')}</li>
          <li>{t('Fewer waiting minutes is an operational measure, not evidence of better clinical care.')}</li>
          <li>{t('Fairness checks on synthetic data do not establish fairness in a real deployment.')}</li>
          <li>{t('Real-world use would require validation with healthcare operations specialists, authorised data, privacy and security review.')}</li>
        </ul>

        <h4>Transparency: what each part does</h4>
        <Block
          title="Demand forecasting (layer 1)"
          rows={[
            [t('Method'), `${best.label}, chosen from three evaluated baselines. Not a machine-learning model.`],
            [t('Input data'), `${fc.history.length} synthetic days of hourly arrival counts; first 14 days fit, last 6 held out.`],
            [t('Assumptions'), 'Weekday pattern plus Poisson-like noise around the simulator’s own hourly profile.'],
            [t('Output'), `Hourly arrivals for today (${Math.round(fc.totalForecast)} forecast vs ${fc.totalActual} actual). Held-out error ${best.mae.toFixed(2)} patients/hour. ${fc.models.map((m) => `${m.label}: ${m.mae.toFixed(2)}`).join('; ')}.`],
            [t('Known limitations'), fc.limitations.join(' ')],
          ]}
        />
        <Block
          title="Discrete-event simulation"
          rows={[
            [t('Method'), 'Deterministic event queue: arrival, queue, start, finish, release, transfer, outage. Every event is logged.'],
            [t('Input data'), `Seed ${sc.params.seed}; ${sc.patients.length} synthetic patients; ${sc.resources.length} resources; scenario ${sc.scenarioId}.`],
            [t('Assumptions'), 'Booked lengths known to the planner; realised lengths vary (σ = ' + sc.params.cv + '). Late arrivals, no-shows and transfer minutes are generated from the seed.'],
            [t('Output'), 'Patient journeys, queue lengths, utilisation, an audit of every timestamp and resource.'],
            [t('Known limitations'), 'A clinician is tied to a room (station). No breaks, equipment, multiple sites or clinical variation.'],
          ]}
        />
        <Block
          title="Reflow optimizer (layer 2)"
          rows={[
            [t('Method'), 'Constraint-aware local search with seeded perturbation over assignment and order, for three objective profiles. A heuristic, not an exact solver and not machine learning.'],
            [t('Input data'), 'Every appointment not yet started at the clock, in-progress work, and known resource unavailability.'],
            [t('Assumptions'), `Hard rules: capacity, prerequisites, arrival times, outages, committed starts, protected slots. Soft limit: no one waits more than ${HARM_CAP} min longer.`],
            [t('Output'), 'Up to three alternative plans with changes, constraint evidence and projected waiting. Never applied without approval.'],
            [t('Known limitations'), 'May find no improvement. Planned and replayed totals differ because durations are uncertain.'],
          ]}
        />
        <Block
          title="Operational explanation (layer 3)"
          rows={[
            [t('Method'), 'Deterministic sentences generated from the event log and the before/after plans. No language model.'],
            [t('Output'), 'Statements such as how many appointments a proposal moves and which delays remain.'],
          ]}
        />

        <h4>{t('Team')}</h4>
        <ul className="team">
          {TEAM.map((m) => (
            <li key={m.name}>
              <span>{m.name}</span>
              <span className="muted mono">{m.grade}</span>
            </li>
          ))}
        </ul>
        <p className="small muted" style={{ marginTop: 8 }}>{SCHOOL}</p>

        <h4>Design credits and references</h4>
        <p className="small muted">
          All ten were studied for principles only. No code, illustration, video or scene from them is used, and the app runs with no third-party design service or font host. Details are in DESIGN_REFERENCES.md.
        </p>
        <ul className="small">
          {REFERENCES.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer noopener">{r.name}</a>{' '}
              <span className="muted">— {r.creator}. {r.informed}. {r.license}.</span>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
