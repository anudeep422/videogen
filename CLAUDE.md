# VideoGen — rules for working on this project

- The owner (Anudeep) works from his phone, speaks Telugu, and wants short, simple answers.
- The app is plain HTML/JavaScript in `docs/` (GitHub Pages). No AI is used inside the app.

## Before EVERY publish (push)
1. Run `python3 tools/check_all.py` (needs Playwright + Chrome). It must end with **ALL CHECKS PASSED**.
   It checks every Studio mood (length, volume, music rules), the main Studio flows, every Animator
   template, library item, character action, face and effect, one-tap video (every style and shape),
   Build my music, Record my instrument, the music judge, and the home page.
2. When you change music rules or moods, add a rule to `STUDIO_JS` in that script so it stays checked.
3. After pushing, confirm the Pages deploy succeeded; if it failed with "Fetching artifact metadata",
   re-run it later (`gh api -X POST repos/anudeep422/videogen/actions/workflows/pages.yml/dispatches -f ref=main`).
4. The script cannot judge how music *feels*; ask the owner to listen after music changes.

## Music must match the mood (owner's rule)
Every music feature (melody style, instruments, speed, rhythm/tabla, human feel, room echo) must be tuned per mood,
and each mood must sound like its name. When changing music, compose 2–3 tunes in every mood and check this,
and keep per-mood rules in `tools/check_all.py`.
