/* KWIK Mini Escritório · RH e Tarefas.
   - RH (Rita): contrata gente nova para cada setor. Quem entra chega pela rua, passa no RH e senta numa mesa nova do setor.
   - Tarefas: de tempos em tempos o chefe de um setor passa uma tarefa para alguém da equipe dele. A pessoa faz e entrega
     (tarefa feita, relatório de melhoria, ideia ou relatório do setor). Você avalia na aba Tarefas e a reputação muda. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  const el = (...a) => A().el(...a);
  const sorteio = l => l[Math.floor(Math.random() * l.length)];
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // ------------------------------------------------------------------ setores
  const SETOR = {
    controladoria: { nome: 'Controladoria', ic: '📊', cargo: 'Assistente de Controladoria' },
    comercial: { nome: 'Comercial', ic: '💬', cargo: 'Assistente Comercial' },
    marketing: { nome: 'Marketing', ic: '🎬', cargo: 'Assistente de Marketing' },
    relacionamento: { nome: 'Relacionamento', ic: '💚', cargo: 'Analista de Relacionamento' },
    financeiro: { nome: 'Financeiro', ic: '📈', cargo: 'Assistente Financeiro' },
    precificacao: { nome: 'Precificação', ic: '🧮', cargo: 'Assistente de Precificação' },
    fiscal: { nome: 'Fiscal', ic: '🧾', cargo: 'Assistente Fiscal' },
    folha: { nome: 'Folha', ic: '👥', cargo: 'Assistente de Departamento Pessoal' },
    rh: { nome: 'RH', ic: '🤝', cargo: 'Assistente de RH' },
    ebook: { nome: 'E-book', ic: '📘', cargo: 'Assistente de E-book' },
  };
  const SALA_EXTRA = { noticias: 'diretoria', checklist: 'diretoria', limpeza: 'zeladoria' };
  const cfg = () => A().cfg();
  const funcs = () => cfg().funcionarios;
  // setor (sala) de um funcionário
  function setorDe(f) {
    if (!f) return null;
    if (f.setor) return f.setor;
    for (const [sala, funcao] of Object.entries(KM.SETORES)) if (funcao === f.funcao) return sala;
    return SALA_EXTRA[f.funcao] || null;
  }
  const chefeDe = setor => funcs().find(f => !f.contratado && f.funcao === KM.SETORES[setor]);
  const equipeDe = setor => funcs().filter(f => setorDe(f) === setor && (f.contratado || f.funcao === KM.SETORES[setor]));
  const contratadosDe = setor => funcs().filter(f => f.contratado && f.setor === setor);
  const vagasDe = setor => Math.max(0, ((KM.LAYOUT && KM.LAYOUT.pontos.vagas) || {})[setor] || 0) - contratadosDe(setor).length;
  const primeiro = f => (f && f.nome || '').trim().split(' ')[0];

  // ------------------------------------------------------------------ reputação
  const repDe = f => Math.max(0, Math.min(100, f && f.reputacao != null ? f.reputacao : 50));
  function repInfo(f) {
    const v = repDe(f);
    const nome = v >= 85 ? 'Destaque da empresa' : v >= 70 ? 'Muito bom' : v >= 50 ? 'Bom' : v >= 30 ? 'Regular' : 'Em observação';
    const est = Math.max(1, Math.min(5, Math.round(v / 20)));
    return { v, nome, estrelas: '★'.repeat(est) + '☆'.repeat(5 - est) };
  }

  // ------------------------------------------------------------------ candidatos
  const NOMES_M = ['Lucas', 'Pedro', 'Gabriel', 'Mateus', 'Rafael', 'Thiago', 'Diego', 'Felipe', 'André', 'Caio', 'Vinícius', 'Igor', 'Davi', 'Samuel'];
  const NOMES_F = ['Ana', 'Júlia', 'Mariana', 'Beatriz', 'Larissa', 'Camila', 'Letícia', 'Fernanda', 'Patrícia', 'Yasmin', 'Bianca', 'Raquel', 'Débora', 'Lívia'];
  const SOBRENOMES = ['Silva', 'Souza', 'Costa', 'Lima', 'Pereira', 'Araújo', 'Ribeiro', 'Carvalho', 'Almeida', 'Rocha', 'Mendes', 'Nunes', 'Moraes', 'Barros', 'Freitas', 'Cardoso'];
  const PELES = ['#FFDBAC', '#F5D0B5', '#F1C9A5', '#E8B48F', '#E0AC82', '#C68642', '#A0673C', '#8D5524', '#5C3A21'];
  const CABELOS = ['#1C1C1C', '#3B2416', '#5A3825', '#8a5a2b', '#E6C35C', '#b5532f', '#4a4a4a'];
  const ROUPAS = ['#ffffff', '#cfe0f5', '#28BE52', '#1f3a68', '#f4b6c2', '#ffa94d', '#b197fc', '#3f7fc1', '#111A19', '#e9d5b7'];
  const FORTES = {
    controladoria: ['Conciliação bancária', 'Excel avançado', 'Balancete', 'Organização', 'Análise de custos'],
    comercial: ['Boa conversa', 'Negociação', 'Follow-up', 'CRM', 'Prospecção no WhatsApp'],
    marketing: ['Vídeos curtos', 'Canva', 'Copywriting', 'Instagram', 'Tráfego pago'],
    relacionamento: ['Paciência', 'Atendimento', 'Pós-venda', 'Pesquisa de satisfação', 'Resolver problemas'],
    financeiro: ['Fluxo de caixa', 'Contas a pagar', 'Cobrança', 'Planilhas', 'Investimentos'],
    precificacao: ['Cálculo de custos', 'Pesquisa de mercado', 'Margem de lucro', 'Excel', 'Propostas'],
    fiscal: ['Simples Nacional', 'Notas fiscais', 'Apuração de ICMS/ISS', 'SPED', 'Reforma Tributária'],
    folha: ['eSocial', 'Cálculo de férias e rescisão', 'FGTS Digital', 'DCTFWeb', 'Admissões'],
    rh: ['Recrutamento', 'Entrevistas', 'Treinamentos', 'Clima organizacional', 'Integração de novatos'],
    ebook: ['Copy de vendas', 'Tráfego pago', 'Canva', 'Atendimento a compradores', 'Kiwify'],
  };
  const EXP = ['Primeiro emprego, muita vontade de aprender', '1 ano em escritório de contabilidade', '2 anos em escritório de contabilidade', '3 anos numa empresa do comércio', 'Estagiou 1 ano numa contabilidade', '4 anos de experiência na área', 'Formado(a) em Ciências Contábeis, 2 anos na área'];
  function aparenciaNova(fem) {
    const base = JSON.parse(JSON.stringify(funcs()[0].aparencia));
    return Object.assign(base, {
      pele: sorteio(PELES), cabelo: fem ? sorteio(['longo', 'coque', 'cacheado', 'longo']) : sorteio(['curto', 'topete', 'cacheado', 'curto', 'careca', 'moicano']),
      corCabelo: sorteio(CABELOS), estiloCamisa: sorteio(['kwik', 'social', 'casual', 'camiseta', 'kwik']), corCamisa: sorteio(ROUPAS), corGravata: '#28BE52',
      calca: sorteio(['#2F3A4A', '#3b4a6b', '#111A19', '#3b5b8a']), oculos: Math.random() < 0.3, barba: !fem && Math.random() < 0.3, chapeu: '', bone: false,
      baixo: fem && Math.random() < 0.35 ? 'saia' : 'calca', calcado: sorteio(['sapato', 'tenis']), altura: Math.random() < 0.25 ? 'baixo' : 'normal',
      brinco: fem && Math.random() < 0.5, boca: sorteio(['normal', 'sorriso']), cracha: true, corCordao: '#28BE52',
    });
  }
  function candidatos(setor, n = 3) {
    return Array.from({ length: n }, () => {
      const fem = Math.random() < 0.5, nome = `${sorteio(fem ? NOMES_F : NOMES_M)} ${sorteio(SOBRENOMES)}`;
      const fortes = FORTES[setor].slice().sort(() => Math.random() - 0.5).slice(0, 2);
      const nota = entre(3, 5);
      return { id: uid(), nome, fem, idade: entre(19, 42), exp: sorteio(EXP), fortes, nota, pretensao: 1600 + entre(0, 14) * 100 + (nota - 3) * 300, ap: aparenciaNova(fem) };
    });
  }

  // ------------------------------------------------------------------ tarefas: modelos por setor
  // tipos: tarefa (tarefa feita), melhoria (relatório de melhoria do setor), ideia, relatorio
  const TIPO = { tarefa: '✅ Tarefa', melhoria: '📈 Relatório de melhoria', ideia: '💡 Ideia', relatorio: '📄 Relatório do setor' };
  const MODELOS = {
    fiscal: [
      ['tarefa', 'Conferência das guias de {mes}', 'Conferi as guias do DAS de {n} empresas do Simples. {cliente} teve aumento de faturamento e mudou de faixa: a alíquota efetiva subiu. A guia de {cliente2} ficou separada porque uma nota de serviço não entrou no PGDAS-D — já pedi o XML.'],
      ['tarefa', 'Notas fiscais de {cliente}', 'Baixei e conferi as notas de entrada e saída de {cliente}. Encontrei {n2} notas com CFOP diferente do cadastro; corrigi a escrituração e avisei o cliente.'],
      ['melhoria', 'Calendário de vencimentos com aviso', 'Hoje o controle de vencimentos é manual. Proposta: um quadro semanal com todas as guias (DAS, ISS, DCTFWeb) por cliente e aviso automático 3 dias antes. Estimativa: até {pct}% menos multas por atraso.'],
      ['ideia', 'Checklist da Reforma Tributária para os clientes', 'Em 2026 as notas já destacam CBS (0,9%) e IBS (0,1%). Sugiro revisar o cadastro de produtos e serviços de cada cliente e mandar um aviso explicando o que muda. Dá para oferecer como consultoria paga.'],
      ['relatorio', 'Resumo fiscal de {mes}', '{n} empresas com as guias em dia e {n2} com pendência. Maior imposto do mês: {cliente}. Nenhuma multa nova. Próximo passo: cobrar os XMLs que faltam até dia 5.'],
      ['ideia', 'Revisão de monofásicos no Simples', 'Clientes que vendem produtos monofásicos (bebidas, cosméticos, autopeças) podem estar pagando PIS/COFINS em dobro no DAS. Posso revisar os últimos 5 anos de {cliente} e ver se tem crédito para recuperar.'],
    ],
    folha: [
      ['tarefa', 'Fechamento da folha de {cliente}', 'Lancei horas extras e faltas, conferi os contracheques e enviei os eventos do eSocial. Falta só o cliente aprovar a prévia para gerar a DCTFWeb e o FGTS Digital.'],
      ['tarefa', 'Férias vencendo', '{n2} funcionários dos clientes vencem férias nos próximos 60 dias. Já mandei o aviso para {cliente} e {cliente2} com as datas sugeridas.'],
      ['melhoria', 'Prévia da folha 3 dias antes', 'Mandar a prévia da folha para o cliente aprovar 3 dias antes do fechamento. Menos retificação de DCTFWeb e menos correria no dia 20.'],
      ['ideia', 'Admissão 100% digital', 'Um formulário online para o cliente mandar os documentos do funcionário novo. A admissão fica pronta no mesmo dia e evita multa por envio atrasado ao eSocial.'],
      ['relatorio', 'Resumo da folha de {mes}', '{n} folhas fechadas, FGTS Digital e DCTFWeb enviados no prazo. {cliente} contratou {n2} pessoas este mês.'],
    ],
    controladoria: [
      ['tarefa', 'Conciliação bancária de {cliente}', 'Conciliei {n} lançamentos do extrato. {n2} pagamentos estavam sem nota fiscal — pedi os comprovantes ao cliente e deixei marcados no sistema.'],
      ['melhoria', 'Fechamento contábil até o dia 10', 'Proposta: fechar os balancetes de todos os clientes até o dia 10 com um checklist (extratos, notas, folha, impostos). Hoje fechamos perto do dia 20.'],
      ['ideia', 'Relatório gerencial mensal para os clientes', 'Mandar para cada cliente um painel simples: faturamento, lucro, impostos e caixa do mês. Ajuda o cliente a decidir e aumenta o valor percebido do nosso serviço.'],
      ['relatorio', 'Indicadores da Controladoria', '{n} clientes conciliados, {n2} com pendência de documentos. Tempo médio de fechamento caiu {pct}% em relação ao mês passado.'],
    ],
    comercial: [
      ['tarefa', 'Follow-up das propostas', 'Liguei para {n2} empresas que receberam proposta. {cliente} pediu reunião para a semana que vem; duas pediram desconto.'],
      ['melhoria', 'Roteiro da primeira ligação', 'Escrevi um roteiro curto: apresentar a KWIK em 20 segundos, perguntar a maior dor do cliente e marcar uma conversa. Testei com {n2} contatos e marcamos mais reuniões.'],
      ['ideia', 'Indicação premiada', 'Cliente que indicar uma empresa que fechar com a gente ganha um mês com 50% de desconto. Indicação é o cliente mais barato de conquistar.'],
      ['relatorio', 'Funil de vendas da semana', '{n} contatos, {n2} propostas enviadas e 1 fechamento. Ticket médio das propostas: R$ {valor}.'],
    ],
    marketing: [
      ['tarefa', 'Calendário de posts', '{n2} posts prontos para o Instagram, com 2 vídeos curtos sobre a Reforma Tributária e 1 depoimento de cliente.'],
      ['melhoria', 'Perfil do Google da KWIK', 'Atualizei fotos, horário e serviços no Google. Proposta: pedir avaliação para cada cliente satisfeito — perfis com mais avaliações aparecem primeiro nas buscas de "contador em São Luís".'],
      ['ideia', 'Série "Imposto em 30 segundos"', 'Vídeos curtinhos explicando uma dúvida por semana (MEI, DAS, IBS/CBS). Fácil de gravar e bom para atrair cliente pequeno.'],
      ['relatorio', 'Resultado das redes no mês', 'Alcance subiu {pct}%, {n2} mensagens no direct pedindo orçamento. O melhor post foi o de calendário de impostos.'],
    ],
    relacionamento: [
      ['tarefa', 'Pesquisa de satisfação', 'Falei com {n2} clientes. {cliente} elogiou a rapidez; {cliente2} pediu um relatório mensal mais simples. Nota média: {nota}/10.'],
      ['melhoria', 'Boas-vindas para cliente novo', 'Criar um roteiro de boas-vindas: mensagem no dia 1, reunião rápida na semana 1 e checagem no mês 1. Cliente bem recebido cancela menos.'],
      ['ideia', 'Aniversário de empresa', 'Mandar uma mensagem (ou um mimo) no aniversário de abertura de cada cliente. Custa pouco e o cliente lembra da gente.'],
      ['relatorio', 'Clientes que precisam de atenção', '{cliente} está demorando para mandar documentos e {cliente2} reclamou de atraso. Sugiro uma ligação do Kauã esta semana.'],
    ],
    financeiro: [
      ['tarefa', 'Contas a pagar e a receber', 'Lancei todas as contas da semana. {n2} honorários em atraso, o maior é de {cliente}. Mandei lembrete com o PIX.'],
      ['melhoria', 'Cobrança automática de honorários', 'Gerar boleto/PIX recorrente com lembrete 2 dias antes. A inadimplência deve cair uns {pct}%.'],
      ['ideia', 'Reserva de emergência do escritório', 'Guardar 10% do que entra todo mês até ter 3 meses de despesas guardados, aplicado em renda fixa com liquidez diária.'],
      ['relatorio', 'Fluxo de caixa de {mes}', 'Entradas acima das saídas em R$ {valor}. Maior despesa: sistemas. Dá para negociar o plano anual e economizar.'],
    ],
    precificacao: [
      ['tarefa', 'Revisão dos honorários de {cliente}', 'O faturamento de {cliente} cresceu e o volume de notas e funcionários aumentou. O honorário atual está abaixo do trabalho que dá; sugiro reajuste de {pct}%.'],
      ['melhoria', 'Tabela por faixa de faturamento', 'Proposta de tabela com faixas por faturamento, número de funcionários e regime (Simples, Presumido, Real). Fica mais justo e mais fácil de explicar.'],
      ['ideia', 'Pacote Reforma Tributária', 'Um pacote avulso: diagnóstico do impacto do IBS/CBS, revisão do cadastro de produtos e simulação de preço. Bom para empresas do Lucro Presumido.'],
      ['relatorio', 'Nossos preços x mercado', 'Pesquisei {n2} escritórios da região: nosso preço médio está {pct}% abaixo da média para empresas do Simples com folha.'],
    ],
    rh: [
      ['tarefa', 'Avaliação de experiência', 'Conversei com quem entrou nos últimos meses. Todos adaptados; pedido mais comum: treinamento rápido sobre o sistema e a Reforma Tributária.'],
      ['melhoria', 'Treinamento mensal', 'Uma hora por mês de treinamento interno (um setor ensina o outro). Ajuda a cobrir férias e faltas.'],
      ['ideia', 'Funcionário do mês', 'Reconhecer quem teve a melhor reputação no mês com um quadro na recepção e um vale-presente simples.'],
      ['relatorio', 'Clima da equipe', 'Pesquisa rápida com a equipe: nota {nota}/10. Pontos fortes: ambiente e família KWIK. A melhorar: prazos apertados no fim do mês.'],
    ],
    ebook: [
      ['tarefa', 'Respostas aos compradores', 'Respondi as dúvidas de quem comprou o e-book esta semana e mandei o link de acesso de novo para quem não achou o e-mail da Kiwify.'],
      ['melhoria', 'Página de vendas mais clara', 'Proposta: colocar logo no início da página para quem é o e-book, um sumário com o que a pessoa aprende e 3 depoimentos. Páginas assim costumam converter mais.'],
      ['ideia', 'Cupom para clientes da KWIK', 'Um cupom de desconto do e-book para os clientes do escritório e para quem chama no WhatsApp. Ajuda a vender e mostra autoridade.'],
      ['relatorio', 'Vendas do e-book no mês', 'Resumo das vendas da Kiwify: quantidade, valor líquido, reembolsos e de onde vieram os compradores. Próximo passo: um anúncio pequeno no Instagram.'],
    ],
  };
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function nomesClientes() {
    try { const l = KM.clientesFora.lista().map(c => c.nome).filter(Boolean); if (l.length >= 2) return l; } catch (e) { /* sem dados */ }
    return ['Clínica Sorriso', 'Mercadinho Bom Preço', 'Clínica Vida', 'Studio Bella', 'Auto Peças Ilha'];
  }
  function preencher(s) {
    const cs = nomesClientes().slice().sort(() => Math.random() - 0.5);
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    const v = { mes: MESES[d.getMonth()], cliente: cs[0], cliente2: cs[1] || cs[0], n: entre(8, 30), n2: entre(2, 7), pct: entre(10, 35), nota: entre(8, 10), valor: (entre(8, 60) * 100).toLocaleString('pt-BR') };
    return s.replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? v[k] : ''));
  }

  // ------------------------------------------------------------------ níveis (promoções)
  const NIVEIS = ['Júnior', 'Pleno', 'Sênior'];
  const nivelDe = f => Math.max(0, Math.min(NIVEIS.length - 1, f.nivelRH || 0));
  const cargoCom = (setor, n) => `${SETOR[setor].cargo} ${NIVEIS[n]}`;
  const sr = () => { const c = cfg(); c.setoresRep = c.setoresRep || {}; return c.setoresRep; };
  const repSetor = s => Math.max(0, Math.min(100, sr()[s] != null ? sr()[s] : 50));
  const desemp = f => { f.desempenho = f.desempenho || { ultimas: [], aprov: 0, ruins: 0, desdePromo: 0, aposAdv: [] }; return f.desempenho; };
  const log = () => { const c = cfg(); c.rhLog = c.rhLog || []; return c.rhLog; };
  function anotar(tipo, f, setor, motivo) {
    log().unshift({ quando: new Date().toISOString(), tipo, id: f.id, nome: f.nome, setor, motivo });
    if (log().length > 120) cfg().rhLog = log().slice(0, 120);
  }
  const rhAuto = () => (cfg().opcoes || {}).rhAuto !== false;
  const rita = () => funcs().find(x => x.funcao === 'rh');

  // ------------------------------------------------------------------ dar tarefa / fazer / entregar
  // O chefe do setor só DELEGA: quem faz e entrega é sempre alguém da equipe (contratado pelo RH).
  const lista = () => { const c = cfg(); c.tarefas = c.tarefas || []; return c.tarefas; };
  const pendentes = () => lista().filter(t => t.status === 'entregue');
  KM.tarefasPendentes = () => pendentes().length;
  function designar(setor, de, tipo, titulo, texto) {
    const chefe = chefeDe(setor) || funcs()[0];
    let quem = de && de.contratado && de.setor === setor ? de : null;
    if (!quem) { // pediu para o chefe (ou para ninguém): o chefe escolhe alguém livre da equipe
      const est = A().estado, equipe = contratadosDe(setor);
      const livres = equipe.filter(f => { const p = est.pessoas[f.id]; return p && !p.trabalhando && !p.tarefaRH; });
      quem = sorteio(livres.length ? livres : equipe);
    }
    if (!quem) { A().toast(`🤝 ${SETOR[setor].nome} ainda não tem equipe: ${rita() ? primeiro(rita()) : 'o RH'} vai contratar alguém.`); return null; }
    const cands = MODELOS[setor].filter(m => !tipo || m[0] === tipo);
    const m = sorteio(cands.length ? cands : MODELOS[setor]);
    const t = { id: 't' + uid(), setor, de: quem.id, chefe: chefe.id, tipo: tipo || m[0], titulo: titulo || preencher(m[1]), texto: texto || preencher(m[2]), pedidoPorVoce: !!titulo,
      criada: new Date().toISOString(), status: 'fazendo', prazo: Date.now() + entre(25, 70) * 1000 };
    lista().unshift(t);
    if (lista().length > 200) cfg().tarefas = lista().slice(0, 200);
    A().salvar();
    const pc = A().estado.pessoas[chefe.id], pq = A().estado.pessoas[quem.id];
    if (pc) A().falar(chefe.id, `${primeiro(quem)}, ${t.tipo === 'ideia' ? 'me traz uma ideia' : t.tipo === 'melhoria' ? 'prepara um relatório de melhoria' : t.tipo === 'relatorio' ? 'faz o relatório do setor' : 'pega essa tarefa'} 📋`, 2800);
    if (pq) { pq.tarefaRH = { id: t.id, titulo: t.titulo }; if (pq.modo === 'sentado') pq.digitando = true; setTimeout(() => A().falar(quem.id, 'Deixa comigo! 💪', 2200), 1500); }
    if (A().registrar) { A().registrar(quem.id, '📝', `Recebeu de ${primeiro(chefe)}: ${t.titulo}`); A().registrar(chefe.id, '📋', `Delegou para ${primeiro(quem)}: ${t.titulo}`); }
    renderSeAberto();
    return t;
  }
  function entregar(t) {
    t.status = 'entregue'; t.entregue = new Date().toISOString();
    const f = funcs().find(x => x.id === t.de), p = A().estado.pessoas[t.de], s = SETOR[t.setor] || { nome: t.setor, ic: '🏢' };
    if (p) { p.tarefaRH = null; p.digitando = false; A().falar(t.de, `Entreguei! ${TIPO[t.tipo].split(' ')[0]}`, 2600); }
    if (A().registrar) A().registrar(t.de, '📬', `Entregou: ${t.titulo}`);
    KM.tocar && KM.tocar('sucesso');
    A().toast(`${s.ic} ${s.nome}: ${f ? primeiro(f) : 'a equipe'} entregou "${t.titulo}"`, { botao: ['Avaliar', () => A().irPara('tarefas')], ms: 6000 });
    A().salvar(); renderSeAberto(); atualizarContador();
  }
  function avaliar(id, nota, comentario, refazer) {
    const t = lista().find(x => x.id === id); if (!t || t.status !== 'entregue') return;
    const f = funcs().find(x => x.id === t.de), p = A().estado.pessoas[t.de], s = SETOR[t.setor] || { nome: t.setor, ic: '🏢' };
    const delta = nota === 'excelente' ? 10 : nota === 'bom' ? 6 : -7;
    t.status = nota === 'ruim' ? 'reprovada' : 'aprovada'; t.nota = nota; t.feedback = comentario || ''; t.avaliada = new Date().toISOString(); t.delta = delta;
    // o crédito (ou o puxão de orelha) é do SETOR TODO: chefe e equipe
    sr()[t.setor] = Math.max(0, Math.min(100, repSetor(t.setor) + delta));
    const membros = equipeDe(t.setor);
    for (const m of membros) {
      m.reputacao = Math.max(0, Math.min(100, repDe(m) + delta));
      if (nota !== 'ruim') { m.xp = (m.xp || 0) + (nota === 'excelente' ? 2 : 1); m.tarefas = (m.tarefas || 0) + 1; }
    }
    t.creditados = membros.map(m => m.id);
    // o desempenho de quem entregou fica anotado para o RH (promoção ou advertência), mas o crédito é do setor
    if (f && f.contratado) {
      const d = desemp(f);
      d.ultimas = [nota].concat(d.ultimas || []).slice(0, 8);
      if (nota === 'ruim') d.ruins = (d.ruins || 0) + 1; else { d.aprov = (d.aprov || 0) + 1; d.desdePromo = (d.desdePromo || 0) + 1; }
      if (f.advertencia) d.aposAdv = [nota].concat(d.aposAdv || []);
    }
    if (p) {
      if (nota === 'ruim') A().falar(t.de, sorteio(['Poxa… vou caprichar mais! 💪', 'Entendi, vou melhorar! 🙏', 'Valeu pelo toque, faço melhor! 📚']), 3000);
      else { KM.pulos && KM.pulos(t.de); A().falar(t.de, nota === 'excelente' ? 'Uhuul! Vitória do setor! 🤩' : 'Boa, time! 😄', 2600); if (nota === 'excelente' && KM.confete) KM.confete(60); }
    }
    const ch = chefeDe(t.setor);
    if (ch && nota !== 'ruim' && A().estado.pessoas[ch.id]) setTimeout(() => A().falar(ch.id, nota === 'excelente' ? `Orgulho do ${s.nome}! 👏` : 'Bom trabalho, equipe! 👍', 2400), 900);
    if (A().registrar) A().registrar(t.de, nota === 'ruim' ? '👎' : nota === 'excelente' ? '⭐' : '👍', `${nota === 'ruim' ? 'Pediu para melhorar' : nota === 'excelente' ? 'Excelente' : 'Aprovado'}: ${t.titulo}`);
    if (nota === 'ruim' && refazer && f && f.contratado) setTimeout(() => {
      const nova = designar(t.setor, f, t.tipo, t.titulo.replace(/ \(versão \d+\)$/, '') + ` (versão ${(t.versao || 1) + 1})`, t.texto + `\n\nAjustes feitos depois do seu retorno${comentario ? ` ("${comentario}")` : ''}: revisei os números, deixei o texto mais direto e incluí os próximos passos com prazo.`);
      if (nova) nova.versao = (t.versao || 1) + 1;
    }, 4000);
    A().toast(nota === 'ruim' ? `👎 ${s.ic} ${s.nome}: retorno enviado (reputação do setor ${delta})` : `${nota === 'excelente' ? '⭐' : '👍'} ${s.ic} ${s.nome} ganhou +${delta} de reputação (crédito para o setor todo)`);
    A().salvar(); render(); atualizarContador();
    if (A().atualizarFicha) A().atualizarFicha();
    if (f && f.contratado && rhAuto()) setTimeout(() => decidirSobre(f), 2500);
  }
  // ciclo: os chefes delegam sozinhos de tempos em tempos (no máximo 8 entregas esperando sua avaliação)
  let proxima = Date.now() + 40000;
  function ciclo() {
    const agora = Date.now();
    for (const t of lista()) if (t.status === 'fazendo' && agora >= (t.prazo || 0)) {
      if (!funcs().some(f => f.id === t.de)) { t.status = 'cancelada'; continue; }
      entregar(t);
    }
    const est = A().estado;
    if (agora >= proxima && !document.hidden && !est.jogando && pendentes().length < 8 && lista().filter(t => t.status === 'fazendo').length < 2) {
      proxima = agora + entre(150, 300) * 1000;
      const setores = Object.keys(SETOR).filter(s => contratadosDe(s).length && MODELOS[s]);
      const peso = setores.flatMap(s => Array(1 + contratadosDe(s).length).fill(s));
      if (peso.length) {
        const s = sorteio(peso);
        const livres = contratadosDe(s).filter(f => { const p = est.pessoas[f.id]; return p && !p.trabalhando && !p.tarefaRH && p.visivel !== false; });
        if (livres.length) designar(s, sorteio(livres));
      }
    }
  }
  function trabalhar(f) { // botão verde: o chefe do setor delega uma tarefa para a equipe
    const s = setorDe(f); if (!s || !MODELOS[s]) return;
    const p = A().estado.pessoas[f.id];
    if (f.contratado && p && p.tarefaRH) return A().toast(`${primeiro(f)} já está fazendo: ${p.tarefaRH.titulo}`);
    const t = designar(s, f.contratado ? f : null);
    if (t) A().toast(`📋 ${primeiro(chefeDe(s) || f)} delegou uma tarefa para ${primeiro(funcs().find(x => x.id === t.de))}. A entrega aparece em Tarefas.`);
  }

  // ------------------------------------------------------------------ RH automático (Rita): contrata, promove, adverte e desliga
  // Regras (os chefes de setor nunca são desligados nem entram nestas regras):
  //  - Contrata: setor sem ninguém na equipe; ou setor com reputação alta (75+) e 3+ entregas aprovadas na semana (até as mesas livres).
  //  - Promove: 5 entregas aprovadas desde a última promoção, nenhuma "precisa melhorar" nas 5 últimas e 2+ excelentes (Júnior → Pleno → Sênior).
  //  - Advertência: 3 "precisa melhorar" nas 5 últimas entregas. Depois da advertência: 2 "precisa melhorar" nas 3 seguintes = desligamento;
  //    3 entregas boas seguidas = advertência retirada.
  let ocupadoRH = false, proxContrato = Date.now() + 25000;
  async function decidirSobre(f) {
    if (ocupadoRH || !funcs().includes(f) || !f.contratado) return;
    const d = desemp(f), ult = (d.ultimas || []).slice(0, 5), ruinsUlt = ult.filter(x => x === 'ruim').length;
    if (f.advertencia) {
      const pos = (d.aposAdv || []).slice(0, 3), r = pos.filter(x => x === 'ruim').length;
      if (r >= 2) return desligarAuto(f, `${r} entregas "precisa melhorar" depois da advertência`);
      if (pos.length >= 3 && r === 0) {
        f.advertencia = null; d.aposAdv = [];
        anotar('recuperou', f, f.setor, '3 entregas boas seguidas depois da advertência');
        A().toast(`🤝 ${primeiro(rita() || { nome: 'RH' })}: ${primeiro(f)} se recuperou e a advertência foi retirada 💚`); A().salvar(); renderRH();
      }
      return;
    }
    if (ult.length >= 4 && ruinsUlt >= 3) return advertir(f, `${ruinsUlt} das últimas ${ult.length} entregas precisaram melhorar`);
    if ((d.desdePromo || 0) >= 5 && ruinsUlt === 0 && ult.filter(x => x === 'excelente').length >= 2 && nivelDe(f) < NIVEIS.length - 1) return promover(f);
  }
  async function conversaRH(f, falaRita, falaF, ms = 2600) {
    const p = A().estado.pessoas[f.id], L = KM.LAYOUT, pr = L && L.pontos.rh && L.pontos.rh.frente, r = rita();
    if (!p || !pr || p.trabalhando) { if (r) A().falar(r.id, falaRita, 3200); return; }
    try {
      if (p.acao === 'rotina' || p.acao === 'soneca') await KM.pararRotina(p);
      p.acao = 'rh';
      await KM.mov.irAte(p, pr.X, pr.Y); p.dir = 'ce';
      if (r) A().falar(r.id, falaRita, ms);
      await KM.esperar(ms); if (falaF) { A().falar(f.id, falaF, ms); await KM.esperar(ms - 400); }
    } catch (e) { /* segue */ }
  }
  async function promover(f) {
    ocupadoRH = true;
    const n = nivelDe(f) + 1, s = f.setor;
    f.nivelRH = n; f.cargo = cargoCom(s, n); desemp(f).desdePromo = 0;
    anotar('promoveu', f, s, `para ${NIVEIS[n]}: entregas aprovadas e sem nada para melhorar`);
    A().salvar(true); renderRH();
    A().toast(`🎉 ${primeiro(rita() || { nome: 'RH' })} promoveu ${f.nome} a ${f.cargo}!`, { ms: 7000 });
    await conversaRH(f, `Parabéns, ${primeiro(f)}! Agora você é ${NIVEIS[n]} 🎉`, 'Muito obrigado! Bora crescer! 🚀');
    const p = A().estado.pessoas[f.id];
    if (p) { KM.pulos && KM.pulos(f.id); KM.confete && KM.confete(80); KM.tocar && KM.tocar('sucesso'); p.acao = null; await KM.voltarSentar(p).catch(() => {}); }
    if (A().registrar) A().registrar(f.id, '🎉', `Promovido(a) a ${NIVEIS[n]}`);
    ocupadoRH = false;
  }
  async function advertir(f, motivo) {
    ocupadoRH = true;
    f.advertencia = new Date().toISOString(); desemp(f).aposAdv = [];
    anotar('advertiu', f, f.setor, motivo);
    A().salvar(true); renderRH();
    A().toast(`⚠️ ${primeiro(rita() || { nome: 'RH' })} deu uma advertência para ${f.nome}: ${motivo}.`, { ms: 8000 });
    await conversaRH(f, `${primeiro(f)}, precisamos melhorar as entregas, tá? 📋`, 'Pode deixar, vou me esforçar! 🙏');
    const p = A().estado.pessoas[f.id]; if (p) { p.acao = null; await KM.voltarSentar(p).catch(() => {}); }
    if (A().registrar) A().registrar(f.id, '⚠️', 'Advertência do RH: ' + motivo);
    ocupadoRH = false;
  }
  async function desligarAuto(f, motivo) {
    ocupadoRH = true;
    anotar('desligou', f, f.setor, motivo);
    for (const t of lista()) if (t.de === f.id && t.status === 'fazendo') t.status = 'cancelada';
    A().toast(`🤝 ${primeiro(rita() || { nome: 'RH' })} desligou ${f.nome} (${SETOR[f.setor] ? SETOR[f.setor].nome : ''}): ${motivo}. Uma vaga nova vai abrir.`, { ms: 9000 });
    await conversaRH(f, `${primeiro(f)}, infelizmente vamos encerrar seu contrato.`, 'Entendo… obrigado pela oportunidade 🙏', 2800);
    const p = A().estado.pessoas[f.id], L = KM.LAYOUT;
    if (p && L) {
      try {
        p.acao = 'saindo';
        const c0 = L.corredores[0];
        await KM.mov.irAte(p, L.predio.x + 10, c0.y + 22);
        await KM.mov.andarAte(p, 10, c0.y + 22, 60);
        await KM.mov.andarAte(p, 10, L.rua + 18, 60);
      } catch (e) { /* segue */ }
    }
    const c = cfg(); c.funcionarios = c.funcionarios.filter(x => x.id !== f.id);
    A().salvar(true); A().sincronizar(); A().aplicarLayout();
    proxContrato = Date.now() + 60000; // a vaga é reposta daqui a pouco
    ocupadoRH = false; renderRH(); render();
  }
  function alvoDe(s) {
    const semana = Date.now() - 7 * 864e5;
    const aprovadas = lista().filter(t => t.setor === s && t.status === 'aprovada' && new Date(t.avaliada || 0).getTime() > semana).length;
    return repSetor(s) >= 75 && aprovadas >= 3 ? 2 : 1;
  }
  function cicloRH() {
    if (!rhAuto() || ocupadoRH || document.hidden || Date.now() < proxContrato) return;
    const est = A().estado; if (!est || est.jogando || !KM.LAYOUT) return;
    const setores = Object.keys(SETOR).filter(s => KM.LAYOUT.salas[s] && vagasDe(s) > 0 && contratadosDe(s).length < alvoDe(s));
    if (!setores.length) return;
    // primeiro os setores sem ninguém; depois os que estão crescendo
    setores.sort((a, b) => contratadosDe(a).length - contratadosDe(b).length || repSetor(b) - repSetor(a));
    const s = setores[0], cs = candidatos(s, 4).sort((a, b) => b.nota - a.nota || a.pretensao - b.pretensao);
    const motivo = contratadosDe(s).length ? `o ${SETOR[s].nome} está crescendo (reputação ${repSetor(s)})` : `o ${SETOR[s].nome} não tinha ninguém na equipe`;
    proxContrato = Date.now() + entre(150, 240) * 1000;
    contratar(s, cs[0], motivo);
  }

  // ------------------------------------------------------------------ contratar / desligar
  async function contratar(setor, c, motivo) {
    if (vagasDe(setor) <= 0) return A().toast('Esse setor não tem mais mesa livre 🙈');
    const f = { id: 'c' + uid(), nome: c.nome, cargo: cargoCom(setor, 0), funcao: 'h_' + uid(), setor, contratado: true, contratadoEm: new Date().toISOString(), nivelRH: 0,
      aparencia: c.ap, xp: 0, tarefas: 0, ganhos: 0, reputacao: repSetor(setor), pretensao: c.pretensao, desempenho: { ultimas: [], aprov: 0, ruins: 0, desdePromo: 0, aposAdv: [] } };
    funcs().push(f);
    anotar('contratou', f, setor, motivo || 'contratação pedida por você');
    A().salvar(true);
    A().aplicarLayout(); A().sincronizar();
    A().toast(`🎉 ${motivo ? (rita() ? primeiro(rita()) : 'O RH') + ' contratou' : 'Contratado(a):'} ${c.nome} para ${SETOR[setor].nome}${motivo ? ` (${motivo})` : ''}!`, { ms: 7000 });
    if (A().registrar) A().registrar(f.id, '🤝', `Contratado(a) para ${SETOR[setor].nome}`);
    fecharDlg(); renderRH();
    // chega pela rua, passa no RH e vai para a mesa nova
    const p = A().estado.pessoas[f.id], L = KM.LAYOUT; if (!p || !L) return;
    const c0 = L.corredores[0];
    ocupadoRH = true;
    Object.assign(p, { modo: 'em-pe', X: 10, Y: L.rua + 18, dir: 'ce', est: {}, foraDaMesa: true, acao: 'chegando' });
    try {
      A().falar(f.id, 'Bom dia! Primeiro dia na KWIK! 😄', 3000);
      await KM.mov.andarAte(p, 10, c0.y + 22, 60);
      await KM.mov.andarAte(p, L.predio.x + 10, c0.y + 22, 60);
      const pr = L.pontos.rh && L.pontos.rh.frente;
      if (pr) {
        await KM.mov.irAte(p, pr.X, pr.Y); p.dir = 'ce';
        if (rita()) A().falar(rita().id, `Seja bem-vindo(a), ${primeiro(f)}! Sua mesa é no ${SETOR[setor].nome} 💚`, 3000);
        await KM.esperar(2600);
      }
      await KM.voltarSentar(p);
      const ch = chefeDe(setor);
      if (ch && ch.id !== (rita() || {}).id) A().falar(ch.id, `Bem-vindo(a) ao time, ${primeiro(f)}! 👏`, 2600);
    } catch (e) { /* segue */ }
    p.acao = null; ocupadoRH = false;
  }
  function desligar(f) {
    if (!f.contratado) return A().toast('Chefes de setor não podem ser desligados.');
    if (!confirm(`Desligar ${f.nome} da empresa? (as tarefas que ${f.nome.split(' ')[0]} entregou continuam na lista)`)) return;
    anotar('desligou', f, f.setor, 'desligamento pedido por você');
    const c = cfg(); c.funcionarios = c.funcionarios.filter(x => x.id !== f.id);
    for (const t of lista()) if (t.de === f.id && t.status === 'fazendo') t.status = 'cancelada';
    A().salvar(true); A().sincronizar(); A().aplicarLayout();
    A().toast(`${f.nome} foi desligado(a).`);
    renderRH();
  }

  // ------------------------------------------------------------------ janela do RH
  let setorRH = 'fiscal', cands = {}, manual = false;
  function montarDlg() {
    if ($('#dlgRH')) return;
    const d = document.createElement('dialog'); d.id = 'dlgRH'; d.className = 'rh-dlg';
    d.innerHTML = `<div class="dlg-topo"><h2>🤝 RH · Equipe e contratações</h2><button data-fechar aria-label="Fechar">×</button></div><div class="dlg-corpo" id="rhCorpo"></div>`;
    document.body.append(d);
    d.querySelector('[data-fechar]').addEventListener('click', () => d.close());
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
  }
  const fecharDlg = () => { const d = $('#dlgRH'); if (d && d.open && manual) d.close(); };
  function abrir(setor) {
    montarDlg();
    if (setor && SETOR[setor]) setorRH = setor;
    renderRH();
    const d = $('#dlgRH'); if (!d.open) d.showModal();
  }
  function avatar(ap, w = 30, h = 46) {
    const cv = el('canvas', { width: w, height: h, class: 'rh-av' });
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(KM.sprite(ap, { boca: 'sorriso', bracos: 'aceno' }), 0, 0);
    return cv;
  }
  const ICONE_LOG = { contratou: '🤝', promoveu: '🎉', advertiu: '⚠️', desligou: '🚪', recuperou: '💚' };
  const VERBO_LOG = { contratou: 'Contratou', promoveu: 'Promoveu', advertiu: 'Advertência para', desligou: 'Desligou', recuperou: 'Retirou a advertência de' };
  function renderRH() {
    const box = $('#rhCorpo'); if (!box) return;
    box.innerHTML = '';
    const r = rita(), nomeR = r ? primeiro(r) : 'O RH';
    const auto = el('input', { type: 'checkbox', checked: rhAuto(), onchange: e => { cfg().opcoes = cfg().opcoes || {}; cfg().opcoes.rhAuto = e.target.checked; A().salvar(); renderRH(); } });
    box.append(el('div', { class: 'rh-auto' + (rhAuto() ? ' on' : '') }, el('label', {}, auto, el('b', {}, `${nomeR} cuida da equipe sozinha`)),
      el('small', {}, rhAuto() ? 'Contrata quando um setor está sem equipe ou crescendo, promove quem entrega bem e adverte (e, se não melhorar, desliga) quem precisa melhorar. Os chefes de setor nunca são desligados.' : 'Desligado: nada muda sem você. Use "Fazer manualmente" abaixo.')));
    // setores: chefe + equipe com nível e desempenho
    const grade = el('div', { class: 'rh-quadro' });
    for (const [k, s] of Object.entries(SETOR)) {
      if (!KM.LAYOUT || !KM.LAYOUT.salas[k]) continue;
      const ch = chefeDe(k), eq = contratadosDe(k), v = vagasDe(k);
      grade.append(el('div', { class: 'rh-sq' },
        el('div', { class: 'rh-sq-cab' }, el('b', {}, `${s.ic} ${s.nome}`), el('span', { class: 'rh-rep', title: 'Reputação do setor (crédito de toda a equipe)' }, `★ ${repSetor(k)}`)),
        el('small', { class: 'rh-chefe' }, ch ? `👑 Chefe: ${ch.nome}` : '👑 Sem chefe'),
        eq.length ? el('div', { class: 'rh-eq' }, eq.map(f => {
          const d = desemp(f), ult = (d.ultimas || []).slice(0, 5).map(x => (x === 'excelente' ? '⭐' : x === 'bom' ? '👍' : '👎')).join('');
          return el('div', { class: 'rh-pessoa' + (f.advertencia ? ' adv' : '') }, avatar(f.aparencia, 30, 30), el('div', {}, el('b', {}, f.nome), el('small', {}, `${NIVEIS[nivelDe(f)]}${f.advertencia ? ' · ⚠️ advertido(a)' : ''}${ult ? ' · ' + ult : ' · sem entregas avaliadas'}`)));
        })) : el('small', { class: 'vazio' }, rhAuto() ? `Sem equipe ainda: ${nomeR} vai contratar.` : 'Sem equipe.'),
        el('small', { class: 'rh-vagas' }, v ? `${v} mesa${v > 1 ? 's' : ''} livre${v > 1 ? 's' : ''}` : 'sem mesa livre')));
    }
    box.append(grade);
    // histórico
    const lg = log().slice(0, 12);
    box.append(el('h3', { class: 'rh-tit' }, `📜 O que ${nomeR} fez`));
    box.append(lg.length ? el('ul', { class: 'rh-log' }, lg.map(x => el('li', {}, el('span', {}, ICONE_LOG[x.tipo] || '•'),
      el('div', {}, el('b', {}, `${VERBO_LOG[x.tipo] || x.tipo} ${x.nome}`), el('small', {}, `${SETOR[x.setor] ? SETOR[x.setor].nome + ' · ' : ''}${x.motivo || ''} · ${quando(x.quando)}`)))))
      : el('p', { class: 'vazio' }, 'Nada ainda. As decisões aparecem aqui (e num aviso na tela).'));
    // manual
    const det = el('details', { class: 'rh-manual', open: manual }); det.addEventListener('toggle', () => { manual = det.open; });
    det.append(el('summary', {}, '✋ Fazer manualmente (contratar ou desligar)'));
    const gs = el('div', { class: 'rh-setores' });
    for (const [k, s] of Object.entries(SETOR)) {
      const v = vagasDe(k), n = contratadosDe(k).length;
      gs.append(el('button', { class: 'rh-setor' + (k === setorRH ? ' on' : '') + (v ? '' : ' cheio'), onclick: () => { setorRH = k; manual = true; renderRH(); } },
        el('span', { class: 'ic' }, s.ic), el('b', {}, s.nome), el('small', {}, v ? `${v} vaga${v > 1 ? 's' : ''}` : 'sem vaga'), n ? el('em', {}, `${n} na equipe`) : null));
    }
    det.append(gs);
    const v = vagasDe(setorRH);
    if (!v) det.append(el('p', { class: 'vazio' }, 'Todas as mesas deste setor estão ocupadas.'));
    else {
      if (!cands[setorRH]) cands[setorRH] = candidatos(setorRH);
      const cl = el('div', { class: 'rh-cands' });
      for (const c of cands[setorRH]) cl.append(el('div', { class: 'rh-cand' }, avatar(c.ap),
        el('div', { class: 'rh-info' }, el('b', {}, c.nome), el('small', {}, `${c.idade} anos · ${c.exp}`), el('div', { class: 'rh-tags' }, c.fortes.map(x => el('span', {}, x))),
          el('small', {}, `Entrevista: ${'★'.repeat(c.nota)}${'☆'.repeat(5 - c.nota)} · pretensão ${A().brl(c.pretensao)}`)),
        el('button', { class: 'bt prim peq', onclick: () => { cands[setorRH] = null; contratar(setorRH, c); } }, 'Contratar')));
      det.append(cl, el('button', { class: 'bt peq', onclick: () => { cands[setorRH] = candidatos(setorRH); renderRH(); } }, '🔄 Ver outros candidatos'));
    }
    const ct = contratadosDe(setorRH);
    if (ct.length) det.append(el('div', { class: 'rh-cands' }, ct.map(f => el('div', { class: 'rh-cand' }, avatar(f.aparencia),
      el('div', { class: 'rh-info' }, el('b', {}, f.nome), el('small', {}, `${f.cargo} · desde ${new Date(f.contratadoEm).toLocaleDateString('pt-BR')}`)),
      el('button', { class: 'bt peq perigo', onclick: () => desligar(f) }, 'Desligar')))));
    box.append(det);
  }

  // ------------------------------------------------------------------ aba Tarefas
  let filtro = 'todas', filtroSetor = '';
  function atualizarContador() {
    const n = pendentes().length, c = $('#qtdTarefas'); if (c) { c.textContent = n; c.hidden = !n; }
    const h = $('#nVoce'); if (h) h.textContent = n;
    document.querySelectorAll('[data-qtd-tarefas]').forEach(x => { x.textContent = n; x.hidden = !n; });
  }
  function renderSeAberto() { if ($('#aba-tarefas') && $('#aba-tarefas').classList.contains('ativa')) render(); atualizarContador(); }
  const quando = s => { if (!s) return ''; const d = new Date(s), m = Math.round((Date.now() - d) / 60000); return m < 1 ? 'agora mesmo' : m < 60 ? `há ${m} min` : d.toDateString() === new Date().toDateString() ? `hoje às ${d.toTimeString().slice(0, 5)}` : d.toLocaleDateString('pt-BR') + ' ' + d.toTimeString().slice(0, 5); };
  function render() {
    const box = $('#tarefasLista'), resumo = $('#tarefasResumo'), rank = $('#tarefasRanking'); if (!box) return;
    const l = lista();
    const n = { entregue: 0, fazendo: 0, aprovada: 0, reprovada: 0 };
    for (const t of l) if (n[t.status] != null) n[t.status]++;
    resumo.innerHTML = '';
    for (const [k, rot, ic] of [['entregue', 'esperando você', '📬'], ['fazendo', 'sendo feitas', '⏳'], ['aprovada', 'aprovadas', '👍'], ['reprovada', 'para melhorar', '👎']])
      resumo.append(el('button', { class: 'tf-num' + (filtro === k ? ' on' : ''), onclick: () => { filtro = filtro === k ? 'todas' : k; render(); } }, el('b', {}, `${ic} ${n[k]}`), el('small', {}, rot)));
    const fs = $('#tarefasSetores'); fs.innerHTML = '';
    fs.append(el('button', { class: 'chip-f' + (!filtroSetor ? ' on' : ''), onclick: () => { filtroSetor = ''; render(); } }, 'Todos os setores'));
    for (const [k, s] of Object.entries(SETOR)) fs.append(el('button', { class: 'chip-f' + (filtroSetor === k ? ' on' : ''), onclick: () => { filtroSetor = filtroSetor === k ? '' : k; render(); } }, `${s.ic} ${s.nome}`));
    box.innerHTML = '';
    const vis = l.filter(t => t.status !== 'cancelada' && (filtro === 'todas' || t.status === filtro) && (!filtroSetor || t.setor === filtroSetor))
      .sort((a, b) => (a.status === 'entregue' ? 0 : a.status === 'fazendo' ? 1 : 2) - (b.status === 'entregue' ? 0 : b.status === 'fazendo' ? 1 : 2));
    if (!vis.length) box.append(el('div', { class: 'card tf-vazio' }, el('b', {}, 'Nada por aqui ainda 🙂'), el('p', {}, 'Os chefes delegam tarefas para a equipe do setor de tempos em tempos. Para não esperar, toque em "＋ Pedir uma tarefa".')));
    for (const t of vis.slice(0, 60)) box.append(cartao(t));
    // ranking dos SETORES (o crédito é do setor todo)
    rank.innerHTML = '';
    const setores = Object.keys(SETOR).filter(k => KM.LAYOUT && KM.LAYOUT.salas[k]).sort((a, b) => repSetor(b) - repSetor(a));
    setores.forEach((k, i) => {
      const s = SETOR[k], eq = equipeDe(k), feitas = l.filter(t => t.setor === k && t.status === 'aprovada').length;
      rank.append(el('div', { class: 'tf-rank setor' }, el('span', { class: 'pos' }, i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}º`), el('span', { class: 'ic-setor' }, s.ic),
        el('div', {}, el('b', {}, s.nome), el('small', {}, `${eq.length} pessoa${eq.length === 1 ? '' : 's'} · ${feitas} aprovada${feitas === 1 ? '' : 's'}`), el('div', { class: 'tf-barra' }, el('i', { style: `width:${repSetor(k)}%` }))),
        el('span', { class: 'v' }, String(repSetor(k)))));
    });
    atualizarContador();
  }
  function cartao(t) {
    const f = funcs().find(x => x.id === t.de), ch = funcs().find(x => x.id === t.chefe), s = SETOR[t.setor] || { ic: '🏢', nome: t.setor };
    const card = el('div', { class: 'card tf ' + t.status });
    const origem = t.pedidoPorVoce ? `pedido por você · delegado por ${ch ? primeiro(ch) : 'o chefe'}` : `delegado por ${ch ? primeiro(ch) : 'o chefe do setor'}`;
    card.append(el('div', { class: 'tf-cab' }, f ? avatar(f.aparencia, 30, 30) : el('span', {}),
      el('div', {}, el('b', {}, f ? f.nome : 'Ex-funcionário'), el('small', {}, `${s.ic} ${s.nome} · ${origem} · ${quando(t.entregue || t.criada)}`)),
      el('span', { class: 'tf-tipo ' + t.tipo }, TIPO[t.tipo] || t.tipo)));
    card.append(el('h4', {}, t.titulo));
    if (t.status === 'fazendo') { card.append(el('p', { class: 'tf-fazendo' }, `⏳ ${f ? primeiro(f) : ''} está fazendo… a entrega chega em instantes.`)); return card; }
    card.append(el('p', { class: 'tf-texto' }, t.texto));
    if (t.status === 'entregue') {
      const com = el('input', { type: 'text', placeholder: 'Comentário (opcional): o que ficou bom ou o que melhorar', maxlength: 200 });
      const ref = el('input', { type: 'checkbox', checked: true });
      card.append(el('div', { class: 'tf-aval' }, com,
        el('div', { class: 'tf-bts' },
          el('button', { class: 'bt peq ouro', onclick: () => avaliar(t.id, 'excelente', com.value.trim()) }, '⭐ Excelente'),
          el('button', { class: 'bt peq prim', onclick: () => avaliar(t.id, 'bom', com.value.trim()) }, '👍 Ficou bom'),
          el('button', { class: 'bt peq perigo', onclick: () => avaliar(t.id, 'ruim', com.value.trim(), ref.checked) }, '👎 Precisa melhorar'),
          el('label', { class: 'tf-ref' }, ref, ' refazer se precisar melhorar')),
        el('small', { class: 'tf-credito' }, `O crédito vai para o setor ${s.nome} inteiro.`)));
    } else {
      const r = t.status === 'aprovada' ? (t.nota === 'excelente' ? '⭐ Excelente' : '👍 Aprovada') : '👎 Precisa melhorar';
      card.append(el('div', { class: 'tf-res' }, el('b', {}, r), el('span', { class: t.delta > 0 ? 'mais' : 'menos' }, `${s.nome} ${t.delta > 0 ? '+' : ''}${t.delta}`), t.feedback ? el('em', {}, `“${t.feedback}”`) : null));
    }
    return card;
  }
  // pedir uma tarefa: você escolhe o setor; o chefe delega para alguém da equipe
  function pedir() {
    const d = $('#dlgPedirTarefa') || (() => {
      const x = document.createElement('dialog'); x.id = 'dlgPedirTarefa';
      x.innerHTML = `<div class="dlg-topo"><h2>📋 Pedir uma tarefa</h2><button data-fechar aria-label="Fechar">×</button></div><div class="dlg-corpo" id="ptCorpo"></div>`;
      document.body.append(x); x.querySelector('[data-fechar]').addEventListener('click', () => x.close()); return x;
    })();
    const box = d.querySelector('#ptCorpo'); box.innerHTML = '';
    const selS = el('select', {}, Object.entries(SETOR).filter(([k]) => KM.LAYOUT && KM.LAYOUT.salas[k]).map(([k, s]) => el('option', { value: k }, `${s.ic} ${s.nome}${contratadosDe(k).length ? '' : ' (sem equipe ainda)'}`)));
    const selP = el('select', {}), selT = el('select', {}, Object.entries(TIPO).map(([k, v]) => el('option', { value: k }, v)));
    const tit = el('input', { type: 'text', placeholder: 'Ex.: Conferir as notas de outubro da Clínica X (opcional)', maxlength: 120 });
    const info = el('small', { class: 'vazio' });
    const enchePessoas = () => {
      selP.innerHTML = '';
      const ch = chefeDe(selS.value), eq = contratadosDe(selS.value);
      selP.append(el('option', { value: '' }, `${ch ? primeiro(ch) : 'O chefe'} escolhe quem faz`));
      for (const f of eq) selP.append(el('option', { value: f.id }, f.nome));
      selP.disabled = !eq.length;
      info.textContent = eq.length ? `${ch ? primeiro(ch) : 'O chefe'} delega e a entrega vem de quem fizer.` : `Este setor ainda não tem equipe. ${rita() ? primeiro(rita()) : 'O RH'} contrata alguém em breve.`;
    };
    selS.addEventListener('change', enchePessoas); enchePessoas();
    box.append(el('div', { class: 'campo' }, el('label', {}, 'Setor'), selS), el('div', { class: 'campo' }, el('label', {}, 'Quem vai fazer'), selP), info,
      el('div', { class: 'campo' }, el('label', {}, 'Tipo de entrega'), selT), el('div', { class: 'campo' }, el('label', {}, 'O que você quer (deixe vazio para o chefe decidir)'), tit),
      el('button', { class: 'bt prim', style: 'margin-top:8px', onclick: () => {
        const f = funcs().find(x => x.id === selP.value) || null;
        const titulo = tit.value.trim();
        const texto = titulo ? `Feito: ${titulo}. Organizei o que precisava, conferi duas vezes e deixei anotado o que ainda depende do cliente. Próximo passo sugerido: revisar junto na próxima reunião do setor.` : null;
        const t = designar(selS.value, f, selT.value, titulo || null, texto);
        if (!t) return;
        d.close(); A().toast(`📋 ${primeiro(chefeDe(selS.value) || { nome: 'O chefe' })} delegou para ${primeiro(funcs().find(x => x.id === t.de))}.`); render();
      } }, 'Pedir ao setor'));
    d.showModal();
  }

  function iniciar() {
    setInterval(ciclo, 3000);
    setInterval(cicloRH, 20000);
    const b = $('#btPedirTarefa'); if (b) b.addEventListener('click', pedir);
    // quem foi contratado antes do RH automático vira Júnior (cargo com nível)
    for (const f of funcs()) if (f.contratado && f.setor && SETOR[f.setor] && f.nivelRH == null) { f.nivelRH = 0; f.cargo = cargoCom(f.setor, 0); }
    atualizarContador();
  }
  KM.rh = { iniciar, abrir, render, trabalhar, designar, avaliar, pedir, setorDe, repInfo, repDe, repSetor, SETOR, TIPO, NIVEIS, chefeDe, equipeDe, contratadosDe, vagasDe, atualizarContador, _entregar: entregar, _lista: lista, _cicloRH: cicloRH, _decidir: decidirSobre };
})();
