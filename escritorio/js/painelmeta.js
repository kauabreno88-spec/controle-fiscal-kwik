/* KWIK Mini Escritório · app "Meta" da tela inicial: painel dos clientes.
   Usa os clientes da sala META / Configurações (cfg.clientes: nome, valor por mês, status ativo ou em negociação).
   Mostra: faturamento mensal, número de empresas, ticket médio, taxa de crescimento (mês a mês e em 6 meses), meta,
   negociações, projeção do ano, tipos de atividade (rosca), valor por cliente (barras) e a curva de crescimento.
   A curva usa "cliente desde" (mês em que entrou; dá para preencher na tabela) e fotos mensais guardadas sozinhas
   (cfg.metaHist). Tudo editável aqui mesmo. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const el = (...a) => A().el(...a);
  const NS = 'http://www.w3.org/2000/svg';
  const S = (tag, at, pai) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (pai) pai.appendChild(e); return e; };
  const brl = (v, d = 0) => 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const pct = v => (v > 0 ? '+' : '') + (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
  const dd = n => String(n).padStart(2, '0');
  const mesDe = d => `${d.getFullYear()}-${dd(d.getMonth() + 1)}`;
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const CORES = ['#28BE52', '#176B37', '#4dabf7', '#fab005', '#e64980', '#7950f2', '#fd7e14', '#15aabf', '#868e96'];
  const ativo = c => (c.status || 'ativo') === 'ativo';
  let corpo = null, tip = null;

  function atividade(c) {
    if (c.atividade) return c.atividade;
    try { return KM.clientesFora.detectar(c.nome); } catch (e) { return 'escritorio'; }
  }
  const MODELOS = () => (KM.clientesFora && KM.clientesFora.MODELOS) || { escritorio: { nome: 'Escritório / serviços', ic: '🏢' } };
  function dados() {
    const c = A().cfg(), cl = (c.clientes || []).filter(x => (x.nome || '').trim());
    const at = cl.filter(ativo), ng = cl.filter(x => !ativo(x));
    const total = at.reduce((s, x) => s + (Number(x.valor) || 0), 0);
    const meta = Math.max(1, Number(c.meta && c.meta.clientes) || 10);
    // foto do mês (para a curva, mesmo sem "cliente desde")
    c.metaHist = c.metaHist || {};
    const agora = mesDe(new Date());
    const foto = c.metaHist[agora];
    if (!foto || foto.total !== total || foto.n !== at.length) { c.metaHist[agora] = { total, n: at.length }; A().salvar(); }
    // série dos últimos 12 meses
    const serie = [];
    for (let k = 11; k >= 0; k--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - k); const m = mesDe(d);
      let tot = 0, n = 0, temDesde = false;
      for (const x of at) { if (x.desde) temDesde = true; if (!x.desde || x.desde <= m) { tot += Number(x.valor) || 0; n++; } }
      const h = c.metaHist[m];
      if (!temDesde && h && m !== agora) { tot = h.total; n = h.n; }
      serie.push({ m, tot, n, rot: `${MES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}` });
    }
    const ult = serie[11], ant = serie[10], seis = serie[5];
    const cresc = ant.tot ? (ult.tot - ant.tot) / ant.tot : null, cresc6 = seis.tot ? (ult.tot - seis.tot) / seis.tot : null;
    const porAtv = {};
    for (const x of at) { const k = atividade(x); porAtv[k] = porAtv[k] || { tot: 0, n: 0 }; porAtv[k].tot += Number(x.valor) || 0; porAtv[k].n++; }
    return { cl, at, ng, total, meta, serie, cresc, cresc6, porAtv, ticket: at.length ? total / at.length : 0, totNeg: ng.reduce((s, x) => s + (Number(x.valor) || 0), 0), novos: at.filter(x => x.desde === agora).length };
  }

  function abrir(c, acoes) {
    corpo = c;
    acoes.append(el('button', { class: 'appv-bt', onclick: () => { KM.inicio.irEscritorio(); setTimeout(() => KM.meta.abrir(), 100); } }, '🎯 Sala META'));
    render();
  }
  function sair() { corpo = null; if (tip) tip.remove(); tip = null; }
  function dica(html, x, y) {
    if (!tip) { tip = el('div', { class: 'pm-tip' }); document.body.append(tip); }
    tip.innerHTML = html; tip.classList.add('on');
    const w = tip.offsetWidth, h = tip.offsetHeight; let l = x + 14, t = y - h - 10;
    if (l + w > innerWidth - 8) l = x - w - 14; if (t < 8) t = y + 16;
    tip.style.left = l + 'px'; tip.style.top = t + 'px';
  }
  const semDica = () => tip && tip.classList.remove('on');
  function render() {
    if (!corpo || !corpo.isConnected) return;
    corpo.innerHTML = '';
    const D = dados(), M = MODELOS();
    const wrap = el('div', { class: 'pm' });
    // cabeçalho
    wrap.append(el('div', { class: 'pm-hero' }, el('div', { class: 'pm-eyebrow' }, el('b', {}, 'META'), ' · KWIK CONTABILIDADE · ', new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()),
      el('h1', {}, 'Painel dos ', el('em', {}, 'clientes')), el('div', { class: 'pm-regua' })));
    // KPIs
    const k = (rot, val, det, cls) => el('div', { class: 'pm-kpi ' + (cls || '') }, el('div', { class: 'rot' }, rot), el('div', { class: 'val' }, val), el('div', { class: 'det', html: det }));
    const progMeta = Math.min(1, D.at.length / D.meta);
    const hero = el('div', { class: 'pm-kpi hero' }, el('div', {}, el('div', { class: 'rot' }, 'Faturamento mensal (clientes ativos)'), el('div', { class: 'val' }, brl(D.total)),
      el('div', { class: 'det', html: `${D.at.length} empresa${D.at.length === 1 ? '' : 's'} · <b>${brl(D.total * 12)}</b> por ano` })),
      el('div', { class: 'pm-meta' }, el('div', { class: 'pm-meta-barra' }, el('i', { style: `width:${progMeta * 100}%` })), el('div', { class: 'pm-meta-leg' }, el('span', {}, `Meta: ${D.at.length} de ${D.meta} clientes`), el('b', {}, Math.round(progMeta * 100) + '%'))));
    wrap.append(el('div', { class: 'pm-kpis' }, hero,
      k('Número de empresas', String(D.at.length), `${D.ng.length} em negociação`),
      k('Ticket médio', brl(D.ticket), 'por cliente/mês'),
      k('Crescimento no mês', D.cresc == null ? '—' : pct(D.cresc), D.cresc == null ? 'preencha "cliente desde" na tabela' : `vs. ${D.serie[10].rot}: <b>${brl(D.serie[11].tot - D.serie[10].tot)}</b>`, D.cresc > 0 ? 'bom' : D.cresc < 0 ? 'ruim' : ''),
      k('Crescimento em 6 meses', D.cresc6 == null ? '—' : pct(D.cresc6), D.cresc6 == null ? 'ainda sem histórico' : `de ${brl(D.serie[5].tot)} para ${brl(D.total)}`, D.cresc6 > 0 ? 'bom' : ''),
      k('Em negociação', brl(D.totNeg), D.ng.length === 1 ? '1 possível fechamento' : `${D.ng.length} possíveis fechamentos`),
      k('Se fechar tudo', brl(D.total + D.totNeg), `<b>${D.at.length + D.ng.length}</b> clientes · ${brl((D.total + D.totNeg) * 12)}/ano`)));
    // crescimento
    const g1 = cartao('Crescimento do faturamento', 'últimos 12 meses'); g1.corpo.append(grafCrescimento(D)); wrap.append(g1.box);
    const grade = el('div', { class: 'pm-grade' });
    const g2 = cartao('Tipos de atividade', `${Object.keys(D.porAtv).length} tipos`); g2.corpo.append(grafRosca(D, M));
    const g3 = cartao('Valor por cliente', 'R$ por mês'); g3.corpo.append(barras(D, M));
    grade.append(g2.box, g3.box); wrap.append(grade);
    // tabela editável
    const g4 = cartao('Clientes', 'toque para editar'); g4.corpo.append(tabela(D, M)); wrap.append(g4.box);
    corpo.append(wrap);
  }
  function cartao(t, sub) { const c = el('div', { class: 'pm-corpo' }); return { box: el('section', { class: 'pm-cartao' }, el('h3', {}, t, el('span', {}, sub)), c), corpo: c }; }
  function grafCrescimento(D) {
    const box = el('div', { class: 'pm-chart' }), W = 900, H = 260, m = { t: 20, r: 16, b: 30, l: 64 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const max = Math.max(1000, ...D.serie.map(s => s.tot)) * 1.15, nMax = Math.max(1, ...D.serie.map(s => s.n));
    const x = i => m.l + i / 11 * iw, y = v => m.t + ih - v / max * ih;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' }); box.append(svg);
    for (let k = 0; k <= 4; k++) { const v = max / 4 * k; S('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: '#F0F2F2' }, svg); const t = S('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'pm-ax' }, svg); t.textContent = v >= 1000 ? 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k' : 'R$ ' + Math.round(v); }
    // barras: número de clientes
    D.serie.forEach((s, i) => { S('rect', { x: x(i) - 12, y: m.t + ih - s.n / nMax * ih * 0.35, width: 24, height: s.n / nMax * ih * 0.35, fill: '#EAF8EF', rx: 3 }, svg); const t = S('text', { x: x(i), y: H - 8, 'text-anchor': 'middle', class: 'pm-ax' }, svg); t.textContent = s.rot; });
    const def = S('defs', {}, svg), gr = S('linearGradient', { id: 'pmGr', x1: 0, y1: 0, x2: 0, y2: 1 }, def);
    S('stop', { offset: '0', 'stop-color': '#28BE52', 'stop-opacity': '.28' }, gr); S('stop', { offset: '1', 'stop-color': '#28BE52', 'stop-opacity': '0' }, gr);
    const pts = D.serie.map((s, i) => [x(i), y(s.tot)]);
    S('path', { d: `M${pts[0][0]},${m.t + ih} ` + pts.map(p => `L${p[0]},${p[1]}`).join(' ') + ` L${pts[11][0]},${m.t + ih} Z`, fill: 'url(#pmGr)' }, svg);
    S('path', { d: 'M' + pts.map(p => p.join(',')).join(' L'), fill: 'none', stroke: '#28BE52', 'stroke-width': 3, 'stroke-linejoin': 'round' }, svg);
    D.serie.forEach((s, i) => {
      const c = S('circle', { cx: pts[i][0], cy: pts[i][1], r: i === 11 ? 6 : 4, fill: i === 11 ? '#28BE52' : '#fff', stroke: '#1B9440', 'stroke-width': 2 }, svg);
      const alvo = S('rect', { x: x(i) - iw / 22, y: m.t, width: iw / 11, height: ih, fill: 'transparent' }, svg);
      const ant = D.serie[i - 1], var_ = ant && ant.tot ? (s.tot - ant.tot) / ant.tot : null;
      alvo.addEventListener('mousemove', e => dica(`<div class="t">${s.rot}</div><div class="v">${brl(s.tot)}</div>${s.n} cliente${s.n === 1 ? '' : 's'}${var_ != null ? ` · ${pct(var_)}` : ''}`, e.clientX, e.clientY));
      alvo.addEventListener('mouseleave', semDica); void c;
    });
    const tf = S('text', { x: pts[11][0] - 6, y: pts[11][1] - 12, 'text-anchor': 'end', class: 'pm-vl' }, svg); tf.textContent = brl(D.total);
    return box;
  }
  function grafRosca(D, M) {
    const box = el('div', { class: 'pm-rosca' }), ent = Object.entries(D.porAtv).sort((a, b) => b[1].tot - a[1].tot);
    const tot = ent.reduce((s, [, v]) => s + (v.tot || 0), 0) || 1, R = 80, r = 52, cx = 100, cy = 100;
    const svg = S('svg', { viewBox: '0 0 200 200', class: 'pm-rosca-svg' });
    let a0 = -Math.PI / 2;
    if (!ent.length) S('circle', { cx, cy, r: (R + r) / 2, fill: 'none', stroke: '#F0F2F2', 'stroke-width': R - r }, svg);
    ent.forEach(([k, v], i) => {
      const frac = (v.tot || 0) / tot || (1 / ent.length), a1 = a0 + frac * Math.PI * 2, gde = a1 - a0 > Math.PI ? 1 : 0;
      const p = (rr, a) => `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
      const d = ent.length === 1 ? `M${cx - R},${cy} A${R},${R} 0 1 1 ${cx + R},${cy} A${R},${R} 0 1 1 ${cx - R},${cy} M${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy}` : `M${p(R, a0)} A${R},${R} 0 ${gde} 1 ${p(R, a1)} L${p(r, a1)} A${r},${r} 0 ${gde} 0 ${p(r, a0)} Z`;
      const fat = S('path', { d, fill: CORES[i % CORES.length], 'fill-rule': 'evenodd', class: 'pm-fatia' }, svg);
      fat.addEventListener('mousemove', e => dica(`<div class="t">${(M[k] || {}).nome || k}</div><div class="v">${brl(v.tot)}</div>${v.n} cliente${v.n === 1 ? '' : 's'} · ${Math.round(frac * 100)}%`, e.clientX, e.clientY));
      fat.addEventListener('mouseleave', semDica);
      a0 = a1;
    });
    const t1 = S('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', class: 'pm-rosca-n' }, svg); t1.textContent = String(D.at.length);
    const t2 = S('text', { x: cx, y: cy + 16, 'text-anchor': 'middle', class: 'pm-ax' }, svg); t2.textContent = 'empresas';
    box.append(svg, el('ul', { class: 'pm-leg' }, ent.map(([k, v], i) => el('li', {}, el('i', { style: `background:${CORES[i % CORES.length]}` }), el('span', {}, `${(M[k] || {}).ic || ''} ${(M[k] || {}).nome || k}`), el('b', {}, `${v.n} · ${brl(v.tot)}`)))));
    if (!ent.length) box.append(el('p', { class: 'vazio' }, 'Cadastre clientes na tabela abaixo.'));
    return box;
  }
  function barras(D, M) {
    const box = el('div', { class: 'pm-hbars' }), l = D.at.slice().sort((a, b) => (Number(b.valor) || 0) - (Number(a.valor) || 0)), mx = Math.max(1, ...l.map(x => Number(x.valor) || 0));
    for (const c of l.slice(0, 12)) {
      const v = Number(c.valor) || 0, mo = M[atividade(c)] || {};
      box.append(el('div', { class: 'pm-hb' }, el('div', { class: 'top' }, el('span', { class: 'n' }, c.nome, el('small', {}, mo.nome || '')), el('span', { class: 'v' }, brl(v), el('small', {}, D.total ? Math.round(v / D.total * 100) + '%' : ''))),
        el('div', { class: 'trilho' }, el('i', { style: `width:${v / mx * 100}%` }))));
    }
    if (!l.length) box.append(el('p', { class: 'vazio' }, 'Nenhum cliente ativo ainda.'));
    return box;
  }
  function tabela(D, M) {
    const c = A().cfg(); c.clientes = c.clientes || [];
    const box = el('div', { class: 'pm-tab' });
    const tb = el('table', {}, el('thead', {}, el('tr', {}, ['Cliente', 'Atividade', 'R$ por mês', 'Cliente desde', 'Situação', ''].map(t => el('th', {}, t)))));
    const corpoT = el('tbody'); tb.append(corpoT);
    const muda = () => A().salvar(); // redesenha ao sair do campo (change), sem perder o foco enquanto digita
    corpoT.addEventListener('change', () => setTimeout(render, 60));
    for (const x of c.clientes) {
      corpoT.append(el('tr', { class: ativo(x) ? '' : 'neg' },
        el('td', {}, el('input', { type: 'text', value: x.nome || '', placeholder: 'Nome do cliente', oninput: e => { x.nome = e.target.value; muda(); } })),
        el('td', {}, el('select', { onchange: e => { x.atividade = e.target.value; muda(); } }, Object.entries(M).map(([k, mo]) => el('option', { value: k, selected: atividade(x) === k }, `${mo.ic || ''} ${mo.nome}`)))),
        el('td', {}, el('input', { type: 'number', min: 0, step: 10, value: x.valor || 0, oninput: e => { x.valor = Math.max(0, Number(e.target.value) || 0); muda(); } })),
        el('td', {}, el('input', { type: 'month', value: x.desde || '', oninput: e => { x.desde = e.target.value; muda(); } })),
        el('td', {}, el('select', { onchange: e => { x.status = e.target.value; muda(); } }, [['ativo', '✅ Ativo'], ['negociacao', '🟡 Em negociação']].map(([v, n]) => el('option', { value: v, selected: (x.status || 'ativo') === v }, n)))),
        el('td', {}, el('button', { class: 'bt peq perigo', title: 'Tirar', onclick: () => { if (!confirm(`Tirar ${x.nome || 'este cliente'} da lista?`)) return; c.clientes = c.clientes.filter(y => y !== x); A().salvar(); render(); } }, '×'))));
    }
    box.append(el('div', { class: 'pm-tab-rol' }, tb), el('div', { class: 'pm-tab-bts' },
      el('button', { class: 'bt peq prim', onclick: () => { c.clientes.push({ nome: '', telefone: '', valor: 0, status: 'ativo', desde: mesDe(new Date()) }); A().salvar(); render(); setTimeout(() => { const i = [...document.querySelectorAll('.pm-tab tbody input[type=text]')].pop(); if (i) i.focus(); }, 40); } }, '＋ Cliente'),
      el('label', { class: 'pm-metaInp' }, 'Meta de clientes: ', el('input', { type: 'number', min: 1, value: D.meta, oninput: e => { c.meta = c.meta || {}; c.meta.clientes = Math.max(1, Math.round(Number(e.target.value) || 10)); muda(); }, onchange: () => render() })),
      el('small', {}, '"Cliente desde" monta a curva de crescimento. Os mesmos clientes aparecem na sala META do escritório.')));
    return box;
  }
  function resumo() {
    const D = dados();
    return { txt: `${brl(D.total)}/mês · ${D.at.length} empresa${D.at.length === 1 ? '' : 's'}${D.cresc != null ? ' · ' + pct(D.cresc) : ''}`, ticker: `🎯 ${D.at.length} de ${D.meta} clientes · ${brl(D.total)}/mês` };
  }
  KM.inicio.registrar('meta', { abrir, sair, resumo });
})();
