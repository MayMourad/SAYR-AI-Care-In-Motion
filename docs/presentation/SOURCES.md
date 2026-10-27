# Sources and attribution

## Primary sources (the app itself)
- **SAYR AI: Care in Motion (published prototype)**: https://maymourad.github.io/SAYR-AI-Care-In-Motion/. Primary source of truth for every figure, screen and definition in the deck.
- **Source repository**: https://github.com/MayMourad/SAYR-AI-Care-In-Motion. README, engine code (src/engine), 24 automated tests, DESIGN_REFERENCES.md.

## Healthcare operations literature
Used for background and vocabulary only. No statistic from these sources appears in the deck. Citation details for the three journal articles were checked against publisher, library or index records on 2026-10-27; the full texts were not read for this deck.
- Cayirli, T. and Veral, E. (2003). Outpatient scheduling in health care: a review of literature. Production and Operations Management, 12(4), 519-549. Background: why outpatient scheduling under uncertainty is hard.
- Gupta, D. and Denton, B. (2008). Appointment scheduling in health care: challenges and opportunities. IIE Transactions, 40(9), 800-819. Background: appointment scheduling challenges, including no-shows and walk-ins.
- Jun, J. B., Jacobson, S. H. and Swisher, J. R. (1999). Application of discrete-event simulation in health care clinics: a survey. Journal of the Operational Research Society, 50(2), 109-123. Background: discrete-event simulation of clinics.
- Hyndman, R. J. and Athanasopoulos, G. Forecasting: Principles and Practice (3rd ed.). OTexts, online at otexts.com/fpp3. Seasonal and naive baselines, and evaluating forecasts on held-out data.

Note: for Hyndman and Athanasopoulos the edition and URL are cited from the authors' public book site; the online chapter itself was not retrieved during checking.

## Design references
- **SAYR DESIGN_REFERENCES.md**: Ten interaction references studied for principles only (Spline/Hana and Recent.design showcases). No media or components are reused in this deck.

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
