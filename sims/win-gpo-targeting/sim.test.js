// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-gpo-targeting's model (rules: SPEC.md). Run: node --test sims/win-gpo-targeting/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (p, n) => kit.stateAt(logic, P(p), n);
/** The mapped drives as "P K* H" (* = stale). */
const drives = (s) => ['P:', 'K:', 'H:', 'X:'].filter((l) => s.mapped[l]).map((l) => l[0] + (s.mapped[l].stale ? '*' : '')).join(' ');
/** The codes of the items evaluated in this step, as "P:map K:skip …". */
const codes = (s) => (s.event.cursor === 'all' ? [0, 1, 2, 3] : [s.event.cursor])
  .map((i) => logic.ITEMS[i].letter[0] + ':' + s.results[i].code).join(' ');
const run = (p) => {
  const out = [];
  for (let n = 1; n <= logic.steps(P(p)); n++) {
    const s = at(p, n);
    out.push(codes(s) + ' -> ' + drives(s));
  }
  return out;
};
const client = (over) => Object.assign({ groups: [], ip: '10.10.20.57', server: false }, over);
/** A state with the given items (for cases no preset reaches). */
function withItems(items, over) {
  const s = logic.initial(P(over));
  s.items = items.map((it) => Object.assign({ action: 'Update' }, it));
  s.history = items.map(() => false);
  s.results = items.map(() => null);
  return s;
}

// ── tie-break first ──

test('T1 (rule 6): two matching items for one letter: the later one is processed last and wins', () => {
  const a = { letter: 'S:', path: '\\\\a\\one', target: [] };
  const b = { letter: 'S:', path: '\\\\b\\two', target: [] };
  for (const [first, second] of [[a, b], [b, a]]) {
    const s = withItems([first, second]);
    const r = logic.pass(s);
    assert.equal(s.mapped['S:'].path, second.path, 'the later item\'s path');
    assert.equal(s.mapped['S:'].item, 1);
    assert.equal(r[1].code, 'map', 'it maps over the earlier one');
    assert.equal(r[1].before.path, first.path);
  }
  // the later one does not match: the earlier one keeps the letter
  const s = withItems([a, Object.assign({}, b, { target: [{ op: 'and', not: false, type: 'group', value: 'Nobody' }] })]);
  logic.pass(s);
  assert.equal(s.mapped['S:'].path, a.path);
  // and a non-matching item does not touch a drive another item mapped (no stale, no remove)
  const t = withItems([a, Object.assign({}, b, { target: [{ op: 'and', not: false, type: 'group', value: 'Nobody' }] })], { removeFlag: true });
  t.removeFlag = true;
  const r = logic.pass(t);
  assert.equal(r[1].code, 'skip');
  assert.equal(t.mapped['S:'].stale, false);
});

// ── rules ──

test('rule 1: a GPO that does not apply evaluates no item', () => {
  const s = logic.initial(P({}));
  s.user.tokenGroups = ['Projects'];
  s.gpoApplies = false;
  const r = logic.pass(s);
  assert.deepEqual(r.map((x) => x.code), ['noGpo', 'noGpo', 'noGpo', 'noGpo']);
  assert.deepEqual(s.mapped, {});
  assert.equal(r[0].match, null, 'not evaluated, not "no match"');
  assert.equal(at({}, 1).gpoApplies, true, 'the scene\'s GPO applies (linked at the root, Authenticated Users)');
});

test('rule 2: left to right, each term joined by its own AND/OR; "is not"; no targeting matches', () => {
  const A = { op: 'and', not: false, type: 'group', value: 'A' };
  const B = { op: 'or', not: false, type: 'group', value: 'B' };
  const C = { op: 'and', not: false, type: 'group', value: 'C' };
  // A OR B AND C = (A OR B) AND C, not A OR (B AND C)
  assert.equal(logic.evalTarget([A, B, C], client({ groups: ['A'] })).match, false);
  assert.equal(logic.evalTarget([A, B, C], client({ groups: ['A', 'C'] })).match, true);
  assert.equal(logic.evalTarget([A, B, C], client({ groups: ['B', 'C'] })).match, true);
  // C AND A OR B = (C AND A) OR B
  assert.equal(logic.evalTarget([C, Object.assign({}, A, { op: 'and' }), B], client({ groups: ['B'] })).match, true);
  // the first term's op is not read
  assert.equal(logic.evalTarget([Object.assign({}, B, { op: 'or' })], client({ groups: [] })).match, false);
  assert.equal(logic.evalTarget([], client()).match, true, 'no targeting');
  const notA = Object.assign({}, A, { not: true });
  assert.equal(logic.termHolds(notA, client({ groups: ['A'] })), false);
  assert.equal(logic.termHolds(notA, client({ groups: [] })), true);
  // X:'s expression: IP in Branch AND NOT a server
  const X = logic.ITEMS[3].target;
  assert.equal(logic.evalTarget(X, client({ ip: '10.20.0.57' })).match, true);
  assert.equal(logic.evalTarget(X, client({ ip: '10.20.0.57', server: true })).match, false, 'a server at Branch: no');
  assert.equal(logic.evalTarget(X, client({ ip: '10.10.20.57' })).match, false);
  assert.deepEqual(logic.evalTarget(X, client({ ip: '10.10.20.57', server: true })).terms, [false, false]);
  // range bounds are inclusive; the next address outside is not
  assert.ok(logic.termHolds(X[0], client({ ip: '10.20.0.0' })));
  assert.ok(logic.termHolds(X[0], client({ ip: '10.20.255.255' })));
  assert.ok(!logic.termHolds(X[0], client({ ip: '10.21.0.0' })));
  assert.ok(!logic.termHolds(X[0], client({ ip: '10.19.255.255' })));
  assert.equal(logic.ipToNumber('10.20.0.57'), 10 * 2 ** 24 + 20 * 2 ** 16 + 57);
});

test('rule 2: without targeting every item applies', () => {
  assert.deepEqual(run({ targeting: false, script: 'none' }), ['P:map K:map H:map X:map -> P K H X']);
  assert.deepEqual(at({ targeting: false, script: 'none' }, 1).results.map((r) => r.fails), [[], [], [], []]);
});

test('rule 3: group targeting reads the token; a group change counts from the next logon', () => {
  const s5 = at({ script: 'group' }, 5);
  assert.deepEqual(s5.user.groups, ['Cinematics'], 'the directory says Cinematics');
  assert.deepEqual(s5.user.tokenGroups, ['Projects'], 'the token still says Projects');
  assert.equal(s5.results[0].code, 'same', 'so P: still matches at the refresh');
  assert.equal(s5.results[1].code, 'skip', 'and K: does not');
  const s6 = at({ script: 'group' }, 6);
  assert.deepEqual(s6.user.tokenGroups, ['Cinematics']);
  assert.equal(s6.results[1].code, 'map');
  assert.deepEqual(s6.results[0].fails, ['group']);
  // eyardley the other way round
  assert.deepEqual(run({ user: 'eyardley', script: 'group' }).slice(4), [
    'P:skip K:same H:same X:skip -> K H',
    'P:map K:stale H:same X:skip -> P K* H'
  ]);
});

test('rule 4: the IP range reads the current address at the next pass', () => {
  const s5 = at({ script: 'move' }, 5);
  assert.equal(s5.pc.ip, '10.20.0.57');
  assert.equal(s5.pc.site, 'branch');
  assert.equal(s5.results[3].code, 'map');
  assert.deepEqual(at({ script: 'move' }, 4).results[3].fails, ['ip'], 'at HQ only the IP term fails');
  // starting at Branch: X: at the logon, then the laptop goes to HQ
  assert.equal(at({ location: 'branch', script: 'move' }, 4).results[3].code, 'map');
  assert.equal(at({ location: 'branch', script: 'move' }, 5).pc.ip, '10.10.20.57');
});

test('rule 5: no match leaves the drive (stale) unless Remove is set and the item was applied here', () => {
  const s = at({ script: 'group' }, 6);
  assert.equal(s.results[0].code, 'stale');
  assert.equal(s.mapped['P:'].stale, true);
  assert.equal(s.mapped['P:'].path, '\\\\hq-fs01\\projects');
  const r = at({ script: 'group', removeFlag: true }, 6);
  assert.equal(r.results[0].code, 'remove');
  assert.equal(r.mapped['P:'], undefined);
  assert.equal(r.history[0], false);
  // the same at Branch → HQ for X:
  assert.equal(at({ location: 'branch', script: 'move' }, 5).results[3].code, 'stale');
  assert.equal(at({ location: 'branch', script: 'move', removeFlag: true }, 5).results[3].code, 'remove');
  // Remove without history: nothing recorded as applied → the drive is not this item's to remove
  const t = withItems([{ letter: 'P:', path: '\\\\x', target: [{ op: 'and', not: false, type: 'group', value: 'Nobody' }] }], { removeFlag: true });
  t.removeFlag = true;
  t.mapped['P:'] = { path: '\\\\x', item: 0, stale: false };
  const out = logic.pass(t);
  assert.equal(out[0].code, 'stale', 'no history: left, not removed');
  // a stale drive whose item matches again is this item's own again: no longer stale
  const back = at({ location: 'branch', script: 'move' }, 5);
  assert.equal(back.mapped['X:'].stale, true);
  back.pc.ip = '10.20.0.57';
  const again = logic.pass(back);
  assert.equal(again[3].code, 'same');
  assert.equal(back.mapped['X:'].stale, false);
  // a skipped item that never mapped anything: skip, nothing mapped
  assert.equal(at({}, 2).results[1].code, 'skip');
  assert.equal(at({}, 2).mapped['K:'], undefined);
});

test('rule 5: the Remove option makes the action Replace; a matching item is "same" either way', () => {
  assert.equal(logic.actionOf(true), 'Replace');
  assert.equal(logic.actionOf(false), 'Update');
  assert.deepEqual(at({ removeFlag: true }, 0).items.map((i) => i.action), ['Replace', 'Replace', 'Replace', 'Replace']);
  assert.deepEqual(at({}, 0).items.map((i) => i.action), ['Update', 'Update', 'Update', 'Update']);
  assert.equal(at({ removeFlag: true }, 5).results[0].code, 'same');
});

test('the logon walk: one item per step, the token taken at the first; later items not yet evaluated', () => {
  const s1 = at({}, 1);
  assert.equal(s1.event.cursor, 0);
  assert.deepEqual(s1.user.tokenGroups, ['Projects']);
  assert.deepEqual(s1.results.map((r) => r && r.code), ['map', null, null, null]);
  assert.deepEqual(at({}, 3).results.map((r) => r && r.code), ['map', 'skip', 'map', null]);
  assert.equal(at({}, 0).user.tokenGroups, null, 'no token before the logon');
  // the relogon starts afresh: every result is from that pass
  assert.deepEqual(at({}, 6).results.map((r) => r.code), ['stale', 'map', 'same', 'skip']);
});

test('presets give the numbers in SPEC.md', () => {
  const pr = Object.fromEntries(logic.presets.map((x) => [x.id, x.params]));
  assert.deepEqual(run(pr['quillmoor-as-is']), ['P:map K:map H:map X:map -> P K H X']);
  assert.deepEqual(run(pr.targeted), ['P:map -> P', 'K:skip -> P', 'H:map -> P H', 'X:skip -> P H']);
  assert.deepEqual(run(Object.assign({}, pr.targeted, { user: 'eyardley' })), ['P:skip -> ', 'K:map -> K', 'H:map -> K H', 'X:skip -> K H']);
  assert.deepEqual(run(pr['branch-laptop']).slice(4), ['P:same K:skip H:same X:map -> P H X']);
  assert.deepEqual(run(pr['group-change']).slice(4), ['P:same K:skip H:same X:skip -> P H', 'P:stale K:map H:same X:skip -> P* K H']);
  assert.deepEqual(run(pr['remove-flag']).slice(4), ['P:same K:skip H:same X:skip -> P H', 'P:remove K:map H:same X:skip -> K H']);
  assert.deepEqual(run({ location: 'branch', script: 'move' }).slice(3), ['X:map -> P H X', 'P:same K:skip H:same X:stale -> P H X*']);
});

test('step counts: logon 4 (1 without targeting) + 0/1/2; at most 6; sim.json and the page agree', () => {
  const n = (over) => logic.steps(P(over));
  assert.deepEqual(['none', 'move', 'group'].map((script) => n({ script })), [4, 5, 6]);
  assert.deepEqual(['none', 'move', 'group'].map((script) => n({ script, targeting: false })), [1, 2, 3]);
  assert.deepEqual(logic.presets.map((x) => logic.steps(x.params)), [1, 4, 5, 6, 6]);
  const fs = require('node:fs'), path_ = require('node:path');
  const sim = JSON.parse(fs.readFileSync(path_.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults));
  const html = fs.readFileSync(path_.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults));
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k}`);
});

test('event times: logon 0, the change and refresh 100, the new logon the next day (1440)', () => {
  assert.deepEqual(logic.events(P({ script: 'group' })).map((e) => e.t), [0, 0, 0, 0, 100, 1440]);
  assert.deepEqual(logic.events(P({ script: 'move', targeting: false })).map((e) => e.t), [0, 100]);
});

test('log records each event', () => {
  assert.deepEqual(at({ script: 'move' }, 5).log.map((e) => e.kind + ':' + e.cursor),
    ['logon:0', 'logon:1', 'logon:2', 'logon:3', 'moveRefresh:all']);
});

// ── generic checks every sim keeps ──

const SAMPLE = [];
for (const user of Object.keys(logic.USERS)) {
  for (const location of Object.keys(logic.SITES)) {
    for (const script of ['none', 'move', 'group']) {
      for (const targeting of [true, false]) {
        for (const removeFlag of [false, true]) SAMPLE.push(P({ user, location, script, targeting, removeFlag }));
      }
    }
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
