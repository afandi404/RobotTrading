import { fetchUserTrades } from './binance.js';
import { sendTelegramText } from './telegram.js';
import { DAILY_REPORT_HOUR } from './config.js';
import { loadPnlState, savePnlState } from './logger.js';

let lastReportDate = null;

export function getTodayRangeWIB(){
  const now = new Date();
  const tzOffset = 7 * 60; // WIB UTC+7
  const utcNow = new Date(now.getTime() + (now.getTimezoneOffset()*60000));
  const wib = new Date(utcNow.getTime() + tzOffset*60000);
  const start = new Date(wib.getFullYear(), wib.getMonth(), wib.getDate(), 0,0,0);
  const end = new Date(wib.getFullYear(), wib.getMonth(), wib.getDate(), 23,59,59);
  return { startTime: start.getTime() - tzOffset*60000, endTime: end.getTime() - tzOffset*60000, ymd: wib.toISOString().slice(0,10) };
}

export async function dailyStatsReport(symbols){
  const { startTime, ymd } = getTodayRangeWIB();
  let totalPnL = 0, tradesCount=0;
  for (const s of symbols){
    try{
      const trades = await fetchUserTrades(s, startTime);
      for (const t of trades){
        const realized = Number(t.realizedPnl || 0);
        totalPnL += realized; tradesCount++;
      }
    }catch{}
  }
  const st = loadPnlState();
  const state = (st.today===ymd) ? st : { today: ymd, realized: 0 };
  state.realized = totalPnL;
  savePnlState(state);

  await sendTelegramText(`*Daily Report*\nTrades: ${tradesCount}\nRealized PnL(USDT): ${totalPnL.toFixed(2)}`);
}

export function shouldSendDailyReport(now = new Date()) {
  const today = now.toISOString().split('T')[0];
  const isCorrectHour = now.getHours() === DAILY_REPORT_HOUR;
  if (isCorrectHour && lastReportDate !== today) { lastReportDate = today; return true; }
  return false;
}

export function reachedDailyLossLimit(equityStart, equityNow, maxLossPct){
  if (!maxLossPct) return false;
  const dropPct = (equityStart>0) ? ( (equityStart - equityNow) / equityStart * 100 ) : 0;
  return dropPct >= maxLossPct;
}