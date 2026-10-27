# Live demonstration: 90 to 120 seconds

Open **https://maymourad.github.io/SAYR-AI-Care-In-Motion/** in a fresh browser tab. Everything runs in the browser; no sign-in, no network calls after the page loads.

## The verified run (what the numbers below come from)

| Item | Value |
|---|---|
| Scenario | Staff unavailability: Clinician B (consultation station GP-2) unavailable 10:30 to 13:30 |
| Seed | 7 (the default; shown in Stress Controls as "Random seed") |
| Clock | 10:50, set automatically when the scenario is selected |
| Policy and objective | Baseline dispatch policy: First come, first served (default). Reflow profile: "Fewest waiting minutes" (marked Recommended) |
| Reproducibility | The whole path was run twice on the published app; every figure was identical. See [VERIFIED-RUN.md](VERIFIED-RUN.md). |

Expected result: Total waiting 1,056 (normal) → 1,946 (disrupted) → **1,898 (optimized)**; measured change **−48 min (−2.5%)**; planner projection −80 min; 42 appointments changed (6 reassigned, 36 re-sequenced); 9 of 9 constraints pass; ten patients wait longer, seven less, forty-three about the same.

Do not assume another seed or scenario will improve. Some do not (seed 64 was 5 minutes worse).

## Roles
One person **drives** the laptop for the whole demo (suggested: Yosr). Each narrator speaks their part and says "next" to the driver. Speaking roles only; swap freely.

## Steps (about 115 seconds)

| Part | Narrator | Time | Screen | Driver does | Narrator says | Expected on screen |
|---|---|---|---|---|---|---|
| A | Lujain | 15 s | 02 Control Room | Press Pause on the clock bar (bottom left). Open 02 Control Room. | This is our fictional clinic on a normal day: nine resources, queues in front of the clock, and dashed blocks showing what today's plan projects next. | Normal operations. 9 of 9 resources available. Clock paused. |
| B | Yosr | 15 s | 05 Stress Controls | Open 05 Stress Controls. Click the radio "Staff unavailability" (02). | Now one clinician becomes unavailable from 10:30 for three hours. The simulation recalculates the whole day for the same patients and seed. | Clock jumps to 10:50. Impact panel: +890 min; total waiting 1,056 to 1,946; 90th percentile 42 to 75. |
| C | Precious | 20 s | 07 Ripple Trace | Open 07 Ripple Trace. Click "Play the ripple" and wait about ten seconds. | Ripple Trace replays the day with and without the outage. 37 patients delayed over 26 hops; every line is a link in the event log. | Tree grows from "Clinician B unavailable". Cards: 37 patients, 890 min, 26 hops, +24 min overtime. |
| D | Maryam | 25 s | 06 Reflow Studio | Open 02 Control Room and press the orange "Reflow" button (bottom right). Wait about 5 seconds, then drag the Before/After slider to the right. | Reflow searches for a feasible alternative. 42 appointments change, 6 move station, and all nine constraints pass. It projects 80 fewer planned minutes. Nothing is applied yet. | "Proposed adjustment": 1,698 to 1,619; "Fewest waiting minutes" marked Recommended (-80); Constraints preserved 9/9. |
| F | Shaden | 15 s | 08 Action Desk / 06 Reflow Studio | Open 08 Action Desk, point to the pending proposal and audit trail. Then go back to 06 Reflow Studio and click "Accept in the simulation". | A person must approve. The proposal waits here with its evidence, and approving writes an entry to the audit trail. | Status changes from pending to accepted; audit trail gains an entry. |
| E | Eleen | 25 s | 09 Minutes Ledger | Open 09 Minutes Ledger. Point to the waterfall, then the balance table, then the fairness table and "Patients made worse off". | The ledger replays the approved plan: minus 48 minutes, not the 80 projected. 90th percentile improves, median rises slightly, and ten patients wait longer. We report the cost as well as the gain. | "-48 min, -2.5%"; 1,946 to 1,898; "10 WAIT LONGER, 7 WAIT LESS, 43 ABOUT THE SAME". |

Order note: in the table, part F (human approval) comes before E (Ledger) because the Ledger only measures a plan after it has been approved. In the speech, introduce it as "a person must approve it, and then we measure".

## If it is slow or something breaks
- Short version (about 60 s): skip Ripple Trace. Do A, B quickly, then press Reflow, show the proposal, accept, and finish on the Ledger waterfall.
- If processing is slow (Reflow normally takes 5 to 6 seconds): keep talking about the nine constraints, then move on. If the page does not load at all, open the backup screenshots in order: 02-control-staff-1050, 05-stress-staff, 07-ripple-6hops, 06-reflow-before, 06-reflow-after, 08-desk-pending, 09-ledger.
- If a number differs from this guide, trust the app and say so: the Ledger recomputes everything. Use "Reset to demo state" in Stress Controls to return to the default.

## Backup screenshots
The folder [backup-screenshots](backup-screenshots) holds the same path, numbered in the order of the demo. Each image was captured from the published app on the verified run.

| File | Shows |
|---|---|
| 01-control-room-normal-1145.png | Control Room, normal day at 11:45 (5 waiting, longest 16 min) |
| 02-control-room-staff-1145.png | Same clock, one clinician out (11 waiting, longest 40 min) |
| 03-stress-controls-staff.png | Stress Controls, +890 minutes |
| 04-ripple-trace.png | Ripple Trace tree (6 hops shown) |
| 05-reflow-current-plan.png | Reflow Studio, slider at Before (1,698) |
| 06-reflow-proposed-plan.png | Reflow Studio, slider at After (1,619) |
| 07-action-desk-pending.png | Action Desk, proposal waiting for a person |
| 08-action-desk-approved.png | Audit trail after approval |
| 09-minutes-ledger.png | Ledger waterfall and balance (−48 min) |
