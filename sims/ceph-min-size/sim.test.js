// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ceph-min-size (rules: SPEC.md). Run: node --test sims/ceph-min-size/
// Tie-breaks first, then one test per rule, then every preset's numbers, then the template's generic block.
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
const at = (over, n) => kit.stateAt(logic, P(over), n);
const last = (over) => at(over, logic.steps(P(over)));
const kinds = (over) => logic.norm(P(over)).events.map((e) => e.kind);

// ── tie-breaks ──

test('tie-break: the watched PG has the most copies on the failed OSDs, then the lowest number', () => {
  // size 3/2, osd.0 then osd.4: the watched PG holds copies on both (it goes inactive), and is the lowest such PG
  const p = P({ fail2: 'osd.4' });
  const s = logic.initial(p);
  const both = [];
  for (let pg = 0; pg < 128; pg++) {
    const c = logic.copiesOf('hc', 3, pg);
    if (c.includes(0) && c.includes(4)) both.push(pg);
  }
  assert.equal(s.watched, both[0]);
  // one failure: the lowest PG with a copy on osd.0
  const one = logic.initial(P({}));
  let first = -1;
  for (let pg = 0; pg < 128 && first < 0; pg++) if (logic.copiesOf('hc', 3, pg).includes(0)) first = pg;
  assert.equal(one.watched, first);
  // the zoom starts with the watched PG, then eleven more in PG order, none twice
  assert.equal(s.zoom[0], s.watched);
  assert.equal(s.zoom.length, logic.ZOOM);
  assert.equal(new Set(s.zoom).size, s.zoom.length);
  const rest = s.zoom.slice(1);
  assert.deepEqual(rest, rest.slice().sort((a, b) => a - b));
});

test('tie-break: a failure that is already down changes nothing (duplicate ids stay valid)', () => {
  // osd.0 is on ceph-01: failing ceph-01 after osd.0 adds only osd.1–3; failing osd.0 twice is not offered, but
  // osd.4 after host ceph-02 is (FAIL2 host:1 after FAIL1 osd.4)
  const s = at({ fail1: 'osd.4', fail2: 'host:1' }, 3);
  assert.deepEqual(s.down, [4, 5, 6, 7]);
  assert.deepEqual(s.ev.newly, [5, 6, 7]);
  const d = at({ fail1: 'host:0', fail2: 'osd.1' }, 3);
  assert.deepEqual(d.ev.newly, []);
  assert.deepEqual(d.ev.changed, []);
  assert.deepEqual(d.down, [0, 1, 2, 3]);
});

test('tie-break: OSDs fail in the order of the failures', () => {
  assert.deepEqual(at({ fail1: 'osd.8', fail2: 'osd.1' }, 3).down, [8, 1]);
  assert.deepEqual(at({ fail1: 'osd.0', fail2: 'osd.4' }, 3).down, [0, 4]);
});

// ── rules ──

test('rule 1: a PG is active iff its live copies >= min_size', () => {
  assert.equal(logic.active(logic.group(2, 3, 2)), true);
  assert.equal(logic.active(logic.group(1, 3, 2)), false);
  assert.equal(logic.active(logic.group(1, 2, 1)), true);
  assert.equal(logic.active(logic.group(1, 2, 2)), false);
});

test('rule 2: active with fewer than size copies is degraded; all copies up is clean', () => {
  assert.equal(logic.group(3, 3, 2), 'clean');
  assert.equal(logic.group(2, 3, 2), 'degraded');
  assert.equal(logic.group(1, 2, 1), 'degraded');
  assert.equal(logic.group(2, 2, 2), 'clean');
});

test('rule 3: below min_size but above zero is inactive (peered); a write to it waits', () => {
  assert.equal(logic.group(1, 2, 2), 'inactive');
  assert.equal(logic.group(1, 3, 2), 'inactive');
  assert.equal(logic.cephState('inactive'), 'undersized+degraded+peered');
  const s = at({ size: 2 }, 2);
  assert.equal(s.pgs[s.watched], 'inactive');
  assert.equal(s.writes[0].status, 'blocked');
  assert.deepEqual(s.writes[0].on, []);
});

test('rule 4: no live copy is stale', () => {
  assert.equal(logic.group(0, 2, 1), 'stale');
  assert.equal(logic.group(0, 3, 2), 'stale');
  const s = at({ size: 2, minSize: 1, fail2: 'osd.4' }, 4);
  assert.equal(s.pgs[s.watched], 'stale');
  assert.equal(s.writes[1].status, 'blocked');
});

test('rule 5: a write is acknowledged on every live copy; with min_size 1 it may sit on one disk and be lost', () => {
  const ok = at({}, 2);                                     // 3/2, osd.0 down: two live copies take it
  assert.equal(ok.writes[0].status, 'ack');
  assert.deepEqual(ok.writes[0].on, logic.liveOf('hc', 3, ok.watched, [0]));
  assert.equal(ok.writes[0].on.length, 2);
  const one = at({ size: 2, minSize: 1, fail2: 'osd.4' }, 2); // 2/1, osd.0 down: one live copy, on osd.4
  assert.equal(one.writes[0].status, 'ack');
  assert.deepEqual(one.writes[0].on, [4]);
  const gone = at({ size: 2, minSize: 1, fail2: 'osd.4' }, 3); // osd.4 goes too: W1 is gone
  assert.equal(gone.writes[0].status, 'lost');
  assert.deepEqual(gone.ev.lost, [1]);
  // 3/2, osd.0 then osd.4: W1 was on two copies, one survives, so it is not lost
  const kept = at({ fail2: 'osd.4' }, 3);
  assert.equal(kept.writes[0].status, 'ack');
});

test('rule 6: default min_size = size − ⌊size/2⌋', () => {
  assert.equal(logic.defaultMinSize(3), 2);
  assert.equal(logic.defaultMinSize(2), 1);
  assert.equal(logic.defaultMinSize(4), 2);
  assert.equal(logic.defaultMinSize(5), 3);
});

test('rule 7: no recovery: states stay as they are after the failure (dr: ten minutes later, the same)', () => {
  const a = at({ cluster: 'dr', size: 2 }, 1), b = at({ cluster: 'dr', size: 2 }, 2);
  assert.equal(b.ev.kind, 'later');
  assert.deepEqual(b.pgs, a.pgs);
  assert.equal(b.clock - a.clock, 10);
});

test('placement: size 2 takes the first two OSDs of the size-3 set; every copy on a different host', () => {
  for (const cl of ['hc', 'dr']) {
    const raw = logic.rawOf(cl);
    assert.equal(raw.length, logic.CLUSTERS[cl].pgNum);
    raw.forEach((set, pg) => {
      assert.deepEqual(logic.copiesOf(cl, 2, pg), set.slice(0, 2));
      const hosts = set.map((x) => logic.hostOf(cl, x));
      assert.equal(new Set(hosts).size, 3, `${cl} PG ${pg} on three hosts`);
      assert.ok(!set.includes(22), 'the out OSD holds nothing');
    });
  }
});

test('steps: fail and write per failure, then the summary; dr has a later step', () => {
  assert.deepEqual(kinds({}), ['fail', 'write', 'summary']);
  assert.deepEqual(kinds({ fail2: 'osd.4' }), ['fail', 'write', 'fail', 'write', 'summary']);
  assert.deepEqual(kinds({ cluster: 'dr' }), ['fail', 'later', 'write', 'summary']);
});

// ── the presets' numbers (SPEC.md "Presets", checked with the cephsim engine) ──

test('size2-min2: one OSD down, 17 of 128 PGs inactive; the write blocks', () => {
  const s = last({ size: 2 });
  assert.deepEqual(s.counts, { clean: 111, degraded: 0, inactive: 17, stale: 0 });
  assert.equal(logic.steps(P({ size: 2 })), 3);
  assert.equal(s.writes[0].status, 'blocked');
});

test('size3-min2: the same failure, 0 inactive, 30 degraded; the write is acknowledged', () => {
  const s = last({});
  assert.deepEqual(s.counts, { clean: 98, degraded: 30, inactive: 0, stale: 0 });
  assert.equal(s.writes[0].status, 'ack');
});

test('size3-two-down: osd.0 and osd.4, 7 inactive and 50 degraded', () => {
  const s = last({ fail2: 'osd.4' });
  assert.deepEqual(s.counts, { clean: 71, degraded: 50, inactive: 7, stale: 0 });
  assert.equal(logic.steps(P({ fail2: 'osd.4' })), 5);
  assert.deepEqual(s.writes.map((w) => w.status), ['ack', 'blocked']);
});

test('size2-min1: 0 inactive and 17 degraded, then osd.4 too: 2 stale and W1 lost', () => {
  const a = at({ size: 2, minSize: 1, fail2: 'osd.4' }, 1);
  assert.deepEqual(a.counts, { clean: 111, degraded: 17, inactive: 0, stale: 0 });
  const s = last({ size: 2, minSize: 1, fail2: 'osd.4' });
  assert.equal(s.counts.stale, 2);
  assert.equal(s.counts.inactive, 0);
  assert.deepEqual(s.writes.map((w) => w.status), ['lost', 'blocked']);
});

test('dr-s2: osd.15 down, 30 of 512 PGs of vm-rbd inactive; 4 steps', () => {
  const p = { cluster: 'dr', size: 2 };
  assert.equal(logic.steps(P(p)), 4);
  const s = last(p);
  assert.deepEqual(s.counts, { clean: 482, degraded: 0, inactive: 30, stale: 0 });
  assert.equal(s.pool.name, 'vm-rbd');
  assert.deepEqual(s.out, [22]);
  assert.equal(s.writes[0].status, 'blocked');
  const later = at(p, 2);
  assert.equal(later.ev.objects, 25600);
  assert.equal(later.ev.stuck, 1500);
});

test('host-down: 3/2, all of ceph-01 down, 128 degraded and 0 inactive', () => {
  const s = last({ fail1: 'host:0' });
  assert.deepEqual(s.counts, { clean: 0, degraded: 128, inactive: 0, stale: 0 });
  assert.equal(s.writes[0].status, 'ack');
});

test('summary compares 2/2, 3/2 and 2/1 under the same failures', () => {
  const cmp = last({ size: 2 }).ev.compare;
  assert.deepEqual(cmp.map((r) => [r.size, r.minSize, r.counts.inactive, r.counts.degraded, r.current]),
    [[2, 2, 17, 0, true], [3, 2, 0, 30, false], [2, 1, 0, 17, false]]);
  const dr = last({ cluster: 'dr', size: 2 }).ev.compare;
  assert.deepEqual(dr.map((r) => r.counts.inactive), [30, 0, 0]);
});

test('tie-break: the first write always goes to a PG the first failure touched', () => {
  // 2/2, osd.0 then osd.1 (same host: no PG has both): W1 still lands in a PG with a copy on osd.0, and blocks
  const s = at({ size: 2, fail2: 'osd.1' }, 2);
  assert.ok(logic.copiesOf('hc', 2, s.watched).includes(0));
  assert.equal(s.writes[0].status, 'blocked');
  for (const size of [2, 3]) for (const minSize of [1, 2]) for (const fail1 of logic.FAIL1) for (const fail2 of logic.FAIL2) {
    const p = P({ size, minSize, fail1, fail2 });
    const w = logic.initial(p).watched, f1 = logic.osdsOf('hc', fail1);
    assert.ok(logic.copiesOf('hc', size, w).some((x) => f1.includes(x)), `${size}/${minSize} ${fail1} ${fail2}`);
  }
});

test('fail event: hit counts every PG with a copy on the newly down OSDs, also those whose state does not change', () => {
  const s = at({ minSize: 1, fail1: 'host:0', fail2: 'host:1' }, 3);   // 3/1: degraded stays degraded
  assert.equal(s.ev.hit.length, 128);
  assert.equal(s.ev.changed.length, 0);
  const one = at({}, 1);
  assert.equal(one.ev.hit.length, 30);
});

test('rule 5: a blocked write stays blocked when more OSDs go down (never lost: it was never stored)', () => {
  const s = last({ size: 2, fail2: 'osd.4' });
  assert.deepEqual(s.writes.map((w) => w.status), ['blocked', 'blocked']);
  assert.deepEqual(s.writes[0].on, []);
  assert.equal(at({}, 2).writes[0].step, 2);
});

test('summary: two-failure runs compare the same two failures, with the write tallies; 3/1 is added as its own row', () => {
  const cmp = last({ fail2: 'osd.4' }).ev.compare;
  assert.deepEqual(cmp.map((r) => [r.size, r.minSize, r.counts.inactive, r.counts.degraded, r.counts.stale]),
    [[2, 2, 44, 0, 2], [3, 2, 7, 50, 0], [2, 1, 0, 44, 2]]);
  assert.deepEqual(cmp.map((r) => r.writes), [{ ack: 0, blocked: 2, lost: 0 }, { ack: 1, blocked: 1, lost: 0 }, { ack: 0, blocked: 1, lost: 1 }]);
  const c31 = last({ minSize: 1 }).ev.compare;
  assert.equal(c31.length, 4);
  assert.deepEqual([c31[3].size, c31[3].minSize, c31[3].current], [3, 1, true]);
  assert.equal(c31.filter((r) => r.current).length, 1);
  assert.equal(last({}).ev.compare.length, 3);
});

test('dr: a whole host down (hq-pve-03) and the comparison follow drFail', () => {
  const s = last({ cluster: 'dr', size: 2, drFail: 'host:2' });
  assert.deepEqual(s.down, [12, 13, 14, 15, 16, 17]);
  assert.equal(s.counts.inactive, 163);
  assert.equal(s.ev.compare[0].counts.inactive, 163);
  const later = at({ cluster: 'dr', size: 2, drFail: 'host:2' }, 2);
  assert.equal(later.ev.stuck, Math.round(25600 * 163 / 512));
  assert.equal(at({ cluster: 'dr', size: 3 }, 2).ev.stuck, 0);
});

test('dr clock: 10:39 before, 10:40 at the failure, 10:50 ten minutes later; hc has none', () => {
  const p = { cluster: 'dr', size: 2 };
  assert.equal(at(p, 0).clock, 10 * 60 + 39);
  assert.equal(at(p, 1).clock, 10 * 60 + 40);
  assert.equal(at(p, 2).clock, 10 * 60 + 50);
  assert.equal(at({}, 1).clock, null);
});

test('display: Ceph state strings and PG ids (pool.hex)', () => {
  assert.deepEqual(logic.GROUPS.map(logic.cephState), ['active+clean', 'active+undersized+degraded', 'undersized+degraded+peered', 'stale']);
  assert.equal(logic.pgId(2, 15), '2.f');
  assert.equal(at({}, 0).pool.id, 1);
  assert.equal(at({ cluster: 'dr' }, 0).pool.id, 2);
});

// ── generic checks every sim keeps ──

const RUNS = [{ size: 2 }, {}, { fail2: 'osd.4' }, { size: 2, minSize: 1, fail2: 'osd.4' }, { cluster: 'dr', size: 2 }, { fail1: 'host:0' }];

test('state is JSON-safe at every step', () => {
  for (const r of RUNS) {
    for (let n = 0; n <= logic.steps(P(r)); n++) {
      const s = at(r, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const r of RUNS) {
    const p = P(r), n = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let k = 1; k <= n; k++) { s = logic.step(s, k, p); forward.push(s); }
    for (let k = n; k >= 0; k--) assert.deepEqual(kit.stateAt(logic, p, k), forward[k]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ size: 2, minSize: 1, fail2: 'osd.4' });
  let s = logic.initial(p);
  for (let k = 1; k <= logic.steps(p); k++) {
    const copy = structuredClone(s);
    const next = logic.step(s, k, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('unknown params fall back to the defaults', () => {
  const o = logic.norm({ cluster: 'x', size: 7, minSize: 9, fail1: 'osd.99', fail2: 'z' });
  assert.equal(o.cluster, 'hc');
  assert.equal(o.size, 3);
  assert.equal(o.minSize, 2);
  assert.deepEqual(o.fails, ['osd.0']);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model; meta steps = the first preset', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const presets = html.slice(html.indexOf('presets: ['));
  const first = presets.match(/params:\s*\{([^}]*)\}/)[1];
  assert.equal(meta.steps, logic.steps(P(Function('return {' + first + '}')())), 'meta.steps matches the first preset');
  assert.equal(meta.steps, logic.steps(logic.defaults), 'and the defaults');
  const keys = [...presets.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(?:^|,)\s*(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, meta.steps);
});

test('placement.js is what tools/gen-placement.mjs writes from the cephsim engine (spot check)', () => {
  // PG 0 of the hyperconverged pool, as cephsim's samples.js + engine compute it
  assert.deepEqual(logic.rawOf('hc')[0], [7, 2, 10]);
  assert.deepEqual(logic.rawOf('dr')[0], [18, 1, 12]);
});
