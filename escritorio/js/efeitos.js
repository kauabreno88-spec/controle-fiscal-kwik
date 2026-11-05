/* KWIK Mini Escritório · efeitos: partículas, sons e animações do funcionário. */
(function () {
  const KM = (window.KM = window.KM || {});
  const VERDE = '#28BE52';

  // ------------------------------------------------------------------ partículas
  const parts = [];
  KM.particulas = parts;
  let seq = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);

  KM.emitir = function (tipo, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const p = Object.assign({
        id: seq++, tipo, x: 0, y: 0, vx: 0, vy: 0, g: 0, vida: 1, idade: 0, cor: '#fff', atras: false,
      }, typeof o === 'function' ? o(i) : o);
      if (typeof o !== 'function') {
        p.x += rnd(-(o.dx || 0), o.dx || 0); p.y += rnd(-(o.dy || 0), o.dy || 0);
        p.vx += rnd(-(o.dvx || 0), o.dvx || 0); p.vy += rnd(-(o.dvy || 0), o.dvy || 0);
        p.vida *= rnd(0.7, 1.15);
      }
      parts.push(p);
    }
  };

  KM.atualizarParticulas = function (dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.idade += dt;
      if (p.idade >= p.vida) { parts.splice(i, 1); continue; }
      if (p.tipo === 'nota') { p.vx = Math.sin(p.idade * 4 + p.id) * 18; p.vy = Math.min(p.vy + p.g * dt, 28); }
      else if (p.tipo === 'confete') { p.vx = Math.sin(p.idade * 5 + p.id) * 14; p.vy = Math.min(p.vy + p.g * dt, 40); }
      else p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.chao && p.y > p.chao) { p.y = p.chao; p.vy *= -0.35; p.vx *= 0.6; }
    }
  };

  function contornoTexto(ctx, s, x, y, cor) {
    for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) KM.texto(ctx, s, x + a, y + b, '#1c1612');
    KM.texto(ctx, s, x, y, cor);
  }

  KM.desenharParticulas = function (ctx, t, camada) {
    for (const p of parts) {
      if (!!p.atras !== (camada === 'atras')) continue;
      const x = Math.round(p.x), y = Math.round(p.y), f = p.idade / p.vida;
      switch (p.tipo) {
        case 'moeda': {
          const larg = [5, 3, 1, 3][Math.floor(t * 12 + p.id) % 4];
          ctx.fillStyle = '#7a5208'; ctx.fillRect(x - (larg >> 1) - 1, y - 3, larg + 2, 6);
          ctx.fillStyle = '#f5c518'; ctx.fillRect(x - (larg >> 1), y - 2, larg, 4);
          ctx.fillStyle = '#fff3a0'; ctx.fillRect(x - (larg >> 1), y - 2, 1, 2);
          break;
        }
        case 'nota': {
          const lado = Math.floor(t * 6 + p.id) % 3;
          const w = lado === 1 ? 5 : 8, h = lado === 1 ? 5 : 4;
          ctx.fillStyle = '#1d6b34'; ctx.fillRect(x - (w >> 1) - 1, y - 1, w + 2, h + 2);
          ctx.fillStyle = '#5fcf7c'; ctx.fillRect(x - (w >> 1), y, w, h);
          ctx.fillStyle = '#2E8B45'; ctx.fillRect(x - 1, y + 1, 2, h - 2);
          break;
        }
        case 'confete': ctx.fillStyle = p.cor; ctx.fillRect(x, y, Math.floor(t * 8 + p.id) % 2 ? 2 : 1, 2); break;
        case 'faisca': ctx.fillStyle = p.cor; ctx.fillRect(x, y, 1, 1); if (f < 0.5) ctx.fillRect(x - Math.sign(p.vx), y - Math.sign(p.vy), 1, 1); break;
        case 'aura': {
          const s = f < 0.4 ? 2 : 1;
          ctx.fillStyle = f < 0.3 ? '#ffffff' : p.cor; ctx.fillRect(x, y, s, s + 1);
          break;
        }
        case 'pedra': ctx.fillStyle = '#6b5a4a'; ctx.fillRect(x, y, 2, 2); ctx.fillStyle = '#8f7b66'; ctx.fillRect(x, y, 1, 1); break;
        case 'estrela':
          ctx.fillStyle = p.cor || '#ffe066';
          ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3);
          if (f < 0.5) { ctx.fillRect(x - 2, y, 1, 1); ctx.fillRect(x + 2, y, 1, 1); ctx.fillRect(x, y - 2, 1, 1); ctx.fillRect(x, y + 2, 1, 1); }
          break;
        case 'z': contornoTexto(ctx, 'Z', x, y, '#ffffff'); break;
        case 'fumaca': ctx.fillStyle = `rgba(255,255,255,${0.7 - f * 0.7})`; ctx.fillRect(x, y, 1, 1); break;
        case 'vento': ctx.fillStyle = `rgba(255,255,255,${0.8 - f})`; ctx.fillRect(x, y, 5, 1); break;
        case 'digito': KM.texto(ctx, String(p.d), x, y, f < 0.15 ? '#d9ffe3' : p.cor || VERDE); break;
        case 'texto': contornoTexto(ctx, p.s, x - (KM.larguraTexto(p.s) >> 1), y, p.cor || '#ffd93b'); break;
        case 'pixel': ctx.fillStyle = p.cor; ctx.fillRect(x, y, 1, 1); break;
        case 'raio': {
          ctx.fillStyle = f < 0.5 ? '#ffffff' : p.cor || '#9fe8ff';
          let px = p.x, py = p.y;
          for (const [ax, ay] of p.pts) {
            const passos = Math.max(Math.abs(ax), Math.abs(ay));
            for (let k = 0; k < passos; k++) { px += ax / passos; py += ay / passos; ctx.fillRect(Math.round(px), Math.round(py), 1, 1); }
          }
          break;
        }
        case 'gota': ctx.fillStyle = '#8fd3ff'; ctx.fillRect(x, y, 1, 2); ctx.fillRect(x - 1, y + 1, 3, 1); break;
      }
    }
  };

  // ------------------------------------------------------------------ som (sintetizado)
  const som = { ligado: true, ac: null };
  KM.som = som;
  function ac() {
    if (!som.ac) { try { som.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (som.ac.state === 'suspended') som.ac.resume();
    return som.ac;
  }
  function tom(freq, ini, dur, tipo = 'square', vol = 0.06, freqFim) {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = tipo; o.frequency.setValueAtTime(freq, a.currentTime + ini);
    if (freqFim) o.frequency.exponentialRampToValueAtTime(freqFim, a.currentTime + ini + dur);
    g.gain.setValueAtTime(vol, a.currentTime + ini);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + ini + dur);
    o.connect(g).connect(a.destination);
    o.start(a.currentTime + ini); o.stop(a.currentTime + ini + dur + 0.02);
  }
  function ruido(ini, dur, vol = 0.08, corte = 1800) {
    const a = ac(); if (!a) return;
    const buf = a.createBuffer(1, Math.max(1, a.sampleRate * dur), a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = buf; f.type = 'lowpass'; f.frequency.value = corte; g.gain.value = vol;
    s.connect(f).connect(g).connect(a.destination); s.start(a.currentTime + ini);
  }
  KM.tocar = function (nome) {
    if (!som.ligado) return;
    switch (nome) {
      case 'moeda': tom(988, 0, 0.07); tom(1319, 0.07, 0.18); break;
      case 'caixa': ruido(0, 0.08, 0.05, 4000); tom(1568, 0.05, 0.1, 'square', 0.05); tom(2093, 0.13, 0.35, 'square', 0.05); tom(2637, 0.2, 0.3, 'triangle', 0.04); break;
      case 'poder': tom(90, 0, 2.2, 'sawtooth', 0.05, 700); tom(180, 0.2, 2.0, 'square', 0.025, 1100); ruido(0.3, 1.9, 0.03, 600); break;
      case 'explosao': ruido(0, 0.9, 0.18, 900); tom(70, 0, 0.6, 'sine', 0.2, 35); tom(880, 0, 0.4, 'triangle', 0.05, 1760); break;
      case 'zap': ruido(0, 0.12, 0.06, 6000); break;
      case 'sucesso': [523, 659, 784, 1047].forEach((f, i) => tom(f, i * 0.09, 0.2, 'square', 0.05)); break;
      case 'clique': tom(660, 0, 0.04, 'square', 0.03); break;
      case 'teleporte': tom(1400, 0, 0.5, 'sine', 0.06, 200); tom(200, 0.5, 0.5, 'sine', 0.06, 1400); break;
      case 'pulo': tom(330, 0, 0.15, 'square', 0.04, 660); break;
      case 'gole': tom(220, 0, 0.08, 'sine', 0.08); tom(180, 0.15, 0.08, 'sine', 0.08); tom(200, 0.3, 0.08, 'sine', 0.08); break;
      case 'bip': tom(1200 + Math.random() * 600, 0, 0.05, 'square', 0.02); break;
      case 'foto': ruido(0, 0.06, 0.12, 9000); tom(2400, 0.02, 0.05, 'square', 0.03); break;
      case 'coracao': tom(70, 0, 0.12, 'sine', 0.25, 50); tom(70, 0.22, 0.12, 'sine', 0.2, 50); break;
      case 'susto': ruido(0, 0.5, 0.25, 3000); tom(160, 0, 0.6, 'sawtooth', 0.08, 60); tom(1800, 0, 0.3, 'square', 0.05, 900); break;
      case 'magia': [880, 1175, 1568, 2093].forEach((f, i) => tom(f, i * 0.06, 0.25, 'triangle', 0.04)); break;
      case 'tchau': tom(523, 0, 0.1, 'triangle', 0.05); tom(392, 0.12, 0.2, 'triangle', 0.05); break;
      case 'notif': tom(988, 0, 0.09, 'triangle', 0.06); tom(1480, 0.1, 0.18, 'triangle', 0.06); break;
      case 'batida': {
        for (let i = 0; i < 16; i++) {
          tom(110, i * 0.25, 0.12, 'sine', 0.18, 50);
          if (i % 2) ruido(i * 0.25, 0.05, 0.03, 8000);
          tom([262, 330, 392, 330][i % 4] * 2, i * 0.25 + 0.125, 0.1, 'square', 0.02);
        }
        break;
      }
    }
  };

  // ------------------------------------------------------------------ diretor de animações
  const st = { ocupado: false, tarefas: [], tremor: 0, flash: 0, corFlash: '#ffffff', disco: 0, verde: 0 };
  KM.fx = st;
  KM.onFala = () => {}; KM.onBanner = () => {};

  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const quadroAQuadro = fn => new Promise(res => st.tarefas.push({ fn, res }));
  KM.esperar = esperar;

  KM.atualizarEfeitos = function (dt, t) {
    for (let i = st.tarefas.length - 1; i >= 0; i--) {
      const tf = st.tarefas[i];
      if (tf.fn(dt, t)) { st.tarefas.splice(i, 1); tf.res(); }
    }
    st.tremor = Math.max(0, st.tremor - dt * (st.tremorFixo ? 0 : 6));
    st.flash = Math.max(0, st.flash - dt * 1.8);
    KM.atualizarParticulas(dt);
  };

  KM.desenharEfeitos = function (ctx, t) {
    const W = KM.W, H = KM.H;
    if (st.disco > 0) {
      ctx.fillStyle = `rgba(10,8,30,${0.45 * st.disco})`; ctx.fillRect(0, 0, W, H);
      const cores = ['rgba(255,60,120,0.35)', 'rgba(60,200,255,0.35)', 'rgba(255,220,60,0.35)', 'rgba(40,190,82,0.4)'];
      for (let i = 0; i < 4; i++) {
        const cy = KM.LAYOUT ? KM.LAYOUT.centro[1] - 10 : 130;
        const x = W / 2 + Math.sin(t * 1.3 + i * 1.7) * 90, y = cy + Math.cos(t * 1.1 + i * 2.1) * 34;
        ctx.fillStyle = cores[i];
        for (let r = 14; r > 0; r -= 4) ctx.fillRect(Math.round(x - r * 1.6), Math.round(y - r * 0.8), Math.round(r * 3.2), Math.round(r * 1.6));
      }
      // globo espelhado
      const gy = Math.round(-14 + 40 * st.disco);
      ctx.fillStyle = '#9aa3a1'; ctx.fillRect(W / 2, 0, 1, gy - 5);
      for (let yy = -5; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) {
        if (xx * xx + yy * yy > 26) continue;
        ctx.fillStyle = (xx + yy + Math.floor(t * 8)) % 3 === 0 ? '#ffffff' : (xx + yy) % 2 ? '#c9d2d6' : '#7d8a90';
        ctx.fillRect(W / 2 + xx, gy + yy, 1, 1);
      }
    }
    if (st.verde > 0) { ctx.fillStyle = `rgba(20,120,50,${0.25 * st.verde})`; ctx.fillRect(0, 0, W, H); }
    if (st.escuro > 0) {
      const pisca = st.piscaLuz && Math.random() < 0.12 ? 0.25 : 0;
      ctx.fillStyle = `rgba(8,4,14,${Math.min(0.85, 0.7 * st.escuro + pisca)})`; ctx.fillRect(0, 0, W, H);
      if (st.vermelho) { ctx.fillStyle = `rgba(160,0,20,${0.25 * st.vermelho})`; ctx.fillRect(0, 0, W, H); }
    }
    if (st.espaco > 0) {
      ctx.fillStyle = `rgba(6,10,30,${0.6 * st.espaco})`; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { ctx.fillStyle = (i + Math.floor(t * 4)) % 7 ? '#ffffff' : '#ffd93b'; ctx.fillRect((i * 53 + Math.floor(t * 10)) % W, (i * 37) % H, 1, 1); }
    }
    KM.desenharParticulas(ctx, t, 'frente');
    if (st.flash > 0) { ctx.globalAlpha = Math.min(1, st.flash); ctx.fillStyle = st.corFlash; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  };

  // ---------------- pessoas: andar, levantar, sentar (vários funcionários)
  const pessoa = id => (KM.estado && KM.estado.pessoas || {})[id];
  const alvo = id => pessoa(id || KM.estado.selecionado || KM.estado.principal) || Object.values(KM.estado.pessoas || {})[0];
  const todas = () => Object.values(KM.estado.pessoas || {});
  const assento = p => KM.LAYOUT.assentos[p.funcao] || KM.LAYOUT.assentos.noticias;
  // Olhar para alguém (sempre de frente, para a gente ver o rosto).
  KM.olhar = (p, alvo) => { p.dir = alvo.X >= p.X ? 'fd' : 'fe'; };
  KM.pessoa = pessoa; KM.alvo = alvo; KM.todas = todas;

  function andarAte(p, X, Y, vel = 46) {
    p.modo = 'em-pe';
    return quadroAQuadro((dt, t) => {
      const dx = X - p.X, dy = Y - p.Y, dist = Math.hypot(dx, dy);
      if (dist < 1) { p.X = X; p.Y = Y; p.est.passo = 0; return true; }
      const s = Math.min(dist, vel * dt);
      p.X += dx / dist * s; p.Y += dy / dist * s;
      p.est.passo = [1, 0, 2, 0][Math.floor(t * 8 + (p.fase || 0)) % 4];
      // vira para onde anda (vista de cima): subindo = de costas; direita = espelhado
      p.dir = (dy < -Math.abs(dx) * 0.6 ? 'c' : 'f') + (Math.abs(dx) > 0.3 ? (dx > 0 ? 'd' : 'e') : (p.dir || 'fe')[1]);
      return false;
    });
  }
  async function levantar(p) {
    p.dormindo = false; p.digitando = false;
    if (p.modo !== 'sentado') return;
    const a = assento(p);
    p.modo = 'em-pe'; p.X = a.pe[0]; p.Y = a.pe[1]; p.est = {}; p.dir = 'fe';
    await esperar(120);
  }
  // Anda pelo prédio até (X, Y), desviando de paredes e móveis (caminho calculado em cena.js).
  async function irAte(p, X, Y, vel) {
    await levantar(p);
    p.foraDaMesa = true;
    for (const [x, y] of KM.rota(p.X, p.Y, X, Y)) await andarAte(p, x, y, vel);
  }
  async function irAoTapete(p, ponto) { const [x, y] = ponto || assento(p).tapete; await irAte(p, x, y); p.dir = 'fe'; }
  async function voltarSentar(p) {
    p = p || alvo();
    if (!p || p.modo === 'sentado') return;
    p.est = {};
    const a = assento(p);
    for (const [x, y] of KM.rota(p.X, p.Y, a.pe[0], a.pe[1])) await andarAte(p, x, y);
    p.foraDaMesa = false;
    p.modo = 'sentado'; p.X = a.X; p.Y = a.Y; p.dir = a.dir; p.est = {}; p.Z = 0;
  }
  function cabeca(p) { const [x, y] = KM.ancora(p); return [x, p.modo === 'sentado' ? y - 27 : y - 35]; }
  function pes(p) { return KM.ancora(p); }
  const fala = (p, txt, ms = 2400) => p && KM.onFala(p.id, txt, ms);
  KM.voltarSentar = voltarSentar;
  KM.mov = { andarAte, levantar, irAte, irAoTapete, voltarSentar, cabeca, pes, fala, esperar, quadroAQuadro, assento };

  // ---------------- efeitos sem movimento
  KM.explosaoDinheiro = function (valor, id) {
    const [x, y] = cabeca(alvo(id));
    KM.emitir('moeda', 26, i => ({ x: x + rnd(-4, 4), y: y + rnd(-2, 4), vx: rnd(-55, 75), vy: rnd(-120, -60), g: 220, vida: rnd(0.9, 1.4), chao: y + 40 }));
    KM.emitir('nota', 12, i => ({ x: x + rnd(-30, 30), y: y - rnd(10, 50), vy: rnd(-10, 5), g: 40, vida: rnd(1.6, 2.4) }));
    KM.emitir('estrela', 6, i => ({ x: x + rnd(-14, 14), y: y + rnd(-14, 4), vy: -12, vida: 0.6, cor: '#fff3a0' }));
    if (valor) KM.emitir('texto', 1, { x, y: y - 10, vy: -16, vida: 1.8, s: '+R$' + Math.round(valor), cor: '#ffd93b' });
    KM.tocar('caixa');
    setTimeout(() => KM.tocar('moeda'), 260);
    st.tremor = Math.max(st.tremor, 1.5);
  };

  KM.chuvaDinheiro = async function (seg = 4) {
    const ps = todas().filter(p => !p.acao || p.acao === 'chuva');
    const antes = ps.map(p => Object.assign({}, p.est));
    ps.forEach(p => { p.est = Object.assign({}, p.est, { bracos: 'cima', boca: 'sorriso', olhos: 'feliz' }); });
    fala(alvo(), 'Olha o dinheiro entrando!! 🤑', 2500);
    const fim = performance.now() + seg * 1000;
    while (performance.now() < fim) {
      KM.emitir('nota', 3, i => ({ x: rnd(15, KM.W - 15), y: rnd(-10, 0), vy: 10, g: 30, vida: 5 }));
      KM.emitir('moeda', 2, i => ({ x: rnd(20, KM.W - 20), y: -6, vy: rnd(20, 60), g: 160, vida: 2.2, chao: rnd(140, KM.H - 8) }));
      if (Math.random() < 0.4) KM.tocar('moeda');
      await esperar(140);
    }
    await esperar(800);
    ps.forEach((p, i) => { p.est = antes[i]; });
  };

  KM.confete = function (n = 120) {
    const cores = ['#28BE52', '#ffd93b', '#ff5c8a', '#3fb6ff', '#ffffff', '#b066ff', '#ff8c2b'];
    KM.emitir('confete', n, i => ({ x: rnd(5, KM.W - 5), y: rnd(-60, -2), vy: rnd(10, 30), g: 25, vida: rnd(4, 6), cor: cores[i % cores.length] }));
    KM.tocar('sucesso');
  };

  // ---------------- travas: cada pessoa faz uma coisa por vez
  async function pararRotina(p) {
    if (p.acao === 'soneca') { p.dormindo = false; }
    if (p.acao !== 'rotina' && p.acao !== 'soneca') return;
    p.pararRotina = true;
    const ini = performance.now();
    while ((p.acao === 'rotina' || p.acao === 'soneca') && performance.now() - ini < 12000) await esperar(80);
    p.pararRotina = false;
  }
  KM.pararRotina = pararRotina;
  async function rodar(nome, fn, ids) {
    ids = ids || [alvo() && alvo().id];
    const ps = ids.map(pessoa).filter(Boolean);
    for (const p of ps) await pararRotina(p);
    if (!ps.length || ps.some(p => p.acao)) return false;
    ps.forEach(p => { p.acao = nome; });
    st.rodando = (st.rodando || 0) + 1; st.ocupado = nome;
    KM.onOcupado && KM.onOcupado(nome);
    try { await fn(...ps); } finally {
      ps.forEach(p => { p.acao = null; p.auraAtras = null; });
      st.rodando--;
      if (!st.rodando) { st.ocupado = false; st.disco = 0; st.verde = 0; st.escuro = 0; st.espaco = 0; st.tremorFixo = false; }
      KM.onOcupado && KM.onOcupado(false);
    }
    return true;
  }
  KM.rodar = rodar;
  KM.livre = id => { const p = pessoa(id); return p && !p.acao; };

  // Super Sayajin: nivel 1, 2, 3, 'deus' ou 'branco'
  KM.superSayajin = (nivel = 1, opc = {}, id) => rodar('saiyan', async p => {
    await irAoTapete(p);
    const corAura = nivel === 'deus' ? '#ff3b5c' : nivel === 'branco' ? '#c9e3ff' : '#ffe14d';
    const corRaio = nivel === 'deus' ? '#ffb3c0' : '#9fe8ff';
    const nomes = { 1: 'SUPER SAYAJIN!', 2: 'SUPER SAYAJIN 2!', 3: 'SUPER SAYAJIN 3!!', deus: 'MODO DEUS!', branco: 'INSTINTO SUPREMO!' };
    p.est = { bracos: 'poder', boca: 'grito', dy: 1 };
    fala(p, opc.fala || 'Haaaaaaa!!!', 2300);
    KM.tocar('poder');
    st.tremorFixo = true;
    const ini = performance.now();
    p.auraAtras = (ctx, ax, ay, t) => KM.desenharParticulas(ctx, t, 'atras');
    while (performance.now() - ini < 2300) {
      const k = (performance.now() - ini) / 2300;
      st.tremor = 0.5 + k * 2.5;
      const [x, y] = pes(p);
      KM.emitir('aura', Math.round(2 + k * 6), i => ({ x: x + rnd(-8 - k * 4, 8 + k * 4), y: y - rnd(0, 42), vy: rnd(-60, -30), vida: rnd(0.25, 0.5), cor: corAura, atras: true }));
      if (Math.random() < 0.35) KM.emitir('pedra', 1, { x: x + rnd(-30, 30), y: y + rnd(-4, 6), vy: rnd(-22, -10), vida: 2.5, g: 0 });
      if (Math.random() < 0.25 * k) KM.emitir('faisca', 4, { x: x + rnd(-10, 10), y: y - rnd(10, 30), dvx: 60, dvy: 60, vida: 0.25, cor: '#ffffff' });
      p.est.dy = Math.floor(performance.now() / 60) % 2;
      await esperar(40);
    }
    st.tremorFixo = false; st.flash = 1.2; st.corFlash = '#ffffff'; st.tremor = 4;
    KM.tocar('explosao');
    for (const q of KM.particulas) if (q.tipo === 'pedra') { q.g = 220; q.vy = rnd(-40, 0); q.vx = rnd(-60, 60); q.chao = q.y + 30; }
    p.est = { bracos: 'poder', boca: 'normal', saiyan: nivel };
    KM.onBanner(nomes[nivel] || nomes[1], nivel);
    const [x0, y0] = pes(p);
    KM.emitir('faisca', 40, { x: x0, y: y0 - 18, dvx: 140, dvy: 140, vida: 0.6, cor: corAura });
    const dur = opc.dur || 4200;
    const ini2 = performance.now();
    while (performance.now() - ini2 < dur) {
      const [x, y] = pes(p);
      KM.emitir('aura', 6, i => ({ x: x + rnd(-10, 10), y: y - rnd(-2, 44), vy: rnd(-70, -40), vida: rnd(0.25, 0.45), cor: corAura, atras: true }));
      KM.emitir('aura', 1, i => ({ x: x + rnd(-12, 12), y: y - rnd(0, 38), vy: rnd(-70, -40), vida: 0.2, cor: corAura }));
      if ((nivel === 2 || nivel === 3 || nivel === 'deus') && Math.random() < 0.3) {
        const pts = []; for (let k = 0; k < 4; k++) pts.push([rnd(-5, 5), rnd(3, 7)]);
        KM.emitir('raio', 1, { x: x + rnd(-12, 12), y: y - rnd(20, 40), vida: 0.12, pts, cor: corRaio });
        if (Math.random() < 0.4) KM.tocar('zap');
      }
      p.est.boca = (performance.now() - ini2) > 1200 ? 'sorriso' : 'normal';
      p.est.bracos = (performance.now() - ini2) > 2200 ? 'baixo' : 'poder';
      st.tremor = Math.max(st.tremor, 0.4);
      await esperar(40);
    }
    st.flash = 0.6; KM.tocar('teleporte');
    p.est = { boca: 'sorriso', olhos: 'feliz' };
    p.auraAtras = null;
    await esperar(500);
    if (!opc.ficarDePe) await voltarSentar(p);
  }, [id || (alvo() && alvo().id)]);

  KM.danca = id => rodar('danca', async p => {
    await irAoTapete(p);
    fala(p, 'Hora da dança da vitória! 🕺', 2200);
    const ini = performance.now();
    KM.tocar('batida');
    while (performance.now() - ini < 4200) {
      st.disco = Math.min(1, (performance.now() - ini) / 500);
      const fase = Math.floor((performance.now() - ini) / 260) % 4;
      p.est = { bracos: ['cima', 'aceno', 'cima', 'baixo'][fase], boca: 'sorriso', olhos: fase % 2 ? 'feliz' : undefined, dy: fase % 2, aceno: fase === 1 ? 1 : 0, passo: [1, 0, 2, 0][fase] };
      p.dir = ['fe', 'fd', 'cd', 'ce'][Math.floor((performance.now() - ini) / 520) % 4];
      if (Math.random() < 0.3) KM.emitir('estrela', 1, { x: KM.W / 2 + rnd(-80, 80), y: rnd(40, 160), vida: 0.5, cor: ['#ff5c8a', '#3fb6ff', '#ffd93b'][Math.floor(Math.random() * 3)] });
      await esperar(60);
    }
    KM.confete(80);
    for (let k = 1; k >= 0; k -= 0.1) { st.disco = k; await esperar(40); }
    p.dir = 'fe';
    await voltarSentar(p);
  }, [id || (alvo() && alvo().id)]);

  KM.cafe = id => rodar('cafe', async p => {
    p.dormindo = false;
    const pc = KM.LAYOUT.pontos.cafe;
    if (pc && !p.trabalhando) {
      fala(p, 'Vou pegar um café ☕', 1600);
      await irAte(p, pc.X, pc.Y); p.dir = pc.dir;
      KM.estado.cafeCopa = true; KM.tocar('bip');
      await esperar(1400);
      KM.estado.cafeCopa = false; p.dir = 'fe';
      p.est = { bracos: 'cafe', olhos: 'fechados' };
      KM.tocar('gole');
      await esperar(1300);
      p.est = {};
    }
    if (p.modo !== 'sentado') await voltarSentar(p);
    p.est = { bracos: 'cafe', olhos: 'fechados' };
    KM.estado.cafe = true;
    KM.tocar('gole');
    await esperar(900);
    p.est = { boca: 'o' };
    fala(p, 'CAFÉ TURBO ATIVADO! ☕⚡', 2000);
    p.digitando = true; p.turbo = true;
    const ini = performance.now();
    while (performance.now() - ini < 4500) {
      const [x, y] = cabeca(p);
      KM.emitir('vento', 2, { x: x - 20 + rnd(-6, 0), y: y + rnd(0, 26), vx: -60, vida: 0.3 });
      if (Math.random() < 0.08) KM.emitir('gota', 1, { x: x + 6, y: y + 2, vy: 10, g: 60, vida: 0.6 });
      if (Math.random() < 0.3) KM.emitir('pixel', 2, { x: x + 6, y: y + 24, dvx: 40, vy: -30, dvy: 20, g: 100, vida: 0.5, cor: '#ffffff' });
      p.est.boca = Math.floor(performance.now() / 300) % 2 ? 'sorriso' : 'o';
      st.tremor = 0.4;
      await esperar(50);
    }
    p.turbo = false; p.digitando = !!p.trabalhando;
    KM.estado.cafe = false;
    p.est = {};
  }, [id || (alvo() && alvo().id)]);

  KM.soneca = (seg = 0, id) => rodar('soneca', async p => {
    if (p.modo !== 'sentado') await voltarSentar(p);
    p.dormindo = true; p.digitando = false;
    p.est = { olhos: 'fechados', cabecaDy: 2, bracos: 'frente' };
    const ini = performance.now();
    while (p.dormindo && !p.pararRotina && (!seg || performance.now() - ini < seg * 1000)) {
      const [x, y] = cabeca(p);
      KM.emitir('z', 1, { x: x + 6, y: y + 2, vx: 6, vy: -9, vida: 2.2 });
      await esperar(900);
    }
    p.dormindo = false;
    p.est = { boca: 'o' };
    fala(p, 'Hã? Tô acordado! 😅', 1600);
    await esperar(600);
    p.est = {};
  }, [id || (alvo() && alvo().id)]);
  KM.acordar = id => { for (const p of id ? [pessoa(id)] : todas()) if (p) p.dormindo = false; };

  KM.foco = id => rodar('foco', async p => {
    if (p.modo !== 'sentado') await voltarSentar(p);
    const tvAntes = KM.estado.tv.modo;
    KM.estado.tv.modo = 'matrix'; KM.estado.matrix = true;
    const ap = KM.aparenciaDe(KM.config(), p.id), oculosAntes = ap.oculos;
    ap.oculos = true;
    p.digitando = true; p.turbo = true;
    p.est = { brilhoOculos: true };
    fala(p, 'Modo foco: entrando na Matrix contábil 🧠', 2400);
    const ini = performance.now();
    while (performance.now() - ini < 4800) {
      st.verde = Math.min(1, (performance.now() - ini) / 600);
      KM.emitir('digito', 3, i => ({ x: Math.floor(rnd(0, KM.W / 4)) * 4, y: -6, vy: rnd(50, 90), vida: 3, d: Math.floor(Math.random() * 10), cor: Math.random() < 0.5 ? '#28BE52' : '#7dffa0' }));
      if (Math.random() < 0.25) KM.tocar('bip');
      p.est.brilhoOculos = Math.floor(performance.now() / 400) % 2 === 0;
      await esperar(60);
    }
    ap.oculos = oculosAntes;
    KM.estado.tv.modo = tvAntes === 'matrix' ? 'normal' : tvAntes;
    KM.estado.matrix = false; p.turbo = false; p.digitando = !!p.trabalhando;
    p.est = {};
  }, [id || (alvo() && alvo().id)]);

  KM.pulos = id => rodar('pulo', async p => {
    await irAoTapete(p);
    p.est = { bracos: 'cima', boca: 'sorriso', olhos: 'feliz' };
    fala(p, 'Uhuuul! 🚀', 1500);
    for (let n = 0; n < 3; n++) {
      KM.tocar('pulo');
      await pular(p, 16, 420);
      const [x, y] = pes(p);
      KM.emitir('estrela', 5, { x, y: y - 20, dvx: 50, vy: -20, dvy: 20, vida: 0.7 });
      await esperar(80);
    }
    p.est = {};
    await voltarSentar(p);
  }, [id || (alvo() && alvo().id)]);
  function pular(p, alt = 16, ms = 420) {
    const ini = performance.now();
    return quadroAQuadro(() => {
      const k = (performance.now() - ini) / ms;
      p.Z = Math.max(0, Math.sin(Math.min(1, k) * Math.PI) * alt);
      if (k >= 1) { p.Z = 0; return true; }
      return false;
    });
  }
  KM.mov.pular = pular;

  function sumir(p) {
    const a = KM.aparenciaDe(KM.config(), p.id), cs = [a.pele, a.corCamisa, a.corCabelo, a.calca, '#ffffff'];
    const [x, y] = pes(p); const alto = p.modo === 'sentado' ? 32 : 42;
    KM.emitir('pixel', 70, i => ({ x: x + rnd(-6, 6), y: y - rnd(0, alto), vx: rnd(-10, 10), vy: rnd(-70, -20), vida: rnd(0.5, 0.9), cor: cs[i % cs.length] }));
    KM.emitir('estrela', 4, { x, y: y - 18, dx: 8, dy: 12, vida: 0.5, cor: '#b0f0ff' });
  }
  KM.mov.sumir = sumir;
  KM.teleporte = id => rodar('teleporte', async p => {
    KM.tocar('teleporte');
    sumir(p); p.visivel = false;
    await esperar(700);
    const [tx, ty] = assento(p).tapete;
    p.modo = 'em-pe'; p.X = tx; p.Y = ty; p.dir = 'fe'; p.foraDaMesa = true; p.est = { bracos: 'aceno', boca: 'sorriso' };
    p.visivel = true; sumir(p); st.flash = 0.35; st.corFlash = '#b0f0ff';
    fala(p, 'Teletransporte contábil! ✨', 1800);
    for (let i = 0; i < 6; i++) { p.est.aceno = i % 2; await esperar(220); }
    KM.tocar('teleporte');
    sumir(p); p.visivel = false;
    await esperar(700);
    const a = assento(p);
    p.modo = 'sentado'; p.X = a.X; p.Y = a.Y; p.dir = a.dir; p.foraDaMesa = false; p.est = {}; p.visivel = true; sumir(p);
  }, [id || (alvo() && alvo().id)]);

  // Comemoração quando entrega uma tarefa.
  KM.comemorar = async function (nivelSaiyan, id) {
    KM.confete(90);
    if (nivelSaiyan) await KM.superSayajin(nivelSaiyan, { fala: 'Tarefa entregue! Haaaa!!', dur: 3200 }, id);
  };
})();
