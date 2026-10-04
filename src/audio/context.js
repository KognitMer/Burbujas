/* Contexto de audio compartido + utilidades (reverb, ruido). */
export const audio = { ctx: null, master: null, outBus: null, sfxIn: null };

export function noiseBuffer(dur, ac = audio.ctx) {
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** Reverb por convolución con ruido que decae (no necesita archivos de respuesta al impulso). */
export function makeReverb(seconds, ac = audio.ctx) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  const conv = ac.createConvolver();
  conv.buffer = buf;
  return conv;
}
