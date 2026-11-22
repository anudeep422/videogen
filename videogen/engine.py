"""Scene loading, frame drawing and video rendering."""
import os
import shutil
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ProcessPoolExecutor

import cairo
import yaml

from . import elements as E
from .util import BASE_W, BASE_H, sstep, setc
from .audio import make_audio

LAYER_ORDER = ['sky', 'back', 'ground', 'front']


class Ctx:
    pass


# ------------------------------------------------------------------ loading
def load(path):
    with open(path, encoding='utf-8') as f:
        doc = yaml.safe_load(f)
    video = {'width': 1280, 'height': 720, 'fps': 30, 'output': None, **(doc.get('video') or {})}
    scenes = doc.get('scenes') or []
    if not scenes:
        raise ValueError('The file has no scenes. Add a  scenes:  list.')
    for i, sc in enumerate(scenes):
        sc.setdefault('duration', 8)
        sc.setdefault('time', 'morning')
        if sc['time'] not in E.TOD:
            raise ValueError(f"scene {i + 1}: time must be one of {list(E.TOD)}")
        for el in sc.get('elements') or []:
            if el.get('type') not in E.REGISTRY:
                raise ValueError(f"scene {i + 1}: unknown element type '{el.get('type')}'. "
                                 f"Available: {', '.join(sorted(E.REGISTRY))}")
    return video, doc.get('audio') or {}, scenes


def scene_elements(sc):
    els = list(sc.get('elements') or [])
    if sc.get('auto_sky', True):
        auto = [{'type': 'sky'}]
        if sc['time'] == 'night':
            auto.append({'type': 'stars'})
        if sc.get('sun', True):
            auto.append({'type': 'sun'})
        els = auto + els
    if sc.get('vignette', True):
        els.append({'type': '_vignette'})
    return els


# ------------------------------------------------------------------ drawing
def draw_frame(surf, video, sc, t, els):
    W, H = video['width'], video['height']
    cr = cairo.Context(surf)
    cr.scale(W / BASE_W, H / BASE_H)
    setc(cr, sc.get('background', '#000000'))
    cr.paint()

    ctx = Ctx()
    ctx.cr, ctx.t, ctx.dur, ctx.tod = cr, t, sc['duration'], sc['time']
    ctx.pal = E.TOD[sc['time']]
    ctx.horizon = sc.get('horizon', 410)
    ctx.vx, ctx.vy = 640, ctx.horizon - 80
    cam = sc.get('camera') or {}
    ctx.cam = cam.get('x', 0) + cam.get('pan', 0) * sstep(t / sc['duration'])

    buckets = {k: [] for k in LAYER_ORDER + ['bg_image', 'overlay']}
    for el in els:
        if el['type'] == '_vignette':
            continue
        fn, layer = E.REGISTRY[el['type']]
        if el['type'] == 'image' and el.get('layer') == 'background':
            layer = 'bg_image'
        buckets[layer].append((fn, el))

    for fn, el in buckets['bg_image'] + buckets['sky']:
        fn(ctx, el)

    # world (gets the time-of-day tint)
    cr.push_group()
    for fn, el in buckets['back']:
        fn(ctx, el)
    for fn, el in sorted(buckets['ground'], key=lambda it: it[1].get('y', 0)):
        fn(ctx, el)
    for fn, el in buckets['front']:
        fn(ctx, el)
    tint = ctx.pal['tint']
    if tint:
        cr.set_operator(cairo.OPERATOR_ATOP)
        cr.set_source_rgba(*tint)
        cr.paint()
        cr.set_operator(cairo.OPERATOR_OVER)
    cr.pop_group_to_source()
    cr.paint()

    if sc.get('vignette', True):
        g = cairo.RadialGradient(BASE_W / 2, BASE_H / 2, 300, BASE_W / 2, BASE_H / 2, 820)
        g.add_color_stop_rgba(0, 0, 0, 0, 0)
        g.add_color_stop_rgba(1, 0.1, 0.05, 0, 0.35)
        cr.set_source(g)
        cr.paint()

    for fn, el in buckets['overlay']:
        fn(ctx, el)

    fi, fo = sc.get('fade_in', 0.8), sc.get('fade_out', 0.8)
    a = 1.0
    if fi > 0:
        a = min(a, t / fi)
    if fo > 0:
        a = min(a, (sc['duration'] - t) / fo)
    if a < 1:
        cr.set_source_rgba(0, 0, 0, 1 - max(0, a))
        cr.paint()


# ------------------------------------------------------------------ rendering
def _render_chunk(args):
    path, idx, f0, f1, out, overrides = args
    video, _, scenes = load(path)
    video.update(overrides)
    sc = scenes[idx]
    els = scene_elements(sc)
    W, H, fps = video['width'], video['height'], video['fps']
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
    tmp = out[:-4] + '.tmp.mp4'
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgra',
                          '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                          '-c:v', 'libx264', '-crf', str(video.get('crf', 18)), '-preset', 'veryfast',
                          '-pix_fmt', 'yuv420p', '-r', str(fps), tmp], stdin=subprocess.PIPE)
    for f in range(f0, f1):
        draw_frame(surf, video, sc, f / fps, els)
        surf.flush()
        p.stdin.write(bytes(surf.get_data()))
    p.stdin.close()
    if p.wait() != 0:
        raise RuntimeError(f'ffmpeg failed on scene {idx + 1}')
    os.replace(tmp, out)
    return f1 - f0


def render(path, output=None, workers=None, overrides=None, keep_temp=False):
    overrides = overrides or {}
    video, audio, scenes = load(path)
    video.update(overrides)
    fps = video['fps']
    name = os.path.splitext(os.path.basename(path))[0]
    output = output or video.get('output') or os.path.join('output', name + '.mp4')
    os.makedirs(os.path.dirname(os.path.abspath(output)), exist_ok=True)
    workers = workers or max(1, os.cpu_count() or 1)
    tmpdir = tempfile.mkdtemp(prefix='videogen_')
    t0 = time.time()

    jobs, parts = [], []
    total = 0
    for i, sc in enumerate(scenes):
        n = int(round(sc['duration'] * fps))
        total += n
        chunks = max(1, min(workers, n // 60))
        step = (n + chunks - 1) // chunks
        for c in range(chunks):
            f0, f1 = c * step, min(n, (c + 1) * step)
            if f0 >= f1:
                continue
            out = os.path.join(tmpdir, f's{i:03d}_{c:03d}.mp4')
            jobs.append((os.path.abspath(path), i, f0, f1, out, overrides))
            parts.append(out)

    duration = total / fps
    print(f'[videogen] {name}: {len(scenes)} scene(s), {duration:.1f}s, '
          f"{video['width']}x{video['height']} @ {fps}fps, {workers} worker(s)")
    done = 0
    with ProcessPoolExecutor(workers) as ex:
        for n in ex.map(_render_chunk, jobs):
            done += n
            print(f'  frames {done}/{total}', end='\r', flush=True)
    print()

    listfile = os.path.join(tmpdir, 'list.txt')
    with open(listfile, 'w') as f:
        for p_ in parts:
            f.write(f"file '{p_}'\n")
    silent = os.path.join(tmpdir, 'video.mp4')
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
                           '-i', listfile, '-c', 'copy', silent])

    wav = os.path.join(tmpdir, 'audio.wav')
    has_audio = make_audio(audio, duration, wav, tmpdir)
    if has_audio:
        subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', silent, '-i', wav,
                               '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
                               '-shortest', output])
    else:
        shutil.copy(silent, output)
    if not keep_temp:
        shutil.rmtree(tmpdir, ignore_errors=True)
    print(f'[videogen] saved {output} in {time.time() - t0:.0f}s')
    return output


def still(path, times, scene=1, out_prefix=None, overrides=None):
    """Save PNG preview frames: quick way to check a scene before rendering."""
    video, _, scenes = load(path)
    video.update(overrides or {})
    sc = scenes[scene - 1]
    els = scene_elements(sc)
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, video['width'], video['height'])
    name = out_prefix or os.path.join('output', os.path.splitext(os.path.basename(path))[0])
    os.makedirs(os.path.dirname(os.path.abspath(name)), exist_ok=True)
    files = []
    for t in times:
        draw_frame(surf, video, sc, float(t), els)
        fn = f'{name}_scene{scene}_{t}s.png'
        surf.write_to_png(fn)
        files.append(fn)
        print('[videogen] preview', fn)
    return files
