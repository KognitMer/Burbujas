# Reglas para agentes y colaboradores
Antes de tocar nada: leer `docs/DECISIONS.md`.

## No cambiar sin pedido explícito de María
- Tabla de puntajes (`src/config.js` → `modes`) y su test (`tests/scoring.test.js`).
- Respiración: inhala 4 s / exhala 6 s, **sin retención**.
- Estilo visual de las burbujas (aro iridiscente, nubes, destellos). Los PNG/WebP se generan con `tools/`; no re-estilizar.
- No integrar mp3 externos (p. ej. 639 Hz). La música es sintetizada (`src/audio/music.js`). Estilos: Espacio, Kalimba, Sin música.
- Tono: español rioplatense (voseo), amable, sin castigo ni presión. Los textos viven en `src/i18n/es.js`.

## Reglas de código
- Sin números mágicos: van a `config.js`. Sin textos sueltos: van a i18n.
- La lógica de puntaje es pura (`core/scoring.js`) y tiene tests. Si cambia, cambian los tests y `docs/ECONOMY.md`.
- El juego no conoce usuarios ni backend: solo emite eventos (`session:end`) por el bridge.
- Antes de entregar: `npm run lint && npm test && npm run build && node tests/e2e/smoke.mjs`.
