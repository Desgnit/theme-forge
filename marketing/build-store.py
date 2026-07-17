#!/usr/bin/env python3
"""Build the storefront into marketing/demo-site/store/ from
marketing/catalog.json (+ marketing/store-links.json when payment links have
been provisioned by sync-payments.py). Run by build-demos.sh after the demos
are assembled — never by hand-editing HTML.
"""
import html
import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MK = os.path.join(ROOT, "marketing")
OUT = os.path.join(MK, "demo-site", "store")
RELEASE = "https://github.com/Desgnit/theme-forge/releases/download/themes-latest/{slug}-theme-v1.0.0.zip"

FAMILIES = [
    ("shopify", "Shopify Themes"),
    ("wordpress", "WordPress Themes"),
    ("industrial", "Trade & Industry"),
    ("retail", "Food & Retail"),
    ("trades", "Local Trades"),
    ("football", "Football Clubs"),
    ("sport", "More Sport"),
    ("services", "Local Services"),
    ("community", "Community & Leisure"),
]

CSS = """
:root{--ink:#e8ecf3;--soft:#9aa5b5;--bg:#0d1017;--card:#151a24;--line:#252c3a;--gold:#f5b40b}
*{box-sizing:border-box}
body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink);line-height:1.55}
.wrap{max-width:1100px;margin:0 auto;padding:56px 20px 80px}
h1{font-size:clamp(1.8rem,4vw,2.6rem);letter-spacing:-.02em;margin:0 0 10px}
.sub{color:var(--soft);max-width:640px;margin:0 0 44px}
h2{font-size:1.05rem;text-transform:uppercase;letter-spacing:.18em;color:var(--gold);margin:44px 0 16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.card img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.card .body{padding:16px;display:flex;flex-direction:column;gap:8px;flex:1}
.name{font-weight:700;font-size:1.05rem}
.price{color:var(--gold);font-weight:700}
.desc{color:var(--soft);font-size:.86rem;flex:1}
.row{display:flex;gap:10px;margin-top:6px}
.btn{flex:1;text-align:center;padding:10px 12px;border-radius:9px;font-weight:700;font-size:.9rem;text-decoration:none}
.buy{background:var(--gold);color:#181818}
.buy.soon{background:#2a3140;color:var(--soft);pointer-events:none}
.demo{border:1px solid var(--line);color:var(--ink)}
.btn:hover{filter:brightness(1.1)}
a.back{color:var(--soft);text-decoration:none;font-size:.9rem}
footer{margin-top:64px;color:var(--soft);font-size:.8rem;border-top:1px solid var(--line);padding-top:20px}
"""


def card(t, links):
    slug, esc = t["slug"], html.escape
    link = links.get(slug)
    buy = (f'<a class="btn buy" href="{esc(link)}">Buy £{t["price_gbp"]}</a>' if link
           else '<a class="btn buy soon" href="#">Coming soon</a>')
    return f"""      <div class="card">
        <img src="covers/{slug}-cover.png" alt="{esc(t['title'])} preview" loading="lazy">
        <div class="body">
          <div class="name">{esc(t['title'])}</div>
          <div class="price">£{t['price_gbp']}</div>
          <div class="desc">{esc(t['oneliner'])}</div>
          <div class="row">{buy}<a class="btn demo" href="../{slug}/index.html">Live demo</a></div>
        </div>
      </div>"""


def build():
    catalog = json.load(open(os.path.join(MK, "catalog.json")))
    links_path = os.path.join(MK, "store-links.json")
    links = {}
    if os.path.exists(links_path):
        links = {k: v["payment_link_url"] for k, v in json.load(open(links_path)).items()
                 if v.get("payment_link_url")}

    os.makedirs(os.path.join(OUT, "covers"), exist_ok=True)
    for t in catalog["themes"]:
        src = os.path.join(MK, "covers", f"{t['slug']}-cover.png")
        if os.path.exists(src):
            shutil.copy(src, os.path.join(OUT, "covers", f"{t['slug']}-cover.png"))

    sections = []
    for key, label in FAMILIES:
        cards = [card(t, links) for t in catalog["themes"] if t["family"] == key]
        if cards:
            sections.append(f'    <h2>{label}</h2>\n    <div class="grid">\n' + "\n".join(cards) + "\n    </div>")

    n = len(catalog["themes"])
    page = f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Store — Premium HTML Templates for Trade &amp; Sport</title>
  <meta name="description" content="Buy {n} production-ready HTML + Tailwind templates for trades, industry and football clubs. Instant download after checkout.">
  <style>{CSS}</style>
</head>
<body>
  <div class="wrap">
    <a class="back" href="../index.html">&larr; All live demos</a>
    <h1>Buy a template</h1>
    <p class="sub">{n} production-ready HTML + Tailwind templates. Every one has a full live demo — click through before you buy. Checkout is instant and you download the complete site straight away. One licence = one club/site.</p>
{chr(10).join(sections)}
    <footer>Secure checkout via Stripe · Instant download · Questions? Open an issue on GitHub.</footer>
  </div>
</body>
</html>
"""
    with open(os.path.join(OUT, "index.html"), "w") as f:
        f.write(page)

    slug_zip = json.dumps({t["slug"]: RELEASE.format(slug=t["slug"]) for t in catalog["themes"]})
    slug_name = json.dumps({t["slug"]: t["title"] for t in catalog["themes"]})
    thanks = f"""<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Thanks — download your template</title>
  <meta name="robots" content="noindex">
  <style>{CSS}</style>
</head>
<body>
  <div class="wrap" style="max-width:640px">
    <h1>Thanks for your purchase!</h1>
    <p class="sub" id="msg">Your template is ready to download.</p>
    <a class="btn buy" style="display:inline-block;min-width:240px" id="dl" href="#">Download your template</a>
    <p class="sub" style="margin-top:24px">Unzip it and open <code>index.html</code> — the README inside covers rebranding and going live. Keep your Stripe receipt as your licence record.</p>
  </div>
  <script>
    var zips = {slug_zip};
    var names = {slug_name};
    var slug = new URLSearchParams(location.search).get("theme");
    if (zips[slug]) {{
      document.getElementById("dl").href = zips[slug];
      document.getElementById("msg").textContent = names[slug] + " is ready to download.";
    }} else {{
      document.getElementById("dl").href = "https://github.com/Desgnit/theme-forge/releases/tag/themes-latest";
      document.getElementById("dl").textContent = "Open the downloads page";
    }}
  </script>
</body>
</html>
"""
    with open(os.path.join(OUT, "thanks.html"), "w") as f:
        f.write(thanks)
    print(f"Store built: {n} themes, {len(links)} with live payment links -> {OUT}")


if __name__ == "__main__":
    build()
