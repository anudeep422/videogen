# 🎬 VideoGen: make animation videos and music on your phone (no AI)

Free tools that run in the browser, hosted on GitHub Pages. Everything is drawn and played with code.
No AI and no paid services. Telugu and English text supported.

| Tool | What it does | Address |
|---|---|---|
| 🏠 Home | Links to the tools | `/videogen/` |
| ✏️ Animator | Draw, animate, templates, characters, effects, camera, music, export MP4 | `/videogen/animate/` |
| 🎹 Instrument Studio | Music with real instruments, one-tap songs by mood, piano roll, rhythms | `/videogen/studio/` |

| Part | Language | Folder |
|---|---|---|
| Web tools | HTML + JavaScript | `docs/` |
| Python video engine (renders scene files, optional) | Python | `videogen/`, `render.py`, `scenes/` |
| Sample tools | Python | `music/` |
| Hosting and rendering | GitHub Actions (YAML) | `.github/workflows/` |

---

## 1. Put it on GitHub

1. Create a new repository on github.com, for example `videogen`.
2. Upload all files from this folder. You can drag them into the GitHub web page, or run:
   ```bash
   git init && git add . && git commit -m "VideoGen first version"
   git branch -M main
   git remote add origin https://github.com/<your-username>/videogen.git
   git push -u origin main
   ```
3. Go to **Settings → Pages → Source: GitHub Actions**. The editor goes live at
   `https://<your-username>.github.io/videogen/` (the home page with all tools).

## 2. Make a video (works on a phone, no installation)

1. Open the ✏️ Animator → Templates → pick one → change the text.
2. Open the 🎹 Instrument Studio → ✨ Make a full song in one tap → choose mood and length → ☰ → Use this music in the Animator.
3. In the Animator → Export → MP4.

The Python engine can still turn scene files in `scenes/` into videos: `python render.py scenes/village.yaml`,
or on GitHub under **Actions → Render videos → Run workflow**.

## ✏️ VideoGen Animator (draw anything)

Open `https://<your-username>.github.io/videogen/animate/`. It is a drawing app for your own characters and scenes.

**Stage 1 (now):** brush, line, rectangle, circle, fill, text (Telugu and English), eraser, image import,
select / move / resize / rotate, layers (show, hide, lock, reorder, opacity), undo / redo, pinch zoom,
save and open projects (`.anim.json`), and PNG export. Everything is stored as editable shapes, ready to animate.

**📚 Library (86 ready-made elements, all editable):** People (rishi, guru and disciple, village woman with pot,
farmer, grandfather, family, office person, insurance advisor…), Spiritual (Om, diya, lotus, temple, kalasham, Shiva lingam,
conch, rudraksha, trishul, peacock feather…), Nature (trees, palm, banyan, mountains, river, moon, stars, cow, deer, peacock…),
Places (hut, ashram, house, school, city, office, hospital), Things (books, palm-leaf manuscript, bullock cart, car, phone,
money, shield, umbrella, family protection…), Backgrounds (morning, noon, evening and night skies, fields, forest, sunset sea,
gradients), Motion graphics (title bar, lower third, arrow, badge, speech bubble, subscribe button, quote card…) and
Effects (glow, sparkles, light rays, smoke, rain, petals, confetti, fire). Use **Fill** to recolour any part, and
**Ungroup** to edit the pieces. Add your own in `docs/animate/library.js`.

**Stage 2 (now):** timeline with play, scrub and loop. Keyframes: go to a time and move, resize, rotate or fade an object,
and **Auto-key** records it. Drag the diamonds to retime. Easing (smooth, linear, ease in/out, overshoot, bounce, hold),
"show from / to" times, a motion path display, and 12 quick animations (fade, pop, slide in, spin, pulse, shake, bounce).

**🎬 Stage 3 (now): Export video.** Makes a real H.264 **MP4 on your own device** (phone or PC). Nothing is uploaded.
Choose small, standard or high quality, then Download or Share straight to WhatsApp. Works at 16:9, 9:16 (Reels / Shorts) and 1:1.

**🧩 Templates (16 ready animated videos):** Spiritual (Upanishad intro, daily quote, temple good morning, shloka of the day),
Insurance & business (3 reasons to protect your family, advisor introduction, special offer Reel, thank-you message),
YouTube & social (channel intro, subscribe end screen, Top 5 Shorts, square quote post), and Greetings (Diwali, Sankranti,
birthday, good morning Reel). Open one, select a text, tap **✏️ Edit text**, then **🎬 Export video**.
Add your own in `docs/animate/templates.js`.

**🎵 Stage 4 (now): Sound.** Six background music styles made by code (calm flute, tanpura drone, happy, corporate,
epic war drums, festival dhol and shehnai) and 15 sound effects (whoosh, pop, ding, temple bell, conch, drum, sword clash,
explosion, horse gallop, applause, birds, sparkle, cartoon bonk, boing, slide whistle). All are royalty free and no AI.
**Record your voice** while the animation plays, or **upload** your own MP3. Each clip has start time, volume and fade.
Everything is mixed into the exported MP4 (AAC, or Opus where AAC is not available). Templates come with music.

**🎼 Music generator (real instruments, in the Animator):** 🎵 Sound → 🎼 Generate music. Choose a style (spiritual flute,
meditation, devotional sitar, festival shehnai and dhol, corporate piano, happy, epic), a raga (Mohanam, Hamsadhwani,
Hindolam, Shankarabharanam, Kalyani, Mayamalavagowla, Kharaharapriya, Abheri), length, key, speed and tune number.
It composes by rules and plays with real recorded instruments (FluidR3 SoundFont, MIT licence), right in the browser.
Templates use it for their background music. The same generator is also available in Python in `music/`.

**🚶 Stage 6 (now): Animated characters.** 12 characters built on a skeleton: man, woman in saree, boy, girl, farmer,
grandfather, office person, insurance advisor, standing rishi, warrior with sword, archer with bow, and king.
15 one-tap actions: stand, walk, run, jump, sit, wave, namaste, talk, point, clap, dance, bow, fall, sword attack and shoot arrow.
Walk and run move the character forward, and actions chain one after another. Eyes blink, there are 4 expressions
(happy, sad, surprised, angry), and you can change the skin, hair and clothes colours. Select a character and use the
action bar on the canvas. Library → Characters.

**✨ Stage 5 (now): Effects, camera, scenes and text animation.** 30 moving effects: rain, snow, petals, leaves,
fireflies, bubbles, birds, twinkling stars, confetti, sparkles, falling ₹ coins, balloons, fireworks, fire, smoke, dust,
explosion, arrow volley, speed lines and lightning. Transitions: fade, white flash, wipe, circle (iris) and colour slide.
Colour filters: day to night, warm sunset, old film, black and white, and dark corners.
**Camera:** zoom in, zoom out, pan to an object, slow zoom and shake. Titles on 📌 fixed layers stay still.
**Scenes:** ✂️ New scene here ends the current scene with a fade, and new things belong to the next scene.
**Text animation:** typewriter, word by word, letters bounce in, wave and glow (Telugu letters stay whole).

**Scenes (new):** City day and night, Beach, Jungle, Temple courtyard (gopuram), River ghat, Waterfall, Himalaya snow peaks,
Desert, Cave, Space (cosmos), Heaven (golden clouds), Rainy sky, Home (living room) and Office, each also as a ready template.

**Nature & place sounds (new, `docs/animate/ambience.js`):** light and heavy rain, thunderstorm, thunder, wind, river, sea waves,
waterfall, forest, morning birds with koel, village morning (rooster, cows, bells), night (crickets, frogs, owl), fire/homam,
city traffic, crowd, temple, cave drops and cosmic hum. All made with code, any length. Sound panel → 🌧️ Nature & places.
Adding the Rain, Lightning, Fire, Fireflies or Birds effect adds its sound automatically.

## 🎼 Built-in music engine (used by the Animator's Sound panel and the Instrument Studio)

**Synthesised Indian instruments (physical models, no recordings, work offline):** veena, sitar (with sympathetic
strings), tanpura (with jawari buzz), santoor, bansuri (with breath), harmonium, organ, guitar, harp, marimba, xylophone,
glockenspiel, kalimba, vibraphone; tabla bols (dha, dhin, na, tin, tun, te, ge, ke), mridangam strokes (tha, dhi, nam,
chapu, thom, ki, dheem), ghatam, kanjira, dholak, dhol; gajjalu (ankle bells), manjira, taalam, temple bell, cow bells,
wind chimes and singing bowl.

**Styles:** Carnatic (veena, mridangam, ghatam), Hindustani (sitar, tabla Teentaal), Bansuri (tabla Keherwa), Santoor
(tabla Dadra), Dance (veena, mridangam, gajjalu, taalam), Bhajan (harmonium, dholak, manjira, temple bell),
Village folk, Meditation (singing bowls, chimes), Kids, and Acoustic, plus the recorded-sample styles.
Music follows real structure: alap intro, tala cycles with fills, gamakas and meend, climax, and a tihai ending on Sa.
The engine lives in `docs/animate/synth.js` (instruments) and `synthmusic.js` (composer).

**Coming next:** more library elements and templates, crowds for battle scenes, phone install and a Windows app.

Shortcuts on a computer: V select, B brush, L line, R rectangle, O circle, F fill, T text, E eraser, H move view,
Ctrl+Z undo, Ctrl+D duplicate, Delete removes, arrow keys nudge, Space play / pause, K add keyframe.

## 🎹 Instrument Studio (compose with real instruments)

Open `https://<your-name>.github.io/videogen/studio/`. It works like a small GarageBand, on a phone too.

- **Real instruments** (recordings of real players, VSCO 2 Community Edition, public domain): piano, violin, violins, violas, cellos, double bass, pizzicato, harp, flute, clarinet, oboe, bassoon, trumpet, French horn, trombone, tuba, marimba, xylophone, glockenspiel, drum kit, timpani, orchestra percussion.
- **Indian instruments** from our own synthesiser: veena, sitar, santoor, bansuri, harmonium, tanpura, guitar, kalimba; tabla, mridangam, ghatam, kanjira, dholak, dhol, manjira, gajjalu.
- **Tracks**: one instrument or rhythm per track, with mute, solo, volume, left/right and hall echo.
- **Piano roll** with **raga mode** (shows only the raga's notes, with Sa Ri Ga names).
- **Rhythm grid** with Teentaal, Keherwa, Dadra, Rupak, Adi, Rupaka, Misra chapu, folk dholak, bhajan, dhol, rock, pop, latin, waltz, march, cinematic.
- **✨ One-tap song**: choose a mood (spiritual, devotional, temple aarti, Vedic chant style, Carnatic, Hindustani, wedding, festival, calm, happy, cinematic, sad, motivational, folk, romantic, orchestra), the video length in seconds and an optional nature sound. You get intro (alap for Indian moods), verse, chorus, a tihai and an ending, exactly that long.
- **Feel**: Machine, Natural or Loose. Natural adds small timing and loudness changes and accents, like real players.
- **Nature tracks**: rain, storm, river, sea, forest, birds, village, night, fire, city, temple and more, under the music.
- **✨ Auto-fill** (rules and dice, no AI): melody, chords, bass, arpeggio, drone.
- Repeat, metronome, undo, My songs, example songs, project files.
- Download **WAV** or **M4A**, or send the music straight into the **Animator**.

Samples are made by `music/extract_vsco.py` (it checks every note's pitch and fixes octave names).

## 3. Run on your own computer (optional)

Install Python 3.10 or newer and FFmpeg (`ffmpeg` must work in the terminal), then run:

```bash
pip install -r requirements.txt
python render.py scenes/village.yaml            # -> output/village.mp4
python render.py scenes/village.yaml --preview 5 --scene 2   # quick PNG check
python render.py scenes/village.yaml --draft    # fast low-resolution test
python render.py scenes/village.yaml --hd       # 1920x1080
python render.py --all                          # every file in scenes/
python render.py --list                         # all element types
```

On Windows, `pip install pycairo` installs ready-made files. On Linux, first run
`sudo apt install libcairo2-dev pkg-config`. On Mac, first run `brew install cairo pkg-config`.

---

## Scene file format

```yaml
video: {width: 1280, height: 720, fps: 30}      # 1080x1920 for YouTube Shorts / Reels

audio:
  music: flute        # flute | drone | none   (made by code, royalty free)
  key: D
  birds: true
  bells: true
  file: assets/song.mp3        # optional: your own music
  voiceover: assets/voice.mp3  # optional: your narration (music lowers automatically)

scenes:
  - duration: 12          # seconds
    time: morning         # morning | noon | evening | night
    camera: {pan: 100}    # slow camera move to the right (pixels)
    elements:
      - {type: mountains}
      - {type: fields}
      - {type: palm, x: 200, y: 480}
      - {type: woman, x: 1100, y: 690, speed: -36, saree: '#C8102E', pot: brass}
      - {type: cart, x: -400, y: 549, speed: 48, start: 3}
      - {type: text, text: "మా ఊరు", size: 90, y: 220, start: 1, end: 10}
```

**Coordinates:** the screen is 1280×720 and is scaled automatically for other sizes. For ground items,
`y` is the line where they stand. `410` is the horizon (far away and small) and `720` is the bottom of the
screen (close and big). `x` is left or right and moves with the camera.
**Motion:** `speed` is in pixels per second (negative means it moves left). `start` is when it appears.
Text and images use `start`, `end` and `fade`.

### Elements

| Type | Main options |
|---|---|
| `clouds` | `count`, `speed`, `y: [min, max]` |
| `birds` | `count`, `speed`, `y`, `start` |
| `mountains` | `height`, `seed`, `colors`, `mist` |
| `fields` | `seed`, `colors`, `bund` |
| `ground` | `color` (plain ground instead of fields) |
| `road` | `y`, `width`, `color` |
| `river` | `y`, `width`, `flow` |
| `pond` | `x`, `y`, `size`, `lotus` |
| `palm`, `tree`, `bush` | `x`, `y`, `size` |
| `hut` | `x`, `y`, `size`, `wall`, `smoke` (lamp lights up in the evening and at night) |
| `temple` | `x`, `y`, `size`, `color` |
| `smoke` | `x`, `y`, `size` |
| `cart` | `x`, `y`, `speed`, `start`, `load: grass/hay/none`, `turban`, `size` |
| `woman` | `x`, `y`, `speed`, `start`, `saree`, `border`, `blouse`, `pot: brass/clay/steel/copper/none`, `two_pots` |
| `man` | `x`, `y`, `speed`, `start`, `turban`, `shirt`, `shawl`, `dhoti` |
| `grass` | `height`, `color` (foreground grass) |
| `text` | `text`, `x`, `y`, `size`, `color`, `start`, `end`, `fade`, `box`, `font` |
| `image` | `path`, `x`, `y`, `width`, `start`, `end`, `zoom`, `layer: background` |

Scene options: `duration`, `time`, `camera: {x, pan}`, `horizon`, `sun: false`, `fade_in`, `fade_out`,
`vignette`, `auto_sky`.

## Adding your own element (Python)

Add a function to `videogen/elements.py`:

```python
@element('well')                       # now usable as  - {type: well, x: 300, y: 560}
def draw_well(ctx, p):
    x, s = proj(ctx, p.get('x', 0), p['y'])   # perspective position and scale
    cr = ctx.cr                               # a pycairo context; draw anything
    setc(cr, '#9E9E9E'); ellipse(cr, x, p['y'] - 10 * s, 30 * s, 10 * s); cr.fill()
```

To show it in the editor, add a matching entry to `TYPES` and `D` in `docs/index.html`.

## Project layout

```
render.py                 command line
videogen/engine.py        scene loading, frame drawing, parallel rendering, ffmpeg
videogen/elements.py      every drawable thing (add new ones here)
videogen/audio.py         procedural tanpura, flute, birds, bells, plus mixing your files
docs/index.html           VideoGen Studio web editor (GitHub Pages)
scenes/                   your scene files (pushing here triggers a render)
assets/                   your images, music and voiceovers
fonts/                    Noto Sans and Noto Sans Telugu
```

Licence: MIT. Fonts: SIL OFL.
