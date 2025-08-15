# Robot Trading Pro – 90% World-Class Upgrade

## 🚀 Overview
Bot trading **Binance Futures USDⓈ-M** profesional berbasis **Node.js** yang menggabungkan eksekusi real-time, strategi adaptif, backtest realistis, dan risk management kelas dunia.  
Dirancang untuk performa konsisten, fleksibilitas tinggi, serta kontrol penuh bagi trader.

## ✨ Fitur Utama
- **Multi-symbol & Multi-timeframe Scanner**
- Kombinasi indikator: *RSI, EMA, MACD, Bollinger Bands, ADX, ATR filter*
- Strategi adaptif: Trend-follow, Mean-reversion, Breakout
- Risk Management: TP/SL, trailing stop ATR, partial take profit, daily loss limit
- Optimizer: Auto-optimisasi parameter via grid search/genetic algorithm
- Backtest realistis: Simulasi fee, slippage, leverage, dan metrik performa *(Win rate, Profit Factor, Drawdown, Sharpe Ratio)*
- Regime Detection: Filter sinyal sesuai kondisi pasar *(Trending/Sideways)*
- Live & Paper Trading Mode
- Monitoring Telegram: Alert sinyal, status bot, statistik harian, kontrol interaktif
- Logging & Statistik: Trade journal, equity curve, laporan PDF harian

## 📦 Instalasi
```bash
git clone <repo-url>
cd robot-trading-pro-v2
npm install
cp .env.example .env
```

## ⚙️ Konfigurasi `.env`
| Variable | Deskripsi |
|----------|-----------|
| `API_KEY` / `API_SECRET` | API key Binance Futures |
| `TELEGRAM_TOKEN` / `TELEGRAM_CHAT_ID` | Integrasi Telegram |
| `MODE` | `live` atau `paper` |
| `SYMBOLS` | Daftar pair, contoh: `BTCUSDT,ETHUSDT` |
| `INTERVALS` | Timeframe analisis, contoh: `5m,15m,1h` |
| `LEVERAGE` | Leverage per trade, contoh: `20` |
| `DAILY_MAX_LOSS_PERCENT` | Batas kerugian harian (%) |

## ▶️ Menjalankan Bot
```bash
npm run start      # Live trading
npm run paper      # Paper trading
npm run backtest   # Backtest strategi
npm run optimize   # Optimisasi parameter
```

## 📊 Backtest & Optimizer
- **Backtest**: Uji strategi pada data historis.
- **Optimizer**: Cari parameter optimal berdasarkan hasil backtest.
```bash
npm run backtest
npm run optimize
```

## 🛡 Disclaimer
Bot ini dibuat untuk **edukasi & riset**.  
Trading futures berisiko tinggi dan dapat menyebabkan **kerugian total**.  
Gunakan sesuai toleransi risiko Anda.
