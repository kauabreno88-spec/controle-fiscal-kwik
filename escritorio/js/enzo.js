/* KWIK Mini Escritório · Enzo (Marketing): conteúdo para o Instagram no estilo do @kwik_contabilidade.
   Antes de começar ele pergunta o formato:
   - Stories: vídeo vertical 9:16 com pelo menos 30 s e música;
   - Reels:   vídeo vertical 9:16 de até 1:30, com o tema mais completo (no PC ele lê a notícia inteira) e música;
   - Post:    você descreve a imagem e ele monta a arte (4:5) para atrair clientes.
   Visual tirado do perfil: Montserrat Black, palavra-chave em caixa verde, etiqueta verde com ">>>",
   logo no canto, fundos grafite (com barras subindo), branco pontilhado ou verde, e "Fonte" no rodapé.
   Tudo é desenhado no próprio app (canvas); a música é sintetizada (Web Audio) e gravada junto no vídeo. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const U = () => KM.marketing._u;
  const VERDE = '#28BE52', GRAFITE = '#111A19', NEVOA = '#F1F5F0';
  const sorteio = arr => arr[Math.floor(Math.random() * arr.length)];
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // ------------------------------------------------------------------ textos
  const DESTAQUES = /(?<![\wÀ-ú])(Reforma Tribut[áa]ria|Simples Nacional|Imposto de Renda|Receita Federal|nota fiscal|13º sal[áa]rio|d[ée]cimo terceiro|split payment|Lucro Presumido|quinto dia [úu]til|eSocial|prazo|multa|f[ée]rias|parcelamento|Simples|\d{1,2}\/\d{1,2})(?![\wÀ-ú])/i;
  const SIGLAS = /(?<![\wÀ-ú])(MEI|IRPF|IRPJ|FGTS|INSS|ICMS|ISS|IBS|CBS|Pix|DAS|DCTFWeb|NFS-e)(?![\wÀ-ú])/;
  const acharDestaque = t => [String(t).match(DESTAQUES), String(t).match(SIGLAS)].filter(Boolean).sort((a, b) => a.index - b.index)[0];
  const GANCHOS = [
    [/\bMEI\b/i, 'Atenção, *MEI*!'], [/Simples/i, 'Sua empresa é do *Simples*?'], [/Reforma Tribut|\bIBS\b|\bCBS\b|split payment/i, '*Reforma Tributária*: o que muda?'],
    [/Imposto de Renda|IRPF/i, '*Imposto de Renda*: atenção!'], [/eSocial|FGTS|INSS|folha|sal[áa]rio|f[ée]rias|trabalhist|13º|6x1/i, '*Empregador*, olha isso!'],
    [/prazo|vence|vencimento|prorroga/i, 'Olha o *prazo*!'], [/multa/i, 'Cuidado com *multas*!'], [/nota fiscal|NFS-e|NF-e/i, 'Mudou a *nota fiscal*?'],
    [/\bPix\b/i, '*Pix*: o que muda?'], [/parcelamento|regulariza|transa[çc][ãa]o|d[íi]vida/i, 'Hora de *regularizar*?'],
  ];
  const HASHTAGS = [
    [/\bMEI\b/i, '#mei'], [/Simples/i, '#simplesnacional'], [/Reforma Tribut|\bIBS\b|\bCBS\b|split/i, '#reformatributaria'],
    [/Imposto de Renda|IRPF/i, '#impostoderenda'], [/eSocial|folha|sal[áa]rio|f[ée]rias|13º/i, '#folhadepagamento'], [/FGTS|INSS/i, '#direitostrabalhistas'],
    [/nota fiscal|NFS-e/i, '#notafiscal'], [/\bPix\b/i, '#pix'], [/Receita Federal|transa[çc][ãa]o|d[íi]vida/i, '#receitafederal'], [/prazo|vence/i, '#prazos'],
  ];
  const NOME_FONTE = { contabeis: 'Portal Contábeis', contadores: 'Contadores.cnt.br' };
  const FAZER = ['Veja se isso vale para a sua empresa', 'Anote as datas importantes', 'Na dúvida, chame a KWIK antes de agir'];

  const marcar = titulo => { const m = acharDestaque(titulo); return m ? titulo.slice(0, m.index) + '*' + m[0] + '*' + titulo.slice(m.index + m[0].length) : titulo; };
  const semMarca = s => String(s || '').replace(/\*/g, '');
  const palavras = s => String(s || '').split(/\s+/).filter(Boolean).length;
  const sentencas = t => String(t || '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"“(0-9])/).map(x => x.trim()).filter(Boolean);
  function frasesResumo(n) {
    const sem = x => x.toLowerCase().replace(/[^a-z0-9]/g, '');
    return sentencas(n.resumo).filter(x => x.length > 25 && sem(x) !== sem(n.titulo)).slice(0, 3).map(x => U().curto(x, 140));
  }
  // Escolhe as frases mais informativas da notícia completa (datas, números, termos fiscais), na ordem do texto.
  function frasesArtigo(paragrafos, n) {
    const ruim = /leia tamb[ée]m|clique|inscreva|cookies|newsletter|©|siga |whatsapp do portal|publicidade|assine|compartilhe|foto:|pexels|freepik|shutterstock|unsplash|imagem:/i;
    const todas = paragrafos.flatMap(sentencas).filter(x => x.length >= 45 && x.length <= 260 && !ruim.test(x));
    const nota = x => (/\d/.test(x) ? 3 : 0) + (acharDestaque(x) ? 2 : 0) + (/prazo|valor|empresa|contribuinte|deve|pode|obrigat|regra|muda/i.test(x) ? 1 : 0);
    const top = todas.map((x, i) => ({ x, i, s: nota(x) })).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, 6).sort((a, b) => a.i - b.i);
    const vistos = new Set(), out = [];
    for (const { x } of top) { const k = x.slice(0, 40); if (!vistos.has(k)) { vistos.add(k); out.push(U().curto(x, 160)); } }
    return out.length >= 2 ? out : frasesResumo(n);
  }
  async function buscarArtigo(url) {
    try {
      if (!url || A().BK().nome !== 'local') return [];
      const r = await fetch('/api/artigo?url=' + encodeURIComponent(url), { cache: 'no-store' });
      if (!r.ok) return [];
      return (await r.json()).paragrafos || [];
    } catch (e) { return []; }
  }

  // ------------------------------------------------------------------ roteiro do vídeo (stories / reels)
  const PROGS = [[[57, 'm'], [53, 'M'], [48, 'M'], [55, 'M']], [[48, 'M'], [55, 'M'], [57, 'm'], [53, 'M']], [[50, 'm'], [53, 'M'], [48, 'M'], [55, 'M']], [[45, 'm'], [52, 'm'], [48, 'M'], [55, 'M']]];
  function montarVideo(n, cfg, formato, paragrafos) {
    const reels = formato === 'reels';
    const texto = `${n.titulo} ${(n.temas || []).join(' ')} ${n.categoria || ''}`;
    const gancho = (GANCHOS.find(([re]) => re.test(n.titulo)) || GANCHOS.find(([re]) => re.test(texto)) || [null, 'Notícia importante pra *sua empresa*'])[1];
    const pontos = reels ? frasesArtigo(paragrafos || [], n) : frasesResumo(n);
    if (!pontos.length) pontos.push('Saiu uma novidade que pode mexer com a rotina da sua empresa.');
    const opc = ['grafite', 'branco', 'verde', 'nevoa'].filter(f => f !== cfg.marketing.ultimoFundo);
    const whats = U().foneBonito(cfg.marketing.whats);
    const hoje = new Date(), data = `NOTÍCIA · ${String(hoje.getDate()).padStart(2, '0')} ${MESES[hoje.getMonth()]} ${hoje.getFullYear()}`;
    const cenas = [
      { tipo: 'gancho', d: 3.6, tag: String(n.categoria || (n.temas || [])[0] || 'Notícia contábil').toUpperCase(), texto: gancho },
      { tipo: 'titulo', d: limitar(2.6 + palavras(n.titulo) * 0.22, 5, 8), rotulo: 'NOTÍCIA DO DIA', texto: marcar(n.titulo) },
      ...pontos.map((x, i) => ({ tipo: 'ponto', d: limitar(2.6 + palavras(x) * 0.3, 4.5, 9), n: i + 1, total: pontos.length, rotulo: i === 0 ? 'ENTENDA' : 'E TEM MAIS', texto: marcar(x) })),
      { tipo: 'lista', d: 7, rotulo: 'O QUE FAZER AGORA', itens: FAZER },
      ...(reels ? [{ tipo: 'aviso', d: 5, texto: 'Cada empresa tem uma situação. Confira a regra para o seu caso antes de agir.' }] : []),
      { tipo: 'cta', d: 4.6, texto: 'Dúvida? Chama a *KWIK*.', sub: 'Contabilidade, BPO e consultoria.', whats },
      { tipo: 'fim', d: 3.2, whats },
    ];
    // stories: no mínimo 30 s · reels: no máximo 1:30
    let total = cenas.reduce((s, c) => s + c.d, 0);
    if (!reels && total < 31) { const k = (31 - total) / cenas.filter(c => c.tipo === 'ponto' || c.tipo === 'titulo' || c.tipo === 'lista').reduce((s, c) => s + c.d, 0); cenas.forEach(c => { if (c.tipo === 'ponto' || c.tipo === 'titulo' || c.tipo === 'lista') c.d *= 1 + k; }); }
    while (reels && cenas.reduce((s, c) => s + c.d, 0) > 90) { const i = cenas.map(c => c.tipo).lastIndexOf('ponto'); if (i < 0) break; cenas.splice(i, 1); }
    let t = 0; for (const c of cenas) { c.ini = Math.round(t * 100) / 100; t += c.d; c.fim = Math.round(t * 100) / 100; delete c.d; }
    return {
      formato, w: 1080, h: 1920, duracao: Math.round(t * 10) / 10, fundo: sorteio(opc), data,
      fonte: NOME_FONTE[n.fonte] || 'Portal Contábeis', cenas,
      musica: { bpm: sorteio([96, 100, 104, 110, 116]), prog: Math.floor(Math.random() * PROGS.length), semente: Math.floor(Math.random() * 1e6) },
    };
  }
  // "Fazer 2.0": mesmo tema, vídeo totalmente diferente — abre com uma pergunta, resume em uma frase, conta os pontos
  // na ordem inversa com números gigantes, checklist novo, outro fundo, música lo-fi (ou pop, se o anterior era lo-fi),
  // barra de progresso e transição em círculo.
  const FAZER2 = ['Separe os documentos da empresa', 'Confira as datas no seu calendário', 'Mande este vídeo para quem cuida das contas'];
  function montarVideo2(ant, n, cfg) {
    const reels = ant.formato === 'reels';
    const pontos = ant.cenas.filter(c => c.tipo === 'ponto' || c.tipo === 'contagem').map(c => semMarca(c.texto));
    if (!pontos.length) pontos.push(...frasesResumo(n));
    if (!pontos.length) pontos.push('Saiu uma novidade que pode mexer com a rotina da sua empresa.');
    const d = acharDestaque(n.titulo || ''), tema = d ? d[0] : ((n.temas || [])[0] || 'sua empresa');
    const perguntas = [`Você já sabe o que muda com *${tema}*?`, `*${tema}*: sua empresa está preparada?`, `Isso pode mexer no seu *bolso*. Sabia?`, `Empresário, me dá 30 segundos: *${tema}*`];
    const whats = U().foneBonito(cfg.marketing.whats);
    const lista = pontos.slice().reverse();
    const cenas = [
      { tipo: 'pergunta', d: 4.2, texto: sorteio(perguntas) },
      { tipo: 'resumo', d: limitar(2.8 + palavras(n.titulo) * 0.22, 5, 8), rotulo: 'EM UMA FRASE', texto: marcar(n.titulo || '') },
      ...lista.map((x, i) => ({ tipo: 'contagem', d: limitar(2.8 + palavras(x) * 0.3, 4.5, 9), n: i + 1, total: lista.length, texto: marcarFrase(x) })),
      { tipo: 'lista', d: 7, rotulo: 'CHECKLIST RÁPIDO', itens: FAZER2 },
      { tipo: 'cta', d: 4.6, texto: 'Salva este vídeo e chama a *KWIK*', sub: 'A gente cuida disso pra você.', whats },
      { tipo: 'fim', d: 3.2, whats },
    ];
    let total = cenas.reduce((s, c) => s + c.d, 0);
    if (!reels && total < 31) { const k = (31 - total) / cenas.filter(c => c.tipo !== 'fim' && c.tipo !== 'cta').reduce((s, c) => s + c.d, 0); cenas.forEach(c => { if (c.tipo !== 'fim' && c.tipo !== 'cta') c.d *= 1 + k; }); }
    while (reels && cenas.reduce((s, c) => s + c.d, 0) > 90) { const i = cenas.map(c => c.tipo).lastIndexOf('contagem'); if (i < 0) break; cenas.splice(i, 1); }
    let t = 0; for (const c of cenas) { c.ini = Math.round(t * 100) / 100; t += c.d; c.fim = Math.round(t * 100) / 100; delete c.d; }
    const estiloAnt = (ant.musica && ant.musica.estilo) || 'pop', lofi = estiloAnt !== 'lofi';
    return {
      formato: ant.formato, versao: 2, w: ant.w || 1080, h: ant.h || 1920, duracao: Math.round(t * 10) / 10, data: ant.data, fonte: ant.fonte,
      fundo: sorteio(['grafite', 'branco', 'verde', 'nevoa'].filter(f => f !== ant.fundo)), cenas,
      musica: { estilo: lofi ? 'lofi' : 'pop', bpm: lofi ? sorteio([80, 84, 88]) : sorteio([104, 110, 116]), prog: ((ant.musica && ant.musica.prog) || 0) + 1 + Math.floor(Math.random() * 2), semente: Math.floor(Math.random() * 1e6) },
    };
  }
  async function fazer2(r) {
    if (U().semConexao()) return;
    const cfg = A().cfg(), n = r.noticia || { titulo: r.titulo }, f = cfg.funcionarios.find(x => x.funcao === 'video') || { id: 'enzo', nome: 'Enzo' };
    const video = montarVideo2(r.video, n, cfg);
    const salvo = { id: U().agoraId('video'), tipo: 'video', criadoEm: U().agoraIso(), funcionario: { id: f.id, nome: f.nome }, tarefa: `${r.video.formato === 'reels' ? 'Reels' : 'Stories'} 2.0 para o Instagram`,
      titulo: (n.titulo || r.titulo || 'Vídeo') + ' (2.0)', noticia: n, relatorioNoticias: r.relatorioNoticias, video, legenda: montarLegenda(n, cfg, video), duracao: 12, leuArtigo: r.leuArtigo, origem: r.id };
    A().falar(f.id, 'Bora fazer uma versão 2.0, totalmente diferente! 🎬✨', 3000);
    await A().BK().salvarRelatorio(salvo);
    await A().carregarRelatorios(KM.resumoRelatorio(salvo));
    A().toast('✨ Vídeo 2.0 pronto: mesmo tema, outro roteiro, outro visual e outra música.');
    A().abrirRelatorio(salvo.id);
  }
  function montarLegenda(n, cfg, spec) {
    const texto = `${n.titulo} ${(n.temas || []).join(' ')} ${n.categoria || ''}`;
    const tags = ['#contabilidade', '#kwikcontabilidade'];
    for (const [re, h] of HASHTAGS) if (re.test(texto) && !tags.includes(h)) tags.push(h);
    ['#empreendedorismo', '#impostos', '#pequenasempresas'].forEach(x => { if (tags.length < 7 && !tags.includes(x)) tags.push(x); });
    const g = semMarca(spec.cenas[0].texto);
    const corpo = spec.cenas.filter(c => c.tipo === 'ponto' || c.tipo === 'contagem').slice(0, 2).map(c => semMarca(c.texto)).join(' ');
    const whats = U().foneBonito(cfg.marketing.whats);
    return [
      `⚠️ ${g} ${n.titulo}`, '',
      corpo || 'Saiu uma novidade que pode mexer com a rotina da sua empresa.', '',
      '✅ O que fazer agora:', ...FAZER.map(x => '• ' + x), '',
      '📌 Cada empresa tem uma situação: confira a regra para o seu caso.', '',
      'Salve este post e envie para um amigo empresário 💬',
      whats ? `Dúvida? Fale com a KWIK 👉 WhatsApp ${whats}` : 'Dúvida? Fale com a KWIK 👉 chama no direct', '',
      `Fonte: ${NOME_FONTE[n.fonte] || 'Portal Contábeis'}`, '',
      tags.slice(0, 7).join(' '),
    ].join('\n');
  }

  // ------------------------------------------------------------------ desenho
  const logo = new Image(); logo.src = 'assets/kwik-simbolo.png';
  let fontesProntas = null;
  const prepararFontes = () => fontesProntas || (fontesProntas = Promise.all(['900 100px Montserrat', '800 40px Montserrat', '700 40px Montserrat', '600 30px Montserrat']
    .map(f => document.fonts.load(f).catch(() => null))).then(() => new Promise(r => (logo.complete ? r() : (logo.onload = logo.onerror = r)))));
  const temFiltro = (() => { try { return 'filter' in document.createElement('canvas').getContext('2d'); } catch (e) { return false; } })();
  const ease = k => 1 - Math.pow(1 - limitar(k, 0, 1), 3);
  const easeBack = k => { k = limitar(k, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  function retRed(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); } }
  const TEMA = {
    grafite: { fundo: GRAFITE, cor: '#ffffff', suave: '#a9b8b4', dest: VERDE, caixa: true, sobreCaixa: GRAFITE, cartao: '#1d2826', pill: VERDE, pillTxt: GRAFITE },
    branco: { fundo: '#ffffff', cor: GRAFITE, suave: '#4a5754', dest: VERDE, caixa: false, cartao: '#ffffff', pill: VERDE, pillTxt: GRAFITE },
    nevoa: { fundo: NEVOA, cor: GRAFITE, suave: '#4a5754', dest: VERDE, caixa: false, cartao: '#ffffff', pill: GRAFITE, pillTxt: VERDE },
    verde: { fundo: VERDE, cor: GRAFITE, suave: '#0f3d22', dest: '#ffffff', caixa: true, sobreCaixa: VERDE, cartao: '#e9fbef', pill: GRAFITE, pillTxt: VERDE },
  };
  const tema = nome => TEMA[nome] || (nome === 'aurora' || nome === 'pontos' || nome === 'sol' ? TEMA.branco : TEMA.nevoa);

  function fundo(g, nome, t, W, H) {
    const T = tema(nome);
    g.fillStyle = T.fundo; g.fillRect(0, 0, W, H);
    if (nome === 'grafite') {
      const gr = g.createRadialGradient(W * 0.85, H * 0.12, 10, W * 0.85, H * 0.12, H * 0.5);
      gr.addColorStop(0, 'rgba(40,190,82,0.30)'); gr.addColorStop(1, 'rgba(40,190,82,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = 40; y < H; y += 60) for (let x = 40; x < W; x += 60) g.fillRect(x, y, 3, 3);
      const alt = [0.06, 0.1, 0.08, 0.14, 0.2]; // barras subindo no canto (motivo dos posts)
      alt.forEach((a, i) => { const h = H * a * (0.9 + 0.1 * Math.sin(t * 1.2 + i)); g.fillStyle = i === alt.length - 1 ? 'rgba(40,190,82,0.55)' : 'rgba(40,190,82,0.22)'; g.fillRect(W - 360 + i * 66, H - h, 48, h); });
    } else if (nome === 'verde') {
      g.fillStyle = 'rgba(17,26,25,0.08)'; for (let k = 0; k < 6; k++) g.fillRect(-200 + k * 90 + ((t * 30) % 90), 0, 34, H * 0.18);
      g.fillStyle = 'rgba(255,255,255,0.12)'; const o = (t * 16) % 70; for (let y = -70 + o; y < H; y += 70) for (let x = -70 + o; x < W; x += 70) g.fillRect(x, y, 5, 5);
    } else {
      const o = (t * 14) % 54; g.fillStyle = 'rgba(40,190,82,0.18)';
      for (let y = -54 + o; y < H; y += 54) for (let x = -54 + o; x < W; x += 54) { g.beginPath(); g.arc(x, y, 3.5, 0, Math.PI * 2); g.fill(); }
      if (nome === 'nevoa' || nome === 'sol') { const gr = g.createRadialGradient(W * 0.2, H * 0.85, 10, W * 0.2, H * 0.85, W); gr.addColorStop(0, 'rgba(40,190,82,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    }
  }

  function quebrar(g, texto, larg) {
    const ps = []; let dest = false;
    for (const bruto of String(texto).split(/\s+/).filter(Boolean)) {
      const abre = bruto.startsWith('*'), fecha = bruto.replace(/[!?.,:;…]+$/, '').endsWith('*');
      if (abre) dest = true;
      ps.push({ txt: bruto.replace(/\*/g, ''), dest });
      if (fecha) dest = false;
    }
    const linhas = [[]]; let w = 0; const esp = g.measureText(' ').width;
    for (const p of ps) { p.w = g.measureText(p.txt).width; if (w + p.w > larg && linhas.at(-1).length) { linhas.push([]); w = 0; } linhas.at(-1).push(p); w += p.w + esp; }
    return linhas;
  }
  function palavrasAnimadas(g, o) {
    let tam = o.tam;
    g.font = `${o.peso} ${tam}px Montserrat`;
    let linhas = quebrar(g, o.texto, o.larg);
    while (linhas.length > (o.maxLinhas || 5) && tam > 36) { tam -= 6; g.font = `${o.peso} ${tam}px Montserrat`; linhas = quebrar(g, o.texto, o.larg); }
    const lh = tam * (o.lh || 1.14), esp = g.measureText(' ').width;
    let k = 0, y = o.y;
    g.textBaseline = 'alphabetic';
    for (const linha of linhas) {
      const total = linha.reduce((s, p) => s + p.w, 0) + esp * (linha.length - 1);
      let x = o.alinhar === 'centro' ? o.x - total / 2 : o.x;
      for (const p of linha) {
        const ti = o.t - (o.atraso || 0) - k * (o.passo || 0.07), e = ease(ti / 0.38);
        if (ti > 0) {
          g.save(); g.globalAlpha = Math.min(1, ti / 0.25);
          if (o.estilo === 'soco') { const s = 1 + (1 - easeBack(ti / 0.32)) * 0.6; g.translate(x + p.w / 2, y - tam / 3); g.scale(s, s); g.translate(-(x + p.w / 2), -(y - tam / 3)); }
          else g.translate(0, (1 - e) * 46);
          if (temFiltro && ti < 0.3) g.filter = `blur(${Math.round((1 - ti / 0.3) * 10)}px)`;
          if (p.dest && o.caixa) { g.fillStyle = o.corDest; g.fillRect(x - 10, y - tam * 0.84, p.w + 20 + (linha.indexOf(p) < linha.length - 1 && linha[linha.indexOf(p) + 1].dest ? esp : 0), tam * 1.04); g.fillStyle = o.sobreCaixa; }
          else g.fillStyle = p.dest ? o.corDest : o.cor;
          g.fillText(p.txt, x, y);
          g.restore();
        }
        x += p.w + esp; k++;
      }
      y += lh;
    }
    return { y, tam };
  }
  function etiqueta(g, txt, x, y, T, k) {
    g.save(); g.font = '800 32px Montserrat'; const tw = g.measureText(txt).width;
    g.translate(x, y); g.scale(k, k);
    g.fillStyle = T.pill; retRed(g, 0, -44, tw + 44, 60, 30); g.fill();
    g.fillStyle = T.pillTxt; g.textBaseline = 'alphabetic'; g.fillText(txt, 22, -3);
    g.fillStyle = T.pill; for (let i = 0; i < 3; i++) { const cx = tw + 70 + i * 26; g.beginPath(); g.moveTo(cx, -32); g.lineTo(cx + 14, -14); g.lineTo(cx, 4); g.lineTo(cx - 6, 4); g.lineTo(cx + 8, -14); g.lineTo(cx - 6, -32); g.closePath(); g.globalAlpha = 1 - i * 0.28; g.fill(); }
    g.restore();
  }

  function desenharQuadro(g, spec, t) {
    const W = spec.w, H = spec.h, vert = H / W > 1.5, T = tema(spec.fundo);
    const topo = vert ? 500 : 290, base = vert ? H - 300 : H - 70, mx = 80, larg = W - mx * 2;
    g.save();
    fundo(g, spec.fundo, t, W, H);
    const cena = spec.cenas.find(c => t >= c.ini && t < c.fim) || spec.cenas.at(-1);
    const tc = t - cena.ini;
    const yCab = vert ? 150 : 64;
    if (cena.tipo !== 'fim') {
      if (logo.complete && logo.naturalWidth) g.drawImage(logo, mx, yCab, 58, 58);
      g.fillStyle = T.cor; g.font = '900 40px Montserrat'; g.textBaseline = 'middle'; g.fillText('KWIK', mx + 72, yCab + 31);
      if (spec.data) { g.font = '700 24px Montserrat'; g.fillStyle = T.suave; g.textAlign = 'right'; g.fillText(spec.data, W - mx, yCab + 31); g.textAlign = 'left'; }
      g.textBaseline = 'alphabetic'; g.fillStyle = T.suave; g.font = '600 26px Montserrat'; g.fillText('Fonte: ' + spec.fonte, mx, base);
    }
    const txt = (o) => palavrasAnimadas(g, Object.assign({ x: mx, larg, cor: T.cor, corDest: T.dest, caixa: T.caixa, sobreCaixa: T.sobreCaixa, t: tc }, o));
    const rotulo = (s, y) => { g.fillStyle = T.dest === '#ffffff' ? GRAFITE : VERDE; g.font = '800 32px Montserrat'; g.globalAlpha = Math.min(1, tc / 0.3); g.fillText(s, mx, y); g.globalAlpha = 1; g.fillRect(mx, y + 20, 130 * ease(tc / 0.6), 9); };
    if (cena.tipo === 'gancho') {
      etiqueta(g, cena.tag, mx, topo + 40, T, easeBack(tc / 0.45));
      txt({ texto: cena.texto, y: topo + (vert ? 360 : 270), tam: vert ? 158 : 124, peso: 900, atraso: 0.25, passo: 0.12, estilo: 'soco', maxLinhas: 4, lh: 1.08 });
      g.fillStyle = T.dest === '#ffffff' ? GRAFITE : VERDE; g.fillRect(mx, base - 80, larg * ease((tc - 0.6) / 1.2), 14);
    } else if (cena.tipo === 'titulo') {
      rotulo(cena.rotulo, topo);
      txt({ texto: cena.texto, y: topo + 170, tam: vert ? 112 : 84, peso: 900, atraso: 0.3, passo: 0.06, maxLinhas: vert ? 9 : 7 });
    } else if (cena.tipo === 'ponto') {
      rotulo(cena.rotulo, topo);
      const e = easeBack(tc / 0.5);
      g.save(); g.translate(mx + 60, topo + 150); g.scale(e, e); g.fillStyle = T.dest === '#ffffff' ? GRAFITE : VERDE; g.beginPath(); g.arc(0, 0, 58, 0, Math.PI * 2); g.fill();
      g.fillStyle = T.dest === '#ffffff' ? VERDE : GRAFITE; g.font = '900 50px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(cena.n), 0, 3); g.restore();
      g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = T.suave; g.font = '700 28px Montserrat'; g.fillText(`${cena.n} de ${cena.total}`, mx + 140, topo + 162);
      txt({ texto: cena.texto, y: topo + 340, tam: vert ? 80 : 54, peso: 800, atraso: 0.35, passo: 0.05, maxLinhas: vert ? 10 : 7, lh: 1.22 });
    } else if (cena.tipo === 'pontos') { // vídeos antigos (4:5)
      rotulo(cena.rotulo, topo); let y = topo + 80;
      cena.itens.forEach((s, i) => {
        const ti = tc - 0.35 - i * 1.1, e = ease(ti / 0.5); g.font = '700 46px Montserrat';
        const ls = quebrar(g, s, larg - 150), alto = Math.max(150, ls.length * 60 + 70);
        if (ti > 0) {
          g.save(); g.globalAlpha = Math.min(1, ti / 0.3); g.translate((1 - e) * -120, 0); g.fillStyle = T.cartao; retRed(g, mx, y, larg, alto, 28); g.fill();
          g.fillStyle = VERDE; g.beginPath(); g.arc(mx + 70, y + 72, 40, 0, Math.PI * 2); g.fill(); g.fillStyle = GRAFITE; g.font = '900 42px Montserrat'; g.textAlign = 'center'; g.fillText(String(i + 1), mx + 70, y + 87); g.textAlign = 'left';
          g.fillStyle = T.cor === '#ffffff' && T.cartao !== '#ffffff' ? '#ffffff' : GRAFITE; g.font = '700 46px Montserrat'; ls.forEach((l, k) => g.fillText(l.map(p => p.txt).join(' '), mx + 140, y + 70 + k * 60)); g.restore();
        }
        y += alto + 34;
      });
    } else if (cena.tipo === 'lista') {
      rotulo(cena.rotulo, topo); let y = topo + (vert ? 130 : 110);
      cena.itens.forEach((s, i) => {
        const ti = tc - 0.4 - i * 0.9, e = ease(ti / 0.45);
        if (ti <= 0) return;
        g.save(); g.globalAlpha = Math.min(1, ti / 0.3); g.translate((1 - e) * -100, 0);
        g.fillStyle = T.cartao; retRed(g, mx, y, larg, vert ? 200 : 140, 26); g.fill();
        g.fillStyle = VERDE; retRed(g, mx + 30, y + (vert ? 65 : 35), 70, 70, 16); g.fill();
        g.strokeStyle = GRAFITE; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(mx + 48, y + (vert ? 100 : 70)); g.lineTo(mx + 62, y + (vert ? 115 : 85)); g.lineTo(mx + 86, y + (vert ? 85 : 55)); g.stroke();
        g.fillStyle = T.cartao === '#ffffff' || T.cartao === '#e9fbef' ? GRAFITE : '#ffffff'; g.font = `800 ${vert ? 54 : 40}px Montserrat`;
        quebrar(g, s, larg - 160).forEach((l, k, arr) => g.fillText(l.map(p => p.txt).join(' '), mx + 130, y + (vert ? 118 : 82) - (arr.length - 1) * 30 + k * 60));
        g.restore(); y += (vert ? 200 : 140) + 36;
      });
    } else if (cena.tipo === 'aviso') {
      g.font = '120px serif'; g.globalAlpha = Math.min(1, tc / 0.3); g.fillText('📌', mx, topo + 150); g.globalAlpha = 1;
      txt({ texto: cena.texto, y: topo + 340, tam: vert ? 84 : 58, peso: 800, atraso: 0.3, passo: 0.06, maxLinhas: 8 });
    } else if (cena.tipo === 'cta') {
      const r = txt({ texto: cena.texto, x: W / 2, y: H * 0.42, tam: vert ? 130 : 118, peso: 900, atraso: 0.1, passo: 0.14, alinhar: 'centro', estilo: 'soco', maxLinhas: 3 });
      g.globalAlpha = limitar((tc - 0.9) / 0.4, 0, 1); g.fillStyle = T.suave; g.font = '700 46px Montserrat'; g.textAlign = 'center'; g.fillText(cena.sub, W / 2, r.y + 30); g.globalAlpha = 1;
      if (cena.whats && tc > 1.4) {
        const e = easeBack((tc - 1.4) / 0.5), pulso = 1 + Math.sin(tc * 5) * 0.025 * (tc > 2 ? 1 : 0);
        g.save(); g.translate(W / 2, r.y + 190); g.scale(e * pulso, e * pulso);
        g.font = '800 52px Montserrat'; const tx = '💬 ' + cena.whats, tw = g.measureText(tx).width;
        g.fillStyle = T.dest === '#ffffff' ? GRAFITE : VERDE; retRed(g, -tw / 2 - 50, -62, tw + 100, 114, 57); g.fill();
        g.fillStyle = T.dest === '#ffffff' ? '#ffffff' : GRAFITE; g.fillText(tx, 0, 16); g.restore();
      }
      g.textAlign = 'left';
    } else if (cena.tipo === 'fim') {
      const e = ease(tc / 0.6), ls = 240 * (0.8 + 0.2 * e), cy = H * 0.36;
      g.globalAlpha = e;
      if (logo.complete && logo.naturalWidth) g.drawImage(logo, W / 2 - ls / 2, cy - ls / 2, ls, ls);
      g.fillStyle = T.cor; g.font = '900 140px Montserrat'; g.textAlign = 'center'; g.fillText('KWIK', W / 2, cy + 260);
      g.fillStyle = T.dest === '#ffffff' ? GRAFITE : VERDE; g.font = '800 44px Montserrat'; g.fillText('CONTABILIDADE INTELIGENTE', W / 2, cy + 330);
      g.globalAlpha = limitar((tc - 0.6) / 0.4, 0, 1); g.fillStyle = T.suave; g.font = '700 40px Montserrat';
      if (cena.whats) g.fillText('WhatsApp ' + cena.whats, W / 2, cy + 430);
      g.fillText('@kwik_contabilidade', W / 2, cy + 490);
      g.textAlign = 'left'; g.globalAlpha = 1;
    } else if (cena.tipo === 'pergunta') { // 2.0: pergunta gigante com o "?" pulsando no fundo
      g.save(); g.globalAlpha = 0.13; g.fillStyle = T.dest === '#ffffff' ? GRAFITE : VERDE; g.font = `900 ${vert ? 1100 : 700}px Montserrat`; g.textAlign = 'center';
      g.translate(W * 0.72, H * 0.62); g.rotate(Math.sin(tc * 1.4) * 0.08); const s0 = 0.9 + 0.1 * easeBack(tc / 0.6); g.scale(s0, s0); g.fillText('?', 0, 0); g.restore();
      txt({ texto: cena.texto, x: W / 2, y: H * (vert ? 0.4 : 0.38), tam: vert ? 132 : 104, peso: 900, atraso: 0.2, passo: 0.1, alinhar: 'centro', estilo: 'soco', maxLinhas: 5, lh: 1.1 });
    } else if (cena.tipo === 'resumo') { // 2.0: "em uma frase", com aspas grandes
      g.fillStyle = T.dest === '#ffffff' ? GRAFITE : VERDE; g.font = '900 300px Montserrat'; g.globalAlpha = Math.min(1, tc / 0.4); g.fillText('“', mx - 10, topo + 230); g.globalAlpha = 1;
      g.font = '800 34px Montserrat'; g.textAlign = 'center'; g.fillStyle = T.suave; g.fillText(cena.rotulo, W / 2, topo + 40); g.textAlign = 'left';
      txt({ texto: cena.texto, x: W / 2, y: topo + 330, tam: vert ? 100 : 78, peso: 900, atraso: 0.3, passo: 0.05, alinhar: 'centro', maxLinhas: vert ? 9 : 7 });
    } else if (cena.tipo === 'contagem') { // 2.0: número gigante no fundo + texto
      g.save(); g.fillStyle = T.dest === '#ffffff' ? GRAFITE : VERDE; g.globalAlpha = 0.14 * Math.min(1, tc / 0.3); g.font = `900 ${vert ? 900 : 620}px Montserrat`; g.textAlign = 'right';
      g.fillText(String(cena.n), W - 30 + (1 - ease(tc / 0.6)) * 200, vert ? H * 0.66 : H * 0.8); g.restore();
      g.fillStyle = T.dest === '#ffffff' ? GRAFITE : VERDE; retRed(g, mx, topo - 10, 270, 70, 35); g.fill();
      g.fillStyle = T.dest === '#ffffff' ? '#ffffff' : GRAFITE; g.font = '900 34px Montserrat'; g.fillText(`Nº ${cena.n} de ${cena.total}`, mx + 30, topo + 37);
      txt({ texto: cena.texto, y: topo + 230, tam: vert ? 84 : 58, peso: 800, atraso: 0.3, passo: 0.045, maxLinhas: vert ? 10 : 7, lh: 1.22, estilo: 'soco' });
    } else if (cena.texto) {
      txt({ texto: cena.texto, y: topo + 150, tam: 80, peso: 900 });
    }
    if (spec.versao === 2) { // 2.0: barra de progresso no topo e transição em círculo
      g.fillStyle = T.dest === '#ffffff' ? 'rgba(17,26,25,.2)' : 'rgba(40,190,82,.25)'; g.fillRect(0, 0, W, 14);
      g.fillStyle = T.dest === '#ffffff' ? GRAFITE : VERDE; g.fillRect(0, 0, W * Math.min(1, t / spec.duracao), 14);
      for (const c of spec.cenas.slice(1)) {
        const k = (t - (c.ini - 0.3)) / 0.6;
        if (k > 0 && k < 1) { const rr = Math.hypot(W, H) * (k < 0.5 ? ease(k * 2) : 1 - ease((k - 0.5) * 2)); g.fillStyle = spec.fundo === 'verde' ? GRAFITE : VERDE; g.beginPath(); g.arc(W / 2, H / 2, rr * 0.6, 0, Math.PI * 2); g.fill(); }
      }
    } else for (const c of spec.cenas.slice(1)) { // transição: faixa verde varrendo a tela
      const k = (t - (c.ini - 0.28)) / 0.56;
      if (k > 0 && k < 1) { const x = -W + 2 * W * ease(k); g.fillStyle = spec.fundo === 'verde' ? GRAFITE : VERDE; g.fillRect(x, 0, W, H); g.fillStyle = spec.fundo === 'verde' ? VERDE : GRAFITE; g.fillRect(x + W - 26, 0, 26, H); }
    }
    g.restore();
  }

  // ------------------------------------------------------------------ música (sintetizada, vai junto no vídeo)
  let ruidoBuf = null;
  // narr = falas do narrador ([{ ini, buf }]): com narrador, a música fica mais baixa (por baixo da voz)
  function trilha(ac, destino, spec, desde = 0, narr = null) {
    const m = spec.musica || { bpm: 104, prog: 0 }, beat = 60 / m.bpm, total = spec.duracao, lofi = m.estilo === 'lofi';
    const t0 = ac.currentTime + 0.08 - desde;
    if (!ruidoBuf || ruidoBuf.sampleRate !== ac.sampleRate) { ruidoBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = ruidoBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const comVoz = !!(narr && narr.length), volMus = comVoz ? 0.24 : 0.55;
    const mestre = ac.createGain(); mestre.connect(destino);
    mestre.gain.setValueAtTime(0.0001, ac.currentTime); mestre.gain.exponentialRampToValueAtTime(volMus, ac.currentTime + 0.5);
    const fimT = t0 + total; mestre.gain.setValueAtTime(volMus, Math.max(ac.currentTime + 0.6, fimT - 1.5)); mestre.gain.linearRampToValueAtTime(0.0001, Math.max(ac.currentTime + 0.7, fimT));
    const sfxG = ac.createGain(); sfxG.gain.value = comVoz ? 0.5 : 0.7; sfxG.connect(destino);
    const vozG = ac.createGain(); vozG.gain.value = 1.15; vozG.connect(destino);
    efeitos(ac, sfxG, spec, t0);
    if (comVoz) for (const f of narr) {
      if (!f || !f.buf) continue;
      const ini = t0 + f.ini; if (ini + f.buf.duration < ac.currentTime) continue;
      const s = ac.createBufferSource(); s.buffer = f.buf; s.connect(vozG);
      if (ini >= ac.currentTime) s.start(ini); else s.start(ac.currentTime, ac.currentTime - ini);
    }
    const pararExtra = () => { for (const x of [sfxG, vozG]) { try { x.gain.cancelScheduledValues(ac.currentTime); x.gain.setValueAtTime(0.0001, ac.currentTime); x.disconnect(); } catch (e) { /* já parou */ } } };
    const hz = n => 440 * Math.pow(2, (n - 69) / 12);
    const nota = (freq, ini, dur, tipo, vol, freqFim) => {
      if (ini + dur < ac.currentTime) return;
      const o = ac.createOscillator(), g = ac.createGain(); o.type = tipo; o.frequency.setValueAtTime(freq, ini); if (freqFim) o.frequency.exponentialRampToValueAtTime(freqFim, ini + dur);
      g.gain.setValueAtTime(0.0001, ini); g.gain.exponentialRampToValueAtTime(vol, ini + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
      o.connect(g).connect(mestre); o.start(Math.max(ini, ac.currentTime)); o.stop(ini + dur + 0.05);
    };
    const ruido = (ini, dur, vol, tipoF, f1, f2) => {
      if (ini + dur < ac.currentTime) return;
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = ruidoBuf; f.type = tipoF; f.frequency.setValueAtTime(f1, ini); if (f2) f.frequency.exponentialRampToValueAtTime(f2, ini + dur);
      g.gain.setValueAtTime(vol, ini); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur); s.connect(f).connect(g).connect(mestre); s.start(Math.max(ini, ac.currentTime), 0, dur + 0.05);
    };
    const prog = PROGS[m.prog % PROGS.length];
    let sem = (m.semente || 1) >>> 0; const r = () => ((sem = (sem * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let k = Math.max(0, Math.floor(desde / beat)); k * beat < total; k++) {
      const tt = t0 + k * beat; if (tt < ac.currentTime - 0.01) continue;
      const [raiz, tipo] = prog[Math.floor(k / 4) % 4], terca = tipo === 'm' ? 3 : 4;
      const intro = k < 4;
      if (lofi) { // 2.0 lo-fi: batida macia, piano/pad e baixo redondo
        if (k % 2 === 0) nota(110, tt, 0.25, 'sine', intro ? 0.2 : 0.42, 45);
        if (!intro && k % 4 === 2) ruido(tt, 0.12, 0.09, 'bandpass', 1400);
        if (!intro) ruido(tt + beat / 2, 0.03, 0.035, 'highpass', 6000);
        nota(hz(raiz - 12), tt, beat * 0.9, 'sine', 0.26);
        if (k % 4 === 0) [0, terca, 7, 10].forEach((iv, j) => nota(hz(raiz + iv + 12), tt + j * 0.03, beat * 3.6, 'sine', 0.05));
        if (!intro && r() < 0.45) nota(hz(raiz + 24 + sorteioDe([0, terca, 7, 10], r)), tt + beat / 2, 0.5, 'triangle', 0.03);
        continue;
      }
      nota(150, tt, 0.22, 'sine', intro ? 0.25 : 0.6, 42); // bumbo
      if (!intro) ruido(tt + beat / 2, 0.05, 0.07, 'highpass', 7000); // chimbal
      if (k % 4 === 2 && !intro) ruido(tt, 0.14, 0.2, 'bandpass', 1800); // palma
      nota(hz(raiz - 12), tt, beat * 0.8, 'triangle', 0.22); // baixo
      if (k % 4 === 0) [0, terca, 7].forEach(iv => nota(hz(raiz + iv + 12), tt, beat * 3.8, 'triangle', 0.035)); // acorde
      if (!intro && k % 2 === 1 && r() < 0.7) nota(hz(raiz + 12 + sorteioDe([0, terca, 7, 12, 14], r)), tt + beat / 2, 0.18, 'square', 0.025);
    }
    return { parar() { pararExtra(); try { mestre.gain.cancelScheduledValues(ac.currentTime); mestre.gain.setValueAtTime(0.0001, ac.currentTime); mestre.disconnect(); } catch (e) { /* já parou */ } } };
  }
  const sorteioDe = (arr, r) => arr[Math.floor(r() * arr.length)];

  // ------------------------------------------------------------------ efeitos sonoros (no ritmo das cenas)
  function efeitos(ac, saida, spec, t0) {
    const agora = ac.currentTime;
    const tom = (f, ini, dur, tipo, vol, f2) => { if (ini + dur < agora) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = tipo; o.frequency.setValueAtTime(f, ini); if (f2) o.frequency.exponentialRampToValueAtTime(f2, ini + dur); g.gain.setValueAtTime(0.0001, ini); g.gain.exponentialRampToValueAtTime(vol, ini + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur); o.connect(g).connect(saida); o.start(Math.max(ini, agora)); o.stop(ini + dur + 0.05); };
    const chiado = (ini, dur, vol, tipo, f1, f2, sobe) => { if (ini + dur < agora) return; const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = ruidoBuf; f.type = tipo; f.frequency.setValueAtTime(f1, ini); if (f2) f.frequency.exponentialRampToValueAtTime(f2, ini + dur); if (sobe) { g.gain.setValueAtTime(0.0001, ini); g.gain.exponentialRampToValueAtTime(vol, ini + dur * 0.9); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur); } else { g.gain.setValueAtTime(vol, ini); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur); } s.connect(f).connect(g).connect(saida); s.start(Math.max(ini, agora), 0, dur + 0.05); };
    spec.cenas.forEach((c, i) => {
      const a = t0 + c.ini;
      if (i > 0) chiado(a - 0.32, 0.56, 0.22, 'bandpass', 400, 5200); // whoosh da transição
      if (c.tipo === 'gancho' || c.tipo === 'pergunta') { tom(130, a + 0.25, 0.6, 'sine', 0.9, 38); chiado(a + 0.25, 0.35, 0.3, 'lowpass', 900); } // impacto
      else if (c.tipo === 'titulo' || c.tipo === 'resumo') { chiado(a + 0.05, 0.5, 0.12, 'bandpass', 2400, 600); tom(660, a + 0.3, 0.12, 'triangle', 0.15, 990); } // "zip" do texto
      else if (c.tipo === 'ponto' || c.tipo === 'contagem') { tom(880, a + 0.15, 0.1, 'sine', 0.4, 520); tom(1320, a + 0.24, 0.08, 'sine', 0.18); } // pop do número
      else if (c.tipo === 'lista') c.itens.forEach((_, j) => { const d = a + 0.4 + j * 0.9; tom(1318, d, 0.35, 'sine', 0.2); tom(1976, d + 0.02, 0.3, 'sine', 0.1); }); // ding de cada item
      else if (c.tipo === 'cta') { tom(1568, a + 1.4, 0.18, 'sine', 0.25); tom(2093, a + 1.53, 0.3, 'sine', 0.25); } // plim do WhatsApp
      else if (c.tipo === 'fim') [523, 659, 784, 1047].forEach((f, j) => tom(f, a + j * 0.05, 1.4, 'triangle', 0.07)); // assinatura da marca
      else if (c.tipo === 'aviso') tom(440, a + 0.2, 0.25, 'square', 0.05, 880);
    });
    // subida antes do encerramento
    const cta = spec.cenas.find(c => c.tipo === 'cta'); if (cta) chiado(t0 + cta.ini - 1.1, 1.1, 0.14, 'bandpass', 300, 4000, true);
  }

  // ------------------------------------------------------------------ narrador
  // Voz neural em português do Brasil que roda dentro do navegador (Piper/VITS, @diffusionstudio/vits-web): na primeira vez
  // baixa a voz (~60 MB) e guarda no aparelho; depois funciona sem internet. Vai junto no vídeo baixado.
  // Se o aparelho não conseguir (sem suporte), a prévia usa a voz do próprio navegador (essa não entra no arquivo).
  const URL_TTS = 'https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm';
  let ttsMod = null, vozId = null;
  const cacheVoz = new Map();
  const paraFala = s => semMarca(s).replace(/KWIK/g, 'Kuík').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s*>>>\s*/g, ' ').replace(/\s+/g, ' ').trim();
  function roteiroFala(spec) {
    return spec.cenas.map(c => {
      if (c.tipo === 'lista') return paraFala(`${c.rotulo.charAt(0) + c.rotulo.slice(1).toLowerCase()}: ${c.itens.join('. ')}.`);
      if (c.tipo === 'cta') return paraFala(`${c.texto} ${c.sub || ''}${c.whats ? ' Chama no WhatsApp.' : ''}`);
      if (c.tipo === 'fim') return 'Kuík Contabilidade. Até a próxima!';
      if (c.tipo === 'contagem') return paraFala(`Número ${c.n}. ${c.texto}`);
      return c.texto ? paraFala(c.texto) : '';
    });
  }
  async function vozNeural(textos, aviso) {
    if (!ttsMod) ttsMod = await import(URL_TTS);
    if (!vozId) {
      let vs = null; try { vs = await ttsMod.voices(); } catch (e) { /* lista indisponível */ }
      const chaves = !vs ? [] : Array.isArray(vs) ? vs.map(v => (typeof v === 'string' ? v : v.key || v.id || '')) : Object.keys(vs);
      vozId = chaves.find(k => /^pt_BR-faber/.test(k)) || chaves.find(k => /^pt_BR/.test(k)) || 'pt_BR-faber-medium';
    }
    const dec = new OfflineAudioContext(1, 48000, 48000), out = [];
    for (let i = 0; i < textos.length; i++) {
      const tx = textos[i]; if (!tx) { out.push(null); continue; }
      const k = vozId + '|' + tx;
      if (!cacheVoz.has(k)) {
        const wav = await ttsMod.predict({ text: tx, voiceId: vozId }, p => { if (p && p.total) aviso && aviso(`Baixando a voz do narrador (só na 1ª vez)… ${Math.round(p.loaded * 100 / p.total)}%`); });
        cacheVoz.set(k, await dec.decodeAudioData(await wav.arrayBuffer()));
      }
      out.push(cacheVoz.get(k));
      aviso && aviso(`Gravando a narração… ${i + 1} de ${textos.length}`);
    }
    return out;
  }
  // devolve o vídeo com o tempo de cada cena ajustado à fala + a lista de falas
  async function narrar(spec, aviso) {
    const bufs = await vozNeural(roteiroFala(spec), aviso);
    const novo = JSON.parse(JSON.stringify(spec)), narr = [];
    let t = 0;
    novo.cenas.forEach((c, i) => {
      const d = c.fim - c.ini, b = bufs[i], atraso = c.tipo === 'gancho' || c.tipo === 'pergunta' ? 0.45 : 0.3;
      const nd = b ? Math.max(d, b.duration + atraso + 0.55) : d;
      c.ini = Math.round(t * 100) / 100; t += nd; c.fim = Math.round(t * 100) / 100;
      if (b) narr.push({ ini: c.ini + atraso, buf: b });
    });
    novo.duracao = Math.round(t * 10) / 10;
    return { spec: novo, narr };
  }
  // reserva: voz do navegador falando a cena atual (só na prévia)
  function vozNavegador() {
    if (!window.speechSynthesis) return null;
    const v = speechSynthesis.getVoices().find(x => /pt-BR/i.test(x.lang)) || speechSynthesis.getVoices().find(x => /^pt/i.test(x.lang));
    return { falar(tx) { try { speechSynthesis.cancel(); if (!tx) return; const u = new SpeechSynthesisUtterance(tx); u.lang = 'pt-BR'; if (v) u.voice = v; u.rate = 1.05; speechSynthesis.speak(u); } catch (e) { /* sem voz */ } }, parar() { try { speechSynthesis.cancel(); } catch (e) { /* ok */ } } };
  }

  // Gravação do vídeo. Antes era em "tempo real" (desenhando e gravando a tela ao mesmo tempo), e o vídeo saía travando
  // quando o computador ou o escritório pesavam. Agora, quando o navegador tem WebCodecs (Chrome/Edge e Safari novos),
  // cada quadro é desenhado e codificado um por um (30 por segundo, sem pular nenhum) e a música é gerada à parte
  // (OfflineAudioContext), depois tudo vai para um MP4 (mp4-muxer). Fica liso e ainda grava mais rápido que o tempo real.
  // Sem WebCodecs, volta para a gravação em tempo real, mas com o escritório pausado e quadros no ritmo certo.
  const URL_MUX = 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/build/mp4-muxer.mjs';
  async function gravarVideo(spec, aoProgresso, desenhar = desenharQuadro, narr = null) {
    await prepararFontes();
    KM.pausarCena = true; // o escritório para de desenhar enquanto grava (sobra processador para o vídeo)
    try {
      if (window.VideoEncoder && window.AudioEncoder && window.VideoFrame && window.OfflineAudioContext) {
        try { return await gravarQuadroAQuadro(spec, aoProgresso, desenhar, narr); } catch (e) { console.warn('KWIK vídeo: WebCodecs falhou, gravando em tempo real', e); }
      }
      return await gravarTempoReal(spec, aoProgresso, desenhar, narr);
    } finally { KM.pausarCena = false; }
  }
  async function gravarQuadroAQuadro(spec, aoProgresso, desenhar, narr) {
    const M = await import(URL_MUX);
    const fps = 30, w = spec.w, h = spec.h, n = Math.ceil(spec.duracao * fps), sr = 48000;
    // vídeo: H.264 (o formato que o Instagram e o WhatsApp aceitam sem converter)
    let vcfg = null;
    for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.640033']) {
      const c = { codec, width: w, height: h, bitrate: 8e6, framerate: fps, avc: { format: 'avc' } };
      try { if ((await VideoEncoder.isConfigSupported(c)).supported) { vcfg = c; break; } } catch (e) { /* tenta o próximo */ }
    }
    if (!vcfg) throw new Error('sem H.264 no WebCodecs');
    let acfg = null, acodec = null;
    for (const [codec, nome, br] of [['mp4a.40.2', 'aac', 160000], ['opus', 'opus', 128000]]) {
      const c = { codec, sampleRate: sr, numberOfChannels: 2, bitrate: br };
      try { if ((await AudioEncoder.isConfigSupported(c)).supported) { acfg = c; acodec = nome; break; } } catch (e) { /* tenta o próximo */ }
    }
    if (!acfg) throw new Error('sem codificador de áudio');
    // sem AAC o som iria em Opus, que muitos celulares e o Instagram não tocam (vídeo mudo): grava em tempo real com AAC
    if (acodec !== 'aac' && window.MediaRecorder && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) throw new Error('sem AAC no WebCodecs');
    // música inteira gerada fora do tempo real
    const oac = new OfflineAudioContext(2, Math.ceil((spec.duracao + 0.3) * sr), sr);
    trilha(oac, oac.destination, spec, 0, narr);
    const som = await oac.startRendering();
    const muxer = new M.Muxer({ target: new M.ArrayBufferTarget(), video: { codec: 'avc', width: w, height: h, frameRate: fps }, audio: { codec: acodec, sampleRate: sr, numberOfChannels: 2 }, fastStart: 'in-memory', firstTimestampBehavior: 'offset' });
    let erro = null;
    const venc = new VideoEncoder({ output: (ch, meta) => muxer.addVideoChunk(ch, meta), error: e => { erro = e; } });
    venc.configure(vcfg);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    const folga = () => new Promise(r => setTimeout(r, 0));
    for (let i = 0; i < n; i++) {
      if (erro) throw erro;
      desenhar(g, spec, Math.min(i / fps, spec.duracao - 0.01));
      const fr = new VideoFrame(c, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
      venc.encode(fr, { keyFrame: i % (fps * 2) === 0 }); fr.close();
      while (venc.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 4));
      if (i % 8 === 0) { aoProgresso && aoProgresso(0.92 * i / n); await folga(); }
    }
    await venc.flush(); venc.close();
    if (erro) throw erro;
    const aenc = new AudioEncoder({ output: (ch, meta) => muxer.addAudioChunk(ch, meta), error: e => { erro = e; } });
    aenc.configure(acfg);
    const total = Math.min(som.length, Math.ceil(spec.duracao * sr)), L0 = som.getChannelData(0), L1 = som.getChannelData(1), BL = 4800;
    for (let off = 0; off < total; off += BL) {
      const nf = Math.min(BL, total - off), data = new Float32Array(nf * 2);
      data.set(L0.subarray(off, off + nf), 0); data.set(L1.subarray(off, off + nf), nf);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: nf, numberOfChannels: 2, timestamp: Math.round(off * 1e6 / sr), data });
      aenc.encode(ad); ad.close();
    }
    await aenc.flush(); aenc.close();
    if (erro) throw erro;
    muxer.finalize();
    aoProgresso && aoProgresso(1);
    return new Blob([muxer.target.buffer], { type: 'video/mp4' });
  }
  async function gravarTempoReal(spec, aoProgresso, desenhar, narr) {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) throw new Error('este navegador não grava vídeo. Tente pelo Chrome no computador.');
    const c = document.createElement('canvas'); c.width = spec.w; c.height = spec.h;
    c.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;height:12px;opacity:0;pointer-events:none';
    document.body.append(c);
    const g = c.getContext('2d');
    desenhar(g, spec, 0);
    // captureStream(0): o quadro só vai para o vídeo quando pedimos (requestFrame), sempre depois de desenhar inteiro
    let video = c.captureStream(0), trilhaV = video.getVideoTracks()[0];
    if (typeof trilhaV.requestFrame !== 'function') { trilhaV.stop(); video = c.captureStream(30); trilhaV = video.getVideoTracks()[0]; }
    let ac = null, musica = null, faixas = [trilhaV];
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)(); await ac.resume();
      const dest = ac.createMediaStreamDestination(); musica = trilha(ac, dest, spec, 0, narr); faixas = faixas.concat(dest.stream.getAudioTracks());
    } catch (e) { /* sem som */ }
    const stream = new MediaStream(faixas);
    const tipos = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mime = tipos.find(t => MediaRecorder.isTypeSupported(t)) || '';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8e6 } : {});
    const partes = []; rec.ondataavailable = e => { if (e.data && e.data.size) partes.push(e.data); };
    const parou = new Promise(res => { rec.onstop = res; });
    rec.start(1000);
    // relógio da música manda no vídeo: cada quadro mostra exatamente o instante em que a música está
    const t0 = ac ? ac.currentTime + 0.08 : performance.now() / 1000, agora = () => (ac ? ac.currentTime : performance.now() / 1000) - t0;
    await new Promise(res => {
      let ultimo = -1;
      const passo = () => {
        const t = agora();
        const q = Math.floor(Math.max(0, t) * 30);
        if (q !== ultimo) { ultimo = q; desenhar(g, spec, Math.min(q / 30, spec.duracao - 0.01)); if (trilhaV.requestFrame) trilhaV.requestFrame(); aoProgresso && aoProgresso(Math.min(1, t / spec.duracao)); }
        if (t < spec.duracao + 0.2) setTimeout(passo, 8); else res();
      };
      passo();
    });
    rec.stop(); await parou;
    stream.getTracks().forEach(tr => tr.stop()); musica && musica.parar(); ac && ac.close(); c.remove();
    return new Blob(partes, { type: (rec.mimeType || mime || 'video/webm').split(';')[0] });
  }

  // ------------------------------------------------------------------ POST (imagem)
  const TEMAS_POST = [
    [/abrir (uma |a |sua )?empresa|abertura|cnpj|come[cç]ar (um|o) neg/i, { tag: 'ABERTURA DE EMPRESA', titulo: 'Vai *abrir empresa*?', sub: 'A KWIK te ajuda do CNPJ às primeiras guias, sem complicação.', icone: 'predio' }],
    [/\bmei\b/i, { tag: 'MEI', titulo: 'É *MEI* e quer crescer?', sub: 'A KWIK organiza a sua contabilidade para você focar no negócio.', icone: 'grafico' }],
    [/bpo|financeir|fluxo de caixa|contas a pagar|concilia/i, { tag: 'BPO FINANCEIRO', titulo: 'Seu *financeiro* no controle', sub: 'Contas, conciliação e relatórios em dia com a KWIK.', icone: 'calculadora' }],
    [/reforma/i, { tag: 'REFORMA TRIBUTÁRIA', titulo: 'Sua empresa está pronta para a *Reforma*?', sub: 'A KWIK explica o que muda e prepara o seu negócio.', icone: 'grafico' }],
    [/imposto|tribut|pagar menos|planejamento/i, { tag: 'PLANEJAMENTO TRIBUTÁRIO', titulo: 'Pagando *imposto demais*?', sub: 'Um planejamento tributário pode mudar o jogo da sua empresa.', icone: 'documento' }],
    [/folha|funcion[áa]rio|departamento pessoal|sal[áa]rio|\bdp\b/i, { tag: 'DEPARTAMENTO PESSOAL', titulo: 'Folha de pagamento *sem dor de cabeça*', sub: 'Salários, encargos e prazos em dia com a KWIK.', icone: 'documento' }],
    [/cl[íi]nica|consult[óo]rio|sa[úu]de|m[ée]dic|dentist|odonto/i, { tag: 'CONTABILIDADE PARA SAÚDE', titulo: 'Contabilidade para *clínicas*', sub: 'Impostos, folha e parte fiscal da sua clínica em dia.', icone: 'coracao' }],
    [/consultoria|crescer|lucro|gest[ãa]o|controle/i, { tag: 'CONSULTORIA', titulo: 'Sua empresa *no controle*', sub: 'Contabilidade, BPO e consultoria, sem dor de cabeça.', icone: 'grafico' }],
  ];
  const ICONES = [[/gr[áa]fico|cresc|subindo/i, 'grafico'], [/pr[ée]dio|escrit[óo]rio|loja/i, 'predio'], [/celular|whats|telefone|mensagem/i, 'celular'], [/calculadora|conta|n[úu]mero/i, 'calculadora'],
    [/documento|papel|guia|nota|contrato/i, 'documento'], [/cora[çc][ãa]o|cuidado|sa[úu]de/i, 'coracao'], [/foguete|decolar|r[áa]pido|acelerar/i, 'foguete']];
  function marcarFrase(f) {
    if (/\*/.test(f)) return f;
    const m = acharDestaque(f); if (m) return marcar(f);
    const ws = f.split(/\s+/); let i = 0; ws.forEach((w, k) => { if (w.replace(/[^\wÀ-ú]/g, '').length > ws[i].replace(/[^\wÀ-ú]/g, '').length) i = k; });
    ws[i] = '*' + ws[i].replace(/([!?.,:;]+)$/, '*$1'); if (!ws[i].includes('*', 1)) ws[i] += '*'; return ws.join(' ');
  }
  function montarPost(desc, frase, cfg) {
    const base = (TEMAS_POST.find(([re]) => re.test(desc + ' ' + frase)) || [null, { tag: 'KWIK CONTABILIDADE', titulo: 'Sua empresa *no controle*, sem dor de cabeça', sub: 'Contabilidade, BPO e consultoria para o seu negócio.', icone: 'grafico' }])[1];
    const estilo = /escur|preto|grafite|dark|noite/i.test(desc) ? 'grafite' : /verde/i.test(desc) ? 'verde' : /branc|clar|leve/i.test(desc) ? 'branco' : sorteio(['grafite', 'branco', 'verde'].filter(x => x !== cfg.marketing.ultimoPost));
    const icone = (ICONES.find(([re]) => re.test(desc)) || [null, base.icone])[1];
    return { tipo: 'post', w: 1080, h: 1350, fundo: estilo, tag: base.tag, titulo: frase ? marcarFrase(frase.trim()) : base.titulo, sub: base.sub, icone, whats: U().foneBonito(cfg.marketing.whats) };
  }
  function icone(g, nome, x, y, s, T) {
    const v = VERDE, e = T.cor === '#ffffff' ? '#ffffff' : GRAFITE, cl = T.fundo === VERDE ? '#ffffff' : VERDE;
    g.save(); g.translate(x, y); g.scale(s / 300, s / 300); g.lineJoin = 'round'; g.lineCap = 'round';
    if (nome === 'grafico') {
      [[0, 120, 0.35], [70, 90, 0.55], [140, 60, 0.75], [210, 20, 1]].forEach(([bx, by, a], i) => { g.fillStyle = i === 3 ? cl : e; g.globalAlpha = i === 3 ? 1 : a; g.fillRect(bx + 10, by + 120, 52, 300 - by - 130); });
      g.globalAlpha = 1; g.strokeStyle = cl; g.lineWidth = 18; g.beginPath(); g.moveTo(10, 200); g.lineTo(100, 140); g.lineTo(160, 160); g.lineTo(270, 40); g.stroke();
      g.fillStyle = cl; g.beginPath(); g.moveTo(290, 20); g.lineTo(225, 35); g.lineTo(275, 85); g.closePath(); g.fill();
    } else if (nome === 'predio') {
      g.fillStyle = e; g.fillRect(50, 30, 200, 260); g.fillStyle = T.fundo; for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) g.fillRect(75 + c * 58, 55 + r * 42, 36, 26);
      g.fillStyle = cl; g.fillRect(125, 230, 50, 60); g.fillRect(30, 285, 240, 12);
    } else if (nome === 'calculadora') {
      g.fillStyle = e; retRed(g, 60, 10, 180, 280, 26); g.fill(); g.fillStyle = cl; retRed(g, 85, 35, 130, 60, 10); g.fill();
      g.fillStyle = T.fundo; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { retRed(g, 85 + c * 46, 115 + r * 42, 36, 30, 8); g.fill(); }
    } else if (nome === 'documento') {
      g.fillStyle = e; retRed(g, 50, 10, 180, 240, 18); g.fill(); g.fillStyle = T.fundo; for (let k = 0; k < 5; k++) g.fillRect(80, 50 + k * 34, k === 4 ? 70 : 120, 12);
      g.fillStyle = cl; g.beginPath(); g.arc(220, 230, 62, 0, Math.PI * 2); g.fill(); g.strokeStyle = T.fundo === VERDE ? VERDE : GRAFITE; g.lineWidth = 18; g.beginPath(); g.moveTo(190, 232); g.lineTo(212, 254); g.lineTo(250, 210); g.stroke();
    } else if (nome === 'celular') {
      g.fillStyle = e; retRed(g, 80, 0, 150, 290, 28); g.fill(); g.fillStyle = T.fundo; retRed(g, 95, 30, 120, 220, 10); g.fill();
      g.fillStyle = cl; retRed(g, 105, 50, 80, 34, 12); g.fill(); g.fillStyle = e; g.globalAlpha = 0.6; retRed(g, 125, 100, 80, 34, 12); g.fill(); g.globalAlpha = 1; g.fillStyle = cl; retRed(g, 105, 150, 90, 34, 12); g.fill();
    } else if (nome === 'coracao') {
      g.fillStyle = cl; g.beginPath(); g.moveTo(150, 270); g.bezierCurveTo(-20, 160, 30, 20, 150, 90); g.bezierCurveTo(270, 20, 320, 160, 150, 270); g.fill();
      g.strokeStyle = T.fundo === VERDE ? GRAFITE : '#ffffff'; g.lineWidth = 14; g.beginPath(); g.moveTo(60, 150); g.lineTo(115, 150); g.lineTo(135, 110); g.lineTo(160, 190); g.lineTo(180, 150); g.lineTo(240, 150); g.stroke();
    } else if (nome === 'foguete') {
      g.fillStyle = e; g.beginPath(); g.moveTo(150, 10); g.bezierCurveTo(230, 70, 220, 190, 190, 230); g.lineTo(110, 230); g.bezierCurveTo(80, 190, 70, 70, 150, 10); g.fill();
      g.fillStyle = cl; g.beginPath(); g.arc(150, 110, 30, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(110, 230); g.lineTo(150, 300); g.lineTo(190, 230); g.fill();
      g.fillStyle = e; g.beginPath(); g.moveTo(100, 170); g.lineTo(55, 240); g.lineTo(110, 225); g.fill(); g.beginPath(); g.moveTo(200, 170); g.lineTo(245, 240); g.lineTo(190, 225); g.fill();
    }
    g.restore();
  }
  function desenharPost(g, spec) {
    const W = spec.w, H = spec.h, T = tema(spec.fundo), mx = 80, larg = W - mx * 2;
    g.save(); g.setTransform(g.getTransform ? g.getTransform() : new DOMMatrix());
    fundo(g, spec.fundo, 0, W, H);
    if (logo.complete && logo.naturalWidth) g.drawImage(logo, mx, 70, 62, 62);
    g.fillStyle = T.cor; g.font = '900 42px Montserrat'; g.textBaseline = 'middle'; g.fillText('KWIK', mx + 76, 103); g.textBaseline = 'alphabetic';
    etiqueta(g, spec.tag, mx, 250, T, 1);
    const r = palavrasAnimadas(g, { texto: spec.titulo, x: mx, y: 400, larg: larg - 40, tam: 112, peso: 900, t: 99, cor: T.cor, corDest: T.dest, caixa: T.caixa, sobreCaixa: T.sobreCaixa, maxLinhas: 4, lh: 1.1 });
    g.fillStyle = T.suave; g.font = '700 44px Montserrat';
    quebrar(g, spec.sub, larg * 0.62).forEach((l, k) => g.fillText(l.map(p => p.txt).join(' '), mx, r.y + 20 + k * 58));
    icone(g, spec.icone, W - 400, H - 620, 330, T);
    g.font = '800 44px Montserrat'; const tx = '💬 Chama a KWIK' + (spec.whats ? ' · ' + spec.whats : ''), tw = g.measureText(tx).width;
    g.fillStyle = T.dest === '#ffffff' ? GRAFITE : VERDE; retRed(g, mx, H - 230, tw + 80, 100, 50); g.fill();
    g.fillStyle = T.dest === '#ffffff' ? '#ffffff' : GRAFITE; g.fillText(tx, mx + 40, H - 165);
    g.fillStyle = T.suave; g.font = '700 30px Montserrat'; g.fillText('@kwik_contabilidade', mx, H - 70);
    g.fillStyle = T.dest === '#ffffff' ? GRAFITE : VERDE; for (let i = 0; i < 3; i++) { const cx = W - 220 + i * 40; g.globalAlpha = 1 - i * 0.25; g.beginPath(); g.moveTo(cx, H - 100); g.lineTo(cx + 22, H - 78); g.lineTo(cx, H - 56); g.lineTo(cx - 10, H - 56); g.lineTo(cx + 12, H - 78); g.lineTo(cx - 10, H - 100); g.closePath(); g.fill(); }
    g.restore();
  }
  function legendaPost(spec, desc, cfg) {
    const whats = U().foneBonito(cfg.marketing.whats);
    const tags = ['#contabilidade', '#kwikcontabilidade', '#empreendedorismo', '#bpofinanceiro', '#consultoriafinanceira'];
    if (/mei/i.test(spec.tag)) tags.splice(2, 0, '#mei');
    if (/sa[úu]de/i.test(spec.tag)) tags.splice(2, 0, '#clinicas');
    return [semMarca(spec.titulo), '', spec.sub, '', '✅ Contabilidade, BPO e consultoria', '✅ Atendimento próximo e sem complicação', '',
      whats ? `Fale com a KWIK 👉 WhatsApp ${whats}` : 'Fale com a KWIK 👉 chama no direct', '', tags.slice(0, 6).join(' ')].join('\n');
  }

  // ------------------------------------------------------------------ trabalhar
  async function trabalharVideo(f, p) {
    if (p.trabalhando || U().semConexao()) return;
    const eu = U().primeiro(f.id);
    const formato = await A().escolher(`🎬 O que ${eu} vai criar?`, [
      { v: 'stories', ic: '📱', nome: 'Stories', desc: 'Vídeo vertical de 30 s ou mais, com música' },
      { v: 'reels', ic: '🎞️', nome: 'Reels', desc: 'Tema mais completo, até 1:30, com música' },
      { v: 'post', ic: '🖼️', nome: 'Post', desc: 'Você descreve a imagem e ele cria a arte' },
    ]);
    if (!formato) return;
    if (formato === 'post') return trabalharPost(f, p);
    const est = A().estado, cfg = A().cfg();
    const leo = U().pessoaFuncao('noticias'), nomeL = leo ? U().primeiro(leo.id) : 'pessoal das notícias';
    const resumo = (est.relatorios || []).find(r => (r.tipo || 'noticias') === 'noticias');
    if (!resumo) {
      A().falar(p.id, `Preciso que ${nomeL} busque as notícias primeiro! 📰`, 3200);
      return A().toast(`🎬 ${eu} faz o vídeo a partir das notícias do dia. Coloque ${nomeL} para trabalhar primeiro 📰`, { ms: 7000 });
    }
    let rel;
    try { rel = await A().obterRelatorio(resumo.id); } catch (e) { return A().toast('Não consegui abrir as notícias: ' + e.message, { erro: true }); }
    const lista = ((rel.principais && rel.principais.length ? rel.principais : rel.dia) || []).filter(n => n.titulo);
    if (!lista.length) return A().toast('O último relatório de notícias está vazio 😕', { erro: true });
    cfg.marketing.usadas = cfg.marketing.usadas || [];
    let opcoes = lista.filter(n => !cfg.marketing.usadas.includes(n.url));
    if (!opcoes.length) opcoes = lista.filter(n => n.url !== cfg.marketing.ultima);
    if (!opcoes.length) opcoes = lista;
    const n = opcoes[Math.floor(Math.random() * opcoes.length)];
    const nomeF = formato === 'reels' ? 'Reels' : 'Stories';

    const ok = await KM.rodar('trabalho', async q => {
      A().pagar(f, q);
      A().iniciarPainelTarefa(`🎬 ${nomeF} para o Instagram`);
      A().callbacksTarefa(q, false).etapa(`Indo falar com ${nomeL} 🚶`);
      await U().irConversar(q, leo, [
        ['eu', `${nomeL}, quais as principais notícias de hoje?`, 2300],
        ['alvo', `Separei ${lista.length} hoje! Escolhe uma 📰`, 2300],
        ['eu', `Vou fazer um ${nomeF} sobre: "${U().curto(n.titulo, 40)}" 🎬`, 3000],
      ]);
    }, [p.id]);
    if (ok === false) return A().toast(`${eu} está com outra coisa agora. Tente de novo 😉`);

    p.trabalhando = true; p.digitando = true; est.trabalhoDe.video = true; A().atualizarBotoes();
    const cb = A().callbacksTarefa(p, false);
    let erro, salvo;
    try {
      let paragrafos = [];
      if (formato === 'reels') { cb.etapa('Lendo a notícia completa 📖'); cb.progresso(10); paragrafos = await buscarArtigo(n.url); }
      await U().produzir(p, cb, [['Escrevendo o roteiro ✍️', 25, 2400], ['Animando os textos 🎞️', 45, 2600], ['Compondo a trilha 🎵', 62, 2200], ['Aplicando o visual da KWIK 🟩', 78, 2000], ['Escrevendo a legenda 📝', 92, 2000]]);
      const video = montarVideo(n, cfg, formato, paragrafos);
      salvo = {
        id: U().agoraId('video'), tipo: 'video', criadoEm: U().agoraIso(), funcionario: { id: f.id, nome: f.nome }, tarefa: `${nomeF} para o Instagram`,
        titulo: n.titulo, noticia: { titulo: n.titulo, url: n.url, fonte: n.fonte, resumo: n.resumo || '', categoria: n.categoria || '', temas: n.temas || [] },
        relatorioNoticias: resumo.id, video, legenda: montarLegenda(n, cfg, video), duracao: 12, leuArtigo: paragrafos.length > 0,
      };
      await A().BK().salvarRelatorio(salvo);
      cfg.marketing.usadas = [...cfg.marketing.usadas.filter(u => u !== n.url), n.url].slice(-80);
      cfg.marketing.ultima = n.url; cfg.marketing.ultimoFundo = video.fundo;
      A().salvar(); cb.progresso(100);
    } catch (e) { erro = e; }
    p.trabalhando = false; p.digitando = false; est.trabalhoDe.video = false; A().atualizarBotoes();
    if (erro) { A().falar(p.id, 'Deu ruim na edição 😓', 3000); return A().toast(`${eu}: ` + erro.message, { erro: true, ms: 9000 }); }
    await A().carregarRelatorios(KM.resumoRelatorio(salvo));
    A().falar(p.id, `${nomeF} pronto! Tá nos Relatórios 🎬`, 3000);
    A().toast(`🎬 ${eu} terminou o ${nomeF} (${Math.round(salvo.video.duracao)} s, com música e legenda).`, { botao: ['Ver', () => A().abrirRelatorio(salvo.id)], ms: 10000 });
    await A().concluir(f, p);
  }

  async function trabalharPost(f, p) {
    const cfg = A().cfg(), est = A().estado;
    const resp = await A().perguntar('🖼️ Post para o Instagram', [
      { id: 'desc', rotulo: 'Descreva a imagem', area: true, placeholder: 'Ex.: chamar quem quer abrir empresa, mostrando que com a KWIK é rápido. Fundo escuro, com um prédio.' },
      { id: 'frase', rotulo: 'Frase principal (opcional)', placeholder: 'Ex.: Vai abrir empresa? Chama a KWIK!' },
    ], '🎨 Criar post');
    if (!resp || !resp.desc.trim()) return;
    const eu = U().primeiro(f.id);
    if (!(await A().esperarLivre(p, 1500))) return A().toast(`Espere ${eu} terminar o que está fazendo 😉`);
    if (p.modo !== 'sentado') await KM.voltarSentar(p);
    A().pagar(f, p);
    A().iniciarPainelTarefa('🖼️ Post para o Instagram');
    p.trabalhando = true; p.digitando = true; est.trabalhoDe.video = true; A().atualizarBotoes();
    const cb = A().callbacksTarefa(p, false);
    let erro, salvo;
    try {
      await U().produzir(p, cb, [['Lendo a sua ideia 👀', 25, 2000], ['Desenhando a arte 🎨', 55, 2600], ['Ajustando o texto e as cores 🟩', 80, 2200], ['Escrevendo a legenda 📝', 92, 1800]]);
      const post = montarPost(resp.desc, resp.frase || '', cfg);
      salvo = { id: U().agoraId('post'), tipo: 'post', criadoEm: U().agoraIso(), funcionario: { id: f.id, nome: f.nome }, tarefa: 'Post para o Instagram', titulo: semMarca(post.titulo), descricao: resp.desc, post, legenda: legendaPost(post, resp.desc, cfg), duracao: 9 };
      await A().BK().salvarRelatorio(salvo);
      cfg.marketing.ultimoPost = post.fundo; A().salvar(); cb.progresso(100);
    } catch (e) { erro = e; }
    p.trabalhando = false; p.digitando = false; est.trabalhoDe.video = false; A().atualizarBotoes();
    if (erro) { A().falar(p.id, 'Não consegui fechar a arte 😓', 3000); return A().toast(`${eu}: ` + erro.message, { erro: true, ms: 9000 }); }
    await A().carregarRelatorios(KM.resumoRelatorio(salvo));
    A().falar(p.id, 'Post pronto! Ficou top 🖼️', 3000);
    A().toast(`🖼️ ${eu} criou o post com legenda.`, { botao: ['Ver', () => A().abrirRelatorio(salvo.id)], ms: 10000 });
    await A().concluir(f, p);
  }

  // ------------------------------------------------------------------ relatórios
  // Baixa o arquivo (no PC vai para Downloads; no iPhone o Safari pergunta "Baixar" e salva em Arquivos).
  async function baixarArquivo(blob, nome, legenda, status) {
    const url = URL.createObjectURL(blob);
    const a = A().el('a', { href: url, download: nome }); document.body.append(a); a.click(); a.remove();
    status.innerHTML = '';
    status.append('✅ Baixado: ' + nome + ' · ', A().el('a', { href: url, target: '_blank', rel: 'noopener' }, 'não baixou? abrir o arquivo'));
    setTimeout(() => URL.revokeObjectURL(url), 10 * 60000);
  }
  const nomeArq = (s, ext) => `KWIK - ${U().curto(s || 'conteudo', 40).replace(/[\\/:*?"<>|…]/g, '')}.${ext}`;
  function blocoLegenda(r) {
    const { el } = A();
    return [el('h3', { class: 'leg-tit' }, '📝 Legenda ', el('button', { class: 'bt peq', onclick: async () => { try { await navigator.clipboard.writeText(r.legenda); A().toast('Legenda copiada 📋'); } catch (e) { A().toast('Não consegui copiar.', { erro: true }); } } }, '📋 Copiar')),
      el('pre', { class: 'legenda' }, r.legenda)];
  }

  function renderVideo(r, box) {
    const { el, fmtData } = A();
    const spec = r.video, n = r.noticia || {}, vert = spec.h / spec.w > 1.5;
    const nomeF = (spec.formato === 'reels' ? 'Reels' : spec.formato === 'stories' ? 'Stories' : 'Vídeo do feed') + (spec.versao === 2 ? ' 2.0' : '');
    const rel = el('div', { class: 'rel' });
    rel.append(el('div', { class: 'rel-cab' },
      el('div', {}, el('h2', {}, `🎬 ${nomeF} para o Instagram`),
        el('p', {}, `Feito por ${r.funcionario?.nome || 'Enzo'} em ${fmtData(r.criadoEm)} · ${vert ? '9:16' : '4:5'} · ${Math.round(spec.duracao)} s`),
        el('div', { class: 'chips' }, el('span', { class: 'chip ok' }, '🎞️ Motion design'), el('span', { class: 'chip ok' }, '🎙️ Narrador'), spec.musica ? el('span', { class: 'chip ok' }, spec.musica.estilo === 'lofi' ? '🎵 Música lo-fi' : '🎵 Com música') : el('span', { class: 'chip' }, 'Sem música'),
          el('span', { class: 'chip ok' }, '🔔 Efeitos sonoros'), r.leuArtigo ? el('span', { class: 'chip' }, '📖 Leu a notícia completa') : null, el('span', { class: 'chip' }, 'Fundo: ' + spec.fundo))),
      el('div', { class: 'rel-bts' }, el('button', { class: 'bt peq', title: 'Mesmo tema, vídeo totalmente diferente', onclick: async e => { e.currentTarget.disabled = true; try { await fazer2(r); } catch (x) { A().toast('Não consegui fazer o 2.0: ' + x.message, { erro: true }); } e.currentTarget.disabled = false; } }, '✨ Fazer 2.0'),
        el('button', { class: 'bt peq perigo', onclick: () => A().apagarRel(r) }, '🗑️ Apagar'))));
    const cv = el('canvas', { width: spec.w / 2, height: spec.h / 2, class: 'video-cv' + (vert ? ' vertical' : '') });
    const g = cv.getContext('2d');
    // atual = o vídeo com os tempos ajustados à narração (quando a voz carrega)
    let atual = spec, narr = null, tentouVoz = false, vozNav = null, roteiro = roteiroFala(spec), cenaFalada = -1;
    let tocando = true, t0 = performance.now(), pausadoEm = 0, som = false, ac = null, musica = null;
    const status = el('small', { class: 'vazio' });
    const tempo = () => (tocando ? ((performance.now() - t0) / 1000) : pausadoEm);
    const pararSom = () => { musica && musica.parar(); musica = null; vozNav && vozNav.parar(); cenaFalada = -1; };
    const tocarSom = () => { pararSom(); if (!som) return; ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); musica = trilha(ac, ac.destination, atual, tempo() % atual.duracao, narr); };
    async function prepararNarrador() {
      if (narr || tentouVoz) return !!narr;
      tentouVoz = true;
      try {
        status.textContent = '🎙️ Preparando o narrador…';
        const res = await narrar(spec, s => { status.textContent = '🎙️ ' + s; });
        atual = res.spec; narr = res.narr; roteiro = roteiroFala(atual);
        status.textContent = '🎙️ Narrador pronto: voz, música e efeitos vão juntos no vídeo.';
        return true;
      } catch (e) {
        console.warn('KWIK narrador', e); vozNav = vozNavegador();
        status.textContent = vozNav ? '🎙️ A voz do narrador não carregou neste aparelho: a prévia usa a voz do navegador (o vídeo baixado sai com música e efeitos).' : '🎙️ Este aparelho não tem voz de narrador: o vídeo sai com música e efeitos.';
        return false;
      }
    }
    const btPlay = el('button', { class: 'bt peq', onclick: () => { if (tocando) { pausadoEm = tempo() % atual.duracao; tocando = false; btPlay.textContent = '▶ Tocar'; pararSom(); } else { t0 = performance.now() - pausadoEm * 1000; tocando = true; btPlay.textContent = '⏸ Pausar'; tocarSom(); } } }, '⏸ Pausar');
    const btDe = el('button', { class: 'bt peq', onclick: () => { t0 = performance.now(); pausadoEm = 0; tocando = true; btPlay.textContent = '⏸ Pausar'; tocarSom(); } }, '↺ Do começo');
    const btSom = el('button', { class: 'bt peq prim', onclick: async () => {
      som = !som; btSom.textContent = som ? '🔊 Som ligado' : '🔊 Ouvir com narrador';
      if (som) { btSom.disabled = true; await prepararNarrador(); btSom.disabled = false; t0 = performance.now(); pausadoEm = 0; tocando = true; btPlay.textContent = '⏸ Pausar'; }
      tocarSom();
    } }, '🔊 Ouvir com narrador');
    const btBaixar = el('button', {
      class: 'bt prim', onclick: async () => {
        btBaixar.disabled = true; som = false; btSom.textContent = '🔊 Ouvir com narrador'; pararSom();
        try {
          const comVoz = await prepararNarrador();
          const blob = await gravarVideo(atual, k => { status.textContent = `Gravando o vídeo ${comVoz ? 'com narrador, música e efeitos' : 'com música e efeitos'}… ${Math.round(k * 100)}% (deixe esta tela aberta)`; }, desenharQuadro, narr);
          await baixarArquivo(blob, nomeArq(n.titulo, blob.type.includes('mp4') ? 'mp4' : 'webm'), r.legenda, status);
        } catch (e) { status.textContent = '❌ ' + e.message; }
        btBaixar.disabled = false;
      },
    }, '⬇️ Baixar vídeo');
    rel.append(el('div', { class: 'video-grade' },
      el('div', { class: 'video-col' }, cv, el('div', { class: 'video-bts' }, btSom, btPlay, btDe, btBaixar), status, ...blocoLegenda(r)),
      el('div', {},
        el('h3', {}, '📰 Notícia escolhida'),
        el('p', {}, el('a', { href: n.url, target: '_blank', rel: 'noopener', class: 'tit' }, n.titulo)),
        n.resumo ? el('p', { class: 'vazio' }, n.resumo) : null,
        el('h3', { style: 'margin-top:18px' }, '🎞️ Roteiro e narração'),
        el('ol', { class: 'roteiro' }, spec.cenas.map((c, i) => el('li', {}, el('b', {}, `${c.ini.toFixed(1)}s · `), c.tipo === 'pontos' || c.tipo === 'lista' ? c.itens.join(' / ') : c.tipo === 'fim' ? 'Encerramento com a marca KWIK' : semMarca(c.texto), roteiro[i] ? el('small', { class: 'fala' }, ` 🎙️ "${roteiro[i]}"`) : null))),
        el('p', { class: 'vazio', style: 'font-size:12px' }, 'Narrador com voz neural em português (na 1ª vez o navegador baixa a voz, uns 60 MB, e guarda). A música e os efeitos são criados pelo app (sem direitos autorais). O som sai em AAC, que toca no celular, no WhatsApp e no Instagram. Deixe esta tela aberta até terminar.'))));
    box.append(rel);
    prepararFontes().then(() => {
      let voltas = 0;
      const passo = () => {
        if (!cv.isConnected) { pararSom(); return; }
        const tt = tempo(), volta = Math.floor(tt / atual.duracao), tl = tt % atual.duracao;
        if (tocando && volta !== voltas) { voltas = volta; if (som) tocarSom(); }
        if (som && tocando && vozNav) { const i = atual.cenas.findIndex(c => tl >= c.ini && tl < c.fim); if (i !== cenaFalada) { cenaFalada = i; vozNav.falar(roteiro[i]); } }
        if (!KM.pausarCena) { g.setTransform(0.5, 0, 0, 0.5, 0, 0); desenharQuadro(g, atual, tl); } // enquanto grava, a prévia descansa
        requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }

  function renderPost(r, box) {
    const { el, fmtData } = A(), spec = r.post;
    const rel = el('div', { class: 'rel' });
    rel.append(el('div', { class: 'rel-cab' },
      el('div', {}, el('h2', {}, '🖼️ Post para o Instagram'), el('p', {}, `Feito por ${r.funcionario?.nome || 'Enzo'} em ${fmtData(r.criadoEm)} · 4:5 (1080 × 1350)`),
        el('div', { class: 'chips' }, el('span', { class: 'chip ok' }, spec.tag), el('span', { class: 'chip' }, 'Fundo: ' + spec.fundo))),
      el('div', { class: 'rel-bts' }, el('button', { class: 'bt peq perigo', onclick: () => A().apagarRel(r) }, '🗑️ Apagar'))));
    const cv = el('canvas', { width: spec.w, height: spec.h, class: 'video-cv' });
    const status = el('small', { class: 'vazio' });
    const bt = el('button', { class: 'bt prim', onclick: () => cv.toBlob(b => baixarArquivo(b, nomeArq(r.titulo, 'png'), r.legenda, status), 'image/png') }, '⬇️ Baixar imagem');
    rel.append(el('div', { class: 'video-grade' },
      el('div', { class: 'video-col' }, cv, el('div', { class: 'video-bts' }, bt), status, ...blocoLegenda(r)),
      el('div', {}, el('h3', {}, '✍️ O que você pediu'), el('p', { class: 'legenda' }, r.descricao),
        el('p', { class: 'vazio', style: 'font-size:12px' }, 'Quer outra versão? Mande o Enzo trabalhar de novo e escreva a frase principal que preferir.'))));
    box.append(rel);
    prepararFontes().then(() => desenharPost(cv.getContext('2d'), spec));
  }

  Object.assign(KM.marketing, { trabalharVideo, trabalharPost, renderVideo, renderPost, desenharQuadro, desenharPost, montarVideo, montarPost, montarLegenda, gravarVideo, trilha, prepararFontes, frasesArtigo, montarVideo2, roteiroFala, narrar, fazer2 });
})();
