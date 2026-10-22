// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-links-inodes: tie-breaks first, then one test per rule (SPEC.md), then the presets' numbers, then the
// template's generic block. Run: node --test sims/lnx-links-inodes/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const last = (over) => at(over, logic.steps(P(over)));

/** A hand-made state: dirs and inodes as given, everything else as the model's initial state. */
function state(dirs, inodes) {
  const s = logic.initial(P({ scene: 'sadrzaj' }));
  s.dirs = JSON.parse(JSON.stringify(dirs));
  s.inodes = {};
  Object.keys(inodes).forEach((k) => {
    const n = Object.assign({ nlink: 1, openBy: [], size: 0, data: '', blocks: [] }, inodes[k]);
    if (n.type === 'symlink') n.size = n.data.length;
    s.inodes[k] = n;
  });
  s.nextIno = 33616730;
  return s;
}
/** Run one command on a copy of s, the way a step does. */
function run(s, cmd) {
  const t = JSON.parse(JSON.stringify(s));
  logic.blank(t);
  t.cmd = cmd;
  logic.apply(t, cmd);
  return t;
}
const F = (data, extra) => Object.assign({ type: 'file', data, size: data.length }, extra);
const D = (extra) => Object.assign({ type: 'dir', nlink: 2, size: 6, data: null }, extra);
const S = (text) => ({ type: 'symlink', data: text });

// ── tie-breaks ──

test('tie-break: ls -li lists entries by name, whatever order they were made in', () => {
  const s = at({ scene: 'preimenuj' }, 3);           // entries made in order a, h, s, then a renamed to b (appended)
  assert.deepEqual(s.dirs['~/p2'].map((e) => e.name), ['h.txt', 's.txt', 'b.txt']);
  assert.deepEqual(s.out.slice(1).map((l) => l.split('10:08 ')[1]), ['b.txt', 'h.txt', 's.txt -> a.txt']);
});

test('tie-break: blocks are allocated first fit from block 0, and a freed block is reused first', () => {
  const s = at({ scene: 'simbolicka', holdOpen: true }, 5);   // block 0 still held by the open, nameless inode
  assert.deepEqual(s.inodes['33616721'].blocks, [0]);
  assert.deepEqual(s.inodes['33616723'].blocks, [1]);
  const t = at({ scene: 'simbolicka' }, 5);                   // block 0 freed at step 3: the new file takes it
  assert.deepEqual(t.inodes['33616723'].blocks, [0]);
});

test('tie-break: a freed inode number is not reused within a run; new numbers count up from the book\'s', () => {
  assert.ok(at({ scene: 'simbolicka' }, 5).inodes['33616723']);
  assert.equal(at({ scene: 'simbolicka' }, 5).inodes['33616721'], undefined);
  assert.equal(at({ scene: 'sadrzaj' }, 2).dirs['~/p2'][0].ino, 33616721);
  assert.equal(at({ scene: 'simbolicka' }, 1).ev.made, 33616722);
});

test('tie-break: the link count and size columns of ls -li are padded to one width', () => {
  const s = at({ scene: 'simbolicka' }, 1);
  assert.equal(s.out[1], '33616721 -rw-r--r--. 1 student student 11 Aug 30 10:08 a.txt');
  assert.equal(s.out[2], '33616722 lrwxrwxrwx. 1 student student  5 Aug 30 10:08 s.txt -> a.txt');
});

test('tie-break: effects of one step are recorded in order: resolve, entry, count, free', () => {
  const s = at({ scene: 'simbolicka' }, 3);
  assert.deepEqual(s.ev.resolve, [{ dir: '~/p2', name: 'a.txt', ino: 33616721 }]);
  assert.deepEqual(s.ev.del, [{ dir: '~/p2', name: 'a.txt', ino: 33616721 }]);
  assert.deepEqual(s.ev.counts, [{ ino: 33616721, from: 1, to: 0 }]);
  assert.deepEqual(s.ev.free, [{ ino: 33616721, what: 'freed', blocks: 1 }]);
});

// ── rules ──

test('rule 1: ls -li shows the inode number first and the link count after the mode bits; same number = one file', () => {
  const s = at({}, 2);
  assert.deepEqual(s.out, [
    'total 0',
    '33616720 -rw-r--r--. 2 student student 0 Aug 30 10:08 datoteka.txt',
    '41962518 drwxr-xr-x. 2 student student 6 Aug 30 10:08 podmapa',
    '33616720 -rw-r--r--. 2 student student 0 Aug 30 10:08 tvrda-veza'
  ]);
  assert.equal(Object.keys(s.inodes).length, 2, 'two inodes for three names');
});

test('rule 2: ln adds an entry to the same inode and raises its count by 1; nothing is copied', () => {
  const s = at({}, 2);
  assert.deepEqual(s.dirs['~/proba'].map((e) => e.ino), [33616720, 41962518, 33616720]);
  assert.equal(s.inodes['33616720'].nlink, 2);
  assert.deepEqual(s.ev.counts, [{ ino: 33616720, from: 1, to: 2 }]);
  const t = at({ scene: 'sadrzaj' }, 3);
  assert.equal(logic.usedBlocks(t), 1, 'still one block');
});

test('rule 2: ln fails across filesystems (EXDEV), for a directory (EPERM) and onto an existing name (EEXIST)', () => {
  const s = state({ '~/p2': [{ name: 'a.txt', ino: 1 }, { name: 'd', ino: 2 }], '/mnt/usb': [] }, { 1: F('x'), 2: D() });
  const x = run(s, { op: 'ln', target: '~/p2/a.txt', name: '/mnt/usb/a.txt' });
  assert.equal(x.ev.err, 'EXDEV');
  assert.equal(x.inodes['1'].nlink, 1);
  assert.deepEqual(x.dirs['/mnt/usb'], []);
  assert.match(x.out[0], /Invalid cross-device link/);
  const y = run(s, { op: 'ln', target: '~/p2/d', name: '~/p2/e' });
  assert.equal(y.ev.err, 'EPERM');
  assert.equal(y.inodes['2'].nlink, 2);
  assert.match(y.out[0], /hard link not allowed for directory/);
  const z = run(s, { op: 'ln', target: '~/p2/a.txt', name: '~/p2/d' });
  assert.equal(z.ev.err, 'EEXIST');
  assert.equal(z.inodes['1'].nlink, 1);
  const w = run(s, { op: 'ln', target: '~/p2/nema', name: '~/p2/b' });
  assert.equal(w.ev.err, 'ENOENT');
});

test('rule 2: ln to a symlink links the symlink itself (not followed)', () => {
  const s = state({ '~/p2': [{ name: 'a.txt', ino: 1 }, { name: 's', ino: 2 }] }, { 1: F('x'), 2: S('a.txt') });
  const x = run(s, { op: 'ln', target: '~/p2/s', name: '~/p2/s2' });
  assert.equal(x.inodes['2'].nlink, 2);
  assert.equal(x.inodes['1'].nlink, 1);
});

test('rule 3: rm removes one entry and lowers the count by 1; the content stays', () => {
  const s = at({}, 3);
  assert.deepEqual(s.dirs['~/proba'].map((e) => e.name), ['podmapa', 'tvrda-veza']);
  assert.equal(s.inodes['33616720'].nlink, 1);
  const t = at({ scene: 'sadrzaj' }, 4);
  assert.equal(t.inodes['33616721'].data, 'prvi redak\n');
  assert.deepEqual(t.inodes['33616721'].blocks, [0]);
  assert.deepEqual(t.ev.free, [{ ino: 33616721, what: 'kept', blocks: 1 }]);
});

test('rule 3: rm of a directory or of a missing name fails and changes nothing', () => {
  const s = at({}, 0);
  const x = run(s, { op: 'rm', path: '~/proba/podmapa' });
  assert.equal(x.ev.err, 'EISDIR');
  assert.equal(x.dirs['~/proba'].length, 2);
  const y = run(s, { op: 'rm', path: '~/proba/nema' });
  assert.equal(y.ev.err, 'ENOENT');
  assert.equal(y.out[0], 'rm: cannot remove \'/home/student/proba/nema\': No such file or directory');
});

test('rule 4: count 0 and no process: freed; count 0 with a process: postponed until it closes', () => {
  const a = at({ scene: 'otvorena', holdOpen: false }, 2);
  assert.equal(a.ev.free[0].what, 'freed');
  assert.equal(logic.usedBlocks(a), 0);
  assert.equal(a.inodes['33616721'], undefined);
  const b = at({ scene: 'otvorena', holdOpen: true }, 2);
  assert.equal(b.ev.free[0].what, 'postponed');
  assert.equal(logic.usedBlocks(b), 6);
  assert.equal(b.inodes['33616721'].nlink, 0);
  assert.deepEqual(b.dirs['~/p2'], [], 'the name is gone at once');
  const c = at({ scene: 'otvorena', holdOpen: true }, 4);
  assert.equal(c.ev.free[0].what, 'freed');
  assert.equal(logic.usedBlocks(c), 0);
});

test('rule 4: an open file with names left is kept; closing it frees nothing while a name remains', () => {
  const s = state({ '~/p2': [{ name: 'a', ino: 1 }] }, { 1: F('x'.repeat(5000), { openBy: [7] }) });
  s.procs = [{ pid: 7, path: '~/p2/a', ino: 1 }];
  s.inodes['1'].blocks = [0, 1]; s.blocks[0] = 1; s.blocks[1] = 1;
  const x = run(s, { op: 'kill', pid: 7 });
  assert.equal(x.ev.free[0].what, 'kept');
  assert.equal(logic.usedBlocks(x), 2);
  assert.deepEqual(x.inodes['1'].openBy, []);
});

test('rule 5: ln -s makes a new inode holding the text; the target\'s count is unchanged and need not exist', () => {
  const s = at({ scene: 'simbolicka' }, 1);
  const l = s.inodes['33616722'];
  assert.equal(l.type, 'symlink');
  assert.equal(l.data, 'a.txt');
  assert.equal(l.size, 5);
  assert.deepEqual(l.blocks, []);
  assert.equal(s.inodes['33616721'].nlink, 1);
  const t = run(at({ scene: 'sadrzaj' }, 1), { op: 'ln', sym: true, target: 'nema.txt', name: '~/p2/s' });
  assert.equal(t.ev.err, null);
  assert.equal(t.inodes[String(t.ev.made)].data, 'nema.txt');
});

test('rule 6: a symlink is resolved when accessed, relative to its own directory', () => {
  const s = state({ '~/p2': [{ name: 'a.txt', ino: 1 }], '~/q': [{ name: 'a.txt', ino: 2 }, { name: 's', ino: 3 }] },
    { 1: F('p2\n'), 2: F('q\n'), 3: S('a.txt') });
  const r = logic.resolve(s, '~/q/s', true);
  assert.equal(r.ino, 2, 'a.txt next to the link, not in another directory');
  assert.deepEqual(r.hops.map((x) => x.ino), [3, 2]);
  assert.equal(r.hops[0].next, '~/q/a.txt');
  const a = state({ '~/p2': [{ name: 'a.txt', ino: 1 }], '~/q': [{ name: 's', ino: 3 }] }, { 1: F('p2\n'), 3: S('~/p2/a.txt') });
  assert.equal(logic.resolve(a, '~/q/s', true).ino, 1, 'an absolute text');
  assert.equal(run(a, { op: 'cat', path: '~/q/s' }).out[0], 'p2');
});

test('rule 6: a dangling symlink fails with No such file or directory; a chain over 40 links fails with ELOOP', () => {
  const s = at({ scene: 'simbolicka' }, 4);
  assert.equal(s.ev.err, 'ENOENT');
  assert.deepEqual(s.out, ['cat: /home/student/p2/s.txt: No such file or directory']);
  const loop = state({ '~/p2': [{ name: 'x', ino: 1 }, { name: 'y', ino: 2 }] }, { 1: S('y'), 2: S('x') });
  const r = run(loop, { op: 'cat', path: '~/p2/x' });
  assert.equal(r.ev.err, 'ELOOP');
  assert.match(r.out[0], /Too many levels of symbolic links/);
});

test('rule 6: a chain of 40 symlinks resolves, 41 fail with ELOOP', () => {
  const chain = (n) => {
    const entries = [{ name: 'f', ino: 1 }], inodes = { 1: F('end\n') };
    for (let i = 1; i <= n; i++) { entries.push({ name: 'l' + i, ino: 100 + i }); inodes[100 + i] = S(i === 1 ? 'f' : 'l' + (i - 1)); }
    return state({ '~/p2': entries }, inodes);
  };
  assert.equal(logic.resolve(chain(40), '~/p2/l40', true).ino, 1);
  assert.equal(logic.resolve(chain(41), '~/p2/l41', true).err, 'ELOOP');
});

test('rule 6: ls -li, stat and rm act on the link itself; cat and writing follow it', () => {
  const s = at({ scene: 'simbolicka' }, 4);              // s.txt dangling
  assert.equal(run(s, { op: 'stat', path: '~/p2/s.txt' }).out[0], '1 /home/student/p2/s.txt');
  // writing through the dangling link creates the file it names
  const w = run(s, { op: 'write', path: '~/p2/s.txt', text: 'z\n' });
  assert.deepEqual(w.dirs['~/p2'].map((e) => e.name).sort(), ['a.txt', 's.txt']);
  assert.equal(w.inodes['33616722'].data, 'a.txt', 'the link itself is unchanged');
});

test('rule 6: a new file at the stored path makes the symlink work again, with the new inode', () => {
  const s = at({ scene: 'simbolicka' }, 6);
  assert.deepEqual(s.out, ['novi redak']);
  assert.deepEqual(s.ev.resolve.map((x) => x.ino), [33616722, 33616723]);
});

test('rule 7: removing a symlink removes only the link', () => {
  const s = at({ scene: 'simbolicka' }, 1);
  const x = run(s, { op: 'rm', path: '~/p2/s.txt' });
  assert.equal(x.inodes['33616722'], undefined);
  assert.equal(x.inodes['33616721'].nlink, 1);
  assert.equal(x.inodes['33616721'].data, 'prvi redak\n');
  assert.deepEqual(x.ev.counts, [{ ino: 33616722, from: 1, to: 0 }]);
});

test('rule 8: mv renames the entry and keeps the inode; a hard link works, a symlink to the old name dangles', () => {
  const s = at({ scene: 'preimenuj' }, 3);
  assert.deepEqual(s.ev.ren, { dir: '~/p2', from: 'a.txt', toDir: '~/p2', to: 'b.txt', ino: 33616721 });
  assert.equal(s.inodes['33616721'].nlink, 2);
  assert.deepEqual(s.ev.counts, []);
  assert.deepEqual(at({ scene: 'preimenuj' }, 4).out, ['prvi redak']);
  assert.equal(at({ scene: 'preimenuj' }, 5).ev.err, 'ENOENT');
});

test('rule 8: mv onto an existing name replaces that entry; its inode loses a link and may be freed', () => {
  const s = state({ '~/p2': [{ name: 'a', ino: 1 }, { name: 'b', ino: 2 }] }, { 1: F('a'), 2: F('b') });
  s.inodes['2'].blocks = [3]; s.blocks[3] = 2;
  const x = run(s, { op: 'mv', from: '~/p2/a', to: '~/p2/b' });
  assert.deepEqual(x.dirs['~/p2'], [{ name: 'b', ino: 1 }]);
  assert.deepEqual(x.ev.counts, [{ ino: 2, from: 1, to: 0 }]);
  assert.equal(x.ev.free[0].what, 'freed');
  assert.equal(x.blocks[3], null);
});

test('rule 9: a new directory has count 2, and a drawn parent gains 1 for its ..', () => {
  const s = state({ '~/proba': [{ name: 'podmapa', ino: 41962518 }], '~/proba/podmapa': [] }, { 41962518: D() });
  s.nextDirIno = 41962519;
  const x = run(s, { op: 'mkdir', path: '~/proba/podmapa/x' });
  assert.equal(x.inodes['41962519'].nlink, 2);
  assert.equal(x.inodes['41962518'].nlink, 3);
  assert.deepEqual(x.dirs['~/proba/podmapa/x'], []);
  const y = run(x, { op: 'mkdir', path: '~/proba/podmapa/x' });
  assert.equal(y.inodes['41962518'].nlink, 3, 'mkdir -p of an existing directory changes nothing');
  assert.equal(at({}, 0).inodes['41962518'].nlink, 2, 'podmapa in the book');
});

test('rule 6: an absolute text (/home/student/… or ~/…) resolves from anywhere', () => {
  const s = state({ '~/p2': [{ name: 'a.txt', ino: 1 }, { name: 'abs', ino: 2 }] }, { 1: F('x\n'), 2: S('/home/student/p2/a.txt') });
  assert.equal(logic.resolve(s, '~/p2/abs', true).ino, 1);
});

test('rule 6: the resolution records each symlink hop with its stored text', () => {
  const s = at({ scene: 'simbolicka' }, 2);
  assert.deepEqual(s.ev.resolve, [{ dir: '~/p2', name: 's.txt', ino: 33616722, text: 'a.txt', next: '~/p2/a.txt' }, { dir: '~/p2', name: 'a.txt', ino: 33616721 }]);
});

test('rule 6: a process opening a path follows a symlink and holds the inode it reaches', () => {
  const s = at({ scene: 'simbolicka' }, 1);
  assert.ok(logic.open(s, 9, '~/p2/s.txt'));
  assert.deepEqual(s.inodes['33616721'].openBy, [9]);
  assert.deepEqual(s.inodes['33616722'].openBy, []);
});

test('rule 8: mv onto another name of the same inode does nothing (rename of one file to itself)', () => {
  const s = at({ scene: 'preimenuj' }, 1);                 // a.txt and h.txt on 33616721
  const x = run(s, { op: 'mv', from: '~/p2/a.txt', to: '~/p2/h.txt' });
  assert.deepEqual(x.dirs['~/p2'], s.dirs['~/p2']);
  assert.equal(x.inodes['33616721'].nlink, 2);
  const y = run(s, { op: 'mv', from: '~/p2/a.txt', to: '~/p2/a.txt' });
  assert.deepEqual(y.dirs['~/p2'], s.dirs['~/p2']);
  const u = JSON.parse(JSON.stringify(s)); u.dirs['/mnt/usb'] = [];
  const z = run(u, { op: 'mv', from: '~/p2/a.txt', to: '/mnt/usb/a.txt' });
  assert.equal(z.ev.err, 'EXDEV');
  assert.deepEqual(z.dirs, u.dirs);
});

test('writing over an existing file releases its old blocks and takes new ones', () => {
  const s = at({ scene: 'otvorena' }, 0);                   // 6 blocks
  const x = run(s, { op: 'write', path: '~/p2/velika.log', text: 'kratko\n' });
  assert.equal(x.inodes['33616721'].size, 7);
  assert.deepEqual(x.inodes['33616721'].blocks, [0]);
  assert.equal(logic.usedBlocks(x), 1);
  assert.equal(at({ scene: 'simbolicka' }, 5).inodes['33616723'].size, 11);
  assert.equal(at({ scene: 'sadrzaj' }, 2).inodes['33616721'].size, 11);
});

test('errors of the less common branches change nothing', () => {
  const s = at({ scene: 'simbolicka' }, 1);
  const cases = [
    [{ op: 'ln', sym: true, target: 'x', name: '~/p2/a.txt' }, 'EEXIST'],
    [{ op: 'ln', target: '~/p2/a.txt', name: '~/nema/b' }, 'ENOENT'],
    [{ op: 'write', path: '~/nema/b', text: 'x' }, 'ENOENT'],
    [{ op: 'ls', path: '~/nema' }, 'ENOENT'],
    [{ op: 'stat', path: '~/p2/nema' }, 'ENOENT']
  ];
  for (const [cmd, err] of cases) {
    const x = run(s, cmd);
    assert.equal(x.ev.err, err, JSON.stringify(cmd));
    assert.deepEqual(x.dirs, s.dirs);
    assert.deepEqual(x.inodes, s.inodes);
  }
  const d = at({}, 0);
  assert.equal(run(d, { op: 'cat', path: '~/proba/podmapa' }).ev.err, 'EISDIR');
});

test('a failed command prints no listing after it', () => {
  const p = P({ scene: 'primjer' });
  const s = logic.initial(p);
  s.dirs['~/proba'].push({ name: 'tvrda-veza', ino: 41962518 });   // the name exists: ln fails with EEXIST
  const t = logic.step(s, 2, p);
  assert.equal(t.ev.err, 'EEXIST');
  assert.equal(t.out.length, 1);
});

test('file and symlink numbers ignore directories: mkdir does not use 3361672x', () => {
  const s = state({ '~/p2': [] }, {});
  s.nextIno = 33616721; s.nextDirIno = 41962519;
  const x = run(run(s, { op: 'mkdir', path: '~/p2/d' }), { op: 'write', path: '~/p2/a', text: 'x' });
  assert.equal(x.dirs['~/p2'].find((e) => e.name === 'a').ino, 33616721);
  assert.equal(x.dirs['~/p2'].find((e) => e.name === 'd').ino, 41962519);
  assert.deepEqual(x.inodes['41962519'].blocks, []);
});

test('a directory at the start does not move the file numbers: the first new file in primjer is 33616721', () => {
  const s = at({}, 0);
  assert.equal(s.nextIno, 33616721);
  assert.equal(s.nextDirIno, 41962519);
});

test('kill ends the process: it leaves the process list and the inode', () => {
  const s = at({ scene: 'otvorena', holdOpen: true }, 4);
  assert.deepEqual(s.procs, []);
  assert.equal(s.ev.ended, 4242);
});

test('orphan: only an inode with no name that a process holds', () => {
  const s = at({ scene: 'simbolicka', holdOpen: true }, 2);
  assert.equal(logic.orphan(s, 33616721), false, 'named and open');
  assert.equal(logic.orphan(at({ scene: 'simbolicka', holdOpen: true }, 3), 33616721), true);
  assert.equal(logic.orphan(s, 33616722), false, 'named, not open');
});

test('the page\'s marks: changed entries and counts, removed and renamed entries, freed inodes', () => {
  const ln = at({}, 2);
  assert.deepEqual(ln.changed, { entries: [{ dir: '~/proba', name: 'tvrda-veza' }], inodes: [], counts: [33616720] });
  const rm = at({}, 3);
  assert.deepEqual(rm.gone, { entries: [{ dir: '~/proba', name: 'datoteka.txt', ino: 33616720 }], inodes: [] });
  assert.deepEqual(rm.changed.counts, [33616720]);
  const mv = at({ scene: 'preimenuj' }, 3);
  assert.deepEqual(mv.changed.entries, [{ dir: '~/p2', name: 'b.txt' }]);
  assert.deepEqual(mv.gone.entries, [{ dir: '~/p2', name: 'a.txt', ino: 33616721, renamed: true }]);
  const fr = at({ scene: 'simbolicka' }, 3);
  assert.deepEqual(fr.gone.inodes, [{ ino: 33616721, type: 'file' }]);
  assert.deepEqual(at({ scene: 'simbolicka' }, 1).changed.inodes, [33616722]);
  assert.deepEqual(at({ scene: 'simbolicka' }, 4).changed, { entries: [], inodes: [], counts: [] }, 'a read changes nothing');
});

// ── the presets ──

test('presets: step counts 3, 5, 6, 5, 4', () => {
  assert.deepEqual(logic.SCENE_IDS.map((id) => logic.steps(P({ scene: id }))), [3, 5, 6, 5, 4]);
  assert.equal(logic.steps(logic.defaults), 3);
});

test('preset primjer: the book\'s numbers', () => {
  assert.deepEqual(at({}, 1).out, [
    'total 0',
    '33616720 -rw-r--r--. 1 student student 0 Aug 30 10:08 datoteka.txt',
    '41962518 drwxr-xr-x. 2 student student 6 Aug 30 10:08 podmapa'
  ]);
  assert.deepEqual(at({}, 3).out, [
    'total 0',
    '41962518 drwxr-xr-x. 2 student student 6 Aug 30 10:08 podmapa',
    '33616720 -rw-r--r--. 1 student student 0 Aug 30 10:08 tvrda-veza'
  ]);
  assert.equal(logic.usedBlocks(at({}, 0)), 0, 'an empty file and an inline directory take no blocks');
});

test('preset sadrzaj: cat prints the content written under the removed name', () => {
  assert.deepEqual(at({ scene: 'sadrzaj' }, 0).dirs, {});
  assert.deepEqual(at({ scene: 'sadrzaj' }, 1).dirs, { '~/p2': [] });
  assert.deepEqual(last({ scene: 'sadrzaj' }).out, ['prvi redak']);
  assert.deepEqual(last({ scene: 'sadrzaj' }).dirs['~/p2'], [{ name: 'b.txt', ino: 33616721 }]);
});

test('preset simbolicka with holdOpen: the nameless inode stays; the new file takes block 1', () => {
  const s = at({ scene: 'simbolicka', holdOpen: true }, 3);
  assert.equal(s.ev.free[0].what, 'postponed');
  assert.equal(at({ scene: 'simbolicka', holdOpen: true }, 4).ev.err, 'ENOENT', 'the data is there but no name leads to it');
  const e = last({ scene: 'simbolicka', holdOpen: true });
  assert.equal(logic.usedBlocks(e), 2);
  assert.ok(logic.orphan(e, 33616721));
});

test('preset otvorena: total 24 at the start, kill without the process prints No such process', () => {
  assert.equal(at({ scene: 'otvorena', holdOpen: true }, 1).out[0], 'total 24');
  assert.equal(at({ scene: 'otvorena', holdOpen: true }, 3).out[0], 'total 0');
  assert.deepEqual(at({ scene: 'otvorena', holdOpen: true }, 4).out, ['[1]+  Terminated              tail -f ~/p2/velika.log']);
  assert.deepEqual(at({ scene: 'otvorena', holdOpen: false }, 4).out, ['bash: kill: (4242) - No such process']);
});

test('holdOpen opens the preset\'s main file from step 0; sadrzaj has none to open', () => {
  assert.deepEqual(at({ holdOpen: true }, 0).inodes['33616720'].openBy, [4242]);
  assert.deepEqual(at({ scene: 'sadrzaj', holdOpen: true }, 0).procs, []);
  assert.equal(at({ holdOpen: true }, 3).ev.free[0].what, 'kept', 'a name is left, so holding changes nothing');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const id of logic.SCENE_IDS) for (const holdOpen of [false, true]) {
    const p = P({ scene: id, holdOpen });
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const id of logic.SCENE_IDS) {
    const p = P({ scene: id, holdOpen: true });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scene: 'simbolicka', holdOpen: true });
  const s0 = kit.stateAt(logic, p, 2);
  const copy = structuredClone(s0);
  logic.step(s0, 3, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  // The page lists its presets in index.html; read them so a renamed param fails here.
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const id of logic.SCENE_IDS) assert.ok(html.includes(`'${id}'`), `preset ${id} on the page`);
});
