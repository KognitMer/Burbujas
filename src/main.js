/* ARRANQUE: une los módulos. No tiene lógica de juego. */
import { CONFIG } from "./config.js";
import { state, images } from "./state.js";
import { migrate, settings } from "./core/storage.js";
import { resize, startLoop } from "./game/loop.js";
import { bindInput } from "./game/input.js";
import { applyMode, applySpeed, applyMusic, applyBreath, applyMuted, bindLifecycle, togglePause } from "./game/controls.js";
import { bindHud } from "./ui/hud.js";
import { bindMenu } from "./ui/menu.js";
import { bindStats } from "./ui/stats.js";
import { initBridge } from "./platform/bridge.js";

migrate();
const saved = settings.get();
applyMode(saved.mode || CONFIG.defaultMode, { persist: false });
applySpeed(saved.speed || 0, { persist: false });
applyMusic(saved.music || CONFIG.defaultMusic, { persist: false });
applyBreath(saved.breath, { persist: false });

for (const name of CONFIG.imageFiles) {
  const img = new Image();
  img.src = `${import.meta.env.BASE_URL}assets/${name}.webp`;
  images[name] = img;
}

bindHud();
bindMenu();
bindStats();
bindLifecycle();
bindInput({ onPauseKey: togglePause, onMuteKey: () => { applyMuted(!state.muted); } });
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 200));
resize();
initBridge();
startLoop();

/* PWA: cache offline. Si corre embebido (iframe/WebView) y el navegador lo bloquea, no pasa nada. */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
