/* Controle Fiscal KWIK — deixa o app abrir sem internet.
   Arquivos do próprio app: rede primeiro (pega atualizações), cache se estiver offline.
   Fontes e a biblioteca do Excel: cache primeiro. A API do GitHub nunca passa pelo cache. */
const CACHE = "kwik-fiscal-v1";
const APP = ["./", "./index.html", "./manifest.webmanifest", "./apple-touch-icon.png", "./icone-192.png", "./icone-512.png"];
const EXTERNOS = ["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return r;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match("./index.html"))));
  } else if (EXTERNOS.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(resp => {
      const copia = resp.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return resp;
    })));
  }
});
