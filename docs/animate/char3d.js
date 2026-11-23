// VideoGen Animator – 3D cartoon characters made with code (three.js, MIT). No AI, no downloaded models.
// The body is built from smooth shapes (spheres, capsules, cones) and moved with the same poses as the
// 2D characters (walk, run, wave, fight…). Each frame is rendered to a small picture and drawn into the scene.
import * as THREE from '../lib/three.module.min.js';

const D2R = Math.PI / 180;
const LOOKS3D = {
  boy3d:     {name:'Boy (3D)', skin:'#B97A4E', hair:'#1C120C', top:null, bottom:'#E0782B', extra:'#E8C25A', kind:'boy', size:0.82},
  girl3d:    {name:'Girl (3D)', skin:'#B97A4E', hair:'#1C120C', top:'#E25D8C', bottom:'#F2B632', extra:'#7E57C2', kind:'girl', size:0.8},
  grandpa3d: {name:'Grandfather (3D)', skin:'#A86E48', hair:'#EDEDED', top:'#F5F2EA', bottom:'#FFFFFF', extra:'#C9A15A', kind:'grandpa', size:1},
  woman3d:   {name:'Woman in saree (3D)', skin:'#B97A4E', hair:'#1C120C', top:'#2E7D32', bottom:'#C62828', extra:'#F9A825', kind:'woman', size:0.98},
  man3d:     {name:'Man (3D)', skin:'#A86E48', hair:'#1C120C', top:'#3A7BD5', bottom:'#2C3E50', extra:'#1C120C', kind:'man', size:1.02},
  sage3d:    {name:'Sage (3D)', skin:'#A86E48', hair:'#8A8A8A', top:'#E67E22', bottom:'#E67E22', extra:'#FFFFFF', kind:'sage', size:1},
};

let renderer = null, scene, camera, lights;
const W = 360, H = 560;   // picture size for one character (drawn scaled into the video)
function setup(){
  if(renderer) return renderer;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  renderer = new THREE.WebGLRenderer({canvas:cv, alpha:true, antialias:true, preserveDrawingBuffer:true});
  renderer.setSize(W, H, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(22, W / H, 0.1, 100); camera.position.set(0, 3.5, 21); camera.lookAt(0, 3.35, 0);
  const hemi = new THREE.HemisphereLight(0xfff4e0, 0x5d7a4a, 1.25);
  const key = new THREE.DirectionalLight(0xfff0dc, 2.6); key.position.set(4, 7, 8);
  const rim = new THREE.DirectionalLight(0xbfd8ff, 2.2); rim.position.set(-6, 4, -6);
  const fill = new THREE.DirectionalLight(0xffe2c8, 0.5); fill.position.set(-5, 1, 6);
  scene.add(hemi, key, rim, fill); lights = {hemi, key, rim};
  return renderer;
}
const matCache = {};
function mat(col, rough = 0.55, extra = {}){ const k = col + rough + JSON.stringify(extra); return matCache[k] || (matCache[k] = new THREE.MeshStandardMaterial({color:new THREE.Color(col), roughness:rough, metalness:0, ...extra})); }
const G = {};
function geo(name, make){ return G[name] || (G[name] = make()); }
function mesh(g, m, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1){ const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); return o; }
const sph = () => geo('sph', () => new THREE.SphereGeometry(1, 40, 28));
const cap = (r, l) => geo('cap' + r + '_' + l, () => new THREE.CapsuleGeometry(r, l, 8, 20));
const cone = () => geo('cone', () => new THREE.CylinderGeometry(0.5, 1, 1, 36, 1, true));

// ---------------------------------------------------------------- build a character (joints are groups)
function limbChain(parent, x, y, z, r1, l1, r2, l2, c1, c2, endR, endCol, endShape){
  const top = new THREE.Group(); top.position.set(x, y, z); parent.add(top);
  top.add(mesh(cap(r1, l1), c1, 0, -l1 / 2, 0));
  const mid = new THREE.Group(); mid.position.set(0, -l1, 0); top.add(mid);
  mid.add(mesh(sph(), c1, 0, 0, 0, r1 * 1.02, r1 * 1.02, r1 * 1.02));
  mid.add(mesh(cap(r2, l2), c2, 0, -l2 / 2, 0));
  const end = new THREE.Group(); end.position.set(0, -l2 - r2 * 0.3, 0); mid.add(end);
  if(endShape === 'foot') end.add(mesh(sph(), endCol, 0, -0.04, 0.12, endR * 0.9, endR * 0.55, endR * 1.5));
  else { end.add(mesh(sph(), endCol, 0, -endR * 0.3, 0, endR, endR * 1.15, endR * 0.75)); end.add(mesh(sph(), endCol, endR * 0.55, -endR * 0.1, endR * 0.35, endR * 0.38, endR * 0.5, endR * 0.38)); }
  return {top, mid, end};
}
function build(key, look){
  const L = Object.assign({}, LOOKS3D[key], look || {}); const kid = L.kind === 'boy' || L.kind === 'girl';
  const skin = mat(L.skin, 0.62), hair = mat(L.hair, 0.42), top = mat(L.top || L.skin, L.top ? 0.75 : 0.62), bot = mat(L.bottom, 0.75), dark = mat('#2b1a12', 0.4);
  const root = new THREE.Group(), legLen = kid ? 1.15 : 1.55, hipY = legLen * 2 + 0.25;
  const hips = new THREE.Group(); hips.position.y = hipY; root.add(hips);
  const spine = new THREE.Group(); hips.add(spine);
  const torsoH = kid ? 1.15 : 1.5, tw = kid ? 0.52 : 0.68;
  // torso (bare chest for the boy, clothes for the others)
  spine.add(mesh(cap(tw, torsoH * 0.55), top, 0, torsoH * 0.5, 0, 1, 1, 0.72));
  if(L.kind === 'boy'){ const neck = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 40), mat('#6D4C41', 0.6)); neck.position.set(0, torsoH * 0.98, 0.06); neck.rotation.x = 1.25; spine.add(neck);
    spine.add(mesh(sph(), mat(L.extra, 0.3), 0, torsoH * 0.7, 0.4, 0.07, 0.14, 0.05)); }
  if(L.kind === 'woman'){ const sash = mesh(cap(0.16, torsoH * 0.9), mat(L.bottom, 0.7), 0.05, torsoH * 0.5, 0.18, 1, 1, 0.5); sash.rotation.z = 0.6; spine.add(sash); }
  if(L.kind === 'sage' || L.kind === 'grandpa'){ const shawl = mesh(cap(0.2, torsoH * 0.85), mat(L.extra, 0.8), -0.05, torsoH * 0.55, 0.22, 1, 1, 0.5); shawl.rotation.z = -0.65; spine.add(shawl); }
  // lower clothes
  const pelvis = mesh(sph(), bot, 0, 0.05, 0, tw * 1.05, 0.42, tw * 0.8); hips.add(pelvis);
  let skirt = null;
  if(['girl', 'woman', 'grandpa', 'sage'].includes(L.kind)){ const len = L.kind === 'girl' ? legLen * 1.75 : legLen * 2.05;
    skirt = mesh(cone(), bot, 0, -len / 2 + 0.15, 0, tw * 1.25, len, tw * 0.95); skirt.material = mat(L.bottom, 0.8, {side:THREE.DoubleSide}); hips.add(skirt);
    if(L.kind === 'girl' || L.kind === 'woman'){ const band = mesh(geo('band', () => new THREE.CylinderGeometry(1, 1, 1, 36, 1, true)), mat(L.extra, 0.6, {side:THREE.DoubleSide}), 0, -len + 0.25, 0, tw * 1.28, 0.16, tw * 0.98); hips.add(band); } }
  // legs (shorts for boy and man)
  const thighCol = L.kind === 'man' ? bot : skin, shinCol = L.kind === 'man' ? bot : skin, footCol = L.kind === 'man' ? mat('#3E2723', 0.5) : skin;
  const lr = kid ? 0.25 : 0.3;
  const legR = limbChain(hips, -0.3, 0, 0, lr, legLen * 0.86, lr * 0.85, legLen * 0.86, mat(L.kind === 'boy' ? L.bottom : thighCol.color.getStyle(), 0.7), shinCol, 0.34, footCol, 'foot');
  const legL = limbChain(hips, 0.3, 0, 0, lr, legLen * 0.86, lr * 0.85, legLen * 0.86, mat(L.kind === 'boy' ? L.bottom : thighCol.color.getStyle(), 0.7), shinCol, 0.34, footCol, 'foot');
  if(['woman', 'grandpa', 'sage'].includes(L.kind)) for(const lg of [legR, legL]){ lg.top.children[0].visible = false; lg.mid.children.forEach((m, i) => { if(i < 2) m.visible = false; }); }
  if(L.kind === 'girl') for(const lg of [legR, legL]) lg.top.children[0].visible = false;
  if(L.kind === 'boy'){ // shorts cover only the thigh top; the rest is skin
    for(const lg of [legR, legL]){ lg.top.children[0].material = bot; lg.top.children[0].scale.set(1.25, 0.5, 1.25); lg.top.children[0].position.y = -legLen * 0.2;
      lg.top.add(mesh(cap(lr, legLen * 0.5), skin, 0, -legLen * 0.62, 0)); lg.mid.children[0].material = skin; } }
  // arms
  const ar = kid ? 0.18 : 0.21, al = kid ? 0.72 : 0.92, sleeve = ['girl', 'woman', 'man', 'grandpa'].includes(L.kind) ? top : skin;
  const armR = limbChain(spine, -tw - 0.1, torsoH * 0.88, 0, ar, al, ar * 0.9, al * 0.92, sleeve, skin, 0.2, skin);
  const armL = limbChain(spine, tw + 0.1, torsoH * 0.88, 0, ar, al, ar * 0.9, al * 0.92, sleeve, skin, 0.2, skin);
  if(L.kind === 'woman' || L.kind === 'girl'){ for(const a of [armR, armL]){ a.top.children[0].scale.set(1.15, 0.45, 1.15); a.top.children[0].position.y = -al * 0.22; a.top.add(mesh(cap(ar, al * 0.6), skin, 0, -al * 0.62, 0)); } }
  // head
  const neckG = new THREE.Group(); neckG.position.y = torsoH * 1.02; spine.add(neckG);
  neckG.add(mesh(cap(kid ? 0.17 : 0.2, 0.25), skin, 0, 0.12, 0));
  const head = new THREE.Group(); head.position.y = kid ? 0.95 : 0.98; neckG.add(head);
  const hs = kid ? 0.92 : 0.82;
  head.add(mesh(sph(), skin, 0, 0, 0, hs, hs * 1.05, hs * 0.95));                       // skull
  head.add(mesh(sph(), skin, 0, -hs * 0.36, hs * 0.08, hs * 0.8, hs * 0.55, hs * 0.72));  // cheeks and chin
  head.add(mesh(sph(), skin, 0, -hs * 0.06, hs * 0.94, hs * 0.13, hs * 0.11, hs * 0.12)); // nose
  for(const s of [-1, 1]) head.add(mesh(sph(), skin, s * hs * 0.95, -hs * 0.05, -hs * 0.05, hs * 0.16, hs * 0.24, hs * 0.12)); // ears
  const eyes = [], irises = [];
  for(const s of [-1, 1]){
    const eg = new THREE.Group(); eg.position.set(s * hs * 0.35, hs * 0.08, hs * 0.8); head.add(eg);
    const white = mesh(sph(), mat('#ffffff', 0.25), 0, 0, 0, hs * 0.24, hs * 0.3, hs * 0.15); eg.add(white);
    const iris = mesh(sph(), mat('#4a2b17', 0.25), 0, -hs * 0.01, hs * 0.11, hs * 0.13, hs * 0.16, hs * 0.06); eg.add(iris);
    iris.add(mesh(sph(), mat('#0d0705', 0.2), 0, 0, 0.6, 0.55, 0.55, 0.5));
    iris.add(mesh(sph(), mat('#ffffff', 0.1, {emissive:new THREE.Color('#ffffff'), emissiveIntensity:0.6}), 0.35, 0.4, 1, 0.28, 0.24, 0.3));
    eyes.push(eg); irises.push(iris);
    const brow = mesh(cap(hs * 0.035, hs * 0.22), mat(L.kind === 'grandpa' || L.kind === 'sage' ? '#d0d0d0' : L.hair, 0.5), s * hs * 0.36, hs * 0.46, hs * 0.84); brow.rotation.z = Math.PI / 2 + s * 0.12; head.add(brow); eyes.push(brow);
  }
  const mouthG = new THREE.Group(); mouthG.position.set(0, -hs * 0.42, hs * 0.78); head.add(mouthG);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(hs * 0.16, hs * 0.03, 8, 24, Math.PI), mat('#7a2b22', 0.5)); smile.rotation.z = Math.PI; mouthG.add(smile);
  const open = mesh(sph(), mat('#4a1410', 0.6), 0, -hs * 0.03, 0, hs * 0.14, hs * 0.1, hs * 0.06); open.visible = false; mouthG.add(open);
  // hair
  if(L.kind === 'boy'){
    { const capm = mesh(geo('hairBoy', () => new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.45)), hair, 0, hs * 0.06, -hs * 0.06, hs * 1.07, hs * 1.1, hs * 1.05); capm.rotation.x = -0.42; head.add(capm); }
    for(let i = 0; i < 7; i++){ const a = -0.9 + i * 0.3; const tuft = mesh(sph(), hair, Math.sin(a) * hs * 0.72, hs * (0.86 - Math.abs(a) * 0.18), Math.cos(a) * hs * 0.5, hs * 0.24, hs * 0.17, hs * 0.3); tuft.rotation.x = 0.9; head.add(tuft); }
    head.add(mesh(sph(), hair, 0, -hs * 0.1, -hs * 0.55, hs * 0.95, hs * 0.85, hs * 0.6));
  } else if(L.kind === 'girl' || L.kind === 'woman'){
    { const capm = mesh(geo('hairGirl', () => new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.45)), hair, 0, hs * 0.06, -hs * 0.05, hs * 1.06, hs * 1.08, hs * 1.04); capm.rotation.x = -0.45; head.add(capm);
      const part = mesh(cap(hs * 0.02, hs * 0.5), mat('#3a2418', 0.5), 0, hs * 0.98, hs * 0.2); part.rotation.x = Math.PI / 2 - 0.5; head.add(part); }
    head.add(mesh(sph(), hair, 0, -hs * 0.05, -hs * 0.6, hs * 0.98, hs * 1, hs * 0.55));
    const plait = new THREE.Group(); plait.position.set(0, -hs * 0.6, -hs * 0.75); head.add(plait);
    for(let i = 0; i < 5; i++) plait.add(mesh(sph(), hair, 0, -i * hs * 0.28, -i * 0.02, hs * 0.2, hs * 0.2, hs * 0.18));
    plait.add(mesh(sph(), mat(L.extra, 0.5), 0, -5 * hs * 0.28, 0, hs * 0.14, hs * 0.14, hs * 0.14)); head.userData.plait = plait;
    head.add(mesh(sph(), mat('#C62828', 0.3), 0, hs * 0.36, hs * 0.97, hs * 0.05, hs * 0.05, hs * 0.03));   // bindi
    if(L.kind === 'woman') for(const s of [-1, 1]) head.add(mesh(sph(), mat('#F9A825', 0.2, {metalness:0.6}), s * hs * 0.96, -hs * 0.3, 0, hs * 0.07, hs * 0.07, hs * 0.07));
  } else if(L.kind === 'man'){
    { const capm = mesh(geo('hairMan', () => new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.42)), hair, 0, hs * 0.08, -hs * 0.06, hs * 1.05, hs * 1.07, hs * 1.03); capm.rotation.x = -0.45; head.add(capm); }
    { const mo = mesh(cap(hs * 0.07, hs * 0.3), hair, 0, -hs * 0.24, hs * 0.92); mo.rotation.z = Math.PI / 2; head.add(mo); }
  } else { // grandpa and sage: white side hair, beard, moustache
    for(const s of [-1, 1]) head.add(mesh(sph(), hair, s * hs * 0.8, hs * 0.05, -hs * 0.25, hs * 0.3, hs * 0.42, hs * 0.5));
    head.add(mesh(sph(), hair, 0, hs * 0.05, -hs * 0.7, hs * 0.7, hs * 0.5, hs * 0.35));
    const beard = mesh(sph(), mat(L.kind === 'sage' ? '#E6E6E6' : L.hair, 0.8), 0, -hs * 0.75, hs * 0.5, hs * 0.55, hs * (L.kind === 'sage' ? 0.9 : 0.55), hs * 0.42); head.add(beard);
    { const mo = mesh(cap(hs * 0.08, hs * 0.3), mat(L.kind === 'sage' ? '#E6E6E6' : L.hair, 0.7), 0, -hs * 0.25, hs * 0.92); mo.rotation.z = Math.PI / 2; head.add(mo); }
    head.add(mesh(sph(), mat('#ffffff', 0.4), 0, hs * 0.6, hs * 0.8, hs * 0.035, hs * 0.11, hs * 0.02)); head.add(mesh(sph(), mat('#D32F2F', 0.4), 0, hs * 0.6, hs * 0.815, hs * 0.015, hs * 0.08, hs * 0.015));   // tilak
    if(L.kind === 'sage'){ head.add(mesh(sph(), hair, 0, hs * 1.05, -hs * 0.2, hs * 0.32, hs * 0.3, hs * 0.32)); }
    if(L.kind === 'grandpa'){ const glass = mat('#3a2a20', 0.4); for(const s of [-1, 1]){ const r = new THREE.Mesh(new THREE.TorusGeometry(hs * 0.2, hs * 0.025, 8, 28), glass); r.position.set(s * hs * 0.34, hs * 0.1, hs * 0.95); head.add(r); } }
  }
  smile.visible = true;
  return {root, hips, spine, neck:neckG, head, armR, armL, legR, legL, eyes, mouth:{smile, open}, skirt, hipY, L};
}

// ---------------------------------------------------------------- pose (same numbers as the 2D characters)
function applyPose(ch, p, t, act, o){
  const f = 1;
  ch.root.position.y = -p.yOff * 0.028; ch.root.rotation.x = (p.rot || 0) * D2R * 0.95;
  ch.spine.rotation.x = p.lean * D2R; ch.neck.rotation.x = (p.head || 0) * D2R * 0.6; ch.head.rotation.x = (p.head || 0) * D2R * 0.4;
  ch.head.rotation.y = Math.sin(t * 0.6) * 0.06;
  ch.armR.top.rotation.x = -p.shF * D2R; ch.armR.mid.rotation.x = -p.elF * D2R; ch.armR.top.rotation.z = -0.12;
  ch.armL.top.rotation.x = -p.shB * D2R; ch.armL.mid.rotation.x = -p.elB * D2R; ch.armL.top.rotation.z = 0.12;
  ch.legR.top.rotation.x = -p.hipF * D2R; ch.legR.mid.rotation.x = p.kneeF * D2R; ch.legR.end.rotation.x = -(p.hipF - p.kneeF) * D2R * 0.5;
  ch.legL.top.rotation.x = -p.hipB * D2R; ch.legL.mid.rotation.x = p.kneeB * D2R; ch.legL.end.rotation.x = -(p.hipB - p.kneeB) * D2R * 0.5;
  if(act === 'namaste'){ ch.armR.top.rotation.z = 0.55; ch.armL.top.rotation.z = -0.55; }
  if(act === 'clap'){ ch.armR.top.rotation.z = 0.5; ch.armL.top.rotation.z = -0.5; }
  if(ch.skirt){ ch.skirt.rotation.x = (p.hipF + p.hipB) * 0.5 * -D2R * 0.5; ch.skirt.scale.x = ch.skirt.userData.sx || (ch.skirt.userData.sx = ch.skirt.scale.x); ch.skirt.scale.x = ch.skirt.userData.sx * (1 + Math.abs(p.hipF - p.hipB) * 0.004); }
  if(ch.head.userData.plait) ch.head.userData.plait.rotation.x = 0.2 + Math.sin(t * 6) * (act === 'walk' || act === 'run' ? 0.25 : 0.05);
  // face
  const blink = ((t + (o.blinkOff || 0)) % 3.7) < 0.13 || act === 'namaste';
  ch.eyes.forEach((e, i) => { if(i % 2 === 0) e.scale.y = blink ? 0.12 : 1; });
  const fierce = o.expr === 'angry' || ['attack', 'thrust', 'block'].includes(act);
  ch.eyes.forEach((e, i) => { if(i % 2 === 1){ const s = i === 1 ? -1 : 1; e.rotation.z = Math.PI / 2 + s * (fierce ? -0.45 : 0.12); e.position.y = (e.userData.y0 ?? (e.userData.y0 = e.position.y)) + (o.expr === 'surprised' ? 0.08 : fierce ? -0.04 : 0); } });
  const m = p.mouth || 0; ch.mouth.open.visible = m > 0.08; ch.mouth.smile.visible = m <= 0.08; ch.mouth.open.scale.y = (ch.mouth.open.userData.sy || (ch.mouth.open.userData.sy = ch.mouth.open.scale.y)) * (0.4 + m * 1.6);
}

// ---------------------------------------------------------------- render one character to a picture
const built = {};
export function render3d(o, t){
  setup();
  const key = o.preset; if(!LOOKS3D[key]) return null;
  const look = o.look ? {skin:o.look.skin, hair:o.look.hair, top:o.look.top, bottom:o.look.bottom} : null, bk = key + JSON.stringify(look || {});
  const ch = built[bk] || (built[bk] = build(key, look));
  scene.add(ch.root);
  const p = window.VG_CHAR.poseAt(o, t), act = window.VG_CHAR.actionAt(o, t);
  if(o.lip && window.VG_CHAR.lip){ const lv = window.VG_CHAR.lip(o, t); if(lv > 0.06) p.mouth = Math.max(p.mouth, Math.min(1, lv * 1.15)); }
  applyPose(ch, p, t, act, o);
  ch.root.rotation.y = 0.62;   // three-quarter view, facing right
  renderer.render(scene, camera);
  scene.remove(ch.root);
  return renderer.domElement;
}
export const PRESETS3D = LOOKS3D;
export { W as W3D, H as H3D };

// ---------------------------------------------------------------- plug into the Animator (same object type as 2D characters)
const C = window.VG_CHAR;
if(C){
  for(const [k, v] of Object.entries(LOOKS3D)) C.PRESETS[k] = {name:v.name, skin:v.skin, hair:v.hair, top:v.top || v.skin, bottom:v.bottom, is3d:true, size:1};
  const draw0 = C.draw, box0 = C.box, PX = 205 / 455;   // drawing units per picture pixel (an adult is about 205 units tall, like the 2D people)
  C.draw = function(c, o, t){
    const L = C.PRESETS[o.preset]; if(!L || !L.is3d) return draw0(c, o, t);
    let face = o.face || 1;
    if(o.autoFace !== false && o.keys && o.keys.x && o.keys.x.length > 1 && window.propAt){ const v = window.propAt(o.__base || o, 'x', t + 0.05) - window.propAt(o.__base || o, 'x', t - 0.05); if(Math.abs(v) > 0.3) face = v > 0 ? 1 : -1; }
    const cv = render3d(o, t); if(!cv) return;
    c.save(); c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(0, 2, 34, 6, 0, 0, Math.PI * 2); c.fill();
    c.scale(face, 1); c.drawImage(cv, -W / 2 * PX, -508 * PX, W * PX, H * PX); c.restore();
  };
  C.box = function(o){ const L = C.PRESETS[o.preset]; if(!L || !L.is3d) return box0(o); const kid = /boy|girl/.test(o.preset); return [-55, kid ? -185 : -215, 55, 8]; };
  if(window.VG_LIBRARY) Object.keys(LOOKS3D).reverse().forEach(k => window.VG_LIBRARY.unshift({cat:'3D characters', name:LOOKS3D[k].name, make:() => C.make(k)}));
  window.VG_3D_READY = true; if(window.draw) try{ window.draw(); }catch(e){}
}
