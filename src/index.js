import WebSocket from 'ws';
import { SYMBOLS, INTERVAL, FSTREAM_BASE } from './config.js';
import { SymbolWorker } from './signal.js';
import { logEvent, logError } from './logger.js';
import { sendTelegramText } from './telegram.js';
import { dailyStatsReport, shouldSendDailyReport } from './stats.js';
import { syncServerTime } from './http.js';

const workers = new Map();

<<<<<<< HEAD
async function bootstrap(){ logEvent('Bootstrapping bot...'); await syncServerTime();
  for (const s of SYMBOLS){ const w = new SymbolWorker(s, INTERVAL); await w.init(); workers.set(s.toLowerCase(), w); }

  let reconnectDelay = 1000;
  function connectWS(){ const streams = Array.from(workers.keys()).map(k => `${k}@kline_${INTERVAL}`).join('/'); const wsUrl = `${FSTREAM_BASE}/stream?streams=${streams}`; logEvent('Connecting combined WS', { wsUrl }); const ws = new WebSocket(wsUrl);

    let alive=false; let pingTimer=null; let dailyTimer=null;

    ws.on('open', ()=>{ logEvent('WS open'); alive=true; reconnectDelay=1000; pingTimer=setInterval(()=>{ if (!alive){ logEvent('WS heartbeat failed, terminating'); try{ ws.terminate(); }catch{} } alive=false; try{ ws.ping(); }catch{} }, 15000); dailyTimer=setInterval(async ()=>{ if (shouldSendDailyReport(new Date())){ try{ await dailyStatsReport(SYMBOLS); }catch(e){ logError('dailyStatsReport err '+String(e)); } } }, 60*1000); });

    ws.on('pong', ()=>{ alive=true; });

    ws.on('message', (raw)=>{ try{ const msg = JSON.parse(raw.toString()); if (!msg || !msg.data || !msg.stream) return; const data = msg.data; const symbol = data.s.toLowerCase(); const worker = workers.get(symbol); if (worker){ worker.onKline(data.k); } }catch(e){ logEvent('WS msg parse err '+String(e)); } });

    function cleanup(){ if (pingTimer) clearInterval(pingTimer); if (dailyTimer) clearInterval(dailyTimer); }

    ws.on('close', (code, reason)=>{ cleanup(); logEvent('WS closed '+code+' '+String(reason)); setTimeout(()=> connectWS(), reconnectDelay); reconnectDelay = Math.min(reconnectDelay*2, 30000); });
    ws.on('error', (err)=>{ logEvent('WS error '+String(err)); try{ ws.close(); }catch(e){} });
  }

  connectWS();
  await sendTelegramText(`Trading Bot Pro v4 started. Symbols: ${SYMBOLS.join(', ')} Interval: ${INTERVAL}`);

=======
async function bootstrap(){
  logEvent('Bootstrapping bot...');
  await syncServerTime();

  for (const s of SYMBOLS){
    const w = new SymbolWorker(s, INTERVAL);
    await w.init();
    workers.set(s.toLowerCase(), w);
  }

  let reconnectDelay = 1000; // start with 1s
  function connectWS(){
    const streams = Array.from(workers.keys()).map(k => `${k}@kline_${INTERVAL}`).join('/');
    const wsUrl = `${FSTREAM_BASE}/stream?streams=${streams}`;
    logEvent('Connecting combined WS', { wsUrl });
    const ws = new WebSocket(wsUrl);

    let alive = false;
    let pingTimer = null;
    let dailyTimer = null;

    ws.on('open', ()=> {
      logEvent('WS open');
      alive = true;
      reconnectDelay = 1000; // reset
      pingTimer = setInterval(()=>{
        if (!alive){ logEvent('WS heartbeat failed, terminating'); try{ ws.terminate(); }catch{} }
        alive = false; try{ ws.ping(); }catch{}
      }, 15000);

      dailyTimer = setInterval(async ()=>{
        if (shouldSendDailyReport(new Date())){
          try{ await dailyStatsReport(SYMBOLS); }catch(e){ logError('dailyStatsReport err '+String(e)); }
        }
      }, 60*1000);
    });

    ws.on('pong', ()=>{ alive = true; });

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

    function cleanup(){ if (pingTimer) clearInterval(pingTimer); if (dailyTimer) clearInterval(dailyTimer); }

    ws.on('close', (code, reason) => {
      cleanup();
      logEvent('WS closed ' + code + ' ' + String(reason));
      setTimeout(()=> connectWS(), reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay*2, 30000);
    });

    ws.on('error', (err) => { logEvent('WS error ' + String(err)); try{ ws.close(); }catch(e){} });
  }

  connectWS();

  await sendTelegramText(`Trading Bot Pro v3 started. Symbols: ${SYMBOLS.join(', ')} Interval: ${INTERVAL}`);

  // graceful shutdown
>>>>>>> 59f769cb3bc345dab8c09e78d07038b32c1ed172
  process.on('SIGINT', ()=>{ logEvent('SIGINT received, exiting'); process.exit(0); });
  process.on('SIGTERM', ()=>{ logEvent('SIGTERM received, exiting'); process.exit(0); });
}

<<<<<<< HEAD
bootstrap().catch(e=>{ logError('Bootstrap failed '+String(e)); process.exit(1); });
=======
bootstrap().catch(e => { logEvent('Bootstrap failed ' + String(e)); process.exit(1); });
>>>>>>> 59f769cb3bc345dab8c09e78d07038b32c1ed172
