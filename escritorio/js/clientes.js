/* KWIK Mini Escritório · botão "Cliente" (cidade dos clientes).
   O botão fica na calçada, ao lado do carro da KWIK. O Kauã sai do prédio, entra no carro e vai até a rua dos
   clientes ativos: cada empresa tem um prédio de acordo com a atividade (um consultório vira um mini consultório
   odontológico, uma nutricionista vira uma clínica de nutrição, uma estética vira um spa…). Tocando num prédio, o
   carro vai até lá, o Kauã entra e aparece o cartão do cliente com o resumo fiscal e da folha, a validade do
   certificado digital e os atalhos para e-CAC, eSocial, SEMFAZ São Luís e NFS-e Nacional.
   O certificado (.pfx) é lido só neste aparelho, sem senha: o app guarda apenas CNPJ, razão social, titular e
   validade. O arquivo e a senha nunca são enviados nem guardados. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const S = () => KM.setores;
  const $ = s => document.querySelector(s);
  const VERDE = '#28BE52', VERDE_ESC = '#1E8A45', CONTORNO = '#1c1612';
  const r = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const tx = (g, s, x, y, c) => KM.texto(g, s, x, y, c);
  const larg = s => KM.larguraTexto(s);
  const tom = (h, f) => KM.cor.tom(h, f);
  const hashId = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(ltda|me|epp|eireli|sa|s a|ss)\b/g, ' ').replace(/\s+/g, ' ').trim();
  const VAZIAS = new Set(['clinica', 'consultorio', 'empresa', 'de', 'da', 'do', 'e', 'centro', 'instituto', 'studio', 'estudio']);
  const palavras = s => norm(s).split(' ').filter(w => w.length > 2 && !VAZIAS.has(w));
  const fmtD = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '—';
  const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const PORTAIS = [
    ['🏛️ e-CAC (Receita Federal)', 'https://cav.receita.fazenda.gov.br/autenticacao/login'],
    ['👷 eSocial', 'https://login.esocial.gov.br/login.aspx'],
    ['🏙️ SEMFAZ São Luís', 'https://stm.semfaz.saoluis.ma.gov.br/sistematributario/jsp/login/login.jsf'],
    ['🧾 NFS-e Nacional', 'https://www.nfse.gov.br/EmissorNacional/Login?ReturnUrl=%2femissornacional'],
  ];

  // ------------------------------------------------------------------ modelos de prédio por atividade
  const MODELOS = {
    odonto: { nome: 'Consultório odontológico', ic: '🦷', fachada: '#e3fafc', parede: '#c5f6fa', piso: ['#f8f9fa', '#e9ecef'], placa: '#0b7285', borda: '#99e9f2' },
    nutricao: { nome: 'Clínica de nutrição', ic: '🍎', fachada: '#ebfbee', parede: '#d3f9d8', piso: ['#fff9db', '#fff3bf'], placa: '#2b8a3e', borda: '#ffa94d' },
    estetica: { nome: 'Clínica de estética', ic: '💆', fachada: '#fff0f6', parede: '#ffdeeb', piso: ['#f8f0fc', '#f3d9fa'], placa: '#a61e4d', borda: '#e599f7' },
    clinica: { nome: 'Clínica / saúde', ic: '🩺', fachada: '#f1f3f5', parede: '#e7f5ff', piso: ['#f8f9fa', '#e9ecef'], placa: '#1971c2', borda: '#ff8787' },
    restaurante: { nome: 'Restaurante / alimentação', ic: '🍽️', fachada: '#fff4e6', parede: '#ffe8cc', piso: ['#d9480f', '#e8590c'], placa: '#c92a2a', borda: '#ffd43b' },
    loja: { nome: 'Loja / comércio', ic: '🛍️', fachada: '#f3f0ff', parede: '#e5dbff', piso: ['#f1f3f5', '#dee2e6'], placa: '#5f3dc4', borda: '#ffd43b' },
    academia: { nome: 'Academia', ic: '🏋️', fachada: '#212529', parede: '#343a40', piso: ['#495057', '#40464d'], placa: '#f08c00', borda: '#ffd43b' },
    escritorio: { nome: 'Escritório / serviços', ic: '🏢', fachada: '#e7f5ff', parede: '#dbe4ff', piso: ['#c8a27a', '#b98a62'], placa: '#364fc7', borda: '#74c0fc' },
  };
  function detectar(txt) {
    const t = norm(txt);
    if (/odont|dent|sorri|ortodon|implant/.test(t)) return 'odonto';
    if (/nutri/.test(t)) return 'nutricao';
    if (/estetic|beleza|spa\b|depila|cabelei|salao|sobrancel|harmoniza|derma/.test(t)) return 'estetica';
    if (/medic|clinic|saude|fisio|psico|fono|laborat|farmac/.test(t)) return 'clinica';
    if (/restaur|lanch|aliment|pizz|burg|cafe|padar|confeit|bar\b|acai/.test(t)) return 'restaurante';
    if (/academ|fitness|crossfit|pilates|treino/.test(t)) return 'academia';
    if (/loja|comerc|varej|moda|roupa|calcad|boutique|mercad|otica|papelar/.test(t)) return 'loja';
    return 'escritorio';
  }

  // ------------------------------------------------------------------ clientes ativos (Fiscal + Folha + Configurações)
  function infos() { const c = A().cfg(); c.clientesInfo = c.clientesInfo || {}; return c.clientesInfo; }
  function lista() {
    const cfg = A().cfg(), fis = S().dados('fiscal'), fol = S().dados('folha'), dig = S().digitos;
    const out = [];
    const igual = (c, cnpj, nome) => {
      const d = dig(cnpj);
      if (d.length === 14 && c.cnpj && dig(c.cnpj) === d) return true;
      const a = palavras(c.razao || c.nome), b = palavras(nome);
      return a.length && b.length && (a[0] === b[0] || norm(c.razao || c.nome).includes(norm(nome)) || norm(nome).includes(norm(c.razao || c.nome)));
    };
    const juntar = (cnpj, nome, extra) => {
      let c = out.find(x => igual(x, cnpj, nome));
      if (!c) { c = { cnpj: '', razao: '', nome: '', ativo: true }; out.push(c); }
      for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== '' && (c[k] === undefined || c[k] === '' || k === 'nome')) c[k] = v;
      if (cnpj && !c.cnpj) c.cnpj = cnpj;
      return c;
    };
    if (fis) for (const e of fis.db.empresas) juntar(e.cnpj, e.razao, { razao: e.razao, regime: e.regime, fiscalId: e.id, responsavel: e.responsavel, contato: e.contato, codigo: e.codigo });
    if (fol) for (const e of fol.db.empresas) {
      const c = juntar(e.cnpj, e.razao, { folhaId: e.id, fantasia: e.fantasia, cnae: e.cnae, regimeFolha: e.regime });
      const ps = fol.db.pessoas.filter(p => p.empresaId === e.id && p.situacao !== 'Desligado' && !p.demissao);
      c.socios = ps.filter(p => p.vinculo === 'Pró-labore').map(p => p.nome);
      c.equipe = ps.filter(p => p.vinculo !== 'Pró-labore').map(p => ({ nome: p.nome, cargo: p.cargo || p.vinculo }));
    }
    for (const x of cfg.clientes || []) {
      if (!x.nome) continue;
      const c = out.find(y => igual(y, '', x.nome));
      if (c) { c.valor = x.valor; c.telefone = x.telefone; c.statusCfg = x.status || 'ativo'; }
      else if ((x.status || 'ativo') === 'ativo') out.push({ nome: x.nome, razao: x.nome, valor: x.valor, telefone: x.telefone, statusCfg: 'ativo', soCadastro: true });
    }
    const inf = infos();
    for (const c of out) {
      c.chave = dig(c.cnpj).length === 14 ? dig(c.cnpj) : 'n-' + norm(c.razao || c.nome).replace(/ /g, '-');
      c.info = inf[c.chave] || {};
      c.nome = c.fantasia ? c.fantasia.replace(/\s*\(.*\)\s*/, '') : (c.razao || c.nome).replace(/\s*(–|-)?\s*ltda\.?$/i, '');
      c.nomeCurto = c.nome.length > 26 ? c.nome.split(/[\s–-]+/).filter(Boolean).slice(0, 3).join(' ') : c.nome;
      const par = (c.fantasia || '').match(/\(([^)]+)\)/);
      c.dono = (c.socios && c.socios[0] && c.socios[0].split(' ')[0]) || (par && par[1].split(' ')[0]) || (c.responsavel && c.responsavel.split(/[\s(]/)[0]) || (c.info.cert && c.info.cert.titular && c.info.cert.titular.split(' ')[0]) || '';
      c.dono = c.dono ? c.dono.charAt(0).toUpperCase() + c.dono.slice(1).toLowerCase() : '';
      c.modelo = c.info.modelo || detectar([c.razao, c.fantasia, c.cnae, c.nome].join(' '));
      c.ativo = (c.statusCfg || 'ativo') === 'ativo';
    }
    return out.filter(c => c.ativo);
  }

  // ------------------------------------------------------------------ bonecos
  const PELES = ['#E8B48F', '#C68642', '#F5D0B5', '#8D5524', '#E0AC82', '#FFDBAC', '#A0673C', '#F1C9A5'];
  const CABELOS = [['longo', '#3B2416'], ['coque', '#1C1C1C'], ['cacheado', '#2B1B12'], ['curto', '#6B4226'], ['longo', '#B5651D'], ['topete', '#1C1C1C'], ['coque', '#8a5a2b'], ['longo', '#E6C35C']];
  function aparencia(seed, roupa) {
    const h = hashId(seed), [cabelo, corCabelo] = CABELOS[h % CABELOS.length];
    return {
      pele: PELES[(h >>> 3) % PELES.length], cabelo, corCabelo, estiloCamisa: roupa.estilo || 'casual', corCamisa: roupa.cor || '#74c0fc', corGravata: roupa.gravata || '#28BE52',
      calca: roupa.calca || '#2F3A4A', sapato: '#ffffff', oculos: h % 5 === 2, fone: false, bone: false, barba: false, corBone: '#28BE52', cracha: !!roupa.cracha, corCordao: roupa.cor || '#28BE52', chapeu: '',
      baixo: 'calca', calcado: 'tenis', altura: 'normal', cachecol: false, corCachecol: '#c9453a', olhos: 'normal', sobrancelha: 'normal', boca: 'sorriso',
      sardas: false, bochechas: h % 3 === 0, pinta: false, estampa: 'lisa', corEstampa: '#ffffff', relogio: false, corRelogio: '#212529', colar: h % 4 === 1, corColar: '#e2b33c',
      brinco: h % 2 === 0, corBrinco: '#e2b33c', corFone: '#111A19', corOculos: '#1b1b1b',
    };
  }
  const JALECO = { estilo: 'jaqueta', cor: '#f8f9fa', calca: '#dee2e6', cracha: true };
  const ROUPA = { odonto: JALECO, nutricao: JALECO, clinica: JALECO, estetica: { estilo: 'jaqueta', cor: '#fcc2d7', calca: '#f8f0fc', cracha: true },
    restaurante: { estilo: 'camiseta', cor: '#e03131', calca: '#212529' }, academia: { estilo: 'camiseta', cor: '#f08c00', calca: '#212529' },
    loja: { estilo: 'casual', cor: '#7048e8', calca: '#2b3a55', cracha: true }, escritorio: { estilo: 'social', cor: '#cfe0f5', calca: '#3a3f47' } };
  function pessoa(g, ap, est, x, y, espelho) {
    const s = KM.sprite(ap, est), sent = est.pose === 'sentado';
    if (!sent) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x - 6, y - 2, 12, 3); }
    const ox = Math.round(x) - 15, oy = Math.round(y) - (sent ? 39 : 45);
    if (espelho) { g.save(); g.translate(ox + 30, oy); g.scale(-1, 1); g.drawImage(s, 0, 0); g.restore(); } else g.drawImage(s, ox, oy);
  }
  function balao(g, s, x, y) {
    const w = larg(s) + 6, bx = Math.round(Math.max(2, Math.min(g.canvas.width - w - 2, x - w / 2))), by = Math.round(Math.max(1, y - 12));
    r(g, bx, by, w, 9, CONTORNO); r(g, bx + 1, by + 1, w - 2, 7, '#ffffff'); r(g, Math.round(x) - 1, by + 9, 3, 2, CONTORNO); r(g, Math.round(x), by + 8, 1, 2, '#ffffff');
    tx(g, s, bx + 3, by + 2, CONTORNO);
  }

  // ------------------------------------------------------------------ carro da KWIK (28 x 14, x/y = canto de cima à esquerda)
  function carroKwik(g, x, y, dir, t, andando) {
    x = Math.round(x); y = Math.round(y);
    const pula = andando && Math.floor(t * 10) % 2 ? 1 : 0;
    r(g, x + 1, y + 12, 27, 2, 'rgba(0,0,0,0.28)');
    y -= pula;
    r(g, x, y + 4, 28, 7, CONTORNO); r(g, x + 1, y + 5, 26, 5, VERDE); r(g, x + 1, y + 9, 26, 1, VERDE_ESC);
    r(g, x + 6, y, 16, 5, CONTORNO); r(g, x + 7, y + 1, 14, 4, VERDE_ESC);
    r(g, x + 8, y + 1, 5, 3, '#a5d8ff'); r(g, x + 15, y + 1, 5, 3, '#a5d8ff'); r(g, x + 9, y + 1, 1, 1, '#e7f5ff');
    tx(g, 'KWIK', x + 6, y + 5, '#ffffff');
    const fr = dir >= 0 ? x + 27 : x, tr = dir >= 0 ? x : x + 27;
    r(g, fr, y + 6, 1, 2, '#fff3a0'); r(g, tr, y + 6, 1, 2, '#ff6b6b');
    y += pula;
    for (const wx of [x + 3, x + 20]) { r(g, wx, y + 9, 6, 5, '#111'); r(g, wx + 2, y + 11, 2, 1, '#adb5bd'); }
  }
  KM.carroKwik = carroKwik;

  // ------------------------------------------------------------------ carro estacionado na frente do escritório
  const ofc = { x: null, alvo: null, dir: 1, vel: 0, visivel: true, kauaDentro: false, viagem: false };
  const vaga = () => { const L = KM.LAYOUT; return { x: Math.max(18, L.predio.x - 8), y: L.rua + 27 }; };
  KM.objetos = KM.objetos || [];
  KM.objetos.push({ get X() { return (ofc.x == null ? 0 : ofc.x) + 14; }, get Y() { return KM.LAYOUT ? KM.LAYOUT.rua + 41 : 0; }, f: (g, t) => {
    if (!KM.LAYOUT || !ofc.visivel) return;
    const v = vaga(); if (ofc.x == null) ofc.x = v.x;
    carroKwik(g, ofc.x, v.y, ofc.dir, t, ofc.vel !== 0);
  } });
  function dirigirOfc(ate, vel = 70) {
    return KM.mov.quadroAQuadro(dt => {
      const d = ate - ofc.x; if (Math.abs(d) < 1) { ofc.x = ate; ofc.vel = 0; return true; }
      ofc.dir = Math.sign(d); ofc.vel = ofc.dir * vel; ofc.x += Math.sign(d) * Math.min(Math.abs(d), vel * dt); return false;
    });
  }
  function posicionarBotao() {
    const pal = $('#palco'), L = KM.LAYOUT; if (!pal || !L) return;
    let b = $('#btsRua');
    if (!b) {
      b = A().el('div', { id: 'btsRua', class: 'bts-rua' },
        A().el('button', { id: 'btRua', class: 'bt-rua', title: 'Cliente: entrar no carro e visitar os clientes ativos na cidade', onclick: e => { e.stopPropagation(); sair(); } }, '🚗 Cliente'),
        A().el('button', { id: 'btIpog', class: 'bt-rua ipog', title: 'IPOG: ir de carro até o prédio do IPOG e ver os módulos da pós', onclick: e => { e.stopPropagation(); if (KM.ipog) KM.ipog.ir(); } }, '🎓 IPOG'));
      pal.append(b);
    }
    const v = vaga(), [bx, by] = KM.paraTela(...KM.prj(v.x + 32, L.rua + 17));
    b.style.left = (bx / KM.W * 100).toFixed(2) + '%';
    b.style.top = (by / KM.H * 100).toFixed(2) + '%';
  }

  // Kauã sai do prédio, entra no carro e vai embora (destino: cidade dos clientes ou outro, ex.: IPOG)
  async function sair(destino) {
    const abrir = (destino && destino.abrir) || abrirRua;
    const est = A().estado, p = est.pessoas.f1, L = KM.LAYOUT;
    if (ofc.viagem) return abrir();
    if (!p) return abrir();
    if (p.trabalhando) return A().toast(`Espere ${KM.nomeDe ? KM.nomeDe('noticias') : 'o Kauã'} terminar o trabalho 😉`);
    ofc.viagem = true;
    KM.tocar('clique');
    if (!destino) carregarDados();
    try {
      if (p.acao === 'rotina' || p.acao === 'soneca') await KM.pararRotina(p);
      p.acao = (destino && destino.acao) || 'clientes';
      A().falar(p.id, (destino && destino.fala) || 'Vou visitar os clientes! 🚗', 2600);
      const c0 = L.corredores[0], v = vaga();
      await KM.mov.irAte(p, L.predio.x + 10, c0.y + 22, 150);
      await KM.mov.andarAte(p, 10, c0.y + 22, 150);
      await KM.mov.andarAte(p, 10, L.rua + 18, 150);
      await KM.mov.andarAte(p, v.x + 8, L.rua + 20, 150);
      p.visivel = false; ofc.kauaDentro = true; KM.tocar('moto');
      await KM.esperar(350);
      await dirigirOfc((KM.LAYOUT ? KM.LAYOUT.W : KM.W) + 40, 170);
    } catch (e) { /* segue */ }
    abrir();
  }
  async function voltar(fala) {
    const est = A().estado, p = est.pessoas.f1, L = KM.LAYOUT;
    if (!ofc.viagem) return;
    try {
      ofc.x = (KM.LAYOUT ? KM.LAYOUT.W : KM.W) + 40; KM.tocar('moto');
      const v = vaga();
      await dirigirOfc(v.x, 170);
      ofc.dir = 1;
      if (p) {
        const c0 = L.corredores[0];
        Object.assign(p, { X: v.x + 8, Y: L.rua + 20, visivel: true, modo: 'em-pe', est: {}, dir: 'ce' });
        A().falar(p.id, typeof fala === 'string' ? fala : 'Voltei! Os clientes mandaram lembranças 💚', 3000);
        await KM.mov.andarAte(p, 10, L.rua + 18, 150);
        await KM.mov.andarAte(p, 10, c0.y + 22, 150);
        await KM.mov.andarAte(p, L.predio.x + 10, c0.y + 22, 150);
        await KM.voltarSentar(p);
      }
    } catch (e) { /* segue */ }
    if (p) { p.acao = null; p.visivel = true; }
    ofc.viagem = false; ofc.kauaDentro = false;
  }

  // ------------------------------------------------------------------ a cidade dos clientes
  // Interior de cada prédio (visto por dentro, ao visitar): 172 x 132.
  const LOTE = 172, Y_PLACA = 4, Y_TOPO = 22, Y_CHAO = 44, Y_FRENTE = 122, H_DENTRO = 132;
  // Cidade (vista de longe): prédios pequenos em quarteirões, ruas na frente de cada fileira e uma avenida à esquerda.
  const LW = 64, RH = 72, MX = 32, MY = 14, AV = 15; // largura do lote, altura da fileira, margem, topo, centro da avenida
  const cena = { W: 300, H: 200, cols: 3, lotes: [], hq: null, carro: { x: 0, y: 0, dir: 1 }, andando: false, kaua: null, sel: null, dentro: null, raf: 0, cancelar: 0 };
  function montar() {
    if ($('#dlgRua')) return;
    const d = document.createElement('dialog');
    d.id = 'dlgRua'; d.className = 'rua-dlg';
    d.innerHTML = `<div class="dlg-topo"><h2>🚗 Clientes</h2><div class="rua-bts"><label class="bt peq" title="Escolha os arquivos .pfx: só a validade e o CNPJ são lidos, sem senha">📜 Certificados<input type="file" id="ruaCert" accept=".pfx,.p12" multiple hidden></label><button class="bt peq prim" id="ruaVoltar">🏢 Voltar</button></div></div>
      <div class="rua-cena" id="ruaCena"><canvas id="ruaTela" width="300" height="200"></canvas></div>
      <div class="rua-dica" id="ruaDica">Toque num prédio para ir até o cliente.</div>
      <div class="dlg-corpo rua-info" id="ruaInfo"></div>`;
    document.body.append(d);
    $('#ruaVoltar').addEventListener('click', () => d.close());
    d.addEventListener('close', () => { cancelAnimationFrame(cena.raf); cena.raf = 0; cena.cancelar++; voltar(); });
    $('#ruaTela').addEventListener('click', e => {
      const cv = e.currentTarget, x = e.offsetX / cv.clientWidth * cena.W, y = e.offsetY / cv.clientHeight * cena.H;
      const i = cena.lotes.findIndex(l => x >= l.x && x < l.x + LW && y >= l.y - 4 && y < l.y + 50);
      if (i >= 0) irAoCliente(i);
    });
    $('#ruaCert').addEventListener('change', e => lerCertificados([...e.target.files]).finally(() => { e.target.value = ''; }));
  }
  async function carregarDados() { await Promise.all(['fiscal', 'folha'].map(k => S().carregar(k).catch(() => null))); }
  async function abrirRua() {
    if (KM.cidade3d && KM.cidade3d.disponivel()) return KM.cidade3d.abrir(); // cidade em 3D (sem WebGL, fica a cidade desenhada)
    montar();
    const d = $('#dlgRua');
    if (!d.open) d.showModal();
    $('#ruaInfo').innerHTML = '<p class="vazio">Carregando os clientes…</p>';
    await carregarDados();
    montarCena();
    cena.kaua = null; cena.sel = null; cena.dentro = null;
    Object.assign(cena.carro, { x: cena.hq.porta - 14, y: cena.hq.rua - 7, dir: 1 });
    const dica = $('#ruaDica');
    if (!cena.lotes.length) {
      dica.textContent = 'Nenhum cliente ativo encontrado.';
      $('#ruaInfo').innerHTML = '';
      $('#ruaInfo').append(A().el('p', { class: 'vazio' }, 'Conecte o KWIK Fiscal e o KWIK Folha (abra o setor Fiscal ou Folha) ou cadastre clientes ativos em Configurações → Clientes ativos.'));
    } else {
      dica.textContent = `${cena.lotes.length} cliente${cena.lotes.length > 1 ? 's' : ''} ativo${cena.lotes.length > 1 ? 's' : ''} na cidade · toque num prédio para visitar e ver por dentro`;
      renderResumoRua();
    }
    if (!cena.raf) cena.raf = requestAnimationFrame(quadro);
  }
  function montarCena(manterW) {
    const cs = lista(), cv = $('#ruaTela'), box = $('#ruaCena');
    if (!manterW) {
      const esc = window.matchMedia('(max-width: 700px)').matches ? 1.5 : 2.4;
      cena.W = Math.max(MX + 2 * LW + 8, Math.round(((box && box.clientWidth) || 600) / esc));
    }
    cena.cols = Math.max(2, Math.floor((cena.W - MX - 4) / LW));
    const vagas = cs.length + 1, linhas = Math.ceil(vagas / cena.cols);
    cena.H = MY + linhas * RH + 6;
    const lote = i => { const row = Math.floor(i / cena.cols), col = i % cena.cols, x = MX + col * LW, y = MY + row * RH; return { x, y, porta: x + LW / 2, rua: y + 54 }; };
    cena.hq = lote(0);
    cena.lotes = cs.map((c, i) => ({ c, ...lote(i + 1), pessoas: povoar(c) }));
    cv.width = cena.W; cv.height = cena.H;
  }
  // quem aparece dentro de cada prédio (dono, equipe da folha e um cliente sendo atendido)
  function povoar(c) {
    const roupa = ROUPA[c.modelo] || ROUPA.escritorio, l = [];
    const P = { // posições (relativas ao prédio) por modelo: [x, y, pose, olhando à direita?]
      odonto: { dono: [104, 92, 'pe', false], paciente: [86, 84, 'deitado'], equipe: [[30, 108, 'balcao', true], [128, 98, 'pe', false], [52, 80, 'pe', true]] },
      nutricao: { dono: [96, 84, 'sentado', false], paciente: [96, 110, 'costas'], equipe: [[30, 108, 'balcao', true], [140, 96, 'pe', false]] },
      estetica: { dono: [128, 96, 'pe', false], paciente: [104, 84, 'deitado'], equipe: [[30, 108, 'balcao', true], [52, 90, 'pe', true]] },
      clinica: { dono: [104, 92, 'pe', false], paciente: [86, 86, 'deitado'], equipe: [[30, 108, 'balcao', true], [130, 100, 'pe', false]] },
      restaurante: { dono: [30, 108, 'balcao', true], paciente: [110, 100, 'sentado'], equipe: [[60, 74, 'pe', true], [136, 100, 'pe', false]] },
      loja: { dono: [30, 108, 'balcao', true], paciente: [110, 96, 'pe'], equipe: [[130, 84, 'pe', false]] },
      academia: { dono: [60, 100, 'pe', true], paciente: [110, 88, 'pe'], equipe: [[136, 104, 'pe', false]] },
      escritorio: { dono: [96, 84, 'sentado', false], paciente: [96, 110, 'costas'], equipe: [[30, 108, 'balcao', true], [140, 96, 'pe', false]] },
    }[c.modelo];
    l.push({ papel: 'dono', chave: 'dono', nome: c.dono || 'Dono(a)', cargo: 'Dono(a)', ap: aparencia(c.chave + 'dono', roupa), pos: P.dono });
    (c.equipe || []).slice(0, P.equipe.length).forEach((q, i) => l.push({ papel: 'equipe', chave: 'eq:' + q.nome, nome: q.nome.split(' ')[0], cargo: q.cargo, ap: aparencia(q.nome, /recep/i.test(q.cargo) ? { estilo: 'casual', cor: '#ffffff', cracha: true, calca: '#2b3a55' } : roupa), pos: P.equipe[i] }));
    l.push({ papel: 'cliente', chave: 'cliente', nome: 'Cliente', cargo: 'Cliente sendo atendido', ap: aparencia(c.chave + 'cli', { estilo: 'camiseta', cor: ['#ffd43b', '#4dabf7', '#ff8787', '#63e6be'][hashId(c.chave) % 4], calca: '#3b5b8a' }), pos: P.paciente });
    // o que você personalizou (nome, pele, cabelo, roupa…) por cima do visual automático
    const vis = (c.info && c.info.visual) || {};
    for (const q of l) { const v = vis[q.chave]; if (!v) continue; const { nome, ...ap } = v; Object.assign(q.ap, ap); if (nome) q.nome = nome; }
    return l;
  }
  const OPC_PELE = ['#FFDBAC', '#F5D0B5', '#F1C9A5', '#E8B48F', '#E0AC82', '#C68642', '#A0673C', '#8D5524', '#5C3A21'];
  const OPC_CABELO = [['curto', 'Curto'], ['longo', 'Longo'], ['coque', 'Coque'], ['cacheado', 'Cacheado'], ['topete', 'Topete'], ['moicano', 'Moicano'], ['careca', 'Careca']];
  const OPC_ROUPA = [['jaqueta', 'Jaleco / jaqueta'], ['social', 'Camisa social'], ['casual', 'Casual'], ['camiseta', 'Camiseta'], ['kwik', 'Uniforme']];
  // Personalizar as pessoas do prédio do cliente (fica salvo em cfg.clientesInfo[cliente].visual)
  function blocoPersonalizar(c, lote) {
    const { el } = A(), box = el('div', { class: 'rua-pers' }, el('h3', {}, '🎨 Personalizar as pessoas deste prédio'));
    const salvarV = (q, campo, valor) => {
      const inf = infos(); inf[c.chave] = inf[c.chave] || {}; const vis = inf[c.chave].visual = inf[c.chave].visual || {};
      vis[q.chave] = { ...(vis[q.chave] || {}), [campo]: valor };
      c.info = inf[c.chave];
      if (campo === 'nome') q.nome = valor; else q.ap[campo] = valor;
      A().salvar(); desenharMini(q);
    };
    const mini = new Map();
    const desenharMini = q => { const cv = mini.get(q); if (!cv) return; const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false; g.drawImage(KM.sprite(q.ap, { vista: 'frente', boca: 'sorriso' }), 0, 0); };
    for (const q of lote.pessoas) {
      const cv = el('canvas', { width: 30, height: 46, class: 'rua-pers-av' }); mini.set(q, cv);
      const sel = (opts, campo) => el('select', { onchange: e => salvarV(q, campo, e.target.value) }, opts.map(([v, t]) => el('option', { value: v, selected: q.ap[campo] === v }, t)));
      const cor = campo => el('input', { type: 'color', value: q.ap[campo], title: 'Cor', oninput: e => salvarV(q, campo, e.target.value) });
      const peles = el('div', { class: 'rua-peles' }, OPC_PELE.map(p => el('button', { type: 'button', class: 'pele' + (q.ap.pele === p ? ' on' : ''), style: `background:${p}`, title: 'Tom de pele', onclick: e => { salvarV(q, 'pele', p); e.currentTarget.parentNode.querySelectorAll('.pele').forEach(b => b.classList.toggle('on', b === e.currentTarget)); } })));
      box.append(el('div', { class: 'rua-pers-linha' }, cv,
        el('div', { class: 'rua-pers-campos' },
          el('div', { class: 'rua-pers-nome' }, el('input', { type: 'text', value: q.nome, maxlength: 20, oninput: e => salvarV(q, 'nome', e.target.value.trim()) }), el('small', {}, q.cargo || '')),
          peles,
          el('div', { class: 'rua-pers-sel' }, sel(OPC_CABELO, 'cabelo'), cor('corCabelo'), sel(OPC_ROUPA, 'estiloCamisa'), cor('corCamisa'),
            el('label', { class: 'iva-chk' }, el('input', { type: 'checkbox', checked: !!q.ap.oculos, onchange: e => salvarV(q, 'oculos', e.target.checked) }), 'Óculos')))));
      desenharMini(q);
    }
    return box;
  }

  // ------------------------------------------------------------------ desenho
  function predio(g, lote, t, ox = 0) {
    const c = lote.c, M = MODELOS[c.modelo] || MODELOS.escritorio, bx = ox + 8, bw = LOTE - 16, sel = false;
    // sombra e paredes
    r(g, bx + 3, Y_TOPO + 3, bw, Y_FRENTE - Y_TOPO + 6, 'rgba(0,0,0,0.2)');
    r(g, bx - 3, Y_TOPO, bw + 6, 4, '#3d4852'); r(g, bx - 3, Y_TOPO, bw + 6, 1, '#5b6a76');
    r(g, bx, Y_TOPO + 4, bw, Y_CHAO - Y_TOPO - 4, M.parede); r(g, bx, Y_CHAO - 3, bw, 3, tom(M.parede, 0.8));
    // piso xadrez
    for (let y = Y_CHAO; y < Y_FRENTE; y += 8) for (let x = bx; x < bx + bw; x += 8) r(g, x, y, Math.min(8, bx + bw - x), Math.min(8, Y_FRENTE - y), ((x - bx) / 8 + (y - Y_CHAO) / 8) % 2 ? M.piso[1] : M.piso[0]);
    r(g, bx, Y_CHAO, bw, 2, 'rgba(0,0,0,0.08)');
    r(g, bx - 3, Y_TOPO, 3, Y_FRENTE - Y_TOPO + 6, '#3d4852'); r(g, bx + bw, Y_TOPO, 3, Y_FRENTE - Y_TOPO + 6, '#3d4852');
    // placa com o nome (e o ícone da atividade)
    const nome = c.nomeCurto.toUpperCase(), w = Math.min(bw - 6, larg(nome) + 22), px = bx + ((bw - w) >> 1);
    r(g, px, Y_PLACA, w, 15, CONTORNO); r(g, px + 1, Y_PLACA + 1, w - 2, 13, M.placa); r(g, px + 1, Y_PLACA + 12, w - 2, 2, tom(M.placa, 0.75));
    r(g, px + 4, Y_PLACA + 15, 1, Y_TOPO - Y_PLACA - 15, '#495057'); r(g, px + w - 5, Y_PLACA + 15, 1, Y_TOPO - Y_PLACA - 15, '#495057');
    icone(g, c.modelo, px + 4, Y_PLACA + 3);
    g.save(); g.beginPath(); g.rect(px + 15, Y_PLACA + 1, w - 17, 13); g.clip(); tx(g, nome, px + 16, Y_PLACA + 5, '#ffffff'); g.restore();
    interior(g, c.modelo, bx, M, t);
    // pessoas (ordenadas pela profundidade)
    const ps = lote.pessoas.slice().sort((a, b) => a.pos[1] - b.pos[1]);
    for (const q of ps) desenharGente(g, q, bx, t, lote);
    // frente: parede baixa com porta e vitrine
    const portaX = bx + 66;
    r(g, bx - 3, Y_FRENTE, portaX - bx + 3, 6, '#3d4852'); r(g, portaX + 22, Y_FRENTE, bx + bw + 3 - portaX - 22, 6, '#3d4852');
    r(g, bx - 3, Y_FRENTE, bw + 6, 1, '#5b6a76');
    r(g, portaX, Y_FRENTE + 4, 22, 2, '#adb5bd'); r(g, portaX - 1, Y_FRENTE, 1, 6, '#5c4632'); r(g, portaX + 22, Y_FRENTE, 1, 6, '#5c4632');
    r(g, portaX + 4, Y_FRENTE + 6, 14, 2, M.borda); // capacho
    if (sel) { g.fillStyle = `rgba(40,190,82,${0.35 + 0.25 * Math.sin(t * 5)})`; g.fillRect(bx - 4, Y_TOPO - 1, bw + 8, 2); g.fillRect(bx - 4, Y_FRENTE + 6, bw + 8, 2); g.fillRect(bx - 4, Y_TOPO, 2, Y_FRENTE - Y_TOPO + 6); g.fillRect(bx + bw + 2, Y_TOPO, 2, Y_FRENTE - Y_TOPO + 6); }
    // alerta fiscal na placa (guia vencida)
    const R = resumoCliente(c);
    if (R.fiscal && R.fiscal.qVencido) { const k = Math.floor(t * 2) % 2; r(g, px + w - 8, Y_PLACA - 3, 9, 9, CONTORNO); r(g, px + w - 7, Y_PLACA - 2, 7, 7, k ? '#ff6b6b' : '#e03131'); tx(g, '!', px + w - 5, Y_PLACA - 1, '#ffffff'); }
  }
  function icone(g, m, x, y) {
    if (m === 'odonto') { r(g, x + 1, y, 6, 4, '#ffffff'); r(g, x, y + 1, 8, 3, '#ffffff'); r(g, x + 1, y + 4, 2, 4, '#ffffff'); r(g, x + 5, y + 4, 2, 4, '#ffffff'); r(g, x + 3, y + 1, 2, 1, '#c5f6fa'); }
    else if (m === 'nutricao') { r(g, x + 1, y + 2, 7, 6, '#ff6b6b'); r(g, x + 2, y + 1, 5, 1, '#ff6b6b'); r(g, x + 4, y - 1, 1, 3, '#5c3d2e'); r(g, x + 5, y - 1, 3, 2, '#51cf66'); r(g, x + 2, y + 3, 1, 2, '#ffc9c9'); }
    else if (m === 'estetica') { r(g, x + 3, y, 2, 7, '#fcc2d7'); r(g, x, y + 3, 8, 2, '#fcc2d7'); r(g, x + 1, y + 1, 2, 2, '#ffffff'); r(g, x + 5, y + 1, 2, 2, '#ffffff'); r(g, x + 1, y + 5, 2, 2, '#ffffff'); r(g, x + 5, y + 5, 2, 2, '#ffffff'); r(g, x + 3, y + 3, 2, 2, '#ffd43b'); }
    else if (m === 'clinica') { r(g, x + 3, y, 3, 9, '#ffffff'); r(g, x, y + 3, 9, 3, '#ffffff'); }
    else if (m === 'restaurante') { r(g, x + 1, y, 1, 9, '#ffffff'); r(g, x, y, 1, 3, '#ffffff'); r(g, x + 2, y, 1, 3, '#ffffff'); r(g, x + 5, y, 3, 4, '#ffffff'); r(g, x + 6, y + 4, 1, 5, '#ffffff'); }
    else if (m === 'loja') { r(g, x + 1, y + 3, 7, 6, '#ffffff'); r(g, x + 3, y, 3, 1, '#ffffff'); r(g, x + 2, y + 1, 1, 2, '#ffffff'); r(g, x + 6, y + 1, 1, 2, '#ffffff'); }
    else if (m === 'academia') { r(g, x, y + 2, 2, 5, '#ffffff'); r(g, x + 7, y + 2, 2, 5, '#ffffff'); r(g, x + 2, y + 4, 5, 1, '#ffffff'); }
    else { r(g, x + 1, y + 1, 7, 8, '#ffffff'); for (let k = 0; k < 3; k++) r(g, x + 2 + (k % 2) * 3, y + 2 + (k >> 1) * 3, 2, 2, '#364fc7'); }
  }
  const sombra = (g, x, y, w, d) => { g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(x + 1, y + d - 1, w, 3); };
  const caixa = (g, x, y, w, d, h, c) => { sombra(g, x, y, w, d); KM.caixa(g, x, y, w, d, h, c); };
  function balcao(g, bx, cor) { caixa(g, bx + 14, 104, 34, 9, 11, cor); r(g, bx + 18, 93, 9, 6, '#2b3135'); r(g, bx + 19, 94, 7, 4, '#4dabf7'); }
  function planta(g, x, y) { r(g, x, y, 8, 7, '#b5532f'); r(g, x + 1, y + 1, 6, 5, '#c9653f'); for (const [dx, dy] of [[-3, -8], [3, -10], [-1, -12], [5, -6], [-4, -4]]) r(g, x + 2 + dx, y + dy, 5, 4, '#2f9e44'); r(g, x + 3, y - 9, 2, 2, '#51cf66'); }
  function interior(g, m, bx, M, t) {
    if (m === 'odonto') {
      // armário com pia na parede, letreiro do dente, luminária e cadeira odontológica
      caixa(g, bx + 30, 46, 46, 8, 12, '#f1f3f5'); r(g, bx + 40, 34, 10, 3, '#adb5bd'); r(g, bx + 44, 36, 2, 4, '#adb5bd'); r(g, bx + 38, 41, 14, 3, '#74c0fc');
      for (let k = 0; k < 3; k++) r(g, bx + 33 + k * 15, 50, 12, 1, '#ced4da');
      r(g, bx + 94, 26, 26, 14, '#ffffff'); r(g, bx + 95, 27, 24, 12, '#e3fafc'); icone(g, 'odonto', bx + 103, 29); // quadro
      // cadeira: base, assento reclinado, encosto de cabeça, braço da luminária e bandeja
      r(g, bx + 74, 92, 30, 4, 'rgba(0,0,0,0.15)'); r(g, bx + 86, 84, 6, 9, '#868e96');
      r(g, bx + 70, 80, 38, 6, CONTORNO); r(g, bx + 71, 81, 36, 4, '#3bc9db'); r(g, bx + 64, 76, 10, 5, CONTORNO); r(g, bx + 65, 77, 8, 3, '#3bc9db');
      r(g, bx + 112, 52, 2, 26, '#495057'); r(g, bx + 94, 52, 20, 2, '#495057'); r(g, bx + 88, 52, 8, 5, CONTORNO); r(g, bx + 89, 53, 6, 3, Math.floor(t * 1.5) % 2 ? '#fff9db' : '#fff3bf');
      g.fillStyle = 'rgba(255,249,219,0.22)'; g.fillRect(bx + 80, 57, 24, 22);
      caixa(g, bx + 116, 76, 14, 7, 9, '#dee2e6'); r(g, bx + 118, 66, 10, 1, '#adb5bd'); r(g, bx + 119, 65, 1, 1, '#495057'); r(g, bx + 123, 65, 3, 1, '#495057');
      balcao(g, bx, '#e3fafc');
      for (const x of [bx + 120, bx + 134]) caixa(g, x, 108, 10, 6, 6, '#3bc9db'); // cadeiras de espera
      planta(g, bx + 142, 52);
    } else if (m === 'nutricao') {
      r(g, bx + 26, 26, 30, 14, '#ffffff'); r(g, bx + 27, 27, 28, 12, '#fff9db'); // prato saudável
      r(g, bx + 33, 29, 16, 8, '#f1f3f5'); r(g, bx + 34, 30, 7, 3, '#51cf66'); r(g, bx + 41, 30, 6, 3, '#ffa94d'); r(g, bx + 34, 33, 6, 3, '#ff8787'); r(g, bx + 40, 33, 7, 3, '#fab005');
      r(g, bx + 110, 26, 22, 14, '#ffffff'); tx(g, 'IMC', bx + 115, 30, VERDE_ESC); r(g, bx + 113, 36, 16, 2, '#fab005'); r(g, bx + 113, 36, 9, 2, '#51cf66');
      caixa(g, bx + 74, 72, 44, 14, 10, '#e9d8a6'); r(g, bx + 80, 58, 12, 7, '#2b3135'); r(g, bx + 81, 59, 10, 5, '#d3f9d8');
      r(g, bx + 98, 59, 10, 4, '#ffffff'); r(g, bx + 99, 57, 3, 3, '#ff6b6b'); r(g, bx + 102, 56, 3, 3, '#ffd43b'); r(g, bx + 105, 57, 3, 3, '#51cf66'); // fruteira
      caixa(g, bx + 30, 74, 14, 10, 2, '#dee2e6'); r(g, bx + 35, 56, 4, 18, '#adb5bd'); r(g, bx + 33, 54, 8, 4, '#495057'); r(g, bx + 34, 55, 6, 2, '#51cf66'); // balança
      balcao(g, bx, '#d3f9d8'); planta(g, bx + 140, 52); planta(g, bx + 52, 104);
    } else if (m === 'estetica') {
      r(g, bx + 30, 25, 18, 16, '#dee2e6'); r(g, bx + 31, 26, 16, 14, '#e7f5ff'); r(g, bx + 33, 27, 4, 8, '#ffffff'); // espelho
      caixa(g, bx + 28, 48, 24, 7, 8, '#ffffff'); for (let k = 0; k < 5; k++) r(g, bx + 30 + k * 4, 42, 2, 4, ['#f06595', '#cc5de8', '#ffffff', '#fcc2d7', '#be4bdb'][k]);
      caixa(g, bx + 120, 44, 22, 8, 22, '#f8f0fc'); for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) r(g, bx + 122 + j * 5, 24 + k * 7, 3, 4, ['#f783ac', '#e599f7', '#ffffff', '#faa2c1'][(k + j) % 4]);
      // maca com toalha
      r(g, bx + 84, 92, 44, 3, 'rgba(0,0,0,0.15)'); r(g, bx + 88, 84, 2, 9, '#868e96'); r(g, bx + 122, 84, 2, 9, '#868e96');
      r(g, bx + 82, 78, 46, 7, CONTORNO); r(g, bx + 83, 79, 44, 5, '#ffffff'); r(g, bx + 96, 79, 30, 5, '#fcc2d7');
      for (let i = 0; i < 3; i++) { const f = (t * 0.6 + i / 3) % 1; g.fillStyle = `rgba(255,255,255,${0.7 * (1 - f)})`; g.fillRect(bx + 60 + i * 3, 64 - f * 10, 1, 2); } // vela aromática
      caixa(g, bx + 58, 70, 8, 5, 4, '#f3d9fa'); r(g, bx + 61, 63, 2, 3, '#ffd43b');
      balcao(g, bx, '#ffdeeb'); planta(g, bx + 142, 96); planta(g, bx + 56, 104);
    } else if (m === 'clinica') {
      r(g, bx + 96, 26, 22, 14, '#ffffff'); icone(g, 'clinica', bx + 103, 29);
      caixa(g, bx + 70, 82, 40, 8, 6, '#e7f5ff'); r(g, bx + 70, 76, 10, 4, '#ffffff');
      caixa(g, bx + 118, 46, 20, 8, 18, '#dee2e6'); balcao(g, bx, '#e7f5ff'); planta(g, bx + 142, 96);
    } else if (m === 'restaurante') {
      caixa(g, bx + 30, 46, 70, 8, 12, '#5c3d2e'); for (let k = 0; k < 4; k++) r(g, bx + 36 + k * 16, 34, 10, 6, ['#ffd43b', '#ff8787', '#69db7c', '#ffa94d'][k]);
      for (const [x, y] of [[96, 92], [126, 76]]) { caixa(g, bx + x, y, 22, 12, 8, '#e9d8a6'); r(g, bx + x + 4, y - 9, 5, 3, '#ffffff'); r(g, bx + x + 13, y - 9, 5, 3, '#ffffff'); }
      balcao(g, bx, '#ffe8cc'); planta(g, bx + 142, 52);
    } else if (m === 'loja') {
      for (let k = 0; k < 3; k++) { caixa(g, bx + 70 + k * 26, 46, 22, 8, 18, '#f1f3f5'); for (let j = 0; j < 3; j++) r(g, bx + 72 + k * 26 + j * 7, 30, 5, 10, ['#7048e8', '#f06595', '#ffd43b', '#20c997'][(k + j) % 4]); }
      caixa(g, bx + 100, 82, 30, 12, 8, '#e5dbff'); balcao(g, bx, '#e5dbff'); planta(g, bx + 142, 96);
    } else if (m === 'academia') {
      for (let k = 0; k < 2; k++) { caixa(g, bx + 90 + k * 28, 70, 22, 10, 6, '#212529'); r(g, bx + 92 + k * 28, 60, 18, 2, '#868e96'); }
      caixa(g, bx + 30, 46, 50, 6, 10, '#495057'); for (let k = 0; k < 6; k++) r(g, bx + 33 + k * 8, 40, 5, 5, '#868e96');
      r(g, bx + 30, 26, 40, 14, '#adb5bd'); r(g, bx + 31, 27, 38, 12, '#dee2e6'); // espelho
    } else {
      r(g, bx + 30, 28, 22, 12, '#ffffff'); r(g, bx + 31, 29, 20, 10, '#d0ebff');
      caixa(g, bx + 74, 72, 44, 14, 10, '#9c5b3a'); r(g, bx + 84, 58, 12, 7, '#2b3135'); r(g, bx + 85, 59, 10, 5, '#4dabf7');
      caixa(g, bx + 124, 46, 14, 10, 22, '#868e96'); balcao(g, bx, '#dbe4ff'); planta(g, bx + 142, 96);
    }
  }
  function desenharGente(g, q, bx, t, lote) {
    const [px, py, pose, dir] = q.pos, x = bx + px, y = py;
    const fase = hashId(q.nome || q.papel) % 7;
    if (pose === 'deitado') { // paciente/cliente deitado na cadeira ou maca (cabeça à esquerda)
      const ap = q.ap;
      r(g, x - 16, y - 7, 30, 6, CONTORNO); r(g, x - 15, y - 6, 28, 4, ap.corCamisa); r(g, x + 4, y - 6, 9, 4, ap.calca);
      r(g, x - 23, y - 9, 8, 8, CONTORNO); r(g, x - 22, y - 8, 6, 6, ap.pele); r(g, x - 22, y - 8, 6, 2, ap.corCabelo);
      if (Math.floor(t * 0.8 + fase) % 5 === 0) r(g, x - 20, y - 5, 2, 1, CONTORNO); else { r(g, x - 21, y - 5, 1, 1, CONTORNO); r(g, x - 18, y - 5, 1, 1, CONTORNO); }
      return;
    }
    let est = { vista: pose === 'costas' ? 'costas' : 'frente' };
    if (pose === 'sentado' || pose === 'costas') est.pose = 'sentado';
    if (pose === 'balcao') est = { vista: 'frente', bracos: 'frente' };
    const k = Math.floor(t * 1.2 + fase);
    if (q.papel === 'dono' && q.aceno && performance.now() < q.aceno) est = { ...est, bracos: 'aceno', aceno: Math.floor(t * 5) % 2, boca: 'sorriso' };
    else if (pose === 'pe' && k % 6 === 0) est.piscar = true;
    if (pose === 'balcao') { pessoa(g, q.ap, est, x, y - 6, dir); balcao(g, bx, (MODELOS[lote.c.modelo] || MODELOS.escritorio).fachada); } // atrás do balcão
    else pessoa(g, q.ap, est, x, y, dir);
    if (q.papel === 'dono' && cena.sel === lote && q.fala && performance.now() < q.falaAte) balao(g, q.fala, x, y - (est.pose === 'sentado' ? 38 : 46));
  }
  // prédio pequeno visto da cidade (48 x 40): telhado, fachada com toldo, porta, janelas e letreiro com o ícone
  function predioMini(g, l, t, hq) {
    const x = l.x + 8, y = l.y, w = LW - 16, M = hq ? { fachada: '#f1fbf4', placa: VERDE_ESC, borda: VERDE } : (MODELOS[l.c.modelo] || MODELOS.escritorio);
    const sel = !hq && cena.sel === l;
    r(g, x + 3, y + 4, w, 38, 'rgba(0,0,0,0.22)');
    // telhado (visto de cima) e fachada
    r(g, x - 1, y, w + 2, 12, CONTORNO); r(g, x, y + 1, w, 10, tom(M.placa, 0.85)); r(g, x, y + 1, w, 2, tom(M.placa, 1.2));
    for (let k = x + 4; k < x + w - 2; k += 8) r(g, k, y + 4, 4, 4, tom(M.placa, 0.7));
    r(g, x - 1, y + 11, w + 2, 30, CONTORNO); r(g, x, y + 12, w, 28, M.fachada); r(g, x, y + 12, w, 1, '#ffffff');
    if (hq) { KM.simboloPixel(g, x + 4, y + 2, 0.66, '#ffffff', VERDE); tx(g, 'KWIK', x + 16, y + 4, '#ffffff'); }
    // toldo listrado
    for (let k = 0; k < w; k += 4) r(g, x + k, y + 13, 4, 4, (k / 4) % 2 ? '#ffffff' : M.borda);
    // janelas e porta
    const jan = c => { r(g, x + 4, y + 21, 10, 8, CONTORNO); r(g, x + 5, y + 22, 8, 6, c); r(g, x + w - 14, y + 21, 10, 8, CONTORNO); r(g, x + w - 13, y + 22, 8, 6, c); };
    jan(hq ? '#a5d8ff' : '#d0ebff');
    r(g, x + w / 2 - 5, y + 25, 10, 15, CONTORNO); r(g, x + w / 2 - 4, y + 26, 8, 14, hq ? VERDE_ESC : tom(M.placa, 0.9)); r(g, x + w / 2 + 2, y + 33, 1, 2, '#ffd43b');
    // letreiro com ícone
    r(g, x + w / 2 - 7, y + 17, 14, 11, CONTORNO); r(g, x + w / 2 - 6, y + 18, 12, 9, hq ? VERDE : M.placa);
    if (!hq) icone(g, l.c.modelo, x + w / 2 - 4, y + 18);
    // calçada e nome
    r(g, l.x, y + 40, LW, 6, '#cdbfa9'); r(g, l.x, y + 45, LW, 1, '#b8a990');
    const nome = (hq ? 'KWIK' : l.c.nomeCurto).toUpperCase().slice(0, 15), lw = larg(nome);
    r(g, l.x + LW / 2 - lw / 2 - 2, y + 40, lw + 4, 7, sel ? VERDE : 'rgba(17,26,25,0.85)'); tx(g, nome, l.x + LW / 2 - lw / 2, y + 41, sel ? '#111A19' : '#ffffff');
    if (sel) { g.fillStyle = `rgba(40,190,82,${0.35 + 0.3 * Math.sin(t * 5)})`; g.fillRect(x - 3, y - 2, w + 6, 2); g.fillRect(x - 3, y - 2, 2, 42); g.fillRect(x + w + 1, y - 2, 2, 42); }
    if (!hq) { const R = resumoCliente(l.c); if (R.fiscal && R.fiscal.qVencido) { const k = Math.floor(t * 2) % 2; r(g, x + w - 6, y - 4, 9, 9, CONTORNO); r(g, x + w - 5, y - 3, 7, 7, k ? '#ff6b6b' : '#e03131'); tx(g, '!', x + w - 3, y - 2, '#ffffff'); } }
  }
  function kauaMini(g, k, t) {
    const ap = KM.aparenciaDe(A().cfg(), 'f1'), x = Math.round(k.x), y = Math.round(k.y), p = k.andando ? Math.floor(t * 8) % 2 : 0;
    r(g, x - 3, y - 1, 7, 2, 'rgba(0,0,0,0.25)');
    r(g, x - 2, y - 4, 2, 3 + p, ap.calca); r(g, x + 1, y - 4, 2, 4 - p, ap.calca);
    r(g, x - 3, y - 9, 7, 6, CONTORNO); r(g, x - 2, y - 8, 5, 5, ap.corCamisa);
    r(g, x - 3, y - 14, 7, 6, CONTORNO); r(g, x - 2, y - 13, 5, 4, ap.pele); r(g, x - 2, y - 13, 5, 2, ap.corCabelo);
    if (k.aceno && Math.floor(t * 5) % 2) r(g, x + 3, y - 13, 2, 3, ap.pele);
  }
  function desenharCidade(g, t) {
    const per = KM.periodo(A().cfg()), W = cena.W, H = cena.H;
    r(g, 0, 0, W, H, per === 'noite' ? '#355a2b' : '#5c9a45');
    for (let i = 0; i < W * H / 90; i++) { const x = (i * 37) % W, y = (i * 53 + (i >> 3)) % H; r(g, x, y, 1, 1, i % 3 ? '#68a84f' : '#528c3e'); }
    // avenida (esquerda) e ruas na frente de cada fileira
    r(g, AV - 11, 0, 22, H, '#4a4f56'); for (let y = 2; y < H; y += 14) r(g, AV - 1, y, 2, 7, '#e9e4d8');
    const linhas = Math.ceil((cena.lotes.length + 1) / cena.cols);
    for (let i = 0; i < linhas; i++) {
      const ry = MY + i * RH + 46;
      r(g, AV - 11, ry, W - AV + 11, 16, '#4a4f56'); for (let x = AV + 14; x < W; x += 16) r(g, x, ry + 7, 8, 2, '#e9e4d8');
      r(g, AV + 11, ry - 1, W, 1, '#8a8f94'); r(g, AV + 11, ry + 16, W, 1, '#8a8f94');
    }
    r(g, AV + 13, 2, 34, 9, CONTORNO); r(g, AV + 14, 3, 32, 7, VERDE_ESC); tx(g, 'AV KWIK', AV + 16, 4, '#ffffff');
    // árvores no gramado entre os prédios
    for (let i = 0; i < linhas; i++) for (let c = 0; c < cena.cols; c++) {
      const x = MX + c * LW + LW - 4, y = MY + i * RH + 30;
      r(g, x - 1, y + 6, 2, 4, '#6b4a2a'); r(g, x - 4, y - 2, 8, 8, '#2f7a3d'); r(g, x - 3, y - 1, 3, 3, '#4a9e4f');
    }
    // lotes vagos: espaço para os próximos clientes
    for (let k = cena.lotes.length + 1; k < linhas * cena.cols; k++) {
      const x = MX + (k % cena.cols) * LW + 10, y = MY + Math.floor(k / cena.cols) * RH + 12;
      for (let u = 0; u < 44; u += 4) { r(g, x + u, y, 2, 1, '#e9e4d8'); r(g, x + u, y + 27, 2, 1, '#e9e4d8'); }
      for (let v = 0; v < 28; v += 4) { r(g, x, y + v, 1, 2, '#e9e4d8'); r(g, x + 43, y + v, 1, 2, '#e9e4d8'); }
      r(g, x + 20, y + 14, 2, 12, '#6b4a2a'); r(g, x + 8, y + 6, 28, 10, CONTORNO); r(g, x + 9, y + 7, 26, 8, '#fff3bf'); tx(g, 'VAGO', x + 14, y + 9, '#9c5700');
    }
    predioMini(g, cena.hq, t, true);
    for (const l of cena.lotes) predioMini(g, l, t);
    if (cena.kaua && cena.kaua.vis) kauaMini(g, cena.kaua, t);
    carroKwik(g, cena.carro.x, cena.carro.y, cena.carro.dir, t, cena.andando);
    if (per === 'noite') { g.fillStyle = 'rgba(16,24,60,0.26)'; g.fillRect(0, 0, W, H); }
  }
  // por dentro do prédio visitado (com o Kauã lá dentro)
  function desenharDentro(t) {
    const cv = $('#ruaDentroTela'); if (!cv || !cena.dentro) return;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    r(g, 0, 0, cv.width, cv.height, '#5c9a45');
    predio(g, cena.dentro, t, 0);
    if (cena.kaua && !cena.kaua.vis) pessoa(g, KM.aparenciaDe(A().cfg(), 'f1'), { vista: 'frente', ...(cena.kaua.aceno ? { bracos: 'aceno', aceno: Math.floor(t * 5) % 2, boca: 'sorriso' } : {}) }, 8 + 77, Y_FRENTE - 4, false);
  }
  function quadro(agora) {
    const d = $('#dlgRua'); if (!d || !d.open) { cena.raf = 0; return; }
    const g = $('#ruaTela').getContext('2d'); g.imageSmoothingEnabled = false;
    desenharCidade(g, agora / 1000);
    desenharDentro(agora / 1000);
    cena.raf = requestAnimationFrame(quadro);
  }
  // animações da cidade (independentes do escritório)
  const passo = fn => new Promise(res => { let ant = performance.now(); const f = agora => { const dt = Math.min(0.05, (agora - ant) / 1000); ant = agora; if (fn(dt)) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
  async function reta(id, x, y, vel = 150) {
    const c = cena.carro;
    await passo(dt => { if (id !== cena.cancelar) return true; const dx = x - c.x, dy = y - c.y, dist = Math.hypot(dx, dy); if (dist < 1) { c.x = x; c.y = y; return true; } if (Math.abs(dx) > 0.5) c.dir = Math.sign(dx); const s = Math.min(dist, vel * dt); c.x += dx / dist * s; c.y += dy / dist * s; return false; });
  }
  async function dirigir(id, l) { // pela rua da fileira; se for outra fileira, passa pela avenida
    const alvoX = l.porta - 14, alvoY = l.rua - 7, c = cena.carro;
    cena.andando = true;
    if (Math.abs(c.y - alvoY) > 1) { await reta(id, AV - 14, c.y); await reta(id, AV - 14, alvoY); }
    await reta(id, alvoX, alvoY);
    cena.andando = false;
    rolarPara(c.x + 14, c.y);
  }
  async function andarK(id, x, y) {
    const k = cena.kaua; k.andando = true;
    await passo(dt => { if (id !== cena.cancelar) return true; const dx = x - k.x, dy = y - k.y, dist = Math.hypot(dx, dy); if (dist < 1) { k.x = x; k.y = y; return true; } const s = Math.min(dist, 45 * dt); k.x += dx / dist * s; k.y += dy / dist * s; return false; });
    k.andando = false;
  }
  function rolarPara(x, y) {
    const box = $('#ruaCena'), cv = $('#ruaTela'); if (!box || !cv.clientWidth) return;
    const py = y / cena.H * cv.clientHeight;
    if (py < box.scrollTop + 30 || py > box.scrollTop + box.clientHeight - 30) box.scrollTo({ top: Math.max(0, py - box.clientHeight / 2), behavior: 'smooth' });
  }
  async function irAoCliente(i) {
    const lote = cena.lotes[i]; if (!lote) return;
    const id = ++cena.cancelar;
    KM.tocar('clique');
    if (cena.sel === lote && cena.dentro === lote) return renderInfo(lote.c);
    // se o Kauã estava num cliente, sai e volta para o carro
    if (cena.kaua) {
      const k = cena.kaua; k.vis = true; k.aceno = false; cena.dentro = null;
      await andarK(id, k.x, cena.carro.y + 6);
      if (id !== cena.cancelar) return;
    }
    cena.kaua = null; cena.sel = lote; cena.dentro = null;
    renderInfo(lote.c, true);
    KM.tocar('moto');
    await dirigir(id, lote);
    if (id !== cena.cancelar) return;
    cena.kaua = { x: lote.porta, y: lote.rua - 2, vis: true };
    await andarK(id, lote.porta, lote.y + 40);
    if (id !== cena.cancelar) return;
    KM.tocar('campainha');
    cena.kaua.vis = false; cena.dentro = lote;
    const dono = lote.pessoas.find(q => q.papel === 'dono');
    const eu = KM.nomeDe ? KM.nomeDe('noticias') : 'Kauã';
    if (dono) { dono.aceno = performance.now() + 2600; dono.fala = `OI, ${eu}!`; dono.falaAte = performance.now() + 3200; }
    cena.kaua.aceno = true;
    renderInfo(lote.c);
    setTimeout(() => { if (cena.kaua) cena.kaua.aceno = false; }, 1800);
  }
  // ------------------------------------------------------------------ cartão do cliente
  function resumoCliente(c) {
    const out = {};
    const fis = S().dados('fiscal'), fol = S().dados('folha');
    if (fis && c.fiscalId) out.fiscal = S().resumoFiscal(fis.db).porEmp.find(x => x.e.id === c.fiscalId);
    if (fol && c.folhaId) out.folha = S().resumoFolha(fol.db).porEmp.find(x => x.e.id === c.folhaId);
    return out;
  }
  function renderResumoRua(box = $('#ruaInfo'), aoEscolher) {
    const { el } = A(); box.innerHTML = '';
    const g = el('div', { class: 'rua-grade' });
    for (const [i, l] of cena.lotes.entries()) {
      const c = l.c, M = MODELOS[c.modelo], R = resumoCliente(c), cert = c.info.cert;
      g.append(el('button', { class: 'rua-cli', onclick: () => (aoEscolher ? aoEscolher(i) : irAoCliente(i)) }, el('span', { class: 'ic' }, M.ic), el('span', {}, el('b', {}, c.nome), el('small', {},
        [M.nome, R.fiscal ? (R.fiscal.qVencido ? `🔴 ${R.fiscal.qVencido} guia(s) vencida(s)` : '🟢 impostos em dia') : null, R.folha ? `👥 ${R.folha.ativos}` : null, cert ? `📜 até ${fmtD(cert.validade)}` : null].filter(Boolean).join(' · ')))));
    }
    box.append(g);
  }
  function diasAte(s) { return Math.round((new Date(s + 'T12:00:00') - new Date(new Date().toDateString())) / 86400000); }
  function renderInfo(c, indo, box = $('#ruaInfo')) {
    const { el } = A(); box.innerHTML = '';
    const M = MODELOS[c.modelo] || MODELOS.escritorio, R = resumoCliente(c), cert = c.info.cert;
    const lote = cena.lotes.find(l => l.c.chave === c.chave);
    const sel = el('select', { onchange: e => {
      infos()[c.chave] = { ...(infos()[c.chave] || {}), modelo: e.target.value }; A().salvar();
      const estavaDentro = cena.dentro && cena.dentro.c.chave === c.chave;
      montarCena(true); const nl = cena.lotes.find(l => l.c.chave === c.chave);
      cena.sel = nl || null; if (estavaDentro) cena.dentro = nl; renderInfo(nl.c, false, box);
      if (KM.cidade3d && KM.cidade3d.aberta()) KM.cidade3d.atualizar();
    } }, Object.entries(MODELOS).map(([k, m]) => el('option', { value: k, selected: k === c.modelo }, `${m.ic} ${m.nome}`)));
    box.append(el('div', { class: 'rua-cab' }, el('div', {}, el('h3', {}, `${M.ic} ${c.nome}`), el('small', {}, [c.razao && c.razao !== c.nome ? c.razao : null, c.cnpj ? 'CNPJ ' + c.cnpj : null, c.regime].filter(Boolean).join(' · '))),
      el('label', { class: 'rua-modelo' }, 'Prédio: ', sel)));
    // por dentro do prédio
    box.append(el('div', { class: 'rua-dentro' }, indo ? el('div', { class: 'rua-indo' }, `🚗 Indo até ${c.nome}…`) : el('canvas', { id: 'ruaDentroTela', width: LOTE, height: H_DENTRO })));
    const linhas = el('div', { class: 'rua-blocos' });
    // certificado
    let txtCert, clsCert = '';
    if (cert && cert.validade) { const d = diasAte(cert.validade); txtCert = `Certificado digital A1 válido até ${fmtD(cert.validade)} (${d >= 0 ? 'faltam ' + d + ' dias' : 'VENCIDO'})${cert.titular ? ' · titular ' + cert.titular : ''}`; clsCert = d < 0 ? 'mal' : d <= 30 ? 'atencao' : 'bem'; }
    else txtCert = 'Validade do certificado ainda não lida. Toque em 📜 Certificados (lá em cima) e escolha o .pfx desta empresa.';
    linhas.append(el('div', { class: 'rua-bloco ' + clsCert }, el('b', {}, '📜 Certificado'), el('p', {}, txtCert)));
    // fiscal
    if (R.fiscal) {
      const f = R.fiscal, abertos = f.abertos.slice(0, 4);
      linhas.append(el('div', { class: 'rua-bloco ' + (f.qVencido ? 'mal' : 'bem') }, el('b', {}, '🧾 Fiscal'),
        el('p', {}, `Vencido ${brl(f.vencido)} · a vencer ${brl(f.aVencer)} · pago ${brl(f.pago)}`),
        abertos.length ? el('ul', {}, abertos.map(l => el('li', {}, `${l.tributo} ${l.competencia ? l.competencia.slice(5) + '/' + l.competencia.slice(0, 4) : ''} · ${brl(l.total)} · ${l.status === 'Vencido' ? '🔴 vencido ' + fmtD(l.vencimento) : l.status === 'A vencer' ? 'vence ' + fmtD(l.vencimento) : l.status}`))) : el('p', {}, '✅ Nada em aberto.'),
        el('button', { class: 'bt peq', onclick: () => S().abrir('fiscal', 'ver', c.fiscalId) }, 'Abrir no setor Fiscal')));
    } else linhas.append(el('div', { class: 'rua-bloco' }, el('b', {}, '🧾 Fiscal'), el('p', {}, c.soCadastro ? 'Empresa ainda não cadastrada no KWIK Fiscal.' : 'Dados do KWIK Fiscal não carregados.'), el('button', { class: 'bt peq', onclick: () => S().abrir('fiscal', c.fiscalId ? 'ver' : 'add') }, 'Abrir o setor Fiscal')));
    // folha
    if (R.folha) {
      const f = R.folha;
      linhas.append(el('div', { class: 'rua-bloco ' + (f.feitas === f.total ? 'bem' : 'atencao') }, el('b', {}, '👥 Folha'),
        el('p', {}, `${f.ativos} pessoa(s): ${f.pessoas.map(p => p.nome.split(' ')[0] + ' (' + p.cargo + ')').join(', ') || '—'}`),
        el('p', {}, `Fechamento do mês anterior: ${f.feitas}/${f.total} etapas${f.feitas < f.total ? ' · falta: ' + f.etapas.filter(e => !(f.fech && f.fech.etapas && f.fech.etapas[e.k])).map(e => e.t).join(', ') : ' ✅'}`),
        f.alerta ? el('p', { class: 'se-alerta' }, '⚠️ ' + f.alerta) : null,
        el('button', { class: 'bt peq', onclick: () => S().abrir('folha', 'ver', c.folhaId) }, 'Abrir no setor de Folha')));
    } else linhas.append(el('div', { class: 'rua-bloco' }, el('b', {}, '👥 Folha'), el('p', {}, 'Sem cadastro no KWIK Folha.'), el('button', { class: 'bt peq', onclick: () => S().abrir('folha', 'add') }, 'Abrir o setor de Folha')));
    if (c.valor) linhas.append(el('div', { class: 'rua-bloco' }, el('b', {}, '💰 Honorário'), el('p', {}, `${brl(c.valor)} por mês`)));
    box.append(linhas);
    // portais
    box.append(el('div', { class: 'rua-portais' }, el('b', {}, '🔐 Entrar nos portais com o certificado desta empresa'),
      el('div', { class: 'rua-links' }, PORTAIS.map(([t, u]) => el('a', { class: 'bt peq', href: u, target: '_blank', rel: 'noopener' }, t)),
        c.cnpj ? el('button', { class: 'bt peq', onclick: () => navigator.clipboard.writeText(S().digitos(c.cnpj)).then(() => A().toast('📋 CNPJ copiado: ' + c.cnpj)).catch(() => A().toast(c.cnpj)) }, '📋 Copiar CNPJ') : null),
      el('small', {}, 'O login é feito por você, no próprio portal, escolhendo o certificado instalado neste computador (ou a procuração da KWIK). O Mini Escritório não guarda certificado nem senha e não entra nos portais sozinho.')));
    if (lote && !indo) box.append(blocoPersonalizar(c, lote));
  }

  // ------------------------------------------------------------------ leitura do certificado (.pfx) sem senha
  // Nos certificados A1 da ICP-Brasil, a parte pública (CNPJ, razão social, titular e validade) costuma ficar
  // aberta dentro do .pfx; só a chave privada é protegida pela senha. Lemos só a parte pública.
  function lerCertificado(buf) {
    const b = new Uint8Array(buf), achados = [];
    const lat = i => String.fromCharCode(b[i]);
    const tempos = [];
    for (let i = 0; i < b.length - 30; i++) {
      if (b[i] === 0x17 && b[i + 1] === 0x0d && b[i + 14] === 0x5a && b[i + 15] === 0x17 && b[i + 16] === 0x0d && b[i + 29] === 0x5a) {
        const t1 = Array.from({ length: 12 }, (_, k) => lat(i + 2 + k)).join(''), t2 = Array.from({ length: 12 }, (_, k) => lat(i + 17 + k)).join('');
        if (/^\d{12}$/.test(t1) && /^\d{12}$/.test(t2)) tempos.push({ i, de: t1, ate: t2 });
      }
    }
    const data = s => `20${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
    const ler = (i, n) => new TextDecoder(b[i - 2] === 0x0c ? 'utf-8' : 'latin1').decode(b.subarray(i, i + n));
    let titular = '';
    for (let i = 0; i < b.length - 12; i++) {
      // CN (2.5.4.3) = 06 03 55 04 03, seguido de texto
      if (b[i] === 0x06 && b[i + 1] === 0x03 && b[i + 2] === 0x55 && b[i + 3] === 0x04 && b[i + 4] === 0x03 && [0x0c, 0x13, 0x14].includes(b[i + 5])) {
        const n = b[i + 6]; if (n > 127) continue;
        const v = ler(i + 7, n), m = v.match(/^(.*):(\d{14})$/);
        if (m) { const t = tempos.filter(x => x.i < i).pop(); if (t) achados.push({ razao: m[1].trim(), cnpj: m[2], inicio: data(t.de), validade: data(t.ate) }); }
      }
      // nome do responsável (ICP-Brasil 2.16.76.1.3.2) = 06 05 60 4C 01 03 02
      if (!titular && b[i] === 0x06 && b[i + 1] === 0x05 && b[i + 2] === 0x60 && b[i + 3] === 0x4c && b[i + 4] === 0x01 && b[i + 5] === 0x03 && b[i + 6] === 0x02 && b[i + 7] === 0xa0) {
        let j = i + 9; if (b[i + 8] > 127) j += b[i + 8] - 128;
        if ([0x04, 0x0c, 0x13].includes(b[j])) { const n = b[j + 1]; if (n < 128) titular = new TextDecoder('latin1').decode(b.subarray(j + 2, j + 2 + n)).trim(); }
      }
    }
    if (!achados.length) return null;
    const c = achados[0];
    c.titular = titular.replace(/\b\w+/g, w => w.charAt(0) + w.slice(1).toLowerCase());
    return c;
  }
  async function lerCertificados(arqs) {
    if (!arqs.length) return;
    const cs = lista(), dig = S().digitos, msgs = [];
    for (const f of arqs) {
      try {
        const c = lerCertificado(await f.arrayBuffer());
        if (!c) { msgs.push(`❌ ${f.name}: a parte pública está protegida. Veja a validade no próprio certificado.`); continue; }
        let cli = cs.find(x => dig(x.cnpj) === c.cnpj);
        const chave = cli ? cli.chave : c.cnpj;
        infos()[chave] = { ...(infos()[chave] || {}), cert: { razao: c.razao, cnpj: c.cnpj, titular: c.titular, inicio: c.inicio, validade: c.validade, lidoEm: new Date().toISOString() } };
        const d = diasAte(c.validade);
        msgs.push(`📜 ${cli ? cli.nome : c.razao}: válido até ${fmtD(c.validade)} (${d >= 0 ? d + ' dias' : 'vencido'})${cli ? '' : ' · empresa ainda não está nos clientes ativos'}`);
      } catch (e) { msgs.push(`❌ ${f.name}: ${e.message}`); }
    }
    A().salvar(true);
    montarCena(true);
    if (cena.sel) { const ch = cena.sel.c.chave, dentro = cena.dentro; cena.sel = cena.lotes.find(l => l.c.chave === ch) || null; if (dentro) cena.dentro = cena.sel; }
    if (KM.cidade3d && KM.cidade3d.aberta()) KM.cidade3d.atualizar();
    else if (cena.sel) renderInfo(cena.sel.c); else renderResumoRua();
    A().toast(msgs.join('\n'), { ms: 12000 });
  }

  function iniciar() { posicionarBotao(); }
  KM.clientesFora = { iniciar, posicionarBotao, sair, voltar, abrir: abrirRua, lista, detectar, lerCertificado, lerCertificados, MODELOS, _ir: irAoCliente, _cena: cena,
    montarDlg: montar, montarCena, carregarDados, renderInfo, renderResumoRua, resumoCliente, desenharDentro };
})();
