import { SYMBOLS, INTERVAL } from './config.js';
import { fetchKlines } from './binance.js';
import { computeAdaptiveRsi, detectRsiSignal } from './indicators.js';

async function run(){
  const symbol = SYMBOLS[0];
  const data = await fetchKlines(symbol, INTERVAL, 1000);
  const closes = data.map(r=>Number(r[4]));
  const { period, rsi } = computeAdaptiveRsi(closes);
  let signalCount=0;
  for (let i=1;i<rsi.length;i++){
    const sig = detectRsiSignal(rsi.slice(0,i+1));
    if (sig) signalCount++;
  }
  console.log(`[BACKTEST] ${symbol} ${INTERVAL} signals=${signalCount} period=${period}`);
}
run();