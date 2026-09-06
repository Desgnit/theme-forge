#!/usr/bin/env python3
"""
Bundles the three pages into one self-contained HTML file.

CSS, JS, webfonts and the founder photo are inlined as text or data URIs, and
the three <main> blocks become sections swapped by a small client-side router,
so every internal link still works from a single file. Useful for emailing the
proof of concept or publishing it at one URL.

    python3 build-single-file.py            # -> dist/sports-social-marketing.html
"""
import base64
import mimetypes
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
PAGES = [("index", "index.html"), ("work", "work.html"), ("contact", "contact.html")]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def data_uri(rel):
    path = ROOT / rel
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def slice_between(html, start, end):
    return html[html.index(start) + len(start): html.index(end)]


def main():
    index = read("index.html")

    # Shared chrome, taken from the home page.
    chrome_top = slice_between(index, "<body>", "<main id=\"main\">")
    footer = slice_between(index, "<!-- Footer -->", "<script src=")
    footer = "<!-- Footer -->" + footer

    # Each page's <main> contents become a routed section.
    sections = []
    for name, filename in PAGES:
        body = slice_between(read(filename), "<main id=\"main\">", "</main>")
        hidden = "" if name == "index" else " hidden"
        sections.append(f'<div data-page="{name}"{hidden}>\n{body}\n</div>')

    # Styles: fonts first, then the site stylesheet with its font paths inlined.
    fonts = read("assets/css/fonts.css").replace(
        "url(../fonts/inter-var.woff2)", f"url({data_uri('assets/fonts/inter-var.woff2')})"
    )
    styles = fonts + "\n" + read("assets/css/site.css")

    # Every local bitmap gets inlined so the bundle stands alone.
    images = {rel: data_uri(rel) for rel in sorted(
        str(p.relative_to(ROOT)) for p in (ROOT / "assets/img").rglob("*")
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".svg"}
    )}

    script = read("assets/js/site.js") + """
/* Single-file router: internal .html links swap sections instead of navigating. */
(function () {
  "use strict";
  var pages = document.querySelectorAll("[data-page]");
  function show(name, hash) {
    var found = false;
    pages.forEach(function (el) {
      var match = el.dataset.page === name;
      if (match) found = true;
      el.hidden = !match;
    });
    if (!found) return show("index", hash);
    document.querySelectorAll("[aria-current='page']").forEach(function (el) {
      el.removeAttribute("aria-current");
    });
    var href = name === "index" ? "index.html" : name + ".html";
    document.querySelectorAll('a[href="' + href + '"]').forEach(function (el) {
      if (el.closest(".nav, .mobile-nav")) el.setAttribute("aria-current", "page");
    });
    var target = hash && document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var m = /^(index|work|contact)\\.html(#.*)?$/.exec(href);
    if (m) {
      e.preventDefault();
      show(m[1], m[2] || "");
      history.replaceState(null, "", m[2] || "#");
      return;
    }
    // A bare "#section" link may point into a page that is currently hidden.
    if (href.charAt(0) === "#" && href.length > 1) {
      var target = document.getElementById(href.slice(1));
      var owner = target && target.closest("[data-page]");
      if (!owner) return;
      e.preventDefault();
      show(owner.dataset.page, href);
      history.replaceState(null, "", href);
    }
  });
  // Deep links such as ...html#services still land on the home page section.
  if (location.hash) {
    var el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView();
  }
})();
"""

    out = f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sports Social Marketing — Social, Video &amp; Content Consultancy for Sport</title>
<meta name="description" content="Sports Social Marketing builds the social, video and content operations behind sport's biggest audiences. Strategy, formats, team build and commercial content for clubs, publishers and rights holders.">
<meta name="theme-color" content="#0A0C0D">
<link rel="icon" href="{data_uri('assets/img/favicon.svg')}" type="image/svg+xml">
<style>
{styles}
</style>
</head>
<body>
{chrome_top}<main id="main">
{chr(10).join(sections)}
</main>

{footer}
<script>
{script}
</script>
</body>
</html>
"""
    for rel, uri in images.items():
        out = out.replace(f'src="{rel}"', f'src="{uri}"')

    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    target = dist / "sports-social-marketing.html"
    target.write_text(out, encoding="utf-8")
    print(f"{target.relative_to(ROOT)} — {len(out.encode()) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
