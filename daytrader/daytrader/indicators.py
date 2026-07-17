"""Technical indicators computed in pure Python (no numpy/pandas dependency).

All functions take a list of closing prices ordered oldest -> newest.
"""

from __future__ import annotations


def ema(prices: list[float], period: int) -> float | None:
    if len(prices) < period:
        return None
    k = 2 / (period + 1)
    value = sum(prices[:period]) / period
    for price in prices[period:]:
        value = price * k + value * (1 - k)
    return value


def rsi(prices: list[float], period: int = 14) -> float | None:
    if len(prices) < period + 1:
        return None
    gains, losses = [], []
    for prev, curr in zip(prices, prices[1:]):
        change = curr - prev
        gains.append(max(change, 0.0))
        losses.append(max(-change, 0.0))
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    for gain, loss in zip(gains[period:], losses[period:]):
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - 100 / (1 + rs)


def macd_histogram(prices: list[float]) -> float | None:
    """MACD(12,26,9) histogram value for the latest price."""
    if len(prices) < 35:
        return None
    macd_series = []
    for i in range(26, len(prices) + 1):
        window = prices[:i]
        fast, slow = ema(window, 12), ema(window, 26)
        if fast is None or slow is None:
            return None
        macd_series.append(fast - slow)
    signal = ema(macd_series, 9)
    if signal is None:
        return None
    return macd_series[-1] - signal


def pct_change(prices: list[float], lookback: int) -> float | None:
    if len(prices) < lookback + 1 or prices[-lookback - 1] == 0:
        return None
    return (prices[-1] / prices[-lookback - 1] - 1) * 100


def volatility_pct(prices: list[float], period: int = 24) -> float | None:
    """Standard deviation of per-candle returns over the period, in percent."""
    if len(prices) < period + 1:
        return None
    returns = [
        (curr / prev - 1)
        for prev, curr in zip(prices[-period - 1 : -1], prices[-period:])
        if prev != 0
    ]
    if not returns:
        return None
    mean = sum(returns) / len(returns)
    variance = sum((r - mean) ** 2 for r in returns) / len(returns)
    return (variance ** 0.5) * 100
