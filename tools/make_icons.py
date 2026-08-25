#!/usr/bin/env python3
"""Generate PWA icons (pure-Python PNG writer, no third-party deps).

Draws a book + star mark on a purple->pink gradient. Used to produce the
Chrome (manifest) and Safari (apple-touch-icon) icon set in public/icons/.
"""
import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"

BG_A = (124, 58, 237)    # violet-600
BG_B = (236, 72, 153)    # pink-500
PAGE = (255, 253, 245)
PAGE_SHADE = (226, 217, 245)
LINE = (167, 139, 250)
STAR = (253, 224, 71)
STAR_EDGE = (250, 204, 21)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def over(dst, src, alpha):
    return tuple(round(dst[i] * (1 - alpha) + src[i] * alpha) for i in range(3))


def in_poly(px, py, poly):
    inside = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if (y1 > py) != (y2 > py):
            xin = x1 + (py - y1) * (x2 - x1) / (y2 - y1)
            if px < xin:
                inside = not inside
    return inside


def rounded_rect(px, py, x0, y0, x1, y1, r):
    cx = min(max(px, x0 + r), x1 - r)
    cy = min(max(py, y0 + r), y1 - r)
    if x0 <= px <= x1 and y0 <= py <= y1:
        if (px < x0 + r or px > x1 - r) and (py < y0 + r or py > y1 - r):
            return math.hypot(px - cx, py - cy) <= r
        return True
    return False


def star_poly(cx, cy, outer, inner, points=5, rot=-math.pi / 2):
    pts = []
    for i in range(points * 2):
        r = outer if i % 2 == 0 else inner
        a = rot + i * math.pi / points
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def shape(px, py, scale, rounded):
    """Return (r,g,b) or None for transparent, at normalized coords."""
    # background
    if rounded:
        if not rounded_rect(px, py, 0.0, 0.0, 1.0, 1.0, 0.22):
            return None
    col = lerp(BG_A, BG_B, max(0.0, min(1.0, (px + py) / 2)))

    # soft highlight
    d = math.hypot(px - 0.28, py - 0.22)
    if d < 0.55:
        col = over(col, (255, 255, 255), 0.16 * (1 - d / 0.55))

    # content coordinates (scaled around center for maskable safe-zone)
    gx = (px - 0.5) / scale + 0.5
    gy = (py - 0.5) / scale + 0.5

    # star
    s = star_poly(0.5, 0.205, 0.145, 0.062)
    if in_poly(gx, gy, s):
        se = star_poly(0.5, 0.205, 0.121, 0.052)
        return STAR if in_poly(gx, gy, se) else STAR_EDGE

    left = [(0.13, 0.435), (0.5, 0.355), (0.5, 0.775), (0.13, 0.845)]
    right = [(0.87, 0.435), (0.5, 0.355), (0.5, 0.775), (0.87, 0.845)]
    on_left = in_poly(gx, gy, left)
    on_right = in_poly(gx, gy, right)
    if on_left or on_right:
        if abs(gx - 0.5) < 0.012:
            return PAGE_SHADE
        # text lines on the pages
        for row in range(3):
            ty = 0.50 + row * 0.085
            slope = 0.19 if on_left else -0.19
            base = ty + (0.5 - gx) * slope if on_left else ty + (gx - 0.5) * slope
            inner_edge = 0.5 - 0.045 if on_left else 0.5 + 0.045
            outer_edge = 0.20 if on_left else 0.80
            lo, hi = (outer_edge, inner_edge) if on_left else (inner_edge, outer_edge)
            if lo <= gx <= hi and abs(gy - base) < 0.021:
                return LINE
        return PAGE
    return col


def render(size, scale=1.0, rounded=True, opaque=False, ss=3):
    rows = []
    inv = 1.0 / (size * ss)
    for y in range(size):
        row = []
        for x in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    nx = (x * ss + sx + 0.5) * inv
                    ny = (y * ss + sy + 0.5) * inv
                    c = shape(nx, ny, scale, rounded)
                    if c is None:
                        if opaque:
                            acc[0] += BG_A[0]; acc[1] += BG_A[1]; acc[2] += BG_A[2]; acc[3] += 255
                    else:
                        acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3] += 255
            n = ss * ss
            a = acc[3] // n
            if a == 0:
                row.append((0, 0, 0, 0))
            else:
                w = acc[3] / 255.0
                row.append((round(acc[0] / w), round(acc[1] / w), round(acc[2] / w), a))
        rows.append(row)
    return rows


def write_png(path, rows):
    h = len(rows)
    w = len(rows[0])
    raw = bytearray()
    for row in rows:
        raw.append(0)
        for px in row:
            raw.extend(px)

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
           + chunk(b"IEND", b""))
    path.write_bytes(png)
    print(f"  {path.name}  {w}x{h}  {len(png) / 1024:.1f} KB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    print("Rendering icons ->", OUT)
    write_png(OUT / "icon-192.png", render(192))
    write_png(OUT / "icon-512.png", render(512))
    write_png(OUT / "icon-maskable-512.png", render(512, scale=0.72, rounded=False, opaque=True))
    write_png(OUT / "apple-touch-icon.png", render(180, rounded=False, opaque=True))
    write_png(OUT / "favicon-32.png", render(32, ss=4))


if __name__ == "__main__":
    main()
