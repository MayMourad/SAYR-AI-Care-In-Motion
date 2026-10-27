import { useMemo } from 'react';
import { useSayr } from '../state';
import { buildLiveModel, nowStats } from './flowModel';

export function useLiveModel(showForecast = true) {
  const { sc, liveRun, now } = useSayr();
  const tick = Math.floor(now);
  const model = useMemo(() => buildLiveModel(sc, liveRun, tick, showForecast), [sc, liveRun, tick, showForecast]);
  const stats = useMemo(() => nowStats(sc, liveRun.final, model, tick), [sc, liveRun, model, tick]);
  return { model, stats };
}
