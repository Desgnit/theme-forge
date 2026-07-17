#!/usr/bin/env python3
"""Download curated stock images (Unsplash CDN — free for commercial use
under the Unsplash License) into marketing/stock/fitness/.

Runs in CI where the network is open. Over-provisioned on purpose: any URL
that 404s or returns junk is skipped; whatever lands cleanly gets committed.
Each image is validated (JPEG magic bytes, >25 KB) before being kept.
"""
import json
import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "fitness")
W = "?w=1600&q=80&auto=format&fit=crop"

IMAGES = {
    # gym interiors / atmosphere
    "gym-dark-interior": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
    "gym-rack-row": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f",
    "gym-moody-equipment": "https://images.unsplash.com/photo-1558611848-73f7eb4001a1",
    "gym-warehouse": "https://images.unsplash.com/photo-1571902943202-507ec2618e8f",
    "gym-neon": "https://images.unsplash.com/photo-1623874514711-0f321325f318",
    # training action
    "barbell-squat": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
    "deadlift-setup": "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5",
    "kettlebell-swing": "https://images.unsplash.com/photo-1579758629938-03607ccdbaba",
    "battle-ropes": "https://images.unsplash.com/photo-1520787497953-1985ca467702",
    "dumbbell-press": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61",
    "sprinter-track": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211",
    "boxing-training": "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed",
    "crossfit-tire": "https://images.unsplash.com/photo-1517963879433-6ad2b056d712",
    "athlete-chalk": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5",
    "rowing-machine": "https://images.unsplash.com/photo-1519505907962-0a6cb0167c73",
    "woman-weights": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e",
    "man-cable-row": "https://images.unsplash.com/photo-1574680096145-d05b474e2155",
    "stretching-floor": "https://images.unsplash.com/photo-1518611012118-696072aa579a",
    "run-stairs": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8",
    "yoga-pose": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b",
    # supplements / nutrition
    "protein-scoop": "https://images.unsplash.com/photo-1593095948071-474c5cc2989d",
    "protein-shaker": "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c",
    "supplement-powder": "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f",
    "supplement-capsules": "https://images.unsplash.com/photo-1556909212-d5b604d0c90d",
    "smoothie-bowl": "https://images.unsplash.com/photo-1502741224143-90386d7f8c82",
    "healthy-meal-prep": "https://images.unsplash.com/photo-1547592180-85f173990554",
    "banana-shake": "https://images.unsplash.com/photo-1553530666-ba11a7da3888",
    "eggs-protein-food": "https://images.unsplash.com/photo-1482049016688-2d3e1b311543",
    # gear / apparel / product-ish
    "weight-plates-stack": "https://images.unsplash.com/photo-1558017487-06bf9f82613a",
    "dumbbells-rack-close": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
    "trainers-shoes": "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    "apparel-flatlay": "https://images.unsplash.com/photo-1556906781-9a412961c28c",
    "resistance-bands": "https://images.unsplash.com/photo-1598289431512-b97b0917affc",
    "jump-rope": "https://images.unsplash.com/photo-1434682881908-b43d0467b798",
    "water-bottle-gym": "https://images.unsplash.com/photo-1523362628745-0c100150b504",
    "smartwatch-fitness": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1",
    "gym-bag": "https://images.unsplash.com/photo-1547949003-9792a18a2601",
    "foam-roller": "https://images.unsplash.com/photo-1600881333168-2ef49b341f30",
    # portraits / community
    "trainer-portrait": "https://images.unsplash.com/photo-1567013127542-490d757e51fc",
    "team-high-five": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b",
    "athlete-portrait-dark": "https://images.unsplash.com/photo-1583468982228-19f19164aee2",
    "spotter-bench": "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f",
}


def main():
    os.makedirs(OUT, exist_ok=True)
    ok, skipped = [], []
    for name, url in IMAGES.items():
        dest = os.path.join(OUT, f"{name}.jpg")
        if os.path.exists(dest):
            ok.append(name)
            continue
        try:
            req = urllib.request.Request(url + W, headers={"User-Agent": "theme-forge-fetch"})
            data = urllib.request.urlopen(req, timeout=30).read()
            if data[:3] == b"\xff\xd8\xff" and len(data) > 25_000:
                open(dest, "wb").write(data)
                ok.append(name)
            else:
                skipped.append(name)
        except Exception as e:
            skipped.append(f"{name} ({type(e).__name__})")
    json.dump(sorted(ok), open(os.path.join(OUT, "available.json"), "w"), indent=2)
    print(f"stock: {len(ok)} downloaded, {len(skipped)} skipped")
    for s in skipped:
        print("  skipped:", s)
    return 0


if __name__ == "__main__":
    main()
