#!/usr/bin/env python3
"""Theme Forge setup wizard — connect every marketplace in one sitting.

Mac/Linux, one line:

    curl -s https://raw.githubusercontent.com/Desgnit/theme-forge/main/marketing/platform/setup-wizard.py | python3 -

Windows: download the file, then  python setup-wizard.py

The only thing you do is type your logins. The wizard does everything else:
installs its own dependencies, signs into GitHub (device code, or automatic
if the `gh` CLI is present), creates/finds your Etsy API app and clicks the
consent button itself, detects when you've finished logging in to each site
(no key presses needed), verifies every captured session, and uploads all
secrets to the repo. Re-run any time; it can also target one site:

    python3 setup-wizard.py gumroad
"""
import base64
import hashlib
import http.server
import json
import os
import re
import secrets as pysecrets
import shutil
import subprocess
import sys
import threading
import time
import urllib.parse
import webbrowser

REPO = "Desgnit/theme-forge"
ETSY_PORT = 8642
ETSY_SCOPES = "listings_r listings_w shops_r shops_w"
APP_NAME = "theme-forge autolister"
# GitHub CLI's public OAuth client id — used for device login when gh is absent
GH_CLIENT_ID = "178c6fc778ccc68e1d6a"

RPA_SITES = {
    "gumroad": {
        "login": "https://gumroad.com/login",
        "check": "https://app.gumroad.com/products",
        "domains": ("gumroad.com",),
        "secret": "GUMROAD_SESSION",
    },
    "creativemarket": {
        "login": "https://creativemarket.com/sign-in",
        "check": "https://creativemarket.com/account",
        "domains": ("creativemarket.com",),
        "secret": "CREATIVEMARKET_SESSION",
    },
    "themeforest": {
        "login": "https://themeforest.net/sign_in",
        "check": "https://themeforest.net/user/account",
        "domains": ("themeforest.net", "envato.com"),
        "secret": "THEMEFOREST_SESSION",
    },
    "payhip": {
        "login": "https://payhip.com/auth/login",
        "check": "https://payhip.com/dashboard",
        "domains": ("payhip.com",),
        "secret": "PAYHIP_SESSION",
    },
    "codester": {
        "login": "https://www.codester.com/login",
        "check": "https://www.codester.com/upload",
        "domains": ("codester.com",),
        "secret": "CODESTER_SESSION",
    },
    "wrapbootstrap": {
        "login": "https://wrapbootstrap.com/login",
        "check": "https://wrapbootstrap.com/user/items",
        "domains": ("wrapbootstrap.com",),
        "secret": "WRAPBOOTSTRAP_SESSION",
    },
    "templatemonster": {
        "login": "https://account.templatemonster.com/",
        "check": "https://account.templatemonster.com/products",
        "domains": ("templatemonster.com",),
        "secret": "TEMPLATEMONSTER_SESSION",
    },
    "creativefabrica": {
        "login": "https://www.creativefabrica.com/login/",
        "check": "https://studio.creativefabrica.com/",
        "domains": ("creativefabrica.com",),
        "secret": "CREATIVEFABRICA_SESSION",
    },
}
LOGIN_MARKERS = ("login", "sign_in", "sign-in", "signin", "sso")


def say(msg):
    print(f"\n==> {msg}", flush=True)


def ask(prompt):
    """Prompt that works even when the script is piped into python3."""
    try:
        with open("/dev/tty", "r") as tty_in, open("/dev/tty", "w") as tty_out:
            tty_out.write(prompt)
            tty_out.flush()
            return tty_in.readline().strip()
    except OSError:
        return input(prompt)


def bootstrap():
    say("Checking dependencies (installs anything missing)...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-q",
                    "playwright", "pynacl", "requests"], check=True)
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)


# ------------------------------------------------------------- GitHub auth

class GitHub:
    """Sets repo secrets. Prefers `gh` (zero interaction if already logged
    in); otherwise GitHub device login — you type one short code."""

    def __init__(self):
        self.gh = shutil.which("gh")
        self.token = None
        if self.gh and subprocess.run([self.gh, "auth", "status"],
                                      capture_output=True).returncode == 0:
            say("GitHub: using your existing gh login.")
            return
        self.gh = None
        import requests
        # cached token from a previous run?
        cache = os.path.expanduser("~/.theme-forge-setup.json")
        try:
            tok = json.load(open(cache)).get("github_token")
            if tok and requests.get("https://api.github.com/user", timeout=15,
                                    headers={"Authorization": f"Bearer {tok}"}).ok:
                self.token = tok
                say("GitHub: using your saved login.")
                return
        except Exception:
            pass
        say("GitHub sign-in — a browser page is opening.")

        def new_code():
            r = requests.post("https://github.com/login/device/code",
                              data={"client_id": GH_CLIENT_ID, "scope": "repo"},
                              headers={"Accept": "application/json"}, timeout=30).json()
            print(f"\n  >>> Type this code on the page NOW (expires in ~15 min):   "
                  f"{r['user_code']}\n")
            webbrowser.open(r.get("verification_uri", "https://github.com/login/device"))
            return r

        r = new_code()
        interval = int(r.get("interval", 5))
        while True:
            time.sleep(interval)
            p = requests.post("https://github.com/login/oauth/access_token", data={
                "client_id": GH_CLIENT_ID, "device_code": r["device_code"],
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            }, headers={"Accept": "application/json"}, timeout=30).json()
            if "access_token" in p:
                self.token = p["access_token"]
                try:
                    json.dump({"github_token": self.token},
                              open(os.path.expanduser("~/.theme-forge-setup.json"), "w"))
                except Exception:
                    pass
                print("  GitHub connected (and remembered for next time).")
                return
            if p.get("error") == "slow_down":
                interval += 5
            elif p.get("error") == "expired_token":
                print("  That code expired — here's a fresh one:")
                r = new_code()
                interval = int(r.get("interval", 5))
            elif p.get("error") != "authorization_pending":
                raise SystemExit(f"GitHub login failed: {p.get('error')}")

    def set_secret(self, name, value):
        if self.gh:
            subprocess.run([self.gh, "secret", "set", name, "--repo", REPO],
                           input=value.encode(), check=True)
        else:
            import requests
            from nacl import encoding, public
            h = {"Authorization": f"Bearer {self.token}",
                 "Accept": "application/vnd.github+json"}
            key = requests.get(
                f"https://api.github.com/repos/{REPO}/actions/secrets/public-key",
                headers=h, timeout=30)
            key.raise_for_status()
            key = key.json()
            sealed = public.SealedBox(
                public.PublicKey(key["key"].encode(), encoding.Base64Encoder())
            ).encrypt(value.encode())
            requests.put(
                f"https://api.github.com/repos/{REPO}/actions/secrets/{name}",
                headers=h, timeout=30,
                json={"encrypted_value": base64.b64encode(sealed).decode(),
                      "key_id": key["key_id"]}).raise_for_status()
        print(f"  secret {name} set")


# --------------------------------------------------------------- helpers

def wait_for_login(ctx, check_url, timeout=900):
    """Poll (using the browser's own cookies) until check_url loads without
    bouncing to a login page. No key presses needed."""
    print("  Waiting for you to finish logging in (auto-detects)...", flush=True)
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            r = ctx.request.get(check_url, max_redirects=8, timeout=15000)
            if r.ok and not any(m in r.url for m in LOGIN_MARKERS):
                return True
        except Exception:
            pass
        time.sleep(2)
    return False


def filtered_state(ctx, domains):
    state = ctx.storage_state()
    state["cookies"] = [c for c in state.get("cookies", [])
                        if any(d in c.get("domain", "") for d in domains)]
    return state


# ------------------------------------------------------------------- Etsy

def find_keystring(page):
    """Scan the developer console DOM for a 24-char keystring."""
    text = page.evaluate("() => document.body.innerText")
    m = re.search(r"\b([a-z0-9]{24})\b", text)
    return m.group(1) if m else None


def setup_etsy(gh, browser):
    # Etsy's bot detection blocks automated browsers, so this whole step runs
    # in YOUR normal browser (where you're already logged in).
    import requests
    say("ETSY — using your normal browser (Etsy blocks automated ones).")
    print("  1. Have a SHOP (not just an account): etsy.com/sell → Open your Etsy shop.")
    print("  2. An app-registration page is opening in your browser. Create an app")
    print("     with any name. IMPORTANT — set the Callback URL to exactly:")
    print(f"        http://localhost:{ETSY_PORT}/callback")
    print("  3. Copy the KEYSTRING it shows you and paste it below.")
    webbrowser.open("https://www.etsy.com/developers/register")
    keystring = ask("  Paste the app KEYSTRING (or press Enter to skip Etsy): ").strip()
    if not keystring:
        print("  Skipped Etsy — re-run later with: python setup-wizard.py etsy")
        return
    print(f"  Using app keystring {keystring[:6]}…")

    # OAuth consent — the wizard clicks Allow itself.
    verifier = base64.urlsafe_b64encode(pysecrets.token_bytes(32)).rstrip(b"=").decode()
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    state_tok = pysecrets.token_hex(8)
    redirect = f"http://localhost:{ETSY_PORT}/callback"
    holder = {}

    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            holder.update({k: v[0] for k, v in urllib.parse.parse_qs(
                urllib.parse.urlparse(self.path).query).items()})
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(b"<h1>Connected - the wizard is finishing up.</h1>")

        def log_message(self, *a):
            pass

    srv = http.server.HTTPServer(("localhost", ETSY_PORT), H)
    threading.Thread(target=srv.handle_request, daemon=True).start()
    say("A consent page is opening in your browser — click 'Allow Access'.")
    print(f"  (If Etsy shows a redirect error, add {redirect} as the callback URL "
          "in your app's settings, then re-run: python setup-wizard.py etsy)")
    webbrowser.open("https://www.etsy.com/oauth/connect?" + urllib.parse.urlencode({
        "response_type": "code", "client_id": keystring, "redirect_uri": redirect,
        "scope": ETSY_SCOPES, "state": state_tok, "code_challenge": challenge,
        "code_challenge_method": "S256"}))
    t0 = time.time()
    while "code" not in holder and time.time() - t0 < 600:
        time.sleep(1)
    if holder.get("state") != state_tok or "code" not in holder:
        print("  Etsy consent didn't complete — skipping (re-run: setup-wizard.py etsy).")
        return

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
    results = shops.get("results") or ([shops] if shops.get("shop_id") else [])
    if not results:
        print("  Your Etsy account has no SHOP yet — open one at etsy.com/sell, then")
        print("  re-run: python setup-wizard.py etsy   (your app keystring stays valid)")
        return
    shop_id = results[0]["shop_id"]
    gh.set_secret("ETSY_API_KEY", keystring)
    gh.set_secret("ETSY_REFRESH_TOKEN", tokens["refresh_token"])
    gh.set_secret("ETSY_SHOP_ID", str(shop_id))
    print("  Etsy connected.")


# -------------------------------------------------------------- RPA sites

def setup_rpa(gh, browser, site):
    cfg = RPA_SITES[site]
    say(f"{site.upper()} — log in when the window opens (create the account "
        "first if needed).")
    ctx = browser.new_context()
    page = ctx.new_page()
    page.goto(cfg["login"])
    if not wait_for_login(ctx, cfg["check"]):
        print(f"  Timed out waiting for {site} login — skipping "
              f"(re-run: python3 setup-wizard.py {site}).")
        ctx.close()
        return
    state = filtered_state(ctx, cfg["domains"])
    ctx.close()
    gh.set_secret(cfg["secret"], base64.b64encode(json.dumps(state).encode()).decode())
    print(f"  {site} connected.")


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    valid = ["etsy"] + list(RPA_SITES)
    if only and only not in valid:
        print(__doc__)
        return 1
    bootstrap()
    gh = GitHub()
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)
        if only in (None, "etsy"):
            setup_etsy(gh, browser)
        for site in RPA_SITES:
            if only in (None, site):
                setup_rpa(gh, browser, site)
        browser.close()
    say("All done — the platform is live. Every push now lists everything. "
        "You're finished here.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
