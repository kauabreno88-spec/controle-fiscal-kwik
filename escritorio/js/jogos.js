/* KWIK Mini Escritório · Sala de Jogos + mini jogo "Gatinhos em Ordem".
   A sala usa a mesma projeção isométrica do escritório. Quem está livre aparece jogando.
   Gatinhos em Ordem: puzzle de lógica — deslize os gatinhos entre as caixas até cada caixa
   ter uma cor só. As fases são geradas (sempre com solução) e ficam salvas. */
(function () {
  const KM = window.KM;
  const $ = s => document.querySelector(s);
  const A = () => KM.app;
  const P = (...a) => KM.P(...a);
  const SALA = 108, PAREDE = 78;

  // ------------------------------------------------------------------ cena da sala de jogos
  const LUGARES = { // onde cada função aparece brincando
    noticias: { X: 24, Y: 64, dir: 'fd', prop: 'taco' },
    checklist: { X: 70, Y: 66, dir: 'fe', prop: 'cartas' },
    prospeccao: { X: 92, Y: 82, dir: 'fe', prop: 'cartas' },
  };
  let hotspots = [];
  function caixaTela(X, Y, w, d, h) {
    const pts = [[X, Y, 0], [X + w, Y, 0], [X, Y + d, 0], [X + w, Y + d, 0], [X, Y, h], [X + w, Y, h], [X, Y + d, h], [X + w, Y + d, h]].map(q => P(...q));
    return [Math.min(...pts.map(q => q[0])), Math.min(...pts.map(q => q[1])), Math.max(...pts.map(q => q[0])), Math.max(...pts.map(q => q[1]))];
  }

  function texChao() {
    return KM.tex('chaoJogos', SALA, SALA, (g, w, h) => {
      for (let v = 0; v < h; v += 12) for (let u = 0; u < w; u += 12) { g.fillStyle = ((u + v) / 12) % 2 ? '#33285a' : '#3b2f66'; g.fillRect(u, v, 12, 12); }
      g.fillStyle = 'rgba(255,79,216,0.18)'; for (let i = 0; i < w; i += 24) g.fillRect(i, 0, 1, h);
    });
  }
  function texParede(lado) {
    return KM.tex('paredeJogos' + lado, SALA, PAREDE, (g, w, h) => {
      g.fillStyle = lado === 'E' ? '#2a2140' : '#241c38'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.04)'; for (let u = 0; u < w; u += 9) g.fillRect(u, 0, 1, h);
      g.fillStyle = '#ff4fd8'; g.fillRect(0, h - 5, w, 1); g.fillStyle = '#3fb6ff'; g.fillRect(0, h - 3, w, 1);
      g.fillStyle = '#16102a'; g.fillRect(0, h - 2, w, 2);
      if (lado === 'E') { // alvo de dardos e pôster dos gatinhos
        const cx = 84, cy = 26;
        for (let r = 8; r > 0; r -= 2) { g.fillStyle = r % 4 ? '#e03131' : '#f8f9fa'; g.fillRect(cx - r, cy - r, r * 2, r * 2); }
        g.fillStyle = '#2f9e44'; g.fillRect(cx - 1, cy - 1, 2, 2); g.fillStyle = '#ffd43b'; g.fillRect(cx + 3, cy - 4, 1, 3);
        g.fillStyle = '#1c1612'; g.fillRect(56, 14, 18, 24); g.fillStyle = '#ffe3f1'; g.fillRect(57, 15, 16, 22);
        desenharGato(g, 58, 17, CORES[0], 0, true, 0.8); desenharGato(g, 63, 25, CORES[2], 2, true, 0.8);
        KM.texto(g, 'MIAU', 57, 31, '#b0257a');
      }
    });
  }
  function letreiro(t) {
    const c = KM.tela(40, 12), g = c.getContext('2d');
    g.fillStyle = '#16102a'; g.fillRect(0, 0, 40, 12);
    const on = Math.floor(t * 3) % 7 !== 0;
    KM.texto(g, 'KWIK', 2, 3, on ? '#ff4fd8' : '#7a2a6a');
    KM.texto(g, 'PLAY', 21, 3, on ? '#3fb6ff' : '#1d4f6e');
    return c;
  }
  function telaFliper(t) {
    const c = KM.tela(10, 8), g = c.getContext('2d');
    g.fillStyle = '#0b1020'; g.fillRect(0, 0, 10, 8);
    const f = Math.floor(t * 2) % 4;
    for (let i = 0; i < 3; i++) { g.fillStyle = CORES[(i + f) % 4]; g.fillRect(1 + i * 3, 2 + ((i + f) % 2), 2, 2); }
    g.fillStyle = '#ffffff'; g.fillRect(1, 6, 8, 1);
    return c;
  }

  function sinuca(ctx, t) {
    const X = 30, Y = 50, w = 30, d = 20;
    for (const [x, y] of [[X + 1, Y + 1], [X + w - 3, Y + 1], [X + 1, Y + d - 3], [X + w - 3, Y + d - 3]]) KM.prisma(ctx, { X: x, Y: y, w: 2, d: 2, h: 10, cor: '#4a2a14' });
    KM.prisma(ctx, { X, Y, Z: 10, w, d, h: 4, cor: '#6b3f22' });
    const feltro = KM.tex('feltro', w - 4, d - 4, (g, ww, hh) => {
      g.fillStyle = '#2f9e44'; g.fillRect(0, 0, ww, hh);
      g.fillStyle = '#111'; for (const [x, y] of [[0, 0], [ww - 2, 0], [0, hh - 2], [ww - 2, hh - 2], [ww / 2 - 1, 0], [ww / 2 - 1, hh - 2]]) g.fillRect(x, y, 2, 2);
      const bolas = [['#ffffff', 6, 8], ['#ffd43b', 16, 5], ['#e03131', 18, 7], ['#1971c2', 17, 10], ['#7048e8', 20, 6], ['#111111', 19, 9], ['#f76707', 21, 8]];
      for (const [c, x, y] of bolas) { g.fillStyle = c; g.fillRect(x, y, 2, 2); }
    });
    KM.face(ctx, feltro, KM.MAT.chao, ...P(X + 2, Y + 2, 14));
    hotspots.push({ nome: 'sinuca', box: caixaTela(X, Y, w, d, 14) });
  }
  function mesaCartas(ctx, t) {
    const X = 64, Y = 70, w = 20, d = 18;
    KM.prisma(ctx, { X: X + 9, Y: Y + 8, w: 3, d: 3, h: 11, cor: '#3a2a1e' });
    KM.prisma(ctx, { X, Y, Z: 11, w, d, h: 2, cor: '#1864ab' });
    const cartas = KM.tex('cartasMesa', w - 2, d - 2, g => {
      const cs = ['#e03131', '#f59f00', '#2f9e44', '#1971c2', '#111111'];
      [[2, 3], [6, 2], [9, 6], [12, 3], [5, 9], [10, 11], [14, 8]].forEach(([x, y], i) => { g.fillStyle = '#ffffff'; g.fillRect(x, y, 3, 4); g.fillStyle = cs[i % cs.length]; g.fillRect(x + 1, y + 1, 1, 2); });
      g.fillStyle = '#e03131'; g.fillRect(8, 7, 3, 3); g.fillStyle = '#ffd43b'; g.fillRect(9, 8, 1, 1);
    });
    KM.face(ctx, cartas, KM.MAT.chao, ...P(X + 1, Y + 1, 13));
    hotspots.push({ nome: 'cartas', box: caixaTela(X, Y, w, d, 13) });
  }
  function fliperama(ctx, t) {
    const X = 88, Y = 4, w = 12, d = 12;
    KM.prisma(ctx, { X, Y, w, d, h: 40, cor: '#7048e8', corEsq: '#5f3dc4', corDir: '#4c2fa3' });
    KM.face(ctx, telaFliper(t), KM.MAT.paredeD, ...P(X + 1, Y + d, 34));
    KM.prisma(ctx, { X: X + 1, Y: Y + d, Z: 20, w: w - 2, d: 3, h: 2, cor: '#212529' });
    const [bx, by] = P(X + 4, Y + d + 1, 22); ctx.fillStyle = '#e03131'; ctx.fillRect(Math.round(bx), Math.round(by) - 1, 2, 1); ctx.fillStyle = '#ffd43b'; ctx.fillRect(Math.round(bx) + 3, Math.round(by), 2, 1);
    const [lx, ly] = P(X + 6, Y + d, 44); ctx.fillStyle = Math.floor(t * 4) % 2 ? '#ff4fd8' : '#3fb6ff'; ctx.fillRect(Math.round(lx) - 5, Math.round(ly) - 2, 10, 2);
    hotspots.push({ nome: 'fliperama', box: caixaTela(X, Y, w, d + 3, 44) });
  }
  function sofa(ctx) {
    KM.prisma(ctx, { X: 4, Y: 66, w: 12, d: 30, h: 8, cor: '#c92a2a' });
    KM.prisma(ctx, { X: 2, Y: 66, w: 3, d: 30, Z: 0, h: 16, cor: '#a61e1e' });
    KM.prisma(ctx, { X: 4, Y: 64, w: 12, d: 3, h: 12, cor: '#a61e1e' });
    KM.prisma(ctx, { X: 4, Y: 95, w: 12, d: 3, h: 12, cor: '#a61e1e' });
  }
  function geladeira(ctx) {
    KM.prisma(ctx, { X: 4, Y: 4, w: 12, d: 12, h: 24, cor: '#f1f3f5' });
    const [x, y] = P(14, 16, 18); ctx.fillStyle = '#adb5bd'; ctx.fillRect(Math.round(x) - 6, Math.round(y), 1, 5);
    const s = KM.tex('adesivoG', 5, 5, g => { g.fillStyle = '#28BE52'; g.fillRect(0, 0, 5, 5); g.fillStyle = '#fff'; g.fillRect(1, 1, 1, 3); g.fillRect(2, 2, 2, 1); });
    KM.face(ctx, s, KM.MAT.paredeD, ...P(8, 16, 20));
  }
  function jukebox(ctx, t) {
    KM.prisma(ctx, { X: 46, Y: 2, w: 12, d: 8, h: 28, cor: '#862e9c' });
    const [x, y] = P(46, 10, 26);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#ff4fd8', '#ffd43b', '#3fb6ff', '#69db7c', '#ff922b'][(i + Math.floor(t * 5)) % 5]; ctx.fillRect(Math.round(x) + 2 + i * 2, Math.round(y) + 4 + i, 1, 4); }
    if (Math.random() < 0.04) KM.emitir('estrela', 1, { x: x + 8, y: y - 4, vy: -14, vx: 4, vida: 1, cor: '#ffd43b' });
  }

  function desenharSala(ctx, cfg, estado, t) {
    hotspots = [];
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, KM.W, KM.H);
    KM.prisma(ctx, { X: 0, Y: 0, Z: -6, w: SALA, d: SALA, h: 6, topo: texChao(), corEsq: '#241c3f', corDir: '#1a1430' });
    const capa = '#16102a';
    KM.prisma(ctx, { X: -4, Y: -4, w: 4, d: 4, Z: -6, h: PAREDE + 6, cor: capa, semEsq: true, semDir: true, corTopo: capa });
    KM.prisma(ctx, { X: -4, Y: 0, Z: -6, w: 4, d: SALA, h: PAREDE + 6, corTopo: capa, corEsq: '#1c1530', semDir: true });
    KM.face(ctx, texParede('E'), KM.MAT.paredeE, ...P(0, SALA, PAREDE));
    KM.prisma(ctx, { X: 0, Y: -4, Z: -6, w: SALA, d: 4, h: PAREDE + 6, corTopo: capa, corDir: '#1c1530', semEsq: true });
    KM.face(ctx, texParede('D'), KM.MAT.paredeD, ...P(0, 0, PAREDE));
    KM.face(ctx, letreiro(t), KM.MAT.paredeD, ...P(14, 0, PAREDE - 10));
    // porta de volta ao escritório (mesmo lugar da parede esquerda)
    const pt = KM.LAYOUT.porta;
    const porta = KM.tex('portaVolta', 16, pt.alto, (g, w, h) => {
      g.fillStyle = '#1c1612'; g.fillRect(0, 0, w, h); g.fillStyle = '#7b5a3a'; g.fillRect(1, 1, w - 2, h - 1);
      g.fillStyle = '#f1f5f0'; g.fillRect(3, 4, w - 6, 9); KM.texto(g, 'KWIK', 4, 6, '#2E8B45');
      g.fillStyle = '#e6c04a'; g.fillRect(w - 4, 24, 2, 2);
    });
    KM.face(ctx, porta, KM.MAT.paredeE, ...P(0, pt.Y1, pt.alto));
    const [dx0] = P(0, pt.Y1, 0), [dx1] = P(0, pt.Y0, 0), [, dyTop] = P(0, pt.Y1, pt.alto), [, dyBase] = P(0, pt.Y0, 0);
    hotspots.push({ nome: 'porta', box: [dx0, dyTop, dx1, dyBase] });

    const lista = [
      { p: 10, f: c => geladeira(c) }, { p: 52, f: c => jukebox(c, t) }, { p: 98, f: c => fliperama(c, t) },
      { p: 80, f: c => sofa(c) }, { p: 100, f: c => sinuca(c, t) }, { p: 143, f: c => mesaCartas(c, t) },
    ];
    // quem está livre vem brincar
    for (const p of Object.values(estado.pessoas || {})) {
      const L = LUGARES[p.funcao];
      if (!L) continue;
      if (p.trabalhando || p.acao) { p.cabecaJogo = null; continue; }
      const fake = { id: p.id, funcao: p.funcao, modo: 'em-pe', X: L.X, Y: L.Y, Z: 0, dir: L.dir, prop: L.prop, est: Object.assign({}, p.est, { passo: 0 }), selecionado: p.selecionado };
      if (L.prop === 'taco') fake.est.dy = Math.floor(t * 1.5) % 2;
      lista.push({ p: L.X + L.Y + 0.5, f: c => { KM.desenharPessoa(c, cfg, fake, t); p.cabecaJogo = fake.cabecaTela; } });
    }
    lista.sort((a, b) => a.p - b.p);
    for (const o of lista) o.f(ctx);
    ctx.fillStyle = 'rgba(40,10,60,0.12)'; ctx.fillRect(0, 0, KM.W, KM.H);
  }

  function alvoEm(x, y) {
    for (const h of hotspots.slice().reverse()) { const [a, b, c, d] = h.box; if (x >= a && x <= c && y >= b && y <= d) return h.nome; }
    return null;
  }

  // ------------------------------------------------------------------ entrar / sair (muda o layout do app)
  function entrar() {
    const est = A().estado;
    A().irPara('escritorio');
    est.portaAberta = true; KM.tocar('teleporte');
    Object.values(est.pessoas).forEach(p => { if (p.acao === 'rotina' || p.acao === 'soneca') KM.pararRotina(p); }); // vêm para a sala
    setTimeout(() => {
      est.sala = 'jogos'; est.portaAberta = false;
      document.body.classList.add('modo-jogos');
      $('#tituloPalco').innerHTML = 'Sala de Jogos <span>KWIK PLAY</span>';
      KM.fx.flash = 0.5; KM.fx.corFlash = '#ff4fd8';
      renderPainel();
      const livres = Object.values(est.pessoas).filter(p => !p.trabalhando && !p.acao);
      if (livres[0]) A().falar(livres[0].id, 'Bem-vindo à sala de jogos! 🎮 Clique no fliperama.', 3200);
    }, 350);
  }
  function sair() {
    fecharJogo();
    const est = A().estado;
    est.sala = 'escritorio';
    document.body.classList.remove('modo-jogos');
    A().atualizarFuncionario();
    KM.fx.flash = 0.3; KM.fx.corFlash = '#ffffff';
  }
  function clique(x, y) {
    const alvo = alvoEm(x, y);
    if (alvo === 'porta') return sair();
    if (alvo === 'fliperama') return abrirGatinhos();
    if (alvo === 'sinuca') return A().toast('🎱 A sinuca chega numa próxima atualização! Por enquanto, jogue no fliperama 🐱');
    if (alvo === 'cartas') return A().toast('🃏 As Cartas Coloridas chegam numa próxima atualização!');
  }
  function renderPainel() {
    const g = A().cfg().jogos.gatos;
    $('#gatosFase').textContent = g.fase;
    const total = Object.values(g.estrelas || {}).reduce((s, v) => s + v, 0);
    $('#gatosEstrelas').textContent = total;
  }

  // ------------------------------------------------------------------ Gatinhos em Ordem
  const CORES = ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#b197fc', '#ffa94d', '#f783ac', '#38d9a9', '#adb5bd', '#a9714b'];
  const CAP = 4;
  // Gatinho 16x13 (marca na testa ajuda a distinguir as cores).
  function desenharGato(g, x, y, cor, marca, feliz, esc = 1) {
    const r = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(x + a * esc, y + b * esc, w * esc, h * esc); };
    const esc2 = KM.cor.tom(cor, 0.7), cla = KM.cor.tom(cor, 1.3);
    r(1, 0, 4, 1, '#1c1612'); r(11, 0, 4, 1, '#1c1612');
    r(1, 1, 4, 3, cor); r(11, 1, 4, 3, cor); r(2, 1, 2, 2, '#ffb3c6'); r(12, 1, 2, 2, '#ffb3c6');
    r(0, 3, 16, 10, '#1c1612'); r(1, 3, 14, 9, cor); r(1, 10, 14, 2, esc2); r(2, 3, 12, 1, cla);
    if (feliz) { r(4, 6, 2, 1, '#1c1612'); r(10, 6, 2, 1, '#1c1612'); }
    else { r(4, 5, 2, 2, '#1c1612'); r(10, 5, 2, 2, '#1c1612'); r(4, 5, 1, 1, '#ffffff'); r(10, 5, 1, 1, '#ffffff'); }
    r(7, 7, 2, 1, '#ff6b9a'); r(6, 8, 1, 1, '#1c1612'); r(9, 8, 1, 1, '#1c1612'); r(7, 9, 2, 1, '#1c1612');
    r(0, 7, 3, 1, '#ffffff'); r(13, 7, 3, 1, '#ffffff');
    const m = '#ffffff';
    switch (marca % 10) {
      case 0: r(7, 3, 2, 2, m); break;
      case 1: r(6, 3, 4, 1, m); break;
      case 2: r(7, 2, 2, 1, m); r(6, 3, 4, 1, m); break;
      case 3: r(7, 2, 2, 3, m); r(6, 3, 4, 1, m); break;
      case 4: r(6, 3, 1, 1, m); r(9, 3, 1, 1, m); break;
      case 5: r(6, 2, 4, 1, m); r(6, 4, 4, 1, m); break;
      case 6: r(6, 3, 1, 1, m); r(9, 3, 1, 1, m); r(7, 4, 2, 1, m); break;
      case 7: r(7, 2, 1, 3, m); r(8, 2, 1, 3, m); break;
      case 8: r(5, 3, 6, 1, m); break;
      default: r(6, 2, 1, 1, m); r(8, 3, 1, 1, m); r(9, 2, 1, 1, m);
    }
  }

  function aleatorio(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const chave = est => est.map(t => t.join(',')).sort().join('|');
  const resolvido = est => est.every(t => !t.length || (t.length === CAP && t.every(c => c === t[0])));
  function movimentos(est) {
    const ms = [];
    for (let i = 0; i < est.length; i++) {
      const a = est[i]; if (!a.length) continue;
      const c = a[a.length - 1];
      let run = 1; while (run < a.length && a[a.length - 1 - run] === c) run++;
      const uniforme = run === a.length;
      for (let j = 0; j < est.length; j++) {
        if (i === j) continue;
        const b = est[j];
        if (b.length >= CAP) continue;
        if (b.length && b[b.length - 1] !== c) continue;
        if (!b.length && uniforme) continue;
        ms.push([i, j, Math.min(run, CAP - b.length), b.length ? 0 : 1]);
      }
    }
    return ms.sort((x, y) => x[3] - y[3]);
  }
  function aplicar(est, [i, j, n]) { const e = est.map(t => t.slice()); for (let k = 0; k < n; k++) e[j].push(e[i].pop()); return e; }
  function resolver(inicio, limite = 120000) {
    const vistos = new Set(); let nos = 0;
    function dfs(est, prof) {
      if (resolvido(est)) return [];
      if (++nos > limite || prof > 200) return null;
      const k = chave(est); if (vistos.has(k)) return null; vistos.add(k);
      for (const mv of movimentos(est)) { const r = dfs(aplicar(est, mv), prof + 1); if (r) return [mv, ...r]; }
      return null;
    }
    return dfs(inicio, 0);
  }
  function gerarFase(n) {
    const cores = Math.min(3 + Math.floor((n - 1) / 2), 9), vazios = 2;
    for (let tent = 0; tent < 60; tent++) {
      const rnd = aleatorio(n * 9973 + tent * 31);
      const bolsa = []; for (let c = 0; c < cores; c++) for (let k = 0; k < CAP; k++) bolsa.push(c);
      for (let i = bolsa.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [bolsa[i], bolsa[j]] = [bolsa[j], bolsa[i]]; }
      const est = []; for (let t = 0; t < cores; t++) est.push(bolsa.slice(t * CAP, t * CAP + CAP));
      for (let v = 0; v < vazios; v++) est.push([]);
      if (resolvido(est) || est.some(t => t.length === CAP && t.every(c => c === t[0]))) continue;
      const sol = resolver(est);
      if (sol) return { est, minimo: sol.length };
    }
    return { est: [[0, 1, 0, 1], [1, 0, 1, 0], [], []], minimo: 6 };
  }

  // estado do jogo
  let J = null, rafJogo = 0;
  function abrirGatinhos(fase) {
    const g = A().cfg().jogos.gatos;
    const n = fase || g.fase || 1;
    const { est, minimo } = gerarFase(n);
    J = { fase: n, est, inicial: est.map(t => t.slice()), minimo, jogadas: 0, historico: [], sel: null, anim: null, dica: null, venceu: false, tremor: {} };
    A().estado.jogando = true;
    document.body.classList.add('jogando');
    $('#jogoFase').textContent = n;
    $('#jogoVitoria').hidden = true;
    atualizarHud();
    KM.tocar('magia');
    cancelAnimationFrame(rafJogo);
    rafJogo = requestAnimationFrame(loopJogo);
  }
  function fecharJogo() {
    if (!J && !A().estado.jogando) return;
    J = null; A().estado.jogando = false;
    document.body.classList.remove('jogando');
    cancelAnimationFrame(rafJogo);
    renderPainel();
  }
  function atualizarHud() {
    $('#jogoJogadas').textContent = J.jogadas;
    $('#jogoMinimo').textContent = J.minimo;
    $('#jogoDesfazer').disabled = !J.historico.length;
    $('#jogoAnterior').disabled = J.fase <= 1;
    $('#jogoProxima').disabled = J.fase >= (A().cfg().jogos.gatos.fase || 1);
  }

  // geometria (coordenadas lógicas do canvas do jogo)
  const TW = 22, TH = 4 * 14 + 8, GAP = 8, TOPO = 26;
  function medidas() {
    const n = J.est.length, porLinha = n > 7 ? Math.ceil(n / 2) : n, linhas = Math.ceil(n / porLinha);
    const w = porLinha * (TW + GAP) + GAP, h = linhas * (TH + TOPO + 10) + 10;
    return { n, porLinha, linhas, w, h };
  }
  function posTubo(i, M) {
    const lin = Math.floor(i / M.porLinha), col = i % M.porLinha, naLinha = Math.min(M.porLinha, M.n - lin * M.porLinha);
    const off = (M.porLinha - naLinha) * (TW + GAP) / 2;
    return [GAP + off + col * (TW + GAP), 10 + lin * (TH + TOPO + 10) + TOPO];
  }
  const posGato = (i, k, M) => { const [x, y] = posTubo(i, M); return [x + 3, y + TH - 4 - (k + 1) * 14]; };

  function loopJogo(agora) {
    if (!J) return;
    const cv = $('#jogoCanvas'), caixa = $('#jogoArea');
    const M = medidas();
    const esc = Math.max(2, Math.floor(Math.min(caixa.clientWidth / M.w, (caixa.clientHeight || 400) / M.h)));
    if (cv.width !== M.w || cv.height !== M.h) { cv.width = M.w; cv.height = M.h; }
    cv.style.width = M.w * esc + 'px'; cv.style.height = M.h * esc + 'px';
    J.esc = esc; J.M = M;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, M.w, M.h);
    const t = agora / 1000;
    J.est.forEach((tubo, i) => {
      let [x, y] = posTubo(i, M);
      if (J.tremor[i] && agora < J.tremor[i]) x += Math.round(Math.sin(agora / 25) * 2);
      const completo = tubo.length === CAP && tubo.every(c => c === tubo[0]);
      const dica = J.dica && (J.dica[0] === i || J.dica[1] === i) && Math.floor(t * 4) % 2;
      g.fillStyle = '#1c1612'; g.fillRect(x - 1, y - 1, TW + 2, TH + 2);
      g.fillStyle = completo ? '#d3f9d8' : dica ? '#fff3bf' : J.sel === i ? '#ffe8cc' : '#e9d5b7'; g.fillRect(x, y, TW, TH);
      g.fillStyle = completo ? '#8ce99a' : '#c9a57a'; g.fillRect(x, y + TH - 3, TW, 3); g.fillRect(x, y, 2, TH); g.fillRect(x + TW - 2, y, 2, TH);
      g.fillStyle = '#a07850'; g.fillRect(x + 4, y + 2, TW - 8, 1);
      tubo.forEach((c, k) => {
        if (J.anim && J.anim.de === i && k >= tubo.length - J.anim.restantes) return;
        let [gx, gy] = posGato(i, k, M);
        if (J.sel === i && k === tubo.length - 1) gy -= 10 + Math.round(Math.sin(t * 8) * 1.5);
        desenharGato(g, gx, gy, CORES[c], c, completo || J.venceu);
      });
      if (completo && Math.floor(t * 2 + i) % 3 === 0) KM.texto(g, '*', x + TW - 5, y - 6, '#ffd43b');
    });
    if (J.anim) { // gato voando de uma caixa para outra
      const a = J.anim, k = Math.min(1, (agora - a.ini) / 230);
      const [x0, y0] = a.origem, [x1, y1] = a.destino, meio = Math.min(y0, y1) - 18;
      const x = x0 + (x1 - x0) * k, y = k < 0.5 ? y0 + (meio - y0) * (k * 2) : meio + (y1 - meio) * ((k - 0.5) * 2);
      desenharGato(g, Math.round(x), Math.round(y), CORES[a.cor], a.cor, false);
      if (k >= 1) passoAnim(agora);
    }
    rafJogo = requestAnimationFrame(loopJogo);
  }

  function tuboEm(ev) {
    const cv = $('#jogoCanvas'), r = cv.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * cv.width, y = (ev.clientY - r.top) / r.height * cv.height;
    for (let i = 0; i < J.est.length; i++) { const [tx, ty] = posTubo(i, J.M); if (x >= tx - 3 && x <= tx + TW + 3 && y >= ty - TOPO && y <= ty + TH + 4) return i; }
    return null;
  }
  function podeMover(i, j) {
    const a = J.est[i], b = J.est[j];
    if (!a.length || b.length >= CAP) return 0;
    const c = a[a.length - 1];
    if (b.length && b[b.length - 1] !== c) return 0;
    let run = 1; while (run < a.length && a[a.length - 1 - run] === c) run++;
    return Math.min(run, CAP - b.length);
  }
  function mover(i, j) {
    const n = podeMover(i, j);
    if (!n) { J.tremor[j] = performance.now() + 300; KM.tocar('zap'); J.sel = null; return; }
    J.historico.push(J.est.map(t => t.slice()));
    J.jogadas++; J.dica = null; J.sel = null; J.jaSel = null;
    J.anim = { de: i, para: j, restantes: n, ini: performance.now(), cor: J.est[i][J.est[i].length - 1] };
    prepararVoo();
    atualizarHud();
  }
  function prepararVoo() {
    const a = J.anim, M = J.M;
    a.origem = posGato(a.de, J.est[a.de].length - 1, M); a.origem[1] -= 10;
    a.destino = posGato(a.para, J.est[a.para].length, M);
    KM.tocar('bip');
  }
  function passoAnim(agora) {
    const a = J.anim;
    J.est[a.para].push(J.est[a.de].pop());
    a.restantes--;
    if (a.restantes > 0) { a.ini = agora; prepararVoo(); return; }
    J.anim = null;
    const destino = J.est[a.para];
    if (destino.length === CAP && destino.every(c => c === destino[0])) { KM.tocar('sucesso'); }
    if (resolvido(J.est)) vitoria();
  }
  function vitoria() {
    J.venceu = true;
    const g = A().cfg().jogos.gatos;
    const estrelas = J.jogadas <= J.minimo + 2 ? 3 : J.jogadas <= J.minimo + 8 ? 2 : 1;
    const premio = estrelas * 10;
    g.estrelas = g.estrelas || {};
    g.estrelas[J.fase] = Math.max(g.estrelas[J.fase] || 0, estrelas);
    g.fase = Math.max(g.fase || 1, J.fase + 1);
    const cfg = A().cfg(); cfg.economia.caixa += premio; A().estado.caixa = cfg.economia.caixa;
    A().animarCaixa(); A().salvar();
    $('#vitoriaEstrelas').textContent = '⭐'.repeat(estrelas) + '☆'.repeat(3 - estrelas);
    $('#vitoriaTexto').textContent = `Fase ${J.fase} em ${J.jogadas} jogadas. +R$ ${premio} no caixa do escritório! 💰`;
    setTimeout(() => { $('#jogoVitoria').hidden = false; KM.tocar('caixa'); }, 400);
    atualizarHud();
  }

  let inicioToque = null;
  function ligarJogo() {
    const cv = $('#jogoCanvas');
    cv.addEventListener('pointerdown', ev => {
      if (!J || J.anim || J.venceu) return;
      const i = tuboEm(ev); inicioToque = i;
      if (i === null) { J.sel = null; return; }
      if (J.sel === null) { if (J.est[i].length) { J.sel = i; KM.tocar('clique'); } }
    });
    cv.addEventListener('pointerup', ev => {
      if (!J || J.anim || J.venceu) return;
      const i = tuboEm(ev);
      if (i === null) return;
      if (J.sel !== null && i !== J.sel) { mover(J.sel, i); return; }        // deslizou ou tocou em outra caixa
      if (J.sel === i && inicioToque === i && J.jaSel === i) { J.sel = null; } // tocou de novo: solta
      J.jaSel = J.sel;
    });
    $('#jogoDesfazer').addEventListener('click', () => { if (!J || J.anim || !J.historico.length) return; J.est = J.historico.pop(); J.jogadas++; J.sel = null; J.venceu = false; J.dica = null; atualizarHud(); });
    $('#jogoReiniciar').addEventListener('click', () => { if (!J) return; J.est = J.inicial.map(t => t.slice()); J.jogadas = 0; J.historico = []; J.sel = null; J.venceu = false; J.dica = null; $('#jogoVitoria').hidden = true; atualizarHud(); });
    $('#jogoDica').addEventListener('click', () => {
      if (!J || J.anim) return;
      const sol = resolver(J.est, 80000);
      if (!sol) return A().toast('Hmm, por esse caminho não tem saída. Tente desfazer algumas jogadas ↩️');
      J.dica = sol[0]; J.sel = null; KM.tocar('notif');
    });
    $('#jogoSair').addEventListener('click', fecharJogo);
    $('#jogoAnterior').addEventListener('click', () => J && abrirGatinhos(J.fase - 1));
    $('#jogoProxima').addEventListener('click', () => J && abrirGatinhos(J.fase + 1));
    $('#vitoriaProxima').addEventListener('click', () => abrirGatinhos(J.fase + 1));
    $('#btJogarGatos').addEventListener('click', () => abrirGatinhos());
    $('#btVoltarEscritorio').addEventListener('click', sair);
  }

  KM.jogos = {
    iniciar() { ligarJogo(); },
    entrar, sair, clique,
    sobre: (x, y) => !!alvoEm(x, y),
    desenhar: desenharSala,
    resolver, gerarFase, estadoJogo: () => J, _quadro: t => { cancelAnimationFrame(rafJogo); loopJogo(t); },
  };
})();
