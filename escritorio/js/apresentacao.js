/* KWIK Mini Escritório · Sala de Apresentação.
   Toque na sala: o app pede o cliente, o tipo e o contexto da apresentação. Se for uma proposta, a Dona Iva orienta o preço
   (mesmo motor da Precificação: serviço, quantidade e situação do cliente) e o valor entra no slide de investimento.
   Os slides são desenhados no estilo da KWIK (Montserrat Black, palavra-chave na caixa verde, etiqueta verde com >>>,
   fundo grafite com barras subindo, fundo branco pontilhado e fundo verde), em 16:9. Dá para apresentar em tela cheia,
   baixar em PDF e compartilhar. Tudo fica nos Relatórios. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  const el = (...a) => A().el(...a);
  const VERDE = '#28BE52', VERDE_ESC = '#1E8A45', GRAFITE = '#111A19', NEVOA = '#F1F4F2';
  const W = 1920, H = 1080;
  const brl0 = v => 'R$ ' + Math.round(+v || 0).toLocaleString('pt-BR');
  const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const hojeTxt = (d = new Date()) => `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
  const dataBr = d => d.toLocaleDateString('pt-BR');

  const TIPOS = {
    proposta: { ic: '💼', nome: 'Proposta comercial', tag: 'PROPOSTA COMERCIAL', desc: 'Para fechar com um cliente novo. A Dona Iva ajuda com o preço.' },
    institucional: { ic: '🏢', nome: 'Apresentação da KWIK', tag: 'CONHEÇA A KWIK', desc: 'Quem somos, o que fazemos e como trabalhamos.' },
    resultados: { ic: '📊', nome: 'Reunião de resultados', tag: 'REUNIÃO DE RESULTADOS', desc: 'Os números do cliente (impostos, folha, certificado) e os próximos passos.' },
    tema: { ic: '🎓', nome: 'Explicar um tema', tag: 'ENTENDA', desc: 'Ex.: Reforma Tributária, MEI, folha, abertura de empresa.' },
  };
  const SERVICOS = [
    [/abr(ir|ertura)|cnpj|empresa nova|formaliz/i, '🗂️', 'Abertura de empresa', 'Do CNPJ às primeiras guias, sem burocracia.'],
    [/\bmei\b|microempreendedor/i, '🧾', 'Gestão do MEI', 'DAS em dia e declaração anual sem susto.'],
    [/folha|funcion|empregad|esocial|departamento pessoal|\bdp\b|f[ée]rias|rescis/i, '👥', 'Departamento pessoal', 'Folha, eSocial, FGTS Digital e admissões.'],
    [/impost|fiscal|nota|simples|\bdas\b|guia|tribut/i, '🧾', 'Fiscal e impostos', 'Guias certas e no prazo, sem multa.'],
    [/bpo|financeir|contas a pagar|fluxo de caixa|cobran|concilia/i, '📈', 'BPO financeiro', 'Contas a pagar e a receber, fluxo de caixa e conciliação.'],
    [/imposto de renda|irpf|declara[cç][aã]o/i, '📄', 'Imposto de Renda', 'Declaração completa, sem cair na malha.'],
    [/reforma|\bibs\b|\bcbs\b|split/i, '⚖️', 'Reforma Tributária', 'IBS e CBS explicados e o cadastro revisado.'],
    [/planejamento|economi|pagar menos|reduzir|regime/i, '💡', 'Planejamento tributário', 'O regime certo para pagar só o necessário.'],
    [/contab|balan[cç]o|balancete|dre\b/i, '📚', 'Contabilidade completa', 'Balanço, DRE e relatórios para decidir melhor.'],
  ];
  const PADRAO_SERV = ['Contabilidade completa', 'Fiscal e impostos', 'Departamento pessoal', 'Planejamento tributário'];
  const servicosDe = (texto, itens) => {
    const raiz = t => String(t).toLowerCase().split(/[\s(·]+/).slice(0, 2).join(' ');
    let achados = SERVICOS.filter(([re]) => re.test(texto || '')).map(([, ic, t, d]) => ({ ic, t, d }));
    for (const it of (itens || []).slice().reverse()) {
      const igual = achados.find(x => raiz(x.t) === raiz(it.servico) || raiz(it.servico).startsWith(raiz(x.t)));
      if (igual) { igual.t = it.servico; continue; }
      achados.unshift({ ic: '💼', t: it.servico, d: 'Incluído nesta proposta' });
    }
    for (const t of PADRAO_SERV) if (achados.length < 4 && !achados.some(x => x.t === t)) { const s = SERVICOS.find(x => x[2] === t); achados.push({ ic: s[1], t: s[2], d: s[3] }); }
    return achados.slice(0, 6);
  };
  const frases = texto => String(texto || '').split(/(?<=[.!?;])\s+|\n+/).map(s => s.trim().replace(/[.;]+$/, '')).filter(s => s.length > 3)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1)).map(s => (s.length > 120 ? s.slice(0, 117).replace(/\s+\S*$/, '') + '…' : s));

  // ------------------------------------------------------------------ dados do cliente (para a reunião de resultados)
  function dadosCliente(nome) {
    try {
      const cs = KM.clientesFora.lista(), n = String(nome || '').toLowerCase();
      const c = cs.find(x => [x.nome, x.razao, x.fantasia].filter(Boolean).some(v => v.toLowerCase() === n)) || cs.find(x => n && [x.nome, x.razao].filter(Boolean).some(v => v.toLowerCase().includes(n) || n.includes(v.toLowerCase())));
      if (!c) return null;
      const out = { nome: c.nome, cnpj: c.cnpj, regime: c.regime };
      const fis = KM.setores.dados('fiscal'), fol = KM.setores.dados('folha');
      if (fis && c.fiscalId) { const r = KM.setores.resumoFiscal(fis.db).porEmp.find(x => x.e.id === c.fiscalId); if (r) out.fiscal = { vencido: r.vencido, aVencer: r.aVencer, pago: r.pago, qVencido: r.qVencido }; }
      if (fol && c.folhaId) { const r = KM.setores.resumoFolha(fol.db).porEmp.find(x => x.e.id === c.folhaId); if (r) out.folha = { ativos: r.ativos, feitas: r.feitas, total: r.total }; }
      if (c.info && c.info.cert && c.info.cert.validade) out.cert = c.info.cert.validade;
      if (c.valor) out.valor = c.valor;
      return out;
    } catch (e) { return null; }
  }

  // ------------------------------------------------------------------ montar os slides
  function montarDeck(d) {
    const T = TIPOS[d.tipo] || TIPOS.proposta, fr = frases(d.contexto), serv = servicosDe(d.contexto, d.itens);
    const s = [];
    const capaTit = d.tipo === 'proposta' ? `Proposta para *${d.cliente || 'você'}*` : d.tipo === 'resultados' ? `Seus números, *${d.cliente || 'cliente'}*` : d.tipo === 'tema' ? (d.tema ? `Entenda: *${d.tema}*` : 'Entenda o *tema* de hoje') : `Prazer, somos a *KWIK*`;
    s.push({ k: 'capa', fundo: 'grafite', tag: T.tag, titulo: capaTit, sub: d.tipo === 'institucional' && d.cliente ? `Apresentação para ${d.cliente}` : 'Contabilidade | BPO | Consultoria' });
    if (d.tipo === 'resultados') {
      s.push({ k: 'numeros', fundo: 'branco', tag: 'SEUS NÚMEROS', titulo: 'Como está a *empresa* hoje', dados: d.dados || null });
      s.push({ k: 'lista', fundo: 'nevoa', tag: 'PONTOS DE ATENÇÃO', titulo: 'O que vamos *acompanhar*', itens: fr.length ? fr.slice(0, 5) : ['Guias do mês no prazo', 'Folha fechada até o dia 15', 'Certificado digital válido', 'Notas fiscais conferidas'] });
      s.push({ k: 'servicos', fundo: 'grafite', tag: 'PRÓXIMOS PASSOS', titulo: 'O que a *KWIK* faz por você', serv });
    } else if (d.tipo === 'tema') {
      const base = fr.length ? fr : ['Explique aqui o tema com suas palavras'];
      for (let i = 0; i < base.length && i < 12; i += 4) s.push({ k: 'lista', fundo: i % 8 ? 'nevoa' : 'branco', tag: 'ENTENDA', titulo: i ? 'E tem *mais*' : (d.tema ? `O que muda com *${d.tema}*` : 'O que você *precisa saber*'), itens: base.slice(i, i + 4) });
      s.push({ k: 'sobre', fundo: 'verde' });
    } else {
      if (fr.length) s.push({ k: 'lista', fundo: 'branco', tag: d.tipo === 'proposta' ? 'O SEU MOMENTO' : 'CONTEXTO', titulo: d.tipo === 'proposta' ? 'Entendemos o que *você precisa*' : 'Por que estamos *aqui*', itens: fr.slice(0, 5) });
      s.push({ k: 'sobre', fundo: 'verde' });
      s.push({ k: 'servicos', fundo: 'grafite', tag: 'O QUE FAZEMOS', titulo: 'O que vamos fazer *por você*', serv });
    }
    if (d.tipo === 'proposta' && d.itens && d.itens.length) s.push({ k: 'investimento', fundo: 'branco', tag: 'INVESTIMENTO', titulo: 'Quanto *investir*', itens: d.itens });
    if (d.tipo !== 'tema') s.push({ k: 'passos', fundo: 'grafite', tag: 'COMO COMEÇAMOS', titulo: 'Simples assim, em *4 passos*' });
    s.push({ k: 'cta', fundo: 'verde', validade: d.tipo === 'proposta' ? dataBr(new Date(Date.now() + 15 * 864e5)) : '' });
    return s;
  }

  // ------------------------------------------------------------------ desenho
  const logo = new Image(); logo.src = 'assets/kwik-simbolo.svg';
  const prontoLogo = () => new Promise(r => (logo.complete && logo.naturalWidth ? r() : (logo.onload = logo.onerror = () => r())));
  function rr(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
  const TEMA = {
    grafite: { fundo: GRAFITE, cor: '#ffffff', suave: '#a9b8b4', caixa: VERDE, sobre: GRAFITE, card: '#1b2725', pill: VERDE, pillTxt: GRAFITE },
    branco: { fundo: '#ffffff', cor: GRAFITE, suave: '#4a5754', caixa: VERDE, sobre: GRAFITE, card: '#ffffff', pill: VERDE, pillTxt: GRAFITE },
    nevoa: { fundo: NEVOA, cor: GRAFITE, suave: '#4a5754', caixa: VERDE, sobre: GRAFITE, card: '#ffffff', pill: GRAFITE, pillTxt: VERDE },
    verde: { fundo: VERDE, cor: GRAFITE, suave: '#0f3d22', caixa: GRAFITE, sobre: VERDE, card: '#e9fbef', pill: GRAFITE, pillTxt: VERDE },
  };
  function fundo(g, t, k) {
    g.fillStyle = t.fundo; g.fillRect(0, 0, W, H);
    if (t === TEMA.branco || t === TEMA.nevoa) { g.fillStyle = 'rgba(17,26,25,.07)'; for (let y = 30; y < H; y += 40) for (let x = 30; x < W; x += 40) { g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); } }
    if (t === TEMA.grafite) { // barras subindo (como no Instagram)
      const bs = [[1500, 760, 70], [1600, 640, 70], [1700, 500, 70], [1800, 360, 70]];
      for (const [x, y, w] of bs) { const gr = g.createLinearGradient(0, y, 0, H); gr.addColorStop(0, 'rgba(40,190,82,.30)'); gr.addColorStop(1, 'rgba(40,190,82,.02)'); g.fillStyle = gr; g.fillRect(x, y, w, H - y); }
      g.strokeStyle = 'rgba(40,190,82,.5)'; g.lineWidth = 6; g.beginPath(); g.moveTo(1460, 820); g.lineTo(1580, 700); g.lineTo(1680, 760); g.lineTo(1860, 420); g.stroke();
    }
    if (t === TEMA.verde) { g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.arc(W - 160, 140, 380, 0, 7); g.fill(); g.beginPath(); g.arc(120, H - 60, 260, 0, 7); g.fill(); }
  }
  function etiqueta(g, t, x, y, txt) {
    g.font = '800 30px Montserrat'; const w = g.measureText(txt).width + 120;
    g.fillStyle = t.pill; rr(g, x, y, w, 58, 29); g.fill();
    g.fillStyle = t.pillTxt; g.textBaseline = 'middle'; g.fillText(txt, x + 30, y + 30);
    g.font = '900 30px Montserrat'; g.fillText('>>>', x + w - 78, y + 30); g.textBaseline = 'alphabetic';
  }
  // título com *palavras* destacadas numa caixa (verde no fundo escuro/claro; grafite no fundo verde)
  function titulo(g, t, txt, x, y, tam, maxW) {
    g.font = `900 ${tam}px Montserrat`;
    const pedacos = []; String(txt).split(/(\*[^*]+\*)/).filter(Boolean).forEach(p => { const dest = /^\*.*\*$/.test(p); for (const w of p.replace(/\*/g, '').split(/(\s+)/)) if (w) pedacos.push({ w, dest }); });
    const linhas = [[]]; let lw = 0;
    for (const p of pedacos) { const pw = g.measureText(p.w).width; if (lw + pw > maxW && linhas.at(-1).length && p.w.trim()) { linhas.push([]); lw = 0; if (!p.w.trim()) continue; } linhas.at(-1).push({ ...p, pw }); lw += pw; }
    const lh = tam * 1.12;
    linhas.forEach((ln, i) => {
      let cx = x; const by = y + i * lh;
      for (let j = 0; j < ln.length; j++) {
        const p = ln[j];
        if (p.dest && p.w.trim()) { // junta palavras destacadas seguidas numa caixa só
          let k = j, w = 0; while (k < ln.length && ln[k].dest) { w += ln[k].pw; k++; }
          while (k > j && !ln[k - 1].w.trim()) { w -= ln[k - 1].pw; k--; }
          g.fillStyle = t.caixa; rr(g, cx - 14, by - tam * 0.86, w + 28, tam * 1.06, 14); g.fill();
          g.fillStyle = t.sobre; for (let q = j; q < k; q++) { g.fillText(ln[q].w, cx, by); cx += ln[q].pw; } j = k - 1; continue;
        }
        g.fillStyle = t.cor; g.fillText(p.w, cx, by); cx += p.pw;
      }
    });
    return y + linhas.length * lh;
  }
  function quebrar(g, txt, maxW) { const ws = String(txt).split(/\s+/), out = []; let l = ''; for (const w of ws) { const t2 = l ? l + ' ' + w : w; if (g.measureText(t2).width > maxW && l) { out.push(l); l = w; } else l = t2; } if (l) out.push(l); return out; }
  function rodape(g, t, n, total, d) {
    if (logo.naturalWidth) g.drawImage(logo, 80, H - 112, 52, 52);
    g.font = '800 26px Montserrat'; g.fillStyle = t.cor; g.fillText('KWIK', 146, H - 76); g.font = '600 20px Montserrat'; g.fillStyle = t.suave; g.fillText('Contabilidade · BPO · Consultoria', 146, H - 50);
    g.textAlign = 'right'; g.font = '700 22px Montserrat'; g.fillText(`${d.cliente ? d.cliente + ' · ' : ''}${n}/${total}`, W - 80, H - 60); g.textAlign = 'left';
  }
  function icCheck(g, x, y, cor, fundoC) { g.fillStyle = cor; g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill(); g.strokeStyle = fundoC; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 10, y + 1); g.lineTo(x - 2, y + 9); g.lineTo(x + 11, y - 8); g.stroke(); }
  function desenharSlide(g, sl, d, n, total) {
    const t = TEMA[sl.fundo] || TEMA.branco;
    g.save(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    fundo(g, t, sl.k);
    const X = 110;
    if (sl.k === 'capa') {
      etiqueta(g, t, X, 150, sl.tag);
      const y = titulo(g, t, sl.titulo, X + 14, 380, 120, 1250);
      g.font = '700 40px Montserrat'; g.fillStyle = t.suave; g.fillText(sl.sub, X, y + 40);
      g.font = '800 30px Montserrat'; g.fillStyle = VERDE; g.fillText(hojeTxt(new Date(d.criadoEm || Date.now())), X, H - 190);
      if (d.apresentador) { g.font = '600 28px Montserrat'; g.fillStyle = t.suave; g.fillText(`Com ${d.apresentador}`, X, H - 150); }
    } else if (sl.k === 'lista') {
      etiqueta(g, t, X, 110, sl.tag);
      let y = titulo(g, t, sl.titulo, X + 14, 300, 92, 1500) + 30;
      g.font = '600 40px Montserrat';
      for (const it of sl.itens) {
        const ls = quebrar(g, it, 1480);
        g.fillStyle = t === TEMA.verde ? GRAFITE : '#ffffff'; rr(g, X, y - 50, 1640, ls.length * 52 + 46, 22); g.fill();
        if (t !== TEMA.verde) { g.strokeStyle = 'rgba(17,26,25,.10)'; g.lineWidth = 2; g.stroke(); }
        icCheck(g, X + 52, y - 50 + (ls.length * 52 + 46) / 2, VERDE, t === TEMA.verde ? GRAFITE : '#ffffff');
        g.fillStyle = t === TEMA.verde ? '#ffffff' : GRAFITE; ls.forEach((l, i) => g.fillText(l, X + 100, y + i * 52));
        y += ls.length * 52 + 70; if (y > H - 170) break;
      }
    } else if (sl.k === 'sobre') {
      g.font = '800 30px Montserrat'; g.fillStyle = GRAFITE; g.fillText('QUEM SOMOS', X, 170);
      let y = titulo(g, t, 'Sua empresa no *controle*, sem dor de cabeça.', X + 14, 330, 100, 1500);
      const cards = [['📚', 'Contabilidade', 'Balanço, impostos e obrigações em dia.'], ['📈', 'BPO financeiro', 'Contas, fluxo de caixa e conciliação.'], ['💡', 'Consultoria', 'Planejamento e decisões com números.']];
      cards.forEach(([ic, a, b], i) => {
        const cx = X + i * 560, cy = y + 30;
        g.fillStyle = GRAFITE; rr(g, cx, cy, 520, 280, 28); g.fill();
        g.font = '60px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'; g.fillText(ic, cx + 36, cy + 92);
        g.font = '900 44px Montserrat'; g.fillStyle = '#ffffff'; g.fillText(a, cx + 36, cy + 170);
        g.font = '600 28px Montserrat'; g.fillStyle = '#b8c6c2'; quebrar(g, b, 450).forEach((l, k) => g.fillText(l, cx + 36, cy + 216 + k * 34));
      });
      const n2 = (() => { try { return KM.clientesFora.lista().length; } catch (e) { return 0; } })();
      g.font = '800 30px Montserrat'; g.fillStyle = GRAFITE;
      g.fillText(`${n2 ? `+${n2} empresas atendidas · ` : ''}Atendimento direto pelo WhatsApp · São Luís-MA`, X, H - 180);
    } else if (sl.k === 'servicos') {
      etiqueta(g, t, X, 110, sl.tag);
      titulo(g, t, sl.titulo, X + 14, 300, 88, 1500);
      const cols = 3, cw = 540, ch = 230;
      sl.serv.forEach((sv, i) => {
        const cx = X + (i % cols) * (cw + 30), cy = 380 + Math.floor(i / cols) * (ch + 30);
        g.fillStyle = t.card; rr(g, cx, cy, cw, ch, 26); g.fill(); g.strokeStyle = 'rgba(40,190,82,.45)'; g.lineWidth = 2; g.stroke();
        g.font = '52px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'; g.fillStyle = '#fff'; g.fillText(sv.ic, cx + 30, cy + 78);
        g.font = '900 34px Montserrat'; g.fillStyle = t.cor; const lt = quebrar(g, sv.t, cw - 60).slice(0, 2); lt.forEach((l, k) => g.fillText(l, cx + 30, cy + 128 + k * 38));
        g.font = '600 24px Montserrat'; g.fillStyle = t.suave; quebrar(g, sv.d || '', cw - 60).slice(0, lt.length > 1 ? 1 : 2).forEach((l, k) => g.fillText(l, cx + 30, cy + 170 + (lt.length - 1) * 38 + k * 28));
      });
    } else if (sl.k === 'investimento') {
      etiqueta(g, t, X, 110, sl.tag);
      titulo(g, t, sl.titulo, X + 14, 290, 88, 1500);
      const its = sl.itens.slice(0, 3), cw = its.length === 1 ? 1700 : its.length === 2 ? 830 : 545;
      its.forEach((it, i) => {
        const cx = X + i * (cw + 30), cy = 360, ch = 560;
        g.fillStyle = '#ffffff'; rr(g, cx, cy, cw, ch, 28); g.fill(); g.strokeStyle = 'rgba(17,26,25,.12)'; g.lineWidth = 2; g.stroke();
        g.font = '900 38px Montserrat'; g.fillStyle = GRAFITE; quebrar(g, it.servico, cw - 80).slice(0, 2).forEach((l, k) => g.fillText(l, cx + 40, cy + 70 + k * 44));
        g.font = '600 26px Montserrat'; g.fillStyle = '#4a5754'; g.fillText(`${it.qtd > 1 ? `Quantidade: ${it.qtd} · ` : ''}valor ${it.unid || ''}`, cx + 40, cy + 160);
        // preço na caixa verde
        g.font = `900 ${its.length === 1 ? 120 : 84}px Montserrat`; const pt = brl0(it.final), pw = g.measureText(pt).width;
        g.fillStyle = VERDE; rr(g, cx + 30, cy + 190, pw + 40, its.length === 1 ? 150 : 112, 18); g.fill(); g.fillStyle = GRAFITE; g.fillText(pt, cx + 50, cy + (its.length === 1 ? 310 : 276));
        g.font = '700 28px Montserrat'; g.fillStyle = GRAFITE;
        const parc = it.parcelas > 1 ? `ou ${it.parcelas}x de ${brl0(Math.ceil(it.final / it.parcelas))}` : (/m[eê]s/.test(it.unid || '') ? 'por mês, sem taxa de adesão' : 'pagamento à vista');
        g.fillText(parc, cx + 40, cy + (its.length === 1 ? 390 : 350));
        if (it.mercado && it.mercado.max > it.mercado.min) { // régua do mercado de São Luís
          const rx = cx + 40, ry = cy + ch - 110, rw = cw - 80, k = Math.max(0, Math.min(1, (it.final - it.mercado.min) / (it.mercado.max - it.mercado.min)));
          g.fillStyle = '#e9ecef'; rr(g, rx, ry, rw, 16, 8); g.fill();
          const gr = g.createLinearGradient(rx, 0, rx + rw, 0); gr.addColorStop(0, '#b2f2bb'); gr.addColorStop(1, '#ffc9c9'); g.fillStyle = gr; rr(g, rx, ry, rw, 16, 8); g.fill();
          g.fillStyle = GRAFITE; g.beginPath(); g.arc(rx + rw * k, ry + 8, 16, 0, 7); g.fill(); g.fillStyle = VERDE; g.beginPath(); g.arc(rx + rw * k, ry + 8, 9, 0, 7); g.fill();
          g.font = '600 22px Montserrat'; g.fillStyle = '#4a5754'; g.fillText(brl0(it.mercado.min), rx, ry + 52); g.textAlign = 'right'; g.fillText(brl0(it.mercado.max), rx + rw, ry + 52); g.textAlign = 'left';
          g.font = '800 22px Montserrat'; g.fillStyle = GRAFITE; g.fillText('Mercado em São Luís', rx, ry - 18);
        } else if (it.ajustes && it.ajustes.length) {
          g.font = '600 24px Montserrat'; g.fillStyle = '#4a5754';
          it.ajustes.filter(a => a[1]).slice(0, 3).forEach((a, k) => g.fillText(`${a[1] < 0 ? '✓ ' : '• '}${a[0]}`, cx + 40, cy + ch - 120 + k * 34));
        }
      });
      g.font = '700 26px Montserrat'; g.fillStyle = '#4a5754'; g.fillText('Valores sugeridos pela nossa precificação, de acordo com o serviço e a sua situação.', X, H - 160);
    } else if (sl.k === 'passos') {
      etiqueta(g, t, X, 110, sl.tag);
      titulo(g, t, sl.titulo, X + 14, 300, 92, 1500);
      const ps = [['Conversa', 'Entendemos sua empresa e o que você precisa.'], ['Documentos', 'Você envia tudo pelo WhatsApp, sem sair de casa.'], ['Implantação', 'Organizamos impostos, folha e cadastros.'], ['Acompanhamento', 'Todo mês: guias no prazo e relatório simples.']];
      g.strokeStyle = 'rgba(40,190,82,.6)'; g.lineWidth = 6; g.beginPath(); g.moveTo(X + 60, 520); g.lineTo(X + 60 + 3 * 430, 520); g.stroke();
      ps.forEach(([a, b], i) => {
        const cx = X + 60 + i * 430;
        g.fillStyle = VERDE; g.beginPath(); g.arc(cx, 520, 54, 0, 7); g.fill();
        g.font = '900 52px Montserrat'; g.fillStyle = GRAFITE; g.textAlign = 'center'; g.fillText(String(i + 1), cx, 538); g.textAlign = 'left';
        g.font = '900 40px Montserrat'; g.fillStyle = '#ffffff'; g.fillText(a, cx - 54, 650);
        g.font = '600 27px Montserrat'; g.fillStyle = '#b8c6c2'; quebrar(g, b, 360).forEach((l, k) => g.fillText(l, cx - 54, 700 + k * 36));
      });
    } else if (sl.k === 'numeros') {
      etiqueta(g, t, X, 110, sl.tag);
      titulo(g, t, sl.titulo, X + 14, 300, 92, 1500);
      const dd = sl.dados || {}, cards = [];
      if (dd.fiscal) { cards.push(['🧾', 'Impostos pagos', brl0(dd.fiscal.pago), 'bem']); cards.push(['⏳', 'A vencer', brl0(dd.fiscal.aVencer), '']); cards.push(['🔴', 'Vencido', brl0(dd.fiscal.vencido), dd.fiscal.qVencido ? 'mal' : 'bem']); }
      if (dd.folha) { cards.push(['👥', 'Pessoas na folha', String(dd.folha.ativos), '']); cards.push(['✅', 'Fechamento do mês', `${dd.folha.feitas}/${dd.folha.total} etapas`, dd.folha.feitas === dd.folha.total ? 'bem' : '']); }
      if (dd.cert) cards.push(['📜', 'Certificado digital', `até ${dd.cert.split('-').reverse().join('/')}`, '']);
      if (dd.regime) cards.push(['🏛️', 'Regime', dd.regime, '']);
      if (!cards.length) { g.font = '600 36px Montserrat'; g.fillStyle = '#4a5754'; g.fillText('Abra os setores Fiscal e Folha (ou cadastre o cliente) para os números aparecerem aqui.', X, 460); }
      cards.slice(0, 6).forEach(([ic, a, v, cls], i) => {
        const cx = X + (i % 3) * 570, cy = 380 + Math.floor(i / 3) * 280;
        g.fillStyle = '#ffffff'; rr(g, cx, cy, 540, 250, 26); g.fill(); g.strokeStyle = cls === 'mal' ? '#ff8787' : cls === 'bem' ? 'rgba(40,190,82,.6)' : 'rgba(17,26,25,.12)'; g.lineWidth = 3; g.stroke();
        g.font = '48px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'; g.fillText(ic, cx + 30, cy + 74);
        g.font = '700 28px Montserrat'; g.fillStyle = '#4a5754'; g.fillText(a, cx + 30, cy + 130);
        g.font = '900 54px Montserrat'; g.fillStyle = cls === 'mal' ? '#c92a2a' : GRAFITE; g.fillText(v, cx + 30, cy + 200);
      });
    } else if (sl.k === 'cta') {
      g.font = '800 34px Montserrat'; g.fillStyle = GRAFITE; g.fillText('PRÓXIMO PASSO', X, 200);
      const y = titulo(g, t, 'Vamos *começar*?', X + 14, 400, 170, 1600);
      const zap = A().cfg().marketing && A().cfg().marketing.whats ? A().cfg().marketing.whats.replace(/\D/g, '') : '98988663080';
      const fone = zap.length >= 10 ? `(${zap.slice(0, 2)}) ${zap.slice(2, zap.length - 4)}-${zap.slice(-4)}` : zap;
      g.fillStyle = GRAFITE; rr(g, X, y + 20, 900, 110, 55); g.fill();
      g.font = '900 52px Montserrat'; g.fillStyle = VERDE; g.fillText(`WhatsApp ${fone}`, X + 50, y + 94);
      g.font = '800 40px Montserrat'; g.fillStyle = GRAFITE; g.fillText('@kwik_contabilidade', X, y + 200);
      if (sl.validade) { g.font = '700 30px Montserrat'; g.fillText(`Proposta válida até ${sl.validade}.`, X, y + 260); }
    }
    rodape(g, t, n, total, d);
    g.restore();
  }

  // ------------------------------------------------------------------ PDF (feito à mão: uma imagem JPEG por página)
  async function pdf(d, slides) {
    const enc = new TextEncoder(), partes = [], offs = []; let pos = 0;
    const push = x => { const b = typeof x === 'string' ? enc.encode(x) : x; partes.push(b); pos += b.length; };
    const cv = KM.tela(W, H), g = cv.getContext('2d');
    const imgs = [];
    for (let i = 0; i < slides.length; i++) {
      desenharSlide(g, slides[i], d, i + 1, slides.length);
      const b = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.9));
      imgs.push(new Uint8Array(await b.arrayBuffer()));
    }
    push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
    const obj = (id, corpo) => { offs[id] = pos; push(`${id} 0 obj\n`); corpo(); push('\nendobj\n'); };
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push(`<< /Type /Pages /Kids [${imgs.map((_, i) => `${3 + 3 * i} 0 R`).join(' ')}] /Count ${imgs.length} >>`));
    const PW = 960, PH = 540;
    imgs.forEach((im, i) => {
      const P = 3 + 3 * i, C = P + 1, I = P + 2, cs = `q ${PW} 0 0 ${PH} 0 0 cm /Im${i} Do Q`;
      obj(P, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im${i} ${I} 0 R >> >> /Contents ${C} 0 R >>`));
      obj(C, () => { push(`<< /Length ${cs.length} >>\nstream\n`); push(cs); push('\nendstream'); });
      obj(I, () => { push(`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.length} >>\nstream\n`); push(im); push('\nendstream'); });
    });
    const total = 3 + 3 * imgs.length, xref = pos;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let k = 1; k < total; k++) x += String(offs[k]).padStart(10, '0') + ' 00000 n \n';
    push(x); push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(partes, { type: 'application/pdf' });
  }
  const nomeArquivo = d => `KWIK - ${TIPOS[d.tipo] ? TIPOS[d.tipo].nome : 'Apresentação'}${d.cliente ? ' - ' + d.cliente : ''}.pdf`.replace(/[\\/:*?"<>|]/g, '');
  async function baixarPdf(d, slides, bt) {
    const txt = bt && bt.textContent; if (bt) { bt.disabled = true; bt.textContent = 'Gerando o PDF…'; }
    try {
      await KM.marketing.prepararFontes(); await prontoLogo();
      const blob = await pdf(d, slides), nome = nomeArquivo(d);
      const arq = new File([blob], nome, { type: 'application/pdf' });
      if (window.matchMedia('(max-width: 760px)').matches && navigator.canShare && navigator.canShare({ files: [arq] })) await navigator.share({ files: [arq], title: nome }).catch(() => {});
      else { const a = el('a', { href: URL.createObjectURL(blob), download: nome }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); }
    } catch (e) { A().toast('Não consegui gerar o PDF: ' + e.message, { erro: true }); }
    if (bt) { bt.disabled = false; bt.textContent = txt; }
  }

  // ------------------------------------------------------------------ visualizador (no relatório e no diálogo)
  function visualizador(d, box) {
    const slides = d.slides || montarDeck(d);
    let i = 0;
    const cv = el('canvas', { width: W, height: H, class: 'ap-slide' }), g = cv.getContext('2d');
    const num = el('span', { class: 'ap-num' });
    const thumbs = el('div', { class: 'ap-thumbs' });
    const ir = k => { i = Math.max(0, Math.min(slides.length - 1, k)); desenharSlide(g, slides[i], d, i + 1, slides.length); num.textContent = `${i + 1} / ${slides.length}`; thumbs.querySelectorAll('canvas').forEach((c, j) => c.classList.toggle('on', j === i)); };
    const palco = el('div', { class: 'ap-palco' }, cv,
      el('button', { class: 'ap-seta esq', title: 'Anterior', onclick: () => ir(i - 1) }, '‹'), el('button', { class: 'ap-seta dir', title: 'Próximo', onclick: () => ir(i + 1) }, '›'));
    cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(); ir(e.clientX - r.left < r.width / 3 ? i - 1 : i + 1); });
    palco.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === ' ') ir(i + 1); if (e.key === 'ArrowLeft') ir(i - 1); });
    palco.tabIndex = 0;
    const btPdf = el('button', { class: 'bt prim', onclick: e => baixarPdf(d, slides, e.currentTarget) }, '⬇️ Baixar PDF');
    box.append(palco,
      el('div', { class: 'ap-barra' }, num,
        el('button', { class: 'bt', onclick: () => { (palco.requestFullscreen || palco.webkitRequestFullscreen || (() => {})).call(palco); palco.focus(); } }, '▶ Apresentar em tela cheia'), btPdf),
      thumbs);
    KM.marketing.prepararFontes().then(prontoLogo).then(() => {
      slides.forEach((s, j) => { const t = el('canvas', { width: 320, height: 180, title: `Slide ${j + 1}`, onclick: () => ir(j) }); const c2 = KM.tela(W, H); desenharSlide(c2.getContext('2d'), s, d, j + 1, slides.length); t.getContext('2d').drawImage(c2, 0, 0, 320, 180); thumbs.append(t); });
      ir(0);
    });
    return { ir };
  }
  function renderRel(r, box) {
    const d = r.deck || {};
    box.append(el('p', { class: 'vazio', style: 'margin-top:0' }, `${TIPOS[d.tipo] ? TIPOS[d.tipo].ic + ' ' + TIPOS[d.tipo].nome : 'Apresentação'}${d.cliente ? ' para ' + d.cliente : ''} · ${(d.slides || []).length} slides · criada em ${new Date(r.criadoEm).toLocaleString('pt-BR')}`));
    visualizador(d, box);
    if (d.itens && d.itens.length) box.append(el('div', { class: 'ap-iva' }, el('b', {}, '💜 Preço orientado pela Dona Iva'), el('ul', {}, d.itens.map(it => el('li', {}, `${it.servico}: ${brl0(it.final)}${it.parcelas > 1 ? ` (até ${it.parcelas}x)` : ''}${it.mensagem ? '' : ''}`)))));
    if (d.contexto) box.append(el('details', { class: 'ap-ctx' }, el('summary', {}, '📝 Contexto que você escreveu'), el('p', {}, d.contexto)));
  }

  // ------------------------------------------------------------------ diálogo: cliente, tipo, contexto e preço
  let estadoForm = null;
  function montarDlg() {
    let d = $('#dlgApres');
    if (d) return d;
    d = el('dialog', { id: 'dlgApres', class: 'ap-dlg' });
    document.body.append(d);
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    return d;
  }
  function nomesClientes() {
    const s = new Set();
    try { for (const c of KM.clientesFora.lista()) if (c.nome) s.add(c.nome); } catch (e) { /* ok */ }
    for (const c of A().cfg().clientes || []) if (c.nome) s.add(c.nome);
    return [...s];
  }
  function abrir() {
    const d = montarDlg(), iva = ((A().cfg().funcionarios || []).find(f => f.funcao === 'precificacao') || {}).nome || 'Dona Iva';
    estadoForm = estadoForm || { tipo: 'proposta', itens: [] };
    const st = estadoForm;
    d.innerHTML = '';
    const lista = el('datalist', { id: 'apClientes' }, nomesClientes().map(n => el('option', { value: n })));
    const inCli = el('input', { type: 'text', list: 'apClientes', placeholder: 'Ex.: Clínica Bem-Estar (ou o nome de um cliente novo)', value: st.cliente || '', maxlength: 60, oninput: e => { st.cliente = e.target.value; } });
    const inTema = el('input', { type: 'text', placeholder: 'Ex.: Reforma Tributária', value: st.tema || '', maxlength: 50, oninput: e => { st.tema = e.target.value; } });
    const ta = el('textarea', { rows: 5, placeholder: 'Conte o contexto: quem é o cliente, o que ele faz, o que precisa, as dores e o que quer resolver. Ex.: Clínica odontológica aberta há 2 anos, no Simples, com 3 funcionários. O contador atual atrasa as guias e ela quer organizar a folha e pagar menos imposto.', oninput: e => { st.contexto = e.target.value; } });
    ta.value = st.contexto || '';
    const tipos = el('div', { class: 'ap-tipos' });
    const blocoTema = el('div', { class: 'campo', hidden: st.tipo !== 'tema' }, el('label', {}, 'Tema'), inTema);
    const blocoIva = el('div', { class: 'ap-preco', hidden: st.tipo !== 'proposta' });
    const renderTipos = () => {
      tipos.innerHTML = '';
      for (const [k, T] of Object.entries(TIPOS)) tipos.append(el('button', { type: 'button', class: 'ap-tipo' + (st.tipo === k ? ' on' : ''), onclick: () => { st.tipo = k; renderTipos(); blocoIva.hidden = k !== 'proposta'; blocoTema.hidden = k !== 'tema'; } }, el('span', { class: 'ic' }, T.ic), el('b', {}, T.nome), el('small', {}, T.desc)));
    };
    const renderIva = () => {
      blocoIva.innerHTML = '';
      blocoIva.append(el('div', { class: 'ap-preco-cab' }, el('b', {}, `💜 Preço com orientação da ${iva}`), el('small', {}, 'Ela entende o serviço e a situação do cliente e sugere o valor (mercado de São Luís + tabela nacional 2026).')));
      for (const [k, it] of st.itens.entries()) {
        const inV = el('input', { type: 'number', min: 0, step: 10, value: it.final, title: 'Você pode ajustar o valor', oninput: e => { it.final = Math.max(0, +e.target.value || 0); } });
        blocoIva.append(el('div', { class: 'ap-item' }, el('div', {}, el('b', {}, it.servico), el('small', {}, `${it.qtd > 1 ? it.qtd + ' × ' : ''}${it.unid}${it.parcelas > 1 ? ` · até ${it.parcelas}x` : ''}${it.mercado ? ` · mercado ${brl0(it.mercado.min)}–${brl0(it.mercado.max)}` : ''}`)),
          el('label', { class: 'ap-valor' }, 'R$', inV), el('button', { type: 'button', class: 'bt peq perigo', title: 'Tirar', onclick: () => { st.itens.splice(k, 1); renderIva(); } }, '×')));
      }
      blocoIva.append(el('button', { type: 'button', class: 'bt peq', onclick: pedirIva }, st.itens.length ? `＋ Outro serviço com a ${iva}` : `💜 Pedir orientação da ${iva}`));
    };
    async function pedirIva() {
      if (!KM.precificacao) return;
      const texto = [st.contexto, st.cliente ? `Cliente: ${st.cliente}.` : ''].filter(Boolean).join(' ');
      d.close();
      const r = await KM.precificacao._pedir(iva, texto);
      d.showModal();
      if (!r) return;
      const c = KM.precificacao.calcular(r.ent); if (!c) return A().toast('Não achei esse serviço na tabela da ' + iva);
      st.itens.push({ servico: c.servico, unid: c.unid, qtd: c.qtd, final: c.final, parcelas: c.parcelas, mercado: c.mercado, ajustes: c.ajustes, mensagem: KM.precificacao.mensagemCliente(c, r.ent) });
      renderIva();
      const fi = (A().cfg().funcionarios || []).find(f => f.funcao === 'precificacao');
      if (fi) A().falar(fi.id, `Para ${st.cliente || 'esse cliente'}: ${brl0(c.final)}, meu bem 💜`, 3400);
    }
    renderTipos(); renderIva();
    const criar = el('button', { class: 'bt prim', type: 'button', onclick: () => gerar(d) }, '✨ Criar a apresentação');
    d.append(el('div', { class: 'dlg-topo' }, el('h2', {}, '📊 Sala de Apresentação'), el('button', { type: 'button', onclick: () => d.close() }, '×')),
      el('div', { class: 'dlg-corpo' }, lista,
        el('div', { class: 'campo' }, el('label', {}, 'Cliente'), inCli),
        el('label', { class: 'ap-rot' }, 'Tipo de apresentação'), tipos, blocoTema,
        el('div', { class: 'campo' }, el('label', {}, 'Contexto da apresentação'), ta),
        blocoIva,
        el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center' }, criar, el('small', { class: 'vazio' }, 'Os slides saem no estilo da KWIK, em 16:9. Depois dá para apresentar em tela cheia e baixar em PDF.'))));
    if (!d.open) d.showModal();
    setTimeout(() => (st.cliente ? ta : inCli).focus(), 60);
  }
  async function gerar(dlg) {
    const st = estadoForm;
    if (!st.contexto || st.contexto.trim().length < 8) { A().toast('Escreva o contexto da apresentação (2 ou 3 frases já bastam) 🙂'); return; }
    if (st.tipo === 'proposta' && !st.itens.length && !confirm('Criar a proposta sem o preço da Dona Iva? (dá para pedir antes, no botão roxo)')) return;
    const eu = (A().cfg().marketing && A().cfg().marketing.dono) || (KM.nomeDe && KM.nomeDe('noticias')) || 'Kauã';
    const deck = { tipo: st.tipo, cliente: (st.cliente || '').trim(), tema: (st.tema || '').trim(), contexto: st.contexto.trim(), itens: st.itens.slice(), apresentador: `${eu}, KWIK Contabilidade`, criadoEm: new Date().toISOString() };
    if (deck.tipo === 'resultados') deck.dados = dadosCliente(deck.cliente);
    deck.slides = montarDeck(deck);
    dlg.close();
    const T = TIPOS[deck.tipo];
    const salvo = { id: KM.marketing._u.agoraId('apres'), tipo: 'apresentacao', criadoEm: KM.marketing._u.agoraIso(), funcionario: { id: 'apresentacao', nome: 'Sala de Apresentação' },
      tarefa: T.nome, titulo: `${T.nome}${deck.cliente ? ' · ' + deck.cliente : ''}`, deck, duracao: 4 };
    try { await A().BK().salvarRelatorio(salvo); await A().carregarRelatorios(KM.resumoRelatorio(salvo)); }
    catch (e) { A().toast('Não consegui salvar nos relatórios: ' + e.message + ' (a apresentação abre mesmo assim)', { erro: true }); }
    estadoForm = { tipo: st.tipo, itens: [] };
    // na sala: o cliente chega, passa pelo corredor dos clientes e assiste
    if (KM.recepcao && KM.recepcao.chegar) KM.recepcao.chegar(deck.cliente);
    A().toast(`📊 Apresentação pronta: ${salvo.titulo} (${deck.slides.length} slides)`, { botao: ['Abrir', () => A().abrirRelatorio(salvo.id)], ms: 9000 });
    A().abrirRelatorio(salvo.id);
  }

  KM.apresentacao = { abrir, renderRel, montarDeck, desenharSlide, pdf, TIPOS };
})();
