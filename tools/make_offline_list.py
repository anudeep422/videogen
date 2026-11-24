#!/usr/bin/env python3
"""Write docs/offline-files.json: every file the app needs, for the "Download everything for offline" button.
Run before publishing (the Pages workflow runs it automatically):  python3 tools/make_offline_list.py docs"""
import json, os, sys
root = sys.argv[1] if len(sys.argv) > 1 else 'docs'
skip_ext = {'.txt', '.md', '.py'}
files, total = [], 0
for d, _, names in os.walk(root):
    for n in names:
        p = os.path.join(d, n); rel = os.path.relpath(p, root).replace(os.sep, '/')
        if n.startswith('.') or n == 'LICENSE' or os.path.splitext(n)[1] in skip_ext or rel in ('offline-files.json', 'sw.js'):
            continue
        files.append(rel); total += os.path.getsize(p)
files.sort()
# folders (index.html) are also asked for by their folder name
for f in list(files):
    if f.endswith('index.html'): files.append(f[:-len('index.html')] or './')
json.dump({'bytes': total, 'files': files}, open(os.path.join(root, 'offline-files.json'), 'w'), separators=(',', ':'))
print(len(files), 'files,', round(total / 1e6, 1), 'MB')
