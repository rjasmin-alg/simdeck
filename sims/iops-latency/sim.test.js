// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for iops-latency's model (rules: SPEC.md). Run: node --test sims/iops-latency/
// Tie-breaks first, then one test per rule, then the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.filter((x) => x.id === id)[0];
const fromPreset = (id) => S(preset(id).params);
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} ≈ ${b} ± ${tol}`);

// ── tie-breaks ──

test('rule 6 tie-break: bandwidth before parallelism when both hold', () => {
  const s = S({ device: 'nvme', bs: 128, qd: 32 });
  assert.ok(s.qd >= s.lanes);
  assert.equal(s.capped, true);
  assert.equal(s.bound, 'bandwidth');
  assert.equal(S({ device: 'sata', bs: 1024, qd: 64 }).bound, 'bandwidth');
});

test('rule 6 tie-break: QD = P exactly is parallelism; QD = P − 1 is latency', () => {
  assert.equal(S({ device: 'sata', bs: 4, qd: 8 }).bound, 'parallelism');
  assert.equal(S({ device: 'sata', bs: 4, qd: 4 }).bound, 'latency');
  assert.equal(S({ device: 'hdd-random', bs: 4, qd: 1 }).bound, 'parallelism');   // P = 1: QD 1 fills the arm
  assert.equal(S({ device: 'nvme', bs: 4, qd: 32 }).bound, 'parallelism');
  assert.equal(S({ device: 'nvme', bs: 4, qd: 16 }).bound, 'latency');
  // real-valued q (the page's curves) uses the same comparison
  assert.equal(logic.curveAt(P({ device: 'sata' }), 7.9).bound, 'latency');
  assert.equal(logic.curveAt(P({ device: 'sata' }), 8).bound, 'parallelism');
});

test('rule 3 tie-break: equal counts as capped (sequential HDD, access 0, at QD 1)', () => {
  const s = S({ device: 'hdd-seq', bs: 1024, qd: 1 });
  assert.equal(s.capped, true);
  assert.equal(s.bound, 'bandwidth');
  assert.equal(s.iops, s.ceilIops);
  assert.equal(S({ device: 'hdd-seq', bs: 4, qd: 1 }).bound, 'bandwidth');
});

test('rule 3 boundary: NVMe 128 KiB is not capped at QD 2, capped at QD 3 (exact integers)', () => {
  const nv = logic.DEVICES.nvme;
  assert.equal(logic.metrics(nv, 128, 2).capped, false);    // 1 × 131072 < 3000 × 80 = 240000
  assert.equal(logic.metrics(nv, 128, 3).capped, true);     // 2 × 131072 = 262144 ≥ 240000
  assert.equal(S({ device: 'nvme', bs: 128, qd: 2 }).bound, 'latency');
  assert.equal(S({ device: 'nvme', bs: 128, qd: 4 }).bound, 'bandwidth');
});

// ── rules ──

test('rule 1: service time = access time + bs / bandwidth', () => {
  near(S({ device: 'hdd-random', bs: 4 }).svcMs, 8 + 4096 / 200e3, 1e-12);
  assert.equal(S({ device: 'hdd-seq', bs: 1024 }).svcMs, 1048576 / 200e3);
  near(S({ device: 'sata', bs: 4 }).svcMs, 0.1 + 4096 / 550e3, 1e-12);
  near(S({ device: 'nvme', bs: 128 }).svcMs, 0.08 + 131072 / 3e6, 1e-12);
  const s = S({ device: 'nvme', bs: 128 });
  near(s.accessMs + s.xferMs, s.svcMs, 1e-15);
});

test('rule 2: IOPS = min(QD, P) / service time below the cap', () => {
  const one = S({ device: 'nvme', bs: 4, qd: 1 });
  near(one.iops, 1000 / one.svcMs, 1e-6);
  const eight = S({ device: 'nvme', bs: 4, qd: 8 });
  near(eight.iops, 8 * one.iops, 1e-6);
  assert.equal(eight.busy, 8);
  const deep = S({ device: 'nvme', bs: 4, qd: 128 });
  near(deep.iops, 32 * one.iops, 1e-6);                     // P = 32 lanes: no more past 32
  assert.equal(deep.busy, 32);
  assert.equal(deep.waiting, 96);
  assert.deepEqual([1, 1, 8, 32].map((x, i) => logic.DEVICES[logic.DEVICE_IDS[i]].lanes), [1, 1, 8, 32]);
  near(S({ device: 'hdd-random', qd: 64 }).iops, S({ device: 'hdd-random', qd: 1 }).iops, 1e-9);
});

test('rule 3: capped IOPS = bandwidth / bs, never above it', () => {
  const s = S({ device: 'nvme', bs: 128, qd: 32 });
  assert.equal(s.iops, 3e9 / 131072);
  assert.ok(32 * 1000 / s.svcMs > s.iops, 'uncapped would be higher');
  for (const device of logic.DEVICE_IDS) for (const bs of logic.BLOCKS) for (const qd of logic.DEPTHS) {
    const x = S({ device, bs, qd });
    assert.ok(x.iops <= x.ceilIops * (1 + 1e-12), `${device} ${bs} ${qd}`);
    assert.ok(x.mbps <= x.bwMBps * (1 + 1e-12));
  }
});

test('rule 4: latency = QD / IOPS (Little\'s law); flat while lanes are free, linear past P', () => {
  for (const device of logic.DEVICE_IDS) for (const bs of logic.BLOCKS) for (const qd of logic.DEPTHS) {
    const x = S({ device, bs, qd });
    near(x.latMs, qd / x.iops * 1000, 1e-9, `${device} ${bs} ${qd}`);
  }
  const a = S({ device: 'nvme', bs: 4, qd: 1 }), b = S({ device: 'nvme', bs: 4, qd: 16 });
  near(a.latMs, a.svcMs, 1e-12);
  near(b.latMs, a.svcMs, 1e-12);
  near(S({ device: 'nvme', bs: 4, qd: 128 }).latMs, 4 * a.svcMs, 1e-12);
});

test('rule 5: throughput = IOPS × bs (MB = 10^6 B)', () => {
  const s = S({ device: 'sata', bs: 16, qd: 4 });
  near(s.mbps, s.iops * 16384 / 1e6, 1e-9);
  assert.equal(S({ device: 'nvme', bs: 128, qd: 32 }).mbps, 3000);
  // same IOPS-scale device, different block sizes: MB/s and IOPS move apart
  const small = S({ device: 'nvme', bs: 4, qd: 1 }), big = S({ device: 'nvme', bs: 1024, qd: 1 });
  assert.ok(big.mbps > small.mbps && big.iops < small.iops);
});

test('rule 7: changed marks the gauge of the new bound, only when the bound changed', () => {
  const lat = S({ device: 'nvme', bs: 4, qd: 1 });
  const par = S({ device: 'nvme', bs: 4, qd: 32 });
  const bw = S({ device: 'nvme', bs: 128, qd: 32 });
  assert.deepEqual(logic.changed(par, lat), ['iops']);
  assert.deepEqual(logic.changed(bw, par), ['mbps']);
  assert.deepEqual(logic.changed(lat, bw), ['lat']);
  assert.deepEqual(logic.changed(S({ device: 'nvme', bs: 4, qd: 64 }), par), []);
  assert.deepEqual(logic.changed(lat, null), []);
});

test('rule 8: caption keys: the one changed param, then the bound sentence', () => {
  const k = (over, prev) => logic.captionKey(S(over), prev ? P(prev) : null);
  assert.deepEqual(k({ device: 'hdd-random', qd: 1 }), { change: null, key: 'bArm1' });
  assert.deepEqual(k({ device: 'hdd-random', qd: 32 }, { device: 'hdd-random', qd: 1 }), { change: 'qd', key: 'bArmQueue' });
  assert.deepEqual(k({ device: 'nvme', bs: 128, qd: 32 }, { device: 'nvme', bs: 4, qd: 32 }), { change: 'bs', key: 'bBandwidth' });
  assert.deepEqual(k({ device: 'sata', qd: 8 }, { device: 'nvme', qd: 8 }), { change: 'device', key: 'bLanesFull' });
  assert.deepEqual(k({ device: 'sata', qd: 32 }), { change: null, key: 'bLanesQueue' });
  assert.deepEqual(k({ device: 'sata', qd: 4 }), { change: null, key: 'bLatency' });
  assert.equal(k({ device: 'sata', qd: 4 }, { device: 'nvme', qd: 8 }).change, null);    // two changed
  assert.equal(k({ qd: 4 }, { qd: 4 }).change, null);                                  // nothing changed
  assert.equal(k({ device: 'hdd-seq', bs: 1024 }).key, 'bBandwidth');
});

test('scene numbers: nobody waits while QD ≤ P; ceilings per device; time in a lane grows when lanes share the cap', () => {
  assert.equal(S({ device: 'nvme', qd: 32 }).waiting, 0);
  assert.equal(S({ device: 'sata', qd: 8 }).waiting, 0);
  assert.equal(S({ device: 'sata', qd: 16 }).waiting, 8);
  assert.deepEqual(logic.DEVICE_IDS.map((d) => S({ device: d }).bwMBps), [200, 200, 550, 3000]);
  const free = S({ device: 'nvme', bs: 4, qd: 8 });
  near(free.laneMs, free.svcMs, 1e-12);
  const shared = S({ device: 'nvme', bs: 128, qd: 4 });       // capped with free lanes: 4 share 3000 MB/s
  assert.equal(shared.capped, true);
  assert.equal(shared.waiting, 0);
  near(shared.laneMs, 4 / shared.iops * 1000, 1e-12);
  near(shared.laneMs, shared.latMs, 1e-12);                    // nobody waits: latency = time in a lane
  assert.ok(shared.laneMs > shared.svcMs);
});

test('curves: curveAt uses the block size and a real-valued queue depth', () => {
  const p = P({ device: 'nvme', bs: 128 });
  near(logic.curveAt(p, 1).iops, S({ device: 'nvme', bs: 128, qd: 1 }).iops, 1e-9);
  near(logic.curveAt(p, 2.5).iops, 2.5 * 1000 / logic.curveAt(p, 1).svcMs, 1e-6);
  assert.equal(logic.curveAt(p, 256).iops, 3e9 / 131072);
  near(logic.curveAt(P({ device: 'sata' }), 2.5).iops, 2.5 * logic.curveAt(P({ device: 'sata' }), 1).iops, 1e-6);
});

test('defaults, ranges and the HDD caption past QD 1', () => {
  assert.deepEqual(logic.defaults, { device: 'nvme', bs: 4, qd: 1 });
  assert.equal(logic.norm({ qd: 256 }).qd, 1);
  assert.deepEqual(logic.DEPTHS, [1, 2, 4, 8, 16, 32, 64, 128]);
  assert.deepEqual(logic.BLOCKS, [4, 16, 128, 1024]);
  assert.equal(logic.captionKey(S({ device: 'hdd-random', qd: 2 }), null).key, 'bArmQueue');
});

// ── presets: the task's numbers ──

test('preset hdd-random: 125 IOPS, 0.5 MB/s, 257 ms at QD 32; 8.0 ms at QD 1', () => {
  const s = fromPreset('hdd-random');
  assert.equal(Math.round(s.iops), 125);
  assert.equal(s.mbps.toFixed(1), '0.5');
  assert.equal(Math.round(s.latMs), 257);
  assert.equal(s.bound, 'parallelism');
  assert.equal(S({ device: 'hdd-random', bs: 4, qd: 1 }).latMs.toFixed(1), '8.0');
});

test('preset hdd-sequential: 191 IOPS, 200 MB/s, 5.2 ms; random at 1 MiB 76 IOPS, 79 MB/s', () => {
  const s = fromPreset('hdd-sequential');
  assert.equal(Math.round(s.iops), 191);
  assert.equal(s.mbps, 200);
  assert.equal(s.latMs.toFixed(1), '5.2');
  const r = S({ device: 'hdd-random', bs: 1024, qd: 1 });
  assert.equal(Math.round(r.iops), 76);
  assert.equal(Math.round(r.mbps), 79);
});

test('preset nvme-qd: 12,290 → 393,288 IOPS at 0.081 ms; QD 128 0.33 ms', () => {
  const one = S({ device: 'nvme', bs: 4, qd: 1 });
  assert.equal(Math.round(one.iops), 12290);
  assert.equal(Math.round(one.mbps), 50);
  assert.equal(one.latMs.toFixed(3), '0.081');
  const s = fromPreset('nvme-qd');
  assert.equal(Math.round(s.iops), 393288);
  assert.equal((s.mbps / 1000).toFixed(1), '1.6');
  assert.equal(s.latMs.toFixed(3), '0.081');
  const deep = S({ device: 'nvme', bs: 4, qd: 128 });
  assert.equal(Math.round(deep.iops), 393288);
  assert.equal(deep.latMs.toFixed(2), '0.33');
});

test('preset nvme-big-blocks: 3000 MB/s, 22,888 IOPS, 1.4 ms; QD 1 8,085 IOPS, 1.06 GB/s, 0.12 ms', () => {
  const s = fromPreset('nvme-big-blocks');
  assert.equal(s.mbps, 3000);
  assert.equal(Math.round(s.iops), 22888);
  assert.equal(s.latMs.toFixed(1), '1.4');
  const one = S({ device: 'nvme', bs: 128, qd: 1 });
  assert.equal(Math.round(one.iops), 8085);
  assert.equal((one.mbps / 1000).toFixed(2), '1.06');
  assert.equal(one.latMs.toFixed(2), '0.12');
});

test('preset sata-vs-nvme: 74,455 IOPS, 305 MB/s, 0.43 ms', () => {
  const s = fromPreset('sata-vs-nvme');
  assert.equal(Math.round(s.iops), 74455);
  assert.equal(Math.round(s.mbps), 305);
  assert.equal(s.latMs.toFixed(2), '0.43');
  assert.equal(s.bound, 'parallelism');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const pr of logic.presets) {
    const s = fromPreset(pr.id);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic, does not mutate its params, and cleans bad input', () => {
  const p = P({ device: 'sata', bs: 16, qd: 64 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.initial(p));
  assert.deepEqual(logic.norm({ device: 'ssd', bs: 8, qd: 3 }), logic.defaults);
  assert.deepEqual(logic.norm({ device: 'sata', bs: '128', qd: '64' }), { device: 'sata', bs: 128, qd: 64 });
  assert.deepEqual(logic.compute({}), logic.compute(logic.defaults));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every caption key and preset has its strings; the page is an explorer; preset params are known params', () => {
  const keys = ['bBandwidth', 'bLatency', 'bArm1', 'bArmQueue', 'bLanesFull', 'bLanesQueue', 'chQd', 'chBs', 'chDevice'];
  for (const key of keys) assert.ok(key in strings.hr && key in strings.en, key);
  for (const d of logic.DEVICE_IDS) assert.ok(('dev-' + d) in strings.hr, d);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
    assert.deepEqual(logic.norm(pr.params), pr.params, `${pr.id} params are valid values`);
    assert.ok(html.includes(`'${pr.id}'`), `page labels preset ${pr.id}`);
  }
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sim.entries || []) assert.ok(preset(e.preset), e.preset);
});
