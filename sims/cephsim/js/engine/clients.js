// SPDX-License-Identifier: AGPL-3.0-or-later
// What a user actually touches: a filesystem, a block device, an S3 endpoint.
//
// None of these store anything themselves. Each is a view over one or two RADOS
// pools plus the daemons that front it, and that is the point worth teaching:
// when CephFS goes read-only it is nearly always the pool underneath or the MDS
// in front, not "CephFS" as a thing.
//
// Data volume is deliberately a single number per client, as asked for — a
// percentage or an amount, not simulated objects.

import { poolDf, fmtBytes } from './capacity.js';
import { poolWidth, poolMinSize } from './pgmap.js';

const poolByName = (doc, name) => doc.pools.find((p) => p.name === name);

/** A pool is serving if none of its PGs are below min_size. */
function poolStatus(evals, pool) {
  if (!pool) return { ok: false, why: 'pool does not exist' };
  const ev = evals.find((e) => e.pool.id === pool.id);
  if (!ev) return { ok: false, why: 'pool has not been evaluated' };
  if (ev.inactive) {
    return { ok: false, why: `${ev.inactive} of ${ev.pool.pg_num} pgs below min_size ${poolMinSize(pool)}` };
  }
  if (ev.degraded) return { ok: true, degraded: true, why: `${ev.degraded} pgs degraded` };
  return { ok: true, degraded: false, why: '' };
}

export function clientState(doc, { map, evals, usage, daemons }) {
  const df = (pool) => (pool ? poolDf(map, pool, usage, evals) : null);

  // ------------------------------------------------------------- CephFS ----
  const filesystems = (doc.fs || []).map((fs) => {
    const data = poolByName(doc, fs.dataPool);
    const meta = poolByName(doc, fs.metaPool);
    const dataSt = poolStatus(evals, data);
    const metaSt = poolStatus(evals, meta);
    const mds = daemons.filesystems.find((f) => f.id === fs.id)
      || { up: daemons.mds.up > 0, ranksActive: Math.min(1, daemons.mds.up),
           ranksWanted: fs.maxMds || 1, standbys: Math.max(0, daemons.mds.up - 1) };
    const reasons = [];
    if (!mds.up) reasons.push('no active MDS');
    if (!metaSt.ok) reasons.push(`metadata pool: ${metaSt.why}`);
    if (!dataSt.ok) reasons.push(`data pool: ${dataSt.why}`);
    return {
      ...fs, kind: 'cephfs',
      up: mds.up && metaSt.ok && dataSt.ok,
      degraded: dataSt.degraded || metaSt.degraded || mds.ranksActive < mds.ranksWanted,
      reasons,
      used: data?.stored || 0,
      free: df(data)?.maxAvail ?? 0,
      capacity: (data?.stored || 0) + (df(data)?.maxAvail ?? 0),
      mds,
    };
  });

  // ---------------------------------------------------------------- RBD ----
  const rbd = (doc.rbd || []).map((img) => {
    const pool = poolByName(doc, img.pool);
    const st = poolStatus(evals, pool);
    return {
      ...img, kind: 'rbd',
      up: st.ok,
      degraded: !!st.degraded,
      reasons: st.ok ? [] : [`pool ${img.pool}: ${st.why}`],
      provisioned: img.provisioned || 0,
      used: img.thin ? (img.used || 0) : (img.provisioned || 0),
      free: df(pool)?.maxAvail ?? 0,
    };
  });

  // ---------------------------------------------------------------- RGW ----
  const rgw = (doc.rgw || []).map((gw) => {
    const data = poolByName(doc, gw.dataPool);
    const index = poolByName(doc, gw.indexPool);
    const dataSt = poolStatus(evals, data);
    const indexSt = poolStatus(evals, index);
    const reasons = [];
    if (!daemons.objectGatewayUp) reasons.push('no radosgw running');
    if (!indexSt.ok) reasons.push(`index pool: ${indexSt.why}`);
    if (!dataSt.ok) reasons.push(`data pool: ${dataSt.why}`);
    return {
      ...gw, kind: 'rgw',
      up: daemons.objectGatewayUp && dataSt.ok && indexSt.ok,
      degraded: dataSt.degraded || indexSt.degraded,
      reasons,
      used: data?.stored || 0,
      free: df(data)?.maxAvail ?? 0,
      buckets: gw.buckets || 0,
    };
  });

  // RBD is the one place a user can promise more than exists, so say so.
  const overcommit = [];
  for (const pool of doc.pools) {
    const imgs = rbd.filter((i) => i.pool === pool.name);
    if (!imgs.length) continue;
    const provisioned = imgs.reduce((a, i) => a + i.provisioned, 0);
    const d = df(pool);
    const capacity = (pool.stored || 0) + (d?.maxAvail ?? 0);
    if (provisioned > capacity) {
      overcommit.push({
        pool: pool.name, provisioned, capacity,
        ratio: capacity ? provisioned / capacity : Infinity,
      });
    }
  }

  return { filesystems, rbd, rgw, overcommit };
}

/** Pools a client layer depends on — used to warn before deleting one. */
export function poolConsumers(doc, poolName) {
  const out = [];
  for (const fs of doc.fs || []) {
    if (fs.dataPool === poolName) out.push(`${fs.name} (data)`);
    if (fs.metaPool === poolName) out.push(`${fs.name} (metadata)`);
  }
  for (const img of doc.rbd || []) if (img.pool === poolName) out.push(`${img.name} (rbd)`);
  for (const gw of doc.rgw || []) {
    if (gw.dataPool === poolName) out.push(`${gw.name} (rgw data)`);
    if (gw.indexPool === poolName) out.push(`${gw.name} (rgw index)`);
  }
  return out;
}

export { fmtBytes };
