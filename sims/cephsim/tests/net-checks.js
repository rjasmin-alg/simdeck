// Network, quorum, daemons and health.
//
// The interesting cases here are the ones where the disks are all fine and the
// cluster is down anyway, because those are the ones people do not expect.

import { networkState, hostBandwidth } from '../js/engine/net.js';
import { daemonState } from '../js/engine/daemons.js';
import { clusterHealth } from '../js/engine/health.js';
import { evaluate, invalidate } from '../js/compile.js';
import { migrate, newDoc } from '../js/model.js';
import { makeSample, SAMPLES } from '../js/samples.js';
import { TiB } from '../js/engine/capacity.js';

export const results = [];
function check(name, fn) {
  try { results.push({ name, pass: true, detail: fn() || '' }); }
  catch (err) { results.push({ name, pass: false, detail: err.message }); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const sample = (k) => migrate(makeSample(k));
const ev = (doc) => { invalidate(); return evaluate(doc); };
const named = (doc, n) => doc.hosts.find((h) => h.name === n);
const sw = (doc, n) => doc.switches.find((s) => s.name === n);
const checkNames = (d) => new Set(d.health.checks.map((c) => c.name));

// Every name this simulator is allowed to emit. Ceph's real ones only — if a
// check gets invented, this list is where the argument has to happen.
const REAL_CEPH_CHECKS = new Set([
  'MON_DOWN', 'MGR_DOWN', 'OSD_DOWN', 'OSD_HOST_DOWN', 'OSD_OUT',
  'OSD_FULL', 'OSD_BACKFILLFULL', 'OSD_NEARFULL',
  'PG_AVAILABILITY', 'PG_DEGRADED', 'OBJECT_MISPLACED',
  'TOO_FEW_PGS', 'TOO_MANY_PGS',
  'MDS_ALL_DOWN', 'FS_DEGRADED', 'MDS_INSUFFICIENT_STANDBY',
]);

// ---------------------------------------------------------------- quorum ----
check('a majority of monitors is required, and a minority is not enough', () => {
  const d1 = sample('hyperconverged');
  named(d1, 'ceph-01').up = false;
  const n1 = networkState(d1);
  assert(n1.quorum.hasQuorum, '2 of 3 mons should hold quorum');

  const d2 = sample('hyperconverged');
  named(d2, 'ceph-01').up = false;
  named(d2, 'ceph-02').up = false;
  const n2 = networkState(d2);
  assert(!n2.quorum.hasQuorum, '1 of 3 mons should not hold quorum');
  assert(!n2.quorum.partitioned, 'mons being down is not a partition');
  assert(n2.quorum.needed === 2, `needed ${n2.quorum.needed}, expected 2`);
  return '3 mons: 1 down ok, 2 down lost';
});

check('losing the spine splits three racks and takes the cluster down', () => {
  // Every disk is healthy. One switch is not. This is the failure that surprises
  // people most, and it is entirely a monitor problem.
  const doc = sample('threeRacks');
  sw(doc, 'spine').up = false;
  const n = networkState(doc);
  assert(!n.quorum.hasQuorum, 'three isolated racks with one mon each should have no quorum');
  assert(n.quorum.partitioned, 'this is a partition, not mons being down');
  assert(n.quorum.largestGroup === 1, `largest group ${n.quorum.largestGroup}, expected 1`);
  assert(n.unreachableHosts.size === doc.hosts.length, 'without quorum nothing serves');
  const d = ev(doc);
  assert(d.health.status === 'HEALTH_ERR', `status ${d.health.status}`);
  assert(checkNames(d).has('MON_DOWN'), 'no MON_DOWN reported');
  assert(d.evals.every((e) => e.inactive === e.pool.pg_num),
    'every PG should be inactive when the cluster has no quorum');
  return `all ${doc.hosts.length} hosts unreachable, every PG inactive, disks untouched`;
});

check('losing one top-of-rack switch keeps quorum and only degrades', () => {
  const doc = sample('threeRacks');
  sw(doc, 'tor-r1').up = false;
  const n = networkState(doc);
  assert(n.quorum.hasQuorum, 'two racks out of three should still hold quorum');
  assert(n.unreachableHosts.size === 3, `${n.unreachableHosts.size} hosts unreachable, expected 3`);
  const d = ev(doc);
  const rbd = d.evals.find((e) => e.pool.name === 'rbd');
  assert(rbd.inactive === 0, `${rbd.inactive} PGs inactive on a rack-aware pool`);
  assert(rbd.degraded > 0, 'losing a rack should degrade the rack-aware pool');
  assert(checkNames(d).has('OSD_HOST_DOWN'), 'no OSD_HOST_DOWN reported');
  return `3 hosts cut off, rbd ${rbd.degraded} degraded / 0 inactive`;
});

check('a host cut off from the mons is marked down even though it is running', () => {
  const doc = sample('threeRacks');
  const host = named(doc, 'ceph-r1-1');
  doc.links = doc.links.filter((l) => l.a !== host.id && l.b !== host.id);
  // It still has cables in the document? No — remove them all, so fall back to
  // an explicit cut instead: keep one cable but mark it down.
  const doc2 = sample('threeRacks');
  const h2 = named(doc2, 'ceph-r1-1');
  for (const l of doc2.links) if (l.a === h2.id || l.b === h2.id) l.up = false;
  const n = networkState(doc2);
  assert(n.unreachableHosts.has(h2.id), 'a host with every cable down should be unreachable');
  assert(/public/.test(n.reasons.get(h2.id)), `reason was "${n.reasons.get(h2.id)}"`);
  assert(h2.up !== false, 'the host itself is still running — that is the point');
  const d = ev(doc2);
  assert(checkNames(d).has('OSD_DOWN'), 'its OSDs should be reported down');
  return `reason: ${n.reasons.get(h2.id)}`;
});

check('losing only the cluster network still takes an OSD down', () => {
  // Clients can still reach it; its peers cannot. On a real cluster this flaps
  // for a while and then settles here: reported down by its peers.
  const doc = sample('threeRacks');
  const host = named(doc, 'ceph-r1-1');
  for (const l of doc.links) {
    if (l.net === 'cluster' && (l.a === host.id || l.b === host.id)) l.up = false;
  }
  const n = networkState(doc);
  assert(n.unreachableHosts.has(host.id), 'a host isolated on the cluster network should go down');
  assert(/cluster network/.test(n.reasons.get(host.id)), `reason was "${n.reasons.get(host.id)}"`);
  assert(n.quorum.hasQuorum, 'the cluster network has nothing to do with quorum');
  return `reason: ${n.reasons.get(host.id)}`;
});

// ------------------------------------------------- not-yet-drawn networks ---
check('a document with no cables does not pretend the cluster is partitioned', () => {
  const doc = sample('unbalanced');
  doc.links = [];
  const n = networkState(doc);
  assert(!n.enabled, 'network modelling should be off with no cables');
  assert(n.quorum.hasQuorum, 'an undrawn network must not break quorum');
  assert(n.unreachableHosts.size === 0, `${n.unreachableHosts.size} hosts wrongly unreachable`);
  const d = ev(doc);
  assert(d.evals.every((e) => e.inactive === 0), 'an undrawn network took PGs offline');
  return 'network off, cluster healthy';
});

check('an uncabled host in a cabled cluster is left alone, not declared dead', () => {
  const doc = sample('threeRacks');
  const host = named(doc, 'ceph-r2-2');
  doc.links = doc.links.filter((l) => l.a !== host.id && l.b !== host.id);
  const n = networkState(doc);
  assert(n.enabled, 'the rest of the cluster is still cabled');
  assert(n.uncabled.has(host.id), 'the uncabled host was not noticed');
  assert(!n.unreachableHosts.has(host.id),
    'a half-drawn diagram must not report a dead host — that is alarming and wrong');
  return '1 uncabled host, reported but not failed';
});

// -------------------------------------------------------------- daemons -----
check('MGR is active/standby and losing it costs stats, not data', () => {
  const doc = sample('threeRacks');
  for (const h of doc.hosts) h.daemons = h.daemons.filter((x) => x !== 'mgr');
  const d = ev(doc);
  assert(checkNames(d).has('MGR_DOWN'), 'no MGR_DOWN with every manager gone');
  const mgr = d.health.checks.find((c) => c.name === 'MGR_DOWN');
  assert(mgr.severity === 'HEALTH_WARN', 'losing the mgr is a warning, not an error');
  assert(d.evals.every((e) => e.inactive === 0), 'losing the mgr took data offline');
  return 'MGR_DOWN is a warning and the data keeps serving';
});

check('CephFS goes down when its last MDS does, and RADOS underneath does not', () => {
  const doc = sample('hyperconverged');
  doc.fs = [{ id: 1, name: 'cephfs', dataPool: 'cephfs_data',
              metaPool: 'cephfs_metadata', maxMds: 1 }];
  const healthy = ev(doc);
  assert(healthy.daemons.filesystems[0].up, 'the filesystem should start up');

  const gone = sample('hyperconverged');
  gone.fs = doc.fs;
  for (const h of gone.hosts) h.daemons = h.daemons.filter((x) => x !== 'mds');
  const d = ev(gone);
  assert(!d.daemons.filesystems[0].up, 'the filesystem should be down with no MDS');
  assert(checkNames(d).has('MDS_ALL_DOWN'), 'no MDS_ALL_DOWN reported');
  assert(d.health.status === 'HEALTH_ERR', 'a filesystem outage is an error');
  assert(d.evals.every((e) => e.inactive === 0),
    'losing every MDS must not take the RADOS pools underneath offline');
  return 'MDS_ALL_DOWN, pools below still active';
});

check('a single MDS with no standby is called out before it bites', () => {
  const doc = sample('hyperconverged');
  doc.fs = [{ id: 1, name: 'cephfs', dataPool: 'cephfs_data', metaPool: 'cephfs_metadata', maxMds: 1 }];
  for (const h of doc.hosts.slice(1)) h.daemons = h.daemons.filter((x) => x !== 'mds');
  const d = ev(doc);
  assert(checkNames(d).has('MDS_INSUFFICIENT_STANDBY'), 'no standby warning for a lone MDS');
  return 'MDS_INSUFFICIENT_STANDBY';
});

// --------------------------------------------------------------- health -----
check('an even monitor count is called out as pointless', () => {
  const doc = sample('hyperconverged');
  doc.hosts[2].daemons = doc.hosts[2].daemons.filter((x) => x !== 'mon');
  const d = ev(doc);
  const mon = d.health.checks.find((c) => c.name === 'MON_DOWN');
  assert(mon && /even number/.test(mon.summary), `expected the even-count warning, got ${mon?.summary}`);
  return mon.summary;
});

check('fullness escalates warn then error at Ceph\'s own ratios', () => {
  const doc = sample('unbalanced');
  doc.pools[0].stored = 13 * TiB;                 // pushes the small hosts hard
  const d = ev(doc);
  const names = checkNames(d);
  assert(names.has('OSD_NEARFULL') || names.has('OSD_FULL'),
    `no fullness check at ${(d.df.spread * 100).toFixed(0)} pts of spread`);
  if (names.has('OSD_FULL')) assert(d.health.status === 'HEALTH_ERR', 'a full OSD is an error');
  return [...names].filter((n) => n.startsWith('OSD_') && n.includes('FULL')).join(', ');
});

check('inactive PGs are an error and degraded ones are only a warning', () => {
  const doc = sample('brokenRule');
  const rack = doc.buckets.find((b) => b.name === 'rack1');
  for (const h of doc.hosts) if (h.parent === rack.id) h.up = false;
  const d = ev(doc);
  assert(checkNames(d).has('PG_AVAILABILITY'), 'no PG_AVAILABILITY with inactive PGs');
  assert(d.health.status === 'HEALTH_ERR', 'inactive PGs must be an error');
  const avail = d.health.checks.find((c) => c.name === 'PG_AVAILABILITY');
  assert(avail.severity === 'HEALTH_ERR', 'PG_AVAILABILITY should be an error');
  const deg = d.health.checks.find((c) => c.name === 'PG_DEGRADED');
  assert(!deg || deg.severity === 'HEALTH_WARN', 'PG_DEGRADED should only be a warning');
  return `${avail.summary}`;
});

check('PG-per-OSD sizing warnings fire at Ceph\'s thresholds', () => {
  const few = sample('threeRacks');
  few.pools = [{ ...few.pools[0], pg_num: 8, pgp_num: 8, stored: TiB }];
  assert(checkNames(ev(few)).has('TOO_FEW_PGS'), 'no TOO_FEW_PGS with 8 pgs over 108 OSDs');

  const many = sample('hyperconverged');
  many.pools = [{ ...many.pools[0], pg_num: 4096, pgp_num: 4096 }];
  assert(checkNames(ev(many)).has('TOO_MANY_PGS'), 'no TOO_MANY_PGS with 4096 pgs over 12 OSDs');
  return 'TOO_FEW_PGS and TOO_MANY_PGS both fire';
});

check('a healthy sample really is HEALTH_OK', () => {
  const out = [];
  for (const key of Object.keys(SAMPLES)) {
    const d = ev(sample(key));
    out.push(`${key}: ${d.health.status}`);
    if (key === 'unbalanced') continue;          // deliberately lopsided
    assert(d.health.status === 'HEALTH_OK',
      `${key} is not clean: ${d.health.checks.map((c) => c.name).join(', ')}`);
  }
  return out.join(', ');
});

check('no invented check names', () => {
  // The promise is that what you learn here is what you grep for on a real
  // cluster. Anything not in Ceph's vocabulary has to be argued for explicitly.
  const seen = new Set();
  const docs = [sample('threeRacks'), sample('brokenRule'), sample('unbalanced'),
                sample('hyperconverged')];
  for (const doc of docs) {
    for (const variant of [
      (d) => d,
      (d) => { d.hosts[0].up = false; return d; },
      (d) => { for (const s of d.switches) s.up = false; return d; },
      (d) => { d.pools.forEach((p) => { p.stored = 400 * TiB; }); return d; },
      (d) => { d.hosts.forEach((h) => { h.daemons = []; }); return d; },
      (d) => { d.pools.forEach((p) => { p.pg_num = 4; p.pgp_num = 2; }); return d; },
    ]) {
      const copy = variant(migrate(JSON.parse(JSON.stringify(doc))));
      for (const n of checkNames(ev(copy))) seen.add(n);
    }
  }
  const invented = [...seen].filter((n) => !REAL_CEPH_CHECKS.has(n));
  assert(!invented.length, `not real Ceph check names: ${invented.join(', ')}`);
  assert(seen.size >= 8, `only ${seen.size} distinct checks exercised`);
  return `${seen.size} distinct checks, all real: ${[...seen].sort().join(' ')}`;
});

check('recovery bandwidth comes from the cluster network when there is one', () => {
  const doc = sample('threeRacks');
  const host = named(doc, 'ceph-r1-1');
  const withCluster = hostBandwidth(doc, host.id);
  assert(withCluster > 0, 'no bandwidth found for a cabled host');
  // 1x25G cluster link = 25e9/8 bytes per second.
  assert(Math.abs(withCluster - 25e9 / 8) < 1, `${withCluster} B/s, expected ${25e9 / 8}`);
  const noCluster = migrate(makeSample('hyperconverged'));   // public only
  const b = hostBandwidth(noCluster, noCluster.hosts[0].id);
  assert(b === 25e9 / 8, `public-only fallback gave ${b}`);
  return `cluster net ${(withCluster / 1e9).toFixed(2)} GB/s, public-only fallback works`;
});
