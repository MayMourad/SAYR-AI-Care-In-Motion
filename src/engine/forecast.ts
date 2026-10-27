// Layer 1: demand forecasting. A transparent baseline, evaluated honestly, on synthetic history only.
import { HOURLY_PROFILE } from './scenario';
import { mulberry32, normal } from './rng';
import type { Scenario } from './types';

export const HOURS = 7; // 08:00-15:00 arrival hours
export const HISTORY_DAYS = 20;
export const TRAIN_DAYS = 14; // days 0-13 for fitting, days 14-19 held out

export type ModelId = 'naive' | 'ma7' | 'seasonal';

export interface ModelResult {
  id: ModelId;
  label: string;
  how: string;
  mae: number; // mean absolute error in patients per hour, on held-out days
}

export interface ForecastResult {
  method: string;
  hourLabels: string[];
  history: number[][]; // [day][hour]
  models: ModelResult[];
  chosen: ModelId;
  forecast: number[]; // per hour, for today
  actualToday: number[];
  maeToday: number;
  totalForecast: number;
  totalActual: number;
  limitations: string[];
}

function hourShares(): number[] {
  const out = new Array(HOURS).fill(0);
  let total = 0;
  for (const [a, b, w] of HOURLY_PROFILE) total += (b - a) * w;
  for (let h = 0; h < HOURS; h++) {
    const lo = h * 60;
    const hi = lo + 60;
    let m = 0;
    for (const [a, b, w] of HOURLY_PROFILE) m += Math.max(0, Math.min(b, hi) - Math.max(a, lo)) * w;
    out[h] = m / total;
  }
  return out;
}

/** Synthetic history: a weekday-modulated seasonal pattern with sampling noise. Not real hospital data. */
export function syntheticHistory(daily = 60, seed = 2024): number[][] {
  const rng = mulberry32(seed);
  const share = hourShares();
  const dow = [1.0, 1.06, 0.94, 1.1, 0.9];
  return Array.from({ length: HISTORY_DAYS }, (_, d) =>
    share.map((s) => {
      const lam = daily * s * dow[d % 5];
      return Math.max(0, Math.round(lam + normal(rng) * Math.sqrt(lam) * 0.9));
    }),
  );
}

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);

function predict(id: ModelId, hist: number[][], day: number, h: number): number {
  if (id === 'naive') return hist[day - 1][h];
  if (id === 'ma7') return mean(hist.slice(Math.max(0, day - 7), day).map((x) => x[h]));
  return mean(hist.slice(0, Math.min(day, TRAIN_DAYS)).map((x) => x[h]));
}

export function forecastDemand(sc: Scenario): ForecastResult {
  const hist = syntheticHistory(sc.params.scheduled + sc.params.walkIns);
  const defs: { id: ModelId; label: string; how: string }[] = [
    { id: 'naive', label: 'Same hour, previous day', how: 'Predicts each hour with the count observed at that hour on the previous day.' },
    { id: 'ma7', label: '7-day moving average', how: 'Predicts each hour with the mean of that hour over the previous seven days.' },
    { id: 'seasonal', label: 'Seasonal hourly profile', how: `Predicts each hour with its mean over the ${TRAIN_DAYS} training days.` },
  ];
  const models: ModelResult[] = defs.map((d) => {
    const errs: number[] = [];
    for (let day = TRAIN_DAYS; day < HISTORY_DAYS; day++) for (let h = 0; h < HOURS; h++) errs.push(Math.abs(predict(d.id, hist, day, h) - hist[day][h]));
    return { ...d, mae: mean(errs) };
  });
  const chosen = models.slice().sort((a, b) => a.mae - b.mae)[0].id;
  // refit on all available history to forecast today (day index = HISTORY_DAYS)
  const forecast = Array.from({ length: HOURS }, (_, h) => {
    if (chosen === 'naive') return hist[HISTORY_DAYS - 1][h];
    if (chosen === 'ma7') return mean(hist.slice(HISTORY_DAYS - 7).map((x) => x[h]));
    return mean(hist.map((x) => x[h]));
  });
  const actualToday = new Array(HOURS).fill(0);
  for (const p of sc.patients) {
    if (p.surge || p.noShow) continue;
    const t = p.sched + p.lateBy;
    actualToday[Math.min(HOURS - 1, Math.floor(t / 60))]++;
  }
  return {
    method: 'Evaluated baseline forecasts (not a machine-learning model)',
    hourLabels: Array.from({ length: HOURS }, (_, h) => `${String(8 + h).padStart(2, '0')}:00`),
    history: hist,
    models,
    chosen,
    forecast,
    actualToday,
    maeToday: mean(forecast.map((f, h) => Math.abs(f - actualToday[h]))),
    totalForecast: forecast.reduce((s, x) => s + x, 0),
    totalActual: actualToday.reduce((s, x) => s + x, 0),
    limitations: [
      'History is synthetic, generated from the same hourly pattern the simulator uses, so a good score here says little about real demand.',
      'Only hourly arrival counts are forecast; service times and no-shows are not.',
      'Seasonality, holidays, weather and referral changes are not modelled.',
      'Six held-out days is a small test set; the error figures are indicative only.',
    ],
  };
}
