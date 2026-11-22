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
