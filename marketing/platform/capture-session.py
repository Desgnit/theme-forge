#!/usr/bin/env python3
"""Capture a logged-in browser session for a marketplace — run ON YOUR OWN
COMPUTER. This is how the RPA listers authenticate without ever storing your
password: you log in by hand once, and the saved session cookie is stored as
a GitHub secret.

Setup (once):  pip install playwright && python -m playwright install chromium

Usage:  python3 marketing/platform/capture-session.py gumroad
        python3 marketing/platform/capture-session.py creativemarket
        python3 marketing/platform/capture-session.py themeforest

A browser window opens on the site's login page. Log in (solve any captcha /
2FA as normal), wait until you can see your dashboard, then come back to the
terminal and press Enter. The script prints a base64 blob — save it as the
matching GitHub repo secret (Settings -> Secrets and variables -> Actions):

    gumroad        -> GUMROAD_SESSION
    creativemarket -> CREATIVEMARKET_SESSION
    themeforest    -> THEMEFOREST_SESSION

Sessions eventually expire (weeks to months, per site). If the sync workflow
reports "session expired", just re-run this and update the secret.
"""
import base64
import json
import sys

from playwright.sync_api import sync_playwright

LOGIN_URLS = {
    "gumroad": "https://gumroad.com/login",
    "creativemarket": "https://creativemarket.com/sign-in",
    "themeforest": "https://themeforest.net/sign_in",
}


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in LOGIN_URLS:
        print(__doc__)
        return 1
    site = sys.argv[1]
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)
        ctx = browser.new_context()
        page = ctx.new_page()
        page.goto(LOGIN_URLS[site])
        input(f"\nLog in to {site} in the browser window, then press Enter here... ")
        state = ctx.storage_state()
        browser.close()
    blob = base64.b64encode(json.dumps(state).encode()).decode()
    print(f"\nSave this as the {site.upper()}_SESSION repo secret:\n")
    print(blob)
    return 0


if __name__ == "__main__":
    sys.exit(main())
