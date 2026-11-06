/* KWIK Mini Escritório · setor de Marketing.
   Enzo: vai até quem busca as notícias, pergunta as principais do dia, escolhe uma (nunca a mesma da vez
         anterior), volta para a mesa e monta um vídeo em motion design (4:5, para o feed do Instagram) com legenda.
         O vídeo é desenhado no próprio app (canvas) e pode ser baixado/compartilhado em MP4/WebM.
   Lena: vai até o Maycon, pega os contatos com telefone do último relatório e prepara a mensagem de primeiro
         contato (assinada pelo dono da KWIK) para enviar pelo WhatsApp Business, um por um. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const VERDE = '#28BE52', GRAFITE = '#111A19', NEVOA = '#F1F5F0';
  const primeiro = id => (A().func(id).nome || '').split(' ')[0];
  const pessoaFuncao = f => Object.values(A().estado.pessoas).find(q => q.funcao === f);
  const curto = (s, n) => { s = String(s || '').trim(); if (s.length <= n) return s; const c = s.slice(0, n); return c.slice(0, Math.max(c.lastIndexOf(' '), n - 12)).replace(/[,;:.\s]+$/, '') + '…'; };
  const dd = n => String(n).padStart(2, '0');
  const agoraId = suf => { const a = new Date(); return `${a.getFullYear()}${dd(a.getMonth() + 1)}${dd(a.getDate())}-${dd(a.getHours())}${dd(a.getMinutes())}${dd(a.getSeconds())}-${suf}`; };
  const agoraIso = () => { const a = new Date(); return `${a.getFullYear()}-${dd(a.getMonth() + 1)}-${dd(a.getDate())}T${dd(a.getHours())}:${dd(a.getMinutes())}:${dd(a.getSeconds())}`; };
  const foneBonito = d => { d = String(d || '').replace(/\D/g, ''); if (d.startsWith('55') && d.length >= 12) d = d.slice(2); return d.length >= 10 ? `(${d.slice(0, 2)}) ${d.slice(2, -4)}-${d.slice(-4)}` : d; };

  // ------------------------------------------------------------------ andar até um colega e conversar
  async function irConversar(p, alvo, falas) {
    const m = KM.mov;
    if (alvo) {
      const a = KM.LAYOUT.assentos[alvo.funcao];
      const [x, y] = alvo.modo === 'sentado' && a ? [a.X + 17, a.Y + 3] : [alvo.X + 16, alvo.Y];
      await m.irAte(p, x, y);
      KM.olhar(p, alvo);
      if (alvo.modo !== 'sentado') KM.olhar(alvo, p);
    }
    for (const [quem, txt, ms] of falas) {
      const q = quem === 'eu' ? p : alvo;
      if (!q) continue;
      m.fala(q, txt, ms);
      if (q === p) p.est = { bracos: 'aceno', aceno: 1, boca: 'sorriso' };
      await KM.esperar(ms + 200);
      p.est = {};
    }
    await KM.voltarSentar(p);
  }
  function semConexao() {
    if (A().online()) return false;
    const BK = A().BK();
    if (BK && BK.nome === 'github') { A().toast('Conecte ao GitHub para salvar o trabalho 🔗'); A().abrirConexao(); }
    else A().toast('O servidor está desligado. Abra o ABRIR-ESCRITORIO.bat.', { erro: true });
    return true;
  }
  // Fases do trabalho na mesa, com balões, barra de progresso e moedinhas.
  async function produzir(p, cb, etapas) {
    for (const [txt, pr, ms] of etapas) {
      cb.etapa(txt); cb.progresso(pr);
      const fim = performance.now() + ms;
      while (performance.now() < fim) { cb.tique(); await KM.esperar(400); }
    }
  }

  // ================================================================== LENA · primeiro contato pelo WhatsApp Business
  const SAUDE = /cl[íi]nica|consult[óo]rio|odonto|laborat|fisio|psico|[óo]tica|terapia|fono|nutri|podolog|veterin/i;
  const MODELOS = {
    saude: [
      'Olá, tudo bem? Aqui é o {dono}, dono da {empresa} 👋\n\nVi a {nome}, em {cidade}, e quis falar com vocês: a {empresa} cuida de impostos, folha de pagamento e toda a parte fiscal de clínicas e consultórios, com atendimento próximo.\n\nVocê teria 15 minutos esta semana para uma conversa rápida? Pode ser por aqui mesmo ou por ligação. Qual dia e horário ficam melhores pra você?',
      'Oi! Tudo bem? Meu nome é {dono}, sou dono da {empresa}.\n\nEstou conversando com clínicas de {cidade} para entender como está a contabilidade hoje e mostrar como a {empresa} pode ajudar a {nome} a organizar impostos, folha e a parte fiscal.\n\nPodemos marcar uma reunião rápida (15 a 20 minutos) esta semana? Me diz o melhor dia e horário 🙂',
    ],
    outras: [
      'Olá, tudo bem? Aqui é o {dono}, dono da {empresa} 👋\n\nGostaria de apresentar o nosso trabalho para a {nome}: cuidamos da contabilidade de empresas com atendimento próximo e tudo explicado sem complicação.\n\nVocê teria 15 minutos esta semana para uma conversa rápida? Qual dia e horário ficam bons pra você?',
      'Oi! Aqui é o {dono}, dono da {empresa}.\n\nEstou entrando em contato com empresas de {cidade} e gostaria de entender como está a contabilidade da {nome} hoje — impostos, folha e obrigações em dia.\n\nTopa uma conversa rápida esta semana, por aqui ou por ligação? Me diz o melhor dia e horário 🙂',
    ],
  };
  function mensagem(item, i, ctx) {
    const lista = SAUDE.test(item.tipo || '') || item.grupo === 'saude' ? MODELOS.saude : MODELOS.outras;
    return lista[i % lista.length].replace(/\{(\w+)\}/g, (m, k) => ({ dono: ctx.dono, empresa: ctx.empresa, nome: item.nome, cidade: ctx.cidade }[k] ?? m));
  }

  async function trabalharContato(f, p) {
    if (p.trabalhando || semConexao()) return;
    const est = A().estado, cfg = A().cfg();
    const may = pessoaFuncao('prospeccao'), nomeM = may ? primeiro(may.id) : 'Prospecção', eu = primeiro(f.id);
    const resumo = (est.relatorios || []).find(r => r.tipo === 'prospeccao');
    if (!resumo) {
      A().falar(p.id, `Preciso que ${nomeM} busque clientes primeiro! 📞`, 3200);
      return A().toast(`💬 ${eu} usa os contatos que ${nomeM} encontra. Coloque ${nomeM} para trabalhar primeiro 📞`, { ms: 7000 });
    }
    let rel;
    try { rel = await A().obterRelatorio(resumo.id); } catch (e) { return A().toast(`Não consegui abrir a lista de ${nomeM}: ` + e.message, { erro: true }); }
    const vistos = new Set(), leads = [];
    for (const [grupo, arr] of [['saude', rel.clinicas || []], ['outras', rel.outras || []]]) {
      for (const i of arr) {
        if (!i.tel || !i.tel.digitos || vistos.has(i.tel.digitos)) continue;
        vistos.add(i.tel.digitos); leads.push({ ...i, grupo });
      }
    }
    if (!leads.length) {
      A().falar(p.id, `${nomeM} ainda não achou ninguém com telefone 😕`, 3200);
      return A().toast(`💬 O último relatório de ${nomeM} não tem telefones. Peça uma nova busca (talvez em outra cidade).`, { ms: 8000 });
    }
    const ok = await KM.rodar('trabalho', async q => {
      A().pagar(f, q);
      A().iniciarPainelTarefa('💬 Primeiro contato pelo WhatsApp');
      A().callbacksTarefa(q, false).etapa(`Indo falar com ${nomeM} 🚶‍♀️`);
      await irConversar(q, may, [
        ['eu', `${nomeM}, me passa os números dos clientes?`, 2300],
        ['alvo', `Tenho ${leads.length} com telefone! Toma 📇`, 2300],
        ['eu', 'Valeu! Vou preparar as mensagens 💬', 2200],
      ]);
    }, [p.id]);
    if (ok === false) return A().toast(`${eu} está com outra coisa agora. Tente de novo 😉`);

    p.trabalhando = true; p.digitando = true; est.trabalhoDe.contato = true; A().atualizarBotoes();
    const cb = A().callbacksTarefa(p, false);
    let erro, salvo;
    try {
      await produzir(p, cb, [['Separando quem tem telefone ☎️', 25, 2200], ['Escrevendo a apresentação ✍️', 50, 2600], ['Personalizando para cada empresa 💬', 75, 2600], ['Conferindo os números do WhatsApp 📱', 92, 2000]]);
      const cidade = String(rel.cidade || 'sua cidade').toLowerCase().replace(/(^|\s)(\S)/g, (m, e, l) => e + l.toUpperCase()).replace(/\s(D[aeo]s?)\s/g, (m, d) => ' ' + d.toLowerCase() + ' ');
      const ctx = { dono: cfg.marketing.dono || 'Kauã', empresa: cfg.marketing.empresa || 'KWIK Contabilidade', cidade };
      const contatos = leads.map((i, k) => ({ nome: i.nome, tipo: i.tipo, grupo: i.grupo, endereco: i.endereco || '', telefone: i.tel.texto, digitos: i.tel.digitos, celular: !!i.tel.celular, mensagem: mensagem(i, k, ctx) }));
      salvo = {
        id: agoraId('contatos'), tipo: 'contatos', criadoEm: agoraIso(), funcionario: { id: f.id, nome: f.nome }, tarefa: 'Primeiro contato com clientes',
        titulo: `Contatos em ${rel.cidade}-${rel.uf}`, cidade: rel.cidade, uf: rel.uf, origem: resumo.id, remetente: cfg.marketing.whats || '', contatos, qtdContatos: contatos.length, duracao: 10,
      };
      await A().BK().salvarRelatorio(salvo);
      cb.progresso(100);
    } catch (e) { erro = e; }
    p.trabalhando = false; p.digitando = false; est.trabalhoDe.contato = false; A().atualizarBotoes();
    if (erro) { A().falar(p.id, 'Não consegui terminar 😓', 3000); return A().toast(`${eu}: ` + erro.message, { erro: true, ms: 9000 }); }
    await A().carregarRelatorios(KM.resumoRelatorio(salvo));
    A().falar(p.id, `${salvo.qtdContatos} mensagens prontas! 💬`, 3000);
    A().toast(`💬 ${eu} preparou ${salvo.qtdContatos} mensagens de primeiro contato.`, { botao: ['Ver contatos', () => A().abrirRelatorio(salvo.id)], ms: 10000 });
    await A().concluir(f, p);
  }

  function renderContatos(r, box) {
    const { el, fmtData } = A();
    const cfg = A().cfg();
    cfg.contatos = cfg.contatos || { enviados: {} };
    const env = () => cfg.contatos.enviados;
    let filtro = 'pendentes', busca = '';
    const rel = el('div', { class: 'rel' });
    const chips = el('div', { class: 'chips' });
    const atualizarChips = () => {
      const feitos = r.contatos.filter(c => env()[c.digitos]).length;
      chips.innerHTML = '';
      chips.append(el('span', { class: 'chip ok' }, `💬 ${r.contatos.length} mensagens`), el('span', { class: 'chip ok' }, `✅ ${feitos} enviadas`), el('span', { class: 'chip' }, `⏳ ${r.contatos.length - feitos} pendentes`));
    };
    rel.append(el('div', { class: 'rel-cab' },
      el('div', {}, el('h2', {}, `💬 Primeiro contato · ${r.cidade}-${r.uf}`),
        el('p', {}, `Preparado por ${r.funcionario?.nome || 'Lena'} em ${fmtData(r.criadoEm)} · só quem tem telefone na lista do Maycon`), chips),
      el('div', { class: 'rel-bts' },
        el('button', { class: 'bt peq', onclick: () => baixarCSV(r) }, '⬇️ Planilha (CSV)'),
        el('button', { class: 'bt peq perigo', onclick: () => A().apagarRel(r) }, '🗑️ Apagar'))));
    const whats = foneBonito(cfg.marketing.whats || r.remetente);
    rel.append(el('div', { class: 'obs' }, `📱 Envio pelo seu WhatsApp Business${whats ? ' ' + whats : ''}: toque em "Enviar no WhatsApp", confira se abriu a conta Business e aperte enviar. O app não manda sozinho — você revisa cada mensagem. Dica: envie aos poucos (10 a 15 por dia) para o WhatsApp não bloquear o número.`));
    const lista = el('div', { class: 'leads' });
    const bts = ['pendentes', 'enviados', 'todos'].map(fl => el('button', { class: fl === filtro ? 'on' : '', onclick: e => { filtro = fl; bts.forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); desenhar(); } }, { pendentes: 'Pendentes', enviados: 'Enviadas', todos: 'Todas' }[fl]));
    rel.append(el('div', { class: 'filtros' }, el('input', { type: 'search', placeholder: 'Buscar nome ou bairro…', oninput: e => { busca = e.target.value.toLowerCase(); desenhar(); } }), bts));
    const cartao = c => {
      const ta = el('textarea', { class: 'msg', rows: 6 }, c.mensagem);
      const marcar = () => { env()[c.digitos] = new Date().toISOString(); A().salvar(); setTimeout(desenhar, 400); };
      const quando = env()[c.digitos];
      return el('div', { class: 'lead contato' + (quando ? ' enviado' : '') },
        el('div', { class: 'lead-cab' }, el('b', {}, c.nome), el('span', { class: 'tipo' }, c.tipo || 'Empresa'),
          el('span', { class: 'chip' }, c.celular ? '📱 celular' : '☎️ fixo — pode não ter WhatsApp'),
          quando ? el('span', { class: 'novo' }, '✅ ENVIADA ' + new Date(quando).toLocaleDateString('pt-BR')) : null),
        el('small', {}, `☎️ ${c.telefone}${c.endereco ? ' · 📍 ' + c.endereco : ''}`),
        ta,
        el('div', { class: 'lead-bts' },
          el('a', { class: 'bt peq whats', href: '#', target: '_blank', rel: 'noopener', onclick: e => { e.currentTarget.href = `https://wa.me/${c.digitos}?text=${encodeURIComponent(ta.value)}`; marcar(); } }, '💬 Enviar no WhatsApp'),
          el('button', { class: 'bt peq', onclick: async () => { try { await navigator.clipboard.writeText(ta.value); A().toast('Mensagem copiada 📋'); } catch (e) { A().toast('Não consegui copiar.', { erro: true }); } } }, '📋 Copiar'),
          quando ? el('button', { class: 'bt peq', onclick: () => { delete env()[c.digitos]; A().salvar(); desenhar(); } }, '↺ Desmarcar') : null));
    };
    const desenhar = () => {
      lista.innerHTML = '';
      const itens = r.contatos.filter(c => (filtro === 'todos' || (filtro === 'enviados') === !!env()[c.digitos]) && (!busca || (c.nome + ' ' + c.endereco).toLowerCase().includes(busca)));
      itens.forEach(c => lista.append(cartao(c)));
      if (!itens.length) lista.append(el('p', { class: 'vazio' }, filtro === 'pendentes' ? 'Tudo enviado por aqui! 🎉' : 'Nada neste filtro.'));
      atualizarChips();
    };
    rel.append(lista);
    box.append(rel);
    desenhar();
  }
  function baixarCSV(r) {
    const linha = cols => cols.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';');
    const env = (A().cfg().contatos || {}).enviados || {};
    const l = [linha(['Nome', 'Tipo', 'Telefone', 'Celular', 'Endereço', 'Enviada em', 'Link WhatsApp', 'Mensagem'])];
    for (const c of r.contatos) l.push(linha([c.nome, c.tipo, c.telefone, c.celular ? 'sim' : 'não', c.endereco, env[c.digitos] ? new Date(env[c.digitos]).toLocaleDateString('pt-BR') : '', `https://wa.me/${c.digitos}`, c.mensagem]));
    const blob = new Blob(['﻿' + l.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = A().el('a', { href: URL.createObjectURL(blob), download: `Contatos ${r.cidade}-${r.uf} ${r.criadoEm.slice(0, 10)}.csv` });
    document.body.append(a); a.click(); a.remove();
  }

  KM.marketing = { trabalharContato, renderContatos, _u: { irConversar, semConexao, produzir, curto, foneBonito, agoraId, agoraIso, primeiro, pessoaFuncao } };
})();
