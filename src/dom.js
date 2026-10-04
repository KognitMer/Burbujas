export const $ = id => document.getElementById(id);
export const canvas = $("c");
export const ctx = canvas.getContext("2d");

/** Mantiene el foco de teclado dentro de un diálogo (overlay) mientras está abierto. Devuelve una función para soltarlo. */
export function trapFocus(container) {
  const sel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const onKeydown = e => {
    if (e.key !== "Tab") return;
    const items = [...container.querySelectorAll(sel)].filter(el => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener("keydown", onKeydown);
  return () => document.removeEventListener("keydown", onKeydown);
}
