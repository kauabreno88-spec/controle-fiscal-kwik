/* KWIK Mini Escritório · Sala de Reunião com agenda.
   Toque na sala de reunião para abrir o calendário: escolha o dia, o horário e marque a reunião.
   Avisos: com o app aberto, notificação + aviso na tela X minutos antes (e na hora, quando a equipe vai para a sala).
   Com o app fechado, a Action "Lembretes" (lembretes.py) manda notificação push para o celular inscrito.
   As reuniões ficam em cfg.reunioes (sincronizado com o GitHub). */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  const dd = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const CHAVE_AVISOS = 'kwik-mini-reunioes-avisos';

  const lista = () => { const c = A().cfg(); c.reunioes = c.reunioes || []; return c.reunioes; };
  const inicio = r => new Date(`${r.data}T${r.hora || '09:00'}:00`);
  const fmtDia = s => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
  const diaSemana = s => SEM[new Date(s + 'T12:00:00').getDay()];

  // Usado pelo calendário na parede da sala (cena.js).
  KM.reuniaoProxima = cfg => {
    const agora = Date.now(), hoje = iso(new Date());
    const fut = (cfg.reunioes || []).filter(r => inicio(r).getTime() + (r.duracao || 60) * 60000 > agora).sort((a, b) => inicio(a) - inicio(b));
    if (!fut.length) return null;
    return { ...fut[0], ehHoje: fut[0].data === hoje };
  };

  // ------------------------------------------------------------------ diálogo
  let mesVisto = null, diaSel = null, editando = null;
  function montarDialogo() {
    if ($('#dlgReuniao')) return;
    const d = document.createElement('dialog');
    d.id = 'dlgReuniao'; d.className = 'agenda';
    d.innerHTML = `
      <div class="dlg-topo"><h2>🗓️ Agenda da sala de reunião</h2><button data-fechar aria-label="Fechar">×</button></div>
      <div class="dlg-corpo agenda-corpo">
        <div class="agenda-cal">
          <div class="cal-cab"><button class="bt peq" data-mes="-1">◀</button><b id="calTitulo"></b><button class="bt peq" data-mes="1">▶</button></div>
          <div class="cal-sem">${SEM.map(s => `<span>${s}</span>`).join('')}</div>
          <div class="cal-grade" id="calGrade"></div>
          <button class="bt peq" id="calHoje" style="margin-top:8px">Hoje</button>
          <div class="agenda-prox"><h4>⏭️ Próximas reuniões</h4><ul id="calProximas"></ul></div>
        </div>
        <div class="agenda-dia">
          <h3 id="diaTitulo"></h3>
          <ul class="lista-reunioes" id="diaLista"></ul>
          <form id="formReuniao" class="form-reuniao" autocomplete="off">
            <h4 id="formTitulo">＋ Marcar reunião</h4>
            <label>Assunto<input id="rTitulo" type="text" maxlength="80" placeholder="Ex.: Planejamento tributário da Clínica X" required></label>
            <div class="linha2">
              <label>Dia<input id="rData" type="date" required></label>
              <label>Horário<input id="rHora" type="time" required></label>
            </div>
            <div class="linha2">
              <label>Duração<select id="rDuracao"><option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60" selected>1 hora</option><option value="90">1h30</option><option value="120">2 horas</option></select></label>
              <label>Avisar antes<select id="rAviso"><option value="5">5 min</option><option value="10">10 min</option><option value="15" selected>15 min</option><option value="30">30 min</option><option value="60">1 hora</option><option value="1440">1 dia</option></select></label>
            </div>
            <label>Com quem<input id="rCom" type="text" list="rClientes" maxlength="80" placeholder="Cliente, equipe…"><datalist id="rClientes"></datalist></label>
            <label>Onde<input id="rLocal" type="text" maxlength="120" placeholder="Sala de reunião KWIK · ou link do Meet/Zoom"></label>
            <label>Anotações<textarea id="rObs" rows="2" maxlength="400" placeholder="Pauta, documentos para levar…"></textarea></label>
            <div class="form-bts"><button class="bt prim" type="submit" id="rSalvar">✅ Marcar reunião</button><button class="bt peq" type="button" id="rCancelar" hidden>Cancelar edição</button></div>
          </form>
          <div class="agenda-rodape"><button class="bt peq" id="rNotif">🔔 Ativar avisos no celular</button><small>Com o app aberto o aviso aparece na tela; com o celular conectado ao GitHub chega notificação mesmo com o app fechado.</small></div>
        </div>
      </div>`;
    document.body.append(d);
    d.querySelector('[data-fechar]').addEventListener('click', () => d.close());
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    d.querySelectorAll('[data-mes]').forEach(b => b.addEventListener('click', () => { mesVisto = new Date(mesVisto.getFullYear(), mesVisto.getMonth() + Number(b.dataset.mes), 1); render(); }));
    $('#calHoje').addEventListener('click', () => { const h = new Date(); mesVisto = new Date(h.getFullYear(), h.getMonth(), 1); escolherDia(iso(h)); });
    $('#formReuniao').addEventListener('submit', salvar);
    $('#rCancelar').addEventListener('click', () => { editando = null; limparForm(); });
    $('#rNotif').addEventListener('click', () => KM.clara && KM.clara.ativarNotificacoes());
  }

  function abrir(dia) {
    montarDialogo();
    const h = new Date();
    diaSel = dia || diaSel || iso(h);
    const [y, m] = diaSel.split('-').map(Number);
    mesVisto = new Date(y, m - 1, 1);
    editando = null; limparForm();
    render();
    $('#rClientes').innerHTML = (A().cfg().clientes || []).map(c => `<option value="${(c.nome || '').replace(/"/g, '&quot;')}">`).join('');
    $('#dlgReuniao').showModal();
    KM.tocar('clique');
  }
  function escolherDia(s) { diaSel = s; if (!editando) $('#rData').value = s; render(); }

  function render() {
    const grade = $('#calGrade'); grade.innerHTML = '';
    $('#calTitulo').textContent = `${MESES[mesVisto.getMonth()]} ${mesVisto.getFullYear()}`;
    const primeiro = new Date(mesVisto.getFullYear(), mesVisto.getMonth(), 1), ini = primeiro.getDay();
    const diasMes = new Date(mesVisto.getFullYear(), mesVisto.getMonth() + 1, 0).getDate();
    const hoje = iso(new Date());
    const porDia = {};
    for (const r of lista()) (porDia[r.data] = porDia[r.data] || []).push(r);
    for (let i = 0; i < ini; i++) grade.append(Object.assign(document.createElement('span'), { className: 'vazio-dia' }));
    for (let d = 1; d <= diasMes; d++) {
      const s = `${mesVisto.getFullYear()}-${dd(mesVisto.getMonth() + 1)}-${dd(d)}`;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dia' + (s === hoje ? ' hoje' : '') + (s === diaSel ? ' sel' : '') + (s < hoje ? ' passado' : '');
      b.innerHTML = `<b>${d}</b>` + (porDia[s] ? `<i>${porDia[s].length > 1 ? porDia[s].length : ''}</i>` : '');
      if (porDia[s]) b.title = porDia[s].map(r => `${r.hora} ${r.titulo}`).join('\n');
      b.addEventListener('click', () => escolherDia(s));
      grade.append(b);
    }
    // dia escolhido
    $('#diaTitulo').textContent = `${diaSemana(diaSel)}, ${fmtDia(diaSel)}` + (diaSel === hoje ? ' · hoje' : '');
    const ul = $('#diaLista'); ul.innerHTML = '';
    const doDia = lista().filter(r => r.data === diaSel).sort((a, b) => a.hora.localeCompare(b.hora));
    if (!doDia.length) ul.append(Object.assign(document.createElement('li'), { className: 'vazio', textContent: 'Nenhuma reunião neste dia. Marque uma abaixo 👇' }));
    for (const r of doDia) ul.append(itemReuniao(r));
    if (!editando) $('#rData').value = diaSel;
    // próximas
    const prox = $('#calProximas'); prox.innerHTML = '';
    const agora = Date.now();
    const fut = lista().filter(r => inicio(r).getTime() + (r.duracao || 60) * 60000 > agora).sort((a, b) => inicio(a) - inicio(b)).slice(0, 5);
    if (!fut.length) prox.append(Object.assign(document.createElement('li'), { className: 'vazio', textContent: 'Nada marcado ainda.' }));
    for (const r of fut) {
      const li = document.createElement('li');
      li.innerHTML = `<b>${fmtDia(r.data).slice(0, 5)} ${r.hora}</b> <span></span>`;
      li.querySelector('span').textContent = r.titulo;
      li.addEventListener('click', () => { const [y, m] = r.data.split('-').map(Number); mesVisto = new Date(y, m - 1, 1); escolherDia(r.data); });
      prox.append(li);
    }
  }
  function itemReuniao(r) {
    const li = document.createElement('li');
    const fimH = new Date(inicio(r).getTime() + (r.duracao || 60) * 60000);
    const ehLink = /^https?:\/\//i.test(r.local || '');
    li.className = 'reuniao' + (fimH.getTime() < Date.now() ? ' passada' : '');
    li.innerHTML = `<div class="r-hora">${r.hora}<small>até ${dd(fimH.getHours())}:${dd(fimH.getMinutes())}</small></div><div class="r-info"><b></b><span class="r-com"></span><span class="r-local"></span><p class="r-obs"></p></div><div class="r-bts"><button class="bt peq" data-a="editar" title="Editar">✏️</button><button class="bt peq perigo" data-a="apagar" title="Apagar">🗑️</button></div>`;
    li.querySelector('b').textContent = r.titulo;
    li.querySelector('.r-com').textContent = r.com ? '👥 ' + r.com : '';
    const loc = li.querySelector('.r-local');
    if (ehLink) { const a = document.createElement('a'); a.href = r.local; a.target = '_blank'; a.rel = 'noopener'; a.textContent = '🔗 Entrar na chamada'; loc.append(a); }
    else loc.textContent = '📍 ' + (r.local || 'Sala de reunião KWIK');
    li.querySelector('.r-obs').textContent = r.obs || '';
    li.querySelector('[data-a=editar]').addEventListener('click', () => editar(r));
    li.querySelector('[data-a=apagar]').addEventListener('click', () => {
      if (!confirm(`Apagar a reunião "${r.titulo}"?`)) return;
      const c = A().cfg(); c.reunioes = lista().filter(x => x.id !== r.id); A().salvar(); render(); KM.tocar('clique');
    });
    return li;
  }
  function editar(r) {
    editando = r.id;
    $('#formTitulo').textContent = '✏️ Editar reunião';
    $('#rSalvar').textContent = '💾 Salvar alterações';
    $('#rCancelar').hidden = false;
    $('#rTitulo').value = r.titulo; $('#rData').value = r.data; $('#rHora').value = r.hora;
    $('#rDuracao').value = String(r.duracao || 60); $('#rAviso').value = String(r.aviso || 15);
    $('#rCom').value = r.com || ''; $('#rLocal').value = r.local || ''; $('#rObs').value = r.obs || '';
    $('#rTitulo').focus();
  }
  function limparForm() {
    if (!$('#formReuniao')) return;
    $('#formReuniao').reset();
    $('#formTitulo').textContent = '＋ Marcar reunião';
    $('#rSalvar').textContent = '✅ Marcar reunião';
    $('#rCancelar').hidden = true;
    $('#rData').value = diaSel || iso(new Date());
    const h = new Date(); h.setMinutes(h.getMinutes() + 60 - (h.getMinutes() % 30)); // próximo horário "redondo"
    $('#rHora').value = `${dd(h.getHours())}:${dd(h.getMinutes())}`;
  }
  function salvar(e) {
    e.preventDefault();
    const r = {
      id: editando || 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      titulo: $('#rTitulo').value.trim(), data: $('#rData').value, hora: $('#rHora').value,
      duracao: Number($('#rDuracao').value) || 60, aviso: Number($('#rAviso').value) || 15,
      com: $('#rCom').value.trim(), local: $('#rLocal').value.trim(), obs: $('#rObs').value.trim(), criadaEm: new Date().toISOString(),
    };
    if (!r.titulo || !r.data || !r.hora) return;
    const c = A().cfg();
    c.reunioes = lista().filter(x => x.id !== r.id).concat(r).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
    // limpa reuniões com mais de 90 dias
    const limite = iso(new Date(Date.now() - 90 * 86400000));
    c.reunioes = c.reunioes.filter(x => x.data >= limite);
    esquecerAviso(r.id);
    A().salvar(true);
    diaSel = r.data; const [y, m] = r.data.split('-').map(Number); mesVisto = new Date(y, m - 1, 1);
    editando = null; limparForm(); render();
    KM.tocar('sucesso');
    const quando = inicio(r), min = Math.round((quando - Date.now()) / 60000);
    A().toast(`🗓️ Reunião marcada: ${r.titulo} · ${diaSemana(r.data)} ${fmtDia(r.data).slice(0, 5)} às ${r.hora}. Aviso ${r.aviso >= 1440 ? '1 dia' : r.aviso + ' min'} antes.`, { ms: 7000 });
    if (min > 0 && 'Notification' in window && Notification.permission !== 'granted') setTimeout(() => A().toast('🔔 Quer receber o aviso no celular? Toque em "Ativar avisos" na agenda.', { botao: ['Ativar', () => KM.clara.ativarNotificacoes()], ms: 8000 }), 1200);
    const p = Object.values(A().estado.pessoas).find(q => q.funcao === 'checklist');
    if (p) A().falar(p.id, `Anotado! Reunião ${r.data === iso(new Date()) ? 'hoje' : 'dia ' + fmtDia(r.data).slice(0, 5)} às ${r.hora} 🗓️`, 3200);
  }

  // ------------------------------------------------------------------ avisos (app aberto)
  const avisos = () => { try { return JSON.parse(localStorage.getItem(CHAVE_AVISOS) || '{}'); } catch (e) { return {}; } };
  const marcar = k => { const m = avisos(); m[k] = Date.now(); for (const [kk, v] of Object.entries(m)) if (Date.now() - v > 30 * 86400000) delete m[kk]; try { localStorage.setItem(CHAVE_AVISOS, JSON.stringify(m)); } catch (e) { /* sem espaço */ } };
  const esquecerAviso = id => { const m = avisos(); for (const k of Object.keys(m)) if (k.startsWith(id + '|')) delete m[k]; try { localStorage.setItem(CHAVE_AVISOS, JSON.stringify(m)); } catch (e) { /* nada */ } };
  const textoFalta = min => min >= 1440 ? 'amanhã' : min >= 60 ? `em ${Math.floor(min / 60)}h${min % 60 ? dd(min % 60) : ''}` : `em ${Math.max(1, min)} min`;

  function verificar() {
    if (!A() || !A().cfg) return;
    const agora = Date.now(), ja = avisos();
    for (const r of lista()) {
      const t0 = inicio(r).getTime(), falta = Math.round((t0 - agora) / 60000);
      if (falta <= (r.aviso || 15) && falta > 0 && !ja[r.id + '|aviso']) {
        marcar(r.id + '|aviso');
        avisar(`⏰ Reunião ${textoFalta(falta)}`, `${r.titulo} · ${r.hora}${r.com ? ' com ' + r.com : ''}`, r);
      }
      if (falta <= 0 && falta > -10 && !ja[r.id + '|inicio']) {
        marcar(r.id + '|inicio');
        avisar('🗓️ Reunião começando agora!', `${r.titulo}${r.com ? ' com ' + r.com : ''} · ${r.local || 'Sala de reunião'}`, r);
        irParaReuniao(r);
      }
    }
  }
  function avisar(titulo, corpo, r) {
    KM.tocar('notif'); setTimeout(() => KM.tocar('notif'), 400);
    A().toast(`${titulo}: ${corpo}`, { botao: ['Ver agenda', () => abrir(r.data)], ms: 15000 });
    if (KM.clara) KM.clara.notificarSistema(titulo, corpo);
    const clara = Object.values(A().estado.pessoas).find(q => q.funcao === 'checklist');
    if (clara) A().falar(clara.id, `${titulo.replace(/^\S+\s/, '')} 🗓️`, 5000);
  }
  // Na hora da reunião, quem está livre vai para a sala e senta em volta da mesa.
  async function irParaReuniao(r) {
    const L = KM.LAYOUT, s = L && L.salas.reuniao; if (!s) return;
    const mesa = L.moveis.find(m => m.tipo === 'mesaReuniao'); if (!mesa) return;
    const livres = Object.values(A().estado.pessoas).filter(p => !p.trabalhando && p.visivel !== false && p.funcao !== 'limpeza').slice(0, 6);
    await Promise.all(livres.map(p => KM.pararRotina(p)));
    const grupo = livres.filter(p => !p.acao);
    const lugares = [[0, -1], [1, -1], [2, -1], [0, 1], [1, 1], [2, 1]].map(([i, lado]) => ({ X: mesa.X + 10 + i * 18, Y: lado < 0 ? mesa.Y - 12 : mesa.Y + mesa.d + 8, dir: lado < 0 ? 'fe' : 'ce' }));
    await Promise.all(grupo.map(async (p, i) => {
      p.acao = 'rotina';
      try {
        await KM.esperar(i * 350);
        await KM.mov.irAte(p, lugares[i].X, lugares[i].Y, 46);
        if (p.pararRotina) return;
        p.dir = lugares[i].dir;
        if (i === 0) KM.mov.fala(p, `Reunião: ${r.titulo.slice(0, 40)} 🗓️`, 3200);
        const fim = performance.now() + 22000;
        let n = 0;
        while (performance.now() < fim && !p.pararRotina) {
          n++;
          p.est = n % 5 === i % 5 ? { bracos: 'aceno', aceno: n % 2, boca: 'sorriso' } : { boca: n % 3 ? 'normal' : 'sorriso' };
          if (Math.random() < 0.05) KM.mov.fala(p, ['Concordo! 👍', 'Anota aí 📝', 'Boa ideia 💡', 'Fechado ✅', 'E o prazo? 📅'][Math.floor(Math.random() * 5)], 2000);
          await KM.esperar(600);
        }
      } finally {
        p.est = {};
        if (p.modo !== 'sentado') await KM.voltarSentar(p);
        p.acao = null;
      }
    }));
  }

  function iniciar() {
    setTimeout(verificar, 4000);
    setInterval(verificar, 20000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(verificar, 1200); });
  }

  KM.reuniao = { abrir, iniciar, verificar, irParaReuniao };
})();
