// Builds the Al Dhafra Health Forum presentation: 12 main slides + 3 appendix slides.
// Screenshots are captures of the PUBLISHED app (tools/presentation/capture*.mjs); every number is from docs/presentation/VERIFIED-RUN.md.
import pptxgen from 'pptxgenjs';
import { createRequire } from 'node:module';
import { SCRIPT, TEAM, URL_APP } from './content.mjs';
const require = createRequire(import.meta.url);

const root = (p) => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SHOTS = root('../../docs/presentation/screenshots/');
const ASSETS = root('../../docs/presentation/assets/');
const OUT = root('../../docs/presentation/build/SAYR-Al-Dhafra-Health-Forum.pptx');

// ---- palette read from the app's styles.css ----
const PAPER = 'F6F2E9', PAPER2 = 'FBF9F4', PAPER3 = 'EEE8DA', INK = '15233B', INK2 = '3A4A66', NAVY = '1B2D4D', NAVY2 = '2A4068';
const TEAL = '1F7B78', TEAL2 = '3A9B97', TEAL_SOFT = 'D9EBE8', COPPER = 'B4642F', COPPER2 = 'CF8250', COPPER_SOFT = 'F2DFD0';
const MUT = '7B7566', MUT2 = 'A39C88', LINE = 'DDD5C3', LINE2 = 'CBC2AB';
// ---- type: the app's own serif / sans / mono stacks (Palatino, Segoe UI, Consolas are the Windows members) ----
const HEAD = 'Palatino Linotype', BODY = 'Segoe UI', MONO = 'Consolas';

const THEME = {
  name: 'SAYR Care in Motion',
  headFontFace: HEAD,
  bodyFontFace: BODY,
  colors: { dk1: INK, lt1: 'FFFFFF', dk2: NAVY, lt2: PAPER, accent1: TEAL, accent2: COPPER, accent3: NAVY2, accent4: TEAL2, accent5: COPPER2, accent6: MUT, hlink: TEAL, folHlink: MUT },
};

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.author = 'SAYR AI team, ADNOC Schools, Madinat Zayed';
pres.company = 'ADNOC Schools, Madinat Zayed';
pres.title = 'SAYR AI: Care in Motion';
pres.subject = 'Al Dhafra Health Forum, Developing Healthcare Services';
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };

const FOOT = 'SAYR AI  ·  Care in Motion  ·  Al Dhafra Health Forum  ·  ADNOC Schools, Madinat Zayed';
pres.defineSlideMaster({
  title: 'SAYR_LIGHT',
  background: { color: PAPER },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.62, w: 12.1, h: 0.75, fontFace: HEAD, fontSize: 30, color: INK, margin: 0, valign: 'top', align: 'left' }, text: '' } },
    { text: { text: FOOT, options: { x: 0.6, y: 7.1, w: 9, h: 0.25, fontFace: MONO, fontSize: 8, color: MUT, margin: 0 } } },
  ],
  slideNumber: { x: 12.1, y: 7.1, w: 0.63, h: 0.25, fontFace: MONO, fontSize: 8, color: MUT, align: 'right' },
});
pres.defineSlideMaster({ title: 'SAYR_DARK', background: { color: INK }, objects: [] });

// ---------- helpers ----------
const S = (n) => SHOTS + n + '.png';
const R = pres.shapes.ROUNDED_RECTANGLE, RECT = pres.shapes.RECTANGLE, LN = pres.shapes.LINE, OVAL = pres.shapes.OVAL;
const txt = (s, text, o = {}) => s.addText(text, { isTextBox: true, fontFace: BODY, fontSize: 14, color: INK, margin: 0, valign: 'top', ...o });
const rect = (s, x, y, w, h, o = {}) =>
  s.addShape(o.round === false ? RECT : R, { x, y, w, h, rectRadius: o.r ?? 0.06, fill: o.fill ? { color: o.fill, transparency: o.tr ?? 0 } : { type: 'none' }, line: o.line ? { color: o.line, width: o.lw ?? 0.75, dashType: o.dash ?? 'solid' } : { type: 'none' }, objectName: o.name });
const card = (s, x, y, w, h, o = {}) => rect(s, x, y, w, h, { fill: o.fill ?? PAPER2, line: o.line ?? LINE, r: 0.07, ...o });
const line = (s, x1, y1, x2, y2, o = {}) =>
  s.addShape(LN, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipV: (x2 - x1) * (y2 - y1) < 0, flipH: x2 < x1 && y1 === y2, line: { color: o.color ?? MUT2, width: o.w ?? 1, dashType: o.dash ?? 'solid', endArrowType: o.arrow ? 'triangle' : undefined }, objectName: o.name });
const img = (s, name, x, y, w, h, o = {}) => s.addImage({ path: S(name), x, y, w, h, sizing: { type: 'contain', w, h }, altText: o.alt ?? name, objectName: o.name });
const kicker = (s, text, x = 0.6, y = 0.34, color = COPPER) => txt(s, text, { x, y, w: 9, h: 0.25, fontFace: MONO, fontSize: 10.5, color, charSpacing: 2 });
const source = (s, text, y = 6.78) => txt(s, text, { x: 0.6, y, w: 12.1, h: 0.28, fontFace: BODY, fontSize: 8.5, color: MUT, valign: 'top' });
const bubble = (s, n, x, y, o = {}) => {
  s.addShape(OVAL, { x: x - 0.14, y: y - 0.14, w: 0.28, h: 0.28, fill: { color: o.fill ?? COPPER }, line: { color: o.border ?? PAPER2, width: 1.25 }, objectName: o.name });
  txt(s, String(n), { x: x - 0.14, y: y - 0.14, w: 0.28, h: 0.28, fontFace: MONO, fontSize: 9.5, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
};
const stat = (s, big, label, x, y, w, o = {}) => {
  txt(s, big, { x, y, w, h: o.bh ?? 0.7, fontFace: HEAD, fontSize: o.size ?? 40, color: o.color ?? INK, valign: 'bottom' });
  txt(s, label, { x, y: y + (o.bh ?? 0.7) + 0.04, w, h: 0.4, fontFace: MONO, fontSize: o.lsize ?? 9, color: MUT, charSpacing: 1 });
};
const hm = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

let nSlides = 0;
const light = (title, kick, n) => {
  const s = pres.addSlide({ masterName: 'SAYR_LIGHT' });
  s.addText(title, { placeholder: 'title' });
  if (kick) kicker(s, kick);
  const sc = SCRIPT.find((x) => x.n === n);
  s.addNotes(`SPEAKER: ${sc.speaker}\n\n${sc.text}${sc.vocab ? `\n\nVOCABULARY: ${sc.vocab}` : ''}`);
  nSlides++;
  return s;
};

// ============ 01 · Title ============
{
  const s = pres.addSlide({ masterName: 'SAYR_DARK' });
  s.addNotes(`SPEAKER: ${SCRIPT[0].speaker}\n\n${SCRIPT[0].text}\n\nVOCABULARY: ${SCRIPT[0].vocab}`);
  txt(s, 'AL DHAFRA HEALTH FORUM  ·  DEVELOPING HEALTHCARE SERVICES', { x: 0.7, y: 0.5, w: 7.2, h: 0.3, fontFace: MONO, fontSize: 10, color: LINE2, charSpacing: 2 });
  txt(s, 'SAYR', { x: 0.65, y: 1.0, w: 4.6, h: 1.55, fontFace: HEAD, fontSize: 96, bold: true, color: PAPER, charSpacing: 10, valign: 'middle' });
  rect(s, 4.95, 1.36, 0.78, 0.46, { line: COPPER2, lw: 1.5, r: 0.05 });
  txt(s, 'AI', { x: 4.95, y: 1.36, w: 0.78, h: 0.46, fontFace: MONO, fontSize: 18, bold: true, color: COPPER2, align: 'center', valign: 'middle', charSpacing: 3 });
  txt(s, 'Care in Motion.', { x: 0.7, y: 2.6, w: 6.4, h: 0.7, fontFace: HEAD, fontSize: 34, italic: true, color: '8FCBC7' });
  txt(s, 'Every minute matters.\nEvery decision moves the system.', { x: 0.7, y: 3.45, w: 6.4, h: 1.0, fontFace: HEAD, fontSize: 22, color: COPPER_SOFT, paraSpaceAfter: 2 });
  txt(s, 'A simulation-driven healthcare operations decision-support prototype. Synthetic data only.', { x: 0.7, y: 4.55, w: 5.9, h: 0.6, fontSize: 13, color: LINE2 });
  // team
  const names = TEAM.map(([n, g]) => `${n}  ${g}`);
  names.forEach((t, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const [nm, gr] = TEAM[i];
    txt(s, [{ text: nm, options: { color: PAPER } }, { text: '  ' + gr, options: { color: COPPER2, fontFace: MONO, fontSize: 11 } }], { x: 0.7 + col * 3.25, y: 5.45 + row * 0.3, w: 3.2, h: 0.28, fontSize: 12.5 });
  });
  txt(s, 'ADNOC Schools, Madinat Zayed', { x: 0.7, y: 6.5, w: 5, h: 0.3, fontFace: MONO, fontSize: 10.5, color: LINE2, charSpacing: 1 });

  // original flow graphic inspired by the Flow Canvas (illustrative, not data)
  const lanes = [['REG-1', [14, 20], [4, 20]], ['REG-2', [14, 20], [10, 40]], ['VIT-1', [16, 24], [3, 14]], ['VIT-2', [16, 24], [8, 30]], ['GP-1', [28, 40], [2, 12]], ['GP-2', [28, 40], [2, 12]], ['GP-3', [28, 40], [2, 12]], ['LAB-1', [20, 28], [24, 60]], ['CHK-1', [10, 16], [4, 20]]];
  const px0 = 8.55, px1 = 12.7, laneY0 = 1.05, laneH = 0.56;
  const X = (t) => px0 + ((t - 480) / 480) * (px1 - px0);
  const clock = hm('10:50');
  let seed = 7;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  rect(s, 7.35, 0.8, 5.55, 5.95, { fill: '1B2D4D', line: INK2, r: 0.08, name: 'S1_panel' });
  txt(s, 'FLOW CANVAS · ILLUSTRATION OF THE IDEA, NOT DATA', { x: 7.55, y: 6.55, w: 5.2, h: 0.16, fontFace: MONO, fontSize: 7, color: MUT2, charSpacing: 1 });
  [8, 10, 12, 14, 16].forEach((h) => {
    const x = X(h * 60);
    line(s, x, 1.25, x, laneY0 + laneH * 9 + 0.1, { color: INK2, w: 0.5 });
    txt(s, `${String(h).padStart(2, '0')}:00`, { x: x - 0.3, y: 1.1, w: 0.6, h: 0.14, fontFace: MONO, fontSize: 6.5, color: MUT2, align: 'center' });
  });
  lanes.forEach(([id, dur, gap], li) => {
    const y = laneY0 + 0.25 + li * laneH;
    txt(s, id, { x: 7.55, y: y + 0.1, w: 0.75, h: 0.25, fontFace: MONO, fontSize: 8, bold: true, color: LINE2 });
    let t = 485 + Math.floor(rnd() * 20);
    while (t < 955) {
      const d = dur[0] + Math.floor(rnd() * (dur[1] - dur[0]));
      if (id === 'GP-2' && t + d > 630 && t < 810) { t = 810 + 3; continue; }
      const past = t + d <= clock, live = t <= clock && t + d > clock;
      const x0 = X(t), w = Math.max(0.05, X(t + d) - X(t) - 0.02);
      if (past) rect(s, x0, y + 0.08, w, 0.27, { fill: '3A5078', r: 0.03 });
      else if (live) rect(s, x0, y + 0.08, w, 0.27, { fill: TEAL2, r: 0.03 });
      else rect(s, x0, y + 0.08, w, 0.27, { line: LINE2, lw: 0.6, dash: 'dash', r: 0.03 });
      t += d + gap[0] + Math.floor(rnd() * (gap[1] - gap[0]));
    }
    if (id === 'GP-2') {
      rect(s, X(630), y + 0.06, X(810) - X(630), 0.31, { fill: COPPER, tr: 35, line: COPPER2, lw: 1, r: 0.03, name: 'S1_outage' });
      txt(s, 'OUTAGE · 10:30–13:30', { x: X(clock) + 0.1, y: y + 0.12, w: 1.8, h: 0.2, fontFace: MONO, fontSize: 7, bold: true, color: 'FFFFFF' });
    }
  });
  // queue chips in front of the clock on the consultation lanes
  for (let i = 0; i < 7; i++) rect(s, X(clock) - 0.2 - i * 0.075, laneY0 + 0.25 + 4 * laneH - 0.12, 0.06, 0.16, { fill: i > 2 ? COPPER2 : 'F6F2E9', r: 0.02 });
  line(s, X(clock), 1.22, X(clock), laneY0 + laneH * 9 + 0.1, { color: PAPER, w: 1.5, name: 'S1_clock' });
  rect(s, X(clock) - 0.28, 0.98, 0.56, 0.16, { fill: PAPER, r: 0.03 });
  txt(s, '10:50', { x: X(clock) - 0.28, y: 0.98, w: 0.56, h: 0.16, fontFace: MONO, fontSize: 7.5, bold: true, color: INK, align: 'center', valign: 'middle' });
  txt(s, 'One clinician unavailable: the lane is lost, the queue grows, the plan must move.', { x: 7.55, y: 6.27, w: 5.2, h: 0.4, fontSize: 10.5, italic: true, color: COPPER_SOFT });
  nSlides++;
}

// ============ 02 · Problem ============
{
  const s = light('When one delay becomes everyone\'s delay', 'THE PROBLEM', 2);
  const stages = [['Registration', ''], ['Vital signs', ''], ['Consultation', 'one clinician unavailable'], ['Laboratory', 'if needed'], ['Checkout', '']];
  const nw = 1.95, gap = 0.5875, x0 = 0.6, ny = 1.75;
  stages.forEach(([a, b], i) => {
    const x = x0 + i * (nw + gap);
    const hot = i === 2, opt = i === 3;
    s.addShape(R, { x, y: ny, w: nw, h: 0.85, rectRadius: 0.07, fill: { color: hot ? COPPER : PAPER2 }, line: { color: hot ? COPPER : opt ? MUT2 : INK2, width: hot ? 1.5 : 1, dashType: opt ? 'dash' : 'solid' }, objectName: `S2_stage${i}` });
    txt(s, a, { x, y: ny, w: nw, h: 0.85, fontFace: HEAD, fontSize: 17, color: hot ? 'FFFFFF' : INK, align: 'center', valign: 'middle' });
    txt(s, String(i + 1).padStart(2, '0'), { x: x + 0.1, y: ny + 0.06, w: 0.4, h: 0.18, fontFace: MONO, fontSize: 8, color: hot ? COPPER_SOFT : MUT });
    if (b) txt(s, b.toUpperCase(), { x: x - 0.2, y: ny - 0.3, w: nw + 0.4, h: 0.22, fontFace: MONO, fontSize: 8.5, color: hot ? COPPER : MUT, align: 'center', bold: hot, charSpacing: 1 });
    if (i < 4) line(s, x + nw + 0.06, ny + 0.425, x + nw + gap - 0.06, ny + 0.425, { color: INK2, w: 1.5, arrow: true });
  });
  // queue squares under consultation
  const qx = x0 + 2 * (nw + gap);
  const sq = (row, n, y, col, lab) => {
    txt(s, lab, { x: x0, y: y - 0.02, w: 3.6, h: 0.28, fontFace: MONO, fontSize: 9, color: MUT, charSpacing: 1 });
    for (let i = 0; i < n; i++) rect(s, qx + (i % 5) * 0.37 - (row ? 0 : 0), y + Math.floor(i / 5) * 0.34 - 0.0, 0.28, 0.28, { fill: col, r: 0.04, name: row ? `S2_sq${i}` : undefined });
  };
  txt(s, 'CONSULTATION QUEUE AT 11:45 · SAME PATIENTS, SAME SEED', { x: x0, y: 2.95, w: 6.8, h: 0.22, fontFace: MONO, fontSize: 9, color: MUT, charSpacing: 1 });
  txt(s, 'Normal day', { x: 0.6, y: 3.32, w: 2.3, h: 0.3, fontFace: HEAD, fontSize: 16, color: TEAL, italic: true });
  txt(s, 'One clinician out', { x: 0.6, y: 4.0, w: 2.3, h: 0.3, fontFace: HEAD, fontSize: 16, color: COPPER, italic: true });
  for (let i = 0; i < 4; i++) rect(s, 3.0 + i * 0.37, 3.3, 0.28, 0.28, { fill: TEAL2, r: 0.04 });
  for (let i = 0; i < 10; i++) rect(s, 3.0 + (i % 5) * 0.37, 3.98 + Math.floor(i / 5) * 0.34, 0.28, 0.28, { fill: COPPER, r: 0.04, name: `S2_sq${i}` });
  txt(s, '4 waiting\nlongest wait 16 min', { x: 5.1, y: 3.28, w: 2.4, h: 0.55, fontSize: 11.5, color: INK2 });
  txt(s, '10 waiting\nlongest wait 40 min', { x: 5.1, y: 3.98, w: 2.4, h: 0.55, fontSize: 11.5, color: COPPER });
  txt(s, 'Healthcare delays are rarely isolated.', { x: 7.9, y: 3.3, w: 4.8, h: 1.2, fontFace: HEAD, fontSize: 28, italic: true, color: INK, valign: 'middle' });
  const cards = [
    ['Queues grow', '11 waiting vs 5', 'Everyone behind the missing clinician waits. Longest wait 40 min vs 16 min at 11:45.'],
    ['The delay travels', '37 patients', 'delayed 3+ min across 26 hops. Laboratory and checkout feel it later (+76 and +15 min).'],
    ['Journeys lengthen', '60 → 74 min', 'Average time from arrival to departure. 59 of 60 patients finish by 16:00 instead of 60.'],
  ];
  cards.forEach(([a, b, c], i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 4.95, 3.95, 1.7);
    txt(s, a.toUpperCase(), { x: x + 0.22, y: 5.08, w: 3.5, h: 0.2, fontFace: MONO, fontSize: 9, color: COPPER, charSpacing: 1 });
    txt(s, b, { x: x + 0.22, y: 5.3, w: 3.5, h: 0.5, fontFace: HEAD, fontSize: 26, color: INK });
    txt(s, c, { x: x + 0.22, y: 5.85, w: 3.55, h: 0.7, fontSize: 10.5, color: INK2 });
  });
  source(s, 'Hypothetical outpatient journey; figures from SAYR\'s simulation of a fictional clinic (seed 7, staff-unavailability scenario, 10:30–13:30). No claim is made about any Al Dhafra facility.');
}

// ============ 03 · Research question ============
{
  const s = light('What if we could test operational decisions before they affect real patients?', 'OUR RESEARCH QUESTION', 3);
  txt(s, 'SAYR is a simulation-driven healthcare operations decision-support prototype.', { x: 0.6, y: 1.8, w: 11, h: 0.4, fontSize: 15, color: INK2 });
  const steps = [['Model a clinic', 'Control Room'], ['Simulate operations', 'Control Room'], ['Introduce a disruption', 'Stress Controls'], ['Trace consequences', 'Ripple Trace'], ['Optimize a plan', 'Reflow Studio'], ['Review and approve', 'Action Desk'], ['Measure the result', 'Minutes Ledger']];
  const w = 1.6, g = 0.1333;
  steps.forEach(([a, b], i) => {
    const x = 0.6 + i * (w + g);
    const col = [NAVY, NAVY, COPPER, COPPER, TEAL, NAVY, TEAL][i];
    s.addShape(R, { x, y: 2.5, w, h: 1.75, rectRadius: 0.07, fill: { color: col }, line: { color: col, width: 0.5 }, objectName: `S3_step${i}` });
    txt(s, String(i + 1).padStart(2, '0'), { x: x + 0.14, y: 2.6, w: 0.6, h: 0.22, fontFace: MONO, fontSize: 10, color: COPPER_SOFT });
    txt(s, a, { x: x + 0.12, y: 2.9, w: w - 0.18, h: 0.9, fontFace: HEAD, fontSize: 14, bold: true, color: 'FFFFFF' });
    txt(s, b.toUpperCase(), { x: x + 0.14, y: 3.85, w: w - 0.2, h: 0.3, fontFace: MONO, fontSize: 8, color: COPPER_SOFT, charSpacing: 1 });
  });
  // architecture band
  rect(s, 0.6, 4.6, 12.13, 1.95, { fill: PAPER3, line: LINE, r: 0.08 });
  txt(s, 'ONE DETERMINISTIC SIMULATION STATE · EVERY SCREEN READS THE SAME DATA', { x: 0.85, y: 4.72, w: 8, h: 0.22, fontFace: MONO, fontSize: 9, color: COPPER, charSpacing: 1.5 });
  const parts = [['Synthetic clinic', 'seeded patients, 9 resources', INK2], ['Discrete-event simulation', 'queues, services, outages, event log', NAVY], ['Forecast baseline', 'hourly arrivals, evaluated', MUT], ['Reflow', 'constraint-aware local search', TEAL], ['Explanations', 'from the event log, no language model', MUT], ['Person approves', 'then the Ledger measures', COPPER]];
  parts.forEach(([a, b, c], i) => {
    const x = 0.85 + i * 1.95;
    rect(s, x, 5.05, 1.8, 1.25, { fill: PAPER2, line: c, lw: 1.25, r: 0.06 });
    txt(s, a, { x: x + 0.1, y: 5.13, w: 1.6, h: 0.5, fontFace: HEAD, fontSize: 12.5, bold: true, color: c === MUT ? INK2 : c });
    txt(s, b, { x: x + 0.1, y: 5.68, w: 1.6, h: 0.55, fontSize: 9.5, color: INK2 });
    if (i < 5) txt(s, '›', { x: x + 1.78, y: 5.38, w: 0.2, h: 0.4, fontFace: HEAD, fontSize: 20, color: MUT2, align: 'center' });
  });
  source(s, 'No trained machine-learning model is used. Methods: simulation, a forecasting baseline evaluated against two simpler ones, and a heuristic optimizer. Source: SAYR About, methods & credits.');
}

// ============ 04 · Digital twin ============
{
  const s = light('A digital twin of the clinic', 'THE SIMULATION  ·  WOW 1: THE SYSTEM BREAKS', 4);
  const iw = 7.15, ih = iw * 1860 / 2690, ix = 0.6, iy = 1.5;
  card(s, ix - 0.05, iy - 0.05, iw + 0.1, ih + 0.1, { line: LINE2 });
  s.addImage({ path: S('pg-control-staff-1145'), x: ix, y: iy, w: iw, h: ih, altText: 'SAYR Control Room at 11:45 with Clinician B unavailable', objectName: 'S4_shot' });
  const P = (xd, yd) => [ix + (xd * 1.364 / 2690) * iw, iy + (yd * 1.364 / 1860) * ih];
  const callouts = [[1, 600, 690], [2, 105, 740], [3, 745, 712], [4, 733, 487], [5, 245, 775], [6, 30, 1140]];
  callouts.forEach(([n, xd, yd]) => { const [x, y] = P(xd, yd); bubble(s, n, x, y, { name: `S4_c${n}` }); });
  const lab = [['Patient pathways', 'dotted links from a patient\'s stage to the next'], ['Resource lanes', 'nine lanes; the hatched block is the outage'], ['Queues', 'chips stacked in front of the clock, longest first'], ['Clock', 'movable; the sim recalculates from it'], ['Utilisation', 'small bar on each lane: busy share so far'], ['Operational events', 'timeline written from the event log']];
  txt(s, 'READING THE CANVAS', { x: 8.55, y: 1.5, w: 4, h: 0.22, fontFace: MONO, fontSize: 9, color: COPPER, charSpacing: 1.5 });
  lab.forEach(([a, b], i) => {
    const y = 1.82 + i * 0.5;
    bubble(s, i + 1, 8.72, y + 0.14);
    txt(s, [{ text: a, options: { bold: true, fontFace: HEAD, fontSize: 13 } }, { text: '  ' + b, options: { fontSize: 10, color: INK2 } }], { x: 8.98, y, w: 3.8, h: 0.45 });
  });
  card(s, 8.55, 4.95, 4.18, 1.7);
  txt(s, 'DISCRETE-EVENT SIMULATION, IN PLAIN WORDS', { x: 8.75, y: 5.05, w: 3.9, h: 0.22, fontFace: MONO, fontSize: 8.5, color: COPPER, charSpacing: 1 });
  txt(s, 'The simulator jumps from event to event (arrive, wait, start, finish, transfer, outage) and logs each one. A fixed seed regenerates the same day, so differences come from what we change.', { x: 8.75, y: 5.3, w: 3.85, h: 1.3, fontSize: 10.5, color: INK2 });
  source(s, 'Default clinic: 60 synthetic patients (48 scheduled, 12 walk-in); 2 registration, 2 vital-sign, 3 consultation stations (clinician + room), 1 laboratory, 1 checkout; 08:00–16:00. Shot: seed 7, staff scenario, clock 11:45.');
}

// ============ 05 · Disruption experiment ============
{
  const s = light('The disruption experiment', 'STRESS CONTROLS', 5);
  const ih = 5.2, iw = ih * 2680 / 2406, ix = 0.6, iy = 1.48;
  card(s, ix - 0.05, iy - 0.05, iw + 0.1, ih + 0.1, { line: LINE2 });
  s.addImage({ path: S('pg-05-stress-tall'), x: ix, y: iy, w: iw, h: ih, altText: 'SAYR Stress Controls with Staff unavailability selected', objectName: 'S5_shot' });
  const rx = 6.75, rw = 5.98;
  txt(s, 'FOUR IMPLEMENTED SCENARIOS · ONE DAY, 08:00–16:00', { x: rx, y: 1.5, w: rw, h: 0.22, fontFace: MONO, fontSize: 9, color: COPPER, charSpacing: 1.2 });
  const ax0 = 9.0, ax1 = 12.6, X = (t) => ax0 + ((t - 480) / 480) * (ax1 - ax0);
  [8, 10, 12, 14, 16].forEach((h) => { line(s, X(h * 60), 1.85, X(h * 60), 3.5, { color: LINE2, w: 0.5 }); txt(s, `${h}:00`, { x: X(h * 60) - 0.3, y: 3.52, w: 0.6, h: 0.16, fontFace: MONO, fontSize: 7.5, color: MUT, align: 'center' }); });
  const rows = [['Staff unavailability', 'clinician out 10:30–13:30', 630, 810, COPPER, true], ['Walk-in surge', '8 patients around 11:00', 660, 668, NAVY2, false], ['Laboratory slowdown', '+50% from 12:00', 720, 960, MUT, false], ['Room closure', 'from 13:00 to end', 780, 960, MUT, false]];
  rows.forEach(([a, b, t0, t1, c, big], i) => {
    const y = 1.92 + i * 0.4;
    txt(s, a, { x: rx, y: y + 0.02, w: 2.2, h: 0.3, fontFace: HEAD, fontSize: big ? 14 : 12, bold: big, color: big ? COPPER : INK2 });
    rect(s, X(t0), y + (big ? 0.0 : 0.06), Math.max(0.1, X(t1) - X(t0)), big ? 0.32 : 0.2, { fill: c, tr: big ? 0 : 20, r: 0.03, name: `S5_bar${i}` });
    if (big) txt(s, 'FEATURED', { x: X(t0) + 0.08, y: y + 0.07, w: 1.2, h: 0.18, fontFace: MONO, fontSize: 7.5, bold: true, color: 'FFFFFF', charSpacing: 1 });
    else txt(s, b, { x: X(t1 > 900 ? t0 : t1) + (t1 > 900 ? 0.08 : 0.15), y: y + 0.07, w: 2.4, h: 0.2, fontSize: 8.5, color: t1 > 900 ? 'FFFFFF' : MUT });
  });
  const hdr = (t, al = 'right') => ({ text: t, options: { bold: true, fontFace: MONO, fontSize: 8.5, color: MUT, align: al, fill: { color: PAPER3 }, border: [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: LINE2 }, { type: 'none' }] } });
  const c = (t, o = {}) => ({ text: t, options: { fontSize: 12, color: INK, align: 'right', fontFace: BODY, border: [{ type: 'none' }, { type: 'none' }, { pt: 0.5, color: LINE }, { type: 'none' }], ...o } });
  s.addTable(
    [
      [hdr('SAME 60 PATIENTS · SEED 7', 'left'), hdr('NORMAL'), hdr('STAFF OUT')],
      [c('Total waiting (min)', { align: 'left' }), c('1,056'), c('1,946', { color: COPPER, bold: true })],
      [c('Median wait (min)', { align: 'left' }), c('17'), c('28', { color: COPPER, bold: true })],
      [c('90th-percentile wait (min)', { align: 'left' }), c('42'), c('75', { color: COPPER, bold: true })],
      [c('Staff overtime (min)', { align: 'left' }), c('0'), c('24', { color: COPPER, bold: true })],
      [c('Journeys done by 16:00', { align: 'left' }), c('60'), c('59', { color: COPPER, bold: true })],
    ],
    { x: rx, y: 3.9, w: rw, colW: [3.2, 1.3, 1.48], rowH: 0.36, fontFace: BODY, valign: 'middle', margin: [0, 0.08, 0, 0.08], objectName: 'S5_table' },
  );
  txt(s, 'We can investigate operational pressure without experimenting on real patients.', { x: rx, y: 6.12, w: rw, h: 0.55, fontFace: HEAD, fontSize: 14.5, italic: true, color: INK });
  source(s, 'Source: SAYR Stress Controls, "Disruption impact · same patients", full replays of the same day. The other three scenarios are implemented but are not quantified in this deck.');
}

// ============ 06 · Ripple ============
{
  const s = light('Ripple Trace: following the consequences', 'WOW 2 · TRACE', 6);
  const iw = 6.9, ih = iw * 1860 / 2728, ix = 0.6, iy = 1.5;
  card(s, ix - 0.05, iy - 0.05, iw + 0.1, ih + 0.1, { line: LINE2 });
  s.addImage({ path: S('pg-07-ripple-6hops'), x: ix, y: iy, w: iw, h: ih, altText: 'SAYR Ripple Trace showing the delay tree from the outage', objectName: 'S6_shot' });
  txt(s, 'THE CHAIN, READ FROM THE TREE · +N MIN = LATER START THAN THE SAME DAY WITHOUT THE OUTAGE', { x: 7.8, y: 1.5, w: 4.95, h: 0.4, fontFace: MONO, fontSize: 8, color: COPPER, charSpacing: 0.8 });
  const chain = [['Clinician B unavailable', '10:30–13:30 · station GP-2 lost', COPPER, 'FFFFFF'], ['J-025 · GP-3 · 10:59', '+6 min · waited for a station', PAPER2, INK], ['J-011 · GP-3 · 11:07', '+9 min · waited for GP-3', PAPER2, INK], ['J-028 · GP-3 · 11:12', '+9 min · waited for GP-3', PAPER2, INK], ['J-029 · GP-3 · 11:24', '+19 min · waited for GP-3', PAPER2, INK], ['J-032 · GP-3 · 11:43', '+19 min · waited for GP-3', PAPER2, INK]];
  chain.forEach(([a, b, fill, col], i) => {
    const y = 2.0 + i * 0.6;
    s.addShape(R, { x: 7.8, y, w: 3.15, h: 0.46, rectRadius: 0.05, fill: { color: fill }, line: { color: i ? COPPER2 : COPPER, width: 1 }, objectName: `S6_chain${i}` });
    txt(s, [{ text: a, options: { bold: true, fontFace: MONO, fontSize: 9.5, color: col } }, { text: '\n' + b, options: { fontSize: 8.5, color: i ? INK2 : COPPER_SOFT } }], { x: 7.92, y: y + 0.03, w: 3.0, h: 0.42, valign: 'middle' });
    if (i < 5) line(s, 9.1, y + 0.46, 9.1, y + 0.6, { color: COPPER2, w: 1.5, arrow: true });
  });
  s.addShape(R, { x: 11.25, y: 3.2, w: 1.48, h: 0.46, rectRadius: 0.05, fill: { color: TEAL_SOFT }, line: { color: TEAL, width: 1 }, objectName: 'S6_branch' });
  txt(s, [{ text: 'J-028 · LAB-1 11:27', options: { bold: true, fontFace: MONO, fontSize: 8, color: TEAL } }, { text: '\n+8 min · previous stage', options: { fontSize: 8, color: INK2 } }], { x: 11.3, y: 3.22, w: 1.4, h: 0.42, valign: 'middle' });
  line(s, 10.95, 3.43, 11.25, 3.43, { color: TEAL, w: 1.25, arrow: true, name: 'S6_branchline' });
  // stats
  [['37', 'PATIENTS\nDELAYED ≥ 3 MIN', INK], ['890', 'WAITING MIN\nCAUSED', COPPER], ['26', 'HOPS TO THE\nLAST DELAY', INK], ['+24', 'MIN EXTRA\nOVERTIME', INK]].forEach(([b, l, c], i) => {
    const x = 7.8 + i * 1.24;
    txt(s, b, { x, y: 5.72, w: 1.2, h: 0.55, fontFace: HEAD, fontSize: 30, color: c, valign: 'bottom' });
    txt(s, l, { x, y: 6.3, w: 1.2, h: 0.4, fontFace: MONO, fontSize: 7, color: MUT });
  });
  source(s, 'SAYR explains not just where a delay occurs, but how it spreads. Every link is a record in the event log (resource the appointment waited for, or its previous stage). Seed 7, staff scenario.');
}

// ============ 07 · Reflow (centerpiece) ============
{
  const s = light('Reflow Studio: from disruption to decision', 'WOW 2 · THE SYSTEM REFLOWS', 7);
  const iw = 5.55, ih = iw * 1082 / 1876, y0 = 1.42;
  const shots = [['c-reflow-before', 0.6, 'CURRENT PLAN', '1,698 planned waiting min', '43 appointments still expected to wait 15 min or more', MUT], ['c-reflow-after', 7.18, 'PROPOSED PLAN', '1,619 planned waiting min  (−80)', '42 changes: 6 reassigned, 36 re-sequenced · 9 of 9 constraints kept', TEAL]];
  shots.forEach(([f, x, a, b, c, col], i) => {
    card(s, x - 0.04, y0 - 0.04, iw + 0.08, ih + 0.08, { line: LINE2 });
    s.addImage({ path: S(f), x, y: y0, w: iw, h: ih, altText: `${a} in Reflow Studio`, objectName: `S7_shot${i}` });
    txt(s, a, { x, y: y0 + ih + 0.13, w: 3, h: 0.2, fontFace: MONO, fontSize: 9, bold: true, color: col, charSpacing: 1.5 });
    txt(s, b, { x, y: y0 + ih + 0.33, w: iw, h: 0.36, fontFace: HEAD, fontSize: 17, color: i ? TEAL : INK });
    txt(s, c, { x, y: y0 + ih + 0.7, w: iw, h: 0.22, fontSize: 9.5, color: INK2 });
  });
  s.addShape(OVAL, { x: 6.465, y: y0 + ih / 2 - 0.2, w: 0.4, h: 0.4, fill: { color: COPPER }, line: { color: PAPER, width: 2 } });
  txt(s, '→', { x: 6.465, y: y0 + ih / 2 - 0.2, w: 0.4, h: 0.4, fontFace: BODY, fontSize: 16, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
  // numbered callouts on the proposed plan: fractions of the crop (x, y)
  [[1, 0.413, 0.628], [2, 0.32, 0.55], [3, 0.558, 0.506], [4, 0.28, 0.463]].forEach(([n, fx, fy]) => bubble(s, n, 7.18 + fx * iw, y0 + fy * ih, { name: `S7_c${n}` }));
  txt(s, [{ text: '1', options: { color: COPPER, bold: true } }, { text: ' reassignment   ', options: {} }, { text: '2', options: { color: COPPER, bold: true } }, { text: ' outage constraint   ', options: {} }, { text: '3', options: { color: COPPER, bold: true } }, { text: ' re-sequenced (wait change)   ', options: {} }, { text: '4', options: { color: COPPER, bold: true } }, { text: ' remaining delay', options: {} }], { x: 7.18, y: y0 + ih + 0.95, w: iw, h: 0.2, fontSize: 9, color: INK2 });
  // one genuine appointment movement, as an editable animation target
  const by = 5.82;
  card(s, 0.6, by, 8.0, 1.0);
  txt(s, 'ONE REAL MOVE · J-036 ON GP-3 · START 12:18 → 11:57 · −45 MIN WAIT', { x: 0.8, y: by + 0.06, w: 7.6, h: 0.2, fontFace: MONO, fontSize: 8.5, color: COPPER, charSpacing: 1 });
  const tx0 = 1.5, tx1 = 8.2, TX = (t) => tx0 + ((t - hm('11:45')) / 45) * (tx1 - tx0);
  line(s, tx0, by + 0.77, tx1, by + 0.77, { color: LINE2, w: 1 });
  ['11:45', '12:00', '12:15', '12:30'].forEach((t) => { line(s, TX(hm(t)), by + 0.73, TX(hm(t)), by + 0.81, { color: MUT2, w: 1 }); txt(s, t, { x: TX(hm(t)) - 0.3, y: by + 0.82, w: 0.6, h: 0.15, fontFace: MONO, fontSize: 7.5, color: MUT, align: 'center' }); });
  txt(s, 'GP-3', { x: 0.8, y: by + 0.45, w: 0.6, h: 0.2, fontFace: MONO, fontSize: 8.5, bold: true, color: INK });
  txt(s, '11:57', { x: TX(hm('11:57')) - 0.4, y: by + 0.28, w: 0.8, h: 0.14, fontFace: MONO, fontSize: 8, color: TEAL, align: 'center' });
  s.addShape(R, { x: TX(hm('11:57')) - 0.4, y: by + 0.42, w: 0.8, h: 0.28, rectRadius: 0.04, fill: { type: 'none' }, line: { color: TEAL, width: 1.25, dashType: 'dash' }, objectName: 'S7_target' });
  txt(s, '12:18', { x: TX(hm('12:18')) - 0.4, y: by + 0.28, w: 0.8, h: 0.14, fontFace: MONO, fontSize: 8, color: MUT, align: 'center' });
  s.addShape(R, { x: TX(hm('12:18')) - 0.4, y: by + 0.42, w: 0.8, h: 0.28, rectRadius: 0.04, fill: { color: NAVY }, line: { color: NAVY, width: 1 }, objectName: 'S7_chip' });
  txt(s, 'J-036', { x: TX(hm('12:18')) - 0.4, y: by + 0.42, w: 0.8, h: 0.28, fontFace: MONO, fontSize: 9.5, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', objectName: 'S7_chiptext' });
  // decision controls (replica of the app's buttons)
  card(s, 8.8, by, 3.93, 1.0);
  txt(s, 'DECISION CONTROLS · NOTHING APPLIES UNTIL A PERSON CHOOSES', { x: 8.95, y: by + 0.06, w: 3.7, h: 0.2, fontFace: MONO, fontSize: 7, color: COPPER });
  rect(s, 8.95, by + 0.32, 2.1, 0.34, { fill: NAVY, r: 0.05 });
  txt(s, 'Accept in the simulation', { x: 8.95, y: by + 0.32, w: 2.1, h: 0.34, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
  rect(s, 11.15, by + 0.32, 0.8, 0.34, { fill: PAPER2, line: LINE2, r: 0.05 });
  txt(s, 'Reject', { x: 11.15, y: by + 0.32, w: 0.8, h: 0.34, fontSize: 10, color: INK, align: 'center', valign: 'middle' });
  txt(s, 'Heuristic search: no guarantee of a global optimum.', { x: 8.95, y: by + 0.72, w: 3.7, h: 0.22, fontSize: 9, italic: true, color: INK2 });
  source(s, 'Source: SAYR Reflow Studio and Action Desk, seed 7, staff scenario, plan captured at 10:50, objective "Fewest waiting minutes". Planned values use booked lengths; the Ledger measures the realised result.', 6.87);
}

// ============ 08 · Human remains in control ============
{
  const s = light('The human remains in control', 'ACTION DESK  ·  WOW 2', 8);
  const iw = 4.2, ih = iw * 2262 / 1876;
  card(s, 0.56, 1.46, iw + 0.08, ih + 0.08, { line: LINE2 });
  s.addImage({ path: S('c-desk-card'), x: 0.6, y: 1.5, w: iw, h: ih, altText: 'SAYR Action Desk proposal card', objectName: 'S8_shot' });
  // workflow
  const wf = [['Reflow proposes', 'up to 3 alternatives', NAVY], ['A person reviews', 'changes, constraints, trade-offs', INK2], ['Approve and apply', 'to the simulation only', TEAL], ['Audit trail', 'entry is written', COPPER], ['Ledger measures', 'what actually happened', NAVY]];
  const wx = 5.15, ww = 1.38, wg = 0.17;
  wf.forEach(([a, b, c], i) => {
    const x = wx + i * (ww + wg);
    s.addShape(R, { x, y: 1.5, w: ww, h: 0.95, rectRadius: 0.06, fill: { color: PAPER2 }, line: { color: c, width: 1.5 }, objectName: `S8_wf${i}` });
    txt(s, a, { x: x + 0.08, y: 1.56, w: ww - 0.16, h: 0.45, fontFace: HEAD, fontSize: 12, bold: true, color: c });
    txt(s, b, { x: x + 0.08, y: 2.02, w: ww - 0.16, h: 0.4, fontSize: 8.5, color: INK2 });
    if (i < 4) line(s, x + ww + 0.01, 1.97, x + ww + wg - 0.01, 1.97, { color: MUT2, w: 1.25, arrow: true });
  });
  txt(s, 'Reject leaves today\'s plan untouched.', { x: 5.15, y: 2.55, w: 4, h: 0.25, fontSize: 10, italic: true, color: COPPER });
  const items = [
    ['Proposed changes', '42 appointments: 6 reassigned, 36 re-sequenced. The card lists each move, e.g. J-036 on GP-3, 12:18 → 11:57.'],
    ['Constraints satisfied', '9 of 9 checks pass, each with evidence (for example 168 appointments checked for resource exclusivity).'],
    ['Trade-offs', '15 appointments wait less, 16 wait longer, none by more than 30 min. 43 still expected to wait 15 min or more.'],
    ['Accountability', 'The audit trail records each situation and decision. Protected slots are assigned externally and never inferred from clinical information.'],
  ];
  items.forEach(([a, b], i) => {
    const y = 3.0 + i * 0.8;
    rect(s, 5.15, y, 0.06, 0.62, { fill: COPPER, round: false });
    txt(s, a, { x: 5.35, y, w: 3.2, h: 0.25, fontFace: HEAD, fontSize: 13.5, bold: true, color: INK });
    txt(s, b, { x: 5.35, y: y + 0.26, w: 4.0, h: 0.5, fontSize: 9.5, color: INK2 });
  });
  img(s, 'c-desk-audit', 9.65, 3.0, 3.08, 3.08 * 422 / 680, { alt: 'Audit trail panel', name: 'S8_audit' });
  txt(s, 'AUDIT TRAIL (AFTER APPROVAL)', { x: 9.65, y: 2.78, w: 3.1, h: 0.2, fontFace: MONO, fontSize: 8, color: COPPER, charSpacing: 1 });
  rect(s, 9.65, 4.95, 3.08, 1.7, { fill: INK, r: 0.07 });
  txt(s, 'Intelligent recommendations should support accountability, not replace it.', { x: 9.82, y: 5.05, w: 2.8, h: 1.5, fontFace: HEAD, fontSize: 15, italic: true, color: PAPER, valign: 'middle' });
  source(s, 'Source: SAYR Action Desk. SAYR does not autonomously determine clinical priorities. Approval applies a plan to the simulation only; the app never changes real hospital operations.');
}

// ============ 09 · Minutes Ledger ============
{
  const s = light('Minutes Ledger: measured, not assumed', 'WOW 3 · THE MINUTES ARE ACCOUNTED FOR', 9);
  // big numbers
  txt(s, '−48', { x: 0.6, y: 1.35, w: 1.9, h: 0.9, fontFace: HEAD, fontSize: 60, color: TEAL, valign: 'middle' });
  txt(s, 'min', { x: 2.35, y: 1.65, w: 0.6, h: 0.5, fontSize: 18, color: MUT, valign: 'bottom' });
  txt(s, 'MEASURED CHANGE IN WAITING\n−2.5% · approved plan, realised durations', { x: 3.05, y: 1.5, w: 3.4, h: 0.6, fontFace: MONO, fontSize: 8.5, color: INK2, charSpacing: 0.6 });
  txt(s, '−80', { x: 0.6, y: 2.2, w: 1.1, h: 0.4, fontFace: HEAD, fontSize: 24, color: MUT2, valign: 'middle' });
  txt(s, 'min  WHAT THE PLANNER PROJECTED (booked lengths)', { x: 1.5, y: 2.28, w: 5, h: 0.3, fontFace: MONO, fontSize: 8.5, color: MUT, valign: 'middle' });
  // waterfall made of shapes (editable). axis min 870
  const wf = [['Normal\noperations', 1056, 'total'], ['Disruption:\nstaff out', 890, 'up'], ['Hold current\nplan fixed', -27, 'down'], ['Re-seq.\nCHK-1', 0, 'down'], ['Re-seq.\nGP-1', -5, 'down'], ['Re-seq.\nGP-3', -19, 'down'], ['Other', 3, 'up'], ['With the\nproposal', 1898, 'total']];
  const cx0 = 0.9, cx1 = 6.55, cy0 = 2.85, cy1 = 5.15, vmin = 870, vmax = 2060;
  const Y = (v) => cy1 - ((v - vmin) / (vmax - vmin)) * (cy1 - cy0);
  [870, 1168, 1465, 1763, 2060].forEach((v) => { line(s, cx0, Y(v), cx1, Y(v), { color: LINE, w: 0.5 }); txt(s, v.toLocaleString('en-US'), { x: 0.2, y: Y(v) - 0.08, w: 0.65, h: 0.16, fontFace: MONO, fontSize: 7, color: MUT, align: 'right' }); });
  const bw = 0.5, step = (cx1 - cx0) / wf.length;
  let run = 0;
  wf.forEach(([lab, v, kind], i) => {
    const x = cx0 + i * step + (step - bw) / 2;
    let top, bot, col;
    if (kind === 'total') { top = v; bot = vmin; col = NAVY; run = v; }
    else { const nv = run + v; top = Math.max(run, nv); bot = Math.min(run, nv); col = v > 0 ? COPPER : TEAL; run = nv; }
    const h = Math.max(0.025, Y(bot) - Y(top));
    rect(s, x, Y(top), bw, h, { fill: col, round: false, name: `S9_bar${i}` });
    const shown = kind === 'total' ? v.toLocaleString('en-US') : (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v);
    txt(s, shown, { x: x - 0.2, y: Y(top) - 0.2, w: bw + 0.4, h: 0.18, fontFace: MONO, fontSize: 8.5, bold: true, color: col === NAVY ? INK : col, align: 'center' });
    txt(s, lab, { x: x - 0.25, y: cy1 + 0.07, w: bw + 0.5, h: 0.4, fontSize: 7.5, color: INK2, align: 'center' });
  });
  txt(s, 'Total patient waiting minutes · axis starts at 870 · each bar is a separate replay', { x: 0.9, y: 2.62, w: 5.7, h: 0.18, fontFace: MONO, fontSize: 7.5, color: MUT });
  // conditions
  card(s, 0.6, 5.7, 6.0, 1.0);
  txt(s, 'COMPARISON CONDITIONS', { x: 0.78, y: 5.77, w: 3, h: 0.18, fontFace: MONO, fontSize: 8, color: COPPER, charSpacing: 1 });
  txt(s, 'Scenario: staff unavailability (Clinician B, 10:30–13:30) · Seed 7 · 60 synthetic patients\nBaseline policy: first come, first served · Reflow at 10:50, objective "fewest waiting minutes"\nSame patients, arrivals and realised durations in all three runs; the bars add up exactly', { x: 0.78, y: 5.97, w: 5.75, h: 0.7, fontSize: 9, color: INK2 });
  // table
  const H = (t, al = 'right') => ({ text: t, options: { bold: true, fontFace: MONO, fontSize: 8, color: MUT, align: al, fill: { color: PAPER3 }, border: [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: LINE2 }, { type: 'none' }] } });
  const C = (t, o = {}) => ({ text: t, options: { fontSize: 10.5, color: INK, align: 'right', border: [{ type: 'none' }, { type: 'none' }, { pt: 0.5, color: LINE }, { type: 'none' }], ...o } });
  const good = (t) => C(t, { color: TEAL, bold: true, fontFace: MONO, fontSize: 10 });
  const bad = (t) => C(t, { color: COPPER, bold: true, fontFace: MONO, fontSize: 10 });
  const neu = (t) => C(t, { color: MUT, fontFace: MONO, fontSize: 10 });
  const rows = [
    [H('METRIC', 'left'), H('NORMAL'), H('DISRUPTED'), H('OPTIMIZED'), H('Δ')],
    [C('Total waiting (min)', { align: 'left' }), C('1,056'), C('1,946'), C('1,898'), good('−48')],
    [C('Mean wait per patient', { align: 'left' }), C('18'), C('32'), C('32'), good('−0.8')],
    [C('Median wait per patient', { align: 'left' }), C('17'), C('28'), C('29'), bad('+1.3')],
    [C('90th-percentile wait', { align: 'left' }), C('42'), C('75'), C('71'), good('−3.6')],
    [C('Throughput by 16:00', { align: 'left' }), C('60'), C('59'), C('59'), neu('±0')],
    [C('Incomplete at 16:00', { align: 'left' }), C('0'), C('1'), C('1'), neu('±0')],
    [C('Resource utilisation', { align: 'left' }), C('47%'), C('49%'), C('49%'), neu('±0')],
    [C('Staff overtime (min)', { align: 'left' }), C('0'), C('24'), C('22'), good('−1.5')],
    [C('Rescheduled appointments', { align: 'left' }), C('0'), C('0'), C('42'), neu('+42')],
    [C('Constraint violations', { align: 'left' }), C('0'), C('0'), C('0'), neu('0')],
  ];
  s.addTable(rows, { x: 6.95, y: 1.45, w: 5.78, colW: [2.18, 0.8, 0.98, 0.98, 0.84], rowH: 0.36, fontFace: BODY, valign: 'middle', margin: [0, 0.07, 0, 0.07], objectName: 'S9_table' });
  txt(s, 'Δ = optimized − disrupted. The 90th percentile improved while the median rose: the Ledger reports trade-offs, not one score.', { x: 6.95, y: 5.55, w: 5.78, h: 0.5, fontSize: 10, italic: true, color: INK2 });
  txt(s, 'SAYR evaluates whether an intervention helped, what it cost, and what trade-offs remain.', { x: 6.95, y: 6.1, w: 5.78, h: 0.6, fontFace: HEAD, fontSize: 14.5, italic: true, color: INK });
  source(s, 'Source: SAYR Minutes Ledger (published app). Waiting = ready to start of service. Simulated, operational measures only; fewer waiting minutes is not evidence of better clinical care.');
}

// ============ 10 · Fairness ============
{
  const s = light('Efficiency without overlooking fairness', 'WOW 3 · WHO MAY BE MADE WORSE OFF', 10);
  txt(s, 'WAIT AT THE 90TH PERCENTILE, BY GROUP (MIN)', { x: 0.6, y: 1.4, w: 6, h: 0.2, fontFace: MONO, fontSize: 8.5, color: COPPER, charSpacing: 1 });
  s.addChart(pres.charts.BAR, [
    { name: 'Normal', labels: ['Scheduled (48)', 'Walk-in (12)', 'Morning (40)', 'Afternoon (20)'], values: [41, 51, 41, 45] },
    { name: 'Disrupted', labels: ['Scheduled (48)', 'Walk-in (12)', 'Morning (40)', 'Afternoon (20)'], values: [74, 73, 76, 58] },
    { name: 'Optimized', labels: ['Scheduled (48)', 'Walk-in (12)', 'Morning (40)', 'Afternoon (20)'], values: [62, 77, 80, 57] },
  ], {
    x: 0.5, y: 1.6, w: 6.5, h: 3.1, barDir: 'col', barGrouping: 'clustered', barGapWidthPct: 60,
    chartColors: [MUT2, COPPER, TEAL], showValue: true, dataLabelFontSize: 9, dataLabelColor: INK, dataLabelFontFace: 'Consolas', dataLabelPosition: 'outEnd',
    catAxisLabelFontSize: 10, catAxisLabelColor: INK2, catAxisLabelFontFace: BODY, valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' },
    showLegend: true, legendPos: 'b', legendFontSize: 9.5, legendColor: INK2, legendFontFace: BODY, valAxisMinVal: 0, valAxisMaxVal: 95,
  });
  [['10', 'WAIT LONGER\n(≥ 5 min)', COPPER], ['7', 'WAIT LESS\n(≥ 5 min)', TEAL], ['43', 'ABOUT\nTHE SAME', INK]].forEach(([b, l, c], i) => {
    const x = 0.6 + i * 2.1;
    txt(s, b, { x, y: 4.8, w: 0.9, h: 0.65, fontFace: HEAD, fontSize: 38, color: c, valign: 'bottom' });
    txt(s, l, { x: x + (b.length > 1 ? 0.8 : 0.55), y: 5.0, w: 1.2, h: 0.45, fontFace: MONO, fontSize: 8, color: MUT });
  });
  txt(s, 'Optimized vs disrupted, same patients. Largest increases: J-054 +18 min, J-049 +16, J-045 (walk-in) +14, J-048 +14. Priority inversions 48 → 46.', { x: 0.6, y: 5.6, w: 6.3, h: 0.5, fontSize: 9.5, color: INK2 });
  txt(s, 'A better average does not automatically mean a fairer system.', { x: 0.6, y: 6.15, w: 6.3, h: 0.55, fontFace: HEAD, fontSize: 16, italic: true, color: INK });
  // right: policies table
  txt(s, 'SCHEDULING POLICIES · SAME DISRUPTED DAY', { x: 7.4, y: 1.4, w: 5.3, h: 0.2, fontFace: MONO, fontSize: 8.5, color: COPPER, charSpacing: 1 });
  const H = (t, al = 'right') => ({ text: t, options: { bold: true, fontFace: MONO, fontSize: 8, color: MUT, align: al, fill: { color: PAPER3 }, border: [{ type: 'none' }, { type: 'none' }, { pt: 0.75, color: LINE2 }, { type: 'none' }] } });
  const C = (t, o = {}) => ({ text: t, options: { fontSize: 10.5, color: INK, align: 'right', border: [{ type: 'none' }, { type: 'none' }, { pt: 0.5, color: LINE }, { type: 'none' }], ...o } });
  s.addTable([
    [H('POLICY', 'left'), H('TOTAL MIN'), H('P90'), H('INVERSIONS')],
    [C('First come, first served', { align: 'left' }), C('1,946'), C('75'), C('48')],
    [C('Priority with aging', { align: 'left' }), C('1,973'), C('67'), C('23', { color: TEAL, bold: true })],
    [C('Shortest task first (aged)', { align: 'left' }), C('1,616', { color: TEAL, bold: true }), C('65'), C('45')],
  ], { x: 7.4, y: 1.65, w: 5.33, colW: [2.2, 1.0, 0.7, 1.43], rowH: 0.34, fontFace: BODY, valign: 'middle', margin: [0, 0.07, 0, 0.07], objectName: 'S10_table' });
  txt(s, 'Different objectives, different trade-offs: shortest-first needs the fewest minutes but starts a less urgent patient first 45 times.', { x: 7.4, y: 3.1, w: 5.33, h: 0.5, fontSize: 9.5, color: INK2 });
  // seeds chart
  txt(s, 'ACROSS EIGHT SYNTHETIC DAYS · MINUTES SAVED BY REFLOW (10:45)', { x: 7.4, y: 3.72, w: 5.3, h: 0.2, fontFace: MONO, fontSize: 8.5, color: COPPER, charSpacing: 1 });
  s.addChart(pres.charts.BAR, [{ name: 'Minutes saved', labels: ['7', '11', '23', '31', '42', '57', '64', '88'], values: [78, 77, 25, 116, 151, 12, -5, 27] }], {
    x: 7.3, y: 3.9, w: 5.5, h: 2.15, barDir: 'col', barGapWidthPct: 45, chartColors: [TEAL], invertedColors: [COPPER], showValue: true, dataLabelFontSize: 9, dataLabelColor: INK, dataLabelFontFace: 'Consolas', dataLabelPosition: 'outEnd',
    catAxisLabelFontSize: 9, catAxisLabelColor: MUT, catAxisLabelFontFace: 'Consolas', catAxisLabelPos: 'low', valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false, valAxisMinVal: -25, valAxisMaxVal: 175,
    showCatAxisTitle: true, catAxisTitle: 'random seed', catAxisTitleFontSize: 8, catAxisTitleColor: MUT,
  });
  txt(s, 'Helped on 7 of 8 days; worse on 1 (seed 64, +5 min). Mean saving 59.8 min, median 51.5. Nothing is cherry-picked.', { x: 7.4, y: 6.1, w: 5.33, h: 0.5, fontSize: 9.5, color: INK2 });
  source(s, 'Source: SAYR Minutes Ledger: fairness table, patients made worse off, scheduling policies and "Evidence across seeds". Synthetic fairness evaluation does not establish fairness in real clinical operations.');
}

// ============ 11 · Roadmap ============
{
  const s = light('From simulation to real healthcare research', 'ROADMAP', 11);
  const ph = [
    ['PHASE 1', 'Current prototype', 'Synthetic patient journeys, deterministic simulation, scheduling optimization and operational evaluation.', true],
    ['PHASE 2', 'Operational research collaboration', 'Work with healthcare operations professionals to evaluate assumptions and refine scheduling constraints.', false],
    ['PHASE 3', 'Authorized real-world data', 'Investigate data access, privacy protection, data quality and integration requirements.', false],
    ['PHASE 4', 'External validation', 'Compare simulator predictions with observed service patterns; assess recommendations.', false],
    ['PHASE 5', 'Controlled deployment research', 'Supervised prospective testing, security assessment, workflow integration and approvals before any real use.', false],
  ];
  line(s, 0.9, 2.28, 12.45, 2.28, { color: LINE2, w: 2 });
  txt(s, 'PROTOTYPE TODAY  →  VALIDATION  →  SUPERVISED RESEARCH', { x: 0.6, y: 1.5, w: 8, h: 0.2, fontFace: MONO, fontSize: 8.5, color: MUT, charSpacing: 1.5 });
  const w = 2.3, g = 0.1625;
  ph.forEach(([k, a, b, done], i) => {
    const x = 0.6 + i * (w + g);
    s.addShape(OVAL, { x: x + 0.1, y: 2.12, w: 0.32, h: 0.32, fill: { color: done ? TEAL : PAPER }, line: { color: done ? TEAL : MUT2, width: 2 }, objectName: `S11_dot${i}` });
    txt(s, k, { x: x + 0.5, y: 1.82, w: 1.5, h: 0.22, fontFace: MONO, fontSize: 9.5, bold: true, color: done ? TEAL : MUT, charSpacing: 1.5 });
    card(s, x, 2.7, w, 2.3, { line: done ? TEAL : LINE, fill: done ? TEAL_SOFT : PAPER2, lw: done ? 1.5 : 0.75 });
    txt(s, a, { x: x + 0.15, y: 2.82, w: w - 0.3, h: 0.8, fontFace: HEAD, fontSize: 15.5, bold: true, color: done ? TEAL : INK });
    txt(s, b, { x: x + 0.15, y: 3.65, w: w - 0.3, h: 1.5, fontSize: 10.5, color: INK2 });
    if (done) txt(s, 'WHERE WE ARE', { x: x + 0.15, y: 4.72, w: 1.8, h: 0.18, fontFace: MONO, fontSize: 8, bold: true, color: TEAL, charSpacing: 1 });
  });
  card(s, 0.6, 5.3, 7.6, 1.3);
  txt(s, 'AL DHAFRA CONTEXT', { x: 0.8, y: 5.4, w: 3, h: 0.18, fontFace: MONO, fontSize: 8, color: COPPER, charSpacing: 1 });
  txt(s, 'Al Dhafra is a wide region, so coordinating services across places is a research question worth studying with local healthcare partners. We have not used, and do not state, any regional or facility performance data.', { x: 0.8, y: 5.68, w: 7.2, h: 0.85, fontSize: 11.5, color: INK2 });
  rect(s, 8.4, 5.3, 4.33, 1.3, { fill: INK, r: 0.07 });
  txt(s, 'The next step is validation, not deployment by assumption.', { x: 8.6, y: 5.35, w: 3.95, h: 1.2, fontFace: HEAD, fontSize: 17, italic: true, color: PAPER, valign: 'middle' });
  source(s, 'Roadmap is a proposal for future research, not a record of work done. Real-world use would require validation with healthcare operations specialists, authorized data, and privacy and security review (SAYR, Responsible AI).');
}

// ============ 12 · Closing ============
{
  const s = pres.addSlide({ masterName: 'SAYR_DARK' });
  s.addNotes(`SPEAKER: ${SCRIPT[11].speaker}\n\n${SCRIPT[11].text}`);
  txt(s, 'AL DHAFRA HEALTH FORUM  ·  DEVELOPING HEALTHCARE SERVICES', { x: 0.7, y: 0.5, w: 8, h: 0.3, fontFace: MONO, fontSize: 10, color: LINE2, charSpacing: 2 });
  txt(s, 'Healthcare does not operate one appointment at a time.\nIt operates as an interconnected system, and every minute matters.', { x: 0.7, y: 1.15, w: 8.6, h: 1.9, fontFace: HEAD, fontSize: 24, italic: true, color: PAPER, valign: 'top' });
  const pillars = [['Visibility', 'Control Room'], ['Coordination', 'Reflow'], ['Explainability', 'Ripple Trace'], ['Measurable outcomes', 'Minutes Ledger'], ['Human oversight', 'Action Desk']];
  pillars.forEach(([a, b], i) => {
    const x = 0.7 + i * 1.62;
    rect(s, x, 3.3, 1.5, 1.15, { line: i === 4 ? COPPER2 : TEAL2, lw: 1.25, r: 0.06 });
    txt(s, a, { x: x + 0.08, y: 3.37, w: 1.34, h: 0.62, fontFace: HEAD, fontSize: 12.5, bold: true, color: PAPER, valign: 'middle' });
    txt(s, b.toUpperCase(), { x: x + 0.08, y: 4.05, w: 1.34, h: 0.3, fontFace: MONO, fontSize: 7, color: LINE2 });
  });
  txt(s, 'Behind every healthcare schedule is a patient waiting for care.', { x: 0.7, y: 4.85, w: 7.9, h: 0.5, fontFace: HEAD, fontSize: 16, color: '8FCBC7' });
  txt(s, [{ text: 'SAYR AI', options: { bold: true, fontFace: HEAD, fontSize: 22, color: PAPER, charSpacing: 4 } }, { text: '   Care in Motion', options: { italic: true, fontFace: HEAD, fontSize: 22, color: COPPER2 } }], { x: 0.7, y: 5.55, w: 8, h: 0.5 });
  TEAM.forEach(([n, g], i) => txt(s, [{ text: n, options: { color: PAPER } }, { text: ' ' + g, options: { color: COPPER2, fontFace: MONO, fontSize: 9 } }], { x: 0.7 + (i % 3) * 2.75, y: 6.2 + Math.floor(i / 3) * 0.26, w: 2.7, h: 0.25, fontSize: 11 }));
  txt(s, 'ADNOC Schools, Madinat Zayed', { x: 0.7, y: 6.85, w: 4, h: 0.25, fontFace: MONO, fontSize: 9, color: LINE2 });
  // QR
  rect(s, 9.5, 1.1, 3.3, 3.95, { fill: PAPER2, r: 0.1 });
  s.addImage({ path: ASSETS + 'qr-sayr.png', x: 9.75, y: 1.3, w: 2.8, h: 2.8, hyperlink: { url: URL_APP, tooltip: 'Open SAYR AI: Care in Motion' }, altText: 'QR code linking to the SAYR AI published prototype', objectName: 'S12_qr' });
  txt(s, 'SCAN TO TRY SAYR', { x: 9.5, y: 4.15, w: 3.3, h: 0.2, fontFace: MONO, fontSize: 9, bold: true, color: COPPER, align: 'center', charSpacing: 1.5 });
  txt(s, 'maymourad.github.io/SAYR-AI-Care-In-Motion', { x: 9.5, y: 4.4, w: 3.3, h: 0.4, fontFace: MONO, fontSize: 8.5, color: TEAL, align: 'center', hyperlink: { url: URL_APP, tooltip: 'Open SAYR AI: Care in Motion' } });
  txt(s, 'Synthetic data only. A decision-support prototype, not a clinical tool.', { x: 9.5, y: 5.2, w: 3.3, h: 0.5, fontSize: 9, color: LINE2, align: 'center' });
  nSlides++;
}

// ============ A · Simulation ============
{
  const s = light('Appendix A · How the simulation works', 'TECHNICAL APPENDIX', 13);
  // event loop
  const loop = [['1  Next event', 'earliest time in the event queue'], ['2  Update state', 'patients, resources, queues'], ['3  Write to log', 'time, event, cause pointer'], ['4  Schedule follow-ups', 'finish, release, transfer, next stage']];
  loop.forEach(([a, b], i) => {
    const x = 0.6 + i * 3.1;
    card(s, x, 1.5, 2.85, 1.15);
    txt(s, a, { x: x + 0.15, y: 1.58, w: 2.6, h: 0.35, fontFace: HEAD, fontSize: 15, bold: true, color: i === 2 ? COPPER : INK });
    txt(s, b, { x: x + 0.15, y: 2.0, w: 2.6, h: 0.5, fontSize: 10.5, color: INK2 });
    if (i < 3) line(s, x + 2.88, 2.07, x + 3.07, 2.07, { color: MUT2, w: 1.5, arrow: true });
  });
  txt(s, 'EVENT TYPES', { x: 0.6, y: 2.95, w: 3, h: 0.2, fontFace: MONO, fontSize: 8.5, color: COPPER, charSpacing: 1 });
  ['arrival', 'queue', 'service start', 'service finish', 'release', 'transfer', 'outage'].forEach((e, i) => {
    rect(s, 0.6 + i * 1.5, 3.22, 1.38, 0.34, { fill: PAPER3, line: LINE, r: 0.17 });
    txt(s, e, { x: 0.6 + i * 1.5, y: 3.22, w: 1.38, h: 0.34, fontFace: MONO, fontSize: 9.5, color: INK, align: 'center', valign: 'middle' });
  });
  // journey timestamps
  txt(s, 'ONE APPOINTMENT, TIMESTAMPS THE ENGINE KEEPS', { x: 0.6, y: 3.9, w: 6, h: 0.2, fontFace: MONO, fontSize: 8.5, color: COPPER, charSpacing: 1 });
  const seg = [['waiting', 0, 2.6, COPPER], ['service', 2.6, 2.2, TEAL], ['transfer', 4.8, 0.9, MUT2]];
  seg.forEach(([a, x, w, c]) => {
    rect(s, 0.9 + x, 4.5, w, 0.42, { fill: c, round: false });
    txt(s, a, { x: 0.9 + x, y: 4.95, w, h: 0.2, fontFace: MONO, fontSize: 8.5, color: INK2, align: 'center' });
  });
  [['ready', 0], ['service starts', 2.6], ['service ends', 4.8], ['next stage ready', 5.7]].forEach(([a, x], i) => {
    line(s, 0.9 + x, 4.38, 0.9 + x, 4.5, { color: MUT, w: 1 });
    txt(s, a, { x: 0.9 + x - (i === 3 ? 1.3 : 0.5), y: i === 3 ? 4.03 : 4.2, w: i === 3 ? 1.6 : 1.0, h: 0.16, fontFace: MONO, fontSize: 7.5, color: MUT, align: i === 3 ? 'right' : 'center' });
  });
  txt(s, 'wait = start of service − ready', { x: 0.9, y: 4.56, w: 2.6, h: 0.3, fontFace: MONO, fontSize: 9, bold: true, color: 'FFFFFF', align: 'center' });
  txt(s, 'Waiting excludes transfers and service time. Total waiting sums waits over all appointments; mean, median and 90th percentile are per patient.', { x: 0.6, y: 5.25, w: 6.6, h: 0.7, fontSize: 10.5, color: INK2 });
  // determinism
  card(s, 7.5, 3.9, 5.23, 2.55, { fill: TEAL_SOFT, line: TEAL });
  txt(s, 'DETERMINISM AND REPRODUCIBILITY', { x: 7.7, y: 4.0, w: 4.8, h: 0.2, fontFace: MONO, fontSize: 8.5, color: TEAL, charSpacing: 1 });
  txt(s, 'Seed 7 always creates the same 60 patients, lateness, no-shows and durations. Baseline, disrupted and optimized runs share the same base patients, so any difference is caused by the change.', { x: 7.7, y: 4.3, w: 4.85, h: 1.0, fontSize: 10.5, color: INK });
  txt(s, 'Verified for this deck: the full demonstration path was run twice on the published app and produced identical figures (the optimizer examined 36,850 plans both times).', { x: 7.7, y: 5.35, w: 4.85, h: 0.9, fontSize: 10.5, bold: true, color: INK });
  txt(s, 'Planning uses booked lengths; the replay uses realised ones (variability 0.25), which is why projected and measured savings differ.', { x: 0.6, y: 6.0, w: 6.6, h: 0.5, fontSize: 10, italic: true, color: INK2 });
  source(s, 'Source: SAYR About, methods & credits (Discrete-event simulation); Minutes Ledger methodology (seed 7). Known limits: a clinician is tied to a room; no breaks, equipment, multiple sites or clinical variation.');
}

// ============ B · Reflow ============
{
  const s = light('Appendix B · How Reflow works', 'TECHNICAL APPENDIX', 14);
  const cols = [
    ['SEARCH', 'Constraint-aware local search with seeded perturbation. It captures every appointment not yet started, tries moving it to another resource or position, keeps only legal changes and the better plan. Three runs, three objectives. A heuristic: no guarantee of a global optimum, and it may find no improvement.'],
    ['CONSTRAINTS', 'Hard rules: one appointment per resource; journey order and transfers; right resource type; not before ready or now; nothing on an unavailable resource; protected slots no worse; starts within 5 min kept. Limits by design: no one waits more than 30 min longer; overtime not increased.'],
    ['OBJECTIVES', 'Fewest waiting minutes: −80 planned, 42 changes (recommended). Protect priority and the longest waits: −40, 33 changes. Fewest changes: −11, 11 changes. Different objectives give different trade-offs, which is why a person chooses.'],
  ];
  cols.forEach(([a, b], i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 1.45, 3.95, 1.95);
    txt(s, a, { x: x + 0.18, y: 1.55, w: 3, h: 0.2, fontFace: MONO, fontSize: 9, color: COPPER, charSpacing: 1.5 });
    txt(s, b, { x: x + 0.18, y: 1.8, w: 3.62, h: 1.55, fontSize: 9.5, color: INK2 });
  });
  // move diagram
  const dy = 3.6;
  txt(s, 'SEVEN REAL MOVES FROM THE PROPOSAL (ACTION DESK) · CHIP = APPOINTMENT START TIME · DASHED = PROPOSED POSITION', { x: 0.6, y: dy, w: 12.1, h: 0.2, fontFace: MONO, fontSize: 8, color: COPPER, charSpacing: 0.8 });
  const px0 = 1.75, px1 = 12.55, t0 = hm('10:50'), t1 = hm('14:40');
  const TX = (t) => px0 + ((t - t0) / (t1 - t0)) * (px1 - px0);
  const laneY = { 'GP-1': dy + 0.3, 'GP-2': dy + 1.07, 'GP-3': dy + 1.84 };
  const lh = 0.72;
  Object.entries(laneY).forEach(([k, y]) => {
    rect(s, 0.6, y, 12.13, lh, { fill: k === 'GP-2' ? COPPER_SOFT : PAPER2, line: LINE, r: 0.03 });
    txt(s, k, { x: 0.72, y: y + 0.12, w: 0.9, h: 0.25, fontFace: MONO, fontSize: 10, bold: true, color: INK });
    txt(s, k === 'GP-2' ? 'Clinician B out' : 'Station ' + k.slice(-1), { x: 0.72, y: y + 0.4, w: 1.0, h: 0.2, fontSize: 8, color: k === 'GP-2' ? COPPER : MUT });
  });
  rect(s, TX(hm('10:50')), laneY['GP-2'] + 0.05, TX(hm('13:30')) - TX(hm('10:50')), lh - 0.1, { fill: COPPER, tr: 70, line: COPPER, lw: 1, dash: 'dash', r: 0.03 });
  txt(s, 'OUTAGE 10:30–13:30', { x: TX(hm('10:50')) + 0.1, y: laneY['GP-2'] + 0.26, w: 2.2, h: 0.2, fontFace: MONO, fontSize: 9, bold: true, color: COPPER });
  ['11:00', '12:00', '13:00', '14:00'].forEach((t) => { line(s, TX(hm(t)), dy + 0.3, TX(hm(t)), dy + 2.56, { color: LINE2, w: 0.5, dash: 'dash' }); txt(s, t, { x: TX(hm(t)) - 0.3, y: dy + 2.58, w: 0.6, h: 0.16, fontFace: MONO, fontSize: 8, color: MUT, align: 'center' }); });
  const moves = [
    ['J-011', 'GP-1', '11:08', 'GP-1', '10:57', 0], ['J-036', 'GP-3', '12:18', 'GP-3', '11:57', 0], ['J-038', 'GP-3', '12:28', 'GP-3', '12:07', 1], ['J-039', 'GP-1', '13:33', 'GP-1', '13:22', 0],
    ['J-043', 'GP-3', '14:07', 'GP-1', '13:58', 1], ['J-050', 'GP-1', '14:29', 'GP-3', '14:23', 0], ['J-056', 'GP-1', '14:35', 'GP-3', '14:29', 1],
  ];
  const cw = 0.62, ch = 0.28;
  moves.forEach(([id, ol, ot, nl, nt, row], i) => {
    const ty = (lane) => laneY[lane] + 0.07 + row * 0.33;
    const gx = TX(hm(nt)) - cw / 2, gy = ty(nl);
    s.addShape(R, { x: gx, y: gy, w: cw, h: ch, rectRadius: 0.04, fill: { type: 'none' }, line: { color: TEAL, width: 1.25, dashType: 'dash' }, objectName: `SB_target${i}` });
    const cx = TX(hm(ot)) - cw / 2, cy = ty(ol);
    s.addShape(R, { x: cx, y: cy, w: cw, h: ch, rectRadius: 0.04, fill: { color: NAVY }, line: { color: NAVY, width: 1 }, objectName: `SB_chip${i}` });
    txt(s, id, { x: cx, y: cy, w: cw, h: ch, fontFace: MONO, fontSize: 9, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', objectName: `SB_chiptext${i}` });
  });
  source(s, 'Source: SAYR Action Desk, "What would change", 10:50 proposal, seed 7. Chips mark start times only (durations not drawn). J-043, J-050, J-056 change station.', 6.8);
}

// ============ C · Evaluation ============
{
  const s = light('Appendix C · Evaluation and limitations', 'TECHNICAL APPENDIX', 15);
  const defs = [
    ['Waiting time', 'Minutes between becoming ready and starting service. Transfers and service excluded. Percentages use patients who attended.'],
    ['90th percentile', 'The wait that nine in ten patients stay under: it describes the worst-off tenth, so it can move differently from the mean.'],
    ['Utilisation', 'Busy minutes divided by available minutes within the shift (resources that are down are not counted as available).'],
    ['Fairness', 'Mean and 90th-percentile waits for scheduled vs walk-in and morning vs afternoon; priority inversions; protected-slot waits; patients made worse off by ≥ 5 min.'],
    ['Repeated seeds', 'The same scenario on 8 other synthetic days, Reflow at 10:45. One run is a demonstration; the spread is the evidence.'],
  ];
  defs.forEach(([a, b], i) => {
    const y = 1.45 + i * 0.95;
    rect(s, 0.6, y, 0.06, 0.8, { fill: COPPER, round: false });
    txt(s, a, { x: 0.8, y, w: 2.1, h: 0.3, fontFace: HEAD, fontSize: 14, bold: true, color: INK });
    txt(s, b, { x: 0.8, y: y + 0.3, w: 5.4, h: 0.55, fontSize: 9.5, color: INK2 });
  });
  txt(s, 'FORECAST BASELINES · HELD-OUT ERROR (PATIENTS / HOUR)', { x: 6.9, y: 1.45, w: 5.8, h: 0.2, fontFace: MONO, fontSize: 8.5, color: COPPER, charSpacing: 1 });
  s.addChart(pres.charts.BAR, [{ name: 'MAE', labels: ['Same hour, previous day', '7-day moving average', 'Seasonal hourly profile'], values: [3.0, 2.36, 2.16] }], {
    x: 6.8, y: 1.65, w: 5.95, h: 1.9, barDir: 'bar', barGapWidthPct: 45, chartColors: [MUT2, MUT2, TEAL], showValue: true, dataLabelFontSize: 9.5, dataLabelColor: INK, dataLabelFontFace: 'Consolas', dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.00',
    catAxisLabelFontSize: 9.5, catAxisLabelColor: INK2, catAxisLabelFontFace: BODY, catAxisOrientation: 'maxMin', valAxisHidden: true, valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false, valAxisMinVal: 0, valAxisMaxVal: 3.6,
  });
  txt(s, 'Seasonal hourly profile chosen on 6 held-out synthetic days (14 train). Forecast 57 vs 60 actual. A baseline, not machine learning; the history is synthetic and generated from the simulator\'s own pattern.', { x: 6.9, y: 3.6, w: 5.8, h: 0.8, fontSize: 9.5, color: INK2 });
  card(s, 6.9, 4.5, 5.83, 2.15, { fill: COPPER_SOFT, line: COPPER2 });
  txt(s, 'LIMITS OF SIMULATED OUTCOMES', { x: 7.1, y: 4.6, w: 5.4, h: 0.2, fontFace: MONO, fontSize: 8.5, color: COPPER, charSpacing: 1 });
  txt(s, [
    { text: 'All patients and data are synthetic; nothing is validated against a real clinic.', options: { bullet: true, breakLine: true } },
    { text: 'Planned and measured savings differ (−80 vs −48).', options: { bullet: true, breakLine: true } },
    { text: 'A clinician is tied to a room; no breaks, equipment, sites or clinical variation.', options: { bullet: true, breakLine: true } },
    { text: 'Improvement is not guaranteed (1 of 8 days got worse).', options: { bullet: true, breakLine: true } },
    { text: 'Fewer waiting minutes does not mean better care.', options: { bullet: true } },
  ], { x: 7.1, y: 4.9, w: 5.45, h: 1.7, fontSize: 9.5, color: INK, paraSpaceAfter: 3 });
  source(s, 'Source: SAYR About, methods & credits (Demand forecasting); Minutes Ledger definitions and methodology.');
}

// ---------- write ----------
import { mkdirSync } from 'node:fs';
mkdirSync(root('../../docs/presentation/build/'), { recursive: true });
await pres.writeFile({ fileName: OUT });
const { applyTheme } = require('C:/Users/aaa/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/local-agent-mode-sessions/skills-plugin/35552a5f-98f9-4e0e-b06f-d1a96e9ca10a/e54784a8-37a4-4cc2-9d86-5fb6e5584d2c/skills/pptx/scripts/apply_theme.js');
await applyTheme(OUT, THEME);
console.log('wrote', OUT, nSlides, 'slides');
