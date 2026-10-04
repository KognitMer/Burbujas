/* REGISTRO DE USO (por día y por modo) + SESIÓN actual.
   - El registro diario sirve para calibrar la economía de puntos (¿cuánto junta una persona en una semana?).
   - La sesión alimenta el evento "session:end", que es lo que recibe la app anfitriona. */
import { store } from "./storage.js";
import { EMPTY_COUNTS } from "./scoring.js";
import { dayKey, uid } from "../util.js";
import { emit } from "../events.js";
import { CONFIG } from "../config.js";

export const EMPTY_ROW = () => ({ sec: 0, sessions: 0, earned: 0, lost: 0, ...EMPTY_COUNTS() });

let usageLog = store.get("log", {});
let dirty = false;

export const getLog = () => usageLog;
export function rowFor(mode, date = new Date()) {
  const k = dayKey(date);
  const day = usageLog[k] || (usageLog[k] = {});
  return day[mode] || (day[mode] = EMPTY_ROW());
}
export function saveLog() { if (dirty) { store.set("log", usageLog); dirty = false; } }
export function resetLog() { usageLog = {}; dirty = false; store.remove("log"); }

let session = null;

/** Suma un evento al registro diario y a la sesión en curso. */
export function track(field, n = 1) {
  if (!session) return;
  rowFor(session.mode)[field] = (rowFor(session.mode)[field] || 0) + n;
  dirty = true;
  if (field === "earned" || field === "lost") session[field] += n;
  else session.counts[field] = (session.counts[field] || 0) + n;
}
export function tick(dt) {
  if (!session) return;
  session.sec += dt;
  session.secAcc += dt;
  if (session.secAcc >= 1) { rowFor(session.mode).sec += session.secAcc; session.secAcc = 0; dirty = true; }
}
export const currentSession = () => session;

export function startSession({ mode, speed, meta }) {
  endSession("restart");
  session = { id: uid(), mode, speed, startedAt: Date.now(), sec: 0, secAcc: 0, earned: 0, lost: 0, counts: EMPTY_COUNTS(), score: 0, meta: meta || null };
  rowFor(mode).sessions += 1; dirty = true;
  emit("session:start", { id: session.id, mode, speed, startedAt: session.startedAt });
}
export function setSessionScore(score) { if (session) session.score = score; }

/** Cierra la sesión y emite el resumen. reason: "restart" | "hidden" | "idle" | "host" | "unload". */
export function endSession(reason) {
  if (!session) return null;
  const s = session; session = null;
  if (s.secAcc > 0) { rowFor(s.mode).sec += s.secAcc; dirty = true; }
  saveLog();
  if (s.sec < CONFIG.minSessionSeconds) { emit("session:discard", { id: s.id, reason }); return null; }
  const summary = {
    schema: 2,
    game: "burbujas",
    version: typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev",
    sessionId: s.id,
    mode: s.mode,
    speed: s.speed,
    startedAt: new Date(s.startedAt).toISOString(),
    endedAt: new Date().toISOString(),
    durationSec: Math.round(s.sec),
    endReason: reason,
    score: s.score,                                    // puntaje final (en Zen: emociones soltadas)
    points: { earned: s.earned, lost: s.lost, net: Math.max(0, s.earned - s.lost) },
    counts: { ...s.counts },
    meta: s.meta                                        // referencia opaca que pase la app (p. ej. userRef)
  };
  emit("session:end", summary);
  return summary;
}
