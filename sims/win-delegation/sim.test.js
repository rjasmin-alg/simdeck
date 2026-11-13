// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-delegation's model (rules: SPEC.md). Run: node --test sims/win-delegation/
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
const results = (over) => end(over).log.map((x) => `${x.user}:${x.action}:${x.ok ? 'ok' : 'no'}`);

/** A state built by hand: the base state of delegate-staff with a patch. */
function base(patch) { return Object.assign(logic.initial(P()), patch || {}); }
const ace = (trustee, type, right) => ({ trustee, type, right, appliesTo: 'users' });

// ── tie-breaks first ──

test('T1 explicit rows are read before inherited ones: an explicit allow beats an inherited deny', () => {
  // the user's own ACL holds Domain Admins full control; give Helpdesk Domain Admins and a deny on the OU
  const s = base({ helpdeskInDA: true, aces: { brack: [ace('Helpdesk', 'deny', 'reset')] } });
  // the explicit DA allow comes first: explicit rows are read before inherited ones
  const r = logic.check(s, 'aashdown', 'reset');
  assert.equal(r.ok, true);
  assert.equal(r.rows[r.decider].inherited, false);
});

test('T2 within one ancestor, a deny is read before an allow; the deny decides', () => {
  const s = base({ aces: { staff: [ace('Helpdesk', 'allow', 'reset'), ace('Helpdesk', 'deny', 'reset')] } });
  const r = logic.check(s, 'aashdown', 'reset');
  assert.equal(r.ok, false);
  assert.equal(r.rows[r.decider].type, 'deny');
});

test('T3 a nearer ancestor is read first: an allow on OU=Brackenridge beats a deny on OU=Staff', () => {
  const s = base({ aces: { staff: [ace('Helpdesk', 'deny', 'reset')], brack: [ace('Helpdesk', 'allow', 'reset')] } });
  const r = logic.check(s, 'aashdown', 'reset');
  assert.equal(r.ok, true);
  assert.equal(r.rows[r.decider].from, 'brack');
  // and the other way round: deny nearer
  const s2 = base({ aces: { brack: [ace('Helpdesk', 'deny', 'reset')], staff: [ace('Helpdesk', 'allow', 'reset')] } });
  assert.equal(logic.check(s2, 'aashdown', 'reset').ok, false);
});

test('T4 running the wizard twice on the same OU adds nothing the second time', () => {
  const s0 = base();
  const s1 = logic.step(s0, 1, P());
  const s2 = logic.step(Object.assign(s1, { log: [] }), 1, P());
  assert.equal(s1.aces.staff.length, 2);
  assert.equal(s2.aces.staff.length, 2);
  assert.equal(s2.last.added, 0);
});

// ── rules ──

test('rule 1: the wizard adds two Helpdesk ACEs on the OU, applying to descendant users', () => {
  const s = at({}, 1);
  assert.deepEqual(s.aces.staff.map((a) => [a.trustee, a.type, a.right, a.appliesTo]),
    [['Helpdesk', 'allow', 'reset', 'users'], ['Helpdesk', 'allow', 'pwdLastSet', 'users']]);
  // inherited onto a user two levels down, marked with where it came from
  const rows = logic.aclOf(s, 'aashdown').filter((r) => r.inherited);
  assert.deepEqual(rows.map((r) => [r.right, r.from]), [['reset', 'staff'], ['pwdLastSet', 'staff']]);
  assert.deepEqual(logic.reachedBy(s, 'hq'), ['staff']);
});

test('rule 2: the reset succeeds through the inherited allow ACE', () => {
  const s = at({}, 2);
  assert.equal(s.last.ok, true);
  assert.equal(s.last.decider.trustee, 'Helpdesk');
  assert.equal(s.last.decider.inherited, true);
  assert.equal(s.last.decider.right, 'reset');
});

test('rule 2: before the wizard, nothing grants hd-mia the reset', () => {
  const r = logic.check(at({}, 0), 'aashdown', 'reset');
  assert.equal(r.ok, false);
  assert.equal(r.decider, -1);
});

test('rule 3: a user in CN=Users has no delegated ACE → refused', () => {
  const s = at({}, 4);
  assert.equal(s.last.user, 'afenwick');
  assert.equal(s.last.ok, false);
  assert.equal(logic.aclOf(s, 'afenwick').some((r) => r.inherited), false);
});

test('rule 4: unlocking needs write lockoutTime, which the reset task lacks → refused', () => {
  const s = at({}, 5);
  assert.equal(s.last.action, 'unlock');
  assert.equal(s.last.ok, false);
  // full control does cover it
  const da = base({ helpdeskInDA: true });
  assert.equal(logic.check(da, 'aashdown', 'unlock').ok, true);
});

test('rule 5: SDProp stamps adminCount = 1, replaces the ACL with AdminSDHolder and turns inheritance off', () => {
  const s = at({ scenario: 'protected-admin' }, 4);
  assert.equal(s.users['tbrennan-adm'].adminCount, 1);
  assert.deepEqual(s.last.stamped, ['tbrennan-adm']);
  const rows = logic.aclOf(s, 'tbrennan-adm');
  assert.ok(rows.every((r) => !r.inherited && r.from === 'adminsdholder'));
  const t = at({ scenario: 'protected-admin' }, 5);
  assert.equal(t.last.ok, false);
  assert.equal(t.last.decider, null);
});

test('rule 6: between joining Domain Admins and SDProp, the inherited ACE still applies', () => {
  const s = at({ scenario: 'protected-admin' }, 3);
  assert.equal(s.da.includes('tbrennan-adm'), true);
  assert.equal(s.users['tbrennan-adm'].adminCount, 0);
  assert.equal(s.last.ok, true);
  assert.equal(s.last.decider.inherited, true);
});

test('rule 7: moving a user out of the OU drops the inherited ACEs at once', () => {
  assert.deepEqual(results({ scenario: 'move-user' }), ['aashdown:reset:ok', 'aashdown:reset:no']);
  const s = at({ scenario: 'move-user' }, 2);
  assert.equal(s.users.aashdown.container, 'disabled');
  assert.equal(logic.aclOf(s, 'aashdown').some((r) => r.inherited), false);
});

test('rule 8: Helpdesk in Domain Admins resets anyone, the administrator included; out of it, refused', () => {
  const s = at({ scenario: 'quillmoor' }, 1);
  assert.equal(s.last.ok, true);
  assert.equal(s.last.decider.trustee, 'Domain Admins');
  assert.equal(s.last.decider.from, 'adminsdholder');
  assert.deepEqual(results({ scenario: 'quillmoor' }), ['administrator:reset:ok', 'administrator:reset:no']);
  // after the delegation in the quillmoor run, an ordinary user is still covered
  assert.equal(logic.check(end({ scenario: 'quillmoor' }), 'aashdown', 'reset').ok, true);
});

test('Domain Admins membership is in the token only while Helpdesk is in it', () => {
  assert.deepEqual(logic.sidsOf(at({ scenario: 'quillmoor' }, 0)), ['hd-mia', 'Helpdesk', 'Domain Admins']);
  assert.deepEqual(logic.sidsOf(at({ scenario: 'quillmoor' }, 2)), ['hd-mia', 'Helpdesk']);
});

// ── found by the review: mutations that survived ──

test('SDProp stamps only members of protected groups', () => {
  const s = at({ scenario: 'protected-admin' }, 4);
  for (const u of ['eyardley', 'aashdown', 'afenwick']) assert.equal(s.users[u].adminCount, 0, u);
});

test('AdminSDHolder copy: Domain Admins and Administrators, both explicit', () => {
  const rows = logic.aclOf(at({}, 0), 'administrator');
  assert.deepEqual(rows.map((r) => [r.trustee, r.right, r.inherited, r.from]),
    [['Domain Admins', 'full', false, 'adminsdholder'], ['Administrators', 'full', false, 'adminsdholder']]);
});

test('an OU ACE for the OU itself (appliesTo this) is not inherited by users', () => {
  const s = base({ aces: { staff: [{ trustee: 'Helpdesk', type: 'allow', right: 'reset', appliesTo: 'this' }] } });
  assert.equal(logic.aclOf(s, 'aashdown').some((r) => r.inherited), false);
  assert.equal(logic.check(s, 'aashdown', 'reset').ok, false);
});

test('T4 the wizard adds an ACE that differs only in type, right or applies-to', () => {
  const pre = (a) => logic.step(base({ aces: { staff: [a] } }), 1, P()).aces.staff.length;
  assert.equal(pre(ace('Helpdesk', 'deny', 'reset')), 3);          // type differs
  assert.equal(pre(ace('Helpdesk', 'allow', 'lockoutTime')), 3);   // right differs
  assert.equal(pre({ trustee: 'Helpdesk', type: 'allow', right: 'reset', appliesTo: 'this' }), 3); // applies-to differs
  assert.equal(pre(ace('Helpdesk', 'allow', 'reset')), 2);         // same: only pwdLastSet added
});

test('the scope param places the delegation in move-user and quillmoor', () => {
  assert.deepEqual(Object.keys(at({ scenario: 'move-user', scope: 'brack' }, 0).aces), ['brack']);
  assert.deepEqual(Object.keys(end({ scenario: 'quillmoor', scope: 'brack' }).aces), ['brack']);
});

test('reachedBy: ancestors holding a delegation, never the container itself', () => {
  const s = at({}, 1);
  assert.deepEqual(logic.reachedBy(s, 'staff'), []);
  assert.deepEqual(logic.reachedBy(s, 'brack'), ['staff']);
  assert.deepEqual(logic.reachedBy(s, 'users'), []);
  assert.deepEqual(logic.reachedBy(s, 'disabled'), []);
});

test('focus: a non-test step after a test shows the target param again', () => {
  const p = P({ scenario: 'protected-admin', target: 'aashdown' });
  assert.deepEqual(logic.focus(kit.stateAt(logic, p, 4), p), { user: 'aashdown', action: 'reset', tested: false });
});

test('the token keeps Domain Admins after SDProp while Helpdesk is a member', () => {
  const s = base({ helpdeskInDA: true, sdpropRun: true });
  assert.deepEqual(logic.sidsOf(s), ['hd-mia', 'Helpdesk', 'Domain Admins']);
});

// ── presets: the task's expected results ──

test('presets: steps 5 / 4 / 5 / 3 / 4', () => {
  assert.deepEqual(logic.SCENARIOS.map((sc) => logic.steps(P({ scenario: sc }))), [5, 4, 5, 3, 4]);
});

test('delegate-staff: aashdown ✓, eyardley ✓, afenwick ✕, unlock ✕', () => {
  assert.deepEqual(results({}), ['aashdown:reset:ok', 'eyardley:reset:ok', 'afenwick:reset:no', 'aashdown:unlock:no']);
});

test('narrow (OU=Brackenridge): eyardley in HQ ✕', () => {
  assert.deepEqual(results({ scenario: 'narrow', scope: 'brack' }), ['aashdown:reset:ok', 'eyardley:reset:no', 'afenwick:reset:no']);
  // the scope param decides: on OU=Staff HQ is covered
  assert.deepEqual(results({ scenario: 'narrow', scope: 'staff' }), ['aashdown:reset:ok', 'eyardley:reset:ok', 'afenwick:reset:no']);
});

test('protected-admin: ✓ before SDProp, ✕ after; with the wizard on OU=Brackenridge both ✕', () => {
  assert.deepEqual(results({ scenario: 'protected-admin' }), ['tbrennan-adm:reset:ok', 'tbrennan-adm:reset:no']);
  assert.deepEqual(results({ scenario: 'protected-admin', scope: 'brack' }), ['tbrennan-adm:reset:no', 'tbrennan-adm:reset:no']);
});

test('focus: a test step shows its user; other steps show the target param', () => {
  assert.deepEqual(logic.focus(at({}, 4), P()), { user: 'afenwick', action: 'reset', tested: true });
  assert.deepEqual(logic.focus(at({ target: 'eyardley' }, 1), P({ target: 'eyardley' })), { user: 'eyardley', action: 'reset', tested: false });
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const sc of logic.SCENARIOS) for (const scope of ['staff', 'brack']) {
    const p = { scenario: sc, scope };
    for (let n = 0; n <= logic.steps(P(p)); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const sc of logic.SCENARIOS) {
    const p = P({ scenario: sc });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scenario: 'protected-admin' });
  let s = logic.initial(p);
  for (let n = 1; n <= logic.steps(p); n++) {
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
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the default preset');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
});
