// Engine checks, as plain data rather than as a page.
//
// These are properties of a randomised algorithm, not fixtures: "no PG ever puts
// two replicas on one host" rather than "PG 7 lands on osd.12". Statistical
// checks use fixed placement values, so a pass is reproducible.
//
// Kept DOM-free so both `tests/crush.html` and `node tests/run.mjs` can run it.
// The node path exists because it is fast and because headless-browser
// screenshotting is fragile; the page is what you actually open.

import { doRule, NONE, TYPES } from '../js/engine/crush.js';
import { hash1, hash2, hash3, hash4, stableMod, bmaskFor } from '../js/engine/hash.js';
import {
  newMap, addDevice, addBucket, addRule, finalize, defaultReweights, devicesUnder, ancestry,
} from '../js/engine/crushmap.js';
import {
  evaluatePool, mapPool, pgToPps, poolWidth, poolMinSize, poolEfficiency,
} from '../js/engine/pgmap.js';
import {
  osdUsage, clusterDf, poolDf, ruleAvail, ruleWeightMap, fmtBytes, RATIOS, TiB,
} from '../js/engine/capacity.js';

/** Filled at import time; one entry per check. */
export const results = [];

function check(name, fn) {
  try { results.push({ name, pass: true, detail: fn() || '' }); }
  catch (err) { results.push({ name, pass: false, detail: err.message }); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const pct = (n) => `${(n * 100).toFixed(2)}%`;

// A cluster we can reason about: 3 racks x 4 hosts x (2 SSD + 6 HDD).
function build({ racks = 3, hostsPerRack = 4, ssd = 2, hdd = 6 } = {}) {
  const m = newMap();
  let osd = 0;
  const rackIds = [];
  for (let r = 0; r < racks; r++) {
    const hostIds = [];
    for (let h = 0; h < hostsPerRack; h++) {
      const ds = [];
      for (let i = 0; i < ssd; i++) { addDevice(m, osd, `osd.${osd}`, 'ssd', 2); ds.push(osd++); }
      for (let i = 0; i < hdd; i++) { addDevice(m, osd, `osd.${osd}`, 'hdd', 8); ds.push(osd++); }
      hostIds.push(addBucket(m, { name: `h${r}-${h}`, type: 'host', items: ds }));
    }
    rackIds.push(addBucket(m, { name: `rack${r}`, type: 'rack', items: hostIds }));
  }
  addBucket(m, { name: 'default', type: 'root', items: rackIds });
  addRule(m, { name: 'repl-host', type: 'replicated', steps: [
    { op: 'take', item: 'default' },
    { op: 'chooseleaf', mode: 'firstn', num: 0, type: 'host' }, { op: 'emit' }] });
  addRule(m, { name: 'repl-rack', type: 'replicated', steps: [
    { op: 'take', item: 'default' },
    { op: 'chooseleaf', mode: 'firstn', num: 0, type: 'rack' }, { op: 'emit' }] });
  addRule(m, { name: 'ssd-host', type: 'replicated', steps: [
    { op: 'take', item: 'default', class: 'ssd' },
    { op: 'chooseleaf', mode: 'firstn', num: 0, type: 'host' }, { op: 'emit' }] });
  addRule(m, { name: 'ec-rack', type: 'erasure', steps: [
    { op: 'take', item: 'default', class: 'hdd' },
    { op: 'chooseleaf', mode: 'indep', num: 0, type: 'rack' }, { op: 'emit' }] });
  return finalize(m);
}
const M = build();
const RW = defaultReweights(M);
const NOSD = Object.keys(M.devices).length;
const N = 8192;                       // placement values per statistical check
const ancestorOf = (osd, type) => {
  const b = ancestry(M, osd).find((x) => x.typeName === type);
  return b ? b.name : null;
};
const runAll = (map, rule, size, rw = RW, n = N) => {
  const out = [];
  for (let ps = 0; ps < n; ps++) out.push(doRule(map, rule, ps, size, rw));
  return out;
};

// ------------------------------------------------------------------ hash ----
check('rjenkins hash is 32-bit and stable', () => {
  for (const v of [hash1(0), hash2(1, 2), hash3(1, 2, 3), hash4(1, 2, 3, 4)]) {
    assert(Number.isInteger(v) && v >= 0 && v <= 0xffffffff, `out of range: ${v}`);
  }
  assert(hash3(1, 2, 3) === hash3(1, 2, 3), 'not deterministic');
  assert(hash3(1, 2, 3) !== hash3(1, 2, 4), 'ignores an argument');
  return `h3(1,2,3)=${hash3(1, 2, 3)}`;
});

check('hash avalanche is flat across 16 buckets', () => {
  const b = new Array(16).fill(0);
  for (let i = 0; i < 160000; i++) b[(hash3(i, 7, 0) & 0xffff) >> 12]++;
  const mean = 10000;
  const worst = Math.max(...b.map((v) => Math.abs(v - mean) / mean));
  assert(worst < 0.05, `worst bucket off by ${pct(worst)}`);
  return `max deviation ${pct(worst)}`;
});

check('stable_mod keeps values inside a non-power-of-two pg_num', () => {
  for (const n of [1, 2, 7, 16, 100, 512, 1000]) {
    const mask = bmaskFor(n);
    for (let x = 0; x < 5000; x++) {
      const v = stableMod(x, n, mask);
      assert(v >= 0 && v < n, `stableMod(${x},${n}) = ${v}`);
    }
  }
  return 'pg_num 1..1000 all in range';
});

// ----------------------------------------------------------------- crush ----
check('bucket weights are the sum of their children', () => {
  const root = M.buckets[M.byName['default']];
  const expect = 3 * 4 * (2 * 2 + 6 * 8);            // 3 racks x 4 hosts x 52 TiB
  assert(root.weight === expect, `root weight ${root.weight}, expected ${expect}`);
  assert(M.buckets[M.byName['rack0']].weight === expect / 3, 'rack weight wrong');
  assert(M.buckets[M.byName['h0-0']].weight === 52, 'host weight wrong');
  return `root ${root.weight} TiB over ${NOSD} OSDs`;
});

check('placement is uniform across equal-weight OSDs', () => {
  const flat = build({ ssd: 0, hdd: 8 });            // every OSD 8 TiB
  const rw = defaultReweights(flat);
  const n = Object.keys(flat.devices).length;
  const counts = new Array(n).fill(0);
  for (const set of runAll(flat, 'repl-host', 3, rw)) for (const o of set) counts[o]++;
  const mean = (N * 3) / n;
  const worst = Math.max(...counts.map((c) => Math.abs(c - mean) / mean));
  // straw2 is a hash, not a scheduler: ~3 sigma of binomial noise is expected
  // and is exactly why the balancer exists. Anything past 25% is a bug.
  assert(worst < 0.25, `an OSD is ${pct(worst)} off the mean`);
  return `${n} OSDs, mean ${mean.toFixed(0)} PGs, worst ${pct(worst)} off`;
});

check('PG count follows CRUSH weight', () => {
  const counts = new Array(NOSD).fill(0);
  for (const set of runAll(M, 'repl-host', 3)) for (const o of set) counts[o]++;
  let ssdTotal = 0, hddTotal = 0, nSsd = 0, nHdd = 0;
  for (let i = 0; i < NOSD; i++) {
    if (M.devices[i].class === 'ssd') { ssdTotal += counts[i]; nSsd++; }
    else { hddTotal += counts[i]; nHdd++; }
  }
  const ratio = (hddTotal / nHdd) / (ssdTotal / nSsd);
  assert(Math.abs(ratio - 4) / 4 < 0.12, `8 TiB : 2 TiB gave a ${ratio.toFixed(2)}x PG ratio`);
  return `8 TiB OSDs hold ${ratio.toFixed(2)}x the PGs of 2 TiB OSDs (want 4x)`;
});

check('chooseleaf type host never doubles up on a host', () => {
  let bad = 0;
  for (const set of runAll(M, 'repl-host', 3)) {
    const hosts = set.filter((o) => o !== NONE).map((o) => ancestorOf(o, 'host'));
    if (new Set(hosts).size !== hosts.length) bad++;
  }
  assert(bad === 0, `${bad} PGs put two replicas on one host`);
  return `${N} PGs, 0 violations`;
});

check('chooseleaf type rack never doubles up on a rack', () => {
  let bad = 0;
  for (const set of runAll(M, 'repl-rack', 3)) {
    const racks = set.filter((o) => o !== NONE).map((o) => ancestorOf(o, 'rack'));
    if (new Set(racks).size !== racks.length) bad++;
  }
  assert(bad === 0, `${bad} PGs put two replicas in one rack`);
  return `${N} PGs, 0 violations`;
});

check('a rack rule cannot place more replicas than there are racks', () => {
  // 3 racks, size 4 — the fourth replica has nowhere legal to go.
  let placed4 = 0;
  for (let ps = 0; ps < 2000; ps++) {
    const set = doRule(M, 'repl-rack', ps, 4, RW).filter((o) => o !== NONE);
    if (set.length > 3) placed4++;
  }
  assert(placed4 === 0, `${placed4} PGs claimed a 4th rack that does not exist`);
  return 'short acting sets rather than a bogus placement';
});

check('CRUSH is deterministic run to run', () => {
  const a = runAll(M, 'repl-host', 3, RW, 512).map((s) => s.join(','));
  const b = runAll(M, 'repl-host', 3, RW, 512).map((s) => s.join(','));
  assert(a.join('|') === b.join('|'), 'two identical runs disagreed');
  return '512 PGs identical across runs';
});

check('removing one OSD moves only its own share (consistent hashing)', () => {
  const flat = build({ ssd: 0, hdd: 8 });
  const rw = defaultReweights(flat);
  const n = Object.keys(flat.devices).length;
  const before = runAll(flat, 'repl-host', 3, rw).map((s) => s.join(','));
  const rw2 = rw.slice(); rw2[0] = 0;                 // ceph osd reweight osd.0 0
  const after = runAll(flat, 'repl-host', 3, rw2).map((s) => s.join(','));
  const moved = after.filter((v, i) => v !== before[i]).length / N;
  const floor = 3 / n;                                 // PGs that HAD to move
  assert(moved >= floor * 0.7, `only ${pct(moved)} moved; expected at least ${pct(floor)}`);
  assert(moved < floor * 2, `${pct(moved)} moved, more than twice the ${pct(floor)} floor`);
  return `${pct(moved)} of PGs moved (floor ${pct(floor)}, 1 of ${n} OSDs)`;
});

check('reweight moves less data than changing the CRUSH weight', () => {
  const base = runAll(M, 'repl-host', 3).map((s) => s.join(','));
  const rw2 = RW.slice(); rw2[0] = 0;
  const byReweight = runAll(M, 'repl-host', 3, rw2).map((s) => s.join(','));
  const m2 = build(); m2.devices[0].weight = 0; finalize(m2);
  const byWeight = runAll(m2, 'repl-host', 3, defaultReweights(m2)).map((s) => s.join(','));
  const d1 = base.filter((v, i) => v !== byReweight[i]).length / N;
  const d2 = base.filter((v, i) => v !== byWeight[i]).length / N;
  // Zeroing the CRUSH weight also shrinks the host, rack and root above it, so
  // PGs that never touched osd.0 get reshuffled too. This is the whole reason
  // `ceph osd reweight` and upmap exist.
  assert(d2 > d1 * 1.3, `reweight moved ${pct(d1)}, crush weight moved ${pct(d2)} — expected a clear gap`);
  return `reweight ${pct(d1)} vs crush weight ${pct(d2)}`;
});

// -------------------------------------------------------- device classes ----
check('shadow trees hold only their own class, at the right weight', () => {
  const ssd = M.shadow['default~ssd'], hdd = M.shadow['default~hdd'];
  assert(ssd !== undefined && hdd !== undefined, 'shadow roots not built');
  const ssdDevs = devicesUnder(M, ssd), hddDevs = devicesUnder(M, hdd);
  assert(ssdDevs.every((d) => M.devices[d].class === 'ssd'), 'hdd leaked into default~ssd');
  assert(hddDevs.every((d) => M.devices[d].class === 'hdd'), 'ssd leaked into default~hdd');
  assert(M.buckets[ssd].weight === 12 * 2 * 2, `default~ssd weight ${M.buckets[ssd].weight}`);
  assert(M.buckets[hdd].weight === 12 * 6 * 8, `default~hdd weight ${M.buckets[hdd].weight}`);
  return `${ssdDevs.length} ssd / ${hddDevs.length} hdd, ${M.buckets[ssd].weight} + ${M.buckets[hdd].weight} TiB`;
});

check('a class rule selects only that class', () => {
  const ssdDevs = new Set(devicesUnder(M, M.shadow['default~ssd']));
  let off = 0;
  for (const set of runAll(M, 'ssd-host', 3)) for (const o of set) if (o !== NONE && !ssdDevs.has(o)) off++;
  assert(off === 0, `${off} placements landed outside the ssd class`);
  return `${N} PGs stayed on the ${ssdDevs.size} SSDs`;
});

// -------------------------------------------------------------------- EC ----
check('erasure indep leaves a positional hole rather than shifting shards', () => {
  // 4+2 over only 3 racks: three shards can be placed, three cannot.
  let missingHoles = 0, rackViol = 0;
  for (let ps = 0; ps < 2000; ps++) {
    const set = doRule(M, 'ec-rack', ps, 6, RW);
    assert(set.length === 6, `indep returned ${set.length} entries, not 6`);
    if (!set.includes(NONE)) missingHoles++;
    const racks = set.filter((o) => o !== NONE).map((o) => ancestorOf(o, 'rack'));
    if (new Set(racks).size !== racks.length) rackViol++;
  }
  assert(missingHoles === 0, `${missingHoles} PGs claimed 6 racks out of 3`);
  assert(rackViol === 0, `${rackViol} PGs reused a rack`);
  const sample = doRule(M, 'ec-rack', 7, 6, RW);
  return `k+m=6 over 3 racks -> ${sample.map((o) => (o === NONE ? '-' : o)).join(',')}`;
});

check('erasure fills every shard when the failure domain is wide enough', () => {
  let holes = 0;
  for (let ps = 0; ps < 2000; ps++) {
    if (doRule(M, 'ec-rack', ps, 3, RW).includes(NONE)) holes++;
  }
  assert(holes === 0, `${holes} of 2000 PGs left a hole with k+m=3 over 3 racks`);
  return '2000 PGs, all 3 shards placed';
});

// --------------------------------------------------------------- pg / pool ---
check('pgp_num, not pg_num, decides placement', () => {
  const a = { id: 1, name: 'p', type: 'replicated', size: 3, min_size: 2,
              pg_num: 256, pgp_num: 128, crush_rule: 'repl-host', stored: 0 };
  const groups = new Map();
  for (let ps = 0; ps < 256; ps++) {
    const key = pgToPps(a, ps);
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  assert(groups.size === 128, `256 PGs over pgp_num 128 gave ${groups.size} placements`);
  return '256 PGs share 128 placement values';
});

check('min_size decides inactive vs merely degraded', () => {
  const pool = { id: 1, name: 'rbd', type: 'replicated', size: 3, min_size: 2,
                 pg_num: 512, pgp_num: 512, crush_rule: 'repl-host', stored: 40 * TiB };
  const hostOsds = (n) => M.buckets[M.byName[n]].items;
  const one = evaluatePool(M, pool, RW, { down: new Set(hostOsds('h0-0')) });
  const two = evaluatePool(M, pool, RW, { down: new Set([...hostOsds('h0-0'), ...hostOsds('h0-1')]) });
  assert(one.inactive === 0, `one host down made ${one.inactive} PGs inactive at min_size 2`);
  assert(one.degraded > 0, 'one host down degraded nothing at all');
  assert(two.inactive > 0, 'two hosts down left every PG active at min_size 2');
  return `1 host: ${one.degraded} degraded / 0 inactive — 2 hosts: ${two.degraded} degraded / ${two.inactive} inactive`;
});

check('an EC pool survives exactly m failures and no more', () => {
  const pool = { id: 2, name: 'ec', type: 'erasure', k: 4, m: 2, min_size: 4,
                 pg_num: 512, pgp_num: 512, crush_rule: 'repl-host', stored: 0 };
  const hostOsds = (n) => M.buckets[M.byName[n]].items;
  const down2 = new Set([...hostOsds('h0-0'), ...hostOsds('h0-1')]);
  const down3 = new Set([...down2, ...hostOsds('h0-2')]);
  const a = evaluatePool(M, pool, RW, { down: down2 });
  const b = evaluatePool(M, pool, RW, { down: down3 });
  assert(a.inactive === 0, `losing 2 hosts made ${a.inactive} PGs inactive on a 4+2 pool`);
  assert(b.inactive > 0, 'losing 3 hosts left a 4+2 pool fully active');
  return `m=2: 2 hosts down -> 0 inactive, 3 hosts down -> ${b.inactive} inactive`;
});

check('raw usage matches the replication factor', () => {
  const pools = [
    { id: 1, name: 'rbd', type: 'replicated', size: 3, min_size: 2, pg_num: 512,
      pgp_num: 512, crush_rule: 'repl-host', stored: 30 * TiB },
    { id: 2, name: 'ec', type: 'erasure', k: 4, m: 2, min_size: 4, pg_num: 512,
      pgp_num: 512, crush_rule: 'repl-host', stored: 60 * TiB },
  ];
  const evals = pools.map((p) => evaluatePool(M, p, RW, { down: new Set(), skew: 0 }));
  const expect = 30 * 3 + 60 * 1.5;                    // 90 + 90 TiB raw
  const got = (evals[0].rawUsed + evals[1].rawUsed) / TiB;
  assert(Math.abs(got - expect) / expect < 0.01, `raw used ${got.toFixed(1)} TiB, expected ${expect}`);
  assert(Math.abs(poolEfficiency(pools[1]) - 4 / 6) < 1e-9, 'EC efficiency should be k/(k+m)');
  return `${got.toFixed(1)} TiB raw for 90 TiB stored`;
});

// ------------------------------------------------------------- capacity ----
check('rule weight shares sum to one', () => {
  const wm = ruleWeightMap(M, 'repl-host');
  const sum = [...wm.values()].reduce((a, b) => a + b, 0);
  assert(Math.abs(sum - 1) < 1e-9, `shares sum to ${sum}`);
  assert(wm.size === NOSD, `${wm.size} OSDs in the rule, expected ${NOSD}`);
  const ssdWm = ruleWeightMap(M, 'ssd-host');
  assert(ssdWm.size === 24, `ssd rule covers ${ssdWm.size} OSDs, expected 24`);
  return `${wm.size} OSDs, shares sum to 1`;
});

check('MAX AVAIL is capped by the fullest OSD, not by total free space', () => {
  const pool = { id: 1, name: 'rbd', type: 'replicated', size: 3, min_size: 2,
                 pg_num: 512, pgp_num: 512, crush_rule: 'repl-host', stored: 30 * TiB };
  const evals = [evaluatePool(M, pool, RW, { down: new Set(), skew: 0 })];
  const usage = osdUsage(M, evals);
  const before = poolDf(M, pool, usage, evals).maxAvail;
  // One OSD creeps to 94% while the cluster as a whole is nearly empty.
  const victim = usage.get(5);
  victim.used = victim.total * 0.94;
  victim.ratio = 0.94;
  const after = poolDf(M, pool, usage, evals).maxAvail;
  const df = clusterDf(M, usage);
  assert(after < before / 5, `MAX AVAIL only fell from ${fmtBytes(before)} to ${fmtBytes(after)}`);
  assert(df.ratio < 0.2, 'the cluster should still be mostly empty for this to be the point');
  return `cluster ${pct(df.ratio)} used, MAX AVAIL ${fmtBytes(before)} -> ${fmtBytes(after)}`;
});

check('fullness thresholds classify OSDs correctly', () => {
  const pool = { id: 1, name: 'p', type: 'replicated', size: 3, min_size: 2, pg_num: 64,
                 pgp_num: 64, crush_rule: 'repl-host', stored: 0 };
  const usage = osdUsage(M, [evaluatePool(M, pool, RW, { down: new Set(), skew: 0 })]);
  const set = (id, r) => { const u = usage.get(id); u.used = u.total * r; u.ratio = r; };
  set(0, 0.86); set(1, 0.91); set(2, 0.96); set(3, 0.50);
  const df = clusterDf(M, usage);
  assert(df.nearfull.includes(0) && !df.nearfull.includes(1), 'nearfull band wrong');
  assert(df.backfillfull.includes(1), 'backfillfull band wrong');
  assert(df.full.includes(2), 'full band wrong');
  assert(!df.nearfull.includes(3) && !df.full.includes(3), 'a half-full OSD was flagged');
  return `${RATIOS.nearfull}/${RATIOS.backfillfull}/${RATIOS.full} bands hold`;
});
