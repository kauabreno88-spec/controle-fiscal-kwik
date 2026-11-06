/* KWIK Mini Escritório · Sala META.
   Meta de clientes (padrão 10). Cada cliente tem mensalidade (R$/mês) e situação:
   - ativo: o líquido VERDE do tanque sobe (é o "dinheiro" entrando);
   - possível fechamento: aparece em AMARELO transparente por cima do verde.
   Mudou de "possível" para "ativo"? O amarelo vira verde. O faturamento total da KWIK fica bem grande no topo.
   Os clientes são os mesmos de Configurações → Clientes ativos (cfg.clientes). */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const num = s => { const t = String(s ?? '').replace(/[^\d,.-]/g, ''); if (!t) return 0; const n = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t; return Math.max(0, Number(n) || 0); };

  const ativo = c => (c.status || 'ativo') === 'ativo';
  KM.metaDados = cfg => {
    const cl = (cfg.clientes || []).filter(c => (c.nome || '').trim());
    const meta = Math.max(1, Number(cfg.meta && cfg.meta.clientes) || 10);
    const at = cl.filter(ativo), ng = cl.filter(c => !ativo(c));
    const total = at.reduce((s, c) => s + (Number(c.valor) || 0), 0), totalNeg = ng.reduce((s, c) => s + (Number(c.valor) || 0), 0);
    return { meta, ativos: at, negociacao: ng, qAtivos: at.length, qNeg: ng.length, total, totalNeg, pctAtivo: at.length / meta, pctTotal: (at.length + ng.length) / meta };
  };

  // ------------------------------------------------------------------ diálogo
  let raf = 0, nivelV = 0, nivelA = 0, bolhas = [], respingos = [], ultimoT = 0, totalMostrado = 0;
  function montar() {
    if ($('#dlgMeta')) return;
    const d = document.createElement('dialog');
    d.id = 'dlgMeta'; d.className = 'meta-dlg';
    d.innerHTML = `
      <div class="dlg-topo"><h2>🎯 Sala META</h2><button data-fechar aria-label="Fechar">×</button></div>
      <div class="dlg-corpo meta-corpo">
        <div class="meta-topo">
          <small>A KWIK está faturando</small>
          <div class="meta-total" id="metaTotal">R$ 0,00</div>
          <small id="metaSub">por mês</small>
        </div>
        <div class="meta-grade">
          <div class="meta-tanque">
            <canvas id="metaCanvas" width="220" height="300"></canvas>
            <div class="meta-legenda"><span><i class="v"></i> Ativos <b id="metaQAt">0</b></span><span><i class="a"></i> Possível fechamento <b id="metaQNg">0</b></span></div>
            <label class="meta-alvo">🎯 Meta de clientes <input type="number" id="metaAlvo" min="1" max="999" step="1"></label>
          </div>
          <div class="meta-lista">
            <h3>✅ Clientes ativos <span class="chip" id="metaChipAt">0</span></h3>
            <div id="metaAtivos"></div>
            <h3 style="margin-top:16px">🟡 Possível fechamento <span class="chip" id="metaChipNg">0</span></h3>
            <div id="metaNeg"></div>
            <div class="meta-bts">
              <button class="bt prim peq" id="metaNovoAt">＋ Cliente ativo</button>
              <button class="bt peq" id="metaNovoNg">＋ Possível fechamento</button>
            </div>
            <p class="vazio" style="font-size:12px;margin-top:10px">Toque em ✅ para transformar um possível fechamento em cliente ativo: o amarelo vira verde 💚. Os ativos aparecem também no telão do Relacionamento e em Configurações.</p>
          </div>
        </div>
      </div>`;
    document.body.append(d);
    d.querySelector('[data-fechar]').addEventListener('click', () => d.close());
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    d.addEventListener('close', () => cancelAnimationFrame(raf));
    $('#metaNovoAt').addEventListener('click', () => novo('ativo'));
    $('#metaNovoNg').addEventListener('click', () => novo('negociacao'));
    $('#metaAlvo').addEventListener('input', e => { const c = A().cfg(); c.meta = c.meta || {}; c.meta.clientes = Math.max(1, Math.round(Number(e.target.value) || 10)); A().salvar(); atualizarNums(); });
  }
  function novo(status) {
    const c = A().cfg(); c.clientes = c.clientes || [];
    c.clientes.push({ nome: '', telefone: '', valor: 0, status });
    renderListas();
    const ins = document.querySelectorAll(status === 'ativo' ? '#metaAtivos .m-nome' : '#metaNeg .m-nome');
    if (ins.length) ins[ins.length - 1].focus();
  }
  function abrir() {
    montar();
    const c = A().cfg(); c.meta = c.meta || { clientes: 10 };
    $('#metaAlvo').value = c.meta.clientes || 10;
    const md = KM.metaDados(c);
    nivelV = 0; nivelA = 0; totalMostrado = 0; bolhas = []; respingos = [];
    renderListas();
    $('#dlgMeta').showModal();
    KM.tocar('magia');
    ultimoT = performance.now();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(quadro);
    if (md.qAtivos >= md.meta) setTimeout(() => A().toast('🏆 Meta batida! Parabéns, KWIK! 🎉'), 900);
  }

  function renderListas() {
    const c = A().cfg(); c.clientes = c.clientes || [];
    const boxA = $('#metaAtivos'), boxN = $('#metaNeg');
    boxA.innerHTML = ''; boxN.innerHTML = '';
    c.clientes.forEach((cl, i) => {
      const at = ativo(cl);
      const linha = document.createElement('div');
      linha.className = 'm-linha' + (at ? ' at' : ' ng');
      linha.innerHTML = `<input class="m-nome" type="text" placeholder="Nome do cliente" maxlength="80"><div class="m-valor"><span>R$</span><input type="text" inputmode="decimal" placeholder="0,00"></div><button class="bt peq m-st" title="${at ? 'Voltar para possível fechamento' : 'Fechou! Virar cliente ativo'}">${at ? '↩️' : '✅'}</button><button class="bt peq perigo m-del" title="Remover">🗑️</button>`;
      const [inNome, inValor] = linha.querySelectorAll('input');
      inNome.value = cl.nome || '';
      inValor.value = cl.valor ? Number(cl.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
      inNome.addEventListener('input', () => { cl.nome = inNome.value; A().salvar(); atualizarNums(); });
      inValor.addEventListener('input', () => { cl.valor = num(inValor.value); A().salvar(); atualizarNums(); });
      inValor.addEventListener('blur', () => { if (cl.valor) inValor.value = Number(cl.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); });
      linha.querySelector('.m-st').addEventListener('click', () => {
        cl.status = at ? 'negociacao' : 'ativo';
        A().salvar(); renderListas();
        if (!at) fechou(cl);
        else KM.tocar('clique');
      });
      linha.querySelector('.m-del').addEventListener('click', () => {
        if ((cl.nome || '').trim() && !confirm(`Remover ${cl.nome}?`)) return;
        c.clientes.splice(i, 1); A().salvar(); renderListas();
      });
      (at ? boxA : boxN).append(linha);
    });
    if (!boxA.children.length) boxA.innerHTML = '<p class="vazio">Nenhum cliente ativo ainda.</p>';
    if (!boxN.children.length) boxN.innerHTML = '<p class="vazio">Coloque aqui quem está em negociação.</p>';
    atualizarNums();
  }
  function atualizarNums() {
    const md = KM.metaDados(A().cfg());
    $('#metaQAt').textContent = `${md.qAtivos}/${md.meta}`; $('#metaQNg').textContent = md.qNeg;
    $('#metaChipAt').textContent = brl(md.total); $('#metaChipNg').textContent = brl(md.totalNeg);
    $('#metaSub').textContent = `por mês · ${md.qAtivos} de ${md.meta} clientes da meta` + (md.totalNeg ? ` · +${brl(md.totalNeg)} em negociação` : '');
  }
  function fechou(cl) {
    KM.tocar('caixa'); setTimeout(() => KM.tocar('sucesso'), 250);
    for (let i = 0; i < 40; i++) respingos.push({ x: 110 + (Math.random() * 80 - 40), y: 150, vx: Math.random() * 140 - 70, vy: -60 - Math.random() * 160, vida: 1 });
    A().toast(`💚 ${cl.nome || 'Novo cliente'} fechou! +${brl(cl.valor)} por mês`, { ms: 6000 });
    const md = KM.metaDados(A().cfg());
    if (md.qAtivos === md.meta) { setTimeout(() => { A().toast('🏆 META BATIDA! A equipe toda comemora! 🎉', { ms: 8000 }); KM.confete(160); }, 700); }
    // a equipe comemora na hora
    if (A().todosComemoram) A().todosComemoram(null);
  }

  // ------------------------------------------------------------------ tanque animado (canvas)
  function quadro(agora) {
    const cv = $('#metaCanvas'); if (!cv || !$('#dlgMeta').open) return;
    const dt = Math.min(0.05, (agora - ultimoT) / 1000); ultimoT = agora;
    const t = agora / 1000, g = cv.getContext('2d'), W = cv.width, H = cv.height;
    const md = KM.metaDados(A().cfg());
    const alvoV = Math.min(1, md.pctAtivo), alvoA = Math.min(1, md.pctTotal);
    nivelV += (alvoV - nivelV) * Math.min(1, dt * 1.6);
    nivelA += (alvoA - nivelA) * Math.min(1, dt * 1.6);
    // total grande subindo
    totalMostrado += (md.total - totalMostrado) * Math.min(1, dt * 3);
    if (Math.abs(md.total - totalMostrado) < 0.5) totalMostrado = md.total;
    $('#metaTotal').textContent = brl(totalMostrado);

    g.clearRect(0, 0, W, H);
    const x0 = 40, x1 = W - 40, top = 34, base = H - 46, alt = base - top;
    // sombra e base
    g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.ellipse(W / 2, H - 22, 86, 10, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#495057'; g.fillRect(x0 - 14, base + 6, x1 - x0 + 28, 22); g.fillStyle = '#868e96'; g.fillRect(x0 - 14, base + 6, x1 - x0 + 28, 4);
    // vidro (fundo)
    g.fillStyle = '#e7f5ff'; roundRect(g, x0, top, x1 - x0, alt + 6, 14); g.fill();
    // líquido amarelo (possível)
    const yA = base - alt * nivelA, yV = base - alt * nivelV;
    const onda = (x, fase, amp) => Math.sin(t * 2.6 + x * 0.06 + fase) * amp + Math.sin(t * 1.7 + x * 0.11) * amp * 0.5;
    g.save(); roundRect(g, x0, top, x1 - x0, alt + 6, 14); g.clip();
    if (nivelA > nivelV + 0.002) {
      g.fillStyle = 'rgba(255,212,59,0.42)';
      g.beginPath(); g.moveTo(x0, base + 8);
      for (let x = x0; x <= x1; x += 4) g.lineTo(x, yA + onda(x, 1.3, 3));
      g.lineTo(x1, base + 8); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,236,153,0.95)'; g.lineWidth = 2; g.beginPath();
      for (let x = x0; x <= x1; x += 4) x === x0 ? g.moveTo(x, yA + onda(x, 1.3, 3)) : g.lineTo(x, yA + onda(x, 1.3, 3));
      g.stroke();
    }
    if (nivelV > 0.001) {
      const grad = g.createLinearGradient(0, yV, 0, base);
      grad.addColorStop(0, '#51cf66'); grad.addColorStop(0.35, '#2fb35a'); grad.addColorStop(1, '#1e8a45');
      g.fillStyle = grad;
      g.beginPath(); g.moveTo(x0, base + 8);
      for (let x = x0; x <= x1; x += 4) g.lineTo(x, yV + onda(x, 0, 4));
      g.lineTo(x1, base + 8); g.closePath(); g.fill();
      g.strokeStyle = '#b2f2bb'; g.lineWidth = 2; g.beginPath();
      for (let x = x0; x <= x1; x += 4) x === x0 ? g.moveTo(x, yV + onda(x, 0, 4)) : g.lineTo(x, yV + onda(x, 0, 4));
      g.stroke();
      // bolhas e cifrões subindo
      if (Math.random() < 0.25) bolhas.push({ x: x0 + 10 + Math.random() * (x1 - x0 - 20), y: base, v: 20 + Math.random() * 30, r: 2 + Math.random() * 3, cif: Math.random() < 0.25 });
    }
    bolhas = bolhas.filter(b => {
      b.y -= b.v * dt; b.x += Math.sin(t * 3 + b.y * 0.1) * 0.3;
      if (b.y < yV + 6) return false;
      if (b.cif) { g.fillStyle = 'rgba(255,243,160,0.9)'; g.font = 'bold 12px Montserrat, sans-serif'; g.fillText('$', b.x - 3, b.y); }
      else { g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1; g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2); g.stroke(); }
      return true;
    });
    g.restore();
    // marcas da meta
    g.font = 'bold 10px Montserrat, sans-serif'; g.textAlign = 'left';
    for (let k = 1; k <= md.meta; k++) {
      const y = base - alt * k / md.meta;
      g.fillStyle = k === md.meta ? '#e03131' : 'rgba(17,26,25,0.35)';
      g.fillRect(x1 - 14, Math.round(y), 10, k === md.meta ? 2 : 1);
      if (md.meta <= 20 || k % 5 === 0) { g.fillStyle = 'rgba(17,26,25,0.55)'; g.fillText(String(k), x1 + 6, y + 4); }
    }
    g.fillStyle = '#e03131'; g.font = 'bold 12px Montserrat, sans-serif'; g.textAlign = 'center'; g.fillText('🎯 META ' + md.meta, W / 2, top - 10);
    // contorno do vidro e brilho
    g.strokeStyle = '#1c1612'; g.lineWidth = 3; roundRect(g, x0, top, x1 - x0, alt + 6, 14); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x0 + 10, top + 12, 6, alt - 30); g.fillRect(x0 + 20, top + 12, 3, 40);
    // respingos quando fecha cliente
    respingos = respingos.filter(p => {
      p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vida -= dt * 0.8;
      g.fillStyle = `rgba(64,192,87,${Math.max(0, p.vida)})`; g.fillRect(p.x, p.y, 4, 4);
      return p.vida > 0;
    });
    // número no pé
    g.fillStyle = md.qAtivos >= md.meta ? '#ffd43b' : '#ffffff'; g.font = 'bold 16px Montserrat, sans-serif'; g.textAlign = 'center';
    g.fillText(`${md.qAtivos} / ${md.meta}`, W / 2, base + 24);
    raf = requestAnimationFrame(quadro);
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  KM.meta = { abrir, dados: () => KM.metaDados(A().cfg()) };
})();
