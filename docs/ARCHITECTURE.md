# Arquitectura
```
main.js ─ une módulos
 ├─ core/   storage (versionado) · scoring (puro) · metrics (registro diario + sesión) · breath
 ├─ game/   loop · entities · tutorial · input · controls (inicia/termina sesión) · background
 ├─ audio/  context · engine (SFX) · music (generativa, renderizable offline)
 ├─ ui/     hud · menu · stats  (solo escuchan eventos)
 └─ platform/bridge.js  postMessage / ReactNativeWebView / window.KognitBurbujas
```
Los módulos se comunican por un bus de eventos (`src/events.js`): `score`, `settings`, `pause`, `screen`, `hint:show|hide`, `dark:warn`, `session:start|end|discard`.
El estado compartido vive en `src/state.js`. Los números en `config.js`, los textos en `i18n/`.
Versionado de datos: `SCHEMA` en `core/storage.js`; `migrate()` trae datos de versiones anteriores.
