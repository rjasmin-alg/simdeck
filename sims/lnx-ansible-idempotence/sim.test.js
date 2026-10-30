// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-ansible-idempotence. Rules and expected numbers: SPEC.md. Run: node --test sims/lnx-ansible-idempotence/
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
const recap = (over) => end(over).recap.map((r) => [r.A.exit, `${r.B.ok}/${r.B.changed}/${r.B.failed}`]);
const outcomes = (s, side) => s.results[side].map((r) => (r ? r.outcome : null));

// ── tie-breaks first ──

test('tie-break: set -e stops only until the end of the run; the next run starts the script fresh', () => {
  const p = { play: 'three', runs: 3 };
  const run2 = at(p, 6);
  assert.deepEqual(outcomes(run2, 'A'), ['done', 'error', 'skipped']);
  assert.equal(run2.stopped.A, true);
  const run3first = at(p, 7);
  assert.equal(run3first.stopped.A, false);
  assert.deepEqual(outcomes(run3first, 'A'), ['done', null, null]);
  assert.equal(run3first.exitA, 0);
});

test('tie-break: set -e never stops the playbook; B runs every task while A is stopped', () => {
  const s = at({ play: 'three', runs: 2 }, 6);
  assert.deepEqual(outcomes(s, 'B'), ['ok', 'ok', 'ok']);
});

test('tie-break: the manual edit needs two runs and the hosts line; the model ignores it otherwise', () => {
  assert.equal(logic.steps(P({ play: 'hosts', runs: 1, manualEdit: true })), 1);
  assert.equal(logic.steps(P({ play: 'handler', runs: 2, manualEdit: true })), 4);
  assert.equal(logic.steps(P({ play: 'hosts', runs: 2, manualEdit: true })), 3);
  assert.equal(at({ play: 'hosts', runs: 2, manualEdit: true }, 2).edit, true);
  assert.equal(at({ play: 'handler', runs: 2, manualEdit: true }, 3).edit, false);
});

test('tie-break: the edit deletes the line on both hosts, and only that line; the next run clears the edit flag', () => {
  const s = at({ play: 'three', runs: 3, manualEdit: true }, 4);
  assert.equal(s.edit, true);
  assert.deepEqual(s.hosts.A.hostsLines, ['127.0.0.1 localhost']);
  assert.deepEqual(s.hosts.B.hostsLines, ['127.0.0.1 localhost']);
  assert.deepEqual(s.hosts.A.dirs, ['/srv/app']);
  const next = at({ play: 'three', runs: 3, manualEdit: true }, 5);
  assert.equal(next.edit, false);
  assert.equal(next.run, 2);
  assert.equal(at({ play: 'hosts', runs: 2, manualEdit: true }, 3).edit, false);
});

test('tie-break: a guard on the left of || does not stop a set -e script', () => {
  const s = end({ play: 'guarded', runs: 2, setE: true });
  assert.equal(s.stopped.A, false);
  assert.deepEqual(outcomes(s, 'A'), ['done', 'done', 'done']);
});

// ── rules ──

test('rule 1: the script appends the line again every run, exit 0', () => {
  const s = end({ play: 'hosts', runs: 3 });
  assert.equal(logic.copies(s.hosts.A), 3);
  assert.deepEqual(s.recap.map((r) => r.A.exit), [0, 0, 0]);
  assert.equal(at({ play: 'hosts', runs: 3 }, 2).results.A[0].msg, 'again');
  assert.equal(at({ play: 'hosts', runs: 3 }, 1).results.A[0].msg, 'append');
  assert.ok(s.results.A[0].changed);
});

test('rule 2: the module acts only on a difference: changed once, then ok', () => {
  const p = { play: 'hosts', runs: 3 };
  assert.deepEqual([1, 2, 3].map((n) => at(p, n).results.B[0].outcome), ['changed', 'ok', 'ok']);
  assert.equal(logic.copies(end(p).hosts.B), 1);
  const three = end({ play: 'three', runs: 2 });
  assert.deepEqual(three.hosts.B.dirs, ['/srv/app']);
  assert.deepEqual(three.hosts.B.users, ['root', 'deploy']);
});

test('rule 3: mkdir on an existing directory exits 1, useradd for an existing user exits 9; nothing changes', () => {
  const s = at({ play: 'three', runs: 2, setE: false }, 6);
  assert.deepEqual(s.results.A.map((r) => r.exit), [0, 1, 9]);
  assert.deepEqual(s.results.A.map((r) => r.changed), [true, false, false]);
  assert.deepEqual(s.hosts.A.dirs, ['/srv/app']);
  assert.deepEqual(s.hosts.A.users, ['root', 'deploy']);
});

test('rule 4: set -e stops at the first failing line with its status; without it the last line\'s status wins', () => {
  assert.deepEqual(recap({ play: 'three', runs: 2, setE: true }).map((r) => r[0]), [0, 1]);
  assert.deepEqual(recap({ play: 'three', runs: 2, setE: false }).map((r) => r[0]), [0, 9]);
  const skipped = at({ play: 'three', runs: 2, setE: true }, 6).results.A[2];
  assert.equal(skipped.outcome, 'skipped');
  assert.equal(skipped.exit, null);
  assert.deepEqual(end({ play: 'three', runs: 3 }).recap.map((r) => r.A.stopped), [false, true, true], 'the stop is kept per run');
});

test('rule 4: without set -e a later success hides an earlier failure (the last line\'s status)', () => {
  logic.PLAYS.test = ['dir', 'line'];
  try {
    assert.equal(end({ play: 'test', runs: 2, setE: false }).recap[1].A.exit, 0);
    assert.equal(end({ play: 'test', runs: 2, setE: true }).recap[1].A.exit, 1);
  } finally { delete logic.PLAYS.test; }
});

test('rule 5: the guarded script ends identical to the playbook\'s host, exit 0 both runs', () => {
  const s = end({ play: 'guarded', runs: 2 });
  assert.deepEqual(s.hosts.A, s.hosts.B);
  assert.deepEqual(s.recap.map((r) => r.A.exit), [0, 0]);
  assert.deepEqual(s.results.A.map((r) => r.changed), [false, false, false]);
  assert.deepEqual(s.results.A.map((r) => r.msg), ['guard', 'guard', 'guard']);
});

test('rule 6: the handler runs once, only after a changed notify; the script restarts every run', () => {
  const p = { play: 'handler', runs: 2 };
  assert.equal(at(p, 1).hosts.B.restarts, 0, 'not during the task');
  assert.equal(at(p, 2).hosts.B.restarts, 1, 'in the handlers phase');
  assert.equal(at(p, 2).results.B[1].outcome, 'changed');
  assert.equal(at(p, 3).results.B[0].outcome, 'ok');
  assert.equal(at(p, 3).notified, false);
  assert.equal(at(p, 4).results.B[1].outcome, 'none');
  assert.equal(end(p).hosts.B.restarts, 1);
  assert.equal(end(p).hosts.A.restarts, 2);
  assert.deepEqual(at(p, 3).results.A[0], { outcome: 'done', exit: 0, changed: true, msg: 'again' }, 'cp rewrites the file every run');
});

test('rule 7: recap ok counts the changed tasks too; changed is the subset; handlers that ran count', () => {
  assert.deepEqual(recap({ play: 'three', runs: 2 }).map((r) => r[1]), ['3/3/0', '3/0/0']);
  assert.deepEqual(recap({ play: 'handler', runs: 2 }).map((r) => r[1]), ['2/2/0', '1/0/0']);
});

test('rule 8: drift: after the edit B restores the line (changed) and A appends it once more', () => {
  const p = { play: 'hosts', runs: 2, manualEdit: true };
  assert.deepEqual(recap(p), [[0, '1/1/0'], [0, '1/1/0']]);
  assert.equal(logic.copies(end(p).hosts.A), 1);
  assert.equal(logic.copies(end(p).hosts.B), 1);
  assert.equal(logic.copies(end({ play: 'hosts', runs: 2 }).hosts.A), 2, 'without the edit: a duplicate');
  assert.equal(end(p).edited, true);
});

// ── presets: the task's numbers ──

test('presets: expected numbers (SPEC.md table)', () => {
  const rows = [
    [{ play: 'hosts', runs: 3 }, 3, [[0, '1/1/0'], [0, '1/0/0'], [0, '1/0/0']], 3, 1],
    [{ play: 'three', runs: 2 }, 6, [[0, '3/3/0'], [1, '3/0/0']], 2, 1],
    [{ play: 'guarded', runs: 2 }, 6, [[0, '3/3/0'], [0, '3/0/0']], 1, 1],
    [{ play: 'hosts', runs: 2, manualEdit: true }, 3, [[0, '1/1/0'], [0, '1/1/0']], 1, 1],
    [{ play: 'handler', runs: 2 }, 4, [[0, '2/2/0'], [0, '1/0/0']], 0, 0]
  ];
  for (const [p, steps, want, copiesA, copiesB] of rows) {
    assert.equal(logic.steps(P(p)), steps, JSON.stringify(p));
    assert.deepEqual(recap(p), want, JSON.stringify(p));
    assert.equal(logic.copies(end(p).hosts.A), copiesA);
    assert.equal(logic.copies(end(p).hosts.B), copiesB);
  }
  assert.deepEqual(recap({ play: 'three', runs: 3, manualEdit: true }), [[0, '3/3/0'], [1, '3/1/0'], [1, '3/0/0']]);
  assert.equal(logic.steps(P({ play: 'three', runs: 3, manualEdit: true })), 10);
});

test('results are written only at the end of a run', () => {
  const p = { play: 'three', runs: 2 };
  assert.equal(at(p, 2).recap.length, 0);
  assert.equal(at(p, 3).recap.length, 1);
  assert.equal(at(p, 5).recap.length, 1);
  assert.equal(at(p, 6).recap.length, 2);
  assert.deepEqual(at(p, 4).results.B, [{ outcome: 'ok' }, null, null], 'a new run clears the results');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = { play: 'three', runs: 3, setE: false, manualEdit: true };
  for (let n = 0; n <= logic.steps(P(p)); n++) {
    const s = at(p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ play: 'handler', runs: 3 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) { s = logic.step(s, i, p); forward.push(s); }
  for (let i = n; i >= 0; i--) assert.deepEqual(kit.stateAt(logic, p, i), forward[i]);
});

test('step does not mutate its input', () => {
  const p = P({ play: 'three', runs: 2, manualEdit: true });
  for (let n = 0; n < logic.steps(p); n++) {
    const s = kit.stateAt(logic, p, n);
    const copy = structuredClone(s);
    logic.step(s, n + 1, p);
    assert.deepEqual(s, copy);
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const presets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)];
  assert.equal(presets.length, 5);
  for (const m of presets) {
    const keys = [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]);
    for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const play = m[1].match(/play:\s*'([^']+)'/);
    assert.ok(play && play[1] in logic.PLAYS, 'each preset names its play');
  }
});
