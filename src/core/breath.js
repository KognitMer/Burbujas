/* Respiración guiada: inhala 4 s · exhala 6 s · sin retención. Curvas suaves (coseno). */
import { CONFIG } from "../config.js";
import { state, breath } from "../state.js";

/** 0..1 según el ciclo de respiración. tp = tiempo en segundos. */
export function breathAt(tp) {
  const { inhale, exhale } = CONFIG.breath, t = tp % (inhale + exhale);
  return t < inhale ? 0.5 - 0.5 * Math.cos(Math.PI * t / inhale) : 0.5 + 0.5 * Math.cos(Math.PI * (t - inhale) / exhale);
}

/** Actualiza breath.k / phase / prog con el reloj (ms). */
export function updateBreath(nowMs) {
  if (!state.breathOn) { breath.k = 0.5; return; }
  const { inhale, exhale } = CONFIG.breath;
  const t = (nowMs / 1000) % (inhale + exhale);
  if (t < inhale) { breath.phase = "in"; breath.prog = t / inhale; }
  else { breath.phase = "out"; breath.prog = (t - inhale) / exhale; }
  breath.k = breathAt(nowMs / 1000);
}
