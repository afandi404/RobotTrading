import { floorToStep } from './utils.js';
import { getSymbolInfo } from './binance.js';

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

// export function floorToStep(value, step){
//   const precision = Math.max(0, Math.ceil(-Math.log10(step)));
//   const factor = Math.pow(10, precision);
//   return Math.floor(value * factor) / factor;
// }