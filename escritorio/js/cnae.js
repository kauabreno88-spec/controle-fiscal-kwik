/* KWIK Mini Escritório · 🏷️ CNAE (atalho na tela inicial).
   Você descreve a empresa numa janela e o app mostra:
   - os CNAEs possíveis (principal e secundários), buscando nas ~1.300 subclasses da CNAE 2.3 do IBGE, com as
     palavras-chave oficiais de cada uma (js/cnae-dados.json, gerado por cnae-gerar.py);
   - se cada CNAE pode ser MEI (Resolução CGSN 140/2018, Anexo XI vigente) e se pode ir para o Simples (Anexo VI:
     impeditivos), o anexo provável do Simples e o Fator R;
   - natureza jurídica e regime tributário sugeridos (com estimativa de imposto usando a 🧮 Cálculo);
   - objeto social pronto, licenças e registros (vigilância sanitária, bombeiros, conselho de classe…),
     documentos e o passo a passo para abrir (padrão: São Luís/MA, dá para trocar).
   Tudo funciona sem internet depois da primeira vez. O resultado é uma sugestão: confira na consulta de viabilidade. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const el = (...a) => A().el(...a);
  const toast = (m, o) => A().toast(m, o);
  const LS = 'kwik-cnae';

  // ------------------------------------------------------------------ dados
  let D = null, carregando = null, VED = new Set(), MEI = new Map(), PALAVRAS = null;
  async function carregar() {
    if (D) return D;
    if (!carregando) carregando = fetch('js/cnae-dados.json', { cache: 'force-cache' }).then(r => { if (!r.ok) throw new Error('Não consegui carregar a lista de CNAEs (' + r.status + ')'); return r.json(); }).then(j => {
      D = j; VED = new Set(j.vedados); MEI = new Map();
      for (const [c, ocup, iss, icms, cam] of j.mei) { if (!MEI.has(c)) MEI.set(c, []); MEI.get(c).push({ ocup, iss, icms, cam }); }
      return D;
    }).catch(e => { carregando = null; throw e; });
    return carregando;
  }
  const fmt = c => `${c.slice(0, 4)}-${c[4]}/${c.slice(5)}`;
  const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const cap = s => String(s || '').toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase())
    .replace(/(?<=\s)(De|Da|Do|Das|Dos|E|Em|Para|Com|Por|Sem|A|O|As|Os|No|Na|Nos|Nas|Ou|Ao)(?=\s|$)/gu, w => w.toLowerCase());
  const sub = c => D.sub.find(s => s[0] === c);

  // ------------------------------------------------------------------ busca por descrição
  const STOP = new Set('a o e de da do das dos em no na nos nas um uma uns umas para pra por com sem que se ou ao aos as os eu minha meu minhas meus nossa nosso vai vou quero queria fazer faz faco trabalhar trabalho empresa negocio abrir ter tem como tipo coisas coisa tambem mais muito bem pelo pela pelos pelas sobre ate entre qual quais onde quando casa cliente clientes pessoa pessoas'.split(' '));
  // palavras do dia a dia -> termos que aparecem na CNAE
  const SIN = {
    loja: 'comercio varejista', lojinha: 'comercio varejista', vender: 'comercio', venda: 'comercio', vendas: 'comercio', revenda: 'comercio', revender: 'comercio', varejo: 'varejista', atacado: 'atacadista', distribuidora: 'atacadista',
    ecommerce: 'comercio varejista',
    roupa: 'vestuario', roupas: 'vestuario', moda: 'vestuario', camisa: 'vestuario', camisetas: 'vestuario', costura: 'confeccao', costureira: 'confeccao',
    sapato: 'calcados', sapatos: 'calcados', tenis: 'calcados', bolsa: 'artigos de viagem', bolsas: 'artigos de viagem', joia: 'joias', bijuteria: 'bijuterias', semijoia: 'bijuterias',
    lanche: 'lanchonetes', lanches: 'lanchonetes', hamburguer: 'lanchonetes', hamburgueria: 'lanchonetes', pastel: 'lanchonetes', salgado: 'salgados', salgados: 'salgados', marmita: 'fornecimento de alimentos preparados', marmitas: 'fornecimento de alimentos preparados', quentinha: 'fornecimento de alimentos preparados', delivery: 'entrega', comida: 'alimentacao', restaurante: 'restaurantes', bar: 'bares', bebida: 'bebidas', acai: 'sorvetes', sorvete: 'sorvetes', pizza: 'restaurantes', pizzaria: 'restaurantes', doce: 'doces', doces: 'doces confeitaria', bolo: 'bolos confeitaria', bolos: 'bolos confeitaria', confeitaria: 'confeitaria', padaria: 'padaria panificacao', pao: 'panificacao', buffet: 'bufe',
    salao: 'cabeleireiros', cabelo: 'cabeleireiros', cabeleireira: 'cabeleireiros', barbearia: 'cabeleireiros barbearia', barbeiro: 'cabeleireiros barbearia', unha: 'manicure pedicure', unhas: 'manicure pedicure', manicure: 'manicure', sobrancelha: 'estetica', estetica: 'estetica', maquiagem: 'maquiagem estetica', depilacao: 'depilacao', massagem: 'massagem', cilios: 'estetica',
    academia: 'condicionamento fisico', personal: 'condicionamento fisico', pilates: 'condicionamento fisico', crossfit: 'condicionamento fisico',
    pet: 'animais domesticos', petshop: 'animais domesticos', cachorro: 'animais domesticos', gato: 'animais domesticos', tosa: 'higiene embelezamento animais', racao: 'racoes animais',
    app: 'desenvolvimento programas computador', aplicativo: 'desenvolvimento programas computador', aplicativos: 'desenvolvimento programas computador', software: 'desenvolvimento programas computador', sistema: 'programas computador', sistemas: 'programas computador', site: 'portais provedores', sites: 'portais provedores', programador: 'desenvolvimento programas computador', ti: 'tecnologia informacao', informatica: 'informatica', computador: 'computadores',
    marketing: 'publicidade marketing', anuncio: 'publicidade', social: 'publicidade', midia: 'publicidade', trafego: 'publicidade', designer: 'design', design: 'design', logo: 'design', fotografo: 'fotografia', fotos: 'fotografia', foto: 'fotografia', video: 'producao filmes videos', videos: 'producao filmes videos', filmagem: 'filmagem',
    contador: 'contabilidade', contabil: 'contabilidade', consultor: 'consultoria', consultorias: 'consultoria', gestao: 'consultoria gestao empresarial', advogado: 'advocacia', advocacia: 'advocacia juridico',
    medico: 'atividade medica', clinica: 'clinica atividade medica', dentista: 'odontologica', odontologia: 'odontologica', psicologo: 'psicologia', psicologa: 'psicologia', fisioterapeuta: 'fisioterapia', nutricionista: 'nutricao', enfermeiro: 'enfermagem', veterinario: 'veterinarias', farmacia: 'farmaceuticos', laboratorio: 'laboratorios',
    engenheiro: 'engenharia', arquiteto: 'arquitetura', obra: 'construcao', obras: 'construcao', reforma: 'obras acabamento', reformas: 'obras acabamento', pedreiro: 'construcao alvenaria', pintor: 'pintura', pintura: 'pintura', eletricista: 'instalacoes eletricas', encanador: 'instalacoes hidraulicas', gesso: 'gesso', marceneiro: 'moveis madeira', marcenaria: 'moveis madeira', serralheria: 'serralheria', vidraceiro: 'vidros',
    mecanico: 'manutencao reparacao veiculos', oficina: 'manutencao reparacao veiculos', carro: 'veiculos automotores', carros: 'veiculos automotores', moto: 'motocicletas', motos: 'motocicletas', lavajato: 'lavagem veiculos', lava: 'lavagem', borracharia: 'borracharia', pecas: 'pecas acessorios',
    motorista: 'transporte', uber: 'transporte passageiros', taxi: 'taxi', frete: 'transporte cargas', fretes: 'transporte cargas', mudanca: 'mudancas', entregas: 'entrega', motoboy: 'entrega rapida', caminhao: 'transporte rodoviario cargas', caminhoes: 'transporte rodoviario cargas', carreta: 'transporte rodoviario cargas', representante: 'representantes comerciais agentes', representacao: 'representantes comerciais agentes', van: 'transporte escolar', escolar: 'escolar',
    aula: 'ensino', aulas: 'ensino', curso: 'cursos ensino', cursos: 'cursos ensino', professor: 'ensino', reforco: 'ensino', idiomas: 'idiomas', ingles: 'idiomas', escola: 'educacao ensino', creche: 'creches', treinamento: 'treinamento',
    limpeza: 'limpeza', faxina: 'limpeza', diarista: 'limpeza', jardinagem: 'paisagismo jardins', jardineiro: 'paisagismo jardins', piscina: 'piscinas', dedetizacao: 'controle pragas',
    festa: 'festas eventos', festas: 'festas eventos', evento: 'eventos', eventos: 'eventos', decoracao: 'decoracao', aluguel: 'aluguel', locacao: 'aluguel', alugar: 'aluguel', som: 'sonorizacao', dj: 'sonorizacao',
    celular: 'telefonia celular', celulares: 'telefonia celular', conserto: 'reparacao manutencao', consertos: 'reparacao manutencao', manutencao: 'manutencao', assistencia: 'reparacao manutencao',
    mercado: 'minimercados mercearias', mercadinho: 'minimercados mercearias', supermercado: 'supermercados', conveniencia: 'conveniencia', hortifruti: 'hortifrutigranjeiros', acougue: 'carnes acougues', peixaria: 'pescados', distribuicao: 'atacadista',
    imovel: 'imoveis', imoveis: 'imoveis', corretor: 'corretagem imoveis', imobiliaria: 'imobiliarias', turismo: 'turismo viagens', viagem: 'viagens', hotel: 'hoteis', pousada: 'pousadas', hostel: 'albergues',
    cosmeticos: 'cosmeticos perfumaria', perfume: 'perfumaria', perfumes: 'perfumaria', presentes: 'presentes', papelaria: 'papelaria', livros: 'livros', brinquedos: 'brinquedos', moveis: 'moveis', eletronicos: 'eletronicos', materiais: 'materiais', construcao: 'construcao',
    fabricar: 'fabricacao', fabrico: 'fabricacao', fabrica: 'fabricacao', produzir: 'fabricacao producao', produzo: 'fabricacao', producao: 'fabricacao producao', artesanato: 'artesanato', artesanal: 'artesanato',
    importar: 'importacao comercio', importacao: 'importacao comercio', exportar: 'exportacao',
    seguro: 'seguros corretores', seguros: 'seguros corretores', cobranca: 'cobranca', despachante: 'despachantes', grafica: 'impressao grafica', impressao: 'impressao',
  };
  const raiz = w => w.length > 4 ? w.replace(/(oes|aes)$/, 'ao').replace(/ais$/, 'al').replace(/eis$/, 'el').replace(/ores$/, 'or').replace(/(as|os|es|s)$/, '') : w;
  const palavras = s => semAcento(s).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
  let DF = null;
  function indexar() {
    if (PALAVRAS) return;
    PALAVRAS = D.sub.map(s => { const desc = new Set(palavras(s[1]).map(raiz)), todas = new Set(palavras(s[4]).map(raiz)); return { desc, todas }; });
    DF = new Map(); for (const P of PALAVRAS) for (const w of P.todas) DF.set(w, (DF.get(w) || 0) + 1);
  }
  // peso de cada palavra: as raras (lanchonete, contabilidade) valem muito; as comuns (comércio, serviço) valem pouco
  const peso = t => Math.log(1 + D.sub.length / (DF.get(t) || 1));
  function buscar(texto, max = 25) {
    indexar();
    const brutas = palavras(texto);
    const diretos = new Set(brutas.map(raiz));
    // palavra que a CNAE não conhece (hamburgueria, petshop…): a tradução vale como se fosse a própria palavra
    for (const w of brutas) if (SIN[w] && !DF.has(raiz(w))) palavras(SIN[w]).forEach(x => diretos.add(raiz(x)));
    const extra = brutas.flatMap(w => (SIN[w] ? palavras(SIN[w]) : []));
    const termos = [...new Set([...brutas, ...extra].map(raiz))].filter(t => t && DF.has(t));
    if (!termos.length) return [];
    // o que vem primeiro na descrição costuma ser a atividade principal: vale até 60% a mais
    const ordem = new Map();
    brutas.forEach((w, i) => { const f = 1 + 0.6 * (1 - i / Math.max(1, brutas.length)); for (const t of [raiz(w), ...(SIN[w] ? palavras(SIN[w]).map(raiz) : [])]) if (!ordem.has(t)) ordem.set(t, f); });
    const norm = semAcento(texto);
    const quer = { com: /\b(vend|loja|comerci|revend|varej|online|e-?commerce|mercad)/.test(norm), atac: /\b(atacad|distribu)/.test(norm), fab: /\b(fabric|produz|producao|artesan|confeccion|faco|fazer)\b/.test(norm), serv: /\b(servic|prest|atend|consult|aula|conserto|manuten|instal)/.test(norm), rep: /\brepresent/.test(norm) };
    const bigramas = []; for (let i = 0; i < brutas.length - 1; i++) bigramas.push(brutas[i] + ' ' + brutas[i + 1]);
    const res = [];
    D.sub.forEach((s, i) => {
      const P = PALAVRAS[i]; let pts = 0, hits = 0;
      for (const t of termos) {
        const w = peso(t) * (diretos.has(t) ? 1 : 0.7) * (ordem.get(t) || 1);
        if (P.desc.has(t)) { pts += 2.5 * w; hits++; } else if (P.todas.has(t)) { pts += w; hits++; }
      }
      if (!hits) return;
      for (const b of bigramas) if (s[4].includes(b)) pts += 6;
      pts *= 1 + 0.25 * (hits - 1); // várias palavras batendo valem mais
      const sec = s[2], div = s[3];
      const repr = /REPRESENTANTES COMERCIAIS/.test(s[1]);
      if (sec === 'G' && !(repr && quer.rep)) { if (quer.com) pts *= 1.2; if (div === '46') pts *= quer.atac ? 1.4 : 0.35; }
      if (repr) pts *= quer.rep ? 2.2 : 0.35;
      if (sec === 'C' && quer.fab) pts *= 1.3;
      if (sec === 'C' && !quer.fab) pts *= quer.com ? 0.45 : 0.7;
      if (quer.serv && !['G', 'C'].includes(sec)) pts *= 1.15;
      if (VED.has(s[0])) pts *= 0.8;
      res.push({ c: s[0], pts });
    });
    res.sort((a, b) => b.pts - a.pts);
    const topo = res.length ? res[0].pts : 0;
    return res.filter(r => r.pts >= topo * 0.25).slice(0, max);
  }
  function buscarTexto(q) { // busca simples por código ou palavra (campo de busca)
    const n = q.replace(/\D/g, ''), t = semAcento(q).trim();
    if (n.length >= 4) return D.sub.filter(s => s[0].startsWith(n)).slice(0, 30).map(s => ({ c: s[0], pts: 1 }));
    return buscar(t, 30);
  }

  // ------------------------------------------------------------------ regras por CNAE
  const tem = (c, lista) => lista.some(p => c.startsWith(p));
  const FATOR_R = ['8630', '8640', '8650', '7500', '7111', '7112', '7119', '7311', '7312', '7319', '7320', '7020', '6920602', '6201', '6202', '6203', '6204', '6209', '6311', '6319', '7410', '7490101', '7490104', '7210', '7220', '4611', '4612', '4613', '4614', '4615', '4616', '4617', '4618', '4619', '7490103', '7490199', '9001', '8592'];
  const ANEXO_IV = ['41', '42', '43', '8121', '8122', '8129', '8130', '8011', '8012', '8020', '6911701', '7410202'];
  function anexoDe(c) {
    if (VED.has(c)) return { a: 'vedado', txt: 'Não pode ser Simples (impeditivo, Anexo VI da Res. CGSN 140)' };
    const s = sub(c), sec = s[2];
    if (c === '6920601') return { a: 'III', txt: 'Anexo III (escritório contábil)' };
    if (/^4520|^4543900/.test(c)) return { a: 'III', txt: 'Anexo III (serviço de oficina; peças vendidas vão no Anexo I)' };
    if (/REPRESENTANTES COMERCIAIS/.test(s[1])) return { a: 'R', txt: 'Anexo III ou V pelo Fator R (representação comercial)' };
    if (tem(c, ANEXO_IV)) return { a: 'IV', txt: 'Anexo IV (paga o INSS patronal fora do DAS)' };
    if (tem(c, FATOR_R)) return { a: 'R', txt: 'Anexo III ou V pelo Fator R (folha ≥ 28% do faturamento → III)' };
    if (sec === 'G') return { a: 'I', txt: 'Anexo I (comércio)' };
    if (sec === 'C' || sec === 'B') return { a: 'II', txt: 'Anexo II (indústria)' };
    if (sec === 'A') return { a: 'I', txt: 'Anexo I (venda da produção; confirme no PGDAS-D)' };
    if (s[3] === '77') return { a: 'III', txt: 'Anexo III (locação de bens móveis: sem ISS no DAS)' };
    return { a: 'III', txt: 'Anexo III (serviços)' };
  }
  const tributo = c => { const m = MEI.get(c); if (m) return { iss: m.some(x => x.iss), icms: m.some(x => x.icms) }; const s = sub(c); const icms = ['G', 'C', 'B', 'A'].includes(s[2]) || /^4930202|^4930203|^4930204|^5011|^5012|^5021|^5022/.test(c); return { iss: !['G', 'C', 'B', 'A'].includes(s[2]), icms }; };
  // conselhos de classe e órgãos que registram ou licenciam a atividade
  const CONSELHO = [['6920', 'CRC (Conselho Regional de Contabilidade) · registro da empresa e de um contador responsável'], ['6911701', 'OAB · sociedade de advogados é registrada na OAB, não na Junta'], ['7111', 'CAU (arquitetura)'], ['7112', 'CREA (engenharia)'], ['7119', 'CREA'],
    ['86305', 'CRM (medicina) ou CRO (odontologia)'], ['8630504', 'CRO (odontologia)'], ['8650001', 'COREN (enfermagem)'], ['8650002', 'CRN (nutrição)'], ['8650003', 'CRP (psicologia)'], ['8650004', 'CREFITO (fisioterapia)'], ['8650005', 'CREFITO (terapia ocupacional)'], ['8650006', 'CRFa (fonoaudiologia)'],
    ['7500', 'CRMV (veterinária)'], ['4771', 'CRF (farmacêutico responsável)'], ['9313', 'CREF (educação física)'], ['6821', 'CRECI (corretagem de imóveis)'], ['8640', 'Conselho do responsável técnico (CRM, CRF ou CRBM)'], ['7020', 'CRA (pode ser exigido em consultoria de administração)']];
  function licencas(cs, local) {
    const L = new Map(), add = (k, t) => { if (!L.has(k)) L.set(k, t); };
    for (const c of cs) {
      for (const [p, t] of CONSELHO) if (c.startsWith(p)) add('cons-' + p, '🎓 ' + t);
      if (tem(c, ['10', '11', '56', '4721', '4722', '4723', '4724', '4729', '4711', '4712', '4771', '4772', '4773', '86', '87', '9602', '9609206', '7500', '2063', '2121', '8122', '9603', '5510', '3600', '8630'])) add('visa', '🩺 Licença sanitária (Vigilância Sanitária municipal; em São Luís, a SUVISA/SEMUS)');
      if (tem(c, ['05', '06', '07', '08', '09', '10', '11', '12', '13', '15', '16', '17', '19', '20', '22', '23', '24', '25', '4520', '4731', '4732', '38', '39', '01', '02', '03', '3600', '9603'])) add('amb', '🌳 Licença ambiental (SEMMAM em São Luís ou SEMA-MA, conforme o porte)');
      if (tem(c, ['4731', '4732', '4784'])) add('anp', '⛽ Autorização da ANP (combustíveis, GLP)');
      if (tem(c, ['4930202', '4930203', '4930204'])) add('antt', '🚚 RNTRC na ANTT (transporte rodoviário de cargas)');
      if (tem(c, ['1011', '1012', '1013', '1020', '1051', '1052', '1053', '111'])) add('mapa', '🐄 Registro no MAPA/serviço de inspeção (SIF, SIE ou SIM) para produtos de origem animal ou bebidas');
      if (tem(c, ['8011', '8012', '8020'])) add('pf', '🛡️ Autorização da Polícia Federal (segurança privada)');
      if (tem(c, ['7911', '7912', '5510', '5590', '4923002', '4929903', '7990'])) add('tur', '🧳 Cadastur (Ministério do Turismo)');
      if (tem(c, ['8511', '8512', '8513', '8520', '8531', '8532', '8533', '8541', '8542', '8550'])) add('edu', '🏫 Autorização do Conselho/Secretaria de Educação (ensino regular)');
    }
    if (local !== 'online') add('bomb', '🚒 Corpo de Bombeiros (CBMMA): licença ou certificado de segurança contra incêndio do imóvel');
    add('alvara', '📜 Alvará de funcionamento da Prefeitura (em São Luís, pela SEMFAZ/SEMURH via REDESIM)');
    return [...L.values()];
  }

  // ------------------------------------------------------------------ análise
  function naturezaJuridica(ent, cs, meiOk) {
    const regulamentada = cs.some(c => CONSELHO.some(([p]) => c.startsWith(p)));
    const adv = cs.includes('6911701');
    if (adv) return { tit: ent.socios > 1 ? 'Sociedade de Advogados' : 'Sociedade Individual de Advocacia', txt: 'Advocacia não é registrada na Junta Comercial: o registro é na OAB do estado. Tributação: Simples (Anexo IV) ou Presumido.' };
    if (meiOk) return { tit: 'MEI (Microempreendedor Individual)', txt: 'Abre de graça pelo Portal do Empreendedor (gov.br), sem contador obrigatório. Paga só o DAS fixo por mês. Limite de R$ 81 mil por ano e 1 empregado.' };
    if (ent.socios > 1) return { tit: regulamentada ? 'Sociedade Limitada (LTDA) ou Sociedade Simples' : 'Sociedade Limitada (LTDA)', txt: `Dois ou mais sócios, responsabilidade limitada ao capital.${regulamentada ? ' Para profissionais da mesma profissão regulamentada, a Sociedade Simples (registrada no Cartório de Pessoas Jurídicas) também é uma opção.' : ''}` };
    return { tit: 'Sociedade Limitada Unipessoal (SLU)', txt: 'Um dono só, com o patrimônio pessoal separado das dívidas da empresa (diferente do Empresário Individual – EI, em que o patrimônio responde). Não tem capital mínimo.' };
  }
  function regime(ent, principal, cs, meiOk) {
    const anexos = cs.map(anexoDe), vedado = anexos.some(a => a.a === 'vedado');
    const out = { linhas: [], txt: '' };
    if (meiOk) {
      const t = cs.reduce((o, c) => { const x = tributo(c); return { iss: o.iss || x.iss, icms: o.icms || x.icms }; }, { iss: false, icms: false });
      const das = 81.05 + (t.icms ? 1 : 0) + (t.iss ? 5 : 0);
      out.tit = 'MEI'; out.txt = `DAS fixo em 2026: ${das.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por mês (INSS de 5% do salário mínimo${t.icms ? ' + R$ 1 de ICMS' : ''}${t.iss ? ' + R$ 5 de ISS' : ''}).`; return out;
    }
    if (vedado) { out.tit = 'Lucro Presumido (ou Real)'; out.txt = 'Algum CNAE escolhido não pode ser Simples Nacional. Compare Presumido e Real na 🧮 Cálculo.'; return out; }
    const a = anexoDe(principal).a;
    out.tit = ent.fat && ent.fat > 4800000 ? 'Lucro Presumido ou Real' : 'Simples Nacional (provável)';
    out.txt = `Atividade principal no ${anexoDe(principal).txt}.`;
    if (a === 'R') out.txt += ` Para ficar no Anexo III (mais barato), a folha + pró-labore dos últimos 12 meses precisa ser 28% ou mais do faturamento${ent.fat ? ` (≈ ${(ent.fat * 0.28 / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por mês)` : ''}.`;
    if (ent.fat && KM.calculo && ent.fat <= 4800000) {
      try {
        const comp = KM.calculo.CALCS.find(x => x.id === 'comparar');
        const ativ = { I: 'com', II: 'ind', III: 'servIII', IV: 'servIV', V: 'servR', R: 'servR' }[a] || 'servIII';
        const r = comp.conta({ fat: ent.fat / 12, ativ, folha: ent.func ? ent.func * 2200 : 0, pro: Math.max(1621, ent.fat / 12 * (a === 'R' ? 0.28 : 0.05)), margem: 20, muni: tributo(principal).iss ? 5 : 0, cred: a === 'I' ? 60 : 0 });
        out.linhas = r.linhas.filter(l => l && l[2] === 'brl' && !/Economia/.test(l[0])).slice(0, 3);
        out.obs = r.obs[0];
      } catch (e) { /* sem estimativa */ }
    }
    return out;
  }
  function objetoSocial(cs, mei) {
    const itens = cs.map(c => sub(c)[1].toLowerCase());
    return (mei ? 'Atividades do MEI: ' : 'A sociedade tem por objeto: ') + itens.map((d, i) => `${i + 1}) ${d}`).join('; ') + '.';
  }
  function passos(ent, cs) {
    const t = cs.reduce((o, c) => { const x = tributo(c); o.iss = o.iss || x.iss; o.icms = o.icms || x.icms; return o; }, { iss: false, icms: false });
    const meiOk = ent._meiOk;
    if (meiOk) return [
      ['Conta gov.br nível prata ou ouro', 'O MEI é aberto com a conta gov.br do dono.'],
      ['Formalização no Portal do Empreendedor', 'gov.br/mei → "Quero ser MEI" → informe a ocupação, o endereço e a forma de atuação. O CNPJ sai na hora, de graça.'],
      ['Certificado da Condição de MEI (CCMEI)', 'É o documento de abertura: vale como contrato e inscrição.'],
      [t.iss ? 'Inscrição municipal (ISS)' : 'Inscrição estadual (ICMS)', t.iss ? 'Em São Luís, confira o cadastro na SEMFAZ para emitir NFS-e (o MEI emite pelo Emissor Nacional de NFS-e).' : 'Confira a inscrição estadual na SEFAZ-MA para emitir nota de venda.'],
      ['Alvará e licenças', 'O MEI tem dispensa de alvará para atividades de baixo risco; se a atividade tiver risco (alimentos, saúde, beleza…), a Prefeitura e a Vigilância Sanitária podem exigir licença.'],
      ['Todo mês', 'Pagar o DAS até o dia 20 (app MEI ou PGMEI). Todo ano, até 31/05: declaração DASN-SIMEI.'],
    ];
    return [
      ['Consulta prévia de viabilidade', `Na Junta Comercial do estado (no MA: JUCEMA, pelo portal da REDESIM), com o endereço e os CNAEs. A Prefeitura${ent.cidade ? ' de ' + ent.cidade : ''} diz se a atividade pode funcionar no local.`],
      ['Nome empresarial e documentos', 'Escolha 3 opções de nome, o nome fantasia, o capital social, quem será administrador e a participação de cada sócio.'],
      ['DBE na Receita Federal', 'Preencha o Coletor Nacional da REDESIM (Documento Básico de Entrada) com os CNAEs, o endereço e o QSA. Desde jul/2026 os CNPJs novos podem ser alfanuméricos.'],
      ['Contrato social e registro', `Assinatura digital (gov.br) do contrato social e registro na ${cs.includes('6911701') ? 'OAB' : 'Junta Comercial (JUCEMA)'}. Pague a taxa da Junta (DARE) antes. Sai o NIRE e o CNPJ.`],
      t.iss ? ['Inscrição municipal', 'Cadastro na Prefeitura (em São Luís, SEMFAZ) para ISS e emissão de NFS-e (Emissor Nacional desde 2026).'] : null,
      t.icms ? ['Inscrição estadual', 'Cadastro na SEFAZ-MA para ICMS e emissão de NF-e/NFC-e (credenciamento de emissão e, no varejo, NFC-e com CSC).'] : null,
      ['Alvará e licenças', 'Alvará de funcionamento e as licenças da lista acima (Bombeiros, Vigilância Sanitária, ambiental, conselho de classe).'],
      ['Opção pelo Simples Nacional', 'No Portal do Simples: até 30 dias da última inscrição (municipal ou estadual), sem passar de 60 dias da abertura do CNPJ. Depois disso, só em janeiro do ano seguinte.'],
      ['Certificado digital e banco', 'e-CNPJ (A1) para notas, eSocial e DCTFWeb; conta bancária PJ.'],
      ['Folha e obrigações', 'Pró-labore dos sócios e empregados no eSocial e FGTS Digital; DCTFWeb e EFD-Reinf todo mês; contabilidade com livros e balanço.'],
    ].filter(Boolean);
  }
  const DOCS = (ent, meiOk) => meiOk ? ['Conta gov.br (prata ou ouro)', 'CPF e título de eleitor ou recibo do IR', 'Endereço do negócio (pode ser o residencial)', 'Telefone e e-mail'] : [
    'RG e CPF de todos os sócios (e do administrador)', 'Comprovante de endereço residencial dos sócios', 'Estado civil e regime de bens (certidão de casamento, se casado)',
    'Endereço comercial com inscrição imobiliária (IPTU) e, se alugado, o contrato de locação', 'Área do imóvel (m²) e se terá atendimento ao público', 'Capital social e quanto cada sócio vai ter',
    'Quem será o administrador', '3 opções de nome empresarial e o nome fantasia', 'Conta gov.br nível prata ou ouro dos sócios (para assinar)', ...(ent.func ? ['Dados dos empregados para o eSocial (CTPS digital, exame admissional)'] : [])];

  // ------------------------------------------------------------------ tela
  let corpoAtual = null, ultimo = null; // { ent, res: [{c, pts}], principal, secundarios: Set }
  const lerUltimo = () => { try { const j = JSON.parse(localStorage.getItem(LS) || 'null'); if (j) j.secundarios = new Set(j.secundarios || []); return j; } catch (e) { return null; } };
  const gravar = () => { try { localStorage.setItem(LS, JSON.stringify(Object.assign({}, ultimo, { secundarios: [...ultimo.secundarios] }))); } catch (e) { /* ok */ } };

  function janela(titulo, ...conteudo) {
    const fundo = el('div', { class: 'cn-fundo', onclick: e => { if (e.target === fundo) fechar(); } });
    const caixa = el('div', { class: 'cn-janela', role: 'dialog', 'aria-label': titulo }, el('header', {}, el('b', {}, titulo), el('button', { class: 'cn-x', 'aria-label': 'Fechar', onclick: () => fechar() }, '×')), ...conteudo);
    const tecla = e => { if (e.key === 'Escape') fechar(); };
    function fechar() { fundo.remove(); document.removeEventListener('keydown', tecla); }
    document.addEventListener('keydown', tecla); fundo.append(caixa); document.body.append(fundo);
    return { caixa, fechar };
  }
  function abrirFormulario() {
    const e = (ultimo && ultimo.ent) || {};
    const desc = el('textarea', { class: 'cn-desc', rows: 5, placeholder: 'Ex.: Vou abrir uma loja de roupas femininas e acessórios, vendendo no Instagram e numa loja física no centro. Também quero fazer ajustes de costura.' }, e.desc || '');
    const campo = (rot, inp, dica) => el('label', { class: 'cn-campo' }, el('span', {}, rot), inp, dica ? el('small', {}, dica) : null);
    const cidade = el('input', { value: e.cidade || 'São Luís', placeholder: 'Cidade' }), uf = el('input', { value: e.uf || 'MA', maxlength: 2, class: 'cn-uf' });
    const socios = el('select', {}, [['1', 'Só eu (1 dono)'], ['2', '2 sócios'], ['3', '3 ou mais sócios']].map(([v, t]) => el('option', { value: v }, t))); socios.value = String(e.socios || 1);
    const fat = el('input', { inputmode: 'decimal', placeholder: 'Ex.: 120.000,00', value: e.fat ? e.fat.toLocaleString('pt-BR') : '' });
    const func = el('select', {}, [['0', 'Nenhum'], ['1', '1 empregado'], ['2', '2 a 5'], ['6', 'Mais de 5']].map(([v, t]) => el('option', { value: v }, t))); func.value = String(e.func || 0);
    const local = el('select', {}, [['ponto', 'Ponto comercial / loja / sala'], ['casa', 'Em casa (escritório no endereço residencial)'], ['online', 'Só online ou na casa do cliente']].map(([v, t]) => el('option', { value: v }, t))); local.value = e.local || 'ponto';
    const j = janela('✍️ Descreva a empresa',
      el('div', { class: 'cn-form' },
        campo('O que a empresa vai fazer? Escreva do seu jeito: produtos, serviços, como vai vender.', desc),
        el('div', { class: 'cn-linha' }, campo('Cidade', cidade), campo('UF', uf)),
        el('div', { class: 'cn-linha' }, campo('Donos', socios), campo('Empregados', func)),
        el('div', { class: 'cn-linha' }, campo('Faturamento previsto por ano (R$)', fat, 'Opcional: ajuda a escolher o regime.'), campo('Onde vai funcionar', local)),
        el('button', { class: 'bt prim cn-ir', onclick: ir }, '🔎 Analisar e montar a abertura')));
    setTimeout(() => desc.focus(), 40);
    desc.addEventListener('keydown', ev => { if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) ir(); });
    async function ir() {
      const texto = desc.value.trim(); if (texto.length < 6) { toast('Descreva um pouco mais o que a empresa vai fazer'); return desc.focus(); }
      const ent = { desc: texto, cidade: cidade.value.trim(), uf: uf.value.trim().toUpperCase(), socios: Number(socios.value), func: Number(func.value), local: local.value, fat: KM.calculo ? KM.calculo.lerNum(fat.value) : Number(fat.value.replace(/\./g, '').replace(',', '.')) || 0 };
      try { await carregar(); } catch (err) { return toast('⚠️ ' + err.message, { erro: true }); }
      const res = buscar(texto);
      if (!res.length) return toast('Não achei CNAE com essas palavras. Tente descrever com outras (ex.: "venda de", "conserto de", "aulas de").');
      ultimo = { ent, res, principal: res[0].c, secundarios: new Set(res.slice(1).filter(r => r.pts >= res[0].pts * 0.55).slice(0, 4).map(r => r.c)) };
      gravar(); j.fechar(); render();
    }
  }

  function chips(c) {
    const a = anexoDe(c), m = MEI.get(c), t = tributo(c);
    return el('div', { class: 'cn-chips' },
      m ? el('span', { class: 'ok', title: m.map(x => x.ocup).join(' · ') }, '✓ MEI') : el('span', { class: 'nao' }, '✗ MEI'),
      el('span', { class: a.a === 'vedado' ? 'nao' : 'sn', title: a.txt }, a.a === 'vedado' ? '✗ Simples' : a.a === 'R' ? 'Simples III/V (Fator R)' : 'Simples Anexo ' + a.a),
      t.iss ? el('span', {}, 'ISS') : null, t.icms ? el('span', {}, 'ICMS') : null);
  }
  function itemCnae(c, papel) {
    const s = sub(c), m = MEI.get(c);
    const info = el('div', { class: 'cn-mais', hidden: true }, el('p', {}, el('b', {}, 'Seção: '), cap(D.secoes[s[2]] || ''), ' · ', el('b', {}, 'Divisão: '), cap(D.divisoes[s[3]] || '')),
      m ? el('p', {}, el('b', {}, 'Ocupação MEI: '), m.map(x => cap(x.ocup)).join(' · ')) : null,
      el('p', {}, el('b', {}, 'Inclui, por exemplo: '), s[4].split(' | ').slice(1, 9).map(cap).join(' · ') || '—'),
      el('p', {}, el('b', {}, 'Simples: '), anexoDe(c).txt));
    const marcado = papel === 'principal' || ultimo.secundarios.has(c);
    return el('div', { class: 'cn-item' + (papel === 'principal' ? ' principal' : '') + (marcado ? ' on' : '') },
      el('div', { class: 'cn-item-top' },
        papel === 'principal' ? el('span', { class: 'cn-tag' }, 'Principal') : el('input', { type: 'checkbox', checked: marcado, title: 'Usar como secundário', onchange: e => { e.target.checked ? ultimo.secundarios.add(c) : ultimo.secundarios.delete(c); gravar(); render(); } }),
        el('code', {}, fmt(c)), el('b', {}, cap(s[1]))),
      chips(c),
      el('div', { class: 'cn-item-bts' },
        el('button', { class: 'cn-link', onclick: e => { info.hidden = !info.hidden; e.target.textContent = info.hidden ? 'Ver o que inclui' : 'Esconder'; } }, 'Ver o que inclui'),
        papel !== 'principal' ? el('button', { class: 'cn-link', onclick: () => { ultimo.secundarios.add(ultimo.principal); ultimo.secundarios.delete(c); ultimo.principal = c; gravar(); render(); } }, '⭐ Tornar principal') : null,
        el('button', { class: 'cn-link', onclick: () => { navigator.clipboard.writeText(fmt(c) + ' - ' + cap(s[1])).then(() => toast('📋 CNAE copiado')); } }, '📋 Copiar')),
      info);
  }

  function textoCompleto(ent, cs, nat, reg, lic, ps, docs) {
    const L = [`ABERTURA DE EMPRESA · ${ent.cidade}/${ent.uf}`, '', 'Descrição: ' + ent.desc, '', 'CNAE PRINCIPAL', `${fmt(cs[0])} - ${cap(sub(cs[0])[1])}`, '', 'CNAEs SECUNDÁRIOS', ...cs.slice(1).map(c => `${fmt(c)} - ${cap(sub(c)[1])}`), '',
      'NATUREZA JURÍDICA: ' + nat.tit, nat.txt, '', 'REGIME TRIBUTÁRIO: ' + reg.tit, reg.txt, ...(reg.linhas || []).map(l => `${l[0]}: ${Number(l[1]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês`), '',
      'OBJETO SOCIAL', objetoSocial(cs, ent._meiOk), '', 'LICENÇAS E REGISTROS', ...lic.map(x => '- ' + x.replace(/^\S+\s/, '')), '', 'PASSO A PASSO', ...ps.map(([t, d], i) => `${i + 1}. ${t}: ${d}`), '', 'DOCUMENTOS', ...docs.map(d => '- ' + d)];
    return L.join('\n');
  }

  function render() {
    const corpo = corpoAtual; if (!corpo) return;
    corpo.innerHTML = '';
    const topo = el('section', { class: 'cn-topo' },
      el('div', {}, el('h2', {}, '🏷️ CNAE e abertura de empresa'), el('p', {}, 'Descreva a empresa e veja os CNAEs possíveis, se pode ser MEI ou Simples, o regime, as licenças e o passo a passo para abrir.')),
      el('button', { class: 'bt prim cn-grande', onclick: abrirFormulario }, '✍️ Descrever a empresa'));
    const busca = el('input', { class: 'cn-busca', type: 'search', placeholder: '🔎 Ou busque um CNAE por código ou palavra (ex.: 4781, cabeleireiro)' });
    const achados = el('div', { class: 'cn-achados' });
    busca.addEventListener('input', async () => {
      const q = busca.value.trim(); achados.innerHTML = ''; if (q.length < 3) return;
      try { await carregar(); } catch (e) { return; }
      const r = buscarTexto(q);
      achados.append(...r.slice(0, 12).map(({ c }) => el('div', { class: 'cn-achado' }, el('code', {}, fmt(c)), el('span', {}, cap(sub(c)[1])), chips(c),
        ultimo ? el('button', { class: 'cn-link', onclick: () => { if (c !== ultimo.principal) { ultimo.secundarios.add(c); if (!ultimo.res.some(x => x.c === c)) ultimo.res.push({ c, pts: 0 }); gravar(); render(); toast('➕ ' + fmt(c) + ' adicionado como secundário'); } } }, '➕ Adicionar') : null)));
      if (!r.length) achados.append(el('p', { class: 'cn-vazio' }, 'Nada encontrado.'));
    });
    corpo.append(topo, el('div', { class: 'cn-buscabox' }, busca, achados));
    if (!ultimo) { corpo.append(el('div', { class: 'cn-vazio grande' }, el('p', {}, 'Toque em ✍️ Descrever a empresa para começar.'), el('small', {}, 'Lista oficial do IBGE (CNAE 2.3) e da Resolução CGSN 140/2018 (MEI e Simples). Funciona sem internet depois da primeira vez.'))); return; }
    if (!D) { corpo.append(el('p', { class: 'cn-vazio' }, 'Carregando a lista de CNAEs…')); carregar().then(render).catch(e => toast('⚠️ ' + e.message, { erro: true })); return; }

    const ent = ultimo.ent, cs = [ultimo.principal, ...[...ultimo.secundarios].filter(c => c !== ultimo.principal)];
    const meiOk = ent.socios === 1 && ent.func <= 1 && (!ent.fat || ent.fat <= 81000) && cs.every(c => MEI.has(c));
    ent._meiOk = meiOk;
    const nat = naturezaJuridica(ent, cs, meiOk), reg = regime(ent, ultimo.principal, cs, meiOk), lic = licencas(cs, ent.local), ps = passos(ent, cs), docs = DOCS(ent, meiOk);
    const meiMotivo = !cs.every(c => MEI.has(c)) ? 'algum CNAE escolhido não é permitido ao MEI' : ent.socios > 1 ? 'MEI não pode ter sócio' : ent.func > 1 ? 'MEI só pode ter 1 empregado' : ent.fat > 81000 ? 'o faturamento passa de R$ 81 mil por ano' : '';

    const outros = ultimo.res.map(r => r.c).filter(c => c !== ultimo.principal);
    const res = el('div', { class: 'cn-res' },
      el('section', { class: 'cn-bloco cn-pedido' }, el('small', {}, `Descrição · ${ent.cidade}/${ent.uf} · ${ent.socios === 1 ? '1 dono' : ent.socios + '+ sócios'} · ${ent.func ? ent.func + '+ empregado(s)' : 'sem empregados'}${ent.fat ? ' · ' + ent.fat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) + '/ano' : ''}`), el('p', {}, ent.desc),
        el('button', { class: 'cn-link', onclick: abrirFormulario }, '✏️ Mudar a descrição')),
      el('section', { class: 'cn-bloco' }, el('h3', {}, '⭐ CNAE principal'), itemCnae(ultimo.principal, 'principal'),
        el('h3', {}, `Outros CNAEs possíveis (${outros.length}) · marque os secundários`), el('div', { class: 'cn-lista' }, outros.map(c => itemCnae(c, 'sec'))),
        el('p', { class: 'cn-dica' }, 'A busca usa as palavras-chave oficiais do IBGE. Se faltar algum, use a busca lá em cima e toque em ➕ Adicionar.')),
      el('div', { class: 'cn-duas' },
        el('section', { class: 'cn-bloco destaque' }, el('h3', {}, '🏛️ Natureza jurídica'), el('b', { class: 'cn-grande-txt' }, nat.tit), el('p', {}, nat.txt),
          !meiOk && meiMotivo ? el('p', { class: 'cn-aviso' }, 'Por que não MEI: ' + meiMotivo + '.') : null),
        el('section', { class: 'cn-bloco destaque' }, el('h3', {}, '💼 Regime tributário'), el('b', { class: 'cn-grande-txt' }, reg.tit), el('p', {}, reg.txt),
          reg.linhas && reg.linhas.length ? el('div', { class: 'cn-est' }, el('small', {}, 'Estimativa por mês (impostos + encargos):'), reg.linhas.map(l => el('div', {}, el('span', {}, l[0].split(' · ')[0]), el('b', {}, Number(l[1]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))))) : null,
          el('button', { class: 'cn-link', onclick: () => KM.inicio.abrirApp('calculo') }, '🧮 Comparar com detalhes na Cálculo'))),
      el('section', { class: 'cn-bloco' }, el('h3', {}, '📝 Objeto social'), el('p', { class: 'cn-objeto' }, objetoSocial(cs, ent._meiOk)),
        el('button', { class: 'cn-link', onclick: () => navigator.clipboard.writeText(objetoSocial(cs, ent._meiOk)).then(() => toast('📋 Objeto social copiado')) }, '📋 Copiar objeto social')),
      el('section', { class: 'cn-bloco' }, el('h3', {}, '🪪 Licenças e registros'), el('ul', { class: 'cn-ul' }, lic.map(x => el('li', {}, x)))),
      el('section', { class: 'cn-bloco' }, el('h3', {}, '🧭 Passo a passo para abrir'), el('ol', { class: 'cn-passos' }, ps.map(([t, d]) => el('li', {}, el('b', {}, t), el('span', {}, d))))),
      el('section', { class: 'cn-bloco' }, el('h3', {}, '📂 Documentos e informações'), el('ul', { class: 'cn-check' }, docs.map(d => el('li', {}, el('label', {}, el('input', { type: 'checkbox' }), ' ' + d))))),
      el('section', { class: 'cn-bloco cn-fim' },
        el('button', { class: 'bt prim', onclick: () => navigator.clipboard.writeText(textoCompleto(ent, cs, nat, reg, lic, ps, docs)).then(() => toast('📋 Tudo copiado')) }, '📋 Copiar tudo'),
        el('button', { class: 'bt', onclick: () => imprimir(textoCompleto(ent, cs, nat, reg, lic, ps, docs)) }, '🖨️ Imprimir / PDF'),
        el('p', { class: 'cn-dica' }, 'Sugestão para começar a abertura: a palavra final é da consulta de viabilidade (Prefeitura e Junta) e do PGDAS-D. Fontes: IBGE/CONCLA CNAE 2.3 e Resolução CGSN 140/2018 (Anexos VI e XI vigentes).')));
    corpo.append(res);
  }
  function imprimir(txt) {
    const w = window.open('', '_blank'); if (!w) return toast('Libere as janelas pop-up para imprimir');
    w.document.write(`<!doctype html><meta charset="utf-8"><title>Abertura de empresa · KWIK</title><style>body{font-family:Montserrat,Arial,sans-serif;max-width:760px;margin:30px auto;color:#111A19;line-height:1.5}pre{white-space:pre-wrap;font-family:inherit;font-size:13px}h1{color:#1E8A45}</style><h1>KWIK · Abertura de empresa</h1><pre>${txt.replace(/[<&]/g, c => (c === '<' ? '&lt;' : '&amp;'))}</pre>`);
    w.document.close(); setTimeout(() => w.print(), 300);
  }

  function abrir(corpo, acoes) {
    corpoAtual = corpo; corpo.classList.add('cn-corpo');
    if (!ultimo) ultimo = lerUltimo();
    acoes.append(el('button', { class: 'appv-bt prim', onclick: abrirFormulario }, '✍️ Descrever'));
    render();
    if (!ultimo) setTimeout(abrirFormulario, 250); // já abre a janela para escrever
    carregar().catch(() => { /* tenta de novo ao buscar */ });
  }
  function registrar() {
    if (!KM.inicio || !KM.app) return setTimeout(registrar, 50);
    KM.inicio.registrar('cnae', { nome: 'CNAE', ic: '🏷️', abrir, sair: () => { corpoAtual = null; document.querySelectorAll('.cn-fundo').forEach(f => f.remove()); }, resumo: () => ({ txt: 'Descreva a empresa: CNAEs, regime e abertura' }) });
  }
  KM.cnae = { carregar, buscar, anexoDe, fmt, mei: c => MEI.get(c), dados: () => D };
  registrar();
})();
