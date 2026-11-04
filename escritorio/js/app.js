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
    versao: 1,
    escritorio: {
      nome: 'Mini Escritório', parede: '#EBDCCB', rodape: '#6B4A35', piso: 'madeira', corPiso: '#B98A62',
      tapete: true, corTapete: '#F5C27E', padraoTapete: 'losango', mesa: '#9C5B3A', cadeira: '#2A2F33', estante: '#2b2f33', ceu: 'auto',
      itens: { planta: true, estante: true, janela: true, relogio: true, tv: true, grafico: true, logo: true, quadros: true, cofre: true, lixeira: true },
    },
    funcionarios: [{
      id: 'f1', nome: 'Léo', cargo: 'Analista de Notícias',
      aparencia: {
        pele: '#E0AC82', cabelo: 'curto', corCabelo: '#3B2416', estiloCamisa: 'kwik', corCamisa: '#28BE52', corGravata: '#28BE52',
        calca: '#2B3A55', sapato: '#1A1A1A', oculos: false, fone: false, bone: false, barba: false, corBone: '#28BE52',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }],
    economia: { valorTarefa: 150, caixa: 0 },
    opcoes: { comemorar: true, soneca: true, som: true },
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
    personagem: { modo: 'sentado', X: KM.LUGAR.X, Y: KM.LUGAR.Y, Z: 0, est: {}, selecionado: false, visivel: true },
    tv: { modo: 'normal', progresso: 0 },
    caixa: 0, trabalhando: false, relatorios: [], selecionado: null, relAberto: null,
  };
  KM.estado = estado;
  const func = () => cfg.funcionarios[0];

  // ------------------------------------------------------------------ toasts / fala / banner
  function toast(msg, opc = {}) {
    const t = el('div', { class: 'toast' + (opc.erro ? ' erro' : '') }, el('span', {}, msg));
    if (opc.botao) t.append(el('button', { onclick: () => { opc.botao[1](); t.remove(); } }, opc.botao[0]));
    $('#toasts').append(t);
    setTimeout(() => t.remove(), opc.ms || 4200);
  }
  let timerFala = null;
  KM.onFala = (txt, ms = 2500) => {
    const b = $('#balao'); b.textContent = txt; b.classList.add('on');
    clearTimeout(timerFala); timerFala = setTimeout(() => b.classList.remove('on'), ms);
  };
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

  function desenharAvatar(canvas, est = {}, recorte) {
    const s = KM.sprite(func().aparencia, est);
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, canvas.width, canvas.height);
    if (recorte) g.drawImage(s, 0, recorte, 26, canvas.height, 0, 0, 26, canvas.height);
    else g.drawImage(s, 0, 0);
  }

  function atualizarFuncionario() {
    const f = func(), n = nivelDe(f.xp);
    $('#latNome').textContent = f.nome; $('#crachaNome').textContent = f.nome;
    $('#latCargo').textContent = f.cargo;
    $('#latNivel').textContent = `Nv. ${n.i + 1} · ${n.nome}`;
    $('#latXp').style.width = n.pct + '%';
    $('#latXp').parentElement.title = n.falta ? `Faltam ${n.falta} tarefa(s) para o próximo nível` : 'Nível máximo!';
    $('#latTarefas').textContent = f.tarefas;
    $('#latGanhos').textContent = brlCurto(f.ganhos);
    desenharAvatar($('#avatarLateral'), { boca: 'sorriso' }, 2);
    $('#nomeEscritorio').textContent = cfg.escritorio.nome || 'Mini Escritório';
    $('#tituloPalco').innerHTML = '';
    $('#tituloPalco').append(document.createTextNode((cfg.escritorio.nome || 'Mini Escritório') + ' '), el('span', {}, 'KWIK'));
  }

  function atualizarBotoes() {
    const tb = $('#btTrabalhar');
    tb.disabled = estado.trabalhando;
    tb.textContent = estado.trabalhando ? '⏳ Trabalhando…' : '▶ Trabalhar';
    tb.classList.toggle('pronto', !!estado.selecionado && !estado.trabalhando);
    const pill = $('#statusPill');
    pill.classList.toggle('trab', estado.trabalhando);
    pill.querySelector('span').textContent = estado.trabalhando ? `${func().nome} está trabalhando` :
      KM.fx.ocupado === 'soneca' ? `${func().nome} está cochilando` : KM.fx.ocupado ? `${func().nome} está se divertindo` : `${func().nome} está livre`;
    $('#cracha').classList.toggle('trab', estado.trabalhando);
    $('#cracha').classList.toggle('sel', !!estado.selecionado);
  }

  // ------------------------------------------------------------------ seleção de funcionário
  function abrirEquipe() {
    const box = $('#equipe'); box.innerHTML = '';
    for (const f of cfg.funcionarios) {
      const cv = el('canvas', { width: 26, height: 42 });
      const n = nivelDe(f.xp);
      const card = el('button', {
        class: 'membro' + (estado.selecionado === f.id ? ' sel' : ''), onclick: () => {
          selecionar(f.id); $('#dlgEquipe').close();
        },
      }, cv, el('b', {}, f.nome), el('span', {}, f.cargo), el('span', {}, `Nv. ${n.i + 1} · ${n.nome} · ${f.tarefas} tarefa(s)`));
      box.append(card);
      desenharAvatar(cv, { bracos: 'aceno', boca: 'sorriso' });
    }
    box.append(el('div', { class: 'membro novo', title: 'Em breve você poderá contratar mais gente' }, el('b', {}, '+'), el('span', {}, 'Contratar'), el('span', {}, '(em breve)')));
    $('#dlgEquipe').showModal();
  }
  function selecionar(id) {
    estado.selecionado = id;
    estado.personagem.selecionado = !!id;
    KM.acordar();
    KM.tocar('clique');
    if (id) {
      KM.onFala(`Oi! Sou ${func().nome}. Pode mandar a tarefa! 💼`, 2600);
      toast(`${func().nome} selecionado. Agora aperte ▶ Trabalhar.`);
    }
    atualizarBotoes();
  }

  // ------------------------------------------------------------------ trabalhar
  async function esperarLivre(ms = 3000) {
    if (KM.fx.ocupado === 'soneca') KM.acordar();
    const ini = performance.now();
    while (KM.fx.ocupado && performance.now() - ini < ms) await KM.esperar(80);
    return !KM.fx.ocupado;
  }

  async function trabalhar() {
    ativo();
    const bt = $('#btTrabalhar');
    if (!estado.selecionado) {
      bt.classList.remove('sacudir'); void bt.offsetWidth; bt.classList.add('sacudir');
      toast('Primeiro selecione o funcionário 👤');
      return abrirEquipe();
    }
    if (estado.trabalhando) return;
    if (!online) {
      if (BK && BK.nome === 'github') { toast('Conecte ao GitHub para ele poder trabalhar 🔗'); return abrirConexao(); }
      return toast('O servidor está desligado. Abra o ABRIR-ESCRITORIO.bat para ele acessar os sites.', { erro: true, ms: 6000 });
    }
    if (!(await esperarLivre(KM.fx.ocupado === 'soneca' ? 3000 : 400))) return toast('Espere a animação terminar 😉');

    const f = func(), valor = Number(cfg.economia.valorTarefa) || 0;
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
    estado.trabalhando = true;
    const p = estado.personagem;
    if (p.modo !== 'sentado') await KM.voltarSentar();
    p.est = { boca: 'sorriso' }; p.digitando = true; p.dormindo = false;
    estado.tv = { modo: 'trabalhando', progresso: 0 };
    // 💰 ganhou dinheiro com a tarefa
    KM.explosaoDinheiro(valor);
    cfg.economia.caixa += valor; f.ganhos += valor;
    estado.caixa = cfg.economia.caixa; animarCaixa(); atualizarFuncionario(); salvar();
    KM.onFala('Partiu! Vou buscar as notícias 📰', 2200);
    $('#tarefaVazia').hidden = true; $('#tarefaAtiva').hidden = false;
    $('#tarefaLog').innerHTML = ''; $('#tarefaBarra').style.width = '0%';
    atualizarBotoes();

    const fim = await acompanhar(tarefa);
    estado.trabalhando = false; p.digitando = false; p.est = {};
    atualizarBotoes();
    if (fim.status === 'pronto') {
      estado.tv = { modo: 'pronto', progresso: 100 };
      setTimeout(() => { if (!estado.trabalhando && estado.tv.modo === 'pronto') estado.tv.modo = 'normal'; }, 30000);
      const antes = nivelDe(f.xp);
      f.xp += 1; f.tarefas += 1; salvar();
      const depois = nivelDe(f.xp);
      atualizarFuncionario();
      await carregarRelatorios(fim.relatorio);
      const rid = fim.relatorio && fim.relatorio.id;
      toast(`📑 ${f.nome} entregou o relatório: ${fim.relatorio.qtdPrincipais} principais + ${fim.relatorio.qtdDia} do dia.`, { botao: ['Ver relatório', () => abrirRelatorio(rid)], ms: 9000 });
      KM.onFala('Relatório entregue! Está na aba Relatórios ✅', 2600);
      if (depois.i > antes.i) {
        setTimeout(() => KM.onBanner('SUBIU DE NÍVEL: ' + depois.nome.toUpperCase() + '!', 'verde'), 300);
        toast(`🎖️ ${f.nome} subiu para ${depois.nome}!`);
      }
      if (cfg.opcoes.comemorar) { await KM.esperar(depois.i > antes.i ? 2200 : 900); KM.comemorar(depois.i >= 5 && depois.i > antes.i ? 'deus' : saiyanDoNivel(depois.i)); }
      else KM.confete(80);
    } else {
      estado.tv = { modo: 'normal', progresso: 0 };
      KM.onFala('Não consegui acessar os sites 😓', 3000);
      toast('A tarefa falhou: ' + (fim.erro || 'erro desconhecido'), { erro: true, ms: 8000 });
    }
  }

  function acompanhar(id) {
    let ultimaMoeda = performance.now();
    return BK.acompanhar(id, {
      progresso(p) { estado.tv.progresso = p; $('#tarefaBarra').style.width = p + '%'; },
      etapa(texto) {
        $('#tarefaLog').append(el('li', { class: /errado|não respondeu/.test(texto) ? 'erro' : '' }, texto));
        $('#tarefaLog').scrollTop = 1e6;
        KM.onFala(texto, 2400);
      },
      tique() {
        if (performance.now() - ultimaMoeda < 2200) return; // ganhando dinheiro enquanto trabalha
        ultimaMoeda = performance.now();
        const [x, y] = estado.personagem.cabecaTela || [126, 100];
        KM.emitir('moeda', 3, i => ({ x: x + (Math.random() * 10 - 5), y, vx: Math.random() * 60 - 30, vy: -90, g: 220, vida: 0.9 }));
        KM.tocar('moeda');
      },
    });
  }

  // ------------------------------------------------------------------ animações (menu)
  const SO_PARADO = new Set(['ss1', 'ss2', 'ss3', 'deus', 'branco', 'danca', 'pulos', 'teleporte', 'soneca']);
  async function animacao(nome) {
    ativo();
    $('#menuAnim').classList.remove('on');
    if (estado.trabalhando && SO_PARADO.has(nome)) return toast(`${func().nome} está trabalhando! Espere ele terminar 💼`);
    if (nome === 'dinheiro') return KM.explosaoDinheiro(Number(cfg.economia.valorTarefa) || 0);
    if (nome === 'confete') return KM.confete();
    if (KM.fx.ocupado && KM.fx.ocupado !== 'soneca') return toast('Calma! Uma animação de cada vez 😄');
    if (!(await esperarLivre())) return;
    irPara('escritorio');
    const mapa = {
      ss1: () => KM.superSayajin(1), ss2: () => KM.superSayajin(2), ss3: () => KM.superSayajin(3),
      deus: () => KM.superSayajin('deus'), branco: () => KM.superSayajin('branco'),
      chuva: () => KM.rodar('chuva', () => KM.chuvaDinheiro(4)), danca: KM.danca, cafe: KM.cafe, foco: KM.foco,
      soneca: () => KM.soneca(8), pulos: KM.pulos, teleporte: KM.teleporte,
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
    box.append(el('b', {}, `📰 Notícias de ${fmtDia(r.diaData)}`),
      el('span', {}, `${fmtData(r.criadoEm)} · por ${r.funcionario?.nome || '—'} · ${r.qtdPrincipais} principais + ${r.qtdDia} do dia`),
      el('div', { style: 'margin-top:10px' }, el('button', { class: 'bt peq escuro', onclick: () => abrirRelatorio(r.id) }, 'Abrir relatório →')));
  }

  function renderListaRel() {
    const box = $('#listaRel'); box.innerHTML = '';
    if (!estado.relatorios.length) { box.append(el('p', { class: 'vazio', style: 'padding:0 8px' }, 'As entregas do funcionário aparecem aqui.')); }
    for (const r of estado.relatorios) {
      box.append(el('button', { class: 'item-rel' + (estado.relAberto && estado.relAberto.id === r.id ? ' ativo' : ''), onclick: () => abrirRelatorio(r.id) },
        el('b', {}, `📰 Notícias de ${fmtDia(r.diaData)}`),
        el('span', {}, `${fmtData(r.criadoEm)} · ${r.funcionario?.nome || '—'}`), el('br'),
        el('span', {}, `⭐ ${r.qtdPrincipais} principais · 📅 ${r.qtdDia} do dia`)));
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
  const PELES = ['#FFDBAC', '#F5D0B5', '#E0AC82', '#C68642', '#8D5524', '#5C3A21'];
  const CABELOS = ['#1C1C1C', '#2B1B12', '#3B2416', '#6B4226', '#B5651D', '#E6C35C', '#9E9E9E', '#C0392B', '#28BE52', '#7B4FBF', '#3fb6ff'];
  const ROUPAS = ['#28BE52', '#111A19', '#ffffff', '#2B3A55', '#3f7fc1', '#c9453a', '#e2b33c', '#7B4FBF', '#ff8fb1', '#8a8f94'];
  const SAPATOS = ['#1A1A1A', '#5a3a22', '#ffffff', '#28BE52', '#c9453a'];
  const PAREDES = ['#EBDCCB', '#DDF3E3', '#F4F4F2', '#2B3433', '#FFE3CC', '#D6E6F5', '#E9D8F2', '#FFF3C4'];
  const RODAPES = ['#6B4A35', '#1E8A45', '#111A19', '#cfcfc9', '#8f3f22', '#ffffff'];
  const PISOS = ['#B98A62', '#8B5E3C', '#D8C3A5', '#E4EAE5', '#5a4636', '#9aa3a1', '#6c7a89'];
  const MOVEIS = ['#9C5B3A', '#6B4226', '#e8e2d6', '#F2F2EE', '#1f2524', '#2b2f33', '#28BE52', '#3f7fc1'];
  const TAPETES = ['#F5C27E', '#28BE52', '#c9453a', '#3f7fc1', '#e9e4d8', '#7B4FBF', '#111A19', '#ff8c5a'];

  const F = 'funcionarios.0.', A = F + 'aparencia.', E = 'escritorio.';
  const CAMPOS = {
    camposFunc: [
      { c: F + 'nome', t: 'texto', r: 'Nome' },
      { c: F + 'cargo', t: 'texto', r: 'Cargo' },
      { sec: 'Aparência' },
      { c: A + 'pele', t: 'cor', r: 'Pele', op: PELES },
      { c: A + 'cabelo', t: 'sel', r: 'Cabelo', op: { curto: 'Curto', longo: 'Longo', cacheado: 'Black power / cacheado', moicano: 'Moicano', rabo: 'Rabo de cavalo', coque: 'Coque', careca: 'Careca' } },
      { c: A + 'corCabelo', t: 'cor', r: 'Cor do cabelo', op: CABELOS },
      { sec: 'Roupa' },
      { c: A + 'estiloCamisa', t: 'sel', r: 'Estilo', op: { kwik: 'Polo KWIK', social: 'Camisa social + gravata', terno: 'Terno', moletom: 'Moletom' } },
      { c: A + 'corCamisa', t: 'cor', r: 'Cor da roupa', op: ROUPAS },
      { c: A + 'corGravata', t: 'cor', r: 'Gravata', op: ROUPAS },
      { c: A + 'calca', t: 'cor', r: 'Calça', op: ROUPAS },
      { c: A + 'sapato', t: 'cor', r: 'Sapato', op: SAPATOS },
      { sec: 'Acessórios' },
      { t: 'checks', itens: [[A + 'oculos', '👓 Óculos'], [A + 'fone', '🎧 Fone'], [A + 'bone', '🧢 Boné'], [A + 'barba', '🧔 Barba']] },
    ],
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
      { t: 'checks', itens: [['opcoes.comemorar', '⚡ Vira Super Sayajin ao entregar'], ['opcoes.soneca', '😴 Cochila se ficar parado (3 min)'], ['opcoes.som', '🔊 Sons']] },
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

  function montarCampos() {
    for (const [id, lista] of Object.entries(CAMPOS)) {
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
    if (KM.fx.ocupado === 'soneca') KM.acordar();
  }

  // ------------------------------------------------------------------ laço de desenho
  const tela = $('#tela'), ctx = tela.getContext('2d'), palco = $('#palco');
  let ultimo = performance.now(), proxPiscar = 2, previewT = 0;
  function quadro(agora) {
    const t = agora / 1000, dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    const p = estado.personagem;
    // piscar de olhos
    if (t > proxPiscar) { p.est.piscar = true; if (t > proxPiscar + 0.12) { p.est.piscar = false; proxPiscar = t + 2 + Math.random() * 3; } }
    KM.atualizarEfeitos(dt, t);
    KM.desenhar(ctx, cfg, estado, t);
    KM.desenharEfeitos(ctx, t);

    // tremor da tela
    const tr = KM.fx.tremor;
    tela.style.transform = tr > 0.05 ? `translate(${(Math.random() * 2 - 1) * tr * 2}px, ${(Math.random() * 2 - 1) * tr * 2}px)` : '';
    palco.classList.toggle('noite', KM.periodo(cfg) === 'noite');

    // crachá e balão acima da cabeça
    const r = tela.getBoundingClientRect(), pr = palco.getBoundingClientRect(), esc = r.width / KM.W;
    const [hx, hy] = p.cabecaTela || [126, 96];
    const cr = $('#cracha'), ba = $('#balao');
    cr.style.display = p.visivel === false ? 'none' : '';
    const cx = r.left - pr.left + hx * esc, cy = r.top - pr.top + (hy - 3) * esc;
    cr.style.left = cx + 'px'; cr.style.top = cy + 'px';
    ba.style.left = Math.max(110, Math.min(pr.width - 110, cx)) + 'px'; ba.style.top = (cy - cr.offsetHeight - 10) + 'px';

    // prévia animada na personalização
    if ($('#aba-personalizar').classList.contains('ativa') && t - previewT > 0.15) {
      previewT = t;
      const fase = Math.floor(t / 2) % 4;
      desenharAvatar($('#previewFunc'), { bracos: fase === 1 ? 'aceno' : 'baixo', aceno: Math.floor(t * 4) % 2, boca: fase >= 1 ? 'sorriso' : 'normal', piscar: (t % 3) < 0.15 });
    }
    // soneca automática
    if (cfg.opcoes.soneca && !estado.trabalhando && !KM.fx.ocupado && agora - ultimaAtividade > 180000 && p.modo === 'sentado') {
      ultimaAtividade = agora; KM.soneca(0);
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
      if (!confirm('Voltar o escritório, o funcionário e o caixa ao padrão? (Os relatórios continuam salvos.)')) return;
      cfg = clone(PADRAO); mudou(); preencherCampos(); animarCaixa();
    });
    tela.addEventListener('click', e => {
      ativo();
      const r = tela.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * KM.W, y = (e.clientY - r.top) / r.height * KM.H;
      if (KM.acertouPersonagem(estado, x, y)) {
        if (estado.selecionado) { selecionar(null); } else selecionar(func().id);
      }
    });
    tela.addEventListener('mousemove', e => {
      const r = tela.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * KM.W, y = (e.clientY - r.top) / r.height * KM.H;
      tela.style.cursor = KM.acertouPersonagem(estado, x, y) ? 'pointer' : 'default';
    });
    document.addEventListener('keydown', ativo);
    window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (['escritorio', 'relatorios', 'personalizar'].includes(h)) irPara(h); });
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
    estado.relatorios = (j && j.relatorios) || [];
    estado.caixa = cfg.economia.caixa; caixaMostrado = cfg.economia.caixa;
    $('#caixaValor').textContent = brl(caixaMostrado);
    $('#qtdRel').textContent = estado.relatorios.length;
    if (remoto && salvo === local && online) salvar(true); // este aparelho tinha mudanças mais novas
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
    if ('serviceWorker' in navigator && !KM.ehPC) navigator.serviceWorker.register('sw.js').catch(() => {});
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
    const hh = new Date().getHours(), sauda = hh < 12 ? 'Bom dia' : hh < 18 ? 'Boa tarde' : 'Boa noite';
    setTimeout(() => KM.onFala(`${sauda}! Eu sou ${func().nome}. Clique em mim ou em "Selecionar funcionário" 👋`, 4200), 700);
  }
  iniciar();
})();
