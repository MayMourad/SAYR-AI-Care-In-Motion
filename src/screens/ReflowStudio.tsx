import { useEffect, useMemo, useRef, useState } from 'react';
import { FlowCanvas } from '../ui/FlowCanvas';
import type { Layout } from '../ui/FlowCanvas';
import { Delta, Legend, PageHead, Sparkline, r0, signed } from '../ui/common';
import { ChangeList, ChecksList, kindSummary } from '../ui/proposalParts';
import { buildLiveModel, GROUPS } from '../ui/flowModel';
import type { FBlock, FlowModel } from '../ui/flowModel';
import { PROFILES } from '../engine/optimizer';
import { useReducedMotion, useSayr } from '../state';
import type { Proposal } from '../state';
import { fmtClock } from '../engine/types';

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const DURATION = 3400;

function useReflowAnim(key: string, reduced: boolean) {
  const [p, setP] = useState(0);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const start = useRef(0);
  const from = useRef(0);

  const play = (fromP = 0) => {
    if (reduced) {
      setP(1);
      setPlaying(false);
      return;
    }
    from.current = fromP;
    start.current = performance.now();
    setP(fromP);
    setPlaying(true);
  };
  useEffect(() => {
    if (!playing) return;
    const loop = (ts: number) => {
      const q = from.current + (ts - start.current) / DURATION;
      if (q >= 1) {
        setP(1);
        setPlaying(false);
        return;
      }
      setP(q);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  // restart whenever a different proposal is shown
  useEffect(() => {
    const id = setTimeout(() => play(0), 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reduced]);

  return { p, playing, play, scrub: (x: number) => (setPlaying(false), setP(x)) };
}

interface Label {
  b: FBlock;
  d: number;
}

export function ReflowStudio() {
  const s = useSayr();
  const { sc, liveRun, reflowUi, proposals, accept, reject, startReflow, go, selected, select, interventions } = s;
  const reduced = useReducedMotion();
  const result = reflowUi.result;
  const [profileId, setProfileId] = useState<string | null>(null);
  const [ghost, setGhost] = useState(true);
  const [hoverP, setHoverP] = useState<string | null>(null);

  const active = profileId ?? result?.recommendedId ?? result?.candidates[0]?.profile.id ?? null;
  const cand = result?.candidates.find((c) => c.profile.id === active);
  const prop: Proposal | undefined = cand ? proposals.find((x) => x.id === `R${reflowUi.t}-${cand.profile.id}`) : undefined;
  const anim = useReflowAnim(`${reflowUi.t}-${active}-${result ? 1 : 0}`, reduced);
  const accepted = prop?.status === 'accepted';
  const p = accepted ? 1 : anim.p;

  const ctxModel = useMemo(() => (result ? buildLiveModel(sc, liveRun, reflowUi.t, false) : null), [sc, liveRun, reflowUi.t, result]);
  const laneIdx = useMemo(() => {
    const out: Record<string, number> = {};
    let i = 0;
    for (const g of GROUPS) for (const r of sc.resources.filter((x) => x.type === g)) out[r.id] = i++;
    return out;
  }, [sc]);

  // Every position below is interpolated between the optimizer's "before" and "after" plans.
  const frame = useMemo(() => {
    if (!result || !cand || !ctxModel) return null;
    const pb = result.problem;
    const history = ctxModel.blocks;
    const moving: FBlock[] = [];
    const ghosts: FBlock[] = [];
    const trails: { a: FBlock; b: FBlock; p: number }[] = [];
    const labels: Label[] = [];
    const changedIds = new Set(cand.changes.map((c) => c.jobId));
    const order = cand.changes.slice().sort((a, b) => Math.abs(b.toStart - b.fromStart) - Math.abs(a.toStart - a.fromStart));
    const rankOf = new Map(order.map((c, i) => [c.jobId, i / Math.max(1, order.length - 1)]));
    for (const id of pb.order) {
      const j = pb.jobs[id];
      const before = result.base.items[id];
      const after = cand.plan.items[id];
      const changed = changedIds.has(id);
      const q = changed ? ease(clamp01((p - (rankOf.get(id) ?? 0) * 0.42) / 0.58)) : ease(clamp01(p));
      const la = laneIdx[before.resourceId];
      const lb = laneIdx[after.resourceId];
      const blk: FBlock = {
        key: id,
        jobId: id,
        patientId: j.patientId,
        code: sc.patients.find((x) => x.id === j.patientId)!.code,
        k: j.k,
        resourceId: q >= 1 ? after.resourceId : before.resourceId,
        laneF: la + (lb - la) * q,
        x0: before.start + (after.start - before.start) * q,
        x1: before.end + (after.end - before.end) * q,
        kind: changed ? 'preview' : 'plan',
        changed,
        priority: j.prio,
        type: j.type as FBlock['type'],
        wait: before.wait + (after.wait - before.wait) * q,
        opacity: changed ? 1 : 0.55,
      };
      moving.push(blk);
      if (changed) {
        const gb: FBlock = { ...blk, kind: 'ghost', laneF: la, x0: before.start, x1: before.end, resourceId: before.resourceId };
        ghosts.push(gb);
        if (before.resourceId !== after.resourceId || Math.abs(before.start - after.start) > 8) {
          trails.push({ a: gb, b: { ...blk, laneF: lb, x0: after.start, x1: after.end, resourceId: after.resourceId }, p });
        }
        const dw = after.wait - before.wait;
        if (Math.abs(dw) >= 4) labels.push({ b: blk, d: dw });
      }
    }
    return { blocks: [...history, ...moving], ghosts, trails, labels };
  }, [result, cand, ctxModel, p, sc, laneIdx]);

  const model: FlowModel | null = useMemo(() => (frame && ctxModel ? { ...ctxModel, blocks: frame.blocks } : null), [frame, ctxModel]);
  const waitNow = cand && result ? result.baseStats.totalWait + (cand.stats.totalWait - result.baseStats.totalWait) * ease(clamp01(p)) : 0;
  const running = reflowUi.phase === 'running';

  return (
    <>
      <PageHead id="reflow" lede="Capture the plan at the clock, search for a feasible alternative, and watch the affected appointments move into their new positions. Every block that moves was moved by the optimizer’s output, and every constraint is re-checked before you can accept.">
        <button className="btn copper" onClick={() => startReflow()} disabled={running}>{running ? 'Searching…' : result ? 'Reflow again from the clock' : 'Run Reflow'}</button>
        {result && cand && !running && <button className="btn" onClick={() => anim.play(0)}>Replay the move</button>}
      </PageHead>

      {reflowUi.phase === 'idle' && (
        <div className="empty">
          <b>Nothing captured yet</b>
          Drag the clock to a moment when the day looks overloaded, then run Reflow. It re-plans every unstarted appointment under nine constraints.
          <div className="row" style={{ justifyContent: 'center', marginTop: 14 }}>
            <button className="btn copper" onClick={() => startReflow()}>Run Reflow at {fmtClock(Math.floor(s.now / 5) * 5)}</button>
          </div>
        </div>
      )}

      {running && <RunningView />}

      {result && cand && model && frame && !running && (
        <div className="grid side">
          <div className="stack">
            <div className="panel flush">
              <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <div className="eyebrow">Plan captured at {fmtClock(reflowUi.t)} · {cand.profile.label}</div>
                  <div className="row" style={{ gap: 18, marginTop: 4, alignItems: 'baseline' }}>
                    <span className="big md num">{r0(waitNow)}<span className="u">planned waiting min</span></span>
                    <span className="small"><Delta v={cand.stats.totalWait - result.baseStats.totalWait} unit=" min" /> vs the current plan</span>
                  </div>
                </div>
                <span className="sp" />
                <label className="small row"><input type="checkbox" checked={ghost} onChange={(e) => setGhost(e.target.checked)} /> Ghost of the old plan</label>
              </div>
              <div className="flow-scroll">
                <FlowCanvas
                  sc={sc}
                  model={model}
                  now={reflowUi.t}
                  tMinOverride={Math.max(0, reflowUi.t - 30)}
                  ghosts={ghost && p < 0.995 ? frame.ghosts : undefined}
                  trails={ghost && p < 0.995 ? frame.trails : undefined}
                  selected={hoverP ?? selected}
                  onSelect={select}
                  links="delays"
                  caption="Reflow canvas: appointments moving to their proposed positions"
                  overlay={(L: Layout) => <WaitLabels labels={frame.labels} L={L} p={p} />}
                />
              </div>
              <div className="row" style={{ padding: '10px 16px', borderTop: '1px solid var(--line)', background: 'var(--paper)' }}>
                <span className="small mono muted">BEFORE</span>
                <input className="sl sp" type="range" min={0} max={1} step={0.005} value={p} onChange={(e) => anim.scrub(Number(e.target.value))} aria-label="Scrub between the current plan and the proposal" disabled={accepted} />
                <span className="small mono muted">AFTER</span>
              </div>
              <Legend />
            </div>

            <div className="grid g3">
              {result.candidates.map((c) => {
                const pr = proposals.find((x) => x.id === `R${reflowUi.t}-${c.profile.id}`);
                const saved = result.baseStats.totalWait - c.stats.totalWait;
                return (
                  <button key={c.profile.id} className="cand" aria-pressed={c.profile.id === active} onClick={() => setProfileId(c.profile.id)}>
                    <span className="cand-t">
                      {c.profile.label}
                      {c.profile.id === result.recommendedId && <span className="chip copper">Recommended</span>}
                    </span>
                    <span className="num" style={{ fontFamily: 'var(--serif)', fontSize: 28 }}>
                      {saved >= 0 ? '−' : '+'}{r0(Math.abs(saved))} <span className="small muted" style={{ fontFamily: 'var(--sans)' }}>planned min</span>
                    </span>
                    <span className="small muted">{c.changes.length} changes · longest wait {r0(c.stats.maxWait)} min · {c.feasible ? 'all constraints kept' : 'a constraint is broken'}</span>
                    {pr && pr.status !== 'pending' && <span className="chip">{pr.status}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="stack">
            <section className="panel">
              <div className="panel-h">
                <h2 className="panel-t">Proposed adjustment</h2>
                <span className="eyebrow">{kindSummary(cand.changes)}</span>
              </div>
              <p className="small" style={{ marginBottom: 10 }}>{cand.profile.blurb}</p>
              <div className="grid g2" style={{ gap: 10 }}>
                <div>
                  <div className="big sm num">{r0(result.baseStats.totalWait)}</div>
                  <div className="stat-l">current plan</div>
                </div>
                <div>
                  <div className="big sm num delta-good">{r0(cand.stats.totalWait)}</div>
                  <div className="stat-l">proposal</div>
                </div>
              </div>
              <p className="small muted" style={{ marginTop: 10 }}>
                Planned values use booked appointment lengths. The Minutes Ledger measures the real outcome on realised durations, which can differ.
              </p>
              <hr className="rule" />
              <div className="row" style={{ flexWrap: 'wrap' }}>
                {accepted ? (
                  <>
                    <span className="chip teal">Accepted · the clock now follows this plan</span>
                    <button className="btn sm" onClick={() => go('ledger')}>See measured outcome</button>
                  </>
                ) : prop?.status === 'rejected' ? (
                  <span className="chip">Rejected · the current plan stays in force</span>
                ) : prop?.status === 'superseded' ? (
                  <span className="chip">Superseded by an accepted plan</span>
                ) : (
                  <>
                    <button className="btn primary" disabled={!prop?.feasible || prop.version !== interventions.length} onClick={() => prop && accept(prop.id)}>Accept in the simulation</button>
                    <button className="btn" onClick={() => prop && reject(prop.id)}>Reject</button>
                    <button className="btn sm ghost" onClick={() => go('desk')}>Open in Action Desk</button>
                  </>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-h"><h2 className="panel-t">{s.t('Why this proposal')}</h2></div>
              <ul className="small" style={{ margin: 0, paddingInlineStart: 18 }}>{(prop?.explanation ?? []).map((l, i) => <li key={i} style={{ margin: '4px 0' }}>{l}</li>)}</ul>
            </section>

            <section className="panel">
              <div className="panel-h"><h2 className="panel-t">Constraints preserved</h2><span className="chip teal">{cand.checks.filter((c) => !c.violations).length}/{cand.checks.length}</span></div>
              <ChecksList checks={cand.checks} />
            </section>

            <section className="panel">
              <div className="panel-h"><h2 className="panel-t">What moves</h2><span className="eyebrow">{cand.changes.length} appointments</span></div>
              <ChangeList sc={sc} changes={cand.changes} onHover={setHoverP} />
            </section>

            <section className="panel">
              <div className="panel-h"><h2 className="panel-t">How the search went</h2><span className="eyebrow">{r0(result.evaluations)} plans · {Math.round(reflowUi.ms ?? 0)} ms</span></div>
              <Sparkline values={cand.trace} base={cand.baseObjective} />
              <p className="small muted">Objective after each improving move. The dashed line is the current plan.</p>
            </section>
          </div>
        </div>
      )}
    </>
  );
}

function WaitLabels({ labels, L, p }: { labels: Label[]; L: Layout; p: number }) {
  if (p < 0.6) return null;
  const a = clamp01((p - 0.6) / 0.3);
  return (
    <g opacity={a} pointerEvents="none">
      {labels.map(({ b, d }) => (
        <text
          key={b.key}
          x={L.xs(b.x1) + 3}
          y={L.ly(b.laneF ?? 0) + 5 + L.blockH / 2 + 3}
          className="lnk-label"
          fill={d < 0 ? 'var(--teal)' : 'var(--copper)'}
          style={{ fill: d < 0 ? 'var(--teal)' : 'var(--copper)' }}
        >
          {signed(d)}m
        </text>
      ))}
    </g>
  );
}

function RunningView() {
  const { reflowUi, sc } = useSayr();
  const steps = reflowUi.steps;
  const last = reflowUi.last;
  const capture = steps.find((x) => x.stage === 'capture' && x.step === 1);
  const profIdx = last?.stage === 'search' ? PROFILES.findIndex((x) => x.id === last.profile) : last?.stage === 'validate' || last?.stage === 'compose' ? PROFILES.length : -1;
  const lastByProfile = (id: string) => [...steps].reverse().find((x) => x.stage === 'search' && x.profile === id);
  const showId = last?.stage === 'search' ? last.profile : PROFILES[0].id;
  const trace = steps.filter((x) => x.stage === 'search' && x.profile === showId).map((x) => x.objective ?? 0);
  const base = lastByProfile(showId!)?.baseObjective ?? trace[0] ?? 1;
  return (
    <div className="grid g2">
      <section className="panel">
        <div className="panel-h"><h2 className="panel-t">Reflowing from {fmtClock(reflowUi.t)}</h2><span className="eyebrow">live progress</span></div>
        <ul className="stage-list">
          <li className={capture ? 'done' : 'active'}>
            <span className="stage-dot" />
            <span>Capture the operational plan</span>
            <span className="stage-v">{capture ? capture.note.split(' · ')[0] : '…'}</span>
          </li>
          {PROFILES.map((pr, i) => {
            const st = lastByProfile(pr.id);
            const done = profIdx > i;
            const act = profIdx === i;
            return (
              <li key={pr.id} className={done ? 'done' : act ? 'active' : ''}>
                <span className="stage-dot" />
                <span>Search · {pr.label}</span>
                <span className="stage-v">{st ? `${Math.round(((st.baseObjective! - st.objective!) / st.baseObjective!) * 100)}% lower · ${st.note.split(' · ')[0]}` : ''}</span>
              </li>
            );
          })}
          <li className={last?.stage === 'validate' ? 'active' : last?.stage === 'compose' ? 'done' : ''}>
            <span className="stage-dot" />
            <span>Re-check every constraint</span>
            <span className="stage-v">9 rules</span>
          </li>
          <li className={last?.stage === 'compose' ? 'active' : ''}>
            <span className="stage-dot" />
            <span>Compose the recommendation</span>
            <span className="stage-v" />
          </li>
        </ul>
      </section>
      <section className="panel">
        <div className="panel-h"><h2 className="panel-t">Objective</h2><span className="eyebrow">{sc.patients.length} patients in scope</span></div>
        <Sparkline values={trace.length > 1 ? trace : [base, base]} base={base} w={420} h={110} />
        <p className="small muted">Each point is the best plan found so far, scored on weighted waiting minutes, longest wait, overtime and (for the third profile) the number of moved appointments.</p>
      </section>
    </div>
  );
}
