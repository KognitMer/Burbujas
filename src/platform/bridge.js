/* PUENTE CON LA APP ANFITRIONA (Kognit).
   El juego corre en un iframe o WebView y habla con la app por mensajes. No conoce usuarios ni backend.

   Salida (juego → app), formato { source: "kognit-burbujas", type, payload }:
     ready, session:start, session:end, session:discard, settings
   Entrada (app → juego), formato { target: "kognit-burbujas", type, payload }:
     config {mode,speed,music,breath,muted,meta}, pause, resume, end, mute {muted}
   Seguridad: los comandos de entrada solo se aceptan si la URL trae ?host=<origen> y el mensaje viene de ese origen
   (o, en WebView nativo, de ReactNativeWebView). Ver docs/INTEGRATION.md. */
import { state } from "../state.js";
import { CONFIG } from "../config.js";
import { on, off } from "../events.js";
import { getMusicStyle } from "../audio/music.js";
import { applyMode, applySpeed, applyMusic, applyMuted, applyBreath, pause, resume, endToMenu, setSessionMeta } from "../game/controls.js";

const SOURCE = "kognit-burbujas";
const VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
const params = new URLSearchParams(globalThis.location?.search || "");
const hostOrigin = params.get("host") || "";

const getState = () => ({
  version: VERSION, mode: state.rules, speed: CONFIG.speeds[state.speedLevel].id, music: getMusicStyle(),
  breath: state.breathOn, muted: state.muted, screen: state.mode, score: state.score
});

function post(type, payload) {
  const msg = { source: SOURCE, type, payload };
  try {
    if (globalThis.ReactNativeWebView) globalThis.ReactNativeWebView.postMessage(JSON.stringify(msg));
    else if (globalThis.parent && globalThis.parent !== globalThis) globalThis.parent.postMessage(msg, hostOrigin || "*");
  } catch (_) { /* sin anfitrión: no pasa nada */ }
}

export function applyConfig(c = {}) {
  if (c.mode) applyMode(c.mode, { persist: false });
  if (Number.isInteger(c.speed)) applySpeed(c.speed, { persist: false });
  else if (typeof c.speed === "string") { const i = CONFIG.speeds.findIndex(s => s.id === c.speed); if (i >= 0) applySpeed(i, { persist: false }); }
  if (c.music) applyMusic(c.music, { persist: false });
  if (typeof c.breath === "boolean") applyBreath(c.breath, { persist: false });
  if (typeof c.muted === "boolean") applyMuted(c.muted);
  if ("meta" in c) setSessionMeta(c.meta);
}

function handle(data) {
  if (!data || data.target !== SOURCE) return;
  const { type, payload } = data;
  if (type === "config") applyConfig(payload);
  else if (type === "pause") pause();
  else if (type === "resume") resume();
  else if (type === "end") endToMenu("host");
  else if (type === "mute") applyMuted(!!payload?.muted);
}

export function initBridge() {
  // URL: ?mode=zen&speed=suave&music=presente&breath=0&muted=1&host=https://app.kognit.com
  const q = {};
  for (const k of ["mode", "speed", "music"]) if (params.get(k)) q[k] = params.get(k);
  if (params.has("breath")) q.breath = params.get("breath") !== "0";
  if (params.has("muted")) q.muted = params.get("muted") === "1";
  applyConfig(q);

  const forward = ["session:start", "session:end", "session:discard", "settings"];
  const subs = forward.map(type => { const fn = p => post(type, p); on(type, fn); return [type, fn]; });

  window.addEventListener("message", e => {
    if (!hostOrigin || e.origin !== hostOrigin) return;
    handle(e.data);
  });
  // WebView nativo: la app inyecta mensajes con window.postMessage (sin origen verificable); solo si hay ReactNativeWebView
  if (globalThis.ReactNativeWebView) document.addEventListener("message", e => { try { handle(JSON.parse(e.data)); } catch (_) {} });

  globalThis.KognitBurbujas = {
    version: VERSION,
    on, off, getState,
    applyConfig,
    pause, resume, end: () => endToMenu("host"),
    destroy() { subs.forEach(([t, f]) => off(t, f)); }
  };
  post("ready", getState());
}
