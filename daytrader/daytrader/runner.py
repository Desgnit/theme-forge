"""The trading loop: fetch data -> ask the AI -> apply risk rails -> execute -> log."""

from __future__ import annotations

import csv
import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path

from .brain import Brain, TradingPlan
from .broker import PortfolioState, make_broker
from .config import Config, DATA_DIR
from .market import fetch_snapshots
from .risk import RiskManager

log = logging.getLogger("daytrader")

TRADES_CSV = DATA_DIR / "trades.csv"
DECISIONS_LOG = DATA_DIR / "decisions.jsonl"


class Runner:
    def __init__(self, config: Config, brain: Brain | None = None):
        self.config = config
        self.state = PortfolioState(config)
        self.broker = make_broker(config, self.state)
        self.risk = RiskManager(config, self.state.risk)
        self.brain = brain or Brain(config)

    # ---------- one cycle ----------

    def cycle(self) -> None:
        now = datetime.now(timezone.utc).isoformat(timespec="seconds")
        snapshots = fetch_snapshots(self.config.products)
        prices = {pid: snap.price for pid, snap in snapshots.items()}
        equity = self.state.equity(prices)
        self.risk.start_cycle(equity)

        payload = self._build_payload(now, snapshots, prices, equity)
        plan = self.brain.decide(payload)
        self._log_decisions(now, payload, plan)
        log.info("Outlook: %s", plan.market_outlook)

        for decision in plan.decisions:
            if decision.product_id not in snapshots:
                log.warning("AI proposed unknown product %s — skipped", decision.product_id)
                continue
            price = prices[decision.product_id]
            holding_value = self.state.holdings.get(decision.product_id, 0.0) * price
            approved, reason, size_pct = self.risk.vet(decision, self.state.cash, holding_value)

            if not approved:
                if decision.action != "hold":
                    log.info("SKIP %s %s: %s", decision.action.upper(), decision.product_id, reason)
                else:
                    log.info("HOLD %s (conf %.2f): %s", decision.product_id, decision.confidence, decision.reasoning)
                continue

            if decision.action == "buy":
                fill = self.broker.buy(decision.product_id, self.state.cash * size_pct, price)
            else:
                qty = self.state.holdings.get(decision.product_id, 0.0) * size_pct
                fill = self.broker.sell(decision.product_id, qty, price)

            self.risk.record_trade()
            self._log_trade(now, fill, decision.confidence, decision.reasoning)
            log.info(
                "%s %s: %.8f @ £%.2f (£%.2f, fee £%.2f) — %s",
                fill.side.upper(), fill.product_id, fill.quantity,
                fill.price, fill.notional, fill.fee, decision.reasoning,
            )

        self.state.save()
        equity_after = self.state.equity(prices)
        pnl = equity_after - self.state.deposited
        log.info(
            "Equity £%.2f (cash £%.2f) | P&L since start: £%+.2f (%+.2f%%)%s",
            equity_after, self.state.cash, pnl,
            pnl / self.state.deposited * 100 if self.state.deposited else 0.0,
            "  [TRADING HALTED FOR TODAY]" if self.state.risk.halted else "",
        )

    def loop(self) -> None:
        interval = self.config.interval_minutes * 60
        log.info(
            "Starting %s-mode loop: %s every %d min (model: %s)",
            self.config.mode, ", ".join(self.config.products),
            self.config.interval_minutes, self.config.ai_model,
        )
        while True:
            started = time.monotonic()
            try:
                self.cycle()
            except Exception:
                log.exception("Cycle failed — will retry next interval")
            elapsed = time.monotonic() - started
            time.sleep(max(30.0, interval - elapsed))

    # ---------- helpers ----------

    def _build_payload(self, now: str, snapshots, prices, equity: float) -> dict:
        day_start = self.state.risk.day_start_equity or equity
        return {
            "timestamp_utc": now,
            "portfolio": {
                "cash_gbp": round(self.state.cash, 2),
                "holdings": {
                    pid: {
                        "quantity": qty,
                        "value_gbp": round(qty * prices.get(pid, 0.0), 2),
                    }
                    for pid, qty in self.state.holdings.items()
                },
                "equity_gbp": round(equity, 2),
                "today_pnl_pct": round((equity / day_start - 1) * 100, 3) if day_start else 0.0,
                "total_deposited_gbp": round(self.state.deposited, 2),
                "trades_today": self.state.risk.trades_today,
                "max_trades_per_day": self.config.max_trades_per_day,
            },
            "constraints": {
                "max_trade_pct": self.config.max_trade_pct,
                "min_confidence_to_act": self.config.min_confidence,
                "round_trip_cost_pct_estimate": round((self.config.fee_pct + self.config.slippage_pct) * 2 * 100, 2),
            },
            "market_data": {pid: snap.to_dict() for pid, snap in snapshots.items()},
        }

    def _log_trade(self, now: str, fill, confidence: float, reasoning: str) -> None:
        TRADES_CSV.parent.mkdir(parents=True, exist_ok=True)
        is_new = not TRADES_CSV.exists()
        with TRADES_CSV.open("a", newline="") as f:
            writer = csv.writer(f)
            if is_new:
                writer.writerow(
                    ["timestamp", "side", "product", "quantity", "price", "notional_gbp", "fee_gbp", "confidence", "reasoning"]
                )
            writer.writerow(
                [now, fill.side, fill.product_id, f"{fill.quantity:.8f}",
                 f"{fill.price:.2f}", f"{fill.notional:.2f}", f"{fill.fee:.2f}",
                 f"{confidence:.2f}", reasoning]
            )

    def _log_decisions(self, now: str, payload: dict, plan: TradingPlan) -> None:
        DECISIONS_LOG.parent.mkdir(parents=True, exist_ok=True)
        with DECISIONS_LOG.open("a") as f:
            f.write(
                json.dumps(
                    {
                        "timestamp": now,
                        "equity_gbp": payload["portfolio"]["equity_gbp"],
                        "market_outlook": plan.market_outlook,
                        "decisions": [d.model_dump() for d in plan.decisions],
                    }
                )
                + "\n"
            )
