/* KWIK Mini Escritório · botão "✨ Criar" do Kauã.
   1) Você escolhe o formato: texto, vídeo, imagem, Excel, PDF, Word, HTML ou Numbers.
   2) Descreve o que quer. 3) O Kauã entrega o arquivo no estilo da KWIK (verde #28BE52 e grafite #111A19).
   Sem IA escrevendo: o Kauã PESQUISA o assunto (Wikipédia em português, direto daqui; e, se marcado, o Gemini do
   Google pesquisando na web pela Action "Criar (pesquisa)", com a chave GEMINI_API_KEY nos segredos), monta o
   conteúdo nos modelos da KWIK com o que achou e lista as FONTES no fim de cada arquivo.
   Os arquivos são montados aqui mesmo: Word (.docx), Excel (.xlsx, que o Numbers do iPhone abre), PDF, HTML,
   imagem PNG (post 4:5), vídeo (o mesmo motor do Enzo, com narrador e música) e texto. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  const el = (...a) => A().el(...a);
  const FORMATOS = [
    { k: 'texto', ic: '📝', nome: 'Texto', desc: 'Para copiar e colar', ex: 'Ex.: mensagem de boas-vindas para cliente novo que abriu MEI com a gente' },
    { k: 'video', ic: '🎬', nome: 'Vídeo', desc: 'Stories/Reels com narrador', ex: 'Ex.: vídeo explicando por que o MEI precisa de contador, chamando para o WhatsApp' },
    { k: 'imagem', ic: '🖼️', nome: 'Imagem', desc: 'Post 4:5 para o Instagram', ex: 'Ex.: post divulgando o e-book da KWIK para quem quer abrir empresa' },
    { k: 'excel', ic: '📊', nome: 'Excel', desc: 'Planilha .xlsx', ex: 'Ex.: planilha de controle de honorários dos clientes com vencimento e status' },
    { k: 'pdf', ic: '📕', nome: 'PDF', desc: 'Documento pronto', ex: 'Ex.: proposta de contabilidade para uma clínica odontológica no Simples' },
    { k: 'word', ic: '📘', nome: 'Word', desc: 'Documento .docx editável', ex: 'Ex.: contrato de prestação de serviços contábeis com cláusulas básicas' },
    { k: 'html', ic: '🌐', nome: 'HTML', desc: 'Página web', ex: 'Ex.: página de apresentação dos serviços da KWIK para mandar no WhatsApp' },
    { k: 'numbers', ic: '🍏', nome: 'Numbers', desc: 'Planilha para o iPhone/Mac', ex: 'Ex.: checklist de documentos para abertura de empresa' },
  ];
  const F = k => FORMATOS.find(f => f.k === k);
  const VERDE = '#28BE52', GRAFITE = '#111A19';
  const x = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const semMarca = s => String(s || '').replace(/\*/g, '');
  const cfg = () => A().cfg();
  const gh = () => KM.backends && KM.backends.github;
  const conectado = () => { const g = gh(); return !!(g && g.conf().token); };
  const whats = () => { try { return KM.marketing._u.foneBonito(cfg().marketing.whats); } catch (e) { return (cfg().marketing || {}).whats || ''; } };
  const whatsLink = () => { const n = String((cfg().marketing || {}).whats || '').replace(/\D/g, ''); return n ? `https://wa.me/${n.startsWith('55') ? n : '55' + n}` : ''; };
  const nomeArq = (s, ext) => `KWIK - ${semMarca(s || 'Criação').slice(0, 50).replace(/[\\/:*?"<>|]/g, '').trim()}.${ext}`;

  // ------------------------------------------------------------------ pesquisa (com fontes)
  // 1) Wikipédia em português (direto daqui, sem chave). 2) Opcional: Gemini (Google) pesquisando na web, pela Action
  // "Criar (pesquisa)" no GitHub, com a chave GEMINI_API_KEY nos segredos. O texto final é montado aqui, nos modelos
  // da KWIK, com o que as pesquisas trouxeram, e sempre com a lista de fontes no fim.
  const sem = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const PARADAS = new Set(('quero preciso faca faz crie cria monte gere fazer fazendo gostaria um uma uns umas o a os as de da do das dos e em no na nos nas por para pra pro com sem sobre que qual quais como quando onde ' +
    'eu me meu minha voce seu sua nosso nossa isso isto esse essa este esta ele ela eles elas ao aos mais menos muito muita bem ja tambem so ou se nao sim ser ter tem estar esta sao foi ' +
    'post posts video videos reels stories story imagem imagens planilha planilhas excel numbers pdf word docx documento documentos html pagina site texto mensagem legenda arquivo ' +
    'explicando explicar mostrando falando divulgar divulgando chamando chamar instagram whatsapp kwik contabilidade cliente clientes nossos pessoas pessoa quem ai la aqui vai vamos ' +
    'controle lista modelo simples-de pronto pronta bonito bonita curto curta rapido completo completa').split(' '));
  // assuntos comuns da KWIK → título exato da Wikipédia (a busca acerta mais)
  const ASSUNTOS = [[/\bmei\b|microempreendedor/, 'Microempreendedor individual'], [/simples nacional|\bdas\b/, 'Simples Nacional'], [/lucro presumido/, 'Lucro presumido'], [/lucro real/, 'Lucro real'],
    [/imposto de renda|\birpf\b|declaracao de ir/, 'Imposto de Renda de Pessoa Física'], [/reforma tributaria|\bibs\b|\bcbs\b/, 'Reforma tributária do Brasil'], [/\bfgts\b|fundo de garantia/, 'Fundo de Garantia do Tempo de Serviço'],
    [/esocial/, 'eSocial'], [/nota fiscal|\bnf-?e\b|nfs-?e/, 'Nota fiscal eletrônica'], [/\binss\b|previdencia/, 'Instituto Nacional do Seguro Social'], [/decimo terceiro|13o salario|13º/, 'Décimo terceiro salário'],
    [/ferias/, 'Férias'], [/\bicms\b/, 'Imposto sobre Circulação de Mercadorias e Serviços'], [/\biss\b|imposto sobre servico/, 'Imposto sobre Serviços'], [/\bcnpj\b/, 'Cadastro Nacional da Pessoa Jurídica'],
    [/abr\w* (uma |a )?empresa|abertura de empresa/, 'Empresa'], [/fluxo de caixa/, 'Fluxo de caixa'], [/\bbpo\b/, 'Terceirização de processos de negócios'], [/contrato de presta/, 'Contrato de prestação de serviços'],
    [/certificado digital/, 'Certificado digital'], [/\bpix\b/, 'Pix (sistema de pagamento)'], [/planejamento tributario/, 'Planejamento tributário'], [/contabil|contador/, 'Contabilidade']];
  const termos = desc => [...new Set(sem(desc).replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !PARADAS.has(w) && !/^\d+$/.test(w)))];
  const wiki = q => fetch('https://pt.wikipedia.org/w/api.php?' + new URLSearchParams({ ...q, format: 'json', origin: '*' }), { cache: 'no-store' }).then(r => r.json());
  const LIXO = /^(ver tamb[ée]m|refer[êe]ncias|liga[çc][õo]es externas|notas|bibliografia|leitura adicional|fontes|galeria|cronologia|portugal|angola|mo[çc]ambique|cabo verde|espanha|estados unidos|fran[çc]a|it[áa]lia|outros pa[íi]ses|no mundo|cr[íi]ticas|pol[êe]micas?)$/i;
  const sentencas = t => String(t || '').replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9"“])/).map(s => s.trim()).filter(s => s.length > 25);
  async function pesquisarWiki(desc) {
    const d = sem(desc), ts = termos(desc);
    const fixo = (ASSUNTOS.find(([re]) => re.test(d)) || [])[1];
    const buscas = [ts.slice(0, 4).join(' '), ts.slice(0, 2).join(' '), ts[0]].filter(Boolean);
    let ids = [];
    if (fixo) { const j = await wiki({ action: 'query', titles: fixo, redirects: 1 }); ids = Object.values(j.query.pages || {}).filter(p => !p.missing && p.pageid).map(p => p.pageid); }
    for (const q of buscas) {
      if (ids.length >= (fixo ? 1 : 2)) break; // com o assunto certo, fica só na página dele (a busca traz coisas soltas)
      const j = await wiki({ action: 'query', list: 'search', srsearch: q, srlimit: 3, srnamespace: 0 });
      // só aceita página que tenha a ver com o pedido (palavra do pedido no título; ou, na falta de tudo, várias no resumo)
      const temNo = (t, n) => ts.filter(w => new RegExp('(^|[^a-z0-9])' + w.replace(/[^a-z0-9]/g, '')).test(sem(t).replace(/<[^>]+>/g, ''))).length >= n;
      for (const r of (j.query && j.query.search) || []) if (!ids.includes(r.pageid) && ids.length < 2 && (temNo(r.title, fixo ? 2 : 1) || (!ids.length && temNo(r.snippet, 2)))) ids.push(r.pageid);
    }
    const paginas = [];
    for (const id of ids) {
      const j = await wiki({ action: 'query', prop: 'extracts|info', inprop: 'url', explaintext: 1, exsectionformat: 'wiki', pageids: id });
      const p = Object.values(j.query.pages)[0]; if (!p || !p.extract) continue;
      const partes = p.extract.split(/\n(==+)\s*(.+?)\s*\1\n/); // [intro, '==', título, texto, '==', título, texto…]
      const secs = [];
      for (let i = 1; i < partes.length; i += 3) if (partes[i] === '==' && !LIXO.test(partes[i + 1])) secs.push({ titulo: partes[i + 1], texto: partes[i + 2] || '' });
      paginas.push({ titulo: p.title, url: p.fullurl, intro: partes[0], secs });
    }
    return paginas;
  }
  // encurta uma frase para caber num post/cena: corta numa vírgula (depois de 6 palavras) ou põe "…"
  const encurtar = (s, n = 16) => {
    const w = semMarca(s).replace(/\s*\([^)]*\)/g, '').split(/\s+/).filter(Boolean);
    if (w.length <= n) return w.join(' ').replace(/[.;:]$/, '');
    for (let i = Math.min(n, w.length) - 1; i >= 5; i--) if (/[,;:]$/.test(w[i])) return w.slice(0, i + 1).join(' ').replace(/[,;:]$/, '');
    return w.slice(0, n).join(' ').replace(/[,;:]$/, '') + '…';
  };
  function blocosWiki(paginas) {
    const secoes = [];
    paginas.forEach((p, k) => {
      const intro = sentencas(p.intro);
      secoes.push({ titulo: k ? p.titulo : `O que é: ${p.titulo}`, texto: intro.slice(0, k ? 2 : 3).join(' '), itens: [], fonte: p.titulo });
      if (k) return;
      for (const s of p.secs.slice(0, 8)) {
        if (secoes.length >= 5) break;
        const linhas = s.texto.split('\n').map(l => l.trim()).filter(Boolean);
        const lista = linhas.filter(l => l.length < 160 && !/[.!?]$/.test(l) || /;$/.test(l)).slice(0, 6).map(l => l.replace(/;$/, ''));
        const txt = sentencas(linhas.filter(l => !lista.includes(l.replace(/;$/, ''))).join(' ')).slice(0, 2).join(' ');
        if (!txt && lista.length < 2) continue;
        secoes.push({ titulo: s.titulo, texto: txt, itens: lista.length >= 2 ? lista : [], fonte: p.titulo });
      }
    });
    return secoes;
  }
  // Gemini (Google), pela Action do GitHub: devolve { resumo, secoes, fontes }
  async function pedirGemini(formato, descricao, aviso) {
    const g = gh(), id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await g.gravarJson(`nuvem/criar/pedidos/${id}.json`, { id, formato, descricao, gemini: true, criadoEm: new Date().toISOString() }, `Criar: pesquisa (${F(formato).nome})`);
    aviso('📨 Pedido enviado. O Gemini está pesquisando na internet (leva de 1 a 3 minutos)…');
    const ini = Date.now();
    while (Date.now() - ini < 5 * 60000) {
      await new Promise(r => setTimeout(r, 6000));
      aviso(`🔎 O Gemini está pesquisando e juntando as fontes… ${Math.round((Date.now() - ini) / 1000)}s`);
      let r = null; try { r = await g.lerJson(`nuvem/criar/respostas/${id}.json`); } catch (e) { /* tenta de novo */ }
      if (!r) continue;
      if (r.ok && r.pesquisa) return r.pesquisa;
      const e = new Error(r.mensagem || 'falhou'); e.codigo = r.erro; throw e;
    }
    const e = new Error('demorou demais'); e.codigo = 'tempo'; throw e;
  }
  // junta a pesquisa ao modelo KWIK do formato escolhido
  function aplicarPesquisa(c, formato, desc, wikiPags, gem) {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const fontes = [];
    const addFonte = (titulo, url, origem) => { if (url && !fontes.some(f => f.url === url)) fontes.push({ titulo, url, origem }); };
    for (const f of (gem && gem.fontes) || []) addFonte(f.titulo || f.url, f.url, 'Gemini (Google)');
    for (const p of wikiPags) addFonte(`Wikipédia: ${p.titulo}`, p.url, 'Wikipédia');
    let blocos = [...((gem && gem.secoes) || []).map(s => ({ titulo: s.titulo, texto: s.texto || '', itens: s.itens || [], fonte: 'Gemini' })), ...blocosWiki(wikiPags)].filter(s => s.texto || s.itens.length);
    if (!blocos.length) return c;
    // sem resumo do Gemini, o resumo são as 2 primeiras frases da pesquisa (e saem do 1º bloco, para não repetir)
    let resumoWiki = '';
    if (!(gem && gem.resumo)) { const fr = sentencas(blocos[0].texto); resumoWiki = fr.slice(0, 2).join(' '); blocos[0] = { ...blocos[0], texto: fr.slice(2).join(' ') }; blocos = blocos.filter(s => s.texto || s.itens.length); }
    const manterPedido = /propost|contrat|comunicad|aviso/.test(sem(desc));
    let secoes = c.secoes.filter(s => !(s.titulo === 'Sobre o pedido' && !manterPedido) && s.titulo !== 'Pontos principais');
    const ins = Math.min(manterPedido ? 1 : 0, secoes.length);
    secoes.splice(ins, 0, ...blocos.map(({ fonte, ...s }) => s));
    secoes.push({ titulo: 'Fontes', texto: `Pesquisa feita em ${hoje}. Confira as fontes antes de publicar: leis e valores mudam.`, itens: fontes.map(f => `${f.titulo} — ${f.url}`) });
    const frasesP = [...sentencas((gem && gem.resumo) || resumoWiki), ...blocos.flatMap(b => sentencas(b.texto))];
    const resumo = (gem && gem.resumo) || resumoWiki || c.resumo;
    const pontos = frasesP.slice(0, 4).map(s => encurtar(s, 15));
    const nomeF = f => f.origem === 'Wikipédia' ? f.titulo : f.titulo.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    const linhaFontes = 'Fontes: ' + fontes.slice(0, 4).map(nomeF).join(' · ');
    const out = { ...c, secoes, resumo, fontes, pesquisa: true, rapido: false, pesquisadoEm: hoje, comGemini: !!(gem && gem.secoes && gem.secoes.length) };
    out.subtitulo = encurtar(frasesP[0] || c.subtitulo, 16);
    if (formato === 'excel' || formato === 'numbers') {
      const tipoTabela = c.tabela && c.tabela.titulo;
      if (!tipoTabela || tipoTabela === 'Checklist') out.tabela = { titulo: 'O que a pesquisa encontrou', colunas: ['Tópico', 'O que diz', 'Fonte'],
        linhas: [['Resumo', resumo, fontes[0] ? fontes[0].titulo : ''], ...blocos.flatMap(b => (b.itens.length ? b.itens.map(i => [b.titulo, i]) : [[b.titulo, sentencas(b.texto).slice(0, 2).join(' ') || b.texto]]).map(l => [...l, b.fonte === 'Gemini' ? 'Gemini (Google)' : `Wikipédia: ${b.fonte}`])).slice(0, 39)], totais: false };
    }
    if (pontos.length) {
      const comLista = blocos.find(b => b.itens.length >= 3);
      out.cenas = [{ tipo: 'gancho', texto: c.cenas[0].texto }, ...pontos.slice(0, 3).map(t => ({ tipo: 'ponto', texto: t })),
        comLista ? { tipo: 'lista', texto: encurtar(comLista.titulo, 4).toUpperCase(), itens: comLista.itens.slice(0, 3).map(i => encurtar(i, 6)) } : null, { tipo: 'cta', texto: 'Dúvida? Chama a *KWIK*.' }].filter(Boolean);
    }
    const w = whats();
    out.legenda = `${semMarca(c.cenas[0].texto)}\n\n${pontos.slice(0, 3).map(p => '✅ ' + p).join('\n')}\n\nFale com a KWIK${w ? ' 👉 WhatsApp ' + w : ''}\n\n📚 ${linhaFontes}\n\n#contabilidade #kwikcontabilidade #empreendedorismo #saoluis`;
    out.texto = [semMarca(c.titulo), '', resumo, '', ...secoes.flatMap(s => [s.titulo.toUpperCase(), s.texto, ...(s.itens || []).map(i => '• ' + i), '']).filter(v => v != null), `Fale com a KWIK${w ? ' 👉 WhatsApp ' + w : ''}`].join('\n').replace(/\n{3,}/g, '\n\n');
    return out;
  }

  // ------------------------------------------------------------------ modo rápido (sem IA): modelos da KWIK
  const SERVICOS = [['Contabilidade completa', 'Escrituração, balanço e obrigações acessórias'], ['Fiscal e impostos', 'Apuração, guias (DAS, ISS, ICMS) e notas fiscais'], ['Departamento pessoal', 'Folha, eSocial, FGTS, férias e rescisões'],
    ['BPO financeiro', 'Contas a pagar e receber, conciliação e relatórios'], ['Consultoria e planejamento tributário', 'Regime certo e economia dentro da lei'], ['Abertura de empresa', 'Do CNPJ às primeiras guias'], ['Imposto de Renda', 'Declaração de pessoa física']];
  function frases(t) { return String(t).replace(/\s+/g, ' ').split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 3); }
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  function gerarLocal(formato, desc) {
    const d = desc.trim(), l = d.toLowerCase(), fs = frases(d), w = whats();
    let titulo = cap((fs[0] || 'Criação KWIK').replace(/^(eu\s+)?(quero|preciso de|faça|faz|crie|cria|monte|gere|fazer)\s+((uma|um|o|a)\s+)?/i, '')
      .replace(/^((um|uma)\s+)?(post|reels?|v[íi]deo|stories|story|imagem|planilha|pdf|documento|texto|p[áa]gina|material|arquivo|mensagem|apresenta[çc][ãa]o)(\s+(sobre|de|do|da|dos|das|explicando|com|para|falando de|mostrando))?\s+((o|a|os|as)\s+)?/i, '')).replace(/[.!?]$/, '');
    if (titulo.length > 70) titulo = titulo.slice(0, 67).replace(/\s+\S*$/, '') + '…';
    const tipo = /propost/.test(l) ? 'proposta' : /contrat/.test(l) ? 'contrato' : /or[çc]amento|honor[áa]ri|pre[çc]o/.test(l) ? 'precos' : /checklist|documentos|lista/.test(l) ? 'checklist'
      : /cliente/.test(l) ? 'clientes' : /despesa|gasto|fluxo de caixa|financeiro/.test(l) ? 'caixa' : /comunicad|aviso|informe/.test(l) ? 'comunicado' : 'geral';
    const secoes = [{ titulo: 'Sobre o pedido', texto: d, itens: [] }];
    if (tipo === 'proposta') secoes.push({ titulo: 'Quem é a KWIK', texto: 'A KWIK Contabilidade cuida da parte contábil, fiscal e financeira da sua empresa com atendimento próximo e sem complicação.', itens: [] },
      { titulo: 'O que está incluído', texto: '', itens: SERVICOS.slice(0, 4).map(s => `${s[0]}: ${s[1]}`) }, { titulo: 'Investimento', texto: 'Honorário mensal: R$ ____ (a confirmar conforme o faturamento, o regime e o número de funcionários).', itens: [] },
      { titulo: 'Próximos passos', texto: '', itens: ['Conversa rápida para entender a empresa', 'Envio dos documentos', 'Início do atendimento já no próximo mês'] });
    else if (tipo === 'contrato') secoes.push(...['Objeto: prestação de serviços contábeis, fiscais e de departamento pessoal.', 'Honorários: R$ ____ por mês, com vencimento no dia ____.', 'Obrigações do cliente: enviar documentos e informações até o dia 5 de cada mês.',
      'Obrigações da KWIK: executar os serviços com zelo e dentro dos prazos legais.', 'Vigência: prazo indeterminado, com aviso prévio de 30 dias para rescisão.', 'Foro: São Luís (MA).'].map((t, i) => ({ titulo: `Cláusula ${i + 1}`, texto: t, itens: [] })));
    else if (tipo === 'checklist') secoes.push({ titulo: 'Checklist', texto: '', itens: ['Documento de identidade e CPF dos sócios', 'Comprovante de endereço', 'Contrato social ou requerimento de empresário', 'Inscrição municipal e alvará', 'Certificado digital', 'Dados bancários da empresa'] });
    else if (tipo === 'comunicado') secoes.push({ titulo: 'Comunicado', texto: fs.slice(1).join(' ') || d, itens: [] }, { titulo: 'Em caso de dúvida', texto: `Fale com a KWIK${w ? ' no WhatsApp ' + w : ''}.`, itens: [] });
    else secoes.push({ titulo: 'Pontos principais', texto: '', itens: (fs.length > 1 ? fs.slice(1) : SERVICOS.slice(0, 3).map(s => s[0])).slice(0, 6) }, { titulo: 'Como a KWIK ajuda', texto: 'Contabilidade, BPO e consultoria para o seu negócio, com atendimento próximo e sem complicação.', itens: [] });
    let tabela = null;
    if (tipo === 'clientes' || (formato === 'excel' || formato === 'numbers') && /cliente/.test(l)) {
      const cs = (cfg().clientes || []).filter(c => (c.status || 'ativo') === 'ativo');
      tabela = { titulo: 'Clientes', colunas: ['Cliente', 'WhatsApp', 'Honorário (R$)', 'Vencimento', 'Status'], linhas: (cs.length ? cs : [{ nome: 'Cliente 1' }, { nome: 'Cliente 2' }]).map(c => [c.nome || '', c.telefone || '', +c.valor || 0, 'dia 10', 'em dia']), totais: true };
    } else if (tipo === 'precos' || tipo === 'proposta') tabela = { titulo: 'Serviços', colunas: ['Serviço', 'O que inclui', 'Valor (R$)'], linhas: SERVICOS.map(s => [s[0], s[1], 0]), totais: false };
    else if (tipo === 'caixa') tabela = { titulo: 'Fluxo de caixa', colunas: ['Mês', 'Entradas (R$)', 'Saídas (R$)', 'Saldo (R$)'], linhas: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map(m => [m, 0, 0, 0]), totais: true };
    else if (tipo === 'checklist' || formato === 'excel' || formato === 'numbers') tabela = { titulo: 'Checklist', colunas: ['Item', 'Responsável', 'Prazo', 'Feito?'], linhas: (secoes.flatMap(s => s.itens).length ? secoes.flatMap(s => s.itens) : fs).slice(0, 20).map(t => [semMarca(t), '', '', 'não']), totais: false };
    const pontos = (fs.length > 1 ? fs.slice(1, 4) : ['A KWIK cuida da sua contabilidade sem complicação', 'Impostos e prazos em dia', 'Atendimento próximo de verdade']);
    const palavra = (titulo.match(/\b(MEI|Simples|impostos?|empresa|e-?book|contabilidade|KWIK|folha|IR)\b/i) || [])[0];
    const tituloPost = palavra ? titulo.replace(palavra, `*${palavra}*`) : `*${titulo}*`;
    const texto = [titulo, '', ...secoes.flatMap(s => [s.titulo !== 'Sobre o pedido' ? s.titulo.toUpperCase() : null, s.titulo !== 'Sobre o pedido' ? s.texto : null, ...s.itens.map(i => '• ' + i)].filter(Boolean)), '', `Fale com a KWIK${w ? ' 👉 WhatsApp ' + w : ''}`].join('\n');
    return {
      titulo, subtitulo: 'KWIK Contabilidade · Contabilidade inteligente', tag: tipo === 'proposta' ? 'PROPOSTA' : tipo === 'contrato' ? 'CONTRATO' : 'KWIK CONTABILIDADE', resumo: fs.slice(0, 2).join(' ') || d,
      secoes, tabela, cta: `Chama a KWIK${w ? ' no WhatsApp ' + w : ''}`, icone: /cresc|lucro|gr[áa]fico/.test(l) ? 'grafico' : /empresa|abrir/.test(l) ? 'predio' : 'documento',
      legenda: `${semMarca(tituloPost)}\n\n${pontos.join('\n')}\n\nFale com a KWIK${w ? ' 👉 WhatsApp ' + w : ''}\n\n#contabilidade #kwikcontabilidade #empreendedorismo #saoluis`,
      cenas: [{ tipo: 'gancho', texto: tituloPost }, ...pontos.map(t => ({ tipo: 'ponto', texto: t })), { tipo: 'lista', texto: 'O QUE FAZER AGORA', itens: ['Separe os documentos', 'Confira os prazos', 'Chame a KWIK'] }, { tipo: 'cta', texto: 'Dúvida? Chama a *KWIK*.' }],
      texto, rapido: true,
    };
  }

  // ------------------------------------------------------------------ ZIP (para .docx e .xlsx), sem bibliotecas
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(arquivos, tipo) {
    const enc = new TextEncoder(), partes = [], central = []; let off = 0;
    for (const a of arquivos) {
      const nome = enc.encode(a.nome), d = typeof a.dados === 'string' ? enc.encode(a.dados) : a.dados, crc = crc32(d);
      const lo = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, 0, 2], [12, 0x21, 2], [14, crc, 4], [18, d.length, 4], [22, d.length, 4], [26, nome.length, 2], [28, 0, 2]].forEach(([o, v, n]) => (n === 4 ? lo.setUint32(o, v, true) : lo.setUint16(o, v, true)));
      partes.push(new Uint8Array(lo.buffer), nome, d);
      const ce = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, 0, 2], [14, 0x21, 2], [16, crc, 4], [20, d.length, 4], [24, d.length, 4], [28, nome.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, off, 4]].forEach(([o, v, n]) => (n === 4 ? ce.setUint32(o, v, true) : ce.setUint16(o, v, true)));
      central.push(new Uint8Array(ce.buffer), nome);
      off += 30 + nome.length + d.length;
    }
    const tc = central.reduce((s, p) => s + p.length, 0), fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arquivos.length, true); fim.setUint16(10, arquivos.length, true); fim.setUint32(12, tc, true); fim.setUint32(16, off, true);
    return new Blob([...partes, ...central, new Uint8Array(fim.buffer)], { type: tipo });
  }
  const REL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

  // ------------------------------------------------------------------ Word (.docx)
  function docx(c) {
    const run = (t, o = {}) => `<w:r><w:rPr><w:rFonts w:ascii="Montserrat" w:hAnsi="Montserrat" w:cs="Arial"/>${o.b ? '<w:b/>' : ''}<w:color w:val="${o.cor || '111A19'}"/><w:sz w:val="${o.sz || 22}"/></w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
    const runs = (t, o = {}) => String(t).split(/(\*[^*]+\*)/).filter(Boolean).map(p => (/^\*.*\*$/.test(p) ? run(p.slice(1, -1), { ...o, b: true, cor: '1E8A45' }) : run(p, o))).join('');
    const p = (t, o = {}) => `<w:p><w:pPr>${o.fundo ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fundo}"/>` : ''}<w:spacing w:before="${o.antes || 0}" w:after="${o.depois == null ? 120 : o.depois}"/>${o.jc ? `<w:jc w:val="${o.jc}"/>` : ''}${o.ind ? `<w:ind w:left="${o.ind}"/>` : ''}</w:pPr>${o.cru || runs(t, o)}</w:p>`;
    const out = [];
    out.push(p('', { fundo: '111A19', depois: 0, cru: run('  KWIK', { b: true, cor: 'FFFFFF', sz: 36 }) + run('  CONTABILIDADE', { b: true, cor: '28BE52', sz: 20 }) }));
    out.push(p('', { fundo: '28BE52', depois: 240, cru: run(' ', { sz: 6 }) }));
    if (c.tag) out.push(p(c.tag, { b: true, cor: '1E8A45', sz: 18 }));
    out.push(p(c.titulo || '', { b: true, sz: 40, depois: 80 }));
    if (c.subtitulo) out.push(p(c.subtitulo, { cor: '6B7774', sz: 24, depois: 200 }));
    if (c.resumo) out.push(p(c.resumo, { sz: 22, depois: 240 }));
    for (const s of c.secoes || []) {
      if (s.titulo) out.push(p(s.titulo, { b: true, cor: '1E8A45', sz: 28, antes: 200, depois: 80 }));
      for (const par of String(s.texto || '').split(/\n+/).filter(Boolean)) out.push(p(par));
      for (const it of s.itens || []) out.push(p('', { ind: 360, cru: run('•  ', { b: true, cor: '28BE52' }) + runs(it) }));
    }
    const tb = c.tabela;
    if (tb && tb.colunas && tb.colunas.length) {
      if (tb.titulo) out.push(p(tb.titulo, { b: true, cor: '1E8A45', sz: 28, antes: 240, depois: 80 }));
      const n = tb.colunas.length, w = Math.floor(9638 / n);
      const cel = (t, cab) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${cab ? '<w:shd w:val="clear" w:color="auto" w:fill="111A19"/>' : ''}</w:tcPr>${p(typeof t === 'number' ? t.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(t) ? 0 : 2 }) : String(t ?? ''), { b: cab, cor: cab ? 'FFFFFF' : '111A19', sz: 20, depois: 40 })}</w:tc>`;
      const borda = 'w:val="single" w:sz="4" w:space="0" w:color="DDE5DC"';
      out.push(`<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top ${borda}/><w:left ${borda}/><w:bottom ${borda}/><w:right ${borda}/><w:insideH ${borda}/><w:insideV ${borda}/></w:tblBorders></w:tblPr><w:tblGrid>${tb.colunas.map(() => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>`
        + `<w:tr>${tb.colunas.map(t => cel(t, true)).join('')}</w:tr>` + (tb.linhas || []).map(l => `<w:tr>${tb.colunas.map((_, i) => cel(l[i], false)).join('')}</w:tr>`).join('') + '</w:tbl>');
    }
    if (c.cta) out.push(p(c.cta, { b: true, cor: 'FFFFFF', fundo: '28BE52', sz: 24, antes: 360, jc: 'center' }));
    out.push(p('KWIK Contabilidade · Contabilidade inteligente · @kwik_contabilidade', { cor: '6B7774', sz: 16, antes: 240, jc: 'center' }));
    const doc = `${REL}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${out.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    return zip([
      { nome: '[Content_Types].xml', dados: `${REL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>` },
      { nome: '_rels/.rels', dados: `${REL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
      { nome: 'word/document.xml', dados: doc },
    ], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  }

  // ------------------------------------------------------------------ Excel (.xlsx) — o Numbers do iPhone/Mac abre direto
  const colL = i => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const ehDinheiro = t => /r\$|valor|pre[çc]o|total|honor[áa]rio|receita|despesa|entrada|sa[íi]da|saldo|custo/i.test(t);
  function tabelaDe(c) {
    if (c.tabela && c.tabela.colunas && c.tabela.colunas.length) return c.tabela;
    const itens = (c.secoes || []).flatMap(s => (s.itens || []).map(i => [s.titulo, semMarca(i)]));
    return { titulo: c.titulo, colunas: ['Seção', 'Item'], linhas: itens.length ? itens : [[c.titulo, c.resumo]], totais: false };
  }
  function xlsx(c) {
    const tb = tabelaDe(c), cols = tb.colunas, linhas = tb.linhas || [];
    const num = v => (typeof v === 'number' ? v : typeof v === 'string' && /^-?\d+([.,]\d+)?$/.test(v.trim()) ? Number(v.replace(',', '.')) : null);
    const cel = (ref, v, s) => { const n = num(v); return n != null ? `<c r="${ref}" s="${s}"><v>${n}</v></c>` : `<c r="${ref}" t="inlineStr" s="${s === 4 ? 3 : s}"><is><t xml:space="preserve">${x(v ?? '')}</t></is></c>`; };
    const rows = [];
    rows.push(`<row r="1" ht="26" customHeight="1">${cel('A1', semMarca(c.titulo || tb.titulo || 'KWIK'), 2)}</row>`);
    rows.push(`<row r="2">${cel('A2', 'KWIK Contabilidade · ' + new Date().toLocaleDateString('pt-BR'), 0)}</row>`);
    rows.push(`<row r="4" ht="20" customHeight="1">${cols.map((t, i) => cel(colL(i) + '4', t, 1)).join('')}</row>`);
    linhas.forEach((l, k) => { const r = 5 + k; rows.push(`<row r="${r}">${cols.map((t, i) => cel(colL(i) + r, l[i], num(l[i]) != null ? (ehDinheiro(t) ? 4 : 5) : 3)).join('')}</row>`); });
    if (tb.totais && linhas.length) {
      const r = 5 + linhas.length, ult = r - 1;
      rows.push(`<row r="${r}">${cols.map((t, i) => (i === 0 ? `<c r="A${r}" t="inlineStr" s="7"><is><t>Total</t></is></c>` : linhas.some(l => num(l[i]) != null) ? `<c r="${colL(i)}${r}" s="${ehDinheiro(t) ? 6 : 7}"><f>SUM(${colL(i)}5:${colL(i)}${ult})</f></c>` : `<c r="${colL(i)}${r}" s="7"/>`)).join('')}</row>`);
    }
    if (c.fontes && c.fontes.length) { // fontes da pesquisa embaixo da tabela
      let r = 5 + linhas.length + (tb.totais && linhas.length ? 1 : 0) + 1;
      rows.push(`<row r="${r}">${cel('A' + r, `Fontes da pesquisa (${c.pesquisadoEm || ''})`, 7)}</row>`);
      for (const fo of c.fontes) { r++; rows.push(`<row r="${r}">${cel('A' + r, fo.titulo, 0)}${cel('B' + r, fo.url, 0)}</row>`); }
    }
    const larg = cols.map((t, i) => Math.min(60,Math.max(12, String(t).length + 4, ...linhas.map(l => String(l[i] ?? '').length + 2))));
    const sheet = `${REL}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${larg.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.join('')}</sheetData></worksheet>`;
    const estilos = `${REL}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00"/></numFmts>
<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="16"/><color rgb="FF1E8A45"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF111A19"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE9F9EE"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFDDE5DC"/></left><right style="thin"><color rgb="FFDDE5DC"/></right><top style="thin"><color rgb="FFDDE5DC"/></top><bottom style="thin"><color rgb="FFDDE5DC"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="164" fontId="3" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    return zip([
      { nome: '[Content_Types].xml', dados: `${REL}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` },
      { nome: '_rels/.rels', dados: `${REL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
      { nome: 'xl/workbook.xml', dados: `${REL}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="KWIK" sheetId="1" r:id="rId1"/></sheets></workbook>` },
      { nome: 'xl/_rels/workbook.xml.rels', dados: `${REL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { nome: 'xl/styles.xml', dados: estilos },
      { nome: 'xl/worksheets/sheet1.xml', dados: sheet },
    ], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  // ------------------------------------------------------------------ PDF (A4), sem bibliotecas
  const WIN = { '€': 128, '‚': 130, '„': 132, '…': 133, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '™': 153 };
  const pdfTxt = s => { let o = ''; for (const ch of String(s)) { const cp = ch.codePointAt(0); let b = cp < 128 ? cp : cp >= 160 && cp <= 255 ? cp : WIN[ch]; if (b == null) continue; if (b === 40 || b === 41 || b === 92) o += '\\' + ch; else if (b < 32) continue; else if (b < 128) o += String.fromCharCode(b); else o += '\\' + b.toString(8).padStart(3, '0'); } return o; };
  function pdf(c) {
    const W = 595, H = 842, M = 50, med = document.createElement('canvas').getContext('2d');
    const larg = (s, t, b) => { med.font = `${b ? 'bold ' : ''}${t}px Helvetica, Arial, sans-serif`; return med.measureText(s).width; };
    const partir = (w, t, b, mw) => { if (larg(w, t, b) <= mw) return [w]; const out = []; let p = ''; for (const ch of w) { if (larg(p + ch, t, b) > mw && p) { out.push(p); p = ch; } else p += ch; } if (p) out.push(p); return out; }; // links compridos
    const quebrar = (s, t, b, mw) => { const out = []; for (const par of String(s).split('\n')) { let l = ''; for (const w of par.split(/\s+/).filter(Boolean).flatMap(w0 => partir(w0, t, b, mw))) { const tt = l ? l + ' ' + w : w; if (larg(tt, t, b) > mw && l) { out.push(l); l = w; } else l = tt; } out.push(l); } return out; };
    const cor = h => [1, 3, 5].map(i => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3)).join(' ');
    const paginas = []; let ops = null, y = 0;
    const escrever = (s, xx, yy, t, b, c0) => ops.push(`BT /${b ? 'F2' : 'F1'} ${t} Tf ${cor(c0 || GRAFITE)} rg ${xx.toFixed(1)} ${yy.toFixed(1)} Td (${pdfTxt(s)}) Tj ET`);
    const nova = () => {
      ops = []; paginas.push(ops);
      ops.push(`${cor(GRAFITE)} rg 0 ${H - 58} ${W} 58 re f`, `${cor(VERDE)} rg 0 ${H - 62} ${W} 4 re f`);
      escrever('KWIK', M, H - 38, 20, true, '#ffffff'); escrever('CONTABILIDADE', M + 62, H - 37, 9, true, VERDE);
      escrever(`Página ${paginas.length}`, W - M - 50, 28, 8, false, '#6b7774'); escrever('KWIK Contabilidade · Contabilidade inteligente · @kwik_contabilidade', M, 28, 8, false, '#6b7774');
      y = H - 96;
    };
    const espaco = h => { if (y - h < 60) nova(); };
    const paragrafo = (s, t = 11, b = false, c0 = GRAFITE, ind = 0, depois = 6) => { for (const l of quebrar(semMarca(s), t, b, W - 2 * M - ind)) { espaco(t * 1.45); escrever(l, M + ind, y, t, b, c0); y -= t * 1.45; } y -= depois; };
    nova();
    if (c.tag) paragrafo(c.tag, 9, true, '#1E8A45', 0, 2);
    paragrafo(c.titulo || '', 22, true, GRAFITE, 0, 4);
    if (c.subtitulo) paragrafo(c.subtitulo, 12, false, '#6b7774', 0, 10);
    if (c.resumo) paragrafo(c.resumo, 11, false, GRAFITE, 0, 12);
    for (const s of c.secoes || []) {
      if (s.titulo) { espaco(40); y -= 6; ops.push(`${cor(VERDE)} rg ${M} ${y - 3} 4 16 re f`); paragrafo(s.titulo, 14, true, '#1E8A45', 10, 4); }
      for (const par of String(s.texto || '').split(/\n+/).filter(Boolean)) paragrafo(par);
      for (const it of s.itens || []) { espaco(16); ops.push(`${cor(VERDE)} rg ${M + 6} ${y + 3} 4 4 re f`); paragrafo(it, 11, false, GRAFITE, 16, 2); }
      y -= 6;
    }
    const tb = c.tabela;
    if (tb && tb.colunas && tb.colunas.length) {
      if (tb.titulo) { espaco(40); paragrafo(tb.titulo, 14, true, '#1E8A45', 0, 4); }
      const n = tb.colunas.length, cw = (W - 2 * M) / n, t = n > 5 ? 8 : 9.5;
      const fmt = v => (typeof v === 'number' ? v.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2 }) : String(v ?? ''));
      const linha = (vals, cab, zebra) => {
        const ls = vals.map(v => quebrar(semMarca(fmt(v)), t, cab, cw - 8)), h = Math.max(...ls.map(l => l.length)) * t * 1.35 + 8;
        espaco(h + 4);
        ops.push(cab ? `${cor(GRAFITE)} rg ${M} ${y - h + 4} ${W - 2 * M} ${h} re f` : zebra ? `${cor('#f1f5f0')} rg ${M} ${y - h + 4} ${W - 2 * M} ${h} re f` : '');
        ls.forEach((l, i) => l.forEach((tx, k) => escrever(tx, M + i * cw + 4, y - 6 - k * t * 1.35, t, cab, cab ? '#ffffff' : GRAFITE)));
        y -= h;
      };
      linha(tb.colunas, true); (tb.linhas || []).forEach((l, i) => linha(tb.colunas.map((_, k) => l[k]), false, i % 2));
      y -= 10;
    }
    if (c.cta) { espaco(50); y -= 8; const h = 30; ops.push(`${cor(VERDE)} rg ${M} ${y - h + 10} ${W - 2 * M} ${h} re f`); const tw = larg(semMarca(c.cta), 12, true); escrever(semMarca(c.cta), Math.max(M + 8, W / 2 - tw / 2), y - 8, 12, true, GRAFITE); y -= h; }
    // monta o arquivo (texto puro: tudo que não é ASCII vai escapado)
    const objs = [];
    objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    const kids = [];
    paginas.forEach((pg, i) => {
      const np = 5 + i * 2, nc = np + 1, conteudo = pg.filter(Boolean).join('\n');
      objs[np] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${nc} 0 R >>`;
      objs[nc] = `<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`;
      kids.push(`${np} 0 R`);
    });
    objs[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;
    let s = '%PDF-1.4\n'; const offs = [];
    for (let i = 1; i < objs.length; i++) { offs[i] = s.length; s += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
    const xr = s.length;
    s += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + offs.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
    return new Blob([s], { type: 'application/pdf' });
  }

  // ------------------------------------------------------------------ HTML (página KWIK)
  function html(c) {
    const destaque = t => x(t).replace(/\*([^*]+)\*/g, '<mark>$1</mark>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>'), wl = whatsLink();
    const tb = c.tabela && c.tabela.colunas && c.tabela.colunas.length ? `<section class="card"><h2>${destaque(c.tabela.titulo || 'Tabela')}</h2><div class="tab"><table><thead><tr>${c.tabela.colunas.map(t => `<th>${x(t)}</th>`).join('')}</tr></thead><tbody>${(c.tabela.linhas || []).map(l => `<tr>${c.tabela.colunas.map((_, i) => `<td>${x(typeof l[i] === 'number' ? l[i].toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(l[i]) ? 0 : 2 }) : l[i] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>` : '';
    return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${x(semMarca(c.titulo))} · KWIK Contabilidade</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Montserrat,system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#111A19;background:#F1F5F0;line-height:1.55}
header{background:#111A19;color:#fff;padding:22px 6vw 60px;border-bottom:6px solid #28BE52}.marca{font-weight:900;letter-spacing:1px;font-size:22px}.marca span{color:#28BE52;font-size:12px;letter-spacing:3px;margin-left:8px}
.tag{display:inline-block;margin-top:34px;background:#28BE52;color:#111A19;font-weight:800;font-size:12px;letter-spacing:1.5px;padding:6px 14px;border-radius:99px}
h1{font-size:clamp(30px,6vw,52px);line-height:1.08;margin:14px 0 10px;font-weight:900}mark{background:#28BE52;color:#111A19;padding:0 .15em}.sub{color:#a9b8b4;font-size:18px;max-width:760px}
main{max-width:980px;margin:-36px auto 40px;padding:0 5vw;display:grid;gap:16px}.card{background:#fff;border-radius:20px;padding:22px 26px;box-shadow:0 10px 30px rgba(17,26,25,.08)}
h2{margin:0 0 10px;font-size:21px;color:#1E8A45}ul{padding-left:0;list-style:none}li{padding:6px 0 6px 28px;position:relative}li::before{content:"";position:absolute;left:4px;top:13px;width:10px;height:10px;border-radius:3px;background:#28BE52}
.tab{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th{background:#111A19;color:#fff;text-align:left;padding:10px}td{padding:9px 10px;border-bottom:1px solid #dde5dc}tr:nth-child(even) td{background:#f6faf6}
.cta{display:block;text-align:center;background:#28BE52;color:#111A19;font-weight:900;font-size:19px;padding:18px;border-radius:18px;text-decoration:none;box-shadow:0 6px 0 #1E8A45}
footer{text-align:center;color:#6b7774;font-size:13px;padding:10px 0 40px}main a:not(.cta){color:#1E8A45;word-break:break-all}
</style></head><body>
<header><div class="marca">KWIK<span>CONTABILIDADE</span></div>${c.tag ? `<div class="tag">${x(c.tag)}</div>` : ''}<h1>${destaque(c.titulo || '')}</h1>${c.subtitulo ? `<p class="sub">${x(c.subtitulo)}</p>` : ''}</header>
<main>${c.resumo ? `<section class="card"><p style="font-size:18px;margin:0">${destaque(c.resumo)}</p></section>` : ''}
${(c.secoes || []).map(s => `<section class="card">${s.titulo ? `<h2>${destaque(s.titulo)}</h2>` : ''}${String(s.texto || '').split(/\n+/).filter(Boolean).map(p => `<p>${destaque(p)}</p>`).join('')}${(s.itens || []).length ? `<ul>${s.itens.map(i => `<li>${destaque(i)}</li>`).join('')}</ul>` : ''}</section>`).join('\n')}
${tb}
${c.cta ? `<a class="cta" ${wl ? `href="${x(wl)}"` : ''} target="_blank" rel="noopener">${destaque(c.cta)}</a>` : ''}</main>
<footer>KWIK Contabilidade · Contabilidade inteligente · @kwik_contabilidade</footer></body></html>`;
  }

  // ------------------------------------------------------------------ imagem e vídeo (motor do Enzo)
  function specPost(c) { return { tipo: 'post', w: 1080, h: 1350, fundo: ['grafite', 'branco', 'verde'][Math.floor(Math.random() * 3)], tag: (c.tag || 'KWIK CONTABILIDADE').slice(0, 26).toUpperCase(), titulo: c.titulo && /\*/.test(c.titulo) ? c.titulo : `*${semMarca(c.titulo || 'KWIK')}*`, sub: c.subtitulo || c.resumo || '', icone: c.icone || 'grafico', whats: whats() }; }
  function specVideo(c) {
    const pal = s => String(s || '').split(/\s+/).filter(Boolean).length, lim = (v, a, b) => Math.max(a, Math.min(b, v));
    const cenas = [];
    const fontes = (c.cenas && c.cenas.length ? c.cenas : [{ tipo: 'gancho', texto: c.titulo }, ...(c.secoes || []).slice(0, 3).map(s => ({ tipo: 'ponto', texto: s.texto || (s.itens || [])[0] || s.titulo })), { tipo: 'cta', texto: c.cta || 'Chama a *KWIK*.' }]);
    const pontos = fontes.filter(s => s.tipo === 'ponto');
    for (const s of fontes) {
      if (s.tipo === 'gancho') cenas.push({ tipo: 'gancho', d: 3.8, tag: (c.tag || 'KWIK').toUpperCase().slice(0, 24), texto: s.texto });
      else if (s.tipo === 'titulo') cenas.push({ tipo: 'titulo', d: lim(2.6 + pal(s.texto) * 0.22, 5, 8), rotulo: 'ENTENDA', texto: s.texto });
      else if (s.tipo === 'ponto') cenas.push({ tipo: 'ponto', d: lim(2.6 + pal(s.texto) * 0.3, 4.5, 9), n: pontos.indexOf(s) + 1, total: pontos.length, rotulo: pontos.indexOf(s) ? 'E TEM MAIS' : 'O PRINCIPAL', texto: s.texto });
      else if (s.tipo === 'lista') cenas.push({ tipo: 'lista', d: 7, rotulo: semMarca(s.texto || 'O QUE FAZER AGORA').toUpperCase().slice(0, 30), itens: (s.itens || []).slice(0, 3) });
      else if (s.tipo === 'cta') cenas.push({ tipo: 'cta', d: 4.6, texto: s.texto || 'Chama a *KWIK*.', sub: 'Contabilidade, BPO e consultoria.', whats: whats() });
    }
    cenas.push({ tipo: 'fim', d: 3.2, whats: whats() });
    let t = 0; for (const s of cenas) { s.ini = Math.round(t * 100) / 100; t += s.d; s.fim = Math.round(t * 100) / 100; delete s.d; }
    const hoje = new Date();
    return { formato: 'reels', w: 1080, h: 1920, duracao: Math.round(t * 10) / 10, fundo: ['grafite', 'branco', 'verde', 'nevoa'][Math.floor(Math.random() * 4)], data: `KWIK · ${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`, fonte: 'KWIK Contabilidade', cenas,
      musica: { bpm: [96, 104, 110][Math.floor(Math.random() * 3)], prog: Math.floor(Math.random() * 4), semente: Math.floor(Math.random() * 1e6) } };
  }

  // ------------------------------------------------------------------ entregar (prévia + baixar)
  function baixar(blob, nome) {
    const url = URL.createObjectURL(blob), a = el('a', { href: url, download: nome }); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10 * 60000);
    A().toast(`⬇️ Baixado: ${nome}`);
  }
  function entregar(formato, c, box) {
    box.innerHTML = '';
    const origem = c.pesquisa ? ` · com pesquisa${c.comGemini ? ' (Wikipédia + Gemini)' : ' (Wikipédia)'} e fontes` : c.rapido ? ' · modelos da KWIK' : '';
    const f = F(formato), cab = el('div', { class: 'cr-res-cab' }, el('div', {}, el('small', {}, `${f.ic} ${f.nome}${origem}`), el('h3', {}, semMarca(c.titulo || 'Criação KWIK'))));
    const bts = el('div', { class: 'cr-bts' }); cab.append(bts); box.append(cab);
    if (!c.pesquisa) box.append(el('p', { class: 'cr-aviso' }, '⚡ Não encontrei pesquisa sobre esse assunto, então montei com os modelos prontos da KWIK. Tente descrever com o nome do tema (ex.: "MEI", "Simples Nacional", "FGTS").'));
    const fontesBox = !(c.fontes && c.fontes.length) ? null : (el('div', { class: 'cr-fontes' }, el('b', {}, `📚 Fontes da pesquisa (${c.pesquisadoEm || ''})`),
      el('ol', {}, c.fontes.map(fo => el('li', {}, el('a', { href: fo.url, target: '_blank', rel: 'noopener' }, fo.titulo), el('small', {}, ' · ' + fo.origem)))),
      el('small', {}, 'Confira as fontes antes de publicar: leis, prazos e valores mudam.')));
    const copiar = (t, msg) => el('button', { class: 'bt peq', onclick: async () => { try { await navigator.clipboard.writeText(t); A().toast(msg || '📋 Copiado'); } catch (e) { A().toast('Não consegui copiar', { erro: true }); } } }, '📋 Copiar');
    const prev = el('div', { class: 'cr-prev' }); box.append(prev);
    if (formato === 'texto') {
      const t = c.texto || [c.titulo, '', c.resumo, ...(c.secoes || []).flatMap(s => [s.titulo, s.texto, ...(s.itens || []).map(i => '• ' + i)])].filter(Boolean).join('\n');
      prev.append(el('pre', { class: 'cr-texto' }, semMarca(t)));
      bts.append(copiar(semMarca(t), '📋 Texto copiado'), el('button', { class: 'bt peq prim', onclick: () => baixar(new Blob([semMarca(t)], { type: 'text/plain;charset=utf-8' }), nomeArq(c.titulo, 'txt')) }, '⬇️ Baixar .txt'));
    } else if (formato === 'imagem') {
      const s = specPost(c), cv = el('canvas', { width: s.w, height: s.h, class: 'cr-img' });
      const desenhar = () => { const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); KM.marketing.desenharPost(g, s); };
      (KM.marketing.prepararFontes ? KM.marketing.prepararFontes() : Promise.resolve()).then(desenhar);
      prev.append(cv);
      if (c.legenda) prev.append(el('h4', {}, '📝 Legenda'), el('pre', { class: 'cr-texto' }, c.legenda));
      bts.append(el('button', { class: 'bt peq', onclick: () => { s.fundo = { grafite: 'branco', branco: 'verde', verde: 'grafite' }[s.fundo] || 'grafite'; desenhar(); } }, '🎨 Outro fundo'),
        c.legenda ? copiar(c.legenda, '📋 Legenda copiada') : null, el('button', { class: 'bt peq prim', onclick: () => cv.toBlob(b => baixar(b, nomeArq(c.titulo, 'png')), 'image/png') }, '⬇️ Baixar PNG'));
    } else if (formato === 'video') {
      const s = specVideo(c);
      KM.marketing.renderVideo({ id: 'criar-' + Date.now(), video: s, noticia: { titulo: semMarca(c.titulo) }, legenda: c.legenda || semMarca(c.titulo), criadoEm: new Date().toISOString(), funcionario: { nome: (cfg().funcionarios.find(q => q.id === 'f1') || {}).nome || 'Kauã' } }, prev);
      prev.querySelectorAll('.rel-bts').forEach(b => b.remove()); // "Apagar" e "Fazer 2.0" são dos relatórios do Enzo
    } else {
      const fr = el('iframe', { class: 'cr-frame', title: 'Prévia' }); fr.srcdoc = html(c); prev.append(fr);
      const ext = formato === 'excel' || formato === 'numbers' ? 'xlsx' : formato === 'word' ? 'docx' : formato;
      const gerar = () => (ext === 'xlsx' ? xlsx(c) : ext === 'docx' ? docx(c) : ext === 'pdf' ? pdf(c) : new Blob([html(c)], { type: 'text/html;charset=utf-8' }));
      bts.append(el('button', { class: 'bt peq prim', onclick: () => baixar(gerar(), nomeArq(c.titulo, ext)) }, `⬇️ Baixar .${ext}`));
      if (formato === 'numbers') box.append(el('p', { class: 'cr-aviso' }, '🍏 O formato .numbers só é gravado pelo próprio Numbers da Apple. O arquivo vem em .xlsx: no iPhone ou Mac, toque nele e escolha "Abrir no Numbers" — ele abre com as cores e as fórmulas.'));
      if (ext === 'xlsx' || ext === 'docx') prev.prepend(el('p', { class: 'cr-aviso' }, `A prévia mostra o conteúdo; o arquivo .${ext} sai com o mesmo texto${ext === 'xlsx' ? ', a tabela com cabeçalho grafite, R$ formatado e total com fórmula' : ', o cabeçalho KWIK e as cores da marca'}.`));
    }
    if (fontesBox) box.append(fontesBox); // as fontes vêm depois do resultado
  }

  // ------------------------------------------------------------------ tela
  let formato = null;
  function montar() {
    if ($('#dlgCriar')) return;
    const d = document.createElement('dialog'); d.id = 'dlgCriar'; d.className = 'cr-dlg';
    d.innerHTML = `<div class="dlg-topo"><h2>✨ Criar com o Kauã</h2><button data-fechar aria-label="Fechar">×</button></div><div class="dlg-corpo" id="crCorpo"></div>`;
    document.body.append(d);
    d.querySelector('[data-fechar]').addEventListener('click', () => d.close());
  }
  function abrir() { montar(); formato = null; render(); const d = $('#dlgCriar'); if (!d.open) d.showModal(); }
  function render() {
    const box = $('#crCorpo'); box.innerHTML = '';
    box.append(el('p', { class: 'cr-passo' }, el('b', {}, '1.'), ' É um arquivo, um texto ou um vídeo? Escolha o formato:'));
    box.append(el('div', { class: 'cr-formatos' }, FORMATOS.map(f => el('button', { class: 'cr-fmt' + (formato === f.k ? ' on' : ''), onclick: () => { formato = f.k; render(); setTimeout(() => $('#crDesc') && $('#crDesc').focus(), 30); } }, el('span', { class: 'ic' }, f.ic), el('b', {}, f.nome), el('small', {}, f.desc)))));
    if (!formato) { box.append(historico()); return; }
    const f = F(formato), gem = conectado() && (cfg().criar || {}).gemini === true;
    const ta = el('textarea', { id: 'crDesc', rows: 5, placeholder: f.ex });
    const chk = el('input', { type: 'checkbox', checked: gem, disabled: !conectado() });
    const status = el('p', { class: 'cr-status' }), res = el('div', { class: 'cr-res' });
    const bt = el('button', { class: 'bt prim', onclick: async () => {
      const desc = ta.value.trim(); if (!desc) return ta.focus();
      const c0 = cfg(); c0.criar = c0.criar || {}; c0.criar.gemini = chk.checked; delete c0.criar.ia;
      bt.disabled = true; res.innerHTML = '';
      const p = A().estado.pessoas.f1; if (p) { A().falar('f1', `Deixa comigo! Vou pesquisar e criar ${f.nome.toLowerCase()} da KWIK 🔎`, 3000); p.digitando = true; }
      status.textContent = '🔎 Pesquisando na Wikipédia…';
      let avisos = [];
      const pWiki = pesquisarWiki(desc).catch(e => { avisos.push(`a Wikipédia não respondeu (${e.message})`); return []; });
      const pGem = chk.checked && conectado() ? pedirGemini(formato, desc, t => { status.textContent = t; }).catch(e => {
        avisos.push(e.codigo === 'sem_chave' ? 'o Gemini ainda não está ligado (falta a chave GEMINI_API_KEY no GitHub)' : e.codigo === 'chave_invalida' ? 'a chave do Gemini no GitHub está inválida'
          : e.codigo === 'tempo' ? 'o GitHub demorou para responder o Gemini' : `o Gemini não conseguiu (${e.message})`);
        return null; }) : Promise.resolve(null);
      const [wikiPags, gemRes] = await Promise.all([pWiki, pGem]);
      const c = aplicarPesquisa(gerarLocal(formato, desc), formato, desc, wikiPags, gemRes);
      status.textContent = avisos.length ? `⚠️ ${avisos.join('; ')}. Usei o que deu para pesquisar.` : c.pesquisa ? `✅ Pronto! ${c.fontes.length} fonte${c.fontes.length === 1 ? '' : 's'} no fim.` : '';
      if (avisos.length) A().toast('⚠️ ' + avisos.join('; '), { ms: 8000 });
      if (p) p.digitando = false;
      salvarHist(formato, desc, c);
      entregar(formato, c, res); bt.disabled = false;
      A().falar('f1', 'Pronto! Ficou com a cara da KWIK 💚', 3000);
      if (A().registrar) A().registrar('f1', '✨', `Criou ${f.nome}: ${semMarca(c.titulo).slice(0, 60)}`);
      res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } }, `✨ Criar ${f.nome}`);
    box.append(el('p', { class: 'cr-passo' }, el('b', {}, '2.'), ` Descreva o que você quer (${f.ic} ${f.nome}):`), ta,
      el('div', { class: 'cr-acoes' }, bt, el('label', { class: 'cr-ia', title: conectado() ? 'O Gemini (Google) pesquisa na internet pela Action "Criar (pesquisa)" no GitHub e devolve as fontes' : 'Conecte o app ao GitHub (🔗 no topo) para pesquisar também com o Gemini' }, chk, ' Pesquisar também com o Gemini (Google)')),
      el('p', { class: 'cr-dica' }, '🔎 O Kauã pesquisa o assunto (Wikipédia e, se marcado, Gemini na web), monta no estilo da KWIK e lista as fontes no fim. O conteúdo vem das fontes pesquisadas.'),
      status, res, historico());
  }
  function salvarHist(formato, descricao, conteudo) {
    const c = cfg(); c.criacoes = (c.criacoes || []).filter(h => h.descricao !== descricao || h.formato !== formato);
    c.criacoes.unshift({ id: Date.now().toString(36), formato, descricao: descricao.slice(0, 600), quando: new Date().toISOString(), conteudo });
    c.criacoes = c.criacoes.slice(0, 12); A().salvar();
  }
  function historico() {
    const lista = cfg().criacoes || [], box = el('div', { class: 'cr-hist' });
    if (lista.length) {
      box.append(el('h4', {}, '🕘 Criados recentemente'));
      for (const h of lista) box.append(el('button', { class: 'cr-h', onclick: () => { formato = h.formato; render(); const res = $('#crCorpo .cr-res'); $('#crDesc').value = h.descricao; entregar(h.formato, h.conteudo, res); } }, `${F(h.formato).ic} ${semMarca(h.conteudo.titulo || h.descricao).slice(0, 70)}`, el('small', {}, new Date(h.quando).toLocaleString('pt-BR').slice(0, 16))));
    }
    const repo = conectado() ? gh().conf().repo : 'kauabreno88-spec/KWIK-MINI-ESCRITORIO';
    box.append(el('details', { class: 'cr-como' }, el('summary', {}, '🔑 Como ligar a pesquisa com o Gemini (Google)'), el('div', { class: 'passos', html: `<ol>
      <li>Sem fazer nada, o Kauã já pesquisa na Wikipédia e cita as fontes.</li>
      <li>Para pesquisar também na web com o Gemini: crie uma chave em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio → Get API key</a>.</li>
      <li>No GitHub, abra <a href="https://github.com/${repo}/settings/secrets/actions" target="_blank" rel="noopener">Settings → Secrets and variables → Actions</a> e crie o segredo <b>GEMINI_API_KEY</b> com essa chave.</li>
      <li>Marque "Pesquisar também com o Gemini". Cada pedido roda a Action <a href="https://github.com/${repo}/actions/workflows/criar.yml" target="_blank" rel="noopener">"Criar (pesquisa)"</a> e volta em 1 a 3 minutos, com os links das páginas que o Gemini usou.</li></ol>
      <small>A chave fica só no GitHub (o app não vê). A API do Gemini tem uso gratuito com limite; acima dele, o Google cobra na conta dele.</small>` })));
    return box;
  }
  function iniciar() {}
  KM.criar = { iniciar, abrir, gerarLocal, docx, xlsx, pdf, html, specVideo, specPost, _entregar: entregar };
})();
