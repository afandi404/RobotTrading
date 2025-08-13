export function floorToStep(value, step){
  const precision = Math.max(0, Math.ceil(-Math.log10(step)));
  const factor = Math.pow(10, precision);
  return Math.floor(value * factor) / factor;
}

export function computeQtyFromBalance({ usdtBalance, price, positionPercent = 20, leverage = 1, stepSize = 0.001 }){
  const notional = usdtBalance * (positionPercent/100) * leverage;
  const rawQty = notional / price;
  return floorToStep(rawQty, stepSize);
}