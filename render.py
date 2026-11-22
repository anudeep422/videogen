#!/usr/bin/env python3
"""
videogen command line

  python render.py scenes/village.yaml                 # render the full video -> output/village.mp4
  python render.py scenes/village.yaml -o myvideo.mp4  # choose the output file
  python render.py scenes/village.yaml --preview 2 6   # save PNG preview frames at 2s and 6s (scene 1)
  python render.py scenes/village.yaml --preview 3 --scene 2
  python render.py scenes/village.yaml --draft         # half size, quick check
  python render.py scenes/village.yaml --hd            # 1920x1080
  python render.py --all                               # render every file in scenes/
  python render.py --list                              # show all element types
"""
import argparse
import glob
import os
import sys

from videogen import render, still, REGISTRY


def main():
    ap = argparse.ArgumentParser(description='Make animated videos from scene files (no AI).')
    ap.add_argument('scene', nargs='?', help='scene file (.yaml)')
    ap.add_argument('-o', '--output')
    ap.add_argument('--preview', nargs='+', type=float, metavar='SEC', help='save still frames instead of a video')
    ap.add_argument('--scene', type=int, default=1, dest='scene_no', help='scene number for --preview')
    ap.add_argument('--draft', action='store_true', help='640x360 for a fast test render')
    ap.add_argument('--hd', action='store_true', help='1920x1080')
    ap.add_argument('--workers', type=int)
    ap.add_argument('--all', action='store_true', help='render every scenes/*.yaml')
    ap.add_argument('--list', action='store_true', help='list element types')
    a = ap.parse_args()

    if a.list:
        for name, (fn, layer) in sorted(REGISTRY.items()):
            doc = (fn.__doc__ or '').strip().split('\n')[0]
            print(f'  {name:10s} [{layer}]  {doc}')
        return
    overrides = {}
    if a.draft:
        overrides.update(width=640, height=360, crf=26)
    if a.hd:
        overrides.update(width=1920, height=1080)
    files = sorted(glob.glob('scenes/*.yaml')) if a.all else [a.scene]
    if not files or files == [None]:
        ap.print_help()
        sys.exit(1)
    for f in files:
        if a.preview:
            still(f, a.preview, a.scene_no, overrides=overrides)
        else:
            render(f, None if a.all else a.output, a.workers, overrides)


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()
