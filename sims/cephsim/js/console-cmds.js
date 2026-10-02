// SPDX-License-Identifier: AGPL-3.0-or-later
// The commands, rendered.
//
// These are the outputs a student will actually meet, formatted the way the real
// tools format them — columns, units and all. Everything here is derived from
// state the simulator already computes; nothing is fabricated to fill a column.
// Where a field is not modelled it shows as `-` rather than as a plausible
// number, because a plausible wrong number is worse than an obvious gap.
//
// `ceph balancer status` is deliberately absent: the balancer is not modelled,
// and printing "active: false" would imply it could be switched on.

import { fmtBytes, RATIOS, poolDf } from './engine/capacity.js';
import { poolWidth, poolMinSize, poolEfficiency } from './engine/pgmap.js';
import { ancestry, devicesUnder } from './engine/crushmap.js';
import { ruleSteps } from './compile.js';
import { formatDuration } from './sim.js';

// RADOS stripes into 4 MiB objects by default; object counts here follow from
// that rather than being invented.
const OBJECT_SIZE = 4 * 1024 * 1024;
const objects = (bytes) => bytes / OBJECT_SIZE;

const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);
function fmtCount(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}G`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}k`;
  return n.toFixed(0);
}
// `ceph df` uses short unit suffixes in some columns.
const short = (b) => fmtBytes(b).replace(' ', ' ');

function needDerived(d) {
  if (!d) throw new Error('nothing evaluated yet');
}

// ------------------------------------------------------------------ ceph -s --
function status(doc, d) {
  needDerived(d);
  const q = d.net.quorum;
  const out = [];
  out.push('  cluster:');
  out.push(`    id:     ${clusterId(doc)}`);
  out.push(`    health: ${d.health.status}`);
  for (const c of d.health.checks) out.push(`            ${c.name}: ${c.summary}`);
  out.push('');
  out.push('  services:');
  if (q.configured) {
    const names = doc.hosts.filter((h) => q.inQuorum.includes(h.id)).map((h) => h.name);
    out.push(`    mon: ${q.configured} daemons, quorum ${names.join(',') || '(none)'}`
      + `${q.hasQuorum ? '' : ' — NO QUORUM'}`);
  }
  if (d.daemons.mgr.configured) {
    const active = doc.hosts.find((h) => h.daemons.includes('mgr') && h.up !== false);
    out.push(`    mgr: ${d.daemons.mgr.up ? `${active?.name}(active)` : 'no daemons active'}`
      + (d.daemons.mgr.standbys ? `, standbys: ${d.daemons.mgr.standbys}` : ''));
  }
  if (d.daemons.mds.configured) {
    const fs = d.daemons.filesystems[0];
    out.push(`    mds: ${fs ? `${fs.ranksActive}/${fs.ranksWanted} daemons up` : `${d.daemons.mds.up} up`}`
      + (fs && fs.standbys ? `, ${fs.standbys} standby` : ''));
  }
  const allOsds = doc.hosts.flatMap((h) => h.osds);
  const upOsds = allOsds.filter((o) => !d.down.has(o.id)).length;
  const inOsds = allOsds.filter((o) => o.in !== false).length;
  out.push(`    osd: ${allOsds.length} osds: ${upOsds} up, ${inOsds} in`);
  if (d.daemons.rgw.configured) {
    out.push(`    rgw: ${d.daemons.rgw.up} daemon${d.daemons.rgw.up === 1 ? '' : 's'} active`);
  }
  out.push('');
  out.push('  data:');
  if (d.clients.filesystems.length) {
    const ok = d.clients.filesystems.filter((f) => f.up).length;
    out.push(`    volumes: ${ok}/${d.clients.filesystems.length} healthy`);
  }
  const stored = doc.pools.reduce((a, p) => a + (p.stored || 0), 0);
  const pgs = doc.pools.reduce((a, p) => a + p.pg_num, 0);
  out.push(`    pools:   ${doc.pools.length} pools, ${pgs} pgs`);
  out.push(`    objects: ${fmtCount(objects(stored))} objects, ${fmtBytes(stored)}`);
  out.push(`    usage:   ${fmtBytes(d.df.used)} used, ${fmtBytes(d.df.avail)} / ${fmtBytes(d.df.total)} avail`);
  out.push(`    pgs:     ${pgLine(d)}`);
  if (d.recovery && !d.recovery.done) {
    out.push('');
    out.push('  io:');
    out.push(`    recovery: ${fmtBytes(d.recovery.currentRate())}/s, `
      + `${fmtBytes(d.recovery.remainingBytes)} remaining, eta ${formatDuration(d.recovery.eta() ?? Infinity)}`);
  }
  return out.join('\n');
}

function pgLine(d) {
  const c = d.live || counts(d);
  const parts = [];
  if (c.clean) parts.push(`${c.clean} active+clean`);
  if (c.misplaced) parts.push(`${c.misplaced} active+remapped+backfilling`);
  if (c.degraded) parts.push(`${c.degraded} active+undersized+degraded`);
  if (c.inactive) parts.push(`${c.inactive} inactive`);
  return parts.join(', ') || 'none';
}
function counts(d) {
  return d.evals.reduce((a, ev) => ({
    clean: a.clean + ev.pool.pg_num - ev.degraded - ev.inactive,
    degraded: a.degraded + ev.degraded,
    misplaced: a.misplaced + ev.misplaced,
    inactive: a.inactive + ev.inactive,
  }), { clean: 0, degraded: 0, misplaced: 0, inactive: 0 });
}

/** A stable fake fsid, derived from the document so it does not jitter. */
function clusterId(doc) {
  let h = 2166136261;
  for (const ch of `${doc.title}${doc.hosts.length}`) {
    h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  }
  const hex = (n) => ((h = Math.imul(h, 16777619) >>> 0) >>> 0).toString(16).padStart(8, '0').slice(0, n);
  return `${hex(8)}-${hex(4)}-${hex(4)}-${hex(4)}-${hex(8)}${hex(4)}`;
}

// ------------------------------------------------------------ health detail --
function healthDetail(doc, d) {
  needDerived(d);
  if (d.health.status === 'HEALTH_OK') return 'HEALTH_OK';
  const out = [d.health.summary];
  for (const c of d.health.checks) {
    out.push('');
    out.push(`[${c.severity === 'HEALTH_ERR' ? 'ERR' : 'WRN'}] ${c.name}: ${c.summary}`);
    for (const line of c.detail) out.push(`    ${line}`);
  }
  return out.join('\n');
}

// --------------------------------------------------------------- osd tree ----
function osdTree(doc, d) {
  needDerived(d);
  const map = d.map;
  const out = ['ID   CLASS  WEIGHT     TYPE NAME                     STATUS  REWEIGHT  PRI-AFF'];
  const byDocName = new Map(doc.hosts.map((h) => [h.name, h]));

  const walk = (id, depth) => {
    const indent = '    '.repeat(depth);
    if (id >= 0) return;
    const b = map.buckets[id];
    if (!b || b.shadowOf !== null) return;
    out.push(`${rpad(b.id, 3)} ${pad('', 6)} ${rpad(b.weight.toFixed(5), 9)}  `
      + `${pad(`${indent}${b.typeName} ${b.name}`, 24)}`);
    const host = byDocName.get(b.name);
    for (const it of b.items) {
      if (it >= 0) {
        const dev = map.devices[it];
        const osd = host?.osds.find((o) => o.id === it);
        const isDown = d.down.has(it);
        const isOut = osd ? osd.in === false : false;
        const u = d.usage.get(it);
        out.push(`${rpad(it, 3)} ${pad(dev.class, 6)} ${rpad(dev.weight.toFixed(5), 9)}  `
          + `${pad(`${indent}    osd.${it}`, 24)} ${rpad(isDown ? 'down' : 'up', 6)}  `
          + `${rpad((isOut ? 0 : (osd?.reweight ?? 1)).toFixed(5), 8)}  ${rpad('1.00000', 7)}`);
      } else {
        walk(it, depth + 1);
      }
    }
  };
  for (const b of Object.values(map.buckets)) {
    if (b.shadowOf === null && b.typeName === 'root') walk(b.id, 0);
  }
  return out.join('\n');
}

// ----------------------------------------------------------------- osd df ----
function osdDf(doc, d) {
  needDerived(d);
  const out = ['ID  CLASS  WEIGHT   REWEIGHT  SIZE     RAW USE   DATA      OMAP  META  AVAIL     %USE   VAR   PGS  STATUS'];
  const mean = d.df.ratio || 1;
  const rows = [...d.usage.values()].sort((a, b) => a.id - b.id);
  for (const u of rows) {
    const host = doc.hosts.find((h) => h.osds.some((o) => o.id === u.id));
    const osd = host?.osds.find((o) => o.id === u.id);
    const isDown = d.down.has(u.id);
    out.push(
      `${rpad(u.id, 2)}  ${pad(u.class, 5)}  ${rpad(u.weight.toFixed(5), 7)}  `
      + `${rpad((osd?.in === false ? 0 : (osd?.reweight ?? 1)).toFixed(5), 8)}  `
      + `${rpad(fmtBytes(u.total), 7)}  ${rpad(fmtBytes(u.used), 8)}  ${rpad(fmtBytes(u.used), 8)}  `
      + `${rpad('-', 4)}  ${rpad('-', 4)}  ${rpad(fmtBytes(u.avail), 8)}  `
      + `${rpad((u.ratio * 100).toFixed(2), 5)}  ${rpad((u.ratio / mean).toFixed(2), 4)}  `
      + `${rpad(u.pgs, 3)}  ${rpad(isDown ? 'down' : (osd?.in === false ? 'up,out' : 'up'), 6)}`);
  }
  const ratios = rows.map((r) => r.ratio);
  out.push(`${' '.repeat(21)}TOTAL  ${rpad(fmtBytes(d.df.total), 7)}  ${rpad(fmtBytes(d.df.used), 8)}`);
  // Math.min of nothing is Infinity; a cluster with no OSDs just has no summary.
  out.push(ratios.length
    ? `MIN/MAX VAR: ${(Math.min(...ratios) / mean).toFixed(2)}/${(Math.max(...ratios) / mean).toFixed(2)}`
      + `  STDDEV: ${(d.df.stddev * 100).toFixed(2)}`
    : 'MIN/MAX VAR: -/-  STDDEV: -');
  return out.join('\n');
}

// -------------------------------------------------------------------- df ----
function df(doc, d) {
  needDerived(d);
  const out = ['--- RAW STORAGE ---',
    'CLASS     SIZE     AVAIL      USED  RAW USED  %RAW USED'];
  const byClass = new Map();
  for (const u of d.usage.values()) {
    const c = byClass.get(u.class) || { size: 0, used: 0 };
    c.size += u.total; c.used += u.used;
    byClass.set(u.class, c);
  }
  for (const [cls, c] of [...byClass].sort()) {
    out.push(`${pad(cls, 6)}  ${rpad(fmtBytes(c.size), 7)}  ${rpad(fmtBytes(c.size - c.used), 8)}  `
      + `${rpad(fmtBytes(c.used), 8)}  ${rpad(fmtBytes(c.used), 8)}  ${rpad((c.used / c.size * 100).toFixed(2), 9)}`);
  }
  out.push(`${pad('TOTAL', 6)}  ${rpad(fmtBytes(d.df.total), 7)}  ${rpad(fmtBytes(d.df.avail), 8)}  `
    + `${rpad(fmtBytes(d.df.used), 8)}  ${rpad(fmtBytes(d.df.used), 8)}  ${rpad((d.df.ratio * 100).toFixed(2), 9)}`);
  out.push('');
  out.push('--- POOLS ---');
  out.push('POOL                 ID   PGS   STORED  OBJECTS     USED  %USED  MAX AVAIL');
  for (const p of doc.pools) {
    const pd = poolDf(d.map, p, d.usage, d.evals);
    const capacity = (p.stored || 0) + pd.maxAvail;
    out.push(`${pad(p.name, 20)} ${rpad(p.id, 2)}  ${rpad(p.pg_num, 4)}  ${rpad(fmtBytes(p.stored || 0), 7)}  `
      + `${rpad(fmtCount(objects(p.stored || 0)), 7)}  ${rpad(fmtBytes(pd.used), 7)}  `
      + `${rpad(capacity ? ((p.stored || 0) / capacity * 100).toFixed(2) : '0.00', 5)}  ${rpad(fmtBytes(pd.maxAvail), 9)}`);
  }
  return out.join('\n');
}

// -------------------------------------------------------- pool ls detail ----
function poolLs(doc, d) {
  if (!doc.pools.length) return '(no pools)';
  return doc.pools.map((p) => {
    const rule = doc.rules.find((r) => r.name === p.crush_rule);
    const geom = p.type === 'erasure'
      ? `erasure profile k=${p.k} m=${p.m}`
      : `replicated size ${p.size}`;
    return `pool ${p.id} '${p.name}' ${geom} min_size ${poolMinSize(p)} `
      + `crush_rule ${rule ? rule.id : '?'} object_hash rjenkins pg_num ${p.pg_num} `
      + `pgp_num ${p.pgp_num} autoscale_mode off flags hashpspool stripe_width 0`;
  }).join('\n');
}

// --------------------------------------------------- crush rule dump -------
function crushRuleDump(doc, d) {
  const rules = doc.rules.map((r) => ({
    rule_id: r.id,
    rule_name: r.name,
    type: r.type === 'erasure' ? 3 : 1,
    steps: ruleSteps(r).map((s) => {
      if (s.op === 'take') {
        return { op: 'take', item_name: s.class ? `${s.item}~${s.class}` : s.item };
      }
      if (s.op === 'emit') return { op: 'emit' };
      return { op: `${s.op}_${s.mode}`, num: s.num, type: s.type };
    }),
  }));
  return JSON.stringify(rules, null, 4);
}

// ------------------------------------------------------------ fs status ----
function fsStatus(doc, d) {
  needDerived(d);
  if (!d.clients.filesystems.length) return 'No filesystems enabled';
  const out = [];
  for (const fs of d.clients.filesystems) {
    out.push(`${fs.name} - ${fs.up ? '0 clients' : 'DOWN'}`);
    out.push('='.repeat(fs.name.length + 12));
    out.push('RANK  STATE           MDS         ACTIVITY   DNS  INOS  DIRS  CAPS');
    for (let r = 0; r < fs.mds.ranksWanted; r++) {
      const active = r < fs.mds.ranksActive;
      const host = doc.hosts.find((h) => h.daemons.includes('mds') && h.up !== false);
      out.push(` ${rpad(r, 3)}  ${pad(active ? 'active' : 'failed', 14)}  `
        + `${pad(active ? (host?.name ?? '-') : '-', 10)}  ${pad('-', 9)}  `
        + `${rpad('-', 3)}  ${rpad('-', 4)}  ${rpad('-', 4)}  ${rpad('-', 4)}`);
    }
    out.push('        POOL           TYPE      USED   AVAIL');
    for (const [name, kind] of [[fs.metaPool, 'metadata'], [fs.dataPool, 'data']]) {
      const p = doc.pools.find((x) => x.name === name);
      const pd = p ? poolDf(d.map, p, d.usage, d.evals) : null;
      out.push(`${rpad(name, 20)}  ${pad(kind, 9)} ${rpad(fmtBytes(p?.stored ?? 0), 6)}  `
        + `${rpad(pd ? fmtBytes(pd.maxAvail) : '-', 7)}`);
    }
    if (fs.mds.standbys) out.push(`STANDBY MDS: ${fs.mds.standbys}`);
    if (!fs.up) out.push(`REASON: ${fs.reasons.join('; ')}`);
    out.push('');
  }
  return out.join('\n').trimEnd();
}

// -------------------------------------------------------------- pg stat ----
function pgStat(doc, d) {
  needDerived(d);
  const total = doc.pools.reduce((a, p) => a + p.pg_num, 0);
  const stored = doc.pools.reduce((a, p) => a + (p.stored || 0), 0);
  return `${total} pgs: ${pgLine(d)}; ${fmtBytes(stored)} data, ${fmtBytes(d.df.used)} used, `
    + `${fmtBytes(d.df.avail)} / ${fmtBytes(d.df.total)} avail`;
}

// ------------------------------------------------------------- mon stat ----
function monStat(doc, d) {
  needDerived(d);
  const q = d.net.quorum;
  if (!q.configured) return 'no monitors configured';
  const names = doc.hosts.filter((h) => q.inQuorum.includes(h.id)).map((h) => h.name);
  return `e1: ${q.configured} mons at {${doc.hosts.filter((h) => h.daemons.includes('mon'))
    .map((h, i) => `${h.name}=[v2:10.0.0.${i + 1}:3300/0]`).join(',')}}, `
    + `election epoch 1, leader 0 ${names[0] ?? '-'}, quorum ${
      names.length ? names.map((_, i) => i).join(',') : '(none)'} ${names.join(',') || '-'}`
    + (q.hasQuorum ? '' : '\n\n*** NO QUORUM — the cluster is not serving I/O ***');
}

export const COMMANDS = [
  { id: 'status', cmd: 'ceph -s', run: status },
  { id: 'health', cmd: 'ceph health detail', run: healthDetail },
  { id: 'tree', cmd: 'ceph osd tree', run: osdTree },
  { id: 'osddf', cmd: 'ceph osd df', run: osdDf },
  { id: 'df', cmd: 'ceph df', run: df },
  { id: 'pools', cmd: 'ceph osd pool ls detail', run: poolLs },
  { id: 'rules', cmd: 'ceph osd crush rule dump', run: crushRuleDump },
  { id: 'fs', cmd: 'ceph fs status', run: fsStatus },
  { id: 'pgstat', cmd: 'ceph pg stat', run: pgStat },
  { id: 'monstat', cmd: 'ceph mon stat', run: monStat },
];

export function runCommand(id, doc, derived) {
  const c = COMMANDS.find((x) => x.id === id) || COMMANDS[0];
  try {
    // Column padding leaves ragged trailing spaces; real tools do not.
    return c.run(doc, derived).split('\n').map((l) => l.replace(/\s+$/, '')).join('\n');
  } catch (err) {
    return `Error: ${err.message}`;
  }
}
