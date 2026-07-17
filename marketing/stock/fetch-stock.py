#!/usr/bin/env python3
"""Fetch niche-related stock images into marketing/stock/<category>/.

Primary source: Wikimedia Commons (keyless, bot-friendly). Only images with
permissive licenses are kept — CC0 / Public domain preferred, then CC BY,
then CC BY-SA — and every kept image's author/license/source is recorded in
credits.json so attribution can ship with the products.

Fallback: Openverse filtered to CC0/PDM (rate-limited; best effort).

Runs in CI. Files are validated (JPEG magic, >25 KB); existing files are
never re-downloaded; errors are printed loudly.
"""
import json
import os
import re
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "theme-forge-stock-fetch/1.0 (https://github.com/Desgnit/theme-forge)"}

CATEGORIES = {
    "fitness": ("gym training weights", 6),
    "electrician": ("electrician working wiring", 5),
    "plumber": ("plumber pipes work", 5),
    "builder": ("construction site bricklayer house building", 5),
    "landscaping": ("gardening landscaping lawn", 5),
    "roofing": ("roofer roof tiles work", 5),
    "skip-waste": ("skip waste container", 4),
    "scaffolding": ("scaffolding building", 5),
    "industrial": ("warehouse industrial interior", 6),
    "football": ("football stadium floodlights", 6),
    "grassroots-football": ("amateur football match", 5),
    "youth-football": ("youth football training children", 4),
    "cricket": ("village cricket match batsman", 6),
    "rugby": ("rugby league match tackle", 5),
    "bowls": ("lawn bowls bowling green", 4),
    "window-cleaning": ("window cleaner washing", 4),
    "removals": ("removal van moving boxes", 5),
    "detailing": ("car wash polishing detailing", 5),
    "dog-grooming": ("dog grooming", 5),
    "farm-shop": ("farm shop vegetables market stall", 6),
    "butchery": ("butcher shop meat", 3),
    "campsite": ("campsite tents caravan", 6),
    "driving": ("driving school learner car", 4),
    "funeral": ("white lilies bouquet candles", 5),
    "village-hall": ("village hall england", 4),
    "fishing": ("angler fishing lake", 6),
}

LICENSE_RANK = [
    (re.compile(r"cc0|public domain|pdm", re.I), 0),
    (re.compile(r"^cc by(?!-)|cc-by(?!-sa)", re.I), 1),
    (re.compile(r"by-sa", re.I), 2),
]


def fetch(url, timeout=40):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout).read()


def license_rank(name):
    for rx, rank in LICENSE_RANK:
        if rx.search(name or ""):
            return rank
    return None  # not permissive enough — skip


def search_commons(query):
    """Wikimedia Commons search -> [(rank, thumb_url, credit_dict)]."""
    out = []
    u = ("https://commons.wikimedia.org/w/api.php?action=query&format=json"
         "&generator=search&gsrnamespace=6&gsrlimit=40"
         "&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=1600"
         "&gsrsearch=" + urllib.parse.quote(f"filetype:bitmap {query}"))
    try:
        data = json.loads(fetch(u))
    except Exception as e:
        print(f"    commons search failed: {type(e).__name__}: {e}")
        return out
    for page in (data.get("query", {}).get("pages", {}) or {}).values():
        info = (page.get("imageinfo") or [{}])[0]
        if not info or (info.get("width") or 0) < 1200:
            continue
        if (info.get("width") or 0) <= (info.get("height") or 0):
            continue  # landscape only
        if not (info.get("url", "").lower().endswith((".jpg", ".jpeg"))):
            continue
        meta = info.get("extmetadata") or {}
        lic = (meta.get("LicenseShortName") or {}).get("value", "")
        rank = license_rank(lic)
        if rank is None:
            continue
        artist = re.sub(r"<[^>]+>", "", (meta.get("Artist") or {}).get("value", "")).strip()
        out.append((rank, info.get("thumburl") or info["url"], {
            "title": page.get("title", ""),
            "author": artist[:120],
            "license": lic,
            "source": info.get("descriptionurl", ""),
        }))
    out.sort(key=lambda x: x[0])
    return out


def search_openverse(query):
    out = []
    try:
        u = ("https://api.openverse.org/v1/images/?license=cc0,pdm&page_size=30"
             "&aspect_ratio=wide&size=large&q=" + urllib.parse.quote(query))
        data = json.loads(fetch(u))
        for r in data.get("results", []):
            if r.get("url") and (r.get("width") or 0) >= 1200:
                out.append((0, r["url"], {
                    "title": r.get("title", ""),
                    "author": (r.get("creator") or "")[:120],
                    "license": r.get("license", "cc0"),
                    "source": r.get("foreign_landing_url", ""),
                }))
    except Exception as e:
        print(f"    openverse search failed: {type(e).__name__}: {e}")
    return out


def main():
    credits_path = os.path.join(HERE, "credits.json")
    credits = json.load(open(credits_path)) if os.path.exists(credits_path) else {}
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
        candidates = search_commons(query) or search_openverse(query)
        for rank, url, credit in candidates:
            if len(kept) >= want:
                break
            name = f"{cat}-{len(kept) + 1}.jpg"
            dest = os.path.join(outdir, name)
            try:
                data = fetch(url)
                if data[:3] == b"\xff\xd8\xff" and len(data) > 25_000:
                    open(dest, "wb").write(data)
                    kept.append(name)
                    credits[f"{cat}/{name}"] = credit
                else:
                    print(f"    rejected (not jpeg/too small): {url[:80]}")
            except Exception as e:
                print(f"    download failed ({type(e).__name__}): {url[:80]}")
            time.sleep(1.0)
        manifest[cat] = sorted(kept)
        print(f"{cat}: {len(kept)}/{want}")
        time.sleep(1.0)
    json.dump(manifest, open(os.path.join(HERE, "manifest.json"), "w"), indent=2)
    json.dump(credits, open(credits_path, "w"), indent=2)
    print("total images:", sum(len(v) for v in manifest.values()))
    return 0


if __name__ == "__main__":
    main()
