// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-trusts' model (SPEC.md). Run: node --test sims/win-trusts/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const Q = 'quillmoor.example', BRK = 'brk.quillmoor.example', EMB = 'emberline.example', PFX = 'pfx.internal', CAR = 'carrow.example';
const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const stepsOf = (over) => kit.stepsOf(logic, P(over));
const end = (over) => at(over, stepsOf(over));
const kinds = (over) => end(over).log.map((x) => x.kind + (x.ok === null ? '' : x.ok ? '+' : '-')).join(' ');
/** The test record after the step where test number k (1-based) ended. */
function testEnd(over, k) {
  const N = stepsOf(over);
  for (let n = 1; n <= N; n++) {
    const s = at(over, n);
    if (s.tests === k && s.test && s.test.verdict) return s.test;
  }
  throw new Error('no test ' + k);
}
const PRESETS = {
  'in-forest': { scenario: 'in-forest', userDomain: BRK, resourceDomain: EMB },
  'quillmoor-pellucid': { scenario: 'quillmoor-pellucid', userDomain: BRK, resourceDomain: PFX, sidFilter: false },
  'one-way': { scenario: 'one-way', userDomain: CAR, resourceDomain: Q },
  'no-third-forest': { scenario: 'no-third-forest', userDomain: Q, resourceDomain: CAR },
  selective: { scenario: 'selective', userDomain: CAR, resourceDomain: Q, selective: true }
};
/** Trusts as plain objects for findPath. */
function tr(id, from, to, type, twoWay) { return { id, from, to, type, twoWay, transitive: type !== 'external' }; }
const AUTO = [tr(1, Q, BRK, 'parent-child', true), tr(2, Q, EMB, 'tree-root', true)];

// ── tie-breaks first ──

test('T1: the shortest path wins; a shortcut (rule 5) gives brk → emberline in one hop', () => {
  assert.deepEqual(logic.findPath(AUTO, BRK, EMB).path, [BRK, Q, EMB]);
  const withShortcut = AUTO.concat([tr(3, BRK, EMB, 'shortcut', true)]);
  assert.deepEqual(logic.findPath(withShortcut, BRK, EMB).path, [BRK, EMB]);
  assert.equal(stepsOf({ scenario: 'in-forest', userDomain: BRK, resourceDomain: EMB, shortcut: true }), 2);
});

test('T1: among equally short paths, the one with the smaller trust ids hop by hop', () => {
  // two one-hop routes from pfx to quillmoor: an external trust (id 5) and a forest trust (id 4)
  const t = AUTO.concat([tr(4, Q, PFX, 'forest', true), tr(5, Q, PFX, 'external', true)]);
  assert.deepEqual(logic.findPath(t, PFX, Q).hops, [4]);
  const t2 = AUTO.concat([tr(4, Q, PFX, 'external', true), tr(5, Q, PFX, 'forest', true)]);
  assert.deepEqual(logic.findPath(t2, PFX, Q).hops, [4]);
  // stored out of id order: the ids decide, not the order in the list
  const t3 = AUTO.concat([tr(5, Q, PFX, 'forest', true), tr(4, Q, PFX, 'external', true)]);
  assert.deepEqual(logic.findPath(t3, PFX, Q).hops, [4]);
});

test('T2: user and resource in the same domain: no hop, the verdict alone in one step', () => {
  assert.equal(stepsOf({ scenario: 'in-forest', userDomain: CAR, resourceDomain: CAR }), 1);
  const t = end({ scenario: 'in-forest', userDomain: CAR, resourceDomain: CAR });
  assert.deepEqual(t.test.path, [CAR]);
  assert.equal(t.test.verdict, 'allow');
});

test('block reason order: external before third forest before direction before none', () => {
  // brk → pfx with an external Q–pfx: the naive path holds the external trust
  assert.equal(logic.blockOf(AUTO.concat([tr(3, Q, PFX, 'external', true)]), BRK, PFX).rule, 'external');
  // a naive path over an external and two forest trusts: external still wins
  const mixed = AUTO.concat([tr(3, Q, PFX, 'forest', true), tr(4, PFX, CAR, 'external', true)]);
  assert.equal(logic.blockOf(mixed, BRK, CAR).rule, 'external');
  assert.equal(logic.blockOf(AUTO.concat([tr(3, Q, PFX, 'forest', true), tr(4, PFX, CAR, 'forest', true)]), Q, CAR).rule, 'third-forest');
  assert.equal(logic.blockOf(AUTO.concat([tr(3, Q, CAR, 'forest', false)]), Q, CAR).rule, 'direction');
  const dir = logic.blockOf(AUTO.concat([tr(3, Q, CAR, 'forest', false)]), BRK, CAR);
  assert.deepEqual([dir.rule, dir.at, dir.path], ['direction', -1, [CAR, Q, BRK]]);
  // the external trust first, then a chained hop: the ✕ on the chained hop
  const ext = logic.blockOf(AUTO.concat([tr(3, Q, PFX, 'external', true)]), PFX, BRK);
  assert.deepEqual([ext.rule, ext.at, ext.path], ['external', 1, [PFX, Q, BRK]]);
  assert.equal(logic.blockOf(AUTO, Q, CAR).rule, 'none');
});

// ── rules ──

test('rule 1: access flows against the trust arrow; two-way = both directions', () => {
  const oneWay = AUTO.concat([tr(3, Q, CAR, 'forest', false)]);
  assert.ok(logic.findPath(oneWay, CAR, Q), 'quillmoor trusts carrow: carrow users may access quillmoor');
  assert.equal(logic.findPath(oneWay, Q, CAR), null, 'carrow does not trust quillmoor');
  const twoWay = AUTO.concat([tr(3, Q, CAR, 'forest', true)]);
  assert.ok(logic.findPath(twoWay, Q, CAR));
  assert.equal(kinds(PRESETS['one-way']), 'create hop verdict+ blocked-');
  assert.equal(end(PRESETS['one-way']).test.block, 'direction');
});

test('rule 2: inside a forest every domain reaches every other from the start', () => {
  const init = logic.initialTrusts(P({ scenario: 'in-forest' }));
  assert.deepEqual(init.map((t) => [t.type, t.twoWay, t.transitive]), [['parent-child', true, true], ['tree-root', true, true]]);
  for (const u of [Q, BRK, EMB]) for (const r of [Q, BRK, EMB]) if (u !== r) assert.ok(logic.findPath(init, u, r), `${u} → ${r}`);
  assert.equal(kinds(PRESETS['in-forest']), 'hop hop verdict+');
  assert.deepEqual(end(PRESETS['in-forest']).test.path, [BRK, Q, EMB]);
});

test('rule 3: a forest trust is transitive inside both forests but not to a third forest', () => {
  const t = AUTO.concat([tr(3, Q, PFX, 'forest', true), tr(4, PFX, CAR, 'forest', true)]);
  assert.deepEqual(logic.findPath(t, BRK, PFX).path, [BRK, Q, PFX], 'brk, a child, reaches pfx over the forest root');
  assert.deepEqual(logic.findPath(t, PFX, EMB).path, [PFX, Q, EMB], 'and pfx reaches the second tree');
  assert.equal(logic.findPath(t, Q, CAR), null);
  assert.equal(logic.findPath(t, CAR, BRK), null);
  assert.equal(kinds(PRESETS['no-third-forest']), 'create create blocked-');
  const s = end(PRESETS['no-third-forest']);
  assert.equal(s.test.block, 'third-forest');
  assert.deepEqual(s.test.why.path, [Q, PFX, CAR]);
  assert.equal(s.test.why.at, 1, 'the ✕ on the second forest trust');
});

test('rule 4: an external trust links only its two domains', () => {
  const t = AUTO.concat([tr(3, Q, PFX, 'external', true)]);
  assert.deepEqual(logic.findPath(t, PFX, Q).path, [PFX, Q]);
  assert.equal(logic.findPath(t, BRK, PFX), null, 'not from the child');
  assert.equal(logic.findPath(t, PFX, BRK), null, 'nor to the child');
  assert.equal(logic.findPath(t, PFX, EMB), null, 'nor to the second tree');
  assert.equal(kinds(PRESETS['quillmoor-pellucid']), 'create hop verdict+ blocked-');
  const s = end(PRESETS['quillmoor-pellucid']);
  assert.equal(s.test.block, 'external');
  assert.deepEqual(s.test.why.path, [BRK, Q, PFX]);
  assert.equal(s.test.why.at, 1);
  const created = s.trusts[s.trusts.length - 1];
  assert.deepEqual([created.type, created.twoWay, created.transitive, created.sidFiltering], ['external', true, false, false]);
});

test('rule 5: a shortcut never changes who can access what', () => {
  for (const sc of logic.SCENARIOS) {
    for (const u of logic.IDS) for (const r of logic.IDS) {
      const a = testEnd({ scenario: sc, userDomain: u, resourceDomain: r, shortcut: false }, sc === 'quillmoor-pellucid' ? 2 : 1);
      const b = testEnd({ scenario: sc, userDomain: u, resourceDomain: r, shortcut: true }, sc === 'quillmoor-pellucid' ? 2 : 1);
      assert.equal(a.verdict, b.verdict, `${sc} ${u} → ${r}`);
    }
  }
});

test('rule 6: trust is not permission; without the ACE the verdict is ✕', () => {
  const t = testEnd({ scenario: 'quillmoor-pellucid', aceGranted: false }, 1);
  assert.deepEqual(t.path, [PFX, Q]);
  assert.equal(t.verdict, 'deny');
  assert.equal(t.block, 'ace');
  assert.equal(testEnd({ scenario: 'quillmoor-pellucid', aceGranted: true }, 1).verdict, 'allow');
});

test('rule 7: selective authentication refuses without "Allowed to Authenticate", even with the ACE', () => {
  assert.equal(kinds(PRESETS.selective), 'hop verdict- grant verdict+');
  const first = testEnd(PRESETS.selective, 1);
  assert.equal(first.block, 'selective');
  assert.equal(first.checks.ace.granted, true);
  assert.equal(testEnd(PRESETS.selective, 2).verdict, 'allow');
  // off: allowed at once
  assert.equal(kinds(Object.assign({}, PRESETS.selective, { selective: false })), 'hop verdict+ grant verdict+');
  // checked before the ACE: neither → the selective block is reported
  assert.equal(testEnd(Object.assign({}, PRESETS.selective, { aceGranted: false }), 1).block, 'selective');
  // only across the trust: inside the forest it does not apply
  const inside = testEnd(Object.assign({}, PRESETS.selective, { userDomain: BRK }), 1);
  assert.equal(inside.checks.selective.applies, false);
  assert.equal(inside.verdict, 'allow');
});

test('rule 8: SID filtering drops SIDs from outside the trusted domain or forest; off, every SID counts', () => {
  const base = { scenario: 'quillmoor-pellucid', aceGranted: false, sidHistory: true };
  const on = testEnd(Object.assign({ sidFilter: true }, base), 1);
  assert.deepEqual(on.checks.token.map((x) => [x.sid, x.kept]), [['PELLUCID\\jwren', true], ['PELLUCID\\Domain Users', true], ['QUILLMOOR\\Domain Admins', false]]);
  assert.equal(on.verdict, 'deny');
  const off = testEnd(Object.assign({ sidFilter: false }, base), 1);
  assert.equal(off.checks.token[2].kept, true);
  assert.equal(off.checks.viaAdmin, true);
  assert.equal(off.verdict, 'allow');
  // forest trust: SIDs of the trusted forest are kept, the resource forest's dropped
  const forest = testEnd({ scenario: 'one-way', userDomain: CAR, resourceDomain: BRK, aceGranted: false, sidHistory: true }, 1);
  assert.equal(forest.checks.filtered, true);
  assert.deepEqual(forest.checks.token.map((x) => x.kept), [true, true, false]);
  // inside a forest: nothing filtered
  const inForest = testEnd({ scenario: 'in-forest', userDomain: BRK, resourceDomain: EMB, aceGranted: false, sidHistory: true }, 1);
  assert.equal(inForest.checks.filtered, false);
  assert.equal(inForest.verdict, 'allow');
  // default on for the scenario's trusts, never on in-forest ones
  const s = end({ scenario: 'no-third-forest' });
  assert.deepEqual(s.trusts.map((t) => t.sidFiltering), [false, false, true, true]);
});

test('rule 8 + 7: an honoured Domain Admins SID also passes selective authentication (external trust)', () => {
  const t = testEnd({ scenario: 'quillmoor-pellucid', selective: true, sidFilter: false, sidHistory: true, aceGranted: false }, 1);
  assert.equal(t.checks.selective.applies, true);
  assert.equal(t.checks.selective.ok, true);
  assert.equal(t.verdict, 'allow');
  assert.equal(testEnd({ scenario: 'quillmoor-pellucid', selective: true, sidFilter: true, sidHistory: true }, 1).block, 'selective');
});

test('rule 8: across a forest trust the trusting forest\'s own SIDs are dropped even with filtering off', () => {
  const t = testEnd({ scenario: 'one-way', userDomain: CAR, resourceDomain: Q, aceGranted: false, sidHistory: true, sidFilter: false }, 1);
  assert.equal(t.checks.filtered, false);
  assert.equal(t.checks.forestSpecific, true);
  assert.deepEqual(t.checks.token.map((x) => x.kept), [true, true, false]);
  assert.equal(t.checks.token[2].forestSpecific, true);
  assert.equal(t.verdict, 'deny');
  // and selective authentication is not passed by that SID either
  assert.equal(testEnd(Object.assign({}, PRESETS.selective, { sidFilter: false, sidHistory: true }), 1).block, 'selective');
});

test('rule 8: no SID history entry when user and resource share a domain', () => {
  const t = testEnd({ scenario: 'in-forest', userDomain: CAR, resourceDomain: CAR, aceGranted: false, sidHistory: true }, 1);
  assert.equal(t.checks.token.length, 2);
  assert.equal(t.verdict, 'deny');
});

test('rule 7: the selective scenario\'s forest trust is two-way; the grant step clears the test card', () => {
  const back = { scenario: 'selective', userDomain: Q, resourceDomain: CAR, selective: true };
  assert.equal(testEnd(back, 1).block, 'selective');
  assert.equal(testEnd(back, 2).verdict, 'allow');
  const g = at(PRESETS.selective, 3);
  assert.equal(g.last.kind, 'grant');
  assert.equal(g.test, null);
});

test('rule 5: the shortcut is an in-forest trust: transitive, no flags, selective authentication does not apply', () => {
  const t = logic.initialTrusts(P({ scenario: 'in-forest', shortcut: true, selective: true }));
  assert.deepEqual(t.map((x) => [x.type, x.transitive, x.selectiveAuth, x.sidFiltering]).pop(), ['shortcut', true, false, false]);
  assert.equal(testEnd({ scenario: 'in-forest', userDomain: BRK, resourceDomain: EMB, shortcut: true, selective: true }, 1).verdict, 'allow');
});

test('defaults are the SPEC table\'s', () => {
  assert.deepEqual(logic.defaults, { scenario: 'quillmoor-pellucid', userDomain: BRK, resourceDomain: PFX, aceGranted: true, selective: false,
    sidFilter: true, sidHistory: false, shortcut: false });
});

test('rule 9: one referral per hop; a later test by the same user reuses them', () => {
  const p = PRESETS['in-forest'];
  const s1 = at(p, 1), s2 = at(p, 2);
  assert.deepEqual([s1.last.from, s1.last.to], [BRK, Q]);
  assert.deepEqual([s2.last.from, s2.last.to], [Q, EMB]);
  assert.deepEqual(s2.cache[BRK], [BRK, Q, EMB]);
  const sel = end(PRESETS.selective);
  assert.deepEqual(sel.test.cached, [true], 'the second test holds the referral already');
  assert.equal(sel.log.filter((x) => x.kind === 'hop').length, 1);
});

test('presets: step counts and outcomes (SPEC table)', () => {
  const want = { 'in-forest': 3, 'quillmoor-pellucid': 4, 'one-way': 4, 'no-third-forest': 3, selective: 4 };
  for (const [id, over] of Object.entries(PRESETS)) assert.equal(stepsOf(over), want[id], id);
  assert.equal(stepsOf({}), 4, 'defaults');
  let max = 0;
  for (const scenario of logic.SCENARIOS) for (const userDomain of logic.IDS) for (const resourceDomain of logic.IDS)
    for (const shortcut of [false, true]) max = Math.max(max, stepsOf({ scenario, userDomain, resourceDomain, shortcut }));
  assert.equal(max, 7);
  assert.equal(stepsOf({ scenario: 'one-way', userDomain: BRK, resourceDomain: EMB }), 7);
});

test('other expected results (SPEC)', () => {
  assert.equal(testEnd({ scenario: 'one-way', userDomain: BRK, resourceDomain: Q }, 1).verdict, 'allow');
  assert.equal(testEnd({ scenario: 'one-way', userDomain: BRK, resourceDomain: Q }, 2).verdict, 'allow');
  assert.deepEqual(testEnd({ scenario: 'no-third-forest', userDomain: BRK, resourceDomain: PFX }, 1).path, [BRK, Q, PFX]);
  assert.equal(testEnd({ scenario: 'in-forest', resourceDomain: PFX }, 1).block, 'none');
});

test('a duplicate grant changes nothing', () => {
  const p = P(PRESETS.selective);
  assert.equal(end(PRESETS.selective).grants.length, 1);
  // the state before the grant step, with the same grant already there
  const before = kit.stateAt(logic, p, 2);
  before.grants.push({ user: CAR, server: Q });
  const after = logic.step(before, 3, p);
  assert.equal(after.last.kind, 'grant');
  assert.equal(after.last.already, true);
  assert.equal(after.grants.length, 1);
});

// ── generic checks every sim keeps ──

const ALL = logic.SCENARIOS.flatMap((scenario) => logic.IDS.flatMap((userDomain) => [PFX, Q, BRK].flatMap((resourceDomain) =>
  [false, true].map((flag) => ({ scenario, userDomain, resourceDomain, shortcut: flag, sidHistory: flag, selective: !flag })))));

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
