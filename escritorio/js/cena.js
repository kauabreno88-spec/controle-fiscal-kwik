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
  const TOPO_PAREDE = '#3d4852', TOPO_LUZ = '#5b6a76';

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
  const G = 4, T = 4, RW = 136, RH = 124, NB = 20, CH = 40, TOPO = 34, BAIXO = 48;
  const PORTA = [8, 32]; // a porta de cada sala fica sempre à esquerda; essa faixa nunca tem móveis
  const NOMES = { recepcao: 'Recepção', diretoria: 'Diretoria · CEO', controladoria: 'Controladoria', comercial: 'Comercial', copa: 'Copa', jogos: 'Sala de jogos', marketing: 'Marketing',
    relacionamento: 'Relacionamento', reuniao: 'Reunião', meta: 'META', refeitorio: 'Refeitório', financeiro: 'Financeiro', precificacao: 'Precificação', execucao: 'Execução' };
  KM.P = (X, Y, Z = 0) => [X, Y - Z];
  KM.chaoEm = (x, y) => [x, y];
  let L = null;

  // Sala de Execução: cresce para o lado (até 2 vagas) e depois para baixo (mais fileiras de mesas).
  // Cada vaga de sala tem 2 mesas por fileira; a altura normal cabe 2 fileiras.
  const EXEC_POR_FILEIRA = 2, FILEIRA = 48;
  function tamanhoExecucao(n) {
    const span = n > 2 * EXEC_POR_FILEIRA ? 2 : 1;
    const fileiras = Math.max(2, Math.ceil(n / (span * EXEC_POR_FILEIRA)));
    return { span, fileiras, extraH: (fileiras - 2) * FILEIRA, vagas: span * EXEC_POR_FILEIRA * fileiras };
  }
  KM.tamanhoExecucao = tamanhoExecucao;
  const ativasExecucao = cfg => (cfg && cfg.execucao || []).filter(a => !a.fim).length;
  function plantaDe(nome, ex) {
    if (nome === 'largo') return {
      margem: 30, cols: 5, extra: [0, 0, ex.extraH],
      linhas: [
        [['recepcao', 1], ['diretoria', 1], ['controladoria', 1], ['comercial', 1], ['relacionamento', 1]],
        [['marketing', 1], ['financeiro', 1], ['precificacao', 1], ['meta', 1], ['reuniao', 1]],
        [['copa', 1], ['refeitorio', 1], ['jogos', 3 - ex.span], ['execucao', ex.span]],
      ],
    };
    const base = [[['recepcao', 1], ['diretoria', 1]], [['controladoria', 1], ['comercial', 1]], [['relacionamento', 1], ['marketing', 1]],
      [['financeiro', 1], ['precificacao', 1]], [['meta', 1], ['reuniao', 1]], [['copa', 1], ['refeitorio', 1]]];
    const fim = ex.span === 1 ? [[['jogos', 1], ['execucao', 1]]] : [[['jogos', 2]], [['execucao', 2]]];
    const linhas = base.concat(fim);
    return { margem: 12, cols: 2, linhas, extra: linhas.map((l, i) => (i === linhas.length - 1 ? ex.extraH : 0)) };
  }

  function montarLayout(nome, cfg) {
    const ex = tamanhoExecucao(ativasExecucao(cfg));
    const pl = plantaDe(nome, ex), cols = pl.cols, nl = pl.linhas.length;
    const BW = T + cols * (RW + T);
    const W = pl.margem * 2 + BW, bx = pl.margem;
    const lay = { nome, W, H: 0, salas: {}, corredores: [], moveis: [], decor: [], assentos: {}, pontos: {}, exec: ex };
    let y = TOPO;
    pl.linhas.forEach((linha, r) => {
      const h = RH + (pl.extra[r] || 0);
      let vaga = 0;
      linha.forEach(([id, span]) => {
        const x = bx + T + vaga * (RW + T), w = span * RW + (span - 1) * T;
        lay.salas[id] = { id, nome: NOMES[id], x, y, fx: x, fy: y + NB, w, h, span, linha: r, col: vaga, portaCima: r > 0, portaBaixo: r < nl - 1 };
        vaga += span;
      });
      y += h + T;
      if (r < nl - 1) { lay.corredores.push({ x: bx + T, y, w: BW - 2 * T, h: CH }); y += CH; }
    });
    lay.predio = { x: bx, y: TOPO, w: BW, h: y - TOPO };
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
    const add = (sala, tipo, rx, ry, w, d, h, extra = {}) => {
      const s = lay.salas[sala];
      const m = Object.assign({ sala, tipo, X: s.fx + rx, Y: s.fy + ry, w, d, h, bloq: true }, extra);
      lay.moveis.push(m); return m;
    };
    const parede = (sala, tipo, rx, w, extra = {}) => {
      const s = lay.salas[sala];
      const m = Object.assign({ sala, tipo, X: s.fx + rx, Y: s.y + 4, w, h: NB - 4 }, extra);
      lay.decor.push(m); return m;
    };
    const assento = (funcao, sala, cx, w, itens, tela, dir = 'ce') => {
      const s = lay.salas[sala];
      const mesa = add(sala, 'mesa', cx - (w >> 1), 8, w, 12, 10, { itens, funcao, tela });
      const X = s.fx + cx, Y = s.fy + 27;
      add(sala, 'cadeira', cx - 7, 19, 14, 9, 0, { ordenar: true, chave: Y + 2, sx: X, sy: Y, funcao });
      const corr = s.corrBaixo || s.corrCima;
      lay.assentos[funcao] = { X, Y, dir, pe: [X, Y + 13], sala, mesa, tapete: [Math.min(corr.x + corr.w - 20, s.fx + cx + 4), corr.y + 26] };
    };
    const planta = (sala, rx, ry) => { if (it.planta !== false) add(sala, 'planta', rx, ry, 10, 8, 6); };

    // Recepção
    add('recepcao', 'sofa', 44, 6, 38, 14, 12);
    add('recepcao', 'mesinha', 52, 34, 22, 9, 6);
    add('recepcao', 'balcao', 90, 54, 40, 12, 13);
    add('recepcao', 'bebedouro', 120, 4, 9, 7, 16);
    if (it.cofre !== false) add('recepcao', 'cofre', 112, 82, 16, 13, 16, { din: true });
    planta('recepcao', 42, 90);
    if (e.tapete) add('recepcao', 'tapete', 44, 26, 44, 26, 0, { bloq: false });
    if (it.tv !== false) parede('recepcao', 'painel', 48, 32, { din: true });
    if (it.relogio !== false) parede('recepcao', 'relogio', 92, 9, { din: true });
    if (it.logo !== false) parede('recepcao', 'logo', 106, 16);

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
    parede('comercial', 'insta', 88, 22);

    // Financeiro: Rodrigo (tio do Kauã, irmão do Maycon) — bolsa de valores e renda fixa
    assento('financas', 'financeiro', 70, 40, ['grafico', 'calculadora'], 'duplo');
    add('financeiro', 'arquivo', 42, 86, 12, 10, 16);
    add('financeiro', 'poltrona', 96, 62, 15, 13, 10);
    add('financeiro', 'mesinha', 114, 66, 12, 8, 6, { redonda: true });
    planta('financeiro', 124, 90);
    if (e.tapete) add('financeiro', 'tapete', 52, 54, 64, 32, 0, { bloq: false });
    parede('financeiro', 'tickerBolsa', 92, 42, { din: true });
    if (!lay.salas.financeiro.portaCima) parede('financeiro', 'graficoBolsa', 20, 22);

    // Precificação: Dona Iva (avó do Kauã, mãe do Maycon e do Rodrigo)
    assento('precificacao', 'precificacao', 70, 36, ['calculadora', 'caneca'], 'notebook');
    if (it.estante !== false) add('precificacao', 'estante', 122, 6, 13, 10, 24);
    add('precificacao', 'poltrona', 44, 62, 15, 13, 10);
    add('precificacao', 'mesinha', 62, 66, 12, 8, 6, { redonda: true });
    planta('precificacao', 124, 88);
    if (e.tapete) add('precificacao', 'tapete', 40, 56, 60, 32, 0, { bloq: false, redondo: true });
    parede('precificacao', 'tabelaPrecos', 38, 42);
    if (it.relogio !== false) parede('precificacao', 'relogio', 86, 9, { din: true });
    if (it.quadros !== false) parede('precificacao', 'quadro', 100, 12);

    // Execução: uma mesa para cada atividade em andamento (a sala cresce quando enche)
    {
      const s = lay.salas.execucao, ex = lay.exec;
      lay.pontos.execucao = [];
      for (let f = 0; f < ex.fileiras; f++) for (let k = 0; k < ex.span; k++) for (let j = 0; j < EXEC_POR_FILEIRA; j++) {
        const rx = 40 + k * (RW + T) + j * 46, ry = 22 + f * FILEIRA;
        const mesa = add('execucao', 'mesaExec', rx, ry, 36, 10, 9, { n: lay.pontos.execucao.length + 1 });
        lay.pontos.execucao.push({ X: s.fx + rx + 18, Y: s.fy + ry + 19, mesa });
      }
      lay.pontos.execucao.sort((a, b) => a.Y - b.Y || a.X - b.X).forEach((p, i) => { p.mesa.n = i + 1; });
      parede('execucao', 'quadroExec', 40, 62, { din: true });
      if (s.span > 1) parede('execucao', 'logo', RW + T + 46, 16);
      planta('execucao', s.w - 12, s.h - NB - 16);
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
    parede('marketing', 'insta', 112, 22);
    if (it.relogio !== false) parede('marketing', 'relogio', 86, 9, { din: true });

    // Copa
    add('copa', 'bancada', 40, 0, 78, 12, 12, { din: true });
    add('copa', 'geladeira', 120, 2, 14, 12, 24);
    add('copa', 'mesaJantar', 58, 50, 46, 20, 10, { ordenar: true });
    for (const [rx, ry] of [[64, 42], [88, 42], [64, 74], [88, 74]]) add('copa', 'banco', rx, ry, 9, 6, 6, { bloq: ry > 60 });
    add('copa', 'bebedouro', 40, 90, 9, 7, 16);
    if (it.lixeira !== false) add('copa', 'lixeira', 108, 20, 6, 6, 7);
    planta('copa', 124, 88);
    parede('copa', 'armarios', 40, 78);
    lay.pontos.cafe = { X: lay.salas.copa.fx + 51, Y: lay.salas.copa.fy + 22, dir: 'ce' };

    // Sala de jogos
    add('jogos', 'sinuca', 46, 30, 44, 24, 10, { ordenar: true });
    add('jogos', 'mesaCartas', 100, 26, 24, 16, 10, { ordenar: true });
    add('jogos', 'fliperama', 122, 4, 12, 10, 24, { din: true });
    add('jogos', 'pingue', 88, 62, 36, 22, 9, { ordenar: true });
    add('jogos', 'puff', 44, 86, 14, 12, 7, { cor: '#e03131' });
    add('jogos', 'puff', 60, 88, 14, 12, 7, { cor: '#3fb6ff' });
    parede('jogos', 'neon', 50, 40, { din: true });
    parede('jogos', 'dardos', 98, 12);
    const sj = lay.salas.jogos, J = (rx, ry, dir, prop) => ({ X: sj.fx + rx, Y: sj.fy + ry, dir, prop });
    lay.pontos.jogos = {
      sinuca: J(66, 25, 'fe', 'taco'), sinuca2: J(37, 44, 'fd', 'taco'), pingA: J(82, 73, 'fd'), pingB: J(130, 73, 'fe'), cartas: J(112, 21, 'fe', 'cartas'),
    };

    // META: tanque com o "dinheiro" dos clientes subindo até a meta
    add('meta', 'tanqueMeta', 50, 42, 44, 16, 48, { ordenar: true });
    add('meta', 'podio', 104, 52, 20, 10, 9);
    add('meta', 'cofrinho', 42, 70, 10, 8, 8);
    planta('meta', 124, 88);
    planta('meta', 42, 90);
    parede('meta', 'painelMeta', 40, 46, { din: true });
    if (lay.salas.meta.linha === 0 && it.janela !== false) parede('meta', 'janela', 108, 22, { din: true });
    lay.pontos.meta = { X: lay.salas.meta.fx + 72, Y: lay.salas.meta.fy + 74 };

    // Refeitório: mesa grande, buffet, cardápio e o cantinho da limpeza
    add('refeitorio', 'buffet', 64, 2, 60, 12, 8, { din: true });
    add('refeitorio', 'mesaRefeicao', 48, 46, 64, 18, 10, { ordenar: true });
    for (const rx of [54, 72, 90, 108]) add('refeitorio', 'banco', rx, 66, 10, 6, 5, { bloq: true });
    add('refeitorio', 'carrinhoLimpeza', 116, 62, 16, 10, 12);
    planta('refeitorio', 40, 90);
    parede('refeitorio', 'cardapio', 40, 22);
    {
      const s = lay.salas.refeitorio, X = s.fx + 124, Y = s.fy + 81;
      add('refeitorio', 'cadeira', 117, 73, 14, 9, 0, { ordenar: true, chave: Y + 2, sx: X, sy: Y, funcao: 'limpeza' });
      const corr = s.corrBaixo || s.corrCima;
      lay.assentos.limpeza = { X, Y, dir: 'ce', pe: [X - 14, Y + 8], sala: 'refeitorio', tapete: [Math.min(corr.x + corr.w - 20, s.fx + 96), corr.y + 26] };
      // lugares à mesa: em cima (de frente para nós) e embaixo (de costas)
      lay.pontos.refeicao = [[60, 40, 'fe'], [80, 40, 'fe'], [100, 40, 'fe'], [60, 78, 'ce'], [80, 78, 'ce'], [100, 78, 'ce']].map(([rx, ry, dir]) => ({ X: s.fx + rx, Y: s.fy + ry, dir }));
      lay.pontos.entrega = [s.porta[0], s.porta[1]];
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
  function pisoDaSala(s, e) {
    const w = s.w || RW, h = (s.h || RH) - NB;
    if (s.id === 'execucao') return texXadrez('#e3e9e6', '#d6dfda', w, h, 10);
    if (s.id === 'diretoria') return texTabuas('#8a5a3c', w, h);
    if (s.id === 'copa') return texXadrez('#f4f6f7', '#dfe5e8', w, h, 8);
    if (s.id === 'jogos') return texTabuas('#b07a4f', w, h);
    if (s.id === 'refeitorio') return texXadrez('#f3e3c9', '#e8d2b0', w, h, 8);
    return texPiso(e, w, h);
  }
  function texFace(s, e) {
    const w = s.w || RW, h = NB - 4;
    if (s.id === 'diretoria') return tex('faceDiretoria', w, h, (g, w, h) => {
      g.fillStyle = '#20302b'; g.fillRect(0, 0, w, h);
      for (let u = 0; u < w; u += 8) { g.fillStyle = (u / 8) % 2 ? '#243630' : '#1d2b26'; g.fillRect(u, 0, 8, h - 2); }
      g.fillStyle = '#c9a65b'; g.fillRect(0, h - 3, w, 1); g.fillStyle = '#111A19'; g.fillRect(0, h - 2, w, 2);
    });
    if (s.id === 'execucao') return tex('faceExec', w, h, (g, w, h) => {
      g.fillStyle = '#eef6f1'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#28BE52'; g.fillRect(0, h - 5, w, 3); g.fillStyle = '#111A19'; g.fillRect(0, h - 2, w, 2);
    });
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
  KM.desenharCadeira = (ctx, x, y, ocupada) => cadeira(ctx, { sx: x, sy: y }, KM.config(), ocupada);
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
      if (mod === 'futon') { r(g, X + 5, Y + 1, 6, 4, '#ffd43b'); r(g, X + w - 11, Y + 1, 6, 4, '#ffffff'); }
    },
    poltrona(g, m, cfg) {
      const c = cfg.escritorio.corSofa || '#3f7fc1', { X, Y, w, d } = m;
      sombra(g, X, Y, w, d); caixa(g, X, Y, w, 5, 13, tom(c, 0.9)); caixa(g, X + 2, Y + 4, w - 4, d - 4, 6, c);
      caixa(g, X, Y + 3, 3, d - 3, 8, tom(c, 0.82)); caixa(g, X + w - 3, Y + 3, 3, d - 3, 8, tom(c, 0.82));
    },
    mesinha(g, m) {
      const { X, Y, w, d, h } = m;
      sombra(g, X, Y, w, d);
      if (m.redonda) { r(g, X + 1, Y - h, w - 2, d, '#5a3a22'); r(g, X, Y - h + 1, w, d - 2, '#5a3a22'); r(g, X + 2, Y - h + 1, w - 4, d - 2, '#8d5a3b'); r(g, X + (w >> 1) - 1, Y + d - h, 2, h, '#3a2a1e'); r(g, X + 4, Y - h + 2, 4, 3, '#ffffff'); return; }
      caixa(g, X, Y, w, d, h, '#8d5a3b'); r(g, X + 4, Y - h + 2, 5, 4, '#f1f3f5'); r(g, X + 12, Y - h + 2, 3, 3, '#ffffff'); r(g, X + 12, Y - h + 2, 3, 1, '#6b3a1e');
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
  };

  // ------------------------------------------------------------------ desenho dinâmico (telas, relógio, janela…)
  function conteudoTela(ctx, x, y, w, h, modo, t, funcao) {
    r(ctx, x, y, w, h, '#0c1416');
    if (modo === 'off') { simboloPixel(ctx, x + 2 + Math.round((Math.sin(t * 0.7) + 1) * (w - 10) / 2), y + 2 + Math.round((Math.cos(t * 0.5) + 1) * (h - 8) / 2), 0.4, '#1f5a35'); return; }
    if (modo === 'idle') { r(ctx, x, y, w, h, '#14352a'); r(ctx, x, y + h - 3, w, 3, '#1b4a37'); simboloPixel(ctx, x + (w >> 1) - 3, y + (h >> 1) - 3, 0.5, VERDE); return; }
    const f = Math.floor(t * 6);
    if (funcao === 'noticias') { r(ctx, x, y, w, 2, VERDE); for (let i = 0; i < 4; i++) r(ctx, x + 1, y + 3 + i * 2, 3 + ((f + i * 3) % (w - 4)), 1, i % 2 ? '#d8f5df' : '#ffffff'); }
    else if (funcao === 'checklist') { r(ctx, x, y, w, h, '#fffdf6'); for (let i = 0; i < 3; i++) { r(ctx, x + 1, y + 1 + i * 3, 2, 2, (f >> 2) % 4 > i ? VERDE : '#ced4da'); r(ctx, x + 4, y + 1 + i * 3, w - 6, 1, '#9aa3a1'); } }
    else if (funcao === 'prospeccao') { r(ctx, x, y, w, h, '#d0ebff'); r(ctx, x + 2, y + 2, w - 6, h - 4, '#b2f2bb'); for (let i = 0; i < 3; i++) if ((f + i) % 4) r(ctx, x + 3 + ((i * 5 + 2) % (w - 6)), y + 2 + ((i * 3) % (h - 4)), 1, 2, '#e03131'); }
    else if (funcao === 'video') { r(ctx, x, y, w, h - 4, '#1b1f22'); r(ctx, x + 2, y + 1, w - 4, h - 6, (f >> 2) % 2 ? '#28BE52' : '#111A19'); r(ctx, x + 4, y + 3, w - 8, 1, '#ffffff'); r(ctx, x, y + h - 4, w, 4, '#343a40'); for (let i = 0; i < 4; i++) r(ctx, x + 1 + i * 5, y + h - 3, 4, 1, ['#ff6b6b', '#4dabf7', '#ffd43b', '#b197fc'][i]); r(ctx, x + (f % w), y + h - 4, 1, 4, '#ffffff'); }
    else if (funcao === 'relacionamento') { r(ctx, x, y, w, h, '#fff0f6'); r(ctx, x, y, w, 2, VERDE); for (let i = 0; i < 3; i++) { r(ctx, x + 1, y + 3 + i * 3, 2, 2, (f >> 1) % 4 > i ? '#f06595' : '#ced4da'); r(ctx, x + 4, y + 3 + i * 3, w - 6, 1, '#adb5bd'); } }
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
      r(ctx, x - 1, y - 1, 14, 10, '#1f2326'); conteudoTela(ctx, x, y, 12, 8, modo, t, m.funcao); r(ctx, x - 2, ty + 1, 16, 3, '#adb5bd'); r(ctx, x - 1, ty + 2, 14, 1, '#ced4da');
      return;
    }
    const tela1 = (x, w) => { r(ctx, x - 1, ty - 15, w + 2, 12, '#1f2326'); conteudoTela(ctx, x, ty - 14, w, 10, modo, t, m.funcao); r(ctx, x + (w >> 1) - 1, ty - 3, 2, 3, '#30363a'); r(ctx, x + (w >> 1) - 3, ty, 6, 1, '#30363a'); };
    if (m.tela === 'duplo') { tela1(cx - 19, 18); tela1(cx + 1, 18); }
    else tela1(cx - 9, 18);
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
  function desenharDinamicos(ctx, cfg, estado, t) {
    for (const d of L.decor) {
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
    }
    for (const m of L.moveis) {
      if (m.tipo === 'mesa') monitorDe(ctx, m, estado, t);
      else if (m.tipo === 'cofre') moedas(ctx, m, estado.caixa || 0, t);
      else if (m.tipo === 'ringlight') { const on = estado.trabalhoDe && estado.trabalhoDe.video; const x = m.X + 2, y = m.Y - 26; r(ctx, x - 4, y - 4, 9, 9, '#343a40'); r(ctx, x - 3, y - 3, 7, 7, on ? '#fff9db' : '#adb5bd'); r(ctx, x - 1, y - 1, 3, 3, '#343a40'); if (on) { ctx.fillStyle = 'rgba(255,249,219,0.18)'; ctx.fillRect(x - 10, y - 8, 30, 40); } }
      else if (m.tipo === 'buffet' && estado.refeicaoAtiva) { for (let i = 0; i < 4; i++) { const fy = (t * 7 + i * 3) % 9; ctx.fillStyle = `rgba(255,255,255,${0.75 - fy / 12})`; ctx.fillRect(m.X + 8 + i * 14 + Math.round(Math.sin(t * 3 + i)), m.Y - m.h - 3 - fy, 1, 1); } }
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
  function desenharExterior(g, cfg) {
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
      g.drawImage(texXadrez('#d9dde0', '#cfd4d8', c.w, c.h, 10), c.x, c.y);
      r(g, c.x, c.y, c.w, 3, 'rgba(0,0,0,0.12)');
      for (const s of Object.values(L.salas)) if (s.corrBaixo === c || s.corrCima === c) { r(g, s.fx + 44, c.y + 18, 80, 10, '#8f9aa6'); r(g, s.fx + 45, c.y + 19, 78, 8, '#a8b3be'); r(g, s.fx + 47, c.y + 21, 74, 1, '#8f9aa6'); r(g, s.fx + 47, c.y + 25, 74, 1, '#8f9aa6'); }
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
    // paredes externas nas pontas dos corredores (entrada à esquerda do primeiro)
    L.corredores.forEach((c, i) => {
      r(g, P0.x, c.y, T, c.h, TOPO_PAREDE); r(g, P0.x + P0.w - T, c.y, T, c.h, TOPO_PAREDE);
      if (i === 0) { r(g, P0.x, c.y + 12, T, 16, '#a5d8ff'); r(g, P0.x + 1, c.y + 12, 1, 16, '#e7f5ff'); r(g, P0.x, c.y + 19, T, 1, '#74c0fc'); }
    });
  }

  // ------------------------------------------------------------------ fundo em cache
  let fundo = null, fundoPer = '';
  KM.limparCache = () => { cache.clear(); fundo = null; if (L && KM.config) { mobiliar(L, KM.config()); montarGrade(L); } };
  function montarFundo(cfg) {
    const c = tela(L.W, L.H), g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    desenharExterior(g, cfg);
    desenharPredio(g, cfg);
    for (const d of L.decor) if (DES[d.tipo]) DES[d.tipo](g, d, cfg);
    const est = L.moveis.filter(m => !m.ordenar && DES[m.tipo]).sort((a, b) => (a.tipo === 'tapete' ? -1e4 : 0) + a.Y + a.d - ((b.tipo === 'tapete' ? -1e4 : 0) + b.Y + b.d));
    for (const m of est) DES[m.tipo](g, m, cfg);
    fundoPer = periodo(cfg);
    return c;
  }

  // ------------------------------------------------------------------ escolher a planta (computador x celular)
  // Monta a planta (computador ou celular). Também refaz quando a Sala de Execução precisa crescer/diminuir.
  KM.definirLayout = function (nome, cfg) {
    if (L && L.nome === nome) {
      const ex = tamanhoExecucao(ativasExecucao(cfg));
      if (ex.span === L.exec.span && ex.fileiras === L.exec.fileiras) return false;
    }
    L = KM.LAYOUT = montarLayout(nome, cfg);
    KM.W = L.W; KM.H = L.H;
    fundo = null;
    return true;
  };

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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (!fundo || fundoPer !== periodo(cfg)) fundo = montarFundo(cfg);
    ctx.drawImage(fundo, 0, 0);
    const dt = Math.min(0.1, Math.max(0, t - tAnterior)); tAnterior = t;
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

    if (periodo(cfg) === 'noite') {
      ctx.fillStyle = 'rgba(16,24,60,0.26)'; ctx.fillRect(0, 0, L.W, L.H);
      for (const [x, y] of L.postes || []) { ctx.fillStyle = 'rgba(255,224,102,0.16)'; ctx.fillRect(x - 10, y - 2, 20, 14); ctx.fillRect(x - 6, y - 4, 12, 18); }
    }
  };

  KM.salaEm = (x, y) => { if (!L) return null; for (const s of Object.values(L.salas)) if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s.id; return null; };
  const sentado = p => p.modo === 'sentado' || p.modo === 'sentado-mesa'; // sentado-mesa: no refeitório
  KM.ancora = function (pers) {
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
    const [rr, gg, b] = hex(CONTORNO);
    for (let i = 0; i < marcar.length; i += 2) { const k = (marcar[i + 1] * w + marcar[i]) * 4; d[k] = rr; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255; }
    g.putImageData(img, 0, 0);
  }
  KM.sprite = sprite;

  KM.estDe = function (p, t) {
    const est = Object.assign({}, p.est || {});
    if (p.fantasia) est.fantasia = p.fantasia;
    if (p.prop) est.prop = p.prop;
    est.vista = KM.vistaDe(dirDe(p)).vista;
    if (sentado(p)) {
      est.pose = 'sentado';
      if (!est.bracos && !est.prop) est.bracos = 'frente';
      if (p.digitando && t !== undefined && est.vista === 'costas') est.tecla = Math.floor(t * (p.turbo ? 22 : 9) + (p.fase || 0)) % 2;
    }
    return est;
  };

  KM.desenharPessoa = function (ctx, cfg, p, t, opc = {}) {
    const ap = opc.aparencia || KM.aparenciaDe(cfg, p.id);
    const v = KM.vistaDe(dirDe(p));
    const est = KM.estDe(p, t);
    const s = sprite(ap, est);
    const [ax, ay] = opc.ancora || KM.ancora(p);
    const chao = ay + (p.Z || 0);
    if (p.selecionado && !sentado(p)) {
      ctx.fillStyle = 'rgba(40,190,82,' + (0.35 + 0.2 * Math.sin(t * 5)) + ')';
      ctx.fillRect(ax - 10, chao - 1, 20, 2); ctx.fillRect(ax - 8, chao - 2, 16, 4);
    }
    if (!sentado(p)) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      const so = (p.Z || 0) > 0 ? 4 : 7;
      ctx.fillRect(ax - so, chao - 2, so * 2, 3); ctx.fillRect(ax - so + 2, chao - 3, so * 2 - 4, 5);
    }
    if (p.auraAtras) p.auraAtras(ctx, ax, ay, t);
    const ox = ax - 15, oy = sentado(p) ? ay - 37 : ay - 45;
    if (p.opacidade !== undefined) ctx.globalAlpha = p.opacidade;
    if (v.espelho) { ctx.save(); ctx.translate(ox + SPR_W, oy); ctx.scale(-1, 1); ctx.drawImage(s, 0, 0); ctx.restore(); }
    else ctx.drawImage(s, ox, oy);
    ctx.globalAlpha = 1;
    const chapeu = ap.chapeu || (ap.bone ? 'bone' : '');
    const topo = est.saiyan ? 0 : est.fantasia === 'mago' ? -4 : est.fantasia === 'pirata' ? 1 : ({ cacheado: 3, moicano: 1, coque: 1, careca: 6 }[ap.cabelo] ?? 5);
    p.cabecaTela = [ax, oy + 2 + topo + (chapeu && !est.saiyan ? -2 : 0) + (ap.altura === 'baixo' ? 4 : 0)];
  };

  // Mãos no teclado: só quando está sentado de frente (as mesas atuais deixam todos de costas).
  KM.desenharMaos = function () {};

  // Quem está sob o ponto (x, y) da tela: devolve o id do mais à frente.
  KM.pessoaEm = function (estado, x, y) {
    let achou = null, melhor = -1e9;
    for (const p of Object.values(estado.pessoas || {})) {
      if (p.visivel === false) continue;
      const [ax, ay] = KM.ancora(p);
      const topo = sentado(p) ? ay - 37 : ay - 45;
      if (x >= ax - 11 && x <= ax + 11 && y >= topo + 4 && y <= ay + 2 && p.Y > melhor) { melhor = p.Y; achou = p.id; }
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
