// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-logrotate's model. Rules and numbers: SPEC.md. Run: node --test sims/lnx-logrotate/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => L.norm(Object.assign({}, L.defaults, over));
const at = (over, n) => kit.stateAt(L, P(over), n);
const names = (s) => s.files.map((f) => f.name);
const lines = (s, name) => L.find(s, name).lines;
const ops = (s) => s.ops.map((o) => o.op + (o.op === 'reload' ? '' : o.from ? ' ' + o.from + '>' + o.to : o.name ? ' ' + o.name : ''));

const PRESETS = Object.fromEntries(L.PRESETS.map((x) => [x.id, x.params]));

// ── tie-breaks first: the order inside one run ──

test('tie-break: the oldest is shifted to .N+1 first and removed last, after compression (logrotate 3.21)', () => {
  const s = at(PRESETS['numbers-compress'], 8);
  assert.deepEqual(ops(s), [
    'rename messages.3.gz>messages.4.gz', 'rename messages.2.gz>messages.3.gz', 'rename messages.1.gz>messages.2.gz',
    'rename messages>messages.1', 'create messages', 'reload', 'compress messages.1>messages.1.gz', 'remove messages.4.gz'
  ]);
});

test('tie-break: the shift runs from the highest number down, so no rename lands on an existing name', () => {
  const s = at({ dateext: false, rotate: 6 }, 8);
  const renames = s.ops.filter((o) => o.op === 'rename').map((o) => o.from);
  assert.deepEqual(renames, ['messages.3', 'messages.2', 'messages.1', 'messages']);
});

test('tie-break: with dateext the oldest date is removed last too, after the reload', () => {
  const s = at({}, 10);
  assert.deepEqual(ops(s), ['rename messages>messages-20261004', 'create messages', 'reload', 'remove messages-20260906']);
});

test('tie-break: delaycompress compresses the previous version before the shift, and leaves the new one plain', () => {
  const s = at(PRESETS.delaycompress, 4);
  assert.deepEqual(ops(s).slice(0, 3), ['compress messages.1>messages.1.gz', 'rename messages.1.gz>messages.2.gz', 'rename messages>messages.1']);
  assert.equal(L.find(s, 'messages.1').gz, false);
});

test('tie-break: compression comes after the postrotate reload', () => {
  const o = ops(at({ compress: true }, 2));
  assert.ok(o.indexOf('reload') < o.indexOf('compress messages-20260906>messages-20260906.gz'));
});

test('tie-break: copytruncate copies, the line between arrives, then the truncate drops it', () => {
  const s = at(PRESETS['copytruncate-loss'], 2);
  assert.deepEqual(s.ops.map((o) => o.op), ['copy', 'between', 'truncate']);
  assert.deepEqual(lines(s, 'messages.1'), ['d6-1', 'd6-2']);
  assert.deepEqual(s.lostLines, ['d7-1']);
});

// ── rules ──

test('rule 1: weekly (= weekly 0) is due on a Sunday after the last rotation, or after at least 7 days', () => {
  assert.equal(L.weekday(0), 0); // 2026-08-30 is a Sunday
  assert.equal(L.weekday(4), 4);
  assert.equal(L.isDue(6, 0), false);  // Saturday, 6 days
  assert.equal(L.isDue(7, 0), true);   // Sunday
  assert.equal(L.isDue(7, 7), false);  // already rotated today
  assert.equal(L.isDue(7, 9), false);  // the status file is ahead
  assert.equal(L.isDue(7, 1), true);   // Sunday, only 6 days later: still due (logrotate 3.21)
  assert.equal(L.isDue(11, 4), true);  // Thursday, 7 days
  assert.equal(L.isDue(10, 4), false); // Wednesday, 6 days
  // every rotate step is a due run: runs on days 7, 14, ... and the status file follows them
  for (let n = 2; n <= 12; n += 2) {
    const s = at({}, n);
    assert.equal(s.day, 7 * n / 2);
    assert.equal(s.due, true);
    assert.equal(s.lastRotation, s.day);
  }
  assert.equal(at({}, 3).lastRotation, 7); // a write step leaves the status file alone
});

test('rule 1: a run that is not due changes nothing, the status file included', () => {
  const p = P({});
  const s = L.step(L.initial(p), 1, p);
  s.lastRotation = 9; // the status file is ahead of this run (a clock that ran ahead): not due, and not overwritten
  const next = L.step(s, 2, p);
  assert.equal(next.due, false);
  assert.deepEqual(next.ops.map((o) => o.op), ['notDue']);
  assert.deepEqual(names(next), ['messages']);
  assert.equal(next.rotations, 0);
  assert.equal(next.lastRotation, 9);
  assert.equal(next.writer.inode, 2101);
});

test('rule 2: rotate N keeps N old versions', () => {
  for (const N of [1, 2, 3, 4, 5, 6]) {
    for (const dateext of [true, false]) {
      const s = at({ rotate: N, dateext, cycles: 8 }, 16);
      assert.equal(L.versions(s).length, Math.min(N, 8), `rotate ${N} dateext ${dateext}`);
    }
  }
});

test('rule 3: numbering, newest in .1; a .gz keeps its suffix', () => {
  const s = at(PRESETS['numbers-compress'], 10);
  assert.deepEqual(names(s), ['messages', 'messages.1.gz', 'messages.2.gz', 'messages.3.gz']);
  assert.deepEqual(lines(s, 'messages.1.gz'), ['d34-1', 'd34-2']);
  assert.deepEqual(lines(s, 'messages.3.gz'), ['d20-1', 'd20-2']);
  // cycle 1's lines are still there after cycle 3 and gone after cycle 4
  assert.ok(L.whereIs(at(PRESETS['numbers-compress'], 6), 'd6-1'));
  assert.equal(L.whereIs(at(PRESETS['numbers-compress'], 8), 'd6-1'), null);
});

test('rule 4: dateext names the version by the run date, never shifts, removes the oldest date', () => {
  assert.equal(L.ymd(0), '20260830');
  assert.equal(L.ymd(7), '20260906');
  assert.equal(L.ymd(35), '20261004');
  assert.equal(L.ymd(56), '20261025');
  const s = at({}, 12);
  assert.deepEqual(names(s), ['messages', 'messages-20261011', 'messages-20261004', 'messages-20260927', 'messages-20260920']);
  assert.equal(s.ops.filter((o) => o.op === 'rename').length, 1);
  // the dated file keeps its inode from the day it was renamed
  assert.equal(L.find(at({}, 4), 'messages-20260906').inode, L.find(at({}, 12), 'messages-20260920').inode - 2);
});

test('rule 5: create renames and makes a new inode; the reload moves the descriptor to it', () => {
  const s = at({}, 2);
  const live = L.find(s, 'messages'), old = L.find(s, 'messages-20260906');
  assert.equal(old.inode, 2101);
  assert.equal(live.inode, 2102);
  assert.deepEqual(live.lines, []);
  assert.equal(s.writer.inode, 2102);
  assert.equal(s.arrowMoved, true);
  assert.deepEqual(lines(at({}, 3), 'messages'), ['d13-1', 'd13-2']);
});

test('rule 5: create without the reload: new lines go into the renamed file, messages stays empty', () => {
  const p = PRESETS['forgot-reload'];
  let s = at(p, 3);
  assert.equal(s.writer.inode, 2101);
  assert.equal(s.arrowMoved, false);
  assert.deepEqual(lines(s, 'messages.1'), ['d6-1', 'd6-2', 'd13-1', 'd13-2']);
  assert.deepEqual(lines(s, 'messages'), []);
  s = at(p, 5);
  assert.deepEqual(lines(s, 'messages.2'), ['d6-1', 'd6-2', 'd13-1', 'd13-2', 'd20-1', 'd20-2']);
  assert.deepEqual(lines(s, 'messages'), []);
  assert.equal(s.writtenTo, 'messages.2');
});

test('rule 6: copytruncate keeps the writer on its inode and needs no reload', () => {
  const p = PRESETS['copytruncate-loss'];
  for (let n = 0; n <= 6; n++) assert.equal(at(p, n).writer.inode, 2101);
  const s = at(p, 6);
  assert.ok(!s.ops.some((o) => o.op === 'reload'));
  assert.equal(L.find(s, 'messages').inode, 2101);
  assert.deepEqual(lines(at(p, 5), 'messages'), ['d20-1', 'd20-2']);
});

test('rule 6: one lost line per rotation with writeDuringRotation; none without it', () => {
  const s = at(PRESETS['copytruncate-loss'], 6);
  assert.equal(s.lost, 3);
  assert.deepEqual(s.lostLines, ['d7-1', 'd14-1', 'd21-1']);
  assert.equal(at({ method: 'copytruncate', dateext: false, cycles: 3 }, 6).lost, 0);
  // the toggle means nothing for create
  assert.equal(at({ method: 'create-reload', writeDuringRotation: true }, 12).lost, 0);
  assert.equal(P({ method: 'create', writeDuringRotation: true }).writeDuringRotation, false);
});

test('rule 7: compress makes a .gz with a new inode and removes the plain name', () => {
  const s = at({ compress: true, dateext: false }, 2);
  assert.deepEqual(names(s), ['messages', 'messages.1.gz']);
  const gz = L.find(s, 'messages.1.gz');
  assert.equal(gz.gz, true);
  assert.notEqual(gz.inode, 2101);
  assert.deepEqual(gz.lines, ['d6-1', 'd6-2']);
});

test('rule 7: delaycompress keeps .1 plain, older versions compressed', () => {
  const s = at(PRESETS.delaycompress, 8);
  assert.deepEqual(names(s), ['messages', 'messages.1', 'messages.2.gz', 'messages.3.gz']);
  assert.deepEqual(lines(s, 'messages.1'), ['d27-1', 'd27-2']);
  assert.deepEqual(lines(s, 'messages.3.gz'), ['d13-1', 'd13-2']);
  assert.equal(P({ compress: false, delaycompress: true }).delaycompress, false);
});

test('rule 7 + 8: compress without delaycompress and without reload: the writer\'s inode loses its name', () => {
  const p = { method: 'create', compress: true, dateext: false, cycles: 3 };
  const s = at(p, 2);
  assert.deepEqual(s.deleted.map((d) => d.inode), [2101]);
  assert.equal(s.writer.inode, 2101);
  const s3 = at(p, 3);
  assert.deepEqual(s3.deleted[0].lines, ['d6-1', 'd6-2', 'd13-1', 'd13-2']);
  assert.equal(s3.writtenTo, null);
  // delaycompress keeps the name for one more cycle
  assert.deepEqual(at(Object.assign({}, p, { delaycompress: true }), 2).deleted, []);
});

test('rule 8: removing the version the writer holds frees nothing; its lines stay and grow', () => {
  const p = PRESETS['still-open'];
  const s = at(p, 4);
  assert.deepEqual(names(s), ['messages', 'messages.1']);
  assert.equal(s.deleted.length, 1);
  assert.equal(s.deleted[0].inode, 2101);
  assert.deepEqual(s.deleted[0].lines, ['d6-1', 'd6-2', 'd13-1', 'd13-2']);
  assert.equal(s.removed[0].open, true);
  assert.deepEqual(at(p, 5).deleted[0].lines, ['d6-1', 'd6-2', 'd13-1', 'd13-2', 'd20-1', 'd20-2']);
  assert.equal(L.whereIs(at(p, 5), 'd6-1').name, null);
  assert.equal(at(p, 6).lost, 0);
});

test('rule 8: a reload releases a deleted inode the writer held', () => {
  // build the situation by hand: the writer holds a deleted inode, then a create-reload run
  const s = at(PRESETS['still-open'], 5);
  const next = L.step(s, 6, P({ dateext: false, rotate: 1 }));
  assert.deepEqual(next.deleted, []);
  assert.ok(next.ops.some((o) => o.op === 'freed'));
  assert.equal(next.writer.inode, L.find(next, 'messages').inode);
});

test('bookkeeping: rotations count runs; changed and arrowMoved describe this step only', () => {
  assert.equal(at({}, 3).rotations, 1);
  assert.equal(at({}, 12).rotations, 6);
  const s = at({}, 2);
  assert.ok(s.changed.includes(2101) && s.changed.includes(2102));
  assert.equal(at({}, 3).arrowMoved, false);
  assert.deepEqual(at({}, 3).changed, [2102]);
  const c = at(PRESETS['copytruncate-loss'], 2);
  assert.ok(c.changed.includes(2101) && c.changed.includes(2102)); // truncated, copied
});

test('ops mark when the writer still holds what is compressed or removed', () => {
  const comp = at({ method: 'create', compress: true, dateext: false }, 2).ops.find((o) => o.op === 'compress');
  assert.equal(comp.open, true);
  assert.equal(comp.old, 2101);
  assert.equal(at({ compress: true, dateext: false }, 2).ops.find((o) => o.op === 'compress').open, false);
  assert.equal(at(PRESETS['still-open'], 4).ops.find((o) => o.op === 'remove').open, true);
  assert.equal(at({ dateext: false, rotate: 1 }, 4).ops.find((o) => o.op === 'remove').open, false);
});

test('every line written is in a file, in a deleted inode, lost, or in a version that was removed', () => {
  const variants = Object.values(PRESETS).concat([
    { method: 'create', compress: true, delaycompress: true, rotate: 2, cycles: 8, linesPerCycle: 3 },
    { method: 'copytruncate', writeDuringRotation: true, compress: true, rotate: 1, cycles: 8 }
  ]);
  for (const over of variants) {
    const p = P(over);
    const written = new Set(), removed = new Set();
    for (let n = 1; n <= L.steps(p); n++) {
      const s = at(over, n);
      s.written.forEach((id) => written.add(id));
      s.removed.forEach((r) => r.lines.forEach((id) => removed.add(id)));
    }
    const end = at(over, L.steps(p));
    const kept = new Set();
    end.files.concat(end.deleted).forEach((f) => f.lines.forEach((id) => kept.add(id)));
    end.lostLines.forEach((id) => kept.add(id));
    for (const id of written) assert.ok(kept.has(id) || removed.has(id), JSON.stringify(over) + ' ' + id);
  }
});

// ── presets: the numbers in SPEC.md ──

test('book-config: four dated files from cycle 4 on; the first removal at cycle 5 (about a month)', () => {
  assert.equal(L.versions(at({}, 6)).length, 3);
  assert.equal(L.versions(at({}, 8)).length, 4);
  assert.deepEqual(at({}, 10).removed.map((r) => r.name), ['messages-20260906']);
  assert.deepEqual(at({}, 12).removed.map((r) => r.name), ['messages-20260913']);
  assert.equal(L.steps(P({})), 12);
});

test('every preset: step count and end state from SPEC.md', () => {
  const want = {
    'book-config': [12, ['messages', 'messages-20261011', 'messages-20261004', 'messages-20260927', 'messages-20260920']],
    'numbers-compress': [10, ['messages', 'messages.1.gz', 'messages.2.gz', 'messages.3.gz']],
    'forgot-reload': [6, ['messages', 'messages.1', 'messages.2', 'messages.3']],
    'copytruncate-loss': [6, ['messages', 'messages.1', 'messages.2', 'messages.3']],
    delaycompress: [8, ['messages', 'messages.1', 'messages.2.gz', 'messages.3.gz']],
    'still-open': [6, ['messages', 'messages.1']]
  };
  for (const [id, over] of Object.entries(PRESETS)) {
    const n = L.steps(P(over));
    assert.equal(n, want[id][0], id);
    assert.ok(n <= 20, id);
    assert.deepEqual(names(at(over, n)), want[id][1], id);
  }
  assert.deepEqual(lines(at(PRESETS['forgot-reload'], 6), 'messages.3'), ['d6-1', 'd6-2', 'd13-1', 'd13-2', 'd20-1', 'd20-2']);
});

test('every line is somewhere, lost, or removed with a version; never in two places', () => {
  for (const over of Object.values(PRESETS)) {
    const p = P(over);
    const s = at(over, L.steps(p));
    const seen = {};
    s.files.concat(s.deleted).forEach((f) => f.lines.forEach((id) => { assert.ok(!seen[id], id); seen[id] = true; }));
    s.lostLines.forEach((id) => assert.ok(!seen[id], id));
  }
});

test('params are normalised: bad values fall back, ranges clamp, defaults fill in', () => {
  assert.equal(L.norm({ rotate: 0 }).rotate, 1);
  assert.equal(L.norm({ cycles: 1 }).cycles, 2);
  assert.equal(L.norm({ cycles: 99 }).cycles, 8);
  assert.equal(L.norm({ linesPerCycle: 9 }).linesPerCycle, 4);
  const d = L.norm({});
  assert.equal(d.dateext, true);
  assert.equal(d.compress, false);
  assert.equal(d.method, 'create-reload');
  const p = L.norm({ method: 'nope', rotate: 99, linesPerCycle: 0, cycles: 'x' });
  assert.equal(p.method, 'create-reload');
  assert.equal(p.rotate, 6);
  assert.equal(p.linesPerCycle, 1);
  assert.equal(p.cycles, 6);
  assert.equal(L.steps({ cycles: 8 }), 16);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const over of Object.values(PRESETS)) {
    for (let n = 0; n <= L.steps(P(over)); n++) {
      const s = at(over, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ method: 'create', compress: true, delaycompress: true, rotate: 2, dateext: false, cycles: 8, linesPerCycle: 3 });
  const forward = [];
  let s = L.initial(p);
  forward.push(s);
  for (let n = 1; n <= L.steps(p); n++) { s = L.step(s, n, p); forward.push(s); }
  for (let n = L.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(L, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P(PRESETS['still-open']);
  const s3 = kit.stateAt(L, p, 3);
  const copy = structuredClone(s3);
  L.step(s3, 4, p);
  assert.deepEqual(s3, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and the page takes them from it', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, L.steps(L.defaults), 'meta.steps matches the model at its defaults');
  assert.ok(/presets:\s*L\.PRESETS\.map/.test(html), 'the page takes its presets from the model');
  for (const x of L.PRESETS) {
    for (const k of Object.keys(x.params)) assert.ok(k in L.defaults, `${x.id}: ${k} is a model param`);
    assert.ok(('preset_' + x.id) in strings.hr && ('preset_' + x.id + '_hint') in strings.hr, `${x.id} has a label and a hint`);
  }
});
