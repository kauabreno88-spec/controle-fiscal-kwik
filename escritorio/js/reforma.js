/* KWIK Mini Escritório · ⚖️ Reforma tributária: a LC 214/2025 inteira, separada por nicho de empresa e por situação.
   - Busca no topo: qualquer palavra ou frase (sem ligar para acento ou maiúscula), "frase exata" entre aspas, ou
     "art. 127" para ir direto ao artigo. Procura nos 544 artigos e nos anexos e destaca o que achou.
   - Nichos (saúde, agro, imóveis, Simples/MEI…) e situações (alíquotas, créditos, split payment, transição…): os artigos
     centrais vêm primeiro (pela estrutura da lei) e depois os que também tocam no assunto.
   - A lei inteira pela estrutura (livro › título › capítulo) e os anexos (cesta básica, medicamentos, tabelas do Simples…).
   Os dados ficam em js/lc214-dados.js (gerado do PDF do DOU) e só carregam quando a tela abre. Funciona sem internet. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const el = (...a) => A().el(...a);
  const toast = (m, o) => A().toast(m, o);
  let L = null, corpoApp = null, visao = { tipo: 'inicio' }, busca = '', escopo = 'tudo', limite = 30;

  function carregarLei() {
    if (window.KM_LC214) return Promise.resolve(window.KM_LC214);
    return new Promise((res, rej) => {
      const v = (document.querySelector('script[src*="reforma.js"]') || {}).src || '';
      const s = document.createElement('script'); s.src = 'js/lc214-dados.js' + ((v.match(/\?v=\d+/) || [''])[0]);
      s.onload = () => res(window.KM_LC214); s.onerror = () => rej(new Error('Não consegui carregar o texto da lei'));
      document.head.append(s);
    });
  }
  function preparar(d) {
    if (d._pronto) return d;
    d.porN = new Map(d.arts.map(a => [a.n, a]));
    for (const a of d.arts) { a.id = 'art-' + a.n + (a.s ? '-' + a.s : ''); a.txt = a.p.join('\n'); a.norm = semAcento(a.txt); a.cab = a.e.map(e => e.nome).join(' › '); }
    for (const x of d.anexos) { x.txt = x.p.join('\n'); x.norm = semAcento(x.titulo + '\n' + x.txt); }
    d.temas = [...d.nichos.map(t => Object.assign(t, { grupo: 'nicho' })), ...d.situacoes.map(t => Object.assign(t, { grupo: 'situacao' }))];
    d._pronto = true;
    return d;
  }

  // ------------------------------------------------------------------ busca sem acento, com destaque no texto original
  const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const VAR = { a: 'aáàâãä', e: 'eéèêë', i: 'iíìîï', o: 'oóòôõö', u: 'uúùûü', c: 'cç', n: 'nñ' };
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const padrao = termo => [...semAcento(termo)].map(ch => (VAR[ch] ? `[${VAR[ch]}${VAR[ch].toUpperCase()}]` : /\s/.test(ch) ? '\\s+' : escRe(ch))).join('');
  function entender(q) {
    q = q.trim();
    const art = /^(?:art(?:igo)?\.?\s*)(\d{1,3})\s*$/i.exec(q) || /^(\d{1,3})$/.exec(q);
    if (art) return { art: Number(art[1]) };
    const frases = [], palavras = [];
    q.replace(/["“”]([^"“”]+)["“”]/g, (_, f) => { frases.push(f.trim()); return ' '; }).split(/\s+/).filter(Boolean).forEach(w => { if ((w.length >= 2 || /\d/.test(w)) && !VAZIAS.has(semAcento(w))) palavras.push(w); });
    if (!frases.length && palavras.length > 1) frases.push(q.replace(/["“”]/g, '')); // a frase inteira vale mais
    return { frases, palavras: frases.length && !palavras.length ? [] : palavras, exata: /["“”]/.test(q) };
  }
  function pontuar(norm, Q) {
    if (Q.exata) { let p = 0; for (const f of Q.frases) { const k = contar(norm, semAcento(f)); if (!k) return 0; p += k * 10; } return p; }
    let p = 0;
    for (const w of Q.palavras) { const k = contar(norm, semAcento(w)); if (!k) return 0; p += Math.min(k, 6); }
    for (const f of Q.frases) p += contar(norm, semAcento(f)) * 15;
    return p;
  }
  // palavras curtas (MEI, ISS, IPI…) só contam inteiras: "mei" não acha "meio"
  const VAZIAS = new Set('de da do das dos e o a os as em no na nos nas ao aos para por pelo pela com que se ou um uma'.split(' '));
  const inteira = s => s.length <= 3 && /^[a-z0-9]+$/.test(s);
  function contar(t, s) {
    if (!s) return 0;
    if (inteira(s)) return (t.match(new RegExp('(?:^|[^a-z0-9])' + escRe(s) + '(?=$|[^a-z0-9])', 'g')) || []).length;
    let n = 0, i = 0; while ((i = t.indexOf(s, i)) >= 0) { n++; i += s.length; } return n;
  }
  function destacar(texto, Q) {
    const termos = Q && !Q.art ? [...(Q.exata ? Q.frases : [...Q.frases, ...Q.palavras])].filter(Boolean).sort((a, b) => b.length - a.length) : [];
    const esc = esc1(texto);
    if (!termos.length) return esc;
    let re;
    try { re = new RegExp('(' + termos.map(t => (inteira(semAcento(t)) ? '(?<![A-Za-zÀ-ÿ0-9])' + padrao(t) + '(?![A-Za-zÀ-ÿ0-9])' : padrao(esc1(t)))).join('|') + ')', 'gi'); }
    catch (e) { re = new RegExp('(' + termos.map(t => padrao(esc1(t))).join('|') + ')', 'gi'); } // navegador antigo sem lookbehind
    return esc.replace(re, '<mark>$1</mark>');
  }
  const esc1 = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ------------------------------------------------------------------ tela
  async function abrir(corpo, acoes) {
    corpoApp = corpo; corpo.classList.add('zf-corpo');
    acoes.append(el('a', { class: 'appv-bt', href: 'https://www.in.gov.br/en/web/dou/-/lei-complementar-n-214-de-16-de-janeiro-de-2025-607430757', target: '_blank', rel: 'noopener', title: 'Abrir a publicação oficial no Diário Oficial da União' }, '📰 DOU'));
    corpo.innerHTML = '<p class="rf-carrega">⚖️ Abrindo a LC 214/2025…</p>';
    try { L = preparar(await carregarLei()); } catch (e) { corpo.innerHTML = ''; corpo.append(el('p', { class: 'rf-vazio' }, '❌ ' + e.message)); return; }
    const h = (location.hash.match(/#app-reforma\/(.+)$/) || [])[1];
    if (h) irPara(decodeURIComponent(h), true);
    render();
  }
  function sair() { corpoApp = null; }
  function irPara(chave, silencioso) {
    escopo = 'tudo';
    if (/^art-\d+/.test(chave)) visao = { tipo: 'artigo', n: Number(chave.split('-')[1]) };
    else if (/^anexo-/.test(chave)) visao = { tipo: 'anexo', id: chave.slice(6) };
    else if (L.temas.find(t => t.id === chave)) visao = { tipo: 'tema', id: chave };
    else if (chave === 'estrutura') visao = { tipo: 'estrutura' };
    else visao = { tipo: 'inicio' };
    if (!silencioso) { limite = 30; render(); }
  }
  function render() {
    if (!corpoApp) return;
    const foco = document.activeElement && document.activeElement.id === 'rfBusca' ? document.activeElement.selectionStart : null;
    corpoApp.innerHTML = '';
    const lado = el('aside', { class: 'zf-lado rf-lado' }), main = el('main', { class: 'zf-main rf-main' });
    corpoApp.append(el('div', { class: 'zf rf' }, lado, main));
    pintarLado(lado);
    pintarTopo(main);
    const conteudo = el('div', { id: 'rfConteudo' }); main.append(conteudo);
    pintarConteudo(conteudo);
    if (foco != null) { const b = document.getElementById('rfBusca'); if (b) { b.focus(); b.setSelectionRange(foco, foco); } }
  }
  function pintarLado(lado) {
    const item = (chave, ic, nome, n, ativo) => el('button', { class: 'zf-item' + (ativo ? ' on' : ''), title: nome, onclick: () => { busca = ''; irPara(chave); } }, el('span', {}, ic), el('i', { class: 'rf-nome' }, nome), n != null ? el('em', { class: 'zf-cont' }, String(n)) : null);
    const tema = visao.tipo === 'tema' ? visao.id : '';
    lado.append(el('div', { class: 'zf-marca' }, el('b', {}, '⚖️ Reforma'), el('small', {}, 'LC 214/2025 · IBS, CBS e IS')),
      item('inicio', '🏠', 'Visão geral', null, visao.tipo === 'inicio' && !busca),
      el('div', { class: 'zf-sec' }, 'Por nicho de empresa'),
      ...L.nichos.map(t => item(t.id, t.ic, curto(t.nome), t.arts.length + t.lig.length, tema === t.id)),
      el('div', { class: 'zf-sec' }, 'Por situação'),
      ...L.situacoes.map(t => item(t.id, t.ic, curto(t.nome), t.arts.length + t.lig.length, tema === t.id)),
      el('div', { class: 'zf-sec' }, 'A lei inteira'),
      item('estrutura', '📖', 'Índice da lei (544 artigos)', null, visao.tipo === 'estrutura'),
      ...L.anexos.map(x => item('anexo-' + x.id, '📎', `Anexo ${x.id}: ${curto(x.titulo, 34)}`, null, visao.tipo === 'anexo' && visao.id === x.id)));
  }
  const curto = (s, n = 30) => { const t = s.split(':')[0]; return t.length > n ? t.slice(0, n - 1) + '…' : t; };
  function pintarTopo(main) {
    const inp = el('input', { id: 'rfBusca', class: 'zf-busca rf-busca', type: 'search', autocomplete: 'off', value: busca,
      placeholder: '🔎 Pesquise qualquer palavra ou frase na lei: split payment, "reduzidas em 60%", MEI, farmácia, art. 127…' });
    let t = 0;
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { busca = inp.value; limite = 30; const c = document.getElementById('rfConteudo'); if (c) { c.innerHTML = ''; pintarConteudo(c); } pintarEscopo(); }, 220); });
    inp.addEventListener('keydown', e => { if (e.key === 'Escape') { inp.value = ''; busca = ''; render(); } });
    const escopoBox = el('div', { class: 'rf-escopo', id: 'rfEscopo' });
    main.append(el('div', { class: 'zf-topo rf-topo' }, inp, escopoBox));
    pintarEscopo();
    if (!busca) setTimeout(() => { if (window.matchMedia('(min-width: 761px)').matches) inp.focus(); }, 50);
  }
  function pintarEscopo() {
    const box = document.getElementById('rfEscopo'); if (!box) return; box.innerHTML = '';
    const t = visao.tipo === 'tema' && L.temas.find(x => x.id === visao.id);
    if (!busca.trim() || !t) return;
    const bt = (k, txt) => el('button', { class: 'rf-chip' + (escopo === k ? ' on' : ''), onclick: () => { escopo = k; limite = 30; render(); } }, txt);
    box.append(el('small', {}, 'Procurar em: '), bt('tudo', 'toda a lei'), bt('tema', `só ${t.ic} ${curto(t.nome, 26)}`));
  }

  function pintarConteudo(box) {
    if (busca.trim()) return pintarBusca(box);
    if (visao.tipo === 'tema') return pintarTema(box, L.temas.find(t => t.id === visao.id));
    if (visao.tipo === 'estrutura') return pintarEstrutura(box);
    if (visao.tipo === 'anexo') return pintarAnexo(box, L.anexos.find(x => x.id === visao.id));
    if (visao.tipo === 'artigo') return pintarArtigoContexto(box, visao.n);
    pintarInicio(box);
  }

  // ---- visão geral
  function pintarInicio(box) {
    box.append(el('div', { class: 'rf-hero' },
      el('div', {}, el('h2', {}, 'Lei Complementar nº 214/2025'), el('p', {}, L.ementa),
        el('small', {}, `${L.arts.length} artigos e ${L.anexos.length} anexos · fonte: ${L.fonte}.`)),
      el('div', { class: 'rf-aviso' }, '⚠️ Este é o texto original publicado em 16/01/2025. Mudanças feitas depois (por exemplo, pela LC 227/2026 e pelos regulamentos) não aparecem aqui: confira a versão atualizada antes de orientar um cliente.')));
    const grade = (titulo, temas) => [el('h3', { class: 'rf-h3' }, titulo), el('div', { class: 'rf-grade' }, temas.map((t, i) => el('button', { class: 'rf-card', style: `--i:${i}`, onclick: () => irPara(t.id) },
      el('span', { class: 'rf-card-ic' }, t.ic), el('b', {}, t.nome), el('p', {}, t.desc), el('small', {}, `${t.arts.length} artigos principais${t.lig.length ? ` · +${t.lig.length} relacionados` : ''}${t.ax.length ? ` · ${t.ax.length} anexo(s)` : ''}`))))];
    box.append(...grade('🏢 Por nicho de empresa', L.nichos), ...grade('🧭 Por situação', L.situacoes));
  }

  // ---- um tema (nicho ou situação)
  function pintarTema(box, t) {
    if (!t) return pintarInicio(box);
    box.append(el('div', { class: 'rf-tema-cab' }, el('span', { class: 'rf-card-ic grande' }, t.ic),
      el('div', {}, el('small', {}, t.grupo === 'nicho' ? 'Nicho de empresa' : 'Situação'), el('h2', {}, t.nome), el('p', {}, t.desc))));
    if (t.ax.length) box.append(el('div', { class: 'rf-anexos-lig' }, el('b', {}, '📎 Anexos ligados: '), t.ax.map(id => { const x = L.anexos.find(a => a.id === id); return x ? el('button', { class: 'rf-chip', onclick: () => irPara('anexo-' + id) }, `Anexo ${id} · ${curto(x.titulo, 44)}`) : null; })));
    const princ = t.arts.map(n => L.porN.get(n)).filter(Boolean), lig = t.lig.map(n => L.porN.get(n)).filter(Boolean);
    if (princ.length) { box.append(el('h3', { class: 'rf-h3' }, `Artigos principais (${princ.length})`)); lista(box, princ, null, 'p'); }
    if (lig.length) {
      const det = el('details', { class: 'rf-det', open: !princ.length }, el('summary', {}, `Outros artigos que também falam disso (${lig.length})`));
      box.append(det); lista(det, lig, null, 'l');
    }
    if (!princ.length && !lig.length) box.append(el('p', { class: 'rf-vazio' }, 'Nenhum artigo encontrado para este tema.'));
  }

  // ---- busca
  function pintarBusca(box) {
    const Q = entender(busca);
    if (Q.art) {
      const a = L.porN.get(Q.art);
      if (!a) { box.append(el('p', { class: 'rf-vazio' }, `A LC 214 tem artigos de 1 a ${L.arts.length}.`)); return; }
      box.append(el('p', { class: 'rf-res-info' }, `Artigo ${Q.art} da LC 214/2025`)); box.append(cartao(a, null, true)); return;
    }
    const t = visao.tipo === 'tema' && escopo === 'tema' && L.temas.find(x => x.id === visao.id);
    const dentro = t ? new Set([...t.arts, ...t.lig]) : null;
    const res = [];
    for (const a of L.arts) { if (dentro && !dentro.has(a.n)) continue; const p = pontuar(a.norm, Q); if (p) res.push([p + (semAcento(a.cab).includes(semAcento(busca)) ? 8 : 0), a]); }
    const rx = [];
    if (!dentro || (t && t.ax.length)) for (const x of L.anexos) { if (t && !t.ax.includes(x.id)) continue; const p = pontuar(x.norm, Q); if (p) rx.push([p, x]); }
    res.sort((a, b) => b[0] - a[0] || a[1].n - b[1].n); rx.sort((a, b) => b[0] - a[0]);
    const total = res.length + rx.length;
    box.append(el('p', { class: 'rf-res-info' }, total ? `${res.length} artigo(s)${rx.length ? ` e ${rx.length} anexo(s)` : ''} com “${busca.trim()}”${t ? ' em ' + t.nome : ''}` : `Nada encontrado com “${busca.trim()}”.`,
      total ? el('small', {}, Q.exata ? ' · frase exata' : ' · todas as palavras, sem ligar para acentos · use "aspas" para frase exata') : null));
    if (!total && t) box.append(el('button', { class: 'rf-chip', onclick: () => { escopo = 'tudo'; render(); } }, 'Procurar na lei toda'));
    if (rx.length) box.append(el('div', { class: 'rf-anexos-lig' }, el('b', {}, '📎 Nos anexos: '), rx.slice(0, 12).map(([, x]) => el('button', { class: 'rf-chip', onclick: () => { visao = { tipo: 'anexo', id: x.id }; render(); } }, `Anexo ${x.id} · ${curto(x.titulo, 40)}`))));
    lista(box, res.map(r => r[1]), Q, 'b');
  }
  function lista(box, arts, Q, chave) {
    const n = Math.min(arts.length, limite);
    arts.slice(0, n).forEach((a, i) => box.append(cartao(a, Q, false, i)));
    if (arts.length > n) box.append(el('button', { class: 'bt rf-mais', onclick: e => { const ant = limite; limite += 40; e.target.remove(); arts.slice(ant, Math.min(arts.length, limite)).forEach((a, i) => box.append(cartao(a, Q, false, i))); if (arts.length > limite) box.append(e.target); } }, `Mostrar mais (${arts.length - n})`));
  }

  // ---- cartão de um artigo
  function cartao(a, Q, aberto, i = 0) {
    const longo = a.p.length > 10 && !aberto;
    const corpo = el('div', { class: 'rf-texto' + (longo ? ' cortado' : '') });
    // com busca, mostra primeiro os parágrafos que têm o termo
    a.p.forEach(p => corpo.append(el('p', { class: classe(p), html: destacar(p, Q) })));
    if (longo && Q) { const prim = [...corpo.children].findIndex(x => x.querySelector('mark')); if (prim > 8) corpo.classList.remove('cortado'); }
    const temas = L.temas.filter(t => t.arts.includes(a.n)).slice(0, 4);
    const c = el('article', { class: 'rf-art', id: 'rf-' + a.id, style: `--i:${Math.min(i, 12)}` },
      el('header', {}, el('div', {}, el('b', {}, `Art. ${a.n}${a.s ? '-' + a.s : ''}`), el('small', { html: destacar(a.e.slice(1).map(e => e.nome).filter(Boolean).join(' › '), Q) })),
        el('div', { class: 'rf-art-bts' },
          el('button', { class: 'rf-ic', title: 'Copiar o artigo', onclick: () => copiar(a) }, '📋'),
          el('button', { class: 'rf-ic', title: 'Ver este artigo no meio da lei (antes e depois)', onclick: () => { busca = ''; visao = { tipo: 'artigo', n: a.n }; render(); } }, '📖'))),
      temas.length ? el('div', { class: 'rf-tags' }, temas.map(t => el('button', { class: 'rf-tag', onclick: () => { busca = ''; irPara(t.id); } }, t.ic + ' ' + curto(t.nome, 24)))) : null,
      corpo,
      longo ? el('button', { class: 'rf-ver', onclick: e => { corpo.classList.toggle('cortado'); e.target.textContent = corpo.classList.contains('cortado') ? `Ver o artigo inteiro (${a.p.length} parágrafos) ▾` : 'Mostrar menos ▴'; } }, `Ver o artigo inteiro (${a.p.length} parágrafos) ▾`) : null);
    return c;
  }
  const classe = p => /^§|^Parágrafo único/.test(p) ? 'par' : /^[IVXLC]+\s*-/.test(p) ? 'inc' : /^[a-z]\)/.test(p) ? 'ali' : /^\d+\.\s/.test(p) ? 'ite' : '';
  function copiar(a) {
    const t = `Art. ${a.n}${a.s ? '-' + a.s : ''} da Lei Complementar nº 214/2025\n${a.p.join('\n')}`;
    const plano2 = () => { // navegador sem permissão de área de transferência: copia por uma caixa de texto escondida
      const ta = el('textarea', { style: 'position:fixed;left:-9999px;top:0', readonly: true }); ta.value = t; document.body.append(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); toast(ok ? '📋 Artigo copiado' : 'Não deu para copiar aqui: selecione o texto do artigo e copie', { erro: !ok });
    };
    (navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('📋 Artigo copiado')).catch(plano2);
  }

  // ---- lei inteira pela estrutura
  function pintarEstrutura(box) {
    box.append(el('h2', { class: 'rf-h2' }, '📖 Índice da LC 214/2025'), el('p', { class: 'rf-sub' }, 'Toque num capítulo para ver os artigos. Livro I: IBS e CBS · Livro II: Imposto Seletivo · Livro III: Zona Franca, compras governamentais, transição e disposições finais.'));
    const grupos = new Map();
    for (const a of L.arts) {
      const ch = a.e.slice(0, 3).map(e => e.n + ' ' + e.nome).join(' | ');
      if (!grupos.has(ch)) grupos.set(ch, []);
      grupos.get(ch).push(a);
    }
    let livro = '', titulo = '';
    for (const [, as] of grupos) {
      const e = as[0].e;
      if (e[0] && e[0].n !== livro) { livro = e[0].n; titulo = ''; box.append(el('h3', { class: 'rf-livro' }, `${e[0].n} · ${e[0].nome}`)); }
      if (e[1] && e[1].n + e[1].nome !== titulo) { titulo = e[1].n + e[1].nome; box.append(el('h4', { class: 'rf-titulo' }, `${e[1].n} · ${e[1].nome}`)); }
      const det = el('details', { class: 'rf-cap' }, el('summary', {}, el('span', {}, e[2] ? `${e[2].n} · ${e[2].nome}` : 'Artigos'), el('small', {}, as.length > 1 ? `arts. ${as[0].n} a ${as[as.length - 1].n}` : `art. ${as[0].n}`)));
      det.addEventListener('toggle', () => { if (det.open && det.children.length === 1) as.forEach((a, i) => det.append(cartao(a, null, false, i))); });
      box.append(det);
    }
  }
  function pintarArtigoContexto(box, n) {
    const a = L.porN.get(n); if (!a) return pintarInicio(box);
    box.append(el('div', { class: 'rf-nav' },
      el('button', { class: 'rf-chip', disabled: n <= 1, onclick: () => { visao = { tipo: 'artigo', n: n - 1 }; render(); } }, '‹ Art. ' + (n - 1)),
      el('span', {}, a.e.map(e => e.n).join(' › ')),
      el('button', { class: 'rf-chip', disabled: n >= L.arts.length, onclick: () => { visao = { tipo: 'artigo', n: n + 1 }; render(); } }, 'Art. ' + (n + 1) + ' ›')));
    box.append(el('p', { class: 'rf-sub' }, a.cab));
    for (let k = Math.max(1, n - 1); k <= Math.min(L.arts.length, n + 1); k++) { const c = cartao(L.porN.get(k), null, k === n); if (k === n) c.classList.add('foco'); box.append(c); }
    setTimeout(() => { const f = document.getElementById('rf-art-' + n); if (f) f.scrollIntoView({ block: 'start' }); }, 30);
  }
  function pintarAnexo(box, x) {
    if (!x) return pintarInicio(box);
    const Q = busca.trim() ? entender(busca) : null;
    const temas = L.temas.filter(t => t.ax.includes(x.id));
    box.append(el('h2', { class: 'rf-h2' }, `📎 Anexo ${x.id}`), el('p', { class: 'rf-sub' }, x.titulo),
      temas.length ? el('div', { class: 'rf-tags' }, temas.map(t => el('button', { class: 'rf-tag', onclick: () => irPara(t.id) }, t.ic + ' ' + curto(t.nome, 24)))) : null);
    const filtro = el('input', { class: 'rf-filtro', type: 'search', placeholder: '🔎 Filtrar este anexo (produto, NCM, serviço…)' });
    const lista2 = el('div', { class: 'rf-anexo' });
    const pintar = () => {
      lista2.innerHTML = ''; const f = semAcento(filtro.value.trim());
      const ps = x.p.filter(p => !f || semAcento(p).includes(f));
      ps.slice(0, 400).forEach(p => lista2.append(el('p', { html: destacar(p, f ? entender(filtro.value) : Q) })));
      if (!ps.length) lista2.append(el('p', { class: 'rf-vazio' }, 'Nada neste anexo com esse texto.'));
      if (ps.length > 400) lista2.append(el('p', { class: 'rf-vazio' }, `…e mais ${ps.length - 400} linhas. Use o filtro.`));
    };
    filtro.addEventListener('input', pintar);
    box.append(filtro, lista2); pintar();
  }

  function registrar() {
    if (!KM.inicio) return setTimeout(registrar, 50);
    KM.inicio.registrar('reforma', { nome: 'Reforma tributária', ic: '⚖️', abrir, sair, resumo: () => ({ txt: 'LC 214 por nicho e situação, com busca' }) });
  }
  registrar();
  KM.reforma = { abrir: chave => { KM.inicio.abrirApp('reforma'); if (chave) setTimeout(() => L && irPara(chave), 300); } };
})();
