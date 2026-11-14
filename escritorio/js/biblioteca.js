/* KWIK Mini Escritório · 📚 Biblioteca (atalho na tela inicial).
   - Prateleiras = subpastas de "04 - Hobbies/Livros" no Obsidian. No PC (servidor ligado) lê a pasta ao vivo;
     sem servidor usa o catálogo js/biblioteca-dados.js (gerado por biblioteca-gerar.ps1).
   - Capas: procura sozinha a capa da edição em português mais recente (Google Livros; reserva: Open Library).
     Tocar no livro → "Trocar capa" mostra as edições encontradas para escolher.
   - ＋ Livro: digite o título (e o autor, se quiser) → o app acha o livro, a capa e o resumo do que é. No PC grava a nota
     no Obsidian, na prateleira escolhida; fora do PC fica guardado no app.
   - ★★★★★ embaixo de cada livro: sua avaliação (tocar na mesma estrela de novo apaga). No PC também vai para "nota:" da nota. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const el = (...a) => A().el(...a);
  const toast = (m, o) => A().toast(m, o);
  const PASTA_PADRAO = '04 - Hobbies/Livros';
  const ORDEM_PRAT = ['Finanças e Desenvolvimento Pessoal', 'Suspense e Terror', 'Sherlock Holmes', 'Ficção Científica e Distopia', 'Infantojuvenil e Mangá', 'Clássicos', 'Psicologia', 'Contabilidade'];
  const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const chave = t => semAcento(t).replace(/[^a-z0-9]+/g, ' ').trim();
  const LS_CAPAS = 'kwik-bib-capas'; // capas achadas automaticamente (cache deste aparelho)

  // ------------------------------------------------------------------ dados guardados no app
  function D() {
    const c = A().cfg();
    if (!c.biblioteca || typeof c.biblioteca !== 'object') c.biblioteca = {};
    const b = c.biblioteca;
    for (const k of ['notas', 'capas', 'resumos']) if (!b[k] || typeof b[k] !== 'object' || Array.isArray(b[k])) b[k] = {};
    if (!Array.isArray(b.extras)) b.extras = [];
    return b;
  }
  const lerCache = () => { try { return JSON.parse(localStorage.getItem(LS_CAPAS) || '{}'); } catch (e) { return {}; } };
  const gravarCache = c => { try { localStorage.setItem(LS_CAPAS, JSON.stringify(c)); } catch (e) { /* cheio */ } };

  // ------------------------------------------------------------------ servidor (Obsidian)
  async function api(met, url, corpo) {
    const r = await fetch(KM.ponte.base() + url, { method: met, cache: 'no-store', headers: corpo ? { 'Content-Type': 'application/json', 'X-Kwik': '1' } : {}, body: corpo ? JSON.stringify(corpo) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.erro || 'Erro ' + r.status); e.status = r.status; throw e; }
    return j;
  }
  const S = { livros: [], fonte: '', vault: '', pasta: PASTA_PADRAO, carregado: 0 };
  async function carregar() {
    const emb = window.KM_BIBLIOTECA || { livros: [] };
    S.pasta = emb.pasta || PASTA_PADRAO;
    const porC = new Map((emb.livros || []).map(l => [l.c, l]));
    let base = null;
    if (await KM.ponte.checar(true)) {
      try {
        const j = await api('GET', '/api/obsidian/indice');
        S.vault = j.vault || '';
        const pre = S.pasta + '/';
        base = j.notas.filter(n => n.c.startsWith(pre) && n.c.slice(pre.length).includes('/')).map(n => {
          const p = n.props || {}, e = porC.get(n.c) || {}, partes = n.c.slice(pre.length).split('/');
          const nota = parseInt(p.nota, 10);
          return { c: n.c, t: n.t, autor: str(p.autor), prateleira: partes[0], capa: str(p.capa), status: str(p.status), ordem: str(p['ordem-de-leitura']), nota: nota >= 1 && nota <= 5 ? nota : 0, sobre: e.sobre || '', obs: true };
        });
        S.fonte = 'obsidian';
      } catch (e) { base = null; }
    }
    if (!base) { base = (emb.livros || []).map(l => Object.assign({}, l, { obs: false })); S.fonte = 'app'; }
    const vistos = new Set(base.map(l => chave(l.t)));
    for (const x of D().extras) if (!vistos.has(chave(x.t))) base.push(Object.assign({ extra: true }, x));
    S.livros = base; S.carregado = Date.now();
  }
  const str = v => (Array.isArray(v) ? v.join(', ') : String(v || '')).trim();

  // valores finais de um livro (o que você mudou no app vale mais)
  const notaDe = l => { const n = D().notas[chave(l.t)]; return n != null ? n : (l.nota || 0); };
  const capaDe = l => D().capas[chave(l.t)] || (lerCache()[chave(l.t)] || {}).url || l.capa || '';
  const sobreDe = l => l.sobre || D().resumos[chave(l.t)] || '';

  // ------------------------------------------------------------------ busca na internet
  const limpaHtml = s => String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\n{3,}/g, '\n\n').trim();
  const sobrenome = a => (String(a || '').replace(/\(.*?\)/g, '').split(/ e |,/)[0].trim().split(/\s+/).pop() || '');
  const gbCapa = (id, thumb) => thumb ? thumb.replace(/^http:/, 'https:').replace('&edge=curl', '') + '&fife=w480-h720' : `https://books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=1&fife=w480-h720`;
  function parecido(a, b) { // o título achado começa com o que foi pedido (ignorando acentos e subtítulo)
    const x = chave(a), y = chave(b); if (!x || !y) return false;
    return x === y || x.startsWith(y) || y.startsWith(x) || x.includes(y);
  }
  async function googleLivros(titulo, autor, max = 20) {
    const q = `intitle:"${titulo}"` + (sobrenome(autor) ? ` inauthor:${sobrenome(autor)}` : '');
    const r = await fetch('https://www.googleapis.com/books/v1/volumes?' + new URLSearchParams({ q, langRestrict: 'pt', maxResults: String(max), printType: 'books' }));
    if (!r.ok) throw new Error(r.status === 429 ? 'Google Livros sem cota agora' : 'Google Livros: erro ' + r.status);
    const j = await r.json();
    return (j.items || []).map(v => {
      const i = v.volumeInfo || {};
      return { fonte: 'Google Livros', t: [i.title, i.subtitle].filter(Boolean).join(': '), titulo: i.title || '', autor: (i.authors || []).join(', '), ano: String(i.publishedDate || '').slice(0, 4), data: i.publishedDate || '',
        editora: i.publisher || '', lang: i.language || '', capa: i.imageLinks ? gbCapa(v.id, i.imageLinks.thumbnail || i.imageLinks.smallThumbnail) : '', sobre: limpaHtml(i.description), paginas: i.pageCount || 0 };
    });
  }
  async function openLibrary(titulo, autor) {
    const p = { title: titulo, limit: '8', fields: 'key,title,author_name,cover_i,first_publish_year,editions,editions.title,editions.cover_i,editions.publish_date,editions.publisher,editions.language' };
    if (autor) p.author = sobrenome(autor);
    const r = await fetch('https://openlibrary.org/search.json?' + new URLSearchParams(p));
    if (!r.ok) throw new Error('Open Library: erro ' + r.status);
    const j = await r.json(), out = [];
    for (const d of j.docs || []) {
      const ed = (d.editions && d.editions.docs) || [];
      for (const e of ed) if (e.cover_i) out.push({ fonte: 'Open Library', t: e.title || d.title, titulo: e.title || d.title, autor: (d.author_name || []).join(', '), ano: (String(e.publish_date || '').match(/\d{4}/) || [''])[0], editora: (e.publisher || [])[0] || '', lang: (e.language || [])[0] || '', capa: `https://covers.openlibrary.org/b/id/${e.cover_i}-L.jpg`, sobre: '', work: d.key });
      if (d.cover_i) out.push({ fonte: 'Open Library', t: d.title, titulo: d.title, autor: (d.author_name || []).join(', '), ano: String(d.first_publish_year || ''), editora: '', lang: '', capa: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`, sobre: '', work: d.key });
    }
    const vistos = new Set(); return out.filter(x => !vistos.has(x.capa) && vistos.add(x.capa));
  }
  // resumo da Wikipédia em português, só se a página for mesmo do livro (não do filme, série, anime…)
  async function wikipedia(titulo, autor) {
    const sob = semAcento(sobrenome(autor));
    const ehLivro = s => {
      const ini = semAcento((s.description || '') + ' ' + String(s.extract || '').slice(0, 260));
      if (/\b(e|foi) (um|uma) (filme|serie|anime|jogo|banda|album|cancao|telenovela|peca|programa)\b/.test(ini)) return false;
      return /\b(livro|romance|novela|obra|contos?|manga|best-seller|escrito por|escrita por)\b/.test(ini);
    };
    const busca = await fetch('https://pt.wikipedia.org/w/api.php?' + new URLSearchParams({ action: 'query', list: 'search', srsearch: `${titulo} ${autor || ''} livro`.trim(), srlimit: '6', format: 'json', origin: '*' })).then(r => r.json());
    const nomes = [titulo + ' (livro)', titulo, ...((busca.query && busca.query.search) || []).map(h => h.title)];
    let reserva = '';
    for (const nome of [...new Set(nomes)]) {
      if (!parecido(nome.replace(/\s*\(.*\)$/, ''), titulo)) continue;
      const r = await fetch('https://pt.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(nome.replace(/ /g, '_')));
      if (!r.ok) continue;
      const s = await r.json();
      if (!s.extract || s.type === 'disambiguation' || !ehLivro(s)) continue;
      if (!sob || semAcento(s.extract).includes(sob)) return s.extract; // cita o autor: é esse
      reserva = reserva || s.extract;
    }
    return reserva;
  }
  // edições com capa, a mais nova primeiro (em português antes das outras)
  async function edicoes(titulo, autor) {
    let lista = [], erros = [];
    try { lista = (await googleLivros(titulo, autor)).filter(x => x.capa && parecido(x.titulo, titulo)); } catch (e) { erros.push(e.message); }
    try { lista = lista.concat(await openLibrary(titulo, autor)); } catch (e) { erros.push(e.message); }
    const pt = x => (x.lang === 'pt' || x.lang === 'por' ? 0 : 1);
    lista.sort((a, b) => pt(a) - pt(b) || String(b.data || b.ano).localeCompare(String(a.data || a.ano)));
    return { lista, erros };
  }

  // procura sozinha a capa mais recente de cada livro (uma de cada vez, guarda por 30 dias neste aparelho)
  let filaRodando = false;
  async function atualizarCapas(aoMudar) {
    if (filaRodando || !navigator.onLine) return;
    filaRodando = true;
    try {
      for (const l of S.livros) {
        const k = chave(l.t), cache = lerCache();
        if (D().capas[k]) continue;
        const c = cache[k];
        if (c && Date.now() - c.em < (c.url ? 30 : 1) * 864e5) continue;
        let url = '';
        try {
          const g = (await googleLivros(l.t, l.autor, 20)).filter(x => x.capa && x.lang === 'pt' && parecido(x.titulo, l.t));
          g.sort((a, b) => String(b.data).localeCompare(String(a.data)));
          url = g.length ? g[0].capa : '';
        } catch (e) { if (/cota/.test(e.message)) break; } // sem cota hoje: tenta de novo outro dia
        if (!url && !l.capa) { try { const o = await openLibrary(l.t, l.autor); url = o.length ? o[0].capa : ''; } catch (e) { /* ok */ } }
        const novo = lerCache(); novo[k] = { url, em: Date.now() }; gravarCache(novo);
        if (url) aoMudar(l);
        await new Promise(r => setTimeout(r, 700));
      }
    } finally { filaRodando = false; }
  }

  // ------------------------------------------------------------------ gravar no Obsidian (só no PC)
  async function mudarProp(l, props) {
    if (!l.obs || !KM.ponte.ligado()) return false;
    const j = await api('GET', '/api/obsidian/nota?c=' + encodeURIComponent(l.c));
    let txt = j.texto;
    if (!txt.startsWith('---\n')) txt = '---\n---\n' + txt;
    const fim = txt.indexOf('\n---', 4);
    let fm = txt.slice(4, fim), corpo = txt.slice(fim);
    for (const [k, v] of Object.entries(props)) {
      const re = new RegExp('^' + k + ':.*$', 'm');
      if (re.test(fm)) fm = fm.replace(re, `${k}: ${v}`.trimEnd()); else fm = (fm ? fm + '\n' : '') + `${k}: ${v}`.trimEnd();
      if (k === 'capa' && v) corpo = corpo.replace(/!\[capa(\|\d+)?\]\([^)]*\)/, m => m.replace(/\]\([^)]*\)/, `](${v})`));
    }
    const novo = '---\n' + fm.replace(/^\n+/, '') + corpo;
    await api('PUT', '/api/obsidian/nota', { c: l.c, texto: novo, base: j.m, motivo: 'Biblioteca do Mini Escritório' });
    return true;
  }
  function notaObsidian(l) {
    const capa = l.capa || '';
    return `---
tags:
  - livro
autor: ${l.autor || ''}
categoria: ${l.prateleira}
status: ${l.status || 'quero ler'}
nota:${l.nota ? ' ' + l.nota : ''}
capa: ${capa}
---
# ${l.t}
${capa ? `\n![capa|220](${capa})\n` : ''}
> [!info] Ficha
> **Autor:** ${l.autor || '—'}${l.ano ? ' · **Ano:** ' + l.ano : ''}${l.editora ? ' · **Editora:** ' + l.editora : ''}

## Sobre o que é

${l.sobre || ''}

## Minha interpretação


## Melhores momentos


---
← [[Estante]]
`;
  }

  // ------------------------------------------------------------------ tela
  let corpoAtual = null, vista = { prat: null, busca: '', ordem: 'padrao' };
  const prateleiras = () => {
    const m = new Map();
    for (const l of S.livros) { if (!m.has(l.prateleira)) m.set(l.prateleira, []); m.get(l.prateleira).push(l); }
    const pos = n => { const i = ORDEM_PRAT.indexOf(n); return i < 0 ? 99 : i; };
    const lista = [...m.entries()].map(([nome, livros]) => ({ nome, livros: ordenarLivros(livros) }));
    if (vista.ordem === 'nome') lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    else if (vista.ordem === 'qtd') lista.sort((a, b) => b.livros.length - a.livros.length);
    else lista.sort((a, b) => pos(a.nome) - pos(b.nome) || a.nome.localeCompare(b.nome, 'pt-BR'));
    return lista;
  };
  const ordenarLivros = ls => ls.slice().sort((a, b) => (parseInt(a.ordem, 10) || 999) - (parseInt(b.ordem, 10) || 999) || a.t.localeCompare(b.t, 'pt-BR'));

  function estrelas(l, grande) {
    const n = notaDe(l), box = el('div', { class: 'bb-estrelas' + (grande ? ' grande' : ''), role: 'radiogroup', 'aria-label': 'Sua avaliação' });
    for (let i = 1; i <= 5; i++) {
      box.append(el('button', { class: i <= n ? 'on' : '', title: `${i} estrela${i > 1 ? 's' : ''}`, 'aria-label': `${i} estrela${i > 1 ? 's' : ''}`,
        onclick: e => { e.stopPropagation(); avaliar(l, i === n ? 0 : i); } }, '★'));
    }
    return box;
  }
  let timersNota = {};
  function avaliar(l, n) {
    const k = chave(l.t);
    D().notas[k] = n; A().salvar();
    document.querySelectorAll(`.bb-estrelas[data-k="${CSS.escape(k)}"], [data-k="${CSS.escape(k)}"] .bb-estrelas`).forEach(b => [...b.children].forEach((s, i) => s.classList.toggle('on', i < n)));
    if (KM.tocar) KM.tocar('clique');
    if (l.obs) {
      clearTimeout(timersNota[k]);
      timersNota[k] = setTimeout(() => mudarProp(l, { nota: n ? String(n) : '' }).then(() => { l.nota = n; }).catch(e => toast('⚠️ A nota não foi para o Obsidian: ' + e.message, { erro: true })), 800);
    }
  }
  function imgCapa(l, cls) {
    const url = capaDe(l);
    const box = el('div', { class: 'bb-capa ' + (cls || '') });
    const reserva = () => { box.innerHTML = ''; box.classList.add('sem'); box.append(el('b', {}, l.t), el('small', {}, l.autor || '')); };
    if (!url) reserva();
    else box.append(el('img', { src: url, alt: 'Capa de ' + l.t, loading: 'lazy', referrerpolicy: 'no-referrer', onerror: reserva }));
    return box;
  }
  function cartaoLivro(l) {
    return el('div', { class: 'bb-livro', 'data-k': chave(l.t) },
      el('button', { class: 'bb-livro-capa', title: 'Ver ' + l.t, onclick: () => detalhe(l) }, imgCapa(l), l.status && l.status !== 'lido' ? el('em', { class: 'bb-selo' }, l.status) : null),
      el('b', { class: 'bb-livro-t' }, l.t), el('small', { class: 'bb-livro-a' }, l.autor || ' '), estrelas(l));
  }
  function cartaoPrat(p) {
    const topo = p.livros.find(l => capaDe(l)) || p.livros[0];
    const media = (() => { const ns = p.livros.map(notaDe).filter(Boolean); return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0; })();
    return el('button', { class: 'bb-prat', onclick: () => { vista.prat = p.nome; render(); } },
      el('div', { class: 'bb-prat-arte' },
        el('div', { class: 'bb-pilha', 'aria-hidden': 'true' }, el('i', { class: 'l1' }), el('i', { class: 'l2' }), el('i', { class: 'l3' })),
        topo ? imgCapa(topo, 'bb-topo') : null,
        el('span', { class: 'bb-prat-lado' }, `${p.livros.length} ${p.livros.length === 1 ? 'livro' : 'livros'}`)),
      el('span', { class: 'bb-prat-nome' }, p.nome),
      media ? el('small', { class: 'bb-prat-media' }, '★ ' + media.toFixed(1).replace('.', ',')) : null);
  }

  function render() {
    const corpo = corpoAtual; if (!corpo) return;
    corpo.innerHTML = '';
    const prats = prateleiras(), q = semAcento(vista.busca);
    const ORD = { padrao: 'Ordem da estante', nome: 'Nome (A–Z)', qtd: 'Mais livros' };
    const barra = el('header', { class: 'bb-barra' },
      el('button', { class: 'bb-casa', title: 'Todas as prateleiras', onclick: () => { vista.prat = null; render(); } }, '🏛️', el('span', {}, '›')),
      vista.prat ? el('b', { class: 'bb-onde' }, vista.prat) : el('span', { class: 'bb-onde' }, `1 estante, ${prats.length} prateleiras · ${S.livros.length} livros`),
      el('input', { class: 'bb-busca', type: 'search', placeholder: 'Buscar livro ou autor', value: vista.busca, oninput: e => { vista.busca = e.target.value; const p = e.target.selectionStart; render(); const n = corpo.querySelector('.bb-busca'); n.focus(); n.setSelectionRange(p, p); } }),
      vista.prat ? null : el('button', { class: 'bb-ordem', title: 'Ordenar: ' + ORD[vista.ordem], onclick: () => { vista.ordem = { padrao: 'nome', nome: 'qtd', qtd: 'padrao' }[vista.ordem]; render(); toast('Ordem: ' + ORD[vista.ordem]); } }, '⇅'));
    corpo.append(barra);
    if (S.fonte === 'app' && KM.ponte.computador()) corpo.append(el('p', { class: 'bb-aviso' }, 'O servidor do escritório não respondeu: mostrando o catálogo guardado no app. Abra o atalho "KWIK Mini Escritório" da área de trabalho para ler e gravar direto no Obsidian.'));

    if (q) {
      const achados = S.livros.filter(l => semAcento(l.t + ' ' + l.autor + ' ' + l.prateleira).includes(q));
      corpo.append(el('h3', { class: 'bb-sec' }, `${achados.length} resultado${achados.length === 1 ? '' : 's'}`), el('div', { class: 'bb-livros' }, ordenarLivros(achados).map(cartaoLivro)));
      if (!achados.length) corpo.append(el('p', { class: 'bb-vazio' }, 'Nenhum livro com esse nome. ', el('button', { class: 'bb-link', onclick: () => adicionar(vista.busca) }, '＋ Adicionar "' + vista.busca + '"')));
      return;
    }
    if (vista.prat) {
      const p = prats.find(x => x.nome === vista.prat);
      if (!p) { vista.prat = null; return render(); }
      corpo.append(el('div', { class: 'bb-livros' }, p.livros.map(cartaoLivro)));
      return;
    }
    corpo.append(el('div', { class: 'bb-prats' }, prats.map(cartaoPrat)));
    corpo.append(el('h3', { class: 'bb-sec' }, 'Todos os livros'), el('div', { class: 'bb-livros' }, ordenarLivros(S.livros).map(cartaoLivro)));
  }

  // ------------------------------------------------------------------ janelas
  function janela(titulo, ...conteudo) {
    const fundo = el('div', { class: 'bb-fundo', onclick: e => { if (e.target === fundo) fechar(); } });
    const caixa = el('div', { class: 'bb-janela', role: 'dialog', 'aria-label': titulo },
      el('header', {}, el('b', {}, titulo), el('button', { class: 'bb-x', 'aria-label': 'Fechar', onclick: () => fechar() }, '×')), ...conteudo);
    const tecla = e => { if (e.key === 'Escape') fechar(); };
    function fechar() { fundo.remove(); document.removeEventListener('keydown', tecla); }
    document.addEventListener('keydown', tecla);
    fundo.append(caixa); document.body.append(fundo);
    return { caixa, fechar };
  }

  function detalhe(l) {
    const k = chave(l.t);
    const texto = el('div', { class: 'bb-sobre' });
    const pintarSobre = s => { texto.innerHTML = ''; (s || '').split(/\n{2,}/).forEach(par => texto.append(el('p', {}, par.replace(/\n/g, ' ')))); };
    const sobre = sobreDe(l);
    if (sobre) pintarSobre(sobre);
    else {
      texto.append(el('p', { class: 'bb-carregando' }, 'Procurando o resumo…'));
      resumoOnline(l.t, l.autor).then(s => { if (s) { D().resumos[k] = s; A().salvar(); } pintarSobre(s || 'Não achei um resumo na internet para este livro.'); });
    }
    const capaBox = el('div', { class: 'bb-det-capa' }, imgCapa(l));
    const linkObs = l.obs && S.vault ? `obsidian://open?vault=${encodeURIComponent(S.vault)}&file=${encodeURIComponent(l.c.replace(/\.md$/i, ''))}` : '';
    const j = janela(l.t,
      el('div', { class: 'bb-det' }, capaBox,
        el('div', { class: 'bb-det-info' },
          el('h2', {}, l.t), l.autor ? el('p', { class: 'bb-det-autor' }, l.autor) : null,
          el('p', { class: 'bb-det-tags' }, el('span', {}, '📚 ' + l.prateleira), l.status ? el('span', {}, l.status) : null, l.extra ? el('span', {}, 'só no app') : null),
          el('div', { 'data-k': k }, estrelas(l, true)),
          el('h4', {}, 'Sobre o que é'), texto,
          el('div', { class: 'bb-det-acoes' },
            el('button', { class: 'bb-bt', onclick: () => trocarCapa(l, () => { capaBox.innerHTML = ''; capaBox.append(imgCapa(l)); render(); }) }, '🖼️ Trocar capa'),
            linkObs ? el('a', { class: 'bb-bt', href: linkObs }, '📓 Abrir no Obsidian') : null,
            l.extra ? el('button', { class: 'bb-bt perigo', onclick: () => { if (!confirm(`Tirar "${l.t}" da biblioteca do app?`)) return; const b = D(); b.extras = b.extras.filter(x => chave(x.t) !== k); A().salvar(); S.livros = S.livros.filter(x => x !== l); j.fechar(); render(); } }, '🗑️ Remover') : null))));
  }
  async function resumoOnline(titulo, autor) {
    try { const g = (await googleLivros(titulo, autor, 10)).filter(x => x.sobre && parecido(x.titulo, titulo)); if (g.length) return g.sort((a, b) => b.sobre.length - a.sobre.length)[0].sobre; } catch (e) { /* tenta a Wikipédia */ }
    try { return await wikipedia(titulo, autor); } catch (e) { return ''; }
  }

  function trocarCapa(l, depois) {
    const grade = el('div', { class: 'bb-edicoes' }, el('p', { class: 'bb-carregando' }, 'Procurando as edições…'));
    const url = el('input', { type: 'url', placeholder: 'ou cole o link de uma imagem de capa', class: 'bb-campo' });
    const j = janela('Trocar capa · ' + l.t, grade,
      el('div', { class: 'bb-linha' }, url, el('button', { class: 'bb-bt prim', onclick: () => { if (/^https?:\/\//.test(url.value.trim())) escolher(url.value.trim()); else toast('Cole um link que comece com https://'); } }, 'Usar')));
    async function escolher(u) {
      D().capas[chave(l.t)] = u; A().salvar();
      j.fechar(); depois();
      try { if (await mudarProp(l, { capa: u })) { l.capa = u; toast('🖼️ Capa trocada (e gravada no Obsidian)'); } else toast('🖼️ Capa trocada'); } catch (e) { toast('⚠️ Capa trocada no app, mas não no Obsidian: ' + e.message, { erro: true }); }
    }
    edicoes(l.t, l.autor).then(({ lista, erros }) => {
      grade.innerHTML = '';
      if (!lista.length) grade.append(el('p', { class: 'bb-vazio' }, 'Não achei edições com capa agora.' + (erros.length ? ' (' + erros.join(' · ') + ')' : '')));
      for (const x of lista.slice(0, 24)) {
        grade.append(el('button', { class: 'bb-edicao' + (x.capa === capaDe(l) ? ' atual' : ''), onclick: () => escolher(x.capa) },
          el('img', { src: x.capa, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer', onerror: e => e.target.closest('button').remove() }),
          el('small', {}, [x.ano, x.editora].filter(Boolean).join(' · ') || x.fonte), x.lang === 'pt' || x.lang === 'por' ? el('em', {}, 'PT') : null));
      }
    });
  }

  function adicionar(tituloInicial) {
    const prats = prateleiras().map(p => p.nome);
    const titulo = el('input', { class: 'bb-campo', placeholder: 'Título do livro', value: tituloInicial || '' });
    const autor = el('input', { class: 'bb-campo', placeholder: 'Autor (opcional, ajuda a achar)' });
    const prat = el('select', { class: 'bb-campo' }, prats.map(p => el('option', { value: p }, p)), el('option', { value: '__nova' }, '＋ Nova prateleira…'));
    if (vista.prat && prats.includes(vista.prat)) prat.value = vista.prat;
    const status = el('select', { class: 'bb-campo' }, ['quero ler', 'lendo', 'lido'].map(s => el('option', { value: s }, s)));
    const res = el('div', { class: 'bb-achados' });
    let escolhido = null;
    const buscar = async () => {
      const t = titulo.value.trim(); if (!t) return titulo.focus();
      res.innerHTML = ''; res.append(el('p', { class: 'bb-carregando' }, 'Procurando "' + t + '"…'));
      let lista = [];
      try { lista = (await googleLivros(t, autor.value.trim(), 12)).filter(x => x.titulo); } catch (e) { /* reserva */ }
      if (!lista.length) { try { lista = (await openLibrary(t, autor.value.trim())).slice(0, 6); } catch (e) { /* nada */ } }
      // melhor primeiro: título parecido, em português, com resumo e capa
      const pts = x => (parecido(x.titulo, t) ? 4 : 0) + (x.lang === 'pt' ? 2 : 0) + (x.sobre ? 2 : 0) + (x.capa ? 1 : 0);
      lista.sort((a, b) => pts(b) - pts(a) || String(b.data || b.ano).localeCompare(String(a.data || a.ano)));
      res.innerHTML = '';
      if (!lista.length) { lista = [{ fonte: 'manual', t, titulo: t, autor: autor.value.trim(), capa: '', sobre: '' }]; res.append(el('p', { class: 'bb-vazio' }, 'Não achei na internet agora. Pode adicionar assim mesmo.')); }
      lista.slice(0, 6).forEach((x, i) => {
        const b = el('button', { class: 'bb-achado', onclick: () => marcar(x, b) },
          x.capa ? el('img', { src: x.capa, alt: '', referrerpolicy: 'no-referrer', onerror: e => e.target.remove() }) : el('span', { class: 'bb-achado-sem' }, '📖'),
          el('span', {}, el('b', {}, x.t), el('small', {}, [x.autor, x.ano, x.editora].filter(Boolean).join(' · ')), el('p', {}, x.sobre ? x.sobre.slice(0, 220) + (x.sobre.length > 220 ? '…' : '') : 'Sem resumo aqui: busco na Wikipédia ao adicionar.')));
        res.append(b); if (i === 0) marcar(x, b);
      });
    };
    function marcar(x, b) { escolhido = x; res.querySelectorAll('.bb-achado').forEach(o => o.classList.toggle('on', o === b)); }
    const j = janela('＋ Adicionar livro',
      el('div', { class: 'bb-form' }, titulo, autor, el('div', { class: 'bb-linha' }, prat, status), el('button', { class: 'bb-bt prim', onclick: buscar }, '🔎 Buscar resumo e capa')),
      res,
      el('div', { class: 'bb-det-acoes' }, el('button', { class: 'bb-bt prim', onclick: () => salvarNovo() }, '📚 Adicionar à biblioteca')));
    titulo.addEventListener('keydown', e => { if (e.key === 'Enter') buscar(); });
    autor.addEventListener('keydown', e => { if (e.key === 'Enter') buscar(); });
    setTimeout(() => titulo.focus(), 30);
    if (tituloInicial) buscar();

    async function salvarNovo() {
      let p = prat.value;
      if (p === '__nova') { p = (prompt('Nome da nova prateleira:') || '').trim().replace(/[\\/:*?"<>|]/g, ''); if (!p) return; }
      const t = (titulo.value.trim() || (escolhido && escolhido.titulo) || '').replace(/[\\/:*?"<>|#^[\]]/g, '').trim();
      if (!t) return titulo.focus();
      if (S.livros.some(l => chave(l.t) === chave(t))) return toast('Esse livro já está na biblioteca 🙂');
      const x = escolhido || {};
      let sobre = x.sobre || '';
      if (!sobre) { toast('Procurando o resumo…'); sobre = await resumoOnline(t, autor.value.trim() || x.autor); }
      const novo = { t, autor: autor.value.trim() || x.autor || '', prateleira: p, capa: x.capa || '', status: status.value, ordem: '', nota: 0, sobre, ano: x.ano || '', editora: x.editora || '' };
      if (KM.ponte.ligado() && S.fonte === 'obsidian') {
        const c = `${S.pasta}/${p}/${t}.md`;
        try {
          await api('POST', '/api/obsidian/nota', { c, texto: notaObsidian(novo) });
          S.livros.push(Object.assign(novo, { c, obs: true }));
          toast(`📚 "${t}" adicionado (nota criada no Obsidian)`);
        } catch (e) { return toast('⚠️ ' + e.message, { erro: true }); }
      } else {
        D().extras.push(Object.assign({ em: Date.now() }, novo)); A().salvar();
        S.livros.push(Object.assign({ extra: true, obs: false }, novo));
        toast(`📚 "${t}" adicionado`);
      }
      j.fechar(); vista.busca = ''; vista.prat = p; render();
      detalhe(S.livros.find(l => chave(l.t) === chave(t)));
    }
  }

  // ------------------------------------------------------------------ app na tela inicial
  async function abrir(corpo, acoes) {
    corpoAtual = corpo; corpo.classList.add('bb-corpo');
    acoes.append(el('button', { class: 'appv-bt prim', onclick: () => adicionar('') }, '＋ Livro'));
    corpo.append(el('p', { class: 'bb-carregando' }, 'Abrindo a estante…'));
    await carregar();
    if (corpoAtual !== corpo) return;
    render();
    atualizarCapas(l => { if (corpoAtual === corpo) document.querySelectorAll(`[data-k="${CSS.escape(chave(l.t))}"] .bb-capa`).forEach(b => b.replaceWith(imgCapa(l))); });
  }
  function resumo() {
    const livros = S.livros.length ? S.livros : ((window.KM_BIBLIOTECA || {}).livros || []);
    if (!livros.length) return null;
    const av = livros.filter(l => notaDe(l)).length;
    return { txt: `${livros.length} livros · ${av} avaliado${av === 1 ? '' : 's'}` };
  }
  function registrar() {
    if (!KM.inicio || !KM.app) return setTimeout(registrar, 50);
    KM.inicio.registrar('biblioteca', { nome: 'Biblioteca', ic: '📚', abrir, sair: () => { corpoAtual = null; document.querySelectorAll('.bb-fundo').forEach(f => f.remove()); }, resumo });
  }
  KM.biblioteca = { abrir: () => KM.inicio && KM.inicio.abrirApp && KM.inicio.abrirApp('biblioteca') };
  registrar();
})();
