/* KWIK Mini Escritório · mini jogo "Gatinhos em Casa" (fliperama da Sala de Jogos).
   Jogo original de quebra-cabeça:
   - arraste as caminhas coloridas (formatos em L, T, barra, quadrado…) pelo tabuleiro, para qualquer lado;
   - quando a caminha passa por cima de gatinhos da MESMA cor, eles pulam para dentro; o número é quantos faltam;
     caminha cheia vai embora;
   - gatinhos de outra cor, outras caminhas, buracos e cercas bloqueiam o caminho;
   - cestas na borda guardam mais gatinhos: quando a casa da frente fica livre, sai o próximo (o número é quantos restam);
   - cercas abrem depois que algumas caminhas forem para casa (o cadeado mostra quantas faltam);
   - caminhas com seta só andam naquela direção;
   - corra contra o relógio. Níveis 5, 15, 25… são DIFÍCEIS e 10, 20, 30… MUITO DIFÍCEIS (menos tempo, mais peças).
   Os níveis são gerados simulando uma solução, então sempre têm saída. */
(function () {
  const KM = window.KM;
  const $ = s => document.querySelector(s);
  const A = () => KM.app;

  const CORES = ['#ff5a5f', '#ffc61a', '#3d9bff', '#3ccf6e', '#a66cff', '#ff8a2a', '#ff6fb5', '#1fc8b8', '#9ad82f', '#b07a52'];
  const NOMES_COR = ['vermelho', 'amarelo', 'azul', 'verde', 'roxo', 'laranja', 'rosa', 'turquesa', 'limão', 'marrom'];
  const COLS = 7, LINHAS = 9, CEL = 40, BORDA = 30;
  const W = COLS * CEL + BORDA * 2, H = LINHAS * CEL + BORDA * 2;
  const FORMAS = {
    I2: [[0, 0], [1, 0]], I2v: [[0, 0], [0, 1]], I3: [[0, 0], [1, 0], [2, 0]], I3v: [[0, 0], [0, 1], [0, 2]],
    L3: [[0, 0], [0, 1], [1, 1]], J3: [[1, 0], [1, 1], [0, 1]], L3b: [[0, 0], [1, 0], [0, 1]], J3b: [[0, 0], [1, 0], [1, 1]],
    O4: [[0, 0], [1, 0], [0, 1], [1, 1]], I4v: [[0, 0], [0, 1], [0, 2], [0, 3]], I4: [[0, 0], [1, 0], [2, 0], [3, 0]],
    L4: [[0, 0], [0, 1], [0, 2], [1, 2]], J4: [[1, 0], [1, 1], [1, 2], [0, 2]], L4h: [[0, 0], [1, 0], [2, 0], [0, 1]], J4h: [[0, 0], [1, 0], [2, 0], [2, 1]],
    T4: [[0, 0], [1, 0], [2, 0], [1, 1]], T4v: [[0, 0], [0, 1], [0, 2], [1, 1]], S4: [[1, 0], [2, 0], [0, 1], [1, 1]], Z4v: [[0, 0], [0, 1], [1, 1], [1, 2]],
    L5: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], T5: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]], U5: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]], Mais: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
  };
  const POOL = [
    ['I2', 'I2v', 'I3', 'I3v', 'L3', 'J3', 'L3b', 'J3b'],
    ['I3', 'I3v', 'L3', 'J3', 'O4', 'I4v', 'L4', 'J4', 'L4h', 'J4h', 'T4', 'T4v'],
    ['L3', 'J3b', 'O4', 'I4', 'I4v', 'L4', 'J4', 'L4h', 'J4h', 'T4', 'T4v', 'S4', 'Z4v', 'L5', 'T5', 'U5', 'Mais'],
  ];
  const DIRS = { d: [1, 0], e: [-1, 0], b: [0, 1], c: [0, -1] };
  const chave = (x, y) => x + ',' + y;
  const celulas = pc => FORMAS[pc.forma].map(([x, y]) => [pc.x + x, pc.y + y]);
  function aleatorio(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const dificuldade = n => (n % 10 === 0 ? 2 : n % 5 === 0 ? 1 : 0);

  // ------------------------------------------------------------------ gerador de fases (sempre com solução)
  // cerca: { tipo: 'h' (entre a linha a-1 e a) | 'v' (entre a coluna a-1 e a), a, b0, b1, abre }
  function cruzaCerca(cercas, completas, x, y, dx, dy) {
    for (const c of cercas) {
      if (completas >= c.abre) continue;
      if (dy && c.tipo === 'h' && c.a === (dy > 0 ? y + 1 : y) && x >= c.b0 && x <= c.b1) return true;
      if (dx && c.tipo === 'v' && c.a === (dx > 0 ? x + 1 : x) && y >= c.b0 && y <= c.b1) return true;
    }
    return false;
  }
  function gerarFase(n) {
    const dif = dificuldade(n);
    const nivelPool = n <= 2 ? 0 : n <= 7 ? 1 : 2;
    const qtdBase = Math.min(7, 3 + Math.floor((n - 1) / 5)) + dif;
    for (let tent = 0; tent < 900; tent++) {
      const rnd = aleatorio(n * 7919 + tent * 104729 + 17), ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
      const qtd = Math.max(3, Math.min(8, qtdBase - Math.floor(tent / 150)));
      // buracos
      const buracos = new Set();
      const nb = n < 4 ? 0 : Math.min(5, Math.floor((n - 2) / 4) + dif) - Math.floor(tent / 300);
      for (let i = 0; i < nb; i++) buracos.add(chave(ri(0, COLS - 1), ri(0, LINHAS - 1)));
      // cercas
      const cercas = [];
      const nc = n < 6 ? 0 : n < 15 ? 1 : 2;
      for (let i = 0; i < nc; i++) {
        const tipo = rnd() < 0.7 ? 'h' : 'v', lim = tipo === 'h' ? LINHAS : COLS, larg = tipo === 'h' ? COLS : LINHAS;
        const comp = ri(2, 4), b0 = ri(0, larg - comp);
        cercas.push({ tipo, a: ri(2, lim - 2), b0, b1: b0 + comp - 1, abre: ri(1, Math.min(3, qtd - 1)) });
      }
      // peças
      const cores = [...CORES.keys()].sort(() => rnd() - 0.5);
      const pecas = [], ocup = new Set();
      let ok = true;
      for (let i = 0; i < qtd && ok; i++) {
        let colocou = false;
        for (let k = 0; k < 80; k++) {
          const forma = POOL[nivelPool][ri(0, POOL[nivelPool].length - 1)];
          const cs0 = FORMAS[forma], w = Math.max(...cs0.map(c => c[0])) + 1, h = Math.max(...cs0.map(c => c[1])) + 1;
          const pc = { id: i, forma, cor: cores[i % cores.length], x: ri(0, COLS - w), y: ri(0, LINHAS - h), eixo: n >= 8 && rnd() < 0.2 ? (rnd() < 0.5 ? 'h' : 'v') : null };
          const cs = celulas(pc);
          if (cs.some(([x, y]) => ocup.has(chave(x, y)) || buracos.has(chave(x, y)))) continue;
          cs.forEach(([x, y]) => ocup.add(chave(x, y)));
          pecas.push(pc); colocou = true; break;
        }
        ok = colocou;
      }
      if (!ok) continue;
      const inicio = new Set(ocup), gatos = new Map(), varridas = new Set(), solucao = [], cestas = [];
      const presentes = new Set(pecas.map(p => p.id));
      const ordem = pecas.slice().sort(() => rnd() - 0.5);
      const maxCestas = n < 3 ? 0 : Math.min(4, 1 + Math.floor((n - 3) / 6) + dif);
      const capMax = Math.min(7, 3 + Math.floor(n / 6));
      for (let k = 0; k < ordem.length && ok; k++) {
        const pc = ordem[k], sim = { ...pc }, cobertas = new Set(celulas(sim).map(c => chave(...c))), movs = [];
        const outras = new Set(); for (const q of pecas) if (q !== pc && presentes.has(q.id)) celulas(q).forEach(c => outras.add(chave(...c)));
        const livre = (x, y) => x >= 0 && y >= 0 && x < COLS && y < LINHAS && !outras.has(chave(x, y)) && !buracos.has(chave(x, y));
        const podeMover = (p, dx, dy) => celulas(p).every(([x, y]) => livre(x + dx, y + dy) && !cruzaCerca(cercas, k, x, y, dx, dy));
        const passos = ri(1, 3 + (n > 10 ? 1 : 0));
        for (let s = 0; s < passos; s++) {
          const dirs = Object.keys(DIRS).filter(d => !sim.eixo || (sim.eixo === 'h' ? 'de'.includes(d) : 'bc'.includes(d)));
          const d = dirs[ri(0, dirs.length - 1)], [dx, dy] = DIRS[d];
          let max = 0; while (max < 7 && podeMover({ ...sim, x: sim.x + dx * max, y: sim.y + dy * max }, dx, dy)) max++;
          if (!max) continue;
          const dist = ri(1, max);
          for (let q = 1; q <= dist; q++) celulas({ ...sim, x: sim.x + dx * q, y: sim.y + dy * q }).forEach(c => cobertas.add(chave(...c)));
          sim.x += dx * dist; sim.y += dy * dist; movs.push([d, dist]);
        }
        // cesta na borda (a caminha termina em cima da casa da frente da cesta)
        let naCesta = 0;
        if (cestas.length < maxCestas && rnd() < 0.55) {
          const borda = celulas(sim).map(([x, y]) => [x, y, x === 0 ? 'e' : x === COLS - 1 ? 'd' : y === 0 ? 'c' : y === LINHAS - 1 ? 'b' : null]).filter(c => c[2]);
          const cand = borda.filter(([x, y]) => !varridas.has(chave(x, y)) && !gatos.has(chave(x, y)) && !cestas.some(c => c.x === x && c.y === y));
          if (cand.length) {
            const [ex, ey, lado] = cand[ri(0, cand.length - 1)];
            let extra = 0;
            const quer = ri(0, n >= 10 ? 2 : 1);
            for (let w = 0; w < quer; w++) { // sai de cima e volta (para pegar o próximo da cesta)
              const d = Object.keys(DIRS).filter(dd => !sim.eixo || (sim.eixo === 'h' ? 'de'.includes(dd) : 'bc'.includes(dd))).find(dd => {
                const [dx, dy] = DIRS[dd], nova = { ...sim, x: sim.x + dx, y: sim.y + dy };
                return podeMover(sim, dx, dy) && !celulas(nova).some(([x, y]) => x === ex && y === ey);
              });
              if (!d) break;
              const [dx, dy] = DIRS[d];
              celulas({ ...sim, x: sim.x + dx, y: sim.y + dy }).forEach(c => cobertas.add(chave(...c)));
              movs.push([d, 1], [{ d: 'e', e: 'd', c: 'b', b: 'c' }[d], 1]);
              extra++;
            }
            // cada vez que a caminha ENTRA na casa da cesta ela pega 1 gatinho (o próximo sai quando a casa fica livre)
            const cobreE = p => celulas(p).some(([x, y]) => x === ex && y === ey);
            let rep = { ...pc }, dentro = cobreE(rep);
            for (const [d, dist] of movs) for (let q = 0; q < dist; q++) { rep = { ...rep, x: rep.x + DIRS[d][0], y: rep.y + DIRS[d][1] }; const c = cobreE(rep); if (c && !dentro) naCesta++; dentro = c; }
            if (naCesta) cestas.push({ x: ex, y: ey, lado, fila: Array(naCesta).fill(pc.cor), dona: pc.id });
          }
        }
        const cestaCel = new Set(cestas.map(c => chave(c.x, c.y)));
        const cand = [...cobertas].filter(q => !inicio.has(q) && !varridas.has(q) && !gatos.has(q) && !cestaCel.has(q));
        const forma = FORMAS[pc.forma].length;
        let normais = Math.min(cand.length, ri(naCesta ? 1 : 2, Math.min(capMax, forma + 2)));
        if (normais + naCesta < 2) { ok = false; break; }
        cand.sort(() => rnd() - 0.5).slice(0, normais).forEach(q => gatos.set(q, pc.cor));
        pc.cap = normais + naCesta;
        cobertas.forEach(q => varridas.add(q));
        presentes.delete(pc.id);
        solucao.push({ id: pc.id, movs });
      }
      if (!ok) continue;
      if (n >= 3 && maxCestas && !cestas.length && tent < 450) continue; // a partir do nível 3 quase sempre tem cesta
      if (nc && cercas.some(c => c.abre > qtd - 1)) continue;
      const total = pecas.reduce((s, p) => s + p.cap, 0);
      const tempo = Math.round((28 + total * 3.6 + qtd * 7) * (dif === 2 ? 0.72 : dif === 1 ? 0.84 : 1) / 5) * 5;
      return { n, dif, pecas: pecas.map(p => ({ ...p, ini: [p.x, p.y] })), gatos, cestas, cercas, buracos, solucao, tempo };
    }
    return null;
  }

  // ------------------------------------------------------------------ estado do jogo
  let J = null, raf = 0, ultimo = 0, cv = null, g = null, escala = 1, dpr = 1;
  const progresso = () => { const c = A().cfg(); c.jogos = c.jogos || {}; c.jogos.gatil = c.jogos.gatil || { fase: 1, estrelas: {} }; return c.jogos.gatil; };

  function abrir(fase) {
    const prog = progresso();
    const n = Math.max(1, fase || prog.fase || 1);
    const f = gerarFase(n);
    if (!f) return A().toast('Não consegui montar essa fase 😅', { erro: true });
    J = {
      fase: n, dif: f.dif, pecas: f.pecas.map(p => ({ ...p, vx: p.x, vy: p.y })), gatos: new Map(f.gatos), cestas: f.cestas.map(c => ({ ...c, fila: c.fila.slice() })),
      cercas: f.cercas.map(c => ({ ...c })), buracos: f.buracos, base: f, solucao: f.solucao, tempo: f.tempo, total: f.tempo,
      gelo: 0, arrasto: null, voos: [], saindo: [], parts: [], estado: 'jogando', ferramenta: null, dicas: 3, dica: null, completas: 0, pausado: false, extra: 0,
    };
    A().estado.jogando = true;
    document.body.classList.add('jogando');
    $('#casaNivel').textContent = n;
    const tag = $('#casaDificil');
    tag.hidden = !f.dif; tag.textContent = f.dif === 2 ? '💀💀 MUITO DIFÍCIL' : '💀 DIFÍCIL';
    $('#telaJogo').classList.toggle('dificil', !!f.dif);
    $('#jogoFim').hidden = true;
    atualizarHud();
    cancelAnimationFrame(raf); ultimo = performance.now(); raf = requestAnimationFrame(loop);
    KM.tocar('magia');
    if (n === 1 && !prog.viuTutorial) { prog.viuTutorial = true; A().salvar(); setTimeout(() => A().toast('🐱 Arraste as caminhas para cima dos gatinhos da mesma cor. Cestas soltam mais gatinhos e cercas abrem depois!', { ms: 9000 }), 600); }
  }
  function fechar() {
    if (!J) return;
    J = null; A().estado.jogando = false; document.body.classList.remove('jogando');
    cancelAnimationFrame(raf);
    KM.jogos && KM.jogos.renderPainel && KM.jogos.renderPainel();
  }
  const fmtT = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  function atualizarHud() {
    if (!J) return;
    const s = Math.max(0, Math.ceil(J.tempo));
    $('#casaTempo').textContent = fmtT(s);
    $('#casaTempo').classList.toggle('alerta', s <= 15 && J.gelo <= 0);
    $('#casaTempo').classList.toggle('gelo', J.gelo > 0);
    $('#casaDicas').textContent = J.dicas;
    $('#casaMoedas').textContent = Math.floor(A().cfg().economia.caixa).toLocaleString('pt-BR');
    $('#btMartelo').classList.toggle('on', J.ferramenta === 'martelo');
    $('#btIma').classList.toggle('on', J.ferramenta === 'ima');
    $('#jogoPausa').textContent = J.pausado ? '▶' : '⏸';
  }

  // ------------------------------------------------------------------ regras
  const fechada = c => J.completas < c.abre;
  function livreParaPeca(pc, x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= LINHAS || J.buracos.has(chave(x, y))) return false;
    for (const q of J.pecas) if (q !== pc && !q.cheia && celulas(q).some(([a, b]) => a === x && b === y)) return false;
    const gt = J.gatos.get(chave(x, y));
    return gt === undefined || gt === pc.cor;
  }
  function moverUmPasso(pc, dx, dy) {
    if (pc.eixo === 'h' && dy) return false;
    if (pc.eixo === 'v' && dx) return false;
    const nova = { ...pc, x: pc.x + dx, y: pc.y + dy };
    if (!celulas(nova).every(([x, y]) => livreParaPeca(pc, x, y))) return false;
    if (celulas(pc).some(([x, y]) => cruzaCerca(J.cercas, J.completas, x, y, dx, dy))) { J.batida = { cerca: true, t: performance.now() }; return false; }
    pc.x = nova.x; pc.y = nova.y;
    KM.tocar('clique');
    for (const [x, y] of celulas(pc)) {
      const k = chave(x, y);
      if (J.gatos.get(k) === pc.cor && pc.cap > 0) { J.gatos.delete(k); pc.cap--; voar(x, y, pc); }
    }
    if (pc.cap <= 0 && !pc.cheia) completar(pc);
    return true;
  }
  function voar(x, y, pc) {
    J.voos.push({ cor: pc.cor, de: [x, y], pc, ini: performance.now() });
    miau();
  }
  function miau() { try { if (!KM.som.ligado) return; const ac = KM.som.ac; if (!ac) return KM.tocar('bip'); const o = ac.createOscillator(), gn = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(820 + Math.random() * 200, ac.currentTime); o.frequency.exponentialRampToValueAtTime(480, ac.currentTime + 0.22); gn.gain.setValueAtTime(0.05, ac.currentTime); gn.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.25); o.connect(gn).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.26); } catch (e) { /* sem som */ } }
  function completar(pc) {
    pc.cheia = true; if (J.arrasto && J.arrasto.pc === pc) J.arrasto = null;
    J.saindo.push({ pc, ini: performance.now() });
    KM.tocar('sucesso');
    const cs = celulas(pc);
    for (const [x, y] of cs) for (let i = 0; i < 6; i++) J.parts.push({ x: BORDA + (x + 0.5) * CEL, y: BORDA + (y + 0.5) * CEL, vx: (Math.random() - 0.5) * 220, vy: -Math.random() * 220, vida: 1, cor: CORES[pc.cor], estrela: i % 3 === 0 });
    setTimeout(() => {
      if (!J) return;
      J.pecas = J.pecas.filter(q => q !== pc);
      J.completas++;
      for (const c of J.cercas) if (J.completas === c.abre) { KM.tocar('magia'); A().toast('🔓 Uma cerca abriu!', { ms: 2200 }); }
      if (!J.pecas.length) vitoria();
    }, 450);
  }
  function soltarDasCestas() {
    for (const c of J.cestas) {
      if (!c.fila.length || c.saindo) continue;
      const k = chave(c.x, c.y);
      if (J.gatos.has(k)) continue;
      if (J.pecas.some(p => !p.cheia && celulas(p).some(([a, b]) => a === c.x && b === c.y))) continue;
      c.saindo = { cor: c.fila.shift(), ini: performance.now() };
      KM.tocar('pulo');
    }
  }
  function vitoria() {
    J.estado = 'venceu';
    const cfg = A().cfg(), prog = progresso();
    const fr = J.tempo / J.total, estrelas = J.extra ? 1 : fr > 0.45 ? 3 : fr > 0.2 ? 2 : 1, premio = estrelas * 10 + J.dif * 15;
    prog.estrelas[J.fase] = Math.max(prog.estrelas[J.fase] || 0, estrelas);
    prog.fase = Math.max(prog.fase || 1, J.fase + 1);
    cfg.economia.caixa += premio; A().estado.caixa = cfg.economia.caixa; A().animarCaixa(); A().salvar();
    for (let i = 0; i < 140; i++) J.parts.push({ x: Math.random() * W, y: -10 - Math.random() * 120, vx: (Math.random() - 0.5) * 60, vy: 40 + Math.random() * 80, vida: 3, cor: CORES[i % CORES.length], confete: true });
    fim('venceu', '⭐'.repeat(estrelas) + '☆'.repeat(3 - estrelas), 'Muito bem! 🎉', `Todos os gatinhos em casa no nível ${J.fase}! +R$ ${premio} no caixa do escritório 💰`, 'Próximo nível ▶');
    KM.tocar('caixa'); setTimeout(() => KM.tocar('sucesso'), 300);
    atualizarHud();
  }
  function fim(tipo, icone, titulo, texto, botao, extra) {
    $('#fimIcone').textContent = icone; $('#fimTitulo').textContent = titulo; $('#fimTexto').textContent = texto; $('#fimBotao').textContent = botao;
    $('#fimExtra').hidden = !extra; if (extra) $('#fimExtra').textContent = extra;
    $('#jogoFim').dataset.tipo = tipo; $('#jogoFim').hidden = false;
  }
  function pausar(sim) {
    if (!J || (J.estado !== 'jogando' && J.estado !== 'pausa')) return;
    J.pausado = sim === undefined ? !J.pausado : sim;
    J.estado = J.pausado ? 'pausa' : 'jogando';
    J.arrasto = null;
    if (J.pausado) fim('pausa', '⏸️', 'Jogo pausado', `Nível ${J.fase} · ${fmtT(Math.ceil(J.tempo))} restantes`, 'Continuar ▶', 'Recomeçar o nível 🔄');
    else $('#jogoFim').hidden = true;
    atualizarHud();
  }

  // ------------------------------------------------------------------ laço
  function loop(agora) {
    if (!J) return;
    const dt = Math.min(0.1, (agora - ultimo) / 1000); ultimo = agora;
    if (J.estado === 'jogando') {
      if (J.gelo > 0) J.gelo -= dt; else J.tempo -= dt;
      soltarDasCestas();
      if (J.tempo <= 0) {
        J.tempo = 0; J.estado = 'perdeu'; J.arrasto = null; KM.tocar('tchau');
        fim('perdeu', '⏰', 'O tempo acabou!', 'Os gatinhos ainda esperam pela caminha. Tente de novo ou compre mais tempo.', 'Tentar de novo 🔄', '+30 s por R$ 40 ⏱️');
      }
      atualizarHud();
    }
    for (const c of J.cestas) if (c.saindo && agora - c.saindo.ini > 260) {
      const em = J.pecas.find(p => !p.cheia && celulas(p).some(([a, b]) => a === c.x && b === c.y));
      if (em && em.cor === c.saindo.cor && em.cap > 0) { em.cap--; voar(c.x, c.y, em); if (em.cap <= 0) completar(em); } // pulou direto na caminha
      else if (!em && !J.gatos.has(chave(c.x, c.y))) J.gatos.set(chave(c.x, c.y), c.saindo.cor);
      else c.fila.unshift(c.saindo.cor);
      c.saindo = null;
    }
    // posição visual suave das caminhas
    for (const p of J.pecas) { p.vx += (p.x - p.vx) * Math.min(1, dt * 22); p.vy += (p.y - p.vy) * Math.min(1, dt * 22); }
    desenhar(agora, dt);
    raf = requestAnimationFrame(loop);
  }

  // ------------------------------------------------------------------ desenho
  function prepararCanvas() {
    cv = $('#jogoCanvas'); const caixa = $('#jogoArea');
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const esc = Math.max(0.4, Math.min((caixa.clientWidth - 10) / W, ((caixa.clientHeight || 480) - 10) / H));
    if (cv.width !== Math.round(W * esc * dpr)) { cv.width = Math.round(W * esc * dpr); cv.height = Math.round(H * esc * dpr); }
    cv.style.width = Math.round(W * esc) + 'px'; cv.style.height = Math.round(H * esc) + 'px';
    escala = esc;
    g = cv.getContext('2d');
    g.setTransform(esc * dpr, 0, 0, esc * dpr, 0, 0);
    g.imageSmoothingEnabled = true;
  }
  const rr = (x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
  const tomCor = (h, f) => KM.cor.tom(h, f);

  function desenharGato(cx, cy, s, ci, o = {}) {
    const cor = CORES[ci], esc = tomCor(cor, 0.72), cla = tomCor(cor, 1.3);
    g.save(); g.translate(cx, cy); g.scale(s, s);
    if (o.rot) g.rotate(o.rot);
    // corpo
    g.fillStyle = esc; g.beginPath(); g.ellipse(0, 9, 11, 8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = cor; g.beginPath(); g.ellipse(0, 8, 10, 7, 0, 0, Math.PI * 2); g.fill();
    // rabinho
    g.strokeStyle = esc; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(8, 10); g.quadraticCurveTo(16, 6 + Math.sin((o.t || 0) * 4 + cx) * 3, 13, -1); g.stroke();
    // orelhas
    for (const sx of [-1, 1]) {
      g.fillStyle = esc; g.beginPath(); g.moveTo(sx * 10, -6); g.lineTo(sx * 9, -17); g.lineTo(sx * 2, -10); g.closePath(); g.fill();
      g.fillStyle = '#ffb3c6'; g.beginPath(); g.moveTo(sx * 8.6, -8); g.lineTo(sx * 8.2, -14); g.lineTo(sx * 4, -10); g.closePath(); g.fill();
    }
    // cabeça
    g.fillStyle = esc; g.beginPath(); g.ellipse(0, -4, 12.5, 10.5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = cor; g.beginPath(); g.ellipse(0, -4.5, 11.5, 9.5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = cla; g.beginPath(); g.ellipse(-3, -9, 5, 2.5, -0.3, 0, Math.PI * 2); g.fill();
    // focinho claro
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(0, -1, 5.5, 3.6, 0, 0, Math.PI * 2); g.fill();
    // olhos
    if (o.feliz) { g.strokeStyle = '#2a1d16'; g.lineWidth = 1.8; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * 4.6, -5, 2.4, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } }
    else {
      const pisca = o.pisca;
      for (const sx of [-1, 1]) {
        g.fillStyle = '#2a1d16';
        if (pisca) g.fillRect(sx * 4.6 - 2.4, -5.4, 4.8, 1.4);
        else { g.beginPath(); g.ellipse(sx * 4.6, -5, 2.5, 3, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(sx * 4.6 - 0.8, -6.1, 0.95, 0, Math.PI * 2); g.fill(); }
      }
    }
    g.fillStyle = '#ff6b9a'; g.beginPath(); g.moveTo(-1.6, -2.2); g.lineTo(1.6, -2.2); g.lineTo(0, -0.6); g.closePath(); g.fill();
    g.strokeStyle = '#2a1d16'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -0.6); g.quadraticCurveTo(-1.6, 1.4, -3, 0.4); g.moveTo(0, -0.6); g.quadraticCurveTo(1.6, 1.4, 3, 0.4); g.stroke();
    // patinhas
    g.fillStyle = cla; g.beginPath(); g.ellipse(-4, 14, 3, 2, 0, 0, Math.PI * 2); g.ellipse(4, 14, 3, 2, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  function desenharPeca(pc, agora) {
    const sai = J.saindo.find(s => s.pc === pc), k = sai ? Math.min(1, (agora - sai.ini) / 430) : 0;
    const cs = FORMAS[pc.forma], set = new Set(cs.map(c => chave(...c)));
    const cor = CORES[pc.cor], esc = tomCor(cor, 0.62), cla = tomCor(cor, 1.28);
    const ativo = J.arrasto && J.arrasto.pc === pc, piscaDica = J.dica && J.dica.id === pc.id && Math.floor(agora / 250) % 2;
    const ox = BORDA + pc.vx * CEL, oy = BORDA + pc.vy * CEL - k * 30 - (ativo ? 3 : 0);
    g.save(); g.globalAlpha = 1 - k;
    const tem = (x, y) => set.has(chave(x, y)), pad = 3;
    // sombra
    if (ativo) { g.fillStyle = 'rgba(0,0,0,0.22)'; for (const [x, y] of cs) g.fillRect(ox + x * CEL + 2, oy + y * CEL + 8, CEL, CEL); }
    for (const [x, y] of cs) {
      const l = tem(x - 1, y) ? 0 : pad, r = tem(x + 1, y) ? 0 : pad, u = tem(x, y - 1) ? 0 : pad, d = tem(x, y + 1) ? 0 : pad;
      const rad = [!l || !u ? 0 : 10, !r || !u ? 0 : 10, !r || !d ? 0 : 10, !l || !d ? 0 : 10];
      const x0 = ox + x * CEL + l, y0 = oy + y * CEL + u, w = CEL - l - r, h = CEL - u - d;
      g.fillStyle = esc; rr(x0, y0, w, h, rad); g.fill();
      g.fillStyle = piscaDica ? tomCor(cor, 1.18) : cor; rr(x0 + (l ? 2 : 0), y0 + (u ? 2 : 0), w - (l ? 2 : 0) - (r ? 2 : 0), h - (u ? 2 : 0) - (d ? 4 : 0), rad.map(v => Math.max(0, v - 2))); g.fill();
      // interior (a "caminha")
      const ip = 6;
      g.fillStyle = tomCor(cor, 0.82);
      g.fillRect(ox + x * CEL + (l ? ip + l : 0), oy + y * CEL + (u ? ip + u : 0), CEL - (l ? ip + l : 0) - (r ? ip + r : 0), CEL - (u ? ip + u : 0) - (d ? ip + d + 2 : 0));
      if (u) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x0 + (l ? 6 : 0), y0 + 2, w - (l ? 6 : 0) - (r ? 6 : 0), 3); }
    }
    // borda clara por cima (brilho)
    g.fillStyle = cla; g.globalAlpha = (1 - k) * 0.35;
    for (const [x, y] of cs) if (!tem(x, y - 1)) g.fillRect(ox + x * CEL + 8, oy + y * CEL + 6, CEL - 16, 2);
    g.globalAlpha = 1 - k;
    // seta de direção
    if (pc.eixo) {
      const xs = cs.map(c => c[0]), ys = cs.map(c => c[1]);
      const cx = ox + (Math.min(...xs) + Math.max(...xs) + 1) * CEL / 2, cy = oy + (Math.min(...ys) + Math.max(...ys) + 1) * CEL / 2;
      g.save(); g.translate(cx, cy); if (pc.eixo === 'v') g.rotate(Math.PI / 2);
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.strokeStyle = esc; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-14, 0); g.lineTo(-7, -7); g.lineTo(-7, -3); g.lineTo(7, -3); g.lineTo(7, -7); g.lineTo(14, 0); g.lineTo(7, 7); g.lineTo(7, 3); g.lineTo(-7, 3); g.lineTo(-7, 7); g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
    // número de gatinhos que faltam
    const [ux, uy] = cs.reduce((a, b) => (b[1] > a[1] || (b[1] === a[1] && b[0] > a[0]) ? b : a));
    const bx = ox + (ux + 1) * CEL - 13, by = oy + (uy + 1) * CEL - 13;
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(bx, by, 10, 0, Math.PI * 2); g.fill();
    g.strokeStyle = esc; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#1c1612'; g.font = '900 13px Montserrat, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(Math.max(0, pc.cap)), bx, by + 1);
    if (J.ferramenta === 'ima' && Math.floor(agora / 300) % 2) { g.strokeStyle = '#ffd43b'; g.lineWidth = 3; for (const [x, y] of cs) g.strokeRect(ox + x * CEL + 2, oy + y * CEL + 2, CEL - 4, CEL - 4); }
    g.restore();
  }

  function desenharCesta(c, agora) {
    const L = c.lado, cx = BORDA + (c.x + 0.5) * CEL, cy = BORDA + (c.y + 0.5) * CEL;
    const [dx, dy] = { e: [-1, 0], d: [1, 0], c: [0, -1], b: [0, 1] }[L];
    const px = cx + dx * (CEL * 0.5 + 13), py = cy + dy * (CEL * 0.5 + 13);
    const w = dx ? 26 : 36, h = dx ? 36 : 26;
    g.fillStyle = 'rgba(0,0,0,0.25)'; rr(px - w / 2 + 2, py - h / 2 + 3, w, h, 7); g.fill();
    g.fillStyle = '#c47a3a'; rr(px - w / 2, py - h / 2, w, h, 7); g.fill();
    g.fillStyle = '#e09a55'; rr(px - w / 2 + 3, py - h / 2 + 3, w - 6, h - 6, 5); g.fill();
    g.strokeStyle = '#8a4f22'; g.lineWidth = 1.5;
    for (let i = 1; i < 3; i++) { g.beginPath(); if (dx) { g.moveTo(px - w / 2 + 3, py - h / 2 + i * h / 3); g.lineTo(px + w / 2 - 3, py - h / 2 + i * h / 3); } else { g.moveTo(px - w / 2 + i * w / 3, py - h / 2 + 3); g.lineTo(px - w / 2 + i * w / 3, py + h / 2 - 3); } g.stroke(); }
    if (c.fila.length) desenharGato(px, py - 2, 0.6, c.fila[0], { t: agora / 1000 });
    // contador
    const nx = px + (dx ? 0 : w / 2 - 4), ny = py + (dx ? h / 2 - 4 : h / 2 - 2);
    g.fillStyle = c.fila.length ? '#1c1612' : '#868e96'; g.beginPath(); g.arc(nx, ny, 8.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.font = '900 11px Montserrat, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(c.fila.length + (c.saindo ? 1 : 0)), nx, ny + 0.5);
    // gatinho pulando para fora
    if (c.saindo) {
      const k = Math.min(1, (agora - c.saindo.ini) / 260);
      desenharGato(px + (cx - px) * k, py + (cy - py) * k - Math.sin(k * Math.PI) * 16, 0.62 + 0.25 * k, c.saindo.cor, { feliz: true });
    }
  }

  function desenharCerca(c, agora) {
    if (!fechada(c)) return;
    const falta = c.abre - J.completas;
    g.save();
    let x0, y0, x1, y1;
    if (c.tipo === 'h') { x0 = BORDA + c.b0 * CEL + 3; x1 = BORDA + (c.b1 + 1) * CEL - 3; y0 = y1 = BORDA + c.a * CEL; }
    else { y0 = BORDA + c.b0 * CEL + 3; y1 = BORDA + (c.b1 + 1) * CEL - 3; x0 = x1 = BORDA + c.a * CEL; }
    const balanco = J.batida && J.batida.cerca && agora - J.batida.t < 300 ? Math.sin((agora - J.batida.t) / 20) * 2 : 0;
    g.lineCap = 'round';
    g.strokeStyle = '#5f3dc4'; g.lineWidth = 8; g.beginPath(); g.moveTo(x0, y0 + balanco); g.lineTo(x1, y1 + balanco); g.stroke();
    g.strokeStyle = '#b197fc'; g.lineWidth = 4; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(x0, y0 + balanco); g.lineTo(x1, y1 + balanco); g.stroke(); g.setLineDash([]);
    for (const [px, py] of [[x0, y0], [x1, y1]]) { g.fillStyle = '#4c2fa3'; g.beginPath(); g.arc(px, py, 6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#d0bfff'; g.beginPath(); g.arc(px - 1.5, py - 1.5, 2, 0, Math.PI * 2); g.fill(); }
    // cadeado com o número de caminhas que faltam
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + balanco;
    g.fillStyle = '#ffd43b'; rr(mx - 9, my - 6, 18, 14, 4); g.fill();
    g.strokeStyle = '#ffd43b'; g.lineWidth = 3; g.beginPath(); g.arc(mx, my - 6, 5, Math.PI, 0); g.stroke();
    g.fillStyle = '#1c1612'; g.font = '900 10px Montserrat, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(falta), mx, my + 1.5);
    g.restore();
  }

  function desenhar(agora, dt) {
    prepararCanvas();
    const t = agora / 1000;
    // moldura de madeira
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#6b3d1f'; rr(0, 0, W, H, 18); g.fill();
    g.fillStyle = '#8a5130'; rr(4, 4, W - 8, H - 8, 15); g.fill();
    g.fillStyle = '#5a321a'; rr(BORDA - 6, BORDA - 6, COLS * CEL + 12, LINHAS * CEL + 12, 10); g.fill();
    // casas
    for (let y = 0; y < LINHAS; y++) for (let x = 0; x < COLS; x++) {
      const px = BORDA + x * CEL, py = BORDA + y * CEL;
      if (J.buracos.has(chave(x, y))) {
        g.fillStyle = '#3d2210'; rr(px + 1, py + 1, CEL - 2, CEL - 2, 6); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(px + 4, py + 4, CEL - 8, 4);
        continue;
      }
      g.fillStyle = (x + y) % 2 ? '#c99563' : '#d4a271'; g.fillRect(px, py, CEL, CEL);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(px, py, CEL, 2);
      g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(px, py + CEL - 2, CEL, 2);
    }
    for (const c of J.cestas) desenharCesta(c, agora);
    // gatinhos no tabuleiro
    for (const [k, ci] of J.gatos) {
      const [x, y] = k.split(',').map(Number);
      const pulo = Math.floor(t * 1.5 + x * 0.7 + y * 1.3) % 6 === 0 ? -2 : 0;
      desenharGato(BORDA + (x + 0.5) * CEL, BORDA + (y + 0.5) * CEL + pulo + 1, 1, ci, { t, pisca: Math.floor(t * 2 + x * 3 + y) % 13 === 0 });
      if (J.ferramenta === 'martelo' && Math.floor(t * 4) % 2) { g.strokeStyle = '#ffd43b'; g.lineWidth = 3; rr(BORDA + x * CEL + 3, BORDA + y * CEL + 3, CEL - 6, CEL - 6, 8); g.stroke(); }
    }
    // caminhas (a que está sendo arrastada por último)
    const ord = J.pecas.slice().sort((a, b) => (J.arrasto && J.arrasto.pc === a ? 1 : 0) - (J.arrasto && J.arrasto.pc === b ? 1 : 0));
    for (const pc of ord) desenharPeca(pc, agora);
    for (const c of J.cercas) desenharCerca(c, agora);
    // gatinhos pulando para dentro da caminha
    J.voos = J.voos.filter(v => {
      const k = Math.min(1, (agora - v.ini) / 380);
      const cs = celulas(v.pc), alvo = cs.reduce((a, b) => (b[1] > a[1] || (b[1] === a[1] && b[0] > a[0]) ? b : a));
      const [x0, y0] = v.de, x = x0 + (alvo[0] - x0) * k, y = y0 + (alvo[1] - y0) * k;
      g.globalAlpha = 1 - k * 0.7;
      desenharGato(BORDA + (x + 0.5) * CEL, BORDA + (y + 0.5) * CEL - Math.sin(k * Math.PI) * 26, 1 - k * 0.45, v.cor, { feliz: true });
      g.globalAlpha = 1;
      if (k >= 1) for (let i = 0; i < 4; i++) J.parts.push({ x: BORDA + (alvo[0] + 0.5) * CEL, y: BORDA + (alvo[1] + 0.5) * CEL, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 80, vida: 0.6, cor: '#ffffff', estrela: true });
      return k < 1;
    });
    // dica: seta
    if (J.dica && J.dica.dir && J.pecas.some(p => p.id === J.dica.id)) {
      const pc = J.pecas.find(p => p.id === J.dica.id), [dx, dy] = DIRS[J.dica.dir], cs = celulas(pc);
      const cx = BORDA + (cs.reduce((s, c) => s + c[0], 0) / cs.length + 0.5) * CEL, cy = BORDA + (cs.reduce((s, c) => s + c[1], 0) / cs.length + 0.5) * CEL;
      const k = (t * 2) % 1;
      g.save(); g.translate(cx + dx * (14 + k * 14), cy + dy * (14 + k * 14)); g.rotate(Math.atan2(dy, dx));
      g.fillStyle = '#ffffff'; g.strokeStyle = '#1c1612'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(14, 0); g.lineTo(0, -11); g.lineTo(0, -5); g.lineTo(-12, -5); g.lineTo(-12, 5); g.lineTo(0, 5); g.lineTo(0, 11); g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
    // partículas (estrelinhas, confete)
    J.parts = J.parts.filter(p => {
      p.vy += (p.confete ? 30 : 380) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vida -= dt * (p.confete ? 0.35 : 1.4);
      g.globalAlpha = Math.max(0, Math.min(1, p.vida));
      g.fillStyle = p.cor;
      if (p.estrela) { g.save(); g.translate(p.x, p.y); g.rotate(p.vida * 6); g.fillRect(-3, -1, 6, 2); g.fillRect(-1, -3, 2, 6); g.restore(); }
      else g.fillRect(p.x, p.y, p.confete ? 5 : 4, p.confete ? 8 : 4);
      g.globalAlpha = 1;
      return p.vida > 0 && p.y < H + 20;
    });
    // gelo
    if (J.gelo > 0) { g.fillStyle = `rgba(165,216,255,${0.12 + 0.05 * Math.sin(t * 4)})`; rr(0, 0, W, H, 18); g.fill(); }
  }

  // ------------------------------------------------------------------ toque e arrasto
  function celulaDoEvento(ev) {
    const r = cv.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H;
    return [Math.floor((x - BORDA) / CEL), Math.floor((y - BORDA) / CEL), r.width / W * CEL];
  }
  function usarReforco(preco, fn) {
    if (!J || J.estado !== 'jogando') return false;
    const cfg = A().cfg();
    if (cfg.economia.caixa < preco) { A().toast(`Precisa de R$ ${preco} no caixa. Mande a equipe trabalhar para ganhar mais 💼`, { erro: true }); return false; }
    cfg.economia.caixa -= preco; A().estado.caixa = cfg.economia.caixa; A().animarCaixa(); A().salvar();
    fn(); atualizarHud(); return true;
  }
  function ligar() {
    cv = $('#jogoCanvas');
    cv.addEventListener('pointerdown', ev => {
      if (!J || J.estado !== 'jogando') return;
      ev.preventDefault();
      const [x, y, celPx] = celulaDoEvento(ev);
      if (J.ferramenta === 'martelo') {
        const k = chave(x, y), ci = J.gatos.get(k);
        if (ci === undefined) return;
        const pc = J.pecas.find(p => p.cor === ci && !p.cheia);
        if (!pc) return;
        J.gatos.delete(k); J.ferramenta = null;
        pc.cap--; voar(x, y, pc); if (pc.cap <= 0) completar(pc);
        KM.tocar('pulo'); atualizarHud(); return;
      }
      const pc = J.pecas.find(p => !p.cheia && celulas(p).some(([a, b]) => a === x && b === y));
      if (!pc) return;
      if (J.ferramenta === 'ima') { // puxa até 2 gatinhos dessa cor de qualquer lugar do tabuleiro
        let n = 0;
        for (const [k, ci] of [...J.gatos]) { if (n >= 2 || pc.cap <= 0) break; if (ci === pc.cor) { const [gx, gy] = k.split(',').map(Number); J.gatos.delete(k); pc.cap--; voar(gx, gy, pc); n++; } }
        J.ferramenta = null;
        if (!n) A().toast('Não tem gatinho dessa cor no tabuleiro agora 🧲');
        if (pc.cap <= 0) completar(pc);
        KM.tocar('magia'); atualizarHud(); return;
      }
      try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* toque sintético */ }
      J.arrasto = { pc, x0: ev.clientX, y0: ev.clientY, px: pc.x, py: pc.y, celPx };
      J.dica = null;
    });
    cv.addEventListener('pointermove', ev => {
      if (!J || !J.arrasto || J.estado !== 'jogando') return;
      const a = J.arrasto, pc = a.pc;
      let tx = a.px + Math.round((ev.clientX - a.x0) / a.celPx), ty = a.py + Math.round((ev.clientY - a.y0) / a.celPx);
      if (pc.eixo === 'h') ty = pc.y; if (pc.eixo === 'v') tx = pc.x;
      for (let guarda = 0; guarda < 24 && !pc.cheia && (pc.x !== tx || pc.y !== ty); guarda++) {
        const ddx = Math.sign(tx - pc.x), ddy = Math.sign(ty - pc.y);
        const primeiroX = Math.abs(tx - pc.x) >= Math.abs(ty - pc.y);
        const tentativas = primeiroX ? [[ddx, 0], [0, ddy]] : [[0, ddy], [ddx, 0]];
        let foi = false;
        for (const [sx, sy] of tentativas) if ((sx || sy) && moverUmPasso(pc, sx, sy)) { foi = true; break; }
        if (!foi) break;
      }
    });
    const soltar = () => { if (J) J.arrasto = null; };
    cv.addEventListener('pointerup', soltar); cv.addEventListener('pointercancel', soltar);
    window.addEventListener('resize', () => { if (J) prepararCanvas(); });

    $('#jogoSair').addEventListener('click', () => KM.jogos ? KM.jogos.fecharJogo() : fechar());
    $('#jogoReiniciar').addEventListener('click', () => J && abrir(J.fase));
    $('#jogoAnterior').addEventListener('click', () => J && J.fase > 1 && abrir(J.fase - 1));
    $('#jogoPausa').addEventListener('click', () => pausar());
    $('#fimBotao').addEventListener('click', () => {
      if (!J) return;
      const tipo = $('#jogoFim').dataset.tipo;
      if (tipo === 'pausa') return pausar(false);
      abrir(tipo === 'venceu' ? J.fase + 1 : J.fase);
    });
    $('#fimExtra').addEventListener('click', () => {
      if (!J) return;
      const tipo = $('#jogoFim').dataset.tipo;
      if (tipo === 'pausa') return abrir(J.fase);
      if (tipo === 'perdeu') {
        const cfg = A().cfg();
        if (cfg.economia.caixa < 40) return A().toast('Precisa de R$ 40 no caixa 💼', { erro: true });
        cfg.economia.caixa -= 40; A().estado.caixa = cfg.economia.caixa; A().animarCaixa(); A().salvar();
        J.tempo = 30; J.extra++; J.estado = 'jogando'; $('#jogoFim').hidden = true; KM.tocar('magia'); atualizarHud();
      }
    });
    $('#btGelo').addEventListener('click', () => usarReforco(20, () => { J.gelo = 15; KM.tocar('magia'); A().toast('❄️ Tempo congelado por 15 segundos!'); }));
    $('#btMartelo').addEventListener('click', () => { if (!J || J.estado !== 'jogando') return; if (J.ferramenta === 'martelo') { J.ferramenta = null; return atualizarHud(); } usarReforco(30, () => { J.ferramenta = 'martelo'; A().toast('🔨 Toque num gatinho para mandá-lo direto para a caminha dele.'); }); });
    $('#btIma').addEventListener('click', () => { if (!J || J.estado !== 'jogando') return; if (J.ferramenta === 'ima') { J.ferramenta = null; return atualizarHud(); } usarReforco(40, () => { J.ferramenta = 'ima'; A().toast('🧲 Toque numa caminha: ela puxa 2 gatinhos da cor dela.'); }); });
    $('#btDica').addEventListener('click', () => {
      if (!J || J.estado !== 'jogando' || J.dicas <= 0) return;
      const passo = J.solucao.find(s => J.pecas.some(p => p.id === s.id));
      if (!passo) return;
      const pc = J.pecas.find(p => p.id === passo.id);
      const naOrigem = pc.x === pc.ini[0] && pc.y === pc.ini[1];
      J.dica = { id: pc.id, dir: naOrigem && passo.movs[0] ? passo.movs[0][0] : null };
      J.dicas--; atualizarHud(); KM.tocar('notif');
      A().toast(naOrigem ? `💡 Comece pela caminha ${NOMES_COR[pc.cor]} piscando.` : `💡 Termine a caminha ${NOMES_COR[pc.cor]} piscando.`);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && J && J.estado === 'jogando') pausar(true); });
  }

  KM.gatinhos = { ligar, abrir, fechar, gerarFase, progresso, estado: () => J, celulas, CORES, _quadro: t => { cancelAnimationFrame(raf); loop(t); } };
})();
