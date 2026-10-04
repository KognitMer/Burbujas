/* ENTRADA: mouse / touch / teclado. */
import { CONFIG } from "../config.js";
import { state, view, world } from "../state.js";
import { canvas } from "../dom.js";
import { initAudio } from "../audio/engine.js";
import { popBubble, popDark } from "./entities.js";

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

export function bindInput({ onPauseKey, onMuteKey }) {
  canvas.addEventListener("pointerdown", e => { e.preventDefault(); onPointer(e); });
  window.addEventListener("keydown", e => {
    if (e.code === "Space") { e.preventDefault(); onPauseKey(); }
    if (e.key === "m" || e.key === "M") onMuteKey();
  });
}
