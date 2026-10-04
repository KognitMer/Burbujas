/* PUNTAJE · funciones PURAS (sin DOM, sin audio, sin estado global).
   Este archivo está pensado para poder usarse igual en el backend: el servidor puede recalcular los puntos
   de una sesión a partir de los conteos que reporta el juego (ver docs/ECONOMY.md y docs/INTEGRATION.md). */
import { CONFIG } from "../config.js";

export const typeOf = name => (CONFIG.emotions[name] || { type: "neu" }).type;
export const modeRules = mode => CONFIG.modes[mode] || CONFIG.modes[CONFIG.defaultMode];

/** Puntos por tocar (explotar) una burbuja de ese tipo en ese modo. */
export const popPoints = (mode, type) => modeRules(mode).pop[type] || 0;
/** Puntos cuando una burbuja llega arriba y se va sola. */
export const escapePoints = (mode, type) => modeRules(mode).escape[type] || 0;

/** El puntaje nunca baja de 0. Devuelve el nuevo puntaje y lo realmente aplicado. */
export function applyDelta(score, delta) {
  const next = Math.max(0, score + delta);
  return { score: next, applied: next - score };
}

export const EMPTY_COUNTS = () => ({ popNeg: 0, popPos: 0, popNeu: 0, relNeg: 0, relPos: 0, relNeu: 0, darkHits: 0 });

/** Ganado / perdido "en bruto" a partir de los conteos de una sesión (sin el piso en 0, que depende del orden).
 *  El servidor puede usarlo para validar lo que reporta el cliente: neto real <= bruto. */
export function pointsFromCounts(mode, counts) {
  const c = { ...EMPTY_COUNTS(), ...counts };
  const events = [
    [popPoints(mode, "neg"), c.popNeg], [popPoints(mode, "pos"), c.popPos], [popPoints(mode, "neu"), c.popNeu],
    [escapePoints(mode, "neg"), c.relNeg], [escapePoints(mode, "pos"), c.relPos], [escapePoints(mode, "neu"), c.relNeu],
    [CONFIG.darkHitPenalty, c.darkHits]
  ];
  let earned = 0, lost = 0;
  for (const [pts, n] of events) { if (pts > 0) earned += pts * n; else lost += -pts * n; }
  return { earned, lost, net: Math.max(0, earned - lost) };
}
