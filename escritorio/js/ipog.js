/* KWIK Mini Escritório · botão "IPOG".
   O Kauã pega o carro da KWIK e vai até o prédio do IPOG. Entrando, cada sala é um módulo da pós (os mesmos da pasta
   "Estudo (IPOG) / Modulos (Todos)"). Tocando numa sala aparece tudo sobre o módulo: resumo, os pontos principais,
   como vender o serviço para os clientes e o que muda com a Reforma Tributária. Os PDFs ficam no computador; aqui vão
   só os resumos e a lista dos materiais. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  const r = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const tx = (g, s, x, y, c) => KM.texto(g, s, x, y, c);
  const larg = s => KM.larguraTexto(s);

  // ------------------------------------------------------------------ módulos
  const MODULOS = [
    {
      id: 'contab', n: 1, ic: '📘', cor: '#1971c2', nome: 'Contabilidade Tributária, NBCs Aplicadas e Fundamentos de Auditoria', curto: 'Contab. Tributária e Auditoria',
      resumo: 'Une a contabilidade dos tributos (como registrar e medir impostos, inclusive os diferidos) com as Normas Brasileiras de Contabilidade e a base da auditoria: risco, evidência e fraude. Mensagem principal: balanço bem feito é a primeira defesa do cliente numa fiscalização e a porta para crédito no banco.',
      topicos: [
        'Contabilidade financeira x gerencial: para quem serve cada uma e por que o fisco olha a financeira.',
        'Tributos sobre vendas, compras e lucro: tributos a recuperar e a recolher, como registrar.',
        'CPC 32 (NBC TG 32): IR e CSLL correntes e diferidos — diferenças temporárias e prejuízo fiscal.',
        'CPC 27 (NBC TG 27): imobilizado — custo, vida útil, depreciação, valor residual e redução ao valor recuperável.',
        'Auditoria baseada em riscos: entender o negócio, avaliar o risco de distorção e planejar os testes.',
        'Evidências de auditoria: o que é suficiente e apropriado (inspeção, confirmação, recálculo, observação).',
        'Caso Americanas: como operações com fornecedores ("risco sacado") esconderam dívidas bilionárias e por que controles internos importam.',
      ],
      vender: {
        publico: 'Empresas do Lucro Presumido e Real, quem vai pedir crédito no banco, receber sócio ou investidor, ou vender a empresa.',
        dor: 'Balanço que "não fecha", banco recusando crédito, sócio desconfiado, medo de fiscalização.',
        oferta: 'Pré-auditoria: revisão contábil (imobilizado, impostos a recuperar, diferidos, controles) com relatório do que ajustar, e depois a contabilidade completa no padrão das NBCs.',
        roteiro: ['Seu balanço hoje passaria na análise de um banco ou de um auditor?', 'A gente faz uma pré-auditoria: confere imobilizado, impostos e controles e entrega um relatório simples com o que ajustar.', 'Com a contabilidade em ordem você consegue crédito mais barato e fica tranquilo numa fiscalização.'],
        cobrar: 'Projeto fechado pela revisão e, depois, mensalidade maior pela contabilidade completa. Peça para a Dona Iva precificar pelo volume de lançamentos.',
      },
      reforma: [
        'IBS e CBS são "por fora" e não cumulativos: saem da receita e do custo e viram tributo a recuperar/recolher — muda a leitura da margem.',
        'Crédito amplo (quase toda compra gera crédito): a contabilidade precisa controlar o crédito nota a nota.',
        'Transição 2026–2033: dois sistemas convivendo (PIS/COFINS, ICMS, ISS + CBS/IBS) — mais conciliações e controles.',
        'IR, CSLL e o CPC 32 continuam, mas o lucro muda com os novos preços e créditos.',
        'Split payment e notas com IBS/CBS deixam os cruzamentos do fisco mais rápidos: erro contábil aparece logo.',
      ],
      materiais: ['SLIDE Contabilidade Tributária e Fundamentos de Auditoria', 'Evidências de auditoria', 'Res. 1721 – Abordagem baseada em riscos', 'Exercício CPC 32', 'Exercício Imobilizado', 'Quadro 1 – Financeira x Gerencial', 'Fraude nas Americanas (reportagem)'],
    },
    {
      id: 'direito', n: 2, ic: '⚖️', cor: '#7048e8', nome: 'Direito Tributário – Processos Administrativos e Judiciais', curto: 'Direito Tributário e Processos',
      resumo: 'Como nasce, como se cobra e como se discute o crédito tributário: lançamento, prazos de decadência e prescrição, defesa na Receita (impugnação e recurso ao CARF) e as ações na Justiça (mandado de segurança, anulatória, repetição de indébito, execução fiscal e embargos).',
      topicos: [
        'Linha do tempo: fato gerador → obrigação → lançamento → crédito tributário → cobrança → dívida ativa.',
        'Decadência: 5 anos para o fisco lançar (art. 150, §4º e art. 173 do CTN). Prescrição: 5 anos para cobrar (art. 174).',
        'Suspensão da exigibilidade (art. 151: depósito, impugnação, liminar, parcelamento) e extinção (art. 156: pagamento, compensação, decisão…).',
        'Processo administrativo federal (Decreto 70.235/72): impugnação em 30 dias na DRJ e recurso voluntário ao CARF em 30 dias.',
        'Processo judicial: mandado de segurança (120 dias, prova já pronta), ação anulatória, declaratória e repetição de indébito.',
        'Execução fiscal (Lei 6.830/80): penhora, embargos à execução e exceção de pré-executividade.',
        'Questões do CTN para fixar os conceitos (material de exercícios).',
      ],
      vender: {
        publico: 'Empresas autuadas, com débitos na dívida ativa, execução fiscal, conta bloqueada ou dúvida se um tributo é mesmo devido.',
        dor: 'Auto de infração, certidão negativa recusada, bloqueio de conta, medo de perder prazo.',
        oferta: 'Análise de autos e débitos (prazos, decadência, prescrição, cálculo) e defesa administrativa; a parte judicial em parceria com um advogado tributarista.',
        roteiro: ['Recebeu notificação ou auto de infração? O prazo de 30 dias corre rápido.', 'A gente confere se o débito já decaiu ou prescreveu, se o cálculo está certo e monta a defesa.', 'Muita cobrança cai só por prazo ou por erro de cálculo.'],
        cobrar: 'Valor fixo pela análise + taxa de êxito sobre o que for cancelado ou reduzido. Na Justiça, sempre com advogado parceiro (o contador não assina a petição).',
      },
      reforma: [
        'A LC 214/2025 traz regras próprias do IBS e da CBS: fato gerador, créditos, split payment e responsáveis.',
        'O IBS terá processo administrativo próprio, organizado pelo Comitê Gestor (estados e municípios juntos).',
        'A CBS segue o caminho federal: Receita Federal e CARF.',
        'Na transição (2026–2033) vai haver discussão nos dois sistemas ao mesmo tempo — mais demanda de defesa e consultoria.',
        'Saldos de ICMS acumulados serão compensados/ressarcidos ao longo dos anos (EC 132): tema que deve gerar disputas.',
      ],
      materiais: ['2.0 – Linha do tempo', '3.0 – Questões CTN', '4.0 – Processo Administrativo', '5.0 – Processo Judicial', '6.0 – Processos Judiciais: peças'],
    },
    {
      id: 'planejamento', n: 3, ic: '🧭', cor: '#2b8a3e', nome: 'Planejamento Tributário', curto: 'Planejamento Tributário',
      resumo: 'Escolher, dentro da lei, o caminho que gera menos imposto: o regime certo, a estrutura da empresa e operações com propósito negocial. Diferencia elisão (lícita) de evasão (crime) e mostra como o CARF julga os planejamentos.',
      topicos: [
        'Elisão x evasão x elusão; propósito negocial e substância (art. 116, parágrafo único, do CTN).',
        'Simulação do mesmo negócio no Simples Nacional, Lucro Presumido e Lucro Real.',
        'Fator R, pró-labore x distribuição de lucros e segregação de receitas.',
        'Decisões do CARF: quando o planejamento é aceito e quando é desconsiderado.',
        'PLP 16/2025: proposta para não incluir IBS e CBS na base do ICMS.',
        'Comunicado aos fornecedores: preparar a cadeia para a Reforma (notas corretas e créditos).',
      ],
      vender: {
        publico: 'Empresas a partir de ~R$ 1 milhão por ano, empresas do Simples perto do limite ou que nunca revisaram o regime.',
        dor: '"Pago imposto demais e não sei se tem jeito."',
        oferta: 'Estudo comparativo de regimes + simulação de pró-labore x lucros + plano de ação com a economia estimada.',
        roteiro: ['Quando foi a última vez que alguém simulou o seu imposto nos três regimes?', 'A gente faz o estudo com seus números reais e mostra quanto dá para economizar, tudo dentro da lei.', 'Se não houver economia, você ganha a certeza de que já está no melhor caminho.'],
        cobrar: 'Preço fixo pelo estudo (ou um percentual da economia do primeiro ano) e revisão anual. Ótima porta de entrada para virar cliente mensal.',
      },
      reforma: [
        '2027: a CBS substitui PIS/COFINS. 2029 a 2032: ICMS e ISS diminuem e o IBS aumenta. 2033: só IBS e CBS.',
        'Empresas do Simples poderão recolher IBS/CBS por fora do DAS para passar crédito integral ao cliente — decisão de planejamento.',
        'Fornecedor que não gera crédito fica mais caro: vale rever a cadeia de compras.',
        'Com o tributo "por fora", a formação de preço precisa ser refeita.',
        'Os benefícios fiscais de ICMS acabam até 2032: rever incentivos e até a localização da empresa.',
      ],
      materiais: ['PLP 16/2025 – não inclusão de IBS e CBS na base do ICMS', 'Comunicado aos fornecedores', 'Decisão do CARF (processo 10980.723507/2014)'],
    },
    {
      id: 'recuperacao', n: 4, ic: '💰', cor: '#e8590c', nome: 'Recuperação de Créditos Tributários I (Administrativo)', curto: 'Recuperação de Créditos',
      resumo: 'Encontrar tributos pagos a mais nos últimos 5 anos e recuperar pela via administrativa (restituição ou compensação), sem processo judicial: monofásicos no Simples, ICMS-ST, retenções, enquadramento de serviços e a Tese do Século.',
      topicos: [
        'Prazo: 5 anos contados do pagamento indevido.',
        'PER/DCOMP: pedido de restituição e declaração de compensação na Receita Federal.',
        'Simples Nacional: retificar o PGDAS-D e pedir a restituição (manual da Receita).',
        'Produtos monofásicos (PIS/COFINS) e com ICMS-ST: segregar as receitas no PGDAS-D para não pagar duas vezes.',
        'Tese do Século (RE 574.706): ICMS fora da base do PIS/COFINS, com efeitos a partir de 15/03/2017.',
        'CNAE x item da lista de serviços (LC 116) e Soluções de Consulta (como a SC Cosit 60/2025) para enquadrar certo.',
        'Infográfico da Tese do Século e mapa mental do tema.',
      ],
      vender: {
        publico: 'Farmácias, autopeças, distribuidoras de bebidas, cosméticos, mercados e postos (monofásicos e ST); prestadores de serviço com retenções.',
        dor: 'Margem apertada e dinheiro parado na Receita sem o empresário saber.',
        oferta: 'Diagnóstico dos últimos 5 anos sem custo → relatório com o valor estimado → recuperação administrativa.',
        roteiro: ['Sabia que muita empresa do Simples paga PIS e COFINS duas vezes sobre o mesmo produto?', 'A gente revisa os últimos 5 anos sem custo e mostra quanto dá para recuperar.', 'Você só paga se o dinheiro voltar.'],
        cobrar: 'Taxa de êxito sobre o valor recuperado (no mercado, normalmente entre 20% e 30%), paga quando a compensação ou restituição acontecer.',
      },
      reforma: [
        'PIS e COFINS acabam em 2027: créditos dos últimos 5 anos precisam ser buscados agora — ótimo argumento de urgência.',
        'Saldos credores de ICMS que existirem em 2032 serão compensados/ressarcidos em parcelas (EC 132): exigem controle.',
        'No IBS/CBS haverá ressarcimento de créditos com prazos definidos (LC 214) — serviço recorrente novo.',
        'Com o split payment o trabalho muda de "recuperar" para "gerir créditos" todo mês.',
      ],
      materiais: ['Recuperação de Créditos Tributários Administrativos – Simples Nacional', 'Manual de restituição do Simples Nacional', 'Tese do Século + infográfico', 'CNAE x item da lista de serviços', 'SC Cosit nº 60/2025', 'RDC 50', 'Mapa mental (NotebookLM)'],
    },
    {
      id: 'simples', n: 5, ic: '🏪', cor: '#0c8599', nome: 'Simples Nacional e o Estatuto da Micro e Pequena Empresa', curto: 'Simples Nacional',
      resumo: 'As regras da LC 123/2006 e da Resolução CGSN 140/2018: quem pode optar, limites, anexos e alíquotas, Fator R, sublimites, obrigações (PGDAS-D e DEFIS) e como restituir ou compensar o que foi pago a mais.',
      topicos: [
        'Limites: ME até R$ 360 mil e EPP até R$ 4,8 milhões por ano; MEI até R$ 81 mil.',
        'Anexos I a V e alíquota efetiva: (receita de 12 meses × alíquota nominal − parcela a deduzir) ÷ receita de 12 meses.',
        'Fator R: folha ÷ receita ≥ 28% leva serviços do Anexo V para o Anexo III.',
        'Sublimite de R$ 3,6 milhões para ICMS e ISS dentro do DAS.',
        'Obrigações: PGDAS-D todo mês, DEFIS todo ano, vedações e exclusão.',
        'Manuais de restituição e de compensação do Simples.',
        'Benefícios do Estatuto: preferência em licitações, crédito facilitado, simplificação.',
      ],
      vender: {
        publico: 'MEIs que estão crescendo, pequenas empresas e prestadores de serviço com folha (Fator R).',
        dor: 'DAS alto, medo de estourar o limite, MEI que precisa virar ME.',
        oferta: 'Revisão do enquadramento (anexo, Fator R, segregação de receitas) + acompanhamento mensal do limite.',
        roteiro: ['O seu DAS está sendo calculado no anexo certo?', 'Com o Fator R, muitos serviços começam pagando 6% em vez de 15,5%.', 'A gente revisa e acompanha todo mês para você não estourar o limite.'],
        cobrar: 'Mensalidade por faixa de faturamento + revisão inicial avulsa; restituições com taxa de êxito.',
      },
      reforma: [
        'O Simples continua: CBS e IBS entram no DAS no lugar de PIS/COFINS, ICMS e ISS ao longo da transição.',
        'Novidade: a empresa do Simples pode recolher IBS/CBS por fora do DAS (regime regular) para gerar crédito integral ao cliente.',
        'Quem fica 100% no DAS transfere crédito só do que pagou — pode perder espaço com clientes empresas (B2B).',
        'O MEI continua com valor fixo mensal.',
        'Serviço novo: simulação "dentro x fora do DAS" para cada cliente que vende para empresas.',
      ],
      materiais: ['Simples Nacional (apostila)', 'Resolução CGSN nº 140/2018', 'Manual de compensação', 'Manual de restituição'],
    },
    {
      id: 'sped', n: 6, ic: '💻', cor: '#364fc7', nome: 'SPED e Auditoria Digital', curto: 'SPED e Auditoria Digital',
      resumo: 'As escriturações digitais (ECD, ECF, EFDs, eSocial e Reinf) e como a Receita cruza tudo automaticamente. Ensina a fazer a auditoria antes do fisco, com casos práticos de estoques, cruzamentos e Simples Nacional.',
      topicos: [
        'ECD (contabilidade digital) e ECF (IRPJ/CSLL): o que cada uma tem e como se ligam.',
        'EFD ICMS/IPI (com o Bloco H de inventário), EFD-Contribuições, EFD-Reinf e eSocial.',
        'Cruzamentos do fisco: ECD x ECF, notas x EFD, DEFIS x PGDAS-D x notas (CFOP), rendimentos x folha.',
        'Caso prático 2 – Estoques: inventário inicial x final e a diferença que vira omissão de receita.',
        'Caso prático 3 – Cruzamentos: apuração do Lucro Real trimestral na ECF.',
        'Caso prático 4 – Simples Nacional: DEFIS, CFOPs, comprovantes de rendimentos e balancetes.',
      ],
      vender: {
        publico: 'Empresas do Presumido e do Real, comércio e indústria com estoque, empresas do Simples com muitas notas.',
        dor: 'Malha fiscal, intimação, multa por diferença entre as declarações.',
        oferta: 'Auditoria digital preventiva: cruzar as escriturações dos últimos 5 anos e corrigir antes da Receita.',
        roteiro: ['A Receita cruza as suas declarações automaticamente. Você sabe o que ela está vendo?', 'A gente faz o mesmo cruzamento antes dela e corrige o que estiver diferente.', 'Retificar antes da fiscalização evita multa de 75% ou mais.'],
        cobrar: 'Projeto por período auditado + mensalidade de monitoramento (cruzamento todo mês).',
      },
      reforma: [
        'Em 2026 (ano de teste) as notas já destacam CBS 0,9% e IBS 0,1%, com campos novos na NF-e e na NFS-e.',
        'Apuração assistida: o fisco vai pré-calcular o IBS/CBS a partir das notas — erro de cadastro aparece na hora.',
        'Split payment: o imposto é separado no pagamento; a conciliação bancária vira auditoria fiscal.',
        'As EFDs vão mudar aos poucos — quem domina o SPED sai na frente.',
      ],
      materiais: ['SPED e Auditoria Digital – ECD e ECF', 'Escriturações Contábeis e Auditorias Digitais', 'Caso prático 2 – Estoques (RI inicial e final)', 'Caso prático 3 – Cruzamentos (ECF Lucro Real)', 'Caso prático 4 – Simples Nacional (DEFIS, CFOPs, balancetes, tabela CFOP)'],
    },
    {
      id: 'consumo', n: 7, ic: '🛒', cor: '#c2255c', nome: 'Tributação sobre o Consumo I – ICMS, IPI, PIS, COFINS e ISS', curto: 'Tributos sobre o Consumo',
      resumo: 'Os cinco tributos sobre o consumo de hoje: quem paga, base de cálculo, alíquotas, créditos, substituição tributária e DIFAL, com auditoria baseada no risco de multas. É a base para entender o que a Reforma vai substituir.',
      topicos: [
        'ICMS (LC 87/96): mercadorias, transporte e comunicação; não cumulatividade; ICMS-ST; DIFAL (EC 87/2015 e LC 190/2022); operações interestaduais.',
        'IPI: industrialização, tabela TIPI e créditos.',
        'PIS/COFINS: cumulativo (3,65%) no Presumido e não cumulativo (9,25%) no Real, com créditos; produtos monofásicos.',
        'ISS (LC 116/2003): lista de serviços, onde recolher e retenção.',
        'Auditoria baseada no risco de penalidades: onde as multas mais aparecem e como prevenir.',
      ],
      vender: {
        publico: 'Comércio e indústria (ICMS/IPI), prestadores de serviço (ISS), empresas do Presumido e do Real.',
        dor: 'ICMS-ST e DIFAL confusos, multas, crédito perdido.',
        oferta: 'Revisão do cadastro fiscal (NCM, CFOP, CST), da apuração e dos créditos; consultoria para operações interestaduais.',
        roteiro: ['O cadastro dos seus produtos (NCM, CST, CFOP) foi revisado nos últimos anos?', 'Um NCM errado muda o ICMS-ST, o PIS/COFINS e agora o IBS/CBS.', 'A gente revisa, corrige e mostra o crédito que está ficando para trás.'],
        cobrar: 'Projeto de revisão pela quantidade de itens + mensalidade de apuração.',
      },
      reforma: [
        '2026: teste com CBS 0,9% e IBS 0,1% destacados nas notas.',
        '2027: a CBS substitui PIS/COFINS; o IPI é zerado (menos na Zona Franca) e começa o Imposto Seletivo.',
        '2029–2032: ICMS e ISS caem aos poucos e o IBS sobe; 2033: só IBS e CBS.',
        'IVA dual: crédito amplo, cobrança no destino, não cumulatividade plena e split payment.',
        'Durante toda a transição é preciso dominar os tributos antigos e os novos.',
      ],
      materiais: ['Abordagem geral do ICMS', 'Tributos indiretos – ICMS e IPI', 'Artigo: ICMS interestadual', 'Artigo: Auditoria baseada em risco de penalidades tributárias'],
    },
    {
      id: 'renda', n: 8, ic: '📊', cor: '#5f3dc4', nome: 'Tributos sobre a Renda e Patrimônio (IRPJ e CSLL)', curto: 'IRPJ e CSLL',
      resumo: 'Como apurar IRPJ e CSLL no Lucro Real, no Presumido e no Arbitrado: bases, alíquotas, adicional, adições e exclusões, compensação de prejuízos e quando cada regime vale mais a pena.',
      topicos: [
        'Alíquotas: IRPJ 15% + adicional de 10% sobre o lucro acima de R$ 20 mil por mês; CSLL 9% (regra geral).',
        'Lucro Presumido: presunção sobre a receita (IRPJ 8% comércio/indústria e 32% serviços; CSLL 12% ou 32%), limite de R$ 78 milhões por ano.',
        'Lucro Real: lucro contábil ajustado por adições e exclusões (LALUR/LACS), anual com estimativas ou trimestral.',
        'Compensação de prejuízo fiscal limitada a 30% do lucro do período.',
        'Lucro Arbitrado: quando a escrituração não existe ou não é confiável.',
        'Distribuição de lucros e pró-labore.',
      ],
      vender: {
        publico: 'Empresas do Presumido com margem baixa (podem ganhar no Real) e empresas que distribuem muito lucro.',
        dor: 'IR alto, dúvida entre Presumido e Real, tributação dos dividendos.',
        oferta: 'Simulação Presumido x Real + planejamento de pró-labore e distribuição de lucros.',
        roteiro: ['A sua margem de verdade é maior ou menor que a presunção do Presumido?', 'Se for menor, o Lucro Real pode reduzir bastante o IR e a CSLL.', 'A gente simula com os seus números e você decide com segurança.'],
        cobrar: 'Estudo avulso + apuração mensal ou trimestral no regime escolhido (o Lucro Real tem mensalidade maior).',
      },
      reforma: [
        'A Reforma do consumo não muda as alíquotas de IRPJ e CSLL, mas muda receita e custos (IBS/CBS por fora).',
        'Desde 2026 há retenção de 10% de IR sobre lucros e dividendos acima de R$ 50 mil por mês para a mesma pessoa, e imposto mínimo para altas rendas (Lei 15.270/2025).',
        'O planejamento de pró-labore x dividendos precisa ser refeito.',
        'O fim dos benefícios de ICMS pode aumentar o lucro tributável — incluir no planejamento.',
      ],
      materiais: ['Lucro Real (on-line)', 'Lucro Presumido (on-line)', 'Lucro Arbitrado (on-line)'],
    },
  ];

  // ------------------------------------------------------------------ desenho: prédio por fora e corredor das salas
  const W = 320, H = 200;
  const cena = { modo: 'fora', raf: 0, t0: 0, kaua: { x: 70, y: 168, vis: false }, carro: { x: -40 }, sel: null, salas: [] };
  function ceu(g) {
    const per = KM.periodo(A().cfg()), c = { dia: ['#79ade3', '#bfdcf5'], tarde: ['#33357a', '#e89a68'], noite: ['#141838', '#3a2f5a'] }[per] || ['#79ade3', '#bfdcf5'];
    const gr = g.createLinearGradient(0, 0, 0, 150); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); g.fillStyle = gr; g.fillRect(0, 0, W, 150);
    return per;
  }
  function desenharFora(g, t) {
    const per = ceu(g), noite = per === 'noite';
    // prédios ao fundo
    for (const [x, w, h, c] of [[0, 40, 70, '#5c6680'], [36, 30, 50, '#6b7590'], [250, 36, 80, '#5c6680'], [284, 36, 56, '#6b7590']]) { r(g, x, 150 - h, w, h, c); for (let yy = 150 - h + 6; yy < 146; yy += 9) for (let xx = x + 4; xx < x + w - 4; xx += 8) r(g, xx, yy, 4, 5, noite ? '#ffe8a3' : '#9fb3cf'); }
    // prédio do IPOG
    const bx = 78, bw = 164, by = 30;
    r(g, bx - 2, by - 2, bw + 4, 122, '#1c2333');
    r(g, bx, by, bw, 120, '#e9eef5');
    r(g, bx, by, bw, 8, '#1b3a6b');
    for (let f = 0; f < 4; f++) for (let k = 0; k < 7; k++) {
      const x = bx + 8 + k * 22, y = by + 16 + f * 22;
      r(g, x, y, 16, 14, '#1c2333'); r(g, x + 1, y + 1, 14, 12, noite ? (k + f) % 3 ? '#ffe08a' : '#3a4a6b' : '#8fb6e0'); r(g, x + 1, y + 1, 14, 3, noite ? '#fff3bf' : '#c5dcf2');
    }
    // letreiro
    r(g, bx + 46, by - 18, 72, 18, '#1b3a6b'); r(g, bx + 48, by - 16, 68, 14, '#24508f');
    KM.texto(g, 'IPOG', bx + 82 - (larg('IPOG') >> 1), by - 12, '#ffffff'); r(g, bx + 54, by - 6, 56, 1, '#f08c00');
    // entrada
    r(g, bx + 62, by + 100, 40, 20, '#1c2333'); r(g, bx + 64, by + 102, 17, 18, '#a5d8ff'); r(g, bx + 83, by + 102, 17, 18, '#a5d8ff'); r(g, bx + 56, by + 96, 52, 4, '#1b3a6b');
    tx(g, 'POS-GRADUACAO', bx + 82 - (larg('POS-GRADUACAO') >> 1), by + 90, '#1b3a6b');
    // calçada e rua
    r(g, 0, 150, W, 16, '#c9c3b0'); for (let x = 0; x < W; x += 16) r(g, x, 150, 1, 16, '#b5ae99');
    r(g, 0, 166, W, 34, '#3a3e4f'); for (let x = 6; x < W; x += 24) r(g, x, 182, 12, 2, '#e9e4d0');
    // árvores
    for (const x of [20, 262, 300]) { r(g, x + 4, 130, 3, 20, '#6b4a2b'); r(g, x - 4, 112, 20, 20, '#2f9e44'); r(g, x - 1, 108, 14, 8, '#40c057'); }
    // carro da KWIK
    const cx = Math.round(cena.carro.x);
    r(g, cx, 172, 34, 10, '#ffffff'); r(g, cx + 6, 166, 20, 7, '#e9ecef'); r(g, cx + 8, 167, 7, 5, '#74c0fc'); r(g, cx + 17, 167, 7, 5, '#74c0fc');
    r(g, cx, 176, 34, 2, '#28BE52'); tx(g, 'KWIK', cx + 9, 177, '#28BE52'); r(g, cx + 4, 181, 7, 4, '#111'); r(g, cx + 23, 181, 7, 4, '#111');
    // Kauã andando até a porta
    const k = cena.kaua;
    if (k.vis) {
      const f = A().cfg().funcionarios.find(x => x.id === 'f1');
      if (f) { const s = KM.sprite(f.aparencia, { passo: k.andando ? [1, 0, 2, 0][Math.floor(t * 8) % 4] : 0, vista: k.costas ? 'costas' : 'frente' }); g.drawImage(s, Math.round(k.x) - 15, Math.round(k.y) - 45); }
    }
  }
  function desenharDentro(g, t) {
    r(g, 0, 0, W, H, '#dfe5ec');
    r(g, 0, 0, W, 18, '#1b3a6b'); KM.texto(g, 'IPOG  -  MODULOS DA POS', 8, 6, '#ffffff'); r(g, 0, 18, W, 2, '#f08c00');
    // piso do corredor
    for (let y = 104; y < 118; y += 7) for (let x = 0; x < W; x += 14) r(g, x + ((y / 7) % 2) * 7, y, 13, 6, (x / 14 + y / 7) % 2 ? '#c9d2dc' : '#d3dbe4');
    r(g, 0, 186, W, 14, '#c9d2dc');
    cena.salas = [];
    MODULOS.forEach((m, i) => {
      const col = i % 4, lin = Math.floor(i / 4), x = 10 + col * 77, y = lin ? 120 : 26, w = 70, h = 72;
      cena.salas.push({ x, y, w, h, m });
      const sel = cena.sel === m.id;
      r(g, x - 1, y - 1, w + 2, h + 2, sel ? '#f08c00' : '#1c2333');
      r(g, x, y, w, h, '#f8f9fa'); r(g, x, y, w, 12, m.cor);
      KM.texto(g, 'SALA ' + m.n, x + 4, y + 3, '#ffffff');
      // porta
      r(g, x + 24, y + 30, 22, 42, '#8d5a3b'); r(g, x + 26, y + 32, 18, 38, '#a0693f'); r(g, x + 41, y + 50, 2, 3, '#ffd43b');
      r(g, x + 27, y + 34, 16, 10, '#cfe8f6');
      // quadrinho com o número
      r(g, x + 4, y + 18, 16, 16, m.cor); KM.texto(g, String(m.n), x + 10, y + 23, '#ffffff');
      // aluno estudando na janela
      r(g, x + 50, y + 18, 16, 14, '#1c2333'); r(g, x + 51, y + 19, 14, 12, '#a5d8ff'); r(g, x + 55, y + 24, 6, 5, '#e8b48f'); r(g, x + 55, y + 23, 6, 2, '#3b2416');
      if (sel) { r(g, x + 2, y + h - 6, w - 4, 3, '#f08c00'); }
    });
    // Kauã no corredor
    const f = A().cfg().funcionarios.find(x => x.id === 'f1');
    if (f) { const k = cena.kaua, s = KM.sprite(f.aparencia, { passo: k.andando ? [1, 0, 2, 0][Math.floor(t * 8) % 4] : 0, vista: k.costas ? 'costas' : 'frente', boca: 'sorriso' }); g.drawImage(s, Math.round(k.x) - 15, Math.round(k.y) - 45); }
  }
  function quadro(agora) {
    const cv = $('#ipogTela'); if (!cv || !$('#dlgIpog').open) { cena.raf = 0; return; }
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const t = agora / 1000;
    if (cena.modo === 'fora') desenharFora(g, t); else desenharDentro(g, t);
    cena.raf = requestAnimationFrame(quadro);
  }
  const anim = (fn, ms) => new Promise(res => { const t0 = performance.now(); const p = () => { const k = Math.min(1, (performance.now() - t0) / ms); fn(k); if (k < 1) requestAnimationFrame(p); else res(); }; p(); });

  // ------------------------------------------------------------------ janela
  function montar() {
    if ($('#dlgIpog')) return;
    const d = document.createElement('dialog'); d.id = 'dlgIpog'; d.className = 'rua-dlg ipog-dlg';
    d.innerHTML = `<div class="dlg-topo"><h2>🎓 IPOG · Pós-graduação</h2><div class="rua-bts"><button class="bt peq" id="ipogEntrar">🚪 Entrar no prédio</button><button class="bt peq prim" id="ipogVoltar">🏢 Voltar</button></div></div>
      <div class="rua-cena ipog-cena"><canvas id="ipogTela" width="${W}" height="${H}"></canvas></div>
      <div class="rua-dica" id="ipogDica">Chegando no IPOG…</div>
      <div class="dlg-corpo" id="ipogInfo"></div>`;
    document.body.append(d);
    $('#ipogVoltar').addEventListener('click', () => d.close());
    $('#ipogEntrar').addEventListener('click', entrar);
    d.addEventListener('close', () => { cancelAnimationFrame(cena.raf); cena.raf = 0; KM.clientesFora.voltar('Voltei do IPOG! Cabeça cheia de ideias 🎓'); });
    $('#ipogTela').addEventListener('click', e => {
      const cv = e.currentTarget, x = e.offsetX / cv.clientWidth * W, y = e.offsetY / cv.clientHeight * H;
      if (cena.modo === 'fora') return entrar();
      const s = cena.salas.find(q => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
      if (s) abrirModulo(s.m.id);
    });
  }
  async function abrirIpog() {
    montar();
    const d = $('#dlgIpog'); if (!d.open) d.showModal();
    cena.modo = 'fora'; cena.sel = null; cena.kaua = { x: 60, y: 168, vis: false }; cena.carro.x = -40;
    $('#ipogEntrar').hidden = false;
    $('#ipogDica').textContent = 'Chegando no IPOG…';
    renderLista();
    if (!cena.raf) cena.raf = requestAnimationFrame(quadro);
    KM.tocar && KM.tocar('moto');
    await anim(k => { cena.carro.x = -40 + (60 + 40) * (1 - Math.pow(1 - k, 3)); }, 1400);
    Object.assign(cena.kaua, { x: 98, y: 166, vis: true, andando: true, costas: true });
    await anim(k => { cena.kaua.x = 98 + (160 - 98) * k; cena.kaua.y = 166 - 14 * k; }, 1100);
    cena.kaua.andando = false;
    $('#ipogDica').textContent = 'Toque no prédio (ou em "Entrar") para ver as salas de cada módulo.';
  }
  async function entrar() {
    if (cena.modo === 'dentro') return;
    cena.modo = 'dentro'; $('#ipogEntrar').hidden = true;
    Object.assign(cena.kaua, { x: 6, y: 114, vis: true, andando: true, costas: false });
    $('#ipogDica').textContent = 'Cada sala é um módulo. Toque numa sala para ver o resumo, como vender e a Reforma Tributária.';
    await anim(k => { cena.kaua.x = 6 + 150 * k; }, 1200);
    cena.kaua.andando = false;
  }
  function renderLista() {
    const { el } = A(), box = $('#ipogInfo'); box.innerHTML = '';
    box.append(el('p', { class: 'vazio', style: 'margin:0 0 10px' }, `${MODULOS.length} módulos estudados (pasta Estudo IPOG → Modulos). Toque num módulo:`));
    const g = el('div', { class: 'ipog-grade' });
    for (const m of MODULOS) g.append(el('button', { class: 'ipog-mod' + (cena.sel === m.id ? ' on' : ''), style: `--c:${m.cor}`, onclick: () => abrirModulo(m.id) },
      el('span', { class: 'ic' }, m.ic), el('span', {}, el('small', {}, `Sala ${m.n}`), el('b', {}, m.curto))));
    box.append(g);
  }
  let abaMod = 'resumo';
  async function abrirModulo(id, aba) {
    const m = MODULOS.find(x => x.id === id); if (!m) return;
    if (cena.modo !== 'dentro') { cena.modo = 'dentro'; $('#ipogEntrar').hidden = true; }
    cena.sel = id; if (aba) abaMod = aba;
    const s = cena.salas.find(q => q.m.id === id);
    if (s) { Object.assign(cena.kaua, { andando: true }); const x0 = cena.kaua.x, x1 = s.x + s.w / 2, y0 = cena.kaua.y; anim(k => { cena.kaua.x = x0 + (x1 - x0) * k; cena.kaua.y = y0; }, 500).then(() => { cena.kaua.andando = false; cena.kaua.costas = s.y < 100; }); }
    const { el } = A(), box = $('#ipogInfo'); box.innerHTML = '';
    box.append(el('div', { class: 'ipog-cab', style: `--c:${m.cor}` }, el('span', { class: 'ic' }, m.ic), el('div', {}, el('small', {}, `Sala ${m.n} · Módulo`), el('h3', {}, m.nome)),
      el('button', { class: 'bt peq', onclick: () => { cena.sel = null; renderLista(); } }, '◀ Todos os módulos')));
    const ABAS = [['resumo', '📌 Resumo'], ['tudo', '📚 Tudo sobre'], ['vender', '💼 Como vender'], ['reforma', '🔄 Reforma Tributária'], ['materiais', '📁 Materiais']];
    const nav = el('div', { class: 'ipog-abas' }, ABAS.map(([k, t]) => el('button', { class: abaMod === k ? 'on' : '', onclick: () => abrirModulo(id, k) }, t)));
    const corpo = el('div', { class: 'ipog-corpo' });
    if (abaMod === 'resumo') corpo.append(el('p', { class: 'ipog-resumo' }, m.resumo), el('h4', {}, 'Em uma frase para o cliente'), el('p', {}, `"${m.vender.roteiro[m.vender.roteiro.length - 1]}"`), el('h4', {}, 'O que estudar primeiro'), el('ul', {}, m.topicos.slice(0, 3).map(t => el('li', {}, t))));
    if (abaMod === 'tudo') corpo.append(el('ul', { class: 'ipog-lista' }, m.topicos.map(t => el('li', {}, t))));
    if (abaMod === 'vender') {
      const v = m.vender;
      corpo.append(el('div', { class: 'ipog-vender' },
        el('div', {}, el('b', {}, '🎯 Para quem vender'), el('p', {}, v.publico)),
        el('div', {}, el('b', {}, '😣 A dor do cliente'), el('p', {}, v.dor)),
        el('div', {}, el('b', {}, '🎁 O que oferecer'), el('p', {}, v.oferta)),
        el('div', {}, el('b', {}, '💲 Como cobrar'), el('p', {}, v.cobrar))),
        el('h4', {}, '🗣️ Roteiro de abordagem'), el('ol', { class: 'ipog-roteiro' }, v.roteiro.map(t => el('li', {}, t))),
        el('div', { class: 'ipog-bts' },
          el('button', { class: 'bt peq', onclick: () => { navigator.clipboard && navigator.clipboard.writeText(v.roteiro.join('\n')).then(() => A().toast('📋 Roteiro copiado'), () => {}); } }, '📋 Copiar o roteiro'),
          KM.precificacao && KM.precificacao.pedirCom ? el('button', { class: 'bt peq', onclick: () => { $('#dlgIpog').close(); setTimeout(() => KM.precificacao.pedirCom(`Quanto cobrar por este serviço? ${m.vender.oferta} Público: ${m.vender.publico} (módulo ${m.curto} do IPOG)`), 400); } }, '🧮 Pedir preço para a Dona Iva') : null));
    }
    if (abaMod === 'reforma') corpo.append(el('p', { class: 'ipog-resumo' }, 'O que muda neste tema com a Reforma Tributária (EC 132/2023 e LC 214/2025):'), el('ul', { class: 'ipog-lista' }, m.reforma.map(t => el('li', {}, t))),
      el('p', { class: 'vazio' }, 'Linha do tempo: 2026 teste (CBS 0,9% + IBS 0,1% nas notas) · 2027 CBS no lugar de PIS/COFINS e IPI zerado · 2029–2032 ICMS/ISS caindo e IBS subindo · 2033 só IBS e CBS.'));
    if (abaMod === 'materiais') corpo.append(el('p', { class: 'vazio' }, 'Arquivos da pasta deste módulo (ficam no seu computador, em Estudo (IPOG) → Modulos (Todos)):'), el('ul', { class: 'ipog-lista' }, m.materiais.map(t => el('li', {}, '📄 ' + t))));
    box.append(nav, corpo);
    box.scrollIntoView && $('#ipogInfo').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function ir() {
    KM.clientesFora.sair({ abrir: abrirIpog, fala: 'Partiu IPOG! Hoje é dia de estudar 🎓', acao: 'ipog' });
  }
  function iniciar() {}
  KM.ipog = { iniciar, ir, abrir: abrirIpog, abrirModulo, MODULOS };
})();
