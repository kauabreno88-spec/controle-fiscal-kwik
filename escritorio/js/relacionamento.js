/* KWIK Mini Escritório · setor de Relacionamento com o cliente (Bia).
   Na parede da sala fica um telão com a lista dos clientes ativos rodando (cfg.clientes).
   Ao trabalhar, ela pergunta o que fazer:
   - Pesquisa de satisfação: um formulário no estilo KWIK (pesquisa.html) que o cliente responde pelo celular;
     as respostas chegam no seu WhatsApp Business. Também dá para copiar as perguntas para o Google Forms.
   - Nota rápida (0 a 10), check-in do mês e pedido de indicação: mensagens prontas.
   No relatório você escolhe o cliente (ou digita o número) e envia pelo WhatsApp Business. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const U = () => KM.marketing._u;
  const LINK_PESQUISA = 'https://kauabreno88-spec.github.io/controle-fiscal-kwik/escritorio/pesquisa.html';
  const digitos = s => { let d = String(s || '').replace(/\D/g, ''); if (d.length === 10 || d.length === 11) d = '55' + d; return d; };

  const ACOES = {
    pesquisa: {
      ic: '📋', nome: 'Pesquisa de satisfação', desc: 'Formulário no estilo KWIK: como está o serviço e o que melhorar',
      msg: 'Olá, {cliente}! Tudo bem? Aqui é o {dono}, da {empresa} 💚\n\nQueremos saber como está sendo a sua experiência com a nossa contabilidade e o que podemos melhorar. São só 2 minutinhos:\n\n👉 {link}\n\nSua opinião faz toda a diferença. Obrigado!',
      perguntas: ['De 0 a 10, o quanto você indicaria a KWIK para um amigo?', 'Como você avalia o atendimento? (1 a 5)', 'Como você avalia os prazos e as entregas? (1 a 5)', 'Como você avalia a clareza das explicações? (1 a 5)', 'Como você avalia o custo-benefício? (1 a 5)', 'O que você mais gosta no nosso serviço?', 'O que devemos melhorar?', 'Quer marcar uma conversa com a gente? (Sim / Não)'],
    },
    nps: {
      ic: '⭐', nome: 'Nota rápida (0 a 10)', desc: 'Uma pergunta só, respondida no próprio WhatsApp',
      msg: 'Oi, {cliente}! Aqui é o {dono}, da {empresa} 😊\n\nUma pergunta rapidinha: de 0 a 10, quanto você indicaria a KWIK para um amigo ou parceiro?\n\nSe puder, conta também o que faria essa nota subir. Responde aqui mesmo! 🙏',
    },
    checkin: {
      ic: '💚', nome: 'Check-in do mês', desc: 'Saber como estão as coisas e se precisa de algo',
      msg: 'Olá, {cliente}! Tudo certo por aí? Aqui é o {dono}, da {empresa} 💚\n\nPassando para saber como estão as coisas na empresa e se você precisa de algo da nossa parte este mês: alguma dúvida, documento ou planejamento?\n\nEstou à disposição!',
    },
    indicacao: {
      ic: '🤝', nome: 'Pedir indicação', desc: 'Pedir que indique a KWIK para outros empresários',
      msg: 'Oi, {cliente}! Aqui é o {dono}, da {empresa} 😊\n\nFicamos muito felizes em cuidar da contabilidade da sua empresa. Se você conhece algum empresário que precisa de contabilidade, BPO ou consultoria, ficaríamos gratos pela indicação!\n\nÉ só me mandar o contato ou passar o nosso número. Muito obrigado pela confiança! 🙏',
    },
  };
  const montarMsg = (modelo, ctx) => modelo.replace(/\{(\w+)\}/g, (m, k) => ctx[k] ?? m).replace(/Olá, !|Oi, !/g, s => s.replace(', !', '!'));
  const linkDe = (cliente, cfg) => `${LINK_PESQUISA}?c=${encodeURIComponent(cliente || '')}&w=${digitos(cfg.marketing.whats || '')}`;

  async function trabalhar(f, p) {
    if (p.trabalhando || U().semConexao()) return;
    const cfg = A().cfg(), est = A().estado;
    const acao = await A().escolher('💚 O que a Bia vai fazer?', Object.entries(ACOES).map(([v, a]) => ({ v, ic: a.ic, nome: a.nome, desc: a.desc })));
    if (!acao) return;
    if (!(await A().esperarLivre(p, 1500))) return A().toast('Espere a Bia terminar o que está fazendo 😉');
    if (p.modo !== 'sentado') await KM.voltarSentar(p);
    const a = ACOES[acao];
    A().pagar(f, p);
    A().iniciarPainelTarefa(`${a.ic} ${a.nome}`);
    p.trabalhando = true; p.digitando = true; est.trabalhoDe.relacionamento = true; A().atualizarBotoes();
    const cb = A().callbacksTarefa(p, false);
    let erro, salvo;
    try {
      const etapas = acao === 'pesquisa'
        ? [['Escolhendo as perguntas 📝', 25, 2200], ['Montando o formulário no estilo KWIK 🟩', 55, 2600], ['Testando no celular 📱', 78, 2000], ['Escrevendo o convite 💬', 92, 1800]]
        : [['Pensando no tom certo 💭', 35, 2000], ['Escrevendo a mensagem ✍️', 70, 2400], ['Revisando com carinho 💚', 92, 1600]];
      await U().produzir(p, cb, etapas);
      salvo = {
        id: U().agoraId('cliente'), tipo: 'relacionamento', acao, criadoEm: U().agoraIso(), funcionario: { id: f.id, nome: f.nome }, tarefa: a.nome,
        titulo: a.nome, mensagem: a.msg, perguntas: a.perguntas || null, qtdClientes: (cfg.clientes || []).length, duracao: 8,
      };
      await A().BK().salvarRelatorio(salvo);
      cb.progresso(100);
    } catch (e) { erro = e; }
    p.trabalhando = false; p.digitando = false; est.trabalhoDe.relacionamento = false; A().atualizarBotoes();
    if (erro) { A().falar(p.id, 'Não consegui terminar 😓', 3000); return A().toast('Bia: ' + erro.message, { erro: true, ms: 9000 }); }
    await A().carregarRelatorios(KM.resumoRelatorio(salvo));
    A().falar(p.id, acao === 'pesquisa' ? 'Formulário pronto! 📋' : 'Mensagem pronta! 💬', 3000);
    A().toast(`${a.ic} Bia preparou: ${a.nome}.`, { botao: ['Enviar', () => A().abrirRelatorio(salvo.id)], ms: 10000 });
    await A().concluir(f, p);
  }

  function renderRel(r, box) {
    const { el, fmtData } = A();
    const cfg = A().cfg();
    cfg.relacionamento = cfg.relacionamento || { enviados: {} };
    const env = () => (cfg.relacionamento.enviados[r.id] = cfg.relacionamento.enviados[r.id] || {});
    const ctxBase = { dono: cfg.marketing.dono || 'Kauã', empresa: cfg.marketing.empresa || 'KWIK Contabilidade' };
    const a = ACOES[r.acao] || ACOES.checkin;
    const rel = el('div', { class: 'rel' });
    rel.append(el('div', { class: 'rel-cab' },
      el('div', {}, el('h2', {}, `${a.ic} ${r.titulo}`), el('p', {}, `Preparado por ${r.funcionario?.nome || 'Bia'} em ${fmtData(r.criadoEm)}`)),
      el('div', { class: 'rel-bts' }, el('button', { class: 'bt peq perigo', onclick: () => A().apagarRel(r) }, '🗑️ Apagar'))));

    // enviar para um cliente
    const clientes = cfg.clientes || [];
    const sel = el('select', {}, el('option', { value: '' }, clientes.length ? 'Escolha o cliente…' : 'Nenhum cliente cadastrado'), clientes.map((c, i) => el('option', { value: i }, c.nome)));
    const inpNome = el('input', { type: 'text', placeholder: 'Nome do cliente' });
    const inpTel = el('input', { type: 'tel', placeholder: 'WhatsApp do cliente — ex.: (98) 98888-7777' });
    const ta = el('textarea', { class: 'msg', rows: 8 });
    const atualizar = () => { ta.value = montarMsg(r.mensagem, { ...ctxBase, cliente: inpNome.value.trim(), link: linkDe(inpNome.value.trim(), cfg) }); };
    sel.onchange = () => { const c = clientes[sel.value]; if (c) { inpNome.value = c.nome; inpTel.value = c.telefone || ''; } atualizar(); };
    inpNome.oninput = atualizar;
    const historico = el('div', { class: 'chips' });
    const desenharHist = () => { historico.innerHTML = ''; const lst = Object.entries(env()); if (!lst.length) historico.append(el('span', { class: 'chip' }, 'Ainda não enviado para ninguém')); lst.forEach(([nome, quando]) => historico.append(el('span', { class: 'chip ok' }, `✅ ${nome} · ${new Date(quando).toLocaleDateString('pt-BR')}`))); };
    const enviar = el('a', {
      class: 'bt prim whats', href: '#', target: '_blank', rel: 'noopener', onclick: e => {
        const d = digitos(inpTel.value);
        if (d.length < 12) { e.preventDefault(); A().toast('Coloque o número do cliente com DDD 📱', { erro: true }); inpTel.focus(); return; }
        e.currentTarget.href = `https://wa.me/${d}?text=${encodeURIComponent(ta.value)}`;
        env()[inpNome.value.trim() || ('+' + d)] = new Date().toISOString(); A().salvar(); setTimeout(desenharHist, 300);
      },
    }, '💬 Enviar no WhatsApp');
    atualizar(); desenharHist();
    rel.append(el('div', { class: 'enviar-cliente' },
      el('h3', {}, '📲 Enviar para o cliente'),
      el('div', { class: 'linha-envio' }, sel, inpNome, inpTel),
      ta,
      el('div', { class: 'lead-bts' }, enviar,
        el('button', { class: 'bt peq', onclick: async () => { try { await navigator.clipboard.writeText(ta.value); A().toast('Mensagem copiada 📋'); } catch (e) { A().toast('Não consegui copiar.', { erro: true }); } } }, '📋 Copiar mensagem')),
      el('small', { class: 'vazio' }, `Abre o WhatsApp com a mensagem pronta para o número do cliente. Confira se está na conta Business ${U().foneBonito(cfg.marketing.whats)} antes de enviar.`),
      historico));

    if (r.perguntas) {
      const exemplo = linkDe(clientes[0] ? clientes[0].nome : 'Cliente', cfg);
      rel.append(el('div', { class: 'form-previa' },
        el('h3', {}, '📋 Formulário que o cliente vai abrir'),
        el('ol', {}, r.perguntas.map(q => el('li', {}, q))),
        el('div', { class: 'lead-bts' },
          el('a', { class: 'bt peq', href: exemplo, target: '_blank', rel: 'noopener' }, '👀 Ver o formulário'),
          el('button', { class: 'bt peq', onclick: async () => { try { await navigator.clipboard.writeText('Pesquisa de satisfação — KWIK Contabilidade\n\n' + r.perguntas.map((q, i) => `${i + 1}. ${q}`).join('\n')); A().toast('Perguntas copiadas: cole no Google Forms 📋'); } catch (e) { A().toast('Não consegui copiar.', { erro: true }); } } }, '📄 Copiar perguntas p/ Google Forms')),
        el('small', { class: 'vazio' }, 'Quando o cliente toca em "Enviar respostas", o WhatsApp dele abre com tudo preenchido para o seu número — as respostas chegam direto no seu WhatsApp Business.')));
    }
    if (!clientes.length) rel.append(el('div', { class: 'obs', style: 'margin-top:14px' }, '👥 Cadastre seus clientes ativos em Personalizar → Clientes ativos. Eles aparecem no telão da sala de Relacionamento e na lista acima.'));
    box.append(rel);
  }

  KM.relacionamento = { trabalhar, renderRel, ACOES };
})();
