"""Risk management — the hard safety rails around the AI's decisions.

The AI proposes; the risk manager disposes. Nothing the model says can
bypass these checks.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from .brain import TradeDecision
from .config import Config


@dataclass
class RiskState:
    day: str = ""
    day_start_equity: float = 0.0
    trades_today: int = 0
    halted: bool = False

    def to_dict(self) -> dict:
        return {
            "day": self.day,
            "day_start_equity": self.day_start_equity,
            "trades_today": self.trades_today,
            "halted": self.halted,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "RiskState":
        return cls(
            day=d.get("day", ""),
            day_start_equity=float(d.get("day_start_equity", 0.0)),
            trades_today=int(d.get("trades_today", 0)),
            halted=bool(d.get("halted", False)),
        )


class RiskManager:
    def __init__(self, config: Config, state: RiskState):
        self.config = config
        self.state = state

    def start_cycle(self, equity: float, today: date | None = None) -> None:
        """Roll the daily counters; must be called once per cycle before vetting."""
        day = (today or date.today()).isoformat()
        if self.state.day != day:
            self.state.day = day
            self.state.day_start_equity = equity
            self.state.trades_today = 0
            self.state.halted = False

        if self.state.day_start_equity > 0:
            drawdown = 1 - equity / self.state.day_start_equity
            if drawdown >= self.config.max_daily_loss_pct and not self.state.halted:
                self.state.halted = True

    def vet(self, decision: TradeDecision, cash: float, holding_value: float) -> tuple[bool, str, float]:
        """Return (approved, reason, clamped_size_pct) for one decision."""
        if decision.action == "hold":
            return False, "hold", 0.0
        if self.state.halted:
            return False, f"daily loss circuit breaker tripped ({self.config.max_daily_loss_pct:.0%})", 0.0
        if self.state.trades_today >= self.config.max_trades_per_day:
            return False, f"max trades per day reached ({self.config.max_trades_per_day})", 0.0
        if decision.confidence < self.config.min_confidence:
            return False, f"confidence {decision.confidence:.2f} below minimum {self.config.min_confidence:.2f}", 0.0

        size_pct = max(0.0, min(decision.size_pct, self.config.max_trade_pct))
        if size_pct <= 0:
            return False, "size_pct is zero after clamping", 0.0

        notional = (cash if decision.action == "buy" else holding_value) * size_pct
        if notional < self.config.min_trade_gbp:
            return False, f"trade of £{notional:.2f} below minimum £{self.config.min_trade_gbp:.2f}", 0.0

        return True, "approved", size_pct

    def record_trade(self) -> None:
        self.state.trades_today += 1
