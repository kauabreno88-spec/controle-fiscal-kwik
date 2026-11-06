/* KWIK Mini Escritório · Limpeza e manutenção.
   Funcionário sem tarefa de relatório: quando está livre ele circula pelo prédio passando pano no chão,
   limpando mesas, arrumando os computadores e fazendo a manutenção dos ar-condicionados.
   O botão "Trabalhar" dele faz uma faxina geral. Tudo é interrompido quando você manda alguém trabalhar
   ou aperta uma animação (as rotinas respeitam p.pararRotina). */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  KM.objetos = KM.objetos || [];
  KM.noChao = KM.noChao || [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sorteio = arr => arr[Math.floor(Math.random() * arr.length)];
  const parar = p => p.pararRotina || p.trabalhandoOutra;

  // ------------------------------------------------------------------ marcas no chão (molhado + brilho)
  const marcas = [];
  KM.noChao.push((ctx, t) => {
    const agora = performance.now();
    for (let i = marcas.length - 1; i >= 0; i--) {
      const m = marcas[i], k = (agora - m.ini) / m.dur;
      if (k >= 1) { marcas.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(116,192,252,${0.35 * (1 - k)})`;
      ctx.fillRect(Math.round(m.x - m.w / 2), Math.round(m.y - 2), m.w, 4);
      ctx.fillRect(Math.round(m.x - m.w / 2 + 2), Math.round(m.y - 3), m.w - 4, 6);
      if (Math.floor(t * 4 + m.x) % 5 === 0) { ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; ctx.fillRect(Math.round(m.x + rnd(-m.w / 2, m.w / 2)), Math.round(m.y - 1), 1, 1); }
    }
  });
  function cone(x, y) { // placa "piso molhado"
    const o = {
      Y: y, f: g => {
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x - 4, y - 1, 9, 2);
        g.fillStyle = '#fab005'; g.fillRect(x - 3, y - 9, 7, 9); g.fillRect(x - 2, y - 11, 5, 2); g.fillRect(x - 1, y - 12, 3, 1);
        g.fillStyle = '#1c1612'; g.fillRect(x, y - 8, 1, 3); g.fillRect(x, y - 4, 1, 1);
        g.fillStyle = '#f08c00'; g.fillRect(x - 4, y - 1, 9, 1);
      },
    };
    KM.objetos.push(o);
    return () => { const i = KM.objetos.indexOf(o); if (i >= 0) KM.objetos.splice(i, 1); };
  }
  function escada(p) { // escadinha para alcançar o ar-condicionado
    const o = {
      get Y() { return p.Y - 0.2; }, f: g => {
        const x = Math.round(p.X), y = Math.round(p.Y);
        g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x - 7, y - 1, 14, 2);
        g.fillStyle = '#868e96'; g.fillRect(x - 6, y - 10, 1, 10); g.fillRect(x + 5, y - 10, 1, 10);
        g.fillStyle = '#adb5bd'; for (let k = 2; k < 10; k += 3) g.fillRect(x - 6, y - k, 12, 1);
        g.fillStyle = '#ced4da'; g.fillRect(x - 6, y - 11, 12, 2);
      },
    };
    KM.objetos.push(o);
    return () => { const i = KM.objetos.indexOf(o); if (i >= 0) KM.objetos.splice(i, 1); };
  }

  // ------------------------------------------------------------------ tarefas
  const FALAS = {
    chao: ['Chão brilhando! ✨', 'Cuidado, piso molhado! ⚠️', 'Passando um paninho 🧽', 'Agora sim, cheirinho de limpeza 🌸'],
    mesa: ['Mesa limpinha pra você 🧽', 'Tirando o pó do teclado ✨', 'Organizando a papelada 📄'],
    pc: ['Atualizando o computador 🖥️', 'Arrumando os cabos 🔌', 'Pronto, PC voando! 🚀'],
    ar: ['Trocando o filtro do ar ❄️', 'Manutenção do ar-condicionado 🔧', 'Ar novinho, geladinho! 🥶'],
  };
  const pontosSala = sala => {
    const s = KM.LAYOUT.salas[sala]; if (!s) return [];
    return [[52, 78], [96, 52], [70, 92], [60, 30], [110, 90]].map(([rx, ry]) => [s.fx + rx, s.fy + ry]);
  };

  async function chao(p, sala) {
    const s = sala || sorteio(Object.keys(KM.LAYOUT.salas));
    const [x, y] = sorteio(pontosSala(s));
    await KM.mov.irAte(p, x, y, 32);
    if (parar(p)) return;
    p.prop = 'rodo'; p.dir = 'fe';
    KM.mov.fala(p, sorteio(FALAS.chao), 2600);
    const tirar = cone(p.X + 14, p.Y + 4);
    const x0 = p.X;
    for (let i = 0; i < 14 && !parar(p); i++) {
      p.est = { esfrega: i % 2, boca: i % 6 === 0 ? 'sorriso' : 'normal' };
      p.X = x0 + Math.sin(i * 0.9) * 6;
      marcas.push({ x: p.X - 8, y: p.Y + 1, w: 14, ini: performance.now(), dur: 9000 });
      if (i % 3 === 0) KM.tocar('bip');
      await KM.esperar(330);
    }
    p.X = x0;
    setTimeout(tirar, 7000);
    p.prop = null; p.est = {};
  }

  function lugarNaMesa(funcao) {
    const a = KM.LAYOUT.assentos[funcao];
    if (!a || funcao === 'limpeza') return null;
    return [a.X + 17, a.Y + 3, a];
  }
  async function mesa(p, tipo) {
    const funcs = Object.keys(KM.LAYOUT.assentos).filter(f => f !== 'limpeza');
    const funcao = sorteio(funcs), l = lugarNaMesa(funcao);
    if (!l) return;
    await KM.mov.irAte(p, l[0], l[1], 34);
    if (parar(p)) return;
    p.dir = 'ce';
    const dono = Object.values(A().estado.pessoas).find(q => q.funcao === funcao);
    if (tipo === 'pc') {
      p.prop = 'chave';
      KM.mov.fala(p, sorteio(FALAS.pc), 2800);
      A().estado.trabalhoDe['conserto-' + funcao] = true;
      for (let i = 0; i < 10 && !parar(p); i++) {
        p.est = { bracos: i % 2 ? 'aceno' : 'cima', aceno: i % 2 };
        const [cx, cy] = [l[2].X, l[2].Y - 20];
        if (i % 2) KM.emitir('faisca', 4, { x: cx + rnd(-6, 6), y: cy + rnd(-4, 2), dvx: 40, dvy: 40, vida: 0.3, cor: '#ffe066' });
        if (i % 3 === 0) KM.tocar('zap');
        await KM.esperar(380);
      }
      delete A().estado.trabalhoDe['conserto-' + funcao];
    } else {
      p.prop = 'pano';
      KM.mov.fala(p, sorteio(FALAS.mesa), 2600);
      for (let i = 0; i < 12 && !parar(p); i++) {
        p.est = { esfrega: i % 2, boca: 'sorriso' };
        if (i % 3 === 0) { KM.emitir('gota', 3, { x: l[2].X + rnd(-8, 8), y: l[2].Y - 22, vy: 8, g: 60, vida: 0.5 }); KM.tocar('bip'); }
        if (i % 4 === 0) KM.emitir('estrela', 2, { x: l[2].X + rnd(-12, 12), y: l[2].Y - 24, vy: -10, vida: 0.5, cor: '#ffffff' });
        await KM.esperar(320);
      }
    }
    if (dono && !dono.trabalhando && !parar(p) && Math.random() < 0.6) KM.mov.fala(dono, sorteio(['Valeu! 💚', 'Obrigado! Ficou ótimo 👏', 'Você é demais! ✨']), 2200);
    p.prop = null; p.est = {};
  }

  async function arCondicionado(p) {
    const lista = KM.LAYOUT.decor.filter(d => d.tipo === 'arCond');
    if (!lista.length) return;
    const d = sorteio(lista), s = KM.LAYOUT.salas[d.sala];
    const x = d.X + (d.w >> 1), y = s.fy + 14;
    await KM.mov.irAte(p, x, y, 34);
    if (parar(p)) return;
    p.dir = 'ce';
    const tirar = escada(p);
    p.Z = 9; p.prop = 'chave';
    A().estado.manutencaoAC = d;
    KM.mov.fala(p, sorteio(FALAS.ar), 2800);
    for (let i = 0; i < 14 && !parar(p); i++) {
      p.est = { bracos: i % 2 ? 'cima' : 'aceno', aceno: i % 2 };
      if (i % 3 === 0) { KM.emitir('faisca', 3, { x: x + rnd(-6, 6), y: d.Y + 6, dvx: 30, dvy: 30, vida: 0.3, cor: '#9fe8ff' }); KM.tocar('bip'); }
      await KM.esperar(360);
    }
    A().estado.manutencaoAC = null;
    p.Z = 0; p.prop = null; p.est = {}; tirar();
    if (!parar(p)) { KM.emitir('estrela', 6, { x, y: d.Y + 8, dx: 10, vy: 10, vida: 0.7, cor: '#a5d8ff' }); KM.mov.fala(p, 'Ar-condicionado novinho! ❄️', 2200); await KM.esperar(1200); }
  }

  // ------------------------------------------------------------------ rotina
  const pessoaLimpeza = () => Object.values(A().estado.pessoas || {}).find(p => p.funcao === 'limpeza');
  const pode = () => {
    const est = A() && A().estado, cfg = A() && A().cfg();
    return est && cfg && cfg.opcoes.rotinas !== false && !document.hidden && !est.jogando && !KM.fx.ocupado;
  };
  async function comLock(p, fn) {
    p.acao = 'rotina';
    try { await fn(); } catch (e) { /* segue */ } finally {
      p.est = {}; p.prop = null; p.Z = 0;
      if (A().estado.manutencaoAC && p.acao === 'rotina') A().estado.manutencaoAC = null;
      if (p.modo !== 'sentado') await KM.voltarSentar(p);
      p.acao = null;
    }
  }
  async function ciclo() {
    for (;;) {
      await KM.esperar(rnd(5000, 11000));
      const p = pessoaLimpeza();
      if (!p || !pode() || p.acao || p.trabalhando || p.dormindo || p.modo !== 'sentado') continue;
      const x = Math.random();
      comLock(p, async () => {
        if (x < 0.35) await chao(p);
        else if (x < 0.6) await mesa(p, 'mesa');
        else if (x < 0.8) await mesa(p, 'pc');
        else await arCondicionado(p);
      });
    }
  }

  // Botão "Trabalhar": faxina geral (sem relatório).
  async function trabalhar(f, p) {
    if (p.trabalhando) return;
    if (!(await A().esperarLivre(p, 3000))) return A().toast(`Espere ${f.nome.split(' ')[0]} terminar o que está fazendo 😉`);
    p.trabalhando = true; A().atualizarBotoes();
    A().iniciarPainelTarefa('🧹 Faxina geral no escritório');
    const cb = A().callbacksTarefa(p, false);
    A().todosComemoram && A().todosComemoram(p.id);
    KM.mov.fala(p, 'Bora deixar tudo brilhando! 🧹✨', 2600);
    const etapas = [['🧽 Passando pano no chão', () => chao(p)], ['🗄️ Limpando as mesas', () => mesa(p, 'mesa')], ['🖥️ Arrumando os computadores', () => mesa(p, 'pc')], ['❄️ Manutenção do ar-condicionado', () => arCondicionado(p)]];
    try {
      for (let i = 0; i < etapas.length; i++) {
        cb.etapa(etapas[i][0]); cb.progresso(Math.round(100 * i / etapas.length));
        await etapas[i][1]();
      }
      cb.progresso(100); cb.etapa('✨ Escritório brilhando!');
    } finally {
      p.prop = null; p.est = {}; p.Z = 0; A().estado.manutencaoAC = null;
      if (p.modo !== 'sentado') await KM.voltarSentar(p);
      p.trabalhando = false; A().atualizarBotoes();
    }
    A().toast(`🧹 ${f.nome} deixou o escritório brilhando!`);
    await A().concluir(f, p);
  }

  KM.limpeza = { iniciar() { ciclo(); }, trabalhar, chao, mesa, arCondicionado };
})();
