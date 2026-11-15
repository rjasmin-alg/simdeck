// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-gpo-loopback. Run: node --test sims/win-gpo-loopback/sim.test.js
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
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const final = (over) => { const p = P(over); return kit.stateAt(logic, p, kit.stepsOf(logic, p)); };
const statuses = (over) => logic.entriesOf(logic.sceneOf(P(over))).map((e) => e.gpo + ':' + e.status);
/** The result as { setting: 'value@gpo' }. */
const result = (over) => Object.fromEntries(Object.entries(final(over).result).map(([k, v]) => [k, v.value + '@' + v.from]));

/** A scene of our own: user path and computer path (containers), GPOs { user, computer, off, read }. */
const C = (id, kind, links, extra) => Object.assign({ id, kind, name: id, links }, extra);
const Lk = (gpo, order, enforced, enabled) => ({ gpo, order, enforced: !!enforced, enabled: enabled !== false });
const G = (user, computer, extra) => Object.assign({ name: 'g', user: user || {}, computer: computer || {}, off: null, read: { users: true, computers: true } }, extra);
function scene(userPath, computerPath, gpos) { return { user: 'u', computer: 'c', userPath, computerPath, gpos }; }
function resultOf(sc) {
  const e = logic.entriesOf(sc);
  const r = logic.resultOf(e, logic.rowsOf(sc, e), e.length);
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.value + '@' + v.from]));
}

// ── tie-breaks first ──

test('tie-break: loopback off and not readable by users → the kiosk GPO is unused, not filtered', () => {
  assert.deepEqual(statuses({ mode: 'off', usersCanRead: false }), ['staff:apply', 'kiosk:unused']);
});

test('tie-break: replace and a user GPO not readable → replaced, not filtered', () => {
  const sc = logic.sceneOf(P({ mode: 'replace' }));
  sc.gpos.staff.read.users = false;
  assert.deepEqual(logic.entriesOf(sc).map((e) => e.status), ['replaced', 'apply']);
});

test('tie-break: a precedence drop (link disabled, user half off, blocked) is reported before any loopback reason', () => {
  const sc = logic.sceneOf(P({ mode: 'off', usersCanRead: false }));
  sc.computerPath[1].links[0].enabled = false;
  assert.equal(logic.entriesOf(sc)[1].status, 'link-off');
  const sc2 = logic.sceneOf(P({ mode: 'replace' }));
  sc2.gpos.staff.off = 'user';
  assert.equal(logic.entriesOf(sc2)[0].status, 'half-off');
  const sc3 = scene([C('d', 'domain', [Lk('a', 1)]), C('o', 'ou', [], { block: true })], [C('k', 'ou', [Lk('k', 1)])],
    { a: G({ x: 1 }), k: G({ x: 2 }, { loopback: 'replace' }) });
  assert.equal(logic.entriesOf(sc3)[0].status, 'blocked');
});

test('tie-break: one GPO linked to both OUs is listed in each list; in merge its computer-list copy comes last', () => {
  const sc = scene([C('u', 'ou', [Lk('g', 1), Lk('h', 2)])], [C('k', 'ou', [Lk('h', 1)])],
    { g: G({ x: 'g' }), h: G({ x: 'h' }, { loopback: 'merge' }) });
  const e = logic.entriesOf(sc);
  assert.deepEqual(e.map((x) => x.gpo + '/' + x.path), ['h/user', 'g/user', 'h/computer']);
  assert.deepEqual(resultOf(sc), { x: 'h@h' });
  assert.equal(logic.rowsOf(sc, e).filter((r) => r.gpo === 'h').length, 2);
});

test('tie-break: not configured is not a value; a setting nobody sets keeps the default (absent from the result)', () => {
  assert.deepEqual(result(preset('merge')).drive, 'P:@staff', 'kiosk does not set the drive: Staff User\'s value stands');
  assert.equal('drive' in final(preset('replace')).result, false);
  assert.equal('hideCp' in final(preset('no-loopback')).result, false);
});

// ── rules ──

test('rule 1: without loopback only the user path gives user settings; the kiosk GPO\'s user half is unused', () => {
  assert.deepEqual(statuses({ mode: 'off' }), ['staff:apply', 'kiosk:unused']);
  assert.deepEqual(result({ mode: 'off' }), { wallpaper: 'staff.jpg@staff', drive: 'P:@staff' });
  assert.equal(final({ mode: 'off' }).mode, 'off');
});

test('rule 2: loopback is a computer setting: it takes effect only if its GPO applies to the computer', () => {
  assert.equal(logic.loopbackMode(logic.sceneOf(P({ mode: 'merge' }))), 'merge');
  assert.equal(logic.loopbackMode(logic.sceneOf(P({ mode: 'merge', computersCanRead: false }))), 'off');
  assert.deepEqual(statuses({ mode: 'replace', computersCanRead: false }), ['staff:apply', 'kiosk:unused']);
  // and the state follows the effective mode, not the param
  assert.equal(final({ mode: 'replace', computersCanRead: false }).mode, 'off');
  assert.deepEqual(result({ mode: 'replace', computersCanRead: false }), { wallpaper: 'staff.jpg@staff', drive: 'P:@staff' });
  // set in the user half of a GPO, it does nothing
  const sc = scene([C('u', 'ou', [Lk('g', 1)])], [C('k', 'ou', [Lk('k', 1)])], { g: G({ x: 1 }), k: G({ x: 2, loopback: 'replace' }) });
  assert.equal(logic.loopbackMode(sc), 'off');
  // the computer half disabled, or the link disabled: off
  const sc2 = scene([C('u', 'ou', [Lk('g', 1)])], [C('k', 'ou', [Lk('k', 1)])], { g: G({ x: 1 }), k: G({ x: 2 }, { loopback: 'replace' }, { off: 'computer' }) });
  assert.equal(logic.loopbackMode(sc2), 'off');
  sc2.gpos.k.off = 'user';
  assert.equal(logic.loopbackMode(sc2), 'replace', 'the user half off does not touch the computer setting');
  sc2.computerPath[0].links[0].enabled = false;
  assert.equal(logic.loopbackMode(sc2), 'off');
});

test('rule 2: two computer GPOs set the mode: the normal precedence decides (last writer wins)', () => {
  const sc = scene([C('u', 'ou', [Lk('g', 1)])], [C('d', 'domain', [Lk('a', 1)]), C('k', 'ou', [Lk('b', 1)])],
    { g: G({ x: 1 }), a: G({}, { loopback: 'replace' }), b: G({}, { loopback: 'merge' }) });
  assert.equal(logic.loopbackMode(sc), 'merge');
  sc.computerPath[0].links[0].enforced = true;
  assert.equal(logic.loopbackMode(sc), 'replace');
});

test('rule 3: merge processes the user list first, then the computer list; the computer list wins conflicts', () => {
  const s = final(preset('merge'));
  assert.deepEqual(s.entries.map((e) => e.path), ['user', 'computer']);
  assert.deepEqual(result(preset('merge')), { wallpaper: 'kiosk.jpg@kiosk', drive: 'P:@staff', hideCp: 'on@kiosk' });
  assert.deepEqual(s.seen, ['overwritten', 'applied', 'applied', 'applied']);
  const s2 = kit.stateAt(logic, P(preset('merge')), 2);
  assert.deepEqual(s2.event.over, [0], 'kiosk.jpg overwrites staff.jpg in step 2');
  assert.deepEqual(s2.event.rows, [2, 3]);
});

test('rule 4: replace ignores the user\'s own GPOs; only the computer list gives user settings', () => {
  assert.deepEqual(statuses(preset('replace')), ['staff:replaced', 'kiosk:apply']);
  assert.deepEqual(result(preset('replace')), { wallpaper: 'kiosk.jpg@kiosk', hideCp: 'on@kiosk' });
});

test('rule 5: computer-list GPOs are security-filtered against the user', () => {
  assert.deepEqual(statuses(preset('filtered')), ['staff:replaced', 'kiosk:filtered']);
  assert.deepEqual(result(preset('filtered')), {});
  assert.deepEqual(final(preset('filtered')).seen, ['dropped', 'dropped', 'dropped', 'dropped']);
  assert.deepEqual(final(preset('no-loopback')).seen, ['applied', 'applied', 'dropped', 'dropped']);
  assert.deepEqual(final(preset('replace')).seen, ['dropped', 'dropped', 'applied', 'applied']);
  assert.deepEqual(statuses({ mode: 'merge', usersCanRead: false }), ['staff:apply', 'kiosk:filtered']);
  assert.deepEqual(result({ mode: 'merge', usersCanRead: false }), { wallpaper: 'staff.jpg@staff', drive: 'P:@staff' });
  // the user list is filtered the same way
  const sc = logic.sceneOf(P({ mode: 'merge' }));
  sc.gpos.staff.read.users = false;
  assert.deepEqual(logic.entriesOf(sc).map((e) => e.status), ['filtered', 'apply']);
});

test('rule 6: within each list the normal precedence holds (link order, enforced)', () => {
  const sc = scene([C('u', 'ou', [Lk('u1', 1), Lk('u2', 2)])], [C('d', 'domain', [Lk('k0', 1, true)]), C('k', 'ou', [Lk('k1', 1), Lk('k2', 2)])],
    { u1: G({ x: 'u1' }), u2: G({ x: 'u2', y: 'u2' }), k0: G({ z: 'k0' }), k1: G({ z: 'k1' }, { loopback: 'merge' }), k2: G({ x: 'k2', z: 'k2' }) });
  assert.deepEqual(logic.entriesOf(sc).map((e) => e.gpo), ['u2', 'u1', 'k2', 'k1', 'k0']);
  assert.deepEqual(resultOf(sc), { x: 'k2@k2', y: 'u2@u2', z: 'k0@k0' });
  sc.gpos.k1.computer.loopback = 'replace';
  assert.deepEqual(resultOf(sc), { x: 'k2@k2', z: 'k0@k0' });
  // two enforced links at different depths: the higher container last; a block passes enforced links only
  const sc2 = scene([C('u', 'ou', [Lk('u1', 1)])],
    [C('d', 'domain', [Lk('d1', 1, true), Lk('d2', 2)]), C('k', 'ou', [Lk('k1', 1, true)], { block: true })],
    { u1: G({ x: 'u1' }), d1: G({ x: 'd1' }), d2: G({ x: 'd2' }), k1: G({ x: 'k1' }, { loopback: 'merge' }) });
  assert.deepEqual(logic.entriesOf(sc2).map((e) => e.gpo + ':' + e.status), ['u1:apply', 'd2:blocked', 'k1:apply', 'd1:apply']);
  assert.deepEqual(resultOf(sc2), { x: 'd1@d1' });
  // a GPO with both halves off is skipped
  sc2.gpos.d1.off = 'all';
  assert.equal(logic.entriesOf(sc2)[3].status, 'half-off');
  assert.deepEqual(resultOf(sc2), { x: 'k1@k1' });
});

test('the result after each step counts only the GPOs taken so far', () => {
  const sc = logic.sceneOf(P(preset('merge')));
  const e = logic.entriesOf(sc), rows = logic.rowsOf(sc, e);
  assert.deepEqual(logic.resultOf(e, rows, -1), {});
  assert.equal(logic.resultOf(e, rows, 0).wallpaper.value, 'staff.jpg');
  assert.equal(logic.resultOf(e, rows, 1).wallpaper.value, 'kiosk.jpg');
  for (let n = 0; n <= e.length; n++) assert.deepEqual(kit.stateAt(logic, P(preset('merge')), n).result, logic.resultOf(e, rows, n - 1));
});

test('a GPO without user settings still gets a row and a step', () => {
  const sc = scene([C('u', 'ou', [Lk('g', 1)])], [C('k', 'ou', [Lk('k', 1)])], { g: G({}), k: G({ x: 1 }, { loopback: 'merge' }) });
  const e = logic.entriesOf(sc);
  assert.deepEqual(logic.rowsOf(sc, e).map((r) => r.gpo + ':' + r.setting), ['g:null', 'k:x']);
});

// ── presets: the task's expected numbers ──

test('presets: results and step counts', () => {
  const want = {
    'no-loopback': [{ wallpaper: 'staff.jpg@staff', drive: 'P:@staff' }, 3],
    merge: [{ wallpaper: 'kiosk.jpg@kiosk', drive: 'P:@staff', hideCp: 'on@kiosk' }, 3],
    replace: [{ wallpaper: 'kiosk.jpg@kiosk', hideCp: 'on@kiosk' }, 3],
    filtered: [{}, 3]
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const [id, [res, steps]] of Object.entries(want)) {
    assert.deepEqual(result(preset(id)), res, id);
    assert.equal(kit.stepsOf(logic, P(preset(id))), steps, id);
  }
});

test('steps are 3 for every combination of params, and the last step is the result', () => {
  for (const mode of ['off', 'merge', 'replace']) for (const usersCanRead of [true, false]) for (const computersCanRead of [true, false]) {
    const p = P({ mode, usersCanRead, computersCanRead });
    assert.equal(kit.stepsOf(logic, p), 3);
    const s = kit.stateAt(logic, p, 3);
    assert.equal(s.event.kind, 'result');
    assert.equal(s.done, true);
    assert.deepEqual(s.result, logic.resultOf(s.entries, s.list, s.entries.length));
  }
});

test('the state carries the task\'s fields', () => {
  const s = logic.initial(P(preset('filtered')));
  assert.deepEqual(s.userGpos, ['staff']);
  assert.deepEqual(s.computerGpos, ['kiosk']);
  assert.equal(s.kioskReadableByUsers, false);
  assert.equal(s.mode, 'replace');
  assert.equal(s.cursor, -1);
  assert.deepEqual(s.result, {});
});

test('the rule table spec the page builds is valid (page marks, ranks everywhere)', () => {
  const s = final(preset('merge'));
  const rows = s.list.map((r, i) => ({ no: i + 1, cells: { gpo: r.gpo }, hit: null, rank: i,
    mark: s.seen[i] === 'dropped' ? 'skip' : s.seen[i] === 'overwritten' ? 'beaten' : 'win' }));
  assert.deepEqual(RT.checkSpec({ mode: 'specific', columns: [{ key: 'gpo' }], rows, at: rows.length - 1, done: true, implicit: { text: 'd' } }), []);
  const ev = RT.evaluate('specific', rows, rows.length - 1, true);
  assert.deepEqual(ev.win, [1, 2, 3]);
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
  const p = P(preset('merge'));
  const steps = kit.stepsOf(logic, p);
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P(preset('merge'));
  const s1 = kit.stateAt(logic, p, 1);
  const copy = structuredClone(s1);
  logic.step(s1, 2, p);
  assert.deepEqual(s1, copy);
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
