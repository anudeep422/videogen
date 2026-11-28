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
  bassoon:0.6, trumpet:0.45, horn:0.5, trombone:0.5, tuba:0.6, marimba:0.7, xylophone:0.5, glock:0.4,
  grand:0.75, pipeorgan:0.4, folkharp:0.7, tsax:0.5, harmonica:0.45, ocarina:0.5, balafon:0.7, kalimba_ke:0.75, mbira:0.7, wineglass:0.45, tubebells:0.5};
const RELEASE = {grand:0.3, folkharp:1.2, balafon:0.6, kalimba_ke:1, mbira:1, tubebells:2, wineglass:1.2, piano:0.25, harp:1.2, marimba:0.8, xylophone:0.6, glock:1.5, pizz:0.4};
const SYN = {
  veena:{label:'Veena', range:[48, 84]}, sitar:{label:'Sitar', range:[48, 84]}, santoor:{label:'Santoor', range:[55, 91]},
  bansuri:{label:'Bansuri (flute)', range:[60, 88], sustain:true}, harmonium:{label:'Harmonium', range:[48, 84], sustain:true},
  tanpura:{label:'Tanpura', range:[36, 62]}, guitar:{label:'Acoustic guitar', range:[40, 80]}, kalimba:{label:'Kalimba', range:[60, 88]},
  vibraphone:{label:'Vibraphone', range:[53, 89]}, organ:{label:'Organ', range:[36, 84], sustain:true},
  bowl_tibetan:{label:'Singing bowl (struck)', range:[43, 72], g:'Bowls & bells'}, bowl_rubbed:{label:'Singing bowl (rubbed hum)', range:[43, 72], g:'Bowls & bells'},
  swell:{label:'Swell / riser (before a big moment)', range:[60, 60], g:'Effects'}, boom:{label:'Deep impact (boom)', range:[36, 36], g:'Effects'},
  crystal:{label:'Crystal bowl', range:[55, 84], g:'Bowls & bells'}, gong:{label:'Gong', range:[33, 55], g:'Bowls & bells'}, chimes:{label:'Wind chimes / bells', range:[72, 98], g:'Bowls & bells'},
};
const GAMAKA_OK = new Set(['veena', 'sitar', 'bansuri', 'violin', 'violins', 'flute', 'shehnai', 'sitar_rec', 'oboe', 'clarinet', 'voice', 'cellos', 'violas', 'panflute', 'harmonium', 'reedorgan']);
const SYNGAIN = {swell:0.5, boom:0.7, bowl_tibetan:0.75, bowl_rubbed:0.6, crystal:0.6, gong:0.8, chimes:0.45, veena:0.9, sitar:0.8, santoor:0.7, bansuri:0.7, harmonium:0.55, tanpura:0.5, guitar:0.8, kalimba:0.8, vibraphone:0.7, organ:0.45};
const INSTRUMENTS = {};   // id -> {label, group, range, kind:'real'|'synth', ...}
let manifest = null;

// ---------------------------------------------------------------- drum kits (rows) and rhythms
const KITS = {
  kit:{label:'Drum kit (real)', rows:[['r:kick', 'Kick'], ['r:snare', 'Snare'], ['r:snare_soft', 'Snare soft'], ['r:rim', 'Rim'], ['r:tom_hi', 'Tom'], ['r:conga_open', 'Conga'], ['r:bongo', 'Bongo'],
    ['r:cowbell', 'Cowbell'], ['r:claves', 'Claves'], ['s:shaker', 'Shaker'], ['s:bell:small', 'Sleigh bell']]},
  orch:{label:'Orchestra percussion (real)', rows:[['r:timpani', 'Timpani'], ['r:timpani_roll', 'Timp roll'], ['r:bdrum_concert', 'Bass drum'], ['r:big_drum', 'Big drum'],
    ['r:snare', 'Snare'], ['r:snare_soft', 'Snare soft'], ['s:bell:small', 'Bell'], ['s:chime', 'Chime']]},
  tabla:{label:'Tabla', rows:[['s:tabla:dha', 'Dha'], ['s:tabla:dhin', 'Dhin'], ['s:tabla:na', 'Na/Ta'], ['s:tabla:tin', 'Tin'], ['s:tabla:tun', 'Tun'],
    ['s:tabla:te', 'Te/Ti'], ['s:tabla:ge', 'Ge'], ['s:tabla:ke', 'Ke']]},
  mridangam:{label:'Mridangam + ghatam', rows:[['s:mri:tha', 'Tha'], ['s:mri:dhi', 'Dhi'], ['s:mri:nam', 'Nam'], ['s:mri:chapu', 'Chapu'], ['s:mri:thom', 'Thom'],
    ['s:mri:ki', 'Ki'], ['s:mri:dheem', 'Dheem'], ['s:ghatam:gum', 'Ghatam gum'], ['s:ghatam:ta', 'Ghatam ta'], ['s:kanjira', 'Kanjira']]},
  folk:{label:'Folk: dholak, dhol, gajjalu', rows:[['s:dholak:dhe', 'Dholak dhe'], ['s:dholak:ta', 'Dholak ta'], ['s:dhol:dhum', 'Dhol dhum'], ['s:dhol:tak', 'Dhol tak'],
    ['s:manjira', 'Manjira'], ['s:manjira:closed', 'Manjira closed'], ['s:gajjalu', 'Gajjalu'], ['s:taalam', 'Taalam'], ['s:shaker', 'Shaker'],
    ['s:bell:small', 'Small bell'], ['s:bell:temple', 'Temple bell'], ['s:bowl', 'Singing bowl']]},
  world:{label:'World hand drums (real)', rows:[['r:frame_low', 'Frame drum'], ['r:frame_mute', 'Frame muted'], ['r:frame_hi', 'Small frame'], ['r:darbuka_1', 'Darbuka dum'],
    ['r:darbuka_2', 'Darbuka ka'], ['r:darbuka_4', 'Darbuka tek'], ['r:cajon_2', 'Cajon bass'], ['r:cajon_1', 'Cajon slap'], ['r:slit_lo', 'Slit drum low'], ['r:slit_hi', 'Slit drum high'],
    ['r:fingercym', 'Finger cymbals'], ['s:shaker', 'Shaker']]},
  calm:{label:'Bells, gongs & calm (real)', rows:[['r:nepal_bell', 'Nepal bell'], ['r:nepal_bell2', 'Nepal bell 2'], ['r:fingercym', 'Finger cymbals'], ['r:gong_soft', 'Gong soft'],
    ['r:gong_real', 'Gong'], ['r:marktree', 'Wind chimes'], ['r:ocean', 'Ocean waves'], ['r:didgeridoo', 'Didgeridoo'], ['s:bowl', 'Singing bowl']]},
};
// pattern strings: one char per step. x = hit, o = soft hit, - = rest
const RHYTHMS = {
  teentaal:{name:'Teentaal (16 beats, tabla)', kit:'tabla', steps:16, stepBeats:1, pat:{'s:tabla:dha':'x--xx------o---x', 's:tabla:dhin':'-xx--xx-------x-', 's:tabla:tin':'---------xx-----', 's:tabla:na':'-----------xx---'}},
  keherwa:{name:'Keherwa (8, tabla)', kit:'tabla', steps:8, stepBeats:0.5, pat:{'s:tabla:dha':'x-------', 's:tabla:ge':'-x------', 's:tabla:na':'--x-x--x', 's:tabla:te':'---x----', 's:tabla:ke':'-----x--', 's:tabla:dhin':'------x-'}},
  tabla_soft:{name:'Soft tabla (meditation)', kit:'tabla', steps:8, stepBeats:0.5, pat:{'s:tabla:dha':'o-------', 's:tabla:ge':'----o---', 's:tabla:na':'--o---o-', 's:tabla:tin':'------o-'}},
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
  darbuka:{name:'Darbuka (maqsum)', kit:'world', steps:16, stepBeats:0.25, pat:{'r:darbuka_1':'x-------x-------', 'r:darbuka_4':'--x---x-----x---', 'r:darbuka_2':'-----o-------o-o', 'r:fingercym':'x---------------'}},
  frame:{name:'Frame drum & cajon (world)', kit:'world', steps:16, stepBeats:0.25, pat:{'r:frame_low':'x-------x--x----', 'r:frame_hi':'----o-------o---', 'r:cajon_1':'----x-------x---', 's:shaker':'o-o-o-o-o-o-o-o-'}},
  slit:{name:'Slit drum (African)', kit:'world', steps:16, stepBeats:0.25, pat:{'r:slit_lo':'x--x--x---x--x--', 'r:slit_hi':'--o---o-o---o--o', 'r:frame_mute':'x-------x-------'}},
  bells:{name:'Bells & gong (calm)', kit:'calm', steps:16, stepBeats:1, pat:{'r:gong_soft':'x---------------', 'r:nepal_bell':'--------x-------', 'r:fingercym':'----o-------o---'}},
  bowl:{name:'Singing bowl (slow)', kit:'folk', steps:16, stepBeats:1, pat:{'s:bowl':'x---------------'}},
  desert:{name:'Desert (darbuka style)', kit:'kit', steps:16, stepBeats:0.25, pat:{'r:big_drum':'x-----x---x-----', 'r:conga_mute':'---x-------x--x-', 'r:conga_open':'----x-------x---', 'r:claves':'--o---o---o---o-'}},
  country:{name:'Country train beat', kit:'kit', steps:16, stepBeats:0.25, pat:{'r:kick':'x-------x-------', 'r:rim':'----x-------x---', 'r:snare_soft':'-o-o-o-o-o-o-o-o', 's:shaker':'o-o-o-o-o-o-o-o-'}},
  gallop:{name:'Wild West gallop', kit:'kit', steps:16, stepBeats:0.25, pat:{'r:kick':'x---x---x---x---', 'r:tom_hi':'--xx--xx--xx--xx', 'r:cowbell':'x-------x-------', 'r:claves':'----o-------o---'}},
  rock:{name:'Rock beat', kit:'kit', steps:16, stepBeats:0.25, pat:{'r:kick':'x-----x-x-------', 'r:snare':'----x-------x---', 's:shaker':'o-o-o-o-o-o-o-o-'}},
  jingle:{name:'Jingle (sleigh bells & claps)', kit:'kit', steps:16, stepBeats:0.25, pat:{'r:kick':'x-------x-------', 'r:snare_soft':'----x-------x---', 's:shaker':'xoxoxoxoxoxoxoxo', 's:bell:small':'o---o---o---o---'}},
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
  for(const [id, v] of Object.entries(SYN)) INSTRUMENTS['s:' + id] = {label:v.label, group:v.g || 'Indian & synth', kind:'synth', id, range:v.range, sustain:!!v.sustain, gain:SYNGAIN[id] ?? 0.6};
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
// ---- singing bowls, crystal bowl, gong and chimes: partials (frequency ratio, loudness, ring time) with gentle beating
const BOWLS = {
  bowl_tibetan:{len:9, p:[[1, 1, 9], [2.71, 0.55, 5], [5.12, 0.3, 2.8], [8.26, 0.15, 1.6], [12.2, 0.07, 1]], click:0.25},
  crystal:{len:12, p:[[1, 1, 14], [2, 0.05, 7], [3, 0.03, 4]], click:0.04, attack:0.03},
  gong:{len:10, p:[[1, 1, 8], [1.52, 0.6, 6], [2.03, 0.5, 5], [2.4, 0.45, 4.5], [2.97, 0.4, 4], [3.45, 0.35, 3.5], [4.1, 0.3, 3], [4.8, 0.25, 2.5], [5.6, 0.2, 2], [6.3, 0.15, 1.8], [7.4, 0.1, 1.5]], click:0.15, bloom:true},
  chimes:{len:5, p:[[1, 1, 4], [2.76, 0.5, 2.5], [5.4, 0.25, 1.4], [8.93, 0.12, 0.8]], click:0.12},
};
function renderBowl(id, f, dur, vel){
  let s0 = 7 + Math.round(f); const rnd = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647;
  if(id === 'bowl_rubbed'){   // stick circling the rim: slow swell, wobbling hum, then a long fade
    const hold = Math.max(1.5, dur), len = hold + 5, n = Math.floor(len * SR), x = new Float32Array(n), rise = Math.min(2.5, hold * 0.4);
    const P = [[1, 1], [2.71, 0.35], [5.12, 0.08]];
    for(const [r, a] of P){ const fr = f * r, beat = 0.7 + rnd() * 1.4, ph = rnd() * 6.28;
      for(let i = 0; i < n; i++){ const t = i / SR, env = t < rise ? Math.pow(t / rise, 1.5) : t < hold ? 1 : Math.exp(-(t - hold) * 6.9 / 5),
        wob = 1 + 0.18 * Math.sin(2 * Math.PI * 4.6 * t + ph); x[i] += a * env * wob * (Math.sin(2 * Math.PI * fr * t + ph) + 0.6 * Math.sin(2 * Math.PI * (fr + beat) * t)); } }
    let pk = 0; for(const v of x) pk = Math.max(pk, Math.abs(v)); for(let i = 0; i < n; i++) x[i] *= 0.9 * vel / (pk || 1); return x;
  }
  const B = BOWLS[id], n = Math.floor(B.len * SR), x = new Float32Array(n), att = B.attack || 0.003;
  for(const [r, a, T] of B.p){ const fr = f * r; if(fr > SR * 0.45) continue; const beat = 0.4 + rnd() * 2.2, ph = rnd() * 6.28, k = 6.9 / T;
    for(let i = 0; i < n; i++){ const t = i / SR; let env = Math.exp(-k * t) * Math.min(1, t / att); if(B.bloom && r > 1.2) env *= Math.min(1, t / (0.25 + r * 0.12));
      x[i] += a * env * (Math.sin(2 * Math.PI * fr * t + ph) + 0.5 * Math.sin(2 * Math.PI * (fr + beat) * t)); } }
  // strike: a short soft knock
  for(let i = 0; i < Math.floor(0.03 * SR); i++){ x[i] += B.click * (rnd() * 2 - 1) * Math.exp(-i / (0.004 * SR)); }
  let pk = 0; for(const v of x) pk = Math.max(pk, Math.abs(v)); for(let i = 0; i < n; i++) x[i] *= 0.9 * vel / (pk || 1); return x;
}
// riser before a chorus (noise sweeping up and getting louder) and a soft deep impact on the chorus
function renderFx(id, dur, vel){
  let s0 = 99; const rnd = () => (s0 = (s0 * 16807) % 2147483647) / 2147483647 * 2 - 1;
  if(id === 'swell'){ const n = Math.floor(Math.max(0.5, dur) * SR), x = new Float32Array(n); let lp = 0, bp = 0;
    for(let i = 0; i < n; i++){ const u = i / n, fc = 300 + 7000 * u * u, a = 1 - Math.exp(-2 * Math.PI * fc / SR); lp += a * (rnd() - lp); bp += 0.3 * (lp - bp);
      x[i] = (lp - bp * 0.6) * Math.pow(u, 2.2) * (u > 0.97 ? (1 - u) / 0.03 : 1); }
    let pk = 0; for(const v of x) pk = Math.max(pk, Math.abs(v)); for(let i = 0; i < n; i++) x[i] *= 0.8 * vel / (pk || 1); return x; }
  // boom
  const n = Math.floor(3 * SR), x = new Float32Array(n); let ph = 0, lp = 0;
  for(let i = 0; i < n; i++){ const t = i / SR, f = 38 + 50 * Math.exp(-t * 7); ph += 2 * Math.PI * f / SR; lp += 0.05 * (rnd() - lp);
    x[i] = Math.sin(ph) * Math.exp(-t * 1.6) + lp * 3 * Math.exp(-t * 4) + (i < 300 ? rnd() * 0.3 * (1 - i / 300) : 0); }
  let pk = 0; for(const v of x) pk = Math.max(pk, Math.abs(v)); for(let i = 0; i < n; i++) x[i] *= 0.9 * vel / (pk || 1); return x;
}
function synNote(id, m, dur, v){
  if(id === 'swell' || id === 'boom'){ const d = Math.round(dur * 10) / 10, key = 'fx|' + id + '|' + d + '|' + v; let b = synCache.get(key); if(b) return b; b = toBuf(renderFx(id, dur, v)); synCache.set(key, b); return b; }
  if(id === 'bowl_rubbed' || BOWLS[id]){ const d = id === 'bowl_rubbed' ? Math.round(dur * 2) / 2 : 0, vv = Math.round(v * 4) / 4 || 0.25, key = 'b|' + id + '|' + m + '|' + d + '|' + vv;
    let b = synCache.get(key); if(b) return b; b = toBuf(renderBowl(id, hz(m), dur, vv)); synCache.set(key, b); return b; }
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
// human feel: how a real player shapes each phrase — different for each mood
//  swell = louder in the middle of a phrase; rit = linger at the end of 8 bars; vib = vibrato depth on long notes (starts late);
//  grace = chance of a little slide into important notes; accent = strength of the beat; swing = late off-beats (bhajan, folk, jazz)
const HFP = {
  gentle:   {swell:0.18, rit:0.22, vib:0.28, grace:0.18, accent:0.5, swing:0},
  bright:   {swell:0.08, rit:0, vib:0.18, grace:0.08, accent:1.25, swing:0},
  bouncy:   {swell:0.04, rit:0, vib:0, grace:0, accent:1.5, swing:0},
  tender:   {swell:0.22, rit:0.32, vib:0.32, grace:0.2, accent:0.6, swing:0},
  bhakti:   {swell:0.14, rit:0.14, vib:0.24, grace:0.22, accent:1, swing:0.1},
  classical:{swell:0.14, rit:0.18, vib:0.24, grace:0.2, accent:0.9, swing:0},
  grand:    {swell:0.3, rit:0.15, vib:0.26, grace:0.05, accent:1.1, swing:0},
  groove:   {swell:0.1, rit:0.05, vib:0.22, grace:0.12, accent:1.1, swing:0.18},
};
const HF_MOOD = {spiritual:'gentle', calm:'gentle', meditation:'gentle', zen:'gentle', bowls:'gentle', vedic:'gentle', church:'gentle',
  happy:'bright', motivational:'bright', cowboy:'bright', africa:'bright', western:'tender', kids:'bouncy',
  sad:'tender', romantic:'tender', spanish:'tender', desert:'tender',
  devotional:'bhakti', aarti:'bhakti', folk:'bhakti', festival:'bhakti', wedding:'bhakti',
  carnatic:'classical', hindustani:'classical', solo:'classical', custom:'classical',
  cinematic:'grand', orchestra:'grand', jazz:'groove', blues:'groove'};
const VIB_OK = new Set(['violin', 'violins', 'violas', 'cellos', 'flute', 'oboe', 'clarinet', 'horn', 'trumpet', 'trombone', 'tsax', 'voice', 'choir', 'harmonica', 'ocarina', 'panflute', 'shehnai', 'bansuri', 'accordion']);
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
      // gamaka: meend (slide in from the note before) and kampita (shake on long Ri / Ga / Dha / Ni)
      const gam = song.gamaka ?? 0, GI = INSTRUMENTS[tr.inst], canG = gam > 0 && GI && GAMAKA_OK.has(GI.id), prev = new Map(), root = rootOf(song) % 12;
      for(let j = 1; j < order.length; j++){ const p = tr.notes[order[j - 1]], n = tr.notes[order[j]]; if(n.t - (p.t + p.d) < 0.6 && n.t > p.t) prev.set(order[j], p); }
      const H = HFP[song.hf], lead = /^(Melody|Second melody|My )/.test(tr.name || ''), vibOk = GI && VIB_OK.has(GI.id);
      tr.notes.forEach((n, i) => { if(n.t >= TB) return;
        const dt = feel * (hsh(th, i * 2 + 1) - 0.5) * 0.036, dv = feel * ((hsh(th, i * 2 + 2) - 0.5) * 0.16 + accent(n.t) * (H ? H.accent : 1)), dur = Math.min(n.d, TB + 4 - n.t) * k;
        let g = null, hv = 1, ht = 0;
        if(H){ const ph = ((n.t / bpb) % 4) / 4; hv = 1 + H.swell * (Math.sin(Math.PI * ph) - 0.5);   // phrase swell
          if(H.swing && Math.abs((n.t % 1) - 0.5) < 1e-3) ht += H.swing * k;                       // swing
          if(lead && H.rit){ const p8 = n.t % (8 * bpb), x = p8 - (8 * bpb - 1); if(x > 0) ht += H.rit * k * x * x; } }   // linger at the end of 8 bars
        if(canG && dur >= 0.3){ const p = prev.get(i), iv = p ? p.m - n.m : 0, rel = ((n.m - root) % 12 + 12) % 12;
          if(p && Math.abs(iv) >= 1 && Math.abs(iv) <= 5 && dur >= 0.42 && hsh(th, i * 7 + 3) < 0.35 + 0.35 * gam) g = {from:iv, slide:Math.min(0.2, dur * 0.3)};
          if(dur >= 0.75 && [1, 2, 3, 4, 8, 9, 10, 11].includes(rel) && hsh(th, i * 7 + 5) < 0.4 + 0.4 * gam) (g = g || {}).kamp = 0.6 + 0.6 * gam; }
        if(H && lead && vibOk && !(g && g.kamp) && dur >= 0.55 && H.vib) (g = g || {}).vib = {d:H.vib, delay:Math.min(0.45, dur * 0.35), f:5.2 + hsh(th, i * 5 + 9) * 0.8};
        if(H && lead && (vibOk || canG) && !(g && g.from) && dur >= 0.4 && H.grace && hsh(th, i * 11 + 4) < H.grace * ((n.v ?? 0.8) >= 0.84 ? 2 : 1)) (g = g || {}).from = hsh(th, i * 13) < 0.5 ? -1 : -2, g.slide = 0.06;
        ev.push({s:Math.max(0, n.t * k + (n.t > 0 ? dt : 0) + ht), dur, tr, type:'note', m:n.m, v:Math.max(0.12, Math.min(1, ((n.v ?? 0.8) + dv) * hv)), short:dur < 0.3 && !n.long, legato:leg.has(i) && dur >= 0.3, g}); }); }
    else if(tr.type === 'amb'){ ev.push({s:0, dur:TB * k, tr, type:'amb'}); }
    else if(tr.type === 'audio'){ if(!tr.blob) continue; const b = clipBufs[tr.blob]; const st = Math.max(0, tr.start || 0); if(st < TB * k) ev.push({s:st, dur:Math.min(b ? b.duration : TB * k, TB * k + 2 - st), tr, type:'clip'}); }
    else if(tr.type === 'drum'){
      const from = (tr.from || 1) - 1, to = Math.min(tr.to || song.bars, song.bars), b0 = from * beatsPerBar(song), b1 = to * beatsPerBar(song);
      const len = tr.steps * tr.stepBeats, off = new Set(tr.off || []), bpb = beatsPerBar(song);
      for(let cyc = b0; cyc < b1 - 1e-6; cyc += len){
        for(const [row, arr] of Object.entries(tr.grid)) for(let i = 0; i < tr.steps; i++){ const v = arr[i] || 0; const t = cyc + i * tr.stepBeats; if(v && t < b1 - 1e-6 && !off.has(Math.floor(t / bpb + 1e-6))){ const j = Math.round(t * 16) * 31 + row.length;
            const sw = HFP[song.hf] && HFP[song.hf].swing && Math.abs((t % 1) - 0.5) < 1e-3 ? HFP[song.hf].swing * k : 0;
            ev.push({s:Math.max(0, t * k + sw + (t > 0 ? feel * (hsh(th, j) - 0.5) * 0.016 : 0)), tr, type:'hit', row, v:Math.max(0.1, Math.min(1, v * (1 + feel * ((hsh(th, j + 7) - 0.5) * 0.3 + accent(t) * 1.5))))}); } }
      }
      for(const h of tr.hits || []) if(h.t <= TB + 1e-6) ev.push({s:h.t * k, tr, type:'hit', row:h.row, v:h.v ?? 1});
    }
  }
  return ev.sort((a, b) => a.s - b.s);
}
// nature sounds (from ../animate/ambience.js), rendered to the song length
const ambBufs = {};
// recorded / uploaded audio (voice track); the page gives a loader that reads it from the phone's storage
const clipBufs = {}; let clipLoader = null;
function setClipLoader(f){ clipLoader = f; }
async function clipLoad(id){ if(clipBufs[id] || !clipLoader) return clipBufs[id]; try{ const b = await clipLoader(id); if(b) clipBufs[id] = b; }catch(e){ console.warn(e); } return clipBufs[id]; }
const ambKey = (id, secs) => id + '|' + Math.ceil(secs + 1);
async function ambLoad(id, secs){ const k = ambKey(id, secs); if(ambBufs[k]) return ambBufs[k]; if(!window.VG_AMB) return null; return ambBufs[k] = await window.VG_AMB.render(id, Math.ceil(secs + 1)); }
// buffers the song needs (so playback can start without gaps)
function needs(song){
  const keys = new Set(), syn = [];
  for(const e of events(song)){
    if(e.type === 'amb' || e.type === 'clip') continue;
    if(e.type === 'note'){ const I = INSTRUMENTS[e.tr.inst]; if(!I) continue; if(I.kind === 'real') keys.add(sampleFor(e.tr.inst, e.m, e.v, e.short).key); else syn.push(e); }
    else if(e.row.startsWith('r:')) keys.add('drums/' + e.row.slice(2)); else syn.push(e);
  }
  return {keys:[...keys], syn};
}
async function prepare(song, onProgress){
  await load();
  const {keys, syn} = needs(song); let done = 0; const total = keys.length + syn.length || 1;
  for(const tr of song.tracks) if(tr.type === 'amb') await ambLoad(tr.amb, songSeconds(song)); else if(tr.type === 'audio') await clipLoad(tr.blob);
  await Promise.all(keys.map(k => fetchBuf(k).then(() => onProgress && onProgress(++done / total))));
  const t0 = performance.now();
  for(const e of syn){ bufferFor(song, e); done++; if(performance.now() - t0 > 30){ onProgress && onProgress(done / total); await new Promise(r => setTimeout(r, 0)); } }
  onProgress && onProgress(1);
}
// returns {buf, rate, loop, gain, release} or null if not ready yet
function bufferFor(song, e){
  if(e.type === 'clip'){ const b = clipBufs[e.tr.blob]; if(!b){ clipLoad(e.tr.blob); return null; } return {buf:b, rate:1, gain:1, amb:true}; }
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
// rooms: how a real space echoes — early reflections from the walls, then a tail that dies away (lows, mids and highs at their own speed)
const ROOMS = {
  studio: {label:'Studio room', secs:1.1, pre:0.008, T60:[0.75, 0.6, 0.38], er:10, erSpan:0.03, erGain:0.5, wet:0.75},
  hall:   {label:'Concert hall', secs:3.0, pre:0.024, T60:[2.6, 2.1, 1.3], er:18, erSpan:0.08, erGain:0.55, wet:1},
  temple: {label:'Stone temple', secs:3.8, pre:0.03, T60:[3.0, 2.8, 2.3], er:14, erSpan:0.14, erGain:0.75, wet:1.05},
  bighall:{label:'Big hall', secs:4.4, pre:0.04, T60:[3.9, 3.2, 2.0], er:22, erSpan:0.12, erGain:0.5, wet:1.1},
  classic:{label:'Classic', secs:2.6, pre:0.018, T60:[2.4, 1.9, 1.1], er:18, erSpan:0.075, erGain:0.6, wet:1},
};
const ROOM_MOOD = {spiritual:'temple', devotional:'temple', aarti:'temple', vedic:'temple', bowls:'temple', meditation:'temple', hindustani:'temple', carnatic:'temple', solo:'temple', custom:'temple',
  calm:'hall', zen:'hall', sad:'hall', romantic:'hall', spanish:'hall', desert:'hall', western:'hall',
  kids:'studio', motivational:'studio', happy:'studio', jazz:'studio', blues:'studio', cowboy:'studio', africa:'studio', folk:'studio', festival:'studio', wedding:'studio',
  cinematic:'bighall', orchestra:'bighall', church:'bighall'};
const roomOf = song => ROOMS[song.room] ? song.room : ROOM_MOOD[song.mood] || song.autoRoom || 'classic';
const irCache = {};
function impulse(ctx, room = 'classic'){
  const R0 = ROOMS[room] || ROOMS.classic, sr = ctx.sampleRate, key = room + '|' + sr; if(irCache[key]) return irCache[key];
  const n = Math.floor(R0.secs * sr), b = new AudioBuffer({length:n, numberOfChannels:2, sampleRate:sr});
  let seed = 12345; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pre = Math.floor(R0.pre * sr), T60 = R0.T60;
  for(let c = 0; c < 2; c++){
    const d = b.getChannelData(c), lo = new Float32Array(n), mid = new Float32Array(n), hi = new Float32Array(n);
    for(let i = pre; i < n; i++){ const t = (i - pre) / sr, w = r() * 2 - 1, env = Math.min(1, t / 0.03);
      lo[i] = w * env * Math.pow(10, -3 * t / T60[0]); mid[i] = w * env * Math.pow(10, -3 * t / T60[1]); hi[i] = w * env * Math.pow(10, -3 * t / T60[2]); }
    const a1 = 1 - Math.exp(-2 * Math.PI * 400 / sr), a2 = 1 - Math.exp(-2 * Math.PI * 3500 / sr); let l = 0, m1 = 0, m2 = 0, h = 0;
    for(let i = 0; i < n; i++){ l += a1 * (lo[i] - l); m1 += a1 * (mid[i] - m1); m2 += a2 * (mid[i] - m2); h += a2 * (hi[i] - h);
      d[i] = (l * 1.1 + (m2 - m1) * 0.9 + (hi[i] - h) * 0.5) * R0.wet; }
    // early reflections from the walls, different on left and right (stone temples: strong, spread out)
    for(let k = 0; k < R0.er; k++){ const t = 0.004 + r() * R0.erSpan, i = pre + Math.floor(t * sr); if(i < n) d[i] += (r() < 0.5 ? -1 : 1) * R0.erGain * Math.pow(1 - t / (R0.erSpan * 1.2), 1.5); }
  }
  return irCache[key] = b;
}
function graph(ctx, song){
  const master = ctx.createGain(); master.gain.value = song.master ?? 0.9;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.2;
  const verb = ctx.createConvolver(); verb.buffer = impulse(ctx, roomOf(song)); const verbOut = ctx.createGain(); verbOut.gain.value = 0.7;
  verb.connect(verbOut); verbOut.connect(master);
  const meter = ctx.createAnalyser(); meter.fftSize = 512;
  if(song.polish === false){ master.connect(comp); comp.connect(ctx.destination); comp.connect(meter); }
  else {   // mastering: clean lows, less mud, a little air, gentle warmth, glue compression, then a limiter
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 32; hp.Q.value = 0.7;
    const mud = ctx.createBiquadFilter(); mud.type = 'peaking'; mud.frequency.value = 320; mud.Q.value = 0.9; mud.gain.value = -2.5;
    const low = ctx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 110; low.gain.value = 1.5;
    const air = ctx.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 9000; air.gain.value = 2.5;
    const sat = ctx.createWaveShaper(); const n = 2048, cv = new Float32Array(n); for(let i = 0; i < n; i++){ const x = i / (n - 1) * 2 - 1; cv[i] = Math.tanh(1.4 * x) / Math.tanh(1.4); } sat.curve = cv; sat.oversample = ctx instanceof OfflineAudioContext ? '2x' : 'none';   // lighter while playing live
    const pre = ctx.createGain(); pre.gain.value = 0.8;
    const glue = ctx.createDynamicsCompressor(); glue.threshold.value = -20; glue.ratio.value = 2.2; glue.knee.value = 8; glue.attack.value = 0.025; glue.release.value = 0.3;
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.ratio.value = 20; lim.knee.value = 0; lim.attack.value = 0.002; lim.release.value = 0.08;
    const post = ctx.createGain(); post.gain.value = 1.15;
    master.connect(hp); hp.connect(mud); mud.connect(low); low.connect(air); air.connect(pre); pre.connect(sat); sat.connect(glue); glue.connect(post); post.connect(lim); lim.connect(ctx.destination); lim.connect(meter);
  }
  const G = {ctx, master, comp, verb, meter, tracks:{}};
  for(const tr of song.tracks) trackNode(G, song, tr);
  return G;
}
function trackNode(G, song, tr){
  if(G.tracks[tr.id]) return G.tracks[tr.id];
  const ctx = G.ctx, input = ctx.createGain(), vol = ctx.createGain(), pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(), send = ctx.createGain();
  const bass = ctx.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 200;
  const treble = ctx.createBiquadFilter(); treble.type = 'highshelf'; treble.frequency.value = 4000;
  const meter = ctx.createAnalyser(); meter.fftSize = 512;
  input.connect(bass); bass.connect(treble); treble.connect(vol); vol.connect(pan); pan.connect(G.master); vol.connect(send); send.connect(G.verb); pan.connect(meter);
  const n = G.tracks[tr.id] = {input, vol, pan, send, bass, treble, meter}; mixTrack(G, song, tr); return n;
}
function mixTrack(G, song, tr){
  const n = G.tracks[tr.id]; if(!n) return;
  n.vol.gain.value = audible(song, tr) ? (tr.vol ?? 0.8) : 0;
  if(n.pan.pan) n.pan.pan.value = tr.pan || 0;
  n.send.gain.value = tr.verb ?? 0.25;
  if(n.bass) n.bass.gain.value = tr.bass || 0;
  if(n.treble) n.treble.gain.value = tr.treble || 0;
  if(G.master) G.master.gain.value = song.master ?? 0.9;
}
// loudness 0..1 of an analyser right now (peak of the last few milliseconds)
const _lv = new Float32Array(512);
function level(an){ if(!an) return 0; an.getFloatTimeDomainData(_lv); let p = 0; for(let i = 0; i < _lv.length; i++){ const a = Math.abs(_lv[i]); if(a > p) p = a; } return p; }
function mixAll(G, song){ for(const tr of song.tracks){ trackNode(G, song, tr); mixTrack(G, song, tr); } }
// play one event at context time `when`; returns the source node
function fire(G, song, e, when, offset = 0){
  const info = bufferFor(song, e); if(!info) return null;
  const ctx = G.ctx, src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = info.buf; src.playbackRate.value = info.rate;
  const vel = e.type === 'amb' || e.type === 'clip' ? 1 : e.type === 'hit' ? e.v : info.layered ? 0.55 + 0.45 * e.v : 0.3 + 0.7 * e.v;
  g.gain.value = info.gain * vel; src.connect(g); g.connect(trackNode(G, song, e.tr).input);
  if(info.amb){ src.start(when, offset); src.stop(when + Math.max(0.1, e.dur - offset + 0.5)); return src; }
  if(e.type === 'note'){
    const len = info.buf.duration / info.rate; let skip = 0;
    if(info.sustain && e.legato && offset === 0){ skip = Math.min(0.12, len * 0.1); g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(info.gain * vel, when + 0.045); }   // joined to the note before
    else if(info.sustain && (song.feel ?? 0.6) > 0 && offset === 0){ g.gain.setValueAtTime(info.gain * vel * 0.55, when); g.gain.linearRampToValueAtTime(info.gain * vel, when + 0.07); }
    if(info.sustain && e.dur > len - 0.5 && info.buf.duration > 2){ src.loop = true; src.loopStart = 1.0; src.loopEnd = info.buf.duration - 0.45; }
    const end = when + e.dur - offset, rel = info.release || 0.3;
    if(!info.synth || SYN[INSTRUMENTS[e.tr.inst].id].sustain){ g.gain.setValueAtTime(info.gain * vel, Math.max(when, end - 0.001)); g.gain.setTargetAtTime(0, Math.max(when, end), rel / 3); }
    if(e.g && offset === 0){ const r = info.rate, pr = src.playbackRate; let t0 = when;
      if(e.g.from){ pr.setValueAtTime(r * Math.pow(2, e.g.from / 12), when); pr.linearRampToValueAtTime(r, when + e.g.slide); t0 = when + e.g.slide + 0.01; }
      if(e.g.kamp){ const st = Math.max(t0, when + Math.min(0.3, e.dur * 0.3)), len2 = Math.max(0.1, e.dur - (st - when) - 0.05), n = Math.max(4, Math.floor(len2 * 80)), cv = new Float32Array(n), f = 5.2;
        for(let q = 0; q < n; q++){ const tt = q / 80, ramp = Math.min(1, tt / 0.15); cv[q] = r * Math.pow(2, e.g.kamp * ramp * (0.5 - 0.5 * Math.cos(2 * Math.PI * f * tt)) / 12); }
        try{ pr.setValueCurveAtTime(cv, st, len2); }catch(err){} }
      else if(e.g.vib){ const st = Math.max(t0, when + e.g.vib.delay), len2 = e.dur - (st - when) - 0.04; if(len2 > 0.15){ const n = Math.max(4, Math.floor(len2 * 80)), cv = new Float32Array(n), f = e.g.vib.f || 5.4;
        for(let q = 0; q < n; q++){ const tt = q / 80, ramp = Math.min(1, tt / 0.3); cv[q] = r * Math.pow(2, e.g.vib.d * ramp * Math.sin(2 * Math.PI * f * tt) / 24); }
        try{ pr.setValueCurveAtTime(cv, st, len2); }catch(err){} } } }
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
    if(!this.ctx){ this.ctx = new (window.AudioContext || window.webkitAudioContext)({latencyHint:'playback'}); }   // bigger buffers: smooth on phones
    if(!this.G || this.G.song !== song){ this.G = graph(this.ctx, song); this.G.song = song; }
    if(this.ctx.state === 'suspended') this.ctx.resume();
    return this.G;
  }
  // smooth play: the whole song is mixed first (render), then the finished sound plays — it cannot break up on slow phones
  startBuf(song, fromSec){
    this.stop(); this.ensure(song); this.song = song; this.ev = []; this.playing = true;
    const end = Math.min(songSeconds(song), this.buf.duration - 0.02), ls = this.loop ? Math.min(this.loopA ?? 0, end) : 0, le = this.loop ? Math.min(this.loopB ?? end, end) : end;
    if(fromSec >= le - 0.01) fromSec = ls;
    const ctx = this.ctx, src = ctx.createBufferSource(), t0 = ctx.currentTime + 0.05; src.buffer = this.buf; src.connect(ctx.destination); if(this.G.meter) src.connect(this.G.meter);
    if(this.loop){ src.loop = true; src.loopStart = ls + 0.02; src.loopEnd = le + 0.02; }
    src.start(t0, fromSec + 0.02); this.srcs.add(src);
    this.segs = [{ctx0:t0, song0:fromSec, song1:le}]; this.next = le; this.ls = ls; this.le = le;
    this.timer = setInterval(() => this.tick(), 50);
  }
  // ---- smooth play in pieces: mix 10 seconds, start playing, mix the next piece while this one plays ----
  renderChunk(song, k){ return renderChunk(song, k); }
  async startChunks(song, fromSec, carry){
    const gen = ++this.gen, ctx = this.ctx, C = 10, key = JSON.stringify(song), exact = song.seconds && Math.abs(songSeconds(song) - song.seconds) < 0.5, end = exact ? song.seconds : songSeconds(song);
    if(this.chunkKey !== key){ this.chunks = {}; this.chunkKey = key; }
    const get = k => this.chunks[k] || (this.chunks[k] = this.renderChunk(song, k).catch(err => { delete this.chunks[k]; throw err; }));
    if(fromSec >= end - 0.05) fromSec = 0;
    const k0 = Math.floor(fromSec / C), first = await get(k0);
    if(gen !== this.gen) return;
    if(carry && this.playing) fromSec = Math.min(end - 0.05, this.position());   // remix while playing: carry on from where we are now
    this.stop(); this.gen = gen; this.ensure(song); this.song = song; this.ev = []; this.playing = true; this.ls = 0; this.le = end;
    const out = ctx.createGain(), t0 = ctx.currentTime + 0.06, lvl = 1.25; out.gain.value = lvl; out.connect(ctx.destination); if(this.G.meter) out.connect(this.G.meter);
    this.srcs.add({stop:() => out.disconnect()});
    if(exact){ const fo = Math.min(1.8, end / 10), te = t0 + end - fromSec; out.gain.setValueAtTime(lvl, Math.max(t0, te - fo)); out.gain.linearRampToValueAtTime(0.0001, te); }
    this.segs = [{ctx0:t0, song0:fromSec, song1:end}]; this.next = end;
    const play = (buf, k) => { const at = t0 + k * C - fromSec, now = ctx.currentTime + 0.02, src = ctx.createBufferSource(); src.buffer = buf; src.connect(out);
      if(at >= now) src.start(at); else if(now - at < buf.duration) src.start(now, now - at); else return; this.srcs.add(src); };
    play(first, k0); this.timer = setInterval(() => this.tick(), 50); if(this.onstart) this.onstart();
    (async () => { for(let k = k0 + 1; k * C < end; k++){ let buf; try{ buf = await get(k); }catch(err){ console.error(err); return; } if(gen !== this.gen || !this.playing) return; play(buf, k); } })();   // the rest is mixed while playing
  }
  start(song, fromSec){
    if(this.smooth && !this.loop){ this.startChunks(song, fromSec || 0).catch(err => console.error(err)); return; }
    if(this.smooth && this.buf && this.bufSong === song && this.bufKey === JSON.stringify(song)) return this.startBuf(song, fromSec);
    this.stop(); this.ensure(song); this.song = song; this.ev = events(song); this.playing = true;
    const end = songSeconds(song), ls = this.loop ? Math.min(this.loopA ?? 0, end) : 0, le = this.loop ? Math.min(this.loopB ?? end, end) : end;
    if(fromSec >= le - 0.01) fromSec = ls;
    this.segs = [{ctx0:this.ctx.currentTime + 0.08, song0:fromSec, song1:le}]; this.next = fromSec; this.ls = ls; this.le = le;
    // notes that started before the playhead but still sound
    for(const e of this.ev) if((e.type === 'note' || e.type === 'amb' || e.type === 'clip') && e.s < fromSec && e.s + e.dur > fromSec + 0.05){ const s = fire(this.G, song, e, this.segs[0].ctx0, fromSec - e.s); if(s){ this.srcs.add(s); s.onended = () => this.srcs.delete(s); } }
    this.timer = setInterval(() => this.tick(), 25); this.tick();
  }
  refresh(song){ if(!this.playing) return;   // after edits
    if(this.smooth && !this.loop){ if(this.chunkKey !== JSON.stringify(song) && this.onstale) this.onstale(); else this.start(song, this.position()); return; }   // pieces: remix from here, keep playing meanwhile
    if(this.smooth && this.buf && this.bufSong === song && this.bufKey !== JSON.stringify(song)){ if(this.onstale) this.onstale(); return; }   // keep playing; a fresh mix is made in the background
    const p = this.position(); this.start(song, p); }
  tick(){
    if(!this.playing) return;
    const now = this.ctx.currentTime, horizon = now + 1.2;   // schedule 1.2 s ahead so a busy phone never leaves a gap
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
  stop(ended){ this.gen = (this.gen || 0) + 1; if(this.playing) this.pos = ended ? 0 : this.position(); this.playing = false; clearInterval(this.timer);
    for(const s of this.srcs){ try{ s.stop(); }catch(e){} } this.srcs.clear(); if(ended && this.onend) this.onend(); }
}

// ---------------------------------------------------------------- offline render and encoders
async function renderChunk(song, k){
  // load recordings, but make synth notes only for this piece (they are made when fired), so the first piece is ready fast
  await load(); for(const tr of song.tracks) if(tr.type === 'amb') await ambLoad(tr.amb, songSeconds(song)); else if(tr.type === 'audio') await clipLoad(tr.blob);
  await Promise.all(needs(song).keys.map(fetchBuf));
  const C = 10, a = k * C, b = Math.min(songSeconds(song), a + C), mine = []; let maxEnd = b;
  for(const e of events(song)){
    if(e.type === 'amb' || e.type === 'clip'){ if(e.s < b && e.s + e.dur > a){ const off = Math.max(0, a - e.s), cut = e.s + e.dur > b; mine.push([{...e, dur:cut ? b - e.s - 0.5 : e.dur}, Math.max(0, e.s - a), off]); } continue; }
    if(e.s < a || e.s >= b) continue; mine.push([e, e.s - a, 0]); maxEnd = Math.max(maxEnd, e.s + (e.dur || 1.5) + 2.5);
  }
  const len = Math.min(C + 45, maxEnd - a + 3), ctx = new OfflineAudioContext(2, Math.ceil(len * SR), SR), G = graph(ctx, song);
  for(const [e, when, off] of mine) fire(G, song, e, when, off);
  return ctx.startRendering();
}
// long songs: mix in 10-second pieces and join them (uses far less memory than one big mix, so it works on phones)
async function renderPieces(song, onProgress, cache){
  const C = 10, exact = song.seconds && Math.abs(songSeconds(song) - song.seconds) < 0.5, end = songSeconds(song), K = Math.ceil(end / C);
  const n = exact ? Math.round(song.seconds * SR) : Math.ceil((end + 2.5) * SR), L = new Float32Array(n), Rr = new Float32Array(n);
  for(let k = 0; k < K; k++){
    const b = await (cache && cache[k] ? cache[k] : renderChunk(song, k)), o = Math.round(k * C * SR), l = b.getChannelData(0), r = b.getChannelData(1), m = Math.min(b.length, n - o);
    for(let i = 0; i < m; i++){ L[o + i] += l[i]; Rr[o + i] += r[i]; }
    onProgress && onProgress((k + 1) / K * 0.97); await new Promise(res => setTimeout(res, 0));
  }
  let pk = 0, last = n - 1; for(let i = 0; i < n; i++){ const a = Math.max(Math.abs(L[i]), Math.abs(Rr[i])); if(a > pk) pk = a; }
  if(!exact){ const thr = pk * 0.001; while(last > end * SR && Math.abs(L[last]) < thr && Math.abs(Rr[last]) < thr) last--; }
  const len = exact ? n : Math.min(n, last + Math.floor(0.2 * SR)), g = 0.89 / (pk || 1), fo = Math.floor((exact ? Math.min(1.8, song.seconds / 10) : 0.15) * SR);
  const res = new AudioBuffer({length:len, numberOfChannels:2, sampleRate:SR});
  for(const [src, c] of [[L, 0], [Rr, 1]]){ const d = src.subarray(0, len); for(let i = 0; i < len; i++) d[i] *= g * (i > len - fo ? (len - i) / fo : 1); res.copyToChannel(d, c); }
  onProgress && onProgress(1); return res;
}
async function render(song, onProgress){
  await prepare(song, p => onProgress && onProgress(p * 0.5));
  const len = songSeconds(song) + 2.5, ctx = new OfflineAudioContext(2, Math.ceil(len * SR), SR), G = graph(ctx, song);
  for(const e of events(song)) fire(G, song, e, e.s + 0.02);
  onProgress && onProgress(0.55);
  // report progress while mixing (pause the mix briefly every 5% of the song)
  if(onProgress && ctx.suspend) for(let k = 1; k < 20; k++){ const at = Math.floor(len * k / 20 * SR / 128) * 128 / SR; ctx.suspend(at).then(() => { onProgress(0.55 + 0.43 * k / 20); ctx.resume(); }).catch(() => {}); }
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
// chord progressions (scale steps, 0 = Sa / home chord). Verse, chorus and bridge each get their own.
const PROGS = {
  major:[[0, 4, 5, 3], [0, 5, 3, 4], [0, 3, 4, 3], [0, 3, 0, 4], [5, 3, 0, 4], [0, 2, 3, 4], [0, 4, 3, 4], [0, 3, 5, 4], [0, 5, 1, 4], [3, 4, 0, 0], [0, 0, 3, 4],
    [0, 4, 5, 2, 3, 0, 3, 4], [0, 3, 4, 0, 5, 3, 1, 4], [0, 1, 3, 4], [3, 0, 4, 5], [0, 5, 3, 4, 0, 5, 1, 4], [3, 4, 2, 5], [0, 2, 5, 4]],
  minor:[[0, 5, 2, 6], [0, 3, 4, 0], [0, 6, 5, 4], [0, 3, 6, 2], [0, 5, 3, 4], [5, 6, 0, 0], [0, 6, 5, 6], [0, 2, 3, 4], [0, 3, 0, 4], [0, 5, 6, 0],
    [0, 3, 6, 2, 5, 1, 4, 4], [0, 0, 5, 6], [3, 4, 0, 0], [0, 6, 3, 4]],
  modal:[[0, 0, 3, 0], [0, 3, 0, 4], [0, 6, 0, 3], [0, 0, 6, 6], [0, 3, 4, 0], [0, 4, 3, 0], [0, 0, 4, 3], [0, 1, 0, 6], [0, 3, 3, 0], [0, 0, 1, 0], [0, 4, 0, 3, 0, 6, 0, 0]],
  penta:[[0, 3, 2, 0], [0, 2, 3, 0], [0, 0, 3, 3], [0, 4, 3, 0], [0, 1, 0, 3], [0, 3, 4, 0], [0, 2, 0, 4], [0, 0, 2, 0], [0, 3, 0, 2, 0, 4, 3, 0]],
};
function progFamily(song){ const s = (SCALES[song.scale] || SCALES.major).s; if(s.length < 5) return null; if(s.length < 7) return 'penta';
  if(s.includes(4) && s.includes(11) && s.includes(7)) return 'major'; if(s.includes(3) && s.includes(8) && s.includes(7)) return 'minor'; return 'modal'; }
// choose verse / chorus / bridge progressions for a song (different ones where possible)
function pickProgs(song, R, indian){
  const fam = progFamily(song); if(!fam) return null; let list = PROGS[fam];
  if(indian) list = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 3, 0], [0, 0, 4, 0], [0, 4, 0, 0], [0, 0, 0, 4]];   // Indian music rests on Sa: chords change rarely
  if(song._bright && fam === 'major') list = list.filter(P => P[0] === 0 && P.filter(d => d === 5 || d === 2).length <= 1);
  const A = R.pick(list); let B = R.pick(list), C = R.pick(list), k = 0; while(B === A && k++ < 9) B = R.pick(list); k = 0; while((C === A || C === B) && k++ < 9) C = R.pick(list);
  return {A, B, C};
}
function chordDegrees(song, sec){ const P = song.progs && (song.progs[sec] || song.progs.A); if(P) return P;
  const n = (SCALES[song.scale] || SCALES.major).s.length;
  if(song.scale === 'major') return [0, 4, 5, 3]; if(song.scale === 'minor') return [0, 5, 2, 6]; if(n >= 7) return [0, 3, 4, 0]; if(n === 5) return [0, 3, 2, 0]; return [0, 0, 0, 0]; }
function chordAt(song, bar, center, sec){
  const sc = (SCALES[song.scale] || SCALES.major).s, P = chordDegrees(song, sec), r = rootOf(song), n = sc.length, deg = P[bar % P.length] % Math.max(1, n);
  const pick = k => { const i = deg + k; return r + sc[i % n] + 12 * Math.floor(i / n); };
  let ch = n >= 5 ? [pick(0), pick(2), pick(4)] : [pick(0), pick(0) + 7];
  while(ch[0] < center - 6) ch = ch.map(m => m + 12); while(ch[0] > center + 6) ch = ch.map(m => m - 12);
  return ch;
}
// ---------------------------------------------------------------- hand-written melody phrases (a composer's notebook)
// Each phrase is 4 bars of 4 beats. "step:beats" — step = scale steps up/down from the previous note
// (the first number of the phrase is counted from Sa), beats = how long the note lasts. Original tunes, written for VideoGen.
const PHRASEBOOK = {
  kids:[      // bouncy, repeating notes, very catchy (jingle-bells style)
    '4:1 0:1 -2:2 | 1:1 0:1 -2:2 | 1:.5 0:.5 0:.5 0:.5 1:1 1:1 | -2:4',
    '0:.5 0:.5 2:1 0:.5 0:.5 2:1 | 1:1 -1:1 -1:2 | 0:.5 0:.5 2:1 0:.5 0:.5 2:1 | 1:1 -3:1 -2:2',
    '4:1 -1:1 -1:1 -2:1 | 0:1 2:1 2:2 | 1:1 -1:1 -1:1 -2:1 | -1:1 1:1 -2:2',
    '0:1 0:.5 0:.5 1:1 1:1 | 1:2 -2:2 | 0:1 0:.5 0:.5 -1:1 -1:1 | -1:4',
    '2:.5 0:.5 0:1 2:.5 0:.5 0:1 | 1:1 -1:1 -2:2 | 2:.5 0:.5 0:1 2:.5 0:.5 0:1 | -1:1 -1:1 -1:2',
    '4:1 0:1 0:1 0:1 | 1:1 -1:1 -2:2 | 3:1 0:1 0:1 0:1 | -1:1 -1:1 -2:2',
    '0:.5 1:.5 1:.5 1:.5 0:1 -2:1 | 0:.5 1:.5 1:.5 1:.5 0:2 | 3:.5 -1:.5 -1:.5 -1:.5 0:1 1:1 | -4:4',
  ],
  bright:[    // confident, rising, positive (motivational, business, happy)
    '0:1.5 1:.5 1:1 1:1 | 1:3 -1:1 | -1:1.5 1:.5 1:1 2:1 | -1:4',
    '2:1 1:.5 1:1.5 -1:1 | -2:2 1:2 | 0:1 1:.5 1:1.5 1:1 | 1:4',
    '0:.5 1:.5 1:1 0:1 1:1 | 1:2 -2:1 1:1 | 0:.5 1:.5 1:1 0:1 2:1 | -1:4',
    '4:1 -1:1 -1:1 -1:1 | 1:3 1:1 | 1:1 -1:1 -1:1 -1:1 | -1:4',
    '0:1 2:1 1:1 1:1 | -1:2 -1:2 | 0:1 2:1 1:1 2:1 | -1:4',
    '2:1.5 0:.5 1:1 1:1 | 0:1.5 -1:.5 -1:2 | 0:1.5 0:.5 1:1 2:1 | -1:2 -1:2',
  ],
  calm:[      // long, connected, step by step (calm, church, zen)
    '2:2 1:1 -1:1 | -1:4 | 1:2 1:1 1:1 | -2:4',
    '0:3 1:1 | 1:2 -1:2 | 2:3 -1:1 | -1:4',
    '4:2 -1:2 | -1:3 -1:1 | 1:2 1:2 | -2:4',
    '0:1.5 1:.5 1:2 | -1:4 | 1:1.5 1:.5 1:2 | -2:4',
    '2:2 2:2 | -1:2 -1:2 | -1:2 1:1 1:1 | -2:4',
  ],
  sad:[       // slow, falling phrases, long notes
    '4:2 -1:1 -1:1 | -1:3 -1:1 | 2:2 -1:1 -1:1 | -1:4',
    '0:1 1:1 1:2 | -1:1 -1:1 -1:2 | 0:1 -1:1 -1:2 | -1:4',
    '2:3 -1:1 | -1:2 1:2 | -1:3 -1:1 | -1:4',
    '5:2 -1:1 -1:1 | -1:2 -1:2 | 1:2 -1:1 -1:1 | -1:4',
  ],
  romantic:[  // flowing, sweeping, a few warm leaps
    '0:1 2:1 2:2 | 1:1.5 -1:.5 -1:2 | -2:1 2:1 2:2 | 1:4',
    '4:3 -1:1 | -1:2 -1:1 -1:1 | 3:3 -1:1 | -1:4',
    '0:.5 1:.5 1:3 | -1:1 -1:1 -1:2 | 0:.5 1:.5 1:3 | 1:4',
    '2:1.5 1:.5 1:2 | -2:2 1:2 | -1:1.5 1:.5 1:2 | -2:4',
    '4:2 1:1 -1:1 | -2:3 -1:1 | 3:2 1:1 -1:1 | -3:4',
  ],
  epic:[      // strong long notes, bold jumps (cinematic, orchestra)
    '0:2 4:2 | 1:3 -1:1 | -2:2 2:2 | -3:4',
    '0:1.5 0:.5 4:2 | -1:1 -1:1 -1:2 | 0:1.5 0:.5 3:2 | -1:4',
    '4:3 1:1 | -1:2 -1:2 | -2:3 4:1 | -1:4',
    '0:1 0:.5 0:.5 4:2 | 1:2 -2:2 | -1:1 0:.5 0:.5 3:2 | -2:4',
  ],
};
const PHRASES4 = {}; for(const [k, list] of Object.entries(PHRASEBOOK)) PHRASES4[k] = list.map(str => str.split('|').map(bar => { const ns = bar.trim().split(/\s+/).map(x => x.split(':').map(Number)); return [ns.map(n => n[0]), ns.map(n => n[1])]; }));
const LEGATO = {kids:0.62, bright:0.85, calm:1, sad:1, romantic:1, epic:0.95};
// instruments that can take each other's place (so each tune number sounds different, but still fits the mood)
const FAMILY = {
  melody:[['s:bansuri', 's:veena', 'r:flute', 's:sitar', 'r:shehnai', 'r:sitar_rec', 's:harmonium'], ['r:piano', 'r:grand', 'r:flute', 'r:violin', 'r:oboe', 'r:clarinet', 'r:epiano'],
    ['r:glock', 'r:xylophone', 'r:marimba', 'r:celesta', 'r:musicbox', 'r:kalimba_rec'], ['r:horn', 'r:trumpet', 'r:violins', 'r:cellos'], ['r:tsax', 'r:clarinet', 'r:epiano', 'r:violin']],
  counter:[['r:violin', 'r:flute', 'r:oboe', 'r:clarinet', 'r:violas'], ['s:bansuri', 'r:flute', 's:veena', 's:santoor'], ['r:choir', 'r:violins', 'r:warmpad'], ['r:harmonica', 'r:accordion', 'r:violin']],
  pad:[['r:warmpad', 'r:violins', 'r:choir', 'r:violas'], ['r:epiano', 'r:piano', 'r:grand'], ['s:harmonium', 'r:reedorgan', 'r:accordion']],
  arp:[['r:harp', 's:santoor', 'r:celesta', 'r:dulcimer', 'r:kalimba_rec', 's:kalimba'], ['r:steel', 'r:nylon', 'r:marimba', 'r:harp'], ['r:xylophone', 'r:marimba', 'r:glock', 'r:musicbox']],
  bass:[['r:pizz', 'r:basses', 'r:cellos']],
};
const FAMILY_CALM = {   // slower moods: only gentle instruments
  melody:[['s:bansuri', 's:veena', 'r:flute', 'r:sitar_rec', 's:sitar', 's:harmonium', 'r:panflute'], ['r:piano', 'r:grand', 'r:flute', 'r:violin', 'r:clarinet'], ['r:glock', 'r:celesta', 'r:musicbox', 'r:kalimba_rec']],
  pad:[['r:warmpad', 'r:violins', 'r:choir', 'r:violas'], ['r:epiano', 'r:piano', 'r:grand'], ['s:harmonium', 'r:reedorgan']],
};
const ROLE_OFF = {melody:1, counter:2, pad:3, arp:2, bass:1};
// ---------------------------------------------------------------- tabla played from bols (stroke names), like a real tabla player
// theka = the basic cycle of each tala; each tala cycle gets small natural changes, and a fill (tirakita…) every few cycles
const THEKA = {
  keherwa:   {beat:0.5, bols:'Dha Ge Na Ti Na Ke Dhi Na', khali:[4, 5, 6, 7]},
  tabla_soft:{beat:0.5, bols:'Dha - Na - Ta - Na -', khali:[4, 5, 6, 7]},
  teentaal:  {beat:1, bols:'Dha Dhin Dhin Dha Dha Dhin Dhin Dha Dha Tin Tin Ta Ta Dhin Dhin Dha', khali:[8, 9, 10, 11]},
  dadra:     {beat:0.5, bols:'Dha Dhi Na Dha Tu Na', khali:[3, 4, 5]},
  rupak:     {beat:0.5, bols:'Tin Tin Na Dhi Na Dhi Na', khali:[0, 1, 2]},
};
const BOL_ROW = {Dha:'s:tabla:dha', Dhin:'s:tabla:dhin', Dhi:'s:tabla:dhin', Na:'s:tabla:na', Ta:'s:tabla:na', Tin:'s:tabla:tin', Ti:'s:tabla:te', Te:'s:tabla:te', Tu:'s:tabla:tun', Tun:'s:tabla:tun', Ge:'s:tabla:ge', Ke:'s:tabla:ke', Ka:'s:tabla:ke', Ra:'s:tabla:te', Ki:'s:tabla:ke'};
// how the tabla player plays in each mood: soft and sparse for meditation, full with fills for bhajan and classical
const TABLA_STYLE = {meditation:'soft', spiritual:'soft', calm:'soft', romantic:'gentle', devotional:'full', aarti:'full', folk:'full', festival:'full', hindustani:'classical', custom:'gentle'};
function tablaHits(rhythm, offBars, totalB, bpb, style, R){
  const T = THEKA[rhythm], bols = T.bols.split(' '), cyc = bols.length * T.beat, out = [], off = new Set(offBars);
  const vol = {soft:0.5, gentle:0.68, full:0.85, classical:0.85}[style] || 0.8, fillEvery = {soft:0, gentle:8, full:4, classical:2}[style] ?? 4;
  const FILLS = ['Ti Ra Ki Ta Dha -', 'Dha Ti Ra Ki Ta Dha', 'Ta Ka Ti Ra Ki Ta', 'Dha Ge Na Ge Dha -'];
  let n = 0;
  for(let c0 = 0; c0 + 1e-6 < totalB; c0 += cyc, n++){
    const fill = fillEvery && n % fillEvery === fillEvery - 1, fillBeats = Math.min(cyc, 2), fb = fill ? R.pick(FILLS).split(' ') : null;
    bols.forEach((b, i) => { const t = c0 + i * T.beat; if(b === '-' || t >= totalB || off.has(Math.floor(t / bpb + 1e-6))) return;
      if(fb && t >= c0 + cyc - fillBeats - 1e-6) return;                     // the fill replaces the end of this cycle
      if(style === 'soft' && i && R() < 0.25) return;                         // meditation: leave space
      const sam = i === 0, kh = T.khali.includes(i), jitter = (R() - 0.5) * 0.12;
      out.push({t, row:BOL_ROW[b] || 's:tabla:na', v:Math.max(0.2, Math.min(1, vol * (sam ? 1.12 : kh ? 0.78 : 0.92) + jitter))});
      if((style === 'full' || style === 'classical') && !sam && R() < 0.12 && T.beat >= 0.5) out.push({t:t + T.beat / 2, row:R() < 0.5 ? 's:tabla:ke' : 's:tabla:te', v:vol * 0.38});   // ghost stroke
    });
    if(fb){ const st = fillBeats / fb.length, t0 = c0 + cyc - fillBeats; fb.forEach((b, i) => { const t = t0 + i * st; if(b !== '-' && t < totalB && !off.has(Math.floor(t / bpb + 1e-6))) out.push({t, row:BOL_ROW[b] || 's:tabla:na', v:Math.min(1, vol * (i === fb.length - 1 || b === 'Dha' ? 1.05 : 0.8))}); }); }
  }
  return out;
}
const RHY4 = [[1, 1, 1, 1], [1.5, 0.5, 1, 1], [0.5, 0.5, 1, 2], [2, 1, 1], [1, 0.5, 0.5, 2], [1, 1, 2], [0.5, 0.5, 0.5, 0.5, 1, 1], [3, 1], [1.5, 1.5, 1]];
const RHY3 = [[1, 1, 1], [2, 1], [1.5, 0.5, 1], [0.5, 0.5, 1, 1], [3]];
function fit(arr, range){ const [lo, hi] = range; return arr.map(m => { while(m < lo) m += 12; while(m > hi) m -= 12; return m; }); }
function auto(song, tr, kind, seed = 1, bars, opts = {}){
  const I = INSTRUMENTS[tr.inst] || {range:[48, 84]}, R = rng(seed * 7919 + kind.length), bpb = beatsPerBar(song), nb = bars || song.bars, out = [];
  const lo = I.range[0], hi = I.range[1], mid = Math.max(lo + 6, Math.min(hi - 6, Math.round((lo + hi) / 2) + (opts.shift || 0))), r = rootOf(song);
  const CH = (bar, c) => chordAt(song, bar, c, opts.sec), acc = song.acc || {};
  if(kind === 'melody'){   // a short hook, its answer, the hook again a step higher or lower, then a cadence home
    const pool = scaleMidis(song, Math.max(lo, mid - 9), Math.min(hi, mid + 10)); if(!pool.length) return out;
    const home = pool.indexOf(pool.reduce((b, m) => (m - r) % 12 === 0 && Math.abs(m - mid) < Math.abs(b - mid) ? m : b, pool[0]));
    const RH = bpb === 3 ? RHY3 : opts.style === 'flow' ? [[2, 1, 1], [3, 1], [1.5, 1.5, 1], [2, 2], [1, 1, 2], [1.5, 0.5, 2]] : opts.style === 'lively' ? [[0.5, 0.5, 0.5, 0.5, 1, 1], [1, 0.5, 0.5, 1, 1], [0.5, 0.5, 1, 0.5, 0.5, 1], [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1], [0.5, 1, 0.5, 1, 1]] : RHY4;
    const STEP = opts.style === 'flow' ? [-1, -1, 1, 1, 2, -2, 0] : [-2, -1, -1, 0, 1, 1, 2, 3, -3];
    const book = bpb === 4 && PHRASES4[opts.mstyle];
    if(book){   // hand-written phrases: verse and chorus each get their own, the second time ends home
      const scaleLen = (SCALES[song.scale] || SCALES.major).s.length, ph = book[(R() * book.length | 0)], leg = LEGATO[opts.mstyle] || 0.95, cl = i => Math.max(0, Math.min(pool.length - 1, i));
      const tones = bar => new Set(CH(bar, 60).map(m => (m % 12 + 12) % 12));
      const snap = (i, bar) => { const T = tones(bar); for(let d = 0; d <= 2; d++) for(const j of [i - d, i + d]) if(j >= 0 && j < pool.length && T.has(pool[j] % 12)) return j; return i; };
      let idx = home;
      for(let bar = 0; bar < nb; bar++){
        const pos = bar % 4, [steps, rh] = ph[pos], last = rh.length - 1; let t = bar * bpb;
        rh.forEach((d, i) => {
          if(bar % 4 === 0 && i === 0){ const tg = home + steps[0], oct = scaleLen; const c = [tg, tg - oct, tg + oct].filter(j => j >= 0 && j < pool.length); idx = bar === 0 || !c.length ? cl(tg) : c.reduce((a, b) => Math.abs(b - idx) < Math.abs(a - idx) ? b : a); }
          else idx = cl(idx + steps[i]);
          if(i === 0 || d >= 2) idx = snap(idx, bar);
          if(pos === 3 && i === last) idx = (bar % 8 === 7 || bar === nb - 1) ? home : snap(idx, bar);   // phrase ends: home at the end of 8 bars
          out.push({t, d:d * leg, m:pool[idx], v:i === 0 ? 0.85 : d >= 2 ? 0.78 : 0.7}); t += d;
        });
      }
      return out;
    }
    const hookR = [R.pick(RH), R.pick(RH)], hookS = hookR.map(rh => rh.map(() => R.pick(STEP)));
    const start = home + R.pick([0, 2, 4, -1, 1]), seq = R.pick([1, 2, -1, 2, -2]);
    const tones = bar => new Set(CH(bar, 60).map(m => (m % 12 + 12) % 12));
    const snap = (i, bar) => { const T = tones(bar); let best = i; for(let d = 0; d <= 3; d++){ for(const j of [i - d, i + d]) if(j >= 0 && j < pool.length && T.has(pool[j] % 12)) return j; } return best; };
    let idx = start;
    for(let bar = 0; bar < nb; bar++){
      const pos = bar % 4, eight = bar % 8, cl = i => Math.max(0, Math.min(pool.length - 1, i)); let rh, steps, t = bar * bpb;
      if(pos === 3){ rh = bpb === 3 ? [1, 2] : R.pick([[1, 1, 2], [2, 2], [1.5, 0.5, 2], [1, 3]]); steps = null; }
      else if(pos === 1 && eight === 5){ rh = R.pick(RH); steps = rh.map(() => R.pick(STEP)); }
      else { rh = hookR[pos === 1 ? 1 : 0]; steps = hookS[pos === 1 ? 1 : 0]; }
      if(pos === 0) idx = cl(start + (eight === 4 && R() < 0.5 ? seq : 0)); if(pos === 2) idx = cl(start + seq);
      const goal = cl(home + (eight === 3 && pool.length > 4 ? R.pick([2, -2, 4]) : 0));
      rh.forEach((d, i) => {
        if(steps){ if(i > 0) idx = cl(idx + steps[i]); }
        else { const left = rh.length - 1 - i; idx = left === 0 ? goal : cl(idx + Math.sign(goal - idx) * Math.min(2, Math.abs(goal - idx))); }
        if(i === 0 || d >= 2) idx = snap(idx, bar);
        if(!(R() < 0.06 && i > 0 && i < rh.length - 1)) out.push({t, d:d * 0.95, m:pool[idx], v:i === 0 ? 0.86 : 0.72 + (d >= 1.5 ? 0.06 : 0)});
        t += d;
      });
    }
  } else if(kind === 'chords'){   // block, pulse, broken, alberti or off-beat
    const pat = acc.chords || 'block';
    for(let bar = 0; bar < nb; bar++){ const ch = fit(CH(bar, Math.max(lo + 5, Math.min(hi - 10, 60))), [lo, hi]).sort((x, y) => x - y), T = bar * bpb, [a, b2 = a + 7, c = a + 12] = ch;
      if(pat === 'pulse') for(let k = 0; k < bpb; k++) ch.forEach(m => out.push({t:T + k, d:0.9, m, v:k === 0 ? 0.62 : 0.5}));
      else if(pat === 'broken'){ out.push({t:T, d:bpb, m:a, v:0.62}); out.push({t:T + 1, d:bpb - 1, m:b2, v:0.52}); out.push({t:T + 2, d:bpb - 2, m:c, v:0.52}); if(bpb === 4) out.push({t:T + 3, d:1, m:b2, v:0.48}); }
      else if(pat === 'alberti'){ const q = [a, c, b2, c]; for(let k = 0; k < bpb * 2; k++) out.push({t:T + k * 0.5, d:0.55, m:q[k % 4], v:k % 2 ? 0.45 : 0.55}); }
      else if(pat === 'offbeat'){ out.push({t:T, d:bpb, m:a, v:0.42}); for(let k = 0; k < bpb; k++) [b2, c].forEach(m => out.push({t:T + k + 0.5, d:0.4, m, v:0.5})); }
      else ch.forEach(m => out.push({t:T, d:bpb, m, v:0.6})); }
  } else if(kind === 'bass'){    // root-fifth, octave, walking, syncopated or long notes
    const pat = acc.bass || 'root5', bl = [lo, Math.min(hi, lo + 18)], root = bar => fit([CH(bar, 48)[0] - 12], bl)[0], five = m => m + 7 <= bl[1] ? m + 7 : m - 5 >= lo ? m - 5 : m;
    for(let bar = 0; bar < nb; bar++){ const m = root(bar), T = bar * bpb;
      if(bpb === 3 && pat !== 'walk'){ out.push({t:T, d:2.9, m, v:0.8}); continue; }
      if(pat === 'octave'){ for(let k = 0; k < bpb * 2; k++) out.push({t:T + k * 0.5, d:0.45, m:k % 2 && m + 12 <= hi ? m + 12 : m, v:k % 2 ? 0.6 : 0.78}); }
      else if(pat === 'walk'){ const pool = scaleMidis(song, lo, Math.min(hi, lo + 20)), nx = root(bar + 1); let i = pool.indexOf(m); if(i < 0) i = 0; const j = Math.max(0, pool.indexOf(nx));
        for(let k = 0; k < bpb; k++){ const last = k === bpb - 1; const mm = k === 0 ? m : last ? (pool[j + (pool[i] > nx ? 1 : -1)] ?? nx) : pool[Math.max(0, Math.min(pool.length - 1, i += (j >= i ? 1 : -1)))]; out.push({t:T + k, d:0.92, m:mm, v:k === 0 ? 0.82 : 0.68}); } }
      else if(pat === 'sync'){ out.push({t:T, d:1.4, m, v:0.85}); out.push({t:T + 1.5, d:1, m, v:0.66}); out.push({t:T + 3, d:0.9, m:five(m), v:0.7}); }
      else if(pat === 'long'){ out.push({t:T, d:bpb - 0.1, m, v:0.8}); }
      else { out.push({t:T, d:1.9, m, v:0.85}); out.push({t:T + 2, d:1.9, m:R() < 0.5 ? m : five(m), v:0.7}); } }
  } else if(kind === 'arp'){     // eight different arpeggio shapes
    const SH = [[0, 1, 2, 3, 2, 1], [0, 1, 2, 3, 4, 3, 2, 1], [0, 2, 1, 3, 1, 2], [0, 2, 3, 2], [3, 2, 1, 0], [0, 1, 2, 1], [0, 3, 1, 4, 2, 5], [0, 2, 4, 5, 4, 2]], shp = SH[(acc.arp || 0) % SH.length];
    for(let bar = 0; bar < nb; bar++){ const ch = fit(CH(bar, Math.max(lo + 3, Math.min(hi - 14, 62))), [lo, hi]).sort((x, y) => x - y); const a = ch[0], b2 = ch[1] ?? a + 7, c = ch[2] ?? a + 12, ext = [a, b2, c, a + 12, b2 + 12, c + 12];
      for(let i = 0; i < bpb * 2; i++) out.push({t:bar * bpb + i * 0.5, d:0.9, m:fit([ext[shp[i % shp.length]]], [lo, hi])[0], v:i % 2 ? 0.55 : 0.7}); }
  } else if(kind === 'raga'){   // melody made from the raga's own phrases, landing on Sa / Pa every 4 bars
    const sc = (SCALES[song.scale] || SCALES.major).s, map = swaraMap(sc), list = phraseList(song);
    let sa = r + 12; while(sa < lo + 5) sa += 12; while(sa > hi - 10) sa -= 12;
    const total = nb * bpb; let t = 0, last = sa, nextCad = Math.min(total, 4 * bpb), cadN = 0, motif = null;
    while(t < total - 0.25){
      const cands = [0, 1, 2].map(() => phrasePitches(R.pick(list), map, sa)).filter(c => c.length);
      if(!cands.length) break;
      let ph = cands.reduce((b, c) => Math.abs(c[0] - last) < Math.abs(b[0] - last) ? c : b, cands[0]);
      if(opts.style === 'motif' && motif && R() < 0.5){ const pool = scaleMidis(song, lo - 12, hi + 12), st = R() < 0.5 ? 1 : -1; ph = motif.map(m => { const i = pool.indexOf(m); return i >= 0 ? pool[Math.max(0, Math.min(pool.length - 1, i + st))] : m; }); }
      else if(!motif) motif = ph.slice();
      if(Math.abs(ph[0] - last) > 7) ph = ph.map(m => m + (ph[0] > last ? -12 : 12) * (Math.abs(ph[0] - last) > 9 ? 1 : 0));
      ph = ph.map(m => { while(m < lo) m += 12; while(m > hi) m -= 12; return m; });
      for(let i = 0; i < ph.length && t < nextCad - 0.25; i++){
        const lastOne = i === ph.length - 1, d = lastOne ? R.pick(opts.style === 'lively' ? [1, 1, 1.5] : [1, 1, 1.5, 2]) : R.pick(opts.style === 'flow' ? [1, 1, 0.5, 1.5] : opts.style === 'lively' ? [0.5, 0.5, 0.25, 0.25, 0.5] : [0.5, 0.5, 0.5, 1, 0.5]);
        const dd = Math.min(d, nextCad - t); out.push({t, d:dd * 0.95, m:ph[i], v:i === 0 ? 0.82 : 0.7 + R() * 0.1}); last = ph[i]; t += dd; }
      if(R() < 0.3) t += 0.5;
      if(t >= nextCad - 1.01){   // cadence: long Sa (or Pa) to end the 4-bar phrase
        const land = cadN % 2 === 1 && map.P !== undefined ? sa + 7 : sa; const lt = Math.max(t, nextCad - 1.5);
        if(lt < nextCad){ out.push({t:lt, d:(nextCad - lt) * 0.95, m:land, v:0.78}); last = land; }
        t = nextCad; nextCad = Math.min(total, nextCad + 4 * bpb); cadN++; }
    }
    if(out.length){ const e = out[out.length - 1]; e.m = sa; }
  } else if(kind === 'strum'){   // guitar strumming: down on 1 and 3, lighter up-strokes on 2 and 4
    for(let bar = 0; bar < nb; bar++){ const ch = fit(CH(bar, Math.max(lo + 4, Math.min(hi - 14, 55))), [lo, hi]); const notes = [ch[0] - 12 >= lo ? ch[0] - 12 : ch[0], ...ch, ch[0] + 12 <= hi ? ch[0] + 12 : ch[1]];
      for(let b = 0; b < bpb; b++){ const down = b % 2 === 0, seq = down ? notes : notes.slice(1).reverse(); seq.forEach((m, i) => out.push({t:bar * bpb + b + i * 0.025, d:0.9 - i * 0.02, m, v:(down ? 0.62 : 0.42) - i * 0.02}));
        if(!down && R() < 0.4){ seq.slice(0, 3).forEach((m, i) => out.push({t:bar * bpb + b + 0.5 + i * 0.02, d:0.4, m, v:0.36})); } } }
  } else if(kind === 'bowls'){   // bowls tuned to Sa, Pa and upper Sa, one strike every two bars
    const sc = (SCALES[song.scale] || SCALES.major).s; let sa = r; while(sa < lo) sa += 12; while(sa + 12 > hi) sa -= 12;
    const pa = sc.includes(7) ? sa + 7 : sa + (sc[Math.floor(sc.length / 2)] || 7), seq = [sa, pa, sa + 12, pa];
    for(let bar = 0, k = 0; bar < nb; bar += 2, k++){ out.push({t:bar * bpb, d:bpb * 2, m:seq[k % 4], v:0.8});
      if(R() < 0.35 && bar + 1 < nb) out.push({t:bar * bpb + bpb * 1.5, d:bpb, m:seq[(k + 2) % 4], v:0.45}); }
  } else if(kind === 'hum'){     // rubbed bowl: one long hum on low Sa every four bars
    let sa = r; while(sa < lo) sa += 12; while(sa - 12 >= lo) sa -= 12;
    for(let bar = 0; bar < nb; bar += 4) out.push({t:bar * bpb, d:Math.min(4, nb - bar) * bpb * 0.98, m:sa, v:0.6});
  } else if(kind === 'sparkle'){  // chimes: a few soft high notes from the raga
    const pool = scaleMidis(song, lo, hi);
    for(let bar = 0; bar < nb; bar++){ const k = R() < 0.5 ? 1 : R() < 0.5 ? 2 : 0; for(let j = 0; j < k; j++) out.push({t:bar * bpb + Math.floor(R() * bpb * 2) / 2, d:1, m:R.pick(pool), v:0.35 + R() * 0.25}); }
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
    for(let bar = 0; bar < nb; bar++){ const ch = fit(CH(bar, mid), [lo, hi]).concat(fit(CH(bar, mid + 12), [lo, hi]));
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

// ---------------------------------------------------------------- raga phrases (S R G M P D N; ' = upper octave, , = lower octave)
const PHRASES = {
  mohanam:['G P D S\'', 'S\' D P G R', 'G R S D, S', 'P D S\' R\' S\' D P', 'G P D P G R S', 'R G P G R S', 'D, S R G P', 'P G R G P D'],
  hamsadhwani:['S R G P N S\'', 'S\' N P G R S', 'G P N P G R', 'R G P G R S', 'P N S\' R\' S\' N P', 'N, S R G R S', 'G R S N, S'],
  hindolam:['S G M D N S\'', 'S\' N D M G S', 'G M D M G S', 'M D N D M', 'N, S G M G S', 'D N S\' N D M G', 'G M G S N, S'],
  kalyani:['S R G M P D N S\'', 'S\' N D P M G R S', 'N, R G M P', 'G M D N D P', 'P M G R S', 'D N S\' N D P M G', 'M D N S\' N D'],
  mayamalavagowla:['S R G M P D N S\'', 'S\' N D P M G R S', 'G M P D P M G', 'R G M G R S', 'D N S\' N D P', 'M G R S N, S'],
  kharaharapriya:['S R G M P D N S\'', 'S\' N D P M G R S', 'R G M P M G R', 'P D N D P M', 'G R S N, S', 'M P D N D P'],
  abheri:['S G M P N S\'', 'S\' N D P M G R S', 'G M P N P M G', 'M G R S', 'N, S G M P', 'P N S\' N D P'],
  major:['S R G M P D N S\'', 'S\' N D P M G R S', 'G M P M G R S', 'P D N S\'', 'R G M G R S', 'G P D P M G'],
  minor:['S R G M P D N S\'', 'S\' N D P M G R S', 'G M P M G R S', 'P D N D P', 'R G M G R S', 'D P M G R'],
  bhairavi:['S R G M P D N S\'', 'G M P D P M G R', 'R G M G R S', 'D N S\' N D P', 'S\' N D P M G R S', 'N, S R G R S'],
  shivaranjani:['S R G P D S\'', 'S\' D P G R S', 'G R S D, S', 'P D S\' D P G', 'R G R S', 'D, S R G P'],
  revati:['S R M P N S\'', 'S\' N P M R S', 'M P N P M R', 'R M R S', 'N, S R M P', 'P N S\' N P'],
  madhyamavati:['S R M P N S\'', 'S\' N P M R S', 'R M P N P M R', 'M R S N, S', 'P N S\' R\' S\' N P'],
  durga:['S R M P D S\'', 'S\' D P M R S', 'R M P D P M', 'M R S D, S', 'P D S\' D P'],
  harikambhoji:['S R G M P D N S\'', 'S\' N D P M G R S', 'G M P D N D P', 'M G R S', 'P D S\' N D P'],
  charukesi:['S R G M P D N S\'', 'S\' N D P M G R S', 'G M P D P M G', 'D N S\' N D P', 'R G M G R S'],
  keeravani:['S R G M P D N S\'', 'S\' N D P M G R S', 'G M P D N D P', 'M G R S N, S', 'D N S\' R\' S\' N D'],
};
function swaraMap(sc){
  const has = x => sc.includes(x), m = {};
  for(const pc of sc){ let l;
    if(pc === 0) l = 'S'; else if(pc === 1) l = 'R'; else if(pc === 2) l = has(1) ? 'G' : 'R'; else if(pc === 3) l = has(4) ? 'R' : 'G'; else if(pc === 4) l = 'G';
    else if(pc === 5 || pc === 6) l = m.M !== undefined ? null : 'M'; else if(pc === 7) l = 'P'; else if(pc === 8) l = 'D'; else if(pc === 9) l = has(8) ? 'N' : 'D'; else l = 'N';
    if(l && m[l] === undefined) m[l] = pc; }
  return m;
}
function phraseList(song){
  const sc = (SCALES[song.scale] || SCALES.major).s; if(PHRASES[song.scale]) return PHRASES[song.scale];
  // other ragas: build phrases from the scale itself (runs up, runs down, turns)
  const L = Object.keys(swaraMap(sc)).sort((a, b) => 'SRGMPDN'.indexOf(a) - 'SRGMPDN'.indexOf(b));
  const out = [L.join(' ') + " S'", "S' " + L.slice().reverse().join(' ')];
  for(let i = 1; i < L.length - 2; i++) out.push([L[i], L[i + 1], L[i + 2], L[i + 1], L[i]].join(' '));
  out.push([L[2] || 'G', L[1] || 'R', 'S'].join(' ')); return out;
}
function phrasePitches(ph, map, sa){ return ph.split(' ').map(tok => { const l = tok[0], pc = map[l]; if(pc === undefined) return null; return sa + pc + (tok.includes("'") ? 12 : 0) - (tok.includes(',') ? 12 : 0); }).filter(x => x != null); }

// ---------------------------------------------------------------- one-tap songs with sections, fitted to a length in seconds
// roles: melody, counter (chorus only), pad (chords), bass, arp, drone; rhythm (+ rhythm2 in chorus)
const MOODS = {
  spiritual:{indian:true, name:'🕉️ Spiritual / Upanishad', scales:['revati', 'mayamalavagowla', 'kalyani', 'mohanam'], bpm:[58, 66], keys:['C#', 'D', 'C'],
    parts:{melody:'s:bansuri', drone:'s:tanpura', pad:'r:warmpad', arp:'r:harp', counter:'r:choir'}, verb:0.5},
  devotional:{indian:true, name:'🙏 Devotional / bhajan', scales:['mohanam', 'abheri', 'kharaharapriya', 'shivaranjani'], bpm:[88, 100], keys:['C#', 'D', 'C'],
    parts:{melody:'s:harmonium', counter:'s:bansuri', drone:'s:tanpura'}, rhythm:'keherwa', rhythm2:'bhajan', verb:0.3},
  carnatic:{indian:true, name:'🪕 Carnatic veena', scales:['hamsadhwani', 'kalyani', 'mayamalavagowla', 'mohanam', 'kharaharapriya'], bpm:[80, 92], keys:['D', 'E', 'C'],
    parts:{melody:'s:veena', counter:'r:violin', drone:'s:tanpura'}, rhythm:'adi', verb:0.3},
  hindustani:{indian:true, name:'🎶 Hindustani sitar', scales:['kalyani', 'bhairavi', 'hindolam', 'kharaharapriya'], bpm:[72, 84], keys:['C#', 'D'],
    parts:{melody:'s:sitar', counter:'s:bansuri', drone:'s:tanpura'}, rhythm:'teentaal', verb:0.35},
  calm:{mstyle:'calm', name:'🌿 Calm / meditation', scales:['mohanam', 'madhyamavati', 'major'], bpm:[60, 70], keys:['D', 'F', 'C'], bright:true,
    parts:{melody:'r:flute', pad:'r:violins', arp:'r:harp', drone:'s:tanpura'}, verb:0.55},
  happy:{mstyle:'bright', name:'😊 Happy / cheerful', scales:['major', 'mohanam'], bpm:[110, 124], keys:['F', 'G', 'C'], bright:true,
    parts:{melody:'r:marimba', counter:'r:glock', bass:'r:pizz', arp:'r:xylophone'}, rhythm:'latin', verb:0.2},
  cinematic:{mstyle:'epic', name:'🎬 Cinematic / epic', scales:['minor', 'kharaharapriya'], bpm:[84, 96], keys:['D', 'C', 'E'],
    parts:{melody:'r:horn', counter:'r:trumpet', pad:'r:violins', bass:'r:cellos', arp:'r:pizz'}, rhythm:'epic', verb:0.45},
  sad:{mstyle:'sad', name:'😢 Sad / emotional', scales:['minor', 'bhairavi'], bpm:[64, 72], keys:['A', 'D', 'E'],
    parts:{melody:'r:grand', counter:'r:violin', pad:'r:cellos'}, verb:0.45},
  motivational:{mstyle:'bright', name:'💼 Motivational / business', scales:['major'], bpm:[104, 118], keys:['C', 'D', 'G', 'F'], bright:true,
    parts:{melody:'r:grand', pad:'r:epiano', bass:'r:pizz', arp:'r:steel'}, rhythm:'pop', verb:0.28},
  folk:{indian:true, name:'🌾 Village folk', scales:['kharaharapriya', 'mohanam', 'major'], bpm:[100, 112], keys:['D', 'E'],
    parts:{melody:'s:bansuri', arp:'s:santoor', bass:'s:guitar'}, rhythm:'dholak', verb:0.25},
  romantic:{mstyle:'romantic', melodyKind:'melody', indian:true, name:'❤️ Romantic', scales:['kalyani', 'major', 'shivaranjani'], bpm:[76, 86], keys:['C', 'D'],
    parts:{melody:'s:sitar', counter:'r:flute', pad:'r:violins', arp:'s:guitar'}, rhythm:'keherwa', verb:0.4},
  aarti:{name:'🪔 Temple aarti', scales:['mohanam', 'major', 'abheri'], bpm:[84, 96], keys:['C#', 'D', 'C'], indian:true,
    parts:{melody:'s:harmonium', counter:'s:bansuri', drone:'s:tanpura'}, rhythm:'aarti', verb:0.35},
  vedic:{name:'📿 Vedic chant style', scales:['major', 'kharaharapriya', 'mohanam'], bpm:[66, 76], keys:['C#', 'C', 'D'], indian:true, melodyKind:'chant',
    parts:{melody:'r:voice', counter:'s:bansuri', drone:'s:tanpura', pad:'r:cellos'}, rhythm:'bowl', verb:0.45},
  wedding:{name:'💐 Wedding (nadaswaram style)', scales:['kalyani', 'major', 'mohanam'], bpm:[100, 112], keys:['D', 'E', 'C'], indian:true,
    parts:{melody:'r:shehnai', counter:'r:oboe', drone:'s:tanpura'}, rhythm:'thavil', verb:0.3},
  festival:{name:'🎉 Festival', scales:['major', 'mohanam', 'kharaharapriya'], bpm:[112, 124], keys:['D', 'E', 'F'], indian:true,
    parts:{melody:'s:bansuri', arp:'s:santoor', bass:'s:guitar'}, rhythm:'dhol', rhythm2:'dholak', verb:0.25},
  zen:{alts:{melody:['r:panflute', 'r:flute', 'r:koto', 'r:shamisen', 'r:ocarina']}, mstyle:'calm', name:'🎋 Zen / Japanese calm', scales:['hirajoshi', 'iwato', 'durga'], bpm:[60, 70], keys:['D', 'E', 'A'],
    parts:{melody:'r:panflute', arp:'r:koto', pad:'r:warmpad'}, rhythm:'bowl', verb:0.55},
  desert:{alts:{melody:['r:oboe', 'r:violin', 'r:flute', 'r:clarinet', 'r:shehnai']}, mstyle:'romantic', name:'🐪 Desert / Arabic', scales:['vakulabharanam', 'mayamalavagowla', 'persian'], bpm:[90, 104], keys:['D', 'E', 'C#'],
    parts:{melody:'r:oboe', counter:'r:violin', bass:'r:pizz', drone:'s:tanpura'}, rhythm:'darbuka', verb:0.35},
  blues:{name:'🎷 Blues', scales:['blues'], bpm:[76, 92], keys:['E', 'A', 'G'],
    parts:{melody:'r:tsax', counter:'r:harmonica', pad:'r:epiano', bass:'r:basses', arp:'r:steel'}, rhythm:'pop', verb:0.3},
  spanish:{alts:{melody:['r:nylon', 'r:violin', 'r:flute', 'r:accordion']}, mstyle:'romantic', name:'💃 Spanish guitar', scales:['vakulabharanam', 'minor'], bpm:[96, 112], keys:['E', 'A'],
    parts:{melody:'r:nylon', counter:'r:violin', bass:'r:cellos', arp:'r:steel'}, rhythm:'latin', verb:0.3},
  solo:{name:'🎵 Solo instrument', scales:['mohanam', 'kalyani', 'hindolam', 'shivaranjani', 'hamsadhwani', 'abheri', 'mayamalavagowla', 'kharaharapriya', 'madhyamavati', 'charukesi'], bpm:[62, 78], keys:['C#', 'D', 'C', 'E'], indian:true,
    parts:{melody:'s:bansuri'}, verb:0.45},
  cowboy:{alts:{melody:['r:violin', 'r:harmonica', 'r:accordion', 'r:flute']}, mstyle:'bright', name:'🤠 Cowboy / country', scales:['major', 'mohanam', 'harikambhoji'], bpm:[100, 118], keys:['G', 'D', 'A'], bright:true,
    parts:{melody:'r:violin', arp:'r:steel', bass:'r:basses', counter:'r:harmonica'}, arpKind:'strum', rhythm:'country', verb:0.22},
  western:{alts:{melody:['r:flute', 'r:harmonica', 'r:violin', 'r:ocarina', 'r:trumpet']}, mstyle:'romantic', name:'🌵 Wild West (whistle & guitar)', scales:['minor', 'keeravani', 'vakulabharanam'], bpm:[72, 86], keys:['A', 'D', 'E'],
    parts:{melody:'r:flute', counter:'r:trumpet', arp:'r:nylon', bass:'r:cellos'}, rhythm:'gallop', verb:0.5},
  meditation:{name:'🧘 Meditation (bansuri + tabla)', scales:['mohanam', 'kalyani', 'shivaranjani', 'hindolam', 'madhyamavati'], bpm:[60, 68], keys:['C#', 'D', 'C'], indian:true,
    parts:{melody:'s:bansuri', drone:'s:tanpura'}, rhythm:'tabla_soft', verb:0.5},
  bowls:{name:'🔔 Singing bowls meditation', scales:['mohanam', 'major', 'durga', 'madhyamavati'], bpm:[54, 62], keys:['C#', 'D', 'C', 'F'], indian:false,
    parts:{bowls:'s:bowl_tibetan', hum:'s:bowl_rubbed', sparkle:'s:chimes'}, rhythm:'bells', verb:0.55},
  africa:{alts:{melody:['r:kalimba_ke', 'r:balafon', 'r:mbira', 'r:ocarina']}, mstyle:'bright', name:'🌍 African / world', scales:['mohanam', 'major', 'durga'], bpm:[96, 112], keys:['G', 'A', 'F'], bright:true,
    parts:{melody:'r:kalimba_ke', counter:'r:ocarina', arp:'r:mbira', bass:'r:balafon'}, rhythm:'slit', rhythm2:'frame', verb:0.3},
  kids:{mstyle:'kids', name:'🎄 Kids / nursery (jingle)', scales:['major'], bpm:[120, 132], keys:['C', 'F', 'G'], bright:true, acc:{chords:'offbeat', bass:'root5'},
    parts:{melody:'r:glock', pad:'r:piano', bass:'r:pizz', arp:'r:xylophone'}, rhythm:'jingle', verb:0.2},
  church:{mstyle:'calm', name:'⛪ Church / hymn', scales:['major'], bpm:[66, 76], keys:['C', 'F', 'G', 'D'], bright:true,
    parts:{melody:'r:pipeorgan', pad:'r:choir', bass:'r:basses', sparkle:'r:tubebells'}, verb:0.6},
  jazz:{mstyle:'romantic', name:'🌃 Night jazz / lounge', scales:['kharaharapriya', 'blues', 'minor'], bpm:[84, 98], keys:['F', 'C', 'D'],
    parts:{melody:'r:tsax', pad:'r:grand', bass:'r:basses'}, rhythm:'pop', verb:0.3},
  custom:{name:'🎛️ My own choice', scales:['mohanam'], bpm:[70, 80], keys:['C#'], indian:true, parts:{}, verb:0.4},
  orchestra:{alts:{melody:['r:flute', 'r:oboe', 'r:clarinet', 'r:violin', 'r:horn'], arp:['r:harp', 'r:celesta', 'r:glock']}, mstyle:'romantic', name:'🎻 Orchestra', scales:['major', 'minor'], bpm:[84, 96], keys:['D', 'G', 'C'],
    parts:{melody:'r:flute', counter:'r:oboe', pad:'r:violins', bass:'r:basses', arp:'r:harp'}, rhythm:'march', verb:0.45},
};
const ROLE_NAME = {bowls:'Singing bowls', hum:'Rubbed bowl (hum)', sparkle:'Chimes', melody:'Melody', counter:'Second melody', pad:'Chords', bass:'Bass', arp:'Arpeggio', drone:'Drone'};
const ROLE_VOL = {bowls:0.6, hum:0.45, sparkle:0.32, melody:0.78, counter:0.62, pad:0.55, bass:0.7, arp:0.56, drone:0.45};
const ROLE_PAN = {bowls:-0.2, hum:0, sparkle:0.4, melody:0, counter:0.3, pad:-0.25, bass:0, arp:0.35, drone:-0.15};
let idn = 0; const tid = () => 'g' + Date.now().toString(36) + (idn++);
const SHAPES = [['A', 'B', 'A', 'B', 'C', 'B'], ['A', 'A', 'B', 'A', 'B', 'A'], ['A', 'B', 'B', 'C', 'B', 'B'], ['A', 'C', 'A', 'B', 'A', 'B'], ['A', 'B', 'C', 'A', 'B', 'B']];
function sections(nb, order0){
  let intro = nb >= 14 ? 4 : nb >= 8 ? 2 : 1, outro = nb >= 10 ? 2 : 1, mid = Math.max(1, nb - intro - outro);
  if(mid > 4 && mid % 4){ const rem = mid % 4, toIntro = Math.min(rem, 4 - intro); intro += toIntro; outro += rem - toIntro; mid -= rem; }
  const out = [{type:'intro', b0:0, n:intro}];
  const order = order0 || SHAPES[0]; let b = intro, i = 0;
  while(b < intro + mid){ const n = Math.min(4, intro + mid - b); out.push({type:order[i % order.length], b0:b, n}); b += n; i++; }
  out.push({type:'outro', b0:b, n:outro}); return out;
}
// ---------------------------------------------------------------- "Build my music": the person picks raga, instruments, rhythm, speed, feel and song form
const LEAD_LIKE = id => !/^(s:tanpura|s:bowl_|s:crystal|s:gong|s:chimes|r:tubebells|r:tubular|r:wineglass|r:basses|r:pizz|r:tuba)/.test(id);
function roleOf(id){
  if(id === 's:tanpura') return 'drone'; if(/^s:(bowl_tibetan|crystal|gong)$/.test(id)) return 'bowls'; if(id === 's:bowl_rubbed') return 'hum';
  if(/^(s:chimes|r:tubebells|r:tubular|r:wineglass)$/.test(id)) return 'sparkle'; if(/^r:(basses|pizz|tuba)$/.test(id)) return 'bass';
  if(/^(r:harp|s:santoor|r:steel|r:nylon|s:guitar|r:dulcimer|s:kalimba|r:kalimba_rec|r:kalimba_ke|r:koto|r:folkharp|r:mbira)$/.test(id)) return 'arp';
  if(/^(s:harmonium|r:warmpad|r:violins|r:violas|r:choir|r:organ|r:pipeorgan|r:reedorgan|r:accordion|r:epiano|r:cellos)$/.test(id)) return 'pad';
  return 'lead';
}
const FEELS = {
  calm:      {mstyle:'calm', hf:'gentle', room:'temple', verb:0.5, tabla:'soft'},
  happy:     {mstyle:'bright', hf:'bright', room:'studio', verb:0.25, tabla:'full', bright:true},
  devotional:{mstyle:'calm', hf:'bhakti', room:'temple', verb:0.4, tabla:'full'},
  sad:       {mstyle:'sad', hf:'tender', room:'hall', verb:0.45, tabla:'gentle'},
  grand:     {mstyle:'epic', hf:'grand', room:'bighall', verb:0.45, tabla:'full'},
};
const FORMS = {   // song forms: the order of parts (A = verse, B = chorus, C = instrumental break)
  bhajan:['A', 'B', 'B', 'A', 'B', 'B'], film:['A', 'B', 'A', 'B', 'C', 'B'], classical:['A', 'A', 'B', 'A', 'B', 'C'], instrumental:['A', 'C', 'B', 'A', 'C', 'B'], meditation:['A', 'A', 'A', 'A'],
};
function buildMood(b = {}){
  const raga = SCALES[b.raga] ? b.raga : 'mohanam', ins = (b.insts || []).filter(id => INSTRUMENTS[id]).slice(0, 8), F = FEELS[b.feel] || FEELS.calm, form = FORMS[b.form] ? b.form : 'bhajan';
  const parts = {}, leads = ins.filter(id => roleOf(id) === 'lead');
  if(leads[0]) parts.melody = leads[0]; if(leads[1]) parts.counter = leads[1];
  for(const id of ins){ const r = roleOf(id); if(r !== 'lead' && !parts[r]) parts[r] = id; }
  if(!parts.melody){ const p = ins.find(LEAD_LIKE) || 's:bansuri'; parts.melody = p; for(const k of Object.keys(parts)) if(k !== 'melody' && parts[k] === p) delete parts[k]; }
  const indian = /^Indian/.test(SCALES[raga].g || '') || ins.some(id => /^s:(bansuri|veena|sitar|santoor|harmonium|tanpura)$/.test(id));
  const slow = b.speed === 'slow' || form === 'meditation';
  return {name:'🎼 My music', scales:[raga], keys:['C#', 'D', 'C'], indian, parts, rhythm:form === 'meditation' && b.rhythm !== 'tabla_soft' ? null : (RHYTHMS[b.rhythm] ? b.rhythm : null),
    bpm:slow ? [58, 68] : b.speed === 'fast' ? [106, 124] : [80, 96], verb:F.verb, mstyle:F.mstyle, hf:F.hf, room:F.room, tabla:form === 'classical' ? 'classical' : F.tabla, form, bright:F.bright,
    melodyKind:indian && b.feel !== 'happy' ? 'raga' : 'melody', callAnswer:true, leads:leads.length ? leads : [parts.melody]};
}
// "My own choice": only the instruments the person picked
function customMood(c = {}){
  const parts = {}; if(c.melody) parts.melody = c.melody; if(c.counter) parts.counter = c.counter; if(c.drone) parts.drone = 's:tanpura';
  if(c.bowls === 'struck' || c.bowls === 'both') parts.bowls = 's:bowl_tibetan'; if(c.bowls === 'crystal') parts.bowls = 's:crystal';
  if(c.bowls === 'rubbed' || c.bowls === 'both') parts.hum = 's:bowl_rubbed'; if(c.chimes) parts.sparkle = 's:chimes';
  return {name:'🎛️ My own choice', scales:c.scale ? [c.scale] : ['mohanam', 'kalyani', 'shivaranjani', 'hindolam'], bpm:c.speed === 'slow' ? [56, 64] : c.speed === 'fast' ? [100, 112] : [72, 84],
    keys:['C#', 'D', 'C'], indian:true, parts, rhythm:c.rhythm || null, verb:0.45};
}
function compose(o){
  const M = o.mood === 'custom' ? customMood(o.custom) : o.mood === 'build' ? buildMood(o.build) : MOODS[o.mood] || MOODS.spiritual, R = rng((o.seed || 1) * 104729 + strHash(o.mood + '|' + JSON.stringify(o.custom || o.build || '') + '|' + (o.lead || '') + (o.support || ''))), meter = 4;
  const scale0 = R.pick(M.scales), key0 = R.pick(M.keys), scale = SCALES[o.scale] ? o.scale : scale0, key = o.key || key0;   // dice rolled either way, so the rest of the tune stays the same
  const bpm0 = M.bpm[0] + R() * (M.bpm[1] - M.bpm[0]), secs = Math.max(8, o.seconds || 60);
  // variety: song shape, melody style and how the song opens change with the tune number
  const shape = M.form ? FORMS[M.form] : R.pick(SHAPES), style = R.pick(['balanced', 'flow', 'lively', 'motif']);
  const introMode = M.form === 'classical' ? 'alap' : M.form === 'meditation' ? 'drone' : M.indian ? R.pick(['alap', 'alap', 'drone', 'melody']) : R.pick(['band', 'melody', 'band']);
  // pick bars so the middle is whole 4-bar phrases, then set the tempo so the song lasts exactly `secs`
  let bars = Math.max(4, Math.round(secs / (meter * 60 / bpm0))), best = null;
  for(let n = Math.max(4, bars - 6); n <= bars + 6; n++){ const sc = sections(n, shape); if((sc.some(x => x.n < 4 && /^[ABC]$/.test(x.type)) || sc[sc.length - 1].n > 3) && n >= 6) continue;
    const b = n * meter * 60 / secs, cost = Math.abs(Math.log(b / bpm0)); if(!best || cost < best.cost) best = {n, cost}; }
  if(best) bars = best.n; const bpm = Math.round(bars * meter * 60 / secs * 100) / 100;
  const song = {v:1, name:`${M.name.replace(/^\S+\s/, '')} · ${SCALES[scale].name.split(' ')[0]} · ${Math.round(secs)}s · tune ${o.seed || 1}`, bpm, key, scale, bars, meter, tracks:[], mood:o.mood, seed:o.seed || 1, seconds:secs};
  // each tune gets its own chord progressions and accompaniment patterns
  song._bright = !!M.bright; song.progs = pickProgs(song, R, M.indian); delete song._bright; const slow = bpm0 < 76;
  song.acc = {chords:M.acc && M.acc.chords ? (R(), M.acc.chords) : R.pick(slow ? ['block', 'broken', 'broken', 'alberti'] : M.bright ? ['block', 'broken', 'offbeat', 'broken'] : ['block', 'pulse', 'broken', 'alberti', 'offbeat']),
    bass:M.acc && M.acc.bass ? M.acc.bass : ['jazz', 'blues'].includes(o.mood) ? 'walk' : R.pick(slow ? ['long', 'root5', 'walk'] : M.bright ? ['octave', 'root5', 'sync'] : ['root5', 'octave', 'walk', 'sync', 'root5']), arp:R() * 8 | 0};
  const secs_ = sections(bars, shape), seedA = R() * 1e6 | 0, seedB = R() * 1e6 | 0, seedC = R() * 1e6 | 0;
  // rounds: verse + chorus = one round. Long songs change something every round so 5 minutes never sounds the same
  { const hasB = secs_.some(x => x.type === 'B'); let r0 = 0, occ = {};
    for(const sec of secs_){ sec.round = r0; sec.occ = (occ[sec.type] = (occ[sec.type] ?? -1) + 1); if(sec.type === 'B' || (!hasB && /^[AC]$/.test(sec.type))){ if(sec.type !== 'B' || !secs_[secs_.indexOf(sec) + 1] || secs_[secs_.indexOf(sec) + 1].type !== 'B'){ r0++; occ = {}; } } } }
  const longSong = bars >= 32, roundsN = secs_[secs_.length - 1].round;
  const breakdown = sec => longSong && sec.type === 'A' && sec.round % 4 === 2;   // drums rest, lighter band
  const has = (sec, role) => ({intro:['pad', 'arp', 'drone', 'bowls', 'hum'], A:['melody', 'pad', 'bass', 'drone', 'bowls', 'hum', 'sparkle'], B:['melody', 'counter', 'pad', 'bass', 'arp', 'drone', 'bowls', 'hum', 'sparkle'],
    C:['counter', 'pad', 'arp', 'drone', 'bass', 'bowls', 'hum', 'sparkle'], outro:['melody', 'pad', 'drone', 'arp', 'bowls', 'hum']}[sec.type].includes(role));
  const parts = {...M.parts};
  // every tune number uses different instruments (from ones that suit the mood); a second lead takes over in later rounds
  const calmMood = (M.bpm || [80])[0] < 84, alt = {};
  for(const role of o.mood === 'build' ? [] : ['melody', 'counter', 'pad', 'arp', 'bass']){ const cur = parts[role]; if(!cur) continue;   // "Build my music" keeps exactly your instruments
    const indianInst = x => /^(s:(bansuri|veena|sitar|harmonium|santoor)|r:(sitar_rec|shehnai))$/.test(x), keep = x => M.indian || /^s:/.test(cur) || !indianInst(x);
    // Western moods never get Indian instruments; pick the list that gives the most fitting choices
    const fam = M.alts && M.alts[role] ? M.alts[role] : (calmMood && FAMILY_CALM[role] || FAMILY[role] || []).filter(f => f.includes(cur)).map(f => f.filter(keep)).sort((a, b) => b.length - a.length)[0]; if(!fam) continue;
    const pool = [cur, ...fam.filter(x => x !== cur && INSTRUMENTS[x] && !Object.entries(parts).some(([r2, v]) => r2 !== role && v === x))], k = (((o.seed || 1) - 1) * ROLE_OFF[role]) % pool.length;   // tune 1 = the mood's own choice
    parts[role] = pool[k]; alt[role] = pool[(k + 1 + ((o.seed || 1) % Math.max(1, pool.length - 1))) % pool.length]; if(alt[role] === parts[role]) delete alt[role]; }
  if(o.lead) parts.melody = o.lead; if(o.support){ if(parts.counter) parts.counter = o.support; else if(parts.pad) parts.pad = o.support; else parts.counter = o.support; }
  // "choose every instrument": '' = mood's choice, '-' = part off, otherwise that instrument
  if(o.parts) for(const [r0, v] of Object.entries(o.parts)){ if(!v) continue; if(v === '-') delete parts[r0]; else if(INSTRUMENTS[v]) parts[r0] = v; }
  const rhy1 = o.rhythm === '-' ? null : RHYTHMS[o.rhythm] ? o.rhythm : M.rhythm, rhy2 = o.rhythm ? null : M.rhythm2;
  for(const [role, inst] of Object.entries(parts)){
    if(!INSTRUMENTS[inst]) continue;
    const tr = {id:tid(), type:'inst', inst, name:`${ROLE_NAME[role]} · ${INSTRUMENTS[inst].label}`, notes:[], vol:ROLE_VOL[role], pan:ROLE_PAN[role], verb:M.verb};
    const altInst = longSong && !o.lead && !(o.parts && o.parts[role]) && (role === 'melody' || role === 'arp') && alt[role] && INSTRUMENTS[alt[role]];
    const tr2 = altInst ? {id:tid(), type:'inst', inst:alt[role], name:`${ROLE_NAME[role]} 2 · ${INSTRUMENTS[alt[role]].label}`, notes:[], vol:ROLE_VOL[role], pan:-ROLE_PAN[role] || 0.12, verb:M.verb} : null;
    const bpb = meter;
    for(const sec of secs_){
      if(!has(sec, role)) continue;
      if(breakdown(sec) && (role === 'arp' || role === 'bass')) continue;
      // when a mood has no pad/arp, let the melody instrument play the intro softly
      let kind = role === 'pad' ? 'chords' : role === 'melody' ? (M.melodyKind || (M.indian ? 'raga' : 'melody')) : role === 'arp' && M.arpKind ? M.arpKind : role;
      if(sec.type === 'outro'){
        const I = INSTRUMENTS[inst], r = rootOf(song); let sa = r + 12; while(sa < I.range[0] + 3) sa += 12; while(sa > I.range[1] - 3) sa -= 12;
        if(role === 'melody'){ tr.notes.push({t:sec.b0 * bpb, d:sec.n * bpb - 0.2, m:sa, v:0.75}); continue; }
        if(role === 'arp'){ kind = 'arp'; }
        if(role === 'pad'){ for(const m of fit(chordAt(song, 0, Math.max(I.range[0] + 5, Math.min(I.range[1] - 10, 60))), I.range)) tr.notes.push({t:sec.b0 * bpb, d:sec.n * bpb - 0.2, m, v:0.5}); continue; }
        if(role === 'arp'){ const n = auto(song, tr, 'arp', seedB, 1).map(x => ({...x, t:x.t + sec.b0 * bpb})); tr.notes.push(...n); continue; }
      }
      // verses get a new melody each round (3 versions), the chorus keeps its tune but changes every second round
      const sd = (sec.type === 'B' ? seedB + (sec.round % 3) * 2027 + sec.occ * 331 : sec.type === 'C' ? seedC + sec.round * 503 : seedA + sec.round * 1013 + sec.occ * 211);   // the chorus returns now and then; everything else is new
      const shift = role === 'melody' && sec.type === 'B' ? 5 : role === 'counter' ? 7 : 0;
      let notes = auto(song, tr, kind, sd + (role === 'counter' ? 17 : 0) + (role === 'melody' && sec.type === 'B' ? 7 : 0), sec.n, {shift, style:role === 'melody' ? style : 'balanced', mstyle:role === 'melody' ? M.mstyle : null, sec:/^[ABC]$/.test(sec.type) ? sec.type : 'A'});
      if(sec.type === 'intro' && role === 'arp') notes = notes.map(x => ({...x, v:x.v * 0.8}));
      if(sec.type === 'C' && role === 'counter') notes = notes.map(x => ({...x, v:0.65}));
      const dyn = {intro:0.85, A:0.94, B:1.08, C:0.9, outro:0.9}[sec.type] || 1; notes = notes.map(x => ({...x, v:Math.min(1, x.v * dyn)}));
      const dest = tr2 && sec.round % 2 === 1 && /^[ABC]$/.test(sec.type) ? tr2 : tr;   // second lead in alternate rounds
      dest.notes.push(...notes.map(x => ({...x, t:x.t + sec.b0 * bpb})));
    }
    if(tr.notes.length) song.tracks.push(tr);
    if(tr2 && tr2.notes.length) song.tracks.push(tr2);
  }
  // intro for moods without pad/arp: drone carries it; melody gets a soft opening phrase
  const melTr = song.tracks.find(t => t.name.startsWith('Melody')), introSec = secs_[0];
  if(melTr && M.indian && introSec.n >= 2 && introMode === 'alap') melTr.notes.push(...auto(song, melTr, 'alap', seedA + 5, introSec.n).map(x => ({...x, t:x.t + introSec.b0 * meter})));
  else if(melTr && introMode !== 'drone' && (introMode === 'melody' || (!M.parts.pad && !M.parts.arp))){ melTr.notes.push(...auto(song, melTr, 'melody', seedA + 3, introSec.n).map(x => ({...x, v:x.v * 0.6, t:x.t + introSec.b0 * meter}))); }
  const drumOff = rh => { const off = []; for(const sec of secs_) if(sec.type === 'intro' || sec.type === 'outro' || (sec.type === 'C' && rh === 'main') || breakdown(sec)) for(let b = sec.b0; b < sec.b0 + sec.n; b++) off.push(b); return off; };
  const addDrum = (rhythm, name, vol, chorusOnly) => { const R2 = RHYTHMS[rhythm]; if(!R2) return; const tr = {id:tid(), type:'drum', kit:R2.kit, rhythm, name, steps:R2.steps, stepBeats:R2.stepBeats, grid:{}, vol, pan:0, verb:Math.min(0.3, M.verb), from:1, to:0};
    for(const [row, p] of Object.entries(R2.pat)) tr.grid[row] = [...p].map(velOf);
    tr.off = drumOff('main'); if(chorusOnly) for(const sec of secs_) if(sec.type !== 'B') for(let b = sec.b0; b < sec.b0 + sec.n; b++) tr.off.push(b);
    tr.off = [...new Set(tr.off)].sort((a, b) => a - b);
    if(R2.kit === 'tabla' && THEKA[rhythm]){ tr.bols = true; tr.grid = {}; tr.hits = tablaHits(rhythm, tr.off, totalBeats(song), meter, M.tabla || TABLA_STYLE[o.mood] || 'full', R); }   // real bols
    song.tracks.push(tr); };
  if(rhy1) addDrum(rhy1, 'Rhythm · ' + RHYTHMS[rhy1].name.split(' (')[0], 0.7);
  if(rhy2) addDrum(rhy2, 'Chorus rhythm · ' + RHYTHMS[rhy2].name.split(' (')[0], 0.5, true);
  // tihai: a phrase played three times, the last stroke landing on beat 1 of the ending
  const outroSec = secs_[secs_.length - 1], tb = outroSec.b0 - 1, main = song.tracks.find(t => t.type === 'drum');
  if(main && M.indian !== false && tb >= secs_[0].n && meter === 4){
    const BOLS = {tabla:['s:tabla:dha', 's:tabla:te', 's:tabla:te', 's:tabla:na', 's:tabla:dha'], mridangam:['s:mri:tha', 's:mri:dhi', 's:mri:ki', 's:mri:nam', 's:mri:thom'],
      folk:['s:dholak:dhe', 's:dholak:ta', 's:dholak:ta', 's:dholak:dhe', 's:dholak:dhe'], kit:['r:snare', 'r:snare', 'r:tom_hi', 'r:tom_hi', 'r:kick'], orch:['r:timpani', 'r:snare', 'r:snare', 'r:snare', 'r:timpani']}[main.kit];
    if(BOLS && main.rhythm !== 'bowl'){
      main.hits = (main.hits || []).filter(h => h.t < tb * meter - 1e-6 || h.t > tb * meter + 4.6); for(let rep = 0; rep < 3; rep++) BOLS.forEach((row, i) => main.hits.push({t:tb * meter + (rep * 6 + i) * 0.25, row, v:(i === 4 ? 1 : 0.8) * (main.bols && (M.tabla || TABLA_STYLE[o.mood]) === 'soft' ? 0.55 : 1)}));
      if(main.kit === 'folk' && main.grid['s:manjira']) main.hits.push({t:outroSec.b0 * meter, row:'s:manjira', v:1});
      for(const t of song.tracks) if(t.type === 'drum'){ t.off = [...new Set([...(t.off || []), tb])].sort((a, b) => a - b); }
    }
  }
  // richness: doubled melody, soft pad, swarmandal shimmer, risers and impacts, crescendos into the chorus
  const plain = ['solo', 'custom', 'bowls', 'meditation', 'vedic'].includes(o.mood) || M.form === 'meditation';
  // instruments take turns: in verses the lead plays the first half of each phrase and another instrument answers;
  // in an instrumental break the second instrument takes the tune
  { const melT = song.tracks.find(t => /^Melody ·/.test(t.name)), cT = song.tracks.find(t => /^Second melody/.test(t.name));
    const ansInst = cT ? cT.inst : o.mood === 'build' ? (M.form === 'instrumental' && parts.arp ? parts.arp : null) : alt.melody && INSTRUMENTS[alt.melody] && !(o.parts && o.parts.melody) && !o.lead ? alt.melody : null;
    if(melT && ansInst && !['solo', 'bowls', 'vedic', 'custom'].includes(o.mood) && (M.callAnswer || !plain)){
      let aT = cT; if(!aT){ aT = {id:tid(), type:'inst', inst:ansInst, name:`Answer · ${INSTRUMENTS[ansInst].label}`, notes:[], vol:ROLE_VOL.counter + 0.08, pan:0.28, verb:M.verb}; song.tracks.push(aT); }
      const I = INSTRUMENTS[ansInst], fitN = m => { while(m > I.range[1] - 2) m -= 12; while(m < I.range[0] + 2) m += 12; return m; };
      for(const sec of secs_){
        if(sec.type === 'A' && sec.n === 4 && (M.callAnswer || sec.round % 2 === 0)){ const a0 = (sec.b0 + 2) * meter, a1 = (sec.b0 + 4) * meter;
          const mv = melT.notes.filter(n => n.t >= a0 - 1e-6 && n.t < a1 - 1e-6); melT.notes = melT.notes.filter(n => !(n.t >= a0 - 1e-6 && n.t < a1 - 1e-6));
          aT.notes.push(...mv.map(n => ({...n, m:fitN(n.m), v:Math.min(1, n.v * 1.02)}))); }
        if(sec.type === 'C' && M.form === 'instrumental'){ const a0 = sec.b0 * meter, a1 = (sec.b0 + sec.n) * meter;
          aT.notes = aT.notes.filter(n => !(n.t >= a0 - 1e-6 && n.t < a1 - 1e-6));
          aT.notes.push(...auto(song, aT, M.melodyKind || 'melody', seedB + 41 + sec.round * 97, sec.n, {mstyle:M.mstyle, sec:'C'}).map(n => ({...n, m:fitN(n.m), t:n.t + a0}))); }
      }
      if(!aT.notes.length) song.tracks.splice(song.tracks.indexOf(aT), 1);
    } }
  if(o.rich !== false && !plain && o.mood !== 'build'){
    const mel = song.tracks.find(t => t.name.startsWith('Melody')), bpb = meter, choruses = secs_.filter(x => x.type === 'B');
    const DOUBLE = {'s:bansuri':'r:violins', 'r:flute':'r:violins', 'r:violin':'r:flute', 's:veena':'s:sitar', 's:sitar':'r:violins', 's:harmonium':'r:accordion', 'r:piano':'r:violins',
      'r:shehnai':'r:oboe', 'r:oboe':'r:flute', 'r:marimba':'r:glock', 'r:nylon':'r:violin', 'r:epiano':'r:violins', 'r:panflute':'r:violins', 'r:horn':'r:trumpet', 'r:voice':'r:violins', 'r:sitar_rec':'r:violins'};
    if(mel && DOUBLE[mel.inst] && INSTRUMENTS[DOUBLE[mel.inst]] && choruses.length){
      const DI = INSTRUMENTS[DOUBLE[mel.inst]], notes = [];
      for(const c of choruses) for(const n of mel.notes) if(n.t >= c.b0 * bpb && n.t < (c.b0 + c.n) * bpb){ let m = n.m; while(m > DI.range[1] - 2) m -= 12; while(m < DI.range[0] + 2) m += 12; notes.push({...n, m, v:n.v * 0.8}); }
      if(notes.length) song.tracks.push({id:tid(), type:'inst', inst:DOUBLE[mel.inst], name:'Melody double · ' + DI.label, notes, vol:0.32, pan:-0.3, verb:Math.min(0.6, M.verb + 0.1)});
    }
    const hasPad = song.tracks.some(t => t.name.startsWith('Chords'));
    if(!hasPad && INSTRUMENTS['r:warmpad']){ const padInst = ['spiritual', 'devotional', 'aarti', 'calm'].includes(o.mood) && INSTRUMENTS['r:choir'] ? 'r:choir' : 'r:warmpad', tr = {id:tid(), type:'inst', inst:padInst, name:'Soft pad · ' + INSTRUMENTS[padInst].label, notes:[], vol:0.22, pan:0.2, verb:0.5};
      for(const c of secs_) if(c.type === 'B' || c.type === 'C') tr.notes.push(...auto(song, tr, 'chords', seedB + 9, c.n).map(x => ({...x, t:x.t + c.b0 * bpb, v:0.45})));
      if(tr.notes.length) song.tracks.push(tr); }
    if(M.indian && INSTRUMENTS['r:harp']){ const sw = {id:tid(), type:'inst', inst:'r:harp', name:'Swarmandal shimmer · Harp', notes:[], vol:0.3, pan:0.35, verb:0.6}, pool = scaleMidis(song, 62, 86);
      for(const c of secs_) if(c.type === 'B' || c.type === 'outro'){ const up = pool.slice(0, 10); up.forEach((m, i) => sw.notes.push({t:Math.max(0, c.b0 * bpb - 0.9 + i * 0.09), d:1.5, m, v:0.35 + i * 0.03})); }
      if(sw.notes.length) song.tracks.push(sw); }
    const fx = {id:tid(), type:'inst', inst:'s:swell', name:'Swells', notes:[], vol:0.4, pan:0, verb:0.4};
    for(const c of choruses) if(c.b0 >= 2) fx.notes.push({t:c.b0 * bpb - 2, d:2, m:60, v:0.8});
    if(fx.notes.length && !M.bright && !M.indian) song.tracks.push(fx);   // film-style swell only for film-style moods
    if(rhy1 && ['cinematic', 'festival', 'orchestra', 'wedding'].includes(o.mood)){   // big hits only where they belong
      const bm = {id:tid(), type:'inst', inst:'s:boom', name:'Impact', notes:choruses.map(c => ({t:c.b0 * bpb, d:2, m:36, v:0.7})), vol:0.45, pan:0, verb:0.3}; if(bm.notes.length) song.tracks.push(bm); }
    // crescendo: the two bars before each chorus get louder
    for(const t of song.tracks) if(t.type === 'inst' && t.notes) for(const c of choruses){ const a = (c.b0 - 2) * bpb, b = c.b0 * bpb; t.notes.forEach(n => { if(n.t >= a && n.t < b) n.v = Math.min(1, n.v * (0.82 + 0.25 * (n.t - a) / (b - a))); }); }
  }
  if(o.nature && window.VG_AMB) song.tracks.push({id:tid(), type:'amb', amb:o.nature, name:'Nature · ' + ((window.VG_AMB.LIST.find(a => a.id === o.nature) || {}).name || o.nature), vol:0.4, pan:0, verb:0});
  // drum fill in the last two beats before each chorus (and before the ending when there is no tihai)
  const mainDr = song.tracks.find(t => t.type === 'drum');
  if(mainDr && meter === 4 && mainDr.kit !== 'calm' && !mainDr.bols){ const rows = Object.entries(mainDr.grid).map(([r, a]) => [r, a.reduce((x, y) => x + y, 0)]).sort((a, b) => b[1] - a[1]).map(x => x[0]).filter(r => !/shaker|bowl|bell|manjira|taalam/.test(r));
    if(rows.length) for(let k = 1; k < secs_.length; k++){ const sec = secs_[k]; if(sec.type !== 'B' && !(sec.type === 'outro' && !(mainDr.hits || []).length)) continue;
      const t0 = sec.b0 * meter - 2, n = R() < 0.5 ? 8 : 6; for(let q = 0; q < n; q++) (mainDr.hits = mainDr.hits || []).push({t:t0 + q * 2 / n, row:rows[q % Math.min(2, rows.length)], v:0.55 + 0.45 * q / n}); } }
  // arrangement: a short break before the last chorus (drum fill kept), and for band moods a lift up in the last chorus
  const Bs = secs_.filter(x => x.type === 'B');
  if(o.rich !== false && !plain && Bs.length >= 2){
    const lastB = Bs[Bs.length - 1], brk = lastB.b0 - 1, A0 = brk * meter, A1 = A0 + meter;
    for(const t of song.tracks){
      if(t.type === 'drum'){ t.off = [...new Set([...(t.off || []), brk])].sort((a, b) => a - b); if(t.hits) t.hits = t.hits.filter(h => !(h.t >= A0 && h.t < A0 + 2)); }
      else if(t.type === 'inst' && /^(Bass|Arpeggio)/.test(t.name)) t.notes = t.notes.filter(n => !(n.t >= A0 && n.t < A1));
    }
    const drone = song.tracks.some(t => /^(Drone|Singing bowls|Rubbed)/.test(t.name));
    if(!M.indian && !drone && R() < 0.6){ const up = R.pick([1, 2, 2]); for(const t of song.tracks) if(t.type === 'inst' && !/^(Swells|Impact)/.test(t.name)) t.notes.forEach(n => { if(n.t >= lastB.b0 * meter) n.m += up; }); song.lift = up; }
  }
  // build my music: every chosen lead instrument gets the tune in turn, part by part
  if(o.mood === 'build' && M.leads && M.leads.length > 1){
    const melT = song.tracks.find(t => /^Melody ·/.test(t.name)), cT = song.tracks.find(t => /^Second melody/.test(t.name)), own = {};
    if(melT){ own[melT.inst] = melT; if(cT) own[cT.inst] = cT;
      const trackOf = id => own[id] || (own[id] = (() => { const t = {id:tid(), type:'inst', inst:id, name:`Melody · ${INSTRUMENTS[id].label}`, notes:[], vol:melT.vol, pan:Object.keys(own).length % 2 ? -0.22 : 0.22, verb:melT.verb}; song.tracks.push(t); return t; })());
      const fit = (id, m) => { const I = INSTRUMENTS[id]; while(m > I.range[1] - 2) m -= 12; while(m < I.range[0] + 2) m += 12; return m; };
      const mains = secs_.filter(x => /^[ABC]$/.test(x.type)); let k = 0;
      const mb = mains.reduce((a, x) => a + x.n, 0), step = mains.length >= M.leads.length * 2 ? 99 : mb / 4 >= M.leads.length ? 4 : 2;   // short song: take turns every 4 or 2 bars
      for(const sec of mains) for(let c = sec.b0; c < sec.b0 + sec.n; c += step){ const who = M.leads[k++ % M.leads.length]; if(who === melT.inst) continue;
        const a0 = c * meter, a1 = Math.min(c + step, sec.b0 + sec.n) * meter, inS = n => n.t >= a0 - 1e-6 && n.t < a1 - 1e-6, T = trackOf(who);
        const mv = melT.notes.filter(inS); melT.notes = melT.notes.filter(n => !inS(n));
        if(T === cT){ const back = cT.notes.filter(inS); cT.notes = cT.notes.filter(n => !inS(n)); melT.notes.push(...back.map(n => ({...n, m:fit(melT.inst, n.m)}))); }
        T.notes.push(...mv.map(n => ({...n, m:fit(who, n.m)}))); }
      for(const t of Object.values(own)) t.notes.sort((x, y) => x.t - y.t); }
  }
  song.feel = 0.6; song.gamaka = M.indian ? 0.7 : 0; song.style = style; song.hf = M.hf || HF_MOOD[o.mood] || null; song.mood = o.mood; if(M.room) song.autoRoom = M.room;
  song.sections = secs_.map(s => ({type:s.type, b0:s.b0, n:s.n}));
  return song;
}

// repeat or delete bars (all tracks move together)
function editBars(song, a, b, mode, times = 1){
  const bpb = beatsPerBar(song), k = spb(song), A = (a - 1) * bpb, B = b * bpb, L = B - A;
  if(!(L > 0)) return;
  const shift = mode === 'repeat' ? L * times : -L;
  for(const tr of song.tracks){
    if(tr.type === 'inst'){
      if(mode === 'repeat'){ const seg = tr.notes.filter(n => n.t >= A && n.t < B); tr.notes.forEach(n => { if(n.t >= B) n.t += shift; });
        for(let r = 1; r <= times; r++) tr.notes.push(...seg.map(n => ({...n, t:n.t + L * r}))); }
      else { tr.notes = tr.notes.filter(n => n.t < A || n.t >= B); tr.notes.forEach(n => { if(n.t >= B) n.t += shift; }); }
    } else if(tr.type === 'drum'){
      const barsShift = shift / bpb, a0 = a - 1, b0 = b;   // bar indexes (0-based)
      if(tr.off){ let off = tr.off.filter(x => mode === 'repeat' || x < a0 || x >= b0).map(x => x >= b0 ? x + barsShift : x); if(mode === 'repeat') for(let r = 1; r <= times; r++) off.push(...tr.off.filter(x => x >= a0 && x < b0).map(x => x + (b0 - a0) * r)); tr.off = [...new Set(off)].sort((x, y) => x - y); }
      if(tr.hits){ let h = tr.hits.filter(x => mode === 'repeat' || x.t < A || x.t >= B).map(x => x.t >= B ? {...x, t:x.t + shift} : x); if(mode === 'repeat') for(let r = 1; r <= times; r++) h.push(...tr.hits.filter(x => x.t >= A && x.t < B).map(x => ({...x, t:x.t + L * r}))); tr.hits = h; }
      if(tr.to && tr.to >= b) tr.to += barsShift; if(tr.from && tr.from > b) tr.from += barsShift;
    } else if(tr.type === 'audio'){ if((tr.start || 0) >= B * k) tr.start += shift * k; }
  }
  song.bars = Math.max(1, song.bars + shift / bpb); delete song.sections; delete song.seconds;
}
window.VG_STUDIO = {editBars, setClipLoader, clipLoad, clipBufs, ambLoad, MOODS, compose, sections,SR, KEYS, SCALES, SWARA, NAMES, noteName, INSTRUMENTS, KITS, RHYTHMS, velOf, load, fetchBuf, prepare, events, graph, mixAll, mixTrack, level, preview, previewHit,
  ROOMS, ROOM_MOOD, roomOf, FORMS, FEELS, buildMood, Player, render, renderPieces, wavBlob, m4aBlob, auto, scaleMidis, beatsPerBar, totalBeats, spb, songSeconds, rootOf, hz};
})();
