// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-account-lockout's model (rules and numbers: SPEC.md). Run: node --test sims/win-account-lockout/
// Tie-breaks first, then the rules, then the presets' numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const run = (over) => { const p = P(over); const out = []; for (let n = 1; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n)); return out; };
const counts = (s) => [s.dcs.DC02.bad, s.dcs.DC01.bad];

// ── tie-breaks ──

test('T1 same minute: PC-A before PC-B, a tick first', () => {
  const ev = logic.events(P({ scenario: 'two-pcs' }));
  // the script lists PC-B's t = 2 attempt before PC-A's
  assert.deepEqual(ev.map((e) => e.t + ' ' + e.client), ['0 PC-A', '1 PC-A', '2 PC-A', '2 PC-B', '3 PC-B', '4 PC-A']);
  const st = logic.events(P({ scenario: 'stale-phone' }));
  assert.deepEqual(st.slice(0, 2).map((e) => e.kind), ['change', 'retry'], 'the change at t = 0 comes before the phone');
  const rw = logic.events(P({ scenario: 'reset-window' }));
  assert.equal(rw[4].kind, 'tick');
  assert.equal(rw[5].t, 34, 'the tick precedes the attempt of the same minute');
});

test('T1 the order changes the outcome: the change first means the phone sends a stale password at t = 0', () => {
  const s = at({ scenario: 'stale-phone', historyCheck: false }, 2);
  assert.equal(s.last.client, 'phone');
  assert.equal(s.last.result, 'bad');
});

test('T2 reset boundary: t − lastBad = resetMin resets before counting', () => {
  // reset-window: last bad at t = 3, tick at 34; resetMin 31 → 34 − 3 = 31 resets, 32 does not
  assert.deepEqual(counts(at({ scenario: 'reset-window', resetMin: 31, durationMin: 60 }, 5)), [0, 0]);
  assert.deepEqual(at({ scenario: 'reset-window', resetMin: 31, durationMin: 60 }, 5).last.reset, ['DC01', 'DC02']);
  assert.deepEqual(counts(at({ scenario: 'reset-window', resetMin: 32, durationMin: 60 }, 5)), [4, 4]);
  // stale-phone, retryMin 10 = resetMin 10: every retry finds the count reset
  const rows = run({ scenario: 'stale-phone', historyCheck: false, retryMin: 10, resetMin: 10 });
  assert.deepEqual(rows.slice(1, 6).map((s) => s.dcs.DC01.bad), [1, 1, 1, 1, 1]);
});

test('T3 unlock boundary: t = since + durationMin is unlocked', () => {
  // stale-phone, retryMin 1: locked at t = 4, PC-A at t = 9; duration 5 unlocks exactly at 9, 6 does not
  const ok = at({ scenario: 'stale-phone', historyCheck: false, retryMin: 1, durationMin: 5, resetMin: 5 }, 7);
  assert.equal(ok.last.unlocked, true);
  assert.equal(ok.last.result, 'ok');
  assert.equal(ok.dcs.DC01.lockoutTime, null, 'the lockout ends on every DC');
  assert.equal(ok.dcs.DC02.lockoutTime, null);
  assert.deepEqual(ok.last.reset, ['DC01', 'DC02'], 'the counts end by rule 4, not by the unlock');
  const no = at({ scenario: 'stale-phone', historyCheck: false, retryMin: 1, durationMin: 6, resetMin: 5 }, 7);
  assert.equal(no.last.result, 'locked');
});

test('T4 the PDC first: when both reach the threshold in one step the lockout is DC01\'s', () => {
  const s = at({ scenario: 'one-pc' }, 5);
  assert.deepEqual(counts(s), [5, 5]);
  assert.deepEqual(s.locked, { since: 4, by: 'DC01' });
  // DC02 can lock on its own when only it reaches the threshold: PC-B's success at the PDC zeroes DC01 alone
  const p = P({ threshold: 2 });
  const st = logic.initial(p);
  st.dcs.DC02.bad = 1; st.dcs.DC02.lastBad = 0;
  const one = logic.step(st, 1, p); // one-pc step 1: PC-A typo at DC02 → DC02 2, DC01 1
  assert.equal(one.locked.by, 'DC02');
});

test('T5 only the last two old passwords are spared', () => {
  const p = P({ scenario: 'old-password' });
  const s0 = logic.initial(p);
  s0.pwd.history = ['P1', 'P0', 'Px'];
  // replace the attempt's password: run step 1 of a copy with history[2] typed
  const s = JSON.parse(JSON.stringify(s0));
  s.pwd.history = ['P8', 'P9', 'P1']; // P1 now third
  assert.equal(logic.step(s, 1, p).last.result, 'bad');
  s.pwd.history = ['P8', 'P1', 'P9']; // second
  assert.equal(logic.step(s, 1, p).last.result, 'old');
  assert.equal(logic.step(s0, 1, p).last.result, 'old');
});

test('T6 success clears the count, the PDC\'s too, but not a lockout', () => {
  const ok = at({ scenario: 'two-pcs', threshold: 6 }, 6);
  assert.equal(ok.last.result, 'ok');
  assert.equal(ok.last.pdcReset, true);
  assert.deepEqual(counts(ok), [0, 0]);
  const locked = at({ scenario: 'two-pcs' }, 6);
  assert.equal(locked.last.result, 'locked', 'the right password is refused while locked');
  assert.deepEqual(counts(locked), [3, 5]);
});

// ── rules ──

test('rule 1: counts are per DC and differ', () => {
  assert.deepEqual(counts(at({ scenario: 'two-pcs' }, 5)), [3, 5]);
});

test('rule 2: an attempt at DC02 is chained and counted at both; one at the PDC is counted once', () => {
  const a = at({ scenario: 'two-pcs' }, 1);
  assert.equal(a.last.chained, true);
  assert.deepEqual(a.last.counted, ['DC01', 'DC02']);
  const b = at({ scenario: 'two-pcs' }, 4);
  assert.equal(b.last.client, 'PC-B');
  assert.equal(b.last.chained, false);
  assert.deepEqual(b.last.counted, ['DC01']);
  assert.deepEqual(counts(b), [3, 4]);
});

test('rule 3: the threshold locks, lockoutTime on every DC; threshold 0 never locks', () => {
  const s = at({ scenario: 'two-pcs' }, 5);
  assert.deepEqual(s.locked, { since: 3, by: 'DC01' });
  assert.equal(s.dcs.DC02.lockoutTime, 3, 'replicated urgently to DC02 although its own count is 3');
  assert.equal(s.dcs.DC01.lockoutTime, 3);
  assert.equal(s.last.lockedBy, 'DC01');
  assert.equal(at({ scenario: 'two-pcs' }, 4).locked, null);
  const zero = run({ scenario: 'one-pc', threshold: 0 });
  assert.ok(zero.every((x) => x.locked === null));
  assert.deepEqual(counts(zero[4]), [5, 5], 'counts still rise');
  assert.equal(zero[5].last.result, 'ok');
});

test('rule 4: no bad attempt for resetMin resets the count; success resets it', () => {
  const rows = run({ scenario: 'reset-window' });
  assert.deepEqual(rows.map((s) => s.dcs.DC01.bad), [1, 2, 3, 4, 0, 1, 2, 3, 4]);
  assert.ok(rows.every((s) => s.locked === null));
  assert.deepEqual(rows[4].last.reset, ['DC01', 'DC02']);
  assert.deepEqual(rows[5].last.reset, [], 'a count already 0 is not reset again');
  assert.deepEqual(counts(at({ scenario: 'old-password', historyCheck: false, threshold: 7 }, 7)), [0, 0]);
});

test('rule 4: reset is clamped to the duration (policy constraint)', () => {
  assert.equal(logic.resetOf(P({ resetMin: 30, durationMin: 3 })), 3);
  assert.equal(logic.resetOf(P({ resetMin: 30, durationMin: 0 })), 30);
  const rows = run({ scenario: 'stale-phone', historyCheck: false, durationMin: 3, resetMin: 30 });
  assert.ok(rows.every((s) => s.locked === null), 'every retry finds the count reset');
});

test('rule 5: locked refuses the right password, neither counted nor chained; duration 0 never unlocks', () => {
  const s = at({ scenario: 'one-pc' }, 6);
  assert.equal(s.last.result, 'locked');
  assert.equal(s.last.chained, false);
  assert.deepEqual(s.last.counted, []);
  const rows = run({ scenario: 'reset-window', resetMin: 32, durationMin: 60 });
  assert.deepEqual(rows.slice(5).map((x) => x.last.result), ['bad', 'locked', 'locked', 'locked']);
  assert.ok(rows.slice(5).every((x) => x.dcs.DC01.bad === 5), 'not counted while locked');
  const forever = at({ scenario: 'stale-phone', historyCheck: false, retryMin: 30, resetMin: 60, durationMin: 0, threshold: 2 }, 7);
  assert.equal(forever.t, 125);
  assert.equal(forever.last.result, 'locked');
});

test('rule 6: the previous password is refused but not counted; off, it counts', () => {
  const rows = run({ scenario: 'old-password' });
  assert.deepEqual(rows.map((s) => s.last.result), ['old', 'old', 'old', 'old', 'old', 'old', 'ok']);
  assert.ok(rows.every((s) => s.dcs.DC01.bad === 0 && s.dcs.DC02.bad === 0));
  assert.equal(rows[0].last.chained, true, 'still chained to the PDC');
  assert.equal(rows[6].last.pdcReset, false, 'no reset sent to a PDC whose count is 0');
  const off = run({ scenario: 'old-password', historyCheck: false });
  assert.deepEqual(off.map((s) => s.last.result), ['bad', 'bad', 'bad', 'bad', 'bad', 'locked', 'locked']);
  assert.equal(off[4].locked.since, 4);
});

test('rule 7: the stale session retries every retryMin minutes', () => {
  assert.deepEqual(logic.events(P({ scenario: 'stale-phone' })).map((e) => e.t), [0, 0, 10, 20, 30, 40, 45]);
  assert.deepEqual(logic.events(P({ scenario: 'stale-phone', retryMin: 3 })).map((e) => e.t), [0, 0, 3, 6, 9, 12, 17]);
  const rows = run({ scenario: 'stale-phone', historyCheck: false });
  assert.deepEqual(rows.slice(1, 6).map((s) => s.last.typed), ['P2', 'P2', 'P2', 'P2', 'P2']);
  assert.deepEqual(rows.map((s) => s.dcs.DC01.bad), [0, 1, 2, 3, 4, 5, 5]);
  assert.equal(rows[5].locked.since, 40);
  assert.equal(rows[6].t, 45);
  assert.equal(rows[6].last.result, 'locked');
});

test('rule 8: the password change moves the old one into history', () => {
  const s = at({ scenario: 'stale-phone' }, 1);
  assert.deepEqual(s.pwd, { current: 'P3', history: ['P2', 'P1', 'P0'] });
  assert.equal(s.last.result, 'changed');
  assert.deepEqual(counts(s), [0, 0]);
  // with the check on, the phone's P2 is N-1: never counted, PC-A logs on at t = 45
  const on = run({ scenario: 'stale-phone' });
  assert.deepEqual(on.map((x) => x.last.result), ['changed', 'old', 'old', 'old', 'old', 'old', 'ok']);
});

// ── the presets' numbers (SPEC "Events per scenario") ──

test('steps per scenario: 6 / 6 / 7 / 7 / 9', () => {
  assert.deepEqual(logic.SCENARIOS.map((sc) => logic.steps(P({ scenario: sc }))), [6, 6, 7, 7, 9]);
  for (const r of [1, 10, 30]) assert.equal(logic.steps(P({ scenario: 'stale-phone', retryMin: r })), 7);
});

test('one-pc: 1…5 at both, locked at attempt 5, the right password refused', () => {
  const rows = run({ scenario: 'one-pc' });
  assert.deepEqual(rows.map(counts), [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [5, 5]]);
  assert.equal(rows[3].locked, null);
  assert.equal(rows[4].locked.since, 4);
  assert.equal(rows[5].last.result, 'locked');
});

test('log: one entry per step with the counts after it', () => {
  const s = at({ scenario: 'two-pcs' }, 6);
  assert.equal(s.log.length, 6);
  assert.deepEqual(s.log.map((x) => [x.DC02, x.DC01, x.locked]), [[1, 1, false], [2, 2, false], [3, 3, false], [3, 4, false], [3, 5, true], [3, 5, true]]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const sc of logic.SCENARIOS) {
    const p = P({ scenario: sc });
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const sc of logic.SCENARIOS) {
    const p = P({ scenario: sc, historyCheck: false });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scenario: 'two-pcs' });
  const s4 = kit.stateAt(logic, p, 4);
  const copy = structuredClone(s4);
  logic.step(s4, 5, p);
  assert.deepEqual(s4, copy);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const scen = [...html.matchAll(/scenario:\s*'([\w-]+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(scen)].sort(), [...logic.SCENARIOS].sort(), 'one preset per scenario');
});
