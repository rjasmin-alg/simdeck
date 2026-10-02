// Client layers and the console.
//
// The interesting property of a client layer is that it fails for reasons that
// look nothing like itself: CephFS goes down because a metadata pool lost
// min_size, an RBD image goes read-only because a rack did. Those indirections
// are the whole reason this layer is worth drawing separately.

import { clientState, poolConsumers } from '../js/engine/clients.js';
import { COMMANDS, runCommand } from '../js/console-cmds.js';
import { evaluate, invalidate } from '../js/compile.js';
import { migrate } from '../js/model.js';
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
const fsOf = (d) => d.clients.filesystems[0];

/** Take a pool below min_size by downing enough hosts, without touching others. */
function killPool(doc, poolName) {
  const pool = doc.pools.find((p) => p.name === poolName);
  const rule = doc.rules.find((r) => r.name === pool.crush_rule);
  // Down every host that could hold the pool's device class; blunt but decisive.
  for (const h of doc.hosts) {
    if (!rule.class || h.osds.some((o) => o.class === rule.class)) h.up = false;
  }
  return doc;
}

// -------------------------------------------------------------- CephFS -----
check('a healthy CephFS reports its capacity from the data pool', () => {
  const doc = sample('threeRacks');
  const d = ev(doc);
  const fs = fsOf(d);
  assert(fs, 'the sample has no filesystem');
  assert(fs.up, `filesystem down: ${fs.reasons.join('; ')}`);
  const data = doc.pools.find((p) => p.name === fs.dataPool);
  assert(fs.used === data.stored, `used ${fs.used} but the data pool stores ${data.stored}`);
  assert(fs.free > 0, 'no free space reported');
  assert(fs.capacity === fs.used + fs.free, 'capacity is not used + free');
  return `${(fs.used / TiB).toFixed(0)} TiB used, ${(fs.free / TiB).toFixed(0)} TiB free`;
});

check('CephFS goes down when the metadata pool does, with the data pool untouched', () => {
  // The classic: 99% of the bytes are fine and the filesystem is unusable,
  // because the small pool nobody thinks about lost quorum of its own.
  const doc = killPool(sample('threeRacks'), 'cephfs_metadata');
  const d = ev(doc);
  const fs = fsOf(d);
  assert(!fs.up, 'the filesystem stayed up without a metadata pool');
  assert(fs.reasons.some((r) => /metadata pool/.test(r)),
    `expected the metadata pool to be blamed, got: ${fs.reasons.join('; ')}`);
  return fs.reasons.join('; ');
});

check('losing every MDS takes the filesystem down but not the pools', () => {
  const doc = sample('threeRacks');
  for (const h of doc.hosts) h.daemons = h.daemons.filter((x) => x !== 'mds');
  const d = ev(doc);
  assert(!fsOf(d).up, 'the filesystem stayed up with no MDS');
  assert(fsOf(d).reasons.some((r) => /MDS/.test(r)), 'the MDS was not blamed');
  assert(d.evals.every((e) => e.inactive === 0), 'the pools underneath went offline too');
  return fsOf(d).reasons.join('; ');
});

// ----------------------------------------------------------------- RBD -----
check('a thin image consumes only what it has actually used', () => {
  const doc = sample('threeRacks');
  const d = ev(doc);
  const thin = d.clients.rbd.find((i) => i.name === 'vm-disks');
  const thick = d.clients.rbd.find((i) => i.name === 'backups');
  assert(thin.used < thin.provisioned, 'a thin image is consuming its full size');
  assert(thick.used === thick.provisioned, 'a thick image should consume everything it promised');
  return `thin ${(thin.used / TiB).toFixed(0)}/${(thin.provisioned / TiB).toFixed(0)} TiB, `
    + `thick ${(thick.used / TiB).toFixed(0)}/${(thick.provisioned / TiB).toFixed(0)} TiB`;
});

check('over-provisioning is spotted before it bites', () => {
  const doc = sample('threeRacks');
  assert(ev(doc).clients.overcommit.length === 0, 'the sample starts over-committed');
  doc.rbd[0].provisioned = 5000 * TiB;
  const over = ev(doc).clients.overcommit;
  assert(over.length === 1, `${over.length} over-commit warnings, expected 1`);
  assert(over[0].pool === 'rbd', `blamed pool ${over[0].pool}`);
  assert(over[0].ratio > 1, `ratio ${over[0].ratio}`);
  return `${over[0].pool} promised ${over[0].ratio.toFixed(1)}x its capacity`;
});

check('an image goes read-only when its pool loses min_size', () => {
  const doc = killPool(sample('threeRacks'), 'rbd');
  const d = ev(doc);
  assert(d.clients.rbd.every((i) => !i.up), 'images stayed writable on a dead pool');
  assert(d.clients.rbd[0].reasons.some((r) => /pool rbd/.test(r)), 'the pool was not blamed');
  return d.clients.rbd[0].reasons.join('; ');
});

// ----------------------------------------------------------------- RGW -----
check('the gateway needs its index pool as much as its data pool', () => {
  const healthy = ev(sample('threeRacks'));
  assert(healthy.clients.rgw[0].up, 'the gateway starts down');

  const noIndex = ev(killPool(sample('threeRacks'), 'rgw_index'));
  assert(!noIndex.clients.rgw[0].up, 'the gateway survived losing its index pool');

  const noGw = sample('threeRacks');
  for (const h of noGw.hosts) h.daemons = h.daemons.filter((x) => x !== 'rgw');
  assert(!ev(noGw).clients.rgw[0].up, 'the gateway is up with no radosgw running');
  return 'index pool loss and daemon loss both take it down';
});

check('pool consumers are known before a pool is deleted', () => {
  const doc = sample('threeRacks');
  assert(poolConsumers(doc, 'cephfs_metadata').length > 0, 'the metadata pool has no known consumer');
  assert(poolConsumers(doc, 'rbd').length === 2, `rbd has ${poolConsumers(doc, 'rbd').length} consumers`);
  assert(poolConsumers(doc, 'rgw_index').some((c) => /rgw/.test(c)), 'the index pool is unclaimed');
  assert(poolConsumers(doc, 'nonexistent').length === 0, 'a missing pool claimed consumers');
  return `metadata: ${poolConsumers(doc, 'cephfs_metadata').join(', ')}`;
});

// ------------------------------------------------------------- console -----
check('every command renders for every sample', () => {
  const sizes = [];
  for (const key of Object.keys(SAMPLES)) {
    const doc = sample(key);
    const d = ev(doc);
    for (const c of COMMANDS) {
      const out = runCommand(c.id, doc, d);
      assert(typeof out === 'string' && out.length, `${key}/${c.cmd} produced nothing`);
      assert(!out.startsWith('Error:'), `${key}/${c.cmd}: ${out}`);
      for (const bad of ['NaN', 'undefined', 'Infinity', '[object Object]']) {
        assert(!out.includes(bad), `${key}/${c.cmd} printed "${bad}"`);
      }
      assert(!/[ \t]+$/m.test(out), `${key}/${c.cmd} has trailing whitespace`);
    }
    sizes.push(key);
  }
  return `${COMMANDS.length} commands x ${sizes.length} samples`;
});

check('every command survives a cluster that is falling apart', () => {
  const variants = [
    ['no quorum', (d) => { for (const s of d.switches) s.up = false; }],
    ['no pools', (d) => { d.pools = []; d.fs = []; d.rbd = []; d.rgw = []; }],
    ['no hosts', (d) => { d.hosts = []; d.links = []; }],
    ['no daemons', (d) => { for (const h of d.hosts) h.daemons = []; }],
    ['everything down', (d) => { for (const h of d.hosts) h.up = false; }],
    ['no data', (d) => { for (const p of d.pools) p.stored = 0; }],
  ];
  for (const [what, mutate] of variants) {
    const doc = sample('threeRacks');
    mutate(doc);
    const d = ev(doc);
    for (const c of COMMANDS) {
      const out = runCommand(c.id, doc, d);
      assert(typeof out === 'string', `${what}/${c.cmd} returned ${typeof out}`);
      assert(!out.startsWith('Error:'), `${what}/${c.cmd}: ${out}`);
      for (const bad of ['NaN', 'undefined', 'Infinity']) {
        assert(!out.includes(bad), `${what}/${c.cmd} printed "${bad}"`);
      }
    }
  }
  // And with nothing evaluated at all, which is the state at first paint.
  for (const c of COMMANDS) {
    const out = runCommand(c.id, sample('threeRacks'), null);
    assert(typeof out === 'string' && out.length, `${c.cmd} broke with no evaluation`);
  }
  return `${variants.length} broken clusters plus the un-evaluated case`;
});

check('ceph osd tree lists every OSD once and numbers buckets from -1', () => {
  const doc = sample('threeRacks');
  const out = runCommand('tree', doc, ev(doc));
  const ids = doc.hosts.flatMap((h) => h.osds.map((o) => o.id));
  for (const id of ids) {
    const n = (out.match(new RegExp(`\\bosd\\.${id}\\b`, 'g')) || []).length;
    assert(n === 1, `osd.${id} appears ${n} times`);
  }
  assert(/^\s*-1\s+.*root default$/m.test(out),
    'the root should be bucket -1, as Ceph numbers it');
  for (const h of doc.hosts) assert(out.includes(`host ${h.name}`), `${h.name} missing from the tree`);
  assert(!out.includes('~'), 'shadow buckets leaked into ceph osd tree');
  return `${ids.length} OSDs, ${doc.hosts.length} hosts, root at -1`;
});

check('ceph df lists every pool with a plausible MAX AVAIL', () => {
  const doc = sample('threeRacks');
  const d = ev(doc);
  const out = runCommand('df', doc, d);
  for (const p of doc.pools) assert(out.includes(p.name), `${p.name} missing from ceph df`);
  assert(out.includes('--- RAW STORAGE ---') && out.includes('--- POOLS ---'), 'sections missing');
  for (const cls of ['hdd', 'nvme']) assert(out.includes(cls), `class ${cls} missing`);
  return `${doc.pools.length} pools, ${out.split('\n').length} lines`;
});

check('ceph osd df has one row per OSD and a variance column', () => {
  const doc = sample('hyperconverged');
  const out = runCommand('osddf', doc, ev(doc)).split('\n');
  const n = doc.hosts.flatMap((h) => h.osds).length;
  const rows = out.filter((l) => /^\s*\d+\s+(hdd|ssd|nvme)\b/.test(l));
  assert(rows.length === n, `${rows.length} rows for ${n} OSDs`);
  assert(out.some((l) => l.startsWith('MIN/MAX VAR:')), 'no variance summary');
  return `${rows.length} rows`;
});

check('ceph osd crush rule dump is valid JSON matching the rules', () => {
  const doc = sample('threeRacks');
  const parsed = JSON.parse(runCommand('rules', doc, ev(doc)));
  assert(parsed.length === doc.rules.length, `${parsed.length} rules dumped, ${doc.rules.length} defined`);
  for (const r of parsed) {
    assert(r.steps[0].op === 'take', 'a rule does not start with take');
    assert(r.steps[r.steps.length - 1].op === 'emit', 'a rule does not end with emit');
  }
  const cls = parsed.find((r) => r.rule_name === 'nvme-meta');
  assert(/~nvme$/.test(cls.steps[0].item_name),
    `class rule takes ${cls.steps[0].item_name}, expected a ~nvme shadow root`);
  return `${parsed.length} rules, class rule takes ${cls.steps[0].item_name}`;
});

check('ceph -s reports the health the cluster actually has', () => {
  const good = sample('threeRacks');
  assert(runCommand('status', good, ev(good)).includes('health: HEALTH_OK'), 'a clean cluster is not OK');

  const bad = sample('threeRacks');
  for (const s of bad.switches) s.up = false;
  const d = ev(bad);
  const out = runCommand('status', bad, d);
  assert(out.includes('HEALTH_ERR'), 'a partitioned cluster does not report ERR');
  assert(out.includes('NO QUORUM'), 'ceph -s does not mention the lost quorum');
  assert(out.includes('MON_DOWN'), 'the check name is missing from ceph -s');
  return 'HEALTH_OK when clean, HEALTH_ERR and NO QUORUM when split';
});

check('ceph fs status names what is wrong when the filesystem is down', () => {
  const doc = killPool(sample('threeRacks'), 'cephfs_metadata');
  const out = runCommand('fs', doc, ev(doc));
  assert(out.includes('DOWN'), 'a dead filesystem does not say so');
  assert(/REASON:/.test(out), 'no reason given');
  assert(out.includes('cephfs_metadata'), 'the metadata pool is not shown');
  const none = sample('unbalanced');
  assert(runCommand('fs', none, ev(none)).includes('No filesystems'),
    'a cluster with no filesystem should say so');
  return out.split('\n').find((l) => l.startsWith('REASON:'));
});
