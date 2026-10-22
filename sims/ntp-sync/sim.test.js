// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ntp-sync: one test (or group) per rule of SPEC.md, tie-breaks first, then the preset numbers, then the
// template's generic block. Times are µs.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const S = logic.S, MS = logic.MS;

// ── tie-breaks ──

test('rule 7: exactly 1 s is not larger than the threshold, so it is slewed', () => {
  assert.equal(logic.decide(1 * S, 1), 'slew');
  assert.equal(logic.decide(-1 * S, 1), 'slew');
  assert.equal(logic.decide(1 * S + 1, 1), 'step');
  assert.equal(logic.decide(-(1 * S + 1), 1), 'step');
  // through the run: true offset 1000 ms, symmetric, update 1
  assert.equal(end({ trueOffset: 1000 }).clock.mode, 'slew');
  assert.equal(end({ trueOffset: 1010 }).clock.mode, 'step');
  assert.equal(at({ trueOffset: 1000 }, 6).ev.exact, true, 'the page words the exact case');
  assert.equal(at({ trueOffset: 1010 }, 6).ev.exact, false);
});

test('rule 7: update 3 is still one of the first three (step), update 4 is not (slew)', () => {
  assert.equal(logic.decide(5 * S, 3), 'step');
  assert.equal(logic.decide(5 * S, 4), 'slew');
  assert.equal(end({ trueOffset: 5000, updateNo: 3 }).clock.mode, 'step');
  assert.equal(end({ trueOffset: 5000, updateNo: 4 }).clock.mode, 'slew');
});

test('rule 7: theta = 0 is a slew of nothing', () => {
  assert.equal(logic.decide(0, 1), 'slew');
  assert.equal(logic.slewTime(0), 0);
});

test('rule 5 tie-break: equal stratum and error bound falls to the name', () => {
  const src = [{ name: 'b', stratum: 1, bound: 100 }, { name: 'a', stratum: 1, bound: 100 }];
  assert.equal(logic.select(src), 1);
  assert.equal(logic.select(src.slice().reverse()), 0);
});

test('rule 4 edge: a client of a stratum-15 source is 16 (unsynchronised); no source is 16', () => {
  assert.equal(logic.stratumAfter(14), 15);
  assert.equal(logic.stratumAfter(15), 16);
  assert.equal(logic.stratumAfter(16), 16);
  assert.equal(logic.stratumAfter(null), 16);
});

// ── rules ──

test('rule 1: offset and delay from the four timestamps', () => {
  const t = { T1: 0, T2: 130 * MS, T3: 131 * MS, T4: 41 * MS };
  assert.equal(logic.offsetOf(t), 110 * MS);
  assert.equal(logic.delayOf(t), 40 * MS);
  // T1 and T4 on the client's clock, T2 and T3 on the server's
  assert.deepEqual(logic.timestamps(0, 100 * MS, 30 * MS, 10 * MS, 1 * MS), t);
  assert.deepEqual(logic.timestamps(7 * S, 0, 5 * MS, 5 * MS, 0), { T1: 7 * S, T2: 7 * S + 5 * MS, T3: 7 * S + 5 * MS, T4: 7 * S + 10 * MS });
});

test('rule 2: the error is (dOut - dBack) / 2 and never more than delay / 2', () => {
  for (const off of [-2000, -37, 0, 100, 5000]) {
    for (const [o, b] of [[10, 10], [30, 10], [10, 30], [100, 1], [1, 100], [11, 10]]) {
      const x = logic.exchange(0, off * MS, { dOut: o * MS, dBack: b * MS, proc: 1 * MS }, 1);
      assert.equal(x.error, logic.errorOf(o * MS, b * MS), `error ${off} ${o}/${b}`);
      assert.equal(x.offset, off * MS + (o - b) * MS / 2);
      assert.ok(Math.abs(x.error) <= x.bound, `bound ${off} ${o}/${b}`);
      if (o === b) assert.equal(x.offset, off * MS, 'equal delays give the true offset');
    }
  }
  // the bound is reached only in the limit: all of the delay one way
  const x = logic.exchange(0, 0, { dOut: 100 * MS, dBack: 1 * MS, proc: 0 }, 1);
  assert.equal(x.error, 49.5 * MS);
  assert.equal(x.bound, 50.5 * MS);
});

test('rule 3: processing time is removed from delay and does not change offset', () => {
  const base = logic.exchange(0, 100 * MS, { dOut: 30 * MS, dBack: 10 * MS, proc: 0 }, 1);
  for (const proc of [1, 5, 10]) {
    const x = logic.exchange(0, 100 * MS, { dOut: 30 * MS, dBack: 10 * MS, proc: proc * MS }, 1);
    assert.equal(x.delay, 40 * MS);
    assert.equal(x.offset, base.offset);
    assert.equal(x.t.T4 - x.t.T1, (40 + proc) * MS, 'the client waited the processing time too');
  }
});

test('rule 4: stratum 1 has a reference clock; one hop adds one; the client joins at its first update', () => {
  assert.equal(logic.stratumAfter(1), 2);
  assert.equal(logic.stratumAfter(2), 3);
  const boot = { trueOffset: 100, updateNo: 1 };
  assert.equal(at(boot, 0).stratum.client, 16);
  assert.equal(at(boot, 5).stratum.client, 16);
  assert.equal(at(boot, 6).stratum.client, 2);
  assert.equal(at(boot, 6).ev.joined, true);
  assert.equal(at({ updateNo: 5 }, 0).stratum.client, 2);
  assert.equal(at({ updateNo: 5 }, 6).ev.joined, false);
  assert.equal(at({}, 0).stratum.server, 1);
});

test('rule 5: stratum-16 sources are unusable; lowest stratum, then smallest error bound', () => {
  const book = logic.sourcesOf('none');
  assert.equal(book[logic.select(book)].name, '161.53.78.71');
  const one = logic.sourcesOf('one');
  assert.equal(logic.usable(one[3]), false);
  assert.equal(one[logic.select(one)].name, '161.53.78.72');
  const both = logic.sourcesOf('both');
  assert.equal(both[logic.select(both)].name, '232.184.183.46.static.ed…');
  assert.equal(logic.select(logic.sourcesOf('all')), -1);
  // a lower stratum wins over a smaller error bound
  assert.equal(logic.select([{ name: 'x', stratum: 2, bound: 1 }, { name: 'y', stratum: 1, bound: 9000 }]), 1);
});

test('rule 6: step when larger than 1 s within the first 3 updates, else slew', () => {
  assert.equal(logic.decide(5 * S, 1), 'step');
  assert.equal(logic.decide(-5 * S, 2), 'step');
  assert.equal(logic.decide(5 * S, 10), 'slew');
  assert.equal(logic.decide(100 * MS, 1), 'slew');
  assert.equal(logic.decide(-999 * MS, 1), 'slew');
});

test('rule 6: a step may go backwards; a slew never does', () => {
  const back = end({ trueOffset: -2000 });
  assert.equal(back.clock.mode, 'step');
  assert.equal(back.clock.backwards, true);
  assert.ok(back.clock.to < back.clock.from);
  for (const theta of [5 * S, -5 * S, -100 * MS]) {
    let last = -Infinity;
    for (let u = 0; u <= 12000 * S; u += 250 * S) {
      const r = logic.clockAfter(0, theta, 'slew', u);
      assert.ok(r > last, `slew ${theta} at ${u}`);
      last = r;
    }
    assert.equal(logic.clockAfter(0, theta, 'slew', 20000 * S), 20000 * S + theta, 'a slew ends having applied all of theta');
  }
  assert.ok(logic.clockAfter(1 * S, -2 * S, 'step', 0) < 1 * S);
});

test('rule 6: slew rate 0.5 ms per second; 5 s takes 10 000 s', () => {
  assert.equal(logic.slewed(5 * S, 64 * S), 32 * MS);
  assert.equal(logic.slewed(-5 * S, 64 * S), -32 * MS);
  assert.equal(logic.slewed(10 * MS, 64 * S), 10 * MS, 'never more than theta');
  assert.equal(logic.slewTime(5 * S), 10000 * S);
});

// ── steps and presets ──

test('steps: one timestamp per step, in order, each from its own clock', () => {
  const p = { dOut: 30 };
  assert.deepEqual(at(p, 1).t, { T1: 0, T2: null, T3: null, T4: null });
  assert.deepEqual(at(p, 2).taken, ['T1', 'T2']);
  assert.equal(at(p, 2).clock.server, 130 * MS);
  assert.equal(at(p, 2).clock.value, 30 * MS);
  assert.equal(at(p, 4).offset, null, 'nothing computed before step 5');
  assert.equal(at(p, 5).offset, 110 * MS);
  assert.equal(at(p, 5).clock.mode, null, 'no correction before step 6');
  assert.equal(logic.steps(P({})), 6);
  assert.equal(logic.steps(P({ next: true })), 7);
  assert.equal(logic.steps(P({ mode: 'chain' })), 4);
});

test('preset symmetric: theta 0.100 s exactly, delay 0.020 s', () => {
  const s = end({});
  assert.deepEqual(s.t, { T1: 0, T2: 110 * MS, T3: 111 * MS, T4: 21 * MS });
  assert.equal(s.offset, 100 * MS);
  assert.equal(s.delay, 20 * MS);
  assert.equal(s.error, 0);
  assert.equal(s.clock.mode, 'slew');
  assert.equal(s.clock.took, 200 * S);
});

test('preset asymmetric: theta 0.110 s, 10 ms wrong, bound 20 ms', () => {
  const s = end({ dOut: 30 });
  assert.deepEqual(s.t, { T1: 0, T2: 130 * MS, T3: 131 * MS, T4: 41 * MS });
  assert.equal(s.offset, 110 * MS);
  assert.equal(s.delay, 40 * MS);
  assert.equal(s.error, 10 * MS);
  assert.equal(s.bound, 20 * MS);
});

test('preset boot-step: 5 s at update 1 steps; the next exchange finds 0', () => {
  const p = { trueOffset: 5000, updateNo: 1, next: true };
  const s6 = at(p, 6);
  assert.equal(s6.clock.mode, 'step');
  assert.equal(s6.clock.from, 21 * MS);
  assert.equal(s6.clock.to, 5021 * MS);
  const s = end(p);
  assert.deepEqual(s.next.t, { T1: 69021 * MS, T2: 69031 * MS, T3: 69032 * MS, T4: 69042 * MS });
  assert.equal(s.next.offset, 0);
  assert.equal(s.next.update, 2);
  assert.equal(s.next.mode, 'slew');
});

test('preset late-slew: 5 s at update 10 slews; 64 s later 4.968 s are left', () => {
  const s = end({ trueOffset: 5000, updateNo: 10, next: true });
  assert.equal(at({ trueOffset: 5000, updateNo: 10 }, 6).clock.mode, 'slew');
  assert.equal(s.clock.took, 10000 * S);
  assert.deepEqual(s.next.t, { T1: 64053 * MS, T2: 69031 * MS, T3: 69032 * MS, T4: 64074 * MS });
  assert.equal(s.next.offset, 4968 * MS);
  assert.equal(s.next.update, 11);
  assert.equal(s.ev.finished, false);
  assert.equal(end({ trueOffset: 10, updateNo: 10, next: true }).ev.finished, true, 'a 10 ms slew is done within 64 s');
});

test('preset stratum-chain: 161.53.78.71 selected, client stratum 2, 0.000037158 s slow', () => {
  const p = { mode: 'chain', down: 'none' };
  assert.equal(at(p, 1).selected, -1);
  assert.deepEqual(at(p, 2).sources.map((x) => x.usable), [true, true, true, true]);
  const s = end(p);
  assert.equal(s.sources[s.selected].name, '161.53.78.71');
  assert.deepEqual(s.sources.map((x) => x.selected), [false, false, false, true]);
  assert.equal(s.sources[1].name, 'gu.irb.hr');
  assert.equal(s.sources[1].stratum, 3);
  assert.equal(s.stratum.client, 2);
  assert.equal(s.offset, 37.158);
  assert.equal(s.clock.mode, 'slew');
  assert.equal(end({ mode: 'chain', down: 'both' }).stratum.client, 3);
  assert.equal(end({ mode: 'chain', down: 'all' }).stratum.client, 16);
  assert.equal(end({ mode: 'chain', down: 'one' }).offset, null, 'the book\'s number belongs to the book\'s selection only');
});

// ── generic checks every sim keeps ──

const RUNS = [{}, { dOut: 30 }, { trueOffset: 5000, next: true }, { trueOffset: 5000, updateNo: 10, next: true },
  { trueOffset: -2000, dOut: 1, dBack: 100, proc: 0, next: true }, { mode: 'chain' }, { mode: 'chain', down: 'all' }];

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
    const p = P(r), N = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= N; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = N; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const r of RUNS) {
    const p = P(r);
    const s0 = logic.initial(p);
    const copy = structuredClone(s0);
    logic.step(s0, 1, p);
    assert.deepEqual(s0, copy);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
