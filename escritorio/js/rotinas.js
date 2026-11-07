/* KWIK Mini Escritório · vida no prédio: quem está livre circula, toma café, conversa com os colegas
   ou finge que está trabalhando (digitando). Tudo é interrompido na hora que você manda alguém trabalhar. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sorteio = arr => arr[Math.floor(Math.random() * arr.length)];
  const nome = p => (A().func(p.id).nome || '').split(' ')[0];

  const PAPOS = [
    ['Viu a notícia de hoje?', 'Vi! Já mandei pro {video} 🎬'],
    ['Bora um café? ☕', 'Bora! Só termino isso aqui'],
    ['Fechou o mês?', 'Quase! Falta conciliar 😅'],
    ['O cliente elogiou o atendimento 💚', 'Isso é KWIK!'],
    ['Já viu o prazo do DAS?', 'Tá na prancheta, {checklist} anotou 📋'],
    ['Que cheirinho de almoço! 😋', 'Bora pro refeitório daqui a pouco 🍽️'],
    ['O ar tá geladinho hoje ❄️', '{limpeza} fez a manutenção ontem 🔧'],
    ['Quantos clientes falta pra meta? 🎯', 'Tá subindo! Olha o tanque lá na sala META 💚'],
    ['Me ajuda numa planilha depois?', 'Claro, me chama 👍'],
    ['Que dia corrido!', 'Mas rendeu bastante 💪'],
    ['Tem reunião hoje?', 'Às 15h, na sala de reunião 🗓️'],
    ['Gostei do vídeo novo!', 'Valeu! Saiu quentinho 🔥'],
    ['Sinuca no intervalo? 🎱', 'Só se eu puder revanche 😂'],
  ];
  const SOZINHO = ['Hmm… deixa eu conferir isso 🤔', 'Alongando um pouco 🙆', 'Que vista boa daqui ☀️', 'Cadê meu carregador? 🔌', 'Lembrar de beber água 💧'];

  const livre = p => p && p.visivel !== false && !p.acao && !p.trabalhando && !p.dormindo && p.modo === 'sentado' && !p.lugarJogo && p.funcao !== 'limpeza';
  const pode = () => {
    const est = A() && A().estado, cfg = A() && A().cfg();
    return est && cfg && cfg.opcoes.rotinas !== false && !document.hidden && !est.jogando && !KM.fx.ocupado;
  };

  async function comLock(p, fn) {
    p.acao = 'rotina';
    try { await fn(); } finally {
      p.est = {};
      if (p.modo !== 'sentado') await KM.voltarSentar(p);
      p.acao = null;
    }
  }
  const parar = p => p.pararRotina;

  function fingir(p) { // fica digitando um tempo, como se estivesse trabalhando
    return comLock(p, async () => {
      p.digitando = true;
      const fim = performance.now() + rnd(6000, 15000);
      while (performance.now() < fim && !parar(p)) await KM.esperar(300);
      p.digitando = false;
    });
  }
  function passear(p) {
    return comLock(p, async () => {
      const pontos = KM.LAYOUT.pontos.fotos || [];
      const [x, y] = sorteio(pontos);
      await KM.mov.irAte(p, x, y, 34);
      if (parar(p)) return;
      p.dir = Math.random() < 0.5 ? 'fe' : 'fd';
      if (Math.random() < 0.5) KM.mov.fala(p, sorteio(SOZINHO), 2200);
      await KM.esperar(rnd(1500, 3500));
    });
  }
  function cafe(p) {
    return comLock(p, async () => {
      const pc = KM.LAYOUT.pontos.cafe; if (!pc) return;
      await KM.mov.irAte(p, pc.X, pc.Y, 34);
      if (parar(p)) return;
      p.dir = pc.dir; A().estado.cafeCopa = true;
      await KM.esperar(1400);
      A().estado.cafeCopa = false; p.dir = 'fe';
      p.est = { bracos: 'cafe', olhos: 'fechados' }; KM.tocar('gole');
      KM.mov.fala(p, sorteio(['Café passado na hora ☕', 'Agora sim! ☕', 'Combustível de contador ☕', 'O cafezinho da recepção é o melhor ☕']), 2000);
      await KM.esperar(1600);
    });
  }
  function conversar(a, b) {
    return comLock(a, async () => {
      const as = KM.LAYOUT.assentos[b.funcao];
      if (!as) return;
      await KM.mov.irAte(a, as.X + 17, as.Y + 3, 36);
      if (parar(a)) return;
      KM.olhar(a, b);
      let l1, l2;
      if (KM.familia) [l1, l2] = KM.familia.papo(a.id, b.id); // fala de acordo com o parentesco (pai, mãe, mano, amor, vó…)
      else {
        const nomes = s => s.replace(/\{(\w+)\}/g, (m, f) => (KM.nomeDe && KM.nomeDe(f)) || 'a equipe');
        [l1, l2] = sorteio(PAPOS).map(nomes); l1 = `${nome(b)}, ${l1.charAt(0).toLowerCase()}${l1.slice(1)}`;
      }
      KM.mov.fala(a, l1, 2800);
      a.est = { bracos: 'aceno', aceno: 1, boca: 'sorriso' };
      const casal = KM.familia && KM.familia.casal(a.id, b.id);
      if (casal) { const [x, y] = KM.mov.cabeca(a); KM.emitir('coracao', 4, { x, y: y - 4, dx: 10, vy: -14, vida: 1.4 }); }
      await KM.esperar(2900);
      a.est = { boca: 'sorriso' };
      if (!b.trabalhando) KM.mov.fala(b, l2, 2600);
      if (casal) { const [x, y] = KM.mov.cabeca(b); KM.emitir('coracao', 3, { x, y: y - 4, dx: 8, vy: -14, vida: 1.2 }); KM.tocar('coracao'); }
      await KM.esperar(2700);
      if (Math.random() < 0.4) { KM.mov.fala(a, sorteio(casal ? ['Te amo 💚', '🥰', 'Volto já 😘'] : ['Haha, boa! 😂', 'Fechado! 👊', 'Valeu! 💚']), 1800); await KM.esperar(1800); }
    });
  }

  async function ciclo() {
    for (;;) {
      await KM.esperar(rnd(7000, 14000));
      if (!pode()) continue;
      const ps = Object.values(A().estado.pessoas).filter(livre);
      if (!ps.length) continue;
      const p = sorteio(ps), x = Math.random();
      try {
        if (x < 0.35) fingir(p);
        else if (x < 0.65) {
          const outros = Object.values(A().estado.pessoas).filter(q => q !== p && q.visivel !== false && q.modo === 'sentado' && !q.dormindo && KM.LAYOUT.assentos[q.funcao]);
          if (outros.length) conversar(p, KM.familia ? KM.familia.parceiroPreferido(p.id, outros) : sorteio(outros)); else passear(p);
        }
        else if (x < 0.78) passear(p);
        else if (x < 0.9 && KM.jogos && KM.jogos.jogarUm) { if (!KM.jogos.jogarUm(p)) cafe(p); } // vai jogar um pouco na sala de jogos
        else cafe(p);
      } catch (e) { /* segue a vida */ }
    }
  }

  KM.rotinas = { iniciar() { ciclo(); }, fingir, passear, conversar, cafe };
})();
