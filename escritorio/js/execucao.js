/* KWIK Mini Escritório · Sala de Execução.
   Mostra e anota as atividades que estão sendo executadas. Para cada atividade em andamento aparece um
   rapaz com o uniforme da KWIK sentado numa mesa, trabalhando. Toque na sala para abrir a lista: anote uma
   atividade nova ou marque como finalizada (ele comemora e vai embora).
   A sala cresce quando passa do limite de mesas: primeiro para o lado (2 vagas) e depois para baixo.
   Fica em cfg.execucao (sincronizado com o GitHub). */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  KM.objetos = KM.objetos || [];
  KM.noChao = KM.noChao || [];

  const lista = () => { const c = A().cfg(); c.execucao = c.execucao || []; return c.execucao; };
  const ativas = () => lista().filter(a => !a.fim).sort((a, b) => String(a.inicio).localeCompare(String(b.inicio)));

  // uniforme KWIK com rostos variados
  const ROSTOS = [['#E8B48F', 'curto', '#3B2416'], ['#C68642', 'topete', '#1C1C1C'], ['#F5D0B5', 'curto', '#B5651D'], ['#8D5524', 'cacheado', '#1C1C1C'],
    ['#E0AC82', 'moicano', '#2B1B12'], ['#FFDBAC', 'curto', '#6B4226'], ['#5C3A21', 'careca', '#1C1C1C'], ['#F1C9A5', 'topete', '#E6C35C']];
  function aparencia(i) {
    const [pele, cabelo, corCabelo] = ROSTOS[i % ROSTOS.length];
    return {
      pele, cabelo, corCabelo, estiloCamisa: 'kwik', corCamisa: '#28BE52', corGravata: '#111A19', calca: '#2F3A4A', sapato: '#1A1A1A',
      oculos: i % 5 === 3, fone: i % 4 === 1, bone: false, barba: i % 3 === 2, corBone: '#28BE52', cracha: true, corCordao: '#111A19', chapeu: '',
      baixo: 'calca', calcado: 'tenis', altura: 'normal', cachecol: false, corCachecol: '#c9453a', olhos: 'normal', sobrancelha: 'normal', boca: 'normal',
      sardas: false, bochechas: false, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: false, corRelogio: '#212529', colar: false,
      corColar: '#e2b33c', brinco: false, corBrinco: '#e2b33c', corFone: '#111A19', corOculos: '#1b1b1b',
    };
  }
  const hashId = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

  // ------------------------------------------------------------------ rapazes na sala
  const npcs = new Map(); // id da atividade -> npc
  const assentos = () => (KM.LAYOUT && KM.LAYOUT.pontos.execucao) || [];
  function novoNpc(a, seat, entrando) {
    const s = KM.LAYOUT.salas.execucao;
    const npc = { id: 'exec-' + a.id, ativ: a.id, X: entrando ? s.porta[0] : seat.X, Y: entrando ? s.porta[1] : seat.Y, Z: 0, dir: 'ce', modo: entrando ? 'em-pe' : 'sentado',
      est: {}, fase: Math.random() * 3, visivel: true, digitando: !entrando, ap: aparencia(hashId(a.id)), seat, estado: entrando ? 'entrando' : 'sentado' };
    npcs.set(a.id, npc);
    if (entrando) entrar(npc);
    return npc;
  }
  async function andar(npc, x, y, vel = 42) { for (const [a, b] of KM.rota(npc.X, npc.Y, x, y)) await KM.mov.andarAte(npc, a, b, vel); }
  async function entrar(npc) {
    await andar(npc, npc.seat.X, npc.seat.Y + 13);
    if (npc.estado !== 'entrando') return;
    Object.assign(npc, { modo: 'sentado', X: npc.seat.X, Y: npc.seat.Y, dir: 'ce', digitando: true, estado: 'sentado', est: {} });
    KM.emitir('texto', 1, { x: npc.X, y: npc.Y - 44, vy: -10, vida: 1.5, s: 'BORA!', cor: '#51cf66' });
  }
  async function sair(npc) {
    npc.estado = 'saindo'; npc.digitando = false;
    const s = KM.LAYOUT.salas.execucao;
    Object.assign(npc, { modo: 'em-pe', X: npc.seat.X, Y: npc.seat.Y + 13, dir: 'fe', est: { bracos: 'cima', boca: 'sorriso', olhos: 'feliz' } });
    KM.emitir('texto', 1, { x: npc.X, y: npc.Y - 52, vy: -12, vida: 1.8, s: 'FEITO!', cor: '#ffd43b' });
    KM.emitir('confete', 30, i => ({ x: npc.X + (Math.random() * 30 - 15), y: npc.Y - 50 - Math.random() * 20, vy: 20, g: 40, vida: 2, cor: ['#28BE52', '#ffd93b', '#ffffff'][i % 3] }));
    KM.tocar('sucesso');
    for (let i = 0; i < 2; i++) { await KM.mov.pular(npc, 10, 360); }
    npc.est = { bracos: 'aceno', aceno: 1, boca: 'sorriso' };
    await KM.esperar(500);
    npc.est = {};
    await andar(npc, s.porta[0], s.porta[1], 50);
    const c = s.corrBaixo || s.corrCima;
    if (c) await andar(npc, c.x + 6, c.y + 22, 56);
    npcs.delete(npc.ativ);
  }

  // Coloca cada atividade ativa numa mesa (mesmo depois de a sala crescer)
  function sincronizar(entrando) {
    if (!KM.LAYOUT || !KM.LAYOUT.salas.execucao) return;
    const at = ativas(), seats = assentos();
    const ids = new Set(at.map(a => a.id));
    for (const [id, n] of npcs) if (!ids.has(id) && n.estado !== 'saindo') npcs.delete(id);
    at.forEach((a, i) => {
      const seat = seats[i]; if (!seat) return;
      const n = npcs.get(a.id);
      if (!n) novoNpc(a, seat, entrando === a.id);
      else if (n.seat !== seat) { n.seat = seat; if (n.estado === 'sentado') Object.assign(n, { X: seat.X, Y: seat.Y }); }
    });
  }
  // desenho: cada mesa da sala é um objeto (cadeira vazia ou rapaz trabalhando)
  const objMesas = [];
  function registrarDesenho() {
    for (const o of objMesas) { const i = KM.objetos.indexOf(o); if (i >= 0) KM.objetos.splice(i, 1); }
    objMesas.length = 0;
    const cfg = () => A().cfg();
    for (const seat of assentos()) {
      const o = {
        Y: seat.Y + 0.4, f: (g, t) => {
          const n = [...npcs.values()].find(q => q.seat === seat && q.estado === 'sentado');
          if (n) { KM.desenharPessoa(g, cfg(), n, t, { aparencia: n.ap }); KM.desenharCadeira(g, seat.X, seat.Y, true); }
          else KM.desenharCadeira(g, seat.X, seat.Y, false);
        },
      };
      objMesas.push(o); KM.objetos.push(o);
    }
  }
  // telas das mesas ocupadas acesas (desenhadas antes das pessoas)
  KM.noChao.push((ctx, t) => {
    for (const n of npcs.values()) {
      if (n.estado !== 'sentado' || !n.seat.mesa) continue;
      const m = n.seat.mesa, cx = m.X + (m.w >> 1), ty = m.Y - m.h;
      ctx.fillStyle = '#0c2a16'; ctx.fillRect(cx - 7, ty - 12, 14, 8);
      const k = Math.floor(t * 4 + n.fase * 3);
      for (let l = 0; l < 3; l++) { ctx.fillStyle = l === 2 ? '#51cf66' : '#2f9e44'; ctx.fillRect(cx - 6, ty - 11 + l * 2, 3 + ((k + l * 3) % 9), 1); }
      ctx.fillStyle = 'rgba(120,230,160,0.10)'; ctx.fillRect(cx - 12, ty - 4, 24, 14);
    }
  });
  // quem está entrando ou saindo é desenhado em pé, na profundidade certa
  const objsAndando = new Map();
  setInterval(() => {
    for (const n of npcs.values()) {
      if (n.estado === 'sentado') { const o = objsAndando.get(n); if (o) { KM.objetos.splice(KM.objetos.indexOf(o), 1); objsAndando.delete(n); } continue; }
      if (!objsAndando.has(n)) { const o = { get Y() { return n.Y; }, f: (g, t) => KM.desenharPessoa(g, A().cfg(), n, t, { aparencia: n.ap }) }; objsAndando.set(n, o); KM.objetos.push(o); }
    }
    for (const [n, o] of objsAndando) if (!npcs.has(n.ativ) || npcs.get(n.ativ) !== n) { const i = KM.objetos.indexOf(o); if (i >= 0) KM.objetos.splice(i, 1); objsAndando.delete(n); }
  }, 100);

  function layoutMudou() { registrarDesenho(); sincronizar(); }

  // ------------------------------------------------------------------ diálogo
  const dd = n => String(n).padStart(2, '0');
  const quando = iso => { const d = new Date(iso); return `${dd(d.getDate())}/${dd(d.getMonth() + 1)} ${dd(d.getHours())}:${dd(d.getMinutes())}`; };
  const duracao = (a, b) => { const m = Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000)); return m < 60 ? `${m} min` : m < 1440 ? `${Math.floor(m / 60)}h${m % 60 ? dd(m % 60) : ''}` : `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`; };
  function montar() {
    if ($('#dlgExec')) return;
    const d = document.createElement('dialog');
    d.id = 'dlgExec'; d.className = 'exec-dlg';
    d.innerHTML = `
      <div class="dlg-topo"><h2>⚙️ Sala de Execução</h2><button data-fechar aria-label="Fechar">×</button></div>
      <div class="dlg-corpo">
        <div class="exec-resumo" id="execResumo"></div>
        <form id="formExec" class="form-exec" autocomplete="off">
          <input id="eTitulo" type="text" maxlength="90" placeholder="Atividade em execução (ex.: Folha de novembro da Clínica X)" required>
          <input id="eCliente" type="text" list="eClientes" maxlength="80" placeholder="Cliente (opcional)"><datalist id="eClientes"></datalist>
          <select id="eResp"></select>
          <input id="eObs" type="text" maxlength="160" placeholder="Observação (opcional)">
          <button class="bt prim" type="submit">＋ Colocar em execução</button>
        </form>
        <h3 class="exec-tit">🟢 Em execução agora</h3>
        <ul class="exec-lista" id="execAtivas"></ul>
        <h3 class="exec-tit">✅ Finalizadas</h3>
        <ul class="exec-lista feitas" id="execFeitas"></ul>
      </div>`;
    document.body.append(d);
    d.querySelector('[data-fechar]').addEventListener('click', () => d.close());
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    $('#formExec').addEventListener('submit', adicionar);
  }
  function abrir() {
    montar();
    const cfg = A().cfg();
    $('#eClientes').innerHTML = (cfg.clientes || []).map(c => `<option value="${String(c.nome || '').replace(/"/g, '&quot;')}">`).join('');
    const sel = $('#eResp'); sel.innerHTML = '';
    sel.append(new Option('👷 Equipe de execução', ''));
    for (const f of cfg.funcionarios) if (f.funcao !== 'limpeza') sel.append(new Option(`${f.nome} · ${f.cargo}`, f.id));
    render();
    $('#dlgExec').showModal();
    setTimeout(() => $('#eTitulo').focus(), 60);
  }
  function render() {
    const at = ativas(), feitas = lista().filter(a => a.fim).sort((a, b) => String(b.fim).localeCompare(String(a.fim)));
    const hoje = new Date().toDateString(), feitasHoje = feitas.filter(a => new Date(a.fim).toDateString() === hoje).length;
    const tam = KM.tamanhoExecucao(at.length);
    $('#execResumo').innerHTML = `<div><b>${at.length}</b><small>em execução</small></div><div><b>${feitasHoje}</b><small>finalizadas hoje</small></div><div><b>${tam.vagas}</b><small>mesas na sala</small></div>`;
    const ul = $('#execAtivas'); ul.innerHTML = '';
    if (!at.length) ul.innerHTML = '<li class="vazio">Nenhuma atividade em execução. Anote uma acima 👆 e um colaborador senta para fazer.</li>';
    const nomeResp = id => { const f = A().cfg().funcionarios.find(x => x.id === id); return f ? f.nome : 'Equipe de execução'; };
    at.forEach((a, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="ex-n">${i + 1}</span><div class="ex-info"><b></b><small></small><p></p></div><div class="ex-bts"><button class="bt prim peq" data-a="ok">✅ Finalizar</button><button class="bt peq perigo" data-a="del" title="Remover sem finalizar">🗑️</button></div>`;
      li.querySelector('b').textContent = a.titulo;
      li.querySelector('small').textContent = `${a.cliente ? '🏢 ' + a.cliente + ' · ' : ''}👤 ${nomeResp(a.responsavel)} · desde ${quando(a.inicio)} (${duracao(a.inicio, new Date().toISOString())})`;
      li.querySelector('p').textContent = a.obs || '';
      li.querySelector('[data-a=ok]').addEventListener('click', () => finalizar(a.id));
      li.querySelector('[data-a=del]').addEventListener('click', () => { if (!confirm(`Remover "${a.titulo}" sem finalizar?`)) return; remover(a.id); });
      ul.append(li);
    });
    const uf = $('#execFeitas'); uf.innerHTML = '';
    if (!feitas.length) uf.innerHTML = '<li class="vazio">As atividades finalizadas aparecem aqui.</li>';
    for (const a of feitas.slice(0, 30)) {
      const li = document.createElement('li');
      li.innerHTML = '<span class="ex-n ok">✓</span><div class="ex-info"><b></b><small></small></div>';
      li.querySelector('b').textContent = a.titulo;
      li.querySelector('small').textContent = `${a.cliente ? a.cliente + ' · ' : ''}finalizada ${quando(a.fim)} · levou ${duracao(a.inicio, a.fim)}`;
      uf.append(li);
    }
  }
  function mudouQuantidade() { A().aplicarLayout(); registrarDesenho(); }
  function adicionar(e) {
    e.preventDefault();
    const a = { id: 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), titulo: $('#eTitulo').value.trim(), cliente: $('#eCliente').value.trim(),
      responsavel: $('#eResp').value, obs: $('#eObs').value.trim(), inicio: new Date().toISOString() };
    if (!a.titulo) return;
    const antes = KM.tamanhoExecucao(ativas().length);
    lista().push(a);
    const depois = KM.tamanhoExecucao(ativas().length);
    A().salvar(true);
    if (antes.span !== depois.span || antes.fileiras !== depois.fileiras) { mudouQuantidade(); A().toast('📐 A Sala de Execução cresceu para caber todo mundo!'); }
    sincronizar(a.id);
    $('#formExec').reset(); render(); KM.tocar('sucesso');
    A().toast(`⚙️ Em execução: ${a.titulo}`);
  }
  function finalizar(id) {
    const a = lista().find(x => x.id === id); if (!a) return;
    a.fim = new Date().toISOString();
    A().salvar(true);
    const n = npcs.get(id);
    if (n && n.estado === 'sentado') sair(n); else npcs.delete(id);
    render();
    A().toast(`✅ Finalizada: ${a.titulo} (levou ${duracao(a.inicio, a.fim)})`);
    setTimeout(() => { mudouQuantidade(); sincronizar(); }, 3500); // espera ele sair para a sala diminuir
    // limpa o histórico muito antigo
    const c = A().cfg(), lim = Date.now() - 120 * 86400000;
    c.execucao = lista().filter(x => !x.fim || new Date(x.fim).getTime() > lim);
  }
  function remover(id) {
    const c = A().cfg(); c.execucao = lista().filter(x => x.id !== id);
    npcs.delete(id); A().salvar(true); mudouQuantidade(); sincronizar(); render();
  }

  function iniciar() { registrarDesenho(); sincronizar(); }
  KM.execucao = { iniciar, abrir, layoutMudou, sincronizar, ativas };
})();
