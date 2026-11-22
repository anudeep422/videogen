/* ==========================================================================
   VideoGen Animator – element library.
   Every element is a "group" of simple editable shapes (rect, ellipse, path,
   text), drawn by code. No images, no AI. Add your own with add(cat, name, fn).
   Coordinates: each element is drawn around (0,0), roughly 200-300 px tall.
   ========================================================================== */
(function(){
const LIB = [];
const add = (cat, name, make, opts = {}) => LIB.push({cat, name, make, ...opts});
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- shape helpers
const base = o => Object.assign({rotation:0, scaleX:1, scaleY:1, opacity:1}, o);
const rect = (x, y, w, h, fill, o = {}) => base({type:'rect', x, y, w, h, fill, stroke:o.stroke || null, width:o.lw || 0, radius:o.r || 0, rotation:o.rot || 0, opacity:o.op ?? 1});
const ell = (x, y, rx, ry, fill, o = {}) => base({type:'ellipse', x, y, w:rx * 2, h:ry * 2, fill, stroke:o.stroke || null, width:o.lw || 0, rotation:o.rot || 0, opacity:o.op ?? 1});
const poly = (pts, fill, o = {}) => base({type:'path', x:0, y:0, points:pts, closed:true, sharp:!o.smooth, fill, stroke:o.stroke || null, width:o.lw || 0, opacity:o.op ?? 1});
const blob = (pts, fill, o = {}) => poly(pts, fill, {...o, smooth:true});
const line = (pts, stroke, lw, o = {}) => base({type:'path', x:0, y:0, points:pts, closed:false, sharp:!o.smooth, fill:null, stroke, width:lw, opacity:o.op ?? 1});
const curve = (pts, stroke, lw, o = {}) => line(pts, stroke, lw, {...o, smooth:true});
const txt = (text, x, y, size, fill, o = {}) => base({type:'text', x, y, text, size, fill, rotation:o.rot || 0, opacity:o.op ?? 1});
const grp = (children, o = {}) => base({type:'group', x:o.x || 0, y:o.y || 0, scaleX:o.s || 1, scaleY:o.s || 1, rotation:o.rot || 0, children});
const star = (cx, cy, ro, ri, n, fill, o = {}) => poly(Array.from({length:n * 2}, (_, i) => { const a = (i * 180 / n - 90) * D2R, r = i % 2 ? ri : ro; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }), fill, o);
const arc = (cx, cy, rx, ry, a0, a1, n = 24) => Array.from({length:n + 1}, (_, i) => { const a = (a0 + (a1 - a0) * i / n) * D2R; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const lin = (...c) => ({lin:c}), rad = (...c) => ({rad:c});
const R = (i, k = 1) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };   // repeatable random 0..1

// ---------------------------------------------------------------- people
const SKIN = '#9A6340', HAIR = '#1E1611';
function face(o = {}){
  const sk = o.skin || SKIN, out = [];
  out.push(rect(0, -58, 14, 16, sk));                                  // neck
  out.push(ell(0, -80, 19, 22, sk));                                   // head
  if(o.hair !== false) out.push(blob([[-19, -80], [-20, -96], [-8, -104], [8, -104], [20, -96], [19, -80], [12, -92], [-12, -92]], o.hairCol || HAIR));
  if(o.bun) out.push(ell(16, -88, 9, 9, o.hairCol || HAIR));
  if(o.longHair) out.push(blob([[-19, -84], [-22, -60], [-14, -50], [-12, -78]], o.hairCol || HAIR), blob([[19, -84], [22, -60], [14, -50], [12, -78]], o.hairCol || HAIR));
  if(o.closedEyes){ out.push(curve([[-11, -80], [-7, -77], [-3, -80]], '#2b1a10', 2), curve([[3, -80], [7, -77], [11, -80]], '#2b1a10', 2)); }
  else out.push(ell(-7, -81, 2.4, 2.8, '#1b1210'), ell(7, -81, 2.4, 2.8, '#1b1210'));
  out.push(curve([[-6, -69], [0, -65], [6, -69]], '#5a2e1e', 2));      // smile
  if(o.bindi) out.push(ell(0, -91, 2.2, 2.2, '#C0392B'));
  if(o.tilak) out.push(rect(-3, -94, 2, 10, '#ffffff'), rect(3, -94, 2, 10, '#ffffff'), rect(0, -93, 2, 9, '#C0392B'));
  if(o.moustache) out.push(blob([[-9, -72], [0, -74], [9, -72], [0, -70]], o.hairCol || HAIR));
  if(o.beard) out.push(blob([[-17, -78], [-16, -60], [-8, -42], [0, -36], [8, -42], [16, -60], [17, -78], [8, -70], [0, -68], [-8, -70]], o.beardCol || '#ECECEC'));
  if(o.turban) out.push(blob([[-21, -86], [-22, -100], [-10, -110], [10, -110], [22, -100], [21, -86], [0, -92]], o.turban), ell(14, -100, 6, 6, o.turban));
  if(o.earring) out.push(ell(-19, -74, 2, 2, '#D4AF37'), ell(19, -74, 2, 2, '#D4AF37'));
  return out;
}
function standing(o = {}){
  const sk = o.skin || SKIN, top = o.top || '#2980B9', bot = o.bottom || '#34495E', ch = [];
  // legs & feet
  if(o.saree){
    ch.push(poly([[-22, -2], [22, -2], [32, 100], [-32, 100]], o.saree), rect(0, 95, 64, 10, o.border || '#E7B416'));
    ch.push(ell(-12, 103, 9, 4, '#3a2a20'), ell(12, 103, 9, 4, '#3a2a20'));
  } else if(o.dhoti){
    ch.push(poly([[-22, -2], [22, -2], [26, 80], [-26, 80]], o.dhoti), rect(-10, 90, 9, 22, sk), rect(10, 90, 9, 22, sk), ell(-12, 102, 9, 4, '#3a2a20'), ell(12, 102, 9, 4, '#3a2a20'));
  } else {
    ch.push(rect(-10, 50, 17, 104, bot, {r:4}), rect(10, 50, 17, 104, bot, {r:4}), ell(-12, 102, 11, 5, '#2b2b2b'), ell(12, 102, 11, 5, '#2b2b2b'));
  }
  // arms behind torso
  const armL = o.armUp ? [[-22, -48], [-36, -70], [-24, -102]] : [[-22, -48], [-34, -18], [-36, 8]];
  ch.push(curve(armL, o.sleeve || top, 12), curve([[22, -48], [34, -18], [36, 8]], o.sleeve || top, 12));
  ch.push(ell(o.armUp ? -24 : -36, o.armUp ? -104 : 10, 6, 6, sk), ell(36, 10, 6, 6, sk));
  // torso
  ch.push(poly([[-25, -54], [25, -54], [22, 4], [-22, 4]], top));
  if(o.saree) ch.push(poly([[-18, 0], [-6, 0], [20, -54], [8, -54]], o.saree), rect(0, 2, 44, 6, sk));
  if(o.tie) ch.push(poly([[0, -50], [5, -44], [3, -10], [0, -4], [-3, -10], [-5, -44]], o.tie));
  if(o.suit) ch.push(poly([[-25, -54], [-6, -54], [-2, -20], [-22, 4]], o.suit), poly([[25, -54], [6, -54], [2, -20], [22, 4]], o.suit));
  if(o.badge) ch.push(rect(-14, -36, 12, 8, '#F4F6F7', {r:2}), rect(-14, -36, 12, 2, '#C0392B'));
  if(o.shawl) ch.push(poly([[-25, -54], [-12, -54], [22, 4], [10, 4]], o.shawl));
  ch.push(...face(o));
  if(o.pot) ch.push(ell(0, -116, 16, 14, o.pot), rect(0, -132, 12, 6, o.pot));
  if(o.stick) ch.push(line([[42, -20], [50, 104]], '#6E4B2A', 4));
  if(o.briefcase) ch.push(rect(40, 22, 30, 22, '#5D4037', {r:3}), rect(40, 10, 12, 4, '#3E2723', {r:2}));
  return grp(ch, {s:o.scale || 1});
}
function sitting(o = {}){
  const sk = o.skin || SKIN, robe = o.robe || '#F39C12', ch = [];
  if(o.halo) ch.push(ell(0, -78, 52, 52, rad('#FFF4C2', '#FFE08A00')));
  ch.push(ell(0, 62, 72, 22, shade(robe, 0.85)));                               // crossed legs
  ch.push(ell(-38, 66, 12, 7, sk), ell(38, 66, 12, 7, sk));                     // feet
  ch.push(blob([[-44, 60], [-38, 10], [-28, -30], [-20, -50], [20, -50], [28, -30], [38, 10], [44, 60]], robe));
  ch.push(poly([[-24, -48], [-8, -48], [30, 30], [16, 34]], shade(robe, 0.78)));  // shoulder cloth
  if(o.namaste){ ch.push(curve([[-22, -36], [-24, -6], [-4, -18]], sk, 10), curve([[22, -36], [24, -6], [4, -18]], sk, 10), poly([[-4, -34], [4, -34], [3, -12], [-3, -12]], sk)); }
  else ch.push(curve([[-24, -38], [-36, 10], [-34, 46]], sk, 10), curve([[24, -38], [36, 10], [34, 46]], sk, 10), ell(-34, 50, 7, 6, sk), ell(34, 50, 7, 6, sk));
  const f = face({...o, hairCol:o.hairCol || '#5d5d5d'}).map(s2 => { s2 = {...s2}; if(s2.points) s2.points = s2.points.map(([x, y]) => [x, y + 24]); else s2.y += 24; return s2; });
  ch.push(...f);
  if(o.topknot) ch.push(ell(0, -84, 11, 10, o.hairCol || '#5d5d5d'));
  return grp(ch, {s:o.scale || 1});
}
function shade(c, f){ const n = parseInt(c.slice(1, 7), 16); const r = Math.min(255, Math.round((n >> 16 & 255) * f)), g = Math.min(255, Math.round((n >> 8 & 255) * f)), b = Math.min(255, Math.round((n & 255) * f));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''); }

add('People', 'Rishi meditating', () => sitting({halo:true, closedEyes:true, beard:true, tilak:true, topknot:true, hair:false, longHair:true, robe:'#E67E22', beardCol:'#E0E0E0'}));
add('People', 'Guru & disciple', () => grp([
  {...sitting({halo:true, closedEyes:false, beard:true, tilak:true, topknot:true, hair:false, longHair:true, robe:'#E67E22'}), x:-80},
  {...sitting({namaste:true, robe:'#F5CBA7', hairCol:HAIR, scale:0.7}), x:95, y:24}]));
add('People', 'Village woman with pot', () => standing({saree:'#C8102E', border:'#E7B416', top:'#1E8449', sleeve:'#1E8449', bindi:true, bun:true, earring:true, armUp:true, pot:'#C9A227'}));
add('People', 'Woman in saree', () => standing({saree:'#8E44AD', border:'#F1C40F', top:'#E67E22', bindi:true, bun:true, earring:true}));
add('People', 'Farmer', () => standing({dhoti:'#FFFFFF', top:'#F4F1E8', shawl:'#B03A2E', turban:'#C0392B', moustache:true, stick:true, skin:'#8B5A3C'}));
add('People', 'Grandfather', () => standing({dhoti:'#FFFFFF', top:'#FDFEFE', shawl:'#D5DBDB', hair:false, beard:true, moustache:true, stick:true, tilak:true}));
add('People', 'Boy', () => standing({top:'#E74C3C', bottom:'#2C3E50', scale:0.68}));
add('People', 'Girl', () => standing({saree:'#F06292', border:'#FFEB3B', top:'#F06292', longHair:true, bindi:true, scale:0.68}));
add('People', 'Family', () => grp([
  {...standing({top:'#2E86C1', bottom:'#1B2631', moustache:true}), x:-70},
  {...standing({saree:'#C0392B', border:'#F4D03F', top:'#C0392B', bindi:true, bun:true, earring:true}), x:0},
  {...standing({top:'#F39C12', bottom:'#1F618D', scale:0.62}), x:60, y:40},
  {...standing({saree:'#AF7AC5', border:'#F7DC6F', top:'#AF7AC5', longHair:true, scale:0.55}), x:105, y:47}]));
add('People', 'Office person', () => standing({top:'#FDFEFE', sleeve:'#FDFEFE', bottom:'#2C3E50', tie:'#C0392B'}));
add('People', 'Insurance advisor', () => standing({top:'#FDFEFE', sleeve:'#1B4F72', suit:'#1B4F72', bottom:'#1B4F72', tie:'#F39C12', badge:true, briefcase:true}));
add('People', 'Student', () => grp([standing({top:'#5DADE2', bottom:'#1B2631', scale:0.8}), rect(-24, 2, 26, 32, '#C0392B', {r:3}), rect(-24, -12, 26, 5, '#922B21', {r:2})]));

// ---------------------------------------------------------------- spiritual
add('Spiritual', 'Om symbol', () => grp([ell(0, 0, 110, 110, rad('#FFE6A0', '#FFD06600')), txt('ॐ', 0, 6, 170, '#E67E22')]));
add('Spiritual', 'Diya lamp', () => grp([
  ell(0, -40, 70, 80, rad('#FFE9A0cc', '#FFC85000')),
  blob([[-70, 10], [-40, 40], [0, 50], [40, 40], [80, 4], [40, 14], [0, 18], [-40, 14]], '#B5562E'),
  ell(0, 12, 66, 12, '#7E3A1E'), ell(0, 10, 58, 8, '#D4A017'),
  line([[0, 8], [0, -6]], '#4a3020', 3),
  blob([[0, -78], [10, -50], [12, -28], [6, -10], [0, -6], [-6, -10], [-12, -28], [-10, -50]], lin('#FFF59D', '#FF9800', '#E65100')),
  blob([[0, -50], [5, -32], [3, -16], [0, -12], [-3, -16], [-5, -32]], '#FFFDE7')]));
add('Spiritual', 'Lotus', () => { const ch = [ell(0, 50, 110, 22, '#2E7D32'), ell(-70, 44, 50, 14, '#388E3C', {rot:-8}), ell(70, 44, 50, 14, '#388E3C', {rot:8})];
  for(const [a, l, c] of [[-70, 70, '#F48FB1'], [70, 70, '#F48FB1'], [-45, 80, '#F06292'], [45, 80, '#F06292'], [-20, 88, '#EC407A'], [20, 88, '#EC407A'], [0, 92, '#F8BBD0']])
    ch.push(base({type:'path', x:0, y:30, rotation:a, points:[[0, 0], [-l * 0.28, -l * 0.5], [0, -l], [l * 0.28, -l * 0.5]], closed:true, sharp:false, fill:c, stroke:'#C2185B', width:1.5}));
  ch.push(ell(0, 18, 16, 8, '#FDD835')); return grp(ch); });
add('Spiritual', 'Temple', () => { const st = '#E8D5B0', ch = [rect(0, 95, 220, 18, shade(st, .85)), rect(0, 60, 170, 56, st), rect(0, 70, 34, 40, '#8B2E1F', {r:3})];
  for(let i = -3; i <= 3; i++) if(i) ch.push(rect(i * 22, 60, 4, 56, '#C0392B'));
  for(let k = 0; k < 6; k++){ const tw = 150 - k * 22, ty = 32 - k * 26; ch.push(poly([[-tw / 2, ty], [tw / 2, ty], [tw / 2 - 8, ty - 26], [-tw / 2 + 8, ty - 26]], shade(st, 1 - k * .04)));
    for(let i = 0; i < Math.floor(tw / 18); i++) ch.push(rect(-tw / 2 + 12 + i * 18, ty - 13, 6, 11, shade(st, .72))); }
  ch.push(ell(0, -132, 14, 9, '#D4AF37'), rect(0, -148, 4, 18, '#D4AF37'), line([[100, 90], [100, -60]], '#6E4B2A', 3), poly([[100, -60], [140, -50], [100, -38]], '#F39C12'));
  return grp(ch); });
add('Spiritual', 'Kalasham', () => grp([
  ell(0, 40, 62, 58, lin('#F4D03F', '#B7950B')), rect(0, -22, 52, 14, '#B7950B', {r:4}), ell(0, -28, 34, 6, '#D4AC0D'),
  ...[-60, -30, 0, 30, 60].map(a => base({type:'ellipse', x:Math.sin(a * D2R) * 34, y:-40 - Math.cos(a * D2R) * 14, w:20, h:58, fill:'#2E7D32', stroke:'#1B5E20', width:1.5, rotation:a})),
  ell(0, -66, 30, 34, '#8D6E63'), ell(-8, -78, 10, 12, '#A1887F'),
  ell(0, 34, 10, 10, '#C0392B'), line([[-40, 10], [40, 10]], '#C0392B', 4), line([[-44, 64], [44, 64]], '#C0392B', 4)]));
add('Spiritual', 'Shiva lingam', () => grp([
  blob([[-110, 70], [-90, 40], [60, 40], [130, 52], [132, 62], [60, 76], [-90, 84]], '#5D5D5D'), ell(-10, 48, 92, 18, '#757575'),
  rect(-10, -10, 70, 120, lin('#4a4a4a', '#2b2b2b'), {r:35}),
  line([[-36, -26], [16, -26]], '#ECEFF1', 4), line([[-38, -16], [18, -16]], '#ECEFF1', 4), line([[-36, -6], [16, -6]], '#ECEFF1', 4), ell(-10, -16, 4, 4, '#C0392B'),
  ...[-20, 0, 20].map((a, i) => base({type:'ellipse', x:-10 + (i - 1) * 14, y:-66, w:14, h:30, fill:'#43A047', rotation:a}))]));
add('Spiritual', 'Conch (shankha)', () => grp([
  blob([[-110, 10], [-60, -40], [10, -56], [80, -40], [110, -6], [80, 30], [10, 46], [-60, 34]], lin('#FFFDF5', '#E8DCC8')),
  curve([[-80, 0], [-30, -20], [30, -24], [80, -12]], '#C8B89A', 3), curve([[-70, 12], [-20, 4], [40, 2], [90, 4]], '#C8B89A', 3),
  blob([[80, -40], [130, -22], [136, 0], [110, -6]], '#F5CBA7'), ell(-104, 10, 10, 16, '#F0B27A')]));
add('Spiritual', 'Rudraksha mala', () => { const ch = []; for(let i = 0; i < 30; i++){ const a = i / 30 * Math.PI * 2; ch.push(ell(Math.cos(a) * 80, Math.sin(a) * 80 - 20, 9, 9, i % 2 ? '#6D3B1F' : '#7B4423', {stroke:'#4E2A15', lw:1.5})); }
  ch.push(ell(0, 66, 11, 11, '#6D3B1F'), poly([[-8, 74], [8, 74], [14, 120], [-14, 120]], '#C0392B')); return grp(ch); });
add('Spiritual', 'Sun with rays', () => { const ch = []; for(let i = 0; i < 16; i++) ch.push(base({type:'path', x:0, y:0, rotation:i * 22.5, points:[[-12, -62], [0, -110], [12, -62]], closed:true, sharp:true, fill:'#F9A825'}));
  ch.push(ell(0, 0, 58, 58, rad('#FFF59D', '#FBC02D'))); return grp(ch); });
add('Spiritual', 'Peacock feather', () => grp([
  curve([[0, 140], [6, 40], [0, -60]], '#5D4037', 3),
  ell(0, -40, 40, 90, '#2E7D32', {op:.9}), ell(0, -70, 26, 34, '#00897B'), ell(0, -72, 18, 24, '#1565C0'), ell(0, -74, 10, 14, '#0D47A1'), ell(0, -76, 5, 7, '#FFD600')]));
add('Spiritual', 'Trishul', () => grp([rect(0, 30, 8, 220, '#9E9E9E'),
  curve([[-50, -100], [-46, -50], [0, -40], [46, -50], [50, -100]], '#BDBDBD', 8), poly([[-50, -100], [-58, -80], [-42, -80]], '#BDBDBD'), poly([[50, -100], [58, -80], [42, -80]], '#BDBDBD'),
  poly([[0, -130], [-10, -80], [10, -80]], '#BDBDBD'), rect(0, -20, 30, 10, '#C0392B', {r:3}), ell(0, 10, 12, 10, '#8D6E63')]));
add('Spiritual', 'Holy scripture', () => grp([rect(0, 0, 220, 70, '#C9A86A', {r:10}), ...[-20, 0, 20].map(y => line([[-90, y], [90, y]], '#8D6E63', 2)),
  line([[-112, -40], [-112, 40]], '#6E4B2A', 6), line([[112, -40], [112, 40]], '#6E4B2A', 6), line([[-112, 0], [-140, 30]], '#C0392B', 3), line([[-112, 0], [-130, 36]], '#C0392B', 3)]));

// ---------------------------------------------------------------- nature
add('Nature', 'Tree', () => grp([rect(0, 60, 22, 100, '#6B4A2E', {r:4}), line([[0, 30], [-30, -10]], '#6B4A2E', 8), line([[0, 20], [30, -20]], '#6B4A2E', 8),
  ell(0, -40, 70, 55, '#3C8A3A'), ell(-50, -10, 45, 38, '#357A33'), ell(50, -10, 45, 38, '#357A33'), ell(-20, -70, 40, 32, '#4CA049'), ell(28, -66, 38, 30, '#46994A')]));
add('Nature', 'Coconut palm', () => { const ch = [curve([[-10, 150], [0, 40], [24, -70]], '#7A5C3A', 12)];
  for(let f = 0; f < 11; f++){ const a = (-175 + f * 17) * D2R, L = 125, ex = 24 + Math.cos(a) * L, ey = -70 + Math.sin(a) * L * .45 + (Math.abs(f - 5) > 2 ? 55 : 12), mx = 24 + Math.cos(a) * L * .55, my = -70 + Math.sin(a) * L * .5 - 16;
    ch.push(blob([[24, -70], [mx, my - 9], [ex, ey], [mx, my + 9]], f % 2 ? '#2F7A35' : '#3A8C3E', {stroke:'#245E28', lw:1.5})); }
  ch.push(ell(18, -62, 7, 7, '#6B4A2A'), ell(30, -60, 7, 7, '#6B4A2A'), ell(24, -54, 7, 7, '#5a3d22')); return grp(ch); });
add('Nature', 'Banyan tree', () => { const ch = [rect(0, 50, 50, 140, '#5D4037', {r:10})];
  for(let i = -5; i <= 5; i++) if(Math.abs(i) > 1) ch.push(line([[i * 26, -30], [i * 27, 120]], '#795548', 2));
  [[-110, -50, 70, 45], [110, -50, 70, 45], [-60, -90, 70, 50], [60, -90, 70, 50], [0, -110, 80, 55], [0, -50, 110, 50]].forEach(([x, y, rx, ry], i) => ch.push(ell(x, y, rx, ry, i % 2 ? '#2E6B2E' : '#357A33')));
  return grp(ch); });
add('Nature', 'Mountains', () => grp([poly([[-200, 90], [-90, -60], [20, 90]], '#7F9DB0'), poly([[-120, 90], [40, -110], [200, 90]], '#5E7F92'),
  poly([[40, -110], [8, -68], [24, -74], [40, -62], [56, -76], [72, -66]], '#FFFFFF'), poly([[-90, -60], [-114, -28], [-98, -34], [-86, -26], [-72, -36]], '#FFFFFF')]));
add('Nature', 'River', () => grp([blob([[-220, -20], [-120, -40], [0, -10], [120, -40], [220, -20], [220, 30], [120, 10], [0, 40], [-120, 10], [-220, 30]], lin('#7FC4E8', '#2E86C1')),
  curve([[-160, -6], [-120, -14], [-80, -6]], '#FFFFFF', 3, {op:.6}), curve([[20, 14], [60, 6], [100, 14]], '#FFFFFF', 3, {op:.6})]));
add('Nature', 'Cloud', () => grp([ell(-50, 10, 50, 36, '#FFFFFF'), ell(0, -10, 60, 48, '#FFFFFF'), ell(55, 8, 48, 36, '#FFFFFF'), rect(0, 30, 200, 30, '#FFFFFF', {r:15})]));
add('Nature', 'Moon', () => grp([ell(0, 0, 100, 100, rad('#FFFDE7aa', '#FFF9C400')), blob([...arc(0, 0, 60, 60, 50, 310), ...arc(34, 0, 52, 56, 296, 64)], '#FFF59D')]));
add('Nature', 'Stars', () => grp([star(0, 0, 30, 12, 5, '#FFEB3B'), star(-90, 40, 18, 7, 5, '#FFF59D'), star(80, -30, 22, 9, 5, '#FFF176'), star(60, 60, 12, 5, 5, '#FFFDE7'), star(-60, -50, 14, 6, 5, '#FFFDE7')]));
add('Nature', 'Birds', () => grp([[0, 0, 1], [60, 30, .8], [-55, 25, .7], [110, 0, .6]].map(([x, y, s]) => curve([[x - 30 * s, y - 8 * s], [x - 14 * s, y - 14 * s], [x, y], [x + 14 * s, y - 14 * s], [x + 30 * s, y - 8 * s]], '#2B2B33', 4 * s))));
add('Nature', 'Cow', () => grp([
  line([[-70, -10], [-86, 30]], '#8D8D8D', 3), ell(-88, 34, 5, 7, '#555'),
  ...[[-48, 1], [-30, 0], [40, 1], [56, 0]].map(([x, b]) => rect(x, 40, 12, 56, b ? '#E0DCD3' : '#F2EEE6', {r:3})),
  ...[-48, -30, 40, 56].map(x => rect(x, 68, 12, 8, '#4E342E')),
  ell(0, 0, 76, 38, '#F2EEE6', {stroke:'#B9B2A6', lw:2}), ell(-30, -6, 22, 16, '#8D6E63'), ell(30, 14, 18, 12, '#8D6E63'), ell(42, -30, 16, 12, '#ECE7DD'),
  ell(-14, 34, 14, 8, '#F8BBD0'),
  ell(84, -22, 24, 17, '#F2EEE6', {rot:25, stroke:'#B9B2A6', lw:2}), ell(100, -12, 10, 8, '#D7B8A8'), ell(80, -26, 3, 3, '#222'),
  curve([[74, -36], [70, -54], [80, -60]], '#E9DFC9', 4), curve([[86, -36], [92, -54], [100, -56]], '#E9DFC9', 4), ell(66, -30, 9, 5, '#E0DCD3', {rot:-30})]));
add('Nature', 'Deer', () => grp([
  ...[[-36], [-22], [30], [44]].map(([x]) => line([[x, 10], [x + 2, 80]], '#8D5524', 7)),
  ell(0, 0, 55, 24, '#B5763A'), ...[[-20, -6], [0, 4], [16, -8], [-6, -14], [28, 6]].map(([x, y]) => ell(x, y, 4, 4, '#FFF3E0')), ell(-54, -6, 7, 9, '#FFF3E0'),
  poly([[36, -14], [52, -60], [66, -56], [52, -6]], '#B5763A'), ell(64, -66, 18, 11, '#B5763A', {rot:20}), ell(78, -62, 4, 3, '#222'), ell(56, -70, 2.5, 2.5, '#222'),
  line([[56, -76], [48, -110], [36, -122]], '#5D4037', 3), line([[50, -98], [62, -112]], '#5D4037', 3), line([[62, -76], [70, -108], [82, -118]], '#5D4037', 3), line([[68, -98], [56, -114]], '#5D4037', 3)]));
add('Nature', 'Peacock', () => { const ch = [];
  for(let i = 0; i < 13; i++){ const a = (-165 + i * 12.5) * D2R, x = Math.cos(a) * 130 - 30, y = Math.sin(a) * 120 + 10;
    ch.push(line([[-30, 10], [x, y]], '#2E7D32', 3), ell(x, y, 16, 20, '#00897B', {rot:i * 12.5 - 75}), ell(x, y, 9, 12, '#1565C0', {rot:i * 12.5 - 75}), ell(x, y, 4, 5, '#FFD600')); }
  ch.push(blob([[-60, 30], [-30, -10], [10, -20], [30, 0], [20, 40], [-20, 50]], '#1565C0'), poly([[10, -20], [26, -70], [38, -66], [30, 0]], '#1E88E5', {smooth:true}),
    ell(36, -76, 12, 10, '#1E88E5'), poly([[46, -78], [58, -74], [46, -72]], '#F9A825'), ell(38, -78, 2.5, 2.5, '#fff'),
    ...[[-6, 0], [0, -6], [6, 0]].map(([dx, dy]) => line([[34, -84], [34 + dx * 2, -100 + dy]], '#1565C0', 2)),
    line([[-10, 48], [-14, 80]], '#8D6E63', 3), line([[6, 46], [8, 80]], '#8D6E63', 3)); return grp(ch); });
add('Nature', 'Grass & flowers', () => { const ch = []; for(let i = 0; i < 24; i++){ const x = -120 + i * 10.5; ch.push(curve([[x, 30], [x + 2, 0], [x + (i % 2 ? 6 : -6), -26 - (i % 3) * 8]], i % 2 ? '#3F7F2C' : '#5A9A3A', 4)); }
  [[-80, -30, '#E91E63'], [-10, -40, '#FFEB3B'], [60, -34, '#FF5722'], [100, -26, '#9C27B0']].forEach(([x, y, c]) => { for(let k = 0; k < 5; k++){ const a = k * 72 * D2R; ch.push(ell(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 6, 6, c)); } ch.push(ell(x, y, 5, 5, '#FFF59D')); });
  return grp(ch); });

// ---------------------------------------------------------------- places
const hutParts = (x, y, s = 1, wall = '#C98B4F') => [rect(x, y, 140 * s, 80 * s, wall), rect(x, y + 36 * s, 140 * s, 8 * s, '#F2E6CF'), rect(x, y + 10 * s, 30 * s, 60 * s, '#4A2E1A', {r:3}),
  poly([[x - 92 * s, y - 34 * s], [x, y - 120 * s], [x + 92 * s, y - 34 * s]], lin('#E2C26E', '#B48A3E'))];
add('Places', 'Village hut', () => grp(hutParts(0, 0)));
add('Places', 'Ashram', () => grp([...hutParts(-40, 10, .9), rect(110, 40, 18, 60, '#6B4A2E'), ell(110, -20, 50, 40, '#3C8A3A'), ell(90, -40, 30, 26, '#4CA049'),
  ...[-150, -120, -90, -60, -30, 0, 30, 60].map(x => rect(x, 70, 6, 36, '#8D6E63')), line([[-153, 62], [63, 62]], '#8D6E63', 4), line([[-153, 80], [63, 80]], '#8D6E63', 4),
  line([[-120, -20], [-120, -110]], '#6E4B2A', 3), poly([[-120, -110], [-84, -100], [-120, -88]], '#F39C12')]));
add('Places', 'House', () => grp([rect(0, 30, 200, 130, '#F5E6CA'), poly([[-120, -30], [0, -120], [120, -30]], '#C0392B'), rect(70, -80, 22, 40, '#8E3B30'),
  rect(0, 60, 40, 70, '#6E4B2A', {r:3}), rect(-60, 20, 40, 36, '#AED6F1', {stroke:'#FFFFFF', lw:4}), rect(60, 20, 40, 36, '#AED6F1', {stroke:'#FFFFFF', lw:4}), rect(0, 97, 220, 6, '#B0A089')]));
add('Places', 'School', () => grp([rect(0, 30, 300, 120, '#F7DC6F'), poly([[-170, -30], [0, -90], [170, -30]], '#A04000'), rect(0, -46, 120, 26, '#FFFFFF', {r:4}), txt('SCHOOL', 0, -46, 20, '#1A5276'),
  ...[-110, -60, 60, 110].map(x => rect(x, 20, 32, 34, '#85C1E9', {stroke:'#fff', lw:3})), rect(0, 60, 44, 60, '#784212', {r:3}),
  line([[180, 90], [180, -120]], '#7F8C8D', 4), rect(205, -108, 50, 12, '#FF9933'), rect(205, -96, 50, 12, '#FFFFFF'), rect(205, -84, 50, 12, '#138808'), ell(205, -96, 5, 5, '#000080')]));
add('Places', 'City skyline', () => { const ch = []; const b = [[-200, 120, 60, '#5D6D7E'], [-140, 190, 50, '#34495E'], [-80, 150, 60, '#5D6D7E'], [-15, 230, 56, '#2C3E50'], [50, 170, 60, '#566573'], [115, 210, 52, '#34495E'], [175, 130, 56, '#5D6D7E']];
  for(const [x, h, w, c] of b){ ch.push(rect(x, 100 - h / 2, w, h, c)); for(let yy = 100 - h + 16; yy < 90; yy += 22) for(const dx of [-w / 4, w / 4]) ch.push(rect(x + dx, yy, 10, 12, '#F9E79F', {op:.85})); }
  return grp(ch); });
add('Places', 'Office building', () => { const ch = [rect(0, 0, 160, 300, lin('#5DADE2', '#1F618D'))]; for(let i = -2; i <= 2; i++) ch.push(line([[i * 30, -150], [i * 30, 150]], '#D6EAF8', 2, {op:.6}));
  for(let y = -130; y < 150; y += 26) ch.push(line([[-80, y], [80, y]], '#D6EAF8', 2, {op:.6})); ch.push(rect(0, 130, 50, 40, '#154360'), rect(0, -162, 100, 24, '#1B4F72')); return grp(ch); });
add('Places', 'Hospital', () => grp([rect(0, 20, 260, 180, '#FDFEFE', {stroke:'#D5D8DC', lw:3}), rect(0, -82, 140, 34, '#E74C3C', {r:4}), txt('HOSPITAL', 0, -82, 20, '#FFFFFF'),
  rect(0, -10, 60, 20, '#E74C3C'), rect(0, -10, 20, 60, '#E74C3C'), ...[-90, -50, 50, 90].map(x => rect(x, 50, 26, 26, '#AED6F1')), ...[-90, 90].map(x => rect(x, -10, 26, 26, '#AED6F1')), rect(0, 80, 50, 60, '#5DADE2')]));

// ---------------------------------------------------------------- things
add('Things', 'Books', () => grp([rect(0, 40, 200, 34, '#2980B9', {r:4}), rect(84, 40, 18, 28, '#FDFEFE'), rect(10, 6, 180, 30, '#C0392B', {r:4}), rect(88, 6, 12, 24, '#FDFEFE'), rect(-6, -26, 170, 30, '#27AE60', {r:4}), rect(70, -26, 14, 24, '#FDFEFE')]));
add('Things', 'Palm-leaf manuscript', () => grp([0, 1, 2].map(i => rect(i * 6, -i * 8, 260, 40, i === 2 ? '#E0C48A' : '#C9A86A', {r:18, stroke:'#8D6E63', lw:1.5})).concat([line([[-90, -16], [90, -16]], '#5D4037', 2), line([[-90, -6], [80, -6]], '#5D4037', 2), ell(-80, -16, 4, 4, '#5D4037'), ell(90, -16, 4, 4, '#5D4037'), curve([[-80, -16], [-100, 30], [-110, 50]], '#C0392B', 3)])));
add('Things', 'Clay pot', () => grp([ell(0, 20, 80, 70, lin('#D35400', '#873600')), rect(0, -52, 70, 24, '#A04000', {r:8}), ell(0, -64, 44, 10, '#BA4A00'), line([[-60, 0], [60, 0]], '#F5CBA7', 4), line([[-66, 20], [66, 20]], '#F5CBA7', 3)]));
add('Things', 'Bullock cart', () => grp([
  rect(-40, -36, 180, 50, lin('#8DC452', '#4E8C2E'), {r:25}), rect(-40, -6, 190, 10, '#7A5230'), line([[50, 0], [140, -20]], '#6E4B2A', 6),
  ell(-60, 30, 40, 40, null, {stroke:'#5A3A1E', lw:7}), ...[0, 36, 72, 108, 144].map(a => line([[-60 - Math.cos(a * D2R) * 36, 30 - Math.sin(a * D2R) * 36], [-60 + Math.cos(a * D2R) * 36, 30 + Math.sin(a * D2R) * 36]], '#5A3A1E', 3)),
  ell(160, 0, 50, 26, '#F2ECDF', {stroke:'#B9B2A6', lw:2}), ell(178, -24, 14, 12, '#F2ECDF'), ell(212, -8, 16, 11, '#F2ECDF', {rot:25, stroke:'#B9B2A6', lw:2}), curve([[206, -20], [200, -38], [208, -44]], '#E67E22', 4),
  ...[130, 145, 175, 190].map(x => rect(x, 40, 8, 40, '#E6E0D2'))]));
add('Things', 'Car', () => grp([rect(0, 0, 240, 60, '#C0392B', {r:20}), poly([[-70, -28], [-40, -76], [50, -76], [86, -28]], '#C0392B', {smooth:false}), poly([[-58, -30], [-34, -66], [0, -66], [0, -30]], '#AED6F1'), poly([[10, -30], [10, -66], [44, -66], [70, -30]], '#AED6F1'),
  ell(-70, 34, 28, 28, '#2C3E50'), ell(70, 34, 28, 28, '#2C3E50'), ell(-70, 34, 12, 12, '#BDC3C7'), ell(70, 34, 12, 12, '#BDC3C7'), rect(114, -6, 12, 14, '#F9E79F', {r:3}), rect(-116, -6, 10, 12, '#F1948A', {r:3})]));
add('Things', 'Smartphone', () => grp([rect(0, 0, 130, 250, '#1C1C1E', {r:22}), rect(0, -6, 114, 210, lin('#5DADE2', '#8E44AD'), {r:8}), rect(0, -114, 40, 8, '#3A3A3C', {r:4}), ell(0, 112, 9, 9, '#3A3A3C')]));
add('Things', 'Money', () => grp([...[0, 1, 2].map(i => rect(i * 8 - 30, -i * 10, 200, 90, '#7DCEA0', {r:6, stroke:'#239B56', lw:3})), txt('₹', -14, -20, 46, '#196F3D'),
  ...[[90, 50], [120, 40], [104, 22]].map(([x, y]) => ell(x, y, 30, 30, lin('#F7DC6F', '#D4AC0D'), {stroke:'#B7950B', lw:3})), txt('₹', 104, 22, 28, '#9A7D0A')]));
add('Things', 'Shield (protection)', () => grp([blob([[0, -120], [90, -90], [90, 0], [60, 70], [0, 120], [-60, 70], [-90, 0], [-90, -90]], lin('#3498DB', '#1B4F72')),
  blob([[0, -100], [70, -76], [70, 0], [46, 56], [0, 96], [-46, 56], [-70, 0], [-70, -76]], null, {stroke:'#FFFFFF', lw:4}), line([[-36, 0], [-8, 30], [42, -30]], '#FFFFFF', 14)]));
add('Things', 'Umbrella (protection)', () => grp([blob([...arc(0, 0, 130, 100, 180, 360), ...[100, 60, 20, -20, -60, -100].flatMap(x => [[x + 6, 6], [x - 14, 10]])], lin('#E74C3C', '#922B21')),
  line([[0, -100], [0, -116]], '#5D4037', 5), curve([[0, 0], [0, 120], [10, 140], [26, 130]], '#5D4037', 7)]));
add('Things', 'Family protection', () => grp([
  {...grp([blob([...arc(0, 0, 160, 110, 180, 360), [160, 0], [-160, 0]], lin('#3498DB', '#1B4F72')), line([[0, 0], [0, 40]], '#5D4037', 6)]), y:-120},
  {...standing({top:'#2E86C1', bottom:'#1B2631', scale:.6}), x:-46, y:40}, {...standing({saree:'#C0392B', top:'#C0392B', bun:true, bindi:true, scale:.6}), x:6, y:40},
  {...standing({top:'#F39C12', bottom:'#1F618D', scale:.38}), x:50, y:62}]));
add('Things', 'Heart', () => grp([blob([[0, 80], [-80, 10], [-90, -40], [-50, -76], [0, -50], [50, -76], [90, -40], [80, 10]], lin('#FF6B81', '#C0392B'))]));
add('Things', 'Kite', () => grp([poly([[0, -110], [70, -10], [0, 110], [-70, -10]], '#E74C3C'), poly([[0, -110], [70, -10], [0, -10]], '#F1C40F'), poly([[0, -10], [-70, -10], [0, 110]], '#F1C40F'),
  line([[0, -110], [0, 110]], '#7B241C', 3), line([[-70, -10], [70, -10]], '#7B241C', 3), curve([[0, 110], [20, 150], [-10, 190], [16, 240]], '#7B241C', 2.5),
  ...[[12, 140], [-2, 185], [10, 228]].map(([x, y], i) => poly([[x - 12, y - 8], [x + 12, y + 8], [x + 12, y - 8], [x - 12, y + 8]], i % 2 ? '#2ECC71' : '#3498DB'))]));
add('Things', 'Gift box', () => grp([rect(0, 20, 160, 120, '#8E44AD'), rect(0, -46, 176, 30, '#9B59B6'), rect(0, 4, 26, 152, '#F1C40F'), rect(0, -46, 26, 30, '#F1C40F'),
  ell(-24, -72, 26, 14, '#F1C40F', {rot:-20}), ell(24, -72, 26, 14, '#F1C40F', {rot:20})]));

// ---------------------------------------------------------------- backgrounds (fill the whole canvas)
const BG = (W, H, sky, extra = []) => grp([rect(0, 0, W, H, lin(...sky)), ...extra]);
add('Backgrounds', 'Morning sky', (W, H) => BG(W, H, ['#8EC5FC', '#FCE1B4'], [ell(W * .2, H * .1, H * .18, H * .18, rad('#FFF8E1', '#FFE082aa', '#FFE08200')), ell(W * .2, H * .1, H * .07, H * .07, '#FFF3C4'),
  ...[[-.25, -.3], [.15, -.36], [.32, -.2]].map(([x, y]) => grp([ell(-40, 0, 40, 26, '#FFFFFF'), ell(0, -12, 46, 34, '#FFFFFF'), ell(42, 0, 38, 26, '#FFFFFF')], {x:W * x, y:H * y}))]), {bg:true});
add('Backgrounds', 'Noon sky', (W, H) => BG(W, H, ['#2E86C1', '#AED6F1'], [ell(W * .3, -H * .3, H * .08, H * .08, '#FFFDE7'), ell(W * .3, -H * .3, H * .16, H * .16, '#FFFDE755')]), {bg:true});
add('Backgrounds', 'Evening sky', (W, H) => BG(W, H, ['#34437E', '#B9637E', '#F2935A', '#FFC777'], [ell(0, H * .22, H * .12, H * .12, '#FFD98A'),
  poly([[-W / 2, H / 2], [-W / 2, H * .25], [-W * .3, H * .12], [-W * .1, H * .28], [W * .12, H * .1], [W * .35, H * .26], [W / 2, H * .18], [W / 2, H / 2]], '#2C2340', {smooth:true})]), {bg:true});
add('Backgrounds', 'Night sky', (W, H) => { const st = []; for(let i = 0; i < 70; i++){ const x = (R(i) - .5) * W, y = (R(i, 3) - .5) * H * .9; st.push(ell(x, y, 1.5 + (i % 3), 1.5 + (i % 3), '#FFFDE7', {op:.5 + (i % 5) / 10})); }
  return BG(W, H, ['#070B24', '#1B2552', '#34467C'], [...st, ell(W * .3, -H * .25, H * .16, H * .16, '#FFFDE722'), blob([...arc(W * .3, -H * .25, H * .07, H * .07, 60, 300), ...arc(W * .3 + H * .03, -H * .25, H * .06, H * .065, 280, 80)], '#FFF59D')]); }, {bg:true});
add('Backgrounds', 'Green fields', (W, H) => BG(W, H, ['#8EC5FC', '#E0F2F1'], [poly([[-W / 2, H * .05], [-W * .2, -H * .1], [W * .1, H * .02], [W * .35, -H * .12], [W / 2, 0], [W / 2, H * .1], [-W / 2, H * .1]], '#6F9A74', {smooth:true}),
  rect(0, H * .3, W, H * .45, '#7DBA4A'), ...[0, 1, 2, 3, 4].map(i => rect(0, H * (.12 + i * .08), W, H * .04, i % 2 ? '#6AAE3F' : '#93C95A'))]), {bg:true});
add('Backgrounds', 'Forest', (W, H) => { const tr = []; for(let i = 0; i < 16; i++){ const x = -W / 2 + (i + .5) * W / 16, h = H * (.35 + (i * 37 % 10) / 40);
  tr.push(rect(x, H * .38, 12, H * .2, '#4E342E'), poly([[x - 50, H * .32], [x, H * .32 - h], [x + 50, H * .32]], i % 2 ? '#1E5631' : '#2E7D32')); }
  return BG(W, H, ['#A8E6CF', '#DCEDC1'], [rect(0, H * .4, W, H * .2, '#33691E'), ...tr]); }, {bg:true});
add('Backgrounds', 'Sunset sea', (W, H) => BG(W, H, ['#FF7E5F', '#FEB47B'], [ell(0, H * .05, H * .18, H * .18, '#FFE29A'), rect(0, H * .3, W, H * .4, lin('#3A6073', '#16222A')),
  ...[0, 1, 2, 3].map(i => rect(0, H * (.13 + i * .05), H * (.3 - i * .06), 4, '#FFE29A', {op:.7}))]), {bg:true});
add('Backgrounds', 'Saffron glow', (W, H) => BG(W, H, ['#FF9933', '#FFD27F'], [ell(0, 0, W * .45, H * .6, rad('#FFF5E0cc', '#FFF5E000'))]), {bg:true});
add('Backgrounds', 'Blue gradient', (W, H) => BG(W, H, ['#1A2980', '#26D0CE']), {bg:true});
add('Backgrounds', 'Purple gradient', (W, H) => BG(W, H, ['#41295A', '#2F0743', '#8E2DE2']), {bg:true});
add('Backgrounds', 'Clean white', (W, H) => BG(W, H, ['#FFFFFF', '#ECF0F1']), {bg:true});

// ---------------------------------------------------------------- scene backgrounds (full places)
function cityScene(W, H, night){
  const ch = [], gY = H * .2;   // gY = top of footpath (ground line)
  // far skyline
  for(let i = 0; i < 22; i++){ const w = W / 18 * (0.7 + R(i, 2) * .8), x = -W / 2 + i * W / 20, h = H * (.12 + R(i, 5) * .25);
    ch.push(rect(x, gY - h / 2, w, h, night ? '#1C2541' : '#A9C3D6')); }
  // near buildings with windows
  const cols = night ? ['#2B2F45', '#33384F', '#262A3D', '#3A3550'] : ['#5D7389', '#7B8FA1', '#8E7F74', '#6C7A89', '#A0816C'];
  let x = -W / 2 - 20, i = 0;
  while(x < W / 2 + 40){ const w = W * (.07 + R(i, 7) * .08), h = H * (.22 + R(i, 9) * .38), cx = x + w / 2, top = gY - h;
    ch.push(rect(cx, gY - h / 2, w, h, cols[i % cols.length]));
    ch.push(rect(cx, top - 4, w + 6, 8, night ? '#1E2133' : '#4A5866'));
    const nx = Math.max(2, Math.floor(w / 26)), ny = Math.max(3, Math.floor(h / 34)), gw = w / nx, gh = h / ny;
    for(let a = 0; a < nx; a++) for(let b = 0; b < ny - 1; b++){ const lit = night ? R(i * 31 + a, b) > .45 : false;
      ch.push(rect(x + gw * (a + .5), top + gh * (b + .7), gw * .55, gh * .5, night ? (lit ? '#FFD86B' : '#1A1D2B') : (R(i + a, b) > .8 ? '#E8F4FB' : '#BFD9EA'), {op:night && lit ? .95 : 1})); }
    x += w + W * .008; i++; }
  // footpath, road and markings
  ch.push(rect(0, gY + H * .03, W, H * .06, night ? '#4A4A52' : '#B0ADA8'), rect(0, gY + H * .062, W, H * .008, night ? '#2E2E33' : '#8A8781'));
  ch.push(rect(0, gY + H * .2, W, H * .28, night ? '#1E1F24' : '#3F4248'));
  for(let k = 0; k < 9; k++) ch.push(rect(-W / 2 + (k + .5) * W / 9, gY + H * .2, W * .05, 6, night ? '#C9B458' : '#F4F1E8'));
  ch.push(rect(0, gY + H * .345, W, H * .02, night ? '#3A3A40' : '#8F8C86'));
  // street lamps and trees
  for(let k = 0; k < 4; k++){ const lx = -W / 2 + (k + .5) * W / 4;
    ch.push(rect(lx, gY - H * .12, 6, H * .3, '#2C3E50'), line([[lx, gY - H * .27], [lx + 34, gY - H * .27]], '#2C3E50', 5), ell(lx + 34, gY - H * .26, 12, 6, night ? '#FFF3B0' : '#D5D8DC'));
    if(night) ch.push(ell(lx + 34, gY - H * .24, 90, 70, rad('#FFE9A0aa', '#FFE9A000')), poly([[lx + 22, gY - H * .25], [lx + 46, gY - H * .25], [lx + 110, gY + H * .1], [lx - 40, gY + H * .1]], '#FFE9A0', {op:.08}));
    const tx = lx + W / 8; ch.push(rect(tx, gY - 30, 10, 60, '#5D4037'), ell(tx, gY - 80, 42, 46, night ? '#1F3B2B' : '#3E8E41'), ell(tx - 22, gY - 64, 28, 26, night ? '#1A3324' : '#4CAF50')); }
  const sky = night ? ['#060A1F', '#1B2552', '#3A3F6B'] : ['#6CB8EA', '#CFE8F7', '#F4FAFD'];
  const extra = night ? [ell(W * .32, -H * .33, H * .05, H * .05, '#FFF8D6'), ell(W * .32, -H * .33, H * .12, H * .12, '#FFF8D622'),
    ...Array.from({length:40}, (_, k) => ell((R(k, 11) - .5) * W, -H / 2 + R(k, 12) * H * .3, 1.4, 1.4, '#FFFFFF', {op:.6}))] :
    [ell(-W * .3, -H * .32, H * .06, H * .06, '#FFF9E0'), ...[[-.1, -.36], [.25, -.3]].map(([a, b]) => grp([ell(-40, 0, 40, 22, '#FFFFFF'), ell(0, -10, 44, 30, '#FFFFFF'), ell(40, 0, 36, 22, '#FFFFFF')], {x:W * a, y:H * b}))];
  return BG(W, H, sky, [...extra, ...ch]);
}
add('Backgrounds', 'City (day)', (W, H) => cityScene(W, H, false), {bg:true});
add('Backgrounds', 'City (night)', (W, H) => cityScene(W, H, true), {bg:true});
add('Backgrounds', 'Beach (day)', (W, H) => { const sea = H * .02, ch = [];
  ch.push(ell(W * .28, -H * .28, H * .07, H * .07, '#FFF6D5'), ell(W * .28, -H * .28, H * .15, H * .15, '#FFF6D533'));
  ch.push(rect(0, sea + H * .12, W, H * .28, lin('#1B6CA8', '#3FA3D8', '#7FD0EA')));
  for(let k = 0; k < 7; k++){ const y = sea + H * (.02 + k * .03); ch.push(curve(Array.from({length:9}, (_, j) => [-W / 2 + j * W / 8 + (k % 2) * 40, y + (j % 2 ? 3 : -3)]), '#FFFFFF', 2, {op:.25 + k * .05})); }
  ch.push(grp([poly([[-50, 0], [50, 0], [36, 16], [-36, 16]], '#8D5524'), line([[0, 0], [0, -70]], '#5D4037', 3), poly([[3, -68], [3, -6], [44, -6]], '#FDFEFE'), poly([[-3, -60], [-3, -6], [-34, -6]], '#F5B041')], {x:-W * .18, y:sea + H * .07}));
  ch.push(rect(0, H * .38, W, H * .26, '#EDCF9A'), blob([[-W * .62, H * .2], [-W * .25, H * .17], [0, H * .2], [W * .25, H * .16], [W * .62, H * .19], [W * .62, H * .62], [-W * .62, H * .62]], lin('#F7E3B5', '#E9C98F')));
  ch.push(blob([[-W * .6, H * .19], [-W * .2, H * .155], [W * .1, H * .185], [W * .35, H * .15], [W * .6, H * .175], [W * .6, H * .2], [-W * .6, H * .21]], '#FFFFFF', {op:.75}));
  for(let k = 0; k < 14; k++) ch.push(ell((R(k, 4) - .5) * W, H * (.28 + R(k, 6) * .2), 4, 2, '#D4AC6E'));
  // palm tree
  const px = -W * .38, py = H * .32; ch.push(curve([[px, py], [px + 20, py - 120], [px + 60, py - 260]], '#7B5B3A', 22));
  for(let k = 0; k < 6; k++){ const a = (-160 + k * 34) * D2R, ex = px + 60 + Math.cos(a) * 150, ey = py - 260 + Math.sin(a) * 70 + 40;
    ch.push(blob([[px + 60, py - 262], [(px + 60 + ex) / 2, Math.min(py - 300, ey - 50)], [ex, ey], [(px + 60 + ex) / 2 + 10, (py - 262 + ey) / 2]], k % 2 ? '#2E8B57' : '#3CB371')); }
  ch.push(ell(px + 58, py - 255, 12, 12, '#6D4C41'), ell(px + 72, py - 250, 11, 11, '#5D4037'));
  for(let k = 0; k < 4; k++){ const bx = W * (.0 + k * .07), by = -H * (.25 + R(k, 3) * .08); ch.push(curve([[bx - 14, by], [bx - 6, by - 7], [bx, by]], '#2B2B33', 2.5), curve([[bx, by], [bx + 6, by - 7], [bx + 14, by]], '#2B2B33', 2.5)); }
  return BG(W, H, ['#4FA3DE', '#BFE3F7', '#F2FAFE'], ch); }, {bg:true});
add('Backgrounds', 'Jungle', (W, H) => { const ch = [];
  ch.push(rect(0, 0, W, H, lin('#9CC9A0', '#4E8A5C', '#24452F')));
  for(let k = 0; k < 14; k++){ const x = -W / 2 + (k + .5) * W / 14, h = H * (.5 + R(k, 1) * .3); ch.push(blob([[x - 70, H * .15], [x - 60, H * .15 - h * .6], [x, H * .15 - h], [x + 60, H * .15 - h * .6], [x + 70, H * .15]], '#3F7A52', {op:.55})); }
  for(let k = 0; k < 5; k++) ch.push(poly([[-W * .1 + k * W * .08, -H / 2], [-W * .02 + k * W * .08, -H / 2], [W * .1 + k * W * .1, H * .3], [-W * .05 + k * W * .1, H * .3]], '#FFF9D6', {op:.07}));
  for(let k = 0; k < 6; k++){ const x = -W / 2 + (k + .3) * W / 5.5 + R(k, 2) * 60, w = 40 + R(k, 3) * 40; ch.push(rect(x, 0, w, H, lin('#4E3B2A', '#2F241A')), rect(x - w * .2, 0, w * .25, H, '#5E4A36', {op:.6}));
    ch.push(blob([[x - 160, -H * .38], [x - 60, -H * .52], [x + 80, -H * .5], [x + 170, -H * .36], [x + 40, -H * .28], [x - 90, -H * .28]], k % 2 ? '#1F5A33' : '#2A6E3F')); }
  for(let k = 0; k < 10; k++){ const x = -W / 2 + R(k, 8) * W; ch.push(curve([[x, -H / 2], [x + 20, -H * .25], [x - 10, -H * .05], [x + 8, H * .05]], '#2E5E2E', 4)); ch.push(ell(x + 8, H * .05, 6, 9, '#3E7E3E')); }
  ch.push(blob([[-W * .15, H / 2], [-W * .05, H * .2], [W * .05, H * .2], [W * .2, H / 2]], '#8D6E4A', {op:.85}), rect(0, H * .35, W, H * .3, '#1E3D24', {op:.6}));
  for(let k = 0; k < 18; k++){ const x = -W / 2 + k * W / 17, y = H * (.38 + R(k, 9) * .1), c = k % 3 ? '#2F7D3A' : '#3D9447';
    for(let j = -2; j <= 2; j++) ch.push(blob([[x, y], [x + j * 28, y - 70 - Math.abs(j) * -8], [x + j * 34, y - 40], [x + j * 6, y]], c)); }
  return grp(ch); }, {bg:true});
add('Backgrounds', 'Temple courtyard', (W, H) => { const ch = [], st = '#D9A86C', sh = '#B9844E', gY = H * .22;
  ch.push(ell(W * .3, -H * .3, H * .07, H * .07, '#FFF2CC'));
  // gopuram: stacked tiers
  const tiers = 7; let tw = W * .3, y = gY - H * .12;
  ch.push(rect(0, gY - H * .06, tw * 1.08, H * .12, st), rect(0, gY - H * .04, tw * .22, H * .1, '#5A2A16', {r:6}));
  for(let k = 0; k < tiers; k++){ const th = H * .065, w2 = tw * .86; ch.push(poly([[-tw / 2, y], [tw / 2, y], [w2 / 2, y - th], [-w2 / 2, y - th]], k % 2 ? st : '#E2B47A'));
    for(let j = 0; j < 5; j++) ch.push(rect(-tw * .36 + j * tw * .18, y - th * .5, tw * .06, th * .6, sh, {r:3}));
    ch.push(rect(0, y - th - 3, w2 + 8, 6, sh)); tw = w2; y -= th + 6; }
  ch.push(blob([[-tw * .6, y], [-tw * .5, y - 40], [0, y - 60], [tw * .5, y - 40], [tw * .6, y]], '#C8925A'));
  for(let k = -1; k <= 1; k++) ch.push(poly([[k * 22 - 7, y - 50], [k * 22 + 7, y - 50], [k * 22, y - 85]], '#E8B923'), ell(k * 22, y - 50, 8, 6, '#D4A017'));
  // walls left/right
  ch.push(rect(-W * .34, gY - H * .07, W * .32, H * .14, st), rect(W * .34, gY - H * .07, W * .32, H * .14, st));
  for(let k = 0; k < 12; k++) ch.push(rect(-W / 2 + (k + .5) * W / 12, gY - H * .14, W / 12 * .6, 10, sh));
  for(let k = 0; k < 2; k++) for(let j = 0; j < 9; j++) ch.push(rect((k ? 1 : -1) * W * (.2 + j * .035), gY - H * .07, 6, H * .12, k ? '#C9944F' : '#CC9752'), rect((k ? 1 : -1) * W * (.2 + j * .035), gY - H * .03, 18, 6, '#B33A2B', {op:.0}));
  // stone floor with lines
  ch.push(rect(0, gY + H * .14, W, H * .28, lin('#CDB38B', '#A68A63')));
  for(let k = 0; k < 6; k++) ch.push(line([[-W / 2, gY + H * (.02 + k * k * .012)], [W / 2, gY + H * (.02 + k * k * .012)]], '#8F7552', 1.5, {op:.6}));
  for(let k = -6; k <= 6; k++) ch.push(line([[k * W * .03, gY], [k * W * .16, H / 2]], '#8F7552', 1.5, {op:.5}));
  // dhwajastambham and diyas
  ch.push(rect(-W * .3, gY - H * .05, 14, H * .42, lin('#F4D03F', '#B7950B')), rect(-W * .3, gY + H * .16, 50, 20, '#B7950B'));
  for(let k = 0; k < 3; k++) ch.push(rect(-W * .3, gY - H * (.2 - k * .08), 30, 6, '#D4AC0D'));
  for(let k = 0; k < 6; k++){ const dx = W * (.12 + k * .055), dy = gY + H * .22; ch.push(ell(dx, dy, 14, 6, '#A0522D'), poly([[dx - 3, dy - 4], [dx + 3, dy - 4], [dx, dy - 20]], '#FFB300'), ell(dx, dy - 12, 14, 14, rad('#FFE08299', '#FFE08200'))); }
  return BG(W, H, ['#F6B26B', '#FBD9A6', '#FFF4E0'], ch); }, {bg:true});
add('Backgrounds', 'River ghat', (W, H) => { const ch = [], wl = -H * .02;
  ch.push(ell(W * .18, -H * .18, H * .07, H * .07, '#FFD27A'), ell(W * .18, -H * .18, H * .16, H * .16, '#FFD27A33'));
  ch.push(blob([[-W / 2, wl], [-W * .3, wl - H * .04], [0, wl - H * .02], [W * .25, wl - H * .05], [W / 2, wl - H * .03], [W / 2, wl], [-W / 2, wl + 4]], '#6B5B73'));
  for(let k = 0; k < 9; k++){ const x = -W * .45 + k * W * .11; ch.push(rect(x, wl - H * .05, 24, 30 + R(k) * 20, '#5A4A63')); }
  ch.push(rect(0, wl + H * .26, W, H * .52, lin('#E59A6A', '#9A6F7A', '#4E5C7A')));
  for(let k = 0; k < 7; k++) ch.push(rect(W * .18, wl + H * (.03 + k * .04), H * (.18 - k * .02), 4, '#FFD27A', {op:.6 - k * .06}));
  for(let k = 0; k < 10; k++) ch.push(line([[(R(k, 3) - .5) * W, wl + H * (.05 + R(k, 4) * .25)], [(R(k, 3) - .5) * W + 60, wl + H * (.05 + R(k, 4) * .25)]], '#FFFFFF', 2, {op:.25}));
  // ghat steps bottom-left
  for(let k = 0; k < 8; k++){ const y = H * (.2 + k * .04), w = W * (.55 + k * .03); ch.push(rect(-W / 2 + w / 2, y, w, H * .042, k % 2 ? '#C9A27A' : '#B38D66')); }
  ch.push(grp([rect(0, 30, 110, 60, '#D9B38C'), poly([[-60, 0], [60, 0], [0, -70]], '#C77D4F'), rect(0, 40, 26, 40, '#5A2A16'), line([[0, -70], [0, -100]], '#8B4513', 2), poly([[0, -100], [26, -92], [0, -84]], '#FF8C00')], {x:-W * .33, y:H * .1}));
  ch.push(grp([rect(0, 30, 80, 50, '#E0C097'), ell(0, 0, 40, 30, '#D69E6A'), rect(0, 38, 18, 30, '#5A2A16')], {x:-W * .15, y:H * .12}));
  // boats
  for(let k = 0; k < 2; k++){ const bx = W * (.05 + k * .25), by = wl + H * (.12 + k * .08); ch.push(blob([[bx - 70, by], [bx + 70, by], [bx + 50, by + 16], [bx - 50, by + 16]], '#5D4037'), rect(bx, by - 2, 120, 4, '#8D6E63'));
    ch.push(ell(bx - 20, by - 6, 5, 5, '#FFB300'), ell(bx - 20, by - 6, 14, 14, rad('#FFE08299', '#FFE08200'))); }
  return BG(W, H, ['#F28C5A', '#F7B47A', '#FCE0B8'], ch); }, {bg:true});
add('Backgrounds', 'Waterfall', (W, H) => { const ch = [];
  ch.push(blob([[-W / 2, -H * .2], [-W * .25, -H * .32], [-W * .08, -H * .22], [-W * .08, H * .2], [-W / 2, H * .25]], '#6E6259'), blob([[W * .08, -H * .24], [W * .3, -H * .34], [W / 2, -H * .25], [W / 2, H * .25], [W * .08, H * .2]], '#62574F'));
  ch.push(rect(0, -H * .02, W * .17, H * .42, lin('#E8F6FB', '#BFE5F2', '#E8F6FB')));
  for(let k = 0; k < 9; k++) ch.push(line([[-W * .075 + k * W * .019, -H * .23], [-W * .075 + k * W * .019 + (k % 2 ? 4 : -4), H * .18]], '#FFFFFF', 3, {op:.6}));
  ch.push(ell(0, H * .26, W * .45, H * .12, lin('#4FA3C7', '#2F7FA0')), ell(0, H * .2, W * .14, H * .06, '#FFFFFF', {op:.75}), ell(0, H * .16, W * .2, H * .08, '#FFFFFF', {op:.3}));
  for(const sgn of [-1, 1]) for(let k = 0; k < 7; k++) ch.push(ell(sgn * W * (.18 + k * .05), -H * (.28 - (k % 3) * .02) + k * 6, 60, 40, k % 2 ? '#2E7D32' : '#388E3C'));
  ch.push(rect(0, H * .43, W, H * .14, '#3B6E3B'));
  for(let k = 0; k < 16; k++) ch.push(ell(-W / 2 + k * W / 15, H * .38, 50, 26, k % 2 ? '#2E6B2E' : '#3F8A3F'));
  for(let k = 0; k < 5; k++) ch.push(ell(W * (-.35 + k * .17), H * .33, 28, 16, '#7D7368'));
  return BG(W, H, ['#8FD3F4', '#D5F0FA'], ch); }, {bg:true});
add('Backgrounds', 'Himalaya snow peaks', (W, H) => { const ch = [];
  ch.push(poly([[-W / 2, H * .05], [-W * .35, -H * .25], [-W * .2, -H * .05], [-W * .02, -H * .38], [W * .18, -H * .08], [W * .32, -H * .3], [W / 2, -H * .02], [W / 2, H * .1], [-W / 2, H * .1]], '#7C8FA6'));
  for(const [x, y, s] of [[-W * .35, -H * .25, .7], [-W * .02, -H * .38, 1], [W * .32, -H * .3, .8]]) ch.push(poly([[x - 70 * s, y + 60 * s], [x, y], [x + 80 * s, y + 70 * s], [x + 40 * s, y + 55 * s], [x + 10 * s, y + 75 * s], [x - 30 * s, y + 50 * s]], '#FFFFFF'));
  ch.push(poly([[-W / 2, H * .15], [-W * .3, -H * .06], [-W * .1, H * .08], [W * .12, -H * .04], [W * .35, H * .1], [W / 2, H * .02], [W / 2, H * .2], [-W / 2, H * .2]], '#5E7C6B'));
  for(let k = 0; k < 26; k++){ const x = -W / 2 + k * W / 25 + R(k) * 20, y = H * (.2 + R(k, 2) * .06), h = 60 + R(k, 3) * 50; for(let j = 0; j < 3; j++) ch.push(poly([[x - 26 + j * 5, y - j * h * .28], [x, y - h - j * h * .1], [x + 26 - j * 5, y - j * h * .28]], '#1F4D3A')); }
  ch.push(rect(0, H * .37, W, H * .3, lin('#7CB46B', '#5C9450')));
  for(let k = 0; k < 20; k++) ch.push(ell((R(k, 5) - .5) * W, H * (.3 + R(k, 6) * .18), 4, 4, ['#FFFFFF', '#F7DC6F', '#E59866'][k % 3]));
  return BG(W, H, ['#3F7FC4', '#A9CDEB', '#E8F2FA'], ch); }, {bg:true});
add('Backgrounds', 'Desert', (W, H) => { const ch = [ell(W * .25, -H * .2, H * .1, H * .1, '#FFF1C1'), ell(W * .25, -H * .2, H * .22, H * .22, '#FFF1C133')];
  ch.push(blob([[-W / 2, H * .05], [-W * .2, -H * .06], [W * .1, H * .04], [W * .4, -H * .05], [W / 2, 0], [W / 2, H / 2], [-W / 2, H / 2]], '#E8B977'));
  ch.push(blob([[-W / 2, H * .2], [-W * .25, H * .08], [W * .05, H * .2], [W * .3, H * .1], [W / 2, H * .18], [W / 2, H / 2], [-W / 2, H / 2]], '#D9A35F'));
  ch.push(blob([[-W / 2, H * .38], [-W * .1, H * .26], [W * .2, H * .36], [W / 2, H * .3], [W / 2, H / 2], [-W / 2, H / 2]], '#C98E4C'));
  for(let k = 0; k < 4; k++){ const x = -W * .2 + k * 70, y = -H * .02 + k * 3; ch.push(grp([ell(0, -26, 26, 14, '#5A3E2B'), ell(6, -40, 9, 9, '#5A3E2B'), rect(30, -40, 6, 22, '#5A3E2B'), ell(34, -50, 9, 6, '#5A3E2B'),
    line([[-16, -16], [-18, 8]], '#5A3E2B', 4), line([[-6, -16], [-6, 8]], '#5A3E2B', 4), line([[10, -16], [12, 8]], '#5A3E2B', 4), line([[18, -16], [20, 8]], '#5A3E2B', 4)], {x, y, s:.8})); }
  for(let k = 0; k < 6; k++){ const x = (R(k, 9) - .5) * W, y = H * (.3 + R(k, 8) * .15); ch.push(ell(x, y, 22, 10, '#8A7A3A'), ell(x + 10, y - 6, 14, 8, '#9C8C48')); }
  return BG(W, H, ['#F6C58B', '#FBE3B8', '#FFF5E1'], ch); }, {bg:true});
add('Backgrounds', 'Cave (meditation)', (W, H) => { const ch = [rect(0, 0, W, H, lin('#2A211B', '#15100C'))];
  ch.push(blob([[-W * .2, H * .15], [-W * .24, -H * .1], [-W * .12, -H * .32], [W * .05, -H * .36], [W * .2, -H * .24], [W * .24, H * .02], [W * .18, H * .15]], lin('#FFE7B0', '#F6B26B', '#9C6B3E')));
  for(let k = 0; k < 4; k++) ch.push(poly([[-W * .1 + k * W * .06, -H * .3], [-W * .06 + k * W * .06, -H * .3], [W * (-.05 + k * .12), H * .45], [W * (-.2 + k * .1), H * .45]], '#FFE9B8', {op:.07}));
  ch.push(blob([[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H * .1], [W * .35, -H * .05], [W * .28, -H * .3], [W * .1, -H * .42], [-W * .15, -H * .4], [-W * .3, -H * .2], [-W * .32, H * .05], [-W / 2, H * .15]], '#2B211A'));
  for(let k = 0; k < 9; k++){ const x = -W * .25 + k * W * .06; ch.push(poly([[x - 12, -H * .38 + R(k) * 20], [x + 12, -H * .38 + R(k) * 20], [x + 2, -H * .25 + R(k, 2) * 40]], '#3A2C22')); }
  ch.push(ell(0, H * .4, W * .6, H * .16, '#3B2E24'), ell(0, H * .32, W * .3, H * .06, '#4D3C2E'));
  for(let k = 0; k < 6; k++) ch.push(ell((R(k, 4) - .5) * W * .9, H * (.35 + R(k, 5) * .1), 30 + R(k) * 30, 16, '#2E241C'));
  return grp(ch); }, {bg:true});
add('Backgrounds', 'Space (cosmos)', (W, H) => { const ch = [rect(0, 0, W, H, lin('#02030C', '#0B0F2E', '#1A1040'))];
  for(const [x, y, rx, c] of [[-.25, -.1, .35, '#6A2C91'], [.2, .15, .3, '#1B4F8A'], [.05, -.25, .25, '#9C2F5C']]) ch.push(ell(W * x, H * y, W * rx, H * rx * .9, rad(c + '88', c + '00')));
  for(let k = 0; k < 160; k++) ch.push(ell((R(k, 21) - .5) * W, (R(k, 22) - .5) * H, k % 9 ? 1.2 : 2.4, k % 9 ? 1.2 : 2.4, ['#FFFFFF', '#CFE3FF', '#FFE9C4'][k % 3], {op:.4 + R(k, 23) * .6}));
  ch.push(grp(Array.from({length:60}, (_, k) => { const a = k * .35, r2 = 6 + k * 3.2; return ell(Math.cos(a) * r2, Math.sin(a) * r2 * .45, 3 + k * .05, 2, '#F5E9FF', {op:.5 - k * .006}); }).concat([ell(0, 0, 26, 14, rad('#FFFFFF', '#E0C8FF00'))]), {x:W * .28, y:-H * .25, rot:-20}));
  ch.push(ell(-W * .3, H * .22, 70, 70, lin('#F0B27A', '#A0522D')), ell(-W * .3, H * .22, 120, 24, null, {stroke:'#F5CBA7', lw:6, rot:-15}), ell(-W * .3, H * .22, 70, 70, rad('#00000000', '#00000066')));
  ch.push(ell(W * .35, H * .3, 26, 26, lin('#85C1E9', '#2E86C1')));
  return grp(ch); }, {bg:true});
add('Backgrounds', 'Heaven (golden clouds)', (W, H) => { const ch = [];
  for(let k = 0; k < 12; k++){ const a = (-90 + (k - 5.5) * 13) * D2R; ch.push(poly([[0, -H * .55], [Math.cos(a - .04) * W, -H * .55 + Math.sin(a - .04) * -W], [Math.cos(a + .04) * W, -H * .55 + Math.sin(a + .04) * -W]].map(([x, y]) => [x, -y - H * 1.1]), '#FFFFFF', {op:.0})); }
  for(let k = 0; k < 10; k++){ const a = ((k - 4.5) * 12) * D2R; ch.push(poly([[0, -H * .5], [Math.sin(a - .05) * W, H * .6], [Math.sin(a + .05) * W, H * .6]], '#FFFBEA', {op:.12})); }
  ch.push(ell(0, -H * .5, W * .2, H * .2, rad('#FFFFFF', '#FFF5D600')));
  for(let row = 0; row < 3; row++) for(let k = 0; k < 7; k++){ const x = -W / 2 + k * W / 6 + (row % 2) * 80, y = H * (.1 + row * .14), c = row === 2 ? '#FFFFFF' : row ? '#FFF3DC' : '#FCE4C0';
    ch.push(grp([ell(-70, 0, 80, 46, c), ell(0, -26, 90, 60, c), ell(80, 0, 76, 44, c), ell(10, 14, 120, 34, c)], {x, y})); }
  return BG(W, H, ['#F9C96B', '#FCE2A8', '#FFF6E0'], ch); }, {bg:true});
add('Backgrounds', 'Rainy sky (dark clouds)', (W, H) => { const ch = [];
  for(let row = 0; row < 3; row++) for(let k = 0; k < 7; k++){ const x = -W / 2 + k * W / 6 + (row % 2) * 70, y = -H * (.42 - row * .1), c = ['#5D6670', '#6E7782', '#808994'][row];
    ch.push(grp([ell(-60, 0, 70, 40, c), ell(0, -20, 80, 52, c), ell(70, 0, 66, 38, c)], {x, y})); }
  ch.push(poly([[-W / 2, H * .12], [-W * .2, H * .02], [W * .1, H * .1], [W * .4, H * .0], [W / 2, H * .06], [W / 2, H * .2], [-W / 2, H * .2]], '#4E6352', {smooth:true}));
  ch.push(rect(0, H * .35, W, H * .3, lin('#5F7F4C', '#3F5F35')));
  for(let k = 0; k < 6; k++) ch.push(ell((R(k, 7) - .5) * W, H * (.33 + R(k, 8) * .12), 70, 10, '#8FA6B8', {op:.5}));
  return BG(W, H, ['#4A525C', '#7A848F', '#A5AEB8'], ch); }, {bg:true});
add('Backgrounds', 'Home (living room)', (W, H) => { const ch = [], fY = H * .22;
  ch.push(rect(0, -H * .14, W, H * .72, lin('#F3E5D0', '#E8D3B6')), rect(0, fY + H * .14, W, H * .28, lin('#B07B4F', '#8E5E3A')));
  for(let k = 0; k < 10; k++) ch.push(line([[-W / 2 + k * W / 9, fY], [-W / 2 + k * W / 9 - 60, H / 2]], '#7A4E2E', 1.5, {op:.5}));
  ch.push(rect(0, fY, W, 10, '#C9A27A'));
  // window
  ch.push(rect(-W * .28, -H * .12, W * .22, H * .34, '#8B6B4A', {r:4}), rect(-W * .28, -H * .12, W * .2, H * .31, lin('#9FD3F2', '#DDF1FB')), rect(-W * .28, -H * .12, 6, H * .31, '#8B6B4A'), rect(-W * .28, -H * .12, W * .2, 6, '#8B6B4A'));
  ch.push(rect(-W * .41, -H * .1, W * .05, H * .4, '#C0392B', {op:.85}), rect(-W * .15, -H * .1, W * .05, H * .4, '#C0392B', {op:.85}));
  // sofa
  ch.push(rect(W * .1, fY - H * .02, W * .38, H * .16, '#5D6D7E', {r:18}), rect(W * .1, fY - H * .12, W * .36, H * .1, '#6C7A89', {r:16}), rect(W * -.08, fY - H * .03, W * .04, H * .17, '#4D5B69', {r:12}), rect(W * .28, fY - H * .03, W * .04, H * .17, '#4D5B69', {r:12}));
  ch.push(rect(W * .02, fY - H * .08, W * .06, H * .06, '#F5B041', {r:10, rot:-8}), rect(W * .2, fY - H * .08, W * .06, H * .06, '#48C9B0', {r:10, rot:8}));
  // frame, lamp, plant
  ch.push(rect(W * .1, -H * .26, W * .16, H * .14, '#7B5B3A'), rect(W * .1, -H * .26, W * .14, H * .12, lin('#F6C58B', '#E59866')), ell(W * .07, -H * .27, 14, 14, '#FFF1C1'));
  ch.push(rect(W * .4, fY - H * .14, 6, H * .28, '#2C3E50'), poly([[W * .4 - 34, fY - H * .3], [W * .4 + 34, fY - H * .3], [W * .4 + 24, fY - H * .38], [W * .4 - 24, fY - H * .38]], '#F9E79F'));
  ch.push(rect(-W * .44, fY + H * .02, 46, 56, '#B9770E', {r:6}), ...[-1, 0, 1].map(j => blob([[-W * .44, fY - 2], [-W * .44 + j * 40, fY - H * .14], [-W * .44 + j * 12, fY - 10]], '#27AE60')));
  ch.push(ell(W * .1, fY + H * .2, W * .2, H * .05, '#A93226', {op:.5}));
  return grp(ch); }, {bg:true});
add('Backgrounds', 'Office', (W, H) => { const ch = [], fY = H * .22;
  ch.push(rect(0, -H * .14, W, H * .72, lin('#E9EEF2', '#D5DDE3')), rect(0, fY + H * .14, W, H * .28, lin('#9AA5AE', '#7F8A93')), rect(0, fY, W, 8, '#B5BEC6'));
  ch.push(rect(-W * .25, -H * .12, W * .34, H * .36, '#5D6D7E', {r:4}), rect(-W * .25, -H * .12, W * .32, H * .33, lin('#A9D3F0', '#E3F2FB')));
  for(let k = 0; k < 10; k++) ch.push(rect(-W * .25, -H * .27 + k * H * .033, W * .32, 5, '#FFFFFF', {op:.55}));
  ch.push(rect(W * .32, -H * .05, W * .2, H * .5, '#8E6E53'), ...[0, 1, 2, 3].map(k => rect(W * .32, -H * .24 + k * H * .12, W * .19, 6, '#6E5440')));
  for(let k = 0; k < 4; k++) for(let j = 0; j < 7; j++) ch.push(rect(W * .25 + j * W * .022, -H * .27 + k * H * .12, W * .016, H * .08 - (j % 3) * 6, ['#C0392B', '#2980B9', '#27AE60', '#F39C12', '#8E44AD'][(k + j) % 5]));
  ch.push(rect(0, fY - H * .02, W * .44, 16, '#6E4B33', {r:4}), rect(-W * .19, fY + H * .08, 14, H * .2, '#4E3524'), rect(W * .19, fY + H * .08, 14, H * .2, '#4E3524'));
  ch.push(rect(0, fY - H * .14, W * .16, H * .14, '#2C3E50', {r:6}), rect(0, fY - H * .14, W * .148, H * .12, lin('#3498DB', '#1B4F72')), rect(0, fY - H * .045, 10, H * .04, '#2C3E50'), rect(0, fY - H * .03, 60, 6, '#2C3E50'));
  ch.push(rect(-W * .14, fY - H * .045, 60, 10, '#ECF0F1', {r:3}), ell(W * .14, fY - H * .045, 16, 10, '#FDFEFE'), rect(W * .14, fY - H * .07, 20, 26, '#A04000', {r:4}));
  ch.push(rect(-W * .42, fY + H * .02, 50, 64, '#7F8C8D', {r:6}), ...[-1, 0, 1].map(j => blob([[-W * .42, fY - 4], [-W * .42 + j * 46, fY - H * .2], [-W * .42 + j * 14, fY - 14]], '#229954')));
  ch.push(rect(W * -.42, -H * .3, 70, 70, '#FFFFFF', {r:35}), ell(W * -.42, -H * .3, 31, 31, '#FDFEFE', {stroke:'#2C3E50', lw:3}), line([[W * -.42, -H * .3], [W * -.42, -H * .33]], '#2C3E50', 3), line([[W * -.42, -H * .3], [W * -.4, -H * .3]], '#2C3E50', 3));
  return grp(ch); }, {bg:true});

// ---------------------------------------------------------------- motion graphics
add('Motion graphics', 'Title bar', () => grp([rect(0, 0, 560, 90, lin('#F39C12', '#E67E22'), {r:14}), rect(-262, 0, 14, 70, '#FFFFFF', {r:4}), txt('Your Title Here', 10, 0, 44, '#FFFFFF')]));
add('Motion graphics', 'Lower third (name strip)', () => grp([rect(0, 0, 520, 80, '#1B2631', {r:6}), rect(-245, 0, 30, 80, '#F39C12'), txt('Your Name', -10, -14, 32, '#FFFFFF'), txt('Phone number / title', -10, 22, 20, '#F9E79F')]));
add('Motion graphics', 'Arrow', () => grp([poly([[-120, -22], [40, -22], [40, -54], [130, 0], [40, 54], [40, 22], [-120, 22]], '#E74C3C')]));
add('Motion graphics', 'Frame border', () => grp([rect(0, 0, 400, 260, null, {stroke:'#D4AF37', lw:12, r:8}), rect(0, 0, 370, 230, null, {stroke:'#D4AF37', lw:3, r:4})]));
add('Motion graphics', 'Badge "NEW"', () => grp([star(0, 0, 80, 64, 16, '#E74C3C'), ell(0, 0, 58, 58, '#C0392B'), txt('NEW', 0, 2, 34, '#FFFFFF')]));
add('Motion graphics', 'Speech bubble', () => grp([rect(0, 0, 300, 140, '#FFFFFF', {r:30, stroke:'#2C3E50', lw:5}), poly([[-70, 64], [-110, 120], [-30, 66]], '#FFFFFF', {stroke:'#2C3E50', lw:5}), rect(-70, 62, 46, 10, '#FFFFFF'), txt('Hello!', 0, 0, 44, '#2C3E50')]));
add('Motion graphics', 'Subscribe button', () => grp([rect(0, 0, 320, 80, '#FF0000', {r:12}), txt('SUBSCRIBE', 14, 2, 36, '#FFFFFF'), poly([[-140, -16], [-140, 16], [-112, 0]], '#FFFFFF')]));
add('Motion graphics', 'Highlight circle', () => grp([ell(0, 0, 120, 80, null, {stroke:'#F1C40F', lw:10})]));
add('Motion graphics', 'Number badge', () => grp([ell(0, 0, 50, 50, '#2E86C1'), ell(0, 0, 42, 42, null, {stroke:'#FFFFFF', lw:3}), txt('1', 0, 2, 50, '#FFFFFF')]));
add('Motion graphics', 'Tick list item', () => grp([ell(-170, 0, 26, 26, '#27AE60'), line([[-184, 0], [-174, 12], [-156, -12]], '#FFFFFF', 7), rect(30, 0, 360, 56, '#FFFFFF', {r:10, stroke:'#D5D8DC', lw:2}), txt('Benefit point', 30, 0, 28, '#2C3E50')]));
add('Motion graphics', 'Quote card', () => grp([rect(0, 0, 560, 240, '#FFF8E7', {r:18, stroke:'#E67E22', lw:4}), txt('“', -230, -50, 100, '#E67E22'), txt('Your quote here', 0, -10, 40, '#4A2C0A'), txt('- Name', 150, 70, 26, '#A04000')]));

// ---------------------------------------------------------------- effects
add('Effects', 'Glow', () => grp([ell(0, 0, 160, 160, rad('#FFF8D6ee', '#FFE08A88', '#FFE08A00'))]));
add('Effects', 'Sparkles', () => grp([[0, 0, 40], [-90, 40, 22], [80, -50, 28], [70, 60, 16], [-60, -60, 18], [130, 10, 12]].map(([x, y, r]) => star(x, y, r, r * .22, 4, '#FFF59D'))));
add('Effects', 'Light rays', () => grp(Array.from({length:7}, (_, i) => poly([[(i - 3) * 30 - 10, -200], [(i - 3) * 30 + 10, -200], [(i - 3) * 90 + 50, 200], [(i - 3) * 90 - 50, 200]], '#FFFFFF', {op:.18}))));
add('Effects', 'Smoke', () => grp([[0, 60, 40], [20, 10, 50], [-10, -50, 60], [30, -110, 70]].map(([x, y, r], i) => ell(x, y, r, r * .8, '#BDBDBD', {op:.5 - i * .08}))));
add('Effects', 'Rain', () => { const ch = []; for(let i = 0; i < 60; i++){ const x = (R(i) - .5) * 600, y = (R(i, 2) - .5) * 360; ch.push(line([[x, y], [x - 8, y + 30]], '#90CAF9', 2.5, {op:.7})); } return grp(ch); });
add('Effects', 'Falling petals', () => { const ch = []; for(let i = 0; i < 28; i++){ const x = (R(i) - .5) * 600, y = (R(i, 2) - .5) * 360; ch.push(ell(x, y, 9, 5, i % 3 ? '#F48FB1' : '#F06292', {rot:(i * 47) % 180})); } return grp(ch); });
add('Effects', 'Confetti', () => { const C = ['#E74C3C', '#F1C40F', '#2ECC71', '#3498DB', '#9B59B6', '#E67E22'], ch = [];
  for(let i = 0; i < 50; i++){ const x = (R(i) - .5) * 600, y = (R(i, 2) - .5) * 360; ch.push(rect(x, y, 12, 6, C[i % C.length], {rot:(i * 53) % 180})); } return grp(ch); });
add('Effects', 'Fire', () => grp([blob([[0, -150], [40, -80], [60, -10], [40, 50], [0, 66], [-40, 50], [-60, -10], [-40, -80]], lin('#FFEB3B', '#FF9800', '#E64A19')),
  blob([[0, -80], [22, -30], [26, 20], [0, 46], [-26, 20], [-22, -30]], lin('#FFFDE7', '#FFEB3B')), ell(0, 70, 80, 14, '#5D4037')]));

window.VG_LIBRARY = LIB;
})();
