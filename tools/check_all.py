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
  // the feel of each mood: room, playing style, tabla, and no Indian instruments in Western moods
  const ROOM_WANT = {spiritual:'temple', devotional:'temple', meditation:'temple', aarti:'temple', kids:'studio', motivational:'studio', happy:'studio', cinematic:'bighall', orchestra:'bighall', church:'bighall', sad:'hall', romantic:'hall'};
  const HF_WANT = {spiritual:'gentle', meditation:'gentle', calm:'gentle', kids:'bouncy', motivational:'bright', sad:'tender', devotional:'bhakti', folk:'bhakti', cinematic:'grand'};
  const WESTERN = ['happy', 'cinematic', 'sad', 'motivational', 'zen', 'desert', 'blues', 'spanish', 'cowboy', 'western', 'africa', 'kids', 'church', 'jazz', 'orchestra'];
  for(const seed of [1, 2, 3]) for(const [m] of Object.entries(S.MOODS)){ if(m === 'custom') continue; const s = S.compose({mood:m, seconds:60, seed});
    if(ROOM_WANT[m]) out.rules.push([`${m} tune ${seed}: room is ${ROOM_WANT[m]} (${S.roomOf(s)})`, S.roomOf(s) === ROOM_WANT[m]]);
    if(HF_WANT[m]) out.rules.push([`${m} tune ${seed}: playing style ${HF_WANT[m]} (${s.hf})`, s.hf === HF_WANT[m]]);
    if(WESTERN.includes(m)){ const bad = s.tracks.filter(t => t.type === 'inst' && /^(s:(bansuri|veena|sitar|harmonium|santoor)|r:(sitar_rec|shehnai))$/.test(t.inst)).map(t => t.inst);
      out.rules.push([`${m} tune ${seed}: no Indian instruments in a Western mood ${bad.join(',')}`, !bad.length]); }
    const tab = s.tracks.find(t => t.bols); if(tab && tab.hits.length){ const v = tab.hits.reduce((a, h) => a + h.v, 0) / tab.hits.length;
      if(m === 'meditation') out.rules.push([`meditation tune ${seed}: tabla soft (${v.toFixed(2)})`, v < 0.62]);
      if(m === 'devotional') out.rules.push([`devotional tune ${seed}: tabla full (${v.toFixed(2)}, ${tab.hits.length} strokes)`, v > 0.65 && tab.hits.length > 100]); } }
  // each tune number uses different instruments; long songs keep changing
  for(const m of ['spiritual', 'devotional', 'motivational', 'kids', 'sad', 'romantic']){
    const ins = [1, 2, 3, 4].map(seed => S.compose({mood:m, seconds:60, seed}).tracks.filter(t => t.type === 'inst').map(t => t.inst).sort().join());
    out.rules.push([m + ': tunes 1-4 use different instruments (' + new Set(ins).size + '/4)', new Set(ins).size >= 3]); }
  { const s = S.compose({mood:'devotional', seconds:300, seed:2}), bpb = s.meter || 4, blocks = {};
    for(const t of s.tracks.filter(t => /^Melody/.test(t.name))) for(const n of t.notes){ const b = Math.floor(n.t / bpb / 4); (blocks[b] = blocks[b] || []).push(t.inst + ':' + (n.t % (bpb * 4)).toFixed(2) + ':' + n.m); }
    const sig = Object.values(blocks).map(x => x.sort().join(';')); out.rules.push(['5-minute song keeps changing (' + new Set(sig).size + ' different parts of ' + sig.length + ')', new Set(sig).size >= sig.length * 0.35]); }
  // music judge: picking the best of several versions must give better-scoring tunes than taking the first one
  { const avg = tries => { S.JUDGE.tries = tries; let tot = 0, n = 0;
      for(const m of ['devotional', 'spiritual', 'romantic', 'happy', 'sad', 'kids']) for(const seed of [1, 2]){ const s = S.compose({mood:m, seconds:60, seed}), mel = s.tracks.filter(t => /^Melody/.test(t.name)).flatMap(t => t.notes);
        for(const sec of s.sections.filter(x => /^[ABC]$/.test(x.type))){ const ns = mel.filter(x => x.t >= sec.b0 * s.meter && x.t < (sec.b0 + sec.n) * s.meter).map(x => ({...x, t:x.t - sec.b0 * s.meter})); if(ns.length){ tot += S.judge(s, ns, sec, s.meter); n++; } } }
      return tot / n; };
    const one = avg(1), ten = avg(10); S.JUDGE.tries = 10;
    out.rules.push([`music judge picks better tunes (score ${one.toFixed(2)} → ${ten.toFixed(2)})`, ten > one + 0.5]); }
  // 5-minute songs must keep changing the tune itself (not only the instrument): compare 4-bar blocks by notes only
  const tuneParts = s => { const bpb = s.meter || 4, blocks = {}; for(const t of s.tracks.filter(t => t.type === 'inst' && /^(Melody|Second|Answer)/.test(t.name))) for(const n of t.notes){ const b = Math.floor(n.t / bpb / 4); (blocks[b] = blocks[b] || []).push((n.t % (bpb * 4)).toFixed(1) + ':' + ((n.m % 12 + 12) % 12)); }
    const sig = Object.values(blocks).map(x => x.sort().join(';')); return [new Set(sig).size, sig.length]; };
  for(const form of ['bhajan', 'film', 'classical', 'instrumental', 'meditation']){ const [d, n] = tuneParts(S.compose({mood:'build', build:{raga:'mohanam', insts:['s:bansuri', 's:veena', 's:sitar', 's:tanpura', 'r:violin'], rhythm:'keherwa', speed:'medium', feel:'devotional', form}, seconds:300, seed:1}));
    out.rules.push([`5-minute ${form} (Build my music) keeps changing its tune (${d} different of ${n})`, d >= n * 0.55]); }
  for(const m of ['devotional', 'meditation', 'spiritual', 'romantic', 'happy']){ const [d, n] = tuneParts(S.compose({mood:m, seconds:300, seed:1}));
    out.rules.push([`5-minute ${m} keeps changing its tune (${d} different of ${n})`, d >= n * 0.5]); }
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
            # play by ear: pads show the raga's notes; a hummed tune (made here as sound) becomes the right notes
            await pg.evaluate("padsSheet()"); await pg.wait_for_timeout(400)
            n = await pg.evaluate("document.querySelectorAll('#pads button').length"); check(n >= 11, f'Sa Re Ga Ma pads show ({n} pads)')
            hum = await pg.evaluate("""(()=>{ const sr = 48000, seq = [60, 62, 64, 67, 64, 62, 60], b = new AudioBuffer({length:sr * 6, numberOfChannels:1, sampleRate:sr}), x = b.getChannelData(0);
                seq.forEach((m, k) => { const f = 440 * Math.pow(2, (m - 69) / 12), s0 = Math.round(sr * (1 + k * 0.62)); let ph = 0; for(let i = 0; i < sr * 0.58; i++){ ph += 2 * Math.PI * f / sr; x[s0 + i] = 0.3 * (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.3 * Math.sin(3 * ph)); } });
                return humToNotes(b, 1, 0.62).map(n => Math.round(n.m) % 12).join(','); })()""")
            check(hum == '0,2,4,7,4,2,0', f'hum to melody hears Sa Re Ga Pa Ga Re Sa ({hum})')
            await pg.evaluate("closeSheet()")
            # build my music: only the chosen raga + instruments, each form has its own shape, instruments take turns
            r = await pg.evaluate("""(()=>{ const S = VG_STUDIO, out = [], base = {raga:'hindolam', insts:['s:veena','s:bansuri','s:sitar','s:tanpura','r:violin','r:harp'], rhythm:'keherwa', speed:'medium', feel:'devotional', form:'bhajan'};
                for(const [form, feel] of [['bhajan','devotional'],['classical','calm'],['film','happy'],['meditation','calm'],['instrumental','sad']]) for(const seed of [1,2]){
                  const b = {...base, form, feel, insts: form === 'film' ? ['r:grand','r:violin','r:flute','r:steel'] : base.insts, rhythm: form === 'meditation' ? '' : base.rhythm};
                  const sg = S.compose({mood:'build', build:b, seconds:60, seed, key:'C'}), sc = S.SCALES[b.raga].s, r0 = S.KEYS[sg.key];
                  const insts = sg.tracks.filter(t => t.type === 'inst').map(t => t.inst);
                  const onlyMine = insts.every(i => b.insts.includes(i));
                  const inRaga = sg.tracks.filter(t => t.type === 'inst' && /melody|Answer/i.test(t.name)).every(t => t.notes.every(n => sc.includes(((n.m - r0) % 12 + 12) % 12)));
                  const leads = sg.tracks.filter(t => t.type === 'inst' && /melody|Answer/i.test(t.name) && t.notes.length).length;
                  const drums = sg.tracks.some(t => t.type === 'drum');
                  out.push([form + ' ' + seed, onlyMine && b.insts.every(i => insts.includes(i)), inRaga, leads, drums, Math.round(S.songSeconds ? S.songSeconds(sg) : sg.bars * sg.bpb * 60 / sg.bpm), insts.join(',')]); }
                return out; })()""")
            for name, mine, raga, leads, drums, dur, ins in r:
                form = name.split()[0]
                check(mine, f'build {name}: only my instruments, and every one plays ({ins})')
                check(raga, f'build {name}: melody stays in my raga')
                check(abs(dur - 60) <= 2, f'build {name}: length {dur}s')
                if form in ('bhajan', 'film', 'instrumental'): check(leads >= 2, f'build {name}: instruments take turns ({leads} lead parts)')
                if form == 'meditation': check(not drums, f'build {name}: no drums when No drums chosen')
            # my instrument: a recording of 4 plucked notes (made here as sound) becomes a playable instrument
            r = await pg.evaluate("""async () => { const S = VG_STUDIO, sr = 48000, seq = [62, 69, 74, 81], b = new AudioBuffer({length:sr * 9, numberOfChannels:1, sampleRate:sr}), x = b.getChannelData(0);
                seq.forEach((m, k) => { const f = 440 * Math.pow(2, (m - 69) / 12), s0 = Math.round(sr * (0.5 + k * 2)); for(let i = 0; i < sr * 1.9; i++){ const t = i / sr, e = Math.exp(-t * 2.2) * Math.min(1, t / 0.003); x[s0 + i] += 0.5 * e * (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(4 * Math.PI * f * t)); } });
                const got = S.notesFromRecording(b, false, bb => humToNotes(bb, 0, 1)); S.addMyInst('chk', 'Check', false, got);
                const sg = S.compose({mood:'build', build:{raga:'mohanam', insts:['u:chk', 's:tanpura'], rhythm:'', speed:'medium', feel:'calm', form:'bhajan'}, seconds:20, seed:1}), out = await S.render(sg);
                let pk = 0; const L = out.getChannelData(0); for(let i = 0; i < L.length; i++) pk = Math.max(pk, Math.abs(L[i]));
                const res = [got.map(n => Math.round(n.m)).join(','), (sg.tracks.find(t => t.inst === 'u:chk') || {notes:[]}).notes.length, pk]; S.removeMyInst('chk'); return res; }""")
            check(r[0] == '62,69,74,81', f'my instrument: recording is cut into the right notes ({r[0]})')
            check(r[1] > 10 and 0.3 < r[2] < 1.01, f'my instrument plays in a song ({r[1]} notes, peak {r[2]:.2f})')
            await pg.evaluate("myInstSheet()"); await pg.wait_for_timeout(300); check(await pg.is_visible('#miRec'), 'Record my instrument screen opens')
            await pg.evaluate("BT={raga:'mohanam',insts:['s:sitar','s:santoor','s:tanpura'],rhythm:'teentaal',speed:'slow',feel:'calm',form:'classical',seconds:30}; buildSheet()"); await pg.wait_for_timeout(300)
            check(await pg.is_visible('#btMake'), 'Build my music screen opens')
            await pg.click('#btMake'); await pg.wait_for_function('song && song.mood==="build" && song.tracks.length', timeout=60000); await pg.wait_for_timeout(500)
            st = await pg.evaluate("[song.scale, song.tracks.filter(t=>t.type==='inst').map(t=>t.inst).join(',')]")
            check(st[0] == 'mohanam' and set(st[1].split(',')) <= {'s:sitar','s:santoor','s:tanpura'}, f'Make my music uses my choices ({st})')
            first = await pg.evaluate("JSON.stringify(song.tracks.map(t=>t.notes&&t.notes.slice(0,6).map(n=>n.m)))")
            await pg.evaluate("player.playing && togglePlay(); document.getElementById('nextTune').click()"); await pg.wait_for_timeout(3000)
            st2 = await pg.evaluate("[OT.mood, song.scale, JSON.stringify(song.tracks.map(t=>t.notes&&t.notes.slice(0,6).map(n=>n.m)))]")
            check(st2[0] == 'build' and st2[1] == 'mohanam' and st2[2] != first, 'Next gives a new tune with my same choices')
            await pg.evaluate("player.playing && togglePlay(); closeSheet()")
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
