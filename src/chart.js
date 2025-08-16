import axios from 'axios';
import { QUICKCHART_WIDTH, QUICKCHART_HEIGHT } from './config.js';
export function buildLineChartConfig({ labels, closes, symbol, interval, signalType, overlays = {} }){
  const datasets = [ { label: `${symbol} ${interval}`, data: closes, fill: false, borderWidth: 2, pointRadius: 0 } ];
  if (overlays.ema){ datasets.push({ label: 'EMA', data: overlays.ema, fill:false, borderWidth:1, pointRadius:0 }); }
  datasets.push({ type: 'bubble', label: 'Signal', data: closes.map((v,i)=> i===closes.length-1 ? { x:i, y:v, r: 8 } : null) });
  const cfg = { type: 'line', data: { labels, datasets }, options: { plugins: { legend: { display: true }, title: { display: true, text: `${symbol} • ${signalType} signal` } }, scales: { x: { display: true }, y: { display: true } } } };
  return cfg;
}
export async function getChartPngBuffer(config){ const qcUrl = 'https://quickchart.io/chart'; const url = `${qcUrl}?width=${QUICKCHART_WIDTH}&height=${QUICKCHART_HEIGHT}&format=png&c=${encodeURIComponent(JSON.stringify(config))}`; const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 }); return Buffer.from(res.data); }