// Builds the SAYR case-study deck. All screenshots are captures of the running app (tools/shots.mjs).
import pptxgen from 'pptxgenjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const SHOTS = new URL('../docs/screenshots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = new URL('../docs/SAYR-case-study.pptx', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const S = (n) => SHOTS + n + '.png';

const PAPER = 'F6F2E9', PAPER2 = 'FBF9F4', INK = '15233B', NAVY = '1B2D4D', TEAL = '1F7B78', COPPER = 'B4642F', MUT = '7B7566', LINE = 'DDD5C3', COPPER_SOFT = 'F2DFD0', TEAL_SOFT = 'D9EBE8';
const HEAD = 'Cambria', BODY = 'Calibri';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
pres.author = 'SAYR team, ADNOC School – Madinat Zayed';
pres.title = 'SAYR: when the day overloads, the schedule reorganises';
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };

pres.defineSlideMaster({
  title: 'SAYR_DARK',
  background: { color: INK },
  objects: [],
});
pres.defineSlideMaster({
  title: 'SAYR_CONTENT',
  background: { color: PAPER },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.4, w: 12.1, h: 0.85, fontFace: HEAD, fontSize: 34, bold: true, color: INK, margin: 0, valign: 'top', align: 'left' }, text: '' } },
    { text: { text: 'SAYR  ·  ADNOC School – Madinat Zayed', options: { x: 0.6, y: 7.05, w: 6, h: 0.3, fontFace: BODY, fontSize: 10, color: MUT, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.05, w: 0.6, h: 0.3, fontFace: BODY, fontSize: 10, color: MUT, align: 'right' },
});

let count = 0;
const content = (title, notes) => {
  const s = pres.addSlide({ masterName: 'SAYR_CONTENT' });
  s.addText(title, { placeholder: 'title' });
  if (notes) s.addNotes(notes);
  count++;
  return s;
};
const txt = (s, text, o) => s.addText(text, { isTextBox: true, fontFace: BODY, color: INK, margin: 0, valign: 'top', ...o });
const img = (s, name, x, y, w, h) => s.addImage({ path: S(name), x, y, w, h, sizing: { type: 'contain', w, h } });
const card = (s, x, y, w, h, o = {}) =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: o.fill ?? PAPER2 }, line: { color: o.line ?? LINE, width: 0.75 } });

// ---------- 1. Title ----------
{
  const s = pres.addSlide({ masterName: 'SAYR_DARK' });
  txt(s, 'AL DHAFRA HEALTH FORUM  ·  DEVELOPING HEALTHCARE SERVICES', { x: 0.7, y: 0.4, w: 8, h: 0.35, fontSize: 12, color: 'CBC2AB', charSpacing: 3 });
  txt(s, 'SAYR', { x: 0.7, y: 0.9, w: 5.2, h: 2.2, fontFace: HEAD, fontSize: 120, bold: true, color: 'F6F2E9', charSpacing: 14 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.55, y: 1.0, w: 0.85, h: 0.5, rectRadius: 0.05, fill: { color: INK }, line: { color: 'CF8250', width: 1.5 } });
  txt(s, 'AI', { x: 5.55, y: 1.0, w: 0.85, h: 0.5, fontFace: BODY, fontSize: 20, bold: true, color: 'CF8250', align: 'center', valign: 'middle', charSpacing: 4 });
  txt(s, 'Care in Motion.', { x: 0.7, y: 3.0, w: 6.0, h: 0.7, fontFace: HEAD, fontSize: 34, italic: true, color: '8FCBC7' });
  txt(s, 'When the day overloads, the schedule reorganises.', { x: 0.7, y: 3.8, w: 6.0, h: 1.0, fontFace: HEAD, fontSize: 24, color: 'F2DFD0' });
  txt(s, 'A simulation-driven healthcare operations prototype. Synthetic data, human approval, no clinical claims.', { x: 0.7, y: 4.95, w: 5.8, h: 0.8, fontSize: 15, color: 'CBC2AB' });
  txt(
    s,
    'Lujain Ahmed Mourad 8D · Yosr Amgad 8D · Precious Fuentes 8D\nMaryam Ammara Jelita 8D · Eleen Amr 8D · Shaden Ahmed Mourad 6D\nADNOC School – Madinat Zayed',
    { x: 0.7, y: 6.1, w: 7, h: 0.95, fontSize: 13, color: 'F6F2E9', paraSpaceAfter: 2 },
  );
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.1, y: 0.75, w: 5.7, h: 5.95, rectRadius: 0.1, fill: { color: PAPER2 }, line: { color: 'CBC2AB', width: 0.75 } });
  img(s, 'c-motion', 7.2, 0.85, 5.5, 5.75);
  s.addNotes('SAYR in one sentence: a precision-engineered healthcare operations interface. The picture is the Flow Canvas, captured from the running application.');
  count++;
}

// ---------- 2. Narrative ----------
{
  const s = content('Disruption → Ripple → Reflow → Measured outcome', 'The whole story in four numbers, from one seeded synthetic day of 60 patients under scenario 2, staff unavailability. Every figure is computed by the simulator.');
  const items = [
    ['01 · DISRUPTION', '180', 'min', 'Clinician B is unavailable from 10:30 to 13:30, so one consultation station is lost.', NAVY],
    ['02 · RIPPLE', '890', 'min', 'of extra waiting across 37 patients, 26 hops downstream, traced from the event log.', COPPER],
    ['03 · REFLOW', '42', 'moves', 'appointments re-planned at 10:50. Nine constraints re-checked. Planned saving 80 min.', TEAL],
    ['04 · MEASURED', '−48', 'min', 'waiting minutes when the approved plan is replayed on realised durations (−2.5%).', NAVY],
  ];
  items.forEach(([k, big, unit, body, col], i) => {
    const x = 0.6 + i * 3.1;
    card(s, x, 1.75, 2.9, 4.6);
    txt(s, k, { x: x + 0.25, y: 2.0, w: 2.4, h: 0.3, fontSize: 12, bold: true, color: COPPER, charSpacing: 3 });
    txt(s, big, { x: x + 0.25, y: 2.5, w: 2.45, h: 1.35, fontFace: HEAD, fontSize: 72, color: col, valign: 'middle' });
    txt(s, unit, { x: x + 0.25, y: 3.85, w: 2.4, h: 0.4, fontSize: 18, color: MUT });
    txt(s, body, { x: x + 0.25, y: 4.45, w: 2.45, h: 1.7, fontSize: 15 });
  });
  txt(s, 'Planned and measured values are reported separately: the planner knows booked lengths, the day uses real ones.', { x: 0.6, y: 6.55, w: 12.1, h: 0.4, fontSize: 14, color: MUT });
}

// ---------- 3. Flow Canvas ----------
{
  const s = content('The Flow Canvas: a day drawn from its own state', 'Every element on the canvas is generated from simulation state. The legend is the visual grammar: lanes, blocks, queues, limits, delays, and a movable clock.');
  card(s, 0.6, 1.5, 8.5, 5.3);
  img(s, 'c-control', 0.7, 1.6, 8.3, 5.1);
  const g = [
    ['Patient', 'an anonymous journey line'],
    ['Resource', 'a labelled lane with live status'],
    ['Appointment', 'a time block, urgent ones notched'],
    ['Queue', 'chips stacked at the clock, longest first'],
    ['Capacity', 'shift-end line and hatched overtime'],
    ['Delay', 'a copper line when a wait is long'],
    ['Clock', 'a movable indicator you can drag'],
  ];
  g.forEach(([a, b], i) => {
    const y = 1.55 + i * 0.74;
    txt(s, a, { x: 9.5, y, w: 3.2, h: 0.3, fontSize: 18, bold: true, fontFace: HEAD, color: COPPER });
    txt(s, b, { x: 9.5, y: y + 0.3, w: 3.2, h: 0.35, fontSize: 14 });
  });
}

// ---------- 3b. Architecture ----------
{
  const s = content('Three layers of intelligence, one shared state', 'Forecasting, constraint optimization and explanation sit on one deterministic simulation. Every screen reads the same state, so no two pages can disagree. None of the layers is a trained clinical model.');
  const boxes = [
    ['Synthetic data', 'Seeded population: 48 scheduled, 12 walk-in, 3 stations, lab, checkout', NAVY],
    ['Event simulator', 'Deterministic queue, resources, outages, audit of every timestamp', NAVY],
    ['Reflow optimizer', 'Constraint-aware local search, nine checks, three objectives', TEAL],
    ['Human approval', 'Approve, reject, compare, restore baseline. Audit trail', COPPER],
  ];
  boxes.forEach(([a, b, c], i) => {
    const x = 0.6 + i * 3.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.6, w: 2.85, h: 1.9, rectRadius: 0.08, fill: { color: c }, line: { color: c } });
    txt(s, a, { x: x + 0.2, y: 1.75, w: 2.45, h: 0.5, fontFace: HEAD, fontSize: 20, bold: true, color: 'FFFFFF' });
    txt(s, b, { x: x + 0.2, y: 2.35, w: 2.45, h: 1.0, fontSize: 14, color: 'FFFFFF' });
    if (i < 3) txt(s, '→', { x: x + 2.85, y: 2.2, w: 0.25, h: 0.5, fontSize: 22, color: COPPER, align: 'center' });
  });
  const layers = [
    ['Layer 1 · Demand forecasting', 'Three evaluated baselines on simulated history, scored on held-out days by mean absolute error. Not machine learning.'],
    ['Layer 2 · Constraint optimization', 'The computational core: a heuristic search, with its limits stated, never presented as machine learning.'],
    ['Layer 3 · Operational explanation', 'Deterministic sentences generated from real events and plan changes. No language model, no paid API.'],
  ];
  layers.forEach(([a, b], i) => {
    const x = 0.6 + i * 4.15;
    card(s, x, 3.95, 3.95, 2.7);
    txt(s, a, { x: x + 0.25, y: 4.15, w: 3.45, h: 0.8, fontFace: HEAD, fontSize: 18, bold: true, color: COPPER });
    txt(s, b, { x: x + 0.25, y: 5.0, w: 3.45, h: 1.5, fontSize: 14 });
  });
}

// ---------- 4. Ripple ----------
{
  const s = content('Ripple Trace: from one absence to 37 delayed patients', 'Calculated from the event log. The same day is replayed without the outage on the same patients and durations; each delayed appointment is linked to the lane or earlier stage that held it.');
  card(s, 0.6, 1.45, 9.0, 5.4);
  img(s, 'c-ripple', 0.7, 1.55, 8.8, 5.2);
  [['37', 'patients delayed 3 min or more'], ['890', 'waiting minutes caused'], ['26', 'hops to the last delay']].forEach(([n, l], i) => {
    const y = 1.5 + i * 1.8;
    txt(s, n, { x: 10.0, y, w: 2.8, h: 1.1, fontFace: HEAD, fontSize: 64, color: i === 1 ? COPPER : NAVY, valign: 'middle' });
    txt(s, l, { x: 10.0, y: y + 1.1, w: 2.8, h: 0.5, fontSize: 14, color: MUT });
  });
}

// ---------- 5. Reflow moment ----------
{
  const s = content('Reflow: the overloaded plan reorganises', 'The defining moment. The same screen at three positions of the Before to After control. Blocks move because the optimizer assigned them new positions; the ghost outlines are where they were.');
  const labels = [['BEFORE', 'The plan today’s policy projects at 10:50', 'c-reflow-before-zoom', '1,698'], ['AFTER', 'Feasible, nine constraints re-checked. Waits shown per moved appointment.', 'c-reflow-after-zoom', '1,619']];
  labels.forEach(([a, b, f, n], i) => {
    const x = 0.6 + i * 6.15;
    card(s, x, 1.3, 5.95, 4.25);
    img(s, f, x + 0.08, 1.38, 5.79, 4.09);
    txt(s, a, { x, y: 5.68, w: 3.0, h: 0.3, fontSize: 12, bold: true, color: COPPER, charSpacing: 3 });
    txt(s, n + ' planned waiting min', { x, y: 5.95, w: 5.9, h: 0.55, fontFace: HEAD, fontSize: 26, color: i === 1 ? TEAL : INK });
    txt(s, b, { x, y: 6.52, w: 5.9, h: 0.4, fontSize: 14, color: MUT });
  });
}

// ---------- 6. How Reflow works ----------
{
  const s = content('How Reflow earns the right to move your schedule', 'The search is a constraint-aware local search with seeded perturbation, run three times with different objectives. Progress shown in the app is real: counts, objective values and rule checks, not timed placeholders.');
  const steps = [['Capture', 'The unstarted appointments, resources in use and outage end times at the clock'], ['Search', 'Relocate and resequence appointments; keep only moves that stay feasible'], ['Validate', 'An independent checker re-tests all nine rules on every candidate'], ['Propose', 'Three alternatives, one recommended, with every change listed']];
  steps.forEach(([a, b], i) => {
    const x = 0.6 + i * 3.1;
    card(s, x, 1.5, 2.85, 2.2, { fill: i === 3 ? TEAL_SOFT : PAPER2 });
    txt(s, String(i + 1), { x: x + 0.2, y: 1.6, w: 0.6, h: 0.7, fontFace: HEAD, fontSize: 36, color: COPPER });
    txt(s, a, { x: x + 0.85, y: 1.72, w: 1.9, h: 0.5, fontFace: HEAD, fontSize: 22, bold: true });
    txt(s, b, { x: x + 0.2, y: 2.45, w: 2.5, h: 1.15, fontSize: 14 });
  });
  txt(s, 'Constraints preserved', { x: 0.6, y: 4.0, w: 6, h: 0.45, fontFace: HEAD, fontSize: 22, bold: true });
  const rules = ['Resource exclusivity', 'Journey order and transfers', 'Skill compatibility', 'Not before ready or now', 'Outages respected', 'Protected slots kept', 'Bounded individual harm (≤ 30 min)', 'Overtime not increased', 'Committed starts kept'];
  rules.forEach((r, i) => {
    const col = i < 5 ? 0 : 1;
    const row = i < 5 ? i : i - 5;
    const x = 0.6 + col * 4.4;
    const y = 4.55 + row * 0.46;
    s.addShape(pres.shapes.OVAL, { x, y: y + 0.04, w: 0.28, h: 0.28, fill: { color: TEAL }, line: { color: TEAL } });
    txt(s, '✓', { x, y: y + 0.04, w: 0.28, h: 0.28, fontSize: 11, color: 'FFFFFF', align: 'center', valign: 'middle', bold: true });
    txt(s, r, { x: x + 0.4, y, w: 3.9, h: 0.36, fontSize: 15, valign: 'middle' });
  });
  card(s, 9.6, 4.0, 3.15, 2.2, { fill: COPPER_SOFT, line: 'E3C3A9' });
  txt(s, 'Refusal is a feature', { x: 9.8, y: 4.15, w: 2.8, h: 0.4, fontFace: HEAD, fontSize: 18, bold: true });
  txt(s, 'Accept and Reject sit beside the evidence. A proposal that breaks a rule cannot be accepted.', { x: 9.8, y: 4.65, w: 2.8, h: 1.9, fontSize: 14 });
}

// ---------- 7. Resource Board ----------
{
  const s = content('Resource Board: drag it, and the rules answer', 'Drag-and-drop uses the same decoder and checker as the optimizer. In this capture a consultation appointment was dragged onto a registration desk and refused with the reason. Other drops are refused by journey order, protected priority, outages or the 15-minute harm cap.');
  card(s, 0.6, 1.45, 8.8, 5.4);
  img(s, 'c-board-drag', 0.7, 1.55, 8.6, 5.2);
  txt(s, 'Refused, with the reason', { x: 9.8, y: 1.55, w: 3.0, h: 0.8, fontFace: HEAD, fontSize: 20, bold: true, color: COPPER });
  txt(s, 'Incompatible lanes are hatched while you drag. Compatible lanes show the effect on waiting before you drop.', { x: 9.8, y: 2.45, w: 3.0, h: 1.5, fontSize: 14 });
  txt(s, 'Journey order, protected slots, outages and the 30-minute harm limit refuse drops the same way.', { x: 9.8, y: 4.15, w: 3.0, h: 1.2, fontSize: 14, color: MUT });
  txt(s, 'A keyboard form offers the same check without a pointer.', { x: 9.8, y: 5.55, w: 3.0, h: 0.9, fontSize: 14 });
}

// ---------- 8. Minutes Ledger (primary results) ----------
{
  const s = content('Minutes Ledger: an accountable balance of time', 'The primary results slide. The waterfall bars are real replays: the plan applied one operational change at a time, so they sum exactly to the measured difference. No claim of clinical benefit is made.');
  card(s, 0.6, 1.45, 8.2, 5.4);
  img(s, 'c-ledger-waterfall', 0.7, 1.55, 8.0, 5.2);
  txt(s, '−48', { x: 9.1, y: 1.4, w: 3.7, h: 1.3, fontFace: HEAD, fontSize: 80, color: TEAL, valign: 'middle' });
  txt(s, 'waiting minutes, simulated (1,946 → 1,898, −2.5%). Normal day: 1,056', { x: 9.1, y: 2.75, w: 3.7, h: 0.7, fontSize: 14, color: MUT });
  [['75 → 71', 'p90 wait, min'], ['28 → 29', 'median wait, min: slightly worse'], ['24 → 22', 'overtime, min · 0 rule violations']].forEach(([n, l], i) => {
    const y = 3.6 + i * 1.05;
    txt(s, n, { x: 9.1, y, w: 3.7, h: 0.6, fontFace: HEAD, fontSize: 32 });
    txt(s, l, { x: 9.1, y: y + 0.58, w: 3.7, h: 0.3, fontSize: 13, color: MUT });
  });
}

// ---------- 9. Policies ----------
{
  const s = content('Fewest minutes is not the same as fairest', 'Computed from three full replays of the same day under three live scheduling policies. The aged shortest-task-first policy has the lowest total but the most priority inversions.');
  const hdr = (t) => ({ text: t, options: { bold: true, color: 'FFFFFF', fill: { color: NAVY }, fontFace: BODY, fontSize: 15, align: 'center' } });
  const cell = (t, o = {}) => ({ text: t, options: { fontFace: BODY, fontSize: 16, align: 'center', color: INK, ...o } });
  const rows = [
    [hdr('Live policy'), hdr('Total wait (min)'), hdr('p90 wait (min)'), hdr('Protected-slot median (min)'), hdr('Priority inversions')],
    [cell('First come, first served', { align: 'left' }), cell('1,946'), cell('75'), cell('17'), cell('48')],
    [cell('Priority with aging', { align: 'left' }), cell('1,973', { color: COPPER, bold: true }), cell('67'), cell('8', { color: TEAL, bold: true }), cell('23', { color: TEAL, bold: true })],
    [cell('Shortest task first (aged)', { align: 'left' }), cell('1,616', { color: TEAL, bold: true }), cell('65', { color: TEAL, bold: true }), cell('9'), cell('45', { color: COPPER, bold: true })],
  ];
  s.addTable(rows, { x: 0.6, y: 1.6, w: 12.1, colW: [3.9, 2.0, 2.0, 2.2, 2.0], rowH: 0.62, border: { type: 'solid', color: LINE, pt: 0.75 }, fill: { color: PAPER2 } });
  card(s, 0.6, 4.5, 5.9, 2.3);
  txt(s, 'What the table shows', { x: 0.85, y: 4.65, w: 5.4, h: 0.4, fontFace: HEAD, fontSize: 20, bold: true });
  txt(s, 'Shortest-first needs the fewest minutes, yet starts a less urgent patient ahead of a more urgent one 45 times. Priority-with-aging has the fewest inversions and the best protected-slot median, at the highest total.', { x: 0.85, y: 5.15, w: 5.4, h: 1.5, fontSize: 15 });
  card(s, 6.8, 4.5, 5.9, 2.3, { fill: COPPER_SOFT, line: 'E3C3A9' });
  txt(s, 'Why Reflow is constrained', { x: 7.05, y: 4.65, w: 5.4, h: 0.4, fontFace: HEAD, fontSize: 20, bold: true });
  txt(s, 'Reflow may not worsen any protected-slot patient or lengthen anyone’s wait by more than 30 minutes, so it saves fewer minutes than an unconstrained rule. That is a choice, and the Ledger shows it.', { x: 7.05, y: 5.15, w: 5.4, h: 1.5, fontSize: 15 });
}

// ---------- 10. Action Desk + My Journey ----------
{
  const s = content('Decide on evidence, and see it from the patient’s side', 'Action Desk: proposals with feasibility evidence and approval controls. My Journey: the same simulation for one anonymous patient, with ranges rather than false precision.');
  card(s, 0.6, 1.45, 6.0, 4.25);
  img(s, 'c-desk', 0.68, 1.53, 5.84, 4.09);
  card(s, 6.75, 1.45, 6.0, 4.25);
  img(s, 'c-my-journey', 6.83, 1.53, 5.84, 4.09);
  txt(s, 'Action Desk', { x: 0.6, y: 5.85, w: 6.0, h: 0.4, fontFace: HEAD, fontSize: 22, bold: true });
  txt(s, 'Expandable proposals, nine constraint checks, approve or reject, and a decision log.', { x: 0.6, y: 6.3, w: 6.0, h: 0.6, fontSize: 14, color: MUT });
  txt(s, 'My Journey', { x: 6.75, y: 5.85, w: 6.0, h: 0.4, fontFace: HEAD, fontSize: 22, bold: true });
  txt(s, 'An anonymous code, plain-language steps and ranges from many plausible futures.', { x: 6.75, y: 6.3, w: 6.0, h: 0.6, fontSize: 14, color: MUT });
}

// ---------- 11. Limits ----------
{
  const s = content('What this does and does not show', 'Honest limits, stated on the Ledger and the About panel.');
  const cols = [
    ['Planned is not measured', 'Reflow plans with booked appointment lengths. The Ledger replays with realised ones. Here the plan projected −80 min and measured −48 min. Across other seeds the result varies, and some days Reflow finds nothing.', TEAL],
    ['Plan-following has a cost', 'Executing a fixed plan instead of dispatching live is itself a bar in the waterfall (−27 min here). It is shown, not hidden.', COPPER],
    ['Minutes are not outcomes', 'Fewer waiting minutes is an operational measure. It is not evidence of a clinical benefit, and all patients here are synthetic.', NAVY],
  ];
  cols.forEach(([a, b, c], i) => {
    const x = 0.6 + i * 4.15;
    card(s, x, 1.6, 3.95, 4.7);
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 1.9, w: 0.7, h: 0.7, fill: { color: c }, line: { color: c } });
    txt(s, String(i + 1), { x: x + 0.3, y: 1.9, w: 0.7, h: 0.7, fontFace: HEAD, fontSize: 26, color: 'FFFFFF', align: 'center', valign: 'middle' });
    txt(s, a, { x: x + 0.3, y: 2.9, w: 3.35, h: 0.9, fontFace: HEAD, fontSize: 24, bold: true });
    txt(s, b, { x: x + 0.3, y: 3.9, w: 3.35, h: 2.4, fontSize: 16 });
  });
}

// ---------- 12. Identity and credits ----------
{
  const s = content('An identity built for dispatch, not diagnosis', 'SAYR is deliberately different from the separate diagnostic project: no 3D, no anatomy, no evidence-inspection motifs. All ten design references were used for principles only; nothing was reused. Details are in DESIGN_REFERENCES.md.');
  const sw = [[PAPER, 'Warm paper'], [NAVY, 'Navy ink'], [TEAL, 'Teal: flow'], [COPPER, 'Copper: deviation']];
  sw.forEach(([c, n], i) => {
    const x = 0.6 + i * 1.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.55, w: 1.4, h: 1.0, rectRadius: 0.06, fill: { color: c }, line: { color: LINE, width: 0.75 } });
    txt(s, n, { x, y: 2.62, w: 1.45, h: 0.5, fontSize: 12, color: MUT });
  });
  txt(s, 'Aa 1,477', { x: 0.6, y: 3.35, w: 6.1, h: 1.2, fontFace: HEAD, fontSize: 60, color: INK });
  txt(s, 'Serif numerals, tabular figures and hairline grids carry the hierarchy. The only motion is state made visible.', { x: 0.6, y: 4.7, w: 6.0, h: 1.0, fontSize: 15 });
  txt(s, 'No third-party design service is needed at runtime. No Spline or Hana embed is shipped: none was exported, and none was invented.', { x: 0.6, y: 5.8, w: 6.0, h: 1.0, fontSize: 15, color: MUT });
  card(s, 7.1, 1.5, 5.65, 4.6);
  txt(s, 'Studied for principles, not reused', { x: 7.35, y: 1.65, w: 5.2, h: 0.4, fontFace: HEAD, fontSize: 20, bold: true });
  const refs = ['Spline Hana · interactive vector states', 'Charts with hover animation · @marinach (CC BY 4.0)', 'Flow · @vladkolokolnikov (CC BY 4.0)', 'Auto Layout 3D List · Spline UI', 'Animated Icons · Spline UI', 'Thumbnail Grid Transition · C. Bernadou', 'Spacing Tips · M. Filipiuk', 'iOS Gesture Studies · Juliette', 'Krea loading state · A. Larionov', 'Animated Icon Set · J. McDonald'];
  txt(s, refs.map((r, i) => ({ text: r, options: { bullet: true, breakLine: i < refs.length - 1 } })), { x: 7.35, y: 2.15, w: 5.2, h: 4.5, fontSize: 14, paraSpaceAfter: 3 });
}

// ---------- 12b. Arabic ----------
{
  const s = content('English and Arabic, left-to-right and right-to-left', 'The interface mirrors in Arabic. Navigation, metric labels, scenarios, actions, approval states and the responsible-AI text are translated; the timeline and charts keep their left-to-right time axis; numbers stay readable. Long explanatory paragraphs remain in English and are listed as a limitation.');
  card(s, 0.6, 1.4, 8.4, 5.3);
  img(s, '12-ledger-ar', 0.7, 1.5, 8.2, 5.1);
  txt(s, 'Same state, two languages', { x: 9.4, y: 1.5, w: 3.4, h: 0.8, fontFace: HEAD, fontSize: 22, bold: true, color: COPPER });
  txt(s, 'The Minutes Ledger in Arabic: the same computed figures, the layout mirrored, the waterfall axis unchanged.', { x: 9.4, y: 2.45, w: 3.4, h: 1.6, fontSize: 15 });
  txt(s, 'Translated: navigation, metric labels, scenario descriptions, actions, approval states, responsible-AI disclosures.', { x: 9.4, y: 4.2, w: 3.4, h: 1.5, fontSize: 14, color: MUT });
}

// ---------- 13. Team ----------
{
  const s = pres.addSlide({ masterName: 'SAYR_DARK' });
  txt(s, 'SAYR', { x: 0.7, y: 0.8, w: 6, h: 1.4, fontFace: HEAD, fontSize: 64, bold: true, color: 'F6F2E9', charSpacing: 10 });
  txt(s, 'The defining moment is the instant an overloaded schedule visibly reorganises into a feasible, explainable plan.', { x: 0.7, y: 2.4, w: 6.2, h: 1.8, fontFace: HEAD, fontSize: 26, color: 'F2DFD0' });
  const team = ['Lujain Ahmed Mourad  ·  8D', 'Yosr Amgad  ·  8D', 'Precious Fuentes  ·  8D', 'Maryam Ammara Jelita  ·  8D', 'Eleen Amr  ·  8D', 'Shaden Ahmed Mourad  ·  6D'];
  txt(s, team.map((t, i) => ({ text: t, options: { breakLine: i < team.length - 1 } })), { x: 8.0, y: 1.2, w: 4.8, h: 3.2, fontSize: 22, color: 'F6F2E9', paraSpaceAfter: 8 });
  txt(s, 'ADNOC School – Madinat Zayed', { x: 8.0, y: 4.9, w: 4.8, h: 0.5, fontSize: 18, color: 'CBC2AB' });
  s.addNotes('Thank you.');
  count++;
}

await pres.writeFile({ fileName: OUT });
console.log('wrote', OUT, count, 'slides');

const { applyTheme } = require('C:/Users/aaa/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/local-agent-mode-sessions/skills-plugin/35552a5f-98f9-4e0e-b06f-d1a96e9ca10a/e54784a8-37a4-4cc2-9d86-5fb6e5584d2c/skills/pptx/scripts/apply_theme.js');
await applyTheme(OUT, {
  name: 'SAYR',
  headFontFace: HEAD,
  bodyFontFace: BODY,
  colors: { dk1: INK, lt1: 'FFFFFF', dk2: NAVY, lt2: PAPER, accent1: COPPER, accent2: TEAL, accent3: '2A4068', accent4: 'CF8250', accent5: MUT, accent6: LINE, hlink: TEAL, folHlink: MUT },
});
console.log('theme applied');
