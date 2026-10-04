// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-group-scopes. Run: node --test sims/win-group-scopes/
// One test per rule of SPEC.md §2, tie-breaks first, then the presets' expected results, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const RT = require('../../kit/ruletable.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => kit.stateAt(logic, P(over), 0);
const preset = (id) => at(logic.presets.find((x) => x.id === id).params);
const edge = (s, c, p) => s.edges.find((e) => e.child === c && e.parent === p);

const user = (id, domain) => ({ id, name: id, domain, kind: 'user' });
const grp = (id, scope, domain) => ({ id, name: id, scope, domain });
/** A hand-built scene: the resource domain is quillmoor, as in the page. */
const scene = (users, groups, members, acl) => logic.evaluate({ users, groups, members, acl, testUser: users[0].id });

// ── tie-breaks first ──

test('tie-break: the shortest valid chain is shown (3 hops beats 4)', () => {
  const s = at({ viaU: true, aInB: true });
  assert.deepEqual(s.access.ana.path, ['ana', 'A', 'B']);
  assert.equal(s.access.ana.hops, 3);
  assert.equal(s.access.ana.label, 'agdlp');
  assert.deepEqual(s.access.ivo.path, ['ivo', 'C', 'U', 'B']);
});

test('tie-break: equal length → the chain whose edges come first in the member list', () => {
  const users = [user('u', 'brk')];
  const groups = [grp('G1', 'G', 'brk'), grp('G2', 'G', 'brk'), grp('D', 'DL', 'quillmoor')];
  const acl = [{ principal: 'D', right: 'modify' }];
  let ev = scene(users, groups, [['u', 'G2'], ['u', 'G1'], ['G1', 'D'], ['G2', 'D']], acl);
  assert.deepEqual(ev.access.u.path, ['u', 'G2', 'D']);
  ev = scene(users, groups, [['u', 'G1'], ['u', 'G2'], ['G2', 'D'], ['G1', 'D']], acl);
  assert.deepEqual(ev.access.u.path, ['u', 'G1', 'D']);
});

test('tie-break: two ACEs reached at the same length → the first in ACL order is shown; rights are the union', () => {
  const users = [user('u', 'brk')];
  const groups = [grp('G1', 'G', 'brk'), grp('G2', 'G', 'brk')];
  const ev = scene(users, groups, [['u', 'G1'], ['u', 'G2']], [{ principal: 'G2', right: 'read' }, { principal: 'G1', right: 'modify' }]);
  assert.equal(ev.access.u.ace, 0);
  assert.deepEqual(ev.access.u.path, ['u', 'G2']);
  assert.deepEqual(ev.access.u.rights, ['read', 'modify']);
});

test('tie-break: a shorter chain to a later ACE beats a longer chain to an earlier one', () => {
  const users = [user('u', 'brk')];
  const groups = [grp('G1', 'G', 'brk'), grp('D', 'DL', 'quillmoor')];
  const ev = scene(users, groups, [['u', 'G1'], ['G1', 'D']], [{ principal: 'D', right: 'modify' }, { principal: 'G1', right: 'read' }]);
  assert.equal(ev.access.u.ace, 1);
  assert.equal(ev.access.u.hops, 2);
});

// ── rule 1: global ──

test('rule 1: a global group takes accounts and globals of its own domain only', () => {
  const g = grp('G', 'G', 'brk');
  assert.equal(logic.edgeCheck(user('a', 'brk'), g).valid, true);
  assert.equal(logic.edgeCheck(grp('G2', 'G', 'brk'), g).valid, true);
  assert.deepEqual(logic.edgeCheck(user('i', 'quillmoor'), g), { valid: false, reason: 'g-own-domain' });
  assert.deepEqual(logic.edgeCheck(grp('G3', 'G', 'quillmoor'), g), { valid: false, reason: 'g-own-domain' });
  assert.deepEqual(logic.edgeCheck(grp('U', 'U', 'brk'), g), { valid: false, reason: 'g-members' });
  assert.equal(logic.edgeCheck(grp('U2', 'U', 'quillmoor'), g).reason, 'g-members', 'g-members is checked before g-own-domain');
});

test('rule 1: a global group can join U and DL anywhere in the forest, and is usable on any ACL of the forest', () => {
  const g = grp('G', 'G', 'brk');
  assert.equal(logic.edgeCheck(g, grp('U', 'U', 'quillmoor')).valid, true);
  assert.equal(logic.edgeCheck(g, grp('D', 'DL', 'quillmoor')).valid, true);
  assert.equal(logic.edgeCheck(g, grp('D2', 'DL', 'brk')).valid, true);
  assert.equal(logic.aceCheck(g, 'quillmoor').valid, true);
});

// ── rule 2: domain local ──

test('rule 2: a domain local group takes accounts, G and U from any domain, and DL only from its own', () => {
  const d = grp('D', 'DL', 'quillmoor');
  assert.equal(logic.edgeCheck(user('a', 'brk'), d).valid, true);
  assert.equal(logic.edgeCheck(grp('G', 'G', 'brk'), d).valid, true);
  assert.equal(logic.edgeCheck(grp('U', 'U', 'brk'), d).valid, true);
  assert.equal(logic.edgeCheck(grp('D2', 'DL', 'quillmoor'), d).valid, true);
  assert.deepEqual(logic.edgeCheck(grp('D3', 'DL', 'brk'), d), { valid: false, reason: 'dl-own-domain' });
});

test('rule 2: a domain local group can only be a member of DL groups (never G or U)', () => {
  const d = grp('D', 'DL', 'brk');
  assert.deepEqual(logic.edgeCheck(d, grp('G', 'G', 'brk')), { valid: false, reason: 'dl-only-in-dl' });
  assert.deepEqual(logic.edgeCheck(d, grp('U', 'U', 'brk')), { valid: false, reason: 'dl-only-in-dl' });
});

test('rule 2 / rule 5: a DL group is usable on an ACL only in its own domain', () => {
  assert.equal(logic.aceCheck(grp('D', 'DL', 'quillmoor'), 'quillmoor').valid, true);
  assert.deepEqual(logic.aceCheck(grp('D', 'DL', 'brk'), 'quillmoor'), { valid: false, reason: 'dl-foreign-acl' });
  assert.equal(logic.aceCheck(user('a', 'brk'), 'quillmoor').valid, true);
  assert.equal(logic.aceCheck(grp('U', 'U', 'brk'), 'quillmoor').valid, true);
});

// ── rule 3: universal ──

test('rule 3: a universal group takes accounts, G and U from any domain, joins U and DL anywhere', () => {
  const u = grp('U', 'U', 'quillmoor');
  assert.equal(logic.edgeCheck(user('a', 'brk'), u).valid, true);
  assert.equal(logic.edgeCheck(grp('G', 'G', 'brk'), u).valid, true);
  assert.equal(logic.edgeCheck(grp('U2', 'U', 'brk'), u).valid, true);
  assert.equal(logic.edgeCheck(u, grp('U3', 'U', 'brk')).valid, true);
  assert.equal(logic.edgeCheck(u, grp('D', 'DL', 'brk')).valid, true);
});

// ── rule 4: the check is complete and the two sides of the table agree ──

test('rule 4: every child/parent combination matches the scope table', () => {
  // The table, written out a second time from its other column ("possible member of" of the child).
  const memberOf = (c, p) => {
    const same = c.domain === p.domain;
    if (c.kind === 'user') return p.scope !== 'G' || same;
    if (c.scope === 'G') return p.scope !== 'G' || same;
    if (c.scope === 'U') return p.scope === 'U' || p.scope === 'DL';
    return p.scope === 'DL' && same;
  };
  const doms = ['brk', 'quillmoor'];
  let n = 0;
  for (const pd of doms) for (const ps of logic.SCOPES) {
    const parent = grp('P', ps, pd);
    for (const cd of doms) {
      assert.equal(logic.edgeCheck(user('x', cd), parent).valid, memberOf(user('x', cd), parent), `user ${cd} → ${ps} ${pd}`);
      for (const cs of logic.SCOPES) {
        const child = grp('C', cs, cd);
        assert.equal(logic.edgeCheck(child, parent).valid, memberOf(child, parent), `${cs} ${cd} → ${ps} ${pd}`);
        n++;
      }
    }
  }
  assert.equal(n, 36);
  assert.equal(logic.edgeCheck(null, grp('P', 'G', 'brk')).reason, 'unknown');
  const g = grp('G', 'G', 'brk');
  assert.equal(logic.edgeCheck(g, g).reason, 'self');
  assert.equal(logic.edgeCheck(grp('C', 'G', 'brk'), user('x', 'brk')).reason, 'unknown', 'a user is never a parent');
  const ev = scene([user('u', 'brk')], [], [], [{ principal: 'nope', right: 'read' }]);
  assert.deepEqual(ev.aces[0], { principal: 'nope', right: 'read', valid: false, reason: 'unknown' });
});

// ── rule 6: invalid things are kept ──

test('rule 6: an invalid edge or ACE stays in the state with its reason', () => {
  const s = at({ userDomain: 'quillmoor', bInBrk: true });
  assert.equal(s.edges.length, 3);
  assert.deepEqual(edge(s, 'ivo', 'A'), { child: 'ivo', parent: 'A', valid: false, reason: 'g-own-domain' });
  assert.equal(s.aces.length, 2);
  assert.deepEqual(s.aces[1], { principal: 'B', right: 'modify', valid: false, reason: 'dl-foreign-acl' });
});

// ── rule 7: access along valid edges only ──

test('rule 7: nesting is transitive along valid edges only', () => {
  const users = [user('u', 'brk')];
  const groups = [grp('G', 'G', 'brk'), grp('X', 'G', 'quillmoor'), grp('D', 'DL', 'quillmoor')];
  // u → G valid; G → X invalid (G takes only its own domain); X → D valid: D is not reached through X.
  let ev = scene(users, groups, [['u', 'G'], ['G', 'X'], ['X', 'D']], [{ principal: 'D', right: 'modify' }]);
  assert.equal(ev.access.u.granted, false);
  ev = scene(users, groups, [['u', 'G'], ['G', 'D']], [{ principal: 'D', right: 'modify' }]);
  assert.equal(ev.access.u.granted, true);
});

test('rule 7: an invalid ACE grants nothing even when its principal is reached', () => {
  const s = preset('dl-on-foreign-acl');
  assert.equal(edge(s, 'A', 'B').valid, true);
  assert.ok(s.access.ana.reached.includes('B'));
  assert.equal(s.access.ana.granted, false);
});

test('rule 7: a user directly on the ACL gets the right in one hop', () => {
  const s = at({ aclPrincipal: 'user' });
  assert.equal(s.acl[1].principal, 'ana');
  assert.equal(s.access.ana.granted, true);
  assert.equal(s.access.ana.hops, 1);
  assert.equal(s.access.ana.label, 'other');
});

test('rule 7: rights are listed once; a membership cycle terminates', () => {
  const users = [user('u', 'brk')];
  const groups = [grp('U1', 'U', 'quillmoor'), grp('U2', 'U', 'brk'), grp('D', 'DL', 'quillmoor')];
  const ev = scene(users, groups, [['u', 'U1'], ['U1', 'U2'], ['U2', 'U1'], ['U2', 'D']],
    [{ principal: 'U1', right: 'read' }, { principal: 'D', right: 'read' }]);
  assert.deepEqual(ev.access.u.rights, ['read']);
  assert.deepEqual(ev.access.u.reached.sort(), ['D', 'U1', 'U2', 'u']);
  assert.deepEqual(logic.chainsFrom(ev.edges, 'u').D, ['u', 'U1', 'U2', 'D']);
});

// ── rule 9: AGDLP is a label, not a rule ──

test('rule 9: valid but not AGDLP layouts work and are labelled other', () => {
  assert.equal(at({ aclPrincipal: 'A' }).access.ana.label, 'other');
  assert.equal(at({ aclPrincipal: 'A' }).access.ana.granted, true);
  const u = at({ scopeA: 'U' });
  assert.equal(u.access.ana.granted, true);
  assert.equal(u.access.ana.label, 'other');
  assert.equal(at({ scopeB: 'U' }).access.ana.label, 'other');
  assert.equal(at({ aInB: false }).access.ana.label, null);
});

// ── rule 10: duplicates ──

test('rule 10: a repeated edge is kept once; a repeated id resolves to the first', () => {
  const users = [user('u', 'brk')];
  const groups = [grp('G', 'G', 'brk'), grp('G', 'DL', 'brk')];
  const ev = scene(users, groups, [['u', 'G'], ['u', 'G']], [{ principal: 'G', right: 'read' }]);
  assert.equal(ev.edges.length, 1);
  assert.equal(ev.aces[0].valid, true, 'the first G (global) is the principal, valid on the ACL; the second (DL of brk) would not be');
  assert.equal(ev.access.u.granted, true);
});

test('group names carry the scope prefix', () => {
  const s = at({ scopeA: 'DL', scopeB: 'U' });
  assert.equal(s.groups[0].name, 'DL-Projects');
  assert.equal(s.groups[1].name, 'U-Projects-Modify');
});

// ── presets (SPEC §4) ──

test('preset agdlp: ana → G-Projects → DL-Projects-Modify → Modify, 3 hops, AGDLP', () => {
  const s = preset('agdlp');
  assert.ok(s.edges.every((e) => e.valid));
  assert.deepEqual(s.access.ana.path, ['ana', 'A', 'B']);
  assert.equal(s.access.ana.hops, 3);
  assert.deepEqual(s.access.ana.rights, ['modify']);
  assert.equal(s.access.ana.label, 'agdlp');
  assert.equal(s.tested, true);
});

test('preset global-cross-domain-member: ivo cannot join G-Projects in brk', () => {
  const s = preset('global-cross-domain-member');
  assert.equal(s.testUser, 'ivo');
  assert.equal(edge(s, 'ivo', 'A').reason, 'g-own-domain');
  assert.equal(s.access.ivo.granted, false);
  assert.equal(s.access.ana.granted, true);
});

test('preset dl-on-foreign-acl: DL from brk on the quillmoor ACL is invalid, nobody has access', () => {
  const s = preset('dl-on-foreign-acl');
  assert.equal(s.aces[1].reason, 'dl-foreign-acl');
  assert.equal(s.access.ana.granted, false);
  assert.equal(s.access.ivo.granted, false);
});

test('preset dl-into-global: a DL group cannot be in a global group', () => {
  const s = preset('dl-into-global');
  assert.equal(s.groups[0].name, 'DL-Projects');
  assert.equal(s.groups[1].name, 'G-Projects-Modify');
  assert.equal(edge(s, 'ana', 'A').valid, true);
  assert.equal(edge(s, 'A', 'B').reason, 'dl-only-in-dl');
  assert.equal(s.aces[1].valid, true);
  assert.equal(s.access.ana.granted, false);
});

test('preset agudlp: both account domains reach the share through one universal group', () => {
  const s = preset('agudlp');
  assert.ok(s.edges.every((e) => e.valid));
  assert.deepEqual(s.access.ana.path, ['ana', 'A', 'U', 'B']);
  assert.deepEqual(s.access.ivo.path, ['ivo', 'C', 'U', 'B']);
  assert.equal(s.access.ana.label, 'agudlp');
  assert.equal(s.access.ivo.label, 'agudlp');
  assert.equal(s.access.ana.hops, 4);
});

test('changes: a scope change marks the group, the broken edge and the result', () => {
  const a = at({ tested: true });
  const b = at({ tested: true, scopeA: 'DL', scopeB: 'G' });
  const c = logic.changes(a, b);
  assert.deepEqual(c.groups, ['A', 'B']);
  assert.deepEqual(c.edges, ['A>B']);
  assert.equal(c.access, true);
  assert.deepEqual(logic.changes(a, a), { groups: [], edges: [], access: false });
  assert.ok(logic.changes(at({}), at({ bInBrk: true })).groups.includes('B'), 'a domain change marks the group');
});

test('the rule table spec is valid for every param combination', () => {
  for (const scopeA of logic.SCOPES) for (const scopeB of logic.SCOPES) for (const bInBrk of [false, true])
    for (const aclPrincipal of ['A', 'B', 'user']) for (const viaU of [false, true]) for (const tested of [false, true]) {
      const s = at({ scopeA, scopeB, bInBrk, aclPrincipal, viaU, tested });
      const r = s.access[s.testUser];
      const reached = new Set(r.reached);
      const rows = s.aces.map((a, i) => ({ no: i + 1, cells: { p: a.principal }, action: a.right, effect: 'allow',
        hit: tested ? a.valid && reached.has(a.principal) : null, miss: tested && !a.valid ? ['p'] : [] }));
      assert.deepEqual(RT.checkSpec({ mode: 'deny', columns: [{ key: 'p' }], rows, implicit: { text: 'x' }, at: 'all', done: tested }), []);
    }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and many param sets', () => {
  for (const pr of logic.presets) {
    const s = at(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  for (const scopeA of logic.SCOPES) for (const userDomain of ['brk', 'quillmoor']) for (const aInB of [false, true]) {
    const s = at({ scopeA, userDomain, aInB, viaU: true });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ scopeA: 'U', viaU: true, userDomain: 'quillmoor' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and has a label in the page', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  const ids = logic.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  assert.ok(ids.length <= 9, 'keys 1–9');
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k} is a model param`);
    assert.ok(html.includes(`'${pr.id}'`), `${pr.id}: label in index.html`);
  }
});

test('every reason code has a string in both languages', () => {
  for (const r of ['g-own-domain', 'g-members', 'dl-only-in-dl', 'dl-own-domain', 'dl-foreign-acl', 'unknown', 'self']) {
    assert.ok(strings.hr['why_' + r] && strings.en['why_' + r], r);
  }
});
