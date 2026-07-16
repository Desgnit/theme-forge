#!/usr/bin/env python3
"""RPA listers for marketplaces without listing APIs.

One generic engine: it reads whatever listing form the site shows, matches
each field by its label/placeholder/name (title, price, description, tags,
demo URL, image/file uploads), auto-fills everything from
marketing/catalog.json, advances through multi-step forms, and publishes.
Adding a marketplace = adding one SITES entry.

Usage:  python3 marketing/platform/sync-browser.py <site>
Sites:  gumroad creativemarket themeforest payhip codester wrapbootstrap
        templatemonster creativefabrica

Auth: <SITE>_SESSION env var (captured by setup-wizard.py). Without it the
script says what it would do and exits 0, keeping CI green.
State: marketing/platform/<site>-listings.json (idempotent re-runs).
Diagnostics: every step screenshots to marketing/platform/shots/ (uploaded
as a CI artifact) so selector drift after a site redesign is quick to fix.

Honest notes: automation may sit against some sites' terms — your account,
your call. ThemeForest/TemplateMonster listings still pass human review;
the robot submits, people approve.
"""
import base64
import json
import os
import re
import sys
import traceback

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MK = os.path.join(ROOT, "marketing")
SHOTS = os.path.join(MK, "platform", "shots")
DEMO = "https://desgnit.github.io/theme-forge"
LOGIN_MARKERS = ("login", "sign_in", "sign-in", "signin", "sso", "auth")

SITES = {
    "gumroad": {
        "new": "https://app.gumroad.com/products/new",
        "choose": ["Digital product"],
        "secret": "GUMROAD_SESSION",
    },
    "creativemarket": {
        "new": "https://creativemarket.com/studio/products/new",
        "secret": "CREATIVEMARKET_SESSION",
    },
    "themeforest": {
        "new": "https://themeforest.net/item/upload",
        "secret": "THEMEFOREST_SESSION",
        "flagships_only": True,  # Envato rejects near-duplicate items
    },
    "payhip": {
        "new": "https://payhip.com/product/add/digital",
        "secret": "PAYHIP_SESSION",
    },
    "codester": {
        "new": "https://www.codester.com/upload",
        "secret": "CODESTER_SESSION",
    },
    "wrapbootstrap": {
        "new": "https://wrapbootstrap.com/user/items/new",
        "secret": "WRAPBOOTSTRAP_SESSION",
    },
    "templatemonster": {
        "new": "https://account.templatemonster.com/products/new",
        "secret": "TEMPLATEMONSTER_SESSION",
        "flagships_only": True,  # reviewed marketplace — same duplicate risk
    },
    "creativefabrica": {
        "new": "https://studio.creativefabrica.com/products/create",
        "secret": "CREATIVEFABRICA_SESSION",
    },
}

FIELD_KEYWORDS = {
    "title": ("product name", "item name", "title", "name"),
    "price": ("price", "amount", "cost"),
    "description": ("description", "about", "summary", "overview", "details"),
    "tags": ("tags", "keywords"),
    "demo": ("demo", "live preview", "preview url", "website url"),
}
ADVANCE_BUTTONS = ("next", "continue", "save and continue", "customize")
PUBLISH_BUTTONS = ("publish and continue", "publish", "submit for review",
                   "upload item", "submit", "save draft", "save product", "save")


class SessionExpired(Exception):
    pass


def shot(page, site, slug, step):
    os.makedirs(SHOTS, exist_ok=True)
    try:
        page.screenshot(path=os.path.join(SHOTS, f"{site}-{slug}-{step}.png"))
    except Exception:
        pass


def check_logged_in(page, site):
    if any(m in page.url.lower() for m in LOGIN_MARKERS):
        raise SessionExpired(
            f"{site} session has expired — re-run setup-wizard.py {site} "
            f"(the {SITES[site]['secret']} secret needs refreshing).")


def describe_fields(page):
    """Return metadata for every fillable element on the page."""
    return page.evaluate("""() => {
      const els = [...document.querySelectorAll('input, textarea, [contenteditable="true"]')];
      return els.map((e, i) => {
        let label = '';
        if (e.labels && e.labels.length) label = [...e.labels].map(l => l.innerText).join(' ');
        if (!label && e.closest('label')) label = e.closest('label').innerText;
        const text = [label, e.placeholder || '', e.name || '', e.id || '',
                      e.getAttribute('aria-label') || ''].join(' ').toLowerCase();
        const style = window.getComputedStyle(e);
        return {
          i, text,
          tag: e.tagName.toLowerCase(),
          type: (e.type || '').toLowerCase(),
          accept: (e.accept || '').toLowerCase(),
          editable: e.hasAttribute('contenteditable'),
          visible: style.display !== 'none' && style.visibility !== 'hidden'
                   && e.offsetParent !== null,
          filled: !!(e.value || (e.innerText || '').trim()),
        };
      });
    }""")


def pick_upload(desc, paths):
    """Choose which asset a file input wants, from its wording/accept."""
    t = desc["text"]
    if "thumbnail" in t and os.path.exists(paths["tf_thumb"]):
        return paths["tf_thumb"]
    if "preview" in t and "image" in desc["accept"] and os.path.exists(paths["tf_preview"]):
        return paths["tf_preview"]
    if "image" in desc["accept"] or any(w in t for w in ("image", "cover", "photo", "thumbnail", "screenshot")):
        return paths["cover"]
    return paths["zip"]


def autofill(page, values, paths):
    """Fill every recognisable field on the current page. Returns what was
    filled, e.g. {"title": 0, "price": 3, "file:...zip": 7} (field -> element
    index) — used by the tests."""
    filled = {}
    used = set()
    all_els = page.locator('input, textarea, [contenteditable="true"]')
    descs = describe_fields(page)

    for field in ("title", "price", "description", "tags", "demo"):
        if field not in values:
            continue
        best = None
        for d in descs:
            if d["i"] in used or d["type"] in ("file", "checkbox", "radio", "hidden",
                                               "submit", "button") or not d["visible"]:
                continue
            if any(k in d["text"] for k in FIELD_KEYWORDS[field]):
                # prefer textareas/contenteditable for description
                score = len([k for k in FIELD_KEYWORDS[field] if k in d["text"]])
                if field == "description" and (d["tag"] == "textarea" or d["editable"]):
                    score += 2
                if best is None or score > best[0]:
                    best = (score, d)
        if best:
            d = best[1]
            try:
                all_els.nth(d["i"]).fill(str(values[field]), timeout=5000)
                used.add(d["i"])
                filled[field] = d["i"]
            except Exception:
                pass

    for d in descs:
        if d["type"] == "file" and d["i"] not in used:
            path = pick_upload(d, paths)
            if path and os.path.exists(path):
                try:
                    all_els.nth(d["i"]).set_input_files(path, timeout=5000)
                    used.add(d["i"])
                    filled[f"file:{os.path.basename(path)}"] = d["i"]
                except Exception:
                    pass
    return filled


def click_first(page, names, timeout=4000):
    for name in names:
        try:
            btn = page.get_by_role("button", name=re.compile(f"^{re.escape(name)}$", re.I))
            btn.first.click(timeout=timeout)
            return name
        except Exception:
            continue
    return None


def list_theme(page, site, t, paths):
    cfg = SITES[site]
    slug = t["slug"]
    values = {
        "title": t["title"],
        "price": t["price_gbp"],
        "description": t["oneliner"] + "\n\n" + t["description"]
                       + f"\n\nLive demo: {DEMO}/{slug}/",
        "tags": ", ".join(t["tags"][:13]),
        "demo": f"{DEMO}/{slug}/",
    }
    page.goto(cfg["new"], wait_until="domcontentloaded")
    check_logged_in(page, site)
    shot(page, site, slug, "1-new")

    for choice in cfg.get("choose", []):
        try:
            page.get_by_text(choice, exact=True).first.click(timeout=4000)
        except Exception:
            pass

    # up to 4 form pages: fill -> advance; stop when a publish button works
    for step in range(1, 5):
        autofill(page, values, paths)
        page.wait_for_timeout(2500)  # let uploads start
        shot(page, site, slug, f"{step + 1}-filled")
        if click_first(page, PUBLISH_BUTTONS, timeout=6000):
            break
        if not click_first(page, ADVANCE_BUTTONS):
            break
        page.wait_for_load_state("domcontentloaded")
    page.wait_for_timeout(4000)
    shot(page, site, slug, "final")
    return page.url


def theme_paths(slug):
    a = os.path.join(MK, "marketplaces", "assets")
    return {
        "zip": os.path.join(MK, "dist", f"{slug}-theme-v1.0.0.zip"),
        "cover": os.path.join(MK, "covers", f"{slug}-cover.png"),
        "tf_thumb": os.path.join(a, "themeforest", f"{slug}-thumbnail-80x80.png"),
        "tf_preview": os.path.join(a, "themeforest", f"{slug}-preview-590x300.png"),
    }


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in SITES:
        print(__doc__)
        return 1
    site = sys.argv[1]
    cfg = SITES[site]
    themes = json.load(open(os.path.join(MK, "catalog.json")))["themes"]
    if cfg.get("flagships_only"):
        themes = [t for t in themes if t["slug"] in ("forgeline", "terrace", "sideline")]

    blob = os.environ.get(cfg["secret"], "")
    if not blob:
        print(f"{site}: no {cfg['secret']} secret — would list {len(themes)} themes. "
              "Run setup-wizard.py to connect. Skipping.")
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
                url = list_theme(page, site, t, theme_paths(t["slug"]))
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
                print(f"{site}: FAILED on {t['slug']} — screenshots saved for diagnosis")
                traceback.print_exc()
                shot(page, site, t["slug"], "FAILED")
        browser.close()

    print(f"{site}: {len(todo) - failures} listed, {failures} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
