// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the cgroups limits model. Run: node --test sims/lnx-cgroups/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then one test per rule, the presets, the captions, then the
// generic block.
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
const at = (over) => logic.initial(P(over));
const G = (s, id) => logic.group(s, id);
const preset = (id) => logic.presets.find((x) => x.id === id);
const fromPreset = (id, over) => at(Object.assign({}, preset(id).params, over));
const procs = (...rss) => rss.map((r, i) => (typeof r === 'object' ? r : { pid: 100 + i, rss: r }));
const cpu = (cores, ...gs) => logic.splitCpu(cores, gs.map(([id, weight, demand, quota]) => ({ id, weight, demand, quota: quota || 0 })));

// ── tie-breaks (rule 6, and the order of groups) ──

test('tie-break: equal badness → the lower PID dies', () => {
  const m = logic.memoryOutcome(procs({ pid: 7, rss: 300 }, { pid: 3, rss: 300 }), null, 512, false);
  assert.deepEqual(m.oomKilled, [3]);
  assert.deepEqual(logic.oomOrder(procs({ pid: 9, rss: 100 }, { pid: 2, rss: 100 }, { pid: 5, rss: 100 }), 512).map((x) => x.pid), [2, 5, 9]);
});

test('tie-break: on the page, group C has two equal workers; over memory.max the lower PID dies', () => {
  const c = G(at({ memC: 600 }), 'C');
  assert.deepEqual(c.procs.map((x) => x.rss), [300, 300]);
  assert.deepEqual(c.oomKilled, [1401]);
  assert.equal(c.memUsed, 300);
});

test('tie-break: the CPU split does not depend on the order the groups are given in', () => {
  const a = cpu(2, ['A', 100, 2], ['B', 300, 2], ['C', 100, 1]);
  const b = cpu(2, ['C', 100, 1], ['B', 300, 2], ['A', 100, 2]);
  assert.deepEqual(a, b);
  assert.deepEqual(Object.keys(a.alloc), ['A', 'B', 'C']);
});

test('tie-break: oom.group kills every process, listed in PID order', () => {
  const m = logic.memoryOutcome(procs({ pid: 9, rss: 400 }, { pid: 4, rss: 200 }), null, 512, true);
  assert.deepEqual(m.oomKilled, [4, 9]);
});

// ── rule 1: weights under contention ──

test('rule 1: under contention CPU is split in proportion to cpu.weight', () => {
  const s = cpu(2, ['A', 100, 2], ['B', 300, 2]);
  assert.equal(s.alloc.A, 0.5);
  assert.equal(s.alloc.B, 1.5);
  assert.equal(s.idle, 0);
  const t = cpu(3, ['A', 100, 3], ['B', 100, 3], ['C', 100, 3]);
  assert.deepEqual([t.alloc.A, t.alloc.B, t.alloc.C], [1, 1, 1]);
});

test('rule 1: a group that wants no CPU takes no share; its weight does not count', () => {
  const s = cpu(2, ['A', 100, 2], ['B', 300, 2], ['C', 1000, 0]);
  assert.deepEqual([s.alloc.A, s.alloc.B, s.alloc.C], [0.5, 1.5, 0]);
});

// ── rule 2: weights are not limits (water-filling) ──

test('rule 2: a group alone gets everything it wants, whatever its weight', () => {
  const s = cpu(2, ['A', 1, 2], ['B', 1000, 0]);
  assert.equal(s.alloc.A, 2);
});

test('rule 2: the unused share of a satisfied group is split again among the others by weight', () => {
  // 4 cores, weights 100/100/200: shares 1/1/2. A wants 0.4 → 0.6 left over is split 1:2 between B and C.
  const s = cpu(4, ['A', 100, 0.4], ['B', 100, 4], ['C', 200, 4]);
  assert.equal(s.alloc.A, 0.4);
  assert.equal(s.alloc.B, 1.2);
  assert.equal(s.alloc.C, 2.4);
  assert.equal(s.idle, 0);
});

test('rule 2: who is satisfied is decided by the weighted share, not an equal one', () => {
  // weights 100 and 300 on 2 cores: A's share is 0.5, so wanting 0.8 it is still short (an equal share of 1 would satisfy it)
  const s = cpu(2, ['A', 100, 0.8], ['B', 300, 2]);
  assert.deepEqual([s.alloc.A, s.alloc.B], [0.5, 1.5]);
});

test('rule 2: the fill repeats: a group satisfied in the second round passes its rest on again', () => {
  // 6 cores, equal weights: shares 2 each. A wants 1 → 5 left for B, C: 2.5 each; B wants 2.2 → C gets 2.8.
  const s = cpu(6, ['A', 100, 1], ['B', 100, 2.2], ['C', 100, 6]);
  assert.deepEqual([s.alloc.A, s.alloc.B, s.alloc.C], [1, 2.2, 2.8]);
});

test('rule 2: when everyone is satisfied, the rest is idle', () => {
  const s = cpu(4, ['A', 100, 1], ['B', 300, 0.5]);
  assert.equal(s.idle, 2.5);
});

// ── rule 3: cpu.max is a hard cap ──

test('rule 3: cpu.max caps a group even when the machine is idle, and the group is throttled', () => {
  const s = fromPreset('quota-cap');
  const a = G(s, 'A');
  assert.equal(a.alloc, 0.5);
  assert.equal(s.idle, 3.5);
  assert.equal(a.throttled, true);
  assert.equal(a.files['cpu.max'], '50000 100000');
});

test('rule 3: the cap\'s leftover goes to the others; a group below its cap is not throttled', () => {
  const s = cpu(2, ['A', 100, 2, 0.5], ['B', 100, 2]);
  assert.equal(s.alloc.A, 0.5);
  assert.equal(s.alloc.B, 1.5);
  // weights keep A under its cap of 1.5: no throttling, only contention
  const t = at({ quotaA: 1.5 });
  assert.equal(G(t, 'A').alloc, 0.5);
  assert.equal(G(t, 'A').throttled, false);
  // demand under the cap: not throttled
  assert.equal(G(at({ quotaA: 3, cpuB: 0 }), 'A').throttled, false);
});

// ── rule 4: memory.high throttles, never kills ──

test('rule 4: above memory.high the group is throttled, not killed, however far above it goes (without memory.max)', () => {
  const s = fromPreset('high-throttle');
  const a = G(s, 'A');
  assert.equal(a.memUsed, 450);
  assert.equal(a.overHigh, true);
  assert.deepEqual(a.oomKilled, []);
  const far = G(at({ memA: 2000, memHighA: '256M', memMaxA: 'max' }), 'A');
  assert.equal(far.overHigh, true);
  assert.equal(far.oom, false);
  assert.equal(far.memUsed, 2000);
  assert.equal(G(at({ memA: 384, memHighA: '384M' }), 'A').overHigh, false);
});

// ── rule 5: memory.max and the OOM killer inside the group ──

test('rule 5: over memory.max the largest process of that group dies, though the host has RAM free', () => {
  const s = fromPreset('oom-inside');
  const a = G(s, 'A');
  assert.deepEqual(a.procs.map((x) => [x.pid, x.rss]), [[1201, 200], [1202, 400]]);
  assert.deepEqual(a.oomKilled, [1202]);
  assert.equal(a.memUsed, 200);
  assert.equal(s.hostFree, 16384 - 512 - 200 - 300);
  assert.ok(s.hostFree > 15 * 1024);
  // only A's processes: B and C are untouched
  assert.deepEqual(G(s, 'B').oomKilled, []);
});

test('rule 5: exactly at memory.max nothing dies', () => {
  assert.equal(logic.memoryOutcome(procs(200, 312), null, 512, false).oom, false);
  assert.equal(logic.memoryOutcome(procs(200, 313), null, 512, false).oom, true);
});

test('rule 5: the killer goes on until the rest fits', () => {
  const m = logic.memoryOutcome(procs(300, 250, 200), null, 256, false);
  assert.deepEqual(m.oomKilled, [100, 101]);
  assert.equal(m.memUsed, 200);
});

test('rule 5: oom_score_adj shifts the badness by thousandths of memory.max', () => {
  const list = procs({ pid: 1, rss: 300, adj: -500 }, { pid: 2, rss: 200 });
  assert.equal(logic.badness(list[0], 512), 300 - 256);
  assert.deepEqual(logic.oomOrder(list, 512).map((x) => x.pid), [2, 1]);
  assert.deepEqual(logic.oomOrder(procs({ pid: 1, rss: 300 }, { pid: 2, rss: 200 }), 512).map((x) => x.pid), [1, 2]);
  assert.deepEqual(logic.memoryOutcome(procs({ pid: 1, rss: 300, adj: -500 }, { pid: 2, rss: 200 }), null, 480, false).oomKilled, [2]);
});

test('rule 5: a group whose processes were all killed wants no CPU; its share goes to the others', () => {
  const s = fromPreset('oom-group');
  assert.equal(G(s, 'A').allKilled, true);
  assert.equal(G(s, 'A').demandCpu, 0);
  assert.equal(G(s, 'A').alloc, 0);
  assert.equal(G(s, 'B').alloc, 2);
  assert.equal(G(fromPreset('oom-inside'), 'A').allKilled, false);
});

test('rule 5: the killer stops as soon as the rest fits, exactly at memory.max', () => {
  const a = G(at({ memA: 750, memMaxA: '256M' }), 'A');
  assert.deepEqual(a.procs.map((x) => x.rss), [250, 500]);
  assert.deepEqual(a.oomKilled, [1202]);
  assert.equal(logic.memoryOutcome(procs({ pid: 1, rss: 256 }, { pid: 2, rss: 300 }), null, 256, false).oomKilled.join(), '2');
});

test('rule 5: oom_score_adj −1000 is never killed, not even with memory.oom.group', () => {
  const list = procs({ pid: 1, rss: 600, adj: -1000 }, { pid: 2, rss: 100 });
  assert.deepEqual(logic.memoryOutcome(list, null, 512, false).oomKilled, [2]);
  assert.deepEqual(logic.memoryOutcome(list, null, 512, true).oomKilled, [2]);
});

test('rule 5: memory.oom.group kills the whole group', () => {
  const a = G(fromPreset('oom-group'), 'A');
  assert.deepEqual(a.oomKilled, [1201, 1202]);
  assert.equal(a.memUsed, 0);
  assert.equal(a.files['memory.oom.group'], '1');
});

test('rules 4–5: high-throttle raised to 600 MB: the large process dies, the rest is under memory.high again', () => {
  const a = G(fromPreset('high-throttle', { memA: 600 }), 'A');
  assert.deepEqual(a.oomKilled, [1202]);
  assert.equal(a.memUsed, 200);
  assert.equal(a.overHigh, false);
});

test('rule 5: memory.max "max" never kills', () => {
  assert.equal(G(at({ memA: 2000, memMaxA: 'max' }), 'A').oom, false);
});

// ── rule 7: the engine's limits are these files ──

test('rule 7: CPU and memory limits map onto cpu.max and memory.max', () => {
  assert.deepEqual(logic.engineFiles({ cpus: 1.5, memory: 512 }), { 'cpu.max': '150000 100000', 'memory.max': '536870912' });
  assert.equal(logic.cpuMax(0.5), '50000 100000');
  assert.equal(logic.cpuMax(0), 'max 100000');
});

test('rule 7: v1 CPU shares convert to cpu.weight: 2 → 1, 1024 → 100, 262144 → 10000, monotonic', () => {
  assert.equal(logic.sharesToWeight(2), 1);
  assert.equal(logic.sharesToWeight(1024), 100);
  assert.equal(logic.sharesToWeight(262144), 10000);
  let last = 0;
  for (let s = 2; s <= 262144; s *= 2) { const w = logic.sharesToWeight(s); assert.ok(w >= last); last = w; }
  assert.equal(logic.engineFiles({ cpuShares: 1024 })['cpu.weight'], '100');
  assert.equal(logic.sharesToWeight(512), 59);       // 10^1.7647 = 58.2, rounded up
  assert.equal(logic.sharesToWeight(0), 100);        // unset: the kernel default
  assert.equal(logic.sharesToWeight(1), 1);          // clamped to the v1 range
  assert.equal(logic.sharesToWeight(500000), 10000);
});

// ── the page's scene ──

test('scene: A and B split their demand 1/3 and 2/3, C in halves; the last process takes the rounding', () => {
  assert.deepEqual(logic.procsFor('A', 450).map((x) => x.rss), [150, 300]);
  assert.deepEqual(logic.procsFor('B', 50).map((x) => x.rss), [16, 34]);
  assert.deepEqual(logic.procsFor('C', 250).map((x) => x.rss), [125, 125]);
});

test('scene: the files show the params as the kernel reads them back', () => {
  const s = at({ memHighB: '1G', quotaC: 1.5 });
  assert.equal(G(s, 'A').files['memory.high'], 'max');
  assert.equal(G(s, 'B').files['memory.high'], '1073741824');
  assert.equal(G(s, 'A').files['memory.max'], '536870912');
  assert.equal(G(at({ memMaxA: 'max' }), 'A').files['memory.max'], 'max');
  assert.equal(G(s, 'C').files['cpu.max'], '150000 100000');
  assert.equal(G(s, 'B').files['cpu.weight'], '300');
});

// ── presets (SPEC.md, expected numbers) ──

test('preset weights-contention (the defaults): A 0.5, B 1.5 cores', () => {
  const s = fromPreset('weights-contention');
  assert.deepEqual(s, at({ group: 'B' }));
  assert.deepEqual([G(s, 'A').alloc, G(s, 'B').alloc, G(s, 'C').alloc, s.idle], [0.5, 1.5, 0, 0]);
});

test('preset weights-idle: B wants nothing, A gets 2.0', () => {
  const s = fromPreset('weights-idle');
  assert.equal(G(s, 'A').alloc, 2);
  assert.equal(G(s, 'A').throttled, false);
});

test('every preset only names model params', () => {
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
});

// ── changed and captions ──

test('changed: names the half of each group whose outcome moved', () => {
  const a = at({}), b = at({ cpuB: 0 });
  assert.deepEqual(logic.changed(a, b), ['A:cpu', 'B:cpu']);
  assert.deepEqual(logic.changed(a, at({ memA: 600 })), ['A:mem']);
  assert.deepEqual(logic.changed(null, a), []);
  assert.deepEqual(logic.changed(a, at({ group: 'C' })), []);
  assert.deepEqual(logic.changed(a, at({ quotaA: 3 })), ['A:cpu']);      // the cap moved, the allocation did not
  assert.deepEqual(logic.changed(a, at({ memMaxA: '1G' })), ['A:mem']);  // the limit moved, the use did not
  const killedOther = structuredClone(at({ memC: 600 }));
  const c = killedOther.groups.find((g) => g.id === 'C');
  c.oomKilled = [1402];
  assert.deepEqual(logic.changed(at({ memC: 600 }), killedOther), ['C:mem']);
});

test('focus: the param changed last; a preset its own; the group picker moves it', () => {
  const d = P({});
  assert.deepEqual(logic.nextFocus(null, null, d, null, null), { g: 'B', aspect: 'cpu' });
  assert.deepEqual(logic.nextFocus(null, d, P({ memC: 100 }), null, null), { g: 'C', aspect: 'mem' });
  assert.deepEqual(logic.nextFocus(null, d, P({ quotaB: 1 }), null, null), { g: 'B', aspect: 'cpu' });
  assert.deepEqual(logic.nextFocus({ g: 'C', aspect: 'mem' }, d, P({ cores: 3 }), null, null), { g: 'C', aspect: 'cpu' });
  assert.deepEqual(logic.nextFocus({ g: 'B', aspect: 'cpu' }, d, P({ oomGroup: true }), null, null), { g: 'B', aspect: 'mem' });
  assert.deepEqual(logic.nextFocus({ g: 'A', aspect: 'mem' }, d, P({ group: 'C' }), null, null), { g: 'C', aspect: 'mem' });
  assert.deepEqual(logic.nextFocus({ g: 'B', aspect: 'cpu' }, d, d, 'oom-inside', null), { g: 'A', aspect: 'mem' });
  assert.deepEqual(logic.nextFocus({ g: 'A', aspect: 'mem' }, d, d, 'oom-inside', 'oom-inside'), { g: 'A', aspect: 'mem' });
});

test('captions: each preset gets its own key and numbers', () => {
  const k = (id) => logic.captionKey(fromPreset(id), preset(id).focus);
  assert.deepEqual(k('weights-contention'), { key: 'cContention', hi: 'B', lo: 'A', wh: 300, wl: 100, ch: 1.5, cl: 0.5, ratio: 3 });
  assert.deepEqual(k('weights-idle'), { key: 'cWorkConserving', g: 'A', got: 2, share: 0.4, idle: 0 });
  assert.deepEqual(k('quota-cap'), { key: 'cThrottledIdle', g: 'A', want: 4, quota: 0.5, idle: 3.5 });
  assert.deepEqual(k('oom-inside'), { key: 'cOom', g: 'A', max: 512, pid: 1202, name: 'cache', rss: 400, n: 1, free: 15372 });
  assert.deepEqual(k('high-throttle'), { key: 'cHigh', g: 'A', used: 450, high: 384, max: 512 });
  assert.deepEqual(k('oom-group'), { key: 'cOomGroup', g: 'A', max: 512, n: 2, free: 15572 });
});

test('captions: the other branches', () => {
  const k = (over, f) => logic.captionKey(at(over), f).key;
  const mem = (g) => ({ g, aspect: 'mem' });
  const cp = (g) => ({ g, aspect: 'cpu' });
  assert.equal(k({ memC: 600 }, mem('C')), 'cOomTie');
  assert.equal(k({}, mem('C')), 'cMemNone');
  assert.equal(k({}, mem('A')), 'cMemFits');
  assert.equal(k({ memMaxA: 'max' }, mem('A')), 'cMemNoMax');
  assert.equal(k({ memA: 600, memHighA: '384M', memMaxA: 'max' }, mem('A')), 'cHighNoMax');
  assert.equal(k({ quotaA: 0.5, cores: 4, cpuB: 3.5 }, cp('A')), 'cThrottled');
  assert.equal(k({ weightB: 100 }, cp('A')), 'cEqual');
  assert.equal(k({ cpuC: 2 }, cp('C')), 'cSplit');
  assert.equal(k({ cpuB: 0, cpuA: 1 }, cp('B')), 'cCpuNoneIdle');
  assert.equal(k({ cpuB: 0 }, cp('B')), 'cCpuNone');
  assert.equal(k({ cpuA: 4, cpuB: 0 }, cp('A')), 'cAlone');
  assert.equal(k({ cpuC: 4, cpuB: 0, cpuA: 0, cores: 1 }, cp('A')), 'cCpuNone');
  assert.equal(k({ quotaA: 1.5, cpuB: 0.4 }, cp('A')), 'cThrottledIdle');   // A 1.5, B 0.4, 0.1 idle
  assert.equal(k({ memC: 550, memMaxC: '256M' }, mem('C')), 'cOom');        // a tie, but both die
  assert.equal(k({ cores: 8, cpuA: 1, cpuB: 1 }, cp('B')), 'cNoContention');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const pr of logic.presets) {
    const s = fromPreset(pr.id);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its params', () => {
  const p = P({ memA: 600, quotaB: 1, cpuC: 3 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.deepEqual(kit.stateAt(logic, p, 0), logic.initial(p));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every caption key the model returns has a string; the page is an explorer', () => {
  const keys = ['cAlone', 'cCpuNoneIdle', 'cContention', 'cEqual', 'cSplit', 'cWorkConserving', 'cNoContention', 'cCpuNone', 'cThrottled', 'cThrottledIdle',
    'cOom', 'cOomTie', 'cOomGroup', 'cHigh', 'cHighNoMax', 'cMemFits', 'cMemNoMax', 'cMemNone'];
  for (const key of keys) assert.ok(key in strings.hr && key in strings.en, key);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
