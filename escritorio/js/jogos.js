/* KWIK Mini Escritório · Sala de Jogos (cômodo ao lado do escritório) + mini jogo "Gatinhos em Casa".
   A sala fica do lado direito, separada por uma mureta com passagem. Começa apagada; ao tocar nela a luz
   acende e quem está livre entra para jogar sinuca, pingue-pongue ou cartas.
   Gatinhos em Casa (jogo original): arraste as caminhas coloridas pelo tabuleiro; ao passar sobre gatinhos
   da mesma cor, eles pulam para dentro. O número é quantos ainda faltam. Caminha cheia vai embora. */
(function () {
  const KM = window.KM;
  const $ = s => document.querySelector(s);
  const A = () => KM.app;
  const P = (...a) => KM.P(...a);
  const X0 = 108, X1 = 186, FUNDO = 108, PAREDE = 78, PORTA = [62, 80];

  // ------------------------------------------------------------------ desenho do cômodo
  let camada = null, hotspots = [], luzK = 0, bola = 0;
  function texCarpete() {
    return KM.tex('carpeteJogos', X1 - X0, FUNDO, (g, w, h) => {
      for (let v = 0; v < h; v += 12) for (let u = 0; u < w; u += 12) { g.fillStyle = ((u + v) / 12) % 2 ? '#3b2f66' : '#443774'; g.fillRect(u, v, 12, 12); }
      g.fillStyle = 'rgba(255,79,216,0.16)'; for (let i = 6; i < w; i += 24) g.fillRect(i, 0, 1, h);
    });
  }
  function texParedeJogos() {
    return KM.tex('paredeJogos2', X1 - X0, PAREDE, (g, w, h) => {
      g.fillStyle = '#2c2344'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.04)'; for (let u = 0; u < w; u += 9) g.fillRect(u, 0, 1, h);
      g.fillStyle = '#ff4fd8'; g.fillRect(0, h - 6, w, 1); g.fillStyle = '#3fb6ff'; g.fillRect(0, h - 4, w, 1);
      g.fillStyle = '#16102a'; g.fillRect(0, h - 3, w, 3);
      const cx = 52, cy = 24; // alvo de dardos
      for (let r = 7; r > 0; r -= 2) { g.fillStyle = r % 4 === 3 ? '#e03131' : '#f8f9fa'; g.fillRect(cx - r, cy - r, r * 2, r * 2); }
      g.fillStyle = '#2f9e44'; g.fillRect(cx - 1, cy - 1, 2, 2);
    });
  }
  function letreiro(t, acesa) {
    const c = KM.tela(40, 12), g = c.getContext('2d');
    g.fillStyle = '#16102a'; g.fillRect(0, 0, 40, 12);
    const on = acesa && Math.floor(t * 3) % 9 !== 0;
    KM.texto(g, 'KWIK', 2, 3, on ? '#ff4fd8' : '#4a2a50');
    KM.texto(g, 'PLAY', 21, 3, on ? '#3fb6ff' : '#1d3a50');
    return c;
  }
  function telaTV(t, acesa) {
    const c = KM.tela(26, 15), g = c.getContext('2d');
    g.fillStyle = '#111'; g.fillRect(0, 0, 26, 15);
    g.fillStyle = acesa ? '#0b2a4a' : '#08080c'; g.fillRect(1, 1, 24, 13);
    if (acesa) {
      const f = Math.floor(t * 4);
      g.fillStyle = '#69db7c'; g.fillRect(1, 11, 24, 3);
      g.fillStyle = '#ffd43b'; g.fillRect(3 + (f % 16), 8 - (f % 4 === 0 ? 2 : 0), 3, 3);
      g.fillStyle = '#ff6b6b'; g.fillRect(18 - (f % 10), 9, 3, 2);
      KM.texto(g, String(10 + (f % 80)), 2, 2, '#ffffff');
    }
    return c;
  }
  function telaFliper(t, acesa) {
    const c = KM.tela(10, 8), g = c.getContext('2d');
    g.fillStyle = '#0b1020'; g.fillRect(0, 0, 10, 8);
    if (acesa) { const f = Math.floor(t * 2) % 4; for (let i = 0; i < 3; i++) { g.fillStyle = CORES[(i + f) % 5]; g.fillRect(1 + i * 3, 2 + ((i + f) % 2), 2, 2); } g.fillStyle = '#ffffff'; g.fillRect(1, 6, 8, 1); }
    return c;
  }
  function caixaTela(X, Y, w, d, h) {
    const pts = [[X, Y, 0], [X + w, Y, 0], [X, Y + d, 0], [X + w, Y + d, 0], [X, Y, h], [X + w, Y, h], [X, Y + d, h], [X + w, Y + d, h]].map(q => P(...q));
    return [Math.min(...pts.map(q => q[0])), Math.min(...pts.map(q => q[1])), Math.max(...pts.map(q => q[0])), Math.max(...pts.map(q => q[1]))];
  }

  const MOVEIS = [
    { p: 160, f: (c, t, on) => { // fliperama (abre o mini jogo)
      const X = 172, Y = 4, w = 12, d = 12;
      KM.prisma(c, { X, Y, w, d, h: 40, cor: '#7048e8', corEsq: '#5f3dc4', corDir: '#4c2fa3' });
      KM.face(c, telaFliper(t, on), KM.MAT.paredeD, ...P(X + 1, Y + d, 34));
      KM.prisma(c, { X: X + 1, Y: Y + d, Z: 20, w: w - 2, d: 3, h: 2, cor: '#212529' });
      const [lx, ly] = P(X + 6, Y + d, 44); c.fillStyle = on && Math.floor(t * 4) % 2 ? '#ff4fd8' : '#7a3a8a'; c.fillRect(Math.round(lx) - 5, Math.round(ly) - 2, 10, 2);
      hotspots.push({ nome: 'fliperama', box: caixaTela(X, Y, w, d + 3, 44) });
    } },
    { p: 132, f: c => { // sofá embaixo da TV
      KM.prisma(c, { X: 118, Y: 2, w: 28, d: 4, h: 14, cor: '#a61e1e' });
      KM.prisma(c, { X: 118, Y: 6, w: 28, d: 7, h: 7, cor: '#c92a2a' });
      KM.prisma(c, { X: 116, Y: 2, w: 3, d: 11, h: 11, cor: '#a61e1e' }); KM.prisma(c, { X: 145, Y: 2, w: 3, d: 11, h: 11, cor: '#a61e1e' });
    } },
    { p: 166, f: c => { // sinuca
      const X = 120, Y = 24, w = 30, d = 18;
      for (const [x, y] of [[X + 1, Y + 1], [X + w - 3, Y + 1], [X + 1, Y + d - 3], [X + w - 3, Y + d - 3]]) KM.prisma(c, { X: x, Y: y, w: 2, d: 2, h: 10, cor: '#4a2a14' });
      KM.prisma(c, { X, Y, Z: 10, w, d, h: 4, cor: '#6b3f22' });
      const feltro = KM.tex('feltro2', w - 4, d - 4, (g, ww, hh) => {
        g.fillStyle = '#2f9e44'; g.fillRect(0, 0, ww, hh);
        g.fillStyle = '#111'; for (const [x, y] of [[0, 0], [ww - 2, 0], [0, hh - 2], [ww - 2, hh - 2], [ww / 2 - 1, 0], [ww / 2 - 1, hh - 2]]) g.fillRect(x, y, 2, 2);
        for (const [cor, x, y] of [['#ffd43b', 16, 5], ['#e03131', 18, 7], ['#1971c2', 17, 10], ['#7048e8', 20, 6], ['#111111', 19, 9], ['#f76707', 21, 8]]) { g.fillStyle = cor; g.fillRect(x, y, 2, 2); }
      });
      KM.face(c, feltro, KM.MAT.chao, ...P(X + 2, Y + 2, 14));
      const [bx, by] = P(X + 6 + Math.abs(Math.sin(bola * 0.7)) * 8, Y + 9, 14); c.fillStyle = '#ffffff'; c.fillRect(Math.round(bx), Math.round(by) - 1, 2, 2);
      hotspots.push({ nome: 'sinuca', box: caixaTela(X, Y, w, d, 14) });
    } },
    { p: 207, f: c => { // mesa de cartas + banquinhos
      const X = 160, Y = 30, w = 18, d = 16;
      KM.prisma(c, { X: X + 8, Y: Y + 7, w: 3, d: 3, h: 11, cor: '#3a2a1e' });
      KM.prisma(c, { X, Y, Z: 11, w, d, h: 2, cor: '#1864ab' });
      const cartas = KM.tex('cartasMesa2', w - 2, d - 2, g => {
        const cs = ['#e03131', '#f59f00', '#2f9e44', '#1971c2', '#111111'];
        [[2, 3], [6, 2], [9, 6], [12, 3], [5, 9], [10, 10]].forEach(([x, y], i) => { g.fillStyle = '#ffffff'; g.fillRect(x, y, 3, 4); g.fillStyle = cs[i % cs.length]; g.fillRect(x + 1, y + 1, 1, 2); });
      });
      KM.face(c, cartas, KM.MAT.chao, ...P(X + 1, Y + 1, 13));
      KM.prisma(c, { X: 180, Y: 36, w: 4, d: 4, h: 7, cor: '#862e9c' });
      hotspots.push({ nome: 'cartas', box: caixaTela(X, Y, w, d, 13) });
    } },
    { p: 220, f: (c, t) => { // pingue-pongue
      const X = 130, Y = 66, w = 30, d = 18;
      for (const [x, y] of [[X + 2, Y + 2], [X + w - 4, Y + 2], [X + 2, Y + d - 4], [X + w - 4, Y + d - 4]]) KM.prisma(c, { X: x, Y: y, w: 2, d: 2, h: 10, cor: '#343a40' });
      const mesa = KM.tex('pingue', w, d, (g, ww, hh) => { g.fillStyle = '#1971c2'; g.fillRect(0, 0, ww, hh); g.fillStyle = '#ffffff'; g.fillRect(0, 0, ww, 1); g.fillRect(0, hh - 1, ww, 1); g.fillRect(0, 0, 1, hh); g.fillRect(ww - 1, 0, 1, hh); g.fillRect(0, hh / 2, ww, 1); });
      KM.prisma(c, { X, Y, Z: 10, w, d, h: 2, cor: '#1864ab', topo: mesa });
      KM.prisma(c, { X: X + w / 2 - 1, Y, Z: 12, w: 2, d, h: 3, cor: '#f1f3f5' });
      hotspots.push({ nome: 'pingue', box: caixaTela(X, Y, w, d, 15) });
    } },
    { p: 240, f: c => { KM.prisma(c, { X: 172, Y: 62, w: 10, d: 10, h: 6, cor: '#e03131' }); KM.prisma(c, { X: 174, Y: 80, w: 10, d: 10, h: 6, cor: '#3fb6ff' }); } },
    { p: 282, f: (c, t) => planta(c, 180, 102, t) }, { p: 216, f: (c, t) => planta(c, 116, 100, t) },
  ];
  function planta(c, X, Y, t) {
    KM.prisma(c, { X: X - 3, Y: Y - 3, w: 6, d: 6, h: 6, cor: '#b5532f' });
    const [x0, y0] = P(X, Y, 6), x = Math.round(x0), y = Math.round(y0), b = Math.round(Math.sin(t * 1.3 + X) * 0.6);
    c.fillStyle = '#2E8B45'; c.fillRect(x - 1 + b, y - 12, 2, 12);
    c.fillStyle = '#28BE52'; c.fillRect(x - 5 + b, y - 9, 4, 2); c.fillRect(x + 1 + b, y - 11, 4, 2); c.fillRect(x - 4 + b, y - 5, 3, 2); c.fillRect(x + 2 + b, y - 6, 3, 2);
  }

  function desenharArea(ctx, cfg, estado, t) {
    hotspots = [];
    const alvo = estado.luzJogos ? 1 : 0;
    luzK += (alvo - luzK) * 0.15;
    bola += 0.08;
    if (!camada) { camada = document.createElement('canvas'); }
    if (camada.width !== KM.W || camada.height !== KM.H) { camada.width = KM.W; camada.height = KM.H; }
    const c = camada.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.clearRect(0, 0, KM.W, KM.H);
    const on = luzK > 0.5;
    // chão, parede do fundo e mureta
    KM.prisma(c, { X: X0, Y: 0, Z: -6, w: X1 - X0, d: FUNDO, h: 6, topo: texCarpete(), corEsq: '#241c3f', corDir: '#1a1430' });
    KM.prisma(c, { X: X0, Y: -4, Z: -6, w: X1 - X0, d: 4, h: PAREDE + 6, corTopo: '#16102a', corDir: '#1c1530', semEsq: true });
    KM.face(c, texParedeJogos(), KM.MAT.paredeD, ...P(X0, 0, PAREDE));
    KM.face(c, letreiro(t, on), KM.MAT.paredeD, ...P(150, 0, PAREDE - 12));
    KM.face(c, telaTV(t, on), KM.MAT.paredeD, ...P(119, 0, PAREDE - 30));
    const lista = MOVEIS.map(m => ({ p: m.p, f: cc => m.f(cc, t, on) }));
    lista.push({ p: X0 + 62, f: cc => KM.prisma(cc, { X: X0, Y: 0, w: 4, d: PORTA[0], h: 12, cor: '#3b2a5c', corTopo: '#ff4fd8' }) });
    lista.push({ p: X0 + 94, f: cc => KM.prisma(cc, { X: X0, Y: PORTA[1], w: 4, d: FUNDO - PORTA[1], h: 12, cor: '#3b2a5c', corTopo: '#ff4fd8' }) });
    for (const p of Object.values(estado.pessoas || {})) if (p.visivel !== false && p.X >= 108) lista.push({ p: p.X + p.Y + 0.5, f: cc => KM.desenharPessoa(cc, cfg, p, t) });
    lista.sort((a, b) => a.p - b.p);
    for (const o of lista) o.f(c);
    // bolinha do pingue-pongue quando tem dupla jogando
    const dupla = Object.values(estado.pessoas || {}).filter(p => p.lugarJogo === 'pingA' || p.lugarJogo === 'pingB').filter(p => p.jogando);
    if (dupla.length === 2) {
      const k = (Math.sin(bola * 1.6) + 1) / 2, X = 128 + k * 34, Z = 16 + Math.abs(Math.sin(bola * 3.2)) * 8;
      const [bx, by] = P(X, 75, Z); c.fillStyle = '#ffffff'; c.fillRect(Math.round(bx), Math.round(by), 2, 2);
    }
    // luz: escurece tudo o que foi desenhado na camada (só onde tem pixel)
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = `rgba(8,6,22,${0.72 * (1 - luzK)})`; c.fillRect(0, 0, KM.W, KM.H);
    c.globalCompositeOperation = 'source-over';
    // pendentes no teto
    for (const [X, Y] of [[136, 34], [146, 74], [168, 38]]) {
      const [lx, ly] = P(X, Y, 70);
      c.fillStyle = '#1c1612'; c.fillRect(Math.round(lx), Math.round(ly) - 14, 1, 14);
      c.fillStyle = on ? '#ffe066' : '#5c5470'; c.fillRect(Math.round(lx) - 2, Math.round(ly), 5, 2);
    }
    if (!estado.luzJogos && luzK < 0.1) { const [x, y] = P(150, 60, 30); KM.texto(c, 'TOQUE AQUI', Math.round(x) - 19, Math.round(y), Math.floor(t * 2) % 2 ? '#ff8ae6' : '#b37bd1'); }
    ctx.drawImage(camada, 0, 0);
  }

  function naArea(x, y) {
    const [X, Y] = KM.chaoEm(x, y);
    if (X >= X0 && X <= X1 + 2 && Y >= -6 && Y <= FUNDO + 2) return true;
    const [xa, ya] = P(X0, 0, PAREDE), [xb] = P(X1, 0, PAREDE), [, yc] = P(X1, 0, 0);
    return x >= xa && x <= xb && y >= ya && y <= yc + 30 && KM.chaoEm(x, y)[0] > X0 - 20;
  }
  const alvoEm = (x, y) => { for (const h of hotspots.slice().reverse()) { const [a, b, c, d] = h.box; if (x >= a && x <= c && y >= b && y <= d) return h.nome; } return null; };

  // ------------------------------------------------------------------ luz + funcionários entrando
  const LUGARES = {
    sinuca: { X: 116, Y: 33, dir: 'fd', prop: 'taco', rota: [[118, 58]] },
    pingA: { X: 126, Y: 75, dir: 'fd', rota: [] },
    pingB: { X: 164, Y: 75, dir: 'ce', rota: [[124, 60], [164, 60]] },
    cartas: { X: 169, Y: 26, dir: 'fe', prop: 'cartas', rota: [[118, 58], [155, 58], [155, 22]] },
  };
  const ENTRADA = [[68, 72], [104, 72], [118, 72]];
  const FALAS = { sinuca: ['Bola sete na caçapa! 🎱', 'Essa foi de efeito 😎'], pingA: ['Ponto meu! 🏓', 'Saque!'], pingB: ['Devolve essa! 🏓', 'Quase! 😅'], cartas: ['Mais duas cartas pra você! 😂', 'Bati! 🃏'] };

  function escolherLugares(ps) {
    const livres = ['sinuca', 'pingA', 'pingB', 'cartas'], out = new Map();
    const leo = ps.find(p => p.funcao === 'noticias');
    if (leo) { out.set(leo, 'sinuca'); livres.splice(livres.indexOf('sinuca'), 1); }
    const outros = ps.filter(p => p !== leo);
    if (outros.length >= 2) { out.set(outros[0], 'pingA'); out.set(outros[1], 'pingB'); outros.slice(2).forEach(p => out.set(p, 'cartas')); }
    else if (outros.length === 1) out.set(outros[0], leo ? 'cartas' : 'sinuca');
    return out;
  }

  async function brincar(p, lugar) {
    const L = LUGARES[lugar], m = KM.mov;
    p.acao = 'rotina'; p.lugarJogo = lugar;
    try {
      await m.levantar(p);
      if (!p.foraDaMesa) { for (const [x, y] of m.assento(p).caminho) await m.andarAte(p, x, y); p.foraDaMesa = true; }
      for (const [x, y] of ENTRADA) { if (p.pararRotina) break; await m.andarAte(p, x, y); }
      for (const [x, y] of L.rota) { if (p.pararRotina) break; await m.andarAte(p, x, y); }
      if (!p.pararRotina) {
        await m.andarAte(p, L.X, L.Y);
        p.dir = L.dir; p.prop = L.prop || null; p.jogando = true; p.est = {};
        let n = 0;
        while (!p.pararRotina) {
          n++;
          if (lugar.startsWith('ping')) { p.est = { bracos: n % 2 ? 'aceno' : 'baixo', aceno: n % 2, boca: 'sorriso' }; }
          else if (lugar === 'sinuca') { p.est = { dy: n % 4 === 0 ? 1 : 0, boca: n % 6 === 0 ? 'o' : 'sorriso' }; }
          else p.est = { boca: n % 5 === 0 ? 'sorriso' : 'normal', olhos: n % 7 === 0 ? 'feliz' : undefined };
          if (Math.random() < 0.06) m.fala(p, FALAS[lugar][Math.floor(Math.random() * 2)], 2000);
          await KM.esperar(520);
        }
      }
    } finally {
      p.jogando = false; p.prop = null; p.est = {};
      for (const [x, y] of [...L.rota].reverse()) await m.andarAte(p, x, y);
      for (const [x, y] of [...ENTRADA].reverse()) await m.andarAte(p, x, y);
      await KM.voltarSentar(p);
      p.lugarJogo = null; p.acao = null;
    }
  }

  function acender() {
    const est = A().estado;
    if (est.luzJogos) return;
    est.luzJogos = true;
    KM.tocar('clique'); setTimeout(() => KM.tocar('magia'), 120);
    document.body.classList.add('modo-jogos');
    atualizarBotao(); renderPainel();
    const livres = Object.values(est.pessoas).filter(p => !p.trabalhando && (!p.acao || p.acao === 'soneca'));
    livres.forEach(p => { if (p.acao === 'soneca') p.dormindo = false; });
    setTimeout(() => {
      const lugares = escolherLugares(livres.filter(p => !p.acao));
      let atraso = 0;
      for (const [p, l] of lugares) { setTimeout(() => brincar(p, l), atraso); atraso += 500; }
      if (lugares.size) A().falar([...lugares.keys()][0].id, 'Oba, sala de jogos! 🎮', 2200);
      else A().toast('A equipe está ocupada agora — mas você pode jogar no fliperama 🐱');
    }, 300);
  }
  function apagar() {
    const est = A().estado;
    fecharJogo();
    if (!est.luzJogos) return;
    est.luzJogos = false;
    KM.tocar('clique');
    document.body.classList.remove('modo-jogos');
    atualizarBotao();
    for (const p of Object.values(est.pessoas)) if (p.lugarJogo) KM.pararRotina(p);
  }
  function atualizarBotao() {
    const b = $('#btSalaJogos'); if (!b) return;
    b.innerHTML = A().estado.luzJogos ? '🌙 <span class="so-pc">Apagar sala de </span>jogos' : '💡 <span class="so-pc">Sala de </span>jogos';
  }
  // Clique na cena: devolve true se foi na sala de jogos.
  function cliqueArea(x, y) {
    if (!naArea(x, y) && !alvoEm(x, y)) return false;
    const est = A().estado;
    if (!est.luzJogos) { acender(); return true; }
    const alvo = alvoEm(x, y);
    if (alvo === 'fliperama') abrir();
    else if (alvo === 'sinuca' || alvo === 'pingue' || alvo === 'cartas') A().toast('🕹️ Os mini jogos ficam no fliperama (no canto da sala). A sinuca e as cartas chegam numa próxima atualização!');
    return true;
  }
  function renderPainel() {
    const g = A().cfg().jogos.casa || {};
    $('#casaFase').textContent = g.fase || 1;
    $('#casaEstrelas').textContent = Object.values(g.estrelas || {}).reduce((s, v) => s + v, 0);
  }

  // ------------------------------------------------------------------ Gatinhos em Casa
  const CORES = ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#b197fc', '#ffa94d', '#f783ac', '#38d9a9', '#ced4da', '#a9714b'];
  const COLS = 7, LINHAS = 9, CEL = 20, MARGEM = 10;
  const FORMAS = {
    I2v: [[0, 0], [0, 1]], I2h: [[0, 0], [1, 0]], I3v: [[0, 0], [0, 1], [0, 2]], I3h: [[0, 0], [1, 0], [2, 0]],
    O4: [[0, 0], [1, 0], [0, 1], [1, 1]], L3: [[0, 0], [0, 1], [1, 1]], J3: [[1, 0], [1, 1], [0, 1]], L4: [[0, 0], [0, 1], [0, 2], [1, 2]],
    J4: [[1, 0], [1, 1], [1, 2], [0, 2]], T4: [[0, 0], [1, 0], [2, 0], [1, 1]], Lh: [[0, 0], [1, 0], [2, 0], [0, 1]], Mais: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
  };
  const DIRS = { d: [1, 0], e: [-1, 0], b: [0, 1], c: [0, -1] };

  function aleatorio(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const celulas = pc => FORMAS[pc.forma].map(([x, y]) => [pc.x + x, pc.y + y]);
  const chave = (x, y) => x + ',' + y;

  // Gera uma fase SEMPRE resolvível: simula a solução (cada caminha anda e só depois os gatos dela são postos no caminho).
  function gerarFase(n) {
    const qtd = Math.min(3 + Math.floor((n - 1) / 2), 8);
    const pool = n < 3 ? ['I2v', 'I2h', 'I3v', 'I3h', 'L3', 'O4'] : Object.keys(FORMAS);
    for (let tent = 0; tent < 400; tent++) {
      const rnd = aleatorio(n * 7919 + tent * 104729);
      const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
      const cores = [...CORES.keys()].sort(() => rnd() - 0.5).slice(0, qtd);
      const pecas = [], ocup = new Set();
      let ok = true;
      for (let i = 0; i < qtd && ok; i++) {
        let colocou = false;
        for (let k = 0; k < 60; k++) {
          const forma = pool[ri(0, pool.length - 1)];
          const w = Math.max(...FORMAS[forma].map(c => c[0])) + 1, h = Math.max(...FORMAS[forma].map(c => c[1])) + 1;
          const pc = { id: i, forma, cor: cores[i], x: ri(0, COLS - w), y: ri(0, LINHAS - h), eixo: n >= 4 && rnd() < 0.25 ? (rnd() < 0.5 ? 'h' : 'v') : null };
          const cs = celulas(pc);
          if (cs.some(([x, y]) => ocup.has(chave(x, y)))) continue;
          cs.forEach(([x, y]) => ocup.add(chave(x, y)));
          pecas.push(pc); colocou = true; break;
        }
        ok = colocou;
      }
      if (!ok) continue;
      const inicio = new Set(ocup), gatos = new Map(), varridas = new Set(), solucao = [];
      const presentes = new Set(pecas.map(p => p.id));
      const ordem = pecas.slice().sort(() => rnd() - 0.5);
      for (const pc of ordem) {
        const sim = { ...pc }, cobertas = new Set(celulas(sim).map(c => chave(...c))), movs = [];
        const outras = new Set(); for (const q of pecas) if (q !== pc && presentes.has(q.id)) celulas(q).forEach(c => outras.add(chave(...c)));
        const livre = (x, y) => x >= 0 && y >= 0 && x < COLS && y < LINHAS && !outras.has(chave(x, y)); // gatos de caminhas anteriores já foram recolhidos
        const passos = ri(1, 3);
        for (let s = 0; s < passos; s++) {
          const dirs = Object.keys(DIRS).filter(d => !sim.eixo || (sim.eixo === 'h' ? 'de'.includes(d) : 'bc'.includes(d)));
          const d = dirs[ri(0, dirs.length - 1)], [dx, dy] = DIRS[d];
          let max = 0; while (max < 6 && celulas({ ...sim, x: sim.x + dx * (max + 1), y: sim.y + dy * (max + 1) }).every(([x, y]) => livre(x, y))) max++;
          if (!max) continue;
          const dist = ri(1, max);
          for (let k = 1; k <= dist; k++) celulas({ ...sim, x: sim.x + dx * k, y: sim.y + dy * k }).forEach(c => cobertas.add(chave(...c)));
          sim.x += dx * dist; sim.y += dy * dist; movs.push([d, dist]);
        }
        const cand = [...cobertas].filter(k => !inicio.has(k) && !varridas.has(k) && !gatos.has(k));
        const forma = FORMAS[pc.forma].length;
        const cap = Math.min(cand.length, ri(2, Math.min(5, forma + 2)));
        if (cap < 2) { ok = false; break; }
        cand.sort(() => rnd() - 0.5).slice(0, cap).forEach(k => gatos.set(k, pc.cor));
        pc.cap = cap;
        cobertas.forEach(k => varridas.add(k));
        presentes.delete(pc.id);
        solucao.push({ id: pc.id, movs });
      }
      if (!ok) continue;
      return { pecas: pecas.map(p => ({ ...p, cap: p.cap, ini: [p.x, p.y] })), gatos, solucao, tempo: 40 + qtd * 18 };
    }
    return null;
  }

  // gatinho sentado 16x16 com contorno (cache por cor)
  const cacheGato = new Map();
  function spriteGato(ci, feliz) {
    const k = ci + (feliz ? 'f' : '');
    if (cacheGato.has(k)) return cacheGato.get(k);
    const c = KM.tela(18, 18), g = c.getContext('2d');
    const cor = CORES[ci], esc = KM.cor.tom(cor, 0.72), cla = KM.cor.tom(cor, 1.35);
    const r = (x, y, w, h, cc) => { g.fillStyle = cc; g.fillRect(x + 1, y + 1, w, h); };
    r(2, 1, 3, 3, cor); r(11, 1, 3, 3, cor); r(3, 2, 1, 1, '#ffb3c6'); r(12, 2, 1, 1, '#ffb3c6');
    r(2, 3, 12, 7, cor); r(3, 9, 10, 6, cor); r(2, 12, 1, 3, esc); r(13, 12, 1, 3, esc);
    r(13, 9, 2, 4, cor); r(14, 7, 1, 3, cor);
    r(5, 11, 6, 3, cla); r(3, 3, 10, 1, cla);
    if (feliz) { r(4, 6, 3, 1, '#1c1612'); r(9, 6, 3, 1, '#1c1612'); }
    else { r(4, 5, 2, 2, '#1c1612'); r(10, 5, 2, 2, '#1c1612'); r(4, 5, 1, 1, '#ffffff'); r(10, 5, 1, 1, '#ffffff'); }
    r(7, 7, 2, 1, '#ff6b9a'); r(6, 8, 1, 1, '#1c1612'); r(9, 8, 1, 1, '#1c1612');
    r(4, 14, 3, 1, '#ffffff'); r(9, 14, 3, 1, '#ffffff');
    const m = '#ffffff'; // marca para quem confunde cores
    [[[7, 11, 2, 2]], [[6, 12, 4, 1]], [[7, 11, 2, 1], [6, 12, 4, 1]], [[7, 11, 1, 3], [6, 12, 3, 1]], [[6, 12, 1, 1], [9, 12, 1, 1]], [[6, 11, 4, 1], [6, 13, 4, 1]],
      [[6, 11, 1, 1], [9, 11, 1, 1], [7, 12, 2, 1]], [[7, 11, 1, 3], [8, 11, 1, 3]], [[5, 12, 6, 1]], [[6, 11, 1, 1], [8, 12, 1, 1], [9, 11, 1, 1]]][ci % 10].forEach(q => r(...q, m));
    // contorno
    const img = g.getImageData(0, 0, 18, 18), d = img.data, cheio = (x, y) => x >= 0 && y >= 0 && x < 18 && y < 18 && d[(y * 18 + x) * 4 + 3] > 0, marcar = [];
    for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) if (!cheio(x, y) && (cheio(x - 1, y) || cheio(x + 1, y) || cheio(x, y - 1) || cheio(x, y + 1))) marcar.push((y * 18 + x) * 4);
    for (const i of marcar) { d[i] = 28; d[i + 1] = 22; d[i + 2] = 18; d[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    cacheGato.set(k, c);
    return c;
  }

  let J = null, raf = 0, ultimo = 0;
  function abrir(fase) {
    const cfg = A().cfg(); cfg.jogos.casa = cfg.jogos.casa || { fase: 1, estrelas: {} };
    const n = fase || cfg.jogos.casa.fase || 1;
    const f = gerarFase(n);
    if (!f) return A().toast('Não consegui montar essa fase 😅', { erro: true });
    J = { fase: n, pecas: f.pecas.map(p => ({ ...p })), gatos: new Map(f.gatos), base: f, solucao: f.solucao, tempo: f.tempo, total: f.tempo, gelo: 0,
      arrasto: null, voos: [], saindo: [], estado: 'jogando', martelo: false, dicas: 3, dica: null, jogadas: 0 };
    A().estado.jogando = true;
    document.body.classList.add('jogando');
    $('#casaNivel').textContent = n;
    $('#jogoFim').hidden = true;
    atualizarHud();
    cancelAnimationFrame(raf); ultimo = performance.now(); raf = requestAnimationFrame(loop);
    KM.tocar('magia');
  }
  function fecharJogo() {
    if (!J) return;
    J = null; A().estado.jogando = false; document.body.classList.remove('jogando');
    cancelAnimationFrame(raf); renderPainel();
  }
  function atualizarHud() {
    const s = Math.max(0, Math.ceil(J.tempo));
    $('#casaTempo').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    $('#casaTempo').classList.toggle('alerta', s <= 15);
    $('#casaTempo').classList.toggle('gelo', J.gelo > 0);
    $('#casaDicas').textContent = J.dicas;
    $('#btMartelo').classList.toggle('on', J.martelo);
  }

  const livreParaPeca = (pc, x, y) => {
    if (x < 0 || y < 0 || x >= COLS || y >= LINHAS) return false;
    for (const q of J.pecas) if (q !== pc && !q.cheia && celulas(q).some(([a, b]) => a === x && b === y)) return false;
    const g = J.gatos.get(chave(x, y));
    return g === undefined || g === pc.cor;
  };
  function moverUmPasso(pc, dx, dy) {
    const nova = { ...pc, x: pc.x + dx, y: pc.y + dy };
    if (!celulas(nova).every(([x, y]) => livreParaPeca(pc, x, y))) return false;
    pc.x = nova.x; pc.y = nova.y;
    for (const [x, y] of celulas(pc)) {
      const k = chave(x, y);
      if (J.gatos.get(k) === pc.cor && pc.cap > 0) { J.gatos.delete(k); pc.cap--; voar(x, y, pc); }
    }
    if (pc.cap <= 0 && !pc.cheia) completar(pc);
    return true;
  }
  function voar(x, y, pc) {
    J.voos.push({ cor: pc.cor, de: [x, y], para: celulas(pc).at(-1), ini: performance.now() });
    KM.tocar('bip'); KM.som.ligado && miau();
  }
  function miau() { try { const ac = KM.som.ac; if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(900, ac.currentTime); o.frequency.exponentialRampToValueAtTime(520, ac.currentTime + 0.22); g.gain.setValueAtTime(0.05, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.25); o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.26); } catch (e) { /* sem som */ } }
  function completar(pc) {
    pc.cheia = true; J.arrasto = null;
    J.saindo.push({ pc, ini: performance.now() });
    KM.tocar('sucesso');
    setTimeout(() => {
      if (!J) return;
      J.pecas = J.pecas.filter(q => q !== pc);
      if (!J.pecas.length) vitoria();
    }, 520);
  }
  function vitoria() {
    J.estado = 'venceu';
    const cfg = A().cfg(), g = cfg.jogos.casa;
    const fr = J.tempo / J.total, estrelas = fr > 0.5 ? 3 : fr > 0.2 ? 2 : 1, premio = estrelas * 10;
    g.estrelas[J.fase] = Math.max(g.estrelas[J.fase] || 0, estrelas);
    g.fase = Math.max(g.fase || 1, J.fase + 1);
    cfg.economia.caixa += premio; A().estado.caixa = cfg.economia.caixa; A().animarCaixa(); A().salvar();
    fim('venceu', '⭐'.repeat(estrelas) + '☆'.repeat(3 - estrelas), 'Todos os gatinhos em casa! 🐱', `Nível ${J.fase} · +R$ ${premio} no caixa do escritório 💰`, 'Próximo nível ▶');
    KM.tocar('caixa');
  }
  function fim(tipo, icone, titulo, texto, botao) {
    $('#fimIcone').textContent = icone; $('#fimTitulo').textContent = titulo; $('#fimTexto').textContent = texto; $('#fimBotao').textContent = botao;
    $('#jogoFim').dataset.tipo = tipo; $('#jogoFim').hidden = false;
  }

  function loop(agora) {
    if (!J) return;
    const dt = Math.min(0.1, (agora - ultimo) / 1000); ultimo = agora;
    if (J.estado === 'jogando') {
      if (J.gelo > 0) J.gelo -= dt; else J.tempo -= dt;
      if (J.tempo <= 0) { J.tempo = 0; J.estado = 'perdeu'; J.arrasto = null; KM.tocar('tchau'); fim('perdeu', '⏰', 'O tempo acabou!', 'Os gatinhos ainda esperam pela caminha. Tente de novo!', 'Tentar de novo 🔄'); }
      atualizarHud();
    }
    desenharTabuleiro(agora);
    raf = requestAnimationFrame(loop);
  }

  function desenharTabuleiro(agora) {
    const cv = $('#jogoCanvas'), caixa = $('#jogoArea');
    const W = COLS * CEL + MARGEM * 2, H = LINHAS * CEL + MARGEM * 2;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const esc = Math.max(1, Math.min((caixa.clientWidth - 8) / W, ((caixa.clientHeight || 420) - 8) / H));
    cv.style.width = Math.floor(W * esc) + 'px'; cv.style.height = Math.floor(H * esc) + 'px';
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    // moldura de madeira
    g.fillStyle = '#5c3820'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#7a4a2c'; g.fillRect(2, 2, W - 4, H - 4);
    g.fillStyle = '#4a2c18'; g.fillRect(MARGEM - 2, MARGEM - 2, COLS * CEL + 4, LINHAS * CEL + 4);
    for (let y = 0; y < LINHAS; y++) for (let x = 0; x < COLS; x++) {
      g.fillStyle = (x + y) % 2 ? '#b98552' : '#c4915e'; g.fillRect(MARGEM + x * CEL, MARGEM + y * CEL, CEL, CEL);
      g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(MARGEM + x * CEL, MARGEM + y * CEL + CEL - 1, CEL, 1);
    }
    // caminhas
    const t = agora / 1000;
    for (const pc of J.pecas) {
      const sai = J.saindo.find(s => s.pc === pc);
      const k = sai ? Math.min(1, (agora - sai.ini) / 500) : 0;
      g.globalAlpha = 1 - k;
      const off = -k * 14;
      const cs = celulas(pc), set = new Set(cs.map(c => chave(...c)));
      const cor = CORES[pc.cor], esc2 = KM.cor.tom(cor, 0.62), cla = KM.cor.tom(cor, 1.25);
      const brilho = (J.dica && J.dica.id === pc.id && Math.floor(t * 4) % 2) || (J.arrasto && J.arrasto.pc === pc);
      for (const [x, y] of cs) {
        const px = MARGEM + x * CEL, py = MARGEM + y * CEL + off;
        g.fillStyle = esc2; g.fillRect(px, py, CEL, CEL);
        const tem = (dx, dy) => set.has(chave(x + dx, y + dy));
        const l = tem(-1, 0) ? 0 : 2, r = tem(1, 0) ? 0 : 2, u = tem(0, -1) ? 0 : 2, d = tem(0, 1) ? 0 : 2;
        g.fillStyle = brilho ? KM.cor.tom(cor, 1.15) : cor; g.fillRect(px + l, py + u, CEL - l - r, CEL - u - d);
        g.fillStyle = KM.cor.tom(cor, 0.8); g.fillRect(px + l + 2, py + u + 2, CEL - l - r - 4, CEL - u - d - 4);
        if (u) { g.fillStyle = cla; g.fillRect(px + l, py + u, CEL - l - r, 1); }
      }
      // número (quantos gatinhos faltam)
      const [ux, uy] = cs.reduce((a, b) => (b[1] > a[1] || (b[1] === a[1] && b[0] > a[0]) ? b : a));
      const bx = MARGEM + ux * CEL + CEL - 10, by = MARGEM + uy * CEL + CEL - 10 + off;
      g.fillStyle = '#1c1612'; g.fillRect(bx - 1, by - 1, 10, 10); g.fillStyle = '#ffffff'; g.fillRect(bx, by, 8, 8);
      g.save(); g.translate(bx + 1, by + 1); KM.texto(g, String(pc.cap), pc.cap >= 10 ? 0 : 2, 1, '#1c1612'); g.restore();
      // seta: só anda na horizontal ou na vertical
      if (pc.eixo) {
        const xs = cs.map(c => c[0]), ys = cs.map(c => c[1]);
        const cx = MARGEM + (Math.min(...xs) + Math.max(...xs) + 1) * CEL / 2, cy = MARGEM + (Math.min(...ys) + Math.max(...ys) + 1) * CEL / 2 + off;
        g.fillStyle = 'rgba(255,255,255,0.9)';
        if (pc.eixo === 'v') { g.fillRect(cx - 1, cy - 7, 2, 14); g.fillRect(cx - 3, cy - 5, 6, 1); g.fillRect(cx - 3, cy + 4, 6, 1); g.fillRect(cx - 2, cy - 1, 4, 1); }
        else { g.fillRect(cx - 7, cy - 1, 14, 2); g.fillRect(cx - 5, cy - 3, 1, 6); g.fillRect(cx + 4, cy - 3, 1, 6); g.fillRect(cx - 1, cy - 2, 1, 4); }
      }
      g.globalAlpha = 1;
    }
    // gatinhos
    for (const [k, ci] of J.gatos) {
      const [x, y] = k.split(',').map(Number);
      const pulo = Math.floor(t * 2 + x + y * 3) % 7 === 0 ? -1 : 0;
      const alvoMartelo = J.martelo && Math.floor(t * 4) % 2;
      g.drawImage(spriteGato(ci, false), MARGEM + x * CEL + 1, MARGEM + y * CEL + 1 + pulo);
      if (alvoMartelo) { g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(MARGEM + x * CEL, MARGEM + y * CEL, CEL, CEL); }
    }
    // gatinhos pulando para dentro da caminha
    J.voos = J.voos.filter(v => {
      const k = Math.min(1, (agora - v.ini) / 350);
      const [x0, y0] = v.de, [x1, y1] = v.para;
      const x = MARGEM + (x0 + (x1 - x0) * k) * CEL + 1, y = MARGEM + (y0 + (y1 - y0) * k) * CEL + 1 - Math.sin(k * Math.PI) * 14;
      g.globalAlpha = 1 - k * 0.6; g.drawImage(spriteGato(v.cor, true), Math.round(x), Math.round(y)); g.globalAlpha = 1;
      return k < 1;
    });
    // dica: seta de direção
    if (J.dica && J.dica.dir && J.pecas.some(p => p.id === J.dica.id)) {
      const pc = J.pecas.find(p => p.id === J.dica.id), [dx, dy] = DIRS[J.dica.dir], cs = celulas(pc);
      const cx = MARGEM + (cs.reduce((s, c) => s + c[0], 0) / cs.length + 0.5) * CEL + dx * 12, cy = MARGEM + (cs.reduce((s, c) => s + c[1], 0) / cs.length + 0.5) * CEL + dy * 12;
      g.fillStyle = Math.floor(t * 4) % 2 ? '#ffffff' : '#ffd43b';
      for (let i = 0; i < 5; i++) g.fillRect(Math.round(cx + dx * i - (dy ? 2 - Math.min(i, 2) : 0) - 1), Math.round(cy + dy * i - (dx ? 2 - Math.min(i, 2) : 0) - 1), dy ? 5 - Math.min(i, 2) * 2 : 2, dx ? 5 - Math.min(i, 2) * 2 : 2);
    }
  }

  // ------------------------------------------------------------------ toque e arrasto
  function celulaDoEvento(ev) {
    const cv = $('#jogoCanvas'), r = cv.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * cv.width, y = (ev.clientY - r.top) / r.height * cv.height;
    return [Math.floor((x - MARGEM) / CEL), Math.floor((y - MARGEM) / CEL), r.width / cv.width * CEL];
  }
  function ligar() {
    const cv = $('#jogoCanvas');
    cv.addEventListener('pointerdown', ev => {
      if (!J || J.estado !== 'jogando') return;
      const [x, y, celPx] = celulaDoEvento(ev);
      if (J.martelo) {
        const k = chave(x, y), ci = J.gatos.get(k);
        if (ci === undefined) return;
        const pc = J.pecas.find(p => p.cor === ci && !p.cheia);
        J.gatos.delete(k); J.martelo = false;
        if (pc) { pc.cap--; voar(x, y, pc); if (pc.cap <= 0) completar(pc); }
        KM.tocar('pulo'); atualizarHud(); return;
      }
      const pc = J.pecas.find(p => !p.cheia && celulas(p).some(([a, b]) => a === x && b === y));
      if (!pc) return;
      try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* toque sintético */ }
      J.arrasto = { pc, x0: ev.clientX, y0: ev.clientY, px: pc.x, py: pc.y, celPx, eixo: pc.eixo, mexeu: false };
      J.dica = null; KM.tocar('clique');
    });
    cv.addEventListener('pointermove', ev => {
      if (!J || !J.arrasto || J.estado !== 'jogando') return;
      const a = J.arrasto, pc = a.pc;
      const dxp = (ev.clientX - a.x0) / a.celPx, dyp = (ev.clientY - a.y0) / a.celPx;
      if (!a.eixo) { if (Math.abs(dxp) > 0.35 || Math.abs(dyp) > 0.35) a.eixo = Math.abs(dxp) >= Math.abs(dyp) ? 'h' : 'v'; else return; }
      const alvoX = a.eixo === 'h' ? a.px + Math.round(dxp) : a.px, alvoY = a.eixo === 'v' ? a.py + Math.round(dyp) : a.py;
      // trava o eixo de novo se o dedo voltar ao ponto inicial
      if (!pc.eixo && Math.round(dxp) === 0 && Math.round(dyp) === 0) a.eixo = null;
      let guarda = 20;
      while ((pc.x !== alvoX || pc.y !== alvoY) && guarda-- > 0 && !pc.cheia) {
        const sx = Math.sign(alvoX - pc.x), sy = Math.sign(alvoY - pc.y);
        if (!moverUmPasso(pc, sx, sy)) break;
        a.mexeu = true;
      }
    });
    const soltar = () => { if (J && J.arrasto) { if (J.arrasto.mexeu) J.jogadas++; J.arrasto = null; } };
    cv.addEventListener('pointerup', soltar); cv.addEventListener('pointercancel', soltar);

    $('#jogoSair').addEventListener('click', fecharJogo);
    $('#jogoReiniciar').addEventListener('click', () => J && abrir(J.fase));
    $('#jogoAnterior').addEventListener('click', () => J && J.fase > 1 && abrir(J.fase - 1));
    $('#fimBotao').addEventListener('click', () => { if (!J) return; abrir($('#jogoFim').dataset.tipo === 'venceu' ? J.fase + 1 : J.fase); });
    $('#btGelo').addEventListener('click', () => usarReforco(20, () => { J.gelo = 20; KM.tocar('magia'); A().toast('❄️ Tempo congelado por 20 segundos!'); }));
    $('#btMartelo').addEventListener('click', () => { if (!J || J.estado !== 'jogando') return; if (J.martelo) { J.martelo = false; atualizarHud(); return; } usarReforco(30, () => { J.martelo = true; A().toast('🔨 Toque num gatinho para mandá-lo direto para a caminha dele.'); }); });
    $('#btDica').addEventListener('click', () => {
      if (!J || J.estado !== 'jogando' || J.dicas <= 0) return;
      const passo = J.solucao.find(s => J.pecas.some(p => p.id === s.id));
      if (!passo) return;
      const pc = J.pecas.find(p => p.id === passo.id);
      const naOrigem = pc.x === pc.ini[0] && pc.y === pc.ini[1];
      J.dica = { id: pc.id, dir: naOrigem && passo.movs[0] ? passo.movs[0][0] : null };
      J.dicas--; atualizarHud(); KM.tocar('notif');
      if (!naOrigem) A().toast('💡 Comece por esta caminha piscando.');
    });
    $('#btJogarCasa').addEventListener('click', () => abrir());
    $('#btSalaJogos').addEventListener('click', () => (A().estado.luzJogos ? apagar() : acender()));
  }
  function usarReforco(preco, fn) {
    if (!J || J.estado !== 'jogando') return;
    const cfg = A().cfg();
    if (cfg.economia.caixa < preco) return A().toast(`Precisa de R$ ${preco} no caixa. Mande a equipe trabalhar para ganhar mais 💼`, { erro: true });
    cfg.economia.caixa -= preco; A().estado.caixa = cfg.economia.caixa; A().animarCaixa(); A().salvar();
    fn(); atualizarHud();
  }

  KM.jogos = {
    iniciar() { ligar(); atualizarBotao(); },
    desenharArea, cliqueArea, acender, apagar, abrir, fecharJogo,
    sobre: (x, y) => naArea(x, y) || !!alvoEm(x, y),
    entrar: acender, sair: apagar,
    gerarFase, celulas, estadoJogo: () => J, _quadro: t => { cancelAnimationFrame(raf); loop(t); },
  };
})();
