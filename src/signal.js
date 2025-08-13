import { computeAdaptiveRsi, detectRsiSignal } from './indicators.js';
import { CONFIRMATION_CANDLES, COOLDOWN_SECONDS, TAKE_PROFIT_PERCENT, STOP_LOSS_PERCENT, POSITION_SIZE_PERCENT, LEVERAGE, AUTO_TRADE, LSR_BUY, LSR_SELL, FUNDING_THRESHOLD, INTERVAL, TRAILING_STOP_PERCENT, PARTIAL_TP1_PERCENT, PARTIAL_TP1_PROFIT, PARTIAL_TP2_PERCENT, PARTIAL_TP2_PROFIT, PAPER } from './config.js';
import { fetchLongShort, fetchFundingRate, fetchOpenInterest, fetchKlines, fetchUSDTBalance, placeMarketOrder, placeCloseTP, placeCloseSL, getPositionRisk, getSymbolInfo, changeLeverage, cancelAllOpenOrders } from './binance.js';
import { sendTelegramText, sendTelegramPhotoBuffer } from './telegram.js';
import { buildLineChartConfig, getChartPngBuffer } from './chart.js';
import { logEvent, logTrade } from './logger.js';
import { computeQtyFromBalance, buildTpSlPrices, floorToTick } from './risk.js';

export class SymbolWorker{
  constructor(symbol, interval){
    this.symbol = symbol;
    this.interval = interval;
    this.closes = [];
    this.times = [];
    this.pending = null;
    this.lastSent = { signature: null, ts: 0 };
    this.trailing = null; // { side, entryPrice, peak, trough, slPrice }
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

  async ensureLeverage(){
    try{ await changeLeverage(this.symbol, LEVERAGE); }catch(e){ logEvent('changeLeverage failed '+String(e)); }
  }

  async onNewClosedCandle(){
    try {
      const { period, rsi } = computeAdaptiveRsi(this.closes);
      if (!rsi || rsi.length < 2) { this.heartbeat(); return; }
      const rsiSignal = detectRsiSignal(rsi);
      const price = this.closes[this.closes.length-1];
      const rsiValue = rsi[rsi.length-1];

      // Update trailing stop if any position
      await this.updateTrailing(price);

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
          ].join('\n');

          if (allow){
            this.markSent(signature);
            if (imgBuf) await sendTelegramPhotoBuffer(imgBuf, caption); else await sendTelegramText(caption);

            if (AUTO_TRADE && !PAPER){
              await this.ensureLeverage();
              try {
                const info = await getSymbolInfo(this.symbol);
                const usdtBal = await fetchUSDTBalance();
                if (usdtBal <= 0) throw new Error('USDT balance zero');
                const qty = await computeQtyFromBalance({ symbol: this.symbol, usdtBalance: usdtBal, price, positionPercent: POSITION_SIZE_PERCENT, leverage: LEVERAGE });
                if (qty <= 0) throw new Error('qty=0');
                const side = this.pending.type === 'BUY' ? 'BUY' : 'SELL';
                const order = await placeMarketOrder(this.symbol, side, qty);
                logTrade({ symbol: this.symbol, side, qty, price, meta: { order } });

                // Set initial TP/SL
                const { tp, sl } = buildTpSlPrices({ side, price, takeProfitPct: TAKE_PROFIT_PERCENT, stopLossPct: STOP_LOSS_PERCENT, tickSize: info.tickSize });
                const closeSide = side === 'BUY' ? 'SELL' : 'BUY';
                try { await cancelAllOpenOrders(this.symbol); } catch {}
                try { await placeCloseTP(this.symbol, closeSide, tp.toFixed(8)); } catch(e){ logEvent('TP place failed ' + String(e)); }
                try { await placeCloseSL(this.symbol, closeSide, sl.toFixed(8)); } catch(e){ logEvent('SL place failed ' + String(e)); }

                // Initialize trailing
                this.trailing = side==='BUY'
                  ? { side, entryPrice: price, peak: price, slPrice: sl }
                  : { side, entryPrice: price, trough: price, slPrice: sl };

                // Partial TP not natively supported with closePosition=true, usually use reduceOnly orders with quantity. Here we keep SL/TP closePosition and let trailing handle SL improvement.
                await sendTelegramText(`${this.symbol} AUTO-TRADE ${side} qty=${qty} @${price}. TP ${tp} SL ${sl}`);
              } catch(e){
                await sendTelegramText(`${this.symbol} AUTO-TRADE ERROR: ${String(e)}`);
              }
            }
          } else {
            logEvent('Confirmed but metrics blocked for ' + this.symbol);
            if (imgBuf) await sendTelegramPhotoBuffer(imgBuf, caption + '\nBlocked by metrics'); else await sendTelegramText(caption + '\nBlocked by metrics');
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

  async updateTrailing(price){
    if (!this.trailing || PAPER) return;
    try{
      const info = await getSymbolInfo(this.symbol);
      const pos = await getPositionRisk(this.symbol);
      const posAmt = Number(pos.positionAmt || 0);
      if (posAmt === 0){ this.trailing = null; return; }
      const side = posAmt>0 ? 'BUY' : 'SELL';
      if (side==='BUY'){
        this.trailing.peak = Math.max(this.trailing.peak || price, price);
        const newSl = this.trailing.peak * (1 - TRAILING_STOP_PERCENT/100);
        if (newSl > this.trailing.slPrice){
          const sl = floorToTick(newSl, info.tickSize);
          const closeSide = 'SELL';
          try { await placeCloseSL(this.symbol, closeSide, sl.toFixed(8)); this.trailing.slPrice = sl; logEvent(`Trailing SL moved BUY -> ${sl}`); } catch(e){ logEvent('Trailing SL update failed '+String(e)); }
        }
      } else { // SELL
        this.trailing.trough = Math.min(this.trailing.trough || price, price);
        const newSl = this.trailing.trough * (1 + TRAILING_STOP_PERCENT/100);
        if (newSl < this.trailing.slPrice){
          const sl = floorToTick(newSl, info.tickSize);
          const closeSide = 'BUY';
          try { await placeCloseSL(this.symbol, closeSide, sl.toFixed(8)); this.trailing.slPrice = sl; logEvent(`Trailing SL moved SELL -> ${sl}`); } catch(e){ logEvent('Trailing SL update failed '+String(e)); }
        }
      }
    }catch(e){ logEvent('updateTrailing err '+String(e)); }
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