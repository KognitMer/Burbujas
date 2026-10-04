/* Todos los textos visibles, en inglés (mismo tono que es.js: amable, sin castigo ni presión). */
export default {
  lang: "en",
  title: "Bubbles",
  hud: { score: "Bubbles", scoreZen: "Released", best: "Best" },
  breath: { in: "Breathe in", out: "Breathe out", tip: "Breathe with the circle: in for 4 s · out for 6 s" },
  speeds: { suave: "Gentle", rapida: "Fast", turbo: "Turbo" },
  music: { espacio: "Space", kalimba: "Kalimba", off: "No music" },
  emotions: {
    abrumado: "Overwhelmed", analisis: "Overthinking", frustrado: "Frustrated", miedo: "Fear", tilt: "Tilt",
    neutral: "Neutral", flow: "Flow state", inspirado: "Inspired", tranquilo: "Calm"
  },
  modes: {
    soltar: {
      name: "Release",
      intro: "Let the hard ones pass. Catch the ones that help.",
      hints: { neg: "Let this feeling pass", pos: "Now catch this one: tap it" },
      done: "That's it. Keep going at your own pace."
    },
    explotar: {
      name: "Pop",
      intro: "Pop what holds you back. Let what helps you pass.",
      hints: { neg: "Pop this bubble: tap it", pos: "Let this one pass" },
      done: "That's it. Keep going at your own pace."
    },
    zen: {
      name: "Zen",
      intro: "No points, no rush. Breathe and watch the feelings go by.",
      hints: {},
      zenHint: "Breathe with the circle. Let the feelings pass.",
      done: ""
    }
  },
  floats: { letGo: "You let it go" },
  hints: {
    darkIncoming: "A dark bubble is coming: tap it to dissolve it",
    keyboard: "Use the arrow keys to pick a bubble and Enter to tap it"
  },
  buttons: {
    start: "Start", stats: "Stats", statsIcon: "📊", close: "Close",
    pause: "⏸ Pause", resume: "▶ Resume", mute: "🔊 Sound", unmute: "🔇 Muted",
    breathOn: "🌬", breathOff: "🌬 off", copy: "Copy CSV", copied: "Copied!", copyFail: "Couldn't copy",
    reset: "Clear data", resetConfirm: "Sure? Tap again"
  },
  stats: {
    title: "STATS",
    modeLine: (name) => `Mode: ${name} · last 7 days (switch modes to see the others)`,
    zenLine: "Mode: Zen · last 7 days",
    cols: { day: "Day", min: "Min", sessions: "Sess.", earned: "Earned", lost: "Lost", net: "Net", ppm: "Pts/min", released: "Released", sessionsLong: "Sessions" },
    today: "Today", week: "Week",
    none: "No data for this mode yet. Play a few rounds and check back.",
    zenNote: "Zen has no points or best score: it only tracks time and the hard feelings you let go of.",
    summary: (played, avg, min) => `Days played: ${played} · average per day played: <b>${avg}</b> pts · ${min} min.`,
    counts: (t) => `You popped: ${t.popNeg} hard ones · ${t.popPos} positive · ${t.popNeu} neutral. Passed on their own: ${t.relNeg} hard ones · ${t.relPos} positive · ${t.relNeu} neutral.`
  }
};
