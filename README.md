<<<<<<< HEAD
# 🤖 Robot Trading Pro — Full Upgrade v4

Bot trading **Binance Futures USDⓈ-M** versi profesional berbasis **Node.js**. Dibangun untuk real-time trading 24/7 dengan fitur risk management, multi-symbol scanning, backtest engine, notifikasi Telegram, dan sistem modular.

---

## ✨ Fitur Utama

<<<<<<< HEAD
=======
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

>>>>>>> 59f769cb3bc345dab8c09e78d07038b32c1ed172
## 📦 Instalasi
```bash
git clone https://github.com/afandi404/RobotTrading
cd RobotTrading
npm install
cp .env.example .env
<<<<<<< HEAD
=======
* **Multi-symbol scanner** (BTCUSDT, ETHUSDT, AUTOUSDT, dll).
* **Indikator teknikal**: EMA, RSI, MACD, Bollinger Bands, ADX, pola candlestick.
* **Signal engine fusion**: kombinasi indikator + scoring + cooldown.
* **Risk management**: fractional sizing, SL/TP, trailing stop, Kelly sizing.
* **Backtest engine**: simulasi realistis dengan slippage & fee.
* **Logger modern**: Winston, output ke file & console.
* **Notifikasi Telegram**: order, sinyal, chart.
* **Paper trading**: mode uji tanpa risiko.
* **Struktur modular**: mudah diperluas & scalable.

---

## 📂 Struktur Project

```
.
├── package.json
├── .env.example
└── src/
    ├── index.js        # Main bot runner
    ├── config.js       # Konfigurasi global
    ├── logger.js       # Logger (Winston)
    ├── http.js         # HTTP client (Axios + retry)
    ├── binance.js      # API Binance
    ├── indicators.js   # Indikator teknikal
    ├── signal.js       # Engine sinyal
    ├── risk.js         # Manajemen risiko
    ├── utils.js        # Utilitas umum
    ├── backtest.js     # Engine backtest
    └── telegram.js     # Notifikasi Telegram
>>>>>>> 8ac88fb (Update fitur XYZ)
```

---

## ⚙️ Instalasi

```bash
# Clone repo
 git clone https://github.com/afandi404/RobotTrading.git
 cd RobotTrading

# Install dependencies
 npm install

# Salin env
 cp .env.example .env
```

Edit `.env` sesuai API Key dan konfigurasi bot kamu.

---

## 🚀 Menjalankan

### 1. Backtest

```bash
node src/backtest.js
```

### 2. Paper Trading

```bash
PAPER=true node src/index.js
```

### 3. Live Trading (Real Money)

```bash
PAPER=false node src/index.js
```

⚠️ Pastikan setting **risk management** sebelum live!

---

## 🐳 Deploy 24/7

### Via Docker

*TODO: Dockerfile + docker-compose.yml akan ditambahkan.*

### Via PM2

```bash
npm install -g pm2
pm2 start src/index.js --name trading-bot --time
pm2 save
```

---

## 🔒 Env Config (`.env.example`)

```
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_secret
TELEGRAM_BOT_TOKEN=your_telegram_token
TELEGRAM_CHAT_ID=your_chat_id
SYMBOLS=BTCUSDT,ETHUSDT
INTERVAL=1m
PAPER=true
```

---

## 📊 Statistik & Logging

* Semua order & sinyal tercatat di `logs/`.
* Statistik harian otomatis dibuat.
* Bisa diintegrasikan dengan Prometheus + Grafana.

---

## 📌 Roadmap

* [ ] Docker + docker-compose
* [ ] TypeScript refactor
* [ ] Monitoring (Grafana template)
* [ ] Unit tests + CI/CD

---

## ⚠️ Disclaimer

Bot ini **bukan jaminan profit**. Trading futures berisiko tinggi. Gunakan **paper mode** dulu sebelum live trading.

---

## 👨‍💻 Author

Akhmad Afandi (Upgrade Pro v4).
=======
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
>>>>>>> 59f769cb3bc345dab8c09e78d07038b32c1ed172
