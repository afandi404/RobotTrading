import axios from 'axios';
import crypto from 'crypto';
import { REST_FAPI, REST_FAPI_BACKUP, BINANCE_API_KEY, BINANCE_API_SECRET } from './config.js';
import { sleep } from './utils.js';
import { logWarn, logError } from './logger.js';

const INST = axios.create({ timeout: 20000 });
let _timeSkewMs = 0;

function isRetryable(err){ if (!err || !err.response) return true; const s = err.response.status; return [418,429,430,500,502,503,504].includes(s); }

async function requestWithRetry({ method='GET', url, params={}, headers={}, data=null, maxRetries=4, baseBackoff=300 }){
  let lastErr;
  for (let i=0;i<=maxRetries;i++){
    try{ const res = await INST.request({ method, url, params, headers, data }); return res.data; } catch(e){ lastErr = e; if (!isRetryable(e) || i===maxRetries) break; const ra = Number(e?.response?.headers?.['retry-after']||0)*1000; const jitter = Math.floor(Math.random()*200) + Math.floor(Math.random()*i*50);
      const wait = Math.max(ra, baseBackoff * Math.pow(2,i)) + jitter;
      logWarn(`HTTP retry ${i+1} for ${url} wait=${wait}`);
      await sleep(wait);
    }
  }
  logError('requestWithRetry failed '+url, { err: String(lastErr) });
  throw lastErr;
}

export async function syncServerTime(){ try{ const t = await requestWithRetry({ method:'GET', url: `${REST_FAPI}/fapi/v1/time`}); const serverTime = Number(t.serverTime || t.server_time || 0); _timeSkewMs = serverTime ? (serverTime - Date.now()) : 0; }catch(e){ logWarn('syncServerTime failed '+String(e)); } }

export function signParams(params){ const timestamp = Date.now() + _timeSkewMs; const payload = { ...params, timestamp, recvWindow: 60000 }; const qs = Object.keys(payload).sort().map(k=>`${k}=${encodeURIComponent(payload[k])}`).join('&'); const signature = crypto.createHmac('sha256', BINANCE_API_SECRET).update(qs).digest('hex'); return { qs, signature } }

export async function publicGet(path, params = {}){ const urls = [`${REST_FAPI}${path}`, `${REST_FAPI_BACKUP}${path}`]; for (const url of urls){ try{ return await requestWithRetry({ method:'GET', url, params }); }catch(e){ logWarn('publicGet failed, trying next '+url); } } return await requestWithRetry({ method:'GET', url: `${REST_FAPI}${path}`, params }); }

export async function signedRequest(method, path, params = {}){ if (!BINANCE_API_KEY || !BINANCE_API_SECRET) throw new Error('Binance keys not set'); const { qs, signature } = signParams(params); const url = `${REST_FAPI}${path}?${qs}&signature=${signature}`; const headers = { 'X-MBX-APIKEY': BINANCE_API_KEY };
  try { return await requestWithRetry({ method, url, headers }); } catch(e){ if (String(e).includes('-1021') || String(e).includes('recvWindow')){ await syncServerTime(); } throw e; }
}