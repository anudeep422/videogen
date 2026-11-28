/* ==========================================================================
   VideoGen Animator – ready-made animated templates.
   Each template builds a full project from library elements, text and
   keyframes. Open one, change the words and colours, export the video.
   Add your own with tpl(category, name, ratio, buildFunction).
   ========================================================================== */
(function(){
const TPL = [];
// default background music per category (made by code in sound.js); a template can choose its own with b.music()
const MUSIC_FOR = {'Spiritual':'flute', 'Insurance & business':'corporate', 'YouTube & social':'happy', 'Greetings':'festival'};
const MUSIC_NAME = {flute:'Calm flute (spiritual)', drone:'Tanpura drone (meditation)', happy:'Happy (kids, greetings)', corporate:'Corporate (business, insurance)', epic:'Epic war drums', festival:'Festival dhol & shehnai'};
const tpl = (cat, name, ratio, build) => TPL.push({cat, name, ratio, build:() => { const p = build();
  if(!p.audio.some(c => c.kind === 'music')){ const m = MUSIC_FOR[cat] || 'flute'; p.audio.unshift(musicClip(m, p.duration)); } return p; }});
const aid = () => Math.random().toString(36).slice(2, 10);
const GEN_STYLE = {flute:'spiritual', drone:'meditation', happy:'happy', corporate:'corporate', epic:'epic', festival:'festival'};
// real-instrument music from musicgen.js (falls back to the simple synth music when offline)
const musicClip = (m, d) => ({id:aid(), name:'🎼 ' + (MUSIC_NAME[m] || m), kind:'music', gen:{style:GEN_STYLE[m] || 'spiritual', seconds:d, key:'D', seed:7}, synth:m, start:0, len:d, volume:0.8});
const SIZE = {'16:9':[1280, 720], '9:16':[1080, 1920], '1:1':[1080, 1080]};

// ---------------------------------------------------------------- builder
function Builder(ratio, duration){
  const [W, H] = SIZE[ratio];
  const id = () => Math.random().toString(36).slice(2, 10);
  const layer = name => ({id:id(), name, visible:true, locked:false, opacity:1, objects:[]});
  const p = {app:'videogen-animator', version:3, width:W, height:H, background:'#ffffff', duration, fps:30, loop:true, audio:[],
             layers:[layer('Background'), layer('Elements'), {...layer('Text'), fixed:true}]};
  const lib = name => { const it = (window.VG_LIBRARY || []).find(i => i.name === name); if(!it) throw new Error('Missing library element: ' + name); return it; };
  const wrap = o => (o.scaleX || 1) !== 1 || (o.scaleY || 1) !== 1 ? {type:'group', x:0, y:0, rotation:0, scaleX:1, scaleY:1, opacity:1, children:[o]} : o;
  return {
    W, H, p,
    music(m){ p.audio.unshift(musicClip(m, duration)); },
    sfx(id, t, vol = 1){ const f = window.VG_SOUND && window.VG_SOUND.SFX.find(x => x.id === id); p.audio.push({id:aid(), name:f ? f.name : id, kind:'sfx', synth:id, start:t, volume:vol}); },
    bg(name){ const o = lib(name).make(W, H); o.id = id(); o.name = name; o.x = W / 2; o.y = H / 2; p.layers[0].objects.push(o); return o; },
    // add a library element centred at (x, y) with height h
    el(name, x, y, h, opts = {}){
      const o = wrap(lib(name).make(W, H)); o.id = id(); o.name = name;
      const b = window.localBox(o), k = h / (b[3] - b[1]);
      o.scaleX = o.scaleY = k; o.x = x - (b[0] + b[2]) / 2 * k; o.y = y - (b[1] + b[3]) / 2 * k;
      // keep the centre on (x, y) when rotating / scaling: recentre the children instead
      const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
      if(o.children){ o.children = [{type:'group', x:-cx, y:-cy, rotation:0, scaleX:1, scaleY:1, opacity:1, children:o.children}]; o.x = x; o.y = y; }
      if(opts.rot) o.rotation = opts.rot; if(opts.op != null) o.opacity = opts.op; if(opts.flip) o.scaleX = -o.scaleX;
      p.layers[opts.layer ?? 1].objects.push(o); return o;
    },
    text(t, x, y, size, fill, opts = {}){
      const o = {id:id(), type:'text', x, y, rotation:0, scaleX:1, scaleY:1, opacity:1, text:t, size, fill};
      if(opts.anim) o.tfx = {k:opts.anim, t0:opts.at ?? 0, d:opts.dur ?? 1.5};
      p.layers[opts.layer ?? 2].objects.push(o); return o;
    },
    box(x, y, w, h, fill, opts = {}){ const o = {id:id(), type:'rect', x, y, w, h, rotation:0, scaleX:1, scaleY:1, opacity:opts.op ?? 1, fill, stroke:opts.stroke || null, width:opts.lw || 0, radius:opts.r ?? 18};
      p.layers[opts.layer ?? 1].objects.push(o); return o; },
    char(preset, x, y, size, acts = [], opts = {}){ const o = window.VG_CHAR.make(preset); o.id = id(); o.x = x; o.y = y; o.scaleX = o.scaleY = size; o.actions = acts.map(([a, t0, t1]) => ({a, t0, t1}));
      if(opts.face) o.face = opts.face; if(opts.expr) o.expr = opts.expr; p.layers[opts.layer ?? 1].objects.push(o); return o; },
    fx(kind, t0, t1, opts = {}){ const o = window.VG_FX.make(kind, W, H); o.id = id(); o.name = window.VG_FX.KINDS[kind][0]; o.show = [t0, t1]; Object.assign(o, opts);
      p.layers[2].objects.push(o); return o; },
    scene(list, a, b){ list.forEach(o => { o.show = [a, b]; }); },
    // nature / place sound (ambience.js) from t0 to t1
    amb(sid, t0 = 0, t1 = duration, vol = 0.7){ const a = window.VG_AMB && window.VG_AMB.LIST.find(x => x.id === sid); p.audio.push({id:aid(), name:a ? a.icon + ' ' + a.name : sid, kind:'sfx', synth:'amb:' + sid, start:t0, len:+(t1 - t0).toFixed(2), volume:vol, fadeIn:1, fadeOut:1.5}); },
    quiet(m, vol = 0.4){ p.audio.unshift({...musicClip(m, duration), volume:vol}); },
    gen(style, raga, vol = 0.5){ p.audio.unshift({id:aid(), name:'🎼 ' + style + ' · ' + raga, kind:'music', gen:{style, raga, seconds:duration, key:'D', seed:3}, synth:'flute', start:0, len:duration, volume:vol}); }
  };
}
// change the words inside a library element (title bar, name strip, badge…)
function setText(o, ...texts){ const list = []; const walk = n => { if(n.type === 'text') list.push(n); (n.children || []).forEach(walk); }; walk(o);
  texts.forEach((t, i) => { const n = list[i]; if(!n || t == null) return; window.measureText(n); const w0 = n._w; n.text = t; window.measureText(n);
    if(n._w > w0 * 1.08) n.size = Math.max(10, Math.floor(n.size * w0 * 1.08 / n._w)); }); return o; }

// ---------------------------------------------------------------- keyframe helpers
function key(o, p, t, v, e = 'inout'){
  o.keys = o.keys || {}; const k = o.keys[p] = o.keys[p] || []; t = Math.round(t * 30) / 30;
  const f = k.find(q => Math.abs(q.t - t) < 0.01); if(f){ f.v = v; f.e = e; } else { k.push({t, v, e}); k.sort((a, b) => a.t - b.t); }
}
function anim(o, kind, t0, d = 1, W = 1280, H = 720){
  const t1 = t0 + d, tm = t0 + d / 2, x = o.x, y = o.y, sx = o.scaleX, sy = o.scaleY, op = o.opacity ?? 1, r = o.rotation || 0;
  switch(kind){
    case 'fadein':  key(o, 'opacity', t0, 0, 'out'); key(o, 'opacity', t1, op); break;
    case 'fadeout': key(o, 'opacity', t0, op, 'in'); key(o, 'opacity', t1, 0); break;
    case 'pop':     key(o, 'scaleX', t0, 0, 'back'); key(o, 'scaleX', t1, sx); key(o, 'scaleY', t0, 0, 'back'); key(o, 'scaleY', t1, sy); key(o, 'opacity', t0, 0, 'out'); key(o, 'opacity', tm, op); break;
    case 'zoomout': key(o, 'scaleX', t0, sx * 2.4, 'out'); key(o, 'scaleX', t1, sx); key(o, 'scaleY', t0, sy * 2.4, 'out'); key(o, 'scaleY', t1, sy); key(o, 'opacity', t0, 0, 'out'); key(o, 'opacity', t1, op); break;
    case 'left':    key(o, 'x', t0, x - W * 0.7, 'out'); key(o, 'x', t1, x); key(o, 'opacity', t0, 0, 'out'); key(o, 'opacity', tm, op); break;
    case 'right':   key(o, 'x', t0, x + W * 0.7, 'out'); key(o, 'x', t1, x); key(o, 'opacity', t0, 0, 'out'); key(o, 'opacity', tm, op); break;
    case 'up':      key(o, 'y', t0, y + H * 0.35, 'out'); key(o, 'y', t1, y); key(o, 'opacity', t0, 0, 'out'); key(o, 'opacity', tm, op); break;
    case 'down':    key(o, 'y', t0, y - H * 0.35, 'out'); key(o, 'y', t1, y); key(o, 'opacity', t0, 0, 'out'); key(o, 'opacity', tm, op); break;
    case 'bounce':  key(o, 'y', t0, y - H * 0.5, 'bounce'); key(o, 'y', t1, y); key(o, 'opacity', t0, 0, 'linear'); key(o, 'opacity', t0 + 0.15, op); break;
    case 'pulse':   key(o, 'scaleX', t0, sx); key(o, 'scaleX', tm, sx * 1.15); key(o, 'scaleX', t1, sx); key(o, 'scaleY', t0, sy); key(o, 'scaleY', tm, sy * 1.15); key(o, 'scaleY', t1, sy); break;
    case 'spin':    key(o, 'rotation', t0, r, 'linear'); key(o, 'rotation', t1, r + 360); break;
    case 'turn':    key(o, 'rotation', t0, r, 'linear'); key(o, 'rotation', t1, r + 40); break;   // slow turn over d seconds
    case 'float':   for(let i = 0; i <= Math.round(d / 1.5); i++) key(o, 'y', t0 + i * 1.5, y + (i % 2 ? -14 : 14), 'inout'); break;
    case 'rise':    key(o, 'y', t0, y + H * 0.18, 'out'); key(o, 'y', t1, y); break;
  }
  return o;
}
const fly = (o, x0, x1, t0, t1) => { key(o, 'x', t0, x0, 'linear'); key(o, 'x', t1, x1); return o; };

// ================================================================= SCENES (places with their sounds)
const walkAcross = (o, x0, x1, t0, t1) => { key(o, 'x', t0, x0, 'linear'); key(o, 'x', t1, x1); return o; };
tpl('Scenes', 'City morning walk', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('City (day)'); b.amb('city', 0, 10, 0.6); b.quiet('corporate', 0.35);
  walkAcross(b.char('office', 120, 540, 1.1, [['walk', 0, 6.5], ['wave', 6.5, 8], ['idle', 8, 10]]), 120, 760, 0, 6.5);
  b.box(640, 110, 760, 110, '#FFFFFF', {op:.85, r:20}); anim(b.text('నగరంలో ఒక ఉదయం', 640, 110, 54, '#1B4F72'), 'down', 0.5, 1, W, H); return b.p; });
tpl('Scenes', 'City at night', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('City (night)'); b.amb('city', 0, 10, 0.4); b.amb('night', 0, 10, 0.35); b.quiet('drone', 0.3);
  walkAcross(b.char('woman', 1180, 535, 0.95, [['walk', 0, 7]]), 1180, 420, 0, 7).scaleX = -0.95;
  anim(b.text('రాత్రి నగరం', 640, 120, 60, '#FFE08A', {anim:'glow', at:0.5, dur:2}), 'fadein', 0.3, 1, W, H); return b.p; });
tpl('Scenes', 'Beach and waves', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('Beach (day)'); b.amb('sea', 0, 10, 0.8); b.quiet('happy', 0.3); b.fx('birds', 0, 10);
  walkAcross(b.char('boy', 300, 640, 1.05, [['run', 0, 6], ['jump', 6, 7], ['wave', 7, 10]]), 300, 900, 0, 6);
  walkAcross(b.char('girl', 200, 650, 1.05, [['run', 0.4, 6.4], ['clap', 6.4, 10]]), 200, 780, 0.4, 6.4);
  anim(b.text('సముద్ర తీరం', 640, 90, 60, '#0B4F6C'), 'down', 0.4, 1, W, H); return b.p; });
tpl('Scenes', 'Into the jungle', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('Jungle'); b.amb('forest', 0, 10, 0.8); b.quiet('drone', 0.25); b.fx('leaves', 0, 10, {density:0.5});
  walkAcross(b.char('archer', 100, 660, 1.15, [['walk', 0, 6], ['shoot', 6, 8], ['idle', 8, 10]]), 100, 560, 0, 6);
  anim(b.text('అడవిలోకి ప్రయాణం', 640, 90, 56, '#FFFFFF', {anim:'words', at:0.5, dur:1.5}), 'fadein', 0.3, 0.8, W, H); return b.p; });
tpl('Scenes', 'Temple morning prayer', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('Temple courtyard'); b.amb('temple', 0, 10, 0.7); b.amb('morning', 0, 10, 0.4); b.gen('bansuri', 'mohanam', 0.35);
  b.char('woman', 520, 640, 1.1, [['walk', 0, 2], ['namaste', 2, 10]]); b.char('elder', 760, 645, 1.1, [['idle', 0, 3], ['namaste', 3, 10]]);
  b.sfx('templebell', 2.2, 0.6);
  anim(b.text('శుభోదయం\nదేవాలయ దర్శనం', 230, 110, 42, '#7B241C'), 'down', 0.8, 1, W, H); return b.p; });
tpl('Scenes', 'River ghat at sunrise', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('River ghat'); b.amb('river', 0, 10, 0.7); b.amb('morning', 0, 10, 0.35); b.gen('bansuri', 'hindolam', 0.35);
  anim(b.el('Rishi meditating', 300, 560, 220), 'fadein', 0.5, 1.5, W, H); anim(b.el('Diya lamp', 470, 610, 70), 'pop', 2, 0.8, W, H);
  b.sfx('bell', 2.5, 0.5);
  anim(b.text('గంగా తీరంలో సూర్యోదయం', 820, 640, 46, '#FFF3D6', {anim:'words', at:1.5, dur:2}), 'fadein', 1.2, 1, W, H); return b.p; });
tpl('Scenes', 'Rishi in the Himalayas', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('Himalaya snow peaks'); b.amb('wind', 0, 10, 0.6); b.music('drone'); b.fx('snow', 0, 10, {density:0.5});
  anim(b.el('Rishi meditating', 640, 560, 260), 'up', 0.4, 1.4, W, H); anim(b.el('Glow', 640, 520, 300, {op:.6}), 'fadein', 1.5, 1.5, W, H);
  anim(b.text('హిమాలయాలలో తపస్సు', 640, 110, 58, '#1B2631', {anim:'words', at:1, dur:2}), 'fadein', 0.8, 1, W, H); return b.p; });
tpl('Scenes', 'Rainy day (family protection)', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('Rainy sky (dark clouds)'); b.fx('rain', 0, 10, {density:1.2}); b.fx('lightning', 3, 4.2); b.amb('storm', 0, 10, 0.75); b.quiet('corporate', 0.3);
  anim(b.el('Umbrella (protection)', 640, 420, 420), 'down', 1, 1.2, W, H); anim(b.el('Family', 640, 560, 260), 'fadein', 1.8, 1, W, H);
  b.box(640, 100, 1000, 120, '#FFFFFF', {op:.88, r:20});
  anim(b.text('వర్షం వచ్చినా, తుఫాను వచ్చినా —\nమీ కుటుంబానికి రక్షణ', 640, 100, 40, '#1B4F72'), 'down', 2.6, 1, W, H); return b.p; });
tpl('Scenes', 'Creation of the universe', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('Space (cosmos)'); b.amb('cosmic', 0, 10, 0.8); b.music('drone'); b.fx('stars', 0, null);
  anim(b.el('Glow', 640, 330, 380), 'fadein', 1, 2, W, H); anim(anim(b.el('Om symbol', 640, 330, 200), 'zoomout', 1.5, 2, W, H), 'pulse', 5, 2, W, H);
  b.sfx('conch', 1.2, 0.6);
  anim(b.text('సృష్టికి ముందు — ఓం', 640, 600, 54, '#FFE9B0', {anim:'glow', at:3, dur:2}), 'fadein', 3, 1, W, H); return b.p; });
tpl('Scenes', 'Cave meditation', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('Cave (meditation)'); b.amb('cave', 0, 10, 0.8); b.music('drone');
  anim(b.el('Rishi meditating', 640, 520, 240), 'fadein', 0.5, 2, W, H); anim(b.el('Diya lamp', 470, 590, 70), 'pop', 2.2, 0.8, W, H);
  anim(b.text('మౌనం — ధ్యానం', 640, 90, 56, '#FFE0A8', {anim:'words', at:2, dur:2}), 'fadein', 2, 1, W, H); return b.p; });
tpl('Scenes', 'Family at home', '16:9', () => { const b = Builder('16:9', 8), W = b.W, H = b.H;
  b.bg('Home (living room)'); b.quiet('happy', 0.4);
  anim(b.el('Family', 760, 500, 300), 'up', 0.4, 1, W, H);
  b.box(330, 140, 560, 120, '#FFFFFF', {op:.9, r:20}); anim(b.text('మీ కుటుంబం,\nమీ బలం', 330, 140, 44, '#7B241C'), 'left', 1, 1, W, H); return b.p; });
tpl('Scenes', 'Office meeting', '16:9', () => { const b = Builder('16:9', 8), W = b.W, H = b.H;
  b.bg('Office'); b.amb('crowd', 0, 8, 0.15); b.quiet('corporate', 0.4);
  b.char('advisor', 400, 700, 1.55, [['talk', 0.5, 5], ['point', 5, 8]]); b.char('office', 900, 700, 1.55, [['idle', 0, 5], ['clap', 5, 8]]).scaleX = -1.55;
  anim(b.text('మీ భవిష్యత్తు ప్రణాళిక', 640, 90, 52, '#1B4F72'), 'down', 0.6, 1, W, H); return b.p; });
tpl('Scenes', 'Desert journey', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('Desert'); b.amb('wind', 0, 10, 0.7); b.gen('bansuri', 'hindolam', 0.35); b.fx('dust', 6, 9);
  walkAcross(b.char('warrior', 120, 650, 1.1, [['walk', 0, 8], ['idle', 8, 10]]), 120, 820, 0, 8);
  anim(b.text('ఎడారి ప్రయాణం', 640, 100, 58, '#7E4A12'), 'down', 0.5, 1, W, H); return b.p; });
tpl('Scenes', 'Waterfall in the forest', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('Waterfall'); b.amb('waterfall', 0, 10, 0.6); b.amb('forest', 0, 10, 0.5); b.quiet('happy', 0.25); b.fx('birds', 0, 10);
  anim(b.text('జలపాతం', 640, 650, 60, '#FFFFFF', {anim:'bounce', at:0.8, dur:1.5}), 'fadein', 0.6, 1, W, H); return b.p; });

tpl('Scenes', 'Sword duel (fight)', '16:9', () => { const b = Builder('16:9', 16), W = b.W, H = b.H, G = 660, S = 1.25;
  b.bg('Desert'); b.amb('wind', 0, 16, 0.35); b.quiet('epic', 0.5); b.fx('dust', 0, 3, {density:0.6});
  const A = b.char('warrior', 200, G, S, [['walk', 0, 2.2], ['attack', 2.6, 3.5], ['block', 3.8, 4.7], ['attack', 5.0, 5.9], ['dodge', 6.2, 7.0], ['attack', 7.3, 8.2], ['block', 8.4, 9.3],
    ['thrust', 9.6, 10.4], ['attack', 11.0, 11.9], ['attack', 12.2, 13.0], ['victory', 13.4, 16]], {face:1});
  const B = b.char('warrior', 1080, G, S, [['walk', 0, 2.2], ['block', 2.6, 3.6], ['attack', 3.8, 4.7], ['dodge', 5.1, 5.9], ['thrust', 6.2, 7.0], ['block', 7.3, 8.2], ['attack', 8.4, 9.3],
    ['hit', 9.95, 10.6], ['block', 11.0, 11.7], ['fall', 12.6, 16]], {face:-1});
  B.look = {top:'#922B21', bottom:'#1C2833', helmet:'#7F8C8D', extra:'#7F8C8D'}; B.actions[B.actions.length - 1].stay = true; B.name = 'Enemy warrior'; A.name = 'Hero warrior';
  walkAcross(A, 200, 530, 0, 2.2); walkAcross(B, 1080, 750, 0, 2.2); key(B, 'x', 9.9, 750); key(B, 'x', 10.6, 800); key(B, 'x', 12.5, 800); key(B, 'x', 12.9, 840);
  // sword sparks + clash sounds where the swords meet
  const hitY = G - 150 * S;
  [3.0, 4.2, 7.7, 8.8, 11.4].forEach(t => { b.fx('clash', t, t + 0.45, {x:640, y:hitY, w:220, h:220}); b.sfx('sword', t, 0.9); });
  b.sfx('sword', 10.0, 0.6); b.fx('clash', 10.0, 10.4, {x:720, y:hitY + 40, w:160, h:160, color:'#FF7043'});
  b.fx('flash', 12.6, 12.9); b.sfx('sword', 12.6, 1); b.fx('dust', 12.7, 14.5, {x:880, y:G - 20, w:340, h:160, density:0.8}); b.sfx('drum', 12.75, 0.8);
  // camera: closer during the fight, shakes on hard hits, back out for the victory
  p_cam(b.p, [[0, 640, 360, 1], [6.8, 640, 360, 1], [7.4, 640, 420, 1.45], [12.4, 640, 420, 1.45], [13.8, 600, 400, 1.2]], [[8.8, 0.35, 12], [12.6, 0.6, 22]]);
  anim(b.text('యుద్ధం', 640, 110, 70, '#FFFFFF', {anim:'bounce', at:0.3, dur:1.2}), 'fadein', 0.2, 0.6, W, H); b.p.layers[2].objects[b.p.layers[2].objects.length - 1].show = [0, 2.4];
  anim(b.text('విజయం!', 640, 110, 72, '#FFD54F', {anim:'bounce', at:13.6, dur:1.2}), 'fadein', 13.5, 0.5, W, H); b.p.layers[2].objects[b.p.layers[2].objects.length - 1].show = [13.5, 16];
  return b.p; });
function p_cam(p, keys, shakes){ p.cam = {x:p.width / 2, y:p.height / 2, zoom:1, rotation:0, keys:{}, shakes:[]};
  keys.forEach(([t, x, y, z]) => { key(p.cam, 'x', t, x); key(p.cam, 'y', t, y); key(p.cam, 'zoom', t, z); });
  shakes.forEach(([t, d, amp]) => p.cam.shakes.push({t0:t, t1:t + d, amp})); }

// ================================================================= NEW: 3D, animals, stories
const fadeCuts = (b, ts) => ts.forEach(t => b.fx('fade', t - 0.5, t + 0.5));
const says = (b, x, y, w, h, txt, t0, t1, size = 34, col = '#3E2723') => { const bx = b.box(x, y, w, h, '#FFFFFF', {op:.9, r:22, stroke:'#E0B45A', lw:3}); const tx = b.text(txt, x, y, size, col, {anim:'typewriter', at:t0, dur:Math.min(2.5, (t1 - t0) * 0.6)}); bx.show = [t0, t1]; tx.show = [t0, t1]; anim(bx, 'pop', t0, 0.4); return [bx, tx]; };

tpl('Spiritual', 'Guru teaches disciple (3D)', '16:9', () => { const b = Builder('16:9', 20), W = b.W, H = b.H;
  b.bg('Forest'); b.el('Banyan tree', 250, 400, 460); b.amb('forest', 0, 20, 0.45); b.gen('bansuri', 'mohanam', 0.35);
  b.char('sage3d', 470, 660, 1.45, [['namaste', 0, 2], ['talk', 2.5, 9], ['point', 9, 10.5], ['talk', 11, 15], ['namaste', 17.5, 20]], {face:1});
  b.char('boy3d', 850, 660, 1.45, [['namaste', 0, 2], ['idle', 2, 10], ['talk', 10.6, 13], ['clap', 15.2, 17], ['namaste', 17.5, 20]], {face:-1});
  anim(b.text('గురు – శిష్య సంవాదం', 640, 80, 54, '#FFF3D6', {anim:'words', at:0.2, dur:1.5}), 'fadein', 0, 0.6, W, H).show = [0, 3];
  says(b, 640, 110, 900, 110, 'గురువు: నాయనా, నిజమైన జ్ఞానం నీలోనే ఉంది.', 2.6, 9);
  says(b, 640, 110, 900, 110, 'శిష్యుడు: గురువర్యా, దాన్ని ఎలా తెలుసుకోవాలి?', 10.6, 13);
  says(b, 640, 110, 900, 110, 'గురువు: మౌనంగా నిన్ను నువ్వు గమనించు.', 13.2, 17.3);
  b.fx('sparkles', 15.5, 17.5, {density:0.4}); b.sfx('bell', 17.6, 0.6); return b.p; });

tpl('Spiritual', 'Upanishad story in 3 scenes', '16:9', () => { const b = Builder('16:9', 30), W = b.W, H = b.H; b.p.cuts = [10, 20];
  const s1 = [b.bg('Himalaya snow peaks'), b.el('Rishi meditating', 640, 520, 300), b.box(640, 110, 1000, 120, '#FFFFFF', {op:.85, r:22}),
    b.text('ఒకప్పుడు హిమాలయాల్లో ఒక మహర్షి తపస్సు చేస్తున్నారు.', 640, 110, 38, '#1B4F72', {anim:'typewriter', at:0.8, dur:3})];
  anim(s1[1], 'up', 0.2, 1.2, W, H); b.scene(s1, null, 10); b.fx('snow', 0, 10, {density:0.4}); b.amb('wind', 0, 10, 0.4);
  const s2 = [b.bg('River ghat'), b.char('sage3d', 300, 660, 1.4, [['walk', 10, 15], ['talk', 15.5, 20]]), b.char('boy3d', 1000, 660, 1.4, [['namaste', 15.2, 17], ['idle', 17, 20]], {face:-1}),
    b.box(640, 110, 1000, 120, '#FFFFFF', {op:.85, r:22}), b.text('ఒక బాలుడు జ్ఞానం కోసం ఆయన దగ్గరకు వచ్చాడు.', 640, 110, 38, '#1B4F72', {anim:'typewriter', at:10.8, dur:3})];
  walkAcross(s2[1], 300, 700, 10, 15); b.scene(s2, 10, 20); b.amb('river', 10, 20, 0.5);
  const s3 = [b.bg('Green fields'), b.el('Ashram', 640, 420, 240), b.el('Diya lamp', 300, 600, 130), b.el('Diya lamp', 980, 600, 130),
    b.box(640, 110, 1100, 130, '#FFF8E7', {op:.9, r:22, stroke:'#E67E22', lw:3}), b.text('సారాంశం: జ్ఞానం గురువు ద్వారా, సాధన ద్వారా వస్తుంది.', 640, 110, 38, '#7B241C', {anim:'words', at:20.8, dur:3})];
  anim(s3[1], 'pop', 20.2, 0.8, W, H); b.scene(s3, 20, null); b.fx('petals', 20, 30, {density:0.5}); b.sfx('bell', 20.3, 0.6);
  fadeCuts(b, [10, 20]); b.gen('bansuri', 'kalyani', 0.4); return b.p; });

tpl('Spiritual', 'Om chanting (meditation)', '16:9', () => { const b = Builder('16:9', 20), W = b.W, H = b.H;
  b.bg('Space (cosmos)'); const sun = b.el('Sun with rays', 640, 340, 520, {op:.35}); const om = b.el('Om symbol', 640, 330, 260);
  anim(sun, 'turn', 0, 20, W, H); anim(om, 'zoomout', 0.3, 2, W, H); [5, 9, 13, 17].forEach(t => anim(om, 'pulse', t, 1.6, W, H));
  anim(b.text('ఓం శాంతిః శాంతిః శాంతిః', 640, 600, 52, '#FFE0A8', {anim:'words', at:3, dur:3}), 'fadein', 2.8, 1, W, H);
  b.fx('stars', 0, 20, {density:0.8}); [0.2, 6, 12].forEach(t => b.sfx('bowl', t, 0.8)); b.amb('cosmic', 0, 20, 0.5); b.quiet('drone', 0.55); return b.p; });

tpl('Spiritual', 'Vedic quiz (Shorts)', '9:16', () => { const b = Builder('9:16', 15), W = b.W, H = b.H;
  b.bg('Saffron glow'); anim(b.text('ప్రశ్న 🤔', 540, 230, 90, '#7B241C'), 'bounce', 0.2, 1, W, H);
  b.box(540, 560, 920, 300, '#FFFFFF', {op:.92, r:30, stroke:'#E67E22', lw:5});
  b.text('ఈశావాస్య ఉపనిషత్తు\nఏ వేదంలో ఉంది?', 540, 560, 60, '#4A2C0A', {anim:'typewriter', at:0.8, dur:2});
  const opts = ['A) ఋగ్వేదం', 'B) శుక్ల యజుర్వేదం', 'C) సామవేదం'];
  opts.forEach((o, i) => { const y = 900 + i * 200; const bx = b.box(540, y, 820, 150, '#FFF3E0', {op:1, r:26, stroke:'#B9770E', lw:4}); const tx = b.text(o, 540, y, 54, '#4A2C0A');
    anim(bx, 'left', 3 + i * 0.4, 0.6, W, H); anim(tx, 'left', 3 + i * 0.4, 0.6, W, H); b.sfx('pop', 3 + i * 0.4, 0.5); });
  ['3', '2', '1'].forEach((n, i) => { const t = b.text(n, 540, 1560, 160, '#C0392B'); t.show = [6 + i, 7 + i]; anim(t, 'pop', 6 + i, 0.4, W, H); b.sfx('ding', 6 + i, 0.3); });
  const right = b.box(540, 1100, 840, 165, '#2ECC71', {op:.35, r:28, stroke:'#1E8449', lw:7}); right.show = [9.2, 15]; anim(right, 'pop', 9.2, 0.5, W, H);
  const ans = b.text('సరైన సమాధానం: B ✅', 540, 1560, 66, '#1E8449'); ans.show = [9.3, 15]; anim(ans, 'bounce', 9.3, 0.8, W, H);
  b.sfx('applause', 9.4, 0.5); b.fx('confetti', 9.3, 12); b.quiet('happy', 0.35); return b.p; });

tpl('Insurance & business', 'Term insurance for family (3D)', '16:9', () => { const b = Builder('16:9', 18), W = b.W, H = b.H;
  b.bg('Home (living room)'); b.quiet('corporate', 0.4);
  b.char('man3d', 330, 670, 1.5, [['talk', 0.5, 6], ['point', 6, 8], ['wave', 15, 18]]); b.char('woman3d', 520, 670, 1.45, [['idle', 0, 15], ['namaste', 15, 18]]); b.char('girl3d', 690, 670, 1.4, [['idle', 0, 8], ['dance', 8, 11], ['wave', 15, 18]]);
  const sh = b.el('Shield (protection)', 500, 330, 300, {op:.85}); anim(sh, 'pop', 6.5, 0.8, W, H); b.sfx('whoosh', 6.4, 0.6);
  b.box(1000, 330, 520, 380, '#FFFFFF', {op:.9, r:24});
  [['మీ కుటుంబానికి పూర్తి రక్షణ', 2], ['తక్కువ ప్రీమియం – ఎక్కువ కవరేజ్', 4.5], ['ఈరోజే ప్లాన్ చేయండి', 7.5]].forEach(([tx, t], i) => {
    const o = b.text('✔ ' + tx, 1000, 220 + i * 110, 34, '#1B4F72'); anim(o, 'right', t, 0.6, W, H); b.sfx('ding', t + 0.3, 0.4); });
  const end = b.box(640, 600, 900, 130, '#1B4F72', {op:.95, r:24}), et = b.text('మీ పేరు · ఫోన్ నంబర్', 640, 600, 46, '#FFFFFF');
  end.show = et.show = [12, 18]; anim(end, 'up', 12, 0.7, W, H); anim(et, 'up', 12, 0.7, W, H); return b.p; });

tpl('Insurance & business', 'Child education plan (3D)', '16:9', () => { const b = Builder('16:9', 15), W = b.W, H = b.H;
  b.bg('Green fields'); b.el('School', 1000, 420, 300); b.amb('morning', 0, 15, 0.4); b.quiet('happy', 0.4);
  const g = b.char('girl3d', 150, 660, 1.4, [['walk', 0, 5], ['wave', 5, 7], ['dance', 11, 15]]); walkAcross(g, 150, 640, 0, 5);
  anim(b.el('Books', 380, 470, 110), 'pop', 5.5, 0.6, W, H);
  b.box(640, 110, 1000, 130, '#FFFFFF', {op:.88, r:24}); b.text('పిల్లల చదువు – మీ ముఖ్యమైన బాధ్యత', 640, 110, 44, '#1B4F72', {anim:'words', at:1, dur:2});
  const t2 = b.text('ఈరోజే చైల్డ్ ఎడ్యుకేషన్ ప్లాన్ ప్రారంభించండి', 640, 230, 36, '#C0392B'); anim(t2, 'up', 7.5, 0.7, W, H);
  b.fx('sparkles', 11, 14, {density:0.4}); return b.p; });

tpl('Insurance & business', 'Retirement plan (3D)', '16:9', () => { const b = Builder('16:9', 15), W = b.W, H = b.H;
  b.bg('River ghat'); b.amb('river', 0, 15, 0.4); b.gen('bansuri', 'kalyani', 0.35);
  b.char('grandpa3d', 420, 660, 1.45, [['idle', 0, 4], ['talk', 4, 9], ['namaste', 12, 15]]); b.char('woman3d', 640, 660, 1.4, [['idle', 0, 9], ['clap', 9, 11], ['namaste', 12, 15]]);
  b.box(960, 260, 560, 300, '#FFFFFF', {op:.9, r:24});
  b.text('ప్రశాంతమైన\nవిశ్రాంత జీవితం', 960, 220, 48, '#7B241C', {anim:'words', at:1, dur:2});
  const t2 = b.text('ఇప్పుడే పెన్షన్ ప్లాన్ చేయండి', 960, 350, 32, '#1B4F72'); anim(t2, 'fadein', 4, 1, W, H);
  b.fx('coins', 6, 9, {density:0.5}); return b.p; });

tpl('Insurance & business', 'Client testimonial (fill in)', '16:9', () => { const b = Builder('16:9', 12), W = b.W, H = b.H;
  b.bg('Office'); b.quiet('corporate', 0.35);
  b.char('man3d', 330, 670, 1.5, [['talk', 0.8, 8], ['namaste', 9, 12]]);
  const q = setText(b.el('Quote card', 860, 330, 330), null, 'క్లయింట్ మాటలు\nఇక్కడ రాయండి', '– క్లయింట్ పేరు'); anim(q, 'pop', 0.5, 0.7, W, H); return b.p; });

tpl('Greetings', 'Ugadi greeting', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('Saffron glow'); const k = b.el('Kalasham', 640, 330, 300); anim(k, 'pop', 0.3, 0.9, W, H);
  anim(b.el('Diya lamp', 300, 560, 150), 'up', 0.8, 0.8, W, H); anim(b.el('Diya lamp', 980, 560, 150), 'up', 1, 0.8, W, H);
  anim(b.text('ఉగాది శుభాకాంక్షలు', 640, 600, 72, '#7B241C', {anim:'bounce', at:1.6, dur:1.5}), 'fadein', 1.5, 0.6, W, H);
  anim(b.text('కొత్త సంవత్సరం మీకు ఆనందం, ఆరోగ్యం తేవాలి', 640, 680, 32, '#A04000'), 'fadein', 3.2, 1, W, H);
  b.fx('petals', 0, 10, {density:0.7}); b.sfx('bell', 0.4, 0.7); b.quiet('festival', 0.45); return b.p; });

tpl('Greetings', 'Krishna Janmashtami greeting', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('Night sky'); const f = b.el('Peacock feather', 640, 340, 300); anim(f, 'pop', 0.3, 0.8, W, H); anim(f, 'pulse', 3, 1.4, W, H);
  b.char('peacock', 300, 640, 1.3, [['dance', 0, 10]]); b.char('peacock', 980, 640, 1.3, [['dance', 0, 10]], {face:-1});
  anim(b.text('శ్రీ కృష్ణ జన్మాష్టమి శుభాకాంక్షలు', 640, 110, 54, '#FFE082', {anim:'words', at:1.4, dur:2}), 'fadein', 1.3, 0.6, W, H);
  b.fx('stars', 0, 10, {density:0.6}); b.fx('sparkles', 2, 8, {density:0.4}); b.gen('bansuri', 'mohanam', 0.5); return b.p; });

tpl('Greetings', 'Good night (Reel)', '9:16', () => { const b = Builder('9:16', 8), W = b.W, H = b.H;
  b.bg('Night sky');
  anim(b.text('శుభ రాత్రి', 540, 1100, 120, '#FFF3C4', {anim:'words', at:1, dur:1.5}), 'fadein', 1, 0.6, W, H);
  anim(b.text('మంచి కలలు కనండి 🌙', 540, 1260, 56, '#D6E4FF'), 'fadein', 2.5, 1, W, H);
  b.fx('stars', 0, 8, {density:0.9}); b.fx('fireflies', 0, 8, {density:0.6}); b.amb('night', 0, 8, 0.5); b.quiet('drone', 0.35); return b.p; });

tpl('Scenes', 'Village morning with animals', '16:9', () => { const b = Builder('16:9', 15), W = b.W, H = b.H;
  b.bg('Green fields'); b.el('Village hut', 200, 430, 220); b.el('Coconut palm', 1120, 380, 380); b.amb('village', 0, 15, 0.5); b.amb('morning', 0, 15, 0.4); b.quiet('happy', 0.3);
  const c1 = b.char('cow', 1300, 640, 0.9, [['walk', 0, 7], ['eat', 7, 15]], {face:-1}); walkAcross(c1, 1300, 820, 0, 7);
  const fm = b.char('farmer', -60, 650, 1.2, [['walk', 0, 6], ['wave', 6, 8], ['idle', 8, 15]]); walkAcross(fm, -60, 520, 0, 6);
  b.char('peacock', 380, 640, 0.9, [['idle', 0, 8], ['dance', 8, 15]]); b.char('dog', 640, 655, 0.9, [['sit', 0, 10], ['dance', 10, 15]]);
  b.fx('birds', 0, 15); b.sfx('cowbells', 1, 0.5);
  anim(b.text('పల్లెటూరి ఉదయం', 640, 90, 60, '#5D4037', {anim:'bounce', at:0.5, dur:1.5}), 'fadein', 0.4, 0.6, W, H); return b.p; });

tpl('Scenes', 'Jungle adventure (3D boy and animals)', '16:9', () => { const b = Builder('16:9', 16), W = b.W, H = b.H;
  b.bg('Jungle'); b.amb('forest', 0, 16, 0.6); b.gen('bansuri', 'hindolam', 0.35);
  const boy = b.char('boy3d', -80, 670, 1.45, [['walk', 0, 6], ['wave', 6, 8], ['run', 11, 16]]); walkAcross(boy, -80, 420, 0, 6); key(boy, 'x', 11, 420, 'linear'); key(boy, 'x', 16, 1400);
  const el = b.char('elephant', 1450, 650, 0.85, [['walk', 0, 6], ['talk', 6.5, 8], ['eat', 8, 16]], {face:-1}); walkAcross(el, 1450, 920, 0, 6);
  b.char('monkey', 180, 640, 0.9, [['idle', 0, 4], ['jump', 4, 6], ['talk', 6, 9]]); b.char('peacock', 700, 650, 0.85, [['idle', 0, 8], ['dance', 8, 12]]);
  const pr = b.char('parrot', -40, 260, 0.9, [['walk', 0, 16]]); key(pr, 'x', 0, -40, 'linear'); key(pr, 'x', 16, 1350);
  b.sfx('birds', 0.5, 0.6); anim(b.text('అడవిలో సాహసం', 640, 90, 60, '#FFF3D6', {anim:'words', at:0.4, dur:1.5}), 'fadein', 0.3, 0.6, W, H); return b.p; });

tpl('Scenes', 'Tiger and the deer (story)', '16:9', () => { const b = Builder('16:9', 12), W = b.W, H = b.H;
  b.bg('Forest'); b.amb('forest', 0, 12, 0.5); b.quiet('epic', 0.4);
  const d = b.char('deer', 820, 650, 1, [['eat', 0, 5.6], ['idle', 5.6, 6.2], ['run', 6.2, 12]]); key(d, 'x', 6.2, 820, 'linear'); key(d, 'x', 9.5, 1450);
  const tg = b.char('tiger', -160, 655, 1, [['walk', 0, 5], ['idle', 5, 5.8], ['jump', 5.8, 7], ['run', 7, 12]]); walkAcross(tg, -160, 380, 0, 5); key(tg, 'x', 5.8, 380, 'out'); key(tg, 'x', 7, 640, 'linear'); key(tg, 'x', 10, 1450);
  b.sfx('whoosh', 5.9, 0.7); b.p.cam = {x:640, y:360, zoom:1, rotation:0, keys:{}, shakes:[{t0:6, t1:6.6, amp:14}]};
  const t1 = b.text('జాగ్రత్త!', 640, 110, 70, '#C0392B'); t1.show = [5.6, 8]; anim(t1, 'pop', 5.6, 0.4, W, H);
  const t2 = b.text('అప్రమత్తంగా ఉంటే ప్రమాదం తప్పుతుంది', 640, 110, 42, '#FFFFFF'); t2.show = [8.5, 12]; anim(t2, 'fadein', 8.5, 0.8, W, H); return b.p; });

tpl('YouTube & social', 'Channel intro with 3D presenter', '16:9', () => { const b = Builder('16:9', 8), W = b.W, H = b.H;
  b.bg('Blue gradient'); b.char('man3d', 330, 680, 1.6, [['wave', 0.3, 2.5], ['talk', 2.5, 6], ['namaste', 6, 8]]);
  const tb = setText(b.el('Title bar', 860, 330, 130), 'మీ ఛానెల్ పేరు'); anim(tb, 'right', 0.6, 0.7, W, H); b.sfx('whoosh', 0.6, 0.6);
  anim(b.text('నమస్కారం! స్వాగతం 🙏', 860, 460, 44, '#FFFFFF', {anim:'words', at:1.6, dur:1.5}), 'fadein', 1.5, 0.5, W, H);
  b.fx('sparkles', 0.5, 4, {density:0.5}); b.quiet('happy', 0.4); return b.p; });

tpl('YouTube & social', 'Like and subscribe (3D kids, Shorts)', '9:16', () => { const b = Builder('9:16', 7), W = b.W, H = b.H;
  b.bg('Purple gradient'); b.char('boy3d', 330, 1780, 4.4, [['wave', 0, 7]]); b.char('girl3d', 760, 1780, 4.4, [['wave', 0.3, 4], ['dance', 4, 7]], {face:-1});
  const sb = b.el('Subscribe button', 540, 560, 260); anim(sb, 'pop', 0.6, 0.6, W, H); anim(sb, 'pulse', 2, 0.8, W, H); anim(sb, 'pulse', 4, 0.8, W, H);
  anim(b.text('లైక్ · షేర్ · సబ్‌స్క్రైబ్', 540, 330, 86, '#FFFFFF', {anim:'bounce', at:0.2, dur:1}), 'fadein', 0.1, 0.4, W, H);
  b.sfx('ding', 0.7, 0.6); b.fx('confetti', 2, 5); b.quiet('happy', 0.4); return b.p; });

// ================================================================= SPIRITUAL
tpl('Spiritual', 'Upanishad intro', '16:9', () => { const b = Builder('16:9', 8), W = b.W, H = b.H;
  b.bg('Saffron glow');
  anim(b.el('Sun with rays', 330, 400, 520, {op:.35}), 'turn', 0, 8, W, H);
  anim(b.el('Glow', 330, 380, 460), 'fadein', 0.2, 1.2, W, H);
  anim(b.el('Rishi meditating', 330, 430, 400), 'up', 0.4, 1.2, W, H);
  anim(b.el('Om symbol', 930, 190, 190), 'pop', 1.0, 0.9, W, H);
  b.sfx('bell', 1.0, 0.8); b.sfx('conch', 0.1, 0.5);
  anim(b.text('ఈశావాస్య ఉపనిషత్తు', 930, 410, 62, '#7B241C'), 'right', 1.6, 1, W, H);
  anim(b.text('మంత్రం 1', 930, 500, 42, '#A04000'), 'fadein', 2.4, 0.8, W, H);
  anim(b.el('Sparkles', 930, 190, 260), 'pulse', 3.2, 1.2, W, H);
  return b.p; });
tpl('Spiritual', 'Daily quote', '9:16', () => { const b = Builder('9:16', 7), W = b.W, H = b.H;
  b.bg('Purple gradient');
  anim(b.el('Light rays', 540, 960, 1920, {op:.45}), 'fadein', 0, 1.5, W, H);
  anim(b.text('ఈ రోజు సూక్తి', 540, 330, 72, '#F9E79F'), 'down', 0.3, 0.9, W, H);
  anim(b.text('నీవు వెతుకుతున్నది\nనీలోనే ఉంది', 540, 860, 92, '#FFFFFF'), 'pop', 1.0, 1, W, H);
  anim(b.text('- ఉపనిషత్తులు', 540, 1100, 50, '#F9E79F'), 'fadein', 2.0, 0.8, W, H);
  anim(b.el('Lotus', 540, 1520, 380), 'up', 1.4, 1.2, W, H);
  anim(b.el('Sparkles', 540, 560, 260), 'pulse', 2.6, 1.4, W, H);
  return b.p; });
tpl('Spiritual', 'Temple good morning', '9:16', () => { const b = Builder('9:16', 7), W = b.W, H = b.H;
  b.bg('Morning sky');
  anim(b.el('Glow', 540, 1000, 700), 'fadein', 0, 2, W, H);
  b.el('Temple', 540, 1330, 820);
  b.el('Grass & flowers', 540, 1820, 180);
  fly(b.el('Birds', -200, 720, 140), -200, 1300, 0.5, 6.5);
  anim(b.text('శుభోదయం', 540, 360, 130, '#B03A2E'), 'pop', 1.0, 1, W, H);
  b.sfx('birds', 0.5, 0.8); b.sfx('bell', 1.0, 0.6);
  anim(b.text('Good Morning', 540, 500, 58, '#5D4037'), 'fadein', 1.7, 0.8, W, H);
  return b.p; });
tpl('Spiritual', 'Upanishad mantra explainer (Isha 2)', '16:9', () => { const b = Builder('16:9', 45), W = b.W, H = b.H; b.p.cuts = [7, 22, 38];
  // 1 · title
  const s1 = [b.bg('Saffron glow'), b.el('Sun with rays', 640, 230, 380, {op:.4}), b.el('Om symbol', 640, 210, 220),
    b.text('ఈశావాస్య ఉపనిషత్తు', 640, 450, 76, '#7B241C', {anim:'typewriter', at:1.2, dur:1.6}), b.text('మంత్రం 2', 640, 560, 50, '#A04000')];
  anim(s1[1], 'turn', 0, 7, W, H); anim(s1[2], 'pop', 0.4, 0.9, W, H); anim(s1[4], 'fadein', 3.0, 0.8, W, H); b.scene(s1, null, 7);
  b.sfx('bell', 0.4, 0.8);
  // 2 · the mantra
  const s2 = [b.bg('Green fields'), b.el('Ashram', 470, 440, 190), b.el('Rishi meditating', 230, 560, 290),
    b.box(860, 330, 680, 330, '#FFF8E7', {op:.88, stroke:'#E67E22', lw:4}),
    b.text('కుర్వన్నేవేహ కర్మాణి\nజిజీవిషేచ్ఛతం సమాః ।', 860, 260, 42, '#4A2C0A', {anim:'words', at:8.2, dur:4}),
    b.text('ఏవం త్వయి నాన్యథేతోఽస్తి\nన కర్మ లిప్యతే నరే ॥', 860, 410, 42, '#4A2C0A', {anim:'words', at:13, dur:4})];
  anim(s2[2], 'up', 7.3, 1.2, W, H); anim(s2[3], 'pop', 7.6, 0.6, W, H);
  b.scene(s2, 7, 22); b.fx('petals', 7, 22, {density:0.5});
  // 3 · the meaning: keep doing your work
  const s3 = [b.bg('Green fields'), b.el('Bullock cart', 980, 560, 170), b.el('Village hut', 170, 470, 190),
    b.char('farmer', 260, 640, 1.3, [['walk', 23, 29], ['wave', 29, 31], ['walk', 31, 37]]),
    b.box(640, 120, 1120, 170, '#FFFFFF', {op:.85, r:22}),
    b.text('ఇక్కడ కర్మలు చేస్తూనే నూరేళ్లు జీవించాలని కోరుకో.\nఇలా జీవిస్తే కర్మ నిన్ను అంటదు.', 640, 120, 36, '#1B4F72', {anim:'typewriter', at:23, dur:5})];
  const fr = s3[3]; key(fr, 'x', 23, 260, 'linear'); key(fr, 'x', 29, 680); key(fr, 'x', 31, 680, 'linear'); key(fr, 'x', 37, 1100);
  b.scene(s3, 22, 38);
  // 4 · end card
  const s4 = [b.bg('Saffron glow'), b.text('తదుపరి: మంత్రం 3', 640, 230, 70, '#7B241C'), b.el('Subscribe button', 640, 420, 110), b.el('Diya lamp', 220, 560, 170), b.el('Diya lamp', 1060, 560, 170)];
  anim(s4[1], 'down', 38.4, 0.8, W, H); anim(anim(s4[2], 'pop', 39.2, 0.8, W, H), 'pulse', 41, 0.8, W, H); b.scene(s4, 38, null);
  b.sfx('ding', 39.2, 0.6); b.sfx('bell', 38.2, 0.5);
  // scene changes
  [7, 22, 38].forEach(t => b.fx('fade', t - 0.5, t + 0.5));
  b.gen('bansuri', 'mohanam', 0.45);
  return b.p; });
tpl('Spiritual', 'Shloka of the day', '16:9', () => { const b = Builder('16:9', 9), W = b.W, H = b.H;
  b.bg('Saffron glow');
  anim(b.el('Frame border', 640, 360, 640), 'fadein', 0, 1, W, H);
  anim(b.el('Diya lamp', 180, 560, 200), 'up', 0.3, 1, W, H);
  anim(b.el('Diya lamp', 1100, 560, 200), 'up', 0.5, 1, W, H);
  anim(b.text('ఈ రోజు శ్లోకం', 640, 150, 56, '#7B241C'), 'down', 0.6, 0.9, W, H);
  anim(b.text('ఓం సహనావవతు\nసహనౌ భునక్తు', 640, 350, 64, '#4A2C0A'), 'fadein', 1.4, 1.2, W, H);
  b.music('drone'); b.sfx('bell', 1.4, 0.7);
  anim(b.text('Your meaning here', 640, 530, 34, '#A04000'), 'fadein', 2.6, 1, W, H);
  return b.p; });

// ================================================================= INSURANCE & BUSINESS
tpl('Insurance & business', '3 reasons to protect your family', '16:9', () => { const b = Builder('16:9', 10), W = b.W, H = b.H;
  b.bg('Clean white');
  anim(setText(b.el('Title bar', 640, 90, 84), 'Protect your family'), 'down', 0.2, 0.8, W, H);
  anim(b.el('Family protection', 1000, 430, 420), 'pop', 0.8, 1, W, H);
  b.sfx('pop', 0.8); [1.8, 2.8, 3.8].forEach(t => b.sfx('ding', t, 0.6));
  ['Income protection', "Children's education", 'Peace of mind'].forEach((t, i) => anim(setText(b.el('Tick list item', 400, 290 + i * 120, 70), t), 'left', 1.8 + i, 0.8, W, H));
  anim(b.el('Shield (protection)', 1180, 610, 120), 'pop', 4.8, 0.8, W, H);
  anim(b.text('Talk to your advisor today', 400, 660, 36, '#1B4F72'), 'fadein', 5.6, 1, W, H);
  return b.p; });
tpl('Insurance & business', 'Advisor introduction', '16:9', () => { const b = Builder('16:9', 8), W = b.W, H = b.H;
  b.bg('Blue gradient');
  anim(b.el('Insurance advisor', 300, 420, 480), 'left', 0.3, 1, W, H);
  b.sfx('whoosh', 0.3, 0.7); b.sfx('whoosh', 2.0, 0.6);
  anim(b.text('Your trusted insurance advisor', 820, 230, 50, '#FFFFFF'), 'right', 0.9, 0.9, W, H);
  anim(b.text('Life · Health · Family protection', 820, 310, 32, '#D6EAF8'), 'fadein', 1.5, 0.8, W, H);
  anim(b.el('Lower third (name strip)', 820, 500, 100), 'left', 2.0, 0.9, W, H);
  anim(b.el('Shield (protection)', 1150, 640, 100), 'pop', 2.8, 0.8, W, H);
  return b.p; });
tpl('Insurance & business', 'Special offer (Reel)', '9:16', () => { const b = Builder('9:16', 7), W = b.W, H = b.H;
  b.bg('Saffron glow');
  anim(anim(b.el('Badge "NEW"', 800, 320, 260), 'pop', 0.3, 0.8, W, H), 'pulse', 3.5, 1, W, H);
  anim(b.text('SPECIAL PLAN', 540, 620, 112, '#7B241C'), 'zoomout', 0.8, 0.9, W, H);
  b.sfx('pop', 0.3); b.sfx('whoosh', 0.8, 0.7); b.sfx('boing', 2.6, 0.6);
  anim(b.text("Secure your family's future", 540, 790, 54, '#4A2C0A'), 'fadein', 1.4, 0.8, W, H);
  anim(b.el('Money', 540, 1130, 360), 'up', 1.8, 1, W, H);
  anim(b.el('Arrow', 540, 1440, 130, {rot:90}), 'bounce', 2.6, 1, W, H);
  anim(anim(setText(b.el('Title bar', 540, 1660, 150), 'Call now'), 'up', 3.0, 0.8, W, H), 'pulse', 4.5, 1, W, H);
  return b.p; });
tpl('Insurance & business', 'Thank you message', '16:9', () => { const b = Builder('16:9', 6), W = b.W, H = b.H;
  b.bg('Saffron glow');
  anim(anim(anim(b.el('Heart', 640, 290, 250), 'pop', 0.3, 0.9, W, H), 'pulse', 2.0, 0.8, W, H), 'pulse', 3.4, 0.8, W, H);
  anim(b.text('Thank you for your trust!', 640, 510, 64, '#7B241C'), 'up', 0.9, 0.9, W, H);
  b.sfx('pop', 0.3); b.sfx('sparkle', 1.2, 0.7);
  anim(b.text('ధన్యవాదాలు', 640, 600, 48, '#A04000'), 'fadein', 1.6, 0.8, W, H);
  anim(b.el('Confetti', 640, 360, 720, {layer:2}), 'fadein', 1.2, 1, W, H);
  return b.p; });

// ================================================================= YOUTUBE & SOCIAL
tpl('YouTube & social', 'Channel intro', '16:9', () => { const b = Builder('16:9', 5), W = b.W, H = b.H;
  b.bg('Purple gradient');
  anim(b.el('Light rays', 640, 360, 720), 'fadein', 0, 1.2, W, H);
  anim(b.el('Glow', 640, 330, 520), 'pop', 0.2, 1, W, H);
  anim(b.text('Your Channel', 640, 330, 110, '#FFFFFF'), 'zoomout', 0.6, 0.9, W, H);
  b.sfx('whoosh', 0.5); b.sfx('sparkle', 1.0, 0.8);
  anim(b.text('Subscribe for more', 640, 450, 40, '#F9E79F'), 'fadein', 1.4, 0.8, W, H);
  anim(anim(b.el('Sparkles', 640, 170, 220), 'pop', 1.0, 0.8, W, H), 'spin', 2.0, 3, W, H);
  return b.p; });
tpl('YouTube & social', 'Subscribe end screen', '16:9', () => { const b = Builder('16:9', 6), W = b.W, H = b.H;
  b.bg('Blue gradient');
  anim(b.text('Thanks for watching!', 640, 190, 72, '#FFFFFF'), 'down', 0.2, 0.9, W, H);
  b.sfx('ding', 0.8, 0.7);
  anim(anim(anim(b.el('Subscribe button', 640, 390, 110), 'pop', 0.8, 0.8, W, H), 'pulse', 2.0, 0.8, W, H), 'pulse', 3.6, 0.8, W, H);
  anim(b.el('Highlight circle', 640, 390, 330), 'fadein', 1.4, 0.8, W, H);
  anim(b.text('New videos every week', 640, 560, 36, '#D6EAF8'), 'fadein', 1.8, 0.8, W, H);
  return b.p; });
tpl('YouTube & social', 'Top 5 list (Shorts)', '9:16', () => { const b = Builder('9:16', 10), W = b.W, H = b.H;
  b.bg('Blue gradient');
  anim(b.text('Top 5', 540, 230, 140, '#F9E79F'), 'pop', 0.2, 0.9, W, H);
  anim(b.text('tips for your topic', 540, 360, 54, '#FFFFFF'), 'fadein', 0.8, 0.8, W, H);
  for(let i = 0; i < 5; i++){ const y = 600 + i * 250, t = 1.4 + i * 1.3;
    anim(setText(b.el('Number badge', 190, y, 140), String(i + 1)), 'left', t, 0.7, W, H);
    anim(b.text('Point ' + (i + 1), 620, y, 66, '#FFFFFF'), 'right', t + 0.15, 0.7, W, H); b.sfx('pop', t, 0.7); }
  return b.p; });
tpl('YouTube & social', 'Quote post (square)', '1:1', () => { const b = Builder('1:1', 6), W = b.W, H = b.H;
  b.bg('Saffron glow');
  anim(setText(b.el('Quote card', 540, 480, 420), null, 'Your quote here', '- Name'), 'pop', 0.4, 1, W, H);
  anim(b.el('Lotus', 540, 920, 200), 'up', 1.2, 1, W, H);
  return b.p; });

// ================================================================= GREETINGS
tpl('Greetings', 'Diwali greeting', '16:9', () => { const b = Builder('16:9', 7), W = b.W, H = b.H;
  b.bg('Night sky');
  [170, 405, 640, 875, 1110].forEach((x, i) => anim(b.el('Diya lamp', x, 600, 150), 'pop', 0.3 + i * 0.3, 0.7, W, H));
  anim(b.text('దీపావళి శుభాకాంక్షలు', 640, 250, 84, '#FFD54F'), 'zoomout', 1.9, 1, W, H);
  b.sfx('sparkle', 1.9, 0.8); b.sfx('applause', 3.2, 0.5);
  anim(b.text('Happy Diwali', 640, 360, 46, '#FFFFFF'), 'fadein', 2.7, 0.8, W, H);
  anim(b.el('Sparkles', 640, 110, 170), 'pulse', 3.0, 1.2, W, H);
  anim(b.el('Confetti', 640, 360, 720, {layer:2}), 'fadein', 3.2, 1, W, H);
  return b.p; });
tpl('Greetings', 'Sankranti greeting', '16:9', () => { const b = Builder('16:9', 8), W = b.W, H = b.H;
  b.bg('Green fields');
  anim(b.el('Sun with rays', 1080, 150, 200), 'rise', 0, 3, W, H);
  anim(b.el('Kite', 240, 180, 200, {rot:-15}), 'float', 0, 8, W, H);
  anim(b.el('Kite', 470, 120, 150, {rot:10}), 'float', 0.7, 7, W, H);
  b.el('Village hut', 930, 470, 170);
  anim(b.el('Cow', 360, 560, 210), 'left', 0.6, 1.4, W, H);
  b.el('Grass & flowers', 640, 680, 90);
  anim(b.text('సంక్రాంతి శుభాకాంక్షలు', 700, 300, 74, '#B03A2E'), 'down', 1.6, 1, W, H);
  b.sfx('birds', 0.3, 0.7);
  return b.p; });
tpl('Greetings', 'Happy birthday', '16:9', () => { const b = Builder('16:9', 7), W = b.W, H = b.H;
  b.bg('Purple gradient');
  anim(b.el('Gift box', 640, 450, 270), 'bounce', 0.3, 1.2, W, H);
  b.music('happy'); b.sfx('boing', 0.5, 0.7); b.sfx('applause', 1.6, 0.6);
  anim(b.text('Happy Birthday!', 640, 170, 96, '#F9E79F'), 'pop', 1.3, 0.9, W, H);
  anim(b.text('Name', 640, 650, 44, '#FFFFFF'), 'fadein', 2.0, 0.8, W, H);
  anim(b.el('Confetti', 640, 360, 720, {layer:2}), 'fadein', 1.6, 1, W, H);
  anim(b.el('Sparkles', 260, 330, 200), 'pulse', 2.4, 1.2, W, H);
  anim(b.el('Sparkles', 1020, 330, 200), 'pulse', 2.8, 1.2, W, H);
  return b.p; });
tpl('Greetings', 'Good morning (Reel)', '9:16', () => { const b = Builder('9:16', 6), W = b.W, H = b.H;
  b.bg('Green fields');
  anim(b.el('Sun with rays', 540, 700, 360), 'rise', 0, 2.5, W, H);
  anim(b.el('Lotus', 540, 1500, 330), 'up', 1.0, 1, W, H);
  anim(b.text('శుభోదయం', 540, 330, 140, '#B03A2E'), 'pop', 1.4, 0.9, W, H);
  anim(b.text('Have a blessed day', 540, 470, 56, '#5D4037'), 'fadein', 2.1, 0.8, W, H);
  b.music('flute'); b.sfx('birds', 0.4, 0.7);
  return b.p; });

window.VG_TEMPLATES = TPL;
window.VG_TPL = {Builder, anim, key, setText};
})();
