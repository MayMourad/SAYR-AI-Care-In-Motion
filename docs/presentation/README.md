# Al Dhafra Health Forum presentation: SAYR AI, Care in Motion

Category: Developing Healthcare Services · ADNOC Schools, Madinat Zayed · Published prototype: <https://maymourad.github.io/SAYR-AI-Care-In-Motion/>

## Deliverables

| # | Deliverable | File |
|---|---|---|
| 1 | Editable PowerPoint (12 main slides + 3 appendix) | [SAYR-Al-Dhafra-Health-Forum.pptx](SAYR-Al-Dhafra-Health-Forum.pptx) |
| 2 | Matching PDF | [SAYR-Al-Dhafra-Health-Forum.pdf](SAYR-Al-Dhafra-Health-Forum.pdf) |
| 3 | Editable source files | `tools/presentation/` (`deck.mjs`, `content.mjs`, `docs.mjs`, `finish.ps1`, capture scripts) |
| 4 | Speaker notes for every slide | inside the .pptx (Notes pane), identical to the script |
| 5 | 6 to 7 minute script, speaker assignments, condensed version | [SPEAKER-SCRIPT.md](SPEAKER-SCRIPT.md) |
| 6 | 90 to 120 second live demonstration, fallback, backup | [LIVE-DEMO.md](LIVE-DEMO.md) |
| 7 | Appendix slides A, B, C | slides 13 to 15 of the deck |
| 8 | Judge Q&A (17 questions) | [JUDGE-QA.md](JUDGE-QA.md) |
| 9 | Source reference list | [SOURCES.md](SOURCES.md) |
| 10 | Backup screenshots for the demo | [backup-screenshots](backup-screenshots) (9 images); all captures in [screenshots](screenshots) |
| – | The verified run behind every number | [VERIFIED-RUN.md](VERIFIED-RUN.md) |
| – | Per-slide PNG exports | [slides](slides) |

## Slide list
1 SAYR AI: Care in Motion · 2 When one delay becomes everyone's delay · 3 Our research question · 4 A digital twin of the clinic · 5 The disruption experiment · 6 Ripple Trace · 7 **Reflow Studio** (centerpiece) · 8 The human remains in control · 9 **Minutes Ledger** (analytical centerpiece) · 10 Efficiency without overlooking fairness · 11 From simulation to real healthcare research · 12 Closing, with QR code · A Simulation · B Reflow · C Evaluation and limitations.

## Animations
52 PowerPoint animation effects, all automatic ("after previous"): fades for the opening clock and outage, the queue squares (2), the workflow steps (3), the canvas callouts (4), the ripple chain (6), the callouts (7) and the waterfall bars (9). Two are **genuine appointment movements** drawn from the app's own proposal: slide 7 moves J-036 on GP-3 from 12:18 to 11:57, and appendix slide 14 moves seven appointments (J-011, J-036, J-038, J-039, J-043, J-050, J-056) to their proposed start times, three of them to a different station. Chips mark start times only; durations are not drawn because the app's list does not give them.

## Fonts
Headings Palatino Linotype, body Segoe UI, numbers and timestamps Consolas: the Windows members of the app's own serif, sans and mono stacks. They ship with Windows. On a Mac, PowerPoint substitutes similar fonts and text may reflow slightly; use the PDF if you present from a Mac.

## Rebuild
```bash
npm install
# 1. Capture screenshots and the verified run from the published app (needs Edge)
node tools/presentation/capture.mjs && node tools/presentation/capture2.mjs && node tools/presentation/capture3.mjs
# 2. Build the deck and companion documents
node tools/presentation/deck.mjs && node tools/presentation/docs.mjs
# 3. Add animations, save the final .pptx, export PDF and PNGs (Windows, PowerPoint installed)
powershell -File tools/presentation/finish.ps1
```
Set `SAYR_URL` to capture from a local build. `capture.mjs` also writes `tools/presentation/out/run-*.json`; run it twice (`TAG=A`, then `TAG=B NOSHOTS=1`) and diff to repeat the reproducibility check.

## Integrity checklist
- Every figure is from the published app on one seed, one scenario and one clock time (see VERIFIED-RUN.md); every content slide has a source line.
- Planned (−80) and measured (−48) savings are shown separately; the median rise, walk-in and morning worsening, patients made worse off and the one worse test day are shown, not hidden.
- No claim of real deployment, real patient data, clinical validation, trained machine learning, clinical triage or real-world waiting-time reductions. No UAE or Al Dhafra statistics.
- Team names and grades were read from the app's About panel: Lujain Ahmed Mourad 8D, Yosr Amgad 8D, Precious Fuentes 8D, Maryam Ammara Jelita 8D, Eleen Amr 8D, Shaden Ahmed Mourad 6D.
- No third-party design media or components are used. The QR code decodes to the exact link above.
- Not done: the schema validator in the pptx skill needs Python, which is not installed here; the deck was opened, animated, saved and exported by PowerPoint itself instead.
