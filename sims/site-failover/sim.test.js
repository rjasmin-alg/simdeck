// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for site-failover's model (rules and numbers: SPEC.md). Run: node --test sims/site-failover/
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
const user = (s, id) => s.users.find((u) => u.id === id);
const moved = (s) => Object.fromEntries(s.users.map((u) => [u.id, u.movedAt]));
/** The state right after the event with this code (and k). */
function after(over, code, k) {
  const p = P(over);
  const ev = logic.eventsOf(p);
  const n = ev.findIndex((e) => e.code === code && (k === undefined || e.k === k)) + 1;
  assert.ok(n > 0, `event ${code}${k || ''} exists`);
  return kit.stateAt(logic, p, n);
}
const windows = (over) => logic.eventsOf(P(over)).map((e, i) => [e, i + 1]).filter(([e]) => e.code === 'window')
  .map(([, n]) => at(over, n).switched);

const MANUAL = { auto: false, clockMin: 845 };
const LICENCE = { clockMin: 845, ttl: 60, threshold: 1 };
const BACK = { scenario: 'failback' };

// ── tie-breaks first (rule 8 and the window edges) ──

test('tie-break: a lookup in the same second as the change gets the old answer', () => {
  // user 6 asks again at 30 s, the second the record changes (preset 1): it holds A for a full TTL more
  const s = after({}, 'change');
  assert.equal(s.t, 30);
  assert.equal(user(s, 6).addr, 'A');
  assert.equal(user(s, 6).exp, 330);
  assert.equal(moved(last({}))[6], 330);
});

test('tie-break: users switched in one step are listed in id order, not in expiry order', () => {
  // preset 2, first window: 4 moves at 1810, 6 at 1830, 1 and 5 at 1875
  const s = after(MANUAL, 'window', 1);
  assert.deepEqual(s.switched, [1, 4, 5, 6]);
  assert.deepEqual([user(s, 4).movedAt, user(s, 6).movedAt, user(s, 1).movedAt], [1810, 1830, 1875]);
});

test('tie-break: a cache that expires exactly at a window end belongs to that window', () => {
  const w = windows({});
  assert.deepEqual(w[3], [4, 6]);          // 6 expires at 330 = Tc + ttl, the 4th window's end
  assert.deepEqual(w[1], [2, 3]);          // 2 and 3 expire at 180 = the 2nd window's end
});

test('tie-break: two users expiring in the same second both switch, lowest id first in the list', () => {
  const s = after({}, 'window', 1);
  assert.deepEqual(s.switched, [1, 5]);
  assert.equal(user(s, 1).movedAt, user(s, 5).movedAt);
});

test('tie-break: the caption\'s longest stale cache: equal time left → lowest id', () => {
  // preset 2 at the change: users 2 and 3 both hold A for another 180 s
  assert.deepEqual(logic.longestStale(after(MANUAL, 'change')), { id: 2, left: 180 });
  assert.equal(logic.longestStale(last({})), null, 'nobody stale at the end');
});

test('tie-break: remainder 0 means a full TTL (the user asked exactly at t = 0)', () => {
  assert.equal(logic.remaining(1, 60), 60);      // AGE 120 mod 60 = 0
  assert.equal(logic.remaining(1, 300), 180);
  assert.equal(logic.remaining(5, 3600), 30);
  assert.equal(at({ ttl: 60 }, 0).users[1].exp, 60);
});

// ── rule 1: a changed record reaches a user only when its cache expires; worst case TTL after the change ──

test('rule 1: after the change, users keep the old address until their cache expires', () => {
  const s = after({}, 'change');
  assert.equal(s.record.addr, 'B');
  assert.equal(s.record.changedAt, 30);
  assert.equal(s.record.ttl, 300);
  assert.equal(s.phase, 'switched');
  assert.equal(after({}, 'fail').phase, 'failed');
  assert.equal(at({}, 0).phase, 'normal');
  assert.ok(s.users.every((u) => u.addr === 'A'), 'nobody has the new answer at the change');
  const w1 = after({}, 'window', 1);
  assert.equal(user(w1, 1).addr, 'B');
  assert.equal(user(w1, 2).addr, 'A');            // its cache runs to 180
  assert.equal(logic.reaches(w1, user(w1, 2)), false);
});

test('rule 1: lookups before the change get the dead address again (asked again)', () => {
  const s = after({}, 'check', 1);                // user 4's cache expires at 10 s
  assert.deepEqual(s.renewed, [4]);
  assert.equal(user(s, 4).addr, 'A');
  assert.equal(user(s, 4).exp, 310);
  assert.equal(logic.longestStale(after({}, 'change')).id, 6);
  assert.deepEqual(logic.longestStale(after({}, 'change')), { id: 6, left: 300 });
});

test('rule 1: every user has moved by Tc + ttl, for every TTL and mode', () => {
  for (const ttl of [60, 300, 3600]) for (const auto of [true, false]) for (const threshold of [1, 3]) {
    const o = { ttl, auto, threshold };
    const s = last(o);
    const tc = logic.tcOf(P(o));
    assert.ok(s.users.every((u) => u.addr === 'B' && u.movedAt > tc && u.movedAt <= tc + ttl), JSON.stringify(o));
  }
});

// ── rule 2: automatic switch after threshold failed checks ──

test('rule 2: auto switch at interval × threshold; manual at decideMin', () => {
  assert.equal(logic.tcOf(P({})), 30);
  assert.equal(logic.tcOf(P({ checkInterval: 30 })), 90);
  assert.equal(logic.tcOf(P({ threshold: 1 })), 10);
  assert.equal(logic.tcOf(P({ auto: false })), 1800);
  assert.equal(logic.tcOf(P({ auto: false, decideMin: 45 })), 2700);
  assert.equal(after({}, 'fail').health.fails, 0, 'no check has run at the failure');
  assert.equal(after({}, 'check', 1).health.fails, 1);
  assert.deepEqual(logic.eventsOf(P({ checkInterval: 30 })).filter((e) => e.code === 'check').map((e) => e.t), [30, 60, 90]);
  assert.equal(after({ checkInterval: 30 }, 'change').t, 90);
  assert.equal(after({}, 'check', 2).record.addr, 'A');
  assert.equal(after({}, 'check', 3).health.fails, 3);
  assert.equal(after({}, 'check', 3).record.addr, 'A', 'the change is its own step');
  assert.equal(after({ auto: false }, 'change').health.fails, 3, 'with a person deciding the checks still fail');
  assert.equal(after({ threshold: 1 }, 'window', 4).health.fails, 1, 'the count stops at the threshold');
  const ev = logic.eventsOf(P({ auto: false })).map((e) => e.code);
  assert.deepEqual(ev, ['fail', 'change', 'window', 'window', 'window', 'window', 'summary']);
});

// ── rule 3: outage = detection + decision + caches ──

test('rule 3: phases stack from the failure and end at the worst case', () => {
  assert.deepEqual(logic.phasesOf(P({})), [
    { id: 'detect', from: 0, to: 30 }, { id: 'decide', from: 30, to: 30 }, { id: 'caches', from: 30, to: 330 }]);
  assert.deepEqual(logic.phasesOf(P(MANUAL)), [
    { id: 'detect', from: 0, to: 30 }, { id: 'decide', from: 30, to: 1800 }, { id: 'caches', from: 1800, to: 2100 }]);
  assert.deepEqual(logic.phasesOf(P({ auto: false, decideMin: 5, checkInterval: 30, threshold: 3 }))[0], { id: 'detect', from: 0, to: 90 });
  // a decision faster than the checks: detection ends at the change (defensive; decideMin ≥ 5 min in the page)
  assert.deepEqual(logic.phasesOf(P({ auto: false, decideMin: 1, checkInterval: 30 }))[0], { id: 'detect', from: 0, to: 60 });
  const st = logic.stats(last({}));
  assert.equal(st.last, 330);
  assert.equal(st.worst, 330);
});

// ── rule 4: sessions do not follow ──

test('rule 4: every user who moves logs in again, in both directions', () => {
  const s = last({});
  assert.ok(s.users.every((u) => u.session === 'B' && u.relogins === 1));
  assert.equal(logic.stats(s).relogins, 6);
  const w1 = after({}, 'window', 1);
  assert.equal(user(w1, 2).session, 'A');          // not moved yet: its (dead) session is still at A
  assert.equal(user(w1, 2).relogins, 0);
  assert.ok(last(BACK).users.every((u) => u.session === 'A' && u.relogins === 1));
});

// ── rule 5: data at B lags ──

test('rule 5: B serves A\'s data as of the lag; the writes in the lag are lost', () => {
  assert.equal(after({}, 'fail').sites.B.data, 'replica');
  const s = after({}, 'change');
  assert.equal(s.sites.B.data, 'current');
  assert.equal(s.lostWritesS, 5);
  assert.equal(after({ lagS: 0 }, 'change').lostWritesS, 0);
  assert.equal(after({}, 'check', 3).lostWritesS, 0);
});

// ── rule 6: a licence bound to a machine at A stays behind ──

test('rule 6: the bound licence does not work at B; it does when not bound, and again at A', () => {
  const s = last({});
  assert.equal(logic.licenceWorks(s, 'B'), false);
  assert.equal(logic.licenceWorks(s, 'A'), false, 'A is down');
  assert.equal(logic.licenceWorks(last({ licenceBound: false }), 'B'), true);
  assert.equal(logic.licenceWorks(at({}, 0), 'A'), true);
  const back = last(BACK);
  assert.equal(logic.licenceWorks(back, 'A'), true);
  assert.equal(logic.licenceWorks(at(BACK, 0), 'B'), false);
});

// ── rule 7: fail back is a second failover; copy first ──

test('rule 7: with copy back, A gets B\'s writes before the record moves; nothing lost', () => {
  const ret = after(BACK, 'return');
  assert.equal(ret.sites.B.readOnly, true, 'B is frozen when A returns, before the copy');
  assert.equal(ret.sites.A.data, 'old');
  assert.equal(logic.reaches(ret, user(ret, 1)), true, 'users on a read-only B can still read');
  const c = after(BACK, 'copy');
  assert.equal(c.sites.A.data, 'current');
  assert.equal(c.sites.B.readOnly, true);
  assert.equal(c.record.addr, 'B', 'the record moves only after the copy');
  const s = last(BACK);
  assert.equal(logic.stats(s).lostData, 0);
  assert.ok(s.users.every((u) => u.addr === 'A'));
});

test('rule 7: without copy back, every user lands on A\'s old data', () => {
  const o = { scenario: 'failback', copyBack: false };
  const c = after(o, 'copy');
  assert.equal(c.sites.A.data, 'old');
  assert.equal(c.sites.B.readOnly, false);
  assert.equal(after(o, 'return').sites.B.readOnly, false);
  assert.deepEqual(logic.phasesOf(P(o)), [{ id: 'nocopy', from: 0, to: 60 }, { id: 'caches', from: 60, to: 360 }]);
  assert.deepEqual(logic.phasesOf(P(BACK)), [{ id: 'copy', from: 0, to: 60 }, { id: 'caches', from: 60, to: 360 }]);
  const s = last(o);
  assert.equal(logic.stats(s).lostData, 6);
  assert.equal(logic.steps(P(o)), logic.steps(P(BACK)), 'the two runs line up step by step');
});

test('rule 7: failback starts with everyone on B and A down; A returns with old data', () => {
  const s0 = at(BACK, 0);
  assert.ok(s0.users.every((u) => u.addr === 'B' && u.session === 'B'));
  assert.equal(s0.sites.A.up, false);
  assert.equal(s0.sites.A.data, 'none');
  assert.equal(s0.phase, 'switched');
  assert.equal(s0.record.addr, 'B');
  const r = after(BACK, 'return');
  assert.equal(r.sites.A.up, true);
  assert.equal(r.sites.A.data, 'old');
  assert.equal(r.record.addr, 'B');
});

// ── presets (SPEC.md table) ──

test('preset 1 auto-failover: change at 30 s, all on B by 330 s, windows [1,5] [2,3] [] [4,6]', () => {
  assert.equal(logic.steps(P({})), 10);
  assert.deepEqual(moved(last({})), { 1: 75, 2: 180, 3: 180, 4: 310, 5: 75, 6: 330 });
  assert.deepEqual(windows({}), [[1, 5], [2, 3], [], [4, 6]]);
  assert.equal(user(after({}, 'change'), 4).exp - 30, 280);
});

test('preset 2 manual-dns: switched at 14:35 (1800 s), last at 14:38, worst case 14:40', () => {
  assert.equal(logic.steps(P(MANUAL)), 7);
  assert.equal(after(MANUAL, 'change').t, 1800);
  assert.deepEqual(moved(last(MANUAL)), { 1: 1875, 2: 1980, 3: 1980, 4: 1810, 5: 1875, 6: 1830 });
  const st = logic.stats(last(MANUAL));
  assert.equal(st.last, 1980);
  assert.equal(st.worst, 2100);
  assert.deepEqual(windows(MANUAL), [[1, 4, 5, 6], [], [2, 3], []]);
});

test('preset 3 long-ttl: some users hold the dead address 1 h after the change', () => {
  const o = { ttl: 3600 };
  assert.equal(logic.steps(P(o)), 10);
  assert.deepEqual(moved(last(o)), { 1: 3075, 2: 3480, 3: 3480, 4: 2110, 5: 3075, 6: 3630 });
  assert.deepEqual(windows(o), [[], [], [4], [1, 2, 3, 5, 6]]);
  assert.equal(logic.stats(last(o)).last - 30, 3600);
});

test('preset 4 licence-stays: everyone on B in 70 s, the licensed work stops there', () => {
  assert.equal(logic.steps(P(LICENCE)), 8);
  assert.deepEqual(moved(last(LICENCE)), { 1: 15, 2: 60, 3: 60, 4: 70, 5: 15, 6: 30 });
  assert.deepEqual(windows(LICENCE), [[1, 5], [6], [], [2, 3, 4]]);
  assert.equal(logic.licenceWorks(last(LICENCE), 'B'), false);
  assert.equal(logic.REHOST_DAYS, 5);
});

test('preset 5 failback: change at 60 s after the copy, back on A by 330 s (worst 360)', () => {
  assert.equal(logic.steps(P(BACK)), 8);
  assert.deepEqual(moved(last(BACK)), { 1: 75, 2: 180, 3: 180, 4: 310, 5: 75, 6: 330 });
  assert.deepEqual(windows(BACK), [[1, 5], [2, 3], [], [4, 6]]);
  assert.equal(logic.stats(last(BACK)).worst, 360);
});

test('step counts: failover 1 + checks + 1 + 4 + 1; failback 8; at most 20', () => {
  assert.equal(logic.steps(P({ threshold: 1 })), 8);
  assert.equal(logic.steps(P({ auto: false, threshold: 3 })), 7);
  for (const scenario of ['failover', 'failback']) for (const auto of [true, false]) for (const threshold of [1, 3]) {
    assert.ok(logic.steps(P({ scenario, auto, threshold })) <= 20);
  }
});

// ── generic checks every sim keeps ──

const VARIANTS = [{}, MANUAL, { ttl: 3600 }, LICENCE, BACK, { scenario: 'failback', copyBack: false, ttl: 60 },
  { auto: false, decideMin: 120, ttl: 60 }];

test('state is JSON-safe at every step', () => {
  for (const o of VARIANTS) {
    for (let n = 0; n <= logic.steps(P(o)); n++) {
      const s = at(o, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of VARIANTS) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('time never goes back, and the summary keeps the last window\'s time', () => {
  for (const o of VARIANTS) {
    let t = 0;
    const N = logic.steps(P(o));
    for (let n = 1; n <= N; n++) { const s = at(o, n); assert.ok(s.t >= t); t = s.t; }
    assert.equal(at(o, N).t, at(o, N - 1).t);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model; meta steps = the default run', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, logic.steps(P({})));
});
