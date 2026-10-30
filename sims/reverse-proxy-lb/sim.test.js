// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for reverse-proxy-lb's model (rules in SPEC.md). Run: node --test sims/reverse-proxy-lb/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const S = (over) => logic.initial(P(over));
const pre = (id) => S(logic.presets.find((x) => x.id === id).params);
const backends = (st) => st.assignments.map((r) => r.backend);
const statuses = (st) => st.assignments.map((r) => r.status);
const reqsOf = (st, b) => st.assignments.filter((r) => r.backend === b).map((r) => r.req);
const counts = (st) => st.perBackend.map((b) => b.count);
const req = (st, k) => st.assignments[k - 1];

// ── tie-breaks first ──

test('tie-break 1 (rule 3): least connections, equal open counts → the lowest number', () => {
  const st = S({ algo: 'lc' });
  assert.equal(req(st, 1).backend, 1, 'all idle: b1');
  assert.equal(req(st, 2).backend, 2, 'b2 and b3 idle: b2');
  assert.equal(req(st, 4).backend, 2, 'b1 busy, b2 and b3 idle again at 4 s: b2');
});

test('tie-break 2 (rule 8a): a response ending at t frees its connection before the request at t is assigned', () => {
  // r1 holds b1 from 1 to 3 s; r3 arrives at 3 s. Freed first, b1 has 0 open and wins the tie; otherwise b3.
  const st = S({ algo: 'lc' });
  assert.deepEqual([req(st, 1).end, req(st, 3).t], [3, 3]);
  assert.equal(req(st, 3).backend, 1);
  // the same instant also delivers a cookie: c1's r1 ends at 3 s and r4 at 4 s already carries it
  assert.equal(req(S({ algo: 'sticky' }), 4).cookie, 1);
});

test('tie-break 3 (rule 8b): b2 failing at t already hits the request at t; a response ending at t still arrives', () => {
  assert.equal(req(S({ failAt: 5 }), 5).status, 502, 'r5 at 5 s, failure at 5 s');
  assert.deepEqual([req(S({ failAt: 7 }), 5).status, req(S({ failAt: 7 }), 5).end], [200, 7], 'r5 ends at 7 s, failure at 7 s');
  assert.deepEqual([req(S({ failAt: 6 }), 5).status, req(S({ failAt: 6 }), 5).end], [502, 6], 'r5 still out at 6 s: cut');
  const sticky = pre('sticky');
  assert.deepEqual([req(sticky, 2).end, req(sticky, 2).status], [4, 200], 'r2 ends at 4 s, b2 fails at 4 s: completes');
});

test('tie-break 4 (rule 8d): a backend marked down at t still gets the request at t', () => {
  const st = pre('health-check');
  assert.equal(logic.downAt(st, 2), 8);
  assert.deepEqual([req(st, 8).t, req(st, 8).backend, req(st, 8).status], [8, 2, 502]);
});

test('tie-break 5 (rules 2, 5): round robin goes on after the backend it chose last; sticky picks do not move it', () => {
  const st = pre('health-check');
  assert.equal(req(st, 9).backend, 3, 'after r8 on b2 (now down) comes b3');
  // sticky: only r1–r3 were round-robin picks (b1, b2, b3); r8 loses its cookie and round robin goes on with b1
  assert.equal(req(pre('sticky'), 8).backend, 1);
});

test('tie-break 6 (rule 5): two responses arriving at once set the cookie in request order, the later wins', () => {
  // slow b2: c2's r2 (b2) is still out when r5 leaves, so r5 has no cookie and round robin picks b1; r2 and r5 both
  // return at 7 s, and r8 carries the cookie of r5, the later one
  const st = S({ algo: 'sticky', slowB2: true });
  assert.deepEqual([req(st, 2).end, req(st, 5).end], [7, 7]);
  assert.deepEqual([req(st, 5).cookie, req(st, 5).backend], [null, 1]);
  assert.deepEqual([req(st, 8).cookie, req(st, 8).backend, req(st, 8).moved], [1, 1, false]);
});

test('tie-break 7: changed lists requests whose backend or status moved; nothing without a previous state', () => {
  const a = S({}), b = pre('health-check');
  assert.deepEqual(logic.changed(null, a), []);
  assert.deepEqual(logic.changed(a, S({})), []);
  assert.deepEqual(logic.changed(a, b), [5, 8]);
  assert.deepEqual(logic.changed(a, S({ backends: 2 })), [3, 4, 5, 6, 9]);
});

// ── rules ──

test('rule 1: the fixed trace: rk at k s from c1, c2, c3 in turn; the client only ever meets the proxy', () => {
  const st = S({});
  assert.deepEqual(st.assignments.map((r) => [r.req, r.t, r.client]),
    [[1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 1], [5, 5, 2], [6, 6, 3], [7, 7, 1], [8, 8, 2], [9, 9, 3]]);
  // every answer the client gets is one of the proxy's three: the backend's own (200) or the proxy's 502 / 504
  for (const p of logic.presets) for (const r of S(p.params).assignments) assert.ok([200, 502, 504].includes(r.status));
});

test('rule 2: round robin takes the backends in order and skips the ones marked down', () => {
  assert.deepEqual(backends(S({})), [1, 2, 3, 1, 2, 3, 1, 2, 3]);
  assert.deepEqual(backends(S({ backends: 2 })), [1, 2, 1, 2, 1, 2, 1, 2, 1]);
  assert.deepEqual(backends(S({ backends: 4 })), [1, 2, 3, 4, 1, 2, 3, 4, 1]);
  // b2 marked down at 2 s (checks every 1 s, down after 1), back up at 7 s (failed 2–5 s, two passes at 6 and 7 s)
  const st = S({ failAt: 2, failFor: 4, inter: 1, fall: 1, rise: 2 });
  assert.deepEqual(backends(st), [1, 2, 3, 1, 3, 1, 3, 1, 2]);
  assert.deepEqual(st.perBackend[1].down, [[2, 7]]);
});

test('rule 3: least connections sends work away from a slow backend; round robin does not', () => {
  const lc = pre('least-conn-slow');
  assert.deepEqual(reqsOf(lc, 1), [1, 3, 5, 7, 9]);
  assert.deepEqual(reqsOf(lc, 2), [2, 8]);
  assert.deepEqual(reqsOf(lc, 3), [4, 6]);
  const rr = S({ slowB2: true });
  assert.deepEqual(counts(rr), [3, 3, 3]);
  assert.equal(rr.perBackend[1].maxOpen, 2, 'round robin piles two slow requests on b2');
  assert.equal(lc.perBackend[1].maxOpen, 1);
  // a request ending as the next one starts is not open at the same time (rule 8a)
  assert.deepEqual(S({ backends: 2 }).perBackend.map((b) => b.maxOpen), [1, 1]);
  // all equally fast: two backends keep up with one request a second, and ties go low, so b3 is never needed
  assert.deepEqual(counts(S({ algo: 'lc' })), [5, 4, 0]);
});

test('rule 4: source hash: hash mod the number of backends up; one fewer remaps two of three clients', () => {
  assert.deepEqual(logic.HASH, [42, 37, 44]);
  const first = (st) => st.assignments.slice(0, 3).map((r) => r.backend);
  assert.deepEqual(first(S({ algo: 'hash' })), [1, 2, 3], '42, 37, 44 mod 3');
  assert.deepEqual(first(S({ algo: 'hash', backends: 4 })), [3, 2, 1], 'mod 4');
  assert.deepEqual(first(S({ algo: 'hash', backends: 2 })), [1, 2, 1], 'mod 2 over b1, b2');
  // a client always lands on the same backend while the list stays the same
  const st = S({ algo: 'hash' });
  for (const r of st.assignments) assert.equal(r.backend, r.client);
  assert.ok(st.assignments.every((r) => !r.moved));
  // b2 marked down: mod 2 over b1, b3
  const rm = pre('hash-remap');
  assert.deepEqual(backends(rm), [1, 2, 3, 1, 3, 1, 1, 3, 1]);
  assert.deepEqual(rm.assignments.filter((r) => r.moved).map((r) => [r.req, r.client]), [[5, 2], [6, 3]]);
  assert.ok(statuses(rm).every((s) => s === 200), 'b2 was down before c2 came back');
  // four backends, b2 down: mod 3 over b1, b3, b4 (the modulus is the number up, not the number configured)
  const four = S({ algo: 'hash', backends: 4, failAt: 1, inter: 1, fall: 1 });
  assert.deepEqual(backends(four).slice(3, 6), [1, 3, 4]);
});

test('rule 5: a sticky cookie pins a client to its first backend while that backend is marked up', () => {
  const st = S({ algo: 'sticky' });
  assert.deepEqual(backends(st), [1, 2, 3, 1, 2, 3, 1, 2, 3]);
  assert.deepEqual(st.assignments.map((r) => r.cookie), [null, null, null, 1, 2, 3, 1, 2, 3]);
  // with four backends b4 never gets anyone: every client already has a cookie when it comes back
  assert.deepEqual(counts(S({ algo: 'sticky', backends: 4 })), [3, 3, 3, 0]);
  // the cookie's backend failed but is not marked down yet: the request follows the cookie into the 502
  const sk = pre('sticky');
  assert.deepEqual([req(sk, 5).cookie, req(sk, 5).backend, req(sk, 5).status], [2, 2, 502]);
  // marked down: round robin picks again, and the client loses its session
  assert.deepEqual([req(sk, 8).cookie, req(sk, 8).backend, req(sk, 8).moved], [2, 1, true]);
  // only a successful response sets a cookie: r2's 504 (at 8 s) leaves c2 without one, so r8 goes by round robin
  const hung = S({ algo: 'sticky', failAt: 2, failMode: 'hang', failFor: 4 });
  assert.deepEqual([req(hung, 2).status, req(hung, 8).cookie, req(hung, 8).backend], [504, 1, 1]);
  assert.deepEqual(sk.assignments.filter((r) => r.moved).map((r) => r.req), [8]);
  // no moves are reported for round robin or least connections
  assert.ok(pre('health-check').assignments.every((r) => !r.moved));
});

test('rule 6: refused → 502 at once; no answer → 504 after the proxy waits 6 s; requests in flight too', () => {
  const ref = pre('health-check');
  assert.deepEqual([req(ref, 5).status, req(ref, 5).end], [502, 5]);
  const hang = S({ failAt: 4, failMode: 'hang' });
  assert.deepEqual([req(hang, 5).status, req(hang, 5).end], [504, 11]);
  assert.deepEqual([req(hang, 8).status, req(hang, 8).end], [504, 14]);
  assert.equal(hang.perBackend[1].maxOpen, 2, 'a hung backend holds connections open');
  assert.equal(ref.perBackend[1].maxOpen, 1, 'a refused request is never open');
  // in flight when b2 fails: slow r2 (2–7 s) is cut at 4 s (502), or waits out the timeout (504 at 8 s)
  assert.deepEqual([req(S({ slowB2: true, failAt: 4 }), 2).status, req(S({ slowB2: true, failAt: 4 }), 2).end], [502, 4]);
  assert.deepEqual(S({ slowB2: true, failAt: 4 }).assignments.map((r) => r.cut), [false, true, false, false, false, false, false, false, false]);
  assert.ok(ref.assignments.every((r) => !r.cut), 'r5 and r8 were sent to b2 after it failed, not cut');
  const hs = S({ slowB2: true, failAt: 4, failMode: 'hang' });
  assert.deepEqual([req(hs, 2).status, req(hs, 2).end], [504, 8]);
  // a slow answer (5 s) is still an answer: the timeout is longer
  assert.ok(logic.TIMEOUT > logic.SLOW);
  assert.ok(statuses(S({ slowB2: true })).every((s) => s === 200));
});

test('rule 6: least connections avoids a hung backend once it holds a connection', () => {
  const st = S({ algo: 'lc', failAt: 4, failMode: 'hang' });
  assert.deepEqual([req(st, 4).backend, req(st, 4).status], [2, 504]);
  assert.deepEqual(reqsOf(st, 2), [2, 4], 'r4 hangs on b2 until 10 s; nothing else goes there');
  // a refusing b2 holds nothing open, so only being marked down keeps least connections away from it
  assert.deepEqual(reqsOf(S({ algo: 'lc', failAt: 2, inter: 1, fall: 1 }), 2), [2]);
});

test('rule 7: checks every inter s from 0; down after fall failures in a row, up after rise passes; slowness passes', () => {
  const st = pre('health-check');
  const b2 = st.healthLog.filter((h) => h.backend === 2);
  assert.deepEqual(b2.map((h) => h.t), [0, 2, 4, 6, 8, 10, 12, 14]);
  assert.deepEqual(b2.map((h) => h.pass), [true, true, false, false, false, false, false, false]);
  assert.deepEqual(b2.filter((h) => h.mark).map((h) => [h.t, h.mark]), [[8, 'down']]);
  assert.equal(st.perBackend[1].up, false);
  assert.deepEqual(st.perBackend.map((b) => b.up), [true, false, true]);
  // fall 1: down at the first failed check; fall 5 at 2 s apart: not before the end of the trace's requests
  assert.equal(logic.downAt(S({ failAt: 4, fall: 1 }), 2), 4);
  assert.equal(logic.downAt(S({ failAt: 4, inter: 1, fall: 5 }), 2), 8);
  assert.equal(logic.downAt(S({ failAt: 4, inter: 3 }), 2), 12, 'checks at 6, 9, 12 s');
  // rise: back up at the rise-th pass in a row after recovery
  assert.deepEqual(S({ failAt: 2, failFor: 4, inter: 1, fall: 1, rise: 3 }).perBackend[1].down, [[2, 8]]);
  assert.deepEqual(S({ failAt: 1, failFor: 2, inter: 2, fall: 1, rise: 1 }).perBackend[1].down, [[2, 4]]);
  // a slow backend passes its checks
  assert.ok(S({ slowB2: true }).healthLog.every((h) => h.pass));
  // a hung backend fails them like a refusing one
  assert.equal(logic.downAt(S({ failAt: 4, failMode: 'hang' }), 2), 8);
});

test('rule 7: until it is marked down a failed backend still gets its share of the traffic', () => {
  const st = pre('health-check');
  assert.deepEqual(reqsOf(st, 2), [2, 5, 8]);
  assert.deepEqual(st.assignments.filter((r) => r.status !== 200).map((r) => r.req), [5, 8]);
  assert.ok(st.assignments.filter((r) => r.t > 8).every((r) => r.backend !== 2), 'after 8 s only b1 and b3');
});

test('only b2 fails, from failAt for failFor seconds (0 = for good)', () => {
  const p = P({ failAt: 3, failFor: 2 });
  assert.deepEqual([2, 3, 4, 5, 6].map((t) => logic.failed(p, 2, t)), [false, true, true, false, false]);
  assert.ok([1, 3, 4].every((b) => [3, 4, 9].every((t) => !logic.failed(p, b, t))));
  assert.ok(logic.failed(P({ failAt: 3 }), 2, 15));
  assert.ok(!logic.failed(P({}), 2, 5));
});

test('presets: the numbers of SPEC.md', () => {
  let st = pre('round-robin');
  assert.deepEqual([reqsOf(st, 1), reqsOf(st, 2), reqsOf(st, 3)], [[1, 4, 7], [2, 5, 8], [3, 6, 9]]);
  st = pre('least-conn-slow');
  assert.deepEqual(counts(st), [5, 2, 2]);
  assert.deepEqual(counts(S({ slowB2: true })), [3, 3, 3]);
  st = pre('hash-remap');
  assert.equal(logic.downAt(st, 2), 4);
  assert.deepEqual(counts(st), [5, 1, 3]);
  st = pre('health-check');
  assert.deepEqual(counts(st), [3, 3, 3]);
  assert.deepEqual(st.perBackend.map((b) => b.errors), [0, 2, 0]);
  st = pre('sticky');
  assert.equal(logic.downAt(st, 2), 6);
  assert.deepEqual(backends(st), [1, 2, 3, 1, 2, 3, 1, 1, 3]);
  assert.deepEqual(counts(st), [4, 2, 3]);
});

test('captions: the sentences follow the params', () => {
  const k = (over) => logic.captionKeys(P(over));
  assert.deepEqual(k({}), ['capRR']);
  assert.deepEqual(k({ slowB2: true }), ['capRRSlow']);
  assert.deepEqual(k({ algo: 'lc' }), ['capLC']);
  assert.deepEqual(k({ algo: 'lc', slowB2: true }), ['capLCSlow']);
  assert.deepEqual(k({ algo: 'hash' }), ['capHash']);
  assert.deepEqual(k({ algo: 'sticky' }), ['capSticky']);
  assert.deepEqual(k({ algo: 'hash', failAt: 4, inter: 1, fall: 1 }), ['capMovedHash']);
  assert.deepEqual(k({ failAt: 4 }), ['capFault502']);
  assert.deepEqual(k({ failAt: 4, failMode: 'hang' }), ['capFault504']);
  assert.deepEqual(k({ algo: 'sticky', failAt: 4, fall: 2 }), ['capFault502', 'capMovedSticky']);
  assert.deepEqual(k({ failAt: 9, inter: 1, fall: 1 }), ['capFault502'], 'r8 (8–10 s) is still out on b2 at 9 s');
  assert.deepEqual(k({ failAt: 4, inter: 1, fall: 1 }), ['capFaultClean'], 'down at 4 s, before r5 would reach it');
  // least connections with a slow b2 but four backends: round robin gives b2 two as well
  assert.deepEqual(k({ algo: 'lc', slowB2: true, backends: 4 }), ['capLCSlowEven']);
  // sticky with a slow b2: c2's r5 leaves before r2's response and cookie are back
  assert.deepEqual(k({ algo: 'sticky', slowB2: true }), ['capStickyRace']);
  assert.deepEqual(logic.raced(S({ algo: 'sticky', slowB2: true })), { req: 5, prev: 2 });
  assert.equal(logic.raced(S({ algo: 'sticky' })), null);
});

test('lanes: overlapping requests on one backend stack; a refused one takes its second', () => {
  assert.deepEqual(logic.lanes(S({ slowB2: true }), 2), { lanes: 2, of: { 2: 0, 5: 1, 8: 0 } });
  assert.deepEqual(logic.lanes(S({}), 1), { lanes: 1, of: { 1: 0, 4: 0, 7: 0 } });
  assert.deepEqual(logic.lanes(S({ backends: 4, algo: 'sticky' }), 4), { lanes: 1, of: {} });
});

test('params: the ranges and defaults of SPEC.md', () => {
  assert.deepEqual(logic.defaults, { algo: 'rr', backends: 3, slowB2: false, failAt: 0, failMode: 'refuse', failFor: 0, inter: 2, fall: 3, rise: 2 });
  assert.deepEqual(logic.ALGOS, ['rr', 'lc', 'hash', 'sticky']);
  assert.deepEqual(logic.FAIL_MODES, ['refuse', 'hang']);
  assert.deepEqual([logic.B_MIN, logic.B_MAX, logic.SERVICE, logic.SLOW, logic.TIMEOUT, logic.END], [2, 4, 2, 5, 6, 15]);
});

test('every preset value is one the page\'s controls can show', () => {
  for (const p of logic.presets) {
    const q = P(p.params);
    assert.ok(logic.ALGOS.includes(q.algo), p.id);
    assert.ok(Number.isInteger(q.backends) && q.backends >= 2 && q.backends <= 4, p.id);
    assert.ok(Number.isInteger(q.failAt) && q.failAt >= 0 && q.failAt <= 9, p.id);
    assert.ok(logic.FAIL_MODES.includes(q.failMode), p.id);
    assert.ok(Number.isInteger(q.failFor) && q.failFor >= 0 && q.failFor <= 8, p.id);
    for (const key of ['inter', 'fall', 'rise']) assert.ok(Number.isInteger(q[key]) && q[key] >= 1 && q[key] <= 5, `${p.id} ${key}`);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = logic.initial(P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ algo: 'sticky', failAt: 4, failMode: 'hang', slowB2: true });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables; sim.json entries name real presets', () => {
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    for (const key of ['capRR', 'capRRSlow', 'capLC', 'capLCSlow', 'capLCSlowEven', 'capHash', 'capSticky', 'capStickyRace',
      'capMovedHash', 'capMovedSticky', 'capFaultClean', 'faultHead502', 'faultHead504', 'faultSent502', 'faultSent504',
      'faultCut502', 'faultCut504', 'faultTail']) assert.ok(strings[lang][key], `${lang} ${key}`);
  }
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sim.entries) assert.ok(logic.presets.some((p) => p.id === e.preset), e.preset);
});
