// Layer 3: operational explanation. Deterministic sentences generated from real state changes.
import type { Change } from './optimizer';
import { HARM_CAP } from './plan';
import type { CheckResult, Plan, PlanStats, Problem } from './plan';
import { scenarioHeadline } from './scenario';
import { fmtClock } from './types';
import type { Scenario } from './types';

const n = (x: number) => Math.round(x).toLocaleString('en-US');

export function explainProposal(sc: Scenario, pb: Problem, base: Plan, plan: Plan, changes: Change[], baseStats: PlanStats, stats: PlanStats, checks: CheckResult[]): string[] {
  const out: string[] = [];
  const d = sc.disruptions[0];
  out.push(d ? `${scenarioHeadline(sc)} from ${fmtClock(d.from)} to ${fmtClock(d.until)}.` : `Scenario: ${scenarioHeadline(sc)}.`);
  const waitingBase = pb.order.filter((id) => base.items[id].wait >= 15).length;
  out.push(`At ${fmtClock(pb.t)} there were ${pb.order.length} appointments still to start; ${waitingBase} are expected to wait 15 minutes or more under the current plan.`);
  const re = changes.filter((c) => c.kind === 'reassigned').length;
  const sq = changes.length - re;
  const better = changes.filter((c) => c.waitAfter < c.waitBefore - 0.5).length;
  const worse = changes.filter((c) => c.waitAfter > c.waitBefore + 0.5).length;
  if (!changes.length) {
    out.push('The search found no feasible change that reduces waiting under these constraints, so the current plan is kept.');
  } else {
    out.push(`The proposal changes ${changes.length} appointments: ${re} moved to a different consultation station and ${sq} taken in a different order. ${better} would wait less and ${worse} would wait longer (no one by more than ${HARM_CAP} minutes).`);
  }
  const dw = stats.totalWait - baseStats.totalWait;
  out.push(`Planned total waiting moves from ${n(baseStats.totalWait)} to ${n(stats.totalWait)} minutes (${dw <= 0 ? '−' : '+'}${n(Math.abs(dw))}). The longest planned wait goes from ${n(baseStats.maxWait)} to ${n(stats.maxWait)} minutes.`);
  const remaining = pb.order.filter((id) => plan.items[id].wait >= 15).length;
  out.push(`${remaining} appointments are still expected to wait 15 minutes or more in the proposed plan. Reordering cannot remove waiting that comes from capacity lost to the disruption.`);
  if (baseStats.urgentWait > 0 || stats.urgentWait > 0) out.push(`Appointments with a protected slot keep their planned wait (${n(baseStats.urgentWait)} → ${n(stats.urgentWait)} minutes in total). Protected slots are externally assigned and are never inferred from clinical information.`);
  const bad = checks.filter((c) => c.violations);
  out.push(bad.length ? `Not approvable: ${bad.map((c) => c.label).join(', ')} failed.` : `All ${checks.length} constraint checks pass. The plan stays a proposal until a person approves it.`);
  return out;
}
