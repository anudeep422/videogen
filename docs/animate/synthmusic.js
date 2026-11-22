/* ==========================================================================
   VideoGen – Indian music composer for the physical-model instruments (no AI).
   Structure:  alap (free, slow, with meend)  →  main (tala theka + melody)
               →  climax (denser, fills)  →  tihai ending on Sa.
   Talas: Teentaal, Keherwa, Dadra (tabla) · Adi tala (mridangam) · dholak Keherwa.
   window.VG_SYNTHMUSIC.render({style, raga, seconds, key, tempo, seed}) -> Promise<AudioBuffer>
   ========================================================================== */
(function(){
const SR = 44100;
const STYLES = {
  carnatic:  {name:'Carnatic: veena + mridangam + ghatam', mel:'veena', perc:'adi', extra:['ghatam'], tempo:76, raga:'mohanam', gam:'carnatic', alap:true},
  hindustani:{name:'Hindustani: sitar + tabla (Teentaal)', mel:'sitar', perc:'teentaal', tempo:72, raga:'kalyani', gam:'hindustani', alap:true, taraf:true},
  bansuri:   {name:'Bansuri flute + tabla (Keherwa)', mel:'bansuri', perc:'keherwa', tempo:70, raga:'mohanam', gam:'flute', alap:true},
  santoor:   {name:'Santoor + tabla (Dadra)', mel:'santoor', perc:'dadra', tempo:88, raga:'kharaharapriya', gam:null, alap:true, tremolo:true},
  dance:     {name:'Dance: veena + mridangam + gajjalu', mel:'veena', perc:'adi', extra:['gajjalu', 'taalam'], tempo:100, raga:'hamsadhwani', gam:'carnatic'},
  bhajan:    {name:'Bhajan: harmonium + dholak + manjira', mel:'harmonium', perc:'dholak', extra:['manjira', 'gajjalu_soft', 'templebell'], tempo:92, raga:'mayamalavagowla', gam:null},
  folk:      {name:'Village folk: flute + dholak + cow bells', mel:'bansuri', perc:'dholak', extra:['cowbells', 'manjira'], tempo:108, raga:'shankarabharanam', gam:'flute'},
  meditation:{name:'Meditation: singing bowls + chimes', mel:'bansuri', perc:null, extra:['bowls', 'chimes'], tempo:50, raga:'hindolam', gam:'flute', alap:true, sparse:true},
  kids:      {name:'Kids: marimba + xylophone + kalimba', mel:'marimba', counter:'glockenspiel', perc:'kids', extra:['shaker'], tempo:116, raga:'shankarabharanam', gam:null, chords:'marimba'},
  acoustic:  {name:'Acoustic: guitar + harp (warm, business)', mel:'harp', perc:null, extra:['shaker'], tempo:92, raga:'shankarabharanam', gam:null, chords:'guitar'},
};
const RAGAS = {mohanam:[0, 2, 4, 7, 9], hamsadhwani:[0, 2, 4, 7, 11], hindolam:[0, 3, 5, 8, 10], shankarabharanam:[0, 2, 4, 5, 7, 9, 11], kalyani:[0, 2, 4, 6, 7, 9, 11],
  mayamalavagowla:[0, 1, 4, 5, 7, 8, 11], kharaharapriya:[0, 2, 3, 5, 7, 9, 10], abheri:[0, 3, 5, 7, 10]};
const KEYS = {C:48, 'C#':49, D:50, 'D#':51, E:52, F:53, 'F#':54, G:55, 'G#':56, A:57, 'A#':58, B:59};
// one tala cycle: [beats per step, strokes...]
const TALAS = {
  teentaal:[1, 'dha', 'dhin', 'dhin', 'dha', 'dha', 'dhin', 'dhin', 'dha', 'dha', 'tin', 'tin', 'ta', 'ta', 'dhin', 'dhin', 'dha'].map((v, i) => i ? 'tabla:' + v : v),
  keherwa: [0.5, 'dha', 'ge', 'na', 'ti', 'na', 'ke', 'dhin', 'na'].map((v, i) => i ? 'tabla:' + v : v),
  dadra:   [0.5, 'dha', 'dhin', 'na', 'dha', 'tun', 'na'].map((v, i) => i ? 'tabla:' + v : v),
  adi:     [0.5, 'dheem', '-', 'tha', 'ki', 'dhi', 'nam', 'thom', 'ki', 'dheem', '-', 'nam', 'ki', 'dhi', 'dhi', 'thom', '-'].map((v, i) => i ? (v === '-' ? v : 'mri:' + v) : v),
  dholak:  [0.5, 'dhe', '-', 'ta', 'ta', 'dhe', 'dhe', 'ta', '-'].map((v, i) => i ? (v === '-' ? v : 'dholak:' + v) : v),
  kids:    [0.5, 'dholak:dhe', 'shaker', 'dholak:ta', 'shaker', 'dholak:dhe', 'dholak:dhe', 'dholak:ta', 'shaker'],
};
const FILLS = {teentaal:['tabla:te', 'tabla:te', 'tabla:na', 'tabla:dha'], keherwa:['tabla:te', 'tabla:na', 'tabla:te', 'tabla:dha'], dadra:['tabla:ti', 'tabla:na', 'tabla:dha'],
  adi:['mri:ki', 'mri:tha', 'mri:dhi', 'mri:nam'], dholak:['dholak:ta', 'dholak:ta', 'dholak:dhe'], kids:['dholak:ta', 'dholak:ta']};
const GAIN = {mel:0.55, counter:0.25, drone:0.2, chord:0.22, perc:0.42, bells:0.28, bowl:0.3};
const rng = s => { const f = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  f.pick = a => a[Math.floor(f() * a.length)]; f.int = (a, b) => a + Math.floor(f() * (b - a + 1)); return f; };
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

function compose(o){
  const st = STYLES[o.style], scale = RAGAS[o.raga || st.raga] || RAGAS.mohanam, tempo = o.tempo || st.tempo, beat = 60 / tempo, r = rng(o.seed || 1);
  const root = KEYS[o.key || 'D'], sa = root + 12, total = Math.max(6, o.seconds || 30), ev = [];   // ev: {t, kind, ...}
  const L = scale.length, degMidi = d => { const oc = Math.floor(d / L), i = ((d % L) + L) % L; return sa + 12 * oc + scale[i]; };
  const human = () => (r() - 0.5) * 0.014;
  const alapLen = st.alap ? Math.min(14, Math.max(3, total * 0.18)) : Math.min(2 * beat * 4, total * 0.1);
  const tihaiLen = Math.min(total * 0.18, beat * 12), mainEnd = total - tihaiLen - 1.2, climax = mainEnd - Math.min(total * 0.2, 10);

  // ---- drone (tanpura: Pa Sa' Sa' Sa) for Indian styles, chords for others
  if(!st.chords){ const cyc = Math.max(0.85, beat * 1.2), pat = [root + 7, root + 12, root + 12, root];
    for(let t = 0, k = 0; t < total - 0.5; t += cyc, k++) ev.push({t:t + human() * 0.5, kind:'note', inst:'tanpura', m:pat[k % 4], d:cyc * 1.5, vel:k % 4 === 3 ? 0.9 : 0.7, part:'drone', pan:k % 2 ? 0.25 : -0.25}); }
  else { const prog = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], bar = beat * 4;
    for(let t = 0, b = 0; t < total - 0.5; t += bar, b++){ const ch = prog[b % 4];
      for(let i = 0; i < 8; i++){ const nt = t + i * bar / 8; if(nt > total - 0.6) break; const m = root + ch[[0, 1, 2, 1, 0, 2, 1, 2][i]] + (i % 2 ? 12 : 0);
        ev.push({t:nt + human(), kind:'note', inst:st.chords, m:st.chords === 'marimba' ? m - 12 : m, d:bar / 8 * 1.6, vel:0.55 + 0.15 * (i === 0), part:'chord', pan:(i % 3 - 1) * 0.25}); } } }

  // ---- melody with gamakas
  const gam = (prevM, m, d) => { const g = {};
    if(st.gam === 'carnatic'){ if(d >= beat * 0.9 && r() < 0.6){ g.kampita = 1 + (r() < 0.3 ? 1 : 0); g.rate = 5 + r(); }
      if(prevM != null && r() < 0.35 && Math.abs(prevM - m) <= 4) { g.from = prevM - m; g.slide = 0.09; } }
    if(st.gam === 'hindustani'){ if(prevM != null && r() < 0.5 && Math.abs(prevM - m) <= 5){ g.from = prevM - m; g.slide = 0.18; } if(d >= beat * 1.5 && r() < 0.15){ g.kampita = 0.6; g.rate = 2.6; g.kStart = 0.4; } }
    if(st.gam === 'flute'){ if(prevM != null && r() < 0.4 && Math.abs(prevM - m) <= 3){ g.from = prevM - m; g.slide = 0.12; } if(d >= beat * 1.2 && r() < 0.25){ g.kampita = 0.5; g.rate = 4.6; g.kStart = 0.35; } }
    return g; };
  let prevM = null, deg = 0;
  const phrase = (len, start, end) => { const out = []; let d = start; for(let i = 0; i < len; i++){ if(i === len - 1) d = end; else { d += r.pick([-2, -1, -1, 0, 1, 1, 1, 2, r.pick([-3, 3])]); d = Math.max(-2, Math.min(L + 4, d)); } out.push(d); } return out; };
  const pa = scale.includes(7) ? scale.indexOf(7) : Math.floor(L / 2);
  const addMel = (t, d, m, vel, inst = st.mel) => { if(st.tremolo && d > beat){ for(let k = 0; k * beat / 4 < d; k++) ev.push({t:t + k * beat / 4 + human() * 0.3, kind:'note', inst, m, d:beat / 4, vel:vel * (k % 2 ? 0.7 : 0.9), part:'mel', pan:0.05}); }
    else ev.push({t:t + human(), kind:'note', inst, m, d, vel, part:'mel', pan:0.05, g:gam(prevM, m, d)}); prevM = m; };
  // alap: slow notes exploring the raga from Sa upwards
  if(st.alap){ let t = Math.min(1.2, alapLen * 0.15); const path = [0, 1, 0, -1, 0, 1, 2, pa, 2, 1, 0];
    for(const dg of path){ if(t > alapLen - 0.8) break; const d = (st.sparse ? 2.6 : 1.6) * (0.8 + r() * 0.6); addMel(t, d, degMidi(dg), 0.75); t += d + (st.sparse ? 1.2 : 0.25); } }
  // main: rhythmic phrases in A A' B A form
  const durs = st.sparse ? [2, 3, 4] : st.style === 'kids' ? [0.5, 0.5, 1] : [0.5, 0.5, 1, 1, 1.5, 2];
  let t = alapLen + beat * (st.alap ? 2 : 0), k = 0; const motifs = {};
  while(t < mainEnd - beat){ const part = 'AABA'[k % 4], dense = t > climax;
    if(!motifs[part] || (part === 'A' && k % 8 === 4)){ const n = r.int(5, 9); motifs[part] = [phrase(n, r.pick([0, pa, L]), r.pick([0, pa, L])), Array.from({length:n}, () => r.pick(dense ? [0.5, 0.5, 1] : durs))]; }
    let [degs, ds] = motifs[part]; if(k % 4 === 1) degs = degs.map((d, i) => d + (r() < 0.3 && i < degs.length - 1 ? r.pick([-1, 1]) : 0));
    for(let i = 0; i < degs.length && t < mainEnd - beat * 0.5; i++){ const d = ds[i] * beat * (dense ? 0.75 : 1); addMel(t, d * 0.95, degMidi(degs[i]), 0.7 + r() * 0.25);
      if(st.counter && i % 2 === 0) ev.push({t:t + human(), kind:'note', inst:st.counter, m:degMidi(degs[i]) + 12, d:d, vel:0.35, part:'counter', pan:0.35}); t += d; }
    t += beat * r.pick(st.sparse ? [2, 3, 4] : [0.5, 1, 1, 2]); k++; }
  // tihai: a short phrase played 3 times, landing on Sa
  const tStart = Math.max(t, mainEnd), tp = phrase(3, r.pick([pa, L - 1, 2]), 0).map(degMidi), tb = beat * 0.75;
  let tt = tStart; for(let rep = 0; rep < 3; rep++){ for(const m of tp){ addMel(tt, tb * 0.9, m, 0.85); tt += tb; } tt += tb; }
  const endT = Math.min(total - 0.3, tt); addMel(endT, Math.max(0.8, total - endT), sa, 0.9);

  // ---- percussion: theka in tala cycles, fills every 4th cycle, denser in the climax, final stroke on sam
  if(st.perc){ const tal = TALAS[st.perc], step = tal[0] * beat, strokes = tal.slice(1), cycLen = step * strokes.length, f = hz(sa);
    const pStart = st.alap ? alapLen : 0; let cyc = 0;
    for(let c0 = pStart; c0 + step <= tStart; c0 += cycLen, cyc++){
      strokes.forEach((s, i) => { const tt2 = c0 + i * step; if(tt2 >= tStart || s === '-') return; const fill = cyc % 4 === 3 && i >= strokes.length / 2;
        if(fill || (tt2 > climax && i % 2 === 1)){ const fl = FILLS[st.perc]; for(let q = 0; q < 2; q++) ev.push({t:tt2 + q * step / 2 + human(), kind:'stroke', s:fl[(i * 2 + q) % fl.length], f, vel:0.6 + 0.2 * q, part:'perc'}); }
        else ev.push({t:tt2 + human(), kind:'stroke', s, f, vel:i === 0 ? 1 : 0.75 + r() * 0.15, part:'perc'}); }); }
    // tihai strokes with the melody, then the final sam stroke
    let ts = tStart; for(let rep = 0; rep < 3; rep++){ for(let q = 0; q < tp.length; q++){ ev.push({t:ts, kind:'stroke', s:FILLS[st.perc][q % FILLS[st.perc].length], f, vel:0.85, part:'perc'}); ts += tb; } ts += tb; }
    ev.push({t:endT, kind:'stroke', s:st.perc === 'adi' ? 'mri:dheem' : st.perc === 'dholak' || st.perc === 'kids' ? 'dholak:dhe' : 'tabla:dha', f, vel:1, part:'perc'});
  }
  // ---- extra colours
  const ex = st.extra || [], pS = st.alap ? alapLen : 0;
  for(let bt = pS, i = 0; bt < endT; bt += beat, i++){
    if(ex.includes('gajjalu')) ev.push({t:bt + human(), kind:'stroke', s:i % 4 === 0 ? 'gajjalu' : 'gajjalu:soft', vel:i % 4 === 0 ? 1 : 0.7, part:'bells', seedOff:i % 5});
    if(ex.includes('gajjalu') && bt > climax) ev.push({t:bt + beat / 2 + human(), kind:'stroke', s:'gajjalu:soft', vel:0.6, part:'bells', seedOff:i % 3 + 7});
    if(ex.includes('gajjalu_soft') && i % 2 === 0) ev.push({t:bt + human(), kind:'stroke', s:'gajjalu:soft', vel:0.5, part:'bells', seedOff:i % 4});
    if(ex.includes('manjira')) ev.push({t:bt + human(), kind:'stroke', s:i % 2 === 0 ? 'manjira' : 'manjira:closed', vel:i % 4 === 0 ? 0.9 : 0.6, part:'bells', seedOff:i % 3});
    if(ex.includes('taalam') && i % 2 === 0) ev.push({t:bt + human(), kind:'stroke', s:'taalam', vel:i % 8 === 0 ? 0.9 : 0.5, part:'bells', seedOff:i % 3});
    if(ex.includes('ghatam')){ if(i % 4 === 0) ev.push({t:bt, kind:'stroke', s:'ghatam:gum', f:hz(sa), vel:0.8, part:'perc'}); if(i % 2 === 1) ev.push({t:bt + beat / 2 + human(), kind:'stroke', s:'ghatam:ta', vel:0.5, part:'perc'}); }
    if(ex.includes('shaker')) for(let q = 0; q < 2; q++) ev.push({t:bt + q * beat / 2 + human(), kind:'stroke', s:'shaker', vel:q ? 0.6 : 0.9, part:'bells', seedOff:(i + q) % 4});
    if(ex.includes('cowbells') && r() < 0.18) ev.push({t:bt + human() * 3, kind:'stroke', s:'bell:cow', f:r.pick([620, 680, 720]), vel:0.4, part:'bells', seedOff:i % 3});
  }
  if(ex.includes('templebell')){ ev.push({t:0.05, kind:'stroke', s:'bell:temple', f:hz(root + 24), vel:0.8, part:'bells'}); ev.push({t:endT, kind:'stroke', s:'bell:temple', f:hz(root + 24), vel:0.9, part:'bells'}); }
  if(ex.includes('bowls')) for(let bt = 0.1, i = 0; bt < total - 1; bt += 5 + r() * 4, i++) ev.push({t:bt, kind:'stroke', s:'bowl', f:hz(root + [0, 7, 12][i % 3]), vel:0.8, part:'bowl'});
  if(ex.includes('chimes')) for(let bt = 1.5; bt < total - 1.5; bt += 1.2 + r() * 3) ev.push({t:bt, kind:'stroke', s:'chime', f:hz(sa + 24 + scale[r.int(0, L - 1)]), vel:0.4 + r() * 0.3, part:'bells', seedOff:Math.floor(bt)});
  return {ev, total, sections:[['Alap (intro)', 0, alapLen], ['Main', alapLen, climax], ['Climax', climax, tStart], ['Tihai & ending', tStart, total]].filter(x => x[2] - x[1] > 0.3)};
}

function PAN(L, R, x, at, gain, pan){ const o = Math.floor(at * SR); if(o >= L.length) return; const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for(let i = 0; i < x.length && o + i < L.length; i++){ if(o + i < 0) continue; L[o + i] += x[i] * gl; R[o + i] += x[i] * gr; } };
function impulse(ctx, secs){ const len = Math.floor(secs * ctx.sampleRate), b = ctx.createBuffer(2, len, ctx.sampleRate), r = rng(17);
  for(let c = 0; c < 2; c++){ const d = b.getChannelData(c); for(let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 3.2); } return b; }

const cache = {};
async function render(o){
  const key = JSON.stringify([o.style, o.raga, o.seconds, o.key, o.tempo, o.seed]); if(cache[key]) return cache[key];
  const S = window.VG_SYNTH; if(!S) throw new Error('synth.js not loaded');
  const song = compose(o), n = Math.ceil((song.total + 0.2) * SR), L = new Float32Array(n), R = new Float32Array(n);
  const st = STYLES[o.style]; let count = 0;
  for(const e of song.ev){
    let x; const g = GAIN[e.part] || 0.3;
    if(e.kind === 'note') x = S.note(e.inst, hz(e.m), e.d, {vel:e.vel, seed:(o.seed || 1) + count % 7, ...(e.g || {}), taraf:st.taraf ? [hz(KEYS[o.key || 'D'] + 12), hz(KEYS[o.key || 'D'] + 19), hz(KEYS[o.key || 'D'] + 24)] : null});
    else x = S.stroke(e.s, {f:e.f || 300, seed:1 + (e.seedOff ?? count % 3), vel:1});
    PAN(L, R, x, e.t, g * (e.vel ?? 1), e.pan || 0); if(++count % 60 === 0) await new Promise(r => setTimeout(r, 0));
  }
  // room reverb + gentle compression, then even loudness and fades
  const ctx = new OfflineAudioContext(2, n, SR), buf = ctx.createBuffer(2, n, SR); buf.copyToChannel(L, 0); buf.copyToChannel(R, 1);
  const src = ctx.createBufferSource(); src.buffer = buf; const dry = ctx.createGain(); dry.gain.value = 0.85; const verb = ctx.createConvolver(); verb.buffer = impulse(ctx, st.sparse ? 4 : 2.2);
  const wet = ctx.createGain(); wet.gain.value = st.sparse ? 0.4 : 0.2; const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
  src.connect(dry); dry.connect(comp); src.connect(verb); verb.connect(wet); wet.connect(comp); comp.connect(ctx.destination); src.start();
  const out = await ctx.startRendering();
  let pk = 0; for(let c = 0; c < 2; c++){ const d = out.getChannelData(c); for(let i = 0; i < d.length; i++){ const a = Math.abs(d[i]); if(a > pk) pk = a; } }
  const gn = pk ? 0.85 / pk : 1, fi = Math.floor(0.8 * SR), fo = Math.floor(Math.min(2.5, song.total / 6) * SR);
  for(let c = 0; c < 2; c++){ const d = out.getChannelData(c), N = d.length; for(let i = 0; i < N; i++){ let k = gn; if(i < fi) k *= i / fi; if(i > N - fo) k *= (N - i) / fo; d[i] *= k; } }
  return cache[key] = out;
}
window.VG_SYNTHMUSIC = {STYLES, RAGAS, TALAS, render, compose};
})();
