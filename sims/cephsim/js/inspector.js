// The right rail: whatever is selected, editable.
//
// Rebuilt wholesale on every change, so events are delegated from the container
// and every control carries the id it edits. Same reasoning as the canvas: no
// handler outlives a repaint.

import {
  state, on, changed, commit, hostById, switchById, linkById, osdById,
  bucketById, poolById, ruleById, fsById, rbdById, rgwById, addOsd, select, uniqueName,
} from './model.js';
import {
  DEVICE_CLASSES, DAEMONS, NETS, NIC_SPEEDS, FAILURE_DOMAINS, EC_PROFILES, classOrDefault,
} from './catalog.js';
import { fmtBytes, TiB, RATIOS, poolDf } from './engine/capacity.js';
import { poolWidth, poolMinSize, poolEfficiency } from './engine/pgmap.js';
import { poolWarning, domainsAvailable } from './panel-pools.js';
import { poolConsumers } from './engine/clients.js';
import { recentEvents } from './timeline.js';

let root = null;

export function initInspector(el) {
  root = el;
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('click', onClick);
  on('change', refresh);
  on('selection', refresh);
  refresh();
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const stat = (k, v) => `<div class="stat"><span class="k">${k}</span><span class="v">${v}</span></div>`;
const field = (label, control) => `<div class="field"><label>${label}</label>${control}</div>`;
const toggle = (label, name, id, on_) =>
  `<div class="field inline"><label for="f-${name}-${id}">${label}</label>
   <input type="checkbox" id="f-${name}-${id}" data-act="${name}" data-id="${id}"
   ${on_ ? 'checked' : ''}></div>`;

export function refresh() {
  if (!root) return;
  const sel = [...state.selection];
  if (sel.length === 0) root.innerHTML = clusterPanel();
  else if (sel.length > 1) root.innerHTML = multiPanel(sel);
  else root.innerHTML = onePanel(sel[0]);
}

// ------------------------------------------------------------------ panels --
function clusterPanel() {
  const d = state.doc;
  const der = state.derived;
  const osds = d.hosts.reduce((a, h) => a + h.osds.length, 0);
  const rawTiB = d.hosts.reduce((a, h) => a + h.osds.reduce((b, o) => b + o.size, 0), 0);
  const daemonCount = (id) => d.hosts.filter((h) => h.up !== false && h.daemons.includes(id)).length;

  const pools = d.pools.length ? d.pools.map((p) => {
    const ev = der?.evals.find((e) => e.pool.id === p.id);
    const geom = p.type === 'erasure' ? `EC ${p.k}+${p.m}` : `${p.size}x replicated`;
    const pctFull = der && p.stored
      ? ` · ${fmtBytes(ev?.rawUsed || 0)} raw` : '';
    return `<div class="hr"></div>
      <div class="stat"><span class="k">${esc(p.name)}</span>
        <span class="v">${geom} · ${p.pg_num} pg</span></div>
      ${field(`Stored data — ${fmtBytes(p.stored || 0)}${pctFull}`,
        `<input type="range" min="0" max="200" step="1" data-act="pool-stored" data-id="${p.id}"
         value="${Math.round((p.stored || 0) / TiB)}">`)}`;
  }).join('') : '<p class="hint">No pools yet. The pool editor arrives in phase 3; '
    + 'sample clusters come with pools already defined.</p>';

  return `<h2>Cluster</h2>
    ${stat('Hosts', d.hosts.length)}
    ${stat('OSDs', osds)}
    ${stat('Raw capacity', fmtBytes(rawTiB * TiB))}
    ${stat('Switches', d.switches.length)}
    ${stat('Cables', d.links.length)}
    <div class="hr"></div>
    ${stat('MON', `${daemonCount('mon')} up · quorum needs ${Math.floor(d.hosts.filter((h) => h.daemons.includes('mon')).length / 2) + 1}`)}
    ${stat('MGR', daemonCount('mgr'))}
    ${stat('MDS', daemonCount('mds'))}
    ${stat('RGW', daemonCount('rgw'))}
    ${der ? `<div class="hr"></div>
      ${stat('Raw used', `${fmtBytes(der.df.used)} (${(der.df.ratio * 100).toFixed(1)}%)`)}
      ${stat('Fill spread', `${(der.df.spread * 100).toFixed(1)} pts`)}
      ${stat('Fill stddev', `${(der.df.stddev * 100).toFixed(2)} pts`)}` : ''}
    <h2 style="margin-top:16px">Pools</h2>${pools}
    ${healthSection(der)}`;
}

function healthSection(der) {
  if (!der) return '';
  const sev = { HEALTH_OK: 'ok', HEALTH_WARN: 'warn', HEALTH_ERR: 'err' }[der.health.status];
  const rows = der.health.checks.map((c) => `
    <div class="check ${c.severity === 'HEALTH_ERR' ? 'err' : 'warn'}">
      <div class="check-name">${esc(c.name)}</div>
      <div class="check-sum">${esc(c.summary)}</div>
      ${c.detail.length ? `<ul class="check-detail">${
        c.detail.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
    </div>`).join('');
  const q = der.net.quorum;
  return `<h2 style="margin-top:16px">Health</h2>
    <p class="health-line ${sev}">${esc(der.health.status)}</p>
    ${q.configured ? stat('MON quorum',
      `${q.largestGroup}/${q.configured} (need ${q.needed})${q.hasQuorum ? '' : q.partitioned ? ' — SPLIT' : ' — LOST'}`) : ''}
    ${der.net.enabled ? '' : '<p class="hint">No cables drawn, so the network is not being '
      + 'modelled. Draw one and partitions and quorum start to count.</p>'}
    ${der.net.uncabled.size ? `<p class="hint">${der.net.uncabled.size} host(s) have no cables; `
      + 'their network is not modelled.</p>' : ''}
    ${rows || '<p class="hint">Nothing failing.</p>'}
    ${eventsSection()}`;
}

function eventsSection() {
  const items = recentEvents(6);
  if (!items) return '';
  return `<h2 style="margin-top:16px">Recent events</h2><ul class="events">${items}</ul>`;
}

function onePanel(id) {
  const host = hostById(id);
  if (host) return hostPanel(host);
  const sw = switchById(id);
  if (sw) return switchPanel(sw);
  const link = linkById(id);
  if (link) return linkPanel(link);
  const bucket = bucketById(id);
  if (bucket) return bucketPanel(bucket);
  if (typeof id === 'string' && id.startsWith('pool:')) {
    const p = poolById(Number(id.slice(5)));
    return p ? poolPanel(p) : '<p class="empty">That pool is gone.</p>';
  }
  if (typeof id === 'string' && id.startsWith('rule:')) {
    const r = ruleById(Number(id.slice(5)));
    return r ? rulePanel(r) : '<p class="empty">That rule is gone.</p>';
  }
  if (typeof id === 'string' && id.startsWith('fs:')) {
    const f = fsById(Number(id.slice(3)));
    return f ? fsPanel(f) : '<p class="empty">That filesystem is gone.</p>';
  }
  if (typeof id === 'string' && id.startsWith('rbd:')) {
    const r = rbdById(Number(id.slice(4)));
    return r ? rbdPanel(r) : '<p class="empty">That image is gone.</p>';
  }
  if (typeof id === 'string' && id.startsWith('rgw:')) {
    const g = rgwById(Number(id.slice(4)));
    return g ? rgwPanel(g) : '<p class="empty">That gateway is gone.</p>';
  }
  const found = osdById(id);
  if (found) return osdPanel(found.osd, found.host);
  return '<p class="empty">Nothing selected.</p>';
}

const poolOptions = (sel) => state.doc.pools.map((p) =>
  `<option value="${esc(p.name)}" ${p.name === sel ? 'selected' : ''}>${esc(p.name)}</option>`).join('');

function clientStatus(s) {
  if (!s) return '';
  return `<div class="hr"></div>
    <p class="health-line ${s.up ? (s.degraded ? 'warn' : 'ok') : 'err'}"
      >${s.up ? (s.degraded ? 'degraded' : 'available') : 'unavailable'}</p>
    ${s.reasons.length ? `<ul class="check-detail">${
      s.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}`;
}

function fsPanel(fs) {
  const s = state.derived?.clients.filesystems.find((f) => f.id === fs.id);
  const data = poolById(state.doc.pools.find((p) => p.name === fs.dataPool)?.id);
  return `<h2>CephFS</h2>
    ${field('Name', `<input data-act="fs-name" data-id="${fs.id}" value="${esc(fs.name)}">`)}
    ${field('Data pool', `<select data-act="fs-data" data-id="${fs.id}">${poolOptions(fs.dataPool)}</select>`)}
    ${field('Metadata pool', `<select data-act="fs-meta" data-id="${fs.id}">${poolOptions(fs.metaPool)}</select>`)}
    ${field('max_mds (active ranks)',
      `<input type="number" min="1" max="8" step="1" data-act="fs-maxmds" data-id="${fs.id}" value="${fs.maxMds}">`)}
    ${data ? field(`Stored — ${fmtBytes(data.stored || 0)}`,
      `<input type="range" min="0" max="500" step="1" data-act="pool-stored"
       data-id="${data.id}" value="${Math.round((data.stored || 0) / TiB)}">`) : ''}
    ${s ? `<div class="hr"></div>
      ${stat('Used', fmtBytes(s.used))}
      ${stat('Free', fmtBytes(s.free))}
      ${stat('MDS ranks', `${s.mds.ranksActive}/${s.mds.ranksWanted} active, ${s.mds.standbys} standby`)}` : ''}
    ${clientStatus(s)}
    <p class="hint">Put the metadata pool on SSD or NVMe. It is small and latency-bound, and
    it is what makes a filesystem feel fast or feel broken.</p>
    <div class="hr"></div>
    <button class="danger" data-act="remove-fs" data-id="${fs.id}">Delete this filesystem</button>`;
}

function rbdPanel(img) {
  const s = state.derived?.clients.rbd.find((r) => r.id === img.id);
  return `<h2>RBD image</h2>
    ${field('Name', `<input data-act="rbd-name" data-id="${img.id}" value="${esc(img.name)}">`)}
    ${field('Pool', `<select data-act="rbd-pool" data-id="${img.id}">${poolOptions(img.pool)}</select>`)}
    ${field(`Provisioned — ${fmtBytes(img.provisioned || 0)}`,
      `<input type="range" min="0" max="500" step="1" data-act="rbd-provisioned"
       data-id="${img.id}" value="${Math.round((img.provisioned || 0) / TiB)}">`)}
    ${toggle('Thin provisioned', 'rbd-thin', img.id, img.thin !== false)}
    ${img.thin !== false ? field(`Actually used — ${fmtBytes(img.used || 0)}`,
      `<input type="range" min="0" max="500" step="1" data-act="rbd-used"
       data-id="${img.id}" value="${Math.round((img.used || 0) / TiB)}">`) : ''}
    ${s ? `<div class="hr"></div>
      ${stat('Consumes', fmtBytes(s.used))}
      ${stat('Pool has free', fmtBytes(s.free))}` : ''}
    ${clientStatus(s)}
    <p class="hint">A thin image promises capacity it has not taken yet. Promise more than the
    pool holds and the images are fine right up until they are not.</p>
    <div class="hr"></div>
    <button class="danger" data-act="remove-rbd" data-id="${img.id}">Delete this image</button>`;
}

function rgwPanel(gw) {
  const s = state.derived?.clients.rgw.find((g) => g.id === gw.id);
  const data = state.doc.pools.find((p) => p.name === gw.dataPool);
  return `<h2>Object gateway</h2>
    ${field('Name', `<input data-act="rgw-name" data-id="${gw.id}" value="${esc(gw.name)}">`)}
    ${field('Data pool', `<select data-act="rgw-data" data-id="${gw.id}">${poolOptions(gw.dataPool)}</select>`)}
    ${field('Index pool', `<select data-act="rgw-index" data-id="${gw.id}">${poolOptions(gw.indexPool)}</select>`)}
    ${field('Buckets',
      `<input type="number" min="0" step="1" data-act="rgw-buckets" data-id="${gw.id}" value="${gw.buckets}">`)}
    ${data ? field(`Stored — ${fmtBytes(data.stored || 0)}`,
      `<input type="range" min="0" max="500" step="1" data-act="pool-stored"
       data-id="${data.id}" value="${Math.round((data.stored || 0) / TiB)}">`) : ''}
    ${clientStatus(s)}
    <p class="hint">RGW itself is stateless, so losing a gateway loses an endpoint and nothing
    else. The index pool is the one that hurts — it is small, hot, and belongs on fast devices.</p>
    <div class="hr"></div>
    <button class="danger" data-act="remove-rgw" data-id="${gw.id}">Delete this gateway</button>`;
}

function poolPanel(p) {
  const ev = state.derived?.evals.find((e) => e.pool.id === p.id);
  const df = state.derived ? poolDf(state.derived.map, p, state.derived.usage, state.derived.evals) : null;
  const rules = state.doc.rules.map((r) =>
    `<option value="${esc(r.name)}" ${r.name === p.crush_rule ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
  const warn = poolWarning(state.doc, p);
  const isEC = p.type === 'erasure';
  const ecOpts = EC_PROFILES.map((e) =>
    `<option value="${e.k}:${e.m}" ${isEC && e.k === p.k && e.m === p.m ? 'selected' : ''}>${esc(e.label)}</option>`).join('');

  const geom = isEC ? `
    ${field('Erasure profile', `<select data-act="pool-ec" data-id="${p.id}">${ecOpts}</select>`)}
    ${field(`min_size — ${poolMinSize(p)}`,
      `<input type="number" min="1" max="${p.k + p.m}" step="1" data-act="pool-minsize"
       data-id="${p.id}" value="${poolMinSize(p)}">`)}` : `
    <div class="row">
      ${field('size', `<input type="number" min="1" max="10" step="1" data-act="pool-size" data-id="${p.id}" value="${p.size}">`)}
      ${field('min_size', `<input type="number" min="1" max="${p.size}" step="1" data-act="pool-minsize" data-id="${p.id}" value="${poolMinSize(p)}">`)}
    </div>`;

  return `<h2>Pool</h2>
    ${field('Name', `<input data-act="pool-name" data-id="${p.id}" value="${esc(p.name)}">`)}
    ${field('Type', `<select data-act="pool-type" data-id="${p.id}">
      <option value="replicated" ${!isEC ? 'selected' : ''}>Replicated</option>
      <option value="erasure" ${isEC ? 'selected' : ''}>Erasure coded</option></select>`)}
    ${geom}
    ${field('CRUSH rule', `<select data-act="pool-rule" data-id="${p.id}">${rules}</select>`)}
    <div class="row">
      ${field('pg_num', `<input type="number" min="1" step="1" data-act="pool-pgnum" data-id="${p.id}" value="${p.pg_num}">`)}
      ${field('pgp_num', `<input type="number" min="1" step="1" data-act="pool-pgpnum" data-id="${p.id}" value="${p.pgp_num}">`)}
    </div>
    ${field(`Stored data — ${fmtBytes(p.stored || 0)}`,
      `<input type="range" min="0" max="500" step="1" data-act="pool-stored"
       data-id="${p.id}" value="${Math.round((p.stored || 0) / TiB)}">`)}
    ${warn ? `<p class="hint" style="color:var(--warn)">${esc(warn)}</p>` : ''}
    <div class="hr"></div>
    ${stat('Shards per PG', poolWidth(p))}
    ${stat('Usable fraction', `${(poolEfficiency(p) * 100).toFixed(0)}%`)}
    ${df ? `${stat('Raw on disk', fmtBytes(df.used))}
      ${stat('MAX AVAIL', fmtBytes(df.maxAvail))}` : ''}
    ${ev ? `${stat('Clean', `${ev.pool.pg_num - ev.degraded - ev.inactive} of ${ev.pool.pg_num}`)}
      ${ev.degraded ? stat('Degraded', ev.degraded) : ''}
      ${ev.inactive ? stat('Inactive', ev.inactive) : ''}` : ''}
    <p class="hint">Raising <code>pg_num</code> alone splits PGs without moving data;
    raising <code>pgp_num</code> is what actually shuffles it.</p>
    <div class="hr"></div>
    <button class="danger" data-act="remove-pool" data-id="${p.id}">Delete this pool</button>`;
}

function rulePanel(r) {
  const roots = state.doc.buckets.filter((b) => b.type === 'root').map((b) =>
    `<option value="${esc(b.name)}" ${b.name === r.root ? 'selected' : ''}>${esc(b.name)}</option>`).join('');
  const classes = ['<option value="">any class</option>',
    ...Object.values(DEVICE_CLASSES).map((c) =>
      `<option value="${c.id}" ${c.id === r.class ? 'selected' : ''}>${c.label} only</option>`)].join('');
  const domains = FAILURE_DOMAINS.map((f) =>
    `<option value="${f}" ${f === (r.failureDomain || 'host') ? 'selected' : ''}>${f}</option>`).join('');
  const have = domainsAvailable(state.doc, r);
  const users = state.doc.pools.filter((p) => p.crush_rule === r.name);
  const worst = users.reduce((m, p) => Math.max(m, poolWidth(p)), 0);

  return `<h2>CRUSH rule</h2>
    ${field('Name', `<input data-act="rule-name" data-id="${r.id}" value="${esc(r.name)}">`)}
    ${field('Type', `<select data-act="rule-type" data-id="${r.id}">
      <option value="replicated" ${r.type !== 'erasure' ? 'selected' : ''}>Replicated (firstn)</option>
      <option value="erasure" ${r.type === 'erasure' ? 'selected' : ''}>Erasure coded (indep)</option></select>`)}
    ${field('Take root', `<select data-act="rule-root" data-id="${r.id}">${roots}</select>`)}
    ${field('Device class', `<select data-act="rule-class" data-id="${r.id}">${classes}</select>`)}
    ${field('Failure domain', `<select data-act="rule-domain" data-id="${r.id}">${domains}</select>`)}
    <div class="hr"></div>
    ${stat('Domains available', have)}
    ${stat('Used by', `${users.length} pool${users.length === 1 ? '' : 's'}`)}
    ${worst > have ? `<p class="hint" style="color:var(--warn)">A pool on this rule wants
      ${worst} domains and only ${have} exist.</p>` : ''}
    <p class="hint">Compiles to:<br>
      <code>step take ${esc(r.root || 'default')}${r.class ? ` class ${esc(r.class)}` : ''}</code><br>
      <code>step chooseleaf ${r.type === 'erasure' ? 'indep' : 'firstn'} 0 type ${esc(r.failureDomain || 'host')}</code><br>
      <code>step emit</code></p>
    <div class="hr"></div>
    <button class="danger" data-act="remove-rule" data-id="${r.id}">Delete this rule</button>`;
}

function hostPanel(h) {
  const raw = h.osds.reduce((a, o) => a + o.size, 0);
  const parents = state.doc.buckets.map((b) =>
    `<option value="${b.id}" ${b.id === h.parent ? 'selected' : ''}>${esc(b.name)} (${b.type})</option>`).join('');
  const chips = Object.values(DAEMONS).map((dm) => {
    const on_ = h.daemons.includes(dm.id);
    return `<button class="chip${on_ ? ' on' : ''}" data-act="daemon" data-id="${h.id}"
      data-val="${dm.id}" title="${esc(dm.note)}"
      style="${on_ ? `background:${dm.colour}` : ''}">${dm.label}</button>`;
  }).join('');
  return `<h2>Host</h2>
    ${field('Name', `<input data-act="host-name" data-id="${h.id}" value="${esc(h.name)}">`)}
    ${field('CRUSH parent', `<select data-act="host-parent" data-id="${h.id}">${parents}</select>`)}
    ${toggle('Up', 'host-up', h.id, h.up !== false)}
    <div class="field"><label>Daemons</label><div class="chips">${chips}</div></div>
    <div class="hr"></div>
    ${stat('OSDs', h.osds.length)}
    ${stat('CRUSH weight', `${raw} TiB`)}
    <div class="row">
      <button data-act="add-osd" data-id="${h.id}">Add OSD</button>
      <button data-act="add-osd-ssd" data-id="${h.id}">Add SSD</button>
    </div>
    <p class="hint">Marking a host down takes every OSD on it out of the acting sets,
    but leaves its weight in the CRUSH tree — exactly as a real failure does.</p>`;
}

function osdPanel(o, host) {
  const u = state.derived?.usage.get(o.id);
  const classes = Object.values(DEVICE_CLASSES).map((c) =>
    `<option value="${c.id}" ${c.id === o.class ? 'selected' : ''}>${c.label}</option>`).join('');
  return `<h2>osd.${o.id}</h2>
    <p class="hint">on ${esc(host.name)}</p>
    ${field('Size / CRUSH weight (TiB)',
      `<input type="number" min="0.1" step="0.5" data-act="osd-size" data-id="${o.id}" value="${o.size}">`)}
    ${field('Device class', `<select data-act="osd-class" data-id="${o.id}">${classes}</select>`)}
    ${toggle('Up', 'osd-up', o.id, o.up !== false)}
    ${toggle('In', 'osd-in', o.id, o.in !== false)}
    ${field(`Reweight — ${(o.reweight ?? 1).toFixed(2)}`,
      `<input type="range" min="0" max="1" step="0.05" data-act="osd-reweight"
       data-id="${o.id}" value="${o.reweight ?? 1}">`)}
    <p class="hint"><b>Reweight is not the CRUSH weight.</b> It is a rejection roll applied
    when CRUSH picks this OSD, so it leaves the host and rack weights above alone and moves
    far less data. Editing the size above is the one that cascades.</p>
    ${u ? `<div class="hr"></div>
      ${stat('Used', `${fmtBytes(u.used)} of ${fmtBytes(u.total)}`)}
      ${stat('Full', `${(u.ratio * 100).toFixed(1)}%${u.ratio >= RATIOS.nearfull ? ' — nearfull' : ''}`)}
      ${stat('PGs', u.pgs)}` : ''}
    <div class="hr"></div>
    <button class="danger" data-act="remove-osd" data-id="${o.id}">Remove this OSD</button>`;
}

function switchPanel(s) {
  const speeds = NIC_SPEEDS.map((v) =>
    `<option value="${v}" ${v === s.speed ? 'selected' : ''}>${v} Gb/s</option>`).join('');
  return `<h2>Switch</h2>
    ${field('Name', `<input data-act="sw-name" data-id="${s.id}" value="${esc(s.name)}">`)}
    ${field('Port speed', `<select data-act="sw-speed" data-id="${s.id}">${speeds}</select>`)}
    ${field('Ports', `<input type="number" min="1" step="1" data-act="sw-ports" data-id="${s.id}" value="${s.ports}">`)}
    ${toggle('Up', 'sw-up', s.id, s.up !== false)}
    <p class="hint">Partition and quorum modelling lands in phase 4. For now a switch is
    drawing and cable bandwidth.</p>`;
}

function linkPanel(l) {
  const nets = Object.values(NETS).map((n) =>
    `<option value="${n.id}" ${n.id === l.net ? 'selected' : ''}>${n.label} network</option>`).join('');
  const speeds = NIC_SPEEDS.map((v) =>
    `<option value="${v}" ${v === l.speed ? 'selected' : ''}>${v} Gb/s</option>`).join('');
  return `<h2>Cable</h2>
    ${field('Network', `<select data-act="link-net" data-id="${l.id}">${nets}</select>`)}
    ${field('Speed', `<select data-act="link-speed" data-id="${l.id}">${speeds}</select>`)}
    ${toggle('Up', 'link-up', l.id, l.up !== false)}
    <p class="hint">Ceph separates client traffic (public) from replication and recovery
    (cluster). A cluster-network outage is invisible to clients until recovery needs to run.</p>`;
}

function bucketPanel(b) {
  const kids = state.doc.hosts.filter((h) => h.parent === b.id).length;
  const parents = [`<option value="">(no parent — this is a root)</option>`,
    ...state.doc.buckets.filter((x) => x.id !== b.id).map((x) =>
      `<option value="${x.id}" ${x.id === b.parent ? 'selected' : ''}>${esc(x.name)}</option>`)].join('');
  return `<h2>${esc(b.type)}</h2>
    ${field('Name', `<input data-act="bucket-name" data-id="${b.id}" value="${esc(b.name)}">`)}
    ${field('Parent', `<select data-act="bucket-parent" data-id="${b.id}">${parents}</select>`)}
    ${stat('Hosts inside', kids)}
    <p class="hint">A bucket's weight is never set by hand — it is the sum of what is inside it.</p>`;
}

function multiPanel(sel) {
  const osds = sel.map((id) => osdById(id)).filter(Boolean);
  const classes = Object.values(DEVICE_CLASSES).map((c) =>
    `<option value="${c.id}">${c.label}</option>`).join('');
  return `<h2>${sel.length} selected</h2>
    ${osds.length ? `${stat('OSDs', osds.length)}
      ${field('Set size (TiB) for all',
        `<input type="number" min="0.1" step="0.5" data-act="bulk-size" placeholder="e.g. 8">`)}
      ${field('Set class for all',
        `<select data-act="bulk-class"><option value="">—</option>${classes}</select>`)}` : ''}
    <div class="hr"></div>
    <button class="danger" data-act="delete-selection">Delete selection</button>`;
}

// ------------------------------------------------------------------ events --
function onInput(e) {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const id = el.dataset.id;
  const num = () => Number(el.value);
  const checked = () => el.checked;

  // Text and slider edits coalesce into one undo entry per focus, which is what
  // people expect from a text box.
  if (e.type === 'input' && el.tagName === 'INPUT' && el.type !== 'checkbox') {
    if (!el.dataset.committed) { commit(act); el.dataset.committed = '1'; }
  } else {
    commit(act);
  }

  let remap = true;
  switch (act) {
    case 'host-name': hostById(id).name = el.value; break;
    case 'host-parent': hostById(id).parent = el.value; break;
    case 'host-up': hostById(id).up = checked(); remap = false; break;
    case 'osd-size': { const f = osdById(Number(id)); if (f) f.osd.size = Math.max(0.1, num()); break; }
    case 'osd-class': { const f = osdById(Number(id)); if (f) f.osd.class = el.value; break; }
    case 'osd-up': { const f = osdById(Number(id)); if (f) f.osd.up = checked(); remap = false; break; }
    case 'osd-in': { const f = osdById(Number(id)); if (f) f.osd.in = checked(); break; }
    case 'osd-reweight': { const f = osdById(Number(id)); if (f) f.osd.reweight = num(); break; }
    case 'sw-name': switchById(id).name = el.value; remap = false; break;
    case 'sw-speed': switchById(id).speed = num(); remap = false; break;
    case 'sw-ports': switchById(id).ports = Math.max(1, num()); remap = false; break;
    case 'sw-up': switchById(id).up = checked(); remap = false; break;
    case 'link-net': { const l = linkById(id); l.net = el.value; remap = false; break; }
    case 'link-speed': linkById(id).speed = num(); remap = false; break;
    case 'link-up': linkById(id).up = checked(); remap = false; break;
    case 'bucket-name': bucketById(id).name = el.value; break;
    case 'bucket-parent': bucketById(id).parent = el.value || null; break;
    case 'pool-stored': {
      const p = state.doc.pools.find((x) => x.id === Number(id));
      if (p) p.stored = num() * TiB;
      remap = false;                       // data volume does not move PGs
      break;
    }
    case 'pool-name': poolById(Number(id)).name = el.value; remap = false; break;
    case 'pool-type': {
      const p = poolById(Number(id));
      p.type = el.value;
      if (p.type === 'erasure') { p.k = p.k ?? 4; p.m = p.m ?? 2; p.min_size = p.k; }
      else { p.size = p.size ?? 3; p.min_size = Math.max(1, p.size - 1); }
      break;
    }
    case 'pool-ec': {
      const p = poolById(Number(id));
      const [k, m] = el.value.split(':').map(Number);
      p.k = k; p.m = m;
      p.min_size = Math.min(p.min_size ?? k, k + m);
      break;
    }
    case 'pool-size': {
      const p = poolById(Number(id));
      p.size = Math.max(1, num());
      if (p.min_size > p.size) p.min_size = p.size;
      break;
    }
    case 'pool-minsize': {
      const p = poolById(Number(id));
      p.min_size = Math.max(1, Math.min(num(), poolWidth(p)));
      remap = false;                       // min_size changes states, not placement
      break;
    }
    case 'pool-rule': poolById(Number(id)).crush_rule = el.value; break;
    case 'pool-pgnum': {
      const p = poolById(Number(id));
      p.pg_num = Math.max(1, Math.round(num()));
      if (p.pgp_num > p.pg_num) p.pgp_num = p.pg_num;
      break;
    }
    case 'pool-pgpnum': {
      const p = poolById(Number(id));
      p.pgp_num = Math.max(1, Math.min(Math.round(num()), p.pg_num));
      break;
    }
    case 'rule-name': {
      const r = ruleById(Number(id));
      const old = r.name;
      r.name = el.value;
      // Pools reference a rule by name, so a rename has to follow through.
      for (const p of state.doc.pools) if (p.crush_rule === old) p.crush_rule = r.name;
      break;
    }
    case 'rule-type': {
      const r = ruleById(Number(id));
      r.type = el.value;
      r.mode = el.value === 'erasure' ? 'indep' : 'firstn';
      break;
    }
    case 'rule-root': ruleById(Number(id)).root = el.value; break;
    case 'rule-class': ruleById(Number(id)).class = el.value || null; break;
    case 'rule-domain': ruleById(Number(id)).failureDomain = el.value; break;
    case 'fs-name': fsById(Number(id)).name = el.value; remap = false; break;
    case 'fs-data': fsById(Number(id)).dataPool = el.value; remap = false; break;
    case 'fs-meta': fsById(Number(id)).metaPool = el.value; remap = false; break;
    case 'fs-maxmds': fsById(Number(id)).maxMds = Math.max(1, num()); remap = false; break;
    case 'rbd-name': rbdById(Number(id)).name = el.value; remap = false; break;
    case 'rbd-pool': rbdById(Number(id)).pool = el.value; remap = false; break;
    case 'rbd-provisioned': {
      const img = rbdById(Number(id));
      img.provisioned = num() * TiB;
      if (img.thin === false) img.used = img.provisioned;
      if ((img.used || 0) > img.provisioned) img.used = img.provisioned;
      remap = false;
      break;
    }
    case 'rbd-used': {
      const img = rbdById(Number(id));
      img.used = Math.min(num() * TiB, img.provisioned || 0);
      remap = false;
      break;
    }
    case 'rbd-thin': {
      const img = rbdById(Number(id));
      img.thin = checked();
      if (!img.thin) img.used = img.provisioned;
      remap = false;
      break;
    }
    case 'rgw-name': rgwById(Number(id)).name = el.value; remap = false; break;
    case 'rgw-data': rgwById(Number(id)).dataPool = el.value; remap = false; break;
    case 'rgw-index': rgwById(Number(id)).indexPool = el.value; remap = false; break;
    case 'rgw-buckets': rgwById(Number(id)).buckets = Math.max(0, Math.round(num())); remap = false; break;
    case 'bulk-size': {
      if (!el.value) return;
      for (const sid of state.selection) { const f = osdById(sid); if (f) f.osd.size = Math.max(0.1, num()); }
      break;
    }
    case 'bulk-class': {
      if (!el.value) return;
      for (const sid of state.selection) { const f = osdById(sid); if (f) f.osd.class = el.value; }
      break;
    }
    default: return;
  }
  changed({ remap });
}

function onClick(e) {
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  const act = el.dataset.act;
  const id = el.dataset.id;
  switch (act) {
    case 'daemon': {
      const h = hostById(id);
      commit('daemon');
      const v = el.dataset.val;
      const i = h.daemons.indexOf(v);
      if (i >= 0) h.daemons.splice(i, 1); else h.daemons.push(v);
      changed({ remap: false });
      break;
    }
    case 'add-osd':
    case 'add-osd-ssd': {
      const h = hostById(id);
      commit('add osd');
      const cls = act === 'add-osd-ssd' ? 'ssd' : 'hdd';
      addOsd(h, { size: DEVICE_CLASSES[cls].defaultSize, cls });
      changed();
      break;
    }
    case 'remove-osd': {
      const f = osdById(Number(id));
      if (!f) break;
      commit('remove osd');
      f.host.osds = f.host.osds.filter((o) => o.id !== Number(id));
      state.selection.delete(Number(id));
      changed();
      break;
    }
    case 'remove-pool': {
      const pool = poolById(Number(id));
      const users = pool ? poolConsumers(state.doc, pool.name) : [];
      if (users.length && !confirm(
        `${pool.name} is used by ${users.join(', ')}. Delete it anyway?`)) break;
      commit('delete pool');
      state.doc.pools = state.doc.pools.filter((p) => p.id !== Number(id));
      state.selection.delete(`pool:${id}`);
      changed();
      break;
    }
    case 'remove-rule': {
      const r = ruleById(Number(id));
      const users = state.doc.pools.filter((p) => p.crush_rule === r?.name);
      if (users.length) {
        // Deleting a rule out from under a pool would leave it unplaceable.
        alert(`${r.name} is still used by ${users.map((p) => p.name).join(', ')}.`);
        break;
      }
      commit('delete rule');
      state.doc.rules = state.doc.rules.filter((x) => x.id !== Number(id));
      state.selection.delete(`rule:${id}`);
      changed();
      break;
    }
    case 'remove-fs': {
      commit('delete filesystem');
      state.doc.fs = state.doc.fs.filter((f) => f.id !== Number(id));
      state.selection.delete(`fs:${id}`);
      changed({ remap: false });
      break;
    }
    case 'remove-rbd': {
      commit('delete image');
      state.doc.rbd = state.doc.rbd.filter((r) => r.id !== Number(id));
      state.selection.delete(`rbd:${id}`);
      changed({ remap: false });
      break;
    }
    case 'remove-rgw': {
      commit('delete gateway');
      state.doc.rgw = state.doc.rgw.filter((g) => g.id !== Number(id));
      state.selection.delete(`rgw:${id}`);
      changed({ remap: false });
      break;
    }
    case 'delete-selection':
      // interact.js owns deletion so the undo label and pruning stay in one place
      import('./interact.js').then((m) => m.deleteSelection());
      break;
    default: break;
  }
}
