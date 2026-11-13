// Service worker da versão web (link): funciona offline e trata o clique nas notificações.
// No APK Android ele não é usado — lá as notificações são nativas.
// Atenção: o site é compartilhado com outros apps KWIK (mesmo endereço), então este arquivo
// só mexe nos caches que começam com "rotina-kwik-".
const PREFIX = 'rotina-kwik-';
const CACHE = `${PREFIX}v2`;
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/store.js', 'js/catalog.js', 'js/notify.js', 'js/icons.js', 'js/sync.js',
  'fonts/montserrat-latin.woff2', 'fonts/montserrat-latin-ext.woff2',
  'img/icon-192.png', 'img/icon-512.png', 'img/badge-96.png', 'img/logo-kwik.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Rede primeiro (sempre confere se há versão nova), cache como reserva offline.
// A API do GitHub (sincronização) nunca passa por aqui: é outro endereço.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scope.pathname)) return;
  event.respondWith(
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))),
  );
});

self.addEventListener('notificationclick', (event) => {
  const { taskId, date } = event.notification.data || {};
  const concluir = event.action === 'concluir' && taskId;
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const mine = all.filter((c) => c.url.startsWith(self.registration.scope));
    if (mine.length) {
      const client = mine[0];
      if (concluir) client.postMessage({ type: 'concluir', taskId, date });
      return client.focus();
    }
    const url = concluir ? `./?concluir=${encodeURIComponent(taskId)}&data=${encodeURIComponent(date)}` : './';
    return self.clients.openWindow(url);
  })());
});
