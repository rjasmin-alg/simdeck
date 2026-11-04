// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-fgpp. Run: node --test sims/win-fgpp/
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
const rows = (over) => logic.rowsOf(P(over));
const ids = (r) => r.map((x) => x.id);
const final = (over) => { const p = P(over); return kit.stateAt(logic, p, kit.stepsOf(logic, p)); };
const won = (over) => { const s = final(over); return s.winner >= 0 ? s.rows[s.winner] : null; };
const preset = (id) => logic.presets.find((x) => x.id === id).params;

/** A small scene of our own. */
const S = { minLength: 1, complexity: false, lockout: 0 };
function scene(psos, groups, extra) {
  return Object.assign({
    level: 2016, domain: 'd', user: { id: 'u', ou: 'OU=X' }, groups: groups || [], ous: ['OU=X'],
    psos: psos.map((x) => Object.assign({ settings: S }, x)),
    gpos: [{ id: 'DDP', link: 'domain', order: 1, settings: { minLength: 7, complexity: true, lockout: 10 } }]
  }, extra);
}
const G = (id, members, scope, type) => ({ id, scope: scope || 'global', type: type || 'security', members });
const win = (sc) => { const r = logic.candidatesOf(sc); const w = logic.winnerOf(r); return w < 0 ? null : r[w].id; };

// ── tie-breaks first ──

test('tie-break (rule 6): equal precedence, the smallest objectGUID wins, whatever the scene order', () => {
  const a = { id: 'A', precedence: 10, guid: '7e7e7e7e-0000-0000-0000-000000000000', appliesTo: ['g'] };
  const b = { id: 'B', precedence: 10, guid: '2b2b2b2b-0000-0000-0000-000000000000', appliesTo: ['g'] };
  assert.equal(win(scene([a, b], [G('g', ['u'])])), 'B');
  assert.equal(win(scene([b, a], [G('g', ['u'])])), 'B');
  // compared case-insensitively
  const c = Object.assign({}, a, { guid: '2B2B2B2C-0000-0000-0000-000000000000' });
  assert.equal(win(scene([c, b], [G('g', ['u'])])), 'B');
  // and between direct PSOs too
  assert.equal(win(scene([Object.assign({}, a, { appliesTo: ['u'] }), Object.assign({}, b, { appliesTo: ['u'] })])), 'B');
});

test('tie-break (rule 6) on the page: tie preset, Finance is beaten by GUID, not by precedence', () => {
  const r = rows(preset('tie'));
  assert.deepEqual(ids(r), ['Default-Staff', 'Finance', 'Default Domain Policy']);
  assert.equal(r[0].precedence, r[1].precedence);
  assert.ok(r[0].guid < r[1].guid);
  const ev = logic.eventsOf(r)[0];
  assert.deepEqual(ev.beaten, [{ row: 1, by: 'guid' }]);
  assert.deepEqual(logic.eventsOf(rows(preset('two-groups')))[0].beaten, [{ row: 1, by: 'precedence' }]);
});

test('tie-break: a PSO applied both directly and through a group is listed once, as direct', () => {
  const r = logic.candidatesOf(scene([{ id: 'A', precedence: 9, guid: 'aa', appliesTo: ['g', 'u'] }], [G('g', ['u'])]));
  assert.deepEqual(r.map((x) => x.id + ':' + x.tier), ['A:direct', 'DDP:domain']);
});

test('tie-break: one PSO on two of the user\'s groups is listed once, via the first group', () => {
  const r = logic.candidatesOf(scene([{ id: 'A', precedence: 9, guid: 'aa', appliesTo: ['h', 'g'] }], [G('g', ['u']), G('h', ['u'])]));
  assert.deepEqual(r.map((x) => x.id + ':' + x.via), ['A:g', 'DDP:domain']);
});

test('tie-break (rule 6) scene: each GUID\'s first group repeats one byte, so text and byte order agree', () => {
  const sc = logic.sceneOf(P({}));
  for (const pso of sc.psos) assert.match(pso.guid, /^([0-9a-f]{2})\1{3}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, pso.id);
  assert.equal(new Set(sc.psos.map((x) => x.guid.slice(0, 2))).size, sc.psos.length, 'first bytes differ');
});

// ── rules ──

test('rule 1: the domain policy comes from the GPO at the domain root', () => {
  assert.equal(win(scene([])), 'DDP');
  assert.equal(won({ noStaff: true }).id, 'Default Domain Policy');
  assert.equal(won({ noStaff: true }).settings.minLength, 7);
});

test('rule 2: a password GPO linked to an OU never applies to a domain account', () => {
  const r = rows({ ouGpo: true, noStaff: true });
  assert.deepEqual(ids(r), ['Default Domain Policy', 'Staff Passwords']);
  assert.equal(r[1].kind, 'ou');
  assert.equal(won({ ouGpo: true, noStaff: true }).id, 'Default Domain Policy');
  assert.deepEqual(logic.eventsOf(r)[0].dropped, [{ row: 1, by: 'ou-gpo' }]);
  // with only an OU GPO and no domain-root GPO, nothing wins
  const sc = scene([]);
  sc.gpos = [{ id: 'OU only', link: 'OU=X', order: 1, settings: S }];
  assert.equal(win(sc), null);
  assert.equal(won(preset('ou-gpo')).id, 'Default-Staff');
  const ev = logic.eventsOf(rows(preset('ou-gpo')));
  assert.deepEqual(ev[1].dropped.map((d) => d.by), ['pso', 'ou-gpo']);
});

test('rule 3: below functional level 2008 every PSO is ignored', () => {
  const p = [{ id: 'A', precedence: 1, guid: 'aa', appliesTo: ['u'] }];
  assert.equal(win(scene(p, [], { level: 2008 })), 'A');
  assert.equal(win(scene(p, [], { level: 2003 })), 'DDP');
  assert.equal(logic.MIN_LEVEL, 2008);
});

test('rule 3: a PSO on an OU, or on a group that is not global, does not apply', () => {
  assert.equal(win(scene([{ id: 'A', precedence: 1, guid: 'aa', appliesTo: ['OU=X'] }])), 'DDP');
  assert.equal(win(scene([{ id: 'A', precedence: 1, guid: 'aa', appliesTo: ['dl'] }], [G('dl', ['u'], 'domain-local')])), 'DDP');
  assert.equal(win(scene([{ id: 'A', precedence: 1, guid: 'aa', appliesTo: ['un'] }], [G('un', ['u'], 'universal')])), 'DDP');
  assert.equal(win(scene([{ id: 'A', precedence: 1, guid: 'aa', appliesTo: ['g'] }], [G('g', ['u'])])), 'A');
  // a global distribution group carries no PSO
  assert.equal(win(scene([{ id: 'A', precedence: 1, guid: 'aa', appliesTo: ['g'] }], [G('g', ['u'], 'global', 'distribution')])), 'DDP');
});

test('rule 4: a direct PSO beats every group PSO, even with a higher number', () => {
  const r = rows(preset('direct-beats-group'));
  assert.deepEqual(ids(r), ['VIP', 'Finance', 'Default-Staff', 'Default Domain Policy']);
  assert.deepEqual(r.map((x) => x.tier), ['direct', 'group', 'group', 'domain']);
  assert.equal(won(preset('direct-beats-group')).id, 'VIP');
  assert.ok(r[0].precedence > r[1].precedence);
  const ev = logic.eventsOf(r);
  assert.deepEqual(ev.map((e) => e.kind + ':' + e.tier), ['tier:direct', 'drop:group', 'winner:null']);
  assert.deepEqual(ev[1].dropped, [{ row: 1, by: 'direct-first' }, { row: 2, by: 'direct-first' }, { row: 3, by: 'pso' }]);
  assert.equal(ev[1].kept, 0, 'the drop step names the row that ended the search (the page reads it)');
  // among direct PSOs, the lowest number
  assert.equal(win(scene([{ id: 'A', precedence: 20, guid: 'aa', appliesTo: ['u'] }, { id: 'B', precedence: 3, guid: 'bb', appliesTo: ['u'] }])), 'B');
});

test('rule 5: among group PSOs the lowest precedence number wins; nested groups count', () => {
  assert.equal(won(preset('two-groups')).id, 'Finance');
  assert.deepEqual(ids(rows(preset('two-groups'))), ['Finance', 'Default-Staff', 'Default Domain Policy']);
  // u in inner, inner in outer: a PSO on outer reaches u
  const sc = scene([{ id: 'Outer', precedence: 2, guid: 'aa', appliesTo: ['outer'] }, { id: 'Inner', precedence: 8, guid: 'bb', appliesTo: ['inner'] }],
    [G('outer', ['inner']), G('inner', ['u'])]);
  assert.deepEqual(logic.groupsOf(sc, 'u'), ['outer', 'inner']);
  assert.equal(win(sc), 'Outer');
  assert.equal(logic.candidatesOf(sc)[0].via, 'outer');
  // a group the user is not in does nothing
  assert.deepEqual(ids(rows({})), ['Default-Staff', 'Default Domain Policy']);
});

test('rule 7: no PSO, the domain policy applies and msDS-ResultantPSO is empty', () => {
  const s = final({ noStaff: true });
  assert.equal(s.rows[s.winner].kind, 'domain');
  assert.equal(s.resultant.resultantPso, null);
  assert.equal(kit.stepsOf(logic, P({ noStaff: true })), 2);
});

test('rule 7: a PSO replaces the domain policy as a whole, no field by field merge', () => {
  const s = final({});
  assert.equal(s.resultant.resultantPso, 'Default-Staff');
  assert.deepEqual(s.resultant.settings, { minLength: 4, complexity: false, lockout: 0 });
  // lockout 0 and complexity off stay, though the domain policy sets 10 and on
  const ddp = s.rows.find((x) => x.kind === 'domain').settings;
  assert.equal(ddp.lockout, 10);
  assert.equal(ddp.complexity, true);
});

// ── steps and marks ──

test('steps: the tier keeps its best row, then everything below is dropped at once, then the winner', () => {
  const p = P(preset('two-groups'));
  const s1 = kit.stateAt(logic, p, 1);
  assert.deepEqual(s1.marks, ['kept', 'beaten', null]);
  assert.equal(s1.kept, 0);
  const s2 = kit.stateAt(logic, p, 2);
  assert.deepEqual(s2.marks, ['kept', 'beaten', 'dropped']);
  assert.equal(s2.event.kind, 'drop');
  assert.equal(s2.event.kept, 0);
  assert.deepEqual(s2.why, [null, 'precedence', 'pso']);
  const s3 = kit.stateAt(logic, p, 3);
  assert.deepEqual(s3.marks, ['won', 'beaten', 'dropped']);
  assert.equal(s3.winner, 0);
  assert.equal(kit.stateAt(logic, p, 0).winner, null);
});

test('steps: with no PSO the domain tier keeps the domain policy and drops an OU GPO', () => {
  const p = P({ noStaff: true, ouGpo: true });
  assert.deepEqual(kit.stateAt(logic, p, 1).marks, ['kept', 'dropped']);
  assert.deepEqual(kit.stateAt(logic, p, 2).marks, ['won', 'dropped']);
});

// ── presets: the task's expected numbers ──

test('presets: winners, resultant settings and step counts from SPEC.md §4', () => {
  const want = {
    quillmoor: ['Default-Staff', 4, false, 0, 3],
    'two-groups': ['Finance', 12, true, 5, 3],
    'direct-beats-group': ['VIP', 15, true, 3, 3],
    tie: ['Default-Staff', 4, false, 0, 3],
    'ou-gpo': ['Default-Staff', 4, false, 0, 3]
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const [id, [name, min, cx, lock, steps]] of Object.entries(want)) {
    const s = final(preset(id));
    assert.equal(s.rows[s.winner].id, name, id);
    assert.deepEqual(s.resultant.settings, { minLength: min, complexity: cx, lockout: lock }, id);
    assert.equal(s.resultant.resultantPso, name, id);
    assert.equal(kit.stepsOf(logic, P(preset(id))), steps, id);
  }
  // quillmoor: weaker than the domain policy (the task's caption)
  assert.ok(won({}).settings.minLength < won({ noStaff: true }).settings.minLength);
});

test('steps: exactly 3 when a PSO applies, 2 when only the domain policy does, for every combination of params', () => {
  const keys = Object.keys(logic.defaults);
  for (let m = 0; m < 1 << keys.length; m++) {
    const p = P({});
    keys.forEach((k, i) => { p[k] = !!(m & (1 << i)); });
    const n = kit.stepsOf(logic, p);
    const s = kit.stateAt(logic, p, n);
    assert.equal(n, s.rows[s.winner].kind === 'pso' ? 3 : 2, JSON.stringify(p));
    assert.equal(s.event.kind, 'winner');
    assert.ok(s.winner >= 0);
    assert.ok(s.marks.every((x) => x !== null && x !== 'kept'), JSON.stringify(p));
  }
});

test('the rule table spec the page builds is valid (page marks, any mode)', () => {
  const s = final(preset('direct-beats-group'));
  const map = { won: 'win', beaten: 'beaten', dropped: 'skip', kept: 'hit' };
  const rowsSpec = s.rows.map((x, i) => ({ no: i + 1, cells: { name: x.id }, hit: null, mark: map[s.marks[i]] || null }));
  assert.deepEqual(RT.checkSpec({ mode: 'specific', columns: [{ key: 'name' }], rows: rowsSpec, at: s.winner, done: true }), []);
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
  const p = P(preset('direct-beats-group'));
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
