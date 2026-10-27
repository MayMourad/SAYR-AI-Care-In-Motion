import type { Change } from '../engine/optimizer';
import type { CheckResult } from '../engine/plan';
import { fmtClock } from '../engine/types';
import type { Scenario } from '../engine/types';
import { r0, signed } from './common';

export function ChecksList({ checks }: { checks: CheckResult[] }) {
  return (
    <div>
      {checks.map((c) => (
        <div className="check" key={c.id}>
          <span className={`tick${c.violations ? ' bad' : ''}`} aria-hidden>{c.violations ? '!' : '✓'}</span>
          <div>
            <b>{c.label}</b>
            <small>{c.violations ? c.detail.slice(0, 2).join(' · ') : c.rule}</small>
          </div>
          <span className="mono small muted" title={`${c.checked} checked`}>{c.violations ? `${c.violations} ✗` : `${c.checked} ✓`}</span>
        </div>
      ))}
    </div>
  );
}

export function ChangeList({
  sc,
  changes,
  limit = 9,
  onHover,
}: {
  sc: Scenario;
  changes: Change[];
  limit?: number;
  onHover?: (patientId: string | null) => void;
}) {
  const sorted = changes.slice().sort((a, b) => a.waitAfter - a.waitBefore - (b.waitAfter - b.waitBefore));
  const shown = sorted.slice(0, limit);
  const code = (pid: string) => sc.patients.find((p) => p.id === pid)!.code;
  return (
    <div role="list">
      {shown.map((c) => {
        const dw = c.waitAfter - c.waitBefore;
        return (
          <div className="chg" role="listitem" key={c.jobId} onMouseEnter={() => onHover?.(c.patientId)} onMouseLeave={() => onHover?.(null)}>
            <span className="chg-code">{code(c.patientId)}</span>
            <span className="small">
              {c.kind === 'reassigned' ? (
                <>{c.fromRes} <span className="arrow">→</span> {c.toRes}</>
              ) : (
                <>on {c.toRes}</>
              )}
              <span className="muted"> · {fmtClock(c.fromStart)} <span className="arrow">→</span> {fmtClock(c.toStart)}</span>
            </span>
            <span className={`chg-d ${dw < -0.5 ? 'delta-good' : dw > 0.5 ? 'delta-bad' : 'muted'}`}>{signed(dw)}m wait</span>
          </div>
        );
      })}
      {changes.length > limit && <p className="small muted" style={{ padding: '6px 8px' }}>and {changes.length - limit} more appointments changed</p>}
      {!changes.length && <p className="small muted">No appointments change.</p>}
    </div>
  );
}

export function kindSummary(changes: Change[]) {
  const re = changes.filter((c) => c.kind === 'reassigned').length;
  const sq = changes.length - re;
  return `${r0(re)} reassigned · ${r0(sq)} re-sequenced`;
}
