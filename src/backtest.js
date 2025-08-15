import { SYMBOLS, INTERVAL, HISTORY_LIMIT, TAKER_FEE_BPS, SLIPPAGE_BPS, PARTIAL_TP1_PERCENT, PARTIAL_TP1_PROFIT, PARTIAL_TP2_PERCENT, PARTIAL_TP2_PROFIT, ATR_PERIOD, ATR_MULT_SL } from './config.js';
import { fetchKlines } from './binance.js';
import { computeAdaptiveRsi, detectRsiSignal, ema, atr } from './indicators.js';
import { maxDrawdown, sharpe, sortino } from './utils.js';

function simulate({ closes, highs, lows }){
  const { rsi, period } = computeAdaptiveRsi(closes);
  const signals = [];
  for (let i=1;i<rsi.length;i++){
    const sig = detectRsiSignal(rsi.slice(0,i+1));
    if (sig) signals.push({ i: i, type: sig });
  }
  // EMA/ATR regime & ATR SL
  const emaArr = ema(closes);
  const atrArr = atr(highs, lows, closes, ATR_PERIOD);
  let equity=1, peak=1, trades=0, wins=0, pnlSeries=[1];

  for (const s of signals){
    const idx = closes.length - rsi.length + s.i; // align idx to closes
    if (idx<ATR_PERIOD+1 || idx>=closes.length-1) continue;
    const price = closes[idx];
    const trendUp = price >= (emaArr[idx - (closes.length-emaArr.length)] || price);
    if (s.type==='BUY' && !trendUp) continue;
    if (s.type==='SELL' && trendUp) continue;

    // simplistic exit: partials on TP1/TP2, SL = ATR_MULT_SL * ATR
    const atrNow = atrArr[idx - (closes.length-atrArr.length)];
    const sl = s.type==='BUY' ? price - ATR_MULT_SL*atrNow : price + ATR_MULT_SL*atrNow;
    const tp1 = s.type==='BUY' ? price*(1+PARTIAL_TP1_PROFIT/100) : price*(1-PARTIAL_TP1_PROFIT/100);
    const tp2 = s.type==='BUY' ? price*(1+PARTIAL_TP2_PROFIT/100) : price*(1-PARTIAL_TP2_PROFIT/100);

    const fee = (TAKER_FEE_BPS+SLIPPAGE_BPS)/10000;
    const exit = tp2; // assume tp hits more often in trending regime for this coarse BT
    const r = s.type==='BUY' ? (exit/price - 1) : (1 - exit/price);
    const rNet = r - 2*fee; // entry+exit costs
    equity *= (1 + rNet);
    peak = Math.max(peak, equity);
    pnlSeries.push(equity);
    trades++;
    if (rNet>0) wins++;
  }

  const mdd = maxDrawdown(pnlSeries);
  const ret = equity-1;
  const wr = trades? wins/trades:0;
  const sh = sharpe(pnlSeries.slice(1).map((v,i,a)=> i? v/a[i-1]-1 : 0));
  const so = sortino(pnlSeries.slice(1).map((v,i,a)=> i? v/a[i-1]-1 : 0));
  return { period, trades, winrate: wr, equity, return: ret, mdd, sharpe: sh, sortino: so };
}

async function run(){
  for (const symbol of SYMBOLS){
    const data = await fetchKlines(symbol, INTERVAL, Math.max(HISTORY_LIMIT, 750));
    const closes = data.map(r=>Number(r[4]));
    const highs = data.map(r=>Number(r[2]));
    const lows  = data.map(r=>Number(r[3]));

    const res = simulate({ closes, highs, lows });
    console.log(`[BACKTEST] ${symbol} ${INTERVAL} equity=${res.equity.toFixed(3)} ret=${(res.return*100).toFixed(1)}% trades=${res.trades} wr=${(res.winrate*100).toFixed(1)}% mdd=${(res.mdd*100).toFixed(1)}% sharpe=${res.sharpe.toFixed(2)} p=${res.period}`);
  }
}
run();