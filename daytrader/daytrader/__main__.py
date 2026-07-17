"""Command-line interface.

    python -m daytrader setup            one-time interactive setup wizard
    python -m daytrader run              start the trading loop
    python -m daytrader once             run a single cycle and exit
    python -m daytrader status           show portfolio, P&L and recent trades
    python -m daytrader deposit 100      add £100 to the (paper) pot
"""

from __future__ import annotations

import argparse
import csv
import logging
import sys

from .config import Config, ENV_FILE
from .market import fetch_prices


def cmd_setup() -> None:
    print("=== DayTrader setup ===\n")
    if ENV_FILE.exists():
        answer = input(f"{ENV_FILE} already exists. Overwrite? [y/N] ").strip().lower()
        if answer != "y":
            print("Keeping existing config.")
            return

    print("The bot starts in PAPER mode: fake money, real live prices, zero risk.")
    print("Switch to live trading later by editing MODE in the .env file.\n")

    anthropic_key = input("Anthropic API key (for AI decisions, sk-ant-...): ").strip()
    products = input("Products to trade [BTC-GBP,ETH-GBP]: ").strip() or "BTC-GBP,ETH-GBP"
    interval = input("Minutes between trading cycles [15]: ").strip() or "15"
    starting_cash = input("Starting paper cash in GBP [300]: ").strip() or "300"

    print("\nOptional — only needed for LIVE trading (leave blank for now):")
    cb_key = input("Coinbase CDP API key name: ").strip()
    cb_secret = input("Coinbase CDP API private key: ").strip()

    ENV_FILE.write_text(
        "# DayTrader configuration — see README.md for every option\n"
        "MODE=paper\n"
        f"PRODUCTS={products}\n"
        f"INTERVAL_MINUTES={interval}\n"
        f"STARTING_CASH_GBP={starting_cash}\n"
        "AI_MODEL=claude-opus-4-8\n"
        f"ANTHROPIC_API_KEY={anthropic_key}\n"
        f"COINBASE_API_KEY={cb_key}\n"
        f"COINBASE_API_SECRET={cb_secret}\n"
        "# Safety rails\n"
        "MAX_TRADE_PCT=0.25\n"
        "MIN_CONFIDENCE=0.6\n"
        "MAX_DAILY_LOSS_PCT=0.05\n"
        "MAX_TRADES_PER_DAY=12\n"
    )
    print(f"\nSaved {ENV_FILE}")
    print("Start paper trading with:  python -m daytrader run")


def cmd_run(loop: bool) -> None:
    config = Config.load()
    problems = config.validate_for_run()
    if problems:
        for p in problems:
            print(f"ERROR: {p}", file=sys.stderr)
        sys.exit(1)
    if config.mode == "live":
        print("*** LIVE MODE — this will place real orders with real money on Coinbase ***")
        if input("Type 'yes' to continue: ").strip().lower() != "yes":
            sys.exit(0)

    from .runner import Runner

    runner = Runner(config)
    if loop:
        runner.loop()
    else:
        runner.cycle()


def cmd_status() -> None:
    from .broker import PortfolioState
    from .runner import TRADES_CSV

    config = Config.load()
    state = PortfolioState(config)
    try:
        prices = fetch_prices(list(state.holdings) or config.products)
    except Exception as exc:  # offline — show book values only
        print(f"(could not fetch live prices: {exc})")
        prices = {}

    equity = state.equity(prices)
    pnl = equity - state.deposited
    print(f"Mode:      {config.mode}")
    print(f"Cash:      £{state.cash:.2f}")
    for product_id, qty in state.holdings.items():
        value = qty * prices.get(product_id, 0.0)
        print(f"Holding:   {product_id}  {qty:.8f}  (£{value:.2f})")
    print(f"Equity:    £{equity:.2f}")
    print(f"Deposited: £{state.deposited:.2f}")
    print(f"P&L:       £{pnl:+.2f} ({pnl / state.deposited * 100 if state.deposited else 0:+.2f}%)")
    if state.risk.halted:
        print("NOTE: daily loss circuit breaker is tripped — no trades until tomorrow.")

    if TRADES_CSV.exists():
        rows = list(csv.reader(TRADES_CSV.open()))
        print(f"\nLast trades ({min(5, len(rows) - 1)} of {len(rows) - 1}):")
        for row in rows[-5:] if len(rows) > 1 else []:
            if row[0] == "timestamp":
                continue
            print(f"  {row[0]}  {row[1].upper():4} {row[2]}  £{row[5]} @ £{row[4]}")


def cmd_deposit(amount: float) -> None:
    from .broker import PortfolioState

    config = Config.load()
    if config.mode == "live":
        print("In live mode, deposit real funds through the Coinbase app; the bot will see the new balance.")
        sys.exit(1)
    state = PortfolioState(config)
    state.deposit(amount)
    state.save()
    print(f"Deposited £{amount:.2f}. Cash is now £{state.cash:.2f} (total put in: £{state.deposited:.2f}).")


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    logging.getLogger("httpx").setLevel(logging.WARNING)
    parser = argparse.ArgumentParser(prog="daytrader", description="AI crypto day-trading bot")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("setup", help="interactive setup wizard")
    sub.add_parser("run", help="start the trading loop")
    sub.add_parser("once", help="run a single trading cycle")
    sub.add_parser("status", help="show portfolio and recent trades")
    deposit = sub.add_parser("deposit", help="add cash to the paper portfolio")
    deposit.add_argument("amount", type=float)

    args = parser.parse_args()
    if args.command == "setup":
        cmd_setup()
    elif args.command == "run":
        cmd_run(loop=True)
    elif args.command == "once":
        cmd_run(loop=False)
    elif args.command == "status":
        cmd_status()
    elif args.command == "deposit":
        cmd_deposit(args.amount)


if __name__ == "__main__":
    main()
