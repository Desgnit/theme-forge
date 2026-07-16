#!/usr/bin/env python3
"""Sync the theme catalogue to Etsy listings — the auto-lister.

Reads marketing/catalog.json and creates/updates one Etsy digital-download
listing per theme: title, description, price, 13 tags, cover images and the
product zip itself. Idempotent: listing ids are tracked in
marketing/platform/etsy-listings.json, so re-runs update instead of duplicate.

Requires environment variables (in CI these come from repo secrets):
  ETSY_API_KEY        keystring of your Etsy app
  ETSY_REFRESH_TOKEN  from marketing/platform/etsy-auth.py (one-time)
  ETSY_SHOP_ID        numeric shop id (shown by etsy-auth.py)
Optional:
  ETSY_PUBLISH=active   publish immediately (default: draft, so you can
                        review the first batch; Etsy charges $0.20/listing
                        when a listing goes active)
  ETSY_TAXONOMY_ID      override category detection

Without credentials the script prints what it would do and exits 0, so the
CI pipeline stays green until the shop is connected.
"""
import json
import os
import sys

import requests

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MK = os.path.join(ROOT, "marketing")
STATE_PATH = os.path.join(MK, "platform", "etsy-listings.json")
STORE_LINKS = os.path.join(MK, "store-links.json")
API = "https://api.etsy.com/v3/application"
DESC_FOOTER = (
    "\n\nINSTANT DIGITAL DOWNLOAD — no physical item will be shipped.\n\n"
    "WHAT YOU RECEIVE\n"
    "- One zip containing the complete website template (HTML + compiled "
    "Tailwind CSS, all images, README)\n"
    "- Open index.html in any browser — no build tools, no subscriptions\n"
    "- One licence = one club/site\n\n"
    "Try the live demo first: {demo}\n\n"
    "Questions? Message me and I'll help you get set up."
)


def etsy_tags(theme):
    tags = []
    for t in theme["tags"] + ["digital download", "website template"]:
        while len(t) > 20:
            t = t.rsplit(" ", 1)[0]
        if t and t not in tags:
            tags.append(t)
    return tags[:13]


class Etsy:
    def __init__(self, api_key, refresh_token):
        self.api_key = api_key
        r = requests.post("https://api.etsy.com/v3/public/oauth/token", data={
            "grant_type": "refresh_token",
            "client_id": api_key,
            "refresh_token": refresh_token,
        }, timeout=30)
        if r.status_code >= 400:
            with open(os.path.join(MK, "platform", "needs-reauth.txt"), "a") as f:
                f.write("etsy\n")
            raise SystemExit(
                f"Etsy token refresh failed ({r.status_code}) — the refresh token has "
                "likely expired. Re-run setup-wizard.py (or etsy-auth.py) and update "
                "the ETSY_REFRESH_TOKEN secret.")
        self.token = r.json()["access_token"]

    def call(self, method, path, expect_ok=True, **kw):
        headers = kw.pop("headers", {})
        headers.update({"x-api-key": self.api_key, "Authorization": f"Bearer {self.token}"})
        r = requests.request(method, f"{API}{path}", headers=headers, timeout=120, **kw)
        if expect_ok and r.status_code >= 300:
            raise RuntimeError(f"{method} {path} -> {r.status_code}: {r.text[:400]}")
        return r

    def taxonomy_id(self):
        override = os.environ.get("ETSY_TAXONOMY_ID")
        if override:
            return int(override)
        nodes = self.call("GET", "/seller-taxonomy/nodes").json()["results"]

        def walk(ns):
            for n in ns:
                yield n
                yield from walk(n.get("children", []))

        flat = list(walk(nodes))
        for want in ("website template", "web template", "templates"):
            for n in flat:
                if want in n["name"].lower():
                    return n["id"]
        return flat[0]["id"]  # last resort; override with ETSY_TAXONOMY_ID


def main():
    catalog = json.load(open(os.path.join(MK, "catalog.json")))["themes"]
    api_key = os.environ.get("ETSY_API_KEY", "")
    refresh = os.environ.get("ETSY_REFRESH_TOKEN", "")
    shop_id = os.environ.get("ETSY_SHOP_ID", "")

    if not (api_key and refresh and shop_id):
        print(f"Etsy credentials not configured — would sync {len(catalog)} listings. "
              "Set ETSY_API_KEY / ETSY_REFRESH_TOKEN / ETSY_SHOP_ID repo secrets to enable "
              "(see marketing/platform/README.md). Skipping.")
        return 0

    etsy = Etsy(api_key, refresh)
    state = json.load(open(STATE_PATH)) if os.path.exists(STATE_PATH) else {}
    taxonomy = etsy.taxonomy_id()
    publish_state = os.environ.get("ETSY_PUBLISH", "draft")
    changed = False

    for t in catalog:
        slug = t["slug"]
        title = f"{t['title']} — HTML + Tailwind, Instant Digital Download"[:140]
        desc = (t["oneliner"] + "\n\n" + t.get("description", "") + DESC_FOOTER.format(
            demo=f"https://desgnit.github.io/theme-forge/{slug}/"))
        body = {
            "quantity": 999,
            "title": title,
            "description": desc,
            "price": float(t["price_gbp"]),
            "who_made": "i_did",
            "when_made": "2020_2026",
            "taxonomy_id": taxonomy,
            "type": "download",
            "tags": ",".join(etsy_tags(t)),
        }
        entry = state.get(slug, {})
        listing_id = entry.get("listing_id")

        if listing_id:
            r = etsy.call("PATCH", f"/shops/{shop_id}/listings/{listing_id}",
                          expect_ok=False, data=body)
            if r.status_code == 404:
                listing_id = None  # deleted on Etsy — recreate below
            elif r.status_code >= 300:
                raise RuntimeError(f"update {slug}: {r.status_code} {r.text[:300]}")
            else:
                print(f"updated  {slug} -> listing {listing_id}")

        if not listing_id:
            body["state"] = "draft"
            r = etsy.call("POST", f"/shops/{shop_id}/listings", data=body)
            listing = r.json()
            listing_id = listing["listing_id"]
            print(f"created  {slug} -> listing {listing_id}")

            for img in (os.path.join(MK, "marketplaces", "assets", "etsy", f"{slug}-main.png"),
                        os.path.join(MK, "covers", f"{slug}-cover.png")):
                if os.path.exists(img):
                    with open(img, "rb") as f:
                        etsy.call("POST", f"/shops/{shop_id}/listings/{listing_id}/images",
                                  files={"image": (os.path.basename(img), f, "image/png")})

            zip_path = os.path.join(MK, "dist", f"{slug}-theme-v1.0.0.zip")
            if not os.path.exists(zip_path):
                raise RuntimeError(f"{zip_path} missing — run marketing/package-zips.sh first")
            with open(zip_path, "rb") as f:
                etsy.call("POST", f"/shops/{shop_id}/listings/{listing_id}/files",
                          files={"file": (f"{slug}-theme.zip", f, "application/zip")},
                          data={"name": f"{slug}-theme.zip"})

            if publish_state == "active":
                etsy.call("PATCH", f"/shops/{shop_id}/listings/{listing_id}",
                          data={"state": "active"})
                print(f"published {slug}")

        url = f"https://www.etsy.com/listing/{listing_id}"
        if state.get(slug) != {"listing_id": listing_id, "url": url}:
            state[slug] = {"listing_id": listing_id, "url": url}
            changed = True

    if changed:
        json.dump(state, open(STATE_PATH, "w"), indent=2)
        json.dump({s: {"payment_link_url": v["url"]} for s, v in state.items()},
                  open(STORE_LINKS, "w"), indent=2)
        print(f"state written: {STATE_PATH}")
    print(f"done: {len(catalog)} themes synced")
    return 0


if __name__ == "__main__":
    sys.exit(main())
