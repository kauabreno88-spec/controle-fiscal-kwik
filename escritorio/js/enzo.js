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
  function montarLegenda(n, cfg, spec) {
    const texto = `${n.titulo} ${(n.temas || []).join(' ')} ${n.categoria || ''}`;
    const tags = ['#contabilidade', '#kwikcontabilidade'];
    for (const [re, h] of HASHTAGS) if (re.test(texto) && !tags.includes(h)) tags.push(h);
    ['#empreendedorismo', '#impostos', '#pequenasempresas'].forEach(x => { if (tags.length < 7 && !tags.includes(x)) tags.push(x); });
    const g = semMarca(spec.cenas[0].texto);
    const corpo = spec.cenas.filter(c => c.tipo === 'ponto').slice(0, 2).map(c => semMarca(c.texto)).join(' ');
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
    } else if (cena.texto) {
      txt({ texto: cena.texto, y: topo + 150, tam: 80, peso: 900 });
    }
    for (const c of spec.cenas.slice(1)) { // transição: faixa verde varrendo a tela
      const k = (t - (c.ini - 0.28)) / 0.56;
      if (k > 0 && k < 1) { const x = -W + 2 * W * ease(k); g.fillStyle = spec.fundo === 'verde' ? GRAFITE : VERDE; g.fillRect(x, 0, W, H); g.fillStyle = spec.fundo === 'verde' ? VERDE : GRAFITE; g.fillRect(x + W - 26, 0, 26, H); }
    }
    g.restore();
  }

  // ------------------------------------------------------------------ música (sintetizada, vai junto no vídeo)
  let ruidoBuf = null;
  function trilha(ac, destino, spec, desde = 0) {
    const m = spec.musica || { bpm: 104, prog: 0 }, beat = 60 / m.bpm, total = spec.duracao;
    const t0 = ac.currentTime + 0.08 - desde;
    if (!ruidoBuf) { ruidoBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = ruidoBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const mestre = ac.createGain(); mestre.connect(destino);
    mestre.gain.setValueAtTime(0.0001, ac.currentTime); mestre.gain.exponentialRampToValueAtTime(0.55, ac.currentTime + 0.5);
    const fimT = t0 + total; mestre.gain.setValueAtTime(0.55, Math.max(ac.currentTime + 0.6, fimT - 1.5)); mestre.gain.linearRampToValueAtTime(0.0001, Math.max(ac.currentTime + 0.7, fimT));
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
      nota(150, tt, 0.22, 'sine', intro ? 0.25 : 0.6, 42); // bumbo
      if (!intro) ruido(tt + beat / 2, 0.05, 0.07, 'highpass', 7000); // chimbal
      if (k % 4 === 2 && !intro) ruido(tt, 0.14, 0.2, 'bandpass', 1800); // palma
      nota(hz(raiz - 12), tt, beat * 0.8, 'triangle', 0.22); // baixo
      if (k % 4 === 0) [0, terca, 7].forEach(iv => nota(hz(raiz + iv + 12), tt, beat * 3.8, 'triangle', 0.035)); // acorde
      if (!intro && k % 2 === 1 && r() < 0.7) nota(hz(raiz + 12 + sorteioDe([0, terca, 7, 12, 14], r)), tt + beat / 2, 0.18, 'square', 0.025);
    }
    for (const c of spec.cenas.slice(1)) ruido(t0 + c.ini - 0.3, 0.55, 0.16, 'bandpass', 400, 5000); // whoosh nas transições
    return { parar() { try { mestre.gain.cancelScheduledValues(ac.currentTime); mestre.gain.setValueAtTime(0.0001, ac.currentTime); mestre.disconnect(); } catch (e) { /* já parou */ } } };
  }
  const sorteioDe = (arr, r) => arr[Math.floor(r() * arr.length)];

  async function gravarVideo(spec, aoProgresso, desenhar = desenharQuadro) {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) throw new Error('este navegador não grava vídeo. Tente pelo Chrome no computador.');
    await prepararFontes();
    const c = document.createElement('canvas'); c.width = spec.w; c.height = spec.h;
    c.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;height:12px;opacity:0;pointer-events:none';
    document.body.append(c);
    const g = c.getContext('2d');
    desenhar(g, spec, 0);
    const video = c.captureStream(30);
    let ac = null, musica = null, faixas = [...video.getVideoTracks()];
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)(); await ac.resume();
      const dest = ac.createMediaStreamDestination(); musica = trilha(ac, dest, spec, 0); faixas = faixas.concat(dest.stream.getAudioTracks());
    } catch (e) { /* sem som */ }
    const stream = new MediaStream(faixas);
    const tipos = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mime = tipos.find(t => MediaRecorder.isTypeSupported(t)) || '';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8e6 } : {});
    const partes = []; rec.ondataavailable = e => { if (e.data && e.data.size) partes.push(e.data); };
    const parou = new Promise(res => { rec.onstop = res; });
    rec.start(250);
    const t0 = performance.now();
    await new Promise(res => {
      const passo = () => {
        const t = (performance.now() - t0) / 1000;
        desenhar(g, spec, Math.min(t, spec.duracao - 0.01));
        aoProgresso && aoProgresso(Math.min(1, t / spec.duracao));
        if (t < spec.duracao + 0.2) requestAnimationFrame(passo); else res();
      };
      requestAnimationFrame(passo);
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
    const nomeF = spec.formato === 'reels' ? 'Reels' : spec.formato === 'stories' ? 'Stories' : 'Vídeo do feed';
    const rel = el('div', { class: 'rel' });
    rel.append(el('div', { class: 'rel-cab' },
      el('div', {}, el('h2', {}, `🎬 ${nomeF} para o Instagram`),
        el('p', {}, `Feito por ${r.funcionario?.nome || 'Enzo'} em ${fmtData(r.criadoEm)} · ${vert ? '9:16' : '4:5'} · ${Math.round(spec.duracao)} s`),
        el('div', { class: 'chips' }, el('span', { class: 'chip ok' }, '🎞️ Motion design'), spec.musica ? el('span', { class: 'chip ok' }, '🎵 Com música') : el('span', { class: 'chip' }, 'Sem música'),
          r.leuArtigo ? el('span', { class: 'chip' }, '📖 Leu a notícia completa') : null, el('span', { class: 'chip' }, 'Fundo: ' + spec.fundo))),
      el('div', { class: 'rel-bts' }, el('button', { class: 'bt peq perigo', onclick: () => A().apagarRel(r) }, '🗑️ Apagar'))));
    const cv = el('canvas', { width: spec.w / 2, height: spec.h / 2, class: 'video-cv' + (vert ? ' vertical' : '') });
    const g = cv.getContext('2d');
    let tocando = true, t0 = performance.now(), pausadoEm = 0, som = false, ac = null, musica = null;
    const tempo = () => (tocando ? ((performance.now() - t0) / 1000) : pausadoEm);
    const pararSom = () => { musica && musica.parar(); musica = null; };
    const tocarSom = () => { pararSom(); if (!som || !spec.musica) return; ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); musica = trilha(ac, ac.destination, spec, tempo() % spec.duracao); };
    const btPlay = el('button', { class: 'bt peq', onclick: () => { if (tocando) { pausadoEm = tempo() % spec.duracao; tocando = false; btPlay.textContent = '▶ Tocar'; pararSom(); } else { t0 = performance.now() - pausadoEm * 1000; tocando = true; btPlay.textContent = '⏸ Pausar'; tocarSom(); } } }, '⏸ Pausar');
    const btDe = el('button', { class: 'bt peq', onclick: () => { t0 = performance.now(); pausadoEm = 0; tocando = true; btPlay.textContent = '⏸ Pausar'; tocarSom(); } }, '↺ Do começo');
    const btSom = el('button', { class: 'bt peq', onclick: () => { som = !som; btSom.textContent = som ? '🔊 Som ligado' : '🔇 Ouvir música'; if (som) { t0 = performance.now(); pausadoEm = 0; tocando = true; btPlay.textContent = '⏸ Pausar'; } tocarSom(); } }, '🔇 Ouvir música');
    const status = el('small', { class: 'vazio' });
    const btBaixar = el('button', {
      class: 'bt prim', onclick: async () => {
        btBaixar.disabled = true; pararSom();
        try {
          const blob = await gravarVideo(spec, k => { status.textContent = `Gravando o vídeo com música… ${Math.round(k * 100)}% (deixe esta tela aberta)`; });
          await baixarArquivo(blob, nomeArq(n.titulo, blob.type.includes('mp4') ? 'mp4' : 'webm'), r.legenda, status);
        } catch (e) { status.textContent = '❌ ' + e.message; }
        btBaixar.disabled = false;
      },
    }, '⬇️ Baixar vídeo');
    rel.append(el('div', { class: 'video-grade' },
      el('div', { class: 'video-col' }, cv, el('div', { class: 'video-bts' }, btPlay, btDe, spec.musica ? btSom : null, btBaixar), status, ...blocoLegenda(r)),
      el('div', {},
        el('h3', {}, '📰 Notícia escolhida'),
        el('p', {}, el('a', { href: n.url, target: '_blank', rel: 'noopener', class: 'tit' }, n.titulo)),
        n.resumo ? el('p', { class: 'vazio' }, n.resumo) : null,
        el('h3', { style: 'margin-top:18px' }, '🎞️ Roteiro'),
        el('ol', { class: 'roteiro' }, spec.cenas.map(c => el('li', {}, el('b', {}, `${c.ini.toFixed(1)}s · `), c.tipo === 'pontos' || c.tipo === 'lista' ? c.itens.join(' / ') : c.tipo === 'fim' ? 'Encerramento com a marca KWIK' : semMarca(c.texto)))),
        el('p', { class: 'vazio', style: 'font-size:12px' }, 'A música é criada pelo app e gravada junto no vídeo (sem direitos autorais). A gravação acontece em tempo real: deixe a tela aberta até terminar.'))));
    box.append(rel);
    prepararFontes().then(() => {
      let voltas = 0;
      const passo = () => {
        if (!cv.isConnected) { pararSom(); return; }
        const tt = tempo(), volta = Math.floor(tt / spec.duracao);
        if (tocando && volta !== voltas) { voltas = volta; if (som) tocarSom(); }
        g.setTransform(0.5, 0, 0, 0.5, 0, 0); desenharQuadro(g, spec, tt % spec.duracao);
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

  Object.assign(KM.marketing, { trabalharVideo, trabalharPost, renderVideo, renderPost, desenharQuadro, desenharPost, montarVideo, montarPost, montarLegenda, gravarVideo, trilha, prepararFontes, frasesArtigo });
})();
