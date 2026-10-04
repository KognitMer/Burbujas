#!/usr/bin/env python3
"""Pasa las burbujas procesadas (PNG 400 px) a WebP con transparencia en public/assets."""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "bubbles-400")
OUT = os.path.join(ROOT, "public", "assets")

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for f in sorted(os.listdir(SRC)):
        if not f.endswith(".png"):
            continue
        dst = os.path.join(OUT, f[:-4] + ".webp")
        Image.open(os.path.join(SRC, f)).save(dst, "WEBP", quality=92, alpha_quality=100, method=4)
        total += os.path.getsize(dst)
        print(f, "->", os.path.getsize(dst) // 1024, "KB")
    print("total", total // 1024, "KB")
