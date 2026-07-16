#!/usr/bin/env python3
"""Generate 1280x720 cover images by screenshotting each theme's homepage.

Usage:
  python3 marketing/make-cover.py --missing     # covers for themes lacking one
  python3 marketing/make-cover.py slug [slug..] # regenerate specific covers

Set PW_CHROMIUM to a Chromium executable path if Playwright's own download
isn't installed (e.g. sandboxes with a pre-installed browser).
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MK = os.path.join(ROOT, "marketing")


def main():
    themes = json.load(open(os.path.join(MK, "catalog.json")))["themes"]
    args = sys.argv[1:]
    if args and args[0] == "--missing":
        slugs = [t["slug"] for t in themes if not os.path.exists(
            os.path.join(MK, "covers", f"{t['slug']}-cover.png"))]
    elif args:
        slugs = args
    else:
        print(__doc__)
        return 1
    if not slugs:
        print("covers: nothing to generate")
        return 0

    exe = os.environ.get("PW_CHROMIUM")
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=exe or None)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        for slug in slugs:
            index = os.path.join(ROOT, "themes", slug, "index.html")
            if not os.path.exists(index):
                print(f"covers: themes/{slug}/index.html missing — skipped")
                continue
            page.goto("file://" + index)
            page.wait_for_timeout(1200)  # fonts/paint settle
            out = os.path.join(MK, "covers", f"{slug}-cover.png")
            page.screenshot(path=out)
            print(f"covers: wrote {out}")
        browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
