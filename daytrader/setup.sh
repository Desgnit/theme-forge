#!/usr/bin/env bash
# One-click setup: creates a virtualenv, installs dependencies, runs the wizard.
set -euo pipefail
cd "$(dirname "$0")"

echo "== DayTrader one-click setup =="

if ! command -v python3 >/dev/null; then
  echo "python3 is required. Install it from https://www.python.org/downloads/ and re-run."
  exit 1
fi

python3 -m venv .venv
source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

python -m daytrader setup

echo
echo "Setup complete. To start the bot:"
echo "  cd $(pwd) && source .venv/bin/activate && python -m daytrader run"
