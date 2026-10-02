# Ecrin Quant Engine V1

Research/paper-trading scanner for FuturesRadar. It does **not** place orders.

- Auto-discovers all active Binance USDⓈ-M USDT perpetual contracts.
- Applies a liquidity gate before deeper multi-timeframe requests.
- Computes 5m/15m/1h/4h RSI, EMA trend, volume ratio and ATR.
- Produces LONG/SHORT research scores and S+/S/A/WAIT labels.
- No API key is required for this scanner.

## Run

```bash
cd quant-engine
npm run scan > scan.json
```

The current score is deliberately a baseline heuristic, not a calibrated probability. It must not be shown as a probability until walk-forward/paper outcomes establish calibration.

## Next gates

1. Historical dataset + transaction-cost-aware backtester.
2. Walk-forward/out-of-sample validation.
3. Paper execution ledger.
4. Brier/reliability calibration.
5. Hard risk engine and kill switch.
6. Only then connect the output to the production FuturesRadar UI.
