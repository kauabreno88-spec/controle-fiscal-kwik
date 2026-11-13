/* KWIK Mini Escritório · Obsidian conectado (só no PC: o servidor local lê e grava os arquivos .md do vault).
   Dois apps na tela inicial:
   - 📇 Informações de clientes: as notas de clientes do Obsidian (tag #cliente ou pasta "Clientes"), com tudo o que está
     ligado a cada um (notas relacionadas, pastas de arquivos, tarefas abertas). Anotar, editar ou criar um cliente aqui
     grava na hora no arquivo do Obsidian; o que você muda no Obsidian aparece aqui sozinho (confere a cada 5 s).
   - 📓 Obsidian: o vault inteiro (pastas, busca, tarefas "- [ ]" abertas, editadas recentemente).
   Segurança dos dados: o servidor guarda a versão anterior de cada nota antes de gravar (dados/copias-obsidian), nunca
   grava nota vazia por cima e recusa gravar se a nota mudou no Obsidian depois que foi aberta aqui (aí você escolhe).
   Senhas escritas nas notas aparecem borradas: toque para mostrar. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const el = (...a) => A().el(...a);
  const toast = (m, o) => A().toast(m, o);

  // ------------------------------------------------------------------ servidor
  async function api(met, url, corpo) {
    const r = await fetch(url, { method: met, cache: 'no-store', headers: corpo ? { 'Content-Type': 'application/json', 'X-Kwik': '1' } : {}, body: corpo ? JSON.stringify(corpo) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.erro || 'Erro ' + r.status); e.status = r.status; e.dados = j; throw e; }
    return j;
  }
  const q = o => Object.entries(o).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
  const urlArquivo = c => '/api/obsidian/arquivo?' + q({ c });

  // ------------------------------------------------------------------ índice do vault
  const S = { notas: [], porC: new Map(), porNome: new Map(), anexos: [], vault: '', carregadoEm: 0, assinatura: '', erro: '' };
  const semAcento = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const nomeDe = c => c.split('/').pop().replace(/\.md$/i, '');
  async function carregar(forcar) {
    if (!KM.ehPC) throw Object.assign(new Error('O Obsidian fica no seu PC'), { status: 0 });
    if (!forcar && Date.now() - S.carregadoEm < 4000 && S.notas.length) return false;
    const j = await api('GET', '/api/obsidian/indice');
    const ass = j.notas.map(n => n.c + n.m).join('|');
    const mudou = ass !== S.assinatura;
    S.vault = j.vault; S.anexos = j.anexos || []; S.carregadoEm = Date.now(); S.assinatura = ass; S.erro = '';
    if (mudou) {
      S.notas = j.notas; S.porC = new Map(j.notas.map(n => [n.c, n])); S.porNome = new Map();
      for (const n of j.notas) { const k = semAcento(n.t); if (!S.porNome.has(k)) S.porNome.set(k, []); S.porNome.get(k).push(n); }
      S.back = null;
    }
    return mudou;
  }
  // [[alvo]] -> nota (aceita caminho "pasta/nota" ou só o nome, como o Obsidian)
  function resolver(alvo) {
    alvo = String(alvo || '').trim().replace(/\.md$/i, ''); if (!alvo) return null;
    if (alvo.includes('/')) { const c = alvo + '.md'; return S.porC.get(c) || S.notas.find(n => n.c.endsWith('/' + c)) || null; }
    const l = S.porNome.get(semAcento(alvo)); return l ? l[0] : null;
  }
  function backlinks(n) {
    if (!S.back) {
      S.back = new Map();
      for (const o of S.notas) for (const l of o.links || []) { const r = resolver(l); if (r && r !== o) { if (!S.back.has(r.c)) S.back.set(r.c, new Set()); S.back.get(r.c).add(o); } }
    }
    return [...(S.back.get(n.c) || [])];
  }
  const ehMapa = n => (n.tags || []).some(t => /^(mapa|moc)$/i.test(t));
  const ehCliente = n => !ehMapa(n) && ((n.tags || []).some(t => /^clientes?$/i.test(t)) || /(^|\/)Clientes\/[^/]+\.md$/i.test(n.c));
  const clientes = () => S.notas.filter(ehCliente).sort((a, b) => a.t.localeCompare(b.t, 'pt-BR'));
  const RE_DOC = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/;
  const tipoCliente = n => RE_DOC.test(n.resumo || '') || RE_DOC.test(JSON.stringify(n.props || {})) || /ltda|eireli|\bme\b|clinica|clínica|estetica|estética|transporte|empresa/i.test(n.t) ? 'empresa' : 'pessoa';
  const PALAVRAS_FRACAS = new Set('cliente clientes calculo igreja pastor pastora presidente associacao irmao irma tio tia mae pai dias servicos estetica geral modelo modelos reuniao notas nota'.split(' '));
  const fichas = s => semAcento(s).replace(/[^a-z0-9 ]+/g, ' ').split(' ').filter(w => w.length >= 4 && !PALAVRAS_FRACAS.has(w));
  function relacionadas(n) {
    const set = new Map();
    for (const l of n.links || []) { const r = resolver(l); if (r && r !== n && !ehMapa(r)) set.set(r.c, { n: r, por: 'citada na nota' }); }
    for (const b of backlinks(n)) if (!ehMapa(b) && !set.has(b.c)) set.set(b.c, { n: b, por: 'cita este cliente' });
    const f = fichas(n.t);
    if (f.length) for (const o of S.notas) if (o !== n && !ehMapa(o) && !set.has(o.c) && fichas(o.t).some(w => f.includes(w))) set.set(o.c, { n: o, por: 'mesmo nome' });
    return [...set.values()].sort((a, b) => b.n.m.localeCompare(a.n.m));
  }
  // cliente do escritório (cfg.clientes / KWIK Fiscal) -> nota do Obsidian
  function acharCliente(nome) {
    const f = fichas(nome); if (!f.length || !S.notas.length) return null;
    let melhor = null, pts = 0;
    for (const n of clientes()) { const g = fichas(n.t); const p = g.filter(w => f.includes(w)).length + (g[0] === f[0] ? 1 : 0); if (p > pts) { pts = p; melhor = n; } }
    return pts >= 2 || (pts >= 1 && f.length === 1) ? melhor : null;
  }
  const noMeta = n => { const f = fichas(n.t); return (A().cfg().clientes || []).find(c => { const g = fichas(c.nome); return g.length && f.length && (g[0] === f[0] || g.filter(w => f.includes(w)).length >= 2); }); };

  // ------------------------------------------------------------------ texto da nota
  function frontmatter(txt) {
    if (!txt.startsWith('---\n')) return [{}, 0];
    const fim = txt.indexOf('\n---', 4); if (fim < 0) return [{}, 0];
    const props = {}; let chave = null;
    for (const ln of txt.slice(4, fim).split('\n')) {
      if (!ln.trim()) continue;
      const m = /^([^\s:#-][^:]*):\s*(.*)$/.exec(ln);
      if (m && !/^\s/.test(ln)) { chave = m[1].trim(); props[chave] = m[2].trim().replace(/^["']|["']$/g, '') || []; }
      else if (chave && /^\s*- /.test(ln)) { if (!Array.isArray(props[chave])) props[chave] = props[chave] ? [props[chave]] : []; props[chave].push(ln.trim().slice(2).trim().replace(/^["']|["']$/g, '')); }
    }
    return [props, txt.slice(0, fim + 4).split('\n').length];
  }
  const sensivel = (k, v) => /senha|password|gov|token/i.test(k + ' ' + v);
  // só a senha em si fica borrada (a palavra logo depois de "senha:"), não a frase inteira
  const RE_SENHA = /(\bsenha\b\s*[:=-]?\s*)([^\s*_]+)/gi, PALAVRA_COMUM = /^(em|da|do|de|dos|das|no|na|e|ou|para|pra|com|que|gov\.?br|do\.?gov)$/i;
  const mascarar = s => String(s || '').replace(RE_SENHA, (t, a, b) => (PALAVRA_COMUM.test(b) ? t : a + '••••'));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const IMG = /\.(png|jpe?g|gif|webp|svg|bmp)$/i;
  function embed(a) {
    const nome = a.split('/').pop();
    if (IMG.test(nome)) return `<img class="ob-img" loading="lazy" alt="${esc(nome)}" src="${esc(urlArquivo(acharArquivo(a)))}">`;
    if (/\.\w{2,5}$/.test(nome) && !/\.md$/i.test(nome)) return `<a class="ob-arq" href="${esc(urlArquivo(acharArquivo(a)))}" target="_blank" rel="noopener">📎 ${esc(nome)}</a>`;
    const r = resolver(a); return `<a class="ob-link${r ? '' : ' quebrado'}" data-c="${esc(r ? r.c : '')}" data-alvo="${esc(a)}">↪ ${esc(nome)}</a>`;
  }
  function acharArquivo(a) { return (S.anexos || []).find(x => x === a || x.endsWith('/' + a)) || a; }
  function inline(s) {
    const ph = []; const put = h => '\u0001' + (ph.push(h) - 1) + '\u0001';
    s = s.replace(RE_SENHA, (t, a, b) => (PALAVRA_COMUM.test(b) ? t : a + put(`<span class="ob-oculto" title="Toque para mostrar">${esc(b)}</span>`)));
    s = s.replace(/`([^`]+)`/g, (_, x) => put('<code>' + esc(x) + '</code>'));
    s = s.replace(/!\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g, (_, a) => put(embed(a.trim())));
    s = s.replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_, a, al) => { a = a.trim(); const r = resolver(a); return put(`<a class="ob-link${r ? '' : ' quebrado'}" data-c="${esc(r ? r.c : '')}" data-alvo="${esc(a)}">${esc((al || a.split('/').pop()).trim())}</a>`); });
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => put(`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`));
    s = s.replace(/https?:\/\/[^\s<>()]+/g, u => put(`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.length > 50 ? u.slice(0, 47) + '…' : u)}</a>`));
    s = esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/==(.+?)==/g, '<mark>$1</mark>')
      .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<i>$2</i>').replace(/~~(.+?)~~/g, '<s>$1</s>')
      .replace(/(^|\s)#([A-Za-zÀ-ÿ0-9_][\wÀ-ÿ/-]*)/g, '$1<span class="ob-tag">#$2</span>');
    return s.replace(/\u0001(\d+)\u0001/g, (_, i) => ph[i]);
  }
  function md(txt) {
    const L = txt.split('\n'); const [, ini] = frontmatter(txt);
    const out = []; let para = [], i = ini;
    const fecha = () => { if (para.length) out.push('<p>' + para.join('<br>') + '</p>'); para = []; };
    while (i < L.length) {
      const ln = L[i];
      if (/^\s*```/.test(ln)) { fecha(); const cod = []; i++; while (i < L.length && !/^\s*```/.test(L[i])) cod.push(L[i++]); out.push('<pre>' + esc(cod.join('\n')) + '</pre>'); i++; continue; }
      if (!ln.trim()) { fecha(); i++; continue; }
      let m;
      if ((m = /^(#{1,6})\s+(.*)$/.exec(ln))) { fecha(); const n = Math.min(m[1].length + 1, 6); out.push(`<h${n}>${inline(m[2])}</h${n}>`); i++; continue; }
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(ln)) { fecha(); out.push('<hr>'); i++; continue; }
      if (/^\s*\|/.test(ln)) {
        fecha(); const rows = []; while (i < L.length && /^\s*\|/.test(L[i])) rows.push(L[i++]);
        const cel = r => r.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(x => inline(x.trim().replace(/\\\|/g, '|')));
        const corpo = rows.filter((r, k) => !(k === 1 && /^[\s|:-]+$/.test(r)));
        out.push('<div class="ob-tabwrap"><table class="ob-tab">' + corpo.map((r, k) => '<tr>' + cel(r).map(c => k === 0 && rows.length > 1 && /^[\s|:-]+$/.test(rows[1]) ? `<th>${c}</th>` : `<td>${c}</td>`).join('') + '</tr>').join('') + '</table></div>');
        continue;
      }
      if (/^\s*>/.test(ln)) {
        fecha(); const bl = []; while (i < L.length && /^\s*>/.test(L[i])) bl.push(L[i++].replace(/^\s*>\s?/, ''));
        const c = /^\[!(\w+)\][-+]?\s*(.*)$/.exec(bl[0] || '');
        if (c) out.push(`<div class="ob-callout ob-c-${esc(c[1].toLowerCase())}"><b>${inline(c[2] || c[1])}</b>${bl.slice(1).map(x => inline(x)).join('<br>')}</div>`);
        else out.push('<blockquote>' + bl.map(x => inline(x)).join('<br>') + '</blockquote>');
        continue;
      }
      if ((m = /^(\s*)([-*+]|\d+[.)])\s+(?:\[([ xX])\]\s+)?(.*)$/.exec(ln))) {
        fecha(); const nivel = Math.floor(m[1].replace(/\t/g, '    ').length / 2);
        const marca = m[3] !== undefined ? `<input type="checkbox" class="ob-chk" data-linha="${i}"${m[3] !== ' ' ? ' checked' : ''}>` : `<span class="ob-bol">${/\d/.test(m[2]) ? esc(m[2]) : '•'}</span>`;
        out.push(`<div class="ob-li${m[3] && m[3] !== ' ' ? ' feita' : ''}" style="--n:${Math.min(nivel, 6)}">${marca}<span>${inline(m[4])}</span></div>`);
        i++; continue;
      }
      para.push(inline(ln)); i++;
    }
    fecha();
    return out.join('') || '<p class="ob-vazio">Nota sem texto ainda. Use “Anotar” ou “Editar”.</p>';
  }
  const hojeBR = () => new Date().toLocaleDateString('pt-BR');
  const isoHoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function inserirAnotacao(txt, linha) {
    const nova = `- ${hojeBR()}: ${linha.trim()}`;
    const [, ini] = frontmatter(txt); const L = txt.split('\n');
    for (let k = Math.max(ini, 1); k < L.length - 1; k++) if (/^\s*-{3,}\s*$/.test(L[k]) && /^#{1,6} .*conex/i.test(semAcento(L[k + 1] || ''))) {
      let a = k; while (a > ini && !L[a - 1].trim()) a--;
      return [...L.slice(0, a), nova, '', ...L.slice(k)].join('\n');
    }
    return txt.replace(/\s*$/, '') + '\n' + nova + '\n';
  }
  const quandoTxt = m => { const d = new Date(Number(BigInt(m) / 1000000n)); const h = new Date(); return d.toDateString() === h.toDateString() ? 'hoje ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('pt-BR', { dateStyle: 'short' }); };
  const linkObsidian = c => `obsidian://open?vault=${encodeURIComponent(S.vault)}&file=${encodeURIComponent(c.replace(/\.md$/i, ''))}`;

  // ------------------------------------------------------------------ visualizador / editor de uma nota
  // Uma nota aberta: mostra propriedades, texto formatado (caixinhas clicáveis, links entre notas), "Anotar" rápido
  // e "Editar" (texto completo, salva sozinho 1,5 s depois de parar de digitar).
  let aberta = null; // { c, texto, m, sujo, box, editando }
  async function abrirNota(box, c, opc = {}) {
    if (aberta && aberta.sujo) await salvarAberta();
    box.innerHTML = '<p class="ob-carrega">Abrindo a nota…</p>';
    let j; try { j = await api('GET', '/api/obsidian/nota?' + q({ c })); } catch (e) { box.innerHTML = ''; box.append(el('p', { class: 'ob-vazio' }, '❌ ' + e.message)); return; }
    aberta = { c: j.c, t: j.t, texto: j.texto, m: j.m, gravavel: j.gravavel, sujo: false, box, editando: !!opc.editar, opc };
    pintarNota();
  }
  function pintarNota() {
    const N = aberta; if (!N) return; const box = N.box; box.innerHTML = '';
    const [props] = frontmatter(N.texto); const n = S.porC.get(N.c) || { tags: [] };
    const pasta = N.c.split('/').slice(0, -1).join(' › ');
    box.append(el('div', { class: 'ob-nota-cab' },
      el('div', {}, N.opc.voltar ? el('button', { class: 'ob-volta', onclick: N.opc.voltar }, '‹ ' + (N.opc.voltarTxt || 'Voltar')) : null, el('h2', {}, N.t), el('small', {}, pasta || S.vault)),
      el('div', { class: 'ob-nota-bts' },
        N.editando ? el('button', { class: 'bt peq prim', onclick: async () => { await salvarAberta(); N.editando = false; pintarNota(); } }, '✓ Concluir')
          : el('button', { class: 'bt peq', disabled: !N.gravavel, onclick: () => { N.editando = true; pintarNota(); } }, '✏️ Editar'),
        el('a', { class: 'bt peq', href: linkObsidian(N.c), title: 'Abrir esta nota no app do Obsidian' }, '📓 No Obsidian'))));
    box.append(el('div', { class: 'ob-status', id: 'obStatus' }, N.gravavel ? `🔗 Ligada ao arquivo do Obsidian · alterada ${quandoTxt(N.m)}` : '🔒 Esta nota não está em UTF-8: edite no Obsidian'));
    // propriedades
    const pk = Object.entries(props); const tags = (Array.isArray(props.tags) ? props.tags : props.tags ? [props.tags] : n.tags || []);
    if (pk.length || tags.length) {
      const g = el('div', { class: 'ob-props' });
      for (const [k, v] of pk) { if (k === 'tags' || k === 'tag') continue; const val = Array.isArray(v) ? v.join(', ') : String(v); g.append(el('div', { class: 'ob-prop' }, el('small', {}, k), sensivel(k, val) ? el('b', { class: 'ob-oculto', title: 'Toque para mostrar', onclick: e => e.currentTarget.classList.toggle('mostra') }, val || '—') : el('b', {}, val || '—'))); }
      if (tags.length) g.append(el('div', { class: 'ob-prop' }, el('small', {}, 'tags'), el('b', {}, tags.map(t => el('span', { class: 'ob-tag' }, '#' + t)))));
      box.append(g);
    }
    if (N.editando) {
      const ta = el('textarea', { class: 'ob-editor', spellcheck: 'true' }); ta.value = N.texto;
      ta.addEventListener('input', () => { N.texto = ta.value; N.sujo = true; status('✏️ Editando… salva sozinho'); clearTimeout(N._t); N._t = setTimeout(salvarAberta, 1500); });
      box.append(ta, el('p', { class: 'ob-dica' }, 'Dica: é o mesmo texto do Obsidian (Markdown). O que estiver entre as linhas --- do topo são as propriedades.'));
      setTimeout(() => ta.focus(), 30);
      return;
    }
    // anotar rápido
    if (N.gravavel) {
      const inp = el('input', { type: 'text', class: 'ob-anotar-in', placeholder: N.opc.placeholder || 'Anotar algo nesta nota… (entra com a data de hoje)' });
      const ir = async () => { const v = inp.value.trim(); if (!v) return; N.texto = inserirAnotacao(N.texto, v); N.sujo = true; inp.value = ''; await salvarAberta('anotação pelo Mini Escritório'); pintarNota(); toast('📝 Anotado no Obsidian'); };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') ir(); });
      box.append(el('div', { class: 'ob-anotar' }, inp, el('button', { class: 'bt peq prim', onclick: ir }, '＋ Anotar')));
    }
    const corpo = el('div', { class: 'ob-md', html: md(N.texto) });
    corpo.addEventListener('click', e => {
      const a = e.target.closest('.ob-link'); if (a) { e.preventDefault(); if (a.dataset.c) (N.opc.aoLink || (c => abrirNota(N.box, c, { voltar: () => abrirNota(N.box, N.c, N.opc), voltarTxt: N.t })))(a.dataset.c); else toast('Essa nota ainda não existe no Obsidian'); return; }
      const o = e.target.closest('.ob-oculto'); if (o) o.classList.toggle('mostra');
    });
    corpo.addEventListener('change', async e => {
      const ch = e.target.closest('.ob-chk'); if (!ch || !N.gravavel) return;
      const L = N.texto.split('\n'), k = Number(ch.dataset.linha);
      L[k] = L[k].replace(/\[([ xX])\]/, ch.checked ? '[x]' : '[ ]'); N.texto = L.join('\n'); N.sujo = true;
      ch.closest('.ob-li').classList.toggle('feita', ch.checked);
      await salvarAberta(ch.checked ? 'tarefa marcada pelo Mini Escritório' : 'tarefa desmarcada pelo Mini Escritório');
      if (ch.checked) { KM.tocar && KM.tocar('sucesso'); }
    });
    box.append(corpo);
    if (N.opc.depois) N.opc.depois(box);
  }
  function status(t, cls = '') { const s = document.getElementById('obStatus'); if (s) { s.textContent = t; s.className = 'ob-status ' + cls; } }
  async function salvarAberta(motivo, forcar) {
    const N = aberta; if (!N || !N.sujo) return true;
    clearTimeout(N._t);
    if (N.conflito && !forcar) { status('⚠️ Escolha qual versão fica (aviso lá em cima)', 'mal'); return false; }
    try {
      const r = await api('PUT', '/api/obsidian/nota', { c: N.c, texto: N.texto, base: N.m, motivo: motivo || 'edição pelo Mini Escritório', forcar: !!forcar });
      N.m = r.m; N.sujo = false; N.conflito = false; S.carregadoEm = 0;
      status('✓ Salvo no Obsidian ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 'ok');
      return true;
    } catch (e) {
      if (e.status === 409 && e.dados && e.dados.texto != null) { conflito(e.dados); return false; }
      status('⚠️ Não salvou: ' + e.message + ' (seu texto continua aqui)', 'mal'); toast('⚠️ ' + e.message, { erro: true });
      return false;
    }
  }
  // a nota mudou no Obsidian enquanto você editava aqui: nada é jogado fora sem você escolher
  function conflito(d) {
    const N = aberta; if (!N || !N.box.isConnected) return;
    N.conflito = true; N.box.querySelectorAll('.ob-conflito').forEach(x => x.remove());
    const bar = el('div', { class: 'ob-conflito' },
      el('b', {}, '⚠️ Esta nota foi alterada no Obsidian enquanto você mexia aqui.'),
      el('p', {}, 'Escolha qual versão fica. A outra é guardada nas cópias (dados/copias-obsidian), nada se perde.'),
      el('div', {}, el('button', { class: 'bt peq', onclick: () => { N.texto = d.texto; N.m = d.m; N.sujo = false; N.conflito = false; pintarNota(); toast('Ficou a versão do Obsidian'); } }, '📓 Ficar com a do Obsidian'),
        el('button', { class: 'bt peq prim', onclick: async () => { if (await salvarAberta('versão do Mini Escritório escolhida no conflito', true)) pintarNota(); } }, '💾 Ficar com a minha')));
    N.box.prepend(bar);
  }

  // ------------------------------------------------------------------ o app (tela com menu lateral)
  let corpoApp = null, visao = 'clientes', filtro = '', timer = 0, pastaAtual = '', ultimaBusca = '', cacheTar = null, pendente = null;
  const VISOES = {
    clientes: ['👥', 'Todos os clientes'], empresas: ['🏢', 'Empresas'], pessoas: ['👤', 'Pessoas físicas'],
    pastas: ['🗂️', 'Pastas do vault'], busca: ['🔎', 'Buscar em tudo'], tarefas: ['☑️', 'Tarefas abertas'], recentes: ['🕘', 'Editadas recentemente'],
  };
  async function abrirApp(corpo, acoes, inicial) {
    corpoApp = corpo; corpo.classList.add('zf-corpo'); visao = inicial; aberta = null;
    acoes.append(el('button', { class: 'appv-bt', title: 'Ler o Obsidian de novo agora', onclick: () => atualizar(true) }, '🔄'),
      el('button', { class: 'appv-bt prim', onclick: () => { visao = 'clientes'; render(); setTimeout(novoCliente, 30); } }, '＋ Cliente'));
    if (!KM.ehPC) return semPC(corpo);
    corpo.innerHTML = '<p class="ob-carrega" style="padding:24px">📓 Lendo o seu Obsidian…</p>';
    try { await carregar(true); } catch (e) { return semVault(corpo, e); }
    render();
    clearInterval(timer); timer = setInterval(() => atualizar(false), 5000);
    if (pendente) { const c = pendente; pendente = null; abrirCliente(c); }
  }
  function sairApp() { clearInterval(timer); timer = 0; if (aberta && aberta.sujo) salvarAberta(); aberta = null; corpoApp = null; }
  async function atualizar(forcar) {
    if (!corpoApp || !corpoApp.isConnected) return sairApp();
    let mudou = false; try { mudou = await carregar(true); } catch (e) { return; }
    if (forcar) toast('🔄 Obsidian lido de novo');
    if (aberta && aberta.box.isConnected) {
      const n = S.porC.get(aberta.c);
      if (n && n.m !== aberta.m && !aberta.sujo && !aberta.editando) { const opc = aberta.opc; await abrirNota(aberta.box, aberta.c, opc); toast('🔄 Atualizado com o que você mudou no Obsidian'); }
      if (!mudou && !forcar) return;
      pintarLado(); return;
    }
    if (mudou || forcar) { cacheTar = null; render(true); }
  }
  function semPC(corpo) {
    corpo.append(el('div', { class: 'ob-aviso' }, el('h2', {}, '📓 O seu Obsidian fica no PC'),
      el('p', {}, 'As notas do Obsidian estão nos arquivos do seu computador. Para ver e editar as informações dos clientes, abra o Mini Escritório pelo PC (ABRIR-ESCRITORIO.bat).'),
      el('p', {}, 'Tudo o que você anotar lá vai direto para o Obsidian, e o que mudar no Obsidian aparece lá.')));
  }
  function semVault(corpo, e) {
    corpo.innerHTML = '';
    corpo.append(el('div', { class: 'ob-aviso' }, el('h2', {}, '📓 Não consegui abrir o Obsidian'), el('p', {}, e.message),
      e.status === 404 ? el('p', {}, 'Se o seu vault mudou de lugar, abra o servidor com: python servidor.py --vault "C:\\caminho\\do\\vault"') : el('p', {}, 'Feche e abra de novo o ABRIR-ESCRITORIO.bat (o servidor foi atualizado).'),
      el('button', { class: 'bt prim', onclick: () => abrirApp(corpo, document.getElementById('appAcoes') || el('div'), visao) }, 'Tentar de novo')));
  }
  function pintarLado() {
    const lado = corpoApp && corpoApp.querySelector('.zf-lado'); if (!lado) return;
    const cl = clientes(), cont = { clientes: cl.length, empresas: cl.filter(n => tipoCliente(n) === 'empresa').length, pessoas: cl.filter(n => tipoCliente(n) === 'pessoa').length, tarefas: S.notas.reduce((s, n) => s + (n.tarefas || 0), 0) };
    lado.innerHTML = '';
    lado.append(el('div', { class: 'zf-marca' }, el('b', {}, '📓 Obsidian'), el('small', {}, S.vault)));
    const item = k => el('button', { class: 'zf-item' + (visao === k ? ' on' : ''), onclick: () => { visao = k; aberta = null; render(); } }, el('span', {}, VISOES[k][0]), VISOES[k][1], cont[k] != null ? el('em', { class: 'zf-cont' }, String(cont[k])) : null);
    lado.append(el('div', { class: 'zf-sec' }, 'Informações de clientes'), item('clientes'), item('empresas'), item('pessoas'),
      el('div', { class: 'zf-sec' }, 'Todo o Obsidian'), item('pastas'), item('busca'), item('tarefas'), item('recentes'),
      el('div', { class: 'ob-sinc' }, el('i'), `Sincronizado com o Obsidian · ${S.notas.length} notas`, el('small', {}, 'O que você muda aqui vai para o arquivo .md na hora; o que muda no Obsidian aparece aqui em até 5 s.')));
  }
  function render(manterBusca) {
    if (!corpoApp) return;
    const foco = manterBusca && document.activeElement && document.activeElement.classList.contains('zf-busca') ? document.activeElement.selectionStart : null;
    corpoApp.innerHTML = '';
    const lado = el('aside', { class: 'zf-lado ob-lado' }), main = el('main', { class: 'zf-main ob-main' });
    corpoApp.append(el('div', { class: 'zf ob' }, lado, main));
    pintarLado();
    ({ clientes: vClientes, empresas: vClientes, pessoas: vClientes, pastas: vPastas, busca: vBusca, tarefas: vTarefas, recentes: vRecentes }[visao] || vClientes)(main);
    if (foco != null) { const b = main.querySelector('.zf-busca'); if (b) { b.focus(); b.setSelectionRange(foco, foco); } }
  }

  // ---- clientes
  function vClientes(main) {
    let lista = clientes();
    if (visao === 'empresas') lista = lista.filter(n => tipoCliente(n) === 'empresa');
    if (visao === 'pessoas') lista = lista.filter(n => tipoCliente(n) === 'pessoa');
    const busca = el('input', { class: 'zf-busca', type: 'search', placeholder: '🔎 Procurar cliente pelo nome ou pelo que está escrito na nota…', value: filtro });
    const grade = el('div', { class: 'ob-grade' });
    const pintar = () => {
      const f = semAcento(filtro.trim()); grade.innerHTML = '';
      const vis = lista.filter(n => !f || semAcento(n.t + ' ' + (n.resumo || '') + ' ' + JSON.stringify(n.props || {})).includes(f));
      if (!vis.length) grade.append(el('p', { class: 'ob-vazio' }, f ? 'Nenhum cliente com esse texto.' : 'Nenhuma nota de cliente achada. Marque as notas com a tag #cliente no Obsidian ou crie aqui em “＋ Cliente”.'));
      vis.forEach((n, i) => grade.append(cardCliente(n, i)));
    };
    busca.addEventListener('input', () => { filtro = busca.value; pintar(); });
    main.append(el('div', { class: 'zf-topo' }, busca),
      el('div', { class: 'zf-cab' }, el('div', {}, el('h2', {}, VISOES[visao][1]), el('small', {}, `${lista.length} nota(s) de cliente no Obsidian · toque para ver tudo do cliente`)),
        el('button', { class: 'bt prim', onclick: novoCliente }, '＋ Novo cliente')),
      el('div', { id: 'obNovo' }), grade);
    pintar();
  }
  function cardCliente(n, i) {
    const props = Object.entries(n.props || {}).filter(([k]) => !/aliases|cssclasses/i.test(k)).slice(0, 4);
    const rel = relacionadas(n).length, meta = noMeta(n), tipo = tipoCliente(n);
    return el('button', { class: 'ob-card', style: `--i:${Math.min(i, 20)}`, onclick: () => abrirCliente(n.c) },
      el('div', { class: 'ob-card-top' }, el('span', { class: 'ob-av ' + tipo }, (n.t.match(/[A-Za-zÀ-ÿ]/g) || ['?']).slice(0, 1).join('').toUpperCase()),
        el('div', {}, el('b', {}, n.t), el('small', {}, (tipo === 'empresa' ? '🏢 Empresa' : '👤 Pessoa física') + ' · ' + quandoTxt(n.m)))),
      props.length ? el('div', { class: 'ob-chips' }, props.map(([k, v]) => { const val = Array.isArray(v) ? v.join(', ') : String(v); return el('span', {}, el('small', {}, k + ': '), sensivel(k, val) ? '••••' : val.slice(0, 40) || '—'); })) : null,
      el('p', {}, mascarar(n.resumo || '').slice(0, 140) || 'Nota ainda sem anotações.'),
      el('div', { class: 'ob-card-pe' }, rel ? el('span', {}, `🔗 ${rel} relacionada(s)`) : null, n.tarefas ? el('span', { class: 'am' }, `☑️ ${n.tarefas} aberta(s)`) : null, meta ? el('span', { class: 'ok' }, '🎯 no Meta') : null));
  }
  async function abrirCliente(c) {
    if (!corpoApp || !corpoApp.isConnected || !corpoApp.querySelector('.ob-main')) { pendente = c; if (!corpoApp || !corpoApp.isConnected) KM.inicio.abrirApp('infoclientes'); return; }
    const n = S.porC.get(c); if (!n) return toast('Nota não encontrada');
    const main = corpoApp.querySelector('.ob-main'); main.innerHTML = '';
    const nota = el('section', { class: 'ob-painel' }), lado = el('aside', { class: 'ob-rel' });
    main.append(el('div', { class: 'ob-cli' }, nota, lado));
    const voltar = () => { aberta = null; render(); };
    await abrirNota(nota, c, { voltar, voltarTxt: 'Clientes', placeholder: 'Anotar sobre este cliente… (ex.: pediu o DAS de outubro)', aoLink: c2 => abrirNota(nota, c2, { voltar: () => abrirCliente(c), voltarTxt: n.t }) });
    pintarRelacionadas(lado, n);
  }
  async function pintarRelacionadas(lado, n) {
    lado.innerHTML = '';
    const meta = noMeta(n);
    lado.append(el('div', { class: 'ob-bloco' }, el('h4', {}, '🎯 No Mini Escritório'),
      meta ? el('p', {}, `Está nos clientes do Meta como “${meta.nome}”${meta.valor ? ' · ' + A().brl(meta.valor) + '/mês' : ''}.`)
        : el('div', {}, el('p', {}, 'Ainda não está nos clientes do Meta e do escritório.'), el('button', { class: 'bt peq prim', onclick: () => { porNoMeta(n); pintarRelacionadas(lado, n); } }, '➕ Adicionar ao Meta'))));
    const rel = relacionadas(n);
    const bl = el('div', { class: 'ob-bloco' }, el('h4', {}, `🔗 Notas ligadas (${rel.length})`));
    if (!rel.length) bl.append(el('p', { class: 'ob-vazio' }, 'Nenhuma nota cita este cliente ainda.'));
    rel.slice(0, 30).forEach(r => bl.append(el('button', { class: 'ob-rel-it', onclick: () => abrirNota(aberta ? aberta.box : lado, r.n.c, { voltar: () => abrirCliente(n.c), voltarTxt: n.t }) },
      el('b', {}, r.n.t), el('small', {}, `${r.por} · ${r.n.c.split('/').slice(0, -1).pop() || S.vault} · ${quandoTxt(r.n.m)}`))));
    lado.append(bl);
    const pastasBox = el('div', { class: 'ob-bloco' }, el('h4', {}, '📁 Arquivos do cliente'), el('p', { class: 'ob-carrega' }, 'Procurando pastas…'));
    lado.append(pastasBox);
    const ps = await pastasDoCliente(n);
    pastasBox.querySelector('.ob-carrega').remove();
    if (!ps.length) pastasBox.append(el('p', { class: 'ob-vazio' }, 'Nenhuma pasta com o nome deste cliente.'));
    for (const p of ps) pastasBox.append(navegador(p, true));
  }
  function porNoMeta(n, telInformado) {
    const c = A().cfg(); c.clientes = c.clientes || [];
    const txt = JSON.stringify(n.props || {}) + ' ' + (n.resumo || '');
    const tel = telInformado || (txt.match(/\(?\d{2}\)?\s?9?\s?\d{4}[-\s.]?\d{4}/) || [''])[0];
    const valor = Number(String((n.props || {})['Valor Potencial'] || (n.props || {}).Valor || '0').replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
    const d = new Date();
    c.clientes.push({ nome: n.t, telefone: tel, valor, status: 'ativo', desde: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, obsidian: n.c });
    A().salvar(true); toast('🎯 ' + n.t + ' entrou nos clientes do Meta');
  }
  // pastas (até 4 níveis abaixo da pasta dos clientes) cujo nome lembra o cliente (ex.: a pasta mensal com o nome da empresa)
  const cachePastas = new Map();
  async function listarPasta(c) { if (!cachePastas.has(c)) cachePastas.set(c, api('GET', '/api/obsidian/pasta?' + q({ c })).catch(() => ({ itens: [] }))); return cachePastas.get(c); }
  async function pastasDoCliente(n) {
    const f = fichas(n.t); if (!f.length) return [];
    const partes = n.c.split('/'); const iCli = partes.findIndex(p => /clientes/i.test(p)); const raiz = partes.slice(0, iCli >= 0 ? iCli + 1 : Math.max(1, partes.length - 2)).join('/');
    const achadas = []; let fila = [[raiz, 0]];
    while (fila.length) {
      const [p, nv] = fila.shift(); if (nv > 4) continue;
      const j = await listarPasta(p);
      for (const it of j.itens || []) if (it.pasta) {
        const nome = semAcento(it.nome).replace(/[^a-z0-9]/g, '');
        if (f.some(w => nome.includes(w))) achadas.push(it.c);
        else if (!/^\d{4,6}$/.test(it.nome) && !/^notas$/i.test(it.nome)) fila.push([it.c, nv + 1]);
      }
      if (achadas.length >= 4) break;
    }
    return achadas;
  }
  // lista de uma pasta, com subpastas abrindo no lugar e arquivos abrindo em outra aba (PDF, imagem, planilha…)
  function navegador(c, compacto) {
    const box = el('div', { class: 'ob-nav' + (compacto ? ' compacto' : '') });
    const cab = el('button', { class: 'ob-nav-cab', onclick: () => alternar() }, el('span', {}, '📁'), el('b', {}, c.split('/').pop() || S.vault), el('i', {}, '›'));
    const lista = el('div', { class: 'ob-nav-lista', hidden: true });
    let carregado = false;
    async function alternar() {
      lista.hidden = !lista.hidden; box.classList.toggle('on', !lista.hidden);
      if (carregado || lista.hidden) return; carregado = true;
      lista.append(el('p', { class: 'ob-carrega' }, 'Abrindo…'));
      const j = await listarPasta(c); lista.innerHTML = '';
      if (!(j.itens || []).length) lista.append(el('p', { class: 'ob-vazio' }, 'Pasta vazia.'));
      for (const it of j.itens) {
        if (it.pasta) { lista.append(navegador(it.c, compacto)); continue; }
        const ic = /\.md$/i.test(it.nome) ? '📝' : /\.pdf$/i.test(it.nome) ? '📕' : IMG.test(it.nome) ? '🖼️' : /\.(xlsx?|csv|ods)$/i.test(it.nome) ? '📊' : /\.xml$/i.test(it.nome) ? '🧾' : '📄';
        lista.append(/\.md$/i.test(it.nome)
          ? el('button', { class: 'ob-arq-it', onclick: () => { const alvo = aberta && aberta.box.isConnected ? aberta.box : null; if (alvo) abrirNota(alvo, it.c, aberta.opc); else { visao = 'pastas'; pastaAtual = c; render(); } } }, ic + ' ' + it.nome.replace(/\.md$/i, ''))
          : el('a', { class: 'ob-arq-it', href: urlArquivo(it.c), target: '_blank', rel: 'noopener' }, `${ic} ${it.nome}`, el('small', {}, tamanho(it.tam))));
      }
    }
    box.append(cab, lista);
    return box;
  }
  const tamanho = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  function pastaDosClientes() {
    const cont = new Map(); for (const n of clientes()) { const p = n.c.split('/').slice(0, -1).join('/'); cont.set(p, (cont.get(p) || 0) + 1); }
    return [...cont.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }
  function novoCliente() {
    const box = document.getElementById('obNovo'); if (!box) return;
    if (box.firstChild) { box.innerHTML = ''; return; }
    const campo = (id, rot, ph, tipo = 'text') => el('label', {}, el('small', {}, rot), el('input', { id: 'obN_' + id, type: tipo, placeholder: ph }));
    const st = el('select', { id: 'obN_status' }, ['Convertido', 'Em negociação', 'Proposta enviada', 'Lead'].map(s => el('option', {}, s)));
    const meta = el('input', { type: 'checkbox', id: 'obN_meta', checked: true });
    const form = el('div', { class: 'ob-form' },
      el('h3', {}, '＋ Novo cliente (vira uma nota no Obsidian)'),
      el('div', { class: 'ob-form-g' }, campo('nome', 'Nome do cliente *', 'Ex.: Maria Silva - Estética'), campo('doc', 'CPF ou CNPJ', '000.000.000-00'), campo('tel', 'Telefone / WhatsApp', '(98) 9 0000-0000'),
        campo('email', 'E-mail', 'email@exemplo.com', 'email'), el('label', {}, el('small', {}, 'Status'), st), campo('valor', 'Valor (mensalidade ou potencial)', 'Ex.: 300')),
      el('label', {}, el('small', {}, 'Observações'), el('textarea', { id: 'obN_obs', rows: 3, placeholder: 'O que o cliente precisa, combinados, serviços…' })),
      el('label', { class: 'ob-check' }, meta, ' Colocar também nos clientes do Meta / escritório'),
      el('div', { class: 'ob-form-bts' }, el('button', { class: 'bt', onclick: () => { box.innerHTML = ''; } }, 'Cancelar'), el('button', { class: 'bt prim', onclick: criarCliente }, '💾 Criar no Obsidian')),
      el('p', { class: 'ob-dica' }, `Vai ser criada em: ${pastaDosClientes() || S.vault}`));
    box.append(form); setTimeout(() => document.getElementById('obN_nome').focus(), 30);
  }
  async function criarCliente() {
    const v = id => (document.getElementById('obN_' + id) || {}).value || '';
    const nome = v('nome').replace(/[<>:"/\\|?*#^[\]]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!nome) return toast('Escreva o nome do cliente');
    const pasta = pastaDosClientes(); const c = (pasta ? pasta + '/' : '') + nome + '.md';
    const moc = resolver('MOC - Clientes');
    const linhas = ['---', 'tags:', '  - cliente', `Status: ${v('status')}`, `Data de Contato: ${isoHoje()}`];
    if (v('valor')) linhas.push(`Valor Potencial: ${v('valor').replace(/[^\d,.]/g, '')}`);
    linhas.push('---');
    if (v('doc')) linhas.push((v('doc').replace(/\D/g, '').length > 11 ? 'CNPJ: ' : 'CPF: ') + v('doc'));
    if (v('tel')) linhas.push('Telefone: ' + v('tel'));
    if (v('email')) linhas.push('E-mail: ' + v('email'));
    linhas.push('', v('obs').trim(), '', `- ${hojeBR()}: cadastrado pelo Mini Escritório`, '');
    if (moc) linhas.push('---', '## 🔗 Conexões', '', `- **Mapa:** [[${moc.t}]]`, '');
    try {
      await api('POST', '/api/obsidian/nota', { c, texto: linhas.join('\n') });
    } catch (e) { return toast('⚠️ ' + e.message, { erro: true }); }
    await carregar(true);
    const n = S.porC.get(c);
    if (n && document.getElementById('obN_meta') && document.getElementById('obN_meta').checked && !noMeta(n)) porNoMeta(n, v('tel'));
    toast('📓 Cliente criado no Obsidian: ' + nome); KM.tocar && KM.tocar('sucesso');
    abrirCliente(c);
  }

  // ---- todo o vault
  function vPastas(main) {
    const partes = pastaAtual ? pastaAtual.split('/') : [];
    const migalha = el('div', { class: 'ob-migalha' }, el('button', { onclick: () => { pastaAtual = ''; render(); } }, '🏠 ' + S.vault),
      partes.flatMap((p, i) => [el('i', {}, '›'), el('button', { onclick: () => { pastaAtual = partes.slice(0, i + 1).join('/'); render(); } }, p)]));
    const lista = el('div', { class: 'ob-pasta' }, el('p', { class: 'ob-carrega' }, 'Abrindo…'));
    const nota = el('section', { class: 'ob-painel' });
    main.append(el('div', { class: 'zf-cab' }, el('div', {}, el('h2', {}, partes.at(-1) || 'Pastas do vault'), el('small', {}, 'Toque numa nota para ver e editar · arquivos abrem em outra aba')),
      el('button', { class: 'bt prim', onclick: () => novaNota(pastaAtual) }, '＋ Nova nota aqui')), migalha, el('div', { class: 'ob-duas' }, lista, nota));
    listarPasta(pastaAtual).then(j => {
      lista.innerHTML = '';
      if (!(j.itens || []).length) lista.append(el('p', { class: 'ob-vazio' }, 'Pasta vazia.'));
      for (const it of j.itens || []) {
        const md2 = /\.md$/i.test(it.nome);
        if (it.pasta) lista.append(el('button', { class: 'ob-pasta-it', onclick: () => { pastaAtual = it.c; render(); } }, '📁 ', el('b', {}, it.nome), el('small', {}, `${it.qtd} item(s)`)));
        else if (md2) lista.append(el('button', { class: 'ob-pasta-it', onclick: e => { lista.querySelectorAll('.on').forEach(x => x.classList.remove('on')); e.currentTarget.classList.add('on'); abrirNota(nota, it.c, {}); } }, '📝 ', el('b', {}, it.nome.replace(/\.md$/i, '')), el('small', {}, quandoTxt(it.m))));
        else lista.append(el('a', { class: 'ob-pasta-it', href: urlArquivo(it.c), target: '_blank', rel: 'noopener' }, '📄 ', el('b', {}, it.nome), el('small', {}, tamanho(it.tam))));
      }
    });
    nota.append(el('p', { class: 'ob-vazio' }, '← Escolha uma nota'));
  }
  async function novaNota(pasta) {
    const box = document.querySelector('.ob-main .ob-painel'); if (!box) return;
    box.innerHTML = '';
    const inp = el('input', { type: 'text', class: 'ob-anotar-in', placeholder: 'Nome da nota' });
    const ir = async () => {
      const nome = inp.value.replace(/[<>:"/\\|?*#^[\]]+/g, ' ').trim(); if (!nome) return;
      const c = (pasta ? pasta + '/' : '') + nome + '.md';
      try { await api('POST', '/api/obsidian/nota', { c, texto: `# ${nome}\n\n` }); } catch (e) { return toast('⚠️ ' + e.message, { erro: true }); }
      cachePastas.delete(pasta); await carregar(true); render(); setTimeout(() => { const b = document.querySelector('.ob-main .ob-painel'); if (b) abrirNota(b, c, { editar: true }); }, 60);
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ir(); });
    box.append(el('h3', {}, '＋ Nova nota em ' + (pasta || S.vault)), el('div', { class: 'ob-anotar' }, inp, el('button', { class: 'bt peq prim', onclick: ir }, 'Criar')));
    setTimeout(() => inp.focus(), 30);
  }
  function vBusca(main) {
    const busca = el('input', { class: 'zf-busca', type: 'search', placeholder: '🔎 Buscar em todas as notas do Obsidian…', value: ultimaBusca });
    const res = el('div', { class: 'ob-res' }), nota = el('section', { class: 'ob-painel' });
    let t = 0;
    const ir = async () => {
      ultimaBusca = busca.value.trim(); if (ultimaBusca.length < 2) { res.innerHTML = '<p class="ob-vazio">Digite pelo menos 2 letras.</p>'; return; }
      res.innerHTML = '<p class="ob-carrega">Buscando…</p>';
      const j = await api('GET', '/api/obsidian/busca?' + q({ q: ultimaBusca })).catch(() => ({ resultados: [] }));
      res.innerHTML = ''; if (!j.resultados.length) res.append(el('p', { class: 'ob-vazio' }, 'Nada encontrado.'));
      for (const r of j.resultados) res.append(el('button', { class: 'ob-rel-it', onclick: () => abrirNota(nota, r.c, {}) }, el('b', {}, r.t), el('small', {}, r.c.split('/').slice(0, -1).join(' › ')), r.trecho ? el('p', {}, mascarar(r.trecho)) : null));
    };
    busca.addEventListener('input', () => { clearTimeout(t); t = setTimeout(ir, 300); });
    main.append(el('div', { class: 'zf-topo' }, busca), el('div', { class: 'ob-duas' }, res, nota));
    nota.append(el('p', { class: 'ob-vazio' }, 'O resultado abre aqui.'));
    if (ultimaBusca) ir(); setTimeout(() => busca.focus(), 30);
  }
  async function vTarefas(main) {
    main.append(el('div', { class: 'zf-cab' }, el('div', {}, el('h2', {}, '☑️ Tarefas abertas no Obsidian'), el('small', {}, 'As caixinhas “- [ ]” de todas as notas. Marcar aqui marca no Obsidian.'))));
    const box = el('div', { class: 'ob-tars' }, el('p', { class: 'ob-carrega' }, 'Juntando as tarefas…')); main.append(box);
    const j = cacheTar || await api('GET', '/api/obsidian/tarefas').catch(e => ({ tarefas: [], erro: e.message })); cacheTar = j;
    box.innerHTML = '';
    if (!j.tarefas.length) box.append(el('p', { class: 'ob-vazio' }, 'Nenhuma tarefa aberta. 🎉'));
    const grupos = new Map(); for (const t of j.tarefas) { if (!grupos.has(t.c)) grupos.set(t.c, []); grupos.get(t.c).push(t); }
    for (const [c, ts] of [...grupos.entries()].sort((a, b) => b[1][0].m.localeCompare(a[1][0].m))) {
      const g = el('div', { class: 'ob-tar-g' }, el('button', { class: 'ob-tar-nota', onclick: () => { const n = S.porC.get(c); if (n && ehCliente(n)) abrirCliente(c); else { visao = 'busca'; ultimaBusca = nomeDe(c); render(); } } }, '📝 ' + nomeDe(c), el('small', {}, ` · ${ts.length}`)));
      for (const t of ts) {
        const ch = el('input', { type: 'checkbox' });
        ch.addEventListener('change', () => marcarTarefa(t, ch));
        g.append(el('label', { class: 'ob-tar' }, ch, el('span', { html: inline(t.texto) })));
      }
      box.append(g);
    }
  }
  async function marcarTarefa(t, ch) {
    ch.disabled = true;
    try {
      const j = await api('GET', '/api/obsidian/nota?' + q({ c: t.c }));
      const L = j.texto.split('\n'); let k = t.linha;
      if (!(L[k] || '').includes(t.texto)) k = L.findIndex(l => /^\s*[-*] \[ \]/.test(l) && l.includes(t.texto));
      if (k < 0) throw new Error('A tarefa mudou no Obsidian; leia de novo (🔄)');
      L[k] = L[k].replace('[ ]', '[x]');
      await api('PUT', '/api/obsidian/nota', { c: t.c, texto: L.join('\n'), base: j.m, motivo: 'tarefa marcada pelo Mini Escritório' });
      ch.closest('.ob-tar').classList.add('feita'); KM.tocar && KM.tocar('sucesso'); cacheTar = null; S.carregadoEm = 0;
    } catch (e) { ch.checked = false; ch.disabled = false; toast('⚠️ ' + e.message, { erro: true }); }
  }
  function vRecentes(main) {
    const nota = el('section', { class: 'ob-painel' }), lista = el('div', { class: 'ob-res' });
    main.append(el('div', { class: 'zf-cab' }, el('div', {}, el('h2', {}, '🕘 Editadas recentemente'), el('small', {}, 'No Obsidian ou aqui'))), el('div', { class: 'ob-duas' }, lista, nota));
    [...S.notas].sort((a, b) => b.m.localeCompare(a.m)).slice(0, 40).forEach(n => lista.append(el('button', { class: 'ob-rel-it', onclick: () => (ehCliente(n) ? abrirCliente(n.c) : abrirNota(nota, n.c, {})) }, el('b', {}, n.t), el('small', {}, `${quandoTxt(n.m)} · ${n.c.split('/').slice(0, -1).pop() || S.vault}`))));
    nota.append(el('p', { class: 'ob-vazio' }, '← Escolha uma nota'));
  }

  // ------------------------------------------------------------------ registro e ganchos
  const resumo = () => (KM.ehPC && S.notas.length ? { txt: `${clientes().length} clientes · ${S.notas.length} notas` } : { txt: KM.ehPC ? 'Ligado ao seu Obsidian' : 'Abra pelo PC' });
  function registrar() {
    if (!KM.inicio) return setTimeout(registrar, 50);
    KM.inicio.registrar('infoclientes', { nome: 'Informações de clientes', ic: '📇', abrir: (c, a) => abrirApp(c, a, 'clientes'), sair: sairApp, resumo });
    KM.inicio.registrar('obsidian', { nome: 'Obsidian', ic: '📓', abrir: (c, a) => abrirApp(c, a, 'pastas'), sair: sairApp, resumo });
    if (KM.ehPC) setTimeout(() => carregar(true).catch(() => {}), 2500); // deixa o índice pronto para os cartões de cliente
  }
  registrar();
  // ficha do cliente no escritório/cidade -> nota do Obsidian
  async function blocoNaFicha(nome, box) {
    if (!KM.ehPC) return;
    try { await carregar(false); } catch (e) { return; }
    const n = acharCliente(nome); if (!n || !box.isConnected) return;
    box.append(el('div', { class: 'rua-bloco bem' }, el('b', {}, '📓 Obsidian'), el('p', {}, mascarar(n.resumo || '').slice(0, 160) || 'Nota do cliente no Obsidian.'),
      el('button', { class: 'bt peq', onclick: () => abrirCliente(n.c) }, 'Ver tudo do cliente')));
  }
  KM.obsidian = { carregar, acharCliente, abrirCliente, blocoNaFicha, clientes, estado: () => S, _md: md, _inserir: inserirAnotacao };
})();
