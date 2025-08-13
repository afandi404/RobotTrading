import { computeAdaptiveRsi, detectRsiSignal } from './indicators.js';
import { CONFIRMATION_CANDLES, COOLDOWN_SECONDS, TAKE_PROFIT_PERCENT, STOP_LOSS_PERCENT, POSITION_SIZE_PERCENT, LEVERAGE, AUTO_TRADE, LSR_BUY, LSR_SELL, FUNDING_THRESHOLD, INTERVAL } from './config.js';
import { fetchLongShort, fetchFundingRate, fetchOpenInterest, fetchKlines, fetchUSDTBalance, placeMarketOrder, placeCloseTP, placeCloseSL } from './binance.js';
import { sendTelegramText, sendTelegramPhotoBuffer } from './telegram.js';
import { buildLineChartConfig, getChartPngBuffer } from './chart.js';
import { logEvent, logTrade } from './logger.js';
import { computeQtyFromBalance } from './risk.js';

export class SymbolWorker{
  constructor(symbol, interval){
    this.symbol = symbol;
    this.interval = interval;
    this.closes = [];
    this.times = [];
    this.pending = null;
    this.lastSent = { signature: null, ts: 0 };
  }

  canSend(signature){
    if (this.lastSent.signature === signature) return (Date.now() - this.lastSent.ts) > COOLDOWN_SECONDS*1000;
    return true;
  }
  markSent(signature){ this.lastSent.signature = signature; this.lastSent.ts = Date.now(); }

  async init(){
    const raw = await fetchKlines(this.symbol, this.interval, 500);
    this.closes = raw.map(r=>Number(r[4]));
    this.times = raw.map(r=>r[6] || r[0]);
    logEvent(`Worker ${this.symbol} loaded history ${this.closes.length}`);
  }

  async onNewClosedCandle(){
    try {
      const { period, rsi } = computeAdaptiveRsi(this.closes);
      if (!rsi || rsi.length < 2) { this.heartbeat(); return; }
      const rsiSignal = detectRsiSignal(rsi);
      const price = this.closes[this.closes.length-1];
      const rsiValue = rsi[rsi.length-1];

      if (!this.pending){
        if (rsiSignal){
          this.pending = { type: rsiSignal, count: 1, period, firstPrice: price, firstRsi: rsiValue, firstTime: Date.now() };
          logEvent(`Pending1 ${this.symbol} ${this.pending.type} p${period}`);
        } else {
          this.heartbeat(price, rsiValue, period);
        }
        return;
      }

      if (rsiSignal === this.pending.type){
        this.pending.count++;
        logEvent(`Pending++ ${this.symbol} ${this.pending.type} count=${this.pending.count}`);
        if (this.pending.count >= CONFIRMATION_CANDLES){
          const [lsr, fr, oi] = await Promise.all([
            fetchLongShort(this.symbol, '5m'),
            fetchFundingRate(this.symbol, 1),
            fetchOpenInterest(this.symbol)
          ]);
          let allow = false;
          if (this.pending.type === 'BUY'){
            const condLsr = (lsr === undefined) ? true : (lsr > LSR_BUY);
            const condFund = (fr === undefined) ? true : (fr < FUNDING_THRESHOLD);
            allow = (condLsr || condFund);
          } else {
            const condLsr = (lsr === undefined) ? true : (lsr < LSR_SELL);
            const condFund = (fr === undefined) ? true : (fr > FUNDING_THRESHOLD);
            allow = (condLsr || condFund);
          }

          const signature = `${this.symbol}@${this.pending.type}@p${this.pending.period}`;
          if (!this.canSend(signature)){
            logEvent('Cooldown active skip ' + signature);
            this.pending = null; return;
          }

          const N = Math.min(80, this.closes.length);
          const labels = this.times.slice(-N).map(t=>{ const d=new Date(t); return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`; });
          const closesForChart = this.closes.slice(-N);
          const cfg = buildLineChartConfig({ labels, closes: closesForChart, symbol: this.symbol, interval: this.interval, signalType: this.pending.type });
          let imgBuf = null;
          try { imgBuf = await getChartPngBuffer(cfg); } catch(e){ logEvent('Chart gen failed ' + String(e)); }

          const caption = [
            `*${this.symbol} ${this.pending.type} (CONFIRM x${CONFIRMATION_CANDLES})*`,
            `Price: ${price}`,
            `AdaptiveRSI period: ${this.pending.period}`,
            `RSI: ${rsiValue.toFixed(2)}`,
            `LongShortRatio: ${lsr ?? 'N/A'}`,
            `FundingRate: ${fr ?? 'N/A'}`,
            `OpenInterest: ${oi ?? 'N/A'}`,
            `Time: ${new Date().toLocaleString()}`
          ].join('');

          if (allow){
            this.markSent(signature);
            if (imgBuf) await sendTelegramPhotoBuffer(imgBuf, caption); else await sendTelegramText(caption);

            if (AUTO_TRADE){
              try {
                const usdtBal = await fetchUSDTBalance();
                if (usdtBal <= 0) throw new Error('USDT balance zero');
                const qty = computeQtyFromBalance({ usdtBalance: usdtBal, price, positionPercent: POSITION_SIZE_PERCENT, leverage: LEVERAGE });
                if (qty <= 0) throw new Error('qty=0');
                const side = this.pending.type === 'BUY' ? 'BUY' : 'SELL';
                const order = await placeMarketOrder(this.symbol, side, qty);
                logTrade({ symbol: this.symbol, side, qty, price, meta: { order } });

                const tpSide = side === 'BUY' ? 'SELL' : 'BUY';
                const slSide = tpSide; // close position side
                const tpPrice = side === 'BUY' ? price * (1 + TAKE_PROFIT_PERCENT/100) : price * (1 - TAKE_PROFIT_PERCENT/100);
                const slPrice = side === 'BUY' ? price * (1 - STOP_LOSS_PERCENT/100) : price * (1 + STOP_LOSS_PERCENT/100);

                try { await placeCloseTP(this.symbol, tpSide, tpPrice.toFixed(2)); } catch(e){ logEvent('TP place failed ' + String(e)); }
                try { await placeCloseSL(this.symbol, slSide, slPrice.toFixed(2)); } catch(e){ logEvent('SL place failed ' + String(e)); }

                await sendTelegramText(`${this.symbol} AUTO-TRADE ${side} qty=${qty} @${price}. TP ${tpPrice.toFixed(2)} SL ${slPrice.toFixed(2)}`);
              } catch(e){
                await sendTelegramText(`${this.symbol} AUTO-TRADE ERROR: ${String(e)}`);
              }
            }
          } else {
            logEvent('Confirmed but metrics blocked for ' + this.symbol);
            if (imgBuf) await sendTelegramPhotoBuffer(imgBuf, caption + 'Blocked by metrics'); else await sendTelegramText(caption + 'Blocked by metrics');
          }
          this.pending = null;
        }
      } else {
        if (rsiSignal){
          this.pending = { type: rsiSignal, count: 1, period, firstPrice: price, firstRsi: rsiValue, firstTime: Date.now() };
          logEvent(`Signal changed -> new pending ${this.symbol} ${rsiSignal}`);
        } else {
          logEvent(`Pending cleared ${this.symbol}`);
          this.pending = null;
        }
      }

    } catch (e){
      logEvent('onNewClosedCandle error ' + String(e));
      this.pending = null;
    }
  }

  heartbeat(price = this.closes[this.closes.length-1], rsiValue = null, period = null){
    const msg = `[HB] ${this.symbol} ${INTERVAL} price=${price}${rsiValue?` RSI=${rsiValue.toFixed(2)}`:''}${period?` p${period}`:''}`;
    logEvent(msg);
  }

  onKline(k){
    const isFinal = k.x;
    const close = Number(k.c);
    const closeTime = k.T || k.t || Date.now();
    if (isFinal){
      this.closes.push(close);
      this.times.push(closeTime);
      if (this.closes.length > 1000){ this.closes = this.closes.slice(-1000); this.times = this.times.slice(-1000); }
      this.onNewClosedCandle();
    }
  }
}