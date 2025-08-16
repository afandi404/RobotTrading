import { publicGet, signedRequest } from './http.js';

const _symbolInfoCache = new Map();

export async function fetchExchangeInfo(){ return await publicGet('/fapi/v1/exchangeInfo'); }

export async function getSymbolInfo(symbol){ const k = symbol.toUpperCase(); if (_symbolInfoCache.has(k)) return _symbolInfoCache.get(k); const info = await fetchExchangeInfo(); const sym = info.symbols.find(s=>s.symbol===k); if (!sym) throw new Error(`Symbol ${k} not found`); const lotFilter = sym.filters.find(f=>f.filterType==='LOT_SIZE'); const priceFilter = sym.filters.find(f=>f.filterType==='PRICE_FILTER'); const minNotional = sym.filters.find(f=>f.filterType==='MIN_NOTIONAL'); const res = { symbol: k, stepSize: Number(lotFilter?.stepSize || '0.001'), minQty: Number(lotFilter?.minQty || '0.001'), tickSize: Number(priceFilter?.tickSize || '0.01'), minNotional: Number(minNotional?.notional || '0') }; _symbolInfoCache.set(k,res); return res; }

export async function fetchKlines(symbol, interval, limit = 500, startTime, endTime){ return await publicGet('/fapi/v1/klines', { symbol, interval, limit, startTime, endTime }); }
export async function fetchBalance(){ return await signedRequest('GET', '/fapi/v2/balance'); }
export async function fetchUSDTBalance(){ const balances = await fetchBalance(); const b = balances.find(x => x.asset === 'USDT'); return b ? Number(b.balance) : 0; }

export async function fetchLongShort(symbol, period='5m'){ try{ const data = await publicGet('/futures/data/globalLongShortAccountRatio', { symbol, period, limit: 1 }); if (!Array.isArray(data) || data.length===0) return undefined; const last=data[0]; const ratio = last.longShortRatio ?? last.longShortAccountRatio ?? last.ratio; return Number(ratio); }catch{return undefined;} }

export async function fetchFundingRate(symbol, limit=1){ try{ const data = await publicGet('/fapi/v1/fundingRate', { symbol, limit }); if (!Array.isArray(data) || data.length===0) return undefined; const last = data[data.length-1]; return Number(last.fundingRate); }catch{return undefined;} }

export async function fetchOpenInterest(symbol){ try{ const data = await publicGet('/fapi/v1/openInterest', { symbol }); return Number(data.openInterest); }catch{return undefined;} }

export async function fetchMarkPrice(symbol){ try{ const d = await publicGet('/fapi/v1/premiumIndex', { symbol }); return Number(d.markPrice); }catch{return undefined;} }

export async function fetchOrderBook(symbol, limit=50){ return await publicGet('/fapi/v1/depth', { symbol, limit }); }

export async function changeLeverage(symbol, leverage){ return await signedRequest('POST', '/fapi/v1/leverage', { symbol, leverage }); }

export async function getPositionRisk(symbol){ const data = await signedRequest('GET', '/fapi/v2/positionRisk', { symbol }); return Array.isArray(data) ? data[0] : data; }

export async function placeMarketOrder(symbol, side, quantity, reduceOnly=false){ const params = { symbol, side, type: 'MARKET', quantity, reduceOnly }; return await signedRequest('POST', '/fapi/v1/order', params); }
export async function placeLimitOrder(symbol, side, quantity, price, reduceOnly=false){ const params = { symbol, side, type: 'LIMIT', timeInForce: 'GTC', quantity, price, reduceOnly }; return await signedRequest('POST', '/fapi/v1/order', params); }
export async function placeCloseTP(symbol, side, stopPrice){ const params = { symbol, side, type: 'TAKE_PROFIT_MARKET', stopPrice, closePosition: true, workingType: 'CONTRACT_PRICE' }; return await signedRequest('POST', '/fapi/v1/order', params); }
export async function placeCloseSL(symbol, side, stopPrice){ const params = { symbol, side, type: 'STOP_MARKET', stopPrice, closePosition: true, workingType: 'CONTRACT_PRICE' }; return await signedRequest('POST', '/fapi/v1/order', params); }
export async function cancelAllOpenOrders(symbol){ return await signedRequest('DELETE', '/fapi/v1/allOpenOrders', { symbol }); }
export async function fetchUserTrades(symbol, startTime){ return await signedRequest('GET', '/fapi/v1/userTrades', { symbol, startTime }); }