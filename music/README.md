# 🎼 VideoGen music generator (Python, no AI)

Composes background music by rules and plays it with **real recorded instrument sounds** (SoundFont).

```bash
pip install midiutil
# Ubuntu:  sudo apt install fluidsynth fluid-soundfont-gm ffmpeg
# Windows: install FluidSynth + FFmpeg, download a free SoundFont (FluidR3_GM.sf2 or GeneralUser GS)

python music_gen.py --style spiritual --raga mohanam --seconds 60 --out flute.mp3
python music_gen.py --style festival --seconds 30 --seed 3      # same seed = same tune
python music_gen.py --list
```

| Style | Melody instrument | Rhythm | Default raga |
|---|---|---|---|
| spiritual | flute | soft tabla-like | Mohanam |
| meditation | pan flute | none | Hindolam |
| devotional | sitar | tabla-like | Mayamalavagowla |
| festival | shehnai | dhol | Hamsadhwani |
| corporate | piano | pop drums | Shankarabharanam |
| happy | marimba | pop drums | Shankarabharanam |
| epic | horns + timpani | war drums | Kharaharapriya |

Ragas: mohanam, hamsadhwani, hindolam, shankarabharanam, kalyani, mayamalavagowla, kharaharapriya, abheri.

The MP3 can be added to any video in the Animator with **🎵 Sound → 📁 Upload**. A `.mid` file is saved too,
so you can open and edit the notes in any music app.
