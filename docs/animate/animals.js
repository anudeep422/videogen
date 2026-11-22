/* ==========================================================================
   VideoGen Animator – animals with movement (no AI, drawn with code).
   Animals use the same character object {type:'char', preset:'cow', actions:[...]}
   so Walk / Run / Sit / Eat / Talk, Turn, Move forward and colours all work.
   Four-legged animals walk with a real four-beat gait; birds fly; snakes slither.
   ========================================================================== */
(function(){
const C = window.VG_CHAR; if(!C) return;
const D2R = Math.PI / 180, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), TAU = Math.PI * 2;
const dir = a => [Math.sin(a * D2R), Math.cos(a * D2R)];
function shade(c, f){ const n = parseInt(c.slice(1, 7), 16); return '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.min(255, Math.round(v * f)).toString(16).padStart(2, '0')).join(''); }

// kind: quad | elephant | bird | snake.  top = main colour, bottom = second colour (patches, stripes, mane), skin = snout / hooves
const A = {
  cow:      {name:'Cow', kind:'quad', top:'#F4F1EA', bottom:'#5D4037', skin:'#E8B4A0', L:150, bh:66, leg:72, legW:13, neck:42, head:[34, 22], horns:'small', hump:true, dewlap:true, patches:true, tail:70},
  bull:     {name:'Bull (Nandi)', kind:'quad', top:'#E0DED8', bottom:'#9E9E9E', skin:'#BCAAA4', L:165, bh:74, leg:74, legW:15, neck:40, head:[36, 24], horns:'big', hump:'big', dewlap:true, tail:72},
  buffalo:  {name:'Buffalo', kind:'quad', top:'#2B2B2B', bottom:'#3A3A3A', skin:'#555555', L:160, bh:74, leg:66, legW:15, neck:36, head:[36, 24], horns:'curved', tail:60},
  horse:    {name:'Horse', kind:'quad', top:'#8D5524', bottom:'#2B1B10', skin:'#3E2723', L:150, bh:60, leg:92, legW:11, neck:62, head:[38, 18], mane:true, tail:80, longTail:true},
  deer:     {name:'Deer', kind:'quad', top:'#C68642', bottom:'#FFFFFF', skin:'#3E2723', L:120, bh:48, leg:84, legW:8, neck:52, head:[28, 15], antlers:true, spots:true, tail:18},
  goat:     {name:'Goat', kind:'quad', top:'#EDE7DC', bottom:'#6D4C41', skin:'#BCAAA4', L:100, bh:46, leg:52, legW:8, neck:34, head:[26, 15], horns:'goat', beard:true, tail:16},
  dog:      {name:'Dog', kind:'quad', top:'#C8A165', bottom:'#8D6E63', skin:'#3E2723', L:92, bh:38, leg:44, legW:9, neck:26, head:[26, 17], ears:'flop', tail:38, tailUp:true},
  cat:      {name:'Cat', kind:'quad', top:'#9E9E9E', bottom:'#616161', skin:'#F8BBD0', L:70, bh:28, leg:30, legW:7, neck:16, head:[20, 16], ears:'cat', stripes:true, tail:50, tailUp:true},
  tiger:    {name:'Tiger', kind:'quad', top:'#E67E22', bottom:'#1B1B1B', skin:'#FFFFFF', L:170, bh:58, leg:58, legW:16, neck:26, head:[38, 30], ears:'round', stripes:true, tail:90, cat:true},
  lion:     {name:'Lion', kind:'quad', top:'#D4A65A', bottom:'#8B5A2B', skin:'#F3E5C8', L:165, bh:60, leg:62, legW:16, neck:26, head:[38, 30], ears:'round', lionMane:true, tail:85, cat:true},
  monkey:   {name:'Monkey', kind:'quad', top:'#8D6E63', bottom:'#D7CCC8', skin:'#F2C9A8', L:70, bh:40, leg:46, legW:8, neck:14, head:[22, 20], ears:'round', tail:90, tailUp:true, monkey:true},
  elephant: {name:'Elephant', kind:'elephant', top:'#8E8E93', bottom:'#6E6E73', skin:'#F5F5F0', L:200, bh:120, leg:92, legW:34, neck:10, head:[60, 58], tail:40},
  peacock:  {name:'Peacock', kind:'bird', top:'#1565C0', bottom:'#2E7D32', skin:'#F9A825', size:0.9, peacock:true},
  parrot:   {name:'Parrot', kind:'bird', top:'#43A047', bottom:'#E53935', skin:'#FFB300', size:0.55},
  crow:     {name:'Crow', kind:'bird', top:'#212121', bottom:'#424242', skin:'#303030', size:0.6},
  sparrow:  {name:'Sparrow', kind:'bird', top:'#8D6E63', bottom:'#D7CCC8', skin:'#5D4037', size:0.4},
  snake:    {name:'Snake (cobra)', kind:'snake', top:'#5D4037', bottom:'#C8A165', skin:'#E53935'},
};
for(const [k, v] of Object.entries(A)) C.PRESETS[k] = {hair:'#000000', ...v, animal:true};
if(!C.ACTIONS.find(a => a[0] === 'eat')) C.ACTIONS.push(['eat', 'Eat / graze', '🌿']);

// ---------------------------------------------------------------- four-legged animals
function legSeg(c, x, y, a1, l1, a2, l2, w, col, hoof){
  const [dx1, dy1] = dir(a1), kx = x + dx1 * l1, ky = y + dy1 * l1, [dx2, dy2] = dir(a2), ex = kx + dx2 * l2, ey = ky + dy2 * l2;
  c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(kx, ky); c.stroke();
  c.lineWidth = w * 0.8; c.beginPath(); c.moveTo(kx, ky); c.lineTo(ex, ey); c.stroke();
  if(hoof){ c.fillStyle = hoof; c.beginPath(); c.ellipse(ex + 2, ey - 1, w * 0.55, w * 0.38, 0, 0, TAU); c.fill(); }
}
function gait(act, t){
  // returns per-leg [upper angle, knee bend] for BL, FL, BR, FR plus body bob, and neck/head offsets
  const g = {legs:[[0, 4], [0, 4], [0, 4], [0, 4]], bob:0, neck:0, mouth:0, lie:0, jump:0, tail:Math.sin(t * 2.2) * 12};
  if(act === 'walk' || act === 'run'){
    const run = act === 'run', f = run ? 2.6 : 1.4, amp = run ? 34 : 20, ph = t * f * TAU;
    const off = run ? [0, 0.15, 0.5, 0.65] : [0, 0.25, 0.5, 0.75];
    g.legs = off.map((o, i) => { const s = Math.sin(ph + o * TAU), lift = Math.max(0, Math.cos(ph + o * TAU)); return [amp * s, 6 + (run ? 40 : 26) * lift]; });
    g.bob = (run ? 7 : 2.5) * Math.abs(Math.sin(ph)); g.neck = run ? -10 + 6 * Math.sin(ph * 2) : 3 * Math.sin(ph * 2); g.tail = run ? -25 : Math.sin(ph) * 15;
  } else if(act === 'eat'){ g.neck = 70 + 4 * Math.sin(t * 6); g.mouth = 0.3 + 0.3 * Math.abs(Math.sin(t * 6)); }
  else if(act === 'sit'){ g.lie = 1; }
  else if(act === 'jump'){ const u = (t % 1.1) / 1.1; g.jump = Math.sin(Math.PI * clamp(u * 1.3, 0, 1)) * 60; g.legs = [[-35, 50], [35, 60], [-35, 50], [35, 60]].map(l => [l[0] * Math.min(1, g.jump / 30), l[1]]); }
  else if(act === 'talk' || act === 'dance'){ g.mouth = Math.abs(Math.sin(t * 7)); g.neck = -15; }
  else { g.neck = 4 * Math.sin(t * 0.7); g.bob = 1.2 * Math.sin(t * 2); }
  return g;
}
function drawQuad(c, L, o, t, act){
  const g = gait(act, t), lip = o.lip && C.lip ? C.lip(o, t) : 0; if(lip > 0.06) g.mouth = Math.max(g.mouth, lip);
  const body = L.top, dark = shade(L.top, 0.72), legL = L.leg, H = legL + L.bh * 0.35 - g.lie * legL * 0.85, y0 = -H - g.bob - g.jump;
  const shX = L.L * 0.32, hipX = -L.L * 0.32, hoof = L.cat || L.monkey ? shade(body, 0.8) : L.skin;
  // shadow
  c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(0, 3, L.L * 0.55, 7, 0, 0, TAU); c.fill();
  const leg = (x, i, far) => {
    if(g.lie){ const col = far ? dark : body; c.strokeStyle = col; c.lineWidth = L.legW; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y0 + L.bh * 0.25); c.lineTo(x + (i % 2 ? 26 : -18), -L.legW * 0.4); c.stroke(); return; }
    const [a, bend] = g.legs[i], front = i % 2 === 1, u = legL * 0.52, l = legL * 0.52;
    legSeg(c, x, y0 + L.bh * 0.2, a, u, front ? a - bend : a + bend * 0.9, l, L.legW, far ? dark : body, far ? shade(hoof, 0.8) : hoof);
  };
  // far legs
  leg(hipX + 6, 2, true); leg(shX + 6, 3, true);
  // tail
  const tx = -L.L / 2 + 4, ty = y0 - L.bh * 0.2;
  c.strokeStyle = L.longTail ? L.bottom : body; c.lineWidth = L.longTail ? 9 : Math.max(3, L.legW * 0.35); c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty);
  if(L.tailUp){ const sw = g.tail; c.quadraticCurveTo(tx - L.tail * 0.5, ty - L.tail * 0.2 + sw * 0.3, tx - L.tail * 0.45 + sw * 0.4, ty - L.tail * 0.9); }
  else { const ey = Math.min(ty + L.tail, -4), ex = tx - 8 + g.tail * 0.6 - (ty + L.tail - ey) * 0.8; c.quadraticCurveTo(tx - 14 + g.tail * 0.2, (ty + ey) / 2, ex, ey); L._te = [ex, ey]; }
  c.stroke(); if(!L.tailUp && !L.cat && !L.longTail && L._te){ c.fillStyle = L.bottom; c.beginPath(); c.ellipse(L._te[0], L._te[1] + 3, 5, 8, 0, 0, TAU); c.fill(); }
  // body
  c.save(); c.fillStyle = body; c.beginPath(); c.ellipse(0, y0, L.L / 2, L.bh / 2, 0, 0, TAU); c.fill(); c.strokeStyle = shade(body, 0.82); c.lineWidth = 2; c.stroke(); c.clip();
  if(L.patches){ c.fillStyle = L.bottom; [[-30, -10, 22, 16], [25, 6, 18, 12], [-5, 18, 14, 9], [45, -16, 12, 10]].forEach(([x, y, rx, ry]) => { c.beginPath(); c.ellipse(x, y0 + y, rx, ry, 0.4, 0, TAU); c.fill(); }); }
  if(L.stripes){ c.strokeStyle = L.bottom; c.lineWidth = L.L * 0.035; for(let k = -4; k <= 4; k++){ const x = k * L.L * 0.1; c.beginPath(); c.moveTo(x - 4, y0 - L.bh / 2); c.quadraticCurveTo(x + 6, y0 - L.bh * 0.1, x - 2, y0 + L.bh * 0.2); c.stroke(); } }
  if(L.spots){ c.fillStyle = L.bottom; for(let k = 0; k < 12; k++){ c.beginPath(); c.arc(-L.L * 0.35 + (k * 37 % 70) / 70 * L.L * 0.7, y0 - L.bh * 0.25 + (k * 13 % 10) / 10 * L.bh * 0.3, 2.6, 0, TAU); c.fill(); } }
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.ellipse(0, y0 - L.bh * 0.22, L.L * 0.42, L.bh * 0.18, 0, 0, TAU); c.fill();
  c.restore();
  if(L.hump){ c.fillStyle = body; c.beginPath(); c.ellipse(shX * 0.9, y0 - L.bh * 0.45, L.hump === 'big' ? 26 : 18, L.hump === 'big' ? 22 : 14, -0.2, 0, TAU); c.fill(); }
  // near legs
  leg(hipX, 0, false); leg(shX, 1, false);
  // neck and head
  const nx0 = L.L * 0.4, ny0 = y0 - L.bh * 0.12, na = (L.monkey ? 160 : 140) - g.neck - (L.cat ? 20 : 0), [ndx, ndy] = dir(na);
  const hx = nx0 + ndx * L.neck, hy = ny0 + ndy * L.neck;
  c.strokeStyle = body; c.lineWidth = L.bh * (L.cat ? 0.6 : 0.5); c.lineCap = 'round'; c.beginPath(); c.moveTo(nx0 - 6, ny0); c.lineTo(hx, hy); c.stroke();
  if(L.mane){ c.strokeStyle = L.bottom; c.lineWidth = 8; c.beginPath(); c.moveTo(nx0 - 10, ny0 - L.bh * 0.22); c.lineTo(hx - 6, hy - 12); c.stroke(); }
  if(L.dewlap){ c.fillStyle = body; c.beginPath(); c.moveTo(nx0, ny0 + 4); c.quadraticCurveTo((nx0 + hx) / 2, (ny0 + hy) / 2 + 30, hx + 4, hy + 8); c.lineTo(hx, hy); c.fill(); }
  if(L.lionMane){ c.fillStyle = L.bottom; c.beginPath(); c.arc(hx - 4, hy, L.head[1] * 1.25, 0, TAU); c.fill(); }
  const tilt = (g.neck > 40 ? 50 : 0) + (act === 'talk' ? -10 : 0);
  c.save(); c.translate(hx, hy); c.rotate(tilt * D2R);
  const [hw, hh] = L.head;
  if(L.ears === 'cat' || L.ears === 'round'){ c.fillStyle = shade(body, 0.85); c.beginPath(); if(L.ears === 'cat'){ c.moveTo(-6, -hh * 0.6); c.lineTo(-1, -hh * 1.3); c.lineTo(5, -hh * 0.6); } else c.arc(-2, -hh * 0.75, hh * 0.35, 0, TAU); c.fill(); }
  else if(L.ears === 'flop'){ c.fillStyle = L.bottom; c.beginPath(); c.ellipse(-6, -hh * 0.1, 6, 13, 0.3, 0, TAU); c.fill(); }
  else { c.fillStyle = shade(body, 0.85); c.beginPath(); c.ellipse(-10, -hh * 0.55, 10, 5, -0.6, 0, TAU); c.fill(); }
  if(L.horns === 'small' || L.horns === 'big'){ const s = L.horns === 'big' ? 1.6 : 1; c.strokeStyle = '#D7CCC8'; c.lineWidth = 5 * s * 0.7; c.beginPath(); c.moveTo(-2, -hh * 0.6); c.quadraticCurveTo(-4, -hh * 0.6 - 14 * s, 6, -hh * 0.6 - 20 * s); c.stroke(); }
  if(L.horns === 'curved'){ c.strokeStyle = '#3E3E3E'; c.lineWidth = 7; c.beginPath(); c.moveTo(-2, -hh * 0.5); c.quadraticCurveTo(-34, -hh * 0.9, -26, hh * 0.4); c.stroke(); }
  if(L.horns === 'goat'){ c.strokeStyle = '#8D6E63'; c.lineWidth = 4; c.beginPath(); c.moveTo(-2, -hh * 0.6); c.quadraticCurveTo(-14, -hh * 1.6, -20, -hh * 0.7); c.stroke(); }
  if(L.antlers){ c.strokeStyle = '#8D6E63'; c.lineWidth = 3; c.beginPath(); c.moveTo(-2, -hh * 0.6); c.lineTo(-6, -hh * 2.4); c.moveTo(-4, -hh * 1.4); c.lineTo(6, -hh * 2.1); c.moveTo(-5, -hh * 1.9); c.lineTo(-16, -hh * 2.5); c.stroke(); }
  // head shape + snout
  c.fillStyle = body; c.strokeStyle = shade(body, 0.82); c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, hw * 0.55, hh * 0.62, 0, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(hw * 0.42, hh * 0.12, hw * 0.42, hh * 0.45, 0.15, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.ellipse(0, 0, hw * 0.5, hh * 0.56, 0, 0, TAU); c.fill();
  c.fillStyle = L.cat || L.monkey ? L.skin : shade(L.skin, 1); c.beginPath(); c.ellipse(hw * 0.72, hh * 0.22, hw * 0.2, hh * 0.32, 0, 0, TAU); c.fill();
  if(L.beard){ c.fillStyle = '#E0E0E0'; c.beginPath(); c.moveTo(hw * 0.5, hh * 0.5); c.lineTo(hw * 0.45, hh * 1.2); c.lineTo(hw * 0.62, hh * 0.5); c.fill(); }
  // mouth (opens for talk / eat / lip sync)
  if(g.mouth > 0.08){ c.fillStyle = '#4E342E'; c.beginPath(); c.ellipse(hw * 0.7, hh * 0.5, hw * 0.16, 1 + hh * 0.22 * g.mouth, 0, 0, TAU); c.fill(); }
  // eye with blink
  const blink = ((t + (o.blinkOff || 0)) % 4) < 0.12;
  c.fillStyle = '#111'; c.beginPath(); if(blink) c.rect(hw * 0.1, -hh * 0.18, 7, 1.6); else c.arc(hw * 0.14, -hh * 0.16, Math.max(2.4, hh * 0.12), 0, TAU); c.fill();
  if(!blink){ c.fillStyle = '#fff'; c.beginPath(); c.arc(hw * 0.14 + 1, -hh * 0.16 - 1, 0.9, 0, TAU); c.fill(); }
  if(L.cat || L.lionMane){ c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1; for(const k of [-1, 0, 1]){ c.beginPath(); c.moveTo(hw * 0.8, hh * 0.25); c.lineTo(hw * 1.25, hh * 0.25 + k * 6); c.stroke(); } }
  c.restore();
}

// ---------------------------------------------------------------- elephant
function drawElephant(c, L, o, t, act){
  const g = gait(act, t), lip = o.lip && C.lip ? C.lip(o, t) : 0, body = L.top, dark = shade(body, 0.75);
  const H = L.leg + L.bh * 0.3 - g.lie * L.leg * 0.8, y0 = -H - g.bob * 0.6 - g.jump * 0.3;
  c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(0, 3, L.L * 0.55, 9, 0, 0, TAU); c.fill();
  const leg = (x, i, far) => { const [a] = g.legs[i]; const [dx, dy] = dir(a * 0.6), len = g.lie ? 20 : L.leg + L.bh * 0.15;
    c.strokeStyle = far ? dark : body; c.lineWidth = L.legW; c.lineCap = 'butt'; c.beginPath(); c.moveTo(x, y0 + L.bh * 0.1); c.lineTo(x + dx * len, y0 + L.bh * 0.1 + dy * len); c.stroke();
    c.fillStyle = L.skin; c.beginPath(); c.ellipse(x + dx * len, y0 + L.bh * 0.1 + dy * len - 3, L.legW * 0.5, 4, 0, 0, TAU); c.fill(); };
  leg(-L.L * 0.28 + 10, 2, true); leg(L.L * 0.26 + 10, 3, true);
  c.strokeStyle = body; c.lineWidth = 5; c.beginPath(); c.moveTo(-L.L / 2 + 4, y0 - 10); c.quadraticCurveTo(-L.L / 2 - 8, y0 + 20, -L.L / 2 - 4 + g.tail * 0.3, y0 + L.tail); c.stroke();
  c.fillStyle = body; c.beginPath(); c.ellipse(0, y0, L.L / 2, L.bh / 2, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.ellipse(-10, y0 - L.bh * 0.25, L.L * 0.38, L.bh * 0.15, 0, 0, TAU); c.fill();
  leg(-L.L * 0.28, 0, false); leg(L.L * 0.26, 1, false);
  // head, ear, trunk
  const hx = L.L * 0.46, hy = y0 - L.bh * 0.28 + (act === 'eat' ? 18 : 0), [hw, hh] = L.head;
  c.fillStyle = body; c.beginPath(); c.ellipse(hx, hy, hw * 0.55, hh * 0.55, 0, 0, TAU); c.fill();
  const sway = act === 'eat' ? 0.8 : act === 'talk' || lip > 0.06 ? 0.6 : Math.sin(t * 1.3) * 0.25;
  c.strokeStyle = body; c.lineCap = 'round'; c.lineWidth = 18; c.beginPath(); c.moveTo(hx + hw * 0.35, hy + 4);
  if(act === 'talk' || lip > 0.06){ c.quadraticCurveTo(hx + hw * 0.9, hy - 10, hx + hw * 0.8 + 10 * Math.sin(t * 6), hy - hh * 0.9); }
  else c.quadraticCurveTo(hx + hw * (0.75 + sway * 0.3), hy + hh * 0.6, hx + hw * (0.55 + sway * 0.5), hy + hh * (1.15 - sway * 0.2));
  c.stroke(); c.lineWidth = 10; c.stroke();
  c.strokeStyle = L.skin; c.lineWidth = 6; c.beginPath(); c.moveTo(hx + hw * 0.25, hy + hh * 0.28); c.quadraticCurveTo(hx + hw * 0.5, hy + hh * 0.5, hx + hw * 0.62, hy + hh * 0.36); c.stroke();
  const flap = Math.sin(t * 2.4) * 0.15; c.fillStyle = L.bottom; c.beginPath(); c.ellipse(hx - hw * 0.25, hy + 4, hw * 0.42, hh * 0.6, 0.2 + flap, 0, TAU); c.fill();
  const blink = ((t + (o.blinkOff || 0)) % 4) < 0.12; c.fillStyle = '#111'; c.beginPath(); if(blink) c.rect(hx + hw * 0.12, hy - hh * 0.12, 7, 1.5); else c.arc(hx + hw * 0.16, hy - hh * 0.12, 3.5, 0, TAU); c.fill();
}

// ---------------------------------------------------------------- birds (fly when walking / running; peacock opens its tail when dancing)
function drawBird(c, L, o, t, act){
  const fly = act === 'walk' || act === 'run', lip = o.lip && C.lip ? C.lip(o, t) : 0, f = act === 'run' ? 9 : 6, flap = fly ? Math.sin(t * f * TAU / 2) : 0;
  const y0 = fly ? -70 - 8 * Math.sin(t * f) : -38, s = 1;
  if(!fly){ c.strokeStyle = L.skin; c.lineWidth = 3; c.beginPath(); c.moveTo(-4, y0 + 14); c.lineTo(-6, 0); c.moveTo(6, y0 + 14); c.lineTo(5, 0); c.stroke(); }
  else { c.fillStyle = 'rgba(0,0,0,0.1)'; c.beginPath(); c.ellipse(0, 2, 22, 4, 0, 0, TAU); c.fill(); }
  // tail
  if(L.peacock){ const open = act === 'dance' ? 1 : 0;
    if(open){ for(let k = 0; k < 15; k++){ const a = (-75 + k * 10.7) * D2R + Math.sin(t * 3) * 0.02, r = 120; const x = -10 + Math.sin(a) * -r, y = y0 - Math.cos(a) * r * 0.95;
        c.strokeStyle = L.bottom; c.lineWidth = 4; c.beginPath(); c.moveTo(-10, y0); c.lineTo(x, y); c.stroke(); c.fillStyle = '#2E7D32'; c.beginPath(); c.ellipse(x, y, 13, 16, a, 0, TAU); c.fill();
        c.fillStyle = '#F9A825'; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill(); c.fillStyle = '#0D47A1'; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill(); } }
    else { c.fillStyle = L.bottom; c.beginPath(); c.moveTo(-14, y0 + 2); c.quadraticCurveTo(-80, y0 + 10, -120, y0 + 30); c.quadraticCurveTo(-70, y0 + 22, -10, y0 + 10); c.fill();
      c.fillStyle = '#1565C0'; for(let k = 0; k < 5; k++){ c.beginPath(); c.arc(-40 - k * 16, y0 + 12 + k * 3.5, 3.5, 0, TAU); c.fill(); } } }
  else { c.fillStyle = shade(L.top, 0.8); c.beginPath(); c.moveTo(-14, y0); c.lineTo(-38, y0 + 6 + flap * 3); c.lineTo(-34, y0 + 12); c.lineTo(-10, y0 + 8); c.fill(); }
  // far wing
  c.fillStyle = shade(L.top, 0.75); c.beginPath(); c.moveTo(-2, y0 - 2); c.quadraticCurveTo(-6, y0 - 26 * flap - 10, -26, y0 - 34 * flap - 4); c.lineTo(-18, y0 + 4); c.fill();
  // body + head
  c.fillStyle = L.top; c.beginPath(); c.ellipse(0, y0, 20, 13, -0.15, 0, TAU); c.fill();
  if(L.peacock){ c.strokeStyle = L.top; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(12, y0 - 6); c.lineTo(20, y0 - 30); c.stroke(); }
  const hx = L.peacock ? 22 : 18, hy = L.peacock ? y0 - 34 : y0 - 10;
  c.fillStyle = L.top; c.beginPath(); c.arc(hx, hy, L.peacock ? 7 : 9, 0, TAU); c.fill();
  if(L.peacock){ c.strokeStyle = L.top; c.lineWidth = 1.5; for(const k of [-1, 0, 1]){ c.beginPath(); c.moveTo(hx, hy - 6); c.lineTo(hx + k * 4, hy - 16); c.stroke(); c.beginPath(); c.arc(hx + k * 4, hy - 17, 2, 0, TAU); c.fillStyle = L.top; c.fill(); } }
  if(!L.peacock && L.bottom !== L.top){ c.fillStyle = L.bottom; c.beginPath(); c.ellipse(6, y0 + 4, 10, 6, 0, 0, TAU); c.fill(); }
  const open = act === 'talk' || lip > 0.06 ? Math.max(Math.abs(Math.sin(t * 9)), lip) : 0;
  c.fillStyle = L.skin; c.beginPath(); c.moveTo(hx + 6, hy - 2 - open * 2); c.lineTo(hx + 18, hy + 1); c.lineTo(hx + 6, hy + 3 + open * 3); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.arc(hx + 3, hy - 2, 2, 0, TAU); c.fill();
  // near wing
  c.fillStyle = shade(L.top, fly ? 0.9 : 0.85); c.beginPath(); c.moveTo(4, y0 - 2); c.quadraticCurveTo(0, y0 - 30 * flap - 6, -24, y0 - 40 * flap); c.quadraticCurveTo(-14, y0 + 6, 4, y0 + 4); c.fill();
}

// ---------------------------------------------------------------- snake
function drawSnake(c, L, o, t, act){
  const move = act === 'walk' || act === 'run', sp = act === 'run' ? 3 : 1.6, n = 40, len = 220, lip = o.lip && C.lip ? C.lip(o, t) : 0;
  const pts = [];
  for(let i = 0; i <= n; i++){ const u = i / n, x = -len / 2 + u * len * (move ? 1 : 0.55);
    const y = move ? -6 + Math.sin(u * 3.5 * TAU - t * sp * TAU) * 10 * (0.4 + u * 0.6) : -6 + Math.sin(u * 2 * TAU) * 16 * (1 - u * 0.5);
    pts.push([x, y]); }
  const rise = !move ? 1 : 0, head = pts[n]; const hx = head[0] + (rise ? 18 : 6), hy = head[1] - rise * 70 - (act === 'talk' ? 6 * Math.sin(t * 5) : 0);
  c.lineCap = 'round'; c.lineJoin = 'round';
  for(const [w, col] of [[16, shade(L.top, 0.8)], [12, L.top]]){ c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); if(rise) c.quadraticCurveTo(head[0] + 22, head[1] - 10, hx, hy + 14); c.stroke(); }
  c.fillStyle = L.bottom; for(let i = 2; i < n; i += 3){ c.beginPath(); c.arc(pts[i][0], pts[i][1], 2.5, 0, TAU); c.fill(); }
  if(rise){ c.fillStyle = L.top; c.beginPath(); c.ellipse(hx - 2, hy + 18, 14, 22, 0, 0, TAU); c.fill(); c.fillStyle = L.bottom; c.beginPath(); c.ellipse(hx - 2, hy + 18, 7, 14, 0, 0, TAU); c.fill(); }
  c.fillStyle = L.top; c.beginPath(); c.ellipse(hx + 4, hy, 12, 8, 0.1, 0, TAU); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.arc(hx + 8, hy - 3, 2, 0, TAU); c.fill();
  if(act === 'talk' || lip > 0.06 || (t % 2.5) < 0.4){ c.strokeStyle = L.skin; c.lineWidth = 1.6; c.beginPath(); c.moveTo(hx + 15, hy + 1); c.lineTo(hx + 26, hy + 1); c.lineTo(hx + 30, hy - 2); c.moveTo(hx + 26, hy + 1); c.lineTo(hx + 30, hy + 4); c.stroke(); }
}

// ---------------------------------------------------------------- hook into the character system
const draw0 = C.draw, box0 = C.box;
C.draw = function(c, o, t){
  const L = Object.assign({}, C.PRESETS[o.preset] || {}, o.look || {});
  if(!L.animal) return draw0(c, o, t);
  let face = o.face || 1;
  if(o.autoFace !== false && o.keys && o.keys.x && o.keys.x.length > 1 && window.propAt){ const v = window.propAt(o.__base || o, 'x', t + 0.05) - window.propAt(o.__base || o, 'x', t - 0.05); if(Math.abs(v) > 0.3) face = v > 0 ? 1 : -1; }
  const act = C.actionAt(o, t), sz = L.size || 1;
  c.save(); c.scale(face * sz, sz);
  if(L.kind === 'elephant') drawElephant(c, L, o, t, act); else if(L.kind === 'bird') drawBird(c, L, o, t, act); else if(L.kind === 'snake') drawSnake(c, L, o, t, act); else drawQuad(c, L, o, t, act);
  c.restore();
};
C.box = function(o){
  const L = C.PRESETS[o.preset]; if(!L || !L.animal) return box0(o);
  const sz = L.size || 1;
  if(L.kind === 'bird') return [-50 * sz * (L.peacock ? 2.6 : 1), -110 * sz * (L.peacock ? 1.5 : 1), 50 * sz, 6];
  if(L.kind === 'snake') return [-115, -110, 60, 10];
  const w = L.L / 2 + (L.tail || 20) * 0.4, h = L.leg + L.bh + L.neck + L.head[1] * 1.6;
  return [-w * sz, -h * sz, (L.L / 2 + L.head[0] + 20) * sz, 8];
};
// library entries ("Animals")
if(window.VG_LIBRARY) Object.keys(A).reverse().forEach(k => window.VG_LIBRARY.unshift({cat:'Animals', name:A[k].name, make:() => C.make(k)}));
})();
