// The Pools tab: what the cluster actually serves, and the rules that place it.
//
// Rows only — clicking one selects it and the inspector does the editing, the
// same way the canvas works. One editing surface, not three.

import { state, on, poolKey, ruleKey, fsKey, rbdKey, rgwKey, select } from './model.js';
import { fmtBytes, poolDf, TiB } from './engine/capacity.js';
import { poolWidth, poolEfficiency, poolMinSize } from './engine/pgmap.js';

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
  if (!rule) return `no rule named "${pool.crush_rule}"`;
  const want = poolWidth(pool);
  const have = domainsAvailable(doc, rule);
  const domain = rule.failureDomain || 'host';
  if (have === 0) {
    return rule.class
      ? `rule ${rule.name} takes device class ${rule.class}, and there are no ${rule.class} `
        + 'OSDs under its root — nothing can be placed at all'
      : `rule ${rule.name} has no OSDs under its root — nothing can be placed at all`;
  }
  if (have < poolMinSize(pool)) {
    return `needs ${want} ${domain}s, only ${have} available — PGs cannot even reach min_size`;
  }
  if (have < want) {
    return `needs ${want} ${domain}s, only ${have} available — every PG will be undersized`;
  }
  if (pool.type === 'erasure' && have === want) {
    return `exactly ${have} ${domain}s for ${want} shards — no room for CRUSH to retry, and`
      + ` losing one ${domain} drops straight to min_size`;
  }
  if (pool.pgp_num < pool.pg_num) {
    return `pgp_num ${pool.pgp_num} is below pg_num ${pool.pg_num} — the extra PGs share placements`;
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
      ? `EC ${p.k}+${p.m}` : `${p.size}x replicated`;
    const warn = poolWarning(d, p);
    const bad = ev && (ev.inactive || ev.degraded);
    return `<button class="list-row${state.selection.has(poolKey(p.id)) ? ' on' : ''}"
      data-sel="${poolKey(p.id)}">
      <span class="lr-name">${esc(p.name)}</span>
      <span class="lr-meta">${geom} · ${p.pg_num} pg · rule ${esc(p.crush_rule)}
        · ${(poolEfficiency(p) * 100).toFixed(0)}% usable</span>
      <span class="lr-nums">${fmtBytes(p.stored || 0)} stored${df ? ` · ${fmtBytes(df.maxAvail)} free` : ''}
        ${ev ? ` · ${ev.pool.pg_num - ev.degraded - ev.inactive}/${ev.pool.pg_num} clean` : ''}</span>
      ${warn ? `<span class="lr-warn">${esc(warn)}</span>` : ''}
      ${bad ? `<span class="lr-warn">${ev.inactive ? `${ev.inactive} inactive · ` : ''}${ev.degraded} degraded</span>` : ''}
    </button>`;
  }).join('') : '<p class="hint">No pools. A cluster with no pools stores nothing.</p>';

  const rules = d.rules.map((r) => {
    const have = domainsAvailable(d, r);
    const users = d.pools.filter((p) => p.crush_rule === r.name).length;
    return `<button class="list-row${state.selection.has(ruleKey(r.id)) ? ' on' : ''}"
      data-sel="${ruleKey(r.id)}">
      <span class="lr-name">${esc(r.name)}</span>
      <span class="lr-meta">${r.type} · take ${esc(r.root || 'default')}${r.class ? ` class ${esc(r.class)}` : ''}
        · ${r.mode || 'firstn'} type ${esc(r.failureDomain || 'host')}</span>
      <span class="lr-nums">${have} ${esc(r.failureDomain || 'host')}${have === 1 ? '' : 's'} available
        · used by ${users} pool${users === 1 ? '' : 's'}</span>
    </button>`;
  }).join('');

  root.innerHTML = `
    <div class="list-group"><h3>Pools</h3>${pools}</div>
    <div class="list-group"><h3>CRUSH rules</h3>${rules}
      <p class="hint">A rule is where the failure domain lives. Changing one here changes
      every pool that uses it — and moves data.</p></div>
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
      `data ${esc(fs.dataPool)} · metadata ${esc(fs.metaPool)} · max_mds ${fs.maxMds}`,
      s ? `${fmtBytes(s.used)} used · ${fmtBytes(s.free)} free · ${s.up ? 'up' : 'DOWN'}` : '',
      s && !s.up ? s.reasons.join('; ') : '');
  }).join('') || '<p class="hint">No filesystem. A CephFS is a data pool, a metadata pool and an MDS.</p>';

  const rbdRows = d.rbd.map((img) => {
    const s = der?.clients.rbd.find((r) => r.id === img.id);
    return row(rbdKey(img.id), img.name,
      `pool ${esc(img.pool)} · ${img.thin ? 'thin' : 'thick'} provisioned`,
      s ? `${fmtBytes(s.used)} of ${fmtBytes(s.provisioned)} used · ${s.up ? 'up' : 'READ-ONLY'}` : '',
      s && !s.up ? s.reasons.join('; ') : '');
  }).join('') || '<p class="hint">No block images.</p>';

  const rgwRows = d.rgw.map((gw) => {
    const s = der?.clients.rgw.find((g) => g.id === gw.id);
    return row(rgwKey(gw.id), gw.name,
      `data ${esc(gw.dataPool)} · index ${esc(gw.indexPool)} · ${gw.buckets} buckets`,
      s ? `${fmtBytes(s.used)} stored · ${fmtBytes(s.free)} free · ${s.up ? 'up' : 'DOWN'}` : '',
      s && !s.up ? s.reasons.join('; ') : '');
  }).join('') || '<p class="hint">No object gateway.</p>';

  const over = (der?.clients.overcommit || []).map((o) =>
    `<p class="hint" style="color:var(--warn)">Pool <b>${esc(o.pool)}</b> has
     ${fmtBytes(o.provisioned)} of images promised against ${fmtBytes(o.capacity)} of capacity
     (${o.ratio.toFixed(1)}x). Thin provisioning is a loan, not a discount.</p>`).join('');

  return `
    <div class="list-group"><h3>CephFS</h3>${fsRows}</div>
    <div class="list-group"><h3>RBD images</h3>${rbdRows}${over}</div>
    <div class="list-group"><h3>Object gateway (RGW)</h3>${rgwRows}</div>`;
}
