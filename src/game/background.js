/* FONDO cósmico (estrellas + nebulosas, que respiran con el círculo) y guía de respiración. */
import { state, view, breath } from "../state.js";
import { ctx } from "../dom.js";
import { t } from "../i18n/index.js";

/* ---------- 4. FONDO COSMOS ---------- */
let stars = [], nebulae = [];
export function buildBackground() {
  const count = Math.floor((view.W * view.H) / 3800);
  stars = Array.from({ length: count }, () => {
    const depth = Math.random();                 // 0 lejos, 1 cerca
    return {
      x: Math.random() * view.W, y: Math.random() * view.H,
      r: 0.25 + depth * 1.4,
      speed: 2 + depth * 10,                    // parallax lento
      tw: Math.random() * Math.PI * 2,
      twSpeed: 0.4 + Math.random() * 1.6,
      hue: Math.random() < 0.2 ? 200 : (Math.random() < 0.5 ? 230 : 0),
      a: 0.35 + depth * 0.65
    };
  });
  nebulae = [
    { x: view.W * 0.2, y: view.H * 0.3, r: Math.max(view.W, view.H) * 0.45, c: "60,40,160", a: 0.16, dx: 3 },
    { x: view.W * 0.8, y: view.H * 0.7, r: Math.max(view.W, view.H) * 0.5, c: "20,110,190", a: 0.13, dx: -2 },
    { x: view.W * 0.5, y: view.H * 0.1, r: Math.max(view.W, view.H) * 0.35, c: "130,40,150", a: 0.09, dx: 2 }
  ];
}
export function drawBreathGuide() {
  if (!state.breathOn) return;
  const cx = view.W / 2, cy = view.H * 0.46;
  const Rg = Math.max(62, Math.min(135, Math.min(view.W, view.H) * 0.2));
  const rIn = Rg * (0.42 + 0.58 * breath.k);
  const inh = breath.phase === "in";
  ctx.save();
  ctx.lineWidth = 1.2; ctx.setLineDash([3, 8]);
  ctx.strokeStyle = "rgba(160,215,255,.2)";
  ctx.beginPath(); ctx.arc(cx, cy, Rg, 0, 6.2832); ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 2; ctx.lineCap = "round";                      // avance de la fase actual
  ctx.strokeStyle = inh ? "rgba(150,230,255,.4)" : "rgba(185,170,255,.34)";
  ctx.beginPath(); ctx.arc(cx, cy, Rg, -Math.PI / 2, -Math.PI / 2 + 6.2832 * breath.prog); ctx.stroke();
  const g = ctx.createRadialGradient(cx - rIn * 0.22, cy - rIn * 0.26, rIn * 0.05, cx, cy, rIn);
  g.addColorStop(0, "rgba(190,235,255,.22)"); g.addColorStop(0.65, "rgba(70,160,255,.11)"); g.addColorStop(1, "rgba(70,160,255,.04)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, rIn, 0, 6.2832); ctx.fill();
  ctx.lineWidth = 1.3; ctx.strokeStyle = "rgba(170,225,255,.32)";
  ctx.beginPath(); ctx.arc(cx, cy, rIn, 0, 6.2832); ctx.stroke();
  ctx.fillStyle = "rgba(234,246,255,.55)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = "500 12px 'Segoe UI', system-ui, sans-serif";
  ctx.fillText((t.breath[breath.phase] || "").toUpperCase(), cx, cy);
  ctx.restore();
}
export function drawBackground(dt) {
  ctx.fillStyle = "#02030a";
  ctx.fillRect(0, 0, view.W, view.H);
  const bk = state.breathOn && !view.reduced ? breath.k : 0.5;   // el fondo respira con el círculo (salvo "reducir movimiento")
  for (const n of nebulae) {
    n.x += n.dx * dt * (view.reduced ? 0.15 : 1);
    if (n.x < -n.r * 0.3) n.dx = Math.abs(n.dx);
    if (n.x > view.W + n.r * 0.3) n.dx = -Math.abs(n.dx);
    const nr = n.r * (0.94 + 0.12 * bk);
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, nr);
    g.addColorStop(0, `rgba(${n.c},${n.a * (0.8 + 0.4 * bk)})`);
    g.addColorStop(1, `rgba(${n.c},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, view.W, view.H);
  }
  for (const s of stars) {
    s.y += s.speed * (view.reduced ? 0.25 : 0.55 + 0.9 * bk) * dt;
    if (s.y > view.H + 2) { s.y = -2; s.x = Math.random() * view.W; }
    s.tw += s.twSpeed * dt * (view.reduced ? 0.2 : 1);
    const a = s.a * (0.6 + 0.4 * Math.sin(s.tw)) * (0.8 + 0.3 * bk);
    ctx.fillStyle = s.hue ? `hsla(${s.hue},80%,85%,${a})` : `rgba(255,255,255,${a})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
  }
}
