// Simple walk-forward validation: split, optimize on IS, test on OOS.
import { SYMBOLS, INTERVAL } from './config.js';
import { fetchKlines } from './binance.js';
import { computeAdaptiveRsi } from './indicators.js';

function evaluate(closes, params){
  const { rsi } = computeAdaptiveRsi(closes);
  let eq=1;
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
  }
  return eq;
}

function grid(){
  const arr=[]; for (let l of [25,30,35]) for (let u of [65,70,75]) for (let h of [3,5,8]) arr.push({lower:l, upper:u, hold:h}); return arr;
}

async function run(){
  for (const sym of SYMBOLS){
    const data = await fetchKlines(sym, INTERVAL, 1200);
    const closes = data.map(r=>Number(r[4]));
    const mid = Math.floor(closes.length*0.7);
    const is = closes.slice(0, mid);
    const oos = closes.slice(mid);
    let best=null; for (const p of grid()){ const eq = evaluate(is, p); if(!best||eq>best.eq) best={...p,eq}; }
    const oosEq = evaluate(oos, best);
    console.log(`[WF] ${sym} IS best=${JSON.stringify(best)} OOS_EQ=${oosEq.toFixed(3)}`);
  }
}
run();