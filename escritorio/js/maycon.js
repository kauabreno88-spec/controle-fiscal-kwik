/* KWIK Mini Escritório · Maycon (pai): prospecção de futuros clientes, com foco em clínicas.
   Fonte: OpenStreetMap (Overpass API), dados abertos (ODbL) — dá para consultar direto do navegador.
   Quando está livre, ele anda pelo escritório tirando fotos (e elas vão para o mural). */
(function () {
  const KM = window.KM;
  const $ = s => document.querySelector(s);
  const A = () => KM.app;

  const SERVIDORES = [['https://overpass-api.de/api/interpreter', 60000], ['https://overpass.private.coffee/api/interpreter', 35000]];
  const UF_NOME = { AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
    MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
    RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins' };
  const semAcento = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const SAUDE = {
    clinic: 'Clínica', doctors: 'Consultório médico', dentist: 'Odontologia', laboratory: 'Laboratório', physiotherapist: 'Fisioterapia',
    psychotherapist: 'Psicologia', optometrist: 'Ótica / optometria', alternative: 'Terapias', speech_therapist: 'Fonoaudiologia',
    nutrition_counselling: 'Nutrição', podiatrist: 'Podologia', veterinary: 'Clínica veterinária', occupational_therapist: 'Terapia ocupacional',
  };
  const ESCRITORIOS = {
    company: 'Empresa', lawyer: 'Advocacia', estate_agent: 'Imobiliária', insurance: 'Seguros', architect: 'Arquitetura', it: 'Tecnologia',
    consulting: 'Consultoria', engineer: 'Engenharia', travel_agent: 'Turismo', employment_agency: 'Recrutamento', financial: 'Financeiro', advertising_agency: 'Publicidade',
  };
  const ESPECIALIDADE = {
    dentistry: 'odontologia', orthodontics: 'ortodontia', paediatrics: 'pediatria', gynaecology: 'ginecologia', ophthalmology: 'oftalmologia',
    dermatology: 'dermatologia', cardiology: 'cardiologia', orthopaedics: 'ortopedia', psychiatry: 'psiquiatria', general: 'clínica geral',
    physiotherapy: 'fisioterapia', radiology: 'radiologia', otolaryngology: 'otorrino', urology: 'urologia', plastic_surgery: 'cirurgia plástica',
    occupational: 'medicina do trabalho', blood_check: 'exames de sangue', biology: 'análises clínicas', neurology: 'neurologia', oncology: 'oncologia',
    endocrinology: 'endocrinologia', gastroenterology: 'gastroenterologia', nephrology: 'nefrologia', pulmonology: 'pneumologia', rheumatology: 'reumatologia',
    vaccination: 'vacinação', diagnostic_radiology: 'diagnóstico por imagem', emergency: 'emergência', fertility: 'fertilidade', obstetrics: 'obstetrícia',
    psychology: 'psicologia', nutrition: 'nutrição', speech_therapy: 'fonoaudiologia', podiatry: 'podologia', dialysis: 'hemodiálise', paediatric_dentistry: 'odontopediatria',
    periodontics: 'periodontia', endodontics: 'endodontia', implantology: 'implantes', aesthetic: 'estética', dermatovenereology: 'dermatologia', ophthalmology_paediatric: 'oftalmo infantil',
  };

  // "goiania" também acha "Goiânia"
  const regexNome = nome => '^' + nome.trim().replace(/[.*+?^${}()|[\]\\"]/g, '').split('').map(c => {
    const m = { a: '[aáàâã]', e: '[eéê]', i: '[ií]', o: '[oóôõ]', u: '[uúü]', c: '[cç]' }[c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')];
    return m || c;
  }).join('') + '$';

  function consulta(cidade, uf) {
    const s = ['clinic', 'doctor', 'dentist', 'physiotherapist', 'psychotherapist', 'laboratory', 'optometrist', 'alternative', 'speech_therapist', 'nutrition_counselling', 'podiatrist', 'occupational_therapist'].join('|');
    return `[out:json][timeout:90];
area["ISO3166-2"="BR-${uf}"]->.uf;
rel(area.uf)["boundary"="administrative"]["admin_level"="8"]["name"~"${regexNome(cidade)}",i];
map_to_area->.a;
.a out ids;
(nwr(area.a)["amenity"~"^(clinic|doctors|dentist|veterinary)$"];
 nwr(area.a)["healthcare"~"^(${s})$"];
 nwr(area.a)["office"~"^(${Object.keys(ESCRITORIOS).join('|')})$"];);
out center tags;`;
  }

  async function buscarOverpass(q) {
    let ultimoErro;
    for (const [url, espera] of SERVIDORES) {
      try {
        const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), espera);
        const r = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: q }), signal: ctrl.signal });
        clearTimeout(timer);
        if (!r.ok) throw new Error('servidor do mapa respondeu ' + r.status);
        return await r.json();
      } catch (e) { ultimoErro = e; }
    }
    throw new Error(ultimoErro && ultimoErro.name === 'AbortError' ? 'sem resposta' : (ultimoErro && ultimoErro.message) || 'sem resposta');
  }

  // Reserva: Nominatim (busca do OpenStreetMap). Menos completo, mas costuma estar no ar.
  // Respeita o limite do serviço (1 pedido por segundo).
  async function buscarNominatim(cidade, uf, avisar) {
    const termos = [['clinic', 3], ['dentist', 2], ['doctors', 1], ['laboratory', 1], ['physiotherapist', 1], ['veterinary', 1],
      ['lawyer', 1], ['estate agent', 1], ['insurance', 1], ['company', 1]];
    const alvo = semAcento(cidade), achados = new Map();
    for (const [termo, paginas] of termos) {
      const excluir = [];
      for (let pg = 0; pg < paginas; pg++) {
        const qs = new URLSearchParams({ q: `${termo} in ${cidade}, ${UF_NOME[uf] || uf}, Brasil`, format: 'jsonv2', extratags: 1, addressdetails: 1, limit: 50 });
        if (excluir.length) qs.set('exclude_place_ids', excluir.join(','));
        let d = [];
        try { const r = await fetch('https://nominatim.openstreetmap.org/search?' + qs); if (r.ok) d = await r.json(); } catch (e) { d = []; }
        for (const x of d) {
          excluir.push(x.place_id);
          const a = x.address || {};
          const lugar = semAcento(a.city || a.town || a.municipality || a.village || '');
          if (lugar && lugar !== alvo) continue;
          const tags = Object.assign({ name: x.name }, x.extratags || {}, {
            'addr:street': a.road, 'addr:housenumber': a.house_number, 'addr:suburb': a.suburb || a.neighbourhood || a.city_district,
          });
          tags[x.category] = x.type;
          achados.set(x.osm_type + '/' + x.osm_id, { type: x.osm_type, id: x.osm_id, tags });
        }
        await KM.esperar(1100);
        if (d.length < 50) break;
      }
      avisar && avisar(termo);
    }
    if (!achados.size) throw new Error(`Não achei estabelecimentos em "${cidade}-${uf}". Confira o nome da cidade.`);
    return { elements: [{ type: 'area' }, ...achados.values()] };
  }

  function telefone(tags) {
    const bruto = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || tags.mobile || tags['contact:whatsapp'] || '';
    const primeiro = bruto.split(/[;,/]/)[0].trim();
    let d = primeiro.replace(/\D/g, '');
    if (d.startsWith('55') && d.length >= 12) d = d.slice(2);
    if (d.startsWith('0') && d.length >= 11) d = d.slice(1);
    if (d.length < 10) return primeiro ? { texto: primeiro, digitos: '' } : null;
    const ddd = d.slice(0, 2), n = d.slice(2);
    return { texto: `(${ddd}) ${n.length === 9 ? n.slice(0, 5) + '-' + n.slice(5) : n.slice(0, 4) + '-' + n.slice(4)}`, digitos: '55' + d, celular: n.length === 9 };
  }

  function montar(dados, cidade, uf) {
    const vistos = new Set(JSON.parse(localStorage.getItem('kwik-mini-vistos') || '[]'));
    const clinicas = [], outras = [];
    let achouCidade = false;
    for (const e of dados.elements || []) {
      if (e.type === 'area') { achouCidade = true; continue; }
      const t = e.tags || {};
      if (!t.name) continue;
      const chave = e.type + '/' + e.id;
      const rua = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', ');
      const item = {
        nome: t.name, chave, novo: !vistos.has(chave), tel: telefone(t),
        site: t.website || t['contact:website'] || '', email: t.email || t['contact:email'] || '',
        endereco: [rua, t['addr:suburb'] || t['addr:district']].filter(Boolean).join(' · '),
        especialidade: (t['healthcare:speciality'] || '').split(';').map(x => ESPECIALIDADE[x.trim()] || x.trim()).filter(Boolean).join(', '),
        mapa: `https://www.openstreetmap.org/${chave}`,
      };
      if (t.office) { if (!ESCRITORIOS[t.office]) continue; item.tipo = ESCRITORIOS[t.office]; outras.push(item); }
      else { const tipo = SAUDE[t.healthcare] || SAUDE[t.amenity]; if (!tipo) continue; item.tipo = tipo; clinicas.push(item); }
    }
    if (!achouCidade) throw new Error(`Não achei "${cidade}-${uf}" no mapa. Confira o nome da cidade (como no IBGE) e o estado.`);
    const porNome = (a, b) => (b.tel ? 1 : 0) - (a.tel ? 1 : 0) || (b.novo ? 1 : 0) - (a.novo ? 1 : 0) || a.nome.localeCompare(b.nome, 'pt-BR');
    const dedup = arr => { const m = new Map(); for (const i of arr) { const k = i.nome.toLowerCase() + '|' + (i.tel ? i.tel.digitos : ''); if (!m.has(k)) m.set(k, i); } return [...m.values()]; };
    const c = dedup(clinicas).sort(porNome), o = dedup(outras).filter(i => i.tel || i.site).sort(porNome).slice(0, 150);
    for (const i of [...c, ...o]) vistos.add(i.chave);
    localStorage.setItem('kwik-mini-vistos', JSON.stringify([...vistos].slice(-8000)));
    return { clinicas: c, outras: o };
  }

  // ------------------------------------------------------------------ trabalhar
  function pedirCidade() {
    return new Promise(res => {
      const cfg = A().cfg(), d = $('#dlgCidade');
      $('#cidadeNome').value = cfg.maycon.cidade || ''; $('#cidadeUF').value = cfg.maycon.uf || '';
      const ok = e => {
        e.preventDefault();
        const cidade = $('#cidadeNome').value.trim(), uf = $('#cidadeUF').value;
        if (!cidade || !uf) return;
        cfg.maycon.cidade = cidade.toLowerCase().replace(/(^|\s)(\S)/g, (m, e, l) => e + l.toUpperCase()).replace(/\s(D[aeo]s?)\s/gi, (m, d) => ' ' + d.toLowerCase() + ' '); cfg.maycon.uf = uf; A().salvar();
        d.close('ok');
      };
      $('#formCidade').onsubmit = ok;
      d.onclose = () => res(d.returnValue === 'ok' ? { cidade: cfg.maycon.cidade, uf: cfg.maycon.uf } : null);
      d.returnValue = '';
      d.showModal();
    });
  }

  async function trabalhar(f, p, trocarCidade) {
    if (p.trabalhando) return;
    if (!A().online()) {
      const BK = A().BK();
      if (BK && BK.nome === 'github') { A().toast('Conecte ao GitHub para salvar o relatório do Maycon 🔗'); return A().abrirConexao(); }
      return A().toast('O servidor está desligado. Abra o ABRIR-ESCRITORIO.bat.', { erro: true });
    }
    const cfg = A().cfg();
    let alvo = cfg.maycon.cidade && cfg.maycon.uf && !trocarCidade ? { cidade: cfg.maycon.cidade, uf: cfg.maycon.uf } : await pedirCidade();
    if (!alvo) return;
    if (!(await A().esperarLivre(p, 1500))) return A().toast('Espere o Maycon terminar o que está fazendo 😉');
    if (p.modo !== 'sentado') await KM.voltarSentar(p);
    p.trabalhando = true; p.digitando = true; A().estado.trabalhoDe.prospeccao = true; A().atualizarBotoes();
    A().pagar(f, p);
    A().iniciarPainelTarefa(`📞 Clientes em ${alvo.cidade}-${alvo.uf}`);
    const cb = A().callbacksTarefa(p, false);
    const roteiro = [[0, `Abrindo o mapa de ${alvo.cidade} 🗺️`, 8], [5, 'Procurando clínicas e consultórios 🏥', 25], [15, 'Anotando os telefones ☎️', 45],
      [28, 'Conferindo endereços e sites 📍', 62], [42, 'Separando quem tem telefone…', 78], [60, 'O mapa está pesado hoje, quase lá…', 88]];
    let k = 0, terminou = false;
    const t0 = Date.now();
    const narrar = (async () => { while (!terminou) { const sg = (Date.now() - t0) / 1000; while (k < roteiro.length && sg >= roteiro[k][0]) { cb.etapa(roteiro[k][1]); cb.progresso(roteiro[k][2]); k++; } cb.tique(); await KM.esperar(600); } })();
    let rel, erro, fonte = 'OpenStreetMap (© colaboradores do OpenStreetMap, ODbL)';
    try {
      let dados;
      try { dados = await buscarOverpass(consulta(alvo.cidade, alvo.uf)); }
      catch (e) {
        cb.etapa('O mapa principal está fora do ar, usando a busca reserva 🔁');
        k = roteiro.length; cb.progresso(60);
        dados = await buscarNominatim(alvo.cidade, alvo.uf, termo => cb.etapa(`Procurando: ${{ clinic: 'clínicas', dentist: 'dentistas', doctors: 'consultórios', laboratory: 'laboratórios', physiotherapist: 'fisioterapia', veterinary: 'veterinárias', lawyer: 'advocacias', 'estate agent': 'imobiliárias', insurance: 'seguradoras', company: 'empresas' }[termo] || termo}…`));
        fonte = 'OpenStreetMap via Nominatim (© colaboradores do OpenStreetMap, ODbL) — busca reserva, menos completa';
      }
      const { clinicas, outras } = montar(dados, alvo.cidade, alvo.uf);
      const agora = new Date(), dd = n => String(n).padStart(2, '0');
      rel = {
        id: `${agora.getFullYear()}${dd(agora.getMonth() + 1)}${dd(agora.getDate())}-${dd(agora.getHours())}${dd(agora.getMinutes())}${dd(agora.getSeconds())}-clientes`,
        tipo: 'prospeccao', criadoEm: `${agora.getFullYear()}-${dd(agora.getMonth() + 1)}-${dd(agora.getDate())}T${dd(agora.getHours())}:${dd(agora.getMinutes())}:${dd(agora.getSeconds())}`,
        funcionario: { id: f.id, nome: f.nome }, tarefa: 'Prospecção de clientes', cidade: alvo.cidade, uf: alvo.uf,
        clinicas, outras, qtdClinicas: clinicas.length, qtdComTelefone: clinicas.filter(i => i.tel && i.tel.digitos).length + outras.filter(i => i.tel && i.tel.digitos).length,
        qtdNovos: [...clinicas, ...outras].filter(i => i.novo).length, duracao: Math.round((Date.now() - t0) / 100) / 10,
        fonte,
      };
      cb.etapa(`Achei ${clinicas.length} clínicas/consultórios e ${outras.length} outras empresas 📋`); cb.progresso(95);
      await A().BK().salvarRelatorio(rel);
      cb.progresso(100);
    } catch (e) { erro = e; }
    terminou = true; await narrar;
    p.trabalhando = false; p.digitando = false; A().estado.trabalhoDe.prospeccao = false; A().atualizarBotoes();
    if (erro) {
      A().falar(p.id, 'Não deu certo dessa vez 😓', 3000);
      return A().toast('Maycon: ' + erro.message, { erro: true, ms: 10000, botao: ['Trocar cidade', () => trabalhar(f, p, true)] });
    }
    await A().carregarRelatorios({ id: rel.id, criadoEm: rel.criadoEm, funcionario: rel.funcionario, tipo: rel.tipo, cidade: rel.cidade, uf: rel.uf, qtdClinicas: rel.qtdClinicas, qtdComTelefone: rel.qtdComTelefone });
    A().falar(p.id, `Pronto! ${rel.qtdComTelefone} contatos com telefone ☎️`, 3000);
    A().toast(`📞 Maycon entregou: ${rel.qtdClinicas} clínicas em ${rel.cidade} (${rel.qtdComTelefone} com telefone).`, { botao: ['Ver relatório', () => A().abrirRelatorio(rel.id)], ms: 10000 });
    await A().concluir(f, p);
  }

  // ------------------------------------------------------------------ relatório
  function renderRel(r, box) {
    const { el, fmtData } = A();
    let soTel = true, busca = '', tipo = '';
    const rel = el('div', { class: 'rel' });
    rel.append(el('div', { class: 'rel-cab' },
      el('div', {}, el('h2', {}, `📞 Futuros clientes · ${r.cidade}-${r.uf}`),
        el('p', {}, `Pesquisado por ${r.funcionario?.nome || 'Maycon'} em ${fmtData(r.criadoEm)} · levou ${r.duracao}s`),
        el('div', { class: 'chips' }, el('span', { class: 'chip ok' }, `🏥 ${r.qtdClinicas} clínicas e consultórios`), el('span', { class: 'chip ok' }, `☎️ ${r.qtdComTelefone} com telefone`),
          r.qtdNovos ? el('span', { class: 'chip' }, `🆕 ${r.qtdNovos} novos desde a última busca`) : null)),
      el('div', { class: 'rel-bts' },
        el('button', { class: 'bt peq', onclick: () => baixarCSV(r) }, '⬇️ Planilha (CSV)'),
        el('button', { class: 'bt peq', onclick: () => copiar(r) }, '📋 Copiar lista'),
        el('button', { class: 'bt peq perigo', onclick: () => A().apagarRel(r) }, '🗑️ Apagar'))));
    const tipos = [...new Set(r.clinicas.map(i => i.tipo))].sort();
    const lista = el('div', { class: 'leads' }), listaO = el('div', { class: 'leads' });
    const desenhar = () => {
      const q = busca.toLowerCase();
      const passa = i => (!soTel || (i.tel && i.tel.digitos)) && (!tipo || i.tipo === tipo) && (!q || (i.nome + ' ' + i.endereco + ' ' + i.especialidade).toLowerCase().includes(q));
      lista.innerHTML = ''; listaO.innerHTML = '';
      const c = r.clinicas.filter(passa), o = r.outras.filter(i => (!soTel || (i.tel && i.tel.digitos)) && (!q || (i.nome + ' ' + i.endereco).toLowerCase().includes(q)));
      c.forEach(i => lista.append(cartao(i)));
      o.forEach(i => listaO.append(cartao(i)));
      if (!c.length) lista.append(el('p', { class: 'vazio' }, soTel ? 'Nenhuma com telefone nesse filtro. Desmarque "Só com telefone" para ver todas.' : 'Nada encontrado.'));
      if (!o.length) listaO.append(el('p', { class: 'vazio' }, 'Nada nesse filtro.'));
      contC.textContent = c.length; contO.textContent = o.length;
    };
    const cartao = i => el('div', { class: 'lead' },
      el('div', { class: 'lead-cab' }, el('b', {}, i.nome), el('span', { class: 'tipo' }, i.tipo), i.novo ? el('span', { class: 'novo' }, 'NOVO') : null),
      i.especialidade ? el('small', {}, '🩺 ' + i.especialidade) : null,
      i.endereco ? el('small', {}, '📍 ' + i.endereco) : null,
      el('div', { class: 'lead-bts' },
        i.tel && i.tel.digitos ? el('a', { class: 'bt peq', href: 'tel:+' + i.tel.digitos }, '☎️ ' + i.tel.texto) : i.tel ? el('span', { class: 'chip' }, '☎️ ' + i.tel.texto) : el('span', { class: 'chip' }, 'sem telefone no mapa'),
        i.tel && i.tel.digitos ? el('a', { class: 'bt peq whats', href: `https://wa.me/${i.tel.digitos}?text=${encodeURIComponent('Olá! Aqui é da KWIK Contabilidade Inteligente. Atendemos clínicas e consultórios com contabilidade completa. Posso te apresentar uma proposta?')}`, target: '_blank', rel: 'noopener' }, '💬 WhatsApp') : null,
        i.site ? el('a', { class: 'bt peq', href: /^https?:/.test(i.site) ? i.site : 'https://' + i.site, target: '_blank', rel: 'noopener' }, '🌐 Site') : null,
        el('a', { class: 'bt peq', href: i.mapa, target: '_blank', rel: 'noopener' }, '🗺️ Mapa')));
    const contC = el('span', { class: 'chip' }), contO = el('span', { class: 'chip' });
    const chkTel = el('label', { class: 'chk' }, el('input', { type: 'checkbox', checked: true, onchange: e => { soTel = e.target.checked; desenhar(); } }), ' Só com telefone');
    const selTipo = el('select', { onchange: e => { tipo = e.target.value; desenhar(); } }, el('option', { value: '' }, 'Todos os tipos'), tipos.map(t => el('option', { value: t }, t)));
    rel.append(el('div', { class: 'filtros' }, el('input', { type: 'search', placeholder: 'Buscar nome, bairro, especialidade…', oninput: e => { busca = e.target.value; desenhar(); } }), selTipo, chkTel));
    rel.append(el('div', { class: 'colunas' },
      el('div', { class: 'principal' }, el('h3', {}, '🏥 Clínicas e consultórios ', contC), el('p', { class: 'sub' }, 'Prioridade do Maycon: saúde (clínicas, consultórios, dentistas, laboratórios, fisioterapia…).'), lista),
      el('div', {}, el('h3', {}, '🏢 Outras empresas ', contO), el('p', { class: 'sub' }, 'Escritórios com telefone ou site (advocacia, imobiliárias, tecnologia, consultorias…). Contabilidades ficam de fora.'), listaO)));
    rel.append(el('p', { class: 'vazio', style: 'margin-top:16px;font-size:12px' }, `Fonte: ${r.fonte}. O mapa aberto não tem todos os negócios nem todos os telefones; confirme os dados antes de ligar.`));
    box.append(rel);
    desenhar();
  }

  const linhaCSV = cols => cols.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';');
  function baixarCSV(r) {
    const linhas = [linhaCSV(['Grupo', 'Nome', 'Tipo', 'Telefone', 'WhatsApp', 'Endereço', 'Especialidade', 'Site', 'E-mail', 'Novo', 'Mapa'])];
    for (const [g, arr] of [['Saúde', r.clinicas], ['Outras', r.outras]]) for (const i of arr) linhas.push(linhaCSV([g, i.nome, i.tipo, i.tel ? i.tel.texto : '', i.tel && i.tel.digitos ? 'https://wa.me/' + i.tel.digitos : '', i.endereco, i.especialidade, i.site, i.email, i.novo ? 'sim' : '', i.mapa]));
    const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = A().el('a', { href: URL.createObjectURL(blob), download: `Clientes ${r.cidade}-${r.uf} ${r.criadoEm.slice(0, 10)}.csv` });
    document.body.append(a); a.click(); a.remove();
  }
  async function copiar(r) {
    const l = [`*📞 Futuros clientes — ${r.cidade}-${r.uf}*`, ''];
    r.clinicas.filter(i => i.tel && i.tel.digitos).forEach(i => l.push(`• ${i.nome} (${i.tipo}) — ${i.tel.texto}`));
    try { await navigator.clipboard.writeText(l.join('\n')); A().toast('Lista copiada 📋'); } catch (e) { A().toast('Não consegui copiar.', { erro: true }); }
  }

  // ------------------------------------------------------------------ rotina: fotos pelo escritório
  const PONTOS = [[50, 50], [46, 98], [72, 70], [30, 46], [90, 68], [58, 60]];
  async function rotinaFotos() {
    for (;;) {
      await KM.esperar(25000 + Math.random() * 25000);
      const est = A().estado, cfg = A().cfg();
      const p = Object.values(est.pessoas || {}).find(q => q.funcao === 'prospeccao');
      if (!p || !cfg.opcoes.fotos || p.acao || p.trabalhando || p.dormindo || est.sala === 'jogos' || p.modo !== 'sentado' || document.hidden) continue;
      p.acao = 'rotina';
      try {
        const m = KM.mov;
        const [x, y] = PONTOS[Math.floor(Math.random() * PONTOS.length)];
        await m.irAte(p, x, y);
        if (p.pararRotina) continue;
        const outros = Object.values(est.pessoas).filter(q => q !== p && q.visivel !== false);
        const alvo = outros[Math.floor(Math.random() * outros.length)];
        if (alvo) { const dx = alvo.X - p.X, dy = alvo.Y - p.Y; p.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'fd' : 'ce') : (dy > 0 ? 'fe' : 'cd'); }
        if (p.dir === 'ce' || p.dir === 'cd') p.dir = p.dir === 'ce' ? 'fe' : 'fd'; // de costas não dá pra ver a câmera
        p.prop = 'camera';
        A().falar(p.id, alvo ? `${A().func(alvo.id).nome.split(' ')[0]}, sorria! 📸` : 'Olha o passarinho! 📸', 1800);
        const antes = alvo && !alvo.acao ? Object.assign({}, alvo.est) : null;
        if (antes) alvo.est = Object.assign({}, alvo.est, { boca: 'sorriso', olhos: 'feliz' });
        await KM.esperar(1100);
        p.est.flash = true; KM.fx.flash = 0.3; KM.fx.corFlash = '#ffffff'; KM.tocar('foto');
        const [cx, cy] = m.cabeca(p);
        KM.emitir('estrela', 5, { x: cx + (p.dir === 'fd' ? 6 : -6), y: cy + 8, dx: 4, dy: 4, vida: 0.4, cor: '#fff9c4' });
        await KM.esperar(260);
        p.est.flash = false;
        if (antes && !alvo.acao) alvo.est = antes;
        cfg.maycon.fotos = Math.min(6, (cfg.maycon.fotos || 0) + 1);
        A().salvar();
        A().falar(p.id, ['Essa vai pro mural! 🖼️', 'Ficou ótima! 😄', 'Mais uma pro álbum da firma 📷'][Math.floor(Math.random() * 3)], 2000);
        await KM.esperar(1300);
      } finally {
        p.prop = null; p.est = {};
        await KM.voltarSentar(p);
        p.acao = null;
      }
    }
  }

  KM.maycon = { trabalhar, renderRel, iniciar() { rotinaFotos(); } };
})();
