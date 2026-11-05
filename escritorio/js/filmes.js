/* KWIK Mini Escritório · cenas em grupo, fantasias e paródias de filmes.
   Cada cena recebe os ids dos funcionários livres e usa os movimentos de efeitos.js (KM.mov). */
(function () {
  const KM = window.KM;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const m = () => KM.mov;
  const st = () => KM.fx;
  const esperar = ms => KM.esperar(ms);
  const fala = (p, t, ms) => m().fala(p, t, ms);
  const palco = () => KM.LAYOUT.palco; // pontos no corredor, em volta do centro do prédio
  const centro = () => KM.LAYOUT.centro;
  const nome = p => KM.app.func(p.id).nome.split(' ')[0];

  function olhar(p, alvo) { p.dir = alvo.X >= p.X ? 'fd' : 'fe'; }
  function fumaca(p) {
    const [x, y] = m().pes(p);
    KM.emitir('pixel', 45, i => ({ x: x + rnd(-10, 10), y: y - rnd(0, 42), vx: rnd(-20, 20), vy: rnd(-30, -5), vida: rnd(0.4, 0.8), cor: ['#ffffff', '#dee2e6', '#adb5bd'][i % 3] }));
  }
  function vestir(p, f) { p.fantasia = f; fumaca(p); KM.tocar('magia'); }
  async function aoPalco(ps, pontos = palco()) { await Promise.all(ps.map((p, i) => m().irAte(p, ...pontos[i % pontos.length]))); ps.forEach(p => { p.dir = 'fe'; }); }
  async function deVolta(ps) {
    ps.forEach(p => { if (p.fantasia) fumaca(p); p.fantasia = null; p.prop = null; p.est = {}; p.Z = 0; p.opacidade = undefined; p.visivel = true; });
    KM.estado.extras = [];
    await Promise.all(ps.map(p => KM.voltarSentar(p)));
  }
  const grupo = (nomeCena, fn) => ids => KM.rodar(nomeCena, async (...ps) => {
    try { await fn(ps); } finally { st().escuro = 0; st().piscaLuz = false; st().vermelho = 0; st().espaco = 0; st().disco = 0; await deVolta(ps); }
  }, ids);

  // Correr em círculo ao redor do centro do tapete.
  function correrEmCirculo(ps, ms, raio = 14, vel = 1.6, perseguidor) {
    const [cx, cy] = centro(), ini = performance.now();
    return m().quadroAQuadro((dt, t) => {
      const k = (performance.now() - ini) / 1000;
      ps.forEach((p, i) => {
        const a = k * vel + i * (Math.PI * 2 / ps.length) + (p === perseguidor ? -0.9 : 0);
        const nx = cx + Math.cos(a) * raio * 1.6, ny = cy - 4 + Math.sin(a) * raio * 0.55;
        const dx = nx - p.X, dy = ny - p.Y;
        p.X = nx; p.Y = ny; p.modo = 'em-pe';
        if (Math.abs(dx) + Math.abs(dy) > 0.01) p.dir = (dy < -Math.abs(dx) * 0.6 ? 'c' : 'f') + (dx > 0 ? 'd' : 'e');
        p.est.passo = [1, 0, 2, 0][Math.floor(t * 10 + i) % 4];
      });
      return performance.now() - ini > ms;
    });
  }

  // ------------------------------------------------------------------ 🎉 Festa à fantasia
  const festa = grupo('festa', async ps => {
    await aoPalco(ps);
    KM.onBanner('FESTA À FANTASIA!', 'verde');
    const roupas = ['vampiro', 'pirata', 'astronauta', 'mago', 'heroi', 'zumbi'].sort(() => Math.random() - 0.5);
    for (let i = 0; i < ps.length; i++) {
      vestir(ps[i], roupas[i]);
      fala(ps[i], `Ta-dá! Sou ${KM.FANTASIAS[roupas[i]].replace(/^\S+\s/, '')}!`, 1800);
      await esperar(900);
    }
    KM.tocar('batida');
    const ini = performance.now();
    while (performance.now() - ini < 4800) {
      st().disco = Math.min(1, (performance.now() - ini) / 500);
      const f = Math.floor((performance.now() - ini) / 260);
      ps.forEach((p, i) => {
        p.est = { bracos: ['cima', 'aceno', 'cima', 'baixo'][(f + i) % 4], aceno: (f + i) % 2, boca: 'sorriso', dy: (f + i) % 2, passo: [1, 0, 2, 0][(f + i) % 4] };
        p.dir = ['fe', 'fd', 'cd', 'ce'][Math.floor((performance.now() - ini) / 520 + i) % 4];
      });
      if (Math.random() < 0.35) KM.emitir('estrela', 1, { x: centro()[0] + rnd(-90, 90), y: centro()[1] - rnd(10, 70), vida: 0.5, cor: ['#ff5c8a', '#3fb6ff', '#ffd93b'][Math.floor(Math.random() * 3)] });
      await esperar(60);
    }
    KM.confete(100);
    for (let k = 1; k >= 0; k -= 0.1) { st().disco = k; await esperar(40); }
    ps.forEach(p => { p.dir = 'fe'; p.est = { bracos: 'cima', boca: 'sorriso', olhos: 'feliz' }; });
    await esperar(1200);
  });

  // ------------------------------------------------------------------ 🧛 Noite do terror
  const terror = grupo('terror', async ps => {
    await aoPalco(ps);
    for (let k = 0; k <= 1; k += 0.1) { st().escuro = k; await esperar(60); }
    st().piscaLuz = true;
    KM.tocar('susto');
    const vamp = ps[Math.floor(Math.random() * ps.length)], vitimas = ps.filter(p => p !== vamp);
    vestir(vamp, 'vampiro');
    vitimas.forEach(p => { p.est = { boca: 'grito', bracos: 'cima' }; });
    fala(vamp, 'Bleh bleh! Vim cobrar os impostos atrasados! 🧛', 2400);
    KM.onBanner('NOITE DO TERROR!', 'deus');
    await esperar(1600);
    vitimas.forEach((p, i) => fala(p, i ? 'Socorroooo! 😱' : 'AAAAH! Corre! 😱', 1600));
    vamp.est = { bracos: 'zumbi', boca: 'sorrisao' };
    vitimas.forEach(p => { p.est = { boca: 'grito', bracos: 'cima' }; });
    for (let r = 0; r < 3; r++) { KM.tocar('coracao'); setTimeout(() => KM.tocar('coracao'), 500); await correrEmCirculo(ps, 1400, 15, 2.2, vamp); }
    st().piscaLuz = false;
    for (let k = 1; k >= 0; k -= 0.1) { st().escuro = k; await esperar(50); }
    ps.forEach(p => { p.est = { boca: 'sorriso', olhos: 'feliz' }; p.dir = 'fe'; });
    fala(vamp, 'Brincadeira! Os impostos estão em dia 😂', 2200);
    vitimas.forEach(p => fala(p, 'Hahaha 😂', 1800));
    await esperar(2000);
  });

  // ------------------------------------------------------------------ 🏴‍☠️ Caça ao tesouro
  function bau(X, Y) {
    const o = { X, Y, Z: -14, aberto: false, p: X + Y };
    o.f = ctx => {
      const z = o.Z;
      KM.prisma(ctx, { X: X - 6, Y: Y - 4, Z: z, w: 12, d: 8, h: 7, cor: '#8d5a3b' });
      KM.prisma(ctx, { X: X - 6, Y: Y - 4, Z: z + 7, w: 12, d: 8, h: o.aberto ? 1 : 3, cor: '#a0693f' });
      KM.prisma(ctx, { X: X - 1, Y: Y + 4, Z: z + 4, w: 2, d: 1, h: 3, cor: '#e6c04a' });
      if (o.aberto) { const [x, y] = KM.P(X, Y, z + 8); ctx.fillStyle = '#ffd93b'; ctx.fillRect(Math.round(x) - 5, Math.round(y) - 2, 10, 3); ctx.fillStyle = '#fff3a0'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 2, 2, 1); }
    };
    return o;
  }
  const piratas = grupo('piratas', async ps => {
    await aoPalco(ps);
    ps.forEach(p => vestir(p, 'pirata'));
    KM.onBanner('CAÇA AO TESOURO!', 'verde');
    fala(ps[0], 'Arrr! O mapa diz que o X é aqui! 🗺️', 2200);
    await esperar(1600);
    const [cx, cy] = centro();
    await Promise.all(ps.map((p, i) => m().andarAte(p, cx + [-10, 0, 10][i % 3], cy + [6, -8, 6][i % 3])));
    ps.forEach(p => { p.dir = 'fe'; p.est = { bracos: 'poder' }; });
    for (let i = 0; i < 8; i++) { const [x, y] = KM.P(cx, cy, 0); KM.emitir('pedra', 6, { x, y, dx: 6, vy: -30, dvy: 20, dvx: 30, g: 120, vida: 0.7, chao: y + 4 }); KM.tocar('pulo'); await esperar(200); }
    const b = bau(cx, cy); KM.estado.extras = [b];
    await m().quadroAQuadro(dt => { b.Z = Math.min(0, b.Z + dt * 18); return b.Z >= 0; });
    fala(ps[1] || ps[0], 'Achamos!! 💰', 1600);
    await esperar(600);
    b.aberto = true; KM.tocar('caixa');
    const [x, y] = KM.P(cx, cy, 10);
    KM.emitir('moeda', 40, i => ({ x: x + rnd(-4, 4), y, vx: rnd(-70, 70), vy: rnd(-140, -70), g: 220, vida: rnd(1, 1.6), chao: KM.H - 8 }));
    KM.emitir('texto', 1, { x, y: y - 14, vy: -14, vida: 2, s: 'TESOURO!', cor: '#ffd93b' });
    ps.forEach(p => { p.est = { bracos: 'cima', boca: 'sorriso', olhos: 'feliz' }; });
    for (let n = 0; n < 2; n++) { await Promise.all(ps.map(p => m().pular(p, 10, 380))); }
    fala(ps[0], 'Yo-ho-ho! Tudo declarado no IR, hein! 😄', 2200);
    await esperar(2000);
  });

  // ------------------------------------------------------------------ 🚀 Missão espacial
  const espaco = grupo('espaco', async ps => {
    await aoPalco(ps);
    ps.forEach(p => vestir(p, 'astronauta'));
    for (let k = 0; k <= 1; k += 0.1) { st().espaco = k; await esperar(50); }
    KM.onBanner('MISSÃO ESPACIAL!', 'verde');
    fala(ps[0], 'Houston, temos um balanço patrimonial! 🚀', 2400);
    const ini = performance.now();
    await m().quadroAQuadro(() => {
      const k = (performance.now() - ini) / 1000;
      ps.forEach((p, i) => { p.Z = 10 + Math.sin(k * 1.6 + i * 2) * 7; p.dir = ['fe', 'fd', 'cd', 'ce'][Math.floor(k * 0.8 + i) % 4]; p.est = { bracos: i % 2 ? 'cima' : 'aceno', aceno: Math.floor(k * 3) % 2, boca: 'o' }; });
      return k > 5.5;
    });
    fala(ps[ps.length - 1], 'Gravidade zero é bom demais! 🌌', 1800);
    await m().quadroAQuadro(dt => { let ok = true; ps.forEach(p => { p.Z = Math.max(0, p.Z - dt * 20); if (p.Z > 0) ok = false; }); return ok; });
    for (let k = 1; k >= 0; k -= 0.1) { st().espaco = k; await esperar(50); }
    ps.forEach(p => { p.est = { boca: 'sorriso' }; });
    await esperar(800);
  });

  // ------------------------------------------------------------------ 🧙 Aula de magia
  function sapo(X, Y) {
    return {
      p: X + Y, f: ctx => {
        const [x0, y0] = KM.P(X, Y, 0), x = Math.round(x0), y = Math.round(y0);
        ctx.fillStyle = '#1c1612'; ctx.fillRect(x - 6, y - 8, 12, 8);
        ctx.fillStyle = '#51cf66'; ctx.fillRect(x - 5, y - 7, 10, 6); ctx.fillRect(x - 5, y - 9, 3, 2); ctx.fillRect(x + 2, y - 9, 3, 2);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4, y - 9, 1, 1); ctx.fillRect(x + 3, y - 9, 1, 1);
        ctx.fillStyle = '#2b8a3e'; ctx.fillRect(x - 3, y - 4, 6, 1);
      },
    };
  }
  const magia = grupo('magia', async ps => {
    await aoPalco(ps);
    const mago = ps[0], alvo = ps[1];
    vestir(mago, 'mago'); mago.prop = 'varinha';
    olhar(mago, alvo);
    fala(mago, 'Abracadabra… DARF pago, alegria garantida! 🪄', 2400);
    await esperar(1800);
    KM.tocar('magia');
    const [ax, ay] = m().cabeca(alvo);
    KM.emitir('estrela', 25, { x: ax, y: ay + 10, dx: 10, dy: 14, vy: -10, vida: 0.9, cor: '#e2c6ff' });
    st().flash = 0.5; st().corFlash = '#d0bfff';
    fumaca(alvo); alvo.visivel = false;
    KM.estado.extras = [sapo(alvo.X, alvo.Y)];
    fala(mago, 'Opa… virou sapo 🐸', 1800);
    await esperar(1600);
    for (let i = 0; i < 3; i++) { KM.tocar('pulo'); await esperar(350); }
    fala(mago, 'Desfaz, desfaz! 😅', 1500);
    await esperar(900);
    KM.tocar('teleporte'); KM.estado.extras = []; alvo.visivel = true; fumaca(alvo);
    alvo.est = { boca: 'o' };
    fala(alvo, 'Croac… quer dizer, OI! 😳', 1800);
    await esperar(1700);
    ps.forEach(p => { p.est = { boca: 'sorriso', olhos: 'feliz' }; });
    await esperar(900);
  });

  // ------------------------------------------------------------------ 🙌 Toca aqui
  const tocaAqui = grupo('toca', async ps => {
    const [a, b] = ps;
    const [cx, cy] = centro();
    await Promise.all([m().irAte(a, cx - 7, cy), m().irAte(b, cx + 7, cy)]);
    a.dir = 'fd'; b.dir = 'fe';
    fala(a, `Bora, ${nome(b)}!`, 1400);
    await esperar(800);
    a.est = { bracos: 'aceno', boca: 'sorriso' }; b.est = { bracos: 'aceno', boca: 'sorriso' };
    await esperar(400);
    KM.tocar('clique'); KM.tocar('sucesso');
    const [x, y] = KM.P(cx, cy, 34);
    KM.emitir('estrela', 14, { x, y, dx: 3, dy: 3, dvx: 60, dvy: 60, vida: 0.6, cor: '#ffd93b' });
    st().tremor = 1.5;
    fala(b, 'TOCA AQUI! 🙌', 1600);
    await esperar(1500);
  });

  // ------------------------------------------------------------------ 📸 Foto da equipe
  const foto = grupo('foto', async ps => {
    await aoPalco(ps, palco().map(([x]) => [x, centro()[1] + 2]));
    const fotografo = ps.find(p => p.funcao === 'prospeccao') || ps[0];
    fala(fotografo, 'Todo mundo junto! 📸', 1600);
    ps.forEach(p => { p.dir = 'fe'; p.est = { bracos: p === ps[1] ? 'aceno' : 'baixo', boca: 'sorriso' }; });
    await esperar(1200);
    for (const n of ['3…', '2…', '1…']) { fala(fotografo, n, 700); KM.tocar('bip'); await esperar(750); }
    ps.forEach(p => { p.est = { bracos: 'cima', boca: 'sorriso', olhos: 'feliz' }; });
    await esperar(150);
    st().flash = 0.9; st().corFlash = '#ffffff'; KM.tocar('foto');
    await esperar(120);
    const imagem = retrato();
    const cfg = KM.app.cfg(); cfg.maycon.fotos = Math.min(6, (cfg.maycon.fotos || 0) + 1); KM.app.salvar();
    fala(fotografo, 'Ficou linda! Vai pro mural 🖼️', 2000);
    mostrarFoto(imagem);
    await esperar(1800);
  });
  function retrato() {
    const tela = document.getElementById('tela');
    const [cx, cy] = centro(), w = Math.min(200, KM.W), h = 96;
    const x0 = Math.max(0, Math.min(KM.W - w, cx - w / 2)), y0 = Math.max(0, cy - 70);
    const c = document.createElement('canvas'), esc = 4;
    c.width = w * esc; c.height = h * esc;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(tela, x0, y0, w, h, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }
  function mostrarFoto(url) {
    const d = document.getElementById('dlgFoto');
    d.querySelector('img').src = url;
    const a = d.querySelector('a'); a.href = url; a.download = `Foto da equipe KWIK ${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.png`;
    d.showModal();
  }

  // ------------------------------------------------------------------ 🎬 Obsessão (2025) — paródia
  const obsessao = grupo('obsessao', async ps => {
    const bear = ps.find(p => p.funcao === 'noticias') || ps[0];
    const nikki = ps.find(p => p.funcao === 'checklist' && p !== bear) || ps.find(p => p !== bear);
    const diretor = ps.find(p => p !== bear && p !== nikki);
    await Promise.all([
      m().irAte(bear, centro()[0] - 12, centro()[1] + 4), m().irAte(nikki, centro()[0] + 18, centro()[1] - 4),
      diretor ? m().irAte(diretor, centro()[0] + 44, centro()[1] + 6) : Promise.resolve(),
    ]);
    bear.dir = 'fe'; nikki.dir = 'fe';
    vestir(bear, 'bear'); bear.prop = 'disco';
    if (diretor) { diretor.prop = 'claquete'; diretor.dir = 'fe'; fala(diretor, '"Obsessão", cena 1… AÇÃO! 🎬', 2000); KM.tocar('clique'); }
    KM.onBanner('🎬 OBSESSÃO (paródia)', 'deus');
    await esperar(2200);
    // loja de discos
    fala(bear, 'Mais um dia na loja de discos… 🎶', 2200);
    await esperar(2000);
    olhar(nikki, bear); fala(nikki, `Oi, ${nome(bear)}! Bom dia! 👋`, 1800);
    nikki.est = { bracos: 'aceno', boca: 'sorriso' };
    await esperar(1700);
    nikki.est = {}; olhar(bear, nikki);
    fala(bear, 'Ela nunca vai gostar de mim… 😔', 2200);
    await esperar(2200);
    // o objeto dos desejos
    bear.prop = 'desejo'; bear.dir = 'fe';
    for (let k = 0; k <= 0.5; k += 0.05) { st().escuro = k; await esperar(40); }
    const brilho = setInterval(() => { const [x, y] = m().cabeca(bear); KM.emitir('aura', 3, { x: x + 10, y: y - 6, dx: 3, dy: 3, vy: -20, vida: 0.4, cor: '#b07cff' }); }, 90);
    fala(bear, 'Um objeto que realiza desejos?! ✨', 2000);
    await esperar(2000);
    fala(bear, 'Eu desejo que a Nikki goste de mim…', 2400);
    await esperar(2200);
    KM.tocar('magia'); st().flash = 0.7; st().corFlash = '#b07cff';
    clearInterval(brilho);
    // a obsessão
    vestir(nikki, 'nikki'); olhar(nikki, bear);
    nikki.est = {};
    st().vermelho = 0.6; st().piscaLuz = true;
    const batida = setInterval(() => KM.tocar('coracao'), 900);
    const [nx, ny] = m().cabeca(nikki);
    KM.emitir('texto', 3, i => ({ x: nx + (i - 1) * 8, y: ny - 4, vy: -12, vida: 1.6, s: '<3', cor: '#ff5c8a' }));
    fala(nikki, 'Eu te amo, Bear. Pra sempre. 🙂', 2600);
    await esperar(2600);
    bear.est = { boca: 'o' }; fala(bear, 'Ééé… tudo bem, Nikki? 😅', 1800);
    await esperar(1500);
    // ela segue ele (sem tirar o sorriso)
    const fugir = m().andarAte(bear, centro()[0] - 48, centro()[1] + 6, 30);
    await esperar(300);
    await m().andarAte(nikki, centro()[0] - 32, centro()[1] + 2, 26);
    await fugir;
    olhar(nikki, bear); bear.dir = 'fd';
    fala(nikki, 'Aonde você vai? 🙂🙂🙂', 2000);
    await esperar(1800);
    // quebrar o objeto
    bear.dir = 'fe'; bear.prop = 'desejo';
    fala(bear, 'Preciso desfazer esse desejo! 😱', 1800);
    await esperar(1300);
    bear.prop = null; st().tremor = 3; KM.tocar('explosao');
    const [bx, by] = m().cabeca(bear);
    KM.emitir('pixel', 40, i => ({ x: bx + 10, y: by, vx: rnd(-60, 60), vy: rnd(-80, -10), g: 160, vida: 0.8, cor: ['#b07cff', '#6b4a2a', '#e2c6ff'][i % 3] }));
    for (let k = 0.5; k <= 1; k += 0.1) { st().escuro = k; await esperar(60); }
    nikki.visivel = false;
    await esperar(900);
    // susto: ela aparece colada nele
    nikki.X = bear.X - 6; nikki.Y = bear.Y - 2; nikki.visivel = true; olhar(nikki, bear);
    st().escuro = 0.35; st().vermelho = 1; st().tremor = 5; KM.tocar('susto');
    KM.onBanner('BUUU!', 'deus');
    bear.est = { boca: 'grito', bracos: 'cima' };
    fala(nikki, 'Pra sempre 🙂', 1500);
    await esperar(1700);
    clearInterval(batida);
    // corta!
    st().piscaLuz = false; st().vermelho = 0;
    for (let k = 0.35; k >= 0; k -= 0.05) { st().escuro = k; await esperar(40); }
    if (diretor) { fala(diretor, 'CORTA! 🎬 Ficou perfeito!', 2000); KM.tocar('clique'); }
    nikki.fantasia = null; fumaca(nikki);
    await esperar(600);
    ps.forEach(p => { p.dir = 'fe'; p.prop = p === diretor ? 'claquete' : null; p.est = { bracos: 'cima', boca: 'sorriso', olhos: 'feliz' }; });
    fala(nikki, 'Era só atuação, viu? 😂', 1800);
    KM.confete(90);
    await esperar(2200);
  });

  KM.filmes = { festa, terror, piratas, espaco, magia, toca: tocaAqui, foto, obsessao };
})();
