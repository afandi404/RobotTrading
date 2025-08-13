import WebSocket from 'ws';
import { SYMBOLS, INTERVAL, FSTREAM_BASE } from './config.js';
import { SymbolWorker } from './signal.js';
import { logEvent } from './logger.js';
import { sendTelegramText } from './telegram.js';

const workers = new Map();

async function bootstrap(){
  logEvent('Bootstrapping bot...');
  for (const s of SYMBOLS){
    const w = new SymbolWorker(s, INTERVAL);
    await w.init();
    workers.set(s.toLowerCase(), w);
  }

  const streams = Array.from(workers.keys()).map(k => `${k}@kline_${INTERVAL}`).join('/');
  const wsUrl = `${FSTREAM_BASE}/stream?streams=${streams}`;
  logEvent('Connecting combined WS', { wsUrl });
  const ws = new WebSocket(wsUrl);

  ws.on('open', ()=> logEvent('WS open'));
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (!msg || !msg.data || !msg.stream) return;
      const data = msg.data; // kline payload
      const symbol = data.s.toLowerCase();
      const worker = workers.get(symbol);
      if (worker){ worker.onKline(data.k); }
    } catch (e){ logEvent('WS msg parse err ' + String(e)); }
  });

  ws.on('close', (code, reason) => { logEvent('WS closed ' + code + ' ' + String(reason)); setTimeout(()=> bootstrap(), 2000); });
  ws.on('error', (err) => { logEvent('WS error ' + String(err)); try{ ws.close(); }catch(e){} });

  await sendTelegramText(`Trading Bot Pro started. Symbols: ${SYMBOLS.join(', ')} Interval: ${INTERVAL}`);
}

bootstrap().catch(e => { logEvent('Bootstrap failed ' + String(e)); process.exit(1); });