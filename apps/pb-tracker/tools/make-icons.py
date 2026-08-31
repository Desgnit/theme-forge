#!/usr/bin/env python3
"""Generates the app icons with no image library — the repo has none installed.

Draws the tracker mark (three ascending bars under a rising chevron) onto a
black square and writes it out as PNG. Art stays inside the middle 60% so
Android's maskable crop cannot clip it.

Run:  python3 tools/make-icons.py
"""
import struct
import zlib
import os

BG = (0, 0, 0)
GOLD = (245, 197, 66)
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "img")


def blank(size, colour):
    return [[colour for _ in range(size)] for _ in range(size)]


def rect(px, x0, y0, x1, y1, colour, radius=0):
    size = len(px)
    for y in range(max(0, int(y0)), min(size, int(y1))):
        for x in range(max(0, int(x0)), min(size, int(x1))):
            if radius:
                cx = min(max(x, x0 + radius), x1 - radius)
                cy = min(max(y, y0 + radius), y1 - radius)
                if (x - cx) ** 2 + (y - cy) ** 2 > radius ** 2:
                    continue
            px[y][x] = colour


def stroke_line(px, x0, y0, x1, y1, colour, width):
    """Thick line via per-pixel distance to the segment — a few thousand
    pixels, so brute force is fine and keeps this dependency-free."""
    size = len(px)
    dx, dy = x1 - x0, y1 - y0
    length2 = dx * dx + dy * dy or 1
    half = width / 2.0
    xmin, xmax = int(min(x0, x1) - half - 1), int(max(x0, x1) + half + 2)
    ymin, ymax = int(min(y0, y1) - half - 1), int(max(y0, y1) + half + 2)
    for y in range(max(0, ymin), min(size, ymax)):
        for x in range(max(0, xmin), min(size, xmax)):
            t = ((x - x0) * dx + (y - y0) * dy) / length2
            t = 0.0 if t < 0 else 1.0 if t > 1 else t
            px_, py_ = x0 + t * dx, y0 + t * dy
            if (x - px_) ** 2 + (y - py_) ** 2 <= half * half:
                px[y][x] = colour


def draw(size):
    px = blank(size, BG)
    u = size / 100.0            # work in percentage units
    bar_w = 13 * u
    base = 82 * u
    for i, height in enumerate((26, 38, 50)):
        x0 = (22 + i * 18) * u
        rect(px, x0, base - height * u, x0 + bar_w, base, GOLD, radius=2.4 * u)
    # progress arrow climbing over the bars
    w = 5.5 * u
    stroke_line(px, 16 * u, 44 * u, 84 * u, 12 * u, GOLD, w)
    stroke_line(px, 84 * u, 12 * u, 69 * u, 13 * u, GOLD, w)
    stroke_line(px, 84 * u, 12 * u, 83 * u, 27 * u, GOLD, w)
    return px


def write_png(path, px):
    size = len(px)
    raw = bytearray()
    for row in px:
        raw.append(0)
        for r, g, b in row:
            raw += bytes((r, g, b))

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
           + chunk(b"IEND", b""))
    with open(path, "wb") as fh:
        fh.write(png)
    print("wrote", path, len(png), "bytes")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for s, name in ((512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png")):
        write_png(os.path.join(OUT, name), draw(s))
