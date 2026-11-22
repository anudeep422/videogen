#!/usr/bin/env python3
"""Pick and convert real instrument samples from VSCO 2 Community Edition (CC0).

Usage:
  git clone --filter=blob:none --no-checkout https://github.com/sgossner/VSCO-2-CE /tmp/vsco
  python3 music/extract_vsco.py select /tmp/vsco > /tmp/vsco_paths.txt
  (cd /tmp/vsco && git sparse-checkout set --no-cone --stdin < /tmp/vsco_paths.txt && git checkout master)
  python3 music/extract_vsco.py convert /tmp/vsco docs/studio/samples

Each pitched sample is checked with a pitch detector, so a wrong octave in a
file name is corrected automatically. Output: <inst>/<midi>[_<layer>].mp3 plus
manifest.json.
"""
import json, os, re, subprocess, sys
import numpy as np

NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}

# name, label, group, folder, loudness layers (soft -> loud; None = any), seconds, short-note folder, short-note layer
PITCHED = [
    ('piano', 'Piano', 'Keys', 'Keys/Upright Piano', ['1', '2', '3'], 4.5, None, None),
    ('violin', 'Violin (solo)', 'Strings', 'Strings/Solo Violin/Arco Vib', ['p', 'f'], 3.2, 'Strings/Solo Violin/spic', 'v2'),
    ('violins', 'Violins (section)', 'Strings', 'Strings/Violin Section/susVib', ['v1', 'v2'], 3.2, 'Strings/Violin Section/Spic', 'v2'),
    ('violas', 'Violas', 'Strings', 'Strings/Viola Section/susvib', ['v1', 'v2'], 3.2, 'Strings/Viola Section/spic', 'v2'),
    ('cellos', 'Cellos', 'Strings', 'Strings/Cello Section/susvib', ['v1', 'v3'], 3.2, 'Strings/Cello Section/spic', 'v2'),
    ('basses', 'Double bass', 'Strings', 'Strings/Solo Contrabass/SusVib', ['v1', 'v3'], 3.2, 'Strings/Solo Contrabass/Spic', 'v1'),
    ('pizz', 'Strings pizzicato', 'Strings', 'Strings/Violin Section/Pizz', ['v1', 'v2'], 1.2, None, None),
    ('harp', 'Harp', 'Strings', 'Strings/Harp', None, 3.5, None, None),
    ('flute', 'Flute', 'Woodwinds', 'Woodwinds/Flute/susvib', ['v1'], 3.2, 'Woodwinds/Flute/stac', 'v2'),
    ('clarinet', 'Clarinet', 'Woodwinds', 'Woodwinds/Clarinet/susLong', ['v1', 'v2', 'v3'], 3.2, 'Woodwinds/Clarinet/stac', 'v2'),
    ('oboe', 'Oboe', 'Woodwinds', 'Woodwinds/Oboe/Vib', ['v1', 'v3'], 3.2, 'Woodwinds/Oboe/Stacc', 'v2'),
    ('bassoon', 'Bassoon', 'Woodwinds', 'Woodwinds/Bassoon/vib', ['v1', 'v2'], 3.2, 'Woodwinds/Bassoon/stac', 'v2'),
    ('trumpet', 'Trumpet', 'Brass', 'Brass/Trumpet/susvib', ['v1', 'v2'], 3.2, 'Brass/Trumpet/stac', 'v2'),
    ('horn', 'French horn', 'Brass', 'Brass/F Horn/sus', ['v1', 'v2', 'v3'], 3.2, 'Brass/F Horn/stac', 'v2'),
    ('trombone', 'Trombone', 'Brass', 'Brass/Tenor Trombone/sus', ['v1', 'v2', 'v3'], 3.2, 'Brass/Tenor Trombone/stac', 'v2'),
    ('tuba', 'Tuba', 'Brass', 'Brass/Tuba/sus', ['v1', 'v2', 'v3'], 3.2, 'Brass/Tuba/stac', 'v2'),
    ('marimba', 'Marimba', 'Mallets', 'Percussion/Marimba', None, 2.5, None, None),
    ('xylophone', 'Xylophone', 'Mallets', 'Percussion/Xylo', None, 1.5, None, None),
    ('glock', 'Glockenspiel', 'Mallets', 'Percussion/Glock', None, 2.5, None, None),
]
LEVEL = {1: [0.9], 2: [0.6, 0.95], 3: [0.45, 0.7, 0.95]}

# drum kit: id, label, path (exact file)
DRUMS = [
    ('kick', 'Bass drum', 'VSCO 1 Percussion/drums/bass/bdrum_f_1.wav'),
    ('kick_soft', 'Bass drum soft', 'VSCO 1 Percussion/drums/bass/bdrum_mp_1.wav'),
    ('snare', 'Snare', 'VSCO 1 Percussion/drums/snare/drum2/snare2_f_1.wav'),
    ('snare_soft', 'Snare soft', 'VSCO 1 Percussion/drums/snare/drum2/snare2_pp_1.wav'),
    ('rim', 'Rimshot', 'VSCO 1 Percussion/drums/snare/drum2/snare2_rimshot_f_1.wav'),
    ('tom_hi', 'Tom high', 'VSCO 1 Percussion/drums/tenor/tenor_higher/tenorH_ff_1.wav'),
    ('bongo', 'Bongo', 'VSCO 1 Percussion/drums/other/Bongos/HighBongo1.wav'),
    ('conga_open', 'Conga open', 'VSCO 1 Percussion/drums/other/ethnic/congo/open/ethnicLowOpen_hit_f_1.wav'),
    ('conga_mute', 'Conga muted', 'VSCO 1 Percussion/drums/other/ethnic/congo/muted/ethnicHigh_hit_pp_1.wav'),
    ('big_drum', 'Big hand drum', 'VSCO 1 Percussion/drums/other/ethnic/giant/hand/EthnicLargeHand_hit_ff_2.wav'),
    ('claves', 'Claves', 'Percussion/Claves1_Hit_v2_rr1_Sum.wav'),
    ('cowbell', 'Cowbell', 'Percussion/Cowbell1_Hit_v2_rr1_Sum.wav'),
    ('timpani', 'Timpani hit', 'Percussion/Timpani/Timpani2_Hit_v3_rr1_Sum.wav'),
    ('timpani_roll', 'Timpani roll', 'Percussion/Timpani/Rolls/Timpani3_Roll_v5_rr1_Sum.wav'),
    ('bdrum_concert', 'Concert bass drum', 'Percussion/BDrumNewhit_v5_rr1_Sum.wav'),
]


def ls(repo, folder):
    out = subprocess.run(['git', '-C', repo, 'ls-tree', '-r', '--name-only', 'HEAD', '--', folder],
                         capture_output=True, text=True, check=True).stdout
    return [l for l in out.splitlines() if l.lower().endswith('.wav')]


def parse(path):
    b = os.path.basename(path)[:-4]
    m = re.search(r'(?:^|_)([A-G])(#?)(-?\d)(?=_|$)', b)
    if not m:
        return None
    midi = 12 * (int(m.group(3)) + 1) + NOTE[m.group(1)] + (1 if m.group(2) else 0)
    toks = b.split('_')
    vel = next((t for t in toks if re.fullmatch(r'v\d|ppp|pp|p|mp|mf|f|ff|fff|loud|soft', t)), '')
    rr = 0 if not re.search(r'(rr|RR)[2-9]|_[2-9]$', b) else 1
    return midi, vel, rr


def pick_layer(repo, folder, token):
    """{midi: path} for one loudness token (None = best file of any loudness)."""
    best = {}
    for f in ls(repo, folder):
        p = parse(f)
        if not p:
            continue
        midi, vel, rr = p
        if token is not None and vel != token:
            continue
        rank = (rr, 0 if vel in ('mf', 'loud', 'ff', '') else 1)
        if midi not in best or rank < best[midi][0]:
            best[midi] = (rank, f)
    return {m: v[1] for m, v in best.items()}


def choose(repo, spec):
    """list of (layer_name, {midi: path}); layer names '1'..'3' soft->loud, 's' = short notes"""
    name, label, group, folder, layers, secs, sfold, stok = spec
    out = []
    if name == 'piano':
        for d in layers:
            notes = {}
            for f in ls(repo, folder):
                m = re.search(r'dyn(\d)_rr1_(\d{3})', f)
                if m and m.group(1) == d and int(m.group(2)) % 2 == 0:
                    idx = int(m.group(2)); notes[21 + 2 * idx if idx < 44 else 108] = f
            out.append((d, notes))
        return out
    for i, tok in enumerate(layers or [None]):
        out.append((str(i + 1), pick_layer(repo, folder, tok)))
    if sfold:
        out.append(('s', pick_layer(repo, sfold, stok)))
    return out


def detect_pitch(x, sr):
    """YIN pitch on the steady part; returns MIDI float or None."""
    n = len(x)
    a = int(min(n * 0.25, sr * 0.3))
    seg = x[a: a + int(sr * 0.25)].astype(np.float64)
    if len(seg) < 4000 or np.max(np.abs(seg)) < 1e-4:
        return None
    W = len(seg) // 2
    maxlag = min(W, int(sr / 27))
    minlag = int(sr / 4200)
    d = np.zeros(maxlag)
    for tau in range(1, maxlag):
        diff = seg[:W] - seg[tau:tau + W]
        d[tau] = np.dot(diff, diff)
    cmnd = np.ones(maxlag)
    cs = np.cumsum(d[1:])
    cmnd[1:] = d[1:] * np.arange(1, maxlag) / np.maximum(cs, 1e-12)
    tau = None
    for t in range(minlag, maxlag - 1):
        if cmnd[t] < 0.15:
            while t + 1 < maxlag and cmnd[t + 1] < cmnd[t]:
                t += 1
            tau = t
            break
    if tau is None:
        tau = minlag + int(np.argmin(cmnd[minlag:]))
    if 1 <= tau < maxlag - 1:
        y0, y1, y2 = cmnd[tau - 1], cmnd[tau], cmnd[tau + 1]
        den = y0 - 2 * y1 + y2
        tau = tau + (0.5 * (y0 - y2) / den if den else 0)
    return 69 + 12 * np.log2(sr / tau / 440.0)


def detect_pitch_hps(x, sr):
    """Return MIDI number (float) of the steady part using autocorrelation on a harmonic product."""
    n = len(x)
    seg = x[int(0.25 * n * 0.3):][: int(sr * 0.5)] if n > sr else x
    seg = seg - seg.mean()
    if np.max(np.abs(seg)) < 1e-4:
        return None
    w = seg * np.hanning(len(seg))
    N = 1 << 17
    spec = np.abs(np.fft.rfft(w, N))
    freqs = np.fft.rfftfreq(N, 1 / sr)
    hps = spec.copy()
    for h in (2, 3):
        d = spec[::h]
        hps[: len(d)] *= d
    lo, hi = np.searchsorted(freqs, 25), np.searchsorted(freqs, 4500)
    k = lo + int(np.argmax(hps[lo:hi]))
    f0 = freqs[k]
    return 69 + 12 * np.log2(f0 / 440.0)


def load(path, sr=44100):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def save_mp3(x, sr, out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', '-',
                    '-c:a', 'libmp3lame', '-b:a', '96k', out], input=x.astype(np.float32).tobytes(), check=True)


def trim(x, sr, secs):
    a = np.abs(x)
    thr = max(a.max() * 0.02, 1e-4)
    start = max(0, int(np.argmax(a > thr)) - int(0.004 * sr))
    x = x[start: start + int(secs * sr)]
    fade = min(len(x) // 3, int(0.35 * sr))
    if fade > 0:
        x[-fade:] *= np.linspace(1, 0, fade) ** 2
    return x


def main():
    cmd, repo = sys.argv[1], sys.argv[2]
    if cmd == 'select':
        for spec in PITCHED:
            for _, notes in choose(repo, spec):
                for f in notes.values():
                    print('/' + f)
        for _, _, f in DRUMS:
            print('/' + f)
        return
    dest = sys.argv[3]
    sr = 44100
    man = {'source': 'VSCO 2 Community Edition (CC0) https://github.com/sgossner/VSCO-2-CE', 'version': 2,
           'instruments': {}, 'drums': {}}
    for spec in PITCHED:
        name, label, group, _, layers, secs, _, _ = spec
        entry = {'label': label, 'group': group, 'sustain': secs >= 3 and name not in ('piano', 'harp', 'marimba', 'glock', 'xylophone', 'pizz'), 'layers': {}}
        chosen = choose(repo, spec)
        nlay = len([c for c in chosen if c[0] != 's'])
        for lname, notes in chosen:
            if not notes:
                continue
            short = lname == 's'
            items = []
            for midi, f in sorted(notes.items()):
                pth = os.path.join(repo, f)
                if not os.path.exists(pth):
                    print('missing', f, file=sys.stderr); continue
                x = trim(load(pth, sr), sr, 1.0 if short else secs)
                items.append((midi, x, detect_pitch(x, sr)))
            offs = [round((d - m) / 12) for m, _, d in items if d is not None]
            shift = 12 * max(set(offs), key=offs.count) if offs and name != 'piano' else 0
            level = 0.9 if short else LEVEL[min(3, nlay)][int(lname) - 1]
            got = []
            for midi, x, det in items:
                midi += shift
                x = x / (np.max(np.abs(x)) or 1) * level
                save_mp3(x, sr, os.path.join(dest, name, f'{midi}_{lname}.mp3'))
                got.append(midi)
            if short:
                entry['short'] = sorted(set(got))
            else:
                entry['layers'][lname] = sorted(set(got))
            print(name, lname, 'shift', shift, len(got), file=sys.stderr)
        man['instruments'][name] = entry
    for did, label, f in DRUMS:
        p = os.path.join(repo, f)
        if not os.path.exists(p):
            print('missing', f, file=sys.stderr)
            continue
        x = trim(load(p, sr), sr, 3.5 if 'roll' in did else 1.6)
        x = x / (np.max(np.abs(x)) or 1) * 0.9
        save_mp3(x, sr, os.path.join(dest, 'drums', did + '.mp3'))
        man['drums'][did] = label
    with open(os.path.join(dest, 'manifest.json'), 'w') as fh:
        json.dump(man, fh, indent=1)


if __name__ == '__main__':
    main()
