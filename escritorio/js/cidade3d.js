/* KWIK Mini Escritório · Bairro dos clientes em 3D (de dia).
   Só o prédio da KWIK no meio e, em volta da praça, um prédio para cada cliente ativo, com a cara da atividade:
   consultório odontológico com um dente gigante, clínica com a cruz, nutrição com a maçã, estética rosa com flores,
   restaurante com toldo listrado e mesinhas, loja com vitrine e sacola, academia com o haltere e escritório de vidro.
   Arrastar (um dedo ou o mouse) gira o bairro, pinça/rodinha dá zoom, tocar num prédio (ou no nome embaixo) abre tudo
   do cliente. Usa o mesmo Three.js do escritório 3D; sem WebGL, o botão Cliente abre a cidade desenhada de antes. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const CF = () => KM.clientesFora;
  const $ = s => document.querySelector(s);
  const el = (...a) => A().el(...a);
  const URL3 = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
  let THREE = null, renderer = null, scene = null, camera = null, ray = null, cv = null, raf = 0, aberta = false, assinatura = '';
  let predios = [], selecionado = null, marcador = null, anel = null, tAnt = 0, ultimoDesenho = 0, mexendo = 0;
  const cam = { alvo: { x: 0, z: 0 }, raio: 520, theta: 0.6, phi: 0.95, auto: true, voo: null };
  const semente = n => { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const brl0 = v => 'R$ ' + Math.round(+v || 0).toLocaleString('pt-BR');
  let falhou = false;
  const disponivel = () => !falhou && (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();

  // ------------------------------------------------------------------ tela (por cima de tudo)
  function montarDom() {
    if ($('#cidade3d')) return;
    const box = el('div', { id: 'cidade3d', class: 'cid3d', hidden: true });
    box.innerHTML = `<canvas id="cid3dTela"></canvas>
      <div class="cid-topo"><div class="cid-tit"><b>🏘️ Bairro dos clientes</b><small>Toque num prédio ou num nome lá embaixo</small></div><div class="cid-ticker" id="cidTicker"></div>
        <div class="cid-bts"><label class="cid-bt" title="Ler a validade dos certificados (.pfx), sem senha">📜<span> Certificados</span><input type="file" id="cidCert" accept=".pfx,.p12" multiple hidden></label>
        <button class="cid-bt" id="cidVer" title="Ver o bairro inteiro">⤢</button><button class="cid-bt verde" id="cidVoltar">🏢 Voltar</button></div></div>
      <div class="cid-rotulo" id="cidRotulo" hidden></div>
      <aside class="cid-painel" id="cidPainel" hidden><button class="cid-x" id="cidFechar" title="Fechar">×</button><div id="cidInfo"></div></aside>
      <div class="cid-chips" id="cidChips"></div>`;
    document.body.append(box);
    cv = $('#cid3dTela');
    $('#cidVoltar').addEventListener('click', fechar);
    $('#cidFechar').addEventListener('click', () => selecionar(null));
    $('#cidVer').addEventListener('click', () => { selecionar(null); verTudo(); });
    $('#cidCert').addEventListener('change', e => CF().lerCertificados([...e.target.files]).finally(() => { e.target.value = ''; }));
    ligarControles();
  }
  async function abrir() {
    montarDom();
    const box = $('#cidade3d');
    box.hidden = false; aberta = true; document.body.classList.add('cidade-aberta');
    $('#cidTicker').textContent = 'Carregando os clientes…';
    try {
      if (!THREE) THREE = await import(URL3);
      if (!renderer) iniciarGL();
    } catch (e) { console.warn('KWIK bairro 3D', e); falhou = true; fechar(true); return CF().abrir(); }
    CF().montarDlg();
    await CF().carregarDados();
    CF().montarCena(true);
    construir();
    tAnt = performance.now(); mexendo = performance.now() + 2500;
    if (!raf) raf = requestAnimationFrame(quadro);
  }
  function fechar(semVoltar) {
    const box = $('#cidade3d'); if (box) box.hidden = true;
    aberta = false; document.body.classList.remove('cidade-aberta');
    cancelAnimationFrame(raf); raf = 0;
    const c = CF()._cena; c.dentro = null; c.kaua = null; c.sel = null;
    if (semVoltar !== true) CF().voltar();
  }
  function iniciarGL() {
    const celular = window.matchMedia('(max-width: 760px)').matches;
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !celular, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(celular ? 1.25 : 1.5, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 5, 6000);
    ray = new THREE.Raycaster();
  }

  // ------------------------------------------------------------------ peças
  const cacheMat = new Map();
  const mat = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); let m = cacheMat.get(k); if (!m) { m = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {})); cacheMat.set(k, m); } return m; };
  const vidro = () => mat('#9fd3ff', { roughness: 0.12, metalness: 0.35, emissive: '#3a78b8', emissiveIntensity: 0.18 });
  function bx(g, x, y, z, w, h, d, c, sombra = true) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'string' ? mat(c) : c); m.position.set(x, y + h / 2, z); m.castShadow = sombra; m.receiveShadow = true; g.add(m); return m; }
  function cl(g, x, y, z, r, h, c, r2, seg = 20) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r2 != null ? r2 : r, r, h, seg), typeof c === 'string' ? mat(c) : c); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }
  function sf(g, x, y, z, r, c) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), typeof c === 'string' ? mat(c) : c); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; }
  // janelas na frente (z+) de uma caixa
  function janelas(g, cx, y0, zf, larg, andares, cols, alt = 9) {
    const vm = vidro(), passo = larg / cols;
    for (let a = 0; a < andares; a++) for (let c = 0; c < cols; c++) bx(g, cx - larg / 2 + passo * (c + 0.5) - (passo * 0.6) / 2, y0 + a * (alt + 5), zf, passo * 0.6, alt, 0.8, vm, false);
  }
  function porta(g, x, zf, cor = '#5c3d2e') { bx(g, x - 5, 0, zf, 10, 16, 1, cor, false); bx(g, x - 6, 16, zf, 12, 1.5, 1.4, '#dee2e6', false); }
  function placaTexto(txt, cor = '#1c2b26', fundo = '#ffffff', larg = 60) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const g = c.getContext('2d'); g.fillStyle = fundo; g.beginPath(); g.roundRect(4, 4, 504, 120, 30); g.fill();
    g.fillStyle = cor; g.font = '900 64px Montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let s = String(txt).toUpperCase(); while (g.measureText(s).width > 470 && s.length > 4) s = s.slice(0, -2) + '…';
    g.fillText(s, 256, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(larg, larg / 4), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }));
    return m;
  }
  function nomeFlutuante(txt, cor) {
    const c = document.createElement('canvas'); c.width = 768; c.height = 112;
    const g = c.getContext('2d'); g.font = '800 46px Montserrat, sans-serif';
    let s = String(txt); while (g.measureText(s).width > 680 && s.length > 4) s = s.slice(0, -2) + '…';
    const w = Math.min(760, g.measureText(s).width + 56);
    g.fillStyle = 'rgba(255,255,255,0.94)'; g.beginPath(); g.roundRect(384 - w / 2, 8, w, 84, 42); g.fill();
    g.fillStyle = cor; g.beginPath(); g.arc(384 - w / 2 + 30, 50, 11, 0, 7); g.fill();
    g.fillStyle = '#16211d'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 384 + 10, 52);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); sp.scale.set(108, 15.75, 1); sp.renderOrder = 5;
    return sp;
  }
  function arvore(g, x, z, rnd) {
    const h = 0.8 + rnd() * 0.5;
    cl(g, x, 0, z, 1.8 * h, 10 * h, '#7a5432', 2.2 * h, 8);
    if (rnd() < 0.5) for (const [y, r, hh] of [[8, 11, 18], [17, 8, 15]]) { const m = new THREE.Mesh(new THREE.ConeGeometry(r * h, hh * h, 8), mat('#3c9a4a')); m.position.set(x, (y + hh / 2) * h, z); m.castShadow = true; g.add(m); }
    else { sf(g, x, 20 * h, z, 10 * h, ['#5cb85c', '#4fa84f', '#69c46a'][Math.floor(rnd() * 3)]); sf(g, x + 4 * h, 26 * h, z - 2 * h, 7 * h, '#73cf6f'); }
  }
  function canteiro(g, x, z, c = '#ff6b9a') { bx(g, x - 6, 0, z - 2, 12, 3, 4, '#b5532f'); for (let i = 0; i < 4; i++) sf(g, x - 4.5 + i * 3, 4.5, z, 1.8, i % 2 ? c : '#ffd43b'); }

  // ------------------------------------------------------------------ prédios por atividade (frente virada para +z)
  const COR_MODELO = { odonto: '#15aabf', nutricao: '#37b24d', estetica: '#e64980', clinica: '#e03131', restaurante: '#f76707', loja: '#7048e8', academia: '#f59f00', escritorio: '#3b5bdb' };
  const MODELOS3D = {
    odonto(g) { // consultório branco com faixa turquesa e um dente gigante no telhado
      bx(g, 0, 0, 0, 52, 30, 38, '#f8f9fa'); bx(g, 0, 22, 0.2, 52.4, 4, 38.4, '#15aabf'); janelas(g, 12, 7, 19.2, 22, 1, 2, 11); porta(g, -12, 19.2, '#99e9f2');
      const d = new THREE.Group(); sf(d, -3.5, 13, 0, 6.5, '#ffffff'); sf(d, 3.5, 13, 0, 6.5, '#ffffff'); bx(d, 0, 4, 0, 13, 9, 9, '#ffffff'); cl(d, -3.5, -3, 0, 1.4, 8, '#ffffff', 2.6, 10); cl(d, 3.5, -3, 0, 1.4, 8, '#ffffff', 2.6, 10);
      d.position.set(0, 36, 0); g.add(d); return d;
    },
    clinica(g) { // clínica branca com a cruz vermelha
      bx(g, 0, 0, 0, 56, 34, 40, '#f1f3f5'); janelas(g, 0, 8, 20.2, 46, 2, 4, 8); porta(g, 0, 20.2, '#74c0fc'); bx(g, -16, 0, 22, 32, 1.5, 6, '#adb5bd', false);
      const d = new THREE.Group(); bx(d, 0, 0, 0, 20, 6, 4, '#e03131'); bx(d, 0, -7, 0, 6, 20, 4, '#e03131'); d.position.set(0, 44, 0); g.add(d); return d;
    },
    nutricao(g) { // casinha verde com telhado e uma maçã gigante
      bx(g, 0, 0, 0, 48, 24, 36, '#d3f9d8'); const t = new THREE.Mesh(new THREE.CylinderGeometry(0, 38, 16, 4), mat('#2b8a3e')); t.position.set(0, 32, 0); t.rotation.y = Math.PI / 4; t.scale.set(1, 1, 0.75); t.castShadow = true; g.add(t);
      janelas(g, 10, 6, 18.2, 20, 1, 2, 10); porta(g, -12, 18.2, '#8d5a3b'); canteiro(g, -14, 24, '#ff8787'); canteiro(g, 14, 24, '#ffa94d');
      const d = new THREE.Group(); sf(d, 0, 0, 0, 8, '#e03131'); cl(d, 0, 7, 0, 0.8, 4, '#5c3d2e', 0.8, 6); const f = sf(d, 3, 10, 0, 2.6, '#40c057'); f.scale.set(1.6, 0.6, 1); d.position.set(0, 50, 0); g.add(d); return d;
    },
    estetica(g) { // salão redondo rosa, toldo branco e flores
      cl(g, 0, 0, 0, 24, 26, '#ffdeeb', 24, 28); cl(g, 0, 26, 0, 26, 3, '#e64980', 26, 28); bx(g, 0, 15, 24, 26, 2, 8, '#ffffff'); porta(g, 0, 23.6, '#f783ac');
      canteiro(g, -16, 26, '#e64980'); canteiro(g, 16, 26, '#f783ac');
      const d = new THREE.Group(); for (let i = 0; i < 6; i++) { const p = sf(d, Math.cos(i * 1.047) * 5, 0, Math.sin(i * 1.047) * 5, 4, '#f783ac'); p.scale.set(1, 0.45, 1); } sf(d, 0, 1.2, 0, 3.4, '#ffd43b'); d.position.set(0, 34, 0); g.add(d); return d;
    },
    restaurante(g) { // restaurante com toldo listrado, mesinhas com guarda-sol e o chapéu de cozinheiro
      bx(g, 0, 0, 0, 54, 26, 36, '#fff4e6'); bx(g, 0, 26, 0, 56, 3, 38, '#c92a2a'); janelas(g, 12, 6, 18.2, 22, 1, 2, 11); porta(g, -14, 18.2, '#8d5a3b');
      for (let i = 0; i < 9; i++) { const f = bx(g, -24 + i * 6, 17, 22, 6, 1.2, 10, i % 2 ? '#ffffff' : '#e03131', false); f.rotation.x = 0.35; }
      for (const x of [-16, 16]) { cl(g, x, 0, 34, 4, 7, '#f8f9fa', 4); cl(g, x, 0, 34, 0.5, 18, '#868e96'); const u = new THREE.Mesh(new THREE.ConeGeometry(9, 4, 8), mat(x < 0 ? '#ffa94d' : '#e03131')); u.position.set(x, 19, 34); u.castShadow = true; g.add(u); }
      const d = new THREE.Group(); cl(d, 0, 0, 0, 6, 6, '#ffffff', 6); sf(d, -3, 9, 0, 4.5, '#ffffff'); sf(d, 3, 9, 0, 4.5, '#ffffff'); sf(d, 0, 11, 0, 5, '#ffffff'); d.position.set(0, 30, 0); g.add(d); return d;
    },
    loja(g) { // loja com vitrine grande, toldo roxo e sacola de compras
      bx(g, 0, 0, 0, 54, 28, 36, '#f3f0ff'); bx(g, 0, 2, 18.2, 46, 16, 0.8, vidro(), false); bx(g, 0, 19, 21, 50, 1.5, 8, '#7048e8', false); porta(g, 20, 18.6, '#5f3dc4');
      for (let i = 0; i < 4; i++) cl(g, -16 + i * 9, 2, 14, 2, 8 + (i % 2) * 3, ['#ffd43b', '#ff8787', '#69db7c', '#74c0fc'][i]);
      const d = new THREE.Group(); bx(d, 0, 0, 0, 16, 16, 6, '#7048e8'); const a = new THREE.Mesh(new THREE.TorusGeometry(4, 0.9, 8, 18, Math.PI), mat('#ffd43b')); a.position.set(0, 16, 0); d.add(a); d.position.set(0, 30, 0); g.add(d); return d;
    },
    academia(g) { // galpão grafite com portão de enrolar e o haltere amarelo
      bx(g, 0, 0, 0, 58, 30, 40, '#343a40'); bx(g, 0, 30, 0, 60, 2, 42, '#f59f00'); bx(g, -8, 0, 20.2, 26, 20, 0.8, '#868e96', false); for (let k = 1; k < 8; k++) bx(g, -8, k * 2.5, 20.8, 26, 0.4, 0.4, '#495057', false); porta(g, 18, 20.2, '#f59f00');
      const d = new THREE.Group(); const b = cl(d, 0, -1, 0, 1.2, 30, '#adb5bd', 1.2, 10); b.rotation.z = Math.PI / 2; b.position.set(0, 0, 0); for (const x of [-13, -9, 9, 13]) { const p = cl(d, x, -1, 0, Math.abs(x) > 10 ? 6 : 8, 3, '#f59f00', null, 18); p.rotation.z = Math.PI / 2; p.position.set(x, 0, 0); } d.position.set(0, 42, 0); g.add(d); return d;
    },
    escritorio(g) { // prédio de escritórios de vidro azul com a maleta
      bx(g, 0, 0, 0, 44, 66, 34, '#dbe4ff'); for (let a = 0; a < 5; a++) bx(g, 0, 6 + a * 12, 17.2, 40, 8, 0.8, vidro(), false); porta(g, 0, 17.2, '#364fc7'); bx(g, 0, 66, 0, 46, 3, 36, '#3b5bdb');
      const d = new THREE.Group(); bx(d, 0, 0, 0, 16, 11, 5, '#5c3d2e'); const a = new THREE.Mesh(new THREE.TorusGeometry(3, 0.8, 8, 16, Math.PI), mat('#3b2a20')); a.position.set(0, 11, 0); d.add(a); bx(d, 0, 5, 2.6, 16, 1, 0.5, '#e2b33c'); d.position.set(0, 76, 0); g.add(d); return d;
    },
  };
  // o prédio da KWIK (o nosso escritório)
  function predioKwik(g) {
    bx(g, 0, 0, 0, 120, 46, 70, '#f8faf8');
    for (let a = 0; a < 2; a++) bx(g, 0, 8 + a * 18, 35.2, 108, 12, 0.8, vidro(), false);
    bx(g, 0, 44, 0, 124, 4, 74, '#1E8A45'); bx(g, 0, 21, 35.4, 120, 2, 0.6, '#28BE52', false);
    bx(g, -46, 0, 35.2, 18, 18, 0.9, vidro(), false); bx(g, -46, 18, 38, 24, 1.5, 8, '#1E8A45', false);
    const p = placaTexto('KWIK', '#ffffff', '#1E8A45', 56); p.position.set(18, 56, 0); g.add(p);
    bx(g, 18, 48, -1, 4, 8, 2, '#1E8A45');
    const p2 = placaTexto('Contabilidade', '#1E8A45', '#ffffff', 46); p2.position.set(18, 41, 35.9); g.add(p2);
    // carro da KWIK estacionado
    const c = new THREE.Group(); bx(c, 0, 2, 0, 24, 8, 12, '#ffffff'); bx(c, -1, 10, 0, 13, 6, 10.5, vidro()); bx(c, 0, 5, 6.1, 24, 1.6, 0.3, '#28BE52', false);
    for (const [x, z] of [[-8, -6], [8, -6], [-8, 6], [8, 6]]) { const r = cl(c, x, 0, z, 3, 2.2, '#212529', 3, 12); r.rotation.x = Math.PI / 2; r.position.y = 3; }
    c.position.set(40, 0, 58); g.add(c);
    canteiro(g, -20, 40, '#28BE52'); canteiro(g, 0, 40, '#ffd43b');
  }

  // ------------------------------------------------------------------ montar o bairro
  let grupoBairro = null;
  function construir() {
    const cs = CF()._cena.lotes, sig = cs.map(l => l.c.chave + ':' + l.c.modelo).join('|');
    atualizarTicker(); montarChips();
    if (sig === assinatura && grupoBairro) return;
    assinatura = sig;
    if (grupoBairro) { scene.remove(grupoBairro); grupoBairro.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material && x.material.map) x.material.map.dispose(); }); }
    grupoBairro = new THREE.Group(); scene.add(grupoBairro);
    predios = []; selecionado = null;
    const G = grupoBairro, rnd = semente(2026);
    scene.background = new THREE.Color('#cde9ff'); scene.fog = new THREE.Fog('#cde9ff', 900, 2400);
    G.add(new THREE.HemisphereLight('#ffffff', '#8fbf6f', 1.15));
    const sol = new THREE.DirectionalLight('#fff3dc', 2.3); sol.position.set(-260, 420, 220); sol.castShadow = true;
    const n = cs.length, R = Math.max(190, (n * 92) / (2 * Math.PI)), lim = R + 140;
    sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -lim, right: lim, top: lim, bottom: -lim, near: 10, far: 1400 }); sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.5;
    G.add(sol, sol.target);
    // grama, praça, rua em anel e calçadas
    const chao = new THREE.Mesh(new THREE.CircleGeometry(lim + 700, 64), mat('#8fd17a', { roughness: 1 })); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; G.add(chao);
    const anelRua = (r1, r2, c, y) => { const m = new THREE.Mesh(new THREE.RingGeometry(r1, r2, 96), mat(c, { roughness: 0.95 })); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; G.add(m); };
    anelRua(R - 92, R - 50, '#e9e4d8', 0.2); anelRua(R - 86, R - 56, '#5b6170', 0.3);
    for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2, f = new THREE.Mesh(new THREE.PlaneGeometry(2, 8), mat('#fff3bf')); f.rotation.x = -Math.PI / 2; f.rotation.z = -a; f.position.set(Math.sin(a) * (R - 71), 0.4, Math.cos(a) * (R - 71)); G.add(f); }
    const praca = new THREE.Mesh(new THREE.CircleGeometry(R - 92, 64), mat('#d8e8d0', { roughness: 1 })); praca.rotation.x = -Math.PI / 2; praca.position.y = 0.15; praca.receiveShadow = true; G.add(praca);
    // KWIK no meio
    { const g = new THREE.Group(); predioKwik(g); g.rotation.y = 0.35; G.add(g); predios.push({ g, hq: true, x: 0, z: 0, h: 56 }); }
    // clientes em volta, de frente para a praça
    cs.forEach((l, i) => {
      const c = l.c, a = (i / Math.max(1, n)) * Math.PI * 2 + 0.3, x = Math.sin(a) * R, z = Math.cos(a) * R;
      const g = new THREE.Group(), f = MODELOS3D[c.modelo] || MODELOS3D.escritorio, sinal = f(g);
      g.position.set(x, 0, z); g.rotation.y = Math.atan2(-x, -z); G.add(g);
      // caminho da calçada até a porta
      const cam0 = new THREE.Mesh(new THREE.PlaneGeometry(10, 34), mat('#e9e4d8')); cam0.rotation.x = -Math.PI / 2; cam0.position.set(0, 0.25, 34); g.add(cam0);
      const cor = COR_MODELO[c.modelo] || '#3b5bdb', alto = c.modelo === 'escritorio' ? 96 : 66;
      const nome = nomeFlutuante(c.nomeCurto || c.nome, cor); nome.position.set(x, alto, z); G.add(nome);
      predios.push({ g, i, c, x, z, h: alto - 14, cor, sinal, nome });
    });
    // árvores do lado de fora e algumas na praça
    for (let k = 0; k < 70; k++) { const a = rnd() * Math.PI * 2, r = R + 70 + rnd() * 220; arvore(G, Math.sin(a) * r, Math.cos(a) * r, rnd); }
    for (let k = 0; k < 10; k++) { const a = rnd() * Math.PI * 2, r = 95 + rnd() * Math.max(10, R - 200); if (r < R - 100) arvore(G, Math.sin(a) * r, Math.cos(a) * r, rnd); }
    // marcador da seleção: seta verde girando e anel no chão
    marcador = new THREE.Mesh(new THREE.ConeGeometry(6, 13, 4), mat('#28BE52', { emissive: '#1E8A45', emissiveIntensity: 0.6 })); marcador.rotation.x = Math.PI; marcador.visible = false; G.add(marcador);
    anel = new THREE.Mesh(new THREE.RingGeometry(40, 46, 48), new THREE.MeshBasicMaterial({ color: '#28BE52', transparent: true, opacity: 0.7, depthWrite: false })); anel.rotation.x = -Math.PI / 2; anel.position.y = 0.6; anel.visible = false; G.add(anel);
    cam.raioTudo = R * 2.3 + 140;
    verTudo(true);
    renderer.shadowMap.needsUpdate = true;
  }
  function verTudo(ja) { const alvo = { x: 0, z: 0, r: cam.raioTudo || 600, p: 0.92 }; if (ja) { cam.alvo.x = 0; cam.alvo.z = 0; cam.raio = alvo.r; cam.phi = alvo.p; } else voar(0, 0, alvo.r, alvo.p); cam.auto = true; }

  // ------------------------------------------------------------------ informações
  function atualizarTicker() {
    const cs = CF()._cena.lotes.map(l => l.c);
    let honor = 0, venc = 0, cert = 0;
    for (const c of cs) {
      honor += +c.valor || 0;
      const R = CF().resumoCliente(c); if (R.fiscal) venc += R.fiscal.qVencido || 0;
      const v = c.info && c.info.cert && c.info.cert.validade; if (v && (new Date(v + 'T12:00:00') - Date.now()) / 864e5 <= 30) cert++;
    }
    const t = $('#cidTicker'); if (!t) return;
    t.innerHTML = '';
    t.append(...[el('span', {}, el('b', {}, String(cs.length)), ` cliente${cs.length === 1 ? '' : 's'}`),
      honor ? el('span', {}, el('b', { class: 'v' }, brl0(honor)), '/mês') : null,
      el('span', { class: venc ? 'mal' : 'bem' }, venc ? `🔴 ${venc} guia${venc > 1 ? 's' : ''} vencida${venc > 1 ? 's' : ''}` : '🟢 impostos em dia'),
      cert ? el('span', { class: 'mal' }, `📜 ${cert} certificado${cert > 1 ? 's' : ''} vencendo`) : null].filter(Boolean));
  }
  function montarChips() {
    const box = $('#cidChips'); if (!box) return; box.innerHTML = '';
    const cs = CF()._cena.lotes;
    box.append(el('button', { class: 'cid-chip kwik', onclick: () => { selecionar(null); verTudo(); } }, '🏢 KWIK'));
    cs.forEach((l, i) => { const M = CF().MODELOS[l.c.modelo] || {}; box.append(el('button', { class: 'cid-chip', 'data-i': i, onclick: () => selecionar(predios.find(p => p.i === i)) }, `${M.ic || '🏢'} ${l.c.nomeCurto || l.c.nome}`)); });
    if (!cs.length) box.append(el('span', { class: 'cid-vazio' }, 'Nenhum cliente ativo: conecte o KWIK Fiscal/Folha ou cadastre em Configurações → Clientes ativos.'));
  }
  function painel(conteudo) { const p = $('#cidPainel'), box = $('#cidInfo'); p.hidden = false; box.innerHTML = ''; conteudo(box); p.scrollTop = 0; }
  function selecionar(p) {
    const C = CF()._cena;
    selecionado = p && !p.hq ? p : null;
    marcador.visible = anel.visible = !!selecionado;
    document.querySelectorAll('.cid-chip').forEach(b => b.classList.toggle('on', !!selecionado && +b.dataset.i === selecionado.i));
    if (!selecionado) { C.dentro = null; C.kaua = null; C.sel = null; $('#cidPainel').hidden = true; return; }
    KM.tocar && KM.tocar('clique');
    anel.position.x = p.x; anel.position.z = p.z;
    const lote = C.lotes[p.i]; C.sel = lote; C.dentro = lote; C.kaua = { x: 0, y: 0, vis: false, aceno: true };
    setTimeout(() => { if (C.kaua) C.kaua.aceno = false; }, 1800);
    const dono = lote.pessoas && lote.pessoas.find(q => q.papel === 'dono');
    if (dono) { dono.aceno = performance.now() + 2600; dono.fala = `OI, ${KM.nomeDe ? KM.nomeDe('noticias').toUpperCase() : 'KAUA'}!`; dono.falaAte = performance.now() + 3200; }
    painel(b => {
      const c = p.c, M = CF().MODELOS[c.modelo] || {}, R = CF().resumoCliente(c), cert = c.info && c.info.cert;
      const d = cert && cert.validade ? Math.round((new Date(cert.validade + 'T12:00:00') - Date.now()) / 864e5) : null;
      b.append(el('p', { class: 'cid-sub' }, `${M.ic || '🏢'} ${M.nome || ''}${c.regime ? ' · ' + c.regime : ''}`),
        el('div', { class: 'cid-tiles' },
          el('div', {}, el('small', {}, 'Honorário'), el('b', {}, c.valor ? brl0(c.valor) : '—')),
          el('div', { class: R.fiscal && R.fiscal.qVencido ? 'mal' : '' }, el('small', {}, 'Guias vencidas'), el('b', {}, R.fiscal ? String(R.fiscal.qVencido) : '—')),
          el('div', {}, el('small', {}, 'Na folha'), el('b', {}, R.folha ? String(R.folha.ativos) : String((c.equipe || []).length || '—'))),
          el('div', { class: d != null && d < 30 ? 'mal' : '' }, el('small', {}, 'Certificado'), el('b', {}, d == null ? '—' : d < 0 ? 'vencido' : `${d} dias`))));
      const info = el('div'); b.append(info);
      CF().renderInfo(c, false, info);
    });
    const celular = window.matchMedia('(max-width: 760px)').matches;
    // chega perto, de frente para a porta (o prédio fica um pouco acima do painel no celular)
    const ang = Math.atan2(-p.x, -p.z); // a câmera fica do lado da praça, olhando a fachada
    cam.auto = false; voar(p.x, p.z, celular ? 330 : 290, 0.95, ang);
    const chip = document.querySelector(`.cid-chip[data-i="${p.i}"]`); if (chip) chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }
  function voar(x, z, raio, phi, theta) {
    let th = theta != null ? theta : cam.theta;
    while (th - cam.theta > Math.PI) th -= Math.PI * 2; while (th - cam.theta < -Math.PI) th += Math.PI * 2;
    cam.voo = { de: { x: cam.alvo.x, z: cam.alvo.z, r: cam.raio, p: cam.phi, t: cam.theta }, para: { x, z, r: raio, p: phi, t: th }, t: 0 };
  }
  function atualizar() { if (!aberta) return; CF().montarCena(true); const ch = selecionado && selecionado.c.chave; construir(); if (ch) { const p = predios.find(q => q.c && q.c.chave === ch); if (p) selecionar(p); } }

  // ------------------------------------------------------------------ controles: arrastar gira, pinça/rodinha dá zoom, tocar escolhe
  function ligarControles() {
    const ptrs = new Map(); let ultimo = null, moveu = 0, dist0 = 0;
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('pointerdown', e => { try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } ptrs.set(e.pointerId, [e.clientX, e.clientY]); ultimo = [e.clientX, e.clientY]; moveu = 0; dist0 = 0; cam.auto = false; cam.voo = null; mexendo = performance.now() + 600; });
    cv.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, [e.clientX, e.clientY]); mexendo = performance.now() + 600;
      if (ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (dist0) cam.raio = Math.max(120, Math.min((cam.raioTudo || 900) * 1.4, cam.raio * dist0 / d));
        dist0 = d; moveu += 10; return;
      }
      const dx = e.clientX - ultimo[0], dy = e.clientY - ultimo[1]; ultimo = [e.clientX, e.clientY]; moveu += Math.abs(dx) + Math.abs(dy);
      cam.theta -= dx * 0.007; cam.phi = Math.max(0.35, Math.min(1.3, cam.phi - dy * 0.005));
    });
    const solta = e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId); dist0 = 0;
      if (ptrs.size) { ultimo = [...ptrs.values()][0]; return; }
      if (moveu < 8) clicar(e);
    };
    cv.addEventListener('pointerup', solta); cv.addEventListener('pointercancel', solta);
    cv.addEventListener('wheel', e => { e.preventDefault(); cam.auto = false; cam.voo = null; mexendo = performance.now() + 600; cam.raio = Math.max(120, Math.min((cam.raioTudo || 900) * 1.4, cam.raio * (e.deltaY > 0 ? 1.12 : 1 / 1.12))); }, { passive: false });
    cv.style.touchAction = 'none';
    document.addEventListener('keydown', e => { if (aberta && e.key === 'Escape' && !document.querySelector('dialog[open]')) (selecionado ? selecionar(null) : fechar()); });
  }
  function predioEm(e) {
    const r = cv.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)), camera);
    const hits = ray.intersectObjects(predios.map(p => p.g).concat(predios.filter(p => p.nome).map(p => p.nome)), true);
    for (const h of hits) { let o = h.object; while (o) { const p = predios.find(q => q.g === o || q.nome === o); if (p) return p; o = o.parent; } }
    return null;
  }
  function clicar(e) { const p = predioEm(e); if (p && !p.hq) selecionar(p); else if (p && p.hq) { selecionar(null); A().toast('💚 Esse é o prédio da KWIK. Toque nos outros para ver cada cliente.'); } }

  // ------------------------------------------------------------------ laço (30 quadros/s; 60 enquanto mexe)
  function quadro(agora) {
    raf = 0;
    if (!aberta) return;
    raf = requestAnimationFrame(quadro);
    if (document.hidden) return;
    const fps = agora < mexendo || cam.voo ? 60 : 30;
    if (agora - ultimoDesenho < 1000 / fps - 4) return;
    const dt = Math.min(0.05, (agora - tAnt) / 1000), t = agora / 1000; tAnt = agora; ultimoDesenho = agora;
    const w = cv.clientWidth, h = cv.clientHeight, pr = renderer.getPixelRatio();
    if (cv.width !== Math.round(w * pr) || cv.height !== Math.round(h * pr)) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    if (cam.voo) {
      const v = cam.voo; v.t = Math.min(1, v.t + dt / 1.0); const k = 1 - Math.pow(1 - v.t, 3);
      cam.alvo.x = v.de.x + (v.para.x - v.de.x) * k; cam.alvo.z = v.de.z + (v.para.z - v.de.z) * k; cam.raio = v.de.r + (v.para.r - v.de.r) * k; cam.phi = v.de.p + (v.para.p - v.de.p) * k; cam.theta = v.de.t + (v.para.t - v.de.t) * k;
      if (v.t >= 1) cam.voo = null;
    } else if (cam.auto) cam.theta += dt * 0.06;
    const sp = Math.sin(cam.phi), celular = window.matchMedia('(max-width: 760px)').matches;
    camera.position.set(cam.alvo.x + cam.raio * sp * Math.sin(cam.theta), cam.raio * Math.cos(cam.phi) + 10, cam.alvo.z + cam.raio * sp * Math.cos(cam.theta));
    camera.lookAt(cam.alvo.x, selecionado ? (celular ? 2 : 22) : 10, cam.alvo.z);
    for (const p of predios) if (p.sinal) p.sinal.rotation.y = t * 0.8;
    if (selecionado) {
      marcador.position.set(selecionado.x, selecionado.h + 34 + Math.sin(t * 3) * 3, selecionado.z); marcador.rotation.y = t * 2;
      const k = 0.5 + 0.5 * Math.sin(t * 3); anel.scale.setScalar(1 + k * 0.12); anel.material.opacity = 0.45 + 0.35 * (1 - k);
    }
    renderer.render(scene, camera);
    if (selecionado) CF().desenharDentro(t);
  }

  KM.cidade3d = { abrir, fechar, disponivel, atualizar, aberta: () => aberta };
})();
