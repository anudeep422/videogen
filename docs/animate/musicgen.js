/* ==========================================================================
   VideoGen Animator – music generator (no AI).
   Composes music by rules (ragas, phrases, rhythm patterns) and plays it with
   real recorded instrument samples (FluidR3 SoundFont, MIT licence) in the
   browser. The same settings always give the same tune.
   window.VG_MUSICGEN.render({style, raga, seconds, key, tempo, seed}) -> Promise<AudioBuffer>
   ========================================================================== */
(function(){
const BASE = (document.currentScript && document.currentScript.src || location.href).replace(/[^/]*$/, '') + 'samples/';
const SR = 44100;
const RAGAS = {
  mohanam:{name:'Mohanam (Bhupali): bright, devotional', s:[0, 2, 4, 7, 9]},
  hamsadhwani:{name:'Hamsadhwani: festive, auspicious', s:[0, 2, 4, 7, 11]},
  hindolam:{name:'Hindolam (Malkauns): deep, meditative', s:[0, 3, 5, 8, 10]},
  shankarabharanam:{name:'Shankarabharanam (major): happy', s:[0, 2, 4, 5, 7, 9, 11]},
  kalyani:{name:'Kalyani (Yaman): evening, peaceful', s:[0, 2, 4, 6, 7, 9, 11]},
  mayamalavagowla:{name:'Mayamalavagowla (Bhairav): morning, temple', s:[0, 1, 4, 5, 7, 8, 11]},
  kharaharapriya:{name:'Kharaharapriya (Kafi): emotional', s:[0, 2, 3, 5, 7, 9, 10]},
  abheri:{name:'Abheri: soulful', s:[0, 3, 5, 7, 10]},
};
const KEYS = {C:48, 'C#':49, D:50, 'D#':51, E:52, F:53, 'F#':54, G:55, 'G#':56, A:57, 'A#':58, B:59};
const STYLES = {
  spiritual: {name:'Spiritual: flute + soft tabla', mel:'flute', pad:'strings', rhythm:'tabla_soft', tempo:72, raga:'mohanam', indian:true},
  meditation:{name:'Meditation: pan flute + drone', mel:'pan_flute', pad:'warm_pad', rhythm:null, tempo:60, raga:'hindolam', indian:true},
  devotional:{name:'Devotional: sitar + tabla', mel:'sitar', pad:'strings', rhythm:'tabla', tempo:84, raga:'mayamalavagowla', indian:true},
  festival:  {name:'Festival: shehnai + dhol', mel:'shehnai', pad:'strings', rhythm:'dhol', tempo:112, raga:'hamsadhwani', indian:true},
  corporate: {name:'Corporate: piano + soft beat', mel:'piano', pad:'warm_pad', rhythm:'pop', tempo:100, raga:'shankarabharanam'},
  happy:     {name:'Happy: marimba + drums', mel:'marimba', pad:'strings', rhythm:'pop', tempo:120, raga:'shankarabharanam'},
  epic:      {name:'Epic: horns + war drums', mel:'french_horn', pad:'slow_strings', rhythm:'epic', tempo:86, raga:'kharaharapriya'},
};
const RHYTHMS = {
  tabla_soft:[[0, 'low_conga', 70], [2, 'mute_conga', 45], [3, 'hi_bongo', 40], [4, 'low_conga', 60], [6, 'hi_conga', 50], [7, 'mute_conga', 35]],
  tabla:[[0, 'low_conga', 90], [1, 'hi_bongo', 50], [2, 'mute_conga', 60], [3, 'hi_bongo', 55], [4, 'low_conga', 80], [5, 'hi_conga', 55], [6, 'mute_conga', 60], [7, 'low_bongo', 50]],
  dhol:[[0, 'floor_tom', 110], [2, 'hi_tom', 70], [3, 'floor_tom', 95], [5, 'hi_tom', 70], [6, 'hi_tom', 75], [1, 'tambourine', 50], [3, 'tambourine', 45], [5, 'tambourine', 50], [7, 'tambourine', 45]],
  pop:[[0, 'kick', 100], [4, 'kick', 90], [2, 'clap', 80], [6, 'clap', 80], ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => [i, 'hat', i % 2 ? 55 : 70])],
  epic:[[0, 'floor_tom', 120], [3, 'floor_tom', 100], [4, 'low_tom', 110], [6, 'floor_tom', 100], [7, 'low_tom', 90]],
};
const CHORDS = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]];
const LEVEL = {mel:0.95, pad:0.32, drone:0.42, bass:0.55, drums:0.62, timp:0.8};

function rng(seed){ let a = (seed >>> 0) || 1; const f = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  f.choice = arr => arr[Math.floor(f() * arr.length)]; f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1)); return f; }

// ---------------------------------------------------------------- composition (same rules as music/music_gen.py)
function compose(o){
  const st = STYLES[o.style] || STYLES.spiritual, scale = RAGAS[o.raga || st.raga].s, tempo = o.tempo || st.tempo, beat = 60 / tempo;
  const root = KEYS[o.key || 'D'], r = rng(o.seed ?? 1), bars = Math.max(4, Math.round((o.seconds || 30) / (beat * 4)));
  const pa = scale.includes(7) ? scale.indexOf(7) : Math.floor(scale.length / 2);
  const N = [], D = [];   // notes: [inst, midi, beatTime, beats, vel, part];  drums: [name, beatTime, vel]
  const note = (inst, n, t, d, v, part) => N.push([inst, n, t, d, v, part]);
  for(let b = 0; b < bars; b++){ const t = b * 4;
    if(st.indian){ [[root, 52], [root + 7, 40], [root + 12, 34]].forEach(([n, v]) => note(st.pad, n, t, 4, v, 'pad'));
      [root + 7, root + 12, root + 12, root].forEach((n, i) => note('sitar', n, t + i, 1.8, i ? 42 : 50, 'drone')); }
    else { const ch = CHORDS[b % 4]; ch.forEach(s => note(st.pad, root + 12 + s, t, 4, 45, 'pad'));
      const bass = o.style === 'epic' ? 'slow_strings' : 'nylon';
      note(bass, root - 12 + ch[0], t, 2, 70, 'bass'); note(bass, root - 12 + ch[0] + (b % 2 ? 7 : 12), t + 2, 2, 60, 'bass');
      for(let i = 0; i < 8; i++) note('harp', root + 24 + ch[[0, 1, 2, 1, 0, 2, 1, 2][i]], t + i * 0.5, 0.5, 38, 'drone');
      if(o.style === 'epic' && b % 2 === 0) note('timpani', root - 12, t, 1, 100, 'timp'); }
  }
  if(st.rhythm){ for(let b = 2; b < bars - 1; b++){
      for(const [step, dr, vel] of RHYTHMS[st.rhythm]) D.push([dr, b * 4 + step * 0.5, Math.max(20, Math.min(127, vel + r.int(-8, 8)))]);
      if(b % 8 === 7) for(let i = 0; i < 4; i++) D.push([['dhol', 'epic', 'pop'].includes(st.rhythm) ? 'hi_tom' : 'hi_bongo', b * 4 + 2 + i * 0.5, 70 + i * 8]);
      if(['pop', 'epic'].includes(st.rhythm) && b % 8 === 2) D.push(['crash', b * 4, 80]); } }
  const durs = {meditation:[2, 2, 3, 4], epic:[1, 2, 2, 3], happy:[0.5, 0.5, 1, 1], festival:[0.5, 0.5, 1, 1.5]}[o.style] || [0.5, 1, 1, 1.5, 2];
  let t = bars > 6 ? 8 : 4; const endT = (bars - 1) * 4, motifs = {}, form = 'AABA'; let k = 0;
  const degNote = (d, base) => { const L = scale.length, oc = Math.floor(d / L), i = ((d % L) + L) % L; return base + 12 * oc + scale[i]; };
  const phrase = (len, start, end) => { const out = []; let d = start; for(let i = 0; i < len; i++){
      if(i === len - 1) d = end; else { d += r.choice([-2, -1, -1, 0, 1, 1, 1, 2, r.choice([-3, 3])]); d = Math.max(-2, Math.min(scale.length + 4, d)); } out.push(d); } return out; };
  const octUp = ['spiritual', 'meditation', 'festival', 'happy', 'corporate'].includes(o.style) ? 12 : 0;
  while(t < endT - 2){ const part = form[k % 4];
    if(!motifs[part] || (part === 'A' && k % 8 === 4)){ const n = r.int(5, 9); motifs[part] = [phrase(n, r.choice([0, pa, scale.length]), r.choice([0, pa, scale.length])), Array.from({length:n}, () => r.choice(durs))]; }
    let [degs, ds] = motifs[part];
    if(k % 4 === 1) degs = degs.map((d, i) => d + (r() < 0.3 && i < degs.length - 1 ? r.choice([-1, 1]) : 0));
    for(let i = 0; i < degs.length && t < endT; i++){ note(st.mel, degNote(degs[i], root + octUp), t, ds[i] * 0.95, r.int(78, 100), 'mel'); t += ds[i]; }
    t += r.choice([1, 2, 2, 3]); k++; }
  note(st.mel, root + (o.style === 'epic' ? 0 : 12), endT, 4, 85, 'mel');
  return {N, D, beat, length:bars * 4 * beat + 2, indian:!!st.indian};
}

// ---------------------------------------------------------------- samples
let manifest = null; const sampleCache = {};
async function getManifest(){ if(!manifest) manifest = await (await fetch(BASE + 'manifest.json')).json(); return manifest; }
async function decode(url){ if(sampleCache[url]) return sampleCache[url];
  return sampleCache[url] = (async () => { const ab = await (await fetch(url)).arrayBuffer(); const c = new OfflineAudioContext(1, 1, SR); return c.decodeAudioData(ab); })(); }
async function loadInstruments(song){
  const m = await getManifest(), need = {}, drums = new Set();
  for(const [inst, n] of song.N){ const notes = m.instruments[inst].notes; let best = notes[0]; for(const x of notes) if(Math.abs(x - n) < Math.abs(best - n)) best = x; (need[inst] = need[inst] || new Set()).add(best); }
  for(const [d] of song.D) drums.add(d);
  const jobs = [];
  for(const inst in need) for(const n of need[inst]) jobs.push(decode(`${BASE}${inst}/${n}.mp3`));
  for(const d of drums) jobs.push(decode(`${BASE}drums/${d}.mp3`));
  await Promise.all(jobs); return m;
}
function impulse(ctx, secs, decay){ const len = Math.floor(secs * ctx.sampleRate), b = ctx.createBuffer(2, len, ctx.sampleRate); const r = rng(11);
  for(let c = 0; c < 2; c++){ const d = b.getChannelData(c); for(let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, decay); } return b; }

const cache = {};
async function render(o){
  const key = JSON.stringify([o.style, o.raga, o.seconds, o.key, o.tempo, o.seed]); if(cache[key]) return cache[key];
  return cache[key] = (async () => {
    const song = compose(o), m = await loadInstruments(song), total = Math.min(o.seconds + 0.5, song.length);
    const ctx = new OfflineAudioContext(2, Math.ceil(total * SR), SR);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3; comp.connect(ctx.destination);
    const dry = ctx.createGain(); dry.gain.value = 0.9; dry.connect(comp);
    const verb = ctx.createConvolver(); verb.buffer = impulse(ctx, song.indian ? 2.6 : 1.8, 3); const wet = ctx.createGain(); wet.gain.value = song.indian ? 0.22 : 0.14; verb.connect(wet); wet.connect(comp);
    const play = (buf, when, rate, gain, dur, pan, hold) => {
      if(when >= total) return; const s = ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate;
      const g = ctx.createGain(); g.gain.setValueAtTime(gain, when);
      let node = g; if(pan && ctx.createStereoPanner){ const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); node = p; }
      s.connect(g); node.connect(dry); node.connect(verb); s.start(when);
      if(dur != null && dur < hold){ g.gain.setValueAtTime(gain, when + dur); g.gain.exponentialRampToValueAtTime(0.0005, when + dur + 0.35); s.stop(when + dur + 0.4); }
    };
    for(const [inst, n, t, d, v, part] of song.N){
      const notes = m.instruments[inst].notes; let best = notes[0]; for(const x of notes) if(Math.abs(x - n) < Math.abs(best - n)) best = x;
      const buf = await sampleCache[`${BASE}${inst}/${best}.mp3`];
      const vel = Math.pow(v / 100, 1.4) * LEVEL[part], pan = part === 'drone' ? ((n % 2) ? 0.3 : -0.3) : part === 'mel' ? 0.05 : 0;
      play(buf, t * song.beat, Math.pow(2, (n - best) / 12), vel, d * song.beat, pan, m.instruments[inst].hold);
    }
    for(const [dr, t, v] of song.D){ const buf = await sampleCache[`${BASE}drums/${dr}.mp3`]; play(buf, t * song.beat, 1, Math.pow(v / 100, 1.3) * LEVEL.drums, null, dr.includes('hi') ? 0.2 : dr.includes('low') ? -0.15 : 0, 9); }
    const out = await ctx.startRendering();
    // even loudness + fade in/out
    let pk = 0; for(let c = 0; c < 2; c++){ const d = out.getChannelData(c); for(let i = 0; i < d.length; i++){ const a = Math.abs(d[i]); if(a > pk) pk = a; } }
    const g = pk ? 0.8 / pk : 1, fi = Math.floor(1.2 * SR), fo = Math.floor(Math.min(3, total / 5) * SR);
    for(let c = 0; c < 2; c++){ const d = out.getChannelData(c), L = d.length; for(let i = 0; i < L; i++){ let k = g; if(i < fi) k *= i / fi; if(i > L - fo) k *= (L - i) / fo; d[i] *= k; } }
    return out;
  })().catch(e => { delete cache[key]; throw e; });
}
window.VG_MUSICGEN = {STYLES, RAGAS, KEYS, render, compose};
})();
