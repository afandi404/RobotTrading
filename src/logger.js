import fs from 'fs';
import path from 'path';
import { LOG_DIR } from './config.js';

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const tradeLogFile = path.join(LOG_DIR, 'trades.log');
const eventLogFile = path.join(LOG_DIR, 'events.log');

export function logEvent(msg, meta = {}){
  const line = JSON.stringify({ ts: new Date().toISOString(), msg, meta });
  console.log(msg, Object.keys(meta).length ? meta : '');
  fs.appendFileSync(eventLogFile, line + '');
}

export function logTrade(entry){
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry });
  console.log('TRADE', entry.side, entry.symbol, entry.qty, '@', entry.price);
  fs.appendFileSync(tradeLogFile, line + '');
}

export function logError(err){
  console.error(err);
  try { fs.appendFileSync(eventLogFile, JSON.stringify({ ts: new Date().toISOString(), err: String(err) }) + ''); } catch(e){}
}