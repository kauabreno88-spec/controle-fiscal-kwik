/* KWIK Mini Escritório · visão diagonal em 3D (como maquete de programa de arquitetura).
   Usa o Three.js (carregado da internet na primeira vez que a visão diagonal abre). O prédio é montado a partir da
   mesma planta da visão de cima (salas, móveis e caminhos não mudam): piso com porcelanato e madeira, paredes cortadas
   na altura do peito (o "corte" das plantas de arquitetura), as do fundo mais altas com os janelões, móveis em 3D,
   sombras do sol, luz quente das luminárias, árvores e a rua. As pessoas continuam sendo o boneco de sempre, em pé
   dentro da cena. Se o 3D não carregar (sem internet ou sem WebGL), fica a visão diagonal desenhada (cena.js). */
(function () {
  const KM = window.KM;
  const URL3 = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
  const T = 4, NB = 20, HN = 46, HB = 13, AZ = Math.PI / 4, EL = 33 * Math.PI / 180, KV = 1 / Math.cos(EL);
  const D3 = { ok: false, falhou: false, sujo: true, HN, z: 1, alvo: { x: 300, y: 200 }, camPronta: false };
  KM.tresD = D3;
  let THREE = null, renderer = null, scene = null, camera = null, raycaster = null, plano = null, cv3 = null;
  let mundo = null, luzes = null, pessoas = new Map(), decorDin = [], telas = [], piscinas = [], texturas = [], carro = null, anelSel = null, tDecor = 0, chavePer = '';
  const vtmp = () => new THREE.Vector3();

  // ------------------------------------------------------------------ carregar o Three.js
  D3.carregar = function () {
    if (D3.carregando || D3.ok || D3.falhou) return;
    D3.carregando = true;
    import(URL3).then(m => { THREE = m; iniciar(); }).catch(e => { console.warn('KWIK 3D: sem Three.js', e); D3.falhou = true; });
  };
  function iniciar() {
    try {
      cv3 = document.createElement('canvas'); cv3.id = 'tela3d';
      const palco = document.getElementById('palco'); palco.insertBefore(cv3, document.getElementById('tela'));
      renderer = new THREE.WebGLRenderer({ canvas: cv3, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1)); // mais que 1.5 pesa muito e quase não muda o visual
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.shadowMap.autoUpdate = false; // as sombras dos móveis não mudam: calcula só quando o prédio é montado
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 6000);
      raycaster = new THREE.Raycaster(); plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      scene = new THREE.Scene();
      D3.ok = true; D3.sujo = true;
    } catch (e) { console.warn('KWIK 3D: WebGL indisponível', e); D3.falhou = true; D3.ok = false; if (cv3) cv3.remove(); }
  }
  D3.esconder = () => { if (cv3) cv3.style.display = 'none'; };

  // ------------------------------------------------------------------ câmera (ortográfica, na diagonal)
  function atualizarCamera() {
    const W = KM.W, H = KM.H, z = D3.z, d = 2500, ce = Math.cos(EL);
    camera.left = -W / 2 / z; camera.right = W / 2 / z; camera.top = H / 2 / z; camera.bottom = -H / 2 / z;
    camera.position.set(D3.alvo.x + d * ce * Math.sin(AZ), d * Math.sin(EL), D3.alvo.y + d * ce * Math.cos(AZ));
    camera.lookAt(D3.alvo.x, 0, D3.alvo.y);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const iso = KM._cena.ISO; iso.cam.x = W / 2 / z; iso.cam.y = H / 2 / z; iso.cam.z = z; // KM.paraTela / telaParaCena continuam valendo
  }
  const pv = { v: null };
  D3.prj = (X, Y, Z = 0) => { const v = pv.v || (pv.v = vtmp()); v.set(X, Z, Y).project(camera); return [(v.x + 1) / 2 * KM.W / D3.z, (1 - v.y) / 2 * KM.H / D3.z]; };
  function chao(lx, ly) {
    raycaster.setFromCamera(new THREE.Vector2(lx / KM.W * 2 - 1, -(ly / KM.H * 2 - 1)), camera);
    const p = vtmp(); return raycaster.ray.intersectPlane(plano, p) ? p : null;
  }
  D3.mundo = (lx, ly) => { const p = chao(lx, ly); return p ? [p.x, p.z] : [-999, -999]; };
  function limitar() { const L = KM.LAYOUT; D3.z = Math.max(0.3, Math.min(3.2, D3.z)); if (L) { D3.alvo.x = Math.max(-40, Math.min(L.W + 40, D3.alvo.x)); D3.alvo.y = Math.max(-40, Math.min(L.H + 40, D3.alvo.y)); } }
  D3.cam = {
    ajustar() {
      const L = KM.LAYOUT, P = L.predio; D3.z = 1; D3.alvo.x = P.x + P.w / 2; D3.alvo.y = (P.y + L.rua + 30) / 2; atualizarCamera();
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const X of [P.x - 6, P.x + P.w + 6]) for (const Y of [P.y - 6, L.rua + 34]) for (const Z of [0, HN + 8]) { const [a, b] = D3.prj(X, Y, Z); x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); }
      const c = chao((x0 + x1) / 2, (y0 + y1) / 2); if (c) { D3.alvo.x = c.x; D3.alvo.y = c.z; }
      D3.z = Math.min(KM.W / (x1 - x0), KM.H / (y1 - y0)) * 0.97; limitar(); atualizarCamera();
    },
    zoom(f, cx, cy) {
      const a = cx != null ? chao(cx, cy) : null;
      D3.z *= f; limitar(); atualizarCamera();
      if (a) { const b = chao(cx, cy); if (b) { D3.alvo.x += a.x - b.x; D3.alvo.y += a.z - b.z; limitar(); atualizarCamera(); } }
    },
    mover(dx, dy) { const a = chao(KM.W / 2, KM.H / 2), b = chao(KM.W / 2 + dx, KM.H / 2 + dy); if (a && b) { D3.alvo.x += a.x - b.x; D3.alvo.y += a.z - b.z; } limitar(); atualizarCamera(); },
    focar(X, Y, z) { D3.alvo.x = X; D3.alvo.y = Y; if (z) D3.z = z; D3.camPronta = true; limitar(); atualizarCamera(); },
    estado: () => ({ x: Math.round(D3.alvo.x), y: Math.round(D3.alvo.y), z: +D3.z.toFixed(3) }),
  };

  // ------------------------------------------------------------------ materiais, formas e texturas
  const cache = { mat: new Map(), geo: new Map() };
  const cor = c => new THREE.Color(c);
  function mat(c, o) {
    const k = c + (o ? JSON.stringify(o) : '');
    let m = cache.mat.get(k);
    if (!m) { m = new THREE.MeshStandardMaterial(Object.assign({ color: cor(c), roughness: 0.78, metalness: 0.02 }, o || {})); if (o && o.emissive) m.emissive = cor(o.emissive); cache.mat.set(k, m); }
    return m;
  }
  const brilhante = (c, f = 1) => mat(c, { emissive: c, emissiveIntensity: f, roughness: 0.4 });
  function geo(tipo, ...a) {
    const k = tipo + a.map(x => (typeof x === 'number' ? x.toFixed(2) : x)).join(',');
    let g = cache.geo.get(k);
    if (!g) {
      if (tipo === 'b') g = new THREE.BoxGeometry(a[0], a[1], a[2]);
      else if (tipo === 'c') g = new THREE.CylinderGeometry(a[0], a[1], a[2], a[3] || 18);
      else if (tipo === 's') g = new THREE.SphereGeometry(a[0], a[1] || 14, a[2] || 10);
      else if (tipo === 'k') g = new THREE.ConeGeometry(a[0], a[1], a[2] || 10);
      else if (tipo === 't') g = new THREE.TorusGeometry(a[0], a[1], 10, 28);
      else if (tipo === 'i') g = new THREE.IcosahedronGeometry(a[0], 1);
      cache.geo.set(k, g);
    }
    return g;
  }
  function malha(g, m, x, y, z, sombra = true) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = sombra; o.receiveShadow = true; mundo.add(o); return o; }
  // caixa: (x, z) = canto de trás à esquerda, y = base; w ao longo de X, d ao longo de Z, h de altura
  const caixa = (x, y, z, w, h, d, c, sombra) => malha(geo('b', Math.max(0.3, w), Math.max(0.3, h), Math.max(0.3, d)), typeof c === 'string' ? mat(c) : c, x + w / 2, y + h / 2, z + d / 2, sombra);
  const cil = (cx, y, cz, r, h, c, r2, seg) => malha(geo('c', r2 != null ? r2 : r, r, h, seg), typeof c === 'string' ? mat(c) : c, cx, y + h / 2, cz);
  const bola = (cx, y, cz, r, c) => malha(geo('s', r), typeof c === 'string' ? mat(c) : c, cx, y, cz);
  const tom = (h, f) => KM.cor.tom(h, f);
  function telaCv(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function textura(c, o = {}) {
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    if (o.pixel) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; }
    else t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (o.repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repetir[0], o.repetir[1]); }
    texturas.push(t); return t;
  }
  const semente = n => { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // pisos em alta resolução (3 px por unidade)
  const S = 3;
  function texPorcelanato(w, h, base, lado = 26, sem = 1) {
    const c = telaCv(w * S, h * S), g = c.getContext('2d'), rnd = semente(sem), L = lado * S;
    g.fillStyle = tom(base, 0.8); g.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < c.height; y += L) for (let x = 0; x < c.width; x += L) {
      const k = 0.97 + rnd() * 0.06; g.fillStyle = tom(base, k); g.fillRect(x + 1, y + 1, L - 2, L - 2);
      const gr = g.createLinearGradient(x, y, x + L, y + L); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(0.6, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x + 1, y + 1, L - 2, L - 2);
      for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(0,0,0,${0.025 + rnd() * 0.03})`; g.fillRect(x + rnd() * L, y + rnd() * L, 2, 1); }
    }
    return c;
  }
  function texMadeira(w, h, base, sem = 2) {
    const c = telaCv(w * S, h * S), g = c.getContext('2d'), rnd = semente(sem), PH = 8 * S;
    g.fillStyle = tom(base, 0.7); g.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < c.height; y += PH) {
      let x = -Math.floor(rnd() * 60 * S);
      while (x < c.width) {
        const comp = (34 + rnd() * 50) * S, k = 0.88 + rnd() * 0.22;
        g.fillStyle = tom(base, k); g.fillRect(x + 1, y + 1, comp - 2, PH - 2);
        g.strokeStyle = `rgba(60,30,10,${0.10 + rnd() * 0.08})`; g.lineWidth = 1;
        for (let i = 0; i < 3; i++) { const yy = y + 3 + rnd() * (PH - 6); g.beginPath(); g.moveTo(x + 2, yy); g.bezierCurveTo(x + comp * 0.3, yy + rnd() * 3 - 1.5, x + comp * 0.7, yy + rnd() * 3 - 1.5, x + comp - 2, yy); g.stroke(); }
        x += comp;
      }
    }
    return c;
  }
  function texXadrez(w, h, c1, c2, n) { const c = telaCv(w * S, h * S), g = c.getContext('2d'), L = n * S; for (let y = 0; y < c.height; y += L) for (let x = 0; x < c.width; x += L) { g.fillStyle = ((x + y) / L) % 2 ? c2 : c1; g.fillRect(x, y, L, L); } return c; }
  function texGrama() {
    const c = telaCv(256, 256), g = c.getContext('2d'), rnd = semente(5);
    g.fillStyle = '#4f8a3c'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) { g.fillStyle = ['#5c9a45', '#477e36', '#66a64e', '#3f7330'][i % 4]; g.fillRect(rnd() * 256, rnd() * 256, 2, 2 + rnd() * 3); }
    return c;
  }
  function texAsfalto() {
    const c = telaCv(128, 128), g = c.getContext('2d'), rnd = semente(9);
    g.fillStyle = '#3b3f4c'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) { g.fillStyle = rnd() < 0.5 ? '#444958' : '#343844'; g.fillRect(rnd() * 128, rnd() * 128, 1.5, 1.5); }
    return c;
  }
  function plano3(x, z, w, d, m, y = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); o.rotation.x = -Math.PI / 2; o.position.set(x + w / 2, y, z + d / 2); o.receiveShadow = true; mundo.add(o); return o; }

  // ------------------------------------------------------------------ móveis
  const MESA_H = 19;
  const COR = { arquivo: '#9aa1a8', frigobar: '#eef0f2', geladeira: '#eef0f2', cofre: '#5b636a', impressora: '#dee2e6', rackTV: '#24272b', banco: '#8d5a3b', banco2: '#6b7088', podio: '#e2b33c', touro: '#b08d57', banqueta: '#495057' };
  function itensMesa(m, ty) {
    (m.itens || []).forEach((o, i) => {
      const x = i ? m.X + m.w - 7 : m.X + 3, z = m.Y + 2;
      if (o === 'caneca') { cil(x + 2, ty, z + 2, 1.4, 3.5, '#ffffff'); }
      else if (o === 'flor') { cil(x + 2, ty, z + 2, 1.3, 3, '#ff8fb1'); bola(x + 2, ty + 5, z + 2, 2, '#ffd43b'); }
      else if (o === 'telefone') caixa(x, ty, z, 6, 2, 4, '#c9453a');
      else if (o === 'calculadora') caixa(x, ty, z, 4, 1, 5, '#495057');
      else if (o === 'celular') caixa(x, ty, z, 3, 0.6, 5, '#212529');
      else if (o === 'prancheta') caixa(x, ty, z, 6, 0.6, 8, '#8d5a3b');
      else caixa(x, ty, z, 6, 0.8, 7, '#ffffff');
    });
  }
  function monitor(cx, ty, z, larg, funcao) {
    caixa(cx - 1, ty, z + 1, 2, 4, 2, '#30363a');
    caixa(cx - larg / 2, ty + 4, z + 1, larg, 10, 1.4, '#1f2326');
    const m = new THREE.MeshStandardMaterial({ color: cor('#0c1416'), emissive: cor('#3b8cff'), emissiveIntensity: 0.9, roughness: 0.3 });
    const s = new THREE.Mesh(geo('b', larg - 1.4, 8.6, 0.3), m); s.position.set(cx, ty + 9, z + 2.6); mundo.add(s);
    telas.push({ m, funcao });
  }
  const FAB = {
    mesa(m, e) {
      const c = e.mesa || '#eef0f2', pe = e.modeloMesa === 'classica' ? tom(c, 0.75) : '#8a9096';
      caixa(m.X, MESA_H - 2, m.Y, m.w, 2, m.d, c);
      if (e.modeloMesa === 'classica') { caixa(m.X, 0, m.Y, 2, MESA_H - 2, m.d, pe); caixa(m.X + m.w - 12, 0, m.Y, 12, MESA_H - 2, m.d, pe); }
      else { caixa(m.X + 1, 0, m.Y + 1, 1.6, MESA_H - 2, m.d - 2, pe); caixa(m.X + m.w - 2.6, 0, m.Y + 1, 1.6, MESA_H - 2, m.d - 2, pe); caixa(m.X + 2, MESA_H - 9, m.Y + 1, m.w - 4, 6, 1, tom(c, 0.85)); }
      const cx = m.X + m.w / 2;
      if (m.tela === 'duplo') { monitor(cx - 7.5, MESA_H, m.Y, 14, m.funcao); monitor(cx + 7.5, MESA_H, m.Y, 14, m.funcao); }
      else if (m.tela === 'notebook') { caixa(cx - 6, MESA_H, m.Y + 4, 12, 0.8, 7, '#adb5bd'); const t = caixa(cx - 6, MESA_H, m.Y + 3, 12, 8, 0.8, '#868e96'); t.rotation.x = -0.25; const mm = new THREE.MeshStandardMaterial({ color: cor('#0c1416'), emissive: cor('#3b8cff'), emissiveIntensity: 0.9 }); const s = new THREE.Mesh(geo('b', 10.6, 6.6, 0.2), mm); s.position.set(cx, MESA_H + 4.4, m.Y + 3.9); s.rotation.x = -0.25; mundo.add(s); telas.push({ m: mm, funcao: m.funcao }); }
      else if (m.tela) monitor(cx, MESA_H, m.Y, 18, m.funcao);
      if (m.tela) caixa(cx - 6, MESA_H, m.Y + m.d - 5, 12, 0.7, 3.5, '#dee2e6');
      itensMesa(m, MESA_H);
    },
    mesaExec(m) { caixa(m.X, MESA_H - 2, m.Y, m.w, 2, m.d, '#f1f3f5'); caixa(m.X + 1, 0, m.Y + 1, 1.6, MESA_H - 2, m.d - 2, '#8a9096'); caixa(m.X + m.w - 2.6, 0, m.Y + 1, 1.6, MESA_H - 2, m.d - 2, '#8a9096'); caixa(m.X, MESA_H - 3, m.Y + m.d - 0.6, m.w, 1, 0.6, '#28BE52'); monitor(m.X + m.w / 2, MESA_H, m.Y, 16, 'exec'); },
    cadeira(m, e) {
      const c = e.cadeira || '#5c6370', x = m.sx, z = m.sy - 2;
      cil(x, 0, z, 0.8, 12, '#495057'); caixa(x - 6, 0, z - 0.6, 12, 1, 1.2, '#343a40'); caixa(x - 0.6, 0, z - 6, 1.2, 1, 12, '#343a40');
      caixa(x - 6.5, 12, z - 5.5, 13, 3, 11, c); caixa(x - 6.5, 14, z + 4.5, 13, 15, 2, tom(c, 0.9));
    },
    sofa(m, e) {
      const c = e.corSofa || '#3f7fc1';
      caixa(m.X, 0, m.Y, m.w, 24, 6, tom(c, 0.88)); caixa(m.X, 0, m.Y + 5, m.w, 10, m.d - 5, c);
      caixa(m.X, 0, m.Y + 3, 4, 16, m.d - 3, tom(c, 0.82)); caixa(m.X + m.w - 4, 0, m.Y + 3, 4, 16, m.d - 3, tom(c, 0.82));
      for (let i = 0; i < 2; i++) caixa(m.X + 5 + i * (m.w - 10) / 2, 10, m.Y + 6, (m.w - 12) / 2, 3, m.d - 7, tom(c, 1.08));
      if (e.modeloSofa === 'futon') for (const k of [0.25, 0.55]) caixa(m.X + m.w * k, 12, m.Y + 5, 7, 7, 2, '#e8913a');
    },
    sofaCostas(m) { const c = '#5f3dc4'; caixa(m.X, 0, m.Y, m.w, 10, m.d - 4, tom(c, 1.12)); caixa(m.X, 0, m.Y + m.d - 5, m.w, 22, 5, c); caixa(m.X, 0, m.Y, 4, 15, m.d, tom(c, 0.9)); caixa(m.X + m.w - 4, 0, m.Y, 4, 15, m.d, tom(c, 0.9)); },
    poltrona(m, e) { const c = e.corSofa || '#3f7fc1'; caixa(m.X, 0, m.Y, m.w, 22, 4, tom(c, 0.88)); caixa(m.X, 0, m.Y + 3, m.w, 10, m.d - 3, c); caixa(m.X, 0, m.Y + 3, 3, 14, m.d - 3, tom(c, 0.8)); caixa(m.X + m.w - 3, 0, m.Y + 3, 3, 14, m.d - 3, tom(c, 0.8)); },
    mesinha(m) {
      if (m.redonda) { cil(m.X + m.w / 2, 9, m.Y + m.d / 2, Math.min(m.w, m.d) / 2 + 1, 1.5, '#8d5a3b'); cil(m.X + m.w / 2, 0, m.Y + m.d / 2, 0.8, 9, '#5c3d2e'); }
      else { caixa(m.X, 9, m.Y, m.w, 1.6, m.d, '#8d5a3b'); for (const [a, b] of [[0, 0], [m.w - 1.5, 0], [0, m.d - 1.5], [m.w - 1.5, m.d - 1.5]]) caixa(m.X + a, 0, m.Y + b, 1.5, 9, 1.5, '#5c3d2e'); }
      if (m.revistas) { caixa(m.X + 3, 10.6, m.Y + 2, 7, 0.6, 5, '#e64980'); caixa(m.X + 12, 10.6, m.Y + 3, 7, 0.6, 5, '#4dabf7'); }
      if (m.bolo) { cil(m.X + m.w / 2, 10.6, m.Y + m.d / 2, 3, 3, '#f8d6a8'); cil(m.X + m.w / 2, 13.6, m.Y + m.d / 2, 3, 0.8, '#ff8fb1'); }
    },
    estante(m, e) {
      const c = e.estante || '#a0612f', H = 50, cores = ['#3f7fc1', '#2E8B45', '#c9453a', '#e2b33c', '#5a4fa8', '#e9e4d8', '#1f6d67', '#d97a2b'];
      caixa(m.X, 0, m.Y, m.w, H, 2, tom(c, 0.8)); caixa(m.X, 0, m.Y, 1.5, H, m.d, c); caixa(m.X + m.w - 1.5, 0, m.Y, 1.5, H, m.d, c); caixa(m.X, H - 1.5, m.Y, m.w, 1.5, m.d, c);
      for (let k = 0; k < 4; k++) { const y = 1 + k * 12; caixa(m.X, y, m.Y, m.w, 1.2, m.d, c); for (let x = m.X + 2, i = k * 3; x < m.X + m.w - 3; i++) { const bw = 1.5 + (i % 2), bh = 7 + (i % 3) * 1.5; caixa(x, y + 1.2, m.Y + 2, bw, bh, m.d - 3, cores[i % cores.length]); x += bw + 0.5; } }
    },
    arquivo(m) { const H = (m.h || 16) * 2.2; caixa(m.X, 0, m.Y, m.w, H, m.d, '#9aa1a8'); for (let k = 1; k < 4; k++) caixa(m.X + 0.5, H * k / 4, m.Y + m.d - 0.3, m.w - 1, 0.5, 0.5, '#5c636a'); for (let k = 0; k < 4; k++) caixa(m.X + m.w / 2 - 2, H * k / 4 + H / 8, m.Y + m.d, 4, 0.8, 0.6, '#e9ecef'); },
    planta(m, e) {
      const x = m.X + 5, z = m.Y + 3, vaso = e.corVaso || '#b5532f', mod = e.modeloPlanta;
      cil(x, 0, z, 4.2, 9, vaso, 3.4); cil(x, 8.6, z, 3.8, 0.5, '#3b2a20');
      if (mod === 'cacto') { cil(x, 9, z, 1.8, 16, '#2f9e44'); cil(x + 3, 14, z, 1, 6, '#2f9e44'); bola(x, 25, z, 1.8, '#2f9e44'); }
      else if (mod === 'palmeira') { cil(x, 9, z, 0.7, 18, '#7a5a3a'); for (let i = 0; i < 6; i++) { const f = caixa(x - 1, 26, z - 0.5, 12, 0.5, 2.6, i % 2 ? '#2f9e44' : '#40c057'); f.rotation.y = i * Math.PI / 3; f.rotation.z = -0.4; f.position.set(x + Math.cos(i * Math.PI / 3) * 5, 25, z - Math.sin(i * Math.PI / 3) * 5); } }
      else { for (const [dx, dy, dz, r] of [[0, 18, 0, 6], [-3, 14, 2, 4.5], [3, 15, -2, 4.6], [1, 23, 1, 4], [-2, 21, -2, 3.6]]) malha(geo('i', r), mat(dy > 19 ? '#40c057' : '#2f9e44'), x + dx, dy, z + dz); }
    },
    luminaria(m) {
      const x = m.X + 3.5, z = m.Y + 2.5;
      cil(x, 0, z, 3, 1, '#2b2f36'); cil(x, 1, z, 0.5, 44, '#2b2f36');
      const ab = new THREE.Mesh(geo('c', 3, 6, 7, 16), new THREE.MeshStandardMaterial({ color: cor('#f3e3c3'), emissive: cor('#ffcf8a'), emissiveIntensity: 0.9, side: THREE.DoubleSide }));
      ab.position.set(x, 46, z); mundo.add(ab);
    },
    tapete(m, e) {
      const c = telaCv(m.w, m.d), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(-m.X, -m.Y);
      try { KM._cena.DES.tapete(g, m, KM.config()); } catch (x) { g.fillStyle = e.corTapete || '#c98a4e'; g.fillRect(m.X, m.Y, m.w, m.d); }
      const t = textura(c, { pixel: true }), o = plano3(m.X, m.Y, m.w, m.d, new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 1 }), 0.25); o.renderOrder = 1;
    },
    balcao(m) { caixa(m.X, 0, m.Y, m.w, 24, m.d, '#f1f3f5'); caixa(m.X - 1, 24, m.Y - 1, m.w + 2, 1.6, m.d + 2, '#ffffff'); caixa(m.X, 0, m.Y + m.d - 0.4, m.w, 22, 0.8, '#111A19'); caixa(m.X, 17, m.Y + m.d + 0.3, m.w, 1.4, 0.4, '#28BE52'); caixa(m.X + m.w / 2 - 5, 9, m.Y + m.d + 0.5, 10, 4, 0.3, brilhante('#28BE52', 0.6)); },
    mesaReuniao(m) { caixa(m.X, 17, m.Y, m.w, 2.4, m.d, '#7a4a2e'); caixa(m.X + 6, 0, m.Y + m.d / 2 - 2, 3, 17, 4, '#3b2a20'); caixa(m.X + m.w - 9, 0, m.Y + m.d / 2 - 2, 3, 17, 4, '#3b2a20'); caixa(m.X + 4, 19.4, m.Y + 4, m.w - 8, 0.3, m.d - 8, '#8d5a3b'); },
    mesaRefeicao(m) { caixa(m.X, 17, m.Y, m.w, 2.2, m.d, '#c98a55'); caixa(m.X + 4, 19.2, m.Y + 4, m.w - 8, 0.3, m.d - 8, '#f1f3f5'); for (const [a, b] of [[1, 1], [m.w - 3, 1], [1, m.d - 3], [m.w - 3, m.d - 3]]) caixa(m.X + a, 0, m.Y + b, 2, 17, 2, '#7a4a2e'); },
    mesaJantar(m) { FAB.mesaRefeicao(m); },
    mesaApresentacao(m) { caixa(m.X, 17, m.Y, m.w, 2.2, m.d, '#f8f9fa'); caixa(m.X, 15, m.Y + m.d - 0.5, m.w, 2, 0.6, '#28BE52'); caixa(m.X + 4, 0, m.Y + 2, 2, 17, m.d - 4, '#adb5bd'); caixa(m.X + m.w - 6, 0, m.Y + 2, 2, 17, m.d - 4, '#adb5bd'); },
    mesaCartas(m) { cil(m.X + m.w / 2, 16, m.Y + m.d / 2, Math.min(m.w, m.d) / 2, 2, '#1c7ed6'); cil(m.X + m.w / 2, 0, m.Y + m.d / 2, 1.2, 16, '#343a40'); caixa(m.X + m.w / 2 - 3, 18.1, m.Y + m.d / 2 - 2, 6, 0.3, 4, '#ffffff'); },
    sinuca(m) { caixa(m.X, 4, m.Y, m.w, 14, m.d, '#6b3f22'); caixa(m.X + 3, 18, m.Y + 3, m.w - 6, 0.6, m.d - 6, '#2f9e44'); for (const [a, b] of [[2, 2], [m.w - 6, 2], [2, m.d - 6], [m.w - 6, m.d - 6]]) caixa(m.X + a, 0, m.Y + b, 4, 4, 4, '#4a2a16'); [['#f8f9fa', 0.3, 0.5], ['#e03131', 0.6, 0.4], ['#ffd43b', 0.65, 0.6], ['#1c7ed6', 0.7, 0.45]].forEach(([c, a, b]) => bola(m.X + m.w * a, 19.6, m.Y + m.d * b, 1.1, c)); },
    pingue(m) { caixa(m.X, 16, m.Y, m.w, 1.6, m.d, '#1971c2'); caixa(m.X + m.w / 2 - 0.3, 17.6, m.Y, 0.6, 3, m.d, '#f8f9fa'); caixa(m.X + 4, 0, m.Y + 3, 2, 16, m.d - 6, '#343a40'); caixa(m.X + m.w - 6, 0, m.Y + 3, 2, 16, m.d - 6, '#343a40'); },
    pebolim(m) { caixa(m.X, 10, m.Y, m.w, 8, m.d, '#5c3d2e'); caixa(m.X + 2, 18, m.Y + 2, m.w - 4, 0.4, m.d - 4, '#2f9e44'); for (let i = 1; i < 5; i++) { const r = cil(m.X + i * m.w / 5, 15, m.Y + m.d / 2, 0.4, m.d + 6, '#adb5bd'); r.rotation.x = Math.PI / 2; r.position.y = 16; } caixa(m.X + 2, 0, m.Y + 2, 3, 10, 3, '#3b2a20'); caixa(m.X + m.w - 5, 0, m.Y + m.d - 5, 3, 10, 3, '#3b2a20'); },
    puff(m) { cil(m.X + m.w / 2, 0, m.Y + m.d / 2, Math.min(m.w, m.d) / 2, 10, m.cor || '#ff8c5a', Math.min(m.w, m.d) / 2 - 1); },
    pufeKwik(m) { cil(m.X + m.w / 2, 0, m.Y + m.d / 2, Math.min(m.w, m.d) / 2, 10, '#28BE52', Math.min(m.w, m.d) / 2 - 1); },
    cofre(m) { caixa(m.X, 0, m.Y, m.w, 30, m.d, '#5b636a'); cil(m.X + m.w / 2, 15, m.Y + m.d + 0.2, 2.2, 0.8, '#e6c04a').rotation.x = Math.PI / 2; },
    bebedouro(m) { caixa(m.X, 0, m.Y, m.w, 20, m.d, '#dee2e6'); cil(m.X + m.w / 2, 20, m.Y + m.d / 2, 3.4, 12, new THREE.MeshStandardMaterial({ color: cor('#74c0fc'), transparent: true, opacity: 0.7, roughness: 0.1 })); },
    cafeteira(m) { caixa(m.X, 0, m.Y, m.w, 20, m.d, '#8d5a3b'); caixa(m.X - 0.5, 20, m.Y - 0.5, m.w + 1, 1.2, m.d + 1, '#f1f3f5'); caixa(m.X + 3, 21.2, m.Y + 1, 8, 11, 6, '#24272b'); cil(m.X + 7, 21.2, m.Y + 6, 1.2, 2.5, '#ffffff'); for (let i = 0; i < 4; i++) cil(m.X + 14 + i * 2.6, 21.2, m.Y + 5, 1, 2.2, ['#ffffff', '#28BE52', '#ffd43b', '#ffffff'][i]); },
    buffet(m) { caixa(m.X, 0, m.Y, m.w, 17, m.d, '#ced4da'); for (let i = 0; i < 4; i++) caixa(m.X + 4 + i * 14, 17, m.Y + 2, 10, 1.6, m.d - 4, ['#ffd43b', '#ff8787', '#69db7c', '#ffa94d'][i]); caixa(m.X, 26, m.Y, m.w, 0.6, m.d, new THREE.MeshStandardMaterial({ color: cor('#e7f5ff'), transparent: true, opacity: 0.45 })); },
    impressora(m) { caixa(m.X, 0, m.Y, m.w, 12, m.d, '#495057'); caixa(m.X, 12, m.Y, m.w, 6, m.d, '#dee2e6'); caixa(m.X + 2, 18, m.Y + 1, m.w - 4, 0.6, 5, '#ffffff'); },
    fliperama(m) { caixa(m.X, 0, m.Y, m.w, 48, m.d, '#7048e8'); caixa(m.X + 1, 26, m.Y + m.d - 0.2, m.w - 2, 14, 0.5, brilhante('#4dabf7', 1.2)); caixa(m.X - 0.5, 18, m.Y + m.d - 3, m.w + 1, 1.5, 5, '#5f3dc4'); caixa(m.X + 1, 42, m.Y + m.d - 0.2, m.w - 2, 4, 0.5, brilhante('#ff4fd8', 1.3)); },
    rackTV(m) { caixa(m.X, 0, m.Y, m.w, 10, m.d, '#24272b'); caixa(m.X + m.w - 9, 10, m.Y + 1, 6, 9, 4, '#f8f9fa'); caixa(m.X + 3, 10, m.Y + 2, 7, 2, 3, '#212529'); },
    tanqueMeta(m) {
      const md = KM.metaDados ? KM.metaDados(KM.config()) : { pctAtivo: 0.3 }, cx = m.X + m.w / 2, cz = m.Y + m.d / 2, r = Math.min(m.w, m.d) / 2, H = 52, k = Math.max(0.05, Math.min(1, md.pctAtivo || md.pctTotal || 0.3));
      cil(cx, 0, cz, r + 2, 6, '#495057'); cil(cx, 6, cz, r - 1, H * k, brilhante('#28BE52', 0.35));
      cil(cx, 6, cz, r, H, new THREE.MeshStandardMaterial({ color: cor('#d0ebff'), transparent: true, opacity: 0.28, roughness: 0.05 })); cil(cx, 6 + H, cz, r + 1, 2, '#495057');
    },
    podio(m) { caixa(m.X + m.w / 3, 0, m.Y, m.w / 3, 14, m.d, '#e2b33c'); caixa(m.X, 0, m.Y, m.w / 3, 9, m.d, '#adb5bd'); caixa(m.X + 2 * m.w / 3, 0, m.Y, m.w / 3, 6, m.d, '#c47a3a'); },
    cofrinho(m) { bola(m.X + m.w / 2, 5, m.Y + m.d / 2, 4.6, '#ff8fb1'); },
    trofeuKwik(m) { const x = m.X + m.w / 2, z = m.Y + m.d / 2; caixa(x - 3, 0, z - 3, 6, 18, 6, '#2b2f36'); cil(x, 18, z, 1, 5, '#e2b33c'); cil(x, 23, z, 3.6, 7, brilhante('#e2b33c', 0.25), 1.6); },
    vasoFlores(m) { const x = m.X + m.w / 2, z = m.Y + m.d / 2; cil(x, 0, z, 2.6, 10, '#f1f3f5', 2); for (const [a, b, c] of [[0, 15, 0], [-2, 13.5, 1], [2, 14, -1]]) bola(x + a, b, z + c, 2.1, m.cor || '#ff6b9a'); },
    touro(m) { caixa(m.X, 0, m.Y, m.w, 4, m.d, '#2b2f36'); caixa(m.X + 2, 4, m.Y + 1, m.w - 4, 8, m.d - 2, '#b08d57'); },
    cestaTrico(m) { cil(m.X + m.w / 2, 0, m.Y + m.d / 2, 4.5, 6, '#c9a26b', 3.8); bola(m.X + m.w / 2 - 1.5, 6.5, m.Y + m.d / 2, 2, '#e64980'); bola(m.X + m.w / 2 + 2, 6.5, m.Y + m.d / 2, 1.8, '#4dabf7'); },
    skate(m) { const o = caixa(m.X, 0, m.Y + m.d / 2, 6, 24, 1.2, '#e03131'); o.rotation.x = -0.15; },
    tripe(m) { const x = m.X + m.w / 2, z = m.Y + m.d / 2; for (let i = 0; i < 3; i++) { const p = cil(x, 0, z, 0.4, 30, '#343a40'); p.rotation.z = 0.18 * Math.cos(i * 2.1); p.rotation.x = 0.18 * Math.sin(i * 2.1); } caixa(x - 4, 29, z - 2, 8, 5, 4, '#212529'); },
    ringlight(m) { const x = m.X + m.w / 2, z = m.Y + m.d / 2; cil(x, 0, z, 0.5, 42, '#343a40'); const t = malha(geo('t', 6, 0.9), brilhante('#fff3bf', 1.5), x, 46, z, false); t.rotation.y = Math.PI / 4; },
    fundoVerde(m) { caixa(m.X, 0, m.Y, m.w, 56, 1.5, brilhante('#2fbf4a', 0.15)); },
    banqueta(m) { cil(m.X + m.w / 2, 0, m.Y + m.d / 2, 0.7, 15, '#495057'); cil(m.X + m.w / 2, 15, m.Y + m.d / 2, 4, 2, '#e03131'); },
    carrinhoLimpeza(m) { caixa(m.X, 2, m.Y, m.w, 14, m.d, '#ffd43b'); for (const [a, b] of [[1, 1], [m.w - 2, 1], [1, m.d - 2], [m.w - 2, m.d - 2]]) cil(m.X + a, 0, m.Y + b, 1, 2, '#212529'); cil(m.X + 4, 16, m.Y + m.d / 2, 2.4, 5, '#868e96'); cil(m.X + m.w - 2, 16, m.Y + 2, 0.4, 24, '#8d5a3b'); caixa(m.X + 9, 16, m.Y + 2, 3, 6, 3, '#4dabf7'); },
    prateleiraLimpeza(m) { const H = 50, cores = ['#4dabf7', '#ffd43b', '#ff8787', '#69db7c', '#f8f9fa', '#b197fc']; for (const [a, b] of [[0, 0], [m.w - 1, 0], [0, m.d - 1], [m.w - 1, m.d - 1]]) caixa(m.X + a, 0, m.Y + b, 1, H, 1, '#868e96'); for (let k = 0; k < 4; k++) { const y = 2 + k * 13; caixa(m.X, y, m.Y, m.w, 0.8, m.d, '#adb5bd'); for (let x = m.X + 2, i = k; x < m.X + m.w - 3; i++) { cil(x + 1.5, y + 0.8, m.Y + m.d / 2, 1.4, 5 + (i % 3) * 2, cores[i % cores.length]); x += 4; } } },
    vassouras(m) { caixa(m.X, 30, m.Y, m.w, 2, 2, '#5c3d2e'); [['#8d5a3b', '#ffd43b'], ['#495057', '#e03131'], ['#8d5a3b', '#4dabf7']].forEach(([c1, c2], i) => { const x = m.X + 2.5 + i * 4; cil(x, 4, m.Y + 2.5, 0.4, 28, c1); caixa(x - 2, 0, m.Y + 1, 4, 5, 3, c2); }); },
    tanque(m) { caixa(m.X, 0, m.Y, m.w, 22, m.d, '#eef0f2'); caixa(m.X + 2, 21, m.Y + 2, m.w - 4, 1.2, m.d - 4, '#a5d8ff'); cil(m.X + m.w / 2, 22, m.Y + 1.5, 0.6, 7, '#adb5bd'); },
    baldeMop(m) { cil(m.X + m.w / 2, 0, m.Y + m.d / 2, 4, 9, '#fab005', 3.4); cil(m.X + m.w / 2, 4, m.Y + m.d / 2, 0.5, 30, '#8d5a3b'); },
    ferramentas(m) { caixa(m.X, 0, m.Y, m.w, 10, m.d, '#e03131'); caixa(m.X + 4, 10, m.Y + m.d / 2 - 1, m.w - 8, 2.5, 2, '#343a40'); },
    escadaFixa(m) { caixa(m.X, 0, m.Y, 1, 52, 1.2, '#adb5bd'); caixa(m.X + m.w - 1, 0, m.Y, 1, 52, 1.2, '#adb5bd'); for (let k = 0; k < 7; k++) caixa(m.X, 5 + k * 7, m.Y, m.w, 0.8, 1.2, '#868e96'); },
    bancadaZeca(m) { caixa(m.X, MESA_H - 2, m.Y, m.w, 2, m.d, '#8d5a3b'); caixa(m.X + 1, 0, m.Y + 1, 2, MESA_H - 2, m.d - 2, '#5c3d2e'); caixa(m.X + m.w - 3, 0, m.Y + 1, 2, MESA_H - 2, m.d - 2, '#5c3d2e'); caixa(m.X + 3, MESA_H, m.Y + 1, 10, 6, 4, '#343a40'); cil(m.X + 6, MESA_H + 2, m.Y + 5.2, 1.4, 0.4, '#adb5bd').rotation.x = Math.PI / 2; cil(m.X + m.w - 5, MESA_H, m.Y + 4, 1.4, 3.5, '#ffffff'); },
    geladeira(m) { caixa(m.X, 0, m.Y, m.w, 46, m.d, '#eef0f2'); caixa(m.X + m.w - 2, 20, m.Y + m.d, 0.8, 10, 0.6, '#868e96'); },
    bancada(m) { caixa(m.X, 0, m.Y, m.w, 20, m.d, '#e9ecef'); caixa(m.X, 20, m.Y, m.w, 1.4, m.d, '#f8f9fa'); },
  };
  function construirMovel(m, e) {
    const f = FAB[m.tipo];
    if (f) return f(m, e);
    if (!m.w || !m.d) return;
    caixa(m.X, 0, m.Y, m.w, Math.max(4, (m.h || 6) * 2), m.d, COR[m.tipo] || '#adb5bd');
  }

  // ------------------------------------------------------------------ paredes
  function paredeCaixa(x, z, w, d, h, chaves) {
    const k = [x, z, w, d].map(v => Math.round(v)).join('|');
    if (chaves.has(k) || w <= 0.2 || d <= 0.2) return; chaves.add(k);
    const pm = mat('#f2efe8', { roughness: 0.92 }), tampa = mat('#2b2f3b', { roughness: 0.9 });
    const o = new THREE.Mesh(geo('b', w, h, d), [pm, pm, tampa, pm, pm, pm]);
    o.position.set(x + w / 2, h / 2, z + d / 2); o.castShadow = true; o.receiveShadow = true; mundo.add(o);
  }
  // pedaço da parede do fundo com a "pintura" da sala (janelões, quadros) na face de dentro
  function faceFundo(tex, s, x0, x1, wTot) {
    const L = s.x - T, u0 = (x0 - L) / wTot, u1 = (x1 - L) / wTot, vTop = 30 / 34;
    const g = new THREE.PlaneGeometry(x1 - x0, HN), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) ? u1 : u0, uv.getY(i) ? vTop : 0);
    const o = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    o.position.set((x0 + x1) / 2, HN / 2, s.fy + 0.06); o.receiveShadow = true; mundo.add(o);
  }
  function montarParedes(L, cfg) {
    const chaves = new Set(), P = L.predio, paredes = KM._cena.montarParedes(cfg);
    for (const s of Object.values(L.salas)) {
      const pw = paredes.find(q => q.s === s), wTot = s.w + 2 * T, tex = pw ? textura(pw.c, { pixel: true }) : null;
      const xa = s.x - T, xb = s.x + s.w + T, zN = s.fy - T;
      // fundo (alta, com a pintura); porta se a sala abre para o corredor de cima
      const segs = s.portaCima ? [[xa, s.fx + 8], [s.fx + 32, xb]] : [[xa, xb]];
      for (const [a, b] of segs) { paredeCaixa(a, zN, b - a, T, HN, chaves); if (tex) faceFundo(tex, s, a, b, wTot); }
      if (s.portaCima) { caixa(s.fx + 7, 0, zN - 0.5, 1.2, 34, T + 1, '#5c4632'); caixa(s.fx + 31.8, 0, zN - 0.5, 1.2, 34, T + 1, '#5c4632'); }
      // frente (baixa, cortada) com porta se abre para o corredor de baixo
      const zS = s.y + s.h;
      const segS = s.portaBaixo ? [[xa, s.fx + 8], [s.fx + 32, xb]] : [[xa, xb]];
      for (const [a, b] of segS) paredeCaixa(a, zS, b - a, T, HB, chaves);
      // laterais (baixas)
      paredeCaixa(s.x - T, s.fy, T, s.h - NB, HB, chaves);
      paredeCaixa(s.x + s.w, s.fy, T, s.h - NB, HB, chaves);
    }
    // pontas dos corredores à direita; à esquerda, a parede externa inteira com a entrada de vidro no primeiro corredor
    L.corredores.forEach(c => paredeCaixa(P.x + P.w - T, c.y - 16, T, c.h + 16, HB, chaves));
    const c0 = L.corredores[0], q = L.lateral;
    paredeCaixa(P.x, P.y + NB - T, T, c0.y + 12 - (P.y + NB - T), HB, chaves); paredeCaixa(P.x, c0.y + 28, T, P.y + P.h - (c0.y + 28), HB, chaves);
    if (q) {
      paredeCaixa(P.x, q.y + NB - T, q.w + 2 * T, T, HN, chaves); // fundo do corredor lateral (alto, como o das salas)
      paredeCaixa(P.x, q.y + q.h, q.w + 2 * T, T, HB, chaves);
      // faixa-guia verde no chão, da entrada até a Apresentação
      const ap = L.salas.apresentacao, yFim = ap ? ap.y - 8 : q.y + q.h - 8, gm = brilhante('#28BE52', 0.35);
      for (let y = c0.y + 30; y < yFim; y += 9) caixa(q.x + q.w / 2 - 1, 0.1, y, 2, 0.25, 5, gm, false);
    }
  }

  // ------------------------------------------------------------------ pisos, rua e jardim
  const MADEIRA = { diretoria: '#b8692f', refeitorio: '#a8652f', precificacao: '#a8652f', jogos: '#7a4c2c', rh: '#b07a4f' };
  function montarPisos(L, cfg) {
    const e = cfg.escritorio, moderno = e.modeloParede === 'janelas', P = L.predio;
    // jardim e rua
    const gm = new THREE.MeshStandardMaterial({ map: textura(texGrama(), { repetir: [(L.W + 900) / 90, (L.H + 900) / 90] }), roughness: 1 });
    plano3(-450, -450, L.W + 900, L.H + 900, gm, -0.4);
    const yb = L.rua;
    plano3(-450, yb + 11, L.W + 900, 13, mat('#c9c3b0', { roughness: 0.95 }), -0.1);
    plano3(-450, yb + 24, L.W + 900, 2, mat('#8a8fa8'), -0.08);
    const am = new THREE.MeshStandardMaterial({ map: textura(texAsfalto(), { repetir: [(L.W + 900) / 64, 6] }), roughness: 0.95 });
    plano3(-450, yb + 26, L.W + 900, 400, am, -0.12);
    for (let x = -440; x < L.W + 440; x += 22) plano3(x, yb + 36, 11, 1.6, mat('#e9e4d0'), -0.05);
    const c0 = L.corredores[0];
    plano3(0, c0.y + 14, P.x + 2, 12, mat('#9aa0b2', { roughness: 0.95 }), -0.06);
    plano3(3, c0.y + 14, 13, yb + 12 - c0.y - 14, mat('#9aa0b2', { roughness: 0.95 }), -0.07);
    // base do prédio (corredores) e pisos das salas
    const cm = new THREE.MeshStandardMaterial({ map: textura(texPorcelanato(P.w, P.h, '#d6d8d2', 40, 3)), roughness: 0.55 });
    plano3(P.x, P.y + NB - T, P.w, P.h - NB + T, cm, 0);
    for (const s of Object.values(L.salas)) {
      const h = s.h - NB;
      let c;
      if (s.id === 'zeladoria') c = texXadrez(s.w, h, '#c4cad0', '#b8bfc6', 10);
      else if (moderno && MADEIRA[s.id]) c = texMadeira(s.w, h, MADEIRA[s.id], s.x + s.y);
      else if (moderno) c = texPorcelanato(s.w, h, e.corPiso || '#d9dbd5', 26, s.x * 7 + s.y);
      else { c = KM._cena.pisoDaSala(s, e); }
      const t = textura(c, { pixel: !moderno && s.id !== 'zeladoria' });
      plano3(s.fx, s.fy, s.w, h, new THREE.MeshStandardMaterial({ map: t, roughness: MADEIRA[s.id] ? 0.7 : 0.45 }), 0.05);
    }
  }
  function arvore(x, z, rnd) {
    const h = 0.8 + rnd() * 0.5;
    cil(x, 0, z, 2.2 * h, 12 * h, '#6b4a2b', 2.8 * h);
    if (rnd() < 0.55) { for (const [y, r, hh] of [[9, 14, 22], [20, 11, 18], [30, 7.5, 14]]) malha(geo('k', r * h, hh * h, 9), mat(['#2f7d3a', '#38894a', '#2b6e34'][Math.floor(rnd() * 3)]), x, (y + hh / 2) * h, z); }
    else { malha(geo('i', 13 * h), mat(['#4c9a3f', '#3f8a37', '#57a84a'][Math.floor(rnd() * 3)]), x, 26 * h, z); malha(geo('i', 9 * h), mat('#5fb34f'), x + 5 * h, 33 * h, z - 3 * h); }
  }
  function montarJardim(L) {
    const P = L.predio, rnd = semente(77), yb = L.rua;
    const livre = (x, z) => !(x > P.x - 22 && x < P.x + P.w + 22 && z > P.y - 22 && z < yb + 8) && !(z > yb - 4 && z < yb + 34) && !(x < 30 && z > L.corredores[0].y && z < yb + 12);
    for (let i = 0; i < 160; i++) {
      const x = -260 + rnd() * (L.W + 520), z = -240 + rnd() * (yb + 240);
      if (livre(x, z)) arvore(x, z, rnd);
    }
    for (let x = -200; x < L.W + 200; x += 60) if (rnd() < 0.8) arvore(x + rnd() * 20, yb + 90 + rnd() * 60, rnd);
    // postes da rua
    for (const [x] of L.postes || []) { cil(x, 0, yb + 10, 0.9, 40, '#2b2f45'); caixa(x - 4, 40, yb + 7, 8, 2, 6, '#2b2f45'); caixa(x - 3, 39.4, yb + 8, 6, 0.6, 4, brilhante('#ffe8a3', 1.2)); piscinas.push([x, yb + 14, 0.8]); }
    // carrinho que passa na rua
    carro = new THREE.Group();
    const corpo = new THREE.Mesh(geo('b', 26, 8, 13), mat('#e03131', { roughness: 0.35, metalness: 0.3 })); corpo.position.y = 6;
    const cab = new THREE.Mesh(geo('b', 14, 6, 11), mat('#a5d8ff', { roughness: 0.1, metalness: 0.2 })); cab.position.set(-1, 13, 0);
    carro.add(corpo, cab);
    for (const [a, b] of [[-8, -6.5], [8, -6.5], [-8, 6.5], [8, 6.5]]) { const r = new THREE.Mesh(geo('c', 3, 3, 2, 12), mat('#111111')); r.rotation.x = Math.PI / 2; r.position.set(a, 3, b); carro.add(r); }
    carro.userData = { x: -300, vel: 0, prox: 2 };
    mundo.add(carro);
  }

  // ------------------------------------------------------------------ luzes (sol, céu e luminárias)
  const PER = {
    dia: { fundo: '#cfe3f3', ceu: '#ffffff', chao: '#8d9a7a', hemi: 1.15, sol: '#fff4e0', fsol: 2.3, pos: [-0.55, 1, -0.35], pisc: 0.12, gente: '#ffffff' },
    tarde: { fundo: '#2f2d55', ceu: '#ffd9b3', chao: '#4a3f55', hemi: 0.85, sol: '#ffb27a', fsol: 1.8, pos: [-1, 0.55, 0.25], pisc: 0.4, gente: '#ffe9d6' },
    noite: { fundo: '#12142b', ceu: '#9fb0ff', chao: '#1d1f35', hemi: 0.6, sol: '#9fb4ff', fsol: 0.55, pos: [-0.4, 1, -0.6], pisc: 0.85, gente: '#c9d0ff' },
  };
  let solLuz = null, hemiLuz = null, ambLuz = null;
  function montarLuzes(L, per) {
    const p = PER[per] || PER.dia, P = L.predio, cx = P.x + P.w / 2, cz = (P.y + L.rua) / 2, R = Math.max(L.W, L.H) * 0.75;
    scene.background = cor(p.fundo);
    hemiLuz = new THREE.HemisphereLight(cor(p.ceu), cor(p.chao), p.hemi); mundo.add(hemiLuz);
    ambLuz = new THREE.AmbientLight(cor(per === 'noite' ? '#ffcf8a' : '#ffffff'), per === 'noite' ? 0.35 : 0.15); mundo.add(ambLuz);
    solLuz = new THREE.DirectionalLight(cor(p.sol), p.fsol);
    solLuz.position.set(cx + p.pos[0] * 900, p.pos[1] * 900, cz + p.pos[2] * 900); solLuz.target.position.set(cx, 0, cz);
    solLuz.castShadow = true;
    const cel = window.matchMedia('(max-width: 760px)').matches;
    solLuz.shadow.mapSize.set(cel ? 1024 : 2048, cel ? 1024 : 2048);
    Object.assign(solLuz.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 10, far: 2600 });
    solLuz.shadow.bias = -0.0008; solLuz.shadow.normalBias = 0.6; solLuz.shadow.radius = 3;
    mundo.add(solLuz, solLuz.target);
    // círculo de luz quente das luminárias (no chão)
    const c = telaCv(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,214,140,1)'); gr.addColorStop(0.5, 'rgba(255,200,120,0.45)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const tm = textura(c), mm = new THREE.MeshBasicMaterial({ map: tm, transparent: true, opacity: p.pisc, blending: THREE.AdditiveBlending, depthWrite: false });
    for (const [x, z, k] of (L.luzes || []).concat(piscinas)) { const o = new THREE.Mesh(new THREE.PlaneGeometry(76 * (k || 1), 76 * (k || 1)), mm); o.rotation.x = -Math.PI / 2; o.position.set(x, 0.4, z); o.renderOrder = 3; mundo.add(o); }
  }

  // ------------------------------------------------------------------ quadros que mudam (TV, relógio, slides, PS5…)
  function montarDecorDin(L) {
    decorDin = [];
    const k = HN / 30;
    for (const d of L.decor) {
      if (!d.din) continue;
      const s = L.salas[d.sala]; if (!s) continue;
      const w = (d.w || 10) + 4, h = 20, c = telaCv(w, h), t = textura(c, { pixel: true });
      const rowTop = (d.Y - 2) - s.fy + 28, yTop = HN - (rowTop - 4) * k;
      const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h * k), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6, emissive: cor('#ffffff'), emissiveMap: t, emissiveIntensity: 0.25 }));
      o.position.set(d.X - 2 + w / 2, yTop - h * k / 2, s.fy + 0.2); mundo.add(o);
      decorDin.push({ d, c, t });
    }
  }
  function atualizarDecor(cfg, estado, t) {
    for (const q of decorDin) {
      const g = q.c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, q.c.width, q.c.height);
      g.save(); g.translate(-(q.d.X - 2), -(q.d.Y - 2));
      try { KM._cena.desenharDecorDin(g, q.d, cfg, estado, t); } catch (e) { /* ok */ }
      g.restore(); q.t.needsUpdate = true;
    }
  }

  // ------------------------------------------------------------------ montar tudo
  function limpar() {
    if (mundo) { scene.remove(mundo); mundo.traverse(o => { if (o.geometry && ![...cache.geo.values()].includes(o.geometry)) o.geometry.dispose(); }); }
    for (const t of texturas) t.dispose();
    texturas = []; telas = []; piscinas = []; decorDin = [];
    for (const [, o] of pessoas) { scene.remove(o.m, o.sh); o.tex.dispose(); }
    pessoas.clear(); anelSel = null;
  }
  function montar(cfg) {
    const L = KM.LAYOUT; if (!L) return;
    limpar();
    mundo = new THREE.Group(); scene.add(mundo);
    const per = KM.periodo(cfg); chavePer = per;
    montarPisos(L, cfg);
    montarParedes(L, cfg);
    const e = cfg.escritorio;
    for (const m of L.moveis) { try { construirMovel(m, e); } catch (x) { /* um móvel com problema não derruba o resto */ } }
    montarJardim(L);
    montarLuzes(L, per);
    montarDecorDin(L);
    if (KM.festas) try { KM.festas.montar3D({ THREE, mundo, caixa, cil, bola, brilhante, mat, L, HN, texturas }); } catch (x) { console.warn('decoração 3D', x); }
    anelSel = new THREE.Mesh(new THREE.RingGeometry(7, 10, 28), new THREE.MeshBasicMaterial({ color: cor('#28BE52'), transparent: true, opacity: 0.8, depthWrite: false }));
    anelSel.rotation.x = -Math.PI / 2; anelSel.visible = false; anelSel.renderOrder = 4; scene.add(anelSel);
    if (!D3.camPronta) { const d = L.salas.diretoria, cel = window.matchMedia('(max-width: 760px)').matches; D3.cam.focar(d.x + (cel ? 20 : 140), d.fy + (cel ? 60 : 120), cel ? 0.8 : 1); }
    D3.sujo = false; tDecor = 0;
    renderer.shadowMap.needsUpdate = true;
  }

  // ------------------------------------------------------------------ pessoas (o boneco de sempre, em pé na cena)
  const praCamera = () => new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));
  let geoPessoa = null, geoSombra = null, matSombra = null;
  function pessoa3D(p) {
    let o = pessoas.get(p.id);
    if (o) return o;
    if (!geoPessoa) {
      geoPessoa = new THREE.PlaneGeometry(30, 46 * KV); geoPessoa.translate(0, 46 * KV / 2, 0);
      geoSombra = new THREE.CircleGeometry(7, 20); matSombra = new THREE.MeshBasicMaterial({ color: 0x141632, transparent: true, opacity: 0.28, depthWrite: false });
    }
    const c = telaCv(30, 46), tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(geoPessoa, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide }));
    m.rotation.y = AZ; m.renderOrder = 2;
    const sh = new THREE.Mesh(geoSombra, matSombra); sh.rotation.x = -Math.PI / 2; sh.renderOrder = 1;
    scene.add(m, sh);
    o = { m, sh, c, tex, chave: null };
    pessoas.set(p.id, o);
    return o;
  }
  function atualizarPessoas(cfg, estado, t) {
    const pc = praCamera(), vivos = new Set(), tinta = cor((PER[chavePer] || PER.dia).gente);
    let sel = null;
    for (const p of Object.values(estado.pessoas || {})) {
      const o = pessoa3D(p); vivos.add(p.id);
      const vis = p.visivel !== false && !estado.jogando;
      o.m.visible = vis; o.sh.visible = vis && !(p.modo === 'sentado' || p.modo === 'sentado-mesa');
      if (!vis) continue;
      const ap = KM.aparenciaDe(cfg, p.id), est = KM.estDe(p, t), s = KM.sprite(ap, est), esp = KM.vistaDe(KM.dirVisivel(p)).espelho;
      if (o.chave !== s || o.esp !== esp) {
        const g = o.c.getContext('2d'); g.clearRect(0, 0, 30, 46);
        if (esp) { g.save(); g.translate(30, 0); g.scale(-1, 1); g.drawImage(s, 0, 0); g.restore(); } else g.drawImage(s, 0, 0);
        o.tex.needsUpdate = true; o.chave = s; o.esp = esp;
      }
      o.m.material.color.copy(tinta);
      o.m.material.opacity = p.opacidade !== undefined ? p.opacidade : 1;
      const sentado = p.modo === 'sentado' || p.modo === 'sentado-mesa', puxa = sentado ? 9 : 6;
      o.m.position.set(p.X + pc.x * puxa, (p.Z || 0) + pc.y * puxa, p.Y + pc.z * puxa);
      o.sh.position.set(p.X, 0.5, p.Y); o.sh.scale.setScalar((p.Z || 0) > 0 ? 0.6 : 1);
      // crachá e balão (HTML) acompanham a cabeça
      const [ax, ay] = KM.ancora(p), topo = ay + (sentado ? 2 : 1) - 46;
      p.cabecaTela = KM.paraTela(ax, topo + 7 + (ap.altura === 'baixo' ? 4 : 0) - (sentado ? 0 : 0));
      if (p.selecionado) sel = p;
    }
    for (const [id, o] of pessoas) if (!vivos.has(id)) { scene.remove(o.m, o.sh); o.tex.dispose(); pessoas.delete(id); }
    if (anelSel) { anelSel.visible = !!sel && sel.visivel !== false; if (sel) { anelSel.position.set(sel.X, 0.6, sel.Y); anelSel.material.opacity = 0.55 + 0.3 * Math.sin(t * 5); } }
  }

  // ------------------------------------------------------------------ desenhar um quadro
  D3.render = function (ctx, cfg, estado, t) {
    if (!D3.ok) return;
    const L = KM.LAYOUT; if (!L) return;
    if (D3.sujo || chavePer !== KM.periodo(cfg)) montar(cfg);
    cv3.style.display = '';
    // tamanho do desenho = tamanho do palco na tela
    const w = cv3.clientWidth, h = cv3.clientHeight;
    if (w && h && (cv3.width !== Math.round(w * renderer.getPixelRatio()) || cv3.height !== Math.round(h * renderer.getPixelRatio()))) renderer.setSize(w, h, false);
    atualizarCamera();
    // telas acesas: verde quando a pessoa daquela mesa está trabalhando
    const trab = new Set(Object.values(estado.pessoas || {}).filter(p => p.trabalhando || p.digitando || p.tarefaRH).map(p => p.funcao));
    for (const q of telas) q.m.emissive.set(trab.has(q.funcao) || q.funcao === 'exec' ? '#7dffb0' : '#3b8cff');
    if (t - tDecor > 0.6) { tDecor = t; atualizarDecor(cfg, estado, t); }
    // carro na rua
    if (carro) {
      const u = carro.userData, dt = D3._dt || 0.016;
      if (!u.vel) { u.prox -= dt; if (u.prox <= 0) { u.vel = Math.random() < 0.5 ? 60 : -60; u.x = u.vel > 0 ? -320 : L.W + 320; carro.children[0].material = mat(['#e03131', '#1971c2', '#ffd43b', '#f8f9fa', '#2f9e44', '#212529'][Math.floor(Math.random() * 6)], { roughness: 0.35, metalness: 0.3 }); } }
      else { u.x += u.vel * dt; if (u.x < -340 || u.x > L.W + 340) { u.vel = 0; u.prox = 6 + Math.random() * 10; } }
      carro.visible = !!u.vel; carro.position.set(u.x, 0, L.rua + (u.vel > 0 ? 50 : 38)); carro.rotation.y = u.vel < 0 ? Math.PI : 0;
    }
    atualizarPessoas(cfg, estado, t);
    if (KM.festas) KM.festas.animar3D(t);
    renderer.render(scene, camera);
    // por cima (2D): pratos, entregador, clientes da recepção, o carro da KWIK, efeitos dos módulos
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, KM.W, KM.H);
    const z = D3.z; ctx.setTransform(z, 0, 0, z, 0, 0); ctx.imageSmoothingEnabled = z < 0.97;
    const lista = [];
    for (const x of estado.extras || []) lista.push({ p: (x.X != null ? x.X : L.W / 2) + (x.Y != null ? x.Y : x.p), f: c => (x.X != null ? KM.bb(c, x.X, x.Y, () => x.f(c, t)) : x.f(c, t)) });
    for (const o of KM.objetos || []) { const X = o.X != null ? o.X : L.W / 2, Y = o.Y != null ? o.Y : o.p; lista.push({ p: X + Y, f: c => (o.X != null && !o.proprio ? KM.bb(c, o.X, Y, () => o.f(c, t)) : o.f(c, t)) }); }
    lista.sort((a, b) => a.p - b.p);
    for (const o of lista) { try { o.f(ctx); } catch (e) { /* segue */ } }
  };
})();
