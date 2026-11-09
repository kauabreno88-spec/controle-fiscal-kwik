/* KWIK Mini Escritório · decoração do prédio conforme a data.
   Ano Novo, Carnaval, Páscoa, Dia da Mulher, Dia das Mães, São João (arraial, forte em São Luís), Dia dos Pais,
   Independência, Dia do Contador, Outubro Rosa, Halloween, Novembro Azul, Black Friday e Natal.
   Em ⚙️ Configurações → Comemorações dá para escolher uma decoração na mão (ou desligar).
   Desenha na visão de cima (no fundo em cache, sem custo por quadro) e no 3D (objetos montados uma vez). */
(function () {
  const KM = window.KM;
  const d0 = (a, m, d) => new Date(a, m - 1, d);
  function pascoa(a) { // algoritmo de Meeus
    const b = a % 19, c = Math.floor(a / 100), d = a % 100, e = Math.floor(c / 4), f = c % 4, g = Math.floor((c + 8) / 25), h = Math.floor((c - g + 1) / 3);
    const i = (19 * b + c - e - h + 15) % 30, k = Math.floor(d / 4), l = d % 4, m = (32 + 2 * f + 2 * k - i - l) % 7, n = Math.floor((b + 11 * i + 22 * m) / 451);
    const mes = Math.floor((i + m - 7 * n + 114) / 31), dia = ((i + m - 7 * n + 114) % 31) + 1;
    return d0(a, mes, dia);
  }
  const mais = (dt, n) => { const x = new Date(dt); x.setDate(x.getDate() + n); return x; };
  const domingo = (a, m, n) => { const x = d0(a, m, 1); x.setDate(1 + ((7 - x.getDay()) % 7) + 7 * (n - 1)); return x; };
  const FESTAS = {
    anonovo: { nome: 'Ano Novo', ic: '🥂', cores: ['#e2b33c', '#f8f9fa', '#adb5bd', '#ffd43b'], faixa: 'FELIZ ANO NOVO', item: 'baloes' },
    carnaval: { nome: 'Carnaval', ic: '🎭', cores: ['#e64980', '#fab005', '#12b886', '#7048e8', '#1c7ed6'], faixa: 'CARNAVAL KWIK', item: 'baloes' },
    pascoa: { nome: 'Páscoa', ic: '🐰', cores: ['#fcc2d7', '#d0bfff', '#ffec99', '#b2f2bb'], faixa: 'FELIZ PASCOA', item: 'ovos' },
    mulheres: { nome: 'Dia da Mulher', ic: '🌷', cores: ['#e64980', '#f783ac', '#ffffff', '#cc5de8'], faixa: 'DIA DA MULHER', item: 'flores' },
    maes: { nome: 'Dia das Mães', ic: '💐', cores: ['#f783ac', '#ff8fab', '#ffffff', '#e64980'], faixa: 'FELIZ DIA DAS MAES', item: 'coracoes' },
    junina: { nome: 'São João', ic: '🌽', cores: ['#e03131', '#fab005', '#1c7ed6', '#2f9e44', '#f76707'], faixa: 'ARRAIA DA KWIK', item: 'fogueira' },
    pais: { nome: 'Dia dos Pais', ic: '👔', cores: ['#1c7ed6', '#343a40', '#74c0fc', '#ffffff'], faixa: 'FELIZ DIA DOS PAIS', item: 'baloes' },
    independencia: { nome: 'Independência', ic: '🇧🇷', cores: ['#2f9e44', '#fab005', '#1c7ed6', '#ffffff'], faixa: '7 DE SETEMBRO', item: 'baloes' },
    contador: { nome: 'Dia do Contador', ic: '🧮', cores: ['#28BE52', '#111A19', '#ffffff', '#e2b33c'], faixa: 'FELIZ DIA DO CONTADOR', item: 'baloes' },
    outubrorosa: { nome: 'Outubro Rosa', ic: '🎀', cores: ['#f783ac', '#e64980', '#ffffff', '#fcc2d7'], faixa: 'OUTUBRO ROSA', item: 'lacos' },
    halloween: { nome: 'Halloween', ic: '🎃', cores: ['#f76707', '#7048e8', '#212529', '#fab005'], faixa: 'HALLOWEEN', item: 'aboboras' },
    novembroazul: { nome: 'Novembro Azul', ic: '💙', cores: ['#1c7ed6', '#74c0fc', '#ffffff', '#1864ab'], faixa: 'NOVEMBRO AZUL', item: 'lacos' },
    blackfriday: { nome: 'Black Friday', ic: '🏷️', cores: ['#111111', '#fab005', '#ffffff', '#212529'], faixa: 'BLACK FRIDAY', item: 'etiquetas' },
    natal: { nome: 'Natal', ic: '🎄', cores: ['#c92a2a', '#2f9e44', '#fab005', '#ffffff'], faixa: 'FELIZ NATAL', item: 'presentes', arvore: true, luzes: true },
  };
  // períodos (o primeiro que combinar vale)
  function periodos(a) {
    const p = pascoa(a);
    return [
      ['anonovo', d0(a - 1, 12, 26), d0(a, 1, 6)], ['anonovo', d0(a, 12, 26), d0(a + 1, 1, 6)],
      ['carnaval', mais(p, -52), mais(p, -46)], ['pascoa', mais(p, -6), mais(p, 1)], ['mulheres', d0(a, 3, 7), d0(a, 3, 9)],
      ['maes', mais(domingo(a, 5, 2), -5), mais(domingo(a, 5, 2), 1)], ['junina', d0(a, 6, 1), d0(a, 7, 6)],
      ['pais', mais(domingo(a, 8, 2), -5), mais(domingo(a, 8, 2), 1)], ['contador', d0(a, 9, 20), d0(a, 9, 23)], ['independencia', d0(a, 9, 1), d0(a, 9, 8)],
      ['outubrorosa', d0(a, 10, 1), d0(a, 10, 24)], ['halloween', d0(a, 10, 25), d0(a, 11, 2)], ['novembroazul', d0(a, 11, 3), d0(a, 11, 19)],
      ['blackfriday', d0(a, 11, 20), d0(a, 11, 30)], ['natal', d0(a, 12, 1), d0(a, 12, 25)],
    ];
  }
  function daData(dt = new Date()) {
    const h = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    for (const [id, a, b] of periodos(dt.getFullYear())) if (h >= a && h <= b) return id;
    return null;
  }
  function atual(cfg) {
    const o = ((cfg || (KM.config && KM.config()) || {}).opcoes || {}).decoracao || 'auto';
    if (o === 'nenhuma') return null;
    const id = o === 'auto' ? daData() : o;
    return id && FESTAS[id] ? { id, ...FESTAS[id] } : null;
  }

  // ------------------------------------------------------------------ lugares livres (canto de cada sala, longe da porta)
  function livre(L, sala, w, d) {
    const s = L.salas[sala]; if (!s) return null;
    const H = s.h - 20, ocup = (x, y) => L.moveis.some(m => m.sala === sala && m.tipo !== 'tapete' && x < m.X + m.w + 2 && x + w > m.X - 2 && y < m.Y + m.d + 2 && y + d > m.Y - 2);
    const cand = [];
    for (let ry = H - d - 6; ry > 30; ry -= 6) for (const rx of [s.w - w - 6, s.w - w - 24, 40, 60, s.w / 2]) cand.push([s.fx + rx, s.fy + ry]);
    for (const [x, y] of cand) if (!ocup(x, y)) return [x, y];
    return null;
  }
  const r = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

  // ------------------------------------------------------------------ visão de cima (desenhado uma vez no fundo)
  function desenhar2D(g, L, cfg) {
    const f = atual(cfg); if (!f) return;
    const C = f.cores;
    // bandeirinhas / guirlanda na parede do fundo de cada sala
    for (const s of Object.values(L.salas)) {
      const y = s.y + 5;
      r(g, s.x, y, s.w, 1, f.id === 'natal' ? '#2b8a3e' : 'rgba(0,0,0,.35)');
      for (let x = s.x + 3, i = 0; x < s.x + s.w - 4; x += 7, i++) {
        if (f.id === 'natal') { r(g, x, y - 1, 6, 3, '#2f9e44'); r(g, x + 2, y + 2, 2, 2, C[i % 3 === 0 ? 0 : i % 3 === 1 ? 2 : 3]); continue; }
        const c = C[i % C.length]; r(g, x, y + 1, 5, 2, c); r(g, x + 1, y + 3, 3, 1, c); r(g, x + 2, y + 4, 1, 1, c);
      }
      // emblema da campanha no meio da parede
      if (f.item === 'lacos') { const cx = s.x + s.w / 2; r(g, cx - 2, y + 6, 2, 2, C[0]); r(g, cx + 1, y + 6, 2, 2, C[0]); r(g, cx - 1, y + 8, 2, 3, C[0]); r(g, cx - 2, y + 10, 1, 2, C[0]); r(g, cx + 1, y + 10, 1, 2, C[0]); }
    }
    // faixa no primeiro corredor (perto da entrada) e na frente da Apresentação
    const c0 = L.corredores[0];
    const faixa = (corr, linha) => { // entre o banco da 1ª sala e o da 2ª (espaço livre do corredor)
      const ss = Object.values(L.salas).filter(s => s.linha === linha).sort((a, b) => a.col - b.col); if (ss.length < 2) return;
      const w = KM.larguraTexto(f.faixa) + 10, x = Math.round((ss[0].fx + 124 + ss[1].fx + 64) / 2 - w / 2), y = corr.y + 3;
      r(g, x - 1, y - 1, w + 2, 11, '#1c1612'); r(g, x, y, w, 9, f.id === 'blackfriday' ? '#111111' : C[0]);
      KM.texto(g, f.faixa, x + 5, y + 2, f.id === 'blackfriday' ? '#fab005' : (f.id === 'outubrorosa' || f.id === 'maes' || f.id === 'pascoa' ? '#3b0a24' : '#ffffff'));
      for (let k = 0; k < w; k += 6) r(g, x + k, y + 9, 3, 2, C[(k / 6 + 1) % C.length]);
    };
    faixa(c0, 0);
    const ap = L.salas.apresentacao; if (ap && ap.corrCima && ap.corrCima !== c0) faixa(ap.corrCima, ap.linha - 1);
    // itens no chão (um por sala, num canto livre)
    const it = f.item;
    for (const s of Object.values(L.salas)) {
      const p = livre(L, s.id, 12, 10); if (!p) continue;
      const [x, y] = p;
      if (it === 'baloes' || it === 'coracoes') for (let k = 0; k < 3; k++) { const bx = x + k * 4, by = y - 14 - (k % 2) * 4, c = C[k % C.length]; r(g, bx + 1, by + 6, 1, 10 - (k % 2) * 2, '#868e96'); r(g, bx, by, 4, 5, c); r(g, bx + 1, by - 1, 2, 1, c); r(g, bx + 1, by + 1, 1, 1, 'rgba(255,255,255,.6)'); }
      else if (it === 'aboboras') { r(g, x, y + 3, 10, 6, '#f76707'); r(g, x + 1, y + 2, 8, 1, '#ff922b'); r(g, x + 4, y, 2, 3, '#2b8a3e'); r(g, x + 2, y + 5, 2, 1, '#212529'); r(g, x + 6, y + 5, 2, 1, '#212529'); r(g, x + 3, y + 7, 4, 1, '#212529'); }
      else if (it === 'presentes') { r(g, x, y + 2, 7, 6, C[0]); r(g, x + 3, y + 2, 1, 6, C[2]); r(g, x, y + 4, 7, 1, C[2]); r(g, x + 6, y + 4, 6, 5, C[1]); r(g, x + 8, y + 4, 1, 5, C[3]); }
      else if (it === 'ovos') for (let k = 0; k < 3; k++) { r(g, x + k * 4, y + 3, 3, 4, C[k]); r(g, x + k * 4, y + 5, 3, 1, '#ffffff'); }
      else if (it === 'flores') { r(g, x + 2, y + 4, 6, 5, '#f1f3f5'); for (let k = 0; k < 3; k++) r(g, x + 1 + k * 3, y + 1, 3, 3, C[k % C.length]); }
      else if (it === 'fogueira' && s.id === 'refeitorio') { r(g, x, y + 6, 12, 3, '#6b3f22'); r(g, x + 2, y + 3, 8, 3, '#f76707'); r(g, x + 4, y, 4, 3, '#fab005'); r(g, x + 5, y - 2, 2, 2, '#ffe066'); }
      else if (it === 'fogueira') { r(g, x + 2, y, 8, 8, '#fab005'); r(g, x + 3, y + 1, 6, 6, '#f8f0d0'); r(g, x + 5, y + 2, 2, 2, '#e03131'); } // bandeja de comidas típicas
      else if (it === 'etiquetas') { r(g, x, y + 1, 12, 7, '#111111'); KM.texto(g, '%', x + 1, y + 2, '#fab005'); r(g, x + 5, y + 3, 6, 1, '#fab005'); r(g, x + 5, y + 5, 4, 1, '#ffffff'); }
      else if (it === 'lacos') { r(g, x + 2, y, 3, 3, C[0]); r(g, x + 6, y, 3, 3, C[0]); r(g, x + 4, y + 3, 3, 4, C[0]); r(g, x + 3, y + 7, 2, 3, C[0]); r(g, x + 6, y + 7, 2, 3, C[0]); }
    }
    // árvore de Natal na Recepção, com presentes
    if (f.arvore) {
      const p = livre(L, 'recepcao', 22, 14) || livre(L, 'diretoria', 22, 14);
      if (p) {
        const [x, y] = p, cx = x + 11;
        for (let k = 0; k < 4; k++) { const w = 20 - k * 5, yy = y + 6 - k * 6; r(g, cx - w / 2, yy, w, 6, k % 2 ? '#2f9e44' : '#2b8a3e'); }
        r(g, cx - 2, y + 12, 4, 3, '#6b3f22');
        [[-6, 8, '#c92a2a'], [4, 7, '#fab005'], [-2, 2, '#4dabf7'], [3, -3, '#c92a2a'], [-3, -8, '#fab005']].forEach(([dx, dy, c]) => r(g, cx + dx, y + dy, 2, 2, c));
        r(g, cx - 1, y - 16, 3, 3, '#ffd43b');
        r(g, x - 2, y + 11, 6, 5, '#c92a2a'); r(g, x + 18, y + 11, 6, 5, '#1c7ed6');
      }
    }
  }

  // ------------------------------------------------------------------ 3D (montado junto com o prédio)
  let bulbos = [];
  function montar3D(api) {
    bulbos = [];
    const f = atual(); if (!f) return;
    const { THREE, mundo, caixa, cil, bola, brilhante, mat, L, HN } = api, C = f.cores;
    const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-2.6, 0, 0, 2.6, 0, 0, 0, -5, 0], 3)); tri.computeVertexNormals();
    for (const s of Object.values(L.salas)) {
      const z = s.fy + 0.9, y = HN - 7, x0 = s.x + 4, x1 = s.x + s.w - 4;
      if (f.id === 'natal') { caixa(x0, y - 1.5, z - 0.5, x1 - x0, 3, 1.6, '#2b8a3e', false); }
      else caixa(x0, y, z - 0.2, x1 - x0, 0.4, 0.4, '#495057', false);
      let i = 0;
      for (let x = x0 + 3; x < x1 - 2; x += 7, i++) {
        if (f.id === 'natal') { const b = new THREE.Mesh(api.geoBola || (api.geoBola = new THREE.SphereGeometry(1.1, 8, 6)), new THREE.MeshStandardMaterial({ color: C[i % 3 === 0 ? 0 : i % 3 === 1 ? 2 : 3], emissive: C[i % 3 === 0 ? 0 : i % 3 === 1 ? 2 : 3], emissiveIntensity: 1 })); b.position.set(x, y - 2.4, z + 0.8); mundo.add(b); bulbos.push(b); continue; }
        const m = new THREE.Mesh(tri, new THREE.MeshStandardMaterial({ color: C[i % C.length], side: THREE.DoubleSide, roughness: 0.8 }));
        m.position.set(x, y, z + 0.3); mundo.add(m);
      }
      if (f.item === 'lacos') { const t = new THREE.Mesh(new THREE.TorusGeometry(3, 1, 8, 20), brilhante(C[0], 0.2)); t.scale.set(1, 1.3, 0.4); t.position.set(s.x + s.w / 2, HN - 18, s.fy + 1.2); mundo.add(t); }
      const p = livre(L, s.id, 12, 10); if (!p) continue;
      const [x, zz] = [p[0] + 6, p[1] + 5];
      if (f.item === 'baloes' || f.item === 'coracoes') for (let k = 0; k < 3; k++) { const h = 30 + k * 5; cil(x + k * 3 - 3, 0, zz, 0.15, h, '#adb5bd'); bola(x + k * 3 - 3, h + 3.5, zz, 3.4, mat(C[k % C.length], { roughness: 0.25, metalness: 0.1 })); }
      else if (f.item === 'aboboras') { const a = bola(x, 3.6, zz, 4.6, brilhante('#f76707', 0.25)); a.scale.y = 0.75; cil(x, 6.4, zz, 0.6, 2.4, '#2b8a3e'); }
      else if (f.item === 'presentes') { caixa(x - 5, 0, zz - 3, 6, 6, 6, C[0]); caixa(x - 2.4, 0, zz - 3.1, 0.8, 6.2, 6.2, C[2]); caixa(x + 2, 0, zz - 2, 5, 4, 5, C[1]); }
      else if (f.item === 'ovos') for (let k = 0; k < 3; k++) { const o = bola(x + k * 4 - 4, 2.6, zz, 2.2, C[k]); o.scale.y = 1.3; }
      else if (f.item === 'flores') { cil(x, 0, zz, 2.4, 8, '#f1f3f5', 1.8); for (let k = 0; k < 3; k++) bola(x + k * 2 - 2, 11 + (k % 2), zz, 1.8, C[k % C.length]); }
      else if (f.item === 'fogueira') { for (let k = 0; k < 4; k++) { const l = caixa(x - 5, 0.6, zz - 0.6, 10, 1.2, 1.2, '#6b3f22'); l.rotation.y = k * Math.PI / 4; } const fogo = new THREE.Mesh(new THREE.ConeGeometry(3.4, 9, 8), brilhante('#ff922b', 1.4)); fogo.position.set(x, 5, zz); mundo.add(fogo); bulbos.push(fogo); }
      else if (f.item === 'etiquetas') { caixa(x - 5, 0, zz - 2, 10, 12, 1, '#111111'); caixa(x - 3.5, 7, zz - 2.2, 7, 2, 0.4, brilhante('#fab005', 0.6)); }
      else if (f.item === 'lacos') { const t = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.9, 8, 18), mat(C[0])); t.scale.set(1, 1.3, 0.5); t.position.set(x, 6, zz); mundo.add(t); }
    }
    if (f.arvore) {
      const p = livre(L, 'recepcao', 22, 14) || livre(L, 'diretoria', 22, 14);
      if (p) {
        const x = p[0] + 11, z = p[1] + 7;
        cil(x, 0, z, 2, 6, '#6b3f22');
        [[6, 13, 16], [16, 10.5, 14], [25, 8, 12], [33, 5.5, 10]].forEach(([y, rr, h]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(rr, h, 10), mat('#2b8a3e', { roughness: 0.7 })); c.position.set(x, y + h / 2, z); c.castShadow = true; mundo.add(c); });
        for (let k = 0; k < 16; k++) { const a = k * 2.4, y = 9 + (k % 8) * 3.6, rr = 12 - (k % 8) * 1.3, c = ['#c92a2a', '#fab005', '#4dabf7', '#ffffff'][k % 4]; const b = bola(x + Math.cos(a) * rr, y, z + Math.sin(a) * rr, 1.1, brilhante(c, 0.8)); bulbos.push(b); }
        const est = new THREE.Mesh(new THREE.OctahedronGeometry(2.6), brilhante('#ffd43b', 1.6)); est.position.set(x, 46, z); mundo.add(est); bulbos.push(est);
        caixa(x - 14, 0, z + 4, 6, 5, 6, '#c92a2a'); caixa(x + 9, 0, z + 5, 5, 4, 5, '#1c7ed6');
      }
    }
    // faixa pendurada no primeiro corredor, de frente para a câmera
    const c0 = L.corredores[0], w = 120, cv = document.createElement('canvas'); cv.width = 480; cv.height = 64;
    const g = cv.getContext('2d'); g.fillStyle = f.id === 'blackfriday' ? '#111111' : C[0]; g.fillRect(0, 0, 480, 64);
    g.fillStyle = f.id === 'blackfriday' ? '#fab005' : (/rosa|maes|pascoa/.test(f.id) ? '#3b0a24' : '#ffffff'); g.font = '900 36px Montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${f.faixa}`, 240, 34);
    for (let k = 0; k < 480; k += 24) { g.fillStyle = C[(k / 24 + 1) % C.length]; g.fillRect(k, 56, 12, 8); }
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, 16), new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide, roughness: 0.8, emissive: '#ffffff', emissiveMap: tx, emissiveIntensity: 0.25 }));
    pl.position.set(L.predio.x + 40 + w / 2, HN - 4, c0.y + 20); mundo.add(pl);
    api.texturas && api.texturas.push(tx);
  }
  function animar3D(t) { for (let i = 0; i < bulbos.length; i++) { const m = bulbos[i].material; if (m && m.emissiveIntensity != null) m.emissiveIntensity = 0.5 + 0.9 * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7)); } }

  KM.festas = { atual, daData, desenhar2D, montar3D, animar3D, FESTAS };
})();
