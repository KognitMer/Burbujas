/* PISTAS: se aprende jugando (no hay pantalla de reglas). Una vez por modo:
   1) una emoción difícil con un aro punteado + texto, 2) una positiva, 3) cierre breve.
   Las pistas ya vistas se guardan (storage "tutorial") y no se repiten. */
import { state, view, world, rules } from "../state.js";
import { tutorial } from "../core/storage.js";
import { t } from "../i18n/index.js";
import { emit, on } from "../events.js";
import { pickName, spawnBubble } from "./entities.js";

let tut = null;

const steps = () => ["neg", "pos"].filter(type => t.modes[state.rules]?.hints?.[type]);

export function startTutorial() {
  emit("hint:hide");
  tut = null;
  if (tutorial.get()[state.rules]) return;
  tut = rules().zen ? { zen: true, t: 0 } : { i: 0, target: null, cool: 1.5, idle: 0, t: 0 };
}
export const tutorialActive = () => !!tut;
/** Nombres de las primeras burbujas: la primera vez entre ellas hay una difícil y una positiva. */
export const forcedNames = () => (tut && !tut.zen ? [pickName("neg"), pickName("pos")] : []);
export const isFirstTime = () => !tutorial.get()[state.rules];

function finish() { tutorial.mark(state.rules); tut = null; }

export function updateTutorial(dt) {
  if (!tut) return;
  const m = t.modes[state.rules];
  if (tut.zen) {
    tut.t += dt;
    if (tut.t > 1 && !tut.shown) { emit("hint:show", { text: m.zenHint }); tut.shown = 1; }
    if (tut.t > 10) { emit("hint:hide"); finish(); }
    return;
  }
  if (tut.cool > 0) { tut.cool -= dt; return; }
  const list = steps();
  if (tut.i >= list.length) {                                    // cierre breve y listo
    if (!tut.closing) { if (m.done) emit("hint:show", { text: m.done }); tut.closing = 1; }
    tut.t += dt;
    if (tut.t > 3.5) { emit("hint:hide"); finish(); }
    return;
  }
  const type = list[tut.i];
  if (!tut.target) {
    const b = world.bubbles.find(b => b.type === type && !b.dead && !b.releasing && b.grow >= 1 && b.y > view.H * 0.25 && b.y < view.H * 0.85);
    if (b) { tut.target = b; b.hintTarget = true; emit("hint:show", { text: m.hints[type] }); tut.idle = 0; }
    else { tut.idle += dt; if (tut.idle > 6) { spawnBubble(undefined, true, pickName(type)); tut.idle = 0; } }
  } else if (tut.target.dead || tut.target.releasing) {          // ya hizo lo suyo (la soltó o la tocó)
    tut.target.hintTarget = false; tut.target = null; tut.i++; tut.cool = 1.2; emit("hint:hide");
  }
}

/* La primera burbuja oscura de la vida se anuncia con un texto breve (si no hay otra pista en curso) */
on("dark:warn", () => {
  if (tut || tutorial.get().dark) return;
  emit("hint:show", { text: t.hints.darkIncoming, ms: 5200 });
  tutorial.mark("dark");
});
