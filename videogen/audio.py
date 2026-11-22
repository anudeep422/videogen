"""
Soundtrack: synthesised Indian-style background music (no samples, no AI),
optionally mixed with your own music file and a voiceover recording.

audio:
  music: flute        # flute | drone | none
  key: D              # C C# D D# E F F# G G# A A# B
  tempo: 0.62         # seconds per beat (bigger = slower)
  birds: true
  bells: true         # bullock-cart bells
  breeze: true
  volume: 1.0
  file: assets/song.mp3        # optional: your own music (used instead of / with synth)
  file_volume: 0.6
  voiceover: assets/voice.mp3  # optional: narration, music is lowered automatically
  voice_start: 1.0
"""
import random
import subprocess
import wave

import numpy as np

from .util import resolve_path

SR = 44100
KEYS = {k: i for i, k in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
PENTA = [0, 2, 4, 7, 9, 12, 14, 16]


def _synth(cfg, D, seed):
    n = int(SR * D)
    out = np.zeros((n, 2))
    rnd = random.Random(seed)
    nrng = np.random.default_rng(seed)
    base = 130.81 * 2 ** (KEYS.get(str(cfg.get('key', 'D')).upper(), 2) / 12)

    def add(sig, start, pan=0.5, gain=1.0):
        i = int(start * SR)
        if i >= n:
            return
        j = min(n, i + len(sig))
        s = sig[:j - i] * gain
        out[i:j, 0] += s * (1 - pan)
        out[i:j, 1] += s * pan

    music = cfg.get('music', 'flute')
    if music in ('flute', 'drone'):
        pattern, tt, k = [base * 1.5, base, base, base / 2], 0.0, 0
        while tt < D:
            f = pattern[k % 4]
            x = np.arange(int(SR * 3.0)) / SR
            sig = sum((0.6 / h) * np.sin(2 * np.pi * f * h * x + h) for h in range(1, 9))
            sig *= np.exp(-x * 1.1) * (1 - np.exp(-x * 40)) * (1 + 0.3 * np.sin(2 * np.pi * 0.7 * x))
            add(sig, tt, 0.35 + 0.3 * (k % 2), 0.05)
            tt += 0.9
            k += 1
    if music == 'flute':
        beat = cfg.get('tempo', 0.62)
        tt, idx = 2.0, 3
        while tt < D - 2:
            for _ in range(rnd.randint(5, 9)):                 # one phrase
                idx = max(0, min(len(PENTA) - 1, idx + rnd.choice([-2, -1, -1, 1, 1, 2, 0])))
                b = rnd.choice([0.5, 0.5, 1, 1, 1.5])
                L = b * beat
                f = base * 2 * 2 ** (PENTA[idx] / 12)
                m = int(SR * (L + 0.25))
                x = np.arange(m) / SR
                vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * x) * np.clip(x / 0.3, 0, 1)
                ph = 2 * np.cumsum(np.pi * f * vib / SR)
                sig = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph) + 0.04 * nrng.standard_normal(m)
                env = np.clip(x / 0.06, 0, 1) * np.clip((L + 0.25 - x) / 0.25, 0, 1)
                add(sig * env, tt, 0.55, 0.11)
                tt += L
            idx = rnd.choice([0, 2, 3])                          # phrase ends; rest
            tt += beat * rnd.choice([1, 1.5, 2])
    if cfg.get('birds', True):
        for _ in range(int(D * 0.8)):
            st = rnd.uniform(0.5, max(0.6, D - 1))
            x = np.arange(int(SR * rnd.uniform(0.06, 0.14))) / SR
            f = rnd.uniform(2800, 4200) + rnd.uniform(-1500, 1500) * x / x[-1]
            sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * x / x[-1]) ** 2
            for r in range(rnd.randint(1, 3)):
                add(sig, st + r * 0.16, rnd.random(), 0.05)
    if cfg.get('bells', False):
        for k in range(int(D / 0.55)):
            st = k * 0.55 + rnd.uniform(0, 0.05)
            x = np.arange(int(SR * 0.5)) / SR
            sig = sum(np.sin(2 * np.pi * fq * x) for fq in (2100, 2730, 3460)) * np.exp(-x * 12) / 3
            add(sig, st, 0.2 + 0.5 * (st / D), 0.035 * min(1, st / 3))
    if cfg.get('breeze', True):
        t = np.arange(n) / SR
        br = np.convolve(nrng.standard_normal(n), np.ones(400) / 400, 'same')
        out += np.stack([br, br], 1) * 0.6 * (0.6 + 0.4 * np.sin(2 * np.pi * t / 9))[:, None]
    return out


def make_audio(cfg, D, wav_path, tmpdir):
    """Writes the final soundtrack to wav_path. Returns False if the video should be silent."""
    if cfg.get('enabled', True) is False:
        return False
    out = _synth(cfg, D, cfg.get('seed', 5))
    t = np.arange(len(out)) / SR
    fade = np.clip(np.minimum(t / 1.5, (D - t) / 2.0), 0, 1)
    out *= fade[:, None]
    peak = np.max(np.abs(out))
    if peak > 0:
        out = out / peak * 0.85 * cfg.get('volume', 1.0)
    synth_wav = wav_path if not (cfg.get('file') or cfg.get('voiceover')) else wav_path + '.synth.wav'
    with wave.open(synth_wav, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
    if synth_wav == wav_path:
        return True

    # mix with user files using ffmpeg
    inputs, filters, labels = ['-i', synth_wav], [], ['[0:a]']
    music_vol = 0.0 if cfg.get('music') == 'none' and not cfg.get('birds', True) else 1.0
    filters.append(f'[0:a]volume={music_vol}[m0]')
    labels = ['[m0]']
    k = 1
    if cfg.get('file'):
        inputs += ['-stream_loop', '-1', '-i', resolve_path(cfg['file'])]
        filters.append(f"[{k}:a]volume={cfg.get('file_volume', 0.6)},atrim=0:{D},afade=t=out:st={max(0, D - 2)}:d=2[m{k}]")
        labels.append(f'[m{k}]'); k += 1
    bed = ''.join(labels)
    filters.append(f'{bed}amix=inputs={len(labels)}:normalize=0[bed]')
    if cfg.get('voiceover'):
        inputs += ['-i', resolve_path(cfg['voiceover'])]
        d = int(cfg.get('voice_start', 1.0) * 1000)
        filters.append(f"[{k}:a]volume={cfg.get('voice_volume', 1.3)},adelay={d}|{d},apad,asplit=2[v][v2]")
        filters.append('[bed][v]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[bedd]')
        filters.append('[bedd][v2]amix=inputs=2:normalize=0[out]')
    else:
        filters.append('[bed]anull[out]')
    cmd = ['ffmpeg', '-y', '-loglevel', 'error'] + inputs + ['-filter_complex', ';'.join(filters),
                                                            '-map', '[out]', '-t', str(D), '-ar', str(SR), wav_path]
    subprocess.check_call(cmd)
    return True
