/* CONTROLES: cambiar ajustes y manejar la partida (empezar, pausar, volver al menú).
   Este módulo es el único que decide cuándo empieza y termina una sesión. */
import { CONFIG } from "../config.js";
import { state, view, world, rules } from "../state.js";
import { settings, bests } from "../core/storage.js";
import { startSession, endSession } from "../core/metrics.js";
import { rand } from "../util.js";
import { emit } from "../events.js";
import { initAudio, setMuted } from "../audio/engine.js";
import { setMusicStyle } from "../audio/music.js";
import { nextSpawnDelay, spawnBubble } from "./entities.js";
import { startTutorial, forcedNames, isFirstTime } from "./tutorial.js";
import { resetClock } from "./loop.js";

let sessionMeta = null;                       // referencia opaca que pasa la app anfitriona (p. ej. userRef)
export const setSessionMeta = m => { sessionMeta = m; };

export function applyMode(name, { persist = true } = {}) {
  if (!CONFIG.modes[name]) name = CONFIG.defaultMode;
  const changed = state.rules !== name;
  state.rules = name;
  state.best = rules().record ? bests.get(name) : 0;
  if (persist) settings.patch({ mode: name });
  emit("settings", { mode: name });
  if (changed && (state.mode === "playing" || state.mode === "paused")) startGame();   // otras reglas = partida nueva
}
export function applySpeed(level, { persist = true } = {}) {
  state.speedLevel = Math.max(0, Math.min(CONFIG.speeds.length - 1, level | 0));
  if (persist) settings.patch({ speed: state.speedLevel });
  emit("settings", { speed: state.speedLevel });
}
export function applyMusic(key, { persist = true } = {}) {
  const k = setMusicStyle(key);
  if (persist) settings.patch({ music: k });
  emit("settings", { music: k });
}
export function applyMuted(m) { setMuted(!!m); emit("settings", { muted: state.muted }); }
export function applyBreath(on, { persist = true } = {}) {
  state.breathOn = !!on;
  if (persist) settings.patch({ breath: state.breathOn });
  emit("settings", { breath: state.breathOn });
}

export function startGame() {
  initAudio();
  state.mode = "playing";
  state.score = 0;
  state.elapsed = 0;
  state.spawnTimer = nextSpawnDelay();
  state.darkTimer = rules().zen ? Infinity : (isFirstTime() ? CONFIG.firstDarkDelay : rand(8, 11));   // la primera vez, primero se aprende lo demás
  for (const k of Object.keys(world)) world[k] = [];
  startSession({ mode: state.rules, speed: CONFIG.speeds[state.speedLevel].id, meta: sessionMeta });
  startTutorial();
  const forced = forcedNames();
  const nStart = Math.max(3, Math.round(CONFIG.startBubbles * view.areaK));
  for (let i = 0; i < nStart; i++) {
    spawnBubble(view.H * (0.25 + 0.65 * (i + Math.random() * 0.6) / nStart), undefined, forced[i]);
  }
  emit("score", { score: 0, best: state.best, delta: 0, zen: !!rules().zen });
  emit("screen", { name: "game" });
  emit("pause", { paused: false });
  resetClock();
}

export function pause() {
  if (state.mode !== "playing") return;
  state.mode = "paused"; emit("pause", { paused: true });
}
export function resume() {
  if (state.mode !== "paused") return;
  state.mode = "playing"; resetClock(); emit("pause", { paused: false });
}
export function togglePause() { if (state.mode === "playing") pause(); else resume(); }

/** Termina la partida y vuelve al menú (la sesión se reporta a la app anfitriona). */
export function endToMenu(reason = "menu") {
  if (state.mode === "menu") return;
  endSession(reason);
  state.mode = "menu";
  emit("screen", { name: "menu" });
}

/* Ciclo de vida: al ocultarse la pestaña se pausa; si pasa mucho tiempo, la sesión se cierra sola. */
let idleTimer = 0;
export function bindLifecycle() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pause();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => endToMenu("idle"), CONFIG.idleEndSeconds * 1000);
    } else clearTimeout(idleTimer);
  });
  window.addEventListener("pagehide", () => endSession("unload"));
}
