/* KWIK Mini Escritório · app "Reunião" da tela inicial: calendário para marcar reuniões, com avisos personalizados
   conforme o tipo (cliente, proposta, equipe, prazo fiscal, folha, consultoria, online, estudo, pessoal).
   Usa a mesma agenda da sala de Reunião do escritório (cfg.reunioes), então os avisos com o app aberto (reuniao.js) e
   o push no celular com o app fechado (lembretes.py) continuam funcionando. Campos novos: tipo, cor, aviso2 (véspera). */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const el = (...a) => A().el(...a);
  const dd = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
  const hoje = () => iso(new Date());
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const SEM = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  // tipos: ícone, cor e a mensagem do aviso ({t} título, {com}, {quando}, {local}, {obs})
  const TIPOS = {
    cliente: { ic: '🤝', nome: 'Cliente', cor: '#28BE52', msg: '{com} {quando}. Dá uma olhada no resumo fiscal e na folha do cliente antes 📋', dica: 'Abrir Fiscal', app: 'fiscal' },
    proposta: { ic: '💼', nome: 'Proposta / venda', cor: '#7950f2', msg: 'Proposta com {com} {quando}. Os slides estão prontos? 📊 Leve o preço da Dona Iva 💜', dica: 'Sala de Apresentação', acao: 'apres' },
    equipe: { ic: '👥', nome: 'Equipe KWIK', cor: '#4dabf7', msg: 'Reunião da equipe {quando}. Pauta: {obs}', dica: 'Ver tarefas da equipe', aba: 'tarefas' },
    fiscal: { ic: '🧾', nome: 'Prazo fiscal', cor: '#e03131', msg: '{t} {quando}. Confira o checklist do mês no Fiscal ✅', dica: 'Abrir Fiscal', app: 'fiscal' },
    folha: { ic: '🧑‍💼', nome: 'Folha / DP', cor: '#fd7e14', msg: '{t} {quando}. Confira o fechamento no app da Folha 👥', dica: 'Abrir Folha', app: 'folha' },
    consultoria: { ic: '💡', nome: 'Consultoria', cor: '#fab005', msg: 'Consultoria com {com} {quando}. Separe os números e as dúvidas do cliente 💡' },
    online: { ic: '💻', nome: 'Chamada online', cor: '#15aabf', msg: '{t} {quando}. Link: {local} 💻' },
    estudo: { ic: '🎓', nome: 'Estudo / IPOG', cor: '#1b3a6b', msg: '{t} {quando}. Bons estudos! 🎓' },
    pessoal: { ic: '🏠', nome: 'Pessoal', cor: '#e64980', msg: '{t} {quando} 💚' },
  };
  const tipoDe = r => TIPOS[r.tipo] || TIPOS.cliente;
  const quandoTxt = min => min <= 0 ? 'agora' : min >= 1440 ? 'amanhã' : min >= 60 ? `em ${Math.floor(min / 60)}h${min % 60 ? dd(min % 60) : ''}` : `em ${min} min`;
  function mensagem(r, min) {
    const T = tipoDe(r);
    const corpo = T.msg.replace('{t}', r.titulo).replace('{com}', r.com || r.titulo).replace('{quando}', quandoTxt(min)).replace('{local}', r.local || '—').replace('{obs}', r.obs || r.titulo);
    return { titulo: `${T.ic} ${T.nome} ${min > 0 ? quandoTxt(min) : 'começando'} (${r.hora})`, corpo, T };
  }
  const lista = () => { const c = A().cfg(); c.reunioes = c.reunioes || []; return c.reunioes; };
  const ini = r => new Date(`${r.data}T${r.hora || '09:00'}:00`);
  const st = { visao: 'mes', ref: null, dia: null, editando: null, tipoNovo: 'cliente' };
  let corpo = null;

  function abrir(c, acoes) {
    corpo = c; st.dia = st.dia || hoje();
    const perm = 'Notification' in window ? Notification.permission : '';
    acoes.append(el('button', { class: 'appv-bt', onclick: () => KM.clara && KM.clara.ativarNotificacoes() }, perm === 'granted' ? '🔔 Avisos ligados' : '🔔 Ativar avisos'),
      el('button', { class: 'appv-bt prim', onclick: () => { st.editando = null; formulario(st.dia); } }, '＋ Marcar'));
    render();
  }
  function sair() { corpo = null; }
  function render() {
    if (!corpo || !corpo.isConnected) return;
    corpo.innerHTML = '';
    const ref = st.ref || hoje().slice(0, 7), [a, m] = ref.split('-').map(Number);
    const prox = lista().filter(r => ini(r).getTime() + (r.duracao || 60) * 60000 > Date.now()).sort((x, y) => ini(x) - ini(y));
    const nav = n => () => { if (st.visao === 'semana') { const d = new Date(st.dia + 'T12:00:00'); d.setDate(d.getDate() + n * 7); st.dia = iso(d); st.ref = st.dia.slice(0, 7); } else { const d = new Date(a, m - 1 + n, 1); st.ref = iso(d).slice(0, 7); } render(); };
    corpo.append(el('div', { class: 'ag-topo' },
      el('div', { class: 'ag-nav' }, el('button', { class: 'bt peq', onclick: nav(-1) }, '◀'), el('h2', {}, st.visao === 'semana' ? tituloSemana() : `${MESES[m - 1]} ${a}`), el('button', { class: 'bt peq', onclick: nav(1) }, '▶'),
        el('button', { class: 'bt peq', onclick: () => { st.ref = null; st.dia = hoje(); render(); } }, 'Hoje')),
      el('div', { class: 'ag-visoes' }, [['mes', 'Mês'], ['semana', 'Semana'], ['lista', 'Próximas']].map(([v, n]) => el('button', { class: st.visao === v ? 'on' : '', onclick: () => { st.visao = v; render(); } }, n)))));
    corpo.append(el('div', { class: 'ag-legenda' }, Object.values(TIPOS).map(T => el('span', {}, el('i', { style: `background:${T.cor}` }), T.ic + ' ' + T.nome))));
    const grade = el('div', { class: 'ag-grade' });
    const princ = el('div', { class: 'ag-princ' }), lado = el('aside', { class: 'ag-lado' });
    if (st.visao === 'mes') mes(princ, a, m); else if (st.visao === 'semana') semana(princ); else proximas(princ, prox);
    diaPainel(lado);
    grade.append(princ, lado); corpo.append(grade);
  }
  function chipEv(r, curto) {
    const T = tipoDe(r);
    return el('div', { class: 'ag-ev', style: `--c:${r.cor || T.cor}`, title: `${r.hora} ${r.titulo}`, onclick: e => { e.stopPropagation(); st.dia = r.data; st.editando = r.id; render(); formulario(r.data, r); } }, curto ? `${r.hora} ${T.ic} ${r.titulo}` : el('span', {}, `${T.ic} ${r.hora} · ${r.titulo}`));
  }
  function mes(box, a, m) {
    const p1 = new Date(a, m - 1, 1), ini0 = new Date(a, m - 1, 1 - p1.getDay()), g = el('div', { class: 'ag-mes' });
    SEM.forEach(d => g.append(el('div', { class: 'ag-sem' }, d)));
    for (let i = 0; i < 42; i++) {
      const d = new Date(ini0); d.setDate(ini0.getDate() + i); const s = iso(d), evs = lista().filter(r => r.data === s).sort((x, y) => (x.hora || '').localeCompare(y.hora || ''));
      const c = el('div', { class: 'ag-dia' + (d.getMonth() !== m - 1 ? ' fora' : '') + (s === hoje() ? ' hoje' : '') + (s === st.dia ? ' sel' : ''), onclick: () => { st.dia = s; render(); }, ondblclick: () => formulario(s) }, el('span', { class: 'ag-dn' }, String(d.getDate())));
      evs.slice(0, 3).forEach(r => c.append(chipEv(r, true)));
      if (evs.length > 3) c.append(el('small', { class: 'ag-mais' }, `+${evs.length - 3}`));
      g.append(c);
    }
    box.append(g, el('p', { class: 'ag-dica' }, 'Toque num dia para ver; toque duas vezes (ou em ＋ Marcar) para marcar uma reunião.'));
  }
  function inicioSemana() { const d = new Date((st.dia || hoje()) + 'T12:00:00'); d.setDate(d.getDate() - d.getDay()); return d; }
  function tituloSemana() { const d = inicioSemana(), f = new Date(d); f.setDate(d.getDate() + 6); return `${dd(d.getDate())}/${dd(d.getMonth() + 1)} – ${dd(f.getDate())}/${dd(f.getMonth() + 1)}`; }
  function semana(box) {
    const d0 = inicioSemana(), H0 = 7, H1 = 21, PX = 44;
    const g = el('div', { class: 'ag-semana' });
    g.append(el('div', { class: 'ag-horas' }, el('div', { class: 'ag-scab' }), Array.from({ length: H1 - H0 }, (_, i) => el('div', { class: 'ag-h', style: `height:${PX}px` }, `${dd(H0 + i)}h`))));
    for (let k = 0; k < 7; k++) {
      const d = new Date(d0); d.setDate(d0.getDate() + k); const s = iso(d);
      const col = el('div', { class: 'ag-col' + (s === hoje() ? ' hoje' : '') }, el('div', { class: 'ag-scab', onclick: () => { st.dia = s; render(); } }, `${SEM[k]} ${d.getDate()}`));
      const area = el('div', { class: 'ag-area', style: `height:${(H1 - H0) * PX}px`, onclick: e => { const h = H0 + Math.floor((e.offsetY) / PX); formulario(s, null, `${dd(Math.max(H0, Math.min(H1 - 1, h)))}:00`); } });
      for (const r of lista().filter(x => x.data === s)) {
        const [hh, mm] = (r.hora || '09:00').split(':').map(Number), top = ((hh + mm / 60) - H0) * PX, alt = Math.max(22, (r.duracao || 60) / 60 * PX - 2), T = tipoDe(r);
        area.append(el('div', { class: 'ag-bloco', style: `top:${Math.max(0, top)}px;height:${alt}px;--c:${r.cor || T.cor}`, onclick: e => { e.stopPropagation(); st.dia = s; formulario(s, r); } }, el('b', {}, `${T.ic} ${r.titulo}`), el('small', {}, `${r.hora}${r.com ? ' · ' + r.com : ''}`)));
      }
      if (s === hoje()) { const n = new Date(), y = ((n.getHours() + n.getMinutes() / 60) - H0) * PX; if (y > 0 && y < (H1 - H0) * PX) area.append(el('div', { class: 'ag-agora', style: `top:${y}px` })); }
      col.append(area); g.append(col);
    }
    box.append(el('div', { class: 'ag-semana-rol' }, g), el('p', { class: 'ag-dica' }, 'Toque num horário vazio para marcar ali.'));
  }
  function proximas(box, prox) {
    if (!prox.length) return box.append(el('div', { class: 'tt-vazio' }, el('span', {}, '🗓️'), el('p', {}, 'Nenhuma reunião marcada. Toque em ＋ Marcar.')));
    let dia = '';
    for (const r of prox.slice(0, 60)) {
      if (r.data !== dia) { dia = r.data; box.append(el('h6', { class: 'tt-grupo' }, new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))); }
      box.append(cartao(r));
    }
  }
  function cartao(r) {
    const T = tipoDe(r), min = Math.round((ini(r) - Date.now()) / 60000);
    return el('div', { class: 'ag-card', style: `--c:${r.cor || T.cor}` },
      el('div', { class: 'ag-card-h' }, el('b', {}, r.hora), el('small', {}, `${r.duracao || 60} min`)),
      el('div', { class: 'ag-card-c' }, el('b', {}, `${T.ic} ${r.titulo}`), el('small', {}, [T.nome, r.com, r.local].filter(Boolean).join(' · ')), r.obs ? el('p', {}, r.obs) : null,
        min > 0 && min < 7 * 1440 ? el('span', { class: 'ag-falta' }, `⏰ ${quandoTxt(min)} · aviso ${r.aviso >= 1440 ? '1 dia' : (r.aviso || 15) + ' min'} antes`) : null),
      el('div', { class: 'ag-card-b' }, el('button', { class: 'bt peq', onclick: () => formulario(r.data, r) }, '✏️'), el('button', { class: 'bt peq perigo', onclick: () => { if (!confirm(`Desmarcar "${r.titulo}"?`)) return; const c = A().cfg(); c.reunioes = lista().filter(x => x.id !== r.id); A().salvar(true); render(); } }, '🗑')));
  }
  function diaPainel(box) {
    const s = st.dia || hoje(), evs = lista().filter(r => r.data === s).sort((x, y) => (x.hora || '').localeCompare(y.hora || ''));
    box.append(el('div', { class: 'ag-lado-cab' }, el('div', {}, el('small', {}, new Date(s + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })), el('h3', {}, new Date(s + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }))),
      el('button', { class: 'bt peq prim', onclick: () => formulario(s) }, '＋ Marcar')));
    if (!evs.length) box.append(el('p', { class: 'vazio' }, 'Dia livre.'));
    evs.forEach(r => box.append(cartao(r)));
    const prox = lista().filter(r => ini(r) > Date.now()).sort((x, y) => ini(x) - ini(y))[0];
    if (prox && prox.data !== s) { box.append(el('h6', { class: 'tt-grupo' }, 'Próxima reunião')); box.append(cartao(prox)); }
  }
  function formulario(dia, r, hora) {
    let d = document.getElementById('dlgAgenda'); if (!d) { d = el('dialog', { id: 'dlgAgenda', class: 'ag-dlg' }); document.body.append(d); }
    d.innerHTML = '';
    const ed = r || {}, tipo = { v: ed.tipo || st.tipoNovo };
    const clientes = (() => { try { return KM.clientesFora.lista().map(c => c.nome); } catch (e) { return (A().cfg().clientes || []).map(c => c.nome); } })();
    const i = (tp, v, ex = {}) => el('input', Object.assign({ type: tp, value: v || '' }, ex));
    const tit = i('text', ed.titulo, { maxlength: 90, placeholder: 'Ex.: Apresentar proposta de contabilidade', required: true });
    const dt = i('date', ed.data || dia || hoje()), hr = i('time', ed.hora || hora || (() => { const h = new Date(); h.setMinutes(h.getMinutes() + 60 - (h.getMinutes() % 30)); return `${dd(h.getHours())}:${dd(h.getMinutes())}`; })());
    const dur = el('select', {}, [15, 30, 45, 60, 90, 120, 180].map(n => el('option', { value: n, selected: (ed.duracao || 60) === n }, n < 60 ? `${n} min` : `${n / 60}h`.replace('.5', 'h30').replace('hh', 'h'))));
    const com = i('text', ed.com, { list: 'agClientes', maxlength: 60, placeholder: 'Cliente ou pessoa' });
    const local = i('text', ed.local, { maxlength: 120, placeholder: 'Sala de reunião, endereço ou link do Meet/Zoom' });
    const aviso = el('select', {}, [[5, '5 min antes'], [15, '15 min antes'], [30, '30 min antes'], [60, '1 hora antes'], [120, '2 horas antes'], [1440, '1 dia antes']].map(([v, n]) => el('option', { value: v, selected: (ed.aviso || 15) === v }, n)));
    const vesp = el('input', { type: 'checkbox', checked: !!ed.aviso2 });
    const obs = el('textarea', { rows: 3, maxlength: 400, placeholder: 'Pauta, o que levar, observações…' }); obs.value = ed.obs || '';
    const tipos = el('div', { class: 'ag-tipos' });
    const prev = el('div', { class: 'ag-prev' });
    const preVer = () => { const m = mensagem({ titulo: tit.value || 'Reunião', com: com.value, local: local.value, obs: obs.value, hora: hr.value, tipo: tipo.v }, Number(aviso.value)); prev.innerHTML = ''; prev.append(el('small', {}, 'O aviso vai chegar assim:'), el('b', {}, m.titulo), el('span', {}, m.corpo)); };
    const pintarTipos = () => { tipos.innerHTML = ''; for (const [k, T] of Object.entries(TIPOS)) tipos.append(el('button', { type: 'button', class: tipo.v === k ? 'on' : '', style: `--c:${T.cor}`, onclick: () => { tipo.v = k; st.tipoNovo = k; pintarTipos(); preVer(); } }, T.ic + ' ' + T.nome)); };
    pintarTipos();
    [tit, com, local, obs, hr].forEach(x => x.addEventListener('input', preVer)); aviso.addEventListener('change', preVer);
    const campo = (rot, c, cls) => el('label', { class: 'ag-campo ' + (cls || '') }, el('span', {}, rot), c);
    const form = el('form', { class: 'dlg-corpo ag-form', onsubmit: e => {
      e.preventDefault();
      if (!tit.value.trim()) return tit.focus();
      const nr = { id: ed.id || 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), titulo: tit.value.trim(), data: dt.value, hora: hr.value, duracao: Number(dur.value) || 60, aviso: Number(aviso.value) || 15,
        aviso2: vesp.checked, com: com.value.trim(), local: local.value.trim(), obs: obs.value.trim(), tipo: tipo.v, criadaEm: ed.criadaEm || new Date().toISOString() };
      const c = A().cfg(); c.reunioes = lista().filter(x => x.id !== nr.id).concat(nr).sort((x, y) => (x.data + x.hora).localeCompare(y.data + y.hora));
      try { const k = 'kwik-mini-reunioes-avisos', m = JSON.parse(localStorage.getItem(k) || '{}'); for (const kk of Object.keys(m)) if (kk.startsWith(nr.id + '|')) delete m[kk]; localStorage.setItem(k, JSON.stringify(m)); } catch (x) { /* ok */ }
      A().salvar(true); d.close(); st.dia = nr.data; st.ref = nr.data.slice(0, 7); render();
      KM.tocar && KM.tocar('sucesso');
      A().toast(`${tipoDe(nr).ic} Marcado: ${nr.titulo} · ${new Date(nr.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} às ${nr.hora}`, { ms: 6000 });
      if ('Notification' in window && Notification.permission !== 'granted') setTimeout(() => A().toast('🔔 Quer o aviso no celular? Ative os avisos.', { botao: ['Ativar', () => KM.clara.ativarNotificacoes()], ms: 8000 }), 900);
    } },
      el('datalist', { id: 'agClientes' }, clientes.map(n => el('option', { value: n }))),
      campo('Sobre o que é', tipos, 'full'), campo('Título', tit, 'full'), campo('Dia', dt), campo('Hora', hr), campo('Duração', dur), campo('Com quem', com),
      campo('Onde / link', local, 'full'), campo('Avisar', aviso), el('label', { class: 'ag-campo ag-vesp' }, vesp, el('span', {}, 'Avisar também na véspera (18h)')),
      campo('Pauta / observações', obs, 'full'), prev,
      el('div', { class: 'ag-bts' }, el('button', { class: 'bt prim', type: 'submit' }, ed.id ? '💾 Salvar' : '✅ Marcar reunião'), ed.id ? el('button', { class: 'bt perigo', type: 'button', onclick: () => { if (!confirm('Desmarcar esta reunião?')) return; const c = A().cfg(); c.reunioes = lista().filter(x => x.id !== ed.id); A().salvar(true); d.close(); render(); } }, '🗑 Desmarcar') : null));
    d.append(el('div', { class: 'dlg-topo' }, el('h2', {}, ed.id ? '✏️ Editar reunião' : '🗓️ Marcar reunião'), el('button', { type: 'button', onclick: () => d.close() }, '×')), form);
    preVer(); d.showModal(); setTimeout(() => (ed.id ? null : tit.focus()), 50);
  }
  // aviso na véspera às 18h (com o app aberto)
  setInterval(() => {
    if (!A() || !A().cfg) return;
    const n = new Date(); if (n.getHours() < 18) return;
    let ja = {}; try { ja = JSON.parse(localStorage.getItem('kwik-mini-reunioes-avisos') || '{}'); } catch (e) { /* ok */ }
    const amanha = iso(new Date(Date.now() + 864e5));
    for (const r of lista().filter(x => x.aviso2 && x.data === amanha)) {
      const k = r.id + '|vespera'; if (ja[k]) continue; ja[k] = Date.now();
      const T = tipoDe(r); A().toast(`${T.ic} Amanhã às ${r.hora}: ${r.titulo}${r.com ? ' com ' + r.com : ''}`, { ms: 12000 });
      if (KM.clara && KM.clara.notificarSistema) KM.clara.notificarSistema(`${T.ic} Amanhã: ${T.nome}`, `${r.hora} · ${r.titulo}`);
    }
    try { localStorage.setItem('kwik-mini-reunioes-avisos', JSON.stringify(ja)); } catch (e) { /* ok */ }
  }, 60000);
  function resumo() {
    const p = lista().filter(r => ini(r) > Date.now()).sort((x, y) => ini(x) - ini(y))[0];
    if (!p) return { txt: 'Nenhuma reunião marcada' };
    const min = Math.round((ini(p) - Date.now()) / 60000), T = tipoDe(p);
    return { txt: `${T.ic} ${p.data === hoje() ? 'Hoje' : new Date(p.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${p.hora} · ${p.titulo.slice(0, 26)}`, alerta: min < 120, ticker: `🗓️ Próxima: ${p.titulo.slice(0, 30)} (${quandoTxt(min)})` };
  }
  KM.agenda = { TIPOS, mensagem, tipoDe, irDia: d => { st.dia = d; st.ref = d.slice(0, 7); st.visao = 'mes'; KM.inicio.abrirApp('reuniao'); } };
  KM.inicio.registrar('reuniao', { abrir, sair, resumo });
})();
