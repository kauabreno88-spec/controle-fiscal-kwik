/* KWIK Mini Escritório · Cidade dos clientes em 3D (à noite).
   Cada cliente ativo é um prédio com janelas acesas na cor da atividade (consultório, clínica, loja…). A altura cresce com o
   honorário (ou com o tamanho da folha). No meio fica o prédio verde da KWIK; em volta, prédios da cidade (só enfeite),
   ruas com carrinhos e postes. Tocando num prédio de cliente: desce um feixe de luz do céu, um losango brilhante fica girando
   em cima e abre o painel com todas as informações do cliente (fiscal, folha, honorário, certificado, portais, por dentro).
   Arrastar gira a câmera, rodinha/pinça dá zoom, botão direito (ou dois dedos) arrasta a cidade.
   Usa o mesmo Three.js do escritório 3D. Sem WebGL, o botão Cliente abre a cidade desenhada de antes. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const CF = () => KM.clientesFora;
  const $ = s => document.querySelector(s);
  const el = (...a) => A().el(...a);
  const URL3 = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
  const CEL = 74, PRED = 44; // tamanho do lote e do prédio
  let THREE = null, renderer = null, scene = null, camera = null, ray = null, cv = null, raf = 0, aberta = false, assinatura = '';
  let predios = [], selecionado = null, feixe = null, losango = null, anel = null, carros = [], piscas = [], tAnt = 0, hover = null;
  const cam = { alvo: { x: 0, z: 0 }, raio: 980, theta: Math.PI / 4, phi: 0.95, auto: true, voo: null };
  const semente = n => { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hashId = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const brl0 = v => 'R$ ' + Math.round(+v || 0).toLocaleString('pt-BR');
  let falhou = false;
  const disponivel = () => !falhou && (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();

  // ------------------------------------------------------------------ janela (overlay em tela cheia)
  function montarDom() {
    if ($('#cidade3d')) return;
    const box = el('div', { id: 'cidade3d', class: 'cid3d', hidden: true });
    box.innerHTML = `<canvas id="cid3dTela"></canvas>
      <div class="cid-topo"><div class="cid-tit"><b>🌃 Cidade dos clientes</b><small>Toque num prédio</small></div><div class="cid-ticker" id="cidTicker"></div>
        <div class="cid-bts"><button class="cid-bt" id="cidLista" title="Lista dos clientes">📋 Lista</button><label class="cid-bt" title="Ler a validade dos certificados (.pfx), sem senha">📜 Certificados<input type="file" id="cidCert" accept=".pfx,.p12" multiple hidden></label>
        <button class="cid-bt" id="cidVer" title="Ver a cidade inteira">⤢</button><button class="cid-bt verde" id="cidVoltar">🏢 Voltar</button></div></div>
      <div class="cid-rotulo" id="cidRotulo" hidden></div>
      <aside class="cid-painel" id="cidPainel" hidden><button class="cid-x" id="cidFechar" title="Fechar">×</button><div id="cidInfo"></div></aside>
      <div class="cid-dica" id="cidDica">Arraste para girar · rodinha ou pinça para o zoom · botão direito arrasta a cidade</div>`;
    document.body.append(box);
    cv = $('#cid3dTela');
    $('#cidVoltar').addEventListener('click', fechar);
    $('#cidFechar').addEventListener('click', () => selecionar(null));
    $('#cidVer').addEventListener('click', () => { selecionar(null); voar(0, 0, raioTudo(), 0.95); });
    $('#cidLista').addEventListener('click', mostrarLista);
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
    } catch (e) { console.warn('KWIK cidade 3D', e); falhou = true; fechar(true); return CF().abrir(); }
    CF().montarDlg();
    await CF().carregarDados();
    CF().montarCena(true);
    construir();
    tAnt = performance.now();
    if (!raf) raf = requestAnimationFrame(quadro);
    if (!selecionado) mostrarLista();
  }
  function fechar(semVoltar) {
    const box = $('#cidade3d'); if (box) box.hidden = true;
    aberta = false; document.body.classList.remove('cidade-aberta');
    cancelAnimationFrame(raf); raf = 0;
    const c = CF()._cena; c.dentro = null; c.kaua = null; c.sel = null;
    if (semVoltar !== true) CF().voltar();
  }
  function iniciarGL() {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0f26'); scene.fog = new THREE.FogExp2('#0a0f26', 0.00105);
    camera = new THREE.PerspectiveCamera(48, 1, 2, 9000);
    ray = new THREE.Raycaster();
  }

  // ------------------------------------------------------------------ texturas (janelas, nomes no chão, feixe)
  function janelas(seed, acesa, chance, alta) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128;
    const g = c.getContext('2d'), rnd = semente(seed);
    g.fillStyle = '#0a1130'; g.fillRect(0, 0, 64, 128);
    for (let y = 4; y < 124; y += 8) for (let x = 4; x < 60; x += 8) {
      const v = rnd();
      g.fillStyle = v < chance * 0.62 ? acesa : v < chance * 0.9 ? '#7fb2ff' : v < chance ? '#ffffff' : (rnd() < 0.5 ? '#141c45' : '#10183a');
      g.fillRect(x, y, 5, alta ? 6 : 5);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  function textoChao(txt, cor) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 64;
    const g = c.getContext('2d'); g.font = '800 34px Montserrat, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = cor; g.fillText(String(txt).toUpperCase().slice(0, 24), 256, 34);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function texFeixe() {
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.55, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); return t;
  }

  // ------------------------------------------------------------------ montar a cidade
  const COR_MODELO = { odonto: '#66d9e8', nutricao: '#8ce99a', estetica: '#faa2c1', clinica: '#74c0fc', restaurante: '#ffa94d', loja: '#b197fc', academia: '#ffd43b', escritorio: '#91a7ff' };
  function lotes(n) { // células da grade ordenadas do centro para fora (ruas a cada 3 células)
    const out = [];
    for (let i = -9; i <= 9; i++) for (let j = -9; j <= 9; j++) { if (((i % 3) + 3) % 3 === 2 || ((j % 3) + 3) % 3 === 2) continue; out.push([i, j, Math.hypot(i + 0.5, j + 0.5)]); }
    out.sort((a, b) => a[2] - b[2]);
    return out.slice(0, n);
  }
  const posDe = ([i, j]) => [i * CEL, j * CEL];
  function alturaDe(c) {
    const R = CF().resumoCliente(c);
    if (c.valor) return Math.max(90, Math.min(330, 70 + c.valor / 8));
    const pessoas = (R.folha && R.folha.ativos) || (c.equipe || []).length;
    return Math.max(90, Math.min(300, 100 + pessoas * 28));
  }
  function construir() {
    const cs = CF()._cena.lotes, sig = cs.map(l => l.c.chave + ':' + l.c.modelo + ':' + (l.c.valor || 0)).join('|');
    atualizarTicker();
    if (sig === assinatura && scene.children.length) return;
    assinatura = sig;
    while (scene.children.length) { const o = scene.children.pop(); o.traverse && o.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) { const ms = [].concat(x.material); ms.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } }); }
    predios = []; carros = []; piscas = []; selecionado = null;
    // luzes
    scene.add(new THREE.HemisphereLight('#6f86ff', '#0a0f26', 0.85));
    const lua = new THREE.DirectionalLight('#a9bcff', 0.7); lua.position.set(-600, 900, 400); scene.add(lua);
    // chão com grade e ruas
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: '#0e1636', roughness: 1 }));
    chao.rotation.x = -Math.PI / 2; scene.add(chao);
    const grade = new THREE.GridHelper(4000, 4000 / (CEL / 2), '#1f2c66', '#16204d'); grade.position.y = 0.3; grade.material.transparent = true; grade.material.opacity = 0.55; scene.add(grade);
    const ruaM = new THREE.MeshStandardMaterial({ color: '#0b1130', roughness: 0.9 }), faixaM = new THREE.MeshBasicMaterial({ color: '#c9d4ff', transparent: true, opacity: 0.55 });
    for (let k = -9; k <= 9; k++) if (((k % 3) + 3) % 3 === 2) {
      const p = k * CEL;
      for (const [w, d, x, z] of [[CEL * 20, CEL * 0.9, 0, p], [CEL * 0.9, CEL * 20, p, 0]]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ruaM); r.rotation.x = -Math.PI / 2; r.position.set(x, 0.5, z); scene.add(r); }
      for (let u = -CEL * 10; u < CEL * 10; u += 26) {
        const f1 = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.6), faixaM); f1.rotation.x = -Math.PI / 2; f1.position.set(u, 0.7, p); scene.add(f1);
        const f2 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 12), faixaM); f2.rotation.x = -Math.PI / 2; f2.position.set(p, 0.7, u); scene.add(f2);
      }
    }
    const cel = lotes(1 + cs.length + 150), rnd = semente(2026);
    const caixaG = new THREE.BoxGeometry(1, 1, 1); caixaG.translate(0, 0.5, 0);
    function predio(x, z, w, d, h, tex, corTopo, extra) {
      tex = tex.clone(); tex.needsUpdate = true; tex.repeat.set(Math.max(1, Math.round(w / 22)), Math.max(1, Math.round(h / 44)));
      const lado = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: extra && extra.brilho || 0.85, roughness: 0.6, metalness: 0.2 });
      const topo = new THREE.MeshStandardMaterial({ color: corTopo, roughness: 0.8 });
      const m = new THREE.Mesh(caixaG, [lado, lado, topo, topo, lado, lado]);
      m.scale.set(w, h, d); m.position.set(x, 0, z); scene.add(m);
      return m;
    }
    // KWIK no meio
    {
      const [x, z] = posDe(cel[0]), h = 340;
      const m = predio(x, z, PRED + 6, PRED + 6, h, janelas(7, '#28BE52', 0.7, true), '#1E8A45', { brilho: 1.1 });
      const coroa = new THREE.Mesh(new THREE.BoxGeometry(PRED + 10, 8, PRED + 10), new THREE.MeshStandardMaterial({ color: '#28BE52', emissive: '#28BE52', emissiveIntensity: 1.2 }));
      coroa.position.set(x, h + 4, z); scene.add(coroa);
      const placa = new THREE.Mesh(new THREE.PlaneGeometry(90, 22), new THREE.MeshBasicMaterial({ map: textoChao('KWIK', '#28BE52'), transparent: true, side: THREE.DoubleSide }));
      placa.position.set(x, h + 30, z); placa.userData.olhar = true; scene.add(placa);
      const n = new THREE.Mesh(new THREE.PlaneGeometry(170, 22), new THREE.MeshBasicMaterial({ map: textoChao('KWIK Contabilidade', '#7dffa8'), transparent: true, depthWrite: false }));
      n.rotation.x = -Math.PI / 2; n.position.set(x, 1, z + PRED / 2 + 16); scene.add(n);
      predios.push({ m, hq: true, x, z, h });
    }
    // clientes
    cs.forEach((l, i) => {
      const c = l.c, [x, z] = posDe(cel[i + 1]), h = alturaDe(c), cor = COR_MODELO[c.modelo] || '#91a7ff';
      const m = predio(x, z, PRED, PRED, h, janelas(hashId(c.chave), cor, 0.55, false), '#1c2550', { brilho: 1 });
      const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 26, 6), new THREE.MeshStandardMaterial({ color: '#8c96c8' })); antena.position.set(x + 10, h + 13, z - 8); scene.add(antena);
      const luz = new THREE.Mesh(new THREE.SphereGeometry(2.4, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff4d4d' })); luz.position.set(x + 10, h + 27, z - 8); scene.add(luz); piscas.push(luz);
      const nome = new THREE.Mesh(new THREE.PlaneGeometry(150, 19), new THREE.MeshBasicMaterial({ map: textoChao(c.nomeCurto || c.nome, '#b8c8ff'), transparent: true, depthWrite: false, opacity: 0.85 }));
      nome.rotation.x = -Math.PI / 2; nome.position.set(x, 1, z + PRED / 2 + 14); scene.add(nome);
      predios.push({ m, i, c, x, z, h, cor, nome });
    });
    // prédios da cidade (enfeite)
    for (let k = 1 + cs.length; k < cel.length; k++) {
      const [x, z] = posDe(cel[k]); if (rnd() < 0.12) { arvores(x, z, rnd); continue; }
      const w = 30 + rnd() * 18, d = 30 + rnd() * 18, h = 40 + rnd() * rnd() * 260;
      predio(x + (rnd() - 0.5) * 10, z + (rnd() - 0.5) * 10, w, d, h, janelas(k * 13, rnd() < 0.5 ? '#ffd27a' : '#9ec5ff', 0.22, false), '#141b3d', { brilho: 0.55 });
    }
    // carrinhos (luzinhas andando nas ruas)
    const ruas = []; for (let k = -9; k <= 9; k++) if (((k % 3) + 3) % 3 === 2) ruas.push(k * CEL);
    for (let n = 0; n < 26; n++) {
      const eixoX = n % 2 === 0, p = ruas[Math.floor(rnd() * ruas.length)], frente = rnd() < 0.5 ? 1 : -1;
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(eixoX ? 12 : 6, 4, eixoX ? 6 : 12), new THREE.MeshStandardMaterial({ color: ['#e03131', '#f8f9fa', '#1971c2', '#fab005', '#2f9e44'][n % 5], emissive: '#222' })));
      const farol = new THREE.Mesh(new THREE.BoxGeometry(eixoX ? 1 : 5, 1.6, eixoX ? 5 : 1), new THREE.MeshBasicMaterial({ color: '#fff3bf' }));
      farol.position.set(eixoX ? 6 * frente : 0, 0.6, eixoX ? 0 : 6 * frente); g.add(farol);
      g.position.set(eixoX ? (rnd() - 0.5) * CEL * 18 : p + 7 * frente, 2.5, eixoX ? p + 7 * frente : (rnd() - 0.5) * CEL * 18);
      g.userData = { eixoX, frente, vel: 40 + rnd() * 40 }; scene.add(g); carros.push(g);
    }
    // postes ao longo das ruas
    const posteM = new THREE.MeshBasicMaterial({ color: '#ffe8a3' });
    for (const p of ruas) for (let u = -CEL * 9; u <= CEL * 9; u += CEL * 1.5) {
      for (const [x, z] of [[u, p + CEL * 0.5], [p + CEL * 0.5, u]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(2, 6, 5), posteM); b.position.set(x, 18, z); scene.add(b); }
    }
    // seleção: feixe de luz, anel no chão e o losango
    const tf = texFeixe();
    feixe = new THREE.Group();
    for (const [r, op] of [[22, 0.18], [9, 0.45]]) {
      const cil = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1400, 28, 1, true), new THREE.MeshBasicMaterial({ map: tf, color: '#cfe0ff', transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      cil.position.y = 700; feixe.add(cil);
    }
    feixe.visible = false; scene.add(feixe);
    anel = new THREE.Mesh(new THREE.RingGeometry(30, 46, 40), new THREE.MeshBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    anel.rotation.x = -Math.PI / 2; anel.position.y = 1.2; anel.visible = false; scene.add(anel);
    losango = new THREE.Mesh(new THREE.OctahedronGeometry(13), new THREE.MeshStandardMaterial({ color: '#dbe8ff', emissive: '#9fc2ff', emissiveIntensity: 1.1, metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.92 }));
    losango.scale.y = 1.45; losango.visible = false; scene.add(losango);
    cam.alvo.x = 0; cam.alvo.z = 0; cam.raio = raioTudo();
  }
  function arvores(x, z, rnd) {
    for (let k = 0; k < 3; k++) {
      const t = new THREE.Mesh(new THREE.ConeGeometry(7, 22, 7), new THREE.MeshStandardMaterial({ color: '#1f5f3a', emissive: '#0c2a1a', roughness: 0.9 }));
      t.position.set(x + (rnd() - 0.5) * 40, 11, z + (rnd() - 0.5) * 40); scene.add(t);
    }
  }
  const raioTudo = () => Math.max(700, 260 + Math.sqrt(predios.length + 30) * 95);

  // ------------------------------------------------------------------ informações
  function atualizarTicker() {
    const cs = CF()._cena.lotes.map(l => l.c);
    let honor = 0, venc = 0, cert = 0, pessoas = 0;
    for (const c of cs) {
      honor += +c.valor || 0;
      const R = CF().resumoCliente(c); if (R.fiscal) venc += R.fiscal.qVencido || 0; if (R.folha) pessoas += R.folha.ativos || 0;
      const v = c.info && c.info.cert && c.info.cert.validade; if (v && (new Date(v + 'T12:00:00') - Date.now()) / 864e5 <= 30) cert++;
    }
    const t = $('#cidTicker'); if (!t) return;
    t.innerHTML = '';
    t.append(...[el('span', {}, el('b', {}, String(cs.length)), ` cliente${cs.length === 1 ? '' : 's'} ativo${cs.length === 1 ? '' : 's'}`),
      honor ? el('span', {}, el('b', { class: 'v' }, brl0(honor)), '/mês') : null,
      el('span', { class: venc ? 'mal' : 'bem' }, venc ? `🔴 ${venc} guia${venc > 1 ? 's' : ''} vencida${venc > 1 ? 's' : ''}` : '🟢 impostos em dia'),
      pessoas ? el('span', {}, `👥 ${pessoas} na folha`) : null,
      cert ? el('span', { class: 'mal' }, `📜 ${cert} certificado${cert > 1 ? 's' : ''} vencendo`) : null].filter(Boolean));
  }
  function painel(conteudo) {
    const p = $('#cidPainel'), box = $('#cidInfo');
    p.hidden = false; box.innerHTML = ''; conteudo(box);
  }
  function mostrarLista() {
    const cs = CF()._cena.lotes;
    if (!cs.length) return painel(b => b.append(el('h3', {}, '🏢 Nenhum cliente ativo ainda'), el('p', { class: 'vazio' }, 'Conecte o KWIK Fiscal e o KWIK Folha (abra o setor Fiscal ou Folha) ou cadastre clientes em Configurações → Clientes ativos.')));
    painel(b => { b.append(el('h3', { class: 'cid-h' }, `🏙️ ${cs.length} cliente${cs.length > 1 ? 's' : ''} na cidade`)); const g = el('div'); b.append(g); CF().renderResumoRua(g, i => selecionar(predios.find(p => p.i === i))); });
  }
  function selecionar(p) {
    const C = CF()._cena;
    if (hover && hover !== p) hover = null;
    selecionado = p && !p.hq ? p : null;
    feixe.visible = anel.visible = losango.visible = !!selecionado;
    if (!selecionado) { C.dentro = null; C.kaua = null; C.sel = null; $('#cidPainel').hidden = true; $('#cidRotulo').hidden = true; return; }
    KM.tocar && KM.tocar('clique');
    feixe.position.set(p.x, 0, p.z); anel.position.x = p.x; anel.position.z = p.z;
    losango.position.set(p.x, p.h + 46, p.z); losango.material.emissive.set(p.cor);
    const lote = C.lotes[p.i]; C.sel = lote; C.dentro = lote; C.kaua = { x: 0, y: 0, vis: false, aceno: true };
    setTimeout(() => { if (C.kaua) C.kaua.aceno = false; }, 1800);
    const dono = lote.pessoas.find(q => q.papel === 'dono');
    if (dono) { dono.aceno = performance.now() + 2600; dono.fala = `OI, ${KM.nomeDe ? KM.nomeDe('noticias').toUpperCase() : 'KAUA'}!`; dono.falaAte = performance.now() + 3200; }
    painel(b => {
      const c = p.c, M = CF().MODELOS[c.modelo] || {}, R = CF().resumoCliente(c), cert = c.info && c.info.cert;
      const d = cert && cert.validade ? Math.round((new Date(cert.validade + 'T12:00:00') - Date.now()) / 864e5) : null;
      b.append(el('div', { class: 'cid-tiles' },
        el('div', {}, el('small', {}, 'Honorário'), el('b', {}, c.valor ? brl0(c.valor) : '—')),
        el('div', { class: R.fiscal && R.fiscal.qVencido ? 'mal' : '' }, el('small', {}, 'Guias vencidas'), el('b', {}, R.fiscal ? String(R.fiscal.qVencido) : '—')),
        el('div', {}, el('small', {}, 'Na folha'), el('b', {}, R.folha ? String(R.folha.ativos) : String((c.equipe || []).length || '—'))),
        el('div', { class: d != null && d < 30 ? 'mal' : '' }, el('small', {}, 'Certificado'), el('b', {}, d == null ? '—' : d < 0 ? 'vencido' : `${d} dias`))));
      const info = el('div'); b.append(info);
      CF().renderInfo(c, false, info);
      if (M.ic) b.querySelector('.cid-tiles').before(el('p', { class: 'cid-sub' }, `${M.ic} ${M.nome || ''}${c.regime ? ' · ' + c.regime : ''}`));
    });
    voar(p.x, p.z, Math.max(560, p.h * 3.2), 0.86);
    cam.auto = false;
  }
  function voar(x, z, raio, phi) { cam.voo = { de: { x: cam.alvo.x, z: cam.alvo.z, r: cam.raio, p: cam.phi }, para: { x, z, r: raio, p: phi }, t: 0 }; }
  function atualizar() { if (!aberta) return; CF().montarCena(true); construir(); if (selecionado) { const p = predios.find(q => q.c && q.c.chave === selecionado.c.chave); if (p) selecionar(p); } }

  // ------------------------------------------------------------------ câmera: girar, zoom e arrastar
  function ligarControles() {
    const ptrs = new Map(); let modo = null, ultimo = null, moveu = 0, dist0 = 0;
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); modo = e.button === 2 || e.shiftKey ? 'arrastar' : 'girar'; ultimo = [e.clientX, e.clientY]; moveu = 0; cam.auto = false; cam.voo = null; dist0 = 0; });
    cv.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) { passarPor(e); return; }
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        if (dist0) { cam.raio = Math.max(160, Math.min(2600, cam.raio * dist0 / d)); arrastar(mx - ultimo[0], my - ultimo[1]); }
        dist0 = d; ultimo = [mx, my]; moveu += 10; return;
      }
      const dx = e.clientX - ultimo[0], dy = e.clientY - ultimo[1]; ultimo = [e.clientX, e.clientY]; moveu += Math.abs(dx) + Math.abs(dy);
      if (modo === 'arrastar') arrastar(dx, dy);
      else { cam.theta -= dx * 0.006; cam.phi = Math.max(0.25, Math.min(1.42, cam.phi - dy * 0.005)); }
    });
    const solta = e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId); dist0 = 0;
      if (ptrs.size) { ultimo = [...ptrs.values()][0]; return; }
      if (moveu < 6) clicar(e);
    };
    cv.addEventListener('pointerup', solta); cv.addEventListener('pointercancel', solta);
    cv.addEventListener('wheel', e => { e.preventDefault(); cam.auto = false; cam.voo = null; cam.raio = Math.max(160, Math.min(2600, cam.raio * (e.deltaY > 0 ? 1.12 : 1 / 1.12))); }, { passive: false });
    cv.style.touchAction = 'none';
    document.addEventListener('keydown', e => { if (aberta && e.key === 'Escape' && !document.querySelector('dialog[open]')) (selecionado ? selecionar(null) : fechar()); });
  }
  function arrastar(dx, dy) {
    const k = cam.raio / 900, s = Math.sin(cam.theta), c = Math.cos(cam.theta);
    cam.alvo.x -= (dx * c + dy * s) * k; cam.alvo.z -= (-dx * s + dy * c) * k;
    const lim = CEL * 10; cam.alvo.x = Math.max(-lim, Math.min(lim, cam.alvo.x)); cam.alvo.z = Math.max(-lim, Math.min(lim, cam.alvo.z));
  }
  function predioEm(e) {
    const r = cv.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1)), camera);
    const hit = ray.intersectObjects(predios.map(p => p.m), false)[0];
    return hit ? predios.find(p => p.m === hit.object) : null;
  }
  function clicar(e) { const p = predioEm(e); if (p && !p.hq) selecionar(p); else if (p && p.hq) { A().toast('💚 Esse é o prédio da KWIK. Toque nos outros para ver cada cliente.'); } }
  function passarPor(e) {
    const p = predioEm(e), rot = $('#cidRotulo');
    cv.style.cursor = p ? 'pointer' : 'grab';
    hover = p && !p.hq ? p : null;
    if (hover && hover !== selecionado) { rot.hidden = false; rot.textContent = hover.c.nome; rot.dataset.alvo = hover.i; } else if (!selecionado) rot.hidden = true;
  }

  // ------------------------------------------------------------------ laço
  function quadro(agora) {
    raf = 0;
    if (!aberta) return;
    raf = requestAnimationFrame(quadro);
    if (document.hidden) return;
    const dt = Math.min(0.05, (agora - tAnt) / 1000), t = agora / 1000; tAnt = agora;
    const w = cv.clientWidth, h = cv.clientHeight, pr = renderer.getPixelRatio();
    if (cv.width !== Math.round(w * pr) || cv.height !== Math.round(h * pr)) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    if (cam.voo) {
      const v = cam.voo; v.t = Math.min(1, v.t + dt / 1.1); const k = 1 - Math.pow(1 - v.t, 3);
      cam.alvo.x = v.de.x + (v.para.x - v.de.x) * k; cam.alvo.z = v.de.z + (v.para.z - v.de.z) * k; cam.raio = v.de.r + (v.para.r - v.de.r) * k; cam.phi = v.de.p + (v.para.p - v.de.p) * k;
      if (v.t >= 1) cam.voo = null;
    } else if (cam.auto) cam.theta += dt * 0.05;
    const sp = Math.sin(cam.phi);
    camera.position.set(cam.alvo.x + cam.raio * sp * Math.sin(cam.theta), cam.raio * Math.cos(cam.phi) + 20, cam.alvo.z + cam.raio * sp * Math.cos(cam.theta));
    camera.lookAt(cam.alvo.x, selecionado ? Math.min(selecionado.h * 0.4, 90) : 30, cam.alvo.z);
    // carrinhos
    const lim = CEL * 10;
    for (const c of carros) {
      const u = c.userData, d = u.vel * dt * u.frente;
      if (u.eixoX) { c.position.x += d; if (c.position.x > lim) c.position.x = -lim; if (c.position.x < -lim) c.position.x = lim; }
      else { c.position.z += d; if (c.position.z > lim) c.position.z = -lim; if (c.position.z < -lim) c.position.z = lim; }
    }
    for (let i = 0; i < piscas.length; i++) piscas[i].visible = Math.sin(t * 2.6 + i) > -0.2;
    if (selecionado) {
      losango.rotation.y += dt * 1.6; losango.position.y = selecionado.h + 46 + Math.sin(t * 2.2) * 5;
      const k = 0.5 + 0.5 * Math.sin(t * 3); anel.scale.setScalar(1 + k * 0.25); anel.material.opacity = 0.35 + 0.4 * (1 - k);
      feixe.children.forEach((f, i) => { f.material.opacity = (i ? 0.45 : 0.18) * (0.85 + 0.15 * Math.sin(t * 4 + i)); });
    }
    for (const o of scene.children) if (o.userData && o.userData.olhar) o.lookAt(camera.position.x, o.position.y, camera.position.z);
    renderer.render(scene, camera);
    // nome do prédio sob o mouse (ou do selecionado) acompanha a tela
    const alvo = hover && hover !== selecionado ? hover : selecionado, rot = $('#cidRotulo');
    if (alvo) {
      const v = new THREE.Vector3(alvo.x, alvo.h + (alvo === selecionado ? 78 : 20), alvo.z).project(camera);
      if (v.z < 1) { rot.hidden = false; rot.textContent = alvo.c.nome; rot.style.left = ((v.x + 1) / 2 * w) + 'px'; rot.style.top = ((1 - v.y) / 2 * h) + 'px'; rot.classList.toggle('sel', alvo === selecionado); }
    } else rot.hidden = true;
    // por dentro do prédio (desenho de sempre, no painel)
    if (selecionado) CF().desenharDentro(t);
  }

  KM.cidade3d = { abrir, fechar, disponivel, atualizar, aberta: () => aberta };
})();
