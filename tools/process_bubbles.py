#!/usr/bin/env python3
"""Genera las burbujas del juego a partir de los originales.

    assets-src/originals/<nombre>.png   (1254 px, burbuja con relleno lila opaco)
 -> assets-src/bubbles-400/<nombre>.png (400 px, relleno interior transparente)

Idea: el relleno de la burbuja es un degradado suave. Se ajusta un modelo polinómico de ese relleno y
todo lo que se parece al modelo pasa a ser transparente (incluidos los huecos entre las piernas del
personaje). Lo que se aparta del modelo (personaje, caritas blancas, nubes de Tilt) queda opaco y se
"descontamina" del color del relleno. El aro iridiscente exterior se conserva tal cual.

Uso:  python3 tools/process_bubbles.py     (requiere pillow, numpy, scipy)
Luego: python3 tools/optimize_assets.py   (pasa a WebP en public/assets)
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src", "originals")
OUT = os.path.join(ROOT, "assets-src", "bubbles-400")
NAMES = ["abrumado", "analisis", "flow", "frustrado", "inspirado", "miedo", "neutral", "tilt", "tranquilo"]
S = 500          # tamaño de trabajo
FINAL = 400      # tamaño final

yy, xx = np.mgrid[:S, :S].astype(float)
cx = cy = (S - 1) / 2
d = np.hypot(xx - cx, yy - cy)
rr = d / (S / 2)
u, v = (xx - cx) / (S / 2), (yy - cy) / (S / 2)
BASIS = np.stack([u ** i * v ** j for i in range(4) for j in range(4 - i)], -1)


def process(name):
    im = Image.open(os.path.join(SRC, name + ".png")).convert("RGBA").resize((S, S), Image.LANCZOS)
    A = np.asarray(im).astype(float)
    a, oa = A[..., :3], A[..., 3] / 255
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    inside = rr < 0.86
    cand = inside & (R > 140) & (B >= R) & ((B - R) < 90) & (G >= R - 5)
    for _ in range(5):                                   # ajuste robusto del relleno
        M = BASIS[cand]
        coef = [np.linalg.lstsq(M, a[..., c][cand], rcond=None)[0] for c in range(3)]
        model = np.stack([BASIS @ coef[c] for c in range(3)], -1)
        dev = np.linalg.norm(a - model, axis=2)
        cand = inside & (dev < 14)
    dev = np.linalg.norm(a - model, axis=2)
    al = np.clip((dev - 9) / 24, 0, 1)
    solid = ndi.binary_opening(al > 0.5, iterations=1)
    lab, nl = ndi.label(solid)
    if nl:
        sz = ndi.sum(solid, lab, range(1, nl + 1))
        solid = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s > 40])
    solid = ndi.binary_dilation(solid, iterations=2)
    al = al * solid
    holes = ndi.binary_fill_holes(solid) & ~solid        # caritas blancas (rodeadas por el personaje)
    white = inside & ((B - R) < 18) & (R > 218)
    wl, wn = ndi.label(white)
    for i in range(1, wn + 1):
        m = wl == i
        if m.sum() < 25:
            continue
        ring_ = ndi.binary_dilation(m, iterations=3) & ~m
        if (al[ring_] > 0.5).mean() > 0.75:
            al[ndi.binary_dilation(m, iterations=1)] = 1.0
    al = ndi.gaussian_filter(al, 0.6)
    alc = np.maximum(al, 1e-3)[..., None]
    col = np.clip((a - (1 - alc) * model) / alc, 0, 255)
    col = np.where(al[..., None] > 0.98, a, col)
    ring = np.clip((rr - 0.86) / 0.07, 0, 1) * np.clip((1.0 - rr) / 0.01, 0, 1)   # aro original
    alpha = al * (1 - ring) + ring * oa
    colf = col * (1 - ring[..., None]) + a * ring[..., None]
    alpha = alpha * (rr < 0.995) * np.clip(oa, 0, 1)
    out = np.dstack([colf, alpha * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, "RGBA").resize((FINAL, FINAL), Image.LANCZOS).save(os.path.join(OUT, name + ".png"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for n in NAMES:
        process(n)
        print("ok", n)
