/* KWIK Mini Escritório · app "Gerar relatório" da tela inicial.
   Você copia uma planilha (Excel, Google Planilhas: Ctrl+C) e cola aqui — ou escolhe um .csv/.tsv/.txt. O app reconhece
   as colunas (data, valor, cliente/tomador, categoria/serviço, situação, forma de pagamento, número), deixa conferir e
   monta o relatório no padrão KWIK (o mesmo visual do relatório de faturamento: marca, título grande, indicadores,
   gráfico acumulado, barras por categoria, destaques e tabela com filtros), em HTML (interativo, um arquivo só) e PDF.
   Linhas canceladas/substituídas ficam fora do total. O relatório fica salvo em Relatórios (repositório privado). */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const el = (...a) => A().el(...a);
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const brl = (n, d = 2) => (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const semAc = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // ------------------------------------------------------------------ ler a planilha
  function separar(txt) {
    txt = String(txt || '').replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '').trim();
    if (!txt) return [];
    const l1 = txt.split('\n')[0], sep = l1.includes('\t') ? '\t' : (l1.split(';').length > l1.split(',').length ? ';' : ',');
    const linhas = []; let campo = '', linha = [], aspas = false;
    for (let i = 0; i < txt.length; i++) {
      const c = txt[i];
      if (aspas) { if (c === '"') { if (txt[i + 1] === '"') { campo += '"'; i++; } else aspas = false; } else campo += c; continue; }
      if (c === '"' && !campo) { aspas = true; continue; }
      if (c === sep) { linha.push(campo.trim()); campo = ''; continue; }
      if (c === '\n') { linha.push(campo.trim()); linhas.push(linha); linha = []; campo = ''; continue; }
      campo += c;
    }
    linha.push(campo.trim()); linhas.push(linha);
    return linhas.filter(l => l.some(x => x !== ''));
  }
  function numero(s) {
    if (typeof s === 'number') return s;
    let t = String(s || '').replace(/[R$\s ]/g, ''); if (!t) return NaN;
    const neg = /^-|\(.*\)$/.test(t); t = t.replace(/[()-]/g, '');
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    const n = Number(t); return isNaN(n) ? NaN : (neg ? -n : n);
  }
  function data(s) {
    const t = String(s || '').trim(); let m;
    if ((m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/))) { const a = m[3].length === 2 ? 2000 + +m[3] : +m[3]; return `${a}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`; }
    if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;
    if (/^\d{5}(\.\d+)?$/.test(t)) { const n = +t; if (n > 20000 && n < 80000) { const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 864e5); return d.toISOString().slice(0, 10); } }
    return '';
  }
  const CAMPOS = {
    dt: { nome: 'Data', re: /data|^dt|emiss|compet|venc|dia/ },
    v: { nome: 'Valor', re: /valor|total|vlr|r\$|preco|montante|receita|liquido|bruto/ },
    cli: { nome: 'Cliente / tomador', re: /tomador|cliente|nome|paciente|razao|comprador|destinat|fornecedor|pessoa/ },
    cat: { nome: 'Categoria / serviço', re: /servi|categ|descri|produto|item|atividade|tipo|discrimin|historico|plano/ },
    sit: { nome: 'Situação', re: /situa|status|estado/ },
    pag: { nome: 'Forma de pagamento', re: /pagamento|forma|meio|pagto/ },
    num: { nome: 'Número', re: /^n[ºo°.]?$|^num|numero|nota|^nf|documento|^doc/ },
  };
  function detectar(tab) {
    const cab = tab[0].map(semAc), dadosL = tab.slice(1, 40), map = {}, usados = new Set();
    for (const [k, c] of Object.entries(CAMPOS)) {
      let i = cab.findIndex((h, j) => !usados.has(j) && c.re.test(h));
      if (k === 'v' && i >= 0) { // prefere a coluna de valor com mais números
        const cands = cab.map((h, j) => [h, j]).filter(([h, j]) => !usados.has(j) && c.re.test(h));
        cands.sort((a, b) => dadosL.filter(r => !isNaN(numero(r[b[1]]))).length - dadosL.filter(r => !isNaN(numero(r[a[1]]))).length || (/total|valor/.test(b[0]) ? 1 : 0) - (/total|valor/.test(a[0]) ? 1 : 0));
        i = cands.length ? cands[0][1] : -1;
      }
      if (i >= 0) { map[k] = i; usados.add(i); }
    }
    if (map.dt == null) { const j = cab.findIndex((h, j) => !usados.has(j) && dadosL.filter(r => data(r[j])).length > dadosL.length * 0.6); if (j >= 0) { map.dt = j; usados.add(j); } }
    if (map.v == null) { const j = cab.map((h, j) => j).filter(j => !usados.has(j)).sort((a, b) => dadosL.filter(r => /[,.]\d{2}$/.test(r[b] || '')).length - dadosL.filter(r => /[,.]\d{2}$/.test(r[a] || '')).length)[0]; if (j != null && dadosL.some(r => !isNaN(numero(r[j])))) { map.v = j; usados.add(j); } }
    return map;
  }
  const FORA = /cancel|substitu|inutiliz|denegad|estorn|anulad/i;
  function normalizar(tab, map) {
    return tab.slice(1).map(r => {
      const g = k => (map[k] != null && map[k] !== '' ? r[map[k]] || '' : '');
      const v = numero(g('v')), sit = g('sit');
      return { dt: data(g('dt')), v: isNaN(v) ? 0 : v, cli: g('cli'), cat: g('cat') || 'Sem categoria', sit: sit || 'Normal', pag: g('pag'), num: g('num'), ok: !FORA.test(sit) && !isNaN(v), linha: r };
    }).filter(r => r.v || r.cli || r.dt);
  }

  // ------------------------------------------------------------------ análise
  function analisar(rows, meta) {
    const ok = rows.filter(r => r.ok), fora = rows.filter(r => !r.ok);
    const total = ok.reduce((s, r) => s + r.v, 0), qtd = ok.length, ticket = qtd ? total / qtd : 0;
    const clis = {}; ok.forEach(r => { const k = r.cli || '—'; clis[k] = clis[k] || { n: 0, v: 0 }; clis[k].n++; clis[k].v += r.v; });
    const grupo = campo => { const o = {}; ok.forEach(r => { const k = r[campo] || '—'; o[k] = o[k] || { n: 0, v: 0 }; o[k].n++; o[k].v += r.v; }); return Object.entries(o).map(([k, x]) => ({ k, ...x })).sort((a, b) => b.v - a.v); };
    const porCat = grupo('cat'), porPag = rows.some(r => r.pag) ? grupo('pag') : [];
    const top = Object.entries(clis).map(([k, x]) => ({ k, ...x })).sort((a, b) => b.v - a.v);
    const datas = ok.map(r => r.dt).filter(Boolean).sort();
    const d0 = datas[0] || '', d1 = datas[datas.length - 1] || '';
    let porDia = [];
    if (d0) {
      const ini = new Date(d0 + 'T12:00:00'), fim = new Date(d1 + 'T12:00:00'), mesmoMes = d0.slice(0, 7) === d1.slice(0, 7);
      const a = mesmoMes ? new Date(ini.getFullYear(), ini.getMonth(), 1, 12) : ini, b = mesmoMes ? new Date(ini.getFullYear(), ini.getMonth() + 1, 0, 12) : fim;
      for (let d = new Date(a); d <= b && porDia.length < 400; d.setDate(d.getDate() + 1)) { const s = d.toISOString().slice(0, 10); porDia.push({ d: s, v: 0, n: 0 }); }
      ok.forEach(r => { const p = porDia.find(x => x.d === r.dt); if (p) { p.v += r.v; p.n++; } });
      let acc = 0; porDia.forEach(p => { acc += p.v; p.acc = acc; });
    }
    const mesmoMes = d0 && d0.slice(0, 7) === d1.slice(0, 7);
    const periodo = !d0 ? (meta.periodo || '') : mesmoMes ? `${MESES[+d0.slice(5, 7) - 1]} ${d0.slice(0, 4)}` : `${d0.split('-').reverse().join('/')} a ${d1.split('-').reverse().join('/')}`;
    const maior = ok.reduce((m, r) => (r.v > m.v ? r : m), { v: 0 });
    const dias = porDia.length || 1;
    // destaques
    const notas = [];
    const pctT = v => total ? Math.round(v / total * 100) : 0;
    if (porDia.length) { const md = porDia.reduce((m, p) => (p.v > m.v ? p : m), porDia[0]); if (md.v) notas.push(['↑', `Dia mais forte: <b>${md.d.slice(8, 10)}/${md.d.slice(5, 7)}</b> com <span class="mono">R$ ${brl(md.v)}</span> em ${md.n} registro${md.n > 1 ? 's' : ''} (${pctT(md.v)}% do total).`]); }
    if (porCat.length) notas.push(['%', `<b>${esc(porCat[0].k)}</b> é a maior fatia: <span class="mono">R$ ${brl(porCat[0].v)}</span> (${pctT(porCat[0].v)}%) em ${porCat[0].n} registro${porCat[0].n > 1 ? 's' : ''}.`]);
    if (top.length > 3) notas.push(['3', `Os 3 maiores clientes somam <b>${pctT(top.slice(0, 3).reduce((s, x) => s + x.v, 0))}%</b> do total${pctT(top.slice(0, 3).reduce((s, x) => s + x.v, 0)) > 50 ? ' — receita concentrada, vale acompanhar' : ''}.`]);
    const rec = top.filter(x => x.n > 1).length; if (rec) notas.push(['↻', `<b>${rec}</b> cliente${rec > 1 ? 's' : ''} aparece${rec > 1 ? 'm' : ''} mais de uma vez no período.`]);
    if (porDia.length >= 20) { const u3 = porDia.slice(-3).reduce((s, p) => s + p.v, 0); notas.push(['⌛', `Últimos 3 dias: <span class="mono">R$ ${brl(u3, 0)}</span> (${pctT(u3)}% do total).`]); }
    if (fora.length) notas.push(['!', `<b>${fora.length}</b> registro${fora.length > 1 ? 's' : ''} cancelado${fora.length > 1 ? 's' : ''}/substituído${fora.length > 1 ? 's' : ''} (<span class="mono">R$ ${brl(fora.reduce((s, r) => s + r.v, 0))}</span>) ficou fora do total.`, 'al']);
    if (maior.v) notas.push(['$', `Maior valor: <span class="mono">R$ ${brl(maior.v)}</span>${maior.cli ? ` — ${esc(maior.cli)}` : ''}${maior.dt ? ` em ${maior.dt.slice(8, 10)}/${maior.dt.slice(5, 7)}` : ''}.`]);
    return { total, qtd, ticket, nCli: Object.keys(clis).filter(k => k !== '—').length, maior: maior.v, fora: fora.length, foraV: fora.reduce((s, r) => s + r.v, 0), porCat, porPag, top, porDia, periodo, mediaDia: total / dias, notas, d0, d1 };
  }

  // ------------------------------------------------------------------ HTML (padrão KWIK)
  const CSS = `:root{--tinta:#111A19;--tinta-2:#2B3634;--cinza:#6B7472;--cinza-cl:#8C9997;--linha:#E1E5E4;--linha-2:#F0F2F2;--fundo:#F7F9F8;--branco:#FFFFFF;--verde:#28BE52;--verde-esc:#1B9440;--verde-prof:#176B37;--verde-luz:#EAF8EF;--ambar:#B26B00;--ambar-luz:#FFF5E5;--r:8px;--display:"Montserrat",system-ui,sans-serif;--body:"Inter",system-ui,-apple-system,sans-serif;--mono:"IBM Plex Mono","SFMono-Regular",Consolas,monospace}
*{box-sizing:border-box}html,body{margin:0;padding:0}body{background:var(--branco);color:var(--tinta);font-family:var(--body);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}
.wrap{max-width:1160px;margin:0 auto;padding:0 24px}@media(max-width:600px){.wrap{padding:0 16px}}.num,.mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
.barra{border-bottom:1px solid var(--linha)}.barra .wrap{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding-top:16px;padding-bottom:16px}
.marca{display:flex;align-items:center;gap:12px}.marca img{height:40px;width:auto;display:block}.marca .nome{font-family:var(--display);font-weight:800;font-size:23px;line-height:1;letter-spacing:.02em}.marca .tag{font-size:8.5px;letter-spacing:.3em;text-transform:uppercase;color:var(--cinza);margin-top:6px;font-weight:600}
.selo{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--cinza);border:1px solid var(--linha);border-radius:100px;padding:6px 13px;display:flex;align-items:center;gap:8px}.selo::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--verde)}.selo b{color:var(--tinta);font-weight:600}
.hero .wrap{padding-top:40px;padding-bottom:22px}.eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--cinza);display:flex;gap:9px;flex-wrap:wrap}.eyebrow b{color:var(--verde-esc);font-weight:600}
h1{font-family:var(--display);font-weight:800;font-size:clamp(30px,5.6vw,52px);line-height:1.02;letter-spacing:-.025em;margin:14px 0 14px;text-transform:uppercase}h1 em{font-style:normal;color:var(--verde)}
.ficha{display:flex;flex-wrap:wrap;gap:8px 22px;color:var(--cinza);font-size:13.5px}.ficha span b{color:var(--tinta-2);font-weight:600}.regua{height:4px;background:linear-gradient(90deg,var(--verde) 0 120px,var(--linha) 120px)}
.kpis{display:grid;grid-template-columns:1.35fr repeat(3,1fr);gap:16px;margin-top:28px}@media(max-width:960px){.kpis{grid-template-columns:repeat(2,1fr)}}
.kpi{border:1px solid var(--linha);border-radius:var(--r);padding:18px 18px 16px;background:var(--branco);position:relative}.kpi .rot{font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--cinza)}
.kpi .val{font-family:var(--display);font-weight:800;font-size:28px;letter-spacing:-.02em;line-height:1.1;margin-top:8px;font-variant-numeric:tabular-nums}.kpi .val small{font-size:.5em;color:var(--cinza);font-weight:700;margin-right:4px}
.kpi .det{font-size:12.5px;color:var(--cinza);margin-top:6px}.kpi .det b{color:var(--verde-esc);font-weight:600}
.kpi.hero-kpi{grid-row:span 2;border-left:4px solid var(--verde);display:flex;flex-direction:column;justify-content:space-between}@media(max-width:960px){.kpi.hero-kpi{grid-row:auto;grid-column:1/-1}}.kpi.hero-kpi .val{font-size:clamp(38px,5vw,50px);margin-top:12px}
.mini-split{margin-top:18px}.mini-split .bar{display:flex;height:12px;gap:2px}.mini-split .bar i{display:block;height:100%}.mini-split .bar i:first-child{border-radius:4px 0 0 4px}.mini-split .bar i:last-child{border-radius:0 4px 4px 0}
.mini-split .leg{display:flex;justify-content:space-between;gap:10px;margin-top:9px;font-size:12px;color:var(--tinta-2);flex-wrap:wrap}.mini-split .leg span{display:flex;align-items:center;gap:6px}.mini-split .leg i{width:9px;height:9px;border-radius:2px;display:inline-block}.mini-split .leg b{font-family:var(--mono);font-weight:600}
section{margin-top:40px}.sec-h{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}.sec-h h2{font-family:var(--display);font-weight:800;font-size:20px;letter-spacing:-.015em;margin:0;text-transform:uppercase}.sec-h p{margin:0;color:var(--cinza);font-size:13px}
.grade{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}@media(max-width:860px){.grade{grid-template-columns:1fr}}
.cartao{border:1px solid var(--linha);border-radius:var(--r);background:var(--branco);overflow:hidden;min-width:0}.cartao>h3{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;margin:0;padding:14px 18px 14px 15px;border-bottom:1px solid var(--linha);border-left:3px solid var(--verde);display:flex;justify-content:space-between;gap:10px;align-items:center}
.cartao>h3 span{font-family:var(--mono);letter-spacing:.04em;text-transform:none;color:var(--cinza);font-weight:500;font-size:11.5px}.corpo{padding:16px 18px 18px}
.chart{position:relative;width:100%}.chart svg{display:block;width:100%;height:auto;overflow:visible}.axis text{font-size:11px;fill:var(--cinza)}.grid line{stroke:var(--linha-2)}.vlabel{font-family:var(--mono);font-size:11.5px;fill:var(--tinta);font-weight:500}
.tip{position:fixed;pointer-events:none;background:var(--tinta);color:#fff;border-radius:6px;padding:9px 11px;font-size:12.5px;line-height:1.45;box-shadow:0 6px 20px rgba(17,26,25,.18);opacity:0;transition:opacity .1s;z-index:50;max-width:260px}.tip.on{opacity:1}.tip .t{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#A9B4B2;margin-bottom:3px}.tip .v{font-family:var(--mono);color:var(--verde);font-weight:600}
.hbars{display:flex;flex-direction:column;gap:14px}.hb .top{display:flex;justify-content:space-between;gap:10px;font-size:13.5px;align-items:baseline}.hb .top .n{color:var(--tinta-2);font-weight:500}.hb .top .n small{color:var(--cinza);font-weight:400;margin-left:6px;font-size:12px}
.hb .top .v{font-family:var(--mono);font-weight:600;white-space:nowrap}.hb .top .v small{color:var(--cinza);font-weight:400;margin-left:6px}.hb .trilho{height:12px;background:var(--linha-2);border-radius:0 4px 4px 0;margin-top:6px;position:relative}.hb .trilho i{position:absolute;left:0;top:0;bottom:0;border-radius:0 4px 4px 0;background:var(--verde)}.hb:hover .trilho i{background:var(--verde-esc)}
.notas{list-style:none;margin:0;padding:0}.notas li{display:flex;gap:12px;padding:13px 18px;border-bottom:1px solid var(--linha-2);font-size:13.5px;color:var(--tinta-2);align-items:flex-start}.notas li:last-child{border-bottom:0}
.notas .ic{flex:none;width:26px;height:26px;border-radius:6px;display:grid;place-items:center;font-family:var(--mono);font-weight:600;font-size:12px;background:var(--verde-luz);color:var(--verde-prof)}.notas .ic.al{background:var(--ambar-luz);color:var(--ambar)}.notas b{color:var(--tinta);font-weight:600}.notas .mono{font-size:12.5px}
.filtros{display:flex;flex-wrap:wrap;gap:8px;padding:14px 18px;border-bottom:1px solid var(--linha)}.chip{appearance:none;border:1px solid var(--linha);background:var(--branco);border-radius:100px;padding:6px 12px;font-family:var(--body);font-size:12px;font-weight:500;color:var(--tinta-2);cursor:pointer}.chip[aria-pressed="true"]{background:var(--tinta);border-color:var(--tinta);color:#fff}
.tabela-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:13px;min-width:720px}th,td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--linha-2);white-space:nowrap}th{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--cinza);font-weight:600;background:var(--fundo);cursor:pointer;user-select:none}th:hover{color:var(--tinta)}th .seta{color:var(--verde-esc);margin-left:4px}
td.n,th.n{text-align:right}td.n{font-family:var(--mono);font-variant-numeric:tabular-nums;font-weight:500}td.nf{font-family:var(--mono);color:var(--cinza)}td.tom{white-space:normal;min-width:200px}tbody tr:hover td{background:#FAFCFB}tr.subst td{color:var(--cinza-cl)}tr.subst td.n{text-decoration:line-through}
.badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:3px 9px;border-radius:100px}.badge::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}.badge.ok{background:var(--verde-luz);color:var(--verde-prof)}.badge.sb{background:var(--ambar-luz);color:var(--ambar)}tfoot td{font-weight:600;background:var(--fundo);border-bottom:0}
footer{margin-top:56px;border-top:1px solid var(--linha)}footer .wrap{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:start;padding-top:26px;padding-bottom:36px}@media(max-width:600px){footer .wrap{grid-template-columns:1fr}}footer img{height:38px}footer p{margin:0 0 8px;font-size:12px;color:var(--cinza);line-height:1.65;max-width:84ch}footer b{color:var(--tinta-2)}
@media print{.filtros{display:none}.kpi,.cartao{break-inside:avoid}section{break-inside:avoid-page}}`;
  // script do relatório (roda dentro do HTML gerado; não usa nada daqui de fora)
  function scriptRelatorio() {
    var R = window.__REL, DADOS = R.dados, AG = R.ag;
    function brl(n, d) { return (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: d === undefined ? 2 : d, maximumFractionDigits: d === undefined ? 2 : d }); }
    function E(id) { return document.getElementById(id); }
    var NS = 'http://www.w3.org/2000/svg';
    function S(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
    var tip = E('tip');
    function showTip(h, x, y) { tip.innerHTML = h; tip.classList.add('on'); var w = tip.offsetWidth, hh = tip.offsetHeight, l = x + 14, t = y - hh - 12; if (l + w > innerWidth - 8) l = x - w - 14; if (t < 8) t = y + 16; tip.style.left = l + 'px'; tip.style.top = t + 'px'; }
    function hideTip() { tip.classList.remove('on'); }
    function acum() {
      var box = E('ch-acum'); if (!box) return; box.innerHTML = '';
      var P = AG.porDia, W = Math.max(320, box.clientWidth), H = W < 560 ? 240 : 300, m = { t: 24, r: 16, b: 30, l: W < 560 ? 44 : 64 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var top = Math.max(1, P[P.length - 1].acc), passo = Math.pow(10, Math.floor(Math.log10(top / 4))), yMax = Math.ceil(top * 1.08 / (passo * 4)) * passo * 4;
      var x = function (i) { return m.l + i / Math.max(1, P.length - 1) * iw; }, y = function (v) { return m.t + ih - v / yMax * ih; };
      var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H }); box.appendChild(svg);
      var g = S('g', { class: 'grid' }, svg), ax = S('g', { class: 'axis' }, svg);
      for (var k = 0; k <= 4; k++) { var v = yMax / 4 * k; S('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, g); var t = S('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, ax); t.textContent = v === 0 ? '0' : (W < 560 ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k' : 'R$ ' + brl(v, 0)); }
      var marcas = W < 560 ? 4 : 7; for (var j = 0; j < marcas; j++) { var i = Math.round(j / (marcas - 1) * (P.length - 1)); var tt = S('text', { x: x(i), y: H - 8, 'text-anchor': 'middle' }, ax); tt.textContent = P[i].d.slice(8, 10) + '/' + P[i].d.slice(5, 7); }
      var d = 'M' + x(0) + ',' + y(0), prev = 0; P.forEach(function (p, i) { d += ' L' + x(i) + ',' + y(prev) + ' L' + x(i) + ',' + y(p.acc); prev = p.acc; });
      S('path', { d: d + ' L' + x(P.length - 1) + ',' + y(0) + ' Z', fill: '#28BE52', 'fill-opacity': '.12' }, svg);
      S('path', { d: d, fill: 'none', stroke: '#28BE52', 'stroke-width': 2.5 }, svg);
      P.forEach(function (p, i) { if (p.v) { var r = S('rect', { x: x(i) - 3, y: y(p.v) , width: 6, height: Math.max(1, ih - (y(p.v) - m.t)), fill: '#176B37', 'fill-opacity': .35 }, svg); r.setAttribute('y', m.t + ih - p.v / yMax * ih); } });
      var lab = S('text', { x: x(P.length - 1) - 4, y: y(top) - 10, 'text-anchor': 'end', class: 'vlabel' }, svg); lab.textContent = 'R$ ' + brl(top);
      P.forEach(function (p, i) { var a = S('rect', { x: x(i) - iw / P.length / 2, y: m.t, width: iw / P.length, height: ih, fill: 'transparent' }, svg); a.addEventListener('mousemove', function (e) { showTip('<div class="t">' + p.d.slice(8, 10) + '/' + p.d.slice(5, 7) + '</div><div class="row"><span>No dia</span><span class="v">R$ ' + brl(p.v) + '</span></div><div class="row"><span>Acumulado</span><span class="v">R$ ' + brl(p.acc) + '</span></div>' + p.n + ' registro(s)', e.clientX, e.clientY); }); a.addEventListener('mouseleave', hideTip); });
    }
    function tabela() {
      var corpo = E('tb-corpo'), filtro = 'Todas', ord = { k: 'dt', d: 1 };
      var cats = ['Todas'].concat(AG.porCat.map(function (c) { return c.k; }).slice(0, 8));
      var fb = E('filtros'); cats.forEach(function (c) { var b = document.createElement('button'); b.className = 'chip'; b.textContent = c; b.setAttribute('aria-pressed', c === filtro); b.onclick = function () { filtro = c; Array.prototype.forEach.call(fb.children, function (x) { x.setAttribute('aria-pressed', x === b); }); pinta(); }; fb.appendChild(b); });
      Array.prototype.forEach.call(document.querySelectorAll('th[data-k]'), function (th) { th.onclick = function () { ord = { k: th.dataset.k, d: ord.k === th.dataset.k ? -ord.d : 1 }; pinta(); }; });
      function pinta() {
        var l = DADOS.filter(function (r) { return filtro === 'Todas' || r.cat === filtro; }).slice().sort(function (a, b) { var x = a[ord.k], y = b[ord.k]; return (x > y ? 1 : x < y ? -1 : 0) * ord.d; });
        var h = '', tot = 0; l.forEach(function (r) { if (r.ok) tot += r.v; h += '<tr class="' + (r.ok ? '' : 'subst') + '">' + (R.tem.num ? '<td class="nf">' + (r.num || '') + '</td>' : '') + (R.tem.dt ? '<td class="nf">' + (r.dt ? r.dt.split('-').reverse().join('/') : '') + '</td>' : '') + '<td class="tom">' + (r.cli || '—') + '</td><td>' + r.cat + '</td>' + (R.tem.pag ? '<td>' + (r.pag || '') + '</td>' : '') + '<td><span class="badge ' + (r.ok ? 'ok' : 'sb') + '">' + r.sit + '</span></td><td class="n">' + brl(r.v) + '</td></tr>'; });
        corpo.innerHTML = h; E('tb-tot').textContent = brl(tot); E('tb-n').textContent = l.filter(function (r) { return r.ok; }).length + ' registros';
        Array.prototype.forEach.call(document.querySelectorAll('th[data-k] .seta'), function (s) { s.textContent = s.parentNode.dataset.k === ord.k ? (ord.d > 0 ? '↑' : '↓') : ''; });
      }
      pinta();
    }
    acum(); tabela();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(acum, 150); });
  }
  function htmlRelatorio(rel, logo) {
    const AG = rel.ag, M = rel.meta, tem = rel.tem;
    const h1 = esc(M.titulo || 'Relatório') + (AG.periodo ? ` <em>${esc(AG.periodo)}</em>` : '');
    const top2 = AG.porCat.slice(0, 1), resto = AG.total - (top2[0] ? top2[0].v : 0);
    const k = (rot, val, det, pre) => `<div class="kpi"><div class="rot">${rot}</div><div class="val">${pre ? `<small>${pre}</small>` : ''}${val}</div><div class="det">${det}</div></div>`;
    const kpis = `<div class="kpi hero-kpi"><div><div class="rot">${esc(M.rotTotal || 'Total válido no período')}</div><div class="val"><small>R$</small>${brl(AG.total)}</div>
      <div class="det">${AG.qtd} registros válidos${AG.porDia.length ? ` · <b>R$ ${brl(AG.mediaDia)}</b> por dia corrido` : ''}</div></div>
      ${top2[0] && AG.porCat.length > 1 ? `<div class="mini-split"><div class="bar"><i style="width:${top2[0].v / AG.total * 100}%;background:#176B37"></i><i style="width:${resto / AG.total * 100}%;background:#28BE52"></i></div>
      <div class="leg"><span><i style="background:#176B37"></i>${esc(top2[0].k)} (${top2[0].n}) <b>${Math.round(top2[0].v / AG.total * 100)}%</b></span><span><i style="background:#28BE52"></i>Demais (${AG.qtd - top2[0].n}) <b>${Math.round(resto / AG.total * 100)}%</b></span></div></div>` : ''}</div>`
      + k('Registros válidos', AG.qtd, AG.fora ? `+ ${AG.fora} cancelado(s)/substituído(s) fora do total` : 'nenhum cancelado')
      + k('Ticket médio', brl(AG.ticket), 'por registro', 'R$')
      + k(tem.cli ? 'Clientes atendidos' : 'Categorias', tem.cli ? AG.nCli : AG.porCat.length, tem.cli ? `${AG.top.filter(x => x.n > 1).length} com mais de um registro` : 'no período')
      + k('Maior valor', brl(AG.maior, 0), AG.top[0] && tem.cli ? `maior cliente: <b>${esc(AG.top[0].k).slice(0, 28)}</b>` : 'num único registro', 'R$')
      + k('Maior categoria', `${AG.porCat[0] ? Math.round(AG.porCat[0].v / (AG.total || 1) * 100) : 0}%`, AG.porCat[0] ? esc(AG.porCat[0].k).slice(0, 40) : '—')
      + (tem.pag && AG.porPag[0] ? k('Pagamento mais usado', esc(AG.porPag[0].k).slice(0, 18), `${AG.porPag[0].n} registros · <b>${Math.round(AG.porPag[0].v / (AG.total || 1) * 100)}%</b> do valor`) : k('Média por dia', brl(AG.mediaDia, 0), 'faturamento por dia corrido', 'R$'));
    const hb = (lista, n) => `<div class="hbars">${lista.slice(0, n).map(c => `<div class="hb"><div class="top"><span class="n">${esc(c.k)}<small>${c.n} reg.</small></span><span class="v">R$ ${brl(c.v)}<small>${Math.round(c.v / (AG.total || 1) * 100)}%</small></span></div><div class="trilho"><i style="width:${c.v / (lista[0].v || 1) * 100}%"></i></div></div>`).join('')}</div>`;
    const cols = [tem.num ? ['num', 'Nº', ''] : null, tem.dt ? ['dt', 'Data', ''] : null, ['cli', tem.cli ? 'Cliente' : 'Descrição', ''], ['cat', 'Categoria', ''], tem.pag ? ['pag', 'Pagamento', ''] : null, ['sit', 'Situação', ''], ['v', 'Valor (R$)', 'n']].filter(Boolean);
    const hoje = new Date().toLocaleDateString('pt-BR');
    return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(M.titulo)}${AG.periodo ? ' ' + esc(AG.periodo) : ''}${M.empresa ? ' · ' + esc(M.empresa) : ''} · KWIK</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="icon" href="${logo}"><style>${CSS}</style></head><body>
<header class="barra"><div class="wrap"><div class="marca"><img src="${logo}" alt="KWIK"><div><div class="nome">KWIK</div><div class="tag">Contabilidade · BPO · Consultoria</div></div></div><div class="selo">Relatório · <b>${hoje}</b></div></div></header>
<div class="hero"><div class="wrap"><div class="eyebrow"><b>${esc((M.titulo || 'Relatório').toUpperCase())}</b>${M.empresa ? `<span>· ${esc(M.empresa.toUpperCase())}</span>` : ''}${AG.periodo ? `<span>· ${esc(AG.periodo.toUpperCase())}</span>` : ''}</div>
<h1>${h1}</h1><div class="ficha">${M.empresa ? `<span>Empresa <b>${esc(M.empresa)}</b></span>` : ''}${AG.d0 ? `<span>Período <b>${AG.d0.split('-').reverse().join('/')} a ${AG.d1.split('-').reverse().join('/')}</b></span>` : ''}<span>Registros <b>${AG.qtd + AG.fora}</b></span><span>Fonte <b>${esc(M.fonte || 'planilha enviada')}</b></span></div></div></div>
<div class="wrap"><div class="regua"></div><div class="kpis" id="kpis">${kpis}</div>
${AG.porDia.length ? `<section><div class="sec-h"><h2>Evolução no período</h2><p>Acumulado dia a dia${AG.porDia.length >= 20 ? ` · últimos 3 dias: R$ ${brl(AG.porDia.slice(-3).reduce((s, p) => s + p.v, 0), 0)}` : ''}</p></div><div class="cartao"><h3>Acumulado <span>R$ ${brl(AG.total)}</span></h3><div class="corpo"><div class="chart" id="ch-acum"></div></div></div></section>` : ''}
<section><div class="sec-h"><h2>Onde está o valor</h2><p>Por categoria${tem.cli ? ' e por cliente' : ''}</p></div><div class="grade">
<div class="cartao"><h3>Por categoria <span>${AG.porCat.length} tipo(s)</span></h3><div class="corpo">${hb(AG.porCat, 8)}</div></div>
${tem.cli ? `<div class="cartao"><h3>Maiores clientes <span>top ${Math.min(8, AG.top.length)}</span></h3><div class="corpo">${hb(AG.top.filter(x => x.k !== '—'), 8)}</div></div>` : tem.pag ? `<div class="cartao"><h3>Por forma de pagamento <span>${AG.porPag.length}</span></h3><div class="corpo">${hb(AG.porPag, 8)}</div></div>` : ''}
</div>${tem.cli && tem.pag ? `<div class="grade" style="margin-top:16px"><div class="cartao"><h3>Por forma de pagamento <span>${AG.porPag.length}</span></h3><div class="corpo">${hb(AG.porPag, 8)}</div></div><div class="cartao"><h3>Destaques <span>leitura rápida</span></h3><ul class="notas">${AG.notas.map(([ic, t, cl]) => `<li><span class="ic ${cl || ''}">${ic}</span><span>${t}</span></li>`).join('')}</ul></div></div>` : ''}</section>
${tem.cli && tem.pag ? '' : `<section><div class="sec-h"><h2>Destaques</h2><p>O que chama atenção</p></div><div class="cartao"><ul class="notas">${AG.notas.map(([ic, t, cl]) => `<li><span class="ic ${cl || ''}">${ic}</span><span>${t}</span></li>`).join('')}</ul></div></section>`}
<section><div class="sec-h"><h2>Todos os registros</h2><p>Toque no título da coluna para ordenar</p></div><div class="cartao"><div class="filtros" id="filtros"></div><div class="tabela-scroll"><table>
<thead><tr>${cols.map(([kk, n, c]) => `<th data-k="${kk}" class="${c}">${n}<span class="seta"></span></th>`).join('')}</tr></thead><tbody id="tb-corpo"></tbody>
<tfoot><tr><td colspan="${cols.length - 1}" id="tb-n"></td><td class="n" id="tb-tot"></td></tr></tfoot></table></div></div></section></div>
<footer><div class="wrap"><img src="${logo}" alt="KWIK"><div><p><b>KWIK Contabilidade</b> · relatório gerado em ${hoje} a partir da ${esc(M.fonte || 'planilha enviada')}${M.empresa ? ` de ${esc(M.empresa)}` : ''}.</p>
<p>Os valores são os da planilha. Registros cancelados, substituídos ou estornados aparecem riscados na tabela e não entram no total.${M.obs ? ' ' + esc(M.obs) : ''}</p></div></div></footer>
<div class="tip" id="tip"></div>
<script>window.__REL=${JSON.stringify({ dados: rel.rows.map(r => ({ dt: r.dt, v: r.v, cli: esc(r.cli), cat: esc(r.cat), sit: esc(r.sit), pag: esc(r.pag), num: esc(r.num), ok: r.ok })), ag: { porDia: AG.porDia, porCat: AG.porCat.map(c => ({ k: esc(c.k), v: c.v, n: c.n })) }, tem }).replace(/</g, '\\u003c')};(${scriptRelatorio.toString()})();</script>
</body></html>`;
  }

  // ------------------------------------------------------------------ PDF (A4, desenhado no mesmo padrão)
  const PW = 1240, PH = 1754, MG = 80;
  function rr(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
  function quebrar(g, t, w) { const ws = String(t).split(/\s+/), out = []; let l = ''; for (const x of ws) { const n = l ? l + ' ' + x : x; if (g.measureText(n).width > w && l) { out.push(l); l = x; } else l = n; } if (l) out.push(l); return out; }
  const limpo = s => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  async function paginas(rel, logoImg) {
    const AG = rel.ag, M = rel.meta, tem = rel.tem, pgs = [];
    const F = { d: '"Montserrat", Arial, sans-serif', b: '"Segoe UI", Inter, Arial, sans-serif', m: 'Consolas, "IBM Plex Mono", monospace' };
    const nova = () => { const c = KM.tela(PW, PH), g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, PW, PH); pgs.push(c); return g; };
    const rodape = (g, n) => { g.strokeStyle = '#E1E5E4'; g.lineWidth = 2; g.beginPath(); g.moveTo(MG, PH - 90); g.lineTo(PW - MG, PH - 90); g.stroke(); g.font = `500 20px ${F.b}`; g.fillStyle = '#6B7472'; g.fillText(`KWIK Contabilidade · ${limpo(M.titulo)}${AG.periodo ? ' ' + AG.periodo : ''}${M.empresa ? ' · ' + M.empresa : ''}`, MG, PH - 54); g.textAlign = 'right'; g.fillText(`${n}`, PW - MG, PH - 54); g.textAlign = 'left'; };
    const cartao = (g, x, y, w, h, tit, sub) => { g.strokeStyle = '#E1E5E4'; g.lineWidth = 2; rr(g, x, y, w, h, 12); g.stroke(); g.fillStyle = '#28BE52'; g.fillRect(x, y, 5, 56); g.font = `600 17px ${F.b}`; g.fillStyle = '#111A19'; g.fillText(tit.toUpperCase().split('').join(String.fromCharCode(8202)), x + 22, y + 35); if (sub) { g.font = `500 18px ${F.m}`; g.fillStyle = '#6B7472'; g.textAlign = 'right'; g.fillText(sub, x + w - 22, y + 35); g.textAlign = 'left'; } g.strokeStyle = '#E1E5E4'; g.beginPath(); g.moveTo(x, y + 56); g.lineTo(x + w, y + 56); g.stroke(); };
    const barras = (g, lista, x, y, w, n) => { const mx = (lista[0] || { v: 1 }).v || 1; lista.slice(0, n).forEach((c, i) => { const yy = y + i * 58; g.font = `500 21px ${F.b}`; g.fillStyle = '#2B3634'; g.fillText(limpo(c.k).slice(0, 34), x, yy); g.font = `600 20px ${F.m}`; g.textAlign = 'right'; g.fillStyle = '#111A19'; g.fillText(`R$ ${brl(c.v)}  ${Math.round(c.v / (AG.total || 1) * 100)}%`, x + w, yy); g.textAlign = 'left'; g.fillStyle = '#F0F2F2'; g.fillRect(x, yy + 12, w, 16); g.fillStyle = '#28BE52'; g.fillRect(x, yy + 12, Math.max(3, w * c.v / mx), 16); }); };
    // página 1
    let g = nova(), y = MG;
    if (logoImg) g.drawImage(logoImg, MG, y, 56, 56);
    g.font = `800 34px ${F.d}`; g.fillStyle = '#111A19'; g.fillText('KWIK', MG + 72, y + 34); g.font = `600 13px ${F.b}`; g.fillStyle = '#6B7472'; g.fillText('CONTABILIDADE · BPO · CONSULTORIA', MG + 72, y + 56);
    g.font = `500 17px ${F.m}`; const selo = `RELATÓRIO · ${new Date().toLocaleDateString('pt-BR')}`, sw = g.measureText(selo).width + 56; g.strokeStyle = '#E1E5E4'; rr(g, PW - MG - sw, y + 8, sw, 40, 20); g.stroke(); g.fillStyle = '#28BE52'; g.beginPath(); g.arc(PW - MG - sw + 22, y + 28, 5, 0, 7); g.fill(); g.fillStyle = '#6B7472'; g.fillText(selo, PW - MG - sw + 36, y + 34);
    y += 90; g.fillStyle = '#E1E5E4'; g.fillRect(0, y, PW, 2); y += 70;
    g.font = `500 17px ${F.m}`; g.fillStyle = '#1B9440'; g.fillText([(M.titulo || 'Relatório').toUpperCase(), M.empresa ? M.empresa.toUpperCase() : '', AG.periodo ? AG.periodo.toUpperCase() : ''].filter(Boolean).join('  ·  '), MG, y);
    y += 30; g.font = `800 86px ${F.d}`;
    const t1 = (M.titulo || 'Relatório').toUpperCase(), t2 = (AG.periodo || '').toUpperCase();
    let lin = quebrar(g, t1 + ' ' + t2, PW - 2 * MG);
    lin.forEach((l, i) => { y += 88; let xx = MG; for (const w of l.split(' ')) { const dest = t2 && t2.includes(w); g.fillStyle = dest ? '#28BE52' : '#111A19'; g.fillText(w, xx, y); xx += g.measureText(w + ' ').width; } void i; });
    y += 44; g.font = `400 21px ${F.b}`; g.fillStyle = '#6B7472';
    g.fillText([M.empresa ? `Empresa: ${M.empresa}` : '', AG.d0 ? `Período: ${AG.d0.split('-').reverse().join('/')} a ${AG.d1.split('-').reverse().join('/')}` : '', `Registros: ${AG.qtd + AG.fora}`].filter(Boolean).join('     '), MG, y);
    y += 30; g.fillStyle = '#E1E5E4'; g.fillRect(MG, y, PW - 2 * MG, 6); g.fillStyle = '#28BE52'; g.fillRect(MG, y, 180, 6);
    // KPIs
    y += 36; const kw = (PW - 2 * MG - 32) / 3;
    g.strokeStyle = '#E1E5E4'; rr(g, MG, y, PW - 2 * MG, 200, 12); g.stroke(); g.fillStyle = '#28BE52'; g.fillRect(MG, y, 7, 200);
    g.font = `600 16px ${F.b}`; g.fillStyle = '#6B7472'; g.fillText((M.rotTotal || 'Total válido no período').toUpperCase(), MG + 32, y + 42);
    g.font = `800 72px ${F.d}`; g.fillStyle = '#111A19'; g.fillText(`R$ ${brl(AG.total)}`, MG + 32, y + 120);
    g.font = `400 20px ${F.b}`; g.fillStyle = '#6B7472'; g.fillText(`${AG.qtd} registros válidos${AG.porDia.length ? ` · R$ ${brl(AG.mediaDia)} por dia corrido` : ''}${AG.fora ? ` · ${AG.fora} fora do total` : ''}`, MG + 32, y + 162);
    y += 224;
    const ks = [['Ticket médio', `R$ ${brl(AG.ticket)}`, 'por registro'], [tem.cli ? 'Clientes atendidos' : 'Categorias', String(tem.cli ? AG.nCli : AG.porCat.length), tem.cli ? `${AG.top.filter(x => x.n > 1).length} com 2+ registros` : 'no período'], ['Maior valor', `R$ ${brl(AG.maior, 0)}`, AG.top[0] && tem.cli ? limpo(AG.top[0].k).slice(0, 26) : 'num registro']];
    ks.forEach(([r, v, d], i) => { const x = MG + i * (kw + 16); g.strokeStyle = '#E1E5E4'; rr(g, x, y, kw, 150, 12); g.stroke(); g.font = `600 15px ${F.b}`; g.fillStyle = '#6B7472'; g.fillText(r.toUpperCase(), x + 24, y + 38); g.font = `800 40px ${F.d}`; g.fillStyle = '#111A19'; g.fillText(v, x + 24, y + 92); g.font = `400 18px ${F.b}`; g.fillStyle = '#6B7472'; g.fillText(d, x + 24, y + 126); });
    y += 186;
    // gráfico acumulado
    if (AG.porDia.length) {
      const ch = 520; cartao(g, MG, y, PW - 2 * MG, ch, 'Acumulado no período', `R$ ${brl(AG.total)}`);
      const P = AG.porDia, x0 = MG + 110, x1 = PW - MG - 30, y0 = y + 90, y1 = y + ch - 60, top = Math.max(1, P[P.length - 1].acc) * 1.08;
      const X = i => x0 + i / Math.max(1, P.length - 1) * (x1 - x0), Y = v => y1 - v / top * (y1 - y0);
      g.font = `400 17px ${F.b}`; g.fillStyle = '#6B7472'; g.strokeStyle = '#F0F2F2'; g.lineWidth = 2;
      for (let k = 0; k <= 4; k++) { const v = top / 4 * k; g.beginPath(); g.moveTo(x0, Y(v)); g.lineTo(x1, Y(v)); g.stroke(); g.textAlign = 'right'; g.fillText(v >= 1000 ? (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k' : String(Math.round(v)), x0 - 12, Y(v) + 6); }
      g.textAlign = 'center'; for (let j = 0; j < 7; j++) { const i = Math.round(j / 6 * (P.length - 1)); g.fillText(P[i].d.slice(8, 10) + '/' + P[i].d.slice(5, 7), X(i), y1 + 34); } g.textAlign = 'left';
      g.fillStyle = 'rgba(23,107,55,.35)'; P.forEach((p, i) => { if (p.v) g.fillRect(X(i) - 4, Y(p.v), 8, y1 - Y(p.v)); });
      g.beginPath(); g.moveTo(X(0), Y(0)); let pv = 0; P.forEach((p, i) => { g.lineTo(X(i), Y(pv)); g.lineTo(X(i), Y(p.acc)); pv = p.acc; }); g.lineTo(X(P.length - 1), Y(0)); g.closePath(); g.fillStyle = 'rgba(40,190,82,.12)'; g.fill();
      g.beginPath(); g.moveTo(X(0), Y(0)); pv = 0; P.forEach((p, i) => { g.lineTo(X(i), Y(pv)); g.lineTo(X(i), Y(p.acc)); pv = p.acc; }); g.strokeStyle = '#28BE52'; g.lineWidth = 4; g.stroke();
      y += ch + 30;
    }
    rodape(g, 1);
    // página 2: categorias, clientes/pagamento, destaques
    g = nova(); y = MG;
    const nC = Math.min(8, AG.porCat.length);
    cartao(g, MG, y, PW - 2 * MG, 90 + nC * 58, 'Por categoria', `${AG.porCat.length} tipo(s)`); barras(g, AG.porCat, MG + 28, y + 100, PW - 2 * MG - 56, 8); y += 120 + nC * 58;
    const seg = tem.cli ? ['Maiores clientes', AG.top.filter(x => x.k !== '—')] : tem.pag ? ['Por forma de pagamento', AG.porPag] : null;
    if (seg && seg[1].length) { const n2 = Math.min(8, seg[1].length); cartao(g, MG, y, PW - 2 * MG, 90 + n2 * 58, seg[0], `top ${n2}`); barras(g, seg[1], MG + 28, y + 100, PW - 2 * MG - 56, 8); y += 120 + n2 * 58; }
    if (tem.cli && tem.pag && AG.porPag.length && y < PH - 600) { const n3 = Math.min(5, AG.porPag.length); cartao(g, MG, y, PW - 2 * MG, 90 + n3 * 58, 'Por forma de pagamento', `${AG.porPag.length}`); barras(g, AG.porPag, MG + 28, y + 100, PW - 2 * MG - 56, 5); y += 120 + n3 * 58; }
    g.font = `400 20px ${F.b}`;
    const notasL = AG.notas.map(([ic, t, cl]) => ({ ic, cl, ls: quebrar(g, limpo(t), PW - 2 * MG - 110) }));
    const hN = 70 + notasL.reduce((s, n) => s + n.ls.length * 30 + 26, 0);
    if (y + hN > PH - 120) { rodape(g, pgs.length); g = nova(); y = MG; g.font = `400 20px ${F.b}`; }
    cartao(g, MG, y, PW - 2 * MG, hN, 'Destaques', 'leitura rápida'); let yy = y + 92;
    for (const n of notasL) { g.fillStyle = n.cl ? '#FFF5E5' : '#EAF8EF'; rr(g, MG + 24, yy - 22, 38, 38, 8); g.fill(); g.font = `600 18px ${F.m}`; g.fillStyle = n.cl ? '#B26B00' : '#176B37'; g.textAlign = 'center'; g.fillText(n.ic, MG + 43, yy + 4); g.textAlign = 'left'; g.font = `400 20px ${F.b}`; g.fillStyle = '#2B3634'; n.ls.forEach((l, i) => g.fillText(l, MG + 82, yy + 4 + i * 30)); yy += n.ls.length * 30 + 26; }
    rodape(g, pgs.length);
    // páginas da tabela
    const cols = [tem.dt ? ['Data', 130, r => (r.dt ? r.dt.split('-').reverse().join('/') : '')] : null, tem.num ? ['Nº', 90, r => r.num] : null, [tem.cli ? 'Cliente' : 'Descrição', 0, r => r.cli || '—'], ['Categoria', 260, r => r.cat], ['Valor (R$)', 170, r => brl(r.v)]].filter(Boolean);
    const fixo = cols.reduce((s, c) => s + c[1], 0), livre = PW - 2 * MG - fixo; cols.forEach(c => { if (!c[1]) c[1] = livre; });
    const linhas = rel.rows.slice().sort((a, b) => (a.dt || '').localeCompare(b.dt || '')), POR = 34;
    for (let p = 0; p < linhas.length; p += POR) {
      g = nova(); y = MG;
      g.font = `800 34px ${F.d}`; g.fillStyle = '#111A19'; g.fillText('TODOS OS REGISTROS', MG, y + 30); g.font = `400 19px ${F.b}`; g.fillStyle = '#6B7472'; g.fillText(`${p + 1}–${Math.min(linhas.length, p + POR)} de ${linhas.length}`, MG, y + 62);
      y += 90; g.fillStyle = '#F7F9F8'; g.fillRect(MG, y, PW - 2 * MG, 44); let x = MG + 14; g.font = `600 15px ${F.b}`; g.fillStyle = '#6B7472';
      cols.forEach(([n, w], i) => { if (i === cols.length - 1) { g.textAlign = 'right'; g.fillText(n.toUpperCase(), x + w - 28, y + 28); g.textAlign = 'left'; } else g.fillText(n.toUpperCase(), x, y + 28); x += w; });
      y += 44;
      for (const r of linhas.slice(p, p + POR)) {
        x = MG + 14; g.font = `400 18px ${F.b}`; g.fillStyle = r.ok ? '#111A19' : '#8C9997';
        cols.forEach(([, w, f], i) => { let t = String(f(r) || ''); g.font = i === cols.length - 1 || /Data|Nº/.test(cols[i][0]) ? `500 18px ${F.m}` : `400 18px ${F.b}`; while (g.measureText(t).width > w - 20 && t.length > 3) t = t.slice(0, -2); if (t !== String(f(r) || '')) t = t.slice(0, -1) + '…'; if (i === cols.length - 1) { g.textAlign = 'right'; g.fillText(t, x + w - 28, y + 28); g.textAlign = 'left'; if (!r.ok) { const tw = g.measureText(t).width; g.fillRect(x + w - 28 - tw, y + 22, tw, 2); } } else g.fillText(t, x, y + 28); x += w; });
        g.fillStyle = '#F0F2F2'; g.fillRect(MG, y + 39, PW - 2 * MG, 2); y += 40;
      }
      if (p + POR >= linhas.length) { g.fillStyle = '#F7F9F8'; g.fillRect(MG, y + 4, PW - 2 * MG, 48); g.font = `600 20px ${F.b}`; g.fillStyle = '#111A19'; g.fillText(`Total válido (${AG.qtd} registros)`, MG + 14, y + 36); g.font = `700 20px ${F.m}`; g.textAlign = 'right'; g.fillText(`R$ ${brl(AG.total)}`, PW - MG - 14, y + 36); g.textAlign = 'left'; }
      rodape(g, pgs.length);
    }
    return pgs;
  }
  async function pdfDe(cvs) {
    const enc = new TextEncoder(), partes = [], offs = []; let pos = 0;
    const push = x => { const b = typeof x === 'string' ? enc.encode(x) : x; partes.push(b); pos += b.length; };
    const imgs = [];
    for (const c of cvs) { const b = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.88)); imgs.push(new Uint8Array(await b.arrayBuffer())); }
    push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
    const obj = (id, f) => { offs[id] = pos; push(`${id} 0 obj\n`); f(); push('\nendobj\n'); };
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push(`<< /Type /Pages /Kids [${imgs.map((_, i) => `${3 + 3 * i} 0 R`).join(' ')}] /Count ${imgs.length} >>`));
    const W = 595, H = 842;
    imgs.forEach((im, i) => {
      const P = 3 + 3 * i, C = P + 1, I = P + 2, cs = `q ${W} 0 0 ${H} 0 0 cm /Im${i} Do Q`;
      obj(P, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im${i} ${I} 0 R >> >> /Contents ${C} 0 R >>`));
      obj(C, () => { push(`<< /Length ${cs.length} >>\nstream\n`); push(cs); push('\nendstream'); });
      obj(I, () => { push(`<< /Type /XObject /Subtype /Image /Width ${PW} /Height ${PH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.length} >>\nstream\n`); push(im); push('\nendstream'); });
    });
    const total = 3 + 3 * imgs.length, xref = pos;
    let x = `xref\n0 ${total}\n0000000000 65535 f \n`; for (let k = 1; k < total; k++) x += String(offs[k]).padStart(10, '0') + ' 00000 n \n';
    push(x); push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(partes, { type: 'application/pdf' });
  }
  let logoData = null;
  async function logo() {
    if (logoData) return logoData;
    try { const b = await (await fetch('assets/kwik-simbolo.png')).blob(); logoData = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); } catch (e) { logoData = ''; }
    return logoData;
  }
  const nomeArq = (rel, ext) => `${rel.meta.titulo || 'Relatorio'}${rel.ag.periodo ? ' ' + rel.ag.periodo : ''}${rel.meta.empresa ? ' ' + rel.meta.empresa : ''} KWIK.${ext}`.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
  function baixar(blob, nome) {
    const arq = new File([blob], nome, { type: blob.type });
    if (window.matchMedia('(max-width: 760px)').matches && navigator.canShare && navigator.canShare({ files: [arq] })) return navigator.share({ files: [arq], title: nome }).catch(() => {});
    const a = el('a', { href: URL.createObjectURL(blob), download: nome }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  }
  async function baixarHtml(rel) { baixar(new Blob([htmlRelatorio(rel, await logo())], { type: 'text/html' }), nomeArq(rel, 'html')); }
  async function baixarPdf(rel, bt) {
    const t = bt && bt.textContent; if (bt) { bt.disabled = true; bt.textContent = 'Gerando o PDF…'; }
    try {
      await Promise.all(['800 40px Montserrat', '700 40px Montserrat'].map(f => document.fonts.load(f).catch(() => null)));
      const img = new Image(); img.src = await logo(); await img.decode().catch(() => null);
      baixar(await pdfDe(await paginas(rel, img.naturalWidth ? img : null)), nomeArq(rel, 'pdf'));
    } catch (e) { A().toast('Não consegui gerar o PDF: ' + e.message, { erro: true }); }
    if (bt) { bt.disabled = false; bt.textContent = t; }
  }

  // ------------------------------------------------------------------ tela do app
  const st = { texto: '', tab: null, map: {}, meta: { titulo: 'Faturamento', empresa: '', fonte: 'planilha enviada', rotTotal: '', obs: '' } };
  let corpo = null;
  function abrir(c, acoes) { corpo = c; void acoes; render(); }
  function sair() { corpo = null; }
  function render() {
    if (!corpo || !corpo.isConnected) return;
    corpo.innerHTML = '';
    const w = el('div', { class: 'rp' });
    w.append(el('div', { class: 'rp-intro' }, el('h2', {}, '📄 Gerar relatório a partir de uma planilha'),
      el('p', {}, 'No Excel ou no Google Planilhas, selecione a tabela (com a linha dos títulos) e copie (Ctrl+C). Cole aqui embaixo (Ctrl+V). Também dá para escolher um arquivo .csv. O relatório sai no padrão KWIK, em HTML e PDF.')));
    const ta = el('textarea', { class: 'rp-cola', rows: 7, placeholder: 'Cole a planilha aqui…\n\nNúmero\tData\tTomador\tValor\tSituação\tServiço\n105\t30/09/2026\tCliente A\t450,00\tNormal\tConsulta' });
    ta.value = st.texto;
    const arq = el('input', { type: 'file', accept: '.csv,.tsv,.txt', hidden: true, onchange: async e => { const f = e.target.files[0]; if (!f) return; const buf = await f.arrayBuffer(); let t = new TextDecoder('utf-8').decode(buf); if (t.includes('\uFFFD')) t = new TextDecoder('windows-1252').decode(buf); st.texto = t; ler(); } });
    const ler = () => {
      st.tab = separar(st.texto);
      if (st.tab.length < 2) { st.tab = null; A().toast('Não achei a tabela: confira se copiou com a linha dos títulos 🙂'); return render(); }
      st.map = detectar(st.tab); render();
      setTimeout(() => { const p = document.querySelector('.rp-passo2'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
    };
    ta.addEventListener('paste', () => setTimeout(() => { st.texto = ta.value; ler(); }, 30));
    ta.addEventListener('input', () => { st.texto = ta.value; });
    w.append(ta, el('div', { class: 'rp-bts' }, el('button', { class: 'bt prim', onclick: () => { st.texto = ta.value; ler(); } }, '🔎 Ler a planilha'), el('label', { class: 'bt' }, '📂 Escolher arquivo .csv', arq),
      st.tab ? el('button', { class: 'bt', onclick: () => { st.texto = ''; st.tab = null; render(); } }, 'Limpar') : null));
    if (st.tab) passo2(w);
    corpo.append(w);
  }
  function passo2(w) {
    const cab = st.tab[0], box = el('div', { class: 'rp-passo2' });
    box.append(el('h3', {}, `✅ ${st.tab.length - 1} linhas e ${cab.length} colunas. Confira o que é cada coluna:`));
    const g = el('div', { class: 'rp-map' });
    for (const [k, c] of Object.entries(CAMPOS)) g.append(el('label', {}, el('span', {}, c.nome + (k === 'v' ? ' *' : '')),
      el('select', { onchange: e => { st.map[k] = e.target.value === '' ? null : +e.target.value; render(); } }, el('option', { value: '' }, '— não tem —'), cab.map((h, i) => el('option', { value: i, selected: st.map[k] === i }, h || `Coluna ${i + 1}`)))));
    box.append(g);
    const inp = (k, rot, ph) => el('label', {}, el('span', {}, rot), el('input', { type: 'text', value: st.meta[k] || '', placeholder: ph, maxlength: 80, oninput: e => { st.meta[k] = e.target.value; } }));
    box.append(el('div', { class: 'rp-map' }, inp('titulo', 'Título do relatório', 'Faturamento'), inp('empresa', 'Empresa (cliente da KWIK)', 'Ex.: Clínica Bem-Estar'), inp('fonte', 'Fonte dos dados', 'Ex.: NFS-e emitidas (SEMFAZ)'), inp('obs', 'Observação no rodapé (opcional)', '')));
    // prévia
    const prev = el('div', { class: 'rp-prev' }), t = el('table');
    t.append(el('thead', {}, el('tr', {}, cab.map((h, i) => el('th', { class: Object.values(st.map).includes(i) ? 'usada' : '' }, h, el('small', {}, Object.entries(st.map).filter(([, v]) => v === i).map(([k]) => CAMPOS[k].nome).join(', ')))))));
    t.append(el('tbody', {}, st.tab.slice(1, 7).map(r => el('tr', {}, cab.map((_, i) => el('td', {}, r[i] || ''))))));
    prev.append(t); box.append(prev);
    if (st.map.v == null) box.append(el('p', { class: 'se-alerta' }, '⚠️ Escolha a coluna do Valor para gerar o relatório.'));
    else {
      const rows = normalizar(st.tab, st.map), ag = analisar(rows, st.meta);
      box.append(el('div', { class: 'rp-resumo' }, el('div', {}, el('small', {}, 'Total válido'), el('b', {}, 'R$ ' + brl(ag.total))), el('div', {}, el('small', {}, 'Registros'), el('b', {}, `${ag.qtd}${ag.fora ? ` (+${ag.fora} fora)` : ''}`)),
        el('div', {}, el('small', {}, 'Período'), el('b', {}, ag.periodo || '—')), el('div', {}, el('small', {}, 'Categorias'), el('b', {}, String(ag.porCat.length)))));
      box.append(el('div', { class: 'rp-bts' }, el('button', { class: 'bt prim', onclick: () => gerar(rows, ag) }, '✨ Gerar relatório')));
    }
    w.append(box);
  }
  async function gerar(rows, ag) {
    const tem = { dt: st.map.dt != null, cli: st.map.cli != null, pag: st.map.pag != null, num: st.map.num != null };
    const rel = { rows: rows.slice(0, 3000), ag, meta: { ...st.meta, titulo: st.meta.titulo || 'Relatório' }, tem };
    const salvo = { id: KM.marketing._u.agoraId('planilha'), tipo: 'planilha', criadoEm: KM.marketing._u.agoraIso(), funcionario: { id: 'relatorio', nome: 'Gerar relatório' },
      tarefa: 'Relatório de planilha', titulo: `${rel.meta.titulo}${ag.periodo ? ' ' + ag.periodo : ''}${rel.meta.empresa ? ' · ' + rel.meta.empresa : ''}`, rel, duracao: 3 };
    try { await A().BK().salvarRelatorio(salvo); await A().carregarRelatorios(KM.resumoRelatorio(salvo)); } catch (e) { A().toast('Não salvei nos Relatórios (' + e.message + '), mas o arquivo sai normalmente.', { ms: 7000 }); }
    corpo.innerHTML = '';
    corpo.append(el('div', { class: 'rp' }, el('div', { class: 'rp-bts rp-topo' }, el('button', { class: 'bt', onclick: () => render() }, '‹ Voltar à planilha'), el('b', {}, salvo.titulo))));
    mostrar(rel, corpo.firstChild);
  }
  async function mostrar(rel, box) {
    const ifr = el('iframe', { class: 'rp-iframe', title: 'Relatório' });
    const btP = el('button', { class: 'bt prim', onclick: e => baixarPdf(rel, e.currentTarget) }, '⬇️ Baixar PDF');
    box.append(el('div', { class: 'rp-bts' }, btP, el('button', { class: 'bt prim', onclick: () => baixarHtml(rel) }, '⬇️ Baixar HTML'),
      el('button', { class: 'bt', onclick: async () => { const u = URL.createObjectURL(new Blob([htmlRelatorio(rel, await logo())], { type: 'text/html' })); window.open(u, '_blank'); } }, '↗ Abrir em outra aba')), ifr);
    ifr.srcdoc = htmlRelatorio(rel, await logo());
  }
  function renderRel(r, box) { box.append(el('p', { class: 'vazio', style: 'margin-top:0' }, `${r.rel.rows.length} linhas · ${r.rel.ag.periodo || ''}`)); mostrar(r.rel, box); }
  KM.relPlanilha = { separar, detectar, normalizar, analisar, htmlRelatorio, renderRel, paginas, pdfDe };
  KM.inicio.registrar('relatorio', { abrir, sair, resumo: () => ({ txt: 'Cole a planilha → HTML e PDF', ticker: '' }) });
})();
