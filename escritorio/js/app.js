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
    versao: 4,
    escritorio: {
      nome: 'Mini Escritório', parede: '#EBDCCB', rodape: '#6B4A35', piso: 'madeira', corPiso: '#B98A62',
      tapete: true, corTapete: '#F5C27E', padraoTapete: 'losango', mesa: '#9C5B3A', cadeira: '#2A2F33', estante: '#2b2f33', ceu: 'auto',
      modeloParede: 'lisa', modeloMesa: 'classica', modeloCadeira: 'escritorio', modeloPlanta: 'costela', corVaso: '#b5532f',
      modeloSofa: 'reto', corSofa: '#3f7fc1', modeloEstante: 'livros', modeloQuadro: 'paisagem', corMoldura: '#1c1612',
      itens: { planta: true, estante: true, janela: true, relogio: true, tv: true, grafico: true, logo: true, quadros: true, cofre: true, lixeira: true },
    },
    funcionarios: [{
      id: 'f1', nome: 'Kauã Breno', cargo: 'CEO · Fundador da KWIK', funcao: 'noticias',
      aparencia: {
        pele: '#E8B48F', cabelo: 'curto', corCabelo: '#5A3825', estiloCamisa: 'casual', corCamisa: '#E9D5B7', corGravata: '#28BE52',
        calca: '#2F3A4A', sapato: '#5A3A22', oculos: false, fone: false, bone: false, barba: false, corBone: '#28BE52',
        cracha: true, corCordao: '#E8613C', chapeu: '', baixo: 'calca', calcado: 'sapato', altura: 'normal', cachecol: false, corCachecol: '#c9453a',
        olhos: 'normal', sobrancelha: 'normal', boca: 'normal', sardas: false, bochechas: false, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: false, corRelogio: '#212529', colar: false, corColar: '#e2b33c', brinco: false, corBrinco: '#e2b33c', corFone: '#28BE52', corOculos: '#1b1b1b',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }, {
      id: 'clara', nome: 'Clara', cargo: 'Assistente do CEO', funcao: 'checklist',
      aparencia: {
        pele: '#F1C9A5', cabelo: 'longo', corCabelo: '#3B2416', estiloCamisa: 'casual', corCamisa: '#F4B6C2', corGravata: '#28BE52',
        calca: '#3b4a6b', sapato: '#7a3b2a', oculos: false, fone: false, bone: false, barba: false, corBone: '#28BE52',
        cracha: true, corCordao: '#28BE52', chapeu: '', baixo: 'calca', calcado: 'sapato', altura: 'normal', cachecol: false, corCachecol: '#c9453a',
        olhos: 'normal', sobrancelha: 'normal', boca: 'normal', sardas: false, bochechas: false, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: false, corRelogio: '#212529', colar: false, corColar: '#e2b33c', brinco: false, corBrinco: '#e2b33c', corFone: '#28BE52', corOculos: '#1b1b1b',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }, {
      id: 'maycon', nome: 'Maycon', cargo: 'Chefe da Controladoria', funcao: 'prospeccao',
      aparencia: {
        pele: '#E0AC82', cabelo: 'curto', corCabelo: '#8a8a8a', estiloCamisa: 'social', corCamisa: '#cfe0f5', corGravata: '#1f3a68',
        calca: '#3a3f47', sapato: '#2b1d12', oculos: true, fone: false, bone: false, barba: true, corBone: '#28BE52',
        cracha: true, corCordao: '#3f7fc1', chapeu: '', baixo: 'calca', calcado: 'sapato', altura: 'normal', cachecol: false, corCachecol: '#c9453a',
        olhos: 'normal', sobrancelha: 'normal', boca: 'normal', sardas: false, bochechas: false, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: false, corRelogio: '#212529', colar: false, corColar: '#e2b33c', brinco: false, corBrinco: '#e2b33c', corFone: '#28BE52', corOculos: '#1b1b1b',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }, {
      id: 'enzo', nome: 'Enzo', cargo: 'Chefe do Marketing', funcao: 'video',
      aparencia: {
        pele: '#C68642', cabelo: 'topete', corCabelo: '#2B1B12', estiloCamisa: 'camiseta', corCamisa: '#111A19', corGravata: '#28BE52',
        calca: '#3b5b8a', sapato: '#ffffff', oculos: false, fone: false, bone: false, barba: false, corBone: '#28BE52',
        cracha: true, corCordao: '#28BE52', chapeu: 'bone', baixo: 'calca', calcado: 'tenis', altura: 'baixo', cachecol: false, corCachecol: '#c9453a',
        olhos: 'normal', sobrancelha: 'normal', boca: 'normal', sardas: false, bochechas: false, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: false, corRelogio: '#212529', colar: false, corColar: '#e2b33c', brinco: false, corBrinco: '#e2b33c', corFone: '#28BE52', corOculos: '#1b1b1b',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }, {
      id: 'lena', nome: 'Lena', cargo: 'Chefe do Comercial', funcao: 'contato',
      aparencia: {
        pele: '#F5D0B5', cabelo: 'longo', corCabelo: '#E6C35C', estiloCamisa: 'jaqueta', corCamisa: '#E64980', corGravata: '#28BE52',
        calca: '#2B3A55', sapato: '#ffffff', oculos: false, fone: false, bone: false, barba: false, corBone: '#E64980',
        cracha: true, corCordao: '#E64980', chapeu: '', baixo: 'calca', calcado: 'tenis', altura: 'normal', cachecol: false, corCachecol: '#c9453a',
        olhos: 'normal', sobrancelha: 'normal', boca: 'normal', sardas: false, bochechas: false, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: false, corRelogio: '#212529', colar: false, corColar: '#e2b33c', brinco: false, corBrinco: '#e2b33c', corFone: '#28BE52', corOculos: '#1b1b1b',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }, {
      id: 'bia', nome: 'João', cargo: 'Chefe do Relacionamento com o Cliente', funcao: 'relacionamento',
      aparencia: {
        pele: '#8D5524', cabelo: 'cacheado', corCabelo: '#1C1C1C', estiloCamisa: 'casual', corCamisa: '#28BE52', corGravata: '#28BE52',
        calca: '#111A19', sapato: '#111A19', oculos: 'redondo', fone: true, bone: false, barba: false, corBone: '#28BE52',
        cracha: true, corCordao: '#111A19', chapeu: '', baixo: 'calca', calcado: 'tenis', altura: 'normal', cachecol: false, corCachecol: '#c9453a',
        olhos: 'grandes', sobrancelha: 'normal', boca: 'sorriso', sardas: false, bochechas: false, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: true, corRelogio: '#28BE52', colar: false, corColar: '#e2b33c', brinco: false, corBrinco: '#e2b33c', corFone: '#28BE52', corOculos: '#8a5a2b',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }, {
      id: 'zeca', nome: 'Seu Zeca', cargo: 'Limpeza e manutenção', funcao: 'limpeza',
      aparencia: {
        pele: '#C68642', cabelo: 'curto', corCabelo: '#4a4a4a', estiloCamisa: 'kwik', corCamisa: '#3f7fc1', corGravata: '#28BE52',
        calca: '#2F3A4A', sapato: '#1A1A1A', oculos: false, fone: false, bone: true, barba: true, corBone: '#3f7fc1',
        cracha: true, corCordao: '#3f7fc1', chapeu: 'bone', baixo: 'calca', calcado: 'bota', altura: 'normal', cachecol: false, corCachecol: '#c9453a',
        olhos: 'normal', sobrancelha: 'normal', boca: 'sorriso', sardas: false, bochechas: false, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: false, corRelogio: '#212529', colar: false, corColar: '#e2b33c', brinco: false, corBrinco: '#e2b33c', corFone: '#28BE52', corOculos: '#1b1b1b',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }, {
      id: 'rodrigo', nome: 'Rodrigo', cargo: 'Financeiro · Investimentos', funcao: 'financas',
      aparencia: {
        pele: '#E0AC82', cabelo: 'curto', corCabelo: '#3b3b3b', estiloCamisa: 'social', corCamisa: '#1f3a68', corGravata: '#28BE52',
        calca: '#2b2f33', sapato: '#2b1d12', oculos: false, fone: false, bone: false, barba: true, corBone: '#28BE52',
        cracha: true, corCordao: '#28BE52', chapeu: '', baixo: 'calca', calcado: 'sapato', altura: 'normal', cachecol: false, corCachecol: '#c9453a',
        olhos: 'normal', sobrancelha: 'normal', boca: 'normal', sardas: false, bochechas: false, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: true, corRelogio: '#c9a65b', colar: false, corColar: '#e2b33c', brinco: false, corBrinco: '#e2b33c', corFone: '#28BE52', corOculos: '#1b1b1b',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }, {
      id: 'iva', nome: 'Dona Iva', cargo: 'Precificação', funcao: 'precificacao',
      aparencia: {
        pele: '#E8B48F', cabelo: 'coque', corCabelo: '#d6d6d6', estiloCamisa: 'casual', corCamisa: '#b197fc', corGravata: '#28BE52',
        calca: '#5f3dc4', sapato: '#5a3a22', oculos: 'redondo', fone: false, bone: false, barba: false, corBone: '#28BE52',
        cracha: true, corCordao: '#7048e8', chapeu: '', baixo: 'saia', calcado: 'sapato', altura: 'baixo', cachecol: false, corCachecol: '#c9453a',
        olhos: 'normal', sobrancelha: 'normal', boca: 'sorriso', sardas: false, bochechas: true, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: false, corRelogio: '#212529', colar: true, corColar: '#f1f3f5', brinco: true, corBrinco: '#e2b33c', corFone: '#28BE52', corOculos: '#8a5a2b',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }, {
      id: 'bruno', nome: 'Bruno', cargo: 'Fiscal · Impostos e guias', funcao: 'fiscal',
      aparencia: {
        pele: '#F1C9A5', cabelo: 'topete', corCabelo: '#3B2416', estiloCamisa: 'social', corCamisa: '#ffffff', corGravata: '#1971c2',
        calca: '#2b3a55', sapato: '#2b1d12', oculos: true, fone: false, bone: false, barba: false, corBone: '#28BE52',
        cracha: true, corCordao: '#1971c2', chapeu: '', baixo: 'calca', calcado: 'sapato', altura: 'normal', cachecol: false, corCachecol: '#c9453a',
        olhos: 'normal', sobrancelha: 'normal', boca: 'normal', sardas: false, bochechas: false, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: true, corRelogio: '#212529', colar: false, corColar: '#e2b33c', brinco: false, corBrinco: '#e2b33c', corFone: '#28BE52', corOculos: '#1b1b1b',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }, {
      id: 'carla', nome: 'Carla', cargo: 'Folha e Departamento Pessoal', funcao: 'folha',
      aparencia: {
        pele: '#C68642', cabelo: 'longo', corCabelo: '#1C1C1C', estiloCamisa: 'casual', corCamisa: '#ffa94d', corGravata: '#28BE52',
        calca: '#3b4a6b', sapato: '#7a3b2a', oculos: false, fone: true, bone: false, barba: false, corBone: '#28BE52',
        cracha: true, corCordao: '#e8590c', chapeu: '', baixo: 'calca', calcado: 'sapato', altura: 'normal', cachecol: false, corCachecol: '#c9453a',
        olhos: 'normal', sobrancelha: 'normal', boca: 'sorriso', sardas: false, bochechas: true, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: false, corRelogio: '#212529', colar: false, corColar: '#e2b33c', brinco: true, corBrinco: '#e2b33c', corFone: '#e8590c', corOculos: '#1b1b1b',
      },
      xp: 0, tarefas: 0, ganhos: 0,
    }],
    clientes: [],
    clientesInfo: {},
    execucao: [],
    financas: { ticker: [], ultimo: null, aporte: 500 },
    precificacao: { ultimo: null },
    meta: { clientes: 10 },
    reunioes: [],
    relacionamento: { enviados: {}, respostas: [] },
    checklist: [],
    maycon: { cidade: '', uf: '', fotos: 0 },
    marketing: { whats: '98988663080', dono: 'Kauã', empresa: 'KWIK Contabilidade', usadas: [], ultima: '', ultimoFundo: '' },
    contatos: { enviados: {} },
    jogos: { gatos: { fase: 1, estrelas: {} } },
    economia: { valorTarefa: 150, caixa: 0 },
    opcoes: { comemorar: true, todosJuntos: true, soneca: true, som: true, fotos: true, rotinas: true },
  };
  const TEMAS = {
    'KWIK Clássico': { parede: '#EBDCCB', rodape: '#6B4A35', piso: 'madeira', corPiso: '#B98A62', corTapete: '#F5C27E', padraoTapete: 'losango', mesa: '#9C5B3A', cadeira: '#2A2F33', estante: '#2b2f33' },
    'KWIK Verde': { parede: '#DDF3E3', rodape: '#1E8A45', piso: 'piso', corPiso: '#E4EAE5', corTapete: '#28BE52', padraoTapete: 'kwik', mesa: '#F2F2EE', cadeira: '#111A19', estante: '#111A19', modeloMesa: 'moderna', modeloCadeira: 'escritorio', corSofa: '#28BE52', modeloParede: 'lisa' },
    'Grafite Noturno': { parede: '#2B3433', rodape: '#111A19', piso: 'cimento', corPiso: '#7a7f87', corTapete: '#28BE52', padraoTapete: 'kwik', mesa: '#1f2524', cadeira: '#28BE52', estante: '#151a19', ceu: 'noite', modeloMesa: 'moderna', modeloCadeira: 'gamer', corSofa: '#111A19', modeloParede: 'tijolo' },
    'Minimalista': { parede: '#F4F4F2', rodape: '#cfcfc9', piso: 'taco', corPiso: '#D8C3A5', corTapete: '#e9e4d8', padraoTapete: 'redondo', mesa: '#e8e2d6', cadeira: '#3b3b3b', estante: '#e8e2d6', modeloMesa: 'vidro', modeloCadeira: 'madeira', corSofa: '#e9e4d8', modeloParede: 'lisa', modeloPlanta: 'cacto' },
    'Pôr do sol': { parede: '#FFE3CC', rodape: '#8f3f22', piso: 'madeira', corPiso: '#c98b5b', corTapete: '#ff8c5a', padraoTapete: 'losango', mesa: '#7a4a2e', cadeira: '#3f7fc1', estante: '#5a3524', ceu: 'tarde', modeloParede: 'madeira', corSofa: '#ff8c5a', modeloPlanta: 'palmeira' },
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
  const ROTULO_TRABALHO = { noticias: '📰 Buscar notícias', checklist: '📋 Abrir prancheta', prospeccao: '📞 Buscar clientes', video: '🎬 Criar conteúdo', contato: '💬 Preparar contatos', relacionamento: '💚 Falar com clientes', limpeza: '🧹 Faxina geral', financas: '📈 Analisar investimentos', precificacao: '🧮 Precificar serviços', fiscal: '🧾 Conferir impostos', folha: '👥 Conferir a folha' };
  // Primeiro nome de quem cuida de uma função (os textos do app usam o nome que você coloca em Visual).
  KM.nomeDe = funcao => { const f = cfg.funcionarios.find(x => x.funcao === funcao); return f ? (f.nome || '').trim().split(' ')[0] : ''; };

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
    noticias: 'Fala! Eu sou {n}, CEO da KWIK. Também trago as notícias do dia 📰',
    checklist: 'Oi! Eu sou {n}, assistente do CEO. Vamos organizar as tarefas? 📋',
    prospeccao: 'Opa! Eu sou {n}, chefe da Controladoria. E ainda acho clientes novos 📞',
    video: 'E aí! Eu sou {n}, chefe do Marketing. Faço os vídeos do Insta 🎬',
    contato: 'Oi! Eu sou {n}, chefe do Comercial. Falo com os futuros clientes 💬',
    relacionamento: 'Oi! Eu sou {n}, chefe do Relacionamento. Cuido dos nossos clientes 💚',
    limpeza: 'Opa! Eu sou {n}. Deixo tudo limpinho e funcionando 🧹',
    financas: 'Olá! Eu sou {n}, do Financeiro. Analiso a bolsa e a renda fixa 📈',
    precificacao: 'Oi, meu bem! Eu sou {n}, da Precificação. Cuido dos preços 🧮',
    fiscal: 'Oi! Eu sou {n}, do Fiscal. Cuido dos impostos e das guias dos clientes 🧾',
    folha: 'Oi! Eu sou {n}, da Folha. Cuido dos funcionários dos clientes 👥',
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

  // Quando alguém vai trabalhar (ou fecha um cliente), todo mundo que está livre larga o que está fazendo
  // (rotina, almoço, sinuca, cochilo…) e comemora junto.
  const livresMenos = exceto => Object.values(estado.pessoas).filter(q => q.id !== exceto && !q.trabalhando && q.visivel !== false);
  function todosComemoram(exceto, tipo = 'pulos') {
    livresMenos(exceto).forEach((q, i) => setTimeout(() => {
      if (q.trabalhando) return;
      if (tipo === 'saiyan') KM.superSayajin(Math.random() < 0.5 ? 1 : 2, { fala: ['Uhuul! 🎉', 'Isso aí! 💪', 'KWIK!! ⚡', 'Bora!! 🔥'][i % 4], dur: 2600 }, q.id);
      else { KM.pulos(q.id); setTimeout(() => falar(q.id, ['Bora, equipe! 💪', 'Uhuul! 🎉', 'Vai que é sua! 🚀', 'Partiu! 💚', 'É isso aí! 👏'][i % 5], 1800), 500); }
    }, i * 140));
  }
  // Dinheiro na hora de mandar a tarefa.
  function pagar(f, p) {
    const valor = Number(cfg.economia.valorTarefa) || 0;
    KM.explosaoDinheiro(valor, p.id);
    cfg.economia.caixa += valor; f.ganhos += valor;
    estado.caixa = cfg.economia.caixa; animarCaixa(); atualizarFuncionario(); salvar();
    if (cfg.opcoes.todosJuntos !== false) todosComemoram(p.id);
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
    if (cfg.opcoes.comemorar) {
      await KM.esperar(depois.i > antes.i ? 2200 : 900);
      if (cfg.opcoes.todosJuntos !== false) todosComemoram(p.id, 'saiyan');
      KM.comemorar(depois.i >= 5 && depois.i > antes.i ? 'deus' : saiyanDoNivel(depois.i), p.id);
    }
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
    if (f.funcao === 'video') return KM.marketing.trabalharVideo(f, p);
    if (f.funcao === 'contato') return KM.marketing.trabalharContato(f, p);
    if (f.funcao === 'relacionamento') return KM.relacionamento.trabalhar(f, p);
    if (f.funcao === 'limpeza') return KM.limpeza.trabalhar(f, p);
    if (f.funcao === 'financas') return KM.financas.trabalhar(f, p);
    if (f.funcao === 'precificacao') return KM.precificacao.trabalhar(f, p);
    if (f.funcao === 'fiscal' || f.funcao === 'folha') return KM.setores.trabalhar(f.funcao, f, p);
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
    $('#cardTarefa').hidden = false;
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
  // Animações do menu: TODO MUNDO que não está trabalhando para o que estava fazendo e faz junto.
  async function animacao(nome) {
    ativo();
    $('#menuAnim').classList.remove('on');
    const livres = Object.values(estado.pessoas).filter(q => !q.trabalhando && q.visivel !== false);
    if (nome === 'dinheiro') { (livres.length ? livres : [pessoaDe()]).forEach((q, i) => setTimeout(() => KM.explosaoDinheiro(i ? 0 : Number(cfg.economia.valorTarefa) || 0, q.id), i * 120)); return; }
    if (nome === 'confete') return KM.confete();
    irPara('escritorio');
    if (nome === 'almoco') return KM.refeitorio && KM.refeitorio.agora('ifood');
    if (KM.filmes && KM.filmes[nome]) { // cenas em grupo: só quem não está trabalhando
      if (livres.length < 2) return toast('Precisa de pelo menos 2 funcionários livres para essa cena 🎬');
      await Promise.all(livres.map(q => KM.pararRotina(q)));
      const ok = await KM.filmes[nome](livres.map(q => q.id));
      if (ok === false) toast('Alguém já está em outra animação. Tente de novo em instantes 😄');
      return;
    }
    if (!livres.length) return toast('A equipe toda está trabalhando agora 💼');
    const mapa = {
      ss1: id => KM.superSayajin(1, {}, id), ss2: id => KM.superSayajin(2, {}, id), ss3: id => KM.superSayajin(3, {}, id),
      deus: id => KM.superSayajin('deus', {}, id), branco: id => KM.superSayajin('branco', {}, id),
      danca: id => KM.danca(id), cafe: id => KM.cafe(id), foco: id => KM.foco(id),
      soneca: id => KM.soneca(8, id), pulos: id => KM.pulos(id), teleporte: id => KM.teleporte(id),
    };
    if (nome === 'chuva') { await Promise.all(livres.map(q => KM.pararRotina(q))); return KM.rodar('chuva', () => KM.chuvaDinheiro(4), livres.filter(q => !q.acao).map(q => q.id)); }
    if (!mapa[nome]) return;
    const resultados = await Promise.all(livres.map((q, i) => KM.esperar(i * 120).then(() => mapa[nome](q.id))));
    if (resultados.every(r => r === false)) toast('Calma! Uma animação de cada vez 😄');
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
    if (!box) return;
    box.innerHTML = '';
    if (!r) { box.className = 'vazio'; box.textContent = 'Nenhum relatório ainda.'; return; }
    box.className = 'ultimo';
    box.append(el('b', {}, tituloRel(r)),
      el('span', {}, `${fmtData(r.criadoEm)} · por ${r.funcionario?.nome || '—'} · ${resumoRel(r)}`),
      el('div', { style: 'margin-top:10px' }, el('button', { class: 'bt peq escuro', onclick: () => abrirRelatorio(r.id) }, 'Abrir relatório →')));
  }

  const tituloRel = r => r.tipo === 'prospeccao' ? `📞 Clientes em ${r.cidade || '—'}${r.uf ? '-' + r.uf : ''}`
    : r.tipo === 'video' ? `🎬 ${r.tarefa && /Reels/.test(r.tarefa) ? 'Reels' : r.tarefa && /Stories/.test(r.tarefa) ? 'Stories' : 'Vídeo'}: ${(r.titulo || '').slice(0, 56)}${(r.titulo || '').length > 56 ? '…' : ''}`
    : r.tipo === 'post' ? `🖼️ Post: ${(r.titulo || '').slice(0, 56)}`
    : r.tipo === 'relacionamento' ? `💚 ${r.titulo || 'Relacionamento'}`
    : r.tipo === 'financas' ? `📈 ${r.titulo || 'Investimentos'}${r.aporte ? ` · ${brlCurto(r.aporte)}/mês` : ''}`
    : r.tipo === 'precificacao' ? `🧮 ${r.titulo || 'Precificação'}`
    : r.tipo === 'fiscal' ? `🧾 ${r.titulo || 'Fiscal'}`
    : r.tipo === 'folha' ? `👥 ${r.titulo || 'Folha'}`
    : r.tipo === 'contatos' ? `💬 Contatos em ${r.cidade || '—'}${r.uf ? '-' + r.uf : ''}` : `📰 Notícias de ${fmtDia(r.diaData)}`;
  const resumoRel = r => r.tipo === 'prospeccao' ? `🏥 ${r.qtdClinicas || 0} clínicas · ☎️ ${r.qtdComTelefone || 0} com telefone`
    : r.tipo === 'video' ? '🎞️ Vídeo com música + legenda para o Instagram'
    : r.tipo === 'post' ? '🖼️ Arte 4:5 + legenda para o Instagram'
    : r.tipo === 'relacionamento' ? '💬 Pronto para enviar aos clientes'
    : r.tipo === 'financas' ? '🏆 Ranking do dia + simulação de quanto você vai ganhar'
    : r.tipo === 'precificacao' ? '💜 Preços sugeridos com base no mercado de São Luís'
    : r.tipo === 'fiscal' ? `🔴 ${r.qVencido || 0} vencida(s) · 🟡 ${(r.prox || []).length} vencem em 5 dias`
    : r.tipo === 'folha' ? `✅ ${r.fechadas || 0}/${(r.empresas || []).length} folhas fechadas · 👥 ${r.ativos || 0} pessoas`
    : r.tipo === 'contatos' ? `💬 ${r.qtdContatos || 0} mensagens de primeiro contato` : `⭐ ${r.qtdPrincipais} principais · 📅 ${r.qtdDia} do dia`;
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
  async function obterRelatorio(id) {
    let r = cacheRel.get(id);
    if (!r) { r = await BK.relatorio(id); cacheRel.set(id, r); }
    return r;
  }
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
    if (r.tipo === 'video') return KM.marketing.renderVideo(r, box);
    if (r.tipo === 'contatos') return KM.marketing.renderContatos(r, box);
    if (r.tipo === 'post') return KM.marketing.renderPost(r, box);
    if (r.tipo === 'relacionamento') return KM.relacionamento.renderRel(r, box);
    if (r.tipo === 'financas') return KM.financas.renderRel(r, box);
    if (r.tipo === 'precificacao') return KM.precificacao.renderRel(r, box);
    if (r.tipo === 'fiscal' || r.tipo === 'folha') return KM.setores.renderRel(r, box);
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
  // Toque num objeto (cabelo, roupa, mesa, piso…) e escolha o modelo e a cor dele.
  const PELES = ['#FFDBAC', '#F5D0B5', '#E8B48F', '#E0AC82', '#C68642', '#8D5524', '#5C3A21'];
  const CABELOS = ['#1C1C1C', '#3B2416', '#6B4226', '#B5651D', '#E6C35C', '#9E9E9E', '#C0392B', '#7B4FBF'];
  const ROUPAS = ['#ffffff', '#111A19', '#28BE52', '#1E8A45', '#2B3A55', '#3f7fc1', '#74c0fc', '#c9453a', '#ff8c5a', '#E64980', '#f783ac', '#7B4FBF', '#e2b33c', '#E9D5B7', '#8a8f94', '#6b4a2a'];
  const ACESSORIOS = ['#e2b33c', '#c0c0c0', '#111A19', '#ffffff', '#28BE52', '#E64980', '#3f7fc1', '#c9453a', '#8a5a2b'];
  const CALCAS = ['#2F3A4A', '#3b5b8a', '#111A19', '#6b4a2a', '#d8c3a5', '#ffffff', '#7a7f87', '#28BE52'];
  const SAPATOS = ['#1A1A1A', '#5A3A22', '#ffffff', '#28BE52', '#c9453a', '#3f7fc1'];
  const CORDOES = ['#E8613C', '#28BE52', '#111A19', '#3f7fc1', '#c9453a', '#E64980'];
  const PAREDES = ['#EBDCCB', '#DDF3E3', '#F4F4F2', '#2B3433', '#FFE3CC', '#D6E6F5', '#E9D8F2', '#FFF3C4'];
  const RODAPES = ['#6B4A35', '#1E8A45', '#111A19', '#cfcfc9', '#8f3f22', '#ffffff'];
  const PISOS = ['#B98A62', '#8B5E3C', '#D8C3A5', '#E4EAE5', '#5a4636', '#9aa3a1', '#c9ced4', '#6c7a89'];
  const MOVEIS = ['#9C5B3A', '#6B4226', '#e8e2d6', '#F2F2EE', '#1f2524', '#28BE52', '#3f7fc1', '#c9453a'];
  const TAPETES = ['#F5C27E', '#28BE52', '#c9453a', '#3f7fc1', '#e9e4d8', '#7B4FBF', '#111A19', '#ff8c5a'];
  const VASOS = ['#b5532f', '#f1f3f5', '#111A19', '#28BE52', '#e2b33c', '#3f7fc1'];
  const SOFAS = ['#3f7fc1', '#28BE52', '#c9453a', '#111A19', '#e9e4d8', '#7B4FBF', '#ff8c5a', '#6b4a2a'];
  const MOLDURAS = ['#1c1612', '#ffffff', '#c9a65b', '#28BE52', '#6b4a2a'];

  let persIdx = 0;
  const E = 'escritorio.';
  const apAtual = () => (cfg.funcionarios[persIdx] || cfg.funcionarios[0]).aparencia;
  const escAtual = () => cfg.escritorio;
  // campo simples da aparência / do escritório; "a" e "e" permitem aplicar numa cópia (para as prévias)
  const cA = c => ({ ler: (a = apAtual()) => a[c], por: (v, a = apAtual()) => { a[c] = v; } });
  const cE = c => ({ ler: (e = escAtual()) => e[c], por: (v, e = escAtual()) => { e[c] = v; } });
  const mA = (c, pad) => ({ ler: (a = apAtual()) => a[c] || pad, por: (v, a = apAtual()) => { a[c] = v; } });
  const mE = (c, pad) => ({ ler: (e = escAtual()) => e[c] || pad, por: (v, e = escAtual()) => { e[c] = v; } });
  const comItem = (it, c, pad) => ({ ler: (e = escAtual()) => (e.itens[it] === false ? '' : e[c] || pad), por: (v, e = escAtual()) => { e.itens[it] = !!v; if (v) e[c] = v; } });
  const liga = (r, ler, por) => ({ r, ler, por });
  const itemE = (r, it) => liga(r, () => escAtual().itens[it] !== false, v => { escAtual().itens[it] = v; });

  const OBJ_FUNC = [
    { id: 'rosto', ic: '🙂', nome: 'Rosto', modelos: [
      { nome: 'Olhos', op: { normal: 'Normal', grandes: 'Grandes', sonolentos: 'Sonolentos', felizes: 'Felizes', piscadinha: 'Piscadinha' }, ...mA('olhos', 'normal') },
      { nome: 'Sobrancelhas', op: { normal: 'Normal', grossa: 'Grossa', fina: 'Fina', brava: 'Brava', surpresa: 'Surpresa' }, ...mA('sobrancelha', 'normal') },
      { nome: 'Boca', op: { normal: 'Neutra', sorriso: 'Sorriso', serio: 'Séria', aberta: 'Aberta', lingua: 'Língua' }, ...mA('boca', 'normal') }],
      cores: [{ nome: 'Pele', op: PELES, ...cA('pele') }],
      liga: [liga('✨ Sardas', () => !!apAtual().sardas, v => { apAtual().sardas = v; }), liga('🌸 Bochechas rosadas', () => !!apAtual().bochechas, v => { apAtual().bochechas = v; }), liga('• Pinta', () => !!apAtual().pinta, v => { apAtual().pinta = v; })] },
    { id: 'cabelo', ic: '💇', nome: 'Cabelo', modelos: { op: { curto: 'Curto', longo: 'Longo', franja: 'Franja', cacheado: 'Cacheado', rabo: 'Rabo de cavalo', coque: 'Coque', tranca: 'Trança', topete: 'Topete', moicano: 'Moicano', careca: 'Careca' }, ...mA('cabelo', 'curto') },
      cores: [{ op: CABELOS, ...cA('corCabelo') }], liga: [liga('🧔 Barba', () => !!apAtual().barba, v => { apAtual().barba = v; })] },
    { id: 'roupa', ic: '👕', nome: 'Roupa', modelos: [{ nome: 'Modelo', op: { casual: 'Camisa casual', camiseta: 'Camiseta', kwik: 'Polo KWIK', social: 'Social e gravata', terno: 'Terno', moletom: 'Moletom', jaqueta: 'Jaqueta', regata: 'Regata', vestido: 'Vestido' }, ...mA('estiloCamisa', 'casual') },
      { nome: 'Estampa', op: { lisa: 'Lisa', listras: 'Listras', xadrez: 'Xadrez', bolinhas: 'Bolinhas', kwik: 'Logo KWIK' }, ...mA('estampa', 'lisa') }],
      cores: [{ op: ROUPAS, ...cA('corCamisa') }, { nome: 'Cor da estampa', op: ROUPAS, quando: () => (apAtual().estampa || 'lisa') !== 'lisa', ...cA('corEstampa') }, { nome: 'Gravata', op: ROUPAS, quando: () => ['social', 'terno'].includes(apAtual().estiloCamisa), ...cA('corGravata') }] },
    { id: 'baixo', ic: '👖', nome: 'Calça', modelos: { op: { calca: 'Calça', bermuda: 'Bermuda', saia: 'Saia' }, ...mA('baixo', 'calca') }, cores: [{ op: [...new Set([...CALCAS, ...ROUPAS])], ...cA('calca') }] },
    { id: 'pes', ic: '👟', nome: 'Calçado', modelos: { op: { sapato: 'Sapato', tenis: 'Tênis', bota: 'Bota' }, ...mA('calcado', 'sapato') }, cores: [{ op: [...new Set([...SAPATOS, ...ROUPAS])], ...cA('sapato') }] },
    { id: 'chapeu', ic: '🧢', nome: 'Chapéu', modelos: { op: { '': 'Nenhum', bone: 'Boné', gorro: 'Gorro', chapeu: 'Chapéu', tiara: 'Tiara' }, ler: (a = apAtual()) => a.chapeu ?? (a.bone ? 'bone' : ''), por: (v, a = apAtual()) => { a.chapeu = v; a.bone = false; } },
      cores: [{ op: ROUPAS, ...cA('corBone'), quando: () => !!(apAtual().chapeu ?? apAtual().bone) }] },
    { id: 'oculos', ic: '👓', nome: 'Óculos', modelos: { op: { '': 'Sem óculos', quadrado: 'Quadrado', redondo: 'Redondo', escuro: 'Escuro' }, ler: (a = apAtual()) => (a.oculos === true ? 'quadrado' : a.oculos || ''), por: (v, a = apAtual()) => { a.oculos = v || false; } },
      cores: [{ nome: 'Cor da armação', op: ACESSORIOS, quando: () => ['quadrado', 'redondo', true].includes(apAtual().oculos), ...cA('corOculos') }] },
    { id: 'acess', ic: '⌚', nome: 'Acessórios', liga: [liga('🎧 Fone', () => !!apAtual().fone, v => { apAtual().fone = v; }), liga('🪪 Crachá', () => apAtual().cracha !== false, v => { apAtual().cracha = v; }), liga('🧣 Cachecol', () => !!apAtual().cachecol, v => { apAtual().cachecol = v; }),
      liga('⌚ Relógio', () => !!apAtual().relogio, v => { apAtual().relogio = v; }), liga('📿 Colar', () => !!apAtual().colar, v => { apAtual().colar = v; }), liga('💎 Brinco', () => !!apAtual().brinco, v => { apAtual().brinco = v; })],
      cores: [{ nome: 'Fone', op: ACESSORIOS, quando: () => !!apAtual().fone, ...cA('corFone') }, { nome: 'Cordão do crachá', op: CORDOES, quando: () => apAtual().cracha !== false, ...cA('corCordao') },
        { nome: 'Cachecol', op: ROUPAS, quando: () => !!apAtual().cachecol, ...cA('corCachecol') }, { nome: 'Relógio', op: ACESSORIOS, quando: () => !!apAtual().relogio, ...cA('corRelogio') },
        { nome: 'Colar', op: ACESSORIOS, quando: () => !!apAtual().colar, ...cA('corColar') }, { nome: 'Brinco', op: ACESSORIOS, quando: () => !!apAtual().brinco, ...cA('corBrinco') }] },
    { id: 'altura', ic: '📏', nome: 'Altura', modelos: { op: { normal: 'Normal', baixo: 'Baixinho' }, ...mA('altura', 'normal') } },
  ];
  const OBJ_ESC = [
    { id: 'parede', ic: '🧱', nome: 'Parede', modelos: { op: { lisa: 'Lisa', listrada: 'Listrada', tijolo: 'Tijolinho', madeira: 'Madeira' }, ...mE('modeloParede', 'lisa') }, cores: [{ op: PAREDES, ...cE('parede') }, { nome: 'Rodapé', op: RODAPES, ...cE('rodape') }] },
    { id: 'piso', ic: '🟫', nome: 'Piso', modelos: { op: { madeira: 'Madeira', taco: 'Taco', piso: 'Porcelanato', carpete: 'Carpete', cimento: 'Cimento' }, ...mE('piso', 'madeira') }, cores: [{ op: PISOS, ...cE('corPiso') }] },
    { id: 'mesa', ic: '🗄️', nome: 'Mesa', modelos: { op: { classica: 'Com gaveteiro', moderna: 'Moderna', vidro: 'Vidro' }, ...mE('modeloMesa', 'classica') }, cores: [{ op: MOVEIS, ...cE('mesa') }] },
    { id: 'cadeira', ic: '🪑', nome: 'Cadeira', modelos: { op: { escritorio: 'Escritório', gamer: 'Gamer', madeira: 'Madeira' }, ...mE('modeloCadeira', 'escritorio') }, cores: [{ op: ROUPAS, ...cE('cadeira') }] },
    { id: 'tapete', ic: '🟩', nome: 'Tapete', modelos: { op: { '': 'Sem tapete', losango: 'Losango', kwik: 'Logo KWIK', listras: 'Listras', redondo: 'Redondo' }, ler: (e = escAtual()) => (e.tapete ? e.padraoTapete || 'losango' : ''), por: (v, e = escAtual()) => { e.tapete = !!v; if (v) e.padraoTapete = v; } },
      cores: [{ op: TAPETES, quando: () => !!escAtual().tapete, ...cE('corTapete') }] },
    { id: 'planta', ic: '🪴', nome: 'Plantas', modelos: { op: { '': 'Sem plantas', costela: 'Costela-de-adão', cacto: 'Cacto', palmeira: 'Palmeira', flores: 'Flores' }, ...comItem('planta', 'modeloPlanta', 'costela') }, cores: [{ nome: 'Vaso', op: VASOS, ...cE('corVaso') }] },
    { id: 'sofa', ic: '🛋️', nome: 'Sofá', modelos: { op: { reto: 'Reto', chester: 'Capitonê', futon: 'Com almofadas' }, ...mE('modeloSofa', 'reto') }, cores: [{ op: SOFAS, ...cE('corSofa') }] },
    { id: 'estante', ic: '📚', nome: 'Estante', modelos: { op: { '': 'Sem estante', livros: 'Livros', arquivo: 'Arquivo', nicho: 'Nichos' }, ...comItem('estante', 'modeloEstante', 'livros') }, cores: [{ op: MOVEIS, ...cE('estante') }] },
    { id: 'quadros', ic: '🖼️', nome: 'Quadros', modelos: { op: { '': 'Sem quadros', paisagem: 'Paisagem', abstrato: 'Abstrato', certificado: 'Certificado' }, ...comItem('quadros', 'modeloQuadro', 'paisagem') }, cores: [{ nome: 'Moldura', op: MOLDURAS, ...cE('corMoldura') }] },
    { id: 'ceu', ic: '🌤️', nome: 'Céu', modelos: { op: { auto: 'Pelo horário', dia: 'Dia', tarde: 'Pôr do sol', noite: 'Noite' }, ...mE('ceu', 'auto') } },
    { id: 'outros', ic: '✨', nome: 'Outros', liga: [itemE('🪟 Janelas', 'janela'), itemE('🕒 Relógios', 'relogio'), itemE('📺 Painel de status', 'tv'), itemE('📈 Gráfico', 'grafico'), itemE('🟩 Logo KWIK', 'logo'), itemE('💰 Cofre e moedas', 'cofre'), itemE('🗑️ Lixeiras', 'lixeira')] },
  ];
  const objAberto = { func: null, esc: null };

  const camposFunc = () => {
    const F = `funcionarios.${persIdx}.`;
    return [{ c: F + 'nome', t: 'texto', r: 'Nome' }, { c: F + 'cargo', t: 'texto', r: 'Cargo' }];
  };
  const CAMPOS = {
    camposEsc: [{ c: E + 'nome', t: 'texto', r: 'Nome do escritório' }],
    camposEco: [
      { c: 'economia.valorTarefa', t: 'num', r: 'R$ por tarefa' },
      { c: 'maycon.cidade', t: 'texto', r: 'Cidade da prospecção' },
      { c: 'maycon.uf', t: 'sel', r: 'Estado (UF)', op: Object.fromEntries(['', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(u => [u, u || '—'])) },
      { c: 'meta.clientes', t: 'num', r: '🎯 Meta de clientes', passo: 1 },
      { sec: 'Marketing e mensagens' },
      { c: 'marketing.whats', t: 'texto', r: 'WhatsApp Business' },
      { c: 'marketing.dono', t: 'texto', r: 'Seu nome nas mensagens' },
      { c: 'marketing.empresa', t: 'texto', r: 'Nome da empresa' },
    ],
    camposCom: [
      { t: 'checks', itens: [['opcoes.comemorar', '⚡ Vira Super Sayajin ao entregar'], ['opcoes.todosJuntos', '🙌 A equipe toda para e comemora junto'], ['opcoes.soneca', '😴 Cochila se ficar parado (3 min)'], ['opcoes.fotos', '📸 Prospecção tira fotos quando está livre'], ['opcoes.rotinas', '🚶 Equipe circula, almoça e conversa pelo prédio'], ['opcoes.som', '🔊 Sons']] },
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
    cfg.funcionarios.forEach((f, i) => box.append(el('button', { class: i === persIdx ? 'on' : '', onclick: () => { persIdx = i; montarCampos(); preencherCampos(); } }, f.nome.split(' ')[0])));
  }
  function montarObjetos(tipo) {
    const lista = tipo === 'func' ? OBJ_FUNC : OBJ_ESC, box = $(tipo === 'func' ? '#objFunc' : '#objEsc');
    box.innerHTML = '';
    for (const o of lista) {
      box.append(el('button', {
        class: 'obj' + (objAberto[tipo] === o.id ? ' on' : ''), type: 'button',
        onclick: () => { objAberto[tipo] = objAberto[tipo] === o.id ? null : o.id; montarObjetos(tipo); montarPainel(tipo); KM.tocar('clique'); },
      }, el('span', { class: 'ic' }, o.ic), el('span', {}, o.nome)));
    }
  }
  function previaModelo(tipo, o, v, grupo) {
    if (tipo === 'func') {
      const a2 = clone(apAtual()); grupo.por(v, a2);
      const cab = ['cabelo', 'chapeu', 'oculos', 'rosto'].includes(o.id);
      const cv = el('canvas', { width: 30, height: cab ? 26 : 46, class: cab ? 'pv-cab' : 'pv-corpo' });
      const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
      g.drawImage(KM.sprite(a2, { boca: 'sorriso' }), 0, 0);
      return cv;
    }
    const c2 = clone(cfg); grupo.por(v, c2.escritorio);
    const cv = el('canvas', { width: 48, height: 40, class: 'pv-obj' });
    KM.previewObjeto(cv, o.id, c2);
    return cv;
  }
  function montarPainel(tipo) {
    const lista = tipo === 'func' ? OBJ_FUNC : OBJ_ESC, box = $(tipo === 'func' ? '#painelFunc' : '#painelEsc');
    const o = lista.find(x => x.id === objAberto[tipo]);
    box.hidden = !o; box.innerHTML = '';
    if (!o) return;
    const refazer = () => { mudou(); montarPainel(tipo); };
    for (const grupo of [].concat(o.modelos || [])) {
      const atual = String(grupo.ler() ?? '');
      box.append(el('h5', {}, grupo.nome || 'Modelo'), el('div', { class: 'modelos' }, Object.entries(grupo.op).map(([v, rot]) =>
        el('button', { type: 'button', class: 'modelo' + (atual === v ? ' on' : ''), onclick: () => { grupo.por(v); KM.tocar('clique'); refazer(); } }, previaModelo(tipo, o, v, grupo), el('small', {}, rot)))));
    }
    for (const c of o.cores || []) {
      if (c.quando && !c.quando()) continue;
      const atual = String(c.ler() || '').toLowerCase();
      box.append(el('h5', {}, c.nome || 'Cor'), el('div', { class: 'cores' }, c.op.map(cor =>
        el('button', { type: 'button', title: cor, style: `background:${cor}`, class: atual === cor.toLowerCase() ? 'on' : '', onclick: () => { c.por(cor); refazer(); } }))));
    }
    if (o.liga) box.append(el('h5', {}, 'Ligar / desligar'), el('div', { class: 'checks' }, o.liga.map(l =>
      el('label', {}, el('input', { type: 'checkbox', checked: !!l.ler(), onchange: e => { l.por(e.target.checked); refazer(); } }), l.r))));
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
        else if (d.t === 'num') ctrl = el('input', { type: 'number', min: d.passo ? 1 : 0, step: d.passo || 10, 'data-c': d.c, oninput: e => { definir(d.c, Math.max(d.passo ? 1 : 0, Number(e.target.value) || 0)); mudou(); } });
        else if (d.t === 'sel') ctrl = el('select', { 'data-c': d.c, onchange: e => { definir(d.c, e.target.value); mudou(); } }, Object.entries(d.op).map(([v, r]) => el('option', { value: v }, r)));
        box.append(el('div', { class: 'campo' }, el('label', {}, d.r), ctrl));
      }
    }
    montarObjetos('func'); montarPainel('func'); montarObjetos('esc'); montarPainel('esc');
    const temas = $('#temas'); temas.innerHTML = '';
    for (const [nome, t] of Object.entries(TEMAS)) {
      temas.append(el('button', { onclick: () => { Object.assign(cfg.escritorio, t); if (!t.ceu) cfg.escritorio.ceu = 'auto'; mudou(); preencherCampos(); montarPainel('esc'); KM.tocar('clique'); toast('Tema aplicado: ' + nome); } },
        el('i', { style: `background:linear-gradient(135deg, ${t.parede} 50%, ${t.corPiso} 50%)` }), nome));
    }
  }
  function preencherCampos() {
    for (const c of $$('[data-c]')) {
      const v = obter(c.dataset.c);
      if (c.type === 'checkbox') c.checked = !!v;
      else if (c.tagName === 'INPUT' || c.tagName === 'SELECT') { if (document.activeElement !== c) c.value = v ?? ''; }
    }
    if (objAberto.func) montarPainel('func');
    if (objAberto.esc) montarPainel('esc');
  }

  // ------------------------------------------------------------------ aba Equipe
  function statusDe(q) {
    if (!q) return ['', 'Fora'];
    if (q.trabalhando) return ['trab', 'Trabalhando'];
    if (q.dormindo) return ['dorme', 'Cochilando'];
    if (q.lugarJogo) return ['joga', 'Na sala de jogos'];
    if (q.acao) return ['anda', 'Pelo prédio'];
    return ['livre', 'Na mesa'];
  }
  function renderEquipe() {
    const box = $('#equipeLista'); if (!box) return;
    box.innerHTML = '';
    for (const f of cfg.funcionarios) {
      const q = estado.pessoas[f.id], n = nivelDe(f.xp), [cls, st] = statusDe(q);
      const cv = el('canvas', { width: 30, height: 46 });
      box.append(el('div', { class: 'membro2' + (estado.selecionado === f.id ? ' sel' : '') },
        el('div', { class: 'm2-topo' }, cv, el('div', {},
          el('b', {}, f.nome), el('span', {}, f.cargo),
          el('div', { class: 'm2-tags' }, el('span', { class: 'nivel' }, `Nv. ${n.i + 1} · ${n.nome}`), el('span', { class: 'st ' + cls }, st)))),
        el('div', { class: 'xp' }, el('div', { style: `width:${n.pct}%` })),
        el('div', { class: 'm2-nums' }, el('span', {}, `✅ ${f.tarefas} tarefas`), el('span', {}, `💰 ${brlCurto(f.ganhos)}`)),
        el('div', { class: 'm2-bts' },
          el('button', { class: 'bt prim peq', onclick: () => { irPara('escritorio'); selecionar(f.id); trabalhar(); } }, ROTULO_TRABALHO[f.funcao] || '▶ Trabalhar'),
          el('button', { class: 'bt peq', onclick: () => { irPara('escritorio'); selecionar(f.id); window.scrollTo({ top: 0, behavior: 'smooth' }); } }, '📍 Ver'))));
      desenharAvatar(cv, { bracos: 'aceno', boca: 'sorriso' }, 0, f.id);
    }
  }

  // ------------------------------------------------------------------ clientes ativos (Relacionamento)
  function renderClientes() {
    const box = $('#clientesBox'); if (!box) return;
    cfg.clientes = cfg.clientes || [];
    box.innerHTML = '';
    const num = s => {
      let t = String(s ?? '').replace(/[^\d,.-]/g, ''); if (!t) return 0;
      if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
      else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
      return Math.max(0, Number(t) || 0);
    };
    const fmt = v => v ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    let n = 0;
    cfg.clientes.forEach((c, i) => {
      if ((c.status || 'ativo') !== 'ativo') return;
      n++;
      box.append(el('div', { class: 'cliente-linha' },
        el('input', { type: 'text', value: c.nome || '', placeholder: 'Nome do cliente', oninput: e => { c.nome = e.target.value; salvar(); } }),
        el('input', { type: 'tel', value: c.telefone || '', placeholder: 'WhatsApp (com DDD)', oninput: e => { c.telefone = e.target.value; salvar(); } }),
        el('div', { class: 'valor-cli' }, el('span', {}, 'R$'), el('input', { type: 'text', inputmode: 'decimal', value: fmt(c.valor), placeholder: 'mensal', title: 'Quanto o cliente paga por mês (entra na sala META)', oninput: e => { c.valor = num(e.target.value); salvar(); }, onblur: e => { e.target.value = fmt(c.valor); } })),
        el('button', { class: 'bt peq perigo', title: 'Remover', onclick: () => { cfg.clientes.splice(i, 1); salvar(); renderClientes(); } }, '🗑️')));
    });
    if (!n) box.append(el('p', { class: 'vazio' }, 'Nenhum cliente ainda. Adicione à mão ou puxe do KWIK Fiscal.'));
    const md = KM.metaDados ? KM.metaDados(cfg) : null;
    if (md) box.append(el('p', { class: 'vazio', style: 'margin:8px 0 0;font-size:12px' }, `💰 Total: ${brl(md.total)} por mês · 🎯 ${md.qAtivos} de ${md.meta} da meta` + (md.qNeg ? ` · 🟡 ${md.qNeg} em negociação (veja na sala META)` : '')));
  }
  async function puxarFiscal() {
    try {
      let lista;
      if (BK && BK.nome === 'local') {
        const r = await fetch('/api/clientes-fiscal', { cache: 'no-store' }); const j = await r.json();
        if (!r.ok) throw new Error(j.erro || r.status); lista = j.clientes;
      } else {
        const c = (() => { try { return JSON.parse(localStorage.getItem('kwik-despesas-github') || '{}'); } catch (e) { return {}; } })();
        const token = c.token || KM.backends.github.conf().token, repo = c.repo || 'kauabreno88-spec/Panilha-CLIENTES-DESPESAS-';
        if (!token) throw new Error('conecte o KWIK Fiscal neste aparelho primeiro');
        const r = await fetch(`https://api.github.com/repos/${repo}/contents/${c.caminho || 'dados/kwik-despesas.json'}`, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.raw+json' }, cache: 'no-store' });
        if (!r.ok) throw new Error('GitHub respondeu ' + r.status + (r.status === 404 ? ' (o token não tem acesso ao KWIK Fiscal)' : ''));
        const d = await r.json(), excl = d.excluidos || {};
        lista = (d.empresas || []).filter(e => !(e.id in excl)).map(e => ({ nome: e.razao || e.codigo || '', telefone: e.contato || '' })).filter(e => e.nome);
      }
      let novos = 0;
      for (const c of lista) {
        const ja = cfg.clientes.find(x => (x.nome || '').trim().toLowerCase() === c.nome.trim().toLowerCase());
        if (ja) { if (!ja.telefone && c.telefone) ja.telefone = c.telefone; } else { cfg.clientes.push({ nome: c.nome, telefone: c.telefone, valor: 0, status: 'ativo' }); novos++; }
      }
      salvar(); renderClientes();
      toast(`📥 ${lista.length} clientes no KWIK Fiscal · ${novos} novos adicionados`);
    } catch (e) { toast('Não consegui puxar do KWIK Fiscal: ' + e.message, { erro: true, ms: 8000 }); }
  }

  // ------------------------------------------------------------------ escolher uma opção / perguntar (diálogos)
  function escolher(titulo, opcoes) {
    return new Promise(res => {
      const d = $('#dlgEscolha'); $('#escolhaTitulo').textContent = titulo;
      const box = $('#escolhaOpcoes'); box.innerHTML = '';
      let valor = null;
      for (const o of opcoes) box.append(el('button', { class: 'opcao', type: 'button', onclick: () => { valor = o.v; d.close(); } }, el('span', { class: 'ic' }, o.ic), el('span', {}, el('b', {}, o.nome), el('small', {}, o.desc || ''))));
      d.onclose = () => res(valor);
      d.showModal();
    });
  }
  function perguntar(titulo, campos, botao = 'OK') {
    return new Promise(res => {
      const d = $('#dlgEscolha'); $('#escolhaTitulo').textContent = titulo;
      const box = $('#escolhaOpcoes'); box.innerHTML = '';
      const ins = {};
      for (const c of campos) {
        ins[c.id] = c.area ? el('textarea', { rows: 4, placeholder: c.placeholder || '' }) : el('input', { type: 'text', placeholder: c.placeholder || '' });
        box.append(el('label', { class: 'perg' }, el('b', {}, c.rotulo), ins[c.id]));
      }
      let valor = null;
      box.append(el('button', { class: 'bt prim', type: 'button', style: 'width:100%;justify-content:center;margin-top:6px', onclick: () => { valor = Object.fromEntries(Object.entries(ins).map(([k, i]) => [k, i.value])); d.close(); } }, botao));
      d.onclose = () => res(valor);
      d.showModal(); setTimeout(() => ins[campos[0].id].focus(), 50);
    });
  }

  // ------------------------------------------------------------------ abas
  function irPara(aba) {
    $$('.abas button').forEach(b => b.classList.toggle('ativa', b.dataset.aba === aba));
    $$('.aba').forEach(s => s.classList.toggle('ativa', s.id === 'aba-' + aba));
    if (location.hash !== '#' + aba) history.replaceState(null, '', '#' + aba);
    if (aba === 'personalizar' || aba === 'config') preencherCampos();
    if (aba === 'relatorios') renderListaRel();
    if (aba === 'equipe') renderEquipe();
    if (aba === 'config') renderClientes();
  }
  const ABAS = ['escritorio', 'equipe', 'relatorios', 'personalizar', 'config'];

  // ------------------------------------------------------------------ inatividade (soneca)
  let ultimaAtividade = performance.now();
  function ativo() {
    ultimaAtividade = performance.now();
    KM.acordar();
  }

  // ------------------------------------------------------------------ laço de desenho
  const tela = $('#tela'), ctx = tela.getContext('2d'), palco = $('#palco');
  const mqCelular = window.matchMedia('(max-width: 760px)');
  function aplicarLayout() {
    const nome = mqCelular.matches ? 'alto' : 'largo';
    const antes = KM.LAYOUT && KM.LAYOUT.nome;
    if (!KM.definirLayout(nome, cfg)) return;
    tela.width = KM.W; tela.height = KM.H;
    palco.style.aspectRatio = `${KM.W} / ${KM.H}`;
    palco.style.width = nome === 'largo' ? `min(100%, calc((100vh - 170px) * ${(KM.W / KM.H).toFixed(4)}))` : '100%';
    if (antes !== nome) { // trocou PC ↔ celular: todo mundo volta para a mesa (se só a Execução cresceu, ninguém se mexe)
      if (estado.luzJogos && KM.jogos) KM.jogos.apagar();
      for (const p of Object.values(estado.pessoas)) {
        const a = KM.LAYOUT.assentos[p.funcao]; if (!a) continue;
        if (p.acao === 'rotina' || p.acao === 'soneca') KM.pararRotina(p);
        Object.assign(p, { modo: 'sentado', X: a.X, Y: a.Y, dir: a.dir, Z: 0, foraDaMesa: false });
      }
    }
    if (KM.execucao) KM.execucao.layoutMudou();
    for (const r of $$('.rotulo-sala')) r.remove();
    const ICONE_SALA = { reuniao: ' 🗓️', meta: ' 🎯', refeitorio: ' 🍽️', execucao: ' ⚙️', financeiro: ' 📈', precificacao: ' 🧮', diretoria: ' 👑', fiscal: ' 🧾', folha: ' 👥' };
    const ABRIR_SALA = { reuniao: () => KM.reuniao.abrir(), meta: () => KM.meta.abrir(), execucao: () => KM.execucao.abrir(), fiscal: () => KM.setores.abrir('fiscal', 'ver'), folha: () => KM.setores.abrir('folha', 'ver') };
    for (const s of Object.values(KM.LAYOUT.salas)) {
      const clicavel = !!ABRIR_SALA[s.id];
      const r = el('div', { class: 'rotulo-sala' + (s.id === 'jogos' ? ' jogos' : '') + (clicavel ? ' clicavel' : '') + (s.id === 'diretoria' ? ' ceo' : ''), style: `left:${((s.x + s.w / 2) / KM.W * 100).toFixed(2)}%;top:${((s.y + 2) / KM.H * 100).toFixed(2)}%` }, s.nome + (ICONE_SALA[s.id] || ''));
      if (clicavel) r.addEventListener('click', e => { e.stopPropagation(); ABRIR_SALA[s.id](); });
      palco.append(r);
    }
    if (KM.clientesFora) KM.clientesFora.posicionarBotao();
  }
  mqCelular.addEventListener ? mqCelular.addEventListener('change', aplicarLayout) : mqCelular.addListener(aplicarLayout);
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
      d.balao.style.left = Math.max(80, Math.min(pr.width - 80, cx)) + 'px'; d.balao.style.top = (cy - (estado.selecionado === id ? d.cracha.offsetHeight + 10 : 4)) + 'px';
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
      for (const q of Object.values(estado.pessoas)) if (q.funcao !== 'prospeccao' && q.funcao !== 'limpeza' && !q.trabalhando && !q.acao && q.modo === 'sentado') KM.soneca(0, q.id);
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
      const sala = KM.salaEm(x, y);
      if (sala === 'reuniao' && KM.reuniao) return KM.reuniao.abrir();
      if (sala === 'meta' && KM.meta) return KM.meta.abrir();
      if (sala === 'execucao' && KM.execucao) return KM.execucao.abrir();
      if ((sala === 'fiscal' || sala === 'folha') && KM.setores) return KM.setores.abrir(sala, 'ver');
      if (estado.selecionado) selecionar(null); // tocar no vazio esconde o nome
    });
    tela.addEventListener('mousemove', e => {
      const [x, y] = pontoLogico(e);
      const sala = KM.salaEm(x, y);
      tela.style.cursor = KM.pessoaEm(estado, x, y) || KM.jogos.sobre(x, y) || ['reuniao', 'meta', 'execucao', 'fiscal', 'folha'].includes(sala) ? 'pointer' : 'default';
    });
    document.addEventListener('keydown', ativo);
    window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (ABAS.includes(h)) irPara(h); });
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
    // respostas da pesquisa chegam por vários caminhos (este aparelho, outro aparelho, Action): junta tudo
    if (remoto && local) {
      const rl = cfg.relacionamento, ro = (remoto.relacionamento || {}), lo = (local.relacionamento || {});
      const apagadas = new Set([...(ro.apagadas || []), ...(lo.apagadas || [])]);
      const m = new Map();
      for (const x of [...(rl.respostas || []), ...(ro.respostas || []), ...(lo.respostas || [])]) if (x && x.id && !apagadas.has(x.id) && !m.has(x.id)) m.set(x.id, x);
      rl.respostas = [...m.values()].sort((a, b) => String(b.quando).localeCompare(String(a.quando)));
      rl.apagadas = [...apagadas].slice(-300);
      if (ro.topico) rl.topico = ro.topico; else if (lo.topico) rl.topico = lo.topico;
    }
    let migrou = false;
    if (salvo && (salvo.versao || 1) < 2) { // versão 2: boneco novo em 3/4 — aplica o visual novo, mantém nome e progresso
      for (const f of cfg.funcionarios) f.aparencia = clone(PADRAO.funcionarios[0].aparencia);
      cfg.versao = 2; migrou = true;
    }
    if ((cfg.versao || 1) < 5 || cfg.funcionarios.length < PADRAO.funcionarios.length) { // versão 3: Clara e Maycon; versão 4: Enzo e Lena (Marketing)
      for (const pf of PADRAO.funcionarios) if (!cfg.funcionarios.some(f => f.id === pf.id)) { cfg.funcionarios.push(clone(pf)); migrou = true; }
      if ((cfg.versao || 1) < 5) migrou = true;
      cfg.versao = 5;
    }
    for (const f of cfg.funcionarios) if (!f.funcao) f.funcao = (PADRAO.funcionarios.find(x => x.id === f.id) || { funcao: 'noticias' }).funcao;
    if ((cfg.versao || 1) < 6) { // versão 6: família KWIK — Kauã CEO, chefes de setor, Rodrigo (Financeiro) e Dona Iva (Precificação)
      const CARGOS = { f1: 'CEO · Fundador da KWIK', clara: 'Assistente do CEO', maycon: 'Chefe da Controladoria', enzo: 'Chefe do Marketing', lena: 'Chefe do Comercial', bia: 'Chefe do Relacionamento com o Cliente' };
      for (const f of cfg.funcionarios) if (CARGOS[f.id]) f.cargo = CARGOS[f.id];
      cfg.versao = 6; migrou = true;
    }
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
    aplicarLayout();
    const j = await conectarBackend();
    aplicarDados(j);
    aplicarLayout(); // a Sala de Execução pode precisar de mais mesas com as atividades salvas
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
    if (ABAS.includes(h) && h !== 'escritorio') irPara(h);
    requestAnimationFrame(quadro);
    KM.clara.iniciar(); KM.maycon.iniciar(); KM.jogos.iniciar(); KM.rotinas.iniciar();
    KM.limpeza.iniciar(); KM.refeitorio.iniciar(); KM.reuniao.iniciar(); KM.pesquisa.iniciar(); KM.execucao.iniciar();
    KM.setores.iniciar(); KM.clientesFora.iniciar();
    $('#btFiscal').addEventListener('click', () => { ativo(); KM.setores.abrir('fiscal', 'ver'); });
    $('#btFolha').addEventListener('click', () => { ativo(); KM.setores.abrir('folha', 'ver'); });
    $('#atFiscal').addEventListener('click', () => KM.setores.abrir('fiscal', 'ver'));
    $('#atFolha').addEventListener('click', () => KM.setores.abrir('folha', 'ver'));
    $('#atClientes').addEventListener('click', () => { irPara('escritorio'); KM.clientesFora.sair(); });
    $('#btPuxarFiscal').addEventListener('click', puxarFiscal);
    $('#btNovoCliente').addEventListener('click', () => { cfg.clientes = cfg.clientes || []; cfg.clientes.push({ nome: '', telefone: '', valor: 0, status: 'ativo' }); renderClientes(); const ins = $$('#clientesBox .cliente-linha > input[type=text]'); ins.at(-1) && ins.at(-1).focus(); });
    $('#btAbrirMeta').addEventListener('click', () => KM.meta.abrir());
    $('#atMeta').addEventListener('click', () => KM.meta.abrir());
    $('#atAgenda').addEventListener('click', () => KM.reuniao.abrir());
    $('#atRespostas').addEventListener('click', () => KM.pesquisa.abrir());
    $('#atNotif').addEventListener('click', () => KM.clara.ativarNotificacoes());
    document.addEventListener('close', e => { if (e.target && e.target.id === 'dlgMeta' && $('#aba-config').classList.contains('ativa')) renderClientes(); }, true);
    $('#fecharTarefa').addEventListener('click', () => { $('#cardTarefa').hidden = true; });
    setInterval(() => { if ($('#aba-equipe').classList.contains('ativa')) renderEquipe(); }, 3000);
    const hh = new Date().getHours(), sauda = hh < 12 ? 'Bom dia' : hh < 18 ? 'Boa tarde' : 'Boa noite';
    const APRESENTA = { noticias: `${sauda}! Clique em um de nós para mandar trabalhar 👋`, checklist: 'Oi! Eu cuido da sua prancheta de tarefas 📋', prospeccao: 'E eu acho clientes novos! 📞📸',
      video: 'Eu transformo as notícias em vídeo! 🎬', contato: 'E eu chamo os clientes no WhatsApp 💬', relacionamento: 'E eu cuido de quem já é cliente 💚', limpeza: 'E eu deixo tudo brilhando! 🧹✨',
      financas: 'Eu fico de olho na bolsa 📈', precificacao: 'E eu cuido dos preços, meus netos 🧮💜', fiscal: 'E eu não deixo guia vencer! 🧾', folha: 'E eu fecho a folha de todo mundo 👥' };
    APRESENTA.noticias = `${sauda}, família KWIK! Bora trabalhar 👑`;
    cfg.funcionarios.forEach((f, i) => setTimeout(() => falar(f.id, APRESENTA[f.funcao] || 'Oi! 👋', 3400), 700 + i * 1500));
  }

  // API para os módulos (Clara, Maycon, jogos, filmes).
  KM.app = {
    el, toast, salvar, mudou, cfg: () => cfg, estado, func, pessoaDe, pagar, concluir, falar, irPara, brl, fmtData,
    BK: () => BK, online: () => online, abrirConexao, carregarRelatorios, abrirRelatorio, animarCaixa, atualizarBotoes, atualizarFuncionario,
    iniciarPainelTarefa, callbacksTarefa, esperarLivre, apagarRel: r => apagarRel(r), desenharAvatar, obterRelatorio, escolher, perguntar,
    todosComemoram, renderClientes, aplicarLayout: () => aplicarLayout(),
  };
  iniciar();
})();
