export function mean(arr){ if(!arr.length) return 0; return arr.reduce((a,b)=>a+b,0)/arr.length; }
export function stddev(arr){ if(!arr.length) return 0; const m=mean(arr); return Math.sqrt(arr.reduce((s,x)=>s+(x-m)**2,0)/arr.length); }
export function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
export const sleep = (ms)=> new Promise(res=> setTimeout(res, ms));
export function floorToStep(value, step){ const precision = Math.max(0, Math.ceil(-Math.log10(step))); const factor = Math.pow(10, precision); return Math.floor(value * factor) / factor; }