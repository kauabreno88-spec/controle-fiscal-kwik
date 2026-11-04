/* KWIK Mini Escritório · onde o funcionário trabalha.
   - local:  servidor.py no PC (http://localhost:4880)
   - github: celular/qualquer lugar. O app grava um pedido em nuvem/pedidos/ no repositório privado
             KWIK-MINI-ESCRITORIO; isso dispara a GitHub Action que busca as notícias e grava
             nuvem/relatorios/<id>.json + nuvem/indice.json. */
(function () {
  const KM = (window.KM = window.KM || {});

  const resumo = r => ({
    id: r.id, criadoEm: r.criadoEm, funcionario: r.funcionario, tarefa: r.tarefa, diaData: r.diaData, ganho: r.ganho,
    duracao: r.duracao, qtdPrincipais: (r.principais || []).length, qtdDia: (r.dia || []).length,
  });

  // ------------------------------------------------------------------ servidor local (PC)
  const local = {
    nome: 'local',
    async req(metodo, url, corpo) {
      const r = await fetch(url, {
        method: metodo, cache: 'no-store',
        headers: metodo !== 'GET' ? { 'Content-Type': 'application/json', 'X-Kwik': '1' } : {},
        body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { const e = new Error(j.erro || ('HTTP ' + r.status)); e.status = r.status; throw e; }
      return j;
    },
    async carregar() { const j = await this.req('GET', '/api/estado'); return { config: j.config, relatorios: j.relatorios || [] }; },
    salvarConfig(cfg) { return this.req('PUT', '/api/config', cfg); },
    async iniciar(ped) { return (await this.req('POST', '/api/tarefas', { funcionario: ped.funcionario, tipo: 'noticias', ganho: ped.ganho })).id; },
    async acompanhar(id, cb) {
      let vistos = 0;
      for (;;) {
        await KM.esperar(600);
        let t;
        try { t = await this.req('GET', '/api/tarefas/' + id); } catch (e) { continue; }
        cb.progresso(t.progresso || 0);
        for (; vistos < t.etapas.length; vistos++) cb.etapa(t.etapas[vistos].texto);
        cb.tique();
        if (t.status !== 'trabalhando') return { status: t.status, relatorio: t.relatorio, erro: t.erro };
      }
    },
    relatorio(id) { return this.req('GET', '/api/relatorios/' + id); },
    async listar() { return (await this.carregar()).relatorios; },
    apagar(id) { return this.req('DELETE', '/api/relatorios/' + id); },
  };

  // ------------------------------------------------------------------ GitHub (celular)
  const GH_CHAVE = 'kwik-mini-github';
  const OUTROS = [['kwik-despesas-github', 'KWIK Fiscal'], ['kwik-folha-github', 'KWIK Folha']];
  const REPO_PADRAO = 'kauabreno88-spec/KWIK-MINI-ESCRITORIO';

  function b64(texto) {
    const bytes = new TextEncoder().encode(texto);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function msgErro(status, j) {
    if (status === 401) return 'Token inválido ou vencido. Gere um novo e conecte de novo.';
    if (status === 403) return 'O token não tem permissão. Ele precisa de "Contents: Read and write" no repositório KWIK-MINI-ESCRITORIO.';
    if (status === 404) return 'Repositório não encontrado. O token tem acesso ao KWIK-MINI-ESCRITORIO?';
    return (j && j.message) || ('Erro ' + status + ' do GitHub');
  }

  const github = {
    nome: 'github',
    REPO_PADRAO,
    conf() {
      try { return Object.assign({ repo: REPO_PADRAO, branch: 'main', token: '' }, JSON.parse(localStorage.getItem(GH_CHAVE) || '{}')); }
      catch (e) { return { repo: REPO_PADRAO, branch: 'main', token: '' }; }
    },
    salvarConf(c) { localStorage.setItem(GH_CHAVE, JSON.stringify(c)); },
    conectado() { return !!this.conf().token; },
    tokenDeOutroApp() {
      for (const [k, nome] of OUTROS) {
        try { const t = JSON.parse(localStorage.getItem(k) || '{}').token; if (t) return { nome, token: t }; } catch (e) { /* nada */ }
      }
      return null;
    },
    async req(metodo, caminho, corpo, cru) {
      const c = this.conf();
      const r = await fetch('https://api.github.com/repos/' + c.repo + caminho, {
        method: metodo, cache: 'no-store',
        headers: {
          Authorization: 'Bearer ' + c.token, 'X-GitHub-Api-Version': '2022-11-28',
          Accept: cru ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
        },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
      if (r.status === 404 && metodo === 'GET' && caminho.startsWith('/contents/')) return null;
      if (!r.ok) { const j = await r.json().catch(() => ({})); const e = new Error(msgErro(r.status, j)); e.status = r.status; throw e; }
      if (r.status === 204) return {};
      return cru ? r.text() : r.json();
    },
    async lerJson(arq) {
      const t = await this.req('GET', '/contents/' + arq + '?ref=' + encodeURIComponent(this.conf().branch) + '&t=' + Date.now(), null, true);
      return t == null ? null : JSON.parse(t);
    },
    async sha(arq) {
      const j = await this.req('GET', '/contents/' + arq + '?ref=' + encodeURIComponent(this.conf().branch) + '&t=' + Date.now());
      return j && j.sha;
    },
    async gravarJson(arq, dados, msg) {
      for (let n = 0; ; n++) {
        const sha = await this.sha(arq);
        try {
          return await this.req('PUT', '/contents/' + arq, { message: msg, content: b64(JSON.stringify(dados, null, 1)), branch: this.conf().branch, ...(sha ? { sha } : {}) });
        } catch (e) {
          if (n >= 3 || ![409, 422].includes(e.status)) throw e;
          await KM.esperar(700 * (n + 1));
        }
      }
    },
    async apagarArq(arq, msg) {
      const sha = await this.sha(arq);
      if (sha) await this.req('DELETE', '/contents/' + arq, { message: msg, sha, branch: this.conf().branch });
    },
    async testar() {
      const c = this.conf();
      const r = await fetch('https://api.github.com/repos/' + c.repo, { headers: { Authorization: 'Bearer ' + c.token }, cache: 'no-store' });
      if (!r.ok) throw new Error(msgErro(r.status, await r.json().catch(() => ({}))));
      return r.json();
    },
    async carregar() {
      const [config, relatorios] = await Promise.all([this.lerJson('nuvem/config.json'), this.lerJson('nuvem/indice.json')]);
      return { config, relatorios: relatorios || [] };
    },
    salvarConfig(cfg) { return this.gravarJson('nuvem/config.json', cfg, 'Personalização do escritório'); },
    async iniciar(ped) {
      await this.gravarJson('nuvem/pedidos/' + ped.id + '.json', ped, `Pedido: notícias contábeis (${ped.funcionario.nome})`);
      return ped.id;
    },
    cacheRel: new Map(),
    async acompanhar(id, cb) {
      const roteiro = [
        [0, 'Pedido enviado ao GitHub 📨', 6], [5, 'Ligando o computador da nuvem…', 14], [14, 'Abrindo o Portal Contábeis…', 28],
        [20, 'Abrindo o Contadores.cnt.br…', 42], [27, 'Lendo as matérias e os resumos…', 60], [37, 'Separando as principais notícias…', 78],
        [48, 'Organizando o relatório…', 90], [80, 'A fila do GitHub está mais lenta hoje, já já sai…', 94],
      ];
      const t0 = Date.now();
      let k = 0, ultima = 0;
      while (Date.now() - t0 < 6 * 60000) {
        const s = (Date.now() - t0) / 1000;
        while (k < roteiro.length && s >= roteiro[k][0]) { cb.etapa(roteiro[k][1]); cb.progresso(roteiro[k][2]); k++; }
        cb.tique();
        if (s > 15 && Date.now() - ultima > 4000) {
          ultima = Date.now();
          try {
            const r = await this.lerJson('nuvem/relatorios/' + id + '.json');
            if (r) {
              cb.progresso(100);
              if (r.erro) return { status: 'erro', erro: r.erro };
              this.cacheRel.set(id, r);
              cb.etapa('Relatório pronto!');
              return { status: 'pronto', relatorio: resumo(r) };
            }
          } catch (e) { /* tenta de novo */ }
        }
        await KM.esperar(600);
      }
      return { status: 'erro', erro: 'O GitHub demorou demais. Se o relatório sair depois, ele aparece na aba Relatórios.' };
    },
    async relatorio(id) {
      if (this.cacheRel.has(id)) return this.cacheRel.get(id);
      const r = await this.lerJson('nuvem/relatorios/' + id + '.json');
      if (!r) throw new Error('não encontrado');
      this.cacheRel.set(id, r);
      return r;
    },
    async listar() { return (await this.lerJson('nuvem/indice.json')) || []; },
    async apagar(id) {
      const idx = (await this.lerJson('nuvem/indice.json')) || [];
      await this.gravarJson('nuvem/indice.json', idx.filter(i => i.id !== id), 'Apaga relatório');
      await this.apagarArq('nuvem/relatorios/' + id + '.json', 'Apaga relatório');
      this.cacheRel.delete(id);
    },
  };

  KM.backends = { local, github };
  // ?nuvem na URL força o modo GitHub mesmo no PC
  KM.ehPC = (['localhost', '127.0.0.1'].includes(location.hostname) || location.hostname.endsWith('.localhost')) && !new URLSearchParams(location.search).has('nuvem');
})();
