/* KWIK Mini Escritório · o funcionário em pixel art (vista 3/4, estilo "chibi").
   Desenha numa grade de 28x44 (pés na linha 42). Vista base: "frente" olhando para baixo-esquerda
   e "costas" olhando para cima-esquerda; as outras duas direções são o espelho dessas. */
(function () {
  const KM = (window.KM = window.KM || {});
  const VERDE = '#28BE52';

  // Fantasias: cores trocadas + enfeites desenhados por cima.
  const FANT = {
    vampiro: { nome: '🧛 Vampiro', ap: { pele: '#ece4ea', corCabelo: '#141414', cabelo: 'curto', estiloCamisa: 'terno', corCamisa: '#1b1b1f', corGravata: '#9b1b30', calca: '#1b1b1f', sapato: '#111111', cracha: false, oculos: false, bone: false, fone: false, barba: false } },
    zumbi: { nome: '🧟 Zumbi', ap: { pele: '#a3c48f', corCamisa: '#8a8c7a', estiloCamisa: 'casual', calca: '#4f5541', cracha: false, oculos: false, bone: false, fone: false } },
    pirata: { nome: '🏴‍☠️ Pirata', ap: { corCamisa: '#f4f1ea', estiloCamisa: 'casual', calca: '#3b2a1e', sapato: '#2b1d12', cracha: false, oculos: false, bone: false, fone: false } },
    astronauta: { nome: '👨‍🚀 Astronauta', ap: { corCamisa: '#f1f3f5', estiloCamisa: 'moletom', calca: '#e9ecef', sapato: '#adb5bd', cracha: false, bone: false, fone: false } },
    mago: { nome: '🧙 Mago', ap: { corCamisa: '#5f3dc4', estiloCamisa: 'moletom', calca: '#5f3dc4', sapato: '#3b2a8a', cracha: false, bone: false, fone: false } },
    heroi: { nome: '🦸 Herói', ap: { corCamisa: '#3f7fc1', estiloCamisa: 'heroi', calca: '#2b4f8a', sapato: '#c9453a', cracha: false, bone: false, fone: false, oculos: false } },
    bear: { nome: '🎧 Bear (Obsessão)', ap: { corCamisa: '#8b1e2d', estiloCamisa: 'casual', calca: '#2f3a4a', cracha: false, bone: false } },
    nikki: { nome: '😊 Nikki (Obsessão)', ap: {} },
  };
  KM.FANTASIAS = Object.fromEntries(Object.entries(FANT).map(([k, v]) => [k, v.nome]));

  KM.desenharBoneco = function (g, ap, est) {
    const { tom } = KM.cor;
    const fant = est.fantasia || '';
    if (FANT[fant]) ap = Object.assign({}, ap, FANT[fant].ap);
    if (fant === 'nikki') { est = Object.assign({ olhos: 'vermelhos', boca: 'sorrisao' }, est); ap = Object.assign({}, ap, { pele: tom(ap.pele, 1.12) }); }
    if (fant === 'zumbi' && !est.bracos) est = Object.assign({}, est, { bracos: 'zumbi' });
    const prop = est.prop || '';
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const p = (x, y, c) => r(x, y, 1, 1, c);

    const costas = est.vista === 'costas';
    const sentado = est.pose === 'sentado';
    const ss = est.saiyan || 0;
    const cy = est.cabecaDy || 0;

    const pele = ap.pele, peleS = tom(pele, 0.86), peleD = tom(pele, 0.7);
    const hexEscuro = h => { const [a, b, c] = KM.cor.hex(h); return a * 0.3 + b * 0.59 + c * 0.11 < 70; };
    const cab = ss === 'deus' ? '#e8344a' : ss === 'branco' ? '#dfe7f2' : ss ? '#ffd93b' : ap.corCabelo;
    const cabS = tom(cab, 0.72), cabH = tom(cab, 1.32);
    const estilo = ap.estiloCamisa || 'casual';
    const cam = ap.corCamisa, camS = tom(cam, 0.84), camD = tom(cam, 0.68), camH = tom(cam, 1.15);
    const calca = ap.calca, calS = tom(calca, 0.72);
    const sap = ap.sapato, sapH = tom(sap, 1.6), sola = tom(sap, 0.55);
    const gravata = ap.corGravata || VERDE;
    const cordao = ap.corCordao || '#E8613C';
    // comprimento da manga (linhas a partir do ombro): polo/camiseta curta, casual dobrada, regata sem manga, resto comprida
    const manga = estilo === 'regata' ? 0 : estilo === 'kwik' || estilo === 'camiseta' || estilo === 'vestido' ? 3 : estilo === 'casual' ? 5 : 9;
    const parteBaixo = estilo === 'vestido' ? 'vestido' : ap.baixo || 'calca';
    const calcado = ap.calcado || 'sapato';
    const chapeu = ap.chapeu || (ap.bone ? 'bone' : '');
    const enc = ap.altura === 'baixo' ? 4 : 0; // baixinho: pernas mais curtas, corpo mais perto do chão

    g.translate(0, (est.dy || 0) + enc);

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
    function bracoFrente(x, longe) { // digitando: só até o cotovelo; antebraço e mão ficam na mesa
      const c = longe ? camS : cam, dx = est.tecla && costas ? (longe ? -1 : 1) : 0;
      for (let i = 0; i < 5; i++) r(x + (i > 2 ? dx : 0), 22 + i, 3, 1, i < manga ? (estilo === 'casual' && i === manga - 1 ? camH : c) : (longe ? peleS : pele));
    }
    const PROP_BRACOS = { camera: 'camera', prancheta: 'segura', disco: 'segura', cartas: 'cartas', claquete: 'aceno', desejo: 'aceno', taco: 'taco', varinha: 'aceno',
      rodo: 'taco', pano: 'segura', chave: 'aceno', sacola: 'segura', celular: 'camera', garfo: 'segura', marmita: 'segura' };
    const b = est.bracos || PROP_BRACOS[prop] || 'baixo';
    const antebraco = (x0, y0, x1, y1, longe) => { // segmento de pele (ou manga longa)
      const cor = manga >= 9 ? (longe ? camS : cam) : (longe ? peleS : pele);
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
      for (let i = 0; i <= n; i++) r(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 3, 3, cor);
    };
    const bracoLonge = () => {
      if (b === 'cima') bracoSobe(20, true);
      else if (b === 'aceno') bracoSobe(20, true, est.aceno ? 1 : 0);
      else if (b === 'poder') { bracoDesce(21, true); r(21, 30, 4, 3, peleS); }
      else if (b === 'frente') bracoFrente(20, true);
      else if (b === 'cafe') { r(20, 22, 3, 3, camS); r(17, 24, 4, 2, manga >= 5 ? camS : peleS); }
      else if (b === 'camera') { r(19, 22, 3, 3, camS); antebraco(19, 22, 16, 16, true); }
      else if (b === 'segura' || b === 'cartas') { r(19, 22, 3, 3, camS); antebraco(19, 24, 15, 26, true); }
      else if (b === 'zumbi') { r(18, 22, 3, 3, camS); antebraco(17, 23, 12, 23, true); r(10, 23, 3, 3, peleS); }
      else if (b === 'taco') { r(19, 22, 3, 3, camS); antebraco(19, 24, 17, 28, true); }
      else bracoDesce(20, true);
    };
    const bracoPerto = () => {
      if (b === 'cima') bracoSobe(5, false);
      else if (b === 'poder') { bracoDesce(4, false); r(3, 30, 4, 3, pele); p(4, 31, peleS); }
      else if (b === 'frente') bracoFrente(5, false);
      else if (b === 'camera') { r(5, 22, 3, 3, cam); antebraco(6, 23, 8, 17, false); }
      else if (b === 'segura') { r(5, 22, 3, 4, cam); antebraco(6, 25, 9, 27, false); }
      else if (b === 'cartas') { r(5, 22, 3, 4, cam); antebraco(6, 25, 10, 25, false); }
      else if (b === 'zumbi') { r(5, 22, 3, 3, cam); antebraco(5, 24, 1, 24, false); r(0, 24, 2, 3, pele); }
      else if (b === 'taco') { r(5, 22, 3, 4, cam); antebraco(6, 25, 4, 30, false); }
      else bracoDesce(5, false);
    };

    // ---------------------------------------------------------------- cabelo comprido (atrás do corpo)
    if (!costas) {
      if (ss === 3) { r(18, 8, 5, 30, cab); r(21, 10, 2, 26, cabS); r(5, 9, 3, 16, cab); }
      else if (!ss && ap.cabelo === 'longo') { r(18, 9, 4, 15, cab); r(20, 12, 2, 12, cabS); r(7, 10, 2, 11, cab); }
    }

    // ---------------------------------------------------------------- pernas
    const perna = (x, y, w, h, cor, sombraC) => { // calça, bermuda (joelho para baixo é pele) ou saia/vestido (pernas de fora)
      if (parteBaixo === 'calca') { r(x, y, w, h, cor); return; }
      const cobre = parteBaixo === 'bermuda' ? Math.min(h, 3) : 0;
      r(x, y, w, cobre, cor); r(x, y + cobre, w, h - cobre, sombraC ? peleS : pele);
    };
    const sapato = (x, y, cor, frente) => {
      r(x, y, 5, 2, cor);
      if (calcado === 'tenis') { r(x, y + 2, 5, 1, '#f8f9fa'); p(x + (costas ? 1 : 2), y, '#ffffff'); }
      else if (calcado === 'bota') { r(x, y - 2, 4, 2, cor); r(x, y + 2, 5, 1, sola); }
      else { r(x, y + 2, 5, 1, sola); if (frente) p(x + (costas ? 3 : 0), y, sapH); }
    };
    if (!sentado) {
      const ps = est.passo || 0, a = ps === 1 ? 1 : ps === 2 ? -1 : 0, bb = -a;
      r(9, 31, 10, 2, parteBaixo === 'vestido' ? cam : calca);
      perna(14, 33, 4, 6 + bb - enc, calS, true); if (parteBaixo === 'calca') r(14, 33, 1, 6 + bb - enc, calca);
      const yb = 39 + bb - enc, xb = costas ? 14 : 13;
      sapato(xb, yb, tom(sap, 0.85), false);
      perna(9, 33, 4, 7 + a - enc, calca, false); if (parteBaixo === 'calca') { r(12, 33, 1, 7 + a - enc, calS); p(10, 34, tom(calca, 1.25)); }
      const ya = 40 + a - enc, xa = costas ? 9 : 8;
      sapato(xa, ya, sap, true);
      if (parteBaixo === 'saia') { r(8, 31, 12, 3, calca); r(7, 33, 14, 3, calca); r(7, 35, 14, 1, calS); }
      if (parteBaixo === 'vestido') { r(8, 30, 12, 3, cam); r(7, 32, 14, 4, cam); r(7, 35, 14, 1, camS); }
    } else {
      const cb = parteBaixo === 'vestido' ? cam : calca;
      r(8, 31, 12, 4, cb); r(8, 34, 12, 1, tom(cb, 0.72)); r(16, 31, 4, 4, tom(cb, 0.72));
    }

    // ---------------------------------------------------------------- tronco
    const capa = fant === 'vampiro' ? ['#141414', '#9b1b30'] : fant === 'heroi' ? ['#b0254f', '#d6336c'] : null;
    if (capa && !costas) { r(5, 21, 18, 20, capa[0]); r(6, 22, 16, 18, capa[1]); }
    if (fant === 'astronauta' && !costas) r(20, 21, 3, 9, '#ced4da');
    bracoLonge();
    r(8, 21, 12, 11, cam); r(7, 22, 14, 3, cam);
    r(17, 21, 3, 11, camS); r(19, 22, 2, 3, camS); r(8, 29, 12, 1, camS);
    r(9, 31, 10, 1, '#3a2a1e');
    const est2 = ap.estampa || 'lisa', ce = ap.corEstampa || '#ffffff';
    if (est2 !== 'lisa' && estilo !== 'terno' && !fant) {
      if (est2 === 'listras') for (const y of [23, 26, 29]) r(8, y, 12, 1, ce);
      else if (est2 === 'xadrez') { for (const y of [23, 27]) r(8, y, 12, 1, ce); for (const x of [10, 14, 18]) r(x, 21, 1, 10, ce); }
      else if (!costas && est2 === 'bolinhas') for (const [x, y] of [[9, 23], [13, 25], [17, 23], [10, 28], [16, 29], [12, 30]]) p(x, y, ce);
      else if (!costas && est2 === 'kwik') KM.simboloPixel(g, 12, 24, 0.5, ce);
    }
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
      } else if (estilo === 'camiseta') {
        r(12, 21, 3, 1, pele); p(11, 21, camH); p(15, 21, camH);
        r(15, 24, 3, 3, tom(cam, cam === '#111A19' || hexEscuro(cam) ? 1.6 : 0.8)); p(16, 25, VERDE);
      } else if (estilo === 'regata') {
        r(11, 21, 5, 2, pele); p(12, 23, pele); p(14, 23, pele); r(9, 21, 1, 2, pele); r(17, 21, 1, 2, pele);
      } else if (estilo === 'jaqueta') {
        r(12, 21, 3, 10, '#f1f3f5'); r(11, 21, 1, 9, camD); r(15, 21, 1, 9, camD); p(13, 21, pele);
        r(9, 27, 2, 1, camD); r(16, 27, 2, 1, camD);
      } else if (estilo === 'vestido') {
        r(11, 21, 5, 1, pele); p(12, 22, pele); p(14, 22, pele); r(8, 28, 12, 1, camD); p(13, 28, '#ffd43b');
      }
      if (ap.colar && !fant) { const cc = ap.corColar || '#e2b33c'; p(11, 22, cc); p(12, 23, cc); p(13, 23, cc); p(14, 23, cc); p(15, 22, cc); r(13, 24, 1, 2, ap.corColar ? tom(cc, 1.25) : '#ffffff'); }
      if (ap.cracha !== false) { // cordão com crachá
        p(11, 22, cordao); p(11, 23, cordao); p(12, 24, cordao); p(16, 22, cordao); p(16, 23, cordao); p(15, 24, cordao);
        p(13, 25, '#9aa3a1'); r(12, 26, 3, 4, '#ffffff'); p(13, 27, '#6aa5d8'); r(12, 29, 3, 1, '#c9c9c2');
      }
    }
    if (ap.cachecol && !fant) {
      const cc = ap.corCachecol || '#c9453a';
      r(9, 19, 11, 3, cc); r(9, 21, 11, 1, tom(cc, 0.75));
      if (!costas) { r(15, 22, 3, 6, cc); r(15, 27, 3, 1, tom(cc, 0.7)); p(16, 24, tom(cc, 1.3)); }
    }
    // enfeites da fantasia no tronco
    if (!costas) {
      if (fant === 'pirata') for (const y of [23, 25, 27, 29]) r(8, y, 12, 1, '#c9453a');
      if (fant === 'bear') { for (const y of [24, 28]) r(8, y, 12, 1, '#4a0f17'); for (const x of [10, 14, 18]) r(x, 22, 1, 9, '#4a0f17'); r(9, 20, 10, 1, '#202426'); r(8, 20, 1, 2, '#202426'); r(19, 20, 1, 2, '#202426'); }
      if (fant === 'heroi') { r(12, 24, 4, 4, '#ffd93b'); p(13, 25, '#c9453a'); p(13, 26, '#c9453a'); p(14, 25, '#c9453a'); p(14, 27, '#c9453a'); }
      if (fant === 'astronauta') { r(15, 24, 3, 3, VERDE); p(16, 25, '#ffffff'); r(9, 26, 3, 2, '#c9453a'); }
      if (fant === 'zumbi') { p(10, 25, '#5c5e4f'); p(11, 26, '#5c5e4f'); p(16, 28, '#5c5e4f'); p(17, 27, '#5c5e4f'); r(9, 30, 2, 1, '#5c5e4f'); }
      if (fant === 'mago') { p(10, 26, '#ffd93b'); p(16, 28, '#ffd93b'); p(12, 30, '#ffd93b'); }
      if (fant === 'vampiro') { r(6, 17, 2, 5, '#141414'); r(20, 17, 2, 5, '#141414'); }
    } else {
      if (capa) { r(6, 20, 16, 22, capa[1]); r(13, 21, 1, 20, capa[0]); }
      if (fant === 'astronauta') { r(9, 22, 10, 9, '#ced4da'); r(10, 23, 8, 1, '#adb5bd'); }
    }
    bracoPerto();
    if (ap.relogio && !fant && (b === 'baixo' || b === 'poder')) { r(5, 30, 3, 1, ap.corRelogio || '#212529'); p(6, 30, '#ffffff'); }

    // ---------------------------------------------------------------- cabeça
    r(12, 19 + cy, 4, 2, peleS);
    const Y = n => n + cy;
    if (costas) {
      r(9, Y(9), 11, 11, pele); r(8, Y(10), 13, 9, pele);
      cabeloCostas();
      p(7, Y(13), pele); p(7, Y(14), pele); p(7, Y(15), peleS);
      if (ap.brinco && !fant) p(7, Y(16), ap.corBrinco || '#e2b33c');
      acessoriosCostas();
    } else {
      r(9, Y(9), 11, 11, pele); r(8, Y(10), 13, 9, pele); r(10, Y(20), 8, 1, pele);
      r(18, Y(11), 2, 8, peleS); p(17, Y(19), peleS);
      r(19, Y(13), 2, 4, pele); p(20, Y(14), peleD); p(20, Y(15), peleD);
      if (ap.brinco && !fant) { p(20, Y(17), ap.corBrinco || '#e2b33c'); p(20, Y(18), tom(ap.corBrinco || '#e2b33c', 1.3)); }
      if (ap.barba && !ss) { r(9, Y(17), 10, 3, cab); r(10, Y(20), 8, 1, cab); r(17, Y(13), 2, 4, cab); r(11, Y(17), 4, 1, pele); }
      rosto();
      cabeloFrente();
      acessoriosFrente();
    }

    // enfeites da fantasia na cabeça
    if (fant === 'pirata') {
      r(6, Y(3), 17, 4, '#1b1b1b'); r(4, Y(6), 21, 2, '#1b1b1b'); r(9, Y(2), 11, 1, '#1b1b1b');
      if (!costas) { p(13, Y(4), '#ffffff'); p(14, Y(4), '#ffffff'); p(13, Y(5), '#ffffff'); r(8, Y(13), 13, 1, '#111111'); r(14, Y(14), 3, 2, '#111111'); }
    } else if (fant === 'mago') {
      const ch = '#4c2fa3';
      r(13, Y(-2), 2, 1, ch); r(12, Y(-1), 4, 1, ch); r(11, Y(0), 6, 2, ch); r(10, Y(2), 8, 2, ch); r(9, Y(4), 10, 2, ch); r(5, Y(6), 19, 2, '#3d2896');
      p(13, Y(0), '#ffd93b'); p(11, Y(3), '#ffd93b'); p(16, Y(4), '#ffd93b');
      if (!costas) { r(9, Y(17), 10, 5, '#f1f3f5'); r(10, Y(22), 8, 2, '#f1f3f5'); r(11, Y(24), 6, 1, '#f1f3f5'); r(12, Y(18), 2, 1, '#7a3b2a'); }
    } else if (fant === 'heroi' && !costas) {
      r(8, Y(13), 13, 3, '#111111'); p(10, Y(14), '#ffffff'); p(15, Y(14), '#ffffff');
    } else if (fant === 'vampiro' && !costas) {
      p(12, Y(19), '#ffffff'); p(14, Y(19), '#ffffff'); r(13, Y(8), 1, 2, tom(cab, 1.3));
    } else if (fant === 'zumbi' && !costas) {
      p(9, Y(16), '#6f8c5e'); p(16, Y(16), '#6f8c5e');
    }
    if (fant === 'astronauta') { // capacete de vidro
      g.fillStyle = 'rgba(170,225,255,0.28)';
      for (let yy = -9; yy <= 9; yy++) for (let xx = -10; xx <= 10; xx++) { if (xx * xx / 100 + yy * yy / 81 <= 1) g.fillRect(14 + xx, Y(14) + yy, 1, 1); }
      for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2; p(Math.round(14 + Math.cos(a) * 10), Math.round(Y(14) + Math.sin(a) * 9), '#dee2e6'); }
      if (!costas) { p(9, Y(8), '#ffffff'); p(10, Y(7), '#ffffff'); }
      r(8, Y(22), 12, 2, '#ced4da');
    }

    // objetos nas mãos
    if (!costas) desenharProp();

    // caneca na mão (café) por cima de tudo
    if (b === 'cafe' && !costas) {
      r(15, 21, 2, 2, peleS);
      r(12, 18, 3, 4, '#ffffff'); r(12, 18, 3, 1, '#6b3a1e'); p(15, 19, '#ffffff'); p(15, 20, '#ffffff'); p(13, 20, VERDE);
    }
    g.translate(0, -((est.dy || 0) + enc));

    // ---------------------------------------------------------------- partes
    function desenharProp() {
      if (prop === 'camera') {
        r(8, Y(14), 9, 6, '#26292c'); r(9, Y(13), 3, 1, '#26292c'); r(10, Y(15), 4, 4, '#4a5560'); p(11, Y(16), '#9fe8ff'); p(12, Y(17), '#6c7a86');
        r(15, Y(13), 2, 1, est.flash ? '#ffffff' : '#c9c9c2');
        if (est.flash) { for (const [x, y] of [[16, 10], [18, 11], [19, 13], [18, 15], [14, 10]]) p(x, Y(y), '#fff9c4'); r(15, Y(12), 3, 3, '#ffffff'); }
        r(16, Y(16), 3, 3, peleS); r(7, Y(17), 3, 3, pele);
      } else if (prop === 'prancheta') {
        r(9, 22, 8, 10, '#8d5a3b'); r(10, 24, 6, 7, '#ffffff'); r(11, 22, 4, 2, '#adb5bd');
        for (const y of [25, 27, 29]) { r(12, y, 3, 1, '#9aa3a1'); p(11, y, y === 25 ? VERDE : '#c9c9c2'); }
        r(8, 26, 2, 3, pele); r(16, 25, 2, 3, peleS);
      } else if (prop === 'disco') {
        r(9, 22, 9, 9, '#141414'); r(10, 21, 7, 11, '#141414'); r(12, 25, 3, 3, '#c9453a'); p(13, 26, '#ffffff'); p(10, 23, '#555555'); p(16, 29, '#555555');
        r(8, 26, 2, 3, pele); r(17, 25, 2, 3, peleS);
      } else if (prop === 'cartas') {
        ['#e03131', '#f59f00', '#2f9e44', '#1971c2'].forEach((c, i) => { r(10 + i * 2, 20 - (i % 2), 3, 5, '#ffffff'); r(11 + i * 2, 21 - (i % 2), 1, 3, c); });
        r(10, 25, 6, 2, pele);
      } else if (prop === 'claquete') {
        r(20, 7, 7, 5, '#141414'); for (let x = 20; x < 27; x += 2) p(x, 7, '#ffffff'); r(21, 9, 5, 1, '#ffffff');
      } else if (prop === 'desejo') {
        r(21, 5, 1, 7, '#6b4a2a'); p(20, 6, '#6b4a2a'); p(22, 7, '#6b4a2a');
        for (const [x, y] of [[19, 4], [22, 4], [23, 6], [20, 8], [24, 8]]) p(x, y, '#b07cff');
        p(21, 3, '#ffffff'); p(23, 3, '#e2c6ff');
      } else if (prop === 'varinha') {
        r(21, 5, 1, 7, '#6b4a2a'); p(21, 4, '#ffd93b'); p(20, 3, '#fff3a0'); p(22, 3, '#fff3a0');
      } else if (prop === 'taco') {
        for (let i = 0; i < 26; i++) p(2 + i, 34 - Math.round(i * 0.7), i > 22 ? '#ffffff' : i > 18 ? '#e9d5b7' : '#7a4a2e');
      } else if (prop === 'rodo') { // esfregão: cabo na diagonal, cabeça no chão (est.esfrega mexe para os lados)
        const dx = est.esfrega ? 2 : 0;
        for (let i = 0; i < 28; i++) p(Math.round(21 - i * 0.62 + (i > 18 ? dx * (i - 18) / 10 : 0)), 13 + i, '#9c6b43');
        r(1 + dx, 40, 9, 2, '#dee2e6'); for (let x = 1 + dx; x < 10 + dx; x += 2) p(x, 42, '#adb5bd');
      } else if (prop === 'pano') { // borrifador numa mão, paninho amarelo na outra
        r(14, 19, 4, 7, '#4dabf7'); r(15, 17, 2, 2, '#1c7ed6'); p(18, 17, '#1c7ed6'); p(15, 21, '#a5d8ff');
        r(6 + (est.esfrega ? 1 : 0), 26, 5, 3, '#ffd43b'); p(7 + (est.esfrega ? 1 : 0), 26, '#fff3a0');
      } else if (prop === 'chave') {
        r(21, 5, 2, 7, '#adb5bd'); r(20, 4, 4, 2, '#ced4da'); p(21, 4, '#868e96'); r(21, 11, 2, 2, '#e8590c');
      } else if (prop === 'sacola') { // bag de entrega
        r(7, 21, 12, 10, '#c92a2a'); r(8, 22, 10, 8, '#e03131'); r(8, 22, 10, 2, '#ff6b6b'); r(11, 25, 4, 3, '#ffffff'); p(12, 26, '#e03131');
        r(6, 25, 2, 3, pele); r(18, 24, 2, 3, peleS);
      } else if (prop === 'marmita') {
        r(8, 23, 10, 6, '#f1f3f5'); r(8, 23, 10, 2, '#ced4da'); r(10, 25, 6, 3, '#e8590c'); r(11, 25, 2, 1, '#ffa94d');
        r(7, 26, 2, 3, pele); r(17, 25, 2, 3, peleS);
      } else if (prop === 'celular') {
        r(9, Y(14), 6, 8, '#212529'); r(10, Y(15), 4, 6, '#ff6b6b'); r(10, Y(17), 4, 1, '#ffffff'); p(11, Y(19), '#ffffff');
        r(15, Y(17), 3, 3, peleS); r(7, Y(18), 3, 3, pele);
      } else if (prop === 'garfo') {
        const sobe = est.mastiga ? 6 : 0;
        r(10, 25 - sobe, 1, 5, '#ced4da'); r(9, 24 - sobe, 3, 1, '#ced4da'); p(9, 23 - sobe, '#ced4da'); p(11, 23 - sobe, '#ced4da');
        if (est.mastiga) p(10, 22 - sobe, '#e8590c');
      }
    }

    function rosto() {
      const olho = ss === 'deus' ? '#d81b3c' : ss === 'branco' ? '#9fb4d6' : ss ? '#13a89e' : '#2a1d16';
      const esc = '#2a1d16';
      if (ss) { p(9, Y(12), cabS); p(10, Y(13), cabS); p(16, Y(12), cabS); p(15, Y(13), cabS); }
      else if (ap.sobrancelha === 'grossa') { r(9, Y(11), 3, 2, cabS); r(14, Y(11), 3, 2, cabS); }
      else if (ap.sobrancelha === 'fina') { r(9, Y(12), 2, 1, tom(cab, 0.9)); r(14, Y(12), 2, 1, tom(cab, 0.9)); }
      else if (ap.sobrancelha === 'brava') { p(9, Y(11), cabS); r(10, Y(12), 2, 1, cabS); r(14, Y(12), 2, 1, cabS); p(16, Y(11), cabS); }
      else if (ap.sobrancelha === 'surpresa') { r(9, Y(10), 3, 1, cabS); r(14, Y(10), 3, 1, cabS); }
      else { r(9, Y(12), 2, 1, cabS); r(14, Y(12), 3, 1, cabS); }
      const olhosAp = est.olhos || (est.piscar ? undefined : { grandes: 'grandes', sonolentos: 'sonolentos', felizes: 'feliz', piscadinha: 'piscadinha' }[ap.olhos]);
      if (olhosAp === 'fechados' || est.piscar) { r(9, Y(15), 2, 1, peleD); r(15, Y(15), 2, 1, peleD); }
      else if (olhosAp === 'grandes') { r(10, Y(13), 2, 3, olho); r(15, Y(13), 2, 3, olho); p(10, Y(13), '#ffffff'); p(15, Y(13), '#ffffff'); }
      else if (olhosAp === 'sonolentos') { r(9, Y(14), 3, 1, peleD); r(14, Y(14), 3, 1, peleD); p(10, Y(15), olho); p(15, Y(15), olho); }
      else if (olhosAp === 'piscadinha') { r(10, Y(14), 1, 2, olho); p(9, Y(15), peleS); p(14, Y(15), esc); p(15, Y(14), esc); p(16, Y(15), esc); }
      else if (est.olhos === 'vermelhos') { r(10, Y(14), 1, 2, '#ff2a2a'); r(15, Y(14), 1, 2, '#ff2a2a'); p(10, Y(14), '#ffd0d0'); p(15, Y(14), '#ffd0d0'); p(9, Y(13), '#ff6b6b'); p(16, Y(13), '#ff6b6b'); }
      else if (olhosAp === 'feliz') { p(9, Y(15), esc); p(10, Y(14), esc); p(11, Y(15), esc); p(14, Y(15), esc); p(15, Y(14), esc); p(16, Y(15), esc); }
      else {
        r(10, Y(14), 1, 2, olho); r(15, Y(14), 1, 2, olho);
        if (ss) { p(10, Y(14), '#ffffff'); p(15, Y(14), '#ffffff'); }
        else { p(9, Y(15), peleS); p(14, Y(15), peleS); }
      }
      p(12, Y(16), peleD);
      const boca = est.boca || { sorriso: 'sorriso', serio: 'serio', aberta: 'o', lingua: 'lingua' }[ap.boca] || 'normal';
      if (boca === 'sorriso') { p(11, Y(17), '#7a3b2a'); r(12, Y(18), 2, 1, '#7a3b2a'); p(14, Y(17), '#7a3b2a'); }
      else if (boca === 'grito') { r(11, Y(17), 4, 2, '#5a1a1a'); r(12, Y(18), 2, 1, '#d84a4a'); }
      else if (boca === 'o') r(12, Y(17), 2, 2, '#5a1a1a');
      else if (boca === 'sorrisao') { r(10, Y(17), 6, 2, '#3a0a0a'); r(11, Y(17), 4, 1, '#ffffff'); p(9, Y(16), '#3a0a0a'); p(16, Y(16), '#3a0a0a'); }
      else if (boca === 'serio') r(11, Y(18), 4, 1, peleD);
      else if (boca === 'lingua') { p(11, Y(17), '#7a3b2a'); r(12, Y(18), 2, 1, '#7a3b2a'); p(14, Y(17), '#7a3b2a'); p(13, Y(19), '#ff6b9a'); }
      else r(12, Y(18), 2, 1, peleD);
      if (boca === 'sorriso' || olhosAp === 'feliz' || ap.bochechas) { p(9, Y(17), '#f0a08a'); p(16, Y(17), '#f0a08a'); if (ap.bochechas) { p(10, Y(17), '#f4b4a0'); p(15, Y(17), '#f4b4a0'); } }
      if (ap.sardas) { const sd = tom(pele, 0.72); p(9, Y(16), sd); p(11, Y(16), sd); p(10, Y(17), sd); p(15, Y(16), sd); p(17, Y(16), sd); p(16, Y(17), sd); }
      if (ap.pinta) p(15, Y(18), '#5a3a2a');
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
        case 'franja': curto(); c(7, 10, 2, 9); c(9, 10, 9, 2); c(9, 12, 2, 1); c(13, 12, 2, 1); c(16, 12, 2, 1); c(10, 10, 6, 1, cabH); break;
        case 'tranca': curto(); c(19, 12, 3, 3); for (let k = 0; k < 4; k++) { c(19 + (k % 2), 15 + k * 3, 3, 3); c(20, 15 + k * 3, 1, 1, cabS); } c(20, 27, 2, 1, '#ff6b9a'); break;
        case 'topete': curto(); c(9, 1, 9, 4); c(10, 0, 6, 1); c(11, 1, 5, 1, cabH); c(10, 3, 7, 1, cabH); break;
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
        case 'franja': base(); c(7, 10, 15, 17); c(11, 12, 1, 14, cabS); c(16, 12, 1, 14, cabS); break;
        case 'tranca': base(); for (let k = 0; k < 5; k++) { c(13 + (k % 2), 18 + k * 3, 3, 3); c(14, 18 + k * 3, 1, 1, cabS); } c(13, 33, 3, 1, '#ff6b9a'); break;
        case 'topete': base(); c(9, 2, 9, 4); c(11, 2, 5, 1, cabH); break;
        default: base();
      }
    }

    function acessoriosFrente() {
      if (ap.oculos) {
        const mod = ap.oculos === true ? 'quadrado' : ap.oculos, f = mod === 'escuro' ? '#1b1b1b' : ap.corOculos || '#1b1b1b';
        if (mod === 'escuro') {
          r(9, Y(13), 3, 3, f); r(14, Y(13), 3, 3, f); r(12, Y(13), 2, 1, f); r(17, Y(14), 2, 1, f); p(9, Y(13), '#6c757d'); p(14, Y(13), '#6c757d');
        } else if (mod === 'redondo') {
          const cor = ap.corOculos || '#8a5a2b';
          for (const x of [9, 14]) { p(x + 1, Y(13), cor); p(x + 1, Y(16), cor); r(x, Y(14), 1, 2, cor); r(x + 2, Y(14), 1, 2, cor); }
          r(12, Y(14), 2, 1, cor); r(17, Y(14), 2, 1, cor);
        } else {
          r(9, Y(13), 3, 1, f); r(9, Y(16), 3, 1, f); r(9, Y(14), 1, 2, f); r(11, Y(14), 1, 2, f);
          r(14, Y(13), 3, 1, f); r(14, Y(16), 3, 1, f); r(14, Y(14), 1, 2, f); r(16, Y(14), 1, 2, f);
          r(12, Y(14), 2, 1, f); r(17, Y(14), 2, 1, f);
        }
        if (est.brilhoOculos) { p(10, Y(14), '#ffffff'); p(15, Y(14), '#ffffff'); }
      }
      if (ss) return;
      const cb = ap.corBone || VERDE;
      if (chapeu === 'bone') {
        r(8, Y(4), 13, 5, cb); r(9, Y(3), 11, 1, cb); r(17, Y(4), 4, 5, tom(cb, 0.82));
        r(4, Y(9), 10, 1, tom(cb, 0.65)); r(5, Y(8), 7, 1, tom(cb, 0.85)); p(13, Y(5), '#ffffff'); p(14, Y(6), '#ffffff');
      } else if (chapeu === 'gorro') {
        r(8, Y(3), 13, 6, cb); r(9, Y(2), 11, 1, cb); r(8, Y(8), 13, 2, tom(cb, 0.75)); for (let x = 9; x < 21; x += 2) p(x, Y(8), tom(cb, 0.6));
        r(13, Y(0), 3, 2, '#f8f9fa'); r(10, Y(4), 3, 1, tom(cb, 1.25));
      } else if (chapeu === 'chapeu') {
        r(9, Y(2), 11, 5, cb); r(10, Y(1), 9, 1, cb); r(9, Y(5), 11, 1, '#1b1b1b'); r(5, Y(7), 19, 2, tom(cb, 0.72)); r(11, Y(2), 3, 1, tom(cb, 1.25));
      } else if (chapeu === 'tiara') {
        r(8, Y(6), 13, 1, cb); r(9, Y(5), 11, 1, cb); p(10, Y(5), tom(cb, 1.4)); r(14, Y(3), 3, 2, '#ff6b9a'); p(15, Y(3), '#ffd43b');
      }
      if (ap.fone) {
        const f = '#202426';
        r(8, Y(4), 13, 1, f); r(7, Y(5), 1, 7, f); r(21, Y(5), 1, 7, f);
        const cf = ap.corFone || VERDE; r(6, Y(12), 2, 4, cf); r(20, Y(12), 2, 4, cf); p(6, Y(12), tom(cf, 1.3));
      }
    }
    function acessoriosCostas() {
      if (ss) return;
      const cb = ap.corBone || VERDE;
      if (chapeu === 'bone') { r(8, Y(4), 13, 6, cb); r(9, Y(3), 11, 1, cb); r(12, Y(9), 5, 1, tom(cb, 0.7)); }
      else if (chapeu === 'gorro') { r(8, Y(3), 13, 7, cb); r(9, Y(2), 11, 1, cb); r(8, Y(8), 13, 2, tom(cb, 0.75)); r(13, Y(0), 3, 2, '#f8f9fa'); }
      else if (chapeu === 'chapeu') { r(9, Y(2), 11, 5, cb); r(9, Y(5), 11, 1, '#1b1b1b'); r(5, Y(7), 19, 2, tom(cb, 0.72)); }
      else if (chapeu === 'tiara') { r(8, Y(6), 13, 1, cb); r(9, Y(5), 11, 1, cb); }
      if (ap.fone) { const f = '#202426'; r(8, Y(4), 13, 1, f); r(7, Y(5), 1, 7, f); r(21, Y(5), 1, 7, f); r(6, Y(12), 2, 4, ap.corFone || VERDE); r(21, Y(12), 2, 4, ap.corFone || VERDE); }
    }
  };
})();
