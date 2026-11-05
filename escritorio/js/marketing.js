/* KWIK Mini Escritório · setor de Marketing.
   Enzo: vai até quem busca as notícias, pergunta as principais do dia, escolhe uma (nunca a mesma da vez
         anterior), volta para a mesa e monta um vídeo em motion design (4:5, para o feed do Instagram) com legenda.
         O vídeo é desenhado no próprio app (canvas) e pode ser baixado/compartilhado em MP4/WebM.
   Lena: vai até o Maycon, pega os contatos com telefone do último relatório e prepara a mensagem de primeiro
         contato (assinada pelo dono da KWIK) para enviar pelo WhatsApp Business, um por um. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const VERDE = '#28BE52', GRAFITE = '#111A19', NEVOA = '#F1F5F0';
  const primeiro = id => (A().func(id).nome || '').split(' ')[0];
  const pessoaFuncao = f => Object.values(A().estado.pessoas).find(q => q.funcao === f);
  const curto = (s, n) => { s = String(s || '').trim(); if (s.length <= n) return s; const c = s.slice(0, n); return c.slice(0, Math.max(c.lastIndexOf(' '), n - 12)).replace(/[,;:.\s]+$/, '') + '…'; };
  const dd = n => String(n).padStart(2, '0');
  const agoraId = suf => { const a = new Date(); return `${a.getFullYear()}${dd(a.getMonth() + 1)}${dd(a.getDate())}-${dd(a.getHours())}${dd(a.getMinutes())}${dd(a.getSeconds())}-${suf}`; };
  const agoraIso = () => { const a = new Date(); return `${a.getFullYear()}-${dd(a.getMonth() + 1)}-${dd(a.getDate())}T${dd(a.getHours())}:${dd(a.getMinutes())}:${dd(a.getSeconds())}`; };
  const foneBonito = d => { d = String(d || '').replace(/\D/g, ''); if (d.startsWith('55') && d.length >= 12) d = d.slice(2); return d.length >= 10 ? `(${d.slice(0, 2)}) ${d.slice(2, -4)}-${d.slice(-4)}` : d; };

  // ------------------------------------------------------------------ andar até um colega e conversar
  async function irConversar(p, alvo, falas) {
    const m = KM.mov;
    if (alvo) {
      const a = KM.LAYOUT.assentos[alvo.funcao];
      const [x, y] = alvo.modo === 'sentado' && a ? [a.X + 17, a.Y + 3] : [alvo.X + 16, alvo.Y];
      await m.irAte(p, x, y);
      KM.olhar(p, alvo);
      if (alvo.modo !== 'sentado') KM.olhar(alvo, p);
    }
    for (const [quem, txt, ms] of falas) {
      const q = quem === 'eu' ? p : alvo;
      if (!q) continue;
      m.fala(q, txt, ms);
      if (q === p) p.est = { bracos: 'aceno', aceno: 1, boca: 'sorriso' };
      await KM.esperar(ms + 200);
      p.est = {};
    }
    await KM.voltarSentar(p);
  }
  function semConexao() {
    if (A().online()) return false;
    const BK = A().BK();
    if (BK && BK.nome === 'github') { A().toast('Conecte ao GitHub para salvar o trabalho 🔗'); A().abrirConexao(); }
    else A().toast('O servidor está desligado. Abra o ABRIR-ESCRITORIO.bat.', { erro: true });
    return true;
  }
  // Fases do trabalho na mesa, com balões, barra de progresso e moedinhas.
  async function produzir(p, cb, etapas) {
    for (const [txt, pr, ms] of etapas) {
      cb.etapa(txt); cb.progresso(pr);
      const fim = performance.now() + ms;
      while (performance.now() < fim) { cb.tique(); await KM.esperar(400); }
    }
  }

  // ================================================================== ENZO · vídeo para o Instagram
  const DESTAQUES = /(Reforma Tribut[áa]ria|Simples Nacional|Imposto de Renda|Receita Federal|nota fiscal|13º sal[áa]rio|d[ée]cimo terceiro|split payment|Lucro Presumido|MEI|IRPF|IRPJ|eSocial|FGTS|INSS|ICMS|ISS|IBS|CBS|Pix|DAS|DCTFWeb|NFS-e|prazo|multa|f[ée]rias|parcelamento|Simples)/i;
  const GANCHOS = [
    [/\bMEI\b/i, 'Atenção, *MEI*!'], [/Simples/i, 'Sua empresa está no *Simples*?'], [/Reforma Tribut|\bIBS\b|\bCBS\b|split payment/i, '*Reforma Tributária*: fique por dentro'],
    [/Imposto de Renda|IRPF/i, '*Imposto de Renda*: atenção!'], [/eSocial|FGTS|INSS|folha|sal[áa]rio|f[ée]rias|trabalhist|13º|6x1/i, '*Empregador*, olha isso!'],
    [/prazo|vence|vencimento/i, '*Prazo* chegando!'], [/multa/i, 'Cuidado com *multas*!'], [/nota fiscal|NFS-e|NF-e/i, 'Novidade na *nota fiscal*'],
    [/\bPix\b/i, '*Pix*: o que muda?'], [/parcelamento|regulariza|transa[çc][ãa]o/i, 'Hora de *regularizar*?'],
  ];
  const HASHTAGS = [
    [/\bMEI\b/i, '#mei #microempreendedor'], [/Simples/i, '#simplesnacional'], [/Reforma Tribut|\bIBS\b|\bCBS\b|split/i, '#reformatributaria'],
    [/Imposto de Renda|IRPF/i, '#impostoderenda'], [/eSocial|folha|sal[áa]rio|f[ée]rias|13º/i, '#folhadepagamento #dp'], [/FGTS|INSS/i, '#inss #fgts'],
    [/nota fiscal|NFS-e/i, '#notafiscal'], [/\bPix\b/i, '#pix'], [/Receita Federal/i, '#receitafederal'],
  ];
  const FUNDOS = ['nevoa', 'aurora', 'pontos', 'sol', 'grafite'];
  const NOME_FONTE = { contabeis: 'Portal Contábeis', contadores: 'Contadores.cnt.br' };

  function marcar(titulo) { // destaca (em verde) a palavra-chave do título
    const m = String(titulo).match(DESTAQUES);
    if (!m) return titulo;
    return titulo.slice(0, m.index) + '*' + m[0] + '*' + titulo.slice(m.index + m[0].length);
  }
  function frases(n) {
    const base = String(n.resumo || '').replace(/\s+/g, ' ').trim();
    const sem = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const lista = (base.match(/[^.!?]+[.!?]*/g) || []).map(s => s.trim()).filter(s => s.length > 25 && sem(s) !== sem(n.titulo));
    const out = lista.slice(0, 2).map(s => curto(s, 120));
    if (!out.length) return ['Entenda o que muda e como isso afeta a sua empresa.', 'Antes de tomar qualquer decisão, fale com o seu contador.'];
    if (out.length === 1) out.push('Na dúvida, fale com o seu contador antes de agir.');
    return out;
  }
  function montarVideo(n, cfg) {
    const texto = `${n.titulo} ${(n.temas || []).join(' ')} ${n.categoria || ''}`;
    const gancho = (GANCHOS.find(([re]) => re.test(texto)) || [null, 'Notícia importante pra *sua empresa*'])[1];
    const ult = cfg.marketing.ultimoFundo;
    const opc = FUNDOS.filter(f => f !== ult);
    const fundo = opc[Math.floor(Math.random() * opc.length)];
    const whats = foneBonito(cfg.marketing.whats);
    return {
      formato: '4:5', w: 1080, h: 1350, duracao: 20, fundo,
      fonte: NOME_FONTE[n.fonte] || 'Portal Contábeis',
      cenas: [
        { tipo: 'gancho', ini: 0, fim: 3.2, tag: String(n.categoria || (n.temas || [])[0] || 'Notícia contábil').toUpperCase(), texto: gancho },
        { tipo: 'titulo', ini: 3.2, fim: 8.8, rotulo: 'NOTÍCIA DO DIA', texto: marcar(n.titulo) },
        { tipo: 'pontos', ini: 8.8, fim: 14.4, rotulo: 'O QUE VOCÊ PRECISA SABER', itens: frases(n) },
        { tipo: 'cta', ini: 14.4, fim: 17.8, texto: 'Ficou com *dúvida*?', sub: 'A KWIK te explica sem complicação.', whats },
        { tipo: 'fim', ini: 17.8, fim: 20, whats },
      ],
    };
  }
  function montarLegenda(n, cfg) {
    const texto = `${n.titulo} ${(n.temas || []).join(' ')} ${n.categoria || ''}`;
    const tags = new Set(['#contabilidade', '#kwik', '#kwikcontabilidade']);
    for (const [re, h] of HASHTAGS) if (re.test(texto)) h.split(' ').forEach(x => tags.add(x));
    ['#empreendedorismo', '#impostos', '#pequenasempresas'].forEach(x => tags.add(x));
    const corpo = frases(n).filter(s => !/fale com o seu contador/i.test(s)).join(' ');
    const whats = foneBonito(cfg.marketing.whats);
    return [
      `📰 ${n.titulo}`, '',
      corpo || 'Saiu uma novidade que pode mexer com a rotina da sua empresa.', '',
      '👉 O que isso muda pra você? A KWIK te explica sem complicação.',
      whats ? `💬 Chama a gente no WhatsApp: ${whats}` : '💬 Chama a gente no direct!', '',
      `Fonte: ${NOME_FONTE[n.fonte] || 'Portal Contábeis'}`, '',
      [...tags].slice(0, 12).join(' '),
    ].join('\n');
  }

  async function trabalharVideo(f, p) {
    if (p.trabalhando || semConexao()) return;
    const est = A().estado, cfg = A().cfg();
    const leo = pessoaFuncao('noticias'), nomeL = leo ? primeiro(leo.id) : 'pessoal das notícias';
    const resumo = (est.relatorios || []).find(r => (r.tipo || 'noticias') === 'noticias');
    if (!resumo) {
      A().falar(p.id, `Preciso que o ${nomeL} busque as notícias primeiro! 📰`, 3200);
      return A().toast(`🎬 O Enzo faz o vídeo a partir das notícias do dia. Coloque o ${nomeL} para trabalhar primeiro 📰`, { ms: 7000 });
    }
    let rel;
    try { rel = await A().obterRelatorio(resumo.id); } catch (e) { return A().toast('Não consegui abrir as notícias: ' + e.message, { erro: true }); }
    const lista = ((rel.principais && rel.principais.length ? rel.principais : rel.dia) || []).filter(n => n.titulo);
    if (!lista.length) return A().toast('O último relatório de notícias está vazio 😕', { erro: true });
    cfg.marketing.usadas = cfg.marketing.usadas || [];
    let opcoes = lista.filter(n => !cfg.marketing.usadas.includes(n.url));
    if (!opcoes.length) opcoes = lista.filter(n => n.url !== cfg.marketing.ultima); // todas já viraram vídeo: recomeça, sem repetir a última
    if (!opcoes.length) opcoes = lista;
    const n = opcoes[Math.floor(Math.random() * opcoes.length)];

    const ok = await KM.rodar('trabalho', async q => {
      A().pagar(f, q);
      A().iniciarPainelTarefa('🎬 Vídeo para o Instagram');
      A().callbacksTarefa(q, false).etapa(`Indo falar com o ${nomeL} 🚶`);
      await irConversar(q, leo, [
        ['eu', `${nomeL}, quais as principais notícias de hoje?`, 2300],
        ['alvo', `Separei ${lista.length} hoje! Escolhe uma 📰`, 2300],
        ['eu', `Vou fazer sobre: "${curto(n.titulo, 46)}" 🎬`, 3000],
      ]);
    }, [p.id]);
    if (ok === false) return A().toast('O Enzo está ocupado com outra coisa. Tente de novo 😉');

    p.trabalhando = true; p.digitando = true; est.trabalhoDe.video = true; A().atualizarBotoes();
    const cb = A().callbacksTarefa(p, false);
    let erro, salvo;
    try {
      await produzir(p, cb, [['Escrevendo o roteiro ✍️', 20, 2600], ['Animando os textos 🎞️', 45, 3000], ['Aplicando as cores da KWIK 🟩', 65, 2400], ['Montando as transições ✨', 80, 2200], ['Escrevendo a legenda 📝', 92, 2200]]);
      const video = montarVideo(n, cfg);
      salvo = {
        id: agoraId('video'), tipo: 'video', criadoEm: agoraIso(), funcionario: { id: f.id, nome: f.nome }, tarefa: 'Vídeo para o Instagram',
        titulo: n.titulo, noticia: { titulo: n.titulo, url: n.url, fonte: n.fonte, resumo: n.resumo || '', categoria: n.categoria || '', temas: n.temas || [] },
        relatorioNoticias: resumo.id, video, legenda: montarLegenda(n, cfg), duracao: 13,
      };
      await A().BK().salvarRelatorio(salvo);
      cfg.marketing.usadas = [...cfg.marketing.usadas.filter(u => u !== n.url), n.url].slice(-80);
      cfg.marketing.ultima = n.url; cfg.marketing.ultimoFundo = video.fundo;
      A().salvar();
      cb.progresso(100);
    } catch (e) { erro = e; }
    p.trabalhando = false; p.digitando = false; est.trabalhoDe.video = false; A().atualizarBotoes();
    if (erro) { A().falar(p.id, 'Deu ruim na edição 😓', 3000); return A().toast('Enzo: ' + erro.message, { erro: true, ms: 9000 }); }
    await A().carregarRelatorios(KM.resumoRelatorio(salvo));
    A().falar(p.id, 'Vídeo pronto! Tá nos Relatórios 🎬', 3000);
    A().toast('🎬 Enzo terminou o vídeo com legenda.', { botao: ['Ver vídeo', () => A().abrirRelatorio(salvo.id)], ms: 10000 });
    await A().concluir(f, p);
  }

  // ------------------------------------------------------------------ desenho do vídeo (1080 x 1350)
  const logo = new Image(); logo.src = 'assets/kwik-simbolo.png';
  let fontesProntas = null;
  const prepararFontes = () => fontesProntas || (fontesProntas = Promise.all(['900 100px Montserrat', '800 40px Montserrat', '700 40px Montserrat']
    .map(f => document.fonts.load(f).catch(() => null))).then(() => new Promise(r => (logo.complete ? r() : (logo.onload = logo.onerror = r)))));
  const temFiltro = (() => { try { return 'filter' in document.createElement('canvas').getContext('2d'); } catch (e) { return false; } })();
  const ease = k => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
  const easeBack = k => { k = Math.min(1, Math.max(0, k)); const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  function retRed(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); } }

  function fundo(g, nome, t, W, H) {
    if (nome === 'grafite') {
      g.fillStyle = GRAFITE; g.fillRect(0, 0, W, H);
      const gr = g.createRadialGradient(W * 0.85, H * 0.1 + Math.sin(t * 0.6) * 60, 10, W * 0.85, H * 0.1, 760);
      gr.addColorStop(0, 'rgba(40,190,82,0.42)'); gr.addColorStop(1, 'rgba(40,190,82,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,0.045)'; const o = (t * 18) % 90;
      for (let x = -90 + o; x < W; x += 90) g.fillRect(x, 0, 2, H);
      for (let y = -90 + o; y < H; y += 90) g.fillRect(0, y, W, 2);
      return;
    }
    g.fillStyle = nome === 'nevoa' ? NEVOA : '#ffffff'; g.fillRect(0, 0, W, H);
    if (nome === 'nevoa' || nome === 'sol') {
      const bolhas = nome === 'sol' ? [[0.5, 1.05, 900, 'rgba(40,190,82,0.22)']] : [[0.15, 0.2, 520, 'rgba(40,190,82,0.20)'], [0.9, 0.55, 600, 'rgba(46,139,69,0.14)'], [0.3, 0.95, 560, 'rgba(40,190,82,0.16)']];
      bolhas.forEach(([x, y, rr, c], i) => {
        const cx = W * x + Math.sin(t * 0.5 + i * 2) * 80, cy = H * y + Math.cos(t * 0.4 + i) * 60;
        const gr = g.createRadialGradient(cx, cy, 10, cx, cy, rr); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      });
      if (nome === 'sol') { g.strokeStyle = 'rgba(40,190,82,0.12)'; g.lineWidth = 3; for (let k = 0; k < 6; k++) { const rr = ((t * 60 + k * 160) % 960) + 40; g.beginPath(); g.arc(W / 2, H * 1.05, rr, Math.PI, 2 * Math.PI); g.stroke(); } }
    } else if (nome === 'aurora') {
      for (let k = 0; k < 3; k++) {
        g.fillStyle = ['rgba(40,190,82,0.13)', 'rgba(17,26,25,0.05)', 'rgba(40,190,82,0.08)'][k];
        g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W; x += 40) g.lineTo(x, H * (0.35 + k * 0.18) + Math.sin(x / 210 + t * (0.7 + k * 0.2) + k) * 70);
        g.lineTo(W, H); g.closePath(); g.fill();
      }
    } else if (nome === 'pontos') {
      const o = (t * 24) % 54; g.fillStyle = 'rgba(40,190,82,0.22)';
      for (let y = -54 + o; y < H; y += 54) for (let x = -54 + o; x < W; x += 54) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(17,26,25,0.06)'; g.fillRect(0, H - 260, W, 260);
    }
  }

  // Quebra o texto em linhas. Palavras entre *asteriscos* ficam em verde.
  function quebrar(g, texto, larg) {
    const palavras = []; let dest = false;
    for (const bruto of String(texto).split(/\s+/).filter(Boolean)) {
      const abre = bruto.startsWith('*'), fecha = bruto.replace(/[!?.,:;…]+$/, '').endsWith('*');
      if (abre) dest = true;
      palavras.push({ txt: bruto.replace(/\*/g, ''), dest });
      if (fecha) dest = false;
    }
    const linhas = [[]]; let w = 0; const esp = g.measureText(' ').width;
    for (const p of palavras) {
      p.w = g.measureText(p.txt).width;
      if (w + p.w > larg && linhas.at(-1).length) { linhas.push([]); w = 0; }
      linhas.at(-1).push(p); w += p.w + esp;
    }
    return linhas;
  }
  function palavrasAnimadas(g, o) {
    // o: {texto, x, y, larg, tam, peso, lh, t (tempo dentro da cena), atraso, cor, corDest, alinhar, estilo: 'sobe' | 'soco'}
    let tam = o.tam;
    g.font = `${o.peso} ${tam}px Montserrat`;
    let linhas = quebrar(g, o.texto, o.larg);
    while (linhas.length > (o.maxLinhas || 5) && tam > 40) { tam -= 6; g.font = `${o.peso} ${tam}px Montserrat`; linhas = quebrar(g, o.texto, o.larg); }
    const lh = tam * (o.lh || 1.12), esp = g.measureText(' ').width;
    let k = 0, y = o.y;
    if (o.centroV) y = o.y - (linhas.length * lh) / 2 + tam * 0.85;
    g.textBaseline = 'alphabetic';
    for (const linha of linhas) {
      const total = linha.reduce((s, p) => s + p.w, 0) + esp * (linha.length - 1);
      let x = o.alinhar === 'centro' ? o.x - total / 2 : o.x;
      for (const p of linha) {
        const ti = o.t - (o.atraso || 0) - k * (o.passo || 0.07), e = ease(ti / 0.38);
        if (ti > 0) {
          g.save();
          g.globalAlpha = Math.min(1, ti / 0.25);
          if (o.estilo === 'soco') { const s = 1 + (1 - easeBack(ti / 0.32)) * 0.6; g.translate(x + p.w / 2, y - tam / 3); g.scale(s, s); g.translate(-(x + p.w / 2), -(y - tam / 3)); }
          else g.translate(0, (1 - e) * 46);
          if (temFiltro && ti < 0.3) g.filter = `blur(${Math.round((1 - ti / 0.3) * 10)}px)`;
          if (p.dest && o.marcaFundo) { g.fillStyle = o.corDest; retRed(g, x - 10, y - tam * 0.86, p.w + 20, tam * 1.08, 14); g.fill(); g.fillStyle = o.corSobreMarca || GRAFITE; }
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

  function desenharQuadro(g, spec, t, W = 1080, H = 1350) {
    const escuro = spec.fundo === 'grafite';
    const cor = escuro ? '#ffffff' : GRAFITE, corSuave = escuro ? '#b9c6c2' : '#4a5754';
    g.save();
    fundo(g, spec.fundo, t, W, H);
    const cena = spec.cenas.find(c => t >= c.ini && t < c.fim) || spec.cenas.at(-1);
    const tc = t - cena.ini;
    // cabeçalho com a marca (o logo nunca gira)
    if (cena.tipo !== 'fim') {
      if (logo.complete && logo.naturalWidth) g.drawImage(logo, 70, 64, 58, 58);
      g.fillStyle = cor; g.font = '900 40px Montserrat'; g.textBaseline = 'middle'; g.fillText('KWIK', 140, 95);
      g.fillStyle = VERDE; g.font = '800 22px Montserrat'; g.fillText('CONTABILIDADE', 142, 128);
      g.fillStyle = corSuave; g.font = '600 26px Montserrat'; g.textBaseline = 'alphabetic'; g.fillText('Fonte: ' + spec.fonte, 70, H - 64);
    }
    if (cena.tipo === 'gancho') {
      const ep = easeBack(tc / 0.45);
      g.font = '800 34px Montserrat'; const tw = g.measureText(cena.tag).width;
      g.save(); g.translate(70, 330); g.scale(ep, ep); g.fillStyle = VERDE; retRed(g, 0, -46, tw + 48, 64, 32); g.fill(); g.fillStyle = GRAFITE; g.textBaseline = 'alphabetic'; g.fillText(cena.tag, 24, 0); g.restore();
      palavrasAnimadas(g, { texto: cena.texto, x: 70, y: 600, larg: W - 140, tam: 128, peso: 900, t: tc, atraso: 0.25, passo: 0.12, cor, corDest: VERDE, estilo: 'soco', maxLinhas: 4, lh: 1.08 });
      g.fillStyle = VERDE; g.fillRect(70, H - 190, (W - 140) * ease((tc - 0.6) / 1.2), 14);
    } else if (cena.tipo === 'titulo') {
      g.fillStyle = VERDE; g.font = '800 32px Montserrat'; g.globalAlpha = Math.min(1, tc / 0.3); g.fillText(cena.rotulo, 70, 300); g.globalAlpha = 1;
      g.fillStyle = VERDE; g.fillRect(70, 322, 120 * ease(tc / 0.6), 8);
      palavrasAnimadas(g, { texto: cena.texto, x: 70, y: 440, larg: W - 140, tam: 84, peso: 900, t: tc, atraso: 0.3, passo: 0.06, cor, corDest: VERDE, maxLinhas: 7, lh: 1.14 });
    } else if (cena.tipo === 'pontos') {
      g.fillStyle = VERDE; g.font = '800 32px Montserrat'; g.globalAlpha = Math.min(1, tc / 0.3); g.fillText(cena.rotulo, 70, 300); g.globalAlpha = 1;
      let y = 380;
      cena.itens.forEach((txt, i) => {
        const ti = tc - 0.35 - i * 1.1, e = ease(ti / 0.5);
        g.font = '700 46px Montserrat';
        const linhas = quebrar(g, txt, W - 140 - 150), alto = Math.max(150, linhas.length * 60 + 70);
        if (ti > 0) {
          g.save(); g.globalAlpha = Math.min(1, ti / 0.3); g.translate((1 - e) * -120, 0);
          g.fillStyle = escuro ? '#1d2826' : '#ffffff'; g.shadowColor = 'rgba(17,26,25,0.12)'; g.shadowBlur = escuro ? 0 : 30; g.shadowOffsetY = 10;
          retRed(g, 70, y, W - 140, alto, 28); g.fill(); g.shadowColor = 'transparent';
          g.fillStyle = VERDE; g.beginPath(); g.arc(70 + 70, y + 72, 40, 0, Math.PI * 2); g.fill();
          g.fillStyle = GRAFITE; g.font = '900 42px Montserrat'; g.textAlign = 'center'; g.fillText(String(i + 1), 140, y + 87); g.textAlign = 'left';
          g.fillStyle = cor; g.font = '700 46px Montserrat';
          linhas.forEach((l, k) => g.fillText(l.map(p => p.txt).join(' '), 210, y + 70 + k * 60));
          g.restore();
        }
        y += alto + 34;
      });
    } else if (cena.tipo === 'cta') {
      const r = palavrasAnimadas(g, { texto: cena.texto, x: W / 2, y: 560, larg: W - 140, tam: 118, peso: 900, t: tc, atraso: 0.1, passo: 0.14, cor, corDest: VERDE, alinhar: 'centro', estilo: 'soco', maxLinhas: 3 });
      g.globalAlpha = Math.min(1, Math.max(0, (tc - 0.9) / 0.4)); g.fillStyle = corSuave; g.font = '700 46px Montserrat'; g.textAlign = 'center'; g.fillText(cena.sub, W / 2, r.y + 30); g.globalAlpha = 1;
      if (cena.whats) {
        const e = easeBack((tc - 1.4) / 0.5), pulso = 1 + Math.sin(tc * 5) * 0.025 * (tc > 2 ? 1 : 0);
        if (tc > 1.4) {
          g.save(); g.translate(W / 2, r.y + 170); g.scale(e * pulso, e * pulso);
          g.font = '800 50px Montserrat'; const tx = '💬 ' + cena.whats, tw = g.measureText(tx).width;
          g.fillStyle = VERDE; retRed(g, -tw / 2 - 50, -60, tw + 100, 110, 55); g.fill();
          g.fillStyle = GRAFITE; g.fillText(tx, 0, 16); g.restore();
        }
      }
      g.textAlign = 'left';
    } else if (cena.tipo === 'fim') {
      const e = ease(tc / 0.6);
      g.globalAlpha = e;
      const s = 0.8 + 0.2 * e, ls = 240 * s;
      if (logo.complete && logo.naturalWidth) g.drawImage(logo, W / 2 - ls / 2, 380, ls, ls);
      g.fillStyle = cor; g.font = '900 130px Montserrat'; g.textAlign = 'center'; g.fillText('KWIK', W / 2, 790);
      g.fillStyle = VERDE; g.font = '800 44px Montserrat'; g.fillText('CONTABILIDADE INTELIGENTE', W / 2, 860);
      if (cena.whats) { g.globalAlpha = Math.min(1, Math.max(0, (tc - 0.6) / 0.4)); g.fillStyle = corSuave; g.font = '700 40px Montserrat'; g.fillText('WhatsApp ' + cena.whats, W / 2, 960); }
      g.textAlign = 'left'; g.globalAlpha = 1;
    }
    // transição: faixa verde varrendo a tela entre as cenas
    for (const c of spec.cenas.slice(1)) {
      const k = (t - (c.ini - 0.28)) / 0.56;
      if (k > 0 && k < 1) { const x = -W + 2 * W * ease(k); g.fillStyle = VERDE; g.fillRect(x, 0, W, H); g.fillStyle = GRAFITE; g.fillRect(x + W - 26, 0, 26, H); }
    }
    g.restore();
  }

  async function gravarVideo(spec, aoProgresso) {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) throw new Error('este navegador não grava vídeo. Tente pelo Chrome no computador.');
    await prepararFontes();
    const c = document.createElement('canvas'); c.width = spec.w; c.height = spec.h;
    c.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;height:12px;opacity:0;pointer-events:none';
    document.body.append(c);
    const g = c.getContext('2d');
    const tipos = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    const mime = tipos.find(t => MediaRecorder.isTypeSupported(t)) || '';
    desenharQuadro(g, spec, 0);
    const stream = c.captureStream(30), rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8e6 } : {});
    const partes = []; rec.ondataavailable = e => { if (e.data && e.data.size) partes.push(e.data); };
    const parou = new Promise(res => { rec.onstop = res; });
    rec.start(250);
    const t0 = performance.now();
    await new Promise(res => {
      const passo = () => {
        const t = (performance.now() - t0) / 1000;
        desenharQuadro(g, spec, Math.min(t, spec.duracao - 0.01));
        aoProgresso && aoProgresso(Math.min(1, t / spec.duracao));
        if (t < spec.duracao + 0.15) requestAnimationFrame(passo); else res();
      };
      requestAnimationFrame(passo);
    });
    rec.stop(); await parou; stream.getTracks().forEach(tr => tr.stop()); c.remove();
    const tipo = (rec.mimeType || mime || 'video/webm').split(';')[0];
    return new Blob(partes, { type: tipo });
  }

  function renderVideo(r, box) {
    const { el, fmtData } = A();
    const spec = r.video, n = r.noticia || {};
    const rel = el('div', { class: 'rel' });
    rel.append(el('div', { class: 'rel-cab' },
      el('div', {}, el('h2', {}, '🎬 Vídeo para o Instagram'),
        el('p', {}, `Feito por ${r.funcionario?.nome || 'Enzo'} em ${fmtData(r.criadoEm)} · formato ${spec.formato} (feed) · ${spec.duracao}s`),
        el('div', { class: 'chips' }, el('span', { class: 'chip ok' }, '🎞️ Motion design'), el('span', { class: 'chip' }, '📝 Legenda pronta'), el('span', { class: 'chip' }, 'Fundo: ' + spec.fundo))),
      el('div', { class: 'rel-bts' }, el('button', { class: 'bt peq perigo', onclick: () => A().apagarRel(r) }, '🗑️ Apagar'))));
    const cv = el('canvas', { width: 540, height: 675, class: 'video-cv' });
    const g = cv.getContext('2d');
    let tocando = true, t0 = performance.now(), pausadoEm = 0;
    const btPlay = el('button', { class: 'bt peq', onclick: () => { if (tocando) { pausadoEm = (performance.now() - t0) / 1000; tocando = false; btPlay.textContent = '▶ Tocar'; } else { t0 = performance.now() - pausadoEm * 1000; tocando = true; btPlay.textContent = '⏸ Pausar'; } } }, '⏸ Pausar');
    const btDe = el('button', { class: 'bt peq', onclick: () => { t0 = performance.now(); pausadoEm = 0; tocando = true; btPlay.textContent = '⏸ Pausar'; } }, '↺ Do começo');
    const status = el('small', { class: 'vazio' });
    const celular = !KM.ehPC;
    const btBaixar = el('button', {
      class: 'bt prim', onclick: async () => {
        btBaixar.disabled = true;
        try {
          const blob = await gravarVideo(spec, k => { status.textContent = `Gravando o vídeo… ${Math.round(k * 100)}% (deixe esta tela aberta)`; });
          const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
          const nome = `KWIK - ${curto(n.titulo || 'video', 40).replace(/[\\/:*?"<>|…]/g, '')}.${ext}`;
          const arq = new File([blob], nome, { type: blob.type });
          if (celular && navigator.canShare && navigator.canShare({ files: [arq] })) {
            status.textContent = 'Pronto! Escolha "Salvar vídeo" ou o Instagram 📲';
            await navigator.share({ files: [arq], text: r.legenda }).catch(() => {});
          } else {
            const a = el('a', { href: URL.createObjectURL(blob), download: nome }); document.body.append(a); a.click(); a.remove();
            status.textContent = `Baixado: ${nome}` + (ext === 'webm' ? ' (WebM — o Instagram aceita; se precisar, converta para MP4)' : '');
          }
        } catch (e) { status.textContent = '❌ ' + e.message; }
        btBaixar.disabled = false;
      },
    }, celular ? '📲 Salvar / compartilhar' : '⬇️ Baixar vídeo');
    const legenda = el('pre', { class: 'legenda' }, r.legenda);
    const btCopiar = el('button', { class: 'bt peq', onclick: async () => { try { await navigator.clipboard.writeText(r.legenda); A().toast('Legenda copiada 📋'); } catch (e) { A().toast('Não consegui copiar.', { erro: true }); } } }, '📋 Copiar legenda');
    rel.append(el('div', { class: 'video-grade' },
      el('div', { class: 'video-col' }, cv, el('div', { class: 'video-bts' }, btPlay, btDe, btBaixar), status,
        el('h3', { class: 'leg-tit' }, '📝 Legenda ', btCopiar), legenda),
      el('div', {},
        el('h3', {}, '📰 Notícia escolhida'),
        el('p', {}, el('a', { href: n.url, target: '_blank', rel: 'noopener', class: 'tit' }, n.titulo)),
        n.resumo ? el('p', { class: 'vazio' }, n.resumo) : null,
        el('h3', { style: 'margin-top:18px' }, '🎞️ Roteiro'),
        el('ol', { class: 'roteiro' }, spec.cenas.map(c => el('li', {}, el('b', {}, `${c.ini.toFixed(1)}s · `), c.tipo === 'pontos' ? c.itens.join(' / ') : c.tipo === 'fim' ? 'Encerramento com a marca KWIK' : String(c.texto || '').replace(/\*/g, '')))),
        el('p', { class: 'vazio', style: 'font-size:12px' }, 'O vídeo sai sem música: no Instagram, escolha um áudio em alta antes de postar. Cada vídeo usa um fundo e efeitos diferentes; as letras e a marca seguem o padrão KWIK.'))));
    box.append(rel);
    prepararFontes().then(() => {
      const passo = () => {
        if (!cv.isConnected) return;
        const t = tocando ? ((performance.now() - t0) / 1000) % spec.duracao : pausadoEm;
        g.setTransform(0.5, 0, 0, 0.5, 0, 0); desenharQuadro(g, spec, t);
        requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }

  // ================================================================== LENA · primeiro contato pelo WhatsApp Business
  const SAUDE = /cl[íi]nica|consult[óo]rio|odonto|laborat|fisio|psico|[óo]tica|terapia|fono|nutri|podolog|veterin/i;
  const MODELOS = {
    saude: [
      'Olá, tudo bem? Aqui é o {dono}, dono da {empresa} 👋\n\nVi a {nome}, em {cidade}, e quis falar com vocês: a {empresa} cuida de impostos, folha de pagamento e toda a parte fiscal de clínicas e consultórios, com atendimento próximo.\n\nVocê teria 15 minutos esta semana para uma conversa rápida? Pode ser por aqui mesmo ou por ligação. Qual dia e horário ficam melhores pra você?',
      'Oi! Tudo bem? Meu nome é {dono}, sou dono da {empresa}.\n\nEstou conversando com clínicas de {cidade} para entender como está a contabilidade hoje e mostrar como a {empresa} pode ajudar a {nome} a organizar impostos, folha e a parte fiscal.\n\nPodemos marcar uma reunião rápida (15 a 20 minutos) esta semana? Me diz o melhor dia e horário 🙂',
    ],
    outras: [
      'Olá, tudo bem? Aqui é o {dono}, dono da {empresa} 👋\n\nGostaria de apresentar o nosso trabalho para a {nome}: cuidamos da contabilidade de empresas com atendimento próximo e tudo explicado sem complicação.\n\nVocê teria 15 minutos esta semana para uma conversa rápida? Qual dia e horário ficam bons pra você?',
      'Oi! Aqui é o {dono}, dono da {empresa}.\n\nEstou entrando em contato com empresas de {cidade} e gostaria de entender como está a contabilidade da {nome} hoje — impostos, folha e obrigações em dia.\n\nTopa uma conversa rápida esta semana, por aqui ou por ligação? Me diz o melhor dia e horário 🙂',
    ],
  };
  function mensagem(item, i, ctx) {
    const lista = SAUDE.test(item.tipo || '') || item.grupo === 'saude' ? MODELOS.saude : MODELOS.outras;
    return lista[i % lista.length].replace(/\{(\w+)\}/g, (m, k) => ({ dono: ctx.dono, empresa: ctx.empresa, nome: item.nome, cidade: ctx.cidade }[k] ?? m));
  }

  async function trabalharContato(f, p) {
    if (p.trabalhando || semConexao()) return;
    const est = A().estado, cfg = A().cfg();
    const may = pessoaFuncao('prospeccao'), nomeM = may ? primeiro(may.id) : 'Maycon';
    const resumo = (est.relatorios || []).find(r => r.tipo === 'prospeccao');
    if (!resumo) {
      A().falar(p.id, `Preciso que o ${nomeM} busque clientes primeiro! 📞`, 3200);
      return A().toast(`💬 A Lena usa os contatos que o ${nomeM} encontra. Coloque ele para trabalhar primeiro 📞`, { ms: 7000 });
    }
    let rel;
    try { rel = await A().obterRelatorio(resumo.id); } catch (e) { return A().toast('Não consegui abrir a lista do Maycon: ' + e.message, { erro: true }); }
    const vistos = new Set(), leads = [];
    for (const [grupo, arr] of [['saude', rel.clinicas || []], ['outras', rel.outras || []]]) {
      for (const i of arr) {
        if (!i.tel || !i.tel.digitos || vistos.has(i.tel.digitos)) continue;
        vistos.add(i.tel.digitos); leads.push({ ...i, grupo });
      }
    }
    if (!leads.length) {
      A().falar(p.id, `O ${nomeM} ainda não achou ninguém com telefone 😕`, 3200);
      return A().toast(`💬 O último relatório do ${nomeM} não tem telefones. Peça uma nova busca (talvez em outra cidade).`, { ms: 8000 });
    }
    const ok = await KM.rodar('trabalho', async q => {
      A().pagar(f, q);
      A().iniciarPainelTarefa('💬 Primeiro contato pelo WhatsApp');
      A().callbacksTarefa(q, false).etapa(`Indo falar com o ${nomeM} 🚶‍♀️`);
      await irConversar(q, may, [
        ['eu', `${nomeM}, me passa os números dos clientes?`, 2300],
        ['alvo', `Tenho ${leads.length} com telefone! Toma 📇`, 2300],
        ['eu', 'Valeu! Vou preparar as mensagens 💬', 2200],
      ]);
    }, [p.id]);
    if (ok === false) return A().toast('A Lena está ocupada com outra coisa. Tente de novo 😉');

    p.trabalhando = true; p.digitando = true; est.trabalhoDe.contato = true; A().atualizarBotoes();
    const cb = A().callbacksTarefa(p, false);
    let erro, salvo;
    try {
      await produzir(p, cb, [['Separando quem tem telefone ☎️', 25, 2200], ['Escrevendo a apresentação ✍️', 50, 2600], ['Personalizando para cada empresa 💬', 75, 2600], ['Conferindo os números do WhatsApp 📱', 92, 2000]]);
      const cidade = String(rel.cidade || 'sua cidade').toLowerCase().replace(/(^|\s)(\S)/g, (m, e, l) => e + l.toUpperCase()).replace(/\s(D[aeo]s?)\s/g, (m, d) => ' ' + d.toLowerCase() + ' ');
      const ctx = { dono: cfg.marketing.dono || 'Kauã', empresa: cfg.marketing.empresa || 'KWIK Contabilidade', cidade };
      const contatos = leads.map((i, k) => ({ nome: i.nome, tipo: i.tipo, grupo: i.grupo, endereco: i.endereco || '', telefone: i.tel.texto, digitos: i.tel.digitos, celular: !!i.tel.celular, mensagem: mensagem(i, k, ctx) }));
      salvo = {
        id: agoraId('contatos'), tipo: 'contatos', criadoEm: agoraIso(), funcionario: { id: f.id, nome: f.nome }, tarefa: 'Primeiro contato com clientes',
        titulo: `Contatos em ${rel.cidade}-${rel.uf}`, cidade: rel.cidade, uf: rel.uf, origem: resumo.id, remetente: cfg.marketing.whats || '', contatos, qtdContatos: contatos.length, duracao: 10,
      };
      await A().BK().salvarRelatorio(salvo);
      cb.progresso(100);
    } catch (e) { erro = e; }
    p.trabalhando = false; p.digitando = false; est.trabalhoDe.contato = false; A().atualizarBotoes();
    if (erro) { A().falar(p.id, 'Não consegui terminar 😓', 3000); return A().toast('Lena: ' + erro.message, { erro: true, ms: 9000 }); }
    await A().carregarRelatorios(KM.resumoRelatorio(salvo));
    A().falar(p.id, `${salvo.qtdContatos} mensagens prontas! 💬`, 3000);
    A().toast(`💬 Lena preparou ${salvo.qtdContatos} mensagens de primeiro contato.`, { botao: ['Ver contatos', () => A().abrirRelatorio(salvo.id)], ms: 10000 });
    await A().concluir(f, p);
  }

  function renderContatos(r, box) {
    const { el, fmtData } = A();
    const cfg = A().cfg();
    cfg.contatos = cfg.contatos || { enviados: {} };
    const env = () => cfg.contatos.enviados;
    let filtro = 'pendentes', busca = '';
    const rel = el('div', { class: 'rel' });
    const chips = el('div', { class: 'chips' });
    const atualizarChips = () => {
      const feitos = r.contatos.filter(c => env()[c.digitos]).length;
      chips.innerHTML = '';
      chips.append(el('span', { class: 'chip ok' }, `💬 ${r.contatos.length} mensagens`), el('span', { class: 'chip ok' }, `✅ ${feitos} enviadas`), el('span', { class: 'chip' }, `⏳ ${r.contatos.length - feitos} pendentes`));
    };
    rel.append(el('div', { class: 'rel-cab' },
      el('div', {}, el('h2', {}, `💬 Primeiro contato · ${r.cidade}-${r.uf}`),
        el('p', {}, `Preparado por ${r.funcionario?.nome || 'Lena'} em ${fmtData(r.criadoEm)} · só quem tem telefone na lista do Maycon`), chips),
      el('div', { class: 'rel-bts' },
        el('button', { class: 'bt peq', onclick: () => baixarCSV(r) }, '⬇️ Planilha (CSV)'),
        el('button', { class: 'bt peq perigo', onclick: () => A().apagarRel(r) }, '🗑️ Apagar'))));
    const whats = foneBonito(cfg.marketing.whats || r.remetente);
    rel.append(el('div', { class: 'obs' }, `📱 Envio pelo seu WhatsApp Business${whats ? ' ' + whats : ''}: toque em "Enviar no WhatsApp", confira se abriu a conta Business e aperte enviar. O app não manda sozinho — você revisa cada mensagem. Dica: envie aos poucos (10 a 15 por dia) para o WhatsApp não bloquear o número.`));
    const lista = el('div', { class: 'leads' });
    const bts = ['pendentes', 'enviados', 'todos'].map(fl => el('button', { class: fl === filtro ? 'on' : '', onclick: e => { filtro = fl; bts.forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); desenhar(); } }, { pendentes: 'Pendentes', enviados: 'Enviadas', todos: 'Todas' }[fl]));
    rel.append(el('div', { class: 'filtros' }, el('input', { type: 'search', placeholder: 'Buscar nome ou bairro…', oninput: e => { busca = e.target.value.toLowerCase(); desenhar(); } }), bts));
    const cartao = c => {
      const ta = el('textarea', { class: 'msg', rows: 6 }, c.mensagem);
      const marcar = () => { env()[c.digitos] = new Date().toISOString(); A().salvar(); setTimeout(desenhar, 400); };
      const quando = env()[c.digitos];
      return el('div', { class: 'lead contato' + (quando ? ' enviado' : '') },
        el('div', { class: 'lead-cab' }, el('b', {}, c.nome), el('span', { class: 'tipo' }, c.tipo || 'Empresa'),
          el('span', { class: 'chip' }, c.celular ? '📱 celular' : '☎️ fixo — pode não ter WhatsApp'),
          quando ? el('span', { class: 'novo' }, '✅ ENVIADA ' + new Date(quando).toLocaleDateString('pt-BR')) : null),
        el('small', {}, `☎️ ${c.telefone}${c.endereco ? ' · 📍 ' + c.endereco : ''}`),
        ta,
        el('div', { class: 'lead-bts' },
          el('a', { class: 'bt peq whats', href: '#', target: '_blank', rel: 'noopener', onclick: e => { e.currentTarget.href = `https://wa.me/${c.digitos}?text=${encodeURIComponent(ta.value)}`; marcar(); } }, '💬 Enviar no WhatsApp'),
          el('button', { class: 'bt peq', onclick: async () => { try { await navigator.clipboard.writeText(ta.value); A().toast('Mensagem copiada 📋'); } catch (e) { A().toast('Não consegui copiar.', { erro: true }); } } }, '📋 Copiar'),
          quando ? el('button', { class: 'bt peq', onclick: () => { delete env()[c.digitos]; A().salvar(); desenhar(); } }, '↺ Desmarcar') : null));
    };
    const desenhar = () => {
      lista.innerHTML = '';
      const itens = r.contatos.filter(c => (filtro === 'todos' || (filtro === 'enviados') === !!env()[c.digitos]) && (!busca || (c.nome + ' ' + c.endereco).toLowerCase().includes(busca)));
      itens.forEach(c => lista.append(cartao(c)));
      if (!itens.length) lista.append(el('p', { class: 'vazio' }, filtro === 'pendentes' ? 'Tudo enviado por aqui! 🎉' : 'Nada neste filtro.'));
      atualizarChips();
    };
    rel.append(lista);
    box.append(rel);
    desenhar();
  }
  function baixarCSV(r) {
    const linha = cols => cols.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';');
    const env = (A().cfg().contatos || {}).enviados || {};
    const l = [linha(['Nome', 'Tipo', 'Telefone', 'Celular', 'Endereço', 'Enviada em', 'Link WhatsApp', 'Mensagem'])];
    for (const c of r.contatos) l.push(linha([c.nome, c.tipo, c.telefone, c.celular ? 'sim' : 'não', c.endereco, env[c.digitos] ? new Date(env[c.digitos]).toLocaleDateString('pt-BR') : '', `https://wa.me/${c.digitos}`, c.mensagem]));
    const blob = new Blob(['﻿' + l.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = A().el('a', { href: URL.createObjectURL(blob), download: `Contatos ${r.cidade}-${r.uf} ${r.criadoEm.slice(0, 10)}.csv` });
    document.body.append(a); a.click(); a.remove();
  }

  KM.marketing = { trabalharVideo, trabalharContato, renderVideo, renderContatos, desenharQuadro, montarVideo, montarLegenda, gravarVideo, prepararFontes };
})();
