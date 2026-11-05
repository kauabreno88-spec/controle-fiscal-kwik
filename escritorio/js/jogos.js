/* KWIK Mini Escritório · Sala de Jogos (um dos cômodos do prédio) + mini jogo "Gatinhos em Casa".
   A sala começa apagada; ao tocar nela a luz acende e quem está livre vai jogar sinuca, pingue-pongue ou cartas.
   Os móveis são desenhados em cena.js; aqui ficam a luz, o letreiro, as bolinhas e quem vai jogar.
   Gatinhos em Casa (jogo original): arraste as caminhas coloridas pelo tabuleiro; ao passar sobre gatinhos
   da mesma cor, eles pulam para dentro. O número é quantos ainda faltam. Caminha cheia vai embora. */
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
    const W = KM.RW, H = KM.RH;
    if (luzK < 0.99) { ctx.fillStyle = `rgba(8,6,22,${0.72 * (1 - luzK)})`; ctx.fillRect(s.x, s.y, W, H); }
    if (on) { ctx.fillStyle = 'rgba(255,224,102,0.06)'; ctx.fillRect(s.fx + 40, s.fy + 20, 60, 44); ctx.fillRect(s.fx + 84, s.fy + 54, 44, 36); }
    if (!estado.luzJogos && luzK < 0.1) {
      const cx = s.fx + 68, cy = s.fy + 68, pisca = Math.floor(t * 2) % 2;
      r(ctx, cx - 3, cy - 14, 7, 7, pisca ? '#ffe066' : '#8a7a3a'); r(ctx, cx - 2, cy - 7, 5, 2, '#adb5bd');
      KM.texto(ctx, 'TOQUE AQUI', cx - 19, cy, pisca ? '#ff8ae6' : '#b37bd1');
    }
  }

  function naArea(x, y) { const s = sala(); return !!s && x >= s.x && x <= s.x + KM.RW && y >= s.y && y <= s.y + KM.RH; }
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
    desenharFundo, desenharFrente, cliqueArea, acender, apagar, abrir, fecharJogo,
    sobre: (x, y) => naArea(x, y) || !!alvoEm(x, y),
    entrar: acender, sair: apagar,
    gerarFase, celulas, estadoJogo: () => J, _quadro: t => { cancelAnimationFrame(raf); loop(t); },
  };
})();
