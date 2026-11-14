/* KWIK Mini Escritório · 🧮 Cálculo (atalho na tela inicial).
   Calculadoras da contabilidade, do Simples Nacional ao IBS/CBS da Reforma Tributária. Funciona sem internet.
   Cada calculadora é um item de CALCS: { id, grupo, ic, nome, desc, campos: [...], conta(v) -> { linhas, obs } }.
   Tabelas de 2026 (conferidas em nov/2026):
   - Salário mínimo R$ 1.621,00 (Decreto 12.797/2025). INSS empregado: 7,5% / 9% / 12% / 14%, teto R$ 8.475,55
     (Portaria Interministerial MPS/MF 13/2026).
   - IRRF: tabela progressiva mensal (desde maio/2025) + redução da Lei 15.270/2025: imposto zero até R$ 5.000 de
     rendimentos tributáveis; de R$ 5.000,01 a R$ 7.350 a redução é R$ 978,62 − 0,133145 × rendimento. Vale também no 13º.
   - Lucro Presumido: LC 224/2025 (+10% na presunção sobre a receita anual acima de R$ 5 milhões; há ações no STF).
   - Dividendos: Lei 15.270/2025 (retenção de 10% quando a mesma empresa paga mais de R$ 50 mil no mês à mesma pessoa).
   - IBS/CBS: LC 214/2025. 2026 = teste (CBS 0,9% + IBS 0,1%, compensáveis). 2027-2028: CBS cheia (referência − 0,1 p.p.)
     e IBS 0,1%; PIS/COFINS acabam. 2029-2032: ICMS/ISS caem 10%/20%/30%/40% e o IBS sobe. 2033: só IBS/CBS.
     Alíquotas de referência ainda não fixadas pelo Senado: os campos vêm com estimativas e podem ser trocados.
   As contas são simplificadas para conferência rápida; casos especiais pedem a legislação e o sistema da folha. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const el = (...a) => A().el(...a);
  const toast = (m, o) => A().toast(m, o);
  const LS = 'kwik-calculo';

  // ------------------------------------------------------------------ tabelas 2026
  const SM = 1621;
  const INSS_FAIXAS = [[1621.00, 0.075], [2902.84, 0.09], [4354.27, 0.12], [8475.55, 0.14]];
  const TETO_INSS = 8475.55;
  const IRRF_TAB = [[2428.80, 0, 0], [2826.65, 0.075, 182.16], [3751.05, 0.15, 394.16], [4664.68, 0.225, 675.49], [Infinity, 0.275, 908.73]];
  const DEP_IR = 189.59, DESC_SIMPLIFICADO = 607.20;
  const SN_LIM = [180000, 360000, 720000, 1800000, 3600000, 4800000];
  const SN = {
    I: [[0.04, 0], [0.073, 5940], [0.095, 13860], [0.107, 22500], [0.143, 87300], [0.19, 378000]],
    II: [[0.045, 0], [0.078, 5940], [0.10, 13860], [0.112, 22500], [0.147, 85500], [0.30, 720000]],
    III: [[0.06, 0], [0.112, 9360], [0.135, 17640], [0.16, 35640], [0.21, 125640], [0.33, 648000]],
    IV: [[0.045, 0], [0.09, 8100], [0.102, 12420], [0.14, 39780], [0.22, 183780], [0.33, 828000]],
    V: [[0.155, 0], [0.18, 4500], [0.195, 9900], [0.205, 17100], [0.23, 62100], [0.305, 540000]],
  };
  const ANEXOS = [['I', 'Anexo I · Comércio'], ['II', 'Anexo II · Indústria'], ['III', 'Anexo III · Serviços (sem Fator R)'], ['R', 'Anexo III ou V · pelo Fator R (ex.: contabilidade, consultoria, medicina)'], ['IV', 'Anexo IV · Construção, limpeza, vigilância, advocacia'], ['V', 'Anexo V · Serviços (sempre V)']];
  const PRESUNCAO = [
    ['serv', 'Serviços em geral (contabilidade, consultoria, engenharia…)', 0.32, 0.32],
    ['com', 'Comércio e indústria', 0.08, 0.12],
    ['hosp', 'Serviços hospitalares (com requisitos da Anvisa)', 0.08, 0.12],
    ['carga', 'Transporte de cargas', 0.08, 0.12],
    ['pass', 'Transporte de passageiros', 0.16, 0.12],
    ['comb', 'Revenda de combustíveis', 0.016, 0.12],
    ['constr', 'Construção por empreitada com material', 0.08, 0.12],
    ['peq', 'Serviços com receita anual até R$ 120 mil (exceto profissões regulamentadas)', 0.16, 0.32],
  ];

  // ------------------------------------------------------------------ utilidades
  const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const brl = n => (isFinite(n) && Math.abs(n) >= 0.005 ? n : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const pct = (n, c = 2) => (isFinite(n) ? n * 100 : 0).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }) + '%';
  const num = (n, c = 2) => (isFinite(n) ? n : 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: c });
  function lerNum(s) {
    s = String(s == null ? '' : s).trim().replace(/[R$\s%]/g, '');
    if (!s) return 0;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
    const n = parseFloat(s); return isFinite(n) ? n : 0;
  }
  const dataDe = s => { const d = s ? new Date(s + 'T12:00:00') : null; return d && !isNaN(d) ? d : null; };
  const diasEntre = (a, b) => Math.round((b - a) / 864e5);

  function inss(base) {
    const b = Math.min(Math.max(base, 0), TETO_INSS);
    let ant = 0, total = 0; const faixas = [];
    for (const [lim, a] of INSS_FAIXAS) {
      if (b <= ant) break;
      const parte = Math.min(b, lim) - ant; const v = parte * a;
      faixas.push([ant, Math.min(b, lim), a, v]); total += v; ant = lim;
    }
    return { valor: r2(total), faixas, efetiva: base > 0 ? total / base : 0, teto: base > TETO_INSS };
  }
  const impTabela = base => { if (base <= 0) return { imp: 0, aliq: 0, ded: 0 }; const f = IRRF_TAB.find(([lim]) => base <= lim); return { imp: Math.max(0, base * f[1] - f[2]), aliq: f[1], ded: f[2] }; };
  const reducao15270 = (rend, imp) => (rend <= 5000 ? Math.min(imp, 312.89) : rend <= 7350 ? Math.min(imp, Math.max(0, 978.62 - 0.133145 * rend)) : 0);
  // IRRF mensal: usa o que for melhor entre deduções legais e o desconto simplificado; aplica a redução da Lei 15.270
  function irrf(rend, { inss: vInss = 0, dep = 0, pensao = 0, outras = 0, simplificado = true } = {}) {
    const legais = vInss + dep * DEP_IR + pensao + outras;
    const usaSimpl = simplificado && DESC_SIMPLIFICADO > legais;
    const deducao = usaSimpl ? DESC_SIMPLIFICADO : legais;
    const base = Math.max(0, rend - deducao);
    const t = impTabela(base), red = reducao15270(rend, t.imp);
    return { base: r2(base), deducao: r2(deducao), modo: usaSimpl ? 'desconto simplificado' : 'deduções legais', aliq: t.aliq, impTabela: r2(t.imp), reducao: r2(red), valor: r2(Math.max(0, t.imp - red)) };
  }
  function simples(rbt12, anexo) {
    const tab = SN[anexo]; let i = SN_LIM.findIndex(l => rbt12 <= l); if (i < 0) i = 5;
    const [nom, ded] = tab[i];
    const efetiva = rbt12 <= 0 ? nom : i === 0 ? nom : (rbt12 * nom - ded) / rbt12;
    return { faixa: i + 1, nom, ded, efetiva: Math.max(0, efetiva) };
  }
  const anexoPorFatorR = (folha12, rbt12) => (rbt12 > 0 && folha12 / rbt12 >= 0.28 ? 'III' : 'V');

  // linha do resultado: [rótulo, valor, formato ('brl'|'pct'|'txt'|'num'), classe ('total'|'sub'|'neg'|'')]
  const L = (r, v, f = 'brl', c = '') => [r, v, f, c];
  const T = (r, v, f = 'brl') => L(r, v, f, 'total');
  const S = r => [r, null, 'sec', 'sec'];

  // ------------------------------------------------------------------ campos
  const brlC = (k, rot, p = '', dica) => ({ k, rot, tipo: 'brl', p, dica });
  const pctC = (k, rot, p = '', dica) => ({ k, rot, tipo: 'pct', p, dica });
  const numC = (k, rot, p = '', dica) => ({ k, rot, tipo: 'num', p, dica });
  const selC = (k, rot, ops, p, dica) => ({ k, rot, tipo: 'sel', ops, p: p == null ? ops[0][0] : p, dica });
  const datC = (k, rot, p = '', dica) => ({ k, rot, tipo: 'data', p, dica });
  const chkC = (k, rot, p = false, dica) => ({ k, rot, tipo: 'chk', p, dica });
  const hoje = () => new Date().toISOString().slice(0, 10);
  const REGIME_FOLHA = [['sn', 'Simples Nacional (Anexos I, II, III ou V)'], ['sn4', 'Simples Nacional · Anexo IV'], ['lp', 'Lucro Presumido ou Real']];

  // ------------------------------------------------------------------ calculadoras
  const CALCS = [
    // ============ Empresas · tributos
    { id: 'simples', grupo: 'Empresas · tributos', ic: '🟢', nome: 'Simples Nacional (DAS)', desc: 'Alíquota efetiva e valor do DAS pelo faturamento dos últimos 12 meses (RBT12), com Fator R.',
      campos: [brlC('fat', 'Faturamento do mês', '30.000,00'), brlC('rbt', 'Faturamento dos últimos 12 meses (RBT12)', '360.000,00', 'Sem os 12 meses (empresa nova)? Deixe 0: uso o faturamento do mês × 12.'),
        selC('anexo', 'Atividade / anexo', ANEXOS, 'R'), brlC('folha', 'Folha dos últimos 12 meses (salários + pró-labore + encargos)', '100.000,00', 'Só para o Fator R.')],
      conta(v) {
        const rbt = v.rbt > 0 ? v.rbt : v.fat * 12;
        const fr = rbt > 0 ? v.folha / rbt : 0;
        const anexo = v.anexo === 'R' ? anexoPorFatorR(v.folha, rbt) : v.anexo;
        const s = simples(rbt, anexo), das = r2(v.fat * s.efetiva);
        const linhas = [L('RBT12 usado', rbt), v.anexo === 'R' ? L('Fator R (folha ÷ RBT12)', fr, 'pct') : null, L('Anexo aplicado', 'Anexo ' + anexo, 'txt'),
          L('Faixa', s.faixa + 'ª faixa', 'txt'), L('Alíquota nominal', s.nom, 'pct'), L('Parcela a deduzir', s.ded), L('Alíquota efetiva', s.efetiva, 'pct', 'sub'), T('DAS do mês', das)];
        const obs = ['Alíquota efetiva = (RBT12 × alíquota nominal − parcela a deduzir) ÷ RBT12.'];
        if (v.anexo === 'R') obs.push(fr >= 0.28 ? 'Fator R de 28% ou mais: fica no Anexo III (mais barato).' : `Fator R abaixo de 28%: vai para o Anexo V. Para ir ao III, a folha de 12 meses precisaria ser ${brl(rbt * 0.28)} (falta ${brl(Math.max(0, rbt * 0.28 - v.folha))}).`);
        if (rbt > 3600000 && rbt <= 4800000) obs.push('Acima do sublimite de R$ 3,6 milhões: ICMS e ISS saem do DAS e são pagos à parte, como numa empresa normal.');
        if (rbt > 4800000) obs.push('⚠️ Acima de R$ 4,8 milhões: a empresa é excluída do Simples Nacional.');
        if (anexo === 'IV') obs.push('Anexo IV: a CPP (INSS patronal de 20% + RAT) é paga à parte, fora do DAS.');
        return { linhas, obs };
      } },
    { id: 'mei', grupo: 'Empresas · tributos', ic: '🧾', nome: 'MEI (DAS mensal)', desc: 'Valor do DAS do MEI em 2026 e o controle do limite de faturamento.',
      campos: [selC('tipo', 'Atividade', [['com', 'Comércio ou indústria'], ['serv', 'Serviços'], ['ambos', 'Comércio e serviços'], ['cam', 'MEI caminhoneiro (transporte de cargas)']]), brlC('ano', 'Faturamento no ano até agora', '50.000,00'), numC('meses', 'Meses de atividade no ano', '12')],
      conta(v) {
        const prev = r2(SM * (v.tipo === 'cam' ? 0.12 : 0.05)), icms = v.tipo === 'serv' ? 0 : 1, iss = v.tipo === 'com' || v.tipo === 'cam' ? 0 : 5;
        const limite = (v.tipo === 'cam' ? 251600 : 81000) * Math.min(12, Math.max(1, v.meses || 12)) / 12;
        const sobra = limite - v.ano, exc = -sobra;
        const linhas = [L('INSS (' + (v.tipo === 'cam' ? '12%' : '5%') + ' do salário mínimo)', prev), L('ICMS', icms), L('ISS', iss), T('DAS do mês', prev + icms + iss), S('Limite de faturamento'),
          L('Limite proporcional do ano', limite), sobra >= 0 ? L('Ainda pode faturar', sobra, 'brl', 'sub') : L('Passou do limite em', exc, 'brl', 'neg')];
        const obs = [`Salário mínimo 2026: ${brl(SM)}.`];
        if (exc > 0) obs.push(exc <= limite * 0.2 ? 'Passou até 20%: continua MEI até dezembro, paga DAS complementar sobre o excesso e vira ME no ano seguinte.' : '⚠️ Passou mais de 20%: desenquadra com efeito retroativo a janeiro (ou ao início da atividade) e paga como ME/Simples.');
        return { linhas, obs };
      } },
    { id: 'presumido', grupo: 'Empresas · tributos', ic: '🏢', nome: 'Lucro Presumido (trimestre)', desc: 'IRPJ, adicional, CSLL, PIS, COFINS e ISS/ICMS de um trimestre, já com a LC 224/2025.',
      campos: [brlC('tri', 'Faturamento do trimestre', '300.000,00'), selC('ativ', 'Atividade', PRESUNCAO.map(p => [p[0], p[1]])), brlC('antes', 'Faturamento do ano ANTES deste trimestre', '0,00', 'Para a LC 224/2025: só a parte da receita do ano acima de R$ 5 milhões tem presunção 10% maior.'),
        brlC('outras', 'Outras receitas do trimestre (aluguéis, rendimentos, ganhos)', '0,00', 'Entram inteiras na base do IRPJ e da CSLL.'), pctC('muni', 'ISS ou ICMS sobre o faturamento (%)', '5', 'Deixe 0 se não quiser somar.')],
      conta(v) {
        const [, , pI, pC] = PRESUNCAO.find(p => p[0] === v.ativ);
        const exc = Math.max(0, v.antes + v.tri - 5000000) - Math.max(0, v.antes - 5000000);
        const baseI = v.tri * pI + exc * pI * 0.10 + v.outras, baseC = v.tri * pC + exc * pC * 0.10 + v.outras;
        const irpj = baseI * 0.15, adic = Math.max(0, baseI - 60000) * 0.10, csll = baseC * 0.09, pis = v.tri * 0.0065, cof = v.tri * 0.03, muni = v.tri * v.muni / 100;
        const total = irpj + adic + csll + pis + cof + muni;
        const linhas = [L('Presunção IRPJ / CSLL', pct(pI, 1) + ' / ' + pct(pC, 1), 'txt'), exc > 0 ? L('Receita acima de R$ 5 mi (presunção +10%)', exc, 'brl', 'neg') : null,
          L('Base do IRPJ', baseI), L('IRPJ (15%)', irpj), L('Adicional do IRPJ (10% acima de R$ 60 mil)', adic), L('Base da CSLL', baseC), L('CSLL (9%)', csll),
          L('PIS (0,65%)', pis), L('COFINS (3%)', cof), v.muni ? L('ISS/ICMS (' + num(v.muni) + '%)', muni) : null, T('Total do trimestre', total), L('Carga sobre o faturamento', v.tri ? total / v.tri : 0, 'pct', 'sub'),
          S('Pagamento'), L('IRPJ + adicional (DARF 2089)', irpj + adic), L('CSLL (DARF 2372)', csll), L('PIS e COFINS (mensais, DARF 8109 e 2172)', pis + cof)];
        const obs = ['IRPJ e CSLL são trimestrais (podem ser pagos em 3 cotas, com juros a partir da 2ª). PIS e COFINS são mensais, no regime cumulativo.'];
        if (exc > 0) obs.push('LC 224/2025: há ações no STF (ADI 7.920) e há divergência sobre a CSLL (vigência a partir de abril/2026). Confira a situação antes de recolher.');
        return { linhas, obs };
      } },
    { id: 'real', grupo: 'Empresas · tributos', ic: '📊', nome: 'Lucro Real (trimestre)', desc: 'IRPJ, CSLL e PIS/COFINS não cumulativos, com compensação de prejuízo (trava de 30%).',
      campos: [brlC('lucro', 'Lucro antes do IR (já com adições e exclusões)', '150.000,00'), brlC('prej', 'Prejuízo fiscal acumulado para compensar', '0,00'), brlC('fat', 'Faturamento do trimestre', '600.000,00'),
        brlC('cred', 'Compras e despesas que dão crédito de PIS/COFINS', '200.000,00')],
      conta(v) {
        const comp = Math.min(v.prej, Math.max(0, v.lucro) * 0.30), base = Math.max(0, v.lucro - comp);
        const irpj = base * 0.15, adic = Math.max(0, base - 60000) * 0.10, csll = base * 0.09;
        const pis = Math.max(0, (v.fat - v.cred) * 0.0165), cof = Math.max(0, (v.fat - v.cred) * 0.076);
        const total = irpj + adic + csll + pis + cof;
        return { linhas: [L('Prejuízo compensado (até 30% do lucro)', comp), L('Lucro real (base)', base), L('IRPJ (15%)', irpj), L('Adicional (10% acima de R$ 60 mil)', adic), L('CSLL (9%)', csll),
          L('PIS (1,65% sobre faturamento − créditos)', pis), L('COFINS (7,6% sobre faturamento − créditos)', cof), T('Total do trimestre', total), L('Carga sobre o faturamento', v.fat ? total / v.fat : 0, 'pct', 'sub')],
          obs: ['A CSLL também pode compensar base negativa com a mesma trava de 30% (aqui uso o mesmo valor).', 'No Lucro Real anual há estimativas mensais e balancetes de suspensão/redução.'] };
      } },
    { id: 'comparar', grupo: 'Empresas · tributos', ic: '⚖️', nome: 'Comparar regimes', desc: 'Simples × Presumido × Real por mês, com folha e pró-labore, para ver o mais barato.',
      campos: [brlC('fat', 'Faturamento médio do mês', '50.000,00'), selC('ativ', 'Atividade', [['servR', 'Serviço com Fator R (contabilidade, consultoria, saúde…)'], ['servIII', 'Serviço do Anexo III'], ['servIV', 'Serviço do Anexo IV'], ['com', 'Comércio'], ['ind', 'Indústria']]),
        brlC('folha', 'Folha do mês (salários)', '8.000,00'), brlC('pro', 'Pró-labore do mês', '3.000,00'), pctC('margem', 'Margem de lucro real (%)', '20', 'Para estimar o Lucro Real.'), pctC('muni', 'ISS ou ICMS (%)', '5'), pctC('cred', 'Parte do faturamento que gera crédito de PIS/COFINS (%)', '0', 'Lucro Real: compras de mercadorias, insumos…')],
      conta(v) {
        const serv = v.ativ.startsWith('serv'), rbt = v.fat * 12, folha12 = (v.folha + v.pro) * 12 * 1.08;
        const anexo = v.ativ === 'servR' ? anexoPorFatorR(folha12, rbt) : { servIII: 'III', servIV: 'IV', com: 'I', ind: 'II' }[v.ativ];
        const sn = simples(rbt, anexo), cppSN = anexo === 'IV' ? (v.folha + v.pro) * 0.22 : 0;
        const tSimples = v.fat * sn.efetiva + cppSN;
        const pI = serv ? 0.32 : 0.08, pC = serv ? 0.32 : 0.12, encargos = v.folha * (0.20 + 0.02 + 0.058) + v.pro * 0.20;
        const bI = v.fat * pI; const tPres = bI * 0.15 + Math.max(0, bI - 20000) * 0.10 + v.fat * pC * 0.09 + v.fat * 0.0365 + v.fat * v.muni / 100 + encargos;
        const lucro = v.fat * v.margem / 100; const tReal = Math.max(0, lucro) * 0.24 + Math.max(0, lucro - 20000) * 0.10 + Math.max(0, v.fat * (1 - v.cred / 100)) * 0.0925 + v.fat * v.muni / 100 + encargos;
        const ops = [['Simples Nacional (Anexo ' + anexo + ')', tSimples], ['Lucro Presumido', tPres], ['Lucro Real', tReal]];
        const melhor = ops.slice().sort((a, b) => a[1] - b[1])[0];
        return { linhas: [S('Impostos + encargos da folha, por mês'), ...ops.map(([n, t]) => L(n + ' · ' + pct(v.fat ? t / v.fat : 0, 1), t, 'brl', n === melhor[0] ? 'total' : '')), S('Por ano'), ...ops.map(([n, t]) => L(n, t * 12)),
          L('Economia do mais barato sobre o 2º', (ops.map(o => o[1]).sort((a, b) => a - b)[1] - melhor[1]) * 12, 'brl', 'sub')],
          obs: [`Mais barato: ${melhor[0]}.`, 'Estimativa: Simples com RBT12 = faturamento × 12 (no Anexo IV soma a CPP de 22% da folha); Presumido e Real com INSS patronal 20% + RAT 2% + terceiros 5,8% sobre a folha e 20% sobre o pró-labore; ISS/ICMS igual nos três. Não inclui FGTS (igual em todos), LC 224 nem IBS/CBS.'] };
      } },
    { id: 'retencoes', grupo: 'Empresas · tributos', ic: '✂️', nome: 'Retenções na nota de serviço', desc: 'IRRF, PIS/COFINS/CSLL (4,65%), INSS e ISS retidos quando uma empresa contrata outra.',
      campos: [brlC('valor', 'Valor da nota', '10.000,00'), selC('serv', 'Serviço', [['geral', 'Serviços profissionais em geral (IR 1,5%)'], ['limp', 'Limpeza, conservação, segurança, vigilância (IR 1%)'], ['nenhum', 'Sem retenção de IR']]),
        chkC('csrf', 'Reter PIS/COFINS/CSLL (4,65%)', true), chkC('inss', 'Cessão de mão de obra / empreitada (INSS 11%)', false), brlC('mat', 'Materiais e equipamentos na nota (abatem do INSS)', '0,00'),
        pctC('iss', 'ISS retido (%)', '0', 'Só quando a lei do município manda reter.'), chkC('sn', 'O prestador é do Simples Nacional', false, 'Simples: não sofre retenção de IR nem de PIS/COFINS/CSLL (há exceções).')],
      conta(v) {
        const ir = v.sn || v.serv === 'nenhum' ? 0 : v.valor * (v.serv === 'limp' ? 0.01 : 0.015);
        const csrf = v.sn || !v.csrf ? 0 : v.valor * 0.0465;
        const inssR = v.inss ? Math.max(0, v.valor - v.mat) * 0.11 : 0, iss = v.valor * v.iss / 100;
        const irF = ir <= 10 ? 0 : ir, csF = csrf <= 10 ? 0 : csrf, tot = irF + csF + inssR + iss;
        return { linhas: [L('IRRF', irF), L('PIS (0,65%)', csF ? v.valor * 0.0065 : 0), L('COFINS (3%)', csF ? v.valor * 0.03 : 0), L('CSLL (1%)', csF ? v.valor * 0.01 : 0), L('INSS (11%)', inssR), L('ISS', iss), L('Total retido', tot, 'brl', 'sub'), T('Líquido a pagar ao prestador', v.valor - tot)],
          obs: ['Retenções de até R$ 10,00 (IR e PIS/COFINS/CSLL) são dispensadas.', 'Quem paga recolhe: IRRF (DARF 1708), PIS/COFINS/CSLL (DARF 5952), INSS na DCTFWeb (EFD-Reinf).', v.sn && v.inss ? 'Simples: o INSS de 11% só é retido de empresas do Anexo IV (e alguns casos do III).' : ''].filter(Boolean) };
      } },
    { id: 'iss', grupo: 'Empresas · tributos', ic: '🏙️', nome: 'ISS', desc: 'ISS da nota de serviço (2% a 5%), retido ou não.',
      campos: [brlC('valor', 'Valor do serviço', '5.000,00'), pctC('aliq', 'Alíquota do município (%)', '5'), brlC('ded', 'Deduções da base (materiais, quando a lei permite)', '0,00'), chkC('ret', 'ISS retido pelo tomador', false)],
      conta(v) { const base = Math.max(0, v.valor - v.ded), iss = base * v.aliq / 100; return { linhas: [L('Base de cálculo', base), T('ISS', iss), L('Líquido a receber', v.valor - (v.ret ? iss : 0), 'brl', 'sub')], obs: ['ISS mínimo de 2% e máximo de 5% (LC 116/2003). Em 2029-2032 o ISS cai aos poucos e em 2033 vira IBS.'] }; } },
    { id: 'icms', grupo: 'Empresas · tributos', ic: '📦', nome: 'ICMS (cálculo por dentro)', desc: 'ICMS embutido no preço: quanto é o imposto e qual o preço com ICMS.',
      campos: [brlC('valor', 'Valor', '1.000,00'), selC('modo', 'Esse valor…', [['sem', 'é SEM o ICMS (quero o preço com ICMS)'], ['com', 'já tem o ICMS dentro']]), pctC('aliq', 'Alíquota (%)', '18'), pctC('red', 'Redução de base (%)', '0'), pctC('fcp', 'FCP – Fundo de pobreza (%)', '0')],
      conta(v) {
        const a = v.aliq / 100 * (1 - v.red / 100), f = v.fcp / 100;
        const preco = v.modo === 'sem' ? v.valor / (1 - a - f) : v.valor, icms = preco * a, fcp = preco * f;
        return { linhas: [L('Preço com ICMS (base)', preco), L('Alíquota efetiva', a, 'pct'), T('ICMS', icms), f ? L('FCP', fcp) : null, L('Valor sem o ICMS', preco - icms - fcp, 'brl', 'sub')], obs: ['O ICMS é "por dentro": ele faz parte da própria base. Por isso preço = valor ÷ (1 − alíquota).'] };
      } },
    { id: 'difal', grupo: 'Empresas · tributos', ic: '🗺️', nome: 'DIFAL do ICMS', desc: 'Diferencial de alíquota em venda para outro estado (consumidor final), base única ou dupla.',
      campos: [brlC('valor', 'Valor da operação (com ICMS)', '1.000,00'), pctC('inter', 'Alíquota interestadual (%)', '12', '4% importados; 7% do Sul/Sudeste (exceto ES) para N/NE/CO e ES; 12% nos demais.'), pctC('interna', 'Alíquota interna do estado de destino (%)', '20'),
        pctC('fcp', 'FCP no destino (%)', '0'), selC('base', 'Base de cálculo', [['dupla', 'Base dupla (por dentro, LC 190/2022)'], ['unica', 'Base única']])],
      conta(v) {
        const ai = v.inter / 100, ad = v.interna / 100, f = v.fcp / 100, origem = v.valor * ai;
        let base, difal;
        if (v.base === 'dupla') { base = (v.valor - origem) / (1 - ad - f); difal = base * ad - origem; } else { base = v.valor; difal = v.valor * (ad - ai); }
        return { linhas: [L('ICMS da origem (interestadual)', origem), L('Base no destino', base), T('DIFAL a pagar ao destino', Math.max(0, difal)), f ? L('FCP', base * f) : null], obs: ['Contribuinte do ICMS (uso, consumo ou ativo) e venda a não contribuinte usam regras de cada estado: confira se o destino usa base dupla.'] };
      } },
    { id: 'icmsst', grupo: 'Empresas · tributos', ic: '🔗', nome: 'ICMS-ST (substituição tributária)', desc: 'Base com MVA, ICMS-ST a reter e MVA ajustada para operações interestaduais.',
      campos: [brlC('valor', 'Valor dos produtos', '1.000,00'), brlC('ipi', 'IPI', '0,00'), brlC('frete', 'Frete, seguro e outras despesas', '0,00'), pctC('mva', 'MVA original (%)', '40'), pctC('interna', 'Alíquota interna do destino (%)', '18'),
        pctC('propria', 'Alíquota da operação própria (%)', '12'), chkC('ajustar', 'Operação interestadual: usar MVA ajustada', true)],
      conta(v) {
        const ai = v.propria / 100, ad = v.interna / 100;
        const mva = v.ajustar && ai !== ad ? ((1 + v.mva / 100) * (1 - ai) / (1 - ad) - 1) : v.mva / 100;
        const baseP = v.valor + v.frete, proprio = baseP * ai, baseST = (v.valor + v.ipi + v.frete) * (1 + mva), st = Math.max(0, baseST * ad - proprio);
        return { linhas: [L('MVA usada', mva, 'pct'), L('ICMS próprio', proprio), L('Base do ICMS-ST', baseST), T('ICMS-ST a reter', st), L('Total da nota', v.valor + v.ipi + v.frete + st, 'brl', 'sub')],
          obs: ['MVA ajustada = [(1 + MVA) × (1 − alíquota interestadual) ÷ (1 − alíquota interna)] − 1.'] };
      } },
    { id: 'piscofins', grupo: 'Empresas · tributos', ic: '💠', nome: 'PIS e COFINS', desc: 'Cumulativo (Presumido) ou não cumulativo (Real) com créditos. Acabam em 2027 (viram CBS).',
      campos: [brlC('fat', 'Faturamento do mês', '100.000,00'), selC('reg', 'Regime', [['cum', 'Cumulativo (0,65% + 3%)'], ['nao', 'Não cumulativo (1,65% + 7,6%)']]), brlC('cred', 'Compras/despesas com crédito (só não cumulativo)', '30.000,00')],
      conta(v) {
        const nc = v.reg === 'nao', ap = nc ? 0.0165 : 0.0065, ac = nc ? 0.076 : 0.03, base = nc ? Math.max(0, v.fat - v.cred) : v.fat;
        return { linhas: [nc ? L('Créditos tomados (PIS + COFINS)', v.cred * 0.0925) : null, L('PIS', base * ap), L('COFINS', base * ac), T('Total', base * (ap + ac)), L('Carga sobre o faturamento', v.fat ? base * (ap + ac) / v.fat : 0, 'pct', 'sub')], obs: ['A partir de 2027 PIS e COFINS deixam de existir e entra a CBS (veja a calculadora IBS e CBS).'] };
      } },

    // ============ Reforma Tributária
    { id: 'ibscbs', grupo: 'Reforma Tributária', ic: '🆕', nome: 'IBS e CBS', desc: 'Quanto de IBS e CBS numa venda, com redução, crédito das compras e a transição de 2026 a 2033.',
      campos: [brlC('valor', 'Valor da venda (sem IBS/CBS)', '10.000,00'), brlC('compras', 'Compras com crédito (sem IBS/CBS)', '3.000,00', 'Mercadorias, insumos e serviços comprados de quem paga IBS/CBS.'),
        selC('trat', 'Tratamento', [['0', 'Padrão (alíquota cheia)'], ['30', 'Redução de 30% (profissões regulamentadas: contador, advogado, engenheiro…)'], ['60', 'Redução de 60% (saúde, educação, alimentos, medicamentos…)'], ['100', 'Alíquota zero (cesta básica nacional e outros)']]),
        selC('ano', 'Ano', ['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033'].map(a => [a, a]), '2027'),
        pctC('cbs', 'Alíquota de referência da CBS (%)', '11,3', 'TCU propôs 11,3% para 2027 (out/2026); o Senado decide até 15/12/2026.'), pctC('ibs', 'Alíquota de referência do IBS (%)', '18,7', 'Estimativa do Comitê Gestor (CGIBS, 2026). Estados e municípios fixam as suas.'),
        pctC('icmsiss', 'ICMS ou ISS de hoje sobre a venda (%)', '5', 'Para mostrar quanto ainda sobra deles na transição.'), pctC('pc', 'PIS/COFINS de hoje (%)', '3,65', '3,65% no cumulativo, 9,25% no não cumulativo.')],
      conta(v) {
        const red = Number(v.trat) / 100, cbsR = v.cbs / 100, ibsR = v.ibs / 100, ano = Number(v.ano);
        const fase = a => {
          if (a <= 2026) return { cbs: 0.009, ibs: 0.001, velho: 1, pc: 1, teste: true };
          if (a <= 2028) return { cbs: Math.max(0, cbsR - 0.001), ibs: 0.001, velho: 1, pc: 0 };
          if (a <= 2032) { const k = (a - 2028) / 10; return { cbs: cbsR, ibs: ibsR * k, velho: 1 - k, pc: 0 }; }
          return { cbs: cbsR, ibs: ibsR, velho: 0, pc: 0 };
        };
        const linhaAno = a => {
          const f = fase(a), cbs = v.valor * f.cbs * (1 - red), ibs = v.valor * f.ibs * (1 - red);
          const credCbs = v.compras * f.cbs, credIbs = v.compras * f.ibs;
          return { f, cbs, ibs, credCbs, credIbs, pagar: Math.max(0, cbs - credCbs) + Math.max(0, ibs - credIbs), velho: v.valor * v.icmsiss / 100 * f.velho, pc: v.valor * v.pc / 100 * f.pc };
        };
        const x = linhaAno(ano);
        const linhas = [L('Alíquota CBS no ano', x.f.cbs * (1 - red), 'pct'), L('Alíquota IBS no ano', x.f.ibs * (1 - red), 'pct'), L('CBS sobre a venda', x.cbs), L('IBS sobre a venda', x.ibs),
          L('Crédito das compras (CBS + IBS)', -(x.credCbs + x.credIbs), 'brl', 'neg'), T(x.f.teste ? 'A pagar (2026: compensa com PIS/COFINS)' : 'IBS + CBS a pagar', x.f.teste ? 0 : x.pagar),
          L('Preço para o cliente (venda + IBS + CBS)', v.valor + x.cbs + x.ibs, 'brl', 'sub'), x.velho ? L('ICMS/ISS que ainda existe no ano', x.velho) : null, x.pc ? L('PIS/COFINS no ano', x.pc) : null,
          S('Transição ano a ano (impostos sobre esta venda, sem créditos)')];
        for (let a = 2026; a <= 2033; a++) { const y = linhaAno(a); linhas.push(L(`${a}${a === ano ? ' ◀' : ''} · CBS ${pct(y.f.cbs * (1 - red))} + IBS ${pct(y.f.ibs * (1 - red))}`, (y.f.teste ? 0 : y.cbs + y.ibs) + y.velho + y.pc, 'brl', a === ano ? 'sub' : '')); }
        const obs = ['IBS e CBS são "por fora": não entram na própria base (diferente do ICMS). O crédito é amplo: tudo o que foi comprado com IBS/CBS gera crédito.',
          '2026 é ano de teste: CBS 0,9% e IBS 0,1% destacados na nota e compensados com PIS/COFINS (sem custo a mais).',
          '2027-2028: PIS e COFINS acabam; CBS = referência − 0,1 p.p.; IBS 0,1%. 2029-2032: ICMS e ISS caem 10%/20%/30%/40% e o IBS sobe na mesma proporção. 2033: só IBS e CBS.',
          'Split payment: o imposto pode ser separado na hora do pagamento (cartão, Pix) e ir direto para o governo.',
          'Simples Nacional: continua pagando pelo DAS (o cliente só aproveita o crédito do que foi pago no DAS). A partir de 2027 pode optar por pagar IBS/CBS por fora, no regime regular, para o cliente ter crédito cheio (opção semestral; a primeira em setembro/2026).'];
        if (v.cbs + v.ibs > 26.5) obs.push('⚠️ A soma das referências passa de 26,5%: a LC 214/2025 prevê um mecanismo para reduzir. Troque os campos quando o Senado fixar as alíquotas.');
        return { linhas, obs };
      } },

    // ============ Folha e trabalhista
    { id: 'liquido', grupo: 'Folha e trabalhista', ic: '💵', nome: 'Salário líquido', desc: 'Do bruto ao líquido: INSS, IRRF 2026 (com a isenção até R$ 5 mil) e outros descontos.',
      campos: [brlC('bruto', 'Salário bruto (com adicionais)', '4.500,00'), numC('dep', 'Dependentes para o IR', '0'), brlC('pensao', 'Pensão alimentícia judicial', '0,00'), brlC('outros', 'Outros descontos (VT, plano, faltas…)', '0,00')],
      conta(v) {
        const i = inss(v.bruto), ir = irrf(v.bruto, { inss: i.valor, dep: v.dep, pensao: v.pensao });
        return { linhas: [L('Salário bruto', v.bruto), L('INSS (' + pct(i.efetiva) + ' efetivo)', -i.valor, 'brl', 'neg'), L('IRRF', -ir.valor, 'brl', 'neg'), v.pensao ? L('Pensão', -v.pensao, 'brl', 'neg') : null, v.outros ? L('Outros descontos', -v.outros, 'brl', 'neg') : null,
          T('Salário líquido', v.bruto - i.valor - ir.valor - v.pensao - v.outros), S('Detalhe do IRRF'), L('Dedução usada (' + ir.modo + ')', ir.deducao), L('Base do IR', ir.base), L('Imposto pela tabela', ir.impTabela), L('Redução da Lei 15.270/2025', -ir.reducao, 'brl', 'neg'), L('FGTS depositado pela empresa (8%)', v.bruto * 0.08, 'brl', 'sub')],
          obs: ['Até R$ 5.000,00 de salário tributável o IR é zero em 2026. Entre R$ 5.000,01 e R$ 7.350,00 o desconto diminui aos poucos.', 'O IR usa o que for melhor para o empregado: deduções legais ou o desconto simplificado de R$ 607,20.'] };
      } },
    { id: 'inss', grupo: 'Folha e trabalhista', ic: '🛡️', nome: 'INSS do empregado', desc: 'Desconto do INSS faixa a faixa (tabela progressiva 2026).',
      campos: [brlC('sal', 'Salário de contribuição', '3.500,00')],
      conta(v) {
        const i = inss(v.sal);
        return { linhas: [...i.faixas.map(([de, ate, a, val]) => L(`${pct(a, 1)} de ${brl(de)} até ${brl(ate)}`, val)), T('INSS', i.valor), L('Alíquota efetiva', i.efetiva, 'pct', 'sub')],
          obs: [`Teto 2026: ${brl(TETO_INSS)} (desconto máximo ${brl(inss(TETO_INSS).valor)}). Salário mínimo: ${brl(SM)}.`, i.teto ? 'Salário acima do teto: o desconto para no teto.' : ''].filter(Boolean) };
      } },
    { id: 'irrf', grupo: 'Folha e trabalhista', ic: '🦁', nome: 'IRRF mensal (2026)', desc: 'Imposto de renda na fonte com a redução da Lei 15.270/2025, passo a passo.',
      campos: [brlC('rend', 'Rendimentos tributáveis do mês', '6.000,00'), brlC('inss', 'INSS descontado (deixe 0 para calcular)', '0,00'), numC('dep', 'Dependentes', '0'), brlC('pensao', 'Pensão alimentícia judicial', '0,00'), brlC('prev', 'Previdência privada (PGBL/Funpresp)', '0,00')],
      conta(v) {
        const vi = v.inss || inss(v.rend).valor, ir = irrf(v.rend, { inss: vi, dep: v.dep, pensao: v.pensao, outras: v.prev });
        return { linhas: [L('INSS', vi), L('Dependentes (' + num(v.dep, 0) + ' × ' + brl(DEP_IR) + ')', v.dep * DEP_IR), L('Dedução usada · ' + ir.modo, ir.deducao), L('Base de cálculo', ir.base), L('Alíquota da faixa', ir.aliq, 'pct'),
          L('Imposto pela tabela', ir.impTabela), L('Redução Lei 15.270/2025', -ir.reducao, 'brl', 'neg'), T('IRRF a reter', ir.valor), L('Alíquota efetiva sobre o rendimento', v.rend ? ir.valor / v.rend : 0, 'pct', 'sub')],
          obs: ['Tabela: até R$ 2.428,80 isento; 7,5% até R$ 2.826,65; 15% até R$ 3.751,05; 22,5% até R$ 4.664,68; 27,5% acima.', 'Redução: rendimento até R$ 5.000 → imposto zero (até R$ 312,89); de R$ 5.000,01 a R$ 7.350 → R$ 978,62 − 0,133145 × rendimento.'] };
      } },
    { id: 'fgts', grupo: 'Folha e trabalhista', ic: '🏦', nome: 'FGTS e multa', desc: 'Depósito mensal do FGTS e multa rescisória de 40% (ou 20% no acordo).',
      campos: [brlC('sal', 'Remuneração do mês', '3.000,00'), selC('tipo', 'Tipo', [['8', 'Empregado (8%)'], ['2', 'Jovem aprendiz (2%)'], ['dom', 'Doméstico (8% + 3,2% de indenização)']]), numC('meses', 'Meses de depósito', '12'), brlC('saldo', 'Saldo atual do FGTS (se souber)', '0,00')],
      conta(v) {
        const a = v.tipo === '2' ? 0.02 : 0.08, mes = v.sal * a, ind = v.tipo === 'dom' ? v.sal * 0.032 : 0, saldo = v.saldo || mes * v.meses;
        return { linhas: [L('Depósito do mês', mes), ind ? L('Indenização compensatória (doméstico)', ind) : null, L('Saldo considerado', saldo), T('Multa de 40% (dispensa sem justa causa)', saldo * 0.4), L('Multa de 20% (acordo, art. 484-A)', saldo * 0.2, 'brl', 'sub')],
          obs: ['A multa é calculada sobre todos os depósitos do contrato (com correção), não só sobre o saldo que sobrou após saques.'] };
      } },
    { id: 'custo', grupo: 'Folha e trabalhista', ic: '🏷️', nome: 'Custo do funcionário', desc: 'Quanto um empregado custa por mês para a empresa, com encargos e provisões.',
      campos: [brlC('sal', 'Salário', '3.000,00'), selC('reg', 'Regime da empresa', REGIME_FOLHA), pctC('rat', 'RAT/FAP (%)', '2'), pctC('terc', 'Terceiros/Sistema S (%)', '5,8'), brlC('vt', 'Vale-transporte pago pela empresa', '0,00'), brlC('vr', 'Vale-refeição/alimentação', '0,00'), brlC('outros', 'Outros benefícios (plano de saúde…)', '0,00')],
      conta(v) {
        const patronal = v.reg === 'lp' ? 0.20 + v.rat / 100 + v.terc / 100 : v.reg === 'sn4' ? 0.20 + v.rat / 100 : 0;
        const ferias = v.sal / 12 * (4 / 3), dec = v.sal / 12, base = v.sal + ferias + dec;
        const fgts = base * 0.08, enc = base * patronal, multa = v.sal * 0.08 * 0.4;
        const total = base + fgts + enc + multa + v.vt + v.vr + v.outros;
        return { linhas: [L('Salário', v.sal), L('Férias + 1/3 (provisão mensal)', ferias), L('13º salário (provisão mensal)', dec), L('FGTS 8% (sobre salário e provisões)', fgts), L('INSS patronal + RAT + terceiros (' + pct(patronal, 1) + ')', enc),
          L('Provisão da multa de 40% do FGTS', multa), v.vt + v.vr + v.outros ? L('Benefícios', v.vt + v.vr + v.outros) : null, T('Custo mensal', total), L('Custo anual', total * 12, 'brl', 'sub'), L('Quanto o custo é do salário', v.sal ? total / v.sal : 0, 'pct')],
          obs: ['Simples (Anexos I, II, III e V): o INSS patronal já está no DAS. Anexo IV e Presumido/Real pagam à parte.', 'Vale-transporte: a empresa paga o que passar de 6% do salário.'] };
      } },
    { id: 'ferias', grupo: 'Folha e trabalhista', ic: '🏖️', nome: 'Férias', desc: 'Férias + 1/3, abono pecuniário (vender 10 dias), INSS e IRRF.',
      campos: [brlC('sal', 'Salário', '4.000,00'), brlC('medias', 'Média de horas extras/adicionais', '0,00'), numC('dias', 'Dias de férias', '30'), chkC('abono', 'Vender 10 dias (abono pecuniário)', false), numC('dep', 'Dependentes para o IR', '0')],
      conta(v) {
        const rem = v.sal + v.medias, dias = Math.min(30, Math.max(0, v.dias)) - (v.abono ? 10 : 0);
        const fer = rem / 30 * dias, terco = fer / 3, abono = v.abono ? rem / 30 * 10 : 0, terAb = abono / 3;
        const i = inss(fer + terco), ir = irrf(fer + terco, { inss: i.valor, dep: v.dep });
        return { linhas: [L(`Férias (${dias} dias)`, fer), L('1/3 constitucional', terco), v.abono ? L('Abono pecuniário (10 dias)', abono) : null, v.abono ? L('1/3 do abono', terAb) : null, L('Bruto', fer + terco + abono + terAb, 'brl', 'sub'),
          L('INSS', -i.valor, 'brl', 'neg'), L('IRRF (com redução 2026)', -ir.valor, 'brl', 'neg'), T('Líquido das férias', fer + terco + abono + terAb - i.valor - ir.valor)],
          obs: ['Pagar até 2 dias antes do início. O abono e seu 1/3 não têm INSS nem IR.', 'O IR das férias é calculado separado do salário do mês.'] };
      } },
    { id: 'decimo', grupo: 'Folha e trabalhista', ic: '🎄', nome: '13º salário', desc: '1ª parcela (sem descontos) e 2ª parcela com INSS e IRRF.',
      campos: [brlC('sal', 'Salário', '3.000,00'), brlC('medias', 'Média de variáveis (horas extras, comissões)', '0,00'), numC('meses', 'Meses trabalhados no ano (15 dias ou mais contam)', '12'), numC('dep', 'Dependentes para o IR', '0')],
      conta(v) {
        const total = (v.sal + v.medias) / 12 * Math.min(12, Math.max(0, v.meses)), p1 = total / 2;
        const i = inss(total), ir = irrf(total, { inss: i.valor, dep: v.dep, simplificado: true });
        return { linhas: [L('13º integral', total), S('1ª parcela (até 30/11)'), L('Adiantamento (50%, sem descontos)', p1, 'brl', 'sub'), S('2ª parcela (até 20/12)'), L('INSS sobre o total', -i.valor, 'brl', 'neg'), L('IRRF sobre o total (tributação exclusiva)', -ir.valor, 'brl', 'neg'),
          L('Menos o adiantamento', -p1, 'brl', 'neg'), T('2ª parcela líquida', total - p1 - i.valor - ir.valor), L('Total líquido do 13º', total - i.valor - ir.valor, 'brl', 'sub')], obs: ['O IR do 13º é calculado separado dos salários e também tem a redução da Lei 15.270/2025.'] };
      } },
    { id: 'rescisao', grupo: 'Folha e trabalhista', ic: '📤', nome: 'Rescisão', desc: 'Verbas rescisórias: saldo, aviso, 13º e férias proporcionais, multa do FGTS e descontos.',
      campos: [brlC('sal', 'Último salário', '3.000,00'), datC('adm', 'Data de admissão', '2023-03-01'), datC('dem', 'Data de saída (último dia)', hoje()),
        selC('tipo', 'Tipo de saída', [['sjc', 'Dispensa sem justa causa'], ['pd', 'Pedido de demissão'], ['jc', 'Dispensa por justa causa'], ['acordo', 'Acordo (art. 484-A)'], ['exp', 'Fim do contrato de experiência']]),
        selC('aviso', 'Aviso prévio', [['ind', 'Indenizado'], ['trab', 'Trabalhado'], ['naocump', 'Não cumprido pelo empregado (desconta)']]), chkC('vencidas', 'Tem férias vencidas (não tiradas)', false), brlC('fgts', 'Saldo do FGTS para a multa', '0,00'), numC('dep', 'Dependentes para o IR', '0')],
      conta(v) {
        const adm = dataDe(v.adm), dem = dataDe(v.dem);
        if (!adm || !dem || dem < adm) return { linhas: [], obs: ['Informe as datas de admissão e de saída.'] };
        const dia = v.sal / 30, anos = Math.floor(diasEntre(adm, dem) / 365.25);
        const tipo = v.tipo, jc = tipo === 'jc';
        let diasAviso = 0;
        if ((tipo === 'sjc') && v.aviso === 'ind') diasAviso = Math.min(90, 30 + 3 * anos);
        if (tipo === 'acordo' && v.aviso === 'ind') diasAviso = Math.min(90, 30 + 3 * anos) / 2;
        const projecao = new Date(dem.getTime() + diasAviso * 864e5);
        const saldo = dia * dem.getDate(), aviso = dia * diasAviso;
        // 13º proporcional: meses no ano com 15 dias ou mais (até a projeção do aviso)
        const meses13 = (() => { if (jc) return 0; const ini = adm.getFullYear() === projecao.getFullYear() ? adm : new Date(projecao.getFullYear(), 0, 1); let m = 0;
          for (let mm = ini.getMonth(); mm <= projecao.getMonth(); mm++) { const a = mm === ini.getMonth() ? ini.getDate() : 1, b = mm === projecao.getMonth() ? projecao.getDate() : new Date(projecao.getFullYear(), mm + 1, 0).getDate(); if (b - a + 1 >= 15) m++; } return m; })();
        const dec = v.sal / 12 * meses13;
        // férias proporcionais: meses desde o último aniversário do contrato
        const ultAniv = new Date(adm); ultAniv.setFullYear(adm.getFullYear() + Math.floor(diasEntre(adm, projecao) / 365.25));
        const mesesFer = jc ? 0 : Math.min(12, Math.floor((diasEntre(ultAniv, projecao) + 15) / 30.44));
        const ferProp = v.sal / 12 * mesesFer, ferVenc = v.vencidas ? v.sal : 0, terco = (ferProp + ferVenc) / 3;
        const multa = tipo === 'sjc' ? v.fgts * 0.4 : tipo === 'acordo' ? v.fgts * 0.2 : 0;
        const descAviso = tipo === 'pd' && v.aviso === 'naocump' ? v.sal : 0;
        const iS = inss(saldo), irS = irrf(saldo, { inss: iS.valor, dep: v.dep }), i13 = inss(dec), ir13 = irrf(dec, { inss: i13.valor, dep: v.dep });
        const bruto = saldo + aviso + dec + ferProp + ferVenc + terco, desc = iS.valor + irS.valor + i13.valor + ir13.valor + descAviso;
        const fgtsSaque = tipo === 'sjc' ? 'saca 100% do FGTS + seguro-desemprego (se tiver direito)' : tipo === 'acordo' ? 'saca 80% do FGTS, sem seguro-desemprego' : tipo === 'exp' ? 'saca o FGTS, sem multa' : 'não saca o FGTS';
        return { linhas: [L(`Saldo de salário (${dem.getDate()} dias)`, saldo), diasAviso ? L(`Aviso prévio indenizado (${num(diasAviso, 0)} dias)`, aviso) : null, L(`13º proporcional (${meses13}/12)`, dec), L(`Férias proporcionais (${mesesFer}/12)`, ferProp),
          ferVenc ? L('Férias vencidas', ferVenc) : null, L('1/3 sobre as férias', terco), L('Total bruto', bruto, 'brl', 'sub'), L('INSS (saldo + 13º)', -(iS.valor + i13.valor), 'brl', 'neg'), L('IRRF (saldo + 13º)', -(irS.valor + ir13.valor), 'brl', 'neg'),
          descAviso ? L('Desconto do aviso não cumprido', -descAviso, 'brl', 'neg') : null, T('Líquido da rescisão', bruto - desc), multa ? L(`Multa do FGTS (${tipo === 'acordo' ? '20%' : '40%'}) · depositada na conta do FGTS`, multa, 'brl', 'sub') : null],
          obs: [`Tempo de casa: ${anos} ano(s). Nesta saída o empregado ${fgtsSaque}.`, 'Aviso, férias indenizadas e o 1/3 delas não têm INSS nem IR. Pagamento em até 10 dias após o fim do contrato.', 'Conta simplificada: médias de variáveis, faltas e convenção coletiva podem mudar os valores.'] };
      } },
    { id: 'he', grupo: 'Folha e trabalhista', ic: '⏰', nome: 'Horas extras e DSR', desc: 'Valor das horas extras (50% e 100%) e o reflexo no descanso semanal remunerado.',
      campos: [brlC('sal', 'Salário', '2.200,00'), numC('jornada', 'Horas por mês (divisor)', '220'), numC('h50', 'Horas extras a 50%', '10'), numC('h100', 'Horas extras a 100%', '0'), numC('uteis', 'Dias úteis no mês', '25'), numC('dsr', 'Domingos e feriados no mês', '5')],
      conta(v) {
        const hora = v.sal / (v.jornada || 220), he50 = hora * 1.5 * v.h50, he100 = hora * 2 * v.h100, he = he50 + he100, dsr = v.uteis ? he / v.uteis * v.dsr : 0;
        return { linhas: [L('Valor da hora normal', hora), L('Hora extra 50%', hora * 1.5), L(`${num(v.h50)} h a 50%`, he50), L(`${num(v.h100)} h a 100%`, he100), L('DSR sobre horas extras', dsr), T('Total a receber de extras', he + dsr)],
          obs: ['DSR = (horas extras do mês ÷ dias úteis) × domingos e feriados. Convenções coletivas podem ter percentuais maiores.'] };
      } },
    { id: 'noturno', grupo: 'Folha e trabalhista', ic: '🌙', nome: 'Adicional noturno', desc: 'Trabalho das 22h às 5h: hora reduzida (52min30s) e adicional de 20%.',
      campos: [brlC('sal', 'Salário', '2.200,00'), numC('jornada', 'Horas por mês (divisor)', '220'), numC('horas', 'Horas trabalhadas à noite no mês (relógio)', '40'), pctC('adic', 'Adicional (%)', '20')],
      conta(v) {
        const hora = v.sal / (v.jornada || 220), horasNot = v.horas * 60 / 52.5, adic = hora * v.adic / 100 * horasNot;
        return { linhas: [L('Horas noturnas pagas (hora reduzida)', horasNot, 'num'), L('Valor da hora normal', hora), T('Adicional noturno', adic)], obs: ['Cada 52min30s de trabalho noturno conta como 1 hora (urbano). Rural: 21h-5h (lavoura) ou 20h-4h (pecuária), adicional de 25%, sem hora reduzida.'] };
      } },
    { id: 'insalub', grupo: 'Folha e trabalhista', ic: '☣️', nome: 'Insalubridade e periculosidade', desc: 'Adicional de insalubridade (sobre o salário mínimo) e de periculosidade (30% do salário).',
      campos: [brlC('sal', 'Salário', '2.500,00'), selC('grau', 'Insalubridade', [['0', 'Nenhuma'], ['10', 'Grau mínimo (10%)'], ['20', 'Grau médio (20%)'], ['40', 'Grau máximo (40%)']], '20'), chkC('peric', 'Atividade perigosa (periculosidade 30%)', false)],
      conta(v) {
        const ins = SM * Number(v.grau) / 100, per = v.peric ? v.sal * 0.30 : 0;
        return { linhas: [L('Insalubridade', ins), L('Periculosidade', per), T('Adicional a pagar', v.peric ? Math.max(ins, per) : ins)], obs: ['Insalubridade e periculosidade não se acumulam: o empregado escolhe a mais vantajosa.', `Insalubridade sobre o salário mínimo de ${brl(SM)} (salvo convenção coletiva).`] };
      } },
    { id: 'prolabore', grupo: 'Folha e trabalhista', ic: '👔', nome: 'Pró-labore', desc: 'INSS de 11% do sócio, IRRF, líquido e o custo para a empresa.',
      campos: [brlC('valor', 'Pró-labore', '5.000,00'), selC('reg', 'Regime da empresa', REGIME_FOLHA), numC('dep', 'Dependentes para o IR', '0')],
      conta(v) {
        const i = Math.min(v.valor, TETO_INSS) * 0.11, ir = irrf(v.valor, { inss: i, dep: v.dep }), patr = v.reg === 'sn' ? 0 : v.valor * 0.20;
        return { linhas: [L('INSS do sócio (11%, até o teto)', -i, 'brl', 'neg'), L('IRRF', -ir.valor, 'brl', 'neg'), T('Pró-labore líquido', v.valor - i - ir.valor), L('INSS patronal (20%)', patr), L('Custo para a empresa', v.valor + patr, 'brl', 'sub')],
          obs: ['Pró-labore não tem FGTS. No Simples (Anexos I, II, III e V) o INSS patronal já está no DAS.', 'Para o Fator R, o pró-labore entra na folha.'] };
      } },

    // ============ Pessoa física
    { id: 'dividendos', grupo: 'Pessoa física', ic: '💰', nome: 'Lucros e dividendos (2026)', desc: 'Retenção de 10% acima de R$ 50 mil no mês e o imposto mínimo anual (Lei 15.270/2025).',
      campos: [brlC('mes', 'Lucro pago no mês por UMA empresa ao sócio', '60.000,00'), brlC('ano', 'Todos os rendimentos do sócio no ano (salário, lucros, aluguéis…)', '900.000,00'), brlC('pago', 'IR já pago no ano (fonte, carnê-leão, retenções)', '20.000,00')],
      conta(v) {
        const ret = v.mes > 50000 ? v.mes * 0.10 : 0;
        const aliqM = v.ano <= 600000 ? 0 : v.ano >= 1200000 ? 0.10 : (v.ano - 600000) / 600000 * 0.10, minimo = v.ano * aliqM;
        return { linhas: [S('No mês'), T('Retenção na fonte (10% sobre o total do mês)', ret), S('Na declaração anual (IRPF mínimo)'), L('Alíquota do imposto mínimo', aliqM, 'pct'), L('Imposto mínimo', minimo), L('IR já pago no ano', -v.pago, 'brl', 'neg'), L('Complemento estimado', Math.max(0, minimo - v.pago), 'brl', 'sub')],
          obs: ['Passando de R$ 50 mil no mês (somando tudo o que a mesma empresa pagou à mesma pessoa), retém 10% sobre o total, não só sobre o excesso.', 'Imposto mínimo: 0% até R$ 600 mil no ano, subindo até 10% em R$ 1,2 milhão. A lei permite abater o IR já pago e há redutor quando a soma com o IR da empresa passa dos limites; esta conta é uma estimativa.', 'Lucros apurados até 2025 e aprovados até 31/12/2025 têm regra de transição (isentos, se pagos nas condições da lei).'] };
      } },
    { id: 'carneleao', grupo: 'Pessoa física', ic: '🦁', nome: 'Carnê-leão', desc: 'IR mensal de quem recebe de pessoa física ou do exterior (autônomos, aluguéis).',
      campos: [brlC('rend', 'Rendimentos do mês', '8.000,00'), brlC('livro', 'Despesas do livro-caixa (autônomo)', '1.000,00'), brlC('inss', 'INSS pago no mês', '0,00'), numC('dep', 'Dependentes', '0'), brlC('pensao', 'Pensão alimentícia', '0,00')],
      conta(v) {
        const ir = irrf(v.rend, { inss: v.inss, dep: v.dep, pensao: v.pensao, outras: v.livro });
        return { linhas: [L('Deduções usadas · ' + ir.modo, ir.deducao), L('Base de cálculo', ir.base), L('Imposto pela tabela', ir.impTabela), L('Redução Lei 15.270/2025', -ir.reducao, 'brl', 'neg'), T('Carnê-leão a pagar (DARF 0190)', ir.valor)],
          obs: ['Vencimento: último dia útil do mês seguinte. Use o app/programa Carnê-Leão da Receita para emitir o DARF.'] };
      } },
    { id: 'ganho', grupo: 'Pessoa física', ic: '📈', nome: 'Ganho de capital', desc: 'IR na venda de imóvel, veículo, participação ou outro bem (15% a 22,5%).',
      campos: [brlC('venda', 'Valor de venda', '500.000,00'), brlC('custo', 'Custo de aquisição (com reformas e benfeitorias)', '300.000,00'), brlC('desp', 'Despesas da venda (corretagem…)', '25.000,00'), pctC('reducao', 'Redução/isenção aplicável (%)', '0', 'Ex.: imóvel comprado antes de 1988, fatores de redução da Lei 11.196.')],
      conta(v) {
        const ganho = Math.max(0, v.venda - v.desp - v.custo) * (1 - v.reducao / 100);
        let imp = 0, ant = 0; const faixas = [[5e6, 0.15], [10e6, 0.175], [30e6, 0.20], [Infinity, 0.225]];
        for (const [lim, a] of faixas) { if (ganho <= ant) break; imp += (Math.min(ganho, lim) - ant) * a; ant = lim; }
        return { linhas: [L('Ganho de capital', ganho), T('Imposto (DARF 4600)', imp), L('Alíquota efetiva', ganho ? imp / ganho : 0, 'pct', 'sub')],
          obs: ['Pagar até o último dia útil do mês seguinte à venda. Isenções comuns: único imóvel até R$ 440 mil (sem outra venda em 5 anos), compra de outro imóvel residencial em até 180 dias, bens de pequeno valor (até R$ 35 mil no mês).'] };
      } },

    // ============ Financeiro e contábil
    { id: 'atraso', grupo: 'Financeiro e contábil', ic: '⏳', nome: 'Multa e juros de imposto atrasado', desc: 'Tributo federal pago em atraso: multa de 0,33% ao dia (até 20%) e juros Selic + 1%.',
      campos: [brlC('valor', 'Valor do imposto', '1.000,00'), datC('venc', 'Vencimento', ''), datC('pag', 'Data do pagamento', hoje()), pctC('selic', 'Selic acumulada (do mês seguinte ao vencimento até o mês anterior ao pagamento) (%)', '0', 'Tabela da Receita: gov.br/receitafederal → Pagamentos → Taxa de juros Selic.')],
      conta(v) {
        const venc = dataDe(v.venc), pag = dataDe(v.pag);
        if (!venc || !pag) return { linhas: [], obs: ['Informe o vencimento e a data do pagamento.'] };
        const dias = Math.max(0, diasEntre(venc, pag)), multaP = Math.min(0.20, dias * 0.0033);
        const mesesDep = (pag.getFullYear() - venc.getFullYear()) * 12 + pag.getMonth() - venc.getMonth();
        const jurosP = dias > 0 && mesesDep >= 1 ? v.selic / 100 + 0.01 : 0;
        return { linhas: [L('Dias de atraso', dias, 'num'), L('Multa de mora (' + pct(multaP) + ')', v.valor * multaP), L('Juros (' + pct(jurosP) + ')', v.valor * jurosP), T('Total a pagar', v.valor * (1 + multaP + jurosP))],
          obs: ['Multa: 0,33% por dia de atraso, limitada a 20%. Juros: Selic acumulada do mês seguinte ao vencimento até o mês anterior ao pagamento, mais 1% no mês do pagamento (pago no mesmo mês do vencimento não tem juros).', 'Para ICMS e ISS valem as regras de cada estado e município. O Sicalc da Receita calcula o DARF oficial.'] };
      } },
    { id: 'juros', grupo: 'Financeiro e contábil', ic: '📐', nome: 'Juros simples e compostos', desc: 'Montante de uma aplicação ou dívida, com aportes mensais.',
      campos: [brlC('cap', 'Valor inicial', '10.000,00'), pctC('taxa', 'Taxa (%) por período', '1'), numC('n', 'Períodos (meses)', '12'), brlC('aporte', 'Aporte por período', '0,00'), selC('tipo', 'Tipo', [['comp', 'Compostos'], ['simp', 'Simples']])],
      conta(v) {
        const i = v.taxa / 100, n = Math.max(0, Math.round(v.n));
        let m = v.cap; for (let k = 0; k < n; k++) m = v.tipo === 'comp' ? m * (1 + i) + v.aporte : m + v.cap * i + v.aporte;
        const investido = v.cap + v.aporte * n;
        return { linhas: [L('Total investido', investido), L('Juros', m - investido), T('Montante final', m), L('Taxa equivalente ao ano', v.tipo === 'comp' ? Math.pow(1 + i, 12) - 1 : i * 12, 'pct', 'sub')], obs: [] };
      } },
    { id: 'depreciacao', grupo: 'Financeiro e contábil', ic: '🏭', nome: 'Depreciação', desc: 'Quota mensal e anual pelo método linear, com as taxas fiscais da Receita.',
      campos: [brlC('valor', 'Custo do bem', '100.000,00'), brlC('residual', 'Valor residual', '0,00'), selC('bem', 'Tipo de bem', [['4', 'Edifícios (4% ao ano · 25 anos)'], ['10', 'Máquinas, equipamentos, móveis (10% · 10 anos)'], ['20', 'Veículos e computadores (20% · 5 anos)'], ['25', 'Caminhões e tratores (25% · 4 anos)'], ['outro', 'Outra taxa']], '10'),
        pctC('taxa', 'Outra taxa anual (%)', '10'), numC('meses', 'Meses em uso', '12')],
      conta(v) {
        const t = (v.bem === 'outro' ? v.taxa : Number(v.bem)) / 100, deprec = Math.max(0, v.valor - v.residual), anual = deprec * t, mensal = anual / 12;
        const acum = Math.min(deprec, mensal * v.meses);
        return { linhas: [L('Valor depreciável', deprec), L('Taxa anual', t, 'pct'), L('Quota anual', anual), T('Quota mensal', mensal), L('Depreciação acumulada', acum), L('Valor contábil hoje', v.valor - acum, 'brl', 'sub'), L('Vida útil', t ? (1 / t) : 0, 'num')],
          obs: ['Taxas fiscais da IN RFB 1.700/2017 (Anexo III). Na contabilidade societária use a vida útil econômica do bem (CPC 27).'] };
      } },
    { id: 'markup', grupo: 'Financeiro e contábil', ic: '🏷️', nome: 'Markup e preço de venda', desc: 'Preço que cobre impostos, despesas e o lucro desejado.',
      campos: [brlC('custo', 'Custo do produto ou serviço', '100,00'), pctC('imp', 'Impostos sobre a venda (%)', '10'), pctC('desp', 'Despesas variáveis e fixas (% do preço)', '20'), pctC('lucro', 'Lucro desejado (%)', '15')],
      conta(v) {
        const soma = (v.imp + v.desp + v.lucro) / 100;
        if (soma >= 1) return { linhas: [], obs: ['A soma de impostos, despesas e lucro precisa ser menor que 100%.'] };
        const preco = v.custo / (1 - soma);
        return { linhas: [L('Markup divisor', 1 - soma, 'num'), L('Markup multiplicador', 1 / (1 - soma), 'num'), T('Preço de venda', preco), L('Impostos', preco * v.imp / 100), L('Despesas', preco * v.desp / 100), L('Lucro', preco * v.lucro / 100, 'brl', 'sub')], obs: ['Preço = custo ÷ (1 − (impostos + despesas + lucro)).'] };
      } },
    { id: 'equilibrio', grupo: 'Financeiro e contábil', ic: '⚖️', nome: 'Ponto de equilíbrio', desc: 'Quanto vender para não ter prejuízo, e margem de contribuição.',
      campos: [brlC('fixos', 'Custos e despesas fixas do mês', '20.000,00'), brlC('preco', 'Preço de venda unitário', '100,00'), brlC('var', 'Custo variável unitário (com impostos)', '60,00'), brlC('lucro', 'Lucro desejado no mês', '0,00')],
      conta(v) {
        const mc = v.preco - v.var; if (mc <= 0) return { linhas: [], obs: ['O preço precisa ser maior que o custo variável.'] };
        const q = (v.fixos + v.lucro) / mc;
        return { linhas: [L('Margem de contribuição unitária', mc), L('Margem de contribuição (%)', mc / v.preco, 'pct'), T('Quantidade a vender', Math.ceil(q), 'num'), L('Faturamento necessário', q * v.preco, 'brl', 'sub')], obs: [] };
      } },
    { id: 'indices', grupo: 'Financeiro e contábil', ic: '🩺', nome: 'Índices do balanço', desc: 'Liquidez, endividamento, margens e rentabilidade a partir do balanço e da DRE.',
      campos: [brlC('ac', 'Ativo circulante', '200.000,00'), brlC('est', 'Estoques', '50.000,00'), brlC('disp', 'Disponível (caixa e bancos)', '40.000,00'), brlC('rlp', 'Realizável a longo prazo', '20.000,00'), brlC('at', 'Ativo total', '500.000,00'),
        brlC('pc', 'Passivo circulante', '120.000,00'), brlC('pnc', 'Passivo não circulante', '80.000,00'), brlC('pl', 'Patrimônio líquido', '300.000,00'), brlC('rec', 'Receita líquida (DRE)', '800.000,00'), brlC('ll', 'Lucro líquido (DRE)', '60.000,00')],
      conta(v) {
        const d = (a, b) => (b ? a / b : 0);
        return { linhas: [S('Liquidez'), L('Corrente (AC ÷ PC)', d(v.ac, v.pc), 'num'), L('Seca ((AC − estoques) ÷ PC)', d(v.ac - v.est, v.pc), 'num'), L('Imediata (disponível ÷ PC)', d(v.disp, v.pc), 'num'), L('Geral ((AC + RLP) ÷ (PC + PNC))', d(v.ac + v.rlp, v.pc + v.pnc), 'num'),
          S('Endividamento'), L('Endividamento geral ((PC + PNC) ÷ AT)', d(v.pc + v.pnc, v.at), 'pct'), L('Capital de terceiros ÷ PL', d(v.pc + v.pnc, v.pl), 'pct'), L('Composição (PC ÷ dívidas)', d(v.pc, v.pc + v.pnc), 'pct'),
          S('Rentabilidade'), L('Margem líquida', d(v.ll, v.rec), 'pct'), L('ROA (lucro ÷ ativo)', d(v.ll, v.at), 'pct'), T('ROE (lucro ÷ PL)', d(v.ll, v.pl), 'pct'), L('Giro do ativo', d(v.rec, v.at), 'num')],
          obs: ['Liquidez acima de 1 indica folga para pagar as dívidas de curto prazo.'] };
      } },
  ];

  // ------------------------------------------------------------------ tela
  let atual = null, corpoAtual = null, filtro = '';
  const salvos = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { return {}; } };
  const guardar = (id, vals) => { const s = salvos(); s[id] = vals; s._ultimo = id; try { localStorage.setItem(LS, JSON.stringify(s)); } catch (e) { /* ok */ } };
  const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function lista() {
    const box = el('aside', { class: 'cc-lista' });
    const busca = el('input', { class: 'cc-busca', type: 'search', placeholder: '🔎 Buscar cálculo (ex.: férias, DIFAL)', value: filtro, oninput: e => { filtro = e.target.value; pintarItens(); } });
    const itens = el('div', { class: 'cc-itens' });
    function pintarItens() {
      itens.innerHTML = ''; const q = semAcento(filtro); let grupo = '';
      for (const c of CALCS.filter(c => !q || semAcento(c.nome + ' ' + c.desc + ' ' + c.grupo).includes(q))) {
        if (c.grupo !== grupo) { grupo = c.grupo; itens.append(el('h4', {}, grupo)); }
        itens.append(el('button', { class: 'cc-item' + (atual === c.id ? ' on' : ''), onclick: () => abrirCalc(c.id) }, el('span', {}, c.ic), el('b', {}, c.nome)));
      }
      if (!itens.children.length) itens.append(el('p', { class: 'cc-vazio' }, 'Nenhum cálculo com esse nome.'));
    }
    pintarItens();
    box.append(busca, itens);
    return box;
  }

  function painel(c) {
    const box = el('section', { class: 'cc-painel' });
    const memo = salvos()[c.id] || {};
    const valores = () => { const v = {}; for (const f of c.campos) { const i = box.querySelector(`[data-k="${f.k}"]`); v[f.k] = f.tipo === 'chk' ? i.checked : f.tipo === 'sel' || f.tipo === 'data' ? i.value : lerNum(i.value); } return v; };
    const crus = () => { const v = {}; for (const f of c.campos) { const i = box.querySelector(`[data-k="${f.k}"]`); v[f.k] = f.tipo === 'chk' ? i.checked : i.value; } return v; };
    const form = el('div', { class: 'cc-form' });
    for (const f of c.campos) {
      const ini = memo[f.k] != null ? memo[f.k] : f.p;
      let inp;
      if (f.tipo === 'sel') { inp = el('select', { 'data-k': f.k }, f.ops.map(([val, rot]) => el('option', { value: val }, rot))); inp.value = ini; }
      else if (f.tipo === 'chk') inp = el('input', { type: 'checkbox', 'data-k': f.k, checked: !!ini });
      else if (f.tipo === 'data') inp = el('input', { type: 'date', 'data-k': f.k, value: ini });
      else inp = el('input', { type: 'text', inputmode: 'decimal', 'data-k': f.k, value: ini, placeholder: '0', class: 'cc-n ' + f.tipo });
      const rotulo = el('span', {}, f.rot, f.tipo === 'pct' ? ' ' : null);
      form.append(f.tipo === 'chk' ? el('label', { class: 'cc-chk' }, inp, rotulo, f.dica ? el('small', {}, f.dica) : null)
        : el('label', { class: 'cc-campo' + (f.tipo === 'brl' ? ' brl' : f.tipo === 'pct' ? ' pct' : '') }, rotulo, el('div', { class: 'cc-entrada' }, f.tipo === 'brl' ? el('i', {}, 'R$') : null, inp, f.tipo === 'pct' ? el('i', {}, '%') : null), f.dica ? el('small', {}, f.dica) : null));
    }
    const res = el('div', { class: 'cc-res' });
    const calcular = () => {
      let r; try { r = c.conta(valores()); } catch (e) { console.error(e); r = { linhas: [], obs: ['Não consegui calcular: ' + e.message] }; }
      res.innerHTML = '';
      const tab = el('div', { class: 'cc-tab' });
      for (const ln of (r.linhas || []).filter(Boolean)) {
        const [rot, val, fmt, cls] = ln;
        if (fmt === 'sec') { tab.append(el('h5', {}, rot)); continue; }
        const txt = fmt === 'brl' ? brl(val) : fmt === 'pct' ? pct(val) : fmt === 'num' ? num(val) : String(val);
        tab.append(el('div', { class: 'cc-ln ' + (cls || '') + (fmt === 'brl' && val < 0 ? ' neg' : '') }, el('span', {}, rot), el('b', {}, txt)));
      }
      res.append(tab);
      const obs = (r.obs || []).filter(Boolean);
      if (obs.length) res.append(el('ul', { class: 'cc-obs' }, obs.map(o => el('li', {}, o))));
      res._texto = `${c.nome}\n` + (r.linhas || []).filter(Boolean).map(([rot, val, fmt]) => fmt === 'sec' ? `\n${rot}` : `${rot}: ${fmt === 'brl' ? brl(val) : fmt === 'pct' ? pct(val) : fmt === 'num' ? num(val) : val}`).join('\n');
      guardar(c.id, crus());
    };
    form.addEventListener('input', calcular); form.addEventListener('change', calcular);
    form.addEventListener('focusout', e => { const i = e.target; if (i.classList && i.classList.contains('brl') && i.value.trim()) i.value = lerNum(i.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); });
    box.append(el('header', { class: 'cc-cab' }, el('button', { class: 'cc-volta', onclick: () => { atual = null; render(); } }, '‹ Cálculos'), el('h2', {}, c.ic + ' ' + c.nome), el('p', {}, c.desc)),
      el('div', { class: 'cc-duas' }, form, el('div', { class: 'cc-lado' }, res,
        el('div', { class: 'cc-bts' },
          el('button', { class: 'bt peq', onclick: () => { navigator.clipboard.writeText(res._texto || '').then(() => toast('📋 Resultado copiado')).catch(() => toast('Não consegui copiar')); } }, '📋 Copiar resultado'),
          el('button', { class: 'bt peq', onclick: () => { const s = salvos(); delete s[c.id]; try { localStorage.setItem(LS, JSON.stringify(s)); } catch (e) { /* ok */ } painelNovo(); } }, '↺ Valores de exemplo')))));
    function painelNovo() { const novo = painel(c); box.replaceWith(novo); }
    setTimeout(calcular, 0);
    return box;
  }

  function inicio() {
    const box = el('section', { class: 'cc-inicio' });
    box.append(el('h2', {}, '🧮 Cálculos da contabilidade'), el('p', {}, `${CALCS.length} calculadoras com as tabelas de 2026. Escolha uma na lista ou toque abaixo.`));
    const grupos = [...new Set(CALCS.map(c => c.grupo))];
    for (const g of grupos) {
      box.append(el('h3', {}, g), el('div', { class: 'cc-cartoes' }, CALCS.filter(c => c.grupo === g).map(c => el('button', { class: 'cc-cartao', onclick: () => abrirCalc(c.id) }, el('span', {}, c.ic), el('b', {}, c.nome), el('small', {}, c.desc)))));
    }
    box.append(el('p', { class: 'cc-rodape' }, 'Contas para conferência rápida, com as regras de 2026. Antes de recolher, confira a legislação e o sistema oficial (Sicalc, PGDAS-D, eSocial).'));
    return box;
  }

  function abrirCalc(id) { atual = id; render(); if (corpoAtual) corpoAtual.scrollTop = 0; }
  function render() {
    const corpo = corpoAtual; if (!corpo) return;
    corpo.innerHTML = '';
    const c = CALCS.find(x => x.id === atual);
    corpo.classList.toggle('cc-aberta', !!c);
    corpo.append(el('div', { class: 'cc-app' }, lista(), c ? painel(c) : inicio()));
  }
  function abrir(corpo) { corpoAtual = corpo; corpo.classList.add('cc-corpo'); render(); }

  function registrar() {
    if (!KM.inicio || !KM.app) return setTimeout(registrar, 50);
    KM.inicio.registrar('calculo', { nome: 'Cálculo', ic: '🧮', abrir, sair: () => { corpoAtual = null; }, resumo: () => ({ txt: `${CALCS.length} calculadoras · Simples ao IBS/CBS` }) });
  }
  KM.calculo = { CALCS, inss, irrf, simples, lerNum };
  registrar();
})();
