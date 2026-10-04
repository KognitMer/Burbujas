# Decisiones de diseño (no revertir sin hablar con María)
1. Modo por defecto **Soltar**. Puntajes enteros: ver `config.js`.
2. Zen: sin puntos, sin récord, sin burbuja oscura; solo "Soltadas".
3. Burbuja oscura: anunciada ~2,2 s, lenta, −1 por burbuja disuelta, disolución suave. Primera vez, aparece más tarde (28 s).
4. Respiración 4/6 sin retención.
5. Música generativa propia: Espacio, Kalimba, Sin música. Piano eliminado. 639 Hz no se integra; 159,75 Hz solo como vibración ambiente muy baja.
6. Burbujas: se conserva el estilo original; solo se hacen transparentes los huecos internos (`tools/process_bubbles.py`).
7. Voseo rioplatense en todos los textos.
8. Integración vía iframe/WebView + postMessage (stack de la app desconocido).
9. Navegación por teclado (alternativa al mouse/touch, no lo reemplaza): flechas eligen una burbuja (aro celeste), Enter la toca. Se activa recién al primer uso de las flechas (no se ve si jugás con mouse/touch); pista única la primera vez, vía `tutorial.mark("keyboard")`.
10. Ícono de la PWA (`public/icons/`): la burbuja "Tranquilo" (elegida por María), recortada a 192×192 y 512×512 a partir del asset ya aprobado `public/assets/tranquilo.webp` (sin re-procesar el estilo). Service worker propio sin dependencias (`public/sw.js`); no mp3 ni librerías externas.
