"""
Drawable elements.

Every element is a function  draw_<name>(ctx, p)  where `p` is the dict from the
scene file. Register new elements with the @element decorator - they become
available in YAML immediately as  `- type: <name>`.

Coordinates use a 1280x720 canvas. Things standing on the ground use a world
`x` and a ground line `y`: they get perspective (smaller near the horizon) and
move with the camera pan.
"""
import math
import random
import functools

import cairo
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

from .util import (BASE_W as W, BASE_H as H, lerp, sstep, hexc, color, setc, shade,
                   ellipse, vgrad, resolve_path, pil_to_surface)

REGISTRY = {}   # name -> (function, layer)   layer: sky | ground | overlay


def element(name, layer='ground'):
    def deco(fn):
        REGISTRY[name] = (fn, layer)
        return fn
    return deco


# ------------------------------------------------------------------ perspective
def kdepth(ctx, y):
    return max(0.001, (y - ctx.vy) / (H - ctx.vy))


def proj(ctx, X, y):
    """world X on ground line y  ->  (screen x, scale)"""
    k = kdepth(ctx, y)
    return ctx.vx + (X - ctx.cam - ctx.vx) * k, k / kdepth(ctx, 600)


def moving_x(ctx, p):
    """x position for elements with `speed` (pixels / second)."""
    return p.get('x', 0) + p.get('speed', 0) * max(0, ctx.t - p.get('start', 0))


# ------------------------------------------------------------------ time-of-day palettes
TOD = {
    'morning': dict(sky=['#5DA9DD', '#A8D3EE', '#F6DDB4', '#FBD29A'], sun=(330, 205), sun_col='#FFF4CF',
                    glow=(1, 0.9, 0.6), mist=(1, 0.95, 0.88, 0.45), tint=None, wash=(1, 0.92, 0.7, 0.35)),
    'noon':    dict(sky=['#3E8FD6', '#7EC0EC', '#CFE8F5', '#E6F2F4'], sun=(110, 100), sun_col='#FFFDF0',
                    glow=(1, 1, 0.9), mist=(1, 1, 1, 0.35), tint=None, wash=(1, 1, 0.95, 0.15)),
    'evening': dict(sky=['#34437E', '#B9637E', '#F2935A', '#FFC777'], sun=(250, 375), sun_col='#FFD98A',
                    glow=(1, 0.6, 0.3), mist=(1, 0.8, 0.7, 0.4), tint=(1.0, 0.5, 0.25, 0.22), wash=(1, 0.7, 0.4, 0.35)),
    'night':   dict(sky=['#070B24', '#141D45', '#25336A', '#34467C'], sun=None, sun_col='#F4F1DE',
                    glow=(0.8, 0.85, 1), mist=(0.5, 0.55, 0.8, 0.25), tint=(0.04, 0.07, 0.22, 0.55), wash=None),
}


# ================================================================== SKY LAYER
@element('sky', 'sky')
def draw_sky(ctx, p):
    pal = ctx.pal
    stops = p.get('colors', pal['sky'])
    g = vgrad(0, ctx.horizon, [(0, stops[0]), (0.55, stops[1]), (0.85, stops[2]), (1, stops[3])])
    ctx.cr.set_source(g)
    ctx.cr.rectangle(0, 0, W, ctx.horizon + 40)
    ctx.cr.fill()


@element('sun', 'sky')
def draw_sun(ctx, p):
    cr, pal = ctx.cr, ctx.pal
    night = ctx.tod == 'night'
    x = p.get('x', 900 if night else 760) - ctx.cam * 0.05
    if 'y' in p:
        y = p['y']
    elif night:
        y = 120
    else:
        y0, y1 = pal['sun']
        y = lerp(y0, y1, sstep(ctx.t / ctx.dur))
    r = p.get('size', 30 if night else 34)
    gl = pal['glow']
    g = cairo.RadialGradient(x, y, 10, x, y, r * 7.5)
    g.add_color_stop_rgba(0, *gl, 0.85)
    g.add_color_stop_rgba(0.25, *gl, 0.3)
    g.add_color_stop_rgba(1, *gl, 0)
    cr.set_source(g)
    cr.arc(x, y, r * 7.5, 0, 2 * math.pi)
    cr.fill()
    setc(cr, p.get('color', pal['sun_col']))
    cr.arc(x, y, r, 0, 2 * math.pi)
    cr.fill()
    if night:  # moon craters
        setc(cr, (0.8, 0.8, 0.75, 0.5))
        for dx, dy, rr in ((-8, -6, 6), (9, 5, 4), (-2, 11, 3)):
            cr.arc(x + dx, y + dy, rr, 0, 2 * math.pi)
            cr.fill()


@element('stars', 'sky')
def draw_stars(ctx, p):
    rnd = random.Random(p.get('seed', 11))
    for i in range(p.get('count', 140)):
        x, y = rnd.uniform(0, W), rnd.uniform(0, ctx.horizon - 60)
        tw = 0.5 + 0.5 * math.sin(ctx.t * rnd.uniform(1, 3) + i)
        setc(ctx.cr, (1, 1, 0.95, 0.3 + 0.6 * tw))
        ctx.cr.arc(x, y, rnd.uniform(0.6, 1.8), 0, 2 * math.pi)
        ctx.cr.fill()


@element('clouds', 'sky')
def draw_clouds(ctx, p):
    cr = ctx.cr
    rnd = random.Random(p.get('seed', 3))
    n = p.get('count', 5)
    alpha = 0.85 if ctx.tod != 'night' else 0.25
    col = color(p.get('color', '#FFFFFF' if ctx.tod != 'evening' else '#FFD9C4'))
    for i in range(n):
        cx = rnd.uniform(0, 1900)
        cy = rnd.uniform(*p.get('y', [50, 140]))
        s = rnd.uniform(0.7, 1.2)
        puffs = [(rnd.uniform(-60, 60), rnd.uniform(-12, 8), rnd.uniform(18, 34)) for _ in range(7)]
        x = (cx + ctx.t * p.get('speed', 9) - ctx.cam * 0.1) % 1900 - 250
        for dx, dy, r in puffs:
            setc(cr, (col[0], col[1], col[2], alpha))
            cr.arc(x + dx * s, cy + dy * s, r * s, 0, 2 * math.pi)
            cr.fill()


@element('birds', 'sky')
def draw_birds(ctx, p):
    cr = ctx.cr
    n, sp = p.get('count', 6), p.get('speed', -55)
    x0 = p.get('x', 1350 if sp < 0 else -60)
    y0 = p.get('y', 140)
    t = ctx.t - p.get('start', 0)
    if t < 0:
        return
    for i in range(n):
        bx = x0 + t * sp + (i * 34 if sp < 0 else -i * 34) + (i % 2) * 10
        by = y0 + i * 9 - (i % 2) * 18 + 6 * math.sin(ctx.t + i)
        if bx < -40 or bx > W + 40:
            continue
        f = math.sin(ctx.t * 9 + i * 1.3) * 5
        setc(cr, p.get('color', '#2B2B33' if ctx.tod != 'night' else '#0A0A14'))
        cr.set_line_width(1.8)
        cr.set_line_cap(cairo.LINE_CAP_ROUND)
        cr.move_to(bx - 9, by - f)
        cr.curve_to(bx - 5, by - 4 - f * 0.5, bx - 2, by - 2, bx, by)
        cr.curve_to(bx + 2, by - 2, bx + 5, by - 4 - f * 0.5, bx + 9, by - f)
        cr.stroke()


# ================================================================== GROUND LAYER (back)
def _ridge(x, seed, amp, base):
    return base - amp * (0.55 * np.sin(x / 210 + seed) + 0.3 * np.sin(x / 97 + seed * 2.3)
                         + 0.15 * np.sin(x / 41 + seed * 4.1)) \
        - amp * 0.5 * np.exp(-((x - 700 - seed * 80) / 260) ** 2)


@element('mountains', 'back')
def draw_mountains(ctx, p):
    cr = ctx.cr
    xs = np.arange(-10, W + 20, 6)
    hz = ctx.horizon
    hgt = p.get('height', 1.0)
    seed = p.get('seed', 0)
    default = [('#A7B6CE', '#C3CCDD'), ('#7F9DB0', '#97B2C0'), ('#5E8A68', '#6F9A74')]
    cols = p.get('colors', default)
    specs = [(0.15, 1.0, 120, hz - 80), (0.25, 2.6, 95, hz - 50), (0.4, 4.2, 60, hz - 15)]
    for (par, sd, amp, base), cc in zip(specs, cols):
        col, top = (cc, cc) if isinstance(cc, str) else cc
        amp *= hgt
        ys = _ridge(xs + ctx.cam * par, sd + seed, amp, base)
        cr.move_to(xs[0], hz + 30)
        for x, y in zip(xs, ys):
            cr.line_to(x, y)
        cr.line_to(xs[-1], hz + 30)
        cr.close_path()
        cr.set_source(vgrad(base - amp * 1.3, hz, [(0, top), (1, col)]))
        cr.fill()
        if p.get('mist', True):
            m = ctx.pal['mist']
            cr.set_source(vgrad(base - 20, hz + 5, [(0, (m[0], m[1], m[2], 0)), (1, m)]))
            cr.rectangle(0, base - 20, W, hz - base + 30)
            cr.fill()


@functools.lru_cache(maxsize=8)
def _field_layout(seed, horizon, colors):
    rnd = random.Random(seed)
    cols = list(range(-3000, 4400, 260))
    rows = [horizon]
    step = 12
    while rows[-1] < H + 20:
        rows.append(rows[-1] + step)
        step *= 1.28
    patches = {}
    for j in range(len(rows) - 1):
        for i in range(len(cols)):
            patches[(i, j)] = (rnd.choice(colors), rnd.random() < 0.55, rnd.uniform(-60, 60))
    return cols, rows, patches


@element('fields', 'back')
def draw_fields(ctx, p):
    cr = ctx.cr
    hz = ctx.horizon
    colors = tuple(p.get('colors', ['#7DBA4A', '#6AAE3F', '#8CC556', '#5E9E3A', '#A6CF5B', '#74B444',
                                    '#93C95A', '#D7C24C', '#86BF4F', '#9ACD63']))
    bund = p.get('bund', '#C9B27A')
    cols, rows, patches = _field_layout(p.get('seed', 7), hz, colors)
    setc(cr, colors[0])
    cr.rectangle(0, hz, W, H - hz)
    cr.fill()
    for j in range(len(rows) - 1):
        y0, y1 = rows[j], rows[j + 1]
        for i in range(len(cols) - 1):
            c, has_rows, jit = patches[(i, j)]
            Xa = cols[i] + jit * 0.3
            Xb = cols[i + 1] + patches[(i + 1, j)][2] * 0.3
            a0, _ = proj(ctx, Xa, y0); b0, _ = proj(ctx, Xb, y0)
            a1, _ = proj(ctx, Xa, y1); b1, _ = proj(ctx, Xb, y1)
            if max(a0, a1) > W + 50 or min(b0, b1) < -50:
                continue
            cr.set_source(vgrad(y0, y1, [(0, shade(c, 0.93)), (1, shade(c, 1.06))]))
            cr.move_to(a0, y0); cr.line_to(b0, y0); cr.line_to(b1, y1); cr.line_to(a1, y1)
            cr.close_path()
            cr.fill()
            if has_rows and y1 > hz + 40:
                setc(cr, shade(c, 0.78), 0.55)
                cr.set_line_width(0.6 + (y1 - hz - 40) / 120)
                for r in range(1, 9):
                    X = lerp(Xa, Xb, r / 9)
                    q0, _ = proj(ctx, X, y0 + 2); q1, _ = proj(ctx, X, y1 - 2)
                    cr.move_to(q0, y0 + 2); cr.line_to(q1, y1 - 2)
                cr.stroke()
            setc(cr, bund, 0.8)
            cr.set_line_width(0.6 + (y1 - hz) / 90)
            cr.move_to(a0, y0); cr.line_to(a1, y1)
            cr.stroke()
        setc(cr, bund, 0.85)
        cr.set_line_width(0.8 + (y0 - hz) / 70)
        cr.move_to(0, y0); cr.line_to(W, y0)
        cr.stroke()
    wash = ctx.pal['wash']
    if wash:
        cr.set_source(vgrad(hz, H, [(0, wash), (0.4, (wash[0], wash[1], wash[2], 0))]))
        cr.rectangle(0, hz, W, H - hz)
        cr.fill()


@element('ground', 'back')
def draw_ground(ctx, p):
    """Plain ground instead of fields (sand, grass, courtyard...)."""
    c = p.get('color', '#C9A46A')
    ctx.cr.set_source(vgrad(ctx.horizon, H, [(0, shade(c, 0.9)), (1, shade(c, 1.08))]))
    ctx.cr.rectangle(0, ctx.horizon, W, H - ctx.horizon)
    ctx.cr.fill()


# ================================================================== GROUND LAYER (depth sorted)
@element('bush')
def draw_bush(ctx, p):
    x, s = proj(ctx, p.get('x', 0), p['y'])
    s *= p.get('size', 1)
    y = p['y']
    for dx, dy, r, c in [(-10, -6, 9, '#3F7F33'), (8, -7, 10, '#3F7F33'), (0, -13, 11, '#4C9140'), (-4, -9, 7, '#5BA34B')]:
        setc(ctx.cr, c)
        ctx.cr.arc(x + dx * s, y + dy * s, r * s, 0, 2 * math.pi)
        ctx.cr.fill()


@element('palm')
def draw_palm(ctx, p):
    cr, t = ctx.cr, ctx.t
    y = p['y']
    x, s = proj(ctx, p.get('x', 0), y)
    s *= p.get('size', 1)
    ph = p.get('phase', p.get('x', 0) * 0.01)
    sway = 0.06 * math.sin(t * 1.1 + ph)
    h, lean = 150 * s, p.get('lean', 18) * s
    tx, ty = x + lean + sway * 60 * s, y - h
    for i in range(14):
        u0, u1 = i / 14, (i + 1) / 14
        pt = lambda u: (x + lean * u * u + sway * 60 * s * u ** 2, y - h * u)
        setc(cr, '#8A6A45' if i % 2 else '#7A5C3A')
        cr.set_line_width((7 - 3 * u0) * s)
        cr.set_line_cap(cairo.LINE_CAP_BUTT)
        cr.move_to(*pt(u0)); cr.line_to(*pt(u1))
        cr.stroke()
    for f in range(10):
        ang = -math.pi / 2 + (f - 4.5) * 0.36 + sway * 2 + 0.05 * math.sin(t * 2 + f + ph)
        L = (62 + 10 * math.sin(f * 1.7)) * s
        droop = 0.9 if abs(f - 4.5) > 1.5 else 0.35
        ex = tx + math.cos(ang) * L
        ey = ty + math.sin(ang) * L * 0.6 + droop * L * 0.55
        cx_, cy_ = tx + math.cos(ang) * L * 0.55, ty + math.sin(ang) * L * 0.75 - 6 * s
        setc(cr, '#2F7A35' if f % 2 else '#3A8C3E')
        cr.set_line_width(1.4 * s)
        for k in range(1, 12):
            u = k / 12
            px = (1 - u) ** 2 * tx + 2 * (1 - u) * u * cx_ + u * u * ex
            py = (1 - u) ** 2 * ty + 2 * (1 - u) * u * cy_ + u * u * ey
            ll = (1 - u * 0.6) * 15 * s
            for sgn in (-1, 1):
                a2 = ang + sgn * 1.2
                cr.move_to(px, py)
                cr.line_to(px + math.cos(a2) * ll * 0.6, py + abs(math.sin(a2)) * ll + 3 * s)
        cr.stroke()
        setc(cr, '#285F2A')
        cr.set_line_width(1.8 * s)
        cr.move_to(tx, ty); cr.curve_to(cx_, cy_, cx_, cy_, ex, ey)
        cr.stroke()
    setc(cr, '#6B4A2A')
    for dx in (-4, 3, 0):
        cr.arc(tx + dx * s, ty + 4 * s, 3.2 * s, 0, 2 * math.pi)
        cr.fill()


@element('tree')
def draw_tree(ctx, p):
    """Round leafy tree (mango / neem / banyan look)."""
    cr = ctx.cr
    y = p['y']
    x, s = proj(ctx, p.get('x', 0), y)
    s *= p.get('size', 1)
    sway = 2 * math.sin(ctx.t * 1.2 + p.get('x', 0)) * s
    setc(cr, (0, 0, 0, 0.18)); ellipse(cr, x, y, 45 * s, 7 * s); cr.fill()
    setc(cr, '#6B4A2E')
    cr.move_to(x - 7 * s, y); cr.line_to(x - 4 * s, y - 70 * s); cr.line_to(x + 4 * s, y - 70 * s); cr.line_to(x + 7 * s, y)
    cr.close_path(); cr.fill()
    cr.set_line_width(3 * s)
    cr.move_to(x, y - 50 * s); cr.line_to(x - 22 * s, y - 80 * s); cr.move_to(x, y - 55 * s); cr.line_to(x + 20 * s, y - 85 * s)
    cr.stroke()
    rnd = random.Random(int(p.get('x', 0)) + 5)
    base = p.get('color', '#3C8A3A')
    for i in range(16):
        dx, dy = rnd.uniform(-45, 45), rnd.uniform(-125, -70)
        r = rnd.uniform(18, 28)
        setc(cr, shade(base, 0.8 + 0.4 * (-(dy + 70) / 55) * 0.5 + rnd.uniform(-0.05, 0.1)))
        cr.arc(x + dx * s + sway * (-(dy) / 120), y + dy * s, r * s, 0, 2 * math.pi)
        cr.fill()


@element('hut')
def draw_hut(ctx, p):
    cr = ctx.cr
    y = p['y']
    x, s = proj(ctx, p.get('x', 0), y)
    s *= p.get('size', 1)
    wall = p.get('wall', '#C98B4F')
    w, h = 70 * s, 42 * s
    setc(cr, (0, 0, 0, 0.18)); ellipse(cr, x + 6 * s, y, w * 0.7, w * 0.13); cr.fill()
    g = cairo.LinearGradient(x - w / 2, 0, x + w / 2, 0)
    g.add_color_stop_rgba(0, *hexc(wall)); g.add_color_stop_rgba(1, *shade(wall, 0.8))
    cr.set_source(g); cr.rectangle(x - w / 2, y - h, w, h); cr.fill()
    setc(cr, '#F2E6CF'); cr.rectangle(x - w / 2, y - 4 * s, w, 4 * s); cr.fill()
    lit = ctx.tod in ('night', 'evening') and p.get('lamp', True)
    setc(cr, '#F7B733' if lit else '#4A2E1A'); cr.rectangle(x - 8 * s, y - 24 * s, 16 * s, 24 * s); cr.fill()
    if lit:
        g = cairo.RadialGradient(x, y - 12 * s, 2, x, y - 12 * s, 40 * s)
        g.add_color_stop_rgba(0, 1, 0.75, 0.3, 0.5); g.add_color_stop_rgba(1, 1, 0.7, 0.3, 0)
        cr.set_source(g); cr.arc(x, y - 12 * s, 40 * s, 0, 2 * math.pi); cr.fill()
    cr.set_source(vgrad(y - h - 40 * s, y - h + 6 * s, [(0, '#E2C26E'), (1, '#B48A3E')]))
    cr.move_to(x - w / 2 - 12 * s, y - h + 6 * s); cr.line_to(x, y - h - 40 * s); cr.line_to(x + w / 2 + 12 * s, y - h + 6 * s)
    cr.close_path(); cr.fill()
    setc(cr, '#9C7634', 0.6); cr.set_line_width(0.8 * s)
    for i in range(-8, 9):
        cr.move_to(x + i * 1.2 * s, y - h - 38 * s); cr.line_to(x + i * 5.6 * s, y - h + 5 * s)
    cr.stroke()
    if p.get('smoke', False):
        draw_smoke(ctx, {'x': p.get('x', 0) + 15, 'y': y, 'offset': 80, 'size': p.get('size', 1)})


@element('temple')
def draw_temple(ctx, p):
    """Small South-Indian style temple with a stepped gopuram and flag."""
    cr = ctx.cr
    y = p['y']
    x, s = proj(ctx, p.get('x', 0), y)
    s *= p.get('size', 1)
    stone = p.get('color', '#E8D5B0')
    setc(cr, (0, 0, 0, 0.18)); ellipse(cr, x, y, 80 * s, 10 * s); cr.fill()
    setc(cr, shade(stone, 0.85)); cr.rectangle(x - 70 * s, y - 10 * s, 140 * s, 10 * s); cr.fill()
    setc(cr, stone); cr.rectangle(x - 55 * s, y - 55 * s, 110 * s, 45 * s); cr.fill()
    setc(cr, '#8B2E1F'); cr.rectangle(x - 12 * s, y - 42 * s, 24 * s, 32 * s); cr.fill()
    setc(cr, '#C0392B'); cr.set_line_width(2 * s)
    for i in range(-4, 5):
        cr.move_to(x + i * 12 * s, y - 55 * s); cr.line_to(x + i * 12 * s, y - 10 * s)
    cr.stroke()
    cr.set_line_width(1)
    for k in range(5):  # gopuram tiers
        tw = (90 - k * 15) * s
        ty = y - (55 + k * 18) * s
        setc(cr, shade(stone, 1.0 - k * 0.04))
        cr.move_to(x - tw / 2, ty); cr.line_to(x + tw / 2, ty); cr.line_to(x + tw / 2 - 5 * s, ty - 18 * s); cr.line_to(x - tw / 2 + 5 * s, ty - 18 * s)
        cr.close_path(); cr.fill()
        setc(cr, shade(stone, 0.75))
        for i in range(int(tw / (10 * s))):
            cr.rectangle(x - tw / 2 + 6 * s + i * 10 * s, ty - 13 * s, 4 * s, 8 * s)
        cr.fill()
    top = y - 145 * s
    setc(cr, '#D4AF37'); ellipse(cr, x, top - 4 * s, 9 * s, 6 * s); cr.fill()
    cr.rectangle(x - 1.5 * s, top - 18 * s, 3 * s, 10 * s); cr.fill()
    setc(cr, '#6E4B2A'); cr.set_line_width(1.5 * s)
    cr.move_to(x + 60 * s, y - 10 * s); cr.line_to(x + 60 * s, y - 120 * s); cr.stroke()
    wave = math.sin(ctx.t * 4) * 4 * s
    setc(cr, '#F39C12')
    cr.move_to(x + 60 * s, y - 120 * s); cr.curve_to(x + 72 * s, y - 118 * s + wave, x + 80 * s, y - 112 * s - wave, x + 88 * s, y - 112 * s)
    cr.line_to(x + 60 * s, y - 104 * s); cr.close_path(); cr.fill()


@element('smoke')
def draw_smoke(ctx, p):
    """Rising smoke. x = world x, y = ground line, offset = how high above ground it starts."""
    cr = ctx.cr
    y = p['y']
    sx, s = proj(ctx, p.get('x', 0), y)
    s *= p.get('size', 1)
    y0 = y - p.get('offset', 45) * s
    for i in range(8):
        u = (ctx.t * 0.18 + i / 8) % 1
        px = sx + math.sin(u * 5 + i) * 8 * s + u * 30 * s
        py = y0 - u * 120 * s
        setc(cr, (0.92, 0.92, 0.92, 0.35 * (1 - u)))
        cr.arc(px, py, (5 + u * 16) * s, 0, 2 * math.pi)
        cr.fill()


@element('road')
def draw_road(ctx, p):
    cr = ctx.cr
    y, wdt = p['y'], p.get('width', 26)
    c = p.get('color', '#D2B285')
    ry = lambda X, base: base + p.get('curve', 6) * math.sin(X / 420)
    top = [(proj(ctx, X, ry(X, y - wdt / 2))[0], ry(X, y - wdt / 2)) for X in range(-3000, 4400, 80)]
    bot = [(proj(ctx, X, ry(X, y + wdt / 2))[0], ry(X, y + wdt / 2)) for X in range(4400, -3000, -80)]
    cr.move_to(*top[0])
    for q in top[1:] + bot:
        cr.line_to(*q)
    cr.close_path()
    cr.set_source(vgrad(y - wdt / 2, y + wdt / 2, [(0, shade(c, 1.03)), (1, shade(c, 0.92))]))
    cr.fill()
    setc(cr, shade(c, 0.78), 0.5); cr.set_line_width(1.2)
    for off in (-wdt * 0.2, wdt * 0.2):
        pts = [(proj(ctx, X, ry(X, y + off))[0], ry(X, y + off)) for X in range(-3000, 4400, 80)]
        cr.move_to(*pts[0])
        for q in pts[1:]:
            cr.line_to(*q)
        cr.stroke()
road_y = lambda X, base, curve=6: base + curve * math.sin(X / 420)


@element('river')
def draw_river(ctx, p):
    cr = ctx.cr
    y, wdt = p['y'], p.get('width', 40)
    c = p.get('color', '#4F9CC4')
    cr.set_source(vgrad(y - wdt / 2, y + wdt / 2, [(0, shade(c, 1.25)), (1, shade(c, 0.85))]))
    cr.move_to(0, y - wdt / 2)
    for x in range(0, W + 21, 20):
        cr.line_to(x, y - wdt / 2 + 4 * math.sin(x / 140 + 1))
    for x in range(W, -21, -20):
        cr.line_to(x, y + wdt / 2 + 4 * math.sin(x / 160))
    cr.close_path(); cr.fill()
    rnd = random.Random(2)
    setc(cr, (1, 1, 1, 0.45)); cr.set_line_width(1.3)
    for i in range(30):
        lx = (rnd.uniform(0, W + 200) + ctx.t * p.get('flow', 25)) % (W + 200) - 100
        ly = y + rnd.uniform(-wdt * 0.35, wdt * 0.35)
        cr.move_to(lx, ly); cr.line_to(lx + rnd.uniform(15, 35), ly)
    cr.stroke()


@element('pond')
def draw_pond(ctx, p):
    cr, t = ctx.cr, ctx.t
    y = p['y']
    sx, sc = proj(ctx, p.get('x', 0), y)
    sc *= p.get('size', 1)
    rx, ry = 230 * sc, 46 * sc
    ellipse(cr, sx, y, rx * 1.08, ry * 1.08); setc(cr, '#8C7A4E'); cr.fill()
    ellipse(cr, sx, y, rx, ry)
    cr.set_source(vgrad(y - ry, y + ry, [(0, '#9FD0E6'), (1, '#3E8DB0')]))
    cr.fill_preserve()
    cr.save(); cr.clip()
    for i in range(6):
        yy = y - ry * 0.6 + i * ry * 0.25
        off = 20 * math.sin(t * 0.8 + i)
        setc(cr, (1, 1, 1, 0.28)); cr.set_line_width(1.5)
        cr.move_to(sx - rx * 0.5 + off, yy); cr.line_to(sx + rx * 0.2 + off, yy); cr.stroke()
    for i, (dx, dy) in enumerate([(-0.4, 0.1), (0.3, -0.2), (0.0, 0.3), (0.55, 0.2)]):
        u = (t * 0.35 + i * 0.27) % 1
        setc(cr, (1, 1, 1, 0.5 * (1 - u))); cr.set_line_width(1.2)
        ellipse(cr, sx + dx * rx, y + dy * ry, 4 + u * 40 * sc, (4 + u * 40 * sc) * 0.3); cr.stroke()
    if p.get('lotus', True):
        for lx, ly, ls, flower in [(-150, 8, 1.0, True), (-90, -10, 0.8, False), (60, 14, 1.1, True),
                                   (130, -6, 0.7, False), (-20, 22, 0.9, False), (170, 18, 0.9, True)]:
            px, py = sx + lx * sc, y + ly * sc + 1.5 * math.sin(t + lx)
            setc(cr, '#3E8C3A'); ellipse(cr, px, py, 11 * sc * ls, 3.6 * sc * ls, 0.3, 2 * math.pi); cr.line_to(px, py); cr.fill()
            if flower:
                for k in range(5):
                    a = -math.pi / 2 + (k - 2) * 0.45
                    setc(cr, '#F5A3C7' if k % 2 else '#E8789F')
                    cr.save(); cr.translate(px, py - 2 * sc); cr.rotate(a + math.pi / 2)
                    cr.scale(2.4 * sc * ls, 6 * sc * ls); cr.arc(0, -0.8, 1, 0, 2 * math.pi); cr.restore(); cr.fill()
    cr.restore()


def _bullock(cr, s, ph, body, dark, horn_tip):
    def leg(x, a, near):
        cr.save(); cr.translate(x * s, -27 * s); cr.rotate(a)
        setc(cr, body if near else shade(body, 0.82)); cr.set_line_width(4.2 * s); cr.set_line_cap(cairo.LINE_CAP_ROUND)
        cr.move_to(0, 0); cr.line_to(0, 22 * s); cr.stroke()
        setc(cr, '#3A2A20'); cr.rectangle(-2.4 * s, 22 * s, 4.8 * s, 4 * s); cr.fill()
        cr.restore()
    sw = 0.38 * math.sin(ph)
    leg(17, -sw, False); leg(-19, sw, False)
    setc(cr, dark); cr.set_line_width(1.6 * s)
    cr.move_to(-27 * s, -40 * s); cr.curve_to(-33 * s, -32 * s, -30 * s, -24 * s, -31 * s, -16 * s); cr.stroke()
    cr.arc(-31 * s, -15 * s, 2.2 * s, 0, 2 * math.pi); cr.fill()
    g = vgrad(-50 * s, -20 * s, [(0, shade(body, 1.05)), (1, shade(body, 0.85))])
    cr.set_source(g); ellipse(cr, 0, -35 * s, 29 * s, 13.5 * s); cr.fill()
    cr.set_source(g); ellipse(cr, 13 * s, -47 * s, 8 * s, 6.5 * s); cr.fill()
    cr.set_source(g)
    cr.move_to(18 * s, -46 * s); cr.line_to(33 * s, -44 * s); cr.line_to(38 * s, -34 * s); cr.line_to(26 * s, -22 * s); cr.line_to(18 * s, -28 * s)
    cr.close_path(); cr.fill()
    nod = 1.2 * math.sin(ph * 2) * s
    setc(cr, body); cr.save(); cr.translate(38 * s, -38 * s + nod); cr.rotate(0.5); cr.scale(8 * s, 5 * s); cr.arc(0, 0, 1, 0, 2 * math.pi); cr.restore(); cr.fill()
    setc(cr, dark); cr.arc(42 * s, -33 * s + nod, 3 * s, 0, 2 * math.pi); cr.fill()
    setc(cr, '#222222'); cr.arc(37 * s, -40 * s + nod, 0.9 * s, 0, 2 * math.pi); cr.fill()
    for hx, hdx in ((34, -5), (37, -1)):
        cr.set_line_cap(cairo.LINE_CAP_ROUND); setc(cr, '#E9DFC9'); cr.set_line_width(2.2 * s)
        cr.move_to(hx * s, -43 * s + nod); cr.curve_to((hx + hdx) * s, -48 * s + nod, (hx + hdx - 2) * s, -52 * s + nod, (hx + hdx) * s, -56 * s + nod); cr.stroke()
        setc(cr, horn_tip); cr.arc((hx + hdx) * s, -55.5 * s + nod, 1.5 * s, 0, 2 * math.pi); cr.fill()
    leg(17, sw, True); leg(-19, -sw, True)
    setc(cr, '#E0B23A'); cr.arc(29 * s, -25 * s, 2 * s, 0, 2 * math.pi); cr.fill()


def _person_seated(cr, fx, fy, s, bob, turban, t):
    setc(cr, '#F4F1E8')
    cr.move_to(fx - 6 * s, fy + bob); cr.line_to(fx + 7 * s, fy + bob); cr.line_to(fx + 5 * s, fy - 20 * s + bob); cr.line_to(fx - 5 * s, fy - 20 * s + bob)
    cr.close_path(); cr.fill()
    cr.set_line_width(4 * s); cr.move_to(fx + 4 * s, fy + bob); cr.line_to(fx + 13 * s, fy + 3 * s + bob); cr.line_to(fx + 13 * s, fy + 12 * s); cr.stroke()
    setc(cr, '#8B5A3C'); cr.arc(fx, fy - 25 * s + bob, 5 * s, 0, 2 * math.pi); cr.fill()
    setc(cr, turban); ellipse(cr, fx, fy - 29 * s + bob, 6.5 * s, 3.8 * s); cr.fill()
    setc(cr, '#8B5A3C'); cr.set_line_width(2.5 * s); cr.move_to(fx + 3 * s, fy - 16 * s + bob); cr.line_to(fx + 12 * s, fy - 12 * s + bob); cr.stroke()
    setc(cr, '#5A3A1E'); cr.set_line_width(1.2 * s)
    sa = 0.15 * math.sin(t * 1.5)
    cr.move_to(fx + 12 * s, fy - 12 * s + bob); cr.line_to(fx + 12 * s + math.cos(-0.6 + sa) * 40 * s, fy - 12 * s + math.sin(-0.6 + sa) * 40 * s + bob); cr.stroke()


@element('cart')
def draw_cart(ctx, p):
    """Bullock cart. load: grass | hay | none.  Moves right with positive speed."""
    if ctx.t < p.get('start', 0):
        return
    cr = ctx.cr
    X = moving_x(ctx, p)
    y = road_y(X, p['y'], p.get('curve', 6))
    sx, sc = proj(ctx, X, y)
    s = 1.25 * sc * p.get('size', 1)
    if sx < -250 * s or sx > W + 250 * s:
        return
    dist = abs(p.get('speed', 0)) * max(0, ctx.t - p.get('start', 0))
    ph = dist / (9 * s)
    flip = p.get('speed', 0) < 0
    cr.save(); cr.translate(sx, y)
    if flip:
        cr.scale(-1, 1)
    setc(cr, (0, 0, 0, 0.2)); ellipse(cr, -30 * s, 0, 110 * s, 13 * s); cr.fill()
    cr.save(); cr.translate(6 * s, -5 * s); _bullock(cr, s * 0.97, ph + 1.6, '#D9D2C2', '#6B6257', '#2E86C1'); cr.restore()
    setc(cr, '#6E4B2A'); cr.set_line_width(3 * s); cr.move_to(30 * s, -47 * s); cr.line_to(-60 * s, -32 * s); cr.stroke()
    wx, wy, wr = -92 * s, -25 * s, 25 * s

    def wheel(cx, cy, r, near):
        ang = dist / r
        setc(cr, '#5A3A1E' if near else '#4A2F18'); cr.set_line_width(4 * s); cr.arc(cx, cy, r - 2 * s, 0, 2 * math.pi); cr.stroke()
        cr.set_line_width(1.8 * s)
        for k in range(10):
            a = ang + k * math.pi / 5
            cr.move_to(cx, cy); cr.line_to(cx + math.cos(a) * (r - 3 * s), cy + math.sin(a) * (r - 3 * s))
        cr.stroke()
        setc(cr, '#3A2410'); cr.arc(cx, cy, 4 * s, 0, 2 * math.pi); cr.fill()
    wheel(wx + 8 * s, wy - 4 * s, wr, False)
    load = p.get('load', 'grass')
    if load != 'none':
        top, bottom = (('#8DC452', '#4E8C2E') if load == 'grass' else ('#F0D27A', '#B88E3A'))
        cr.set_source(vgrad(-95 * s, -35 * s, [(0, top), (1, bottom)]))
        cr.move_to(-135 * s, -38 * s)
        cr.curve_to(-140 * s, -55 * s, -132 * s, -66 * s, -128 * s, -70 * s)
        prev = (-128, -70)
        for bx, by in [(-115, -86), (-100, -93), (-84, -95), (-68, -90), (-56, -78), (-50, -60)]:
            mx = (prev[0] + bx) / 2
            cr.curve_to(mx * s, (min(prev[1], by) - 6) * s, mx * s, (min(prev[1], by) - 6) * s, bx * s, by * s)
            prev = (bx, by)
        cr.curve_to(-46 * s, -50 * s, -46 * s, -42 * s, -50 * s, -38 * s); cr.close_path(); cr.fill()
        rr = random.Random(3)
        cr.set_line_width(0.9 * s)
        for _ in range(70):
            bx, by = rr.uniform(-130, -52), rr.uniform(-88, -42)
            setc(cr, rr.choice([shade(top, 1.2), shade(bottom, 0.85), top]))
            cr.move_to(bx * s, by * s); cr.line_to((bx + rr.uniform(-5, 5)) * s, (by - rr.uniform(5, 11)) * s); cr.stroke()
        setc(cr, '#C9A86A'); cr.set_line_width(1.2 * s)
        cr.move_to(-120 * s, -38 * s); cr.curve_to(-110 * s, -80 * s, -80 * s, -95 * s, -70 * s, -38 * s); cr.stroke()
    setc(cr, '#7A5230'); cr.rectangle(-138 * s, -40 * s, 92 * s, 5 * s); cr.fill()
    setc(cr, '#5E3D20'); cr.set_line_width(2 * s)
    for k in range(5):
        cr.move_to((-136 + k * 22) * s, -40 * s); cr.line_to((-136 + k * 22) * s, -52 * s)
    cr.stroke()
    _person_seated(cr, -44 * s, -42 * s, s, math.sin(ph * 2) * s, p.get('turban', '#C0392B'), ctx.t)
    wheel(wx, wy, wr, True)
    _bullock(cr, s, ph, '#F2ECDF', '#7A7064', '#E67E22')
    setc(cr, '#6E4B2A'); cr.set_line_width(3.5 * s); cr.set_line_cap(cairo.LINE_CAP_ROUND)
    cr.move_to(22 * s, -52 * s); cr.line_to(30 * s, -56 * s); cr.stroke()
    cr.restore()


POTS = {'brass': '#C9A227', 'clay': '#B5562E', 'steel': '#B8C2CC', 'copper': '#B8733A'}


@element('woman')
def draw_woman(ctx, p):
    """Woman in a saree, optionally carrying a water pot. Negative speed walks left."""
    if ctx.t < p.get('start', 0):
        return
    cr = ctx.cr
    y = p['y']
    X = moving_x(ctx, p)
    x, sc = proj(ctx, X, y)
    s = 1.05 * sc * p.get('size', 1)
    if x < -60 or x > W + 60:
        return
    speed = p.get('speed', 0)
    ph = (ctx.t * 5.2 + p.get('phase', X * 0.01)) if speed else 0
    saree, border, blouse = p.get('saree', '#C8102E'), p.get('border', '#E7B416'), p.get('blouse', '#1E8449')
    pot = p.get('pot', 'brass')
    skin, hair = p.get('skin', '#9A6340'), '#1E1611'
    bob = -1.6 * abs(math.sin(ph)) * s
    cr.save(); cr.translate(x, y)
    setc(cr, (0, 0, 0, 0.22)); ellipse(cr, 0, 0, 18 * s, 4 * s); cr.fill()
    if speed > 0:
        cr.scale(-1, 1)
    cr.translate(0, bob)
    for off in (0, math.pi):
        fx = 6 * math.sin(ph + off) * s
        setc(cr, shade(skin, 0.9)); ellipse(cr, fx - 2 * s, -2 * s - max(0, math.cos(ph + off)) * 1.5 * s, 5 * s, 2.2 * s); cr.fill()
    sw = 0.35 * math.sin(ph)
    setc(cr, shade(skin, 0.85)); cr.set_line_width(4 * s); cr.set_line_cap(cairo.LINE_CAP_ROUND)
    cr.move_to(3 * s, -76 * s); cr.line_to((3 + 20 * math.sin(sw)) * s, -54 * s); cr.stroke()
    hem = 3 * math.sin(ph) * s
    g = cairo.LinearGradient(-15 * s, 0, 15 * s, 0)
    g.add_color_stop_rgba(0, *shade(saree, 1.08)); g.add_color_stop_rgba(1, *shade(saree, 0.78))
    cr.set_source(g)
    cr.move_to(-11 * s, -54 * s); cr.line_to(11 * s, -54 * s); cr.curve_to(14 * s, -30 * s, 16 * s + hem, -12 * s, 15 * s + hem, -5 * s)
    cr.line_to(-17 * s + hem, -5 * s); cr.curve_to(-17 * s + hem, -14 * s, -14 * s, -32 * s, -11 * s, -54 * s); cr.close_path(); cr.fill()
    setc(cr, shade(saree, 0.7), 0.7); cr.set_line_width(0.8 * s)
    for k in range(4):
        px = -6 + k * 2.2
        cr.move_to(px * s, -50 * s); cr.line_to((px - 3) * s + hem, -6 * s)
    cr.stroke()
    setc(cr, border)
    cr.move_to(-17 * s + hem, -5 * s); cr.line_to(15 * s + hem, -5 * s); cr.line_to(15.3 * s + hem, -10 * s); cr.line_to(-16.6 * s + hem, -10 * s)
    cr.close_path(); cr.fill()
    setc(cr, skin); cr.rectangle(-9 * s, -59 * s, 17 * s, 6 * s); cr.fill()
    setc(cr, blouse); cr.move_to(-10 * s, -60 * s); cr.line_to(9 * s, -60 * s); cr.line_to(8 * s, -80 * s); cr.line_to(-8 * s, -80 * s); cr.close_path(); cr.fill()
    setc(cr, shade(saree, 0.92))
    cr.move_to(-9 * s, -56 * s); cr.line_to(-3 * s, -56 * s); cr.line_to(9 * s, -81 * s); cr.line_to(3 * s, -81 * s); cr.close_path(); cr.fill()
    cr.move_to(4 * s, -81 * s); cr.line_to(10 * s, -80 * s); cr.curve_to(16 * s, -66 * s, 15 * s + hem * 0.5, -55 * s, 16 * s + hem * 0.6, -48 * s)
    cr.line_to(10 * s, -50 * s); cr.close_path(); cr.fill()
    setc(cr, skin); cr.rectangle(-2.5 * s, -86 * s, 5 * s, 7 * s); cr.fill()
    ellipse(cr, -1 * s, -91 * s, 7 * s, 7.8 * s); cr.fill()
    setc(cr, hair); cr.arc(0, -92 * s, 7.4 * s, math.pi * 1.3, math.pi * 2.25); cr.fill()
    cr.arc(7 * s, -88 * s, 4.2 * s, 0, 2 * math.pi); cr.fill()
    setc(cr, '#F7F2E8'); cr.arc(9 * s, -91 * s, 1.5 * s, 0, 2 * math.pi); cr.arc(10 * s, -87 * s, 1.5 * s, 0, 2 * math.pi); cr.fill()
    setc(cr, '#C0392B'); cr.arc(-6.3 * s, -93 * s, 0.9 * s, 0, 2 * math.pi); cr.fill()
    setc(cr, '#D4AF37'); cr.arc(0.5 * s, -88 * s, 1 * s, 0, 2 * math.pi); cr.fill()
    if pot != 'none':
        pc = POTS.get(pot, pot)
        setc(cr, '#E8D9B0'); ellipse(cr, -1 * s, -99 * s, 6 * s, 1.8 * s); cr.fill()

        def draw_pot(cx, by, r):
            g = cairo.RadialGradient(cx - r * 0.4, by - r * 1.2, r * 0.1, cx, by - r, r * 1.2)
            g.add_color_stop_rgba(0, *shade(pc, 1.45)); g.add_color_stop_rgba(0.5, *color(pc)); g.add_color_stop_rgba(1, *shade(pc, 0.6))
            cr.set_source(g); cr.arc(cx, by - r, r, 0, 2 * math.pi); cr.fill()
            setc(cr, shade(pc, 0.8)); cr.rectangle(cx - r * 0.38, by - r * 2.25, r * 0.76, r * 0.45); cr.fill()
            setc(cr, shade(pc, 1.2)); ellipse(cr, cx, by - r * 2.25, r * 0.55, r * 0.16); cr.fill()
        draw_pot(-1 * s, -100 * s, 10 * s)
        if p.get('two_pots'):
            draw_pot(-1 * s, -122 * s, 6.5 * s)
        setc(cr, skin); cr.set_line_width(4 * s)
        cr.move_to(-6 * s, -78 * s); cr.line_to(-15 * s, -92 * s); cr.line_to(-10 * s, -108 * s); cr.stroke()
        setc(cr, '#C0392B'); cr.set_line_width(1.2 * s); cr.move_to(-14.5 * s, -98 * s); cr.line_to(-11 * s, -97 * s); cr.stroke()
    else:
        setc(cr, skin); cr.set_line_width(4 * s)
        cr.move_to(-5 * s, -76 * s); cr.line_to((-5 - 20 * math.sin(sw)) * s, -54 * s); cr.stroke()
    cr.restore()


@element('man')
def draw_man(ctx, p):
    """Villager in dhoti, shirt and turban with a walking stick. Negative speed walks left."""
    if ctx.t < p.get('start', 0):
        return
    cr = ctx.cr
    y = p['y']
    X = moving_x(ctx, p)
    x, sc = proj(ctx, X, y)
    s = 1.1 * sc * p.get('size', 1)
    if x < -60 or x > W + 60:
        return
    speed = p.get('speed', 0)
    ph = (ctx.t * 5 + p.get('phase', 0)) if speed else 0
    skin = p.get('skin', '#8B5A3C')
    shirt, dhoti, turban = p.get('shirt', '#F4F1E8'), p.get('dhoti', '#FFFFFF'), p.get('turban', '#C0392B')
    cr.save(); cr.translate(x, y)
    setc(cr, (0, 0, 0, 0.22)); ellipse(cr, 0, 0, 16 * s, 4 * s); cr.fill()
    if speed > 0:
        cr.scale(-1, 1)
    cr.translate(0, -1.5 * abs(math.sin(ph)) * s)
    for off, sh in ((math.pi, 0.85), (0, 1.0)):
        a = 0.35 * math.sin(ph + off)
        setc(cr, shade(skin, sh)); cr.set_line_width(4 * s); cr.set_line_cap(cairo.LINE_CAP_ROUND)
        cr.move_to(0, -40 * s); cr.line_to(math.sin(a) * 38 * s, -2 * s); cr.stroke()
    setc(cr, dhoti)
    cr.move_to(-9 * s, -55 * s); cr.line_to(9 * s, -55 * s); cr.line_to(11 * s, -22 * s); cr.line_to(-11 * s, -22 * s); cr.close_path(); cr.fill()
    setc(cr, shade(dhoti, 0.85), 1); cr.set_line_width(0.8 * s)
    cr.move_to(-3 * s, -55 * s); cr.line_to(-5 * s, -22 * s); cr.stroke()
    setc(cr, shirt)
    cr.move_to(-9 * s, -52 * s); cr.line_to(9 * s, -52 * s); cr.line_to(8 * s, -82 * s); cr.line_to(-8 * s, -82 * s); cr.close_path(); cr.fill()
    setc(cr, p.get('shawl', '#B03A2E')); cr.set_line_width(3 * s)
    cr.move_to(6 * s, -82 * s); cr.line_to(-7 * s, -56 * s); cr.stroke()
    setc(cr, skin); cr.rectangle(-2.5 * s, -87 * s, 5 * s, 6 * s); cr.fill()
    ellipse(cr, -1 * s, -93 * s, 7 * s, 7.8 * s); cr.fill()
    setc(cr, '#2B2B2B'); cr.set_line_width(1.4 * s); cr.move_to(-7 * s, -89 * s); cr.line_to(-3 * s, -89.5 * s); cr.stroke()
    setc(cr, turban); ellipse(cr, 0, -100 * s, 8.5 * s, 4.8 * s); cr.fill()
    setc(cr, shade(turban, 0.8)); ellipse(cr, 5 * s, -98 * s, 3 * s, 3 * s); cr.fill()
    sa = 0.3 * math.sin(ph)
    setc(cr, skin); cr.set_line_width(3.8 * s)
    cr.move_to(-5 * s, -78 * s); cr.line_to(-14 * s, -58 * s); cr.stroke()
    setc(cr, '#5A3A1E'); cr.set_line_width(1.8 * s)
    cr.move_to(-14 * s, -66 * s); cr.line_to(-20 * s + sa * 10 * s, 0); cr.stroke()
    cr.restore()


@element('grass', 'front')
def draw_grass(ctx, p):
    cr = ctx.cr
    rnd = random.Random(p.get('seed', 1))
    for i in range(p.get('count', 140)):
        gx, r = rnd.uniform(-20, W + 20), rnd.random()
        h = (18 + r * 26) * p.get('height', 1)
        sway = 5 * math.sin(ctx.t * 1.6 + gx * 0.02)
        setc(cr, p.get('color', '#3F7F2C') if i % 3 else shade(p.get('color', '#3F7F2C'), 1.35))
        cr.set_line_width(2.2)
        cr.move_to(gx, H + 2)
        cr.curve_to(gx, H - h * 0.5, gx + sway * 0.5, H - h * 0.8, gx + sway + (r - 0.5) * 10, H - h)
        cr.stroke()


# ================================================================== OVERLAY LAYER
FONTS = {'telugu': 'fonts/NotoSansTelugu-Bold.ttf', 'latin': 'fonts/NotoSans-Bold.ttf'}


def _has_telugu(s):
    return any('ఀ' <= ch <= '౿' for ch in s)


@functools.lru_cache(maxsize=64)
def _text_surface(text, size, col, font, shadow, box, width):
    if font:
        path = resolve_path(font)
    else:
        path = resolve_path(FONTS['telugu'] if _has_telugu(text) else FONTS['latin'])
    try:
        fnt = ImageFont.truetype(path, size, layout_engine=ImageFont.Layout.RAQM)
    except Exception:
        fnt = ImageFont.truetype(path, size)
    # word wrap
    lines = []
    for para in text.split('\n'):
        words, cur = para.split(' '), ''
        for w in words:
            trial = (cur + ' ' + w).strip()
            if width and fnt.getlength(trial) > width and cur:
                lines.append(cur); cur = w
            else:
                cur = trial
        lines.append(cur)
    lh = int(size * 1.45)
    tw = int(max(fnt.getlength(l) for l in lines)) + 1
    pad = int(size * 0.6)
    img = Image.new('RGBA', (tw + pad * 2, lh * len(lines) + pad * 2), (0, 0, 0, 0))
    if box:
        bc = tuple(int(v * 255) for v in color(box))
        ImageDraw.Draw(img).rounded_rectangle([0, 0, img.width - 1, img.height - 1], radius=pad, fill=bc)
    if shadow:
        sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(sh)
        for i, l in enumerate(lines):
            d.text((pad + (tw - fnt.getlength(l)) / 2 + 2, pad + i * lh + 3), l, font=fnt, fill=(0, 0, 0, 170))
        img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(3)))
    d = ImageDraw.Draw(img)
    c = tuple(int(v * 255) for v in color(col))
    for i, l in enumerate(lines):
        d.text((pad + (tw - fnt.getlength(l)) / 2, pad + i * lh), l, font=fnt, fill=c)
    return pil_to_surface(img), img.width, img.height


def _fade_alpha(ctx, p):
    st, en, fd = p.get('start', 0), p.get('end', ctx.dur), p.get('fade', 0.6)
    if ctx.t < st or ctx.t > en:
        return 0
    if fd <= 0:
        return 1
    return max(0, min(1, (ctx.t - st) / fd, (en - ctx.t) / fd))


@element('text', 'overlay')
def draw_text(ctx, p):
    a = _fade_alpha(ctx, p)
    if a <= 0:
        return
    size = int(p.get('size', 48))
    surf, w, h = _text_surface(str(p['text']), size, p.get('color', '#FFFFFF'), p.get('font'),
                               p.get('shadow', True), p.get('box'), p.get('width', 1100))
    x = p.get('x', W / 2)
    y = p.get('y', 100)
    rise = (1 - min(1, (ctx.t - p.get('start', 0)) / max(0.01, p.get('fade', 0.6)))) * p.get('rise', 12)
    align = p.get('align', 'center')
    ox = {'center': w / 2, 'left': 0, 'right': w}[align]
    ctx.cr.set_source_surface(surf, x - ox, y - h / 2 + rise)
    ctx.cr.paint_with_alpha(a)


@functools.lru_cache(maxsize=16)
def _image_surface(path):
    img = Image.open(resolve_path(path)).convert('RGBA')
    return pil_to_surface(img), img.width, img.height


@element('image', 'overlay')
def draw_image(ctx, p):
    """PNG/JPG picture. layer: background puts it behind everything. zoom: 1.15 = slow zoom-in."""
    a = _fade_alpha(ctx, p)
    if a <= 0:
        return
    surf, iw, ih = _image_surface(p['path'])
    if p.get('fit') == 'cover' or p.get('layer') == 'background':
        w = max(W / iw, H / ih) * iw
        x, y = W / 2, H / 2
    else:
        w = p.get('width', iw)
        x, y = p.get('x', W / 2), p.get('y', H / 2)
    st, en = p.get('start', 0), p.get('end', ctx.dur)
    z = lerp(1, p.get('zoom', 1), sstep((ctx.t - st) / max(0.01, en - st)))
    k = w / iw * z
    cr = ctx.cr
    cr.save()
    cr.translate(x, y); cr.scale(k, k); cr.translate(-iw / 2, -ih / 2)
    cr.set_source_surface(surf, 0, 0)
    cr.get_source().set_filter(cairo.FILTER_GOOD)
    cr.paint_with_alpha(a)
    cr.restore()
