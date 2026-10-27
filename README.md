# SAYR AI — Care in Motion

**A simulation-driven healthcare operations intelligence prototype.** SAYR (سَيْر) means movement and progression. It models a fictional outpatient clinic, shows how a disruption spreads, proposes feasible schedule changes for a person to approve, and measures the simulated effect.

> **Synthetic demonstration.** Every patient is synthetic and anonymous. All results are computed from a simulation under stated assumptions. They do not show real-world effectiveness, and SAYR is not a diagnostic, triage or clinical decision tool.

- **Competition:** Al Dhafra Health Forum · Developing Healthcare Services (تطوير خدمات الرعاية الصحية بشكل عام)
- **School:** ADNOC Schools — Madinat Zayed (ADNOC School – Madinat Zayed)
- **Team:** Lujain Ahmed Mourad (8D) · Yosr Amgad (8D) · Precious Fuentes (8D) · Maryam Ammara Jelita (8D) · Eleen Amr (8D) · Shaden Ahmed Mourad (6D)
- **Languages:** English and Arabic (right-to-left)

*Every minute matters. Every decision moves the system.*

## Status at a glance

| Capability | Status |
| --- | --- |
| Deterministic discrete-event clinic simulation, 5 scenarios, audit of every timestamp | **Implemented** |
| Reflow: constraint-aware local-search optimizer, 3 objective profiles, human approval | **Implemented** (a heuristic, not an exact solver, not machine learning) |
| Ripple Trace from event-log cause pointers and a with/without replay | **Implemented** |
| Minutes Ledger with a measured waterfall, fairness groups, multi-seed evidence | **Implemented** |
| Demand forecasting | **Implemented** as evaluated baselines on **simulated** history |
| Operational explanations | **Implemented**, deterministic text from real state changes (no language model) |
| English / Arabic with RTL | **Implemented** for navigation, metric labels, scenarios, actions, approval states and responsible-AI text; long explanatory paragraphs stay English |
| Real hospital data, scheduling-system integration, clinical validation | **Future** — none exists |

## 1. The problem

A patient moves through arrival, registration, vital signs, consultation, laboratory testing when needed, a short follow-up consultation, and checkout. A delay at one stage reaches the others: a clinician’s absence grows the consultation queue, a slow laboratory delays follow-ups, a walk-in wave overloads registration, a closed room removes capacity. A dashboard can show that waiting has risen. SAYR is built to show **why**, **how it propagated**, and **what feasible adjustments exist**, before a patient is affected.

## 2. Research question

> Can simulation-driven, constraint-aware resource optimization improve **modelled** patient-flow efficiency while protecting operational fairness and preserving human oversight?

SAYR does not claim to have reduced real waiting times anywhere.

## 3. What you can do

1. **The System in Motion** — introduction, route map driven by live simulation state.
2. **Control Room** — clock, patients in system, waiting, available resources, active bottleneck, average wait, throughput, scenario, event timeline, demand forecast, and the **Flow Canvas**.
3. **Journey Lines** — every patient’s stages, queue time vs service time vs transfer time.
4. **Resource Board** — drag appointments between stations; every drop is validated and infeasible ones are refused with the reason. Capacity view with clinician/room availability and reasons.
5. **Stress Controls** — the five scenarios plus custom parameters.
6. **Reflow Studio** — capture the plan, search, watch appointment blocks move to their proposed positions, see constraints preserved, approve or reject.
7. **Ripple Trace** — a dependency tree of delays, built from the log.
8. **Action Desk** — proposals with feasibility evidence, explanation, approval controls, audit trail, restore baseline.
9. **Minutes Ledger** — Baseline / Disrupted / Optimized, waterfall, fairness, patients made worse off, distribution, methodology, multi-seed evidence.
10. **My Journey** — the same simulation state for one anonymous patient, with ranges and the effect of an approved change.

One shared state feeds every screen. Approving a proposal in Reflow Studio changes the active schedule everywhere: Control Room, Flow Canvas, Resource Board, Journey Lines, Ripple Trace, Ledger and My Journey.

## 4. Architecture

```
src/engine/
  scenario.ts   synthetic population + scenario definitions (seeded)
  sim.ts        discrete-event simulator (clonable state, event log with cause pointers)
  plan.ts       planning problem, decoder, nine independent constraint checks
  optimizer.ts  Reflow: constraint-aware local search, generator-based progress
  ripple.ts     disruption replay + causal tree from the log
  metrics.ts    every Ledger figure, plus an independent audit of the realised schedule
  ledger.ts     waterfall decomposition, policy comparison
  forecast.ts   demand forecasting (evaluated baselines)
  explain.ts    deterministic explanations
  journey.ts    patient-facing Monte-Carlo ranges
  seeds.ts      multi-seed evidence
src/state.tsx   one shared application state (React context)
src/ui/…        Flow Canvas (SVG), shared components, About / transparency
src/screens/…   the ten screens
```

TypeScript, React 18, Vite. No backend, no paid API, no third-party design service, no web fonts. SVG for every operational visual.

### Data model (TypeScript)

`PatientDef`, `ResourceDef`, `JobDef` (a service stage), `Scenario`/`ScenarioParams`, `Disruption`, `SimState`/`LogEvent` (simulation and queue events), `Plan`/`PlanItem` (schedule assignment and resource allocation), `Proposal` (optimization proposal with approval status), `CheckResult`, `Metrics`, `DecisionLog` (audit-log entry). Every record has a stable id; simulation times are minutes after 08:00. Scenario results serialise to JSON (`structuredClone`-safe).

## 5. Simulation

A deterministic event queue processes arrival, queue entry, resource allocation, service start and completion, release, transfer to the next stage, outages and no-shows in chronological order. A seeded generator (mulberry32) produces arrivals, lateness, no-shows, booked lengths and realised lengths. Same dataset, constraints, seed and scenario give the same log. The simulator separates **waiting time** from **service time** and **transfer time**.

Guarantees, audited independently from the finished log: no resource serves two patients at once; no service starts before its patient is ready or before its prerequisite plus transfer; no service starts on an unavailable resource; skills/types match; timestamps are chronological. The simulation runs to completion, and journeys unfinished at 16:00 are counted as incomplete.

## 6. Optimization (Reflow)

**What it is:** a constraint-aware local search. A plan is a set of ordered queues per station; a decoder turns it into start times as early as precedence, readiness and availability allow. The search relocates appointments across stations and positions, keeps only moves that stay feasible, and escapes local optima with seeded perturbations. It runs three objective profiles — *fewest waiting minutes*, *protect protected slots and the longest waits*, *fewest changes* — and recommends the feasible one with the best saving net of the number of moves.

**Objective terms:** weighted waiting minutes, longest individual wait, overtime, and (third profile) appointment displacement.

**Hard constraints (nine, re-checked by an independent validator):** resource exclusivity · journey order and transfers · skill/type compatibility · not before ready or before now · outages respected · protected slots not worsened · individual harm bounded · overtime not increased · committed starts (inside 5 minutes) kept.

**Honest notes:** the *bounded individual harm* limit (no one waits more than 30 minutes longer than planned) is a soft fairness choice of ours, not a law of the problem; raising it can save more minutes. Protected slots are an externally assigned, non-clinical demonstration input; SAYR never infers clinical urgency. Planning uses booked lengths; the replay uses realised lengths, so planned and measured savings differ and both are shown. If no feasible change helps, the app says so.

**Human approval:** a proposal never becomes the active schedule on its own. The user approves, rejects, compares alternatives or restores the baseline. Rejection leaves the active schedule untouched. Execution follows the plan’s order and reserves a station only for genuine reassignments; a reserved job is released if it runs 10 minutes behind its planned start.

## 7. Forecasting (layer 1)

Target: arrivals per hour (08:00–15:00). Data: 20 days of **simulated** history (weekday pattern plus noise around the simulator’s own hourly profile). Method: three baselines — same hour yesterday, 7-day moving average, seasonal hourly profile — fitted on days 1–14 and scored on days 15–20 by mean absolute error; the best is used to forecast today and compared with today’s actual arrivals. It is **not** a machine-learning model, and a good score on self-generated data says little about real demand. Limitations are listed in the app (About, methods & credits).

## 8. Dataset assumptions (development assumptions, not regional statistics)

Fictional outpatient clinic, 08:00–16:00. 60 patients (48 scheduled, 12 walk-in), 2 registration, 2 vital-sign stations, 3 consultation stations (each a clinician plus a room), 1 laboratory, 1 checkout; about 30% of patients need the laboratory (the seed-7 draw is 35%), and they get a short follow-up consultation. Mean service times: registration 4, vitals 6, consultation 15, laboratory 14, follow-up 7, checkout 3.5 minutes, each varying by patient; realised durations deviate by σ = 0.25. 18% of scheduled patients arrive 5–25 minutes late; 4% do not attend. All values are adjustable in Stress Controls.

*Simplification:* a consultation station is a fixed clinician–room pair. Losing either one removes the station, so capacity effects match the real case, but a clinician cannot move to a free room.

## 9. Scenarios

| # | Scenario | Definition |
| --- | --- | --- |
| 1 | Normal operations | Routine activity; the baseline for every comparison |
| 2 | Staff unavailability | At 10:30 one clinician is unavailable for three hours |
| 3 | Walk-in surge | Around 11:00, eight extra walk-in patients arrive |
| 4 | Laboratory bottleneck | From 12:00 laboratory durations +50% |
| 5 | Room closure | At 13:00 one room closes until the end of the shift |

The base patients come from one random stream and surge patients from another, so every scenario for a given seed shares the same patients, arrival times and durations. A scenario’s only difference from baseline is the disruption. The planner learns of an outage or slowdown only when it begins.

## 10. Metric formulas

- Waiting of an appointment = start − ready (ready = arrival, or previous stage end + transfer). Patient wait = sum over their appointments. **Total waiting** = sum over patients who attended and completed.
- **Mean / median / p90** of patient wait (p90 by linear interpolation).
- **Throughput** = journeys whose last service ends by 16:00. **Incomplete at 16:00** = attended patients not finished by then. **Average journey duration** = departure − arrival.
- **Utilisation** of a resource = busy minutes inside the shift ÷ (480 − minutes it was unavailable). **Overtime** of a resource = max(0, last service end − 16:00); total is the sum.
- **Delayed appointments** = appointments that waited 15 minutes or more (denominator: all appointments). **Rescheduled** = appointments whose station or order the approved plan changed.
- **Unresolved bottleneck** = a service queue at or above its limit for 40 minutes or more.
- **Fairness:** mean and p90 wait for scheduled vs walk-in and for morning (before 12:00) vs afternoon arrivals; protected-slot median wait and share within 15 minutes; priority inversions (a less urgent patient started while a more urgent one that could use the resource was waiting); Gini of waits; patients made worse off (≥ 5 minutes longer, matched patient by patient).
- **Waterfall:** each bar is a replay of the day applying the plan one operational change at a time, so the bars sum exactly to the measured difference. The first bar after “Disruption” is the effect of following a fixed plan rather than dispatching live.

## 11. Testing

`npm test` runs 24 automated tests (Vitest), covering: the documented clinic configuration; identical base patients across scenarios; determinism; no double-booking, no start before arrival or prerequisite, closures and skills respected, in all five scenarios; metric totals equal to the sum over the event log; every disruption produces a meaningful change against the same patients; laboratory slowdown applies only to laboratory services starting after it begins; decoding the forecast reproduces it; the validator rejects an overlap; every candidate plan preserves all hard constraints; approving changes the active schedule while earlier history is untouched, and rejecting or restoring leaves the baseline unchanged; the waterfall telescopes to the measured difference; every Ripple link points to an earlier real event; forecast determinism and model selection; and multi-seed evaluation.

**Evidence beyond one run:** *Minutes Ledger → Evidence across seeds* repeats the selected scenario on eight other synthetic days and reports improved/worse counts, mean, median and range. A single run is a demonstration; this shows the spread, including days where Reflow finds nothing.

## 12. Limitations

- Everything is synthetic; no real data was analysed, and results hold only under these assumptions.
- Reflow is a heuristic; it can find small or no improvement. In the default staff-absence run, planning projected −80 minutes and the replay measured −48 (−2.5%). A different live policy (shortest task first, aged) needs fewer minutes but starts less urgent patients first more often; the Ledger shows that trade-off.
- Planned and measured savings differ because booked lengths differ from realised ones.
- No breaks, equipment, referrals, multi-site effects, or clinician–room flexibility.
- Arabic covers the required categories; long explanatory text, generated explanations and chart annotations remain English.
- Fairness checks on synthetic data do not establish fairness in a real deployment.

## 13. Responsible AI

Synthetic, anonymous data only. SAYR supports operational decisions and never diagnoses, triages or infers clinical urgency; protected slots are externally assigned inputs. Every change is a proposal that waits for a person. Methods, inputs, assumptions and limitations of each algorithm are shown in the app. Fewer waiting minutes is not a clinical-benefit claim. Real use would need validation with healthcare operations specialists, authorised data, privacy and security review.

## 14. Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build at http://localhost:4173
```

## 15. Deploy to GitHub Pages

The app uses a hash-based screen address (`#/ledger`) and relative asset paths (`base: './'`), so it works from any project path with no server rewrites.

1. Push this repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. The included workflow `.github/workflows/pages.yml` installs, tests, builds and publishes `dist/` on every push to `main`.

Or build locally and publish the `dist/` folder with any static host.

## 16. Recommended three-minute demo route

1. **The clinic is moving (0:00–0:35).** *System in Motion* → *Enter Control Room*. Show the Flow Canvas, queues, utilisation, the forecast. Normal operations.
2. **Disrupt it (0:35–1:15).** *Stress Controls* → **Staff unavailability**. Back in *Control Room*: the lane is hatched, the consultation queue grows. Open *Ripple Trace* → **Play the ripple**: the cascade, hop by hop.
3. **Reflow (1:15–2:00).** Press **Reflow**. Watch the staged progress, then the blocks move. Scrub Before ↔ After; read “Constraints preserved” and “Why this proposal”. Try a refused drag on the *Resource Board* (drop a consultation onto a registration desk).
4. **Measure (2:00–2:35).** *Minutes Ledger*: Baseline vs Disrupted vs Optimized, the waterfall, who is worse off, fairness groups. Say plainly what the saving is and is not.
5. **Approve (2:35–3:00).** *Action Desk*: review trade-offs, **Approve**. Show *My Journey* updating for the same patient. **Reset to demo state** returns to the start.

For a presentation backup, `npm run preview` then `node tools/shots.mjs` re-captures every screen into `docs/screenshots/`; `docs/SAYR-case-study.pptx` is the slide deck built from those captures (`node tools/deck.mjs`).

## 17. Future roadmap (not implemented)

Collaboration with healthcare operations specialists · real operational data with proper authorisation · privacy-preserving data preparation · forecast calibration · multi-clinic resource planning · prospective operational evaluation · integration with existing scheduling systems · security and regulatory review before any deployment.

## 18. Design references and attribution

See [`DESIGN_REFERENCES.md`](./DESIGN_REFERENCES.md) and the in-app *About, methods & credits* panel. Ten Spline and Recent.design references were studied for principles only; nothing is reused. The two Spline community files are CC BY 4.0 and are credited. No Spline or Hana embed is shipped.
