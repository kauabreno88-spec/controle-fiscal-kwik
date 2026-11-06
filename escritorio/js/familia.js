/* KWIK Mini Escritório · a família KWIK.
   Quem é quem (pelos ids, então continua certo mesmo se você trocar os nomes em Visual):
   - Kauã (f1): CEO, dono da KWIK. Namorado da Clara.
   - Clara: namorada e assistente do Kauã. Irmã do João.
   - Maycon: pai do Kauã e do Enzo, marido da Lena, filho da Dona Iva, irmão do Rodrigo. Chefe da Controladoria.
   - Lena: mãe do Kauã e do Enzo, esposa do Maycon. Chefe do Comercial.
   - Enzo: irmão do Kauã. Chefe do Marketing.
   - João (bia): irmão da Clara (cunhado do Kauã). Chefe do Relacionamento.
   - Rodrigo: tio do Kauã, irmão do Maycon, filho da Dona Iva. Financeiro.
   - Dona Iva: avó do Kauã e do Enzo, mãe do Maycon e do Rodrigo. Precificação.
   - Seu Zeca: limpeza e manutenção (não é da família; todo mundo trata com respeito e carinho). */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const nome = id => { const f = A().cfg().funcionarios.find(x => x.id === id); return f ? (f.nome || '').replace(/^(Seu|Dona)\s+/i, '').split(' ')[0] : ''; };
  const sorteio = arr => arr[Math.floor(Math.random() * arr.length)];

  // como "a" chama "b"
  const VOC = {
    'f1>clara': ['amor', 'meu bem', 'Clarinha'], 'clara>f1': ['amor', 'meu bem', 'chefinho'],
    'f1>maycon': ['pai'], 'maycon>f1': ['filho', 'meu filho'], 'f1>lena': ['mãe'], 'lena>f1': ['meu filho', 'filho'],
    'f1>enzo': ['mano', 'irmão'], 'enzo>f1': ['mano', 'irmão', 'chefe'], 'f1>bia': ['cunhado'], 'bia>f1': ['cunhado'],
    'f1>rodrigo': ['tio'], 'rodrigo>f1': ['sobrinho'], 'f1>iva': ['vó', 'vovó'], 'iva>f1': ['meu neto', 'meu filho'],
    'maycon>lena': ['amor', 'querida'], 'lena>maycon': ['amor', 'querido'], 'maycon>enzo': ['filho'], 'enzo>maycon': ['pai'],
    'lena>enzo': ['meu filho'], 'enzo>lena': ['mãe'], 'maycon>rodrigo': ['mano', 'irmão'], 'rodrigo>maycon': ['mano', 'irmão'],
    'maycon>iva': ['mãe'], 'iva>maycon': ['meu filho'], 'rodrigo>iva': ['mãe'], 'iva>rodrigo': ['meu filho'],
    'enzo>rodrigo': ['tio'], 'rodrigo>enzo': ['sobrinho'], 'enzo>iva': ['vó'], 'iva>enzo': ['meu neto'],
    'clara>bia': ['mano', 'irmão'], 'bia>clara': ['mana', 'maninha'], 'clara>lena': ['sogra', 'Dona Lena'], 'lena>clara': ['nora', 'Clarinha'],
    'clara>maycon': ['sogrão', 'Seu Maycon'], 'maycon>clara': ['nora', 'Clara'], 'enzo>clara': ['cunhada'], 'clara>enzo': ['cunhado'],
    'lena>rodrigo': ['cunhado'], 'rodrigo>lena': ['cunhada'], 'lena>iva': ['sogra', 'Dona Iva'], 'iva>lena': ['minha nora'],
    'clara>iva': ['vó', 'Dona Iva'], 'iva>clara': ['minha netinha', 'Clarinha'],
  };
  const PAPEL = { f1: 'CEO', clara: 'assistente', maycon: 'controladoria', lena: 'comercial', enzo: 'marketing', bia: 'relacionamento', rodrigo: 'financeiro', iva: 'precificacao', zeca: 'limpeza' };
  function vocativo(a, b) {
    if (b === 'zeca') return 'Seu Zeca';
    if (a === 'zeca') return ({ f1: 'Seu Kauã', iva: 'Dona Iva', lena: 'Dona Lena', clara: 'Dona Clara', maycon: 'Seu Maycon', rodrigo: 'Seu Rodrigo' })[b] || nome(b);
    const v = VOC[`${a}>${b}`];
    return v ? sorteio(v) : nome(b);
  }
  const ehFamilia = (a, b) => a !== 'zeca' && b !== 'zeca';
  const tipo = (a, b) => {
    const k = [a, b].sort().join('|');
    return ({ 'clara|f1': 'namorados', 'f1|maycon': 'paiFilho', 'enzo|maycon': 'paiFilho', 'f1|lena': 'maeFilho', 'enzo|lena': 'maeFilho', 'enzo|f1': 'irmaos',
      'bia|f1': 'cunhados', 'f1|rodrigo': 'tioSobrinho', 'enzo|rodrigo': 'tioSobrinho', 'f1|iva': 'avoNeto', 'enzo|iva': 'avoNeto', 'lena|maycon': 'casados',
      'maycon|rodrigo': 'irmaosVelhos', 'iva|maycon': 'maeFilhoVelho', 'iva|rodrigo': 'maeFilhoVelho', 'bia|clara': 'irmaosClara', 'clara|lena': 'sograNora',
      'clara|maycon': 'sograNora', 'clara|iva': 'avoNeto' })[k] || (ehFamilia(a, b) ? 'familia' : 'zeca');
  };

  // Falas [quem começa, quem responde]. {v} = como um chama o outro; {r} = como o outro responde.
  const PAPOS = {
    namorados: [['{v}, almoça comigo hoje? 🥰', 'Claro, {r}! 💚'], ['{v}, sua agenda de hoje tá organizada 📋', 'Você é a melhor assistente do mundo, {r} 😍'],
      ['{v}, já tomou água hoje? 💧', 'Tomei sim, {r}! Obrigado por cuidar de mim 🥰'], ['Reunião às 15h, {v}, não esquece 🗓️', 'Anotado, {r}! 💚']],
    // conversas com mais velho/mais novo: "velho" = o mais velho começa; "novo" = o mais novo começa
    paiFilho: { velho: [['{v}, a controladoria fechou o mês ✅', 'Valeu, {r}! Orgulho 💪'], ['{v}, achei mais clientes pra gente 📞', 'Boa, {r}! Manda pro Comercial 💼'], ['Tô orgulhoso de você, {v} 🥹', 'Aprendi com você, {r} 💚']],
      novo: [['{v}, como estão os números?', 'Tudo nos conformes, {r} 📊'], ['{v}, almoça com a gente hoje?', 'Claro, {r}! 🍲']] },
    maeFilho: { velho: [['{v}, já comeu? 🍲', 'Já sim, {r} 😅'], ['{v}, se agasalha, o ar tá gelado ❄️', 'Tá bom, {r} 😂'], ['{v}, fechei mais um cliente! 💼', 'Arrasou, {r}! 🎉']],
      novo: [['{v}, como tá o Comercial? 💼', 'Três propostas na rua, {r}! 💪'], ['Te amo, {v} 💚', 'Também te amo, {r} 🥰']] },
    irmaos: [['{v}, o vídeo novo bombou! 🎬', 'Boa, {r}! Bora crescer esse Insta 🔥'], ['Sinuca depois do expediente, {v}? 🎱', 'Só se for pra perder de novo, {r} 😂'],
      ['{v}, aprova o roteiro do Reels?', 'Aprovado, {r}! Manda bala 🚀']],
    cunhados: { novo: [['{v}, os clientes elogiaram o atendimento 💚', 'É o padrão KWIK, {r}!']], velho: [['{v}, cuida bem da minha irmã, hein 😂', 'Pode deixar, {r} 💚'], ['{v}, os clientes elogiaram o atendimento 💚', 'É o padrão KWIK, {r}!']] },
    tioSobrinho: { velho: [['{v}, a bolsa subiu hoje 📈', 'Boa, {r}! Me manda a análise 💰'], ['{v}, já investiu esse mês? 💰', 'Vou ver com você, {r} 📈']],
      novo: [['{v}, bora investir esse lucro? 💰', 'Bora, {v2}! Renda passiva é tudo 📈'], ['{v}, qual ação tá boa hoje? 📈', 'Já te mando a análise, {r} 🤓']] },
    avoNeto: { velho: [['Já tomou café, {v}? ☕', 'Já, {r}! 😄'], ['Que orgulho de você, {v} 🥹', 'Te amo, {r} 💜'], ['{v}, revisei os preços 🧮', 'Obrigado, {r}! Você é demais 💜']],
      novo: [['{v}, a bênção 🙏', 'Deus te abençoe, {r} 💜'], ['{v}, os preços tão certinhos? 🧮', 'Tudo calculadinho, {r} 💜']] },
    casados: [['{v}, hoje tem jantar lá em casa? 🍝', 'Tem sim, {r} 💕'], ['{v}, nosso filho tá indo muito bem 🥹', 'Puxou a gente, {r} 😄']],
    irmaosVelhos: [['{v}, investiu naquela ação? 📈', 'Tô analisando os dividendos, {r} 🤓'], ['{v}, a mãe tá precificando tudo 😂', 'Ninguém escapa da Dona Iva, {r} 😂']],
    maeFilhoVelho: { velho: [['{v}, almoça com a sua mãe hoje? 🍲', 'Claro, {r} 💜'], ['{v}, tá trabalhando demais', 'É pela família, {r} 😄']],
      novo: [['{v}, a bênção 🙏', 'Deus te abençoe, {r} 💜'], ['{v}, quer um café? ☕', 'Quero, {r}, obrigada 💜']] },
    irmaosClara: { velho: [['{v}, o {ceo} tá te dando muito trabalho? 😂', 'Nada, ele é um amor, {r} 🥰'], ['{v}, a pesquisa de satisfação veio ótima! 💚', 'Que orgulho, {r}!']],
      novo: [['{v}, a pesquisa de satisfação veio ótima! 💚', 'Que orgulho, {r}!'], ['{v}, almoço juntos? 🍝', 'Bora, {r}!']] },
    sograNora: { velho: [['{v}, você cuida tão bem dele 💚', 'Ah, {r}, ele merece 🥰'], ['{v}, vem almoçar com a gente domingo 🍝', 'Vou sim, {r}! 💚']],
      novo: [['{v}, o almoço de domingo tá de pé? 🍝', 'Claro, {r}! Você é da família 💚'], ['{v}, o {ceo} mandou um beijo 😘', 'Esse menino… 🥰']] },
    familia: [['{v}, bora um café? ☕', 'Bora, {r}!'], ['{v}, que dia corrido!', 'Mas rendeu bastante, {r} 💪'], ['Viu a notícia de hoje, {v}?', 'Vi! Já foi pro Marketing 🎬']],
    zeca: [['Bom dia, {v}! ☀️', 'Bom dia, {r}! Tudo limpinho pra vocês 🧹'], ['{v}, o senhor é demais! ✨', 'Obrigado, {r}! É um prazer 😊'],
      ['Com licença, {v}, vou passar um pano aqui 🧽', 'Fique à vontade, {r}!']],
  };
  // O CEO passando nos setores
  const RONDA = {
    maycon: ['{v}, como tá a Controladoria? 📊', 'Números em dia, {r}! ✅'], lena: ['{v}, como tá o Comercial? 💼', 'Três propostas na rua, {r}! 💪'],
    enzo: ['{v}, como tá o Marketing? 🎬', 'Engajamento lá em cima, {r}! 🔥'], bia: ['{v}, como estão os clientes? 💚', 'Satisfeitos, {r}! Média lá em cima 📊'],
    rodrigo: ['{v}, e os investimentos? 📈', 'Carteira de dividendos rendendo, {r} 💰'], iva: ['{v}, e os preços? 🧮', 'Tudo calculadinho, {r}! 💜'],
    clara: ['{v}, o que tem na agenda hoje? 📋', 'Tudo organizado, {r}! 🥰'],
  };

  // geração: quem é mais velho (para escolher as falas certas)
  const GERACAO = { iva: 3, maycon: 2, lena: 2, rodrigo: 2, f1: 1, enzo: 1, clara: 1, bia: 1, zeca: 2 };
  const MAIS_VELHO_IRMAO = { bia: 1 }; // João é o irmão mais velho da Clara; no casal de cunhados, o João "cobra" o Kauã
  function papo(a, b) {
    const ra = vocativo(a, b), rb = vocativo(b, a);
    let lista = a === 'f1' && RONDA[b] && Math.random() < 0.6 ? [RONDA[b]] : PAPOS[tipo(a, b)] || PAPOS.familia;
    if (!Array.isArray(lista)) {
      const velho = (GERACAO[a] || 1) > (GERACAO[b] || 1) || ((GERACAO[a] || 1) === (GERACAO[b] || 1) && MAIS_VELHO_IRMAO[a]);
      lista = velho ? lista.velho : lista.novo;
    }
    let [l1, l2] = sorteio(lista);
    l2 = l2.replace('{v2}', rb);
    const cap = s => s.replace(/^\s*(\S)/, (m, c) => m.replace(c, c.toUpperCase()));
    const ceo = s => s.replace('{ceo}', nome('f1') || 'chefe');
    return [cap(ceo(l1.replace('{v}', ra))), cap(ceo(l2.replace('{r}', rb)))];
  }
  // quem o Kauã visita, quem a Clara procura etc. (pesos: família próxima conversa mais)
  function parceiroPreferido(a, candidatos) {
    const peso = q => {
      const t = tipo(a, q.id);
      return t === 'namorados' ? 5 : ['paiFilho', 'maeFilho', 'irmaos', 'casados', 'irmaosClara', 'avoNeto'].includes(t) ? 3 : t === 'zeca' ? 1 : 2;
    };
    const tot = candidatos.reduce((s, q) => s + peso(q), 0);
    let x = Math.random() * tot;
    for (const q of candidatos) { x -= peso(q); if (x <= 0) return q; }
    return candidatos[0];
  }
  const casal = (a, b) => tipo(a, b) === 'namorados' || tipo(a, b) === 'casados';

  KM.familia = { vocativo, papo, tipo, parceiroPreferido, casal, PAPEL };
})();
