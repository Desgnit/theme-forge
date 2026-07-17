#!/usr/bin/env python3
"""Fetch niche-related stock images into marketing/stock/<category>/.

Two sources, tried in order per category:
  1. Unsplash search (Unsplash License — free commercial use)
  2. Openverse API filtered to CC0/PDM (public domain — no attribution needed)

Runs in CI where the network is open. Every file is validated (JPEG magic,
>25 KB). Existing files are never re-downloaded. Errors are printed, not
swallowed, so failures are diagnosable from the workflow log.
"""
import json
import os
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"),
    "Accept": "application/json,text/html,image/*;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}
W = "?w=1600&q=80&auto=format&fit=crop"

CATEGORIES = {
    "fitness": ("gym training weights", 6),
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


def fetch(url, timeout=40):
    req = urllib.request.Request(url, headers=HEADERS)
    return urllib.request.urlopen(req, timeout=timeout).read()


def search_unsplash(query):
    urls = []
    try:
        u = ("https://unsplash.com/napi/search/photos?per_page=30&page=1&query="
             + urllib.parse.quote(query))
        data = json.loads(fetch(u))
        for r in data.get("results", []):
            if r.get("width", 0) >= 1400 and r.get("width", 0) > r.get("height", 0):
                raw = (r.get("urls") or {}).get("raw")
                if raw:
                    urls.append(raw.split("?")[0] + W)
    except Exception as e:
        print(f"    unsplash search failed: {type(e).__name__}: {e}")
    return urls


def search_openverse(query):
    urls = []
    try:
        u = ("https://api.openverse.org/v1/images/?license=cc0,pdm&page_size=30"
             "&aspect_ratio=wide&size=large&q=" + urllib.parse.quote(query))
        data = json.loads(fetch(u))
        for r in data.get("results", []):
            url = r.get("url")
            if url and (r.get("width") or 0) >= 1200:
                urls.append(url)
    except Exception as e:
        print(f"    openverse search failed: {type(e).__name__}: {e}")
    return urls


def main():
    manifest = {}
    for cat, (query, want) in CATEGORIES.items():
        outdir = os.path.join(HERE, cat)
        os.makedirs(outdir, exist_ok=True)
        kept = sorted(f for f in os.listdir(outdir) if f.endswith(".jpg"))
        if len(kept) >= want:
            manifest[cat] = kept
            print(f"{cat}: {len(kept)} already present")
            continue
        print(f"{cat}: searching '{query}'")
        candidates = search_unsplash(query)
        source = "unsplash"
        if not candidates:
            candidates = search_openverse(query)
            source = "openverse-cc0"
        for url in candidates:
            if len(kept) >= want:
                break
            name = f"{cat}-{len(kept) + 1}.jpg"
            dest = os.path.join(outdir, name)
            try:
                data = fetch(url)
                if data[:3] == b"\xff\xd8\xff" and len(data) > 25_000:
                    open(dest, "wb").write(data)
                    kept.append(name)
                else:
                    print(f"    rejected (not jpeg/too small): {url[:80]}")
            except Exception as e:
                print(f"    download failed ({type(e).__name__}): {url[:80]}")
            time.sleep(0.4)
        manifest[cat] = sorted(kept)
        print(f"{cat}: {len(kept)}/{want} via {source}")
    json.dump(manifest, open(os.path.join(HERE, "manifest.json"), "w"), indent=2)
    print("total images:", sum(len(v) for v in manifest.values()))
    return 0


if __name__ == "__main__":
    main()
