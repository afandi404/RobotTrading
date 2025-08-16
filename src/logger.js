<<<<<<< HEAD
import winston from 'winston';
import fs from 'fs';
import { LOG_DIR } from './config.js';

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => `${timestamp} [${level}] ${message} ${Object.keys(meta).length? JSON.stringify(meta):''}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: `${LOG_DIR}/combined.log` }),
    new winston.transports.File({ filename: `${LOG_DIR}/error.log`, level: 'error' })
  ]
});

export default logger;
export const logEvent = (msg, meta={})=> logger.info(msg, meta);
export const logWarn = (msg, meta={})=> logger.warn(msg, meta);
export const logError = (err, meta={})=> logger.error(typeof err==='string'?err: (err.message || String(err)), meta);

// trade logger (append JSON lines)
import path from 'path';
const tradeFile = path.join(LOG_DIR, 'trades.log');
export function logTrade(entry){ try{ fs.appendFileSync(tradeFile, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'); logEvent(`TRADE ${entry.side} ${entry.symbol} ${entry.qty}@${entry.price}`); }catch(e){ logError('logTrade failed '+String(e)); } }

export function loadPnlState(){ try{ return JSON.parse(fs.readFileSync(path.join(LOG_DIR,'pnl_state.json'),'utf8')); }catch{ return { today: null, realized: 0 }; } }
export function savePnlState(state){ try{ fs.writeFileSync(path.join(LOG_DIR,'pnl_state.json'), JSON.stringify(state)); }catch(e){ logError('savePnlState failed '+String(e)); } }
=======
import fs from 'fs';
import path from 'path';
import { LOG_DIR } from './config.js';

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const tradeLogFile = path.join(LOG_DIR, 'trades.log');
const eventLogFile = path.join(LOG_DIR, 'events.log');
const pnlStateFile  = path.join(LOG_DIR, 'pnl_state.json');

export function logEvent(msg, meta = {}){
  const line = JSON.stringify({ ts: new Date().toISOString(), level:'info', msg, ...meta });
  console.log(msg, Object.keys(meta).length ? meta : '');
  fs.appendFileSync(eventLogFile, line + "\n");
}

export function logWarn(msg, meta = {}){
  const line = JSON.stringify({ ts: new Date().toISOString(), level:'warn', msg, ...meta });
  console.warn(msg, Object.keys(meta).length ? meta : '');
  fs.appendFileSync(eventLogFile, line + "\n");
}

export function logError(err, meta={}){
  const line = JSON.stringify({ ts: new Date().toISOString(), level:'error', err: String(err), ...meta });
  console.error(err);
  fs.appendFileSync(eventLogFile, line + "\n");
}

export function logTrade(entry){
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry });
  console.log('TRADE', entry.side, entry.symbol, entry.qty, '@', entry.price);
  fs.appendFileSync(tradeLogFile, line + "\n");
}

export function loadPnlState(){
  try{ return JSON.parse(fs.readFileSync(pnlStateFile,'utf8')); }catch{ return { today: null, realized: 0 }; }
}
export function savePnlState(state){
  try{ fs.writeFileSync(pnlStateFile, JSON.stringify(state)); }catch{}
}
>>>>>>> 59f769cb3bc345dab8c09e78d07038b32c1ed172
