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
const musicClip = (m, d) => ({id:aid(), name:MUSIC_NAME[m] || m, kind:'music', synth:m, start:0, len:d, volume:0.8, fadeIn:1.5, fadeOut:2});
const SIZE = {'16:9':[1280, 720], '9:16':[1080, 1920], '1:1':[1080, 1080]};

// ---------------------------------------------------------------- builder
function Builder(ratio, duration){
  const [W, H] = SIZE[ratio];
  const id = () => Math.random().toString(36).slice(2, 10);
  const layer = name => ({id:id(), name, visible:true, locked:false, opacity:1, objects:[]});
  const p = {app:'videogen-animator', version:3, width:W, height:H, background:'#ffffff', duration, fps:30, loop:true, audio:[],
             layers:[layer('Background'), layer('Elements'), layer('Text')]};
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
      p.layers[opts.layer ?? 2].objects.push(o); return o;
    }
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
})();
