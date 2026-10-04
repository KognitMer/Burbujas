/* ENTIDADES: burbujas, burbuja oscura, efectos (polvo de estrellas, anillos, textos) y sus reglas de puntaje. */
import { CONFIG } from "../config.js";
import { state, view, world, images, breath, rules } from "../state.js";
import { rand, lerp, fmt } from "../util.js";
import { applyDelta, typeOf } from "../core/scoring.js";
import { track, setSessionScore } from "../core/metrics.js";
import { bests } from "../core/storage.js";
import { emit } from "../events.js";
import { t } from "../i18n/index.js";
import { ctx } from "../dom.js";
import { playPop, playWarn, playRelease } from "../audio/engine.js";

/* ---------- 5. ENTIDADES ---------- */

export function speedMult() { return CONFIG.speeds[state.speedLevel].mult; }
/* Acompasa las burbujas con la respiración: suben un poco más rápido al inhalar y se suavizan al exhalar
   (el promedio del ciclo no cambia, así que la velocidad elegida sigue siendo la misma). */
export function paceMult() { return state.breathOn ? 0.6 + 0.8 * breath.k : 1; }
export function darkMult() { return 1 + (speedMult() - 1) * 0.45; }   // la oscura acelera menos para seguir siendo jugable

/* 0 = recién empezó, 1 = máxima intensidad (sube de a poco) */
export function difficulty() { return Math.min(1, state.elapsed / CONFIG.rampSeconds); }
export function currentMaxBubbles() { return Math.max(4, Math.round(lerp(CONFIG.maxBubblesStart, CONFIG.maxBubblesEnd, difficulty()) * view.areaK)); }
export function nextSpawnDelay() {
  const d = difficulty();
  return rand(lerp(CONFIG.spawnStart[0], CONFIG.spawnEnd[0], d), lerp(CONFIG.spawnStart[1], CONFIG.spawnEnd[1], d));
}

export function pickName(type) {
  const list = CONFIG.imageFiles.filter(n => typeOf(n) === type);
  return list[Math.floor(Math.random() * list.length)];
}
export function spawnBubble(yOverride, forceDepth, forceName) {
  if (yOverride === undefined && world.bubbles.length >= currentMaxBubbles()) return;
  const size = rand(...CONFIG.bubbleSize) * view.S;
  const depth = forceDepth === true || (yOverride === undefined && Math.random() < CONFIG.depthChance);
  const name = forceName || CONFIG.imageFiles[Math.floor(Math.random() * CONFIG.imageFiles.length)];
  world.bubbles.push({
    x: rand(size / 2, view.W - size / 2),
    y: yOverride !== undefined ? yOverride : view.H + size / 2 + 10,
    r: depth ? size / 2 * 0.12 : size / 2,
    R: size / 2,
    grow: depth ? 0 : 1,
    vy: -rand(...CONFIG.bubbleSpeed),
    wobble: Math.random() * 6.28,
    wobbleSpeed: rand(0.5, 0.75),            // balanceo de ~10 s: mismo ritmo que la respiración
    wobbleAmp: rand(8, 20) * view.S,
    baseX: 0,
    img: images[name],
    name,
    type: typeOf(name),
    fade: 0,
    rot: rand(-0.2, 0.2),
    spin: rand(-0.15, 0.15)
  });
  const b = world.bubbles[world.bubbles.length - 1];
  // elegir el lugar más libre entre varios intentos
  let bestX = b.x, bestY = b.y, bestGap = -Infinity;
  for (let t = 0; t < 16; t++) {
    const x = rand(b.R + 20, view.W - b.R - 20);
    const y = depth ? rand(view.H * 0.12, view.H * 0.85) : b.y;
    let gap = Infinity;
    for (const o of world.bubbles) {
      if (o === b) continue;
      const d = Math.hypot(x - o.baseX, y - o.y) - (b.R + o.R);
      if (d < gap) gap = d;
    }
    if (gap > bestGap) { bestGap = gap; bestX = x; bestY = y; }
  }
  b.x = b.baseX = bestX;
  b.y = bestY;
}

/* La burbuja oscura se anuncia: primero un resplandor violeta en el borde por donde va a entrar (≈2 s) */
export function warnDark() {
  world.warns.push({ fromLeft: Math.random() < 0.5, y: rand(view.H * 0.22, view.H * 0.78), angle: rand(-0.3, 0.3), t: 0, dur: CONFIG.darkWarnSeconds });
  playWarn();
  emit("dark:warn");
}
export function spawnDark(w) {
  const r = CONFIG.darkSize * view.S / 2;
  const sp = CONFIG.darkSpeed * view.darkSpeedK;
  world.darks.push({
    x: w.fromLeft ? -r : view.W + r, y: w.y, r,
    vx: (w.fromLeft ? 1 : -1) * sp * Math.cos(w.angle),
    vy: sp * Math.sin(w.angle),
    pulse: 0
  });
}
export function drawWarns() {
  for (const w of world.warns) {
    const k = Math.min(1, w.t / 0.6) * (0.65 + 0.35 * Math.sin(w.t * 5));
    const x = w.fromLeft ? 0 : view.W, r = 150 * view.S;
    const g = ctx.createRadialGradient(x, w.y, 0, x, w.y, r);
    g.addColorStop(0, `rgba(150,110,255,${0.45 * k})`); g.addColorStop(1, "rgba(150,110,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, w.y, r, 0, 6.2832); ctx.fill();
    ctx.fillStyle = `rgba(200,180,255,${0.7 * k})`;               // flecha que indica hacia dónde viaja
    const d = w.fromLeft ? 1 : -1, ax = x + d * 22 * view.S;
    ctx.beginPath(); ctx.moveTo(ax, w.y - 9 * view.S); ctx.lineTo(ax + d * 12 * view.S, w.y); ctx.lineTo(ax, w.y + 9 * view.S); ctx.closePath(); ctx.fill();
  }
}

export function burst(x, y, r, color, count) {
  if (view.reduced) count = Math.ceil(count * 0.3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * 6.2832, sp = rand(40, 190);
    world.particles.push({ x: x + Math.cos(a) * r * 0.6, y: y + Math.sin(a) * r * 0.6,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, size: rand(1.5, 4), color });
  }
  world.rings.push({ x, y, r: r * 0.9, max: r * 1.7, life: 1, color });
}
export function floatText(x, y, text, color, size = 28, slow = 1) {
  world.floaters.push({ x, y, text, color, life: 1, size, slow });
}
/** Suma o resta puntos (el puntaje nunca baja de 0), actualiza el récord y avisa a la UI. */
export function changeScore(delta) {
  const { score, applied } = applyDelta(state.score, delta);
  state.score = score;
  if (applied > 0) track("earned", applied); else if (applied < 0) track("lost", -applied);
  if (rules().record && state.score > state.best) {
    state.best = state.score;
    bests.set(state.rules, state.best);
  }
  setSessionScore(state.score);
  emit("score", { score: state.score, best: state.best, delta, zen: false });
}
/** Modo Zen: solo se cuentan las emociones difíciles que se soltaron (sin puntos ni récord). */
export function addSoltada() {
  state.score++;
  setSessionScore(state.score);
  emit("score", { score: state.score, best: state.best, delta: 1, zen: true });
}

export const TYPE_COLOR = { neg: "175,150,240", pos: "150,235,255", neu: "255,225,160" };
/* Polvo de estrellas que se disuelve despacio (sirve para soltar una emoción y para la burbuja oscura) */
export function stardust(x, y, r, n, cols) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.2832, rr = Math.sqrt(Math.random()) * r * 0.9;
    world.dust.push({ x: x + Math.cos(a) * rr, y: Math.max(4, y + Math.sin(a) * rr), vx: rand(-14, 14), vy: rand(-22, 12),
      life: 1, decay: rand(0.38, 0.7), size: rand(1.2, 3.1), tw: rand(0, 6.28), c: cols[Math.floor(Math.random() * cols.length)] });
  }
  world.rings.push({ x, y: Math.max(0, y), r: r * 0.8, max: r * 1.8, life: 1, color: cols[0] });
}
let lastLetGoMsg = -99;

export function popBubble(b, byDark) {
  b.dead = true;
  if (byDark) {                                   // la oscura la disuelve: efecto suave, sin explosión
    stardust(b.x, b.y, b.r, 12, ["170,140,255", "210,200,255"]);
    playPop("dark");
    track("darkHits");
    if (state.score > 0) floatText(b.x, b.y, "−1", "#ff9a8a");
    changeScore(CONFIG.darkHitPenalty);
    return;
  }
  const type = b.type, m = rules();
  track({ neg: "popNeg", pos: "popPos", neu: "popNeu" }[type]);
  playPop(type);
  const col = TYPE_COLOR[type];
  if (m.zen) { burst(b.x, b.y, b.r, col, 12); return; }          // Zen: sin puntos ni textos
  const pts = m.pop[type] || 0;
  burst(b.x, b.y, b.r, col, pts > 0 ? 22 : 12);
  if (pts > 0) floatText(b.x, b.y, "+" + fmt(pts), type === "neu" ? "#ffe39a" : "#9ff0ff");
  else if (pts < 0 && state.score > 0) floatText(b.x, b.y, "−" + fmt(-pts), "#ffc48a");
  if (pts) changeScore(pts);
}

/* Una burbuja llegó arriba y se va sola. Si era una emoción difícil, se ve y se oye que la soltaste. */
export function releaseBubble(b) {
  const type = b.type, m = rules();
  track({ neg: "relNeg", pos: "relPos", neu: "relNeu" }[type]);
  const pts = m.escape[type] || 0;
  const x = Math.max(70, Math.min(view.W - 70, b.x));
  if (type === "neg" && (pts > 0 || m.zen)) {
    stardust(b.x, b.y, b.r, 30, ["205,190,255", "235,245,255", "160,200,255"]);
    playRelease();
    if (m.zen) addSoltada(); else changeScore(pts);
    if (state.elapsed - lastLetGoMsg > 3) {                      // el mensaje no se repite en cada una
      lastLetGoMsg = state.elapsed;
      floatText(x, 200, t.floats.letGo, "#d6defa", 21, 0.5);
    }
    if (!m.zen && pts > 0) floatText(x, 228, "+" + fmt(pts), "#b9d9ff", 22, 0.8);
  } else if (pts < 0) {                                           // se te fue una que te ayudaba (en silencio)
    if (state.score > 0) floatText(x, 100, "−" + fmt(-pts), "#ffc48a", 24);
    changeScore(pts);
  }
}

export function popDark(k) {
  k.dead = true;
  stardust(k.x, k.y, k.r, 22, ["170,140,255", "210,200,255"]);
  playPop("dark");
}

const AURA = {                                    // cada tipo tiene su propio brillo, además del personaje
  neg: { c: "150,120,225", halo: 0.26, ring: 0.45 },   // violeta apagado
  pos: { c: "110,235,255", halo: 0.34, ring: 0.62 },   // celeste luminoso
  neu: { c: "255,222,150", halo: 0.30, ring: 0.62 }    // dorado
};
function sparkle(x, y, s, a) {
  ctx.fillStyle = `rgba(235,250,255,${a})`;
  ctx.beginPath();
  ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill();
}
export function drawBubble(b) {
  const A = AURA[b.type] || AURA.pos;
  ctx.save();
  ctx.translate(b.x, b.y);
  let alpha = b.grow < 1 ? Math.min(1, 0.15 + b.grow * 1.1) : 1;   // emerge de la oscuridad
  if (b.fade) alpha *= Math.max(0, 1 - b.fade);                    // se disuelve al soltarla
  ctx.globalAlpha = alpha;
  const pulse = 0.85 + 0.15 * Math.sin(b.wobble * (b.type === "neg" ? 1.0 : 1.7));
  // aura por fuera del borde: no tiñe el interior transparente
  const halo = ctx.createRadialGradient(0, 0, b.r * 0.96, 0, 0, b.r * 1.5);
  halo.addColorStop(0, `rgba(${A.c},${A.halo * pulse})`);
  halo.addColorStop(1, `rgba(${A.c},0)`);
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(0, 0, b.r * 1.5, 0, 6.2832); ctx.fill();
  // aro fino: sólido (difícil, más tenue) · sólido luminoso (positiva) · punteado que gira (neutral)
  ctx.lineWidth = b.type === "neg" ? 1.6 : 2.2;
  ctx.strokeStyle = `rgba(${A.c},${A.ring * pulse})`;
  if (b.type === "neu") { ctx.setLineDash([7, 8]); ctx.lineDashOffset = -b.wobble * 18; }
  ctx.beginPath(); ctx.arc(0, 0, b.r * 1.04, 0, 6.2832); ctx.stroke();
  ctx.setLineDash([]);
  if (b.type === "pos" && b.grow >= 1) {                           // destellos que giran alrededor
    for (let i = 0; i < 3; i++) {
      const ang = b.wobble * 0.7 + i * 2.094, tw = 0.5 + 0.5 * Math.sin(b.wobble * 3 + i * 2);
      sparkle(Math.cos(ang) * b.r * 1.16, Math.sin(ang) * b.r * 1.16, (2.5 + 3 * tw) * view.S, 0.35 + 0.5 * tw);
    }
  }
  if (b.hintTarget) {                                              // pista: a cuál se refiere el texto
    ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,255,255,${0.45 + 0.3 * Math.sin(b.wobble * 4)})`;
    ctx.setLineDash([6, 9]); ctx.lineDashOffset = -b.wobble * 30;
    ctx.beginPath(); ctx.arc(0, 0, b.r * 1.22, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.rotate(b.rot);
  const d = b.r * 2;
  // la imagen tal cual, con sus colores y su transparencia originales
  if (b.img && b.img.complete) ctx.drawImage(b.img, -b.r, -b.r, d, d);
  else { ctx.fillStyle = "rgba(120,200,255,.3)"; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, 6.2832); ctx.fill(); }
  ctx.restore();
}

export function drawDark(k) {
  ctx.save();
  ctx.translate(k.x, k.y);
  // halo
  const halo = ctx.createRadialGradient(0, 0, k.r * 0.7, 0, 0, k.r * 1.9);
  halo.addColorStop(0, "rgba(110,70,220,0.35)");
  halo.addColorStop(1, "rgba(110,70,220,0)");
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(0, 0, k.r * 1.9, 0, 6.2832); ctx.fill();
  // cuerpo oscuro
  const body = ctx.createRadialGradient(-k.r * 0.35, -k.r * 0.4, k.r * 0.1, 0, 0, k.r);
  body.addColorStop(0, "rgba(70,50,130,0.95)");
  body.addColorStop(0.6, "rgba(18,10,45,0.96)");
  body.addColorStop(1, "rgba(3,1,12,0.98)");
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.arc(0, 0, k.r, 0, 6.2832); ctx.fill();
  // borde iridiscente tenue
  ctx.lineWidth = 3;
  const rim = ctx.createLinearGradient(-k.r, -k.r, k.r, k.r);
  rim.addColorStop(0, "rgba(160,120,255,.8)");
  rim.addColorStop(0.5, "rgba(60,40,140,.3)");
  rim.addColorStop(1, "rgba(80,200,255,.6)");
  ctx.strokeStyle = rim;
  ctx.beginPath(); ctx.arc(0, 0, k.r - 1.5, 0, 6.2832); ctx.stroke();
  // brillo
  ctx.fillStyle = "rgba(255,255,255,.22)";
  ctx.beginPath(); ctx.ellipse(-k.r * 0.38, -k.r * 0.45, k.r * 0.22, k.r * 0.12, -0.6, 0, 6.2832); ctx.fill();
  ctx.restore();
}

export function drawEffects() {
  for (const r of world.rings) {
    ctx.strokeStyle = `rgba(${r.color},${Math.max(0, r.life) * 0.7})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.2832); ctx.stroke();
  }
  for (const p of world.particles) {
    ctx.fillStyle = `rgba(${p.color},${Math.max(0, p.life)})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, 6.2832); ctx.fill();
  }
  for (const p of world.dust) {
    const a = Math.max(0, p.life) * (0.55 + 0.45 * Math.sin(p.tw));
    ctx.fillStyle = `rgba(${p.c},${a})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.2832); ctx.fill();
    if (p.size > 2.3) sparkle(p.x, p.y, p.size * 2.2, a * 0.8);
  }
  ctx.textAlign = "center";
  for (const f of world.floaters) {
    ctx.font = `600 ${f.size}px 'Segoe UI', system-ui, sans-serif`;
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color;
    ctx.shadowColor = f.color; ctx.shadowBlur = 12;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}
