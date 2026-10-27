import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import { BlockShape, FlowCanvas, makeLayout } from '../ui/FlowCanvas';
import type { Layout } from '../ui/FlowCanvas';
import { Legend, PageHead, StatusGlyph, r0, signed } from '../ui/common';
import { ChecksList } from '../ui/proposalParts';
import { downsAt, emptyQueues, GROUPS } from '../ui/flowModel';
import type { FBlock, FlowModel } from '../ui/flowModel';
import { useReducedMotion, useSayr } from '../state';
import { captureProblem, describeChanges, makeCtx } from '../engine/optimizer';
import { allPass, decode, jobCompat, planStats, validatePlan } from '../engine/plan';
import type { CheckResult, Plan, Seq } from '../engine/plan';
import { snapshotAt } from '../engine/sim';
import { fmtClock, TYPE_LABEL } from '../engine/types';

interface Verdict {
  ok: boolean;
  reason?: string;
  seq?: Seq;
  plan?: Plan;
  checks?: CheckResult[];
  dWait?: number;
}

const cloneSeq = (s: Seq): Seq => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v.slice()]));

export function ResourceBoard() {
  const { sc, liveRun, now, addManual, go } = useSayr();
  const reduced = useReducedMotion();
  const t = Math.max(0, Math.floor(now / 5) * 5);
  const cap = useMemo(() => captureProblem(sc, snapshotAt(liveRun, t)), [sc, liveRun, t]);
  const { pb, base } = cap;
  const [seq, setSeq] = useState<Seq>(() => cloneSeq(base.seq));
  const [edits, setEdits] = useState<{ jobId: string; from: string; to: string }[]>([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [shake, setShake] = useState(0);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setSeq(cloneSeq(base.seq));
    setEdits([]);
    setSent(false);
  }, [base]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(id);
  }, [toast]);

  const plan = useMemo(() => decode(pb, seq) ?? base, [pb, seq, base]);
  const stats = useMemo(() => planStats(pb, plan), [pb, plan]);
  const checks = useMemo(() => validatePlan(pb, base, plan.items), [pb, base, plan]);
  const rmap = useMemo(() => Object.fromEntries(sc.resources.map((r) => [r.id, r])), [sc]);
  const codeOf = (jobId: string) => sc.patients.find((p) => p.id === pb.jobs[jobId]?.patientId)?.code ?? jobId;
  const frozen = useMemo(() => new Set(pb.order.filter((id) => base.items[id].start < pb.t + 5)), [pb, base]);

  const pretty = (s: string) => s.replace(/P\d{3}\.\d/g, (m) => codeOf(m));

  const evaluate = (cur: Seq, jobId: string, resId: string, pos: number): Verdict => {
    const job = pb.jobs[jobId];
    const res = rmap[resId];
    if (!jobCompat(res, job)) {
      return { ok: false, reason: res.type !== job.type ? `${res.label} is a ${TYPE_LABEL[res.type].toLowerCase()} resource, this is a ${TYPE_LABEL[job.type as keyof typeof TYPE_LABEL].toLowerCase()} appointment` : `${res.label} cannot provide ${job.skill} care` };
    }
    const cand = cloneSeq(cur);
    for (const k of Object.keys(cand)) {
      const i = cand[k].indexOf(jobId);
      if (i >= 0) {
        cand[k].splice(i, 1);
        if (k === resId && pos > i) pos--;
      }
    }
    cand[resId].splice(Math.min(pos, cand[resId].length), 0, jobId);
    const pl = decode(pb, cand);
    if (!pl) return { ok: false, reason: 'That order would put a stage ahead of the earlier stage of the same journey' };
    const ck = validatePlan(pb, base, pl.items);
    const bad = ck.find((c) => c.violations);
    if (bad) return { ok: false, reason: pretty(`${bad.label}: ${bad.detail[0] ?? bad.rule}`), checks: ck };
    return { ok: true, seq: cand, plan: pl, checks: ck, dWait: planStats(pb, pl).totalWait - stats.totalWait };
  };

  const commit = (jobId: string, v: Verdict, fromRes: string, toRes: string) => {
    if (v.ok && v.seq) {
      setSeq(v.seq);
      setSent(false);
      setEdits((e) => [...e, { jobId, from: fromRes, to: toRes }]);
      setToast({ ok: true, msg: `${codeOf(jobId)} moved to ${toRes}. Planned waiting ${v.dWait! >= 0 ? '+' : '−'}${r0(Math.abs(v.dWait!))} min. All constraints still hold.` });
    } else {
      setShake((n) => n + 1);
      setToast({ ok: false, msg: `Rejected. ${v.reason}` });
    }
  };

  const model: FlowModel = useMemo(() => {
    const blocks: FBlock[] = [];
    for (const [rid, r] of Object.entries(pb.running)) {
      const j = sc.jobs[r.jobId];
      blocks.push({ key: r.jobId, jobId: r.jobId, patientId: j.patientId, code: sc.patients.find((p) => p.id === j.patientId)!.code, k: j.k, resourceId: rid, x0: Math.max(r.start, t - 12), x1: r.end, kind: 'running', priority: j.priority, type: j.type, wait: 0 });
    }
    for (const id of pb.order) {
      const it = plan.items[id];
      const b0 = base.items[id];
      const j = pb.jobs[id];
      blocks.push({
        key: id,
        jobId: id,
        patientId: j.patientId,
        code: codeOf(id),
        k: j.k,
        resourceId: it.resourceId,
        x0: it.start,
        x1: it.end,
        kind: it.resourceId !== b0.resourceId || Math.abs(it.start - b0.start) > 0.5 ? 'preview' : 'plan',
        changed: it.resourceId !== b0.resourceId,
        priority: j.prio,
        type: j.type as FBlock['type'],
        wait: it.wait,
      });
    }
    return { blocks, queues: emptyQueues(), downs: downsAt(sc, t), tMax: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb, plan, base, sc, t]);

  const tMin = Math.max(0, t - 15);
  const tMax = Math.min(600, Math.ceil((Math.max(...Object.values(plan.items).map((i) => i.end), t + 60) + 15) / 30) * 30);

  const [drag, setDrag] = useState<null | { b: FBlock; px: number; py: number; offT: number; resId: string; pos: number; v: Verdict }>(null);
  const [settle, setSettle] = useState<null | { b: FBlock; fx: number; fy: number; ok: boolean; at: number }>(null);
  const [, force] = useState(0);
  const cache = useRef(new Map<string, Verdict>());
  useEffect(() => cache.current.clear(), [seq]);

  useEffect(() => {
    if (!settle) return;
    let raf = 0;
    const loop = () => {
      force((n) => n + 1);
      if (performance.now() - settle.at < 260) raf = requestAnimationFrame(loop);
      else setSettle(null);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [settle]);

  const overlay = (L: Layout) => {
    const svgPoint = (e: RPointerEvent) => {
      const svg = (e.target as SVGElement).ownerSVGElement!;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const q = pt.matrixTransform(svg.getScreenCTM()!.inverse());
      return { x: q.x, y: q.y };
    };
    const laneAt = (y: number) => {
      let best = 0;
      let bd = Infinity;
      L.lanes.forEach((_, i) => {
        const c = L.laneTop[i] + L.laneH / 2;
        const d = Math.abs(y - c);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      return best;
    };
    const down = (e: RPointerEvent, b: FBlock) => {
      if (frozen.has(b.jobId)) return;
      (e.target as Element).setPointerCapture(e.pointerId);
      const q = svgPoint(e);
      const v: Verdict = { ok: true };
      setToast(null);
      setDrag({ b, px: q.x, py: q.y, offT: L.tx(q.x) - b.x0, resId: b.resourceId, pos: seq[b.resourceId].indexOf(b.jobId), v });
    };
    const move = (e: RPointerEvent) => {
      if (!drag) return;
      const q = svgPoint(e);
      const li = laneAt(q.y);
      const resId = L.lanes[li].id;
      const start = L.tx(q.x) - drag.offT;
      const others = seq[resId].filter((x) => x !== drag.b.jobId);
      let pos = 0;
      for (const o of others) if (plan.items[o].start < start + 0.001) pos++;
      const key = `${drag.b.jobId}|${resId}|${pos}`;
      let v = cache.current.get(key);
      if (!v) {
        v = evaluate(seq, drag.b.jobId, resId, pos);
        cache.current.set(key, v);
      }
      setDrag({ ...drag, px: q.x, py: q.y, resId, pos, v });
    };
    const up = () => {
      if (!drag) return;
      const from = drag.b.resourceId;
      const same = drag.resId === from && seq[from].filter((x) => x !== drag.b.jobId).slice(0, drag.pos).length === seq[from].indexOf(drag.b.jobId);
      if (!same) {
        commit(drag.b.jobId, drag.v, from, drag.resId);
        if (!reduced) setSettle({ b: drag.b, fx: drag.px, fy: drag.py, ok: drag.v.ok, at: performance.now() });
      }
      setDrag(null);
    };

    const movable = model.blocks.filter((b) => b.kind !== 'running' && !frozen.has(b.jobId));
    const ghostLane = drag ? L.laneIndex[drag.resId] : -1;
    return (
      <g>
        {drag && (
          <>
            {L.lanes.map((r, i) => {
              const comp = jobCompat(r, pb.jobs[drag.b.jobId]);
              const isT = i === ghostLane;
              return (
                <g key={r.id} pointerEvents="none">
                  {!comp && <rect x={0} y={L.laneTop[i]} width={L.W} height={L.laneH} fill="url(#hatch-ot)" opacity={0.9} />}
                  {!comp && <rect x={0} y={L.laneTop[i]} width={L.W} height={L.laneH} fill="var(--paper-2)" opacity={0.5} />}
                  {isT && <rect x={1} y={L.laneTop[i] + 1} width={L.W - 2} height={L.laneH - 2} fill="none" stroke={drag.v.ok ? 'var(--teal)' : 'var(--copper)'} strokeWidth={2} rx={4} />}
                </g>
              );
            })}
            <g pointerEvents="none" transform={`translate(${Math.max(L.plotX + 8, drag.px - 360)} ${Math.max(drag.py - 36, L.axisH)})`}>
              <rect width={Math.min(330, 10 + (drag.v.ok ? 190 : (drag.v.reason?.length ?? 20) * 5.6))} height={22} rx={5} fill={drag.v.ok ? 'var(--teal)' : 'var(--copper)'} />
              <text x={9} y={15} fontSize={11} fill="#fff" fontWeight={700}>
                {drag.v.ok ? `Feasible · waiting ${signed(drag.v.dWait ?? 0)} min` : `✗ ${(drag.v.reason ?? '').slice(0, 54)}${(drag.v.reason?.length ?? 0) > 54 ? '…' : ''}`}
              </text>
            </g>
            <g pointerEvents="none" opacity={0.95}>
              <BlockShape
                b={{ ...drag.b, kind: 'preview', changed: true, x0: L.tx(drag.px) - drag.offT, x1: L.tx(drag.px) - drag.offT + (drag.b.x1 - drag.b.x0) }}
                L={L}
                y={drag.py - L.blockH / 2}
              />
            </g>
          </>
        )}
        {settle && !drag && (() => {
          const k = Math.min(1, (performance.now() - settle.at) / 260);
          const e = 1 - Math.pow(1 - k, 3);
          const tgt = model.blocks.find((x) => x.jobId === settle.b.jobId);
          if (!tgt) return null;
          const x = settle.fx + (L.xs(tgt.x0) - settle.fx) * e;
          const y = settle.fy + (L.ly(L.laneIndex[tgt.resourceId]) + L.laneH / 2 - settle.fy) * e;
          return <circle cx={x} cy={y} r={5 * (1 - e) + 0.1} fill={settle.ok ? 'var(--teal)' : 'var(--copper)'} opacity={0.6 * (1 - e)} pointerEvents="none" />;
        })()}
        {movable.map((b) => {
          const x = L.xs(b.x0);
          const w = Math.max(6, L.xs(b.x1) - x);
          const y = L.ly(L.laneIndex[b.resourceId]) + 5;
          return (
            <rect
              key={'h' + b.key}
              x={x}
              y={y}
              width={w}
              height={L.blockH}
              fill="transparent"
              style={{ cursor: drag ? 'grabbing' : 'grab', touchAction: 'none' }}
              onPointerDown={(e) => down(e, b)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={() => setDrag(null)}
            >
              <title>{`${b.code} · ${b.resourceId} · ${fmtClock(b.x0)} — drag to another lane or position`}</title>
            </rect>
          );
        })}
      </g>
    );
  };

  // keyboard-accessible alternative
  const [kJob, setKJob] = useState('');
  const [kRes, setKRes] = useState('');
  const [kPos, setKPos] = useState(1);
  const movables = pb.order.filter((id) => !frozen.has(id));
  const keyMove = () => {
    if (!kJob || !kRes) return;
    const from = Object.keys(seq).find((k) => seq[k].includes(kJob))!;
    const v = evaluate(seq, kJob, kRes, kPos - 1);
    commit(kJob, v, from, kRes);
  };
  const dBase = stats.totalWait - planStats(pb, base).totalWait;
  const changes = useMemo(() => describeChanges(makeCtx(pb, base), plan), [pb, base, plan]);

  return (
    <>
      <PageHead id="board" lede="Drag any not-yet-started appointment to another lane or position. Every drop is checked against resource type and skill, journey order, outages, protected priority and overtime. A move that breaks a rule is refused with the reason.">
        <button className="btn" onClick={() => (setSeq(cloneSeq(base.seq)), setEdits([]), setSent(false))} disabled={!edits.length}>Reset to current plan</button>
        <button
          className="btn primary"
          disabled={!edits.length || !allPass(checks) || sent}
          onClick={() => {
            addManual({ label: `Manual adjustment · ${edits.length} move${edits.length > 1 ? 's' : ''}`, blurb: 'Drafted by hand on the Resource Board.', t, problem: pb, base, plan, baseStats: planStats(pb, base), stats, changes, checks, feasible: allPass(checks) });
            setSent(true);
            go('desk');
          }}
        >
          Send to Action Desk
        </button>
      </PageHead>

      <div className={`grid side ${shake ? 'shake' : ''}`} key={'s' + shake}>
        <div className="panel flush">
          <div className="row" style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
            <span className="eyebrow">Projected plan from {fmtClock(t)} · drag to edit</span>
            <span className="sp" />
            <span className="small muted">Dashed = not started · teal = changed by you</span>
          </div>
          <div className="flow-scroll">
            <FlowCanvas className="flow-wide" sc={sc} model={model} now={t} tMinOverride={tMin} tMaxOverride={tMax} links="none" overlay={overlay} caption="Resource board: drag appointments between lanes" />
          </div>
          <Legend />
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">Capacity and availability</h2><span className="eyebrow">at {fmtClock(t)}</span></div>
            <table className="t">
              <tbody>
                {sc.resources.map((r) => {
                  const dn = sc.disruptions.find((d) => d.resourceId === r.id && d.from <= t);
                  const closed = dn && t < dn.until;
                  let busy = 0;
                  for (const id of sc.jobOrder) {
                    const js = liveRun.final.jobs[id];
                    if (js.status === 'done' && js.resourceId === r.id && js.start! < t) busy += Math.min(js.end!, t) - js.start!;
                  }
                  const lost = dn ? Math.max(0, Math.min(t, dn.until) - dn.from) : 0;
                  const util = Math.min(1, busy / Math.max(1, t - lost));
                  return (
                    <tr key={r.id}>
                      <td style={{ width: 22 }}><StatusGlyph kind={closed ? 'down' : 'ok'} /></td>
                      <td>
                        <b className="mono">{r.id}</b>
                        <div className="small muted">{r.type === 'consult' ? `${r.clinician} · ${r.room}` : r.label}</div>
                        {dn && <div className="small" style={{ color: 'var(--copper)' }}>{closed ? `${dn.label} until ${fmtClock(dn.until)}` : `${dn.label} ended ${fmtClock(dn.until)}`}</div>}
                      </td>
                      <td className="r mono">{Math.round(util * 100)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="small muted" style={{ marginTop: 8 }}>A consultation station is a clinician plus a room. Losing either one removes the station; utilisation is busy time over available time so far.</p>
          </section>

          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">Your draft</h2><span className="eyebrow">{edits.length} move{edits.length === 1 ? '' : 's'}</span></div>
            <div className="grid g2" style={{ gap: 10 }}>
              <div><div className="big sm num">{r0(stats.totalWait)}</div><div className="stat-l">planned waiting</div></div>
              <div><div className={`big sm num ${dBase < -0.5 ? 'delta-good' : dBase > 0.5 ? 'delta-bad' : ''}`}>{signed(dBase)}</div><div className="stat-l">vs current plan</div></div>
            </div>
            {edits.length > 0 && (
              <div className="small" style={{ marginTop: 10 }}>
                {edits.map((e, i) => <div key={i} className="row"><span className="mono">{codeOf(e.jobId)}</span><span className="muted">{e.from} → {e.to}</span></div>)}
              </div>
            )}
            {!edits.length && <p className="small muted" style={{ marginTop: 10 }}>No edits yet. The plan shown is what today’s policy is projected to do.</p>}
          </section>

          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">Rules checked live</h2><StatusGlyph kind={allPass(checks) ? 'ok' : 'bad'} /></div>
            <ChecksList checks={checks} />
          </section>

          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">Move without dragging</h2></div>
            <div className="stack" style={{ gap: 8 }}>
              <select value={kJob} onChange={(e) => setKJob(e.target.value)} aria-label="Appointment">
                <option value="">Choose an appointment…</option>
                {movables.slice(0, 80).map((id) => <option key={id} value={id}>{codeOf(id)} · {TYPE_LABEL[pb.jobs[id].type as keyof typeof TYPE_LABEL]} · {fmtClock(base.items[id].start)}</option>)}
              </select>
              <div className="row">
                <select value={kRes} onChange={(e) => setKRes(e.target.value)} aria-label="Target resource" style={{ flex: 1 }}>
                  <option value="">Target lane…</option>
                  {sc.resources.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.label}</option>)}
                </select>
                <input type="number" min={1} max={30} value={kPos} onChange={(e) => setKPos(Number(e.target.value))} style={{ width: 64 }} aria-label="Position in lane" />
              </div>
              <button className="btn sm" onClick={keyMove} disabled={!kJob || !kRes}>Check and move</button>
              <p className="hint">Position 1 puts the appointment first in that lane’s order.</p>
            </div>
          </section>
        </div>
      </div>
      {toast && <div className="toast" role="status"><b>{toast.ok ? 'Accepted' : 'Rejected'}</b> · {toast.msg.replace(/^Rejected\. /, '')}</div>}
    </>
  );
}

void GROUPS;
