/* KWIK Mini Escritório · app "Fiscal e Folha" (junta os dois setores numa tela só, no estilo de painel financeiro).
   - Menu lateral: Painel · Guias do mês · Arquivo de guias · Clientes · Impostos · Checklists · Folha.
   - Painel: cartões brancos com os números grandes (vencido, a vencer, guias anexadas, folhas fechadas), gráficos de
     barras por mês e listas (próximos vencimentos, prazos da folha, quem ainda está sem guia).
   - Guias do mês: para cada cliente e competência, um espaço para anexar a guia de Impostos (DAS/DARF/ISS), INSS/DCTFWeb,
     FGTS e Outras. Dá para arrastar várias de uma vez: o app reconhece o cliente (CNPJ ou nome no arquivo) e o tipo.
   As guias vão para o repositório PRIVADO do escritório (nuvem/anexos/guias/…), como os outros anexos; sem GitHub,
   ficam só neste aparelho. Os dados de impostos e folha continuam vindo do KWIK Fiscal e do KWIK Folha. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const S = () => KM.setores;
  const el = (...a) => A().el(...a);
  const dd = n => String(n).padStart(2, '0');
  const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const brl0 = v => 'R$ ' + Math.round(Number(v) || 0).toLocaleString('pt-BR');
  const curto = v => { v = Number(v) || 0; return Math.abs(v) >= 1e6 ? 'R$ ' + (v / 1e6).toFixed(1).replace('.', ',') + 'mi' : Math.abs(v) >= 1e3 ? 'R$ ' + (v / 1e3).toFixed(v >= 1e4 ? 0 : 1).replace('.', ',') + 'mil' : 'R$ ' + Math.round(v); };
  const sem = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`; };
  const compAnterior = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${dd(d.getMonth() + 1)}`; };
  const somaMes = (c, n) => { const [a, m] = c.split('-').map(Number); const d = new Date(a, m - 1 + n, 1); return `${d.getFullYear()}-${dd(d.getMonth() + 1)}`; };
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const fmtComp = c => `${c.slice(5, 7)}/${c.slice(0, 4)}`;
  const nomeComp = c => `${MESES[+c.slice(5, 7) - 1]} de ${c.slice(0, 4)}`;
  const fmtD = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : '—';

  const TIPOS = [
    { k: 'imposto', ic: '🧾', nome: 'Impostos', desc: 'DAS, DARF, ISS, ICMS', re: /\b(das|darf|iss|issqn|icms|pis|cofins|irpj|csll|pgdas|simples|imposto|tribut|dae|difal)\b/ },
    { k: 'inss', ic: '🏛️', nome: 'INSS / DCTFWeb', desc: 'DARF da DCTFWeb, GPS', re: /\b(inss|dctf|dctfweb|gps|previd\w*|esocial|cp)\b/ },
    { k: 'fgts', ic: '🏦', nome: 'FGTS', desc: 'FGTS Digital (GFD)', re: /\b(fgts|gfd|grf)\b/ },
    { k: 'outra', ic: '📄', nome: 'Outras', desc: 'Parcelamentos, taxas, honorários', re: /$^/ },
  ];
  const T = k => TIPOS.find(t => t.k === k);

  // ------------------------------------------------------------------ dados
  function ctx() {
    const fis = S().dados('fiscal'), fol = S().dados('folha');
    let cls = [];
    try { cls = KM.clientesFora.lista().filter(c => c.ativo); } catch (e) { cls = []; }
    cls.sort((a, b) => a.nome.localeCompare(b.nome));
    const RF = fis ? S().resumoFiscal(fis.db) : null, RFo = fol ? S().resumoFolha(fol.db) : null;
    return { fis, fol, RF, RFo, cls };
  }
  const infoFis = (X, c) => X.RF && c.fiscalId ? X.RF.porEmp.find(r => r.e.id === c.fiscalId) : null;
  const infoFol = (X, c) => X.RFo && c.folhaId ? X.RFo.porEmp.find(r => r.e.id === c.folhaId) : null;
  function aplica(X, c, k) {
    if (k === 'imposto') return !!c.fiscalId || !c.folhaId;
    if (k === 'inss') return !!c.folhaId;
    if (k === 'fgts') { const f = infoFol(X, c); return !!(f && f.clt); }
    return false; // "Outras" é opcional
  }
  const guias = c => (KM.anexos ? KM.anexos.anexosDe('guias', c.chave) : []);
  const guiasDe = (c, comp, k) => guias(c).filter(a => a.comp === comp && (k ? a.guia === k : true));
  function situacaoMes(X, c, comp) {
    const tipos = TIPOS.filter(t => aplica(X, c, t.k));
    const feitos = tipos.filter(t => guiasDe(c, comp, t.k).length).length;
    return { tipos, feitos, total: tipos.length, ok: tipos.length > 0 && feitos === tipos.length };
  }
  const lancDe = (X, c, comp) => X.RF && c.fiscalId ? X.RF.ls.filter(l => l.empresaId === c.fiscalId && l.competencia === comp) : [];

  // ------------------------------------------------------------------ anexar / abrir
  function escolherArquivos(cb) {
    const inp = el('input', { type: 'file', multiple: true, accept: 'application/pdf,image/*,.pdf,.xml,.zip,.xlsx,.xls,.csv,.txt,.html', hidden: true });
    inp.addEventListener('change', () => { cb([...inp.files]); inp.remove(); });
    document.body.append(inp); inp.click();
  }
  async function anexar(c, comp, k, arqs, aviso) {
    if (!KM.anexos) return A().toast('Anexos indisponíveis', { erro: true });
    let ok = 0;
    for (const [i, f] of arqs.entries()) {
      if (aviso) aviso(`Enviando ${i + 1} de ${arqs.length}: ${f.name}…`);
      try {
        const a = await KM.anexos.enviar('guias', c.chave, f, 'Guia / DAS / DARF');
        Object.assign(a, { comp, guia: k, cliente: c.nome });
        ok++;
      } catch (e) { A().toast('❌ ' + e.message, { erro: true }); }
    }
    A().salvar(true);
    if (aviso) aviso('');
    if (ok) { A().toast(`📎 ${ok} guia${ok > 1 ? 's' : ''} de ${c.nomeCurto || c.nome} (${fmtComp(comp)}) guardada${ok > 1 ? 's' : ''}`); if (KM.tocar) KM.tocar('sucesso'); }
    return ok;
  }
  async function abrirAnexo(a) {
    try {
      const b = await KM.anexos.pegar(a), u = URL.createObjectURL(b);
      if (/pdf|image|text/.test(b.type)) window.open(u, '_blank');
      else { const x = el('a', { href: u, download: a.nome }); document.body.append(x); x.click(); x.remove(); }
      setTimeout(() => URL.revokeObjectURL(u), 60000);
    } catch (e) { A().toast('❌ ' + e.message, { erro: true }); }
  }
  async function apagar(c, a) {
    if (!confirm(`Apagar a guia "${a.nome}"?`)) return;
    await KM.anexos.tirar('guias', c.chave, a);
    renderConteudo();
  }
  // arrastar várias: descobre o cliente (CNPJ ou nome no arquivo), o tipo e a competência (ex.: 10-2026)
  function adivinhar(X, nome) {
    const n = sem(nome).replace(/[_\-.()]+/g, ' '), dig = nome.replace(/\D/g, '');
    let cli = X.cls.find(c => { const d = S().digitos(c.cnpj); return d.length === 14 && dig.includes(d); });
    if (!cli) {
      let mp = 0;
      for (const c of X.cls) {
        const ws = [...new Set(sem([c.nome, c.razao, c.fantasia].join(' ')).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/))].filter(w => w.length > 3 && !['ltda', 'eireli', 'servicos', 'comercio', 'empresa', 'clinica', 'distribuidora', 'industria'].includes(w));
        const p = ws.filter(w => new RegExp('\\b' + w + '\\b').test(n)).length;
        if (p > mp) { mp = p; cli = c; }
      }
    }
    const tipo = (TIPOS.slice(0, 3).find(t => t.re.test(n)) || {}).k || '';
    const m = nome.match(/(?:^|\D)(0[1-9]|1[0-2])[-_.\s/]?(20\d{2})(?:\D|$)/) || nome.match(/(?:^|\D)(20\d{2})[-_.\s/]?(0[1-9]|1[0-2])(?:\D|$)/);
    const comp = m ? (m[1].length === 4 ? `${m[1]}-${m[2]}` : `${m[2]}-${m[1]}`) : '';
    return { cli, tipo, comp };
  }

  // ------------------------------------------------------------------ desenhos (gráfico de barras e ilustrações)
  function barras(grupos, series, fmt = curto) {
    const W = 320, H = 178, L = 52, B = 22, topo = 10, ah = H - B - topo;
    const max = Math.max(1, ...grupos.flatMap(g => g.v));
    const passo = (W - L - 6) / grupos.length, bw = Math.min(16, (passo - 12) / series.length);
    let s = `<svg viewBox="0 0 ${W} ${H}" class="zf-graf" role="img">`;
    for (const f of [1, 0.5, 0]) { const y = topo + ah * (1 - f); s += `<line x1="${L}" x2="${W - 4}" y1="${y}" y2="${y}" stroke="#EEF1F0"/><text x="${L - 6}" y="${y + 4}" text-anchor="end">${fmt(max * f)}</text>`; }
    grupos.forEach((g, i) => {
      const x0 = L + i * passo + (passo - bw * series.length) / 2;
      g.v.forEach((v, k) => { const h = Math.max(v ? 2 : 0, ah * v / max); s += `<rect x="${x0 + k * bw}" y="${topo + ah - h}" width="${bw - 2}" height="${h}" rx="2" fill="${series[k].cor}"><title>${series[k].nome}: ${fmt(v)}</title></rect>`; });
      s += `<text x="${L + i * passo + passo / 2}" y="${H - 5}" text-anchor="middle">${g.rot}</text>`;
    });
    return s + '</svg>';
  }
  const legenda = series => el('div', { class: 'zf-leg' }, series.map(s => el('span', {}, el('i', { style: `background:${s.cor}` }), s.nome)));
  const ILU = {
    guia: '<svg viewBox="0 0 120 80" class="zf-ilu"><rect x="34" y="8" width="52" height="64" rx="5" fill="#EAF7EE" stroke="#28BE52" stroke-width="2"/><path d="M44 24h32M44 33h32M44 42h22" stroke="#28BE52" stroke-width="2.5" stroke-linecap="round"/><circle cx="80" cy="58" r="13" fill="#fff" stroke="#F0A35E" stroke-width="2"/><path d="M80 51v8l5 3" stroke="#F0A35E" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>',
    alerta: '<svg viewBox="0 0 120 80" class="zf-ilu"><rect x="26" y="14" width="68" height="46" rx="6" fill="#FFF1EC" stroke="#EE8E6E" stroke-width="2"/><path d="M26 26h68" stroke="#EE8E6E" stroke-width="2"/><circle cx="60" cy="44" r="9" fill="none" stroke="#EE8E6E" stroke-width="2.5"/><path d="M60 39v6M60 48v.5" stroke="#EE8E6E" stroke-width="2.5" stroke-linecap="round"/></svg>',
    pessoas: '<svg viewBox="0 0 120 80" class="zf-ilu"><circle cx="46" cy="30" r="10" fill="#EAF7EE" stroke="#28BE52" stroke-width="2"/><path d="M28 64c2-12 10-18 18-18s16 6 18 18" fill="#EAF7EE" stroke="#28BE52" stroke-width="2"/><circle cx="76" cy="34" r="8" fill="#FFF7E0" stroke="#F5C451" stroke-width="2"/><path d="M62 64c2-9 8-14 14-14s12 5 14 14" fill="#FFF7E0" stroke="#F5C451" stroke-width="2"/></svg>',
  };
  function anel(p) {
    const r = 30, c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 80 80" class="zf-anel"><circle cx="40" cy="40" r="${r}" fill="none" stroke="#EEF1F0" stroke-width="9"/>${p > 0 ? `<circle cx="40" cy="40" r="${r}" fill="none" stroke="#28BE52" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c * p} ${c}" transform="rotate(-90 40 40)"/>` : ''}<text x="40" y="45" text-anchor="middle">${Math.round(p * 100)}%</text></svg>`;
  }
  const chip = (txt, tipo) => el('span', { class: 'zf-chip ' + (tipo || '') }, txt);
  function cartao(titulo, ...filhos) { return el('section', { class: 'zf-card' }, el('h3', {}, titulo), ...filhos); }
  const conectar = k => el('div', { class: 'zf-con' }, el('p', {}, `Conecte o ${S().FONTES[k].nome} para ver estes números.`), el('button', { class: 'bt peq prim', onclick: () => S().pedirToken(k) }, '🔗 Conectar'));

  // ------------------------------------------------------------------ app
  const st = { view: 'painel', comp: compAnterior(), busca: '', cli: null, aba: 'guias', pend: [] };
  let corpo = null, caixa = null, lado = null;
  const MENU = [
    ['Visão geral', [['painel', '📊', 'Painel']]],
    ['Guias', [['guias', '📎', 'Guias do mês'], ['arquivo', '🗂️', 'Arquivo de guias']]],
    ['Clientes', [['clientes', '🏢', 'Clientes']]],
    ['Fiscal', [['impostos', '🧾', 'Impostos'], ['chkfiscal', '✅', 'Checklist fiscal']]],
    ['Folha', [['folha', '👥', 'Folha e pessoas'], ['chkfolha', '✅', 'Checklist da folha']]],
  ];
  async function abrir(c, acoes) {
    corpo = c; st.cli = null;
    acoes.append(el('button', { class: 'appv-bt', onclick: async () => { await Promise.all(['fiscal', 'folha'].map(k => S().carregar(k, true).catch(() => null))); A().toast('🔄 Atualizado'); render(); } }, '🔄 Atualizar'));
    corpo.classList.add('zf-corpo');
    corpo.append(el('p', { class: 'vazio' }, 'Carregando o Fiscal e a Folha…'));
    await Promise.all(['fiscal', 'folha'].map(k => S().carregar(k).catch(() => null)));
    render();
  }
  function sair() { S().soltar(); corpo = null; }
  function ir(v) { st.view = v; st.cli = null; S().soltar(); render(); if (corpo) corpo.scrollTop = 0; }
  function render() {
    if (!corpo || !corpo.isConnected) return;
    S().soltar();
    corpo.innerHTML = '';
    const X = ctx();
    lado = el('aside', { class: 'zf-lado' });
    const busca = el('input', { type: 'search', class: 'zf-busca', placeholder: '🔍  Buscar cliente, CNPJ, guia…', value: st.busca, autocomplete: 'off' });
    busca.addEventListener('input', () => { st.busca = busca.value; if (st.view === 'painel' || st.cli) { st.view = 'clientes'; st.cli = null; render(); const b = corpo.querySelector('.zf-busca'); if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); } } else renderConteudo(); });
    caixa = el('div', { class: 'zf-conteudo' });
    corpo.append(el('div', { class: 'zf' }, lado, el('main', { class: 'zf-main' }, el('div', { class: 'zf-topo' }, busca), caixa)));
    renderConteudo();
  }
  // menu lateral (refeito junto com o conteúdo, para os contadores ficarem certos)
  function pintarLado(X) {
    lado.innerHTML = '';
    lado.append(el('div', { class: 'zf-marca' }, el('b', {}, 'KWIK'), el('small', {}, 'Fiscal e Folha')));
    const nPend = X.cls.filter(c => { const s = situacaoMes(X, c, st.comp); return s.total && !s.ok; }).length;
    for (const [sec, itens] of MENU) {
      lado.append(el('small', { class: 'zf-sec' }, sec));
      for (const [k, ic, nome] of itens) {
        const badge = k === 'guias' && nPend ? nPend : k === 'impostos' && X.RF && X.RF.qVencido ? X.RF.qVencido : k === 'chkfolha' && X.RFo && X.RFo.pendentes.length ? X.RFo.pendentes.length : 0;
        lado.append(el('button', { class: 'zf-item' + (st.view === k || (k === 'clientes' && st.cli) ? ' on' : ''), onclick: () => ir(k) }, el('span', {}, ic), nome, badge ? el('em', { class: k === 'guias' ? 'am' : '' }, String(badge)) : null));
      }
    }
    lado.append(el('div', { class: 'zf-fontes' }, ['fiscal', 'folha'].map(k => { const d = S().dados(k); return el('button', { class: 'zf-fonte ' + (d ? 'ok' : ''), title: d ? `Dados do ${S().FONTES[k].nome}` : 'Conectar', onclick: () => (d ? null : S().pedirToken(k)) }, d ? '🟢 ' : '⚪ ', S().FONTES[k].nome, d ? '' : ' · conectar'); })));
  }
  function renderConteudo() {
    if (!caixa || !caixa.isConnected) return render();
    const y = corpo.scrollTop;
    caixa.innerHTML = '';
    const X = ctx();
    pintarLado(X);
    if (st.cli) { const c = X.cls.find(x => x.chave === st.cli); if (c) { detalhe(X, c); corpo.scrollTop = y; return; } st.cli = null; }
    ({ painel, guias: telaGuias, arquivo, clientes: telaClientes, impostos: () => setor('fiscal', 'ver'), chkfiscal: () => setor('fiscal', 'check'), folha: () => setor('folha', 'ver'), chkfolha: () => setor('folha', 'check') }[st.view] || painel)(X);
    corpo.scrollTop = y;
  }
  function setor(k, aba, emp, box = caixa) {
    if (!S().dados(k)) { box.append(conectar(k)); return; }
    box.append(S().barraOrigem(k));
    const b = el('div', { class: 'zf-setor' }); box.append(b);
    S().pintar(b, k, aba, emp || '', renderConteudo);
  }
  const filtrar = cls => { const q = sem(st.busca).trim(); return q ? cls.filter(c => sem([c.nome, c.razao, c.cnpj, S().digitos(c.cnpj), c.regime, ...guias(c).map(a => a.nome)].join(' ')).includes(q)) : cls; };

  // ------------------------------------------------------------------ painel
  function painel(X) {
    const cab = el('div', { class: 'zf-cab' }, el('div', {}, el('h2', {}, 'Painel'), el('small', {}, `Hoje, ${new Date().toLocaleDateString('pt-BR')} · competência ${fmtComp(st.comp)}`)));
    const g = el('div', { class: 'zf-grade' });
    caixa.append(cab, g);
    // 1 e 2: impostos
    if (X.RF) {
      const mes = hoje().slice(0, 7), mesAnt = somaMes(mes, -1);
      const pago = m => X.RF.ls.filter(l => l.status === 'Pago' && String(l.pagamento).slice(0, 7) === m).reduce((s, l) => s + l.total, 0);
      const pm = pago(mes), pa = pago(mesAnt), dif = pa ? Math.round((pm - pa) / pa * 100) : null;
      g.append(cartao('Impostos vencidos', el('b', { class: 'zf-num' + (X.RF.qVencido ? ' mal' : '') }, brl(X.RF.vencido)), el('small', { class: 'zf-sub' }, X.RF.qVencido ? `${X.RF.qVencido} guia${X.RF.qVencido > 1 ? 's' : ''} em atraso` : 'nenhuma guia em atraso'),
        el('div', { html: X.RF.qVencido ? ILU.alerta : ILU.guia }), chip(X.RF.qVencido ? `🔴 ${X.RF.porEmp.filter(r => r.qVencido).length} cliente${X.RF.porEmp.filter(r => r.qVencido).length > 1 ? 's' : ''} com atraso` : '🟢 Impostos em dia', X.RF.qVencido ? 'mal' : 'bem')));
      g.append(cartao('A vencer', el('b', { class: 'zf-num' }, brl(X.RF.aVencer)), el('small', { class: 'zf-sub' }, `${X.RF.prox5.length} vence${X.RF.prox5.length === 1 ? '' : 'm'} nos próximos 5 dias`),
        el('div', { html: ILU.guia }), chip(`Pago em ${MES[+mes.slice(5) - 1]}: ${brl0(pm)}${dif != null ? ` · ${dif >= 0 ? '▲' : '▼'} ${Math.abs(dif)}% vs ${MES[+mesAnt.slice(5) - 1]}` : ''}`, '')));
      // 3: guias por mês (pelo vencimento)
      const meses = [-3, -2, -1, 0].map(n => somaMes(mes, n));
      const SER = [{ nome: 'Pago', cor: '#28BE52' }, { nome: 'A vencer', cor: '#F5C451' }, { nome: 'Vencido', cor: '#EE8E6E' }];
      const grupos = meses.map(m => { const ls = X.RF.ls.filter(l => String(l.vencimento || '').slice(0, 7) === m); const s = f => ls.filter(f).reduce((a, l) => a + l.total, 0); return { rot: MES[+m.slice(5) - 1], v: [s(l => l.status === 'Pago'), s(l => l.status === 'A vencer'), s(l => l.status === 'Vencido')] }; });
      g.append(cartao('Guias por vencimento · Meses', el('div', { html: barras(grupos, SER) }), legenda(SER)));
    } else g.append(cartao('Impostos', conectar('fiscal')));
    // 4: guias anexadas
    const sits = X.cls.map(c => ({ c, s: situacaoMes(X, c, st.comp) })).filter(x => x.s.total);
    const ok = sits.filter(x => x.s.ok).length;
    g.append(cartao(`Guias anexadas · ${fmtComp(st.comp)}`, el('div', { class: 'zf-anelbox', html: anel(sits.length ? ok / sits.length : 0) }),
      el('b', { class: 'zf-num m' }, `${ok} de ${sits.length}`), el('small', { class: 'zf-sub' }, 'clientes com todas as guias do mês'),
      el('button', { class: 'bt peq prim', onclick: () => ir('guias') }, '📎 Anexar guias')));
    // 5 e 6: folha
    if (X.RFo) {
      g.append(cartao(`Folha · ${fmtComp(X.RFo.comp)}`, el('b', { class: 'zf-num' }, `${X.RFo.fechadas}/${X.RFo.porEmp.length}`), el('small', { class: 'zf-sub' }, 'folhas fechadas'),
        el('div', { html: ILU.pessoas }), chip(`👥 ${X.RFo.ativos} pessoas · ${brl0(X.RFo.folha)}/mês`, '')));
      const comps = [-3, -2, -1, 0].map(n => somaMes(X.RFo.comp, n));
      const SER = [{ nome: 'Fechadas', cor: '#28BE52' }, { nome: 'Pendentes', cor: '#9B7BEA' }];
      const grupos = comps.map(cp => { const r = S().resumoFolha(X.fol.db, cp); return { rot: MES[+cp.slice(5) - 1], v: [r.fechadas, r.porEmp.length - r.fechadas] }; });
      g.append(cartao('Fechamento da folha · Meses', el('div', { html: barras(grupos, SER, v => String(Math.round(v))) }), legenda(SER)));
    } else g.append(cartao('Folha', conectar('folha')));
    // 7: próximos vencimentos
    if (X.RF) {
      const prox = X.RF.ls.filter(l => l.status !== 'Pago' && l.vencimento).sort((a, b) => a.vencimento.localeCompare(b.vencimento)).slice(0, 7);
      g.append(cartao('Próximos vencimentos', prox.length ? el('div', { class: 'zf-lista' }, prox.map(l => el('div', { class: 'zf-li' + (l.status === 'Vencido' ? ' mal' : '') }, el('span', {}, el('b', {}, l.empresa), el('small', {}, `${l.tributo}${l.competencia ? ' · ' + fmtComp(l.competencia) : ''}`)), el('span', { class: 'zf-dir' }, el('b', {}, brl(l.total)), el('small', {}, `${l.status === 'Vencido' ? 'venceu' : 'vence'} ${fmtD(l.vencimento)}`))))) : el('p', { class: 'zf-sub' }, 'Nada em aberto 🎉')));
    }
    if (X.RFo) g.append(cartao('Prazos da folha', el('div', { class: 'zf-lista' }, X.RFo.prazos.map(p => el('div', { class: 'zf-li' + (p.dias < 0 ? ' mal' : p.dias <= 3 ? ' am' : '') }, el('span', {}, el('b', {}, p.t), el('small', {}, `competência ${fmtComp(X.RFo.comp)}`)), el('span', { class: 'zf-dir' }, el('b', {}, fmtD(p.d)), el('small', {}, p.dias < 0 ? `há ${-p.dias} dia${p.dias < -1 ? 's' : ''}` : p.dias === 0 ? 'hoje' : `em ${p.dias} dia${p.dias > 1 ? 's' : ''}`)))))));
    const faltam = sits.filter(x => !x.s.ok).slice(0, 7);
    g.append(cartao(`Faltam guias · ${fmtComp(st.comp)}`, faltam.length ? el('div', { class: 'zf-lista' }, faltam.map(({ c, s }) => el('button', { class: 'zf-li bt-li', onclick: () => { st.cli = c.chave; st.aba = 'guias'; render(); } }, el('span', {}, el('b', {}, c.nomeCurto || c.nome), el('small', {}, s.tipos.filter(t => !guiasDe(c, st.comp, t.k).length).map(t => t.nome).join(' · '))), el('span', { class: 'zf-dir' }, el('b', {}, `${s.feitos}/${s.total}`)))))
      : el('p', { class: 'zf-sub' }, sits.length ? 'Todas as guias do mês anexadas 🎉' : 'Sem clientes ainda.')));
  }

  // ------------------------------------------------------------------ guias do mês
  function seletorComp(onMudar) {
    return el('div', { class: 'zf-comp' }, el('button', { class: 'bt peq', title: 'Mês anterior', onclick: () => { st.comp = somaMes(st.comp, -1); onMudar(); } }, '‹'),
      el('b', {}, nomeComp(st.comp)), el('button', { class: 'bt peq', title: 'Próximo mês', onclick: () => { st.comp = somaMes(st.comp, 1); onMudar(); } }, '›'));
  }
  function celula(X, c, comp, t, re) {
    const lista = guiasDe(c, comp, t.k), ap = aplica(X, c, t.k);
    const cel = el('div', { class: 'zf-cel' + (lista.length ? ' tem' : ap ? ' falta' : ' na'), 'data-rot': `${t.ic} ${t.nome}` });
    for (const a of lista) cel.append(el('span', { class: 'zf-g' }, el('button', { class: 'zf-gnome', title: `Abrir ${a.nome}`, onclick: () => abrirAnexo(a) }, (/pdf/i.test(a.tipo + a.nome) ? '📕 ' : '📄 ') + a.nome),
      el('button', { class: 'zf-gx', title: 'Apagar', onclick: () => apagar(c, a) }, '×')));
    const status = el('small', { class: 'zf-cst' });
    cel.append(el('button', { class: 'zf-add', onclick: () => escolherArquivos(arqs => anexar(c, comp, t.k, arqs, s => { status.textContent = s; }).then(re)) }, lista.length ? '＋' : ap ? '📎 Anexar' : '＋'), status);
    if (t.k === 'imposto') for (const l of lancDe(X, c, comp).slice(0, 3)) cel.append(el('small', { class: 'zf-lanc ' + (l.status === 'Pago' ? 'bem' : l.status === 'Vencido' ? 'mal' : '') }, `${l.tributo} ${brl(l.total)} · ${l.status === 'Pago' ? '✅ pago' : (l.status === 'Vencido' ? '🔴 venceu ' : 'vence ') + fmtD(l.vencimento)}`));
    cel.addEventListener('dragover', e => { e.preventDefault(); cel.classList.add('alvo'); });
    cel.addEventListener('dragleave', () => cel.classList.remove('alvo'));
    cel.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); cel.classList.remove('alvo'); const fs = [...e.dataTransfer.files]; if (fs.length) anexar(c, comp, t.k, fs, s => { status.textContent = s; }).then(re); });
    return cel;
  }
  function telaGuias(X) {
    const cls = filtrar(X.cls);
    const sits = X.cls.map(c => situacaoMes(X, c, st.comp)).filter(s => s.total), ok = sits.filter(s => s.ok).length;
    caixa.append(el('div', { class: 'zf-cab' }, el('div', {}, el('h2', {}, '📎 Guias do mês'), el('small', {}, `Competência ${fmtComp(st.comp)} · as guias vencem em ${nomeComp(somaMes(st.comp, 1)).toLowerCase()}`)), seletorComp(renderConteudo)));
    caixa.append(el('div', { class: 'zf-prog' }, el('div', {}, el('i', { style: `width:${sits.length ? ok / sits.length * 100 : 0}%` })), el('small', {}, `${ok} de ${sits.length} clientes com todas as guias · ${X.cls.reduce((s, c) => s + guiasDe(c, st.comp).length, 0)} arquivos`)));
    // arrastar várias de uma vez
    const status = el('small', { class: 'cx-status' });
    const zona = el('label', { class: 'cx-zona zf-zona' }, el('span', { class: 'cx-zona-ic' }, '📥'), el('b', {}, 'Arraste aqui várias guias de uma vez (ou toque para escolher)'),
      el('small', {}, 'Eu separo por cliente e tipo pelo nome do arquivo: CNPJ ou nome do cliente + DAS, DARF, INSS, DCTFWeb, FGTS… (ex.: "12345678000190 DAS 10-2026.pdf"). O que eu não reconhecer, você escolhe.'), status);
    const inp = el('input', { type: 'file', multiple: true, hidden: true, accept: 'application/pdf,image/*,.pdf,.xml,.zip' }); zona.append(inp);
    const receber = fs => { for (const f of fs) { const g = adivinhar(X, f.name); st.pend.push({ f, cli: g.cli ? g.cli.chave : '', tipo: g.tipo, comp: g.comp || st.comp }); } guardarReconhecidas(status); };
    inp.addEventListener('change', () => receber([...inp.files]));
    zona.addEventListener('dragover', e => { e.preventDefault(); zona.classList.add('alvo'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('alvo'));
    zona.addEventListener('drop', e => { e.preventDefault(); zona.classList.remove('alvo'); receber([...e.dataTransfer.files]); });
    caixa.append(zona);
    if (st.pend.length) caixa.append(pendentes(X));
    // grade cliente × tipo
    const tab = el('div', { class: 'zf-tab' });
    tab.append(el('div', { class: 'zf-tr zf-th' }, el('div', {}, 'Cliente'), TIPOS.map(t => el('div', { title: t.desc }, `${t.ic} ${t.nome}`))));
    for (const c of cls) {
      const s = situacaoMes(X, c, st.comp);
      tab.append(el('div', { class: 'zf-tr' + (s.ok ? ' ok' : '') }, el('div', { class: 'zf-tcli' }, el('button', { class: 'zf-clin', onclick: () => { st.cli = c.chave; st.aba = 'guias'; render(); } }, el('b', {}, c.nomeCurto || c.nome)),
        el('small', {}, s.total ? (s.ok ? '✅ completo' : `${s.feitos}/${s.total} guias`) : 'sem guias obrigatórias'), c.cnpj ? el('small', {}, c.cnpj) : null),
        TIPOS.map(t => celula(X, c, st.comp, t, renderConteudo))));
    }
    if (!cls.length) tab.append(el('p', { class: 'vazio' }, X.cls.length ? 'Nenhum cliente com esse nome.' : 'Nenhum cliente ainda: conecte o KWIK Fiscal / KWIK Folha ou cadastre em Config.'));
    caixa.append(tab);
  }
  async function guardarReconhecidas(status) {
    const X = ctx();
    const prontas = st.pend.filter(p => p.cli && p.tipo);
    for (const [i, p] of prontas.entries()) {
      const c = X.cls.find(x => x.chave === p.cli); if (!c) continue;
      status.textContent = `Guardando ${i + 1} de ${prontas.length}: ${p.f.name} → ${c.nomeCurto || c.nome}…`;
      await anexar(c, p.comp, p.tipo, [p.f]);
      st.pend.splice(st.pend.indexOf(p), 1);
    }
    status.textContent = '';
    if (st.pend.length) A().toast(`🤔 ${st.pend.length} arquivo${st.pend.length > 1 ? 's' : ''} sem cliente ou tipo: escolha logo abaixo.`, { ms: 6000 });
    renderConteudo();
  }
  function pendentes(X) {
    const box = el('div', { class: 'zf-pend' }, el('h4', {}, `🤔 Não reconheci ${st.pend.length === 1 ? 'este arquivo' : 'estes arquivos'}: diga de quem é`));
    for (const p of st.pend) {
      const sc = el('select', {}, el('option', { value: '' }, '— cliente —'), X.cls.map(c => el('option', { value: c.chave, selected: c.chave === p.cli }, c.nome)));
      const stp = el('select', {}, el('option', { value: '' }, '— tipo —'), TIPOS.map(t => el('option', { value: t.k, selected: t.k === p.tipo }, `${t.ic} ${t.nome}`)));
      const comps = Array.from({ length: 14 }, (_, i) => somaMes(compAnterior(), 1 - i));
      const scp = el('select', {}, comps.map(cp => el('option', { value: cp, selected: cp === p.comp }, fmtComp(cp))));
      box.append(el('div', { class: 'zf-pl' }, el('b', {}, '📄 ' + p.f.name), sc, stp, scp,
        el('button', { class: 'bt peq prim', onclick: async e => { if (!sc.value || !stp.value) return A().toast('Escolha o cliente e o tipo'); e.currentTarget.disabled = true; const c = X.cls.find(x => x.chave === sc.value); await anexar(c, scp.value, stp.value, [p.f]); st.pend.splice(st.pend.indexOf(p), 1); renderConteudo(); } }, 'Guardar'),
        el('button', { class: 'bt peq', onclick: () => { st.pend.splice(st.pend.indexOf(p), 1); renderConteudo(); } }, 'Descartar')));
    }
    return box;
  }

  // ------------------------------------------------------------------ arquivo (todas as competências)
  function arquivo(X) {
    caixa.append(el('div', { class: 'zf-cab' }, el('div', {}, el('h2', {}, '🗂️ Arquivo de guias'), el('small', {}, 'Todas as guias anexadas, por competência'))));
    const cls = filtrar(X.cls), porComp = {};
    for (const c of cls) for (const a of guias(c)) if (a.comp) (porComp[a.comp] = porComp[a.comp] || []).push({ c, a });
    const comps = Object.keys(porComp).sort().reverse();
    if (!comps.length) { caixa.append(el('p', { class: 'vazio' }, 'Nenhuma guia anexada ainda. Comece em "📎 Guias do mês".')); return; }
    for (const cp of comps) {
      const itens = porComp[cp].sort((a, b) => a.c.nome.localeCompare(b.c.nome));
      caixa.append(el('details', { class: 'zf-arq', open: cp === st.comp || comps.length === 1 }, el('summary', {}, el('b', {}, nomeComp(cp)), el('small', {}, `${itens.length} guia${itens.length > 1 ? 's' : ''} de ${new Set(itens.map(x => x.c.chave)).size} cliente${new Set(itens.map(x => x.c.chave)).size > 1 ? 's' : ''}`)),
        el('div', { class: 'zf-lista' }, itens.map(({ c, a }) => el('div', { class: 'zf-li' }, el('span', {}, el('b', {}, c.nomeCurto || c.nome), el('small', {}, `${(T(a.guia) || T('outra')).ic} ${(T(a.guia) || T('outra')).nome} · ${a.nome}`)),
          el('span', { class: 'zf-dir' }, el('button', { class: 'bt peq', onclick: () => abrirAnexo(a) }, 'Abrir')))))));
    }
  }

  // ------------------------------------------------------------------ clientes
  function telaClientes(X) {
    const cls = filtrar(X.cls);
    caixa.append(el('div', { class: 'zf-cab' }, el('div', {}, el('h2', {}, `🏢 ${X.cls.length} cliente${X.cls.length === 1 ? '' : 's'}`), el('small', {}, 'Fiscal e folha juntos, por cliente'))));
    const g = el('div', { class: 'cx-grade' }); caixa.append(g);
    for (const c of cls) {
      const fi = infoFis(X, c), fo = infoFol(X, c), s = situacaoMes(X, c, st.comp);
      const linhas = [];
      if (fi) linhas.push(fi.qVencido ? ['🔴', `${fi.qVencido} guia${fi.qVencido > 1 ? 's' : ''} vencida${fi.qVencido > 1 ? 's' : ''} · ${brl(fi.vencido)}`, 'mal'] : ['🟢', `Impostos em dia${fi.aVencer ? ` · ${brl(fi.aVencer)} a vencer` : ''}`, 'bem']);
      if (fo) linhas.push([fo.feitas === fo.total ? '✅' : '🟡', `${fo.ativos} pessoa${fo.ativos === 1 ? '' : 's'} · folha ${fo.feitas}/${fo.total}`, fo.feitas === fo.total ? 'bem' : '']);
      if (!fi && !fo) linhas.push(['📋', c.soCadastro ? 'Só no cadastro (Config)' : 'Sem dados do Fiscal/Folha', '']);
      g.append(el('button', { class: 'cx-card', onclick: () => { st.cli = c.chave; st.aba = 'guias'; render(); } },
        el('div', { class: 'cx-card-cab' }, el('span', { class: 'cx-av' }, c.nome.slice(0, 1).toUpperCase()), el('div', {}, el('b', {}, c.nome), el('small', {}, [c.regime, c.cnpj].filter(Boolean).join(' · ')))),
        el('ul', {}, linhas.map(([ic, t, cl]) => el('li', { class: cl }, ic + ' ' + t))),
        s.total ? el('div', { class: 'cx-prog' }, el('div', {}, el('i', { style: `width:${s.feitos / s.total * 100}%` })), el('small', {}, `Guias de ${fmtComp(st.comp)}: ${s.feitos}/${s.total}`)) : null,
        el('span', { class: 'cx-anx' }, `📎 ${guias(c).length}`)));
    }
    if (!cls.length) g.append(el('p', { class: 'vazio' }, 'Nenhum cliente encontrado.'));
  }
  function detalhe(X, c) {
    const fi = infoFis(X, c), fo = infoFol(X, c);
    caixa.append(el('div', { class: 'cx-det-cab' }, el('button', { class: 'bt peq', onclick: () => { st.cli = null; st.view = st.view === 'painel' ? 'clientes' : st.view; render(); } }, '‹ Voltar'),
      el('span', { class: 'cx-av g' }, c.nome.slice(0, 1).toUpperCase()), el('div', {}, el('h2', {}, c.nome), el('small', {}, [c.razao !== c.nome ? c.razao : null, c.cnpj, c.regime, c.responsavel].filter(Boolean).join(' · ')))));
    const ult12 = Array.from({ length: 12 }, (_, i) => somaMes(compAnterior(), -i));
    const comp12 = ult12.filter(cp => situacaoMes(X, c, cp).ok).length;
    const tiles = [[fi ? brl(fi.vencido) : '—', fi ? `vencido (${fi.qVencido})` : 'fiscal', fi && fi.qVencido ? 'mal' : 'bem'], [fi ? brl(fi.aVencer) : '—', 'a vencer', ''],
      [fo ? `${fo.ativos} · ${brl0(fo.folha)}` : '—', 'pessoas · folha/mês', ''], [`${comp12}/12`, 'meses com guias completas', comp12 >= 10 ? 'bem' : '']];
    caixa.append(el('div', { class: 'cx-tiles' }, tiles.map(([v, t, cl]) => el('div', { class: cl }, el('b', {}, v), el('small', {}, t)))));
    const ABAS = [['guias', '📎 Guias por mês'], fi && ['impostos', '🧾 Impostos'], c.fiscalId && ['lancar', '＋ Lançar guia'], c.fiscalId && ['chkfiscal', '✅ Checklist fiscal'],
      fo && ['folha', '👥 Funcionários'], c.folhaId && ['func', '＋ Funcionário'], c.folhaId && ['chkfolha', '✅ Checklist folha'], ['anexos', '📎 Outros anexos'], ['ficha', '🏢 Ficha']].filter(Boolean);
    if (!ABAS.some(a => a[0] === st.aba)) st.aba = 'guias';
    caixa.append(el('div', { class: 'cx-abas' }, ABAS.map(([k, n]) => el('button', { class: st.aba === k ? 'on' : '', onclick: () => { st.aba = k; renderConteudo(); } }, n))));
    const box = el('div', { class: 'cx-corpo' }); caixa.append(box);
    if (st.aba === 'guias') {
      box.append(el('p', { class: 'zf-sub' }, 'Toque em 📎 para anexar a guia do mês (ou arraste o arquivo em cima do quadrinho). Competência = mês de referência; a guia vence no mês seguinte.'));
      const tab = el('div', { class: 'zf-tab' });
      tab.append(el('div', { class: 'zf-tr zf-th' }, el('div', {}, 'Competência'), TIPOS.map(t => el('div', { title: t.desc }, `${t.ic} ${t.nome}`))));
      for (const cp of [somaMes(compAnterior(), 1), ...ult12]) {
        const s = situacaoMes(X, c, cp);
        tab.append(el('div', { class: 'zf-tr' + (s.ok ? ' ok' : '') + (cp === st.comp ? ' atual' : '') }, el('div', { class: 'zf-tcli' }, el('b', {}, nomeComp(cp)), el('small', {}, s.total ? (s.ok ? '✅ completo' : `${s.feitos}/${s.total} guias`) : '')),
          TIPOS.map(t => celula(X, c, cp, t, renderConteudo))));
      }
      box.append(tab);
    } else if (st.aba === 'impostos') setor('fiscal', 'ver', c.fiscalId, box);
    else if (st.aba === 'lancar') setor('fiscal', 'add', c.fiscalId, box);
    else if (st.aba === 'chkfiscal') setor('fiscal', 'check', c.fiscalId, box);
    else if (st.aba === 'folha') setor('folha', 'ver', c.folhaId, box);
    else if (st.aba === 'func') setor('folha', 'add', c.folhaId, box);
    else if (st.aba === 'chkfolha') setor('folha', 'check', c.folhaId, box);
    else if (st.aba === 'anexos') {
      if (KM.anexos && KM.anexos.tela) { const k = c.fiscalId ? 'fiscal' : c.folhaId ? 'folha' : 'cliente'; KM.anexos.tela(box, k, c.fiscalId || c.folhaId || c.chave, renderConteudo); }
    } else if (st.aba === 'ficha') {
      if (KM.clientesFora && KM.clientesFora.renderInfo) { try { KM.clientesFora.montarDlg(); KM.clientesFora.montarCena(true); } catch (er) { /* ok */ } KM.clientesFora.renderInfo(c, true, box); }
      else box.append(el('p', { class: 'vazio' }, 'Ficha indisponível para este cliente.'));
    }
  }

  function resumo() {
    const X = ctx(); if (!X.RF && !X.RFo && !X.cls.length) return { txt: 'Toque para conectar' };
    const sits = X.cls.map(c => situacaoMes(X, c, compAnterior())).filter(s => s.total), ok = sits.filter(s => s.ok).length;
    const partes = [X.RF ? (X.RF.qVencido ? `🔴 ${X.RF.qVencido} guias vencidas` : '🟢 Impostos em dia') : null, `📎 guias ${ok}/${sits.length}`, X.RFo ? `folhas ${X.RFo.fechadas}/${X.RFo.porEmp.length}` : null].filter(Boolean);
    return { txt: partes.join(' · '), alerta: !!(X.RF && X.RF.qVencido), ticker: `🧾 ${X.cls.length} clientes no Fiscal e Folha` };
  }

  KM.inicio.registrar('fiscalfolha', { nome: 'Fiscal e Folha', ic: '🧾', abrir, sair, resumo });
  KM.fiscalFolha = { abrir: () => KM.inicio.abrirApp('fiscalfolha'), adivinhar, TIPOS };
})();
