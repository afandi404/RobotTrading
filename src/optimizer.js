// Grid search parameter optimizer (offline). Output best thresholds.
import { SYMBOLS, INTERVAL } from './config.js';
import { fetchKlines } from './binance.js';
import { computeAdaptiveRsi, detectRsiSignal } from './indicators.js';
import { maxDrawdown } from './utils.js';

function evaluate(closes, params){
  const { rsi } = computeAdaptiveRsi(closes);
  let eq=1, trades=0, wins=0;
  for (let i=1;i<rsi.length;i++){
    const prev=rsi[i-1], cur=rsi[i];
    let sig=null;
    if (prev<=params.lower && cur>params.lower) sig='BUY';
    if (prev>=params.upper && cur<params.upper) sig='SELL';
    if (!sig) continue;
    const entry=closes[closes.length - rsi.length + i];
    const exit=closes[Math.min(closes.length-1, closes.length - rsi.length + i + params.hold)];
    const r = sig==='BUY' ? exit/entry-1 : 1-exit/entry;
    eq *= (1 + r);
    trades++; if (r>0) wins++;
  }
  return { eq, trades, winrate: trades? wins/trades:0 };
}

async function run(){
  const grid = [];
  for (let lower of [25,30,35]){
    for (let upper of [65,70,75]){
      for (let hold of [3,5,8]) grid.push({ lower, upper, hold });
    }
  }
  for (const sym of SYMBOLS){
    const data = await fetchKlines(sym, INTERVAL, 1000);
    const closes = data.map(r=>Number(r[4]));
    let best=null;
    for (const p of grid){
      const m = evaluate(closes, p);
      if (!best || m.eq>best.eq) best = { ...p, ...m };
    }
    console.log(`[OPTIM] ${sym} best`, best);
  }
}
run();