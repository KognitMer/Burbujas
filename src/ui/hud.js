/* HUD: puntaje, récord y pistas. Solo escucha eventos; no conoce las reglas del juego. */
import { $ } from "../dom.js";
import { state } from "../state.js";
import { fmt } from "../util.js";
import { t } from "../i18n/index.js";
import { on } from "../events.js";

let bumpT = 0, hintT = 0;
function setScore({ score, best, delta, zen }) {
  const el = $("scoreVal");
  el.textContent = fmt(score);
  $("bestVal").textContent = fmt(best);
  if (delta) {
    el.classList.remove("bump", "hurt");
    el.classList.add(delta > 0 ? "bump" : "hurt");
    clearTimeout(bumpT); bumpT = setTimeout(() => el.classList.remove("bump", "hurt"), 160);
  }
  void zen;
}
export function renderHudLabels() {
  const zen = state.rules === "zen";
  $("scoreLabel").textContent = zen ? t.hud.scoreZen : t.hud.score;
  $("bestLabel").textContent = t.hud.best;
  $("right").classList.toggle("off", zen);
  $("bestVal").textContent = fmt(state.best);
}
export function bindHud() {
  on("score", setScore);
  on("settings", renderHudLabels);
  on("hint:show", ({ text, ms }) => {
    const el = $("hint"); el.textContent = text; el.classList.add("show");
    clearTimeout(hintT); if (ms) hintT = setTimeout(() => el.classList.remove("show"), ms);
  });
  on("hint:hide", () => { clearTimeout(hintT); $("hint").classList.remove("show"); });
  renderHudLabels();
}
