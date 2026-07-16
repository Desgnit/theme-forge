#!/usr/bin/env python3
"""Catalog + pipeline integrity checks. Fails the build early if a theme is
added incompletely (missing folder, cover, bad price, over-long titles).

Run:  python3 tests/test_catalog.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    errors = []
    cat = json.load(open(os.path.join(ROOT, "marketing", "catalog.json")))
    themes = cat["themes"]

    slugs = [t["slug"] for t in themes]
    if len(set(slugs)) != len(slugs):
        errors.append("duplicate slugs in catalog")
    if len(themes) < 17:
        errors.append(f"catalog shrank to {len(themes)} themes")

    for t in themes:
        s = t["slug"]
        for field in ("title", "price_gbp", "oneliner", "description", "family", "tags"):
            if not t.get(field):
                errors.append(f"{s}: missing {field}")
        if not os.path.isdir(os.path.join(ROOT, "themes", s)):
            errors.append(f"{s}: themes/{s}/ folder missing")
        if not os.path.isfile(os.path.join(ROOT, "themes", s, "index.html")):
            errors.append(f"{s}: themes/{s}/index.html missing")
        if not os.path.isfile(os.path.join(ROOT, "marketing", "covers", f"{s}-cover.png")):
            errors.append(f"{s}: cover image missing")
        if not isinstance(t.get("price_gbp"), (int, float)) or not 1 <= t["price_gbp"] <= 500:
            errors.append(f"{s}: implausible price {t.get('price_gbp')}")
        if len(t.get("title", "")) > 120:  # leaves room for Etsy's suffix within 140
            errors.append(f"{s}: title too long ({len(t['title'])} chars)")
        if t.get("family") not in ("industrial", "trades", "football"):
            errors.append(f"{s}: unknown family {t.get('family')}")

    # every catalogued theme must be in the demo hub
    hub = open(os.path.join(ROOT, "marketing", "demo-hub-index.html")).read()
    for t in themes:
        if f'href="{t["slug"]}/index.html"' not in hub:
            errors.append(f"{t['slug']}: missing from demo hub page")

    if errors:
        print("CATALOG ERRORS:")
        for e in errors:
            print("  -", e)
        return 1
    print(f"catalog: {len(themes)} themes, all complete and consistent")
    return 0


if __name__ == "__main__":
    sys.exit(main())
