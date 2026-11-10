/* KWIK Mini Escritório · Fazendinha KWIK (mini jogo).
   O Kauã cuida de um sítio: ara a terra, planta, rega, colhe e vende na caixinha; compra sementes e melhorias na
   barraca, cria galinhas, pesca no laguinho e vai dormir para começar o dia seguinte. Plantas só crescem nos dias
   em que foram regadas (ou choveu). O progresso fica salvo junto com o escritório (aparelho e nuvem).
   Toque num quadradinho: o Kauã anda até lá e faz a ação certa (arar → plantar a semente escolhida → regar → colher).
   No PC também dá para andar com as setas/WASD e agir com espaço. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  const el = (...a) => A().el(...a);
  const TS = 24, COLS = 16, ROWS = 11, W = COLS * TS, H = ROWS * TS;
  // mapa: t árvore · h casa · s barraca · b caixa de venda · p caminho · g grama · c canteiro · w lago · x terra extra (comprável) · k galinheiro (comprável)
  const MAPA = [
    'tttttttttttttttt',
    'thhhggggggggsssg',
    'thhhggggggggsssg',
    'tgpbggggggggggpt',
    'tgpppppppppppppt',
    'tggccccccccggggt',
    'tggccccccccgwwwt',
    'tggccccccccgwwwt',
    'tggccccccccggwgt',
    'tkkxxxxxxxxxxggt',
    'tttttttttttttttt',
  ];
  const PLANTAS = {
    alface: { nome: 'Alface', ic: '🥬', dias: 3, semente: 15, venda: 35 },
    cenoura: { nome: 'Cenoura', ic: '🥕', dias: 4, semente: 25, venda: 60 },
    morango: { nome: 'Morango', ic: '🍓', dias: 6, semente: 60, venda: 75, volta: 3 },
    tomate: { nome: 'Tomate', ic: '🍅', dias: 6, semente: 45, venda: 70, volta: 3 },
    milho: { nome: 'Milho', ic: '🌽', dias: 8, semente: 70, venda: 210 },
    abobora: { nome: 'Abóbora', ic: '🎃', dias: 10, semente: 120, venda: 390 },
  };
  const ITENS = { ...Object.fromEntries(Object.entries(PLANTAS).map(([k, p]) => [k, { nome: p.nome, ic: p.ic, venda: p.venda }])), ovo: { nome: 'Ovo', ic: '🥚', venda: 40 }, peixe: { nome: 'Peixe', ic: '🐟', venda: 55 } };
  const MELHORIAS = {
    regador: { nome: 'Regador grande', ic: '🚿', preco: 600, desc: 'Rega a planta e as duas do lado, sem gastar energia.' },
    terra: { nome: 'Mais terra', ic: '🟫', preco: 900, desc: 'Libera mais 10 canteiros embaixo.' },
    galinheiro: { nome: 'Galinheiro', ic: '🐔', preco: 1200, desc: 'Vem com 2 galinhas. Cada galinha bota 1 ovo por dia.' },
    galinha: { nome: 'Mais uma galinha', ic: '🐓', preco: 350, desc: 'Até 6 galinhas.', precisa: 'galinheiro' },
    espantalho: { nome: 'Espantalho', ic: '🧑‍🌾', preco: 250, desc: 'Os corvos param de bicar a plantação.' },
  };
  const CLIMA = { sol: '☀️ Sol', nublado: '⛅ Nublado', chuva: '🌧️ Chuva (rega tudo)' };
  const novo = () => ({ v: 1, dia: 1, min: 360, moedas: 300, energia: 100, clima: 'sol', sel: 'alface', sem: { alface: 6, cenoura: 2 }, inv: {}, plots: {}, up: {}, galinhas: 0, ovos: 0, pescou: 0, kx: 2, ky: 4 });
  let S = null, aberta = false, raf = 0, ultimo = 0, kaua = { x: 2 * TS + 12, y: 4 * TS + 20, alvo: null, caminho: [], dir: 'fe', passo: 0, acao: null }, msgs = [], tAnt = 0, salvarT = null;
  const cfg = () => A().cfg();
  function carregar() { const c = cfg(); c.fazenda = c.fazenda && c.fazenda.v ? c.fazenda : novo(); S = c.fazenda; S.kx = S.kx || 2; S.ky = S.ky || 4; }
  function salvar() { clearTimeout(salvarT); salvarT = setTimeout(() => A().salvar(), 800); }
  const chave = (c, r) => c + ',' + r;
  function tipoEm(c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return 't';
    const t = MAPA[r][c];
    if (t === 'x') return S.up.terra ? 'c' : 'g';
    if (t === 'k') return S.up.galinheiro ? 'k' : 'g';
    return t;
  }
  const anda = (c, r) => { const t = tipoEm(c, r); return t === 'g' || t === 'p' || t === 'c'; };
  const aviso = (txt, cor) => { msgs.push({ txt, ate: performance.now() + 2600, cor }); if (msgs.length > 3) msgs.shift(); atualizarHud(); };

  // ------------------------------------------------------------------ dias, plantas, clima
  function dormir(desmaiou) {
    const choveu = S.clima === 'chuva';
    let corvo = null;
    for (const [k, p] of Object.entries(S.plots)) {
      if (!p.tipo) { p.regado = false; continue; }
      if (p.regado || choveu) p.dias = (p.dias || 0) + 1;
      p.regado = false;
    }
    if (!S.up.espantalho && S.dia >= 4) { const ps = Object.entries(S.plots).filter(([, p]) => p.tipo && (p.dias || 0) > 0); if (ps.length >= 3 && Math.random() < 0.12) { const [k, p] = ps[Math.floor(Math.random() * ps.length)]; corvo = PLANTAS[p.tipo].nome; S.plots[k] = { arado: true }; } }
    S.ovos += S.up.galinheiro ? S.galinhas : 0;
    S.dia++; S.min = 360; S.energia = desmaiou ? 60 : 100; S.pescou = 0;
    S.clima = Math.random() < 0.22 ? 'chuva' : Math.random() < 0.35 ? 'nublado' : 'sol';
    if (S.clima === 'chuva') for (const p of Object.values(S.plots)) if (p.tipo) p.regado = true;
    S.kx = 2; S.ky = 4; kaua.x = 2 * TS + 12; kaua.y = 4 * TS + 20; kaua.caminho = []; kaua.acao = null;
    salvar(); atualizarHud();
    aviso(`${desmaiou ? '😵 Ficou tarde e você dormiu no caminho. ' : '😴 Bom dia! '}Dia ${S.dia} · ${CLIMA[S.clima]}`);
    if (corvo) setTimeout(() => aviso(`🐦‍⬛ Um corvo bicou um pé de ${corvo}. Um espantalho resolve!`, '#c92a2a'), 900);
    if (S.ovos && S.up.galinheiro) setTimeout(() => aviso(`🥚 As galinhas botaram! Toque no galinheiro para pegar.`), 1800);
  }
  const maduro = p => p && p.tipo && (p.dias || 0) >= PLANTAS[p.tipo].dias;
  function gastar(e) { if (S.energia < e) { aviso('🥱 Sem energia. Vá dormir na casa!', '#c92a2a'); return false; } S.energia -= e; return true; }
  // a ação certa no quadradinho (c, r)
  function agir(c, r) {
    const t = tipoEm(c, r);
    if (t === 'h') return dormir(false);
    if (t === 's') return abrirLoja();
    if (t === 'b') return vender();
    if (t === 'k') { if (!S.ovos) return aviso('🐔 Nenhum ovo agora. As galinhas botam de noite.'); S.inv.ovo = (S.inv.ovo || 0) + S.ovos; aviso(`🥚 Pegou ${S.ovos} ovo${S.ovos > 1 ? 's' : ''}!`); S.ovos = 0; return salvar(); }
    if (t === 'w') {
      if (S.pescou >= 5) return aviso('🎣 Os peixes cansaram por hoje.');
      if (!gastar(4)) return;
      S.pescou++; if (Math.random() < 0.55) { S.inv.peixe = (S.inv.peixe || 0) + 1; aviso('🐟 Pegou um peixe!'); } else aviso('🎣 Escapou…');
      return salvar();
    }
    if (t !== 'c') return;
    const k = chave(c, r), p = S.plots[k] || {};
    if (maduro(p)) { // colher
      const pl = PLANTAS[p.tipo]; S.inv[p.tipo] = (S.inv[p.tipo] || 0) + 1;
      aviso(`${pl.ic} Colheu ${pl.nome}!`); KM.tocar && KM.tocar('sucesso');
      S.plots[k] = pl.volta ? { tipo: p.tipo, dias: pl.dias - pl.volta, arado: true } : { arado: true };
      return salvar();
    }
    if (!p.arado) { if (!gastar(3)) return; S.plots[k] = { arado: true }; return salvar(); }
    if (!p.tipo) {
      if (!(S.sem[S.sel] > 0)) return aviso(`Sem sementes de ${PLANTAS[S.sel].nome}. Compre na barraca 🛒`, '#c92a2a');
      S.sem[S.sel]--; S.plots[k] = { arado: true, tipo: S.sel, dias: 0, regado: S.clima === 'chuva' }; aviso(`🌱 Plantou ${PLANTAS[S.sel].nome}`);
      atualizarHud(); return salvar();
    }
    if (!p.regado) {
      if (!S.up.regador && !gastar(1)) return;
      p.regado = true;
      if (S.up.regador) for (const dc of [-1, 1]) { const q = S.plots[chave(c + dc, r)]; if (q && q.tipo) q.regado = true; }
      return salvar();
    }
    const pl = PLANTAS[p.tipo]; aviso(`${pl.ic} ${pl.nome}: falta${pl.dias - (p.dias || 0) > 1 ? 'm' : ''} ${pl.dias - (p.dias || 0)} dia${pl.dias - (p.dias || 0) > 1 ? 's' : ''} (já regada hoje)`);
  }
  function vender() {
    let total = 0, n = 0;
    for (const [k, q] of Object.entries(S.inv)) if (q > 0 && ITENS[k]) { total += q * ITENS[k].venda; n += q; S.inv[k] = 0; }
    if (!n) return aviso('📦 Nada para vender. Colha alguma coisa primeiro!');
    S.moedas += total; KM.tocar && KM.tocar('moeda'); aviso(`💰 Vendeu ${n} ite${n > 1 ? 'ns' : 'm'} por ${total} moedas!`, '#2b8a3e'); salvar(); atualizarHud();
  }

  // ------------------------------------------------------------------ andar (caminho pela grade)
  function caminho(c0, r0, c1, r1) {
    const fila = [[c0, r0]], de = new Map([[chave(c0, r0), null]]);
    while (fila.length) {
      const [c, r] = fila.shift(); if (c === c1 && r === r1) break;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nc = c + dc, nr = r + dr, k = chave(nc, nr); if (!de.has(k) && anda(nc, nr)) { de.set(k, [c, r]); fila.push([nc, nr]); } }
    }
    if (!de.has(chave(c1, r1))) return null;
    const out = []; let cur = [c1, r1]; while (cur) { out.unshift(cur); cur = de.get(chave(cur[0], cur[1])); } return out.slice(1);
  }
  function tocar(c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
    // vai até o quadradinho (se dá para pisar) ou até o vizinho mais perto e faz a ação
    const alvos = anda(c, r) ? [[c, r]] : [[c, r + 1], [c, r - 1], [c - 1, r], [c + 1, r]].filter(([a, b]) => anda(a, b));
    let melhor = null; for (const [a, b] of alvos) { const cm = caminho(S.kx, S.ky, a, b); if (cm && (!melhor || cm.length < melhor.length)) melhor = cm; }
    if (!melhor) return aviso('Não dá para chegar aí 🙃');
    kaua.caminho = melhor; kaua.acao = [c, r];
  }
  function atualizar(dt) {
    if (!S) return;
    S.min += dt * 4; // 1 minuto do jogo a cada 0,25 s (um dia ≈ 4 min)
    if (S.min >= 24 * 60) { dormir(true); return; }
    if (kaua.caminho.length) {
      const [c, r] = kaua.caminho[0], tx = c * TS + 12, ty = r * TS + 20, dx = tx - kaua.x, dy = ty - kaua.y, d = Math.hypot(dx, dy), v = 90 * dt;
      kaua.dir = dy < -Math.abs(dx) * 0.6 ? 'ce' : dx > 0.5 ? 'fd' : dx < -0.5 ? 'fe' : kaua.dir;
      if (d <= v) { kaua.x = tx; kaua.y = ty; S.kx = c; S.ky = r; kaua.caminho.shift(); } else { kaua.x += dx / d * v; kaua.y += dy / d * v; }
      kaua.passo += dt * 8;
    } else if (kaua.acao) { const [c, r] = kaua.acao; kaua.acao = null; agir(c, r); atualizarHud(); }
  }

  // ------------------------------------------------------------------ desenho (pixel art)
  const r = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const hashT = (c, l) => ((c * 73856093) ^ (l * 19349663)) >>> 0;
  function desenhar(g, t) {
    g.imageSmoothingEnabled = false;
    for (let l = 0; l < ROWS; l++) for (let c = 0; c < COLS; c++) {
      const x = c * TS, y = l * TS, tp = tipoEm(c, l), hs = hashT(c, l);
      r(g, x, y, TS, TS, '#7cc35a'); for (let i = 0; i < 4; i++) r(g, x + ((hs >> (i * 4)) % 22), y + ((hs >> (i * 5 + 2)) % 22), 2, 2, i % 2 ? '#6db04e' : '#8fd06a');
      if (tp === 'p') { r(g, x, y, TS, TS, '#e2cc96'); r(g, x + (hs % 18), y + ((hs >> 3) % 18), 3, 2, '#cdb37a'); r(g, x + ((hs >> 6) % 18), y + ((hs >> 9) % 18), 2, 2, '#f0dcae'); }
      if (tp === 'w') { r(g, x, y, TS, TS, '#4dabf7'); const o = Math.floor(t * 2 + c + l) % 3; r(g, x + 4 + o * 4, y + 8, 6, 1, '#a5d8ff'); r(g, x + 12 - o * 3, y + 16, 5, 1, '#a5d8ff'); }
      if (tp === 'c') {
        const p = S.plots[chave(c, l)] || {};
        if (!p.arado) { r(g, x + 2, y + 2, TS - 4, TS - 4, '#73b552'); r(g, x + 2, y + 2, TS - 4, 1, '#5f9a43'); }
        else { r(g, x + 1, y + 1, TS - 2, TS - 2, p.regado ? '#5e3b1c' : '#8b5a2b'); for (let k = 0; k < 3; k++) r(g, x + 3, y + 5 + k * 7, TS - 6, 2, p.regado ? '#4a2e15' : '#6e4520'); }
        if (p.tipo) planta(g, x, y, p, t);
      }
      if (tp === 't') { r(g, x + 10, y + 14, 4, 10, '#7a5432'); r(g, x + 3, y + 2, 18, 14, '#3c9a4a'); r(g, x + 5, y, 14, 6, '#4fb05c'); r(g, x + 6, y + 4, 4, 3, '#69c46a'); }
    }
    // casa
    { const x = 1 * TS, y = 1 * TS; r(g, x, y + 14, 3 * TS, 2 * TS - 14, '#f1e3c8'); for (let k = 0; k < 4; k++) r(g, x - 4 + k * 2, y - 2 + k * 5, 3 * TS + 8 - k * 4, 5, k % 2 ? '#a5302a' : '#c0392b');
      r(g, x + 30, y + 30, 12, 18, '#8d5a3b'); r(g, x + 39, y + 39, 2, 2, '#ffd43b'); r(g, x + 8, y + 24, 14, 10, '#a5d8ff'); r(g, x + 50, y + 24, 14, 10, '#a5d8ff'); r(g, x + 14, y + 24, 2, 10, '#ffffff');
      r(g, x + 22, y + 15, 28, 7, '#1E8A45'); KM.texto(g, 'KWIK', x + 28, y + 16, '#ffffff'); }
    // barraca
    { const x = 12 * TS, y = 1 * TS; r(g, x + 2, y + 18, 3 * TS - 4, 2 * TS - 18, '#c98a55'); for (let k = 0; k < 9; k++) r(g, x + k * 8, y + 8, 8, 10, k % 2 ? '#ffffff' : '#28BE52'); r(g, x, y + 18, 3 * TS, 2, '#1E8A45');
      r(g, x + 10, y + 26, 10, 8, '#e03131'); r(g, x + 24, y + 26, 10, 8, '#fab005'); r(g, x + 38, y + 26, 10, 8, '#40c057'); KM.texto(g, 'LOJA', x + 26, y + 38, '#3b2a20'); }
    // caixa de venda
    { const x = 3 * TS, y = 3 * TS; r(g, x + 3, y + 6, 18, 16, '#a0693f'); r(g, x + 2, y + 4, 20, 4, '#7a4a2e'); r(g, x + 5, y + 12, 14, 1, '#7a4a2e'); r(g, x + 5, y + 17, 14, 1, '#7a4a2e'); if (Object.values(S.inv).some(v => v > 0)) r(g, x + 10, y, 4, 4, '#ffd43b'); }
    // galinheiro
    if (S.up.galinheiro) { const x = 1 * TS, y = 9 * TS; r(g, x + 2, y + 6, 2 * TS - 4, TS - 6, '#c0392b'); r(g, x, y + 2, 2 * TS, 6, '#7a2620'); r(g, x + 18, y + 12, 10, 10, '#3b2a20');
      for (let i = 0; i < Math.min(S.galinhas, 6); i++) { const gx = 2 * TS + 6 + i * 13 + Math.sin(t * 2 + i) * 3, gy = 8 * TS + 16 + (i % 2) * 6; r(g, gx, gy, 7, 6, '#ffffff'); r(g, gx + 5, gy - 2, 3, 3, '#ffffff'); r(g, gx + 7, gy - 1, 2, 1, '#fab005'); r(g, gx + 5, gy - 3, 2, 1, '#e03131'); }
      if (S.ovos) r(g, x + 36, y + 4, 4, 5, '#fff3bf'); }
    if (S.up.espantalho) { const x = 11 * TS + 6, y = 5 * TS; r(g, x + 5, y + 6, 2, 18, '#7a5432'); r(g, x, y + 10, 12, 2, '#7a5432'); r(g, x + 2, y + 6, 8, 8, '#4dabf7'); r(g, x + 3, y, 6, 6, '#f1c9a5'); r(g, x + 1, y - 2, 10, 3, '#e2b33c'); }
    // Kauã
    const f = A().cfg().funcionarios.find(q => q.id === 'f1');
    if (f) {
      const vista = kaua.dir === 'ce' ? 'costas' : 'frente', s = KM.sprite(f.aparencia, { passo: kaua.caminho.length ? [1, 0, 2, 0][Math.floor(kaua.passo) % 4] : 0, vista, boca: 'sorriso' });
      r(g, Math.round(kaua.x) - 7, Math.round(kaua.y) - 1, 14, 3, 'rgba(0,0,0,.2)');
      g.save(); g.translate(Math.round(kaua.x), Math.round(kaua.y)); if (kaua.dir === 'fd') g.scale(-1, 1); g.drawImage(s, -11, -32, 22, 34); g.restore();
    }
    // céu: chuva e fim de tarde/noite
    if (S.clima === 'chuva') { g.fillStyle = 'rgba(200,220,255,.55)'; for (let i = 0; i < 70; i++) { const x = (i * 53 + t * 220) % W, y = (i * 37 + t * 420) % H; g.fillRect(x, y, 1, 5); } g.fillStyle = 'rgba(40,60,90,.15)'; g.fillRect(0, 0, W, H); }
    const hora = S.min / 60, escuro = hora >= 18 ? Math.min(0.5, (hora - 18) / 6 * 0.6) : 0;
    if (escuro) { g.fillStyle = `rgba(20,24,70,${escuro})`; g.fillRect(0, 0, W, H); }
    // mensagens
    const ag = performance.now(); msgs = msgs.filter(m => m.ate > ag);
    msgs.forEach((m, i) => { g.font = '700 10px Montserrat, sans-serif'; const w = g.measureText(m.txt).width + 14; g.fillStyle = 'rgba(255,255,255,.94)'; g.fillRect(W / 2 - w / 2, 6 + i * 18, w, 15); g.fillStyle = m.cor || '#1c2b26'; g.textAlign = 'center'; g.fillText(m.txt, W / 2, 17 + i * 18); g.textAlign = 'left'; });
  }
  function planta(g, x, y, p, t) {
    const pl = PLANTAS[p.tipo], k = Math.min(1, (p.dias || 0) / pl.dias), cx = x + 12, base = y + 20;
    if (k < 0.01) { r(g, cx - 3, base - 3, 2, 2, '#e9d8a6'); r(g, cx + 1, base - 2, 2, 2, '#e9d8a6'); return; }
    if (k < 0.4) { r(g, cx, base - 6, 1, 6, '#2f9e44'); r(g, cx - 3, base - 7, 3, 2, '#40c057'); r(g, cx + 1, base - 8, 3, 2, '#40c057'); return; }
    if (k < 1) { const h = 6 + Math.round(8 * k); r(g, cx, base - h, 2, h, '#2f9e44'); r(g, cx - 5, base - h + 2, 5, 3, '#40c057'); r(g, cx + 2, base - h, 5, 3, '#40c057'); r(g, cx - 4, base - h + 7, 4, 2, '#51cf66'); return; }
    const bal = Math.sin(t * 3 + x) > 0.85 ? -1 : 0; // planta pronta dá uma "pulada" de vez em quando
    if (p.tipo === 'alface') { r(g, cx - 6, base - 9 + bal, 12, 9, '#40c057'); r(g, cx - 4, base - 11 + bal, 8, 4, '#8ce99a'); }
    else if (p.tipo === 'cenoura') { r(g, cx - 3, base - 13 + bal, 2, 6, '#2f9e44'); r(g, cx + 1, base - 14 + bal, 2, 7, '#40c057'); r(g, cx - 3, base - 7 + bal, 6, 4, '#f76707'); r(g, cx - 2, base - 3 + bal, 4, 2, '#f76707'); }
    else if (p.tipo === 'tomate' || p.tipo === 'morango') { const cor = p.tipo === 'tomate' ? '#e03131' : '#f03e3e', s = p.tipo === 'tomate' ? 4 : 3; r(g, cx, base - 18, 1, 18, '#a0693f'); r(g, cx - 6, base - 14, 12, 8, '#2f9e44'); r(g, cx - 5, base - 10 + bal, s, s, cor); r(g, cx + 2, base - 13 + bal, s, s, cor); r(g, cx - 1, base - 6 + bal, s, s, cor); }
    else if (p.tipo === 'milho') { r(g, cx, base - 22, 2, 22, '#2f9e44'); r(g, cx - 5, base - 16, 5, 2, '#40c057'); r(g, cx + 2, base - 12, 5, 2, '#40c057'); r(g, cx + 2, base - 19 + bal, 3, 7, '#ffd43b'); }
    else if (p.tipo === 'abobora') { r(g, cx - 7, base - 9 + bal, 14, 9, '#f76707'); r(g, cx - 3, base - 9 + bal, 1, 9, '#d9480f'); r(g, cx + 2, base - 9 + bal, 1, 9, '#d9480f'); r(g, cx - 1, base - 12 + bal, 2, 3, '#2f9e44'); }
    r(g, x + 19, y + 1, 4, 4, '#ffd43b'); // sinal de pronta
  }

  // ------------------------------------------------------------------ tela
  function montar() {
    if ($('#fazenda')) return;
    const box = el('div', { id: 'fazenda', class: 'faz', hidden: true });
    box.innerHTML = `<div class="faz-topo"><b>🌾 Fazendinha KWIK</b><span id="fzDia"></span><span id="fzMoedas"></span><div class="faz-energia" title="Energia"><i id="fzEnergia"></i></div>
      <button class="bt peq" id="fzLoja">🛒 Loja</button><button class="bt peq" id="fzVender">💰 Vender</button><button class="bt peq" id="fzDormir">😴 Dormir</button><button class="bt peq prim" id="fzSair">✕ Sair</button></div>
      <div class="faz-palco"><canvas id="fzTela" width="${W}" height="${H}"></canvas></div>
      <div class="faz-baixo"><div class="faz-sem" id="fzSem"></div><div class="faz-inv" id="fzInv"></div></div>
      <div class="faz-dica">Toque na terra: ara → planta a semente escolhida → rega → colhe. Casa = dormir · barraca = loja · caixinha = vender · lago = pescar · galinheiro = ovos.</div>
      <div class="faz-loja" id="fzLojaBox" hidden></div>`;
    document.body.append(box);
    $('#fzSair').addEventListener('click', fechar);
    $('#fzLoja').addEventListener('click', abrirLoja);
    $('#fzVender').addEventListener('click', vender);
    $('#fzDormir').addEventListener('click', () => { if (confirm('Dormir e começar o próximo dia?')) dormir(false); });
    $('#fzTela').addEventListener('click', e => { const cv = e.currentTarget, x = e.offsetX / cv.clientWidth * W, y = e.offsetY / cv.clientHeight * H; tocar(Math.floor(x / TS), Math.floor(y / TS)); });
    document.addEventListener('keydown', e => {
      if (!aberta || e.target.closest('input,textarea')) return;
      const d = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }[e.key];
      if (e.key === 'Escape') return fechar();
      if (d) { e.preventDefault(); if (!kaua.caminho.length && anda(S.kx + d[0], S.ky + d[1])) { kaua.caminho = [[S.kx + d[0], S.ky + d[1]]]; } kaua.olha = d; }
      if (e.key === ' ') { e.preventDefault(); const o = kaua.olha || [0, 1]; agir(S.kx + o[0], S.ky + o[1]); atualizarHud(); }
    });
  }
  function atualizarHud() {
    if (!S || !$('#fazenda')) return;
    const hh = Math.floor(S.min / 60), mm = Math.floor(S.min % 60);
    $('#fzDia').textContent = `Dia ${S.dia} · ${CLIMA[S.clima].split(' (')[0]} · ${String(hh % 24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    $('#fzMoedas').textContent = `🪙 ${S.moedas}`;
    $('#fzEnergia').style.width = S.energia + '%';
    const sem = $('#fzSem'); sem.innerHTML = '';
    for (const [k, p] of Object.entries(PLANTAS)) sem.append(el('button', { class: 'faz-semente' + (S.sel === k ? ' on' : ''), title: `${p.nome}: ${p.dias} dias${p.volta ? `, dá de novo a cada ${p.volta}` : ''} · vende por ${p.venda}`, onclick: () => { S.sel = k; atualizarHud(); salvar(); } }, `${p.ic} ${S.sem[k] || 0}`));
    const inv = $('#fzInv'); inv.innerHTML = '';
    const itens = Object.entries(S.inv).filter(([, q]) => q > 0);
    inv.append(el('small', {}, itens.length ? 'Colhido: ' : 'Nada colhido ainda'), ...itens.map(([k, q]) => el('span', {}, `${ITENS[k].ic}×${q}`)));
  }
  function abrirLoja() {
    const box = $('#fzLojaBox'); box.hidden = false; box.innerHTML = '';
    box.append(el('div', { class: 'faz-loja-cab' }, el('b', {}, '🛒 Barraca do sítio'), el('span', {}, `🪙 ${S.moedas}`), el('button', { class: 'bt peq', onclick: () => { box.hidden = true; } }, '×')));
    box.append(el('h4', {}, 'Sementes'));
    for (const [k, p] of Object.entries(PLANTAS)) box.append(el('div', { class: 'faz-item' }, el('span', {}, `${p.ic} ${p.nome}`), el('small', {}, `${p.dias} dias${p.volta ? ' · dá de novo' : ''} · vende ${p.venda}`),
      el('button', { class: 'bt peq', onclick: () => comprarSem(k, 1) }, `1 por ${p.semente}`), el('button', { class: 'bt peq', onclick: () => comprarSem(k, 5) }, `5 por ${p.semente * 5}`)));
    box.append(el('h4', {}, 'Melhorias'));
    for (const [k, m] of Object.entries(MELHORIAS)) {
      const tem = k === 'galinha' ? S.galinhas >= 6 : !!S.up[k], falta = m.precisa && !S.up[m.precisa];
      box.append(el('div', { class: 'faz-item' }, el('span', {}, `${m.ic} ${m.nome}`), el('small', {}, m.desc), tem ? el('em', {}, '✔ comprado') : el('button', { class: 'bt peq prim', disabled: !!falta, onclick: () => comprarUp(k) }, falta ? 'precisa do galinheiro' : `${m.preco} 🪙`)));
    }
  }
  function comprarSem(k, n) { const p = PLANTAS[k]; if (S.moedas < p.semente * n) return aviso('🪙 Moedas não dão.', '#c92a2a'); S.moedas -= p.semente * n; S.sem[k] = (S.sem[k] || 0) + n; S.sel = k; salvar(); atualizarHud(); abrirLoja(); }
  function comprarUp(k) {
    const m = MELHORIAS[k]; if (S.moedas < m.preco) return aviso('🪙 Moedas não dão.', '#c92a2a');
    S.moedas -= m.preco;
    if (k === 'galinha') S.galinhas++; else { S.up[k] = true; if (k === 'galinheiro') S.galinhas = Math.max(2, S.galinhas); }
    aviso(`${m.ic} ${m.nome}!`, '#2b8a3e'); KM.tocar && KM.tocar('sucesso'); salvar(); atualizarHud(); abrirLoja();
  }
  function quadro(agora) {
    raf = 0; if (!aberta) return; raf = requestAnimationFrame(quadro);
    if (document.hidden || agora - ultimo < 30) return;
    const dt = Math.min(0.1, (agora - (tAnt || agora)) / 1000); tAnt = agora; ultimo = agora;
    atualizar(dt);
    desenhar($('#fzTela').getContext('2d'), agora / 1000);
    if (Math.floor(agora / 1000) !== Math.floor((agora - 40) / 1000)) atualizarHud();
  }
  function abrir() {
    carregar(); montar();
    kaua.x = S.kx * TS + 12; kaua.y = S.ky * TS + 20; kaua.caminho = []; kaua.acao = null;
    $('#fazenda').hidden = false; aberta = true; document.body.classList.add('fazenda-aberta'); KM.pausarCena = true;
    atualizarHud(); tAnt = 0;
    if (!raf) raf = requestAnimationFrame(quadro);
    if (S.dia === 1 && S.min < 400) aviso('🌾 Bem-vindo ao sítio! Toque na terra para arar.');
  }
  function fechar() {
    aberta = false; cancelAnimationFrame(raf); raf = 0; KM.pausarCena = false;
    const box = $('#fazenda'); if (box) box.hidden = true; document.body.classList.remove('fazenda-aberta');
    clearTimeout(salvarT); A().salvar();
  }
  function iniciar() {}
  KM.fazenda = { iniciar, abrir, fechar, _estado: () => S };
})();
