# Judge Q&A guide

Short, honest answers. If you do not know, say so and say how you would find out. Never claim more than the project shows.

**The one answer to get exactly right (question 4):** the current prototype uses a transparent forecasting baseline, a deterministic simulation engine and constraint-aware optimization. Its contribution is the integration of these methods into an interactive, explainable decision-support workflow. Training and validating more advanced predictive models would be a future research direction.

## 1. What makes SAYR AI innovative?
Most scheduling tools show what is happening. SAYR lets you simulate a disruption, trace how it spreads, generate a constrained alternative plan, have a person approve it, and then measure the consequences, including who is made worse off. The contribution is joining these steps into one explainable, interactive workflow on one shared simulation state.

## 2. Is this a real hospital management system?
No. It is a prototype that models a fictional outpatient clinic with synthetic, anonymous patients. It has never been connected to a hospital, never used real patient data, and it cannot change real operations. Its screens say so.

## 3. Where does artificial intelligence enter the project?
In three places, all transparent: a forecasting baseline for hourly arrivals, a constraint-aware local-search optimizer that proposes plans, and deterministic explanations generated from the event log. We call these decision-support methods. We do not call anything a trained model.

## 4. Does the platform use machine learning?
Honest answer: no trained machine-learning model has been implemented. The current prototype uses a transparent forecasting baseline, a deterministic simulation engine and constraint-aware optimization. Its contribution is the integration of these methods into an interactive, explainable decision-support workflow. Training and validating more advanced predictive models would be a future research direction.

## 5. How does the simulation work?
It is a deterministic discrete-event simulation. A queue of events ordered by time drives the day: arrival, queue, start of service, finish, release, transfer and outage. Each event updates patients and resources and is written to a log. A fixed seed generates the same patients, lateness and durations every time.

## 6. How are waiting times calculated?
Waiting is the time between a patient becoming ready for a stage and starting that stage. Transfers and service time are excluded. Total waiting is the sum across appointments; mean, median and 90th percentile are computed per patient from the same log. The 90th percentile describes the worst-off tenth of patients.

## 7. What happens when a staff member becomes unavailable?
In the staff scenario one clinician, and therefore one consultation station, is unavailable from 10:30 for three hours. The simulator marks the resource down, so nothing can start on it, and the queue behind it grows. In seed 7 the same patients wait 890 more minutes in total than on the normal day, and 37 are delayed by at least three minutes.

## 8. How does Reflow optimize appointments?
At the clock time it captures every appointment not yet started, then runs a constraint-aware local search with seeded perturbation: it moves appointments to other resources or positions, keeps only changes that remain feasible, and keeps the better plan. It runs with three objectives and shows up to three alternatives. It is a heuristic, not an exact solver, and it does not guarantee the best possible plan.

## 9. What constraints does it respect?
Nine checks, re-run by an independent validator: one appointment per resource at a time; journey order and transfers; right resource type and skill; not before the patient is ready or before now; nothing on an unavailable resource; protected-slot patients wait no longer; no patient waits more than 30 minutes longer; overtime not increased; appointments starting within 5 minutes keep their place. The 30-minute limit is our own design choice.

## 10. Does the system always improve waiting times?
No, and we show that. At 10:50 for seed 7 the planner projected 80 fewer minutes but the measured result was 48. Across eight synthetic days at 10:45, Reflow reduced waiting on seven and increased it by 5 minutes on one (seed 64). Mean saving was 59.8 minutes, median 51.5. If no feasible improvement exists, Reflow says so.

## 11. How do you know a result is not fabricated?
Every figure is computed by the simulation in the browser from the seed, and the app recomputes it on demand. We repeated the demonstration path twice and got identical numbers. The code, tests and method are in the public repository, and the Ledger waterfall is made of separate replays whose steps add up exactly to the difference.

## 12. How do you evaluate fairness?
We compare mean and 90th-percentile waits for scheduled versus walk-in patients and morning versus afternoon arrivals, count priority inversions, track protected-slot patients, and list patients made worse off by five minutes or more. In our run, walk-ins and morning arrivals did slightly worse at the 90th percentile even though the overall figure improved. Fairness on synthetic data does not establish fairness in a real clinic.

## 13. Why is human approval necessary?
Operational changes affect people, and accountability must stay with people. SAYR proposes and explains; a person approves or rejects, and the decision is logged. The system never infers clinical urgency. Protected slots are assigned externally.

## 14. How does SAYR differ from an ordinary scheduling dashboard?
A dashboard displays state. SAYR lets you intervene in a simulated day, see causal consequences with Ripple Trace, generate and constraint-check alternatives with Reflow, and compare baseline, disrupted and optimized runs on identical patients in the Ledger.

## 15. What would be required to implement it in Al Dhafra?
Collaboration with healthcare operations professionals; authorized access to real operational data under privacy and security governance; mapping real workflows, rooms, staff rules and breaks into the model; external validation of predictions; and supervised, approved pilot testing. None of that has been done, and we have not used any Al Dhafra performance data.

## 16. How would you validate it using real operational data?
Compare simulated queue lengths, waits and utilisation against observed timestamps for the same days and capacity, calibrate service-time distributions, then test whether recommended changes would have helped on held-out historical days. Only after that would a controlled, supervised prospective study make sense.

## 17. What are the main limitations?
All data are synthetic. A clinician is tied to a room. There are no breaks, equipment, multiple sites or clinical variation. The forecast history is generated from the simulator's own pattern, so it says little about real demand. Planned and measured savings differ. Improvements are not guaranteed, and simulated results do not show real-world effectiveness or better clinical outcomes.

---

## Numbers you may be asked for (verified run: seed 7, staff scenario, 10:50)

| Quantity | Value |
|---|---|
| Patients | 60 (48 scheduled, 12 walk-in) |
| Total waiting: normal / disrupted / optimized | 1,056 / 1,946 / 1,898 minutes |
| Measured change vs projected | −48 (−2.5%) vs −80 |
| 90th percentile: normal / disrupted / optimized | 42 / 75 / 71 minutes |
| Median: normal / disrupted / optimized | 17 / 28 / 29 minutes |
| Patients made worse off (≥ 5 min) | 10 (7 better, 43 about the same) |
| Walk-ins, 90th percentile | 73 → 77 minutes |
| Seeds where Reflow helped (10:45) | 7 of 8; mean 59.8 min, median 51.5; seed 64 +5 min worse |
| Forecast held-out error | seasonal 2.16, 7-day average 2.36, previous day 3.00 patients/hour |
