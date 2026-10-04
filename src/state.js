import { CONFIG } from "./config.js";

/* Estado compartido del juego (un solo lugar, sin variables globales sueltas). */
export const state = {
  mode: "menu",            // menu | playing | paused
  rules: "",               // modo de juego: soltar | explotar | zen
  score: 0,
  best: 0,
  elapsed: 0,
  refillTimer: 0,
  spawnTimer: 0,
  darkTimer: 0,
  speedLevel: 0,
  breathOn: true,
  muted: false
};

/* Tamaño y factores de adaptación a la pantalla */
export const view = {
  W: 0, H: 0, DPR: 1,
  S: 1, areaK: 1, darkSpeedK: 1,
  isTouch: typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches,
  reduced: typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches
};

/* Todo lo que se dibuja y se mueve */
export const world = { bubbles: [], darks: [], warns: [], particles: [], rings: [], floaters: [], dust: [] };
export const images = {};

/* Respiración guiada: k = 0..1 (tamaño), phase = "in" | "out", prog = avance de la fase 0..1 */
export const breath = { k: 0.5, phase: "", prog: 0 };

/** Reglas del modo actual (tabla de puntajes, si hay burbuja oscura, etc.) */
export const rules = () => CONFIG.modes[state.rules] || CONFIG.modes[CONFIG.defaultMode];
