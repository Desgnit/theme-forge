#!/usr/bin/env python3
"""Tests for the generic RPA auto-fill engine (marketing/platform/sync-browser.py).

Runs the real engine against mock marketplace forms in a local headless
browser — no network needed. Three form styles are covered: <label for=>,
placeholder-based, and aria-label/contenteditable, because that's how the
real marketplaces differ.

Run:  python3 tests/test_autofill.py
"""
import importlib.util
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location(
    "sb", os.path.join(ROOT, "marketing", "platform", "sync-browser.py"))
sb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sb)

FORM_LABELS = """<!DOCTYPE html><html><body>
<form>
  <label for="n">Product name</label><input id="n" type="text">
  <label for="p">Price</label><input id="p" type="text">
  <label for="d">Description</label><textarea id="d"></textarea>
  <label for="t">Tags</label><input id="t" type="text">
  <label for="u">Live preview URL</label><input id="u" type="text">
  <label>Cover image <input id="img" type="file" accept="image/*"></label>
  <label>Product file <input id="zip" type="file"></label>
</form></body></html>"""

FORM_PLACEHOLDERS = """<!DOCTYPE html><html><body>
<input type="text" placeholder="Name of product">
<input type="text" placeholder="Price your product">
<textarea placeholder="Add a description"></textarea>
<input type="text" placeholder="Keywords, comma separated">
<input type="file" name="thumbnail_upload">
<input type="file" name="main_file">
</body></html>"""

FORM_ARIA = """<!DOCTYPE html><html><body>
<input type="text" aria-label="Item name">
<input type="number" aria-label="Amount">
<div contenteditable="true" aria-label="Description" style="min-height:40px;border:1px solid #999"></div>
<input type="text" aria-label="Tags">
</body></html>"""

VALUES = {
    "title": "Forgeline — Industrial Template",
    "price": 39,
    "description": "A premium template.\n\nWith details.",
    "tags": "html template, tailwind css",
    "demo": "https://example.com/demo/",
}


def run_form(page, html, paths):
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
        f.write(html)
        name = f.name
    page.goto("file://" + name)
    filled = sb.autofill(page, VALUES, paths)
    os.unlink(name)
    return filled


def dom_value(page, selector):
    return page.evaluate(
        "s => { const e = document.querySelector(s);"
        " return e.value !== undefined && e.value !== '' ? e.value : e.innerText; }",
        selector)


def main():
    from playwright.sync_api import sync_playwright
    tmp = tempfile.mkdtemp()
    paths = {}
    for key, fname in (("zip", "x.zip"), ("cover", "c.png"),
                       ("tf_thumb", "t.png"), ("tf_preview", "p.png")):
        paths[key] = os.path.join(tmp, fname)
        open(paths[key], "wb").write(b"x")

    failures = []
    with sync_playwright() as pw:
        # PW_CHROMIUM lets sandboxes with a pre-installed browser run the tests
        exe = os.environ.get("PW_CHROMIUM")
        browser = pw.chromium.launch(headless=True, executable_path=exe or None)
        page = browser.new_page()

        # 1. label-based form: every field + both files must land correctly
        filled = run_form(page, FORM_LABELS, paths)
        for field in ("title", "price", "description", "tags", "demo"):
            if field not in filled:
                failures.append(f"labels: {field} not filled ({filled})")
        if dom_value(page, "#n") != VALUES["title"]:
            failures.append("labels: title landed in wrong element")
        if dom_value(page, "#p") != "39":
            failures.append("labels: price wrong: " + dom_value(page, "#p"))
        if VALUES["description"].split()[0] not in dom_value(page, "#d"):
            failures.append("labels: description wrong")
        got_img = page.evaluate("() => document.querySelector('#img').files[0]?.name")
        got_zip = page.evaluate("() => document.querySelector('#zip').files[0]?.name")
        if got_img != "c.png":
            failures.append(f"labels: image input got {got_img}")
        if got_zip != "x.zip":
            failures.append(f"labels: file input got {got_zip}")

        # 2. placeholder-based form
        filled = run_form(page, FORM_PLACEHOLDERS, paths)
        for field in ("title", "price", "description", "tags"):
            if field not in filled:
                failures.append(f"placeholders: {field} not filled ({filled})")
        thumb = page.evaluate(
            "() => document.querySelector('input[name=thumbnail_upload]').files[0]?.name")
        main_f = page.evaluate(
            "() => document.querySelector('input[name=main_file]').files[0]?.name")
        if thumb != "t.png":
            failures.append(f"placeholders: thumbnail input got {thumb}")
        if main_f != "x.zip":
            failures.append(f"placeholders: main file input got {main_f}")

        # 3. aria/contenteditable form
        filled = run_form(page, FORM_ARIA, paths)
        for field in ("title", "price", "description", "tags"):
            if field not in filled:
                failures.append(f"aria: {field} not filled ({filled})")
        ce = dom_value(page, "[contenteditable]")
        if "premium template" not in ce.lower():
            failures.append(f"aria: contenteditable description wrong: {ce!r}")

        browser.close()

    if failures:
        print("FAILURES:")
        for f in failures:
            print("  -", f)
        return 1
    print("autofill engine: all 3 form styles pass "
          f"({len(sb.SITES)} marketplaces registered)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
