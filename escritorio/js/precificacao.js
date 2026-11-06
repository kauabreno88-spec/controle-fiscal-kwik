/* KWIK Mini Escritório · setor de Precificação (Dona Iva, avó do Kauã).
   Serviços tirados dos cartazes da KWIK (PF, PJ, BPO e consultoria) e comparados com uma pesquisa de mercado
   feita em novembro/2026 para São Luís (MA):
   - mercado local/online: planos anunciados para São Luís e faixas de preço levantadas em 2026;
   - referência nacional: Tabela Referencial de Honorários Contábeis 2026 da ASSCON (vigência 01/01 a 31/12/2026);
   - preços atuais da KWIK (cartaz "Planos mensais").
   Regra da Dona Iva para a sugestão:
   - com preço de mercado: fica entre a média de São Luís e a referência nacional (55% mercado + 45% referência),
     nunca abaixo do mínimo local + 10% nem acima do mais caro de São Luís;
   - sem preço público local: 75% da referência nacional (os preços em São Luís ficam bem abaixo da tabela nacional:
     planos locais de R$ 189 a R$ 450 contra R$ 800 de referência). */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const U = () => KM.marketing._u;
  const brl0 = v => v == null ? '—' : 'R$ ' + Math.round(v).toLocaleString('pt-BR');

  const FONTES = {
    asscon: { nome: 'Tabela Referencial de Honorários Contábeis 2026 (ASSCON)', url: 'https://shimizucontabil.com.br/wp-content/uploads/2026/01/Tabela-de-Honorarios-Contabeis-de-2026.pdf.pdf' },
    slz: { nome: 'Contabilidade.com: planos para São Luís-MA (R$ 189 a R$ 450)', url: 'https://contabilidade.com/contabilidade-online/cidades/nordeste/sao-luis-ma/' },
    ohub: { nome: 'oHub: preços de contabilidade mensal e abertura de empresa 2026', url: 'https://www.ohub.com.br/precos/contabilidade-mensal' },
    mei: { nome: 'Planos de MEI anunciados (Qipu R$ 49,90; ContWeb R$ 49; Me Conti R$ 147 a R$ 247)', url: 'https://meconti.com.br/planos.html' },
    simples: { nome: 'Faixas 2026 para Simples Nacional (serviços R$ 150–700; comércio R$ 200–1.000)', url: 'https://www.facilite.co/quanto-custa-contador-mensal' },
    irpf: { nome: 'Preço de declaração de IR em 2026 (R$ 200–500 simples; acima de R$ 500 complexas)', url: 'https://catracalivre.com.br/noticias/quanto-custa-contratar-um-contador-para-o-imposto-de-renda-em-2026/' },
    bpo: { nome: 'BPO financeiro 2026 (pequenas empresas R$ 800–3.000/mês)', url: 'https://gestaoclick.com.br/blog/bpo-financeiro/' },
  };
  // [nome, unidade, mercadoMin, mercadoMax, referênciaASSCON, KWIK atual, fontes, observação]
  const GRUPOS = {
    pf: { ic: '👤', nome: 'Pessoa Física (5 serviços)', itens: [
      ['Imposto de Renda PF (simples)', 'por declaração', 200, 500, 300, null, ['irpf', 'asscon'], 'Declaração individual'],
      ['Imposto de Renda PF (completa)', 'por declaração', 400, 1000, 390, null, ['irpf', 'asscon'], 'Com dependentes, aluguéis, investimentos'],
      ['Carnê-Leão', 'por mês', null, null, 50, null, ['asscon'], 'Cálculo e DARF mensal'],
      ['Ganho de capital (GCAP)', 'por apuração', null, null, 350, null, ['asscon'], 'Venda de imóveis, veículos e outros bens'],
      ['ITR · Imposto Territorial Rural', 'por declaração', null, null, 350, null, ['asscon'], 'DITR anual'],
      ['Gestão do MEI', 'por mês', 49, 247, 400, null, ['mei', 'asscon'], 'Guias mensais em dia'],
      ['DASN-SIMEI (avulsa)', 'por declaração', null, null, 250, null, ['asscon'], 'Muitos escritórios incluem no plano do MEI'],
    ] },
    planos: { ic: '🏢', nome: 'Planos mensais PJ', itens: [
      ['Simples · Serviços (clínicas, TI)', 'por mês', 189, 700, 800, [400, 690, 1290], ['slz', 'simples', 'asscon'], 'ME até R$ 180 mil/ano, sem empregados'],
      ['Simples · Comércio (lojas, mercados)', 'por mês', 236, 1000, 1100, [600, 950, 1690], ['slz', 'simples', 'asscon'], 'ME até R$ 180 mil/ano, sem empregados'],
      ['Simples · Indústria (fábricas)', 'por mês', 300, 1200, 1250, [900, 1490, 2590], ['simples', 'asscon'], 'Sem preço local publicado: faixa estimada a partir do comércio'],
      ['Lucro Presumido · Serviços', 'por mês', 580, 2200, 950, null, ['ohub', 'asscon'], 'Receita até R$ 100 mil/mês'],
      ['Lucro Presumido · Comércio', 'por mês', 700, 3000, 1220, null, ['ohub', 'asscon'], 'Receita até R$ 200 mil/mês'],
      ['Lucro Presumido · Indústria', 'por mês', 919, 3700, 1320, null, ['ohub', 'asscon'], 'Receita até R$ 200 mil/mês'],
      ['Departamento pessoal (até 2 vínculos)', 'por funcionário/mês', null, null, 165.5, null, ['asscon'], 'Folha, eSocial, FGTS Digital'],
      ['Departamento pessoal (3 a 10 vínculos)', 'por funcionário/mês', null, null, 137.5, null, ['asscon'], 'Média das faixas 3–5 e 6–10'],
      ['Rescisão de contrato', 'por rescisão', null, null, 100, null, ['asscon'], 'Cálculo e documentos'],
    ] },
    bpo: { ic: '📈', nome: 'BPO financeiro e consultoria (13 serviços)', itens: [
      ['BPO financeiro (micro, até 50 lançamentos)', 'por mês', 800, 1800, null, null, ['bpo'], 'Contas a pagar/receber, conciliação, fluxo de caixa'],
      ['BPO financeiro (pequena, 50 a 200 lançamentos)', 'por mês', 1000, 3000, null, null, ['bpo'], 'Inclui emissão de notas e cobrança'],
      ['Consultoria empresarial', 'por hora', null, null, 250, null, ['asscon'], ''],
      ['Consultoria tributária', 'por hora', null, null, 625, null, ['asscon'], ''],
      ['Planejamento tributário', 'por hora', null, null, 760, null, ['asscon'], 'Planejamento e controle'],
      ['Custo e formação de preço', 'por hora', null, null, 250, null, ['asscon'], 'Valor de consultoria por hora'],
      ['Cálculo judicial (perícia)', 'por hora', null, null, 560, null, ['asscon'], 'Perícia contábil judicial'],
      ['Apoio em licitações (índices)', 'por serviço', null, null, 450, null, ['asscon'], 'Serviços: R$ 450 · indústria: R$ 650'],
      ['Crédito bancário (cadastros + análise)', 'por serviço', null, null, 250, null, ['asscon'], 'Cadastros comerciais e bancários (BNB)'],
      ['Diagnóstico da Reforma Tributária', 'por estudo', null, null, 900, null, ['asscon'], 'Pequenas empresas (IBS/CBS); faixa nacional R$ 600–1.200'],
    ] },
    abertura: { ic: '🗂️', nome: 'Abertura e legalização (8 serviços)', itens: [
      ['Abertura de empresa (Simples ME/EPP)', 'por abertura', 180, 1500, 800, 0, ['ohub', 'asscon'], 'KWIK: grátis no plano Profissional'],
      ['Abertura de MEI', 'por abertura', 0, 350, 0, null, ['ohub', 'asscon'], 'A referência nacional é gratuita'],
      ['Migração de MEI para ME', 'por serviço', null, null, 650, 0, ['asscon'], 'KWIK: grátis no plano Profissional'],
      ['Alteração contratual', 'por alteração', null, null, 600, null, ['asscon'], 'Simples Nacional'],
      ['Baixa de empresa', 'por baixa', null, null, 800, null, ['asscon'], 'Simples (MEI: R$ 600)'],
      ['Alvarás e licenças', 'por licença', null, null, 350, null, ['asscon'], 'Alvará R$ 250; bombeiros, sanitária, ambiental R$ 450'],
      ['Certidões negativas (CND)', 'por consulta', null, null, 200, null, ['asscon'], ''],
      ['Parcelamento / regularização de pendências', 'por serviço', null, null, 450, null, ['asscon'], 'PGFN: R$ 550'],
    ] },
  };

  const arred = v => v < 100 ? Math.round(v / 5) * 5 : Math.round(v / 10) * 10;
  function sugerir([, , min, max, ref]) {
    if (min != null && max != null) {
      const med = (min + max) / 2;
      if (ref == null) return { v: arred(med * 0.9), regra: 'média do mercado −10% (para entrar competitiva)' };
      let v = med * 0.55 + ref * 0.45;
      v = Math.max(v, min * 1.1); if (ref > 0) v = Math.min(v, Math.max(ref, med));
      v = Math.min(v, max); // nunca acima do mais caro de São Luís
      return { v: arred(v), regra: 'entre a média de São Luís e a referência nacional' };
    }
    if (ref == null) return { v: null, regra: '—' };
    return { v: arred(ref * 0.75), regra: '75% da referência nacional (mercado de São Luís)' };
  }
  function leitura(item, sug) {
    const [, , min, max, ref, kwik] = item;
    if (Array.isArray(kwik)) {
      const [ess] = kwik, med = (min + max) / 2;
      return ess < min ? 'Essencial abaixo do mercado: dá para subir' : ess <= med ? `Essencial competitivo (média local ${brl0(med)})` : ess <= (ref || Infinity) ? 'Essencial acima dos planos online, abaixo da referência: posicionamento de escritório próximo' : 'Acima da referência nacional: justifique com atendimento';
    }
    if (kwik === 0) return 'Bônus do plano Profissional: ótimo argumento de venda 💚';
    if (sug.v == null) return '';
    if (min != null && sug.v <= min * 1.15) return 'Preço de entrada para ganhar clientes';
    return '';
  }

  async function trabalhar(f, p) {
    if (p.trabalhando || U().semConexao()) return;
    const eu = f.nome.split(' ')[0];
    const opcoes = [{ v: 'tudo', ic: '📋', nome: 'Tabela completa', desc: 'Todos os serviços dos cartazes, com mercado e sugestão' }]
      .concat(Object.entries(GRUPOS).map(([v, g]) => ({ v, ic: g.ic, nome: g.nome, desc: `${g.itens.length} itens comparados com São Luís` })));
    const grupo = await A().escolher(`🧮 O que ${eu} vai precificar?`, opcoes);
    if (!grupo) return;
    if (!(await A().esperarLivre(p, 1500))) return A().toast(`Espere ${eu} terminar o que está fazendo 😉`);
    if (p.modo !== 'sentado') await KM.voltarSentar(p);
    A().pagar(f, p);
    A().iniciarPainelTarefa('🧮 Precificação · mercado de São Luís');
    p.trabalhando = true; p.digitando = true; A().estado.trabalhoDe.precificacao = true; A().atualizarBotoes();
    const cb = A().callbacksTarefa(p, false);
    let erro, salvo;
    try {
      await U().produzir(p, cb, [['Separando os serviços dos cartazes 📄', 20, 2000], ['Comparando com os preços de São Luís 🌴', 45, 2600], ['Conferindo a tabela nacional de 2026 📚', 70, 2200], ['Fazendo as contas, meu bem 🧮', 92, 2000]]);
      salvo = { id: U().agoraId('precos'), tipo: 'precificacao', grupo, criadoEm: U().agoraIso(), funcionario: { id: f.id, nome: f.nome }, tarefa: 'Precificação de serviços',
        titulo: grupo === 'tudo' ? 'Tabela completa de preços' : GRUPOS[grupo].nome, pesquisa: '11/2026', duracao: 9 };
      await A().BK().salvarRelatorio(salvo);
      cb.progresso(100);
    } catch (e) { erro = e; }
    p.trabalhando = false; p.digitando = false; A().estado.trabalhoDe.precificacao = false; A().atualizarBotoes();
    if (erro) { A().falar(p.id, 'Ih, deu um probleminha 😅', 3000); return A().toast(`${eu}: ` + erro.message, { erro: true, ms: 9000 }); }
    await A().carregarRelatorios(KM.resumoRelatorio(salvo));
    A().falar(p.id, 'Pronto, meus netos! Tabela de preços feita 💜', 3200);
    A().toast(`🧮 ${eu} terminou: ${salvo.titulo}.`, { botao: ['Ver preços', () => A().abrirRelatorio(salvo.id)], ms: 10000 });
    await A().concluir(f, p);
  }

  function renderRel(r, box) {
    const { el, fmtData } = A();
    const grupos = r.grupo === 'tudo' || !GRUPOS[r.grupo] ? Object.keys(GRUPOS) : [r.grupo];
    const rel = el('div', { class: 'rel precos' });
    rel.append(el('div', { class: 'rel-cab' },
      el('div', {}, el('h2', {}, `🧮 ${r.titulo || 'Precificação'}`), el('p', {}, `Feito por ${r.funcionario?.nome || 'Dona Iva'} em ${fmtData(r.criadoEm)} · pesquisa de mercado de São Luís (MA), novembro de 2026`)),
      el('div', { class: 'rel-bts' }, el('button', { class: 'bt peq', onclick: () => baixarCsv(grupos) }, '⬇️ Planilha (CSV)'), el('button', { class: 'bt peq perigo', onclick: () => A().apagarRel(r) }, '🗑️ Apagar'))));
    rel.append(el('div', { class: 'obs' }, '💜 Como a Dona Iva calcula: com preço de mercado, a sugestão fica entre a média de São Luís e a tabela nacional de 2026 (nunca abaixo do mínimo local + 10% nem acima do mais caro da cidade). Sem preço público local, usa 75% da tabela nacional, porque os escritórios de São Luís cobram bem abaixo dela (planos de R$ 189 a R$ 450 contra R$ 800 de referência). Preços públicos mudam: confira antes de mudar a sua tabela.'));
    if (grupos.includes('planos')) {
      const p = GRUPOS.planos.itens.filter(i => Array.isArray(i[5]));
      rel.append(el('div', { class: 'precos-planos' }, el('h3', {}, '📊 Seus planos x São Luís'),
        el('div', { class: 'fin-tab' }, el('table', {}, el('thead', {}, el('tr', {}, ['Atividade', 'Mercado SLZ', 'Referência 2026', 'Essencial', 'Profissional', 'Premium', 'Leitura da Dona Iva'].map(t => el('th', {}, t)))),
          el('tbody', {}, p.map(i => el('tr', {}, el('td', {}, el('b', {}, i[0])), el('td', {}, `${brl0(i[2])} a ${brl0(i[3])}`), el('td', {}, brl0(i[4])),
            ...i[5].map(v => el('td', { class: v <= i[4] ? 'pos' : '' }, brl0(v))), el('td', {}, el('small', {}, leitura(i, sugerir(i)))))))))));
    }
    for (const k of grupos) {
      const g = GRUPOS[k];
      rel.append(el('div', { class: 'fin-bloco' }, el('h3', {}, `${g.ic} ${g.nome}`),
        el('div', { class: 'fin-tab' }, el('table', {}, el('thead', {}, el('tr', {}, ['Serviço', 'Unidade', 'Mercado SLZ/online', 'Referência 2026', 'KWIK hoje', 'Sugestão da Dona Iva'].map(t => el('th', {}, t)))),
          el('tbody', {}, g.itens.map(i => {
            const s = sugerir(i), kw = Array.isArray(i[5]) ? i[5].map(brl0).join(' / ') : i[5] === 0 ? 'grátis no Profissional' : '—';
            return el('tr', {}, el('td', {}, el('b', {}, i[0]), i[7] ? el('small', {}, i[7]) : null), el('td', {}, i[1]),
              el('td', {}, i[2] == null ? el('small', {}, 'sem preço público') : `${brl0(i[2])} a ${brl0(i[3])}`), el('td', {}, brl0(i[4])), el('td', {}, kw),
              el('td', { class: 'sug' }, el('b', {}, s.v == null ? '—' : brl0(s.v)), el('small', {}, s.regra), leitura(i, s) ? el('small', { class: 'leit' }, leitura(i, s)) : null));
          }))))));
    }
    rel.append(el('div', { class: 'fontes-precos' }, el('h3', {}, '📚 Fontes da pesquisa'), el('ul', {}, Object.values(FONTES).map(f => el('li', {}, el('a', { href: f.url, target: '_blank', rel: 'noopener' }, f.nome))))));
    box.append(rel);
  }
  function baixarCsv(grupos) {
    const linhas = [['Grupo', 'Serviço', 'Unidade', 'Mercado mín.', 'Mercado máx.', 'Referência 2026', 'KWIK hoje', 'Sugestão', 'Regra']];
    for (const k of grupos) for (const i of GRUPOS[k].itens) { const s = sugerir(i); linhas.push([GRUPOS[k].nome, i[0], i[1], i[2] ?? '', i[3] ?? '', i[4] ?? '', Array.isArray(i[5]) ? i[5].join(' / ') : i[5] ?? '', s.v ?? '', s.regra]); }
    const csv = '﻿' + linhas.map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = A().el('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), download: `Dona Iva - Precos KWIK Sao Luis.csv` });
    document.body.append(a); a.click(); a.remove();
  }

  KM.precificacao = { trabalhar, renderRel, GRUPOS, sugerir };
})();
