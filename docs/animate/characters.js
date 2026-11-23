/* ==========================================================================
   VideoGen Animator – animated characters (bones + ready actions). No AI.
   A character is one object {type:'char', look..., face, actions:[{a, t0, t1}]}.
   Its pose at any time is calculated from the action (walk, run, wave…), then
   the body is drawn joint by joint: hip → knee → foot, shoulder → elbow → hand.
   ========================================================================== */
(function(){
const D2R = Math.PI / 180, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- looks
const PRESETS = {
  man:     {name:'Man', skin:'#9A6340', hair:'#1E1611', top:'#2E86C1', bottom:'#2C3E50', style:'pants', moustache:true},
  woman:   {name:'Woman in saree', skin:'#9A6340', hair:'#1E1611', top:'#1E8449', bottom:'#C8102E', extra:'#E7B416', style:'saree', bun:true, bindi:true},
  boy:     {name:'Boy', skin:'#9A6340', hair:'#1E1611', top:'#E74C3C', bottom:'#2C3E50', style:'shorts', size:0.7},
  girl:    {name:'Girl', skin:'#9A6340', hair:'#1E1611', top:'#F06292', bottom:'#F06292', extra:'#FFEB3B', style:'frock', plait:true, bindi:true, size:0.68},
  farmer:  {name:'Farmer', skin:'#8B5A3C', hair:'#1E1611', top:'#F4F1E8', bottom:'#FFFFFF', extra:'#B03A2E', style:'dhoti', turban:'#C0392B', moustache:true},
  elder:   {name:'Grandfather', skin:'#9A6340', hair:'#9E9E9E', top:'#FDFEFE', bottom:'#FFFFFF', extra:'#D5DBDB', style:'dhoti', bald:true, beard:'#ECECEC', tilak:true},
  office:  {name:'Office person', skin:'#9A6340', hair:'#1E1611', top:'#FDFEFE', bottom:'#2C3E50', style:'pants', tie:'#C0392B', sleeves:true},
  advisor: {name:'Insurance advisor', skin:'#9A6340', hair:'#1E1611', top:'#1B4F72', bottom:'#1B4F72', style:'pants', tie:'#F39C12', sleeves:true},
  rishi:   {name:'Rishi (standing)', skin:'#9A6340', hair:'#6d6d6d', top:'#E67E22', bottom:'#E67E22', style:'robe', beard:'#E0E0E0', topknot:true, tilak:true},
  warrior: {name:'Warrior (sword)', skin:'#9A6340', hair:'#1E1611', top:'#7F8C8D', bottom:'#6E2C00', extra:'#B7950B', style:'shorts', helmet:'#B7950B', weapon:'sword', moustache:true, sleeves:false},
  archer:  {name:'Archer (bow)', skin:'#8B5A3C', hair:'#1E1611', top:'#1E8449', bottom:'#6E2C00', extra:'#D4AC0D', style:'dhoti', weapon:'bow', turban:'#1E8449'},
  king:    {name:'King', skin:'#9A6340', hair:'#1E1611', top:'#8E44AD', bottom:'#F4D03F', extra:'#F1C40F', style:'dhoti', crown:'#F1C40F', moustache:true},
};
const ACTIONS = [
  ['idle', 'Stand', '🧍'], ['walk', 'Walk', '🚶'], ['run', 'Run', '🏃'], ['jump', 'Jump', '🦘'], ['sit', 'Sit', '🪑'], ['wave', 'Wave', '👋'],
  ['namaste', 'Namaste', '🙏'], ['talk', 'Talk', '🗣️'], ['point', 'Point', '👉'], ['clap', 'Clap', '👏'], ['dance', 'Dance', '💃'], ['bow', 'Bow', '🙇'],
  ['fall', 'Fall', '💫'], ['attack', 'Sword attack', '⚔️'], ['thrust', 'Sword thrust', '🗡️'], ['block', 'Block', '🛡️'], ['dodge', 'Dodge', '↩️'],
  ['hit', 'Get hit', '💥'], ['victory', 'Victory', '🏆'], ['shoot', 'Shoot arrow', '🏹'],
];
const SPEED = {walk:70, run:210};   // pixels per second at size 1 (used by "move forward")

// ---------------------------------------------------------------- poses (angles in degrees; 0 = hanging down, + = forward)
const P0 = () => ({lean:0, head:0, yOff:0, rot:0, hipF:0, kneeF:0, hipB:0, kneeB:0, shF:6, elF:10, shB:-6, elB:10, mouth:0});
function pose(a, lt, t){
  const p = P0(), br = Math.sin(t * 2.1);
  switch(a){
    case 'idle': p.yOff = br * 0.6; p.shF = 5 + br; p.shB = -5 - br; p.head = Math.sin(t * 0.7) * 2; break;
    case 'walk': { const w = 2 * Math.PI * t / 1.0, s = Math.sin(w), c = Math.cos(w);
      p.hipF = 24 * s; p.hipB = -24 * s; p.kneeF = 5 + 32 * Math.max(0, c); p.kneeB = 5 + 32 * Math.max(0, -c);
      p.shF = -22 * s; p.shB = 22 * s; p.elF = 16 + 10 * Math.max(0, -s); p.elB = 16 + 10 * Math.max(0, s); p.yOff = -3 * Math.abs(c); p.lean = 3; break; }
    case 'run': { const w = 2 * Math.PI * t / 0.62, s = Math.sin(w), c = Math.cos(w);
      p.hipF = 42 * s; p.hipB = -42 * s; p.kneeF = 12 + 78 * Math.max(0, c); p.kneeB = 12 + 78 * Math.max(0, -c);
      p.shF = -48 * s; p.shB = 48 * s; p.elF = p.elB = 88; p.yOff = -8 * Math.abs(c); p.lean = 14; p.head = -6; break; }
    case 'jump': { const ph = (lt % 1.0);
      if(ph < 0.2){ const u = ph / 0.2; p.yOff = 14 * u; p.hipF = p.hipB = 35 * u; p.kneeF = p.kneeB = 70 * u; p.shF = p.shB = -30 * u; }
      else if(ph < 0.8){ const u = (ph - 0.2) / 0.6; p.yOff = -70 * Math.sin(Math.PI * u); p.hipF = 30; p.hipB = 15; p.kneeF = 50; p.kneeB = 40; p.shF = p.shB = 150 - 40 * u; p.elF = p.elB = 10; }
      else { const u = 1 - (ph - 0.8) / 0.2; p.yOff = 12 * u; p.hipF = p.hipB = 30 * u; p.kneeF = p.kneeB = 60 * u; } break; }
    case 'sit': p.yOff = 42; p.hipF = p.hipB = 88; p.kneeF = p.kneeB = 88; p.shF = 30 + br; p.shB = 26; p.elF = p.elB = 40; break;
    case 'wave': p.shF = 155; p.elF = 25 + 28 * Math.sin(t * 10); p.head = 4; p.yOff = br * 0.6; break;
    case 'namaste': p.shF = p.shB = 38; p.elF = p.elB = 112; p.head = 10; p.lean = 4; break;
    case 'talk': p.mouth = Math.abs(Math.sin(t * 13)) * (0.6 + 0.4 * Math.sin(t * 3.3)); p.shF = 22 + 14 * Math.sin(t * 2.6); p.elF = 62 + 22 * Math.sin(t * 2.1); p.head = Math.sin(t * 4) * 3; p.yOff = br * 0.6; break;
    case 'point': p.shF = 88; p.elF = 4; p.head = -3; break;
    case 'clap': { const k = 0.5 + 0.5 * Math.sin(2 * Math.PI * t / 0.45); p.shF = 48; p.shB = 48; p.elF = 55 + 45 * k; p.elB = 55 + 45 * k; p.mouth = 0.3; break; }
    case 'dance': { const w = t * 5.5; p.lean = 8 * Math.sin(w); p.shF = 140 + 25 * Math.sin(w * 1.2); p.shB = 140 - 25 * Math.sin(w * 1.2); p.elF = p.elB = 35;
      p.hipF = 14 * Math.sin(w); p.hipB = -14 * Math.sin(w); p.kneeF = 10 + 15 * Math.max(0, Math.sin(w)); p.kneeB = 10 + 15 * Math.max(0, -Math.sin(w)); p.yOff = -5 * Math.abs(Math.sin(w)); p.mouth = 0.2; break; }
    case 'bow': { const u = clamp(lt / 0.6, 0, 1); p.lean = 42 * u; p.head = 10 * u; p.shF = 25; p.shB = 15; p.elF = p.elB = 20; break; }
    case 'fall': { const u = clamp(lt / 0.55, 0, 1), e = u * u; p.rot = -88 * e; p.shF = 6 + 80 * e; p.shB = -6 - 40 * e; p.hipF = 20 * e; p.kneeF = 25 * e; p.mouth = 0.5 * (1 - e); break; }
    case 'attack': { const ph = (lt % 0.9) / 0.9, sw = ph < 0.45 ? ph / 0.45 : 1 - (ph - 0.45) / 0.55, e = sw * sw * (3 - 2 * sw);
      p.shF = lerp(160, 50, e); p.elF = lerp(40, 5, e); p.shB = -20; p.elB = 40; p.lean = 4 + 10 * e; p.hipF = 18; p.hipB = -16; p.kneeF = 14; p.kneeB = 6; p.mouth = e > 0.6 ? 0.6 : 0; break; }
    case 'thrust': { const ph = (lt % 0.8) / 0.8, e = ph < 0.35 ? ph / 0.35 : 1 - (ph - 0.35) / 0.65, k = e * e * (3 - 2 * e);
      p.shF = lerp(60, 92, k); p.elF = lerp(75, 0, k); p.lean = lerp(0, 14, k); p.hipF = lerp(10, 34, k); p.hipB = -22; p.kneeF = lerp(10, 28, k); p.kneeB = 6; p.shB = -30; p.elB = 40; p.mouth = k > 0.7 ? 0.5 : 0; break; }
    case 'block': p.shF = 128; p.elF = 62; p.shB = -25; p.elB = 50; p.lean = -6; p.hipF = 22; p.hipB = -20; p.kneeF = 18; p.kneeB = 8; p.head = -4; p.yOff = 3 + br * 0.5; break;
    case 'dodge': { const k = Math.sin(Math.PI * clamp(lt / 0.8, 0, 1)); p.lean = -30 * k; p.yOff = 12 * k; p.hipF = 30 * k; p.kneeF = 42 * k; p.hipB = -28 * k; p.kneeB = 30 * k; p.shF = 40; p.elF = 30; p.shB = -45; p.elB = 40; p.head = -6 * k; break; }
    case 'hit': { const u = clamp(lt / 0.55, 0, 1), k = Math.sin(Math.PI * u) * (1 - u * 0.3); p.lean = -24 * k; p.head = -16 * k; p.shF = 40 + 55 * k; p.elF = 20; p.shB = -40 - 35 * k;
      p.elB = 20; p.hipF = -12 * k; p.hipB = 10 * k; p.mouth = 0.75 * k; p.yOff = 5 * k; break; }
    case 'victory': p.shF = 172; p.elF = 8; p.shB = -15; p.elB = 30; p.head = -8; p.mouth = 0.45 + 0.3 * Math.abs(Math.sin(t * 5)); p.yOff = br * 0.6; break;
    case 'shoot': { const ph = (lt % 1.4) / 1.4, pull = ph < 0.7 ? ph / 0.7 : 0; p.shF = 88; p.elF = 0; p.shB = 84; p.elB = lerp(20, 150, pull); p.lean = -3; p.hipF = 12; p.hipB = -12; break; }
  }
  return p;
}
function mixPose(a, b, w){ const o = {}; for(const k in a) o[k] = lerp(a[k], b[k], w); return o; }
function poseAt(o, t){
  const acts = o.actions || []; let seg = null;
  for(const s of acts) if(t >= s.t0 && t <= s.t1) seg = s;
  const idle = pose('idle', t, t);
  if(!seg){ const last = acts.filter(s => s.t1 < t && s.a === 'fall' && s.stay).pop(); if(last) return pose('fall', 9, t); return idle; }
  const lt = t - seg.t0, ps = pose(seg.a, lt, t), ramp = 0.18;
  let w = Math.min(1, lt / ramp, (seg.t1 - t) / ramp);
  if(seg.a === 'fall') w = Math.min(1, (seg.t1 - t) / 0.4);   // falls instantly, gets up at the end
  return w >= 1 ? ps : mixPose(idle, ps, clamp(w, 0, 1));
}
function actionAt(o, t){ for(const s of o.actions || []) if(t >= s.t0 && t <= s.t1) return s.a; return 'idle'; }

// ---------------------------------------------------------------- drawing
const dir = a => [Math.sin(a * D2R), Math.cos(a * D2R)];
function shade(c, f){ const n = parseInt(c.slice(1, 7), 16); return '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.min(255, Math.round(v * f)).toString(16).padStart(2, '0')).join(''); }
// cartoon style: dark outlines around every part, soft shading, big eyes (look.style = 'simple' gives the old flat look)
const OUT = '#24160f'; let TOON = true, OW = 3;
function limb(c, x, y, a1, l1, a2, l2, w1, w2, col1, col2){
  const [dx1, dy1] = dir(a1), kx = x + dx1 * l1, ky = y + dy1 * l1, [dx2, dy2] = dir(a2), ex = kx + dx2 * l2, ey = ky + dy2 * l2;
  if(TOON){ c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = w1 + OW; c.beginPath(); c.moveTo(x, y); c.lineTo(kx, ky); c.stroke(); c.lineWidth = w2 + OW; c.beginPath(); c.moveTo(kx, ky); c.lineTo(ex, ey); c.stroke(); }
  c.lineCap = 'round'; c.strokeStyle = col1; c.lineWidth = w1; c.beginPath(); c.moveTo(x, y); c.lineTo(kx, ky); c.stroke();
  c.strokeStyle = col2 || col1; c.lineWidth = w2; c.beginPath(); c.moveTo(kx, ky); c.lineTo(ex, ey); c.stroke();
  return [kx, ky, ex, ey, a2];
}
function draw(c, o, t){
  const L = Object.assign({}, PRESETS[o.preset] || PRESETS.man, o.look || {});
  const p = poseAt(o, t), act = actionAt(o, t);
  TOON = L.style2 !== 'simple'; OW = 3;
  const sway = (act === 'run' ? 6 : act === 'walk' ? 3.5 : act === 'dance' ? 7 : 1.2) * Math.sin(t * (act === 'run' ? 10 : act === 'walk' ? 6.3 : 2.4));   // hair and cloth swing
  // lip sync: mouth opens with the loudness of the chosen voice recording, head moves a little
  if(o.lip && window.VG_CHAR.lip){ const lv = window.VG_CHAR.lip(o, t); if(lv > 0.06){ p.mouth = Math.max(p.mouth, Math.min(1, lv * 1.15)); p.head = (p.head || 0) + lv * 4 * Math.sin(t * 4.3); } }
  let face = o.face || 1;
  if(o.autoFace !== false && o.keys && o.keys.x && o.keys.x.length > 1 && window.propAt){ const v = window.propAt(o.__base || o, 'x', t + 0.05) - window.propAt(o.__base || o, 'x', t - 0.05); if(Math.abs(v) > 0.3) face = Math.sign(v) * Math.sign(o.scaleX || 1); }
  const sz = L.size || 1; c.save(); c.scale(face * sz, sz);
  if(p.rot) c.rotate(p.rot * D2R);
  c.translate(0, p.yOff);
  const skin = L.skin, top = L.top, bot = L.bottom, sk2 = shade(skin, 0.85), H = [0, -88];
  const robe = L.style === 'saree' || L.style === 'robe', dhoti = L.style === 'dhoti', frock = L.style === 'frock', shorts = L.style === 'shorts';
  // shadow (drawn un-rotated feeling)
  c.save(); c.translate(0, -p.yOff); c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 2, 30 - Math.max(0, -p.yOff) * 0.2, 5, 0, 0, Math.PI * 2); c.fill(); c.restore();
  const N = [H[0] + Math.sin(p.lean * D2R) * 58, H[1] - Math.cos(p.lean * D2R) * 58];
  const S = [lerp(H[0], N[0], 0.9), lerp(H[1], N[1], 0.9)];
  const legCol = robe || dhoti || frock ? skin : bot, legColB = shade(legCol, 0.82);
  const thighCol = shorts ? bot : legCol, shinCol = shorts ? skin : legCol;
  const armUp = L.sleeves ? top : top, armLow = L.sleeves ? top : skin;
  const foot = (x, y, a, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x + 6, y + 2, 9, 4.5, 0, 0, Math.PI * 2); if(TOON){ c.strokeStyle = OUT; c.lineWidth = 2.2; c.stroke(); } c.fill(); };
  const ol = (w = 2.6) => { if(TOON){ c.strokeStyle = OUT; c.lineWidth = w; c.lineJoin = 'round'; c.stroke(); } };   // outline the current shape
  if(act === 'sit'){ c.save(); c.translate(0, -p.yOff); c.fillStyle = '#8D6E63'; c.fillRect(-26, -50, 40, 7); c.fillStyle = '#6D4C41'; c.fillRect(-24, -43, 5, 43); c.fillRect(7, -43, 5, 43); c.restore(); }
  // back arm
  const ba = limb(c, S[0] - 2, S[1], p.shB + p.lean, 30, p.shB + p.lean + p.elB, 28, 9, 8, shade(armUp, 0.82), shade(armLow, 0.82));
  c.fillStyle = sk2; c.beginPath(); c.arc(ba[2], ba[3], 5.4, 0, Math.PI * 2); ol(2.2); c.fill();
  // legs
  const bl = limb(c, H[0], H[1], p.hipB, 44, p.hipB - p.kneeB, 44, 12, 10, shade(thighCol, 0.82), shade(shinCol, 0.82)); foot(bl[2], bl[3], bl[4], '#3a2a20');
  const fl = limb(c, H[0], H[1], p.hipF, 44, p.hipF - p.kneeF, 44, 12, 10, thighCol, shinCol); foot(fl[2], fl[3], fl[4], '#4a3428');
  // skirts
  if(robe || dhoti || frock){
    const hem = robe ? 0 : dhoti ? 28 : 44, bx = Math.min(bl[2], fl[2]) - 6, fx = Math.max(bl[2], fl[2]) + 10, by = (dhoti || frock) ? Math.min(bl[1] + 18, -hem + 2) : -2;
    c.fillStyle = bot; c.beginPath(); c.moveTo(H[0] - 13, H[1] - 4); c.lineTo(H[0] + 13, H[1] - 4);
    c.lineTo(Math.max(fx, 18) + sway, -hem); c.quadraticCurveTo((Math.max(fx, 18) + Math.min(bx, -18)) / 2 + sway * 1.5, -hem + 4, Math.min(bx, -18) + sway * 0.6, -hem); c.closePath(); ol(); c.fill();
    if(TOON){ c.save(); c.clip(); c.strokeStyle = shade(bot, 0.78); c.lineWidth = 1.6; for(const k of [-8, 3]){ c.beginPath(); c.moveTo(H[0] + k, H[1]); c.quadraticCurveTo(H[0] + k * 1.6 + sway, (H[1] - hem) / 2, H[0] + k * 2 + sway * 1.2, -hem); c.stroke(); } c.restore(); }
    if(L.extra && (L.style === 'saree' || frock)){ c.fillStyle = L.extra; c.fillRect(Math.min(bx, -18) + 1, -hem - 7, Math.max(fx, 18) - Math.min(bx, -18) - 2, 6); }
    if(dhoti){ c.strokeStyle = shade(bot, 0.8); c.lineWidth = 1.5; c.beginPath(); c.moveTo(H[0] + 2, H[1]); c.lineTo(H[0] + 6, -hem); c.stroke(); }
  }
  // torso
  const perp = [Math.cos(p.lean * D2R), Math.sin(p.lean * D2R)], tw = 14, hw = robe ? 14 : 12;
  if(TOON){ const g = c.createLinearGradient(H[0] - perp[0] * 16, H[1] - perp[1] * 16, H[0] + perp[0] * 16, H[1] + perp[1] * 16); g.addColorStop(0, shade(top, 0.78)); g.addColorStop(0.45, top); g.addColorStop(1, shade(top, 1.1)); c.fillStyle = g; }
  else c.fillStyle = top;
  c.beginPath();
  c.moveTo(H[0] - perp[0] * hw, H[1] - perp[1] * hw); c.lineTo(N[0] - perp[0] * tw, N[1] - perp[1] * tw + 2);
  c.quadraticCurveTo(N[0], N[1] - 4, N[0] + perp[0] * tw, N[1] + perp[1] * tw + 2); c.lineTo(H[0] + perp[0] * (hw + 1), H[1] + perp[1] * (hw + 1)); c.closePath(); ol(); c.fill();
  if(L.style === 'saree'){ c.fillStyle = bot; c.beginPath(); c.moveTo(N[0] + perp[0] * 6, N[1] + 2); c.lineTo(N[0] - perp[0] * 14, N[1] + 4); c.lineTo(H[0] - perp[0] * 13, H[1] + 14); c.lineTo(H[0] - perp[0] * 2, H[1] + 6); c.closePath(); c.fill();
    c.fillStyle = skin; c.fillRect(H[0] - 11 + perp[0] * 2, H[1] - 8, 22, 5); }
  if(L.tie){ c.fillStyle = L.tie; c.beginPath(); const tx = N[0] + perp[0] * 11, ty = N[1] + 4; c.moveTo(tx, ty); c.lineTo(tx + 3, ty + 6); c.lineTo(tx + 1, ty + 34); c.lineTo(tx - 2, ty + 6); c.closePath(); c.fill(); }
  if(L.extra && (dhoti || L.style === 'shorts' && L.weapon)){ c.strokeStyle = L.extra; c.lineWidth = 6; c.beginPath(); c.moveTo(N[0] + perp[0] * 10, N[1] + 3); c.lineTo(H[0] - perp[0] * 10, H[1] - 6); c.stroke(); }
  if(L.weapon === 'sword' || o.preset === 'warrior'){ c.strokeStyle = shade(top, 0.7); c.lineWidth = 3; c.beginPath(); c.moveTo(H[0] - 12, H[1] - 30); c.lineTo(H[0] + 12, H[1] - 30); c.moveTo(H[0] - 12, H[1] - 18); c.lineTo(H[0] + 12, H[1] - 18); c.stroke(); }
  // head
  const ha = p.lean + p.head, hc = [N[0] + Math.sin(ha * D2R) * 21, N[1] - Math.cos(ha * D2R) * 21];
  c.fillStyle = skin; c.beginPath(); c.rect(N[0] - 4.5, N[1] - 10, 9, 12); ol(2.2); c.fill();
  c.save(); c.translate(hc[0], hc[1]); c.rotate(ha * D2R); if(TOON){ c.translate(0, -3); c.scale(1.16, 1.16); }
  if(L.plait){ if(TOON){ c.strokeStyle = OUT; c.lineWidth = 9; c.beginPath(); c.moveTo(-12, -2); c.quadraticCurveTo(-18 - sway, 14, -14 - sway * 1.6, 30); c.stroke(); }
    c.strokeStyle = L.hair; c.lineWidth = 6; c.beginPath(); c.moveTo(-12, -2); c.quadraticCurveTo(-18 - sway, 14, -14 - sway * 1.6, 30); c.stroke(); }
  if(TOON && !L.bald){ c.fillStyle = L.hair; c.beginPath(); c.ellipse(-1, -5, 16.5, 14, 0, Math.PI * 0.92, Math.PI * 2.08); c.lineWidth = 5; c.strokeStyle = OUT; c.stroke(); }   // hair outline behind the face
  c.fillStyle = skin; c.beginPath(); c.ellipse(0, 0, 16, 18, 0, 0, Math.PI * 2); ol(2.6); c.fill();
  c.beginPath(); c.moveTo(14, -2); c.lineTo(20.5, 4); c.lineTo(14, 6.5); if(TOON){ c.strokeStyle = OUT; c.lineWidth = 1.8; c.stroke(); } c.fill();   // nose
  if(TOON){ c.fillStyle = 'rgba(0,0,0,0.10)'; c.beginPath(); c.ellipse(-6, 3, 9, 13, 0, 0, Math.PI * 2); c.fill(); }   // shadow side of the face
  if(!L.bald){ c.fillStyle = L.hair; c.beginPath(); c.ellipse(-1, -5, 16.5, 14, 0, Math.PI * 0.92, Math.PI * 2.08); c.fill(); c.beginPath(); c.ellipse(-8, 0, 9, 12, 0, 0, Math.PI * 2); c.fill();
    if(TOON){ c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(-2, -13, 8, 2.6, -0.2, 0, Math.PI * 2); c.fill(); } }
  else { c.fillStyle = L.hair; c.beginPath(); c.ellipse(-10, 2, 6, 8, 0, 0, Math.PI * 2); c.fill(); }
  if(L.bun){ c.fillStyle = L.hair; c.beginPath(); c.arc(-15, -4, 7, 0, Math.PI * 2); ol(2); c.fill(); c.fillStyle = '#F7F2E8'; c.beginPath(); c.arc(-19, -9, 2.2, 0, 7); c.arc(-20, -2, 2.2, 0, 7); c.fill(); }
  if(L.topknot){ c.fillStyle = L.hair; c.beginPath(); c.arc(-4, -19, 8, 0, Math.PI * 2); ol(2.2); c.fill(); }
  c.fillStyle = sk2; c.beginPath(); c.ellipse(-3, 1, 3.5, 5, 0, 0, Math.PI * 2); c.fill();   // ear
  // eyes (blink every few seconds) and eyebrows by expression
  const ex = o.expr || 'happy', blink = ((t + (o.blinkOff || 0)) % 3.7) < 0.13;
  c.fillStyle = '#1b1210'; c.strokeStyle = '#1b1210'; c.lineWidth = TOON ? 2.2 : 1.8;
  const fierce = ex === 'angry' || ['attack', 'thrust', 'block'].includes(act);
  if(blink || act === 'namaste'){ c.beginPath(); c.moveTo(4, -2); c.quadraticCurveTo(8, TOON ? 0.5 : -2, 12, -2); c.stroke(); }
  else if(TOON){ const er = ex === 'surprised' ? 1.25 : 1;
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(8.2, -3, 4.3 * er, 5.2 * er * (fierce ? 0.8 : 1), 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.4; c.stroke();
    c.fillStyle = '#2d1b12'; c.beginPath(); c.ellipse(9.6, -2.6, 2.6, 3.3, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(10.4, -4, 1.1, 0, Math.PI * 2); c.fill();
    if(L.style === 'saree' || L.style === 'frock'){ c.strokeStyle = OUT; c.lineWidth = 1.3; c.beginPath(); c.moveTo(11.5, -7.2); c.lineTo(13.6, -9); c.moveTo(10, -8); c.lineTo(11.4, -10); c.stroke(); } }
  else { c.beginPath(); c.ellipse(8, -3, ex === 'surprised' ? 2.6 : 2.1, ex === 'surprised' ? 3.4 : 2.7, 0, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = TOON ? (L.hair === '#9E9E9E' || L.hair === '#6d6d6d' ? '#8a8a8a' : '#1b1210') : '#1b1210'; c.lineWidth = TOON ? 2.6 : 1.8;
  c.beginPath(); const eb = fierce ? [3, -12, 13, -7] : ({happy:[3, -10, 13, -11], sad:[3, -11, 13, -8.5], angry:[3, -12, 13, -7], surprised:[3, -13.5, 13, -13.5]}[ex] || [3, -10, 13, -11]);
  if(!TOON) eb[1] += 2, eb[3] += 2; c.moveTo(eb[0], eb[1]); c.quadraticCurveTo((eb[0] + eb[2]) / 2, Math.min(eb[1], eb[3]) - 1.5, eb[2], eb[3]); c.stroke();
  if(TOON && (L.size || 1) < 0.8){ c.fillStyle = 'rgba(232,96,96,0.28)'; c.beginPath(); c.ellipse(6, 5, 3.6, 2.2, 0, 0, Math.PI * 2); c.fill(); }   // children: rosy cheeks
  // mouth
  c.strokeStyle = '#5a2e1e'; c.fillStyle = '#5a2e1e'; c.lineWidth = 1.8;
  if(p.mouth > 0.08 || ex === 'surprised'){ const mh = 1 + 3.6 * Math.max(p.mouth, ex === 'surprised' ? 0.7 : 0); c.fillStyle = TOON ? '#4a1a12' : '#5a2e1e'; c.beginPath(); c.ellipse(10, 9, 3.4, mh, 0, 0, Math.PI * 2); c.fill();
    if(TOON && mh > 2.4){ c.fillStyle = '#e57373'; c.beginPath(); c.ellipse(10, 9 + mh * 0.45, 2.2, mh * 0.4, 0, 0, Math.PI * 2); c.fill(); } }
  else if(ex === 'sad'){ c.beginPath(); c.arc(10, 12, 4, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  else if(ex === 'angry'){ c.beginPath(); c.moveTo(6, 10); c.lineTo(13, 9); c.stroke(); }
  else { if(TOON) c.lineWidth = 2.2; c.beginPath(); c.arc(10, 6, 4, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); }
  if(L.bindi){ c.fillStyle = '#C0392B'; c.beginPath(); c.arc(13, -9, 1.6, 0, 7); c.fill(); }
  if(L.tilak){ c.fillStyle = '#fff'; c.fillRect(11, -16, 2, 7); c.fillStyle = '#C0392B'; c.fillRect(12.5, -15, 1.2, 6); }
  if(L.moustache){ c.fillStyle = L.hair === '#9E9E9E' ? '#ddd' : '#1E1611'; c.beginPath(); c.ellipse(12, 6.5, 5, 1.8, -0.15, 0, Math.PI * 2); c.fill(); }
  if(L.beard){ c.fillStyle = L.beard; c.beginPath(); c.moveTo(-2, 2); c.quadraticCurveTo(2, 14, 8, 30); c.quadraticCurveTo(16, 22, 17, 8); c.quadraticCurveTo(10, 12, 4, 8); c.closePath(); ol(2); c.fill(); }
  if(L.turban){ c.fillStyle = L.turban; c.beginPath(); c.ellipse(-1, -12, 18, 10, 0, Math.PI, Math.PI * 2.02); ol(2.2); c.fill(); c.beginPath(); c.ellipse(-1, -10, 17.5, 5, 0, 0, Math.PI * 2); ol(2.2); c.fill(); c.beginPath(); c.arc(-12, -14, 5, 0, 7); c.fill(); }
  if(L.helmet){ c.fillStyle = L.helmet; c.beginPath(); c.ellipse(-1, -6, 18, 16, 0, Math.PI, Math.PI * 2); ol(2.2); c.fill(); c.beginPath(); c.rect(-19, -7, 36, 4); ol(1.6); c.fill(); c.fillStyle = '#C0392B'; c.beginPath(); c.moveTo(-4, -22); c.quadraticCurveTo(-24, -30, -26, -12); c.quadraticCurveTo(-16, -20, -4, -18); c.fill(); }
  if(L.crown){ c.fillStyle = L.crown; c.beginPath(); c.moveTo(-14, -12); c.lineTo(-14, -26); c.lineTo(-7, -19); c.lineTo(0, -30); c.lineTo(7, -19); c.lineTo(13, -26); c.lineTo(13, -12); c.closePath(); ol(2); c.fill(); c.fillStyle = '#E74C3C'; c.beginPath(); c.arc(0, -16, 2.5, 0, 7); c.fill(); }
  c.restore();
  // front arm (+ weapon)
  const fa = limb(c, S[0] + 2, S[1], p.shF + p.lean, 30, p.shF + p.lean + p.elF, 28, 9, 8, armUp, armLow);
  // sword trail: a light swoosh behind the blade while attacking
  if(L.weapon === 'sword' && (act === 'attack' || act === 'thrust')){
    const pts = []; for(let k = 0; k <= 6; k++){ const pp = k === 0 ? p : poseAt(o, t - k * 0.028), a1 = pp.shF + pp.lean, a2 = a1 + pp.elF, [h1x, h1y] = dir(a1), [h2x, h2y] = dir(a2);
      const hx = S[0] + 2 + h1x * 30 + h2x * 28, hy = S[1] + h1y * 30 + h2y * 28, [sx, sy] = dir(a2 + 75); pts.push([hx + sx * 22, hy + sy * 22, hx + sx * 64, hy + sy * 64]); }
    const moved = Math.hypot(pts[0][2] - pts[6][2], pts[0][3] - pts[6][3]);
    if(moved > 18){ c.save(); const g = c.createLinearGradient(pts[0][2], pts[0][3], pts[6][2], pts[6][3]); g.addColorStop(0, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(180,220,255,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(pts[0][2], pts[0][3]); for(const q of pts) c.lineTo(q[2], q[3]); for(let k = pts.length - 1; k >= 0; k--) c.lineTo(pts[k][0], pts[k][1]); c.closePath(); c.fill(); c.restore(); } }
  if(L.weapon === 'sword'){ const [dx, dy] = dir(fa[4] + 75); if(TOON){ c.strokeStyle = OUT; c.lineWidth = 6.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(fa[2], fa[3]); c.lineTo(fa[2] + dx * 63, fa[3] + dy * 63); c.stroke(); } c.strokeStyle = '#E8EDEF'; c.lineWidth = 4; c.lineCap = 'butt'; c.beginPath(); c.moveTo(fa[2], fa[3]); c.lineTo(fa[2] + dx * 62, fa[3] + dy * 62); c.stroke();
    c.strokeStyle = '#7E5109'; c.lineWidth = 3; const [px, py] = dir(fa[4] - 15); c.beginPath(); c.moveTo(fa[2] - px * 8, fa[3] - py * 8); c.lineTo(fa[2] + px * 8, fa[3] + py * 8); c.stroke(); c.lineCap = 'round'; }
  if(L.weapon === 'bow'){ const [dx, dy] = dir(fa[4]); const nx = -dy, ny = dx; c.strokeStyle = '#6E2C00'; c.lineWidth = 3.5;
    c.beginPath(); c.moveTo(fa[2] + nx * 40, fa[3] + ny * 40); c.quadraticCurveTo(fa[2] + dx * 22, fa[3] + dy * 22, fa[2] - nx * 40, fa[3] - ny * 40); c.stroke();
    const sx = act === 'shoot' ? ba[2] : fa[2] - dx * 8, sy = act === 'shoot' ? ba[3] : fa[3] - dy * 8;
    c.strokeStyle = '#ECECEC'; c.lineWidth = 1; c.beginPath(); c.moveTo(fa[2] + nx * 40, fa[3] + ny * 40); c.lineTo(sx, sy); c.lineTo(fa[2] - nx * 40, fa[3] - ny * 40); c.stroke();
    if(act === 'shoot'){ c.strokeStyle = '#8D6E63'; c.lineWidth = 2; c.beginPath(); c.moveTo(sx, sy); c.lineTo(fa[2] + dx * 30, fa[3] + dy * 30); c.stroke(); } }
  c.fillStyle = skin; c.beginPath(); c.arc(fa[2], fa[3], 5.6, 0, Math.PI * 2); ol(2.2); c.fill();
  if(TOON){ const [tx, ty] = dir(fa[4] + 90); c.beginPath(); c.ellipse(fa[2] + tx * 4, fa[3] + ty * 4, 2.4, 3.4, fa[4] * D2R, 0, Math.PI * 2); c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke(); }   // thumb
  c.restore();
}
const BOX = [-45, -205, 50, 8];
const box = o => { const sz = (Object.assign({}, PRESETS[o.preset] || PRESETS.man, o.look || {})).size || 1; return BOX.map(v => v * sz); };

// ---------------------------------------------------------------- library entries
function make(preset){ const L = PRESETS[preset]; const s = L.size || 1;
  return {type:'char', preset, x:0, y:0, rotation:0, scaleX:1, scaleY:1, opacity:1, face:1, expr:'happy', actions:[], blinkOff:Math.random() * 3}; }
if(window.VG_LIBRARY) Object.keys(PRESETS).reverse().forEach(k => window.VG_LIBRARY.unshift({cat:'Characters', name:PRESETS[k].name, make:() => make(k)}));
window.VG_CHAR = {PRESETS, ACTIONS, SPEED, draw, BOX, box, make, actionAt, poseAt};
})();
