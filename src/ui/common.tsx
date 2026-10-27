import type { ReactNode } from 'react';
import { SCREENS, useSayr } from '../state';
import type { ScreenId } from '../state';

export function PageHead({ id, lede, children }: { id: ScreenId; lede: string; children?: ReactNode }) {
  const i = SCREENS.findIndex((s) => s.id === id);
  const { t } = useSayr();
  return (
    <header className="page-head">
      <div>
        <div className="kicker">
          {String(i + 1).padStart(2, '0')} / 10
        </div>
        <h1 className="page-title">{t(SCREENS[i].name)}</h1>
        <p className="page-lede">{lede}</p>
      </div>
      {children && <div className="actions">{children}</div>}
    </header>
  );
}

export function Legend({ plan = true }: { plan?: boolean }) {
  return (
    <div className="legend" aria-label="Legend">
      <span><i className="lg-done" />Completed service</span>
      <span><i className="lg-run" />In service now</span>
      {plan && <span><i className="lg-plan" />Projected from today’s plan</span>}
      <span><i className="lg-delay" />Wait ≥ 15 min</span>
      <span><i className="lg-urg" />Protected priority</span>
      <span><i className="lg-q" />Queue at the clock (longest first)</span>
      <span><i className="lg-out" />Outage</span>
    </div>
  );
}

export const r0 = (x: number) => Math.round(x).toLocaleString('en-US');
export const r1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1);
export const signed = (x: number, d = 0) => {
  const v = d ? Number(Math.abs(x).toFixed(d)) : Math.round(Math.abs(x));
  if (v === 0) return '±0';
  return `${x < 0 ? '−' : '+'}${v.toLocaleString('en-US')}`;
};
export const pct0 = (x: number) => `${Math.round(x * 100)}%`;

export function Delta({ v, unit = '', lowerIsBetter = true, d = 0 }: { v: number; unit?: string; lowerIsBetter?: boolean; d?: number }) {
  const zero = Math.abs(v) < 0.5 * Math.pow(10, -d);
  const good = lowerIsBetter ? v < 0 : v > 0;
  return <span className={zero ? 'muted' : good ? 'delta-good' : 'delta-bad'}>{zero ? '±0' : signed(v, d)}{unit}</span>;
}

export function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><rect x="2" y="1" width="3.5" height="12" rx="1" fill="currentColor" /><rect x="8.5" y="1" width="3.5" height="12" rx="1" fill="currentColor" /></svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M3 1.5v11l9-5.5z" fill="currentColor" /></svg>
  );
}

/** Small animated operational glyphs (original SVG, driven by real state). */
export function StatusGlyph({ kind }: { kind: 'idle' | 'busy' | 'down' | 'ok' | 'bad' }) {
  return (
    <svg width="16" height="16" viewBox="-8 -8 16 16" aria-hidden className={`glyph glyph-${kind}`}>
      {kind === 'busy' && <circle r="6" fill="none" stroke="var(--teal)" strokeWidth="1.2" className="st-ring" />}
      {kind === 'busy' && <circle r="4" fill="var(--teal)" />}
      {kind === 'idle' && <circle r="4" fill="none" stroke="var(--mut-2)" strokeWidth="1.4" />}
      {kind === 'down' && <rect x="-5" y="-5" width="10" height="10" rx="2" fill="url(#hatch-copper)" stroke="var(--copper)" />}
      {kind === 'ok' && <path d="M-4 0l3 3 5-6" fill="none" stroke="var(--teal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      {kind === 'bad' && <path d="M-4 -4l8 8M4 -4l-8 8" fill="none" stroke="var(--copper)" strokeWidth="1.8" strokeLinecap="round" />}
    </svg>
  );
}

export function Sparkline({ values, base, w = 280, h = 56 }: { values: number[]; base: number; w?: number; h?: number }) {
  if (values.length < 2) return null;
  const mx = Math.max(base, ...values);
  const mn = Math.min(...values);
  const x = (i: number) => (i / (values.length - 1)) * (w - 4) + 2;
  const y = (v: number) => h - 6 - ((v - mn) / Math.max(1, mx - mn)) * (h - 12);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} aria-label="Objective value as the search progressed">
      <line className="base" x1="0" x2={w} y1={y(base)} y2={y(base)} />
      <path d={d} />
    </svg>
  );
}
