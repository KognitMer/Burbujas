/* Motor de audio: inicialización, silencio y efectos de sonido (cada tipo de burbuja suena distinto). */
import { CONFIG } from "../config.js";
import { state } from "../state.js";
import { audio, noiseBuffer, makeReverb } from "./context.js";
import { startMusic } from "./music.js";

export function initAudio() {
  if (audio.ctx) { if (audio.ctx.state === "suspended") audio.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audio.ctx = new AC();
  audio.outBus = audio.ctx.createGain();                 // salida final: aquí se aplica el silencio
  audio.outBus.gain.value = state.muted ? 0 : 1;
  audio.outBus.connect(audio.ctx.destination);
  audio.master = audio.ctx.createGain();
  audio.master.gain.value = CONFIG.volume;
  const lp = audio.ctx.createBiquadFilter();       // suaviza todo para que se sienta "acuoso"
  lp.type = "lowpass"; lp.frequency.value = 3800;
  audio.master.connect(lp); lp.connect(audio.outBus);
  // reverb larga y sin graves para los efectos (es lo que hace que soltar una emoción "se disuelva en el espacio")
  audio.sfxIn = audio.ctx.createGain(); audio.sfxIn.gain.value = CONFIG.volume;
  const sfxHp = audio.ctx.createBiquadFilter(); sfxHp.type = "highpass"; sfxHp.frequency.value = 300;
  const sfxRev = makeReverb(3.4), sfxOut = audio.ctx.createGain(); sfxOut.gain.value = 0.9;
  audio.sfxIn.connect(sfxHp); sfxHp.connect(sfxRev); sfxRev.connect(sfxOut); sfxOut.connect(audio.outBus);
  startMusic();
}

/* Cada tipo de burbuja suena distinto:
   pos = cristalino · neg = un soplido que se aleja · neu = campanita cálida · dark = disolverse suave.
   sfxSend manda una parte del sonido a la reverb de efectos (aire, sin graves). */
function sfxSend(node, wet, dry = 1) {
  if (dry > 0) { if (dry === 1) node.connect(audio.master); else { const d = audio.ctx.createGain(); d.gain.value = dry; node.connect(d); d.connect(audio.master); } }
  if (wet > 0 && audio.sfxIn) { const w = audio.ctx.createGain(); w.gain.value = wet; node.connect(w); w.connect(audio.sfxIn); }
}
function tone(f, t, attack, decay, amp, wet, dry = 1) {
  const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
  o.type = "sine"; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(amp, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  o.connect(g); sfxSend(g, wet, dry);
  o.start(t); o.stop(t + decay + 0.05);
}
export function playPop(kind) {
  if (!audio.ctx || state.muted) return;
  const t = audio.ctx.currentTime;
  if (kind === "pos") {                              // cristalino: parciales de vidrio, ataque limpio, eco brillante
    const f = [1046.5, 1318.5, 1568, 1975.5][Math.floor(Math.random() * 4)] * (0.99 + Math.random() * 0.02);
    [[1, 0.6], [2.76, 0.21], [5.4, 0.09]].forEach(([m, a]) => tone(f * m, t, 0.004, 0.55 / Math.sqrt(m), a, 0.35));
    tone(f * 1.5, t + 0.09, 0.004, 0.5, 0.3, 0.5);
  } else if (kind === "neg") {                       // soplido que se aleja: aire que se cierra y se va
    const n = audio.ctx.createBufferSource(); n.buffer = noiseBuffer(1);
    const bp = audio.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(1700, t); bp.frequency.exponentialRampToValueAtTime(360, t + 0.85);
    const lp = audio.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(700, t + 0.85);
    const g = audio.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55, t + 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    const pan = audio.ctx.createStereoPanner ? audio.ctx.createStereoPanner() : null;
    n.connect(bp); bp.connect(lp); lp.connect(g);
    if (pan) { const side = Math.random() < 0.5 ? -1 : 1; pan.pan.setValueAtTime(side * 0.2, t); pan.pan.linearRampToValueAtTime(side * 0.85, t + 0.9); g.connect(pan); sfxSend(pan, 0.3); } else sfxSend(g, 0.3);
    n.start(t); n.stop(t + 1);
  } else if (kind === "neu") {                       // campanita cálida, sobre la base de 639 Hz
    tone(639, t, 0.01, 1.1, 0.55, 0.4); tone(1278, t, 0.01, 0.7, 0.16, 0.4); tone(958.5, t + 0.07, 0.01, 0.9, 0.25, 0.4);
  } else {                                           // dark: se disuelve, grave suave
    const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(120, t + 0.3);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); sfxSend(g, 0.25); o.start(t); o.stop(t + 0.4);
    const n = audio.ctx.createBufferSource(); n.buffer = noiseBuffer(0.4);
    const lp = audio.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700;
    const ng = audio.ctx.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.18, t + 0.04); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    n.connect(lp); lp.connect(ng); sfxSend(ng, 0.2); n.start(t);
  }
}
/* Sonido muy suave cuando aparece la burbuja oscura (aviso sutil) */
export function playWarn() {
  if (!audio.ctx || state.muted) return;
  const t = audio.ctx.currentTime;
  const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(240, t);
  o.frequency.exponentialRampToValueAtTime(180, t + 0.7);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.22, t + 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  o.connect(g); g.connect(audio.master);
  o.start(t); o.stop(t + 0.8);
}
/* Al soltar una emoción: unas notas muy suaves y un soplo de aire que casi no se oyen "secos":
   van a la reverb y se disuelven en el espacio. */
export function playRelease() {
  if (!audio.ctx || state.muted) return;
  const t = audio.ctx.currentTime;
  [[639, 0], [958.5, 0.13], [1278, 0.28]].forEach(([f, d], i) => tone(f, t + d, 0.14, 2.3, 0.26 - i * 0.05, 1.3, 0.25));
  const n = audio.ctx.createBufferSource(); n.buffer = noiseBuffer(2);
  const bp = audio.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(2400, t); bp.frequency.exponentialRampToValueAtTime(650, t + 1.8);
  const g = audio.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
  n.connect(bp); bp.connect(g); sfxSend(g, 1.2, 0);
  n.start(t); n.stop(t + 2);
}

export function setMuted(m) {
  state.muted = m;
  if (audio.outBus) audio.outBus.gain.value = m ? 0 : 1;
}
