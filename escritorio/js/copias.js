/* KWIK Mini Escritório · cópias de segurança: para os dados nunca se perderem.
   Onde ficam (sozinhas, sem você fazer nada):
     1) neste aparelho (IndexedDB): uma cópia a cada mudança importante, no máximo uma a cada 10 min, e sempre que
        alguma lista diminuir; ficam as 60 mais novas;
     2) no PC: o servidor guarda uma cópia antes de gravar (pasta dados/copias), uma por dia por 6 meses;
     3) no GitHub (celular): cada versão da configuração fica no histórico do repositório privado.
   Alerta: se uma lista grande some de repente (ex.: os clientes zeram), aparece um aviso com o botão Restaurar.
   Em ⚙️ Config → 🛟 Cópias de segurança: ver as cópias, restaurar tudo ou só uma parte (ex.: só os clientes),
   baixar uma cópia completa (.json) e restaurar a partir de um arquivo. Antes de restaurar, a situação atual também
   vira uma cópia (dá para desfazer). */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const el = (...a) => A().el(...a);
  const $ = s => document.querySelector(s);
  // partes que dá para restaurar separadamente
  const PARTES = {
    clientes: ['🏢', 'Clientes (META e Configurações)', ['clientes', 'clientesInfo', 'meta', 'metaHist']],
    checklist: ['✅', 'Tarefas e prancheta da Clara', ['checklist', 'tarefasListas', 'foco']],
    reunioes: ['🗓️', 'Reuniões', ['reunioes']],
    equipe: ['👥', 'Equipe (funcionários, RH, tarefas da equipe)', ['funcionarios', 'tarefas', 'rhLog', 'setoresRep']],
    fiscal: ['🧾', 'Checklist do mês e guias anexadas', ['obrigacoes', 'anexos']],
    escritorio: ['🎨', 'Visual do escritório', ['escritorio']],
    outros: ['📦', 'O resto (execução, criações, contatos, marketing, opções…)', null],
  };
  const conta = c => {
    if (!c || typeof c !== 'object') return {};
    const n = k => (Array.isArray(c[k]) ? c[k].length : 0);
    return { clientes: n('clientes'), checklist: n('checklist'), reunioes: n('reunioes'), tarefas: n('tarefas'), funcionarios: n('funcionarios'), execucao: n('execucao'),
      anexos: c.anexos && typeof c.anexos === 'object' ? Object.values(c.anexos).reduce((s, v) => s + ((v && v.length) || 0), 0) : 0 };
  };
  const NOMES = { clientes: 'clientes', checklist: 'tarefas', reunioes: 'reuniões', tarefas: 'tarefas da equipe', funcionarios: 'funcionários', execucao: 'atividades', anexos: 'anexos', tarefasListas: 'listas', criacoes: 'criações' };
  const quandoTxt = q => new Date(q).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const resumoTxt = r => Object.entries(r || {}).filter(([, v]) => v).map(([k, v]) => `${v} ${NOMES[k] || k}`).join(' · ') || 'vazia';

  // ------------------------------------------------------------------ cópias neste aparelho (IndexedDB)
  function db() { return new Promise((res, rej) => { const r = indexedDB.open('kwik-copias', 1); r.onupgradeneeded = () => r.result.createObjectStore('c', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
  async function todas() { const d = await db(); return new Promise(res => { const q = d.transaction('c').objectStore('c').getAll(); q.onsuccess = () => res((q.result || []).sort((a, b) => b.id.localeCompare(a.id))); q.onerror = () => res([]); }); }
  async function gravar(item) { const d = await db(); return new Promise(res => { const tx = d.transaction('c', 'readwrite'); tx.objectStore('c').put(item); tx.oncomplete = res; tx.onerror = res; }); }
  async function tirar(id) { const d = await db(); return new Promise(res => { const tx = d.transaction('c', 'readwrite'); tx.objectStore('c').delete(id); tx.oncomplete = res; tx.onerror = res; }); }
  let ultima = null, ultimaEm = 0, fila = Promise.resolve();
  function guardar(cfg, motivo, forcar) {
    fila = fila.then(async () => {
      try {
        const r = conta(cfg);
        if (!ultima) { const l = await todas(); ultima = l[0] || null; ultimaEm = ultima ? new Date(ultima.quando).getTime() : 0; }
        const antes = ultima ? ultima.resumo : {};
        const diminuiu = Object.keys(antes).filter(k => (r[k] || 0) < antes[k]);
        if (!forcar && !diminuiu.length && Date.now() - ultimaEm < 10 * 60000) return;
        if (!cfg.funcionarios || !cfg.funcionarios.length) return; // nunca guarda uma configuração vazia por cima
        const item = { id: new Date().toISOString(), quando: new Date().toISOString(), motivo: motivo || (diminuiu.length ? 'depois de diminuir (a cópia anterior tem os dados): ' + diminuiu.map(k => `${NOMES[k]} ${antes[k]}→${r[k] || 0}`).join(', ') : 'cópia automática'), resumo: r, dados: JSON.parse(JSON.stringify(cfg)) };
        await gravar(item); ultima = item; ultimaEm = Date.now();
        const l = await todas(); for (const x of l.slice(60)) await tirar(x.id);
      } catch (e) { console.warn('cópia de segurança', e); }
    });
    return fila;
  }
  // chamado em cada "salvar" do app: guarda e avisa se alguma lista sumiu de repente
  function aoSalvar(cfg) {
    const antes = ultima ? ultima.resumo : null, r = conta(cfg);
    if (antes) {
      const sumiu = Object.keys(antes).filter(k => antes[k] >= 2 && ((r[k] || 0) === 0 || (antes[k] - (r[k] || 0) >= 3 && (r[k] || 0) < antes[k] * 0.5)));
      if (sumiu.length && !aoSalvar.avisado) {
        aoSalvar.avisado = true; setTimeout(() => { aoSalvar.avisado = false; }, 60000);
        A().toast(`🛟 Atenção: ${sumiu.map(k => `${NOMES[k]} (${antes[k]} → ${r[k] || 0})`).join(', ')}. Se não foi você, restaure a cópia de ${quandoTxt(ultima.quando)}.`, { botao: ['Restaurar', () => abrir()], ms: 20000, erro: true });
      }
    }
    guardar(cfg);
  }

  // ------------------------------------------------------------------ restaurar
  function aplicar(dados, partes) {
    const atual = A().cfg();
    guardar(atual, 'antes de restaurar uma cópia', true);
    const novo = JSON.parse(JSON.stringify(dados));
    if (partes.includes('tudo')) { A().restaurarConfig(novo); return; }
    const conhecidas = new Set(Object.values(PARTES).flatMap(p => p[2] || []));
    for (const p of partes) {
      const ks = PARTES[p][2] || Object.keys(novo).filter(k => !conhecidas.has(k) && k !== 'salvoEm' && k !== 'versao');
      for (const k of ks) if (novo[k] !== undefined) atual[k] = novo[k];
    }
    A().restaurarConfig(atual);
  }
  async function perguntarPartes(dados, origem) {
    const r = conta(dados), ra = conta(A().cfg());
    return new Promise(res => {
      let d = document.getElementById('dlgCopiaPartes'); if (!d) { d = el('dialog', { id: 'dlgCopiaPartes', class: 'cp-dlg' }); document.body.append(d); }
      d.innerHTML = '';
      const chks = {};
      const linhas = Object.entries(PARTES).map(([k, [ic, n, ks]]) => {
        const c = el('input', { type: 'checkbox', checked: k === 'clientes' || k === 'checklist' || k === 'reunioes' });
        chks[k] = c;
        const det = ks && ks[0] && (r[ks[0]] != null) ? ` · na cópia: ${r[ks[0]]} · agora: ${ra[ks[0]] || 0}` : '';
        return el('label', { class: 'cp-parte' }, c, el('span', {}, `${ic} ${n}`), el('small', {}, det));
      });
      const tudo = el('input', { type: 'checkbox', onchange: e => Object.values(chks).forEach(c => { c.checked = e.target.checked; c.disabled = e.target.checked; }) });
      let val = null;
      d.append(el('div', { class: 'dlg-topo' }, el('h2', {}, '🛟 Restaurar a cópia'), el('button', { type: 'button', onclick: () => d.close() }, '×')),
        el('div', { class: 'dlg-corpo' },
          el('p', { class: 'sub', style: 'margin-top:0' }, `Cópia ${origem}: ${resumoTxt(r)}. O que você quer trazer de volta? O resto continua como está agora.`),
          el('div', { class: 'cp-partes' }, linhas), el('label', { class: 'cp-parte tudo' }, tudo, el('span', {}, '♻️ Tudo (a configuração inteira volta a ser a da cópia)')),
          el('p', { class: 'vazio' }, 'Antes de restaurar, a situação de agora vira uma cópia: dá para desfazer.'),
          el('button', { class: 'bt prim', onclick: () => { val = tudo.checked ? ['tudo'] : Object.keys(chks).filter(k => chks[k].checked); res(val.length ? val : null); d.close(); } }, '🛟 Restaurar')));
      d.onclose = () => res(val && val.length ? val : null);
      d.showModal();
    });
  }
  async function restaurar(dados, origem) {
    if (!dados || !dados.funcionarios) return A().toast('Essa cópia está vazia ou inválida.', { erro: true });
    const partes = await perguntarPartes(dados, origem); if (!partes) return;
    aplicar(dados, partes);
    A().toast(`🛟 Restaurado: ${partes.includes('tudo') ? 'tudo' : partes.map(p => PARTES[p][1].split(' (')[0]).join(', ')}.`, { ms: 8000 });
    KM.tocar && KM.tocar('sucesso');
    renderLista();
  }

  // ------------------------------------------------------------------ baixar e importar
  async function baixar() {
    const cfg = A().cfg();
    let relatorios = A().estado.relatorios || [];
    const pacote = { app: 'KWIK Mini Escritório', tipo: 'copia-completa', criadoEm: new Date().toISOString(), config: cfg, relatorios };
    const blob = new Blob([JSON.stringify(pacote, null, 1)], { type: 'application/json' });
    const nome = `KWIK Mini Escritorio - copia ${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}.json`;
    const a = el('a', { href: URL.createObjectURL(blob), download: nome }); document.body.append(a); a.click(); a.remove();
    const c = A().cfg(); c.ultimaCopiaBaixada = new Date().toISOString(); A().salvar();
    A().toast('⬇️ Cópia completa baixada. Guarde num lugar seguro (Google Drive, pendrive, e-mail).', { ms: 8000 });
  }
  function importar() {
    const inp = el('input', { type: 'file', accept: '.json,application/json' });
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      try { const j = JSON.parse(await f.text()); await restaurar(j.config || j, `do arquivo ${f.name}`); }
      catch (e) { A().toast('Não consegui ler esse arquivo: ' + e.message, { erro: true }); }
    };
    inp.click();
  }

  // ------------------------------------------------------------------ tela
  function abrir() {
    let d = document.getElementById('dlgCopias'); if (!d) { d = el('dialog', { id: 'dlgCopias', class: 'cp-dlg' }); document.body.append(d); }
    d.innerHTML = '';
    d.append(el('div', { class: 'dlg-topo' }, el('h2', {}, '🛟 Cópias de segurança'), el('button', { type: 'button', onclick: () => d.close() }, '×')),
      el('div', { class: 'dlg-corpo' },
        el('p', { class: 'sub', style: 'margin-top:0' }, 'Tudo o que você coloca no app é salvo sozinho, com cópias guardadas em mais de um lugar. Se algum dado sumir, escolha uma cópia e restaure tudo ou só a parte que precisar.'),
        el('div', { class: 'cp-bts' }, el('button', { class: 'bt prim', onclick: baixar }, '⬇️ Baixar cópia completa'), el('button', { class: 'bt', onclick: importar }, '⬆️ Restaurar de um arquivo'),
          el('button', { class: 'bt', onclick: async () => { await guardar(A().cfg(), 'cópia feita por você', true); A().toast('🛟 Cópia guardada neste aparelho'); renderLista(); } }, '📸 Guardar cópia agora')),
        el('div', { id: 'cpLista' }, el('p', { class: 'vazio' }, 'Carregando as cópias…'))));
    if (!d.open) d.showModal();
    renderLista();
  }
  async function renderLista() {
    const box = document.getElementById('cpLista'); if (!box) return;
    const grupos = [];
    try { grupos.push(['📱 Neste aparelho', (await todas()).map(c => ({ id: c.id, quando: c.quando, motivo: c.motivo, resumo: c.resumo, dados: c.dados, origem: 'aparelho' }))]); } catch (e) { grupos.push(['📱 Neste aparelho', []]); }
    const BK = A().BK && A().BK();
    if (BK && BK.copias && A().online && A().online()) {
      try { grupos.push([BK.nome === 'local' ? '💻 No PC (pasta dados/copias)' : '☁️ No GitHub (histórico de todas as versões)', await BK.copias()]); }
      catch (e) { grupos.push([BK.nome === 'local' ? '💻 No PC' : '☁️ No GitHub', [], e.message]); }
    }
    box.innerHTML = '';
    for (const [tit, l, erro] of grupos) {
      box.append(el('h3', { class: 'cp-tit' }, tit, el('small', {}, l.length ? ` · ${l.length} cópia${l.length > 1 ? 's' : ''}` : '')));
      if (erro) box.append(el('p', { class: 'vazio' }, '⚠️ ' + erro));
      else if (!l.length) box.append(el('p', { class: 'vazio' }, BK && BK.nome === 'local' && tit.startsWith('💻') ? 'Ainda não há cópias (a primeira sai na próxima mudança). Se o servidor for antigo, abra de novo o ABRIR-ESCRITORIO.bat.' : 'Ainda não há cópias.'));
      const ul = el('div', { class: 'cp-lista' });
      for (const c of l.slice(0, 40)) {
        ul.append(el('div', { class: 'cp-item' }, el('div', {}, el('b', {}, quandoTxt(c.quando)), el('small', {}, [c.resumo ? resumoTxt(c.resumo) : '', c.motivo && !/Personaliza/.test(c.motivo) ? c.motivo : ''].filter(Boolean).join(' · '))),
          el('button', { class: 'bt peq', onclick: async e => {
            const bt = e.currentTarget; bt.disabled = true;
            try { const dados = c.dados || await BK.copia(c.id); await restaurar(dados, `de ${quandoTxt(c.quando)}`); }
            catch (er) { A().toast('Não consegui abrir essa cópia: ' + er.message, { erro: true }); }
            bt.disabled = false;
          } }, 'Restaurar')));
      }
      box.append(ul);
    }
    const ub = A().cfg().ultimaCopiaBaixada;
    box.append(el('p', { class: 'vazio' }, ub ? `Última cópia completa baixada: ${quandoTxt(ub)}.` : 'Dica: de vez em quando baixe uma cópia completa e guarde fora do computador.'));
  }
  // primeira cópia logo que o app abre (depois de carregar os dados)
  setTimeout(() => { try { if (A() && A().cfg) guardar(A().cfg(), 'ao abrir o app'); } catch (e) { /* ok */ } }, 8000);
  KM.copias = { aoSalvar, guardar, abrir, baixar, importar, restaurar, todas, conta };
})();
