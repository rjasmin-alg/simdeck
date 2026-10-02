// SPDX-License-Identifier: AGPL-3.0-or-later
// Preset clusters. Plain documents, built without touching the live model.
//
// Two of these are deliberately wrong. A sample that is always healthy teaches
// nothing — the interesting question is always "why did that take the pool down
// when this one survived?".

import { TiB } from './engine/capacity.js';
import { t } from './i18n.js';

let seq = 0;
const id = (p) => `${p}${(seq += 1).toString(36)}`;

function host(name, x, y, parent, osds, daemons = []) {
  return { id: id('h'), name, x, y, parent, up: true, daemons, osds };
}
function disks(n, size, cls, startAt) {
  return Array.from({ length: n }, (_, i) => ({
    id: startAt + i, size, class: cls, up: true, in: true, reweight: 1,
  }));
}
function doc(title, parts) {
  return {
    version: 1, title,
    fs: [], rbd: [], rgw: [],
    settings: { skew: 0.25, publicSpeed: 25, clusterSpeed: 25, maxBackfills: 1, recoveryFraction: 0.5 },
    ...parts,
  };
}
const rule = (rid, name, failureDomain, opts = {}) => ({
  id: rid, name, type: opts.type || 'replicated', root: 'default',
  class: opts.class || null, failureDomain, mode: opts.mode || (opts.type === 'erasure' ? 'indep' : 'firstn'),
});

// ------------------------------------------------------------------------- //
function hyperconverged() {
  seq = 0;
  const root = id('bk');
  const hosts = [];
  let osd = 0;
  for (let i = 0; i < 3; i++) {
    hosts.push(host(`ceph-0${i + 1}`, 120 + i * 240, 340, root,
      disks(4, 4, 'ssd', osd), ['mon', 'mgr', 'mds']));
    osd += 4;
  }
  const sw = { id: id('sw'), name: 'sw-core', x: 300, y: 120, speed: 25, ports: 48, up: true };
  return doc(t('s.hyperconverged'), {
    buckets: [{ id: root, name: 'default', type: 'root', parent: null }],
    hosts,
    switches: [sw],
    links: hosts.map((h) => ({ id: id('lk'), a: h.id, b: sw.id, net: 'public', speed: 25, up: true, offset: 0 })),
    rules: [rule(0, 'replicated_rule', 'host')],
    pools: [
      { id: 1, name: 'cephfs_data', type: 'replicated', size: 3, min_size: 2,
        pg_num: 128, pgp_num: 128, crush_rule: 'replicated_rule', stored: 6 * TiB },
      { id: 2, name: 'cephfs_metadata', type: 'replicated', size: 3, min_size: 2,
        pg_num: 32, pgp_num: 32, crush_rule: 'replicated_rule', stored: 0.2 * TiB },
    ],
    fs: [{ id: 1, name: 'cephfs', dataPool: 'cephfs_data',
           metaPool: 'cephfs_metadata', maxMds: 1 }],
  });
}

function threeRacks() {
  seq = 0;
  const root = id('bk');
  const buckets = [{ id: root, name: 'default', type: 'root', parent: null }];
  const hosts = [];
  const links = [];
  const switches = [];
  let osd = 0;
  for (let r = 0; r < 3; r++) {
    const rack = { id: id('bk'), name: `rack${r + 1}`, type: 'rack', parent: root };
    buckets.push(rack);
    const sw = { id: id('sw'), name: `tor-r${r + 1}`, x: 130 + r * 660, y: 110,
                 speed: 25, ports: 48, up: true };
    switches.push(sw);
    for (let h = 0; h < 3; h++) {
      const daemons = h === 0 ? ['mon'] : [];
      if (h === 1) daemons.push('mds');
      if (r === 0 && h === 0) daemons.push('mgr', 'rgw');
      if (r === 1 && h === 0) daemons.push('rgw');
      const node = host(`ceph-r${r + 1}-${h + 1}`, 40 + r * 660 + h * 210, 320, rack.id,
        [...disks(10, 8, 'hdd', osd), ...disks(2, 2, 'nvme', osd + 10)], daemons);
      osd += 12;
      hosts.push(node);
      links.push({ id: id('lk'), a: node.id, b: sw.id, net: 'public', speed: 25, up: true, offset: 0 });
      links.push({ id: id('lk'), a: node.id, b: sw.id, net: 'cluster', speed: 25, up: true, offset: 14 });
    }
  }
  // Spine, so the three racks are one L2 domain rather than three islands.
  const spine = { id: id('sw'), name: 'spine', x: 800, y: -50, speed: 100, ports: 32, up: true };
  switches.push(spine);
  for (const sw of switches.slice(0, 3)) {
    links.push({ id: id('lk'), a: sw.id, b: spine.id, net: 'public', speed: 100, up: true, offset: 0 });
  }
  return doc(t('s.threeRacks'), {
    buckets, hosts, switches, links,
    rules: [
      rule(0, 'replicated_rule', 'host'),
      rule(1, 'by-rack', 'rack'),
      rule(2, 'nvme-meta', 'host', { class: 'nvme' }),
      // 4+2 over 9 hosts places cleanly, but a rack holds 3 hosts and m is 2,
      // so this pool is NOT rack-tolerant even though `rbd` above is. That
      // contrast is the point of this sample.
      rule(3, 'ec-host', 'host', { type: 'erasure' }),
    ],
    pools: [
      // ~119 PG replicas per OSD across 108 OSDs, which is where Ceph wants to
      // sit: above mon_pg_warn_min_per_osd (30) and well under the 250 cap.
      // Small, hot pools go on NVMe; bulk data is erasure coded.
      { id: 1, name: 'rbd', type: 'replicated', size: 3, min_size: 2,
        pg_num: 1024, pgp_num: 1024, crush_rule: 'by-rack', stored: 40 * TiB },
      { id: 2, name: 'cephfs_metadata', type: 'replicated', size: 3, min_size: 2,
        pg_num: 128, pgp_num: 128, crush_rule: 'nvme-meta', stored: 0.5 * TiB },
      { id: 3, name: 'cephfs_data', type: 'erasure', k: 4, m: 2, min_size: 4,
        pg_num: 1024, pgp_num: 1024, crush_rule: 'ec-host', stored: 60 * TiB },
      { id: 4, name: 'rgw_index', type: 'replicated', size: 3, min_size: 2,
        pg_num: 64, pgp_num: 64, crush_rule: 'nvme-meta', stored: 0.1 * TiB },
      { id: 5, name: 'rgw_data', type: 'erasure', k: 4, m: 2, min_size: 4,
        pg_num: 512, pgp_num: 512, crush_rule: 'ec-host', stored: 25 * TiB },
    ],
    fs: [{ id: 1, name: 'cephfs', dataPool: 'cephfs_data',
           metaPool: 'cephfs_metadata', maxMds: 1 }],
    rbd: [
      { id: 1, name: 'vm-disks', pool: 'rbd', provisioned: 60 * TiB, used: 30 * TiB, thin: true },
      { id: 2, name: 'backups', pool: 'rbd', provisioned: 10 * TiB, used: 10 * TiB, thin: false },
    ],
    rgw: [{ id: 1, name: 's3', dataPool: 'rgw_data', indexPool: 'rgw_index', buckets: 24 }],
  });
}

/**
 * Same hardware as threeRacks, one word different in the rule: failure domain
 * `host` instead of `rack`. Everything reports healthy until a rack goes away,
 * and then a third of the PGs go inactive. Fix it by editing one dropdown.
 */
function replicasInOneRack() {
  const d = threeRacks();
  d.title = t('s.brokenRule');
  d.rules = [rule(0, 'replicated_rule', 'host')];
  d.fs = []; d.rbd = []; d.rgw = [];
  d.pools = [{
    id: 1, name: 'rbd', type: 'replicated', size: 3, min_size: 2,
    pg_num: 2048, pgp_num: 2048, crush_rule: 'replicated_rule', stored: 40 * TiB,
  }];
  return d;
}

/**
 * The trap that catches people who grow a cluster one server at a time.
 *
 * Three hosts, size 3, failure domain host: every PG must take one replica from
 * each host, so all three hosts carry identical data — but one has twelve disks
 * to spread it over and two have only two. The small hosts fill six times
 * faster, and because MAX AVAIL is set by the fullest OSD, they cap the whole
 * cluster. Adding disks to the big host does nothing at all.
 *
 * Note that simply making disks *different sizes* would not do this: CRUSH
 * weights by size, so a 16 TiB disk just takes 16x the PGs and fills at the same
 * rate. It is the host-level imbalance that bites.
 */
function unbalancedHosts() {
  seq = 0;
  const root = id('bk');
  const hosts = [
    host('ceph-big', 120, 340, root, disks(12, 8, 'hdd', 0), ['mon', 'mgr']),
    host('ceph-small-1', 400, 340, root, disks(2, 8, 'hdd', 12), ['mon']),
    host('ceph-small-2', 620, 340, root, disks(2, 8, 'hdd', 14), ['mon']),
  ];
  const sw = { id: id('sw'), name: 'sw-core', x: 330, y: 120, speed: 25, ports: 48, up: true };
  return doc(t('s.unbalanced'), {
    buckets: [{ id: root, name: 'default', type: 'root', parent: null }],
    hosts,
    switches: [sw],
    links: hosts.map((h) => ({ id: id('lk'), a: h.id, b: sw.id, net: 'public', speed: 25, up: true, offset: 0 })),
    rules: [rule(0, 'replicated_rule', 'host')],
    pools: [{
      id: 1, name: 'rbd', type: 'replicated', size: 3, min_size: 2,
      pg_num: 256, pgp_num: 256, crush_rule: 'replicated_rule', stored: 8 * TiB,
    }],
  });
}

// simdeck copy: titles and labels come from strings.js (s.*); the keys are the ?sample= presets, quoted so the
// manifest check finds each sim.json entry's key in the source.
export const SAMPLES = {
  'hyperconverged': { get label() { return t('s.hyperconverged'); }, make: hyperconverged },
  'threeRacks': { get label() { return t('s.threeRacks'); }, make: threeRacks },
  'brokenRule': { get label() { return t('s.brokenRuleShort'); }, make: replicasInOneRack },
  'unbalanced': { get label() { return t('s.unbalanced'); }, make: unbalancedHosts },
};

export const makeSample = (key) => (SAMPLES[key] ? SAMPLES[key].make() : null);
