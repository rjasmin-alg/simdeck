// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-ipam-utilisation's model (SPEC.md §4 rules, §5 numbers). Run: node --test sims/win-ipam-utilisation/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const V = (over) => logic.view(P(over));
const R = (s, id) => s.ranges.find((r) => r.id === id);
const TH = { under: 20, over: 80 };

// ── tie-breaks first ──

test('rule 2 tie-break: exactly at the over threshold is optimal, one address more is over', () => {
  assert.equal(logic.status(160, 200, TH), 'optimal');
  assert.equal(logic.status(161, 200, TH), 'over');
  assert.equal(R(V({ week: 0 }), 'students').status, 'optimal');   // 160 of 200 = 80 %
  assert.equal(R(V({ week: 0 }), 'students').util, 80);
});

test('rule 2 tie-break: exactly at the under threshold is optimal, one address less is under', () => {
  assert.equal(logic.status(40, 200, TH), 'optimal');
  assert.equal(logic.status(39, 200, TH), 'under');
});

test('rule 2 tie-break: status is decided on exact numbers, not on a rounded percentage', () => {
  // 80.4 % would round to 80 % and must still be over; 19.6 % would round to 20 % and must still be under
  assert.equal(logic.status(804, 1000, TH), 'over');
  assert.equal(logic.status(196, 1000, TH), 'under');
});

test('rule 7 tie-break: the first week over and the first week full are the smallest such weeks', () => {
  const s = R(V({ lease: 1 }), 'students');
  assert.equal(s.firstOver, 11);
  assert.equal(s.trend[10], 77.5);
  assert.equal(s.firstFull, 15);
  assert.equal(s.trend[14], 97.5);
  // already over at week 0: firstOver is 0
  assert.equal(R(V({ visitors: 30 }), 'students').firstOver, 0);
  // never over within the term: null
  const calm = R(V({ lease: 1, growth: 0 }), 'students');
  assert.equal(calm.firstOver, null);
  assert.equal(calm.firstFull, null);
});

// ── rules ──

test('rule 1: range utilisation = used / size; used counts reservations', () => {
  const s = V({});
  const srv = R(s, 'servers');
  assert.equal(srv.size, 254);
  assert.equal(srv.leased, 0);
  assert.equal(srv.reserved, 6);
  assert.equal(srv.used, 6);
  assert.equal(srv.util, 600 / 254);
  assert.equal(R(s, 'staff').util, 100 * 2600 / 4094);
});

test('rule 1: block utilisation = sum of its ranges\' used / block size', () => {
  const s = V({ week: 4 });
  assert.equal(s.block.size, 65536);
  assert.equal(s.block.used, 2600 + 2400 + 694 + 200 + 6);
  assert.equal(s.block.util, 100 * 5900 / 65536);
  assert.equal(V({}).block.used, 5860);
});

test('rule 2: thresholds are params; the block gets a status by the same rule', () => {
  assert.equal(R(V({ week: 9, lease: 1 }), 'students').status, 'optimal');   // 72.5 % under over = 80
  assert.equal(R(V({ week: 9, lease: 1, over: 70 }), 'students').status, 'over');
  assert.equal(R(V({}), 'servers').status, 'under');
  assert.equal(R(V({ under: 5 }), 'servers').status, 'under');               // 2.4 % < 5 %
  assert.equal(V({}).block.status, 'under');
  assert.equal(R(V({}), 'staff').status, 'optimal');
});

test('rule 3: leases at week w = residents0 + growth × w + visitors × lease days', () => {
  const at = (week, lease) => R(V({ week, lease }), 'students');
  assert.equal(at(0, 8).used, 160);
  assert.equal(at(1, 8).used, 170);
  assert.equal(at(0, 1).used, 55);
  assert.equal(at(0, 1).util, 27.5);
  assert.equal(at(11, 1).used, 165);
  assert.equal(at(9, 1).used, 145);
  assert.equal(R(V({ week: 3, growth: 0, visitors: 0 }), 'students').used, 40);
  assert.equal(R(V({ week: 3, growth: 20, visitors: 30, lease: 1 }), 'students').used, 40 + 60 + 30);
});

test('rule 3: composition: visitor leases held for lease days, today\'s and those of devices that left', () => {
  const s8 = R(V({}), 'students');
  assert.deepEqual([s8.residents, s8.visitorLeases, s8.today, s8.gone], [40, 120, 15, 105]);
  const s1 = R(V({ lease: 1 }), 'students');
  assert.deepEqual([s1.residents, s1.visitorLeases, s1.today, s1.gone], [40, 15, 15, 0]);
  // full: residents first, then visitor leases up to the size
  const f = R(V({ week: 6 }), 'students');
  assert.deepEqual([f.residents, f.visitorLeases, f.today, f.gone], [100, 100, 15, 85]);
  // residents alone fill it: no visitor lease, no today's lease, the parts add up to the size
  const g = R(V({ week: 9, growth: 20 }), 'students');
  assert.deepEqual([g.residents, g.visitorLeases, g.today, g.gone, g.used], [200, 0, 0, 0, 200]);
  const k = R(V({ week: 8, growth: 20, lease: 1 }), 'students');
  assert.deepEqual([k.residents, k.visitorLeases, k.today], [200, 0, 0]);
  for (let w = 0; w <= 16; w++) {
    const x = R(V({ week: w, growth: 20, visitors: 30 }), 'students');
    assert.equal(x.residents + x.today + x.gone + x.reserved + x.free, x.size);
  }
});

test('rule 4: IPAM shows the last collection (every 2 h)', () => {
  assert.equal(logic.collectedAt(9.5, 2), 8);
  assert.equal(logic.collectedAt(8, 2), 8);
  assert.equal(logic.collectedAt(7.99, 2), 6);
  assert.deepEqual(V({ week: 5 }).collected, { week: 5, day: 'mon', hour: 8, interval: 2 });
});

test('rule 5: a full range refuses new clients; refused = demand − capacity', () => {
  const w4 = R(V({ week: 4 }), 'students');
  assert.equal(w4.used, 200);
  assert.equal(w4.full, true);
  assert.equal(w4.refused, 0);
  const w5 = R(V({ week: 5 }), 'students');
  assert.equal(w5.full, true);
  assert.equal(w5.refused, 10);
  assert.equal(w5.free, 0);
  assert.equal(R(V({ week: 15, lease: 1 }), 'students').refused, 5);
  assert.equal(R(V({ week: 3 }), 'students').full, false);
  // not full: nobody is refused (never negative)
  for (let w = 0; w <= 3; w++) assert.equal(R(V({ week: w }), 'students').refused, 0);
  assert.equal(R(V({}), 'servers').refused, 0);
  // free = size − used, reservations included
  assert.equal(R(V({}), 'servers').free, 248);
  assert.equal(R(V({}), 'students').free, 40);
  // capacity excludes reservations
  const srv = logic.leasesAt(Object.assign({}, logic.RANGES[4], { residents0: 250 }), 0);
  assert.equal(srv.used, 254);
  assert.equal(srv.refused, 2);
});

test('rule 6: a failover scope is reported by both servers and counted once in the block', () => {
  const s = V({});
  assert.deepEqual(s.reports, [
    { server: 'DHCP1', scopes: ['staff', 'students', 'servers'] },
    { server: 'DHCP2', scopes: ['labs', 'phones', 'students'] }
  ]);
  assert.equal(s.block.used, 5860);
  assert.equal(s.block.naiveUsed, 5860 + 160);
  assert.equal(R(s, 'students').failover, true);
  assert.equal(R(s, 'staff').failover, false);
  assert.equal(logic.blockUsed([{ scopes: ['a', 'a'] }, { scopes: ['a'] }], { a: 7 }), 7);
});

test('rule 7: trend has every week of the term; steady ranges are flat', () => {
  const s = V({ week: 3 });
  assert.equal(R(s, 'students').trend.length, 17);
  assert.equal(R(s, 'students').trend[3], R(s, 'students').util);
  assert.ok(R(s, 'labs').trend.every((u) => u === R(s, 'labs').util));
  assert.equal(s.block.trend.length, 17);
});

test('rule 7: firstFull is the first week with no address left, not one short', () => {
  // visitors 19, growth 1, 8-day lease: 40 + w + 152 → 199 at week 7, 200 at week 8
  const s = V({ visitors: 19, growth: 1 });
  const r = R(s, 'students');
  assert.equal(r.trend[7], 99.5);
  assert.equal(r.firstFull, 8);
});

test('params are clamped and the lease is 1 or 8 days', () => {
  assert.equal(V({ week: 99 }).week, 16);
  assert.equal(V({ week: -3 }).week, 0);
  assert.equal(R(V({ lease: 3 }), 'students').lease, 8);
  assert.equal(R(V({ lease: '1' }), 'students').lease, 1);
  assert.equal(R(V({ visitors: 99 }), 'students').visitors, 30);
  assert.equal(R(V({ growth: 99 }), 'students').growth, 20);
  assert.equal(R(V({ growth: null }), 'students').growth, 10);
  assert.equal(R(V({ growth: 2.4 }), 'students').growth, 2);
  assert.deepEqual(V({ over: 99, under: 99 }).thresholds, { under: 40, over: 95 });
  assert.deepEqual(V({ over: 0, under: 0 }).thresholds, { under: 5, over: 60 });
  assert.deepEqual(V({ over: undefined, under: 'x' }).thresholds, { under: 20, over: 80 });
});

test('range sizes and addresses (SPEC.md §2)', () => {
  const s = V({});
  assert.deepEqual(s.ranges.map((r) => r.size), [4094, 4094, 1022, 200, 254]);
  assert.equal(s.ranges.reduce((t, r) => t + r.size, 0), s.block.inRanges);
  assert.equal(logic.format(logic.parse('10.0.40.219')), '10.0.40.219');
});

// ── presets (SPEC.md §5, §6) ──

test('preset numbers', () => {
  const pre = (id) => V(logic.presets.find((x) => x.id === id).params);
  const b = R(pre('byod-term'), 'students');
  assert.deepEqual([b.used, b.status, b.firstOver, b.firstFull], [170, 'over', 1, 4]);
  const sl = R(pre('short-lease'), 'students');
  assert.deepEqual([sl.used, sl.status, sl.firstOver, sl.firstFull], [165, 'over', 11, 15]);
  assert.equal(sl.firstFull - sl.firstOver, 4);
  const hh = pre('hidden-hotspot');
  assert.equal(R(hh, 'students').full, true);
  assert.equal(Math.round(hh.block.util), 9);
  assert.equal(hh.block.status, 'under');
  const sv = R(pre('server-vlan-under'), 'servers');
  assert.equal(sv.status, 'under');
  assert.equal(Math.round(sv.util), 2);
  const t70 = R(pre('threshold-70'), 'students');
  assert.deepEqual([t70.used, t70.status, t70.firstOver], [145, 'over', 9]);
  assert.equal(t70.trend[8], 67.5);
});

// ── generic checks every sim keeps ──

test('explorer: no steps; state is JSON-safe and deterministic', () => {
  assert.equal(logic.steps, 0);
  for (const pr of logic.presets) {
    const p = P(pr.params);
    const s = kit.stateAt(logic, p, 0);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.deepEqual(kit.stateAt(logic, p, 0), s);
  }
});

test('view does not mutate the ranges table', () => {
  const copy = structuredClone(logic.RANGES);
  V({ week: 16, lease: 1, growth: 20, visitors: 30 });
  assert.deepEqual(logic.RANGES, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k}`);
  for (const pr of logic.presets) if (pr.params.sel) assert.ok(pr.params.sel === 'block' || logic.ids.includes(pr.params.sel));
});
