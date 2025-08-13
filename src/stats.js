import { fetchUserTrades } from './binance.js';
import { sendTelegramText } from './telegram.js';
import { DAILY_REPORT_HOUR } from './config.js';

export function getTodayRangeWIB(){
  const now = new Date();
  const tzOffset = 7 * 60; // WIB UTC+7
  const utcNow = new Date(now.getTime() + (now.getTimezoneOffset()*60000));
  const wib = new Date(utcNow.getTime() + tzOffset*60000);
  const start = new Date(wib.getFullYear(), wib.getMonth(), wib.getDate(), 0,0,0);
  const end = new Date(wib.getFullYear(), wib.getMonth(), wib.getDate(), 23,59,59);
  return { startTime: start.getTime() - tzOffset*60000, endTime: end.getTime() - tzOffset*60000 };
}

export async function dailyStatsReport(symbols){
  const { startTime } = getTodayRangeWIB();
  let totalPnL = 0, tradesCount=0;
  for (const s of symbols){
    try{
      const trades = await fetchUserTrades(s, startTime);
      for (const t of trades){
        const realized = Number(t.realizedPnl || 0);
        totalPnL += realized;
        tradesCount++;
      }
    }catch{}
  }
  await sendTelegramText(`*Daily Report*\nTrades: ${tradesCount}\nRealized PnL(USDT): ${totalPnL.toFixed(2)}`);
}

export function shouldSendDailyReport(now = new Date()){
  return now.getHours() === DAILY_REPORT_HOUR;
}