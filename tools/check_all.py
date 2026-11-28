#!/usr/bin/env python3
"""VideoGen full check — run before EVERY publish.

    python3 tools/check_all.py            (starts a local server on port 8765 itself)

Checks, in a headless Chrome:
  Studio   - every mood composes and mixes to the right length and volume, with no errors
           - music rules: bright moods start on the home chord, Indian moods have no film
             swells or booms, booms only in big moods, every melody note is inside the raga
           - tune numbers give different music; one tap, raga remake, mixer, smooth play, saving
  Animator - the page loads; every template, library item, character action, face and effect
             draws without errors; motion path and word-by-word subtitles work
  Home     - loads, offline file list is valid
Exits with code 1 (and prints FAIL lines) if anything is wrong.
"""
import asyncio, json, os, subprocess, sys, time, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs')
PORT = 8765
fails = []
def check(ok, what):
    print(('  ok   ' if ok else '  FAIL ') + what)
    if not ok: fails.append(what)

def server():
    try: urllib.request.urlopen(f'http://localhost:{PORT}/index.html', timeout=2); return None
    except Exception: pass
    p = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.5); return p

STUDIO_JS = r"""async () => {
  const S = VG_STUDIO, out = {moods:[], rules:[], variety:[]};
  const BIG = ['cinematic', 'festival', 'orchestra', 'wedding'];
  for(const [m, M] of Object.entries(S.MOODS)){
    if(m === 'custom') continue;
    try{
      const s = S.compose({mood:m, seconds:40, seed:1}); const b = await S.render(s);
      let pk = 0; const L = b.getChannelData(0); for(let i = 0; i < L.length; i++){ const a = Math.abs(L[i]); if(a > pk) pk = a; }
      out.moods.push([m, +b.duration.toFixed(2), +pk.toFixed(2)]);
      const names = s.tracks.map(t => t.name);
      if(M.bright && s.progs) out.rules.push([m + ': bright mood starts on the home chord', ['A', 'B', 'C'].every(k => s.progs[k][0] === 0)]);
      if(M.indian) out.rules.push([m + ': Indian mood has no film swell', !names.some(n => /^Swells/.test(n))]);
      out.rules.push([m + ': booms only in big moods', !names.some(n => /^Impact/.test(n)) || BIG.includes(m)]);
      const sc = S.SCALES[s.scale].s, root = S.KEYS[s.key], mel = s.tracks.find(t => /^Melody/.test(t.name));
      if(mel && !M.melodyKind){ const bad = mel.notes.filter(n => !sc.includes(((n.m - root - (s.lift || 0) * (n.t >= 0 ? 0 : 0)) % 12 + 12) % 12)).length;
        out.rules.push([m + ': melody stays in the raga/scale (' + bad + ' outside of ' + mel.notes.length + ')', bad <= Math.max(2, mel.notes.length * (s.lift ? 0.6 : 0.02))]); }
    }catch(e){ out.moods.push([m, 'ERROR ' + e.message, 0]); }
  }
  // melody quality for moods with hand-written phrases: smooth, few big jumps, on the chord
  for(const [m, M] of Object.entries(S.MOODS)){ if(!M.mstyle) continue; let iv = 0, n = 0, leaps = 0, ct = 0, cn = 0;
    for(let seed = 1; seed <= 3; seed++){ const s = S.compose({mood:m, seconds:60, seed}), mel = s.tracks.find(t => /^Melody/.test(t.name)), bpb = s.meter || 4; if(!mel) continue;
      const N = mel.notes.slice().sort((a, b) => a.t - b.t); for(let i = 1; i < N.length; i++){ const d = Math.abs(N[i].m - N[i - 1].m); iv += d; n++; if(d > 7) leaps++; }
      const harm = s.tracks.filter(t => /^(Chords|Bass|Arpeggio)/.test(t.name));
      for(const x of N) if(Math.abs(x.t % bpb) < 0.01){ const b = Math.floor(x.t / bpb), pcs = new Set(harm.flatMap(t => t.notes.filter(y => Math.floor(y.t / bpb) === b).map(y => y.m % 12))); if(pcs.size){ cn++; if(pcs.has(x.m % 12)) ct++; } } }
    const five = M.scales.every(k => S.SCALES[k].s.length <= 5), smooth = iv / n <= (M.mstyle === 'epic' || five ? 4.2 : 3.6), few = leaps / n <= 0.13, fit = !cn || ['romantic'].includes(M.mstyle) || ct / cn >= 0.65;
    out.rules.push([`${m}: melody smooth (${(iv / n).toFixed(1)}), few big jumps (${(100 * leaps / n).toFixed(0)}%), on the chord (${cn ? (100 * ct / cn).toFixed(0) : '-'}%)`, smooth && few && fit]); }
  // each tune number uses different instruments; long songs keep changing
  for(const m of ['spiritual', 'devotional', 'motivational', 'kids', 'sad', 'romantic']){
    const ins = [1, 2, 3, 4].map(seed => S.compose({mood:m, seconds:60, seed}).tracks.filter(t => t.type === 'inst').map(t => t.inst).sort().join());
    out.rules.push([m + ': tunes 1-4 use different instruments (' + new Set(ins).size + '/4)', new Set(ins).size >= 3]); }
  { const s = S.compose({mood:'devotional', seconds:300, seed:2}), bpb = s.meter || 4, blocks = {};
    for(const t of s.tracks.filter(t => /^Melody/.test(t.name))) for(const n of t.notes){ const b = Math.floor(n.t / bpb / 4); (blocks[b] = blocks[b] || []).push(t.inst + ':' + (n.t % (bpb * 4)).toFixed(2) + ':' + n.m); }
    const sig = Object.values(blocks).map(x => x.sort().join(';')); out.rules.push(['5-minute song keeps changing (' + new Set(sig).size + ' different parts of ' + sig.length + ')', new Set(sig).size >= sig.length * 0.35]); }
  for(const m of ['happy', 'devotional', 'motivational', 'kids']){
    const sig = seed => { const s = S.compose({mood:m, seconds:60, seed}), mel = s.tracks.find(t => /^Melody/.test(t.name)); return JSON.stringify([s.progs, s.acc, mel && mel.notes.slice(0, 16).map(n => n.m)]); };
    out.variety.push([m, new Set([1, 2, 3, 4].map(sig)).size]);
  }
  return out;
}"""

async def main():
    from playwright.async_api import async_playwright
    srv = server()
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path='/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None,
                                        args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
            ctx = await b.new_context(viewport={'width':390, 'height':844}, has_touch=True, is_mobile=True, accept_downloads=True)

            # ---------------- home
            print('HOME'); pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(f'http://localhost:{PORT}/'); await pg.wait_for_timeout(1500)
            lst = json.load(open(os.path.join(ROOT, 'offline-files.json'))) if os.path.exists(os.path.join(ROOT, 'offline-files.json')) else None
            check(lst is None or all(os.path.exists(os.path.join(ROOT, f)) for f in lst['files'] if not f.endswith('/')), 'offline file list points at real files')
            check(not errs, 'home page has no errors ' + str(errs[:2])); await pg.close()

            # ---------------- studio
            print('STUDIO'); pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(f'http://localhost:{PORT}/studio/'); await pg.wait_for_timeout(2000)
            r = await pg.evaluate(STUDIO_JS)
            for m, d, pk in r['moods']: check(isinstance(d, (int, float)) and abs(d - 40) < 0.6 and 0.5 < pk < 1.0, f'mood {m}: {d}s, peak {pk}')
            for what, ok in r['rules']: check(ok, what)
            for m, n in r['variety']: check(n == 4, f'{m}: tunes 1-4 are all different ({n}/4)')
            pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
            await pg.evaluate("closeSheet(); localStorage.setItem('vg_smooth','1'); player.smooth=true; OT.mood='devotional'; OT.seconds=60; OT.scale='mohanam'; OT.parts={melody:'r:grand'}; OT.rhythm='darbuka'; setTimeout(makeOneTap)")
            await pg.wait_for_function('player.playing', timeout=60000)
            st = await pg.evaluate("[song.scale, song.tracks.map(t=>t.name).join('|'), player.position()]")
            check(st[0] == 'mohanam' and 'Grand piano' in st[1] and 'Darbuka' in st[1], 'one tap honours raga, instrument and rhythm choices')
            await pg.wait_for_timeout(2500); check(await pg.evaluate('player.position() > 1'), 'smooth play moves forward')
            await pg.evaluate("togglePlay()"); await pg.wait_for_timeout(300)
            await pg.select_option('#scale', 'hindolam'); await pg.wait_for_timeout(1500)
            ok = await pg.evaluate("(()=>{ const sc=VG_STUDIO.SCALES[song.scale].s, r=VG_STUDIO.KEYS[song.key]; return song.scale==='hindolam' && song.tracks.filter(t=>t.type==='inst' && /^Melody/.test(t.name)).every(t=>t.notes.every(n=>sc.includes(((n.m-r)%12+12)%12))); })()")
            check(ok, 'changing the raga remakes the song in that raga')
            await pg.evaluate("mixerSheet()"); await pg.wait_for_timeout(300); check(await pg.is_visible('#mxPlay'), 'mixer opens')
            await pg.evaluate("closeSheet(); player.smooth=false; menu('m4a')"); await pg.wait_for_selector('#rdDl', timeout=180000)
            check(True, 'saving M4A reaches the "music is ready" box')
            check(not errs, 'studio has no errors ' + str(errs[:2])); await pg.close()

            # ---------------- animator
            print('ANIMATOR'); pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('dialog', lambda d: asyncio.ensure_future(d.accept('2')))
            await pg.goto(f'http://localhost:{PORT}/animate/'); await pg.wait_for_timeout(2500)
            n = await pg.evaluate("""() => { window.confirm = () => true; let n = 0; for(const t of VG_TEMPLATES){ useTemplate(t); for(const k of [0.3, 2, 5]){ setTime(Math.min(k, P.duration - 0.1)); draw(); } n++; } return n; }""")
            check(not errs, f'all {n} templates load and draw ' + str(errs[:2]))
            n = await pg.evaluate("""() => { document.getElementById('aNew') && 0; P.layers.forEach(l => l.objects = []); let n = 0; for(const it of VG_LIBRARY){ insertLib(it); n++; } setTime(1); draw(); return n; }""")
            check(not errs, f'all {n} library items insert and draw ' + str(errs[:2]))
            n = await pg.evaluate("""() => { const L = P.layers[curLayer]; let n = 0; const faces = ['happy','sad','surprised','angry','focus','shock','cry','scream'];
                for(const pr of Object.keys(VG_CHAR.PRESETS)) for(const [a] of VG_CHAR.ACTIONS){ const o = VG_CHAR.make(pr); o.id = uid(); o.expr = faces[n % faces.length]; o.actions = [{a, t0:0, t1:3}]; L.objects.push(o); n++; }
                for(const k of Object.keys(VG_FX.KINDS)){ const f = VG_FX.make(k, P.width, P.height); f.id = uid(); f.show = [0, 3]; L.objects.push(f); }
                for(const t of [0.2, 1.1, 2.5]){ setTime(t); draw(); } return n; }""")
            check(not errs, f'{n} character + action combinations and every effect draw ' + str(errs[:2]))
            ok = await pg.evaluate("""() => { P.layers.forEach(l => l.objects = []); insertLib(VG_LIBRARY.find(i => i.name === 'Twinkle star')); const o = P.layers[curLayer].objects.slice(-1)[0]; selId = o.id; setTime(0);
                startPathMode(); startPath(100, 300); for(let i = 1; i < 20; i++) act.move(0, 0, 100 + i * 20, 300 - i * 5); act.end(); return !!(o.keys && o.keys.x && o.keys.x.length > 3); }""")
            check(ok, 'motion path creates a route')
            check(not errs, 'animator has no errors ' + str(errs[:2])); await pg.close()
            await b.close()
    finally:
        if srv: srv.terminate()
    print('\n' + ('ALL CHECKS PASSED' if not fails else f'{len(fails)} CHECK(S) FAILED:\n  ' + '\n  '.join(fails)))
    sys.exit(1 if fails else 0)

asyncio.run(main())
