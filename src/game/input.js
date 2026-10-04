/* ENTRADA: mouse / touch / teclado. */
import { CONFIG } from "../config.js";
import { state, view, world } from "../state.js";
import { canvas } from "../dom.js";
import { initAudio } from "../audio/engine.js";
import { popBubble, popDark } from "./entities.js";
import { emit } from "../events.js";
import { tutorial } from "../core/storage.js";
import { t } from "../i18n/index.js";

const hitPad = () => CONFIG.hitPadding + (view.isTouch ? CONFIG.hitPaddingTouch : 0);   // el dedo es menos preciso que el mouse

function onPointer(e) {
  initAudio();                                    // el audio solo puede arrancar con un gesto del usuario
  if (state.mode !== "playing") return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  // primero la burbuja oscura (está encima y es prioridad: hay que apagarla)
  for (let i = world.darks.length - 1; i >= 0; i--) {
    const k = world.darks[i];
    const dx = x - k.x, dy = y - k.y;
    const rr = k.r + hitPad();
    if (dx * dx + dy * dy <= rr * rr) { popDark(k); return; }
  }
  // luego las normales (las últimas dibujadas están arriba)
  for (let i = world.bubbles.length - 1; i >= 0; i--) {
    const b = world.bubbles[i];
    if (b.releasing) continue;
    const dx = x - b.x, dy = y - b.y;
    const rr = b.r * 0.92 + hitPad();
    if (dx * dx + dy * dy <= rr * rr) { popBubble(b, false); break; }
  }
}

/* Navegación por teclado: una burbuja a la vez, como alternativa al mouse/touch (es más tranquilo para algunas personas). */
let kbTarget = null, kbActive = false;
const inWorld = b => world.darks.includes(b) || world.bubbles.includes(b);
const selectable = () => [...world.darks, ...world.bubbles.filter(b => !b.dead && !b.releasing && b.grow >= 1).sort((a, c) => a.y - c.y)];

function clearFocus() { if (kbTarget) kbTarget.kbFocus = false; kbTarget = null; }
function focusOn(b) { clearFocus(); kbTarget = b; if (b) b.kbFocus = true; }

function ensureTarget() {
  if (kbTarget && inWorld(kbTarget) && !kbTarget.dead && !kbTarget.releasing) return kbTarget;
  const list = selectable();
  focusOn(list[0] || null);
  return kbTarget;
}

function moveSelection(dir) {
  const list = selectable();
  if (!list.length) { clearFocus(); return; }
  const i = kbTarget ? list.indexOf(kbTarget) : -1;
  focusOn(list[(i + dir + list.length) % list.length]);
}

function activateKeyboard() {
  if (kbActive) return;
  kbActive = true;
  if (!tutorial.get().keyboard) { emit("hint:show", { text: t.hints.keyboard, ms: 5200 }); tutorial.mark("keyboard"); }
}

function popSelected() {
  const target = ensureTarget();
  if (!target) return;
  if (world.darks.includes(target)) popDark(target); else popBubble(target, false);
  ensureTarget();
}

/** Si el jugador ya usó el teclado, mantiene el cursor apuntando a una burbuja válida cuadro a cuadro. */
export function updateKbFocus() { if (kbActive) ensureTarget(); }

export function bindInput({ onPauseKey, onMuteKey }) {
  canvas.addEventListener("pointerdown", e => { e.preventDefault(); onPointer(e); });
  window.addEventListener("keydown", e => {
    if (e.code === "Space") { e.preventDefault(); onPauseKey(); }
    if (e.key === "m" || e.key === "M") onMuteKey();
    if (state.mode !== "playing") return;
    if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(e.key)) {
      e.preventDefault(); initAudio(); activateKeyboard();
      moveSelection(e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1);
    } else if (e.key === "Enter" && kbActive) {
      e.preventDefault(); initAudio(); popSelected();
    }
  });
}
