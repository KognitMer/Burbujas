/** Bus de eventos mínimo. El juego emite; la UI y el puente con la app escuchan. */
const handlers = new Map();
export function on(evt, fn) {
  if (!handlers.has(evt)) handlers.set(evt, new Set());
  handlers.get(evt).add(fn);
  return () => off(evt, fn);
}
export function off(evt, fn) { handlers.get(evt)?.delete(fn); }
export function emit(evt, payload) {
  handlers.get(evt)?.forEach(fn => { try { fn(payload); } catch (e) { console.error("[burbujas] handler de", evt, e); } });
}
