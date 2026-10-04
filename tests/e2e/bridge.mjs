/* Verifica el resumen de sesión que recibe la app anfitriona. */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
const PORT = 4180;
const srv = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 2500));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 390, height: 780 } });
await page.goto(`http://localhost:${PORT}/?mode=explotar&speed=rapida&music=off`);
await page.waitForTimeout(500);
const summary = await page.evaluate(async () => {
  const api = window.KognitBurbujas; let s = null;
  api.on("session:end", p => { s = p; });
  api.applyConfig({ meta: { userRef: "u-123" } });
  document.getElementById("btnStart").click();
  await new Promise(r => setTimeout(r, 6500));
  api.end();
  return s;
});
console.log(JSON.stringify(summary, null, 1));
let bad = 0;
const chk = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) bad++; };
chk(summary && summary.schema === 2 && summary.mode === "explotar" && summary.speed === "rapida", "modo y velocidad por URL");
chk(summary && summary.endReason === "host" && summary.durationSec >= 5, "end() reporta endReason=host y duración");
chk(summary && summary.meta?.userRef === "u-123", "meta opaca llega en el resumen");
await browser.close(); srv.kill(); process.exit(bad ? 1 : 0);
