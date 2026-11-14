/* KWIK Mini Escritório · cofre dos clientes (📇 Informações de clientes).
   Os dados vêm de js/clientes-dados.js (gerado por clientes-gerar.ps1 a partir da pasta de clientes), TRANCADOS com senha:
   AES-256-GCM com a chave tirada da senha (PBKDF2-SHA256). O app nunca lê o Obsidian para isso.
   A senha é pedida uma vez por aparelho; depois fica guardada só a chave (neste aparelho) até tocar em 🔒 Trancar.
   KM.cofre.api(met, url, corpo) responde às mesmas rotas que o servidor dava (/api/obsidian/indice, nota, pasta, busca,
   tarefas). O que você anota, edita ou cria no app vai para a configuração do app (cfg.cofreEdicoes), TRANCADO com a
   mesma chave, e passa por cima da versão da pasta. Os arquivos do computador não são tocados. */
(function () {
  const KM = (window.KM = window.KM || {});
  const LS = 'kwik-cofre-clientes';
  let notas = null, porC = new Map(), info = [], chaveAtual = null, edicoes = {}, avisoEdicoes = '';

  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const paraB64 = u => { let s = ''; const b = new Uint8Array(u); for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192)); return btoa(s); };
  const pacote = () => window.KM_CLIENTES_CRIPT || null;
  const cfg = () => (KM.app && KM.app.cfg ? KM.app.cfg() : null);
  const agoraNs = () => String(Date.now()) + '000000';

  // edições feitas no app (trancadas na configuração, que vai para o GitHub)
  async function lerEdicoes(chave) {
    edicoes = {}; avisoEdicoes = '';
    const e = cfg() && cfg().cofreEdicoes;
    if (!e || !e.dados) return;
    try { edicoes = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(e.iv) }, chave, b64(e.dados)))).notas || {}; }
    catch (err) { avisoEdicoes = 'As anotações feitas no app foram trancadas com outra senha e não abriram com esta.'; }
  }
  async function gravarEdicoes() {
    const c = cfg(); if (!c || !chaveAtual) throw new Error('Os dados dos clientes estão trancados');
    if (avisoEdicoes) throw new Error(avisoEdicoes + ' Para não apagar nada, nada foi salvo.');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const dados = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, chaveAtual, new TextEncoder().encode(JSON.stringify({ v: 1, notas: edicoes })));
    c.cofreEdicoes = { v: 1, iv: paraB64(iv), dados: paraB64(dados), em: new Date().toISOString() };
    KM.app.salvar();
  }
  function montar(base) {
    const m = new Map(base.map(n => [n.c, Object.assign({}, n)]));
    for (const [c, e] of Object.entries(edicoes)) m.set(c, { c, texto: e.texto, m: e.m, app: true });
    notas = [...m.values()]; porC = new Map(notas.map(n => [n.c, n])); info = notas.map(infoDe);
  }

  let baseNotas = [];
  async function decifrar(chave) {
    const p = pacote();
    const plano = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(p.iv) }, chave, b64(p.dados));
    const j = JSON.parse(new TextDecoder().decode(plano));
    chaveAtual = chave; baseNotas = j.notas || [];
    await lerEdicoes(chave);
    montar(baseNotas);
    return true;
  }
  async function abrir(senha) {
    const p = pacote(); if (!p) throw new Error('Ainda não há dados de clientes no app.');
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']);
    const chave = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(p.sal), iterations: p.iter }, base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    try { await decifrar(chave); } catch (e) { throw new Error('Senha errada.'); }
    try { localStorage.setItem(LS, JSON.stringify({ sal: p.sal, k: paraB64(await crypto.subtle.exportKey('raw', chave)) })); } catch (e) { /* sem espaço: pede de novo depois */ }
    return true;
  }
  async function tentarAuto() {
    if (notas) return true;
    const p = pacote(); if (!p) return false;
    let g = null; try { g = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { g = null; }
    if (!g || g.sal !== p.sal) return false; // dados gerados de novo com outra senha/sal: pede a senha
    try { const chave = await crypto.subtle.importKey('raw', b64(g.k), 'AES-GCM', false, ['encrypt', 'decrypt']); return await decifrar(chave); } catch (e) { localStorage.removeItem(LS); return false; }
  }
  function trancar() { notas = null; porC = new Map(); info = []; chaveAtual = null; edicoes = {}; baseNotas = []; localStorage.removeItem(LS); }
  // a configuração chegou de outro aparelho com anotações novas: junta de novo
  async function recarregarEdicoes() { if (chaveAtual) { await lerEdicoes(chaveAtual); montar(baseNotas); } }

  // ------------------------------------------------------------------ o mesmo "índice" que o servidor montava
  function frontmatter(txt) {
    if (!txt.startsWith('---\n')) return [{}, txt];
    const fim = txt.indexOf('\n---', 4); if (fim < 0) return [{}, txt];
    const props = {}; let chave = null;
    for (const ln of txt.slice(4, fim).split('\n')) {
      if (!ln.trim()) continue;
      const m = ln.match(/^([^\s:#-][^:]*):\s*(.*)$/);
      if (m && !/^[ \t]/.test(ln)) { chave = m[1].trim(); const v = m[2].trim(); props[chave] = v ? v.replace(/^["']|["']$/g, '') : []; }
      else if (chave !== null && ln.trim().startsWith('- ')) { if (!Array.isArray(props[chave])) props[chave] = props[chave] ? [props[chave]] : []; props[chave].push(ln.trim().slice(2).trim().replace(/^["']|["']$/g, '')); }
    }
    return [props, txt.slice(fim + 4).replace(/^-+/, '').replace(/^\n+/, '')];
  }
  function infoDe(n) {
    const [props, corpo] = frontmatter(n.texto);
    let tags = props.tags || props.tag || []; if (typeof tags === 'string') tags = tags.split(/[,\s]+/).filter(Boolean);
    const semCodigo = corpo.replace(/```[\s\S]*?```/g, ' ');
    const inline = [...semCodigo.matchAll(/(?<![\w/&#])#([A-Za-zÀ-ÿ0-9_][\wÀ-ÿ/-]*)/g)].map(m => m[1]);
    const p = Object.assign({}, props); delete p.tags; delete p.tag;
    return { c: n.c, t: n.c.split('/').pop().replace(/\.md$/i, ''), m: n.m, tam: n.texto.length, props: p,
      tags: [...new Set([...tags.map(t => String(t).replace(/^#/, '')), ...inline])].slice(0, 30),
      links: [...new Set([...n.texto.matchAll(/!?\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)].map(m => m[1].trim()))].slice(0, 80),
      resumo: corpo.replace(/[#>*`[\]|_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220),
      tarefas: (n.texto.match(/^\s*[-*] \[ \]/gm) || []).length };
  }

  const erro = (msg, status, dados) => Object.assign(new Error(msg), { status, dados });
  async function api(met, url, corpo) {
    if (!notas && !(await tentarAuto())) throw erro('Os dados dos clientes estão trancados', 0);
    const u = new URL(url, location.href), q = k => u.searchParams.get(k) || '';
    if (met !== 'GET') {
      if (u.pathname !== '/api/obsidian/nota' || !corpo || typeof corpo.texto !== 'string') throw erro('rota', 404);
      const c = String(corpo.c || '').replace(/\\/g, '/').replace(/^\/+/, ''), atual = porC.get(c);
      if (!/\.md$/i.test(c) || c.split('/').some(x => x === '..' || x === '.')) throw erro('nota inválida', 400);
      if (met === 'POST' && atual) throw erro('Já existe uma nota com esse nome', 409);
      if (met === 'PUT') {
        if (!atual) throw erro('A nota não existe mais', 404);
        if (String(corpo.base || '') !== String(atual.m) && !corpo.forcar) throw erro('A nota mudou em outro aparelho depois que você abriu', 409, { texto: atual.texto, m: atual.m });
        if (!corpo.texto.trim() && atual.texto.trim()) throw erro('Não gravei uma nota vazia por cima do que já estava escrito', 400);
      }
      const m = agoraNs(), antes = edicoes[c];
      edicoes[c] = { texto: corpo.texto.replace(/\r\n/g, '\n'), m };
      try { await gravarEdicoes(); } catch (e) { if (antes) edicoes[c] = antes; else delete edicoes[c]; throw e; }
      montar(baseNotas);
      return { ok: true, c, m };
    }
    switch (u.pathname) {
      case '/api/obsidian/indice': return { vault: 'Clientes', notas: info, anexos: [] };
      case '/api/obsidian/nota': {
        const n = porC.get(q('c')); if (!n) throw erro('nota não encontrada', 404);
        return { c: n.c, t: n.c.split('/').pop().replace(/\.md$/i, ''), texto: n.texto, m: n.m, gravavel: true, app: !!n.app };
      }
      case '/api/obsidian/pasta': {
        const pre = q('c') ? q('c') + '/' : '', itens = new Map();
        for (const n of notas) {
          if (!n.c.startsWith(pre)) continue;
          const resto = n.c.slice(pre.length), i = resto.indexOf('/');
          if (i < 0) itens.set(n.c, { c: n.c, nome: resto, pasta: false, tam: n.texto.length, m: n.m, qtd: null });
          else { const c = pre + resto.slice(0, i), x = itens.get(c) || { c, nome: resto.slice(0, i), pasta: true, tam: 0, m: n.m, qtd: 0 }; x.qtd++; itens.set(c, x); }
        }
        return { c: q('c'), itens: [...itens.values()].sort((a, b) => (b.pasta - a.pasta) || a.nome.localeCompare(b.nome, 'pt-BR')) };
      }
      case '/api/obsidian/busca': {
        const termo = q('q').trim().toLowerCase(); if (termo.length < 2) return { resultados: [] };
        const res = [];
        for (const n of notas) {
          const low = n.texto.toLowerCase(), nome = n.c.split('/').pop().replace(/\.md$/i, ''), i = low.indexOf(termo);
          if (nome.toLowerCase().includes(termo) || i >= 0) res.push({ c: n.c, t: nome, trecho: i >= 0 ? n.texto.slice(Math.max(0, i - 60), i + 140).replace(/\s+/g, ' ') : '', nota: (nome.toLowerCase().includes(termo) ? 3 : 0) + Math.min(low.split(termo).length - 1, 5) });
        }
        return { resultados: res.sort((a, b) => b.nota - a.nota).slice(0, 60) };
      }
      case '/api/obsidian/tarefas': {
        const lista = [];
        for (const n of notas) n.texto.split('\n').forEach((ln, linha) => { const m = ln.match(/^\s*[-*] \[ \]\s+(.+)$/); if (m) lista.push({ c: n.c, t: n.c.split('/').pop().replace(/\.md$/i, ''), linha, texto: m[1].trim().slice(0, 300), m: n.m }); });
        return { tarefas: lista.slice(0, 600) };
      }
      case '/api/obsidian/arquivo': throw new Error('Os anexos ficam só no Obsidian do PC.');
    }
    throw Object.assign(new Error('rota'), { status: 404 });
  }

  KM.cofre = {
    existe: () => !!pacote(),
    aberto: () => !!notas,
    qtd: () => (pacote() || {}).qtd || 0,
    geradoEm: () => (pacote() || {}).geradoEm || '',
    abrir, tentarAuto, trancar, api, recarregarEdicoes,
    aviso: () => avisoEdicoes,
    editadas: () => Object.keys(edicoes).length,
  };
})();
