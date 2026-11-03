// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-rsync-delete's model (rules: SPEC.md). Run: node --test sims/lnx-rsync-delete/
// Expected lists were checked against rsync 3.2.7 (NOTES.md, "Checked against rsync").
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
/** The printed list without the header and the summary. */
const body = (s) => s.list.slice(1, -2);
const CMD = (over) => Object.assign({ slash: true, delete: false, dryRun: false, dest: 'rsync' }, over);

// ── tie-breaks first (rule 7) ──

test('rule 7: deletions first, reverse order inside a directory, contents before the directory', () => {
  const s = at({ script: 'wrong-destination' }, 1);
  assert.deepEqual(body(s), [
    'deleting vjezba-scp/pod/b.txt', 'deleting vjezba-scp/pod/', 'deleting vjezba-scp/a.txt', 'deleting vjezba-scp/',
    'deleting vjezba-rsync2/vjezba/pod/b.txt', 'deleting vjezba-rsync2/vjezba/pod/', 'deleting vjezba-rsync2/vjezba/a.txt',
    'deleting vjezba-rsync2/vjezba/', 'deleting vjezba-rsync2/',
    'deleting vjezba-rsync/pod/b.txt', 'deleting vjezba-rsync/pod/', 'deleting vjezba-rsync/a.txt', 'deleting vjezba-rsync/',
    'deleting proba/', 'deleting paketi/' + logic.RPM, 'deleting paketi/', 'deleting tajna', 'deleting pokvaren.rpm',
    'deleting nohup.out',
    './', 'a.txt', 'pod/', 'pod/b.txt'
  ]);
});

test('rule 7: transfer list depth first, a directory\'s files before its subdirectories', () => {
  const src = logic.srcStart();
  src['vjezba/z.txt'] = { kind: 'f', size: 1, mtime: 10, data: 'z' };
  src['vjezba/aaa'] = { kind: 'd', size: null, mtime: 10, data: null };
  src['vjezba/aaa/c.txt'] = { kind: 'f', size: 1, mtime: 10, data: 'c' };
  const r = logic.run(src, logic.dstFresh(), CMD({}), 40);
  assert.deepEqual(r.list.slice(2, -2), ['./', 'a.txt', 'z.txt', 'aaa/', 'aaa/c.txt', 'pod/', 'pod/b.txt']);
});

test('rule 7: a subdirectory\'s deletions come where the walk reaches it, before its own line', () => {
  const src = logic.srcStart();
  const dst = logic.run(src, logic.dstFresh(), CMD({}), 40).dst;
  dst['vjezba-rsync/pod/old'] = { kind: 'f', size: 1, mtime: 1, data: 'o' };
  dst['vjezba-rsync/zz'] = { kind: 'f', size: 1, mtime: 1, data: 'z' };
  src['vjezba/a.txt'] = { kind: 'f', size: 4, mtime: 41, data: 'new' };
  src['vjezba/pod/new'] = { kind: 'f', size: 3, mtime: 41, data: 'nb' };
  src['vjezba'].mtime = 41; src['vjezba/pod'].mtime = 41;
  const r = logic.run(src, dst, CMD({ delete: true, dryRun: true }), 42);
  // rsync 3.2.7 printed this in 36 of 40 runs (the order across directories is not fixed; SPEC.md rule 7)
  assert.deepEqual(r.list.slice(1, -2), ['deleting zz', './', 'a.txt', 'deleting pod/old', 'pod/', 'pod/new']);
});

// ── rule 1: the trailing slash ──

test('rule 1: with the slash the contents arrive, without it one level more (the book\'s two runs)', () => {
  const s1 = at({ script: 'book-slash' }, 1), s2 = at({ script: 'book-slash' }, 2);
  assert.deepEqual(s1.list, ['sending incremental file list', 'created directory /home/student/vjezba-rsync',
    './', 'a.txt', 'pod/', 'pod/b.txt', '', 'total size is 17']);
  assert.deepEqual(body(s2), ['created directory /home/student/vjezba-rsync2', 'vjezba/', 'vjezba/a.txt', 'vjezba/pod/', 'vjezba/pod/b.txt']);
  const ls = (d) => logic.children(s2.dst, d).map(logic.base).sort();
  assert.deepEqual(ls('vjezba-rsync'), ['a.txt', 'pod']);
  assert.deepEqual(ls('vjezba-rsync2'), ['vjezba']);
});

test('rule 1: the second book run flips the slash and takes the other directory', () => {
  assert.deepEqual(logic.cmdFor({ run: { flip: true } }, logic.norm({ slash: false, dest: 'rsync2' })),
    { slash: true, delete: false, dryRun: false, dest: 'rsync' });
  assert.deepEqual(logic.cmdFor({ run: { flip: true } }, logic.norm({ dest: 'home' })),
    { slash: false, delete: false, dryRun: false, dest: 'rsync' });
});

// ── rule 2: only what differs ──

test('rule 2: a re-run with nothing changed lists nothing', () => {
  const src = logic.srcStart();
  const d1 = logic.run(src, logic.dstFresh(), CMD({}), 40).dst;
  const r = logic.run(src, d1, CMD({ delete: true }), 41);
  assert.deepEqual(r.list.slice(1, -2), []);
  assert.equal(r.sent.length, 0);
});

test('rule 2: quick check sends on a different mtime or size; checksum only on different content', () => {
  const a = { kind: 'f', size: 11, mtime: 10, data: 'a' };
  assert.equal(logic.differs(a, Object.assign({}, a, { mtime: 20 })), true);
  assert.equal(logic.differs(a, Object.assign({}, a, { size: 12 })), true);
  assert.equal(logic.differs(a, Object.assign({}, a)), false);
  assert.equal(logic.differs(a, Object.assign({}, a, { data: 'X' })), false, 'same size and time: quick check misses it');
  assert.equal(logic.differs(a, Object.assign({}, a, { data: 'X' }), true), true, '-c finds it');
  assert.equal(logic.differs(a, Object.assign({}, a, { mtime: 20 }), true), false, '-c ignores the time');
  assert.equal(logic.differs(a, undefined), true);
});

test('rule 2: the home\'s scp copy of a.txt has another mtime, so it is sent again', () => {
  const s = at({ script: 'wrong-destination' }, 1);
  assert.ok(s.would.sent.includes('a.txt'));
  assert.ok(!s.would.del.includes('a.txt'));
});

// ── rule 3: --delete ──

test('rule 3: without --delete the destination keeps a file the source lost; with it the file goes', () => {
  const s3 = at({}, 3), s4 = at({}, 4);
  assert.deepEqual(body(s3), ['./']);
  assert.ok(s3.dst['vjezba-rsync/a.txt']);
  assert.deepEqual(body(s4), ['deleting a.txt']);
  assert.equal(s4.dst['vjezba-rsync/a.txt'], undefined);
  assert.deepEqual(s4.deleted, ['vjezba-rsync/a.txt']);
  assert.ok(s4.gone['vjezba-rsync/a.txt']);
});

test('rule 3: --delete touches nothing outside the destination root', () => {
  // the home itself changes mtime when vjezba-rsync appears in it
  const s4 = at({}, 4), s0 = at({}, 0);
  for (const k of Object.keys(s0.dst)) if (k && !k.startsWith('vjezba-rsync')) assert.deepEqual(s4.dst[k], s0.dst[k], k);
});

// ── rule 4: dry run ──

test('rule 4: a dry run prints the same list, created directory included, plus (DRY RUN), and changes nothing', () => {
  const src = logic.srcStart(), dst = logic.dstFresh();
  const dry = logic.run(src, dst, CMD({ dryRun: true }), 40), real = logic.run(src, dst, CMD({}), 40);
  assert.deepEqual(dry.list.slice(0, -1), real.list.slice(0, -1));
  assert.equal(dry.list[dry.list.length - 1], 'total size is 17 (DRY RUN)');
  assert.equal(real.list[real.list.length - 1], 'total size is 17');
  assert.ok(dry.list.includes('created directory /home/student/vjezba-rsync'));
  assert.deepEqual(dry.dst, dst);
});

test('rule 4: dry-run-first: the dry run leaves the destination as it was, the real run then deletes', () => {
  const s1 = at({ script: 'dry-run-first' }, 1), s2 = at({ script: 'dry-run-first' }, 2), s3 = at({ script: 'dry-run-first' }, 3);
  assert.deepEqual(body(s2), ['deleting a.txt', './']);
  assert.equal(s2.list[s2.list.length - 1], 'total size is 6 (DRY RUN)');
  assert.equal(s2.lastRunDry, true);
  assert.deepEqual(s2.dst, s1.dst);
  assert.deepEqual(s2.would.del, ['vjezba-rsync/a.txt']);
  assert.deepEqual(s2.changed, []);
  assert.deepEqual(body(s3), ['deleting a.txt', './']);
  assert.equal(s3.list[s3.list.length - 1], 'total size is 6');
  assert.equal(s3.dst['vjezba-rsync/a.txt'], undefined);
});

// ── rule 5: a mirror repeats the mistake ──

test('rule 5: nightly mirror: the encrypted file replaces the good copy, and no older copy is left', () => {
  const s1 = at({ script: 'nightly-mirror' }, 1), s2 = at({ script: 'nightly-mirror' }, 2), s3 = at({ script: 'nightly-mirror' }, 3);
  assert.equal(s1.src['vjezba/a.txt'], undefined);
  assert.ok(s1.src['vjezba/a.txt.locked']);
  assert.ok(s1.dst['vjezba-rsync/a.txt'], 'before the run the mirror still has the good copy');
  assert.deepEqual(body(s2), ['deleting a.txt', './', 'a.txt.locked']);
  assert.equal(s2.dst['vjezba-rsync/a.txt'], undefined);
  assert.equal(s2.dst['vjezba-rsync/a.txt.locked'].data, s2.src['vjezba/a.txt.locked'].data);
  assert.deepEqual(s3.dst, s2.dst);
  assert.deepEqual(s3.list, []);
  assert.deepEqual([s1.ev.at, s2.ev.at, s3.ev.at], ['21:00', '22:00', '07:50']);
});

test('rule 5: the same night without --delete keeps the good copy beside the encrypted one', () => {
  const src = logic.srcStart();
  const d0 = logic.dstSynced();
  src['vjezba/a.txt.locked'] = Object.assign({}, src['vjezba/a.txt'], { mtime: 31, data: 'enc' });
  delete src['vjezba/a.txt'];
  src['vjezba'].mtime = 31;
  const r = logic.run(src, d0, CMD({}), 32);
  assert.ok(r.dst['vjezba-rsync/a.txt']);
  assert.ok(r.dst['vjezba-rsync/a.txt.locked']);
});

// ── rule 6: the scope of --delete ──

test('rule 6: without the slash --delete acts only inside dest/vjezba/', () => {
  const s = at({ script: 'wrong-destination', slash: false }, 1);
  assert.deepEqual(s.would.del, []);
  assert.deepEqual(body(s), ['vjezba/', 'vjezba/a.txt', 'vjezba/pod/', 'vjezba/pod/b.txt']);
  const s4 = at({ slash: false }, 4);
  assert.deepEqual(body(s4), ['deleting vjezba/a.txt']);
  assert.deepEqual(body(at({ slash: false }, 3)), ['vjezba/']);
});

test('rule 6: with the slash into the home, everything the source lacks is in the delete list', () => {
  const s = at({ script: 'wrong-destination' }, 1);
  const home = Object.keys(s.dst).filter((k) => k !== '');
  assert.equal(home.length, 20);
  assert.equal(s.would.del.length, 19);
  assert.deepEqual(home.filter((k) => !s.would.del.includes(k)), ['a.txt']);
  assert.deepEqual(s.dst, at({ script: 'wrong-destination' }, 0).dst, 'the page stops at the dry run');
});

// ── scenario plumbing ──

test('the clock: every action advances it by one tick; a dry run changes neither tree', () => {
  const p = { script: 'dry-run-first' };
  assert.deepEqual([0, 1, 2, 3].map((n) => at(p, n).clock), [30, 31, 32, 33]);
  assert.deepEqual(at(p, 2).src, at(p, 1).src);
});

test('a directory outside the list takes the clock\'s mtime when an entry appears in it', () => {
  const s = at({ slash: false }, 1);                    // vjezba-rsync is created, vjezba/ lands inside it
  assert.equal(s.dst['vjezba-rsync'].mtime, s.clock);
  assert.equal(s.dst['vjezba-rsync/vjezba'].mtime, s.src['vjezba'].mtime);
  assert.equal(s.dst[''].mtime, s.clock, 'the home itself, where vjezba-rsync appeared');
});

test('changed holds only this step\'s changes', () => {
  assert.ok(at({}, 1).changed.length > 0);
  assert.deepEqual(at({}, 2).changed, []);
  assert.deepEqual(at({}, 2).deleted, []);
});

test('steps per scenario: 2, 4, 3, 1, 3', () => {
  assert.deepEqual(logic.SCRIPT_IDS.map((k) => logic.steps({ script: k })), [2, 4, 3, 1, 3]);
  assert.equal(logic.steps(logic.defaults), 4);
});

test('fixed flags win over the params; others follow the params', () => {
  assert.deepEqual(at({ script: 'dry-run-first', dryRun: false, delete: false }, 2).cmd, { slash: true, delete: true, dryRun: true, dest: 'rsync' });
  assert.deepEqual(at({ script: 'wrong-destination', dest: 'rsync2' }, 1).cmd.dest, 'home');
  assert.deepEqual(at({ dryRun: true }, 4).cmd, { slash: true, delete: true, dryRun: true, dest: 'rsync' });
  assert.deepEqual(logic.fixedFlags('wrong-destination'), ['delete', 'dryRun', 'dest']);
  assert.deepEqual(logic.fixedFlags('book-slash'), []);
  assert.deepEqual(logic.fixedFlags('nightly-mirror'), ['delete']);
  assert.deepEqual(logic.fixedFlags('delete-propagates'), []);
});

test('the synced start is the book\'s sftp listing', () => {
  const top = logic.children(logic.dstSynced(), '').sort();
  assert.deepEqual(top, ['a.txt', 'nohup.out', 'paketi', 'pokvaren.rpm', 'proba', 'tajna', 'vjezba-rsync', 'vjezba-rsync2', 'vjezba-scp']);
});

test('a created directory exists afterwards, and is not reported as created again', () => {
  const s = at({ slash: false }, 1);
  assert.ok(s.dst['vjezba-rsync']);
  assert.ok(!at({ slash: false }, 3).list.some((l) => l.startsWith('created directory')));
});

test('ghosts and changes belong to one step only', () => {
  assert.deepEqual(at({ script: 'nightly-mirror' }, 3).deleted, []);
  assert.deepEqual(at({ script: 'nightly-mirror' }, 2).changed.sort(), ['vjezba-rsync/a.txt', 'vjezba-rsync/a.txt.locked']);
});

test('norm: unknown values fall back to the defaults', () => {
  assert.deepEqual(logic.norm({ script: 'x', dest: 'y' }), logic.defaults);
});

// ── generic checks every sim keeps ──

const ALL = logic.SCRIPT_IDS.flatMap((script) => [true, false].flatMap((slash) =>
  [true, false].map((del) => ({ script, slash, delete: del, dest: slash ? 'rsync' : 'rsync2' }))));

test('state is JSON-safe at every step', () => {
  for (const over of ALL) {
    for (let n = 0; n <= logic.steps(P(over)); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const over of ALL) {
    const p = P(over), n0 = logic.steps(p);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= n0; n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = n0; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ script: 'nightly-mirror' });
  let s = logic.initial(p);
  for (let n = 1; n <= 3; n++) {
    const copy = structuredClone(s);
    const next = logic.step(s, n, p);
    assert.deepEqual(s, copy);
    s = next;
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model, and meta.steps matches the defaults', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  const ids = [...html.matchAll(/script: '([\w-]+)'/g)].map((m) => m[1]);
  for (const id of ids) assert.ok(logic.SCRIPTS[id], `scenario ${id} exists`);
});
