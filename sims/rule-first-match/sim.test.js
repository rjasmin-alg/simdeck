// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for rule-first-match's model (rules: SPEC.md). Run: node --test sims/rule-first-match/
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
const all = (over) => { const p = P(over); const out = []; for (let n = 1; n <= logic.steps(p); n++) out.push(kit.stateAt(logic, p, n)); return out; };
const tally = (over) => end(over).results.map((r) => [r.req, r.label, r.outcome]);
/** The rows tested for request q, in order: [label, 'no'|'match'] (and 'implicit'). */
const path = (over, q) => all(over).filter((s) => s.requests[s.cur] && s.requests[s.cur].id === q && (s.test || (s.phase === 'decided' && s.outcome.reason === 'implicit')))
  .map((s) => s.test ? [s.rules[s.test.row].label, s.test.match ? 'match' : 'no'] : ['implicit']);

// ── tie-breaks first ──

test('tie-break: two rows match, only the upper one counts (router-acl, :22 from 203.0.113.9)', () => {
  const rules = logic.applyFix(logic.SCENES['router-acl'], false);
  const req = { fields: { proto: 'tcp', src: '203.0.113.9', srcPort: 51001, dst: '192.168.10.5', dstPort: 22 } };
  assert.equal(logic.matchRule('acl', rules[0], req).match, true);
  assert.equal(logic.matchRule('acl', rules[2], req).match, true);
  assert.deepEqual(path({ scene: 'router-acl' }, 'q2'), [['10', 'match']]);
  assert.deepEqual(tally({ scene: 'router-acl' })[1], ['q2', '10', 'deny']);
});

test('tie-break: a row covered by an earlier one is shadowed, whatever its action', () => {
  assert.deepEqual(end({ scene: 'router-acl' }).shadow, [-1, -1, 0]);
  assert.deepEqual(end({ scene: 'pg-hba-append' }).shadow, [-1, -1, -1, -1, -1, -1, 1]);
  assert.deepEqual(end({ scene: 'permit-any-top' }).shadow, [-1, 0, 0, 0]);
  // the fix of pg-hba-append makes row 7 redundant (same method), still unreachable
  assert.deepEqual(end({ scene: 'pg-hba-append', fix: true }).shadow, [-1, -1, -1, -1, -1, -1, 1]);
  // moved up, row 30 is no longer shadowed and covers nothing below it
  assert.deepEqual(end({ scene: 'router-acl', fix: true }).shadow, [-1, -1, -1]);
});

test('tie-break: shadowing needs one row to cover every field, not several rows together', () => {
  const r = (src, dstPort) => ({ match: { proto: 'tcp', src, srcPort: 'any', dst: 'any', dstPort } });
  assert.deepEqual(logic.shadowed('acl', [r('10.0.0.0/8', 22), r('any', 443), r('10.1.0.0/16', 443)]), [-1, -1, 1]);
  assert.deepEqual(logic.shadowed('acl', [r('10.0.0.0/8', 22), r('any', 443), r('10.1.0.0/16', 80)]), [-1, -1, -1]);
  // a narrower row above a wider one shadows nothing
  assert.deepEqual(logic.shadowed('acl', [r('10.1.0.0/16', 22), r('10.0.0.0/8', 22)]), [-1, -1]);
});

test('tie-break: database `all` does not cover `replication` (rows 4–6 are not shadowed by rows 1–3)', () => {
  assert.equal(logic.fieldMatch('pg', 'db', 'all', 'replication'), false);
  assert.equal(logic.fieldMatch('pg', 'db', 'all', 'vjezba'), true);
  assert.deepEqual(logic.shadowed('pg', logic.applyFix(logic.SCENES['pg-hba'], false)), [-1, -1, -1, -1, -1, -1]);
});

// ── rules ──

test('rule 1: rows are tested top down, one row per step', () => {
  assert.deepEqual(path({}, 'q3'), [['1', 'no'], ['2', 'no'], ['3', 'no'], ['4', 'no'], ['5', 'no'], ['6', 'no'], ['implicit']]);
  assert.deepEqual(path({ scene: 'permit-any-top', fix: true }, 'q3'), [['20', 'no'], ['30', 'no'], ['40', 'no'], ['50', 'match']]);
  const s1 = at({}, 1);
  assert.equal(s1.cur, 0);
  assert.equal(s1.row, 0);
  assert.deepEqual(s1.marks, ['no', null, null, null, null, null]);
});

test('rule 2: a row matches only if every field matches', () => {
  const rules = logic.applyFix(logic.SCENES['pg-hba'], false);
  const tcp = { fields: { type: 'host', db: 'vjezba', user: 'studentdb', addr: '127.0.0.1' } };
  assert.deepEqual(logic.matchRule('pg', rules[0], tcp), { fields: { type: false, db: true, user: true, addr: true }, match: false });
  assert.deepEqual(logic.matchRule('pg', rules[1], tcp), { fields: { type: true, db: true, user: true, addr: true }, match: true });
  // one field off is enough to miss: the port
  const acl = logic.applyFix(logic.SCENES['router-acl'], false);
  const r = logic.matchRule('acl', acl[0], { fields: { proto: 'tcp', src: '198.51.100.7', srcPort: 51000, dst: '192.168.10.5', dstPort: 443 } });
  assert.deepEqual(r.fields, { proto: true, src: true, srcPort: true, dst: true, dstPort: false });
  assert.equal(r.match, false);
});

test('rule 2: wildcards, prefixes, protocol ip, address families', () => {
  assert.equal(logic.inPrefix('203.0.113.9', '203.0.113.0/24'), true);
  assert.equal(logic.inPrefix('203.0.114.9', '203.0.113.0/24'), false);
  assert.equal(logic.inPrefix('10.1.2.3', '10.0.0.0/8'), true);
  assert.equal(logic.inPrefix('127.0.0.1', '127.0.0.1/32'), true);
  assert.equal(logic.inPrefix('127.0.0.2', '127.0.0.1/32'), false);
  assert.equal(logic.inPrefix('::1', '::1/128'), true);
  assert.equal(logic.inPrefix('::1', '127.0.0.1/32'), false);
  assert.equal(logic.inPrefix('127.0.0.1', '::1/128'), false);
  assert.equal(logic.fieldMatch('acl', 'proto', 'ip', 'udp'), true);
  assert.equal(logic.fieldMatch('acl', 'proto', 'tcp', 'udp'), false);
  assert.equal(logic.fieldMatch('acl', 'src', 'any', '1.2.3.4'), true);
  assert.equal(logic.fieldMatch('acl', 'dstPort', 'any', 80), true);
  assert.equal(logic.fieldMatch('pg', 'user', 'all', 'x'), true);
  assert.equal(logic.fieldMatch('pg', 'addr', null, null), true);       // a local row has no address column
  assert.equal(logic.fieldMatch('pg', 'type', 'host', 'local'), false);
});

test('rule 3: the first match decides; rows below it are never tested', () => {
  assert.deepEqual(path({}, 'q1'), [['1', 'no'], ['2', 'match']]);
  const decided = all({}).find((s) => s.phase === 'decided' && s.outcome.req === 'q1');
  assert.deepEqual(decided.marks, ['no', 'match', null, null, null, null]);
  assert.deepEqual(path({ scene: 'permit-any-top' }, 'q1'), [['10', 'match']]);
  assert.deepEqual(tally({ scene: 'permit-any-top' }), [['q1', '10', 'permit'], ['q2', '10', 'permit'], ['q3', '10', 'permit']]);
  // an ACL match decides in the same step
  const s = at({ scene: 'router-acl' }, 2);
  assert.equal(s.phase, 'decided');
  assert.deepEqual([s.outcome.label, s.outcome.outcome, s.outcome.reason], ['20', 'permit', 'action']);
});

test('rule 4: pg_hba checks the chosen row\'s method in the next step, and a failure is final (no fall-through)', () => {
  const s2 = at({}, 2), s3 = at({}, 3);
  assert.equal(s2.phase, 'match');
  assert.equal(s2.outcome, null);
  assert.equal(s3.phase, 'decided');
  assert.deepEqual(s3.method, { method: 'ident', ok: false, why: 'name' });
  assert.deepEqual([s3.outcome.label, s3.outcome.outcome, s3.outcome.reason], ['2', 'reject', 'method-fail']);
  // row 7 would accept with a password, but is never reached
  assert.deepEqual(path({ scene: 'pg-hba-append' }, 'q1'), [['1', 'no'], ['2', 'match']]);
  assert.deepEqual(tally({ scene: 'pg-hba-append' })[0], ['q1', '2', 'reject']);
  // and the next request starts at the top again
  assert.equal(at({}, 4).row, 0);
  assert.equal(at({}, 4).cur, 1);
});

test('rule 4: the methods', () => {
  const q = (osUser, user, password) => ({ fields: { osUser, user, password } });
  assert.equal(logic.checkMethod('peer', q('postgres', 'postgres', false)).ok, true);
  assert.equal(logic.checkMethod('ident', q('student', 'studentdb', true)).ok, false);
  assert.equal(logic.checkMethod('scram-sha-256', q('student', 'studentdb', true)).ok, true);
  assert.equal(logic.checkMethod('scram-sha-256', q('student', 'studentdb', false)).ok, false);
  assert.equal(logic.checkMethod('reject', q('a', 'a', true)).ok, false);
  assert.equal(logic.checkMethod('trust', q('a', 'b', false)).ok, true);
  // the book's fix: row 2 with scram-sha-256 asks for the password and accepts
  assert.deepEqual(tally({ fix: true })[0], ['q1', '2', 'accept']);
  assert.equal(end({ fix: true }).results[0].method, 'scram-sha-256');
});

test('rule 5: no matching row → pg_hba rejects ("no entry"), an ACL drops on the implicit deny', () => {
  const pg = end({}).results[2];
  assert.deepEqual([pg.row, pg.label, pg.outcome, pg.reason], [-1, null, 'reject', 'implicit']);
  const acl = end({ scene: 'router-acl' }).results[2];
  assert.deepEqual([acl.row, acl.outcome, acl.reason], [-1, 'deny', 'implicit']);
  const last = end({ scene: 'router-acl' });
  assert.equal(last.row, 3);                       // the implicit row sits past the last rule
  assert.deepEqual(last.marks, ['no', 'no', 'no']);
  // the implicit rule takes a step of its own, after the last row's "no"
  const before = at({ scene: 'router-acl' }, 6);
  assert.deepEqual([before.phase, before.row], ['nomatch', 2]);
});

test('rule 6: stateless: the reply is judged alone and needs its own rule', () => {
  assert.deepEqual(tally({ scene: 'stateless-reply' }), [['q1', '10', 'permit'], ['q2', null, 'deny'], ['q3', null, 'deny']]);
  assert.deepEqual(tally({ scene: 'stateless-reply', fix: true }), [['q1', '10', 'permit'], ['q2', '20', 'permit'], ['q3', '20', 'permit']]);
  assert.deepEqual(path({ scene: 'stateless-reply', fix: true }, 'q2'), [['10', 'no'], ['20', 'match']]);
});

test('rule 3/4: the row that would have decided otherwise is found below the deciding one', () => {
  const pg = end({ scene: 'pg-hba-append' });
  assert.deepEqual(logic.laterMatch('pg', pg.rules, pg.requests[0], 1), { row: 6, label: '7', outcome: 'accept' });
  const acl = end({ scene: 'router-acl' });
  assert.deepEqual(logic.laterMatch('acl', acl.rules, acl.requests[1], 0), { row: 2, label: '30', outcome: 'permit' });
  assert.equal(logic.laterMatch('acl', acl.rules, acl.requests[0], 1), null);
});

test('rule 1: the next request starts with fresh marks; the tested row records every field', () => {
  assert.deepEqual(at({}, 4).marks, ['match', null, null, null, null, null]);
  assert.deepEqual(at({}, 1).test.fields, { type: false, db: true, user: true, addr: true });
});

test('rule 2: each field can miss on its own (fields no scene request tells apart)', () => {
  assert.equal(logic.fieldMatch('acl', 'srcPort', 443, 51000), false);
  assert.equal(logic.fieldMatch('acl', 'dst', '192.168.10.5/32', '192.168.10.6'), false);
  assert.equal(logic.fieldMatch('pg', 'user', 'studentdb', 'postgres'), false);
  assert.equal(logic.fieldMatch('pg', 'addr', '127.0.0.1/32', null), false);
  assert.equal(logic.inPrefix('203.0.112.9', '203.0.113.0/24'), false);
  assert.equal(logic.inPrefix('127.0.0.0', '127.0.0.1/32'), false);
  assert.equal(logic.checkMethod('peer', { fields: { osUser: 'student', user: 'postgres' } }).ok, false);
});

test('rule 7: shadowed by the first covering row; a number does not cover port any', () => {
  const r = (src, dstPort) => ({ match: { proto: 'tcp', src, srcPort: 'any', dst: 'any', dstPort } });
  assert.deepEqual(logic.shadowed('acl', [r('any', 22), r('10.0.0.0/8', 22), r('10.1.0.0/16', 22)]), [-1, 0, 0]);
  assert.deepEqual(logic.shadowed('acl', [r('any', 22), r('any', 'any')]), [-1, -1]);
});

// ── the fixes ──

test('fix: edit (pg), move with a new sequence number (ACL), add (ACL); the changed row is marked', () => {
  const pg = logic.applyFix(logic.SCENES['pg-hba'], true);
  assert.equal(pg[1].action, 'scram-sha-256');
  assert.deepEqual(pg.map((r) => r.fixed), [false, true, false, false, false, false]);
  const acl = logic.applyFix(logic.SCENES['router-acl'], true);
  assert.deepEqual(acl.map((r) => r.label), ['5', '10', '20']);
  assert.equal(acl[0].was, '30');
  assert.equal(acl[0].fixed, true);
  const st = logic.applyFix(logic.SCENES['stateless-reply'], true);
  assert.deepEqual(st.map((r) => r.label), ['10', '20']);
  assert.deepEqual(st[1].match, { proto: 'tcp', src: 'any', srcPort: 443, dst: '192.168.1.0/24', dstPort: 'any' });
  const top = logic.applyFix(logic.SCENES['permit-any-top'], true);
  assert.deepEqual(top.map((r) => r.label), ['20', '30', '40', '50']);
  assert.equal(top[3].action, 'permit');
  // ids stay unique, and the scene's own rows are not changed
  assert.equal(new Set(st.map((r) => r.id)).size, 2);
  assert.equal(logic.SCENES['router-acl'].rules[2].label, '30');
  assert.equal(logic.SCENES['pg-hba'].rules[1].action, 'ident');
});

test('fix: router-acl lets the admin\'s SSH in; permit-any-top denies again', () => {
  assert.deepEqual(tally({ scene: 'router-acl', fix: true }), [['q1', '20', 'permit'], ['q2', '5', 'permit'], ['q3', null, 'deny']]);
  assert.deepEqual(tally({ scene: 'permit-any-top', fix: true }), [['q1', '20', 'deny'], ['q2', '40', 'deny'], ['q3', '50', 'permit']]);
  assert.deepEqual(tally({ scene: 'pg-hba-append', fix: true }), [['q1', '2', 'accept'], ['q2', '1', 'accept'], ['q3', '3', 'reject']]);
});

// ── params, presets and step counts (SPEC.md tables) ──

test('step counts per scene, with and without the fix; defaults give sim.json steps', () => {
  const want = { 'pg-hba': [12, 12], 'pg-hba-append': [9, 9], 'router-acl': [7, 8], 'stateless-reply': [5, 5], 'permit-any-top': [3, 8] };
  for (const [scene, [off, on]] of Object.entries(want)) {
    assert.equal(logic.steps(P({ scene })), off, scene);
    assert.equal(logic.steps(P({ scene, fix: true })), on, scene + ' fix');
    assert.equal(logic.steps(P({ scene, mode: 'request' })), 3, scene + ' request mode');
  }
  const json = JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, logic.steps(P({})));
});

test('mode request: one step decides one request, with the same result and marks as row mode', () => {
  const rowEnds = all({ scene: 'router-acl' }).filter((s) => s.phase === 'decided');
  const reqSteps = all({ scene: 'router-acl', mode: 'request' });
  assert.equal(reqSteps.length, 3);
  reqSteps.forEach((s, i) => {
    assert.deepEqual(s.outcome, rowEnds[i].outcome);
    assert.deepEqual(s.marks, rowEnds[i].marks);
  });
});

test('param request: one request alone, its own steps; out of range means all', () => {
  assert.deepEqual(tally({ request: 3 }), [['q3', null, 'reject']]);
  assert.equal(logic.steps(P({ request: 3 })), 7);
  assert.equal(logic.steps(P({ request: 2 })), 2);
  assert.equal(logic.steps(P({ request: 9 })), 12);
  assert.equal(logic.steps(P({ scene: 'nope' })), 12);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const scene of logic.SCENE_IDS) {
    const p = P({ scene, fix: true });
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of [{}, { scene: 'permit-any-top', fix: true }, { scene: 'stateless-reply', mode: 'request' }]) {
    const p = P(over);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scene: 'pg-hba-append', fix: true });
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
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the model');
  const presets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)];
  assert.ok(presets.length >= 5, 'found the presets');
  for (const m of presets) {
    for (const k of [...m[1].matchAll(/(\w+):/g)].map((x) => x[1])) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const scene = m[1].match(/scene:\s*'([^']+)'/);
    if (scene) assert.ok(logic.SCENE_IDS.includes(scene[1]), scene[1]);
  }
});
