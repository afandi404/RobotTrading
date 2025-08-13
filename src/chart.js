// Build & render QuickChart images tanpa extra dependency
import axios from 'axios';
import { QUICKCHART_WIDTH, QUICKCHART_HEIGHT } from './config.js';

export function buildLineChartConfig({ labels, closes, symbol, interval, signalType }){
  const cfg = {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: `${symbol} ${interval}`, data: closes, fill: false, borderWidth: 2, pointRadius: 0 },
        { type: 'bubble', label: 'Signal', data: closes.map((v,i)=> i===closes.length-1 ? { x:i, y:v, r: 8 } : null), backgroundColor: signalType === 'BUY' ? 'green' : 'red' }
      ]
    },
    options: { legend: { display: false }, title: { display: true, text: `${symbol} • ${signalType} signal` }, scales: { xAxes: [{ display: true }], yAxes: [{ display: true }] } }
  };
  return cfg;
}

export async function getChartPngBuffer(config){
  const qcUrl = 'https://quickchart.io/chart';
  const url = `${qcUrl}?width=${QUICKCHART_WIDTH}&height=${QUICKCHART_HEIGHT}&format=png&c=${encodeURIComponent(JSON.stringify(config))}`;
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
  return Buffer.from(res.data);
}