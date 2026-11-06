/* KWIK Mini Escritório · Respostas da pesquisa de satisfação.
   O formulário (pesquisa.html) envia a resposta para uma "caixa de entrada" no ntfy.sh (serviço gratuito de
   notificações, sem conta). O tópico é um código aleatório guardado em cfg.relacionamento.topico — só quem tem o
   link da pesquisa sabe qual é. O app busca as respostas novas a cada minuto, guarda em
   cfg.relacionamento.respostas (vai para o GitHub junto com a configuração), avisa na tela e calcula as médias.
   Com o app fechado, a Action "Lembretes" (lembretes.py) também busca e manda notificação push para o celular. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  const NTFY = 'https://ntfy.sh';
  const ITENS = ['Atendimento', 'Prazos e entregas', 'Clareza das explicações', 'Custo-benefício'];

  const rel = () => { const c = A().cfg(); c.relacionamento = c.relacionamento || { enviados: {} }; c.relacionamento.respostas = c.relacionamento.respostas || []; return c.relacionamento; };
  function topico() {
    const r = rel();
    if (!r.topico) {
      const b = new Uint8Array(12); crypto.getRandomValues(b);
      r.topico = 'kwik-pesq-' + [...b].map(x => x.toString(16).padStart(2, '0')).join('');
      A().salvar(true);
    }
    return r.topico;
  }
  const nomeRel = () => { const f = A().cfg().funcionarios.find(x => x.funcao === 'relacionamento'); return f ? f.nome.split(' ')[0] : 'Relacionamento'; };

  // ------------------------------------------------------------------ buscar respostas novas
  let buscando = false;
  async function sincronizar(silencioso) {
    if (buscando || !A() || !A().cfg) return [];
    const r = rel(); if (!r.topico) return [];
    buscando = true;
    try {
      const resp = await fetch(`${NTFY}/${encodeURIComponent(r.topico)}/json?poll=1&since=all`, { cache: 'no-store' });
      if (!resp.ok) return [];
      const linhas = (await resp.text()).split('\n').filter(Boolean);
      const ids = new Set(r.respostas.map(x => x.id)), apagadas = new Set(r.apagadas || []), novas = [];
      for (const l of linhas) {
        let ev; try { ev = JSON.parse(l); } catch (e) { continue; }
        if (ev.event !== 'message' || !ev.message) continue;
        let d; try { d = JSON.parse(ev.message); } catch (e) { continue; }
        if (!d || d.v !== 1 || typeof d.nps !== 'number') continue;
        const id = String(d.id || ev.id).slice(0, 40);
        if (ids.has(id) || apagadas.has(id)) continue;
        const resp1 = {
          id, cliente: String(d.cliente || '').slice(0, 80), nps: Math.max(0, Math.min(10, Math.round(d.nps))),
          notas: Object.fromEntries(ITENS.map(it => [it, Math.max(0, Math.min(5, Number((d.notas || {})[it]) || 0))]).filter(([, v]) => v)),
          gosta: String(d.gosta || '').slice(0, 1000), melhorar: String(d.melhorar || '').slice(0, 1000), conversa: String(d.conversa || '').slice(0, 10),
          quando: d.quando || new Date((ev.time || Date.now() / 1000) * 1000).toISOString(),
        };
        ids.add(id); novas.push(resp1);
      }
      if (novas.length) {
        r.respostas = r.respostas.concat(novas).sort((a, b) => String(b.quando).localeCompare(String(a.quando))).slice(0, 500);
        A().salvar(true);
        if (!silencioso) avisarNovas(novas);
        if ($('#dlgRespostas') && $('#dlgRespostas').open) render();
      }
      return novas;
    } catch (e) { return []; } finally { buscando = false; }
  }
  function avisarNovas(novas) {
    const n = novas[0], quem = n.cliente || 'Um cliente';
    const titulo = novas.length > 1 ? `💚 ${novas.length} novas respostas da pesquisa` : `💚 ${quem} respondeu a pesquisa`;
    const corpo = novas.length > 1 ? `Notas: ${novas.map(x => x.nps).join(', ')} · média geral ${medias().media.toFixed(1)}` : `Nota ${n.nps}/10${n.melhorar ? ' · Melhorar: ' + n.melhorar.slice(0, 80) : ''}`;
    KM.tocar('notif'); setTimeout(() => KM.tocar('sucesso'), 300);
    A().toast(`${titulo} · ${corpo}`, { botao: ['Ver respostas', abrir], ms: 12000 });
    if (KM.clara) KM.clara.notificarSistema(titulo, corpo);
    const p = Object.values(A().estado.pessoas).find(q => q.funcao === 'relacionamento');
    if (p) A().falar(p.id, n.nps >= 9 ? `${quem} deu ${n.nps}! 💚🎉` : n.nps >= 7 ? `Chegou resposta: nota ${n.nps} 🙂` : `Nota ${n.nps}… vou ver o que melhorar 💪`, 4500);
  }

  // ------------------------------------------------------------------ médias
  function medias(lista) {
    lista = lista || rel().respostas;
    const n = lista.length;
    if (!n) return { n: 0, media: 0, nps: 0, prom: 0, neut: 0, det: 0, itens: {} };
    const media = lista.reduce((s, x) => s + x.nps, 0) / n;
    const prom = lista.filter(x => x.nps >= 9).length, det = lista.filter(x => x.nps <= 6).length;
    const itens = {};
    for (const it of ITENS) { const v = lista.map(x => (x.notas || {})[it]).filter(Boolean); itens[it] = v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0; }
    return { n, media, nps: Math.round(100 * (prom - det) / n), prom, neut: n - prom - det, det, itens };
  }

  // ------------------------------------------------------------------ tela de respostas
  let filtro = '';
  function montar() {
    if ($('#dlgRespostas')) return;
    const d = document.createElement('dialog');
    d.id = 'dlgRespostas'; d.className = 'respostas-dlg';
    d.innerHTML = `
      <div class="dlg-topo"><h2>📊 Respostas da pesquisa</h2><button data-fechar aria-label="Fechar">×</button></div>
      <div class="dlg-corpo">
        <div class="resp-resumo" id="respResumo"></div>
        <div class="resp-filtro"><select id="respFiltro"></select><button class="bt peq" id="respAtualizar">🔄 Buscar novas</button></div>
        <div id="respLista"></div>
      </div>`;
    document.body.append(d);
    d.querySelector('[data-fechar]').addEventListener('click', () => d.close());
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    $('#respFiltro').addEventListener('change', e => { filtro = e.target.value; render(); });
    $('#respAtualizar').addEventListener('click', async e => {
      e.currentTarget.disabled = true;
      const novas = await sincronizar(true);
      e.currentTarget.disabled = false;
      A().toast(novas.length ? `💚 ${novas.length} resposta(s) nova(s)!` : 'Nenhuma resposta nova por enquanto.');
      render();
    });
  }
  function abrir() {
    montar(); topico(); render();
    $('#dlgRespostas').showModal();
    sincronizar(true).then(n => { if (n.length) render(); });
  }
  const corNota = v => v >= 9 ? 'prom' : v >= 7 ? 'neut' : 'det';
  const estrelas = v => '★'.repeat(Math.round(v)) + '☆'.repeat(5 - Math.round(v));
  function render() {
    const todas = rel().respostas;
    const clientes = [...new Set(todas.map(x => x.cliente).filter(Boolean))].sort();
    const sel = $('#respFiltro');
    sel.innerHTML = '';
    sel.append(new Option(`Todos os clientes (${todas.length})`, ''));
    for (const c of clientes) sel.append(new Option(`${c} (${todas.filter(x => x.cliente === c).length})`, c));
    sel.value = clientes.includes(filtro) ? filtro : '';
    const lista = sel.value ? todas.filter(x => x.cliente === sel.value) : todas;
    const m = medias(lista);
    const res = $('#respResumo'); res.innerHTML = '';
    if (!m.n) {
      res.innerHTML = `<div class="resp-vazio"><div class="grande">📭</div><b>Nenhuma resposta ainda</b><p>Mande a pesquisa pelo ${nomeRel()} (botão Trabalhar → Pesquisa de satisfação). Quando o cliente responder, chega um aviso aqui e no celular.</p></div>`;
    } else {
      res.innerHTML = `
        <div class="resp-media ${corNota(m.media)}"><small>Média das notas</small><b>${m.media.toFixed(1).replace('.', ',')}</b><small>de 0 a 10 · ${m.n} resposta${m.n > 1 ? 's' : ''}</small></div>
        <div class="resp-nps"><small>NPS</small><b>${m.nps > 0 ? '+' : ''}${m.nps}</b><div class="nps-barra"><i class="prom" style="width:${100 * m.prom / m.n}%"></i><i class="neut" style="width:${100 * m.neut / m.n}%"></i><i class="det" style="width:${100 * m.det / m.n}%"></i></div><small>😍 ${m.prom} · 🙂 ${m.neut} · 😕 ${m.det}</small></div>
        <div class="resp-itens">${ITENS.map(it => `<div><span>${it}</span><b>${m.itens[it] ? m.itens[it].toFixed(1).replace('.', ',') : '—'}</b><i class="estr">${m.itens[it] ? estrelas(m.itens[it]) : ''}</i></div>`).join('')}</div>`;
    }
    const box = $('#respLista'); box.innerHTML = '';
    for (const x of lista) {
      const card = document.createElement('div');
      card.className = 'resp-card';
      card.innerHTML = `<div class="rc-topo"><span class="rc-nota ${corNota(x.nps)}">${x.nps}</span><div><b></b><small></small></div><button class="bt peq perigo" title="Apagar resposta">🗑️</button></div><div class="rc-notas"></div><p class="rc-gosta"></p><p class="rc-melhorar"></p><p class="rc-conversa"></p>`;
      card.querySelector('b').textContent = x.cliente || 'Cliente sem nome';
      card.querySelector('small').textContent = new Date(x.quando).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      card.querySelector('.rc-notas').textContent = Object.entries(x.notas || {}).map(([k, v]) => `${k}: ${'★'.repeat(v)}`).join(' · ');
      card.querySelector('.rc-gosta').textContent = x.gosta ? '💚 Mais gosta: ' + x.gosta : '';
      card.querySelector('.rc-melhorar').textContent = x.melhorar ? '🛠️ Melhorar: ' + x.melhorar : '';
      card.querySelector('.rc-conversa').textContent = x.conversa === 'Sim' ? '🗓️ Quer marcar uma conversa!' : '';
      if (x.conversa === 'Sim') {
        const b = document.createElement('button'); b.className = 'bt peq'; b.textContent = '🗓️ Marcar reunião';
        b.addEventListener('click', () => { $('#dlgRespostas').close(); KM.reuniao && KM.reuniao.abrir(); setTimeout(() => { const i = $('#rCom'); if (i) i.value = x.cliente || ''; const t = $('#rTitulo'); if (t) t.value = 'Conversa sobre a pesquisa de satisfação'; }, 50); });
        card.querySelector('.rc-conversa').append(' ', b);
      }
      card.querySelector('.rc-topo button').addEventListener('click', () => {
        if (!confirm('Apagar esta resposta?')) return;
        const r = rel(); r.respostas = r.respostas.filter(y => y.id !== x.id); r.apagadas = (r.apagadas || []).concat(x.id).slice(-300);
        A().salvar(true); render();
      });
      box.append(card);
    }
  }

  // Respostas que a Action guardou no GitHub (chegaram com o app fechado e já saíram do ntfy).
  async function puxarDoGitHub() {
    const BK = A().BK();
    if (!BK || BK.nome !== 'github' || !A().online()) return;
    try {
      const lista = await BK.lerJson('nuvem/pesquisas.json');
      if (!Array.isArray(lista) || !lista.length) return;
      const r = rel(), ids = new Set(r.respostas.map(x => x.id)), apagadas = new Set(r.apagadas || []);
      const novas = lista.filter(x => x && x.id && !ids.has(x.id) && !apagadas.has(x.id));
      if (!novas.length) return;
      r.respostas = r.respostas.concat(novas).sort((a, b) => String(b.quando).localeCompare(String(a.quando))).slice(0, 500);
      A().salvar(true);
      avisarNovas(novas);
    } catch (e) { /* sem arquivo ainda */ }
  }

  function iniciar() {
    setTimeout(() => { topico(); puxarDoGitHub().then(() => sincronizar(false)); }, 5000);
    setInterval(() => { if (!document.hidden) sincronizar(false); }, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(() => sincronizar(false), 2000); });
  }

  KM.pesquisa = { iniciar, abrir, sincronizar, medias, topico, ITENS };
})();
