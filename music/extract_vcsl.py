#!/usr/bin/env python3
"""Add instruments from the Versilian Community Sample Library (VCSL, CC0).

Usage:
  git clone --filter=blob:none --no-checkout https://github.com/sgossner/VCSL /tmp/vcsl
  python3 music/extract_vcsl.py select /tmp/vcsl > /tmp/vcsl_paths.txt
  (cd /tmp/vcsl && git sparse-checkout set --no-cone --stdin < /tmp/vcsl_paths.txt && git checkout master)
  python3 music/extract_vcsl.py convert /tmp/vcsl docs/studio/samples

The new instruments and one-shot sounds are merged into samples/manifest.json
next to the VSCO 2 and GeneralUser GS ones. Pitched samples are pitch-checked.
"""
import json, os, re, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extract_vsco import ls, parse, detect_pitch, load, save_mp3, trim, LEVEL

# name, label, group, folder, loudness tokens (soft -> loud; None = any), seconds, skip regex, keep every n-th note
PITCHED = [
    ('grand', 'Grand piano (Steinway)', 'Keys', 'Chordophones/Zithers/Grand Piano, Steinway B/Sus', ['vl2', 'vl4'], 5.0, None, 1),
    ('pipeorgan', 'Pipe organ (church)', 'Keys', 'Aerophones/Edge-blown Aerophones/Pipe Organ/Quiet', None, 3.5, None, 1),
    ('folkharp', 'Folk harp', 'Strings', 'Chordophones/Composite Chordophones/Folk Harp', ['v2', 'v3'], 3.5, None, 1),
    ('tsax', 'Tenor saxophone', 'Woodwinds', 'Aerophones/Reed Aerophones/Tenor Saxophone/Non-Vibrato', ['vl2', 'vl3'], 3.2, None, 1),
    ('harmonica', 'Harmonica', 'World', 'Aerophones/Free Aerophones/Harmonica-Hohner-Special20-C/Sustains/Normal', None, 3.2, None, 1),
    ('ocarina', 'Ocarina', 'World', 'Aerophones/Edge-blown Aerophones/Ocarina, Typical/Sustains/SusVib', None, 3.2, None, 1),
    ('balafon', 'Balafon (African xylophone)', 'World', 'Idiophones/Struck Idiophones/Balafon/Traditional Mallet', ['vl1', 'vl3'], 2.0, None, 1),
    ('kalimba_ke', 'Kalimba (Kenya, real)', 'World', 'Idiophones/Plucked Idiophones/Kalimba, Kenya', None, 3.0, None, 1),
    ('mbira', 'Mbira (Zimbabwe)', 'World', 'Idiophones/Plucked Idiophones/Mbira dzaVadzimu Nyamaropa, Zimbabwe, Low B', None, 3.0, None, 1),
    ('wineglass', 'Singing wine glasses', 'Bells', 'Idiophones/Friction Idiophones/Wine Glasses/Sustains/Slow', None, 5.0, None, 1),
    ('tubebells', 'Tubular bells (real)', 'Bells', 'Idiophones/Struck Idiophones/Tubular Bells 1', None, 5.0, None, 1),
]
FIXED_SHIFT = {'grand': 0, 'tubebells': 12, 'wineglass': 12}
SUSTAIN = {'pipeorgan', 'tsax', 'harmonica', 'ocarina', 'wineglass'}

# one-shot sounds: id, label, file, seconds
HITS = [
    ('frame_low', 'Frame drum', 'Membranophones/Struck Membranophones/Frame Drum/HDrumL_Hit_v3_rr1_Sum.wav', 1.6),
    ('frame_mute', 'Frame drum muted', 'Membranophones/Struck Membranophones/Frame Drum/HDrumL_HitMuted_v3_rr1_Sum.wav', 1.0),
    ('frame_hi', 'Small frame drum', 'Membranophones/Struck Membranophones/Frame Drum/HDrumS_Hit_v3_rr1_Sum.wav', 1.2),
    ('darbuka_1', 'Darbuka 1', 'Membranophones/Struck Membranophones/Darbuka/Darbuka_1_hit_vl2_rr1.wav', 1.2),
    ('darbuka_2', 'Darbuka 2', 'Membranophones/Struck Membranophones/Darbuka/Darbuka_2_hit_vl2_rr1.wav', 1.2),
    ('darbuka_3', 'Darbuka 3', 'Membranophones/Struck Membranophones/Darbuka/Darbuka_3_hit_vl2_rr1.wav', 1.2),
    ('darbuka_4', 'Darbuka 4', 'Membranophones/Struck Membranophones/Darbuka/Darbuka_4_hit_vl2_rr1.wav', 1.2),
    ('cajon_1', 'Cajon 1', 'Idiophones/Struck Idiophones/Cajon/Cajon_hit1_f_rr1.wav', 1.0),
    ('cajon_2', 'Cajon 2', 'Idiophones/Struck Idiophones/Cajon/Cajon_hit2_f_rr1.wav', 1.0),
    ('slit_hi', 'Slit drum high', 'Idiophones/Struck Idiophones/Slit Drum/LogDrumHi_MedM_v2_rr1_Sum.wav', 1.2),
    ('slit_lo', 'Slit drum low', 'Idiophones/Struck Idiophones/Slit Drum/LogDrumLo_MedM_v2_rr1_Sum.wav', 1.2),
    ('fingercym', 'Finger cymbals', 'Idiophones/Struck Idiophones/Finger Cymbals/Fing_Cymb.wav', 3.0),
    ('nepal_bell', 'Nepalese hand bell', 'Idiophones/Struck Idiophones/Hand Bells, Nepalese/HB_1.wav', 4.0),
    ('nepal_bell2', 'Nepalese hand bell 2', 'Idiophones/Struck Idiophones/Hand Bells, Nepalese/HB_2.wav', 4.0),
    ('gong_real', 'Gong (real)', 'Idiophones/Struck Idiophones/Gong 1/gong_f.wav', 7.0),
    ('gong_soft', 'Gong soft', 'Idiophones/Struck Idiophones/Gong 1/gong_p.wav', 6.0),
    ('marktree', 'Wind chimes (mark tree)', 'Idiophones/Struck Idiophones/Mark Trees/Legacy/windchimes_slowAsc1.wav', 4.0),
    ('ocean', 'Ocean drum (waves)', 'Membranophones/Other Membranophones/Ocean Drum/OceanDrum_Sus_1_Mid.wav', 6.0),
    ('didgeridoo', 'Didgeridoo', 'Aerophones/Lip Aerophones/Didgeridoo/Didgeridoo1_Phrase1_Main.wav', 4.0),
]


def files(repo, folder, skip):
    return [f for f in ls(repo, folder) if not re.search(r'/Releases?/|_rel', f) and not (skip and re.search(skip, f))]


def choose(repo, spec):
    name, label, group, folder, layers, secs, skip, every = spec
    allf = files(repo, folder, skip)
    out = []
    for i, tok in enumerate(layers or [None]):
        best = {}
        for f in allf:
            p = parse(f)
            if not p:
                continue
            midi, _, rr = p
            b = os.path.basename(f)
            if tok is not None and not re.search(r'(?:^|_)' + tok + r'(?:_|\.|$)', b):
                continue
            rank = (rr, 0 if re.search(r'_(f|mf|ff)_', b) else 1, len(b))
            if midi not in best or rank < best[midi][0]:
                best[midi] = (rank, f)
        notes = {m: v[1] for m, v in sorted(best.items())}
        if every > 1:
            notes = dict(list(notes.items())[::every])
        out.append((str(i + 1), notes))
    return out


def main():
    cmd, repo = sys.argv[1], sys.argv[2]
    if cmd == 'select':
        for spec in PITCHED:
            for _, notes in choose(repo, spec):
                for f in notes.values():
                    print('/' + f)
        for _, _, f, _ in HITS:
            print('/' + f)
        return
    dest, sr = sys.argv[3], 44100
    mp = os.path.join(dest, 'manifest.json')
    man = json.load(open(mp))
    man['source3'] = 'Versilian Community Sample Library (VCSL, CC0) https://github.com/sgossner/VCSL'
    for spec in PITCHED:
        name, label, group, _, layers, secs, _, _ = spec
        entry = {'label': label, 'group': group, 'sustain': name in SUSTAIN, 'layers': {}}
        chosen = choose(repo, spec)
        for lname, notes in chosen:
            items = []
            for midi, f in notes.items():
                pth = os.path.join(repo, f)
                if not os.path.exists(pth):
                    print('missing', f, file=sys.stderr); continue
                x = trim(load(pth, sr), sr, secs)
                items.append((midi, x, detect_pitch(x, sr)))
            offs = [round((d - m) / 12) for m, _, d in items if d is not None]
            # VCSL names most notes with C3 = middle C; bells and glasses fool the pitch detector, so they are set by ear
            shift = FIXED_SHIFT[name] if name in FIXED_SHIFT else 12 * max(set(offs), key=offs.count) if offs else 0
            level = LEVEL[min(3, len(chosen))][int(lname) - 1]
            got = []
            for midi, x, det in items:
                midi += shift
                x = x / (np.max(np.abs(x)) or 1) * level
                save_mp3(x, sr, os.path.join(dest, name, f'{midi}_{lname}.mp3'))
                got.append(midi)
            entry['layers'][lname] = sorted(set(got))
            print(name, lname, 'shift', shift, len(got), sorted(set(got))[:3], '...', file=sys.stderr)
        man['instruments'][name] = entry
    for did, label, f, secs in HITS:
        p = os.path.join(repo, f)
        if not os.path.exists(p):
            print('missing', f, file=sys.stderr); continue
        x = trim(load(p, sr), sr, secs)
        x = x / (np.max(np.abs(x)) or 1) * 0.9
        save_mp3(x, sr, os.path.join(dest, 'drums', did + '.mp3'))
        man['drums'][did] = label
    with open(mp, 'w') as fh:
        json.dump(man, fh, indent=1)


if __name__ == '__main__':
    main()
