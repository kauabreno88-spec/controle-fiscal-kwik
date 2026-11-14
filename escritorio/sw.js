/* KWIK Mini Escritório — deixa o app abrir sem internet.
   Arquivos do app: rede primeiro (pega atualizações), cache se estiver offline. A API do GitHub nunca passa pelo cache.
   O Three.js (visão diagonal em 3D) vem do jsDelivr numa versão fixa: fica guardado depois da primeira vez. */
const CACHE = 'kwik-mini-v25';
const APP = ['./', './index.html', './manifest.webmanifest', './js/cena.js', './js/festas.js', './js/cena3d.js', './js/boneco.js', './js/efeitos.js', './js/nuvem.js', './js/clara.js', './js/maycon.js', './js/filmes.js', './js/gatinhos.js', './js/jogos.js', './js/marketing.js', './js/enzo.js', './js/relacionamento.js', './js/rotinas.js',
  './js/limpeza.js', './js/refeitorio.js', './js/reuniao.js', './js/meta.js', './js/pesquisa.js', './js/familia.js', './js/execucao.js', './js/financas.js', './js/precificacao.js', './js/obrigacoes.js', './js/setores.js', './js/clientes.js', './js/cidade3d.js', './js/recepcao.js', './js/rh.js', './js/ipog.js', './js/ebook.js', './js/fazenda.js', './js/criar.js', './js/apresentacao.js', './js/inicio.js', './js/tarefas.js', './js/clarapet.js', './js/clientes-dados.js', './js/cofre.js', './js/obsidian.js','./js/biblioteca-dados.js', './js/biblioteca.js', './css/biblioteca.css','./js/clientesapp.js', './js/fiscalfolha.js', './js/agenda.js', './js/painelmeta.js', './js/relplanilha.js', './css/apps.css', './js/copias.js', './js/app.js', './pesquisa.html',
  './assets/kwik-simbolo.svg', './assets/kwik-simbolo.png', './assets/icone-192.png', './assets/icone-512.png', './assets/apple-touch-icon.png',
  './assets/fontes/Montserrat-Medium.ttf', './assets/fontes/Montserrat-Bold.ttf', './assets/fontes/Montserrat-ExtraBold.ttf', './assets/fontes/Montserrat-Black.ttf'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== 'kwik-3d').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'cdn.jsdelivr.net' && (url.pathname.startsWith('/npm/three@') || url.pathname.startsWith('/npm/mp4-muxer@'))) { // versão fixa: cache primeiro
    e.respondWith(caches.open('kwik-3d').then(c => c.match(req).then(r => r || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // sempre confere com o servidor (o GitHub Pages manda guardar por 10 min, o que misturava versões novas e antigas)
  const rede = req.mode === 'navigate' ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req, { cache: 'no-cache' });
  e.respondWith(rede.then(r => {
    if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});

// Notificações (prazos da prancheta, reuniões e respostas da pesquisa), enviadas pela Action "Lembretes".
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (x) { d = { titulo: 'KWIK Escritório', corpo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Clara', {
    body: d.corpo || '', icon: 'assets/icone-192.png', badge: 'assets/icone-192.png', tag: d.tag || 'clara', data: { url: d.url || './' },
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if ('focus' in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
