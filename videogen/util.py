"""Small helpers shared by the engine and the elements."""
import math
import os

import cairo
import numpy as np

BASE_W, BASE_H = 1280, 720          # every scene is designed on this canvas, then scaled
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def lerp(a, b, t):
    return a + (b - a) * t


def sstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def hexc(h, a=1.0):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    return (int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255, a)


def color(c):
    if isinstance(c, str):
        return hexc(c)
    if len(c) == 3:
        return (c[0], c[1], c[2], 1.0)
    return tuple(c)


def setc(cr, c, a=None):
    c = color(c)
    cr.set_source_rgba(c[0], c[1], c[2], c[3] if a is None else a)


def shade(c, f):
    c = color(c)
    return (min(1, c[0] * f), min(1, c[1] * f), min(1, c[2] * f), c[3])


def ellipse(cr, x, y, rx, ry, a0=0, a1=2 * math.pi):
    cr.save()
    cr.translate(x, y)
    cr.scale(max(rx, 0.01), max(ry, 0.01))
    cr.arc(0, 0, 1, a0, a1)
    cr.restore()


def vgrad(y0, y1, stops):
    g = cairo.LinearGradient(0, y0, 0, y1)
    for pos, c in stops:
        c = color(c)
        g.add_color_stop_rgba(pos, *c)
    return g


def resolve_path(p):
    if p is None:
        return None
    if os.path.isabs(p) and os.path.exists(p):
        return p
    for base in (os.getcwd(), ROOT):
        q = os.path.join(base, p)
        if os.path.exists(q):
            return q
    raise FileNotFoundError(p)


def pil_to_surface(img):
    """PIL RGBA image -> cairo ImageSurface (premultiplied BGRA)."""
    img = img.convert('RGBA')
    arr = np.asarray(img).astype(np.float32)
    a = arr[..., 3:4] / 255.0
    rgb = arr[..., :3] * a
    bgra = np.empty(arr.shape, dtype=np.uint8)
    bgra[..., 0] = rgb[..., 2]
    bgra[..., 1] = rgb[..., 1]
    bgra[..., 2] = rgb[..., 0]
    bgra[..., 3] = arr[..., 3]
    h, w = bgra.shape[:2]
    stride = cairo.ImageSurface.format_stride_for_width(cairo.FORMAT_ARGB32, w)
    buf = np.zeros((h, stride), dtype=np.uint8)
    buf[:, :w * 4] = bgra.reshape(h, w * 4)
    surf = cairo.ImageSurface.create_for_data(bytearray(buf.tobytes()), cairo.FORMAT_ARGB32, w, h, stride)
    return surf
