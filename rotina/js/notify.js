// Lembretes das atividades.
// - No APK Android: notificações nativas agendadas no sistema (chegam com o app fechado e o celular bloqueado).
// - No navegador (PWA): notificações enquanto o app está aberto ou em segundo plano.
import * as store from './store.js';

const Cap = window.Capacitor;
export const isNative = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
const LN = isNative ? Cap.Plugins?.LocalNotifications : null;

const CHANNEL = 'lembretes';
const ACTION_TYPE = 'TAREFA';
const TEST_ID = 999;
const DAYS_AHEAD = 7;      // agenda a próxima semana; reagendado sempre que o app abre ou muda algo
const MAX_PENDING = 400;   // alguns Android limitam ~500 alarmes por app
const NOW_WINDOW_MIN = 10; // web: aviso "agora" vale por 10 min depois do horário
const FIRED_KEY = 'rotina-kwik:avisados';

let swReg = null;
let timer = null;
let queue = Promise.resolve();
let onAction = () => {};

export async function init(handler) {
  onAction = handler;
  if (LN) {
    try {
      await LN.createChannel({
        id: CHANNEL, name: 'Lembretes de atividades',
        description: 'Avisos antes e na hora de cada atividade',
        importance: 5, visibility: 1, vibration: true, lights: true, lightColor: '#2BBE50',
      });
    } catch (e) { console.warn('canal', e); }
    try {
      await LN.registerActionTypes({
        types: [{ id: ACTION_TYPE, actions: [{ id: 'concluir', title: '✓ Concluir' }] }],
      });
    } catch (e) { console.warn('ações', e); }
    LN.addListener('localNotificationActionPerformed', (ev) => {
      const extra = ev?.notification?.extra || {};
      onAction(ev?.actionId === 'concluir' ? 'concluir' : 'abrir', extra.taskId, extra.date);
    });
  } else if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    try { swReg = await navigator.serviceWorker.register('sw.js'); } catch (e) { console.warn('sw', e); }
    navigator.serviceWorker.addEventListener('message', (ev) => {
      if (ev.data?.type === 'concluir') onAction('concluir', ev.data.taskId, ev.data.date);
    });
  }
}

/** 'granted' | 'denied' | 'prompt' | 'unsupported' */
export async function permission() {
  if (LN) {
    try {
      const { display } = await LN.checkPermissions();
      return display === 'prompt-with-rationale' ? 'prompt' : display;
    } catch { return 'unsupported'; }
  }
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission === 'default' ? 'prompt' : Notification.permission;
}

export async function requestPermission() {
  if (LN) {
    try {
      const { display } = await LN.requestPermissions();
      reschedule();
      return display === 'prompt-with-rationale' ? 'prompt' : display;
    } catch { return 'unsupported'; }
  }
  if (!('Notification' in window)) return 'unsupported';
  const r = await Notification.requestPermission();
  return r === 'default' ? 'prompt' : r;
}

/** Android 12+: alarmes exatos ('granted' | 'denied'), ou null quando não se aplica. */
export async function exactAlarm() {
  if (!LN?.checkExactNotificationSetting) return null;
  try { return (await LN.checkExactNotificationSetting()).exact_alarm ?? null; } catch { return null; }
}
export async function openExactAlarmSettings() {
  try { await LN.changeExactNotificationSetting(); } catch (e) { console.warn(e); }
}

export function texts(kind, task, minutes) {
  return kind === 'soon'
    ? { title: `⏰ Em ${minutes} min: ${task.name}`, body: `Começa às ${task.time}. Já vai se preparando!` }
    : { title: `🔴 Agora: ${task.name}`, body: `São ${task.time}. Toque em “Concluir” quando terminar.` };
}

// Próximos avisos a partir de agora (somente atividades ainda não concluídas).
function plan(now = new Date()) {
  const s = store.get().settings;
  const items = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = new Date(now);
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() + i);
    const key = store.dateKey(day);
    for (const task of store.tasksFor(day)) {
      if (task.remind === false || store.isDone(task.id, day)) continue;
      const when = store.at(day, task.time);
      if (s.lead > 0) {
        const soon = new Date(when.getTime() - s.lead * 60000);
        if (soon > now) items.push({ kind: 'soon', at: soon, task, key });
      }
      if (s.atTime && when > now) items.push({ kind: 'now', at: when, task, key });
    }
  }
  return items.sort((a, b) => a.at - b.at).slice(0, MAX_PENDING);
}

async function syncNative() {
  const { notifications: pending = [] } = await LN.getPending();
  const old = pending.filter((n) => Number(n.id) !== TEST_ID).map((n) => ({ id: Number(n.id) }));
  if (old.length) await LN.cancel({ notifications: old });

  const s = store.get().settings;
  if (!s.notify || (await permission()) !== 'granted') return;

  const notifications = plan().map((p, i) => ({
    id: 1000 + i,
    ...texts(p.kind, p.task, s.lead),
    schedule: { at: p.at, allowWhileIdle: true },
    channelId: CHANNEL,
    actionTypeId: ACTION_TYPE,
    smallIcon: 'ic_stat_kwik',
    iconColor: '#2BBE50',
    extra: { taskId: p.task.id, date: p.key, kind: p.kind },
  }));
  if (notifications.length) await LN.schedule({ notifications });
}

/** Reagenda todos os lembretes nativos (com pequeno atraso para agrupar mudanças seguidas). */
export function reschedule() {
  if (!LN) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    queue = queue.then(syncNative).catch((e) => console.warn('lembretes', e));
  }, 400);
}

/** Tira da barra de notificações os avisos de uma atividade que acabou de ser concluída. */
export async function dismiss(task) {
  if (!LN || !task) return;
  try {
    const { notifications = [] } = await LN.getDeliveredNotifications();
    const mine = notifications.filter((n) => (n.title || '').endsWith(`: ${task.name}`));
    if (mine.length) await LN.removeDeliveredNotifications({ notifications: mine });
  } catch (e) { console.warn(e); }
}

// ---------- Navegador ----------
function loadFired() {
  try { return JSON.parse(localStorage.getItem(FIRED_KEY) || '{}'); } catch { return {}; }
}
function saveFired(fired, today) {
  for (const k of Object.keys(fired)) if (!k.startsWith(today)) delete fired[k];
  try { localStorage.setItem(FIRED_KEY, JSON.stringify(fired)); } catch { /* ignore */ }
}

async function showWeb(title, body, data) {
  const opts = {
    body, data, tag: data?.taskId ? `${data.date}|${data.taskId}` : 'rotina-kwik',
    icon: 'img/icon-192.png', badge: 'img/badge-96.png', vibrate: [200, 100, 200],
  };
  try {
    const reg = swReg || (await navigator.serviceWorker?.getRegistration());
    if (reg) {
      await reg.showNotification(title, data?.taskId ? { ...opts, actions: [{ action: 'concluir', title: '✓ Concluir' }] } : opts);
      return;
    }
  } catch (e) { console.warn(e); }
  try { new Notification(title, opts); } catch (e) { console.warn(e); }
}

/** Chamado a cada ~15 s pelo app na versão web: dispara os avisos que chegaram na hora. */
export function webTick(now = new Date()) {
  if (LN) return;
  const s = store.get().settings;
  if (!s.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
  const today = store.dateKey(now);
  const fired = loadFired();
  let changed = false;
  for (const task of store.tasksFor(now)) {
    if (task.remind === false || store.isDone(task.id, now)) continue;
    const when = store.at(now, task.time).getTime();
    const t = now.getTime();
    const base = `${today}|${task.id}`;
    if (s.lead > 0 && t >= when - s.lead * 60000 && t < when && !fired[`${base}|soon`]) {
      fired[`${base}|soon`] = 1; changed = true;
      const { title, body } = texts('soon', task, Math.max(1, Math.ceil((when - t) / 60000)));
      showWeb(title, body, { taskId: task.id, date: today });
    }
    if (s.atTime && t >= when && t < when + NOW_WINDOW_MIN * 60000 && !fired[`${base}|now`]) {
      fired[`${base}|now`] = 1; changed = true;
      const { title, body } = texts('now', task);
      showWeb(title, body, { taskId: task.id, date: today });
    }
  }
  if (changed) saveFired(fired, today);
}

/** Envia uma notificação de teste em 5 segundos. Retorna false se não houver permissão. */
export async function test() {
  let perm = await permission();
  if (perm !== 'granted') perm = await requestPermission();
  if (perm !== 'granted') return false;
  const title = '✅ Tudo certo!';
  const body = 'Os lembretes da Rotina KWIK estão funcionando.';
  if (LN) {
    await LN.schedule({
      notifications: [{
        id: TEST_ID, title, body, channelId: CHANNEL, smallIcon: 'ic_stat_kwik', iconColor: '#2BBE50',
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
      }],
    });
  } else {
    setTimeout(() => showWeb(title, body, null), 5000);
  }
  return true;
}
