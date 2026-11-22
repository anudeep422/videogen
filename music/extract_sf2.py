#!/usr/bin/env python3
"""Add extra instruments to the Instrument Studio from a General MIDI SoundFont.

  python3 music/extract_sf2.py GeneralUser-GS.sf2 docs/studio/samples

Default source: GeneralUser GS by S. Christian Collins (licence v2.0: free to use in
software projects, private or commercial). Each instrument is played by fluidsynth note
by note (every 3 semitones, soft and loud), trimmed, pitch-checked and saved as MP3.
The entries are merged into samples/manifest.json next to the VSCO 2 instruments.
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np
from midiutil import MIDIFile

sys.path.insert(0, os.path.dirname(__file__))
from extract_vsco import detect_pitch, save_mp3   # same helpers as the orchestra samples

# id: (label, group, GM program, low, high, seconds held, sustained, layers)
INST = {
    'choir':      ('Choir "aah"', 'Voices', 52, 48, 79, 3.2, True, 2),
    'voice':      ('Voice "ooh"', 'Voices', 53, 48, 79, 3.2, True, 2),
    'shehnai':    ('Shehnai', 'Indian & world (recorded)', 111, 60, 88, 3.0, True, 2),
    'sitar_rec':  ('Sitar (recorded)', 'Indian & world (recorded)', 104, 48, 84, 2.6, False, 2),
    'dulcimer':   ('Dulcimer (santoor-like)', 'Indian & world (recorded)', 15, 55, 91, 2.2, False, 1),
    'reedorgan':  ('Reed organ (harmonium-like)', 'Indian & world (recorded)', 20, 48, 84, 3.0, True, 2),
    'panflute':   ('Pan flute', 'Indian & world (recorded)', 75, 60, 88, 3.0, True, 2),
    'koto':       ('Koto (Japanese)', 'Indian & world (recorded)', 107, 48, 84, 2.4, False, 1),
    'shamisen':   ('Shamisen (Japanese)', 'Indian & world (recorded)', 106, 48, 84, 1.8, False, 1),
    'kalimba_rec':('Kalimba (recorded)', 'Indian & world (recorded)', 108, 60, 88, 1.8, False, 1),
    'nylon':      ('Nylon guitar', 'Guitars & keys', 24, 40, 79, 2.6, False, 2),
    'steel':      ('Steel guitar', 'Guitars & keys', 25, 40, 79, 2.6, False, 2),
    'epiano':     ('Electric piano', 'Guitars & keys', 4, 36, 91, 2.8, False, 2),
    'organ':      ('Church organ', 'Guitars & keys', 19, 36, 84, 3.0, True, 1),
    'accordion':  ('Accordion', 'Guitars & keys', 21, 48, 84, 3.0, True, 1),
    'celesta':    ('Celesta', 'Bells & pads', 8, 60, 96, 2.0, False, 1),
    'musicbox':   ('Music box', 'Bells & pads', 10, 60, 96, 2.0, False, 1),
    'tubular':    ('Tubular bells', 'Bells & pads', 14, 55, 84, 3.2, False, 1),
    'warmpad':    ('Warm pad', 'Bells & pads', 89, 36, 84, 3.2, True, 1),
    'taiko':      ('Taiko drum (tuned)', 'Bells & pads', 116, 36, 60, 1.8, False, 1),
}
VEL = {1: [100], 2: [64, 112]}
LEVEL = {1: [0.9], 2: [0.6, 0.95]}
SR = 44100


def render(sf2, program, notes, vel, held, gap):
    mid = MIDIFile(1); mid.addTempo(0, 0, 60); mid.addProgramChange(0, 0, 0, program)
    for i, m in enumerate(notes):
        mid.addNote(0, 0, m, i * gap, held, vel)
    with tempfile.TemporaryDirectory() as d:
        mp, wp = os.path.join(d, 'a.mid'), os.path.join(d, 'a.wav')
        with open(mp, 'wb') as fh: mid.writeFile(fh)
        subprocess.run(['fluidsynth', '-ni', '-g', '0.8', '-r', str(SR), '-o', 'synth.reverb.active=0', '-o', 'synth.chorus.active=0',
                        '-F', wp, sf2, mp], check=True, capture_output=True)
        w = wave.open(wp); raw = w.readframes(w.getnframes()); ch = w.getnchannels()
        x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
        return x.reshape(-1, ch).mean(axis=1)


def main():
    sf2, dest = sys.argv[1], sys.argv[2]
    mpath = os.path.join(dest, 'manifest.json'); man = json.load(open(mpath))
    for iid, (label, group, prog, lo, hi, held, sus, nl) in INST.items():
        notes = list(range(lo, hi + 1, 3))
        entry = {'label': label, 'group': group, 'sustain': sus, 'layers': {}, 'source': 'GeneralUser GS'}
        for li, vel in enumerate(VEL[nl]):
            gap = held + 2.5
            x = render(sf2, prog, notes, vel, held, gap)
            got = []
            for i, m in enumerate(notes):
                a = int(i * gap * SR); seg = x[a: a + int((held + 0.9) * SR)].copy()
                if len(seg) < SR * 0.3 or np.max(np.abs(seg)) < 1e-3:
                    continue
                thr = np.max(np.abs(seg)) * 0.02; st = max(0, int(np.argmax(np.abs(seg) > thr)) - int(0.003 * SR)); seg = seg[st:]
                fade = int(0.35 * SR); seg[-fade:] *= np.linspace(1, 0, fade) ** 2
                det = detect_pitch(seg, SR)
                if det is not None and abs(det - m) > 0.8 and abs((det - m) - 12 * round((det - m) / 12)) > 0.8 and iid != 'taiko':
                    print(f'  {iid} {m}: heard {det:.1f}', file=sys.stderr)
                seg = seg / np.max(np.abs(seg)) * LEVEL[nl][li]
                save_mp3(seg, SR, os.path.join(dest, iid, f'{m}_{li + 1}.mp3')); got.append(m)
            entry['layers'][str(li + 1)] = got
        man['instruments'][iid] = entry
        print(iid, {k: len(v) for k, v in entry['layers'].items()}, file=sys.stderr)
    man['source2'] = 'GeneralUser GS 2.0 by S. Christian Collins (free licence, see LICENSE.txt)'
    json.dump(man, open(mpath, 'w'), indent=1)


if __name__ == '__main__':
    main()
