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

  // ------------------------------------------------------------------ pedido descrito por você
  // A Dona Iva lê o texto, descobre o serviço, a quantidade e a situação do cliente, mostra o que entendeu
  // (você corrige se precisar) e só então calcula o preço.
  const TODOS = () => Object.values(GRUPOS).flatMap(g => g.itens);
  const item = nome => TODOS().find(i => i[0] === nome);
  const sem = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const REGRAS = [ // [expressão, serviço] — a primeira que bater vale
    [/carne.?leao/, 'Carnê-Leão'], [/ganho de capital|gcap|vend\w* (o |a |um |uma )?(imovel|carro|casa|apartamento|terreno|moto)/, 'Ganho de capital (GCAP)'],
    [/\bitr\b|territorial rural|fazenda|sitio|chacara/, 'ITR · Imposto Territorial Rural'],
    [/dasn|declaracao anual do mei/, 'DASN-SIMEI (avulsa)'], [/(mei|microempreendedor).*(para|pra|virar|em) (me\b|microempresa)|desenquadr|migra\w* (de |do )?mei/, 'Migração de MEI para ME'],
    [/(abrir|abertura|formalizar)\w* .{0,20}\bmei\b|\bmei\b.{0,20}(abrir|abertura)/, 'Abertura de MEI'], [/\bmei\b|microempreendedor/, 'Gestão do MEI'],
    [/(abrir|abertura|montar|criar)\w* .{0,25}(empresa|cnpj|clinica|loja|negocio)/, 'Abertura de empresa (Simples ME/EPP)'],
    [/baixa d|fechar a empresa|encerrar a empresa|dar baixa/, 'Baixa de empresa'], [/alteracao contratual|mudar (o )?endereco|incluir socio|sair da sociedade|trocar socio/, 'Alteração contratual'],
    [/alvara|licenca|bombeiro|vigilancia sanitaria/, 'Alvarás e licenças'], [/certidao|\bcnd\b/, 'Certidões negativas (CND)'],
    [/parcel|divida|pendencia|regulariz|pgfn|debito/, 'Parcelamento / regularização de pendências'], [/rescis|demiti|demissao/, 'Rescisão de contrato'],
    [/pericia|calculo judicial|processo/, 'Cálculo judicial (perícia)'], [/licitac/, 'Apoio em licitações (índices)'], [/credito|emprestimo|financiamento|banco do nordeste|\bbnb\b/, 'Crédito bancário (cadastros + análise)'],
    [/reforma tributaria|\bibs\b|\bcbs\b/, 'Diagnóstico da Reforma Tributária'], [/planejamento tribut/, 'Planejamento tributário'], [/consultoria tribut/, 'Consultoria tributária'],
    [/formacao de preco|custo/, 'Custo e formação de preço'], [/consultoria|mentoria|orientacao/, 'Consultoria empresarial'],
    [/bpo|financeiro terceirizado|contas a pagar|contas a receber|conciliac|fluxo de caixa/, 'BPO financeiro (micro, até 50 lançamentos)'],
    [/imposto de renda|\birpf\b|\bir\b|declaracao (do |de )?(imposto|renda)|malha fina/, 'Imposto de Renda PF (simples)'],
    [/folha|funcionari|(?<!des)empregad|departamento pessoal|\bdp\b|esocial/, 'Departamento pessoal (até 2 vínculos)'],
    [/presumido.*(comercio|loja)|(comercio|loja).*presumido/, 'Lucro Presumido · Comércio'], [/presumido.*industr|industr.*presumido/, 'Lucro Presumido · Indústria'], [/presumido/, 'Lucro Presumido · Serviços'],
    [/industr|fabrica/, 'Simples · Indústria (fábricas)'], [/comercio|loja|mercad|varejo|revend/, 'Simples · Comércio (lojas, mercados)'],
    [/contabilidade|contador|mensalidade|honorario|plano mensal|empresa|clinica|consultorio|cnpj/, 'Simples · Serviços (clínicas, TI)'],
  ];
  const SITUACOES = {
    desempregado: { nome: 'Desempregado(a) / sem renda', aj: -0.35, frase: 'está sem renda agora: preço social e parcelado, sem deixar de ajudar' },
    baixa: { nome: 'Baixa condição financeira', aj: -0.25, frase: 'tem pouca condição: desconto e parcelas que caibam no bolso' },
    normal: { nome: 'Condição normal', aj: 0, frase: '' },
    boa: { nome: 'Boa condição / empresa que fatura bem', aj: 0.1, frase: 'tem boa condição: preço cheio, com atendimento caprichado' },
  };
  function entender(texto) {
    const t = sem(texto);
    const regra = REGRAS.find(([re]) => re.test(t));
    let servico = regra ? regra[1] : '';
    if (servico === 'Imposto de Renda PF (simples)' && /dependente|aluguel|alugue|investiment|acoes|imovel|imoveis|complet|exterior|rural|pensao|varios bens/.test(t)) servico = 'Imposto de Renda PF (completa)';
    const n = re => { const m = t.match(re); return m ? Math.max(1, Math.min(200, parseInt(m[1], 10))) : 0; };
    const funcs = n(/(\d+)\s*(funcionari|empregad|colaborador|vinculo)/);
    if (servico.startsWith('Departamento pessoal') && funcs > 2) servico = 'Departamento pessoal (3 a 10 vínculos)';
    if (servico.startsWith('BPO') && /(\d{3,})\s*lancament|pequena empresa|muitos lancament/.test(t)) servico = 'BPO financeiro (pequena, 50 a 200 lançamentos)';
    const anos = n(/(\d+)\s*anos? (sem declarar|atrasad|em atraso|pendente)/) || n(/(\d+)\s*declarac/);
    const horas = n(/(\d+)\s*h(oras)?\b/);
    const sit = /desempregad|sem emprego|perdeu o emprego|sem trabalho|sem renda|demitid/.test(t) ? 'desempregado'
      : /baixa renda|pouc[oa] (dinheiro|condic)|sem condic|condic\w* (baixa|dificil|ruim|apertad)|apertad|humilde|bolsa familia|auxilio|estudante|nao (pode|tem como) pagar|ganha (um )?salario minimo/.test(t) ? 'baixa'
      : /fatura (muito|bem)|alto faturamento|empresa grande|bem de vida|tem condic|boa condic/.test(t) ? 'boa' : 'normal';
    const unid = sem((item(servico) || [])[1] || '');
    return {
      servico, sit,
      qtd: /funcionario/.test(unid) ? (funcs || (servico.includes('3 a 10') ? 3 : 1)) : /declaracao|ano/.test(unid) ? Math.max(1, anos) : /hora/.test(unid) ? (horas || (/planejamento/.test(sem(servico)) ? 4 : 2)) : 1,
      urgente: /urgente|pra hoje|para hoje|amanha|ate (sexta|segunda)|prazo (vencendo|acabando|curto)|correndo/.test(t),
      complexo: /malha fina|bagunca|desorganiz|multa|notificac|intimac|retific|varios anos|anos sem declarar|atrasad|pendenc|exterior|espolio|heranca/.test(t),
      amigo: /indicac|indicad|amig|parente|famil|cliente antigo|ja e cliente|cliente da kwik|fiel/.test(t),
      idoso: /idos|aposentad|pensionist/.test(t),
    };
  }
  function calcular(ent) {
    const it = item(ent.servico); if (!it) return null;
    const base = sugerir(it), [nome, unid, min, max, ref] = it;
    const unitario = base.v != null ? base.v : 0;
    const qtd = Math.max(1, ent.qtd || 1);
    const cheio = unitario * qtd;
    const ajustes = [];
    if (qtd > 1) ajustes.push([`${qtd} × ${brl0(unitario)} (${unid})`, 0]);
    const S = SITUACOES[ent.sit] || SITUACOES.normal;
    if (S.aj) ajustes.push([S.nome, S.aj]);
    if (ent.idoso && ent.sit === 'normal') ajustes.push(['Aposentado(a) / idoso(a)', -0.1]);
    if (ent.amigo) ajustes.push(['Indicação, família ou cliente antigo', -0.1]);
    if (ent.complexo) ajustes.push(['Caso trabalhoso (pendências, malha, atrasos)', 0.25]);
    if (ent.urgente) ajustes.push(['Urgência (prazo curto)', 0.2]);
    if (qtd >= 3 && /declarac|funcionario/.test(sem(unid))) ajustes.push(['Desconto por quantidade', -0.1]);
    // primeiro o tamanho do trabalho (pendências, urgência, quantidade); depois a condição do cliente, sobre esse valor
    const TRAB = new Set(['Caso trabalhoso (pendências, malha, atrasos)', 'Urgência (prazo curto)', 'Desconto por quantidade']);
    const trab = 1 + ajustes.filter(a => TRAB.has(a[0])).reduce((s, a) => s + a[1], 0);
    const social = 1 + ajustes.filter(a => !TRAB.has(a[0])).reduce((s, a) => s + a[1], 0);
    const fator = Math.max(0.5, Math.min(1.6, trab * social));
    const final = arred(cheio * fator), piso = arred(cheio * 0.5);
    const parcelas = ent.sit === 'desempregado' ? 4 : ent.sit === 'baixa' ? 3 : final >= 600 ? 2 : 1;
    const mercado = min != null && max != null ? { min: min * qtd, max: max * qtd, medio: (min + max) / 2 * qtd } : null;
    return { servico: nome, unid, qtd, unitario, cheio, ajustes, fator, final, piso, parcelas, mercado, ref: ref != null ? ref * qtd : null, regra: base.regra, fontes: it[6] };
  }
  function mensagemCliente(c, ent) {
    const parc = c.parcelas > 1 ? ` em até ${c.parcelas}x de ${brl0(Math.ceil(c.final / c.parcelas))}` : '';
    const u = sem(c.unid), qual = /funcion/.test(u) ? 'funcionários' : /hora/.test(u) ? 'horas' : /declarac/.test(u) ? 'declarações' : /apurac/.test(u) ? 'apurações' : 'serviços';
    return `Olá! Tudo bem? 😊\nAqui é da KWIK Contabilidade. Para ${c.servico}${c.qtd > 1 ? ` (${c.qtd} ${qual})` : ''}, o valor fica em ${brl0(c.final)}${parc}.` +
      (ent.sit === 'desempregado' || ent.sit === 'baixa' ? '\nSabemos que o momento pede cuidado, por isso fizemos um valor especial pra você. 💚' : '') + '\nQualquer dúvida é só chamar!';
  }
  let presetTexto = null; // texto já escrito (ex.: vindo do IPOG: "quanto cobrar por este serviço?")
  function pedirDescricao(eu, texto) {
    return new Promise(res => {
      const { el } = A();
      let d = document.getElementById('dlgIva');
      if (!d) { d = el('dialog', { id: 'dlgIva', class: 'iva-dlg' }); document.body.append(d); }
      d.innerHTML = '';
      let valor = null;
      const ta = el('textarea', { rows: 5, placeholder: 'Ex.: Declaração de imposto de renda de uma cliente que está desempregada, com 2 anos sem declarar e um filho dependente. Ela foi indicação da Lena e precisa até sexta.' });
      if (texto) ta.value = texto;
      const etapa2 = el('div', { class: 'iva-entendi', hidden: true });
      const botao = el('button', { class: 'bt prim', type: 'button' }, '💜 Dona Iva, entenda o caso');
      const corpo = el('div', { class: 'dlg-corpo' },
        el('p', { class: 'sub', style: 'margin-top:0' }, `Conte tudo para ${eu}: o serviço, quantos (declarações, funcionários, horas…) e a situação do cliente (desempregado, pouca condição, indicação, urgência, pendências…).`),
        ta, el('div', { style: 'margin-top:10px' }, botao), etapa2);
      d.append(el('div', { class: 'dlg-topo' }, el('h2', {}, `✍️ O que ${eu} vai precificar?`), el('button', { type: 'button', onclick: () => d.close() }, '×')), corpo);
      botao.addEventListener('click', () => {
        if (!ta.value.trim()) return ta.focus();
        const ent = entender(ta.value);
        etapa2.hidden = false; etapa2.innerHTML = '';
        const selServ = el('select', {}, el('option', { value: '' }, '— escolha o serviço —'), Object.values(GRUPOS).map(g => el('optgroup', { label: g.nome }, g.itens.map(i => el('option', { value: i[0], selected: i[0] === ent.servico }, `${i[0]} (${i[1]})`)))));
        const qtd = el('input', { type: 'number', min: 1, max: 200, value: ent.qtd });
        const selSit = el('select', {}, Object.entries(SITUACOES).map(([k, s]) => el('option', { value: k, selected: k === ent.sit }, s.nome)));
        const chk = (k, txt) => el('label', { class: 'iva-chk' }, el('input', { type: 'checkbox', checked: !!ent[k], 'data-k': k }), txt);
        etapa2.append(
          el('h3', {}, '💜 O que eu entendi, meu bem'),
          el('p', { class: 'sub' }, ent.servico ? 'Confere se está certo; dá para mudar qualquer coisa antes de eu calcular.' : 'Não achei o serviço no texto: escolha o mais parecido.'),
          el('div', { class: 'iva-grade' },
            el('label', {}, el('span', {}, 'Serviço'), selServ), el('label', {}, el('span', {}, 'Quantidade'), qtd), el('label', {}, el('span', {}, 'Situação do cliente'), selSit)),
          el('div', { class: 'iva-chks' }, chk('amigo', 'Indicação / família / cliente antigo'), chk('complexo', 'Caso trabalhoso (pendências, malha, atraso)'), chk('urgente', 'Urgente'), chk('idoso', 'Aposentado(a) / idoso(a)')),
          el('button', { class: 'bt prim', type: 'button', style: 'margin-top:10px', onclick: () => {
            if (!selServ.value) return selServ.focus();
            valor = { texto: ta.value.trim(), ent: { ...ent, servico: selServ.value, qtd: Math.max(1, parseInt(qtd.value, 10) || 1), sit: selSit.value, ...Object.fromEntries([...etapa2.querySelectorAll('[data-k]')].map(c => [c.dataset.k, c.checked])) } };
            d.close();
          } }, '🧮 Calcular o preço'));
      });
      d.onclose = () => res(valor);
      d.showModal(); setTimeout(() => ta.focus(), 60);
    });
  }

  async function trabalhar(f, p) {
    if (p.trabalhando || U().semConexao()) return;
    const eu = f.nome.split(' ')[0];
    const opcoes = [{ v: 'tudo', ic: '📋', nome: 'Tabela completa', desc: 'Todos os serviços dos cartazes, com mercado de São Luís e sugestão' },
      { v: 'pedido', ic: '✍️', nome: 'Descrever o que quero precificar', desc: 'Você conta o caso e a situação do cliente; ela entende e dá o preço' }];
    const preset = presetTexto; presetTexto = null;
    const grupo = preset ? 'pedido' : await A().escolher(`🧮 O que ${eu} vai precificar?`, opcoes);
    if (!grupo) return;
    let pedido = null, conta = null;
    if (grupo === 'pedido') {
      pedido = await pedirDescricao(eu, preset); if (!pedido) return;
      conta = calcular(pedido.ent); if (!conta) return A().toast('Não consegui achar esse serviço na tabela 😅');
    }
    if (!(await A().esperarLivre(p, 1500))) return A().toast(`Espere ${eu} terminar o que está fazendo 😉`);
    if (p.modo !== 'sentado') await KM.voltarSentar(p);
    A().pagar(f, p);
    A().iniciarPainelTarefa('🧮 Precificação · mercado de São Luís');
    p.trabalhando = true; p.digitando = true; A().estado.trabalhoDe.precificacao = true; A().atualizarBotoes();
    const cb = A().callbacksTarefa(p, false);
    let erro, salvo;
    try {
      if (pedido) {
        await U().produzir(p, cb, [['Lendo o caso com calma 👓', 20, 1800], [`Procurando "${conta.servico}" no mercado de São Luís 🌴`, 45, 2400], ['Pensando na situação do cliente 💜', 70, 2000], ['Fazendo as contas, meu bem 🧮', 92, 1600]]);
        salvo = { id: U().agoraId('precos'), tipo: 'precificacao', modo: 'pedido', criadoEm: U().agoraIso(), funcionario: { id: f.id, nome: f.nome }, tarefa: 'Preço de um pedido',
          titulo: `${conta.servico} · ${brl0(conta.final)}`, pesquisa: '11/2026', duracao: 8, pedido: { texto: pedido.texto, ent: pedido.ent, conta, mensagem: mensagemCliente(conta, pedido.ent) } };
      } else {
        await U().produzir(p, cb, [['Separando os serviços dos cartazes 📄', 20, 2000], ['Comparando com os preços de São Luís 🌴', 45, 2600], ['Conferindo a tabela nacional de 2026 📚', 70, 2200], ['Fazendo as contas, meu bem 🧮', 92, 2000]]);
        salvo = { id: U().agoraId('precos'), tipo: 'precificacao', grupo: 'tudo', criadoEm: U().agoraIso(), funcionario: { id: f.id, nome: f.nome }, tarefa: 'Precificação de serviços',
          titulo: 'Tabela completa de preços', pesquisa: '11/2026', duracao: 9 };
      }
      await A().BK().salvarRelatorio(salvo);
      cb.progresso(100);
    } catch (e) { erro = e; }
    p.trabalhando = false; p.digitando = false; A().estado.trabalhoDe.precificacao = false; A().atualizarBotoes();
    if (erro) { A().falar(p.id, 'Ih, deu um probleminha 😅', 3000); return A().toast(`${eu}: ` + erro.message, { erro: true, ms: 9000 }); }
    await A().carregarRelatorios(KM.resumoRelatorio(salvo));
    A().falar(p.id, pedido ? `Fica ${brl0(conta.final)}, meu bem 💜` : 'Pronto, meus netos! Tabela de preços feita 💜', 3200);
    A().toast(`🧮 ${eu} terminou: ${salvo.titulo}.`, { botao: ['Ver preços', () => A().abrirRelatorio(salvo.id)], ms: 10000 });
    await A().concluir(f, p);
  }

  function renderPedido(r, box) {
    const { el, fmtData } = A(), P = r.pedido, c = P.conta, e = P.ent, S = SITUACOES[e.sit] || SITUACOES.normal;
    const rel = el('div', { class: 'rel precos iva-rel' });
    rel.append(el('div', { class: 'rel-cab' },
      el('div', {}, el('h2', {}, `🧮 ${c.servico}`), el('p', {}, `Calculado por ${r.funcionario?.nome || 'Dona Iva'} em ${fmtData(r.criadoEm)} · mercado de São Luís (MA), novembro de 2026`)),
      el('div', { class: 'rel-bts' }, el('button', { class: 'bt peq perigo', onclick: () => A().apagarRel(r) }, '🗑️ Apagar'))));
    rel.append(el('div', { class: 'iva-pedido' }, el('b', {}, '✍️ O que você pediu'), el('p', {}, P.texto)));
    rel.append(el('div', { class: 'iva-preco' },
      el('div', {}, el('small', {}, 'Preço da Dona Iva para esse caso'), el('b', {}, brl0(c.final)), c.parcelas > 1 ? el('span', {}, `ou ${c.parcelas}x de ${brl0(Math.ceil(c.final / c.parcelas))}`) : null),
      el('div', {}, el('small', {}, 'Preço cheio (sem considerar a situação)'), el('b', { class: 'cinza' }, brl0(c.cheio))),
      el('div', {}, el('small', {}, 'Mínimo para não ter prejuízo'), el('b', { class: 'cinza' }, brl0(c.piso)))));
    const linhas = [
      ['Média do mercado (São Luís / online)', c.mercado ? `${brl0(c.mercado.medio)} (de ${brl0(c.mercado.min)} a ${brl0(c.mercado.max)})` : 'sem preço público em São Luís'],
      ['Referência nacional 2026 (ASSCON)', c.ref != null ? brl0(c.ref) : '—'],
      ['Base da Dona Iva', `${brl0(c.unitario)} ${c.unid} · ${c.regra}`],
      ...c.ajustes.map(([t, v]) => [t, v ? `${v > 0 ? '+' : ''}${Math.round(v * 100)}%` : '']),
      ['Ajuste total (trabalho × condição do cliente)', `${c.fator >= 1 ? '+' : ''}${Math.round((c.fator - 1) * 100)}%`],
      ['Preço final', brl0(c.final)],
    ];
    rel.append(el('h3', {}, '📐 Como cheguei nesse valor'), el('div', { class: 'fin-tab' }, el('table', {}, el('tbody', {}, linhas.map(([a, b], i) => el('tr', { class: i === linhas.length - 1 ? 'dest' : '' }, el('td', {}, a), el('td', {}, el('b', {}, b))))))));
    const conselhos = [];
    if (S.frase) conselhos.push(`O cliente ${S.frase}.`);
    if (e.complexo) conselhos.push('Tem pendência ou atraso: avise antes que pode aparecer multa ou diferença a pagar; isso é cobrado à parte do governo, não da KWIK.');
    if (e.urgente) conselhos.push('É urgente: combine o prazo por escrito e peça os documentos de uma vez.');
    if (e.amigo) conselhos.push('Veio por indicação ou é de casa: o desconto já está no preço, agradeça quem indicou 💚');
    if (c.parcelas > 1) conselhos.push(`Ofereça em até ${c.parcelas}x para caber no bolso.`);
    if (c.final <= c.piso) conselhos.push('Esse é o menor valor que vale a pena: abaixo disso a KWIK trabalha de graça.');
    if (conselhos.length) rel.append(el('h3', {}, '💜 Conselhos da Dona Iva'), el('ul', {}, conselhos.map(t => el('li', {}, t))));
    rel.append(el('h3', {}, '💬 Mensagem pronta para o cliente'), el('pre', { class: 'iva-msg' }, P.mensagem),
      el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' },
        el('button', { class: 'bt peq', onclick: () => navigator.clipboard.writeText(P.mensagem).then(() => A().toast('📋 Mensagem copiada')) }, '📋 Copiar'),
        el('a', { class: 'bt peq prim', href: 'https://wa.me/?text=' + encodeURIComponent(P.mensagem), target: '_blank', rel: 'noopener' }, '💬 Abrir no WhatsApp')));
    rel.append(el('div', { class: 'obs', style: 'margin-top:12px' }, 'A Dona Iva usa a pesquisa de preços de São Luís (novembro/2026) e a tabela nacional de honorários 2026. Ela não pesquisa na internet na hora: se o serviço for muito diferente, escolha o mais parecido na lista.'));
    rel.append(el('div', { class: 'fontes-precos' }, el('h3', {}, '📚 Fontes'), el('ul', {}, (c.fontes || []).map(k => FONTES[k]).filter(Boolean).map(f => el('li', {}, el('a', { href: f.url, target: '_blank', rel: 'noopener' }, f.nome))))));
    box.append(rel);
  }

  function renderRel(r, box) {
    const { el, fmtData } = A();
    if (r.modo === 'pedido' && r.pedido) return renderPedido(r, box);
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

  // abre a Dona Iva já com o texto do pedido escrito
  function pedirCom(texto) {
    const c = A().cfg(), f = c.funcionarios.find(x => x.funcao === 'precificacao'); if (!f) return;
    const p = A().estado.pessoas[f.id]; if (!p) return;
    presetTexto = texto;
    A().irPara('escritorio'); A().selecionar(f.id);
    trabalhar(f, p);
  }
  KM.precificacao = { trabalhar, renderRel, GRUPOS, sugerir, entender, calcular, mensagemCliente, pedirCom, _pedir: pedirDescricao };
})();
