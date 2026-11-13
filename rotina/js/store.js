// Estado do app (rotina, conclusões por dia e ajustes), salvo no próprio aparelho.
// Cada mudança leva um carimbo de tempo, para que celular e computador possam ser
// sincronizados sem que uma marcação apague a outra (ver sync.js).
import { DEFAULT_TASKS } from './catalog.js';

const KEY = 'rotina-kwik:v1';
const KEEP_DAYS = 60;
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const DEFAULT_SETTINGS = { name: '', nameT: 0, notify: true, lead: 10, atTime: true, theme: 'dark' };

export const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toMin = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export function at(day, hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  const d = new Date(day);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
export const uid = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Atividades sugeridas têm id fixo: dois aparelhos novos geram a mesma rotina (sem duplicar ao sincronizar).
const freshTasks = (upd) => DEFAULT_TASKS.map(([name, icon, time]) => ({
  id: `p-${slug(name)}`, name, icon, time, days: [...ALL_DAYS], remind: true, upd,
}));

let state = null;
const subs = new Set();
let lastStamp = 0;
// Carimbo de tempo sempre crescente (evita empate quando duas mudanças caem no mesmo milissegundo).
const stamp = () => (lastStamp = Math.max(Date.now(), lastStamp + 1));

export function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { s = null; }
  if (!s || !Array.isArray(s.tasks)) s = { tasks: freshTasks(1), done: {}, removed: {} };
  const now = Date.now();
  s.settings = { ...DEFAULT_SETTINGS, ...(s.settings || {}) };
  if (!s.settings.nameT && s.settings.name) s.settings.nameT = now;
  s.removed = s.removed && typeof s.removed === 'object' ? s.removed : {};
  const done = s.done && typeof s.done === 'object' ? s.done : {};
  // formato antigo: { dia: [ids] }  →  novo: { dia: { id: carimbo } } (positivo = feito, negativo = desfeito)
  for (const [k, v] of Object.entries(done)) {
    if (Array.isArray(v)) done[k] = Object.fromEntries(v.map((id) => [id, now]));
    else if (!v || typeof v !== 'object') delete done[k];
  }
  s.done = done;
  s.tasks = s.tasks.filter((t) => t && t.id && t.name).map((t) => ({
    remind: true, icon: 'calendar-check', time: '08:00', ...t,
    days: Array.isArray(t.days) ? t.days : [...ALL_DAYS],
    upd: Number(t.upd) || 1,
  }));
  state = s;
  prune();
  persist();
  return state;
}

export const get = () => state;
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* armazenamento cheio/bloqueado */ }
}
export function commit(meta = {}) {
  persist();
  subs.forEach((fn) => fn(state, meta));
}
export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

function prune() {
  const limit = new Date();
  limit.setDate(limit.getDate() - KEEP_DAYS);
  const min = dateKey(limit);
  for (const k of Object.keys(state.done)) if (k < min) delete state.done[k];
  const minT = limit.getTime();
  for (const [id, t] of Object.entries(state.removed)) if (t < minT) delete state.removed[id];
}

export const sortByTime = (a, b) => toMin(a.time) - toMin(b.time) || a.name.localeCompare(b.name, 'pt-BR');
export const findTask = (id) => state.tasks.find((t) => t.id === id);

export function tasksFor(day = new Date()) {
  const wd = day.getDay();
  return state.tasks.filter((t) => t.days.includes(wd)).sort(sortByTime);
}
export const isDone = (id, day = new Date()) => (state.done[dateKey(day)]?.[id] || 0) > 0;

export function setDone(id, value, key = dateKey()) {
  const day = (state.done[key] ||= {});
  const t = Math.max(stamp(), Math.abs(day[id] || 0) + 1);
  day[id] = value ? t : -t;
  commit();
}

export function upsertTask(task) {
  const clean = { ...task, name: task.name.trim(), days: [...task.days].sort(), upd: stamp() };
  if (!clean.id) clean.id = uid();
  const i = state.tasks.findIndex((t) => t.id === clean.id);
  if (i >= 0) state.tasks[i] = clean;
  else state.tasks.push(clean);
  delete state.removed[clean.id];
  commit();
}

export function removeTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  state.removed[id] = stamp();
  commit();
}

export function setSettings(patch) {
  if ('name' in patch) patch = { ...patch, nameT: stamp() };
  Object.assign(state.settings, patch);
  commit();
}

export function clearDay(key = dateKey()) {
  const day = (state.done[key] ||= {});
  for (const id of Object.keys(day)) if (day[id] > 0) day[id] = -Math.max(stamp(), day[id] + 1);
  commit();
}

export function restoreDefaults() {
  for (const t of state.tasks) state.removed[t.id] = stamp();
  state.tasks = freshTasks(stamp());
  for (const t of state.tasks) delete state.removed[t.id];
  const today = (state.done[dateKey()] ||= {});
  for (const id of Object.keys(today)) if (today[id] > 0) today[id] = -stamp();
  commit();
}

// ---------- Dados compartilhados entre aparelhos (o resto dos ajustes é de cada aparelho) ----------
export function exportShared() {
  return JSON.parse(JSON.stringify({
    tasks: state.tasks, removed: state.removed, done: state.done,
    name: state.settings.name, nameT: state.settings.nameT,
  }));
}

export function applyShared(shared) {
  state.tasks = shared.tasks;
  state.removed = shared.removed;
  state.done = shared.done;
  state.settings.name = shared.name || '';
  state.settings.nameT = shared.nameT || 0;
  prune();
  commit({ fromSync: true });
}

// Dias seguidos com a rotina 100% concluída (conta hoje só se já estiver completo).
export function streak(today = new Date()) {
  const complete = (day) => {
    const list = tasksFor(day);
    return list.length > 0 && list.every((t) => isDone(t.id, day));
  };
  const d = new Date(today);
  d.setHours(12, 0, 0, 0);
  if (!complete(d)) d.setDate(d.getDate() - 1);
  let n = 0;
  for (let i = 0; i < KEEP_DAYS; i++) {
    if (tasksFor(d).length) {
      if (!complete(d)) break;
      n++;
    }
    d.setDate(d.getDate() - 1);
  }
  return n;
}
