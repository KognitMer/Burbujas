/* Todos los textos visibles (español rioplatense). Para otro idioma: copiar este archivo y traducirlo. */
export default {
  lang: "es",
  title: "Burbujas",
  hud: { score: "Burbujas", scoreZen: "Soltadas", best: "Récord" },
  breath: { in: "Inhala", out: "Exhala", tip: "Respirá con el círculo: inhalá 4 s · exhalá 6 s" },
  speeds: { suave: "Suave", rapida: "Rápida", turbo: "Turbo" },
  music: { espacio: "Espacio", kalimba: "Kalimba", off: "Sin música" },
  emotions: {
    abrumado: "Abrumado", analisis: "Análisis excesivo", frustrado: "Frustrado", miedo: "Miedo", tilt: "Tilt",
    neutral: "Neutral", flow: "Flow state", inspirado: "Inspirado", tranquilo: "Tranquilo"
  },
  modes: {
    soltar: {
      name: "Soltar",
      intro: "Dejá pasar lo difícil. Atrapá lo que te ayuda.",
      hints: { neg: "Dejá pasar esta emoción", pos: "Ahora atrapá esta: tocala" },
      done: "Eso es todo. Seguí a tu ritmo."
    },
    explotar: {
      name: "Explotar",
      intro: "Explotá lo que te frena. Dejá pasar lo que te ayuda.",
      hints: { neg: "Explotá esta burbuja: tocala", pos: "Esta dejala pasar" },
      done: "Eso es todo. Seguí a tu ritmo."
    },
    zen: {
      name: "Zen",
      intro: "Sin puntos ni apuro. Respirá y mirá pasar las emociones.",
      hints: {},
      zenHint: "Respirá con el círculo. Dejá que las emociones pasen.",
      done: ""
    }
  },
  floats: { letGo: "La dejaste ir" },
  hints: {
    darkIncoming: "Viene una burbuja oscura: tocala para disolverla",
    keyboard: "Con las flechas elegís una burbuja y con Enter la tocás"
  },
  buttons: {
    start: "Empezar", stats: "Estadísticas", statsIcon: "📊", close: "Cerrar",
    pause: "⏸ Pausa", resume: "▶ Seguir", mute: "🔊 Sonido", unmute: "🔇 Silencio",
    breathOn: "🌬", breathOff: "🌬 off", copy: "Copiar CSV", copied: "¡Copiado!", copyFail: "No se pudo copiar",
    reset: "Borrar datos", resetConfirm: "¿Seguro? Tocá de nuevo"
  },
  stats: {
    title: "ESTADÍSTICAS",
    modeLine: (name) => `Modo: ${name} · últimos 7 días (cambiá de modo para ver los otros)`,
    zenLine: "Modo: Zen · últimos 7 días",
    cols: { day: "Día", min: "Min", sessions: "Part.", earned: "Gan.", lost: "Perd.", net: "Neto", ppm: "Pts/min", released: "Soltadas", sessionsLong: "Partidas" },
    today: "Hoy", week: "Semana",
    none: "Todavía no hay datos de este modo. Jugá unas partidas y volvé a mirar.",
    zenNote: "En Zen no hay puntos ni récord: solo se registra el tiempo y las emociones difíciles que dejaste ir.",
    summary: (played, avg, min) => `Días jugados: ${played} · promedio por día jugado: <b>${avg}</b> pts · ${min} min.`,
    counts: (t) => `Explotaste: ${t.popNeg} difíciles · ${t.popPos} positivas · ${t.popNeu} neutrales. Salieron solas: ${t.relNeg} difíciles · ${t.relPos} positivas · ${t.relNeu} neutrales.`
  }
};
