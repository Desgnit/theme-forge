"""Configuration loading.

All settings live in a .env file next to the project root (created by
`python -m daytrader setup`). Values can also be supplied as real
environment variables, which take precedence over the file.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"
DATA_DIR = PROJECT_ROOT / "data"


def load_env_file(path: Path = ENV_FILE) -> dict[str, str]:
    """Parse a simple KEY=VALUE .env file. Real env vars win over file values."""
    values: dict[str, str] = {}
    if path.exists():
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            values[key.strip()] = value.strip().strip('"').strip("'")
    values.update({k: v for k, v in os.environ.items() if k in _KNOWN_KEYS})
    return values


_KNOWN_KEYS = {
    "MODE",
    "PRODUCTS",
    "INTERVAL_MINUTES",
    "AI_MODEL",
    "ANTHROPIC_API_KEY",
    "COINBASE_API_KEY",
    "COINBASE_API_SECRET",
    "STARTING_CASH_GBP",
    "MAX_TRADE_PCT",
    "MIN_CONFIDENCE",
    "MAX_DAILY_LOSS_PCT",
    "MAX_TRADES_PER_DAY",
    "FEE_PCT",
    "SLIPPAGE_PCT",
    "MIN_TRADE_GBP",
}


@dataclass
class Config:
    # "paper" = simulated money against live prices. "live" = real orders on Coinbase.
    mode: str = "paper"
    products: list[str] = field(default_factory=lambda: ["BTC-GBP", "ETH-GBP"])
    interval_minutes: int = 15
    ai_model: str = "claude-opus-4-8"
    anthropic_api_key: str = ""
    coinbase_api_key: str = ""
    coinbase_api_secret: str = ""
    starting_cash_gbp: float = 300.0
    # Safety rails
    max_trade_pct: float = 0.25        # max fraction of cash (buy) / holding (sell) per trade
    min_confidence: float = 0.6        # ignore AI decisions below this confidence
    max_daily_loss_pct: float = 0.05   # circuit breaker: stop trading for the day at -5%
    max_trades_per_day: int = 12
    # Simulation realism (paper mode)
    fee_pct: float = 0.006             # Coinbase Advanced taker fee at entry tier (0.6%)
    slippage_pct: float = 0.0005
    min_trade_gbp: float = 2.0

    @classmethod
    def load(cls) -> "Config":
        env = load_env_file()
        cfg = cls()
        cfg.mode = env.get("MODE", cfg.mode).lower()
        if products := env.get("PRODUCTS"):
            cfg.products = [p.strip().upper() for p in products.split(",") if p.strip()]
        cfg.interval_minutes = int(env.get("INTERVAL_MINUTES", cfg.interval_minutes))
        cfg.ai_model = env.get("AI_MODEL", cfg.ai_model)
        cfg.anthropic_api_key = env.get("ANTHROPIC_API_KEY", "")
        cfg.coinbase_api_key = env.get("COINBASE_API_KEY", "")
        cfg.coinbase_api_secret = env.get("COINBASE_API_SECRET", "")
        cfg.starting_cash_gbp = float(env.get("STARTING_CASH_GBP", cfg.starting_cash_gbp))
        cfg.max_trade_pct = float(env.get("MAX_TRADE_PCT", cfg.max_trade_pct))
        cfg.min_confidence = float(env.get("MIN_CONFIDENCE", cfg.min_confidence))
        cfg.max_daily_loss_pct = float(env.get("MAX_DAILY_LOSS_PCT", cfg.max_daily_loss_pct))
        cfg.max_trades_per_day = int(env.get("MAX_TRADES_PER_DAY", cfg.max_trades_per_day))
        cfg.fee_pct = float(env.get("FEE_PCT", cfg.fee_pct))
        cfg.slippage_pct = float(env.get("SLIPPAGE_PCT", cfg.slippage_pct))
        cfg.min_trade_gbp = float(env.get("MIN_TRADE_GBP", cfg.min_trade_gbp))
        if cfg.mode not in ("paper", "live"):
            raise ValueError(f"MODE must be 'paper' or 'live', got {cfg.mode!r}")
        return cfg

    def validate_for_run(self) -> list[str]:
        """Return a list of human-readable problems that block a run."""
        problems = []
        if not self.anthropic_api_key:
            problems.append(
                "ANTHROPIC_API_KEY is not set — the bot needs it to make AI decisions. "
                "Get one at https://platform.claude.com and run `python -m daytrader setup`."
            )
        if self.mode == "live" and not (self.coinbase_api_key and self.coinbase_api_secret):
            problems.append(
                "MODE=live but COINBASE_API_KEY / COINBASE_API_SECRET are not set. "
                "Create a CDP API key at https://portal.cdp.coinbase.com with 'trade' permission."
            )
        return problems
