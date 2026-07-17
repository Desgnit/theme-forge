"""Order execution: a realistic paper broker, and a live Coinbase broker.

Paper mode simulates fills against live prices with fees and slippage so the
performance numbers you see are honest. Live mode places real market orders
via the official Coinbase Advanced Trade SDK.
"""

from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

from .config import Config, DATA_DIR
from .risk import RiskState


@dataclass
class Fill:
    product_id: str
    side: str          # "buy" | "sell"
    quantity: float    # base asset amount
    price: float       # effective price incl. slippage
    notional: float    # GBP value before fee
    fee: float         # GBP


class PortfolioState:
    """Cash + holdings, persisted as JSON so restarts pick up where they left off."""

    def __init__(self, config: Config, path: Path | None = None):
        self.config = config
        self.path = path or DATA_DIR / "portfolio.json"
        self.cash: float = config.starting_cash_gbp
        self.holdings: dict[str, float] = {}
        self.deposited: float = config.starting_cash_gbp
        self.risk = RiskState()
        self._load()

    def _load(self) -> None:
        if self.path.exists():
            data = json.loads(self.path.read_text())
            self.cash = float(data["cash"])
            self.holdings = {k: float(v) for k, v in data.get("holdings", {}).items()}
            self.deposited = float(data.get("deposited", self.deposited))
            self.risk = RiskState.from_dict(data.get("risk", {}))

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(
            json.dumps(
                {
                    "cash": self.cash,
                    "holdings": self.holdings,
                    "deposited": self.deposited,
                    "risk": self.risk.to_dict(),
                },
                indent=2,
            )
        )

    def equity(self, prices: dict[str, float]) -> float:
        value = self.cash
        for product_id, qty in self.holdings.items():
            value += qty * prices.get(product_id, 0.0)
        return value

    def deposit(self, amount: float) -> None:
        self.cash += amount
        self.deposited += amount


class PaperBroker:
    def __init__(self, config: Config, state: PortfolioState):
        self.config = config
        self.state = state

    def buy(self, product_id: str, cash_amount: float, market_price: float) -> Fill:
        cash_amount = min(cash_amount, self.state.cash)
        price = market_price * (1 + self.config.slippage_pct)
        fee = cash_amount * self.config.fee_pct
        spend = cash_amount - fee
        quantity = spend / price
        self.state.cash -= cash_amount
        self.state.holdings[product_id] = self.state.holdings.get(product_id, 0.0) + quantity
        return Fill(product_id, "buy", quantity, price, cash_amount, fee)

    def sell(self, product_id: str, quantity: float, market_price: float) -> Fill:
        held = self.state.holdings.get(product_id, 0.0)
        quantity = min(quantity, held)
        price = market_price * (1 - self.config.slippage_pct)
        gross = quantity * price
        fee = gross * self.config.fee_pct
        self.state.cash += gross - fee
        remaining = held - quantity
        if remaining * price < 0.01:
            self.state.holdings.pop(product_id, None)
        else:
            self.state.holdings[product_id] = remaining
        return Fill(product_id, "sell", quantity, price, gross, fee)


class LiveBroker:
    """Real orders on Coinbase Advanced Trade. Requires the coinbase-advanced-py SDK."""

    def __init__(self, config: Config, state: PortfolioState):
        self.config = config
        self.state = state
        try:
            from coinbase.rest import RESTClient
        except ImportError as exc:
            raise RuntimeError(
                "Live mode needs the official Coinbase SDK: pip install coinbase-advanced-py"
            ) from exc
        self.client = RESTClient(
            api_key=config.coinbase_api_key, api_secret=config.coinbase_api_secret
        )

    def buy(self, product_id: str, cash_amount: float, market_price: float) -> Fill:
        order = self.client.market_order_buy(
            client_order_id=str(uuid.uuid4()),
            product_id=product_id,
            quote_size=f"{cash_amount:.2f}",
        )
        return self._fill_from_order(order, product_id, "buy", market_price, cash_amount)

    def sell(self, product_id: str, quantity: float, market_price: float) -> Fill:
        order = self.client.market_order_sell(
            client_order_id=str(uuid.uuid4()),
            product_id=product_id,
            base_size=f"{quantity:.8f}",
        )
        return self._fill_from_order(order, product_id, "sell", market_price, quantity * market_price)

    def _fill_from_order(self, order, product_id: str, side: str, market_price: float, notional: float) -> Fill:
        response = order.to_dict() if hasattr(order, "to_dict") else dict(order)
        if not response.get("success", False):
            raise RuntimeError(f"Coinbase order failed: {response.get('error_response')}")
        # Give the fill a moment to settle, then read actual filled values.
        time.sleep(2)
        order_id = response["success_response"]["order_id"]
        detail = self.client.get_order(order_id)
        od = detail.to_dict() if hasattr(detail, "to_dict") else dict(detail)
        o = od.get("order", {})
        quantity = float(o.get("filled_size") or 0.0)
        avg_price = float(o.get("average_filled_price") or market_price)
        fee = float(o.get("total_fees") or 0.0)
        value = float(o.get("filled_value") or notional)
        # Mirror the exchange state locally so equity tracking works the same as paper.
        if side == "buy":
            self.state.cash -= value + fee
            self.state.holdings[product_id] = self.state.holdings.get(product_id, 0.0) + quantity
        else:
            self.state.cash += value - fee
            remaining = self.state.holdings.get(product_id, 0.0) - quantity
            if remaining <= 0:
                self.state.holdings.pop(product_id, None)
            else:
                self.state.holdings[product_id] = remaining
        return Fill(product_id, side, quantity, avg_price, value, fee)


def make_broker(config: Config, state: PortfolioState):
    if config.mode == "live":
        return LiveBroker(config, state)
    return PaperBroker(config, state)
