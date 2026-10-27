import { useMemo, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent, ReactNode } from 'react';
import { fmtClock } from '../engine/types';
import type { ResourceDef, ResType, Scenario } from '../engine/types';
import { DELAY_THRESHOLD, GROUPS, GROUP_LABEL, LINK_THRESHOLD } from './flowModel';
import type { FBlock, FlowModel } from './flowModel';

export interface Layout {
  W: number;
  H: number;
  labelW: number;
  plotX: number;
  plotW: number;
  tMin: number;
  tMax: number;
  laneH: number;
  blockH: number;
  axisH: number;
  groupH: number;
  lanes: ResourceDef[];
  laneTop: number[];
  laneIndex: Record<string, number>;
  groupTop: { type: ResType; y: number; first: number; last: number }[];
  xs: (t: number) => number;
  tx: (x: number) => number;
  ly: (laneF: number) => number;
}

export function makeLayout(sc: Scenario, tMax: number, compact = false, tMin = 0, W = 1280): Layout {
  const labelW = compact ? 132 : 208;
  const plotX = labelW;
  const plotW = W - labelW - 20;
  const laneH = compact ? 24 : 32;
  const blockH = laneH - 10;
  const axisH = 34;
  const groupH = compact ? 20 : 26;
  const lanes: ResourceDef[] = [];
  const laneTop: number[] = [];
  const groupTop: Layout['groupTop'] = [];
  let y = axisH;
  for (const g of GROUPS) {
    const inG = sc.resources.filter((r) => r.type === g);
    if (!inG.length) continue;
    groupTop.push({ type: g, y, first: lanes.length, last: lanes.length + inG.length - 1 });
    y += groupH;
    for (const r of inG) {
      lanes.push(r);
      laneTop.push(y);
      y += laneH;
    }
  }
  const laneIndex = Object.fromEntries(lanes.map((r, i) => [r.id, i]));
  const xs = (t: number) => plotX + ((t - tMin) / (tMax - tMin)) * plotW;
  const tx = (x: number) => tMin + ((x - plotX) / plotW) * (tMax - tMin);
  const ly = (f: number) => {
    const a = Math.max(0, Math.min(lanes.length - 1, Math.floor(f)));
    const b = Math.min(lanes.length - 1, a + 1);
    return laneTop[a] + (laneTop[b] - laneTop[a]) * (f - a);
  };
  return { W, H: y + 12, labelW, plotX, plotW, tMin, tMax, laneH, blockH, axisH, groupH, lanes, laneTop, laneIndex, groupTop, xs, tx, ly };
}

export function laneOf(b: FBlock, L: Layout): number {
  return b.laneF ?? L.laneIndex[b.resourceId] ?? 0;
}

export function BlockShape({ b, L, dim, selected, hovered, y: yOverride }: { b: FBlock; L: Layout; dim?: boolean; selected?: boolean; hovered?: boolean; y?: number }) {
  const x = L.xs(b.x0);
  const w = Math.max(3, L.xs(b.x1) - L.xs(b.x0) - 1);
  const y = yOverride ?? L.ly(laneOf(b, L)) + 5;
  const cls = `blk blk-${b.kind}${b.changed ? ' blk-changed' : ''}${selected ? ' blk-sel' : ''}${hovered ? ' blk-hover' : ''}`;
  return (
    <g opacity={(b.opacity ?? 1) * (dim ? 0.28 : 1)} className="blk-g">
      <rect className={cls} x={x} y={y} width={w} height={L.blockH} rx={3} />
      {b.openEnd && <rect className="blk-open" x={x + w - 3} y={y} width={3} height={L.blockH} />}
      {b.priority === 'urgent' && <rect className="blk-urgent" x={x} y={y} width={3} height={L.blockH} rx={1.5} />}
      {w > 36 && (
        <text className={`blk-t blk-t-${b.kind}`} x={x + 7} y={y + L.blockH / 2 + 3} fontSize={9}>
          {b.code}
        </text>
      )}
    </g>
  );
}

export type LinkMode = 'delays' | 'all' | 'selected' | 'none';

interface Props {
  sc: Scenario;
  model: FlowModel;
  now: number;
  onNow?: (t: number) => void;
  selected?: string | null;
  onSelect?: (patientId: string | null) => void;
  links?: LinkMode;
  compact?: boolean;
  ghosts?: FBlock[];
  trails?: { a: FBlock; b: FBlock; p: number }[];
  showNowLine?: boolean;
  tMaxOverride?: number;
  tMinOverride?: number;
  highlightLanes?: string[];
  overlay?: (L: Layout) => ReactNode;
  caption?: string;
  className?: string;
}

export function FlowCanvas(p: Props) {
  const { sc, model, now, selected, links = 'delays', compact = false } = p;
  const tMax = p.tMaxOverride ?? model.tMax;
  const tMin = p.tMinOverride ?? 0;
  const L = useMemo(() => makeLayout(sc, tMax, compact, tMin), [sc, tMax, compact, tMin]);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ b: FBlock; x: number; y: number } | null>(null);
  const [drag, setDrag] = useState(false);

  const byPatient = useMemo(() => {
    const m = new Map<string, FBlock[]>();
    for (const b of model.blocks) {
      if (b.kind === 'ghost') continue;
      const arr = m.get(b.patientId) ?? [];
      arr.push(b);
      m.set(b.patientId, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.k - b.k);
    return m;
  }, [model.blocks]);

  const linkEls = useMemo(() => {
    const out: ReactNode[] = [];
    for (const [pid, arr] of byPatient) {
      const isSel = selected === pid;
      if (links === 'none') break;
      if (links === 'selected' && !isSel) continue;
      for (let i = 1; i < arr.length; i++) {
        const a = arr[i - 1];
        const b = arr[i];
        const delayed = b.wait >= DELAY_THRESHOLD;
        // in the default view only the long waits are drawn, so the canvas stays readable when the clinic is busy
        if (links === 'delays' && b.wait < LINK_THRESHOLD && !isSel) continue;
        const x0 = L.xs(a.x1);
        const x1 = L.xs(b.x0);
        const y0 = L.ly(laneOf(a, L)) + 5 + L.blockH / 2;
        const y1 = L.ly(laneOf(b, L)) + 5 + L.blockH / 2;
        const dx = Math.max(8, (x1 - x0) * 0.55);
        const d = `M${x0},${y0} C${x0 + dx},${y0} ${x1 - dx},${y1} ${x1},${y1}`;
        out.push(
          <path
            key={`${pid}-${i}`}
            d={d}
            className={`lnk${delayed ? ' lnk-delay' : ''}${isSel ? ' lnk-sel' : ''}${selected && !isSel ? ' lnk-dim' : ''}${b.kind === 'plan' ? ' lnk-plan' : ''}`}
          />,
        );
        if (isSel && delayed) {
          out.push(
            <text key={`${pid}-${i}t`} className="lnk-label" x={(x0 + x1) / 2} y={(y0 + y1) / 2 - 6} textAnchor="middle">
              waits {Math.round(b.wait)}m
            </text>,
          );
        }
      }
    }
    return out;
  }, [byPatient, selected, links, L]);

  // busy minutes so far per lane
  const busy = useMemo(() => {
    const m: Record<string, { busy: number; running: boolean }> = {};
    for (const r of sc.resources) m[r.id] = { busy: 0, running: false };
    for (const b of model.blocks) {
      if (b.kind === 'done' || b.kind === 'running') {
        m[b.resourceId].busy += b.x1 - b.x0;
        if (b.kind === 'running') m[b.resourceId].running = true;
      }
    }
    return m;
  }, [model.blocks, sc.resources]);

  const toTime = (e: RPointerEvent | PointerEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const q = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return Math.max(0, Math.min(L.tMax, L.tx(q.x)));
  };

  const startDrag = (e: RPointerEvent) => {
    if (!p.onNow) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag(true);
    p.onNow(Math.round(toTime(e)));
  };
  const moveDrag = (e: RPointerEvent) => {
    if (drag && p.onNow) p.onNow(Math.round(toTime(e)));
  };

  const hours: number[] = [];
  for (let t = Math.ceil(L.tMin / 60) * 60; t <= L.tMax; t += 60) hours.push(t);
  const halves: number[] = [];
  for (let t = Math.ceil(L.tMin / 30) * 30; t <= L.tMax; t += 30) if (t % 60) halves.push(t);

  const nowX = L.xs(now);
  const selBlocks = selected ? byPatient.get(selected) : undefined;
  void selBlocks;

  return (
    <div className={`flow ${p.className ?? ''}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${L.W} ${L.H}`}
        className="flow-svg"
        role="img"
        aria-label={p.caption ?? 'Flow Canvas: resource lanes over the clinic day'}
        onPointerMove={moveDrag}
        onPointerUp={() => setDrag(false)}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <clipPath id="plot-clip">
            <rect x={L.plotX} y={0} width={L.plotW + 20} height={L.H} />
          </clipPath>
          <pattern id="hatch-copper" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" className="hatch-bg" />
            <line x1="0" y1="0" x2="0" y2="6" className="hatch-line" strokeWidth="2" />
          </pattern>
          <pattern id="hatch-ot" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="8" className="ot-line" strokeWidth="1" />
          </pattern>
        </defs>

        {/* lane bands */}
        {L.groupTop.map((g) => (
          <g key={g.type}>
            <rect className="grp-head" x={0} y={g.y} width={L.W} height={L.groupH} />
            <text className="grp-name" x={12} y={g.y + L.groupH / 2 + 4}>
              {GROUP_LABEL[g.type].toUpperCase()}
            </text>
          </g>
        ))}
        {L.lanes.map((r, i) => {
          const y = L.laneTop[i];
          const hl = p.highlightLanes?.includes(r.id);
          const down = model.downs.some((d) => d.resourceId === r.id && d.ongoing);
          const bz = busy[r.id];
          const util = Math.min(1, bz.busy / Math.max(1, now));
          return (
            <g key={r.id}>
              <rect className={`lane${i % 2 ? ' lane-alt' : ''}${hl ? ' lane-hl' : ''}`} x={0} y={y} width={L.W} height={L.laneH} />
              <g transform={`translate(14 ${y + L.laneH / 2})`}>
                {down ? (
                  <rect className="st-down" x={-5} y={-5} width={10} height={10} rx={2} fill="url(#hatch-copper)" />
                ) : bz.running ? (
                  <>
                    <circle className="st-ring" r={4} />
                    <circle className="st-busy" r={4} />
                  </>
                ) : (
                  <circle className="st-idle" r={4} />
                )}
              </g>
              <text className="lane-id" x={28} y={y + L.laneH / 2 + 3.5}>
                {r.id}
              </text>
              {!compact && (
                <text className="lane-label" x={72} y={y + L.laneH / 2 + 3.5}>
                  {r.label.length > 15 ? r.label.slice(0, 14) + '…' : r.label}
                </text>
              )}
              <rect className="util-track" x={L.labelW - 44} y={y + L.laneH / 2 - 2} width={32} height={4} rx={2} />
              <rect className="util-fill" x={L.labelW - 44} y={y + L.laneH / 2 - 2} width={32 * util} height={4} rx={2} />
            </g>
          );
        })}

        {/* time grid */}
        <g>
          {halves.map((t) => (
            <line key={t} className="grid-half" x1={L.xs(t)} x2={L.xs(t)} y1={L.axisH} y2={L.H - 12} />
          ))}
          {hours.map((t) => (
            <g key={t}>
              <line className="grid-hour" x1={L.xs(t)} x2={L.xs(t)} y1={L.axisH - 6} y2={L.H - 12} />
              <text className="axis-t" x={L.xs(t) + 4} y={L.axisH - 12}>
                {fmtClock(t)}
              </text>
            </g>
          ))}
        </g>

        {/* shift end + overtime zone (capacity limit) */}
        {sc.shiftEnd < L.tMax && (
          <g>
            <rect x={L.xs(sc.shiftEnd)} y={L.axisH} width={L.xs(L.tMax) - L.xs(sc.shiftEnd)} height={L.H - L.axisH - 12} fill="url(#hatch-ot)" />
            <line className="shift-end" x1={L.xs(sc.shiftEnd)} x2={L.xs(sc.shiftEnd)} y1={L.axisH - 6} y2={L.H - 12} />
            <text className="shift-t" x={L.xs(sc.shiftEnd) + 5} y={L.H - 16}>
              shift ends · overtime
            </text>
          </g>
        )}

        <g clipPath="url(#plot-clip)">
        {/* outages */}
        {model.downs.map((d) => {
          const i = L.laneIndex[d.resourceId];
          if (i === undefined) return null;
          const x0 = L.xs(d.from);
          const x1 = L.xs(d.ongoing ? d.to : d.to);
          return (
            <g key={d.resourceId + d.from}>
              <rect x={x0} y={L.laneTop[i] + 2} width={Math.max(0, x1 - x0)} height={L.laneH - 4} fill="url(#hatch-copper)" className="outage" rx={2} opacity={d.ongoing && d.to > now ? 0.85 : 0.6} />
              {x1 - x0 > 70 && (
                <text className="outage-t" x={x0 + 6} y={L.laneTop[i] + L.laneH / 2 + 3.5}>
                  OUTAGE · {fmtClock(d.from)}–{fmtClock(d.to)}
                </text>
              )}
            </g>
          );
        })}

        {/* journey lines */}
        <g className="lnk-layer">{linkEls}</g>

        {/* ghosts and trails (Reflow) */}
        {p.ghosts?.map((g) => (
          <rect key={'g' + g.key} className="ghost" x={L.xs(g.x0)} y={L.ly(laneOf(g, L)) + 5} width={Math.max(3, L.xs(g.x1) - L.xs(g.x0) - 1)} height={L.blockH} rx={3} />
        ))}
        {p.trails?.map((t) => {
          const ax = L.xs(t.a.x0) + 4;
          const ay = L.ly(laneOf(t.a, L)) + 5 + L.blockH / 2;
          const bx = L.xs(t.b.x0) + 4;
          const by = L.ly(laneOf(t.b, L)) + 5 + L.blockH / 2;
          const mx = (ax + bx) / 2;
          return <path key={'t' + t.a.key} className="trail" d={`M${ax},${ay} C${mx},${ay} ${mx},${by} ${bx},${by}`} opacity={0.15 + 0.5 * (1 - Math.abs(0.5 - t.p) * 2)} />;
        })}

        {/* blocks */}
        <g>
          {model.blocks.map((b) => {
            const dim = !!selected && b.patientId !== selected;
            return (
              <g
                key={b.key}
                onPointerEnter={(e) => {
                  const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({ b, x: e.clientX - r.left, y: e.clientY - r.top });
                }}
                onPointerMove={(e) => {
                  const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({ b, x: e.clientX - r.left, y: e.clientY - r.top });
                }}
                onPointerLeave={() => setHover(null)}
                onClick={() => p.onSelect?.(selected === b.patientId ? null : b.patientId)}
                style={{ cursor: p.onSelect ? 'pointer' : 'default' }}
              >
                <BlockShape b={b} L={L} dim={dim} selected={selected === b.patientId} hovered={hover?.b.key === b.key} />
              </g>
            );
          })}
        </g>

        </g>

        {/* queues: stacked in front of the now-line, in each group header */}
        {p.showNowLine !== false &&
          L.groupTop.map((g) => {
            const q = model.queues[g.type];
            if (!q.length) return null;
            const shown = q.slice(0, 14);
            return (
              <g key={'q' + g.type}>
                {shown.map((c, i) => (
                  <rect
                    key={c.jobId}
                    className={`qchip${c.waited >= DELAY_THRESHOLD ? ' qchip-late' : ''}${c.priority === 'urgent' ? ' qchip-urgent' : ''}`}
                    x={nowX - 11 - i * 11}
                    y={g.y + L.groupH / 2 - 6}
                    width={9}
                    height={12}
                    rx={2}
                    onClick={() => p.onSelect?.(sc.patients.find((x) => x.code === c.code)!.id)}
                  >
                    <title>{`${c.code} · waiting ${Math.round(c.waited)} min`}</title>
                  </rect>
                ))}
                <text className="q-count" x={nowX + 8} y={g.y + L.groupH / 2 + 3.5}>
                  queue {q.length}
                  {q[0] ? ` · longest ${Math.round(q[0].waited)}m` : ''}
                </text>
              </g>
            );
          })}

        {p.overlay?.(L)}

        {/* now indicator */}
        {p.showNowLine !== false && (
          <g className="now" onPointerDown={startDrag} style={{ cursor: p.onNow ? 'ew-resize' : 'default' }}>
            <rect x={L.plotX} y={0} width={L.plotW} height={L.axisH} fill="transparent" />
            <line className="now-line" x1={nowX} x2={nowX} y1={L.axisH - 4} y2={L.H - 12} />
            <g transform={`translate(${nowX} 4)`}>
              <rect className="now-flag" x={-23} y={0} width={46} height={18} rx={3} />
              <text className="now-t" x={0} y={12.5} textAnchor="middle">
                {fmtClock(now)}
              </text>
            </g>
          </g>
        )}
      </svg>

      {hover && (
        <div className="tip" style={{ left: Math.min(hover.x + 14, 9999), top: hover.y + 14 }}>
          <b>{hover.b.code}</b> · {GROUP_LABEL[hover.b.type]} <span className="tip-mut">on {hover.b.resourceId}</span>
          <div className="tip-row">
            {fmtClock(hover.b.x0)}–{fmtClock(hover.b.x1)}
            {hover.b.kind === 'plan' ? ' (projected)' : hover.b.openEnd ? ' (in progress)' : ''}
          </div>
          <div className="tip-row">
            {hover.b.priority === 'urgent' ? 'Protected priority · ' : ''}
            {hover.b.wait >= 1 ? `waited ${Math.round(hover.b.wait)} min` : 'no wait'}
            {hover.b.cause && hover.b.cause !== 'ready' && hover.b.kind !== 'plan' ? ` · ${hover.b.cause === 'outage' ? 'held by outage' : hover.b.cause}` : ''}
          </div>
        </div>
      )}
    </div>
  );
}
