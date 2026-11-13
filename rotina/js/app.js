// Rotina KWIK — organizador de atividades diárias.
// Vermelho = a fazer · Verde = concluída · Toque para alternar · Segure para editar.
import * as store from './store.js';
import * as notify from './notify.js';
import * as sync from './sync.js';
import { CATEGORIES, ALL_CATALOG, ICON_CHOICES } from './catalog.js';
import { icon } from './icons.js';

const $ = (sel, el = document) => el.querySelector(sel);
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const vibrate = (ms) => { try { navigator.vibrate?.(ms); } catch { /* sem vibração */ } };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const DOW_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DOW_NAME = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DOW_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const LATE_AFTER_MIN = 15;
const fmtDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

const ui = {
  tab: 'hoje',
  query: '',
  catalogOpen: true,
  openCat: null,
  justDone: null,
  perm: null,
  exact: null,
  armed: null,
  minute: '',
  day: '',
  ghBusy: false,
  ghError: '',
};

// ---------------------------------------------------------------- helpers
function statusOf(task, now) {
  if (store.isDone(task.id, now)) return { cls: 'is-done' };
  const mins = (store.at(now, task.time) - now) / 60000;
  const lead = store.get().settings.lead || 10;
  if (mins > lead) return { cls: 'is-pending' };
  if (mins > 0) return { cls: 'is-soon', badge: `em ${Math.ceil(mins)} min` };
  if (mins > -LATE_AFTER_MIN) return { cls: 'is-now', badge: 'agora' };
  return { cls: 'is-late', badge: 'atrasada' };
}

function relTime(mins) {
  if (mins <= 0) return 'agora';
  if (mins < 60) return `em ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `em ${h}h${m ? store.pad(m) : ''}`;
}

function daysLabel(days) {
  const d = [...days].sort();
  const key = d.join(',');
  if (d.length === 7) return 'Todos os dias';
  if (key === '1,2,3,4,5') return 'Segunda a sexta';
  if (key === '0,6') return 'Fim de semana';
  if (d.length === 1) return `Só ${DOW_FULL[d[0]].toLowerCase()}`;
  if (!d.length) return 'Nenhum dia';
  return d.map((i) => DOW_NAME[i]).join(', ');
}

function nextHour() {
  return `${store.pad((new Date().getHours() + 1) % 24)}:00`;
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const KEYWORDS = [
  ['agua', 'glass-water'], ['remed', 'pill'], ['dente', 'toothbrush'], ['banho', 'shower-head'],
  ['estud', 'book-open'], ['prova', 'notebook-pen'], ['ler', 'book'], ['livro', 'book'],
  ['academ', 'dumbbell'], ['trein', 'dumbbell'], ['corr', 'footprints'], ['caminh', 'footprints'],
  ['comer', 'utensils'], ['almo', 'utensils'], ['jant', 'utensils-crossed'], ['cafe', 'coffee'],
  ['lanche', 'sandwich'], ['dorm', 'moon'], ['acord', 'sunrise'], ['trabalh', 'briefcase'],
  ['reuni', 'users'], ['conta', 'receipt'], ['pag', 'receipt'], ['email', 'mail'], ['e-mail', 'mail'],
  ['ligar', 'phone'], ['compr', 'shopping-cart'], ['mercado', 'shopping-cart'], ['limp', 'brush-cleaning'],
  ['lav', 'washing-machine'], ['lixo', 'trash'], ['cachorro', 'dog'], ['gato', 'cat'], ['pet', 'paw-print'],
  ['planta', 'sprout'], ['escola', 'school'], ['aula', 'school'], ['curso', 'laptop'], ['jogo', 'gamepad-2'],
  ['jogar', 'gamepad-2'], ['music', 'headphones'], ['igreja', 'church'], ['orar', 'hand-heart'],
  ['rezar', 'hand-heart'], ['medit', 'brain'], ['bebe', 'baby'], ['carro', 'car'], ['onibus', 'bus'],
  ['dinheiro', 'piggy-bank'], ['imposto', 'calculator'], ['contab', 'calculator'], ['cliente', 'handshake'],
];
function guessIcon(text) {
  const q = norm(text);
  if (!q) return 'calendar-check';
  const hit = ALL_CATALOG.find((c) => norm(c.name) === q) || ALL_CATALOG.find((c) => norm(c.name).includes(q));
  if (hit) return hit.icon;
  const kw = KEYWORDS.find(([k]) => q.includes(k));
  return kw ? kw[1] : 'calendar-check';
}

// ---------------------------------------------------------------- render
function render() {
  document.documentElement.dataset.theme = store.get().settings.theme;
  renderHeader();
  renderView();
  renderTabbar();
  renderSyncInd();
}

// Ícone de nuvem no cabeçalho (só aparece quando a sincronização está ligada)
function renderSyncInd() {
  const el = $('#sync-ind');
  if (!sync.connected()) {
    el.hidden = true;
    return;
  }
  const st = sync.status.state;
  const map = {
    ok: ['cloud-check', 'Sincronizado'],
    syncing: ['refresh-cw', 'Sincronizando…'],
    error: ['cloud-off', 'Erro na sincronização'],
    off: ['cloud', 'Sincronização ligada'],
  };
  const [ic, label] = map[st] || map.off;
  el.hidden = false;
  el.className = `sync-ind is-${st}`;
  el.setAttribute('aria-label', label);
  el.title = label;
  el.innerHTML = icon(ic);
}

function renderHeader(now = new Date()) {
  const s = store.get().settings;
  const title = $('#title');
  const sub = $('#subtitle');
  const ringEl = $('#ring');
  $('#search-wrap').hidden = ui.tab !== 'hoje';
  ringEl.hidden = ui.tab !== 'hoje';

  if (ui.tab === 'hoje') {
    title.textContent = s.name ? `Olá, ${s.name}!` : 'Hoje';
    sub.textContent = fmtDate.format(now);
    const tasks = store.tasksFor(now);
    const done = tasks.filter((t) => store.isDone(t.id, now)).length;
    updateRing(ringEl, done, tasks.length);
  } else if (ui.tab === 'rotina') {
    title.textContent = 'Minha rotina';
    sub.textContent = plural(store.get().tasks.length, 'atividade', 'atividades');
  } else {
    title.textContent = 'Ajustes';
    sub.textContent = 'Lembretes, perfil e tema';
  }
}

function updateRing(el, done, total) {
  const r = 19;
  const c = 2 * Math.PI * r;
  const offset = (c * (1 - (total ? done / total : 0))).toFixed(2);
  el.setAttribute('aria-label', `${done} de ${total} concluídas`);
  const fg = el.querySelector('.ring-fg');
  if (fg) {
    fg.setAttribute('stroke-dashoffset', offset);
    el.querySelector('.ring-txt').textContent = `${done}/${total}`;
    return;
  }
  el.innerHTML = `<svg class="ring" viewBox="0 0 46 46" aria-hidden="true">
      <circle class="ring-bg" cx="23" cy="23" r="${r}"/>
      <circle class="ring-fg" cx="23" cy="23" r="${r}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset}" transform="rotate(-90 23 23)"/>
    </svg><span class="ring-txt">${done}/${total}</span>`;
}

function renderTabbar() {
  document.querySelectorAll('#tabbar [data-tab]').forEach((b) => {
    const on = b.dataset.tab === ui.tab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-current', on ? 'page' : 'false');
  });
  $('#fab').hidden = ui.tab !== 'rotina';
}

function renderView() {
  const v = $('#view');
  const typedToken = $('#gh-token')?.value || '';
  if (ui.tab === 'hoje') v.innerHTML = ui.query.trim() ? viewSearch() : viewHoje();
  else if (ui.tab === 'rotina') v.innerHTML = viewRotina();
  else v.innerHTML = viewAjustes();
  if (typedToken && $('#gh-token')) $('#gh-token').value = typedToken;
  ui.justDone = null;
}

// Atualiza só o cartão de sincronização (sem apagar o que a pessoa está digitando)
function renderSyncCard() {
  const card = $('#sync-card');
  if (!card) return;
  const typed = $('#gh-token')?.value || '';
  card.innerHTML = syncCardInner();
  if (typed && $('#gh-token')) $('#gh-token').value = typed;
}

// ---------------------------------------------------------------- tiles
function tileTask(t, now) {
  const st = statusOf(t, now);
  const done = st.cls === 'is-done';
  return `<button type="button" class="tile ${st.cls}${ui.justDone === t.id ? ' just-done' : ''}"
      data-action="toggle" data-id="${esc(t.id)}" aria-pressed="${done}"
      aria-label="${esc(t.name)}, ${t.time}${done ? ', concluída' : ''}">
    <span class="tile-time">${t.time}</span>
    ${st.badge ? `<span class="tile-badge">${st.badge}</span>` : ''}
    <span class="tile-check">${icon('check')}</span>
    ${icon(t.icon)}
    <span class="tile-name">${esc(t.name)}</span>
  </button>`;
}

function tileEdit(t) {
  return `<button type="button" class="tile is-pending" data-action="edit" data-id="${esc(t.id)}">
    <span class="tile-time">${t.time}</span>${icon(t.icon)}<span class="tile-name">${esc(t.name)}</span>
  </button>`;
}

function tileCatalog(item, inRoutine) {
  return `<button type="button" class="tile tile-cat" data-action="add"
      data-name="${esc(item.name)}" data-icon="${esc(item.icon)}" data-time="${esc(item.time)}"
      aria-label="Adicionar ${esc(item.name)}">
    <span class="tile-plus">${icon('plus')}</span>
    ${inRoutine ? `<span class="tile-flag" title="Já está na rotina">${icon('check')}</span>` : ''}
    ${icon(item.icon)}
    <span class="tile-name">${esc(item.name)}</span>
  </button>`;
}

// ---------------------------------------------------------------- telas
function permBanner() {
  const s = store.get().settings;
  if (!s.notify || !ui.perm || ui.perm === 'granted' || ui.perm === 'unsupported') return '';
  if (ui.perm === 'denied') {
    return `<div class="banner">${icon('bell-off')}<span>Notificações bloqueadas. Libere nas configurações do
      ${notify.isNative ? 'celular' : 'navegador'} para receber os lembretes.</span></div>`;
  }
  return `<div class="banner">${icon('bell-ring')}<span>Ative as notificações para ser avisado antes de cada atividade.</span>
    <button type="button" class="btn btn-sm" data-action="perm">Ativar</button></div>`;
}

function nextCard(tasks, now) {
  if (!tasks.length) return '';
  const pending = tasks.filter((t) => !store.isDone(t.id, now));
  if (!pending.length) {
    const days = store.streak(now);
    return `<div class="next">
      <span class="next-ic">${icon('party-popper')}</span>
      <div class="next-main"><small>Dia completo</small><strong>Tudo concluído hoje!</strong></div>
      ${days > 1 ? `<span class="when">${icon('flame')}${days} dias</span>` : ''}
    </div>`;
  }
  const lead = store.get().settings.lead || 10;
  const minsTo = (t) => Math.round((store.at(now, t.time) - now) / 60000);
  const upcoming = pending.find((t) => minsTo(t) > -LATE_AFTER_MIN);
  const late = pending.filter((t) => minsTo(t) <= -LATE_AFTER_MIN).length;
  if (upcoming) {
    const m = minsTo(upcoming);
    return `<div class="next${m <= lead ? ' is-soon' : ''}">
      <span class="next-ic">${icon(upcoming.icon)}</span>
      <div class="next-main"><small>Próxima · ${upcoming.time}</small><strong>${esc(upcoming.name)}</strong></div>
      <span class="when">${relTime(m)}</span>
    </div>`;
  }
  return `<div class="next is-late">
    <span class="next-ic">${icon('alarm-clock')}</span>
    <div class="next-main"><small>Atenção</small><strong>${plural(late, 'atividade atrasada', 'atividades atrasadas')}</strong></div>
  </div>`;
}

function catalogSection() {
  const mine = new Set(store.get().tasks.map((t) => norm(t.name)));
  let html = `<button type="button" class="section-head" data-action="toggle-catalog" aria-expanded="${ui.catalogOpen}">
    <span>Adicionar atividades</span>${icon(ui.catalogOpen ? 'chevron-up' : 'chevron-down')}</button>`;
  if (!ui.catalogOpen) return html;
  html += '<div class="cats">';
  for (const c of CATEGORIES) {
    const open = ui.openCat === c.id;
    html += `<button type="button" class="cat-row${open ? ' open' : ''}" data-action="open-cat" data-cat="${c.id}" aria-expanded="${open}">
      <span>${esc(c.name)}</span><span class="count">${c.items.length}</span>${icon('chevron-right', 'chev')}</button>`;
    if (open) {
      const items = c.items.map(([name, ic, time]) => ({ name, icon: ic, time }));
      html += `<div class="grid cat-grid">${items.map((it) => tileCatalog(it, mine.has(norm(it.name)))).join('')}</div>`;
    }
  }
  return html + '</div>';
}

function viewHoje() {
  const now = new Date();
  const tasks = store.tasksFor(now);
  let html = permBanner() + nextCard(tasks, now);
  if (tasks.length) {
    html += `<div class="grid">${tasks.map((t) => tileTask(t, now)).join('')}</div>`;
    html += '<p class="hint">Toque para concluir · segure para editar</p>';
  } else {
    html += `<div class="empty">${icon('calendar-check')}<p><strong>Nenhuma atividade para hoje.</strong></p>
      <p>Escolha uma abaixo ou digite no campo de busca.</p></div>`;
  }
  return html + catalogSection();
}

function viewSearch() {
  const raw = ui.query.trim();
  const q = norm(raw);
  const tasks = store.get().tasks;
  const mineNames = new Set(tasks.map((t) => norm(t.name)));
  const mine = tasks.filter((t) => norm(t.name).includes(q)).sort(store.sortByTime);
  const seen = new Set();
  const sugg = ALL_CATALOG.filter((c) => norm(c.name).includes(q) && !seen.has(c.name) && seen.add(c.name));
  let html = '';
  if (mine.length) {
    html += `<h3 class="label">Na sua rotina</h3><div class="grid">${mine.map(tileEdit).join('')}</div>`;
  }
  html += `<h3 class="label">${sugg.length ? 'Sugestões' : 'Nova atividade'}</h3><div class="grid">`;
  html += `<button type="button" class="tile tile-new" data-action="create">${icon('plus')}
    <span class="tile-name">Criar “${esc(raw)}”</span></button>`;
  html += sugg.map((c) => tileCatalog(c, mineNames.has(norm(c.name)))).join('');
  return html + '</div>';
}

function viewRotina() {
  const tasks = [...store.get().tasks].sort(store.sortByTime);
  const today = new Date().getDay();
  if (!tasks.length) {
    return `<div class="empty">${icon('calendar-clock')}<p><strong>Sua rotina está vazia.</strong></p>
      <p>Toque em “Nova atividade” para começar.</p></div><div class="fab-space"></div>`;
  }
  const rows = tasks.map((t) => {
    const off = t.remind === false;
    return `<button type="button" class="row" data-action="edit" data-id="${esc(t.id)}">
      <span class="row-ic">${icon(t.icon)}</span>
      <span class="row-main"><strong>${esc(t.name)}</strong>
        <small>${daysLabel(t.days)}${t.days.includes(today) ? '' : ' · hoje não'}</small></span>
      <span class="row-time">${t.time}</span>
      ${icon(off ? 'bell-off' : 'bell', `bell${off ? '' : ' on'}`)}
    </button>`;
  }).join('');
  return `<div class="list">${rows}</div>
    <p class="hint">Toque numa atividade para mudar horário, dias, ícone ou lembrete.</p>
    <div class="fab-space"></div>`;
}

function viewAjustes() {
  const s = store.get().settings;
  const permInfo = {
    granted: ['Permitidas neste aparelho.', `<span class="status ok">${icon('circle-check')}Ativas</span>`],
    denied: [`Bloqueadas. Libere nas configurações do ${notify.isNative ? 'celular (Apps › Rotina KWIK › Notificações)' : 'navegador'}.`,
      `<span class="status bad">${icon('bell-off')}Bloqueadas</span>`],
    prompt: ['Ainda não permitidas.', '<button type="button" class="btn btn-sm" data-action="perm">Permitir</button>'],
    unsupported: ['Este navegador não suporta notificações.', ''],
  }[ui.perm || 'prompt'] || ['', ''];

  const exactRow = ui.exact === null ? '' : `
    <div class="set"><div class="set-main"><strong>Avisos no minuto exato</strong>
      <small>${ui.exact === 'granted' ? 'Ativado: os avisos chegam na hora certa.' : 'Desativado: os avisos podem atrasar alguns minutos.'}</small></div>
      ${ui.exact === 'granted' ? `<span class="status ok">${icon('check')}</span>` : '<button type="button" class="btn btn-sm btn-ghost" data-action="exact">Ajustar</button>'}
    </div>`;

  const note = notify.isNative
    ? `<div class="note">${icon('battery-charging')}<span>Se algum aviso não chegar, desative a <strong>otimização de bateria</strong> para a Rotina KWIK nas configurações do celular.</span></div>`
    : `<div class="note">${icon('smartphone')}<span>No navegador, os avisos chegam enquanto o app está aberto. Para receber com o celular bloqueado, instale o <strong>APK Android</strong> da Rotina KWIK.</span></div>`;

  return `
  <section class="card">
    <h3>Perfil</h3>
    <div class="set"><div class="set-main"><strong>Seu nome</strong><small>Aparece na saudação da tela Hoje.</small>
      <input class="input" id="set-name" maxlength="24" value="${esc(s.name)}" placeholder="Ex.: Enzo" autocomplete="off" enterkeyhint="done"></div></div>
  </section>

  <section class="card" id="sync-card">${syncCardInner()}</section>

  <section class="card">
    <h3>Lembretes</h3>
    <div class="set"><div class="set-main"><strong>Notificações</strong><small>${permInfo[0]}</small></div>${permInfo[1]}</div>
    <label class="set"><div class="set-main"><strong>Lembretes ativados</strong><small>Avisar sobre as atividades que ainda estão em vermelho.</small></div>
      <input type="checkbox" class="switch" data-setting="notify" ${s.notify ? 'checked' : ''}></label>
    <div class="set set-col"><div class="set-main"><strong>Avisar antes</strong><small>Quanto tempo antes de cada atividade.</small></div>
      <div class="seg">${[5, 10, 15, 30, 60].map((m) => `<button type="button" class="${s.lead === m ? 'on' : ''}" data-action="lead" data-v="${m}">${m} min</button>`).join('')}</div></div>
    <label class="set"><div class="set-main"><strong>Avisar também na hora</strong><small>Um segundo aviso no horário da atividade.</small></div>
      <input type="checkbox" class="switch" data-setting="atTime" ${s.atTime ? 'checked' : ''}></label>
    <div class="set"><div class="set-main"><strong>Testar</strong><small>Envia uma notificação em 5 segundos.</small></div>
      <button type="button" class="btn btn-sm btn-ghost" data-action="test">${icon('send')}Testar</button></div>
    ${exactRow}
    ${note}
  </section>

  <section class="card">
    <h3>Aparência</h3>
    <div class="set"><div class="set-main"><strong>Tema</strong></div>
      <div class="seg">
        <button type="button" class="${s.theme === 'dark' ? 'on' : ''}" data-action="theme" data-v="dark">Escuro</button>
        <button type="button" class="${s.theme === 'light' ? 'on' : ''}" data-action="theme" data-v="light">Claro</button>
      </div></div>
  </section>

  <section class="card">
    <h3>Dados</h3>
    <div class="set"><div class="set-main"><strong>Desmarcar o dia de hoje</strong><small>Volta as atividades de hoje para vermelho.</small></div>${armBtn('clear-day', 'Desmarcar')}</div>
    <div class="set"><div class="set-main"><strong>Restaurar rotina padrão</strong><small>Troca suas atividades pelas sugeridas.</small></div>${armBtn('restore', 'Restaurar')}</div>
  </section>

  <footer class="about">
    <img src="img/logo-kwik.png" alt="KWIK Contabilidade Inteligente" />
    <p>Rotina KWIK · v1.0</p>
  </footer>`;
}

function armBtn(key, idle) {
  const on = ui.armed === key;
  return `<button type="button" class="btn btn-sm btn-danger${on ? ' armed' : ''}" data-action="${key}">${on ? 'Confirmar' : idle}</button>`;
}

const hhmm = (d) => `${store.pad(d.getHours())}:${store.pad(d.getMinutes())}`;

function syncCardInner() {
  const c = sync.conf();
  const repoName = esc(c.repo.split('/')[1] || c.repo);
  if (!sync.connected()) {
    const outro = sync.tokenDeOutroApp();
    const dis = ui.ghBusy ? ' disabled' : '';
    return `<h3>Celular + computador</h3>
    <div class="set set-col"><div class="set-main"><strong>Sincronizar entre aparelhos</strong>
      <small>A rotina e as marcações ficam salvas no repositório privado <b>${repoName}</b> e aparecem iguais em todos os aparelhos conectados.</small></div>
      ${outro ? `<button type="button" class="btn btn-sm" data-action="gh-outro"${dis}>${icon('key-round')}Usar o token do ${esc(outro.nome)}</button>` : ''}
      <input class="input" id="gh-token" type="password" placeholder="Cole aqui o token (github_pat_…)"
        autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go">
      <div class="btn-row">
        <button type="button" class="btn btn-sm" data-action="gh-connect"${dis}>${icon(ui.ghBusy ? 'refresh-cw' : 'cloud', ui.ghBusy ? 'spin' : '')}${ui.ghBusy ? 'Conectando…' : 'Conectar'}</button>
        <a class="btn btn-sm btn-ghost" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">${icon('external-link')}Criar token</a>
      </div>
      ${ui.ghError ? `<p class="form-error">${esc(ui.ghError)}</p>` : ''}
      <ol class="steps">
        <li>Em <b>Repository access</b>, escolha <b>Only select repositories</b> → <b>${repoName}</b>.</li>
        <li>Em <b>Permissions</b> → <b>Contents</b>, escolha <b>Read and write</b>.</li>
        <li>Gere o token, copie e cole aqui. Faça o mesmo no outro aparelho.</li>
      </ol>
      <small class="muted">Se já houver uma rotina salva na nuvem, este aparelho passa a usar a da nuvem.</small>
    </div>`;
  }
  const st = sync.status;
  const err = st.state === 'error';
  const line = st.state === 'syncing' ? 'Sincronizando…' : err ? st.msg : st.at ? `Sincronizado às ${hhmm(st.at)}` : 'Conectado';
  return `<h3>Celular + computador</h3>
    <div class="set"><div class="set-main"><strong>Sincronização ligada</strong>
      <small class="${err ? 'txt-bad' : ''}">${esc(line)}</small>
      <small>Salvo no repositório privado <b>${repoName}</b>.</small></div>
      <span class="status ${err ? 'bad' : 'ok'}">${icon(err ? 'cloud-off' : 'cloud-check')}</span></div>
    <div class="set btn-row">
      <button type="button" class="btn btn-sm btn-ghost" data-action="gh-sync">${icon('refresh-cw', st.state === 'syncing' ? 'spin' : '')}Sincronizar agora</button>
      ${armBtn('gh-disconnect', 'Desconectar')}
    </div>`;
}

async function connectWith(token, fromApp) {
  ui.ghBusy = true;
  ui.ghError = '';
  renderSyncCard();
  try {
    const { adopted } = await sync.connect(token);
    toast(adopted ? 'Conectado! Rotina carregada da nuvem' : 'Conectado! Rotina salva na nuvem');
  } catch (e) {
    ui.ghError = fromApp ? `O token do ${fromApp} não tem acesso: ${e.message}` : e.message;
  } finally {
    ui.ghBusy = false;
    render();
  }
}

// ---------------------------------------------------------------- painel de edição
let draft = null;
let draftNew = false;

function openSheet(task, isNew) {
  draft = { remind: true, ...task, days: [...(task.days || store.ALL_DAYS)] };
  draftNew = isNew;
  $('#sheet-root').innerHTML = sheetHtml();
  if (!history.state?.sheet) history.pushState({ sheet: true }, '');
  if (isNew && !draft.name) setTimeout(() => $('#f-name')?.focus(), 280);
}

function closeSheet(fromPopState = false) {
  if (!draft) return;
  draft = null;
  $('#sheet-root').innerHTML = '';
  if (!fromPopState && history.state?.sheet) history.back();
}

function sheetHtml() {
  const d = draft;
  const atTime = store.get().settings.atTime;
  return `<div class="sheet-backdrop" data-action="sheet-close">
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-action="noop">
    <div class="sheet-handle"></div>
    <h2 id="sheet-title">${draftNew ? 'Nova atividade' : 'Editar atividade'}</h2>
    <div class="sheet-top">
      <div class="tile is-pending preview" id="f-preview" aria-hidden="true">
        <span class="tile-time" id="f-prev-time">${d.time}</span>${icon(d.icon)}
        <span class="tile-name" id="f-prev-name">${esc(d.name || 'Atividade')}</span>
      </div>
      <div class="sheet-fields">
        <label class="field-label" for="f-name">Nome</label>
        <input id="f-name" class="input" maxlength="40" value="${esc(d.name)}" placeholder="Ex.: Tomar remédio" autocomplete="off" enterkeyhint="done">
        <label class="field-label" for="f-time">Horário</label>
        <input id="f-time" class="input time-input" type="time" value="${d.time}" required>
      </div>
    </div>
    <div class="field">
      <span class="field-label">Dias</span>
      <div class="days">${DOW_SHORT.map((l, i) => `<button type="button" class="${d.days.includes(i) ? 'on' : ''}" data-action="sheet-day" data-d="${i}" aria-label="${DOW_FULL[i]}" aria-pressed="${d.days.includes(i)}">${l}</button>`).join('')}</div>
      <div class="quick">
        <button type="button" data-action="sheet-days" data-v="all">Todos os dias</button>
        <button type="button" data-action="sheet-days" data-v="week">Segunda a sexta</button>
        <button type="button" data-action="sheet-days" data-v="weekend">Fim de semana</button>
      </div>
    </div>
    <div class="field">
      <span class="field-label">Ícone</span>
      <div class="icon-grid">${ICON_CHOICES.map((n) => `<button type="button" class="${n === d.icon ? 'on' : ''}" data-action="sheet-icon" data-icon="${n}" aria-label="Ícone ${n}">${icon(n)}</button>`).join('')}</div>
    </div>
    <label class="set set-sheet"><div class="set-main"><strong>Me avisar</strong>
      <small>Notificação antes${atTime ? ' e na hora' : ''} desta atividade.</small></div>
      <input type="checkbox" class="switch" id="f-remind" ${d.remind !== false ? 'checked' : ''}></label>
    <p class="form-error" id="f-error" hidden></p>
    <div class="sheet-actions">
      ${draftNew
        ? '<button type="button" class="btn btn-ghost" data-action="sheet-close">Cancelar</button>'
        : `<button type="button" class="btn btn-danger" data-action="sheet-delete">${icon('trash')}Excluir</button>`}
      <button type="button" class="btn" data-action="sheet-save">${icon('check')}${draftNew ? 'Adicionar' : 'Salvar'}</button>
    </div>
  </div></div>`;
}

function syncDays() {
  document.querySelectorAll('.days [data-d]').forEach((b) => {
    const on = draft.days.includes(Number(b.dataset.d));
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
  });
}

function sheetError(msg) {
  const el = $('#f-error');
  el.textContent = msg;
  el.hidden = false;
}

function saveSheet() {
  const name = (draft.name || '').trim();
  const time = $('#f-time').value.slice(0, 5) || draft.time;
  if (!name) return sheetError('Dê um nome para a atividade.');
  if (!/^\d{2}:\d{2}$/.test(time)) return sheetError('Escolha um horário.');
  if (!draft.days.length) return sheetError('Escolha pelo menos um dia da semana.');
  const task = { ...draft, name, time, remind: $('#f-remind').checked };
  const isNew = draftNew;
  closeSheet();
  if (isNew) clearSearch();
  store.upsertTask(task);
  const today = task.days.includes(new Date().getDay());
  toast(isNew ? `${name} adicionada${today ? '' : ' (não é para hoje)'}` : 'Atividade atualizada');
}

// ---------------------------------------------------------------- ações
function toggleTask(id, key = store.dateKey()) {
  const task = store.findTask(id);
  if (!task) return;
  const day = store.fromKey(key);
  const wasDone = store.isDone(id, day);
  ui.justDone = wasDone ? null : id;
  store.setDone(id, !wasDone, key);
  if (wasDone) return;
  vibrate(18);
  notify.dismiss(task);
  const left = store.tasksFor(day).filter((t) => !store.isDone(t.id, day)).length;
  toast(left ? `${task.name} concluída` : 'Dia completo! Parabéns 🎉', {
    label: 'Desfazer',
    fn: () => store.setDone(id, false, key),
  });
}

function clearSearch() {
  ui.query = '';
  $('#search').value = '';
  $('#search-clear').hidden = true;
}

let armTimer = null;
function armed(key, fn) {
  if (ui.armed === key) {
    ui.armed = null;
    clearTimeout(armTimer);
    fn();
    return;
  }
  ui.armed = key;
  renderView();
  clearTimeout(armTimer);
  armTimer = setTimeout(() => { ui.armed = null; if (ui.tab === 'ajustes') renderView(); }, 3500);
}

async function refreshPerm() {
  const [perm, exact] = await Promise.all([notify.permission(), notify.exactAlarm()]);
  if (perm !== ui.perm || exact !== ui.exact) {
    ui.perm = perm;
    ui.exact = exact;
    render();
  }
}

async function askPermission() {
  ui.perm = await notify.requestPermission();
  render();
  if (ui.perm === 'granted') toast('Notificações ativadas!');
}

const actions = {
  noop: null,
  tab(el) {
    ui.tab = el.dataset.tab;
    ui.armed = null;
    render();
    $('#view').scrollTop = 0;
    if (ui.tab === 'ajustes') refreshPerm();
  },
  toggle: (el) => toggleTask(el.dataset.id),
  'toggle-catalog'() { ui.catalogOpen = !ui.catalogOpen; renderView(); },
  'open-cat'(el) { ui.openCat = ui.openCat === el.dataset.cat ? null : el.dataset.cat; renderView(); },
  add: (el) => openSheet({ name: el.dataset.name, icon: el.dataset.icon, time: el.dataset.time }, true),
  create() {
    const name = capitalize(ui.query.trim());
    openSheet({ name, icon: guessIcon(name), time: nextHour() }, true);
  },
  new: () => openSheet({ name: '', icon: 'calendar-check', time: nextHour() }, true),
  edit(el) {
    const t = store.findTask(el.dataset.id);
    if (t) openSheet(t, false);
  },
  'search-clear'() { clearSearch(); renderView(); $('#search').focus(); },
  perm: () => askPermission(),
  lead: (el) => store.setSettings({ lead: Number(el.dataset.v) }),
  theme: (el) => store.setSettings({ theme: el.dataset.v }),
  async test() {
    const ok = await notify.test();
    await refreshPerm();
    toast(ok ? 'Notificação de teste em 5 segundos…' : 'Permita as notificações para testar.');
  },
  exact: () => notify.openExactAlarmSettings(),
  async 'gh-connect'() {
    const token = $('#gh-token')?.value.trim();
    if (!token) {
      ui.ghError = 'Cole o token do GitHub no campo acima.';
      renderSyncCard();
      return;
    }
    await connectWith(token);
  },
  async 'gh-outro'() {
    const outro = sync.tokenDeOutroApp();
    if (outro) await connectWith(outro.token, outro.nome);
  },
  async 'gh-sync'() {
    await sync.syncNow();
    toast(sync.status.state === 'error' ? sync.status.msg : 'Tudo sincronizado');
  },
  'gh-disconnect': () => armed('gh-disconnect', () => {
    sync.disconnect();
    toast('Desconectado. Os dados continuam neste aparelho.');
    render();
  }),
  'clear-day': () => armed('clear-day', () => { store.clearDay(); toast('Atividades de hoje desmarcadas'); }),
  restore: () => armed('restore', () => { store.restoreDefaults(); toast('Rotina padrão restaurada'); }),
  'toast-action'() {
    const fn = toastFn;
    hideToast();
    fn?.();
  },
  'sheet-close': () => closeSheet(),
  'sheet-save': () => saveSheet(),
  'sheet-day'(el) {
    const i = Number(el.dataset.d);
    draft.days = draft.days.includes(i) ? draft.days.filter((x) => x !== i) : [...draft.days, i];
    syncDays();
  },
  'sheet-days'(el) {
    draft.days = { all: [...store.ALL_DAYS], week: [1, 2, 3, 4, 5], weekend: [0, 6] }[el.dataset.v];
    syncDays();
  },
  'sheet-icon'(el) {
    draft.icon = el.dataset.icon;
    document.querySelectorAll('.icon-grid .on').forEach((b) => b.classList.remove('on'));
    el.classList.add('on');
    const prev = $('#f-preview > .ic');
    if (prev) prev.outerHTML = icon(draft.icon);
  },
  'sheet-delete'(el) {
    if (!el.classList.contains('armed')) {
      el.classList.add('armed');
      el.innerHTML = `${icon('trash')}Confirmar`;
      setTimeout(() => {
        if (el.isConnected) { el.classList.remove('armed'); el.innerHTML = `${icon('trash')}Excluir`; }
      }, 3500);
      return;
    }
    const task = store.findTask(draft.id);
    closeSheet();
    if (!task) return;
    store.removeTask(task.id);
    toast(`${task.name} excluída`, { label: 'Desfazer', fn: () => store.upsertTask(task) });
  },
};

// ---------------------------------------------------------------- toast
let toastTimer = null;
let toastFn = null;
function toast(msg, action) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" data-action="toast-action">${esc(action.label)}</button>` : ''}`;
  toastFn = action?.fn || null;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? 4500 : 2600);
}
function hideToast() {
  $('#toast').classList.remove('show');
  toastFn = null;
}

// ---------------------------------------------------------------- notificações (toque / "Concluir")
function onNotifyAction(kind, taskId, date) {
  if (kind === 'concluir' && taskId && store.findTask(taskId)) {
    const key = date || store.dateKey();
    if (!store.isDone(taskId, store.fromKey(key))) toggleTask(taskId, key);
  }
  if (draft) closeSheet();
  ui.tab = 'hoje';
  render();
}

// ---------------------------------------------------------------- eventos
let pressTimer = null;
let pressStart = null;
let suppressUntil = 0;

function bindEvents() {
  document.addEventListener('click', (e) => {
    if (Date.now() < suppressUntil) {
      suppressUntil = 0;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const el = e.target.closest('[data-action]');
    const fn = el && actions[el.dataset.action];
    if (!fn) return;
    e.preventDefault();
    fn(el, e);
  }, true);

  // Segurar um bloco = editar
  document.addEventListener('pointerdown', (e) => {
    const tile = e.target.closest('.tile[data-action="toggle"]');
    if (!tile) return;
    pressStart = { x: e.clientX, y: e.clientY };
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      pressTimer = null;
      suppressUntil = Infinity;
      vibrate(30);
      const t = store.findTask(tile.dataset.id);
      if (t) openSheet(t, false);
    }, 550);
  });
  const cancelPress = () => {
    clearTimeout(pressTimer);
    pressTimer = null;
    if (suppressUntil === Infinity) suppressUntil = Date.now() + 450;
  };
  document.addEventListener('pointermove', (e) => {
    if (pressTimer && pressStart && Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) > 10) cancelPress();
  });
  document.addEventListener('pointerup', cancelPress);
  document.addEventListener('pointercancel', cancelPress);
  document.addEventListener('contextmenu', (e) => { if (e.target.closest('.tile')) e.preventDefault(); });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'search') {
      ui.query = t.value;
      $('#search-clear').hidden = !t.value;
      renderView();
      $('#view').scrollTop = 0;
    } else if (t.id === 'f-name' && draft) {
      draft.name = t.value;
      $('#f-prev-name').textContent = t.value.trim() || 'Atividade';
    } else if (t.id === 'f-time' && draft) {
      draft.time = t.value.slice(0, 5);
      $('#f-prev-time').textContent = draft.time;
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.matches('[data-setting]')) {
      store.setSettings({ [t.dataset.setting]: t.checked });
      if (t.dataset.setting === 'notify' && t.checked && ui.perm === 'prompt') askPermission();
    } else if (t.id === 'set-name') {
      store.setSettings({ name: t.value.trim().slice(0, 24) });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (e.target.id === 'search' && ui.query.trim()) {
      e.preventDefault();
      actions.create();
    } else if (e.target.id === 'gh-token') {
      e.preventDefault();
      actions['gh-connect']();
    } else if (e.target.id === 'set-name' || e.target.id === 'f-name') {
      e.target.blur();
    }
  });

  window.addEventListener('popstate', () => { if (draft) closeSheet(true); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    tick(true);
    refreshPerm();
    notify.reschedule();
  });
}

// Atualiza contagens ("em 8 min", "atrasada") e vira o dia à meia-noite.
function tick(force = false) {
  const now = new Date();
  const day = store.dateKey(now);
  const minute = `${now.getHours()}:${now.getMinutes()}`;
  if (day !== ui.day) {
    ui.day = day;
    force = true;
    notify.reschedule();
  }
  if (force || minute !== ui.minute) {
    ui.minute = minute;
    renderHeader(now);
    if (ui.tab === 'hoje' && !ui.query.trim()) renderView();
  }
  notify.webTick(now);
}

// ---------------------------------------------------------------- início
async function init() {
  store.load();
  document.querySelectorAll('[data-icon]').forEach((el) => { el.outerHTML = icon(el.dataset.icon); });
  bindEvents();
  store.subscribe((_state, meta) => {
    render();
    notify.reschedule();
    if (!meta.fromSync) sync.schedule();
  });
  sync.onStatus(() => {
    renderSyncInd();
    if (ui.tab === 'ajustes') renderSyncCard();
  });
  ui.day = store.dateKey();
  render();
  sync.start();

  await notify.init(onNotifyAction);
  await refreshPerm();

  // No APK, pede a permissão de notificação logo na primeira abertura.
  const s = store.get().settings;
  if (notify.isNative && ui.perm === 'prompt' && !s.askedPerm) {
    store.setSettings({ askedPerm: true });
    await askPermission();
  }
  notify.reschedule();

  // Versão web: "Concluir" tocado numa notificação com o app fechado
  const params = new URLSearchParams(location.search);
  if (params.get('concluir')) {
    onNotifyAction('concluir', params.get('concluir'), params.get('data'));
    history.replaceState(null, '', location.pathname);
  }

  setInterval(tick, 15000);
}

init();
