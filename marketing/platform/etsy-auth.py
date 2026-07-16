#!/usr/bin/env python3
"""One-time Etsy OAuth helper — run this ON YOUR OWN COMPUTER, not in CI.

Prerequisites (once):
  1. Create an Etsy shop at etsy.com/sell (identity + payout details).
  2. Create an API app at etsy.com/developers/register — any name.
     Set the callback URL to exactly:  http://localhost:8642/callback
     Copy the KEYSTRING.

Then:  python3 marketing/platform/etsy-auth.py <KEYSTRING>

It opens Etsy's consent page, catches the redirect locally, and prints the
three values to save as GitHub repo secrets (Settings -> Secrets and
variables -> Actions): ETSY_API_KEY, ETSY_REFRESH_TOKEN, ETSY_SHOP_ID.
Refresh tokens last ~90 days; re-run this script if CI reports auth errors.
"""
import base64
import hashlib
import http.server
import json
import secrets
import sys
import threading
import urllib.parse
import urllib.request
import webbrowser

PORT = 8642
SCOPES = "listings_r listings_w shops_r shops_w"


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 1
    keystring = sys.argv[1]
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    state = secrets.token_hex(8)
    redirect = f"http://localhost:{PORT}/callback"
    url = "https://www.etsy.com/oauth/connect?" + urllib.parse.urlencode({
        "response_type": "code", "client_id": keystring, "redirect_uri": redirect,
        "scope": SCOPES, "state": state, "code_challenge": challenge,
        "code_challenge_method": "S256",
    })

    code_holder = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            code_holder.update({k: v[0] for k, v in q.items()})
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(b"<h1>Done - you can close this tab.</h1>")

        def log_message(self, *a):
            pass

    server = http.server.HTTPServer(("localhost", PORT), Handler)
    threading.Thread(target=server.handle_request, daemon=True).start()
    print("Opening Etsy consent page (or paste this URL in a browser):\n" + url)
    webbrowser.open(url)
    while "code" not in code_holder:
        pass
    if code_holder.get("state") != state:
        print("State mismatch — try again.")
        return 1

    req = urllib.request.Request(
        "https://api.etsy.com/v3/public/oauth/token",
        data=urllib.parse.urlencode({
            "grant_type": "authorization_code", "client_id": keystring,
            "redirect_uri": redirect, "code": code_holder["code"],
            "code_verifier": verifier,
        }).encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    tokens = json.load(urllib.request.urlopen(req))

    user_id = tokens["access_token"].split(".")[0]
    req = urllib.request.Request(
        f"https://api.etsy.com/v3/application/users/{user_id}/shops",
        headers={"x-api-key": keystring,
                 "Authorization": f"Bearer {tokens['access_token']}"})
    shop = json.load(urllib.request.urlopen(req))
    shop_id = shop.get("shop_id") or shop["results"][0]["shop_id"]

    print("\nSave these as GitHub repo secrets "
          "(Settings -> Secrets and variables -> Actions -> New repository secret):\n")
    print(f"  ETSY_API_KEY       = {keystring}")
    print(f"  ETSY_REFRESH_TOKEN = {tokens['refresh_token']}")
    print(f"  ETSY_SHOP_ID       = {shop_id}")
    print("\nOptional: add secret ETSY_PUBLISH = active to publish listings "
          "immediately instead of creating drafts.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
