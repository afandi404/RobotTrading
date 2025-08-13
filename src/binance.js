import axios from 'axios';
import crypto from 'crypto';
import { BINANCE_API_KEY, BINANCE_API_SECRET, REST_FAPI } from './config.js';

function qsFrom(obj){
  return Object.keys(obj).sort().map(k=>`${k}=${encodeURIComponent(obj[k])}`).join('&');
}

async function publicGet(path, params = {}){
  const url = `${REST_FAPI}${path}`;
  const res = await axios.get(url, { params, timeout: 12000 });
  return res.data;
}

async function signedRequest(method, path, params = {}){
  if (!BINANCE_API_KEY || !BINANCE_API_SECRET) throw new Error('Binance API key/secret not set');
  const timestamp = Date.now();
  const payload = { ...params, timestamp };
  const qs = qsFrom(payload);
  const signature = crypto.createHmac('sha256', BINANCE_API_SECRET).update(qs).digest('hex');
  const url = `${REST_FAPI}${path}?${qs}&signature=${signature}`;
  const headers = { 'X-MBX-APIKEY': BINANCE_API_KEY };
  const res = await axios({ method, url, headers, timeout: 20000 });
  return res.data;
}

export async function fetchKlines(symbol, interval, limit = 500){
  return await publicGet('/fapi/v1/klines', { symbol, interval, limit });
}

export async function fetchBalance(){
  return await signedRequest('GET', '/fapi/v2/balance');
}

export async function fetchUSDTBalance(){
  const balances = await fetchBalance();
  const b = balances.find(x => x.asset === 'USDT');
  return b ? Number(b.balance) : 0;
}

export async function fetchLongShort(symbol, period='5m'){
  try {
    const url = `${REST_FAPI}/futures/data/globalLongShortAccountRatio`;
    const res = await axios.get(url, { params: { symbol, period, limit: 1 }, timeout: 8000 });
    if (!Array.isArray(res.data) || res.data.length === 0) return undefined;
    const last = res.data[0];
    const ratio = last.longShortRatio ?? last.longShortAccountRatio ?? last.ratio ?? last.longShortAccountRatio;
    return Number(ratio);
  } catch (e){ console.warn('fetchLongShort err', e?.message || e); return undefined; }
}

export async function fetchFundingRate(symbol, limit = 1){
  try {
    const res = await axios.get(`${REST_FAPI}/fapi/v1/fundingRate`, { params: { symbol, limit }, timeout: 8000 });
    if (!Array.isArray(res.data) || res.data.length === 0) return undefined;
    const last = res.data[res.data.length-1];
    return Number(last.fundingRate);
  } catch (e){ console.warn('fetchFundingRate err', e?.message || e); return undefined; }
}

export async function fetchOpenInterest(symbol){
  try {
    const res = await axios.get(`${REST_FAPI}/fapi/v1/openInterest`, { params: { symbol }, timeout: 8000 });
    return Number(res.data.openInterest);
  } catch (e){ console.warn('fetchOpenInterest err', e?.message || e); return undefined; }
}

export async function placeMarketOrder(symbol, side, quantity){
  const params = { symbol, side, type: 'MARKET', quantity };
  return await signedRequest('POST', '/fapi/v1/order', params);
}

export async function placeCloseTP(symbol, side, stopPrice){
  // Close position TP with market trigger
  const params = { symbol, side, type: 'TAKE_PROFIT_MARKET', stopPrice, closePosition: true, workingType: 'CONTRACT_PRICE' };
  return await signedRequest('POST', '/fapi/v1/order', params);
}

export async function placeCloseSL(symbol, side, stopPrice){
  const params = { symbol, side, type: 'STOP_MARKET', stopPrice, closePosition: true, workingType: 'CONTRACT_PRICE' };
  return await signedRequest('POST', '/fapi/v1/order', params);
}