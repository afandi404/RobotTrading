<<<<<<< HEAD
import { SYMBOLS, INTERVAL } from './config.js';
import { fetchKlines } from './binance.js';
import { computeAdaptiveRsi } from './indicators.js';

function evaluate(closes, params){
  const { rsi } = computeAdaptiveRsi(closes);
  let eq=1;
=======
// Grid search parameter optimizer (offline). Output best thresholds.
import { SYMBOLS, INTERVAL } from './config.js';
import { fetchKlines } from './binance.js';
import { computeAdaptiveRsi, detectRsiSignal } from './indicators.js';
import { maxDrawdown } from './utils.js';

function evaluate(closes, params){
  const { rsi } = computeAdaptiveRsi(closes);
  let eq=1, trades=0, wins=0;
>>>>>>> 59f769cb3bc345dab8c09e78d07038b32c1ed172
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
<<<<<<< HEAD
  }
  return eq;
}

function grid(){
  const arr=[];
  for (let l=20;l<=40;l+=5) for (let u=60;u<=80;u+=5) for (let h of [2,3,5,8]) arr.push({lower:l, upper:u, hold:h});
  return arr;
}

async function run(){
  for (const sym of SYMBOLS){
    const data = await fetchKlines(sym, INTERVAL, 1000);
    const closes = data.map(r=>Number(r[4]));
    const gridParams = grid();
    let bests=[];
    for (const p of gridParams){ const eq = evaluate(closes, p); bests.push({...p, eq}); }
    bests.sort((a,b)=>b.eq-a.eq);
    const top = bests.slice(0,10);
    console.log(`[OPTIM] ${sym} TOP10`, top);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(e => console.error(e));
}
=======
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
>>>>>>> 59f769cb3bc345dab8c09e78d07038b32c1ed172
