/* LOOP: actualización por cuadro, dibujo y adaptación a la pantalla. */
import { CONFIG } from "../config.js";
import { state, view, world, breath, rules } from "../state.js";
import { canvas, ctx } from "../dom.js";
import { rand, clamp } from "../util.js";
import { updateBreath } from "../core/breath.js";
import { tick } from "../core/metrics.js";
import { buildBackground, drawBackground, drawBreathGuide } from "./background.js";
import {
  speedMult, paceMult, darkMult, nextSpawnDelay, spawnBubble, warnDark, spawnDark, drawWarns,
  popBubble, releaseBubble, drawBubble, drawDark, drawEffects
} from "./entities.js";
import { updateTutorial } from "./tutorial.js";
import { updateKbFocus } from "./input.js";

let last = performance.now();
export const resetClock = () => { last = performance.now(); };

export function resize() {
  view.DPR = Math.min(window.devicePixelRatio || 1, 2);
  view.W = window.innerWidth; view.H = window.innerHeight;
  canvas.width = view.W * view.DPR; canvas.height = view.H * view.DPR;
  ctx.setTransform(view.DPR, 0, 0, view.DPR, 0, 0);
  // adaptar tamaños a la pantalla: en celular las burbujas son algo más chicas y hay menos a la vez
  view.S = clamp(Math.min(view.W, view.H) / 520, 0.72, 1);
  view.areaK = clamp((view.W * view.H) / 700000, 0.85, 1.2);
  view.darkSpeedK = clamp(view.W / 900, 0.55, 1.15);
  buildBackground();
}

export function update(dt) {
  state.elapsed += dt;
  tick(dt);
  // spawns
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) { spawnBubble(); state.spawnTimer = nextSpawnDelay(); }
  // si la pantalla se vacía, surge una nueva desde lo profundo (una cada ~0,35 s como máximo)
  state.refillTimer -= dt;
  const minB = Math.max(4, Math.round(CONFIG.minOnScreen * view.areaK));
  if (world.bubbles.length < minB && state.refillTimer <= 0) { spawnBubble(undefined, true); state.refillTimer = 0.35; }
  if (rules().dark) {                              // en Zen no hay burbuja oscura
    state.darkTimer -= dt;
    if (state.darkTimer <= 0) { warnDark(); state.darkTimer = rand(...CONFIG.darkEvery); }
  }
  for (const w of world.warns) { w.t += dt; if (w.t >= w.dur) { spawnDark(w); w.dead = true; } }
  updateTutorial(dt);
  updateKbFocus();

  // burbujas normales
  for (const b of world.bubbles) {
    if (b.grow < 1) {                           // surgiendo desde lo profundo
      b.grow = Math.min(1, b.grow + dt / CONFIG.depthGrowSeconds);
      const e = 1 - Math.pow(1 - b.grow, 3);
      b.r = b.R * (0.12 + 0.88 * e);
    }
    b.y += b.vy * speedMult() * paceMult() * (CONFIG.typeSpeed[b.type] || 1) * dt;
    b.wobble += b.wobbleSpeed * dt;
    b.x = b.baseX + Math.sin(b.wobble) * b.wobbleAmp;
    b.rot += b.spin * dt;
    if (!b.dead && !b.releasing && b.y < b.r * 0.55) { b.releasing = true; releaseBubble(b); }   // llegó arriba: se suelta
    if (b.releasing) { b.fade += dt / CONFIG.releaseFade; if (b.fade >= 1) b.dead = true; }
  }

  // separación suave: las burbujas se empujan para no montarse
  const bs = world.bubbles;
  for (let i = 0; i < bs.length; i++) {
    for (let j = i + 1; j < bs.length; j++) {
      const a = bs[i], c = bs[j];
      const dx = c.x - a.x, dy = c.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const minD = (a.r + c.r) * 0.98;
      if (dist < minD) {
        const push = (minD - dist) * Math.min(1, dt * 6) * 0.5;
        const nx = dx / dist, ny = dy / dist;
        a.baseX -= nx * push; c.baseX += nx * push;
        a.y -= ny * push * 0.5; c.y += ny * push * 0.5;
        a.x -= nx * push; c.x += nx * push;
      }
    }
  }
  for (const b of bs) b.baseX = Math.max(b.r, Math.min(view.W - b.r, b.baseX));

  // burbuja oscura: mueve y revienta lo que toca
  for (const k of world.darks) {
    const dm = darkMult();
    k.pulse += dt;
    k.x += k.vx * dm * dt; k.y += k.vy * dm * dt;
    if (k.y < k.r || k.y > view.H - k.r) k.vy *= -1;   // rebota arriba/abajo
    for (const b of bs) {
      if (b.dead || b.releasing) continue;
      const dx = b.x - k.x, dy = b.y - k.y;
      if (dx * dx + dy * dy < (b.r * 0.85 + k.r * 0.85) ** 2) popBubble(b, true);
    }
    if (k.x < -k.r * 2 || k.x > view.W + k.r * 2) k.dead = true;
  }

  // efectos
  for (const p of world.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.life -= dt * 1.8; }
  for (const r of world.rings) { r.r += (r.max - r.r) * Math.min(1, dt * 9); r.life -= dt * 3.2; }
  for (const f of world.floaters) { f.y -= 34 * f.slow * dt; f.life -= dt * 1.1 * f.slow; }
  for (const p of world.dust) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.99; p.life -= p.decay * dt; p.tw += dt * 6; }

  world.bubbles = world.bubbles.filter(b => !b.dead);
  world.darks = world.darks.filter(k => !k.dead);
  world.warns = world.warns.filter(w => !w.dead);
  world.dust = world.dust.filter(p => p.life > 0);
  world.particles = world.particles.filter(p => p.life > 0);
  world.rings = world.rings.filter(r => r.life > 0);
  world.floaters = world.floaters.filter(f => f.life > 0);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);   // tope para que no salte si se traba
  last = now;
  updateBreath(now);
  drawBackground(state.mode === "paused" ? 0 : dt);
  drawBreathGuide();
  if (state.mode === "playing") update(dt);
  if (state.mode === "playing" || state.mode === "paused") {
    drawWarns();
    for (const b of world.bubbles) drawBubble(b);
    for (const k of world.darks) drawDark(k);
    drawEffects();
  } else {
    // menú: algunas burbujas decorativas flotando
    if (Math.random() < 0.02) spawnBubble();
    for (const b of world.bubbles) {
      if (b.grow < 1) { b.grow = Math.min(1, b.grow + dt / CONFIG.depthGrowSeconds); b.r = b.R * (0.12 + 0.88 * (1 - Math.pow(1 - b.grow, 3))); }
      b.y += b.vy * dt; b.wobble += b.wobbleSpeed * dt; b.x = b.baseX + Math.sin(b.wobble) * b.wobbleAmp;
      if (b.y < -b.r) b.dead = true;
      drawBubble(b);
    }
    world.bubbles = world.bubbles.filter(b => !b.dead);
  }
  requestAnimationFrame(frame);
}
export function startLoop() { resetClock(); requestAnimationFrame(frame); }
void breath;
