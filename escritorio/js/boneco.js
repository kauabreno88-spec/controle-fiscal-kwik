/* KWIK Mini Escritório · o funcionário em pixel art (vista 3/4, estilo "chibi").
   Desenha numa grade de 28x44 (pés na linha 42). Vista base: "frente" olhando para baixo-esquerda
   e "costas" olhando para cima-esquerda; as outras duas direções são o espelho dessas. */
(function () {
  const KM = (window.KM = window.KM || {});
  const VERDE = '#28BE52';

  KM.desenharBoneco = function (g, ap, est) {
    const { tom } = KM.cor;
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const p = (x, y, c) => r(x, y, 1, 1, c);

    const costas = est.vista === 'costas';
    const sentado = est.pose === 'sentado';
    const ss = est.saiyan || 0;
    const cy = est.cabecaDy || 0;

    const pele = ap.pele, peleS = tom(pele, 0.86), peleD = tom(pele, 0.7);
    const cab = ss === 'deus' ? '#e8344a' : ss === 'branco' ? '#dfe7f2' : ss ? '#ffd93b' : ap.corCabelo;
    const cabS = tom(cab, 0.72), cabH = tom(cab, 1.32);
    const estilo = ap.estiloCamisa || 'casual';
    const cam = ap.corCamisa, camS = tom(cam, 0.84), camD = tom(cam, 0.68), camH = tom(cam, 1.15);
    const calca = ap.calca, calS = tom(calca, 0.72);
    const sap = ap.sapato, sapH = tom(sap, 1.6), sola = tom(sap, 0.55);
    const gravata = ap.corGravata || VERDE;
    const cordao = ap.corCordao || '#E8613C';
    // comprimento da manga (linhas a partir do ombro): polo curta, casual dobrada, resto comprida
    const manga = estilo === 'kwik' ? 3 : estilo === 'casual' ? 5 : 9;

    g.translate(0, est.dy || 0);

    // ---------------------------------------------------------------- braços
    function bracoDesce(x, longe) {
      const c = longe ? camS : cam, pl = longe ? peleS : pele;
      for (let i = 0; i < 9; i++) r(x, 22 + i, 3, 1, i < manga ? (estilo === 'casual' && i === manga - 1 ? camH : c) : pl);
      if (manga >= 9) r(x, 30, 3, 1, longe ? camD : camH);
      r(x, 31, 3, 2, pl); p(longe ? x + 2 : x, 32, longe ? peleD : peleS);
    }
    function bracoSobe(x, longe, dx = 0) {
      const c = longe ? camS : cam, pl = longe ? peleS : pele;
      for (let i = 0; i < 9; i++) r(x + (i > 5 ? dx : 0), 22 - i, 3, 1, i < manga ? c : pl);
      r(x + dx, 11, 3, 2, pl);
    }
    function bracoFrente(x, longe) { // digitando: só até o cotovelo; antebraço e mão vêm depois da mesa
      const c = longe ? camS : cam;
      for (let i = 0; i < 5; i++) r(x, 22 + i, 3, 1, i < manga ? (estilo === 'casual' && i === manga - 1 ? camH : c) : (longe ? peleS : pele));
    }
    const b = est.bracos || 'baixo';
    const bracoLonge = () => {
      if (b === 'cima') bracoSobe(20, true);
      else if (b === 'aceno') bracoSobe(20, true, est.aceno ? 1 : 0);
      else if (b === 'poder') { bracoDesce(21, true); r(21, 30, 4, 3, peleS); }
      else if (b === 'frente') bracoFrente(20, true);
      else if (b === 'cafe') { r(20, 22, 3, 3, camS); r(17, 24, 4, 2, manga >= 5 ? camS : peleS); }
      else bracoDesce(20, true);
    };
    const bracoPerto = () => {
      if (b === 'cima') bracoSobe(5, false);
      else if (b === 'poder') { bracoDesce(4, false); r(3, 30, 4, 3, pele); p(4, 31, peleS); }
      else if (b === 'frente') bracoFrente(5, false);
      else bracoDesce(5, false);
    };

    // ---------------------------------------------------------------- cabelo comprido (atrás do corpo)
    if (!costas) {
      if (ss === 3) { r(18, 8, 5, 30, cab); r(21, 10, 2, 26, cabS); r(5, 9, 3, 16, cab); }
      else if (!ss && ap.cabelo === 'longo') { r(18, 9, 4, 15, cab); r(20, 12, 2, 12, cabS); r(7, 10, 2, 11, cab); }
    }

    // ---------------------------------------------------------------- pernas
    if (!sentado) {
      const ps = est.passo || 0, a = ps === 1 ? 1 : ps === 2 ? -1 : 0, bb = -a;
      r(9, 31, 10, 2, calca);
      r(14, 33, 4, 6 + bb, calS); r(14, 33, 1, 6 + bb, calca);
      const yb = 39 + bb, xb = costas ? 14 : 13;
      r(xb, yb, 5, 2, tom(sap, 0.85)); r(xb, yb + 2, 5, 1, sola);
      r(9, 33, 4, 7 + a, calca); r(12, 33, 1, 7 + a, calS); p(10, 34, tom(calca, 1.25));
      const ya = 40 + a, xa = costas ? 9 : 8;
      r(xa, ya, 5, 2, sap); p(xa + (costas ? 3 : 0), ya, sapH); r(xa, ya + 2, 5, 1, sola);
    } else {
      r(8, 31, 12, 4, calca); r(8, 34, 12, 1, calS); r(16, 31, 4, 4, calS);
    }

    // ---------------------------------------------------------------- tronco
    bracoLonge();
    r(8, 21, 12, 11, cam); r(7, 22, 14, 3, cam);
    r(17, 21, 3, 11, camS); r(19, 22, 2, 3, camS); r(8, 29, 12, 1, camS);
    r(9, 31, 10, 1, '#3a2a1e');
    if (costas) {
      r(10, 21, 8, 1, camH); r(13, 24, 1, 5, camS); r(10, 26, 1, 3, camS);
      if (ap.cracha !== false) r(10, 21, 8, 1, cordao);
      if (estilo === 'moletom') { r(9, 20, 10, 4, camS); r(10, 21, 8, 2, camD); }
    } else {
      p(12, 31, '#c9a65b');
      if (estilo === 'casual') {
        p(10, 21, camH); p(11, 22, camH); p(16, 21, camH); p(15, 22, camH);
        r(12, 21, 3, 1, pele); p(13, 22, peleS);
        p(13, 25, camD); p(13, 28, camD); r(9, 24, 3, 1, camS);
      } else if (estilo === 'kwik') {
        r(10, 21, 7, 1, camH); p(13, 22, '#ffffff'); p(13, 23, '#ffffff'); r(15, 24, 2, 2, '#ffffff');
      } else if (estilo === 'social') {
        p(11, 21, '#ffffff'); p(15, 21, '#ffffff'); r(12, 22, 3, 1, tom(gravata, 0.8)); r(13, 22, 1, 7, gravata); p(13, 29, tom(gravata, 0.7));
      } else if (estilo === 'terno') {
        r(11, 21, 5, 5, '#ffffff'); r(13, 22, 1, 6, gravata); r(10, 21, 1, 6, camD); r(16, 21, 1, 6, camD);
        p(11, 26, camD); p(15, 26, camD); p(13, 28, camD);
      } else if (estilo === 'moletom') {
        r(9, 20, 10, 2, camS); r(10, 26, 7, 3, camS); p(12, 22, '#f4f4f4'); p(12, 23, '#f4f4f4'); p(15, 22, '#f4f4f4'); p(15, 23, '#f4f4f4');
      }
      if (ap.cracha !== false) { // cordão com crachá
        p(11, 22, cordao); p(11, 23, cordao); p(12, 24, cordao); p(16, 22, cordao); p(16, 23, cordao); p(15, 24, cordao);
        p(13, 25, '#9aa3a1'); r(12, 26, 3, 4, '#ffffff'); p(13, 27, '#6aa5d8'); r(12, 29, 3, 1, '#c9c9c2');
      }
    }
    bracoPerto();

    // ---------------------------------------------------------------- cabeça
    r(12, 19 + cy, 4, 2, peleS);
    const Y = n => n + cy;
    if (costas) {
      r(9, Y(9), 11, 11, pele); r(8, Y(10), 13, 9, pele);
      cabeloCostas();
      p(7, Y(13), pele); p(7, Y(14), pele); p(7, Y(15), peleS);
      acessoriosCostas();
    } else {
      r(9, Y(9), 11, 11, pele); r(8, Y(10), 13, 9, pele); r(10, Y(20), 8, 1, pele);
      r(18, Y(11), 2, 8, peleS); p(17, Y(19), peleS);
      r(19, Y(13), 2, 4, pele); p(20, Y(14), peleD); p(20, Y(15), peleD);
      if (ap.barba && !ss) { r(9, Y(17), 10, 3, cab); r(10, Y(20), 8, 1, cab); r(17, Y(13), 2, 4, cab); r(11, Y(17), 4, 1, pele); }
      rosto();
      cabeloFrente();
      acessoriosFrente();
    }

    // caneca na mão (café) por cima de tudo
    if (b === 'cafe' && !costas) {
      r(15, 21, 2, 2, peleS);
      r(12, 18, 3, 4, '#ffffff'); r(12, 18, 3, 1, '#6b3a1e'); p(15, 19, '#ffffff'); p(15, 20, '#ffffff'); p(13, 20, VERDE);
    }
    g.translate(0, -(est.dy || 0));

    // ---------------------------------------------------------------- partes
    function rosto() {
      const olho = ss === 'deus' ? '#d81b3c' : ss === 'branco' ? '#9fb4d6' : ss ? '#13a89e' : '#2a1d16';
      const esc = '#2a1d16';
      if (ss) { p(9, Y(12), cabS); p(10, Y(13), cabS); p(16, Y(12), cabS); p(15, Y(13), cabS); }
      else { r(9, Y(12), 2, 1, cabS); r(14, Y(12), 3, 1, cabS); }
      if (est.olhos === 'fechados' || est.piscar) { r(9, Y(15), 2, 1, peleD); r(15, Y(15), 2, 1, peleD); }
      else if (est.olhos === 'feliz') { p(9, Y(15), esc); p(10, Y(14), esc); p(11, Y(15), esc); p(14, Y(15), esc); p(15, Y(14), esc); p(16, Y(15), esc); }
      else {
        r(10, Y(14), 1, 2, olho); r(15, Y(14), 1, 2, olho);
        if (ss) { p(10, Y(14), '#ffffff'); p(15, Y(14), '#ffffff'); }
        else { p(9, Y(15), peleS); p(14, Y(15), peleS); }
      }
      p(12, Y(16), peleD);
      const boca = est.boca || 'normal';
      if (boca === 'sorriso') { p(11, Y(17), '#7a3b2a'); r(12, Y(18), 2, 1, '#7a3b2a'); p(14, Y(17), '#7a3b2a'); }
      else if (boca === 'grito') { r(11, Y(17), 4, 2, '#5a1a1a'); r(12, Y(18), 2, 1, '#d84a4a'); }
      else if (boca === 'o') r(12, Y(17), 2, 2, '#5a1a1a');
      else r(12, Y(18), 2, 1, peleD);
      if (boca === 'sorriso' || est.olhos === 'feliz') { p(9, Y(17), '#f0a08a'); p(16, Y(17), '#f0a08a'); }
    }

    function cabeloFrente() {
      const c = (x, y, w, h, cor = cab) => r(x, Y(y), w, h, cor);
      const curto = () => {
        c(8, 6, 13, 4); c(10, 5, 9, 1); c(9, 4, 7, 1); c(10, 3, 4, 1); c(9, 10, 9, 1); c(8, 10, 1, 3); c(9, 11, 3, 1); c(9, 12, 1, 1);
        c(18, 9, 3, 5); c(20, 7, 1, 8, cabS); c(19, 6, 1, 3, cabS);
        c(10, 4, 4, 1, cabH); c(11, 5, 5, 1, cabH); c(9, 6, 2, 1, cabH); c(16, 6, 2, 1, cabH);
        c(12, 8, 5, 1, cabS); c(14, 10, 3, 1, cabS); c(15, 7, 1, 1, cabS); c(17, 8, 1, 2, cabS);
      };
      if (ss === 3) {
        c(6, 3, 17, 8); c(8, 0, 3, 3); c(12, 0, 4, 3); c(17, 1, 3, 3); c(4, 6, 3, 3); c(21, 6, 3, 3);
        c(8, 11, 2, 3); c(15, 11, 2, 2); c(18, 10, 3, 5); c(12, 1, 1, 4, cabH); c(9, 5, 7, 1, cabH);
        return;
      }
      if (ss) {
        c(7, 5, 15, 6); c(8, 1, 2, 4); c(11, 0, 3, 5); c(15, 1, 2, 4); c(18, 3, 2, 3); c(4, 7, 3, 2); c(5, 9, 2, 2); c(21, 8, 3, 2);
        c(8, 11, 2, 3); c(11, 11, 1, 2); c(15, 11, 1, 2); c(18, 10, 3, 4);
        c(12, 1, 1, 4, cabH); p(9, Y(2), cabH); c(9, 6, 6, 1, cabH);
        if (ss === 2) c(13, 11, 1, 4);
        return;
      }
      switch (ap.cabelo) {
        case 'longo': curto(); c(7, 10, 2, 9); break;
        case 'cacheado':
          c(6, 4, 17, 8); c(5, 6, 19, 6); c(5, 12, 4, 6); c(19, 12, 4, 6); c(8, 11, 10, 1);
          for (const [x, y] of [[7, 6], [10, 5], [13, 6], [16, 5], [19, 7], [8, 9], [12, 8], [17, 9], [6, 13], [20, 14]]) c(x, y, 1, 1, cabH);
          break;
        case 'moicano': c(12, 2, 4, 8); c(13, 1, 2, 1); c(13, 3, 1, 5, cabH); r(8, Y(9), 4, 1, peleD); r(16, Y(9), 4, 1, peleD); break;
        case 'rabo': curto(); c(20, 10, 3, 3); c(21, 13, 3, 8); c(22, 14, 1, 6, cabS); break;
        case 'coque': curto(); c(12, 1, 5, 5); c(13, 1, 3, 1, cabH); c(12, 5, 5, 1, cabS); break;
        case 'careca': r(9, Y(7), 11, 3, pele); r(10, Y(6), 9, 1, pele); p(11, Y(7), tom(pele, 1.25)); p(12, Y(7), tom(pele, 1.25)); c(18, 12, 2, 2, cabS); break;
        default: curto();
      }
    }

    function cabeloCostas() {
      const c = (x, y, w, h, cor = cab) => r(x, Y(y), w, h, cor);
      const base = () => { c(8, 6, 13, 13); c(10, 5, 9, 1); c(9, 19, 11, 0); c(11, 9, 1, 8, cabS); c(15, 8, 1, 9, cabS); c(10, 6, 6, 1, cabH); r(11, Y(19), 6, 1, peleS); };
      if (ss) {
        base(); c(8, 1, 2, 4); c(11, 0, 3, 5); c(15, 1, 2, 4); c(18, 3, 2, 3); c(5, 7, 3, 2); c(21, 7, 3, 2); c(12, 1, 1, 4, cabH);
        if (ss === 3) { c(7, 10, 15, 28); c(10, 12, 1, 24, cabS); c(17, 12, 1, 24, cabS); }
        return;
      }
      switch (ap.cabelo) {
        case 'longo': base(); c(7, 10, 15, 17); c(11, 12, 1, 14, cabS); c(16, 12, 1, 14, cabS); break;
        case 'cacheado': c(5, 4, 19, 15); c(6, 3, 17, 1); for (const [x, y] of [[8, 6], [12, 5], [17, 7], [9, 11], [15, 12], [20, 10]]) c(x, y, 1, 1, cabH); break;
        case 'moicano': c(13, 2, 3, 17); c(14, 3, 1, 14, cabH); break;
        case 'rabo': base(); c(13, 17, 3, 9); c(14, 18, 1, 7, cabS); break;
        case 'coque': base(); c(12, 1, 5, 5); c(13, 1, 3, 1, cabH); break;
        case 'careca': p(12, Y(9), tom(pele, 1.25)); break;
        default: base();
      }
    }

    function acessoriosFrente() {
      if (ap.oculos) {
        const f = '#1b1b1b';
        r(9, Y(13), 3, 1, f); r(9, Y(16), 3, 1, f); r(9, Y(14), 1, 2, f); r(11, Y(14), 1, 2, f);
        r(14, Y(13), 3, 1, f); r(14, Y(16), 3, 1, f); r(14, Y(14), 1, 2, f); r(16, Y(14), 1, 2, f);
        r(12, Y(14), 2, 1, f); r(17, Y(14), 2, 1, f);
        if (est.brilhoOculos) { p(10, Y(14), '#ffffff'); p(15, Y(14), '#ffffff'); }
      }
      if (ss) return;
      if (ap.bone) {
        const cb = ap.corBone || VERDE;
        r(8, Y(4), 13, 5, cb); r(9, Y(3), 11, 1, cb); r(17, Y(4), 4, 5, tom(cb, 0.82));
        r(4, Y(9), 10, 1, tom(cb, 0.65)); r(5, Y(8), 7, 1, tom(cb, 0.85)); p(13, Y(5), '#ffffff'); p(14, Y(6), '#ffffff');
      }
      if (ap.fone) {
        const f = '#202426';
        r(8, Y(4), 13, 1, f); r(7, Y(5), 1, 7, f); r(21, Y(5), 1, 7, f);
        r(6, Y(12), 2, 4, VERDE); r(20, Y(12), 2, 4, VERDE); p(6, Y(12), tom(VERDE, 1.3));
      }
    }
    function acessoriosCostas() {
      if (ss) return;
      if (ap.bone) { const cb = ap.corBone || VERDE; r(8, Y(4), 13, 6, cb); r(9, Y(3), 11, 1, cb); r(12, Y(9), 5, 1, tom(cb, 0.7)); }
      if (ap.fone) { const f = '#202426'; r(8, Y(4), 13, 1, f); r(7, Y(5), 1, 7, f); r(21, Y(5), 1, 7, f); r(6, Y(12), 2, 4, VERDE); r(21, Y(12), 2, 4, VERDE); }
    }
  };
})();
