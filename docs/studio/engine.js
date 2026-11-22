/* VideoGen Studio sound engine — no AI.
   Real instruments: VSCO 2 Community Edition recordings (CC0) in ./samples.
   Indian instruments and Indian percussion: physical-model synth from ../animate/synth.js.
   window.VG_STUDIO = {load, compose, MOODS, INSTRUMENTS, KITS, RHYTHMS, SCALES, ...}                          */
(function(){
'use strict';
const SR = 44100;
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const KEYS = {C:48, 'C#':49, D:50, 'D#':51, E:52, F:53, 'F#':54, G:55, 'G#':56, A:57, 'A#':58, B:59};
const SCALES = {
  // Indian · 7 notes (melakarta / thaat), with the matching Western mode where there is one
  major:{g:'Indian · 7 notes', name:'Shankarabharanam / Bilawal (= Western major)', s:[0, 2, 4, 5, 7, 9, 11]},
  kalyani:{g:'Indian · 7 notes', name:'Kalyani / Yaman (= Lydian)', s:[0, 2, 4, 6, 7, 9, 11]},
  kharaharapriya:{g:'Indian · 7 notes', name:'Kharaharapriya / Kafi (= Dorian)', s:[0, 2, 3, 5, 7, 9, 10]},
  minor:{g:'Indian · 7 notes', name:'Natabhairavi / Asavari (= natural minor)', s:[0, 2, 3, 5, 7, 8, 10]},
  harikambhoji:{g:'Indian · 7 notes', name:'Harikambhoji / Khamaj (= Mixolydian)', s:[0, 2, 4, 5, 7, 9, 10]},
  bhairavi:{g:'Indian · 7 notes', name:'Hanumatodi / Bhairavi (= Phrygian)', s:[0, 1, 3, 5, 7, 8, 10]},
  mayamalavagowla:{g:'Indian · 7 notes', name:'Mayamalavagowla / Bhairav (= Arabic double harmonic)', s:[0, 1, 4, 5, 7, 8, 11]},
  charukesi:{g:'Indian · 7 notes', name:'Charukesi', s:[0, 2, 4, 5, 7, 8, 10]},
  keeravani:{g:'Indian · 7 notes', name:'Keeravani (= harmonic minor)', s:[0, 2, 3, 5, 7, 8, 11]},
  gowrimanohari:{g:'Indian · 7 notes', name:'Gowrimanohari / Patdeep (= melodic minor)', s:[0, 2, 3, 5, 7, 9, 11]},
  hemavati:{g:'Indian · 7 notes', name:'Hemavati (= Ukrainian Dorian)', s:[0, 2, 3, 6, 7, 9, 10]},
  simhendra:{g:'Indian · 7 notes', name:'Simhendramadhyamam (= Hungarian minor)', s:[0, 2, 3, 6, 7, 8, 11]},
  shanmukhapriya:{g:'Indian · 7 notes', name:'Shanmukhapriya', s:[0, 2, 3, 6, 7, 8, 10]},
  latangi:{g:'Indian · 7 notes', name:'Latangi', s:[0, 2, 4, 6, 7, 8, 11]},
  vachaspati:{g:'Indian · 7 notes', name:'Vachaspati (= Lydian dominant)', s:[0, 2, 4, 6, 7, 9, 10]},
  chakravakam:{g:'Indian · 7 notes', name:'Chakravakam / Ahir Bhairav', s:[0, 1, 4, 5, 7, 9, 10]},
  vakulabharanam:{g:'Indian · 7 notes', name:'Vakulabharanam (= Hijaz / Spanish)', s:[0, 1, 4, 5, 7, 8, 10]},
  kamavardhini:{g:'Indian · 7 notes', name:'Kamavardhini / Poorvi, Puriya Dhanashri', s:[0, 1, 4, 6, 7, 8, 11]},
  gamanashrama:{g:'Indian · 7 notes', name:'Gamanashrama / Marwa', s:[0, 1, 4, 6, 7, 9, 11]},
  subhapantuvarali:{g:'Indian · 7 notes', name:'Subhapantuvarali / Todi, Multani', s:[0, 1, 3, 6, 7, 8, 11]},
  lalit:{g:'Indian · 7 notes', name:'Lalit', s:[0, 1, 4, 5, 6, 9, 11]},
  desh:{g:'Indian · 7 notes', name:'Desh (both Ni)', s:[0, 2, 4, 5, 7, 9, 10, 11]},
  // Indian · 5 and 6 notes
  mohanam:{g:'Indian · 5–6 notes', name:'Mohanam / Bhoopali (= major pentatonic, Chinese)', s:[0, 2, 4, 7, 9]},
  hamsadhwani:{g:'Indian · 5–6 notes', name:'Hamsadhwani', s:[0, 2, 4, 7, 11]},
  hindolam:{g:'Indian · 5–6 notes', name:'Hindolam / Malkauns', s:[0, 3, 5, 8, 10]},
  abheri:{g:'Indian · 5–6 notes', name:'Abheri / Bhimpalasi (= minor pentatonic)', s:[0, 3, 5, 7, 10]},
  madhyamavati:{g:'Indian · 5–6 notes', name:'Madhyamavati / Megh, Brindavani (= Egyptian)', s:[0, 2, 5, 7, 10]},
  durga:{g:'Indian · 5–6 notes', name:'Suddha Saveri / Durga (= Japanese Yo)', s:[0, 2, 5, 7, 9]},
  shivaranjani:{g:'Indian · 5–6 notes', name:'Shivaranjani', s:[0, 2, 3, 7, 9]},
  revati:{g:'Indian · 5–6 notes', name:'Revati (Vedic feel)', s:[0, 1, 5, 7, 10]},
  sriranjani:{g:'Indian · 5–6 notes', name:'Sriranjani', s:[0, 2, 3, 5, 9, 10]},
  hamsanandi:{g:'Indian · 5–6 notes', name:'Hamsanandi / Sohini', s:[0, 1, 4, 6, 9, 11]},
  amritavarshini:{g:'Indian · 5–6 notes', name:'Amritavarshini', s:[0, 4, 6, 7, 11]},
  vasantha:{g:'Indian · 5–6 notes', name:'Vasantha', s:[0, 1, 4, 5, 9, 11]},
  nata:{g:'Indian · 5–6 notes', name:'Nata', s:[0, 3, 4, 5, 7, 11]},
  valaji:{g:'Indian · 5–6 notes', name:'Valaji / Kalavati', s:[0, 4, 7, 9, 10]},
  nagaswaravali:{g:'Indian · 5–6 notes', name:'Nagaswaravali', s:[0, 4, 5, 7, 9]},
  bowli:{g:'Indian · 5–6 notes', name:'Bowli', s:[0, 1, 4, 7, 8, 11]},
  malayamarutham:{g:'Indian · 5–6 notes', name:'Malayamarutham', s:[0, 1, 4, 7, 9, 10]},
  megharanjani:{g:'Indian · 5–6 notes', name:'Megharanjani', s:[0, 1, 4, 5, 11]},
  jog:{g:'Indian · 5–6 notes', name:'Jog', s:[0, 3, 4, 5, 7, 10]},
  chandrakauns:{g:'Indian · 5–6 notes', name:'Chandrakauns', s:[0, 3, 5, 8, 11]},
  gunkali:{g:'Indian · 5–6 notes', name:'Gunkali (= Japanese In)', s:[0, 1, 5, 7, 8]},
  vibhas:{g:'Indian · 5–6 notes', name:'Vibhas', s:[0, 1, 4, 7, 8]},
  // Western
  blues:{g:'Western', name:'Blues', s:[0, 3, 5, 6, 7, 10]},
  locrian:{g:'Western', name:'Locrian', s:[0, 1, 3, 5, 6, 8, 10]},
  neapolitan:{g:'Western', name:'Neapolitan minor', s:[0, 1, 3, 5, 7, 8, 11]},
  wholetone:{g:'Western', name:'Whole tone (dreamy)', s:[0, 2, 4, 6, 8, 10]},
  prometheus:{g:'Western', name:'Prometheus (mystic)', s:[0, 2, 4, 6, 9, 10]},
  // World
  hirajoshi:{g:'World', name:'Japanese Hirajoshi', s:[0, 2, 3, 7, 8]},
  iwato:{g:'World', name:'Japanese Iwato', s:[0, 1, 5, 6, 10]},
  pelog:{g:'World', name:'Balinese Pelog', s:[0, 1, 3, 7, 8]},
  persian:{g:'World', name:'Persian', s:[0, 1, 4, 5, 6, 8, 11]},
  chromatic:{g:'World', name:'All 12 notes (chromatic)', s:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]},
};
const SWARA = ['Sa', 'Ri₁', 'Ri₂', 'Ga₁', 'Ga₂', 'Ma₁', 'Ma₂', 'Pa', 'Dha₁', 'Dha₂', 'Ni₁', 'Ni₂'];
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);

// ---------------------------------------------------------------- instruments
// real: filled from samples/manifest.json. gain balances loudness between instruments.
const GAIN = {choir:0.5, voice:0.55, shehnai:0.5, warmpad:0.45, organ:0.45, accordion:0.5, reedorgan:0.5, taiko:0.8, tubular:0.5, piano:0.75, violin:0.6, violins:0.55, violas:0.55, cellos:0.6, basses:0.7, pizz:0.7, harp:0.7, flute:0.55, clarinet:0.55, oboe:0.5,
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
    ['s:manjira', 'Manjira'], ['s:manjira:closed', 'Manjira closed'], ['s:gajjalu', 'Gajjalu'], ['s:taalam', 'Taalam'], ['s:shaker', 'Shaker'],
    ['s:bell:small', 'Small bell'], ['s:bell:temple', 'Temple bell'], ['s:bowl', 'Singing bowl']]},
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
  aarti:{name:'Aarti (dholak, manjira, bell)', kit:'folk', steps:8, stepBeats:0.5, pat:{'s:dholak:dhe':'x--x-x--', 's:dholak:ta':'--x---x-', 's:manjira':'x-x-x-x-', 's:bell:small':'x-------'}},
  thavil:{name:'Thavil style (wedding)', kit:'mridangam', steps:8, stepBeats:0.5, pat:{'s:mri:thom':'x--x--x-', 's:mri:tha':'-x--x--x', 's:kanjira':'o-o-o-o-', 's:mri:dheem':'x-------'}},
  bowl:{name:'Singing bowl (slow)', kit:'folk', steps:16, stepBeats:1, pat:{'s:bowl':'x---------------'}},
  desert:{name:'Desert (darbuka style)', kit:'kit', steps:16, stepBeats:0.25, pat:{'r:big_drum':'x-----x---x-----', 'r:conga_mute':'---x-------x--x-', 'r:conga_open':'----x-------x---', 'r:claves':'--o---o---o---o-'}},
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
    INSTRUMENTS['r:' + id] = {label:v.label, group:'Real · ' + v.group, kind:'real', id, layers:v.layers, short:v.short, nlay:Object.keys(v.layers).length, sustain:v.sustain,
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
// choose the recording: short notes use staccato recordings; otherwise soft / medium / loud by velocity
function sampleFor(inst, m, v, short){
  const I = INSTRUMENTS[inst]; let layer, list;
  if(short && I.short && I.short.length){ layer = 's'; list = I.short; }
  else { const keys = Object.keys(I.layers).sort(), n = keys.length;
    const idx = n === 1 ? 0 : n === 2 ? (v < 0.62 ? 0 : 1) : (v < 0.5 ? 0 : v < 0.78 ? 1 : 2);
    layer = keys[Math.min(idx, n - 1)]; list = I.layers[layer]; }
  let best = list[0];
  for(const s of list) if(Math.abs(s - m) < Math.abs(best - m) || (Math.abs(s - m) === Math.abs(best - m) && s < m)) best = s;
  return {key:I.id + '/' + best + '_' + layer, base:best, layered:layer === 's' || I.nlay > 1};
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
// small repeatable 'random' numbers, so the human feel is the same every time you play
function hsh(a, b){ let h = 2166136261 ^ a; h = Math.imul(h ^ b, 16777619); h ^= h >>> 13; h = Math.imul(h, 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function strHash(str){ let h = 7; for(let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h; }
function events(song){
  const ev = [], k = spb(song), TB = totalBeats(song), feel = song.feel ?? 0.6, bpb = beatsPerBar(song);
  const accent = t => { const p = ((t % bpb) + bpb) % bpb; return Math.abs(p) < 1e-3 ? 0.08 : Math.abs(p - Math.round(p)) < 1e-3 ? 0.02 : -0.03; };
  for(const tr of song.tracks){
    const th = strHash(tr.id || 'x');
    if(tr.type === 'inst'){
      // legato: a note that starts as the previous one ends, with no other note starting together (a single line)
      const starts = new Map(); for(const n of tr.notes){ const key = Math.round(n.t * 100); starts.set(key, (starts.get(key) || 0) + 1); }
      const order = tr.notes.map((n, i) => i).sort((a, b) => tr.notes[a].t - tr.notes[b].t), leg = new Set();
      for(let j = 1; j < order.length; j++){ const p = tr.notes[order[j - 1]], n = tr.notes[order[j]];
        if(starts.get(Math.round(n.t * 100)) === 1 && starts.get(Math.round(p.t * 100)) === 1 && p.t < n.t && p.t + p.d >= n.t - 0.08 && p.t + p.d <= n.t + 0.3 && Math.abs(p.m - n.m) <= 12) leg.add(order[j]); }
      tr.notes.forEach((n, i) => { if(n.t >= TB) return;
        const dt = feel * (hsh(th, i * 2 + 1) - 0.5) * 0.036, dv = feel * ((hsh(th, i * 2 + 2) - 0.5) * 0.16 + accent(n.t)), dur = Math.min(n.d, TB + 4 - n.t) * k;
        ev.push({s:Math.max(0, n.t * k + (n.t > 0 ? dt : 0)), dur, tr, type:'note', m:n.m, v:Math.max(0.12, Math.min(1, (n.v ?? 0.8) + dv)), short:dur < 0.3 && !n.long, legato:leg.has(i) && dur >= 0.3}); }); }
    else if(tr.type === 'amb'){ ev.push({s:0, dur:TB * k, tr, type:'amb'}); }
    else if(tr.type === 'drum'){
      const from = (tr.from || 1) - 1, to = Math.min(tr.to || song.bars, song.bars), b0 = from * beatsPerBar(song), b1 = to * beatsPerBar(song);
      const len = tr.steps * tr.stepBeats, off = new Set(tr.off || []), bpb = beatsPerBar(song);
      for(let cyc = b0; cyc < b1 - 1e-6; cyc += len){
        for(const [row, arr] of Object.entries(tr.grid)) for(let i = 0; i < tr.steps; i++){ const v = arr[i] || 0; const t = cyc + i * tr.stepBeats; if(v && t < b1 - 1e-6 && !off.has(Math.floor(t / bpb + 1e-6))){ const j = Math.round(t * 16) * 31 + row.length;
            ev.push({s:Math.max(0, t * k + (t > 0 ? feel * (hsh(th, j) - 0.5) * 0.016 : 0)), tr, type:'hit', row, v:Math.max(0.1, Math.min(1, v * (1 + feel * ((hsh(th, j + 7) - 0.5) * 0.3 + accent(t) * 1.5))))}); } }
      }
      for(const h of tr.hits || []) if(h.t <= TB + 1e-6) ev.push({s:h.t * k, tr, type:'hit', row:h.row, v:h.v ?? 1});
    }
  }
  return ev.sort((a, b) => a.s - b.s);
}
// nature sounds (from ../animate/ambience.js), rendered to the song length
const ambBufs = {};
const ambKey = (id, secs) => id + '|' + Math.ceil(secs + 1);
async function ambLoad(id, secs){ const k = ambKey(id, secs); if(ambBufs[k]) return ambBufs[k]; if(!window.VG_AMB) return null; return ambBufs[k] = await window.VG_AMB.render(id, Math.ceil(secs + 1)); }
// buffers the song needs (so playback can start without gaps)
function needs(song){
  const keys = new Set(), syn = [];
  for(const e of events(song)){
    if(e.type === 'amb') continue;
    if(e.type === 'note'){ const I = INSTRUMENTS[e.tr.inst]; if(!I) continue; if(I.kind === 'real') keys.add(sampleFor(e.tr.inst, e.m, e.v, e.short).key); else syn.push(e); }
    else if(e.row.startsWith('r:')) keys.add('drums/' + e.row.slice(2)); else syn.push(e);
  }
  return {keys:[...keys], syn};
}
async function prepare(song, onProgress){
  await load();
  const {keys, syn} = needs(song); let done = 0; const total = keys.length + syn.length || 1;
  for(const tr of song.tracks) if(tr.type === 'amb') await ambLoad(tr.amb, songSeconds(song));
  await Promise.all(keys.map(k => fetchBuf(k).then(() => onProgress && onProgress(++done / total))));
  const t0 = performance.now();
  for(const e of syn){ bufferFor(song, e); done++; if(performance.now() - t0 > 30){ onProgress && onProgress(done / total); await new Promise(r => setTimeout(r, 0)); } }
  onProgress && onProgress(1);
}
// returns {buf, rate, loop, gain, release} or null if not ready yet
function bufferFor(song, e){
  if(e.type === 'amb'){ const b = ambBufs[ambKey(e.tr.amb, songSeconds(song))]; if(!b){ ambLoad(e.tr.amb, songSeconds(song)); return null; } return {buf:b, rate:1, gain:1, amb:true}; }
  if(e.type === 'hit'){
    if(e.row.startsWith('r:')){ const b = bufs['drums/' + e.row.slice(2)]; if(!b){ fetchBuf('drums/' + e.row.slice(2)); return null; } return {buf:b, rate:1, gain:0.8}; }
    const name = e.row.slice(2), f = /^(tabla|mri|ghatam|kanjira)/.test(name) ? hz(rootOf(song) + 12) : 300;
    return {buf:synStroke(name, f, 1), rate:1, gain:0.9};
  }
  const I = INSTRUMENTS[e.tr.inst]; if(!I) return null;
  if(I.kind === 'synth') return {buf:synNote(I.id, e.m, I.sustain ? e.dur + 0.1 : Math.max(e.dur, 1.2), e.v), rate:1, gain:I.gain, release:I.sustain ? 0.15 : 0.5, synth:true};
  const sm = sampleFor(e.tr.inst, e.m, e.v, e.short), b = bufs[sm.key]; if(!b){ fetchBuf(sm.key); return null; }
  return {buf:b, rate:Math.pow(2, (e.m - sm.base) / 12), gain:I.gain, release:e.short ? 0.12 : I.release, sustain:I.sustain && !e.short, layered:sm.layered};
}

// ---------------------------------------------------------------- audio graph
// concert-hall echo made with code: pre-delay, early reflections, then a dense tail where high sounds die away sooner
function impulse(ctx, secs = 2.6){
  const sr = ctx.sampleRate, n = Math.floor(secs * sr), b = ctx.createBuffer(2, n, sr);
  let seed = 12345; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pre = Math.floor(0.018 * sr), T60 = [2.4, 1.9, 1.1];            // low, mid, high decay times
  for(let c = 0; c < 2; c++){
    const d = b.getChannelData(c), lo = new Float32Array(n), mid = new Float32Array(n), hi = new Float32Array(n);
    for(let i = pre; i < n; i++){ const t = (i - pre) / sr, w = r() * 2 - 1, env = Math.min(1, t / 0.03);
      lo[i] = w * env * Math.pow(10, -3 * t / T60[0]); mid[i] = w * env * Math.pow(10, -3 * t / T60[1]); hi[i] = w * env * Math.pow(10, -3 * t / T60[2]); }
    // split bands with one-pole filters (lows < 400 Hz, highs > 3.5 kHz)
    const a1 = 1 - Math.exp(-2 * Math.PI * 400 / sr), a2 = 1 - Math.exp(-2 * Math.PI * 3500 / sr); let l = 0, m1 = 0, m2 = 0, h = 0;
    for(let i = 0; i < n; i++){ l += a1 * (lo[i] - l); m1 += a1 * (mid[i] - m1); m2 += a2 * (mid[i] - m2); h += a2 * (hi[i] - h);
      d[i] = l * 1.1 + (m2 - m1) * 0.9 + (hi[i] - h) * 0.5; }
    // early reflections from walls, different on left and right
    for(let k = 0; k < 18; k++){ const t = 0.006 + r() * 0.075, i = pre + Math.floor(t * sr); if(i < n) d[i] += (r() < 0.5 ? -1 : 1) * 0.6 * Math.pow(1 - t / 0.09, 1.5); }
  }
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
  const vel = e.type === 'amb' ? 1 : e.type === 'hit' ? e.v : info.layered ? 0.55 + 0.45 * e.v : 0.3 + 0.7 * e.v;
  g.gain.value = info.gain * vel; src.connect(g); g.connect(trackNode(G, song, e.tr).input);
  if(info.amb){ src.start(when, offset); src.stop(when + Math.max(0.1, e.dur - offset + 0.5)); return src; }
  if(e.type === 'note'){
    const len = info.buf.duration / info.rate; let skip = 0;
    if(info.sustain && e.legato && offset === 0){ skip = Math.min(0.12, len * 0.1); g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(info.gain * vel, when + 0.045); }   // joined to the note before
    else if(info.sustain && (song.feel ?? 0.6) > 0 && offset === 0){ g.gain.setValueAtTime(info.gain * vel * 0.55, when); g.gain.linearRampToValueAtTime(info.gain * vel, when + 0.07); }
    if(info.sustain && e.dur > len - 0.5 && info.buf.duration > 2){ src.loop = true; src.loopStart = 1.0; src.loopEnd = info.buf.duration - 0.45; }
    const end = when + e.dur - offset, rel = info.release || 0.3;
    if(!info.synth || SYN[INSTRUMENTS[e.tr.inst].id].sustain){ g.gain.setValueAtTime(info.gain * vel, Math.max(when, end - 0.001)); g.gain.setTargetAtTime(0, Math.max(when, end), rel / 3); }
    src.start(when, offset * info.rate + skip * info.rate); src.stop(Math.max(when, end) + rel * 2 + 0.05);
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
    for(const e of this.ev) if((e.type === 'note' || e.type === 'amb') && e.s < fromSec && e.s + e.dur > fromSec + 0.05){ const s = fire(this.G, song, e, this.segs[0].ctx0, fromSec - e.s); if(s){ this.srcs.add(s); s.onended = () => this.srcs.delete(s); } }
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
  const exact = song.seconds && Math.abs(songSeconds(song) - song.seconds) < 0.5;   // one-tap songs: exactly the video length
  const n = exact ? Math.round(song.seconds * SR) : Math.min(out.length, last + Math.floor(0.2 * SR)), res = new AudioBuffer({length:n, numberOfChannels:2, sampleRate:SR}), g = 0.89 / (pk || 1);
  for(let c = 0; c < 2; c++){ const s = out.getChannelData(c), d = new Float32Array(n), fo = Math.floor((exact ? Math.min(1.8, song.seconds / 10) : 0.15) * SR); for(let i = 0; i < n; i++) d[i] = s[i] * g * (i > n - fo ? (n - i) / fo : 1); res.copyToChannel(d, c); }
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
function auto(song, tr, kind, seed = 1, bars, opts = {}){
  const I = INSTRUMENTS[tr.inst] || {range:[48, 84]}, R = rng(seed * 7919 + kind.length), bpb = beatsPerBar(song), nb = bars || song.bars, out = [];
  const lo = I.range[0], hi = I.range[1], mid = Math.max(lo + 6, Math.min(hi - 6, Math.round((lo + hi) / 2) + (opts.shift || 0))), r = rootOf(song);
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
  } else if(kind === 'alap'){   // slow free opening: grows upward from Sa, phrase by phrase, returns to Sa
    const pool = scaleMidis(song, Math.max(lo, mid - 12), Math.min(hi, mid + 12)); if(!pool.length) return out;
    const sa = pool.reduce((b, m) => (m - r) % 12 === 0 && Math.abs(m - mid) < Math.abs(b - mid) ? m : b, pool[0]), si = pool.indexOf(sa), end = nb * bpb;
    let t = 0, top = 1;
    while(t < end - 2.5){
      const seq = []; for(let i = 0; i <= top; i++) seq.push(si + i); for(let i = top - 1; i >= 0; i--) seq.push(si + i);
      if(top > 2 && R() < 0.5) seq.splice(1, 0, si - 1);   // touch the note below Sa
      for(const idx of seq){ if(t >= end - 2.5) break; const d = (idx === si ? 2 : 1) * (0.9 + R() * 0.9), m = pool[Math.max(0, Math.min(pool.length - 1, idx))];
        out.push({t:t + (R() - 0.5) * 0.15, d:d * 0.97, m, v:0.5 + R() * 0.15}); t += d; }
      top = Math.min(top + 1 + (R() < 0.4 ? 1 : 0), 6);
    }
    out.push({t:Math.max(0, t), d:Math.max(1, end - t - 0.1), m:sa, v:0.55});
    return out.filter(n => n.t >= 0 && n.t < end);
  } else if(kind === 'chant'){  // Vedic style: three tones around Sa (below, Sa, above), even syllables
    const pool = scaleMidis(song, mid - 7, mid + 7), sa = pool.reduce((b, m) => (m - r) % 12 === 0 && Math.abs(m - mid) < Math.abs(b - mid) ? m : b, pool[0]);
    const below = pool.filter(m => m < sa).pop() ?? sa - 2, above = pool.find(m => m > sa) ?? sa + 2;
    for(let bar = 0; bar < nb; bar++) for(let b = 0; b < bpb; b++){ const t = bar * bpb + b, x = R(); const m = x < 0.55 ? sa : x < 0.78 ? above : below;
      const last = bar % 2 === 1 && b === bpb - 1; out.push({t, d:last ? 0.95 : (R() < 0.3 ? 0.45 : 0.9), m:last ? sa : m, v:b === 0 ? 0.7 : 0.58});
      if(!last && R() < 0.3) out.push({t:t + 0.5, d:0.45, m:sa, v:0.55}); }
  } else if(kind === 'counter'){   // slow second line: one chord tone per bar, moving smoothly
    let prev = mid;
    for(let bar = 0; bar < nb; bar++){ const ch = fit(chordAt(song, bar, mid), [lo, hi]).concat(fit(chordAt(song, bar, mid + 12), [lo, hi]));
      const m = ch.reduce((b, x) => Math.abs(x - prev) < Math.abs(b - prev) ? x : b, ch[0]); prev = m;
      if(bpb >= 4 && R() < 0.5){ out.push({t:bar * bpb, d:bpb / 2 - 0.05, m, v:0.55}); const m2 = ch.reduce((b, x) => x !== m && Math.abs(x - m) < Math.abs(b - m) ? x : b, ch[1] ?? m); out.push({t:bar * bpb + bpb / 2, d:bpb / 2 - 0.05, m:m2, v:0.5}); prev = m2; }
      else out.push({t:bar * bpb, d:bpb - 0.05, m, v:0.55}); }
  } else if(kind === 'drone'){
    const sa = fit([r], [lo, hi])[0], pa = (SCALES[song.scale] || SCALES.major).s.includes(7) ? sa - 5 : sa - 7;
    const pat = [pa < lo ? pa + 12 : pa, sa + 12 <= hi ? sa + 12 : sa, sa + 12 <= hi ? sa + 12 : sa, sa];
    for(let bar = 0; bar < nb; bar++) pat.forEach((m, i) => out.push({t:bar * bpb + i * bpb / 4, d:bpb * 1.2, m, v:i === 3 ? 0.75 : 0.6}));
  }
  return out;
}

// ---------------------------------------------------------------- one-tap songs with sections, fitted to a length in seconds
// roles: melody, counter (chorus only), pad (chords), bass, arp, drone; rhythm (+ rhythm2 in chorus)
const MOODS = {
  spiritual:{indian:true, name:'🕉️ Spiritual / Upanishad', scales:['revati', 'mayamalavagowla', 'kalyani', 'mohanam'], bpm:[58, 66], keys:['C#', 'D', 'C'],
    parts:{melody:'s:bansuri', drone:'s:tanpura', pad:'r:cellos', arp:'r:harp', counter:'r:choir'}, verb:0.5},
  devotional:{indian:true, name:'🙏 Devotional / bhajan', scales:['mohanam', 'abheri', 'kharaharapriya', 'shivaranjani'], bpm:[88, 100], keys:['C#', 'D', 'C'],
    parts:{melody:'s:harmonium', counter:'s:bansuri', drone:'s:tanpura'}, rhythm:'keherwa', rhythm2:'bhajan', verb:0.3},
  carnatic:{indian:true, name:'🪕 Carnatic veena', scales:['hamsadhwani', 'kalyani', 'mayamalavagowla', 'mohanam', 'kharaharapriya'], bpm:[80, 92], keys:['D', 'E', 'C'],
    parts:{melody:'s:veena', counter:'r:violin', drone:'s:tanpura'}, rhythm:'adi', verb:0.3},
  hindustani:{indian:true, name:'🎶 Hindustani sitar', scales:['kalyani', 'bhairavi', 'hindolam', 'kharaharapriya'], bpm:[72, 84], keys:['C#', 'D'],
    parts:{melody:'s:sitar', counter:'s:bansuri', drone:'s:tanpura'}, rhythm:'teentaal', verb:0.35},
  calm:{name:'🌿 Calm / meditation', scales:['mohanam', 'shivaranjani', 'major'], bpm:[60, 70], keys:['D', 'F', 'C'],
    parts:{melody:'r:flute', pad:'r:violins', arp:'r:harp', drone:'s:tanpura'}, verb:0.55},
  happy:{name:'😊 Happy / kids', scales:['major', 'mohanam'], bpm:[110, 124], keys:['F', 'G', 'C'],
    parts:{melody:'r:marimba', counter:'r:glock', bass:'r:pizz', arp:'r:xylophone'}, rhythm:'latin', verb:0.2},
  cinematic:{name:'🎬 Cinematic / epic', scales:['minor', 'kharaharapriya'], bpm:[84, 96], keys:['D', 'C', 'E'],
    parts:{melody:'r:horn', counter:'r:trumpet', pad:'r:violins', bass:'r:cellos', arp:'r:pizz'}, rhythm:'epic', verb:0.45},
  sad:{name:'😢 Sad / emotional', scales:['minor', 'bhairavi'], bpm:[64, 72], keys:['A', 'D', 'E'],
    parts:{melody:'r:piano', counter:'r:violin', pad:'r:cellos'}, verb:0.45},
  motivational:{name:'💼 Motivational / business', scales:['major'], bpm:[100, 110], keys:['C', 'D', 'G'],
    parts:{melody:'r:piano', pad:'r:violins', bass:'r:cellos', arp:'s:guitar'}, rhythm:'pop', verb:0.3},
  folk:{name:'🌾 Village folk', scales:['kharaharapriya', 'mohanam', 'major'], bpm:[100, 112], keys:['D', 'E'],
    parts:{melody:'s:bansuri', arp:'s:santoor', bass:'s:guitar'}, rhythm:'dholak', verb:0.25},
  romantic:{name:'❤️ Romantic', scales:['kalyani', 'major', 'shivaranjani'], bpm:[76, 86], keys:['C', 'D'],
    parts:{melody:'s:sitar', counter:'r:flute', pad:'r:violins', arp:'s:guitar'}, rhythm:'keherwa', verb:0.4},
  aarti:{name:'🪔 Temple aarti', scales:['mohanam', 'major', 'abheri'], bpm:[84, 96], keys:['C#', 'D', 'C'], indian:true,
    parts:{melody:'s:harmonium', counter:'s:bansuri', drone:'s:tanpura'}, rhythm:'aarti', verb:0.35},
  vedic:{name:'📿 Vedic chant style', scales:['major', 'kharaharapriya', 'mohanam'], bpm:[66, 76], keys:['C#', 'C', 'D'], indian:true, melodyKind:'chant',
    parts:{melody:'r:voice', counter:'s:bansuri', drone:'s:tanpura', pad:'r:cellos'}, rhythm:'bowl', verb:0.45},
  wedding:{name:'💐 Wedding (nadaswaram style)', scales:['kalyani', 'major', 'mohanam'], bpm:[100, 112], keys:['D', 'E', 'C'], indian:true,
    parts:{melody:'r:shehnai', counter:'r:oboe', drone:'s:tanpura'}, rhythm:'thavil', verb:0.3},
  festival:{name:'🎉 Festival', scales:['major', 'mohanam', 'kharaharapriya'], bpm:[112, 124], keys:['D', 'E', 'F'], indian:true,
    parts:{melody:'s:bansuri', arp:'s:santoor', bass:'s:guitar'}, rhythm:'dhol', rhythm2:'dholak', verb:0.25},
  zen:{name:'🎋 Zen / Japanese calm', scales:['hirajoshi', 'iwato', 'durga'], bpm:[60, 70], keys:['D', 'E', 'A'],
    parts:{melody:'r:panflute', arp:'r:koto', pad:'r:warmpad'}, rhythm:'bowl', verb:0.55},
  desert:{name:'🐪 Desert / Arabic', scales:['vakulabharanam', 'mayamalavagowla', 'persian'], bpm:[90, 104], keys:['D', 'E', 'C#'],
    parts:{melody:'r:oboe', counter:'r:violin', bass:'r:pizz', drone:'s:tanpura'}, rhythm:'desert', verb:0.35},
  blues:{name:'🎷 Blues', scales:['blues'], bpm:[76, 92], keys:['E', 'A', 'G'],
    parts:{melody:'r:epiano', bass:'r:basses', arp:'r:steel'}, rhythm:'pop', verb:0.3},
  spanish:{name:'💃 Spanish guitar', scales:['vakulabharanam', 'minor'], bpm:[96, 112], keys:['E', 'A'],
    parts:{melody:'r:nylon', counter:'r:violin', bass:'r:cellos', arp:'r:steel'}, rhythm:'latin', verb:0.3},
  orchestra:{name:'🎻 Orchestra', scales:['major', 'minor'], bpm:[84, 96], keys:['D', 'G', 'C'],
    parts:{melody:'r:flute', counter:'r:oboe', pad:'r:violins', bass:'r:basses', arp:'r:harp'}, rhythm:'march', verb:0.45},
};
const ROLE_NAME = {melody:'Melody', counter:'Second melody', pad:'Chords', bass:'Bass', arp:'Arpeggio', drone:'Drone'};
const ROLE_VOL = {melody:0.85, counter:0.55, pad:0.5, bass:0.7, arp:0.5, drone:0.45};
const ROLE_PAN = {melody:0, counter:0.3, pad:-0.25, bass:0, arp:0.35, drone:-0.15};
let idn = 0; const tid = () => 'g' + Date.now().toString(36) + (idn++);
function sections(nb){
  let intro = nb >= 14 ? 4 : nb >= 8 ? 2 : 1, outro = nb >= 10 ? 2 : 1, mid = Math.max(1, nb - intro - outro);
  if(mid > 4 && mid % 4){ const rem = mid % 4, toIntro = Math.min(rem, 4 - intro); intro += toIntro; outro += rem - toIntro; mid -= rem; }
  const out = [{type:'intro', b0:0, n:intro}];
  const order = ['A', 'B', 'A', 'B', 'C', 'B']; let b = intro, i = 0;
  while(b < intro + mid){ const n = Math.min(4, intro + mid - b); out.push({type:order[i % order.length], b0:b, n}); b += n; i++; }
  out.push({type:'outro', b0:b, n:outro}); return out;
}
function compose(o){
  const M = MOODS[o.mood] || MOODS.spiritual, R = rng((o.seed || 1) * 104729 + o.mood.length * 31), meter = 4;
  const scale = o.scale || R.pick(M.scales), key = o.key || R.pick(M.keys);
  const bpm0 = M.bpm[0] + R() * (M.bpm[1] - M.bpm[0]), secs = Math.max(8, o.seconds || 60);
  // pick bars so the middle is whole 4-bar phrases, then set the tempo so the song lasts exactly `secs`
  let bars = Math.max(4, Math.round(secs / (meter * 60 / bpm0))), best = null;
  for(let n = Math.max(4, bars - 6); n <= bars + 6; n++){ const sc = sections(n); if((sc.some(x => x.n < 4 && /^[ABC]$/.test(x.type)) || sc[sc.length - 1].n > 3) && n >= 6) continue;
    const b = n * meter * 60 / secs, cost = Math.abs(Math.log(b / bpm0)); if(!best || cost < best.cost) best = {n, cost}; }
  if(best) bars = best.n; const bpm = Math.round(bars * meter * 60 / secs * 100) / 100;
  const song = {v:1, name:`${M.name.replace(/^\S+\s/, '')} · ${SCALES[scale].name.split(' ')[0]} · ${Math.round(secs)}s`, bpm, key, scale, bars, meter, tracks:[], mood:o.mood, seed:o.seed || 1, seconds:secs};
  const secs_ = sections(bars), seedA = R() * 1e6 | 0, seedB = R() * 1e6 | 0, seedC = R() * 1e6 | 0;
  const has = (sec, role) => ({intro:['pad', 'arp', 'drone'], A:['melody', 'pad', 'bass', 'drone'], B:['melody', 'counter', 'pad', 'bass', 'arp', 'drone'],
    C:['counter', 'pad', 'arp', 'drone', 'bass'], outro:['melody', 'pad', 'drone', 'arp']}[sec.type].includes(role));
  for(const [role, inst] of Object.entries(M.parts)){
    if(!INSTRUMENTS[inst]) continue;
    const tr = {id:tid(), type:'inst', inst, name:`${ROLE_NAME[role]} · ${INSTRUMENTS[inst].label}`, notes:[], vol:ROLE_VOL[role], pan:ROLE_PAN[role], verb:M.verb};
    const bpb = meter;
    for(const sec of secs_){
      if(!has(sec, role)) continue;
      // when a mood has no pad/arp, let the melody instrument play the intro softly
      let kind = role === 'pad' ? 'chords' : role === 'melody' ? (M.melodyKind || 'melody') : role;
      if(sec.type === 'outro'){
        const I = INSTRUMENTS[inst], r = rootOf(song); let sa = r + 12; while(sa < I.range[0] + 3) sa += 12; while(sa > I.range[1] - 3) sa -= 12;
        if(role === 'melody'){ tr.notes.push({t:sec.b0 * bpb, d:sec.n * bpb - 0.2, m:sa, v:0.75}); continue; }
        if(role === 'arp'){ kind = 'arp'; }
        if(role === 'pad'){ for(const m of fit(chordAt(song, 0, Math.max(I.range[0] + 5, Math.min(I.range[1] - 10, 60))), I.range)) tr.notes.push({t:sec.b0 * bpb, d:sec.n * bpb - 0.2, m, v:0.5}); continue; }
        if(role === 'arp'){ const n = auto(song, tr, 'arp', seedB, 1).map(x => ({...x, t:x.t + sec.b0 * bpb})); tr.notes.push(...n); continue; }
      }
      const sd = sec.type === 'B' ? seedB : sec.type === 'C' ? seedC : seedA;
      const shift = role === 'melody' && sec.type === 'B' ? 5 : role === 'counter' ? 7 : 0;
      let notes = auto(song, tr, kind, sd + (role === 'counter' ? 17 : 0), sec.n, {shift});
      if(sec.type === 'intro' && role === 'arp') notes = notes.map(x => ({...x, v:x.v * 0.8}));
      if(sec.type === 'C' && role === 'counter') notes = notes.map(x => ({...x, v:0.65}));
      const dyn = {intro:0.85, A:0.94, B:1.08, C:0.9, outro:0.9}[sec.type] || 1; notes = notes.map(x => ({...x, v:Math.min(1, x.v * dyn)}));
      tr.notes.push(...notes.map(x => ({...x, t:x.t + sec.b0 * bpb})));
    }
    if(tr.notes.length) song.tracks.push(tr);
  }
  // intro for moods without pad/arp: drone carries it; melody gets a soft opening phrase
  const melTr = song.tracks.find(t => t.name.startsWith('Melody')), introSec = secs_[0];
  if(melTr && M.indian && introSec.n >= 2) melTr.notes.push(...auto(song, melTr, 'alap', seedA + 5, introSec.n).map(x => ({...x, t:x.t + introSec.b0 * meter})));
  else if(melTr && !M.parts.pad && !M.parts.arp){ melTr.notes.push(...auto(song, melTr, 'melody', seedA + 3, introSec.n).map(x => ({...x, v:x.v * 0.6, t:x.t + introSec.b0 * meter}))); }
  const drumOff = rh => { const off = []; for(const sec of secs_) if(sec.type === 'intro' || sec.type === 'outro' || (sec.type === 'C' && rh === 'main')) for(let b = sec.b0; b < sec.b0 + sec.n; b++) off.push(b); return off; };
  const addDrum = (rhythm, name, vol, chorusOnly) => { const R2 = RHYTHMS[rhythm]; if(!R2) return; const tr = {id:tid(), type:'drum', kit:R2.kit, rhythm, name, steps:R2.steps, stepBeats:R2.stepBeats, grid:{}, vol, pan:0, verb:Math.min(0.3, M.verb), from:1, to:0};
    for(const [row, p] of Object.entries(R2.pat)) tr.grid[row] = [...p].map(velOf);
    tr.off = drumOff('main'); if(chorusOnly) for(const sec of secs_) if(sec.type !== 'B') for(let b = sec.b0; b < sec.b0 + sec.n; b++) tr.off.push(b);
    tr.off = [...new Set(tr.off)].sort((a, b) => a - b); song.tracks.push(tr); };
  if(M.rhythm) addDrum(M.rhythm, 'Rhythm · ' + RHYTHMS[M.rhythm].name.split(' (')[0], 0.7);
  if(M.rhythm2) addDrum(M.rhythm2, 'Chorus rhythm · ' + RHYTHMS[M.rhythm2].name.split(' (')[0], 0.5, true);
  // tihai: a phrase played three times, the last stroke landing on beat 1 of the ending
  const outroSec = secs_[secs_.length - 1], tb = outroSec.b0 - 1, main = song.tracks.find(t => t.type === 'drum');
  if(main && M.indian !== false && tb >= secs_[0].n && meter === 4){
    const BOLS = {tabla:['s:tabla:dha', 's:tabla:te', 's:tabla:te', 's:tabla:na', 's:tabla:dha'], mridangam:['s:mri:tha', 's:mri:dhi', 's:mri:ki', 's:mri:nam', 's:mri:thom'],
      folk:['s:dholak:dhe', 's:dholak:ta', 's:dholak:ta', 's:dholak:dhe', 's:dholak:dhe'], kit:['r:snare', 'r:snare', 'r:tom_hi', 'r:tom_hi', 'r:kick'], orch:['r:timpani', 'r:snare', 'r:snare', 'r:snare', 'r:timpani']}[main.kit];
    if(BOLS && main.rhythm !== 'bowl'){
      main.hits = []; for(let rep = 0; rep < 3; rep++) BOLS.forEach((row, i) => main.hits.push({t:tb * meter + (rep * 6 + i) * 0.25, row, v:i === 4 ? 1 : 0.8}));
      if(main.kit === 'folk' && main.grid['s:manjira']) main.hits.push({t:outroSec.b0 * meter, row:'s:manjira', v:1});
      for(const t of song.tracks) if(t.type === 'drum'){ t.off = [...new Set([...(t.off || []), tb])].sort((a, b) => a - b); }
    }
  }
  if(o.nature && window.VG_AMB) song.tracks.push({id:tid(), type:'amb', amb:o.nature, name:'Nature · ' + ((window.VG_AMB.LIST.find(a => a.id === o.nature) || {}).name || o.nature), vol:0.4, pan:0, verb:0});
  song.feel = 0.6;
  song.sections = secs_.map(s => ({type:s.type, b0:s.b0, n:s.n}));
  return song;
}

window.VG_STUDIO = {ambLoad, MOODS, compose, sections,SR, KEYS, SCALES, SWARA, NAMES, noteName, INSTRUMENTS, KITS, RHYTHMS, velOf, load, fetchBuf, prepare, events, graph, mixAll, mixTrack, preview, previewHit,
  Player, render, wavBlob, m4aBlob, auto, scaleMidis, beatsPerBar, totalBeats, spb, songSeconds, rootOf, hz};
})();
