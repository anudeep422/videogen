/* ==========================================================================
   VideoGen — One-tap video. No AI.
   You give a title and your lines (Telugu or English). The app builds the
   scenes (background, elements, characters, effects), puts every line on
   screen word by word, adds place sounds, and composes music in the Studio
   engine for the exact length of the video.
   window.VG_ONETAP = {STYLES, plan, build, music}
   ========================================================================== */
(function(){
// each style: backgrounds to rotate, decorations, characters, effects, place sound, music mood, colours
const STYLES = {
  upanishad:{name:'🕉️ Upanishad / spiritual', mood:'spiritual', amb:null,
    bgs:['Himalaya snow peaks', 'Cave (meditation)', 'Saffron glow', 'Green fields', 'River ghat', 'Space (cosmos)'],
    deco:[['Rishi meditating', 0.2, 0.74, 0.36], ['Om symbol', 0.5, 0.3, 0.26], ['Lotus', 0.82, 0.8, 0.2], ['Sun with rays', 0.5, 0.28, 0.4, 0.45], ['Holy scripture', 0.8, 0.76, 0.22], ['Diya lamp', 0.84, 0.78, 0.2]],
    chars:[['rishi', 'talk']], fx:['sparkles', 'petals'], box:'#FFF8E7', text:'#4A2C0A', title:'#7B241C', edge:'#E67E22'},
  devotional:{name:'🙏 Devotional / bhakti', mood:'devotional', amb:'temple',
    bgs:['Temple courtyard', 'Saffron glow', 'River ghat', 'Heaven (golden clouds)'],
    deco:[['Diya lamp', 0.15, 0.78, 0.22], ['Om symbol', 0.5, 0.28, 0.26], ['Kalasham', 0.85, 0.78, 0.24], ['Lotus', 0.15, 0.8, 0.2], ['Conch (shankha)', 0.85, 0.8, 0.18], ['Temple', 0.5, 0.42, 0.42]],
    chars:[['woman', 'namaste'], ['elder', 'namaste']], fx:['petals', 'sparkles'], sfx:'templebell', box:'#FFF3E0', text:'#5D2E0C', title:'#8E1B10', edge:'#D35400'},
  calm:{name:'🧘 Calm / meditation', mood:'meditation', amb:'forest',
    bgs:['Morning sky', 'Green fields', 'Waterfall', 'Sunset sea', 'Night sky'],
    deco:[['Lotus', 0.5, 0.8, 0.2], ['Moon', 0.82, 0.2, 0.16], ['Cloud (soft)', 0.2, 0.2, 0.14], ['Banyan tree', 0.15, 0.62, 0.5], ['Birds', 0.7, 0.22, 0.12]],
    chars:[], fx:['fireflies', 'leaves'], box:'#F4FBF8', text:'#1D4E46', title:'#155E52', edge:'#48A999'},
  kids:{name:'🧒 Kids', mood:'kids', amb:'morning',
    bgs:['Green fields', 'Beach (day)', 'Morning sky', 'Noon sky'],
    deco:[['Smiling sun (cartoon)', 0.85, 0.18, 0.22], ['Rainbow', 0.5, 0.3, 0.3], ['Kite', 0.2, 0.22, 0.18], ['Tree', 0.88, 0.62, 0.4], ['Birds', 0.3, 0.2, 0.1]],
    chars:[['boy', 'jump'], ['girl', 'clap']], fx:['balloons', 'confetti', 'bubbles'], sfx:'pop', box:'#FFFFFF', text:'#1A237E', title:'#C2185B', edge:'#FF9800'},
  story:{name:'📖 Story', mood:'cinematic', amb:'morning',
    bgs:['Green fields', 'Forest', 'River ghat', 'Home (living room)', 'Evening sky', 'City (day)'],
    deco:[['Village hut', 0.14, 0.62, 0.3], ['Banyan tree', 0.86, 0.6, 0.48], ['Cow', 0.82, 0.78, 0.18], ['Bullock cart', 0.82, 0.78, 0.2], ['House', 0.15, 0.6, 0.3]],
    chars:[['farmer', 'walk'], ['woman', 'talk'], ['boy', 'run'], ['elder', 'talk']], fx:['leaves', 'birds'], box:'#FFFFFF', text:'#1B2631', title:'#7E5109', edge:'#B9770E'},
  business:{name:'💼 Business / insurance', mood:'motivational', amb:null,
    bgs:['Office', 'Blue gradient', 'City (day)', 'Purple gradient'],
    deco:[['Shield (protection)', 0.84, 0.36, 0.26], ['Family protection', 0.82, 0.66, 0.3], ['Umbrella (protection)', 0.16, 0.62, 0.3], ['Smartphone', 0.86, 0.6, 0.26], ['Money', 0.15, 0.7, 0.16]],
    chars:[['advisor', 'point'], ['office', 'talk']], fx:['sparkles', 'coins'], sfx:'ding', box:'#FFFFFF', text:'#0B2545', title:'#1B4F72', edge:'#2E86C1'},
};
const SIZE = {'16:9':[1280, 720], '9:16':[1080, 1920], '1:1':[1080, 1080]};

// break a line into screen lines that fit the width (Telugu-aware: measured with the real font)
function wrap(text, size, maxW){
  const c = document.createElement('canvas').getContext('2d'), te = /[ఀ-౿]/.test(text);
  c.font = `700 ${size}px ${te ? '"Noto Sans Telugu"' : '"Noto Sans"'}, sans-serif`;
  const out = []; for(const para of String(text).split('\n')){ let cur = '';
    for(const w of para.split(/\s+/).filter(Boolean)){ const t = cur ? cur + ' ' + w : w; if(cur && c.measureText(t).width > maxW){ out.push(cur); cur = w; } else cur = t; }
    if(cur) out.push(cur); }
  return out;
}
// the text becomes captions: blank lines or full stops split it; very long sentences split on commas
function plan(text){
  const raw = String(text || '').replace(/\r/g, '').split(/\n\s*\n|\n|(?<=[.!?।॥])\s+/).map(s => s.trim()).filter(Boolean), out = [];
  for(const s of raw){ if(s.length <= 120){ out.push(s); continue; } let cur = ''; for(const part of s.split(/(?<=[,;:])\s+/)){ if(cur && (cur + ' ' + part).length > 110){ out.push(cur); cur = part; } else cur = cur ? cur + ' ' + part : part; } if(cur) out.push(cur); }
  // reading time: about 14 letters a second, never too short or too long
  return out.map(s => ({text:s, secs:Math.max(3, Math.min(9, 1.6 + [...s].length / 14))}));
}

// build the whole animation project
function build(o){
  const T = window.VG_TPL, st = STYLES[o.style] || STYLES.upanishad, ratio = SIZE[o.ratio] ? o.ratio : '16:9';
  const caps = plan(o.text), titleT = o.title ? 4 : 0, endT = o.end ? 4 : 0;
  let t = titleT; caps.forEach(c => { c.t0 = t; t += c.secs; c.t1 = t; });
  const dur = Math.max(5, +(t + endT).toFixed(2));
  const b = T.Builder(ratio, dur), W = b.W, H = b.H, tall = H > W, cuts = [];
  const rnd = (() => { let s = (o.seed || 1) * 7919 + 13; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const boxW = W * (tall ? 0.88 : 0.82), size0 = Math.round((tall ? 62 : 44) * (o.textScale || 1));
  // a caption box with word-by-word text; returns its objects
  const caption = (txt, t0, secs, y, size) => {
    let lines = wrap(txt, size, boxW - 60); while(lines.length > (tall ? 6 : 4) && size > 24){ size -= 4; lines = wrap(txt, size, boxW - 60); }
    const hh = lines.length * size * 1.3 + 50;
    const bx = b.box(W / 2, y, boxW, hh, st.box, {op:0.88, stroke:st.edge, lw:4, r:24, layer:2});
    const tx = b.text(lines.join('\n'), W / 2, y, size, st.text, {anim:'words', at:t0 + 0.3, dur:Math.min(secs * 0.6, 0.35 * txt.split(/\s+/).length + 0.6)});
    T.anim(bx, 'pop', t0, 0.5, W, H); return [bx, tx];
  };
  // decoration for a scene: 1–2 elements and maybe a character; placed away from the caption
  const decorate = (t0, t1, k) => {
    const list = [], d = st.deco.slice(); const n = 1 + (rnd() < 0.55 ? 1 : 0);
    for(let i = 0; i < n && d.length; i++){ const [name, rx, ry, rh, op] = d.splice(Math.floor(rnd() * d.length), 1)[0];
      try{ const e = b.el(name, W * rx, H * (tall ? 0.18 + ry * 0.4 : Math.min(ry, 0.5)), (tall ? W : H) * rh * (tall ? 1 : 0.85), {op}); T.anim(e, i ? 'up' : 'pop', t0 + 0.2 + i * 0.3, 0.8, W, H); if(/^Sun/.test(name)) T.anim(e, 'turn', t0, t1 - t0, W, H); list.push(e); }catch(err){} }
    if(st.chars.length && (k % 2 === 0 || rnd() < 0.4)){ const [pre, act] = pick(st.chars), left = rnd() < 0.5, x = W * (left ? 0.16 : 0.84), y = tall ? H * 0.62 : H * 0.6;
      const walk = act === 'walk' || act === 'run', ch = b.char(pre, x, y, tall ? 1.5 : 0.85, walk ? [[act, t0, t1]] : [['walk', t0, t0 + 1.2], [act, t0 + 1.2, t1]]);
      if(walk){ T.key(ch, 'x', t0, x, 'linear'); T.key(ch, 'x', t1, left ? x + W * 0.35 : x - W * 0.35); if(!left) ch.scaleX = -ch.scaleX; }
      else { T.key(ch, 'x', t0, left ? x - W * 0.15 : x + W * 0.15, 'out'); T.key(ch, 'x', t0 + 1.2, x); if(!left) ch.scaleX = -ch.scaleX; }
      list.push(ch); }
    return list;
  };
  // 1 · title card
  if(titleT){ const s1 = [b.bg(st.bgs[0])]; try{ const e = b.el(st.deco[1][0], W / 2, H * (tall ? 0.3 : 0.28), (tall ? W : H) * 0.3); T.anim(e, 'pop', 0.3, 0.9, W, H); s1.push(e); }catch(err){}
    let ts = Math.round((tall ? 90 : 68) * (o.textScale || 1)), tl = wrap(o.title, ts, W * 0.86); while(tl.length > 3 && ts > 30){ ts -= 6; tl = wrap(o.title, ts, W * 0.86); }
    const ty = H * (tall ? 0.55 : 0.66), th = ts * 1.3 * tl.length + (o.sub ? ts * 0.9 : 0) + 50;
    const tb = b.box(W / 2, ty + (o.sub ? ts * 0.4 : 0), W * 0.9, th, st.box, {op:0.82, r:26, layer:2}); T.anim(tb, 'fadein', 0.5, 0.6, W, H); s1.push(tb);
    const tt = b.text(tl.join('\n'), W / 2, ty, ts, st.title, {anim:'typewriter', at:0.8, dur:1.6}); s1.push(tt);
    if(o.sub){ const sb = b.text(o.sub, W / 2, ty + ts * 1.3 * tl.length / 2 + ts * 0.45, Math.round(ts * 0.6), st.edge); T.anim(sb, 'fadein', 2.2, 0.8, W, H); s1.push(sb); }
    b.scene(s1, null, titleT); cuts.push(titleT); if(st.sfx) b.sfx(st.sfx, 0.3, 0.6); }
  // 2 · one scene for every 1–2 captions (a new background each scene)
  let k = 0, bi = titleT ? 1 : 0;
  for(let i = 0; i < caps.length; ){
    const grp = [caps[i]]; if(i + 1 < caps.length && caps[i].secs + caps[i + 1].secs < 9 && rnd() < 0.6) grp.push(caps[i + 1]);
    const t0 = grp[0].t0, t1 = grp[grp.length - 1].t1, objs = [b.bg(st.bgs[bi++ % st.bgs.length])];
    objs.push(...decorate(t0, t1, k));
    if(st.fx.length && rnd() < 0.5) b.fx(pick(st.fx), t0, t1, {density:0.5});
    b.scene(objs, i === 0 && !titleT ? null : t0, t1);
    for(const c of grp){ const parts = caption(c.text, c.t0, c.secs, tall ? H * 0.78 : H * 0.8, size0); b.scene(parts, c.t0, c.t1); }
    if(t0 > 0) cuts.push(t0); k++; i += grp.length;
  }
  // 3 · end card
  if(endT){ const t0 = dur - endT, s4 = [b.bg(st.bgs[0])];
    let es = Math.round((tall ? 72 : 56) * (o.textScale || 1)), el = wrap(o.end, es, W * 0.86); while(el.length > 3 && es > 28){ es -= 6; el = wrap(o.end, es, W * 0.86); }
    const et = b.text(el.join('\n'), W / 2, H * 0.38, es, st.title); T.anim(et, 'down', t0 + 0.3, 0.8, W, H); s4.push(et);
    try{ const sb = b.el('Subscribe button', W / 2, H * 0.62, (tall ? W : H) * 0.14); T.anim(T.anim(sb, 'pop', t0 + 1.1, 0.8, W, H), 'pulse', t0 + 2.2, 0.8, W, H); s4.push(sb); }catch(err){}
    b.scene(s4, t0, null); cuts.push(t0); b.sfx('ding', t0 + 1.1, 0.5); }
  // smooth scene changes, place sound
  b.p.cuts = [...new Set(cuts.filter(x => x > 0 && x < dur))];
  b.p.cuts.forEach(x => b.fx('fade', Math.max(0, x - 0.4), Math.min(dur, x + 0.4)));
  if(st.amb && o.amb !== false) b.amb(st.amb, 0, dur, 0.35);
  b.p.audio = b.p.audio.filter(c => c.kind !== 'music');   // music comes from the Studio below
  b.p.loop = false;
  b.p.name = (o.title || 'one_tap_video').replace(/[^\wఀ-౿]+/g, '_').toLowerCase();
  return b.p;
}

// compose music for the video in the Studio engine and render it to a WAV blob
let studioReady = null;
async function music(o, seconds, onProgress){
  const S = window.VG_STUDIO; if(!S) return null;
  if(!studioReady) studioReady = S.load('../studio/samples/'); await studioReady;
  const st = STYLES[o.style] || STYLES.upanishad;
  const song = S.compose({mood:o.mood || st.mood, seconds, seed:o.seed || 1, scale:o.raga || null});
  const buf = await S.render(song, onProgress);
  return {blob:S.wavBlob(buf), name:song.name, seconds:buf.duration};
}
window.VG_ONETAP = {STYLES, plan, build, music, wrap};
})();
