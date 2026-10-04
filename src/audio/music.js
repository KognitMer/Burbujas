/* MÚSICA generativa. Cada estilo "planea" las notas de los próximos segundos con plan(); así el mismo código
   suena en vivo en el juego y se puede renderizar sin conexión (renderMusic) para generar vistas previas.
   La melodía sube al inhalar y baja al exhalar, y el colchón de fondo respira con el círculo. */
import { CONFIG } from "../config.js";
import { state } from "../state.js";
import { breathAt } from "../core/breath.js";
import { audio, makeReverb } from "./context.js";

/* ---- Estilos ----
   Opciones (se elige con el botón 🎵): Espacio · Presente · Sin música.
   Todas se generan en vivo (sin archivos), son infinitas y no se repiten. Cada estilo "planea" las notas
   de los próximos segundos con una función plan(); así el mismo código sirve para sonar en el juego
   y para renderizar vistas previas. El colchón de fondo respira con el círculo. */
export const MUSIC_STYLES = {};
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);             // número MIDI -> Hz
const mulberry = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
// Re mayor: Dmaj9 · Bm9 · Gmaj9 · A6 (cálido, abierto, sin tensión)
const CH = [[50, 54, 57, 61, 64], [47, 50, 54, 57, 61], [55, 59, 62, 66, 69], [57, 61, 64, 66, 69]];
function makeRig(ac) {
  const bus = ac.createGain(); bus.gain.value = 0;
  const revHp = ac.createBiquadFilter(); revHp.type = "highpass"; revHp.frequency.value = 260;
  const rev = makeReverb(3.6, ac), revWet = ac.createGain(); revWet.gain.value = 0.55;
  const revIn = ac.createGain();
  revIn.connect(revHp); revHp.connect(rev); rev.connect(revWet); revWet.connect(bus);
  const swell = ac.createGain(); swell.gain.value = 0.8;
  const swellWet = ac.createGain(); swellWet.gain.value = 0.6;
  swell.connect(bus); swell.connect(swellWet); swellWet.connect(revIn);
  const rig = { ac, bus, revIn, swell };
  rig.send = (node, wet, dry = 1) => {
    if (dry > 0) { if (dry === 1) node.connect(bus); else { const d = ac.createGain(); d.gain.value = dry; node.connect(d); d.connect(bus); } }
    if (wet > 0) { const w = ac.createGain(); w.gain.value = wet; node.connect(w); w.connect(revIn); }
  };
  return rig;
}
function planSwell(rig, t0, t1, off, breathOn) {                // el colchón sube al inhalar y baja al exhalar
  rig.swell.gain.setValueAtTime(breathOn ? 0.55 + 0.45 * breathAt(t0 + off) : 0.8, t0);
  for (let t = t0 + 0.5; t <= t1 + 0.001; t += 0.5) rig.swell.gain.linearRampToValueAtTime(breathOn ? 0.55 + 0.45 * breathAt(t + off) : 0.8, t);
}
function envNote(ac, rig, t, parts, peak, attack, total, wet, pan, lpHz) {
  // parts: [[multiplicador, amplitud, caída(s)]]  -> suma de senos, cada uno con su caída
  const out = ac.createGain(); out.gain.value = 1;
  parts.forEach(([f, a, dec]) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * a), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(total, dec));
    o.connect(g); g.connect(out); o.start(t); o.stop(t + total + 0.05);
  });
  let node = out;
  if (lpHz) { const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = lpHz; out.connect(lp); node = lp; }
  if (ac.createStereoPanner && pan) { const p = ac.createStereoPanner(); p.pan.value = pan; node.connect(p); node = p; }
  rig.send(node, wet);
}
/* Colchón suave y cálido (tríangulos filtrados) que acompaña con el acorde */
function softPad(ac, rig, t, dur, freqs, level) {
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1000; lp.Q.value = 0.3;
  lp.connect(rig.swell);
  freqs.forEach((f, i) => {
    [["triangle", 0], ["sine", 5]].forEach(([type, det]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f; o.detune.value = det + i;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(level, t + 2.6);
      g.gain.setValueAtTime(level, t + dur - 3);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(lp); o.start(t); o.stop(t + dur + 0.1);
    });
  });
}
const inRange = (n, lo, hi) => { while (n < lo) n += 12; while (n > hi) n -= 12; return n; };

/* ===== 1. ESPACIO: voces suaves que respiran y destellos lejanos, sin graves ===== */
function auuVoice(ac, rig, t, dur, f, level) {
  const sum = ac.createGain(); sum.gain.value = 1;
  [[720, 4, 1], [1090, 5, 0.55], [2500, 6, 0.18]].forEach(([fc, q, a]) => {       // formantes: una "aaa" lejana
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = fc; bp.Q.value = q;
    const g = ac.createGain(); g.gain.value = a; bp.connect(g); g.connect(sum);
    [-7, 7].forEach(det => { const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = det; o.connect(bp); o.start(t); o.stop(t + dur + 0.1); });
  });
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3000;
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(level, t + 4.5);
  env.gain.setValueAtTime(level, t + dur - 5);
  env.gain.linearRampToValueAtTime(0.0001, t + dur);
  sum.connect(lp); lp.connect(env); env.connect(rig.swell);
}
MUSIC_STYLES.espacio = {
  name: "Espacio", gain: 1.3,
  init(ac, rig, S) { S.bar = 14; S.chordNext = null; S.starNext = null; },
  plan(ac, rig, t0, t1, S, _off, _breathOn) {
    const R = S.rng, bar = S.bar;
    if (S.chordNext == null) { S.chordNext = t0; S.origin = t0; S.starNext = t0 + 3; }
    while (S.chordNext < t1) {
      const ci = Math.round((S.chordNext - S.origin) / bar) % 4, ch = CH[ci];
      ch.slice(1).forEach((n, i) => auuVoice(ac, rig, S.chordNext + i * 0.7, bar + 6, NOTE(inRange(n, 57, 76)), 0.0105));
      S.chordNext += bar;
    }
    while (S.starNext < t1) {                                      // destellos agudos, lejanos
      const ci = Math.floor(Math.max(0, S.starNext - S.origin) / bar) % 4, ch = CH[ci];
      const n = inRange(ch[1 + Math.floor(R() * (ch.length - 1))], 81, 93);
      envNote(ac, rig, S.starNext, [[NOTE(n), 1, 6], [NOTE(n) * 2.01, 0.12, 3]], 0.16, 0.05, 6.2, 1.1, (R() - 0.5) * 1.4, 6000);
      S.starNext += 3 + R() * 4.5;
    }
  }
};

/* ===== 2. PRESENTE: colchón cálido + una textura tipo "polvo de estrellas", sin melodía ni percusión.
   Pensado para bajar el pulso y favorecer la concentración (sin sonidos de naturaleza: el juego
   transcurre en el espacio, así que la textura de fondo es cósmica, no agua/viento). ===== */
function cosmicTexture(ac, rig, S, level, hz) {
  const len = ac.sampleRate * 4;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
  const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = hz; bp.Q.value = 0.6;
  const g = ac.createGain(); g.gain.value = 0;
  src.connect(bp); bp.connect(g); g.connect(rig.swell);
  src.start();
  S.texGain = g; S.texLevel = level;
}
function planTexture(S, t0, t1) {                                 // vaivén muy lento, para que no sea un zumbido fijo
  for (let t = t0; t <= t1; t += 0.5) {
    const k = S.texLevel * (0.55 + 0.45 * Math.sin(t * (2 * Math.PI / 9)));
    S.texGain.gain.linearRampToValueAtTime(Math.max(0.0001, k), t);
  }
}
MUSIC_STYLES.presente = {
  name: "Presente", gain: 1.0,
  init(ac, rig, S) { S.bar = 16; S.chordNext = null; cosmicTexture(ac, rig, S, 0.015, 1500); },
  plan(ac, rig, t0, t1, S) {
    const bar = S.bar;
    if (S.chordNext == null) { S.chordNext = t0; S.origin = t0; }
    while (S.chordNext < t1) {
      const ci = Math.round((S.chordNext - S.origin) / bar) % 4, ch = CH[ci];
      softPad(ac, rig, S.chordNext, bar + 4, ch.slice(1).map(n => NOTE(inRange(n, 50, 66))), 0.011);
      S.chordNext += bar;
    }
    planTexture(S, t0, t1);
  }
};

let musicStyle = CONFIG.defaultMusic, musicRig = null, musicTimer = 0, musicStarted = false;
function applyMusic() {
  if (!audio.ctx) return;
  if (musicRig) {                                                 // el estilo anterior se apaga con un fundido
    const old = musicRig; old.bus.gain.cancelScheduledValues(audio.ctx.currentTime);
    old.bus.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.5); setTimeout(() => { try { old.bus.disconnect(); } catch (_) {} }, 4000);
    musicRig = null;
  }
  clearInterval(musicTimer);
  const style = MUSIC_STYLES[musicStyle];
  if (!style || CONFIG.musicVolume <= 0) return;
  const rig = makeRig(audio.ctx); rig.bus.connect(audio.outBus);
  const t0 = audio.ctx.currentTime;
  rig.bus.gain.setValueAtTime(0, t0); rig.bus.gain.linearRampToValueAtTime(CONFIG.musicVolume * style.gain, t0 + 5);
  const S = { rng: Math.random }; style.init(audio.ctx, rig, S);
  let sched = t0 + 0.2;
  const tick = () => {
    while (sched < audio.ctx.currentTime + 10) {
      const off = performance.now() / 1000 - audio.ctx.currentTime;
      planSwell(rig, sched, sched + 3, off, state.breathOn);
      style.plan(audio.ctx, rig, sched, sched + 3, S, off, state.breathOn);
      sched += 3;
    }
  };
  tick(); musicTimer = setInterval(tick, 1500); musicRig = rig;
}
export function startMusic() { if (musicStarted) return; musicStarted = true; applyMusic(); }
export const getMusicStyle = () => musicStyle;
export function setMusicStyle(key) { musicStyle = CONFIG.musicStyles.includes(key) ? key : CONFIG.defaultMusic; if (audio.ctx) applyMusic(); return musicStyle; }
/* vista previa sin conexión (para generar ejemplos de audio): devuelve un AudioBuffer */
export async function renderMusic(key, seconds, seed = 7) {
  const ac = new OfflineAudioContext(2, Math.floor(44100 * seconds), 44100), style = MUSIC_STYLES[key];
  const rig = makeRig(ac); rig.bus.connect(ac.destination);
  rig.bus.gain.setValueAtTime(0, 0); rig.bus.gain.linearRampToValueAtTime(CONFIG.musicVolume * style.gain, 5);
  const S = { rng: mulberry(seed) }; style.init(ac, rig, S);
  for (let t = 0; t < seconds; t += 3) { planSwell(rig, t + 0.05, t + 3.05, 0, true); style.plan(ac, rig, t + 0.05, t + 3.05, S, 0, true); }
  return ac.startRendering();
}
