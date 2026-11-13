/* KWIK Mini Escritório · a Clara pequenininha das Tarefas ganha vida.
   - Toque: ela reage (carinhosa no começo).
   - Segure e arraste: ela vai junto e, ao soltar, é jogada com a velocidade do dedo/mouse, cai com gravidade e bate nas
     bordas da tela (no celular, nas bordas do celular; no PC, nas bordas da janela).
   - Cada toque, arrastão, chacoalhada ou batida na parede aumenta a irritação: carinhosa → desconfiada → irritada →
     brava → BIRRA (vira de costas e não deixa encostar). A irritação baixa sozinha se você deixar ela quieta.
   - Na birra, o seu personagem (o Kauã do escritório) entra andando, pede desculpa e dá um beijo: ela volta ao normal. */
(function () {
  const KM = window.KM;
  const A = () => KM.app;
  const W = 45, H = 69, G = 1900; // tamanho na tela (sprite 30x46 × 1,5) e gravidade em px/s²
  const sorteia = l => l[Math.floor(Math.random() * l.length)];
  const dorme = ms => new Promise(r => setTimeout(r, ms));
  const som = n => { try { KM.tocar && KM.tocar(n); } catch (e) { /* sem som */ } };

  const FALAS = {
    toque: [
      ['Oi, amor! 😊', 'Que foi, bebê? 💕', 'Hihi, cócegas não! 🤭', 'Tá com saudade, é? 😏💚', 'Oi, meu bem! 🥰', 'Você fica fofo focado assim 🥰', 'Tô aqui, tá? 💚', 'Me chamou? 😊'],
      ['Hmm… tá carente hoje? 🤨', 'Amor, eu tô trabalhando 😅', 'De novo? 😒', 'Já entendi que você me ama, tá? 🙄', 'Tô te vendo, hein 👀', 'Que foi agora? 🤨'],
      ['Amor. Para. 😤', 'Tô falando sério, hein!', 'Vou contar até três… 😠', 'Você não tem tarefa pra fazer não? 🙄', '{NOME}!! 😤', 'Para de me cutucar! 😤'],
      ['Não fala comigo. 😑', 'Tá bom. Continua. Vai. 🙂', 'Nossa. Que legal. 🙃', 'Último aviso!! 💢', 'Vou ficar de mal, hein! 😡', 'Tô contando, viu? 😠'],
    ],
    arrasto: [
      ['Uiii! Me leva junto! 🤸‍♀️', 'Aonde a gente vai? 😄', 'Wiii! 😆', 'Tô voando! 🕊️'],
      ['Ei, me põe no chão! 😅', 'Devagar, devagar! 😬', 'Amor, cuidado! 😳'],
      ['ME SOLTA! 😣', 'Eu não sou brinquedo!! 😤', 'Me põe no chão AGORA! 😠'],
      ['ME. SOLTA. 😡', 'Você vai ver quando eu descer! 💢', 'AAAAAH! 😤'],
    ],
    bate: ['Ai! 😣', 'Isso doeu, sabia?! 😖', 'Minha cabeça! 😵', 'Aii, a parede! 😫', 'Ai ai ai! 🤕'],
    tonta: ['Tô ficando tonta! 😵‍💫', 'Para de me chacoalhar!! 😵', 'Vou enjoar! 🤢'],
    joga: ['AAAAH! 😱', 'Socorroooo! 😱', 'Você me JOGOU?! 😨'],
    birra: ['Hmpf. 😤', 'Não tô brava. 🙂', 'Tô ótima. Super. 🙃', 'Nem vem. 😒', 'Não quero conversa. 😑', 'Hmpf!'],
    recusa: ['Não encosta! 😤', 'Nem vem! 🙅‍♀️', 'Me deixa! 😒', 'Hmpf!'],
    calma: ['Tá… passou. Mas não abusa. 😌', 'Ok, tô mais calma. 😮‍💨', 'Hunf… tá perdoado. Por enquanto. 😏'],
  };
  const nivelDe = r => (r < 20 ? 0 : r < 45 ? 1 : r < 70 ? 2 : 3);

  let P = null;
  const dono = () => {
    const fs = A().cfg().funcionarios || [];
    return fs.find(x => x.id === 'f1') || fs.find(x => /ceo|fundador|dono/i.test(x.cargo || '')) || fs.find(x => x.funcao !== 'checklist') || fs[0];
  };
  const nomeDono = (cheio) => { const d = dono(); const n = (d && d.nome) || (A().cfg().marketing || {}).dono || 'amor'; return cheio ? n : n.split(' ')[0]; };
  const tela = () => { const v = window.visualViewport; return { w: v ? v.width : innerWidth, h: v ? v.height : innerHeight }; };
  const limites = () => { const t = tela(); return { x0: 0, x1: t.w - W, y0: 0, y1: t.h - H - 6 }; };

  function ligar(box) {
    if (P && P.box === box) return;
    desligar();
    P = { box, cv: box.querySelector('canvas'), raiva: 0, birra: false, cena: null, x: 0, y: 0, vx: 0, vy: 0, solta: false, pega: false, esp: false, feliz: 0, nivelAntes: 0, k: null, raf: 0, tl: 0 };
    box._est = estAtual; box._ms = 120;
    box.style.touchAction = 'none';
    box.addEventListener('pointerdown', apertou);
    box.addEventListener('contextmenu', e => e.preventDefault());
    P.decai = setInterval(decair, 1000);
    addEventListener('resize', aoMudarTela);
  }
  function desligar() {
    if (!P) return;
    cancelAnimationFrame(P.raf); clearInterval(P.decai); clearInterval(P.falasBirra); removeEventListener('resize', aoMudarTela);
    if (P.k) P.k.box.remove();
    P = null;
  }
  const vivo = () => P && P.box.isConnected;

  // ------------------------------------------------------------------ física
  function soltar() { // sai do canto (posição pelo CSS) e passa a ser controlada aqui
    if (P.solta) return;
    const r = P.cv.getBoundingClientRect();
    P.box.classList.remove('entra', 'canto'); P.box.classList.add('fisica');
    P.x = r.left; P.y = r.top; P.solta = true; aplicar();
  }
  function aplicar() {
    P.box.style.transform = `translate(${Math.round(P.x)}px, ${Math.round(P.y)}px)`;
    P.box.classList.toggle('no-ar', !noChao());
    posBalao(P.box, P.x);
  }
  const noChao = () => P.y >= limites().y1 - 0.5;
  function posBalao(box, x) {
    const b = box.querySelector('.clara-balao'); if (!b || !box.classList.contains('fisica') && !box.classList.contains('kaua-mini')) return;
    const bw = b.offsetWidth || 120, t = tela();
    const esq = Math.max(6, Math.min(t.w - 6 - bw, x + W / 2 - bw / 2));
    b.style.setProperty('--bl', Math.round(esq - x) + 'px');
    b.style.setProperty('--seta', Math.max(12, Math.min(bw - 12, x + W / 2 - esq)) + 'px');
  }
  function acordar() { if (P && !P.raf) { P.tl = 0; P.raf = requestAnimationFrame(quadro); } }
  function quadro(t) {
    if (!vivo()) return desligar();
    const dt = P.tl ? Math.min(0.034, (t - P.tl) / 1000) : 1 / 60; P.tl = t;
    const continua = passo(dt);
    P.raf = continua ? requestAnimationFrame(quadro) : 0;
  }
  // um passo da simulação (devolve true enquanto algo se mexe)
  function passo(dt) {
    let mexe = P.pega || !!P.cena;
    if (P.solta && !P.pega) {
      const L = limites();
      P.vy += G * dt; P.x += P.vx * dt; P.y += P.vy * dt;
      if (P.x < L.x0) { P.x = L.x0; bater(Math.abs(P.vx), 'esq'); P.vx = Math.abs(P.vx) * 0.55; }
      if (P.x > L.x1) { P.x = L.x1; bater(Math.abs(P.vx), 'dir'); P.vx = -Math.abs(P.vx) * 0.55; }
      if (P.y < L.y0) { P.y = L.y0; bater(Math.abs(P.vy), 'teto'); P.vy = Math.abs(P.vy) * 0.5; }
      if (P.y > L.y1) {
        P.y = L.y1; const imp = Math.abs(P.vy);
        if (imp > 700) bater(imp, 'chao');
        P.vy = imp > 160 ? -imp * 0.42 : 0;
        P.vx *= Math.pow(0.015, dt); // atrito no chão
      }
      if (Math.abs(P.vx) > 40) P.esp = P.vx > 0;
      const parado = noChao() && P.vy === 0 && Math.abs(P.vx) < 6;
      if (parado) { P.vx = 0; if (P.raiva >= 100 && !P.birra && !P.cena) entrarBirra(); }
      mexe = mexe || !parado;
    }
    if (P.k) mexe = andarKaua(dt) || mexe;
    aplicar();
    return mexe;
  }
  function bater(imp, lado) {
    if (imp < 380) return;
    P.raiva = Math.min(100, P.raiva + (imp > 1100 ? 10 : 6));
    som('batida'); if (!P.birra) falar(sorteia(FALAS.bate), 1800);
    const cx = lado === 'esq' ? P.x : lado === 'dir' ? P.x + W : P.x + W / 2, cy = lado === 'teto' ? P.y : lado === 'chao' ? P.y + H : P.y + H / 3;
    particula('💫', cx, cy); P.box.classList.remove('amassa'); void P.box.offsetWidth; P.box.classList.add('amassa');
    if (P.raiva >= 100) P.vaiBirra = true;
  }
  function aoMudarTela() { if (!P || !P.solta) return; const L = limites(); P.x = Math.min(Math.max(P.x, L.x0), L.x1); P.y = Math.min(Math.max(P.y, L.y0), L.y1); acordar(); }

  // ------------------------------------------------------------------ toque e arrasto
  function apertou(e) {
    if (!vivo() || e.button > 0) return;
    e.preventDefault(); e.stopPropagation();
    if (P.cena) return;
    if (P.birra) { falar(sorteia(FALAS.recusa), 1600); tremer(); particula('💢', P.x + W * 0.7, P.y + 6); return; }
    soltar();
    const t = performance.now();
    P.pega = true; P.vx = P.vy = 0; P.dx = e.clientX - P.x; P.dy = e.clientY - P.y; P.t0 = t; P.mov = 0; P.revs = 0; P.ultDir = 0; P.reagiu = false;
    P.hist = [{ x: e.clientX, y: e.clientY, t }];
    P.box.classList.add('pega');
    try { P.box.setPointerCapture(e.pointerId); } catch (er) { /* ok */ }
    P.box.addEventListener('pointermove', moveu); P.box.addEventListener('pointerup', largou); P.box.addEventListener('pointercancel', largou);
    acordar();
  }
  function moveu(e) {
    if (!P || !P.pega) return;
    const L = limites(), t = performance.now();
    const nx = Math.min(Math.max(e.clientX - P.dx, L.x0), L.x1), ny = Math.min(Math.max(e.clientY - P.dy, L.y0), L.y1);
    const ddx = nx - P.x; P.mov += Math.hypot(ddx, ny - P.y);
    const ant = P.hist[P.hist.length - 1];
    const vel = Math.abs(e.clientX - ant.x) / Math.max(1, t - ant.t) * 1000;
    const dir = Math.sign(ddx);
    if (dir && P.ultDir && dir !== P.ultDir && vel > 450) { // chacoalhou
      P.revs++;
      if (P.revs % 3 === 0) { P.raiva = Math.min(100, P.raiva + 5); falar(sorteia(FALAS.tonta), 1600); particula('💫', P.x + W / 2, P.y); }
    }
    if (dir) { P.ultDir = dir; P.esp = dir > 0; }
    P.x = nx; P.y = ny;
    P.hist.push({ x: e.clientX, y: e.clientY, t }); while (P.hist.length > 2 && t - P.hist[0].t > 90) P.hist.shift();
    if (P.mov > 10 && !P.reagiu) { P.reagiu = true; P.raiva = Math.min(100, P.raiva + 7); falar(sorteia(FALAS.arrasto[nivelDe(P.raiva)]), 2200); }
  }
  function largou(e) {
    if (!P || !P.pega) return;
    P.pega = false; P.box.classList.remove('pega');
    P.box.removeEventListener('pointermove', moveu); P.box.removeEventListener('pointerup', largou); P.box.removeEventListener('pointercancel', largou);
    const t = performance.now();
    if (P.mov < 8 && t - P.t0 < 400) { tocou(); acordar(); return; }
    const h0 = P.hist[0], dtv = Math.max(16, t - h0.t) / 1000;
    P.vx = Math.max(-2600, Math.min(2600, (e.clientX - h0.x) / dtv));
    P.vy = Math.max(-2600, Math.min(2600, (e.clientY - h0.y) / dtv));
    if (Math.hypot(P.vx, P.vy) > 1300) { P.raiva = Math.min(100, P.raiva + 5); som('susto'); falar(sorteia(FALAS.joga), 1500); }
    acordar();
  }
  function tocou() {
    const n = nivelDe(P.raiva);
    P.raiva = Math.min(100, P.raiva + 9);
    let txt = sorteia(FALAS.toque[n]).replace('{NOME}', nomeDono(true));
    if (n === 0) {
      const r = KM.tarefasApp && KM.tarefasApp.falaResumo ? KM.tarefasApp.falaResumo() : '';
      if (r && Math.random() < 0.3) txt = 'Amor, ' + r.charAt(0).toLowerCase() + r.slice(1);
      P.feliz = performance.now() + 1500; som('pulo');
      particula(sorteia(['💕', '💚', '💖', '✨']), P.x + W / 2, P.y + 4);
      if (noChao()) P.vy = -380; // pulinho
    } else if (n >= 2) { tremer(); particula('💢', P.x + W * 0.75, P.y + 4); som('clique'); }
    falar(txt, 2600);
    if (P.raiva >= 100) setTimeout(() => P && !P.birra && entrarBirra(), 700);
  }
  function decair() {
    if (!vivo()) return desligar();
    if (P.birra || P.pega || P.cena) return;
    const antes = nivelDe(P.raiva);
    P.raiva = Math.max(0, P.raiva - 1.6);
    if (antes >= 2) P.nivelAntes = antes;
    if (P.nivelAntes >= 2 && P.raiva < 18) { P.nivelAntes = 0; falar(sorteia(FALAS.calma), 2600); }
  }
  function tremer() { P.box.classList.remove('treme'); void P.box.offsetWidth; P.box.classList.add('treme'); }

  // ------------------------------------------------------------------ fala, partículas e aparência
  function falar(txt, ms = 2600, box = P && P.box) {
    if (!box) return;
    const b = box.querySelector('.clara-balao'); if (!b) return;
    b.textContent = txt; b.classList.remove('some');
    if (box === (P && P.box)) posBalao(box, P.x); else if (P && P.k && box === P.k.box) posBalao(box, P.k.x);
    clearTimeout(box._tf); box._tf = setTimeout(() => b.classList.add('some'), ms);
  }
  function particula(txt, x, y, dx) {
    const s = document.createElement('span'); s.className = 'cp-part'; s.textContent = txt;
    s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.setProperty('--dx', (dx != null ? dx : Math.round(Math.random() * 30 - 15)) + 'px');
    document.body.append(s); setTimeout(() => s.remove(), 1400);
  }
  // o que a Clara está fazendo vira a pose do boneco (desenhado pelo claraMini do inicio.js a cada 120 ms)
  function estAtual(k) {
    if (!P) return { bracos: 'baixo', boca: 'sorriso' };
    const n = nivelDe(P.raiva), est = {}, ap = {};
    if (P.cena === 'beijo') { Object.assign(est, { olhos: 'fechados', boca: 'o', bracos: 'baixo' }); ap.bochechas = true; }
    else if (P.cena === 'virou') { Object.assign(est, { boca: 'serio', bracos: 'baixo' }); ap.bochechas = true; }
    else if (P.cena === 'perdoou') { Object.assign(est, { olhos: 'feliz', boca: 'sorriso', bracos: k % 8 < 4 ? 'aceno' : 'baixo', aceno: k % 2 }); ap.bochechas = true; }
    else if (P.birra) { Object.assign(est, { vista: 'costas', bracos: 'frente' }); }
    else if (P.pega || !noChao()) { Object.assign(est, { bracos: 'cima', boca: n >= 2 ? 'grito' : 'o', olhos: n >= 2 ? undefined : 'grandes' }); if (n >= 2) ap.sobrancelha = 'brava'; }
    else if (n === 0) {
      const feliz = performance.now() < P.feliz;
      Object.assign(est, { bracos: feliz || k % 24 < 4 ? 'aceno' : 'baixo', aceno: k % 2, boca: feliz ? 'sorrisao' : 'sorriso', olhos: feliz ? 'feliz' : undefined, piscar: !feliz && k % 30 === 0 });
    } else if (n === 1) Object.assign(est, { bracos: 'baixo', boca: 'serio', piscar: k % 26 === 0 });
    else { Object.assign(est, { bracos: 'frente', boca: n === 3 && k % 10 < 3 ? 'grito' : 'serio' }); ap.sobrancelha = 'brava'; if (n === 3) ap.bochechas = true; }
    P.box._esp = P.cena ? P.olhaDir : P.esp;
    if (Object.keys(ap).length) est._ap = ap;
    for (const c of Object.keys(est)) if (est[c] === undefined) delete est[c];
    return est;
  }

  // ------------------------------------------------------------------ birra e o beijo
  function entrarBirra() {
    if (!P || P.birra) return;
    P.birra = true; P.raiva = 100; P.vaiBirra = false;
    P.box.classList.add('birra'); som('batida');
    falar('Hmpf! 😤 Não tô falando com você.', 3200);
    [0, 250, 500].forEach((d, i) => setTimeout(() => P && particula('💢', P.x + W / 2 + (i - 1) * 14, P.y), d));
    clearInterval(P.falasBirra);
    P.falasBirra = setInterval(() => { if (P && P.birra && !P.cena) falar(sorteia(FALAS.birra), 2000); }, 3600);
    setTimeout(() => chegaKaua(), 2800);
  }
  async function chegaKaua() {
    if (!vivo() || !P.birra || P.cena) return;
    while (vivo() && (!noChao() || P.pega || Math.abs(P.vx) > 6)) await dorme(200); // espera ela parar no chão
    if (!vivo()) return;
    const f = dono(); if (!f) { sairBirra(); return; }
    P.cena = 'chegando'; clearInterval(P.falasBirra);
    const L = limites(); // ele entra pela borda mais perto dela (se couber do lado dela)
    let daEsq = P.x < tela().w / 2; if (daEsq && P.x - 24 < L.x0) daEsq = false; if (!daEsq && P.x + 24 > L.x1) daEsq = true;
    const cv = document.createElement('canvas'); cv.width = 30; cv.height = 46;
    const kb = A().el('div', { class: 'kaua-mini' }, A().el('div', { class: 'clara-balao some' }, ''), cv);
    document.body.append(kb);
    const K = P.k = { box: kb, cv, g: cv.getContext('2d'), f, x: daEsq ? -W - 8 : tela().w + 8, y: L.y1, alvo: null, esp: daEsq, est: {}, passo: 0, fim: null };
    K.g.imageSmoothingEnabled = false;
    K.desenho = setInterval(() => desenharKaua(), 120); desenharKaua(); posKaua();
    falar('Amor? 🥺', 1800, kb);
    await andarAte(daEsq ? P.x - 24 : P.x + 24);
    if (!vivo()) return;
    falar('Desculpa, vai… 💚', 2000, kb); await dorme(1700);
    P.cena = 'virou'; P.olhaDir = !daEsq; P.box.classList.remove('birra');
    falar('…hmpf. 😒', 1500); await dorme(1500);
    falar('Te amo, sabia? 💚', 1700, kb); await dorme(1500);
    if (!vivo()) return;
    P.cena = 'beijo'; K.est = { olhos: 'fechados', boca: 'o', bracos: 'frente' }; K.x += daEsq ? 5 : -5; posKaua();
    som('coracao'); falar('😘', 1400, kb);
    for (let i = 0; i < 7; i++) setTimeout(() => P && particula(sorteia(['💋', '💕', '💖', '💗', '💚']), (P.x + K.x + W) / 2, P.y + 4, (i - 3) * 12), i * 140);
    await dorme(1500);
    if (!vivo()) return;
    P.raiva = 0; P.birra = false; P.nivelAntes = 0; P.cena = 'perdoou'; K.est = { olhos: 'feliz', boca: 'sorriso', bracos: 'baixo' };
    falar('Tá bom… te perdoo 🥰', 2400); await dorme(2200);
    falar('Agora bora terminar as tarefas? 💪', 2000, kb); await dorme(1600);
    if (!vivo()) return;
    falar('Bora! 😘', 1600);
    K.est = { bracos: 'aceno', boca: 'sorriso' };
    await andarAte(daEsq ? -W - 20 : tela().w + 20);
    sairBirra();
  }
  function sairBirra() {
    if (!P) return;
    if (P.k) { clearInterval(P.k.desenho); P.k.box.remove(); P.k = null; }
    P.birra = false; P.cena = null; P.raiva = 0; P.box.classList.remove('birra'); P.feliz = performance.now() + 3000;
  }
  function andarAte(x) {
    return new Promise(res => { const K = P && P.k; if (!K) return res(); K.alvo = x; K.esp = x > K.x; K.vel = Math.max(130, Math.abs(x - K.x) / 2.6); K.fim = res; acordar(); });
  }
  function andarKaua(dt) {
    const K = P.k; if (!K || K.alvo == null) return false;
    const d = K.alvo - K.x, v = (K.vel || 130) * dt;
    if (Math.abs(d) <= v) { K.x = K.alvo; K.alvo = null; K.passo = 0; posKaua(); const f = K.fim; K.fim = null; if (f) f(); return false; }
    K.x += Math.sign(d) * v; K.passoT = (K.passoT || 0) + dt; posKaua();
    return true;
  }
  function posKaua() { const K = P && P.k; if (!K) return; K.y = limites().y1; K.box.style.transform = `translate(${Math.round(K.x)}px, ${Math.round(K.y)}px)`; posBalao(K.box, K.x); }
  function desenharKaua() {
    const K = P && P.k; if (!K || !K.box.isConnected) return;
    const andando = K.alvo != null, fase = Math.floor((K.passoT || 0) * 8) % 4;
    const est = Object.assign({ bracos: 'baixo', boca: 'sorriso' }, K.est, andando ? { passo: fase === 1 ? 1 : fase === 3 ? 2 : 0 } : {});
    if (andando && K.est.bracos === 'aceno') est.aceno = fase % 2;
    K.g.clearRect(0, 0, 30, 46);
    const spr = KM.sprite(KM.aparenciaDe(A().cfg(), K.f.id), est);
    K.g.save(); if (K.esp) { K.g.translate(30, 0); K.g.scale(-1, 1); } K.g.drawImage(spr, 0, 0); K.g.restore();
  }

  KM.claraPet = { ligar, desligar, posBalao, estado: () => P, _passo: passo, _birra: entrarBirra, _tocou: () => P && tocou() };
})();
