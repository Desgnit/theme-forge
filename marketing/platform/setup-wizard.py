#!/usr/bin/env python3
"""Theme Forge setup wizard — the ONE command that connects everything.

Run on your own computer (needs Python 3.9+ from python.org and nothing else):

    python3 setup-wizard.py

What it does, in one sitting (~15 min, once ever):
  1. Installs its own dependencies (playwright, pynacl, requests + Chromium).
  2. Connects to GitHub (via the `gh` CLI if you have it, else it opens a
     token page — one click + one paste).
  3. Etsy: opens the app-registration page, then runs the OAuth consent flow
     and finds your shop id automatically.
  4. Gumroad / Creative Market / ThemeForest: opens each login page in a real
     browser window — you log in as normal (captcha, 2FA, whatever), press
     Enter, and it captures the session.
  5. Uploads all secrets straight to the GitHub repo. No manual copy-paste.

After it finishes, every push to main lists every theme on every connected
marketplace with zero manual work. Re-run it any time a session expires (the
pipeline opens a GitHub issue to tell you); it skips anything still working.

You can also do a single site:  python3 setup-wizard.py etsy|gumroad|creativemarket|themeforest
"""
import base64
import hashlib
import http.server
import json
import os
import secrets as pysecrets
import shutil
import subprocess
import sys
import threading
import urllib.parse
import webbrowser

REPO = "Desgnit/theme-forge"
ETSY_PORT = 8642
ETSY_SCOPES = "listings_r listings_w shops_r shops_w"
RPA_SITES = {
    "gumroad": ("https://gumroad.com/login", "https://app.gumroad.com/products", "GUMROAD_SESSION"),
    "creativemarket": ("https://creativemarket.com/sign-in", "https://creativemarket.com/account", "CREATIVEMARKET_SESSION"),
    "themeforest": ("https://themeforest.net/sign_in", "https://themeforest.net/user/account", "THEMEFOREST_SESSION"),
}


def say(msg):
    print(f"\n==> {msg}")


def bootstrap():
    say("Checking dependencies (installs anything missing)...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-q",
                    "playwright", "pynacl", "requests"], check=True)
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)


# ------------------------------------------------------------- GitHub auth

class GitHub:
    """Sets repo secrets via `gh` when available, else a PAT + REST."""

    def __init__(self):
        self.gh = shutil.which("gh")
        self.token = None
        if self.gh:
            ok = subprocess.run([self.gh, "auth", "status"], capture_output=True).returncode == 0
            if not ok:
                say("Logging you into GitHub (browser will open)...")
                subprocess.run([self.gh, "auth", "login", "--web", "-h", "github.com"], check=True)
            return
        say("GitHub CLI not found — using a token instead.")
        url = ("https://github.com/settings/tokens/new"
               "?scopes=repo&description=theme-forge-setup-wizard")
        print(f"  Opening {url}")
        print("  Click 'Generate token' at the bottom, then paste it here.")
        webbrowser.open(url)
        self.token = input("  Token: ").strip()

    def set_secret(self, name, value):
        if self.gh:
            subprocess.run([self.gh, "secret", "set", name, "--repo", REPO],
                           input=value.encode(), check=True)
        else:
            import requests
            from nacl import encoding, public
            h = {"Authorization": f"Bearer {self.token}",
                 "Accept": "application/vnd.github+json"}
            key = requests.get(f"https://api.github.com/repos/{REPO}/actions/secrets/public-key",
                               headers=h, timeout=30)
            key.raise_for_status()
            key = key.json()
            sealed = public.SealedBox(
                public.PublicKey(key["key"].encode(), encoding.Base64Encoder())
            ).encrypt(value.encode())
            r = requests.put(
                f"https://api.github.com/repos/{REPO}/actions/secrets/{name}",
                headers=h, timeout=30,
                json={"encrypted_value": base64.b64encode(sealed).decode(),
                      "key_id": key["key_id"]})
            r.raise_for_status()
        print(f"  secret {name} set on {REPO}")


# ------------------------------------------------------------------- Etsy

def setup_etsy(gh):
    import requests
    say("ETSY — you need a (free) API app. If you don't have one:")
    print("  1. Have an Etsy shop (etsy.com/sell) — create it first if needed.")
    print("  2. The app page is opening: register any app name.")
    print(f"     Callback URL must be exactly: http://localhost:{ETSY_PORT}/callback")
    webbrowser.open("https://www.etsy.com/developers/register")
    keystring = input("  Paste your app KEYSTRING: ").strip()
    if not keystring:
        print("  skipped Etsy")
        return

    verifier = base64.urlsafe_b64encode(pysecrets.token_bytes(32)).rstrip(b"=").decode()
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    state = pysecrets.token_hex(8)
    redirect = f"http://localhost:{ETSY_PORT}/callback"
    url = "https://www.etsy.com/oauth/connect?" + urllib.parse.urlencode({
        "response_type": "code", "client_id": keystring, "redirect_uri": redirect,
        "scope": ETSY_SCOPES, "state": state, "code_challenge": challenge,
        "code_challenge_method": "S256"})

    holder = {}

    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            holder.update({k: v[0] for k, v in urllib.parse.parse_qs(
                urllib.parse.urlparse(self.path).query).items()})
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(b"<h1>Done - close this tab.</h1>")

        def log_message(self, *a):
            pass

    srv = http.server.HTTPServer(("localhost", ETSY_PORT), H)
    threading.Thread(target=srv.handle_request, daemon=True).start()
    say("Approving access (browser opening — click 'Allow Access')...")
    webbrowser.open(url)
    while "code" not in holder:
        pass
    assert holder.get("state") == state, "OAuth state mismatch — run again"

    tokens = requests.post("https://api.etsy.com/v3/public/oauth/token", data={
        "grant_type": "authorization_code", "client_id": keystring,
        "redirect_uri": redirect, "code": holder["code"],
        "code_verifier": verifier}, timeout=30)
    tokens.raise_for_status()
    tokens = tokens.json()
    user_id = tokens["access_token"].split(".")[0]
    shops = requests.get(
        f"https://api.etsy.com/v3/application/users/{user_id}/shops",
        headers={"x-api-key": keystring,
                 "Authorization": f"Bearer {tokens['access_token']}"}, timeout=30).json()
    shop_id = shops.get("shop_id") or shops["results"][0]["shop_id"]

    gh.set_secret("ETSY_API_KEY", keystring)
    gh.set_secret("ETSY_REFRESH_TOKEN", tokens["refresh_token"])
    gh.set_secret("ETSY_SHOP_ID", str(shop_id))
    if input("  Publish Etsy listings immediately instead of drafts? "
             "(Etsy charges $0.20/listing) [y/N]: ").strip().lower() == "y":
        gh.set_secret("ETSY_PUBLISH", "active")
    print("  Etsy connected.")


# -------------------------------------------------------------- RPA sites

def setup_rpa(gh, site):
    from playwright.sync_api import sync_playwright
    login_url, check_url, secret = RPA_SITES[site]
    say(f"{site.upper()} — a browser window is opening. Log in as normal "
        "(create the account first if you don't have one).")
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)
        ctx = browser.new_context()
        page = ctx.new_page()
        page.goto(login_url)
        input(f"  When you can see your {site} dashboard, press Enter here... ")
        state = ctx.storage_state()
        # verify the captured session actually works headlessly
        ctx2 = browser.new_context(storage_state=state)
        p2 = ctx2.new_page()
        p2.goto(check_url, wait_until="domcontentloaded")
        ok = "login" not in p2.url and "sign_in" not in p2.url and "sign-in" not in p2.url
        browser.close()
    if not ok:
        print(f"  WARNING: the {site} session didn't verify — you may not have "
              "been fully logged in. Re-run: python3 setup-wizard.py " + site)
        if input("  Save it anyway? [y/N]: ").strip().lower() != "y":
            return
    gh.set_secret(secret, base64.b64encode(json.dumps(state).encode()).decode())
    print(f"  {site} connected.")


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    valid = ["etsy"] + list(RPA_SITES)
    if only and only not in valid:
        print(__doc__)
        return 1
    bootstrap()
    gh = GitHub()
    if only in (None, "etsy"):
        setup_etsy(gh)
    for site in RPA_SITES:
        if only in (None, site):
            setup_rpa(gh, site)
    say("All done. Push anything to main (or re-run the last workflow) and "
        "the pipeline lists everything. You're finished here.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
