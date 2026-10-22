// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the systemd dependencies and ordering model. Run: node --test sims/lnx-systemd-ordering/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then one test per rule, the presets, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const { APP, DB, NET, MU } = logic;
const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.initial(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
/** A plain graph: root r, the units listed (r is a target), the edges given as 'from kind to'. */
const G = (units, edges, extra) => logic.compute(Object.assign({
  root: 'r',
  units: [{ id: 'r', type: 'target' }].concat(units.map((u) => (typeof u === 'string' ? { id: u } : u))),
  edges: edges.map((e) => { const [from, kind, to] = e.split(' '); return { from, to, kind }; })
}, extra));
const NO_NET = { appToNet: 'none', appAfterNet: false };

// ── tie-breaks (rule 6) ──

test('tie-break: units in the same slot are listed in id order, whatever the input order', () => {
  const s = G(['z', 'b', 'm'], ['r wants z', 'r wants b', 'r wants m']);
  assert.deepEqual(s.order, ['b', 'm', 'z', 'r']);
  assert.deepEqual([s.slots.b, s.slots.m, s.slots.z, s.slots.r], [1, 1, 1, 2]);
});

test('tie-break: lanes by slot first, then id; units outside the transaction last, in id order', () => {
  const s = G(['a', 'b', 'y', 'x'], ['r wants b', 'r wants a', 'a after b']);
  assert.deepEqual(s.order, ['b', 'a', 'r', 'x', 'y']);
  const d = at({});
  assert.deepEqual(d.order, [DB, NET, APP, MU]);
});

test('tie-break: what a unit waits for is listed in id order, without duplicates', () => {
  const s = G(['a', 'z', 'b'], ['r wants a', 'a wants z', 'a wants b', 'a after z', 'b before a', 'a after b', 'a after z']);
  assert.deepEqual(s.waits.a, ['b', 'z']);
});

test('tie-break: the transaction is listed in id order', () => {
  assert.deepEqual(G(['c', 'a'], ['r wants c', 'c wants a']).txn, ['a', 'c', 'r']);
});

// ── rule 1: the transaction ──

test('rule 1: the transaction is everything reachable through Wants=/Requires= from the default target', () => {
  const s = G(['a', 'b', 'c', 'd'], ['r wants a', 'a requires b', 'b wants c', 'd wants a']);
  assert.deepEqual(s.txn, ['a', 'b', 'c', 'r']);
  assert.equal(s.result.d, 'none');
});

test('rule 1: an enabled unit is pulled in through its WantedBy= target; a disabled one is not', () => {
  const on = G([{ id: 'a', enabled: true, wantedBy: 'r' }, { id: 'b', enabled: false, wantedBy: 'r' }], []);
  assert.deepEqual(on.txn, ['a', 'r']);
  assert.ok(on.edges.some((e) => e.from === 'r' && e.to === 'a' && e.kind === 'wants' && e.via === 'install'));
  assert.equal(on.result.b, 'none');
  assert.equal(at({ appToDb: 'none', appAfterDb: false, dbEnabled: false }).result[DB], 'none');
  assert.equal(at({ appToDb: 'none', appAfterDb: false, dbEnabled: true }).result[DB], 'active');
});

test('rule 1: the scene: app is always enabled; db and the network only through a requirement (or enable)', () => {
  const s = at({ appToDb: 'none', appAfterDb: false, appToNet: 'none', appAfterNet: false });
  assert.deepEqual(s.txn, [APP, MU]);
  assert.deepEqual(at({}).txn, [APP, DB, MU, NET]);
});

// ── rule 2: Wants= ──

test('rule 2: Wants= pulls the unit in; when it fails, the wanting unit still starts', () => {
  const s = G(['a', { id: 'b', fails: true }], ['r wants a', 'a wants b', 'a after b']);
  assert.equal(s.result.b, 'failed');
  assert.equal(s.result.a, 'active');
});

// ── rule 3: Requires= ──

test('rule 3: Requires= + After= on a failed unit: the requiring unit is not started (dependency failed)', () => {
  const s = G(['a', { id: 'b', fails: true }], ['r wants a', 'a requires b', 'a after b']);
  assert.equal(s.result.a, 'dependency');
  assert.equal(s.slots.a, 2);
});

test('rule 3: Requires= without After=: both start at once and the requiring unit runs although the other failed', () => {
  const s = G(['a', { id: 'b', fails: true }], ['r wants a', 'a requires b']);
  assert.equal(s.result.a, 'active');
  assert.equal(s.result.b, 'failed');
  assert.equal(s.slots.a, s.slots.b);
});

test('rule 3: Before= on the requiring side counts as the same ordering as After=', () => {
  const s = G(['a', { id: 'b', fails: true }], ['r wants a', 'a requires b', 'b before a']);
  assert.equal(s.result.a, 'dependency');
});

test('rule 3: a dependency failure travels down a Requires= + After= chain', () => {
  const s = G(['a', 'b', { id: 'c', fails: true }], ['r wants a', 'a requires b', 'a after b', 'b requires c', 'b after c']);
  assert.deepEqual([s.result.c, s.result.b, s.result.a], ['failed', 'dependency', 'dependency']);
});

test('rule 3: a dependency-failed unit never runs, so its own failure does not show', () => {
  const s = G([{ id: 'a', fails: true }, { id: 'b', fails: true }], ['r wants a', 'a requires b', 'a after b']);
  assert.equal(s.result.a, 'dependency');
});

test('depends (win-services): one relation that is both a requirement and After=', () => {
  const s = G(['a', { id: 'b', fails: true }], ['r wants a', 'a depends b']);
  assert.deepEqual(s.txn, ['a', 'b', 'r']);
  assert.deepEqual([s.slots.b, s.slots.a], [1, 2]);
  assert.equal(s.result.a, 'dependency');
});

// ── rule 4: requirements say nothing about order ──

test('rule 4: a requirement alone gives no order: both units in slot 1', () => {
  for (const kind of ['wants', 'requires']) {
    const s = G(['a', 'b'], ['r wants a', `a ${kind} b`]);
    assert.equal(s.slots.a, 1);
    assert.equal(s.slots.b, 1);
  }
});

test('rule 4: After= alone orders (when both are in the transaction anyway)', () => {
  const s = G(['a', 'b'], ['r wants a', 'r wants b', 'a after b']);
  assert.deepEqual([s.slots.b, s.slots.a], [1, 2]);
});

// ── rule 5: ordering pulls nothing in ──

test('rule 5: After=/Before= pull nothing in; ordering on a unit outside the transaction is ignored', () => {
  const s = G(['a', 'b', 'c'], ['r wants a', 'a after b', 'c before a']);
  assert.deepEqual(s.txn, ['a', 'r']);
  assert.equal(s.slots.a, 1);
  assert.equal(s.result.b, 'none');
  assert.equal(s.result.c, 'none');
  assert.deepEqual(s.waits.a, []);
});

// ── rule 6: slots ──

test('rule 6: slot = 1 + the latest slot among the units it is After= (in the transaction)', () => {
  const s = G(['a', 'b', 'c', 'd'], ['r wants a', 'a wants b', 'a wants c', 'c wants d', 'a after b', 'a after c', 'c after d']);
  assert.deepEqual([s.slots.b, s.slots.d, s.slots.c, s.slots.a], [1, 1, 2, 3]);
  assert.equal(s.nSlots, 4);   // r: target, after a
});

// ── rule 7: After= a failed unit ──

test('rule 7: a unit After= a failed unit starts after it has finished failing (no requirement on it)', () => {
  const s = G(['a', { id: 'b', fails: true }], ['r wants a', 'r wants b', 'a after b']);
  assert.deepEqual([s.slots.b, s.slots.a], [1, 2]);
  assert.equal(s.result.a, 'active');
  const page = at({ appToDb: 'none', appAfterDb: true, dbEnabled: true, dbFails: true, ...NO_NET });
  assert.deepEqual([page.slots[DB], page.slots[APP], page.result[APP]], [1, 2, 'active']);
});

// ── rule 8: ordering cycles ──

test('rule 8: an ordering cycle is flagged, its units listed, and no slots or results computed', () => {
  const s = G(['a', 'b', 'c'], ['r wants a', 'a wants b', 'a wants c', 'a after b', 'b after a', 'c after a']);
  assert.equal(s.cycle, true);
  assert.deepEqual(s.loop, ['a', 'b']);
  assert.deepEqual(s.slots, {});
  assert.equal(s.nSlots, 0);
  assert.deepEqual(Object.keys(s.result), []);
});

test('rule 8: a cycle through a unit outside the transaction is no cycle (rule 5 drops it first)', () => {
  const s = G(['a', 'b'], ['r wants a', 'a after b', 'b after a']);
  assert.equal(s.cycle, false);
  assert.equal(s.slots.a, 1);
});

test('rule 8: the page\'s params cannot make a cycle', () => {
  for (const appToDb of ['none', 'wants', 'requires']) for (const appToNet of ['none', 'wants'])
    for (const appAfterDb of [false, true]) for (const appAfterNet of [false, true])
      for (const dbFails of [false, true]) for (const dbEnabled of [false, true])
        assert.equal(at({ appToDb, appToNet, appAfterDb, appAfterNet, dbFails, dbEnabled }).cycle, false);
});

// ── rule 9: a target's automatic After= ──

test('rule 9: a target is ordered after every unit it pulls in, unless an ordering is set between them', () => {
  const s = G(['a', 'b'], ['r wants a', 'r requires b', 'b before r']);
  const auto = s.edges.filter((e) => e.via === 'target');
  assert.deepEqual(auto.map((e) => [e.from, e.kind, e.to]), [['r', 'after', 'a']]);
  assert.equal(s.slots.r, 2);
});

test('rule 9: a target\'s Requires= gets the automatic After= too', () => {
  const s = G(['a'], ['r requires a']);
  assert.equal(s.slots.r, 2);
});

test('rule 9: no automatic After= when the unit is ordered after the target (either direction counts)', () => {
  for (const e of ['a after r', 'r before a']) {
    const s = G(['a'], ['r wants a', e]);
    assert.equal(s.cycle, false, e);
    assert.deepEqual([s.slots.r, s.slots.a], [1, 2], e);
  }
});

test('rule 9: a service gets no automatic After= on what it wants', () => {
  const s = G(['a', 'b'], ['r wants a', 'a wants b']);
  assert.ok(!s.edges.some((e) => e.via === 'target' && e.from === 'a'));
  assert.equal(s.slots.a, 1);
});

test('rule 9: the default target is reached last and stays active when what it Wants= fails', () => {
  const s = at(preset('requires-after'));
  assert.equal(s.slots[MU], 3);
  assert.equal(s.result[MU], 'active');
});

// ── presets: the task's expected numbers ──

test('preset network-online: app in the slot after network-online.target', () => {
  const s = at(preset('network-online'));
  assert.deepEqual([s.slots[NET], s.slots[APP], s.slots[MU]], [1, 2, 3]);
  assert.equal(s.result[DB], 'none');
  assert.equal(s.result[APP], 'active');
});

test('preset requires-no-after: db and app in slot 1 together; db failed, app active', () => {
  const s = at(preset('requires-no-after'));
  assert.deepEqual([s.slots[DB], s.slots[APP]], [1, 1]);
  assert.deepEqual([s.result[DB], s.result[APP]], ['failed', 'active']);
  assert.deepEqual(s.order, [APP, DB, MU, NET]);
});

test('preset requires-after: app dependency failed, never started', () => {
  const s = at(preset('requires-after'));
  assert.deepEqual([s.result[DB], s.result[APP]], ['failed', 'dependency']);
});

test('preset wants-after: db fails, app starts in slot 2 and is active', () => {
  const s = at(preset('wants-after'));
  assert.deepEqual([s.slots[DB], s.slots[APP], s.result[APP]], [1, 2, 'active']);
});

test('preset after-only: db not in the transaction, app starts alone in slot 1', () => {
  const s = at(preset('after-only'));
  assert.equal(s.result[DB], 'none');
  assert.equal(s.slots[APP], 1);
  assert.deepEqual(s.order.filter((id) => s.slots[id] === 1), [APP]);
});

test('defaults: db and the network in slot 1, app in slot 2, the target in slot 3, all active', () => {
  const s = at({});
  assert.deepEqual([s.slots[DB], s.slots[NET], s.slots[APP], s.slots[MU]], [1, 1, 2, 3]);
  assert.ok(Object.values(s.result).every((r) => r === 'active'));
});

// ── changed units, caption focus and keys (pure parts of the page) ──

test('changed: units whose result or slot differs, in id order; nothing without a previous state', () => {
  assert.deepEqual(logic.changed(null, at({})), []);
  assert.deepEqual(logic.changed(at(preset('wants-after')), at(preset('requires-after'))), [APP]);
  assert.deepEqual(logic.changed(at({}), at({ appAfterNet: false, appAfterDb: false })), [APP, MU]);
  assert.deepEqual(logic.changed(at({}), at({})), []);
});

test('focus: a preset speaks for its own relation; else the last changed param; else db', () => {
  const d = P({});
  assert.equal(logic.nextFocus(null, null, d, null, null), 'db');
  assert.equal(logic.nextFocus('db', null, d, 'network-online', null), 'net');
  assert.equal(logic.nextFocus('net', null, d, 'after-only', 'network-online'), 'db');
  assert.equal(logic.nextFocus('db', d, P({ appAfterNet: false }), null, null), 'net');
  assert.equal(logic.nextFocus('net', d, P({ dbFails: true }), null, null), 'db');
  assert.equal(logic.nextFocus('net', d, d, 'x', 'x'), 'net');
});

test('caption keys: the task\'s two captions on their presets, and every branch', () => {
  const key = (over, focus) => logic.captionKey(at(over), P(over), focus || 'db').key;
  assert.equal(key(preset('requires-no-after')), 'cReqNoAfter');
  assert.equal(key(preset('after-only')), 'cAfterOnly');
  assert.equal(key(preset('requires-after')), 'cDepFailed');
  assert.equal(key(preset('wants-after')), 'cWantsAfterFailed');
  assert.equal(key(preset('network-online'), 'net'), 'cNetOrdered');
  assert.equal(key({}), 'cOrdered');
  assert.equal(key({ appAfterDb: false, ...NO_NET }), 'cNoOrder');
  assert.equal(key({ appToDb: 'none', appAfterDb: false }), 'cDbOut');
  assert.equal(key({ appToDb: 'requires', appAfterDb: false, dbFails: true }), 'cReqNoAfterApart');   // app after the network
  assert.equal(key({ appToDb: 'wants', appAfterDb: false, dbFails: true }), 'cWantsFailed');
  assert.equal(key({ appToDb: 'none', appAfterDb: true, dbEnabled: true, dbFails: true }), 'cAfterFailed');
  assert.equal(key({ appToDb: 'none', appAfterDb: false, dbEnabled: true, dbFails: true }), 'cUnrelatedFailed');
  assert.equal(key({ appToDb: 'none', appAfterDb: false, dbEnabled: true }), 'cIndependent');
  assert.equal(key({ appAfterNet: false }, 'net'), 'cNetNoOrder');
  assert.equal(key({ appToNet: 'none' }, 'net'), 'cNetAfterOnly');
  assert.equal(key({ appToNet: 'none', appAfterNet: false }, 'net'), 'cNetNone');
  const c = logic.captionKey(at({ appToDb: 'wants', appAfterDb: false }), P({ appToDb: 'wants', appAfterDb: false }), 'db');
  assert.equal(c.rel, 'Wants=');
  const cyc = G(['a', 'b'], ['r wants a', 'a wants b', 'a after b', 'b after a']);
  assert.equal(logic.captionKey(cyc, P({}), 'db').key, 'cCycle');
});

test('caption numbers: the slots each caption names are the model\'s', () => {
  const cases = [
    [{}, 'db', { key: 'cOrdered', db: 1, app: 2 }],
    [preset('wants-after'), 'db', { key: 'cWantsAfterFailed', db: 1, app: 2 }],
    [preset('requires-after'), 'db', { key: 'cDepFailed', db: 1, app: 2 }],
    [{ appToDb: 'none', appAfterDb: true, dbEnabled: true, dbFails: true, ...NO_NET }, 'db', { key: 'cAfterFailed', db: 1, app: 2 }],
    [{ appAfterDb: false, ...NO_NET }, 'db', { key: 'cNoOrder', rel: 'Requires=', db: 1, app: 1 }],
    [{ appToDb: 'none', appAfterDb: false, dbEnabled: true }, 'db', { key: 'cIndependent', db: 1, app: 2 }],
    [{ appToDb: 'none', appAfterDb: false }, 'net', { key: 'cNetOrdered', net: 1, app: 2 }],
    [{ appToDb: 'none', appAfterDb: false, appAfterNet: false }, 'net', { key: 'cNetNoOrder', net: 1, app: 1 }],
    [{ appToNet: 'none' }, 'net', { key: 'cNetAfterOnly', app: 2 }],
    [{ appToDb: 'none', appAfterDb: false, appToNet: 'none' }, 'net', { key: 'cNetAfterOnly', app: 1 }],
  ];
  for (const [over, focus, want] of cases) assert.deepEqual(logic.captionKey(at(over), P(over), focus), want, JSON.stringify(over));
});

test('caption: a dependency-failed app is explained by the db caption, even when the network spoke last', () => {
  for (const net of [{}, { appAfterNet: false }, { appToNet: 'none' }, NO_NET]) {
    const over = { ...preset('requires-after'), ...net };
    assert.equal(logic.captionKey(at(over), P(over), 'net').key, 'cDepFailed', JSON.stringify(net));
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe, for every param combination and a cycle', () => {
  const all = [at({}), ...logic.presets.map((x) => at(x.params)), G(['a', 'b'], ['r wants a', 'a wants b', 'a after b', 'b after a'])];
  for (const s of all) assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test('deterministic: the same params give the same state; compute does not mutate its graph', () => {
  const p = P(preset('requires-after'));
  assert.deepEqual(logic.initial(p), logic.initial(p));
  const g = logic.graph(p);
  const copy = structuredClone(g);
  logic.compute(g);
  assert.deepEqual(g, copy);
});

test('explorer: no steps; the kit replay at step 0 is initial(params)', () => {
  assert.equal(logic.steps, undefined);
  assert.deepEqual(kit.stateAt(logic, P({}), 0), logic.initial(P({})));
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every caption key the model returns exists in both tables, and backticks are paired', () => {
  const keys = ['cOrdered', 'cNoOrder', 'cIndependent', 'cDbOut', 'cAfterOnly', 'cDepFailed', 'cReqNoAfter', 'cReqNoAfterApart',
    'cWantsAfterFailed', 'cWantsFailed', 'cAfterFailed', 'cUnrelatedFailed', 'cNetOrdered', 'cNetNoOrder', 'cNetAfterOnly', 'cNetNone', 'cCycle'];
  for (const lang of ['hr', 'en']) {
    for (const k of keys) assert.ok(strings[lang][k], `${lang}.${k}`);
    for (const [k, v] of Object.entries(strings[lang])) {
      for (const s of [].concat(v)) assert.equal((s.match(/`/g) || []).length % 2, 0, `${lang}.${k} has paired backticks`);
    }
  }
});

test('every preset in the page is the model\'s, with a label in both tables; meta and sim.json agree', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const x of logic.presets) {
    for (const k of Object.keys(x.params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.ok(html.includes(`'${x.id}'`), `the page labels preset ${x.id}`);
  }
  for (const e of sim.entries) assert.ok(logic.presets.some((x) => x.id === e.preset), `entry ${e.preset} is a preset`);
});
