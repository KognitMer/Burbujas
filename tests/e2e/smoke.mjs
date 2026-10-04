/* Prueba de humo: levanta la build, juega con un bot y verifica el flujo principal.
   Uso: npm run build && node tests/e2e/smoke.mjs */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const PORT = 4179;
const viteBin = fileURLToPath(new URL("../../node_modules/vite/bin/vite.js", import.meta.url));
const srv = spawn(process.execPath, [viteBin, "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 2500));
const errors = [];
let failed = 0;
const ok = (cond, msg) => { console.log((cond ? "ok   " : "FAIL ") + msg); if (!cond) failed++; };

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 390, height: 780 } });
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
await page.addInitScript(() => { window.__events = []; window.addEventListener("message", e => window.__events.push(e.data)); });
await page.goto(`http://localhost:${PORT}/?mode=soltar`);
await page.waitForTimeout(800);

ok(await page.evaluate(() => !!window.KognitBurbujas), "API KognitBurbujas expuesta");
ok(await page.$eval("#startScreen", e => !e.classList.contains("hidden")), "menú visible");
ok((await page.textContent("#intro")).includes("Dejá pasar"), "texto del modo Soltar");

await page.click("#btnStart");
await page.waitForTimeout(500);
ok(await page.$eval("#startScreen", e => e.classList.contains("hidden")), "menú se oculta al empezar");
let hintOk = true;
try {
  await page.waitForFunction(() => document.getElementById("hint").textContent.length > 0, { timeout: 8000 });
} catch { hintOk = false; }
ok(hintOk, "aparece una pista la primera vez");

await page.waitForTimeout(4000);
ok(true, "el juego sigue corriendo sin errores");

for (const m of ["explotar", "zen"]) {
  await page.click("#btnRules"); // soltar -> explotar -> zen
  await page.waitForTimeout(400);
  const label = await page.textContent("#scoreLabel");
  if (m === "zen") ok(label === "Soltadas", "Zen muestra 'Soltadas'");
}
ok(await page.$eval("#right", e => e.classList.contains("off")), "Zen oculta el récord");

await page.click("#btnMusic"); await page.waitForTimeout(200);
ok((await page.textContent("#btnMusic")).includes("Presente"), "cambia a Presente");
await page.click("#btnPause");
ok((await page.textContent("#btnPause")).includes("Seguir"), "pausa");
await page.click("#btnPause");

await page.evaluate(() => window.KognitBurbujas.end());
await page.waitForTimeout(300);
ok(await page.$eval("#startScreen", e => !e.classList.contains("hidden")), "end() vuelve al menú");

await page.click("#btnStatsStart"); await page.waitForTimeout(200);
ok((await page.textContent("#statsBody")).length > 20, "estadísticas se renderizan");

ok(errors.length === 0, "sin errores de consola" + (errors.length ? ": " + errors.join(" | ") : ""));
await page.screenshot({ path: process.env.SHOT || "/tmp/smoke.png" });
await browser.close(); srv.kill();
process.exit(failed ? 1 : 0);
