/* KWIK Mini Escritório · 📚 Biblioteca (atalho na tela inicial). Funciona SEM o Obsidian.
   - Os livros vêm do catálogo js/biblioteca-dados.js (foto da pasta "04 - Hobbies/Livros", gerado por biblioteca-gerar.ps1).
     Prateleira = subpasta. Tudo o que você faz aqui (estrelas, etiqueta, capa, livros novos, lista de desejos) fica salvo
     na configuração do app (cfg.biblioteca), que vai para todos os aparelhos. Nada é gravado no Obsidian.
   - Etiquetas: lendo · lido · desistiu (tocar no livro para trocar).
   - Capas: procura sozinha a capa da edição em português mais recente (Google Livros; reserva: Open Library) e guarda.
     "Trocar capa" mostra as edições encontradas para escolher.
   - ＋ Livro: digite o título (e o autor) → o app acha o livro, a capa e o resumo do que é.
   - 💭 Lista de desejos (no topo): livros que você quer ler. "Comecei a ler" leva o livro para uma prateleira.
   - ★★★★★ embaixo de cada livro: sua avaliação (tocar na mesma estrela de novo apaga). */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const el = (...a) => A().el(...a);
  const toast = (m, o) => A().toast(m, o);
  const ORDEM_PRAT = ['Finanças e Desenvolvimento Pessoal', 'Suspense e Terror', 'Sherlock Holmes', 'Ficção Científica e Distopia', 'Infantojuvenil e Mangá', 'Clássicos', 'Psicologia', 'Contabilidade'];
  const STATUS = { lendo: ['📖', 'Lendo'], lido: ['✓', 'Lido'], desistiu: ['✕', 'Desistiu'] };
  const DESEJOS = '__desejos';
  const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const chave = t => semAcento(t).replace(/[^a-z0-9]+/g, ' ').trim();

  // ------------------------------------------------------------------ dados guardados no app (cfg.biblioteca)
  function D() {
    const c = A().cfg();
    if (!c.biblioteca || typeof c.biblioteca !== 'object') c.biblioteca = {};
    const b = c.biblioteca;
    for (const k of ['notas', 'capas', 'capasAuto', 'resumos', 'status']) if (!b[k] || typeof b[k] !== 'object' || Array.isArray(b[k])) b[k] = {};
    for (const k of ['extras', 'desejos']) if (!Array.isArray(b[k])) b[k] = [];
    // capas que este aparelho já tinha achado (versão antiga guardava só aqui): passam para o app, para todos os aparelhos
    if (!b._capasMigradas) {
      try { const velho = JSON.parse(localStorage.getItem('kwik-bib-capas') || '{}'); for (const [k, v] of Object.entries(velho)) if (v && v.url && !b.capasAuto[k]) b.capasAuto[k] = v; } catch (e) { /* ok */ }
      b._capasMigradas = 1;
    }
    return b;
  }
  const salvar = () => A().salvar();

  const S = { livros: [] };
  function carregar() {
    const emb = window.KM_BIBLIOTECA || { livros: [] };
    const base = (emb.livros || []).map(l => Object.assign({}, l));
    const vistos = new Set(base.map(l => chave(l.t)));
    for (const x of D().extras) if (!vistos.has(chave(x.t))) base.push(Object.assign({ extra: true }, x));
    S.livros = base;
  }

  // valores finais de um livro (o que você mudou no app vale mais)
  const notaDe = l => { const n = D().notas[chave(l.t)]; return n != null ? n : (l.nota || 0); };
  const capaDe = l => D().capas[chave(l.t)] || (D().capasAuto[chave(l.t)] || {}).url || l.capa || '';
  const sobreDe = l => l.sobre || D().resumos[chave(l.t)] || '';
  const statusDe = l => { const s = D().status[chave(l.t)]; const v = s != null ? s : semAcento(l.status); return STATUS[v] ? v : ''; };

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
      for (const e of ed) if (e.cover_i) out.push({ fonte: 'Open Library', t: e.title || d.title, titulo: e.title || d.title, autor: (d.author_name || []).join(', '), ano: (String(e.publish_date || '').match(/\d{4}/) || [''])[0], editora: (e.publisher || [])[0] || '', lang: (e.language || [])[0] || '', capa: `https://covers.openlibrary.org/b/id/${e.cover_i}-L.jpg`, sobre: '' });
      if (d.cover_i) out.push({ fonte: 'Open Library', t: d.title, titulo: d.title, autor: (d.author_name || []).join(', '), ano: String(d.first_publish_year || ''), editora: '', lang: '', capa: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`, sobre: '' });
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
  async function resumoOnline(titulo, autor) {
    try { const g = (await googleLivros(titulo, autor, 10)).filter(x => x.sobre && parecido(x.titulo, titulo)); if (g.length) return g.sort((a, b) => b.sobre.length - a.sobre.length)[0].sobre; } catch (e) { /* tenta a Wikipédia */ }
    try { return await wikipedia(titulo, autor); } catch (e) { return ''; }
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

  // procura sozinha a capa mais recente de cada livro (uma de cada vez; guarda no app por 30 dias)
  let filaRodando = false;
  async function atualizarCapas(aoMudar) {
    if (filaRodando || !navigator.onLine) return;
    filaRodando = true;
    try {
      for (const l of [...S.livros, ...D().desejos]) {
        const k = chave(l.t);
        if (D().capas[k]) continue;
        const c = D().capasAuto[k];
        if (c && Date.now() - c.em < (c.url ? 30 : 1) * 864e5) continue;
        let url = '';
        try {
          const g = (await googleLivros(l.t, l.autor, 20)).filter(x => x.capa && x.lang === 'pt' && parecido(x.titulo, l.t));
          g.sort((a, b) => String(b.data).localeCompare(String(a.data)));
          url = g.length ? g[0].capa : '';
        } catch (e) { if (/cota/.test(e.message)) break; } // sem cota hoje: tenta de novo outro dia
        if (!url && !l.capa) { try { const o = await openLibrary(l.t, l.autor); url = o.length ? o[0].capa : ''; } catch (e) { /* ok */ } }
        D().capasAuto[k] = { url: url || (c && c.url) || '', em: Date.now() }; salvar();
        if (url) aoMudar(l);
        await new Promise(r => setTimeout(r, 700));
      }
    } finally { filaRodando = false; }
  }

  // ------------------------------------------------------------------ tela
  let corpoAtual = null, acoesAtual = null;
  const vista = { prat: null, busca: '', ordem: 'padrao' };
  const ordenarLivros = ls => ls.slice().sort((a, b) => (parseInt(a.ordem, 10) || 999) - (parseInt(b.ordem, 10) || 999) || a.t.localeCompare(b.t, 'pt-BR'));
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

  function estrelas(l, grande) {
    const n = notaDe(l), box = el('div', { class: 'bb-estrelas' + (grande ? ' grande' : ''), role: 'radiogroup', 'aria-label': 'Sua avaliação' });
    for (let i = 1; i <= 5; i++) {
      box.append(el('button', { class: i <= n ? 'on' : '', title: `${i} estrela${i > 1 ? 's' : ''}`, 'aria-label': `${i} estrela${i > 1 ? 's' : ''}`,
        onclick: e => { e.stopPropagation(); avaliar(l, i === n ? 0 : i); } }, '★'));
    }
    return box;
  }
  function avaliar(l, n) {
    const k = chave(l.t);
    D().notas[k] = n; salvar();
    document.querySelectorAll(`[data-k="${CSS.escape(k)}"] .bb-estrelas`).forEach(b => [...b.children].forEach((s, i) => s.classList.toggle('on', i < n)));
    if (KM.tocar) KM.tocar('clique');
  }
  function mudarStatus(l, s) {
    D().status[chave(l.t)] = s; salvar();
    toast(s ? `${STATUS[s][0]} ${l.t}: ${STATUS[s][1].toLowerCase()}` : 'Etiqueta tirada');
  }
  const selo = l => { const s = statusDe(l); return s ? el('em', { class: 'bb-selo s-' + s }, STATUS[s][1]) : null; };
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
      el('button', { class: 'bb-livro-capa', title: 'Ver ' + l.t, onclick: () => detalhe(l) }, imgCapa(l), selo(l)),
      el('b', { class: 'bb-livro-t' }, l.t), el('small', { class: 'bb-livro-a' }, l.autor || ' '), estrelas(l));
  }
  function cartaoDesejo(d) {
    return el('div', { class: 'bb-livro', 'data-k': chave(d.t) },
      el('button', { class: 'bb-livro-capa', title: 'Ver ' + d.t, onclick: () => detalheDesejo(d) }, imgCapa(d), el('em', { class: 'bb-selo s-desejo' }, 'Quero ler')),
      el('b', { class: 'bb-livro-t' }, d.t), el('small', { class: 'bb-livro-a' }, d.autor || ' '),
      el('button', { class: 'bb-mini', onclick: () => comecarDesejo(d) }, '📖 Comecei a ler'));
  }
  function cartaoPrat(p) {
    const topo = p.livros.find(l => capaDe(l)) || p.livros[0];
    const ns = p.livros.map(notaDe).filter(Boolean), media = ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0;
    return el('button', { class: 'bb-prat', onclick: () => { vista.prat = p.nome; render(); } },
      el('div', { class: 'bb-prat-arte' },
        el('div', { class: 'bb-pilha', 'aria-hidden': 'true' }, el('i', { class: 'l1' }), el('i', { class: 'l2' }), el('i', { class: 'l3' })),
        topo ? imgCapa(topo, 'bb-topo') : null,
        el('span', { class: 'bb-prat-qtd' }, String(p.livros.length), el('small', {}, p.livros.length === 1 ? ' livro' : ' livros'))),
      el('span', { class: 'bb-prat-nome' }, p.nome),
      media ? el('small', { class: 'bb-prat-media' }, '★ ' + media.toFixed(1).replace('.', ',')) : null);
  }
  function faixaDesejos() {
    const ds = D().desejos;
    return el('button', { class: 'bb-desejos', onclick: () => { vista.prat = DESEJOS; render(); } },
      el('span', { class: 'bb-desejos-tit' }, el('b', {}, '💭 Lista de desejos'), el('small', {}, ds.length ? `${ds.length} livro${ds.length === 1 ? '' : 's'} que você quer ler` : 'Toque para guardar os livros que você quer ler')),
      el('span', { class: 'bb-desejos-capas' }, ds.slice(-6).reverse().map(d => imgCapa(d, 'mini'))),
      el('i', {}, '›'));
  }

  function acoes() {
    if (!acoesAtual) return;
    acoesAtual.innerHTML = '';
    acoesAtual.append(vista.prat === DESEJOS
      ? el('button', { class: 'appv-bt prim', onclick: () => adicionar('', 'desejo') }, '＋ Desejo')
      : el('button', { class: 'appv-bt prim', onclick: () => adicionar('', 'estante') }, '＋ Livro'));
  }
  function render() {
    const corpo = corpoAtual; if (!corpo) return;
    acoes();
    const rolagem = corpo.scrollTop;
    corpo.innerHTML = '';
    const prats = prateleiras(), q = semAcento(vista.busca);
    const ORD = { padrao: 'Ordem da estante', nome: 'Nome (A–Z)', qtd: 'Mais livros' };
    const titulo = vista.prat === DESEJOS ? '💭 Lista de desejos' : vista.prat;
    corpo.append(el('header', { class: 'bb-barra' },
      el('button', { class: 'bb-casa', title: 'Todas as prateleiras', onclick: () => { vista.prat = null; render(); } }, '🏛️', el('span', {}, '›')),
      titulo ? el('b', { class: 'bb-onde' }, titulo) : el('span', { class: 'bb-onde' }, `${prats.length} prateleiras · ${S.livros.length} livros`),
      el('input', { class: 'bb-busca', type: 'search', placeholder: 'Buscar livro ou autor', value: vista.busca, oninput: e => { vista.busca = e.target.value; const p = e.target.selectionStart; render(); const n = corpo.querySelector('.bb-busca'); n.focus(); n.setSelectionRange(p, p); } }),
      vista.prat ? null : el('button', { class: 'bb-ordem', title: 'Ordenar: ' + ORD[vista.ordem], onclick: () => { vista.ordem = { padrao: 'nome', nome: 'qtd', qtd: 'padrao' }[vista.ordem]; render(); toast('Ordem: ' + ORD[vista.ordem]); } }, '⇅')));

    if (q) {
      const achados = S.livros.filter(l => semAcento(l.t + ' ' + l.autor + ' ' + l.prateleira).includes(q));
      const desejos = D().desejos.filter(d => semAcento(d.t + ' ' + d.autor).includes(q));
      corpo.append(el('h3', { class: 'bb-sec' }, `${achados.length + desejos.length} resultado${achados.length + desejos.length === 1 ? '' : 's'}`),
        el('div', { class: 'bb-livros' }, ordenarLivros(achados).map(cartaoLivro), desejos.map(cartaoDesejo)));
      if (!achados.length && !desejos.length) corpo.append(el('p', { class: 'bb-vazio' }, 'Nenhum livro com esse nome. ',
        el('button', { class: 'bb-link', onclick: () => adicionar(vista.busca, 'estante') }, '＋ Pôr na estante'), ' · ',
        el('button', { class: 'bb-link', onclick: () => adicionar(vista.busca, 'desejo') }, '💭 Pôr na lista de desejos')));
      return;
    }
    if (vista.prat === DESEJOS) {
      const ds = D().desejos.slice().reverse();
      if (!ds.length) corpo.append(el('p', { class: 'bb-vazio grande' }, 'Sua lista de desejos está vazia. ', el('button', { class: 'bb-link', onclick: () => adicionar('', 'desejo') }, '＋ Adicionar um livro que você quer ler')));
      corpo.append(el('div', { class: 'bb-livros' }, ds.map(cartaoDesejo)));
      corpo.scrollTop = rolagem; return;
    }
    if (vista.prat) {
      const p = prats.find(x => x.nome === vista.prat);
      if (!p) { vista.prat = null; return render(); }
      corpo.append(el('div', { class: 'bb-livros' }, p.livros.map(cartaoLivro)));
      corpo.scrollTop = rolagem; return;
    }
    corpo.append(faixaDesejos(), el('div', { class: 'bb-prats' }, prats.map(cartaoPrat)),
      el('h3', { class: 'bb-sec' }, 'Todos os livros'), el('div', { class: 'bb-livros' }, ordenarLivros(S.livros).map(cartaoLivro)));
    corpo.scrollTop = rolagem;
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
  function blocoSobre(l) {
    const k = chave(l.t), texto = el('div', { class: 'bb-sobre' });
    const pintar = s => { texto.innerHTML = ''; (s || '').split(/\n{2,}/).forEach(par => texto.append(el('p', {}, par.replace(/\n/g, ' ')))); };
    const s = sobreDe(l);
    if (s) pintar(s);
    else {
      texto.append(el('p', { class: 'bb-carregando' }, 'Procurando o resumo…'));
      resumoOnline(l.t, l.autor).then(r => { if (r) { D().resumos[k] = r; salvar(); } pintar(r || 'Não achei um resumo na internet para este livro.'); });
    }
    return texto;
  }

  function detalhe(l) {
    const k = chave(l.t);
    const capaBox = el('div', { class: 'bb-det-capa' }, imgCapa(l));
    const etiquetas = el('div', { class: 'bb-status' });
    const pintarEtiquetas = () => {
      etiquetas.innerHTML = ''; const atual = statusDe(l);
      for (const [s, [ic, nome]] of Object.entries(STATUS)) etiquetas.append(el('button', { class: 's-' + s + (atual === s ? ' on' : ''), onclick: () => { mudarStatus(l, atual === s ? '' : s); pintarEtiquetas(); render(); } }, ic + ' ' + nome));
    };
    pintarEtiquetas();
    const j = janela(l.t,
      el('div', { class: 'bb-det' }, capaBox,
        el('div', { class: 'bb-det-info' },
          el('h2', {}, l.t), l.autor ? el('p', { class: 'bb-det-autor' }, l.autor) : null,
          el('p', { class: 'bb-det-tags' }, el('span', {}, '📚 ' + l.prateleira)),
          etiquetas,
          el('div', { 'data-k': k }, estrelas(l, true)),
          el('h4', {}, 'Sobre o que é'), blocoSobre(l),
          el('div', { class: 'bb-det-acoes' },
            el('button', { class: 'bb-bt', onclick: () => trocarCapa(l, () => { capaBox.innerHTML = ''; capaBox.append(imgCapa(l)); render(); }) }, '🖼️ Trocar capa'),
            l.extra ? el('button', { class: 'bb-bt perigo', onclick: () => { if (!confirm(`Tirar "${l.t}" da biblioteca?`)) return; const b = D(); b.extras = b.extras.filter(x => chave(x.t) !== k); salvar(); carregar(); j.fechar(); render(); } }, '🗑️ Tirar da estante') : null))));
  }
  function detalheDesejo(d) {
    const j = janela(d.t,
      el('div', { class: 'bb-det' }, el('div', { class: 'bb-det-capa' }, imgCapa(d)),
        el('div', { class: 'bb-det-info' },
          el('h2', {}, d.t), d.autor ? el('p', { class: 'bb-det-autor' }, d.autor) : null,
          el('p', { class: 'bb-det-tags' }, el('span', {}, '💭 Lista de desejos'), d.ano ? el('span', {}, d.ano) : null),
          el('h4', {}, 'Sobre o que é'), blocoSobre(d),
          el('div', { class: 'bb-det-acoes' },
            el('button', { class: 'bb-bt prim', onclick: () => { j.fechar(); comecarDesejo(d); } }, '📖 Comecei a ler'),
            el('button', { class: 'bb-bt', onclick: () => trocarCapa(d, () => { j.fechar(); render(); detalheDesejo(d); }) }, '🖼️ Trocar capa'),
            el('button', { class: 'bb-bt perigo', onclick: () => { if (!confirm(`Tirar "${d.t}" da lista de desejos?`)) return; tirarDesejo(d); j.fechar(); render(); } }, '🗑️ Tirar da lista')))));
  }
  function tirarDesejo(d) { const b = D(); b.desejos = b.desejos.filter(x => chave(x.t) !== chave(d.t)); salvar(); }
  // da lista de desejos para uma prateleira, já como "lendo"
  function comecarDesejo(d) {
    const prat = seletorPrateleira();
    const j = janela('📖 Comecei a ler · ' + d.t,
      el('div', { class: 'bb-form' }, el('p', { class: 'bb-dica' }, 'Em qual prateleira ele fica?'), prat.campo),
      el('div', { class: 'bb-det-acoes' }, el('button', { class: 'bb-bt prim', onclick: () => {
        const p = prat.valor(); if (!p) return;
        if (S.livros.some(l => chave(l.t) === chave(d.t))) { tirarDesejo(d); j.fechar(); render(); return toast('Esse livro já estava na estante; saiu da lista de desejos'); }
        D().extras.push({ t: d.t, autor: d.autor || '', prateleira: p, capa: d.capa || '', status: 'lendo', ordem: '', nota: 0, sobre: d.sobre || '', ano: d.ano || '', editora: d.editora || '', em: Date.now() });
        D().status[chave(d.t)] = 'lendo'; tirarDesejo(d); carregar();
        j.fechar(); vista.prat = p; render(); toast(`📖 "${d.t}" foi para ${p} como lendo`);
      } }, '📚 Pôr na estante')));
  }
  function seletorPrateleira(inicial) {
    const prats = prateleiras().map(p => p.nome);
    const sel = el('select', { class: 'bb-campo' }, prats.map(p => el('option', { value: p }, p)), el('option', { value: '__nova' }, '＋ Nova prateleira…'));
    if (inicial && prats.includes(inicial)) sel.value = inicial;
    return { campo: sel, valor: () => {
      if (sel.value !== '__nova') return sel.value;
      return (prompt('Nome da nova prateleira:') || '').trim().replace(/[\\/:*?"<>|]/g, '');
    } };
  }

  function trocarCapa(l, depois) {
    const grade = el('div', { class: 'bb-edicoes' }, el('p', { class: 'bb-carregando' }, 'Procurando as edições…'));
    const url = el('input', { type: 'url', placeholder: 'ou cole o link de uma imagem de capa', class: 'bb-campo' });
    const j = janela('Trocar capa · ' + l.t, grade,
      el('div', { class: 'bb-linha' }, url, el('button', { class: 'bb-bt prim', onclick: () => { if (/^https?:\/\//.test(url.value.trim())) escolher(url.value.trim()); else toast('Cole um link que comece com https://'); } }, 'Usar')));
    function escolher(u) { D().capas[chave(l.t)] = u; salvar(); j.fechar(); depois(); toast('🖼️ Capa trocada'); }
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

  // destino: 'estante' (prateleira + etiqueta) ou 'desejo' (lista de desejos)
  function adicionar(tituloInicial, destino) {
    const desejo = destino === 'desejo';
    const titulo = el('input', { class: 'bb-campo', placeholder: 'Título do livro', value: tituloInicial || '' });
    const autor = el('input', { class: 'bb-campo', placeholder: 'Autor (opcional, ajuda a achar)' });
    const prat = seletorPrateleira(vista.prat);
    const status = el('select', { class: 'bb-campo' }, Object.entries(STATUS).map(([s, [, nome]]) => el('option', { value: s }, nome)));
    const res = el('div', { class: 'bb-achados' });
    let escolhido = null;
    const buscar = async () => {
      const t = titulo.value.trim(); if (!t) return titulo.focus();
      res.innerHTML = ''; res.append(el('p', { class: 'bb-carregando' }, 'Procurando "' + t + '"…'));
      let lista = [];
      try { lista = (await googleLivros(t, autor.value.trim(), 12)).filter(x => x.titulo); } catch (e) { /* reserva */ }
      if (!lista.length) { try { lista = (await openLibrary(t, autor.value.trim())).slice(0, 6); } catch (e) { /* nada */ } }
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
    const j = janela(desejo ? '💭 Adicionar à lista de desejos' : '＋ Adicionar livro à estante',
      el('div', { class: 'bb-form' }, titulo, autor, desejo ? null : el('div', { class: 'bb-linha' }, prat.campo, status), el('button', { class: 'bb-bt prim', onclick: buscar }, '🔎 Buscar resumo e capa')),
      res,
      el('div', { class: 'bb-det-acoes' }, el('button', { class: 'bb-bt prim', onclick: () => salvarNovo() }, desejo ? '💭 Pôr na lista de desejos' : '📚 Pôr na estante')));
    titulo.addEventListener('keydown', e => { if (e.key === 'Enter') buscar(); });
    autor.addEventListener('keydown', e => { if (e.key === 'Enter') buscar(); });
    setTimeout(() => titulo.focus(), 30);
    if (tituloInicial) buscar();

    async function salvarNovo() {
      const t = (titulo.value.trim() || (escolhido && escolhido.titulo) || '').replace(/[\\/:*?"<>|#^[\]]/g, '').trim();
      if (!t) return titulo.focus();
      const naEstante = S.livros.some(l => chave(l.t) === chave(t)), naLista = D().desejos.some(d => chave(d.t) === chave(t));
      if (naEstante) return toast('Esse livro já está na estante 🙂');
      if (desejo && naLista) return toast('Esse livro já está na lista de desejos 🙂');
      const p = desejo ? '' : prat.valor(); if (!desejo && !p) return;
      const x = escolhido || {};
      let sobre = x.sobre || '';
      if (!sobre) { toast('Procurando o resumo…'); sobre = await resumoOnline(t, autor.value.trim() || x.autor); }
      const novo = { t, autor: autor.value.trim() || x.autor || '', capa: x.capa || '', sobre, ano: x.ano || '', editora: x.editora || '', em: Date.now() };
      if (desejo) {
        D().desejos.push(novo); salvar();
        j.fechar(); vista.busca = ''; vista.prat = DESEJOS; render(); toast(`💭 "${t}" está na sua lista de desejos`);
        return;
      }
      if (naLista) tirarDesejo({ t });
      D().extras.push(Object.assign(novo, { prateleira: p, status: status.value, ordem: '', nota: 0 }));
      D().status[chave(t)] = status.value; salvar(); carregar();
      j.fechar(); vista.busca = ''; vista.prat = p; render(); toast(`📚 "${t}" adicionado`);
      detalhe(S.livros.find(l => chave(l.t) === chave(t)));
    }
  }

  // ------------------------------------------------------------------ app na tela inicial
  function abrir(corpo, acoesBox) {
    corpoAtual = corpo; acoesAtual = acoesBox; corpo.classList.add('bb-corpo');
    carregar();
    render();
    atualizarCapas(l => { if (corpoAtual === corpo) document.querySelectorAll(`[data-k="${CSS.escape(chave(l.t))}"] .bb-capa`).forEach(b => b.replaceWith(imgCapa(l))); });
  }
  function resumo() {
    const livros = S.livros.length ? S.livros : ((window.KM_BIBLIOTECA || {}).livros || []);
    if (!livros.length) return null;
    const av = livros.filter(l => notaDe(l)).length, ds = D().desejos.length;
    return { txt: `${livros.length} livros · ${av} avaliado${av === 1 ? '' : 's'}${ds ? ` · ${ds} na lista de desejos` : ''}` };
  }
  function registrar() {
    if (!KM.inicio || !KM.app) return setTimeout(registrar, 50);
    KM.inicio.registrar('biblioteca', { nome: 'Biblioteca', ic: '📚', abrir, sair: () => { corpoAtual = null; acoesAtual = null; document.querySelectorAll('.bb-fundo').forEach(f => f.remove()); }, resumo });
  }
  KM.biblioteca = { abrir: () => KM.inicio && KM.inicio.abrirApp && KM.inicio.abrirApp('biblioteca') };
  registrar();
})();
