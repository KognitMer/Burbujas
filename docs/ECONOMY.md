# Economía (propuesta, a decidir con Manu/backend)
- El juego produce **puntos de sesión** (`points.net`). La conversión a monedas de Kognit la decide la app, no el juego.
- Propuesta: monedas = floor(net / 20) por sesión, tope diario (p. ej. 30 monedas) para no incentivar jugar compulsivamente. Zen no da monedas (solo registra tiempo y "soltadas").
- **Validación en servidor**: no confiar en `score` del cliente. Recalcular con `pointsFromCounts(mode, counts)` (`src/core/scoring.js`). Como el puntaje no baja de 0, el orden importa: usar `earned` y `lost` brutos como cotas (net ≤ earned − lost no es exacto; net ≤ earned).
- Chequeos básicos: `durationSec` plausible vs. cantidad de burbujas (máx. ~1 por 0,4 s), `sessionId` único (idempotencia).
- Datos del registro local (`stats`) sirven para calibrar cuánto junta una persona por semana antes de fijar la tasa.
