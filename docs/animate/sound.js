/* ==========================================================================
   VideoGen Animator – built-in music and sound effects.
   Everything is synthesised with the Web Audio API from oscillators and
   noise: no recordings, no samples, no AI. Royalty free, made on your device.
   window.VG_SOUND.render(id, seconds) -> Promise<AudioBuffer>
   ========================================================================== */
(function(){
const SR = 44100;
const MUSIC = [
  {id:'flute',    name:'Calm flute (spiritual)', icon:'🪈'},
  {id:'drone',    name:'Tanpura drone (meditation)', icon:'🕉️'},
  {id:'happy',    name:'Happy (kids, greetings)', icon:'😊'},
  {id:'corporate',name:'Corporate (business, insurance)', icon:'💼'},
  {id:'epic',     name:'Epic war drums', icon:'⚔️'},
  {id:'festival', name:'Festival dhol & shehnai', icon:'🎉'},
];
const SFX = [
  {id:'whoosh', name:'Whoosh', len:0.9}, {id:'pop', name:'Pop', len:0.3}, {id:'ding', name:'Ding', len:1.6},
  {id:'bell', name:'Temple bell', len:4.5}, {id:'conch', name:'Conch (shankha)', len:3.2}, {id:'drum', name:'Drum hit', len:1.2},
  {id:'sword', name:'Sword clash', len:1.0}, {id:'explosion', name:'Explosion', len:2.6}, {id:'gallop', name:'Horse gallop', len:2.4},
  {id:'applause', name:'Applause', len:3.2}, {id:'birds', name:'Birds chirping', len:3.0}, {id:'sparkle', name:'Magic sparkle', len:1.4},
  {id:'bonk', name:'Cartoon bonk', len:0.6}, {id:'boing', name:'Cartoon boing', len:0.9}, {id:'slide', name:'Slide whistle', len:1.1},
];

// ---------------------------------------------------------------- building blocks
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const hz = (base, semis) => base * Math.pow(2, semis / 12);
function noiseBuf(ctx, sec){ const b = ctx.createBuffer(1, Math.ceil(sec * ctx.sampleRate), ctx.sampleRate), d = b.getChannelData(0); const r = rng(9); for(let i = 0; i < d.length; i++) d[i] = r() * 2 - 1; return b; }
function env(g, t, a, peak, d, sustain = 0){ g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain || 0.0001), t + a + d); }
function tone(ctx, out, o){   // {t, f, d, type, gain, a, r, vib, f2, lp, pan}
  const osc = ctx.createOscillator(), g = ctx.createGain(); osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.f, o.t); if(o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, o.t + (o.glide || o.d));
  let node = osc;
  if(o.lp){ const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || 0.7; node.connect(f); node = f; }
  if(o.vib){ const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vibRate || 5.2; lg.gain.setValueAtTime(0, o.t); lg.gain.linearRampToValueAtTime(o.f * o.vib, o.t + 0.35); l.connect(lg); lg.connect(osc.frequency); l.start(o.t); l.stop(o.t + o.d + (o.r || 0.3)); }
  const a = o.a ?? 0.01, r = o.r ?? 0.3, peak = o.gain ?? 0.2;
  g.gain.setValueAtTime(0.0001, o.t); g.gain.linearRampToValueAtTime(peak, o.t + a);
  if(o.hold){ g.gain.setValueAtTime(peak, o.t + Math.max(a, o.d)); g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.d + r); }
  else g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.d + r);
  node.connect(g); let last = g;
  if(o.pan != null && ctx.createStereoPanner){ const p = ctx.createStereoPanner(); p.pan.value = o.pan; g.connect(p); last = p; }
  last.connect(out); osc.start(o.t); osc.stop(o.t + o.d + r + 0.05);
}
function noise(ctx, out, o){  // {t, d, gain, type:'bandpass'|'highpass'|'lowpass', f, f2, q, a}
  const s = ctx.createBufferSource(); s.buffer = ctx._noise || (ctx._noise = noiseBuf(ctx, 3)); s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, o.t); if(o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, o.t + o.d); f.Q.value = o.q || 1;
  const g = ctx.createGain(); const a = o.a ?? 0.005; g.gain.setValueAtTime(0.0001, o.t); g.gain.linearRampToValueAtTime(o.gain ?? 0.2, o.t + a); g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.d);
  s.connect(f); f.connect(g); g.connect(out); s.start(o.t, (o.t * 7.3) % 2); s.stop(o.t + o.d + 0.05);
}
const kick = (ctx, out, t, g = 0.7) => tone(ctx, out, {t, f:150, f2:45, glide:0.12, d:0.25, r:0.1, gain:g});
const hat = (ctx, out, t, g = 0.06) => noise(ctx, out, {t, d:0.05, gain:g, type:'highpass', f:7000});
const clap = (ctx, out, t, g = 0.15) => noise(ctx, out, {t, d:0.15, gain:g, type:'bandpass', f:1500, q:0.8});
function tanpura(ctx, out, L, base, gain = 0.05){
  const pat = [base * 1.5, base * 2, base * 2, base]; for(let t = 0, k = 0; t < L; t += 0.9, k++){
    const f = pat[k % 4]; tone(ctx, out, {t, f, d:2.4, r:0.6, type:'sawtooth', lp:1400, gain, a:0.01, pan:k % 2 ? 0.25 : -0.25}); }
}
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];

// ---------------------------------------------------------------- music
const GEN = {
  flute(ctx, out, L){ const base = 146.83, r = rng(5); tanpura(ctx, out, L, base / 2, 0.045);
    tone(ctx, out, {t:0, f:base / 2, d:L, a:2, r:2, hold:true, gain:0.05});
    let t = 1.6, idx = 3; while(t < L - 1.5){ const n = 5 + Math.floor(r() * 5);
      for(let i = 0; i < n && t < L - 1; i++){ idx = Math.max(0, Math.min(PENTA.length - 1, idx + [-2, -1, -1, 1, 1, 2, 0][Math.floor(r() * 7)]));
        const d = [0.31, 0.31, 0.62, 0.62, 0.93][Math.floor(r() * 5)], f = hz(base * 2, PENTA[idx]);
        tone(ctx, out, {t, f, d, a:0.06, r:0.25, hold:true, gain:0.11, vib:0.006});
        tone(ctx, out, {t, f:f * 2, d, a:0.06, r:0.2, hold:true, gain:0.02});
        noise(ctx, out, {t, d:d + 0.1, gain:0.012, f:f * 2, q:4, a:0.05}); t += d; }
      idx = [0, 2, 3][Math.floor(r() * 3)]; t += 0.62 * (1 + Math.floor(r() * 3)); } },
  drone(ctx, out, L){ const base = 130.81; tanpura(ctx, out, L, base / 2, 0.06);
    tone(ctx, out, {t:0, f:base / 2, d:L, a:3, r:3, hold:true, gain:0.07}); tone(ctx, out, {t:0, f:base * 0.75, d:L, a:4, r:3, hold:true, gain:0.035}); },
  happy(ctx, out, L){ const b = 0.5, C = 261.63, prog = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]];
    for(let t = 0, beat = 0; t < L; t += b / 2, beat++){ const bar = Math.floor(beat / 8) % 4, ch = prog[bar];
      if(beat % 2 === 0) kick(ctx, out, t, beat % 4 === 0 ? 0.6 : 0.45); else hat(ctx, out, t);
      if(beat % 4 === 2) clap(ctx, out, t, 0.08);
      tone(ctx, out, {t, f:hz(C, ch[beat % 3] + 12), d:0.12, r:0.25, type:'triangle', gain:0.07, pan:beat % 2 ? 0.3 : -0.3});
      if(beat % 8 === 0) tone(ctx, out, {t, f:hz(C / 4, ch[0]), d:b * 3.5, r:0.2, type:'sine', gain:0.18, hold:true}); } },
  corporate(ctx, out, L){ const bar = 2.4, A = 220, prog = [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]];
    for(let t = 0, k = 0; t < L; t += bar, k++){ const ch = prog[k % 4];
      ch.forEach(s => tone(ctx, out, {t, f:hz(A, s), d:bar, a:0.5, r:1.0, hold:true, type:'sawtooth', lp:900, gain:0.025}));
      tone(ctx, out, {t, f:hz(A / 2, ch[0]), d:bar, a:0.05, r:0.3, hold:true, gain:0.1});
      for(let i = 0; i < 8; i++){ const tt = t + i * bar / 8; tone(ctx, out, {t:tt, f:hz(A * 2, ch[[0, 2, 1, 3, 2, 1, 3, 2][i]]), d:0.1, r:0.5, type:'triangle', gain:0.045, pan:(i % 3 - 1) * 0.3});
        if(i % 2 === 1) hat(ctx, out, tt, 0.035); if(i === 0) kick(ctx, out, tt, 0.4); if(i === 4) clap(ctx, out, tt, 0.07); } } },
  epic(ctx, out, L){ const b = 0.75, D = 73.42;
    tone(ctx, out, {t:0, f:D, d:L, a:2, r:2, hold:true, type:'sawtooth', lp:420, gain:0.07}); tone(ctx, out, {t:0, f:D * 1.5, d:L, a:3, r:2, hold:true, type:'sawtooth', lp:500, gain:0.035});
    for(let t = 0, k = 0; t < L; t += b / 2, k++){ const p = k % 16;
      if([0, 3, 6, 8, 11, 12, 13, 14].includes(p)) tone(ctx, out, {t, f:p >= 12 ? 110 : 80, f2:40, glide:0.3, d:0.4, r:0.2, gain:p === 0 ? 0.8 : 0.5});
      if(p === 0 || p === 8) noise(ctx, out, {t, d:0.35, gain:0.12, type:'lowpass', f:900});
      if(k % 32 === 0) [0, 3, 7].forEach(s => tone(ctx, out, {t, f:hz(D * 2, s), d:b * 2, a:0.04, r:0.6, hold:true, type:'sawtooth', lp:1600, gain:0.05}));
      if(k % 32 === 24) noise(ctx, out, {t, d:b * 4, a:b * 3.8, gain:0.06, type:'highpass', f:5000}); } },
  festival(ctx, out, L){ const b = 0.46, base = 261.63, r = rng(3);
    const pat = 'X.xX.xx.'; for(let t = 0, k = 0; t < L; t += b / 2, k++){ const c = pat[k % 8];
      if(c === 'X') tone(ctx, out, {t, f:95, f2:50, glide:0.15, d:0.25, r:0.1, gain:0.6}); if(c === 'x') tone(ctx, out, {t, f:320, f2:190, glide:0.08, d:0.1, r:0.08, gain:0.3}); if(k % 2) hat(ctx, out, t, 0.03); }
    tone(ctx, out, {t:0, f:base / 2, d:L, a:1, r:1, hold:true, type:'sawtooth', lp:600, gain:0.03});
    let t = 0.9, idx = 4; const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19];
    while(t < L - 1){ for(let i = 0; i < 6 && t < L - 0.6; i++){ idx = Math.max(0, Math.min(scale.length - 1, idx + [-1, 1, 1, -2, 2, 0][Math.floor(r() * 6)]));
        const d = [0.23, 0.23, 0.46, 0.69][Math.floor(r() * 4)]; tone(ctx, out, {t, f:hz(base * 2, scale[idx]), d, a:0.03, r:0.15, hold:true, type:'square', lp:2600, gain:0.04, vib:0.008, vibRate:6}); t += d; }
      t += 0.46; } },
};
// ---------------------------------------------------------------- effects
const FX = {
  whoosh:(c, o) => noise(c, o, {t:0, d:0.85, a:0.35, gain:0.5, f:300, f2:3500, q:1.2}),
  pop:(c, o) => tone(c, o, {t:0, f:500, f2:1400, glide:0.06, d:0.06, r:0.12, gain:0.5}),
  ding:(c, o) => [1, 2.01, 3.03].forEach((m, i) => tone(c, o, {t:0, f:1320 * m, d:0.02, r:1.5 - i * 0.3, gain:0.25 / (i + 1)})),
  bell:(c, o) => [1, 2.76, 5.4, 8.93].forEach((m, i) => tone(c, o, {t:0, f:440 * m, d:0.02, r:4.2 - i * 0.6, gain:0.3 / (i + 1)})),
  conch:(c, o) => { tone(c, o, {t:0, f:233, d:2.6, a:0.7, r:0.5, hold:true, type:'sawtooth', lp:1500, gain:0.25, vib:0.01, vibRate:4.5}); tone(c, o, {t:0, f:466, d:2.6, a:0.9, r:0.5, hold:true, type:'sawtooth', lp:1800, gain:0.08}); },
  drum:(c, o) => { tone(c, o, {t:0, f:120, f2:45, glide:0.3, d:0.6, r:0.4, gain:0.9}); noise(c, o, {t:0, d:0.25, gain:0.15, type:'lowpass', f:800}); },
  sword:(c, o) => { noise(c, o, {t:0, d:0.25, gain:0.35, type:'highpass', f:2500}); [2200, 3310, 5120, 6890].forEach((f, i) => tone(c, o, {t:0, f, d:0.01, r:0.9 - i * 0.15, gain:0.1})); },
  explosion:(c, o) => { noise(c, o, {t:0, d:2.5, a:0.02, gain:0.9, type:'lowpass', f:1200, f2:120}); tone(c, o, {t:0, f:70, f2:28, glide:1, d:1, r:1, gain:0.8}); },
  gallop:(c, o) => { for(let i = 0; i < 6; i++) [0, 0.09, 0.17].forEach((d, j) => tone(c, o, {t:i * 0.4 + d, f:260 - j * 30, f2:120, glide:0.05, d:0.05, r:0.06, gain:0.35})); },
  applause:(c, o) => { const r = rng(4); for(let i = 0; i < 220; i++){ const t = r() * 2.9; noise(c, o, {t, d:0.03 + r() * 0.03, gain:0.05 + r() * 0.06, f:1200 + r() * 2500, q:1.5}); } },
  birds:(c, o) => { const r = rng(8); for(let i = 0; i < 9; i++){ const t = r() * 2.6, f = 2600 + r() * 1800; for(let k = 0; k < 2 + Math.floor(r() * 3); k++) tone(c, o, {t:t + k * 0.12, f, f2:f * (1.3 + r() * 0.5), glide:0.06, d:0.06, r:0.04, gain:0.08, pan:r() * 1.6 - 0.8}); } },
  sparkle:(c, o) => { const r = rng(2); for(let i = 0; i < 14; i++) tone(c, o, {t:i * 0.08, f:2000 + r() * 3500, d:0.02, r:0.4, gain:0.07, pan:r() * 1.6 - 0.8}); },
  bonk:(c, o) => { tone(c, o, {t:0, f:320, f2:85, glide:0.25, d:0.25, r:0.2, gain:0.7, type:'triangle'}); noise(c, o, {t:0, d:0.04, gain:0.3, type:'highpass', f:3000}); },
  boing:(c, o) => tone(c, o, {t:0, f:160, f2:420, glide:0.6, d:0.6, r:0.2, gain:0.4, vib:0.08, vibRate:14}),
  slide:(c, o) => tone(c, o, {t:0, f:380, f2:1700, glide:0.9, d:0.9, r:0.15, gain:0.3, vib:0.01, vibRate:7}),
};

const cache = {};
async function render(id, seconds){
  const fx = SFX.find(s => s.id === id), len = fx ? fx.len : Math.max(1, Math.min(600, seconds || 10));
  const key = id + '|' + len.toFixed(2); if(cache[key]) return cache[key];
  const ctx = new OfflineAudioContext(2, Math.ceil(len * SR), SR);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ctx.destination);
  const master = ctx.createGain(); master.gain.value = fx ? 0.9 : 0.8; master.connect(comp);
  if(fx) FX[id](ctx, master); else (GEN[id] || GEN.flute)(ctx, master, len);
  if(!fx){ master.gain.setValueAtTime(0.0001, 0); master.gain.linearRampToValueAtTime(0.8, 1.2); master.gain.setValueAtTime(0.8, Math.max(1.3, len - 2)); master.gain.linearRampToValueAtTime(0.0001, len); }
  const buf = await ctx.startRendering();
  // even out loudness: every sound reaches the same peak level
  let pk = 0; for(let c = 0; c < buf.numberOfChannels; c++){ const d = buf.getChannelData(c); for(let i = 0; i < d.length; i++){ const v = Math.abs(d[i]); if(v > pk) pk = v; } }
  const g = pk > 0 ? Math.min(8, (fx ? 0.85 : 0.75) / pk) : 1; for(let c = 0; c < buf.numberOfChannels; c++){ const d = buf.getChannelData(c); for(let i = 0; i < d.length; i++) d[i] *= g; }
  return cache[key] = buf;
}
window.VG_SOUND = {MUSIC, SFX, render};
})();
