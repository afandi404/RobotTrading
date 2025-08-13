import { RSI } from 'technicalindicators';
import { mean, stddev, clamp } from './utils.js';
import { BASE_RSI, MIN_RSI_PERIOD, MAX_RSI_PERIOD, VOL_WINDOW, RSI_LOWER, RSI_UPPER } from './config.js';

export function getAdaptiveRsiPeriod(recentForVol = []){
  if (!recentForVol.length) return BASE_RSI;
  const m = mean(recentForVol);
  if (m <= 0) return BASE_RSI;
  const sd = stddev(recentForVol);
  const volRatio = sd / m;
  const low = 0.002; const high = 0.05;
  const t = clamp((volRatio - low) / (high - low), 0, 1);
  const period = Math.round(MAX_RSI_PERIOD - t * (MAX_RSI_PERIOD - MIN_RSI_PERIOD));
  return clamp(period, MIN_RSI_PERIOD, MAX_RSI_PERIOD);
}

export function computeAdaptiveRsi(values){
  const volWindow = Math.min(VOL_WINDOW, values.length);
  const recentForVol = values.slice(-volWindow);
  const adaptivePeriod = getAdaptiveRsiPeriod(recentForVol);
  if (values.length < adaptivePeriod + 1) return { period: adaptivePeriod, rsi: [] };
  const rsiValues = RSI.calculate({ period: adaptivePeriod, values });
  return { period: adaptivePeriod, rsi: rsiValues };
}

export function detectRsiSignal(rsiArray){
  if (!rsiArray || rsiArray.length < 2) return null;
  const prev = rsiArray[rsiArray.length - 2];
  const last = rsiArray[rsiArray.length - 1];
  if (prev <= RSI_LOWER && last > RSI_LOWER) return 'BUY';
  if (prev >= RSI_UPPER && last < RSI_UPPER) return 'SELL';
  return null;
}