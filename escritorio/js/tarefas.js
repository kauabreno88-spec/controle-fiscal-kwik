/* KWIK Mini Escritório · Tarefas (organizador no estilo do TickTick).
   Usa a MESMA lista da prancheta da Clara (cfg.checklist): o que você anota aqui aparece na prancheta do escritório e
   vice-versa, com os mesmos lembretes. Campos a mais em cada tarefa (a prancheta ignora o que não conhece):
     lista, prioridade (0 nenhuma, 1 baixa, 2 média, 3 alta), tags[], notas, sub[{id,texto,feita}], repetir, lembrete (min), etapa.
   Telas: listas inteligentes (Hoje, Amanhã, Próximos 7 dias, Caixa de entrada, Todas, Sem data, Concluídas), suas listas
   coloridas e etiquetas; visões Lista, Quadro (kanban), Calendário (arrastar para mudar o dia), Matriz (Eisenhower,
   arrastar muda a prioridade) e Foco (pomodoro). A caixa de "adicionar" entende: hoje, amanhã, sexta, dia 15, 15/11,
   em 3 dias, 14h, 14:30, !alta/!média/!baixa (ou !1 !2 !3), #etiqueta, ^Lista, todo dia/toda semana/todo mês/todo ano. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  const el = (...a) => A().el(...a);
  const dd = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
  const hoje = () => iso(new Date());
  const somar = (s, n) => { const d = new Date((s || hoje()) + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
  const diasAte = s => Math.round((new Date(s + 'T00:00:00') - new Date(hoje() + 'T00:00:00')) / 864e5);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const semAc = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const DIAS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const PRIO = [{ n: 'Nenhuma', c: '#adb5bd' }, { n: 'Baixa', c: '#4dabf7' }, { n: 'Média', c: '#fab005' }, { n: 'Alta', c: '#e03131' }];
  const REP = { '': 'Não repete', diaria: 'Todo dia', uteis: 'Dias úteis', semanal: 'Toda semana', mensal: 'Todo mês', anual: 'Todo ano' };
  const AVISO = { '': 'Sem aviso', 0: 'Na hora', 5: '5 min antes', 15: '15 min antes', 30: '30 min antes', 60: '1 hora antes', 1440: '1 dia antes' };
  const CORES = ['#28BE52', '#4dabf7', '#fab005', '#e64980', '#7950f2', '#fd7e14', '#12b886', '#495057'];

  const cfg = () => A().cfg();
  const lista = () => cfg().checklist || (cfg().checklist = []);
  const listas = () => { const c = cfg(); if (!c.tarefasListas) c.tarefasListas = [{ id: 'trabalho', nome: 'Trabalho', cor: '#28BE52', ic: '💼' }, { id: 'clientes', nome: 'Clientes', cor: '#4dabf7', ic: '🏢' }, { id: 'pessoal', nome: 'Pessoal', cor: '#e64980', ic: '🏠' }]; return c.tarefasListas; };
  const listaDe = id => listas().find(l => l.id === id);
  const salvar = () => A().salvar();
  const st = { filtro: 'hoje', visao: 'lista', sel: null, busca: '', mesCal: null, diaCal: null, verFeitas: false };

  // ------------------------------------------------------------------ entender o que foi digitado
  function entender(txt) {
    let t = ' ' + txt + ' ';
    const r = { data: '', hora: '', prioridade: 0, tags: [], lista: '', repetir: '' };
    const tira = re => { const m = t.match(re); if (m) t = t.replace(m[0], ' '); return m; };
    let m;
    if ((m = tira(/\s!(alta|alto|urgente|3)\b/i))) r.prioridade = 3; else if ((m = tira(/\s!(m[eé]dia|medio|2)\b/i))) r.prioridade = 2; else if ((m = tira(/\s!(baixa|baixo|1)\b/i))) r.prioridade = 1;
    while ((m = tira(/\s#([\wÀ-ú-]+)/))) r.tags.push(m[1].toLowerCase());
    if ((m = tira(/\s\^([\wÀ-ú-]+)/))) { const n = semAc(m[1]); const l = listas().find(x => semAc(x.nome) === n || semAc(x.nome).startsWith(n)); if (l) r.lista = l.id; }
    if ((m = tira(/\s(todo dia|todos os dias|diariamente)\b/i))) r.repetir = 'diaria';
    else if ((m = tira(/\s(dias [uú]teis)\b/i))) r.repetir = 'uteis';
    else if ((m = tira(/\s(toda semana|semanalmente|toda (segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo))\b/i))) { r.repetir = 'semanal'; if (m[2]) t = ' ' + m[2] + t; }
    else if ((m = tira(/\s(todo m[eê]s|mensalmente)\b/i))) r.repetir = 'mensal';
    else if ((m = tira(/\s(todo ano|anualmente)\b/i))) r.repetir = 'anual';
    if ((m = tira(/\s(?:[àa]s\s)?(\d{1,2})(?:[:h](\d{2})|h)\b/i))) { const h = +m[1], mi = +(m[2] || 0); if (h < 24 && mi < 60) r.hora = `${dd(h)}:${dd(mi)}`; }
    if ((m = tira(/\s(depois de amanh[aã])(?=\s)/i))) r.data = somar(hoje(), 2);
    else if ((m = tira(/\s(amanh[aã])(?=\s)/i))) r.data = somar(hoje(), 1);
    else if ((m = tira(/\s(hoje)\b/i))) r.data = hoje();
    else if ((m = tira(/\sem (\d{1,3}) dias?\b/i))) r.data = somar(hoje(), +m[1]);
    else if ((m = tira(/\s(?:dia )?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))) { const a = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : new Date().getFullYear(); let d = new Date(a, +m[2] - 1, +m[1]); if (!m[3] && iso(d) < hoje()) d = new Date(a + 1, +m[2] - 1, +m[1]); r.data = iso(d); }
    else if ((m = tira(/\sdia (\d{1,2})\b/i))) { const n = new Date(); let d = new Date(n.getFullYear(), n.getMonth(), +m[1]); if (iso(d) < hoje()) d = new Date(n.getFullYear(), n.getMonth() + 1, +m[1]); r.data = iso(d); }
    else if ((m = tira(/\s(?:na |no |pr[oó]xim[ao] )?(domingo|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado)(?:-feira)?\b/i))) { const alvo = DIAS.indexOf(semAc(m[1])); const d = new Date(); let k = (alvo - d.getDay() + 7) % 7; if (!k) k = 7; r.data = somar(hoje(), k); }
    if (r.hora && !r.data) r.data = hoje();
    if (r.repetir && !r.data) r.data = hoje();
    r.texto = t.replace(/\s+/g, ' ').trim();
    return r;
  }

  // ------------------------------------------------------------------ filtros
  const pend = t => !t.feita;
  const naLista = (t, id) => (t.lista || 'inbox') === id;
  const FILTROS = {
    hoje: { ic: '☀️', nome: 'Hoje', f: t => pend(t) && t.data && t.data <= hoje() },
    amanha: { ic: '🌅', nome: 'Amanhã', f: t => pend(t) && t.data === somar(hoje(), 1) },
    semana: { ic: '📅', nome: 'Próximos 7 dias', f: t => pend(t) && t.data && t.data <= somar(hoje(), 7) },
    inbox: { ic: '📥', nome: 'Caixa de entrada', f: t => pend(t) && naLista(t, 'inbox') },
    todas: { ic: '🗂️', nome: 'Todas', f: pend },
    semdata: { ic: '♾️', nome: 'Sem data', f: t => pend(t) && !t.data },
    feitas: { ic: '✔️', nome: 'Concluídas', f: t => t.feita },
  };
  function filtrar(id = st.filtro) {
    let ts;
    if (FILTROS[id]) ts = lista().filter(FILTROS[id].f);
    else if (id.startsWith('tag:')) ts = lista().filter(t => pend(t) && (t.tags || []).includes(id.slice(4)));
    else ts = lista().filter(t => naLista(t, id) && (pend(t) || st.verFeitas));
    if (st.busca) { const q = semAc(st.busca); ts = ts.filter(t => semAc(t.texto + ' ' + (t.notas || '') + ' ' + (t.tags || []).join(' ')).includes(q)); }
    return ts.sort(ordem);
  }
  const ordem = (a, b) => (a.feita - b.feita) || (a.data || '9999').localeCompare(b.data || '9999') || (a.hora || '99').localeCompare(b.hora || '99') || (b.prioridade || 0) - (a.prioridade || 0);
  const tituloFiltro = id => FILTROS[id] ? FILTROS[id].nome : id.startsWith('tag:') ? '#' + id.slice(4) : (listaDe(id) || { nome: id === 'inbox' ? 'Caixa de entrada' : id }).nome;

  // ------------------------------------------------------------------ ações
  function nova(txt, extra = {}) {
    const r = entender(txt); if (!r.texto) return null;
    if (!r.data && st.filtro === 'hoje') r.data = hoje();
    if (!r.data && st.filtro === 'amanha') r.data = somar(hoje(), 1);
    if (!r.lista && listaDe(st.filtro)) r.lista = st.filtro;
    if (st.filtro.startsWith('tag:') && !r.tags.includes(st.filtro.slice(4))) r.tags.push(st.filtro.slice(4));
    const t = Object.assign({ id: uid(), texto: r.texto.slice(0, 200), data: r.data, hora: r.hora, feita: false, criadaEm: new Date().toISOString(), lista: r.lista || 'inbox', prioridade: r.prioridade, tags: r.tags, notas: '', sub: [], repetir: r.repetir, lembrete: r.hora ? 0 : null, etapa: '' }, extra);
    lista().push(t); salvar();
    KM.tocar && KM.tocar('clique');
    return t;
  }
  function proximaData(t) {
    const base = t.data || hoje();
    if (t.repetir === 'diaria') return somar(base, 1);
    if (t.repetir === 'uteis') { let d = somar(base, 1); while ([0, 6].includes(new Date(d + 'T12:00:00').getDay())) d = somar(d, 1); return d; }
    if (t.repetir === 'semanal') return somar(base, 7);
    const d = new Date(base + 'T12:00:00');
    if (t.repetir === 'mensal') d.setMonth(d.getMonth() + 1); else if (t.repetir === 'anual') d.setFullYear(d.getFullYear() + 1);
    return iso(d);
  }
  function concluir(t, sim) {
    if (sim && t.repetir) { // repetindo: conta e pula para a próxima data
      t.feitasRep = (t.feitasRep || 0) + 1; t.ultimaVez = new Date().toISOString();
      t.data = proximaData(t); (t.sub || []).forEach(s => { s.feita = false; });
      A().toast(`🔁 Feito! Próxima vez: ${fmtData(t.data)}`);
    } else { t.feita = sim; t.feitaEm = sim ? new Date().toISOString() : null; }
    salvar();
    if (sim) { KM.tocar && KM.tocar('sucesso'); if (KM.inicio) KM.inicio.falarClara(['Mandou bem! ✅', 'Uma a menos! 💪', 'Riscada da lista! ✨', 'Isso aí! 🎉'][Math.floor(Math.random() * 4)]); }
    render();
  }
  function apagar(t) {
    if (!confirm(`Apagar "${t.texto}"?`)) return;
    const l = lista(), i = l.indexOf(t); if (i >= 0) l.splice(i, 1);
    if (st.sel === t.id) st.sel = null;
    salvar(); render();
  }
  function fmtData(s) {
    if (!s) return '';
    const n = diasAte(s);
    if (n === 0) return 'Hoje'; if (n === 1) return 'Amanhã'; if (n === -1) return 'Ontem';
    const d = new Date(s + 'T12:00:00');
    if (n > 1 && n < 7) return DIAS[d.getDay()].replace('terca', 'terça').replace('sabado', 'sábado').replace(/^./, c => c.toUpperCase());
    return `${dd(d.getDate())}/${dd(d.getMonth() + 1)}`;
  }

  // ------------------------------------------------------------------ tela
  let corpoApp = null;
  function abrir(corpo, acoes) {
    corpoApp = corpo;
    acoes.append(el('button', { class: 'appv-bt', title: 'Abrir a prancheta da Clara no escritório', onclick: () => { KM.inicio.irEscritorio(); setTimeout(() => KM.clara && KM.clara.abrir && KM.clara.abrir(), 120); } }, '📋 Prancheta'));
    st.sel = null;
    render();
    const nh = lista().filter(FILTROS.hoje.f).length;
    const nomeV = (cfg().marketing && cfg().marketing.dono) || '';
    KM.inicio.claraMini(`Bem-vindo às suas tarefas${nomeV ? ', ' + nomeV : ''}! ✨ ${nh ? `Você tem ${nh} para hoje.` : 'Nada pendente para hoje.'}`);
  }
  function sair() { const c = $('#claraMini'); if (c) c.remove(); corpoApp = null; }
  function render() {
    const corpo = corpoApp; if (!corpo || !corpo.isConnected) return;
    const rolagem = corpo.querySelector('.tt-conteudo') ? corpo.querySelector('.tt-conteudo').scrollTop : 0;
    corpo.innerHTML = '';
    const raiz = el('div', { class: 'tt' + (st.sel ? ' com-det' : '') });
    raiz.append(lateral(), principal());
    const t = lista().find(x => x.id === st.sel);
    if (t) raiz.append(detalhe(t));
    corpo.append(raiz);
    const c = corpo.querySelector('.tt-conteudo'); if (c) c.scrollTop = rolagem;
  }
  function lateral() {
    const side = el('aside', { class: 'tt-side' });
    const busca = el('input', { type: 'search', placeholder: '🔎 Buscar', value: st.busca, oninput: e => { st.busca = e.target.value; clearTimeout(lateral._t); lateral._t = setTimeout(() => { render(); const b = document.querySelector('.tt-side input[type=search]'); if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); } }, 200); } });
    side.append(busca);
    const item = (id, ic, nome, n, cor) => el('button', { class: 'tt-fil' + (st.filtro === id ? ' on' : ''), onclick: () => { st.filtro = id; st.sel = null; render(); }, ondragover: e => { if (!FILTROS[id] || id === 'hoje' || id === 'amanha') e.preventDefault(); }, ondrop: e => soltarEm(e, id) },
      el('span', { class: 'tt-fil-ic', style: cor ? `color:${cor}` : '' }, ic), el('span', { class: 'tt-fil-n' }, nome), n ? el('em', {}, String(n)) : null);
    for (const [id, f] of Object.entries(FILTROS)) if (id !== 'feitas') side.append(item(id, f.ic, f.nome, lista().filter(f.f).length));
    side.append(el('h5', {}, 'Listas', el('button', { class: 'tt-mais', title: 'Nova lista', onclick: novaLista }, '＋')));
    for (const l of listas()) side.append(item(l.id, l.ic || '●', l.nome, lista().filter(t => pend(t) && naLista(t, l.id)).length, l.cor));
    const tags = [...new Set(lista().filter(pend).flatMap(t => t.tags || []))].sort();
    if (tags.length) { side.append(el('h5', {}, 'Etiquetas')); for (const g of tags) side.append(item('tag:' + g, '#', g, lista().filter(t => pend(t) && (t.tags || []).includes(g)).length)); }
    side.append(item('feitas', FILTROS.feitas.ic, FILTROS.feitas.nome, 0));
    return side;
  }
  function soltarEm(e, alvo) {
    e.preventDefault(); const t = lista().find(x => x.id === e.dataTransfer.getData('text/tarefa')); if (!t) return;
    if (alvo === 'hoje') t.data = hoje(); else if (alvo === 'amanha') t.data = somar(hoje(), 1); else if (alvo === 'semdata') t.data = ''; else if (alvo === 'inbox' || listaDe(alvo)) t.lista = alvo; else return;
    salvar(); render();
  }
  async function novaLista() {
    const nome = prompt('Nome da nova lista (ex.: Fiscal, Estudos, Casa):'); if (!nome || !nome.trim()) return;
    const id = semAc(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || uid();
    if (listaDe(id)) return A().toast('Já existe uma lista com esse nome');
    listas().push({ id, nome: nome.trim().slice(0, 30), cor: CORES[listas().length % CORES.length], ic: '●' });
    st.filtro = id; salvar(); render();
  }
  function principal() {
    const main = el('section', { class: 'tt-main' });
    const lst = listaDe(st.filtro);
    const visoes = [['lista', '☰', 'Lista'], ['kanban', '▦', 'Quadro'], ['calendario', '🗓', 'Calendário'], ['matriz', '⊞', 'Matriz'], ['foco', '⏱', 'Foco']];
    main.append(el('div', { class: 'tt-cab' },
      el('h2', {}, el('span', { style: lst ? `color:${lst.cor}` : '' }, FILTROS[st.filtro] ? FILTROS[st.filtro].ic + ' ' : lst ? '● ' : ''), tituloFiltro(st.filtro)),
      lst ? el('button', { class: 'tt-mini', title: 'Apagar a lista (as tarefas vão para a Caixa de entrada)', onclick: () => { if (!confirm(`Apagar a lista "${lst.nome}"? As tarefas vão para a Caixa de entrada.`)) return; lista().forEach(t => { if (t.lista === lst.id) t.lista = 'inbox'; }); cfg().tarefasListas = listas().filter(x => x !== lst); st.filtro = 'inbox'; salvar(); render(); } }, '🗑') : null,
      el('div', { class: 'tt-visoes' }, visoes.map(([v, ic, n]) => el('button', { class: st.visao === v ? 'on' : '', title: n, onclick: () => { st.visao = v; render(); } }, el('span', {}, ic), el('small', {}, n))))));
    if (st.visao !== 'foco') main.append(caixaNova());
    const cont = el('div', { class: 'tt-conteudo' });
    if (st.visao === 'lista') visaoLista(cont);
    else if (st.visao === 'kanban') visaoKanban(cont);
    else if (st.visao === 'calendario') visaoCalendario(cont);
    else if (st.visao === 'matriz') visaoMatriz(cont);
    else visaoFoco(cont);
    main.append(cont);
    return main;
  }
  function caixaNova(extra) {
    const prev = el('div', { class: 'tt-prev' });
    const inp = el('input', { type: 'text', class: 'tt-add', maxlength: 220, placeholder: '＋ Adicionar tarefa — ex.: Enviar DAS da clínica sexta 10h !alta #fiscal' });
    const mostrar = () => {
      prev.innerHTML = ''; if (!inp.value.trim()) return;
      const r = entender(inp.value);
      if (r.data) prev.append(el('span', { class: 'tt-ch d' }, `📅 ${fmtData(r.data)}${r.hora ? ' ' + r.hora : ''}`));
      if (r.prioridade) prev.append(el('span', { class: 'tt-ch', style: `color:${PRIO[r.prioridade].c}` }, `⚑ ${PRIO[r.prioridade].n}`));
      if (r.repetir) prev.append(el('span', { class: 'tt-ch' }, `🔁 ${REP[r.repetir]}`));
      if (r.lista) prev.append(el('span', { class: 'tt-ch' }, `● ${listaDe(r.lista).nome}`));
      for (const g of r.tags) prev.append(el('span', { class: 'tt-ch' }, '#' + g));
    };
    inp.addEventListener('input', mostrar);
    inp.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const t = nova(inp.value, extra && extra()); if (!t) return;
      inp.value = ''; prev.innerHTML = ''; render();
      setTimeout(() => { const i = document.querySelector('.tt-add'); if (i) i.focus(); }, 30);
    });
    return el('div', { class: 'tt-nova' }, inp, prev);
  }
  function linha(t, compacta) {
    const sub = (t.sub || []), subOk = sub.filter(s => s.feita).length, l = listaDe(t.lista);
    const atras = t.data && !t.feita && diasAte(t.data) < 0;
    const li = el('div', { class: 'tt-item' + (t.feita ? ' feita' : '') + (st.sel === t.id ? ' sel' : ''), draggable: 'true', ondragstart: e => { e.dataTransfer.setData('text/tarefa', t.id); e.dataTransfer.effectAllowed = 'move'; } },
      el('label', { class: 'tt-chk', style: `--p:${PRIO[t.prioridade || 0].c}`, onclick: e => e.stopPropagation() }, el('input', { type: 'checkbox', checked: !!t.feita, onchange: e => concluir(t, e.target.checked) }), el('i')),
      el('div', { class: 'tt-txt' }, el('span', {}, t.texto),
        compacta ? null : el('small', {}, [sub.length ? `☑ ${subOk}/${sub.length}` : '', t.notas ? '📝' : '', t.repetir ? '🔁' : '', (t.tags || []).map(g => '#' + g).join(' ')].filter(Boolean).join('  '))),
      !compacta && l && !listaDe(st.filtro) ? el('span', { class: 'tt-lst', style: `background:${l.cor}22;color:${l.cor}` }, l.nome) : null,
      t.data ? el('span', { class: 'tt-dt' + (atras ? ' atras' : diasAte(t.data) === 0 ? ' hoje' : '') }, `${fmtData(t.data)}${t.hora ? ' ' + t.hora : ''}`) : null);
    li.addEventListener('click', () => { st.sel = st.sel === t.id ? null : t.id; render(); });
    return li;
  }
  function visaoLista(cont) {
    const ts = filtrar();
    const grupos = [['Atrasadas', t => t.data && diasAte(t.data) < 0], ['Hoje', t => t.data && diasAte(t.data) === 0], ['Amanhã', t => t.data && diasAte(t.data) === 1],
      ['Próximos 7 dias', t => t.data && diasAte(t.data) > 1 && diasAte(t.data) <= 7], ['Mais tarde', t => t.data && diasAte(t.data) > 7], ['Sem data', t => !t.data]];
    if (st.filtro === 'feitas') { const l = ts.sort((a, b) => String(b.feitaEm).localeCompare(String(a.feitaEm))).slice(0, 150); if (!l.length) cont.append(vazio('Nada concluído ainda.')); l.forEach(t => cont.append(linha(t))); return; }
    const pendentes = ts.filter(pend);
    if (!pendentes.length) cont.append(vazio(st.busca ? 'Nada encontrado.' : 'Tudo em dia por aqui! 🎉 Escreva uma tarefa acima.'));
    for (const [nome, f] of grupos) {
      const g = pendentes.filter(f); if (!g.length) continue;
      cont.append(el('h6', { class: 'tt-grupo' + (nome === 'Atrasadas' ? ' atras' : '') }, nome, el('em', {}, String(g.length))));
      g.forEach(t => cont.append(linha(t)));
    }
    if (listaDe(st.filtro)) {
      const feitas = lista().filter(t => t.feita && naLista(t, st.filtro));
      if (feitas.length) cont.append(el('button', { class: 'tt-verfeitas', onclick: () => { st.verFeitas = !st.verFeitas; render(); } }, st.verFeitas ? 'Esconder concluídas' : `Mostrar ${feitas.length} concluída${feitas.length > 1 ? 's' : ''}`));
      if (st.verFeitas) feitas.forEach(t => cont.append(linha(t)));
    }
  }
  const vazio = txt => el('div', { class: 'tt-vazio' }, el('span', {}, '🗒️'), el('p', {}, txt));
  function coluna(titulo, cor, ts, aoSoltar, extra) {
    const c = el('div', { class: 'tt-col', ondragover: e => { e.preventDefault(); c.classList.add('alvo'); }, ondragleave: () => c.classList.remove('alvo'),
      ondrop: e => { e.preventDefault(); c.classList.remove('alvo'); const t = lista().find(x => x.id === e.dataTransfer.getData('text/tarefa')); if (t) { aoSoltar(t); salvar(); render(); } } },
    el('div', { class: 'tt-col-cab', style: `border-color:${cor}` }, el('b', {}, titulo), el('em', {}, String(ts.length)), extra || null));
    ts.forEach(t => c.append(linha(t, false)));
    if (!ts.length) c.append(el('p', { class: 'tt-col-vazia' }, 'Arraste para cá'));
    return c;
  }
  function visaoKanban(cont) {
    const ts = filtrar().filter(pend), feitas = lista().filter(t => t.feita && (FILTROS[st.filtro] || st.filtro.startsWith('tag:') ? true : naLista(t, st.filtro))).sort((a, b) => String(b.feitaEm).localeCompare(String(a.feitaEm))).slice(0, 12);
    const q = el('div', { class: 'tt-kanban' });
    q.append(coluna('A fazer', '#adb5bd', ts.filter(t => t.etapa !== 'fazendo'), t => { t.etapa = ''; t.feita = false; }),
      coluna('Fazendo', '#4dabf7', ts.filter(t => t.etapa === 'fazendo'), t => { t.etapa = 'fazendo'; t.feita = false; }),
      coluna('Feito', '#28BE52', feitas, t => { t.etapa = ''; if (!t.feita) concluir(t, true); }));
    cont.append(q, el('p', { class: 'tt-dica' }, 'Arraste os cartões entre as colunas (no celular, toque no cartão e mude a etapa).'));
  }
  function visaoMatriz(cont) {
    const ts = filtrar().filter(pend), q = el('div', { class: 'tt-matriz' });
    [[3, 'Urgente e importante', 'Faça agora', '#e03131'], [2, 'Importante, não urgente', 'Planeje', '#fab005'], [1, 'Urgente, não importante', 'Delegue', '#4dabf7'], [0, 'Nem urgente nem importante', 'Depois', '#adb5bd']]
      .forEach(([p, n, s, c]) => q.append(coluna(n, c, ts.filter(t => (t.prioridade || 0) === p), t => { t.prioridade = p; }, el('small', {}, s))));
    cont.append(q, el('p', { class: 'tt-dica' }, 'A matriz usa a prioridade: Alta, Média, Baixa e Nenhuma. Arraste para mudar.'));
  }
  function visaoCalendario(cont) {
    const ref = st.mesCal || hoje().slice(0, 7), [a, m] = ref.split('-').map(Number), p1 = new Date(a, m - 1, 1), ini = new Date(a, m - 1, 1 - p1.getDay());
    cont.append(el('div', { class: 'tt-cal-cab' }, el('button', { class: 'bt peq', onclick: () => { const d = new Date(a, m - 2, 1); st.mesCal = iso(d).slice(0, 7); render(); } }, '◀'),
      el('b', {}, `${MESES[m - 1]} ${a}`), el('button', { class: 'bt peq', onclick: () => { const d = new Date(a, m, 1); st.mesCal = iso(d).slice(0, 7); render(); } }, '▶'),
      el('button', { class: 'bt peq', onclick: () => { st.mesCal = null; st.diaCal = hoje(); render(); } }, 'Hoje')));
    const g = el('div', { class: 'tt-cal' });
    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(d => g.append(el('div', { class: 'tt-cal-sem' }, d)));
    const doCal = (FILTROS[st.filtro] ? lista() : filtrar()).filter(t => t.data && (!t.feita || st.filtro === 'feitas'));
    for (let i = 0; i < 42; i++) {
      const d = new Date(ini); d.setDate(ini.getDate() + i); const s = iso(d), ts = doCal.filter(t => t.data === s).sort(ordem);
      const cel = el('div', { class: 'tt-dia' + (d.getMonth() !== m - 1 ? ' fora' : '') + (s === hoje() ? ' hoje' : '') + (s === st.diaCal ? ' sel' : ''),
        onclick: () => { st.diaCal = s; render(); }, ondragover: e => { e.preventDefault(); cel.classList.add('alvo'); }, ondragleave: () => cel.classList.remove('alvo'),
        ondrop: e => { e.preventDefault(); const t = lista().find(x => x.id === e.dataTransfer.getData('text/tarefa')); if (t) { t.data = s; salvar(); render(); } } }, el('span', { class: 'tt-dn' }, String(d.getDate())));
      ts.slice(0, 3).forEach(t => cel.append(el('div', { class: 'tt-pill', draggable: 'true', style: `border-left-color:${PRIO[t.prioridade || 0].c}`, title: t.texto, ondragstart: e => { e.stopPropagation(); e.dataTransfer.setData('text/tarefa', t.id); }, onclick: e => { e.stopPropagation(); st.sel = t.id; st.diaCal = s; render(); } }, (t.hora ? t.hora + ' ' : '') + t.texto)));
      if (ts.length > 3) cel.append(el('small', { class: 'tt-mais-dia' }, `+${ts.length - 3}`));
      g.append(cel);
    }
    cont.append(g);
    if (st.diaCal) {
      const ts = lista().filter(t => t.data === st.diaCal).sort(ordem);
      cont.append(el('h6', { class: 'tt-grupo' }, `${fmtData(st.diaCal)} · ${new Date(st.diaCal + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`, el('em', {}, String(ts.length))));
      cont.append(caixaNova(() => ({ data: st.diaCal })));
      ts.forEach(t => cont.append(linha(t)));
    }
  }

  // ------------------------------------------------------------------ foco (pomodoro)
  const foco = { modo: 'foco', resta: 25 * 60, rodando: false, timer: 0, tarefa: '' };
  const DUR = { foco: 25, pausa: 5, longa: 15 };
  function tique() {
    if (!foco.rodando) return;
    foco.resta--;
    if (foco.resta <= 0) {
      foco.rodando = false; clearInterval(foco.timer);
      const c = cfg(); c.foco = c.foco && c.foco.dia === hoje() ? c.foco : { dia: hoje(), n: 0, min: 0 };
      if (foco.modo === 'foco') { c.foco.n++; c.foco.min += DUR.foco; salvar(); }
      KM.tocar && KM.tocar('sucesso');
      const msg = foco.modo === 'foco' ? 'Foco concluído! Hora de uma pausa ☕' : 'Pausa acabou! Bora voltar 💪';
      A().toast('⏱ ' + msg, { ms: 9000 }); if (KM.clara && KM.clara.notificarSistema) KM.clara.notificarSistema('⏱ KWIK Foco', msg); if (KM.inicio) KM.inicio.falarClara(msg);
      foco.modo = foco.modo === 'foco' ? ((cfg().foco.n % 4 === 0) ? 'longa' : 'pausa') : 'foco'; foco.resta = DUR[foco.modo] * 60;
    }
    const r = document.querySelector('.tt-foco-tempo'); if (r) atualizarRelogio(); else if (!foco.rodando) render();
  }
  function atualizarRelogio() {
    const r = document.querySelector('.tt-foco-tempo'); if (!r) return;
    r.textContent = `${dd(Math.floor(foco.resta / 60))}:${dd(foco.resta % 60)}`;
    const arco = document.querySelector('.tt-foco-arco'); if (arco) arco.setAttribute('stroke-dashoffset', String(691 * (1 - foco.resta / (DUR[foco.modo] * 60))));
  }
  function visaoFoco(cont) {
    const c = cfg().foco && cfg().foco.dia === hoje() ? cfg().foco : { n: 0, min: 0 };
    const pend = lista().filter(t => !t.feita).sort(ordem).slice(0, 40);
    const sel = el('select', { onchange: e => { foco.tarefa = e.target.value; } }, el('option', { value: '' }, '— focar em… (opcional)'), pend.map(t => el('option', { value: t.id, selected: t.id === foco.tarefa }, t.texto.slice(0, 60))));
    const svg = `<svg viewBox="0 0 240 240" class="tt-foco-svg"><circle cx="120" cy="120" r="110" fill="none" stroke="#e9ecef" stroke-width="12"/><circle class="tt-foco-arco" cx="120" cy="120" r="110" fill="none" stroke="${foco.modo === 'foco' ? '#28BE52' : '#4dabf7'}" stroke-width="12" stroke-linecap="round" stroke-dasharray="691" stroke-dashoffset="0" transform="rotate(-90 120 120)"/></svg>`;
    const caixa = el('div', { class: 'tt-foco' },
      el('div', { class: 'tt-foco-modos' }, Object.entries({ foco: '🎯 Foco 25', pausa: '☕ Pausa 5', longa: '🛋 Pausa 15' }).map(([k, n]) => el('button', { class: foco.modo === k ? 'on' : '', onclick: () => { foco.modo = k; foco.resta = DUR[k] * 60; foco.rodando = false; clearInterval(foco.timer); render(); } }, n))),
      el('div', { class: 'tt-foco-relogio', html: svg }, el('div', { class: 'tt-foco-tempo' }, '25:00')),
      sel,
      el('div', { class: 'tt-foco-bts' },
        el('button', { class: 'bt prim', onclick: () => { foco.rodando = !foco.rodando; clearInterval(foco.timer); if (foco.rodando) foco.timer = setInterval(tique, 1000); render(); } }, foco.rodando ? '⏸ Pausar' : '▶ Começar'),
        el('button', { class: 'bt', onclick: () => { foco.rodando = false; clearInterval(foco.timer); foco.resta = DUR[foco.modo] * 60; render(); } }, '↺ Zerar'),
        foco.tarefa ? el('button', { class: 'bt', onclick: () => { const t = lista().find(x => x.id === foco.tarefa); if (t) concluir(t, true); foco.tarefa = ''; } }, '✅ Concluir a tarefa') : null),
      el('p', { class: 'tt-foco-hoje' }, `Hoje: ${c.n} foco${c.n === 1 ? '' : 's'} · ${c.min} min concentrado`));
    cont.append(caixa);
    setTimeout(atualizarRelogio, 0);
  }

  // ------------------------------------------------------------------ detalhe da tarefa
  function detalhe(t) {
    const muda = (k, v, re = true) => { t[k] = v; salvar(); if (re) render(); };
    const det = el('aside', { class: 'tt-det' });
    const titulo = el('textarea', { class: 'tt-det-tit', rows: 2, maxlength: 200, oninput: e => muda('texto', e.target.value.replace(/\n/g, ' '), false), onblur: () => render() }); titulo.value = t.texto;
    det.append(el('div', { class: 'tt-det-cab' },
      el('label', { class: 'tt-chk', style: `--p:${PRIO[t.prioridade || 0].c}` }, el('input', { type: 'checkbox', checked: !!t.feita, onchange: e => concluir(t, e.target.checked) }), el('i')),
      el('div', { class: 'tt-prio' }, PRIO.map((p, i) => el('button', { class: (t.prioridade || 0) === i ? 'on' : '', style: `color:${p.c}`, title: 'Prioridade ' + p.n, onclick: () => muda('prioridade', i) }, '⚑'))),
      el('button', { class: 'tt-fechar', title: 'Fechar', onclick: () => { st.sel = null; render(); } }, '×')), titulo);
    const campo = (rot, ctrl) => el('label', { class: 'tt-campo' }, el('span', {}, rot), ctrl);
    det.append(el('div', { class: 'tt-campos' },
      campo('📅 Data', el('input', { type: 'date', value: t.data || '', onchange: e => muda('data', e.target.value) })),
      campo('🕒 Hora', el('input', { type: 'time', value: t.hora || '', onchange: e => { t.hora = e.target.value; if (t.hora && t.lembrete == null) t.lembrete = 0; if (t.hora && !t.data) t.data = hoje(); salvar(); render(); } })),
      campo('🔔 Aviso', el('select', { onchange: e => muda('lembrete', e.target.value === '' ? null : +e.target.value) }, Object.entries(AVISO).map(([v, n]) => el('option', { value: v, selected: String(t.lembrete ?? '') === v }, n)))),
      campo('🔁 Repetir', el('select', { onchange: e => muda('repetir', e.target.value) }, Object.entries(REP).map(([v, n]) => el('option', { value: v, selected: (t.repetir || '') === v }, n)))),
      campo('● Lista', el('select', { onchange: e => muda('lista', e.target.value) }, [['inbox', '📥 Caixa de entrada'], ...listas().map(l => [l.id, l.nome])].map(([v, n]) => el('option', { value: v, selected: (t.lista || 'inbox') === v }, n)))),
      campo('▦ Etapa', el('select', { onchange: e => muda('etapa', e.target.value) }, [['', 'A fazer'], ['fazendo', 'Fazendo']].map(([v, n]) => el('option', { value: v, selected: (t.etapa || '') === v }, n)))),
      campo('# Etiquetas', el('input', { type: 'text', value: (t.tags || []).join(', '), placeholder: 'fiscal, urgente', onchange: e => muda('tags', e.target.value.split(/[,\s]+/).map(x => x.replace(/^#/, '').toLowerCase()).filter(Boolean)) }))));
    // subtarefas
    const sub = t.sub = t.sub || [];
    const lsub = el('div', { class: 'tt-sub' }, el('h6', {}, `Subtarefas ${sub.length ? `(${sub.filter(s => s.feita).length}/${sub.length})` : ''}`));
    for (const s of sub) lsub.append(el('div', { class: 'tt-sub-it' + (s.feita ? ' ok' : '') },
      el('input', { type: 'checkbox', checked: !!s.feita, onchange: e => { s.feita = e.target.checked; salvar(); render(); } }), el('span', {}, s.texto),
      el('button', { title: 'Tirar', onclick: () => { t.sub = sub.filter(x => x !== s); salvar(); render(); } }, '×')));
    const ns = el('input', { type: 'text', placeholder: '＋ Subtarefa (Enter)', maxlength: 140, onkeydown: e => { if (e.key === 'Enter' && e.target.value.trim()) { sub.push({ id: uid(), texto: e.target.value.trim(), feita: false }); salvar(); render(); setTimeout(() => { const i = document.querySelector('.tt-sub input[type=text]'); if (i) i.focus(); }, 30); } } });
    lsub.append(ns); det.append(lsub);
    const notas = el('textarea', { class: 'tt-notas', rows: 5, placeholder: '📝 Anotações, links, detalhes…', oninput: e => muda('notas', e.target.value, false) }); notas.value = t.notas || '';
    det.append(notas);
    det.append(el('div', { class: 'tt-det-rod' }, el('small', {}, `Criada ${t.criadaEm ? new Date(t.criadaEm).toLocaleDateString('pt-BR') : ''}${t.feitasRep ? ` · feita ${t.feitasRep}x` : ''}`), el('button', { class: 'bt peq perigo', onclick: () => apagar(t) }, '🗑 Apagar')));
    return det;
  }

  // ------------------------------------------------------------------ avisos com hora (minutos antes)
  const CH = 'kwik-tarefas-avisos';
  function vigiar() {
    if (!A() || !A().cfg) return;
    let ja = {}; try { ja = JSON.parse(localStorage.getItem(CH) || '{}'); } catch (e) { /* ok */ }
    const agora = Date.now();
    for (const t of lista()) {
      if (t.feita || !t.data || !t.hora || t.lembrete == null || t.lembrete === '') continue;
      const ini = new Date(`${t.data}T${t.hora}:00`).getTime(), k = `${t.id}|${t.data}|${t.hora}|${t.lembrete}`;
      if (agora >= ini - t.lembrete * 60000 && agora < ini + 30 * 60000 && !ja[k]) {
        ja[k] = agora;
        const quando = t.lembrete ? (t.lembrete >= 1440 ? 'amanhã' : `em ${t.lembrete} min`) : 'agora';
        A().toast(`⏰ ${t.texto} (${quando}, ${t.hora})`, { botao: ['Abrir', () => { st.sel = t.id; st.filtro = 'todas'; KM.inicio.abrirApp('tarefas'); }], ms: 15000 });
        if (KM.clara && KM.clara.notificarSistema) KM.clara.notificarSistema('⏰ Tarefa ' + quando, t.texto);
        KM.tocar && KM.tocar('notif');
        const cl = Object.values(A().estado.pessoas || {}).find(q => q.funcao === 'checklist'); if (cl) A().falar(cl.id, `⏰ ${t.texto.slice(0, 40)}`, 4000);
      }
    }
    for (const [k, v] of Object.entries(ja)) if (agora - v > 7 * 864e5) delete ja[k];
    try { localStorage.setItem(CH, JSON.stringify(ja)); } catch (e) { /* ok */ }
  }
  setInterval(vigiar, 30000); setTimeout(vigiar, 6000);

  function falaResumo() {
    const h = lista().filter(FILTROS.hoje.f), atr = h.filter(t => diasAte(t.data) < 0).length;
    return h.length ? `Você tem ${h.length} para hoje${atr ? `, ${atr} atrasada${atr > 1 ? 's' : ''}` : ''}. Bora! 💪` : 'Nada para hoje! 🎉';
  }
  function resumo() {
    const h = lista().filter(FILTROS.hoje.f), atr = h.filter(t => diasAte(t.data) < 0).length;
    return { txt: h.length ? `${h.length} para hoje${atr ? ` · ${atr} atrasada${atr > 1 ? 's' : ''}` : ''}` : 'Nada para hoje 🎉', alerta: atr > 0, ticker: `✅ ${h.length} tarefa${h.length === 1 ? '' : 's'} para hoje` };
  }
  KM.tarefasApp = { entender, nova, falaResumo, render };
  if (KM.inicio) KM.inicio.registrar('tarefas', { abrir, sair, resumo });
})();
