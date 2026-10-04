/* Almacenamiento local VERSIONADO.
   - Todo vive bajo el prefijo "kognit.burbujas." para no pisar nada de la app anfitriona.
   - SCHEMA sube cuando cambia el formato; migrate() lleva datos viejos al formato nuevo (sin borrarlos).
   - Si localStorage no existe o está bloqueado (modo privado, WebView), el juego sigue funcionando en memoria. */
export const SCHEMA = 2;
const NS = "kognit.burbujas.";

const memory = new Map();
function raw() {
  try { return globalThis.localStorage || null; } catch (_) { return null; }
}
export const store = {
  get(key, def) {
    let v = null;
    try { const ls = raw(); if (ls) v = ls.getItem(NS + key); } catch (_) { /* bloqueado: usamos memoria */ }
    if (v == null) v = memory.get(key) ?? null;
    try { return v == null ? def : JSON.parse(v); } catch (_) { return def; }
  },
  set(key, value) {
    const s = JSON.stringify(value);
    const ls = raw();
    try { if (ls) ls.setItem(NS + key, s); else memory.set(key, s); } catch (_) { memory.set(key, s); }
  },
  remove(key) {
    const ls = raw();
    try { if (ls) ls.removeItem(NS + key); } catch (_) {}
    memory.delete(key);
  }
};

/* ---- ajustes ---- */
export const settings = {
  get() { return { mode: null, speed: 0, music: null, breath: true, ...store.get("settings", {}) }; },
  patch(p) { store.set("settings", { ...store.get("settings", {}), ...p }); }
};
/* ---- récord por modo ---- */
export const bests = {
  get(mode) { return store.get("best", {})[mode] || 0; },
  set(mode, v) { store.set("best", { ...store.get("best", {}), [mode]: v }); }
};
/* ---- pistas ya mostradas ---- */
export const tutorial = {
  get() { return store.get("tutorial", {}); },
  mark(key) { store.set("tutorial", { ...store.get("tutorial", {}), [key]: 1 }); }
};

/* ---- migración desde las claves de versiones anteriores (prototipo de un solo archivo) ---- */
export function migrate(ls = raw()) {
  if (!ls || store.get("schema", 0) >= SCHEMA) return false;
  const get = k => { try { return ls.getItem(k); } catch (_) { return null; } };
  const parse = v => { try { return JSON.parse(v); } catch (_) { return null; } };
  const settingsPatch = {};
  const mode = get("kognit-bubbles-mode");
  if (mode) settingsPatch.mode = mode;
  const speed = parseInt(get("kognit-bubbles-speed-v3") || "", 10);
  if (Number.isFinite(speed)) settingsPatch.speed = speed;
  const music = get("kognit-bubbles-music");
  if (music) settingsPatch.music = music;
  if (get("kognit-bubbles-breath") === "0") settingsPatch.breath = false;
  if (Object.keys(settingsPatch).length) settings.patch(settingsPatch);
  for (const m of ["soltar", "explotar"]) {
    const b = parseFloat(get("kognit-bubbles-best-v3-" + m) || "0");
    if (b > 0 && !bests.get(m)) bests.set(m, Math.round(b));
  }
  const log = parse(get("kognit-bubbles-log-v1"));
  if (log && !Object.keys(store.get("log", {})).length) store.set("log", log);
  store.set("schema", SCHEMA);
  return true;
}
