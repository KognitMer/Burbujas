import es from "./es.js";
import en from "./en.js";

const LANGS = { es, en };
let current = es;

export function setLang(code) { current = LANGS[code] || es; return current; }
/** Textos del idioma activo (objeto anidado). */
export const t = new Proxy({}, { get: (_, k) => current[k] });
export const LANG_CODES = Object.keys(LANGS);
