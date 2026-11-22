#!/usr/bin/env python3
"""
VideoGen music generator - composes background music by rules (no AI) and plays it
with real recorded instrument sounds from a free SoundFont.

  python music_gen.py --style spiritual --raga mohanam --seconds 60 --out flute.mp3
  python music_gen.py --style festival  --raga hamsadhwani --seconds 30
  python music_gen.py --style corporate --seconds 45
  python music_gen.py --style epic --seconds 40
  python music_gen.py --list

Needs:  pip install midiutil        and the programs  fluidsynth  +  ffmpeg
        a SoundFont (.sf2), e.g. FluidR3_GM.sf2 or GeneralUser GS (both free).
        Ubuntu: sudo apt install fluidsynth fluid-soundfont-gm ffmpeg

How it works
  1. Composition: pick a raga (scale), then build melody phrases by rules:
     small steps are likely, big jumps are rare, phrases end on Sa or Pa,
     and phrases repeat with variations (A A' B A) like real tunes.
  2. Arrangement: drone (tanpura-like), melody instrument, rhythm pattern
     (tabla-like theka, dhol, or drums) and chords depending on the style.
  3. MIDI: the notes are written to a .mid file.
  4. Sound: FluidSynth plays the .mid with recorded instrument samples.
  5. Finish: ffmpeg evens out the loudness, fades in/out and saves MP3.
"""
import argparse, os, random, shutil, subprocess, sys, tempfile
from midiutil import MIDIFile

RAGAS = {   # semitones above Sa
    'mohanam':         [0, 2, 4, 7, 9],              # Bhupali - bright, devotional
    'hamsadhwani':     [0, 2, 4, 7, 11],             # festive, auspicious
    'hindolam':        [0, 3, 5, 8, 10],             # Malkauns - deep, meditative
    'shankarabharanam':[0, 2, 4, 5, 7, 9, 11],       # Bilawal / major scale
    'kalyani':         [0, 2, 4, 6, 7, 9, 11],       # Yaman - evening, peaceful
    'mayamalavagowla': [0, 1, 4, 5, 7, 8, 11],       # Bhairav - morning, temple
    'kharaharapriya':  [0, 2, 3, 5, 7, 9, 10],       # Kafi - emotional
    'abheri':          [0, 3, 5, 7, 10],             # Bhimpalasi-like - soulful
}
KEYS = {'C': 48, 'C#': 49, 'D': 50, 'D#': 51, 'E': 52, 'F': 53, 'F#': 54, 'G': 55, 'G#': 56, 'A': 57, 'A#': 58, 'B': 59}
# General MIDI instrument numbers (0-based)
GM = dict(piano=0, harp=46, strings=48, slow_strings=49, pad=89, warm_pad=89, choir=52, flute=73, pan_flute=75,
          sitar=104, shehnai=111, oboe=68, timpani=47, brass=61, french_horn=60, celesta=8, marimba=12, nylon=24)
STYLES = {
    #            melody      drone/pad       rhythm       tempo  raga
    'spiritual': ('flute',   'strings',      'tabla_soft', 72, 'mohanam'),
    'meditation':('pan_flute','warm_pad',    None,         60, 'hindolam'),
    'devotional':('sitar',   'strings',      'tabla',      84, 'mayamalavagowla'),
    'festival':  ('shehnai', 'strings',      'dhol',      112, 'hamsadhwani'),
    'corporate': ('piano',   'warm_pad',     'pop',        100, 'shankarabharanam'),
    'happy':     ('marimba', 'strings',      'pop',        120, 'shankarabharanam'),
    'epic':      ('french_horn','slow_strings','epic',     86, 'kharaharapriya'),
}
# drum notes on the GM percussion channel (tabla is approximated with congas / bongos)
DR = dict(kick=36, snare=38, clap=39, hat=42, open_hat=46, crash=49, ride=51, low_tom=45, floor_tom=41, hi_tom=50,
          low_conga=64, hi_conga=63, mute_conga=62, hi_bongo=60, low_bongo=61, tambourine=54, shaker=70, cabasa=69)
RHYTHMS = {   # one bar of 8 eighth-notes: list of (step, drum, velocity)
    'tabla_soft': [(0, 'low_conga', 70), (2, 'mute_conga', 45), (3, 'hi_bongo', 40), (4, 'low_conga', 60), (6, 'hi_conga', 50), (7, 'mute_conga', 35)],
    'tabla':      [(0, 'low_conga', 90), (1, 'hi_bongo', 50), (2, 'mute_conga', 60), (3, 'hi_bongo', 55), (4, 'low_conga', 80), (5, 'hi_conga', 55), (6, 'mute_conga', 60), (7, 'low_bongo', 50)],
    'dhol':       [(0, 'floor_tom', 110), (2, 'hi_tom', 70), (3, 'floor_tom', 95), (5, 'hi_tom', 70), (6, 'hi_tom', 75), (1, 'tambourine', 50), (3, 'tambourine', 45), (5, 'tambourine', 50), (7, 'tambourine', 45)],
    'pop':        [(0, 'kick', 100), (4, 'kick', 90), (2, 'clap', 80), (6, 'clap', 80)] + [(i, 'hat', 55 if i % 2 else 70) for i in range(8)],
    'epic':       [(0, 'floor_tom', 120), (3, 'floor_tom', 100), (4, 'low_tom', 110), (6, 'floor_tom', 100), (7, 'low_tom', 90)],
}
CHORDS = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]]   # I - V - vi - IV  (used by corporate / happy / epic)


def compose_phrase(rnd, scale, length, start_deg, end_on):
    """Melody as scale-degree steps: mostly small moves, ends on Sa or Pa."""
    degs, d = [], start_deg
    for i in range(length):
        if i == length - 1:
            d = end_on
        else:
            d += rnd.choice([-2, -1, -1, 0, 1, 1, 1, 2, rnd.choice([-3, 3])])
            d = max(-2, min(len(scale) + 4, d))
        degs.append(d)
    return degs


def deg_to_note(scale, root, d):
    octave, i = divmod(d, len(scale))
    return root + 12 * octave + scale[i]


def generate(style='spiritual', raga=None, seconds=60, key='D', tempo=None, seed=None, out='music.mp3', sf2=None):
    melody_inst, pad_inst, rhythm, base_tempo, default_raga = STYLES[style]
    raga = raga or default_raga
    scale = RAGAS[raga]
    tempo = tempo or base_tempo
    rnd = random.Random(seed if seed is not None else random.randrange(1 << 30))
    root = KEYS[key]
    beat = 60 / tempo
    bars = max(4, round(seconds / (beat * 4)))
    pa = scale.index(7) if 7 in scale else len(scale) // 2   # degree of Pa (or middle note)

    m = MIDIFile(6, adjust_origin=False)   # 5 instrument tracks + 1 drum track (MIDI channel 10)
    for t in range(6):
        m.addTempo(t, 0, tempo)
    MEL, PAD, DRONE, CH, BASS = 0, 1, 2, 3, 4
    m.addProgramChange(MEL, MEL, 0, GM[melody_inst])
    m.addProgramChange(PAD, PAD, 0, GM[pad_inst])
    indian = style in ('spiritual', 'meditation', 'devotional', 'festival')
    m.addProgramChange(DRONE, DRONE, 0, GM['sitar'] if indian else GM['harp'])
    m.addProgramChange(BASS, BASS, 0, GM['slow_strings'] if style == 'epic' else (GM['strings'] if indian else GM['nylon']))
    if style == 'epic':
        m.addProgramChange(CH, CH, 0, GM['timpani'])

    # --- drone / pad: sustained Sa + Pa (Indian) or chord pads (western)
    for b in range(bars):
        t = b * 4
        if indian:
            for n, v in ((root, 52), (root + 7, 40), (root + 12, 34)):
                m.addNote(PAD, PAD, n, t, 4, v)
            for i, n in enumerate([root + 7, root + 12, root + 12, root]):   # tanpura-like pluck cycle
                m.addNote(DRONE, DRONE, n, t + i, 1.8, 42 if i else 50)
        else:
            ch = CHORDS[b % 4]
            for s in ch:
                m.addNote(PAD, PAD, root + 12 + s, t, 4, 45)
            m.addNote(BASS, BASS, root - 12 + ch[0], t, 2, 70); m.addNote(BASS, BASS, root - 12 + ch[0] + (7 if b % 2 else 12), t + 2, 2, 60)
            for i in range(8):   # light arpeggio
                m.addNote(DRONE, DRONE, root + 24 + ch[[0, 1, 2, 1, 0, 2, 1, 2][i]], t + i * 0.5, 0.5, 38)
            if style == 'epic' and b % 2 == 0:
                m.addNote(CH, CH, root - 12, t, 1, 100)

    # --- rhythm (after a 2-bar intro), with a fill every 8th bar
    if rhythm:
        for b in range(2, bars - 1):
            for step, drum, vel in RHYTHMS[rhythm]:
                v = max(20, min(127, vel + rnd.randint(-8, 8)))
                m.addNote(5, 9, DR[drum], b * 4 + step * 0.5, 0.5, v)
            if b % 8 == 7:
                for i in range(4):
                    m.addNote(5, 9, DR['hi_tom' if rhythm in ('dhol', 'epic', 'pop') else 'hi_bongo'], b * 4 + 2 + i * 0.5, 0.5, 70 + i * 8)
            if rhythm in ('pop', 'epic') and b % 8 == 2:
                m.addNote(5, 9, DR['crash'], b * 4, 2, 80)

    # --- melody: A A' B A form, phrases of 2 bars, rests between
    durs_by_style = {'meditation': [2, 2, 3, 4], 'epic': [1, 2, 2, 3], 'happy': [0.5, 0.5, 1, 1], 'festival': [0.5, 0.5, 1, 1.5]}
    durs = durs_by_style.get(style, [0.5, 1, 1, 1.5, 2])
    t = 8.0 if bars > 6 else 4.0
    end_t = (bars - 1) * 4
    motifs = {}
    form = 'AABA'
    k = 0
    while t < end_t - 2:
        part = form[k % 4]
        if part not in motifs or (part == 'A' and k % 8 == 4):   # new idea now and then
            n = rnd.randint(5, 9)
            motifs[part] = (compose_phrase(rnd, scale, n, rnd.choice([0, pa, len(scale)]), rnd.choice([0, pa, len(scale)])),
                            [rnd.choice(durs) for _ in range(n)])
        degs, ds = motifs[part]
        if k % 4 == 1:   # variation: shift a few notes
            degs = [d + (rnd.choice([-1, 1]) if rnd.random() < 0.3 and i < len(degs) - 1 else 0) for i, d in enumerate(degs)]
        oct_shift = 12 if style in ('spiritual', 'meditation', 'festival', 'happy', 'corporate') else 0
        for d, du in zip(degs, ds):
            if t >= end_t:
                break
            note = deg_to_note(scale, root + oct_shift, d)
            m.addNote(MEL, MEL, note, t, du * 0.95, rnd.randint(78, 100))
            t += du
        t += rnd.choice([1, 2, 2, 3])   # breathing space
        k += 1
    # final Sa
    m.addNote(MEL, MEL, root + (12 if style != 'epic' else 0), end_t, 4, 85)

    # --- render
    sf2 = sf2 or find_soundfont()
    if not sf2:
        sys.exit('No SoundFont found. Install fluid-soundfont-gm or pass --sf2 path/to/file.sf2')
    for prog in ('fluidsynth', 'ffmpeg'):
        if not shutil.which(prog):
            sys.exit(f'{prog} is not installed.')
    tmp = tempfile.mkdtemp(prefix='musicgen_')
    mid, wav = os.path.join(tmp, 'song.mid'), os.path.join(tmp, 'song.wav')
    with open(mid, 'wb') as f:
        m.writeFile(f)
    subprocess.run(['fluidsynth', '-ni', '-g', '0.7', '-r', '44100', '-F', wav, sf2, mid], check=True, capture_output=True)
    length = bars * 4 * beat + 2
    fade = min(3, length / 6)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-t', f'{length:.2f}',
                    '-af', f'afade=t=in:d=1.5,afade=t=out:st={length - fade:.2f}:d={fade:.2f},loudnorm=I=-16:TP=-1.5:LRA=11',
                    '-ar', '44100', '-b:a', '192k', out], check=True)
    shutil.copy(mid, os.path.splitext(out)[0] + '.mid')
    shutil.rmtree(tmp, ignore_errors=True)
    print(f'Saved {out}  ({style}, raga {raga}, {tempo} bpm, key {key}, {length:.0f}s)  + .mid for editing')
    return out


def find_soundfont():
    for p in ['GeneralUser GS.sf2', 'soundfont.sf2', '/usr/share/sounds/sf2/FluidR3_GM.sf2', '/usr/share/sounds/sf2/default-GM.sf2',
              '/usr/share/soundfonts/FluidR3_GM.sf2', 'C:/soundfonts/FluidR3_GM.sf2']:
        if os.path.exists(p):
            return p
    return None


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='Rule-based music generator with real instrument sounds (no AI).')
    ap.add_argument('--style', default='spiritual', choices=list(STYLES))
    ap.add_argument('--raga', choices=list(RAGAS), help='scale to use (default depends on style)')
    ap.add_argument('--seconds', type=float, default=60)
    ap.add_argument('--key', default='D', choices=list(KEYS))
    ap.add_argument('--tempo', type=int)
    ap.add_argument('--seed', type=int, help='same seed = same tune')
    ap.add_argument('--sf2', help='SoundFont file')
    ap.add_argument('--out', default='music.mp3')
    ap.add_argument('--list', action='store_true')
    a = ap.parse_args()
    if a.list:
        print('Styles:', ', '.join(STYLES)); print('Ragas: ', ', '.join(RAGAS)); sys.exit()
    generate(a.style, a.raga, a.seconds, a.key, a.tempo, a.seed, a.out, a.sf2)
