/* KWIK Mini Escritório · Refeitório.
   De tempos em tempos (mais na hora do almoço e do lanche) um grupinho livre vai comer:
   - marmita/buffet: cada um pega a comida no buffet e senta à mesa;
   - iFood: alguém pede pelo celular, o entregador chega de moto até a porta do refeitório e entrega a sacola.
   Na mesa aparecem os pratos e a galera come conversando. Qualquer trabalho ou animação interrompe na hora. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  KM.objetos = KM.objetos || [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sorteio = arr => arr[Math.floor(Math.random() * arr.length)];
  const nome = p => (A().func(p.id).nome || '').split(' ')[0];
  const parar = p => p.pararRotina;

  const COMIDAS = {
    ifood: [['hamburguer', 'Esse hambúrguer tá top! 🍔'], ['pizza', 'Pizza no meio da semana 🍕😋'], ['japa', 'Sushi pra galera 🍣'], ['acai', 'Açaí pra adoçar o dia 🍧']],
    marmita: [['prato', 'Arroz, feijão e bife 😋'], ['prato', 'Comida caseira é outra coisa 🍲'], ['salada', 'Hoje é dia de salada 🥗'], ['prato', 'Que delícia! 😋']],
  };
  const PAPOS = ['Me passa o guardanapo? 🧻', 'Depois tem café? ☕', 'Esse tempero tá demais!', 'Quem lava a louça hoje? 😂', 'Sobremesa alguém? 🍫', 'Bom apetite, galera! 🍽️'];

  // ------------------------------------------------------------------ desenho: pratos na mesa e entregador
  function desenharComida(g, x, y, tipo, resto) {
    const r = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x + a), Math.round(y + b), w, h); };
    if (tipo === 'pizza') { r(-5, -2, 11, 6, '#c08a4a'); r(-4, -1, 9, 4, '#ffd43b'); if (resto > 0.3) { r(-3, 0, 2, 1, '#e03131'); r(1, -1, 2, 1, '#e03131'); } if (resto > 0.6) r(2, 1, 2, 1, '#e03131'); return; }
    r(-5, -1, 11, 5, '#f8f9fa'); r(-4, 3, 9, 1, '#dee2e6');
    if (resto <= 0.05) return;
    const w = Math.max(2, Math.round(7 * resto));
    if (tipo === 'hamburguer') { r(-2, -2, 5, 2, '#d9a066'); r(-2, 0, 5, 1, '#5c3d2e'); r(-2, 1, 5, 1, '#94d82d'); r(3, -1, 2, 2, '#ffd43b'); }
    else if (tipo === 'japa') { for (let i = 0; i < Math.ceil(3 * resto); i++) { r(-3 + i * 3, 0, 2, 2, '#ffffff'); r(-3 + i * 3, 0, 2, 1, '#ff8787'); } }
    else if (tipo === 'acai') { r(-2, -3, 5, 5, '#5f3dc4'); r(-2, -3, 5, 1, '#9775fa'); r(-1, -4, 2, 1, '#ffd43b'); }
    else if (tipo === 'salada') { r(-3, 0, w, 2, '#69db7c'); r(-2, -1, 2, 1, '#ff6b6b'); r(1, 0, 1, 1, '#ffa94d'); }
    else { r(-3, 0, w, 2, '#f1f3f5'); r(-3, 1, Math.max(1, w - 3), 1, '#6b3a1e'); r(1, -1, 2, 2, '#8d5a3b'); }
    r(6, -1, 1, 4, '#adb5bd'); // talher
  }

  const APAR_MOTO = {
    pele: '#C68642', cabelo: 'curto', corCabelo: '#1C1C1C', estiloCamisa: 'jaqueta', corCamisa: '#e03131', corGravata: '#e03131',
    calca: '#212529', sapato: '#111111', oculos: false, fone: false, bone: false, barba: false, corBone: '#e03131',
    cracha: false, corCordao: '#e03131', chapeu: 'bone', baixo: 'calca', calcado: 'tenis', altura: 'normal', cachecol: false, corCachecol: '#c9453a',
    olhos: 'normal', sobrancelha: 'normal', boca: 'sorriso', sardas: false, bochechas: false, pinta: false, estampa: 'lisa', corEstampa: '#ffffff',
    relogio: false, corRelogio: '#212529', colar: false, corColar: '#e2b33c', brinco: false, corBrinco: '#e2b33c', corFone: '#e03131', corOculos: '#1b1b1b',
  };
  function criarEntregador() {
    const L = KM.LAYOUT, c0 = L.corredores[0];
    const npc = { id: 'entregador', X: L.predio.x + 8, Y: c0.y + 22, Z: 0, dir: 'fd', modo: 'em-pe', est: {}, fase: 0.5, prop: 'sacola', visivel: true };
    const o = { get Y() { return npc.Y; }, f: (g, t) => KM.desenharPessoa(g, A().cfg(), npc, t, { aparencia: APAR_MOTO }) };
    KM.objetos.push(o);
    return { npc, tirar: () => { const i = KM.objetos.indexOf(o); if (i >= 0) KM.objetos.splice(i, 1); } };
  }
  async function andarNpc(npc, x, y, vel = 40) { for (const [a, b] of KM.rota(npc.X, npc.Y, x, y)) await KM.mov.andarAte(npc, a, b, vel); }
  const textoNaCabeca = (q, s, cor = '#ffffff') => KM.emitir('texto', 1, { x: q.X, y: q.Y - 52, vy: -10, vida: 1.8, s, cor });

  // ------------------------------------------------------------------ o almoço
  let emAndamento = false;
  async function refeicao(grupo, modo) {
    if (emAndamento || !grupo.length) return;
    emAndamento = true;
    grupo.forEach(p => { p.acao = 'rotina'; p.dormindo = false; });
    const est = A().estado, L = KM.LAYOUT;
    const lugares = L.pontos.refeicao.slice().sort(() => Math.random() - 0.5).slice(0, grupo.length);
    const pratos = []; // {X, Y, tipo, resto}
    const objPratos = { get Y() { return L.salas.refeitorio.fy + 63.6; }, f: g => pratos.forEach(pt => desenharComida(g, pt.X, pt.Y, pt.tipo, pt.resto)) };
    KM.objetos.push(objPratos);
    est.refeicaoAtiva = true;
    const [comida, frase] = sorteio(COMIDAS[modo]);
    let entregue = modo !== 'ifood', ent = null;
    const sentar = (p, l) => { p.modo = 'sentado-mesa'; p.X = l.X; p.Y = l.Y; p.dir = l.dir; p.est = {}; };
    const levantar = p => { if (p.modo === 'sentado-mesa') p.modo = 'em-pe'; };
    // Quem for chamado (trabalho/animação) larga o prato e volta para a mesa dele na hora.
    const soltos = new Set(), andando = new Set(), voltas = [];
    const fora = p => soltos.has(p) || p.pararRotina;
    const liberar = p => {
      if (soltos.has(p)) return;
      soltos.add(p);
      levantar(p); p.prop = null; p.est = {};
      voltas.push((async () => { try { if (p.modo !== 'sentado') await KM.voltarSentar(p); } finally { if (p.acao === 'rotina') p.acao = null; } })());
    };
    const vigia = setInterval(() => { for (const p of grupo) if (p.pararRotina && !andando.has(p)) liberar(p); }, 120);
    const ir = async (p, x, y, vel) => { andando.add(p); try { await KM.mov.irAte(p, x, y, vel); } finally { andando.delete(p); } if (fora(p)) liberar(p); return !fora(p); };
    const esperarOuSair = async ms => { const fim = performance.now() + ms; while (performance.now() < fim && grupo.some(p => !fora(p))) await KM.esperar(150); };
    const prato = (p, i) => pratos.push({ X: lugares[i].X - 1, Y: lugares[i].dir === 'fe' ? L.salas.refeitorio.fy + 42 : L.salas.refeitorio.fy + 51, tipo: comida, resto: 1, de: p });

    try {
      if (modo === 'ifood') {
        const quem = grupo[0];
        quem.prop = 'celular';
        KM.mov.fala(quem, sorteio(['Vou pedir um iFood! 📱🍔', 'Bora de iFood hoje? 🛵', 'Pedi lanche pra galera! 🍕']), 2800);
        await esperarOuSair(2600);
        if (!fora(quem)) quem.prop = null;
      }
      // todos vão para a mesa (no buffet, cada um pega a marmita antes)
      await Promise.all(grupo.map(async (p, i) => {
        await KM.esperar(i * 500);
        if (fora(p)) return liberar(p);
        if (modo === 'marmita') {
          const b = L.moveis.find(m => m.tipo === 'buffet');
          if (!(await ir(p, b.X + 10 + i * 14, b.Y + b.d + 6, 36))) return;
          p.dir = 'ce'; await KM.esperar(900);
          if (fora(p)) return liberar(p);
          p.prop = 'marmita'; p.dir = 'fe';
        }
        if (!(await ir(p, lugares[i].X, lugares[i].Y, 36))) return;
        p.prop = null;
        sentar(p, lugares[i]);
        if (entregue) prato(p, i);
      }));
      if (grupo.every(fora)) return;

      if (modo === 'ifood') { // espera o entregador
        await esperarOuSair(rnd(2500, 5000));
        if (grupo.every(fora)) return;
        ent = criarEntregador();
        KM.tocar('moto');
        const [ex, ey] = L.pontos.entrega;
        await andarNpc(ent.npc, ex, ey, 44);
        KM.tocar('campainha'); textoNaCabeca(ent.npc, 'IFOOD!', '#ff8787');
        const buscador = grupo.find(p => !fora(p));
        if (buscador) {
          const iB = grupo.indexOf(buscador);
          levantar(buscador);
          KM.mov.fala(buscador, 'Chegou! Deixa que eu pego 🛵', 2200);
          if (await ir(buscador, ex, ey - 18, 44)) {
            ent.npc.prop = null; buscador.prop = 'sacola'; ent.npc.est = { bracos: 'aceno', aceno: 1, boca: 'sorriso' };
            textoNaCabeca(ent.npc, 'BOM APETITE!', '#ffffff');
            await KM.esperar(900);
          }
          const e = ent; ent = null;
          (async () => { e.npc.est = {}; e.npc.prop = null; await andarNpc(e.npc, L.predio.x + 8, L.corredores[0].y + 22, 50); KM.tocar('moto'); e.tirar(); })();
          if (!fora(buscador) && (await ir(buscador, lugares[iB].X, lugares[iB].Y, 44))) { buscador.prop = null; sentar(buscador, lugares[iB]); }
        } else { ent.tirar(); ent = null; }
        entregue = true;
        grupo.forEach((p, i) => { if (!fora(p) && p.modo === 'sentado-mesa') prato(p, i); });
        KM.tocar('sucesso');
      }

      // comendo
      const fala0 = grupo.find(p => !fora(p));
      if (fala0) KM.mov.fala(fala0, frase, 2600);
      const fim = performance.now() + rnd(10000, 15000);
      let n = 0;
      while (performance.now() < fim && grupo.some(p => !fora(p))) {
        n++;
        for (const p of grupo) {
          if (fora(p) || p.modo !== 'sentado-mesa') continue;
          p.prop = p.dir === 'fe' ? 'garfo' : null;
          p.est = { mastiga: (n + grupo.indexOf(p)) % 2, boca: (n + grupo.indexOf(p)) % 2 ? 'o' : 'sorriso', olhos: n % 7 === 0 ? 'feliz' : undefined };
        }
        for (const pt of pratos) if (!fora(pt.de)) pt.resto = Math.max(0, pt.resto - 0.045);
        if (n % 6 === 0) { const q = sorteio(grupo.filter(p => !fora(p))); if (q) KM.mov.fala(q, sorteio(PAPOS), 2200); }
        if (n % 3 === 0) KM.tocar('bip');
        await KM.esperar(500);
      }
      const ultimo = grupo.find(p => !fora(p));
      if (ultimo) KM.mov.fala(ultimo, sorteio(['Que almoço! Bora voltar 💪', 'Barriga cheia, hora de trabalhar 😄', 'Valeu, galera! 🍽️']), 2400);
      await esperarOuSair(1200);
    } finally {
      clearInterval(vigia);
      if (ent) ent.tirar();
      const i = KM.objetos.indexOf(objPratos); if (i >= 0) KM.objetos.splice(i, 1);
      est.refeicaoAtiva = false;
      emAndamento = false;
      grupo.forEach(liberar);
      await Promise.all(voltas);
    }
  }

  // ------------------------------------------------------------------ quando acontece
  const livre = p => p && p.visivel !== false && !p.acao && !p.trabalhando && !p.dormindo && p.modo === 'sentado' && !p.lugarJogo;
  const pode = () => {
    const est = A() && A().estado, cfg = A() && A().cfg();
    return est && cfg && cfg.opcoes.rotinas !== false && !document.hidden && !est.jogando && !KM.fx.ocupado && KM.LAYOUT && KM.LAYOUT.pontos.refeicao;
  };
  function horaDeComer() { const h = new Date().getHours() + new Date().getMinutes() / 60; return (h >= 11.5 && h < 14) || (h >= 15.5 && h < 16.5) || (h >= 19 && h < 20.5); }
  async function ciclo() {
    await KM.esperar(25000);
    for (;;) {
      await KM.esperar(horaDeComer() ? rnd(25000, 45000) : rnd(70000, 120000));
      if (!pode() || emAndamento) continue;
      const livres = Object.values(A().estado.pessoas).filter(livre).sort(() => Math.random() - 0.5);
      if (livres.length < 2) continue;
      const grupo = livres.slice(0, Math.min(livres.length, 2 + Math.floor(Math.random() * 3)));
      refeicao(grupo, Math.random() < 0.5 ? 'ifood' : 'marmita');
    }
  }
  // Chamado pelo menu de animações: todo mundo livre vai almoçar já.
  function agora(modo) {
    const livres = Object.values(A().estado.pessoas).filter(p => !p.trabalhando && p.visivel !== false);
    return Promise.all(livres.map(p => KM.pararRotina(p))).then(() => refeicao(livres.filter(p => !p.acao).slice(0, 6), modo || 'ifood'));
  }

  KM.refeitorio = { iniciar() { ciclo(); }, refeicao, agora, ocupado: () => emAndamento };
})();
