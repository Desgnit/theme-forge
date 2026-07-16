#!/usr/bin/env python3
"""RPA listers for marketplaces that have no listing API (Gumroad,
Creative Market, ThemeForest). Drives the seller dashboard in a headless
browser using a session captured with capture-session.py.

Usage:  python3 marketing/platform/sync-browser.py <gumroad|creativemarket|themeforest>

Auth comes from the <SITE>_SESSION env var (base64 storage-state). Without
it the script prints what it would do and exits 0, so CI stays green until
the account is connected.

Listing state is tracked in marketing/platform/<site>-listings.json so
re-runs only create what's missing. Every step screenshots into
marketing/platform/shots/ — CI uploads them as an artifact, which is how
selector breakage gets diagnosed and fixed after marketplace UI changes.

Honest notes:
- This automates YOUR account doing YOUR listings — but check each site's
  terms on automation; you run it at your own risk.
- ThemeForest submissions still go through Envato's human review; this
  uploads and submits, it cannot approve.
"""
import base64
import json
import os
import sys
import traceback

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MK = os.path.join(ROOT, "marketing")
SHOTS = os.path.join(MK, "platform", "shots")
DEMO = "https://desgnit.github.io/theme-forge"

SITES = {
    "gumroad": {"secret": "GUMROAD_SESSION", "login_marker": "gumroad.com/login"},
    "creativemarket": {"secret": "CREATIVEMARKET_SESSION", "login_marker": "sign-in"},
    "themeforest": {"secret": "THEMEFOREST_SESSION", "login_marker": "sign_in"},
}


class SessionExpired(Exception):
    pass


def shot(page, site, slug, step):
    os.makedirs(SHOTS, exist_ok=True)
    try:
        page.screenshot(path=os.path.join(SHOTS, f"{site}-{slug}-{step}.png"), full_page=False)
    except Exception:
        pass


def first_visible(page, locators, timeout=8000):
    """Try several locator strategies; return the first that appears."""
    last = None
    for loc in locators:
        try:
            loc.first.wait_for(state="visible", timeout=timeout)
            return loc.first
        except Exception as e:
            last = e
    raise last


def check_logged_in(page, site):
    if SITES[site]["login_marker"] in page.url:
        raise SessionExpired(
            f"{site} session has expired — re-run capture-session.py and update "
            f"the {SITES[site]['secret']} secret.")


# ---------------------------------------------------------------- Gumroad

def gumroad_create(page, t, paths):
    slug, title = t["slug"], t["title"]
    page.goto("https://app.gumroad.com/products/new", wait_until="domcontentloaded")
    check_logged_in(page, "gumroad")
    shot(page, "gumroad", slug, "1-new")

    first_visible(page, [page.get_by_label("Name"),
                         page.get_by_placeholder("Name of product")]).fill(title)
    first_visible(page, [page.get_by_text("Digital product", exact=True),
                         page.get_by_role("radio", name="Digital product")]).click()
    first_visible(page, [page.get_by_label("Price"),
                         page.get_by_placeholder("Price your product"),
                         page.locator('input[type="text"][inputmode="decimal"]')]).fill(str(t["price_gbp"]))
    shot(page, "gumroad", slug, "2-filled")
    first_visible(page, [page.get_by_role("button", name="Next: Customize"),
                         page.get_by_role("button", name="Customize")]).click()
    page.wait_for_load_state("domcontentloaded")
    shot(page, "gumroad", slug, "3-customize")

    desc = t["oneliner"] + "\n\n" + t["description"] + f"\n\nLive demo: {DEMO}/{slug}/"
    first_visible(page, [page.get_by_role("textbox", name="Description"),
                         page.locator('[contenteditable="true"]')]).fill(desc)
    cover_input = page.locator('input[type="file"]').first
    cover_input.set_input_files(paths["cover"])
    page.wait_for_timeout(3000)
    shot(page, "gumroad", slug, "4-described")

    first_visible(page, [page.get_by_role("button", name="Save and continue"),
                         page.get_by_role("button", name="Next: Content"),
                         page.get_by_role("button", name="Save changes")]).click()
    page.wait_for_load_state("domcontentloaded")

    # Content tab: attach the product zip
    try:
        first_visible(page, [page.get_by_role("tab", name="Content"),
                             page.get_by_role("link", name="Content")], timeout=4000).click()
    except Exception:
        pass
    zip_input = page.locator('input[type="file"]').last
    zip_input.set_input_files(paths["zip"])
    page.wait_for_timeout(8000)  # upload
    shot(page, "gumroad", slug, "5-content")

    first_visible(page, [page.get_by_role("button", name="Publish and continue"),
                         page.get_by_role("button", name="Publish")]).click()
    page.wait_for_load_state("domcontentloaded")
    shot(page, "gumroad", slug, "6-published")
    return page.url


# --------------------------------------------------------- Creative Market

def creativemarket_create(page, t, paths):
    slug = t["slug"]
    page.goto("https://creativemarket.com/studio/products/new", wait_until="domcontentloaded")
    check_logged_in(page, "creativemarket")
    shot(page, "creativemarket", slug, "1-new")

    first_visible(page, [page.get_by_label("Product name"),
                         page.get_by_label("Name"),
                         page.get_by_placeholder("Product name")]).fill(t["title"])
    desc = t["oneliner"] + "\n\n" + t["description"] + f"\n\nLive preview: {DEMO}/{slug}/"
    first_visible(page, [page.get_by_label("Description"),
                         page.locator("textarea"),
                         page.locator('[contenteditable="true"]')]).fill(desc)
    page.locator('input[type="file"]').first.set_input_files([paths["cover"], paths["zip"]])
    page.wait_for_timeout(10000)
    shot(page, "creativemarket", slug, "2-filled")

    first_visible(page, [page.get_by_role("button", name="Save draft"),
                         page.get_by_role("button", name="Save"),
                         page.get_by_role("button", name="Submit")]).click()
    page.wait_for_load_state("domcontentloaded")
    shot(page, "creativemarket", slug, "3-saved")
    return page.url


# ------------------------------------------------------------- ThemeForest

def themeforest_create(page, t, paths):
    slug = t["slug"]
    page.goto("https://themeforest.net/item/upload", wait_until="domcontentloaded")
    check_logged_in(page, "themeforest")
    shot(page, "themeforest", slug, "1-upload")

    first_visible(page, [page.get_by_label("Name"),
                         page.get_by_label("Item name"),
                         page.get_by_placeholder("Name")]).fill(t["title"])
    desc = t["oneliner"] + "\n\n" + t["description"] + f"\n\nLive preview: {DEMO}/{slug}/"
    first_visible(page, [page.get_by_label("Description"),
                         page.locator("textarea"),
                         page.locator('[contenteditable="true"]')]).fill(desc)
    inputs = page.locator('input[type="file"]')
    inputs.nth(0).set_input_files(paths["tf_thumb"])
    inputs.nth(1).set_input_files(paths["tf_preview"])
    inputs.nth(2).set_input_files(paths["zip"])
    page.wait_for_timeout(10000)
    shot(page, "themeforest", slug, "2-filled")

    first_visible(page, [page.get_by_role("button", name="Upload item"),
                         page.get_by_role("button", name="Submit for review"),
                         page.get_by_role("button", name="Save")]).click()
    page.wait_for_load_state("domcontentloaded")
    shot(page, "themeforest", slug, "3-submitted")
    return page.url


ADAPTERS = {
    "gumroad": gumroad_create,
    "creativemarket": creativemarket_create,
    "themeforest": themeforest_create,
}


def theme_paths(slug):
    a = os.path.join(MK, "marketplaces", "assets")
    return {
        "zip": os.path.join(MK, "dist", f"{slug}-theme-v1.0.0.zip"),
        "cover": os.path.join(MK, "covers", f"{slug}-cover.png"),
        "tf_thumb": os.path.join(a, "themeforest", f"{slug}-thumbnail-80x80.png"),
        "tf_preview": os.path.join(a, "themeforest", f"{slug}-preview-590x300.png"),
    }


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ADAPTERS:
        print(__doc__)
        return 1
    site = sys.argv[1]
    themes = json.load(open(os.path.join(MK, "catalog.json")))["themes"]
    if site == "themeforest":
        # Envato rejects near-duplicate items: flagship items only (see
        # marketing/marketplaces/themeforest/README.md).
        themes = [t for t in themes if t["slug"] in ("forgeline", "terrace", "sideline")]

    blob = os.environ.get(SITES[site]["secret"], "")
    if not blob:
        print(f"{site}: no {SITES[site]['secret']} secret — would list "
              f"{len(themes)} themes. Run capture-session.py to connect. Skipping.")
        return 0

    state_path = os.path.join(MK, "platform", f"{site}-listings.json")
    state = json.load(open(state_path)) if os.path.exists(state_path) else {}
    todo = [t for t in themes if t["slug"] not in state]
    if not todo:
        print(f"{site}: all {len(themes)} themes already listed.")
        return 0

    failures = 0
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(storage_state=json.loads(base64.b64decode(blob)))
        page = ctx.new_page()
        for t in todo:
            try:
                url = ADAPTERS[site](page, t, theme_paths(t["slug"]))
                state[t["slug"]] = {"url": url}
                json.dump(state, open(state_path, "w"), indent=2)
                print(f"{site}: listed {t['slug']} -> {url}")
            except SessionExpired as e:
                print(f"ERROR: {e}")
                with open(os.path.join(MK, "platform", "needs-reauth.txt"), "a") as f:
                    f.write(site + "\n")
                browser.close()
                return 1
            except Exception:
                failures += 1
                print(f"{site}: FAILED on {t['slug']} — screenshot saved for diagnosis")
                traceback.print_exc()
                shot(page, site, t["slug"], "FAILED")
        browser.close()

    print(f"{site}: {len(todo) - failures} listed, {failures} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
