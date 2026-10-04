/* ================================================================
   CONFIG · todos los números que se pueden ajustar viven acá.
   Los TEXTOS están en src/i18n/es.js (no acá).
   Regla de oro: no hay números "mágicos" sueltos en el resto del código.
   ================================================================ */
export const CONFIG = {
  // ---- ritmo del juego ----
  depthChance: 0.5,              // proporción de burbujas que surgen "desde lo profundo" (chicas y crecen)
  depthGrowSeconds: 1.8,         // cuánto tardan en llegar a su tamaño real
  minOnScreen: 5,                // nunca menos de estas en pantalla (escala con el tamaño de pantalla)
  startBubbles: 5,               // burbujas ya en pantalla al empezar
  rampSeconds: 150,              // tiempo hasta llegar a la máxima intensidad
  maxBubblesStart: 6,            // tope de burbujas al inicio...
  maxBubblesEnd: 15,             // ...y tope cuando ya subió la dificultad
  spawnStart: [1.6, 2.4],        // segundos entre burbujas al inicio (min, max)
  spawnEnd: [0.45, 0.9],         // segundos entre burbujas a máxima intensidad
  bubbleSize: [78, 128],         // diámetro en px (min, max)
  bubbleSpeed: [19, 44],         // px/seg
  typeSpeed: { neg: 0.8, pos: 1.05, neu: 1 },   // las difíciles se mueven más lento
  releaseFade: 0.9,              // segundos que tarda en disolverse una emoción que se suelta
  speeds: [                      // niveles de velocidad (el nombre visible está en i18n)
    { id: "suave",  mult: 1.9 },
    { id: "rapida", mult: 2.7 },
    { id: "turbo",  mult: 3.7 }
  ],
  // ---- burbuja oscura ----
  darkEvery: [10, 16],           // segundos entre burbujas oscuras
  darkSize: 104,
  darkSpeed: 150,                // cruza despacio y con aviso previo
  darkWarnSeconds: 2.2,          // aviso visual/sonoro antes de que entre
  firstDarkDelay: 28,            // la primera vez (con pistas) la oscura tarda más
  // ---- respiración (relajante, SIN retención) ----
  breath: { inhale: 4, exhale: 6 },
  // ---- entrada táctil ----
  hitPadding: 6,                 // tolerancia extra al tocar (más amable en celular)
  hitPaddingTouch: 8,            // extra cuando el dispositivo es táctil
  // ---- audio ----
  volume: 0.07,                  // volumen de los efectos: muy tenue
  musicVolume: 0.34,             // volumen de la música de fondo (0 = sin música)
  defaultMusic: "espacio",
  musicStyles: ["espacio", "presente", "off"],
  // ---- sesión ----
  minSessionSeconds: 5,          // sesiones más cortas no se reportan
  idleEndSeconds: 90,            // si queda en pausa/oculto tanto tiempo, la sesión se cierra
  // ---- emociones: cada una es negativa (neg), positiva (pos) o neutral (neu) ----
  imageFiles: ["abrumado", "analisis", "flow", "frustrado", "miedo", "inspirado", "tilt", "neutral", "tranquilo"],
  emotions: {
    abrumado:  { type: "neg" },
    analisis:  { type: "neg" },
    frustrado: { type: "neg" },
    miedo:     { type: "neg" },
    tilt:      { type: "neg" },
    neutral:   { type: "neu" },
    flow:      { type: "pos" },
    inspirado: { type: "pos" },
    tranquilo: { type: "pos" }
  },
  /* ---- modos de juego y PUNTAJE ----
     pop    = puntos al EXPLOTAR (tocar) la burbuja
     escape = puntos cuando llega arriba y se va sola ("soltar")
     Este es el único lugar donde viven los valores del puntaje (ver docs/ECONOMY.md). */
  defaultMode: "soltar",
  modes: {
    soltar:   { pop: { neg: -1, pos: 2,  neu: 5 }, escape: { neg: 1, pos: -1, neu: 0 }, dark: true,  record: true },
    explotar: { pop: { neg: 3,  pos: -1, neu: 5 }, escape: { neg: 0, pos: 0,  neu: 0 }, dark: true,  record: true },
    zen:      { pop: { neg: 0,  pos: 0,  neu: 0 }, escape: { neg: 0, pos: 0,  neu: 0 }, dark: false, record: false, zen: true }
  },
  darkHitPenalty: -1             // la burbuja oscura resta esto por cada burbuja que revienta
};
