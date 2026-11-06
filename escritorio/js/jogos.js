/* KWIK Mini Escritório · Sala de Jogos (um dos cômodos do prédio) + mini jogo "Gatinhos em Casa".
   A sala começa apagada; ao tocar nela a luz acende e quem está livre vai jogar sinuca, pingue-pongue ou cartas.
   Os móveis são desenhados em cena.js; aqui ficam a luz, o letreiro, as bolinhas e quem vai jogar.
   O mini jogo "Gatinhos em Casa" (caminhas, cestas, cercas, níveis difíceis) fica em js/gatinhos.js. */
(function () {
  const KM = window.KM;
  const $ = s => document.querySelector(s);
  const A = () => KM.app;

  // ------------------------------------------------------------------ desenho (partes que mudam)
  let luzK = 0, bola = 0;
  const sala = () => KM.LAYOUT && KM.LAYOUT.salas.jogos;
  const movel = tipo => KM.LAYOUT.moveis.find(m => m.sala === 'jogos' && m.tipo === tipo);
  const r = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

  function desenharFundo(ctx, cfg, estado, t) {
    const s = sala(); if (!s) return;
    luzK += ((estado.luzJogos ? 1 : 0) - luzK) * 0.15;
    bola += 0.08;
    const on = luzK > 0.5;
    const neon = KM.LAYOUT.decor.find(d => d.tipo === 'neon');
    if (neon) {
      const pisca = on && Math.floor(t * 3) % 9 !== 0;
      r(ctx, neon.X, neon.Y + 2, 40, 11, '#16102a');
      KM.texto(ctx, 'KWIK', neon.X + 3, neon.Y + 5, pisca ? '#ff4fd8' : '#4a2a50');
      KM.texto(ctx, 'PLAY', neon.X + 21, neon.Y + 5, pisca ? '#3fb6ff' : '#1d3a50');
    }
    const fl = movel('fliperama');
    if (fl) {
      const x = fl.X + 2, y = fl.Y + fl.d - fl.h + 3;
      r(ctx, x, y, fl.w - 4, 8, '#0b1020');
      if (on) { const f = Math.floor(t * 2) % 4; for (let i = 0; i < 3; i++) r(ctx, x + 1 + i * 3, y + 2 + ((i + f) % 2), 2, 2, CORES[(i + f) % 5]); r(ctx, x + 1, y + 6, fl.w - 6, 1, '#ffffff'); }
      r(ctx, fl.X + 1, fl.Y - fl.h + 1, fl.w - 2, 2, on && Math.floor(t * 4) % 2 ? '#ff4fd8' : '#7a3a8a');
    }
  }

  function desenharFrente(ctx, cfg, estado, t) {
    const s = sala(); if (!s) return;
    const on = luzK > 0.5;
    const sn = movel('sinuca');
    if (sn) r(ctx, sn.X + 8 + Math.abs(Math.sin(bola * 0.7)) * 10, sn.Y - sn.h + 11, 2, 2, '#ffffff');
    const dupla = Object.values(estado.pessoas || {}).filter(p => p.jogando && (p.lugarJogo === 'pingA' || p.lugarJogo === 'pingB'));
    const pg = movel('pingue');
    if (pg && dupla.length === 2) {
      const k = (Math.sin(bola * 1.6) + 1) / 2, x = pg.X - 2 + k * (pg.w + 4), z = Math.abs(Math.sin(bola * 3.2)) * 8;
      r(ctx, x, pg.Y - pg.h + (pg.d >> 1) - 1 - z, 2, 2, '#ffffff');
    }
    const W = s.w, H = s.h;
    if (luzK < 0.99) { ctx.fillStyle = `rgba(8,6,22,${0.72 * (1 - luzK)})`; ctx.fillRect(s.x, s.y, W, H); }
    if (on) { ctx.fillStyle = 'rgba(255,224,102,0.06)'; ctx.fillRect(s.fx + 40, s.fy + 20, 60, 44); ctx.fillRect(s.fx + 84, s.fy + 54, 44, 36); }
    if (!estado.luzJogos && luzK < 0.1) {
      const cx = s.fx + 68, cy = s.fy + 68, pisca = Math.floor(t * 2) % 2;
      r(ctx, cx - 3, cy - 14, 7, 7, pisca ? '#ffe066' : '#8a7a3a'); r(ctx, cx - 2, cy - 7, 5, 2, '#adb5bd');
      KM.texto(ctx, 'TOQUE AQUI', cx - 19, cy, pisca ? '#ff8ae6' : '#b37bd1');
    }
  }

  function naArea(x, y) { const s = sala(); return !!s && x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h; }
  const alvoEm = (x, y) => {
    const fl = KM.LAYOUT && movel('fliperama');
    if (fl && x >= fl.X - 2 && x <= fl.X + fl.w + 2 && y >= fl.Y - fl.h - 2 && y <= fl.Y + fl.d + 2) return 'fliperama';
    for (const tipo of ['sinuca', 'pingue', 'mesaCartas']) { const m = KM.LAYOUT && movel(tipo); if (m && x >= m.X && x <= m.X + m.w && y >= m.Y - m.h && y <= m.Y + m.d) return tipo; }
    return null;
  };

  // ------------------------------------------------------------------ luz + funcionários entrando
  const FALAS = { sinuca: ['Bola sete na caçapa! 🎱', 'Essa foi de efeito 😎'], sinuca2: ['Minha vez! 🎱', 'Errei de propósito 😅'], pingA: ['Ponto meu! 🏓', 'Saque!'], pingB: ['Devolve essa! 🏓', 'Quase! 😅'], cartas: ['Mais duas cartas pra você! 😂', 'Bati! 🃏'] };

  function escolherLugares(ps) {
    const out = new Map(), ordem = ['pingA', 'pingB', 'cartas', 'sinuca2'];
    const leo = ps.find(p => p.funcao === 'noticias');
    if (leo) out.set(leo, 'sinuca');
    const outros = ps.filter(p => p !== leo);
    if (outros.length === 1) out.set(outros[0], leo ? 'cartas' : 'sinuca');
    else outros.forEach((p, i) => { if (ordem[i]) out.set(p, ordem[i]); });
    return out;
  }

  async function brincar(p, lugar) {
    const L = KM.LAYOUT.pontos.jogos[lugar], m = KM.mov;
    p.acao = 'rotina'; p.lugarJogo = lugar;
    try {
      await m.irAte(p, L.X, L.Y);
      if (!p.pararRotina) {
        p.dir = L.dir; p.prop = L.prop || null; p.jogando = true; p.est = {};
        let n = 0;
        while (!p.pararRotina) {
          n++;
          if (lugar.startsWith('ping')) p.est = { bracos: n % 2 ? 'aceno' : 'baixo', aceno: n % 2, boca: 'sorriso' };
          else if (lugar.startsWith('sinuca')) p.est = { dy: n % 4 === 0 ? 1 : 0, boca: n % 6 === 0 ? 'o' : 'sorriso' };
          else p.est = { boca: n % 5 === 0 ? 'sorriso' : 'normal', olhos: n % 7 === 0 ? 'feliz' : undefined };
          if (Math.random() < 0.06) m.fala(p, FALAS[lugar][Math.floor(Math.random() * 2)], 2000);
          await KM.esperar(520);
        }
      }
    } finally {
      p.jogando = false; p.prop = null; p.est = {};
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
    const livres = Object.values(est.pessoas).filter(p => !p.trabalhando && (!p.acao || p.acao === 'soneca' || p.acao === 'rotina'));
    livres.forEach(p => { if (p.acao === 'soneca') p.dormindo = false; });
    Promise.all(livres.map(p => KM.pararRotina(p))).then(() => {
      const lugares = escolherLugares(livres.filter(p => !p.acao && !p.trabalhando));
      let atraso = 0;
      for (const [p, l] of lugares) { setTimeout(() => brincar(p, l), atraso); atraso += 450; }
      if (lugares.size) A().falar([...lugares.keys()][0].id, 'Oba, sala de jogos! 🎮', 2200);
      else A().toast('A equipe está ocupada agora — mas você pode jogar no fliperama 🐱');
    });
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
    b.innerHTML = A().estado.luzJogos ? '🌙<small>Apagar</small>' : '💡<small>Jogos</small>';
  }
  // Clique na cena: devolve true se foi na sala de jogos.
  function cliqueArea(x, y) {
    if (!naArea(x, y)) return false;
    const est = A().estado;
    if (!est.luzJogos) { acender(); return true; }
    const alvo = alvoEm(x, y);
    if (alvo === 'fliperama') abrir();
    else if (alvo) A().toast('🕹️ Os mini jogos ficam no fliperama (no canto da sala). A sinuca e as cartas chegam numa próxima atualização!');
    return true;
  }
  function renderPainel() {
    const g = KM.gatinhos.progresso();
    $('#casaFase').textContent = g.fase || 1;
    $('#casaEstrelas').textContent = Object.values(g.estrelas || {}).reduce((s, v) => s + v, 0);
  }


  // ------------------------------------------------------------------ mini jogo (js/gatinhos.js)
  const CORES = ['#ff5a5f', '#ffc61a', '#3d9bff', '#3ccf6e', '#a66cff'];
  function abrir(fase) { KM.gatinhos.abrir(fase); }
  function fecharJogo() { KM.gatinhos.fechar(); renderPainel(); }

  KM.jogos = {
    iniciar() {
      KM.gatinhos.ligar();
      $('#btJogarCasa').addEventListener('click', () => abrir());
      $('#btSalaJogos').addEventListener('click', () => (A().estado.luzJogos ? apagar() : acender()));
      atualizarBotao();
    },
    desenharFundo, desenharFrente, cliqueArea, acender, apagar, abrir, fecharJogo, renderPainel,
    sobre: (x, y) => naArea(x, y) || !!alvoEm(x, y),
    entrar: acender, sair: apagar,
  };
})();