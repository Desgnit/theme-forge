#!/usr/bin/env python3
"""Fetch niche-related stock images (Unsplash — free for commercial use
under the Unsplash License) into marketing/stock/<category>/.

Runs in CI where the network is open. For each category it SEARCHES Unsplash
for the subject and takes the top landscape results, so images actually match
the niche instead of relying on hand-picked photo ids. Every file is
validated (JPEG magic, >25 KB) before being kept. Existing files are never
re-downloaded, so re-runs only fill gaps.
"""
import json
import os
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "Mozilla/5.0 (theme-forge-fetch)"}
W = "?w=1600&q=80&auto=format&fit=crop"

# category folder -> (search query, how many to keep)
CATEGORIES = {
    "fitness": ("gym training weights", 6),  # top-ups for the existing set
    "electrician": ("electrician working", 5),
    "plumber": ("plumber pipes work", 5),
    "builder": ("construction builder site house", 5),
    "landscaping": ("landscaping garden lawn work", 5),
    "roofing": ("roofer roof tiles work", 5),
    "skip-waste": ("skip container waste construction", 4),
    "scaffolding": ("scaffolding building construction", 5),
    "industrial": ("industrial warehouse lighting factory", 6),
    "football": ("football stadium floodlights grass", 6),
    "grassroots-football": ("amateur football match sunday league", 5),
    "youth-football": ("kids football training", 4),
    "cricket": ("cricket match batsman village", 6),
    "rugby": ("rugby match tackle", 5),
    "bowls": ("lawn bowls green bowling", 4),
    "window-cleaning": ("window cleaner squeegee glass", 4),
    "removals": ("moving boxes van removal", 5),
    "detailing": ("car detailing polish wash", 5),
    "dog-grooming": ("dog grooming bath", 5),
    "farm-shop": ("farm shop fresh produce market", 6),
    "butchery": ("butcher meat counter", 3),
    "campsite": ("campsite tent caravan morning", 6),
    "driving": ("learner driver car lesson", 4),
    "funeral": ("white lilies flowers candle calm", 5),
    "village-hall": ("village hall community event", 4),
    "fishing": ("carp fishing lake dawn angler", 6),
}


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout).read()


def search(query, pages=1):
    """Unsplash search; returns list of raw image URLs, landscape first."""
    results = []
    for page in range(1, pages + 1):
        u = ("https://unsplash.com/napi/search/photos?per_page=20&page="
             f"{page}&query=" + urllib.parse.quote(query))
        try:
            data = json.loads(fetch(u))
        except Exception:
            break
        for r in data.get("results", []):
            if r.get("width", 0) >= 1400 and r.get("width", 0) > r.get("height", 0):
                raw = (r.get("urls") or {}).get("raw")
                if raw:
                    results.append(raw.split("?")[0])
    return results


def main():
    manifest = {}
    for cat, (query, want) in CATEGORIES.items():
        outdir = os.path.join(HERE, cat)
        os.makedirs(outdir, exist_ok=True)
        have = sorted(f for f in os.listdir(outdir) if f.endswith(".jpg"))
        if len(have) >= want:
            manifest[cat] = have
            print(f"{cat}: {len(have)} already present")
            continue
        kept = list(have)
        for url in search(query, pages=2):
            if len(kept) >= want:
                break
            name = f"{cat}-{len(kept) + 1}.jpg"
            dest = os.path.join(outdir, name)
            if os.path.exists(dest):
                kept.append(name)
                continue
            try:
                data = fetch(url + W, timeout=40)
                if data[:3] == b"\xff\xd8\xff" and len(data) > 25_000:
                    open(dest, "wb").write(data)
                    kept.append(name)
            except Exception:
                continue
            time.sleep(0.4)
        manifest[cat] = sorted(kept)
        print(f"{cat}: {len(kept)}/{want}")
    json.dump(manifest, open(os.path.join(HERE, "manifest.json"), "w"), indent=2)
    total = sum(len(v) for v in manifest.values())
    print(f"total images: {total}")
    return 0


if __name__ == "__main__":
    main()
