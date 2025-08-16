import { computeAdaptiveRsi, ema, atr } from './indicators.js';
import { CONFIRMATION_CANDLES, COOLDOWN_SECONDS, POSITION_SIZE_PERCENT, LEVERAGE, AUTO_TRADE, PAPER, EMA_PERIOD, ATR_PERIOD, ATR_MULT_SL, ATR_MULT_TRAIL, PARTIAL_TP1_PERCENT, PARTIAL_TP1_PROFIT, PARTIAL_TP2_PERCENT, PARTIAL_TP2_PROFIT, FUSION_W_RSI, FUSION_W_TREND, FUSION_W_VOL, FUSION_W_MACRO, FUSION_TH_BUY, FUSION_TH_SELL, FUSION_HYST, DAILY_MAX_LOSS_PERCENT, KELLY_FACTOR } from './config.js';
import { fetchLongShort, fetchFundingRate, fetchOpenInterest, fetchKlines, fetchUSDTBalance, placeMarketOrder, placeCloseSL, cancelAllOpenOrders, placeLimitOrder, getSymbolInfo, changeLeverage, getPositionRisk } from './binance.js';
import { sendTelegramText, sendTelegramPhotoBuffer } from './telegram.js';
import { buildLineChartConfig, getChartPngBuffer } from './chart.js';
import { logEvent, logTrade } from './logger.js';
import { computeQtyFromBalance, buildTpSlPrices, floorToTick, qtyForPartial, kellySize } from './risk.js';
import { reachedDailyLossLimit } from './stats.js';
import { mean } from './utils.js';

function scoreRsi(rsiArr){ if (!rsiArr.length) return 0.5; const last = rsiArr[rsiArr.length-1]; return (last)/100; }
function scoreTrend(price, emaArr){ if (!emaArr.length) return 0.5; const emaNow = emaArr[emaArr.length-1] || price; const prevEma = emaArr.length>1? emaArr[emaArr.length-2]: emaNow; const slope = (emaNow - prevEma) / Math.max(1, prevEma); const dir = price >= emaNow ? 1 : 0; const slopeScore = 1/(1+Math.exp(-10*(slope))); return 0.5*dir + 0.5*slopeScore; }
function scoreVol(atrNow, price){ if (!atrNow || !price) return 0.5; const volRatio = atrNow/price; const v = Math.max(0, Math.min(1, 1 - (volRatio - 0.002)/(0.02-0.002))); return v; }

export class SymbolWorker{ constructor(symbol, interval){ this.symbol = symbol; this.interval = interval; this.closes=[]; this.highs=[]; this.lows=[]; this.times=[]; this.pending=null; this.lastSent={signature:null,ts:0}; this.trailing=null; this.equityStart=null; }

canSend(signature){ if (this.lastSent.signature===signature) return (Date.now()-this.lastSent.ts) > COOLDOWN_SECONDS*1000; return true; }
markSent(signature){ this.lastSent.signature=signature; this.lastSent.ts=Date.now(); }

async init(){ const raw = await fetchKlines(this.symbol, this.interval, 1500); this.closes = raw.map(r=>Number(r[4])); this.highs = raw.map(r=>Number(r[2])); this.lows = raw.map(r=>Number(r[3])); this.times = raw.map(r=>r[6]||r[0]); logEvent(`Worker ${this.symbol} loaded history ${this.closes.length}`); }

async ensureLeverage(){ try{ await changeLeverage(this.symbol, LEVERAGE); }catch(e){ logEvent('changeLeverage failed '+String(e)); } }

async onNewClosedCandle(){ try{ const { period, rsi } = computeAdaptiveRsi(this.closes); if (!rsi || rsi.length<2) { this.heartbeat(); return; } const price = this.closes[this.closes.length-1]; const rsiValue = rsi[rsi.length-1]; const emaArr = ema(this.closes); const trendUp = price >= (emaArr[emaArr.length-1]||price); const atrArr = atr(this.highs, this.lows, this.closes); const atrNow = atrArr[atrArr.length-1]||0;

  const rsiScore = scoreRsi(rsi);
  const trendScore = scoreTrend(price, emaArr);
  const volScore = scoreVol(atrNow, price);

  const macroLSR = await fetchLongShort(this.symbol,'5m').catch(()=>undefined);
  let macroScore = 0.5; if (macroLSR !== undefined) macroScore = macroLSR/(macroLSR+1);

  const totalScore = FUSION_W_RSI*rsiScore + FUSION_W_TREND*trendScore + FUSION_W_VOL*volScore + FUSION_W_MACRO*macroScore;

  let candidate = null; const prevRsi = rsi[rsi.length-2]; if (prevRsi <= 30 && rsiValue > 30) candidate='BUY'; if (prevRsi >= 70 && rsiValue < 70) candidate='SELL';

  if (candidate==='BUY' && totalScore >= FUSION_TH_BUY && trendUp) candidate='BUY'; else if (candidate==='SELL' && totalScore <= FUSION_TH_SELL && !trendUp) candidate='SELL'; else candidate=null;

  if (!candidate){ this.pending=null; this.heartbeat(price, rsiValue, period); return; }

  if (!this.pending) { this.pending = { type:candidate, count:1, period, price, rsi:rsiValue, score: totalScore }; logEvent(`Pending1 ${this.symbol} ${candidate} s=${totalScore.toFixed(3)}`); return; }
  if (this.pending.type === candidate) this.pending.count++; else this.pending = { type:candidate, count:1, period, price, rsi:rsiValue, score: totalScore };
  if (this.pending.count < CONFIRMATION_CANDLES){ logEvent(`Pending++ ${this.symbol} ${candidate} ${this.pending.count}`); return; }

  const signature = `${this.symbol}@${this.pending.type}@p${this.pending.period}`;
  if (!this.canSend(signature)){ logEvent('Cooldown active skip '+signature); this.pending=null; return; }
  this.markSent(signature);

  // chart
  const N = Math.min(200, this.closes.length);
  const labels = this.times.slice(-N).map(t=>{ const d=new Date(t); return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`; });
  const closesForChart = this.closes.slice(-N);
  const overlays = { ema: emaArr.slice(-N) };
  const cfg = buildLineChartConfig({ labels, closes: closesForChart, symbol: this.symbol, interval: this.interval, signalType: this.pending.type, overlays });
  let imgBuf=null; try{ imgBuf = await getChartPngBuffer(cfg); }catch(e){ logEvent('Chart gen failed '+String(e)); }

  const caption = [ `*${this.symbol} ${this.pending.type} (v4 CONFIRM x${CONFIRMATION_CANDLES})*`, `Price: ${price}`, `RSI(p${this.pending.period}): ${this.pending.rsi.toFixed(2)}`, `Score: ${this.pending.score.toFixed(3)}`, `Trend: ${trendUp? 'UP':'DOWN'} EMA${EMA_PERIOD}`, `ATR: ${atrNow?.toFixed(4)}`, `Time: ${new Date().toLocaleString()}` ].join('\n');

  if (imgBuf) await sendTelegramPhotoBuffer(imgBuf, caption); else await sendTelegramText(caption);

  // Auto-trade with safety
  if (AUTO_TRADE && !PAPER){ await this.ensureLeverage(); try{
    const info = await getSymbolInfo(this.symbol);
    const usdtBal = await fetchUSDTBalance(); if (usdtBal <= 0) throw new Error('USDT balance zero');

    const winProb = Math.min(0.9, Math.max(0.1, this.pending.score));
    const edge = Math.max(0.001, (this.pending.score - 0.5));
    const kellyFrac = Math.max(0, Math.min(1, edge * 2 * (KELLY_FACTOR||0.5)));
    const posPercent = POSITION_SIZE_PERCENT * kellyFrac;
    const qty = await computeQtyFromBalance({ symbol: this.symbol, usdtBalance: usdtBal, price, positionPercent: posPercent, leverage: LEVERAGE });
    if (qty <= 0) throw new Error('qty=0');

    const side = this.pending.type === 'BUY' ? 'BUY' : 'SELL';
    const order = await placeMarketOrder(this.symbol, side, qty, false);
    logTrade({ symbol:this.symbol, side, qty, price, meta:{ order } });

    const atrSl = this.pending.type==='BUY'? price - ATR_MULT_SL*atrNow : price + ATR_MULT_SL*atrNow;
    const { tp: tpFallback, sl: slFixed } = buildTpSlPrices({ side, price, takeProfitPct: TAKE_PROFIT_PERCENT, stopLossPct: STOP_LOSS_PERCENT, tickSize: info.tickSize });
    const slUse = floorToTick(atrSl || slFixed, info.tickSize);
    const closeSide = side==='BUY' ? 'SELL' : 'BUY';

    try{ await cancelAllOpenOrders(this.symbol); }catch{}
    try{ await placeCloseSL(this.symbol, closeSide, slUse.toFixed(8)); }catch(e){ logEvent('SL place failed '+String(e)); }

    try{ const tp1 = side==='BUY'? price*(1+PARTIAL_TP1_PROFIT/100) : price*(1-PARTIAL_TP1_PROFIT/100); const tp2 = side==='BUY'? price*(1+PARTIAL_TP2_PROFIT/100) : price*(1-PARTIAL_TP2_PROFIT/100); const q1 = qtyForPartial(qty, PARTIAL_TP1_PERCENT); const q2 = qtyForPartial(qty, PARTIAL_TP2_PERCENT); await placeLimitOrder(this.symbol, closeSide, q1.toFixed(8), tp1.toFixed(8), true); await placeLimitOrder(this.symbol, closeSide, q2.toFixed(8), tp2.toFixed(8), true); }catch(e){ logEvent('Partial TP place failed '+String(e)); }

    this.trailing = side==='BUY' ? { side, entryPrice: price, peak: price, slPrice: slUse } : { side, entryPrice: price, trough: price, slPrice: slUse };

    await sendTelegramText(`${this.symbol} AUTO-TRADE v4 ${side} qty=${qty} @${price}. SL ${slUse}`);
  }catch(e){ await sendTelegramText(`${this.symbol} AUTO-TRADE ERROR: ${String(e)}`); }}

  this.pending = null;
}catch(e){ logEvent('onNewClosedCandle error '+String(e)); this.pending=null; }}

async updateTrailing(price, atrNow){ if (!this.trailing || PAPER) return; try{ const info = await getSymbolInfo(this.symbol); const pos = await getPositionRisk(this.symbol); const posAmt = Number(pos.positionAmt || 0); if (posAmt === 0){ this.trailing = null; return; } const side = posAmt>0 ? 'BUY' : 'SELL'; if (side==='BUY'){ this.trailing.peak = Math.max(this.trailing.peak || price, price); const newSl = this.trailing.peak - ATR_MULT_TRAIL*atrNow; if (newSl > this.trailing.slPrice){ const sl = floorToTick(newSl, info.tickSize); const closeSide='SELL'; try{ await placeCloseSL(this.symbol, closeSide, sl.toFixed(8)); this.trailing.slPrice = sl; logEvent(`Trailing SL moved BUY -> ${sl}`); }catch(e){ logEvent('Trailing SL update failed '+String(e)); } } } else { this.trailing.trough = Math.min(this.trailing.trough || price, price); const newSl = this.trailing.trough + ATR_MULT_TRAIL*atrNow; if (newSl < this.trailing.slPrice){ const sl = floorToTick(newSl, info.tickSize); const closeSide = 'BUY'; try{ await placeCloseSL(this.symbol, closeSide, sl.toFixed(8)); this.trailing.slPrice = sl; logEvent(`Trailing SL moved SELL -> ${sl}`); }catch(e){ logEvent('Trailing SL update failed '+String(e)); } } } }catch(e){ logEvent('updateTrailing err '+String(e)); }}

heartbeat(price = this.closes[this.closes.length-1], rsiValue = null, period = null){ const msg = `[HB] ${this.symbol} ${this.interval} price=${price}${rsiValue?` RSI=${rsiValue.toFixed(2)}`:''}${period?` p${period}`:''}`; logEvent(msg); }

onKline(k){ const isFinal = k.x; const close = Number(k.c); const high = Number(k.h); const low = Number(k.l); const closeTime = k.T || k.t || Date.now(); if (isFinal){ this.closes.push(close); this.highs.push(high); this.lows.push(low); this.times.push(closeTime); if (this.closes.length>3000){ this.closes=this.closes.slice(-3000); this.highs=this.highs.slice(-3000); this.lows=this.lows.slice(-3000); this.times=this.times.slice(-3000); } this.onNewClosedCandle(); } }
}