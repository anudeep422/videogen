/* ==========================================================================
   VideoGen Animator – moving effects, transitions and colour filters. No AI.
   An effect is one object {type:'fx', kind, w, h, density, speed, color, seed, show:[t0, t1]}.
   Every particle's position is a formula of time, so playback and export are
   identical and nothing needs to be simulated.
   ========================================================================== */
(function(){
const TAU = Math.PI * 2;
const H = (i, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453; return v - Math.floor(v); };   // repeatable random 0..1
const KINDS = {
  // name, category, icon, default length (s), default colour, base count
  rain:      ['Rain', 'Weather & nature', '🌧️', 5, '#9EC9F0', 160],
  snow:      ['Snow', 'Weather & nature', '❄️', 6, '#FFFFFF', 120],
  petals:    ['Falling petals', 'Weather & nature', '🌸', 6, '#F48FB1', 60],
  leaves:    ['Falling leaves', 'Weather & nature', '🍂', 6, '#D35400', 40],
  fireflies: ['Fireflies', 'Weather & nature', '✨', 6, '#FFF59D', 40],
  bubbles:   ['Bubbles', 'Weather & nature', '🫧', 6, '#BBDEFB', 35],
  birds:     ['Birds flying', 'Weather & nature', '🐦', 6, '#2B2B33', 7],
  stars:     ['Twinkling stars', 'Weather & nature', '⭐', 6, '#FFFDE7', 90],
  confetti:  ['Confetti', 'Celebration', '🎊', 5, '#E74C3C', 120],
  sparkles:  ['Sparkles', 'Celebration', '🌟', 4, '#FFF59D', 26],
  coins:     ['Falling coins ₹', 'Celebration', '🪙', 5, '#F4D03F', 40],
  balloons:  ['Balloons', 'Celebration', '🎈', 6, '#E74C3C', 14],
  fireworks: ['Fireworks', 'Celebration', '🎆', 6, '#FFD54F', 5],
  fire:      ['Fire', 'Fire & smoke', '🔥', 6, '#FF9800', 70],
  smoke:     ['Smoke', 'Fire & smoke', '💨', 6, '#9E9E9E', 26],
  dust:      ['Dust cloud', 'Fire & smoke', '🌫️', 3, '#BCAAA4', 28],
  explosion: ['Explosion', 'War & action', '💥', 2, '#FF7043', 60],
  arrows:    ['Arrow volley', 'War & action', '🏹', 3, '#5D4037', 40],
  speed:     ['Speed lines', 'War & action', '💨', 2, '#FFFFFF', 30],
  lightning: ['Lightning', 'War & action', '⚡', 3, '#FFFFFF', 1],
  fade:      ['Fade to black', 'Transitions', '⬛', 1, '#000000', 1],
  flash:     ['White flash', 'Transitions', '⬜', 0.6, '#FFFFFF', 1],
  clash:     ['Sword sparks (clash)', 'Fire & smoke', '💥', 0.45, '#FFD54F', 26],
  wipe:      ['Wipe', 'Transitions', '➡️', 1, '#1B2631', 1],
  iris:      ['Circle (iris)', 'Transitions', '⭕', 1.2, '#000000', 1],
  slide:     ['Colour slide', 'Transitions', '🟧', 1, '#F39C12', 1],
  night:     ['Day → night', 'Colour', '🌙', 4, '#1A2550', 1],
  warm:      ['Warm sunset', 'Colour', '🌅', 4, '#FF8A3D', 1],
  oldfilm:   ['Old film (sepia)', 'Colour', '📽️', 6, '#704214', 1],
  bw:        ['Black & white', 'Colour', '⚫', 6, '#808080', 1],
  vignette:  ['Dark corners', 'Colour', '🔲', 6, '#000000', 1],
};
const COLORS = {confetti:['#E74C3C', '#F1C40F', '#2ECC71', '#3498DB', '#9B59B6', '#E67E22', '#FF6B81'], balloons:['#E74C3C', '#F1C40F', '#2ECC71', '#3498DB', '#9B59B6', '#E67E22'], leaves:['#D35400', '#E67E22', '#F39C12', '#A04000', '#B9770E']};
const isTransition = k => KINDS[k] && KINDS[k][1] === 'Transitions';
const isFull = k => KINDS[k] && ['Transitions', 'Colour'].includes(KINDS[k][1]) || k === 'lightning';

function make(kind, W, H){
  const K = KINDS[kind];
  return {type:'fx', kind, x:W / 2, y:H / 2, w:W, h:H, rotation:0, scaleX:1, scaleY:1, opacity:1, density:1, speed:1, color:K[4], seed:Math.floor(Math.random() * 1000)};
}

// ---------------------------------------------------------------- drawing
function draw(c, o, t, W, Hh, ui){
  const kind = o.kind, K = KINDS[kind]; if(!K) return;
  const t0 = o.show && o.show[0] != null ? o.show[0] : 0, t1 = o.show && o.show[1] != null ? o.show[1] : t0 + K[3];
  const lt = Math.max(0, t - t0), dur = Math.max(0.05, t1 - t0), sp = o.speed || 1;
  const w = o.w || W, h = o.h || Hh, n = Math.max(1, Math.round(K[5] * (o.density || 1))), col = o.color || K[4], sd = o.seed || 0;
  // gentle fade in/out for continuous effects
  const edge = isTransition(kind) || ['explosion', 'lightning', 'flash', 'clash'].includes(kind) ? 1 : Math.min(1, lt / 0.4, Math.max(0, t1 - t) / 0.4 + (o.show && o.show[1] == null ? 1 : 0));
  c.save(); c.globalAlpha *= Math.max(0, edge);
  const X0 = -w / 2, Y0 = -h / 2;   // effects are drawn around their own centre
  switch(kind){
    case 'rain': c.strokeStyle = col; c.lineCap = 'round';
      for(let i = 0; i < n; i++){ const s = 0.6 + H(i, sd) * 0.8, len = 18 + 22 * s, x = X0 + ((H(i, sd + 1) * w + lt * 120 * sp * s) % w), y = Y0 + ((H(i, sd + 2) * (h + 60) + lt * 900 * sp * s) % (h + 60)) - 30;
        c.globalAlpha = edge * (0.35 + 0.4 * s); c.lineWidth = 1 + s; c.beginPath(); c.moveTo(x, y); c.lineTo(x - len * 0.15, y + len); c.stroke(); } break;
    case 'snow': c.fillStyle = col;
      for(let i = 0; i < n; i++){ const s = 0.5 + H(i, sd) * 1, y = Y0 + ((H(i, sd + 2) * (h + 20) + lt * 60 * sp * s) % (h + 20)) - 10, x = X0 + ((H(i, sd + 1) * w + Math.sin(lt * 1.3 + i) * 18 + w) % w);
        c.globalAlpha = edge * (0.5 + 0.5 * H(i, 3)); c.beginPath(); c.arc(x, y, 1.5 + 3 * s, 0, TAU); c.fill(); } break;
    case 'petals': case 'leaves':
      for(let i = 0; i < n; i++){ const s = 0.6 + H(i, sd) * 0.8, y = Y0 + ((H(i, sd + 2) * (h + 40) + lt * 70 * sp * s) % (h + 40)) - 20, x = X0 + ((H(i, sd + 1) * w + Math.sin(lt * 1.1 + i * 2) * 30 + lt * 25 * sp + w * 2) % w);
        c.save(); c.translate(x, y); c.rotate(lt * 2 * (H(i, 5) - 0.5) * 3 + i); c.scale(1, Math.abs(Math.cos(lt * 2 + i)) * 0.7 + 0.3);
        c.fillStyle = kind === 'leaves' ? COLORS.leaves[i % 5] : (i % 3 ? col : '#F06292'); c.beginPath();
        if(kind === 'leaves'){ c.moveTo(0, -11 * s); c.quadraticCurveTo(9 * s, 0, 0, 11 * s); c.quadraticCurveTo(-9 * s, 0, 0, -11 * s); }
        else c.ellipse(0, 0, 8 * s, 5 * s, 0, 0, TAU);
        c.fill(); c.restore(); } break;
    case 'fireflies': for(let i = 0; i < n; i++){ const x = X0 + w * (0.5 + 0.45 * Math.sin(lt * 0.3 * sp + i * 1.7 + H(i, sd) * 9)), y = Y0 + h * (0.5 + 0.45 * Math.sin(lt * 0.23 * sp + i * 2.3 + H(i, sd + 1) * 9)), b = 0.5 + 0.5 * Math.sin(lt * 3 + i);
        const g = c.createRadialGradient(x, y, 0, x, y, 12); g.addColorStop(0, col); g.addColorStop(1, col + '00'); c.globalAlpha = edge * b; c.fillStyle = g; c.beginPath(); c.arc(x, y, 12, 0, TAU); c.fill(); } break;
    case 'bubbles': c.strokeStyle = col; c.lineWidth = 2;
      for(let i = 0; i < n; i++){ const s = 0.5 + H(i, sd) * 1.2, y = Y0 + h - ((H(i, sd + 2) * (h + 60) + lt * 60 * sp * s) % (h + 60)) + 30, x = X0 + H(i, sd + 1) * w + Math.sin(lt * 2 + i) * 12;
        c.globalAlpha = edge * 0.8; c.beginPath(); c.arc(x, y, 6 + 10 * s, 0, TAU); c.stroke(); c.fillStyle = '#ffffff88'; c.beginPath(); c.arc(x - 3 * s, y - 3 * s, 2 * s, 0, TAU); c.fill(); } break;
    case 'birds': c.strokeStyle = col; c.lineCap = 'round';
      for(let i = 0; i < n; i++){ const s = 0.6 + H(i, sd) * 0.6, x = X0 - 60 + ((lt * 90 * sp * (0.8 + s * 0.3) + i * 40 + H(i, 1) * 80) % (w + 120)), y = Y0 + h * (0.15 + 0.3 * H(i, sd + 2)) + Math.sin(lt * 2 + i) * 6, f = Math.sin(lt * 10 + i) * 6 * s;
        c.lineWidth = 2.2 * s; c.beginPath(); c.moveTo(x - 12 * s, y - f); c.quadraticCurveTo(x - 5 * s, y - 6 * s, x, y); c.quadraticCurveTo(x + 5 * s, y - 6 * s, x + 12 * s, y - f); c.stroke(); } break;
    case 'stars': c.fillStyle = col; for(let i = 0; i < n; i++){ const b = 0.3 + 0.7 * Math.abs(Math.sin(lt * (1 + H(i, 4) * 2) * sp + i)); c.globalAlpha = edge * b; c.beginPath(); c.arc(X0 + H(i, sd) * w, Y0 + H(i, sd + 1) * h, 1 + 1.8 * H(i, 2), 0, TAU); c.fill(); } break;
    case 'confetti': for(let i = 0; i < n; i++){ const s = 0.7 + H(i, sd) * 0.6, y = Y0 + ((H(i, sd + 2) * (h + 40) + lt * 150 * sp * s) % (h + 40)) - 20, x = X0 + ((H(i, sd + 1) * w + Math.sin(lt * 3 + i) * 20 + w) % w);
        c.save(); c.translate(x, y); c.rotate(lt * 4 * (H(i, 6) - 0.5) + i); c.scale(1, Math.cos(lt * 6 + i)); c.fillStyle = i % 7 === 0 ? col : COLORS.confetti[i % 7]; c.fillRect(-6 * s, -3 * s, 12 * s, 6 * s); c.restore(); } break;
    case 'sparkles': c.fillStyle = col; for(let i = 0; i < n; i++){ const ph = (lt * 0.8 * sp + H(i, sd)) % 1, a = Math.sin(ph * Math.PI), r = (10 + 16 * H(i, 2)) * a, x = X0 + H(i, sd + Math.floor(lt * 0.8 * sp + H(i, sd))) * w, y = Y0 + H(i, sd + 7 + Math.floor(lt * 0.8 * sp + H(i, sd))) * h;
        c.globalAlpha = edge * a; c.beginPath(); for(let k = 0; k < 8; k++){ const rr = k % 2 ? r * 0.2 : r, an = k * Math.PI / 4; k ? c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : c.moveTo(x + rr, y); } c.closePath(); c.fill(); } break;
    case 'coins': for(let i = 0; i < n; i++){ const s = 0.7 + H(i, sd) * 0.6, y = Y0 + ((H(i, sd + 2) * (h + 60) + lt * 220 * sp * s) % (h + 60)) - 30, x = X0 + H(i, sd + 1) * w, sx = Math.abs(Math.cos(lt * 5 + i));
        c.save(); c.translate(x, y); c.scale(Math.max(0.15, sx), 1); c.fillStyle = col; c.strokeStyle = '#B7950B'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 13 * s, 0, TAU); c.fill(); c.stroke();
        if(sx > 0.5){ c.fillStyle = '#9A7D0A'; c.font = `700 ${15 * s}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('₹', 0, 1); } c.restore(); } break;
    case 'balloons': for(let i = 0; i < n; i++){ const s = 0.8 + H(i, sd) * 0.5, y = Y0 + h + 60 - ((H(i, sd + 2) * (h + 140) + lt * 70 * sp * s) % (h + 140)), x = X0 + H(i, sd + 1) * w + Math.sin(lt + i) * 15;
        c.strokeStyle = '#7f8c8d'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + 26 * s); c.quadraticCurveTo(x + 6, y + 45 * s, x, y + 65 * s); c.stroke();
        c.fillStyle = COLORS.balloons[i % 6]; c.beginPath(); c.ellipse(x, y, 18 * s, 23 * s, 0, 0, TAU); c.fill(); c.fillStyle = '#ffffff66'; c.beginPath(); c.ellipse(x - 6 * s, y - 8 * s, 4 * s, 7 * s, -0.4, 0, TAU); c.fill(); } break;
    case 'fireworks': c.globalCompositeOperation = 'lighter';
      for(let i = 0; i < n; i++){ const per = 1.8 / sp, off = i * per / n, ph = ((lt + off) % per) / per, cyc = Math.floor((lt + off) / per), bx = X0 + w * (0.15 + 0.7 * H(i + cyc * 13, sd)), by = Y0 + h * (0.12 + 0.3 * H(i + cyc * 7, sd + 1));
        const hue = ['#FFD54F', '#FF5252', '#69F0AE', '#40C4FF', '#E040FB', col][(i + cyc) % 6];
        if(ph < 0.22){ const u = ph / 0.22, yy = Y0 + h - (Y0 + h - by) * u; c.strokeStyle = '#FFF3C4'; c.lineWidth = 3; c.globalAlpha = edge; c.beginPath(); c.moveTo(bx, yy + 30); c.lineTo(bx, yy); c.stroke(); }
        else { const u = (ph - 0.22) / 0.78, R = 150 * Math.sqrt(u), a = (1 - u) * edge;
          if(u < 0.12){ const g = c.createRadialGradient(bx, by, 0, bx, by, 120); g.addColorStop(0, '#FFFFFFcc'); g.addColorStop(1, hue + '00'); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(bx, by, 120, 0, TAU); c.fill(); }
          c.strokeStyle = hue; c.fillStyle = hue; c.lineWidth = 2.5;
          for(let k = 0; k < 36; k++){ const an = k / 36 * TAU + i, r2 = R * (0.85 + 0.15 * H(k, i)), px = bx + Math.cos(an) * r2, py = by + Math.sin(an) * r2 + 40 * u * u;
            c.globalAlpha = a * 0.5; c.beginPath(); c.moveTo(bx + Math.cos(an) * r2 * 0.7, by + Math.sin(an) * r2 * 0.7 + 30 * u * u); c.lineTo(px, py); c.stroke();
            c.globalAlpha = a; c.beginPath(); c.arc(px, py, 3.2, 0, TAU); c.fill(); } } } break;
    case 'fire': c.globalCompositeOperation = 'lighter';
      for(let i = 0; i < n; i++){ const life = 0.9 + H(i, sd) * 0.6, ph = ((lt * sp + H(i, sd + 1) * life) % life) / life, x = X0 + w * (0.25 + 0.5 * H(i, sd + 2)) + Math.sin(lt * 6 + i) * 6 * ph, y = Y0 + h - ph * h * 0.75, r = (26 + 20 * H(i, 4)) * (1 - ph * 0.7);
        const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, ph < 0.3 ? '#FFF59D' : '#FFB300'); g.addColorStop(0.5, col + 'aa'); g.addColorStop(1, '#E6510000');
        c.globalAlpha = edge * (1 - ph) * 0.8; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } break;
    case 'smoke': for(let i = 0; i < n; i++){ const life = 3 + H(i, sd) * 2, ph = ((lt * sp + H(i, sd + 1) * life) % life) / life, x = X0 + w * (0.4 + 0.2 * H(i, sd + 2)) + ph * w * 0.25 + Math.sin(lt + i) * 10, y = Y0 + h - ph * h, r = 20 + ph * 70;
        c.globalAlpha = edge * 0.35 * (1 - ph); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } break;
    case 'dust': for(let i = 0; i < n; i++){ const ph = ((lt * 0.7 * sp + H(i, sd)) % 1), x = X0 + w * H(i, sd + 1) + ph * 60 * (H(i, 3) - 0.3), y = Y0 + h - 10 - ph * 50 * H(i, 2), r = 12 + ph * 45;
        c.globalAlpha = edge * 0.45 * (1 - ph); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } break;
    case 'clash': { const u = Math.min(1, lt / dur), R = Math.min(w, h) * 0.5;   // bright flash + sparks flying out and falling
      c.globalAlpha = edge * Math.max(0, 1 - u * 2.2); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, R * 0.35 * (1 - u * 0.5), 0, TAU); c.fill();
      c.lineCap = 'round';
      for(let i = 0; i < n; i++){ const a = H(i, sd) * TAU, s = 0.45 + H(i, sd + 1) * 0.9, r0 = R * (0.08 + u * 0.95 * s), r1 = r0 + R * 0.22 * (1 - u), g = u * u * R * 0.5;
        c.globalAlpha = edge * Math.max(0, 1 - u); c.strokeStyle = i % 3 ? col : '#FFFFFF'; c.lineWidth = 1.5 + 1.5 * (1 - u);
        c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 + g); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 + g * 1.1); c.stroke(); }
      break; }
    case 'explosion': { const u = Math.min(1, lt / (dur * 0.9)), cx = 0, cy = 0, R = Math.min(w, h) * 0.45;
      if(u < 0.18){ c.globalAlpha = (1 - u / 0.18); c.fillStyle = '#FFFDE7'; c.beginPath(); c.arc(cx, cy, R * (0.3 + u * 3), 0, TAU); c.fill(); }
      c.globalAlpha = Math.max(0, 1 - u * 1.4); c.strokeStyle = '#FFE082'; c.lineWidth = 6 * (1 - u); c.beginPath(); c.arc(cx, cy, R * u * 1.3, 0, TAU); c.stroke();
      c.globalCompositeOperation = 'lighter';
      for(let i = 0; i < n; i++){ const an = H(i, sd) * TAU, d = R * u * (0.4 + 0.9 * H(i, 1)), x = cx + Math.cos(an) * d, y = cy + Math.sin(an) * d + 80 * u * u, r = (10 + 22 * H(i, 2)) * (1 - u * 0.6);
        c.globalAlpha = Math.max(0, 1 - u * 1.2); c.fillStyle = H(i, 3) > 0.5 ? col : '#FFCA28'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over'; c.fillStyle = '#5D5D5D';
      for(let i = 0; i < 14; i++){ const an = H(i, sd + 9) * TAU, d = R * (0.2 + u * 0.7), r = 25 + 40 * u; c.globalAlpha = 0.5 * u * (1 - u); c.beginPath(); c.arc(cx + Math.cos(an) * d, cy + Math.sin(an) * d - u * 40, r, 0, TAU); c.fill(); } break; }
    case 'arrows': c.strokeStyle = col; c.fillStyle = '#7B7D7D'; c.lineWidth = 2;
      for(let i = 0; i < n; i++){ const ph = ((lt * sp * 0.7 + H(i, sd) * 0.6) % 1.25), x = X0 + w * (-0.1 + 1.2 * ph) + H(i, sd + 1) * 60, arcY = Math.sin(Math.min(1, ph) * Math.PI) * h * 0.35, y = Y0 + h * (0.3 + 0.5 * H(i, sd + 2)) - arcY;
        const ang = Math.atan2(-Math.cos(Math.min(1, ph) * Math.PI) * h * 0.35 * Math.PI, w * 1.2);
        if(ph > 1.05) continue; c.save(); c.translate(x, y); c.rotate(-ang); c.scale(1.6, 1.6); c.beginPath(); c.moveTo(-26, 0); c.lineTo(10, 0); c.stroke(); c.beginPath(); c.moveTo(16, 0); c.lineTo(8, -4); c.lineTo(8, 4); c.closePath(); c.fill();
        c.strokeStyle = '#ECF0F1'; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-31, -4); c.moveTo(-26, 0); c.lineTo(-31, 4); c.stroke(); c.strokeStyle = col; c.restore(); } break;
    case 'speed': c.strokeStyle = col; c.lineCap = 'round';
      for(let i = 0; i < n; i++){ const y = Y0 + H(i, sd) * h, len = 60 + 140 * H(i, 1), x = X0 + w - ((H(i, sd + 2) * (w + len) + lt * 1400 * sp) % (w + len)); c.globalAlpha = edge * (0.3 + 0.5 * H(i, 4)); c.lineWidth = 1.5 + 2 * H(i, 5); c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.stroke(); } break;
    case 'lightning': { const k = Math.floor(lt * 2.2 * sp), ph = (lt * 2.2 * sp) % 1; if((k === 0 || H(k, sd) > 0.45) && ph < 0.26){ const a = 1 - ph / 0.26;
        c.globalAlpha = a * 0.55; c.fillStyle = '#E3F2FD'; c.fillRect(X0, Y0, w, h); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 4; c.shadowColor = '#90CAF9'; c.shadowBlur = 20;
        let x = X0 + w * (0.2 + 0.6 * H(k, sd + 1)), y = Y0; c.beginPath(); c.moveTo(x, y); while(y < Y0 + h * 0.75){ y += 30 + 30 * H(y, k); x += (H(x, y) - 0.5) * 60; c.lineTo(x, y); } c.stroke(); } break; }
    // ---- transitions: cover the screen at the middle of their time
    case 'fade': case 'flash': { const u = lt / dur, a = 1 - Math.abs(u * 2 - 1); c.globalAlpha = Math.max(0, Math.min(1, a * (kind === 'flash' ? 1 : 1.15))); c.fillStyle = col; c.fillRect(X0, Y0, w, h); break; }
    case 'wipe': case 'slide': { const u = Math.min(1, lt / dur), e = u * u * (3 - 2 * u); c.fillStyle = col;
      if(kind === 'wipe'){ const x = X0 - w + e * 2 * w; c.fillRect(Math.max(X0, x), Y0, Math.min(w, x + w - X0) - Math.max(0, x - X0), h); }
      else { const sk = h * 0.4, x = X0 - w - sk + e * (2 * w + 2 * sk); c.beginPath(); c.moveTo(x, Y0); c.lineTo(x + w + sk, Y0); c.lineTo(x + w, Y0 + h); c.lineTo(x - sk, Y0 + h); c.closePath(); c.fill(); } break; }
    case 'iris': { const u = Math.min(1, lt / dur), R = Math.hypot(w, h) / 2 * Math.abs(u * 2 - 1); c.fillStyle = col; c.beginPath(); c.rect(X0, Y0, w, h); c.arc(0, 0, Math.max(0.1, R), 0, TAU, true); c.fill('evenodd'); break; }
    // ---- colour filters
    case 'night': c.globalCompositeOperation = 'multiply'; c.globalAlpha *= Math.min(1, lt / Math.min(dur, 3)) * 0.85; c.fillStyle = col; c.fillRect(X0, Y0, w, h); break;
    case 'warm': { const k = Math.min(1, lt / Math.min(dur, 2));
      const g = c.createLinearGradient(0, Y0, 0, Y0 + h); g.addColorStop(0, '#FF5E3Acc'); g.addColorStop(0.35, '#FF9E4Fa0'); g.addColorStop(0.6, '#FFC26B55'); g.addColorStop(1, '#FFB34720');
      c.globalAlpha *= k; c.fillStyle = g; c.fillRect(X0, Y0, w, h);
      c.globalCompositeOperation = 'soft-light'; c.fillStyle = col; c.globalAlpha *= 0.35; c.fillRect(X0, Y0, w, h); break; }
    case 'oldfilm': c.globalCompositeOperation = 'saturation'; c.fillStyle = '#808080'; c.fillRect(X0, Y0, w, h); c.globalCompositeOperation = 'color'; c.globalAlpha *= 0.6; c.fillStyle = col; c.fillRect(X0, Y0, w, h);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.25; c.fillStyle = '#000'; for(let i = 0; i < 6; i++){ if(H(Math.floor(lt * 12), i) > 0.6) c.fillRect(X0 + H(Math.floor(lt * 12), i + 9) * w, Y0, 1.5, h); } break;
    case 'bw': c.globalCompositeOperation = 'saturation'; c.fillStyle = col; c.fillRect(X0, Y0, w, h); break;
    case 'vignette': { const g = c.createRadialGradient(0, 0, Math.min(w, h) * 0.35, 0, 0, Math.hypot(w, h) / 2); g.addColorStop(0, col + '00'); g.addColorStop(1, col + 'cc'); c.fillStyle = g; c.fillRect(X0, Y0, w, h); break; }
  }
  c.restore();
  if(ui){ c.save(); c.strokeStyle = '#3fb27f'; c.setLineDash([8, 6]); c.lineWidth = 1.5; c.strokeRect(X0, Y0, w, h); c.setLineDash([]);
    c.fillStyle = '#1d2029dd'; c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.fill(); c.font = '20px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(K[2], 0, 1); c.restore(); }
}
window.VG_FX = {KINDS, make, draw, isTransition, isFull};
})();
