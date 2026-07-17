"""Live market data from Coinbase's public Exchange API.

No authentication needed — these are public endpoints, so paper trading
works with zero credentials.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict

import httpx

BASE_URL = "https://api.exchange.coinbase.com"

from . import indicators


@dataclass
class ProductSnapshot:
    product_id: str
    price: float
    bid: float
    ask: float
    change_1h_pct: float | None
    change_6h_pct: float | None
    change_24h_pct: float | None
    rsi_14: float | None
    ema_12: float | None
    ema_26: float | None
    macd_histogram: float | None
    volatility_24h_pct: float | None
    volume_24h: float

    def to_dict(self) -> dict:
        d = asdict(self)
        for key, value in d.items():
            if isinstance(value, float):
                d[key] = round(value, 6)
        return d


def _get(client: httpx.Client, path: str, **params) -> object:
    resp = client.get(BASE_URL + path, params=params or None, timeout=20)
    resp.raise_for_status()
    return resp.json()


def fetch_snapshot(client: httpx.Client, product_id: str) -> ProductSnapshot:
    ticker = _get(client, f"/products/{product_id}/ticker")
    stats = _get(client, f"/products/{product_id}/stats")
    # Hourly candles, newest first from the API: [time, low, high, open, close, volume]
    candles = _get(client, f"/products/{product_id}/candles", granularity=3600)
    candles = sorted(candles, key=lambda c: c[0])  # oldest -> newest
    closes = [float(c[4]) for c in candles]

    return ProductSnapshot(
        product_id=product_id,
        price=float(ticker["price"]),
        bid=float(ticker["bid"]),
        ask=float(ticker["ask"]),
        change_1h_pct=indicators.pct_change(closes, 1),
        change_6h_pct=indicators.pct_change(closes, 6),
        change_24h_pct=indicators.pct_change(closes, 24),
        rsi_14=indicators.rsi(closes, 14),
        ema_12=indicators.ema(closes, 12),
        ema_26=indicators.ema(closes, 26),
        macd_histogram=indicators.macd_histogram(closes),
        volatility_24h_pct=indicators.volatility_pct(closes, 24),
        volume_24h=float(stats.get("volume", 0.0)),
    )


def fetch_snapshots(product_ids: list[str]) -> dict[str, ProductSnapshot]:
    snapshots: dict[str, ProductSnapshot] = {}
    with httpx.Client() as client:
        for product_id in product_ids:
            snapshots[product_id] = fetch_snapshot(client, product_id)
    return snapshots


def fetch_prices(product_ids: list[str]) -> dict[str, float]:
    """Lightweight price-only fetch (used for equity valuation)."""
    prices: dict[str, float] = {}
    with httpx.Client() as client:
        for product_id in product_ids:
            ticker = _get(client, f"/products/{product_id}/ticker")
            prices[product_id] = float(ticker["price"])
    return prices
