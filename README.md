# Binance Futures Pro Bot — Final Upgrade

Fitur utama:
- Smart REST retry + failover endpoint
- WebSocket heartbeat ping/pong + exponential reconnect
- Adaptive RSI + konfirmasi candle
- Filter LSR, Funding Rate, OI
- AUTO TRADE (opsional), dynamic qty dari exchangeInfo (stepSize/tickSize)
- TP/SL awal + **Trailing Stop realtime** (pergeseran SL otomatis)
- Partial TP (konsep) dan cancel open orders sebelum pasang TP/SL baru
- Laporan harian Telegram (realized PnL) pada jam `DAILY_REPORT_HOUR` WIB
- Backtest sederhana & struktur siap untuk paper trading

## Cara jalan
```bash
npm i
cp .env.example .env # isi key
npm start
```

## Env penting
- `AUTO_TRADE=true` untuk live order.
- `TESTNET=true` untuk testnet.
- `PAPER=true` untuk simulasi (placeholder).
- `DAILY_REPORT_HOUR=23` untuk report harian.

Catatan: trailing stop meng-update **STOP_MARKET closePosition** mengikuti puncak/lebah harga setelah entry. Untuk partial TP sebenarnya perlu split order reduceOnly per kuantitas; contoh ini tetap gunakan closePosition untuk kesederhanaan produksi.