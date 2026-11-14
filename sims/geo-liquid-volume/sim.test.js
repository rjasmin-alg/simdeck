// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for geo-liquid-volume's model: SPEC.md, rules 1–13, tie-breaks first. Run: node --test sims/geo-liquid-volume/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const V = logic.vessels;
const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const lev = (id, v) => V.level(logic.VESSELS[id].seg, logic.VESSELS[id].cap, v);
const near = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

// ── tie-breaks first ──

test('rule 5 tie-break: full into empty, nothing left and the other exactly full is "same"', () => {
  const r = logic.pour(P({ a: 'tall', b: 'wide', fa: 4, fb: 0 }), 'ab');
  assert.equal(r.verdict, 'same');
  assert.equal(r.left, 0);
  assert.deepEqual(r.patch, { fa: 0, fb: 4 });
});

test('rule 5 order: something left decides before room is looked at; room left means the other holds more', () => {
  const over = logic.pour(P({ a: 'jug', b: 'bottle', fa: 16, fb: 0 }), 'ab');
  assert.equal(over.verdict, 'from');
  assert.equal(over.left, 6);
  assert.deepEqual(over.patch, { fa: 6, fb: 10 });
  const room = logic.pour(P({ a: 'vase', b: 'bowl', fa: 8, fb: 0 }), 'ab');
  assert.equal(room.verdict, 'to');
  assert.deepEqual(room.patch, { fa: 0, fb: 8 });
  // back the other way: the bottle full into the empty jug, the jug holds more
  const back = logic.pour(P({ a: 'jug', b: 'bottle', fa: 0, fb: 10 }), 'ba');
  assert.equal(back.verdict, 'to');
  assert.deepEqual(back.patch, { fa: 10, fb: 0 });
});

test('rule 5: no verdict unless the first was full and the second empty', () => {
  assert.equal(logic.pour(P({ a: 'tall', b: 'wide', fa: 3, fb: 0 }), 'ab').verdict, null);
  assert.equal(logic.pour(P({ a: 'tall', b: 'wide', fa: 4, fb: 1 }), 'ab').verdict, null);
  assert.equal(V.pour(4, 4, 0, 4).verdict, 'same');
});

test('rule 4 tie-break: the same vessel twice is "same" (within 0.05 cm)', () => {
  const r = logic.pour(P({ a: 'tall', b: 'tall', fa: 4, fb: 0 }), 'ab');
  assert.equal(r.change, 'same');
  near(r.hFrom, 20); near(r.hTo, 20);
  assert.equal(logic.SAME_LEVEL, 0.05);
  // different vessels within the tolerance: the low glass's 8 cm become 7.96 cm in the bottle
  const near8 = logic.pour(P({ a: 'wide', b: 'bottle', fa: 4, fb: 0 }), 'ab');
  near(near8.hTo, 7.9594);
  assert.equal(near8.change, 'same');
});

test('rule 1 tie-break: a missing fa takes the default, a present non-number is 0; the same vessel twice is allowed', () => {
  const s = logic.initial({ mode: 'pour', a: 'tall', b: 'tall' });
  assert.equal(s.fa, 4);
  assert.equal(s.b, 'tall');
  assert.equal(S({ fa: 'x' }).fa, 0);
  assert.equal(S({ fa: true }).fa, 0);
  assert.equal(S({ fa: null }).fa, 0);
  assert.equal(S({ fb: null }).fb, 0);
  assert.equal(logic.initial({ mode: 'pour' }).fb, 0, 'a missing fb is 0');
  assert.equal(S({ a: 'tall', b: 'pot', fb: 20 }).fb, 20, 'fb is clamped to the right vessel');
  // the default 4 is cut to a smaller vessel
  assert.equal(logic.initial({ mode: 'pour', a: 'cup' }).fa, 2);
});

// ── rules ──

test('rule 1: unknown choices fall back, amounts are rounded and clamped', () => {
  const s = S({ mode: 'nope', a: 'tank', b: 'dl', fa: 99, fb: -3 });
  assert.equal(s.mode, 'pour');
  assert.equal(s.a, 'tall');
  assert.equal(s.b, 'wide', 'the 1 dl measure is not a pour vessel');
  assert.equal(s.fa, 4);
  assert.equal(s.fb, 0);
  assert.equal(S({ fa: 2.6 }).fa, 3);
  const c = S({ mode: 'cup', big: 'tank', unit: 'bucket', k: 99 });
  assert.equal(c.big, 'jug');
  assert.equal(c.unit, 'cup');
  assert.equal(c.k, 8);
  assert.equal(S({ mode: 'cup', k: -1 }).k, 0);
  assert.equal(S({ mode: 'litre', dl: 51 }).dl, 50);
  assert.equal(S({ mode: 'litre', dl: -1 }).dl, 0);
  assert.equal(S({ mode: 'litre', dl: '' }).dl, 0);
});

test('vessels: the drawn shapes hold within 2 % of their capacity, and the capacities and heights of SPEC', () => {
  const want = { tall: [4, 20], wide: [4, 8], cup: [2, 6], dl: [1, 6], vase: [8, 25], bowl: [9, 5], bottle: [10, 26], jug: [16, 16.8], pot: [30, 13] };
  for (const [id, [cap, H]] of Object.entries(want)) {
    const v = logic.VESSELS[id];
    assert.equal(v.cap, cap, id);
    near(V.height(v.seg), H, 1e-9);
    const off = Math.abs(V.shapeVolume(v.seg) / 100 - cap) / cap;
    assert.ok(off < 0.02, `${id} off by ${(off * 100).toFixed(2)} %`);
  }
});

test('rule 2: the level of water in a vessel', () => {
  near(lev('tall', 4), 20); near(lev('tall', 2), 10);
  near(lev('wide', 4), 8); near(lev('wide', 2), 4);
  near(lev('vase', 8), 25); near(lev('vase', 4), 7.7968);
  near(lev('bowl', 8), 4.5557); near(lev('bowl', 9), 5);
  near(lev('jug', 6), 6.3); near(lev('jug', 16), 16.8);
  near(lev('bottle', 5), 9.9492); near(lev('bottle', 10), 26);
  near(lev('cup', 1), 3.2294);
  assert.equal(lev('jug', 0), 0);
  // a narrower vessel: the same water stands higher
  assert.ok(lev('tall', 3) > lev('wide', 3));
});

test('rule 3: pouring moves what fits, nothing is spilled, the total stays', () => {
  for (const [fa, fb] of [[4, 0], [4, 1], [2, 2], [1, 0]]) {
    const p = P({ a: 'tall', b: 'cup', fa, fb });
    const r = logic.pour(p, 'ab');
    const after = Object.assign({}, p, r.patch);
    assert.equal(after.fa + after.fb, fa + fb);
    assert.equal(r.moved, Math.min(fa, 2 - fb));
  }
});

test('rule 3: refused when the first is empty or the second full; the params stay', () => {
  const e = logic.pour(P({ fa: 0, fb: 0 }), 'ab');
  assert.equal(e.refused, 'empty');
  assert.deepEqual(e.patch, {});
  const f = logic.pour(P({ a: 'jug', b: 'cup', fa: 16, fb: 2 }), 'ab');
  assert.equal(f.refused, 'full');
  assert.deepEqual(f.patch, {});
  assert.equal(f.verdict, null);
  assert.equal(f.change, null);
});

test('rule 4: the layer the poured water made, and makes', () => {
  const lower = logic.pour(P({ a: 'tall', b: 'wide', fa: 4, fb: 0 }), 'ab');
  assert.equal(lower.change, 'lower'); near(lower.hFrom, 20); near(lower.hTo, 8);
  const higher = logic.pour(P({ a: 'tall', b: 'wide', fa: 0, fb: 4 }), 'ba');
  assert.equal(higher.change, 'higher'); near(higher.hFrom, 8); near(higher.hTo, 20);
  // only the top 10 dl of the jug move: 16.8 − 6.3 = 10.5 cm become 26 cm
  // into a vessel that already has water: the layer, not the level
  const onto = logic.pour(P({ a: 'tall', b: 'wide', fa: 2, fb: 2 }), 'ab');
  assert.equal(onto.change, 'lower'); near(onto.hFrom, 10); near(onto.hTo, 4);
  const jug = logic.pour(P({ a: 'jug', b: 'bottle', fa: 16, fb: 0 }), 'ab');
  assert.equal(jug.change, 'higher'); near(jug.hFrom, 10.5); near(jug.hTo, 26);
});

test('pour state: totals, fullness, heights and levels the page reads', () => {
  const s = S({ a: 'jug', b: 'bottle', fa: 6, fb: 10 });
  assert.deepEqual([s.total, s.fullA, s.fullB, s.heightA, s.heightB], [16, false, true, 16.8, 26]);
  near(s.levelA, 6.3); near(s.levelB, 26);
  assert.equal(S({ a: 'jug', fa: 16, fb: 0 }).fullA, true);
});

test('rule 6: fill and empty', () => {
  assert.deepEqual(logic.fill(P({ a: 'jug' }), 'a'), { fa: 16 });
  assert.deepEqual(logic.fill(P({ b: 'pot' }), 'b'), { fb: 30 });
  assert.deepEqual(logic.empty(P(), 'a'), { fa: 0 });
  assert.deepEqual(logic.empty(P(), 'b'), { fb: 0 });
});

test('rule 7: measuring with a unit: whole units, the rest, the most to pour', () => {
  const want = {
    'jug cup': [8, 0, 8], 'jug wide': [4, 0, 4], 'jug dl': [16, 0, 16],
    'bottle cup': [5, 0, 5], 'bottle wide': [2, 2, 3], 'bottle dl': [10, 0, 10],
    'pot cup': [15, 0, 15], 'pot wide': [7, 2, 8], 'pot dl': [30, 0, 30]
  };
  for (const [k, [full, rest, kMax]] of Object.entries(want)) {
    const [big, unit] = k.split(' ');
    const s = S({ mode: 'cup', big, unit });
    assert.deepEqual([s.full, s.rest, s.kMax, s.exact], [full, rest, kMax, rest === 0], k);
  }
  const part = S({ mode: 'cup', big: 'pot', unit: 'wide', k: 8 });
  assert.equal(part.inBig, 30);
  assert.equal(part.done, true);
  assert.equal(part.left, 2, 'the last glass keeps 4 − 2 dl');
  const mid = S({ mode: 'cup', big: 'pot', unit: 'wide', k: 7 });
  assert.equal(mid.inBig, 28);
  assert.equal(mid.done, false);
  assert.equal(mid.left, 0);
  near(S({ mode: 'cup', big: 'jug', unit: 'cup', k: 3 }).level, 6.3);
  assert.equal(S({ mode: 'cup', big: 'jug', unit: 'dl', k: 15 }).done, false);
  assert.equal(S({ mode: 'cup', big: 'jug', unit: 'dl', k: 16 }).done, true);
});

test('rule 8: one more unit is refused when the big vessel is full; fill up and empty', () => {
  assert.deepEqual(logic.addUnit(P({ mode: 'cup', k: 7 })), { patch: { k: 8 }, refused: null });
  assert.deepEqual(logic.addUnit(P({ mode: 'cup', k: 8 })), { patch: {}, refused: 'done' });
  assert.deepEqual(logic.addUnit(P({ mode: 'cup', big: 'pot', unit: 'wide', k: 7 })).patch, { k: 8 });
  assert.deepEqual(logic.fillUp(P({ mode: 'cup', big: 'pot', unit: 'cup' })), { k: 15 });
});

test('rule 9: a new unit keeps a full big vessel full, and starts an unfinished one again', () => {
  assert.deepEqual(logic.setUnit(P({ mode: 'cup', big: 'jug', unit: 'cup', k: 8 }), 'wide'), { unit: 'wide', k: 4 });
  assert.deepEqual(logic.setUnit(P({ mode: 'cup', big: 'jug', unit: 'wide', k: 4 }), 'dl'), { unit: 'dl', k: 16 });
  assert.deepEqual(logic.setUnit(P({ mode: 'cup', big: 'pot', unit: 'cup', k: 15 }), 'wide'), { unit: 'wide', k: 8 });
  assert.deepEqual(logic.setUnit(P({ mode: 'cup', big: 'jug', unit: 'cup', k: 3 }), 'wide'), { unit: 'wide', k: 0 });
  assert.deepEqual(logic.setUnit(P({ mode: 'cup', unit: 'cup', k: 3 }), 'bucket'), { unit: 'cup', k: 0 });
});

test('rule 10: litres and decilitres, and the bottles', () => {
  const want = { 0: [0, 0, [0, 0, 0, 0, 0]], 7: [0, 7, [7, 0, 0, 0, 0]], 10: [1, 0, [10, 0, 0, 0, 0]],
    13: [1, 3, [10, 3, 0, 0, 0]], 23: [2, 3, [10, 10, 3, 0, 0]], 40: [4, 0, [10, 10, 10, 10, 0]], 50: [5, 0, [10, 10, 10, 10, 10]] };
  for (const [n, [l, rest, bottles]] of Object.entries(want)) {
    const s = S({ mode: 'litre', dl: Number(n) });
    assert.deepEqual([s.l, s.rest, s.bottles], [l, rest, bottles], n);
  }
});

test('rule 10: +1 dl, −1 dl, +1 l, −1 l, refused past 0 or 50 (not cut)', () => {
  assert.deepEqual(logic.addDl(P({ mode: 'litre', dl: 9 }), 1), { patch: { dl: 10 }, refused: null });
  assert.deepEqual(logic.addDl(P({ mode: 'litre', dl: 13 }), 10), { patch: { dl: 23 }, refused: null });
  assert.deepEqual(logic.addDl(P({ mode: 'litre', dl: 13 }), -10), { patch: { dl: 3 }, refused: null });
  assert.deepEqual(logic.addDl(P({ mode: 'litre', dl: 7 }), -10), { patch: {}, refused: 'limit' });
  assert.deepEqual(logic.addDl(P({ mode: 'litre', dl: 0 }), -1), { patch: {}, refused: 'limit' });
  assert.deepEqual(logic.addDl(P({ mode: 'litre', dl: 50 }), 1), { patch: {}, refused: 'limit' });
  assert.deepEqual(logic.addDl(P({ mode: 'litre', dl: 41 }), 10), { patch: {}, refused: 'limit' });
  assert.deepEqual(logic.addDl(P({ mode: 'litre', dl: 40 }), 10), { patch: { dl: 50 }, refused: null });
});

test('rules 11 and 13: a whole litre, and both parts present', () => {
  assert.equal(S({ mode: 'litre', dl: 10 }).wholeLitre, true);
  assert.equal(S({ mode: 'litre', dl: 40 }).wholeLitre, true);
  assert.equal(S({ mode: 'litre', dl: 0 }).wholeLitre, false);
  assert.equal(S({ mode: 'litre', dl: 13 }).wholeLitre, false);
  assert.equal(S({ mode: 'litre', dl: 23 }).mixed, true);
  assert.equal(S({ mode: 'litre', dl: 7 }).mixed, false);
  assert.equal(S({ mode: 'litre', dl: 20 }).mixed, false);
});

test('rule 12: ask first is carried in every mode', () => {
  for (const mode of logic.MODES) {
    assert.equal(S({ mode, hide: true }).hide, true);
    assert.equal(S({ mode }).hide, false);
    assert.equal(S({ mode, hide: 'yes' }).hide, false);
  }
});

test('presets: the expected outcomes of SPEC', () => {
  const pr = Object.fromEntries(logic.PRESETS.map((x) => [x.id, P(x.params)]));
  assert.deepEqual(logic.PRESETS.map((x) => x.id), ['same', 'which', 'overflow', 'cups', 'glasses', 'litre', 'l-dl']);
  assert.equal(logic.pour(pr.same, 'ab').verdict, 'same');
  assert.equal(logic.pour(pr.which, 'ab').verdict, 'to');
  assert.equal(logic.pour(pr.overflow, 'ab').left, 6);
  assert.equal(logic.initial(Object.assign({}, pr.cups, logic.fillUp(pr.cups))).k, 8);
  const g = logic.initial(Object.assign({}, pr.glasses, logic.fillUp(pr.glasses)));
  assert.deepEqual([g.full, g.exact, g.left], [7, false, 2]);
  assert.equal(logic.initial(pr.litre).dl, 0);
  const ld = logic.initial(pr['l-dl']);
  assert.deepEqual([ld.l, ld.rest, ld.hide], [2, 3, true]);
  for (const id of ['which', 'overflow', 'cups', 'l-dl']) assert.equal(pr[id].hide, true, id);
  for (const id of ['same', 'glasses', 'litre']) assert.equal(pr[id].hide, false, id);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe in every mode and preset', () => {
  for (const pr of logic.PRESETS) {
    const s = logic.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  for (const pr of logic.PRESETS) {
    const p = P(pr.params), copy = structuredClone(p);
    assert.deepEqual(logic.initial(p), logic.initial(p));
    logic.pour(p, 'ab'); logic.addUnit(p); logic.setUnit(p, 'wide'); logic.addDl(p, 1);
    assert.deepEqual(p, copy);
  }
});

test('an explorer: no steps', () => {
  assert.equal(logic.steps, undefined);
  assert.equal(kit.stepsOf(logic, P()), 0);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
  for (const id of Object.keys(logic.VESSELS)) assert.ok(strings.hr['v_' + id] && strings.en['v_' + id], id);
  for (const u of logic.UNIT_IDS) for (const k of ['u_', 'uw_', 'ua_']) assert.ok(strings.hr[k + u] && strings.en[k + u], k + u);
  for (const pr of logic.PRESETS) {
    const k = pr.id.replace('-', '_');
    assert.ok(strings.hr['p_' + k] && strings.hr['ph_' + k], pr.id);
  }
});

test('every preset param is a model param; the page and sim.json agree with the model', () => {
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  const ids = logic.PRESETS.map((x) => x.id);
  for (const e of sim.entries) assert.ok(ids.includes(e.preset), e.preset);
});
