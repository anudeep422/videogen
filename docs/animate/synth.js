/* ==========================================================================
   VideoGen – physical-model instruments (no recordings, no AI).
   Every sound is calculated from a simple model of the real instrument:
     • plucked strings  – Karplus-Strong string with body, jawari buzz and
                          sympathetic strings (veena, sitar, tanpura, santoor, guitar, harp)
     • drums            – modal synthesis: the skin's vibration modes plus a strike noise
                          (tabla bols, mridangam strokes, ghatam, kanjira, dholak, dhol)
     • bells & bars     – inharmonic partials (temple bell, gajjalu, manjira, cow bells,
                          wind chimes, singing bowl, marimba, xylophone, glockenspiel, kalimba)
     • wind & reeds     – additive tone + breath (bansuri), reed pairs (harmonium), organ
   Gamakas and meend: pitch can slide and oscillate inside a note.
   window.VG_SYNTH.note(inst, freq, seconds, opts) -> Float32Array (mono, 44.1 kHz)
   window.VG_SYNTH.stroke(name, opts)             -> Float32Array
   ========================================================================== */
(function(){
const SR = 44100, TAU = Math.PI * 2;
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// ---------------------------------------------------------------- small DSP helpers
function biquad(x, type, f, Q = 0.7, gainDb = 0){   // in place, RBJ cookbook
  const w = TAU * Math.min(f, SR * 0.45) / SR, cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * Q), A = Math.pow(10, gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  if(type === 'lp'){ b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else if(type === 'hp'){ b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else if(type === 'bp'){ b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; }   // peak
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for(let i = 0; i < x.length; i++){ const xi = x[i], y = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = xi; y2 = y1; y1 = y; x[i] = y; }
  return x;
}
function noiseBurst(len, decay, seed, out){ const r = rng(seed); out = out || new Float32Array(len); for(let i = 0; i < len; i++) out[i] += (r() * 2 - 1) * Math.exp(-i / (decay * SR)); return out; }
function fadeEnd(x, ms = 8){ const n = Math.min(x.length, Math.floor(ms * SR / 1000)); for(let i = 0; i < n; i++) x[x.length - 1 - i] *= i / n; return x; }
const t60k = t60 => Math.exp(-6.9078 / (Math.max(0.005, t60) * SR));   // per-sample decay factor

// modal synthesis: sum of decaying sine partials [ratio, amp, t60], optional pitch bend
function modal(f0, modes, len, o = {}){
  const x = new Float32Array(len), r = rng(o.seed || 1);
  for(const [ratio, amp, t60, det] of modes){
    let ph = r() * TAU, a = amp, k = t60k(t60); const base = f0 * ratio * (1 + (det || 0));
    if(base > SR * 0.45) continue;
    const bend = o.bend || 0, bt = o.bendTime || 0.08;
    for(let i = 0; i < len; i++){
      const f = bend ? base * (1 + bend * (1 - Math.exp(-i / (bt * SR)))) : base;
      ph += TAU * f / SR; x[i] += a * Math.sin(ph); a *= k; if(a < 1e-5) break; }
  }
  return x;
}

// Karplus-Strong plucked string with fractional, time-varying length (for gamaka / meend)
function string(f, dur, o = {}){
  const len = Math.floor((dur + (o.ring ?? 0.8)) * SR), out = new Float32Array(len), r = rng(o.seed || 7);
  const maxN = Math.ceil(SR / (f * 0.45)) + 4, buf = new Float32Array(maxN);
  const N0 = SR / f, pluck = o.pluck ?? 0.18, bright = o.bright ?? 0.6;
  // excitation: filtered noise with the pluck-position comb
  const ex = new Float32Array(Math.ceil(N0) + 2); let lp = 0;
  for(let i = 0; i < ex.length; i++){ lp += bright * ((r() * 2 - 1) - lp); ex[i] = lp; }
  const pd = Math.max(1, Math.round(pluck * N0)); for(let i = ex.length - 1; i >= pd; i--) ex[i] -= ex[i - pd];
  for(let i = 0; i < ex.length && i < maxN; i++) buf[i] = ex[i] * (o.vel ?? 1);
  const T60 = o.t60 ?? 3, damp = o.damp ?? 0.5, stopAt = Math.floor(dur * SR), muteK = t60k(0.08);
  let w = ex.length % maxN, prev = 0, mute = 1;
  const glide = o.glide;   // function(time) -> semitone offset
  for(let i = 0; i < len; i++){
    const st = glide ? glide(i / SR) : 0, N = N0 / Math.pow(2, st / 12);
    let rp = w - N; while(rp < 0) rp += maxN; const i0 = Math.floor(rp), fr = rp - i0, i1 = (i0 + 1) % maxN;
    const cur = buf[i0] * (1 - fr) + buf[i1] * fr;
    const g = Math.pow(10, -3 * (N / SR) / T60);
    let y = g * (damp * cur + (1 - damp) * prev); prev = cur;
    if(i > stopAt && o.mute){ mute *= muteK; y *= 0.995; }
    buf[w] = y; w = (w + 1) % maxN; out[i] = y * mute;
  }
  return out;
}
// jawari: the curved bridge makes veena / sitar / tanpura buzz; louder notes buzz more
function jawari(x, amount){ if(!amount) return x; const k = 1 + amount * 6, nrm = Math.tanh(k);
  for(let i = 0; i < x.length; i++){ const v = x[i]; x[i] = v * (1 - amount * 0.5) + amount * 0.5 * Math.tanh(k * v) / nrm; } return x; }
// sympathetic strings (sitar taraf): comb resonators tuned to the raga's notes
function sympathetic(x, freqs, mix = 0.15, fb = 0.996){
  const out = new Float32Array(x.length);
  for(const f of freqs){ const D = Math.max(2, Math.round(SR / f)), d = new Float32Array(D); let p = 0;
    for(let i = 0; i < x.length; i++){ const y = x[i] * 0.02 + d[p] * fb; d[p] = y; p = (p + 1) % D; out[i] += y; } }
  for(let i = 0; i < x.length; i++) x[i] += out[i] * mix / freqs.length * 4;
  return x;
}
function body(x, peaks){ const y = Float32Array.from(x); const add = new Float32Array(x.length);
  for(const [f, q, g] of peaks){ const b = Float32Array.from(x); biquad(b, 'bp', f, q); for(let i = 0; i < x.length; i++) add[i] += b[i] * g; }
  for(let i = 0; i < x.length; i++) y[i] += add[i]; return y; }

// ---------------------------------------------------------------- gamaka helpers (semitone offset over time)
// meend: slide from `from` semitones to 0;  kampita: oscillate up to `depth` semitones
function gamaka(o){
  const from = o.from || 0, slide = o.slide || 0.12, depth = o.kampita || 0, start = o.kStart ?? 0.18, rate = o.rate || 5;
  if(!from && !depth) return null;
  return t => { let s = 0; if(from){ const u = Math.min(1, t / slide); s += from * (1 - u * u * (3 - 2 * u)); }
    if(depth && t > start){ const ramp = Math.min(1, (t - start) / 0.15); s += depth * ramp * (0.5 - 0.5 * Math.cos(TAU * rate * (t - start))); }
    return s; };
}

// ---------------------------------------------------------------- melodic instruments
const INST = {
  veena(f, d, o){ let x = string(f, d, {t60:4.5, bright:0.55, pluck:0.12, damp:0.52, glide:gamaka(o), seed:o.seed, vel:o.vel, ring:1.2});
    x = jawari(x, 0.35); x = body(x, [[180, 1.2, 0.5], [420, 1.5, 0.3], [1250, 2, 0.15]]); return x; },
  sitar(f, d, o){ let x = string(f, d, {t60:3.6, bright:0.75, pluck:0.08, damp:0.55, glide:gamaka(o), seed:o.seed, vel:o.vel, ring:1.2});
    x = jawari(x, 0.6); x = body(x, [[300, 1.5, 0.3], [900, 2, 0.25], [2600, 3, 0.2]]);
    if(o.taraf) x = sympathetic(x, o.taraf, 0.22); return x; },
  tanpura(f, d, o){ let x = string(f, d, {t60:6, bright:0.5, pluck:0.25, damp:0.5, seed:o.seed, vel:o.vel, ring:2.5}); x = jawari(x, 0.8); return body(x, [[150, 1, 0.4], [600, 1.5, 0.2]]); },
  santoor(f, d, o){ const x = new Float32Array(Math.floor((d + 1.6) * SR));
    [-0.004, 0, 0.0035].forEach((dt, k) => { const s = string(f * (1 + dt), d, {t60:2.6, bright:0.9, pluck:0.06, damp:0.58, seed:(o.seed || 1) + k, vel:(o.vel ?? 1) * 0.7, ring:1.6}); for(let i = 0; i < s.length && i < x.length; i++) x[i] += s[i]; });
    return body(x, [[500, 1.2, 0.25], [2200, 2, 0.2]]); },
  guitar(f, d, o){ const x = string(f, d, {t60:3, bright:0.45, pluck:0.2, damp:0.5, glide:gamaka(o), seed:o.seed, vel:o.vel, ring:1}); return body(x, [[110, 1, 0.6], [220, 1.5, 0.4], [480, 2, 0.2]]); },
  harp(f, d, o){ const x = string(f, d, {t60:3.4, bright:0.38, pluck:0.45, damp:0.48, seed:o.seed, vel:o.vel, ring:1.5}); return body(x, [[300, 1, 0.3]]); },
  bansuri(f, d, o){ const len = Math.floor((d + 0.35) * SR), x = new Float32Array(len), g = gamaka(o), r = rng(o.seed || 3);
    let ph = 0, br = 0, bf = 0; const att = 0.07, rel = 0.25;
    const bq = {x1:0, x2:0, y1:0, y2:0};
    for(let i = 0; i < len; i++){ const t = i / SR, st = g ? g(t) : 0, vib = t > 0.3 ? 0.006 * Math.sin(TAU * 5.1 * t) * Math.min(1, (t - 0.3) / 0.3) : 0;
      const fr = f * Math.pow(2, st / 12) * (1 + vib); ph += TAU * fr / SR;
      const env = t < att ? t / att : t < d ? 1 - 0.12 * (t - att) / Math.max(0.1, d) : Math.max(0, 1 - (t - d) / rel) * 0.88;
      const tone = Math.sin(ph) + 0.14 * Math.sin(2 * ph + 0.3) + 0.05 * Math.sin(3 * ph + 1.1);
      const n = r() * 2 - 1; br += 0.25 * (n - br); bf += 0.06 * (br - bf);
      const breath = (br - bf) * (0.10 + (t < 0.06 ? 0.5 * (1 - t / 0.06) : 0));
      x[i] = (tone * 0.9 + breath) * env * (o.vel ?? 1) * 0.6; }
    return biquad(x, 'peak', f * 2, 1.2, 3); },
  harmonium(f, d, o){ const len = Math.floor((d + 0.2) * SR), x = new Float32Array(len); const H = 14;
    for(const det of [-0.0012, 0.0012]){ let ph = Math.random() * TAU; const fr = f * (1 + det);
      for(let i = 0; i < len; i++){ ph += TAU * fr / SR; let v = 0; for(let n = 1; n <= H; n++){ if(fr * n > 9000) break; v += Math.sin(n * ph) / Math.pow(n, 1.05) * (n === 3 || n === 5 ? 1.3 : 1); } x[i] += v * 0.12; } }
    const att = 0.06, rel = 0.15;
    for(let i = 0; i < len; i++){ const t = i / SR, env = (t < att ? t / att : t < d ? 1 : Math.max(0, 1 - (t - d) / rel)) * (1 + 0.04 * Math.sin(TAU * 0.4 * t)); x[i] *= env * (o.vel ?? 1); }
    return biquad(biquad(x, 'peak', 1400, 1, 4), 'lp', 5500); },
  organ(f, d, o){ const len = Math.floor((d + 0.15) * SR), x = new Float32Array(len), bars = [[0.5, 0.5], [1, 1], [2, 0.6], [3, 0.35], [4, 0.25], [6, 0.12]];
    for(const [m, a] of bars){ let ph = 0; for(let i = 0; i < len; i++){ ph += TAU * f * m / SR; x[i] += a * Math.sin(ph) * 0.25; } }
    for(let i = 0; i < len; i++){ const t = i / SR; x[i] *= (t < 0.02 ? t / 0.02 : t < d ? 1 : Math.max(0, 1 - (t - d) / 0.12)) * (o.vel ?? 1) * (1 + 0.15 * Math.sin(TAU * 6 * t)); }
    return x; },
  marimba(f, d, o){ const x = modal(f, [[1, 1, 1.2], [3.93, 0.25, 0.35], [10.1, 0.06, 0.08]], Math.floor(1.6 * SR), o); noiseBurst(Math.floor(0.01 * SR), 0.002, o.seed || 1, x); return scale(x, o.vel); },
  xylophone(f, d, o){ const x = modal(f, [[1, 1, 0.5], [3.0, 0.4, 0.2], [6.1, 0.15, 0.08]], Math.floor(0.9 * SR), o); noiseBurst(Math.floor(0.008 * SR), 0.0015, o.seed || 1, x); return scale(x, o.vel); },
  glockenspiel(f, d, o){ return scale(modal(f, [[1, 1, 2.4], [2.76, 0.35, 1.2], [5.4, 0.12, 0.5]], Math.floor(2.6 * SR), o), o.vel); },
  kalimba(f, d, o){ const x = modal(f, [[1, 1, 1.6], [5.97, 0.25, 0.22], [12.2, 0.05, 0.05]], Math.floor(1.8 * SR), o); noiseBurst(Math.floor(0.006 * SR), 0.0012, o.seed || 1, x); return scale(x, o.vel); },
  vibraphone(f, d, o){ const x = modal(f, [[1, 1, 3.5], [4, 0.2, 0.8], [10, 0.04, 0.2]], Math.floor(3.6 * SR), o); for(let i = 0; i < x.length; i++) x[i] *= 1 - 0.3 * (0.5 + 0.5 * Math.sin(TAU * 5.5 * i / SR)); return scale(x, o.vel); },
};
const scale = (x, v = 1) => { if(v !== 1) for(let i = 0; i < x.length; i++) x[i] *= v; return x; };

// ---------------------------------------------------------------- drums and bells (one stroke)
const MEMB = [[1, 1, 0.3], [1.59, 0.6, 0.2], [2.14, 0.45, 0.15], [2.30, 0.35, 0.13], [2.65, 0.25, 0.1], [2.92, 0.2, 0.08], [3.16, 0.15, 0.07]];   // circular drum skin
function dayan(kind, f, s){   // tabla right drum: the black syahi makes its modes harmonic
  const L = Math.floor(1.3 * SR);
  if(kind === 'na') { const x = modal(f, [[1, 0.9, 0.7], [2, 0.7, 0.55], [3, 0.5, 0.4], [4, 0.3, 0.3], [5, 0.2, 0.2], [6.3, 0.1, 0.1]], L, {seed:s}); click(x, 3200, 0.004, s, 0.6); return x; }
  if(kind === 'tin'){ const x = modal(f, [[1, 1, 1.0], [2, 0.35, 0.6], [3, 0.2, 0.4], [4, 0.1, 0.25]], L, {seed:s}); click(x, 2000, 0.003, s, 0.3); return x; }
  if(kind === 'tun'){ const x = modal(f, [[1, 1, 1.2], [2, 0.15, 0.4]], L, {seed:s}); click(x, 1500, 0.004, s, 0.25); return x; }
  /* te / ti / ta (closed) */ const x = modal(f, [[1, 0.5, 0.05], [2, 0.4, 0.04], [3, 0.3, 0.03]], Math.floor(0.25 * SR), {seed:s}); click(x, 2800, 0.006, s, 0.8); return x;
}
function bayan(kind, f, s){   // tabla left drum: deep bass whose pitch rises when the palm presses
  if(kind === 'ge'){ const x = modal(f, [[1, 1, 0.9], [1.5, 0.25, 0.4], [2.0, 0.12, 0.25]], Math.floor(1.3 * SR), {seed:s, bend:0.28, bendTime:0.12}); click(x, 600, 0.006, s, 0.25); return x; }
  /* ke / ka: flat slap */ const x = modal(f * 0.8, [[1, 0.6, 0.06]], Math.floor(0.2 * SR), {seed:s}); click(x, 500, 0.02, s, 0.8); return x;
}
function click(x, f, dec, s, amp){ const n = Math.floor(Math.min(x.length, dec * 8 * SR)), b = noiseBurst(n, dec, s * 7 + 3); biquad(b, 'bp', f, 1.2); for(let i = 0; i < n; i++) x[i] += b[i] * amp * 3; }
function mix(...xs){ const L = Math.max(...xs.map(x => x.length)), o = new Float32Array(L); for(const x of xs) for(let i = 0; i < x.length; i++) o[i] += x[i]; return o; }

const STROKES = {
  // tabla bols (o.f = right drum pitch, tuned to Sa)
  'tabla:na':  o => dayan('na', o.f, o.seed), 'tabla:ta': o => dayan('na', o.f, o.seed), 'tabla:tin': o => dayan('tin', o.f, o.seed), 'tabla:tun': o => dayan('tun', o.f, o.seed),
  'tabla:ti':  o => dayan('ti', o.f, o.seed), 'tabla:te': o => dayan('ti', o.f, o.seed),
  'tabla:ge':  o => bayan('ge', o.f / 3.2, o.seed), 'tabla:ke': o => bayan('ke', o.f / 3, o.seed),
  'tabla:dha': o => mix(dayan('na', o.f, o.seed), bayan('ge', o.f / 3.2, o.seed + 1)), 'tabla:dhin': o => mix(dayan('tin', o.f, o.seed), bayan('ge', o.f / 3.2, o.seed + 1)),
  // mridangam strokes (right head tuned to Sa, left head = big bass)
  'mri:tha':  o => { const x = modal(o.f, [[1, 0.6, 0.06], [2, 0.4, 0.05], [3.05, 0.25, 0.04]], Math.floor(0.3 * SR), {seed:o.seed}); click(x, 2400, 0.006, o.seed, 0.7); return x; },
  'mri:dhi':  o => { const x = modal(o.f, [[1, 1, 0.8], [2, 0.3, 0.45], [3.02, 0.18, 0.3]], Math.floor(1.2 * SR), {seed:o.seed}); click(x, 1800, 0.003, o.seed, 0.3); return x; },
  'mri:nam':  o => { const x = modal(o.f, [[1, 0.6, 0.7], [2, 0.8, 0.6], [3.02, 0.55, 0.45], [4.05, 0.3, 0.3], [5.1, 0.15, 0.2]], Math.floor(1.2 * SR), {seed:o.seed}); click(x, 3500, 0.003, o.seed, 0.5); return x; },
  'mri:chapu':o => { const x = modal(o.f, [[2, 0.4, 0.6], [3.02, 0.8, 0.7], [4.05, 0.5, 0.5], [6.1, 0.2, 0.3]], Math.floor(1.2 * SR), {seed:o.seed}); click(x, 4200, 0.003, o.seed, 0.4); return x; },
  'mri:thom': o => { const x = modal(o.f / 2.6, [[1, 1, 0.55], [1.6, 0.3, 0.3], [2.3, 0.12, 0.2]], Math.floor(1 * SR), {seed:o.seed, bend:-0.12, bendTime:0.1}); click(x, 400, 0.01, o.seed, 0.5); return x; },
  'mri:ki':   o => { const x = modal(o.f, [[1, 0.35, 0.04], [2.1, 0.3, 0.03]], Math.floor(0.2 * SR), {seed:o.seed}); click(x, 3000, 0.004, o.seed, 0.6); return x; },
  'mri:dheem':o => mix(STROKES['mri:dhi'](o), STROKES['mri:thom']({...o, seed:o.seed + 3})),
  // ghatam: clay pot (deep mouth tone + sharp clay clicks)
  'ghatam:gum': o => { const x = modal(o.f / 2.4, [[1, 1, 0.3], [2.4, 0.2, 0.1]], Math.floor(0.6 * SR), {seed:o.seed, bend:-0.15, bendTime:0.08}); click(x, 700, 0.01, o.seed, 0.4); return x; },
  'ghatam:ta':  o => { const x = modal(900, [[1, 0.4, 0.05], [1.73, 0.3, 0.04], [2.9, 0.2, 0.03]], Math.floor(0.2 * SR), {seed:o.seed}); click(x, 2600, 0.008, o.seed, 1); return x; },
  // kanjira: small frame drum with one pair of jingles
  'kanjira': o => { const x = modal(o.f * 1.2, MEMB.slice(0, 5), Math.floor(0.6 * SR), {seed:o.seed, bend:-0.08}); const j = jingle(3, o.seed, 0.6); for(let i = 0; i < j.length && i < x.length; i++) x[i] += j[i]; click(x, 1800, 0.005, o.seed, 0.4); return x; },
  // dholak / dhol
  'dholak:ta':  o => { const x = modal(380, MEMB, Math.floor(0.5 * SR), {seed:o.seed}); click(x, 2500, 0.004, o.seed, 0.5); return x; },
  'dholak:dhe': o => { const x = modal(105, [[1, 1, 0.45], [1.59, 0.4, 0.25], [2.14, 0.2, 0.15]], Math.floor(0.8 * SR), {seed:o.seed, bend:0.18}); click(x, 500, 0.008, o.seed, 0.4); return x; },
  'dhol:dhum':  o => { const x = modal(68, [[1, 1, 0.6], [1.59, 0.5, 0.35], [2.14, 0.25, 0.2]], Math.floor(1 * SR), {seed:o.seed}); click(x, 300, 0.015, o.seed, 0.9); return x; },
  'dhol:tak':   o => { const x = modal(420, MEMB, Math.floor(0.3 * SR), {seed:o.seed}); click(x, 3000, 0.003, o.seed, 1.2); return x; },
  // bells
  'gajjalu':      o => jingle(Math.round(18 + 30 * (o.vel ?? 1)), o.seed, o.vel ?? 1),
  'gajjalu:soft': o => jingle(10, o.seed, 0.45),
  'manjira':      o => cymbal(2600, 1.6, o.seed, 1), 'manjira:closed': o => cymbal(2600, 0.09, o.seed, 0.8),
  'taalam':       o => cymbal(3400, 1.0, o.seed, 0.8),
  'bell:temple':  o => templeBell(o.f || 520, o.seed), 'bell:small': o => templeBell((o.f || 520) * 2.2, o.seed, 2.5),
  'bell:cow':     o => { const f = o.f || 640, x = modal(f, [[1, 1, 0.9], [1.48, 0.7, 0.6], [2.36, 0.45, 0.4], [3.1, 0.3, 0.25]], Math.floor(1.2 * SR), {seed:o.seed}); click(x, 2000, 0.004, o.seed, 0.6); return x; },
  'chime':        o => modal(o.f || 1760, [[1, 1, 3], [2.76, 0.4, 1.4], [5.4, 0.15, 0.6], [8.93, 0.05, 0.3]], Math.floor(3.2 * SR), {seed:o.seed}),
  'bowl':         o => { const f = o.f || 220, x = modal(f, [[1, 1, 9, 0], [1, 0.6, 9, 0.004], [2.71, 0.5, 6], [2.71, 0.3, 6, 0.003], [5.0, 0.2, 3]], Math.floor(9 * SR), {seed:o.seed}); for(let i = 0; i < Math.min(x.length, 0.6 * SR); i++) x[i] *= i / (0.6 * SR); return x; },
  'shaker':       o => { const n = Math.floor(0.12 * SR), x = noiseBurst(n, 0.03, o.seed); biquad(x, 'hp', 5000); for(let i = 0; i < n; i++) x[i] *= Math.sin(Math.PI * i / n); return scale(x, 0.5); },
};
function jingle(count, seed, vel){   // many tiny bells shaken together (gajjalu / ghungroo)
  const r = rng(seed || 5), L = Math.floor(0.6 * SR), x = new Float32Array(L);
  for(let b = 0; b < count; b++){ const f = 3600 + r() * 3600, t0 = Math.floor(r() * r() * 0.03 * SR), amp = (0.25 + r() * 0.75) * vel / Math.sqrt(count) * 1.6, t60 = 0.08 + r() * 0.25;
    const m = modal(f, [[1, 1, t60], [2.32, 0.35, t60 * 0.6], [4.25, 0.15, t60 * 0.4]], Math.floor((t60 + 0.05) * SR), {seed:seed + b});
    for(let i = 0; i < m.length && i + t0 < L; i++) x[i + t0] += m[i] * amp; }
  const n = noiseBurst(Math.floor(0.08 * SR), 0.02, seed + 99); biquad(n, 'hp', 6000); for(let i = 0; i < n.length; i++) x[i] += n[i] * 0.25 * vel;
  return x;
}
function cymbal(fc, t60, seed, vel){ const r = rng(seed || 9), L = Math.floor((t60 + 0.1) * SR), modes = [];
  for(let k = 0; k < 24; k++) modes.push([0.6 + r() * 3.2, 0.3 + r() * 0.7, t60 * (0.4 + r() * 0.8)]);
  const x = modal(fc, modes, L, {seed}); const n = noiseBurst(Math.floor(Math.min(t60, 0.4) * SR), t60 * 0.25, seed + 5); biquad(n, 'hp', 4000);
  for(let i = 0; i < n.length; i++) x[i] += n[i] * 0.6; return scale(x, vel * 0.35); }
function templeBell(f, seed, t = 6){ // hum, prime, tierce, quint, nominal… with slow beating pairs
  const P = [[0.5, 0.6, t], [1, 1, t * 0.8], [1.19, 0.5, t * 0.6], [1.5, 0.35, t * 0.5], [2, 0.5, t * 0.45], [2.5, 0.2, t * 0.3], [2.67, 0.18, t * 0.25], [3.0, 0.12, t * 0.2], [4.17, 0.08, t * 0.15]];
  const modes = []; for(const [r, a, d] of P){ modes.push([r, a, d]); modes.push([r, a * 0.6, d, 0.0016]); }
  const x = modal(f, modes, Math.floor((t + 0.5) * SR), {seed}); click(x, 3000, 0.003, seed, 0.3); return scale(x, 0.5); }

// ---------------------------------------------------------------- public API with caching
const cache = new Map();
function stroke(name, o = {}){
  const key = name + '|' + Math.round(o.f || 0) + '|' + (o.seed || 0) + '|' + (o.vel ?? 1).toFixed(2);
  if(cache.has(key)) return cache.get(key);
  const fn = STROKES[name]; if(!fn) return new Float32Array(1);
  const x = fadeEnd(fn({seed:1, vel:1, f:300, ...o})); if(cache.size > 600) cache.clear(); cache.set(key, x); return x;
}
function note(inst, f, dur, o = {}){
  const fn = INST[inst]; if(!fn) return new Float32Array(1);
  const plain = !o.from && !o.kampita, key = plain ? inst + '|' + f.toFixed(2) + '|' + dur.toFixed(2) + '|' + (o.vel ?? 1).toFixed(2) + '|' + ((o.seed || 0) % 3) : null;
  if(key && cache.has(key)) return cache.get(key);
  const x = fadeEnd(fn(f, dur, o)); if(key){ if(cache.size > 600) cache.clear(); cache.set(key, x); } return x;
}
// one-shot sound effects for the Sound panel
function sfx(id){
  const parts = {gajjalu_step:[['gajjalu', 0], ['gajjalu:soft', 0.18], ['gajjalu', 0.36]], gajjalu_shake:[0, .06, .12, .18, .24, .3, .36, .42].map((t, i) => ['gajjalu:soft', t, i]),
    manjira:[['manjira', 0], ['manjira:closed', 0.5], ['manjira', 1.0]], cowbells:[['bell:cow', 0, 0, 640], ['bell:cow', 0.45, 1, 700], ['bell:cow', 0.95, 2, 610]],
    windchimes:[0, .25, .55, .7, 1.1, 1.4].map((t, i) => ['chime', t, i, [1568, 1760, 2093, 2349, 2637][i % 5]]), bowl:[['bowl', 0, 0, 220]], templebell:[['bell:temple', 0, 0, 520]],
    tabla_roll:[0, .09, .18, .27, .36, .45, .54, .63].map((t, i) => [['tabla:te', 'tabla:na', 'tabla:te', 'tabla:dha'][i % 4], t, i, 300]), mridangam_tihai:[]};
  let p = parts[id]; if(!p) return null;
  if(id === 'mridangam_tihai'){ p = []; let t = 0; for(let r = 0; r < 3; r++){ for(const s of ['tha', 'dhi', 'thom', 'nam', 'dheem']){ p.push(['mri:' + s, t, r, 260]); t += 0.14; } t += 0.14; } }
  const sounds = p.map(([nm, t, sd, f]) => [stroke(nm, {seed:(sd || 0) + 1, f:f || 300}), t]);
  const end = Math.max(...sounds.map(([sn, t]) => t + sn.length / SR)) + 0.1, x = new Float32Array(Math.floor(end * SR));
  for(const [sn, t] of sounds){ const o = Math.floor(t * SR); for(let i = 0; i < sn.length && o + i < x.length; i++) x[o + i] += sn[i]; }
  return x;
}
window.VG_SYNTH = {SR, note, stroke, sfx, INST:Object.keys(INST), STROKES:Object.keys(STROKES), biquad};
})();
