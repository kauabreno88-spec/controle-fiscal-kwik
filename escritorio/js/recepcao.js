/* KWIK Mini Escritório · Recepção e sala de Apresentação.
   - A recepcionista fica no balcão. Clientes chegam pela entrada, são recebidos ("Bem-vindo à KWIK!"), às vezes pegam
     um cafezinho e sentam no sofá da fila de espera (até 4).
   - Na sala de Apresentação um consultor com o uniforme da KWIK mostra os slides (KWIK, serviços, economia, planos,
     obrigado) para o primeiro da fila. Quando termina, o cliente fecha (ou vai pensar), vai embora e entra o próximo.
   Tudo é decorativo (não grava nada). */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sorteio = arr => arr[Math.floor(Math.random() * arr.length)];
  KM.objetos = KM.objetos || [];

  // ------------------------------------------------------------------ aparência
  const PELES = ['#FFDBAC', '#F5D0B5', '#F1C9A5', '#E8B48F', '#E0AC82', '#C68642', '#A0673C', '#8D5524'];
  const CABELOS = ['curto', 'longo', 'coque', 'cacheado', 'topete', 'careca', 'longo', 'curto'];
  const CORES_CAB = ['#1C1C1C', '#3B2416', '#6B4226', '#B5651D', '#E6C35C', '#9E9E9E'];
  const ROUPAS = [['social', '#cfe0f5'], ['casual', '#ffd43b'], ['camiseta', '#ff8787'], ['jaqueta', '#4dabf7'], ['casual', '#b197fc'], ['social', '#ffffff'], ['camiseta', '#63e6be'], ['jaqueta', '#f783ac']];
  let seq = 0;
  function aparencia(tipo) {
    const h = ++seq * 7 + Math.floor(Math.random() * 1000);
    const kwik = tipo !== 'cliente', [estilo, cor] = ROUPAS[h % ROUPAS.length];
    return {
      pele: PELES[h % PELES.length], cabelo: tipo === 'recepcionista' ? 'longo' : tipo === 'consultor' ? 'topete' : CABELOS[(h >> 2) % CABELOS.length],
      corCabelo: CORES_CAB[(h >> 1) % CORES_CAB.length], estiloCamisa: kwik ? 'kwik' : estilo, corCamisa: kwik ? '#28BE52' : cor, corGravata: '#111A19',
      calca: kwik ? '#2F3A4A' : ['#2b3a55', '#3a3f47', '#5c3d2e', '#212529'][h % 4], sapato: '#1A1A1A', oculos: tipo === 'consultor' || h % 5 === 1, fone: tipo === 'recepcionista',
      bone: false, barba: tipo === 'cliente' && h % 6 === 2, corBone: '#28BE52', cracha: kwik, corCordao: '#111A19', chapeu: '', baixo: 'calca', calcado: kwik ? 'sapato' : 'tenis',
      altura: 'normal', cachecol: false, corCachecol: '#c9453a', olhos: 'normal', sobrancelha: 'normal', boca: 'sorriso', sardas: false, bochechas: h % 3 === 0, pinta: false,
      estampa: 'lisa', corEstampa: '#ffffff', relogio: tipo === 'cliente' && h % 2 === 0, corRelogio: '#c9a65b', colar: h % 4 === 1, corColar: '#e2b33c', brinco: h % 2 === 1,
      corBrinco: '#e2b33c', corFone: '#28BE52', corOculos: '#1b1b1b',
    };
  }

  // ------------------------------------------------------------------ pessoas (NPCs) e desenho
  let ger = 0; // muda quando a planta do prédio é refeita: tudo recomeça
  const npcs = new Set();
  let recepcionista = null, consultor = null, fila = [], naReuniao = null;
  function novoNpc(tipo, X, Y, dir = 'fe') {
    const n = { id: 'rec-' + (++seq), tipo, X, Y, Z: 0, dir, modo: 'em-pe', est: {}, fase: Math.random() * 3, visivel: true, ap: aparencia(tipo), cadeira: null };
    npcs.add(n);
    return n;
  }
  // cada NPC é um objeto da cena, desenhado na profundidade certa (quem está na cadeira da apresentação é desenhado pela cadeira)
  const objs = new Map();
  setInterval(() => {
    for (const n of npcs) if (!objs.has(n)) {
      const o = { proprio: true, get X() { return n.X; }, get Y() { return n.Y + 0.5; }, f: (g, t) => { if (n.visivel && !n.cadeira) KM.desenharPessoa(g, A().cfg(), n, t, { aparencia: n.ap }); } };
      objs.set(n, o); KM.objetos.push(o);
    }
    for (const [n, o] of objs) if (!npcs.has(n)) { const i = KM.objetos.indexOf(o); if (i >= 0) KM.objetos.splice(i, 1); objs.delete(n); }
  }, 120);
  // cadeiras da apresentação (com ou sem cliente sentado)
  const objCadeiras = [];
  function registrarCadeiras() {
    for (const o of objCadeiras) { const i = KM.objetos.indexOf(o); if (i >= 0) KM.objetos.splice(i, 1); }
    objCadeiras.length = 0;
    const pa = KM.LAYOUT && KM.LAYOUT.pontos.apresentacao; if (!pa) return;
    pa.cadeiras.forEach((c, i) => {
      const o = { X: c.X, proprio: true, Y: c.Y + 0.4, f: (g, t) => {
        const n = [...npcs].find(q => q.cadeira === i);
        if (n) { KM.desenharPessoa(g, A().cfg(), n, t, { aparencia: n.ap }); KM.desenharCadeira(g, c.X, c.Y, true); }
        else KM.desenharCadeira(g, c.X, c.Y, false);
      } };
      objCadeiras.push(o); KM.objetos.push(o);
    });
  }
  const falar = (n, s, cor = '#ffffff') => { if (!n || !n.visivel) return; const [x, y] = KM.ancora(n); KM.emitir('texto', 1, { x, y: y - (n.modo === 'sentado-mesa' ? 42 : 50), vy: -8, vida: 2.4, s, cor }); };

  // ------------------------------------------------------------------ andar (desviando de móveis)
  const vivo = g => g === ger;
  async function andar(n, x, y, vel = 46) {
    const g = ger;
    n.modo = 'em-pe'; n.cadeira = null;
    for (const [a, b] of KM.rota(n.X, n.Y, x, y)) { if (!vivo(g)) return false; await KM.mov.andarAte(n, a, b, vel); }
    return vivo(g);
  }
  async function reto(n, x, y, vel = 46) { const g = ger; n.modo = 'em-pe'; await KM.mov.andarAte(n, x, y, vel); return vivo(g); }
  const entrada = () => { const L = KM.LAYOUT, c0 = L.corredores[0]; return { fora: [6, c0.y + 22], dentro: [L.predio.x + 10, c0.y + 22] }; };
  function sentar(n, p) { Object.assign(n, { modo: 'sentado-mesa', X: p.X, Y: p.Y, dir: p.dir, est: {} }); }

  // ------------------------------------------------------------------ fila de espera
  async function chegarCliente(instantaneo) {
    const L = KM.LAYOUT, pf = L.pontos.fila; if (!pf || fila.length >= pf.length) return;
    const g = ger, i = fila.length;
    if (instantaneo) { const n = novoNpc('cliente', pf[i].X, pf[i].Y); sentar(n, pf[i]); n.alvo = i; fila.push(n); return; }
    const e = entrada(), n = novoNpc('cliente', e.fora[0], e.fora[1], 'fd');
    fila.push(n); n.chegando = true;
    if (!(await reto(n, e.dentro[0], e.dentro[1], 50))) return;
    const b = L.pontos.balcao;
    if (!(await andar(n, b.X, b.Y, 50))) return;
    n.dir = 'cd';
    if (recepcionista) { recepcionista.est = { bracos: 'aceno', aceno: 1, boca: 'sorriso' }; falar(recepcionista, sorteio(['BEM-VINDO A KWIK!', 'OLA! BEM-VINDO!', 'BOM DIA! :)']), '#9be3ad'); }
    KM.tocar('campainha');
    await KM.esperar(1600); if (!vivo(g)) return;
    if (recepcionista) { recepcionista.est = { boca: 'sorriso' }; falar(recepcionista, 'CAFEZINHO?', '#ffe8cc'); }
    await KM.esperar(1200); if (!vivo(g)) return;
    if (Math.random() < 0.6) { // pega um café
      const c = L.pontos.cafe;
      if (!(await andar(n, c.X, c.Y, 46))) return;
      n.dir = 'ce'; A().estado.cafeRecepcao = true; await KM.esperar(1300); A().estado.cafeRecepcao = false; if (!vivo(g)) return;
      n.cafe = true; falar(n, 'OBRIGADO!', '#ffffff');
    }
    n.chegando = false;
    await irParaLugar(n);
  }
  async function irParaLugar(n) {
    const pf = KM.LAYOUT.pontos.fila, i = fila.indexOf(n); if (i < 0 || !pf[i]) return;
    n.alvo = i;
    if (!(await andar(n, pf[i].X, pf[i].Y + 13, 46))) return;
    if (fila.indexOf(n) !== i) return irParaLugar(n); // a fila andou enquanto ele caminhava
    sentar(n, pf[i]);
    if (n.cafe) n.est = { bracos: 'cafe' };
  }
  function filaAnda() { // todo mundo sobe um lugar no sofá
    fila.forEach((n, i) => { if (!n.chegando && n.alvo !== i) { n.modo = 'em-pe'; n.Y += 13; irParaLugar(n); } });
  }

  // ------------------------------------------------------------------ apresentação
  const FALAS = [['ESSA E A KWIK!', 'PRAZER!'], ['NOSSOS SERVICOS', 'INTERESSANTE...'], ['VOCE ECONOMIZA', 'GOSTEI!'], ['NOSSOS PLANOS', 'HUM...'], ['OBRIGADO!', '']];
  async function apresentar() {
    const L = KM.LAYOUT, pa = L.pontos.apresentacao, g = ger;
    const n = fila.find(q => !q.chegando && q.modo === 'sentado-mesa');
    if (!n || fila.indexOf(n) !== 0) return;
    fila.shift(); naReuniao = n; n.est = {}; n.cafe = false;
    filaAnda();
    if (recepcionista) falar(recepcionista, 'PODE ENTRAR!', '#9be3ad');
    const cad = pa.cadeiras[1];
    n.modo = 'em-pe'; n.Y += 13;
    if (!(await andar(n, cad.X, cad.Y + 12, 46))) return;
    Object.assign(n, { modo: 'sentado-mesa', X: cad.X, Y: cad.Y, dir: 'ce', cadeira: 1, est: {} });
    const est = A().estado;
    est.apresentacao = { ativo: true, slide: 0 };
    for (let k = 0; k < 5; k++) {
      if (!vivo(g)) return;
      est.apresentacao.slide = k;
      if (consultor) { consultor.est = { bracos: 'aceno', aceno: k % 2, boca: 'sorriso' }; falar(consultor, FALAS[k][0], '#9be3ad'); }
      KM.tocar('clique');
      await KM.esperar(2600); if (!vivo(g)) return;
      if (consultor) consultor.est = { boca: 'sorriso' };
      if (FALAS[k][1] && Math.random() < 0.7) falar(n, FALAS[k][1]);
      await KM.esperar(2200);
    }
    if (!vivo(g)) return;
    const fechou = Math.random() < 0.7;
    n.modo = 'em-pe'; n.cadeira = null; n.Y = cad.Y + 12; n.dir = 'fe';
    if (fechou) {
      falar(n, 'FECHADO!', '#ffd43b'); n.est = { bracos: 'cima', boca: 'sorriso', olhos: 'feliz' };
      if (consultor) { consultor.est = { bracos: 'cima', boca: 'sorriso', olhos: 'feliz' }; }
      const [x, y] = KM.ancora(n);
      KM.emitir('confete', 24, i => ({ x: x + rnd(-20, 20), y: y - 50 - rnd(0, 16), vy: 18, g: 40, vida: 2, cor: ['#28BE52', '#ffd93b', '#ffffff'][i % 3] }));
      KM.tocar('sucesso');
    } else { falar(n, 'VOU PENSAR!'); n.est = { boca: 'normal' }; if (consultor) falar(consultor, 'TE ESPERAMOS!', '#9be3ad'); }
    await KM.esperar(1800);
    est.apresentacao = { ativo: false };
    if (consultor) consultor.est = {};
    n.est = {};
    naReuniao = null;
    // vai embora pela entrada
    const e = entrada();
    if (!(await andar(n, e.dentro[0], e.dentro[1], 52))) return;
    if (!(await reto(n, e.fora[0], e.fora[1], 52))) return;
    npcs.delete(n);
  }

  // ------------------------------------------------------------------ ciclos
  async function cicloChegada(g) {
    while (vivo(g)) {
      await KM.esperar(rnd(12000, 22000));
      if (!vivo(g)) return;
      if (document.hidden || !KM.LAYOUT) continue;
      if (fila.length < 4) chegarCliente();
    }
  }
  async function cicloReuniao(g) {
    while (vivo(g)) {
      await KM.esperar(2500);
      if (!vivo(g)) return;
      if (document.hidden || naReuniao) continue;
      try { await apresentar(); } catch (e) { naReuniao = null; }
    }
  }
  function montar() {
    ger++;
    const g = ger;
    npcs.clear(); fila = []; naReuniao = null;
    if (A() && A().estado) A().estado.apresentacao = { ativo: false };
    const L = KM.LAYOUT; if (!L || !L.pontos.recepcionista || !L.pontos.apresentacao) return;
    const pr = L.pontos.recepcionista, pc = L.pontos.apresentacao.consultor;
    recepcionista = novoNpc('recepcionista', pr.X, pr.Y, pr.dir);
    consultor = novoNpc('consultor', pc.X, pc.Y, pc.dir);
    registrarCadeiras();
    chegarCliente(true); chegarCliente(true); // já tem gente esperando
    cicloChegada(g); cicloReuniao(g);
    // a recepcionista acena de vez em quando
    (async () => { while (vivo(g)) { await KM.esperar(rnd(9000, 16000)); if (!vivo(g) || !recepcionista) return; if (!naReuniao && Math.random() < 0.5) { recepcionista.est = { bracos: 'aceno', aceno: 1, boca: 'sorriso' }; await KM.esperar(900); recepcionista.est = {}; } } })();
  }

  // A planta é refeita quando a Execução cresce (Recepção e Apresentação não mudam de lugar): só refaz tudo se trocou PC ↔ celular.
  let ultimaPlanta = '';
  function layoutMudou() {
    if (!KM.LAYOUT) return;
    if (KM.LAYOUT.nome === ultimaPlanta && npcs.size) return registrarCadeiras();
    ultimaPlanta = KM.LAYOUT.nome;
    montar();
  }
  KM.recepcao = { iniciar: layoutMudou, layoutMudou, fila: () => fila };
})();
