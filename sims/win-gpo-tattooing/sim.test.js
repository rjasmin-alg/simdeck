// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-gpo-tattooing's model (rules: SPEC.md). Run: node --test sims/win-gpo-tattooing/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (p, n) => kit.stateAt(logic, P(p), n);
const POL = logic.pathOf(logic.ITEMS[0]);
const PREF = logic.pathOf(logic.ITEMS[1]);
/** One step as "kind | policy code value row | pref code value row" (rows 1-based, as SPEC.md). */
function line(s) {
  const f = (id) => {
    const it = s.items[id];
    return `${it.code} ${it.after === null ? '–' : it.after}${it.row >= 0 ? ' r' + (it.row + 1) : ''}`;
  };
  return `${s.event.t} ${s.event.kind} | ${f('policy')} | ${f('pref')}`;
}
const run = (p) => {
  const out = [];
  for (let n = 1; n <= logic.steps(P(p)); n++) out.push(line(at(p, n)));
  return out;
};
/** A state after the logon (both items applied), for events no script reaches. */
function applied(over) {
  const p = P(over);
  return logic.step(logic.initial(p), 1, p);
}

// ── tie-break first ──

test('T1 (rule 6): unlink and refresh in the same minute: the refresh runs without the GPO', () => {
  const s = at({ script: 'unlinkAtRefresh' }, 2);
  assert.equal(s.event.kind, 'unlinkRefresh');
  assert.equal(s.linked, false);
  assert.equal(s.items.policy.code, 'remove', 'the policy value goes in that same refresh');
  assert.equal(s.registry[POL], null);
  assert.equal(s.items.pref.code, 'tattoo');
  assert.equal(s.registry[PREF], 1);
  assert.equal(s.refreshes, 2, 'it is one pass, not zero');
  const r = at({ script: 'unlinkAtRefresh', removeWhenNotApplied: true }, 2);
  assert.equal(r.items.pref.code, 'remove', 'and with Remove the preference goes in that refresh too');
  assert.equal(r.registry[PREF], null);
});

// ── rules ──

test('rule 1: a policy under a Policies key is written while the GPO applies and deleted when it no longer does', () => {
  assert.ok(logic.isPolicyKey(logic.ITEMS[0].key));
  assert.ok(logic.isPolicyKey('HKLM\\Software\\Policies\\Microsoft\\Windows'));
  assert.ok(logic.isPolicyKey('HKCU\\Software\\Policies'));
  assert.ok(!logic.isPolicyKey('HKCU\\Software\\PoliciesX'), 'a prefix that is not the key');
  assert.ok(logic.isPolicyKey('HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer'), 'long hive name');
  assert.ok(logic.isPolicyKey('hkcu\\software\\policies\\x'), 'case does not matter');
  assert.ok(!logic.isPolicyKey(logic.ITEMS[1].key));
  assert.equal(at({}, 1).registry[POL], 1);
  const s = at({}, 3);
  assert.equal(s.items.policy.code, 'remove');
  assert.equal(s.items.policy.row, 1);
  assert.equal(s.registry[POL], null);
});

test('rule 2: a preference stays when the GPO no longer applies (tattoo); Remove deletes it and makes the action Replace', () => {
  const s = at({}, 3);
  assert.equal(s.items.pref.code, 'tattoo');
  assert.equal(s.items.pref.row, 4);
  assert.equal(s.registry[PREF], 1);
  const r = at({ removeWhenNotApplied: true }, 3);
  assert.equal(r.items.pref.code, 'remove');
  assert.equal(r.items.pref.row, 3);
  assert.equal(r.registry[PREF], null, 'deleted, not set back to an earlier value');
  assert.equal(logic.actionOf({ removeWhenNotApplied: true }), 'Replace');
  assert.equal(logic.actionOf({ removeWhenNotApplied: false }), 'Update');
});

test('rule 2: Remove deletes only what this computer recorded as applied', () => {
  const p = P({ removeWhenNotApplied: true });
  const s = logic.initial(p);
  s.registry[PREF] = 1;                     // set by someone else, never by this item here
  const out = logic.pass(s, false);
  assert.equal(out.pref.code, 'none');
  assert.equal(s.registry[PREF], 1);
});

test('rule 3: a preference is reapplied at each refresh: the user\'s 0 is overwritten with 1', () => {
  assert.equal(at({ script: 'edit' }, 2).registry[PREF], 0);
  const s = at({ script: 'edit' }, 3);
  assert.equal(s.items.pref.code, 'overwrite');
  assert.equal(s.items.pref.before, 0);
  assert.equal(s.registry[PREF], 1);
  assert.equal(at({ script: 'edit', removeWhenNotApplied: true }, 3).registry[PREF], 1, 'Replace too');
});

test('rule 3: Apply once: not reapplied after the first time, the user\'s 0 stays; the first pass does apply', () => {
  const first = at({ script: 'edit', applyOnce: true }, 1);
  assert.equal(first.items.pref.code, 'write');
  assert.equal(first.registry[PREF], 1);
  const s = at({ script: 'edit', applyOnce: true }, 3);
  assert.equal(s.items.pref.code, 'once');
  assert.equal(s.items.pref.row, 5);
  assert.equal(s.registry[PREF], 0);
});

test('rule 4: the user changes the preference; the policy is refused and stays', () => {
  const s = at({ script: 'try' }, 2);
  assert.equal(s.items.pref.code, 'userSet');
  assert.equal(s.registry[PREF], 0);
  assert.equal(s.items.policy.code, 'blocked');
  assert.equal(s.registry[POL], 1);
  assert.deepEqual(s.userEdits.map((e) => [e.item, e.ok]), [['pref', true], ['policy', false]]);
  const e = applied({});
  assert.equal(logic.userChange(e, logic.ITEMS[0], null).ok, false);
  assert.equal(e.registry[POL], 1);
});

test('rule 5: a "policy" written outside the Policies keys (old ADM) tattoos; inside it does not', () => {
  const adm = { id: 'adm', kind: 'policy', key: 'HKCU\\Software\\Quillmoor\\Legacy', name: 'NoProxyPage', value: 1 };
  const r = logic.ruleFor(adm, false, { removeWhenNotApplied: true, applyOnce: false }, true);
  assert.equal(r.row, 2);
  assert.equal(logic.ROWS[r.row].act, 'leave');
  assert.deepEqual(r.hits.slice(0, 3), [false, false, true]);
  assert.equal(logic.ruleFor(logic.ITEMS[0], false, {}, true).row, 1);
  assert.equal(logic.userChange(applied({}), adm, 0).ok, true, 'and the user may change it');
});

test('rule 7: unlinking alone changes nothing on the PC; the next refresh does', () => {
  const before = at({}, 1), s = at({}, 2);
  assert.equal(s.event.kind, 'unlink');
  assert.equal(s.linked, false);
  assert.deepEqual(s.registry, before.registry);
  assert.equal(s.refreshes, before.refreshes);
  assert.equal(s.items.policy.code, 'waits');
  assert.equal(s.items.pref.code, 'waits');
  assert.equal(s.items.policy.hits, null, 'no pass: the table reads no row');
  assert.equal(s.items.pref.hits, null);
});

test('rule table: first match per kind, Remove (row 4) before tattoo (5), Apply once (6) before write (7)', () => {
  const pref = logic.ITEMS[1];
  const both = { removeWhenNotApplied: true, applyOnce: true };
  assert.equal(logic.ruleFor(pref, false, both, true).row, 3);
  assert.equal(logic.ruleFor(pref, false, {}, true).row, 4);
  assert.equal(logic.ruleFor(pref, true, both, true).row, 5);
  assert.equal(logic.ruleFor(pref, true, both, false).row, 6, 'Apply once, never applied: written');
  assert.equal(logic.ruleFor(pref, true, {}, true).row, 6);
  const hits = logic.ruleFor(pref, false, {}, true).hits;
  assert.deepEqual(hits, [null, null, null, false, true, null, null], 'own kind only; nothing read below the match');
  for (const item of logic.ITEMS) {
    for (const applies of [true, false]) {
      for (const f of [{}, both]) {
        const r = logic.ruleFor(item, applies, f, true);
        assert.ok(r.row >= 0, 'every case has a row');
        assert.equal(logic.ROWS[r.row].kind, item.kind);
      }
    }
  }
});

// ── the presets' numbers (SPEC.md, "Expected numbers") ──

const PRESET = Object.fromEntries(logic.presets.map((pr) => [pr.id, pr.params]));

test('preset unlink', () => {
  assert.deepEqual(run(PRESET.unlink), [
    '0 logon | write 1 r1 | write 1 r7',
    '30 unlink | waits 1 | waits 1',
    '100 refresh | remove – r2 | tattoo 1 r5'
  ]);
});

test('preset remove-flag', () => {
  assert.deepEqual(run(PRESET['remove-flag']), [
    '0 logon | write 1 r1 | write 1 r7',
    '30 unlink | waits 1 | waits 1',
    '100 refresh | remove – r2 | remove – r4'
  ]);
});

test('preset user-edit', () => {
  assert.deepEqual(run(PRESET['user-edit']), [
    '0 logon | write 1 r1 | write 1 r7',
    '30 edit | untouched 1 | userSet 0',
    '100 refresh | same 1 r1 | overwrite 1 r7'
  ]);
});

test('preset apply-once', () => {
  assert.deepEqual(run(PRESET['apply-once']), [
    '0 logon | write 1 r1 | write 1 r7',
    '30 edit | untouched 1 | userSet 0',
    '100 refresh | same 1 r1 | once 0 r6'
  ]);
});

test('preset policy-locked', () => {
  assert.deepEqual(run(PRESET['policy-locked']), [
    '0 logon | write 1 r1 | write 1 r7',
    '30 try | blocked 1 | userSet 0'
  ]);
});

test('unlink at a refresh: one event at t = 100 (the page captions read its time)', () => {
  assert.deepEqual(run({ script: 'unlinkAtRefresh' }), [
    '0 logon | write 1 r1 | write 1 r7',
    '100 unlinkRefresh | remove – r2 | tattoo 1 r5'
  ]);
});

test('log and user edits record each event with its time', () => {
  const s = at({ script: 'try' }, 2);
  assert.deepEqual(s.log, [{ t: 0, kind: 'logon' }, { t: 30, kind: 'try' }]);
  assert.deepEqual(s.userEdits, [{ t: 30, item: 'pref', value: 0, ok: true }, { t: 30, item: 'policy', value: null, ok: false }]);
});

test('step counts: 3, 2, 3, 2; at most 3; sim.json and the page agree', () => {
  assert.deepEqual(Object.keys(logic.SCRIPTS).map((k) => logic.steps(P({ script: k }))), [3, 2, 3, 2]);
  assert.equal(logic.presets.length, 5);
  const fs = require('node:fs'), path_ = require('node:path');
  const sim = JSON.parse(fs.readFileSync(path_.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults));
  const html = fs.readFileSync(path_.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults));
  for (const pr of logic.presets) {
    for (const [k, v] of Object.entries(pr.params)) {
      assert.ok(k in logic.defaults, `preset param ${k}`);
      if (k === 'script') assert.ok(v in logic.SCRIPTS, `script ${v}`);
    }
  }
});

// ── generic checks every sim keeps ──

const SAMPLE = [];
for (const script of Object.keys(logic.SCRIPTS)) {
  for (const removeWhenNotApplied of [false, true]) {
    for (const applyOnce of [false, true]) SAMPLE.push(P({ script, removeWhenNotApplied, applyOnce }));
  }
}

test('state is JSON-safe at every step', () => {
  for (const p of SAMPLE) {
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of SAMPLE) {
    const steps = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const p of SAMPLE) {
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});
