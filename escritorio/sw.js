/* KWIK Mini Escritório — deixa o app abrir sem internet.
   Arquivos do app: rede primeiro (pega atualizações), cache se estiver offline. A API do GitHub nunca passa pelo cache. */
const CACHE = 'kwik-mini-v3';
const APP = ['./', './index.html', './manifest.webmanifest', './js/cena.js', './js/boneco.js', './js/efeitos.js', './js/nuvem.js', './js/app.js',
  './assets/kwik-simbolo.svg', './assets/icone-192.png', './assets/icone-512.png', './assets/apple-touch-icon.png',
  './assets/fontes/Montserrat-Medium.ttf', './assets/fontes/Montserrat-Bold.ttf', './assets/fontes/Montserrat-ExtraBold.ttf', './assets/fontes/Montserrat-Black.ttf'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
