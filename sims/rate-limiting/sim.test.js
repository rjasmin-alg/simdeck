// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for rate-limiting's model (SPEC.md). Run: node --test sims/rate-limiting/
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
const ids = (list) => list.map((r) => r.id);
const outs = (list) => list.map((r) => r.out / 10);

// Run a custom arrival stream [[at_ds, count], ...] for n steps.
function custom(over, groups, n) {
  const p = P(over);
  let s = logic.initial(p);
  let id = 1;
  s.arrivals = [];
  for (const [t, count] of groups) for (let i = 0; i < count; i++) s.arrivals.push({ id: id++, at: t });
  for (let k = 1; k <= n; k++) s = logic.step(s, k, p);
  return s;
}

// ── tie-breaks first (rule 5) ──

test('tie-break: within one instant arrivals are handled in id order', () => {
  const s = at({}, 1);
  assert.deepEqual(ids(s.tb.passed), [1, 2, 3, 4, 5]);
  assert.deepEqual(ids(s.tb.rejected), [6, 7, 8, 9, 10]);
  assert.deepEqual(ids(s.lb.passed).concat(ids(s.lb.queue)), [1, 2, 3, 4, 5]);
  assert.deepEqual(ids(s.lb.dropped), [6, 7, 8, 9, 10]);
});

test('tie-break: the token bucket refills before the same instant\'s arrivals', () => {
  // b = 1, r = 2: the token used at 0 s is back at exactly 0.5 s, so a request at 0.5 s passes
  const s = custom({ b: 1 }, [[0, 1], [5, 1]], 2);
  assert.deepEqual(ids(s.tb.passed), [1, 2]);
  assert.deepEqual(s.tb.rejected, []);
});

test('tie-break: a waiting request due now leaves before the same instant\'s arrivals', () => {
  // q = 1, r = 2: request 1 (0 s) leaves at once; request 2 (0.2 s) waits until 0.5 s; request 3 arrives at 0.5 s and
  // finds the one place free because request 2 left first
  const s = custom({ q: 1 }, [[0, 1], [2, 1], [5, 1]], 3);
  assert.deepEqual(ids(s.lb.dropped), []);
  assert.deepEqual(s.lb.passed.map((r) => [r.id, r.out / 10]), [[1, 0], [2, 0.5], [3, 1]]);
});

test('releases happen at their own time inside a step, not at the step\'s instant', () => {
  // q = 1, r = 2, arrivals at 0, 0.1 and 0.3 s: request 2 waits until 0.5 s, so request 3 (0.3 s) finds the queue
  // full and is dropped; releasing request 2 early, at the step's instant or on arrival, would admit request 3
  const s = custom({ q: 1 }, [[0, 1], [1, 1], [3, 1]], 2);
  assert.deepEqual(ids(s.lb.dropped), [3]);
  assert.deepEqual(s.lb.passed.map((r) => [r.id, r.out / 10]), [[1, 0], [2, 0.5]]);
});

test('tie-break: a request that leaves at its own arrival instant still held a place during that instant', () => {
  // burst of 10 into q = 5: 5 admitted (request 1 leaves at once, after the burst was admitted), not 6
  const s = at({}, 1);
  assert.equal(s.lb.passed.length + s.lb.queue.length, 5);
  assert.deepEqual(outs(s.lb.passed), [0]);
});

// ── rule 1: token bucket ──

test('rule 1: tokens accrue at r per second up to b; a request takes one token or is rejected', () => {
  const s0 = at({}, 0);
  assert.equal(s0.tb.level, 50, 'starts full');
  const s1 = at({}, 1);
  assert.equal(s1.tb.level, 0, 'five requests took five tokens');
  assert.equal(at({}, 2).tb.level, 10, '0.5 s at 2/s = 1 token');
  assert.equal(at({ r: 1 }, 2).tb.level, 5, '0.5 s at 1/s = half a token');
  assert.equal(at({}, 6).tb.level, 50, 'full again after 2.5 s');
  assert.equal(at({ r: 5 }, 6).tb.level, 50, 'never above b');
  // half a token is not enough: r = 1, b = 1, requests at 0 and 0.5 s
  const s = custom({ r: 1, b: 1 }, [[0, 1], [5, 1], [10, 1]], 3);
  assert.deepEqual(ids(s.tb.passed), [1, 3]);
  assert.deepEqual(ids(s.tb.rejected), [2]);
});

test('rule 1: a rejected request is gone (no retry, no delay)', () => {
  const s = end({});
  assert.equal(s.tb.passed.length + s.tb.rejected.length, 10);
  assert.ok(s.tb.passed.every((r) => r.at === 0));
});

// ── rule 2: burst through a full bucket, long-run rate ≤ r ──

test('rule 2: a full bucket passes a burst of up to b at one instant', () => {
  for (const b of [1, 5, 10]) assert.equal(at({ b }, 1).tb.passed.length, b);
});

test('rule 2: over any window of length w at most b + r·w requests pass', () => {
  for (const r of [1, 2, 5]) for (const b of [1, 5, 10]) for (const pattern of ['burst', 'steady', 'idle-burst']) {
    const s = end({ r, b, pattern });
    const times = s.tb.passed.map((x) => x.at);
    for (const t0 of times) for (const t1 of times) if (t1 >= t0) {
      const n = times.filter((t) => t >= t0 && t <= t1).length;
      assert.ok(n * 10 <= b * 10 + r * (t1 - t0), `r=${r} b=${b} ${pattern} [${t0},${t1}]`);
    }
  }
});

// ── rule 3: leaky bucket as a queue ──

test('rule 3: one request leaves every 1/r s; a full queue drops', () => {
  for (const r of [1, 2, 5]) {
    const s = at({ r, q: 5 }, 6);
    const o = s.lb.passed.concat(s.lb.queue).map((x) => x.out);
    assert.deepEqual(o, [0, 1, 2, 3, 4].map((k) => k * logic.gap(P({ r }))), `r=${r}`);
    assert.equal(s.lb.dropped.length, 5);
  }
});

test('rule 3: out time is fixed at admission (max of arrival and previous out + 1/r)', () => {
  const s = custom({}, [[0, 2], [20, 1]], 6);
  assert.deepEqual(s.lb.passed.map((r) => [r.id, r.at / 10, r.out / 10]), [[1, 0, 0], [2, 0, 0.5], [3, 2, 2]]);
});

test('rule 3: the queue holds at most q', () => {
  for (const q of [1, 5, 10]) for (const pattern of ['burst', 'steady', 'idle-burst']) {
    const p = P({ q, pattern });
    for (let n = 0; n <= logic.steps(p); n++) assert.ok(kit.stateAt(logic, p, n).lb.queue.length <= q);
  }
});

// ── rule 4: both limit the long-run rate to r; a burst passes at once vs as delay ──

test('rule 4: a burst passes at once through the token bucket and spread out through the leaky bucket', () => {
  const s = end({});
  assert.equal(logic.maxDelay(s.lb), 20);
  assert.deepEqual([...new Set(s.tb.passed.map((r) => r.at))], [0]);
  assert.deepEqual(outs(s.lb.passed), [0, 0.5, 1, 1.5, 2]);
});

test('rule 4: both keep the long-run rate at r: by time t at most b + r·t (token) and 1 + r·t (leaky) have passed', () => {
  for (const r of [1, 2, 5]) for (const b of [1, 5, 10]) for (const q of [1, 5, 10]) for (const pattern of ['burst', 'steady', 'idle-burst']) {
    const p = P({ r, b, q, pattern });
    for (let n = 1; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.ok(s.tb.passed.length * 10 <= b * 10 + r * s.t, `token r=${r} b=${b} ${pattern} n=${n}`);
      assert.ok((s.lb.passed.length - 1) * 10 <= r * s.t, `leaky r=${r} q=${q} ${pattern} n=${n}`);
      const o = s.lb.passed.map((x) => x.out);
      for (let i = 1; i < o.length; i++) assert.ok(o[i] - o[i - 1] >= logic.gap(p));
    }
  }
});

// ── rule 6: b = 1 is a smoother ──

test('rule 6: with b = 1 no two requests pass less than 1/r apart', () => {
  for (const r of [1, 2, 5]) for (const pattern of ['burst', 'steady', 'idle-burst']) {
    const t = end({ r, b: 1, pattern }).tb.passed.map((x) => x.at);
    for (let i = 1; i < t.length; i++) assert.ok(t[i] - t[i - 1] >= logic.gap(P({ r })), `r=${r} ${pattern}`);
  }
});

// ── presets (SPEC.md, expected numbers) ──

test('preset burst-10: 5 pass, 5 rejected; 5 queued, out 0 … 2 s, max delay 2 s', () => {
  const s = end({});
  assert.equal(logic.steps(P({})), 6);
  assert.equal(s.tb.passed.length, 5);
  assert.equal(s.tb.rejected.length, 5);
  assert.deepEqual(outs(s.lb.passed), [0, 0.5, 1, 1.5, 2]);
  assert.equal(s.lb.dropped.length, 5);
  assert.equal(logic.maxDelay(s.lb), 20);
  assert.equal(s.tb.level, 50);
});

test('preset steady-3: token bucket dry at 4.5 s; leaky passes 2/s and drops from 5.5 s', () => {
  const p = { pattern: 'steady' };
  assert.equal(logic.steps(P(p)), 12);
  const s = end(p);
  assert.equal(s.arrivals.length, 18);
  assert.deepEqual(s.tb.rejected.map((r) => [r.id, r.at / 10]), [[15, 4.5], [18, 5.5]]);
  assert.equal(at(p, 9).tb.rejected.length, 0, 'nothing rejected by 4.0 s');
  assert.deepEqual(outs(s.lb.passed), [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]);
  assert.deepEqual(s.lb.dropped.map((r) => [r.id, r.at / 10]), [[18, 5.5]]);
  assert.equal(at(p, 10).lb.queue.length, 5, 'queue full at 4.5 s');
  assert.deepEqual(ids(s.lb.queue), [13, 14, 15, 16, 17]);
  assert.equal(logic.maxDelay(s.lb), 20);
  assert.equal(logic.maxDelayAll(s.lb), 25);
});

test('preset idle-then-burst: the token bucket refills and passes the second burst whole', () => {
  const s = end({ pattern: 'idle-burst' });
  assert.equal(s.tb.passed.length, 10);
  assert.equal(s.tb.rejected.length, 0);
  assert.deepEqual(outs(s.lb.passed), [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5]);
  assert.equal(s.lb.dropped.length, 0);
  assert.equal(at({ pattern: 'idle-burst' }, 7).tb.passed.length, 10, 'all of the second burst at 3.0 s');
});

test('preset no-burst: b = 1 passes one request every 0.5 s', () => {
  const s = end({ pattern: 'steady', b: 1 });
  assert.deepEqual(ids(s.tb.passed), [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17]);
  assert.deepEqual(ids(s.tb.rejected), [3, 6, 9, 12, 15, 18]);
  assert.deepEqual(s.tb.passed.map((r) => r.at / 10), [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]);
});

test('decided lists the requests decided in this step, once each', () => {
  const s1 = at({}, 1);
  assert.deepEqual(s1.tb.decided, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(s1.lb.decided, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(at({}, 2).lb.decided, [2]);
  assert.deepEqual(at({}, 2).tb.decided, []);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pattern of ['burst', 'steady', 'idle-burst']) {
    const p = P({ r: 5, b: 10, q: 1, pattern });
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ r: 1, b: 10, q: 10, pattern: 'steady' });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({ pattern: 'steady' });
  let s = logic.initial(p);
  for (let n = 1; n <= 4; n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model at its defaults');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
