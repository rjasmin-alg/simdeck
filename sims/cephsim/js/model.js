// SPDX-License-Identifier: AGPL-3.0-or-later
// The cluster document, undo history, selection and autosave.
//
// The whole cluster is one plain-JSON `doc`. Undo is snapshot based: cheap, and
// impossible to get subtly wrong, which matters more here than memory does.
// Adapted from ../topologydrafter/js/state.js, which has earned its keep.
//
// No DOM in this file, so node can exercise it. localStorage is feature-tested
// for the same reason.

export const DOC_VERSION = 1;
const AUTOSAVE_KEY = 'cephsim.autosave.v1';
const PREFS_KEY = 'cephsim.prefs.v1';
const MAX_HISTORY = 120;

const hasStorage = typeof localStorage !== 'undefined';

let idSeq = 0;
export function uid(prefix = 'x') {
  idSeq += 1;
  return `${prefix}${Date.now().toString(36).slice(-4)}${idSeq.toString(36)}`;
}

/** Bucket types above `host` that a CRUSH tree may use, coarse to fine. */
export const BUCKET_TYPES = ['root', 'region', 'zone', 'datacenter', 'room', 'pod', 'rack'];

export function newDoc(title = 'Untitled cluster') {
  const rootId = 'bkroot';
  return {
    version: DOC_VERSION,
    title,
    buckets: [{ id: rootId, name: 'default', type: 'root', parent: null }],
    hosts: [],
    switches: [],
    links: [],
    rules: [
      { id: 0, name: 'replicated_rule', type: 'replicated', root: 'default', class: null,
        failureDomain: 'host', mode: 'firstn' },
    ],
    pools: [],
    fs: [],
    rbd: [],
    rgw: [],
    settings: {
      skew: 0.25,            // per-PG size variance; 0 makes every PG identical
      publicSpeed: 25,       // Gb/s defaults for newly drawn links
      clusterSpeed: 25,
      maxBackfills: 1,       // osd_max_backfills
      recoveryFraction: 0.5, // share of a link a recovery may use
    },
  };
}

export const state = {
  doc: newDoc(),
  selection: new Set(),
  view: { x: 0, y: 0, k: 1 },
  tab: 'physical',        // physical | crush | osdmap | console
  tool: 'select',         // select | link | pan
  linkNet: 'public',
  placing: null,          // catalog key queued for click-to-place
  snap: 10,
  snapOn: true,
  theme: 'dark',
  showGrid: true,
  present: false,
  down: new Set(),        // osd ids explicitly marked down
  filePath: null,
  dirty: false,
  // Set by main.js after each evaluate(); the renderer reads it for OSD fill.
  // Kept here rather than imported to avoid a render <-> main import cycle.
  derived: null,
  overlay: '',            // transient SVG (marquee, link preview) from interact.js
};

// ---------------------------------------------------------------- events ----
const listeners = new Map();
export function on(evt, fn) {
  if (!listeners.has(evt)) listeners.set(evt, new Set());
  listeners.get(evt).add(fn);
  return () => listeners.get(evt).delete(fn);
}
export function emit(evt, payload) {
  const set = listeners.get(evt);
  if (set) for (const fn of set) fn(payload);
}

/**
 * Redraw everything that derives from state.
 *
 * `structural` means the CRUSH map changed shape, weight or rule — the only
 * thing that justifies a remap. Moving a box on the canvas does not.
 */
export function changed({ structural = true, remap = true } = {}) {
  if (structural) state.dirty = true;
  if (remap) emit('remap');
  emit('change');
  scheduleAutosave();
}

// --------------------------------------------------------------- history ----
const past = [];
const future = [];
let pendingSnapshot = null;

/** Snapshot *before* mutating: commit(), then mutate, then changed(). */
export function commit(label = 'edit') {
  past.push({ label, doc: JSON.stringify(state.doc) });
  if (past.length > MAX_HISTORY) past.shift();
  future.length = 0;
  pendingSnapshot = null;
}

/** For drags: snapshot at gesture start, keep it only if anything moved. */
export function beginGesture(label = 'move') {
  pendingSnapshot = { label, doc: JSON.stringify(state.doc) };
}
export function endGesture() {
  if (!pendingSnapshot) return;
  if (pendingSnapshot.doc !== JSON.stringify(state.doc)) {
    past.push(pendingSnapshot);
    if (past.length > MAX_HISTORY) past.shift();
    future.length = 0;
  }
  pendingSnapshot = null;
}
export function cancelGesture() { pendingSnapshot = null; }

export function undo() {
  const entry = past.pop();
  if (!entry) return false;
  future.push({ label: entry.label, doc: JSON.stringify(state.doc) });
  state.doc = JSON.parse(entry.doc);
  pruneSelection();
  changed();
  return true;
}
export function redo() {
  const entry = future.pop();
  if (!entry) return false;
  past.push({ label: entry.label, doc: JSON.stringify(state.doc) });
  state.doc = JSON.parse(entry.doc);
  pruneSelection();
  changed();
  return true;
}
export const canUndo = () => past.length > 0;
export const canRedo = () => future.length > 0;
export function resetHistory() { past.length = 0; future.length = 0; pendingSnapshot = null; }

// ------------------------------------------------------------- accessors ----
export const hostById = (id) => state.doc.hosts.find((h) => h.id === id);
export const switchById = (id) => state.doc.switches.find((s) => s.id === id);
export const bucketById = (id) => state.doc.buckets.find((b) => b.id === id);
export const linkById = (id) => state.doc.links.find((l) => l.id === id);
export const poolById = (id) => state.doc.pools.find((p) => p.id === id);

export function allOsds(doc = state.doc) {
  const out = [];
  for (const h of doc.hosts) for (const o of h.osds) out.push({ ...o, host: h });
  return out;
}
export function osdById(id, doc = state.doc) {
  for (const h of doc.hosts) {
    const o = h.osds.find((d) => d.id === id);
    if (o) return { osd: o, host: h };
  }
  return null;
}

/** Next free osd number. Numbers are never reused, as on a real cluster. */
export function nextOsdId(doc = state.doc) {
  let max = -1;
  for (const h of doc.hosts) for (const o of h.osds) if (o.id > max) max = o.id;
  return max + 1;
}

// Pools and rules are numbered from 0, exactly as OSDs are, so their selection
// keys are prefixed. A bare number in the selection is always an OSD.
export const poolKey = (id) => `pool:${id}`;
export const ruleKey = (id) => `rule:${id}`;
export const ruleById = (id) => state.doc.rules.find((r) => r.id === id);

export function kindOf(id) {
  if (typeof id === 'number') return 'osd';
  if (typeof id === 'string' && id.startsWith('pool:')) return 'pool';
  if (typeof id === 'string' && id.startsWith('rule:')) return 'rule';
  if (typeof id === 'string' && id.startsWith('fs:')) return 'fs';
  if (typeof id === 'string' && id.startsWith('rbd:')) return 'rbd';
  if (typeof id === 'string' && id.startsWith('rgw:')) return 'rgw';
  if (state.doc.hosts.some((h) => h.id === id)) return 'host';
  if (state.doc.switches.some((s) => s.id === id)) return 'switch';
  if (state.doc.links.some((l) => l.id === id)) return 'link';
  if (state.doc.buckets.some((b) => b.id === id)) return 'bucket';
  return null;
}
export const findItem = (id) => {
  switch (kindOf(id)) {
    case 'osd': return osdById(id)?.osd ?? null;
    case 'host': return hostById(id);
    case 'switch': return switchById(id);
    case 'link': return linkById(id);
    case 'bucket': return bucketById(id);
    case 'pool': return poolById(Number(String(id).slice(5)));
    case 'rule': return ruleById(Number(String(id).slice(5)));
    case 'fs': return fsById(Number(String(id).slice(3)));
    case 'rbd': return rbdById(Number(String(id).slice(4)));
    case 'rgw': return rgwById(Number(String(id).slice(4)));
    default: return null;
  }
};

export function pruneSelection() {
  for (const id of [...state.selection]) if (!findItem(id)) state.selection.delete(id);
}
export function select(ids, { additive = false, toggle = false } = {}) {
  const list = Array.isArray(ids) ? ids : [ids];
  if (!additive && !toggle) state.selection.clear();
  for (const id of list) {
    if (id === null || id === undefined) continue;
    if (toggle && state.selection.has(id)) state.selection.delete(id);
    else state.selection.add(id);
  }
  emit('selection');
  emit('change');
}
export function clearSelection() {
  if (!state.selection.size) return;
  state.selection.clear();
  emit('selection');
  emit('change');
}

// ------------------------------------------------------------- mutations ----
export function addBucketNode(name, type, parent = null) {
  const b = { id: uid('bk'), name, type, parent };
  state.doc.buckets.push(b);
  return b;
}

export function addHost(name, x, y, { parent = null, osds = [], daemons = [] } = {}) {
  const host = {
    id: uid('h'),
    name: name || `host${state.doc.hosts.length + 1}`,
    x, y,
    parent: parent ?? state.doc.buckets.find((b) => b.type === 'root')?.id ?? null,
    up: true,
    daemons: [...daemons],
    osds: [],
  };
  state.doc.hosts.push(host);
  for (const spec of osds) addOsd(host, spec);
  return host;
}

export function addOsd(host, { size = 8, cls = 'hdd' } = {}) {
  const id = nextOsdId();
  const osd = {
    id,
    size,                 // TiB — this is the CRUSH weight
    class: cls,
    up: true,
    in: true,
    reweight: 1,
  };
  host.osds.push(osd);
  return osd;
}

export function addSwitchNode(name, x, y, { speed = 25, ports = 48 } = {}) {
  const sw = {
    id: uid('sw'),
    name: name || `sw${state.doc.switches.length + 1}`,
    x, y, speed, ports, up: true,
  };
  state.doc.switches.push(sw);
  return sw;
}

export function addLink(a, b, net = state.linkNet, overrides = {}) {
  if (!a || !b || a === b) return null;
  const dup = state.doc.links.filter(
    (l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
  const link = {
    id: uid('lk'),
    a, b, net,
    speed: net === 'cluster' ? state.doc.settings.clusterSpeed : state.doc.settings.publicSpeed,
    up: true,
    // Parallel links are normal (redundant uplinks); nudge them apart so both show.
    offset: dup.length * 14,
    ...overrides,
  };
  state.doc.links.push(link);
  return link;
}

/** Next free pool id. Ceph never reuses a pool id either. */
export function nextPoolId(doc = state.doc) {
  return doc.pools.reduce((m, p) => Math.max(m, p.id), 0) + 1;
}
export function uniqueName(base, taken) {
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}${n}`)) n++;
  return `${base}${n}`;
}

export function addPool(overrides = {}) {
  const d = state.doc;
  const pool = {
    id: nextPoolId(),
    name: uniqueName('pool', d.pools.map((p) => p.name)),
    type: 'replicated',
    size: 3, min_size: 2,
    pg_num: 128, pgp_num: 128,
    crush_rule: d.rules[0]?.name ?? 'replicated_rule',
    stored: 0,
    ...overrides,
  };
  if (pool.type === 'erasure') {
    pool.k = pool.k ?? 4;
    pool.m = pool.m ?? 2;
    pool.min_size = overrides.min_size ?? pool.k;
  }
  d.pools.push(pool);
  return pool;
}

export const fsKey = (id) => `fs:${id}`;
export const rbdKey = (id) => `rbd:${id}`;
export const rgwKey = (id) => `rgw:${id}`;
export const fsById = (id) => state.doc.fs.find((f) => f.id === id);
export const rbdById = (id) => state.doc.rbd.find((r) => r.id === id);
export const rgwById = (id) => state.doc.rgw.find((g) => g.id === id);

const nextIdIn = (list) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1;

export function addFs(overrides = {}) {
  const d = state.doc;
  const pools = d.pools.map((p) => p.name);
  const fs = {
    id: nextIdIn(d.fs),
    name: uniqueName('cephfs', d.fs.map((f) => f.name)),
    dataPool: pools.find((n) => /data/.test(n)) ?? pools[0] ?? '',
    metaPool: pools.find((n) => /meta/.test(n)) ?? pools[0] ?? '',
    maxMds: 1,
    ...overrides,
  };
  d.fs.push(fs);
  return fs;
}

export function addRbd(overrides = {}) {
  const d = state.doc;
  const img = {
    id: nextIdIn(d.rbd),
    name: uniqueName('image', d.rbd.map((r) => r.name)),
    pool: d.pools[0]?.name ?? '',
    provisioned: 10 * 1024 ** 4,
    used: 2 * 1024 ** 4,
    thin: true,
    ...overrides,
  };
  d.rbd.push(img);
  return img;
}

export function addRgw(overrides = {}) {
  const d = state.doc;
  const pools = d.pools.map((p) => p.name);
  const gw = {
    id: nextIdIn(d.rgw),
    name: uniqueName('s3', d.rgw.map((g) => g.name)),
    dataPool: pools.find((n) => /data|ec/.test(n)) ?? pools[0] ?? '',
    indexPool: pools.find((n) => /meta|index/.test(n)) ?? pools[0] ?? '',
    buckets: 12,
    ...overrides,
  };
  d.rgw.push(gw);
  return gw;
}

export function addRuleDef(overrides = {}) {
  const d = state.doc;
  const rule = {
    id: d.rules.reduce((m, r) => Math.max(m, r.id), -1) + 1,
    name: uniqueName('rule', d.rules.map((r) => r.name)),
    type: 'replicated',
    root: d.buckets.find((b) => b.type === 'root')?.name ?? 'default',
    class: null,
    failureDomain: 'host',
    mode: 'firstn',
    ...overrides,
  };
  d.rules.push(rule);
  return rule;
}

export function removeIds(ids) {
  const set = new Set(ids);
  const d = state.doc;
  d.hosts = d.hosts.filter((h) => !set.has(h.id));
  d.switches = d.switches.filter((s) => !set.has(s.id));
  d.buckets = d.buckets.filter((b) => !set.has(b.id));
  for (const h of d.hosts) h.osds = h.osds.filter((o) => !set.has(o.id));
  // A link whose endpoint went away goes with it.
  const alive = new Set([...d.hosts.map((h) => h.id), ...d.switches.map((s) => s.id)]);
  d.links = d.links.filter((l) => !set.has(l.id) && alive.has(l.a) && alive.has(l.b));
  // Re-parent orphaned buckets and hosts to the first root rather than losing them.
  const bucketIds = new Set(d.buckets.map((b) => b.id));
  const root = d.buckets.find((b) => b.type === 'root')?.id ?? null;
  for (const b of d.buckets) if (b.parent && !bucketIds.has(b.parent)) b.parent = root;
  for (const h of d.hosts) if (h.parent && !bucketIds.has(h.parent)) h.parent = root;
  pruneSelection();
}

// ------------------------------------------------------- load / autosave ----
export function loadDoc(doc) {
  state.doc = migrate(doc);
  state.selection.clear();
  state.down.clear();
  resetHistory();
  state.dirty = false;
  // The clock and any recovery in flight belong to the old document.
  emit('doc-loaded');
  changed();
}

/** Fill in anything an older or hand-written document is missing. */
export function migrate(doc) {
  const base = newDoc(doc.title || 'Untitled cluster');
  const out = { ...base, ...doc, version: DOC_VERSION };
  out.settings = { ...base.settings, ...(doc.settings || {}) };
  for (const key of ['buckets', 'hosts', 'switches', 'links', 'rules', 'pools', 'fs', 'rbd', 'rgw']) {
    if (!Array.isArray(out[key])) out[key] = base[key];
  }
  for (const h of out.hosts) {
    h.osds = (h.osds || []).map((o) => ({ up: true, in: true, reweight: 1, class: 'hdd', size: 8, ...o }));
    if (h.up === undefined) h.up = true;
    if (!Array.isArray(h.daemons)) h.daemons = [];
  }
  return out;
}

let autosaveTimer = null;
function scheduleAutosave() {
  if (!hasStorage) return;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state.doc)); }
    catch { /* quota or private mode — not worth interrupting a lecture over */ }
  }, 600);
}
export function readAutosave() {
  if (!hasStorage) return null;
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch { return null; }
}
export function savePrefs() {
  if (!hasStorage) return;
  // simdeck copy: themeChosen, so the theme follows the OS until someone presses Theme.
  const { theme, themeChosen, showGrid, snapOn, snap, tab } = state;
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ theme, themeChosen, showGrid, snapOn, snap, tab })); }
  catch { /* ignore */ }
}
export function loadPrefs() {
  if (!hasStorage) return;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch { /* ignore */ }
}
