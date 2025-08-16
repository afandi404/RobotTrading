<<<<<<< HEAD
export function mean(arr){ if(!arr||!arr.length) return 0; return arr.reduce((a,b)=>a+b,0)/arr.length; }
export function stddev(arr){ if(!arr||!arr.length) return 0; const m=mean(arr); return Math.sqrt(arr.reduce((s,x)=>s+(x-m)**2,0)/arr.length); }
=======
export function mean(arr){ if(!arr.length) return 0; return arr.reduce((a,b)=>a+b,0)/arr.length; }
export function stddev(arr){ if(!arr.length) return 0; const m=mean(arr); return Math.sqrt(arr.reduce((s,x)=>s+(x-m)**2,0)/arr.length); }
>>>>>>> 59f769cb3bc345dab8c09e78d07038b32c1ed172
export function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
export const sleep = (ms)=> new Promise(res=> setTimeout(res, ms));
export function floorToStep(value, step){ const precision = Math.max(0, Math.ceil(-Math.log10(step))); const factor = Math.pow(10, precision); return Math.floor(value * factor) / factor; }
export function roundToTick(value, tick){ const p = Math.max(0, Math.ceil(-Math.log10(tick))); const f = Math.pow(10, p); return Math.round(value * f) / f; }
export function sum(a){ return a.reduce((x,y)=>x+y,0); }
<<<<<<< HEAD
export function maxDrawdown(series){ if(!series.length) return 0; let peak=-Infinity, dd=0; for(const v of series){ peak = Math.max(peak, v); dd = Math.max(dd, (peak - v)/peak); } return dd; }
export function sharpe(returns, rf=0){ if(!returns.length) return 0; const ex = returns.map(r=>r-rf); const s = stddev(ex); return s? mean(ex)/s*Math.sqrt(252):0; }
export function sortino(returns, rf=0){ if(!returns.length) return 0; const ex = returns.map(r=>r-rf); const neg = ex.filter(r=>r<0); const ds = stddev(neg); return ds? mean(ex)/ds*Math.sqrt(252):0; }
export function pct(a,b){ return b===0?0: (a-b)/b*100; }

// seeded RNG (LCG) for deterministic backtests
let _seed = 1; export function seedRandom(seed=1){ _seed = seed; }
export function rand(){ _seed = (_seed * 1664525 + 1013904223) % 4294967296; return _seed / 4294967296; }
=======
export function maxDrawdown(series){ let peak=-Infinity, dd=0; for(const v of series){ peak = Math.max(peak, v); dd = Math.max(dd, (peak - v)/peak); } return dd; }
export function sharpe(returns, rf=0){ const ex = returns.map(r=>r-rf); const s = stddev(ex); return s? mean(ex)/s*Math.sqrt(252):0; }
export function sortino(returns, rf=0){ const ex = returns.map(r=>r-rf); const neg = ex.filter(r=>r<0); const ds = stddev(neg); return ds? mean(ex)/ds*Math.sqrt(252):0; }
export function pct(a,b){ return b===0?0: (a-b)/b*100; }
>>>>>>> 59f769cb3bc345dab8c09e78d07038b32c1ed172
