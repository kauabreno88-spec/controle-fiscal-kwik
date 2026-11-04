/* KWIK Mini Escritório · cena isométrica em pixel art.
   Tudo é desenhado por código (sem imagens), para que cores, móveis e personagem sejam personalizáveis.
   Coordenadas do mundo em "pixels isométricos": X vai para a direita-baixo, Y para a esquerda-baixo, Z para cima. */
(function () {
  const KM = (window.KM = window.KM || {});

  const W = 240, H = 210, OX = 120, OY = 92, SALA = 108, PAREDE = 78;
  KM.W = W; KM.H = H; KM.SALA = SALA;
  const P = (X, Y, Z = 0) => [OX + X - Y, OY + (X + Y) / 2 - Z];
  KM.P = P;

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
    ' ': '000000000000000', '?': '111001010000010',
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

  // ------------------------------------------------------------------ texturas
  const cache = new Map();
  function tela(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  KM.tela = tela;
  function tex(chave, w, h, fn) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    const k = chave + '|' + w + 'x' + h;
    let c = cache.get(k);
    if (!c) {
      c = tela(w, h);
      const g = c.getContext('2d');
      fn(g, w, h);
      cache.set(k, c);
    }
    return c;
  }
  KM.limparCache = () => cache.clear();

  function moldura(g, w, h, cor, lados = 'tblr') {
    g.fillStyle = cor;
    if (lados.includes('t')) g.fillRect(0, 0, w, 1);
    if (lados.includes('b')) g.fillRect(0, h - 1, w, 1);
    if (lados.includes('l')) g.fillRect(0, 0, 1, h);
    if (lados.includes('r')) g.fillRect(w - 1, 0, 1, h);
  }
  const solida = (cor, w, h, lados = 'tblr') => tex('s' + cor + lados, w, h, (g, w, h) => {
    g.fillStyle = cor; g.fillRect(0, 0, w, h);
    moldura(g, w, h, tom(cor, 0.5), lados);
  });

  // Transformações de cada plano (x da textura → eixo do mundo).
  const MAT = { chao: [1, 0.5, -1, 0.5], paredeE: [1, -0.5, 0, 1], paredeD: [1, 0.5, 0, 1] };
  function face(ctx, img, m, x, y) {
    ctx.setTransform(m[0], m[1], m[2], m[3], Math.round(x), Math.round(y));
    ctx.drawImage(img, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Caixa isométrica: lado esquerdo (plano Y+d), lado direito (plano X+w) e topo.
  function prisma(ctx, o) {
    const { X, Y, Z = 0, w, d, h } = o, c = o.cor || '#888';
    if (h > 0 && !o.semEsq) face(ctx, o.esq || solida(o.corEsq || tom(c, 0.84), w, h, 'blr'), MAT.paredeD, ...P(X, Y + d, Z + h));
    if (h > 0 && !o.semDir) face(ctx, o.dir || solida(o.corDir || tom(c, 0.68), d, h, 'blr'), MAT.paredeE, ...P(X + w, Y + d, Z + h));
    if (!o.semTopo) face(ctx, o.topo || solida(o.corTopo || c, w, d), MAT.chao, ...P(X, Y, Z + h));
  }
  KM.prisma = prisma;

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

  // ------------------------------------------------------------------ piso, paredes e tapete
  function texPiso(e) {
    const base = e.corPiso;
    return tex('piso' + e.piso + base, SALA, SALA, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      if (e.piso === 'madeira' || e.piso === 'taco') {
        const larg = e.piso === 'madeira' ? 6 : 4;
        for (let v = 0; v < h; v += larg) {
          const lin = (v / larg) | 0;
          g.fillStyle = tom(base, lin % 3 === 0 ? 0.95 : lin % 3 === 1 ? 1.04 : 1);
          g.fillRect(0, v, w, larg);
          g.fillStyle = tom(base, 0.78); g.fillRect(0, v, w, 1);
          const passo = e.piso === 'madeira' ? 36 : 12;
          for (let u = (lin * 13) % passo; u < w; u += passo) g.fillRect(u, v, 1, larg);
        }
      } else if (e.piso === 'piso') {
        for (let v = 0; v < h; v += 12) for (let u = 0; u < w; u += 12) {
          g.fillStyle = ((u + v) / 12) % 2 ? tom(base, 0.9) : base; g.fillRect(u, v, 12, 12);
          g.fillStyle = tom(base, 0.8); g.fillRect(u, v, 12, 1); g.fillRect(u, v, 1, 12);
        }
      } else {
        for (let i = 0; i < 900; i++) {
          g.fillStyle = tom(base, 0.9 + ((i * 7919) % 20) / 100);
          g.fillRect((i * 37) % w, (i * 53) % h, 1, 1);
        }
      }
    });
  }

  function texTapete(e, w, h) {
    const c = e.corTapete;
    return tex('tapete' + c + e.padraoTapete, w, h, (g, w, h) => {
      g.fillStyle = c; g.fillRect(0, 0, w, h);
      const esc = tom(c, 0.78), cla = tom(c, 1.25);
      g.fillStyle = esc; g.fillRect(2, 2, w - 4, 1); g.fillRect(2, h - 3, w - 4, 1); g.fillRect(2, 2, 1, h - 4); g.fillRect(w - 3, 2, 1, h - 4);
      if (e.padraoTapete === 'kwik') {
        // símbolo KWIK em pixel no centro
        const cx = (w / 2 | 0) - 6, cy = (h / 2 | 0) - 6;
        simboloPixel(g, cx, cy, 1, esc);
        g.fillStyle = cla;
        for (let i = 6; i < w - 6; i += 6) { g.fillRect(i, 5, 2, 1); g.fillRect(i, h - 6, 2, 1); }
      } else if (e.padraoTapete === 'losango') {
        const cx = w / 2, cy = h / 2;
        g.fillStyle = esc;
        for (let i = 0; i < Math.min(w, h) / 2 - 4; i++) {
          if (i % 6 > 1) continue;
          g.fillRect(cx - i, cy - (Math.min(w, h) / 2 - 6) + i, 1, 1); g.fillRect(cx + i, cy - (Math.min(w, h) / 2 - 6) + i, 1, 1);
        }
        g.fillRect(cx - 1, 6, 2, h - 12); g.fillRect(6, cy - 1, w - 12, 2);
        g.fillStyle = cla; g.fillRect(cx - 3, cy - 3, 6, 6);
        for (const [x, y] of [[10, 10], [w - 14, 10], [10, h - 14], [w - 14, h - 14]]) { g.fillStyle = esc; g.fillRect(x, y, 4, 4); g.fillStyle = cla; g.fillRect(x + 1, y + 1, 2, 2); }
      } else {
        for (let v = 6; v < h - 6; v += 6) { g.fillStyle = (v / 6) % 2 ? esc : cla; g.fillRect(4, v, w - 8, 2); }
      }
    });
  }

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

  // Parede esquerda (plano X=0): x da textura vai de Y=108 (canto da frente) até Y=0 (fundo).
  function texParedeE(e) {
    return tex('pE' + JSON.stringify([e.parede, e.rodape, e.itens.grafico, e.itens.logo, e.itens.quadros]), SALA, PAREDE, (g, w, h) => {
      g.fillStyle = e.parede; g.fillRect(0, 0, w, h);
      g.fillStyle = tom(e.parede, 0.96); for (let u = 0; u < w; u += 9) g.fillRect(u, 0, 1, h - 4);
      g.fillStyle = e.rodape; g.fillRect(0, h - 4, w, 4);
      g.fillStyle = tom(e.rodape, 0.6); g.fillRect(0, h - 4, w, 1);
      if (e.itens.grafico) quadroGrafico(g, 56, 16, 22, 18);
      if (e.itens.logo) {
        g.fillStyle = CONTORNO; g.fillRect(83, 18, 18, 18);
        g.fillStyle = '#ffffff'; g.fillRect(84, 19, 16, 16);
        simboloPixel(g, 86, 21, 1, VERDE, VERDE);
        g.fillStyle = GRAFITE; g.fillRect(85, 33, 14, 1);
      }
      if (e.itens.quadros) {
        g.fillStyle = CONTORNO; g.fillRect(45, 22, 8, 9); g.fillStyle = '#f4efe6'; g.fillRect(46, 23, 6, 7);
        g.fillStyle = '#6aa5d8'; g.fillRect(47, 26, 4, 3); g.fillStyle = '#f2c14e'; g.fillRect(49, 24, 2, 2);
        g.fillStyle = CONTORNO; g.fillRect(46, 34, 6, 6); g.fillStyle = '#ffffff'; g.fillRect(47, 35, 4, 4);
        g.fillStyle = VERDE; g.fillRect(48, 36, 2, 2);
      }
    });
  }
  function quadroGrafico(g, x, y, w, h) {
    g.fillStyle = CONTORNO; g.fillRect(x, y, w, h);
    g.fillStyle = '#ffffff'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
    const alt = [4, 6, 5, 9, 12];
    alt.forEach((a, i) => { g.fillStyle = i === alt.length - 1 ? VERDE : '#2E8B45'; g.fillRect(x + 3 + i * 4, y + h - 3 - a, 3, a); });
    g.fillStyle = '#9aa3a1'; g.fillRect(x + 2, y + h - 3, w - 4, 1);
  }

  // Parede direita (plano Y=0): x da textura vai de X=0 (fundo) até X=108.
  function texParedeD(e) {
    const p = tom(e.parede, 0.9);
    return tex('pD' + JSON.stringify([e.parede, e.rodape, e.itens.quadros]), SALA, PAREDE, (g, w, h) => {
      g.fillStyle = p; g.fillRect(0, 0, w, h);
      g.fillStyle = tom(p, 0.96); for (let u = 4; u < w; u += 9) g.fillRect(u, 0, 1, h - 4);
      g.fillStyle = tom(e.rodape, 0.9); g.fillRect(0, h - 4, w, 4);
      g.fillStyle = tom(e.rodape, 0.55); g.fillRect(0, h - 4, w, 1);
      if (e.itens.quadros) {
        // certificado
        g.fillStyle = CONTORNO; g.fillRect(95, 20, 11, 9); g.fillStyle = '#fffdf3'; g.fillRect(96, 21, 9, 7);
        g.fillStyle = '#c9b27a'; g.fillRect(97, 22, 7, 1); g.fillRect(97, 24, 5, 1); g.fillStyle = '#d4483b'; g.fillRect(102, 25, 2, 2);
      }
    });
  }

  // Janela com céu do horário (dinâmica).
  function texJanela(cfg, t) {
    const per = periodo(cfg);
    const w = 30, h = 32;
    const c = tela(w, h), g = c.getContext('2d');
    const ceus = {
      dia: ['#7cc6f2', '#a8dcf7', '#d6effb'],
      tarde: ['#f59a5b', '#f7c46d', '#fde3a7'],
      noite: ['#0d1630', '#17244a', '#22325e'],
    };
    const cs = ceus[per] || ceus.dia;
    g.fillStyle = cs[0]; g.fillRect(0, 0, w, h);
    g.fillStyle = cs[1]; g.fillRect(0, 12, w, 10);
    g.fillStyle = cs[2]; g.fillRect(0, 22, w, 10);
    if (per === 'noite') {
      g.fillStyle = '#fffbe0'; g.fillRect(20, 5, 4, 4); g.fillStyle = cs[0]; g.fillRect(22, 5, 2, 2);
      for (let i = 0; i < 9; i++) { if ((Math.floor(t * 2) + i) % 5 === 0) continue; g.fillStyle = '#ffffff'; g.fillRect((i * 11) % 28 + 1, (i * 7) % 14 + 1, 1, 1); }
    } else {
      g.fillStyle = per === 'dia' ? '#fff3a3' : '#ffd36b'; g.fillRect(4, per === 'dia' ? 4 : 14, 5, 5);
      const nx = ((t * 3) % (w + 16)) - 12;
      g.fillStyle = '#ffffff'; g.fillRect(nx, 7, 10, 2); g.fillRect(nx + 2, 5, 5, 2);
      g.fillRect(((t * 2 + 20) % (w + 16)) - 12, 15, 8, 2);
    }
    // prédios ao longe
    const pr = per === 'noite' ? '#0a0f1f' : tom(cs[2], 0.72);
    g.fillStyle = pr;
    [[0, 22, 6], [6, 18, 5], [11, 24, 4], [15, 16, 6], [21, 21, 5], [26, 19, 4]].forEach(([x, y, l]) => g.fillRect(x, y, l, h - y));
    if (per === 'noite') { g.fillStyle = '#ffd86b'; [[2, 25], [8, 21], [17, 19], [17, 23], [23, 24], [27, 22]].forEach(([x, y]) => g.fillRect(x, y, 1, 1)); }
    // caixilho
    g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h); g.fillRect(14, 0, 2, h);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(4, 3, 1, 8); g.fillRect(18, 3, 1, 8);
    g.fillStyle = '#c9c9c2'; g.fillRect(0, h - 1, w, 1);
    return c;
  }

  // TV/painel de status na parede esquerda (dinâmica).
  function texTV(estado, t) {
    const w = 34, h = 24;
    const c = tela(w, h), g = c.getContext('2d');
    g.fillStyle = '#0c0f10'; g.fillRect(0, 0, w, h);
    g.fillStyle = GRAFITE; g.fillRect(1, 1, w - 2, h - 2);
    const tv = estado.tv || {};
    g.fillStyle = VERDE; g.fillRect(1, 1, w - 2, 7);
    texto(g, 'KWIK', 3, 2, '#ffffff');
    simboloPixel(g, 24, 2, 0.5, '#ffffff');
    if (tv.modo === 'trabalhando') {
      texto(g, 'NEWS', 3, 10, '#d8f5df');
      const pr = Math.max(0, Math.min(100, tv.progresso || 0));
      g.fillStyle = '#26332f'; g.fillRect(3, 17, 28, 4);
      g.fillStyle = VERDE; g.fillRect(3, 17, Math.round(28 * pr / 100), 4);
      if (Math.floor(t * 4) % 2) { g.fillStyle = '#ffffff'; g.fillRect(3 + Math.round(28 * pr / 100) - 1, 17, 1, 4); }
      texto(g, String(Math.round(pr)), 20, 10, '#ffffff');
    } else if (tv.modo === 'pronto') {
      texto(g, 'PRONTO', 4, 11, '#ffffff');
      g.fillStyle = VERDE; [[12, 18], [13, 19], [14, 20], [15, 19], [16, 18], [17, 17], [18, 16]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
    } else if (tv.modo === 'matrix') {
      for (let i = 0; i < 8; i++) texto(g, String((Math.floor(t * 8) + i * 3) % 10), 2 + i * 4, 9 + ((i * 5 + Math.floor(t * 10)) % 10), i % 2 ? VERDE : '#8dffad');
    } else {
      const hh = new Date();
      texto(g, String(hh.getHours()).padStart(2, '0') + ':' + String(hh.getMinutes()).padStart(2, '0'), 3, 10, '#ffffff');
      const alt = [3, 5, 4, 6, 8];
      alt.forEach((a, i) => { g.fillStyle = i === 4 ? VERDE : '#2E8B45'; g.fillRect(23 + i * 2, 20 - a + (i === 4 && Math.floor(t) % 2 ? -1 : 0), 1, a); });
      texto(g, 'R$', 3, 16, '#9be3ad');
    }
    return c;
  }

  function texRelogio() {
    const c = tela(9, 9), g = c.getContext('2d');
    g.fillStyle = CONTORNO; g.fillRect(2, 0, 5, 9); g.fillRect(0, 2, 9, 5); g.fillRect(1, 1, 7, 7);
    g.fillStyle = '#ffffff'; g.fillRect(2, 1, 5, 7); g.fillRect(1, 2, 7, 5);
    const d = new Date();
    const ang = (v, tot) => (v / tot) * Math.PI * 2 - Math.PI / 2;
    g.fillStyle = GRAFITE;
    const a1 = ang(d.getHours() % 12 + d.getMinutes() / 60, 12), a2 = ang(d.getMinutes(), 60);
    for (let r = 0; r <= 2; r++) g.fillRect(Math.round(4 + Math.cos(a1) * r), Math.round(4 + Math.sin(a1) * r), 1, 1);
    g.fillStyle = '#d4483b';
    for (let r = 0; r <= 3; r++) g.fillRect(Math.round(4 + Math.cos(a2) * r), Math.round(4 + Math.sin(a2) * r), 1, 1);
    return c;
  }

  function texEstante(cor, w, h) {
    return tex('estante' + cor, w, h, (g, w, h) => {
      g.fillStyle = cor; g.fillRect(0, 0, w, h);
      const cores = ['#3f7fc1', '#2E8B45', '#c9453a', '#e2b33c', '#5a4fa8', '#e9e4d8', '#1f6d67', '#d97a2b'];
      const prat = [3, 17, 31, 45];
      prat.forEach((y0, p) => {
        g.fillStyle = tom(cor, 0.55); g.fillRect(2, y0, w - 4, 12);
        if (p === 3) { // gavetas
          g.fillStyle = tom(cor, 0.9); g.fillRect(2, y0, w - 4, 12);
          g.fillStyle = tom(cor, 0.5); g.fillRect(2, y0 + 6, w - 4, 1);
          g.fillStyle = '#c9c9c2'; g.fillRect(w / 2 - 2, y0 + 3, 4, 1); g.fillRect(w / 2 - 2, y0 + 9, 4, 1);
          return;
        }
        let x = 3;
        let i = p * 3;
        while (x < w - 4) {
          const lw = 2 + ((i * 7) % 3), lh = 7 + ((i * 5) % 4);
          if (p === 1 && x > w / 2 - 3 && x < w / 2 + 4) { // pasta deitada / caixa
            g.fillStyle = '#ffffff'; g.fillRect(x, y0 + 8, 7, 3); x += 8; i++; continue;
          }
          g.fillStyle = cores[i % cores.length]; g.fillRect(x, y0 + 12 - lh, lw, lh);
          g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, y0 + 13 - lh, 1, lh - 2);
          x += lw + 1; i++;
        }
      });
      moldura(g, w, h, tom(cor, 0.4), 'blr');
    });
  }

  function texCofre(w, h) {
    return tex('cofre', w, h, (g, w, h) => {
      g.fillStyle = '#4a5156'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#3a4045'; g.fillRect(1, 1, w - 2, h - 2);
      g.fillStyle = '#5b636a'; g.fillRect(2, 2, w - 4, h - 4);
      g.fillStyle = '#e6c04a'; g.fillRect(w / 2 - 2, h / 2 - 2, 4, 4);
      g.fillStyle = '#2b2f33'; g.fillRect(w / 2 - 1, h / 2 - 1, 2, 2);
      g.fillStyle = '#c9c9c2'; g.fillRect(w - 4, h / 2 - 3, 1, 6);
      moldura(g, w, h, '#22272b', 'blr');
    });
  }

  // ------------------------------------------------------------------ móveis
  function mesa(ctx, e) {
    const c = e.mesa, X = 26, Y = 30, w = 18, d = 40;
    for (const [x, y] of [[X + 1, Y + 1], [X + w - 3, Y + 1]]) prisma(ctx, { X: x, Y: y, w: 2, d: 2, h: 11, cor: tom(c, 0.75) });
    prisma(ctx, { X: X + 1, Y: Y + d - 13, w: w - 2, d: 12, Z: 0, h: 11, cor: tom(c, 0.92) }); // gaveteiro
    const dr = tex('gav' + c, 12, 11, (g, w, h) => {
      g.fillStyle = tom(c, 0.62); g.fillRect(0, 0, w, h);
      g.fillStyle = tom(c, 0.45); g.fillRect(0, 5, w, 1); moldura(g, w, h, tom(c, 0.4), 'blr');
      g.fillStyle = '#d8d2c4'; g.fillRect(5, 2, 3, 1); g.fillRect(5, 8, 3, 1);
    });
    face(ctx, dr, MAT.paredeE, ...P(X + w - 1, Y + d - 1, 11));
    for (const [x, y] of [[X + 1, Y + d - 3], [X + w - 3, Y + d - 3]]) if (y < Y + d - 13) prisma(ctx, { X: x, Y: y, w: 2, d: 2, h: 11, cor: tom(c, 0.75) });
    prisma(ctx, { X, Y, Z: 11, w, d, h: 3, cor: c });
  }

  function itensMesa(ctx, e, estado, t) {
    // papéis, livros, caneca, teclado e monitor
    prisma(ctx, { X: 35, Y: 60, Z: 14, w: 7, d: 8, h: 1, cor: '#f7f7f2' });
    prisma(ctx, { X: 36, Y: 61, Z: 15, w: 6, d: 6, h: 1, cor: '#ffffff' });
    prisma(ctx, { X: 32, Y: 32, Z: 14, w: 9, d: 6, h: 2, cor: '#3f7fc1' });
    prisma(ctx, { X: 33, Y: 32, Z: 16, w: 8, d: 6, h: 2, cor: '#2E8B45' });
    prisma(ctx, { X: 32, Y: 33, Z: 18, w: 8, d: 5, h: 2, cor: '#e2b33c' });
    // caneca KWIK
    prisma(ctx, { X: 29, Y: 63, Z: 14, w: 3, d: 3, h: 4, cor: '#ffffff', corDir: '#dcdcd5', corEsq: '#efefea' });
    const [mx, my] = P(31, 65, 18);
    ctx.fillStyle = VERDE; ctx.fillRect(Math.round(mx) - 2, Math.round(my) + 2, 1, 1);
    if (estado.cafe) for (let i = 0; i < 3; i++) {
      const fy = (t * 8 + i * 4) % 10;
      ctx.fillStyle = `rgba(255,255,255,${0.6 - fy / 18})`; ctx.fillRect(Math.round(mx) - 2 + Math.round(Math.sin(t * 3 + i) * 1), Math.round(my) - 2 - fy, 1, 1);
    }
    // teclado
    prisma(ctx, { X: 27, Y: 46, Z: 14, w: 5, d: 12, h: 1, cor: '#2b3135' });
    // monitor (costas para a gente, tela virada para o funcionário)
    prisma(ctx, { X: 34, Y: 48, Z: 14, w: 4, d: 4, h: 1, cor: '#30363a' });
    prisma(ctx, { X: 35, Y: 49, Z: 15, w: 2, d: 2, h: 5, cor: '#30363a' });
    const brilho = estado.tv && estado.tv.modo === 'trabalhando';
    prisma(ctx, { X: 33, Y: 42, Z: 19, w: 3, d: 16, h: 12, cor: '#3a4246' });
    const [lx, ly] = P(33, 58, 31);
    if (e.itens.logo) { // adesivo KWIK nas costas do monitor
      const s = tex('adesivo', 6, 6, g => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 6, 6); simboloPixel(g, 0, 0, 0.5, VERDE); });
      face(ctx, s, MAT.paredeE, ...P(36, 53, 28));
    }
    if (brilho || estado.matrix) {
      ctx.fillStyle = estado.matrix ? 'rgba(80,255,130,0.25)' : 'rgba(120,230,160,' + (0.18 + 0.08 * Math.sin(t * 10)) + ')';
      ctx.fillRect(Math.round(lx) - 2, Math.round(ly) - 4, 16, 14);
    }
  }

  function cadeira(ctx, e, ocupada) {
    const c = e.cadeira;
    prisma(ctx, { X: 12, Y: 48, w: 2, d: 2, h: 7, cor: '#55595c' });
    prisma(ctx, { X: 8, Y: 44, Z: 7, w: 10, d: 10, h: 2, cor: c });
    prisma(ctx, { X: 6, Y: 44, Z: 9, w: 2, d: 10, h: ocupada ? 12 : 13, cor: tom(c, 1.05) });
  }

  function gaveteiroPlanta(ctx, e, t) {
    prisma(ctx, { X: 2, Y: 2, w: 14, d: 12, h: 18, cor: '#2f3438' });
    const fr = tex('gavP', 14, 18, (g, w, h) => {
      g.fillStyle = '#272c2f'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1b1f22'; g.fillRect(0, 6, w, 1); g.fillRect(0, 12, w, 1); moldura(g, w, h, '#151819', 'blr');
      g.fillStyle = '#9aa3a1'; g.fillRect(6, 3, 3, 1); g.fillRect(6, 9, 3, 1); g.fillRect(6, 15, 3, 1);
    });
    face(ctx, fr, MAT.paredeD, ...P(2, 14, 18));
    // vaso + planta (sprite em pé)
    const [px, py] = P(9, 8, 18);
    const x = Math.round(px), y = Math.round(py);
    ctx.fillStyle = '#b5532f'; ctx.fillRect(x - 3, y - 5, 6, 5); ctx.fillStyle = '#8f3f22'; ctx.fillRect(x - 3, y - 5, 6, 1);
    const bal = Math.round(Math.sin(t * 1.5) * 0.6);
    ctx.fillStyle = '#2E8B45'; ctx.fillRect(x - 1 + bal, y - 17, 2, 12);
    ctx.fillStyle = VERDE; ctx.fillRect(x - 4 + bal, y - 13, 3, 2); ctx.fillRect(x + 1 + bal, y - 15, 3, 2); ctx.fillRect(x - 3 + bal, y - 9, 2, 2); ctx.fillRect(x + 2 + bal, y - 10, 2, 2);
    ctx.fillStyle = '#ff7a8a'; ctx.fillRect(x + bal, y - 19, 1, 2);
  }

  function lixeira(ctx) {
    prisma(ctx, { X: 4, Y: 78, w: 6, d: 6, h: 7, cor: '#8b2f2a' });
    const [x, y] = P(7, 81, 7); ctx.fillStyle = '#5e1e1a'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 3, 2, 2);
  }

  function estante(ctx, e) {
    const c = e.estante || '#2b2f33';
    prisma(ctx, { X: 64, Y: 2, w: 28, d: 14, h: 58, cor: c, esq: texEstante(c, 28, 58) });
  }

  function cofre(ctx, caixa, t) {
    prisma(ctx, { X: 90, Y: 22, w: 14, d: 14, h: 18, cor: '#5b636a', esq: texCofre(14, 18) });
    // pilhas de moedas que crescem com o caixa
    const pilhas = Math.min(4, Math.ceil(caixa / 600));
    const alturaTot = Math.min(4 * 10, Math.floor(caixa / 60));
    const pos = [[84, 42], [90, 44], [80, 48], [96, 42]];
    for (let i = 0; i < pilhas; i++) {
      const n = Math.max(1, Math.min(10, alturaTot - i * 10));
      const [x, y] = P(pos[i][0], pos[i][1], 0);
      for (let k = 0; k < n; k++) {
        const yy = Math.round(y) - k * 2;
        ctx.fillStyle = '#9a6f12'; ctx.fillRect(Math.round(x) - 3, yy - 1, 6, 2);
        ctx.fillStyle = k % 2 ? '#f2c230' : '#e6b422'; ctx.fillRect(Math.round(x) - 3, yy - 2, 6, 1);
      }
      if (n >= 10 && Math.floor(t * 2 + i) % 6 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x) + 1, Math.round(y) - n * 2 - 1, 1, 1); }
    }
    if (caixa >= 5000) { // saco de dinheiro
      const [x, y] = P(100, 46, 0);
      const bx = Math.round(x), by = Math.round(y);
      ctx.fillStyle = '#c9a65b'; ctx.fillRect(bx - 4, by - 8, 8, 8); ctx.fillRect(bx - 2, by - 10, 4, 2);
      ctx.fillStyle = '#8a6a2a'; ctx.fillRect(bx - 2, by - 9, 4, 1);
      texto(ctx, '$', bx - 1, by - 6, '#2E8B45');
    }
  }

  // ------------------------------------------------------------------ personagem
  const spriteCache = new Map();
  function sprite(ap, est) {
    const chave = JSON.stringify([ap, est]);
    let c = spriteCache.get(chave);
    if (c) return c;
    if (spriteCache.size > 400) spriteCache.clear();
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
    const [r, gg, b] = hex(CONTORNO);
    for (let i = 0; i < marcar.length; i += 2) {
      const k = (marcar[i + 1] * w + marcar[i]) * 4;
      d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }

  KM.sprite = sprite;

  // ------------------------------------------------------------------ cena completa
  // Objetos com profundidade (X+Y). O personagem entra na ordenação.
  function objetos(cfg, estado, t) {
    const e = cfg.escritorio, it = e.itens;
    const lista = [];
    if (it.planta) lista.push({ p: 16, f: c => gaveteiroPlanta(c, e, t) });
    if (it.estante) lista.push({ p: 70, f: c => estante(c, e) });
    if (it.cofre) lista.push({ p: 118, f: c => cofre(c, estado.caixa || 0, t) });
    if (it.lixeira) lista.push({ p: 86, f: c => lixeira(c) });
    lista.push({ p: 58, f: c => cadeira(c, e, estado.personagem && estado.personagem.modo === 'sentado') });
    lista.push({ p: 84, f: c => { mesa(c, e); itensMesa(c, e, estado, t); } });
    return lista;
  }

  KM.desenhar = function (ctx, cfg, estado, t) {
    const e = cfg.escritorio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);

    // laje do chão + piso
    prisma(ctx, { X: 0, Y: 0, Z: -6, w: SALA, d: SALA, h: 6, topo: texPiso(e), corEsq: tom(e.corPiso, 0.6), corDir: tom(e.corPiso, 0.45) });
    // paredes (canto, esquerda, direita) com espessura
    const capa = tom(e.parede, 0.62);
    prisma(ctx, { X: -4, Y: -4, w: 4, d: 4, Z: -6, h: PAREDE + 6, cor: capa, semEsq: true, semDir: true, corTopo: capa });
    prisma(ctx, { X: -4, Y: 0, Z: -6, w: 4, d: SALA, h: PAREDE + 6, corTopo: capa, corEsq: tom(e.parede, 0.5), semDir: true });
    face(ctx, texParedeE(e), MAT.paredeE, ...P(0, SALA, PAREDE));
    prisma(ctx, { X: 0, Y: -4, Z: -6, w: SALA, d: 4, h: PAREDE + 6, corTopo: capa, corDir: tom(e.parede, 0.45), semEsq: true });
    face(ctx, texParedeD(e), MAT.paredeD, ...P(0, 0, PAREDE));

    // itens dinâmicos nas paredes
    if (e.itens.janela) face(ctx, texJanela(cfg, t), MAT.paredeD, ...P(22, 0, PAREDE - 12));
    if (e.itens.relogio) face(ctx, texRelogio(), MAT.paredeD, ...P(56, 0, PAREDE - 12));
    if (e.itens.tv) face(ctx, texTV(estado, t), MAT.paredeE, ...P(0, 104, PAREDE - 16));

    // tapete
    if (e.tapete) face(ctx, texTapete(e, 44, 44), MAT.chao, ...P(52, 50, 0));

    // sombra do personagem + objetos ordenados
    const lista = objetos(cfg, estado, t);
    const pers = estado.personagem;
    if (pers && pers.visivel !== false) lista.push({ p: pers.X + pers.Y, f: c => KM.desenharPersonagem(c, cfg, estado, t), depois: pers.modo === 'sentado' ? 1 : 0 });
    lista.sort((a, b) => a.p - b.p);
    for (const o of lista) o.f(ctx);
    if (pers && pers.modo === 'sentado' && pers.visivel !== false) KM.desenharMaos(ctx, cfg, estado, t);

    // luz da noite
    if (KM.periodo(cfg) === 'noite') {
      ctx.fillStyle = 'rgba(16,24,60,0.22)'; ctx.fillRect(0, 0, W, H);
    }
  };

  // posição na tela do personagem
  KM.ancora = function (pers) {
    if (pers.modo === 'sentado') { const [x, y] = P(pers.X, pers.Y, 0); return [Math.round(x), Math.round(y) - 2]; }
    const [x, y] = P(pers.X, pers.Y, pers.Z || 0);
    return [Math.round(x), Math.round(y)];
  };

  // Direção: fe = frente p/ baixo-esquerda (+Y), fd = frente p/ baixo-direita (+X),
  //          ce = costas p/ cima-esquerda (-X), cd = costas p/ cima-direita (-Y).
  KM.vistaDe = dir => ({ vista: dir === 'ce' || dir === 'cd' ? 'costas' : 'frente', espelho: dir === 'fd' || dir === 'cd' });
  const SPR_W = 30;

  KM.desenharPersonagem = function (ctx, cfg, estado, t) {
    const pers = estado.personagem;
    const ap = cfg.funcionarios[0].aparencia;
    const est = Object.assign({}, pers.est || {});
    const dir = pers.dir || (pers.modo === 'sentado' ? 'fd' : 'fe');
    const v = KM.vistaDe(dir);
    est.vista = v.vista;
    if (pers.modo === 'sentado') { est.pose = 'sentado'; est.bracos = est.bracos || 'frente'; }
    const s = sprite(ap, est);
    const [ax, ay] = KM.ancora(pers);
    const chao = ay + (pers.Z || 0);
    if (pers.selecionado && pers.modo !== 'sentado') { // círculo verde no chão
      ctx.fillStyle = 'rgba(40,190,82,' + (0.35 + 0.2 * Math.sin(t * 5)) + ')';
      ctx.fillRect(ax - 10, chao - 1, 20, 2); ctx.fillRect(ax - 8, chao - 2, 16, 4);
    }
    if (pers.modo !== 'sentado') { // sombra
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      const so = (pers.Z || 0) > 0 ? 4 : 7;
      ctx.fillRect(ax - so, chao - 2, so * 2, 3); ctx.fillRect(ax - so + 2, chao - 3, so * 2 - 4, 5);
    }
    if (pers.auraAtras) pers.auraAtras(ctx, ax, ay, t);
    const ox = ax - 15, oy = pers.modo === 'sentado' ? ay - 37 : ay - 45;
    if (v.espelho) { ctx.save(); ctx.translate(ox + SPR_W, oy); ctx.scale(-1, 1); ctx.drawImage(s, 0, 0); ctx.restore(); }
    else ctx.drawImage(s, ox, oy);
    const topo = est.saiyan ? 0 : ({ cacheado: 3, moicano: 1, coque: 1, careca: 6 }[ap.cabelo] ?? 5);
    pers.cabecaTela = [ax, oy + 2 + topo + (ap.bone && !est.saiyan ? -2 : 0)];
  };

  // Antebraços e mãos no teclado (desenhados por cima da mesa). Sentado ele olha para a mesa (+X).
  KM.desenharMaos = function (ctx, cfg, estado, t) {
    const pers = estado.personagem;
    if (!pers || pers.modo !== 'sentado' || pers.dormindo || (pers.est && pers.est.bracos && pers.est.bracos !== 'frente')) return;
    const ap = cfg.funcionarios[0].aparencia, pele = ap.pele, peleS = KM.cor.tom(pele, 0.86);
    const [ax, ay] = KM.ancora(pers);
    const vel = pers.digitando ? (pers.turbo ? 26 : 12) : 0;
    const a = vel ? (Math.floor(t * vel) % 2) : 0, b = vel ? 1 - a : 0;
    const mao = (x, y, cor) => {
      ctx.fillStyle = CONTORNO; ctx.fillRect(x - 1, y - 1, 5, 4);
      ctx.fillStyle = cor; ctx.fillRect(x, y, 3, 2);
    };
    const braco = (x0, y0, x1, y1, cor) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); ctx.fillStyle = CONTORNO; ctx.fillRect(x - 1, y - 1, 4, 4); }
      for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); ctx.fillStyle = cor; ctx.fillRect(x, y, 2, 2); }
    };
    const manga = ap.estiloCamisa === 'casual' || ap.estiloCamisa === 'kwik' || !ap.estiloCamisa;
    const corBraco = manga ? pele : ap.corCamisa, corLonge = manga ? peleS : KM.cor.tom(ap.corCamisa, 0.84);
    braco(ax - 7, ay - 9, ax + 1, ay - 5 - b, corLonge);
    braco(ax + 6, ay - 10, ax + 9, ay - 7 - a, corBraco);
    mao(ax + 1, ay - 5 - b, peleS);
    mao(ax + 9, ay - 7 - a, pele);
  };

  // Ponto da tela → coordenadas lógicas (para cliques).
  KM.acertouPersonagem = function (estado, x, y) {
    const p = estado.personagem;
    if (!p) return false;
    const [ax, ay] = KM.ancora(p);
    const topo = p.modo === 'sentado' ? ay - 37 : ay - 45;
    return x >= ax - 11 && x <= ax + 11 && y >= topo + 4 && y <= ay;
  };
})();
