// Capacity. The part everyone gets wrong on a real cluster.
//
// A Ceph cluster does not have "free space". It has a fullest OSD, and that OSD
// decides when writes stop. `ceph df`'s MAX AVAIL is not total-free/size — it is
// a projection from whichever OSD will hit the full ratio first, given its share
// of the CRUSH weight. A cluster with 400 TB free and one 90%-full OSD has very
// little MAX AVAIL, and that surprise is the reason this module exists.

import { devicesUnder } from './crushmap.js';
import { poolEfficiency, poolWidth } from './pgmap.js';

export const RATIOS = { nearfull: 0.85, backfillfull: 0.90, full: 0.95 };

export const TiB = 1024 ** 4;
export const GiB = 1024 ** 3;

/** Human byte formatting in the units `ceph df` uses. */
export function fmtBytes(b) {
  if (!isFinite(b)) return '-';
  const neg = b < 0; b = Math.abs(b);
  const u = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];
  let i = 0;
  while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
  const s = b >= 100 || i === 0 ? b.toFixed(0) : b.toFixed(b >= 10 ? 1 : 2);
  return `${neg ? '-' : ''}${s} ${u[i]}`;
}

/**
 * Per-OSD usage, summed over every pool's contribution.
 *
 * @param {object} map
 * @param {object[]} evals  results from evaluatePool()
 * @returns {Map<number, {used, total, avail, ratio, pgs, class, weight}>}
 */
export function osdUsage(map, evals) {
  const usage = new Map();
  for (const id of Object.keys(map.devices).map(Number)) {
    const d = map.devices[id];
    usage.set(id, {
      id, used: 0, pgs: 0,
      total: d.weight * TiB,        // CRUSH weight is TiB by convention
      class: d.class, weight: d.weight,
      avail: d.weight * TiB, ratio: 0,
    });
  }
  for (const ev of evals) {
    for (const [osd, bytes] of ev.osdBytes) {
      const u = usage.get(osd);
      if (u) u.used += bytes;
    }
    for (const [osd, n] of ev.osdPgs) {
      const u = usage.get(osd);
      if (u) u.pgs += n;
    }
  }
  for (const u of usage.values()) {
    u.avail = Math.max(0, u.total - u.used);
    u.ratio = u.total > 0 ? u.used / u.total : 0;
  }
  return usage;
}

/**
 * The normalised weight each OSD contributes to a rule, as
 * crush_get_rule_weight_osd_map does: walk the rule's root, sum device weights,
 * divide through so the shares add to 1.
 */
export function ruleWeightMap(map, ruleRef) {
  const rule = typeof ruleRef === 'number'
    ? map.rules.find((r) => r.id === ruleRef)
    : map.rules.find((r) => r.name === ruleRef);
  if (!rule) return new Map();
  const take = rule.steps.find((s) => s.op === 'take');
  if (!take) return new Map();
  const rootId = map.rootId(take.item, take.class);
  if (rootId === undefined) return new Map();

  const wm = new Map();
  let total = 0;
  for (const id of devicesUnder(map, rootId)) {
    const w = map.devices[id]?.weight ?? 0;
    if (w <= 0) continue;
    wm.set(id, w);
    total += w;
  }
  if (total > 0) for (const [k, v] of wm) wm.set(k, v / total);
  return wm;
}

/**
 * Raw bytes still writable through a rule before the first OSD hits the full
 * ratio. Ported from PGMap::get_rule_avail.
 */
export function ruleAvail(map, ruleRef, usage, fullRatio = RATIOS.full) {
  const wm = ruleWeightMap(map, ruleRef);
  let min = -1;
  for (const [osd, share] of wm) {
    const u = usage.get(osd);
    if (!u || u.total === 0 || share === 0) continue;
    const headroom = u.total * fullRatio - u.used;
    const proj = headroom / share;
    if (min < 0 || proj < min) min = proj;
  }
  return Math.max(0, min);
}

/** `ceph df` for one pool: what a user can still write into it. */
export function poolDf(map, pool, usage, evals) {
  const ev = evals.find((e) => e.pool.id === pool.id);
  const raw = ruleAvail(map, pool.crush_rule, usage);
  return {
    name: pool.name,
    stored: pool.stored || 0,
    used: ev ? ev.rawUsed : 0,                 // raw bytes on disk
    maxAvail: raw * poolEfficiency(pool),      // usable bytes still writable
    efficiency: poolEfficiency(pool),
    width: poolWidth(pool),
  };
}

/** Cluster-wide `ceph df` header plus the fullness warnings. */
export function clusterDf(map, usage) {
  let total = 0, used = 0;
  for (const u of usage.values()) { total += u.total; used += u.used; }
  const nearfull = [], backfillfull = [], full = [];
  for (const u of usage.values()) {
    if (u.ratio >= RATIOS.full) full.push(u.id);
    else if (u.ratio >= RATIOS.backfillfull) backfillfull.push(u.id);
    else if (u.ratio >= RATIOS.nearfull) nearfull.push(u.id);
  }
  const ratios = [...usage.values()].map((u) => u.ratio).filter((r) => r > 0);
  const mean = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0;
  return {
    total, used, avail: total - used,
    ratio: total ? used / total : 0,
    nearfull, backfillfull, full,
    // How lopsided the fill is — the number the balancer exists to shrink.
    spread: ratios.length ? (Math.max(...ratios) - Math.min(...ratios)) : 0,
    stddev: ratios.length
      ? Math.sqrt(ratios.reduce((a, r) => a + (r - mean) ** 2, 0) / ratios.length)
      : 0,
  };
}
