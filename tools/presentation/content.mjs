// Single source of truth for the presentation's words: slide speaker notes, the 6-7 minute script,
// the condensed script, the live demo, the judge Q&A and the sources. deck.mjs and docs.mjs both read this file.
// Every number below comes from the verified run recorded in docs/presentation/VERIFIED-RUN.md.

export const URL_APP = 'https://maymourad.github.io/SAYR-AI-Care-In-Motion/';

export const TEAM = [
  ['Lujain Ahmed Mourad', '8D'],
  ['Yosr Amgad', '8D'],
  ['Precious Fuentes', '8D'],
  ['Maryam Ammara Jelita', '8D'],
  ['Eleen Amr', '8D'],
  ['Shaden Ahmed Mourad', '6D'],
];

// ---------- Full script (target 6-7 minutes, excluding the live demo) ----------
export const SCRIPT = [
  {
    n: 1, speaker: 'Lujain', title: 'SAYR AI: Care in Motion',
    text: `Every minute matters. Every decision moves the system. We are the SAYR AI team from ADNOC School in Madinat Zayed, and this is Care in Motion, our entry for Developing Healthcare Services. "Sayr" is an Arabic word for movement and progression. We looked at a clinic in a different way: not one patient at a time, but the whole clinic moving together as one connected system.`,
    vocab: 'Decision-support: a tool that helps a person decide. It does not decide for them.',
  },
  {
    n: 2, speaker: 'Lujain', title: 'When one delay becomes everyone\'s delay',
    text: `Picture a clinic visit: register, vital signs, see the clinician, maybe a lab test, then check out. Now one clinician becomes unavailable. It sounds small. But everyone waiting for that clinician waits longer, and the lab and checkout feel it later. In our simulated clinic, one clinician missing for three hours added 890 waiting minutes across 37 patients. That is a simulation of a fictional clinic, not data from any real hospital. The lesson is simple: healthcare delays are rarely isolated.`,
    vocab: 'Simulation: a computer model that plays out a day many times, so we can test ideas without touching real patients.',
  },
  {
    n: 3, speaker: 'Yosr', title: 'Our research question',
    text: `So we asked: what if we could test operational decisions before they affect real patients? SAYR is a simulation-driven decision-support prototype. The workflow has seven steps: model a clinic, simulate its day, introduce a disruption, trace the consequences, optimize a plan, let a person review and approve it, and measure the result. We want to be clear about the methods. It uses a simulation, a simple forecasting baseline and a search-based optimizer. It does not use a trained machine-learning model.`,
    vocab: 'Optimizer: a program that searches for a better plan under rules. Here it is a heuristic search, not a guarantee of the best plan.',
  },
  {
    n: 4, speaker: 'Yosr', title: 'A digital twin of the clinic',
    text: `This is our Control Room. It is a digital twin of a fictional clinic: sixty synthetic patients, forty-eight with appointments and twelve walk-ins, nine resources, and a day from eight to four. The engine is a discrete-event simulation. In plain words, it jumps from event to event: someone arrives, waits, starts, finishes, moves on. It records every event in a log. Because we fix a random seed, the same seed always creates the same day, so any difference we see is caused by what we changed.`,
    vocab: 'Seed: a starting number for the random generator. Same seed, same synthetic day.',
  },
  {
    n: 5, speaker: 'Precious', title: 'The disruption experiment',
    text: `In Stress Controls we bend the day. There are four scenarios: a clinician becomes unavailable, a walk-in surge, a slow laboratory, or a closed consultation room. Our main experiment is staff unavailability: one clinician is out from 10:30 for three hours. The simulator recalculates the whole day for the same patients and the same seed. Total waiting rises from 1,056 minutes to 1,946, and the 90th-percentile wait rises from 42 to 75 minutes. We can study pressure on the system without experimenting on a single real patient.`,
    vocab: '90th percentile: the wait that nine out of ten patients stay under. It describes the worst-off tenth.',
  },
  {
    n: 6, speaker: 'Precious', title: 'Ripple Trace: following the consequences',
    text: `Ripple Trace explains how a delay spreads. We replay the same day twice, with and without the outage, and compare. Each box is an appointment that started later, and each line is a link the event log records: either the resource it waited for, or the stage before it. Here it traced 37 delayed patients over 26 hops, costing 890 extra minutes. For example, a patient waiting for station three at 10:59 delays the next one at 11:07, then 11:12, then 11:24. We are not only saying where a delay is. We show how it spreads.`,
    vocab: 'Hop: one step along a chain of "this waited for that".',
  },
  {
    n: 7, speaker: 'Maryam', title: 'Reflow Studio: from disruption to decision',
    text: `This is the heart of the project. Reflow looks at the plan at 10:50, finds the appointments that have not started, and searches for a better arrangement that respects nine constraints, such as no overlaps, nobody placed on an unavailable clinician, and nobody waiting more than thirty extra minutes. It uses a constraint-aware local search, so we do not claim a perfect answer. On the left is the current plan, on the right the proposal. Forty-two appointments change, six move to a different station, and the plan projects eighty fewer waiting minutes. Nothing is applied yet.`,
    vocab: 'Constraint: a rule a plan must never break. Local search: try small changes, keep the ones that help and stay legal.',
  },
  {
    n: 8, speaker: 'Maryam', title: 'The human remains in control',
    text: `Every proposal waits in the Action Desk. A person sees the changes, the nine constraint checks, and the trade-offs: here fifteen patients would wait less, sixteen would wait longer, and nobody by more than thirty minutes. They can approve or reject, and the decision is written to an audit trail. SAYR never decides clinical priorities. Protected slots are assigned from outside the system and are never inferred from medical information. Intelligent recommendations should support accountability, not replace it.`,
    vocab: 'Audit trail: a permanent record of what was proposed and who decided what.',
  },
  {
    n: 9, speaker: 'Eleen', title: 'Minutes Ledger: measured, not assumed',
    text: `After approval, the Minutes Ledger measures what really happened when the plan is replayed on the realised durations. Under seed 7, the staff scenario, and first-come-first-served as the baseline, the planner projected eighty fewer minutes, but the measured change is forty-eight: 1,946 down to 1,898, about two and a half percent. The 90th-percentile wait fell by 3.6 minutes, the median rose by 1.3, and no constraint was violated. This is an operational measure only, not evidence of better care.`,
    vocab: 'Realised duration: how long a visit actually took in the simulated day, which can differ from the booked length.',
  },
  {
    n: 10, speaker: 'Eleen', title: 'Efficiency without overlooking fairness',
    text: `A better average does not mean a fairer system. In the same run, ten patients wait at least five minutes longer, seven wait less, and forty-three stay about the same. Walk-in patients got slightly worse: their 90th-percentile wait went from 73 to 77 minutes. Policies also trade off: shortest-first needs fewer total minutes but starts less urgent patients first more often. Across eight synthetic days, Reflow helped on seven and made one day slightly worse. Fairness on synthetic data does not establish fairness in a real clinic.`,
    vocab: 'Priority inversion: a less urgent patient is started before a more urgent one.',
  },
  {
    n: 11, speaker: 'Shaden', title: 'From simulation to real healthcare research',
    text: `Where do we go next? Phase one is today: synthetic journeys, simulation, optimization and evaluation. Phase two is working with healthcare operations professionals to check our assumptions. Phase three is investigating authorized real data, with privacy and data quality first. Phase four is external validation against observed service patterns. Phase five is supervised testing with security review and approvals before any real use. Al Dhafra is a wide region, so coordinating services across places is an interesting question, but we have not used any regional performance data. The next step is validation, not deployment by assumption.`,
    vocab: 'Validation: checking, with real evidence, that a model\'s results match reality.',
  },
  {
    n: 12, speaker: 'Shaden, then all', title: 'Closing: Care in Motion',
    text: `Healthcare does not operate one appointment at a time. It operates as an interconnected system, and every minute matters. Ripple Trace explains the problem. Reflow investigates the solution. Minutes Ledger measures the consequences. And a person stays in control. Behind every healthcare schedule is a patient waiting for care. Thank you. You can scan the code to try SAYR yourself. [All together:] SAYR AI. Care in Motion.`,
    vocab: '',
  },
  {
    n: 13, speaker: 'Appendix', title: 'Appendix A: how the simulation works',
    text: `Use only if asked. The simulation keeps a queue of future events ordered by time. It takes the next event, updates the state of patients and resources, writes it to the log, and schedules what follows. Waiting is measured from "ready" to "start of service"; transfers and service time are excluded. The seed makes it reproducible: we ran the whole demonstration path twice and got identical figures.`,
    vocab: '',
  },
  {
    n: 14, speaker: 'Appendix', title: 'Appendix B: how Reflow works',
    text: `Use only if asked. Reflow captures every appointment not yet started, then does a local search over which resource and in which order. Candidates are checked by an independent validator against nine rules. It runs three times with different objectives and shows up to three alternatives. It can find no improvement, and in one of our eight test days it did worse than doing nothing.`,
    vocab: '',
  },
  {
    n: 15, speaker: 'Appendix', title: 'Appendix C: evaluation and limitations',
    text: `Use only if asked. Waiting minutes, mean, median and 90th percentile are computed from the event log. Utilisation is busy time divided by available time within the shift. The forecast is a seasonal hourly baseline chosen from three simple methods using six held-out synthetic days; it is not machine learning, and because the history is synthetic it says little about real demand. Everything here is simulated under stated assumptions.`,
    vocab: '',
  },
];

// ---------- Condensed script (about 3 minutes) ----------
export const CONDENSED = [
  { slides: '1-2', speaker: 'Lujain', text: `Every minute matters. Every decision moves the system. We are the SAYR AI team from ADNOC School in Madinat Zayed. When one clinician is unavailable, everyone behind that clinician waits, and the lab and checkout feel it later. In our simulated clinic, one clinician missing for three hours added 890 waiting minutes across 37 patients. This is a simulation of a fictional clinic, not real hospital data. Healthcare delays are rarely isolated.` },
  { slides: '3-4', speaker: 'Yosr', text: `So we asked: what if we could test operational decisions before they affect real patients? SAYR is a simulation-driven decision-support prototype. It models a fictional clinic with sixty synthetic patients, introduces a disruption, traces its consequences, proposes a plan, lets a person approve it, and measures the result. It uses a simulation, a forecasting baseline and a search-based optimizer, not a trained machine-learning model. A fixed seed gives the same day every time, so differences come from what we change.` },
  { slides: '5-6', speaker: 'Precious', text: `In Stress Controls we bend the day. With one clinician out, total waiting rises from 1,056 minutes to 1,946. Ripple Trace then follows the delay: 37 patients, 26 hops and 890 minutes, and every link is taken from the event log. We do not only say where the delay is. We show how it spreads.` },
  { slides: '7-8', speaker: 'Maryam', text: `Reflow searches for a feasible alternative plan at 10:50. It changes 42 appointments under nine constraints and projects 80 fewer waiting minutes. It is a heuristic search, so it does not guarantee the best plan, and nothing is applied until a person approves it in the Action Desk. SAYR never decides clinical priorities.` },
  { slides: '9-10', speaker: 'Eleen', text: `The Minutes Ledger measures the real result: 48 fewer minutes, 1,946 down to 1,898, about two and a half percent, less than the 80 projected. The 90th percentile improved, but ten patients wait longer, and walk-ins got slightly worse. Across eight synthetic days it helped on seven and hurt on one. We report all of it, because a better average does not mean a fairer system.` },
  { slides: '11-12', speaker: 'Shaden', text: `Where next? Working with healthcare operations professionals, authorized data, external validation and supervised testing. The next step is validation, not deployment by assumption. Healthcare operates as an interconnected system, and behind every schedule is a patient waiting for care. SAYR AI. Care in Motion.` },
];

// ---------- Live demonstration (90-120 s) ----------
export const DEMO = {
  scenario: 'Staff unavailability: Clinician B (consultation station GP-2) unavailable 10:30 to 13:30',
  seed: '7 (the default; shown in Stress Controls as "Random seed")',
  clock: '10:50, set automatically when the scenario is selected',
  policy: 'Baseline dispatch policy: First come, first served (default). Reflow profile: "Fewest waiting minutes" (marked Recommended)',
  parts: [
    { part: 'A', who: 'Lujain', secs: 15, screen: '02 Control Room',
      do: 'Press Pause on the clock bar (bottom left). Open 02 Control Room.',
      say: 'This is our fictional clinic on a normal day: nine resources, queues in front of the clock, and dashed blocks showing what today\'s plan projects next.',
      see: 'Normal operations. 9 of 9 resources available. Clock paused.' },
    { part: 'B', who: 'Yosr', secs: 15, screen: '05 Stress Controls',
      do: 'Open 05 Stress Controls. Click the radio "Staff unavailability" (02).',
      say: 'Now one clinician becomes unavailable from 10:30 for three hours. The simulation recalculates the whole day for the same patients and seed.',
      see: 'Clock jumps to 10:50. Impact panel: +890 min; total waiting 1,056 to 1,946; 90th percentile 42 to 75.' },
    { part: 'C', who: 'Precious', secs: 20, screen: '07 Ripple Trace',
      do: 'Open 07 Ripple Trace. Click "Play the ripple" and wait about ten seconds.',
      say: 'Ripple Trace replays the day with and without the outage. 37 patients delayed over 26 hops; every line is a link in the event log.',
      see: 'Tree grows from "Clinician B unavailable". Cards: 37 patients, 890 min, 26 hops, +24 min overtime.' },
    { part: 'D', who: 'Maryam', secs: 25, screen: '06 Reflow Studio',
      do: 'Open 02 Control Room and press the orange "Reflow" button (bottom right). Wait about 5 seconds, then drag the Before/After slider to the right.',
      say: 'Reflow searches for a feasible alternative. 42 appointments change, 6 move station, and all nine constraints pass. It projects 80 fewer planned minutes. Nothing is applied yet.',
      see: '"Proposed adjustment": 1,698 to 1,619; "Fewest waiting minutes" marked Recommended (-80); Constraints preserved 9/9.' },
    { part: 'F', who: 'Shaden', secs: 15, screen: '08 Action Desk / 06 Reflow Studio',
      do: 'Open 08 Action Desk, point to the pending proposal and audit trail. Then go back to 06 Reflow Studio and click "Accept in the simulation".',
      say: 'A person must approve. The proposal waits here with its evidence, and approving writes an entry to the audit trail.',
      see: 'Status changes from pending to accepted; audit trail gains an entry.' },
    { part: 'E', who: 'Eleen', secs: 25, screen: '09 Minutes Ledger',
      do: 'Open 09 Minutes Ledger. Point to the waterfall, then the balance table, then the fairness table and "Patients made worse off".',
      say: 'The ledger replays the approved plan: minus 48 minutes, not the 80 projected. 90th percentile improves, median rises slightly, and ten patients wait longer. We report the cost as well as the gain.',
      see: '"-48 min, -2.5%"; 1,946 to 1,898; "10 WAIT LONGER, 7 WAIT LESS, 43 ABOUT THE SAME".' },
  ],
  fallback: [
    'Short version (about 60 s): skip Ripple Trace. Do A, B quickly, then press Reflow, show the proposal, accept, and finish on the Ledger waterfall.',
    'If processing is slow (Reflow normally takes 5 to 6 seconds): keep talking about the nine constraints, then move on. If the page does not load at all, open the backup screenshots in order: 02-control-staff-1050, 05-stress-staff, 07-ripple-6hops, 06-reflow-before, 06-reflow-after, 08-desk-pending, 09-ledger.',
    'If a number differs from this guide, trust the app and say so: the Ledger recomputes everything. Use "Reset to demo state" in Stress Controls to return to the default.',
  ],
};

// ---------- Judge Q&A ----------
export const QA = [
  ['What makes SAYR AI innovative?',
   'Most scheduling tools show what is happening. SAYR lets you simulate a disruption, trace how it spreads, generate a constrained alternative plan, have a person approve it, and then measure the consequences, including who is made worse off. The contribution is joining these steps into one explainable, interactive workflow on one shared simulation state.'],
  ['Is this a real hospital management system?',
   'No. It is a prototype that models a fictional outpatient clinic with synthetic, anonymous patients. It has never been connected to a hospital, never used real patient data, and it cannot change real operations. Its screens say so.'],
  ['Where does artificial intelligence enter the project?',
   'In three places, all transparent: a forecasting baseline for hourly arrivals, a constraint-aware local-search optimizer that proposes plans, and deterministic explanations generated from the event log. We call these decision-support methods. We do not call anything a trained model.'],
  ['Does the platform use machine learning?',
   'Honest answer: no trained machine-learning model has been implemented. The current prototype uses a transparent forecasting baseline, a deterministic simulation engine and constraint-aware optimization. Its contribution is the integration of these methods into an interactive, explainable decision-support workflow. Training and validating more advanced predictive models would be a future research direction.'],
  ['How does the simulation work?',
   'It is a deterministic discrete-event simulation. A queue of events ordered by time drives the day: arrival, queue, start of service, finish, release, transfer and outage. Each event updates patients and resources and is written to a log. A fixed seed generates the same patients, lateness and durations every time.'],
  ['How are waiting times calculated?',
   'Waiting is the time between a patient becoming ready for a stage and starting that stage. Transfers and service time are excluded. Total waiting is the sum across appointments; mean, median and 90th percentile are computed per patient from the same log. The 90th percentile describes the worst-off tenth of patients.'],
  ['What happens when a staff member becomes unavailable?',
   'In the staff scenario one clinician, and therefore one consultation station, is unavailable from 10:30 for three hours. The simulator marks the resource down, so nothing can start on it, and the queue behind it grows. In seed 7 the same patients wait 890 more minutes in total than on the normal day, and 37 are delayed by at least three minutes.'],
  ['How does Reflow optimize appointments?',
   'At the clock time it captures every appointment not yet started, then runs a constraint-aware local search with seeded perturbation: it moves appointments to other resources or positions, keeps only changes that remain feasible, and keeps the better plan. It runs with three objectives and shows up to three alternatives. It is a heuristic, not an exact solver, and it does not guarantee the best possible plan.'],
  ['What constraints does it respect?',
   'Nine checks, re-run by an independent validator: one appointment per resource at a time; journey order and transfers; right resource type and skill; not before the patient is ready or before now; nothing on an unavailable resource; protected-slot patients wait no longer; no patient waits more than 30 minutes longer; overtime not increased; appointments starting within 5 minutes keep their place. The 30-minute limit is our own design choice.'],
  ['Does the system always improve waiting times?',
   'No, and we show that. At 10:50 for seed 7 the planner projected 80 fewer minutes but the measured result was 48. Across eight synthetic days at 10:45, Reflow reduced waiting on seven and increased it by 5 minutes on one (seed 64). Mean saving was 59.8 minutes, median 51.5. If no feasible improvement exists, Reflow says so.'],
  ['How do you know a result is not fabricated?',
   'Every figure is computed by the simulation in the browser from the seed, and the app recomputes it on demand. We repeated the demonstration path twice and got identical numbers. The code, tests and method are in the public repository, and the Ledger waterfall is made of separate replays whose steps add up exactly to the difference.'],
  ['How do you evaluate fairness?',
   'We compare mean and 90th-percentile waits for scheduled versus walk-in patients and morning versus afternoon arrivals, count priority inversions, track protected-slot patients, and list patients made worse off by five minutes or more. In our run, walk-ins and morning arrivals did slightly worse at the 90th percentile even though the overall figure improved. Fairness on synthetic data does not establish fairness in a real clinic.'],
  ['Why is human approval necessary?',
   'Operational changes affect people, and accountability must stay with people. SAYR proposes and explains; a person approves or rejects, and the decision is logged. The system never infers clinical urgency. Protected slots are assigned externally.'],
  ['How does SAYR differ from an ordinary scheduling dashboard?',
   'A dashboard displays state. SAYR lets you intervene in a simulated day, see causal consequences with Ripple Trace, generate and constraint-check alternatives with Reflow, and compare baseline, disrupted and optimized runs on identical patients in the Ledger.'],
  ['What would be required to implement it in Al Dhafra?',
   'Collaboration with healthcare operations professionals; authorized access to real operational data under privacy and security governance; mapping real workflows, rooms, staff rules and breaks into the model; external validation of predictions; and supervised, approved pilot testing. None of that has been done, and we have not used any Al Dhafra performance data.'],
  ['How would you validate it using real operational data?',
   'Compare simulated queue lengths, waits and utilisation against observed timestamps for the same days and capacity, calibrate service-time distributions, then test whether recommended changes would have helped on held-out historical days. Only after that would a controlled, supervised prospective study make sense.'],
  ['What are the main limitations?',
   'All data are synthetic. A clinician is tied to a room. There are no breaks, equipment, multiple sites or clinical variation. The forecast history is generated from the simulator\'s own pattern, so it says little about real demand. Planned and measured savings differ. Improvements are not guaranteed, and simulated results do not show real-world effectiveness or better clinical outcomes.'],
];

// ---------- Sources ----------
export const SOURCES = {
  app: [
    ['SAYR AI: Care in Motion (published prototype)', URL_APP, 'Primary source of truth for every figure, screen and definition in the deck.'],
    ['Source repository', 'https://github.com/MayMourad/SAYR-AI-Care-In-Motion', 'README, engine code (src/engine), 24 automated tests, DESIGN_REFERENCES.md.'],
  ],
  literature: [
    ['Cayirli, T. and Veral, E. (2003). Outpatient scheduling in health care: a review of literature. Production and Operations Management, 12(4), 519-549.', 'Background: why outpatient scheduling under uncertainty is hard.'],
    ['Gupta, D. and Denton, B. (2008). Appointment scheduling in health care: challenges and opportunities. IIE Transactions, 40(9), 800-819.', 'Background: appointment scheduling challenges, including no-shows and walk-ins.'],
    ['Jun, J. B., Jacobson, S. H. and Swisher, J. R. (1999). Application of discrete-event simulation in health care clinics: a survey. Journal of the Operational Research Society, 50(2), 109-123.', 'Background: discrete-event simulation of clinics.'],
    ['Hyndman, R. J. and Athanasopoulos, G. Forecasting: Principles and Practice (3rd ed.). OTexts, online at otexts.com/fpp3.', 'Seasonal and naive baselines, and evaluating forecasts on held-out data.'],
  ],
  design: [
    ['SAYR DESIGN_REFERENCES.md', 'Ten interaction references studied for principles only (Spline/Hana and Recent.design showcases). No media or components are reused in this deck.'],
  ],
};
