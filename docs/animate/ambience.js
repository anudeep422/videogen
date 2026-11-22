/* ==========================================================================
   VideoGen – nature and place sounds (ambience), made with code.
   Rain, thunder, wind, river, sea, waterfall, forest birds, koel, crickets,
   frogs, owl, fire, city traffic, crowd, temple, cave, village, cosmic hum.
   No recordings, no AI. Every sound is built from noise and tones, so it can
   be any length (it covers a whole scene) and is the same each time.
   window.VG_AMB = {LIST, render(id, seconds) -> Promise<AudioBuffer>}
   ========================================================================== */
(function(){
'use strict';
const SR = 44100, TAU = Math.PI * 2;
const LIST = [
  {id:'rain_light', name:'Light rain', icon:'🌦️'}, {id:'rain_heavy', name:'Heavy rain', icon:'🌧️'},
  {id:'storm', name:'Thunderstorm (rain, wind, thunder)', icon:'⛈️'}, {id:'thunder', name:'Distant thunder', icon:'🌩️'},
  {id:'wind', name:'Wind', icon:'🌬️'}, {id:'river', name:'River / stream', icon:'🏞️'},
  {id:'sea', name:'Sea waves', icon:'🌊'}, {id:'waterfall', name:'Waterfall', icon:'💦'},
  {id:'forest', name:'Forest (birds and breeze)', icon:'🌳'}, {id:'morning', name:'Morning birds + koel', icon:'🐦'},
  {id:'village', name:'Village morning (rooster, cows, bells)', icon:'🐄'}, {id:'night', name:'Night (crickets, frogs, owl)', icon:'🦗'},
  {id:'fire', name:'Fire / campfire / homam', icon:'🔥'}, {id:'city', name:'City traffic', icon:'🏙️'},
  {id:'crowd', name:'Crowd talking', icon:'👥'}, {id:'temple', name:'Temple (people, bells)', icon:'🛕'},
  {id:'cave', name:'Cave (water drops)', icon:'🕳️'}, {id:'cosmic', name:'Cosmic hum (space, meditation)', icon:'🌌'},
];

// ---------------------------------------------------------------- helpers
function rng(seed){ let s = seed | 0 || 7; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const buf = n => new Float32Array(n);
function white(n, r){ const x = buf(n); for(let i = 0; i < n; i++) x[i] = r() * 2 - 1; return x; }
function pink(n, r){ const x = buf(n); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for(let i = 0; i < n; i++){ const w = r() * 2 - 1; b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898; x[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926; } return x; }
function brown(n, r){ const x = buf(n); let v = 0; for(let i = 0; i < n; i++){ v = (v + 0.02 * (r() * 2 - 1)) / 1.02; x[i] = v * 3.5; } return x; }
// one-pole filters; cutoff may be a number or a function of sample index
function lp(x, fc){ const y = buf(x.length); let v = 0; const f = typeof fc === 'function';
  let a = 1 - Math.exp(-TAU * (f ? fc(0) : fc) / SR); for(let i = 0; i < x.length; i++){ if(f && (i & 63) === 0) a = 1 - Math.exp(-TAU * fc(i) / SR); v += a * (x[i] - v); y[i] = v; } return y; }
function hp(x, fc){ const l = lp(x, fc), y = buf(x.length); for(let i = 0; i < x.length; i++) y[i] = x[i] - l[i]; return y; }
// resonant band-pass (biquad), centre may vary over time
function bp(x, fc, q = 1){ const y = buf(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0, b2, a1, a2; const f = typeof fc === 'function';
  const set = c => { const w = TAU * Math.min(c, SR * 0.45) / SR, al = Math.sin(w) / (2 * q), a0 = 1 + al; b0 = al / a0; b2 = -al / a0; a1 = -2 * Math.cos(w) / a0; a2 = (1 - al) / a0; };
  set(f ? fc(0) : fc);
  for(let i = 0; i < x.length; i++){ if(f && (i & 63) === 0) set(fc(i)); const v = b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; } return y; }
// smooth random curve 0..1 changing about every `period` seconds
function wander(n, period, r){ const step = Math.max(1, Math.floor(period * SR)), pts = []; for(let i = 0; i <= n / step + 2; i++) pts.push(r());
  return i => { const p = i / step, k = Math.floor(p), t = p - k, s = t * t * (3 - 2 * t); return pts[k] * (1 - s) + pts[k + 1] * s; }; }
function addTo(L, R, x, at, gain, pan){ const o = Math.floor(at * SR), gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for(let i = 0; i < x.length; i++){ const j = o + i; if(j < 0) continue; if(j >= L.length) break; L[j] += x[i] * gl; R[j] += x[i] * gr; } }
function bed(L, R, x, gain, width = 0.6, r){ // stereo bed from a mono noise and a slightly delayed copy
  const d = Math.floor(0.011 * SR); for(let i = 0; i < L.length; i++){ L[i] += x[i] * gain; R[i] += (x[i - d] || 0) * gain * (1 - width * 0.3) + x[i] * gain * width * 0.3; } }
function env(n, a, d){ const e = buf(n), na = Math.max(1, Math.floor(a * SR)); for(let i = 0; i < n; i++) e[i] = i < na ? i / na : Math.exp(-(i - na) / (d * SR)); return e; }
function tone(dur, f, o = {}){ // sine or richer tone with pitch function, amplitude envelope
  const n = Math.floor(dur * SR), x = buf(n); let ph = 0; const a = o.a ?? 0.01, rel = o.rel ?? 0.05, h = o.harm || [1];
  for(let i = 0; i < n; i++){ const t = i / SR, fr = typeof f === 'function' ? f(t / dur, t) : f; ph += TAU * fr / SR;
    let s = 0; for(let k = 0; k < h.length; k++) s += h[k] * Math.sin(ph * (k + 1));
    const e = Math.min(1, t / a) * Math.min(1, (dur - t) / rel); x[i] = s * e * (o.amp ?? 1); } return x; }
const bell = (f, dec = 2.5) => { if(window.VG_SYNTH){ try{ return window.VG_SYNTH.stroke('bell:small', {f, seed:Math.round(f) % 5 + 1}); }catch(e){} }
  return tone(dec, f, {harm:[1, 0, 0.5, 0, 0.3], a:0.002, rel:dec * 0.9}); };

// ---------------------------------------------------------------- sound pieces
function rainLayer(L, R, n, r, heavy){
  // hiss bed
  bed(L, R, lp(hp(pink(n, r), heavy ? 400 : 900), heavy ? 7000 : 9000), heavy ? 0.55 : 0.22, 0.8);
  bed(L, R, lp(brown(n, r), 350), heavy ? 0.35 : 0.1);
  // drops: short bright clicks
  const drops = Math.floor(n / SR * (heavy ? 260 : 70));
  for(let k = 0; k < drops; k++){ const len = Math.floor((0.004 + r() * 0.02) * SR), f = 1800 + r() * 6000;
    const x = bp(white(len, r), f, 3 + r() * 5), e = env(len, 0.0008, 0.004 + r() * 0.01); for(let i = 0; i < len; i++) x[i] *= e[i];
    addTo(L, R, x, r() * n / SR, (heavy ? 0.5 : 0.7) * (0.3 + r()), r() * 1.8 - 0.9); }
}
function thunderHit(L, R, at, r, near = 0.6){
  const dur = 5 + r() * 4, n = Math.floor(dur * SR), x = lp(brown(n, r), i => 90 + 500 * Math.exp(-i / SR / (0.3 + near)));
  const crack = near > 0.7 ? hp(white(Math.floor(0.25 * SR), r), 1200) : null;
  const e = buf(n), rate = 2 + r() * 3; for(let i = 0; i < n; i++){ const t = i / SR; // rumbling: several swells
    e[i] = Math.exp(-t / (1.2 + near * 1.5)) * (0.6 + 0.4 * Math.sin(t * rate) ** 2) * Math.min(1, t / 0.05); }
  for(let i = 0; i < n; i++) x[i] *= e[i] * 1.8;
  addTo(L, R, x, at, near, r() - 0.5); if(crack){ const ce = env(crack.length, 0.002, 0.06); for(let i = 0; i < crack.length; i++) crack[i] *= ce[i]; addTo(L, R, crack, at, 0.5, 0); }
}
function windLayer(L, R, n, r, amt = 1){
  const g = wander(n, 3.5, r), c = wander(n, 2.5, r), x = bp(pink(n, r), i => 250 + 650 * c(i), 0.9);
  for(let i = 0; i < n; i++){ const v = g(i); x[i] *= (0.25 + 0.75 * v * v) * 2.2 * amt; }
  const y = bp(pink(n, r), i => 900 + 1400 * g(i), 2.5); for(let i = 0; i < n; i++) y[i] *= g(i) ** 3 * 0.6 * amt;   // whistle in gusts
  bed(L, R, x, 0.7, 1); bed(L, R, y, 0.4, 1);
}
function chirp(dur, f0, f1, o = {}){ const fm = o.fm || 0, fmr = o.fmr || 40;
  return tone(dur, (p, t) => (f0 * Math.pow(f1 / f0, o.curve ? Math.pow(p, o.curve) : p)) * (1 + fm * Math.sin(TAU * fmr * t)), {a:Math.min(0.006, dur / 4), rel:Math.min(0.02, dur / 3), harm:o.harm || [1, 0.12]}); }
function birdCall(r){ // returns [samples] for one call of a random species
  const kind = Math.floor(r() * 5), parts = []; let t = 0;
  if(kind === 0){ const n = 3 + Math.floor(r() * 6), f = 3500 + r() * 2500; for(let i = 0; i < n; i++){ parts.push([t, chirp(0.05 + r() * 0.03, f * 0.8, f * 1.25, {curve:0.6})]); t += 0.08 + r() * 0.05; } }   // sparrow chips
  else if(kind === 1){ const n = 12 + Math.floor(r() * 14), f = 3000 + r() * 1500; for(let i = 0; i < n; i++){ parts.push([t, chirp(0.025, f * (i % 2 ? 1.2 : 1), f * (i % 2 ? 1.1 : 1.15))]); t += 0.032; } }   // warbler trill
  else if(kind === 2){ const f = 1500 + r() * 1200; parts.push([0, chirp(0.18, f, f * 1.35, {fm:0.02, fmr:30})]); parts.push([0.24, chirp(0.22, f * 1.3, f * 0.9, {fm:0.02, fmr:30})]); if(r() < 0.6) parts.push([0.52, chirp(0.15, f * 1.1, f * 1.5)]); }   // bulbul whistle
  else if(kind === 3){ const f = 4500 + r() * 2000; for(let i = 0; i < 3; i++){ parts.push([t, chirp(0.12, f * 1.1, f * 0.7, {curve:1.6})]); t += 0.18; } }   // descending tweets
  else { const f = 2200 + r() * 800; parts.push([0, chirp(0.4, f, f * 1.1, {fm:0.08, fmr:22})]); }   // tremolo whistle
  const len = Math.max(...parts.map(([a, x]) => a * SR + x.length)), out = buf(Math.ceil(len)); for(const [a, x] of parts){ const o = Math.floor(a * SR); for(let i = 0; i < x.length; i++) out[o + i] += x[i]; }
  return out; }
function koel(r, step = 0){ const f = 700 + step * 70, out = []; for(let k = 0; k < 2; k++) out.push(chirp(0.28, f * (k ? 1.25 : 1), f * (k ? 1.3 : 1.15), {fm:0.01, fmr:6, harm:[1, 0.25, 0.08]}));
  const x = buf(Math.ceil(0.7 * SR)); out.forEach((c, k) => { const o = Math.floor(k * 0.33 * SR); for(let i = 0; i < c.length; i++) x[o + i] += c[i]; }); return x; }
function birds(L, R, n, r, rate, amp){ const secs = n / SR; let t = r() * 1.5;
  while(t < secs){ const c = birdCall(r), pan = r() * 1.6 - 0.8, far = 0.3 + r() * 0.7; addTo(L, R, far < 0.5 ? lp(c, 3000) : c, t, amp * far, pan);
    if(r() < 0.35) addTo(L, R, c, t + 0.9 + r() * 0.5, amp * far * 0.8, pan); t += (0.6 + r() * 2.6) / rate; } }
function crickets(L, R, n, r){ for(let c = 0; c < 4; c++){ const f = 3800 + r() * 1500, per = 0.45 + r() * 0.5, pan = r() * 1.6 - 0.8, amp = 0.05 + r() * 0.06;
  const pulse = tone(0.018, f, {a:0.002, rel:0.006, harm:[1, 0, 0.15]}); for(let t = r(); t < n / SR; t += per * (0.95 + r() * 0.1)) for(let k = 0; k < 3; k++) addTo(L, R, pulse, t + k * 0.03, amp, pan); } }
function frog(r){ const dur = 0.25 + r() * 0.2, f0 = 180 + r() * 220, n = Math.floor(dur * SR), x = buf(n), pr = 22 + r() * 12;
  for(let i = 0; i < n; i++){ const t = i / SR, p = (t * pr) % 1; x[i] = Math.sin(TAU * f0 * t) * Math.exp(-p * 6) * Math.sin(Math.PI * t / dur); } return bp(x, f0 * 2, 2); }
function owl(){ const hoo = d => tone(d, p => 380 - 40 * p, {a:0.06, rel:0.12, harm:[1, 0.15]}); const x = buf(Math.ceil(1.6 * SR)); [[0, 0.35], [0.55, 0.2], [0.85, 0.5]].forEach(([a, d]) => { const h = hoo(d), o = Math.floor(a * SR); for(let i = 0; i < h.length; i++) x[o + i] += h[i]; }); return lp(x, 1200); }
function rooster(){ // cartoon-ish "kokkoroko": pitch contour through a reedy tone and a vowel-like band-pass
  const segs = [[0.18, 520, 700], [0.14, 700, 760], [0.2, 760, 880], [0.75, 880, 620]], parts = []; let t = 0;
  for(const [d, a, b] of segs){ parts.push([t, tone(d, (p) => a + (b - a) * p + 15 * Math.sin(p * 40), {harm:[1, 0.7, 0.5, 0.35, 0.25, 0.15], a:0.015, rel:0.05})]); t += d + 0.03; }
  const x = buf(Math.ceil((t + 0.1) * SR)); for(const [a, y] of parts){ const o = Math.floor(a * SR); for(let i = 0; i < y.length; i++) x[o + i] += y[i]; }
  return bp(x, 1600, 0.8); }
function moo(r){ const dur = 1.4 + r() * 0.6, n = Math.floor(dur * SR), x = buf(n); let ph = 0;
  for(let i = 0; i < n; i++){ const p = i / n, f = 110 + 45 * Math.sin(Math.PI * Math.min(1, p * 1.4)) - 20 * p + 2 * Math.sin(i / SR * 30); ph += f / SR; const saw = 2 * (ph % 1) - 1; x[i] = saw * Math.min(1, p * 8) * Math.min(1, (1 - p) * 4); }
  const v = bp(x, i => 400 + 500 * Math.min(1, i / n * 2), 2), m = bp(x, 900, 3); for(let i = 0; i < n; i++) v[i] = v[i] * 0.8 + m[i] * 0.3 + x[i] * 0.05; return lp(v, 2500); }
function horn(r){ const f = 380 + r() * 200, dur = 0.15 + r() * 0.45, n = Math.floor(dur * SR), x = buf(n);
  for(let i = 0; i < n; i++){ const t = i / SR, sq = Math.sign(Math.sin(TAU * f * t)) + 0.6 * Math.sign(Math.sin(TAU * f * 1.26 * t)); x[i] = sq * Math.min(1, t / 0.01) * Math.min(1, (dur - t) / 0.02); } return lp(bp(x, 1200, 0.7), 4000); }
function carPass(n0, r){ const dur = 3 + r() * 3, n = Math.floor(dur * SR), x = lp(pink(n, r), 1400), y = lp(brown(n, r), 300);
  for(let i = 0; i < n; i++){ const p = i / n, g = Math.exp(-Math.pow((p - 0.5) * 4.5, 2)); x[i] = (x[i] * 0.8 + y[i]) * g; } return x; }
function babble(n, r, voices, lvl){ const out = buf(n);
  for(let v = 0; v < voices; v++){ const f1 = 450 + r() * 400, f2 = 1300 + r() * 900, a = wander(n, 0.18 + r() * 0.1, r), on = wander(n, 2.5 + r() * 3, r);
    const s = pink(n, r), x1 = bp(s, i => f1 * (0.8 + 0.4 * a(i)), 4), x2 = bp(s, i => f2 * (0.85 + 0.3 * a(i + 999)), 5);
    for(let i = 0; i < n; i++){ const syl = Math.max(0, a(i) - 0.35) * 2, talk = on(i) > 0.4 ? 1 : 0.15; out[i] += (x1[i] + x2[i] * 0.6) * syl * talk * lvl; } }
  return out; }
function fireLayer(L, R, n, r){
  const fl = wander(n, 0.25, r), roar = lp(brown(n, r), 220); for(let i = 0; i < n; i++) roar[i] *= 0.6 + 0.6 * fl(i); bed(L, R, roar, 0.9);
  const hiss = lp(hp(white(n, r), 2500), 7000); for(let i = 0; i < n; i++) hiss[i] *= 0.03 + 0.05 * fl(i); bed(L, R, hiss, 1, 1);
  const cr = Math.floor(n / SR * 9); for(let k = 0; k < cr; k++){ const len = Math.floor((0.002 + r() * 0.012) * SR), x = hp(white(len, r), 800 + r() * 3000), e = env(len, 0.0003, 0.003 + r() * 0.006);
    for(let i = 0; i < len; i++) x[i] *= e[i]; const at = r() * n / SR, g = r() < 0.12 ? 1 : 0.25 + r() * 0.4; addTo(L, R, x, at, g, r() * 1.2 - 0.6);
    if(r() < 0.3) for(let j = 1; j < 3 + r() * 5; j++) addTo(L, R, x, at + j * (0.01 + r() * 0.03), g * 0.4, r() * 1.2 - 0.6); } }
function drop(r){ const f = 900 + r() * 2200, d = 0.12; return tone(d, p => f * (1 + 1.4 * p), {a:0.001, rel:0.09, harm:[1, 0.2]}); }

// ---------------------------------------------------------------- recipes
const RECIPES = {
  rain_light:(L, R, n, r) => { rainLayer(L, R, n, r, false); },
  rain_heavy:(L, R, n, r) => { rainLayer(L, R, n, r, true); windLayer(L, R, n, r, 0.3); },
  storm:(L, R, n, r) => { rainLayer(L, R, n, r, true); windLayer(L, R, n, r, 0.8); for(let t = 1 + r() * 3; t < n / SR - 1; t += 7 + r() * 9) thunderHit(L, R, t, r, 0.4 + r() * 0.6); },
  thunder:(L, R, n, r) => { bed(L, R, lp(brown(n, r), 120), 0.15); for(let t = 0.5 + r() * 2; t < n / SR - 1; t += 6 + r() * 8) thunderHit(L, R, t, r, 0.35 + r() * 0.3); },
  wind:(L, R, n, r) => { windLayer(L, R, n, r, 1); },
  river:(L, R, n, r) => { const g = wander(n, 0.07, r), x = bp(pink(n, r), i => 600 + 900 * g(i), 1.2); bed(L, R, x, 1.1, 1); bed(L, R, lp(brown(n, r), 400), 0.25);
    const bubbles = Math.floor(n / SR * 30); for(let k = 0; k < bubbles; k++){ const f = 350 + r() * 1100, d = 0.015 + r() * 0.04; addTo(L, R, tone(d, p => f * (1 + 1.2 * p), {a:0.002, rel:d * 0.6}), r() * n / SR, 0.08 + r() * 0.12, r() * 1.4 - 0.7); } },
  sea:(L, R, n, r) => { const secs = n / SR, wave = buf(n), bright = buf(n); let t = 0;
    while(t < secs){ const per = 6 + r() * 4, a = 0.6 + r() * 0.5; for(let i = Math.floor(t * SR); i < Math.min(n, (t + per + 3) * SR); i++){ const u = (i / SR - t) / per;
        const e = u < 0.45 ? Math.pow(u / 0.45, 2) : Math.exp(-(u - 0.45) * 3.2); wave[i] += e * a; bright[i] += (u > 0.4 && u < 0.75 ? Math.exp(-(u - 0.42) * 9) : 0) * a; } t += per; }
    const lo = lp(pink(n, r), i => 300 + 1600 * Math.min(1, bright[i])), hi = hp(white(n, r), 2500), body = lp(brown(n, r), 180);
    for(let i = 0; i < n; i++){ lo[i] *= wave[i] * 1.3; hi[i] *= bright[i] * 0.12; body[i] *= 0.3 + wave[i] * 0.6; } bed(L, R, lo, 1, 1); bed(L, R, hi, 1, 1); bed(L, R, body, 0.6); },
  waterfall:(L, R, n, r) => { const g = wander(n, 0.4, r), x = lp(pink(n, r), 3500); for(let i = 0; i < n; i++) x[i] *= 0.9 + 0.2 * g(i); bed(L, R, x, 1.3, 1); bed(L, R, lp(brown(n, r), 200), 0.6); bed(L, R, hp(white(n, r), 4000), 0.04, 1); },
  forest:(L, R, n, r) => { windLayer(L, R, n, r, 0.25); const lv = lp(hp(pink(n, r), 2000), 6000), g = wander(n, 3, r); for(let i = 0; i < n; i++) lv[i] *= 0.08 * g(i); bed(L, R, lv, 1, 1); birds(L, R, n, r, 1, 0.35); },
  morning:(L, R, n, r) => { bed(L, R, lp(pink(n, r), 500), 0.05); birds(L, R, n, r, 1.8, 0.35); let step = 0; for(let t = 2 + r() * 3; t < n / SR - 1; t += 2.2 + r() * 1.5){ addTo(L, R, koel(r, step), t, 0.3, 0.5); step = (step + 1) % 5; if(step === 0) t += 6; } },
  village:(L, R, n, r) => { bed(L, R, lp(pink(n, r), 600), 0.05); birds(L, R, n, r, 1, 0.25); addTo(L, R, rooster(), 0.8 + r(), 0.35, -0.4);
    for(let t = 6 + r() * 4; t < n / SR - 2; t += 12 + r() * 10) addTo(L, R, r() < 0.5 ? moo(r) : rooster(), t, r() < 0.5 ? 0.35 : 0.25, r() * 1.4 - 0.7);
    for(let t = 2 + r() * 2; t < n / SR - 1; t += 1.6 + r() * 3) addTo(L, R, bell(560 + r() * 160), t, 0.12, 0.6 - r() * 0.3); },
  night:(L, R, n, r) => { bed(L, R, lp(brown(n, r), 200), 0.12); crickets(L, R, n, r); for(let t = 1 + r() * 2; t < n / SR - 1; t += 0.8 + r() * 2.5){ const f = frog(r), pan = r() * 1.6 - 0.8; addTo(L, R, f, t, 0.18, pan); if(r() < 0.5) addTo(L, R, f, t + 0.45, 0.14, pan); }
    for(let t = 5 + r() * 5; t < n / SR - 2; t += 14 + r() * 10) addTo(L, R, owl(), t, 0.25, -0.5); },
  fire:(L, R, n, r) => { fireLayer(L, R, n, r); },
  city:(L, R, n, r) => { bed(L, R, lp(brown(n, r), 160), 0.7); bed(L, R, lp(pink(n, r), 900), 0.12);
    for(let t = r() * 2; t < n / SR; t += 1 + r() * 3) addTo(L, R, carPass(0, r), t, 0.35 + r() * 0.4, r() * 1.6 - 0.8);
    for(let t = 0.5 + r() * 2; t < n / SR; t += 1.2 + r() * 4){ const h = horn(r), pan = r() * 1.6 - 0.8, g = 0.06 + r() * 0.12; addTo(L, R, h, t, g, pan); if(r() < 0.4) addTo(L, R, h, t + 0.25, g, pan); }
    bed(L, R, babble(n, r, 4, 0.12), 0.5, 1); },
  crowd:(L, R, n, r) => { const b = babble(n, r, 14, 0.25); bed(L, R, b, 1, 1); bed(L, R, lp(pink(n, r), 500), 0.08); },
  temple:(L, R, n, r) => { bed(L, R, babble(n, r, 8, 0.12), 1, 1); bed(L, R, lp(pink(n, r), 400), 0.06);
    for(let t = 1 + r() * 2; t < n / SR - 1; t += 3 + r() * 6){ const big = r() < 0.4; addTo(L, R, big ? (window.VG_SYNTH ? window.VG_SYNTH.stroke('bell:temple', {f:520, seed:1}) : bell(520, 5)) : bell(900 + r() * 500), t, big ? 0.35 : 0.15, r() * 1.2 - 0.6);
      if(big) for(let k = 1; k < 4; k++) addTo(L, R, window.VG_SYNTH ? window.VG_SYNTH.stroke('bell:temple', {f:520, seed:1 + k}) : bell(520, 5), t + k * 0.55, 0.28, 0.1); } },
  cave:(L, R, n, r) => { windLayer(L, R, n, r, 0.18); bed(L, R, lp(brown(n, r), 90), 0.25); for(let t = r(); t < n / SR - 0.5; t += 0.5 + r() * 2.2) addTo(L, R, drop(r), t, 0.12 + r() * 0.15, r() * 1.4 - 0.7); },
  cosmic:(L, R, n, r) => { const g = wander(n, 6, r); for(const [f, a] of [[55, 0.5], [82.4, 0.25], [110, 0.3], [110.6, 0.25], [164.8, 0.12], [220.3, 0.08]]){ let ph = r() * TAU;
      for(let i = 0; i < n; i++){ ph += TAU * f / SR; const v = Math.sin(ph) * a * (0.6 + 0.4 * g(i + f * 999)); L[i] += v * 0.3; R[i] += Math.sin(ph + 0.4) * a * 0.3 * (0.6 + 0.4 * g(i + f * 333)); } }
    const sh = bp(pink(n, r), i => 1500 + 2500 * g(i), 6); for(let i = 0; i < n; i++) sh[i] *= 0.15; bed(L, R, sh, 1, 1); },
};
const VERB = {cave:[3.5, 0.5], temple:[2.2, 0.3], forest:[1.2, 0.15], morning:[1.2, 0.15], village:[1.5, 0.2], night:[1.5, 0.2], cosmic:[4, 0.4], thunder:[2.5, 0.25], storm:[1.5, 0.12]};

const cache = {};
async function render(id, seconds){
  const secs = Math.max(2, Math.min(600, seconds || 20)), key = id + '|' + secs.toFixed(1); if(cache[key]) return cache[key];
  const n = Math.ceil(secs * SR), L = buf(n), R = buf(n), r = rng(1234 + id.length * 77 + id.charCodeAt(0));
  (RECIPES[id] || RECIPES.wind)(L, R, n, r);
  const ctx = new OfflineAudioContext(2, n, SR), b = ctx.createBuffer(2, n, SR); b.copyToChannel(L, 0); b.copyToChannel(R, 1);
  const src = ctx.createBufferSource(); src.buffer = b; src.connect(ctx.destination);
  const v = VERB[id]; if(v){ const conv = ctx.createConvolver(), ir = ctx.createBuffer(2, Math.floor(v[0] * SR), SR), rr = rng(99);
    for(let c = 0; c < 2; c++){ const d = ir.getChannelData(c); for(let i = 0; i < d.length; i++) d[i] = (rr() * 2 - 1) * Math.pow(1 - i / d.length, 3); }
    conv.buffer = ir; const wet = ctx.createGain(); wet.gain.value = v[1]; src.connect(conv); conv.connect(wet); wet.connect(ctx.destination); }
  src.start(); const out = await ctx.startRendering();
  // same loudness for every sound, soft fade in and out so it can start and stop anywhere
  let pk = 0, sum = 0; for(let c = 0; c < 2; c++){ const d = out.getChannelData(c); for(let i = 0; i < d.length; i++){ const a = Math.abs(d[i]); if(a > pk) pk = a; sum += d[i] * d[i]; } }
  const rms = Math.sqrt(sum / (2 * n)) || 1e-6, g = Math.min(0.8 / (pk || 1), 0.16 / rms), fi = Math.floor(Math.min(1.5, secs / 6) * SR);
  for(let c = 0; c < 2; c++){ const d = out.getChannelData(c); for(let i = 0; i < n; i++){ let k = g; if(i < fi) k *= i / fi; if(i > n - fi) k *= (n - i) / fi; d[i] *= k; } }
  return cache[key] = out;
}
window.VG_AMB = {LIST, render};
})();
