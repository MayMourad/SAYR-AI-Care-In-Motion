# Verified run: the single reproducible scenario behind slides 2 and 4 to 10

Captured on **2026-10-27** from the published application, <https://maymourad.github.io/SAYR-AI-Care-In-Motion/>, using `tools/presentation/capture.mjs` (Edge, 1600×1000 at 2× scale). All numbers on the slides come from this run or from the other panels of the same app, listed below.

## Conditions

| Setting | Value |
|---|---|
| Random seed | 7 (the app default) |
| Clinic | 60 synthetic patients (48 scheduled, 12 walk-in); 2 registration, 2 vital-sign, 3 consultation stations (clinician + room), 1 laboratory, 1 checkout; 08:00–16:00 |
| Scenario | Staff unavailability: Clinician B (consultation station GP-2) unavailable 10:30 to 13:30 |
| Dispatch policy (baseline) | First come, first served |
| Reflow plan captured at | 10:50 (the clock the app jumps to when the scenario is selected) |
| Reflow objective | "Fewest waiting minutes" (marked Recommended) |
| Approval | "Accept in the simulation" |

## Path (buttons)
1. Open the app, press **Pause** on the clock bar.
2. **Stress Controls** → radio **Staff unavailability**. The clock moves to 10:50.
3. **Ripple Trace** → **Play the ripple**.
4. **Control Room** → orange **Reflow** button (about 5 seconds) → **Reflow Studio**.
5. **Reflow Studio** → **Accept in the simulation**.
6. **Minutes Ledger**.

## Reproducibility check
The whole path was executed twice in separate browser sessions (`run-A.json`, `run-B.json`, produced by `capture.mjs`; compared with a text diff of the Control Room, Ripple Trace, Reflow, Action Desk, Ledger and seed-panel texts). **Every figure was identical.** The only difference was the optimizer's wall-clock time (5,365 ms vs 5,762 ms); both runs evaluated the same **36,850 plans**.

## Results

### Disruption (Stress Controls)
Total waiting 1,056 → 1,946 min (**+890**); median 17 → 28; 90th percentile 42 → 75; overtime 0 → 24; done by 16:00: 60 → 59; unresolved bottlenecks 0 → 2.

### Ripple Trace
37 patients delayed ≥ 3 min of 60; 890 waiting minutes caused; 26 hops to the last delay; +24 min overtime. By resource: GP-3 399, GP-1 362, GP-2 87, LAB-1 76, CHK-1 15 min. First links of the chain: outage → J-025 on GP-3 10:59 (+6) → J-011 GP-3 11:07 (+9) → J-028 GP-3 11:12 (+9) → J-029 GP-3 11:24 (+19) → J-032 GP-3 11:43 (+19); branch J-028 LAB-1 11:27 (+8, previous stage).

### Control Room at 11:45 (same seed, clock moved to 11:45)
Normal day: 5 waiting (consultation 4), longest wait 16 min, 28 departed, 9/9 resources. Staff scenario: 11 waiting (consultation 10), longest 40 min, 24 departed, 8/9 resources.

### Reflow (plan captured at 10:50)
Planned waiting 1,698 → **1,619 (−80)**; 168 appointments still to start, 43 expected to wait ≥ 15 min; **42 changes: 6 reassigned, 36 re-sequenced**; 15 wait less, 16 wait longer, none by more than 30 min; longest planned wait 59 → 54; protected-slot patients' planned wait 150 → 137; **9 of 9 constraints pass**. Alternatives: "Protect priority and the longest waits" −40 (33 changes); "Fewest changes" −11 (11 changes). Example move: J-036 on GP-3, 12:18 → 11:57 (−45 min wait).

### Minutes Ledger (approved plan replayed on realised durations)

| Metric | Baseline | Disrupted | Optimized | Δ (optimized − disrupted) |
|---|---|---|---|---|
| Total patient waiting (min) | 1,056 | 1,946 | **1,898** | **−48** (−2.5%) |
| Mean wait | 18 | 32 | 32 | −0.8 |
| Median wait | 17 | 28 | 29 | +1.3 |
| 90th-percentile wait | 42 | 75 | 71 | −3.6 |
| Throughput by 16:00 | 60 | 59 | 59 | ±0 |
| Incomplete at 16:00 | 0 | 1 | 1 | ±0 |
| Average journey duration | 60 | 74 | 74 | −0.8 |
| Delayed appointments (≥ 15 min, of 282) | 30 | 52 | 51 | −1 |
| Utilisation | 47% | 49% | 49% | ±0 |
| Staff overtime (min) | 0 | 24 | 22 | −1.5 |
| Rescheduled appointments | 0 | 0 | 42 | +42 |
| Unresolved bottlenecks | 0 | 2 | 2 | ±0 |
| Constraint violations | 0 | 0 | 0 | 0 |

Waterfall (each bar a separate replay; they add up exactly): 1,056 → **+890** disruption → −27 hold current plan fixed → ±0 re-sequenced CHK-1 → −5 GP-1 → −19 GP-3 → +3 other → **1,898**.

Fairness (mean · p90 minutes; baseline / disrupted / optimized): Scheduled (48) 17·41 / 32·74 / 31·62; Walk-in (12) 20·51 / 33·73 / 35·77; Morning (40) 20·41 / 33·76 / 33·80; Afternoon (20) 13·45 / 31·58 / 29·57. Protected-slot median 17 → 17; within 15 min 43% → 43%; priority inversions 48 → 46. Patients made worse off by ≥ 5 min: 10 longer, 7 shorter, 43 about the same (largest: J-054 +18, J-049 +16, J-045 walk-in +14, J-048 +14).

Policies on the same disrupted day (total · p90 · inversions): First come, first served 1,946 · 75 · 48; Priority with aging 1,973 · 67 · 23; Shortest task first (aged) 1,616 · 65 · 45.

### Evidence across seeds ("Run 8 seeds": same scenario, Reflow at **10:45**, recommended plan replayed)
| Seed | Normal | Disrupted | Optimized | Saved |
|---|---|---|---|---|
| 7 | 1,056 | 1,946 | 1,868 | −78 |
| 11 | 1,005 | 2,945 | 2,869 | −77 |
| 23 | 798 | 1,562 | 1,537 | −25 |
| 31 | 962 | 1,438 | 1,322 | −116 |
| 42 | 661 | 1,867 | 1,717 | −151 |
| 57 | 817 | 1,918 | 1,907 | −12 |
| 64 | 940 | 1,497 | 1,502 | **+5 (worse)** |
| 88 | 1,729 | 3,135 | 3,108 | −27 |

Improved on 7 of 8 days; worse on 1. Mean saving 59.8 min, median 51.5, range −5 to 151. Note that this panel plans at 10:45, so its seed-7 row (−78) differs from the 10:50 demonstration (−48); the deck labels both.

### Forecast (About, methods & credits)
Held-out error, patients per hour: seasonal hourly profile 2.16; 7-day moving average 2.36; same hour previous day 3.00. Forecast 57 vs 60 actual. Not machine learning.

## Honest caveats
- The planner projected −80 minutes; the measured saving is −48. Both are shown.
- The median rose by 1.3 minutes and walk-ins' and morning arrivals' 90th percentile worsened (73 → 77, 76 → 80) while the overall 90th percentile improved. The deck shows this on slides 9 and 10.
- One of the eight test days got worse (seed 64).
- Only the staff scenario was quantified; the surge, laboratory and room-closure scenarios are implemented but not reported.
- The lab share is configured at 30% (the app text says "about 35%" for the realised seed-7 population).
