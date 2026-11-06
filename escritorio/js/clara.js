/* KWIK Mini Escritório · Clara: prancheta de tarefas com prazos e lembretes.
   As tarefas ficam em cfg.checklist (salvas no PC ou no GitHub, junto da configuração).
   Lembretes: dentro do app (balão + aviso), notificação do navegador e, no celular conectado
   ao GitHub, notificação push enviada pela Action "Lembretes da Clara" (lembretes.py). */
(function () {
  const KM = window.KM;
  const $ = s => document.querySelector(s);
  const A = () => KM.app;
  const lista = () => A().cfg().checklist || (A().cfg().checklist = []);
  const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const diasAte = data => Math.round((new Date(data + 'T12:00:00') - new Date(hojeISO() + 'T12:00:00')) / 86400000);
  const fmtData = d => d ? d.split('-').reverse().slice(0, 2).join('/') : '';

  function situacao(t) {
    if (t.feita) return { cls: 'feita', txt: 'Feita ✓' };
    if (!t.data) return { cls: 'sem', txt: 'Sem prazo' };
    const n = diasAte(t.data);
    if (n < 0) return { cls: 'atrasada', txt: n === -1 ? 'Venceu ontem' : `Atrasada ${-n} dias` };
    if (n === 0) return { cls: 'hoje', txt: 'Vence hoje' };
    if (n === 1) return { cls: 'amanha', txt: 'Vence amanhã' };
    if (n <= 3) return { cls: 'perto', txt: `Em ${n} dias` };
    return { cls: 'longe', txt: `Em ${n} dias` };
  }

  function resumo() {
    const pend = lista().filter(t => !t.feita);
    const grupo = c => pend.filter(t => situacao(t).cls === c);
    return { pend, atrasadas: grupo('atrasada'), hoje: grupo('hoje'), amanha: grupo('amanha'), perto: grupo('perto') };
  }

  // ------------------------------------------------------------------ prancheta (diálogo)
  let filtro = 'pendentes', mudancas = 0, pessoa = null, funcionario = null;
  function abrir() {
    render();
    $('#dlgPrancheta').showModal();
    setTimeout(() => $('#tarefaTexto').focus(), 50);
  }
  function render() {
    const { el } = A();
    const r = resumo();
    const chips = $('#pranchetaResumo'); chips.innerHTML = '';
    const chip = (cls, txt) => chips.append(el('span', { class: 'pchip ' + cls }, txt));
    chip('pend', `${r.pend.length} pendente${r.pend.length === 1 ? '' : 's'}`);
    if (r.atrasadas.length) chip('atrasada', `${r.atrasadas.length} atrasada${r.atrasadas.length === 1 ? '' : 's'}`);
    if (r.hoje.length) chip('hoje', `${r.hoje.length} para hoje`);
    if (r.amanha.length) chip('amanha', `${r.amanha.length} para amanhã`);
    const ul = $('#listaTarefas'); ul.innerHTML = '';
    const ordem = { atrasada: 0, hoje: 1, amanha: 2, perto: 3, longe: 4, sem: 5, feita: 6 };
    const itens = lista().filter(t => filtro === 'todas' || (filtro === 'feitas' ? t.feita : !t.feita))
      .sort((a, b) => ordem[situacao(a).cls] - ordem[situacao(b).cls] || (a.data || '9').localeCompare(b.data || '9') || (a.hora || '').localeCompare(b.hora || ''));
    if (!itens.length) ul.append(el('li', { class: 'vazio-p' }, filtro === 'feitas' ? 'Nada concluído ainda.' : 'Nenhuma tarefa pendente. 🎉 Escreva uma acima!'));
    for (const t of itens) {
      const s = situacao(t);
      ul.append(el('li', { class: 'tarefa ' + s.cls },
        el('label', { class: 'marca' }, el('input', { type: 'checkbox', checked: t.feita, onchange: e => marcar(t, e.target.checked) }), el('span')),
        el('div', { class: 'tt' }, el('b', {}, t.texto), el('small', {}, (t.data ? `📅 ${fmtData(t.data)}${t.hora ? ' · ' + t.hora : ''} · ` : '') + s.txt)),
        el('button', { class: 'apagar', title: 'Apagar', onclick: () => apagar(t) }, '✕')));
    }
    document.querySelectorAll('#pranchetaFiltro button').forEach(b => b.classList.toggle('on', b.dataset.f === filtro));
    const btN = $('#btNotificar');
    const perm = 'Notification' in window ? Notification.permission : 'indisponivel';
    btN.textContent = perm === 'granted' ? '🔔 Notificações ativadas' : '🔔 Ativar notificações';
    btN.classList.toggle('ok', perm === 'granted');
  }
  function adicionar(e) {
    e.preventDefault();
    const texto = $('#tarefaTexto').value.trim();
    if (!texto) return;
    lista().push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), texto: texto.slice(0, 140), data: $('#tarefaData').value || '', hora: $('#tarefaHora').value || '', feita: false, criadaEm: new Date().toISOString() });
    $('#tarefaTexto').value = ''; $('#tarefaHora').value = '';
    mudancas++; A().salvar(); render(); KM.tocar('clique');
    if (pessoa) A().falar(pessoa.id, 'Anotado! ✍️', 1500);
    $('#tarefaTexto').focus();
  }
  function marcar(t, feita) {
    t.feita = feita; t.feitaEm = feita ? new Date().toISOString() : null;
    mudancas++; A().salvar(); render();
    if (feita) {
      KM.tocar('sucesso');
      if (pessoa) A().falar(pessoa.id, ['Mandou bem! ✅', 'Uma a menos! 💪', 'Riscada da lista! ✨'][Math.floor(Math.random() * 3)], 1800);
      KM.emitir('estrela', 6, { x: KM.W / 2, y: 60, dx: 40, dy: 20, vy: -20, vida: 0.8, cor: '#ffd93b' });
    }
  }
  function apagar(t) {
    if (!confirm(`Apagar a tarefa "${t.texto}"?`)) return;
    const l = lista(), i = l.indexOf(t); if (i >= 0) l.splice(i, 1);
    mudancas++; A().salvar(); render();
  }

  async function fechou() {
    const p = pessoa, f = funcionario;
    pessoa = null; funcionario = null;
    if (!p) return;
    p.prop = null; p.trabalhando = false; A().estado.trabalhoDe.checklist = false; A().atualizarBotoes();
    const r = resumo();
    A().falar(p.id, r.pend.length ? `Fechado! ${r.pend.length} tarefa${r.pend.length === 1 ? '' : 's'} na lista. Eu te lembro 📋` : 'Tudo em dia! 🎉', 2800);
    if (mudancas > 0) await A().concluir(f, p);
    mudancas = 0;
    verificar('fechou');
  }

  // Botão Trabalhar da Clara: ela pega a prancheta e abre a lista.
  async function trabalhar(f, p) {
    if (pessoa) return abrir();
    await A().esperarLivre(p, 1500);
    if (p.modo !== 'sentado') await KM.voltarSentar(p);
    pessoa = p; funcionario = f; mudancas = 0;
    p.trabalhando = true; p.prop = 'prancheta'; A().estado.trabalhoDe.checklist = true;
    A().pagar(f, p);
    A().falar(p.id, 'Prancheta na mão! Escreva suas tarefas e os dias 📋', 2600);
    A().atualizarBotoes();
    setTimeout(abrir, 500);
  }

  // ------------------------------------------------------------------ lembretes
  const CHAVE_AVISOS = 'kwik-mini-avisos';
  function jaAvisou(chave) {
    let m = {}; try { m = JSON.parse(localStorage.getItem(CHAVE_AVISOS) || '{}'); } catch (e) { m = {}; }
    if (m[chave]) return true;
    m[chave] = hojeISO();
    for (const [k, v] of Object.entries(m)) if (diasAte(v) < -10) delete m[k];
    localStorage.setItem(CHAVE_AVISOS, JSON.stringify(m));
    return false;
  }
  async function notificarSistema(titulo, corpo) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      if (reg) reg.showNotification(titulo, { body: corpo, icon: 'assets/icone-192.png', badge: 'assets/icone-192.png', tag: 'clara-' + titulo });
      else new Notification(titulo, { body: corpo, icon: 'assets/icone-192.png' });
    } catch (e) { /* sem notificação */ }
  }
  const nomes = ts => ts.slice(0, 3).map(t => t.texto).join(', ') + (ts.length > 3 ? ` e mais ${ts.length - 3}` : '');

  function verificar(origem) {
    const r = resumo(), d = hojeISO(), avisos = [];
    if (r.atrasadas.length && !jaAvisou('atrasadas|' + d)) avisos.push(['⚠️ Tarefas atrasadas', `${r.atrasadas.length} atrasada${r.atrasadas.length > 1 ? 's' : ''}: ${nomes(r.atrasadas)}`]);
    if (r.hoje.length && !jaAvisou('hoje|' + d + '|' + (new Date().getHours() < 13 ? 'm' : 't'))) avisos.push(['⏰ Vence hoje', nomes(r.hoje)]);
    if (r.amanha.length && !jaAvisou('amanha|' + d)) avisos.push(['📅 Vence amanhã', nomes(r.amanha)]);
    if (r.perto.length && !jaAvisou('perto|' + d)) avisos.push(['🔜 Prazo chegando', nomes(r.perto)]);
    if (!avisos.length && r.pend.length && origem === 'inicio' && !jaAvisou('pendentes|' + d)) avisos.push(['📋 Tarefas pendentes', `Você tem ${r.pend.length} tarefa${r.pend.length > 1 ? 's' : ''} para cumprir.`]);
    if (!avisos.length) return;
    const clara = Object.values(A().estado.pessoas).find(p => p.funcao === 'checklist');
    if (clara) {
      A().falar(clara.id, `${avisos[0][0]}: ${avisos[0][1]}`, 5000);
      if (!clara.acao && !clara.trabalhando) { clara.prop = 'prancheta'; setTimeout(() => { if (!clara.trabalhando) clara.prop = null; }, 4500); }
    }
    KM.tocar('notif');
    const nomeC = ((A().cfg().funcionarios.find(x => x.funcao === 'checklist') || {}).nome || 'Prancheta').split(' ')[0];
    A().toast(`📋 ${nomeC}: ${avisos.map(a => a[0]).join(' · ')}`, { botao: ['Abrir prancheta', abrirComClara], ms: 9000 });
    if (document.hidden || origem === 'inicio') avisos.forEach(([t, c]) => notificarSistema(nomeC + ' · ' + t.replace(/^\S+\s/, ''), c));
  }
  function abrirComClara() {
    const f = A().cfg().funcionarios.find(x => x.funcao === 'checklist');
    if (!f) return;
    A().estado.selecionado = null;
    const p = A().estado.pessoas[f.id];
    if (pessoa) return abrir();
    trabalhar(f, p);
  }

  // ------------------------------------------------------------------ notificações (permissão + push)
  function chaveParaBytes(b64) {
    const pad = '='.repeat((4 - b64.length % 4) % 4), s = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(s, c => c.charCodeAt(0));
  }
  async function ativarNotificacoes() {
    if (!('Notification' in window)) return A().toast('Este navegador não mostra notificações. No iPhone, adicione o app à Tela de Início e abra por lá.', { erro: true, ms: 8000 });
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { render(); return A().toast('Sem permissão para notificar. Dá para liberar nas configurações do navegador.', { erro: true, ms: 7000 }); }
    A().cfg().opcoes.notificacoes = true; A().salvar(); render();
    const BK = A().BK();
    const temPush = BK && BK.nome === 'github' && A().online() && 'serviceWorker' in navigator && 'PushManager' in window;
    if (!temPush) {
      notificarSistema('KWIK · Notificações ativadas', 'Com o app aberto eu aviso dos prazos, reuniões e respostas da pesquisa. 🔔');
      return A().toast('🔔 Ativado! Com o app aberto chegam os avisos de prazos, reuniões e pesquisas.');
    }
    try {
      const chave = await BK.lerTexto('nuvem/push-publica.txt');
      if (!chave) {
        await BK.pedirTestePush({ id: 'preparar-' + Date.now(), preparar: true });
        return A().toast('⏳ Preparando as notificações no GitHub. Toque em "Ativar notificações" de novo daqui a 1 minuto.', { ms: 9000 });
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaBytes(chave.trim()) });
      await BK.salvarInscricao(sub.toJSON(), navigator.userAgent.includes('iPhone') ? 'iPhone' : navigator.platform || 'aparelho');
      await BK.pedirTestePush({ id: 'teste-' + Date.now(), endpoint: sub.endpoint });
      A().toast('🔔 Pronto! Em 1 minuto chega uma notificação de teste. Depois chegam os avisos de prazos, reuniões e respostas da pesquisa.', { ms: 10000 });
    } catch (e) {
      A().toast('Não consegui ativar o push: ' + e.message, { erro: true, ms: 9000 });
    }
  }

  // ------------------------------------------------------------------ rotina: Clara confere a prancheta
  async function rotina() {
    for (;;) {
      await KM.esperar(70000 + Math.random() * 50000);
      const clara = Object.values(A().estado.pessoas || {}).find(p => p.funcao === 'checklist');
      if (!clara || clara.acao || clara.trabalhando || clara.dormindo || clara.modo !== 'sentado' || A().estado.sala === 'jogos') continue;
      const r = resumo();
      clara.prop = 'prancheta';
      A().falar(clara.id, r.atrasadas.length ? `Opa, ${r.atrasadas.length} atrasada${r.atrasadas.length > 1 ? 's' : ''}! 😬` : r.hoje.length ? `Hoje vence: ${r.hoje[0].texto}` : r.pend.length ? `${r.pend.length} tarefa${r.pend.length > 1 ? 's' : ''} na lista 📋` : 'Prancheta em dia! ✨', 3200);
      await KM.esperar(3800);
      if (!clara.trabalhando) clara.prop = null;
    }
  }

  KM.clara = {
    trabalhar, resumo, verificar, ativarNotificacoes, notificarSistema,
    iniciar() {
      $('#formTarefa').addEventListener('submit', adicionar);
      $('#dlgPrancheta').addEventListener('close', fechou);
      $('#btNotificar').addEventListener('click', ativarNotificacoes);
      document.querySelectorAll('#pranchetaFiltro button').forEach(b => b.addEventListener('click', () => { filtro = b.dataset.f; render(); }));
      $('#tarefaData').value = hojeISO();
      setTimeout(() => verificar('inicio'), 6000);
      setInterval(() => verificar('periodico'), 10 * 60 * 1000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(() => verificar('voltou'), 1500); });
      rotina();
    },
  };
})();
