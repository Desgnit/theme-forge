#!/usr/bin/env python3
"""Integrity checks for the PB tracker app (apps/pb-tracker).

Catches the ways this app breaks quietly: a metric added without a benchmark
or a section, a benchmark written the wrong way round, a form pointing at a
metric that no longer exists, or a file renamed without updating the service
worker's offline shell list.

Run:  python3 tests/test_pb_tracker.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "apps", "pb-tracker")


def read(*parts):
    with open(os.path.join(APP, *parts)) as fh:
        return fh.read()


def js_metrics(src):
    """Pulls the METRICS array out of data.js without running JavaScript."""
    body = src.split("var METRICS = [", 1)[1].split("\n  ];", 1)[0]
    out = []
    for line in body.splitlines():
        line = line.strip().rstrip(",")
        if not line.startswith("{"):
            continue
        m = {}
        for key in ("id", "section", "unit", "derived"):
            hit = re.search(r'\b%s: "([^"]+)"' % key, line)
            if hit:
                m[key] = hit.group(1)
        if "neutral: true" in line:
            m["neutral"] = True
        bench = re.search(r"bench: \[([-\d.]+), ([-\d.]+)\]", line)
        if bench:
            m["bench"] = [float(bench.group(1)), float(bench.group(2))]
        out.append(m)
    return out


def main():
    errors = []

    for f in ("index.html", "manifest.webmanifest", "sw.js", "README.md",
              "supabase/schema.sql", "supabase/SETUP.md", "tools/bundle.py",
              "assets/css/app.css", "assets/js/data.js", "assets/js/format.js",
              "assets/js/store.js", "assets/js/score.js", "assets/js/chart.js",
              "assets/js/app.js", "assets/js/sync.js", "assets/js/art.js",
              "assets/img/icon-192.png",
              "assets/img/icon-512.png", "assets/img/favicon.svg"):
        if not os.path.isfile(os.path.join(APP, *f.split("/"))):
            errors.append("missing file: %s" % f)
    if errors:
        print("PB TRACKER ERRORS:")
        for e in errors:
            print("  -", e)
        return 1

    data = read("assets", "js", "data.js")
    metrics = js_metrics(data)
    sections = re.findall(r'\{ id: "(\w+)", n: \d+', data)
    units = re.findall(r"^    (\w+): \{ ", data, re.M)

    if len(metrics) != 24:
        errors.append("expected the 23 tracker rows plus bodyweight, found %d" % len(metrics))

    ids = [m.get("id") for m in metrics]
    if len(set(ids)) != len(ids):
        errors.append("duplicate metric ids")

    lower_is_better = {"time", "pace"}
    for m in metrics:
        mid = m.get("id", "?")
        if not m.get("section"):
            errors.append("%s: no section" % mid)
        elif m["section"] not in sections:
            errors.append("%s: unknown section %s" % (mid, m["section"]))
        if not m.get("unit"):
            errors.append("%s: no unit" % mid)
        elif m["unit"] not in units:
            errors.append("%s: unknown unit %s" % (mid, m["unit"]))
        if m.get("derived") or m.get("neutral"):
            if m.get("derived") and m["derived"] not in ids:
                errors.append("%s: derived from unknown metric %s" % (mid, m["derived"]))
            if m.get("bench"):
                errors.append("%s: derived/neutral rows must not be scored" % mid)
        else:
            if not m.get("bench"):
                errors.append("%s: scored metric with no benchmark" % mid)
            else:
                zero, hundred = m["bench"]
                if zero == hundred:
                    errors.append("%s: benchmark ends are equal, every result would score 0" % mid)
                falling = m.get("unit") in lower_is_better
                # times must count down from the slow end, everything else up
                if falling and zero < hundred:
                    errors.append("%s: time benchmark is the wrong way round" % mid)
                if not falling and m.get("unit") != "time_up" and zero > hundred:
                    errors.append("%s: benchmark is the wrong way round" % mid)

    for metric_id in re.findall(r'metric: "(\w+)"', data):
        if metric_id not in ids:
            errors.append("a log form points at unknown metric %s" % metric_id)

    art = read("assets", "js", "art.js")
    art_names = set(re.findall(r"^    (\w+): \[", art, re.M))
    for name in set(re.findall(r'art: "(\w+)"', data)) | set(
            re.findall(r'\w+: "(\w+)"', data.split("TEST_ART = {")[1].split("}")[0])):
        if name not in art_names:
            errors.append("form pictogram %s is not drawn in art.js" % name)

    # every log form must carry a how-to video with a plausible YouTube id
    n_forms = len(re.findall(r"FORMS\.push\(", data)) + data.count("var FORMS = [")  # sanity only
    video_ids = re.findall(r'\["([A-Za-z0-9_-]{11})", "[^"]+"\]', data)
    if len(video_ids) != 16:
        errors.append("expected 16 how-to videos, found %d" % len(video_ids))
    if "RACE_STANDARDS" not in data or "Farmers Carry" not in data:
        errors.append("race standards reference missing")
    del n_forms

    manifest = json.loads(read("manifest.webmanifest"))
    for field in ("name", "short_name", "start_url", "icons", "display"):
        if not manifest.get(field):
            errors.append("manifest: missing %s" % field)
    for entry in manifest.get("icons", []):
        if not os.path.isfile(os.path.join(APP, *entry["src"].split("/"))):
            errors.append("manifest: icon %s does not exist" % entry["src"])

    sw = read("sw.js")
    index = read("index.html")
    for asset in re.findall(r'(?:src|href)="(assets/[^"]+)"', index):
        if "./" + asset not in sw:
            errors.append("sw.js offline shell is missing %s" % asset)

    if errors:
        print("PB TRACKER ERRORS:")
        for e in errors:
            print("  -", e)
        return 1
    print("pb tracker: %d metrics across %d sections, all complete and consistent"
          % (len(metrics), len(sections)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
