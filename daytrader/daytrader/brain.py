"""AI decision-making via the Claude API.

Each cycle, the bot sends a full market + portfolio snapshot to Claude and
receives back a schema-validated trading plan. Structured outputs guarantee
the response parses — the bot never acts on free-form text.
"""

from __future__ import annotations

import json
from typing import Literal

import anthropic
from pydantic import BaseModel, Field

from .config import Config

SYSTEM_PROMPT = """\
You are the decision engine of a small automated crypto day-trading bot. You \
manage a GBP portfolio measured in the low hundreds of pounds. Every cycle you \
receive live market data (price, momentum, RSI, EMAs, MACD, volatility) and the \
current portfolio state, and you must decide for each product: buy, sell, or hold.

Rules you must follow:
- Base every decision strictly on the data provided. Never invent prices or news.
- Each round-trip trade costs roughly 1.2% in fees and spread. Only trade when \
your expected edge clearly exceeds that cost. When in doubt, hold — overtrading \
is the main way small accounts bleed out.
- size_pct is the fraction of available cash to spend (buy) or the fraction of \
the current holding to sell (sell). Keep individual trades small; this account \
compounds through many modest wins, not hero trades.
- Respect momentum and mean-reversion signals together: RSI > 70 with fading \
MACD histogram argues for taking profit; RSI < 30 with turning momentum can be \
an entry. High volatility means smaller sizes.
- confidence reflects how strongly the data supports the action. Use values \
below 0.6 to signal "this is a weak idea" — the risk manager will skip those.
- Capital preservation beats profit. If the portfolio shows a meaningful \
drawdown today, prefer holds and small de-risking sells.
"""


class TradeDecision(BaseModel):
    product_id: str = Field(description="Product this decision applies to, e.g. BTC-GBP")
    action: Literal["buy", "sell", "hold"]
    size_pct: float = Field(
        description="Fraction (0-1) of available cash to spend on a buy, or of the "
        "current holding to sell. Ignored for hold."
    )
    confidence: float = Field(description="Confidence in this decision, 0 to 1")
    reasoning: str = Field(description="One or two sentences citing the specific data points")


class TradingPlan(BaseModel):
    market_outlook: str = Field(description="One-sentence summary of current conditions")
    decisions: list[TradeDecision]


class Brain:
    def __init__(self, config: Config):
        self.config = config
        self.client = anthropic.Anthropic(api_key=config.anthropic_api_key)

    def decide(self, snapshot_payload: dict) -> TradingPlan:
        """Ask Claude for a trading plan given the market/portfolio snapshot."""
        response = self.client.messages.parse(
            model=self.config.ai_model,
            max_tokens=8000,
            thinking={"type": "adaptive"},
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Here is the current snapshot. Return a decision for every "
                        "product listed under market_data.\n\n"
                        + json.dumps(snapshot_payload, indent=2)
                    ),
                }
            ],
            output_format=TradingPlan,
        )
        plan = response.parsed_output
        if plan is None:
            raise RuntimeError(
                f"Claude response could not be parsed into a TradingPlan "
                f"(stop_reason={response.stop_reason})"
            )
        return plan
