import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHead, r0 } from '../ui/common';
import { useReducedMotion, useSayr } from '../state';
import { fmtClock } from '../engine/types';
import type { RippleNode } from '../engine/ripple';

const COL = 168;
const ROW = 44;
const NW = 146;
const NH = 34;

const VIA_TEXT: Record<string, string> = {
  outage: 'the resource was unavailable until the disruption ended',
  resource: 'it had to wait for the previous appointment on the same resource to finish',
  precedence: 'its previous stage finished late, so the next stage started late',
  reorder: 'queue order shifted around the disruption, moving its turn later',
  injected: 'it is one of the extra arrivals the disruption brought',
};

export function RippleTrace() {
  const { ripple, selected, select, sc, metricsBase, go } = useSayr();
  const reduced = useReducedMotion();
  const maxDepth = ripple ? Math.max(...Object.values(ripple.nodes).map((n) => n.depth)) : 0;
  const [hops, setHops] = useState(3);
  const [focus, setFocus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    timer.current = window.setInterval(() => {
      setHops((h) => {
        if (h >= maxDepth) {
          setRunning(false);
          return h;
        }
        return h + 1;
      });
    }, 650);
    return () => window.clearInterval(timer.current);
  }, [running, maxDepth]);

  const layout = useMemo(() => {
    if (!ripple) return null;
    const vis = (n: RippleNode) => n.depth <= hops;
    const pos: Record<string, { x: number; y: number }> = {};
    let leaf = 0;
    const walk = (id: string): number => {
      const n = ripple.nodes[id];
      const kids = n.children.filter((c) => vis(ripple.nodes[c])).sort((a, b) => ripple.nodes[a].at - ripple.nodes[b].at);
      if (!kids.length) {
        const y = leaf++ * ROW + 28;
        pos[id] = { x: n.depth * COL + 16, y };
        return y;
      }
      const ys = kids.map(walk);
      const y = (ys[0] + ys[ys.length - 1]) / 2;
      pos[id] = { x: n.depth * COL + 16, y };
      return y;
    };
    walk(ripple.rootId);
    const visible = Object.values(ripple.nodes).filter(vis);
    return { pos, visible, W: (Math.min(hops, maxDepth) + 1) * COL + 40, H: Math.max(leaf, 1) * ROW + 40 };
  }, [ripple, hops, maxDepth]);

  if (!ripple || !layout) {
    return (
      <>
        <PageHead id="ripple" lede="Follow how one disruption spreads through resources and journeys." />
        <div className="empty">
          <b>Normal operations: nothing to trace</b>
          Activate a staff absence, walk-in surge, laboratory slowdown or room closure in Stress Controls, and the trace will follow it through the event log.
          <div style={{ marginTop: 12 }}><button className="btn" onClick={() => go('stress')}>Open Stress Controls</button></div>
        </div>
      </>
    );
  }

  const chain = (id: string | null) => {
    const set = new Set<string>();
    let cur = id ? ripple.nodes[id] : null;
    while (cur) {
      set.add(cur.id);
      cur = cur.parent ? ripple.nodes[cur.parent] : null;
    }
    return set;
  };
  const hot = chain(focus);
  const fn = focus ? ripple.nodes[focus] : null;
  const reachedMinutes = layout.visible.filter((n) => n.kind === 'job').reduce((s, n) => s + Math.max(0, n.waitAdded), 0);

  return (
    <>
      <PageHead id="ripple" lede="The same day replayed with and without the disruption, on the same patients and the same realised durations. Each box is an appointment that started later because of it. Each line is a dependency the event log records: the resource it waited for, or the stage before it. Click a box to see why.">
        <button className="btn" onClick={() => (reduced ? setHops(maxDepth) : (setHops(0), setRunning(true)))}>Play the ripple</button>
        <label className="small row">Hops shown
          <input className="sl" type="range" min={0} max={maxDepth} value={hops} onChange={(e) => (setRunning(false), setHops(Number(e.target.value)))} aria-label="Hops shown" />
          <span className="mono">{hops}/{maxDepth}</span>
        </label>
      </PageHead>

      <div className="grid g4" style={{ marginBottom: 18 }}>
        <div className="panel"><div className="big num">{ripple.affectedPatients}</div><div className="stat-l">patients delayed ≥ 3 min</div><div className="stat-n">of {metricsBase.scheduledTotal} who attended</div></div>
        <div className="panel"><div className="big num delta-bad">{r0(ripple.extraWaitMinutes)}<span className="u">min</span></div><div className="stat-l">waiting minutes caused</div><div className="stat-n">vs the day without the outage</div></div>
        <div className="panel"><div className="big num">{ripple.byHop.length}</div><div className="stat-l">hops to reach the last delay</div><div className="stat-n">{reachedMinutes ? `${r0(reachedMinutes)} min shown at ${hops} hop${hops === 1 ? '' : 's'}` : 'Reveal hops to follow it'}</div></div>
        <div className="panel"><div className="big num">{ripple.extraOvertime > 0 ? '+' : ''}{r0(ripple.extraOvertime)}<span className="u">min</span></div><div className="stat-l">extra staff overtime</div><div className="stat-n">all resources, end of day</div></div>
      </div>

      <div className="grid side">
        <div className="panel flush">
          <div className="row" style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
            <span className="eyebrow">{ripple.label} · {fmtClock(ripple.from)}–{fmtClock(ripple.until)}</span>
            <span className="sp" />
            <span className="small row"><i style={{ width: 18, height: 2, background: 'var(--copper-2)', display: 'inline-block' }} /> resource</span>
            <span className="small row"><i style={{ width: 18, height: 2, background: 'var(--teal-2)', display: 'inline-block' }} /> previous stage</span>
            <span className="small row"><i style={{ width: 18, borderTop: '2px dashed var(--mut-2)', display: 'inline-block' }} /> re-ordered</span>
          </div>
          <div style={{ overflow: 'auto', maxHeight: 620 }}>
            <svg className="ripple-svg" width={layout.W} height={layout.H} viewBox={`0 0 ${layout.W} ${layout.H}`} role="img" aria-label="Dependency tree of delays caused by the disruption">
              {layout.visible.filter((n) => n.parent).map((n) => {
                const a = layout.pos[n.parent!];
                const b = layout.pos[n.id];
                if (!a || !b) return null;
                const x0 = a.x + NW;
                const x1 = b.x;
                const mx = (x0 + x1) / 2;
                const w = 1 + Math.min(5, Math.sqrt(Math.max(0, n.delay)) * 0.7);
                const on = hot.has(n.id);
                return (
                  <path
                    key={'e' + n.id}
                    className={`re ${n.via}`}
                    d={`M${x0},${a.y} C${mx},${a.y} ${mx},${b.y} ${x1},${b.y}`}
                    strokeWidth={w}
                    opacity={focus ? (on ? 1 : 0.15) : 0.75}
                  />
                );
              })}
              {layout.visible.map((n) => {
                const ps = layout.pos[n.id];
                const root = n.kind === 'disruption';
                const dim = focus && !hot.has(n.id);
                const hidden = n.children.filter((c) => ripple.nodes[c].depth > hops).length;
                return (
                  <g
                    key={n.id}
                    className={`rn exp${root ? ' root' : ''}${focus === n.id ? ' sel' : ''}`}
                    transform={`translate(${ps.x} ${ps.y - NH / 2})`}
                    opacity={dim ? 0.3 : 1}
                    onClick={() => (setFocus(focus === n.id ? null : n.id), n.patientId && select(n.patientId))}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setFocus(n.id)}
                  >
                    <rect width={NW} height={NH} rx={5} />
                    {root ? (
                      <>
                        <text className="rn-c" x={10} y={15}>{ripple.label.length > 20 ? ripple.label.slice(0, 19) + '…' : ripple.label}</text>
                        <text x={10} y={28} style={{ fill: '#fff', fontSize: 10 }}>{fmtClock(ripple.from)}–{fmtClock(ripple.until)}</text>
                      </>
                    ) : (
                      <>
                        <text className="rn-c" x={10} y={15}>{n.code}</text>
                        <text className="rn-m" x={10} y={28}>{n.resourceId} · {fmtClock(n.at)}</text>
                        <text x={NW - 8} y={15} textAnchor="end" style={{ fill: 'var(--copper)', fontWeight: 700, fontFamily: 'var(--mono)' }}>+{r0(n.delay)}m</text>
                      </>
                    )}
                    {hidden > 0 && (
                      <g transform={`translate(${NW - 6} ${NH / 2})`}>
                        <circle r={9} fill="var(--copper)" />
                        <text textAnchor="middle" y={3.5} style={{ fill: '#fff', fontSize: 10, fontWeight: 700 }}>+{hidden}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">{fn ? 'Why this one' : 'What carried the delay'}</h2></div>
            {!fn && <p className="small" style={{ marginBottom: 8 }}>{ripple.summary}</p>}
            {fn && fn.kind === 'job' ? (
              <>
                <p className="small"><b>{fn.code}</b> {fn.via === 'injected' ? 'started' : `started ${r0(fn.delay)} min later`} on {fn.resourceId} at {fmtClock(fn.at)}, {fn.via === 'injected' ? 'waiting' : 'adding'} {r0(fn.waitAdded)} min, because {VIA_TEXT[fn.via!]}.</p>
                <p className="small muted" style={{ marginTop: 8 }}>
                  Parent: {ripple.nodes[fn.parent!].kind === 'disruption' ? 'the outage itself' : `${ripple.nodes[fn.parent!].code} on ${ripple.nodes[fn.parent!].resourceId}`}. It carries {r0(fn.subtree)} min of downstream waiting.
                </p>
              </>
            ) : (
              <>
                <p className="small muted" style={{ marginBottom: 8 }}>Appointments ranked by the waiting they pass on to others. Clicking a box in the tree highlights its path back to the outage.</p>
                {ripple.carriers.map((c) => (
                  <div key={c.id} className="row small" style={{ padding: '5px 0', borderBottom: '1px dashed var(--line)', cursor: 'pointer' }} onClick={() => setFocus(c.id)}>
                    <b className="mono">{c.label}</b><span className="sp" /><span className="mono delta-bad">{r0(c.subtree)} min</span>
                  </div>
                ))}
              </>
            )}
          </section>
          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">By resource</h2></div>
            {ripple.byResource.map((b) => (
              <div key={b.resourceId} style={{ marginBottom: 8 }}>
                <div className="row small"><span className="mono">{b.resourceId}</span><span className="sp" /><span className="mono">{r0(b.minutes)} min</span></div>
                <div className="bar copper"><i style={{ width: `${(b.minutes / Math.max(1, ripple.byResource[0].minutes)) * 100}%` }} /></div>
              </div>
            ))}
          </section>
          <section className="panel">
            <div className="panel-h"><h2 className="panel-t">By hop</h2></div>
            <table className="t">
              <thead><tr><th>Hop</th><th className="r">Appointments</th><th className="r">Added wait</th></tr></thead>
              <tbody>
                {ripple.byHop.map((h) => <tr key={h.depth} className={h.depth <= hops ? '' : 'muted'}><td>{h.depth}</td><td className="r">{h.jobs}</td><td className="r">{r0(h.minutes)} min</td></tr>)}
              </tbody>
            </table>
            <p className="small muted" style={{ marginTop: 8 }}>{sc.patients.length} patients in the day; delay is counted per appointment, so a patient can appear more than once.</p>
          </section>
        </div>
      </div>
    </>
  );
}
