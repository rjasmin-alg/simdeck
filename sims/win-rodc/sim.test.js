// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-rodc's model (SPEC.md). Run: node --test sims/win-rodc/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const stepsOf = (over) => kit.stepsOf(logic, P(over));
const sorted = (a) => a.slice().sort();
const res = (s) => [s.last.pcRes && s.last.pcRes.result, s.last.userRes && s.last.userRes.result];

// ── tie-breaks first ──

test('T1: deny wins over allow (tbrennan is in Domain Admins and BRK-Staff)', () => {
  const v = logic.prp('tbrennan', P());
  assert.equal(v.verdict, 'deny');
  assert.equal(v.by, 'Domain Admins');
  assert.equal(v.alsoAllowed, 'BRK-Staff');
  const s = at({ scenario: 'admin-at-branch', user: 'tbrennan' }, 1);
  assert.deepEqual(res(s), ['cached', 'forwarded']);
  assert.equal(s.last.userRes.prp.verdict, 'deny');
  assert.ok(!s.rodc.cached.includes('tbrennan'));
});

test('the PC is authenticated before the user, in one step', () => {
  const s = at({}, 1);
  assert.deepEqual(s.rodc.cached, ['BR-PC01', 'ana']);
});

// ── rules ──

test('rule 1: the RODC starts with no passwords; it holds only what it cached', () => {
  for (const sc of logic.SCENARIOS.filter((x) => x !== 'stolen')) assert.deepEqual(at({ scenario: sc }, 0).rodc.cached, []);
  assert.equal(at({}, 0).rodc.krbtgt, 'krbtgt_8123');
});

test('rule 2: a held password is answered locally, a missing one is forwarded', () => {
  assert.deepEqual(res(at({}, 1)), ['cached', 'cached']);
  assert.deepEqual(res(at({}, 2)), ['local', 'local']);
  assert.deepEqual(res(at({}, 3)), ['local', 'forwarded']);
});

test('rule 3: allowed → cached; neither → forwarded again every time', () => {
  const s3 = at({}, 3), s4 = at({}, 4);
  assert.equal(s3.last.userRes.prp.verdict, 'none');
  assert.deepEqual(res(s4), ['local', 'forwarded']);
  assert.deepEqual(s4.rodc.cached, ['BR-PC01', 'ana']);
  assert.equal(at({}, 1).last.userRes.prp.verdict, 'allow');
});

test('rule 4: the Allowed group empty caches nothing; denied accounts are never cached', () => {
  const s = at({ scenario: 'default-empty', allowGroup: 'empty' }, 2);
  assert.deepEqual(res(s), ['forwarded', 'forwarded']);
  assert.deepEqual(s.rodc.cached, []);
  assert.equal(logic.prp('krbtgt', P()).verdict, 'deny');
  assert.equal(logic.prp('ana', P({ allowGroup: 'empty' })).verdict, 'none');
  for (const g of ['empty', 'brk']) assert.equal(logic.prp('tbrennan', P({ allowGroup: g })).verdict, 'deny');
});

test('rule 5: WAN down, cached users log on at the RODC, others fail there', () => {
  const p = { scenario: 'wan-down' };
  assert.equal(at(p, 2).wan, false);
  assert.deepEqual(res(at(p, 3)), ['local', 'local']);
  assert.equal(at(p, 3).last.ok, true);
  const s4 = at(p, 4);
  assert.deepEqual(res(s4), ['local', 'failed']);
  assert.equal(s4.last.ok, false);
  assert.equal(s4.last.pcLocal, false, 'marko never logged on at BR-PC01');
  const a4 = at({ scenario: 'admin-at-branch', user: 'tbrennan' }, 4);
  assert.deepEqual(res(a4), ['local', 'failed']);
  assert.equal(a4.last.pcLocal, true, 'tbrennan logged on at BR-PC01 before');
  assert.equal(at({ wan: false }, 1).last.ok, false, 'WAN off from the start');
});

test('rule 6: an uncached PC fails with the WAN down, even when the user is cached', () => {
  const s = kit.stateAt(logic, P({ scenario: 'default-empty', allowGroup: 'empty' }), 4);
  assert.deepEqual(res(s), ['failed', 'failed']);
  // a state where the user is cached and the PC is not
  const s0 = logic.initial(P());
  s0.rodc.cached = ['ana'];
  s0.wan = false;
  const s1 = logic.step(s0, 1, P());
  assert.deepEqual(res(s1), ['failed', 'local']);
  assert.equal(s1.last.ok, false);
});

test('rule 7: local TGTs are signed with krbtgt_8123, forwarded ones by DC01; the domain krbtgt is never exposed', () => {
  assert.equal(at({}, 1).last.tgt, 'domain');
  assert.equal(at({}, 2).last.tgt, 'rodc');
  assert.equal(at({}, 3).last.tgt, 'domain');
  for (const allowGroup of ['empty', 'brk']) {
    const s = at({ scenario: 'stolen', allowGroup }, 1);
    assert.equal(s.stolen, true);
    assert.ok(!s.exposed.includes('krbtgt'));
    assert.ok(!s.exposed.includes('tbrennan') && !s.exposed.includes('marko'));
    assert.deepEqual(s.exposed, s.rodc.cached);
  }
});

test('rule 8: the response resets exactly the revealed list; HQ accounts are untouched', () => {
  const p = { scenario: 'stolen' };
  assert.equal(at(p, 0).before, 10);
  assert.deepEqual(at(p, 1).toReset, []);
  const s2 = at(p, 2);
  assert.equal(s2.toReset.length, 14);
  assert.equal(at(p, 2).rodc.account, true);
  assert.equal(at(p, 3).rodc.account, false);
  const s4 = at(p, 4);
  assert.deepEqual(sorted(s4.last.done), sorted(logic.BRANCH_USERS));
  assert.ok(logic.PCS.every((pc) => s4.pwdVer[pc] === 1));
  const s5 = at(p, 5);
  assert.deepEqual(sorted(s5.last.done), sorted(logic.PCS));
  for (const a of logic.ACCOUNTS) {
    assert.equal(s5.pwdVer[a.id], s2.toReset.includes(a.id) ? 2 : 1, a.id);
  }
  for (const id of ['marko', 'tbrennan', 'krbtgt']) assert.equal(s5.pwdVer[id], 1);
  assert.equal(at({ scenario: 'stolen', allowGroup: 'empty' }, 5).reset.length, 0);
});

test('rule 4: the denied lists are exactly SPEC.md\'s', () => {
  assert.deepEqual(logic.DENIED_GROUP, ['Domain Admins', 'Enterprise Admins', 'Schema Admins', 'Cert Publishers',
    'Group Policy Creator Owners', 'Domain Controllers', 'Read-only Domain Controllers', 'krbtgt']);
  assert.deepEqual(logic.DENIED_POLICY, ['Administrators', 'Account Operators', 'Server Operators', 'Backup Operators']);
  assert.deepEqual(logic.ALLOW_OF, { empty: [], brk: ['BRK-Staff', 'BRK-PCs'] });
});

test('rule 7 and 8: theft exposes the RODC\'s key; delete removes it and keeps the revealed list', () => {
  const p = { scenario: 'stolen' };
  assert.equal(at(p, 1).exposedKey, 'krbtgt_8123');
  assert.equal(at(p, 2).rodc.krbtgt, 'krbtgt_8123');
  const s3 = at(p, 3);
  assert.equal(s3.rodc.krbtgt, null);
  assert.deepEqual(s3.rodc.cached, at(p, 2).rodc.cached, 'the revealed list stays');
  assert.equal(s3.rodc.cached.length, 14);
});

test('rule 6 and 7: a failed logon gets no TGT', () => {
  const s0 = logic.initial(P());
  s0.rodc.cached = ['ana'];
  s0.wan = false;
  assert.equal(logic.step(s0, 1, P()).last.tgt, null);
  assert.equal(at({ scenario: 'wan-down' }, 4).last.tgt, null);
});

// ── presets: the expected numbers of SPEC.md ──

test('preset step counts: 4 / 4 / 4 / 4 / 5; sim.json steps = default', () => {
  assert.deepEqual(logic.SCENARIOS.map((sc) => stepsOf({ scenario: sc })), [4, 4, 4, 4, 5]);
  assert.equal(require('./sim.json').steps, stepsOf({}));
  for (const sc of logic.SCENARIOS) assert.ok(stepsOf({ scenario: sc }) <= 5);
});

test('preset numbers', () => {
  const c = (over, n) => at(over, n).rodc.cached.length;
  assert.deepEqual([1, 2, 3, 4].map((n) => c({}, n)), [2, 2, 2, 2]);
  assert.deepEqual([1, 2, 3, 4].map((n) => c({ scenario: 'admin-at-branch', user: 'tbrennan' }, n)), [1, 1, 1, 1]);
  assert.deepEqual([1, 2, 3, 4].map((n) => c({ scenario: 'default-empty', allowGroup: 'empty' }, n)), [0, 0, 0, 0]);
  const s = at({ scenario: 'stolen' }, 1);
  assert.equal(s.exposed.filter((id) => logic.kindOf(id) === 'user').length, 6);
  assert.equal(s.exposed.filter((id) => logic.kindOf(id) === 'computer').length, 8);
});

test('the user param changes the main logons only', () => {
  assert.equal(at({ user: 'marko' }, 1).last.user, 'marko');
  assert.deepEqual(at({ user: 'marko' }, 1).rodc.cached, ['BR-PC01']);
  assert.equal(at({ scenario: 'wan-down', user: 'tbrennan' }, 4).last.user, 'marko');
});

test('repeated events stay valid: a second cut, a delete twice, a logon after the theft', () => {
  const s0 = logic.initial(P({ wan: false }));
  const s1 = logic.step(s0, 2, P({ scenario: 'wan-down', wan: false }));
  assert.equal(s1.last.already, true);
  const st = at({ scenario: 'stolen' }, 5);
  const again = logic.step(st, 1, P());
  assert.equal(again.last.gone, true);
  assert.equal(again.last.ok, false);
  assert.equal(new Set(st.rodc.cached).size, st.rodc.cached.length, 'no duplicates in the cache');
});

// ── generic checks every sim keeps ──

const ALL = logic.SCENARIOS.flatMap((scenario) => ['empty', 'brk'].flatMap((allowGroup) => [true, false].flatMap((wan) =>
  logic.USERS.map((user) => ({ scenario, allowGroup, wan, user })))));

test('state is JSON-safe at every step', () => {
  for (const over of ALL) {
    for (let n = 0; n <= stepsOf(over); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of ALL) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= stepsOf(over); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = stepsOf(over); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const sc of logic.SCENARIOS) {
    const p = P({ scenario: sc });
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
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, stepsOf({}), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
