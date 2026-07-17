# DayTrader — self-contained AI crypto day-trading bot

A small automated trading system that runs entirely on your own machine and your
own accounts. **No third-party bot platforms, no subscriptions** — it talks
directly to:

- **Coinbase** — live market data (free, no account needed) and, in live mode,
  real orders via Coinbase's official API
- **Claude (Anthropic)** — every trading cycle, the live market data and your
  portfolio state are sent to Claude, which returns a structured buy/sell/hold
  decision with a confidence score and its reasoning

The AI proposes; a hard-coded **risk manager** disposes. Nothing the model says
can bypass the safety rails.

## Quick start (one click)

```bash
./setup.sh
```

That creates a virtualenv, installs dependencies, and walks you through a short
wizard (you'll need an Anthropic API key from https://platform.claude.com).
Then:

```bash
source .venv/bin/activate
python -m daytrader run
```

The bot starts in **paper mode**: fake money, real live prices, realistic fees
and slippage, zero risk. Let it run for a few weeks and judge the results
honestly before even thinking about live mode.

## Commands

| Command | What it does |
|---|---|
| `python -m daytrader setup` | interactive setup wizard (writes `.env`) |
| `python -m daytrader run` | start the trading loop (one cycle every `INTERVAL_MINUTES`) |
| `python -m daytrader once` | run a single cycle and exit |
| `python -m daytrader status` | portfolio, P&L, recent trades |
| `python -m daytrader deposit 100` | add £100 to the paper pot (monthly top-ups) |

Keep it running unattended with `nohup python -m daytrader run >> data/bot.log 2>&1 &`
(or a systemd service / launchd job / `screen` session).

## How a cycle works

1. Fetch live prices + hourly candles for each product from Coinbase
2. Compute indicators: RSI(14), EMA(12/26), MACD histogram, 1h/6h/24h change, volatility
3. Send the full snapshot (market + portfolio + constraints) to Claude, which
   returns a schema-validated `TradingPlan` — one decision per product with
   confidence and reasoning
4. Each decision passes through the risk manager:
   - **hold** or confidence below `MIN_CONFIDENCE` → skipped
   - trade size clamped to `MAX_TRADE_PCT` of cash/holding
   - **daily loss circuit breaker**: if equity drops `MAX_DAILY_LOSS_PCT` in a
     day, all trading halts until tomorrow
   - hard cap of `MAX_TRADES_PER_DAY`
5. Approved trades execute (simulated in paper mode, real market orders in live
   mode) and everything is logged to `data/trades.csv` and `data/decisions.jsonl`

## Going live (read this first)

1. Paper trade for **at least a few weeks**. If the bot isn't beating "just
   holding" after fees in simulation, it won't do better with real money.
2. Create a CDP API key at https://portal.cdp.coinbase.com with **trade**
   permission only (never withdrawal), restricted to your IP if possible.
3. `pip install coinbase-advanced-py`, put the key in `.env`, set `MODE=live`.
4. The bot asks for explicit confirmation before starting a live session.

## Costs to be aware of

- **Coinbase fees**: ~0.6% taker per trade at the entry tier (~1.2% per round
  trip). This is exactly why the system prompt tells the AI to trade sparingly.
- **Claude API**: the default model is `claude-opus-4-8` ($5/$25 per million
  tokens). A cycle costs roughly 1–3p; at 15-minute intervals that's around
  **£1–3/day**. For a £300 pot you may prefer `AI_MODEL=claude-haiku-4-5`
  (~5× cheaper, still strong for this structured task) — set it in `.env`.
  Longer intervals (30–60 min) also cut cost proportionally.

## Honest expectations

Nobody — human or AI — sustains 1%/day. Fees and spread eat small accounts that
overtrade, which is why this bot is built to trade rarely and small, with hard
loss limits. Treat it as an experiment with money you can afford to lose; the
paper mode exists so most of the learning is free. Crypto profits may be subject
to Capital Gains Tax (UK).

## Layout

```
daytrader/
  config.py      .env loading + all settings
  market.py      Coinbase public market data
  indicators.py  RSI / EMA / MACD / volatility (pure Python)
  brain.py       Claude API call, structured TradingPlan schema
  risk.py        confidence gate, size clamp, circuit breaker
  broker.py      paper broker (fees+slippage) and live Coinbase broker
  runner.py      the cycle/loop, logging
  __main__.py    CLI
tests/           unit tests (run with: pytest tests/)
data/            portfolio state + trade logs (created at runtime, gitignored)
```
