// SPDX-License-Identifier: AGPL-3.0-or-later
// The Pools tab: what the cluster actually serves, and the rules that place it.
//
// Rows only — clicking one selects it and the inspector does the editing, the
// same way the canvas works. One editing surface, not three.

import { state, on, poolKey, ruleKey, fsKey, rbdKey, rgwKey, select } from './model.js';
import { fmtBytes, poolDf, TiB } from './engine/capacity.js';
import { poolWidth, poolEfficiency, poolMinSize } from './engine/pgmap.js';
import { t } from './i18n.js';
import { engineText } from './engine-text.js';

let root = null;

export function initPools(el) {
  root = el;
  root.addEventListener('click', (e) => {
    const row = e.target.closest('[data-sel]');
    if (row) select(row.dataset.sel);
  });
  on('change', () => { if (state.tab === 'pools') renderPools(); });
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** How many distinct failure domains a rule can actually reach. */
export function domainsAvailable(doc, rule) {
  const domain = rule.failureDomain || 'host';
  if (domain === 'osd') {
    return doc.hosts.reduce((a, h) => a + h.osds.filter(
      (o) => !rule.class || o.class === rule.class).length, 0);
  }
  if (domain === 'host') {
    return doc.hosts.filter((h) => !rule.class || h.osds.some((o) => o.class === rule.class)).length;
  }
  // Count buckets of that type that actually contain a usable OSD.
  const has = (bucketId) => {
    const hosts = doc.hosts.filter((h) => h.parent === bucketId);
    if (hosts.some((h) => h.osds.some((o) => !rule.class || o.class === rule.class))) return true;
    return doc.buckets.filter((b) => b.parent === bucketId).some(has);
  };
  return doc.buckets.filter((b) => b.type === domain && has(b.id)).length;
}

/**
 * The check that matters most and that no UI usually makes: a pool wants N
 * distinct failure domains and the tree may not have them. Returns a warning
 * string, or null.
 */
export function poolWarning(doc, pool) {
  const rule = doc.rules.find((r) => r.name === pool.crush_rule);
  if (!rule) return t('pools.wNoRule', { rule: pool.crush_rule });
  const want = poolWidth(pool);
  const have = domainsAvailable(doc, rule);
  const domain = rule.failureDomain || 'host';
  if (have === 0) {
    return rule.class
      ? t('pools.wNoClass', { rule: rule.name, cls: rule.class })
      : t('pools.wNoOsds', { rule: rule.name });
  }
  if (have < poolMinSize(pool)) {
    return t('pools.wMinSize', { want, domain, have });
  }
  if (have < want) {
    return t('pools.wUndersized', { want, domain, have });
  }
  if (pool.type === 'erasure' && have === want) {
    return t('pools.wExact', { want, domain, have });
  }
  if (pool.pgp_num < pool.pg_num) {
    return t('pools.wPgp', { pgp: pool.pgp_num, pg: pool.pg_num });
  }
  return null;
}

export function renderPools() {
  if (!root) return;
  const d = state.doc;
  const der = state.derived;

  const pools = d.pools.length ? d.pools.map((p) => {
    const ev = der?.evals.find((e) => e.pool.id === p.id);
    const df = der ? poolDf(der.map, p, der.usage, der.evals) : null;
    const geom = p.type === 'erasure'
      ? `EC ${p.k}+${p.m}` : t('ins.replicated', { n: p.size });
    const warn = poolWarning(d, p);
    const bad = ev && (ev.inactive || ev.degraded);
    return `<button class="list-row${state.selection.has(poolKey(p.id)) ? ' on' : ''}"
      data-sel="${poolKey(p.id)}">
      <span class="lr-name">${esc(p.name)}</span>
      <span class="lr-meta">${t('pools.meta', { geom, pg: p.pg_num, rule: esc(p.crush_rule),
        pct: (poolEfficiency(p) * 100).toFixed(0) })}</span>
      <span class="lr-nums">${t('pools.nums', { stored: fmtBytes(p.stored || 0) })}${
        df ? t('pools.numsFree', { free: fmtBytes(df.maxAvail) }) : ''}
        ${ev ? t('pools.numsClean', { clean: ev.pool.pg_num - ev.degraded - ev.inactive, total: ev.pool.pg_num }) : ''}</span>
      ${warn ? `<span class="lr-warn">${esc(warn)}</span>` : ''}
      ${bad ? `<span class="lr-warn">${ev.inactive ? t('pools.badInactive', { n: ev.inactive }) : ''}${
        t('pools.bad', { n: ev.degraded })}</span>` : ''}
    </button>`;
  }).join('') : `<p class="hint">${t('pools.none')}</p>`;

  const rules = d.rules.map((r) => {
    const have = domainsAvailable(d, r);
    const users = d.pools.filter((p) => p.crush_rule === r.name).length;
    return `<button class="list-row${state.selection.has(ruleKey(r.id)) ? ' on' : ''}"
      data-sel="${ruleKey(r.id)}">
      <span class="lr-name">${esc(r.name)}</span>
      <span class="lr-meta">${t('pools.ruleMeta', { type: r.type, root: esc(r.root || 'default'),
        cls: r.class ? ` class ${esc(r.class)}` : '', mode: r.mode || 'firstn',
        domain: esc(r.failureDomain || 'host') })}</span>
      <span class="lr-nums">${t('pools.ruleNums', {
        avail: t('pools.avail', { n: have, domain: esc(r.failureDomain || 'host') }),
        users: t('ins.nPools', { n: users }) })}</span>
    </button>`;
  }).join('');

  root.innerHTML = `
    <div class="list-group"><h3>${t('pools.pools')}</h3>${pools}</div>
    <div class="list-group"><h3>${t('pools.rules')}</h3>${rules}
      <p class="hint">${t('pools.rulesHint')}</p></div>
    ${clientGroups(der)}`;
}

/**
 * The client layers. None of them store anything: each is a view over one or two
 * pools plus the daemons in front, which is exactly why they fail for reasons
 * that look nothing like themselves.
 */
function clientGroups(der) {
  const d = state.doc;
  const row = (key, name, meta, nums, bad) =>
    `<button class="list-row${state.selection.has(key) ? ' on' : ''}" data-sel="${key}">
      <span class="lr-name">${esc(name)}</span>
      <span class="lr-meta">${meta}</span>
      <span class="lr-nums">${nums}</span>
      ${bad ? `<span class="lr-warn">${esc(bad)}</span>` : ''}</button>`;

  const fsRows = d.fs.map((fs) => {
    const s = der?.clients.filesystems.find((f) => f.id === fs.id);
    return row(fsKey(fs.id), fs.name,
      t('pools.fsMeta', { data: esc(fs.dataPool), meta: esc(fs.metaPool), n: fs.maxMds }),
      s ? t('pools.fsNums', { used: fmtBytes(s.used), free: fmtBytes(s.free),
        state: s.up ? t('pools.up') : t('pools.down') }) : '',
      s && !s.up ? s.reasons.map(engineText).join('; ') : '');
  }).join('') || `<p class="hint">${t('pools.noFs')}</p>`;

  const rbdRows = d.rbd.map((img) => {
    const s = der?.clients.rbd.find((r) => r.id === img.id);
    return row(rbdKey(img.id), img.name,
      t('pools.rbdMeta', { pool: esc(img.pool), kind: img.thin ? t('pools.thin') : t('pools.thick') }),
      s ? t('pools.rbdNums', { used: fmtBytes(s.used), prov: fmtBytes(s.provisioned),
        state: s.up ? t('pools.up') : t('pools.readOnly') }) : '',
      s && !s.up ? s.reasons.map(engineText).join('; ') : '');
  }).join('') || `<p class="hint">${t('pools.noRbd')}</p>`;

  const rgwRows = d.rgw.map((gw) => {
    const s = der?.clients.rgw.find((g) => g.id === gw.id);
    return row(rgwKey(gw.id), gw.name,
      t('pools.rgwMeta', { data: esc(gw.dataPool), index: esc(gw.indexPool), n: gw.buckets }),
      s ? t('pools.rgwNums', { used: fmtBytes(s.used), free: fmtBytes(s.free),
        state: s.up ? t('pools.up') : t('pools.down') }) : '',
      s && !s.up ? s.reasons.map(engineText).join('; ') : '');
  }).join('') || `<p class="hint">${t('pools.noRgw')}</p>`;

  const over = (der?.clients.overcommit || []).map((o) =>
    `<p class="hint" style="color:var(--warn)">${t('pools.over', { pool: esc(o.pool),
      prov: fmtBytes(o.provisioned), cap: fmtBytes(o.capacity), ratio: o.ratio.toFixed(1) })}</p>`).join('');

  return `
    <div class="list-group"><h3>${t('pools.fs')}</h3>${fsRows}</div>
    <div class="list-group"><h3>${t('pools.rbd')}</h3>${rbdRows}${over}</div>
    <div class="list-group"><h3>${t('pools.rgw')}</h3>${rgwRows}</div>`;
}
