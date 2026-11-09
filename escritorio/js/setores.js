/* KWIK Mini Escritório · setores Fiscal (Bruno) e Folha (Carla).
   Os dados vêm dos repositórios privados dos apps KWIK Fiscal (Panilha-CLIENTES-DESPESAS-, dados/kwik-despesas.json)
   e KWIK Folha (KWIK-FOLHA-, dados/kwik-folha.json), pela API do GitHub, com o token que já fica guardado
   neste aparelho pelos próprios apps (mesmo endereço) ou colado aqui uma vez.
   Gravar segue o mesmo formato dos apps: cada registro alterado ganha "alteradoEm" e o arquivo ganha
   "atualizadoEm"; assim o KWIK Fiscal e o KWIK Folha juntam as mudanças na próxima sincronização.
   Nada de CPF ou salário vai para os relatórios do escritório. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  const U = () => KM.marketing._u;

  const FONTES = {
    fiscal: { nome: 'KWIK Fiscal', ic: '🧾', chave: 'kwik-despesas-github', copia: 'kwik-despesas-db', repo: 'kauabreno88-spec/Panilha-CLIENTES-DESPESAS-', caminho: 'dados/kwik-despesas.json',
      colecoes: ['empresas', 'tributos', 'lancamentos'], api: '/api/dados/fiscal', app: 'https://kauabreno88-spec.github.io/controle-fiscal-kwik/' },
    folha: { nome: 'KWIK Folha', ic: '👥', chave: 'kwik-folha-github', copia: 'kwik-folha-db', repo: 'kauabreno88-spec/KWIK-FOLHA-', caminho: 'dados/kwik-folha.json',
      colecoes: ['empresas', 'pessoas', 'holerites', 'fechamentos'], api: '/api/dados/folha', app: 'https://kauabreno88-spec.github.io/controle-fiscal-kwik/folha/' },
  };
  const ETAPAS = [
    { k: 'variaveis', t: 'Variáveis do mês recebidas', clt: true }, { k: 'calculo', t: 'Folha calculada e conferida' },
    { k: 'contracheques', t: 'Contracheques enviados' }, { k: 'esocial', t: 'eSocial fechado (S-1299)' }, { k: 'dctfweb', t: 'DCTFWeb transmitida' },
    { k: 'darf', t: 'DARF do INSS enviada' }, { k: 'fgts', t: 'Guia do FGTS Digital enviada', clt: true },
  ];

  // ------------------------------------------------------------------ utilidades
  const dd = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
  const hoje = () => iso(new Date());
  const addDias = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
  const diasEntre = (a, b) => Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00')) / 86400000);
  const fmtD = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '—';
  const fmtComp = s => s ? `${s.slice(5, 7)}/${s.slice(0, 4)}` : '—';
  const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const r2 = n => Math.round((+n || 0) * 100) / 100;
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
  const clone = o => JSON.parse(JSON.stringify(o));
  const digitos = s => String(s || '').replace(/\D/g, '');
  const compAnterior = () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return `${d.getFullYear()}-${dd(d.getMonth() + 1)}`; };
  const proxComp = c => { const [a, m] = c.split('-').map(Number); return m === 12 ? `${a + 1}-01` : `${a}-${dd(m + 1)}`; };
  const antecipar = s => { let d = s; for (let i = 0; i < 4; i++) { const w = new Date(d + 'T12:00:00').getDay(); if (w !== 0 && w !== 6) break; d = addDias(d, -1); } return d; }; // fim de semana → sexta (feriados: confira no app da Folha)
  const num = s => {
    let t = String(s ?? '').replace(/[^\d,.-]/g, ''); if (!t) return 0;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    return Math.max(0, Number(t) || 0);
  };
  const lerLS = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  function b64(texto) {
    const bytes = new TextEncoder().encode(texto); let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  const de64 = s => new TextDecoder().decode(Uint8Array.from(atob(String(s).replace(/\s/g, '')), c => c.charCodeAt(0)));
  const estavel = v => Array.isArray(v) ? '[' + v.map(estavel).join(',') + ']'
    : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + estavel(v[k])).join(',') + '}' : JSON.stringify(v ?? null);
  const semCarimbo = r => { const { alteradoEm, ...x } = r; return estavel(x); };

  // ------------------------------------------------------------------ conexão com os repositórios
  function conf(k) {
    const F = FONTES[k], c = lerLS(F.chave) || {};
    let token = c.token;
    if (!token) { const o = lerLS(k === 'fiscal' ? FONTES.folha.chave : FONTES.fiscal.chave); if (o && o.token) token = o.token; } // o mesmo token costuma servir para os dois
    if (!token && KM.backends) token = KM.backends.github.conf().token;
    return { repo: c.repo || F.repo, caminho: c.caminho || F.caminho, branch: c.branch || 'main', token: token || '' };
  }
  const cache = {};
  async function gh(k, metodo, corpo) {
    const c = conf(k);
    const url = `https://api.github.com/repos/${c.repo}/contents/${c.caminho}` + (metodo === 'GET' ? `?ref=${encodeURIComponent(c.branch)}&t=${Date.now()}` : '');
    const r = await fetch(url, { method: metodo, cache: 'no-store', headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }, body: corpo ? JSON.stringify(corpo) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = new Error(r.status === 401 ? 'token inválido ou vencido' : r.status === 404 ? `o token não tem acesso ao repositório ${c.repo}` : r.status === 403 ? 'o token não tem permissão (precisa de Contents: Read and write)' : (j.message || 'erro ' + r.status));
      e.status = r.status; throw e;
    }
    return j;
  }
  async function lerRemoto(k) {
    const j = await gh(k, 'GET');
    let texto = j.content && j.encoding === 'base64' ? de64(j.content) : null;
    if (texto == null) { // arquivo grande: pede o conteúdo cru
      const c = conf(k);
      const r = await fetch(`https://api.github.com/repos/${c.repo}/contents/${c.caminho}?ref=${encodeURIComponent(c.branch)}`, { headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github.raw+json' }, cache: 'no-store' });
      texto = await r.text();
    }
    return { db: JSON.parse(texto), sha: j.sha };
  }
  const valido = (k, d) => d && FONTES[k].colecoes.every(c => Array.isArray(d[c]));
  // Lê os dados: GitHub (com token) → servidor do PC (cópia local do repositório) → cópia do app no navegador.
  async function carregar(k, forcar) {
    const c = cache[k];
    if (c && !forcar && Date.now() - c.quando < 90000) return c;
    if (c && c.carregando) return c.carregando;
    const p = (async () => {
      let res = null, erro = null;
      if (conf(k).token) { try { const { db, sha } = await lerRemoto(k); res = { db, sha, origem: 'github' }; } catch (e) { erro = e; } }
      if (!res && KM.ehPC) { try { const r = await fetch(FONTES[k].api, { cache: 'no-store' }); if (r.ok) { const db = await r.json(); if (valido(k, db)) res = { db, origem: 'pc' }; } } catch (e) { /* servidor antigo */ } }
      if (!res) { const db = lerLS(FONTES[k].copia); if (valido(k, db)) res = { db, origem: 'aparelho' }; }
      if (!res) { const e = erro || new Error('sem conexão'); e.semDados = true; throw e; }
      res.quando = Date.now(); res.erro = erro ? erro.message : '';
      cache[k] = res;
      return res;
    })();
    cache[k] = Object.assign(cache[k] || {}, { carregando: p });
    try { return await p; } finally { if (cache[k]) delete cache[k].carregando; }
  }
  const dados = k => cache[k] && cache[k].db ? cache[k] : null;

  // Grava uma mudança (lê de novo, aplica, carimba e envia). Tenta de novo se outro aparelho gravou junto.
  async function gravar(k, msg, mudar) {
    if (!conf(k).token) { pedirToken(k); throw new Error('conecte o ' + FONTES[k].nome + ' primeiro'); }
    for (let n = 0; ; n++) {
      const { db, sha } = await lerRemoto(k);
      const antes = clone(db), t = new Date().toISOString();
      mudar(db);
      db.excluidos = db.excluidos || {};
      for (const col of FONTES[k].colecoes) {
        const velho = new Map((antes[col] || []).map(r => [r.id, semCarimbo(r)]));
        const ids = new Set();
        for (const r of db[col]) { ids.add(r.id); if (velho.get(r.id) !== semCarimbo(r)) r.alteradoEm = t; delete db.excluidos[r.id]; }
        for (const id of velho.keys()) if (!ids.has(id)) db.excluidos[id] = t;
      }
      db.atualizadoEm = t;
      try {
        await gh(k, 'PUT', { message: `${msg} (Mini Escritório)`, content: b64(JSON.stringify(db, null, 1)), sha, branch: conf(k).branch });
        cache[k] = { db, origem: 'github', quando: Date.now(), erro: '' };
        return db;
      } catch (e) {
        if (n >= 3 || ![409, 422].includes(e.status)) throw e;
        await KM.esperar(600 * (n + 1));
      }
    }
  }

  function pedirToken(k) {
    const F = FONTES[k], c = lerLS(F.chave) || {};
    const { el } = A();
    const d = $('#dlgSetor');
    const corpo = $('#setorCorpo'); corpo.innerHTML = '';
    const inp = el('input', { type: 'password', placeholder: 'github_pat_…', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    const st = el('p', { class: 'vazio', style: 'min-height:18px' });
    corpo.append(
      el('div', { class: 'passos', html: `<b>Conectar o ${F.nome} neste aparelho (uma vez só)</b><ol>
        <li>Use o mesmo token do app ${F.nome} (ou o do Mini Escritório), desde que ele tenha acesso ao repositório <b>${F.repo.split('/')[1]}</b> com <b>Contents: Read and write</b>.</li>
        <li>Para conferir ou incluir o repositório no token: <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noopener">Fine-grained tokens</a>.</li></ol>
        <small>O token fica guardado só neste aparelho, no mesmo lugar que o app ${F.nome} usa.</small>` }),
      el('div', { class: 'campo', style: 'margin-top:12px' }, el('label', {}, 'Token'), inp), st,
      el('button', { class: 'bt prim', onclick: async () => {
        const tok = inp.value.trim(); if (!tok) return;
        localStorage.setItem(F.chave, JSON.stringify({ ...c, repo: c.repo || F.repo, caminho: c.caminho || F.caminho, branch: c.branch || 'main', token: tok }));
        st.textContent = 'Testando…';
        try { await carregar(k, true); if (dados(k).origem !== 'github') throw new Error(dados(k).erro || 'falhou'); st.textContent = '✅ Conectado!'; setTimeout(() => abrir(k), 500); }
        catch (e) { st.textContent = '❌ ' + e.message; }
      } }, '🔗 Conectar'));
    $('#setorTitulo').textContent = `${F.ic} Conectar o ${F.nome}`;
    if (!d.open) d.showModal();
  }

  // ------------------------------------------------------------------ cálculos (iguais aos dos apps)
  const empAtiva = (db, e) => !(db.excluidos && db.excluidos[e.id] && db.excluidos[e.id] >= (e.alteradoEm || ''));
  const nomeEmp = e => e ? (e.fantasia || String(e.razao || e.codigo || '').replace(/\s*(–|-)?\s*ltda\.?$/i, '')) : '(empresa removida)';
  function calcLanc(db, l) {
    const e = db.empresas.find(x => x.id === l.empresaId), h = hoje();
    const total = r2((+l.principal || 0) + (+l.multa || 0) + (+l.juros || 0));
    const status = l.pagamento ? 'Pago' : !l.vencimento ? 'Sem venc.' : l.vencimento < h ? 'Vencido' : 'A vencer';
    const dias = status === 'Pago' || !l.vencimento ? null : diasEntre(l.vencimento, h);
    return { ...l, empresa: nomeEmp(e), total, status, dias };
  }
  function resumoFiscal(db) {
    const ls = db.lancamentos.map(l => calcLanc(db, l));
    const soma = f => r2(ls.filter(f).reduce((s, l) => s + l.total, 0));
    const mes = hoje().slice(0, 7);
    const porEmp = db.empresas.filter(e => empAtiva(db, e)).map(e => {
      const m = ls.filter(l => l.empresaId === e.id);
      const s = f => r2(m.filter(f).reduce((a, l) => a + l.total, 0));
      return { e, nome: nomeEmp(e), cnpj: e.cnpj, regime: e.regime, vencido: s(l => l.status === 'Vencido'), aVencer: s(l => l.status === 'A vencer'), pago: s(l => l.status === 'Pago'),
        qVencido: m.filter(l => l.status === 'Vencido').length, abertos: m.filter(l => l.status !== 'Pago').sort((a, b) => String(a.vencimento || '9').localeCompare(String(b.vencimento || '9'))) };
    });
    return {
      ls, porEmp, vencido: soma(l => l.status === 'Vencido'), qVencido: ls.filter(l => l.status === 'Vencido').length,
      prox5: ls.filter(l => l.status === 'A vencer' && l.dias <= 5).sort((a, b) => a.dias - b.dias), aVencer: soma(l => l.status === 'A vencer'),
      pagoMes: soma(l => l.status === 'Pago' && String(l.pagamento).slice(0, 7) === mes), semVenc: ls.filter(l => l.status === 'Sem venc.').length,
    };
  }
  const ativa = p => p.situacao !== 'Desligado' && !p.demissao;
  function prazosFolha(comp) {
    const seg = proxComp(comp);
    return [{ k: 'esocial', t: 'eSocial', d: antecipar(seg + '-15') }, { k: 'dctfweb', t: 'DCTFWeb', d: antecipar(seg + '-15') },
      { k: 'darf', t: 'DARF do INSS', d: antecipar(seg + '-20') }, { k: 'fgts', t: 'FGTS Digital', d: antecipar(seg + '-20') }];
  }
  function experiencias(p) {
    if (!p.admissao || !p.experiencia || p.experiencia === 'Não' || !ativa(p)) return [];
    const [a, b] = p.experiencia === '90' ? [90, 0] : p.experiencia.split('+').map(Number);
    const l = [{ t: '1º período', d: addDias(p.admissao, a - 1) }];
    if (b) l.push({ t: 'fim da experiência', d: addDias(p.admissao, a + b - 1) });
    return l.map(x => ({ ...x, dias: diasEntre(x.d, hoje()) })).filter(x => x.dias >= -3 && x.dias <= 20);
  }
  function resumoFolha(db, comp = compAnterior()) {
    const porEmp = db.empresas.filter(e => empAtiva(db, e)).map(e => {
      const ps = db.pessoas.filter(p => p.empresaId === e.id);
      const atv = ps.filter(ativa), clt = atv.some(p => p.vinculo === 'CLT');
      const etapas = ETAPAS.filter(x => !x.clt || clt);
      const fech = db.fechamentos.find(f => f.empresaId === e.id && f.competencia === comp);
      const feitas = etapas.filter(x => fech && fech.etapas && fech.etapas[x.k]).length;
      const exp = atv.flatMap(p => experiencias(p).map(x => ({ ...x, nome: p.nome.split(' ')[0] })));
      return { e, nome: nomeEmp(e), cnpj: e.cnpj, regime: e.regime, alerta: e.alerta || '', ativos: atv.length, clt: atv.filter(p => p.vinculo === 'CLT').length,
        proLabore: atv.filter(p => p.vinculo === 'Pró-labore').length, admissao: ps.filter(p => p.situacao === 'Em admissão').length,
        folha: r2(atv.reduce((s, p) => s + (+p.salario || 0), 0)), etapas, fech, feitas, total: etapas.length, exp,
        pessoas: atv.map(p => ({ nome: p.nome, cargo: p.cargo || p.vinculo, vinculo: p.vinculo, situacao: p.situacao, admissao: p.admissao })) };
    });
    const prazos = prazosFolha(comp).map(x => ({ ...x, dias: diasEntre(x.d, hoje()) }));
    return { comp, porEmp, prazos, ativos: porEmp.reduce((s, x) => s + x.ativos, 0), folha: r2(porEmp.reduce((s, x) => s + x.folha, 0)),
      fechadas: porEmp.filter(x => x.feitas === x.total).length, pendentes: porEmp.filter(x => x.feitas < x.total), exp: porEmp.flatMap(x => x.exp.map(y => ({ ...y, emp: x.nome }))) };
  }

  // ------------------------------------------------------------------ diálogo dos setores
  let abaAtual = 'check', setorAtual = 'fiscal', empFiltro = '';
  function montar() {
    if ($('#dlgSetor')) return;
    const d = document.createElement('dialog');
    d.id = 'dlgSetor'; d.className = 'setor-dlg';
    d.innerHTML = `<div class="dlg-topo"><h2 id="setorTitulo">🧾 Fiscal</h2><button data-fechar aria-label="Fechar">×</button></div>
      <div class="setor-abas" id="setorAbas"><button data-s="check">✅ Checklist do mês</button><button data-s="ver">📊 Ver informações</button><button data-s="add">＋ Adicionar</button></div>
      <div class="dlg-corpo" id="setorCorpo"></div>`;
    document.body.append(d);
    d.querySelector('[data-fechar]').addEventListener('click', () => d.close());
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    d.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => { abaAtual = b.dataset.s; render(); }));
  }
  async function abrir(k, aba, emp) {
    montar();
    setorAtual = k; if (aba) abaAtual = aba; empFiltro = emp || '';
    const d = $('#dlgSetor');
    $('#setorTitulo').textContent = k === 'fiscal' ? `🧾 Setor Fiscal · ${KM.nomeDe ? KM.nomeDe('fiscal') : 'Bruno'}` : `👥 Setor de Folha · ${KM.nomeDe ? KM.nomeDe('folha') : 'Carla'}`;
    $('#setorCorpo').innerHTML = '<p class="vazio">Carregando os dados do ' + FONTES[k].nome + '…</p>';
    if (!d.open) d.showModal();
    try { await carregar(k); }
    catch (e) { if (e.semDados) return pedirToken(k); $('#setorCorpo').innerHTML = ''; $('#setorCorpo').append(A().el('p', { class: 'vazio' }, '❌ ' + e.message)); return; }
    render();
  }
  function render() {
    const d = $('#dlgSetor'); if (!d) return;
    d.querySelectorAll('[data-s]').forEach(b => b.classList.toggle('ativa', b.dataset.s === abaAtual));
    const corpo = $('#setorCorpo'); corpo.innerHTML = '';
    const c = dados(setorAtual); if (!c) return;
    corpo.append(barraOrigem(c));
    if (abaAtual === 'check' && KM.obrigacoes) return KM.obrigacoes.render(corpo, setorAtual, c.db, render);
    if (setorAtual === 'fiscal') (abaAtual === 'add' ? formFiscal : verFiscal)(corpo, c.db);
    else (abaAtual === 'add' ? formFolha : verFolha)(corpo, c.db);
  }
  function barraOrigem(c) {
    const { el } = A(), F = FONTES[setorAtual];
    const txt = c.origem === 'github' ? `☁️ Dados do ${F.nome} no GitHub (atualizado ${c.db.atualizadoEm ? new Date(c.db.atualizadoEm).toLocaleString('pt-BR') : '—'})`
      : c.origem === 'pc' ? `💻 Cópia do ${F.nome} que está neste PC (só leitura). Conecte o token para ver o mais novo e adicionar.`
      : `📱 Cópia do app ${F.nome} deste aparelho (só leitura). Conecte o token para adicionar.`;
    return el('div', { class: 'setor-origem' }, el('span', {}, txt),
      el('button', { class: 'bt peq', onclick: async () => { try { await carregar(setorAtual, true); render(); A().toast('🔄 Atualizado'); } catch (e) { A().toast(e.message, { erro: true }); } } }, '🔄'),
      c.origem !== 'github' ? el('button', { class: 'bt peq prim', onclick: () => pedirToken(setorAtual) }, '🔗 Conectar') : null,
      el('a', { class: 'bt peq', href: F.app, target: '_blank', rel: 'noopener' }, `Abrir o ${F.nome} ↗`));
  }
  const chip = (st, dias) => {
    const cls = st === 'Pago' ? 's-ok' : st === 'Vencido' ? 's-ve' : st === 'Sem venc.' ? 's-sv' : dias <= 5 ? 's-av' : 's-az';
    const t = st === 'A vencer' ? (dias === 0 ? 'vence hoje' : `em ${dias} dia${dias === 1 ? '' : 's'}`) : st === 'Vencido' ? `vencido há ${-dias} dia${dias === -1 ? '' : 's'}` : st;
    return A().el('span', { class: 'chip ' + cls }, t);
  };
  function tiles(lista) { const { el } = A(); return el('div', { class: 'setor-tiles' }, lista.map(([v, t, cls]) => el('div', { class: cls || '' }, el('b', {}, v), el('small', {}, t)))); }
  function filtroEmp(db, corpo) {
    const { el } = A();
    const sel = el('select', { onchange: e => { empFiltro = e.target.value; render(); } }, el('option', { value: '' }, '🏢 Todas as empresas'),
      db.empresas.filter(e => empAtiva(db, e)).map(e => el('option', { value: e.id, selected: e.id === empFiltro }, nomeEmp(e))));
    corpo.append(el('div', { class: 'setor-filtro' }, sel));
  }

  function verFiscal(corpo, db) {
    const { el } = A(), R = resumoFiscal(db);
    corpo.append(tiles([[brl(R.vencido), `vencido (${R.qVencido})`, R.qVencido ? 'mal' : 'bem'], [String(R.prox5.length), 'vencem em até 5 dias', R.prox5.length ? 'atencao' : ''],
      [brl(R.aVencer), 'a vencer'], [brl(R.pagoMes), 'pago neste mês', 'bem']]));
    filtroEmp(db, corpo);
    for (const x of R.porEmp.filter(x => !empFiltro || x.e.id === empFiltro)) {
      const card = el('div', { class: 'setor-emp' },
        el('div', { class: 'se-cab' }, el('div', {}, el('b', {}, x.nome), el('small', {}, [x.cnpj, x.regime].filter(Boolean).join(' · '))),
          el('div', { class: 'se-nums' }, el('span', { class: x.vencido ? 'neg' : '' }, `Vencido ${brl(x.vencido)}`), el('span', {}, `A vencer ${brl(x.aVencer)}`), el('span', { class: 'pos' }, `Pago ${brl(x.pago)}`))));
      const ul = el('ul', { class: 'se-lista' });
      if (!x.abertos.length) ul.append(el('li', { class: 'vazio' }, '✅ Nada em aberto.'));
      for (const l of x.abertos.slice(0, 12)) {
        ul.append(el('li', {}, el('div', { class: 'se-info' }, el('b', {}, `${l.tributo} · ${fmtComp(l.competencia)}`), el('small', {}, `vence ${fmtD(l.vencimento)}${l.guia ? ' · guia ' + l.guia : ''}${l.obs ? ' · ' + l.obs.slice(0, 70) : ''}`)),
          el('span', { class: 'se-valor' }, brl(l.total)), chip(l.status, l.dias),
          el('button', { class: 'bt peq', title: 'Marcar como pago hoje', onclick: async e => {
            if (!confirm(`Marcar ${l.tributo} ${fmtComp(l.competencia)} de ${x.nome} (${brl(l.total)}) como pago hoje?`)) return;
            e.currentTarget.disabled = true;
            try { await gravar('fiscal', `Pago: ${l.tributo} ${l.competencia} · ${x.nome}`, db2 => { const a = db2.lancamentos.find(q => q.id === l.id); if (a) a.pagamento = hoje(); }); A().toast('✅ Marcado como pago'); render(); }
            catch (err) { A().toast('Não consegui gravar: ' + err.message, { erro: true, ms: 8000 }); render(); }
          } }, '✅ Pago')));
      }
      if (x.abertos.length > 12) ul.append(el('li', { class: 'vazio' }, `+ ${x.abertos.length - 12} em aberto (veja no KWIK Fiscal)`));
      card.append(ul);
      card.append(el('div', { class: 'se-bts' }, el('button', { class: 'bt peq prim', onclick: () => { empFiltro = x.e.id; abaAtual = 'add'; render(); } }, '＋ Lançar guia desta empresa')));
      corpo.append(card);
    }
  }
  function campo(rot, input, cls) { return A().el('label', { class: 'se-campo ' + (cls || '') }, A().el('span', {}, rot), input); }
  function formFiscal(corpo, db) {
    const { el } = A();
    if (dados('fiscal').origem !== 'github') corpo.append(el('p', { class: 'obs' }, '🔒 Para adicionar, conecte o token do KWIK Fiscal (botão Conectar acima).'));
    const emp = el('select', { required: true }, db.empresas.filter(e => empAtiva(db, e)).map(e => el('option', { value: e.id, selected: e.id === empFiltro }, nomeEmp(e))));
    const trib = el('select', { required: true }, db.tributos.map(t => el('option', { value: t.nome }, `${t.nome}${t.esfera ? ' · ' + t.esfera : ''}`)));
    const comp = el('input', { type: 'month', value: compAnterior(), required: true });
    const venc = el('input', { type: 'date' }), princ = el('input', { type: 'text', inputmode: 'decimal', placeholder: '0,00', required: true });
    const multa = el('input', { type: 'text', inputmode: 'decimal', placeholder: '0,00' }), juros = el('input', { type: 'text', inputmode: 'decimal', placeholder: '0,00' });
    const guia = el('input', { type: 'text', maxlength: 60, placeholder: 'nº da guia (opcional)' }), pago = el('input', { type: 'date' }), obs = el('input', { type: 'text', maxlength: 200, placeholder: 'observação (opcional)' });
    const st = el('p', { class: 'vazio', style: 'min-height:18px' });
    const f = el('form', { class: 'se-form', onsubmit: async e => {
      e.preventDefault();
      const l = { id: uid(), empresaId: emp.value, tributo: trib.value, competencia: comp.value, vencimento: venc.value, guia: guia.value.trim(), principal: num(princ.value), multa: num(multa.value), juros: num(juros.value), pagamento: pago.value, obs: obs.value.trim() };
      if (!l.principal) { st.textContent = 'Informe o valor principal.'; return; }
      const bt = f.querySelector('button[type=submit]'); bt.disabled = true; st.textContent = 'Gravando no KWIK Fiscal…';
      try {
        await gravar('fiscal', `Novo lançamento: ${l.tributo} ${l.competencia} · ${emp.selectedOptions[0].textContent}`, db2 => db2.lancamentos.push(l));
        KM.tocar('sucesso'); A().toast(`🧾 Lançado: ${l.tributo} ${fmtComp(l.competencia)} · ${brl(l.principal + l.multa + l.juros)}`);
        const p = A().estado.pessoas && Object.values(A().estado.pessoas).find(q => q.funcao === 'fiscal');
        if (p) A().falar(p.id, `Anotado! ${l.tributo} de ${fmtComp(l.competencia)} no sistema 🧾`, 3000);
        empFiltro = l.empresaId; abaAtual = 'ver'; render();
      } catch (err) { st.textContent = '❌ ' + err.message; bt.disabled = false; }
    } },
      el('h3', {}, '🧾 Novo lançamento (guia / imposto)'),
      el('div', { class: 'se-grade' }, campo('Empresa', emp, 'c2'), campo('Tributo', trib), campo('Competência', comp), campo('Vencimento', venc), campo('Principal (R$)', princ),
        campo('Multa (R$)', multa), campo('Juros (R$)', juros), campo('Guia', guia), campo('Pago em', pago), campo('Observação', obs, 'c2')),
      st, el('button', { class: 'bt prim', type: 'submit' }, '＋ Lançar no KWIK Fiscal'));
    corpo.append(f);
  }

  function verFolha(corpo, db) {
    const { el } = A(), R = resumoFolha(db);
    corpo.append(tiles([[String(R.ativos), 'pessoas ativas'], [brl(R.folha), 'salários + pró-labores/mês'],
      [`${R.fechadas}/${R.porEmp.length}`, `folhas de ${fmtComp(R.comp)} fechadas`, R.fechadas === R.porEmp.length ? 'bem' : 'atencao'], [String(R.exp.length), 'experiências vencendo', R.exp.length ? 'atencao' : '']]));
    corpo.append(el('div', { class: 'se-prazos' }, el('b', {}, `📅 Prazos da folha de ${fmtComp(R.comp)}:`),
      R.prazos.map(p => el('span', { class: 'chip ' + (p.dias < 0 ? 's-ve' : p.dias <= 3 ? 's-av' : 's-az') }, `${p.t} ${fmtD(p.d).slice(0, 5)}`))));
    filtroEmp(db, corpo);
    for (const x of R.porEmp.filter(x => !empFiltro || x.e.id === empFiltro)) {
      const card = el('div', { class: 'setor-emp' },
        el('div', { class: 'se-cab' }, el('div', {}, el('b', {}, x.nome), el('small', {}, [x.cnpj, x.regime, x.e.cpp === 'darf' ? 'patronal na DARF' : 'patronal no DAS'].filter(Boolean).join(' · '))),
          el('div', { class: 'se-nums' }, el('span', {}, `${x.ativos} pessoa${x.ativos === 1 ? '' : 's'}`), el('span', {}, brl(x.folha) + '/mês'), el('span', { class: x.feitas === x.total ? 'pos' : 'neg' }, `${fmtComp(R.comp)}: ${x.feitas}/${x.total}`))));
      if (x.alerta) card.append(el('p', { class: 'se-alerta' }, '⚠️ ' + x.alerta));
      const et = el('div', { class: 'se-etapas' });
      for (const e of x.etapas) {
        const feito = !!(x.fech && x.fech.etapas && x.fech.etapas[e.k]);
        et.append(el('button', { class: 'etapa' + (feito ? ' ok' : ''), title: feito ? 'Desmarcar' : 'Marcar como feito', onclick: async ev => {
          ev.currentTarget.disabled = true;
          try {
            await gravar('folha', `Fechamento ${R.comp} · ${x.nome}: ${e.t}${feito ? ' (desmarcado)' : ''}`, db2 => {
              let fch = db2.fechamentos.find(q => q.empresaId === x.e.id && q.competencia === R.comp);
              if (!fch) { fch = { id: `f-${x.e.id.replace(/^e-/, '')}-${R.comp}`, empresaId: x.e.id, competencia: R.comp, etapas: {}, darfValor: 0, fgtsValor: 0, obs: '' }; db2.fechamentos.push(fch); }
              fch.etapas = { ...(fch.etapas || {}), [e.k]: !feito };
            });
            render();
          } catch (err) { A().toast('Não consegui gravar: ' + err.message, { erro: true, ms: 8000 }); render(); }
        } }, (feito ? '✅ ' : '⬜ ') + e.t));
      }
      card.append(el('small', { class: 'se-sub' }, `Fechamento da folha de ${fmtComp(R.comp)} (toque para marcar):`), et);
      const ul = el('ul', { class: 'se-lista' });
      for (const p of x.pessoas) ul.append(el('li', {}, el('div', { class: 'se-info' }, el('b', {}, p.nome), el('small', {}, `${p.cargo}${p.vinculo !== 'Pró-labore' ? ' · ' + p.vinculo : ' · pró-labore'}${p.admissao ? ' · desde ' + fmtD(p.admissao) : ''}`)),
        el('span', { class: 'chip ' + (p.situacao === 'Ativo' ? 's-ok' : 's-av') }, p.situacao)));
      if (!x.pessoas.length) ul.append(el('li', { class: 'vazio' }, 'Ninguém cadastrado.'));
      card.append(ul);
      for (const e of x.exp) card.append(el('p', { class: 'se-alerta' }, `⏳ ${e.nome}: ${e.t} em ${fmtD(e.d)} (${e.dias >= 0 ? 'faltam ' + e.dias + ' dias' : 'passou'})`));
      card.append(el('div', { class: 'se-bts' }, el('button', { class: 'bt peq prim', onclick: () => { empFiltro = x.e.id; abaAtual = 'add'; render(); } }, '＋ Funcionário nesta empresa')));
      corpo.append(card);
    }
  }
  function formFolha(corpo, db) {
    const { el } = A();
    if (dados('folha').origem !== 'github') corpo.append(el('p', { class: 'obs' }, '🔒 Para adicionar, conecte o token do KWIK Folha (botão Conectar acima).'));
    const emp = el('select', {}, db.empresas.filter(e => empAtiva(db, e)).map(e => el('option', { value: e.id, selected: e.id === empFiltro }, nomeEmp(e))));
    const nome = el('input', { type: 'text', maxlength: 90, required: true, placeholder: 'Nome completo' });
    const vin = el('select', {}, ['CLT', 'Pró-labore', 'Estágio'].map(v => el('option', {}, v)));
    const cargo = el('input', { type: 'text', maxlength: 60, placeholder: 'ex.: Recepcionista' });
    const adm = el('input', { type: 'date', value: hoje() }), sal = el('input', { type: 'text', inputmode: 'decimal', placeholder: '1.621,00' });
    const sit = el('select', {}, ['Em admissão', 'Ativo', 'Férias', 'Afastado'].map(v => el('option', {}, v)));
    const exp = el('select', {}, ['45+45', '30+60', '90', 'Não'].map(v => el('option', {}, v)));
    const cpf = el('input', { type: 'text', inputmode: 'numeric', maxlength: 14, placeholder: 'opcional' }), obs = el('input', { type: 'text', maxlength: 200, placeholder: 'observação (opcional)' });
    vin.addEventListener('change', () => { if (vin.value === 'Pró-labore') { exp.value = 'Não'; sit.value = 'Ativo'; } });
    const st = el('p', { class: 'vazio', style: 'min-height:18px' });
    const f = el('form', { class: 'se-form', onsubmit: async e => {
      e.preventDefault();
      const p = { id: uid(), empresaId: emp.value, codigo: '', nome: nome.value.trim(), cpf: cpf.value.trim(), pis: '', nascimento: '', vinculo: vin.value, cargo: cargo.value.trim(), cbo: '', admissao: adm.value, demissao: '',
        salario: num(sal.value), insalubridade: 0, jornada: '', dependentes: 0, situacao: sit.value, feriasGozadas: 0, experiencia: exp.value, checklist: {}, obs: obs.value.trim() };
      if (!p.nome) return;
      const bt = f.querySelector('button[type=submit]'); bt.disabled = true; st.textContent = 'Gravando no KWIK Folha…';
      try {
        await gravar('folha', `Novo cadastro: ${p.nome.split(' ')[0]} · ${emp.selectedOptions[0].textContent}`, db2 => db2.pessoas.push(p));
        KM.tocar('sucesso'); A().toast(`👥 ${p.nome.split(' ')[0]} cadastrado(a) em ${emp.selectedOptions[0].textContent}. Complete CPF, PIS e documentos no KWIK Folha.`, { ms: 8000 });
        const q = Object.values(A().estado.pessoas || {}).find(x => x.funcao === 'folha');
        if (q) A().falar(q.id, `Bem-vindo(a), ${p.nome.split(' ')[0]}! Já tá na folha 👥`, 3000);
        empFiltro = p.empresaId; abaAtual = 'ver'; render();
      } catch (err) { st.textContent = '❌ ' + err.message; bt.disabled = false; }
    } },
      el('h3', {}, '👥 Novo funcionário ou sócio'),
      el('div', { class: 'se-grade' }, campo('Empresa', emp, 'c2'), campo('Nome', nome, 'c2'), campo('Vínculo', vin), campo('Cargo', cargo), campo('Admissão', adm), campo('Salário (R$)', sal),
        campo('Situação', sit), campo('Experiência', exp), campo('CPF', cpf), campo('Observação', obs)),
      el('p', { class: 'obs' }, 'O fechamento do mês (eSocial, DCTFWeb, DARF, FGTS) é marcado em "Ver informações", tocando em cada etapa. Contracheques e cálculos continuam no app KWIK Folha.'),
      st, el('button', { class: 'bt prim', type: 'submit' }, '＋ Cadastrar no KWIK Folha'));
    corpo.append(f);
  }

  // ------------------------------------------------------------------ trabalho do Bruno (Fiscal) e da Carla (Folha)
  async function trabalhar(k, f, p) {
    if (p.trabalhando) return;
    const eu = f.nome.split(' ')[0];
    try { await carregar(k, true); } catch (e) { A().toast(`${eu} precisa dos dados do ${FONTES[k].nome}: conecte o token 🔗`, { ms: 7000 }); return abrir(k); }
    if (!A().online()) { A().toast('Conecte ao GitHub (ou abra o servidor do PC) para salvar o relatório 🔗'); return; }
    if (!(await A().esperarLivre(p, 1500))) return A().toast(`Espere ${eu} terminar o que está fazendo 😉`);
    if (p.modo !== 'sentado') await KM.voltarSentar(p);
    A().pagar(f, p);
    A().iniciarPainelTarefa(k === 'fiscal' ? '🧾 Fiscal · impostos e guias dos clientes' : '👥 Folha · fechamento do mês');
    p.trabalhando = true; p.digitando = true; A().estado.trabalhoDe[k] = true; A().atualizarBotoes();
    const cb = A().callbacksTarefa(p, false);
    let erro, salvo;
    try {
      const db = dados(k).db;
      if (k === 'fiscal') {
        await U().produzir(p, cb, [['Abrindo o KWIK Fiscal 🧾', 20, 1600], ['Conferindo vencimentos de cada cliente 📅', 50, 2200], ['Separando o que está vencido 🔴', 75, 1800], ['Montando o resumo 📊', 92, 1400]]);
        const R = resumoFiscal(db);
        salvo = { id: U().agoraId('fiscal'), tipo: 'fiscal', criadoEm: U().agoraIso(), funcionario: { id: f.id, nome: f.nome }, tarefa: 'Conferência fiscal dos clientes', titulo: `Impostos dos clientes · ${new Date().toLocaleDateString('pt-BR')}`, duracao: 8,
          vencido: R.vencido, qVencido: R.qVencido, aVencer: R.aVencer, pagoMes: R.pagoMes,
          prox: R.prox5.map(l => ({ empresa: l.empresa, tributo: l.tributo, competencia: l.competencia, vencimento: l.vencimento, total: l.total, dias: l.dias })),
          vencidos: R.ls.filter(l => l.status === 'Vencido').map(l => ({ empresa: l.empresa, tributo: l.tributo, competencia: l.competencia, vencimento: l.vencimento, total: l.total, dias: l.dias })),
          empresas: R.porEmp.map(x => ({ nome: x.nome, cnpj: x.cnpj, regime: x.regime, vencido: x.vencido, aVencer: x.aVencer, pago: x.pago, abertos: x.abertos.length })) };
      } else {
        await U().produzir(p, cb, [['Abrindo o KWIK Folha 👥', 20, 1600], ['Conferindo o fechamento de cada empresa ✅', 50, 2200], ['Olhando prazos e experiências ⏳', 75, 1800], ['Montando o resumo 📊', 92, 1400]]);
        const R = resumoFolha(db);
        salvo = { id: U().agoraId('folha'), tipo: 'folha', criadoEm: U().agoraIso(), funcionario: { id: f.id, nome: f.nome }, tarefa: 'Conferência da folha dos clientes', titulo: `Folha de ${fmtComp(R.comp)}`, duracao: 8, comp: R.comp,
          ativos: R.ativos, fechadas: R.fechadas, prazos: R.prazos, exp: R.exp,
          empresas: R.porEmp.map(x => ({ nome: x.nome, cnpj: x.cnpj, ativos: x.ativos, clt: x.clt, proLabore: x.proLabore, admissao: x.admissao, feitas: x.feitas, total: x.total, alerta: x.alerta,
            faltam: x.etapas.filter(e => !(x.fech && x.fech.etapas && x.fech.etapas[e.k])).map(e => e.t) })) };
      }
      await A().BK().salvarRelatorio(salvo);
      cb.progresso(100);
    } catch (e) { erro = e; }
    p.trabalhando = false; p.digitando = false; A().estado.trabalhoDe[k] = false; A().atualizarBotoes();
    if (erro) { A().falar(p.id, 'Ih, deu um probleminha 😅', 3000); return A().toast(`${eu}: ` + erro.message, { erro: true, ms: 9000 }); }
    await A().carregarRelatorios(KM.resumoRelatorio(salvo));
    if (k === 'fiscal') A().falar(p.id, salvo.qVencido ? `Atenção: ${salvo.qVencido} guia(s) vencida(s)! 🔴` : 'Tudo em dia nos impostos ✅', 3400);
    else A().falar(p.id, salvo.fechadas === salvo.empresas.length ? 'Todas as folhas fechadas ✅' : `Faltam ${salvo.empresas.length - salvo.fechadas} folha(s) para fechar 👥`, 3400);
    A().toast(`${k === 'fiscal' ? '🧾' : '👥'} ${eu} terminou: ${salvo.titulo}.`, { botao: ['Ver relatório', () => A().abrirRelatorio(salvo.id)], ms: 10000 });
    await A().concluir(f, p);
  }

  function renderRel(r, box) {
    const { el, fmtData } = A();
    const rel = el('div', { class: 'rel setor-rel' });
    rel.append(el('div', { class: 'rel-cab' }, el('div', {}, el('h2', {}, `${r.tipo === 'fiscal' ? '🧾' : '👥'} ${r.titulo}`), el('p', {}, `Feito por ${r.funcionario?.nome || ''} em ${fmtData(r.criadoEm)} com os dados do ${FONTES[r.tipo].nome}`)),
      el('div', { class: 'rel-bts' }, el('button', { class: 'bt peq prim', onclick: () => abrir(r.tipo, 'ver') }, '📊 Ver dados de agora'), el('button', { class: 'bt peq perigo', onclick: () => A().apagarRel(r) }, '🗑️ Apagar'))));
    const tab = (cab, linhas) => el('div', { class: 'fin-tab' }, el('table', {}, el('thead', {}, el('tr', {}, cab.map(t => el('th', {}, t)))), el('tbody', {}, linhas.map(l => el('tr', {}, l.map(c => el('td', {}, c)))))));
    if (r.tipo === 'fiscal') {
      rel.append(tiles([[brl(r.vencido), `vencido (${r.qVencido})`, r.qVencido ? 'mal' : 'bem'], [String((r.prox || []).length), 'vencem em até 5 dias', (r.prox || []).length ? 'atencao' : ''], [brl(r.aVencer), 'a vencer'], [brl(r.pagoMes), 'pago no mês', 'bem']]));
      if ((r.vencidos || []).length) rel.append(el('h3', {}, '🔴 Vencidos'), tab(['Empresa', 'Tributo', 'Comp.', 'Vencimento', 'Valor'], r.vencidos.map(l => [l.empresa, l.tributo, fmtComp(l.competencia), `${fmtD(l.vencimento)} (${-l.dias}d)`, brl(l.total)])));
      if ((r.prox || []).length) rel.append(el('h3', {}, '🟡 Vencem em até 5 dias'), tab(['Empresa', 'Tributo', 'Comp.', 'Vencimento', 'Valor'], r.prox.map(l => [l.empresa, l.tributo, fmtComp(l.competencia), `${fmtD(l.vencimento)} (${l.dias}d)`, brl(l.total)])));
      rel.append(el('h3', {}, '🏢 Por empresa'), tab(['Empresa', 'Regime', 'Vencido', 'A vencer', 'Pago', 'Em aberto'], (r.empresas || []).map(x => [x.nome, x.regime || '', brl(x.vencido), brl(x.aVencer), brl(x.pago), String(x.abertos)])));
    } else {
      rel.append(tiles([[String(r.ativos), 'pessoas ativas'], [`${r.fechadas}/${(r.empresas || []).length}`, `folhas de ${fmtComp(r.comp)} fechadas`, r.fechadas === (r.empresas || []).length ? 'bem' : 'atencao'], [String((r.exp || []).length), 'experiências vencendo', (r.exp || []).length ? 'atencao' : '']]));
      rel.append(el('h3', {}, `📅 Prazos de ${fmtComp(r.comp)}`), tab(['Obrigação', 'Prazo'], (r.prazos || []).map(p => [p.t, fmtD(p.d)])));
      rel.append(el('h3', {}, '🏢 Por empresa'), tab(['Empresa', 'Pessoas', 'Fechamento', 'Falta'], (r.empresas || []).map(x => [x.nome, `${x.ativos} (${x.clt} CLT, ${x.proLabore} pró-labore)`, `${x.feitas}/${x.total}`, x.faltam.length ? x.faltam.join(', ') : '✅ fechada'])));
      for (const x of (r.empresas || []).filter(x => x.alerta)) rel.append(el('p', { class: 'se-alerta' }, `⚠️ ${x.nome}: ${x.alerta}`));
      for (const e of r.exp || []) rel.append(el('p', { class: 'se-alerta' }, `⏳ ${e.emp} · ${e.nome}: ${e.t} em ${fmtD(e.d)}`));
    }
    rel.append(el('p', { class: 'obs' }, 'Conferência automática com os dados dos apps da KWIK. Prazos em dia útil sem considerar feriados: confirme sempre no e-CAC, eSocial e DCTFWeb.'));
    box.append(rel);
  }

  // texto curto para os quadros das salas
  function resumoParede(k) {
    const c = dados(k); if (!c) return null;
    if (k === 'fiscal') { const R = resumoFiscal(c.db); return { a: R.qVencido, b: R.prox5.length }; }
    const R = resumoFolha(c.db); return { a: R.fechadas, b: R.porEmp.length };
  }

  function iniciar() {
    // carrega em segundo plano para os quadros das salas e a rua dos clientes
    setTimeout(() => { carregar('fiscal').catch(() => {}); carregar('folha').catch(() => {}); }, 2500);
  }

  KM.setores = { iniciar, abrir, carregar, dados, gravar, trabalhar, renderRel, resumoFiscal, resumoFolha, resumoParede, nomeEmp, digitos, FONTES, conf };
})();
