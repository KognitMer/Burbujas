export const rand = (a, b) => a + Math.random() * (b - a);
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const pad2 = n => String(n).padStart(2, "0");
export const dayKey = d => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
/** 3 -> "3", 2.5 -> "2,5" (coma decimal) */
export const fmt = n => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));
/** número para tablas: sin decimales si es grande */
export const nf = (n, d = 1) => {
  if (d === 1 && Math.abs(n) >= 100) d = 0;
  return Number.isInteger(n) && d === 1 ? String(n) : n.toFixed(d).replace(".", ",");
};
export const uid = () =>
  (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
