/* KWIK Mini Escritório · cena vista de cima (3/4), como um prédio com vários cômodos e um corredor.
   Tudo é desenhado por código (sem imagens), para que cores e móveis sejam personalizáveis.
   Coordenadas do mundo = pixels da tela: X para a direita, Y para baixo (chão), Z para cima (altura).
   Há duas plantas: "largo" (computador, 3 salas por fileira) e "alto" (celular, 2 por fileira). */
(function () {
  const KM = (window.KM = window.KM || {});

  // ------------------------------------------------------------------ cores
  const hex = h => {
    h = String(h || '#000').replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgb = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const tom = (h, f) => {
    const [r, g, b] = hex(h);
    if (f <= 1) return rgb(r * f, g * f, b * f);
    const t = f - 1;
    return rgb(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
  };
  const mistura = (a, b, t) => { const x = hex(a), y = hex(b); return rgb(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); };
  KM.cor = { hex, rgb, tom, mistura };
  const VERDE = '#28BE52', GRAFITE = '#111A19', CONTORNO = '#1c1612';
  const TOPO_PAREDE = '#262a3f', TOPO_LUZ = '#454c70';

  // ------------------------------------------------------------------ fonte 3x5
  const FONTE = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
    '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111', $: '011110010011110', '+': '000010111010000', '-': '000000111000000', '%': '101001010100101',
    ':': '000010000010000', '.': '000000000000010', ',': '000000000010100', '!': '010010010000010', '/': '001001010100100',
    ' ': '000000000000000', '?': '111001010000010', '*': '000101010101000', '&': '010101010101011', '<': '001010100010001', '>': '100010001010100',
  };
  const semAcento = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  function texto(g, s, x, y, cor) {
    g.fillStyle = cor;
    for (const ch of semAcento(s)) {
      const f = FONTE[ch] || FONTE['?'];
      for (let i = 0; i < 15; i++) if (f[i] === '1') g.fillRect(x + (i % 3), y + ((i / 3) | 0), 1, 1);
      x += 4;
    }
    return x;
  }
  KM.texto = texto;
  KM.larguraTexto = s => semAcento(s).length * 4 - 1;

  // ------------------------------------------------------------------ telas auxiliares
  const cache = new Map();
  function tela(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  KM.tela = tela;
  function tex(chave, w, h, fn) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    const k = chave + '|' + w + 'x' + h;
    let c = cache.get(k);
    if (!c) { c = tela(w, h); fn(c.getContext('2d'), w, h); cache.set(k, c); }
    return c;
  }
  KM.tex = tex;

  // Símbolo KWIK (barras + seta) em pixel, 12x12 * esc.
  function simboloPixel(g, x, y, e, cor, corSeta) {
    g.fillStyle = cor;
    const r = (a, b, c, d) => g.fillRect(x + a * e, y + b * e, c * e, d * e);
    r(0, 8, 2, 4); r(3, 6, 2, 6); r(6, 3, 2, 9);
    g.fillStyle = corSeta || cor;
    r(8, 6, 1, 1); r(9, 5, 1, 1); r(10, 4, 1, 1); r(11, 3, 1, 1);
    r(9, 1, 3, 1); r(11, 1, 1, 3);
    r(8, 8, 1, 1); r(9, 9, 1, 1); r(10, 10, 1, 1); r(11, 11, 1, 1);
  }
  KM.simboloPixel = simboloPixel;

  // ------------------------------------------------------------------ céu / hora
  function periodo(cfg) {
    const c = cfg.escritorio.ceu || 'auto';
    if (c !== 'auto') return c;
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    if (h >= 6.5 && h < 17) return 'dia';
    if ((h >= 17 && h < 18.7) || (h >= 5.5 && h < 6.5)) return 'tarde';
    return 'noite';
  }
  KM.periodo = periodo;

  // ------------------------------------------------------------------ planta do prédio
  const G = 4, T = 4, RW = 156, RH = 160, NB = 20, CH = 40, TOPO = 34, BAIXO = 48, CL = 30; // CL: corredor lateral dos clientes
  const PORTA = [8, 32]; // a porta de cada sala fica sempre à esquerda; essa faixa nunca tem móveis
  // As salas cresceram (eram 136 × 124). Os móveis continuam descritos na medida antiga e são espalhados na largura nova;
  // a faixa de baixo de cada setor fica para as mesas de quem o RH contratar.
  const RW0 = 136, KX = (RW - 34) / (RW0 - 34);
  const mx = rx => { const col = Math.floor(rx / (RW + T)), l = rx - col * (RW + T); return col * (RW + T) + (l < 34 ? l : Math.round(34 + (l - 34) * KX)); };
  const NOMES = { recepcao: 'Recepção', diretoria: 'Diretoria · CEO', controladoria: 'Controladoria', comercial: 'Comercial', apresentacao: 'Apresentação', jogos: 'Sala de jogos', marketing: 'Marketing',
    relacionamento: 'Relacionamento', reuniao: 'Reunião', meta: 'META', refeitorio: 'Refeitório', financeiro: 'Financeiro', precificacao: 'Precificação', execucao: 'Execução',
    fiscal: 'Fiscal', folha: 'Folha', rh: 'RH', zeladoria: 'Zeladoria' };
  // setores que podem contratar (sala → função do chefe)
  KM.SETORES = { controladoria: 'prospeccao', comercial: 'contato', marketing: 'video', relacionamento: 'relacionamento', financeiro: 'financas', precificacao: 'precificacao', fiscal: 'fiscal', folha: 'folha', rh: 'rh' };
  KM.P = (X, Y, Z = 0) => [X, Y - Z];
  KM.chaoEm = (x, y) => [x, y];
  let L = null;

  // Sala de Execução: cresce para o lado (até 2 vagas) e depois para baixo (mais fileiras de mesas).
  // Cada vaga de sala tem 2 mesas por fileira; a altura normal cabe 2 fileiras.
  const EXEC_POR_FILEIRA = 2, FILEIRA = 48;
  function tamanhoExecucao(n, max = 2) {
    const span = n > 2 * EXEC_POR_FILEIRA && max > 1 ? 2 : 1;
    const fileiras = Math.max(2, Math.ceil(n / (span * EXEC_POR_FILEIRA)));
    return { span, fileiras, extraH: (fileiras - 2) * FILEIRA, vagas: span * EXEC_POR_FILEIRA * fileiras };
  }
  KM.tamanhoExecucao = (n, max) => tamanhoExecucao(n, max != null ? max : L && L.nome === 'largo' ? 1 : 2);
  const contratadosDe = cfg => ((cfg && cfg.funcionarios) || []).filter(f => f.contratado && f.setor);
  const chaveContratados = cfg => contratadosDe(cfg).map(f => f.id + ':' + f.setor).join(',');
  const ativasExecucao = cfg => (cfg && cfg.execucao || []).filter(a => !a.fim).length;
  function plantaDe(nome, ex) {
    if (nome === 'largo') return {
      margem: 30, cols: 6, extra: [0, 0, ex.extraH],
      linhas: [
        [['recepcao', 1], ['diretoria', 1], ['controladoria', 1], ['fiscal', 1], ['folha', 1], ['comercial', 1]],
        [['relacionamento', 1], ['marketing', 1], ['financeiro', 1], ['precificacao', 1], ['meta', 1], ['reuniao', 1]],
        [['apresentacao', 1], ['refeitorio', 1], ['rh', 1], ['zeladoria', 0.5], ['jogos', 1.5], ['execucao', 1]],
      ],
    };
    const base = [[['recepcao', 1], ['diretoria', 1]], [['controladoria', 1], ['comercial', 1]], [['fiscal', 1], ['folha', 1]], [['relacionamento', 1], ['marketing', 1]],
      [['financeiro', 1], ['precificacao', 1]], [['meta', 1], ['reuniao', 1]], [['apresentacao', 1], ['refeitorio', 1]], [['rh', 1], ['zeladoria', 1]]];
    const fim = ex.span === 1 ? [[['jogos', 1], ['execucao', 1]]] : [[['jogos', 2]], [['execucao', 2]]];
    const linhas = base.concat(fim);
    return { margem: 12, cols: 2, linhas, extra: linhas.map((l, i) => (i === linhas.length - 1 ? ex.extraH : 0)) };
  }

  function montarLayout(nome, cfg) {
    const ex = tamanhoExecucao(ativasExecucao(cfg), nome === 'largo' ? 1 : 2);
    const pl = plantaDe(nome, ex), cols = pl.cols, nl = pl.linhas.length;
    const BW = T + CL + T + cols * (RW + T);
    const W = pl.margem * 2 + BW, bx = pl.margem, x0 = bx + T + CL + T;
    const lay = { nome, W, H: 0, salas: {}, corredores: [], moveis: [], decor: [], assentos: {}, pontos: {}, exec: ex, contratados: chaveContratados(cfg) };
    let y = TOPO;
    pl.linhas.forEach((linha, r) => {
      const h = RH + (pl.extra[r] || 0);
      let vaga = 0;
      linha.forEach(([id, span]) => {
        const x = x0 + vaga * (RW + T), w = span * RW + (span - 1) * T;
        lay.salas[id] = { id, nome: NOMES[id], x, y, fx: x, fy: y + NB, w, h, span, linha: r, col: vaga, portaCima: r > 0, portaBaixo: r < nl - 1 };
        vaga += span;
      });
      y += h + T;
      if (r < nl - 1) { lay.corredores.push({ x: bx + T, y, w: BW - 2 * T, h: CH }); y += CH; }
    });
    lay.predio = { x: bx, y: TOPO, w: BW, h: y - TOPO };
    // corredor lateral (à esquerda, de cima a baixo): liga todos os corredores sem passar por dentro das salas
    lay.lateral = { x: bx + T, y: TOPO, w: CL, h: y - TOPO - T };
    lay.rua = y;
    lay.H = y + BAIXO;
    for (const s of Object.values(lay.salas)) {
      s.corrCima = lay.corredores.find(c => c.y + c.h === s.y);
      s.corrBaixo = lay.corredores.find(c => c.y === s.y + s.h + T);
      const cor = s.corrBaixo || s.corrCima;
      s.porta = [s.fx + (PORTA[0] + PORTA[1]) / 2, cor === s.corrBaixo ? s.y + s.h + T + 14 : s.y - 14];
    }
    const c0 = lay.corredores[0];
    lay.centro = [Math.round(lay.predio.x + lay.predio.w / 2 + (nome === 'largo' ? 0 : 18)), c0.y + 26];
    lay.palco = (nome === 'largo' ? [-56, -28, 0, 28, 56] : [-48, -24, 0, 24, 48]).map((dx, i) => [lay.centro[0] + dx, lay.centro[1] + (i % 2 ? -6 : 2)]);
    mobiliar(lay, cfg);
    montarGrade(lay);
    // pontos para fotos do Maycon e passeios
    lay.pontos.fotos = [];
    for (const s of Object.values(lay.salas)) for (const [rx, ry] of [[52, 78], [96, 52], [70, 92], [s.w - 40, 60]]) if (livreEm(lay, s.fx + rx, s.fy + ry)) lay.pontos.fotos.push([s.fx + rx, s.fy + ry, s.id]);
    for (const c of lay.corredores) for (let x = c.x + 60; x < c.x + c.w - 30; x += 90) lay.pontos.fotos.push([x, c.y + 26, 'corredor']);
    return lay;
  }

  // ------------------------------------------------------------------ móveis de cada sala
  function mobiliar(lay, cfg) {
    const e = cfg.escritorio, it = e.itens || {};
    lay.moveis = []; lay.decor = []; lay.assentos = {}; lay.pontos.jogos = {};
    // rx/ry na medida antiga da sala (136 de largura): mx() espalha na largura nova. extra.cru = já está na medida nova.
    const add = (sala, tipo, rx, ry, w, d, h, extra = {}) => {
      const s = lay.salas[sala];
      const m = Object.assign({ sala, tipo, X: s.fx + (extra.cru ? rx : mx(rx)), Y: s.fy + ry, w, d, h, bloq: true }, extra);
      lay.moveis.push(m); return m;
    };
    const parede = (sala, tipo, rx, w, extra = {}) => {
      const s = lay.salas[sala];
      const m = Object.assign({ sala, tipo, X: s.fx + (extra.cru ? rx : mx(rx)), Y: s.y + 4, w, h: NB - 4 }, extra);
      lay.decor.push(m); return m;
    };
    const assento = (funcao, sala, cx, w, itens, tela, dir = 'ce', ry = 8, cru = false) => {
      const s = lay.salas[sala];
      if (!cru) cx = mx(cx);
      const mesa = add(sala, 'mesa', cx - (w >> 1), ry, w, 12, 10, { itens, funcao, tela, cru: true });
      const X = s.fx + cx, Y = s.fy + ry + 19;
      add(sala, 'cadeira', cx - 7, ry + 11, 14, 9, 0, { ordenar: true, chave: Y + 2, sx: X, sy: Y, funcao, cru: true });
      const corr = s.corrBaixo || s.corrCima;
      lay.assentos[funcao] = { X, Y, dir, pe: [X, Y + 13], sala, mesa, tapete: [Math.min(corr.x + corr.w - 20, s.fx + cx + 4), corr.y + 26] };
    };
    const planta = (sala, rx, ry) => { if (it.planta !== false) add(sala, 'planta', rx, ry, 10, 8, 6); };

    // Recepção: recepcionista no balcão, fila de espera no sofá, relógio e cafezinho para os clientes (recepcao.js)
    add('recepcao', 'sofa', 38, 4, 62, 14, 12);
    add('recepcao', 'mesinha', 54, 38, 26, 9, 6, { revistas: true });
    add('recepcao', 'balcao', 84, 58, 44, 12, 13, { ordenar: true });
    add('recepcao', 'cafeteira', 110, 4, 24, 10, 14, { din: true });
    if (it.cofre !== false) add('recepcao', 'cofre', 40, 84, 16, 13, 16, { din: true });
    planta('recepcao', 124, 90);
    planta('recepcao', 102, 8);
    if (e.tapete) add('recepcao', 'tapete', 40, 26, 58, 26, 0, { bloq: false });
    if (it.tv !== false) parede('recepcao', 'painel', 50, 32, { din: true });
    if (it.relogio !== false) parede('recepcao', 'relogio', 85, 9, { din: true });
    if (it.logo !== false) parede('recepcao', 'logo', 95, 16);
    {
      const s = lay.salas.recepcao;
      lay.pontos.fila = [46, 60, 74, 88].map(rx => ({ X: s.fx + mx(rx), Y: s.fy + 15, dir: 'fe' }));
      lay.pontos.recepcionista = { X: s.fx + mx(108), Y: s.fy + 55, dir: 'fe' };
      lay.pontos.balcao = { X: s.fx + mx(100), Y: s.fy + 80 };
      lay.pontos.cafe = { X: s.fx + mx(122), Y: s.fy + 22, dir: 'ce' };
    }

    // Diretoria: Kauã (CEO) e Clara (namorada e assistente)
    assento('noticias', 'diretoria', 60, 40, ['papeis', 'caneca'], 'duplo');
    assento('checklist', 'diretoria', 108, 30, ['prancheta', 'flor'], 'notebook', 'cd');
    add('diretoria', 'sofa', 66, 64, 40, 14, 12);
    add('diretoria', 'mesinha', 76, 88, 20, 8, 6);
    planta('diretoria', 42, 90);
    planta('diretoria', 124, 88);
    if (e.tapete) add('diretoria', 'tapete', 56, 56, 64, 40, 0, { bloq: false });
    if (lay.salas.diretoria.linha === 0 && it.janela !== false) parede('diretoria', 'janela', 38, 22, { din: true });
    parede('diretoria', 'placaCEO', 82, 24);
    parede('diretoria', 'coracao', 122, 12);
    add('diretoria', 'trofeuKwik', 42, 60, 10, 8, 16);
    add('diretoria', 'vasoFlores', 126, 24, 8, 7, 12, { cor: '#ff6b9a' });

    // Controladoria: Maycon (pai do Kauã, chefe da controladoria; também faz a prospecção)
    assento('prospeccao', 'controladoria', 70, 36, ['telefone', 'fotos'], 'monitor');
    add('controladoria', 'arquivo', 98, 3, 12, 10, 22);
    add('controladoria', 'arquivo', 112, 3, 12, 10, 22);
    add('controladoria', 'impressora', 42, 90, 14, 10, 9);
    add('controladoria', 'poltrona', 64, 62, 15, 13, 10);
    add('controladoria', 'mesinha', 84, 66, 14, 8, 6, { redonda: true });
    planta('controladoria', 124, 88);
    if (e.tapete) add('controladoria', 'tapete', 56, 56, 60, 30, 0, { bloq: false });
    if (lay.salas.controladoria.linha === 0 && it.janela !== false) parede('controladoria', 'janela', 40, 24, { din: true });
    if (it.grafico !== false) parede('controladoria', 'grafico', 70, 18);
    parede('controladoria', 'mural', 98, 26, { din: true });
    add('controladoria', 'tripe', 108, 60, 8, 6, 18);
    add('controladoria', 'pufeKwik', 100, 86, 14, 12, 7);

    // Comercial: Lena (mãe do Kauã, chefe do comercial)
    assento('contato', 'comercial', 70, 34, ['celular', 'flor'], 'notebook');
    add('comercial', 'arquivo', 112, 3, 12, 10, 22);
    add('comercial', 'poltrona', 58, 62, 15, 13, 10);
    add('comercial', 'mesinha', 78, 66, 14, 8, 6, { redonda: true });
    add('comercial', 'poltrona', 98, 62, 15, 13, 10);
    planta('comercial', 124, 88);
    planta('comercial', 42, 90);
    if (e.tapete) add('comercial', 'tapete', 52, 56, 66, 30, 0, { bloq: false, redondo: true });
    if (lay.salas.comercial.linha === 0 && it.janela !== false) parede('comercial', 'janela', 40, 22, { din: true });
    parede('comercial', 'mapa', 66, 18);
    parede('comercial', 'quadroVendas', 88, 22);
    add('comercial', 'vasoFlores', 104, 88, 8, 7, 12, { cor: '#e64980' });
    add('comercial', 'puff', 60, 88, 14, 12, 7, { cor: '#f783ac' });

    // Fiscal: Bruno — impostos, guias e prazos dos clientes (dados do KWIK Fiscal)
    assento('fiscal', 'fiscal', 70, 40, ['papeis', 'calculadora'], 'duplo');
    add('fiscal', 'arquivo', 42, 86, 12, 10, 16);
    add('fiscal', 'arquivo', 56, 86, 12, 10, 16);
    add('fiscal', 'impressora', 98, 90, 14, 10, 9);
    add('fiscal', 'poltrona', 96, 60, 15, 13, 10);
    add('fiscal', 'mesinha', 114, 64, 12, 8, 6, { redonda: true });
    planta('fiscal', 124, 90);
    add('fiscal', 'pufeKwik', 76, 88, 14, 12, 7);
    if (e.tapete) add('fiscal', 'tapete', 84, 52, 50, 30, 0, { bloq: false });
    parede('fiscal', 'quadroFiscal', 92, 40, { din: true });
    if (it.relogio !== false) parede('fiscal', 'relogio', 38, 9, { din: true });

    // Folha: Carla — funcionários, fechamento do mês, eSocial e FGTS (dados do KWIK Folha)
    assento('folha', 'folha', 70, 36, ['papeis', 'caneca'], 'notebook');
    add('folha', 'arquivo', 42, 86, 12, 10, 16);
    add('folha', 'impressora', 58, 90, 14, 10, 9);
    add('folha', 'poltrona', 96, 60, 15, 13, 10);
    add('folha', 'mesinha', 114, 64, 12, 8, 6, { redonda: true });
    planta('folha', 124, 90);
    add('folha', 'vasoFlores', 80, 90, 8, 7, 12, { cor: '#ffa94d' });
    if (e.tapete) add('folha', 'tapete', 84, 52, 50, 30, 0, { bloq: false, redondo: true });
    parede('folha', 'quadroFolha', 92, 40, { din: true });
    parede('folha', 'calendario', 38, 14, { din: true });

    // Financeiro: Rodrigo (tio do Kauã, irmão do Maycon) — bolsa de valores e renda fixa
    assento('financas', 'financeiro', 70, 40, ['grafico', 'calculadora'], 'duplo');
    add('financeiro', 'arquivo', 42, 86, 12, 10, 16);
    add('financeiro', 'poltrona', 96, 62, 15, 13, 10);
    add('financeiro', 'mesinha', 114, 66, 12, 8, 6, { redonda: true });
    planta('financeiro', 124, 90);
    add('financeiro', 'touro', 60, 84, 18, 8, 12);
    if (e.tapete) add('financeiro', 'tapete', 52, 54, 64, 32, 0, { bloq: false });
    parede('financeiro', 'tickerBolsa', 92, 42, { din: true });
    if (!lay.salas.financeiro.portaCima) parede('financeiro', 'graficoBolsa', 20, 22);

    // Precificação: Dona Iva (avó do Kauã, mãe do Maycon e do Rodrigo)
    assento('precificacao', 'precificacao', 70, 36, ['calculadora', 'caneca'], 'notebook');
    if (it.estante !== false) add('precificacao', 'estante', 122, 6, 13, 10, 24);
    add('precificacao', 'poltrona', 44, 62, 15, 13, 10);
    add('precificacao', 'mesinha', 62, 66, 12, 8, 6, { redonda: true, bolo: true });
    add('precificacao', 'cestaTrico', 40, 84, 10, 8, 6);
    planta('precificacao', 124, 88);
    if (e.tapete) add('precificacao', 'tapete', 40, 56, 60, 32, 0, { bloq: false, redondo: true });
    parede('precificacao', 'tabelaPrecos', 38, 42);
    if (it.relogio !== false) parede('precificacao', 'relogio', 86, 9, { din: true });
    parede('precificacao', 'quadroFamilia', 100, 16);

    // Execução: uma mesa para cada atividade em andamento (a sala cresce quando enche)
    {
      const s = lay.salas.execucao, ex = lay.exec;
      lay.pontos.execucao = [];
      for (let f = 0; f < ex.fileiras; f++) for (let k = 0; k < ex.span; k++) for (let j = 0; j < EXEC_POR_FILEIRA; j++) {
        const rx = 40 + k * (RW + T) + j * 46, ry = 22 + f * FILEIRA;
        const mesa = add('execucao', 'mesaExec', rx, ry, 36, 10, 9, { n: lay.pontos.execucao.length + 1 });
        lay.pontos.execucao.push({ X: s.fx + mx(rx) + 18, Y: s.fy + ry + 19, mesa });
      }
      lay.pontos.execucao.sort((a, b) => a.Y - b.Y || a.X - b.X).forEach((p, i) => { p.mesa.n = i + 1; });
      parede('execucao', 'quadroExec', 40, 62, { din: true });
      if (s.span > 1) parede('execucao', 'logo', RW + T + 46, 16);
      if (it.planta !== false) add('execucao', 'planta', s.w - 12, s.h - NB - 16, 10, 8, 6, { cru: true });
    }

    // Relacionamento: Bia (feedback e contato com os clientes ativos)
    assento('relacionamento', 'relacionamento', 62, 36, ['caneca', 'flor'], 'monitor');
    parede('relacionamento', 'telao', 86, 46, { din: true });
    add('relacionamento', 'poltrona', 92, 60, 15, 13, 10);
    add('relacionamento', 'mesinha', 110, 64, 12, 8, 6, { redonda: true });
    add('relacionamento', 'arquivo', 42, 88, 12, 10, 16);
    planta('relacionamento', 124, 88);
    if (e.tapete) add('relacionamento', 'tapete', 82, 52, 50, 32, 0, { bloq: false, redondo: true });
    parede('relacionamento', 'coracao', 44, 12);
    add('relacionamento', 'pufeKwik', 60, 86, 14, 12, 7);

    // Reunião
    add('reuniao', 'mesaReuniao', 52, 36, 66, 26, 10, { ordenar: true });
    for (const rx of [58, 76, 94]) { add('reuniao', 'banco', rx, 26, 9, 6, 6, { bloq: false }); add('reuniao', 'banco', rx, 66, 9, 6, 6, { bloq: false }); }
    add('reuniao', 'bebedouro', 124, 4, 9, 7, 16);
    planta('reuniao', 42, 90);
    planta('reuniao', 124, 88);
    parede('reuniao', 'tvReuniao', 64, 36, { din: true });
    if (lay.salas.reuniao.linha === 0 && it.janela !== false) parede('reuniao', 'janela', 108, 22, { din: true });

    // Marketing: Enzo (irmão do Kauã, chefe do marketing)
    assento('video', 'marketing', 62, 40, ['caneca'], 'duplo');
    add('marketing', 'fundoVerde', 108, 50, 26, 5, 28);
    add('marketing', 'ringlight', 98, 66, 6, 5, 26, { din: true });
    add('marketing', 'banqueta', 118, 70, 9, 7, 8);
    add('marketing', 'tripe', 116, 92, 8, 6, 18);
    add('marketing', 'puff', 44, 84, 14, 12, 7, { cor: '#ff8c5a' });
    planta('marketing', 66, 90);
    add('marketing', 'skate', 86, 88, 6, 4, 18);
    parede('marketing', 'insta', 112, 22);
    if (it.relogio !== false) parede('marketing', 'relogio', 86, 9, { din: true });

    // Apresentação: um consultor de uniforme KWIK mostra os slides para o cliente da vez (recepcao.js)
    parede('apresentacao', 'slides', 38, 62, { din: true });
    add('apresentacao', 'mesaApresentacao', 48, 44, 62, 16, 9, { ordenar: true });
    add('apresentacao', 'bebedouro', 124, 4, 9, 7, 16);
    planta('apresentacao', 124, 90);
    planta('apresentacao', 40, 90);
    add('apresentacao', 'pufeKwik', 104, 86, 14, 12, 7);
    parede('apresentacao', 'logo', 104, 16);
    {
      const s = lay.salas.apresentacao;
      lay.pontos.apresentacao = { cadeiras: [60, 79, 98].map(rx => ({ X: s.fx + mx(rx), Y: s.fy + 74, dir: 'ce' })), consultor: { X: s.fx + mx(112), Y: s.fy + 34, dir: 'fe' } };
    }

    // Sala de jogos (sempre acesa): sinuca, fliperama, cartas e o cantinho do PS5 com sofá; quem está livre às vezes vem jogar
    const sj = lay.salas.jogos, J = (rx, ry, dir, prop, extra) => Object.assign({ X: sj.fx + (extra && extra.cru ? rx : mx(rx)), Y: sj.fy + ry, dir, prop }, extra || {});
    add('jogos', 'fliperama', 38, 4, 12, 10, 24, { din: true });
    parede('jogos', 'neon', 46, 40, { din: true });
    parede('jogos', 'tvGame', 88, 40, { din: true });
    add('jogos', 'rackTV', 90, 2, 36, 7, 7);
    add('jogos', 'sofaCostas', 88, 36, 40, 10, 10, { ordenar: true });
    add('jogos', 'sinuca', 40, 52, 44, 24, 10, { ordenar: true });
    add('jogos', 'mesaCartas', 98, 70, 24, 16, 10, { ordenar: true });
    add('jogos', 'puff', 40, 90, 14, 12, 7, { cor: '#e03131' });
    add('jogos', 'puff', 56, 92, 14, 12, 7, { cor: '#3fb6ff' });
    add('jogos', 'frigobar', 124, 92, 10, 8, 14);
    if (e.tapete) add('jogos', 'tapete', 86, 26, 46, 22, 0, { bloq: false });
    const pj = {
      sinuca: J(60, 47, 'fe', 'taco'), sinuca2: J(34, 66, 'fd', 'taco'), cartas: J(110, 65, 'fe', 'cartas'),
      ps5a: J(100, 40, 'ce', null, { sentado: true }), ps5b: J(116, 40, 'ce', null, { sentado: true }),
    };
    if (sj.w > RW + T && sj.w < 2 * RW + T) { // sala e meia (computador): pebolim, dardos e pufes no pedaço a mais
      const x1 = RW + T, cru = { cru: true };
      add('jogos', 'pebolim', x1 + 14, 30, 34, 16, 10, { ordenar: true, cru: true });
      add('jogos', 'pufeKwik', x1 + 10, 96, 14, 12, 7, cru);
      add('jogos', 'puff', x1 + 30, 100, 14, 12, 7, { cor: '#ffd43b', cru: true });
      if (it.planta !== false) add('jogos', 'planta', sj.w - 12, 6, 10, 8, 6, cru);
      parede('jogos', 'dardos', x1 + 12, 12, cru);
      parede('jogos', 'posterKwik', x1 + 34, 14, cru);
      pj.pebolimA = J(x1 + 9, 40, 'fd', null, cru); pj.pebolimB = J(x1 + 53, 40, 'fe', null, cru);
    }
    if (sj.w >= 2 * RW + T) { // sala mais larga: pingue-pongue, dardos, pufes e um segundo fliperama
      const x1 = RW + T;
      add('jogos', 'pingue', x1 + 26, 46, 40, 22, 9, { ordenar: true });
      add('jogos', 'pufeKwik', x1 + 90, 84, 14, 12, 7);
      add('jogos', 'puff', x1 + 30, 90, 14, 12, 7, { cor: '#ffd43b' });
      planta('jogos', x1 + 112, 6);
      parede('jogos', 'dardos', x1 + 40, 12);
      parede('jogos', 'quadro', x1 + 70, 14);
      pj.pingA = J(x1 + 20, 57, 'fd'); pj.pingB = J(x1 + 72, 57, 'fe');
    }
    if (sj.w > 2 * RW + T) { // ainda mais larga (computador): lounge com sofá, mesinha e pebolim
      const x2 = 2 * (RW + T);
      add('jogos', 'sofa', x2 + 30, 50, 44, 14, 12);
      add('jogos', 'mesinha', x2 + 42, 76, 20, 8, 6);
      add('jogos', 'pebolim', x2 + 84, 22, 34, 16, 10, { ordenar: true });
      planta('jogos', sj.w - 12, 90);
      parede('jogos', 'posterKwik', x2 + 40, 14);
      parede('jogos', 'quadro', x2 + 90, 12);
      pj.pebolimA = J(x2 + 80, 32, 'fd'); pj.pebolimB = J(x2 + 122, 32, 'fe');
    }
    lay.pontos.jogos = pj;

    // META: tanque com o "dinheiro" dos clientes subindo até a meta
    add('meta', 'tanqueMeta', 50, 42, 44, 16, 48, { ordenar: true });
    add('meta', 'podio', 104, 52, 20, 10, 9);
    add('meta', 'cofrinho', 42, 70, 10, 8, 8);
    planta('meta', 124, 88);
    planta('meta', 42, 90);
    parede('meta', 'painelMeta', 40, 46, { din: true });
    if (lay.salas.meta.linha === 0 && it.janela !== false) parede('meta', 'janela', 108, 22, { din: true });
    lay.pontos.meta = { X: lay.salas.meta.fx + mx(72), Y: lay.salas.meta.fy + 74 };

    // Refeitório: mesa grande, buffet, cardápio e geladeira
    add('refeitorio', 'buffet', 64, 2, 60, 12, 8, { din: true });
    add('refeitorio', 'mesaRefeicao', 48, 46, 64, 18, 10, { ordenar: true, cru: true, X: lay.salas.refeitorio.fx + mx(80) - 32 });
    for (const rx of [60, 80, 100]) add('refeitorio', 'banco', rx - 5, 66, 10, 6, 5, { bloq: true });
    add('refeitorio', 'frigobar', 122, 60, 10, 8, 14);
    add('refeitorio', 'bebedouro', 124, 4, 9, 7, 16);
    planta('refeitorio', 40, 90);
    planta('refeitorio', 124, 96);
    parede('refeitorio', 'cardapio', 40, 22);
    {
      const s = lay.salas.refeitorio;
      // lugares à mesa: em cima (de frente para nós) e embaixo (de costas)
      lay.pontos.refeicao = [[60, 40, 'fe'], [80, 40, 'fe'], [100, 40, 'fe'], [60, 78, 'ce'], [80, 78, 'ce'], [100, 78, 'ce']].map(([rx, ry, dir]) => ({ X: s.fx + mx(rx), Y: s.fy + ry, dir }));
      lay.pontos.entrega = [s.porta[0], s.porta[1]];
    }

    // Zeladoria: a salinha do Seu Zeca, onde ficam as vassouras, os produtos e as ferramentas
    {
      // a faixa da porta (x 8–34) fica livre em cima e embaixo; tudo vai do meio para a direita
      const s = lay.salas.zeladoria, W = s.w, cru = { cru: true }, larga = W > 100, H = s.h - NB;
      add('zeladoria', 'prateleiraLimpeza', 38, 4, 30, 10, 26, cru);
      add('zeladoria', 'vassouras', W - 16, 26, 12, 6, 28, cru);
      add('zeladoria', 'carrinhoLimpeza', W - 22, 84, 16, 10, 12, cru);
      add('zeladoria', 'tanque', 38, H - 34, 18, 10, 12, cru);
      add('zeladoria', 'baldeMop', W - 14, H - 34, 10, 8, 14, cru);
      add('zeladoria', 'ferramentas', 38, H - 14, 16, 9, 8, cru);
      add('zeladoria', 'escadaFixa', W - 12, H - 12, 8, 6, 26, cru);
      if (larga) { add('zeladoria', 'prateleiraLimpeza', 72, 4, 30, 10, 26, cru); add('zeladoria', 'arquivo', W - 40, 4, 12, 10, 16, cru); add('zeladoria', 'carrinhoLimpeza', 70, H - 30, 16, 10, 12, cru); }
      parede('zeladoria', 'quadroEscala', larga ? 108 : 44, 18, cru);
      // bancadinha com rádio: é a "mesa" do Seu Zeca
      const cx = larga ? 80 : 52, X = s.fx + cx, Y = s.fy + 66;
      add('zeladoria', 'bancadaZeca', cx - 13, 46, 26, 10, 10, { cru: true, funcao: 'limpeza' });
      add('zeladoria', 'cadeira', cx - 7, 58, 14, 9, 0, { ordenar: true, chave: Y + 2, sx: X, sy: Y, funcao: 'limpeza', cru: true });
      const corr = s.corrBaixo || s.corrCima;
      lay.assentos.limpeza = { X, Y, dir: 'ce', pe: [X, Y + 13], sala: 'zeladoria', tapete: [Math.min(corr.x + corr.w - 20, s.fx + cx + 4), corr.y + 26] };
    }

    // RH: a Rita contrata gente nova para os setores; os candidatos esperam nas poltronas
    assento('rh', 'rh', 62, 40, ['papeis', 'caneca'], 'monitor');
    add('rh', 'poltrona', 42, 64, 15, 13, 10);
    add('rh', 'poltrona', 62, 64, 15, 13, 10);
    add('rh', 'mesinha', 84, 68, 14, 8, 6, { redonda: true });
    add('rh', 'arquivo', 112, 3, 12, 10, 22);
    add('rh', 'arquivo', 98, 3, 12, 10, 22);
    planta('rh', 124, 88);
    planta('rh', 104, 66);
    if (e.tapete) add('rh', 'tapete', 38, 56, 66, 30, 0, { bloq: false, redondo: true });
    parede('rh', 'quadroVagas', 86, 30, { din: true });
    parede('rh', 'posterKwik', 40, 14);
    {
      const s = lay.salas.rh;
      lay.pontos.rh = { candidato: [{ X: s.fx + mx(49), Y: s.fy + 74, dir: 'fe' }, { X: s.fx + mx(69), Y: s.fy + 74, dir: 'fe' }], frente: { X: s.fx + mx(62), Y: s.fy + 44 } };
    }

    // Quem o RH contratou: mesas na faixa de baixo do setor (até 3 por setor)
    lay.pontos.vagas = {};
    {
      const porSetor = {};
      for (const f of contratadosDe(cfg)) if (lay.salas[f.setor]) (porSetor[f.setor] = porSetor[f.setor] || []).push(f);
      for (const sala of Object.keys(KM.SETORES)) {
        const s = lay.salas[sala]; if (!s) continue;
        const H = s.h - NB, ry = H - 36, livres = [];
        const ocupado = (x, w) => lay.moveis.some(m => m.sala === sala && m.tipo !== 'tapete' && x < m.X + m.w + 3 && x + w > m.X - 3 && s.fy + ry - 2 < m.Y + m.d && s.fy + ry + 30 > m.Y);
        for (let cx = 52; cx <= s.w - 20 && livres.length < 3; cx += 4) if (!ocupado(s.fx + cx - 15, 30)) { livres.push(cx); cx += 40; }
        lay.pontos.vagas[sala] = livres.length;
        (porSetor[sala] || []).slice(0, livres.length).forEach((f, i) => assento(f.funcao, sala, livres[i], 30, ['papeis'], 'monitor', 'ce', ry, true));
      }
    }

    // ar-condicionado (a limpeza faz a manutenção)
    parede('recepcao', 'arCond', 33, 14, { din: true });
    parede('relacionamento', 'arCond', 62, 18, { din: true });
    parede('reuniao', 'arCond', 40, 18, { din: true });
    parede('marketing', 'arCond', 40, 18, { din: true });
    parede('refeitorio', 'arCond', 106, 16, { din: true });
    parede('meta', 'arCond', 89, 16, { din: true });
    parede('reuniao', 'calendario', 104, 14, { din: true });

    // corredor: bancos e plantas encostados em cima, longe das portas
    for (const s of Object.values(lay.salas)) {
      if (!s.corrBaixo) continue;
      const c = s.corrBaixo;
      lay.moveis.push({ sala: 'corredor', tipo: 'banco2', X: s.fx + 64, Y: c.y + 2, w: 24, d: 6, h: 7, bloq: true });
      if (it.planta !== false) lay.moveis.push({ sala: 'corredor', tipo: 'planta', X: s.fx + 112, Y: c.y + 1, w: 10, d: 8, h: 6, bloq: true });
    }

    // tema moderno: uma luminária de chão por sala, num canto livre, com o círculo de luz quente no piso
    lay.luzes = [];
    if (e.modeloParede === 'janelas') for (const s of Object.values(lay.salas)) {
      const H = s.h - NB;
      const ocupado = (x, y, w, d) => lay.moveis.some(m => m.sala === s.id && m.tipo !== 'tapete' && x < m.X + m.w + 2 && x + w > m.X - 2 && y < m.Y + m.d + 2 && y + d > m.Y - 2);
      const cand = [[s.w - 9, H - 10], [s.w - 24, H - 8], [36, H - 10], [52, H - 8], [s.w - 9, 40], [36, 40], [s.w - 9, 62], [s.w - 40, H - 8]];
      for (const [rx, ry] of cand) {
        const X = s.fx + rx, Y = s.fy + ry;
        if (ocupado(X - 4, Y - 3, 8, 6)) continue;
        add(s.id, 'luminaria', rx - 3, ry - 2, 7, 5, 24, { bloq: false });
        lay.luzes.push([X, Y + 4, 1]);
        break;
      }
      if (s.id === 'execucao' || s.id === 'jogos' || s.span > 1) lay.luzes.push([s.fx + (s.w >> 1), s.fy + (H >> 1), 0.7]); // salas grandes: luz do teto no meio
    }
  }

  // ------------------------------------------------------------------ caminhos (grade de 4 px + busca em largura)
  function montarGrade(lay) {
    const cols = Math.ceil(lay.W / G), lins = Math.ceil(lay.H / G), g = new Uint8Array(cols * lins);
    const marcar = (x0, y0, x1, y1, v) => {
      for (let j = Math.max(0, Math.floor(y0 / G)); j <= Math.min(lins - 1, Math.floor(y1 / G)); j++) {
        for (let i = Math.max(0, Math.floor(x0 / G)); i <= Math.min(cols - 1, Math.floor(x1 / G)); i++) {
          const cx = i * G + G / 2, cy = j * G + G / 2;
          if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) g[j * cols + i] = v;
        }
      }
    };
    for (const s of Object.values(lay.salas)) {
      marcar(s.fx + 4, s.fy + 6, s.fx + s.w - 4, s.y + s.h - 3, 1);
      if (s.portaCima) marcar(s.fx + PORTA[0] + 3, s.y - 6, s.fx + PORTA[1] - 3, s.fy + 4, 1);
      if (s.portaBaixo) marcar(s.fx + PORTA[0] + 3, s.y + s.h - 6, s.fx + PORTA[1] - 3, s.y + s.h + T + 6, 1);
    }
    for (const c of lay.corredores) marcar(c.x + 4, c.y + 5, c.x + c.w - 4, c.y + c.h - 2, 1);
    if (lay.lateral) { const q = lay.lateral; marcar(q.x + 4, q.y + NB + 6, q.x + q.w - 4, q.y + q.h - 3, 1); }
    for (const m of lay.moveis) if (m.bloq) marcar(m.X - 3, m.Y - 3, m.X + m.w + 3, m.Y + m.d + 3, 0);
    lay.grade = { cols, lins, g };
  }
  function livreEm(lay, x, y) {
    const { cols, lins, g } = lay.grade, i = Math.floor(x / G), j = Math.floor(y / G);
    return i >= 0 && j >= 0 && i < cols && j < lins && g[j * cols + i] === 1;
  }
  function celulaPerto(x, y) {
    const { cols, lins, g } = L.grade, i0 = Math.floor(x / G), j0 = Math.floor(y / G);
    for (let r = 0; r < 14; r++) {
      let melhor = -1, md = 1e9;
      for (let j = j0 - r; j <= j0 + r; j++) for (let i = i0 - r; i <= i0 + r; i++) {
        if (Math.max(Math.abs(i - i0), Math.abs(j - j0)) !== r || i < 0 || j < 0 || i >= cols || j >= lins || !g[j * cols + i]) continue;
        const d = (i - i0) ** 2 + (j - j0) ** 2;
        if (d < md) { md = d; melhor = j * cols + i; }
      }
      if (melhor >= 0) return melhor;
    }
    return -1;
  }
  const visivel = (x0, y0, x1, y1) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let k = 0; k <= n; k++) if (!livreEm(L, x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n)) return false;
    return true;
  };
  // Caminho de (x0,y0) até (x1,y1) desviando de paredes e móveis. Devolve a lista de pontos (sem o inicial).
  KM.rota = function (x0, y0, x1, y1) {
    if (!L) return [[x1, y1]];
    const { cols, lins, g } = L.grade, a = celulaPerto(x0, y0), b = celulaPerto(x1, y1);
    if (a < 0 || b < 0) return [[x1, y1]];
    const pai = new Int32Array(g.length).fill(-1); pai[a] = a;
    const fila = [a];
    const viz = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    for (let h = 0; h < fila.length; h++) {
      const c = fila[h]; if (c === b) break;
      const i = c % cols, j = (c / cols) | 0;
      for (const [di, dj] of viz) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= cols || nj >= lins) continue;
        const n = nj * cols + ni;
        if (!g[n] || pai[n] >= 0) continue;
        if (di && dj && (!g[j * cols + ni] || !g[nj * cols + i])) continue;
        pai[n] = c; fila.push(n);
      }
    }
    if (pai[b] < 0) return [[x1, y1]];
    const cel = []; for (let c = b; c !== a; c = pai[c]) cel.push(c);
    cel.reverse();
    const pts = cel.map(c => [(c % cols) * G + G / 2, ((c / cols) | 0) * G + G / 2]);
    pts.push([x1, y1]);
    const out = []; let cx = x0, cy = y0, k = 0;
    while (k < pts.length) {
      let melhor = k;
      for (let m = Math.min(pts.length - 1, k + 60); m > k; m--) if (visivel(cx, cy, pts[m][0], pts[m][1])) { melhor = m; break; }
      out.push(pts[melhor]); [cx, cy] = pts[melhor]; k = melhor + 1;
    }
    return out;
  };
  KM.chaoLivre = (x, y) => !!L && livreEm(L, x, y);

  // ------------------------------------------------------------------ texturas de piso e parede
  function texPiso(e, w, h) {
    const base = e.corPiso;
    return tex('piso' + e.piso + base, w, h, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      if (e.piso === 'madeira' || e.piso === 'taco') {
        const larg = e.piso === 'madeira' ? 6 : 4;
        for (let v = 0; v < h; v += larg) {
          const lin = (v / larg) | 0;
          g.fillStyle = tom(base, lin % 3 === 0 ? 0.95 : lin % 3 === 1 ? 1.04 : 1); g.fillRect(0, v, w, larg);
          g.fillStyle = tom(base, 0.8); g.fillRect(0, v, w, 1);
          const passo = e.piso === 'madeira' ? 34 : 12;
          for (let u = (lin * 13) % passo; u < w; u += passo) g.fillRect(u, v, 1, larg);
        }
      } else if (e.piso === 'porcelanato') { // placas grandes e claras com rejunte fino (visual moderno)
        for (let v = 0; v < h; v += 16) for (let u = (v / 16) % 2 ? -8 : 0; u < w; u += 16) {
          g.fillStyle = ((u + v) / 16 | 0) % 3 === 0 ? tom(base, 0.975) : base; g.fillRect(u, v, 16, 16);
          g.fillStyle = tom(base, 0.88); g.fillRect(u, v, 16, 1); g.fillRect(u, v, 1, 16);
          g.fillStyle = tom(base, 1.06); g.fillRect(u + 2, v + 2, 3, 1);
        }
      } else if (e.piso === 'piso') {
        for (let v = 0; v < h; v += 12) for (let u = 0; u < w; u += 12) {
          g.fillStyle = ((u + v) / 12) % 2 ? tom(base, 0.94) : base; g.fillRect(u, v, 12, 12);
          g.fillStyle = tom(base, 0.84); g.fillRect(u, v, 12, 1); g.fillRect(u, v, 1, 12);
        }
      } else if (e.piso === 'cimento') {
        for (let i = 0; i < 700; i++) { g.fillStyle = tom(base, 0.92 + ((i * 7919) % 16) / 100); g.fillRect((i * 37) % w, (i * 53) % h, 2, 1); }
        g.fillStyle = tom(base, 0.86); for (let u = 0; u < w; u += 34) g.fillRect(u, 0, 1, h); for (let v = 0; v < h; v += 34) g.fillRect(0, v, w, 1);
      } else {
        for (let i = 0; i < 900; i++) { g.fillStyle = tom(base, 0.9 + ((i * 7919) % 20) / 100); g.fillRect((i * 37) % w, (i * 53) % h, 1, 1); }
      }
    });
  }
  function texXadrez(c1, c2, w, h, n = 8) {
    return tex('xad' + c1 + c2 + n, w, h, (g, w, h) => {
      for (let v = 0; v < h; v += n) for (let u = 0; u < w; u += n) { g.fillStyle = ((u + v) / n) % 2 ? c2 : c1; g.fillRect(u, v, n, n); }
    });
  }
  function texTabuas(c, w, h) {
    return tex('tabuas' + c, w, h, (g, w, h) => {
      g.fillStyle = c; g.fillRect(0, 0, w, h);
      for (let u = 0; u < w; u += 7) {
        const k = (u / 7) | 0; g.fillStyle = tom(c, k % 3 === 0 ? 0.94 : k % 3 === 1 ? 1.05 : 1); g.fillRect(u, 0, 7, h);
        g.fillStyle = tom(c, 0.78); g.fillRect(u, 0, 1, h); for (let v = (k * 17) % 40; v < h; v += 40) g.fillRect(u, v, 7, 1);
      }
    });
  }
  const moderno = e => e.modeloParede === 'janelas'; // tema "KWIK Moderno": salas de estar em madeira quente, resto em porcelanato
  function pisoDaSala(s, e) {
    const w = s.w || RW, h = (s.h || RH) - NB;
    if (s.id === 'zeladoria') return texXadrez('#c4cad0', '#b8bfc6', w, h, 8);
    if (moderno(e)) {
      if (s.id === 'rh') return texTabuas('#b07a4f', w, h);
      if (s.id === 'diretoria') return texTabuas('#b8692f', w, h);
      if (s.id === 'refeitorio' || s.id === 'precificacao') return texTabuas('#a8652f', w, h);
      if (s.id === 'jogos') return texTabuas('#7a4c2c', w, h);
      return texPiso(e, w, h);
    }
    if (s.id === 'execucao') return texXadrez('#e3e9e6', '#d6dfda', w, h, 10);
    if (s.id === 'diretoria') return texTabuas('#8a5a3c', w, h);
    if (s.id === 'apresentacao') return texXadrez('#e7ecf3', '#dde4ee', w, h, 10);
    if (s.id === 'jogos') return texTabuas('#b07a4f', w, h);
    if (s.id === 'refeitorio') return texXadrez('#f3e3c9', '#e8d2b0', w, h, 8);
    return texPiso(e, w, h);
  }
  // janelões do chão ao teto com a cidade lá fora (cor do céu conforme a hora)
  const CEU_JANELA = { noite: ['#1b1f45', '#352a5e', '#6d4470', '#141733'], tarde: ['#33357a', '#8a4f7a', '#e89a68', '#3a2f5a'], dia: ['#79ade3', '#a5cbee', '#d3e6f5', '#8ea6c2'] };
  function janelas(g, w, h, per, faixa) {
    const [c1, c2, c3, pred] = CEU_JANELA[per] || CEU_JANELA.tarde;
    g.fillStyle = '#20243b'; g.fillRect(0, 0, w, h);
    const gy = 1, gh = h - 4;
    for (let v = 0; v < gh; v++) { const k = v / gh; g.fillStyle = k < 0.45 ? c1 : k < 0.75 ? c2 : c3; g.fillRect(0, gy + v, w, 1); }
    const rnd = semente(w * 7 + 3);
    for (let u = -2; u < w;) { // prédios da cidade
      const bw = 4 + ((rnd() * 7) | 0), bh = 3 + ((rnd() * (gh - 4)) | 0);
      g.fillStyle = pred; g.fillRect(u, gy + gh - bh, bw, bh);
      if (per !== 'dia') for (let yy = gy + gh - bh + 1; yy < gy + gh - 1; yy += 2) for (let xx = u + 1; xx < u + bw - 1; xx += 2) if (rnd() < 0.28) { g.fillStyle = rnd() < 0.7 ? '#ffd27a' : '#9ad1ff'; g.fillRect(xx, yy, 1, 1); }
      u += bw + ((rnd() * 2) | 0);
    }
    if (per === 'noite') for (let i = 0; i < w / 10; i++) { g.fillStyle = '#e9e4ff'; g.fillRect((rnd() * w) | 0, gy + ((rnd() * gh * 0.4) | 0), 1, 1); }
    g.fillStyle = 'rgba(255,255,255,0.10)'; for (let u = 4; u < w; u += 26) { g.fillRect(u, gy, 3, gh); g.fillRect(u + 4, gy, 1, gh); } // reflexo no vidro
    g.fillStyle = '#1b1e33'; for (let u = 0; u < w; u += 26) g.fillRect(u, 0, 2, h); // esquadrias
    g.fillStyle = '#4a5070'; g.fillRect(0, h - 3, w, 1); g.fillStyle = faixa || '#1b1e33'; g.fillRect(0, h - 2, w, 2);
  }
  function texFace(s, e) {
    const w = s.w || RW, h = NB - 4, per = periodo(KM.config ? KM.config() : { escritorio: e });
    if (s.id === 'diretoria' && moderno(e)) return tex('faceDiretoriaM', w, h, (g, w, h) => { // painel de madeira quente do lounge do CEO
      g.fillStyle = '#9a5526'; g.fillRect(0, 0, w, h);
      for (let u = 0; u < w; u += 5) { g.fillStyle = (u / 5) % 2 ? '#a65d2a' : '#8d4d22'; g.fillRect(u, 0, 5, h - 2); g.fillStyle = '#7a4019'; g.fillRect(u, 0, 1, h - 2); }
      g.fillStyle = '#c9a65b'; g.fillRect(0, h - 3, w, 1); g.fillStyle = '#1b1e33'; g.fillRect(0, h - 2, w, 2);
    });
    if ((s.id === 'execucao' || s.id === 'apresentacao') && moderno(e)) return tex('faceExecM' + per, w, h, (g, w, h) => janelas(g, w, h, per, '#28BE52'));
    if (s.id === 'diretoria') return tex('faceDiretoria', w, h, (g, w, h) => {
      g.fillStyle = '#20302b'; g.fillRect(0, 0, w, h);
      for (let u = 0; u < w; u += 8) { g.fillStyle = (u / 8) % 2 ? '#243630' : '#1d2b26'; g.fillRect(u, 0, 8, h - 2); }
      g.fillStyle = '#c9a65b'; g.fillRect(0, h - 3, w, 1); g.fillStyle = '#111A19'; g.fillRect(0, h - 2, w, 2);
    });
    if (s.id === 'execucao' || s.id === 'apresentacao') return tex('faceExec', w, h, (g, w, h) => {
      g.fillStyle = '#eef6f1'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#28BE52'; g.fillRect(0, h - 5, w, 3); g.fillStyle = '#111A19'; g.fillRect(0, h - 2, w, 2);
    });
    if (s.id !== 'jogos' && moderno(e)) return tex('faceJanelas' + per, w, h, (g, w, h) => janelas(g, w, h, per));
    if (s.id === 'copa') return tex('faceCopa', w, h, (g, w, h) => {
      g.fillStyle = '#e8f4ee'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#cfe3d8'; for (let u = 0; u < w; u += 6) g.fillRect(u, 0, 1, h); for (let v = 0; v < h; v += 6) g.fillRect(0, v, w, 1);
      g.fillStyle = '#9fbfae'; g.fillRect(0, h - 2, w, 2);
    });
    if (s.id === 'jogos') return tex('faceJogos', w, h, (g, w, h) => {
      g.fillStyle = '#2c2344'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.05)'; for (let u = 0; u < w; u += 8) g.fillRect(u, 0, 1, h);
      g.fillStyle = '#ff4fd8'; g.fillRect(0, h - 4, w, 1); g.fillStyle = '#3fb6ff'; g.fillRect(0, h - 3, w, 1); g.fillStyle = '#16102a'; g.fillRect(0, h - 2, w, 2);
    });
    const m = e.modeloParede || 'lisa', p = e.parede, rod = e.rodape;
    return tex('face' + m + p + rod, w, h, (g, w, h) => {
      g.fillStyle = p; g.fillRect(0, 0, w, h);
      if (m === 'listrada') { g.fillStyle = tom(p, 0.93); for (let u = 0; u < w; u += 8) g.fillRect(u, 0, 4, h - 2); }
      else if (m === 'tijolo') { g.fillStyle = tom(p, 0.86); for (let v = 0; v < h - 2; v += 4) { g.fillRect(0, v, w, 1); for (let u = (v / 4) % 2 ? 0 : 5; u < w; u += 10) g.fillRect(u, v, 1, 4); } }
      else if (m === 'madeira') { for (let u = 0; u < w; u += 6) { g.fillStyle = tom(p, (u / 6) % 2 ? 0.94 : 1.03); g.fillRect(u, 0, 6, h - 2); g.fillStyle = tom(p, 0.82); g.fillRect(u, 0, 1, h - 2); } }
      else { g.fillStyle = tom(p, 0.97); for (let u = 0; u < w; u += 11) g.fillRect(u, 0, 1, h - 2); }
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, w, 1);
      g.fillStyle = rod; g.fillRect(0, h - 2, w, 2);
    });
  }

  // ------------------------------------------------------------------ desenho: utilidades
  const sombra = (g, X, Y, w, d) => { g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(X + 1, Y + d - 2, w, 3); };
  KM.desenharCadeira = (ctx, x, y, ocupada) => KM.bb(ctx, x, y, () => cadeira(ctx, { sx: x, sy: y }, KM.config(), ocupada));
  // Caixa vista de cima: topo em (X, Y-h) e frente em (X, Y+d-h) com altura h.
  function caixa(g, X, Y, w, d, h, cor, o = {}) {
    const topo = o.topo || cor, frente = o.frente || tom(cor, 0.76), borda = o.borda || tom(cor, 0.45);
    g.fillStyle = borda; g.fillRect(X - 1, Y - h - 1, w + 2, d + h + 2);
    g.fillStyle = topo; g.fillRect(X, Y - h, w, d);
    if (h > 0) { g.fillStyle = frente; g.fillRect(X, Y + d - h, w, h); g.fillStyle = tom(frente, 0.8); g.fillRect(X, Y + d - h, w, 1); }
    g.fillStyle = tom(topo, 1.14); g.fillRect(X, Y - h, w, 1);
  }
  KM.caixa = caixa;
  KM.prisma = (g, o) => caixa(g, o.X, o.Y - (o.Z || 0), o.w, o.d, o.h || 0, o.cor || '#888');
  const r = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  // Itens pequenos em cima das mesas (ty = topo da mesa).
  const SOBRE = {
    papeis: (g, x, ty) => { r(g, x, ty + 2, 7, 6, '#c9c9c2'); r(g, x + 1, ty + 1, 7, 6, '#ffffff'); r(g, x + 2, ty + 3, 4, 1, '#9aa3a1'); r(g, x + 2, ty + 5, 3, 1, '#9aa3a1'); },
    caneca: (g, x, ty) => { r(g, x, ty + 1, 4, 5, '#ffffff'); r(g, x, ty + 1, 4, 1, '#6b3a1e'); r(g, x + 4, ty + 2, 1, 2, '#ffffff'); r(g, x + 1, ty + 4, 2, 1, VERDE); },
    prancheta: (g, x, ty) => { r(g, x, ty, 7, 9, '#8d5a3b'); r(g, x + 1, ty + 2, 5, 6, '#ffffff'); r(g, x + 2, ty, 3, 2, '#adb5bd'); r(g, x + 2, ty + 3, 3, 1, VERDE); r(g, x + 2, ty + 5, 3, 1, '#9aa3a1'); },
    flor: (g, x, ty) => { r(g, x, ty + 3, 4, 4, '#ff8fb1'); r(g, x + 1, ty - 1, 1, 4, '#2E8B45'); r(g, x, ty - 2, 3, 2, '#ffd43b'); },
    telefone: (g, x, ty) => { r(g, x, ty + 2, 7, 5, '#c9453a'); r(g, x, ty + 1, 7, 2, '#8f2a22'); r(g, x + 2, ty + 4, 3, 2, '#f1f3f5'); },
    fotos: (g, x, ty) => { r(g, x, ty + 2, 6, 5, '#ffffff'); r(g, x + 1, ty + 3, 4, 3, '#6aa5d8'); r(g, x + 3, ty + 1, 6, 5, '#ffffff'); r(g, x + 4, ty + 2, 4, 3, '#f2c14e'); },
    celular: (g, x, ty) => { r(g, x, ty + 2, 4, 6, '#212529'); r(g, x + 1, ty + 3, 2, 4, '#25d366'); },
    calculadora: (g, x, ty) => { r(g, x, ty + 1, 6, 7, '#495057'); r(g, x + 1, ty + 2, 4, 2, '#a9e34b'); r(g, x + 1, ty + 5, 1, 1, '#f1f3f5'); r(g, x + 3, ty + 5, 1, 1, '#f1f3f5'); r(g, x + 1, ty + 7, 4, 1, '#ff8787'); },
    grafico: (g, x, ty) => { r(g, x, ty + 1, 8, 7, '#ffffff'); r(g, x + 1, ty + 5, 1, 2, '#2f9e44'); r(g, x + 3, ty + 4, 1, 3, '#2f9e44'); r(g, x + 5, ty + 2, 1, 5, VERDE); },
  };

  // ------------------------------------------------------------------ desenho dos móveis (estáticos)
  const DES = {
    mesa(g, m, cfg) {
      const e = cfg.escritorio, c = e.mesa, { X, Y, w, d, h } = m, mod = e.modeloMesa || 'classica';
      sombra(g, X, Y, w, d);
      if (mod === 'moderna' || mod === 'vidro') {
        const pern = mod === 'vidro' ? '#adb5bd' : tom(c, 0.4);
        r(g, X + 1, Y + d - h, 2, h, pern); r(g, X + w - 3, Y + d - h, 2, h, pern);
        if (mod === 'vidro') { g.fillStyle = 'rgba(160,215,235,0.55)'; g.fillRect(X, Y - h, w, d); r(g, X, Y - h, w, 1, 'rgba(255,255,255,0.8)'); r(g, X, Y + d - h, w, 2, 'rgba(120,180,200,0.8)'); }
        else { r(g, X - 1, Y - h - 1, w + 2, d + 4, tom(c, 0.45)); r(g, X, Y - h, w, d, c); r(g, X, Y + d - h, w, 2, tom(c, 0.75)); r(g, X, Y - h, w, 1, tom(c, 1.14)); }
      } else {
        caixa(g, X, Y, w, d, h, c);
        r(g, X + w - 13, Y + d - h + 2, 11, h - 3, tom(c, 0.66)); r(g, X + w - 13, Y + d - h + 5, 11, 1, tom(c, 0.5));
        r(g, X + w - 9, Y + d - h + 3, 3, 1, '#e9e4d8'); r(g, X + w - 9, Y + d - 3, 3, 1, '#e9e4d8');
      }
      const ty = Y - h;
      (m.itens || []).forEach((o, i) => SOBRE[o] && SOBRE[o](g, i ? X + w - 9 : X + 3, ty + 1));
    },
    estante(g, m, cfg) {
      const e = cfg.escritorio, c = e.estante || '#2b2f33', { X, Y, w, d, h } = m, mod = e.modeloEstante || 'livros';
      sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, c);
      const f0 = Y + d - h, cores = ['#3f7fc1', '#2E8B45', '#c9453a', '#e2b33c', '#5a4fa8', '#e9e4d8', '#1f6d67', '#d97a2b'];
      for (let k = 0; k < 4; k++) {
        const y0 = f0 + 2 + k * 7;
        r(g, X + 1, y0, w - 2, 6, tom(c, 0.55));
        if (mod === 'arquivo') { r(g, X + 1, y0, w - 2, 6, tom(c, 0.9)); r(g, X + (w >> 1) - 1, y0 + 2, 3, 1, '#c9c9c2'); continue; }
        if (mod === 'nicho' && k % 2) { r(g, X + 3, y0 + 2, 4, 4, '#b5532f'); r(g, X + 3, y0, 4, 2, VERDE); continue; }
        for (let x = X + 2, i = k * 3; x < X + w - 2; i++) { const lw = 1 + (i % 2); r(g, x, y0 + 1 + (i % 3 === 0 ? 1 : 0), lw, 5 - (i % 3 === 0 ? 1 : 0), cores[i % cores.length]); x += lw + 1; }
      }
    },
    planta(g, m, cfg) {
      const e = cfg.escritorio, { X, Y } = m, mod = e.modeloPlanta || 'costela', vaso = e.corVaso || '#b5532f';
      sombra(g, X, Y, 10, 8);
      r(g, X + 1, Y - 2, 8, 8, tom(vaso, 0.5)); r(g, X + 2, Y - 1, 6, 6, vaso); r(g, X + 2, Y - 1, 6, 1, tom(vaso, 1.25));
      const cx = X + 5, cy = Y - 2;
      if (mod === 'cacto') { r(g, cx - 2, cy - 14, 4, 14, '#2f9e44'); r(g, cx - 1, cy - 14, 1, 13, '#69db7c'); r(g, cx - 6, cy - 9, 3, 2, '#2f9e44'); r(g, cx - 6, cy - 12, 2, 4, '#2f9e44'); r(g, cx + 2, cy - 7, 3, 2, '#2f9e44'); r(g, cx + 4, cy - 11, 2, 5, '#2f9e44'); r(g, cx, cy - 16, 2, 2, '#ff8fb1'); }
      else if (mod === 'palmeira') { r(g, cx, cy - 12, 1, 12, '#7a5a3a'); for (const [dx, dy, w] of [[-7, -13, 7], [1, -13, 7], [-6, -15, 5], [1, -16, 5], [-4, -11, 3], [2, -10, 4]]) r(g, cx + dx, cy + dy, w, 2, dx < 0 ? '#2f9e44' : '#40c057'); }
      else if (mod === 'flores') { r(g, cx - 5, cy - 7, 10, 7, '#2f9e44'); r(g, cx - 4, cy - 8, 8, 2, '#40c057'); for (const [dx, dy, c] of [[-4, -9, '#ff6b9a'], [0, -10, '#ffd43b'], [3, -8, '#f06595'], [-2, -6, '#ffffff'], [2, -5, '#ff6b9a']]) r(g, cx + dx, cy + dy, 2, 2, c); }
      else { r(g, cx, cy - 14, 1, 14, '#2E8B45'); for (const [dx, dy, w, h] of [[-7, -12, 6, 4], [1, -15, 6, 4], [-6, -7, 5, 3], [2, -9, 6, 3], [-3, -17, 5, 3]]) { r(g, cx + dx, cy + dy, w, h, '#2f9e44'); r(g, cx + dx + 1, cy + dy, w - 2, 1, '#51cf66'); } }
    },
    tapete(g, m, cfg) {
      const e = cfg.escritorio, c = e.corTapete, { X, Y, w, d } = m, pad = e.padraoTapete;
      const esc = tom(c, 0.78), cla = tom(c, 1.25);
      if (pad === 'redondo' || m.redondo) {
        for (let v = 0; v < d; v++) { const k = 1 - ((v - d / 2) / (d / 2)) ** 2, hw = Math.round(w / 2 * Math.sqrt(Math.max(0, k))); r(g, X + w / 2 - hw, Y + v, hw * 2, 1, v === 0 || v === d - 1 ? esc : c); }
        for (let v = 4; v < d - 4; v += 5) { const k = 1 - ((v - d / 2) / (d / 2 - 3)) ** 2, hw = Math.round((w / 2 - 4) * Math.sqrt(Math.max(0, k))); r(g, X + w / 2 - hw, Y + v, hw * 2, 1, esc); }
        return;
      }
      r(g, X, Y, w, d, c); r(g, X + 2, Y + 2, w - 4, 1, esc); r(g, X + 2, Y + d - 3, w - 4, 1, esc); r(g, X + 2, Y + 2, 1, d - 4, esc); r(g, X + w - 3, Y + 2, 1, d - 4, esc);
      if (pad === 'kwik') { simboloPixel(g, X + (w >> 1) - 6, Y + (d >> 1) - 6, 1, esc); for (let i = 6; i < w - 6; i += 6) { r(g, X + i, Y + 5, 2, 1, cla); r(g, X + i, Y + d - 6, 2, 1, cla); } }
      else if (pad === 'listras') { for (let v = 5; v < d - 5; v += 5) r(g, X + 4, Y + v, w - 8, 2, (v / 5) % 2 ? esc : cla); }
      else { const cx = X + w / 2, cy = Y + d / 2, rr = Math.min(w, d) / 2 - 5; for (let i = 0; i <= rr; i++) { r(g, cx - i, cy - rr + i, 1, 1, esc); r(g, cx + i, cy - rr + i, 1, 1, esc); r(g, cx - i, cy + rr - i, 1, 1, esc); r(g, cx + i, cy + rr - i, 1, 1, esc); } r(g, cx - 2, cy - 2, 4, 4, cla); }
    },
    sofa(g, m, cfg) { // de frente para nós (encosto atrás)
      const e = cfg.escritorio, c = e.corSofa || '#3f7fc1', { X, Y, w, d } = m, mod = e.modeloSofa || 'reto';
      sombra(g, X, Y, w, d);
      caixa(g, X, Y, w, 6, 14, tom(c, 0.92));
      caixa(g, X + 3, Y + 5, w - 6, d - 5, 6, c);
      caixa(g, X, Y + 3, 4, d - 3, 9, tom(c, 0.85)); caixa(g, X + w - 4, Y + 3, 4, d - 3, 9, tom(c, 0.85));
      for (let k = 1; k < 3; k++) r(g, X + 3 + k * ((w - 6) / 3 | 0), Y - 1, 1, d - 5, tom(c, 0.75));
      if (mod === 'chester') for (let x = X + 6; x < X + w - 5; x += 5) { r(g, x, Y - 10, 1, 1, tom(c, 0.6)); r(g, x + 2, Y - 7, 1, 1, tom(c, 0.6)); }
      if (mod === 'futon') { // almofadas laranja, como num lounge
        for (const ax of [X + 5, X + (w >> 1) - 3, X + w - 11]) { r(g, ax, Y - 1, 6, 5, '#b8632a'); r(g, ax + 1, Y - 1, 4, 4, '#e8913a'); r(g, ax + 2, Y, 2, 1, '#f6b26b'); }
      }
    },
    poltrona(g, m, cfg) {
      const c = cfg.escritorio.corSofa || '#3f7fc1', { X, Y, w, d } = m;
      sombra(g, X, Y, w, d); caixa(g, X, Y, w, 5, 13, tom(c, 0.9)); caixa(g, X + 2, Y + 4, w - 4, d - 4, 6, c);
      caixa(g, X, Y + 3, 3, d - 3, 8, tom(c, 0.82)); caixa(g, X + w - 3, Y + 3, 3, d - 3, 8, tom(c, 0.82));
    },
    mesinha(g, m) {
      const { X, Y, w, d, h } = m;
      sombra(g, X, Y, w, d);
      if (m.redonda) {
        r(g, X + 1, Y - h, w - 2, d, '#5a3a22'); r(g, X, Y - h + 1, w, d - 2, '#5a3a22'); r(g, X + 2, Y - h + 1, w - 4, d - 2, '#8d5a3b'); r(g, X + (w >> 1) - 1, Y + d - h, 2, h, '#3a2a1e');
        if (m.bolo) { r(g, X + 3, Y - h - 2, 6, 4, '#f8f0fc'); r(g, X + 3, Y - h - 2, 6, 1, '#ff8fb1'); r(g, X + 5, Y - h - 4, 1, 2, '#ffd43b'); } // bolo da vó
        else r(g, X + 4, Y - h + 2, 4, 3, '#ffffff');
        return;
      }
      caixa(g, X, Y, w, d, h, '#8d5a3b');
      if (m.revistas) { r(g, X + 3, Y - h + 2, 7, 5, '#e64980'); r(g, X + 5, Y - h + 1, 7, 5, '#4dabf7'); r(g, X + 6, Y - h + 2, 4, 1, '#ffffff'); r(g, X + 15, Y - h + 2, 7, 5, VERDE); simboloPixel(g, X + 16, Y - h + 2, 0.4, '#ffffff'); return; }
      r(g, X + 4, Y - h + 2, 5, 4, '#f1f3f5'); r(g, X + 12, Y - h + 2, 3, 3, '#ffffff'); r(g, X + 12, Y - h + 2, 3, 1, '#6b3a1e');
    },
    balcao(g, m) {
      const { X, Y, w, d, h } = m;
      sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#f1f3f5', { frente: GRAFITE, borda: '#0b100f' });
      r(g, X, Y + d - h + 3, w, 1, VERDE);
      simboloPixel(g, X + (w >> 1) - 9, Y + d - h + 5, 0.5, VERDE); texto(g, 'KWIK', X + (w >> 1) - 2, Y + d - h + 6, '#ffffff');
      r(g, X + 4, Y - h + 2, 10, 6, '#2b3135'); r(g, X + 5, Y - h + 3, 8, 4, '#4dabf7'); r(g, X + 24, Y - h + 3, 6, 4, '#ffffff');
    },
    bebedouro(g, m) {
      const { X, Y, w, d, h } = m;
      sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h - 6, '#f1f3f5'); r(g, X + 1, Y - h + 1, w - 2, 7, '#74c0fc'); r(g, X + 2, Y - h + 2, 2, 4, '#d0ebff'); r(g, X + 3, Y + d - h + 9, 3, 2, '#868e96');
    },
    cofre(g, m) {
      const { X, Y, w, d, h } = m;
      sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#5b636a');
      const fy = Y + d - h;
      r(g, X + 2, fy + 2, w - 4, h - 4, '#4a5156'); r(g, X + (w >> 1) - 2, fy + (h >> 1) - 2, 4, 4, '#e6c04a'); r(g, X + (w >> 1) - 1, fy + (h >> 1) - 1, 2, 2, '#2b2f33'); r(g, X + w - 4, fy + 4, 1, h - 8, '#c9c9c2');
    },
    lixeira(g, m) { const { X, Y } = m; sombra(g, X, Y, 6, 6); caixa(g, X, Y, 6, 6, 7, '#8b2f2a'); r(g, X + 1, Y - 6, 4, 3, '#5e1e1a'); r(g, X + 2, Y - 7, 2, 2, '#ffffff'); },
    impressora(g, m) { const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#dee2e6'); r(g, X + 2, Y - h + 2, w - 4, 3, '#495057'); r(g, X + 4, Y - h - 2, w - 8, 4, '#ffffff'); r(g, X + w - 4, Y + d - h + 2, 2, 1, VERDE); },
    arquivo(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#868e96');
      for (let k = 0; k < 3; k++) { const y0 = Y + d - h + 1 + k * 7; r(g, X + 1, y0, w - 2, 6, '#9aa3ab'); r(g, X + (w >> 1) - 2, y0 + 2, 4, 1, '#343a40'); }
    },
    fundoVerde(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d);
      r(g, X, Y - h, 1, h + d, '#495057'); r(g, X + w - 1, Y - h, 1, h + d, '#495057'); r(g, X, Y - h, w, 2, '#495057');
      r(g, X + 1, Y - h + 2, w - 2, h + d - 4, '#2fb35a'); r(g, X + 1, Y - h + 2, w - 2, 1, '#69db7c'); simboloPixel(g, X + (w >> 1) - 6, Y - h + 8, 1, '#e3f7e9');
    },
    ringlight(g, m) { const { X, Y } = m; r(g, X + 2, Y - 22, 1, 26, '#343a40'); r(g, X, Y + 3, 6, 1, '#343a40'); },
    banqueta(g, m) { const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); r(g, X + 3, Y + d - h, 2, h, '#343a40'); caixa(g, X, Y, w, d - 3, 2, '#111A19'); },
    tripe(g, m) {
      const { X, Y } = m; r(g, X + 1, Y + 6, 1, 1, '#343a40'); r(g, X + 6, Y + 6, 1, 1, '#343a40');
      for (let k = 0; k < 12; k++) { r(g, X + 4 - (k > 6 ? (k - 6) >> 1 : 0), Y - 10 + k, 1, 1, '#343a40'); r(g, X + 4 + (k > 6 ? (k - 6) >> 1 : 0), Y - 10 + k, 1, 1, '#343a40'); }
      r(g, X, Y - 16, 9, 6, '#212529'); r(g, X + 1, Y - 15, 3, 3, '#495057'); r(g, X + 2, Y - 14, 1, 1, '#9fe8ff'); r(g, X + 7, Y - 15, 1, 1, '#e03131');
    },
    puff(g, m) {
      const { X, Y, w, d } = m, c = m.cor || '#ff8c5a';
      sombra(g, X, Y, w, d); r(g, X + 1, Y - 6, w - 2, d + 6, tom(c, 0.5)); r(g, X, Y - 4, w, d + 2, tom(c, 0.5));
      r(g, X + 1, Y - 5, w - 2, d + 4, c); r(g, X + 2, Y - 5, w - 4, 3, tom(c, 1.25)); r(g, X + 3, Y + d - 3, w - 6, 1, tom(c, 0.75));
    },
    bancada(g, m) {
      const { X, Y, w, d, h } = m; caixa(g, X, Y, w, d, h, '#e9ecef', { frente: '#f8f9fa' });
      for (let x = X + 2; x < X + w - 8; x += 13) { r(g, x, Y + d - h + 2, 11, h - 3, '#dee2e6'); r(g, x + 9, Y + d - h + 5, 1, 3, '#868e96'); }
      r(g, X + 30, Y - h + 3, 12, 6, '#adb5bd'); r(g, X + 31, Y - h + 4, 10, 4, '#cfe8f6'); r(g, X + 35, Y - h + 1, 2, 3, '#868e96'); // pia
      r(g, X + 4, Y - h - 6, 14, 12, '#343a40'); r(g, X + 5, Y - h - 5, 12, 4, '#212529'); r(g, X + 8, Y - h + 1, 6, 3, '#495057'); r(g, X + 14, Y - h - 4, 2, 1, '#e03131'); // cafeteira
      r(g, X + 58, Y - h - 4, 16, 10, '#495057'); r(g, X + 59, Y - h - 3, 10, 8, '#212529'); r(g, X + 70, Y - h - 2, 2, 5, '#adb5bd'); // micro-ondas
    },
    geladeira(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#dee2e6', { frente: '#f1f3f5' });
      r(g, X, Y + d - h + 11, w, 1, '#adb5bd'); r(g, X + w - 3, Y + d - h + 4, 1, 5, '#868e96'); r(g, X + w - 3, Y + d - h + 14, 1, 8, '#868e96');
      r(g, X + 3, Y + d - h + 15, 3, 3, '#ffd43b'); r(g, X + 6, Y + d - h + 18, 3, 3, VERDE);
    },
    mesaJantar(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#c99a62');
      r(g, X + 6, Y - h + 4, 6, 5, '#ffffff'); r(g, X + w - 14, Y - h + 9, 6, 5, '#ffffff'); r(g, X + (w >> 1) - 3, Y - h + 6, 6, 6, '#e03131'); r(g, X + (w >> 1) - 1, Y - h + 5, 2, 2, '#2f9e44');
    },
    banco(g, m) { const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#8d5a3b'); },
    banco2(g, m) { const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#a0693f'); r(g, X + 1, Y + d - h, 2, h, '#5a3a22'); r(g, X + w - 3, Y + d - h, 2, h, '#5a3a22'); },
    sinuca(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#6b3f22');
      r(g, X + 2, Y - h + 2, w - 4, d - 4, '#2f9e44');
      for (const [x, y] of [[0, 0], [w - 6, 0], [0, d - 6], [w - 6, d - 6], [(w >> 1) - 3, 0], [(w >> 1) - 3, d - 6]]) r(g, X + 2 + x, Y - h + 2 + y, 2, 2, '#111');
      for (const [c, x, y] of [['#ffd43b', 28, 8], ['#e03131', 30, 10], ['#1971c2', 29, 13], ['#7048e8', 32, 9], ['#111111', 31, 12], ['#f76707', 33, 11]]) r(g, X + x, Y - h + y, 2, 2, c);
    },
    mesaCartas(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#1864ab');
      const cs = ['#e03131', '#f59f00', '#2f9e44', '#1971c2', '#111111'];
      [[3, 2], [8, 3], [13, 2], [6, 7], [15, 7]].forEach(([x, y], i) => { r(g, X + x, Y - h + y, 3, 4, '#ffffff'); r(g, X + x + 1, Y - h + y + 1, 1, 2, cs[i]); });
    },
    pingue(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d);
      r(g, X + 2, Y + d - h, 2, h, '#343a40'); r(g, X + w - 4, Y + d - h, 2, h, '#343a40');
      r(g, X - 1, Y - h - 1, w + 2, d + 3, '#0b3d6b'); r(g, X, Y - h, w, d, '#1971c2'); r(g, X, Y + d - h, w, 2, '#145a9c');
      r(g, X, Y - h, w, 1, '#ffffff'); r(g, X, Y + d - h - 1, w, 1, '#ffffff'); r(g, X, Y - h, 1, d, '#ffffff'); r(g, X + w - 1, Y - h, 1, d, '#ffffff'); r(g, X, Y - h + (d >> 1), w, 1, '#ffffff');
      r(g, X + (w >> 1) - 1, Y - h - 3, 2, d + 3, '#f1f3f5'); r(g, X + (w >> 1), Y - h - 3, 1, d + 3, '#adb5bd');
    },
    fliperama(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#7048e8', { frente: '#5f3dc4' });
      r(g, X + 1, Y + d - h + 13, w - 2, 3, '#212529'); r(g, X + 3, Y + d - h + 13, 2, 1, '#e03131'); r(g, X + 7, Y + d - h + 14, 2, 1, '#ffd43b');
    },
    mesaReuniao(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#3d2b20');
      r(g, X + 3, Y - h + 3, w - 6, d - 6, '#5a3f2e');
      for (const [x, y] of [[8, 4], [26, 4], [44, 4], [8, 14], [26, 14], [44, 14]]) { r(g, X + x, Y - h + y, 7, 5, '#ffffff'); r(g, X + x + 1, Y - h + y + 1, 4, 1, '#9aa3a1'); }
      r(g, X + w - 12, Y - h + 9, 6, 5, '#212529'); r(g, X + w - 11, Y - h + 10, 4, 3, '#4dabf7');
    },
    coracao(g, m) { const { X, Y } = m; r(g, X, Y + 1, 12, 13, '#111A19'); for (const [x, y, w] of [[2, 4, 3], [7, 4, 3], [1, 5, 10], [2, 7, 8], [3, 8, 6], [4, 9, 4], [5, 10, 2]]) r(g, X + x, Y + y, w, 1, '#ff6b9a'); r(g, X + 1, Y + 6, 10, 1, '#ff6b9a'); },
    // ----- na parede (Y = topo da face, h = 16)
    logo(g, m) { const { X, Y } = m; r(g, X, Y + 1, 16, 13, CONTORNO); r(g, X + 1, Y + 2, 14, 11, '#ffffff'); simboloPixel(g, X + 2, Y + 2, 0.84, VERDE); },
    grafico(g, m) {
      const { X, Y, w } = m; r(g, X, Y + 1, w, 13, CONTORNO); r(g, X + 1, Y + 2, w - 2, 11, '#ffffff');
      [3, 5, 4, 7, 9].forEach((a, i) => r(g, X + 3 + i * 3, Y + 12 - a, 2, a, i === 4 ? VERDE : '#2E8B45'));
    },
    quadro(g, m, cfg) {
      const { X, Y, w } = m, mod = cfg.escritorio.modeloQuadro || 'paisagem', mold = cfg.escritorio.corMoldura || CONTORNO;
      r(g, X, Y + 2, w, 11, mold); r(g, X + 1, Y + 3, w - 2, 9, '#f4efe6');
      if (mod === 'certificado') { r(g, X + 2, Y + 5, w - 4, 1, '#c9b27a'); r(g, X + 2, Y + 7, w - 6, 1, '#c9b27a'); r(g, X + w - 4, Y + 9, 2, 2, '#d4483b'); }
      else if (mod === 'abstrato') { r(g, X + 2, Y + 4, 4, 4, '#ff6b6b'); r(g, X + 5, Y + 7, 5, 4, '#4dabf7'); r(g, X + 3, Y + 9, 3, 2, '#ffd43b'); }
      else { r(g, X + 1, Y + 3, w - 2, 5, '#a5d8ff'); r(g, X + 1, Y + 8, w - 2, 4, '#69db7c'); r(g, X + 3, Y + 6, 4, 2, '#2f9e44'); r(g, X + w - 4, Y + 4, 2, 2, '#ffd43b'); }
    },
    mapa(g, m) {
      const { X, Y, w } = m; r(g, X, Y + 1, w, 13, CONTORNO); r(g, X + 1, Y + 2, w - 2, 11, '#d0ebff');
      for (const [x, y, ww] of [[5, 3, 6], [3, 4, 10], [2, 5, 13], [3, 6, 12], [5, 7, 10], [7, 8, 7], [8, 9, 5], [9, 10, 3]]) r(g, X + x, Y + y, ww, 1, '#69db7c');
      r(g, X + 12, Y + 5, 1, 1, '#e03131'); r(g, X + 8, Y + 8, 1, 1, '#e03131'); r(g, X + 6, Y + 5, 1, 1, '#e03131');
    },
    insta(g, m) {
      const { X, Y } = m; r(g, X, Y + 1, 22, 14, CONTORNO); r(g, X + 1, Y + 2, 20, 12, '#ffffff');
      const cs = ['#28BE52', '#111A19', '#ffd43b', '#ff6b9a', '#4dabf7', '#28BE52', '#111A19', '#b197fc', '#ff8c5a'];
      cs.forEach((c, i) => r(g, X + 2 + (i % 3) * 6, Y + 2 + ((i / 3) | 0) * 4, 5, 3, c));
    },
    neonMkt(g, m) { const { X, Y } = m; r(g, X, Y + 3, 30, 9, '#111A19'); texto(g, 'IDEIAS', X + 4, Y + 5, '#ff9de2'); },
    dardos(g, m) { const { X, Y } = m; for (let k = 6; k > 0; k -= 2) r(g, X + 6 - k, Y + 8 - k, k * 2, k * 2, k % 4 === 2 ? '#e03131' : '#f8f9fa'); r(g, X + 5, Y + 7, 2, 2, '#2f9e44'); },
    armarios(g, m) {
      const { X, Y, w } = m; r(g, X, Y, w, 9, '#ced4da'); for (let x = X; x < X + w; x += 13) { r(g, x, Y, 12, 8, '#f1f3f5'); r(g, x + 10, Y + 3, 1, 3, '#868e96'); }
      r(g, X, Y + 9, w, 1, '#adb5bd');
    },
    // ----- META
    tanqueMeta(g, m, cfg) {
      const { X, Y, w, d, h } = m, t = performance.now() / 1000;
      const md = KM.metaDados ? KM.metaDados(cfg) : { meta: 10, qAtivos: 0, qNeg: 0, pctAtivo: 0, pctTotal: 0 };
      sombra(g, X - 2, Y, w + 4, d);
      // base metálica
      caixa(g, X - 3, Y + 4, w + 6, d - 4, 7, '#495057');
      r(g, X - 1, Y + d - 5, w + 2, 1, '#868e96');
      texto(g, `${md.qAtivos}/${md.meta}`, X + (w >> 1) - ((`${md.qAtivos}/${md.meta}`.length * 4 - 1) >> 1), Y + d - 3, md.qAtivos >= md.meta ? '#ffd43b' : '#d3f9d8');
      // vidro
      const x0 = X, y0 = Y - h, x1 = X + w, y1 = Y + 6;
      r(g, x0 - 1, y0 - 1, w + 2, y1 - y0 + 2, '#1c1612');
      r(g, x0, y0, w, y1 - y0, '#cfe8f3');
      r(g, x0 + 1, y0 + 1, w - 2, y1 - y0 - 2, '#e8f6fb');
      // líquido
      const ix = x0 + 2, iw = w - 4, ib = y1 - 2, it = y0 + 5, ih = ib - it;
      const hV = Math.round(ih * Math.min(1, md.pctAtivo)), hT = Math.round(ih * Math.min(1, md.pctTotal));
      const onda = x => Math.round(Math.sin(t * 3 + x * 0.45) * 1.2);
      if (hT > hV) { // possível fechamento: amarelo transparente
        g.fillStyle = 'rgba(255,212,59,0.45)';
        for (let x = 0; x < iw; x++) { const top = ib - hT + onda(x + 9); g.fillRect(ix + x, top, 1, ib - hV - top); }
        g.fillStyle = 'rgba(255,236,153,0.85)'; for (let x = 0; x < iw; x++) g.fillRect(ix + x, ib - hT + onda(x + 9), 1, 1);
      }
      if (hV > 0) {
        for (let x = 0; x < iw; x++) {
          const top = ib - hV + onda(x);
          g.fillStyle = '#20a548'; g.fillRect(ix + x, top, 1, ib - top);
          g.fillStyle = '#51cf66'; g.fillRect(ix + x, top, 1, 1);
          if (x < 3) { g.fillStyle = '#2fbf5c'; g.fillRect(ix + x, top + 1, 1, ib - top - 1); }
        }
        // bolhas e moedinhas
        for (let i = 0; i < 6; i++) {
          const k = (t * 0.6 + i * 0.37) % 1, bx = ix + 3 + ((i * 7) % (iw - 6)), by = ib - Math.round(k * (hV - 2));
          if (by > ib - hV + 2) r(g, bx, by, 1, 1, i % 3 ? '#b2f2bb' : '#ffe066');
        }
      }
      // marcas da meta (uma por cliente) e linha da meta
      for (let k = 1; k <= md.meta; k++) { const yy = ib - Math.round(ih * k / md.meta); r(g, x1 - 6, yy, 4, 1, k === md.meta ? '#e03131' : 'rgba(28,22,18,0.45)'); }
      r(g, ix, it, iw, 1, '#e03131');
      // reflexo do vidro
      r(g, x0 + 2, y0 + 2, 1, y1 - y0 - 6, 'rgba(255,255,255,0.7)'); r(g, x0 + 4, y0 + 3, 1, 8, 'rgba(255,255,255,0.5)');
      // tampa
      r(g, x0 - 2, y0 - 3, w + 4, 3, '#868e96'); r(g, x0 - 2, y0 - 3, w + 4, 1, '#ced4da');
      if (md.qAtivos >= md.meta && Math.floor(t * 3) % 2) r(g, x0 + (w >> 1) - 2, y0 - 7, 4, 3, '#ffd43b');
    },
    podio(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#f1f3f5', { frente: '#dee2e6' });
      r(g, X + (w >> 1) - 1, Y + d - h + 2, 3, 5, VERDE);
      const tx = X + (w >> 1) - 4, ty = Y - h - 12; // troféu
      r(g, tx + 1, ty, 7, 5, '#f2c14e'); r(g, tx, ty + 1, 1, 3, '#f2c14e'); r(g, tx + 8, ty + 1, 1, 3, '#f2c14e'); r(g, tx + 2, ty + 1, 2, 3, '#fff3a0');
      r(g, tx + 3, ty + 5, 3, 3, '#d4a72c'); r(g, tx + 1, ty + 8, 7, 2, '#8d5a3b');
    },
    cofrinho(g, m) {
      const { X, Y } = m; sombra(g, X, Y, 10, 8);
      r(g, X, Y - 6, 10, 8, '#f783ac'); r(g, X + 1, Y - 7, 8, 10, '#f783ac'); r(g, X + 2, Y - 6, 3, 2, '#ffd0e0'); r(g, X + 8, Y - 4, 2, 2, '#e64980');
      r(g, X + 4, Y - 7, 3, 1, '#1c1612'); r(g, X + 2, Y + 2, 2, 1, '#e64980'); r(g, X + 7, Y + 2, 2, 1, '#e64980'); r(g, X + 3, Y - 4, 1, 1, '#1c1612');
    },
    // ----- Refeitório
    buffet(g, m) {
      const { X, Y, w, d, h } = m; caixa(g, X, Y, w, d, h, '#ced4da', { frente: '#adb5bd' });
      const cores = [['#e8590c', '#ffa94d'], ['#f8f9fa', '#e9ecef'], ['#5c940d', '#94d82d'], ['#c92a2a', '#ff8787']];
      cores.forEach(([a, b], i) => { const x = X + 3 + i * 14; r(g, x, Y - h + 2, 12, 7, '#868e96'); r(g, x + 1, Y - h + 3, 10, 5, a); r(g, x + 2, Y - h + 3, 5, 2, b); });
      for (let x = X + 2; x < X + w - 6; x += 12) r(g, x, Y + d - h + 2, 10, h - 3, '#c3c9cf');
    },
    mesaRefeicao(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#d9a066');
      r(g, X + 2, Y - h + 2, w - 4, d - 4, '#e6b17a'); r(g, X + 2, Y - h + (d >> 1) - 1, w - 4, 2, '#f1f3f5');
      r(g, X + (w >> 1) - 2, Y - h + (d >> 1) - 4, 4, 4, '#ffffff'); r(g, X + (w >> 1) - 1, Y - h + (d >> 1) - 5, 2, 2, '#e03131'); // vasinho
    },
    carrinhoLimpeza(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d);
      caixa(g, X, Y, w, d, h, '#ffd43b', { frente: '#fab005' });
      r(g, X + 2, Y - h - 6, 5, 7, '#4dabf7'); r(g, X + 3, Y - h - 8, 3, 2, '#1c7ed6'); // borrifador
      r(g, X + 9, Y - h - 4, 5, 5, '#868e96'); r(g, X + 10, Y - h - 3, 3, 2, '#74c0fc'); // balde
      r(g, X + w - 2, Y - h - 16, 1, 18, '#8d5a3b'); r(g, X + w - 4, Y + d - 3, 5, 2, '#f8f9fa'); // rodo
      r(g, X + 2, Y + d - h + 3, w - 4, 1, '#e67700');
    },
    // ----- Execução, Diretoria, Financeiro, Precificação
    mesaExec(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#f1f3f5', { frente: '#dee2e6' });
      r(g, X, Y + d - h + 2, w, 1, VERDE);
      const cx = X + (w >> 1), ty = Y - h;
      r(g, cx - 8, ty - 13, 16, 11, '#1f2326'); r(g, cx - 7, ty - 12, 14, 8, '#0c1416'); r(g, cx - 1, ty - 2, 2, 2, '#30363a'); r(g, cx - 4, ty, 8, 1, '#30363a');
      r(g, X + 3, ty + 2, 8, 3, '#adb5bd'); // teclado
      texto(g, String(m.n || ''), X + w - 9, ty + 2, '#868e96');
    },
    placaCEO(g, m) {
      const { X, Y, w } = m; r(g, X, Y + 2, w, 11, '#1c1612'); r(g, X + 1, Y + 3, w - 2, 9, '#111A19'); r(g, X + 1, Y + 3, w - 2, 1, '#c9a65b');
      texto(g, 'CEO', X + ((w - 11) >> 1), Y + 5, '#e2c06b');
    },
    graficoBolsa(g, m) {
      const { X, Y, w } = m; r(g, X, Y + 1, w, 13, CONTORNO); r(g, X + 1, Y + 2, w - 2, 11, '#0f1f17');
      [[2, 5, 1], [5, 4, 0], [8, 6, 1], [11, 3, 1], [14, 5, 0], [17, 2, 1]].forEach(([x, h, up]) => { r(g, X + 1 + x, Y + 11 - h - (up ? 2 : 0), 2, h, up ? '#51cf66' : '#ff6b6b'); r(g, X + 1 + x, Y + 9 - h - (up ? 2 : 0), 1, h + 3, up ? '#2f9e44' : '#c92a2a'); });
    },
    tabelaPrecos(g, m) {
      const { X, Y, w } = m; r(g, X, Y + 1, w, 14, '#5c3d2e'); r(g, X + 1, Y + 2, w - 2, 12, '#fffdf4');
      texto(g, 'PRECOS', X + 3, Y + 3, '#1E8A45');
      for (let i = 0; i < 2; i++) { r(g, X + 3, Y + 9 + i * 3, 14, 1, '#adb5bd'); texto(g, '$', X + w - 8 - i * 7, Y + 8, '#e8590c'); }
    },
    cardapio(g, m) {
      const { X, Y, w } = m; r(g, X, Y + 1, w, 14, '#5c3d2e'); r(g, X + 1, Y + 2, w - 2, 12, '#2b2f33');
      texto(g, 'MENU', X + 3, Y + 3, '#ffd43b'); r(g, X + 3, Y + 9, w - 8, 1, '#f1f3f5'); r(g, X + 3, Y + 11, w - 10, 1, '#f1f3f5');
    },
    luminaria(g, m) { // luminária de chão (abajur alto)
      const { X, Y } = m, cx = X + 3;
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(X, Y + 3, 7, 2);
      r(g, X + 1, Y + 2, 5, 2, '#1b1e33'); r(g, cx, Y - 20, 1, 22, '#2b2f45'); r(g, cx + 1, Y - 20, 1, 22, '#1b1e33');
      r(g, X, Y - 26, 7, 1, CONTORNO); r(g, X - 1, Y - 25, 9, 5, CONTORNO); r(g, X + 1, Y - 25, 5, 1, '#f3e2bd'); r(g, X, Y - 24, 7, 3, '#f3e2bd'); r(g, X, Y - 21, 7, 1, '#fff6d6');
      r(g, X + 1, Y - 24, 1, 3, '#fffbe8');
    },
    // ----- recepção e apresentação
    cafeteira(g, m) { // cantinho do café para os clientes
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#8d5a3b');
      const ty = Y - h;
      r(g, X + 2, ty - 9, 9, 10, CONTORNO); r(g, X + 3, ty - 8, 7, 8, '#343a40'); r(g, X + 4, ty - 6, 5, 2, '#ced4da'); r(g, X + 5, ty - 3, 3, 2, '#212529'); r(g, X + 8, ty - 7, 1, 1, '#ff6b6b');
      for (let k = 0; k < 3; k++) { r(g, X + 13 + k * 3, ty + 1, 2, 3, '#ffffff'); r(g, X + 13 + k * 3, ty + 1, 2, 1, '#6b3a1e'); }
      r(g, X + 2, Y + d - h + 3, w - 4, 1, VERDE); texto(g, 'CAFE', X + 4, Y + d - h + 6, '#ffe8cc');
    },
    mesaApresentacao(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d);
      r(g, X + 4, Y + d - h, 3, h, '#495057'); r(g, X + w - 7, Y + d - h, 3, h, '#495057');
      r(g, X - 1, Y - h - 1, w + 2, d + 2, CONTORNO); r(g, X, Y - h, w, d, '#f8f9fa'); r(g, X + 1, Y - h + 1, w - 2, d - 3, '#ffffff');
      r(g, X, Y + d - h, w, 2, VERDE);
      r(g, X + 8, Y - h + 3, 10, 7, '#adb5bd'); r(g, X + 9, Y - h + 4, 8, 4, '#4dabf7');
      r(g, X + 28, Y - h + 5, 7, 5, '#ffffff'); r(g, X + 29, Y - h + 6, 5, 1, VERDE); r(g, X + 44, Y - h + 4, 4, 5, '#ffffff'); r(g, X + 44, Y - h + 4, 4, 1, '#6b3a1e');
    },
    // ----- sala de jogos
    sofaCostas(g, m) { // sofá virado para a TV: a gente vê o encosto e as costas de quem joga
      const { X, Y, w, d } = m, c = '#5f3dc4';
      sombra(g, X, Y, w, d);
      caixa(g, X + 2, Y - 2, w - 4, d - 2, 6, tom(c, 1.15));
      caixa(g, X, Y + d - 5, w, 5, 12, c); r(g, X + 1, Y + d - 17, w - 2, 2, tom(c, 1.3));
      caixa(g, X - 1, Y - 2, 4, d + 1, 9, tom(c, 0.8)); caixa(g, X + w - 3, Y - 2, 4, d + 1, 9, tom(c, 0.8));
      simboloPixel(g, X + (w >> 1) - 3, Y + d - 13, 0.5, '#d0bfff');
    },
    rackTV(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#212529');
      const ty = Y - h;
      r(g, X + 3, ty - 12, 5, 13, CONTORNO); r(g, X + 4, ty - 11, 3, 11, '#f8f9fa'); r(g, X + 5, ty - 10, 1, 9, '#212529'); // PS5 em pé
      r(g, X + w - 12, ty + 1, 8, 3, '#f8f9fa'); r(g, X + w - 10, ty + 2, 4, 1, '#343a40'); // controle
      r(g, X + 12, Y + d - h + 2, 1, 1, '#4dabf7');
    },
    frigobar(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#e9ecef');
      r(g, X + 1, Y + d - h + 2, w - 2, h - 4, '#dee2e6'); r(g, X + w - 3, Y + d - h + 4, 1, 4, '#868e96');
      for (let k = 0; k < 3; k++) r(g, X + 2 + k * 3, Y - h - 3, 2, 3, ['#e03131', '#ffd43b', '#28BE52'][k]);
    },
    pebolim(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#5c3d2e');
      r(g, X + 2, Y - h + 2, w - 4, d - 4, '#2f9e44'); r(g, X + (w >> 1), Y - h + 2, 1, d - 4, '#ffffff');
      for (let k = 0; k < 4; k++) { const x = X + 5 + k * 8; r(g, x, Y - h - 1, 1, d + 2, '#adb5bd'); r(g, x - 1, Y - h + 4, 3, 2, k < 2 ? '#e03131' : '#1971c2'); r(g, x - 1, Y - h + 9, 3, 2, k < 2 ? '#e03131' : '#1971c2'); }
    },
    // ----- a cara de cada sala (com elementos da KWIK)
    pufeKwik(g, m) {
      const { X, Y, w, d } = m; sombra(g, X, Y, w, d);
      r(g, X + 1, Y - 6, w - 2, d + 6, tom(VERDE, 0.5)); r(g, X, Y - 4, w, d + 2, tom(VERDE, 0.5));
      r(g, X + 1, Y - 5, w - 2, d + 4, VERDE); r(g, X + 2, Y - 5, w - 4, 3, tom(VERDE, 1.25));
      simboloPixel(g, X + (w >> 1) - 3, Y - 2, 0.5, '#ffffff');
    },
    trofeuKwik(g, m) {
      const { X, Y } = m; sombra(g, X, Y, 10, 8); caixa(g, X, Y, 10, 8, 6, GRAFITE);
      r(g, X + 1, Y + 1, 8, 1, VERDE);
      const ty = Y - 6;
      r(g, X + 4, ty - 4, 2, 4, '#c9a227'); r(g, X + 2, ty - 11, 6, 7, '#f2c230'); r(g, X + 1, ty - 11, 8, 2, '#f2c230'); r(g, X + 3, ty - 10, 1, 4, '#fff3bf');
      r(g, X, ty - 10, 1, 3, '#c9a227'); r(g, X + 9, ty - 10, 1, 3, '#c9a227'); r(g, X + 3, ty - 1, 4, 1, '#c9a227');
    },
    vasoFlores(g, m) {
      const { X, Y } = m, c = m.cor || '#ff6b9a'; sombra(g, X, Y, 8, 7);
      r(g, X + 1, Y - 4, 6, 7, '#f1f3f5'); r(g, X + 2, Y - 3, 4, 5, '#dee2e6'); r(g, X + 2, Y - 3, 4, 1, VERDE);
      r(g, X + 3, Y - 9, 1, 5, '#2f9e44'); r(g, X + 5, Y - 8, 1, 4, '#2f9e44');
      for (const [dx, dy] of [[1, -11], [4, -12], [6, -10], [2, -8]]) r(g, X + dx, Y + dy, 2, 2, c);
      r(g, X + 4, Y - 11, 1, 1, '#ffd43b');
    },
    touro(g, m) { // touro dourado da bolsa (Rodrigo)
      const { X, Y } = m; sombra(g, X, Y, 18, 8); caixa(g, X, Y, 18, 8, 3, GRAFITE);
      const ty = Y - 3, o = '#d4a017', cl = '#f2c230';
      r(g, X + 3, ty - 7, 12, 5, o); r(g, X + 3, ty - 7, 12, 1, cl);
      r(g, X + 3, ty - 2, 2, 2, o); r(g, X + 12, ty - 2, 2, 2, o);
      r(g, X + 13, ty - 9, 5, 4, o); r(g, X + 17, ty - 11, 1, 3, '#fff3bf'); r(g, X + 13, ty - 11, 1, 2, '#fff3bf'); r(g, X + 16, ty - 8, 1, 1, CONTORNO);
      r(g, X + 1, ty - 7, 2, 1, o);
    },
    cestaTrico(g, m) { // tricô da Dona Iva
      const { X, Y } = m; sombra(g, X, Y, 10, 8);
      r(g, X, Y - 3, 10, 8, '#a0673c'); r(g, X + 1, Y - 3, 8, 1, '#c98a55'); for (let k = 1; k < 10; k += 2) r(g, X + k, Y - 1, 1, 5, '#8d5524');
      r(g, X + 1, Y - 7, 4, 4, '#b197fc'); r(g, X + 5, Y - 6, 4, 4, '#ff8fb1'); r(g, X + 2, Y - 6, 1, 1, '#e5dbff');
      r(g, X + 3, Y - 11, 1, 6, '#adb5bd'); r(g, X + 7, Y - 10, 1, 5, '#adb5bd');
    },
    skate(g, m) { // skate do Enzo encostado
      const { X, Y } = m; sombra(g, X, Y, 6, 4);
      r(g, X + 1, Y - 18, 4, 20, CONTORNO); r(g, X + 2, Y - 17, 2, 18, VERDE); r(g, X + 2, Y - 13, 2, 2, '#ffffff');
      r(g, X, Y - 16, 1, 2, '#ffd43b'); r(g, X + 5, Y - 16, 1, 2, '#ffd43b'); r(g, X, Y - 2, 1, 2, '#ffd43b'); r(g, X + 5, Y - 2, 1, 2, '#ffd43b');
    },
    // ----- na parede
    posterKwik(g, m) {
      const { X, Y } = m, w = 14; r(g, X, Y + 1, w, 14, CONTORNO); r(g, X + 1, Y + 2, w - 2, 12, GRAFITE);
      simboloPixel(g, X + 3, Y + 3, 0.66, VERDE); r(g, X + 2, Y + 12, w - 4, 1, VERDE);
    },
    quadroVendas(g, m) { // funil de vendas da Lena
      const { X, Y, w } = m; r(g, X, Y + 1, w, 14, CONTORNO); r(g, X + 1, Y + 2, w - 2, 12, '#ffffff');
      [[2, 16, '#ffc9de'], [4, 12, '#f783ac'], [6, 8, '#e64980'], [8, 4, VERDE]].forEach(([dx, ww, c], i) => r(g, X + dx + 1, Y + 3 + i * 3, ww, 2, c));
      r(g, X + w - 4, Y + 3, 2, 2, VERDE);
    },
    quadroFamilia(g, m) { // foto da família na parede da Dona Iva
      const { X, Y } = m; r(g, X, Y + 1, 16, 13, '#8a5a2b'); r(g, X + 1, Y + 2, 14, 11, '#fff4e6');
      [['#d6d6d6', 2, '#b197fc'], ['#8a8a8a', 6, '#cfe0f5'], ['#5A3825', 10, '#E9D5B7']].forEach(([cab, x, roupa]) => { r(g, X + x, Y + 5, 3, 3, '#e8b48f'); r(g, X + x, Y + 4, 3, 1, cab); r(g, X + x, Y + 8, 3, 4, roupa); });
      r(g, X + 6, Y + 2, 4, 1, '#ff6b9a');
    },
    // ----- Zeladoria (Seu Zeca)
    prateleiraLimpeza(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#adb5bd');
      const f0 = Y + d - h, cores = ['#4dabf7', '#ffd43b', '#ff8787', '#69db7c', '#f8f9fa', '#b197fc'];
      for (let k = 0; k < 3; k++) {
        const y0 = f0 + 2 + k * 8; r(g, X + 1, y0 + 6, w - 2, 1, '#868e96');
        for (let x = X + 2, i = k; x < X + w - 3; i++) { const c = cores[i % cores.length], ww = 3 + (i % 2); r(g, x, y0 + 1 + (i % 3), ww, 5 - (i % 3), c); r(g, x + 1, y0 + (i % 3), ww - 2, 1, tom(c, 0.7)); x += ww + 1; }
      }
    },
    vassouras(g, m) {
      const { X, Y, w } = m; r(g, X, Y - 20, w, 3, '#5c3d2e'); // suporte na parede
      [['#8d5a3b', '#ffd43b'], ['#495057', '#e03131'], ['#8d5a3b', '#4dabf7']].forEach(([cabo, cerda], i) => { const x = X + 2 + i * 5; r(g, x, Y - 22, 1, 22, cabo); r(g, x - 2, Y, 5, 4, cerda); r(g, x - 2, Y + 3, 5, 1, tom(cerda, 0.7)); });
    },
    tanque(g, m) { const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#e9ecef', { frente: '#dee2e6' }); r(g, X + 2, Y - h + 2, w - 4, d - 4, '#a5d8ff'); r(g, X + (w >> 1), Y - h - 4, 2, 5, '#868e96'); },
    baldeMop(g, m) { const { X, Y, w, d } = m; sombra(g, X, Y, w, d); r(g, X, Y - 6, w, 9, '#fab005'); r(g, X + 1, Y - 6, w - 2, 2, '#4dabf7'); r(g, X + 5, Y - 22, 1, 18, '#8d5a3b'); r(g, X + 3, Y - 5, 5, 3, '#f1f3f5'); },
    ferramentas(g, m) { const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#e03131', { frente: '#c92a2a' }); r(g, X + 4, Y - h - 3, w - 8, 3, '#343a40'); r(g, X + 2, Y + d - h + 3, w - 4, 1, '#ffd43b'); },
    escadaFixa(g, m) { const { X, Y } = m; r(g, X, Y - 24, 2, 28, '#adb5bd'); r(g, X + 6, Y - 24, 2, 28, '#adb5bd'); for (let k = 0; k < 5; k++) r(g, X + 1, Y - 20 + k * 5, 6, 1, '#868e96'); },
    bancadaZeca(g, m) {
      const { X, Y, w, d, h } = m; sombra(g, X, Y, w, d); caixa(g, X, Y, w, d, h, '#8d5a3b');
      r(g, X + 3, Y - h - 5, 10, 6, '#343a40'); r(g, X + 4, Y - h - 4, 4, 4, '#868e96'); r(g, X + 9, Y - h - 4, 3, 1, '#ffd43b'); r(g, X + 12, Y - h - 8, 1, 4, '#adb5bd'); // rádio
      r(g, X + w - 8, Y - h + 1, 4, 5, '#ffffff'); r(g, X + w - 8, Y - h + 1, 4, 1, '#6b3a1e'); // café
    },
    quadroEscala(g, m) { // escala de limpeza
      const { X, Y, w } = m; r(g, X, Y + 1, w, 14, CONTORNO); r(g, X + 1, Y + 2, w - 2, 12, '#fff9db');
      for (let k = 0; k < 4; k++) { r(g, X + 3, Y + 4 + k * 3, w - 9, 1, '#adb5bd'); r(g, X + w - 5, Y + 3 + k * 3, 2, 2, k < 3 ? VERDE : '#e03131'); }
    },
  };
  // quadro de vagas do RH: setores com vaga aberta e quantos já entraram
  function quadroVagas(ctx, d, t) {
    const { X, Y, w } = d, cfg = KM.config && KM.config(), n = cfg ? cfg.funcionarios.filter(f => f.contratado).length : 0;
    r(ctx, X, Y + 1, w, 14, CONTORNO); r(ctx, X + 1, Y + 2, w - 2, 12, '#ffffff');
    texto(ctx, 'VAGAS', X + 3, Y + 3, '#7048e8');
    for (let k = 0; k < 3; k++) r(ctx, X + 3 + k * 6, Y + 10, 4, 3, k < Math.min(3, n) ? VERDE : Math.floor(t * 2 + k) % 2 ? '#ffd43b' : '#e9ecef');
    texto(ctx, String(n), X + w - 8, Y + 9, '#1c1612');
  }

  // ------------------------------------------------------------------ desenho dinâmico (telas, relógio, janela…)
  function conteudoTela(ctx, x, y, w, h, modo, t, funcao) {
    r(ctx, x, y, w, h, '#0c1416');
    if (modo === 'off') { r(ctx, x, y, w, h, '#132042'); simboloPixel(ctx, x + 2 + Math.round((Math.sin(t * 0.7) + 1) * (w - 10) / 2), y + 2 + Math.round((Math.cos(t * 0.5) + 1) * (h - 8) / 2), 0.4, '#2d5aa0'); return; }
    if (modo === 'idle') { // tela azul acesa, com brilho no canto (como num escritório moderno)
      r(ctx, x, y, w, h, '#2f86e0'); r(ctx, x, y, w, 2, '#5fb0f5'); r(ctx, x, y, 2, h, '#5fb0f5'); r(ctx, x + 2, y + 2, 3, 1, '#bfe3ff');
      r(ctx, x, y + h - 2, w, 2, '#2470c4'); simboloPixel(ctx, x + (w >> 1) - 3, y + (h >> 1) - 3, 0.5, '#e7f5ff'); return;
    }
    const f = Math.floor(t * 6);
    if (funcao === 'noticias') { r(ctx, x, y, w, 2, VERDE); for (let i = 0; i < 4; i++) r(ctx, x + 1, y + 3 + i * 2, 3 + ((f + i * 3) % (w - 4)), 1, i % 2 ? '#d8f5df' : '#ffffff'); }
    else if (funcao === 'checklist') { r(ctx, x, y, w, h, '#fffdf6'); for (let i = 0; i < 3; i++) { r(ctx, x + 1, y + 1 + i * 3, 2, 2, (f >> 2) % 4 > i ? VERDE : '#ced4da'); r(ctx, x + 4, y + 1 + i * 3, w - 6, 1, '#9aa3a1'); } }
    else if (funcao === 'prospeccao') { r(ctx, x, y, w, h, '#d0ebff'); r(ctx, x + 2, y + 2, w - 6, h - 4, '#b2f2bb'); for (let i = 0; i < 3; i++) if ((f + i) % 4) r(ctx, x + 3 + ((i * 5 + 2) % (w - 6)), y + 2 + ((i * 3) % (h - 4)), 1, 2, '#e03131'); }
    else if (funcao === 'video') { r(ctx, x, y, w, h - 4, '#1b1f22'); r(ctx, x + 2, y + 1, w - 4, h - 6, (f >> 2) % 2 ? '#28BE52' : '#111A19'); r(ctx, x + 4, y + 3, w - 8, 1, '#ffffff'); r(ctx, x, y + h - 4, w, 4, '#343a40'); for (let i = 0; i < 4; i++) r(ctx, x + 1 + i * 5, y + h - 3, 4, 1, ['#ff6b6b', '#4dabf7', '#ffd43b', '#b197fc'][i]); r(ctx, x + (f % w), y + h - 4, 1, 4, '#ffffff'); }
    else if (funcao === 'relacionamento') { r(ctx, x, y, w, h, '#fff0f6'); r(ctx, x, y, w, 2, VERDE); for (let i = 0; i < 3; i++) { r(ctx, x + 1, y + 3 + i * 3, 2, 2, (f >> 1) % 4 > i ? '#f06595' : '#ced4da'); r(ctx, x + 4, y + 3 + i * 3, w - 6, 1, '#adb5bd'); } }
    else if (funcao === 'fiscal') { r(ctx, x, y, w, h, '#ffffff'); r(ctx, x, y, w, 2, '#1971c2'); for (let i = 0; i < 3; i++) { r(ctx, x + 1, y + 3 + i * 2, w - 7, 1, '#adb5bd'); r(ctx, x + w - 5, y + 3 + i * 2, 4, 1, (f >> 1) % 3 === i ? '#e03131' : VERDE); } }
    else if (funcao === 'folha') { r(ctx, x, y, w, h, '#fff9db'); r(ctx, x, y, w, 2, '#e8590c'); for (let i = 0; i < 3; i++) { r(ctx, x + 1, y + 3 + i * 2, 2, 1, '#868e96'); r(ctx, x + 4, y + 3 + i * 2, 3 + ((f + i * 2) % (w - 6)), 1, i === 2 ? VERDE : '#495057'); } }
    else if (funcao === 'contato') { r(ctx, x, y, w, h, '#ece5dd'); r(ctx, x, y, w, 2, '#075e54'); for (let i = 0; i < 3; i++) if ((f >> 1) % 5 >= i) r(ctx, i % 2 ? x + 2 : x + w - 8, y + 3 + i * 3, 6, 2, i % 2 ? '#ffffff' : '#dcf8c6'); }
    else r(ctx, x, y, w, h, '#14352a');
  }
  function janela(ctx, m, cfg, t) {
    const per = periodo(cfg), { X, Y, w } = m, h = 12;
    const ceus = { dia: ['#7cc6f2', '#bfe6fb'], tarde: ['#f59a5b', '#fde3a7'], noite: ['#0d1630', '#22325e'] }, cs = ceus[per] || ceus.dia;
    r(ctx, X - 1, Y + 1, w + 2, h + 2, '#f2f2ee');
    r(ctx, X, Y + 2, w, h, cs[0]); r(ctx, X, Y + 8, w, 6, cs[1]);
    if (per === 'noite') { r(ctx, X + w - 6, Y + 3, 3, 3, '#fffbe0'); for (let i = 0; i < 5; i++) if ((Math.floor(t * 2) + i) % 4) r(ctx, X + 2 + i * 5, Y + 4 + (i % 3) * 2, 1, 1, '#ffffff'); }
    else { r(ctx, X + 3, Y + 3, 3, 3, per === 'dia' ? '#fff3a3' : '#ffd36b'); const nx = X + (((t * 3) % (w + 10)) | 0) - 8; ctx.save(); ctx.beginPath(); ctx.rect(X, Y + 2, w, h); ctx.clip(); r(ctx, nx, Y + 5, 8, 2, '#ffffff'); r(ctx, nx + 2, Y + 4, 4, 1, '#ffffff'); ctx.restore(); }
    r(ctx, X + (w >> 1), Y + 2, 1, h, '#f2f2ee'); r(ctx, X - 1, Y + h + 2, w + 2, 1, '#c9c9c2');
  }
  // Telão com a lista de clientes ativos rodando (Relacionamento).
  function telao(ctx, m, cfg, t) {
    const { X, Y, w } = m, y = Y + 1, h = 13;
    r(ctx, X - 1, y - 1, w + 2, h + 2, '#0b0f10'); r(ctx, X, y, w, h, '#111A19'); r(ctx, X, y, w, 5, VERDE);
    texto(ctx, 'CLIENTES', X + 2, y, '#111A19');
    const lista = (cfg.clientes || []).filter(c => (c.status || 'ativo') === 'ativo').map(c => c.nome).filter(Boolean);
    const txt = (lista.length ? lista.join(' * ') : 'CADASTRE SEUS CLIENTES ATIVOS') + ' * ';
    const larg = KM.larguraTexto(txt) + 4, off = Math.floor(t * 14) % larg;
    ctx.save(); ctx.beginPath(); ctx.rect(X + 1, y + 6, w - 2, 6); ctx.clip();
    for (let x = X + 1 - off; x < X + w; x += larg) texto(ctx, txt, x, y + 7, '#9be3ad');
    ctx.restore();
    texto(ctx, String(lista.length), X + w - 4 * String(lista.length).length - 1, y, '#ffffff');
  }
  function relogio(ctx, m) {
    const x = m.X, y = m.Y + 3;
    r(ctx, x + 2, y, 5, 9, CONTORNO); r(ctx, x, y + 2, 9, 5, CONTORNO); r(ctx, x + 1, y + 1, 7, 7, CONTORNO);
    r(ctx, x + 2, y + 1, 5, 7, '#ffffff'); r(ctx, x + 1, y + 2, 7, 5, '#ffffff');
    const d = new Date(), ang = (v, tot) => (v / tot) * Math.PI * 2 - Math.PI / 2;
    const a1 = ang(d.getHours() % 12 + d.getMinutes() / 60, 12), a2 = ang(d.getMinutes(), 60);
    for (let k = 0; k <= 2; k++) r(ctx, Math.round(x + 4 + Math.cos(a1) * k), Math.round(y + 4 + Math.sin(a1) * k), 1, 1, GRAFITE);
    for (let k = 0; k <= 3; k++) r(ctx, Math.round(x + 4 + Math.cos(a2) * k), Math.round(y + 4 + Math.sin(a2) * k), 1, 1, '#d4483b');
  }
  function painelTV(ctx, m, estado, t) {
    const { X, Y, w } = m, h = 14, y = Y + 1;
    r(ctx, X, y, w, h, '#0c0f10'); r(ctx, X + 1, y + 1, w - 2, h - 2, GRAFITE); r(ctx, X + 1, y + 1, w - 2, 5, VERDE);
    texto(ctx, 'KWIK', X + 2, y + 1, '#ffffff');
    const tv = estado.tv || {};
    if (tv.modo === 'trabalhando') {
      const pr = Math.max(0, Math.min(100, tv.progresso || 0)), bw = w - 6;
      r(ctx, X + 3, y + 8, bw, 3, '#26332f'); r(ctx, X + 3, y + 8, Math.round(bw * pr / 100), 3, VERDE);
      texto(ctx, String(Math.round(pr)), X + w - 12, y + 1, '#111A19');
    } else if (tv.modo === 'pronto') texto(ctx, 'PRONTO', X + 4, y + 7, '#ffffff');
    else if (tv.modo === 'matrix') { for (let i = 0; i < 7; i++) texto(ctx, String((Math.floor(t * 8) + i * 3) % 10), X + 2 + i * 4, y + 7, i % 2 ? VERDE : '#8dffad'); }
    else {
      const d = new Date();
      texto(ctx, String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'), X + 2, y + 7, '#ffffff');
      [3, 5, 4, 6].forEach((a, i) => r(ctx, X + w - 10 + i * 2, y + 12 - a + (i === 3 && Math.floor(t) % 2 ? -1 : 0), 1, a, i === 3 ? VERDE : '#2E8B45'));
    }
  }
  function mural(ctx, m, cfg) {
    const { X, Y, w } = m, fotos = (cfg.maycon && cfg.maycon.fotos) || 0;
    r(ctx, X, Y + 1, w, 13, '#6b4a2a'); r(ctx, X + 1, Y + 2, w - 2, 11, '#c99a62');
    const pos = [[2, 2], [8, 3], [14, 2], [20, 3], [5, 7], [12, 8]], cs = ['#6aa5d8', '#28BE52', '#f2c14e', '#ff8fb1', '#c9453a', '#7B4FBF'];
    for (let i = 0; i < Math.min(fotos, pos.length); i++) { const [x, y] = pos[i]; r(ctx, X + x, Y + y, 5, 4, '#ffffff'); r(ctx, X + x + 1, Y + y + 1, 3, 2, cs[i]); r(ctx, X + x + 2, Y + y, 1, 1, '#c9453a'); }
  }
  function moedas(ctx, m, caixa, t) {
    const pilhas = Math.min(4, Math.ceil(caixa / 600)), alturaTot = Math.min(40, Math.floor(caixa / 60));
    for (let i = 0; i < pilhas; i++) {
      const n = Math.max(1, Math.min(10, alturaTot - i * 10)), x = m.X - 6 - i * 8, y = m.Y + m.d - 1 - (i % 2) * 3;
      for (let k = 0; k < n; k++) { r(ctx, x - 3, y - k * 2 - 1, 6, 2, '#9a6f12'); r(ctx, x - 3, y - k * 2 - 2, 6, 1, k % 2 ? '#f2c230' : '#e6b422'); }
      if (n >= 10 && Math.floor(t * 2 + i) % 6 === 0) r(ctx, x + 1, y - n * 2 - 1, 1, 1, '#ffffff');
    }
  }
  function monitorDe(ctx, m, estado, t) {
    const p = Object.values(estado.pessoas || {}).find(q => q.funcao === m.funcao);
    const modo = !p || p.visivel === false ? 'off' : p.dormindo ? 'off' : (estado.trabalhoDe && estado.trabalhoDe[m.funcao]) || (p && (p.trabalhando || (p.digitando && p.modo === 'sentado'))) ? 'trab' : 'idle';
    const ty = m.Y - m.h, cx = m.X + (m.w >> 1);
    if (m.tela === 'notebook') {
      const x = m.X + m.w - 15, y = ty - 8;
      r(ctx, x - 1, y - 1, 14, 10, '#1d2440'); conteudoTela(ctx, x, y, 12, 8, modo, t, m.funcao); r(ctx, x - 2, ty + 1, 16, 3, '#adb5bd'); r(ctx, x - 1, ty + 2, 14, 1, '#ced4da');
      return;
    }
    const tela1 = (x, w) => { r(ctx, x - 1, ty - 15, w + 2, 12, '#1d2440'); conteudoTela(ctx, x, ty - 14, w, 10, modo, t, m.funcao); r(ctx, x + (w >> 1) - 1, ty - 3, 2, 3, '#3a4160'); r(ctx, x + (w >> 1) - 3, ty, 6, 1, '#3a4160'); };
    if (m.tela === 'duplo') { tela1(cx - 19, 18); tela1(cx + 1, 18); }
    else tela1(cx - 9, 18);
    if (modo !== 'off') { ctx.fillStyle = 'rgba(95,176,245,0.10)'; ctx.fillRect(cx - 20, ty - 2, 40, 10); } // brilho azul da tela na mesa
    if (modo === 'trab' || estado.matrix) { ctx.fillStyle = estado.matrix ? 'rgba(80,255,130,0.18)' : 'rgba(120,230,160,' + (0.08 + 0.05 * Math.sin(t * 10)) + ')'; ctx.fillRect(cx - 18, ty - 4, 36, 18); }
  }
  // ar-condicionado: soprando (linhas de vento) ou aberto na manutenção
  function arCond(ctx, d, estado, t) {
    const { X, Y, w } = d, y = Y + 1, manut = estado.manutencaoAC === d;
    r(ctx, X - 1, y - 1, w + 2, 9, CONTORNO); r(ctx, X, y, w, 7, '#f8f9fa'); r(ctx, X, y + 5, w, 2, '#dee2e6');
    r(ctx, X + 1, y + 1, 3, 1, VERDE);
    if (manut) {
      r(ctx, X + 1, y + 2, w - 2, 3, '#495057'); for (let x = X + 2; x < X + w - 2; x += 2) r(ctx, x, y + 3, 1, 1, '#adb5bd');
      if (Math.floor(t * 8) % 2) r(ctx, X + (w >> 1), y + 2, 1, 1, '#ffe066');
      r(ctx, X + w - 3, y - 3, 3, 3, '#ff6b6b'); r(ctx, X + w - 2, y - 2, 1, 1, '#ffffff'); // etiqueta "em manutenção"
      return;
    }
    const k = Math.floor(t * 2) % 2; r(ctx, X + 1, y + 5 + k, w - 2, 1, '#adb5bd');
    for (let i = 0; i < 3; i++) { const f = (t * 1.6 + i / 3) % 1; ctx.fillStyle = `rgba(165,216,255,${0.6 * (1 - f)})`; ctx.fillRect(X + 2 + i * ((w - 4) / 3 | 0), y + 9 + Math.round(f * 8), 2, 1); }
  }
  function painelMeta(ctx, d, cfg, t) {
    const { X, Y, w } = d, md = KM.metaDados ? KM.metaDados(cfg) : { total: 0, meta: 10, qAtivos: 0 };
    r(ctx, X, Y + 1, w, 14, CONTORNO); r(ctx, X + 1, Y + 2, w - 2, 12, '#0f1f17');
    const valor = 'R$' + Math.round(md.total || 0).toLocaleString('pt-BR');
    const larg = KM.larguraTexto(valor);
    texto(ctx, valor, X + Math.max(2, (w - larg) >> 1), Y + 3, '#51cf66');
    const pct = Math.min(1, (md.qAtivos || 0) / (md.meta || 10));
    r(ctx, X + 3, Y + 10, w - 6, 2, '#2b3a33'); r(ctx, X + 3, Y + 10, Math.round((w - 6) * pct), 2, Math.floor(t * 2) % 2 && pct >= 1 ? '#ffd43b' : VERDE);
  }
  function calendarioParede(ctx, d, cfg, t) {
    const { X, Y, w } = d, hoje = new Date();
    const prox = KM.reuniaoProxima ? KM.reuniaoProxima(cfg) : null;
    const hojeTem = prox && prox.ehHoje;
    r(ctx, X, Y + 1, w, 14, CONTORNO); r(ctx, X + 1, Y + 2, w - 2, 12, '#ffffff'); r(ctx, X + 1, Y + 2, w - 2, 4, hojeTem && Math.floor(t * 2) % 2 ? '#ffd43b' : '#e03131');
    r(ctx, X + 3, Y, 1, 3, '#495057'); r(ctx, X + w - 4, Y, 1, 3, '#495057');
    const dia = String(hoje.getDate());
    texto(ctx, dia, X + ((w - KM.larguraTexto(dia)) >> 1), Y + 8, '#1c1612');
    if (hojeTem) r(ctx, X + w - 4, Y + 11, 2, 2, '#e03131');
  }
  // letreiro de LED com as ações da última análise do Rodrigo (ou índices de exemplo)
  function tickerBolsa(ctx, d, cfg, t) {
    const { X, Y, w } = d;
    r(ctx, X, Y + 1, w, 14, CONTORNO); r(ctx, X + 1, Y + 2, w - 2, 12, '#05140c');
    const itens = (cfg.financas && cfg.financas.ticker && cfg.financas.ticker.length) ? cfg.financas.ticker : [['IBOV', 1], ['IDIV', 1], ['IFIX', 1], ['SELIC', 0], ['CDI', 0]];
    const s = itens.map(([c, up]) => `${c} ${up > 0 ? '+' : up < 0 ? '-' : '*'}`).join('  ') + '   ';
    const larg = KM.larguraTexto(s) + 4, off = Math.floor(t * 12) % larg;
    ctx.save(); ctx.beginPath(); ctx.rect(X + 2, Y + 2, w - 4, 12); ctx.clip();
    for (let k = -1; k < 2; k++) {
      let x = X + 2 - off + k * larg;
      for (const [c, up] of itens) {
        x = texto(ctx, c, x, Y + 4, '#a9e34b') + 2;
        const cor = up > 0 ? '#51cf66' : up < 0 ? '#ff6b6b' : '#ffd43b';
        if (up > 0) { r(ctx, x + 1, Y + 5, 1, 1, cor); r(ctx, x, Y + 6, 3, 1, cor); r(ctx, x + 1, Y + 7, 1, 2, cor); }
        else if (up < 0) { r(ctx, x + 1, Y + 5, 1, 2, cor); r(ctx, x, Y + 7, 3, 1, cor); r(ctx, x + 1, Y + 8, 1, 1, cor); }
        else r(ctx, x, Y + 6, 3, 2, cor);
        x += 8;
      }
    }
    ctx.restore();
    r(ctx, X + 1, Y + 12, w - 2, 1, '#0b2a17');
  }
  function quadroExec(ctx, d, cfg, t) {
    const { X, Y, w } = d, n = (cfg.execucao || []).filter(a => !a.fim).length;
    r(ctx, X, Y + 1, w, 14, CONTORNO); r(ctx, X + 1, Y + 2, w - 2, 12, '#ffffff');
    texto(ctx, 'EM EXECUCAO', X + 2, Y + 3, '#1E8A45');
    const sn = String(n);
    r(ctx, X + 2, Y + 9, w - 4, 4, '#e9ecef');
    for (let i = 0; i < Math.min(n, 10); i++) r(ctx, X + 3 + i * 4, Y + 10, 3, 2, i % 2 ? '#28BE52' : '#1E8A45');
    texto(ctx, sn, X + w - 3 - KM.larguraTexto(sn), Y + 9, n && Math.floor(t * 2) % 2 ? '#e8590c' : '#111A19');
  }
  // quadros das salas Fiscal e Folha: mostram os números de verdade quando os dados dos apps já carregaram
  function quadroSetor(ctx, d, t, k) {
    const { X, Y, w } = d, R = KM.setores && KM.setores.resumoParede(k);
    r(ctx, X, Y + 1, w, 14, CONTORNO); r(ctx, X + 1, Y + 2, w - 2, 12, '#ffffff');
    if (k === 'fiscal') {
      texto(ctx, 'GUIAS', X + 3, Y + 3, '#1971c2');
      const venc = R ? R.a : 0, prox = R ? R.b : 0;
      r(ctx, X + 3, Y + 9, 3, 3, '#e03131'); texto(ctx, R ? String(venc) : '-', X + 8, Y + 9, venc && Math.floor(t * 2) % 2 ? '#e03131' : '#1c1612');
      r(ctx, X + 18, Y + 9, 3, 3, '#fab005'); texto(ctx, R ? String(prox) : '-', X + 23, Y + 9, '#1c1612');
      r(ctx, X + w - 9, Y + 3, 6, 9, '#e9ecef'); r(ctx, X + w - 8, Y + 4, 4, 1, '#1971c2'); r(ctx, X + w - 8, Y + 6, 4, 1, '#adb5bd'); r(ctx, X + w - 8, Y + 8, 3, 1, '#adb5bd'); r(ctx, X + w - 8, Y + 10, 4, 1, VERDE);
    } else {
      texto(ctx, 'FOLHA', X + 3, Y + 3, '#e8590c');
      const ok = R ? R.a : 0, tot = R ? R.b : 0;
      r(ctx, X + 3, Y + 10, w - 16, 3, '#e9ecef'); if (tot) r(ctx, X + 3, Y + 10, Math.round((w - 16) * ok / tot), 3, VERDE);
      texto(ctx, R ? `${ok}/${tot}` : '-', X + w - 12, Y + 9, '#1c1612');
      r(ctx, X + w - 9, Y + 3, 6, 5, '#ffe8cc'); r(ctx, X + w - 8, Y + 4, 2, 2, '#e8590c'); r(ctx, X + w - 5, Y + 4, 1, 3, '#868e96');
    }
  }
  // telão da sala de Apresentação: slides da KWIK (recepcao.js avança os slides durante a reunião)
  function slides(ctx, d, estado, t) {
    const { X, Y, w } = d, ap = estado.apresentacao || {}, k = ap.ativo ? ap.slide || 0 : -1;
    r(ctx, X - 1, Y, w + 2, 16, CONTORNO); r(ctx, X, Y + 1, w, 14, '#ffffff');
    const x = X + 2, y = Y + 2, ww = w - 4;
    if (k < 0) { r(ctx, x, y, ww, 12, GRAFITE); simboloPixel(ctx, x + 3, y + 1, 0.8, VERDE); texto(ctx, 'KWIK', x + 16, y + 4, '#ffffff'); texto(ctx, 'BEM-VINDO', x + 34, y + 4, '#9be3ad'); return; }
    r(ctx, x, y, ww, 2, VERDE);
    if (k === 0) { simboloPixel(ctx, x + 2, y + 2, 0.75, VERDE); texto(ctx, 'KWIK CONTABIL', x + 14, y + 5, GRAFITE); }
    else if (k === 1) { texto(ctx, 'SERVICOS', x + 2, y + 3, GRAFITE); for (let i = 0; i < 3; i++) { r(ctx, x + 2 + i * 18, y + 9, 3, 2, VERDE); r(ctx, x + 6 + i * 18, y + 9, 10, 1, '#adb5bd'); } }
    else if (k === 2) { texto(ctx, 'ECONOMIA', x + 2, y + 3, GRAFITE); [3, 5, 7, 9].forEach((a, i) => r(ctx, x + 40 + i * 4, y + 12 - a, 3, a, i === 3 ? VERDE : '#2E8B45')); }
    else if (k === 3) { texto(ctx, 'PLANOS', x + 2, y + 3, GRAFITE); for (let i = 0; i < 3; i++) { r(ctx, x + 30 + i * 9, y + 3, 7, 9, i === 1 ? VERDE : '#e9ecef'); r(ctx, x + 31 + i * 9, y + 5, 5, 1, i === 1 ? '#ffffff' : '#adb5bd'); } }
    else { texto(ctx, 'OBRIGADO!', x + 4, y + 5, '#1E8A45'); if (Math.floor(t * 3) % 2) r(ctx, x + ww - 8, y + 4, 4, 4, '#ff6b9a'); }
    r(ctx, X + w - 9, Y + 12, 6, 2, '#adb5bd'); r(ctx, X + w - 9, Y + 12, Math.round(6 * (k + 1) / 5), 2, VERDE);
  }
  // TV da sala de jogos com o PS5: tela inicial ou corrida quando alguém está jogando
  function tvGame(ctx, d, estado, t) {
    const { X, Y, w } = d, jog = Object.values(estado.pessoas || {}).some(p => p.jogando && (p.lugarJogo === 'ps5a' || p.lugarJogo === 'ps5b'));
    r(ctx, X - 1, Y, w + 2, 16, CONTORNO); r(ctx, X, Y + 1, w, 14, '#0b0f1a');
    const x = X + 1, y = Y + 2, ww = w - 2;
    if (!jog) {
      r(ctx, x, y, ww, 12, '#0c2a5a'); r(ctx, x, y + 9, ww, 3, '#0a1f45');
      texto(ctx, 'PS5', x + 2, y + 2, '#ffffff');
      for (let i = 0; i < 4; i++) r(ctx, x + 2 + i * 9, y + 8, 7, 3, i === Math.floor(t) % 4 ? '#ffffff' : '#4dabf7');
      return;
    }
    // corrida: pista rolando, dois carrinhos e placar
    r(ctx, x, y, ww, 4, '#74c0fc'); r(ctx, x, y + 4, ww, 8, '#495057');
    const off = Math.floor(t * 30) % 8;
    for (let u = -8 + off; u < ww; u += 8) r(ctx, x + Math.max(0, u), y + 8, 3, 1, '#ffffff');
    const a = Math.round((Math.sin(t * 1.3) + 1) * 8), b = Math.round((Math.cos(t * 1.1) + 1) * 8);
    r(ctx, x + 6 + a, y + 5, 5, 2, '#e03131'); r(ctx, x + 6 + b, y + 9, 5, 2, '#28BE52');
    texto(ctx, String(Math.floor(t) % 3 + 1), x + ww - 5, y, '#ffd43b');
  }
  function desenharDinamicos(ctx, cfg, estado, t) {
    for (const d of L.decor) desenharDecorDin(ctx, d, cfg, estado, t);
    for (const m of L.moveis) { if (m.tipo === 'mesa') monitorDe(ctx, m, estado, t); else dinMovel(ctx, m, estado, t); }
  }
  function desenharDecorDin(ctx, d, cfg, estado, t) {
    {
      if (d.tipo === 'janela') janela(ctx, d, cfg, t);
      else if (d.tipo === 'telao') telao(ctx, d, cfg, t);
      else if (d.tipo === 'tvReuniao') { r(ctx, d.X, d.Y + 1, d.w, 13, '#111'); r(ctx, d.X + 1, d.Y + 2, d.w - 2, 11, '#14352a'); const k = Math.floor(t / 4) % 3; [[4, 7, 5, 9], [6, 4, 8, 5], [3, 6, 8, 10]][k].forEach((a, i) => r(ctx, d.X + 4 + i * 6, d.Y + 12 - a, 4, a, i === 3 ? VERDE : '#2E8B45')); texto(ctx, 'KWIK', d.X + d.w - 18, d.Y + 3, '#ffffff'); }
      else if (d.tipo === 'relogio') relogio(ctx, d);
      else if (d.tipo === 'painel') painelTV(ctx, d, estado, t);
      else if (d.tipo === 'mural') mural(ctx, d, cfg);
      else if (d.tipo === 'arCond') arCond(ctx, d, estado, t);
      else if (d.tipo === 'painelMeta') painelMeta(ctx, d, cfg, t);
      else if (d.tipo === 'calendario') calendarioParede(ctx, d, cfg, t);
      else if (d.tipo === 'tickerBolsa') tickerBolsa(ctx, d, cfg, t);
      else if (d.tipo === 'quadroExec') quadroExec(ctx, d, cfg, t);
      else if (d.tipo === 'slides') slides(ctx, d, estado, t);
      else if (d.tipo === 'tvGame') tvGame(ctx, d, estado, t);
      else if (d.tipo === 'quadroFiscal') quadroSetor(ctx, d, t, 'fiscal');
      else if (d.tipo === 'quadroFolha') quadroSetor(ctx, d, t, 'folha');
      else if (d.tipo === 'quadroVagas') quadroVagas(ctx, d, t);
    }
  }
  function dinMovel(ctx, m, estado, t) {
    {
      if (m.tipo === 'mesa') return;
      else if (m.tipo === 'cofre') moedas(ctx, m, estado.caixa || 0, t);
      else if (m.tipo === 'ringlight') { const on = estado.trabalhoDe && estado.trabalhoDe.video; const x = m.X + 2, y = m.Y - 26; r(ctx, x - 4, y - 4, 9, 9, '#343a40'); r(ctx, x - 3, y - 3, 7, 7, on ? '#fff9db' : '#adb5bd'); r(ctx, x - 1, y - 1, 3, 3, '#343a40'); if (on) { ctx.fillStyle = 'rgba(255,249,219,0.18)'; ctx.fillRect(x - 10, y - 8, 30, 40); } }
      else if (m.tipo === 'buffet' && estado.refeicaoAtiva) { for (let i = 0; i < 4; i++) { const fy = (t * 7 + i * 3) % 9; ctx.fillStyle = `rgba(255,255,255,${0.75 - fy / 12})`; ctx.fillRect(m.X + 8 + i * 14 + Math.round(Math.sin(t * 3 + i)), m.Y - m.h - 3 - fy, 1, 1); } }
      else if (m.tipo === 'cafeteira' && (estado.cafeCopa || estado.cafeRecepcao)) { for (let i = 0; i < 3; i++) { const fy = (t * 8 + i * 4) % 10; ctx.fillStyle = `rgba(255,255,255,${0.7 - fy / 14})`; ctx.fillRect(m.X + 6 + Math.round(Math.sin(t * 3 + i)), m.Y - m.h - 11 - fy, 1, 1); } }
      else if (m.tipo === 'bancada' && estado.cafeCopa) { for (let i = 0; i < 3; i++) { const fy = (t * 8 + i * 4) % 10; ctx.fillStyle = `rgba(255,255,255,${0.7 - fy / 14})`; ctx.fillRect(m.X + 10 + Math.round(Math.sin(t * 3 + i)), m.Y - m.h - 8 - fy, 1, 1); } }
    }
  }

  // ------------------------------------------------------------------ cadeira (desenhada junto com as pessoas)
  function cadeira(ctx, m, cfg, ocupada) {
    const e = cfg.escritorio, c = e.cadeira, mod = e.modeloCadeira || 'escritorio', x = m.sx, y = m.sy;
    if (mod === 'madeira') {
      r(ctx, x - 6, y - 1, 2, 4, '#5a3a22'); r(ctx, x + 4, y - 1, 2, 4, '#5a3a22');
      if (!ocupada) { r(ctx, x - 7, y - 12, 14, 6, tom(c, 1.1)); }
      r(ctx, x - 7, y - 9, 14, 2, '#5a3a22'); r(ctx, x - 7, y - 5, 14, 2, '#5a3a22'); r(ctx, x - 7, y - 9, 2, 10, '#5a3a22'); r(ctx, x + 5, y - 9, 2, 10, '#5a3a22');
      return;
    }
    r(ctx, x - 6, y + 2, 12, 2, '#2b2f33'); r(ctx, x - 1, y - 2, 2, 4, '#55595c'); r(ctx, x - 6, y + 2, 2, 2, '#111'); r(ctx, x + 4, y + 2, 2, 2, '#111');
    if (!ocupada) { r(ctx, x - 7, y - 13, 14, 6, CONTORNO); r(ctx, x - 6, y - 12, 12, 4, tom(c, 1.15)); }
    const alto = mod === 'gamer' ? 15 : 10;
    r(ctx, x - 8, y - 3 - alto, 16, alto + 1, CONTORNO); r(ctx, x - 7, y - 2 - alto, 14, alto - 1, c); r(ctx, x - 7, y - 2 - alto, 14, 1, tom(c, 1.3));
    if (mod === 'gamer') { r(ctx, x - 2, y - 1 - alto, 4, alto - 2, VERDE); r(ctx, x - 5, y - alto + 1, 2, 2, '#ffffff'); }
    else r(ctx, x - 5, y - 4, 10, 1, tom(c, 0.75));
  }

  // ------------------------------------------------------------------ exterior (grama, árvores, calçada, rua)
  function semente(n) { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function arvore(g, x, y, tipo) {
    r(g, x - 6, y + 1, 13, 3, 'rgba(0,0,0,0.18)');
    if (tipo === 'pinheiro') {
      r(g, x - 1, y - 2, 3, 4, '#6b4a2a');
      for (let k = 0; k < 4; k++) { const w = 4 + k * 3; r(g, x - (w >> 1), y - 16 + k * 4, w, 4, k % 2 ? '#2b6b3f' : '#245c36'); r(g, x - (w >> 1), y - 16 + k * 4, 2, 1, '#3f8f55'); }
      r(g, x, y - 18, 1, 2, '#245c36');
      return;
    }
    r(g, x - 1, y - 3, 3, 5, '#6b4a2a');
    r(g, x - 6, y - 14, 13, 11, '#2f7a3d'); r(g, x - 7, y - 12, 15, 7, '#2f7a3d'); r(g, x - 4, y - 16, 9, 3, '#2f7a3d');
    r(g, x - 5, y - 14, 6, 4, '#4a9e4f'); r(g, x - 3, y - 15, 3, 1, '#62b866'); r(g, x + 2, y - 8, 4, 3, '#256b33');
  }
  // Tema moderno: o prédio fica no meio da cidade ao entardecer (céu em degradê, estrelas, prédios ao fundo, calçada e rua escuras).
  const CEU_FORA = { noite: ['#141838', '#2a2350', '#3d2a55'], tarde: ['#2b2d63', '#6a3f72', '#b8667a'], dia: ['#6fa5dc', '#9cc5ec', '#cfe2f3'] };
  function desenharCidadeFora(g, cfg) {
    const rnd = semente(777 + (L.nome === 'alto' ? 7 : 0)), per = periodo(cfg), [c1, c2, c3] = CEU_FORA[per] || CEU_FORA.tarde;
    for (let y = 0; y < L.H; y++) { const k = y / L.H; g.fillStyle = k < 0.4 ? c1 : k < 0.75 ? c2 : c3; g.fillRect(0, y, L.W, 1); }
    if (per !== 'dia') for (let i = 0; i < L.W * L.H / 900; i++) r(g, (rnd() * L.W) | 0, (rnd() * L.H) | 0, 1, 1, rnd() < 0.3 ? '#fff3bf' : '#e9e4ff');
    // prédios distantes (aparecem em volta do escritório)
    const corPred = per === 'dia' ? '#7f97b5' : per === 'tarde' ? '#2d2650' : '#1a1c3a';
    for (let x = -4; x < L.W;) {
      const bw = 10 + ((rnd() * 18) | 0), bh = 14 + ((rnd() * 26) | 0);
      r(g, x, TOPO - bh + 6, bw, bh, corPred);
      if (per !== 'dia') for (let yy = TOPO - bh + 9; yy < TOPO + 4; yy += 4) for (let xx = x + 2; xx < x + bw - 2; xx += 4) if (rnd() < 0.3) r(g, xx, yy, 2, 2, rnd() < 0.75 ? '#ffd27a' : '#9ad1ff');
      x += bw + 1 + ((rnd() * 3) | 0);
    }
    const c0 = L.corredores[0], P0 = L.predio;
    for (const lado of [[0, P0.x], [P0.x + P0.w, L.W]]) { // laterais: prédios altos em silhueta
      for (let y = TOPO + 8; y < L.rua - 4;) {
        const bh = 30 + ((rnd() * 40) | 0);
        r(g, lado[0], y, lado[1] - lado[0], Math.min(bh, L.rua - 4 - y), tom(corPred, 1.08));
        if (per !== 'dia') for (let yy = y + 3; yy < Math.min(y + bh, L.rua - 6); yy += 5) for (let xx = lado[0] + 3; xx < lado[1] - 3; xx += 5) if (rnd() < 0.25) r(g, xx, yy, 2, 2, '#ffd27a');
        y += bh + 3;
      }
    }
    // caminho até a entrada
    for (let x = 0; x < P0.x; x += 6) { r(g, x, c0.y + 14, 5, 12, '#5d6380'); r(g, x, c0.y + 14, 5, 1, '#767d9e'); }
    for (let y = c0.y + 26; y < L.rua + 12; y += 6) { r(g, 3, y, 13, 5, '#5d6380'); r(g, 3, y, 13, 1, '#767d9e'); }
    // jardineiras, calçada, meio-fio e rua
    const yb = L.rua;
    for (let x = P0.x; x < P0.x + P0.w; x += 18) { r(g, x, yb + 5, 16, 5, '#3b3f5a'); r(g, x + 1, yb + 3, 14, 3, '#2f7a3d'); r(g, x + 3, yb + 2, 4, 2, '#4a9e4f'); r(g, x + 9, yb + 2, 4, 2, '#3f8f55'); }
    r(g, 0, yb + 11, L.W, 13, '#5a5f78');
    for (let x = 0; x < L.W; x += 12) r(g, x, yb + 11, 1, 13, '#4c5068');
    r(g, 0, yb + 11, L.W, 1, '#767d9e');
    r(g, 0, yb + 24, L.W, 2, '#8a8fa8');
    r(g, 0, yb + 26, L.W, 22, '#262a38');
    for (let x = 4; x < L.W; x += 20) r(g, x, yb + 36, 10, 2, '#c9c3b0');
    L.postes = [];
    for (let x = 40; x < L.W - 10; x += 110) { r(g, x, yb + 4, 2, 16, '#1b1e33'); r(g, x - 3, yb + 2, 8, 3, '#2b2f45'); r(g, x - 2, yb + 5, 6, 1, '#ffe8a3'); L.postes.push([x + 1, yb + 8]); }
  }
  function desenharExterior(g, cfg) {
    if (moderno(cfg.escritorio)) return desenharCidadeFora(g, cfg);
    const rnd = semente(4242 + (L.nome === 'alto' ? 7 : 0));
    r(g, 0, 0, L.W, L.H, '#5c9a45');
    for (let i = 0; i < L.W * L.H / 60; i++) { const x = (rnd() * L.W) | 0, y = (rnd() * L.H) | 0; r(g, x, y, 1 + (rnd() < 0.3 ? 1 : 0), 1, rnd() < 0.5 ? '#68a84f' : '#528c3e'); }
    for (let i = 0; i < L.W / 14; i++) { const x = (rnd() * L.W) | 0, y = (rnd() * L.H) | 0; r(g, x, y, 1, 1, ['#ffd43b', '#ffffff', '#ff8fb1'][i % 3]); }
    // caminho de pedra até a entrada (lado esquerdo do primeiro corredor)
    const c0 = L.corredores[0], P0 = L.predio;
    for (let x = 2; x < P0.x; x += 5) r(g, x, c0.y + 14, 4, 12, '#c8bfae');
    for (let y = c0.y + 26; y < L.rua + 12; y += 5) r(g, 4, y, 12, 4, '#c8bfae');
    // árvores
    const pontos = [];
    for (let x = 8; x < L.W - 4; x += 16 + ((rnd() * 10) | 0)) pontos.push([x, 12 + ((rnd() * 12) | 0)]);
    if (P0.x > 20) for (let y = TOPO + 30; y < L.rua - 10; y += 40 + ((rnd() * 20) | 0)) { pontos.push([10 + ((rnd() * 8) | 0), y]); pontos.push([L.W - 12 - ((rnd() * 6) | 0), y + 18]); }
    pontos.sort((a, b) => a[1] - b[1]).forEach(([x, y], i) => arvore(g, x, y, rnd() < 0.45 ? 'pinheiro' : 'redonda'));
    // cerca viva, calçada e rua
    const yb = L.rua;
    for (let x = P0.x; x < P0.x + P0.w; x += 9) { r(g, x, yb + 3, 8, 6, '#2f7a3d'); r(g, x + 1, yb + 3, 4, 2, '#4a9e4f'); }
    r(g, 0, yb + 11, L.W, 13, '#cdbfa9');
    for (let x = 0; x < L.W; x += 10) r(g, x, yb + 11, 1, 13, '#b8a990');
    r(g, 0, yb + 17, L.W, 1, '#b8a990');
    r(g, 0, yb + 24, L.W, 2, '#8a8f94');
    r(g, 0, yb + 26, L.W, 22, '#4a4f56');
    for (let x = 4; x < L.W; x += 20) r(g, x, yb + 36, 10, 2, '#e9e4d8');
    L.postes = [];
    for (let x = 40; x < L.W - 10; x += 110) { r(g, x, yb + 6, 2, 14, '#343a40'); r(g, x - 2, yb + 4, 6, 3, '#495057'); r(g, x - 1, yb + 7, 4, 1, '#ffe066'); L.postes.push([x + 1, yb + 8]); }
  }

  function desenharPredio(g, cfg) {
    const e = cfg.escritorio, P0 = L.predio;
    r(g, P0.x + 4, P0.y + 4, P0.w, P0.h, 'rgba(0,0,0,0.22)');
    // corredores
    for (const c of L.corredores) {
      g.drawImage(moderno(e) ? texPiso({ piso: 'porcelanato', corPiso: '#cfd2cc' }, c.w, c.h) : texXadrez('#d9dde0', '#cfd4d8', c.w, c.h, 10), c.x, c.y);
      r(g, c.x, c.y, c.w, 3, 'rgba(0,0,0,0.12)');
      for (const s of Object.values(L.salas)) if (s.corrBaixo === c || s.corrCima === c) { r(g, s.fx + 44, c.y + 18, 80, 10, '#8f9aa6'); r(g, s.fx + 45, c.y + 19, 78, 8, '#a8b3be'); r(g, s.fx + 47, c.y + 21, 74, 1, '#8f9aa6'); r(g, s.fx + 47, c.y + 25, 74, 1, '#8f9aa6'); }
    }
    const LT = L.lateral;
    if (LT) { // corredor lateral dos clientes: piso, parede do fundo e a faixa-guia verde até a Apresentação
      g.drawImage(moderno(e) ? texPiso({ piso: 'porcelanato', corPiso: '#cfd2cc' }, LT.w, LT.h - NB) : texXadrez('#d9dde0', '#cfd4d8', LT.w, LT.h - NB, 10), LT.x, LT.y + NB);
      g.drawImage(texFace({ id: 'lateral', w: LT.w + 2 * T }, e), LT.x - T, LT.y + 4);
      r(g, LT.x - T, LT.y, LT.w + 2 * T, 4, TOPO_PAREDE); r(g, LT.x - T, LT.y, LT.w + 2 * T, 1, TOPO_LUZ);
      const ap = L.salas.apresentacao, yFim = ap ? ap.y - 10 : LT.y + LT.h - 8, c0 = L.corredores[0];
      for (let yy = c0.y + 30; yy < yFim; yy += 9) { r(g, LT.x + LT.w / 2 - 1, yy, 2, 5, 'rgba(40,190,82,.75)'); }
      for (let yy = c0.y + 48; yy < yFim - 6; yy += 46) { r(g, LT.x + LT.w / 2 - 3, yy, 6, 1, VERDE); r(g, LT.x + LT.w / 2 - 2, yy + 1, 4, 1, VERDE); r(g, LT.x + LT.w / 2 - 1, yy + 2, 2, 1, VERDE); }
    }
    for (const s of Object.values(L.salas)) {
      const RW = s.w, RH = s.h; // salas podem ter largura/altura diferentes (Execução cresce)
      g.drawImage(pisoDaSala(s, e), s.fx, s.fy);
      r(g, s.fx, s.fy, RW, 3, 'rgba(0,0,0,0.10)');
      g.drawImage(texFace(s, e), s.fx, s.y + 4);
      r(g, s.x - T, s.y, RW + 2 * T, 4, TOPO_PAREDE); r(g, s.x - T, s.y, RW + 2 * T, 1, TOPO_LUZ);
      if (s.portaCima) { // passagem na parede de cima: mostra o chão e o batente
        const x0 = s.fx + PORTA[0], x1 = s.fx + PORTA[1];
        g.drawImage(pisoDaSala(s, e), 0, 0, x1 - x0, NB, x0, s.y, x1 - x0, NB);
        r(g, x0 - 2, s.y, 2, NB, '#5c4632'); r(g, x1, s.y, 2, NB, '#5c4632'); r(g, x0, s.y + NB - 2, x1 - x0, 2, 'rgba(0,0,0,0.12)');
      }
      // paredes laterais e de baixo (finas)
      r(g, s.x - T, s.y, T, RH + T, TOPO_PAREDE); r(g, s.x + RW, s.y, T, RH + T, TOPO_PAREDE);
      r(g, s.x - T, s.y, 1, RH + T, TOPO_LUZ); r(g, s.x + RW, s.y, 1, RH + T, TOPO_LUZ);
      const yb = s.y + RH;
      const parteBaixo = (x0, x1) => { r(g, x0, yb, x1 - x0, T, TOPO_PAREDE); r(g, x0, yb, x1 - x0, 1, TOPO_LUZ); r(g, x0, yb + T, x1 - x0, 2, tom(e.parede, 0.7)); };
      if (s.portaBaixo) {
        parteBaixo(s.x - T, s.fx + PORTA[0]); parteBaixo(s.fx + PORTA[1], s.x + RW + T);
        r(g, s.fx + PORTA[0], yb, PORTA[1] - PORTA[0], T, '#d9dde0'); r(g, s.fx + PORTA[0] - 1, yb, 1, T, '#5c4632'); r(g, s.fx + PORTA[1], yb, 1, T, '#5c4632');
        r(g, s.fx + PORTA[0] + 2, yb - 4, PORTA[1] - PORTA[0] - 4, 4, '#8d6a4a'); r(g, s.fx + PORTA[0] + 3, yb - 3, PORTA[1] - PORTA[0] - 6, 2, '#a07a55');
      }
      else parteBaixo(s.x - T, s.x + RW + T);
    }
    // paredes externas: lado esquerdo inteiro (entrada de vidro no primeiro corredor), pontas da direita e o fundo do corredor lateral
    r(g, P0.x, P0.y, T, P0.h, TOPO_PAREDE); r(g, P0.x, P0.y, 1, P0.h, TOPO_LUZ);
    if (LT) { r(g, LT.x - T, LT.y + LT.h, LT.w + 2 * T, T, TOPO_PAREDE); r(g, LT.x - T, LT.y + LT.h, LT.w + 2 * T, 1, TOPO_LUZ); }
    L.corredores.forEach((c, i) => {
      r(g, P0.x + P0.w - T, c.y, T, c.h, TOPO_PAREDE);
      if (i === 0) { r(g, P0.x, c.y + 12, T, 16, '#a5d8ff'); r(g, P0.x + 1, c.y + 12, 1, 16, '#e7f5ff'); r(g, P0.x, c.y + 19, T, 1, '#74c0fc'); }
    });
  }

  // ------------------------------------------------------------------ fundo em cache
  let fundo = null, fundoPer = '';
  KM.limparCache = () => { cache.clear(); fundo = null; limparIso(); if (L && KM.config) { mobiliar(L, KM.config()); montarGrade(L); } };
  function montarFundo(cfg) {
    const c = tela(L.W, L.H), g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    desenharExterior(g, cfg);
    desenharPredio(g, cfg);
    for (const d of L.decor) if (DES[d.tipo]) DES[d.tipo](g, d, cfg);
    const est = L.moveis.filter(m => !m.ordenar && DES[m.tipo]).sort((a, b) => (a.tipo === 'tapete' ? -1e4 : 0) + a.Y + a.d - ((b.tipo === 'tapete' ? -1e4 : 0) + b.Y + b.d));
    for (const m of est) DES[m.tipo](g, m, cfg);
    if (KM.festas) try { KM.festas.desenhar2D(g, L, cfg); } catch (e) { console.warn('decoração', e); }
    fundoPer = periodo(cfg);
    return c;
  }

  // ------------------------------------------------------------------ escolher a planta (computador x celular)
  // Monta a planta (computador ou celular). Também refaz quando a Sala de Execução precisa crescer/diminuir.
  KM.definirLayout = function (nome, cfg, iso) {
    iso = !!iso;
    const cel = window.matchMedia('(max-width: 760px)').matches;
    if (L && L.nome === nome && ISO.on === iso && (!iso || ISO.cel === cel)) {
      const ex = tamanhoExecucao(ativasExecucao(cfg), nome === 'largo' ? 1 : 2);
      if (ex.span === L.exec.span && ex.fileiras === L.exec.fileiras && L.contratados === chaveContratados(cfg)) return false;
    }
    const mudouVisao = ISO.on !== iso || ISO.cel !== cel;
    L = KM.LAYOUT = montarLayout(nome, cfg);
    KM.MW = L.W; KM.MH = L.H;
    ISO.on = iso; ISO.cel = cel;
    if (iso) {
      ISO.ox = L.H + PADI; ISO.oy = WALLH + PADI + 8;
      ISO.w = L.W + L.H + 2 * PADI; ISO.h = (L.W + L.H) / 2 + ISO.oy + PADI;
      KM.W = cel ? 400 : 1000; KM.H = cel ? 620 : 600;
      if (mudouVisao || !ISO.camPronta) { // começa perto da Recepção e da Diretoria (o ⤢ mostra o prédio inteiro)
        const d = L.salas.diretoria; cel ? KM.camera.focar(d.x + 20, d.fy + 60, 0.8) : KM.camera.focar(d.x + 140, d.fy + 120, 1);
        ISO.camPronta = true;
      }
    } else { KM.W = L.W; KM.H = L.H; }
    limparIso();
    fundo = null;
    return true;
  };

  // ================================================================== VISÃO DIAGONAL (isométrica)
  // O mundo continua o mesmo (salas, móveis e caminhos em X/Y, de cima); só o desenho muda:
  //   x_tela = X − Y      y_tela = (X + Y) / 2 − Z      (+ câmera com arrastar e zoom)
  // Piso, tapetes e rua: o desenho de cima é "deitado" na diagonal. Paredes do fundo de cada sala ficam altas
  // (com os janelões e os quadros); as da frente ficam baixinhas para dar para ver dentro. Mesas, estantes,
  // sofás… viram caixas na diagonal; objetos pequenos (plantas, luminárias…) e pessoas ficam em pé.
  const ISO = { on: false, cel: false, ox: 0, oy: 0, w: 0, h: 0, cam: { x: 0, y: 0, z: 1 }, chao: null, paredes: null, sprites: new Map(), ceu: null, per: '', camPronta: false };
  const WALLH = 30, BAIXA = 6, PADI = 30;
  KM.isoAtivo = () => ISO.on;
  // com o 3D carregado (cena3d.js), a projeção, a câmera e os cliques passam a ser os do 3D
  const T3 = () => ISO.on && KM.tresD && KM.tresD.ok;
  const prj = (X, Y, Z = 0) => (T3() ? KM.tresD.prj(X, Y, Z) : [X - Y + ISO.ox, (X + Y) / 2 - Z + ISO.oy]);
  KM.prj = (X, Y, Z = 0) => (ISO.on ? prj(X, Y, Z) : [X, Y - Z]);
  KM.paraTela = (x, y) => (ISO.on ? [(x - ISO.cam.x) * ISO.cam.z + KM.W / 2, (y - ISO.cam.y) * ISO.cam.z + KM.H / 2] : [x, y]);
  KM.telaParaCena = (x, y) => (ISO.on ? [(x - KM.W / 2) / ISO.cam.z + ISO.cam.x, (y - KM.H / 2) / ISO.cam.z + ISO.cam.y] : [x, y]);
  KM.telaParaMundo = (x, y) => { if (!ISO.on) return [x, y]; if (T3()) return KM.tresD.mundo(x, y); const [ix, iy] = KM.telaParaCena(x, y), a = ix - ISO.ox, b = 2 * (iy - ISO.oy); return [(a + b) / 2, (b - a) / 2]; };
  // desenha algo feito "de cima" em pé, no lugar certo da diagonal (X, Y = ponto do chão)
  KM.bb = (g, X, Y, fn) => { if (!ISO.on) return fn(); const [px, py] = prj(X, Y); g.save(); g.translate(px - X, py - Y); try { fn(); } finally { g.restore(); } };
  KM.rotuloPos = s => (ISO.on ? KM.paraTela(...prj(s.x + s.w / 2, s.fy, T3() ? KM.tresD.HN + 12 : WALLH + 10)) : [s.x + s.w / 2, s.y + 2]);
  function limparIso() { ISO.chao = null; ISO.paredes = null; ISO.sprites.clear(); ISO.ceu = null; if (KM.tresD) KM.tresD.sujo = true; }

  // ------------------------------------------------------------------ câmera
  function limitarCam() { const c = ISO.cam; c.z = Math.max(0.3, Math.min(2.5, c.z)); c.x = Math.max(0, Math.min(ISO.w, c.x)); c.y = Math.max(0, Math.min(ISO.h, c.y)); }
  KM.camera = {
    ajustar() { if (T3()) return KM.tresD.cam.ajustar(); const c = ISO.cam; c.z = Math.min(KM.W / ISO.w, KM.H / ISO.h) * 1.02; c.x = ISO.w / 2; c.y = ISO.h / 2 + 6; },
    zoom(f, cx, cy) {
      if (T3()) return KM.tresD.cam.zoom(f, cx, cy);
      const c = ISO.cam, foco = cx != null ? KM.telaParaCena(cx, cy) : null;
      c.z *= f; limitarCam();
      if (foco) { const [bx, by] = KM.telaParaCena(cx, cy); c.x += foco[0] - bx; c.y += foco[1] - by; limitarCam(); }
    },
    mover(dx, dy) { if (T3()) return KM.tresD.cam.mover(dx, dy); const c = ISO.cam; c.x -= dx / c.z; c.y -= dy / c.z; limitarCam(); },
    focar(X, Y, z) { if (T3()) return KM.tresD.cam.focar(X, Y, z); const [x, y] = prj(X, Y); ISO.cam.x = x; ISO.cam.y = y; if (z) ISO.cam.z = z; limitarCam(); },
    estado: () => (T3() ? KM.tresD.cam.estado() : { ...ISO.cam }),
  };

  // ------------------------------------------------------------------ caixa na diagonal (pixel a pixel, coluna por coluna)
  // (X, Y) = canto de trás do móvel no chão; w ao longo de X, d ao longo de Y, h de altura; o.z = altura da base
  function isoCaixa(g, X, Y, w, d, h, cor, o = {}) {
    const [ax, ay] = prj(X, Y, o.z || 0);
    const topo = o.topo || cor, sul = o.sul || tom(cor, 0.84), leste = o.leste || tom(cor, 0.68), borda = o.borda || tom(cor, 0.42);
    const x0 = Math.floor(ax - d), x1 = Math.ceil(ax + w), cC = ax + w - d;
    for (let x = x0; x < x1; x++) {
      const xx = x + 0.5;
      const yUp = xx <= ax ? ay + (ax - xx) / 2 : ay + (xx - ax) / 2;
      const yLo = xx <= cC ? ay + d / 2 + (xx - (ax - d)) / 2 : ay + (w + d) / 2 - (xx - cC) / 2;
      const t0 = Math.round(yUp - h), t1 = Math.round(yLo - h), b1 = Math.round(yLo);
      g.fillStyle = topo; g.fillRect(x, t0, 1, Math.max(1, t1 - t0));
      if (h > 0) { g.fillStyle = xx <= cC ? sul : leste; g.fillRect(x, t1, 1, Math.max(0, b1 - t1)); }
      g.fillStyle = borda; g.fillRect(x, t0 - 1, 1, 1); g.fillRect(x, h > 0 ? b1 : t1, 1, 1);
      if (Math.abs(xx - cC) < 0.6 && h > 0) { g.fillStyle = tom(topo, 1.12); g.fillRect(x, t1, 1, b1 - t1); }
    }
    g.fillStyle = borda; g.fillRect(x0 - 1, Math.round(ay + d / 2 - h), 1, h + 1); g.fillRect(x1, Math.round(ay + w / 2 - h), 1, h + 1);
    g.fillStyle = tom(topo, 1.14); for (let x = Math.floor(ax); x < x1 - 1; x++) g.fillRect(x, Math.round(ay + (x + 0.5 - ax) / 2 - h), 1, 1);
  }
  // linha no chão/na face, entre dois pontos do mundo na altura z
  function isoLinha(g, X1, Y1, X2, Y2, z, cor) {
    const [a, b] = prj(X1, Y1, z), [c, d] = prj(X2, Y2, z), n = Math.max(1, Math.round(Math.abs(c - a)));
    g.fillStyle = cor; for (let i = 0; i <= n; i++) g.fillRect(Math.round(a + (c - a) * i / n), Math.round(b + (d - b) * i / n), 1, 1);
  }
  // listras horizontais na face da frente (gavetas, prateleiras)
  function faceSul(g, X, Y, w, d, h, n, cor) { for (let k = 1; k < n; k++) isoLinha(g, X, Y + d, X + w, Y + d, Math.round(h * k / n), cor); }

  // móveis que viram caixas na diagonal (o resto fica em pé, com o desenho de sempre)
  const ISO_MOVEIS = {
    mesa: (g, m, e) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, e.mesa); isoCaixa(g, m.X + m.w - 12, m.Y + m.d - 2, 10, 2, m.h - 1, tom(e.mesa, 0.92)); faceSul(g, m.X + m.w - 12, m.Y, 10, m.d, m.h, 3, tom(e.mesa, 0.7)); },
    mesaReuniao: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#7a4a2e'); isoCaixa(g, m.X + 3, m.Y + 3, m.w - 6, m.d - 6, 0, '#8d5a3b', { z: m.h }); },
    mesaJantar: (g, m) => isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#c98a55'),
    mesaRefeicao: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#c98a55'); isoCaixa(g, m.X + 4, m.Y + 4, m.w - 8, m.d - 8, 0, '#f1f3f5', { z: m.h }); },
    mesaApresentacao: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#f8f9fa'); isoLinha(g, m.X, m.Y + m.d, m.X + m.w, m.Y + m.d, 2, VERDE); },
    mesaCartas: (g, m) => isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#1864ab', { topo: '#1c7ed6' }),
    sinuca: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#6b3f22'); isoCaixa(g, m.X + 3, m.Y + 3, m.w - 6, m.d - 6, 0, '#2f9e44', { z: m.h, borda: '#2b8a3e' }); },
    pingue: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#1971c2'); isoLinha(g, m.X + m.w / 2, m.Y, m.X + m.w / 2, m.Y + m.d, m.h + 2, '#f8f9fa'); },
    pebolim: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#5c3d2e'); isoCaixa(g, m.X + 2, m.Y + 2, m.w - 4, m.d - 4, 0, '#2f9e44', { z: m.h }); },
    balcao: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#f1f3f5', { sul: GRAFITE, leste: '#0b100f' }); isoLinha(g, m.X, m.Y + m.d, m.X + m.w, m.Y + m.d, m.h - 3, VERDE); },
    mesinha: (g, m) => isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#8d5a3b'),
    mesaExec: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#f1f3f5'); isoLinha(g, m.X, m.Y + m.d, m.X + m.w, m.Y + m.d, m.h - 2, VERDE); },
    estante: (g, m, e) => {
      isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, e.estante || '#a0612f');
      const cores = ['#3f7fc1', '#2E8B45', '#c9453a', '#e2b33c', '#5a4fa8', '#e9e4d8'];
      for (let k = 0; k < 4; k++) { const z = 3 + k * 6; for (let i = 0; i < m.w - 2; i += 2) isoLinha(g, m.X + 1 + i, m.Y + m.d, m.X + 2 + i, m.Y + m.d, z + 3, cores[(i + k) % cores.length]); isoLinha(g, m.X, m.Y + m.d, m.X + m.w, m.Y + m.d, z, tom(e.estante || '#a0612f', 0.6)); }
    },
    arquivo: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#868e96'); faceSul(g, m.X, m.Y, m.w, m.d, m.h, 3, '#495057'); },
    geladeira: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#e9ecef'); faceSul(g, m.X, m.Y, m.w, m.d, m.h, 2, '#adb5bd'); },
    frigobar: (g, m) => isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#e9ecef'),
    cofre: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#5b636a'); isoLinha(g, m.X + m.w / 2 - 2, m.Y + m.d, m.X + m.w / 2 + 2, m.Y + m.d, m.h / 2, '#e6c04a'); },
    impressora: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#dee2e6'); isoCaixa(g, m.X + 2, m.Y + 1, m.w - 4, 3, 2, '#ffffff', { z: m.h }); },
    rackTV: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#212529'); isoCaixa(g, m.X + 3, m.Y + 2, 3, 4, 12, '#f8f9fa', { z: m.h }); },
    fliperama: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#7048e8', { sul: '#5f3dc4' }); isoLinha(g, m.X + 2, m.Y + m.d, m.X + m.w - 2, m.Y + m.d, m.h - 6, '#4dabf7'); isoLinha(g, m.X + 2, m.Y + m.d, m.X + m.w - 2, m.Y + m.d, m.h - 8, '#ff4fd8'); },
    bancada: (g, m) => isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#dee2e6'),
    buffet: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#ced4da'); for (let i = 0; i < 4; i++) isoCaixa(g, m.X + 4 + i * 14, m.Y + 2, 10, m.d - 4, 1, ['#ffd43b', '#ff8787', '#69db7c', '#ffa94d'][i], { z: m.h }); },
    sofa: (g, m, e) => {
      const c = e.corSofa || '#3f7fc1';
      isoCaixa(g, m.X, m.Y, m.w, 5, 14, tom(c, 0.92)); isoCaixa(g, m.X, m.Y + 3, 4, m.d - 3, 9, tom(c, 0.85));
      isoCaixa(g, m.X + 3, m.Y + 5, m.w - 6, m.d - 5, 6, c);
      if (e.modeloSofa === 'futon') for (const k of [0.2, 0.5, 0.8]) isoCaixa(g, m.X + m.w * k - 3, m.Y + 4, 6, 2, 5, '#e8913a', { z: 6 });
      isoCaixa(g, m.X + m.w - 4, m.Y + 3, 4, m.d - 3, 9, tom(c, 0.85));
    },
    poltrona: (g, m, e) => { const c = e.corSofa || '#3f7fc1'; isoCaixa(g, m.X, m.Y, m.w, 4, 13, tom(c, 0.9)); isoCaixa(g, m.X + 2, m.Y + 4, m.w - 4, m.d - 4, 6, c); },
    sofaCostas: (g, m) => { const c = '#5f3dc4'; isoCaixa(g, m.X + 2, m.Y - 2, m.w - 4, m.d - 2, 6, tom(c, 1.15)); isoCaixa(g, m.X, m.Y + m.d - 5, m.w, 5, 12, c); },
    banco: (g, m) => isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#8d5a3b'),
    banco2: (g, m) => isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#6b7088'),
    puff: (g, m) => isoCaixa(g, m.X, m.Y, m.w, m.d, 7, m.cor || '#ff8c5a'),
    pufeKwik: (g, m) => isoCaixa(g, m.X, m.Y, m.w, m.d, 7, VERDE),
    prateleiraLimpeza: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#adb5bd'); faceSul(g, m.X, m.Y, m.w, m.d, m.h, 3, '#4dabf7'); },
    tanque: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#e9ecef'); isoCaixa(g, m.X + 2, m.Y + 2, m.w - 4, m.d - 4, 0, '#a5d8ff', { z: m.h }); },
    ferramentas: (g, m) => isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#e03131'),
    bancadaZeca: (g, m) => { isoCaixa(g, m.X, m.Y, m.w, m.d, m.h, '#8d5a3b'); isoCaixa(g, m.X + 3, m.Y + 2, 10, 4, 6, '#343a40', { z: m.h }); },
    carrinhoLimpeza: null, tanqueMeta: null,
  };
  // sprite (em cache) de cada móvel: caixa na diagonal ou o desenho de sempre em pé
  function spriteMovel(m, cfg) {
    let s = ISO.sprites.get(m);
    if (s) return s;
    const e = cfg.escritorio, fnIso = ISO_MOVEIS[m.tipo];
    if (fnIso) {
      const [lx] = prj(m.X, m.Y + m.d), [rx] = prj(m.X + m.w, m.Y), [, ty] = prj(m.X, m.Y, (m.h || 0) + 34), [, by] = prj(m.X + m.w, m.Y + m.d);
      const x0 = Math.floor(lx) - 4, y0 = Math.floor(ty) - 4, c = tela(Math.ceil(rx - x0) + 6, Math.ceil(by - y0) + 6), g = c.getContext('2d');
      g.translate(-x0, -y0); fnIso(g, m, e);
      if (m.tipo === 'mesa') { // itens em cima da mesa (papéis, caneca…) no fundo do tampo
        const cx = m.X + (m.w >> 1), [px, py] = prj(cx, m.Y + 2);
        g.save(); g.translate(px - cx, py - (m.Y + 2)); (m.itens || []).forEach((o, i) => SOBRE[o] && SOBRE[o](g, i ? m.X + m.w - 9 : m.X + 3, m.Y + 2 - m.h + 1)); g.restore();
      }
      s = { c, x: x0, y: y0 };
    } else {
      const x0 = m.X - 26, y0 = m.Y - (m.h || 0) - 52, c = tela((m.w || 10) + 52, (m.h || 0) + (m.d || 8) + 64), g = c.getContext('2d');
      g.translate(-x0, -y0); DES[m.tipo](g, m, cfg);
      const ax = m.X + (m.w || 0) / 2, ay = m.Y + (m.d || 0), [px, py] = prj(ax, ay);
      s = { c, x: px - (ax - x0), y: py - (ay - y0) };
    }
    ISO.sprites.set(m, s);
    return s;
  }
  // parede do fundo de cada sala (alta, com janelões e quadros), em fatias para ficar na frente/atrás certo
  function montarParedes(cfg) {
    const e = cfg.escritorio, per = periodo(cfg), out = [];
    for (const s of Object.values(L.salas)) {
      const w = s.w + 2 * T, c = tela(w, WALLH + 4), g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      if (s.id === 'jogos') { g.fillStyle = '#2c2344'; g.fillRect(0, 4, w, WALLH); g.fillStyle = 'rgba(255,255,255,0.05)'; for (let u = 0; u < w; u += 8) g.fillRect(u, 4, 1, WALLH); g.fillStyle = '#ff4fd8'; g.fillRect(0, WALLH, w, 1); g.fillStyle = '#3fb6ff'; g.fillRect(0, WALLH + 1, w, 1); }
      else if (s.id === 'diretoria' && moderno(e)) { g.fillStyle = '#9a5526'; g.fillRect(0, 4, w, WALLH); for (let u = 0; u < w; u += 5) { g.fillStyle = (u / 5) % 2 ? '#a65d2a' : '#8d4d22'; g.fillRect(u, 4, 5, WALLH - 2); g.fillStyle = '#7a4019'; g.fillRect(u, 4, 1, WALLH - 2); } g.fillStyle = '#c9a65b'; g.fillRect(0, WALLH + 1, w, 1); }
      else if (moderno(e)) { g.save(); g.translate(0, 4); janelas(g, w, WALLH, per, s.id === 'execucao' || s.id === 'apresentacao' ? VERDE : null); g.restore(); }
      else { g.fillStyle = e.parede; g.fillRect(0, 4, w, WALLH); g.drawImage(texFace(s, e), T, 4 + WALLH - (NB - 4)); g.fillStyle = e.rodape; g.fillRect(0, WALLH + 2, w, 2); }
      g.fillStyle = TOPO_PAREDE; g.fillRect(0, 0, w, 4); g.fillStyle = TOPO_LUZ; g.fillRect(0, 0, w, 1);
      // quadros fixos (os que mudam são desenhados a cada quadro)
      g.save(); g.translate(-(s.x - T), -s.fy + WALLH - 2);
      for (const d of L.decor) if (d.sala === s.id && DES[d.tipo] && !d.din) DES[d.tipo](g, d, cfg);
      g.restore();
      if (s.id === 'jogos') { const n = L.decor.find(d => d.tipo === 'neon'); if (n) { const u = n.X - (s.x - T), v = WALLH - 2 - (s.fy - n.Y) + 2; g.fillStyle = '#16102a'; g.fillRect(u, v, 40, 11); texto(g, 'KWIK', u + 3, v + 3, '#ff4fd8'); texto(g, 'PLAY', u + 21, v + 3, '#3fb6ff'); } }
      const porta = s.portaCima ? [T + PORTA[0], T + PORTA[1]] : null;
      out.push({ s, c, w, porta, M: [1, 0.5, 0, 1, (s.x - T) - s.fy + ISO.ox, (s.x - T + s.fy) / 2 + ISO.oy - WALLH - 4] });
    }
    return out;
  }
  // chão inteiro (rua, praça, pisos, tapetes) desenhado de cima e deitado na diagonal + paredes baixas
  function montarChaoIso(cfg) {
    const e = cfg.escritorio, m = tela(L.W, L.H), g = m.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#3a3e57'; g.fillRect(0, 0, L.W, L.H);
    for (let y = 0; y < L.H; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < L.W; x += 12) { g.fillStyle = '#41465f'; g.fillRect(x, y, 11, 11); }
    const yb = L.rua, c0 = L.corredores[0], P0 = L.predio;
    g.fillStyle = '#5a5f78'; g.fillRect(0, yb + 11, L.W, 13); g.fillStyle = '#8a8fa8'; g.fillRect(0, yb + 24, L.W, 2);
    g.fillStyle = '#262a38'; g.fillRect(0, yb + 26, L.W, L.H - yb - 26); g.fillStyle = '#c9c3b0'; for (let x = 4; x < L.W; x += 20) g.fillRect(x, yb + 36, 10, 2);
    g.fillStyle = '#6b7088'; g.fillRect(0, c0.y + 14, P0.x + 2, 12); g.fillRect(3, c0.y + 14, 13, yb + 12 - c0.y - 14);
    g.drawImage(moderno(e) ? texPiso({ piso: 'porcelanato', corPiso: '#cfd2cc' }, P0.w, P0.h) : texXadrez('#d9dde0', '#cfd4d8', P0.w, P0.h, 10), P0.x, P0.y);
    for (const s of Object.values(L.salas)) g.drawImage(pisoDaSala(s, e), s.fx, s.fy);
    for (const mv of L.moveis) if (mv.tipo === 'tapete') DES.tapete(g, mv, cfg);
    for (const c of L.corredores) for (const s of Object.values(L.salas)) if (s.corrBaixo === c || s.corrCima === c) { g.fillStyle = '#a8b3be'; g.fillRect(s.fx + 45, c.y + 19, 78, 8); }
    const c = tela(ISO.w, ISO.h), gi = c.getContext('2d');
    gi.imageSmoothingEnabled = false;
    gi.setTransform(1, 0.5, -1, 0.5, ISO.ox, ISO.oy); gi.drawImage(m, 0, 0); gi.setTransform(1, 0, 0, 1, 0, 0);
    // paredes baixas: frente e laterais das salas (com as portas), pontas dos corredores
    const pw = '#3a4060';
    for (const s of Object.values(L.salas)) {
      const yb2 = s.y + s.h;
      if (s.portaBaixo) { isoCaixa(gi, s.x - T, yb2, PORTA[0] + T, T, BAIXA, pw); isoCaixa(gi, s.fx + PORTA[1], yb2, s.x + s.w + T - (s.fx + PORTA[1]), T, BAIXA, pw); }
      else isoCaixa(gi, s.x - T, yb2, s.w + 2 * T, T, BAIXA, pw);
      isoCaixa(gi, s.x + s.w, s.fy, T, s.h - NB, BAIXA, pw);
      if (s.col === 0) isoCaixa(gi, s.x - T, s.fy, T, s.h - NB, BAIXA, pw);
    }
    L.corredores.forEach(cc => isoCaixa(gi, P0.x + P0.w - T, cc.y, T, cc.h, BAIXA, pw));
    isoCaixa(gi, P0.x, P0.y + NB, T, c0.y + 12 - P0.y - NB, BAIXA, pw); isoCaixa(gi, P0.x, c0.y + 28, T, P0.y + P0.h - c0.y - 28, BAIXA, pw);
    if (L.lateral) { const q = L.lateral; isoCaixa(gi, q.x - T, q.y + q.h, q.w + 2 * T, T, BAIXA, pw); }
    return c;
  }
  function ceuIso(cfg) {
    const per = periodo(cfg), k = per + KM.W + 'x' + KM.H;
    if (ISO.ceu && ISO.ceu.k === k) return ISO.ceu.c;
    const c = tela(KM.W, KM.H), g = c.getContext('2d'), [c1, c2, c3] = CEU_FORA[per] || CEU_FORA.tarde, rnd = semente(99);
    for (let y = 0; y < KM.H; y++) { const f = y / KM.H; g.fillStyle = f < 0.4 ? c1 : f < 0.75 ? c2 : c3; g.fillRect(0, y, KM.W, 1); }
    if (per !== 'dia') for (let i = 0; i < KM.W * KM.H / 700; i++) { g.fillStyle = rnd() < 0.3 ? '#fff3bf' : '#e9e4ff'; g.fillRect((rnd() * KM.W) | 0, (rnd() * KM.H) | 0, 1, 1); }
    ISO.ceu = { k, c };
    return c;
  }
  const dirIso = p => { const d = dirDe(p); return sentado(p) && d[0] === 'c' ? 'cd' : d; }; // sentado de costas: olhando para a mesa (diagonal para cima à direita)

  function desenharIso(ctx, cfg, estado, t) {
    if (KM.tresD && !KM.tresD.ok && !KM.tresD.falhou) KM.tresD.carregar(); // o 3D carrega em segundo plano; enquanto isso, a diagonal desenhada
    if (T3()) { KM.tresD._dt = ISO.dt; return KM.tresD.render(ctx, cfg, estado, t); }
    const per = periodo(cfg);
    if (ISO.per !== per) { limparIso(); ISO.per = per; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(ceuIso(cfg), 0, 0);
    const z = ISO.cam.z;
    ctx.setTransform(z, 0, 0, z, KM.W / 2 - ISO.cam.x * z, KM.H / 2 - ISO.cam.y * z);
    ctx.imageSmoothingEnabled = z < 0.97;
    if (!ISO.chao) ISO.chao = montarChaoIso(cfg);
    if (!ISO.paredes) ISO.paredes = montarParedes(cfg);
    ctx.drawImage(ISO.chao, 0, 0);
    // marcas no chão (piso molhado…) deitadas na diagonal
    ctx.save(); ctx.transform(1, 0.5, -1, 0.5, ISO.ox, ISO.oy); for (const x of KM.noChao || []) x(ctx, t, 'chao'); ctx.restore();
    // luz quente das luminárias no piso
    if (moderno(cfg.escritorio)) {
      const forca = per === 'noite' ? 0.38 : per === 'tarde' ? 0.3 : 0.16;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, k] of L.luzes || []) { const [px, py] = prj(x, y); ctx.globalAlpha = forca * (k || 1); ctx.drawImage(brilho(), px - 34, py - 17, 68, 34); }
      ctx.restore();
    }
    const lista = [];
    // paredes do fundo, em fatias
    for (const P of ISO.paredes) {
      for (let u = 0; u < P.w; u += 8) {
        if (P.porta && u + 8 > P.porta[0] && u < P.porta[1]) continue;
        const uw = Math.min(8, P.w - u);
        lista.push({ p: P.s.x - T + u + 4 + P.s.fy - 3, f: c => { c.save(); c.transform(...P.M); c.drawImage(P.c, u, 0, uw, P.c.height, u, 0, uw, P.c.height); c.restore(); } });
      }
      if (P.porta) { const [a] = P.porta; lista.push({ p: P.s.x - T + a + P.s.fy - 3, f: c => { c.save(); c.transform(...P.M); c.fillStyle = '#5c4632'; c.fillRect(a - 2, 4, 2, WALLH); c.fillRect(P.porta[1], 4, 2, WALLH); c.restore(); } }); }
    }
    // quadros que mudam (TV, relógio, slides, PS5…) na parede
    for (const d of L.decor) if (d.din) {
      const s = L.salas[d.sala]; if (!s) continue;
      lista.push({ p: d.X + (d.w || 10) / 2 + s.fy - 2, f: c => { c.save(); c.transform(1, 0.5, 0, 1, ISO.ox - s.fy, ISO.oy - s.fy / 2 - 6); desenharDecorDin(c, d, cfg, estado, t); c.restore(); } });
    }
    // móveis
    const ocupada = f => Object.values(estado.pessoas || {}).some(p => p.funcao === f && p.modo === 'sentado' && p.visivel !== false);
    for (const m of L.moveis) {
      if (m.tipo === 'tapete') continue;
      if (m.tipo === 'cadeira') { lista.push({ p: m.sx + m.sy + 1.5, f: c => KM.bb(c, m.sx, m.sy, () => cadeira(c, m, cfg, ocupada(m.funcao))) }); continue; }
      const fnIso = ISO_MOVEIS[m.tipo];
      if (!DES[m.tipo] && !fnIso) continue;
      const ax = m.X + (m.w || 0) / 2, ay = m.Y + (m.d || 0);
      lista.push({ p: m.X + (m.w || 0) / 2 + m.Y + (m.d || 0) / 2, f: c => {
        if (!fnIso && (m.din || m.ordenar)) KM.bb(c, ax, ay, () => DES[m.tipo](c, m, cfg)); // muda a cada quadro: desenha direto
        else { const s = spriteMovel(m, cfg); c.drawImage(s.c, s.x, s.y); }
        if (m.tipo === 'mesa') { const cx = m.X + (m.w >> 1); KM.bb(c, cx, m.Y, () => monitorDe(c, m, estado, t)); }
        else KM.bb(c, ax, ay, () => dinMovel(c, m, estado, t));
      } });
    }
    // postes e carro da rua
    for (const [x, y] of L.postes || []) lista.push({ p: x + L.rua + 8, f: c => KM.bb(c, x, L.rua + 8, () => { r(c, x - 1, L.rua - 10, 2, 18, '#1b1e33'); r(c, x - 4, L.rua - 12, 8, 3, '#2b2f45'); r(c, x - 3, L.rua - 9, 6, 1, '#ffe8a3'); }) });
    lista.push({ p: carro.x + L.rua + 33, f: c => KM.bb(c, carro.x, L.rua + 33, () => desenharCarro(c, t, ISO.dt || 0)) });
    // pessoas e objetos dos outros módulos
    for (const p of Object.values(estado.pessoas || {})) if (p.visivel !== false) lista.push({ p: p.X + p.Y + 0.5, f: c => KM.desenharPessoa(c, cfg, p, t) });
    for (const x of estado.extras || []) lista.push({ p: (x.X != null ? x.X : L.W / 2) + (x.Y != null ? x.Y : x.p), f: c => (x.X != null ? KM.bb(c, x.X, x.Y, () => x.f(c, t)) : x.f(c, t)) });
    for (const o of KM.objetos || []) {
      const X = o.X != null ? o.X : L.W / 2, Y = o.Y != null ? o.Y : o.p;
      lista.push({ p: X + Y, f: c => (o.X != null && !o.proprio ? KM.bb(c, o.X, Y, () => o.f(c, t)) : o.f(c, t)) });
    }
    lista.sort((a, b) => a.p - b.p);
    for (const o of lista) o.f(ctx);
    if (per === 'noite') { ctx.fillStyle = 'rgba(20,22,60,0.10)'; ctx.fillRect(0, 0, ISO.w, ISO.h); }
  }

  // ------------------------------------------------------------------ carro passando
  const carro = { x: -40, vel: 0, cor: '#e03131', prox: 3 };
  function desenharCarro(ctx, t, dt) {
    if (carro.vel === 0) { carro.prox -= dt; if (carro.prox <= 0) { carro.vel = Math.random() < 0.5 ? 38 : -38; carro.x = carro.vel > 0 ? -30 : L.W + 30; carro.cor = ['#e03131', '#1971c2', '#ffd43b', '#f8f9fa', '#2f9e44', '#212529'][Math.floor(Math.random() * 6)]; } return; }
    carro.x += carro.vel * dt;
    if (carro.x < -40 || carro.x > L.W + 40) { carro.vel = 0; carro.prox = 8 + Math.random() * 14; return; }
    const x = Math.round(carro.x) - 11, y = L.rua + (carro.vel > 0 ? 37 : 28);
    r(ctx, x, y + 8, 22, 2, 'rgba(0,0,0,0.25)'); r(ctx, x, y + 2, 22, 7, carro.cor); r(ctx, x + 4, y - 1, 13, 4, tom(carro.cor, 0.85));
    r(ctx, x + 5, y, 5, 2, '#a5d8ff'); r(ctx, x + 11, y, 5, 2, '#a5d8ff'); r(ctx, x + 3, y + 8, 4, 2, '#111'); r(ctx, x + 15, y + 8, 4, 2, '#111');
    r(ctx, carro.vel > 0 ? x + 21 : x, y + 4, 1, 2, '#fff3a0');
  }

  // ------------------------------------------------------------------ cena completa
  let tAnterior = 0;
  KM.desenhar = function (ctx, cfg, estado, t) {
    if (!L) KM.definirLayout('largo', cfg);
    const dt = Math.min(0.1, Math.max(0, t - tAnterior)); tAnterior = t;
    if (ISO.on) { ISO.dt = dt; return desenharIso(ctx, cfg, estado, t); }
    if (KM.tresD && KM.tresD.esconder) KM.tresD.esconder();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (!fundo || fundoPer !== periodo(cfg)) fundo = montarFundo(cfg);
    ctx.drawImage(fundo, 0, 0);
    desenharCarro(ctx, t, dt);
    desenharDinamicos(ctx, cfg, estado, t);
    if (KM.jogos && KM.jogos.desenharFundo) KM.jogos.desenharFundo(ctx, cfg, estado, t);

    const ocupada = f => Object.values(estado.pessoas || {}).some(p => p.funcao === f && p.modo === 'sentado' && p.visivel !== false);
    const lista = [];
    for (const m of L.moveis) {
      if (!m.ordenar) continue;
      if (m.tipo === 'cadeira') lista.push({ p: m.chave, f: c => cadeira(c, m, cfg, ocupada(m.funcao)) });
      else if (DES[m.tipo]) lista.push({ p: m.Y + m.d - 1, f: c => DES[m.tipo](c, m, cfg) });
    }
    const pessoas = Object.values(estado.pessoas || {}).filter(p => p.visivel !== false);
    for (const p of pessoas) lista.push({ p: p.Y + (p.modo === 'sentado' ? 0.5 : 0.5), f: c => KM.desenharPessoa(c, cfg, p, t) });
    for (const x of estado.extras || []) lista.push({ p: x.Y != null ? x.Y : x.p, f: x.f });
    for (const x of KM.objetos || []) lista.push({ p: x.Y != null ? x.Y : x.p, f: c => x.f(c, t) }); // comida, entregador, rodo… (refeitorio.js, limpeza.js)
    for (const x of KM.noChao || []) x(ctx, t); // marcas no chão (molhado, brilho), desenhadas antes das pessoas
    lista.sort((a, b) => a.p - b.p);
    for (const o of lista) o.f(ctx);
    if (KM.jogos && KM.jogos.desenharFrente) KM.jogos.desenharFrente(ctx, cfg, estado, t);

    const per = periodo(cfg);
    if (moderno(cfg.escritorio)) { // luz ambiente quente das luminárias e dos postes (o lado de fora já é desenhado escuro)
      if (per === 'noite') { ctx.fillStyle = 'rgba(20,22,60,0.12)'; ctx.fillRect(0, 0, L.W, L.H); }
      const forca = per === 'noite' ? 0.38 : per === 'tarde' ? 0.3 : 0.16;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, k] of L.luzes || []) { ctx.globalAlpha = forca * (k || 1); ctx.drawImage(brilho(), x - 34, y - 17, 68, 34); }
      ctx.globalAlpha = forca * 0.8;
      for (const [x, y] of L.postes || []) ctx.drawImage(brilho(), x - 16, y + 4, 32, 18);
      ctx.restore();
    } else if (per === 'noite') {
      ctx.fillStyle = 'rgba(16,24,60,0.26)'; ctx.fillRect(0, 0, L.W, L.H);
      for (const [x, y] of L.postes || []) { ctx.fillStyle = 'rgba(255,224,102,0.16)'; ctx.fillRect(x - 10, y - 2, 20, 14); ctx.fillRect(x - 6, y - 4, 12, 18); }
    }
  };
  // círculo de luz quente (degradê) usado pelas luminárias
  let _brilho = null;
  function brilho() {
    if (_brilho) return _brilho;
    const c = tela(68, 34), g = c.getContext('2d');
    const gr = g.createRadialGradient(34, 17, 2, 34, 17, 34);
    gr.addColorStop(0, 'rgba(255,214,140,0.9)'); gr.addColorStop(0.55, 'rgba(255,200,120,0.45)'); gr.addColorStop(1, 'rgba(255,190,110,0)');
    g.setTransform(1, 0, 0, 0.5, 0, 8.5); g.fillStyle = gr; g.beginPath(); g.arc(34, 17, 34, 0, Math.PI * 2); g.fill();
    return (_brilho = c);
  }

  KM.salaEm = (x, y) => { if (!L) return null; for (const s of Object.values(L.salas)) if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s.id; return null; };
  const sentado = p => p.modo === 'sentado' || p.modo === 'sentado-mesa'; // sentado-mesa: no refeitório
  KM.ancora = function (pers) {
    if (ISO.on) { const s = sentado(pers), [x, y] = prj(pers.X, pers.Y, s ? 0 : (pers.Z || 0)); return [Math.round(x), Math.round(y) - (s ? 2 : 0)]; }
    if (sentado(pers)) return [Math.round(pers.X), Math.round(pers.Y) - 2];
    return [Math.round(pers.X), Math.round(pers.Y - (pers.Z || 0))];
  };

  // Direção: fe = frente (olha para baixo, virado à esquerda), fd = frente virado à direita,
  //          ce = costas (olha para cima, à esquerda), cd = costas à direita.
  KM.vistaDe = dir => ({ vista: dir === 'ce' || dir === 'cd' ? 'costas' : 'frente', espelho: dir === 'fd' || dir === 'cd' });
  const SPR_W = 30;
  KM.aparenciaDe = (cfg, id) => { const f = cfg.funcionarios.find(x => x.id === id) || cfg.funcionarios[0]; return f.aparencia; };
  const dirDe = p => p.dir || (p.modo === 'sentado' ? ((L && L.assentos[p.funcao]) || {}).dir || 'ce' : 'fe');

  // ------------------------------------------------------------------ personagem
  const spriteCache = new Map();
  function sprite(ap, est) {
    const chave = JSON.stringify([ap, est]);
    let c = spriteCache.get(chave);
    if (c) return c;
    if (spriteCache.size > 500) spriteCache.clear();
    c = tela(30, 46);
    const g = c.getContext('2d');
    g.translate(1, 2);
    KM.desenharBoneco(g, ap, est);
    contorno(c);
    spriteCache.set(chave, c);
    return c;
  }
  function contorno(c) {
    const g = c.getContext('2d');
    const img = g.getImageData(0, 0, c.width, c.height), d = img.data, w = c.width, h = c.height;
    const cheio = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    const marcar = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (cheio(x, y)) continue;
      if (cheio(x - 1, y) || cheio(x + 1, y) || cheio(x, y - 1) || cheio(x, y + 1)) marcar.push(x, y);
    }
    // luz suave do lado esquerdo (as luminárias): clareia o primeiro pixel de dentro de cada linha
    for (let y = 0; y < h; y++) for (let x = 1; x < w; x++) {
      if (!cheio(x, y) || cheio(x - 1, y)) continue;
      const k = (y * w + x) * 4; d[k] = Math.min(255, d[k] + 26); d[k + 1] = Math.min(255, d[k + 1] + 20); d[k + 2] = Math.min(255, d[k + 2] + 10);
    }
    const [rr, gg, b] = hex('#1a1b2e'); // contorno azul-escuro, no mesmo tom das paredes
    for (let i = 0; i < marcar.length; i += 2) { const k = (marcar[i + 1] * w + marcar[i]) * 4; d[k] = rr; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255; }
    g.putImageData(img, 0, 0);
  }
  KM.sprite = sprite;

  KM.estDe = function (p, t) {
    const est = Object.assign({}, p.est || {});
    if (p.fantasia) est.fantasia = p.fantasia;
    if (p.prop) est.prop = p.prop;
    est.vista = KM.vistaDe(ISO.on ? dirIso(p) : dirDe(p)).vista;
    if (sentado(p)) {
      est.pose = 'sentado';
      if (!est.bracos && !est.prop) est.bracos = 'frente';
      if (p.digitando && t !== undefined && est.vista === 'costas') est.tecla = Math.floor(t * (p.turbo ? 22 : 9) + (p.fase || 0)) % 2;
    }
    return est;
  };

  KM.desenharPessoa = function (ctx, cfg, p, t, opc = {}) {
    const ap = opc.aparencia || KM.aparenciaDe(cfg, p.id);
    const v = KM.vistaDe(ISO.on ? dirIso(p) : dirDe(p));
    const est = KM.estDe(p, t);
    const s = sprite(ap, est);
    const [ax, ay] = opc.ancora || KM.ancora(p);
    const chao = ay + (p.Z || 0);
    if (p.selecionado && !sentado(p)) {
      ctx.fillStyle = 'rgba(40,190,82,' + (0.35 + 0.2 * Math.sin(t * 5)) + ')';
      ctx.fillRect(ax - 10, chao - 1, 20, 2); ctx.fillRect(ax - 8, chao - 2, 16, 4);
    }
    if (!sentado(p)) {
      ctx.fillStyle = 'rgba(20,22,50,0.24)'; // sombra oval e suave
      const so = (p.Z || 0) > 0 ? 4 : 7;
      ctx.fillRect(ax - so + 1, chao - 2, so * 2 - 2, 3); ctx.fillRect(ax - so + 3, chao - 3, so * 2 - 6, 5); ctx.fillRect(ax - so, chao - 1, so * 2, 1);
    }
    if (p.auraAtras) p.auraAtras(ctx, ax, ay, t);
    const ox = ax - 15, oy = sentado(p) ? ay - 37 : ay - 45;
    if (p.opacidade !== undefined) ctx.globalAlpha = p.opacidade;
    if (v.espelho) { ctx.save(); ctx.translate(ox + SPR_W, oy); ctx.scale(-1, 1); ctx.drawImage(s, 0, 0); ctx.restore(); }
    else ctx.drawImage(s, ox, oy);
    ctx.globalAlpha = 1;
    const chapeu = ap.chapeu || (ap.bone ? 'bone' : '');
    const topo = est.saiyan ? 0 : est.fantasia === 'mago' ? -4 : est.fantasia === 'pirata' ? 1 : ({ cacheado: 3, moicano: 1, coque: 1, careca: 6 }[ap.cabelo] ?? 5);
    p.cabecaTela = KM.paraTela(ax, oy + 2 + topo + (chapeu && !est.saiyan ? -2 : 0) + (ap.altura === 'baixo' ? 4 : 0));
  };

  // Mãos no teclado: só quando está sentado de frente (as mesas atuais deixam todos de costas).
  KM.desenharMaos = function () {};
  // para o 3D (cena3d.js): para onde a pessoa olha e as peças da cena que ele reaproveita
  KM.dirVisivel = p => (ISO.on ? dirIso(p) : dirDe(p));
  KM._cena = { ISO, montarParedes, desenharDecorDin, DES, pisoDaSala };

  // Quem está sob o ponto (x, y) da tela: devolve o id do mais à frente.
  KM.pessoaEm = function (estado, x, y) {
    let achou = null, melhor = -1e9;
    for (const p of Object.values(estado.pessoas || {})) {
      if (p.visivel === false) continue;
      const [ax, ay] = KM.ancora(p);
      const topo = sentado(p) ? ay - (T3() ? 44 : 37) : ay - 45;
      const prof = ISO.on ? p.X + p.Y : p.Y;
      if (x >= ax - 11 && x <= ax + 11 && y >= topo + 4 && y <= ay + 2 && prof > melhor) { melhor = prof; achou = p.id; }
    }
    return achou;
  };

  // Miniatura de um objeto do escritório (usada na personalização).
  KM.previewObjeto = function (cv, obj, cfg) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, e = cfg.escritorio;
    g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.clearRect(0, 0, W, H);
    const chao = () => g.drawImage(texPiso(e, W, H), 0, 0);
    const parede = (y) => { g.drawImage(texFace({ id: 'x' }, e), 0, 0, W, NB - 4, 0, y, W, NB - 4); r(g, 0, y - 4, W, 4, TOPO_PAREDE); };
    const nada = () => { r(g, 0, 0, W, H, '#f1f3f5'); g.strokeStyle = '#e03131'; g.lineWidth = 3; g.beginPath(); g.moveTo(12, H - 10); g.lineTo(W - 12, 10); g.stroke(); };
    switch (obj) {
      case 'parede': chao(); parede(8); break;
      case 'piso': chao(); break;
      case 'mesa': chao(); DES.mesa(g, { X: 7, Y: 24, w: 34, d: 12, h: 10, itens: ['papeis', 'caneca'] }, cfg); break;
      case 'cadeira': chao(); cadeira(g, { sx: 24, sy: 32 }, cfg, false); break;
      case 'tapete': if (!e.tapete) return nada(); chao(); DES.tapete(g, { X: 4, Y: 7, w: 40, d: 26 }, cfg); break;
      case 'planta': if (e.itens.planta === false) return nada(); chao(); DES.planta(g, { X: 19, Y: 30 }, cfg); break;
      case 'sofa': chao(); DES.sofa(g, { X: 5, Y: 22, w: 38, d: 14 }, cfg); break;
      case 'estante': if (e.itens.estante === false) return nada(); chao(); DES.estante(g, { X: 17, Y: 30, w: 14, d: 8, h: 26 }, cfg); break;
      case 'quadros': if (e.itens.quadros === false) return nada(); chao(); parede(10); DES.quadro(g, { X: 17, Y: 10, w: 14 }, cfg); break;
      case 'ceu': chao(); parede(10); r(g, 0, 0, W, 6, TOPO_PAREDE); janela(g, { X: 9, Y: 8, w: 30 }, cfg, performance.now() / 1000); break;
      default: chao();
    }
  };

  Object.assign(KM, { CONTORNO, RW, RH, NB });
})();
