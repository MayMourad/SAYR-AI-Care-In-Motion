// Writes the markdown companions of the deck from content.mjs, and copies the numbered backup screenshots.
import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { SCRIPT, CONDENSED, DEMO, QA, SOURCES, TEAM, URL_APP } from './content.mjs';

const root = (p) => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = root('../../docs/presentation/');
const WPM = 145;
const words = (t) => t.trim().split(/\s+/).length;
const secs = (t) => Math.round((words(t) / WPM) * 60);
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ---------- speaker script ----------
{
  const main = SCRIPT.filter((x) => x.n <= 12);
  const total = main.reduce((a, x) => a + secs(x.text), 0);
  const bySpeaker = {};
  main.forEach((x) => { const k = x.speaker.split(',')[0]; bySpeaker[k] = (bySpeaker[k] ?? 0) + secs(x.text); });
  let md = `# SAYR AI: Care in Motion. Speaker script

Al Dhafra Health Forum · Developing Healthcare Services · ADNOC Schools, Madinat Zayed

Target: **6 to 7 minutes**, excluding the live demonstration (see [LIVE-DEMO.md](LIVE-DEMO.md)). The word counts below are timed at ${WPM} words per minute; the full script is **${mmss(total)}** (${main.reduce((a, x) => a + words(x.text), 0)} words).

These are **speaking assignments only**. They say who reads each slide; they do not describe who built what. Swap sections freely. Each person has about one minute.

| Speaker | Slides | Approx. time |
|---|---|---|
${Object.entries(bySpeaker).map(([k, v]) => `| ${k}${k === 'Shaden' ? ' (6D)' : ' (' + (TEAM.find(([n]) => n.startsWith(k))?.[1] ?? '') + ')'} | ${main.filter((x) => x.speaker.startsWith(k)).map((x) => x.n).join(', ')} | ${mmss(v)} |`).join('\n')}

Team: ${TEAM.map(([n, g]) => `${n} (${g})`).join(', ')}.

## Delivery tips
- Say "simulation" and "synthetic" out loud early. The judges should never wonder whether this is real patient data.
- Do not read the slide. Point at the picture while you say the sentence.
- If a judge interrupts with a question, answer from [JUDGE-QA.md](JUDGE-QA.md) and return to your slide.
- Transitions are written into the last sentence of each section.

---

`;
  for (const x of main) {
    md += `## Slide ${x.n} · ${x.title}\n**${x.speaker}** · about ${secs(x.text)} s\n\n${x.text}\n\n${x.vocab ? `*Vocabulary:* ${x.vocab}\n\n` : ''}`;
  }
  md += `---\n\n## Appendix slides (only if asked)\n\n`;
  for (const x of SCRIPT.filter((y) => y.n > 12)) md += `### ${x.title}\n${x.text}\n\n`;
  md += `---\n\n## Condensed version (about 3 minutes)\n\nFor a short slot. Show slides 1, 2, 3, 4, 6, 7, 9, 10, 12 and skip the rest, or keep all slides on screen and speak only these paragraphs.\n\n`;
  let ct = 0;
  for (const c of CONDENSED) { ct += secs(c.text); md += `**${c.speaker}** (slides ${c.slides}, about ${secs(c.text)} s)\n\n${c.text}\n\n`; }
  md += `Total condensed length: about ${mmss(ct)}.\n`;
  writeFileSync(OUT + 'SPEAKER-SCRIPT.md', md);
  console.log('script', mmss(total), 'condensed', mmss(ct));
}

// ---------- live demo ----------
{
  const total = DEMO.parts.reduce((a, p) => a + p.secs, 0);
  let md = `# Live demonstration: 90 to 120 seconds

Open **${URL_APP}** in a fresh browser tab. Everything runs in the browser; no sign-in, no network calls after the page loads.

## The verified run (what the numbers below come from)

| Item | Value |
|---|---|
| Scenario | ${DEMO.scenario} |
| Seed | ${DEMO.seed} |
| Clock | ${DEMO.clock} |
| Policy and objective | ${DEMO.policy} |
| Reproducibility | The whole path was run twice on the published app; every figure was identical. See [VERIFIED-RUN.md](VERIFIED-RUN.md). |

Expected result: Total waiting 1,056 (normal) → 1,946 (disrupted) → **1,898 (optimized)**; measured change **−48 min (−2.5%)**; planner projection −80 min; 42 appointments changed (6 reassigned, 36 re-sequenced); 9 of 9 constraints pass; ten patients wait longer, seven less, forty-three about the same.

Do not assume another seed or scenario will improve. Some do not (seed 64 was 5 minutes worse).

## Roles
One person **drives** the laptop for the whole demo (suggested: Yosr). Each narrator speaks their part and says "next" to the driver. Speaking roles only; swap freely.

## Steps (about ${total} seconds)

| Part | Narrator | Time | Screen | Driver does | Narrator says | Expected on screen |
|---|---|---|---|---|---|---|
${DEMO.parts.map((p) => `| ${p.part} | ${p.who} | ${p.secs} s | ${p.screen} | ${p.do} | ${p.say} | ${p.see} |`).join('\n')}

Order note: in the table, part F (human approval) comes before E (Ledger) because the Ledger only measures a plan after it has been approved. In the speech, introduce it as "a person must approve it, and then we measure".

## If it is slow or something breaks
${DEMO.fallback.map((f) => `- ${f}`).join('\n')}

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
`;
  writeFileSync(OUT + 'LIVE-DEMO.md', md);
  mkdirSync(OUT + 'backup-screenshots', { recursive: true });
  const S = root('../../docs/presentation/screenshots/');
  const map = [
    ['pg-control-normal-1145', '01-control-room-normal-1145'], ['pg-control-staff-1145', '02-control-room-staff-1145'], ['pg-05-stress-tall', '03-stress-controls-staff'],
    ['07-ripple-6hops', '04-ripple-trace'], ['06-reflow-before', '05-reflow-current-plan'], ['06-reflow-after', '06-reflow-proposed-plan'],
    ['08-desk-pending', '07-action-desk-pending'], ['08-desk-approved', '08-action-desk-approved'], ['09-ledger', '09-minutes-ledger'],
  ];
  for (const [a, b] of map) copyFileSync(S + a + '.png', OUT + 'backup-screenshots/' + b + '.png');
}

// ---------- judge Q&A ----------
{
  let md = `# Judge Q&A guide

Short, honest answers. If you do not know, say so and say how you would find out. Never claim more than the project shows.

**The one answer to get exactly right (question 4):** the current prototype uses a transparent forecasting baseline, a deterministic simulation engine and constraint-aware optimization. Its contribution is the integration of these methods into an interactive, explainable decision-support workflow. Training and validating more advanced predictive models would be a future research direction.

`;
  QA.forEach(([q, a], i) => { md += `## ${i + 1}. ${q}\n${a}\n\n`; });
  md += `---\n\n## Numbers you may be asked for (verified run: seed 7, staff scenario, 10:50)\n\n| Quantity | Value |\n|---|---|\n| Patients | 60 (48 scheduled, 12 walk-in) |\n| Total waiting: normal / disrupted / optimized | 1,056 / 1,946 / 1,898 minutes |\n| Measured change vs projected | −48 (−2.5%) vs −80 |\n| 90th percentile: normal / disrupted / optimized | 42 / 75 / 71 minutes |\n| Median: normal / disrupted / optimized | 17 / 28 / 29 minutes |\n| Patients made worse off (≥ 5 min) | 10 (7 better, 43 about the same) |\n| Walk-ins, 90th percentile | 73 → 77 minutes |\n| Seeds where Reflow helped (10:45) | 7 of 8; mean 59.8 min, median 51.5; seed 64 +5 min worse |\n| Forecast held-out error | seasonal 2.16, 7-day average 2.36, previous day 3.00 patients/hour |\n`;
  writeFileSync(OUT + 'JUDGE-QA.md', md);
}

// ---------- sources ----------
{
  let md = `# Sources and attribution

## Primary sources (the app itself)
${SOURCES.app.map(([a, u, n]) => `- **${a}**: ${u}. ${n}`).join('\n')}

## Healthcare operations literature
Used for background and vocabulary only. No statistic from these sources appears in the deck. Citation details for the three journal articles were checked against publisher, library or index records on 2026-10-27; the full texts were not read for this deck.
${SOURCES.literature.map(([a, n]) => `- ${a} ${n}`).join('\n')}

Note: for Hyndman and Athanasopoulos the edition and URL are cited from the authors' public book site; the online chapter itself was not retrieved during checking.

## Design references
${SOURCES.design.map(([a, n]) => `- **${a}**: ${n}`).join('\n')}

## What the deck deliberately does not cite
No statistic about UAE or Al Dhafra waiting times, hospital performance, patient satisfaction, economic savings or clinical outcomes appears anywhere, because no reliable evidence was assembled for this project. Where context is needed, the deck uses a qualitative statement and says so.

## Where each figure on each slide comes from
All figures come from the published app on one reproducible path (see [VERIFIED-RUN.md](VERIFIED-RUN.md)). Every content slide carries a source line.

| Slide | Screen of the app | Figures |
|---|---|---|
| 2 | Control Room at 11:45 (normal vs staff scenario); Ripple Trace; Minutes Ledger | 4 vs 10 waiting; longest wait 16 vs 40 min; 11 vs 5 waiting; 37 patients; LAB-1 +76 and CHK-1 +15 min; journey 60 → 74 min; 60 → 59 done by 16:00 |
| 4 | Control Room; About (methods) | 60 patients (48 + 12); resource counts; 08:00–16:00 |
| 5 | Stress Controls | +890; 1,056 → 1,946; median 17 → 28; p90 42 → 75; overtime 0 → 24; 60 → 59 |
| 6 | Ripple Trace | 37 / 890 / 26 / +24; chain J-025 → J-011 → J-028 → J-029 → J-032 |
| 7, 8 | Reflow Studio, Action Desk | 1,698 → 1,619 (−80); 42 changes (6 + 36); 9/9; 15 less, 16 longer; 43 still ≥ 15 min; J-036 12:18 → 11:57 |
| 9 | Minutes Ledger | waterfall and balance table |
| 10 | Minutes Ledger | fairness table; 10 / 7 / 43; policies; 8-seed evidence |
| 15 | About (forecast) | 2.16 / 2.36 / 3.00; 57 vs 60 |
`;
  writeFileSync(OUT + 'SOURCES.md', md);
}
console.log('docs written');
