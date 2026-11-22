#!/usr/bin/env python3
"""
Extracts short instrument recordings from a SoundFont into small MP3 files for the
browser music generator (docs/animate/samples/). Run once; the files are committed.

  python extract_samples.py --sf2 /usr/share/sounds/sf2/FluidR3_GM.sf2

FluidR3_GM is released under the MIT licence by Frank Wen.
"""
import argparse, json, os, shutil, subprocess, tempfile
import numpy as np, wave
from midiutil import MIDIFile

# name: (GM program, first note, last note, step, seconds held, tail)
INSTRUMENTS = {
    'flute':        (73, 60, 88, 4, 3.6, 0.6),
    'pan_flute':    (75, 60, 88, 4, 3.6, 0.6),
    'sitar':        (104, 48, 84, 4, 2.6, 0.4),
    'shehnai':      (111, 60, 88, 4, 3.0, 0.4),
    'strings':      (48, 36, 84, 6, 4.2, 0.8),
    'slow_strings': (49, 36, 84, 6, 4.2, 0.8),
    'warm_pad':     (89, 36, 84, 6, 4.2, 0.8),
    'piano':        (0, 36, 96, 6, 2.6, 0.4),
    'marimba':      (12, 60, 96, 6, 1.2, 0.2),
    'french_horn':  (60, 38, 74, 6, 3.0, 0.5),
    'timpani':      (47, 36, 48, 6, 2.6, 0.4),
    'harp':         (46, 48, 96, 6, 2.6, 0.4),
    'nylon':        (24, 36, 72, 6, 2.2, 0.4),
}
DRUMS = {'kick': 36, 'snare': 38, 'clap': 39, 'hat': 42, 'open_hat': 46, 'crash': 49, 'low_tom': 45, 'floor_tom': 41,
         'hi_tom': 50, 'low_conga': 64, 'hi_conga': 63, 'mute_conga': 62, 'hi_bongo': 60, 'low_bongo': 61, 'tambourine': 54}
GAP = 7.0   # seconds between notes in the render


def render(sf2, notes, program, drum, secs, tmp):
    m = MIDIFile(1); m.addTempo(0, 0, 60)
    ch = 9 if drum else 0
    if not drum:
        m.addProgramChange(0, ch, 0, program)
    for i, n in enumerate(notes):
        m.addNote(0, ch, n, i * GAP, secs, 100)
    mid, wav = os.path.join(tmp, 'x.mid'), os.path.join(tmp, 'x.wav')
    with open(mid, 'wb') as f: m.writeFile(f)
    subprocess.run(['fluidsynth', '-ni', '-R', '0', '-C', '0', '-g', '0.8', '-r', '44100', '-F', wav, sf2, mid], check=True, capture_output=True)
    with wave.open(wav) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, w.getnchannels()).astype(np.float32).mean(axis=1) / 32768
    return a


def save_mp3(x, path):
    tmpw = path + '.wav'
    y = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(tmpw, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(44100); w.writeframes(y.tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmpw, '-codec:a', 'libmp3lame', '-b:a', '80k', '-ac', '1', path], check=True)
    os.remove(tmpw)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--sf2', default='/usr/share/sounds/sf2/FluidR3_GM.sf2')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'docs', 'animate', 'samples'))
    a = ap.parse_args()
    out = os.path.abspath(a.out); shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
    tmp = tempfile.mkdtemp(); SR = 44100; manifest = {'instruments': {}, 'drums': {}, 'license': 'FluidR3_GM by Frank Wen, MIT licence'}
    for name, (prog, lo, hi, step, secs, tail) in INSTRUMENTS.items():
        notes = list(range(lo, hi + 1, step)); audio = render(a.sf2, notes, prog, False, secs, tmp)
        os.makedirs(os.path.join(out, name)); clips = []
        for i, n in enumerate(notes):
            seg = audio[int(i * GAP * SR): int((i * GAP + secs + tail) * SR)].copy(); clips.append(seg)
        peak = max(np.abs(c).max() for c in clips) or 1
        for n, seg in zip(notes, clips):
            seg = seg / peak * 0.89
            f = int(0.01 * SR); seg[-f:] *= np.linspace(1, 0, f)   # click-free end
            save_mp3(seg, os.path.join(out, name, f'{n}.mp3'))
        manifest['instruments'][name] = {'notes': notes, 'hold': secs}
        print(name, notes)
    os.makedirs(os.path.join(out, 'drums'))
    names = list(DRUMS); audio = render(a.sf2, [DRUMS[k] for k in names], 0, True, 0.3, tmp); segs = []
    for i, k in enumerate(names):
        segs.append(audio[int(i * GAP * SR): int((i * GAP + (3.0 if k == 'crash' else 1.4)) * SR)].copy())
    peak = max(np.abs(c).max() for c in segs) or 1
    for k, seg in zip(names, segs):
        seg = seg / peak * 0.89; f = int(0.01 * SR); seg[-f:] *= np.linspace(1, 0, f)
        save_mp3(seg, os.path.join(out, 'drums', f'{k}.mp3'))
    manifest['drums'] = names
    with open(os.path.join(out, 'manifest.json'), 'w') as f: json.dump(manifest, f)
    shutil.rmtree(tmp)
    total = sum(os.path.getsize(os.path.join(r, x)) for r, _, fs in os.walk(out) for x in fs)
    print(f'saved to {out}  ({total / 1e6:.1f} MB)')


if __name__ == '__main__':
    main()
