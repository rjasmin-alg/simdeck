// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-gpo-precedence. Run: node --test sims/win-gpo-precedence/
// One test per rule of SPEC.md §2, tie-breaks first, then the presets' expected numbers, then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const RT = require('../../kit/ruletable.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const list = (over) => logic.listOf(P(over));
const names = (l) => l.map((e) => e.gpo);
const final = (over) => { const p = P(over); return kit.stateAt(logic, p, kit.stepsOf(logic, p)); };
const won = (over) => { const s = final(over); return s.winner >= 0 ? s.list[s.winner] : null; };
const preset = (id) => logic.presets.find((x) => x.id === id).params;

/** A small scene of our own: containers top down, links, GPO values. */
function scene(containers, gpos, half) {
  return { target: 'X', where: 'x', half: half || 'computer', containers, gpos };
}
const C = (id, kind, links, extra) => Object.assign({ id, kind, name: id, links }, extra);
const Lk = (gpo, order, enforced, enabled) => ({ gpo, order, enforced: !!enforced, enabled: enabled !== false });

// ── tie-breaks first ──

test('tie-break (rule 8): a GPO linked at two levels is processed at each link; the later link counts', () => {
  const sc = scene([
    C('local', 'local', []),
    C('d', 'domain', [Lk('g', 1)]),
    C('ou', 'ou', [Lk('g', 2), Lk('h', 1)])
  ], { g: { values: { lock: 7 } }, h: { values: {} } });
  const l = logic.processingList(sc, 'lock');
  assert.deepEqual(l.map((e) => e.gpo + '@' + e.container), ['g@d', 'g@ou', 'h@ou']);
  assert.equal(logic.winnerOf(l), 1);
});

test('tie-break: two enforced links in one container keep link order (link 1 last)', () => {
  const sc = scene([C('local', 'local', []), C('d', 'domain', [Lk('a', 1, true), Lk('b', 2, true)])],
    { a: { values: { lock: 1 } }, b: { values: { lock: 2 } } });
  assert.deepEqual(names(logic.processingList(sc, 'lock')), ['b', 'a']);
});

test('tie-break: a link that is both blocked and disabled is reported as blocked', () => {
  const sc = scene([C('local', 'local', []), C('d', 'domain', [Lk('a', 1, false, false)]), C('ou', 'ou', [], { block: true })],
    { a: { values: { lock: 1 } } });
  assert.equal(logic.processingList(sc, 'lock')[0].status, 'blocked');
});

test('tie-break: every blocked GPO is dropped in one step, at the place of the first', () => {
  const l = list(preset('block'));
  const ev = logic.eventsOf(l);
  assert.deepEqual(ev.map((e) => e.kind), ['apply', 'blocked', 'apply', 'apply', 'winner']);
  assert.deepEqual(ev[1].rows.map((i) => l[i].gpo), ['lockdown', 'base']);
});

// ── rules ──

test('rule 1: LSDOU, and within a container the highest link order first, link order 1 last', () => {
  assert.deepEqual(names(list({})), ['local', 'lockdown', 'base', 'std', 'kiosk']);
  assert.deepEqual(list({}).map((e) => e.kind), ['local', 'domain', 'ou', 'ou', 'ou']);
  assert.deepEqual(names(list({ swapOrder: true })), ['local', 'lockdown', 'base', 'kiosk', 'std']);
  // order is by number, not by position in the container's list
  const sc = scene([C('local', 'local', []), C('d', 'domain', [Lk('a', 1), Lk('c', 3), Lk('b', 2)])], { a: { values: {} }, b: { values: {} }, c: { values: {} } });
  assert.deepEqual(names(logic.processingList(sc, 'lock')), ['c', 'b', 'a']);
});

test('rule 1: a site link comes after the local GPO and before the domain', () => {
  const sc = scene([C('local', 'local', [Lk('l', 1)]), C('s', 'site', [Lk('s1', 1)]), C('d', 'domain', [Lk('d1', 1)])],
    { l: { values: { lock: 1 } }, s1: { values: { lock: 2 } }, d1: { values: { lock: 3 } } });
  assert.deepEqual(names(logic.processingList(sc, 'lock')), ['l', 's1', 'd1']);
});

test('rule 2: the last GPO that applied a value wins (closest container, link order 1)', () => {
  assert.equal(won({}).gpo, 'kiosk');
  assert.equal(won({}).value, 5);
  assert.equal(won({ swapOrder: true }).gpo, 'std');
  assert.equal(won({ swapOrder: true }).value, 10);
});

test('rule 2: each applied value overwrites the one before it', () => {
  const p = P({});
  const s2 = kit.stateAt(logic, p, 2);
  assert.equal(s2.current, 1);
  assert.equal(s2.seen[0], 'overwritten');
  assert.equal(s2.seen[1], 'applied');
  assert.equal(s2.event.prev, 0);
});

test('rule 3: Block Inheritance drops site, domain and parent-OU links, not the local GPO', () => {
  const l = list({ blockWs: true });
  assert.deepEqual(l.map((e) => e.gpo + ':' + e.status), ['local:apply', 'lockdown:blocked', 'base:blocked', 'std:apply', 'kiosk:apply']);
  assert.equal(l[1].by, 'ou-ws');
  // a setting only the blocked GPO sets is gone
  assert.equal(won({ blockWs: true, setting: 'usb' }), null);
  assert.equal(won({ setting: 'usb' }).gpo, 'lockdown');
});

test('rule 3: a block on a parent OU applies too; the blocking OU keeps its own links', () => {
  const sc = scene([C('local', 'local', []), C('d', 'domain', [Lk('a', 1)]), C('p', 'ou', [Lk('b', 1)], { block: true }), C('c', 'ou', [Lk('c1', 1)])],
    { a: { values: { lock: 1 } }, b: { values: { lock: 2 } }, c1: { values: { lock: 3 } } });
  assert.deepEqual(logic.processingList(sc, 'lock').map((e) => e.status), ['blocked', 'apply', 'apply']);
  // blocks on both the parent and the child OU: the parent's own link is dropped by the child's block
  sc.containers[3].block = true;
  assert.deepEqual(logic.processingList(sc, 'lock').map((e) => e.status), ['blocked', 'blocked', 'apply']);
});

test('rule 3/4: an enforced link passes Block Inheritance', () => {
  const l = list(preset('enforced-vs-block'));
  assert.deepEqual(l.map((e) => e.gpo + ':' + e.status), ['local:apply', 'base:blocked', 'std:apply', 'kiosk:apply', 'lockdown:apply']);
  assert.equal(won(preset('enforced-vs-block')).value, 15);
});

test('rule 4: enforced links come after all others, the highest container last', () => {
  assert.deepEqual(names(list({ enforceDomain: true })), ['local', 'base', 'std', 'kiosk', 'lockdown']);
  assert.deepEqual(names(list({ enforceOu: true })), ['local', 'lockdown', 'base', 'std', 'kiosk']);
  assert.deepEqual(names(list({ enforceOu: true, swapOrder: true })), ['local', 'lockdown', 'base', 'std', 'kiosk']);
  assert.deepEqual(names(list(preset('two-enforced'))), ['local', 'base', 'std', 'kiosk', 'lockdown']);
  assert.equal(won(preset('two-enforced')).gpo, 'lockdown');
  // an enforced site link comes after an enforced domain link
  const sc = scene([C('local', 'local', []), C('s', 'site', [Lk('s1', 1, true)]), C('d', 'domain', [Lk('d1', 1, true)]), C('o', 'ou', [Lk('o1', 1)])],
    { s1: { values: { lock: 1 } }, d1: { values: { lock: 2 } }, o1: { values: { lock: 3 } } });
  assert.deepEqual(names(logic.processingList(sc, 'lock')), ['o1', 'd1', 's1']);
});

test('rule 4: the local GPO cannot be enforced', () => {
  const sc = scene([C('local', 'local', [Lk('l', 1, true)]), C('d', 'domain', [Lk('d1', 1)])], { l: { values: { lock: 1 } }, d1: { values: { lock: 2 } } });
  const l = logic.processingList(sc, 'lock');
  assert.deepEqual(names(l), ['l', 'd1']);
  assert.equal(l[0].enforced, false);
});

test('rule 5: a disabled link is skipped; so is a GPO with the computer half disabled', () => {
  const l = list({ disableStd: true });
  assert.equal(l[3].gpo, 'std');
  assert.equal(l[3].status, 'link-off');
  const s = final({ disableStd: true, swapOrder: true });
  assert.equal(s.list[s.winner].gpo, 'kiosk');
  const sc = scene([C('local', 'local', []), C('d', 'domain', [Lk('a', 2), Lk('b', 1)])],
    { a: { values: { lock: 1 } }, b: { off: 'computer', values: { lock: 2 } } });
  const l2 = logic.processingList(sc, 'lock');
  assert.deepEqual(l2.map((e) => e.status), ['apply', 'half-off']);
  assert.equal(logic.winnerOf(l2), 0);
  sc.gpos.b.off = 'all';
  assert.equal(logic.processingList(sc, 'lock')[1].status, 'half-off');
  // the user half being off does not touch a computer
  sc.gpos.b.off = 'user';
  assert.equal(logic.processingList(sc, 'lock')[1].status, 'apply');
});

test('rule 6: not configured is processed but changes nothing; with no value at all, not configured wins', () => {
  const p = P({});
  const s3 = kit.stateAt(logic, p, 3);
  assert.equal(s3.list[2].gpo, 'base');
  assert.equal(s3.seen[2], 'nc');
  assert.equal(s3.current, 1, 'the domain value still stands');
  assert.equal(final({ setting: 'usb', blockWs: true }).winner, -1);
});

test('rule 7: a computer in CN=Computers gets only local, site and domain GPOs', () => {
  const l = list({ cn: true, blockWs: true, enforceOu: true });
  assert.deepEqual(names(l), ['local', 'lockdown']);
  assert.equal(won({ cn: true }).value, 15);
  assert.equal(logic.sceneOf(P({ cn: true })).where, 'cn-computers');
});

// ── presets: the task's expected numbers ──

test('presets: winners and step counts from the task', () => {
  const want = {
    lsdou: ['kiosk', 5, 6], 'link-order': ['std', 10, 6], block: ['kiosk', 5, 5],
    'enforced-vs-block': ['lockdown', 15, 6], 'two-enforced': ['lockdown', 15, 6], 'computers-container': ['lockdown', 15, 3]
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const [id, [gpo, value, steps]] of Object.entries(want)) {
    const w = won(preset(id));
    assert.equal(w.gpo, gpo, id);
    assert.equal(w.value, value, id);
    assert.equal(kit.stepsOf(logic, P(preset(id))), steps, id);
  }
});

test('steps never exceed 6 for any combination of params', () => {
  const bools = ['blockWs', 'enforceDomain', 'enforceOu', 'swapOrder', 'disableStd'];
  for (let m = 0; m < 1 << bools.length; m++) for (const cn of [false, true]) for (const setting of logic.SETTINGS) {
    const p = P({ cn, setting });
    bools.forEach((b, i) => { p[b] = !!(m & (1 << i)); });
    const n = kit.stepsOf(logic, p);
    assert.ok(n >= 2 && n <= 6, JSON.stringify(p));
    assert.equal(kit.stateAt(logic, p, n).event.kind, 'winner');
  }
});

test('the rule table spec the page builds is valid (specific mode: ranks on every matching row)', () => {
  const s = final({});
  const rows = s.list.map((e, i) => ({ no: i + 1, cells: { gpo: e.gpo }, hit: s.seen[i] === 'nc' ? false : e.status === 'apply' ? true : null, rank: i }));
  assert.deepEqual(RT.checkSpec({ mode: 'specific', columns: [{ key: 'gpo' }], rows, at: rows.length - 1, implicit: { text: 'n/c' } }), []);
  const ev = RT.evaluate('specific', rows, rows.length - 1, true);
  assert.deepEqual(ev.win, [s.winner]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of logic.presets) {
    const p = P(pr.params);
    for (let n = 0; n <= kit.stepsOf(logic, p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P(preset('enforced-vs-block'));
  const steps = kit.stepsOf(logic, p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
});

test('the page: meta steps match the defaults; every preset id and param is the model\'s', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, kit.stepsOf(logic, logic.defaults), 'meta.steps matches the model');
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(json.steps, meta.steps);
  for (const pr of logic.presets) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k}`);
  for (const k of [...html.matchAll(/\{ key: '(\w+)', type:/g)].map((m) => m[1])) assert.ok(k in logic.defaults, `page param ${k}`);
});
