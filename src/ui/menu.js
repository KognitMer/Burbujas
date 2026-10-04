/* MENÚ y botones inferiores: chips de modo / velocidad / música y textos de los botones. */
import { CONFIG } from "../config.js";
import { $ } from "../dom.js";
import { state } from "../state.js";
import { t } from "../i18n/index.js";
import { on } from "../events.js";
import { initAudio } from "../audio/engine.js";
import { getMusicStyle } from "../audio/music.js";
import { applyMode, applySpeed, applyMusic, applyMuted, applyBreath, startGame, togglePause } from "../game/controls.js";
import { openStats } from "./stats.js";

const chips = (id, items, current, onPick) => {
  const box = $(id); box.textContent = "";
  items.forEach(({ key, label }) => {
    const b = document.createElement("button");
    b.textContent = label; b.dataset.key = key;
    b.onclick = () => onPick(key);
    box.appendChild(b);
  });
  void current;
};
const mark = (id, key) => document.querySelectorAll(`#${id} button`).forEach(b => b.classList.toggle("on", b.dataset.key === String(key)));
const cycle = (list, cur) => list[(list.indexOf(cur) + 1) % list.length];

export function renderMenu() {
  const mode = state.rules, music = getMusicStyle();
  $("intro").textContent = t.modes[mode].intro;
  $("btnRules").textContent = "🎯 " + t.modes[mode].name;
  $("btnSpeed").textContent = "🫧 " + t.speeds[CONFIG.speeds[state.speedLevel].id];
  $("btnMusic").textContent = "🎵 " + t.music[music];
  $("btnBreath").textContent = state.breathOn ? t.buttons.breathOn : t.buttons.breathOff;
  $("btnMute").textContent = state.muted ? t.buttons.unmute : t.buttons.mute;
  $("btnPause").textContent = state.mode === "paused" ? t.buttons.resume : t.buttons.pause;
  mark("ruleChips", mode); mark("speedChips", state.speedLevel); mark("musicChips", music);
}

export function bindMenu() {
  $("tip").textContent = t.breath.tip;
  $("btnStart").textContent = t.buttons.start;
  $("btnStatsStart").textContent = t.buttons.statsIcon + " " + t.buttons.stats;
  const modes = Object.keys(CONFIG.modes);
  chips("ruleChips", modes.map(k => ({ key: k, label: t.modes[k].name })), state.rules, applyMode);
  chips("speedChips", CONFIG.speeds.map((s, i) => ({ key: i, label: t.speeds[s.id] })), state.speedLevel, applySpeed);
  chips("musicChips", CONFIG.musicStyles.map(k => ({ key: k, label: (k === "off" ? "" : "🎵 ") + t.music[k] })), getMusicStyle(), k => { initAudio(); applyMusic(k); });

  $("btnRules").onclick = () => applyMode(cycle(modes, state.rules));
  $("btnSpeed").onclick = () => applySpeed((state.speedLevel + 1) % CONFIG.speeds.length);
  $("btnMusic").onclick = () => { initAudio(); applyMusic(cycle(CONFIG.musicStyles, getMusicStyle())); };
  $("btnBreath").onclick = () => applyBreath(!state.breathOn);
  $("btnMute").onclick = () => { initAudio(); applyMuted(!state.muted); };
  $("btnPause").onclick = togglePause;
  $("btnStart").onclick = startGame;
  $("btnStats").onclick = openStats;
  $("btnStatsStart").onclick = openStats;

  on("settings", renderMenu);
  on("pause", renderMenu);
  on("screen", ({ name }) => { $("startScreen").classList.toggle("hidden", name !== "menu"); renderMenu(); });
  renderMenu();
}
