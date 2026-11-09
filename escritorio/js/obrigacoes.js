/* KWIK Mini Escritório · Checklist do mês dos setores Fiscal e Folha.
   Para cada empresa ativa, monta a lista de obrigações do mês conforme o regime (MEI, Simples Nacional, Lucro Presumido/Real)
   e quem está na folha (CLT, pró-labore): PGDAS-D e DAS, PIS/COFINS, EFD-Contribuições, Reinf, DCTFWeb, eSocial, FGTS Digital,
   13º, DEFIS, ECD/ECF… com o vencimento de cada uma. Você marca o que foi feito e pode adicionar itens seus (para uma empresa,
   para todas ou um lembrete geral; só neste mês ou todo mês). O que já foi pago no KWIK Fiscal ou marcado no fechamento do
   KWIK Folha aparece como feito sozinho. Fica salvo na configuração do Mini Escritório (não mexe nos dados dos outros apps).
   Prazos: datas gerais da legislação federal; fim de semana antecipa para sexta (o DAS passa para segunda). Confira feriados e
   prazos municipais/estaduais. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const el = (...a) => A().el(...a);
  const dd = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const mesDe = (d = new Date()) => `${d.getFullYear()}-${dd(d.getMonth() + 1)}`;
  const somarMes = (m, n) => { const [a, b] = m.split('-').map(Number), d = new Date(a, b - 1 + n, 1); return mesDe(d); };
  const nomeMes = m => { const [a, b] = m.split('-').map(Number); return `${MESES[b - 1]} ${a}`; };
  const compTxt = m => { const c = somarMes(m, -1); return `${c.slice(5)}/${c.slice(0, 4)}`; };
  const fmt = s => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
  const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  const fds = d => d.getDay() === 0 || d.getDay() === 6;
  // vencimento: dia "d" do mês (ou 'ultimo' útil / 'quinto' dia útil); fim de semana antecipa (ou prorroga, no DAS)
  function venc(m, d, prorroga) {
    const [a, b] = m.split('-').map(Number), ult = new Date(a, b, 0).getDate();
    let x;
    if (d === 'ultimo') { x = new Date(a, b - 1, ult); while (fds(x)) x.setDate(x.getDate() - 1); return iso(x); }
    if (d === 'quinto') { x = new Date(a, b - 1, 1); let n = fds(x) ? 0 : 1; while (n < 5) { x.setDate(x.getDate() + 1); if (!fds(x)) n++; } return iso(x); }
    x = new Date(a, b - 1, Math.min(d, ult));
    while (fds(x)) x.setDate(x.getDate() + (prorroga ? 1 : -1));
    return iso(x);
  }
  const diasAte = s => Math.round((new Date(s + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5);

  // ------------------------------------------------------------------ catálogo de obrigações
  const ehMEI = r => /mei/i.test(r || ''), ehSimples = r => /simples/i.test(r || '') && !ehMEI(r), ehLucro = r => /presumido|real/i.test(r || '');
  function itensFiscal(emp, regime, m, op) {
    const mm = +m.slice(5), L = [], add = (id, t, d, extra = {}) => L.push({ id, t, d, ...extra });
    const comp = compTxt(m);
    if (ehMEI(regime)) {
      add('das-mei', `DAS-MEI (competência ${comp})`, venc(m, 20, true), { auto: /das/i });
      add('receitas', 'Relatório mensal de receitas brutas do MEI', venc(m, 20));
      if (mm === 5) add('dasn', 'DASN-SIMEI (declaração anual do MEI)', venc(m, 31));
      add('notas', 'Conferir notas emitidas (limite do MEI)', venc(m, 10));
      return L;
    }
    add('notas', `Conferir notas emitidas e recebidas (${comp})`, venc(m, 5));
    if (+m.slice(0, 4) >= 2026) add('cbsibs', 'Conferir o destaque de CBS/IBS nas notas (Reforma Tributária)', venc(m, 10));
    if (ehLucro(regime)) {
      add('iss', 'ISS próprio (prazo do município)', venc(m, 10), { auto: /iss/i });
      add('dctfweb-f', 'DCTFWeb (retenções e contribuições)', venc(m, 15));
      if (op.reinf !== false) add('reinf', 'EFD-Reinf (retenções e serviços tomados)', venc(m, 15));
      add('efd-contrib', `EFD-Contribuições (competência ${compTxt(somarMes(m, -1))})`, venc(m, 15));
      add('piscofins', `DARF de PIS e COFINS (competência ${comp})`, venc(m, 25), { auto: /pis|cofins/i });
      if (op.icms) { add('icms', 'ICMS próprio', venc(m, 20), { auto: /icms/i }); add('efd-icms', 'EFD ICMS/IPI (SPED Fiscal)', venc(m, 20)); }
      if ([1, 4, 7, 10].includes(mm)) add('irpj', 'IRPJ e CSLL do trimestre (1ª quota ou cota única)', venc(m, 'ultimo'), { auto: /irpj|csll/i });
      if (mm === 6) add('ecd', 'ECD · Escrituração Contábil Digital', venc(m, 'ultimo'));
      if (mm === 7) add('ecf', 'ECF · Escrituração Contábil Fiscal', venc(m, 'ultimo'));
    } else { // Simples Nacional (padrão)
      add('pgdas', `PGDAS-D: apuração do Simples (${comp})`, venc(m, 20, true));
      add('das', `DAS pago ou enviado ao cliente (${comp})`, venc(m, 20, true), { auto: /das|simples/i });
      if (op.reinf) add('reinf', 'EFD-Reinf (retenções e serviços tomados)', venc(m, 15));
      if (op.icms) add('destda', 'DeSTDA (ICMS-ST, difal e antecipação)', venc(m, 28));
      if (mm === 3) add('defis', 'DEFIS (declaração anual do Simples)', venc(m, 31));
    }
    return L;
  }
  function itensFolha(emp, ps, m) {
    const mm = +m.slice(5), L = [], add = (id, t, d, extra = {}) => L.push({ id, t, d, ...extra });
    const clt = ps.some(p => p.vinculo === 'CLT'), comp = compTxt(m);
    if (!ps.length) return L;
    if (clt) add('var', 'Receber as variáveis (faltas, horas extras, comissões)', venc(m, 3), { etapa: 'variaveis' });
    add('calc', `Calcular e conferir a folha${clt ? '' : ' (pró-labore)'} de ${comp}`, venc(m, 4), { etapa: 'calculo' });
    if (clt) add('salario', 'Salários pagos até o 5º dia útil', venc(m, 'quinto'));
    add('holerite', 'Enviar os contracheques', venc(m, 'quinto'), { etapa: 'contracheques' });
    add('esocial', 'eSocial: eventos do mês e fechamento (S-1299)', venc(m, 15), { etapa: 'esocial' });
    add('dctfweb', 'DCTFWeb transmitida', venc(m, 15), { etapa: 'dctfweb' });
    add('darf', 'DARF do INSS (previdência) enviado', venc(m, 20), { etapa: 'darf' });
    if (clt) {
      add('fgts', 'FGTS Digital pago', venc(m, 20), { etapa: 'fgts' });
      add('ferias', 'Conferir férias a vencer (próximos 60 dias)', venc(m, 10));
      if (mm === 11) add('13a', '13º salário: 1ª parcela', venc(m, 30));
      if (mm === 12) add('13b', '13º salário: 2ª parcela', venc(m, 20));
    }
    if (mm === 2) add('informe', 'Informe de rendimentos para quem recebeu salário/pró-labore', venc(m, 'ultimo'));
    return L;
  }

  // ------------------------------------------------------------------ dados salvos
  function base() {
    const c = A().cfg(); c.obrigacoes = c.obrigacoes || {};
    const o = c.obrigacoes; o.feitos = o.feitos || {}; o.extras = o.extras || []; o.op = o.op || {};
    return o;
  }
  const opDe = (emp) => base().op[emp] || {};
  const feito = (m, emp, id) => ((base().feitos[m] || {})[emp] || {})[id];
  function marcar(m, emp, id, sim, setor) {
    const o = base(); o.feitos[m] = o.feitos[m] || {}; o.feitos[m][emp] = o.feitos[m][emp] || {};
    if (sim) o.feitos[m][emp][id] = { em: new Date().toISOString(), por: KM.nomeDe ? KM.nomeDe(setor) : '' };
    else delete o.feitos[m][emp][id];
    // guarda só os últimos 14 meses
    const ks = Object.keys(o.feitos).sort(); while (ks.length > 14) delete o.feitos[ks.shift()];
    A().salvar();
  }

  // ------------------------------------------------------------------ montar a lista do mês
  function montar(setor, db, m) {
    const S = KM.setores, ativa = e => !(db.excluidos && db.excluidos[e.id] && db.excluidos[e.id] >= (e.alteradoEm || ''));
    const emps = db.empresas.filter(ativa);
    const out = [];
    for (const e of emps) {
      const op = opDe(e.id), regime = op.regime || e.regime || 'Simples Nacional';
      let itens;
      if (setor === 'fiscal') {
        itens = itensFiscal(e, regime, m, op);
        // pago no KWIK Fiscal → feito sozinho
        const comp = somarMes(m, -1);
        for (const it of itens) if (it.auto) {
          const l = (db.lancamentos || []).find(x => x.empresaId === e.id && x.pagamento && it.auto.test(x.tributo || '') && String(x.competencia || '').slice(0, 7) === comp);
          if (l) it.sozinho = `pago no KWIK Fiscal em ${fmt(l.pagamento)}`;
        }
      } else {
        const ps = (db.pessoas || []).filter(p => p.empresaId === e.id && p.situacao !== 'Desligado' && !p.demissao);
        itens = itensFolha(e, ps, m);
        const fech = (db.fechamentos || []).find(f => f.empresaId === e.id && f.competencia === somarMes(m, -1));
        for (const it of itens) if (it.etapa && fech && fech.etapas && fech.etapas[it.etapa]) it.sozinho = 'marcado no fechamento do KWIK Folha';
        if (!ps.length) itens.push({ id: 'semfolha', t: 'Sem ninguém na folha: nada a fechar', d: venc(m, 15), info: true });
      }
      for (const x of base().extras) if (x.setor === setor && (!x.mes || x.mes === m) && (x.emp === '*' || x.emp === e.id)) itens.push({ id: 'x-' + x.id, t: x.texto, d: venc(m, x.dia || 28), extra: x });
      out.push({ emp: e.id, nome: S.nomeEmp(e), regime, itens: itens.sort((a, b) => a.d.localeCompare(b.d)) });
    }
    const gerais = base().extras.filter(x => x.setor === setor && (!x.mes || x.mes === m) && x.emp === '').map(x => ({ id: 'x-' + x.id, t: x.texto, d: venc(m, x.dia || 28), extra: x }));
    if (gerais.length) out.push({ emp: '_geral', nome: '📌 Lembretes gerais', geral: true, itens: gerais.sort((a, b) => a.d.localeCompare(b.d)) });
    for (const g of out) for (const it of g.itens) it.ok = !!(it.sozinho || feito(m, g.emp, it.id));
    return out;
  }
  function resumo(setor, db, m = mesDe()) {
    const l = montar(setor, db, m), its = l.flatMap(g => g.itens.filter(i => !i.info));
    return { total: its.length, feitos: its.filter(i => i.ok).length, atrasados: its.filter(i => !i.ok && diasAte(i.d) < 0).length, hoje: its.filter(i => !i.ok && diasAte(i.d) >= 0 && diasAte(i.d) <= 3).length };
  }

  // ------------------------------------------------------------------ tela
  const estado = { mes: mesDe(), filtro: 'pendentes' };
  function render(corpo, setor, db, rerender) {
    const m = estado.mes, grupos = montar(setor, db, m);
    const its = grupos.flatMap(g => g.itens.filter(i => !i.info)), nOk = its.filter(i => i.ok).length;
    const pct = its.length ? Math.round(nOk / its.length * 100) : 0;
    const atras = its.filter(i => !i.ok && diasAte(i.d) < 0).length;
    const quem = KM.nomeDe ? KM.nomeDe(setor) : '';
    corpo.append(el('div', { class: 'ob-topo' },
      el('div', { class: 'ob-mes' }, el('button', { class: 'bt peq', title: 'Mês anterior', onclick: () => { estado.mes = somarMes(m, -1); rerender(); } }, '◀'),
        el('b', {}, nomeMes(m)), el('button', { class: 'bt peq', title: 'Próximo mês', onclick: () => { estado.mes = somarMes(m, 1); rerender(); } }, '▶'),
        m !== mesDe() ? el('button', { class: 'bt peq', onclick: () => { estado.mes = mesDe(); rerender(); } }, 'Hoje') : null),
      el('div', { class: 'ob-prog' }, el('div', { class: 'ob-barra' }, el('i', { style: `width:${pct}%` })), el('small', {}, `${nOk} de ${its.length} feitos (${pct}%)${atras ? ` · 🔴 ${atras} atrasado${atras > 1 ? 's' : ''}` : ''}`)),
      el('div', { class: 'ob-filtros' }, ['pendentes', 'todas'].map(f => el('button', { class: 'chip-f' + (estado.filtro === f ? ' on' : ''), onclick: () => { estado.filtro = f; rerender(); } }, f === 'pendentes' ? 'Pendentes' : 'Tudo')),
        el('button', { class: 'bt peq prim', onclick: () => novoItem(setor, db, rerender) }, '＋ Adicionar item'))));
    corpo.append(el('p', { class: 'ob-nota' }, `Obrigações de ${nomeMes(m).toLowerCase()} (competência ${compTxt(m)}) conforme o regime de cada empresa${setor === 'folha' ? ' e quem está na folha' : ''}. Fim de semana antecipa para sexta (o DAS passa para segunda); confira feriados e prazos do município e do estado.`));
    if (!grupos.length) corpo.append(el('p', { class: 'vazio' }, 'Nenhuma empresa ativa.'));
    for (const g of grupos) {
      const vis = g.itens.filter(i => estado.filtro === 'todas' || !i.ok);
      const ok = g.itens.filter(i => i.ok && !i.info).length, tot = g.itens.filter(i => !i.info).length;
      const card = el('div', { class: 'ob-emp' + (tot && ok === tot ? ' completo' : '') });
      const cab = el('div', { class: 'ob-emp-cab' }, el('b', {}, g.nome), el('span', { class: 'ob-cont' }, tot ? `${ok}/${tot}` : '—'));
      if (!g.geral && setor === 'fiscal') {
        const op = opDe(g.emp);
        const sel = el('select', { class: 'ob-regime', title: 'Regime usado no checklist', onchange: e => { base().op[g.emp] = { ...opDe(g.emp), regime: e.target.value }; A().salvar(); rerender(); } },
          ['MEI', 'Simples Nacional', 'Lucro Presumido', 'Lucro Real'].map(r => el('option', { value: r, selected: r === g.regime }, r)));
        const chk = (k, txt, padrao) => el('label', { class: 'ob-op' }, el('input', { type: 'checkbox', checked: op[k] != null ? !!op[k] : padrao, onchange: e => { base().op[g.emp] = { ...opDe(g.emp), [k]: e.target.checked }; A().salvar(); rerender(); } }), txt);
        cab.append(el('div', { class: 'ob-ops' }, sel, ehMEI(g.regime) ? null : chk('icms', 'ICMS (comércio/indústria)', false), ehMEI(g.regime) ? null : chk('reinf', 'Retenções (Reinf)', ehLucro(g.regime))));
      }
      card.append(cab);
      if (!vis.length) card.append(el('p', { class: 'ob-tudo' }, tot ? '✅ Tudo feito neste mês!' : 'Nada para este mês.'));
      const ul = el('ul', { class: 'ob-lista' });
      for (const it of vis) {
        const dias = diasAte(it.d), f = feito(m, g.emp, it.id);
        const chip = it.ok ? el('span', { class: 'ob-chip ok' }, it.sozinho ? '✔ automático' : `✔ ${f && f.em ? fmt(f.em.slice(0, 10)) : ''}`)
          : el('span', { class: 'ob-chip ' + (dias < 0 ? 've' : dias <= 3 ? 'av' : '') }, dias < 0 ? `atrasado ${fmt(it.d)}` : dias === 0 ? 'vence hoje' : `${fmt(it.d)} · ${dias} dia${dias === 1 ? '' : 's'}`);
        const cb = el('input', { type: 'checkbox', checked: it.ok, disabled: !!it.sozinho || !!it.info, onchange: e => {
          marcar(m, g.emp, it.id, e.target.checked, setor);
          if (e.target.checked) { const fu = (A().cfg().funcionarios || []).find(x => x.funcao === setor); if (fu) A().falar(fu.id, `✅ ${it.t.split(' (')[0].slice(0, 34)}${g.geral ? '' : ' · ' + g.nome.split(' ')[0]}`, 2600); KM.tocar && KM.tocar('clique'); }
          setTimeout(rerender, 250);
        } });
        ul.append(el('li', { class: (it.ok ? 'ok ' : '') + (it.extra ? 'extra' : '') }, el('label', {}, cb, el('span', {}, it.t, it.sozinho ? el('small', {}, it.sozinho) : null, it.extra && !it.extra.mes ? el('small', {}, 'todo mês') : null)), chip,
          it.extra ? el('button', { class: 'ob-x', title: 'Tirar este item', onclick: () => { if (!confirm('Tirar este item do checklist?')) return; const o = base(); o.extras = o.extras.filter(x => x.id !== it.extra.id); A().salvar(); rerender(); } }, '×') : null));
      }
      card.append(ul);
      corpo.append(card);
    }
    if (quem) corpo.append(el('small', { class: 'vazio' }, `${quem} acompanha este checklist. Ao marcar, ${quem} avisa no escritório.`));
  }
  async function novoItem(setor, db, rerender) {
    const ativa = e => !(db.excluidos && db.excluidos[e.id] && db.excluidos[e.id] >= (e.alteradoEm || ''));
    const d = document.getElementById('dlgObItem') || (() => { const x = el('dialog', { id: 'dlgObItem' }); document.body.append(x); return x; })();
    d.innerHTML = '';
    const tx = el('input', { type: 'text', maxlength: 90, placeholder: setor === 'fiscal' ? 'Ex.: Parcelamento do Simples da Clínica X' : 'Ex.: Vale-transporte de dezembro' });
    const dia = el('input', { type: 'number', min: 1, max: 31, value: 20 });
    const emp = el('select', {}, el('option', { value: '*' }, '🏢 Todas as empresas'), el('option', { value: '' }, '📌 Lembrete geral (não é de uma empresa)'),
      db.empresas.filter(ativa).map(e => el('option', { value: e.id }, KM.setores.nomeEmp(e))));
    const rec = el('input', { type: 'checkbox', checked: true });
    d.append(el('div', { class: 'dlg-topo' }, el('h2', {}, '＋ Item no checklist'), el('button', { type: 'button', onclick: () => d.close() }, '×')),
      el('div', { class: 'dlg-corpo' },
        el('div', { class: 'campo' }, el('label', {}, 'O que fazer'), tx),
        el('div', { class: 'campo' }, el('label', {}, 'Dia do vencimento'), dia),
        el('div', { class: 'campo' }, el('label', {}, 'Para quem'), emp),
        el('label', { class: 'iva-chk' }, rec, ` Repetir todo mês (desmarque para ser só em ${nomeMes(estado.mes).toLowerCase()})`),
        el('button', { class: 'bt prim', style: 'margin-top:10px', onclick: () => {
          if (!tx.value.trim()) return tx.focus();
          base().extras.push({ id: uid(), setor, texto: tx.value.trim(), dia: Math.max(1, Math.min(31, +dia.value || 20)), emp: emp.value, mes: rec.checked ? '' : estado.mes });
          A().salvar(); d.close(); rerender(); A().toast('✅ Item adicionado ao checklist');
        } }, 'Adicionar')));
    d.showModal(); setTimeout(() => tx.focus(), 50);
  }
  KM.obrigacoes = { render, resumo, montar, itensFiscal, itensFolha, venc };
})();
