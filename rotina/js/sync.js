// Sincroniza a rotina entre aparelhos usando o repositório privado ENZO-IRM-O como "nuvem".
// O app grava rotina.json na branch "dados" pela API do GitHub, com um token (fine-grained,
// "Contents: Read and write") que fica salvo só no aparelho — o mesmo esquema do Mini Escritório.
// Cada atividade/marcação tem carimbo de tempo: ao juntar, vale sempre a mudança mais recente.
import * as store from './store.js';

const KEY = 'kwik-rotina-github';
export const REPO_PADRAO = 'kauabreno88-spec/ENZO-IRM-O';
const BRANCH_PADRAO = 'dados';
const FILE = 'rotina.json';
const PULL_EVERY_MS = 60000;
const OUTROS = [
  ['kwik-mini-github', 'Mini Escritório'],
  ['kwik-despesas-github', 'KWIK Fiscal'],
  ['kwik-folha-github', 'KWIK Folha'],
];

export const status = { state: 'off', at: null, msg: '' }; // off | syncing | ok | error
const listeners = new Set();
export const onStatus = (fn) => listeners.add(fn);
function setStatus(patch) {
  Object.assign(status, patch);
  listeners.forEach((fn) => fn(status));
}

// ---------------------------------------------------------------- configuração
export function conf() {
  const base = { repo: REPO_PADRAO, branch: BRANCH_PADRAO, token: '', synced: false };
  try { return { ...base, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return base; }
}
const saveConf = (c) => localStorage.setItem(KEY, JSON.stringify(c));
export const connected = () => !!conf().token;

export function tokenDeOutroApp() {
  for (const [k, nome] of OUTROS) {
    try {
      const t = JSON.parse(localStorage.getItem(k) || '{}').token;
      if (t) return { nome, token: t };
    } catch { /* nada */ }
  }
  return null;
}

// ---------------------------------------------------------------- API do GitHub
function msgErro(st, j) {
  const repo = conf().repo.split('/')[1];
  if (st === 401) return 'Token inválido ou vencido. Gere um novo e conecte de novo.';
  if (st === 403) return `O token não tem permissão. Ele precisa de "Contents: Read and write" no repositório ${repo}.`;
  if (st === 404) return `Repositório não encontrado. O token tem acesso ao ${repo}?`;
  return (j && j.message) || `Erro ${st} do GitHub`;
}

async function req(method, path, body) {
  const c = conf();
  let r;
  try {
    r = await fetch(`https://api.github.com/repos/${c.repo}${path}`, {
      method,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${c.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const e = new Error('Sem internet agora. Os dados ficam guardados e sincronizam depois.');
    e.offline = true;
    throw e;
  }
  if (r.status === 404 && method === 'GET' && path.startsWith('/contents/')) return null;
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    const e = new Error(msgErro(r.status, j));
    e.status = r.status;
    throw e;
  }
  return r.status === 204 ? {} : r.json();
}

function toB64(text) {
  const bytes = new TextEncoder().encode(text);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromB64(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
}

async function ensureBranch() {
  const c = conf();
  try {
    await req('GET', `/branches/${encodeURIComponent(c.branch)}`);
    return;
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  const repo = await req('GET', '');
  const base = await req('GET', `/git/ref/heads/${encodeURIComponent(repo.default_branch)}`);
  await req('POST', '/git/refs', { ref: `refs/heads/${c.branch}`, sha: base.object.sha });
}

async function readRemote() {
  const c = conf();
  const j = await req('GET', `/contents/${FILE}?ref=${encodeURIComponent(c.branch)}&t=${Date.now()}`);
  if (!j) return { data: null, sha: null };
  if (j.encoding !== 'base64' || typeof j.content !== 'string') throw new Error('Arquivo da nuvem em formato inesperado.');
  return { data: JSON.parse(fromB64(j.content)), sha: j.sha };
}

// ---------------------------------------------------------------- junção (merge)
const normalize = (d) => ({
  tasks: Array.isArray(d?.tasks) ? d.tasks : [],
  removed: d?.removed && typeof d.removed === 'object' ? d.removed : {},
  done: d?.done && typeof d.done === 'object' ? d.done : {},
  name: d?.name || '',
  nameT: Number(d?.nameT) || 0,
});

// JSON com chaves em ordem fixa, para comparar dois estados.
function canon(v) {
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v ?? null);
}
const canonShared = (d) => canon({ ...d, tasks: [...d.tasks].sort((a, b) => (a.id < b.id ? -1 : 1)) });

export function mergeShared(aIn, bIn) {
  const a = normalize(aIn);
  const b = normalize(bIn);
  const tasks = new Map();
  for (const t of [...a.tasks, ...b.tasks]) {
    const cur = tasks.get(t.id);
    const tu = Number(t.upd) || 0;
    const cu = cur ? Number(cur.upd) || 0 : -1;
    if (!cur || tu > cu || (tu === cu && canon(t) > canon(cur))) tasks.set(t.id, t);
  }
  const removed = { ...a.removed };
  for (const [id, t] of Object.entries(b.removed)) if (!(removed[id] >= t)) removed[id] = t;
  const alive = [...tasks.values()].filter((t) => !(removed[t.id] >= (Number(t.upd) || 0)));

  const done = {};
  for (const src of [a.done, b.done]) {
    for (const [day, marks] of Object.entries(src)) {
      if (!marks || typeof marks !== 'object' || Array.isArray(marks)) continue;
      const out = (done[day] ||= {});
      for (const [id, t] of Object.entries(marks)) {
        const cur = out[id];
        if (cur === undefined || Math.abs(t) > Math.abs(cur) || (Math.abs(t) === Math.abs(cur) && t > cur)) out[id] = t;
      }
    }
  }
  const nm = b.nameT > a.nameT ? b : a;
  return { tasks: alive.sort((x, y) => (x.id < y.id ? -1 : 1)), removed, done, name: nm.name, nameT: nm.nameT };
}

// ---------------------------------------------------------------- sincronização
const aparelho = () => (/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ? 'celular' : 'computador');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let lastCanon = null;
let running = null;
let again = false;
let timer = null;

async function doSync({ adopt = false } = {}) {
  if (!connected()) return;
  setStatus({ state: 'syncing', msg: '' });
  try {
    for (let n = 0; ; n++) {
      const { data, sha } = await readRemote();
      const local = store.exportShared();
      const remote = data ? normalize(data) : null;
      const merged = remote ? (adopt ? mergeShared(remote, {}) : mergeShared(local, remote)) : mergeShared(local, {});
      const mc = canonShared(merged);
      if (mc !== canonShared(normalize(local))) store.applyShared(merged);
      if (!remote || mc !== canonShared(mergeShared(remote, {}))) {
        const body = { app: 'rotina-kwik', versao: 2, atualizado: new Date().toISOString(), ...merged };
        try {
          await req('PUT', `/contents/${FILE}`, {
            message: `Rotina: atualização (${aparelho()})`,
            content: toB64(JSON.stringify(body, null, 1)),
            branch: conf().branch,
            ...(sha ? { sha } : {}),
          });
        } catch (e) {
          if (n < 3 && [409, 422].includes(e.status)) { await wait(700 * (n + 1)); continue; }
          throw e;
        }
      }
      lastCanon = mc;
      break;
    }
    if (!conf().synced) saveConf({ ...conf(), synced: true });
    setStatus({ state: 'ok', at: new Date(), msg: '' });
  } catch (e) {
    setStatus({ state: 'error', msg: e.message || 'Não foi possível sincronizar.' });
  }
}

/** Sincroniza agora (junta o que há na nuvem com o deste aparelho). Nunca lança erro: veja `status`. */
export function syncNow(opts) {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      let o = opts;
      do {
        again = false;
        await doSync(o);
        o = undefined;
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Chamado a cada mudança local: envia em ~1,5 s (agrupando toques seguidos). */
export function schedule() {
  if (!connected()) return;
  if (lastCanon && canonShared(normalize(store.exportShared())) === lastCanon) return;
  clearTimeout(timer);
  timer = setTimeout(() => syncNow(), 1500);
}

/** Conecta com o token. Se já existir uma rotina na nuvem, este aparelho passa a usá-la. */
export async function connect(token) {
  const prev = conf();
  saveConf({ ...prev, token: token.trim(), synced: false });
  try {
    await req('GET', '');
    await ensureBranch();
  } catch (e) {
    saveConf(prev);
    throw e;
  }
  const { data } = await readRemote();
  await syncNow({ adopt: !!data });
  if (status.state === 'error') throw new Error(status.msg);
  return { adopted: !!data };
}

export function disconnect() {
  localStorage.removeItem(KEY);
  lastCanon = null;
  clearTimeout(timer);
  setStatus({ state: 'off', at: null, msg: '' });
}

/** Começa a sincronizar: agora, a cada minuto com o app aberto e ao voltar para o app. */
export function start() {
  if (connected()) syncNow();
  setInterval(() => { if (connected() && !document.hidden) syncNow(); }, PULL_EVERY_MS);
  document.addEventListener('visibilitychange', () => { if (connected() && !document.hidden) syncNow(); });
  window.addEventListener('online', () => { if (connected()) syncNow(); });
}
