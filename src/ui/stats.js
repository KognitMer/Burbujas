/* ESTADÍSTICAS locales (últimos 7 días, por modo) + exportar CSV + borrar datos. */
import { $, trapFocus } from "../dom.js";
import { state } from "../state.js";
import { dayKey, nf } from "../util.js";
import { t } from "../i18n/index.js";
import { getLog, saveLog, resetLog, EMPTY_ROW } from "../core/metrics.js";
import { pause } from "../game/controls.js";

const lastDays = n => {
  const out = [], now = new Date();
  for (let i = n - 1; i >= 0; i--) out.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
  return out;
};
const dayLabel = (d, i, arr) => i === arr.length - 1 ? t.stats.today : d.toLocaleDateString(t.lang, { weekday: "short", day: "numeric" });
const c = t => t.stats.cols;

function renderZen() {
  $("statsMode").textContent = t.stats.zenLine;
  const col = c(t);
  let html = `<table class="stats"><tr><th scope="col">${col.day}</th><th scope="col">${col.min}</th><th scope="col">${col.sessionsLong}</th><th scope="col">${col.released}</th></tr>`;
  const tot = EMPTY_ROW();
  lastDays(7).forEach((d, i, arr) => {
    const r = (getLog()[dayKey(d)] || {}).zen, label = dayLabel(d, i, arr);
    if (!r || r.sec < 1) { html += `<tr class="none"><td>${label}</td><td>–</td><td>–</td><td>–</td></tr>`; return; }
    for (const k in tot) tot[k] += r[k] || 0;
    html += `<tr><td>${label}</td><td>${nf(r.sec / 60)}</td><td>${r.sessions}</td><td>${r.relNeg}</td></tr>`;
  });
  html += `<tr class="total"><td>${t.stats.week}</td><td>${nf(tot.sec / 60)}</td><td>${tot.sessions}</td><td>${tot.relNeg}</td></tr></table>`;
  html += `<p class="statsnote">${t.stats.zenNote}</p>`;
  $("statsBody").innerHTML = html;
}

function renderPoints(mode) {
  $("statsMode").textContent = t.stats.modeLine(t.modes[mode].name);
  const col = c(t);
  let html = `<table class="stats"><tr><th scope="col">${col.day}</th><th scope="col">${col.min}</th><th scope="col" class="cp">${col.sessions}</th><th scope="col">${col.earned}</th><th scope="col">${col.lost}</th><th scope="col">${col.net}</th><th scope="col">${col.ppm}</th></tr>`;
  const tot = EMPTY_ROW(); let played = 0;
  lastDays(7).forEach((d, i, arr) => {
    const r = (getLog()[dayKey(d)] || {})[mode], label = dayLabel(d, i, arr);
    if (!r || r.sec < 1) { html += `<tr class="none"><td>${label}</td><td class="cp">–</td><td>–</td><td>–</td><td>–</td><td>–</td></tr>`; return; }
    played++;
    for (const k in tot) tot[k] += r[k] || 0;
    const min = r.sec / 60, net = r.earned - r.lost;
    html += `<tr><td>${label}</td><td>${nf(min)}</td><td class="cp">${r.sessions}</td><td>+${nf(r.earned)}</td><td>−${nf(r.lost)}</td><td>${nf(net)}</td><td>${min >= 0.2 ? nf(net / min) : "–"}</td></tr>`;
  });
  const tmin = tot.sec / 60, tnet = tot.earned - tot.lost;
  html += `<tr class="total"><td>${t.stats.week}</td><td>${nf(tmin)}</td><td class="cp">${tot.sessions}</td><td>+${nf(tot.earned)}</td><td>−${nf(tot.lost)}</td><td>${nf(tnet)}</td><td>${tmin >= 0.2 ? nf(tnet / tmin) : "–"}</td></tr></table>`;
  html += played
    ? `<p class="statsnote">${t.stats.summary(played, nf(tnet / played, 0), nf(tmin / played))}<br>${t.stats.counts(tot)}</p>`
    : `<p class="statsnote">${t.stats.none}</p>`;
  $("statsBody").innerHTML = html;
}

export function buildCSV() {
  const log = getLog();
  const lines = ["fecha,modo,minutos,partidas,ganados,perdidos,neto,pop_dificiles,pop_positivas,pop_neutrales,salieron_dificiles,salieron_positivas,salieron_neutrales,golpes_oscura"];
  Object.keys(log).sort().forEach(day => {
    for (const mode in log[day]) {
      const r = log[day][mode];
      lines.push([day, mode, (r.sec / 60).toFixed(2), r.sessions, r.earned, r.lost, r.earned - r.lost, r.popNeg, r.popPos, r.popNeu, r.relNeg, r.relPos, r.relNeu, r.darkHits || 0].join(","));
    }
  });
  return lines.join("\n");
}

export function renderStats() { state.rules === "zen" ? renderZen() : renderPoints(state.rules); }
let releaseTrap = null, returnFocusTo = null;
export function openStats() {
  saveLog(); renderStats(); pause();
  returnFocusTo = document.activeElement;
  $("statsScreen").classList.remove("hidden");
  releaseTrap = trapFocus($("statsScreen"));
  $("btnStatsClose").focus();
}
const closeStats = () => {
  $("statsScreen").classList.add("hidden");
  if (releaseTrap) { releaseTrap(); releaseTrap = null; }
  if (returnFocusTo?.isConnected) returnFocusTo.focus();
};

export function bindStats() {
  $("statsTitle").textContent = t.stats.title;
  $("btnStatsClose").textContent = t.buttons.close;
  $("btnCopy").textContent = t.buttons.copy;
  $("btnResetLog").textContent = t.buttons.reset;
  $("btnStatsClose").onclick = closeStats;
  window.addEventListener("keydown", e => { if (e.key === "Escape") closeStats(); });
  $("btnCopy").onclick = async () => {
    const b = $("btnCopy"), text = buildCSV();
    try { await navigator.clipboard.writeText(text); b.textContent = t.buttons.copied; }
    catch (_) {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); b.textContent = t.buttons.copied; } catch (__) { b.textContent = t.buttons.copyFail; }
      ta.remove();
    }
    setTimeout(() => { b.textContent = t.buttons.copy; }, 1600);
  };
  let armed = 0;
  $("btnResetLog").onclick = () => {
    const b = $("btnResetLog");
    if (!armed) { armed = setTimeout(() => { armed = 0; b.textContent = t.buttons.reset; }, 3000); b.textContent = t.buttons.resetConfirm; return; }
    clearTimeout(armed); armed = 0; b.textContent = t.buttons.reset;
    resetLog(); renderStats();
  };
}
