/* Service worker de Burbujas: cache mínimo para que el juego siga andando sin conexión
   después de la primera visita. Subí CACHE_NAME cuando cambien los assets de forma
   importante (fuerza a los clientes viejos a refrescar el cache). */
const CACHE_NAME = "burbujas-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {                    // HTML: red primero, cache como respaldo offline
    e.respondWith(fetch(req).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(                                     // resto: cache al toque, actualiza de fondo
    caches.match(req.url).then(cached => {
      const network = fetch(req).then(res => {
        if (res.ok) {
          const copy = res.clone();                  // clonar YA: después de un await el body ya está consumido
          e.waitUntil(caches.open(CACHE_NAME).then(c => c.put(req.url, copy)));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
