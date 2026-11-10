/* KWIK Mini Escritório · setor do E-book (Luna).
   Mostra quanto o e-book vendeu, o saldo na Kiwify, quem comprou e as vendas por dia. Os dados vêm da API oficial da
   Kiwify, buscados por uma Action do GitHub ("E-book (Kiwify)", a cada 2 horas) e guardados em nuvem/ebook.json no
   repositório privado. O app só lê esse arquivo: a senha da Kiwify nunca passa pelo app.
   Para ligar: Kiwify → Apps → API → Criar API Key; no GitHub, guardar KIWIFY_CLIENT_ID, KIWIFY_CLIENT_SECRET e
   KIWIFY_ACCOUNT_ID em Settings → Secrets and variables → Actions do repositório KWIK-MINI-ESCRITORIO. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  const el = (...a) => A().el(...a);
  const PAGINA = 'https://ebookkwik.my.canva.site/', PAINEL = 'https://dashboard.kiwify.com/';
  const ARQ = 'nuvem/ebook.json';
  const OK = new Set(['paid', 'approved', 'authorized']), DEVOLVIDA = new Set(['refunded', 'chargedback', 'pending_refund', 'refund_requested']), ESPERA = new Set(['waiting_payment', 'pending', 'processing']);
  const STATUS = { paid: 'Paga', approved: 'Aprovada', authorized: 'Autorizada', refunded: 'Reembolsada', chargedback: 'Chargeback', pending_refund: 'Reembolso pendente', refund_requested: 'Pediu reembolso', waiting_payment: 'Aguardando pagamento', pending: 'Pendente', processing: 'Processando', refused: 'Recusada' };
  const METODO = { pix: 'Pix', credit_card: 'Cartão', boleto: 'Boleto' };
  let dados = null, erro = '', carregando = null, aba = 'resumo', busca = '';
  const gh = () => KM.backends && KM.backends.github;
  const reais = (v, cent) => (v == null ? '—' : ((cent !== false ? v / 100 : v)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  const dia = s => (s ? new Date(String(s).replace(' ', 'T')) : null);
  const fmtD = s => { const d = dia(s); return d && !isNaN(d) ? d.toLocaleDateString('pt-BR') + ' ' + d.toTimeString().slice(0, 5) : '—'; };
  const mesmoDia = (a, b) => a.toDateString() === b.toDateString();

  async function carregar(forcar) {
    if (carregando && !forcar) return carregando;
    carregando = (async () => {
      const g = gh();
      if (!g || !g.conf().token) { erro = 'Conecte o app ao GitHub (🔗 no topo) para ver as vendas.'; return null; }
      try { dados = await g.lerJson(ARQ); erro = dados ? '' : 'Ainda não há dados: falta ligar a Kiwify (aba Configurar).'; }
      catch (e) { erro = 'Não consegui ler as vendas: ' + e.message; }
      avisarNovas();
      return dados;
    })();
    try { return await carregando; } finally { carregando = null; }
  }
  const vendas = () => (dados && Array.isArray(dados.vendas) ? dados.vendas : []);
  const cent = () => !(dados && dados.centavos === false);
  function resumo() {
    const vs = vendas(), ag = new Date(), ok = vs.filter(v => OK.has(v.status));
    const desde = d => ok.filter(v => { const x = dia(v.data); return x && ag - x <= d * 864e5; });
    const soma = l => l.reduce((s, v) => s + (+v.liquido || 0), 0);
    const hoje = ok.filter(v => { const x = dia(v.data); return x && mesmoDia(x, ag); });
    const semanas = Array.from({ length: 8 }, (_, i) => ok.filter(v => { const x = dia(v.data); const k = Math.floor((ag - x) / (7 * 864e5)); return k === 7 - i; }).length);
    const compradores = new Set(ok.map(v => (v.cliente && v.cliente.email) || v.id)).size;
    return {
      total: ok.length, liquido: soma(ok), hoje: hoje.length, liqHoje: soma(hoje), d7: desde(7).length, liq7: soma(desde(7)), d30: desde(30).length, liq30: soma(desde(30)),
      devolvidas: vs.filter(v => DEVOLVIDA.has(v.status)).length, espera: vs.filter(v => ESPERA.has(v.status)).length, ticket: ok.length ? soma(ok) / ok.length : 0, compradores, semanas,
    };
  }
  KM.ebook = KM.ebook || {};
  function resumoParede() { if (!dados) return null; const r = resumo(); return { hoje: r.hoje, semanas: r.semanas }; }

  // nova venda desde a última vez → festa no escritório
  function avisarNovas() {
    if (!dados || !dados.configurado) return;
    const c = A().cfg(); c.ebook = c.ebook || {};
    const n = vendas().filter(v => OK.has(v.status)).length;
    if (c.ebook.vistas == null) { c.ebook.vistas = n; A().salvar(); return; }
    if (n > c.ebook.vistas) {
      const novas = n - c.ebook.vistas, luna = c.funcionarios.find(f => f.funcao === 'ebook');
      c.ebook.vistas = n; A().salvar();
      A().toast(`🎉 ${novas === 1 ? 'Nova venda' : novas + ' vendas novas'} do e-book!`, { botao: ['Ver', () => abrir()], ms: 9000 });
      if (luna) { A().falar(luna.id, `Vendeu mais ${novas} e-book${novas > 1 ? 's' : ''}! 🎉📘`, 4000); if (KM.explosaoDinheiro) KM.explosaoDinheiro(0, luna.id); if (KM.pulos) KM.pulos(luna.id); }
    }
  }

  // ------------------------------------------------------------------ janela
  function montar() {
    if ($('#dlgEbook')) return;
    const d = document.createElement('dialog'); d.id = 'dlgEbook'; d.className = 'eb-dlg';
    d.innerHTML = `<div class="dlg-topo"><h2>📘 E-book KWIK</h2><button data-fechar aria-label="Fechar">×</button></div><div class="dlg-corpo" id="ebCorpo"></div>`;
    document.body.append(d);
    d.querySelector('[data-fechar]').addEventListener('click', () => d.close());
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
  }
  async function abrir(qual) {
    montar(); if (qual) aba = qual;
    const d = $('#dlgEbook'); if (!d.open) d.showModal();
    render(); await carregar(!dados); render();
  }
  function render() {
    const box = $('#ebCorpo'); if (!box) return;
    box.innerHTML = '';
    const ABAS = [['resumo', '📊 Resumo'], ['compradores', '👥 Compradores'], ['vendas', '🧾 Vendas'], ['links', '🔗 Página e links'], ['config', '⚙️ Configurar']];
    box.append(el('div', { class: 'eb-abas' }, ABAS.map(([k, t]) => el('button', { class: aba === k ? 'on' : '', onclick: () => { aba = k; render(); } }, t))));
    const at = dados && dados.atualizadoEm ? `Atualizado em ${fmtD(dados.atualizadoEm)} (a Kiwify é consultada a cada 2 horas).` : '';
    if (aba === 'links') return renderLinks(box);
    if (aba === 'config') return renderConfig(box);
    if (!dados || !dados.configurado) {
      box.append(el('div', { class: 'eb-aviso' }, el('b', {}, erro || (dados ? dados.aviso : 'Carregando…')), el('p', {}, 'Para o setor do e-book ver as vendas, o saldo e os compradores, ligue a API da Kiwify uma vez (leva 3 minutos).'),
        el('button', { class: 'bt prim peq', onclick: () => { aba = 'config'; render(); } }, '⚙️ Ver como ligar')));
      return;
    }
    const R = resumo(), c = cent();
    if (aba === 'resumo') {
      box.append(el('div', { class: 'eb-tiles' },
        tile('Vendeu hoje', String(R.hoje), reais(R.liqHoje, c)), tile('Últimos 7 dias', String(R.d7), reais(R.liq7, c)), tile('Últimos 30 dias', String(R.d30), reais(R.liq30, c)), tile('Total vendido', String(R.total), reais(R.liquido, c) + ' líquido'),
        tile('Saldo disponível', dados.saldo ? reais(dados.saldo.disponivel, c) : '—', 'para sacar na Kiwify', 'verde'), tile('Saldo a liberar', dados.saldo ? reais(dados.saldo.pendente, c) : '—', 'ainda pendente'),
        tile('Compradores', String(R.compradores), `ticket médio ${reais(R.ticket, c)}`), tile('Reembolsos', String(R.devolvidas), R.espera ? `${R.espera} aguardando pagamento` : 'nenhuma esperando', R.devolvidas ? 'mal' : '')));
      box.append(el('h4', { class: 'eb-h' }, 'Vendas por semana (últimas 8)'), grafico(R.semanas));
      if (dados.stats) box.append(el('p', { class: 'vazio' }, `Últimos 30 dias pela Kiwify: aprovação no cartão ${pct(dados.stats.credit_card_approval_rate)}, reembolso ${pct(dados.stats.refund_rate)}, boletos pagos ${dados.stats.total_boleto_paid ?? '—'} de ${dados.stats.total_boleto_generated ?? '—'}.`));
      box.append(el('p', { class: 'vazio' }, at));
    }
    if (aba === 'compradores' || aba === 'vendas') {
      const q = el('input', { type: 'search', placeholder: aba === 'compradores' ? 'Buscar por nome ou e-mail' : 'Buscar por nome, produto ou status', value: busca, oninput: e => { busca = e.target.value; lista(); } });
      const ul = el('div', { class: 'eb-lista' });
      box.append(q, ul, el('p', { class: 'vazio' }, at));
      const lista = () => {
        ul.innerHTML = ''; const b = busca.toLowerCase();
        let vs = vendas();
        if (aba === 'compradores') { // uma linha por pessoa, com quantas compras e quanto gastou
          const m = new Map();
          for (const v of vs.filter(x => OK.has(x.status))) { const k = (v.cliente && v.cliente.email) || v.id; const o = m.get(k) || { nome: v.cliente && v.cliente.nome, email: v.cliente && v.cliente.email, n: 0, total: 0, ultima: v.data }; o.n++; o.total += +v.liquido || 0; if (String(v.data) > String(o.ultima)) o.ultima = v.data; m.set(k, o); }
          const pessoas = [...m.values()].filter(o => !b || `${o.nome} ${o.email}`.toLowerCase().includes(b)).sort((x, y) => String(y.ultima).localeCompare(String(x.ultima)));
          if (!pessoas.length) ul.append(el('p', { class: 'vazio' }, 'Ninguém encontrado.'));
          for (const o of pessoas.slice(0, 300)) ul.append(el('div', { class: 'eb-item' }, el('div', {}, el('b', {}, o.nome || '(sem nome)'), el('small', {}, o.email || '')), el('div', { class: 'eb-dir' }, el('b', {}, reais(o.total, c)), el('small', {}, `${o.n} compra${o.n > 1 ? 's' : ''} · ${fmtD(o.ultima)}`))));
        } else {
          vs = vs.filter(v => !b || `${v.cliente && v.cliente.nome} ${v.cliente && v.cliente.email} ${v.produto} ${STATUS[v.status] || v.status}`.toLowerCase().includes(b));
          if (!vs.length) ul.append(el('p', { class: 'vazio' }, 'Nenhuma venda encontrada.'));
          for (const v of vs.slice(0, 300)) ul.append(el('div', { class: 'eb-item' }, el('div', {}, el('b', {}, (v.cliente && v.cliente.nome) || '(sem nome)'), el('small', {}, `${v.produto || 'E-book'} · ${METODO[v.metodo] || v.metodo || ''} · ${fmtD(v.data)}`)),
            el('div', { class: 'eb-dir' }, el('b', {}, reais(v.liquido, c)), el('span', { class: 'eb-st ' + (OK.has(v.status) ? 'ok' : DEVOLVIDA.has(v.status) ? 'mal' : 'esp') }, STATUS[v.status] || v.status))));
        }
      };
      lista();
    }
  }
  const pct = v => (v == null ? '—' : (v > 1 ? v.toFixed(1) : (v * 100).toFixed(1)) + '%');
  const tile = (rot, val, sub, cls) => el('div', { class: 'eb-tile ' + (cls || '') }, el('small', {}, rot), el('b', {}, val), el('span', {}, sub || ''));
  function grafico(semanas) {
    const cv = el('canvas', { width: 640, height: 150, class: 'eb-graf' }), g = cv.getContext('2d'), mx = Math.max(1, ...semanas);
    g.font = '700 12px Montserrat, sans-serif'; g.textAlign = 'center';
    semanas.forEach((v, i) => { const h = Math.round(110 * v / mx), x = 20 + i * 76; g.fillStyle = i === 7 ? '#28BE52' : '#9be3b0'; g.fillRect(x, 125 - h, 52, h); g.fillStyle = '#111A19'; g.fillText(String(v), x + 26, 118 - h); g.fillStyle = '#6b7774'; g.fillText(i === 7 ? 'esta' : `-${7 - i}`, x + 26, 143); });
    return cv;
  }
  function renderLinks(box) {
    box.append(el('div', { class: 'eb-links' },
      el('a', { class: 'eb-link', href: PAGINA, target: '_blank', rel: 'noopener' }, el('span', {}, '🛒'), el('div', {}, el('b', {}, 'Página de vendas'), el('small', {}, 'ebookkwik.my.canva.site'))),
      el('a', { class: 'eb-link', href: PAINEL, target: '_blank', rel: 'noopener' }, el('span', {}, '📊'), el('div', {}, el('b', {}, 'Painel da Kiwify'), el('small', {}, 'vendas, saques, cupons e afiliados (você entra com a sua conta)'))),
      el('button', { class: 'eb-link', onclick: async () => { try { await navigator.clipboard.writeText(PAGINA); A().toast('🔗 Link da página copiado'); } catch (e) { A().toast(PAGINA); } } }, el('span', {}, '📋'), el('div', {}, el('b', {}, 'Copiar o link da página'), el('small', {}, 'para mandar no WhatsApp ou colocar na bio')))));
  }
  function renderConfig(box) {
    const g = gh(), repo = g ? g.conf().repo : 'kauabreno88-spec/KWIK-MINI-ESCRITORIO';
    box.append(el('div', { class: 'passos', html: `<b>Ligar a Kiwify (uma vez só, sem usar a sua senha):</b><ol>
      <li>No <a href="${PAINEL}" target="_blank" rel="noopener">painel da Kiwify</a>, vá em <b>Apps → API → Criar API Key</b>. Copie o <i>client_id</i>, o <i>client_secret</i> e o <i>account_id</i> que aparecem.</li>
      <li>No GitHub, abra <a href="https://github.com/${repo}/settings/secrets/actions" target="_blank" rel="noopener">Settings → Secrets and variables → Actions</a> do repositório e crie três segredos: <b>KIWIFY_CLIENT_ID</b>, <b>KIWIFY_CLIENT_SECRET</b> e <b>KIWIFY_ACCOUNT_ID</b>.</li>
      <li>Abra a <a href="https://github.com/${repo}/actions/workflows/ebook.yml" target="_blank" rel="noopener">Action "E-book (Kiwify)"</a> e toque em <b>Run workflow</b>. Depois disso ela roda sozinha a cada 2 horas.</li></ol>
      <small>As chaves ficam guardadas no GitHub (o app não vê). Só nome, e-mail, data, produto e valores dos compradores vão para o arquivo, no repositório privado; CPF, telefone e endereço não.</small>` }),
    el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:12px' },
      el('button', { class: 'bt prim', onclick: atualizarAgora }, '🔄 Atualizar agora'),
      el('button', { class: 'bt', onclick: async () => { await carregar(true); render(); A().toast(dados && dados.configurado ? '📘 Vendas carregadas' : erro || 'Ainda sem dados'); } }, '📥 Recarregar dados')));
  }
  async function atualizarAgora() {
    const g = gh(); if (!g || !g.conf().token) return A().toast('Conecte o app ao GitHub primeiro (🔗 no topo).');
    try { await g.req('POST', '/actions/workflows/ebook.yml/dispatches', { ref: g.conf().branch || 'main' }); A().toast('🔄 Pedi para a Kiwify ser consultada agora. Em 1 ou 2 minutos toque em "Recarregar dados".', { ms: 8000 }); }
    catch (e) { window.open(`https://github.com/${g.conf().repo}/actions/workflows/ebook.yml`, '_blank', 'noopener'); A().toast('Abri a Action no GitHub: toque em "Run workflow" (o token do app não tem permissão de rodar Actions).', { ms: 9000 }); }
  }

  // ------------------------------------------------------------------ Luna trabalhando
  async function trabalhar(f, p) {
    const eu = (f.nome || 'Luna').split(' ')[0];
    A().falar(f.id, 'Vou conferir as vendas na Kiwify! 📘', 2600);
    if (p) { p.digitando = true; p.trabalhando = true; A().atualizarBotoes(); }
    await carregar(true);
    if (p) { p.digitando = false; p.trabalhando = false; A().atualizarBotoes(); }
    if (dados && dados.configurado) { const R = resumo(); A().falar(f.id, R.hoje ? `Hoje já vendemos ${R.hoje}! 🎉` : `Nos últimos 7 dias foram ${R.d7} vendas 📈`, 3600); }
    else A().falar(f.id, 'Preciso que você ligue a Kiwify para eu ver as vendas 🔑', 3600);
    abrir(dados && dados.configurado ? 'resumo' : 'config');
    if (A().registrar) A().registrar(f.id, '📘', `${eu} conferiu as vendas do e-book`);
  }
  function iniciar() {
    const tenta = () => { const g = gh(); if (g && g.conf().token) carregar(); };
    setTimeout(tenta, 4000); setInterval(tenta, 30 * 60000);
  }
  Object.assign(KM.ebook, { iniciar, abrir, trabalhar, carregar, resumoParede, _dados: () => dados });
})();
