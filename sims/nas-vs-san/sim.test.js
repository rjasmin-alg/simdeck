// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for nas-vs-san's model (SPEC.md). Run: node --test sims/nas-vs-san/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const TWO = 'fA.mA.mB.wA.wB.rA.uA';

// ── tie-breaks first (rule 6, and the lowest-free-block choice) ──

test('rule 6: last write wins on disk; B\'s directory replaces A\'s at LBA 2', () => {
  const s = at({ ops: TWO }, 5).san;
  assert.equal(s.disk[10], 'B');
  assert.equal(s.by[10], 'B');
  assert.deepEqual(logic.parseDir(s.disk[2]), [['b.txt', 10]]);
  assert.equal(s.by[2], 'B');
});

test('rule 6: A\'s cache keeps its own version until it re-reads', () => {
  const s4 = at({ ops: TWO }, 4).san, s5 = at({ ops: TWO }, 5).san;
  assert.deepEqual(s5.clients.A, s4.clients.A, 'B\'s write leaves A\'s cache untouched');
  assert.deepEqual(s5.clients.A.dir, [['a.txt', 10]]);
});

test('rule 6: A reads a.txt through its cache and gets B\'s bytes; the remount loses a.txt', () => {
  const s6 = at({ ops: TWO }, 6).san;
  assert.equal(s6.res.code, 'read');
  assert.equal(s6.res.lba, 10);
  assert.equal(s6.res.data, 'B');
  assert.equal(s6.res.wrong, true);
  const s7 = at({ ops: TWO }, 7).san;
  assert.deepEqual(s7.clients.A.dir, [['b.txt', 10]]);
  assert.deepEqual(s7.lost, ['a.txt']);
  assert.deepEqual(s7.conflicts, []);
});

test('allocation tie-break: the lowest free data block, from LBA 10', () => {
  assert.equal(at({ ops: 'mA.wA' }, 2).nas.res.lba, 10);
  assert.equal(at({ ops: 'fA.mA.wA' }, 3).san.res.lba, 10);
  // a rewrite keeps its block; a second file takes the next one
  assert.deepEqual(end({ ops: 'mA.wA.wA.mB.wB' }).nas.server.bitmap, [10, 11]);
  // a rewrite after a remount finds a.txt in the re-read directory and keeps LBA 10 (one data write, no metadata)
  const s = end({ ops: 'fA.mA.wA.uA.wA' }).san;
  assert.equal(s.res.lba, 10);
  assert.equal(s.res.fresh, false);
  assert.deepEqual(s.wire.map((m) => m.arg), [10]);
});

// ── rule 1: NAS, the server owns the filesystem ──

test('rule 1: NAS server allocates 10 and 11 and every client lists both files', () => {
  const p = { mode: 'nas', ops: 'mA.mB.wA.wB.lA.lB' };
  assert.equal(at(p, 3).nas.res.lba, 10);
  assert.equal(at(p, 4).nas.res.lba, 11);
  const s = end(p).nas;
  assert.deepEqual(s.server.bitmap, [10, 11]);
  assert.deepEqual(s.server.dir, [['a.txt', 10], ['b.txt', 11]]);
  assert.equal(s.disk[10], 'A');
  assert.equal(s.disk[11], 'B');
  assert.deepEqual(at(p, 5).nas.res.files, ['a.txt', 'b.txt']);
  assert.deepEqual(s.res.files, ['a.txt', 'b.txt']);
  assert.equal(s.clients.A.bitmap, null, 'a NAS client has no bitmap');
  assert.equal(s.clients.B.bitmap, null);
  for (const n of [1, 2, 3, 4, 5, 6]) {
    for (const m of at(p, n).nas.wire) assert.equal(m.kind, 'file', 'NAS messages are file operations');
  }
});

test('rule 1: on the NAS the same run keeps both files; a client cannot format', () => {
  const s1 = at({ ops: TWO }, 1).nas;
  assert.equal(s1.res.code, 'noDevice');
  assert.deepEqual(s1.wire, []);
  assert.equal(at({ ops: TWO }, 6).nas.res.data, 'A');
  assert.deepEqual(end({ ops: TWO }).nas.clients.A.dir, [['a.txt', 10], ['b.txt', 11]]);
  assert.deepEqual(end({ ops: TWO }).nas.lost, []);
});

// ── rule 2: NAS, the server arbitrates (locks at the server) ──

test('rule 2: locks are held at the server; a remount drops the client\'s locks', () => {
  assert.deepEqual(at({ ops: 'mA.wA' }, 2).nas.server.locks, [['a.txt', 'A']]);
  assert.deepEqual(at({ ops: 'mA.mB.wA.wB' }, 4).nas.server.locks, [['a.txt', 'A'], ['b.txt', 'B']]);
  const c = at({ ops: 'mA.wA' }, 2).nas.clients.A;
  assert.ok(!('locks' in c), 'a NAS client keeps no lock table');
  assert.deepEqual(end({ ops: 'mA.mB.wA.wB.uA' }).nas.server.locks, [['b.txt', 'B']]);
  assert.equal(end({ ops: 'fA.mA.wA' }).san.server, null, 'the SAN target has no lock table');
});

// ── rule 3: SAN, the target sees only blocks ──

test('rule 3: every SAN message is a block operation on an LBA; the target has no filesystem', () => {
  for (const ops of [TWO, 'fA.mA.wA', 'fA.mA.mB.wA.wB.lA.rB.uB']) {
    const p = P({ ops });
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n).san;
      assert.equal(s.server, null);
      for (const m of s.wire) {
        assert.equal(m.kind, 'block');
        assert.ok(['READ', 'WRITE'].includes(m.op));
        assert.ok(typeof m.arg === 'number' || (Array.isArray(m.arg) && m.arg.every(Number.isInteger)), 'an LBA or an LBA range');
      }
    }
  }
  const w = at({ ops: 'fA.mA.wA' }, 3).san.wire.map((m) => m.op + ' ' + m.arg);
  assert.deepEqual(w, ['WRITE 10', 'WRITE 1', 'WRITE 2']);
});

test('rule 3: a blank LUN has no filesystem to mount; listing is answered from the cache', () => {
  assert.equal(at({ ops: 'mA' }, 1).san.res.code, 'noFs');
  assert.equal(at({ ops: 'mA' }, 1).san.clients.A.mounted, false);
  const l = at({ ops: 'fA.mA.lA' }, 3).san;
  assert.equal(l.res.code, 'listed');
  assert.deepEqual(l.wire, [], 'no message on the wire');
});

// ── rule 4: SAN, each client allocates from its own cached bitmap ──

test('rule 4: A and B both pick LBA 10; the block is marked as a conflict', () => {
  const s4 = at({ ops: TWO }, 4).san, s5 = at({ ops: TWO }, 5).san;
  assert.equal(s4.res.lba, 10);
  assert.deepEqual(s4.conflicts, []);
  assert.equal(s5.res.lba, 10);
  assert.deepEqual(s5.clients.B.bitmap, [10]);
  assert.deepEqual(s5.conflicts, [2, 10]);
  // B mounting after A's write sees A's bitmap and takes 11: the danger is the private cache, not the LUN itself
  assert.equal(end({ ops: 'fA.mA.wA.mB.wB' }).san.res.lba, 11);
  assert.deepEqual(end({ ops: 'fA.mA.wA.mB.wB' }).san.conflicts, []);
});

// ── rule 5: SAN, a persistent reservation rejects the other initiator's writes ──

test('rule 5: with A\'s reservation B\'s WRITE LBA 10 is rejected and the data stays intact', () => {
  const p = { mode: 'san', reservation: true, ops: TWO };
  const s5 = at(p, 5).san;
  assert.equal(s5.res.code, 'conflict');
  assert.deepEqual(s5.wire.map((m) => [m.op, m.arg, m.reply, m.ok]), [['WRITE', 10, 'RESERVATION CONFLICT', false]]);
  assert.equal(s5.disk[10], 'A');
  assert.deepEqual(s5.clients.B.dir, [], 'B\'s filesystem aborts and keeps its cache');
  assert.deepEqual(s5.changed, []);
  assert.equal(at(p, 6).san.res.data, 'A');
  assert.deepEqual(end(p).san.clients.A.dir, [['a.txt', 10]]);
  assert.deepEqual(end(p).san.lost, []);
  // reads stay allowed (B mounted), and the holder writes freely
  assert.equal(at(p, 3).san.clients.B.mounted, true);
  assert.equal(at(p, 4).san.res.code, 'wrote');
  // B cannot format either
  assert.equal(at({ reservation: true, ops: 'fB' }, 1).san.res.code, 'formatConflict');
});

// ── presets (SPEC.md table) ──

test('preset san-one-client: format, mount, WRITE LBA 10', () => {
  const s = end({ mode: 'san', ops: 'fA.mA.wA' }).san;
  assert.deepEqual(at({ ops: 'fA.mA.wA' }, 1).san.changed, [0, 1, 2]);
  assert.equal(s.disk[10], 'A');
  assert.equal(s.disk[1], '10');
  assert.equal(s.disk[2], 'a.txt=10');
});

test('refusals: not mounted, format while mounted, missing file', () => {
  assert.equal(at({ ops: 'wA' }, 1).nas.res.code, 'notMounted');
  assert.equal(at({ ops: 'wA' }, 1).san.res.code, 'notMounted');
  assert.equal(at({ ops: 'fA.mA.fA' }, 3).san.res.code, 'busy');
  assert.equal(at({ ops: 'fA.mA.rA' }, 3).san.res.code, 'notFound');
  assert.equal(at({ ops: 'mA.rA' }, 2).nas.res.code, 'notFound');
});

test('the run: unknown tokens dropped, at most 20 operations', () => {
  assert.deepEqual(logic.actionsOf({ ops: 'wA.xx.mC.lB' }), [{ verb: 'w', who: 'A' }, { verb: 'l', who: 'B' }]);
  assert.equal(logic.actionsOf({ ops: Array(30).fill('lA').join('.') }).length, 20);
  assert.equal(logic.encode(logic.actionsOf({ ops: TWO })), TWO);
  assert.equal(logic.steps(P({})), 7);
});

// ── what the reviewer's mutations showed untested ──

test('rule 1: the NAS server itself writes data, bitmap and directory to its disk', () => {
  const s = at({ ops: 'mA.wA' }, 2).nas;
  assert.deepEqual(s.changed, [10, 1, 2]);
  assert.equal(s.disk[1], '10');
  assert.equal(s.disk[2], 'a.txt=10');
  assert.deepEqual([s.by[10], s.by[1], s.by[2]], ['S', 'S', 'S'], 'every block written by the server, not the client');
  assert.deepEqual(s.clients.A.dir, [['a.txt', 10]], 'the writer sees its own file');
  assert.deepEqual(s.wire.map((m) => [m.op, m.arg, m.reply, m.ok]), [['write', 'a.txt', 'OK', true]]);
  assert.deepEqual(at({ ops: 'mA.mB.wA.wB.lA' }, 5).nas.wire.map((m) => m.reply), ['a.txt b.txt']);
  assert.deepEqual(at({ ops: TWO }, 6).nas.wire.map((m) => m.reply), ['data:A']);
});

test('rule 3: the SAN read goes to the LBA from the cache; format resets the metadata blocks', () => {
  const r = at({ ops: TWO }, 6).san;
  assert.deepEqual(r.wire.map((m) => [m.op, m.arg, m.reply]), [['READ', 10, 'data:B']]);
  assert.deepEqual(at({ ops: TWO }, 5).san.changed, [10, 1, 2]);
  // a second format by B (A is mounted) wipes A's bitmap and directory on disk: the data block stays
  const f = at({ ops: 'fA.mA.wA.fB' }, 4).san;
  assert.equal(f.res.code, 'formatted');
  assert.deepEqual([f.disk[1], f.disk[2], f.disk[10]], ['', '', 'A']);
  assert.deepEqual([f.by[0], f.by[1], f.by[2]], ['B', 'B', 'B']);
  assert.deepEqual(f.conflicts, [2], 'A still believes in a.txt');
});

test('edge cases: mount twice is refused; remount before mount is a mount; lost blames the last writer of LBA 2', () => {
  for (const k of ['nas', 'san']) {
    const s = at({ ops: 'fA.mA.mB.wA.wB.mA' }, 6)[k];
    assert.equal(s.res.code, 'already', k);
    assert.deepEqual(s.wire, [], k);
  }
  assert.deepEqual(at({ ops: 'fA.mA.mB.wA.wB.mA' }, 6).san.clients.A.dir, [['a.txt', 10]], 'the cache is kept');
  assert.equal(at({ ops: 'uA' }, 1).nas.res.code, 'mounted');
  assert.equal(at({ ops: 'fA.uA' }, 2).san.res.code, 'mounted');
  assert.deepEqual(at({ ops: 'fA.uA' }, 2).san.lost, []);
  const s = end({ ops: 'fA.mA.mB.wB.wA.uB' }).san;
  assert.deepEqual(s.lost, ['b.txt']);
  assert.equal(s.res.dirBy, 'A');
  assert.equal(end({ ops: TWO }).san.res.dirBy, 'B');
});

test('rule 5: B formatting under A\'s reservation is rejected as a format', () => {
  const s = at({ reservation: true, ops: 'fA.mA.wA.fB' }, 4).san;
  assert.equal(s.res.code, 'formatConflict');
  assert.deepEqual(s.wire.map((m) => [m.op, m.arg, m.ok]), [['WRITE', [0, 2], false]]);
  assert.equal(s.disk[2], 'a.txt=10');
});

// ── generic checks every sim keeps ──

const RUNS = [TWO, 'mA.mB.wA.wB.lA.lB', 'fA.mA.wA', 'fB.mB.mA.wB.wA.rB.uB.lA.fA'];

test('state is JSON-safe at every step', () => {
  for (const ops of RUNS) for (const reservation of [false, true]) {
    const p = P({ ops, reservation });
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ ops: RUNS[3], reservation: true });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s3 = kit.stateAt(logic, p, 3);
  const copy = structuredClone(s3);
  logic.step(s3, 4, p);
  assert.deepEqual(s3, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const blocks = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(blocks.length >= 4, 'found preset params');
  for (const b of blocks) {
    for (const k of [...b.matchAll(/(\w+):/g)].map((x) => x[1])) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const ops = b.match(/ops:\s*'([^']*)'/);
    if (ops) {
      assert.equal(logic.encode(logic.actionsOf({ ops: ops[1] })), ops[1], 'preset run is clean');
      const n = logic.steps({ ops: ops[1] });
      assert.ok(n >= 3 && n <= 20, 'preset has 3–20 steps');
    }
  }
});
