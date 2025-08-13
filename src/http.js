import axios from 'axios';
import crypto from 'crypto';
import { BINANCE_API_KEY, BINANCE_API_SECRET, REST_FAPI, REST_FAPI_BACKUP } from './config.js';
import { sleep } from './utils.js';

const INST = axios.create({ timeout: 15000 });

function isRetryable(err){
  if (!err || !err.response) return true; // network/timeouts
  const s = err.response.status;
  if ([429, 418, 500, 502, 503, 504].includes(s)) return true;
  return false;
}

export async function requestWithRetry({ method='GET', url, params={}, headers={}, data=null, maxRetries=3, backoffMs=400 }){
  let lastErr;
  for (let i=0;i<=maxRetries;i++){
    try{
      const res = await INST.request({ method, url, params, headers, data });
      return res.data;
    }catch(e){
      lastErr = e;
      if (!isRetryable(e) || i===maxRetries) break;
      const jitter = Math.floor(Math.random()*200);
      await sleep(backoffMs * Math.pow(2,i) + jitter);
    }
  }
  throw lastErr;
}

export function signParams(params){
  const timestamp = Date.now();
  const payload = { ...params, timestamp };
  const qs = Object.keys(payload).sort().map(k=>`${k}=${encodeURIComponent(payload[k])}`).join('&');
  const signature = crypto.createHmac('sha256', BINANCE_API_SECRET).update(qs).digest('hex');
  return { qs, signature };
}

export async function publicGet(path, params = {}){
  const urls = [`${REST_FAPI}${path}`, `${REST_FAPI_BACKUP}${path}`];
  for (const url of urls){
    try{ return await requestWithRetry({ method:'GET', url, params }); }catch(e){ /* try next */ }
  }
  // if all failed, throw last error
  return await requestWithRetry({ method:'GET', url: `${REST_FAPI}${path}`, params });
}

export async function signedRequest(method, path, params = {}){
  if (!BINANCE_API_KEY || !BINANCE_API_SECRET) throw new Error('Binance API key/secret not set');
  const { qs, signature } = signParams(params);
  const url = `${REST_FAPI}${path}?${qs}&signature=${signature}`;
  const headers = { 'X-MBX-APIKEY': BINANCE_API_KEY };
  return await requestWithRetry({ method, url, headers });
}