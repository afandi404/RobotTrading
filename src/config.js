import dotenv from 'dotenv';
dotenv.config();

function parseList(s){ return s ? s.split(',').map(x=>x.trim()).filter(Boolean) : []; }
function num(name, def){ const v = Number(process.env[name]); return Number.isFinite(v)?v:def; }
function bool(name){ return (process.env[name] === 'true'); }

export const TESTNET = bool('TESTNET');
export const PAPER = bool('PAPER');
export const BACKTEST = bool('BACKTEST');

export const BINANCE_API_KEY = process.env.BINANCE_API_KEY || '';
export const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET || '';

export const SYMBOLS = parseList(process.env.SYMBOLS || 'BTCUSDT');
export const INTERVAL = process.env.INTERVAL || '5m';
export const HISTORY_LIMIT = num('HISTORY_LIMIT', 500);

export const POSITION_SIZE_PERCENT = num('POSITION_SIZE_PERCENT', 20);
export const LEVERAGE = num('LEVERAGE', 1);
export const TAKE_PROFIT_PERCENT = num('TAKE_PROFIT_PERCENT', 1.5);
export const STOP_LOSS_PERCENT = num('STOP_LOSS_PERCENT', 0.8);
export const TRAILING_STOP_PERCENT = num('TRAILING_STOP_PERCENT', 0.5);
export const PARTIAL_TP1_PERCENT = num('PARTIAL_TP1_PERCENT', 0.6);
export const PARTIAL_TP1_PROFIT = num('PARTIAL_TP1_PROFIT', 0.8);
export const PARTIAL_TP2_PERCENT = num('PARTIAL_TP2_PERCENT', 0.4);
export const PARTIAL_TP2_PROFIT = num('PARTIAL_TP2_PROFIT', 1.5);
export const DAILY_MAX_LOSS_PERCENT = num('DAILY_MAX_LOSS_PERCENT', 0);
export const KELLY_FACTOR = num('KELLY_FACTOR', 0.5);

export const AUTO_TRADE = bool('AUTO_TRADE');

export const CONFIRMATION_CANDLES = num('CONFIRMATION_CANDLES', 2);
export const BASE_RSI = num('BASE_RSI', 14);
export const MIN_RSI_PERIOD = num('MIN_RSI_PERIOD', 5);
export const MAX_RSI_PERIOD = num('MAX_RSI_PERIOD', 50);
export const VOL_WINDOW = num('VOL_WINDOW', 100);
export const RSI_LOWER = num('RSI_THRESHOLD_LOWER', 30);
export const RSI_UPPER = num('RSI_THRESHOLD_UPPER', 70);

export const EMA_PERIOD = num('EMA_PERIOD', 200);
export const ATR_PERIOD = num('ATR_PERIOD', 14);
export const ATR_MULT_SL = num('ATR_MULT_SL', 2.0);
export const ATR_MULT_TRAIL = num('ATR_MULT_TRAIL', 3.0);

export const LSR_BUY = num('LSR_BUY', 1.2);
export const LSR_SELL = num('LSR_SELL', 0.8);
export const FUNDING_THRESHOLD = num('FUNDING_THRESHOLD', 0);

export const COOLDOWN_SECONDS = num('COOLDOWN_SECONDS', 300);
export const DAILY_REPORT_HOUR = num('DAILY_REPORT_HOUR', 23);

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

export const QUICKCHART_WIDTH = num('CHART_WIDTH', 1200);
export const QUICKCHART_HEIGHT = num('CHART_HEIGHT', 500);

export const LOG_DIR = process.env.LOG_DIR || 'logs';

export const REST_FAPI = TESTNET ? (process.env.REST_FAPI_TESTNET || 'https://testnet.binancefuture.com') : (process.env.REST_FAPI || 'https://fapi.binance.com');
export const REST_FAPI_BACKUP = process.env.REST_FAPI_BACKUP || 'https://api1.binance.com';
export const FSTREAM_BASE = TESTNET ? (process.env.FSTREAM_TESTNET || 'wss://stream.binancefuture.com') : 'wss://fstream.binance.com';

export const TAKER_FEE_BPS = num('TAKER_FEE_BPS', 5);   // 0.05%
export const SLIPPAGE_BPS = num('SLIPPAGE_BPS', 2);     // 0.02%

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn('Warning: Telegram token/chat id not set — notifications disabled.');
}