// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for win-ntfs-inheritance. Run: node --test sims/win-ntfs-inheritance/
// Tie-breaks first, then one test per rule of SPEC.md §2, then the presets' expected results (§4), then the generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const run = (script, n, over) => {
  const p = P(Object.assign({ script, user: logic.SCRIPTS[script].user }, over));
  const s = kit.stateAt(logic, p, n);
  return { s, p, v: logic.view(s, p) };
};
const rowsOf = (v) => v.dacl.map((r) => `${r.explicit ? 'E' : 'I' + r.lvl + ':' + r.from}${r.kept ? '*' : ''} ${r.trustee} ${r.type} ${r.rights}`);
const ace = (id, trustee, type, rights, appliesTo) => ({ id, trustee, type, rights, appliesTo });
const node = (id, parent, kind, aces, extra) => Object.assign({ id, name: id, parent, kind, vol: 'D', inherit: true, kept: null, aces }, extra);

// ── tie-breaks first ──

test('tie-break: two inherited ACEs from different ancestors — the nearer one comes first, whatever its type', () => {
  const { v } = run('explicit-beats-inherited', 5, { user: 'vanjski' });
  assert.equal(v.node.path, 'D:\\Projekti\\Grafika\\Kampanja2026\\logo.psd');
  assert.deepEqual(rowsOf(v).slice(0, 2), ['I1:kamp Vanjski allow write', 'I3:proj Vanjski deny write']);
  assert.equal(v.access.by.w, 0, 'the allow from Kampanja2026 decides Write');
  assert.equal(v.access.rows[1].mark, 'beaten');
  assert.deepEqual(v.access.name, ['readExecute', 'write']);
});

test('tie-break: within one level deny comes before allow, even when the allow was written first', () => {
  const { v } = run('explicit-beats-inherited', 1);
  assert.deepEqual(rowsOf(v), ['E Vanjski deny write', 'E Administrators allow full', 'E Zaposlenici allow readExecute', 'E Vanjski allow readExecute']);
  // and in a single inherited level the same holds
  const d = logic.dacls([
    node('a', null, 'folder', [ace('1', 'X', 'allow', 'read', 'this+sub+files'), ace('2', 'X', 'deny', 'read', 'this+sub+files')]),
    node('b', 'a', 'folder', [])
  ]);
  assert.deepEqual(d.b.map((r) => r.type), ['deny', 'allow']);
  // inherited rows of one level that arrive allow first (a kept set, a hand-built list) are sorted deny first
  const inh = [
    { trustee: 'A', type: 'allow', explicit: false, lvl: 1 },
    { trustee: 'D', type: 'deny', explicit: false, lvl: 1 },
    { trustee: 'G', type: 'deny', explicit: false, lvl: 2 }
  ];
  assert.deepEqual(logic.sortDacl(inh).map((r) => r.trustee), ['D', 'A', 'G']);
});

test('tie-break: same group and level keeps the written / inherited order (stable)', () => {
  const rows = [
    { trustee: 'B', type: 'allow', explicit: true, lvl: 0 },
    { trustee: 'A', type: 'allow', explicit: true, lvl: 0 },
    { trustee: 'C', type: 'allow', explicit: false, lvl: 1 },
    { trustee: 'D', type: 'allow', explicit: false, lvl: 1 }
  ];
  assert.deepEqual(logic.sortDacl(rows).map((r) => r.trustee), ['B', 'A', 'C', 'D']);
  assert.deepEqual(logic.sortDacl([rows[3], rows[2], rows[1], rows[0]]).map((r) => r.trustee), ['A', 'B', 'D', 'C']);
});

test('tie-break: siblings are listed by name, parents before children, D: before E:', () => {
  const ids = logic.order(logic.baseTree()).map((o) => o.id);
  assert.deepEqual(ids, ['proj', 'arh', 'graf', 'kamp', 'logo', 'plakat', 'earh']);
});

// ── rules ──

test('rule 1: an inheritable ACE reaches every inheriting object below, marked with its folder and level', () => {
  const { v } = run('basic', 3);
  assert.deepEqual(rowsOf(v), ['I3:proj Administrators allow full', 'I3:proj Zaposlenici allow readExecute', 'I3:proj Grafičari allow modify']);
  assert.equal(v.node.explicit, 0);
  assert.equal(v.node.inherited, 3);
});

test('rule 2: "applies to" decides what children receive and what counts on the folder itself', () => {
  assert.equal(logic.passDown('this', 'folder'), null);
  assert.equal(logic.passDown('this', 'file'), null);
  assert.equal(logic.passDown('this+sub+files', 'folder'), 'this+sub+files');
  assert.equal(logic.passDown('sub+files', 'folder'), 'this+sub+files');
  assert.equal(logic.passDown('files', 'folder'), 'files');
  ['this+sub+files', 'sub+files', 'files'].forEach((a) => assert.equal(logic.passDown(a, 'file'), 'this'));
  assert.equal(logic.effectiveOn({ appliesTo: 'sub+files' }, 'folder'), false);
  assert.equal(logic.effectiveOn({ appliesTo: 'files' }, 'folder'), false);
  assert.equal(logic.effectiveOn({ appliesTo: 'this' }, 'folder'), true);
  assert.equal(logic.effectiveOn({ appliesTo: 'this+sub+files' }, 'folder'), true);
  // a "files only" ACE: skipped on the folder, inherit-only on a subfolder, effective on a file two levels down
  const tree = [
    node('a', null, 'folder', [ace('1', 'X', 'allow', 'modify', 'files')]),
    node('b', 'a', 'folder', []),
    node('f', 'b', 'file', [])
  ];
  const d = logic.dacls(tree);
  assert.equal(logic.access(d.a, 'folder', 'X').rows[0].mark, 'skip');
  assert.equal(d.b[0].appliesTo, 'files');
  assert.equal(logic.access(d.b, 'folder', 'X').rows[0].mark, 'skip');
  assert.equal(d.f[0].appliesTo, 'this');
  assert.deepEqual(logic.access(d.f, 'file', 'X').name, ['modify']);
  // "this folder only" stops at the folder
  const d2 = logic.dacls([node('a', null, 'folder', [ace('1', 'X', 'allow', 'read', 'this')]), node('b', 'a', 'folder', [])]);
  assert.equal(d2.b.length, 0);
});

test('rule 3: explicit deny, explicit allow, then inherited level by level; an explicit allow beats an inherited deny', () => {
  const { v } = run('explicit-beats-inherited', 3);
  assert.equal(v.node.path, 'D:\\Projekti\\Grafika\\Kampanja2026');
  assert.deepEqual(rowsOf(v).slice(0, 2), ['E Vanjski allow write', 'I2:proj Vanjski deny write']);
  assert.equal(v.access.by.w, 0);
  assert.equal(v.access.rows[1].mark, 'beaten');
  assert.deepEqual(v.access.name, ['readExecute', 'write']);
  // an explicit deny is read before everything
  const d = logic.dacls([
    node('a', null, 'folder', [ace('1', 'X', 'allow', 'full', 'this+sub+files')]),
    node('b', 'a', 'folder', [ace('2', 'X', 'allow', 'full', 'this'), ace('3', 'X', 'deny', 'write', 'this')])
  ]);
  assert.deepEqual(d.b.map((r) => (r.explicit ? 'E' : 'I') + r.type), ['Edeny', 'Eallow', 'Iallow']);
  assert.deepEqual(logic.access(d.b, 'folder', 'X').atoms, ['r', 'x', 'd', 'p']);
  // the inherited deny decides when no explicit allow is before it
  const g = run('explicit-beats-inherited', 2).v;
  assert.equal(g.access.rows[g.access.by.w].mark, 'win');
  assert.equal(g.dacl[g.access.by.w].type, 'deny');
});

test('rule 3: a right no ACE mentions is refused (implicit deny); an empty DACL gives nothing', () => {
  const { v } = run('basic', 0, { user: 'vanjski' });
  assert.deepEqual(v.access.atoms, []);
  assert.equal(v.access.implicit, true);
  assert.deepEqual(logic.access([], 'folder', 'ana').name, []);
});

test('rule 4: disable with convert keeps the same rows as explicit; parent changes no longer arrive', () => {
  const before = run('disable-convert', 0).v;
  const after = run('disable-convert', 1).v;
  assert.deepEqual(after.dacl.map((r) => r.trustee + r.rights), before.dacl.map((r) => r.trustee + r.rights));
  assert.ok(after.dacl.every((r) => r.explicit));
  assert.equal(after.node.inherit, false);
  const k = run('disable-convert', 4).v;
  assert.equal(k.node.id, 'kamp');
  assert.ok(k.dacl.some((r) => r.trustee === 'Grafičari'), 'removing Grafičari on Projekti did not reach Kampanja2026');
  assert.ok(!run('disable-convert', 3).v.dacl.some((r) => r.trustee === 'Grafičari'), 'it did reach Grafika');
  // children of the protected folder inherit from it
  assert.deepEqual(rowsOf(run('disable-convert', 5).v), ['I1:kamp Administrators allow full', 'I1:kamp Zaposlenici allow readExecute', 'I1:kamp Grafičari allow modify']);
});

test('rule 4: disable with remove leaves only the explicit ACEs (here none): nobody has access', () => {
  const v = run('disable-convert', 1, { disable: 'remove' }).v;
  assert.equal(v.dacl.length, 0);
  assert.deepEqual(v.access.name, []);
  assert.equal(run('disable-convert', 5, { disable: 'remove' }).v.dacl.length, 0);
  assert.equal(run('disable-convert', 1, { disable: 'remove' }).s.event.mode, 'remove');
});

test('rule 5: a copy is a new object with no explicit ACEs that inherits from its new parent', () => {
  const { s, v } = run('copy-vs-move', 1);
  assert.equal(v.node.path, 'D:\\Projekti\\Arhiva\\plakat.psd');
  assert.deepEqual(rowsOf(v), ['I1:arh Arhivari allow modify', 'I2:proj Administrators allow full', 'I2:proj Zaposlenici allow readExecute']);
  assert.ok(s.tree.find((x) => x.id === 'plakat' && x.parent === 'kamp'), 'the original stays');
  assert.deepEqual(v.access.name, ['readExecute']);
  assert.deepEqual(run('copy-vs-move', 1, { user: 'marko' }).v.access.name, ['modify']);
});

test('rule 5: a move to another volume behaves like a copy (explicit ACEs gone too)', () => {
  const a = run('cross-volume', 1).v;
  assert.equal(a.node.path, 'E:\\Arhiva\\logo.psd');
  assert.deepEqual(rowsOf(a), ['I1:earh Administrators allow full', 'I1:earh Arhivari allow modify', 'I1:earh Zaposlenici allow readExecute']);
  const b = run('cross-volume', 2);
  assert.equal(b.v.node.path, 'E:\\Arhiva\\plakat.psd');
  assert.equal(b.v.node.explicit, 0, 'plakat.psd lost its explicit ana Full Control');
  assert.deepEqual(b.v.access.name, ['readExecute']);
  assert.equal(b.s.event.cross, true);
  // a file that kept its old entries after a same-volume move loses them on a move to another volume
  const kept = logic.apply(logic.baseTree(), { kind: 'move', target: 'logo', dest: 'arh' }, P()).tree;
  assert.ok(kept.find((x) => x.id === 'logo').kept);
  const moved = logic.apply(kept, { kind: 'move', target: 'logo', dest: 'earh' }, P()).tree;
  assert.equal(moved.find((x) => x.id === 'logo').kept, null);
  assert.ok(logic.dacls(moved).logo.every((r) => r.from === 'earh' && !r.kept));
});

test('rule 6: a move within the volume keeps explicit and old inherited ACEs, and takes nothing from the new parent', () => {
  const { s, v } = run('copy-vs-move', 2);
  assert.equal(v.node.path, 'D:\\Projekti\\Arhiva\\logo.psd');
  assert.deepEqual(rowsOf(v), ['I2:graf* Grafičari allow modify', 'I3:proj* Administrators allow full', 'I3:proj* Zaposlenici allow readExecute']);
  assert.ok(!v.dacl.some((r) => r.trustee === 'Arhivari'));
  assert.equal(s.event.cross, false);
  assert.deepEqual(v.access.name, ['modify']);
  assert.deepEqual(run('copy-vs-move', 2, { user: 'marko' }).v.access.name, ['readExecute']);
  // explicit ACEs are kept by a same-volume move
  const r = logic.apply(logic.baseTree(), { kind: 'move', target: 'plakat', dest: 'arh' }, P());
  assert.deepEqual(r.tree.find((x) => x.id === 'plakat').aces.map((a) => a.trustee), ['ana']);
});

test('rule 7: a change on an ancestor re-propagates and replaces a kept set; a change elsewhere leaves it', () => {
  const v = run('copy-vs-move', 4).v;
  assert.equal(v.node.id, 'logo');
  assert.deepEqual(rowsOf(v), ['I1:arh Arhivari allow modify', 'I1:arh Grafičari allow readExecute', 'I2:proj Administrators allow full', 'I2:proj Zaposlenici allow readExecute']);
  assert.deepEqual(v.access.name, ['readExecute']);
  // a change on a sibling branch keeps the kept set
  const s2 = run('copy-vs-move', 2).s;
  const r = logic.apply(s2.tree, { kind: 'add', target: 'graf', ace: ace('z', 'Vanjski', 'allow', 'read', 'this+sub+files') }, P());
  assert.ok(r.tree.find((x) => x.id === 'logo').kept, 'still kept');
  // a change on the object itself re-reads its parent
  const r2 = logic.apply(s2.tree, { kind: 'add', target: 'logo', ace: ace('z', 'Vanjski', 'allow', 'read', 'this') }, P());
  assert.equal(r2.tree.find((x) => x.id === 'logo').kept, null);
  // a parent change reaches every inheriting child (basic: 5 objects below Projekti)
  const d = logic.dacls(run('basic', 1).s.tree);
  assert.deepEqual(['arh', 'graf', 'kamp', 'logo', 'plakat'].filter((k) => d[k].some((x) => x.id === 'g1')), ['arh', 'graf', 'kamp', 'logo', 'plakat']);
  assert.ok(!d.earh.some((x) => x.id === 'g1'), 'not to the other volume');
});

test('validation: a rejected operation changes nothing and says why', () => {
  const t0 = logic.baseTree();
  const cases = [
    [{ kind: 'move', target: 'logo', dest: 'kamp' }, 'sameFolder'],
    [{ kind: 'copy', target: 'logo', dest: 'logo' }, 'destNotFolder'],
    [{ kind: 'copy', target: 'graf', dest: 'arh' }, 'notFile'],
    [{ kind: 'copy', target: 'nope', dest: 'arh' }, 'missing'],
    [{ kind: 'remove', target: 'graf', trustee: 'Nobody' }, 'noSuchAce']
  ];
  cases.forEach(([op, reason]) => {
    const r = logic.apply(t0, op, P());
    assert.equal(r.event.ok, false);
    assert.equal(r.event.reason, reason);
    assert.deepEqual(r.tree, t0);
  });
  // a copy where the name is already taken
  const once = logic.apply(t0, { kind: 'copy', target: 'logo', dest: 'arh' }, P()).tree;
  assert.equal(logic.apply(once, { kind: 'copy', target: 'logo', dest: 'arh' }, P()).event.reason, 'nameTaken');
  // a move onto a name already in the destination
  const moveOnto = logic.apply(once, { kind: 'move', target: 'logo', dest: 'arh' }, P());
  assert.equal(moveOnto.event.reason, 'nameTaken');
  assert.deepEqual(moveOnto.tree, once);
  // disable twice
  const off = logic.apply(t0, { kind: 'disable', target: 'kamp' }, P()).tree;
  assert.equal(logic.apply(off, { kind: 'disable', target: 'kamp' }, P()).event.reason, 'alreadyOff');
});

// ── presets: SPEC §4 ──

test('presets: step counts', () => {
  const want = { 'basic': 3, 'explicit-beats-inherited': 5, 'disable-convert': 5, 'copy-vs-move': 4, 'cross-volume': 3 };
  Object.keys(want).forEach((id) => assert.equal(logic.steps(P({ script: id })), want[id], id));
  assert.equal(logic.steps(logic.defaults), 3);
});

test('presets: the user\'s access at every step', () => {
  const want = {
    'basic': ['readExecute', 'modify', 'modify', 'modify'],
    'explicit-beats-inherited': ['readExecute', 'readExecute', 'readExecute', 'readExecute+write', 'readExecute', 'readExecute+write'],
    'disable-convert': ['modify', 'modify', 'readExecute', 'readExecute', 'modify', 'modify'],
    'copy-vs-move': ['full', 'readExecute', 'modify', 'readExecute', 'readExecute'],
    'cross-volume': ['modify', 'readExecute', 'readExecute', 'modify']
  };
  Object.keys(want).forEach((id) => {
    want[id].forEach((w, n) => assert.equal(run(id, n).v.access.name.join('+'), w, `${id} step ${n}`));
  });
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((n) => run('disable-convert', n, { disable: 'remove' }).v.access.name.join('+') || '-'),
    ['modify', '-', 'readExecute', 'readExecute', '-', '-']);
});

test('presets: the shown object at every step', () => {
  const want = {
    'basic': ['proj', 'proj', 'kamp', 'logo'],
    'explicit-beats-inherited': ['proj', 'proj', 'kamp', 'kamp', 'graf', 'logo'],
    'disable-convert': ['kamp', 'kamp', 'proj', 'graf', 'kamp', 'logo'],
    'copy-vs-move': ['plakat', 'plakat@arh', 'logo', 'arh', 'logo'],
    'cross-volume': ['logo', 'logo', 'plakat', 'earh']
  };
  Object.keys(want).forEach((id) => want[id].forEach((w, n) => assert.equal(run(id, n).v.shown, w, `${id} step ${n}`)));
});

test('presets: cross-volume step 3 reaches both moved files', () => {
  const { s } = run('cross-volume', 3);
  const d = logic.dacls(s.tree);
  ['logo', 'plakat'].forEach((k) => assert.ok(d[k].some((r) => r.trustee === 'Grafičari' && r.from === 'earh'), k));
  assert.equal(run('cross-volume', 3).v.node.explicit, 4);
});

// ── the page's helpers ──

test('pick: a clicked object is shown instead of the step\'s; an object that does not exist yet falls back', () => {
  assert.equal(run('basic', 1, { pick: 'logo' }).v.shown, 'logo');
  assert.equal(run('basic', 1, { pick: 'logo' }).v.picked, true);
  assert.equal(run('copy-vs-move', 0, { pick: 'plakat@arh' }).v.shown, 'plakat');
});

test('changes: re-sorted and new rows are marked; a select step marks nothing', () => {
  const a = run('explicit-beats-inherited', 0).s, b = run('explicit-beats-inherited', 1).s;
  const ch = logic.changes(a, b, 'proj');
  assert.deepEqual(ch.rows, [0], 'only the new deny; rows pushed down by it are not marked');
  // a re-sort among rows present in both is marked
  const t0 = [node('a', null, 'folder', [ace('1', 'X', 'allow', 'read', 'this'), ace('2', 'Y', 'allow', 'read', 'this')])];
  const t1 = [node('a', null, 'folder', [ace('2', 'Y', 'allow', 'read', 'this'), ace('1', 'X', 'allow', 'read', 'this')])];
  assert.deepEqual(logic.changes({ tree: t0 }, { tree: t1 }, 'a').rows, [0, 1]);
  assert.ok(ch.nodes.includes('logo') && ch.nodes.includes('proj') && !ch.nodes.includes('earh'));
  const c = run('explicit-beats-inherited', 2).s;
  assert.deepEqual(logic.changes(b, c, 'kamp'), { nodes: [], rows: [], removed: 0 });
  // convert: every row changes from inherited to explicit
  const d0 = run('disable-convert', 0).s, d1 = run('disable-convert', 1).s;
  assert.deepEqual(logic.changes(d0, d1, 'kamp').rows, [0, 1, 2]);
  // removal is counted
  const d2 = run('disable-convert', 2).s;
  assert.equal(logic.changes(d1, d2, 'proj').removed, 1);
  assert.equal(logic.changes(d0, d1, 'kamp').removed, 0, 'convert removes nothing');
  assert.equal(logic.changes(d0, run('disable-convert', 1, { disable: 'remove' }).s, 'kamp').removed, 3);
  // a new copy: all its rows are new
  assert.deepEqual(logic.changes(run('copy-vs-move', 0).s, run('copy-vs-move', 1).s, 'plakat@arh').rows, [0, 1, 2]);
  assert.deepEqual(logic.changes(null, b, 'proj'), { nodes: [], rows: [], removed: 0 });
});

// ── from the fresh review: gaps its mutations found ──

test('sort: levels never overlap — an inherited deny from the grandparent sorts after an allow from the parent', () => {
  const r = logic.sortDacl([{ trustee: 'G', type: 'deny', explicit: false, lvl: 2 }, { trustee: 'A', type: 'allow', explicit: false, lvl: 1 }]);
  assert.deepEqual(r.map((x) => x.trustee), ['A', 'G']);
});

test('inherit-only rows neither match nor decide on the folder that holds them', () => {
  const d = logic.dacls([node('a', null, 'folder', [ace('1', 'X', 'allow', 'modify', 'sub+files')]), node('b', 'a', 'folder', [])]);
  const a = logic.access(d.a, 'folder', 'X');
  assert.deepEqual(a.name, []);
  assert.equal(a.rows[0].match, false);
  assert.deepEqual(logic.access(d.b, 'folder', 'X').name, ['modify']);
});

test('deciders and row levels: which rows the chips and the outcomes name', () => {
  const v = run('explicit-beats-inherited', 3).v;   // kamp: 1 allow W (E), 2 deny W (I), 3 Admin, 4 Zap, 5 Vanjski RX
  assert.deepEqual(v.access.deciders.read, [4]);
  assert.deepEqual(v.access.deciders.readExecute, [4]);
  assert.deepEqual(v.access.deciders.write, [0]);
  assert.deepEqual(v.access.deciders.modify, [], 'd: no ACE mentions it (implicit deny)');
  assert.deepEqual(v.access.rows[0].levels, ['write']);
  assert.deepEqual(v.access.rows[4].levels, ['read', 'readExecute']);
  assert.deepEqual(v.access.rows[1].levels, []);
  const g = run('explicit-beats-inherited', 4).v;   // graf: the inherited deny refuses W, M and F
  assert.deepEqual(g.access.deciders.write, [0]);
  assert.deepEqual(g.access.deciders.modify, [0]);
  assert.deepEqual(g.access.rows[0].levels, ['write', 'modify', 'full']);
});

test('view: explicit and inherited counts per node', () => {
  const v = run('copy-vs-move', 0).v;
  const pl = v.nodes.find((n) => n.id === 'plakat');
  assert.equal(pl.explicit, 1);
  assert.equal(pl.inherited, 3);
  assert.equal(v.nodes.find((n) => n.id === 'proj').inherited, 0);
});

test('changes: convert marks the objects below whose rows now come from the converted folder', () => {
  const d0 = run('disable-convert', 0).s, d1 = run('disable-convert', 1).s;
  const ch = logic.changes(d0, d1, 'kamp');
  assert.ok(ch.nodes.includes('kamp') && ch.nodes.includes('logo') && ch.nodes.includes('plakat'));
  assert.ok(!ch.nodes.includes('graf'));
});

test('convert keeps "applies to": an inherit-only row stays inherit-only', () => {
  const tree = [node('a', null, 'folder', [ace('1', 'X', 'allow', 'modify', 'files')]), node('b', 'a', 'folder', [])];
  const r = logic.apply(tree, { kind: 'disable', target: 'b' }, P());
  assert.equal(r.tree.find((x) => x.id === 'b').aces[0].appliesTo, 'files');
  assert.deepEqual(logic.access(logic.dacls(r.tree).b, 'folder', 'X').name, []);
});

test('convert re-sorts as explicit: a nearer inherited allow above a farther deny falls below it', () => {
  const s5 = run('explicit-beats-inherited', 5).s;
  const r = logic.apply(s5.tree, { kind: 'disable', target: 'logo' }, P({ disable: 'convert' }));
  const d = logic.dacls(r.tree).logo;
  assert.equal(d[0].type, 'deny');
  assert.deepEqual(logic.access(d, 'file', 'vanjski').name, ['readExecute']);
});

test('copy and cross-volume move: the new object is on the destination volume and inherits', () => {
  const c = run('copy-vs-move', 1).s.tree.find((x) => x.id === 'plakat@arh');
  assert.equal(c.vol, 'D');
  const t0 = logic.apply(logic.baseTree(), { kind: 'copy', target: 'logo', dest: 'earh' }, P()).tree;
  assert.equal(t0.find((x) => x.id === 'logo@earh').vol, 'E');
  // a protected file moved to another volume inherits again
  const off = logic.apply(logic.baseTree(), { kind: 'disable', target: 'logo' }, P()).tree;
  const m = logic.apply(off, { kind: 'move', target: 'logo', dest: 'earh' }, P()).tree.find((x) => x.id === 'logo');
  assert.equal(m.inherit, true);
  assert.equal(m.vol, 'E');
  // and a later same-volume move on E: of a cross-volume file keeps what E:\Arhiva gave it
  assert.ok(logic.dacls(logic.apply(off, { kind: 'move', target: 'logo', dest: 'earh' }, P()).tree).logo.every((r) => r.from === 'earh'));
});

test('events: an add carries its ACE (the caption needs it); a remove its trustee; a move its old parent', () => {
  const e = run('basic', 1).s.event;
  assert.deepEqual(e.ace, { id: 'g1', trustee: 'Grafičari', type: 'allow', rights: 'modify', appliesTo: 'this+sub+files' });
  assert.equal(run('disable-convert', 2).s.event.trustee, 'Grafičari');
  assert.equal(run('copy-vs-move', 2).s.event.from, 'kamp');
  assert.equal(run('disable-convert', 1).s.event.mode, 'convert');
});

test('remove rejects a trustee that has no entry, also on an object that has entries', () => {
  const r = logic.apply(logic.baseTree(), { kind: 'remove', target: 'proj', trustee: 'Nobody' }, P());
  assert.equal(r.event.reason, 'noSuchAce');
  assert.equal(r.tree.find((x) => x.id === 'proj').aces.length, 2);
});

test('rule 7: the re-propagation walk stops at a folder with inheritance disabled', () => {
  let t = logic.apply(logic.baseTree(), { kind: 'disable', target: 'kamp' }, P()).tree;
  t = logic.apply(t, { kind: 'move', target: 'plakat@x', dest: 'kamp' }, P()).tree;   // missing: rejected, unchanged
  t = logic.apply(t, { kind: 'move', target: 'logo', dest: 'graf' }, P()).tree;
  t = logic.apply(t, { kind: 'move', target: 'logo', dest: 'kamp' }, P()).tree;        // into the protected folder, kept
  assert.ok(t.find((x) => x.id === 'logo').kept);
  t = logic.apply(t, { kind: 'add', target: 'proj', ace: ace('z', 'Vanjski', 'allow', 'read', 'this+sub+files') }, P()).tree;
  assert.ok(t.find((x) => x.id === 'logo').kept, 'a change above the protected folder does not reach below it');
  t = logic.apply(t, { kind: 'add', target: 'kamp', ace: ace('y', 'Vanjski', 'allow', 'read', 'this+sub+files') }, P()).tree;
  assert.equal(t.find((x) => x.id === 'logo').kept, null, 'a change on the protected folder itself does');
});

test('defaults: the default user is the default script\'s user', () => {
  assert.equal(logic.defaults.user, logic.SCRIPTS[logic.defaults.script].user);
  assert.equal(logic.defaults.showFlags, false);
  assert.equal(logic.defaults.disable, 'convert');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  logic.SCRIPT_IDS.forEach((id) => {
    for (let n = 0; n <= logic.steps(P({ script: id })); n++) {
      const s = run(id, n).s;
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  });
});

test('replay is deterministic and step back equals replay', () => {
  logic.SCRIPT_IDS.forEach((id) => {
    const p = P({ script: id });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  });
});

test('step does not mutate its input', () => {
  logic.SCRIPT_IDS.forEach((id) => {
    const p = P({ script: id });
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  });
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model; meta steps match the default script', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the default script');
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, meta.steps);
  logic.SCRIPT_IDS.forEach((id) => {
    assert.ok(logic.SCRIPTS[id].user in logic.USERS);
    assert.ok(logic.SCRIPTS[id].ops.length <= 20);
  });
  for (const k of ['script', 'user', 'showFlags', 'disable', 'pick']) assert.ok(k in logic.defaults, k);
});
