# Burbujas · by Kognit

Juego relajante de burbujas-emoción con respiración guiada (inhalá 4 s · exhalá 6 s), tres modos y música generativa.
Pensado para integrarse como módulo de la app Kognit (ver `docs/INTEGRATION.md`).

## Primeros pasos (VS Code)
1. Instalá Node 20+ y abrí esta carpeta en VS Code (aceptá las extensiones recomendadas).
2. `npm install`
3. `npm run dev` → abre http://localhost:5173
4. Probar en el celular: `npm run dev -- --host` y abrí la URL de red desde el teléfono (misma wifi).

## Comandos
| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm run build` | build en `dist/` |
| `npm test` | tests unitarios (puntajes, storage) |
| `npm run lint` | ESLint |
| `npm run test:e2e` | prueba de humo en navegador (requiere build) |
| `npm run assets` | regenera imágenes desde `assets-src/` (Python + Pillow) |

## Estructura
- `src/config.js` números ajustables · `src/i18n/` textos · `src/core/` reglas puras (puntaje, storage, sesión, respiración)
- `src/game/` entidades, loop, entrada, controles · `src/audio/` efectos y música · `src/ui/` HUD, menú, estadísticas
- `src/platform/bridge.js` comunicación con la app anfitriona
- `docs/` arquitectura, integración, economía, decisiones, roadmap

Para quien trabaje con Codex u otra IA: leer `AGENTS.md` primero.
