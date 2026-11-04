// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-gpo-security-filtering's model. Rules: SPEC.md. Run: node --test sims/win-gpo-security-filtering/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const final = (over) => at(over, logic.steps(P(over)));
const user = (name) => logic.USERS.find((u) => u.name === name);
/** One user on PC07 against the GPO these params build. */
const verdict = (over, name) => {
  const p = P(over);
  return logic.decide(logic.gpoOf(logic.aclOf(p), p.wmi === 'laptops' ? logic.LAPTOPS : null), logic.pcOf(p), user(name));
};
const reasons = (over) => {
  const r = final(over).results;
  return ['ana', 'eyardley', 'boss'].map((n) => r[n].reason);
};
const ace = (principal, read, apply, deny) => ({ principal, read, apply, deny: !!deny });

// ── tie-breaks first ──

test('rule 8: security is checked before WMI: inaccessible wins over a false WMI filter', () => {
  assert.deepEqual(reasons({ aclMode: 'sales', wmi: 'laptops' }), ['inaccessible', 'inaccessible', 'inaccessible']);
  const d = verdict({ aclMode: 'sales', wmi: 'laptops' }, 'ana');
  assert.equal(d.alsoWmi, true, 'the WMI filter would be false too');
  assert.equal(d.path[4].pass, null, 'WMI not reached');
});

test('userOk: the user\'s own rights, whatever the computer check says', () => {
  assert.equal(verdict({ aclMode: 'sales' }, 'ana').userOk, true);
  assert.equal(verdict({ aclMode: 'sales' }, 'eyardley').userOk, false);
  assert.equal(verdict({ aclMode: 'sales', denyManagers: true }, 'boss').userOk, false, 'a deny counts');
});

test('rule 8: Denied (Security) wins over a false WMI filter; a user who passes security gets the WMI reason', () => {
  assert.deepEqual(reasons({ aclMode: 'sales-dc', denyManagers: true, wmi: 'laptops' }), ['wmi', 'security', 'security']);
  assert.equal(verdict({ aclMode: 'sales-dc', denyManagers: true, wmi: 'laptops' }, 'boss').alsoWmi, true);
  assert.equal(verdict({ aclMode: 'sales-dc', denyManagers: true, wmi: 'laptops' }, 'ana').alsoWmi, false);
});

test('rule 3 before the user: the computer check comes before the user\'s own rights', () => {
  // ana has Read and Apply through Sales, but the path stops at the computer.
  const d = verdict({ aclMode: 'sales' }, 'ana');
  assert.deepEqual(d.path.map((c) => c.pass), [true, false, null, null, null]);
  assert.equal(d.reason, 'inaccessible');
});

test('rule 2 tie-break: allow and deny on the same token: deny wins, even with every allow present', () => {
  const gpo = logic.gpoOf([ace('Authenticated Users', true, true), ace('Sales', true, true), ace('Managers', false, true, true)], null);
  const d = logic.decide(gpo, logic.pcOf(P()), user('boss'));
  assert.equal(d.reason, 'security');
  assert.deepEqual(d.path.map((c) => c.pass), [true, true, true, false, null]);
  assert.deepEqual(d.path[3].via, ['Managers']);
});

// ── rules ──

test('rule 1: the default delegation (Authenticated Users Read + Apply) applies to every user in the link scope', () => {
  assert.deepEqual(reasons({}), [null, null, null]);
  const d = verdict({}, 'eyardley');
  assert.equal(d.applied, true);
  assert.deepEqual(d.path[1].via, ['Authenticated Users']);
  assert.deepEqual(d.path[2].via, ['Authenticated Users']);
});

test('rule 1: both rights are needed: Read alone or Apply alone is filtered (security)', () => {
  const pc = logic.pcOf(P());
  const readOnly = logic.gpoOf([ace('Authenticated Users', true, false)], null);
  const applyOnly = logic.gpoOf([ace('Domain Computers', true, false), ace('Authenticated Users', false, true)], null);
  assert.equal(logic.decide(readOnly, pc, user('ana')).reason, 'security');
  assert.equal(logic.decide(applyOnly, pc, user('ana')).reason, 'security');
  // the two rights may come from different groups
  const split = logic.gpoOf([ace('Authenticated Users', true, false), ace('Sales', false, true)], null);
  assert.equal(logic.decide(split, pc, user('ana')).applied, true);
});

test('rule 1: a user outside the link scope never gets the GPO (scope), a child OU does', () => {
  const gpo = logic.gpoOf(logic.defaultAcl(), null);
  const pc = logic.pcOf(P());
  assert.equal(logic.decide(gpo, pc, { name: 'x', ou: 'OU=Admins', groups: [] }).reason, 'scope');
  assert.equal(logic.decide(gpo, pc, { name: 'x', ou: 'OU=Interns,OU=Staff', groups: [] }).applied, true);
  assert.equal(logic.decide(gpo, pc, { name: 'x', ou: 'OU=NotStaff', groups: [] }).reason, 'scope');
});

test('rule 2: the Managers row is a Deny on Apply only; alone (default delegation) it removes boss only', () => {
  const m = logic.aclOf(P({ denyManagers: true })).find((a) => a.principal === 'Managers');
  assert.deepEqual([m.read, m.apply, m.deny], [false, true, true]);
  assert.equal(logic.steps(P({ denyManagers: true })), 4, 'a deny is an admin change');
  assert.deepEqual(reasons({ denyManagers: true }), [null, null, 'security']);
});

test('rule 2: Deny Apply for Managers removes boss only', () => {
  assert.deepEqual(reasons({ aclMode: 'sales-dc', denyManagers: true }), [null, 'security', 'security']);
  assert.deepEqual(verdict({ aclMode: 'sales-dc', denyManagers: true }, 'boss').path.map((c) => c.pass), [true, true, true, false, null]);
  assert.deepEqual(verdict({ aclMode: 'sales-dc', denyManagers: true }, 'eyardley').path.map((c) => c.pass), [true, true, false, null, null]);
  // Deny on Read works the same way
  const gpo = logic.gpoOf([ace('Authenticated Users', true, true), ace('Managers', true, false, true)], null);
  assert.equal(logic.decide(gpo, logic.pcOf(P()), user('boss')).reason, 'security');
});

test('rule 3: the computer needs Read: Sales-only delegation is inaccessible for everyone', () => {
  assert.deepEqual(reasons({ aclMode: 'sales' }), ['inaccessible', 'inaccessible', 'inaccessible']);
  // a deny on Read for the computer also makes it inaccessible
  const gpo = logic.gpoOf([ace('Authenticated Users', true, true), ace('Domain Computers', true, false, true)], null);
  assert.equal(logic.decide(gpo, logic.pcOf(P()), user('ana')).reason, 'inaccessible');
});

test('rule 4: the fix is Read without Apply for Domain Computers or Authenticated Users', () => {
  assert.deepEqual(reasons({ aclMode: 'sales-dc' }), [null, 'security', null]);
  const dcRow = logic.aclOf(P({ aclMode: 'sales-dc' })).find((a) => a.principal === 'Domain Computers');
  assert.deepEqual([dcRow.read, dcRow.apply, dcRow.deny], [true, false, false]);
  const auRead = logic.gpoOf([ace('Sales', true, true), ace('Authenticated Users', true, false)], null);
  const pc = logic.pcOf(P());
  assert.deepEqual(['ana', 'eyardley', 'boss'].map((n) => logic.decide(auRead, pc, user(n)).reason), [null, 'security', null]);
});

test('rule 5: a false WMI filter skips the GPO for every user on that computer; a laptop passes', () => {
  assert.deepEqual(reasons({ wmi: 'laptops' }), ['wmi', 'wmi', 'wmi']);
  assert.deepEqual(reasons({ wmi: 'laptops', pc07Laptop: true }), [null, null, null]);
  assert.deepEqual(verdict({ wmi: 'laptops' }, 'boss').path.map((c) => c.pass), [true, true, true, true, false]);
  // the user plays no part: the same user on a laptop gets it
  const gpo = logic.gpoOf(logic.defaultAcl(), logic.LAPTOPS);
  assert.equal(logic.decide(gpo, Object.assign({}, logic.pcOf(P()), { chassis: 10 }), user('ana')).applied, true);
});

test('rule 6: filtering keeps the order of the GPOs that remain', () => {
  assert.deepEqual(logic.keepOrder(['A', 'B', 'C', 'D'], (g) => g !== 'B'), ['A', 'C', 'D']);
  assert.deepEqual(logic.keepOrder(['D', 'C', 'B'], (g) => g !== 'C'), ['D', 'B']);
});

test('rule 7: a computer added to a group gets its Read only after a reboot', () => {
  const gpo = logic.gpoOf([ace('Sales', true, true), ace('Sales PCs', true, false)], null);
  let pc = logic.pcOf(P());
  pc = Object.assign({}, pc, { groups: pc.groups.concat('Sales PCs') });
  assert.equal(logic.decide(gpo, pc, user('ana')).reason, 'inaccessible', 'old token');
  assert.equal(logic.decide(gpo, logic.restart(pc), user('ana')).applied, true, 'after a reboot');
});

// ── presets, steps, the admin step ──

test('presets: steps and results as in SPEC.md', () => {
  const want = {
    'default': [3, [null, null, null]],
    'sales-only-broken': [4, ['inaccessible', 'inaccessible', 'inaccessible']],
    'sales-fixed': [4, [null, 'security', null]],
    'deny-managers': [4, [null, 'security', 'security']],
    'wmi-laptops': [4, ['wmi', 'wmi', 'wmi']]
  };
  assert.deepEqual(logic.presets.map((p) => p.id), Object.keys(want));
  for (const pr of logic.presets) {
    assert.equal(logic.steps(P(pr.params)), want[pr.id][0], pr.id + ' steps');
    assert.deepEqual(reasons(pr.params), want[pr.id][1], pr.id + ' results');
  }
});

test('the admin step: only when the GPO changes; it marks added and removed rows and sets the WMI filter', () => {
  assert.equal(logic.steps(P({ pc07Laptop: true })), 3, 'a laptop is no admin change');
  const s1 = at({ aclMode: 'sales-dc', denyManagers: true, wmi: 'laptops' }, 1);
  assert.equal(s1.event, 'admin');
  assert.equal(s1.cursor, -1);
  assert.deepEqual(s1.rows.map((r) => [r.principal, r.status]), [
    ['Authenticated Users', 'removed'], ['Domain Admins', 'kept'],
    ['Sales', 'added'], ['Domain Computers', 'added'], ['Managers', 'added']]);
  assert.equal(s1.wmi.name, 'Laptops only');
  assert.deepEqual(Object.keys(s1.results), []);
  const s0 = at({ aclMode: 'sales' }, 0);
  assert.ok(s0.rows.every((r) => r.status === 'kept'), 'step 0 shows the default GPO');
  assert.equal(at({ wmi: 'laptops' }, 0).wmi, null, 'no WMI filter before the admin step');
});

test('one target per step, in order; the removed row no longer counts', () => {
  const p = { aclMode: 'sales' };
  assert.equal(at(p, 2).cursor, 0);
  assert.deepEqual(Object.keys(at(p, 2).results), ['ana']);
  assert.equal(at(p, 4).cursor, 2);
  assert.deepEqual(Object.keys(at(p, 4).results), ['ana', 'eyardley', 'boss']);
  assert.equal(at({}, 1).cursor, 0, 'without a change the first step is ana');
});

test('effective(): matching allow and deny principals per right', () => {
  const acl = logic.aclOf(P({ aclMode: 'sales-dc', denyManagers: true }));
  assert.deepEqual(logic.effective(acl, logic.userToken(user('boss')), 'apply'), { allow: ['Sales'], deny: ['Managers'] });
  assert.deepEqual(logic.effective(acl, logic.pcToken(logic.pcOf(P())), 'read'), { allow: ['Domain Computers'], deny: [] });
});

// ── generic checks every sim keeps ──

const ALL = [{}, ...logic.presets.map((p) => p.params), { aclMode: 'sales', denyManagers: true, wmi: 'laptops', pc07Laptop: true }];

test('state is JSON-safe at every step', () => {
  for (const over of ALL) {
    for (let n = 0; n <= logic.steps(P(over)); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of ALL) {
    const p = P(over), steps = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ aclMode: 'sales-dc', denyManagers: true });
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

test('every preset in the page is valid for the model; meta steps = default steps', () => {
  const fs = require('node:fs'), path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model at the defaults');
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, meta.steps);
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k}`);
  for (const pr of logic.presets) assert.ok(logic.steps(P(pr.params)) <= 4, 'at most 4 steps');
});
