"""Unit tests for indicators, risk rails, the paper broker, and a full cycle
with the AI and market data stubbed out."""

import sys
from datetime import date
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from daytrader import indicators
from daytrader.brain import TradeDecision, TradingPlan
from daytrader.broker import PaperBroker, PortfolioState
from daytrader.config import Config
from daytrader.risk import RiskManager, RiskState


@pytest.fixture
def config(tmp_path, monkeypatch):
    cfg = Config()
    cfg.starting_cash_gbp = 300.0
    monkeypatch.setattr("daytrader.broker.DATA_DIR", tmp_path)
    return cfg


@pytest.fixture
def state(config, tmp_path):
    return PortfolioState(config, path=tmp_path / "portfolio.json")


# ---------- indicators ----------

def test_rsi_extremes():
    rising = list(range(1, 40))
    falling = list(range(40, 1, -1))
    assert indicators.rsi([float(p) for p in rising]) == 100.0
    assert indicators.rsi([float(p) for p in falling]) == 0.0


def test_rsi_needs_enough_data():
    assert indicators.rsi([1.0, 2.0, 3.0]) is None


def test_ema_of_constant_series():
    assert indicators.ema([5.0] * 30, 12) == pytest.approx(5.0)


def test_macd_histogram_sign_on_uptrend():
    prices = [100 + i * 0.5 for i in range(60)]
    accelerating = prices[:40] + [prices[39] + i * 2.0 for i in range(1, 21)]
    hist = indicators.macd_histogram(accelerating)
    assert hist is not None and hist > 0


def test_pct_change():
    assert indicators.pct_change([100.0, 110.0], 1) == pytest.approx(10.0)


# ---------- risk manager ----------

def make_decision(action="buy", size=0.2, conf=0.8):
    return TradeDecision(product_id="BTC-GBP", action=action, size_pct=size,
                         confidence=conf, reasoning="test")


def test_risk_blocks_low_confidence(config):
    rm = RiskManager(config, RiskState())
    rm.start_cycle(300.0, date(2026, 7, 17))
    approved, reason, _ = rm.vet(make_decision(conf=0.4), cash=300.0, holding_value=0.0)
    assert not approved and "confidence" in reason


def test_risk_clamps_oversized_trade(config):
    rm = RiskManager(config, RiskState())
    rm.start_cycle(300.0, date(2026, 7, 17))
    approved, _, size = rm.vet(make_decision(size=0.9), cash=300.0, holding_value=0.0)
    assert approved and size == config.max_trade_pct


def test_daily_loss_circuit_breaker(config):
    rm = RiskManager(config, RiskState())
    rm.start_cycle(300.0, date(2026, 7, 17))
    # Equity falls 6% intraday -> breaker trips (limit is 5%)
    rm.start_cycle(282.0, date(2026, 7, 17))
    approved, reason, _ = rm.vet(make_decision(), cash=282.0, holding_value=0.0)
    assert not approved and "circuit breaker" in reason
    # Next day resets
    rm.start_cycle(282.0, date(2026, 7, 18))
    approved, _, _ = rm.vet(make_decision(), cash=282.0, holding_value=0.0)
    assert approved


def test_max_trades_per_day(config):
    config.max_trades_per_day = 2
    rm = RiskManager(config, RiskState())
    rm.start_cycle(300.0, date(2026, 7, 17))
    rm.record_trade()
    rm.record_trade()
    approved, reason, _ = rm.vet(make_decision(), cash=300.0, holding_value=0.0)
    assert not approved and "max trades" in reason


def test_minimum_notional(config):
    rm = RiskManager(config, RiskState())
    rm.start_cycle(300.0, date(2026, 7, 17))
    approved, reason, _ = rm.vet(make_decision(size=0.001), cash=300.0, holding_value=0.0)
    assert not approved and "below minimum" in reason


# ---------- paper broker ----------

def test_paper_buy_then_sell_costs_fees(config, state):
    broker = PaperBroker(config, state)
    fill = broker.buy("BTC-GBP", 100.0, market_price=50_000.0)
    assert state.cash == pytest.approx(200.0)
    assert fill.fee == pytest.approx(0.6)
    assert state.holdings["BTC-GBP"] == pytest.approx(fill.quantity)

    broker.sell("BTC-GBP", fill.quantity, market_price=50_000.0)
    assert "BTC-GBP" not in state.holdings
    # Round trip at flat price loses ~1.2% of the traded amount to fees+slippage
    assert 298.0 < state.cash < 299.0


def test_paper_cannot_overspend_or_oversell(config, state):
    broker = PaperBroker(config, state)
    broker.buy("BTC-GBP", 10_000.0, market_price=50_000.0)  # only £300 available
    assert state.cash == pytest.approx(0.0)
    qty = state.holdings["BTC-GBP"]
    broker.sell("BTC-GBP", qty * 5, market_price=50_000.0)  # only qty available
    assert "BTC-GBP" not in state.holdings


def test_state_persists(config, tmp_path):
    path = tmp_path / "p.json"
    s1 = PortfolioState(config, path=path)
    s1.cash = 123.45
    s1.holdings = {"ETH-GBP": 0.5}
    s1.save()
    s2 = PortfolioState(config, path=path)
    assert s2.cash == pytest.approx(123.45)
    assert s2.holdings == {"ETH-GBP": 0.5}


def test_deposit(config, state):
    state.deposit(100.0)
    assert state.cash == pytest.approx(400.0)
    assert state.deposited == pytest.approx(400.0)


# ---------- full cycle with stubbed AI + market ----------

class StubBrain:
    def __init__(self, plan):
        self.plan = plan
        self.payloads = []

    def decide(self, payload):
        self.payloads.append(payload)
        return self.plan


def test_full_cycle_executes_approved_buy(config, tmp_path, monkeypatch):
    from daytrader import runner as runner_mod
    from daytrader.market import ProductSnapshot

    monkeypatch.setattr(runner_mod, "TRADES_CSV", tmp_path / "trades.csv")
    monkeypatch.setattr(runner_mod, "DECISIONS_LOG", tmp_path / "decisions.jsonl")

    snap = ProductSnapshot(
        product_id="BTC-GBP", price=50_000.0, bid=49_990.0, ask=50_010.0,
        change_1h_pct=-1.0, change_6h_pct=-3.0, change_24h_pct=-5.0,
        rsi_14=28.0, ema_12=49_500.0, ema_26=51_000.0,
        macd_histogram=12.0, volatility_24h_pct=0.8, volume_24h=100.0,
    )
    monkeypatch.setattr(runner_mod, "fetch_snapshots", lambda products: {"BTC-GBP": snap})

    plan = TradingPlan(
        market_outlook="Oversold bounce setup",
        decisions=[make_decision(action="buy", size=0.1, conf=0.8)],
    )
    config.products = ["BTC-GBP"]
    r = runner_mod.Runner(config, brain=StubBrain(plan))
    r.cycle()

    assert r.state.cash == pytest.approx(270.0)          # spent 10% of £300
    assert r.state.holdings["BTC-GBP"] > 0
    assert (tmp_path / "trades.csv").exists()
    assert (tmp_path / "decisions.jsonl").exists()
    # The AI saw the real payload structure
    payload = r.brain.payloads[0]
    assert payload["portfolio"]["cash_gbp"] == 300.0
    assert payload["market_data"]["BTC-GBP"]["rsi_14"] == 28.0


def test_full_cycle_skips_low_confidence(config, tmp_path, monkeypatch):
    from daytrader import runner as runner_mod
    from daytrader.market import ProductSnapshot

    monkeypatch.setattr(runner_mod, "TRADES_CSV", tmp_path / "trades.csv")
    monkeypatch.setattr(runner_mod, "DECISIONS_LOG", tmp_path / "decisions.jsonl")
    snap = ProductSnapshot(
        product_id="BTC-GBP", price=50_000.0, bid=49_990.0, ask=50_010.0,
        change_1h_pct=0.0, change_6h_pct=0.0, change_24h_pct=0.0,
        rsi_14=50.0, ema_12=50_000.0, ema_26=50_000.0,
        macd_histogram=0.0, volatility_24h_pct=0.5, volume_24h=100.0,
    )
    monkeypatch.setattr(runner_mod, "fetch_snapshots", lambda products: {"BTC-GBP": snap})

    plan = TradingPlan(
        market_outlook="Chop",
        decisions=[make_decision(action="buy", size=0.2, conf=0.3)],
    )
    config.products = ["BTC-GBP"]
    r = runner_mod.Runner(config, brain=StubBrain(plan))
    r.cycle()

    assert r.state.cash == pytest.approx(300.0)  # nothing traded
    assert not (tmp_path / "trades.csv").exists()
