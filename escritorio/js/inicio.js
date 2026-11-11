/* KWIK Mini Escritório · Tela inicial, telas dos apps e o botão único de menu.
   - Tela inicial: fundo animado no estilo da KWIK (barras subindo, rede de pontos verdes, brilho que segue o dedo/mouse,
     logo com reflexo) e os atalhos: Escritório, Tarefas, Fiscal, Folha, Reunião, Meta e Gerar relatório.
   - Cada atalho (menos o Escritório) abre em tela cheia, com "← Início" no topo.
   - Botão único (logo KWIK, no canto): ao tocar, abre todas as opções (ir para, ações do escritório, setores e abas).
   Os apps se registram com KM.inicio.registrar(id, { nome, ic, abrir(corpo, acoes), resumo() }). */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const $ = s => document.querySelector(s);
  const el = (...a) => A().el(...a);
  const apps = {};
  const ORDEM = ['escritorio', 'tarefas', 'fiscal', 'folha', 'reuniao', 'meta', 'relatorio'];
  let atual = null, raf = 0;

  function registrar(id, def) { apps[id] = def; }

  // ------------------------------------------------------------------ DOM
  // Tela inicial no estilo da referência: fundo claro, painel grande verde KWIK com cartões brancos arredondados,
  // título forte com o tracinho embaixo, palavra gigante apagada na vertical, calendário com o dia em círculo e
  // os cartões "empilhados" embaixo dele. PC: três colunas (resumo · agenda · atalhos). Celular: uma coluna.
  function montar() {
    if ($('#inicio')) return;
    const ini = el('div', { id: 'inicio', class: 'ini', hidden: true });
    ini.innerHTML = `<div class="i2-bolha b1"></div><div class="i2-bolha b2"></div><div class="i2-bolha b3"></div>
      <div class="i2-palco">
        <section class="i2-verde" id="iniVerde">
          <span class="i2-agua" id="iniAgua"></span>
          <header class="i2-cab"><div class="i2-marca"><svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="38" width="9" height="18" rx="2"/><rect x="22" y="28" width="9" height="28" rx="2"/><rect x="36" y="18" width="9" height="38" rx="2"/><path d="M46 14 L58 4 M50 4 H58 V12" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg><b>KWIK</b></div><span class="i2-hora" id="iniHora"></span></header>
          <h1 id="iniSauda">Olá!</h1><i class="i2-traco"></i>
          <p class="i2-data" id="iniData"></p>
          <div class="i2-card i2-rota" id="iniRota"></div>
          <div class="i2-card i2-resumo" id="iniResumo"></div>
          <div class="i2-barras" aria-hidden="true">${'<i></i>'.repeat(7)}</div>
        </section>
        <section class="i2-branco" id="iniCal"></section>
        <section class="i2-atalhos"><h2>Atalhos</h2><i class="i2-traco escuro"></i><div class="i2-lista" id="iniGrade"></div><p class="i2-rodape">Sua empresa no controle, sem dor de cabeça <b>>>></b></p></section>
      </div>`;
    document.body.append(ini);
    const v = el('div', { id: 'appView', class: 'appv', hidden: true });
    v.innerHTML = `<header class="appv-topo"><button class="appv-voltar" id="appVoltar">← Início</button><div class="appv-tit"><span id="appIc"></span><b id="appNome"></b></div><div class="appv-acoes" id="appAcoes"></div></header><div class="appv-corpo" id="appCorpo"></div>`;
    document.body.append(v);
    $('#appVoltar').addEventListener('click', () => abrirInicio());
    montarMenu();
  }

  // ------------------------------------------------------------------ tela inicial
  const CARTOES = {
    escritorio: { ic: '🏢', nome: 'Escritório', desc: 'A equipe trabalhando ao vivo' },
    tarefas: { ic: '✅', nome: 'Tarefas', desc: 'Suas tarefas, listas e prazos' },
    fiscal: { ic: '🧾', nome: 'Fiscal', desc: 'Clientes, guias, checklist e anexos' },
    folha: { ic: '👥', nome: 'Folha', desc: 'Clientes, funcionários e fechamento' },
    reuniao: { ic: '🗓️', nome: 'Reunião', desc: 'Calendário e avisos' },
    meta: { ic: '🎯', nome: 'Meta', desc: 'Painel dos clientes e crescimento' },
    relatorio: { ic: '📄', nome: 'Gerar relatório', desc: 'Cole a planilha e receba HTML e PDF' },
  };
  const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dd = n => String(n).padStart(2, '0');
  const isoD = d => `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
  const brl0 = v => 'R$ ' + Math.round(+v || 0).toLocaleString('pt-BR');
  let mesCal = null, visaoResumo = 'hoje';
  function saudacao() {
    const h = new Date().getHours(), nome = (A().cfg().marketing && A().cfg().marketing.dono) || (KM.nomeDe && KM.nomeDe('noticias')) || '';
    return `${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}${nome ? ', ' + nome : ''}`;
  }
  function numeros() {
    const c = A().cfg(), hoje = isoD(new Date()), sem = isoD(new Date(Date.now() + 7 * 864e5)), agora = Date.now();
    const pend = (c.checklist || []).filter(t => !t.feita);
    const reun = (c.reunioes || []).map(r => ({ r, t: new Date(`${r.data}T${r.hora || '09:00'}:00`).getTime() }));
    let vencidas = null, folhas = null;
    try { const f = KM.setores.dados('fiscal'); if (f) vencidas = KM.setores.resumoFiscal(f.db).qVencido; } catch (e) { /* ok */ }
    try { const f = KM.setores.dados('folha'); if (f) { const r = KM.setores.resumoFolha(f.db); folhas = r.porEmp.length - r.fechadas; } } catch (e) { /* ok */ }
    const md = KM.metaDados ? KM.metaDados(c) : { total: 0, qAtivos: 0 };
    const proxT = pend.filter(t => t.data).sort((a, b) => (a.data + (a.hora || '99')).localeCompare(b.data + (b.hora || '99')))[0] || pend[0];
    const proxR = reun.filter(x => x.t > agora - 30 * 60000).sort((a, b) => a.t - b.t)[0];
    return {
      hoje: { tarefas: pend.filter(t => t.data && t.data <= hoje).length, atrasadas: pend.filter(t => t.data && t.data < hoje).length, reunioes: reun.filter(x => x.r.data === hoje).length },
      semana: { tarefas: pend.filter(t => t.data && t.data <= sem).length, reunioes: reun.filter(x => x.r.data >= hoje && x.r.data <= sem).length },
      vencidas, folhas, total: md.total, ativos: md.qAtivos, proxT, proxR: proxR && proxR.r, pend,
    };
  }
  const quando = (data, hora) => { if (!data) return 'sem data'; const n = Math.round((new Date(data + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5); const d = n === 0 ? 'Hoje' : n === 1 ? 'Amanhã' : n === -1 ? 'Ontem' : n < 0 ? `${-n} dias atrás` : n < 7 ? DIAS[new Date(data + 'T12:00:00').getDay()] : `${data.slice(8, 10)}/${data.slice(5, 7)}`; return d + (hora ? ' · ' + hora : ''); };
  function contar(elm, alvo) { // números sobem até o valor
    const ini = performance.now(), dur = 700, fmt = elm.dataset.fmt;
    const passo = () => { const k = Math.min(1, (performance.now() - ini) / dur), v = alvo * (1 - Math.pow(1 - k, 3)); elm.textContent = fmt === 'brl' ? brl0(v) : String(Math.round(v)); if (k < 1) requestAnimationFrame(passo); };
    passo();
    setTimeout(() => { elm.textContent = fmt === 'brl' ? brl0(alvo) : String(Math.round(alvo)); }, dur + 80); // garante o valor final
  }
  function renderInicio() {
    const agora = new Date(), N = numeros();
    $('#iniSauda').textContent = saudacao();
    $('#iniData').textContent = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase());
    $('#iniAgua').textContent = DIAS[agora.getDay()];
    relogio();
    // cartão "rota": o que vem agora (tarefa) e depois (reunião)
    const rota = $('#iniRota'); rota.innerHTML = '';
    const T = N.proxT, R = N.proxR;
    rota.append(el('div', { class: 'i2-pilula' }, el('span', {}, '✓'), el('i'), el('span', {}, '◷')),
      el('div', { class: 'i2-rota-l', onclick: () => abrirApp('tarefas') }, el('small', {}, 'Próxima tarefa'), el('b', {}, T ? T.texto : 'Nada pendente 🎉'), el('em', {}, T ? quando(T.data, T.hora) : 'Toque para anotar')),
      el('hr'),
      el('div', { class: 'i2-rota-l', onclick: () => abrirApp('reuniao') }, el('small', {}, 'Próxima reunião'), el('b', {}, R ? R.titulo : 'Agenda livre'), el('em', {}, R ? quando(R.data, R.hora) + (R.com ? ' · ' + R.com : '') : 'Toque para marcar')),
      el('button', { class: 'i2-giro', title: 'Atualizar', onclick: e => { e.currentTarget.classList.add('gira'); setTimeout(renderInicio, 450); } }, '↻'));
    // cartão do resumo com o seletor Hoje | Semana
    const res = $('#iniResumo'); res.innerHTML = '';
    const H = visaoResumo === 'hoje';
    const campos = H
      ? [['Tarefas para hoje', N.hoje.tarefas, '', N.hoje.atrasadas ? `${N.hoje.atrasadas} atrasada${N.hoje.atrasadas > 1 ? 's' : ''}` : ''], ['Reuniões hoje', N.hoje.reunioes, '', ''], ['Guias vencidas', N.vencidas, '', 'Fiscal'], ['Clientes ativos', N.ativos, '', 'Meta']]
      : [['Tarefas na semana', N.semana.tarefas, '', ''], ['Reuniões na semana', N.semana.reunioes, '', ''], ['Folhas a fechar', N.folhas, '', 'Folha'], ['Faturamento/mês', N.total, 'brl', 'Meta']];
    const grade = el('div', { class: 'i2-campos' });
    campos.forEach(([rot, v, fmt, extra], i) => {
      const b = el('b', { 'data-fmt': fmt }, v == null ? '—' : '0');
      grade.append(el('div', { class: i % 2 ? 'dir' : '' }, el('small', {}, rot), b, extra ? el('em', {}, extra) : null));
      if (v != null) setTimeout(() => contar(b, v), 120 + i * 80);
    });
    res.append(el('div', { class: 'i2-toggle' }, ['hoje', 'semana'].map(k => el('button', { class: visaoResumo === k ? 'on' : '', onclick: () => { visaoResumo = k; renderInicio(); } }, k === 'hoje' ? 'Hoje' : 'Esta semana'))),
      grade, el('button', { class: 'i2-botao', onclick: () => irEscritorio() }, '🏢  Entrar no escritório'));
    renderCalendario();
    // atalhos
    const g = $('#iniGrade'); g.innerHTML = '';
    ORDEM.forEach((id, i) => {
      const c = CARTOES[id], ap = apps[id];
      let r = null; try { r = id === 'escritorio' ? resumoEscritorio() : ap && ap.resumo ? ap.resumo() : null; } catch (e) { r = null; }
      g.append(el('button', { class: 'i2-at c-' + id, style: `--i:${i}`, onclick: () => (id === 'escritorio' ? irEscritorio() : abrirApp(id)) },
        el('span', { class: 'i2-at-ic' }, c.ic), el('span', { class: 'i2-at-t' }, el('b', {}, c.nome), el('small', { class: r && r.alerta ? 'alerta' : '' }, r && r.txt ? r.txt : c.desc)), el('i', {}, '›')));
      // botão "✨ Criar" do Kauã logo depois do Escritório
      if (id === 'escritorio' && KM.criar) g.append(el('button', { class: 'i2-at c-criar', style: `--i:${i}`, onclick: () => KM.criar.abrir() },
        el('span', { class: 'i2-at-ic' }, '✨'), el('span', { class: 'i2-at-t' }, el('b', {}, 'Criar'), el('small', {}, 'Texto, vídeo, imagem, Excel, PDF, Word, HTML, Numbers')), el('i', {}, '›')));
    });
  }
  function renderCalendario() {
    const box = $('#iniCal'); box.innerHTML = '';
    const hoje = new Date(), ref = mesCal || isoD(hoje).slice(0, 7), [a, m] = ref.split('-').map(Number), c = A().cfg();
    const reun = new Set((c.reunioes || []).map(r => r.data)), tar = new Set((c.checklist || []).filter(t => !t.feita && t.data).map(t => t.data));
    const card = el('div', { class: 'i2-cal-card' });
    card.append(el('span', { class: 'i2-agua escura' }, MESES[m - 1]),
      el('header', { class: 'i2-cab escuro' }, el('button', { class: 'i2-ic', title: 'Mês anterior', onclick: () => { mesCal = isoD(new Date(a, m - 2, 1)).slice(0, 7); renderCalendario(); } }, '←'),
        el('button', { class: 'i2-ic', title: 'Menu', onclick: e => { e.stopPropagation(); renderMenu(); $('#menuKwik').classList.add('on'); } }, '☰')),
      el('h2', {}, 'Agenda'), el('i', { class: 'i2-traco escuro' }));
    const g = el('div', { class: 'i2-cal' });
    ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].forEach(d => g.append(el('span', { class: 'i2-sem' }, d)));
    const p1 = new Date(a, m - 1, 1).getDay(), n = new Date(a, m, 0).getDate();
    for (let i = 0; i < p1; i++) g.append(el('span'));
    for (let d = 1; d <= n; d++) {
      const s = `${a}-${dd(m)}-${dd(d)}`, eHoje = s === isoD(hoje);
      g.append(el('button', { class: 'i2-dia' + (eHoje ? ' hoje' : '') + ((new Date(a, m - 1, d).getDay() % 6) ? '' : ' fds'), style: `--d:${d}`, title: 'Abrir a agenda deste dia', onclick: () => (KM.agenda && KM.agenda.irDia ? KM.agenda.irDia(s) : abrirApp('reuniao')) },
        String(d), reun.has(s) || tar.has(s) ? el('span', { class: 'i2-pts' }, reun.has(s) ? el('i', { class: 'r' }) : null, tar.has(s) ? el('i', { class: 't' }) : null) : null));
    }
    card.append(g, el('div', { class: 'i2-mes' }, el('button', { onclick: () => { mesCal = isoD(new Date(a, m - 2, 1)).slice(0, 7); renderCalendario(); } }, '–'), el('b', {}, MESES[m - 1]), el('button', { onclick: () => { mesCal = isoD(new Date(a, m, 1)).slice(0, 7); renderCalendario(); } }, '–')),
      el('div', { class: 'i2-leg' }, el('span', {}, el('i', { class: 'r' }), 'reunião'), el('span', {}, el('i', { class: 't' }), 'tarefa')));
    const N = numeros(), caixa = A().estado ? A().estado.caixa : 0;
    box.append(card, el('div', { class: 'i2-pilha' }, el('i'), el('i')),
      el('footer', { class: 'i2-rodape-verde' }, el('div', {}, el('small', {}, `${dd(hoje.getDate())} ${MESES[hoje.getMonth()].slice(0, 3)} ${hoje.getFullYear()}`), el('b', {}, DIAS[hoje.getDay()]),
        el('span', {}, `${N.hoje.reunioes} reuni${N.hoje.reunioes === 1 ? 'ão' : 'ões'}  /  ${N.hoje.tarefas} tarefa${N.hoje.tarefas === 1 ? '' : 's'}${caixa ? '  /  caixa ' + brl0(caixa) : ''}`)),
        el('div', { class: 'i2-icone', html: '<svg viewBox="0 0 64 64"><rect x="8" y="38" width="9" height="18" rx="2"/><rect x="22" y="28" width="9" height="28" rx="2"/><rect x="36" y="18" width="9" height="38" rx="2"/><path d="M46 14 L58 4 M50 4 H58 V12" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>' })));
  }
  function resumoEscritorio() {
    const ps = Object.values(A().estado.pessoas || {}), trab = ps.filter(p => p.trabalhando || p.tarefaRH).length;
    return { txt: `${ps.length} pessoas · ${trab} trabalhando`, ticker: `🏢 ${trab} trabalhando agora` };
  }
  function relogio() { const h = $('#iniHora'); if (h) h.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  function animar() {
    raf = 0;
    const ini = $('#inicio'); if (!ini || ini.hidden) return;
    relogio();
    raf = setTimeout(animar, 15000);
  }

  // ------------------------------------------------------------------ navegação
  function fecharTudo() {
    for (const id of ['#inicio', '#appView']) { const x = $(id); if (x) x.hidden = true; }
    document.body.classList.remove('inicio-aberto', 'app-aberto');
    if (atual && apps[atual] && apps[atual].sair) try { apps[atual].sair(); } catch (e) { /* ok */ }
    atual = null; fecharMenu();
  }
  function abrirInicio() {
    montar(); fecharTudo();
    $('#inicio').hidden = false; document.body.classList.add('inicio-aberto');
    renderInicio();
    clearTimeout(raf); animar();
    if (location.hash !== '#inicio') history.replaceState(null, '', '#inicio');
  }
  function irEscritorio(aba) {
    fecharTudo();
    A().irPara(aba || 'escritorio');
    if (KM.interagindo) KM.interagindo();
  }
  function abrirApp(id) {
    const ap = apps[id]; if (!ap) return A().toast('Em breve 🙂');
    montar(); fecharTudo();
    atual = id;
    const c = CARTOES[id] || { ic: ap.ic, nome: ap.nome };
    $('#appIc').textContent = c.ic; $('#appNome').textContent = c.nome;
    $('#appAcoes').innerHTML = ''; const corpo = $('#appCorpo'); corpo.innerHTML = ''; corpo.className = 'appv-corpo app-' + id;
    $('#appView').hidden = false; document.body.classList.add('app-aberto');
    history.replaceState(null, '', '#app-' + id);
    try { ap.abrir(corpo, $('#appAcoes')); } catch (e) { console.error(e); corpo.append(el('p', { class: 'vazio' }, '❌ ' + e.message)); }
    corpo.scrollTop = 0;
  }

  // ------------------------------------------------------------------ botão único de menu
  function montarMenu() {
    if ($('#fabKwik')) return;
    const fab = el('button', { id: 'fabKwik', class: 'fab-kwik', title: 'Menu', 'aria-label': 'Abrir o menu', onclick: e => { e.stopPropagation(); alternarMenu(); } },
      el('img', { src: 'assets/kwik-simbolo.svg', alt: '' }), el('span', { class: 'fab-x' }, '×'), el('em', { class: 'fab-badge', id: 'fabBadge', hidden: true }, '0'));
    const pnl = el('div', { id: 'menuKwik', class: 'menu-kwik' });
    document.body.append(pnl, fab);
    document.addEventListener('click', e => { if (!e.target.closest('#menuKwik') && !e.target.closest('#fabKwik')) fecharMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharMenu(); });
    setInterval(atualizarBadge, 2000);
  }
  const clicar = id => () => { const b = document.getElementById(id); if (b) b.click(); };
  function itensMenu() {
    const noEsc = fn => () => { if (atual || !$('#inicio').hidden) irEscritorio(); setTimeout(fn, 60); };
    return [
      ['Ir para', [
        ['🏠', 'Início', abrirInicio], ['🏢', 'Escritório', () => irEscritorio()], ['✨', 'Criar', () => { fecharMenu(); if (KM.criar) KM.criar.abrir(); }], ['✅', 'Tarefas', () => abrirApp('tarefas')], ['🧾', 'Fiscal', () => abrirApp('fiscal')],
        ['👥', 'Folha', () => abrirApp('folha')], ['🗓️', 'Reunião', () => abrirApp('reuniao')], ['🎯', 'Meta', () => abrirApp('meta')], ['📄', 'Relatório', () => abrirApp('relatorio')]]],
      ['No escritório', [
        ['▶️', 'Trabalhar', noEsc(clicar('btTrabalhar')), 'prim'], ['👤', 'Escolher', noEsc(clicar('btSelecionar'))], ['✨', 'Animar', () => mostrarAnimacoes()], ['🎮', 'Jogar', noEsc(clicar('btSalaJogos'))],
        ['📊', 'Apresentação', clicar('btApresentacao')], ['🌃', 'Clientes 3D', noEsc(clicar('btClientesAtalho'))], ['🤝', 'RH', clicar('btRH')], ['📘', 'E-book', clicar('btEbook')], ['🌾', 'Fazendinha', clicar('btFazenda')]]],
      ['Telas', [
        ['📋', 'Tarefas da equipe', () => irEscritorio('tarefas'), '', () => (KM.tarefasPendentes ? KM.tarefasPendentes() : 0)], ['📑', 'Relatórios', () => irEscritorio('relatorios')],
        ['👥', 'Equipe', () => irEscritorio('equipe')], ['🎨', 'Visual', () => irEscritorio('personalizar')], ['⚙️', 'Config.', () => irEscritorio('config')]]],
    ];
  }
  function renderMenu(sub) {
    const p = $('#menuKwik'); p.innerHTML = '';
    if (sub === 'anim') {
      p.append(el('div', { class: 'mk-cab' }, el('button', { class: 'mk-volta', onclick: e => { e.stopPropagation(); renderMenu(); } }, '‹ Voltar'), el('b', {}, '✨ Animações')));
      const g = el('div', { class: 'mk-anims' });
      for (const b of document.querySelectorAll('#menuAnim [data-anim]')) g.append(el('button', { class: 'mk-anim', onclick: () => { fecharMenu(); if (atual || !$('#inicio').hidden) irEscritorio(); setTimeout(() => b.click(), 80); } }, b.textContent));
      p.append(g); return;
    }
    for (const [tit, its] of itensMenu()) {
      p.append(el('h4', {}, tit));
      const g = el('div', { class: 'mk-grade' });
      for (const [ic, nome, fn, cls, badge] of its) {
        if (nome === 'E-book' && !document.getElementById('btEbook')) continue;
        if (nome === 'Fazendinha' && !document.getElementById('btFazenda')) continue;
        const n = badge ? badge() : 0;
        g.append(el('button', { class: 'mk-it ' + (cls || ''), onclick: e => { e.stopPropagation(); if (nome !== 'Animar') fecharMenu(); fn(); } }, el('span', { class: 'mk-ic' }, ic), el('small', {}, nome), n ? el('em', {}, String(n)) : null));
      }
      p.append(g);
    }
  }
  function mostrarAnimacoes() { renderMenu('anim'); }
  function alternarMenu() { const p = $('#menuKwik'); if (p.classList.contains('on')) return fecharMenu(); renderMenu(); p.classList.add('on'); $('#fabKwik').classList.add('on'); KM.tocar && KM.tocar('clique'); }
  function fecharMenu() { const p = $('#menuKwik'); if (p) p.classList.remove('on'); const f = $('#fabKwik'); if (f) f.classList.remove('on'); }
  function atualizarBadge() {
    const b = $('#fabBadge'); if (!b) return;
    const n = (KM.tarefasPendentes ? KM.tarefasPendentes() : 0);
    b.hidden = !n; b.textContent = n;
  }

  // ------------------------------------------------------------------ Clara pequenininha com balão (usada pelas Tarefas)
  function claraMini(texto, alvoCanto = true) {
    const f = (A().cfg().funcionarios || []).find(x => x.funcao === 'checklist'); if (!f) return;
    let box = $('#claraMini');
    if (box) box.remove();
    const cv = el('canvas', { width: 30, height: 46 });
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    let t0 = performance.now();
    const desenhar = () => {
      if (!cv.isConnected) return;
      const k = Math.floor((performance.now() - t0) / 250);
      g.clearRect(0, 0, 30, 46);
      g.drawImage(KM.sprite(KM.aparenciaDe(A().cfg(), f.id), { bracos: k % 8 < 4 ? 'aceno' : 'baixo', aceno: k % 2, boca: 'sorriso', piscar: k % 14 === 0 }), 0, 0);
      setTimeout(desenhar, 250);
    };
    box = el('div', { id: 'claraMini', class: 'clara-mini entra' }, el('div', { class: 'clara-balao' }, texto), cv);
    box.addEventListener('click', () => { const r = KM.tarefasApp && KM.tarefasApp.falaResumo ? KM.tarefasApp.falaResumo() : ''; if (r) falarClara(r); });
    document.body.append(box); desenhar();
    if (alvoCanto) setTimeout(() => { box.classList.remove('entra'); box.classList.add('canto'); setTimeout(() => { const b = box.querySelector('.clara-balao'); if (b) b.classList.add('some'); }, 2600); }, 1900);
    return box;
  }
  function falarClara(texto) {
    const box = $('#claraMini'); if (!box) return claraMini(texto);
    const b = box.querySelector('.clara-balao'); b.textContent = texto; b.classList.remove('some');
    clearTimeout(falarClara._t); falarClara._t = setTimeout(() => b.classList.add('some'), 4200);
  }

  // ------------------------------------------------------------------ início do app
  function iniciar() {
    montar();
    const h = location.hash.slice(1);
    if (h.startsWith('app-') && apps[h.slice(4)]) abrirApp(h.slice(4));
    else if (h === 'inicio' || ((A().cfg().opcoes || {}).inicio !== false && (!h || h === 'escritorio'))) abrirInicio();
  }
  KM.inicio = { fechar: fecharTudo, iniciar, registrar, abrirInicio, abrirApp, irEscritorio, claraMini, falarClara, fecharMenu, renderInicio, atual: () => atual };
})();
