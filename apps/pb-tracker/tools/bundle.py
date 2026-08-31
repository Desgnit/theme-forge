#!/usr/bin/env python3
"""Inlines the app into one self-contained .html file.

The multi-file version is the one to work on; this is the one to hand out.
It is what gets published as a shareable page, and it is also handy for
emailing the app to someone or dropping it on a USB stick — one file, opens
anywhere, still saves your entries in the browser it is opened in.

Dropped on the way through: the manifest and icon links, and the service
worker registration. Those need real files sitting next to the page, which a
single file by definition does not have.

A --fragment build goes one step further and drops the <!doctype>, <html>,
<head> and <body> wrapper, for hosts that supply their own document shell and
paste the page's content inside it.

Run:  python3 tools/bundle.py [output.html] [--fragment]
"""
import os
import re
import sys

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(rel):
    with open(os.path.join(APP, *rel.split("/"))) as fh:
        return fh.read()


def build(fragment=False):
    html = read("index.html")

    css = read("assets/css/app.css")
    html = re.sub(r'\s*<link rel="stylesheet" href="assets/css/app\.css">',
                  "\n<style>\n" + css + "\n</style>", html)

    def inline_script(match):
        return "<script>\n" + read(match.group(1)) + "\n</script>"

    html = re.sub(r'<script src="(assets/js/[^"]+)"></script>', inline_script, html)

    # things a lone file cannot honour
    html = re.sub(r'\s*<link rel="manifest"[^>]*>', "", html)
    html = re.sub(r'\s*<link rel="icon"[^>]*>', "", html)
    html = re.sub(r'\s*<link rel="apple-touch-icon"[^>]*>', "", html)
    html = html.replace('''    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline support is a bonus */ });
    }''', '''    /* no service worker in the single-file build — there is no file to register */''')

    if fragment:
        head = html.split("<head>", 1)[1].split("</head>", 1)[0]
        body = html.split("<body>", 1)[1].split("</body>", 1)[0]
        keep = re.findall(r"<title>.*?</title>|<style>.*?</style>", head, re.S)
        html = "\n".join(keep) + "\n" + body.strip() + "\n"

    leftovers = re.findall(r'(?:src|href)="(?!#|https?:|data:|mailto:)([^"]+)"', html)
    if leftovers:
        raise SystemExit("bundle would still reach for external files: %s" % sorted(set(leftovers)))
    return html


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--fragment"]
    out = args[0] if args else os.path.join(APP, "dist", "pb-tracker.html")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    text = build(fragment="--fragment" in sys.argv)
    with open(out, "w") as fh:
        fh.write(text)
    print("wrote %s (%.0f KB, one file, no dependencies)" % (out, len(text.encode()) / 1024))
