# Integración con la app Kognit
Como no sabemos aún el stack de la app (web, React Native, Flutter…), el juego se integra como **iframe / WebView** y habla por mensajes.

## URL
`https://…/?host=<origen de la app>&mode=soltar|explotar|zen&speed=suave|rapida|turbo&music=espacio|kalimba|off&breath=0|1&muted=0|1`

## Juego → app (`{source:"kognit-burbujas", type, payload}`)
`ready`, `session:start`, `session:end`, `session:discard`, `settings`.
`session:end` payload: `{schema:2, game, version, sessionId, mode, speed, startedAt, endedAt, durationSec, endReason, score, points:{earned,lost,net}, counts:{popNeg,popPos,popNeu,relNeg,relPos,relNeu,darkHits}, meta}`.
`endReason`: `restart | menu | hidden | idle | host | unload`.

## App → juego (`{target:"kognit-burbujas", type, payload}`)
`config {mode,speed,music,breath,muted,meta}`, `pause`, `resume`, `end`, `mute {muted}`.
Solo se aceptan si la URL trae `host` y el mensaje viene de ese origen. En WebView nativo se usa `ReactNativeWebView`.

## API en la página
`window.KognitBurbujas`: `getState()`, `applyConfig()`, `pause()`, `resume()`, `end()`, `on(evento, fn)`, `off`.

## Qué NO hace el juego
No conoce usuarios, no llama a ningún backend, no guarda monedas. `meta` es una referencia opaca que la app puede pasar y recibe de vuelta.
