/* KWIK Mini Escritório · setor Financeiro (Rodrigo, tio do Kauã).
   Ao trabalhar ele pergunta: ações, fundos imobiliários ou renda fixa? E quanto você quer investir por mês.
   O PC (servidor.py) ou o GitHub (nuvem.py) buscam os dados públicos do dia (financas.py: Fundamentus, B3, Banco Central e
   Tesouro Direto); aqui no app ele filtra, dá nota, monta o ranking e simula quanto você vai ter (e quanto vai receber por mês).
   É uma análise automática por critérios objetivos: NÃO é recomendação de investimento. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const U = () => KM.marketing._u;
  const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
  const brl0 = v => 'R$ ' + Math.round(Number(v) || 0).toLocaleString('pt-BR');
  const pct = (v, c = 1) => (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }) + '%';
  // aceita "1.000", "1.000,50", "1000", "1000.5"
  const num = s => {
    let t = String(s ?? '').replace(/[^\d,.-]/g, ''); if (!t) return 0;
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    return Math.max(0, Number(t) || 0);
  };
  const CAT = {
    acoes: { ic: '🏦', nome: 'Ações que pagam dividendos', desc: 'Empresas da bolsa com bons dividendos, lucro e preço' },
    fii: { ic: '🏢', nome: 'Fundos imobiliários (FIIs)', desc: 'Aluguel mensal isento de IR, com preço justo e liquidez' },
    rendafixa: { ic: '🛡️', nome: 'Renda fixa', desc: 'Tesouro Direto, CDB, LCI/LCA e poupança: onde rende mais' },
  };
  const AVISO = 'Análise automática com dados públicos e critérios objetivos. Não é recomendação de investimento: rentabilidade passada não garante rentabilidade futura e ações/FIIs podem cair. Antes de investir, confira na sua corretora e, se precisar, fale com um profissional certificado.';

  // ------------------------------------------------------------------ análise (a partir dos dados do dia)
  const raiz = p => p.replace(/\d+$/, '');
  function analisar(rel) {
    const d = rel.dados || {};
    if (rel.categoria === 'rendafixa') return analisarRendaFixa(d);
    if (rel.categoria === 'fii') {
      const ifix = new Set(d.ifix || []), todos = (d.fiis || []).map(x => ({ ...x, ifix: ifix.has(x.papel) }));
      const bons = todos.filter(x => x.liq >= 500000 && x.pvp >= 0.7 && x.pvp <= 1.15 && x.dy >= 6 && x.dy <= 18 && x.valorMercado >= 3e8 && x.vacancia <= 20);
      for (const x of bons) {
        x.nota = Math.min(x.dy, 15) * 1.6 + (1 - x.pvp) * 18 + (x.ifix ? 3 : 0) + Math.log10(Math.max(x.liq, 1)) / 2 - x.vacancia / 5 + Math.min(x.imoveis, 20) / 10;
        x.motivos = [`DY ${pct(x.dy)}`, `P/VP ${x.pvp.toFixed(2).replace('.', ',')}`, x.segmento || 'segmento —'].concat(x.vacancia ? [`vacância ${pct(x.vacancia)}`] : [], x.ifix ? ['faz parte do IFIX'] : []);
      }
      const ranking = bons.sort((a, b) => b.nota - a.nota).slice(0, 15);
      return {
        ranking, analisadas: todos.length, aprovadas: bons.length,
        pagadoras: todos.filter(x => x.liq >= 500000 && x.dy > 0 && x.dy <= 25 && x.pvp > 0.4).sort((a, b) => b.dy - a.dy).slice(0, 10),
        custo: bons.filter(x => x.dy >= 9).sort((a, b) => a.pvp - b.pvp).slice(0, 8),
        criterios: 'Liquidez ≥ R$ 500 mil/dia, P/VP entre 0,70 e 1,15, DY entre 6% e 18%, valor de mercado ≥ R$ 300 milhões e vacância ≤ 20%. A nota pesa dividendos, desconto sobre o patrimônio (P/VP), liquidez, quantidade de imóveis, vacância e quem está no IFIX.',
        isento: 'Rendimentos de FIIs são isentos de IR para pessoa física (fundos com 100+ cotistas e cotas negociadas em bolsa).',
      };
    }
    const idiv = new Set(d.idiv || []), todas = (d.acoes || []).map(x => ({ ...x, idiv: idiv.has(x.papel) }));
    const boas = todas.filter(x => x.liq >= 2e6 && x.dy >= 4 && x.dy <= 20 && x.pl > 0 && x.pl <= 25 && x.pvp > 0 && x.pvp <= 4 && x.roe >= 8 && x.divida <= 2.5 && x.margem > 0);
    for (const x of boas) {
      x.nota = Math.min(x.dy, 16) * 2.2 + Math.min(x.roe, 35) / 4 - x.pvp * 1.5 - x.pl / 6 + (x.idiv ? 4 : 0) + Math.log10(Math.max(x.liq, 1)) / 2 - Math.max(x.divida, 0);
      x.motivos = [`DY ${pct(x.dy)}`, `ROE ${pct(x.roe, 0)}`, `P/L ${x.pl.toFixed(1).replace('.', ',')}`, `P/VP ${x.pvp.toFixed(2).replace('.', ',')}`].concat(x.idiv ? ['faz parte do IDIV (índice de dividendos)'] : []);
    }
    const vistas = new Set(), ranking = [];
    for (const x of boas.sort((a, b) => b.nota - a.nota)) { if (vistas.has(raiz(x.papel))) continue; vistas.add(raiz(x.papel)); ranking.push(x); }
    return {
      ranking: ranking.slice(0, 15), analisadas: todas.length, aprovadas: boas.length,
      pagadoras: todas.filter(x => x.liq >= 1e6 && x.dy > 0 && x.dy <= 30 && x.pl > 0).sort((a, b) => b.dy - a.dy).slice(0, 10),
      custo: boas.filter(x => x.dy >= 7).sort((a, b) => a.pvp / a.dy - b.pvp / b.dy).slice(0, 8),
      criterios: 'Liquidez ≥ R$ 2 milhões/dia, DY entre 4% e 20%, P/L entre 0 e 25, P/VP ≤ 4, ROE ≥ 8%, margem positiva e dívida líquida/patrimônio ≤ 2,5. A nota pesa mais os dividendos e depois ROE, preço (P/L e P/VP), dívida, liquidez e quem está no IDIV (índice de dividendos da B3). Uma ação por empresa.',
      isento: 'Dividendos de ações são isentos de IR para a maioria das pessoas (desde 2026 só há retenção de 10% acima de R$ 50 mil por mês de uma mesma empresa). JCP tem 15% retido na fonte.',
    };
  }
  function analisarRendaFixa(d) {
    const ind = d.indicadores || {}, tit = d.tesouro || [];
    const selic = ind.selic ?? (ind.cdi != null ? ind.cdi + 0.1 : 0), cdi = ind.cdi ?? selic - 0.1, ipca = ind.ipca12m ?? 4.5;
    const ano = new Date().getFullYear();
    const escolher = (pref, alvoAnos, sem = 'Juros') => {
      const c = tit.filter(t => t.titulo.startsWith(pref) && !t.titulo.includes(sem) && (pref === 'Tesouro Selic' || t.taxa > 0));
      if (!c.length) return null;
      return alvoAnos == null ? c.sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0] : c.sort((a, b) => Math.abs(+a.vencimento.slice(0, 4) - ano - alvoAnos) - Math.abs(+b.vencimento.slice(0, 4) - ano - alvoAnos))[0];
    };
    const tSelic = escolher('Tesouro Selic', null), tPre = escolher('Tesouro Prefixado', 3), tIpca = escolher('Tesouro IPCA+', 8);
    const poup = (Math.pow(1 + (ind.poupancaMes ?? 0.5) / 100, 12) - 1) * 100;
    const ops = [
      { nome: 'Poupança', bruta: poup, ir: false, garantia: 'FGC', liquidez: 'diária', obs: 'Isenta de IR. Rende 0,5% ao mês + TR com a Selic acima de 8,5%.' },
      { nome: 'Tesouro Selic' + (tSelic ? ' ' + tSelic.vencimento.slice(0, 4) : ''), bruta: selic + (tSelic ? tSelic.taxa : 0), ir: true, custodia: 0.2, garantia: 'Tesouro Nacional', liquidez: 'diária (D+1)', obs: 'O investimento mais seguro do país. Custódia de 0,2% ao ano só acima de R$ 10 mil.' },
      { nome: 'CDB 100% do CDI', bruta: cdi, ir: true, garantia: 'FGC até R$ 250 mil', liquidez: 'diária', obs: 'Comum em bancos digitais com liquidez diária.' },
      { nome: 'CDB 110% do CDI (banco médio)', bruta: cdi * 1.1, ir: true, garantia: 'FGC até R$ 250 mil', liquidez: 'no vencimento (1 a 3 anos)', obs: 'Paga mais em troca de prazo; fique dentro do limite do FGC por banco.' },
      { nome: 'LCI/LCA 92% do CDI', bruta: cdi * 0.92, ir: false, garantia: 'FGC até R$ 250 mil', liquidez: 'carência de 9 a 12 meses', obs: 'Isenta de IR para pessoa física.' },
    ];
    if (tPre) ops.push({ nome: `Tesouro Prefixado ${tPre.vencimento.slice(0, 4)}`, bruta: tPre.taxa, ir: true, custodia: 0.2, garantia: 'Tesouro Nacional', liquidez: 'diária (o preço oscila antes do vencimento)', obs: `Taxa travada de ${pct(tPre.taxa, 2)} ao ano até o vencimento.` });
    if (tIpca) ops.push({ nome: `Tesouro IPCA+ ${tIpca.vencimento.slice(0, 4)}`, bruta: ((1 + tIpca.taxa / 100) * (1 + ipca / 100) - 1) * 100, ir: true, custodia: 0.2, garantia: 'Tesouro Nacional', liquidez: 'diária (o preço oscila antes do vencimento)', obs: `IPCA + ${pct(tIpca.taxa, 2)} ao ano (estimado com o IPCA de 12 meses: ${pct(ipca, 2)}). Protege da inflação no longo prazo.` });
    for (const o of ops) { o.liquida = o.bruta * (o.ir ? 0.85 : 1) - (o.custodia || 0) * 0.5; o.real = ((1 + o.liquida / 100) / (1 + ipca / 100) - 1) * 100; }
    const ranking = ops.sort((a, b) => b.liquida - a.liquida);
    return {
      ranking, indicadores: { selic, cdi, ipca }, tesouroData: tit[0] && tit[0].dataBase,
      criterios: 'Rendimento líquido estimado para quem deixa o dinheiro mais de 2 anos (IR de 15% sobre o ganho; LCI, LCA e poupança são isentas; custódia do Tesouro considerada). CDB e LCI/LCA usam taxas típicas do mercado: confira a oferta da sua corretora.',
    };
  }

  // ------------------------------------------------------------------ simulação
  function simular(cat, an, aporte, anos) {
    const meses = anos * 12;
    if (cat === 'rendafixa') {
      const best = an.ranking[0];
      const i = Math.pow(1 + best.bruta / 100, 1 / 12) - 1;
      const fv = i ? aporte * (Math.pow(1 + i, meses) - 1) / i : aporte * meses;
      const inv = aporte * meses, ganho = fv - inv;
      const aliq = !best.ir ? 0 : anos <= 0.5 ? 0.225 : anos <= 1 ? 0.2 : anos <= 2 ? 0.175 : 0.15;
      const liquido = inv + ganho * (1 - aliq);
      return { investido: inv, total: liquido, ganho: liquido - inv, renda: liquido * (Math.pow(1 + best.liquida / 100, 1 / 12) - 1), taxa: best.liquida, opcao: best.nome };
    }
    const top = an.ranking.slice(0, 5);
    const dyMedio = top.length ? top.reduce((s, x) => s + x.dy, 0) / top.length : 0;
    // conservador: dividendos muito altos costumam ter parte extraordinária (não se repete todo ano)
    const teto = cat === 'fii' ? 12 : 10, dy = Math.min(dyMedio, teto);
    const i = Math.pow(1 + dy / 100, 1 / 12) - 1;
    const fv = i ? aporte * (Math.pow(1 + i, meses) - 1) / i : aporte * meses;
    const inv = aporte * meses;
    return { investido: inv, total: fv, ganho: fv - inv, renda: fv * dy / 100 / 12, taxa: dy,
      opcao: `carteira com as 5 primeiras do ranking (DY médio de ${pct(dyMedio)}${dyMedio > teto ? `; na conta usamos no máximo ${pct(teto, 0)} ao ano para não exagerar` : ''})` };
  }

  // ------------------------------------------------------------------ trabalhar
  const ROTEIRO_NUVEM = [[0, 'Pedido enviado ao GitHub 📨', 6], [5, 'Ligando o computador da nuvem…', 14], [14, 'Abrindo os dados da bolsa 📊', 30], [22, 'Lendo os indicadores…', 50],
    [32, 'Conferindo os índices da B3…', 70], [44, 'Organizando os números…', 88], [80, 'A fila do GitHub está mais lenta hoje, já já sai…', 94]];
  async function trabalhar(f, p) {
    if (p.trabalhando || U().semConexao()) return;
    const eu = f.nome.split(' ')[0], cfg = A().cfg();
    const cat = await A().escolher(`📈 O que ${eu} vai analisar hoje?`, Object.entries(CAT).map(([v, c]) => ({ v, ic: c.ic, nome: c.nome, desc: c.desc })));
    if (!cat) return;
    cfg.financas = cfg.financas || {};
    const resp = await A().perguntar(`${CAT[cat].ic} Quanto você quer investir por mês?`, [{ id: 'aporte', rotulo: 'Valor por mês (R$)', placeholder: `Ex.: ${cfg.financas.aporte || 500}` }], '📊 Analisar e simular');
    if (!resp) return;
    const aporte = num(resp.aporte) || Number(cfg.financas.aporte) || 500;
    cfg.financas.aporte = aporte; A().salvar();
    if (!(await A().esperarLivre(p, 1500))) return A().toast(`Espere ${eu} terminar o que está fazendo 😉`);
    const BK = A().BK();
    const pedido = { id: U().agoraId('financas'), funcionario: { id: f.id, nome: f.nome }, ganho: Number(cfg.economia.valorTarefa) || 0, tipo: 'financas', opcoes: { categoria: cat, aporte }, criadoEm: new Date().toISOString() };
    let tarefa;
    try { tarefa = await BK.iniciar(pedido); } catch (e) { return A().toast('Não consegui mandar a análise: ' + e.message, { erro: true, ms: 8000 }); }
    p.trabalhando = true; p.digitando = true; A().estado.trabalhoDe.financas = true;
    if (p.modo !== 'sentado') await KM.voltarSentar(p);
    A().pagar(f, p);
    A().iniciarPainelTarefa(`${CAT[cat].ic} ${CAT[cat].nome} · ${brl0(aporte)}/mês`);
    A().falar(p.id, 'Deixa comigo! Vou abrir a bolsa 📈', 2400);
    A().atualizarBotoes();
    const cb = A().callbacksTarefa(p, false); cb.roteiro = ROTEIRO_NUVEM;
    const fim = await BK.acompanhar(tarefa, cb);
    p.trabalhando = false; p.digitando = false; A().estado.trabalhoDe.financas = false; A().atualizarBotoes();
    if (fim.status !== 'pronto') { A().falar(p.id, 'A bolsa não respondeu agora 😓', 3000); return A().toast(`${eu}: ` + (fim.erro || 'falhou'), { erro: true, ms: 9000 }); }
    await A().carregarRelatorios(fim.relatorio);
    try {
      const rel = await A().obterRelatorio(fim.relatorio.id), an = analisar(rel);
      cfg.financas.ticker = cat === 'rendafixa' ? an.ranking.slice(0, 4).map(o => [o.nome.replace(/\s+\d{4}$/, '').split(' ').slice(0, 2).join(' ').toUpperCase(), 1]) : an.ranking.slice(0, 8).map(x => [x.papel, x.dy >= 8 ? 1 : 0]);
      A().salvar();
      const s = simular(cat, an, aporte, 10);
      A().falar(p.id, cat === 'rendafixa' ? `Melhor hoje: ${an.ranking[0].nome} 💰` : `Top 1: ${an.ranking[0] ? an.ranking[0].papel : '—'} 📈`, 3200);
      A().toast(`📈 ${eu}: com ${brl0(aporte)}/mês, em 10 anos ~${brl0(s.total)} (renda de ~${brl0(s.renda)}/mês).`, { botao: ['Ver análise', () => A().abrirRelatorio(rel.id)], ms: 12000 });
    } catch (e) { A().toast(`📈 ${eu} terminou a análise.`, { botao: ['Ver', () => A().abrirRelatorio(fim.relatorio.id)], ms: 10000 }); }
    await A().concluir(f, p);
  }

  // ------------------------------------------------------------------ relatório
  function renderRel(r, box) {
    const { el, fmtData } = A();
    const cat = r.categoria || 'acoes', c = CAT[cat] || CAT.acoes;
    let an;
    try { an = analisar(r); } catch (e) { box.append(el('div', { class: 'rel' }, el('h2', {}, 'Não consegui ler os dados desta análise 😕'))); return; }
    const rel = el('div', { class: 'rel fin' });
    rel.append(el('div', { class: 'rel-cab' },
      el('div', {}, el('h2', {}, `${c.ic} ${c.nome}`),
        el('p', {}, `Análise de ${r.funcionario?.nome || 'Rodrigo'} em ${fmtData(r.criadoEm)}` + (an.analisadas ? ` · ${an.analisadas} analisados, ${an.aprovadas} passaram nos filtros` : '')),
        el('div', { class: 'chips' }, ((r.dados && r.dados.fontes) || []).map(f => el('span', { class: 'chip ok' }, '✓ ' + f)))),
      el('div', { class: 'rel-bts' }, el('button', { class: 'bt peq', onclick: () => baixarCsv(r, an) }, '⬇️ Planilha (CSV)'), el('button', { class: 'bt peq perigo', onclick: () => A().apagarRel(r) }, '🗑️ Apagar'))));
    rel.append(el('div', { class: 'obs aviso-fin' }, '⚠️ ' + AVISO));

    // simulação
    const inp = el('input', { type: 'text', inputmode: 'decimal', value: (r.aporte || (A().cfg().financas || {}).aporte || 500).toLocaleString('pt-BR') });
    const tabela = el('div', { class: 'sim-tab' }), grafico = el('canvas', { width: 640, height: 200, class: 'sim-graf' });
    const desenharSim = () => {
      const aporte = num(inp.value) || 0;
      tabela.innerHTML = '';
      if (!an.ranking.length) { tabela.append(el('p', { class: 'vazio' }, 'Nenhum ativo passou nos filtros hoje.')); return; }
      const linhas = [1, 3, 5, 10, 20].map(a => [a, simular(cat, an, aporte, a)]);
      tabela.append(el('table', {}, el('thead', {}, el('tr', {}, ['Prazo', 'Você investe', 'Você terá', 'Ganhou', cat === 'rendafixa' ? 'Rende por mês' : 'Dividendos por mês'].map(t => el('th', {}, t)))),
        el('tbody', {}, linhas.map(([a, s]) => el('tr', { class: a === 10 ? 'dest' : '' }, el('td', {}, `${a} ano${a > 1 ? 's' : ''}`), el('td', {}, brl0(s.investido)), el('td', {}, el('b', {}, brl0(s.total))), el('td', { class: 'pos' }, '+' + brl0(s.ganho)), el('td', {}, brl0(s.renda)))))));
      tabela.append(el('small', { class: 'vazio' }, cat === 'rendafixa'
        ? `Usando a melhor opção de hoje: ${linhas[0][1].opcao} (${pct(an.ranking[0].liquida, 2)} ao ano líquido), supondo que a taxa continue igual. Já desconta o IR pela tabela regressiva. Valores sem descontar a inflação.`
        : `Usando a ${linhas[0][1].opcao}, com os dividendos reinvestidos todo mês e sem contar se as cotas sobem ou caem. Valores sem descontar a inflação. ${an.isento}`));
      // gráfico: investido x patrimônio (20 anos)
      const g = grafico.getContext('2d'), W = grafico.width, H = grafico.height;
      g.clearRect(0, 0, W, H);
      const pts = []; for (let m = 0; m <= 240; m += 6) pts.push([m, simular(cat, an, aporte, m / 12 || 0.0001)]);
      const max = Math.max(1, ...pts.map(p => p[1].total));
      const X = m => 40 + (W - 56) * m / 240, Y = v => H - 24 - (H - 40) * v / max;
      g.strokeStyle = '#e9ecef'; g.lineWidth = 1; g.font = '11px Montserrat, sans-serif'; g.fillStyle = '#6b7774';
      for (let k = 0; k <= 4; k++) { const v = max * k / 4, y = Y(v); g.beginPath(); g.moveTo(40, y); g.lineTo(W - 16, y); g.stroke(); g.fillText(v >= 1e6 ? (v / 1e6).toFixed(1) + 'mi' : Math.round(v / 1000) + 'k', 2, y + 4); }
      [0, 5, 10, 15, 20].forEach(a => g.fillText(a + 'a', X(a * 12) - 6, H - 6));
      const linha = (fn, cor, area) => { g.beginPath(); pts.forEach(([m, s], i) => (i ? g.lineTo(X(m), Y(fn(s))) : g.moveTo(X(m), Y(fn(s))))); if (area) { g.lineTo(X(240), Y(0)); g.lineTo(X(0), Y(0)); g.closePath(); g.fillStyle = area; g.fill(); } else { g.strokeStyle = cor; g.lineWidth = 3; g.stroke(); } };
      linha(s => s.total, null, 'rgba(40,190,82,0.18)'); linha(s => s.total, '#28BE52'); linha(s => s.investido, '#adb5bd');
      g.fillStyle = '#1E8A45'; g.fillText('● patrimônio', W - 190, 16); g.fillStyle = '#868e96'; g.fillText('● quanto você investiu', W - 110, 16);
    };
    inp.addEventListener('input', desenharSim);
    rel.append(el('div', { class: 'sim' }, el('h3', {}, '🧮 Simulação: quanto você vai ganhar'),
      el('label', { class: 'sim-in' }, 'Investindo por mês: ', el('span', {}, 'R$'), inp), tabela, grafico));
    desenharSim();

    // rankings
    if (cat === 'rendafixa') {
      const ind = an.indicadores;
      rel.append(el('div', { class: 'chips', style: 'margin:12px 0' }, el('span', { class: 'chip' }, `Selic ${pct(ind.selic, 2)}`), el('span', { class: 'chip' }, `CDI ${pct(ind.cdi, 2)}`), el('span', { class: 'chip' }, `IPCA 12m ${pct(ind.ipca, 2)}`), an.tesouroData ? el('span', { class: 'chip' }, `Tesouro: taxas de ${an.tesouroData.split('-').reverse().join('/')}`) : null));
      rel.append(el('h3', {}, '🏆 Onde rende mais hoje (líquido, mais de 2 anos)'),
        el('div', { class: 'fin-tab' }, el('table', {}, el('thead', {}, el('tr', {}, ['#', 'Investimento', 'Bruto/ano', 'Líquido/ano', 'Acima da inflação', 'Garantia', 'Liquidez'].map(t => el('th', {}, t)))),
          el('tbody', {}, an.ranking.map((o, i) => el('tr', { class: i === 0 ? 'dest' : '' }, el('td', {}, String(i + 1)), el('td', {}, el('b', {}, o.nome), el('small', {}, o.obs)), el('td', {}, pct(o.bruta, 2)), el('td', {}, el('b', {}, pct(o.liquida, 2))), el('td', { class: o.real > 0 ? 'pos' : 'neg' }, pct(o.real, 2)), el('td', {}, o.garantia), el('td', {}, o.liquidez)))))));
    } else {
      const lista = (titulo, sub, itens) => el('div', { class: 'fin-bloco' }, el('h3', {}, titulo), el('p', { class: 'sub' }, sub),
        el('div', { class: 'fin-tab' }, el('table', {}, el('thead', {}, el('tr', {}, ['#', cat === 'fii' ? 'Fundo' : 'Ação', 'Cotação', 'DY 12m', 'P/VP', cat === 'fii' ? 'Segmento' : 'P/L', 'Por quê'].map(t => el('th', {}, t)))),
          el('tbody', {}, itens.map((x, i) => el('tr', { class: i < 3 && titulo.startsWith('🏆') ? 'dest' : '' }, el('td', {}, String(i + 1)), el('td', {}, el('b', {}, x.papel), x.idiv || x.ifix ? el('small', { class: 'tag-ind' }, x.idiv ? 'IDIV' : 'IFIX') : null),
            el('td', {}, brl(x.cotacao)), el('td', { class: 'pos' }, pct(x.dy)), el('td', {}, x.pvp.toFixed(2).replace('.', ',')), el('td', {}, cat === 'fii' ? (x.segmento || '—') : x.pl.toFixed(1).replace('.', ',')),
            el('td', {}, el('small', {}, (x.motivos || [`DY ${pct(x.dy)}`]).join(' · ')))))))));
      rel.append(lista(`🏆 Melhores ${cat === 'fii' ? 'fundos' : 'ações'} para dividendos hoje`, an.criterios, an.ranking.slice(0, 10)));
      rel.append(lista('💸 As que mais pagaram dividendos (12 meses)', 'Só por DY, sem outros filtros: cuidado com dividendos extraordinários (pagos uma vez só) e empresas em crise.', an.pagadoras));
      if (an.custo.length) rel.append(lista('⚖️ Melhor custo-benefício', cat === 'fii' ? 'Entre as aprovadas com DY ≥ 9%: as mais baratas em relação ao patrimônio (menor P/VP).' : 'Entre as aprovadas com DY ≥ 7%: mais dividendo por cada real pago acima do patrimônio (P/VP ÷ DY).', an.custo));
    }
    box.append(rel);
  }
  function baixarCsv(r, an) {
    const cat = r.categoria;
    const linhas = cat === 'rendafixa' ? [['Investimento', 'Bruto ao ano (%)', 'Líquido ao ano (%)', 'Acima da inflação (%)', 'Garantia', 'Liquidez']].concat(an.ranking.map(o => [o.nome, o.bruta.toFixed(2), o.liquida.toFixed(2), o.real.toFixed(2), o.garantia, o.liquidez]))
      : [['Papel', 'Cotação', 'DY (%)', 'P/VP', cat === 'fii' ? 'Segmento' : 'P/L', 'Nota']].concat(an.ranking.map(x => [x.papel, x.cotacao, x.dy, x.pvp, cat === 'fii' ? x.segmento : x.pl, x.nota.toFixed(1)]));
    const csv = '﻿' + linhas.map(l => l.map(v => `"${String(v).replace('.', ',').replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = A().el('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), download: `Rodrigo - ${CAT[cat].nome} ${String(r.criadoEm).slice(0, 10)}.csv` });
    document.body.append(a); a.click(); a.remove();
  }

  KM.financas = { trabalhar, renderRel, analisar, simular, CAT };
})();
