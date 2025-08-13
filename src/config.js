import dotenv from 'dotenv';
dotenv.config();

function parseList(s){ return s ? s.split(',').map(x=>x.trim()).filter(Boolean) : []; }

export const TESTNET = (process.env.TESTNET === 'true');
export const PAPER = (process.env.PAPER === 'true');
export const BACKTEST = (process.env.BACKTEST === 'true');

export const BINANCE_API_KEY = process.env.BINANCE_API_KEY || '';
export const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET || '';

export const SYMBOLS = parseList(process.env.SYMBOLS || 'BTCUSDT');
export const INTERVAL = process.env.INTERVAL || '5m';
export const HISTORY_LIMIT = Number(process.env.HISTORY_LIMIT || 300);

export const POSITION_SIZE_PERCENT = Number(process.env.POSITION_SIZE_PERCENT || 20);
export const LEVERAGE = Number(process.env.LEVERAGE || 1);
export const TAKE_PROFIT_PERCENT = Number(process.env.TAKE_PROFIT_PERCENT || 1.5);
export const STOP_LOSS_PERCENT = Number(process.env.STOP_LOSS_PERCENT || 0.8);
export const TRAILING_STOP_PERCENT = Number(process.env.TRAILING_STOP_PERCENT || 0.5);
export const PARTIAL_TP1_PERCENT = Number(process.env.PARTIAL_TP1_PERCENT || 0.6);
export const PARTIAL_TP1_PROFIT = Number(process.env.PARTIAL_TP1_PROFIT || 0.8);
export const PARTIAL_TP2_PERCENT = Number(process.env.PARTIAL_TP2_PERCENT || 0.4);
export const PARTIAL_TP2_PROFIT = Number(process.env.PARTIAL_TP2_PROFIT || 1.5);
export const DAILY_MAX_LOSS_PERCENT = Number(process.env.DAILY_MAX_LOSS_PERCENT || 0);

export const AUTO_TRADE = (process.env.AUTO_TRADE === 'true');

export const CONFIRMATION_CANDLES = Number(process.env.CONFIRMATION_CANDLES || 2);
export const BASE_RSI = Number(process.env.BASE_RSI || 14);
export const MIN_RSI_PERIOD = Number(process.env.MIN_RSI_PERIOD || 5);
export const MAX_RSI_PERIOD = Number(process.env.MAX_RSI_PERIOD || 50);
export const VOL_WINDOW = Number(process.env.VOL_WINDOW || 100);
export const RSI_LOWER = Number(process.env.RSI_THRESHOLD_LOWER || 30);
export const RSI_UPPER = Number(process.env.RSI_THRESHOLD_UPPER || 70);

export const LSR_BUY = Number(process.env.LSR_BUY || 1.2);
export const LSR_SELL = Number(process.env.LSR_SELL || 0.8);
export const FUNDING_THRESHOLD = Number(process.env.FUNDING_THRESHOLD || 0);

export const COOLDOWN_SECONDS = Number(process.env.COOLDOWN_SECONDS || 300);
export const DAILY_REPORT_HOUR = Number(process.env.DAILY_REPORT_HOUR || 23);

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

export const QUICKCHART_WIDTH = Number(process.env.CHART_WIDTH || 1200);
export const QUICKCHART_HEIGHT = Number(process.env.CHART_HEIGHT || 500);

export const LOG_DIR = process.env.LOG_DIR || 'logs';

// Primary + failover endpoints
export const REST_FAPI = TESTNET ? (process.env.REST_FAPI_TESTNET || 'https://testnet.binancefuture.com') : (process.env.REST_FAPI || 'https://fapi.binance.com');
export const REST_FAPI_BACKUP = process.env.REST_FAPI_BACKUP || 'https://api1.binance.com';
export const FSTREAM_BASE = TESTNET ? (process.env.FSTREAM_TESTNET || 'wss://stream.binancefuture.com') : 'wss://fstream.binance.com';

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn('Warning: Telegram token/chat id not set — notifications disabled.');
}