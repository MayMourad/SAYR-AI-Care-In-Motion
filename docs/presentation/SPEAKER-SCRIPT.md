# SAYR AI: Care in Motion. Speaker script

Al Dhafra Health Forum · Developing Healthcare Services · ADNOC Schools, Madinat Zayed

Target: **6 to 7 minutes**, excluding the live demonstration (see [LIVE-DEMO.md](LIVE-DEMO.md)). The word counts below are timed at 145 words per minute; the full script is **6:55** (999 words).

These are **speaking assignments only**. They say who reads each slide; they do not describe who built what. Swap sections freely. Each person has about one minute.

| Speaker | Slides | Approx. time |
|---|---|---|
| Lujain (8D) | 1, 2 | 1:01 |
| Yosr (8D) | 3, 4 | 1:09 |
| Precious (8D) | 5, 6 | 1:16 |
| Maryam (8D) | 7, 8 | 1:12 |
| Eleen (8D) | 9, 10 | 1:09 |
| Shaden (6D) | 11, 12 | 1:08 |

Team: Lujain Ahmed Mourad (8D), Yosr Amgad (8D), Precious Fuentes (8D), Maryam Ammara Jelita (8D), Eleen Amr (8D), Shaden Ahmed Mourad (6D).

## Delivery tips
- Say "simulation" and "synthetic" out loud early. The judges should never wonder whether this is real patient data.
- Do not read the slide. Point at the picture while you say the sentence.
- If a judge interrupts with a question, answer from [JUDGE-QA.md](JUDGE-QA.md) and return to your slide.
- Transitions are written into the last sentence of each section.

---

## Slide 1 · SAYR AI: Care in Motion
**Lujain** · about 27 s

Every minute matters. Every decision moves the system. We are the SAYR AI team from ADNOC School in Madinat Zayed, and this is Care in Motion, our entry for Developing Healthcare Services. "Sayr" is an Arabic word for movement and progression. We looked at a clinic in a different way: not one patient at a time, but the whole clinic moving together as one connected system.

*Vocabulary:* Decision-support: a tool that helps a person decide. It does not decide for them.

## Slide 2 · When one delay becomes everyone's delay
**Lujain** · about 34 s

Picture a clinic visit: register, vital signs, see the clinician, maybe a lab test, then check out. Now one clinician becomes unavailable. It sounds small. But everyone waiting for that clinician waits longer, and the lab and checkout feel it later. In our simulated clinic, one clinician missing for three hours added 890 waiting minutes across 37 patients. That is a simulation of a fictional clinic, not data from any real hospital. The lesson is simple: healthcare delays are rarely isolated.

*Vocabulary:* Simulation: a computer model that plays out a day many times, so we can test ideas without touching real patients.

## Slide 3 · Our research question
**Yosr** · about 33 s

So we asked: what if we could test operational decisions before they affect real patients? SAYR is a simulation-driven decision-support prototype. The workflow has seven steps: model a clinic, simulate its day, introduce a disruption, trace the consequences, optimize a plan, let a person review and approve it, and measure the result. We want to be clear about the methods. It uses a simulation, a simple forecasting baseline and a search-based optimizer. It does not use a trained machine-learning model.

*Vocabulary:* Optimizer: a program that searches for a better plan under rules. Here it is a heuristic search, not a guarantee of the best plan.

## Slide 4 · A digital twin of the clinic
**Yosr** · about 36 s

This is our Control Room. It is a digital twin of a fictional clinic: sixty synthetic patients, forty-eight with appointments and twelve walk-ins, nine resources, and a day from eight to four. The engine is a discrete-event simulation. In plain words, it jumps from event to event: someone arrives, waits, starts, finishes, moves on. It records every event in a log. Because we fix a random seed, the same seed always creates the same day, so any difference we see is caused by what we changed.

*Vocabulary:* Seed: a starting number for the random generator. Same seed, same synthetic day.

## Slide 5 · The disruption experiment
**Precious** · about 36 s

In Stress Controls we bend the day. There are four scenarios: a clinician becomes unavailable, a walk-in surge, a slow laboratory, or a closed consultation room. Our main experiment is staff unavailability: one clinician is out from 10:30 for three hours. The simulator recalculates the whole day for the same patients and the same seed. Total waiting rises from 1,056 minutes to 1,946, and the 90th-percentile wait rises from 42 to 75 minutes. We can study pressure on the system without experimenting on a single real patient.

*Vocabulary:* 90th percentile: the wait that nine out of ten patients stay under. It describes the worst-off tenth.

## Slide 6 · Ripple Trace: following the consequences
**Precious** · about 40 s

Ripple Trace explains how a delay spreads. We replay the same day twice, with and without the outage, and compare. Each box is an appointment that started later, and each line is a link the event log records: either the resource it waited for, or the stage before it. Here it traced 37 delayed patients over 26 hops, costing 890 extra minutes. For example, a patient waiting for station three at 10:59 delays the next one at 11:07, then 11:12, then 11:24. We are not only saying where a delay is. We show how it spreads.

*Vocabulary:* Hop: one step along a chain of "this waited for that".

## Slide 7 · Reflow Studio: from disruption to decision
**Maryam** · about 40 s

This is the heart of the project. Reflow looks at the plan at 10:50, finds the appointments that have not started, and searches for a better arrangement that respects nine constraints, such as no overlaps, nobody placed on an unavailable clinician, and nobody waiting more than thirty extra minutes. It uses a constraint-aware local search, so we do not claim a perfect answer. On the left is the current plan, on the right the proposal. Forty-two appointments change, six move to a different station, and the plan projects eighty fewer waiting minutes. Nothing is applied yet.

*Vocabulary:* Constraint: a rule a plan must never break. Local search: try small changes, keep the ones that help and stay legal.

## Slide 8 · The human remains in control
**Maryam** · about 32 s

Every proposal waits in the Action Desk. A person sees the changes, the nine constraint checks, and the trade-offs: here fifteen patients would wait less, sixteen would wait longer, and nobody by more than thirty minutes. They can approve or reject, and the decision is written to an audit trail. SAYR never decides clinical priorities. Protected slots are assigned from outside the system and are never inferred from medical information. Intelligent recommendations should support accountability, not replace it.

*Vocabulary:* Audit trail: a permanent record of what was proposed and who decided what.

## Slide 9 · Minutes Ledger: measured, not assumed
**Eleen** · about 33 s

After approval, the Minutes Ledger measures what really happened when the plan is replayed on the realised durations. Under seed 7, the staff scenario, and first-come-first-served as the baseline, the planner projected eighty fewer minutes, but the measured change is forty-eight: 1,946 down to 1,898, about two and a half percent. The 90th-percentile wait fell by 3.6 minutes, the median rose by 1.3, and no constraint was violated. This is an operational measure only, not evidence of better care.

*Vocabulary:* Realised duration: how long a visit actually took in the simulated day, which can differ from the booked length.

## Slide 10 · Efficiency without overlooking fairness
**Eleen** · about 36 s

A better average does not mean a fairer system. In the same run, ten patients wait at least five minutes longer, seven wait less, and forty-three stay about the same. Walk-in patients got slightly worse: their 90th-percentile wait went from 73 to 77 minutes. Policies also trade off: shortest-first needs fewer total minutes but starts less urgent patients first more often. Across eight synthetic days, Reflow helped on seven and made one day slightly worse. Fairness on synthetic data does not establish fairness in a real clinic.

*Vocabulary:* Priority inversion: a less urgent patient is started before a more urgent one.

## Slide 11 · From simulation to real healthcare research
**Shaden** · about 40 s

Where do we go next? Phase one is today: synthetic journeys, simulation, optimization and evaluation. Phase two is working with healthcare operations professionals to check our assumptions. Phase three is investigating authorized real data, with privacy and data quality first. Phase four is external validation against observed service patterns. Phase five is supervised testing with security review and approvals before any real use. Al Dhafra is a wide region, so coordinating services across places is an interesting question, but we have not used any regional performance data. The next step is validation, not deployment by assumption.

*Vocabulary:* Validation: checking, with real evidence, that a model's results match reality.

## Slide 12 · Closing: Care in Motion
**Shaden, then all** · about 28 s

Healthcare does not operate one appointment at a time. It operates as an interconnected system, and every minute matters. Ripple Trace explains the problem. Reflow investigates the solution. Minutes Ledger measures the consequences. And a person stays in control. Behind every healthcare schedule is a patient waiting for care. Thank you. You can scan the code to try SAYR yourself. [All together:] SAYR AI. Care in Motion.

---

## Appendix slides (only if asked)

### Appendix A: how the simulation works
Use only if asked. The simulation keeps a queue of future events ordered by time. It takes the next event, updates the state of patients and resources, writes it to the log, and schedules what follows. Waiting is measured from "ready" to "start of service"; transfers and service time are excluded. The seed makes it reproducible: we ran the whole demonstration path twice and got identical figures.

### Appendix B: how Reflow works
Use only if asked. Reflow captures every appointment not yet started, then does a local search over which resource and in which order. Candidates are checked by an independent validator against nine rules. It runs three times with different objectives and shows up to three alternatives. It can find no improvement, and in one of our eight test days it did worse than doing nothing.

### Appendix C: evaluation and limitations
Use only if asked. Waiting minutes, mean, median and 90th percentile are computed from the event log. Utilisation is busy time divided by available time within the shift. The forecast is a seasonal hourly baseline chosen from three simple methods using six held-out synthetic days; it is not machine learning, and because the history is synthetic it says little about real demand. Everything here is simulated under stated assumptions.

---

## Condensed version (about 3 minutes)

For a short slot. Show slides 1, 2, 3, 4, 6, 7, 9, 10, 12 and skip the rest, or keep all slides on screen and speak only these paragraphs.

**Lujain** (slides 1-2, about 30 s)

Every minute matters. Every decision moves the system. We are the SAYR AI team from ADNOC School in Madinat Zayed. When one clinician is unavailable, everyone behind that clinician waits, and the lab and checkout feel it later. In our simulated clinic, one clinician missing for three hours added 890 waiting minutes across 37 patients. This is a simulation of a fictional clinic, not real hospital data. Healthcare delays are rarely isolated.

**Yosr** (slides 3-4, about 33 s)

So we asked: what if we could test operational decisions before they affect real patients? SAYR is a simulation-driven decision-support prototype. It models a fictional clinic with sixty synthetic patients, introduces a disruption, traces its consequences, proposes a plan, lets a person approve it, and measures the result. It uses a simulation, a forecasting baseline and a search-based optimizer, not a trained machine-learning model. A fixed seed gives the same day every time, so differences come from what we change.

**Precious** (slides 5-6, about 23 s)

In Stress Controls we bend the day. With one clinician out, total waiting rises from 1,056 minutes to 1,946. Ripple Trace then follows the delay: 37 patients, 26 hops and 890 minutes, and every link is taken from the event log. We do not only say where the delay is. We show how it spreads.

**Maryam** (slides 7-8, about 22 s)

Reflow searches for a feasible alternative plan at 10:50. It changes 42 appointments under nine constraints and projects 80 fewer waiting minutes. It is a heuristic search, so it does not guarantee the best plan, and nothing is applied until a person approves it in the Action Desk. SAYR never decides clinical priorities.

**Eleen** (slides 9-10, about 27 s)

The Minutes Ledger measures the real result: 48 fewer minutes, 1,946 down to 1,898, about two and a half percent, less than the 80 projected. The 90th percentile improved, but ten patients wait longer, and walk-ins got slightly worse. Across eight synthetic days it helped on seven and hurt on one. We report all of it, because a better average does not mean a fairer system.

**Shaden** (slides 11-12, about 18 s)

Where next? Working with healthcare operations professionals, authorized data, external validation and supervised testing. The next step is validation, not deployment by assumption. Healthcare operates as an interconnected system, and behind every schedule is a patient waiting for care. SAYR AI. Care in Motion.

Total condensed length: about 2:33.
