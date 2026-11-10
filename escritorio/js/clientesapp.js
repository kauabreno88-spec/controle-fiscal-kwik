/* KWIK Mini Escritório · apps "Fiscal" e "Folha" da tela inicial, organizados por CLIENTE.
   1º a lista de clientes (cartões com o que importa: vencidos, checklist do mês, pessoas, anexos);
   2º tocando no cliente: abas Checklist do mês · Guias (ou Funcionários) · Lançar · Anexos · Ficha do cliente.
   Os dados vêm do KWIK Fiscal / KWIK Folha (os mesmos do setor no escritório; gravar continua igual).
   Anexos: com o token do GitHub, os arquivos vão para o repositório PRIVADO do escritório (nuvem/anexos/…) e abrem em
   qualquer aparelho; sem token, ficam guardados só neste aparelho (IndexedDB). A lista dos anexos fica em cfg.anexos. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const S = () => KM.setores;
  const el = (...a) => A().el(...a);
  const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const tam = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const CATS = ['Guia / DAS / DARF', 'Nota fiscal', 'Extrato', 'Contrato', 'Documento pessoal', 'Folha / holerite', 'Certificado', 'Outro'];

  // ------------------------------------------------------------------ anexos
  const chaveAnexo = (setor, emp) => `${setor}:${emp}`;
  const anexosDe = (setor, emp) => { const c = A().cfg(); c.anexos = c.anexos || {}; return c.anexos[chaveAnexo(setor, emp)] = c.anexos[chaveAnexo(setor, emp)] || []; };
  function ghConf() {
    const g = KM.backends.github.conf();
    let token = g.token;
    if (!token) for (const k of ['fiscal', 'folha']) { try { token = S().conf(k).token; } catch (e) { /* ok */ } if (token) break; }
    return { repo: g.repo || KM.backends.github.REPO_PADRAO, branch: g.branch || 'main', token };
  }
  function idb() {
    return new Promise((res, rej) => { const r = indexedDB.open('kwik-anexos', 1); r.onupgradeneeded = () => r.result.createObjectStore('arq'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  }
  async function idbPor(id, blob) { const db = await idb(); return new Promise((res, rej) => { const tx = db.transaction('arq', 'readwrite'); tx.objectStore('arq').put(blob, id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
  async function idbPegar(id) { const db = await idb(); return new Promise((res, rej) => { const q = db.transaction('arq').objectStore('arq').get(id); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
  async function idbTirar(id) { const db = await idb(); return new Promise(res => { const tx = db.transaction('arq', 'readwrite'); tx.objectStore('arq').delete(id); tx.oncomplete = res; tx.onerror = res; }); }
  const b64 = buf => { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
  const nomeSeguro = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(-80);
  async function enviar(setor, emp, arq, cat) {
    if (arq.size > 20 * 1048576) throw new Error(`${arq.name}: maior que 20 MB`);
    const a = { id: uid(), nome: arq.name, tipo: arq.type || '', tam: arq.size, cat, quando: new Date().toISOString(), onde: 'local' };
    const g = ghConf();
    if (g.token) {
      const caminho = `nuvem/anexos/${setor}/${nomeSeguro(emp)}/${a.id}-${nomeSeguro(arq.name)}`;
      try {
        const r = await fetch(`https://api.github.com/repos/${g.repo}/contents/${caminho}`, { method: 'PUT', headers: { Authorization: 'Bearer ' + g.token, Accept: 'application/vnd.github+json' },
          body: JSON.stringify({ message: `Anexo: ${arq.name}`, content: b64(await arq.arrayBuffer()), branch: g.branch }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.message || r.status);
        Object.assign(a, { onde: 'github', caminho, sha: j.content && j.content.sha });
      } catch (e) { console.warn('anexo no GitHub falhou, guardando no aparelho', e); A().toast(`☁️ Não deu para enviar ao GitHub (${e.message}). Guardei ${arq.name} neste aparelho.`, { ms: 8000 }); }
    }
    if (a.onde === 'local') await idbPor(a.id, arq);
    anexosDe(setor, emp).unshift(a);
    A().salvar(true);
    return a;
  }
  async function pegar(a) {
    if (a.onde === 'local') { const b = await idbPegar(a.id); if (!b) throw new Error('o arquivo foi guardado em outro aparelho'); return b; }
    const g = ghConf(); if (!g.token) throw new Error('conecte o GitHub para abrir este anexo');
    const r = await fetch(`https://api.github.com/repos/${g.repo}/contents/${a.caminho}?ref=${g.branch}`, { headers: { Authorization: 'Bearer ' + g.token, Accept: 'application/vnd.github.raw' } });
    if (!r.ok) throw new Error('GitHub ' + r.status);
    return new Blob([await r.arrayBuffer()], { type: a.tipo || 'application/octet-stream' });
  }
  async function tirar(setor, emp, a) {
    if (a.onde === 'local') await idbTirar(a.id);
    else {
      const g = ghConf();
      if (g.token) try {
        let sha = a.sha;
        if (!sha) { const r = await fetch(`https://api.github.com/repos/${g.repo}/contents/${a.caminho}?ref=${g.branch}`, { headers: { Authorization: 'Bearer ' + g.token } }); sha = (await r.json()).sha; }
        await fetch(`https://api.github.com/repos/${g.repo}/contents/${a.caminho}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + g.token, Accept: 'application/vnd.github+json' }, body: JSON.stringify({ message: `Apaga anexo: ${a.nome}`, sha, branch: g.branch }) });
      } catch (e) { /* segue: tira da lista */ }
    }
    const l = anexosDe(setor, emp), i = l.indexOf(a); if (i >= 0) l.splice(i, 1);
    A().salvar(true);
  }
  const icone = a => /pdf/.test(a.tipo) || /\.pdf$/i.test(a.nome) ? '📕' : /image/.test(a.tipo) ? '🖼️' : /sheet|excel|csv|\.xls/i.test(a.tipo + a.nome) ? '📊' : /word|\.doc/i.test(a.tipo + a.nome) ? '📘' : /xml/.test(a.tipo + a.nome) ? '🧾' : /zip|rar/.test(a.tipo + a.nome) ? '🗜️' : '📄';
  function telaAnexos(box, setor, emp, re) {
    const l = anexosDe(setor, emp), g = ghConf();
    const inp = el('input', { type: 'file', multiple: true, hidden: true });
    const cat = el('select', {}, CATS.map(c => el('option', {}, c)));
    const status = el('small', { class: 'cx-status' });
    const zona = el('label', { class: 'cx-zona' }, el('span', { class: 'cx-zona-ic' }, '📎'), el('b', {}, 'Arraste os arquivos aqui ou toque para escolher'),
      el('small', {}, `PDF, imagens, planilhas, XML… até 20 MB cada · ${g.token ? '☁️ vão para o repositório privado do escritório (abrem em qualquer aparelho)' : '📱 ficam guardados neste aparelho (conecte o GitHub para abrir em todos)'}`), inp);
    const mandar = async arqs => {
      if (!arqs.length) return;
      let ok = 0;
      for (const [i, f] of arqs.entries()) {
        status.textContent = `Enviando ${i + 1} de ${arqs.length}: ${f.name}…`;
        try { await enviar(setor, emp, f, cat.value); ok++; } catch (e) { A().toast('❌ ' + e.message, { erro: true }); }
      }
      status.textContent = ''; if (ok) { A().toast(`📎 ${ok} anexo${ok > 1 ? 's' : ''} guardado${ok > 1 ? 's' : ''}`); KM.tocar && KM.tocar('sucesso'); }
      re();
    };
    inp.addEventListener('change', () => mandar([...inp.files]));
    zona.addEventListener('dragover', e => { e.preventDefault(); zona.classList.add('alvo'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('alvo'));
    zona.addEventListener('drop', e => { e.preventDefault(); zona.classList.remove('alvo'); mandar([...e.dataTransfer.files]); });
    box.append(el('div', { class: 'cx-anexar' }, el('label', { class: 'cx-cat' }, 'Tipo: ', cat), zona, status));
    if (!l.length) { box.append(el('p', { class: 'vazio' }, 'Nenhum anexo ainda.')); return; }
    const filtro = el('div', { class: 'cx-afil' });
    const cats = [...new Set(l.map(a => a.cat).filter(Boolean))];
    let fc = '';
    const ul = el('div', { class: 'cx-anexos' });
    const pintar = () => {
      ul.innerHTML = '';
      for (const a of l.filter(x => !fc || x.cat === fc)) ul.append(el('div', { class: 'cx-anexo' }, el('span', { class: 'cx-aic' }, icone(a)),
        el('div', {}, el('b', {}, a.nome), el('small', {}, [a.cat, tam(a.tam), new Date(a.quando).toLocaleDateString('pt-BR'), a.onde === 'github' ? '☁️ GitHub' : '📱 este aparelho'].filter(Boolean).join(' · '))),
        el('button', { class: 'bt peq', onclick: async e => { const bt = e.currentTarget; bt.disabled = true; try { const b = await pegar(a); const u = URL.createObjectURL(b); if (/pdf|image|text/.test(b.type)) window.open(u, '_blank'); else { const x = el('a', { href: u, download: a.nome }); document.body.append(x); x.click(); x.remove(); } setTimeout(() => URL.revokeObjectURL(u), 60000); } catch (err) { A().toast('❌ ' + err.message, { erro: true }); } bt.disabled = false; } }, 'Abrir'),
        el('button', { class: 'bt peq perigo', title: 'Apagar', onclick: async () => { if (!confirm(`Apagar o anexo "${a.nome}"?`)) return; await tirar(setor, emp, a); re(); } }, '🗑')));
    };
    if (cats.length > 1) { filtro.append(el('button', { class: 'chip-f on', onclick: e => { fc = ''; filtro.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === e.currentTarget)); pintar(); } }, 'Todos'));
      for (const c of cats) filtro.append(el('button', { class: 'chip-f', onclick: e => { fc = c; filtro.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === e.currentTarget)); pintar(); } }, c)); box.append(filtro); }
    box.append(ul); pintar();
  }

  // ------------------------------------------------------------------ app por cliente
  function criar(setor) {
    const st = { emp: null, aba: 'check', busca: '' };
    const F = { fiscal: { ic: '🧾', abas: [['check', '✅ Checklist do mês'], ['ver', '🧾 Guias'], ['add', '＋ Lançar guia'], ['anexos', '📎 Anexos'], ['ficha', '🏢 Ficha']] },
      folha: { ic: '👥', abas: [['check', '✅ Checklist do mês'], ['ver', '👥 Funcionários e fechamento'], ['add', '＋ Funcionário'], ['anexos', '📎 Anexos'], ['ficha', '🏢 Ficha']] } }[setor];
    let corpo = null;
    async function abrir(c, acoes) {
      corpo = c; st.emp = null;
      acoes.append(el('button', { class: 'appv-bt', onclick: async () => { try { await S().carregar(setor, true); A().toast('🔄 Atualizado'); } catch (e) { A().toast(e.message, { erro: true }); } render(); } }, '🔄 Atualizar'));
      corpo.append(el('p', { class: 'vazio' }, 'Carregando os clientes…'));
      try { await S().carregar(setor); } catch (e) { corpo.innerHTML = ''; corpo.append(el('div', { class: 'cx-vazio' }, el('p', {}, e.semDados ? `Conecte o ${S().FONTES[setor].nome} para ver os clientes.` : '❌ ' + e.message), el('button', { class: 'bt prim', onclick: () => S().pedirToken(setor) }, '🔗 Conectar'))); return; }
      render();
    }
    function sair() { S().soltar(); corpo = null; }
    function render() {
      if (!corpo || !corpo.isConnected) return;
      const y = corpo.scrollTop;
      corpo.innerHTML = '';
      const c = S().dados(setor); if (!c) return;
      if (st.emp) detalhe(c); else listaClientes(c);
      corpo.scrollTop = y;
    }
    function infoEmp(c, e) {
      const db = c.db, out = { nome: S().nomeEmp(e) };
      if (setor === 'fiscal') { const r = S().resumoFiscal(db).porEmp.find(x => x.e.id === e.id); Object.assign(out, { vencido: r ? r.vencido : 0, qVencido: r ? r.qVencido : 0, aVencer: r ? r.aVencer : 0, abertos: r ? r.abertos.length : 0 }); }
      else { const r = S().resumoFolha(db).porEmp.find(x => x.e.id === e.id); Object.assign(out, { ativos: r ? r.ativos : 0, feitas: r ? r.feitas : 0, total: r ? r.total : 0, folha: r ? r.folha : 0, exp: r ? r.exp.length : 0 }); }
      if (KM.obrigacoes) { const g = KM.obrigacoes.montar(setor, db, new Date().toISOString().slice(0, 7)).find(x => x.emp === e.id); if (g) { const its = g.itens.filter(i => !i.info); out.chk = [its.filter(i => i.ok).length, its.length]; out.atras = its.filter(i => !i.ok && i.d < new Date().toISOString().slice(0, 10)).length; } }
      out.anexos = anexosDe(setor, e.id).length;
      return out;
    }
    function listaClientes(c) {
      const emps = c.db.empresas.filter(e => S().empAtiva(c.db, e)).sort((a, b) => S().nomeEmp(a).localeCompare(S().nomeEmp(b)));
      corpo.append(S().barraOrigem(setor));
      const busca = el('input', { type: 'search', class: 'cx-busca', placeholder: '🔎 Buscar cliente', value: st.busca, oninput: e => { st.busca = e.target.value; pintarCards(); } });
      corpo.append(el('div', { class: 'cx-topo' }, el('h2', {}, `${F.ic} ${emps.length} cliente${emps.length === 1 ? '' : 's'}`), busca));
      const grade = el('div', { class: 'cx-grade' }); corpo.append(grade);
      const pintarCards = () => {
        grade.innerHTML = '';
        const q = st.busca.toLowerCase();
        for (const e of emps.filter(x => !q || (S().nomeEmp(x) + ' ' + (x.cnpj || '')).toLowerCase().includes(q))) {
          const i = infoEmp(c, e), pct = i.chk && i.chk[1] ? Math.round(i.chk[0] / i.chk[1] * 100) : 0;
          const linhas = setor === 'fiscal'
            ? [i.qVencido ? ['🔴', `${i.qVencido} guia${i.qVencido > 1 ? 's' : ''} vencida${i.qVencido > 1 ? 's' : ''} · ${brl(i.vencido)}`, 'mal'] : ['🟢', 'Impostos em dia', 'bem'], ['⏳', `${brl(i.aVencer)} a vencer`, '']]
            : [['👥', `${i.ativos} pessoa${i.ativos === 1 ? '' : 's'} · ${brl(i.folha)}/mês`, ''], [i.feitas === i.total ? '✅' : '🟡', `Fechamento ${i.feitas}/${i.total}`, i.feitas === i.total ? 'bem' : '']];
          grade.append(el('button', { class: 'cx-card', onclick: () => { st.emp = e.id; st.aba = 'check'; st.pintada = null; render(); } },
            el('div', { class: 'cx-card-cab' }, el('span', { class: 'cx-av' }, i.nome.slice(0, 1).toUpperCase()), el('div', {}, el('b', {}, i.nome), el('small', {}, [e.regime, e.cnpj].filter(Boolean).join(' · ')))),
            el('ul', {}, linhas.map(([ic, t, cl]) => el('li', { class: cl }, ic + ' ' + t))),
            i.chk ? el('div', { class: 'cx-prog' }, el('div', {}, el('i', { style: `width:${pct}%` })), el('small', {}, `Checklist do mês ${i.chk[0]}/${i.chk[1]}${i.atras ? ` · 🔴 ${i.atras} atrasado${i.atras > 1 ? 's' : ''}` : ''}`)) : null,
            el('span', { class: 'cx-anx' }, `📎 ${i.anexos}`)));
        }
        if (!grade.childElementCount) grade.append(el('p', { class: 'vazio' }, 'Nenhum cliente encontrado.'));
      };
      pintarCards();
    }
    function detalhe(c) {
      const e = c.db.empresas.find(x => x.id === st.emp); if (!e) { st.emp = null; return render(); }
      const i = infoEmp(c, e);
      // se o setor mudou de aba sozinho (ex.: "＋ Lançar guia desta empresa"), acompanha
      const abaSetor = S().abaAtual(); if (st.pintada && abaSetor !== st.pintada && ['ver', 'add', 'check'].includes(abaSetor)) st.aba = abaSetor;
      st.pintada = null;
      corpo.append(el('div', { class: 'cx-det-cab' }, el('button', { class: 'bt peq', onclick: () => { st.emp = null; S().soltar(); render(); } }, '‹ Clientes'),
        el('span', { class: 'cx-av g' }, i.nome.slice(0, 1).toUpperCase()), el('div', {}, el('h2', {}, i.nome), el('small', {}, [e.regime, e.cnpj, e.responsavel].filter(Boolean).join(' · ')))));
      const tiles = setor === 'fiscal' ? [[brl(i.vencido), `vencido (${i.qVencido})`, i.qVencido ? 'mal' : 'bem'], [brl(i.aVencer), 'a vencer', ''], [i.chk ? `${i.chk[0]}/${i.chk[1]}` : '—', 'checklist do mês', i.atras ? 'mal' : ''], [String(i.anexos), 'anexos', '']]
        : [[String(i.ativos), 'pessoas', ''], [brl(i.folha), 'folha/mês', ''], [`${i.feitas}/${i.total}`, 'fechamento', i.feitas === i.total ? 'bem' : 'mal'], [String(i.anexos), 'anexos', '']];
      corpo.append(el('div', { class: 'cx-tiles' }, tiles.map(([v, t, cl]) => el('div', { class: cl }, el('b', {}, v), el('small', {}, t)))));
      corpo.append(el('div', { class: 'cx-abas' }, F.abas.map(([k, n]) => el('button', { class: st.aba === k ? 'on' : '', onclick: () => { st.aba = k; render(); } }, n))));
      const box = el('div', { class: 'cx-corpo' }); corpo.append(box);
      if (st.aba === 'anexos') { S().soltar(); telaAnexos(box, setor, e.id, render); }
      else if (st.aba === 'ficha') {
        S().soltar();
        const cl = (() => { try { return KM.clientesFora.lista().find(x => (setor === 'fiscal' ? x.fiscalId : x.folhaId) === e.id); } catch (er) { return null; } })();
        if (cl && KM.clientesFora.renderInfo) { try { KM.clientesFora.montarDlg(); KM.clientesFora.montarCena(true); } catch (er) { /* ok */ } KM.clientesFora.renderInfo(cl, true, box); }
        else box.append(el('p', { class: 'vazio' }, 'Ficha indisponível para este cliente.'));
      } else { S().pintar(box, setor, st.aba, e.id, render); st.pintada = st.aba; }
    }
    function resumo() {
      const c = S().dados(setor); if (!c) return { txt: 'Toque para conectar' };
      if (setor === 'fiscal') { const r = S().resumoFiscal(c.db); return { txt: r.qVencido ? `🔴 ${r.qVencido} guias vencidas` : '🟢 Impostos em dia', alerta: !!r.qVencido, ticker: `🧾 ${r.porEmp.length} clientes no Fiscal${r.qVencido ? ` · ${r.qVencido} guias vencidas` : ''}` }; }
      const r = S().resumoFolha(c.db); return { txt: `${r.ativos} pessoas · ${r.fechadas}/${r.porEmp.length} folhas fechadas`, alerta: r.fechadas < r.porEmp.length, ticker: `👥 ${r.ativos} pessoas nas folhas` };
    }
    return { abrir, sair, resumo };
  }
  KM.inicio.registrar('fiscal', criar('fiscal'));
  KM.inicio.registrar('folha', criar('folha'));
  KM.anexos = { anexosDe, enviar, pegar, tirar };
  // carrega os dados em segundo plano para os números da tela inicial
  setTimeout(() => { for (const k of ['fiscal', 'folha']) S().carregar(k).then(() => { if (!document.getElementById('inicio')?.hidden) KM.inicio.renderInicio(); }).catch(() => {}); }, 2500);
})();
