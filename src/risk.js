import { floorToStep, roundToTick } from './utils.js';
import { getSymbolInfo } from './binance.js';
import { TAKER_FEE_BPS, SLIPPAGE_BPS } from './config.js';

export function floorToTick(value, tick){
  const p = Math.max(0, Math.ceil(-Math.log10(tick)));
  const f = Math.pow(10, p);
  return Math.floor(value * f) / f;
}

export async function computeQtyFromBalance({ symbol, usdtBalance, price, positionPercent = 20, leverage = 1 }){
  const info = await getSymbolInfo(symbol);
  const notional = usdtBalance * (positionPercent/100) * leverage;
  let rawQty = notional / price;
  rawQty = floorToStep(rawQty, info.stepSize);
  if (rawQty < info.minQty) return 0;
  return rawQty;
}

export function buildTpSlPrices({ side, price, takeProfitPct, stopLossPct, tickSize }){
  const tp = side==='BUY' ? price * (1 + takeProfitPct/100) : price * (1 - takeProfitPct/100);
  const sl = side==='BUY' ? price * (1 - stopLossPct/100) : price * (1 + stopLossPct/100);
  return {
    tp: floorToTick(tp, tickSize),
    sl: floorToTick(sl, tickSize)
  };
}

export function applyCosts(price, side){
  // naive cost model: taker fee + slippage
  const fee = price * (TAKER_FEE_BPS/10000);
  const slip = price * (SLIPPAGE_BPS/10000);
  return side==='BUY' ? price + fee + slip : price - fee - slip;
}

export function qtyForPartial(qty, pct){ return roundToTick(qty * pct, 1e-8); }