/* KWIK Mini Escritório · aplicativo (abas, funcionário, tarefas, relatórios, personalização). */
(function () {
  const KM = window.KM;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const el = (tag, attrs = {}, ...filhos) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v;
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
    }
    for (const f of filhos.flat()) if (f !== null && f !== undefined && f !== false) e.append(f.nodeType ? f : document.createTextNode(f));
    return e;
  };
  const brl = v => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const brlCurto = v => 'R$ ' + Math.round(v || 0).toLocaleString('pt-BR');
  const clone = o => JSON.parse(JSON.stringify(o));

  // ------------------------------------------------------------------ configuração
  const PADRAO = {
    versao: 3,
    escritorio: {
      nome: 'Mini Escritório', parede: '#EBDCCB', rodape: '#6B4A35', piso: 'madeira', corPiso: '#B98A62',
      tapete: true, corTapete: '#F5C27E', padraoTapete: 'losango', mesa: '#9C5B3A', cadeira: '#2A2F33', estante: '#2b2f33', ceu: 'auto',
      itens: { planta: true, estante: true, janela: true, relogio: true, tv: true, grafico: true, logo: true, quadros: true, cofre: true, lixeira: true },
    },
    funcionarios: [{
      id: 'f1', nome: 'Léo', cargo: 'Analista de Notícias', funcao: 'noticias',
      aparencia: {
        pele: '#E8B48F', cabelo: 'curto', corCabelo: '#5A3825', estiloCamisa: 'casual', corCamisa: '#E9D5B7', corGravata: '#28BE52',
        calca: '#2F3A4A', sapato: '#5A3A22', oculos: false, fone: false, bone: false, barba: false, corBone: '#28BE52',
        cracha: true, corCordao: '#E8613C',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }, {
      id: 'clara', nome: 'Clara', cargo: 'Organizadora de Tarefas', funcao: 'checklist',
      aparencia: {
        pele: '#F1C9A5', cabelo: 'longo', corCabelo: '#3B2416', estiloCamisa: 'casual', corCamisa: '#F4B6C2', corGravata: '#28BE52',
        calca: '#3b4a6b', sapato: '#7a3b2a', oculos: false, fone: false, bone: false, barba: false, corBone: '#28BE52',
        cracha: true, corCordao: '#28BE52',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }, {
      id: 'maycon', nome: 'Maycon (pai)', cargo: 'Prospecção de Clientes', funcao: 'prospeccao',
      aparencia: {
        pele: '#E0AC82', cabelo: 'curto', corCabelo: '#8a8a8a', estiloCamisa: 'social', corCamisa: '#cfe0f5', corGravata: '#1f3a68',
        calca: '#3a3f47', sapato: '#2b1d12', oculos: true, fone: false, bone: false, barba: true, corBone: '#28BE52',
        cracha: true, corCordao: '#3f7fc1',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }],
    checklist: [],
    maycon: { cidade: '', uf: '', fotos: 0 },
    jogos: { gatos: { fase: 1, estrelas: {} } },
    economia: { valorTarefa: 150, caixa: 0 },
    opcoes: { comemorar: true, soneca: true, som: true, fotos: true },
  };
  const TEMAS = {
    'KWIK Clássico': { parede: '#EBDCCB', rodape: '#6B4A35', piso: 'madeira', corPiso: '#B98A62', corTapete: '#F5C27E', padraoTapete: 'losango', mesa: '#9C5B3A', cadeira: '#2A2F33', estante: '#2b2f33' },
    'KWIK Verde': { parede: '#DDF3E3', rodape: '#1E8A45', piso: 'piso', corPiso: '#E4EAE5', corTapete: '#28BE52', padraoTapete: 'kwik', mesa: '#F2F2EE', cadeira: '#111A19', estante: '#111A19' },
    'Grafite Noturno': { parede: '#2B3433', rodape: '#111A19', piso: 'madeira', corPiso: '#5a4636', corTapete: '#28BE52', padraoTapete: 'kwik', mesa: '#1f2524', cadeira: '#28BE52', estante: '#151a19', ceu: 'noite' },
    'Minimalista': { parede: '#F4F4F2', rodape: '#cfcfc9', piso: 'taco', corPiso: '#D8C3A5', corTapete: '#e9e4d8', padraoTapete: 'listras', mesa: '#e8e2d6', cadeira: '#3b3b3b', estante: '#e8e2d6' },
    'Pôr do sol': { parede: '#FFE3CC', rodape: '#8f3f22', piso: 'madeira', corPiso: '#c98b5b', corTapete: '#ff8c5a', padraoTapete: 'losango', mesa: '#7a4a2e', cadeira: '#3f7fc1', estante: '#5a3524', ceu: 'tarde' },
  };
  const NIVEIS = [[0, 'Estagiário'], [2, 'Assistente'], [5, 'Analista'], [10, 'Sênior'], [18, 'Especialista'], [30, 'Lenda KWIK']];

  function mesclar(base, extra) {
    if (Array.isArray(base)) return Array.isArray(extra) && extra.length ? extra.map((x, i) => mesclar(base[i] || base[0], x)) : clone(base);
    if (base && typeof base === 'object') {
      const r = {};
      for (const k of new Set([...Object.keys(base), ...Object.keys(extra || {})])) r[k] = k in (extra || {}) ? mesclar(base[k], extra[k]) : clone(base[k]);
      return r;
    }
    return extra === undefined ? base : extra;
  }

  let cfg = clone(PADRAO);
  KM.config = () => cfg;
  const obter = (caminho) => caminho.split('.').reduce((o, k) => (o == null ? o : o[k]), cfg);
  const definir = (caminho, v) => {
    const ks = caminho.split('.'); let o = cfg;
    for (const k of ks.slice(0, -1)) o = o[k];
    o[ks.at(-1)] = v;
  };

  // ------------------------------------------------------------------ servidor
  // BK = onde o funcionário trabalha: servidor do PC (local) ou GitHub (celular). Ver js/nuvem.js.
  let BK = null, online = false;
  let timerSalvar = null, salvando = Promise.resolve();
  function salvar(imediato) {
    cfg.salvoEm = Date.now();
    localStorage.setItem('kwik-mini-config', JSON.stringify(cfg));
    clearTimeout(timerSalvar);
    if (!online) return;
    timerSalvar = setTimeout(() => {
      const copia = clone(cfg);
      salvando = salvando.then(() => BK.salvarConfig(copia)).catch(() => { /* tenta na próxima */ });
    }, imediato ? 0 : BK.nome === 'github' ? 4000 : 350);
  }

  // ------------------------------------------------------------------ estado da cena
  const estado = {
    pessoas: {}, principal: 'f1', trabalhoDe: {}, sala: 'escritorio',
    tv: { modo: 'normal', progresso: 0 },
    caixa: 0, relatorios: [], selecionado: null, relAberto: null,
  };
  KM.estado = estado;
  const func = id => cfg.funcionarios.find(f => f.id === (id || estado.selecionado || estado.principal)) || cfg.funcionarios[0];
  const pessoaDe = id => estado.pessoas[id || estado.selecionado || estado.principal];
  const ROTULO_TRABALHO = { noticias: '📰 Buscar notícias', checklist: '📋 Abrir prancheta', prospeccao: '📞 Buscar clientes' };

  // Cria/atualiza os bonecos da cena a partir dos funcionários da configuração.
  const doms = {};
  function sincronizarPessoas() {
    const ids = new Set(cfg.funcionarios.map(f => f.id));
    for (const id of Object.keys(estado.pessoas)) if (!ids.has(id)) { delete estado.pessoas[id]; if (doms[id]) { doms[id].cracha.remove(); doms[id].balao.remove(); delete doms[id]; } }
    for (const f of cfg.funcionarios) {
      let p = estado.pessoas[f.id];
      if (!p) {
        const a = KM.LAYOUT.assentos[f.funcao] || KM.LAYOUT.assentos.noticias;
        p = estado.pessoas[f.id] = { id: f.id, funcao: f.funcao, modo: 'sentado', X: a.X, Y: a.Y, Z: 0, dir: a.dir, est: {}, visivel: true, fase: Math.random() * 3, piscarEm: 1 + Math.random() * 3 };
      }
      p.funcao = f.funcao;
      if (!doms[f.id]) {
        const cracha = el('div', { class: 'cracha' }, el('i'), el('span', {}));
        const balao = el('div', { class: 'balao' });
        $('#palco').append(cracha, balao);
        doms[f.id] = { cracha, balao, timer: null };
      }
      doms[f.id].cracha.querySelector('span').textContent = f.nome;
    }
  }

  // ------------------------------------------------------------------ toasts / fala / banner
  function toast(msg, opc = {}) {
    const t = el('div', { class: 'toast' + (opc.erro ? ' erro' : '') }, el('span', {}, msg));
    if (opc.botao) t.append(el('button', { onclick: () => { opc.botao[1](); t.remove(); } }, opc.botao[0]));
    $('#toasts').append(t);
    setTimeout(() => t.remove(), opc.ms || 4200);
  }
  KM.onFala = (id, txt, ms = 2500) => {
    if (typeof txt !== 'string') { ms = txt || ms; txt = id; id = estado.selecionado || estado.principal; } // chamada antiga: (texto, ms)
    const d = doms[id]; if (!d) return;
    d.balao.textContent = txt; d.balao.classList.add('on');
    clearTimeout(d.timer); d.timer = setTimeout(() => d.balao.classList.remove('on'), ms);
  };
  const falar = (id, txt, ms) => KM.onFala(id, txt, ms);
  KM.onBanner = (txt, nivel) => {
    const b = $('#banner'); b.textContent = txt;
    b.className = 'banner' + (nivel === 'deus' ? ' deus' : nivel === 'verde' ? ' verde' : '');
    void b.offsetWidth; b.classList.add('on');
  };
  KM.onOcupado = () => atualizarBotoes();

  // ------------------------------------------------------------------ caixa / funcionário
  let caixaMostrado = 0;
  function animarCaixa() {
    const alvo = cfg.economia.caixa;
    const ini = caixaMostrado, t0 = performance.now();
    const passo = () => {
      const k = Math.min(1, (performance.now() - t0) / 900);
      caixaMostrado = ini + (alvo - ini) * (1 - Math.pow(1 - k, 3));
      $('#caixaValor').textContent = brl(caixaMostrado);
      if (k < 1) requestAnimationFrame(passo);
    };
    passo();
    $('#caixa').classList.remove('pulso'); void $('#caixa').offsetWidth; $('#caixa').classList.add('pulso');
  }

  function nivelDe(xp) {
    let i = 0;
    for (let k = 0; k < NIVEIS.length; k++) if (xp >= NIVEIS[k][0]) i = k;
    const atual = NIVEIS[i][0], prox = NIVEIS[i + 1] ? NIVEIS[i + 1][0] : null;
    return { i, nome: NIVEIS[i][1], pct: prox ? Math.round(100 * (xp - atual) / (prox - atual)) : 100, falta: prox ? prox - xp : 0 };
  }
  const saiyanDoNivel = i => (i >= 4 ? 3 : i >= 2 ? 2 : 1);

  function desenharAvatar(canvas, est = {}, recorte, id) {
    const s = KM.sprite(func(id).aparencia, est);
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, canvas.width, canvas.height);
    if (recorte) g.drawImage(s, 0, recorte, 30, canvas.height, 0, 0, 30, canvas.height);
    else g.drawImage(s, 0, 0);
  }

  function atualizarFuncionario() {
    const f = func(), n = nivelDe(f.xp);
    $('#latNome').textContent = f.nome;
    for (const g of cfg.funcionarios) if (doms[g.id]) doms[g.id].cracha.querySelector('span').textContent = g.nome;
    $('#latCargo').textContent = f.cargo;
    $('#latNivel').textContent = `Nv. ${n.i + 1} · ${n.nome}`;
    $('#latXp').style.width = n.pct + '%';
    $('#latXp').parentElement.title = n.falta ? `Faltam ${n.falta} tarefa(s) para o próximo nível` : 'Nível máximo!';
    $('#latTarefas').textContent = f.tarefas;
    $('#latGanhos').textContent = brlCurto(f.ganhos);
    desenharAvatar($('#avatarLateral'), { boca: 'sorriso' }, 2, f.id);
    $('#nomeEscritorio').textContent = cfg.escritorio.nome || 'Mini Escritório';
    $('#tituloPalco').innerHTML = '';
    $('#tituloPalco').append(document.createTextNode((cfg.escritorio.nome || 'Mini Escritório') + ' '), el('span', {}, 'KWIK'));
  }

  function atualizarBotoes() {
    const tb = $('#btTrabalhar'), f = func(), p = pessoaDe();
    const ocupadoTrab = p && p.trabalhando && f.funcao !== 'checklist';
    tb.disabled = !!ocupadoTrab;
    tb.textContent = ocupadoTrab ? '⏳ Trabalhando…' : estado.selecionado ? (ROTULO_TRABALHO[f.funcao] || '▶ Trabalhar') : '▶ Trabalhar';
    tb.classList.toggle('pronto', !!estado.selecionado && !ocupadoTrab);
    const trab = Object.values(estado.pessoas).filter(q => q.trabalhando);
    const pill = $('#statusPill');
    pill.classList.toggle('trab', trab.length > 0);
    pill.querySelector('span').textContent = trab.length ? trab.map(q => func(q.id).nome.split(' ')[0]).join(' e ') + (trab.length > 1 ? ' trabalhando' : ' trabalhando')
      : KM.fx.ocupado ? 'Equipe se divertindo' : 'Equipe livre';
    for (const [id, d] of Object.entries(doms)) {
      const q = estado.pessoas[id];
      d.cracha.classList.toggle('trab', !!(q && q.trabalhando));
      d.cracha.classList.toggle('sel', estado.selecionado === id);
    }
  }

  // ------------------------------------------------------------------ seleção de funcionário
  function abrirEquipe() {
    const box = $('#equipe'); box.innerHTML = '';
    for (const f of cfg.funcionarios) {
      const cv = el('canvas', { width: 30, height: 46 });
      const n = nivelDe(f.xp);
      const card = el('button', {
        class: 'membro' + (estado.selecionado === f.id ? ' sel' : ''), onclick: () => {
          selecionar(f.id); $('#dlgEquipe').close();
        },
      }, cv, el('b', {}, f.nome), el('span', {}, f.cargo), el('span', {}, `Nv. ${n.i + 1} · ${n.nome} · ${f.tarefas} tarefa(s)`), el('small', { class: 'funcao' }, ROTULO_TRABALHO[f.funcao] || ''));
      box.append(card);
      desenharAvatar(cv, { bracos: 'aceno', boca: 'sorriso' }, 0, f.id);
    }
    box.append(el('div', { class: 'membro novo', title: 'Em breve você poderá contratar mais gente' }, el('b', {}, '+'), el('span', {}, 'Contratar'), el('span', {}, '(em breve)')));
    $('#dlgEquipe').showModal();
  }
  const OLA = {
    noticias: 'Oi! Sou {n}. Busco as notícias contábeis do dia 📰',
    checklist: 'Oi! Sou {n}. Vamos organizar suas tarefas? 📋',
    prospeccao: 'Opa! Sou o {n}. Vou achar clientes novos 📞',
  };
  function selecionar(id) {
    estado.selecionado = id;
    for (const q of Object.values(estado.pessoas)) q.selecionado = q.id === id;
    KM.acordar(id || undefined);
    KM.tocar('clique');
    if (id) {
      const f = func(id);
      falar(id, (OLA[f.funcao] || 'Oi! Sou {n}.').replace('{n}', f.nome.split(' ')[0]), 2800);
      toast(`${f.nome} selecionado. Agora aperte ${ROTULO_TRABALHO[f.funcao] || '▶ Trabalhar'}.`);
    }
    atualizarFuncionario(); atualizarBotoes();
  }

  // ------------------------------------------------------------------ trabalhar
  async function esperarLivre(p, ms = 3000) {
    p = p || pessoaDe();
    if (!p) return false;
    await KM.pararRotina(p);
    const ini = performance.now();
    while (p.acao && performance.now() - ini < ms) await KM.esperar(80);
    return !p.acao;
  }

  // Dinheiro na hora de mandar a tarefa.
  function pagar(f, p) {
    const valor = Number(cfg.economia.valorTarefa) || 0;
    KM.explosaoDinheiro(valor, p.id);
    cfg.economia.caixa += valor; f.ganhos += valor;
    estado.caixa = cfg.economia.caixa; animarCaixa(); atualizarFuncionario(); salvar();
    return valor;
  }
  // XP, nível e comemoração ao entregar.
  async function concluir(f, p) {
    const antes = nivelDe(f.xp);
    f.xp += 1; f.tarefas += 1; salvar();
    const depois = nivelDe(f.xp);
    atualizarFuncionario();
    if (depois.i > antes.i) {
      setTimeout(() => KM.onBanner('SUBIU DE NÍVEL: ' + depois.nome.toUpperCase() + '!', 'verde'), 300);
      toast(`🎖️ ${f.nome} subiu para ${depois.nome}!`);
    }
    if (cfg.opcoes.comemorar) { await KM.esperar(depois.i > antes.i ? 2200 : 900); KM.comemorar(depois.i >= 5 && depois.i > antes.i ? 'deus' : saiyanDoNivel(depois.i), p.id); }
    else KM.confete(80);
  }

  async function trabalhar() {
    ativo();
    const bt = $('#btTrabalhar');
    if (!estado.selecionado) {
      bt.classList.remove('sacudir'); void bt.offsetWidth; bt.classList.add('sacudir');
      toast('Primeiro selecione o funcionário 👤');
      return abrirEquipe();
    }
    const f = func(), p = pessoaDe();
    if (f.funcao === 'checklist') return KM.clara.trabalhar(f, p);
    if (f.funcao === 'prospeccao') return KM.maycon.trabalhar(f, p);
    return trabalharNoticias(f, p);
  }

  async function trabalharNoticias(f, p) {
    const bt = $('#btTrabalhar');
    if (p.trabalhando) return;
    if (!online) {
      if (BK && BK.nome === 'github') { toast('Conecte ao GitHub para ele poder trabalhar 🔗'); return abrirConexao(); }
      return toast('O servidor está desligado. Abra o ABRIR-ESCRITORIO.bat para ele acessar os sites.', { erro: true, ms: 6000 });
    }
    if (!(await esperarLivre(p, 1500))) return toast('Espere a animação terminar 😉');

    const valor = Number(cfg.economia.valorTarefa) || 0;
    const agora = new Date(), dd = n => String(n).padStart(2, '0');
    const pedido = {
      id: `${agora.getFullYear()}${dd(agora.getMonth() + 1)}${dd(agora.getDate())}-${dd(agora.getHours())}${dd(agora.getMinutes())}${dd(agora.getSeconds())}-${Math.random().toString(36).slice(2, 6)}`,
      funcionario: { id: f.id, nome: f.nome }, ganho: valor, tipo: 'noticias', criadoEm: agora.toISOString(),
    };
    let tarefa;
    bt.disabled = true; bt.textContent = '📨 Enviando…';
    try {
      tarefa = await BK.iniciar(pedido);
    } catch (e) {
      atualizarBotoes();
      return toast('Não consegui mandar a tarefa: ' + e.message, { erro: true, ms: 8000 });
    }
    p.trabalhando = true; estado.trabalhoDe.noticias = true;
    if (p.modo !== 'sentado') await KM.voltarSentar(p);
    p.est = { boca: 'sorriso' }; p.digitando = true; p.dormindo = false;
    estado.tv = { modo: 'trabalhando', progresso: 0 };
    pagar(f, p);
    falar(p.id, 'Partiu! Vou buscar as notícias 📰', 2200);
    iniciarPainelTarefa('📰 Notícias contábeis do dia');
    atualizarBotoes();

    const fim = await acompanhar(tarefa, p);
    p.trabalhando = false; estado.trabalhoDe.noticias = false; p.digitando = false; p.est = {};
    atualizarBotoes();
    if (fim.status === 'pronto') {
      estado.tv = { modo: 'pronto', progresso: 100 };
      setTimeout(() => { if (!p.trabalhando && estado.tv.modo === 'pronto') estado.tv.modo = 'normal'; }, 30000);
      await carregarRelatorios(fim.relatorio);
      const rid = fim.relatorio && fim.relatorio.id;
      toast(`📑 ${f.nome} entregou o relatório: ${fim.relatorio.qtdPrincipais} principais + ${fim.relatorio.qtdDia} do dia.`, { botao: ['Ver relatório', () => abrirRelatorio(rid)], ms: 9000 });
      falar(p.id, 'Relatório entregue! Está na aba Relatórios ✅', 2600);
      await concluir(f, p);
    } else {
      estado.tv = { modo: 'normal', progresso: 0 };
      falar(p.id, 'Não consegui acessar os sites 😓', 3000);
      toast('A tarefa falhou: ' + (fim.erro || 'erro desconhecido'), { erro: true, ms: 8000 });
    }
  }

  // Painel "Tarefa atual" + moedinhas enquanto trabalha (usado por Léo e Maycon).
  function iniciarPainelTarefa(titulo) {
    $('#tarefaVazia').hidden = true; $('#tarefaAtiva').hidden = false;
    $('#tarefaTitulo').textContent = titulo;
    $('#tarefaLog').innerHTML = ''; $('#tarefaBarra').style.width = '0%';
  }
  function callbacksTarefa(p, comTV) {
    let ultimaMoeda = performance.now();
    return {
      progresso(v) { if (comTV) estado.tv.progresso = v; $('#tarefaBarra').style.width = v + '%'; },
      etapa(texto) {
        $('#tarefaLog').append(el('li', { class: /errado|não respondeu|falhou/.test(texto) ? 'erro' : '' }, texto));
        $('#tarefaLog').scrollTop = 1e6;
        falar(p.id, texto, 2400);
      },
      tique() {
        if (performance.now() - ultimaMoeda < 2200) return;
        ultimaMoeda = performance.now();
        const [x, y] = p.cabecaTela || [126, 100];
        KM.emitir('moeda', 3, i => ({ x: x + (Math.random() * 10 - 5), y, vx: Math.random() * 60 - 30, vy: -90, g: 220, vida: 0.9 }));
        KM.tocar('moeda');
      },
    };
  }
  function acompanhar(id, p) { return BK.acompanhar(id, callbacksTarefa(p, true)); }

  // ------------------------------------------------------------------ animações (menu)
  const SO_PARADO = new Set(['ss1', 'ss2', 'ss3', 'deus', 'branco', 'danca', 'pulos', 'teleporte', 'soneca']);
  async function animacao(nome) {
    ativo();
    $('#menuAnim').classList.remove('on');
    const p = pessoaDe(), f = func();
    if (nome === 'dinheiro') return KM.explosaoDinheiro(Number(cfg.economia.valorTarefa) || 0, p.id);
    if (nome === 'confete') return KM.confete();
    if (KM.filmes && KM.filmes[nome]) { // animações em grupo: só quem não está trabalhando
      irPara('escritorio');
      const livres = Object.values(estado.pessoas).filter(q => !q.trabalhando);
      if (livres.length < 2) return toast('Precisa de pelo menos 2 funcionários livres para essa cena 🎬');
      const ok = await KM.filmes[nome](livres.map(q => q.id));
      if (ok === false) toast('Alguém já está em outra animação. Tente de novo em instantes 😄');
      return;
    }
    if (p.trabalhando && SO_PARADO.has(nome)) return toast(`${f.nome} está trabalhando! Espere terminar 💼`);
    if (p.acao && p.acao !== 'soneca' && p.acao !== 'rotina') return toast('Calma! Uma animação de cada vez 😄');
    irPara('escritorio');
    const id = p.id;
    const mapa = {
      ss1: () => KM.superSayajin(1, {}, id), ss2: () => KM.superSayajin(2, {}, id), ss3: () => KM.superSayajin(3, {}, id),
      deus: () => KM.superSayajin('deus', {}, id), branco: () => KM.superSayajin('branco', {}, id),
      chuva: () => KM.rodar('chuva', () => KM.chuvaDinheiro(4), [id]), danca: () => KM.danca(id), cafe: () => KM.cafe(id), foco: () => KM.foco(id),
      soneca: () => KM.soneca(8, id), pulos: () => KM.pulos(id), teleporte: () => KM.teleporte(id),
    };
    if (mapa[nome]) await mapa[nome]();
  }

  // ------------------------------------------------------------------ relatórios
  async function carregarRelatorios(novo) {
    if (!online) return;
    try {
      estado.relatorios = await BK.listar();
    } catch (e) { return; }
    if (novo && !estado.relatorios.some(r => r.id === novo.id)) estado.relatorios.unshift(novo);
    $('#qtdRel').textContent = estado.relatorios.length;
    renderUltimo();
    renderListaRel();
  }

  const fmtData = iso => { const d = new Date(iso); return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
  const fmtDia = s => s ? s.split('-').reverse().join('/') : '';
  const hora = q => (q && q.length > 10 ? q.slice(11, 16) : '');

  function renderUltimo() {
    const r = estado.relatorios[0], box = $('#ultimoRel');
    box.innerHTML = '';
    if (!r) { box.className = 'vazio'; box.textContent = 'Nenhum relatório ainda.'; return; }
    box.className = 'ultimo';
    box.append(el('b', {}, tituloRel(r)),
      el('span', {}, `${fmtData(r.criadoEm)} · por ${r.funcionario?.nome || '—'} · ${resumoRel(r)}`),
      el('div', { style: 'margin-top:10px' }, el('button', { class: 'bt peq escuro', onclick: () => abrirRelatorio(r.id) }, 'Abrir relatório →')));
  }

  const tituloRel = r => r.tipo === 'prospeccao' ? `📞 Clientes em ${r.cidade || '—'}${r.uf ? '-' + r.uf : ''}` : `📰 Notícias de ${fmtDia(r.diaData)}`;
  const resumoRel = r => r.tipo === 'prospeccao' ? `🏥 ${r.qtdClinicas || 0} clínicas · ☎️ ${r.qtdComTelefone || 0} com telefone` : `⭐ ${r.qtdPrincipais} principais · 📅 ${r.qtdDia} do dia`;
  function renderListaRel() {
    const box = $('#listaRel'); box.innerHTML = '';
    if (!estado.relatorios.length) { box.append(el('p', { class: 'vazio', style: 'padding:0 8px' }, 'As entregas do funcionário aparecem aqui.')); }
    for (const r of estado.relatorios) {
      box.append(el('button', { class: 'item-rel' + (estado.relAberto && estado.relAberto.id === r.id ? ' ativo' : ''), onclick: () => abrirRelatorio(r.id) },
        el('b', {}, tituloRel(r)),
        el('span', {}, `${fmtData(r.criadoEm)} · ${r.funcionario?.nome || '—'}`), el('br'),
        el('span', {}, resumoRel(r))));
    }
    if (!estado.relAberto) renderRel(null);
  }

  const cacheRel = new Map();
  async function abrirRelatorio(id) {
    irPara('relatorios');
    if (!id) return;
    let r = cacheRel.get(id);
    if (!r) {
      try { r = await BK.relatorio(id); cacheRel.set(id, r); } catch (e) { return toast('Não consegui abrir o relatório.', { erro: true }); }
    }
    estado.relAberto = r;
    renderListaRel(); renderRel(r);
  }

  const NOME_FONTE = { contabeis: 'Contábeis', contadores: 'Contadores' };
  function itemNoticia(n, i) {
    const meta = el('div', { class: 'meta' }, el('span', { class: 'fonte ' + n.fonte }, NOME_FONTE[n.fonte] || n.fonte));
    if (n.tambem_em) for (const o of n.tambem_em) meta.append(el('span', { class: 'fonte ' + o.fonte }, '+ ' + (NOME_FONTE[o.fonte] || o.fonte)));
    if (n.categoria) meta.append(el('span', { class: 'cat' }, n.categoria));
    if (hora(n.quando)) meta.append(el('span', {}, '· ' + hora(n.quando)));
    const corpo = el('div', {}, meta, el('a', { class: 'tit', href: n.url, target: '_blank', rel: 'noopener' }, n.titulo));
    if (n.resumo) corpo.append(el('p', {}, n.resumo));
    if (n.temas && n.temas.length) corpo.append(el('div', { class: 'meta', style: 'margin-top:6px' }, n.temas.slice(0, 4).map(t => el('span', { class: 'tema' }, t))));
    return el('div', { class: 'noticia' }, el('div', { class: 'n' }, String(i + 1)), corpo);
  }

  function renderRel(r) {
    const box = $('#relDetalhe'); box.innerHTML = '';
    if (!r) {
      box.append(el('div', { class: 'rel-vazio' }, el('div', { class: 'grande' }, '📑'),
        el('h2', {}, estado.relatorios.length ? 'Escolha um relatório' : 'Nenhuma entrega ainda'),
        el('p', { class: 'vazio' }, estado.relatorios.length ? 'Clique numa entrega à esquerda para ver as notícias.' : 'Volte ao escritório, selecione o funcionário e aperte Trabalhar.'),
        !estado.relatorios.length && el('button', { class: 'bt prim', onclick: () => irPara('escritorio') }, '🏢 Ir para o escritório')));
      return;
    }
    if (r.tipo === 'prospeccao') return KM.maycon.renderRel(r, box);
    const rel = el('div', { class: 'rel' });
    const chips = el('div', { class: 'chips' }, (r.fontes || []).map(f => el('span', { class: 'chip ' + (f.ok ? 'ok' : 'erro') }, `${f.ok ? '✓' : '✗'} ${f.nome}${f.ok ? ` · ${f.itens} lidas` : ' · falhou'}`)));
    rel.append(el('div', { class: 'rel-cab' },
      el('div', {}, el('h2', {}, `📰 Notícias contábeis · ${fmtDia(r.diaData)}`),
        el('p', {}, `Entregue por ${r.funcionario?.nome || '—'} em ${fmtData(r.criadoEm)} · levou ${r.duracao}s · ${r.totalLidas} notícias analisadas`), chips),
      el('div', { class: 'rel-bts' },
        el('button', { class: 'bt peq', onclick: () => copiarWhats(r) }, '📋 Copiar p/ WhatsApp'),
        el('button', { class: 'bt peq', onclick: () => baixarMd(r) }, '⬇️ Baixar .md'),
        el('button', { class: 'bt peq perigo', onclick: () => apagarRel(r) }, '🗑️ Apagar'))));

    const colP = el('div', { class: 'principal' },
      el('h3', {}, '⭐ Principais notícias ', el('span', { class: 'chip' }, String(r.principais.length))),
      el('p', { class: 'sub' }, 'Manchetes em destaque nos portais, priorizando temas dos clientes KWIK (Simples, MEI, Reforma, folha, prazos).'),
      r.principais.map(itemNoticia));

    const colD = el('div', {});
    const lista = el('div', {});
    let filtroFonte = '', busca = '';
    const desenharDia = () => {
      lista.innerHTML = '';
      const q = busca.toLowerCase();
      const itens = r.dia.filter(n => (!filtroFonte || n.fonte === filtroFonte) && (!q || (n.titulo + ' ' + (n.resumo || '') + ' ' + (n.categoria || '')).toLowerCase().includes(q)));
      itens.forEach((n, i) => lista.append(itemNoticia(n, i)));
      if (!itens.length) lista.append(el('p', { class: 'vazio' }, 'Nada encontrado com esse filtro.'));
    };
    const bts = ['', 'contabeis', 'contadores'].map(f => el('button', {
      class: f === '' ? 'on' : '', onclick: e => { filtroFonte = f; bts.forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); desenharDia(); },
    }, f ? NOME_FONTE[f] : 'Todas'));
    colD.append(el('h3', {}, '📅 Notícias do dia ', el('span', { class: 'chip' }, String(r.dia.length))),
      el('p', { class: 'sub' }, `Tudo o que os portais publicaram em ${fmtDia(r.diaData)}, da mais recente para a mais antiga.`),
      r.diaObs ? el('div', { class: 'obs' }, '⚠️ ' + r.diaObs) : null,
      (r.fontes || []).some(f => !f.ok && /403/.test(f.erro || '')) ? el('div', { class: 'obs' }, '⚠️ O Contadores.cnt.br bloqueia acessos vindos de servidores na nuvem (proteção do próprio site). Pelo PC, com o ABRIR-ESCRITORIO.bat, ele entra normalmente.') : null,
      el('div', { class: 'filtros' }, el('input', { type: 'search', placeholder: 'Buscar no dia…', oninput: e => { busca = e.target.value; desenharDia(); } }), bts),
      lista);
    desenharDia();
    rel.append(el('div', { class: 'colunas' }, colP, colD));
    box.append(rel);
  }

  function textoWhats(r) {
    const linhas = [`*📰 Notícias contábeis — ${fmtDia(r.diaData)}*`, '_KWIK Contabilidade Inteligente_', '', '*⭐ Principais*'];
    r.principais.forEach((n, i) => linhas.push(`${i + 1}. *${n.titulo}* (${NOME_FONTE[n.fonte]})`, n.url));
    linhas.push('', `*📅 Do dia (${r.dia.length})*`);
    r.dia.slice(0, 20).forEach(n => linhas.push(`• ${n.titulo}`));
    if (r.dia.length > 20) linhas.push(`… e mais ${r.dia.length - 20}.`);
    return linhas.join('\n');
  }
  async function copiarWhats(r) {
    try { await navigator.clipboard.writeText(textoWhats(r)); toast('Copiado! É só colar no WhatsApp 📋'); }
    catch (e) { toast('Não consegui copiar automaticamente.', { erro: true }); }
  }
  function baixarMd(r) {
    const l = [`# Notícias contábeis — ${fmtDia(r.diaData)}`, '', `Entregue por ${r.funcionario?.nome || '—'} em ${fmtData(r.criadoEm)}.`, '', '## ⭐ Principais notícias', ''];
    r.principais.forEach((n, i) => { l.push(`${i + 1}. **[${n.titulo}](${n.url})** — ${NOME_FONTE[n.fonte]}${n.categoria ? ' · ' + n.categoria : ''}`); if (n.resumo) l.push(`   ${n.resumo}`); });
    l.push('', '## 📅 Notícias do dia', '');
    if (r.diaObs) l.push(`> ${r.diaObs}`, '');
    r.dia.forEach(n => { l.push(`- ${hora(n.quando) ? hora(n.quando) + ' · ' : ''}[${n.titulo}](${n.url}) — ${NOME_FONTE[n.fonte]}`); });
    const blob = new Blob([l.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `Noticias contabeis ${r.diaData}.md` });
    document.body.append(a); a.click(); a.remove();
  }
  async function apagarRel(r) {
    if (!confirm('Apagar este relatório?')) return;
    try { await BK.apagar(r.id); } catch (e) { return toast('Não consegui apagar: ' + e.message, { erro: true }); }
    cacheRel.delete(r.id); estado.relAberto = null;
    await carregarRelatorios();
    renderRel(null);
  }

  // ------------------------------------------------------------------ personalização
  const PELES = ['#FFDBAC', '#F5D0B5', '#E8B48F', '#E0AC82', '#C68642', '#8D5524', '#5C3A21'];
  const CABELOS = ['#1C1C1C', '#2B1B12', '#3B2416', '#5A3825', '#6B4226', '#B5651D', '#E6C35C', '#9E9E9E', '#C0392B', '#28BE52', '#7B4FBF', '#3fb6ff'];
  const ROUPAS = ['#E9D5B7', '#28BE52', '#111A19', '#ffffff', '#2B3A55', '#3f7fc1', '#c9453a', '#e2b33c', '#7B4FBF', '#ff8fb1', '#8a8f94'];
  const SAPATOS = ['#1A1A1A', '#5A3A22', '#ffffff', '#28BE52', '#c9453a'];
  const PAREDES = ['#EBDCCB', '#DDF3E3', '#F4F4F2', '#2B3433', '#FFE3CC', '#D6E6F5', '#E9D8F2', '#FFF3C4'];
  const RODAPES = ['#6B4A35', '#1E8A45', '#111A19', '#cfcfc9', '#8f3f22', '#ffffff'];
  const PISOS = ['#B98A62', '#8B5E3C', '#D8C3A5', '#E4EAE5', '#5a4636', '#9aa3a1', '#6c7a89'];
  const MOVEIS = ['#9C5B3A', '#6B4226', '#e8e2d6', '#F2F2EE', '#1f2524', '#2b2f33', '#28BE52', '#3f7fc1'];
  const TAPETES = ['#F5C27E', '#28BE52', '#c9453a', '#3f7fc1', '#e9e4d8', '#7B4FBF', '#111A19', '#ff8c5a'];

  let persIdx = 0;
  const E = 'escritorio.';
  const camposFunc = () => {
    const F = `funcionarios.${persIdx}.`, A = F + 'aparencia.';
    return [
      { c: F + 'nome', t: 'texto', r: 'Nome' },
      { c: F + 'cargo', t: 'texto', r: 'Cargo' },
      { sec: 'Aparência' },
      { c: A + 'pele', t: 'cor', r: 'Pele', op: PELES },
      { c: A + 'cabelo', t: 'sel', r: 'Cabelo', op: { curto: 'Curto', longo: 'Longo', cacheado: 'Black power / cacheado', moicano: 'Moicano', rabo: 'Rabo de cavalo', coque: 'Coque', careca: 'Careca' } },
      { c: A + 'corCabelo', t: 'cor', r: 'Cor do cabelo', op: CABELOS },
      { sec: 'Roupa' },
      { c: A + 'estiloCamisa', t: 'sel', r: 'Estilo', op: { casual: 'Camisa casual (manga dobrada)', kwik: 'Polo KWIK', social: 'Camisa social + gravata', terno: 'Terno', moletom: 'Moletom' } },
      { c: A + 'corCamisa', t: 'cor', r: 'Cor da roupa', op: ROUPAS },
      { c: A + 'corGravata', t: 'cor', r: 'Gravata', op: ROUPAS },
      { c: A + 'calca', t: 'cor', r: 'Calça', op: ROUPAS },
      { c: A + 'sapato', t: 'cor', r: 'Sapato', op: SAPATOS },
      { c: A + 'corCordao', t: 'cor', r: 'Cordão do crachá', op: ['#E8613C', '#28BE52', '#111A19', '#3f7fc1', '#c9453a', '#e2b33c'] },
      { sec: 'Acessórios' },
      { t: 'checks', itens: [[A + 'oculos', '👓 Óculos'], [A + 'fone', '🎧 Fone'], [A + 'bone', '🧢 Boné'], [A + 'barba', '🧔 Barba'], [A + 'cracha', '🪪 Crachá']] },
    ];
  };
  const CAMPOS = {
    camposEsc: [
      { sec: 'Geral' },
      { c: E + 'nome', t: 'texto', r: 'Nome do escritório' },
      { c: E + 'ceu', t: 'sel', r: 'Céu da janela', op: { auto: 'Automático (pelo horário)', dia: 'Dia', tarde: 'Pôr do sol', noite: 'Noite' } },
      { sec: 'Paredes e piso' },
      { c: E + 'parede', t: 'cor', r: 'Parede', op: PAREDES },
      { c: E + 'rodape', t: 'cor', r: 'Rodapé', op: RODAPES },
      { c: E + 'piso', t: 'sel', r: 'Piso', op: { madeira: 'Madeira', taco: 'Taco', piso: 'Porcelanato', carpete: 'Carpete' } },
      { c: E + 'corPiso', t: 'cor', r: 'Cor do piso', op: PISOS },
      { sec: 'Tapete' },
      { t: 'checks', itens: [[E + 'tapete', 'Mostrar tapete']] },
      { c: E + 'corTapete', t: 'cor', r: 'Cor do tapete', op: TAPETES },
      { c: E + 'padraoTapete', t: 'sel', r: 'Desenho', op: { losango: 'Losango', kwik: 'Logo KWIK', listras: 'Listras' } },
      { sec: 'Móveis' },
      { c: E + 'mesa', t: 'cor', r: 'Mesa', op: MOVEIS },
      { c: E + 'cadeira', t: 'cor', r: 'Cadeira', op: ROUPAS },
      { c: E + 'estante', t: 'cor', r: 'Estante', op: MOVEIS },
      { sec: 'O que aparece na sala' },
      { t: 'checks', itens: [[E + 'itens.planta', '🪴 Planta'], [E + 'itens.estante', '📚 Estante'], [E + 'itens.janela', '🪟 Janela'], [E + 'itens.relogio', '🕒 Relógio'],
        [E + 'itens.tv', '📺 Painel de status'], [E + 'itens.grafico', '📈 Quadro de gráfico'], [E + 'itens.logo', '🟩 Logo KWIK'], [E + 'itens.quadros', '🖼️ Quadros'],
        [E + 'itens.cofre', '💰 Cofre e moedas'], [E + 'itens.lixeira', '🗑️ Lixeira']] },
    ],
    camposEco: [
      { c: 'economia.valorTarefa', t: 'num', r: 'R$ por tarefa' },
      { c: 'maycon.cidade', t: 'texto', r: 'Cidade do Maycon' },
      { c: 'maycon.uf', t: 'sel', r: 'Estado (UF)', op: Object.fromEntries(['', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(u => [u, u || '—'])) },
      { t: 'checks', itens: [['opcoes.comemorar', '⚡ Vira Super Sayajin ao entregar'], ['opcoes.soneca', '😴 Cochila se ficar parado (3 min)'], ['opcoes.fotos', '📸 Maycon tira fotos quando está livre'], ['opcoes.som', '🔊 Sons']] },
    ],
  };

  function mudou(semSalvar) {
    KM.limparCache();
    estado.caixa = cfg.economia.caixa;
    KM.som.ligado = cfg.opcoes.som;
    $('#btSom').textContent = cfg.opcoes.som ? '🔊' : '🔇';
    atualizarFuncionario(); atualizarBotoes();
    if (semSalvar !== true) salvar();
  }

  function montarAbasFunc() {
    const box = $('#persAbas'); if (!box) return;
    box.innerHTML = '';
    cfg.funcionarios.forEach((f, i) => box.append(el('button', { class: i === persIdx ? 'on' : '', onclick: () => { persIdx = i; montarCampos(); preencherCampos(); } }, f.nome)));
  }
  function montarCampos() {
    montarAbasFunc();
    for (const [id, lista] of Object.entries({ camposFunc: camposFunc(), ...CAMPOS })) {
      const box = $('#' + id); box.innerHTML = '';
      for (const d of lista) {
        if (d.sec) { box.append(el('h4', {}, d.sec)); continue; }
        if (d.t === 'checks') {
          box.append(el('div', { class: 'checks', style: 'margin-bottom:10px' }, d.itens.map(([c, r]) =>
            el('label', {}, el('input', { type: 'checkbox', 'data-c': c, onchange: e => { definir(c, e.target.checked); mudou(); } }), r))));
          continue;
        }
        let ctrl;
        if (d.t === 'texto') ctrl = el('input', { type: 'text', 'data-c': d.c, maxlength: 40, oninput: e => { definir(d.c, e.target.value); mudou(); } });
        else if (d.t === 'num') ctrl = el('input', { type: 'number', min: 0, step: 10, 'data-c': d.c, oninput: e => { definir(d.c, Math.max(0, Number(e.target.value) || 0)); mudou(); } });
        else if (d.t === 'sel') ctrl = el('select', { 'data-c': d.c, onchange: e => { definir(d.c, e.target.value); mudou(); } }, Object.entries(d.op).map(([v, r]) => el('option', { value: v }, r)));
        else if (d.t === 'cor') {
          ctrl = el('div', { class: 'cores', 'data-c': d.c, 'data-cor': '1' },
            d.op.map(c => el('button', { type: 'button', title: c, style: `background:${c}`, 'data-v': c, onclick: () => { definir(d.c, c); mudou(); preencherCampos(); } })),
            el('input', { type: 'color', title: 'Outra cor', oninput: e => { definir(d.c, e.target.value); mudou(); marcarCores(); } }));
        }
        box.append(el('div', { class: 'campo' }, el('label', {}, d.r), ctrl));
      }
    }
    const temas = $('#temas'); temas.innerHTML = '';
    for (const [nome, t] of Object.entries(TEMAS)) {
      temas.append(el('button', { onclick: () => { Object.assign(cfg.escritorio, t); if (!t.ceu) cfg.escritorio.ceu = 'auto'; mudou(); preencherCampos(); KM.tocar('clique'); toast('Tema aplicado: ' + nome); } },
        el('i', { style: `background:linear-gradient(135deg, ${t.parede} 50%, ${t.corPiso} 50%)` }), nome));
    }
  }
  function marcarCores() {
    for (const box of $$('[data-cor]')) {
      const v = String(obter(box.dataset.c) || '').toLowerCase();
      box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v.toLowerCase() === v));
      box.querySelector('input').value = /^#[0-9a-f]{6}$/i.test(v) ? v : '#000000';
    }
  }
  function preencherCampos() {
    for (const c of $$('[data-c]')) {
      const v = obter(c.dataset.c);
      if (c.type === 'checkbox') c.checked = !!v;
      else if (c.tagName === 'INPUT' || c.tagName === 'SELECT') { if (document.activeElement !== c) c.value = v ?? ''; }
    }
    marcarCores();
  }

  // ------------------------------------------------------------------ abas
  function irPara(aba) {
    $$('.abas button').forEach(b => b.classList.toggle('ativa', b.dataset.aba === aba));
    $$('.aba').forEach(s => s.classList.toggle('ativa', s.id === 'aba-' + aba));
    if (location.hash !== '#' + aba) history.replaceState(null, '', '#' + aba);
    if (aba === 'personalizar') preencherCampos();
    if (aba === 'relatorios') renderListaRel();
  }

  // ------------------------------------------------------------------ inatividade (soneca)
  let ultimaAtividade = performance.now();
  function ativo() {
    ultimaAtividade = performance.now();
    KM.acordar();
  }

  // ------------------------------------------------------------------ laço de desenho
  const tela = $('#tela'), ctx = tela.getContext('2d'), palco = $('#palco');
  let ultimo = performance.now(), proxPiscar = 2, previewT = 0;
  function quadro(agora) {
    const t = agora / 1000, dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    // piscar de olhos (cada um no seu ritmo)
    for (const q of Object.values(estado.pessoas)) {
      if (t > q.piscarEm) { q.est.piscar = true; if (t > q.piscarEm + 0.12) { q.est.piscar = false; q.piscarEm = t + 2 + Math.random() * 3; } }
    }
    KM.atualizarEfeitos(dt, t);
    KM.desenhar(ctx, cfg, estado, t);
    KM.desenharEfeitos(ctx, t);

    // tremor da tela
    const tr = KM.fx.tremor;
    tela.style.transform = tr > 0.05 ? `translate(${(Math.random() * 2 - 1) * tr * 2}px, ${(Math.random() * 2 - 1) * tr * 2}px)` : '';
    palco.classList.toggle('noite', KM.periodo(cfg) === 'noite');

    // crachás e balões acima das cabeças
    const r = tela.getBoundingClientRect(), pr = palco.getBoundingClientRect(), esc = r.width / KM.W;
    for (const [id, d] of Object.entries(doms)) {
      const q = estado.pessoas[id];
      const cab = q && q.cabecaTela;
      const some = !q || q.visivel === false || !cab || estado.jogando;
      // o nome só aparece em quem você tocou; o balão de fala aparece sempre
      d.cracha.style.display = some || estado.selecionado !== id ? 'none' : ''; d.balao.style.display = some ? 'none' : '';
      if (some) continue;
      const cx = r.left - pr.left + cab[0] * esc, cy = r.top - pr.top + (cab[1] - 3) * esc;
      d.cracha.style.left = cx + 'px'; d.cracha.style.top = cy + 'px';
      d.balao.style.left = Math.max(100, Math.min(pr.width - 100, cx)) + 'px'; d.balao.style.top = (cy - (estado.selecionado === id ? d.cracha.offsetHeight + 10 : 4)) + 'px';
    }

    // prévia animada na personalização
    if ($('#aba-personalizar').classList.contains('ativa') && t - previewT > 0.15) {
      previewT = t;
      const fase = Math.floor(t / 2) % 4;
      desenharAvatar($('#previewFunc'), { bracos: fase === 1 ? 'aceno' : 'baixo', aceno: Math.floor(t * 4) % 2, boca: fase >= 1 ? 'sorriso' : 'normal', piscar: (t % 3) < 0.15 }, 0, (cfg.funcionarios[persIdx] || cfg.funcionarios[0]).id);
    }
    // soneca automática (Léo e Clara; o Maycon fica tirando fotos)
    if (cfg.opcoes.soneca && agora - ultimaAtividade > 180000) {
      ultimaAtividade = agora;
      for (const q of Object.values(estado.pessoas)) if (q.funcao !== 'prospeccao' && !q.trabalhando && !q.acao && q.modo === 'sentado') KM.soneca(0, q.id);
    }
    requestAnimationFrame(quadro);
  }

  // ------------------------------------------------------------------ eventos
  function ligarEventos() {
    $$('.abas button').forEach(b => b.addEventListener('click', () => { ativo(); irPara(b.dataset.aba); }));
    $('#btSelecionar').addEventListener('click', () => { ativo(); abrirEquipe(); });
    $('#btTrabalhar').addEventListener('click', trabalhar);
    $('#btAnimacoes').addEventListener('click', e => { ativo(); e.stopPropagation(); $('#menuAnim').classList.toggle('on'); });
    document.addEventListener('click', e => { if (!e.target.closest('#menuAnim')) $('#menuAnim').classList.remove('on'); });
    $$('[data-anim]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); animacao(b.dataset.anim); }));
    $('[data-fechar]').addEventListener('click', () => $('#dlgEquipe').close());
    $('#dlgEquipe').addEventListener('click', e => { if (e.target === $('#dlgEquipe')) $('#dlgEquipe').close(); });
    $('#btSom').addEventListener('click', () => { cfg.opcoes.som = !cfg.opcoes.som; mudou(); preencherCampos(); KM.tocar('clique'); });
    $('#btZerarCaixa').addEventListener('click', () => {
      if (!confirm('Zerar o caixa do escritório?')) return;
      cfg.economia.caixa = 0; for (const f of cfg.funcionarios) f.ganhos = 0; mudou(); animarCaixa();
    });
    $('#btRestaurar').addEventListener('click', () => {
      if (!confirm('Voltar o escritório, os funcionários e o caixa ao padrão? (Os relatórios e a prancheta continuam salvos.)')) return;
      const lista = cfg.checklist;
      cfg = clone(PADRAO); cfg.checklist = lista; sincronizarPessoas(); mudou(); montarCampos(); preencherCampos(); animarCaixa();
    });
    const pontoLogico = e => { const r = tela.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * KM.W, (e.clientY - r.top) / r.height * KM.H]; };
    tela.addEventListener('click', e => {
      ativo();
      const [x, y] = pontoLogico(e);
      const id = KM.pessoaEm(estado, x, y);
      if (id) return selecionar(estado.selecionado === id ? null : id);
      if (KM.jogos.cliqueArea(x, y)) return;
      if (estado.selecionado) selecionar(null); // tocar no vazio esconde o nome
    });
    tela.addEventListener('mousemove', e => {
      const [x, y] = pontoLogico(e);
      tela.style.cursor = KM.pessoaEm(estado, x, y) || KM.jogos.sobre(x, y) ? 'pointer' : 'default';
    });
    document.addEventListener('keydown', ativo);
    window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (['escritorio', 'relatorios', 'personalizar'].includes(h)) irPara(h); });
    $$('[data-fechar]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  }

  // ------------------------------------------------------------------ início
  // Escolhe onde trabalhar: servidor do PC (se aberto em localhost) ou GitHub.
  let erroConexao = '';
  async function conectarBackend() {
    erroConexao = '';
    if (KM.ehPC) {
      try { const j = await KM.backends.local.carregar(); BK = KM.backends.local; online = true; return j; } catch (e) { /* servidor desligado */ }
    }
    BK = KM.backends.github;
    online = false;
    if (!BK.conectado()) return null;
    try { const j = await BK.carregar(); online = true; return j; } catch (e) { erroConexao = e.message; return null; }
  }

  function mostrarAviso() {
    const av = $('.aviso-off');
    document.body.classList.toggle('offline', !online);
    $('#btGithub').hidden = !BK || BK.nome !== 'github';
    $('#btGithub').classList.toggle('ok', online);
    if (online) return;
    av.innerHTML = '';
    if (BK.nome === 'github') {
      av.append(erroConexao ? `⚠️ Não consegui falar com o GitHub: ${erroConexao} ` : '📱 Para o funcionário trabalhar daqui, conecte ao GitHub (uma vez por aparelho). ',
        el('button', { class: 'bt peq escuro', onclick: abrirConexao }, '🔗 Conectar'));
    } else av.append('⚠️ O servidor do escritório está desligado. Abra o ABRIR-ESCRITORIO.bat.');
  }

  function aplicarDados(j) {
    const local = (() => { try { return JSON.parse(localStorage.getItem('kwik-mini-config') || 'null'); } catch (e) { return null; } })();
    const remoto = j && j.config;
    const salvo = remoto && local ? ((local.salvoEm || 0) > (remoto.salvoEm || 0) ? local : remoto) : (remoto || local);
    cfg = mesclar(PADRAO, salvo || {});
    let migrou = false;
    if (salvo && (salvo.versao || 1) < 2) { // versão 2: boneco novo em 3/4 — aplica o visual novo, mantém nome e progresso
      for (const f of cfg.funcionarios) f.aparencia = clone(PADRAO.funcionarios[0].aparencia);
      cfg.versao = 2; migrou = true;
    }
    if ((cfg.versao || 1) < 3 || cfg.funcionarios.length < PADRAO.funcionarios.length) { // versão 3: chegam Clara e Maycon
      for (const pf of PADRAO.funcionarios) if (!cfg.funcionarios.some(f => f.id === pf.id)) { cfg.funcionarios.push(clone(pf)); migrou = true; }
      cfg.versao = 3;
    }
    for (const f of cfg.funcionarios) if (!f.funcao) f.funcao = (PADRAO.funcionarios.find(x => x.id === f.id) || { funcao: 'noticias' }).funcao;
    sincronizarPessoas();
    estado.relatorios = (j && j.relatorios) || [];
    estado.caixa = cfg.economia.caixa; caixaMostrado = cfg.economia.caixa;
    $('#caixaValor').textContent = brl(caixaMostrado);
    $('#qtdRel').textContent = estado.relatorios.length;
    if (online && (migrou || (remoto && salvo === local))) salvar(true); // visual novo ou mudanças mais novas deste aparelho
  }

  function abrirConexao() {
    const gh = KM.backends.github, c = gh.conf(), outro = gh.tokenDeOutroApp();
    const corpo = $('#ghCorpo'); corpo.innerHTML = '';
    const inpTok = el('input', { type: 'password', value: c.token, placeholder: 'github_pat_…', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    const inpRepo = el('input', { type: 'text', value: c.repo, autocapitalize: 'off', spellcheck: 'false' });
    const status = el('p', { class: 'vazio', style: 'min-height:20px;margin:10px 0 0' });
    corpo.append(...[
      el('div', { class: 'passos', html: `<b>Como gerar o token (uma vez por aparelho):</b><ol>
        <li>Abra <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a> logado na sua conta.</li>
        <li>Nome: <i>KWIK Mini Escritório</i>. Validade: até 1 ano.</li>
        <li><b>Repository access</b> → <i>Only select repositories</i> → <b>KWIK-MINI-ESCRITORIO</b> (pode marcar junto os do KWIK Fiscal e Folha e usar um token só).</li>
        <li><b>Permissions</b> → <b>Contents</b> → <i>Read and write</i>.</li>
        <li><b>Generate token</b>, copie e cole abaixo.</li></ol>
        <small>Já tem o token do KWIK Fiscal? Em vez de criar outro, edite-o em <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noopener">Fine-grained tokens</a> e adicione o repositório KWIK-MINI-ESCRITORIO. O token fica guardado só neste aparelho.</small>` }),
      outro && !c.token ? el('div', { class: 'obs', style: 'margin-top:12px' }, `Este aparelho já tem o token do ${outro.nome}. `,
        el('button', { class: 'bt peq', onclick: () => { inpTok.value = outro.token; status.textContent = 'Token copiado. Agora toque em Conectar.'; } }, 'Usar o mesmo token')) : null,
      el('div', { class: 'campo', style: 'margin-top:14px' }, el('label', {}, 'Token'), inpTok),
      el('div', { class: 'campo' }, el('label', {}, 'Repositório'), inpRepo),
      status,
      el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px' },
        el('button', {
          class: 'bt prim', onclick: async e => {
            const bt = e.currentTarget; bt.disabled = true; status.textContent = 'Testando…';
            const repo = inpRepo.value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '') || gh.REPO_PADRAO;
            gh.salvarConf({ ...gh.conf(), repo, token: inpTok.value.trim() });
            try {
              await gh.testar();
              const j = await conectarBackend();
              if (!online) throw new Error(erroConexao || 'falhou');
              aplicarDados(j); mudou(true); preencherCampos(); renderUltimo(); renderListaRel(); mostrarAviso();
              $('#dlgGithub').close(); toast('Conectado ao GitHub ✅ Pode mandar trabalhar!');
            } catch (err) { status.textContent = '❌ ' + err.message; }
            bt.disabled = false;
          },
        }, '🔗 Conectar'),
        c.token ? el('button', {
          class: 'bt perigo', onclick: () => {
            if (!confirm('Desconectar e apagar o token deste aparelho?')) return;
            gh.salvarConf({ ...gh.conf(), token: '' }); online = false; erroConexao = ''; mostrarAviso(); $('#dlgGithub').close();
          },
        }, 'Desconectar') : null)].filter(Boolean));
    $('#dlgGithub').showModal();
  }

  async function iniciar() {
    const j = await conectarBackend();
    aplicarDados(j);
    montarCampos(); ligarEventos(); mudou(true); preencherCampos();
    mostrarAviso();
    renderUltimo(); renderListaRel();
    if ('serviceWorker' in navigator) {
      if (!KM.ehPC) navigator.serviceWorker.register('sw.js').catch(() => {});
      else navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {}); // no PC, sempre os arquivos mais novos
    }
    // ao voltar para o app (celular), recarrega a lista de relatórios
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && online && !estado.trabalhando) carregarRelatorios();
      if (document.visibilityState === 'hidden' && timerSalvar && online) salvar(true); // não perde mudanças ao sair do app
    });
    $('#btGithub').addEventListener('click', abrirConexao);
    $('#dlgGithub [data-fechar]').addEventListener('click', () => $('#dlgGithub').close());
    const h = location.hash.slice(1);
    if (['relatorios', 'personalizar'].includes(h)) irPara(h);
    requestAnimationFrame(quadro);
    KM.clara.iniciar(); KM.maycon.iniciar(); KM.jogos.iniciar();
    const hh = new Date().getHours(), sauda = hh < 12 ? 'Bom dia' : hh < 18 ? 'Boa tarde' : 'Boa noite';
    setTimeout(() => falar('f1', `${sauda}! Clique em um de nós para mandar trabalhar 👋`, 3800), 700);
    setTimeout(() => falar('clara', 'Oi! Eu cuido da sua prancheta de tarefas 📋', 3400), 2300);
    setTimeout(() => falar('maycon', 'E eu acho clientes novos! 📞📸', 3400), 3900);
  }

  // API para os módulos (Clara, Maycon, jogos, filmes).
  KM.app = {
    el, toast, salvar, mudou, cfg: () => cfg, estado, func, pessoaDe, pagar, concluir, falar, irPara, brl, fmtData,
    BK: () => BK, online: () => online, abrirConexao, carregarRelatorios, abrirRelatorio, animarCaixa, atualizarBotoes, atualizarFuncionario,
    iniciarPainelTarefa, callbacksTarefa, esperarLivre, apagarRel: r => apagarRel(r), desenharAvatar,
  };
  iniciar();
})();
