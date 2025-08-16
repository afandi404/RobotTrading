import { SYMBOLS, INTERVAL, HISTORY_LIMIT, TAKER_FEE_BPS, SLIPPAGE_BPS, PARTIAL_TP1_PERCENT, PARTIAL_TP1_PROFIT, PARTIAL_TP2_PERCENT, PARTIAL_TP2_PROFIT, ATR_PERIOD, ATR_MULT_SL, BT_SLIPPAGE_MODE, BT_SLIPPAGE_BPS_MEAN, BT_SLIPPAGE_BPS_STD, BT_FILL_PRIORITY } from './config.js';
import { fetchKlines } from './binance.js';
import { computeAdaptiveRsi, ema, atr } from './indicators.js';
import { maxDrawdown, sharpe, sortino, seedRandom, rand } from './utils.js';
import { logEvent } from './logger.js';

function sampleSlippage(){ if (BT_SLIPPAGE_MODE === 'stochastic'){ // Box-Muller
  const u1 = Math.max(1e-9, rand());
  const u2 = Math.max(1e-9, rand());
  const z0 = Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
  return Math.max(0, BT_SLIPPAGE_BPS_MEAN + z0 * BT_SLIPPAGE_BPS_STD) / 10000;
}
return SLIPPAGE_BPS/10000; }

function simulateSymbol(closes, highs, lows, symbol){ const { rsi, period } = computeAdaptiveRsi(closes); const emaArr = ema(closes); const atrArr = atr(highs, lows, closes, ATR_PERIOD);

let equity = 1, pnlSeries=[1]; let trades=0, wins=0;

seedRandom(12345);

for (let i=1;i<rsi.length-1;i++){
  const idx = closes.length - rsi.length + i;
  if (idx < ATR_PERIOD) continue;
  const prev = rsi[i-1], cur = rsi[i];
  let sig=null; if (prev<=30 && cur>30) sig='BUY'; if (prev>=70 && cur<70) sig='SELL'; if (!sig) continue;
  const price = closes[idx];
  const atrNow = atrArr[idx - (closes.length-atrArr.length)] || 0;
  const trendUp = price >= (emaArr[idx - (closes.length-emaArr.length)] || price);
  if (sig==='BUY' && !trendUp) continue; if (sig==='SELL' && trendUp) continue;

  // simulate next N candles for fills (more realistic than single candle)
  const lookAhead = 3; // check 3 future candles
  let exitPrice = null; let exitType = null;
  const tp1 = sig==='BUY'? price*(1+PARTIAL_TP1_PROFIT/100) : price*(1-PARTIAL_TP1_PROFIT/100);
  const tp2 = sig==='BUY'? price*(1+PARTIAL_TP2_PROFIT/100) : price*(1-PARTIAL_TP2_PROFIT/100);
  const sl = sig==='BUY'? price - ATR_MULT_SL*atrNow : price + ATR_MULT_SL*atrNow;

  for (let j=1;j<=lookAhead;j++){
    const h = highs[Math.min(idx+j, highs.length-1)];
    const l = lows[Math.min(idx+j, lows.length-1)];
    const c = closes[Math.min(idx+j, closes.length-1)];
    const slHit = sig==='BUY'? (l <= sl) : (h >= sl);
    const tp1Hit = sig==='BUY'? (h >= tp1) : (l <= tp1);
    const tp2Hit = sig==='BUY'? (h >= tp2) : (l <= tp2);
    // priority rules
    if (slHit && (BT_FILL_PRIORITY==='SL_FIRST' || !tp1Hit && !tp2Hit)) { exitPrice = sl; exitType='SL'; break; }
    if (tp2Hit){ exitPrice = tp2; exitType='TP2'; break; }
    if (tp1Hit){ exitPrice = tp1; exitType='TP1'; break; }
    // otherwise continue; if final candle then exit at close
    if (j===lookAhead){ exitPrice = c; exitType='CLOSE'; }
  }

  const slippage = sampleSlippage(); const fee = (TAKER_FEE_BPS/10000);
  exitPrice = sig==='BUY' ? exitPrice*(1 - slippage) : exitPrice*(1 + slippage);
  const r = sig==='BUY' ? exitPrice/price - 1 : 1 - exitPrice/price;
  const rNet = r - 2*fee;
  equity *= (1 + rNet);
  pnlSeries.push(equity);
  trades++; if (rNet>0) wins++;
}

const mdd = maxDrawdown(pnlSeries); const ret = equity-1; const wr = trades? wins/trades:0; const returns = pnlSeries.slice(1).map((v,i,a)=> i? v/a[i-1]-1 : 0).filter(x=>Number.isFinite(x)); const sh = sharpe(returns); const so = sortino(returns);
return { symbol, period, trades, winrate: wr, equity, return: ret, mdd, sharpe: sh, sortino: so };
}

export async function run(){ for (const symbol of SYMBOLS){ const data = await fetchKlines(symbol, INTERVAL, Math.max(HISTORY_LIMIT, 750)); const closes = data.map(r=>Number(r[4])); const highs = data.map(r=>Number(r[2])); const lows  = data.map(r=>Number(r[3])); const res = simulateSymbol(closes, highs, lows, symbol); console.log(`[BACKTEST] ${symbol} ${INTERVAL} equity=${res.equity.toFixed(3)} ret=${(res.return*100).toFixed(1)}% trades=${res.trades} wr=${(res.winrate*100).toFixed(1)}% mdd=${(res.mdd*100).toFixed(1)}% sharpe=${res.sharpe.toFixed(2)} p=${res.period}`); } }

if (import.meta.url === `file://${process.argv[1]}`) { run().catch(e => console.error(e)); }