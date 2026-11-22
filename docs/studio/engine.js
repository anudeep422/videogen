/* VideoGen Studio sound engine — no AI.
   Real instruments: VSCO 2 Community Edition recordings (CC0) in ./samples.
   Indian instruments and Indian percussion: physical-model synth from ../animate/synth.js.
   window.VG_STUDIO = {load, INSTRUMENTS, KITS, RHYTHMS, SCALES, ...}                          */
(function(){
'use strict';
const SR = 44100;
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const KEYS = {C:48, 'C#':49, D:50, 'D#':51, E:52, F:53, 'F#':54, G:55, 'G#':56, A:57, 'A#':58, B:59};
const SCALES = {
  major:{name:'Major (Shankarabharanam)', s:[0, 2, 4, 5, 7, 9, 11]}, minor:{name:'Minor (Natabhairavi)', s:[0, 2, 3, 5, 7, 8, 10]},
  mohanam:{name:'Mohanam / Bhoopali', s:[0, 2, 4, 7, 9]}, hamsadhwani:{name:'Hamsadhwani', s:[0, 2, 4, 7, 11]},
  hindolam:{name:'Hindolam / Malkauns', s:[0, 3, 5, 8, 10]}, kalyani:{name:'Kalyani / Yaman', s:[0, 2, 4, 6, 7, 9, 11]},
  mayamalavagowla:{name:'Mayamalavagowla / Bhairav', s:[0, 1, 4, 5, 7, 8, 11]}, kharaharapriya:{name:'Kharaharapriya / Kafi', s:[0, 2, 3, 5, 7, 9, 10]},
  abheri:{name:'Abheri / Bhimpalasi', s:[0, 3, 5, 7, 10]}, bhairavi:{name:'Bhairavi (Hindustani)', s:[0, 1, 3, 5, 7, 8, 10]},
  shivaranjani:{name:'Shivaranjani', s:[0, 2, 3, 7, 9]}, revati:{name:'Revati', s:[0, 1, 5, 7, 10]},
  chromatic:{name:'All notes (chromatic)', s:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]},
};
const SWARA = ['Sa', 'Ri₁', 'Ri₂', 'Ga₁', 'Ga₂', 'Ma₁', 'Ma₂', 'Pa', 'Dha₁', 'Dha₂', 'Ni₁', 'Ni₂'];
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);

// ---------------------------------------------------------------- instruments
// real: filled from samples/manifest.json. gain balances loudness between instruments.
const GAIN = {piano:0.75, violin:0.6, violins:0.55, violas:0.55, cellos:0.6, basses:0.7, pizz:0.7, harp:0.7, flute:0.55, clarinet:0.55, oboe:0.5,
  bassoon:0.6, trumpet:0.45, horn:0.5, trombone:0.5, tuba:0.6, marimba:0.7, xylophone:0.5, glock:0.4};
const RELEASE = {piano:0.25, harp:1.2, marimba:0.8, xylophone:0.6, glock:1.5, pizz:0.4};
const SYN = {
  veena:{label:'Veena', range:[48, 84]}, sitar:{label:'Sitar', range:[48, 84]}, santoor:{label:'Santoor', range:[55, 91]},
  bansuri:{label:'Bansuri (flute)', range:[60, 88], sustain:true}, harmonium:{label:'Harmonium', range:[48, 84], sustain:true},
  tanpura:{label:'Tanpura', range:[36, 62]}, guitar:{label:'Acoustic guitar', range:[40, 80]}, kalimba:{label:'Kalimba', range:[60, 88]},
  vibraphone:{label:'Vibraphone', range:[53, 89]}, organ:{label:'Organ', range:[36, 84], sustain:true},
};
const SYNGAIN = {veena:0.9, sitar:0.8, santoor:0.7, bansuri:0.7, harmonium:0.55, tanpura:0.5, guitar:0.8, kalimba:0.8, vibraphone:0.7, organ:0.45};
const INSTRUMENTS = {};   // id -> {label, group, range, kind:'real'|'synth', ...}
let manifest = null;

// ---------------------------------------------------------------- drum kits (rows) and rhythms
const KITS = {
  kit:{label:'Drum kit (real)', rows:[['r:kick', 'Kick'], ['r:snare', 'Snare'], ['r:rim', 'Rim'], ['r:tom_hi', 'Tom'], ['r:conga_open', 'Conga'], ['r:bongo', 'Bongo'],
    ['r:cowbell', 'Cowbell'], ['r:claves', 'Claves'], ['s:shaker', 'Shaker']]},
  orch:{label:'Orchestra percussion (real)', rows:[['r:timpani', 'Timpani'], ['r:timpani_roll', 'Timp roll'], ['r:bdrum_concert', 'Bass drum'], ['r:big_drum', 'Big drum'],
    ['r:snare', 'Snare'], ['r:snare_soft', 'Snare soft'], ['s:bell:small', 'Bell'], ['s:chime', 'Chime']]},
  tabla:{label:'Tabla', rows:[['s:tabla:dha', 'Dha'], ['s:tabla:dhin', 'Dhin'], ['s:tabla:na', 'Na/Ta'], ['s:tabla:tin', 'Tin'], ['s:tabla:tun', 'Tun'],
    ['s:tabla:te', 'Te/Ti'], ['s:tabla:ge', 'Ge'], ['s:tabla:ke', 'Ke']]},
  mridangam:{label:'Mridangam + ghatam', rows:[['s:mri:tha', 'Tha'], ['s:mri:dhi', 'Dhi'], ['s:mri:nam', 'Nam'], ['s:mri:chapu', 'Chapu'], ['s:mri:thom', 'Thom'],
    ['s:mri:ki', 'Ki'], ['s:mri:dheem', 'Dheem'], ['s:ghatam:gum', 'Ghatam gum'], ['s:ghatam:ta', 'Ghatam ta'], ['s:kanjira', 'Kanjira']]},
  folk:{label:'Folk: dholak, dhol, gajjalu', rows:[['s:dholak:dhe', 'Dholak dhe'], ['s:dholak:ta', 'Dholak ta'], ['s:dhol:dhum', 'Dhol dhum'], ['s:dhol:tak', 'Dhol tak'],
    ['s:manjira', 'Manjira'], ['s:manjira:closed', 'Manjira closed'], ['s:gajjalu', 'Gajjalu'], ['s:taalam', 'Taalam'], ['s:shaker', 'Shaker']]},
};
// pattern strings: one char per step. x = hit, o = soft hit, - = rest
const RHYTHMS = {
  teentaal:{name:'Teentaal (16 beats, tabla)', kit:'tabla', steps:16, stepBeats:1, pat:{'s:tabla:dha':'x--xx------o---x', 's:tabla:dhin':'-xx--xx-------x-', 's:tabla:tin':'---------xx-----', 's:tabla:na':'-----------xx---'}},
  keherwa:{name:'Keherwa (8, tabla)', kit:'tabla', steps:8, stepBeats:0.5, pat:{'s:tabla:dha':'x-------', 's:tabla:ge':'-x------', 's:tabla:na':'--x-x--x', 's:tabla:te':'---x----', 's:tabla:ke':'-----x--', 's:tabla:dhin':'------x-'}},
  dadra:{name:'Dadra (6, tabla) — for 3/4', kit:'tabla', steps:6, stepBeats:0.5, pat:{'s:tabla:dha':'x--x--', 's:tabla:dhin':'-x----', 's:tabla:na':'--x--x', 's:tabla:tun':'----x-'}},
  rupak:{name:'Rupak (7, tabla)', kit:'tabla', steps:7, stepBeats:0.5, pat:{'s:tabla:tin':'xxx----', 's:tabla:na':'---x-x-', 's:tabla:dha':'----x-x'}},
  adi:{name:'Adi talam (8 beats, mridangam)', kit:'mridangam', steps:16, stepBeats:0.5, pat:{'s:mri:dheem':'x-------x-------', 's:mri:tha':'--x-------------', 's:mri:ki':'---x---x---x----', 's:mri:dhi':'----x-------xx--', 's:mri:nam':'-----x----x-----', 's:mri:thom':'------x-------x-', 's:ghatam:ta':'-o-o-o-o-o-o-o-o'}},
  rupaka:{name:'Rupaka talam (3 beats, mridangam)', kit:'mridangam', steps:6, stepBeats:0.5, pat:{'s:mri:tha':'x-----', 's:mri:ki':'-x--x-', 's:mri:dhi':'--x---', 's:mri:nam':'---x--', 's:mri:thom':'-----x', 's:ghatam:gum':'x-----'}},
  misrachapu:{name:'Misra chapu (7, mridangam)', kit:'mridangam', steps:7, stepBeats:0.5, pat:{'s:mri:tha':'x------', 's:mri:ki':'-x-----', 's:mri:dhi':'--x-x--', 's:mri:nam':'---x---', 's:mri:thom':'-----x-', 's:mri:dheem':'------x'}},
  dholak:{name:'Folk dholak', kit:'folk', steps:8, stepBeats:0.5, pat:{'s:dholak:dhe':'x---xx--', 's:dholak:ta':'--xx--x-', 's:shaker':'oooooooo', 's:gajjalu':'x---x---'}},
  bhajan:{name:'Bhajan (dholak + manjira)', kit:'folk', steps:8, stepBeats:0.5, pat:{'s:dholak:dhe':'x--x-x--', 's:dholak:ta':'--x---x-', 's:manjira':'x---x---', 's:manjira:closed':'--o---o-'}},
  dhol:{name:'Dhol dance (bhangra)', kit:'folk', steps:8, stepBeats:0.5, pat:{'s:dhol:dhum':'x--x--x-', 's:dhol:tak':'-xx-xx-x', 's:taalam':'x---x---'}},
  rock:{name:'Rock beat', kit:'kit', steps:16, stepBeats:0.25, pat:{'r:kick':'x-----x-x-------', 'r:snare':'----x-------x---', 's:shaker':'o-o-o-o-o-o-o-o-'}},
  pop:{name:'Pop / ballad', kit:'kit', steps:16, stepBeats:0.25, pat:{'r:kick':'x-------x-x-----', 'r:rim':'----x-------x---', 's:shaker':'-o-o-o-o-o-o-o-o'}},
  latin:{name:'Latin (conga, claves)', kit:'kit', steps:16, stepBeats:0.25, pat:{'r:kick':'x-------x-------', 'r:claves':'x--x--x---x-x---', 'r:conga_open':'------x-------x-', 'r:bongo':'--o---o---o---o-', 's:shaker':'oooooooooooooooo'}},
  waltz:{name:'Waltz (3/4)', kit:'kit', steps:12, stepBeats:0.25, pat:{'r:kick':'x-----------', 'r:rim':'----x---x---', 's:shaker':'o-o-o-o-o-o-'}},
  march:{name:'Orchestral march', kit:'orch', steps:16, stepBeats:0.25, pat:{'r:bdrum_concert':'x-------x-------', 'r:snare':'x--xx-x-x--xx-xx', 'r:timpani':'x---------------'}},
  epic:{name:'Cinematic drums', kit:'orch', steps:16, stepBeats:0.25, pat:{'r:big_drum':'x--x--x---x-----', 'r:timpani':'x-------x-----x-', 'r:snare_soft':'------------oooo'}},
};
const velOf = c => c === 'x' ? 1 : c === 'o' ? 0.55 : 0;

// ---------------------------------------------------------------- loading
const bufs = {};       // 'piano/61_f' -> AudioBuffer
const loading = {};
let decodeCtx = null;
const dctx = () => decodeCtx || (decodeCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 1, SR));
async function load(base = './samples/'){
  if(manifest) return manifest;
  manifest = await (await fetch(base + 'manifest.json')).json();
  manifest.base = base;
  for(const [id, v] of Object.entries(manifest.instruments)){
    const all = [].concat(...Object.values(v.layers));
    INSTRUMENTS['r:' + id] = {label:v.label, group:'Real · ' + v.group, kind:'real', id, layers:v.layers, sustain:v.sustain,
      range:[Math.min(...all), Math.max(...all)], gain:GAIN[id] ?? 0.6, release:RELEASE[id] ?? (v.sustain ? 0.3 : 0.6)};
  }
  for(const [id, v] of Object.entries(SYN)) INSTRUMENTS['s:' + id] = {label:v.label, group:'Indian & synth', kind:'synth', id, range:v.range, sustain:!!v.sustain, gain:SYNGAIN[id] ?? 0.6};
  return manifest;
}
function fetchBuf(key){
  if(bufs[key]) return Promise.resolve(bufs[key]);
  if(loading[key]) return loading[key];
  return loading[key] = fetch(manifest.base + key + '.mp3').then(r => { if(!r.ok) throw new Error('missing ' + key); return r.arrayBuffer(); })
    .then(ab => new Promise((res, rej) => dctx().decodeAudioData(ab, res, rej))).then(b => (bufs[key] = b)).catch(e => { console.warn(e); delete loading[key]; return null; });
}
function sampleFor(inst, m, v){
  const I = INSTRUMENTS[inst]; const L = I.layers;
  let layer = L.n ? 'n' : (v >= 0.66 && L.f ? 'f' : (L.p ? 'p' : Object.keys(L)[0]));
  const list = L[layer]; let best = list[0];
  for(const s of list) if(Math.abs(s - m) < Math.abs(best - m) || (Math.abs(s - m) === Math.abs(best - m) && s < m)) best = s;
  return {key:I.id + '/' + best + (layer === 'n' ? '' : '_' + layer), base:best};
}
// synth notes and strokes rendered once and cached as AudioBuffers
const synCache = new Map();
function toBuf(x){ const b = new AudioBuffer({length:Math.max(1, x.length), numberOfChannels:1, sampleRate:SR}); b.copyToChannel(x, 0); return b; }
function synNote(id, m, dur, v){
  const d = Math.max(0.15, Math.round(dur * 20) / 20), vv = Math.round(v * 4) / 4 || 0.25, key = 'n|' + id + '|' + m + '|' + d + '|' + vv;
  let b = synCache.get(key); if(b) return b;
  b = toBuf(window.VG_SYNTH.note(id, hz(m), d, {vel:vv, seed:1 + m % 3})); synCache.set(key, b); return b;
}
function synStroke(name, f, v){
  const key = 's|' + name + '|' + Math.round(f) + '|' + v; let b = synCache.get(key); if(b) return b;
  b = toBuf(window.VG_SYNTH.stroke(name, {f, seed:1, vel:1})); synCache.set(key, b); return b;
}

// ---------------------------------------------------------------- song helpers
const beatsPerBar = s => s.meter || 4;
const totalBeats = s => s.bars * beatsPerBar(s);
const spb = s => 60 / s.bpm;
const songSeconds = s => totalBeats(s) * spb(s);
const rootOf = s => KEYS[s.key] ?? 50;
function audible(s, tr){ const solo = s.tracks.some(t => t.solo); return !tr.mute && (!solo || tr.solo); }

// events: [{s:sec, tr, type:'note'|'hit', ...}] sorted
function events(song){
  const ev = [], k = spb(song), TB = totalBeats(song);
  for(const tr of song.tracks){
    if(tr.type === 'inst'){ for(const n of tr.notes) if(n.t < TB) ev.push({s:n.t * k, dur:Math.min(n.d, TB + 4 - n.t) * k, tr, type:'note', m:n.m, v:n.v ?? 0.8}); }
    else if(tr.type === 'drum'){
      const from = (tr.from || 1) - 1, to = Math.min(tr.to || song.bars, song.bars), b0 = from * beatsPerBar(song), b1 = to * beatsPerBar(song);
      const len = tr.steps * tr.stepBeats;
      for(let cyc = b0; cyc < b1 - 1e-6; cyc += len){
        for(const [row, arr] of Object.entries(tr.grid)) for(let i = 0; i < tr.steps; i++){ const v = arr[i] || 0; const t = cyc + i * tr.stepBeats; if(v && t < b1 - 1e-6) ev.push({s:t * k, tr, type:'hit', row, v}); }
      }
    }
  }
  return ev.sort((a, b) => a.s - b.s);
}
// buffers the song needs (so playback can start without gaps)
function needs(song){
  const keys = new Set(), syn = [];
  for(const e of events(song)){
    if(e.type === 'note'){ const I = INSTRUMENTS[e.tr.inst]; if(!I) continue; if(I.kind === 'real') keys.add(sampleFor(e.tr.inst, e.m, e.v).key); else syn.push(e); }
    else if(e.row.startsWith('r:')) keys.add('drums/' + e.row.slice(2)); else syn.push(e);
  }
  return {keys:[...keys], syn};
}
async function prepare(song, onProgress){
  await load();
  const {keys, syn} = needs(song); let done = 0; const total = keys.length + syn.length || 1;
  await Promise.all(keys.map(k => fetchBuf(k).then(() => onProgress && onProgress(++done / total))));
  const t0 = performance.now();
  for(const e of syn){ bufferFor(song, e); done++; if(performance.now() - t0 > 30){ onProgress && onProgress(done / total); await new Promise(r => setTimeout(r, 0)); } }
  onProgress && onProgress(1);
}
// returns {buf, rate, loop, gain, release} or null if not ready yet
function bufferFor(song, e){
  if(e.type === 'hit'){
    if(e.row.startsWith('r:')){ const b = bufs['drums/' + e.row.slice(2)]; if(!b){ fetchBuf('drums/' + e.row.slice(2)); return null; } return {buf:b, rate:1, gain:0.8}; }
    const name = e.row.slice(2), f = /^(tabla|mri|ghatam|kanjira)/.test(name) ? hz(rootOf(song) + 12) : 300;
    return {buf:synStroke(name, f, 1), rate:1, gain:0.9};
  }
  const I = INSTRUMENTS[e.tr.inst]; if(!I) return null;
  if(I.kind === 'synth') return {buf:synNote(I.id, e.m, I.sustain ? e.dur + 0.1 : Math.max(e.dur, 1.2), e.v), rate:1, gain:I.gain, release:I.sustain ? 0.15 : 0.5, synth:true};
  const sm = sampleFor(e.tr.inst, e.m, e.v), b = bufs[sm.key]; if(!b){ fetchBuf(sm.key); return null; }
  return {buf:b, rate:Math.pow(2, (e.m - sm.base) / 12), gain:I.gain, release:I.release, sustain:I.sustain};
}

// ---------------------------------------------------------------- audio graph
function impulse(ctx, secs = 2.4){
  const n = Math.floor(secs * ctx.sampleRate), b = ctx.createBuffer(2, n, ctx.sampleRate);
  let s = 12345; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for(let c = 0; c < 2; c++){ const d = b.getChannelData(c); for(let i = 0; i < n; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / n, 3) * (i < 300 ? i / 300 : 1); }
  return b;
}
function graph(ctx, song){
  const master = ctx.createGain(); master.gain.value = song.master ?? 0.9;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.2;
  const verb = ctx.createConvolver(); verb.buffer = impulse(ctx); const verbOut = ctx.createGain(); verbOut.gain.value = 0.7;
  verb.connect(verbOut); verbOut.connect(master); master.connect(comp); comp.connect(ctx.destination);
  const G = {ctx, master, comp, verb, tracks:{}};
  for(const tr of song.tracks) trackNode(G, song, tr);
  return G;
}
function trackNode(G, song, tr){
  if(G.tracks[tr.id]) return G.tracks[tr.id];
  const ctx = G.ctx, input = ctx.createGain(), vol = ctx.createGain(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(), send = ctx.createGain();
  input.connect(vol); vol.connect(pan); pan.connect(G.master); vol.connect(send); send.connect(G.verb);
  const n = G.tracks[tr.id] = {input, vol, pan, send}; mixTrack(G, song, tr); return n;
}
function mixTrack(G, song, tr){
  const n = G.tracks[tr.id]; if(!n) return;
  n.vol.gain.value = audible(song, tr) ? (tr.vol ?? 0.8) : 0;
  if(n.pan.pan) n.pan.pan.value = tr.pan || 0;
  n.send.gain.value = tr.verb ?? 0.25;
}
function mixAll(G, song){ for(const tr of song.tracks){ trackNode(G, song, tr); mixTrack(G, song, tr); } }
// play one event at context time `when`; returns the source node
function fire(G, song, e, when, offset = 0){
  const info = bufferFor(song, e); if(!info) return null;
  const ctx = G.ctx, src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = info.buf; src.playbackRate.value = info.rate;
  const vel = e.type === 'hit' ? e.v : 0.3 + 0.7 * e.v;
  g.gain.value = info.gain * vel; src.connect(g); g.connect(trackNode(G, song, e.tr).input);
  if(e.type === 'note'){
    const len = info.buf.duration / info.rate;
    if(info.sustain && e.dur > len - 0.5 && info.buf.duration > 2){ src.loop = true; src.loopStart = 1.0; src.loopEnd = info.buf.duration - 0.45; }
    const end = when + e.dur - offset, rel = info.release || 0.3;
    if(!info.synth || SYN[INSTRUMENTS[e.tr.inst].id].sustain){ g.gain.setValueAtTime(info.gain * vel, Math.max(when, end - 0.001)); g.gain.setTargetAtTime(0, Math.max(when, end), rel / 3); }
    src.start(when, offset * info.rate); src.stop(Math.max(when, end) + rel * 2 + 0.05);
  } else src.start(when, offset);
  return src;
}
function click(G, when, accent){
  const ctx = G.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = accent ? 1760 : 1175;
  g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, when + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
  o.connect(g); g.connect(ctx.destination); o.start(when); o.stop(when + 0.06);
}
function preview(G, song, tr, m, v = 0.8){ return fire(G, song, {type:'note', tr, m, v, dur:0.6}, G.ctx.currentTime + 0.01); }
function previewHit(G, song, tr, row){ return fire(G, song, {type:'hit', tr, row, v:1}, G.ctx.currentTime + 0.01); }

// ---------------------------------------------------------------- live player with lookahead scheduling
class Player {
  constructor(){ this.ctx = null; this.G = null; this.playing = false; this.srcs = new Set(); this.metro = false; this.loop = false; }
  ensure(song){
    if(!this.ctx){ this.ctx = new (window.AudioContext || window.webkitAudioContext)({latencyHint:'interactive'}); }
    if(!this.G || this.G.song !== song){ this.G = graph(this.ctx, song); this.G.song = song; }
    if(this.ctx.state === 'suspended') this.ctx.resume();
    return this.G;
  }
  start(song, fromSec){
    this.stop(); this.ensure(song); this.song = song; this.ev = events(song); this.playing = true;
    const end = songSeconds(song), ls = this.loop ? Math.min(this.loopA ?? 0, end) : 0, le = this.loop ? Math.min(this.loopB ?? end, end) : end;
    if(fromSec >= le - 0.01) fromSec = ls;
    this.segs = [{ctx0:this.ctx.currentTime + 0.08, song0:fromSec, song1:le}]; this.next = fromSec; this.ls = ls; this.le = le;
    // notes that started before the playhead but still sound
    for(const e of this.ev) if(e.type === 'note' && e.s < fromSec && e.s + e.dur > fromSec + 0.05){ const s = fire(this.G, song, e, this.segs[0].ctx0, fromSec - e.s); if(s){ this.srcs.add(s); s.onended = () => this.srcs.delete(s); } }
    this.timer = setInterval(() => this.tick(), 25); this.tick();
  }
  refresh(song){ if(!this.playing) return; const p = this.position(); this.start(song, p); }   // after edits
  tick(){
    if(!this.playing) return;
    const now = this.ctx.currentTime, horizon = now + 0.3;
    for(let guard = 0; guard < 4; guard++){
      const seg = this.segs[this.segs.length - 1], segEndCtx = seg.ctx0 + (seg.song1 - seg.song0);
      const upto = Math.min(seg.song1, seg.song0 + (horizon - seg.ctx0));
      if(upto > this.next){
        for(const e of this.ev){ if(e.s < this.next) continue; if(e.s >= upto) break; const s = fire(this.G, this.song, e, seg.ctx0 + e.s - seg.song0); if(s){ this.srcs.add(s); s.onended = () => this.srcs.delete(s); } }
        if(this.metro){ const k = spb(this.song), bpb = beatsPerBar(this.song); for(let b = Math.ceil(this.next / k - 1e-6); b * k < upto; b++) click(this.G, seg.ctx0 + b * k - seg.song0, b % bpb === 0); }
        this.next = upto;
      }
      if(this.next >= seg.song1 - 1e-6 && horizon >= segEndCtx){
        if(this.loop){ this.segs.push({ctx0:segEndCtx, song0:this.ls, song1:this.le}); this.next = this.ls; if(this.segs.length > 6) this.segs.splice(0, this.segs.length - 6); }
        else { if(now >= segEndCtx + 0.1){ this.stop(true); } break; }
      } else break;
    }
  }
  position(){
    if(!this.playing) return this.pos || 0; const now = this.ctx.currentTime;
    for(let i = this.segs.length - 1; i >= 0; i--){ const s = this.segs[i]; if(now >= s.ctx0 || i === 0) return Math.min(s.song1, s.song0 + Math.max(0, now - s.ctx0)); }
    return 0;
  }
  stop(ended){ if(this.playing) this.pos = ended ? 0 : this.position(); this.playing = false; clearInterval(this.timer);
    for(const s of this.srcs){ try{ s.stop(); }catch(e){} } this.srcs.clear(); if(ended && this.onend) this.onend(); }
}

// ---------------------------------------------------------------- offline render and encoders
async function render(song, onProgress){
  await prepare(song, p => onProgress && onProgress(p * 0.5));
  const len = songSeconds(song) + 2.5, ctx = new OfflineAudioContext(2, Math.ceil(len * SR), SR), G = graph(ctx, song);
  for(const e of events(song)) fire(G, song, e, e.s + 0.02);
  onProgress && onProgress(0.6);
  const out = await ctx.startRendering();
  let pk = 0; for(let c = 0; c < 2; c++){ const d = out.getChannelData(c); for(let i = 0; i < d.length; i++){ const a = Math.abs(d[i]); if(a > pk) pk = a; } }
  // trim silent tail, gentle normalise
  let last = out.length - 1; const L = out.getChannelData(0), R = out.getChannelData(1), thr = pk * 0.001;
  while(last > songSeconds(song) * SR && Math.abs(L[last]) < thr && Math.abs(R[last]) < thr) last--;
  const n = Math.min(out.length, last + Math.floor(0.2 * SR)), res = new AudioBuffer({length:n, numberOfChannels:2, sampleRate:SR}), g = pk > 0.89 || pk < 0.5 ? 0.89 / (pk || 1) : 1;
  for(let c = 0; c < 2; c++){ const s = out.getChannelData(c), d = new Float32Array(n), fo = Math.floor(0.15 * SR); for(let i = 0; i < n; i++) d[i] = s[i] * g * (i > n - fo ? (n - i) / fo : 1); res.copyToChannel(d, c); }
  onProgress && onProgress(1);
  return res;
}
function wavBlob(b){ const L = b.getChannelData(0), R = b.numberOfChannels > 1 ? b.getChannelData(1) : L, n = L.length, ab = new ArrayBuffer(44 + n * 4), v = new DataView(ab);
  const w = (o, s) => { for(let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, b.sampleRate, true);
  v.setUint32(28, b.sampleRate * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
  for(let i = 0; i < n; i++){ v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
  return new Blob([ab], {type:'audio/wav'}); }
async function m4aBlob(b){
  if(!window.AudioEncoder || !window.Mp4Muxer) throw new Error('This browser cannot make M4A. Use WAV');
  let cfg = null; for(const codec of ['mp4a.40.2', 'opus']){ const c = {codec, sampleRate:b.sampleRate, numberOfChannels:2, bitrate:192000}; try{ if((await AudioEncoder.isConfigSupported(c)).supported){ cfg = c; break; } }catch(e){} }
  if(!cfg) throw new Error('This browser cannot make M4A. Use WAV');
  const mux = new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(), audio:{codec:cfg.codec === 'opus' ? 'opus' : 'aac', sampleRate:b.sampleRate, numberOfChannels:2}, fastStart:'in-memory'});
  let err = null; const enc = new AudioEncoder({output:(c, m) => mux.addAudioChunk(c, m), error:e => err = e}); enc.configure(cfg);
  const L = b.getChannelData(0), R = b.getChannelData(1), N = 1024;
  for(let i = 0; i < b.length; i += N){ const n = Math.min(N, b.length - i), d = new Float32Array(n * 2); d.set(L.subarray(i, i + n), 0); d.set(R.subarray(i, i + n), n);
    const ad = new AudioData({format:'f32-planar', sampleRate:b.sampleRate, numberOfFrames:n, numberOfChannels:2, timestamp:Math.round(i / b.sampleRate * 1e6), data:d}); enc.encode(ad); ad.close(); }
  await enc.flush(); if(err) throw err; mux.finalize(); return new Blob([mux.target.buffer], {type:'audio/mp4'});
}

// ---------------------------------------------------------------- auto-fill helpers (rules + dice, no AI)
function rng(seed){ let s = seed | 0 || 1; const f = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  f.pick = a => a[Math.floor(f() * a.length)]; return f; }
function scaleMidis(song, lo, hi){ const sc = (SCALES[song.scale] || SCALES.major).s, r = rootOf(song) % 12, out = []; for(let m = lo; m <= hi; m++) if(sc.includes((m - r + 120) % 12)) out.push(m); return out; }
function chordDegrees(song){ const n = (SCALES[song.scale] || SCALES.major).s.length;
  if(song.scale === 'major') return [0, 4, 5, 3]; if(song.scale === 'minor') return [0, 5, 2, 6]; if(n >= 7) return [0, 3, 4, 0]; if(n === 5) return [0, 3, 2, 0]; return [0, 0, 0, 0]; }
function chordAt(song, bar, center){
  const sc = (SCALES[song.scale] || SCALES.major).s, deg = chordDegrees(song)[bar % 4], r = rootOf(song), n = sc.length;
  const pick = k => { const i = deg + k; return r + sc[i % n] + 12 * Math.floor(i / n); };
  let ch = n >= 5 ? [pick(0), pick(2), pick(4)] : [pick(0), pick(0) + 7];
  while(ch[0] < center - 6) ch = ch.map(m => m + 12); while(ch[0] > center + 6) ch = ch.map(m => m - 12);
  return ch;
}
const RHY4 = [[1, 1, 1, 1], [1.5, 0.5, 1, 1], [0.5, 0.5, 1, 2], [2, 1, 1], [1, 0.5, 0.5, 2], [1, 1, 2], [0.5, 0.5, 0.5, 0.5, 1, 1], [3, 1], [1.5, 1.5, 1]];
const RHY3 = [[1, 1, 1], [2, 1], [1.5, 0.5, 1], [0.5, 0.5, 1, 1], [3]];
function fit(arr, range){ const [lo, hi] = range; return arr.map(m => { while(m < lo) m += 12; while(m > hi) m -= 12; return m; }); }
function auto(song, tr, kind, seed = 1, bars){
  const I = INSTRUMENTS[tr.inst] || {range:[48, 84]}, R = rng(seed * 7919 + kind.length), bpb = beatsPerBar(song), nb = bars || song.bars, out = [];
  const lo = I.range[0], hi = I.range[1], mid = Math.round((lo + hi) / 2), r = rootOf(song);
  if(kind === 'melody'){
    const pool = scaleMidis(song, Math.max(lo, mid - 9), Math.min(hi, mid + 10)); if(!pool.length) return out;
    const home = pool.reduce((b, m) => (m - r) % 12 === 0 && Math.abs(m - mid) < Math.abs(b - mid) ? m : b, pool[0]);
    let idx = pool.indexOf(home); const motif = [];
    for(let bar = 0; bar < nb; bar++){
      const phrasePos = bar % 4; let rh = R.pick(bpb === 3 ? RHY3 : RHY4);
      if(phrasePos === 3) rh = bpb === 3 ? [1, 2] : [1, 1, 2];
      const reuse = phrasePos === 2 && motif.length && R() < 0.5;
      let t = bar * bpb;
      rh.forEach((d, i) => {
        if(reuse && motif[i] !== undefined) idx = Math.max(0, Math.min(pool.length - 1, motif[i] + (R() < 0.5 ? 1 : -1)));
        else { const step = R.pick([-2, -1, -1, 0, 1, 1, 2, 3, -3]); idx = Math.max(0, Math.min(pool.length - 1, idx + step)); }
        if(phrasePos === 3 && i === rh.length - 1){ idx = pool.indexOf(home) + (bar % 8 === 3 && pool.length > 4 ? (R() < 0.5 ? 2 : -2) : 0); idx = Math.max(0, Math.min(pool.length - 1, idx)); }
        if(phrasePos === 0) motif[i] = idx;
        if(!(R() < 0.08 && i > 0)) out.push({t, d:d * 0.95, m:pool[idx], v:i === 0 ? 0.85 : 0.72});
        t += d;
      });
    }
  } else if(kind === 'chords'){
    for(let bar = 0; bar < nb; bar++) for(const m of fit(chordAt(song, bar, Math.max(lo + 5, Math.min(hi - 10, 60))), [lo, hi])) out.push({t:bar * bpb, d:bpb, m, v:0.6});
  } else if(kind === 'bass'){
    for(let bar = 0; bar < nb; bar++){ let m = chordAt(song, bar, 48)[0]; [m] = fit([m - 12], [lo, Math.min(hi, lo + 18)]);
      if(bpb === 3) out.push({t:bar * bpb, d:2.9, m, v:0.8}); else { out.push({t:bar * bpb, d:1.9, m, v:0.85}); out.push({t:bar * bpb + 2, d:1.9, m:R() < 0.5 ? m : m + 7 <= hi ? m + 7 : m, v:0.7}); } }
  } else if(kind === 'arp'){
    for(let bar = 0; bar < nb; bar++){ const ch = fit(chordAt(song, bar, Math.max(lo + 3, Math.min(hi - 14, 62))), [lo, hi]); const seq = [ch[0], ch[1] ?? ch[0] + 7, ch[2] ?? ch[0] + 12, ch[0] + 12, ch[2] ?? ch[0] + 7, ch[1] ?? ch[0] + 12];
      for(let i = 0; i < bpb * 2; i++) out.push({t:bar * bpb + i * 0.5, d:0.9, m:fit([seq[i % seq.length]], [lo, hi])[0], v:i % 2 ? 0.55 : 0.7}); }
  } else if(kind === 'drone'){
    const sa = fit([r], [lo, hi])[0], pa = (SCALES[song.scale] || SCALES.major).s.includes(7) ? sa - 5 : sa - 7;
    const pat = [pa < lo ? pa + 12 : pa, sa + 12 <= hi ? sa + 12 : sa, sa + 12 <= hi ? sa + 12 : sa, sa];
    for(let bar = 0; bar < nb; bar++) pat.forEach((m, i) => out.push({t:bar * bpb + i * bpb / 4, d:bpb * 1.2, m, v:i === 3 ? 0.75 : 0.6}));
  }
  return out;
}

window.VG_STUDIO = {SR, KEYS, SCALES, SWARA, NAMES, noteName, INSTRUMENTS, KITS, RHYTHMS, velOf, load, fetchBuf, prepare, events, graph, mixAll, mixTrack, preview, previewHit,
  Player, render, wavBlob, m4aBlob, auto, scaleMidis, beatsPerBar, totalBeats, spb, songSeconds, rootOf, hz};
})();
