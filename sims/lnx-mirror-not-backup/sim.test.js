// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-mirror-not-backup's model (SPEC.md). Run: node --test sims/lnx-mirror-not-backup/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (scene, n) => kit.stateAt(logic, P({ scene }), n);
const C = logic.cmd;
const box = (s) => `[${s.mdstat.of}/${s.mdstat.n}] [${s.mdstat.map}]`;
const blocks = (s, name) => logic.disk(s, name).blocks;
/** A healthy mirror holding proba.txt (the corruption preset's start). */
const healthy = () => logic.initial(P({ scene: 'corruption' }));
function run(s, ops) {
  const evs = [];
  for (const op of ops) { const r = logic.apply(s, op); s = r.s; evs.push(r.ev); }
  return { s, evs };
}

// ── tie-breaks first ──

test('tie-break: --fail on the last active member is refused; a disk dying is not', () => {
  const { s, evs } = run(healthy(), [C('fail', { disk: 'vdc' }), C('fail', { disk: 'vdb' })]);
  assert.equal(evs[1].refused, true);
  assert.equal(logic.disk(s, 'vdb').status, 'ok');
  assert.equal(s.array, 'degraded');
  const d = logic.apply(s, C('die', { disk: 'vdb' }));
  assert.equal(d.ev.refused, false);
  assert.equal(d.s.array, 'failed');
});

test('tie-break: --fail of a failed member and --re-add of a working one change nothing', () => {
  const { s, evs } = run(healthy(), [C('fail', { disk: 'vdc' }), C('fail', { disk: 'vdc' }), C('readd', { disk: 'vdb' })]);
  assert.equal(evs[1].noop, true);
  assert.equal(evs[2].noop, true);
  assert.equal(box(s), '[2/1] [U_]');
});

test('tie-break: --re-add with no active member left is refused', () => {
  const { s, evs } = run(healthy(), [C('fail', { disk: 'vdc' }), C('die', { disk: 'vdb' }), C('readd', { disk: 'vdc' })]);
  assert.equal(evs[2].refused, true);
  assert.equal(s.array, 'failed');
});

test('tie-break: rm -f of a missing file writes nothing and exits 0', () => {
  const { s, evs } = run(healthy(), [C('rm', { file: 'nema.txt' })]);
  assert.equal(evs[0].noop, true);
  assert.deepEqual(evs[0].wrote, []);
  assert.deepEqual(blocks(s, 'vdb'), blocks(healthy(), 'vdb'));
});

test('tie-break: reads go to the first active member in role order', () => {
  assert.equal(healthy().cat.from, 'vdb');
  assert.equal(run(healthy(), [C('fail', { disk: 'vdb' })]).s.cat.from, 'vdc');
});

test('tie-break: a new file takes the two lowest blocks the filesystem does not point at (freed ones reused)', () => {
  const { s } = run(healthy(), [C('rm', { file: 'proba.txt' }), C('tee', { file: 'novo.txt', data: 'x\n' })]);
  assert.deepEqual(logic.file(s, 'novo.txt').blocks, [1, 2]);
  assert.deepEqual(logic.freedBlocks(s), []);
});

test('tie-break: before mount, /mnt/polje is an empty directory: No such file', () => {
  assert.deepEqual(at('book-primjer3', 2).cat, { exit: 1, out: null, err: 'enoent', from: null });
  const unmounted = Object.assign(healthy(), { mounted: false });
  assert.ok(logic.file(unmounted, 'proba.txt'), 'the file is on md0');
  assert.equal(logic.cat(unmounted).err, 'enoent', 'but not reachable at /mnt/polje');
});

test('tie-break: mount writes no block', () => {
  const s = at('book-primjer3', 3);
  assert.deepEqual(s.ev.wrote, []);
  assert.deepEqual(blocks(s, 'vdb'), blocks(at('book-primjer3', 2), 'vdb'));
});

test('rule 7 tie-break: a failed array changes nothing on any write, not even the file list', () => {
  const dead = at('two-failures', 3);
  for (const op of [C('tee', { file: 'novo.txt', data: 'x\n' }), C('corrupt', { file: 'proba.txt' }), C('encrypt', { file: 'proba.txt' })]) {
    const r = logic.apply(dead, op);
    assert.equal(r.ev.eio, true, op.op);
    assert.deepEqual(r.s.fs, dead.fs, op.op);
  }
});

test('tie-break: a copy to the second machine works in any scene (it appears with its first copy)', () => {
  const r = logic.apply(healthy(), C('backup', { file: 'proba.txt' }));
  assert.deepEqual(r.s.backup.files.map((f) => f.name), ['proba.txt']);
});

// ── rules ──

test('rule 1: a filesystem write goes to every active member; the members hold the same data', () => {
  const s = at('book-primjer3', 4);
  assert.deepEqual(s.ev.to, ['vdb', 'vdc']);
  assert.deepEqual(s.ev.wrote, [0, 1, 2]);
  assert.deepEqual(blocks(s, 'vdb'), blocks(s, 'vdc'));
  assert.equal(s.cat.out, 'ovo je test\n');
  assert.equal(logic.file(s, 'proba.txt').size, 12, 'ls -l in ch12: 12 bytes');
});

test('rule 1 tie-break: a member still resyncing is active (map U, it would take writes)', () => {
  const s = logic.apply(logic.blank(P()), C('create')).s;
  assert.equal(s.array, 'resync');
  assert.deepEqual(logic.active(s).map((d) => d.name), ['vdb', 'vdc']);
  assert.equal(s.mdstat.map, 'UU');
});

test('rule 2: --create starts a resync with the book\'s /proc/mdstat line; the next command finds it done', () => {
  const s = at('book-primjer3', 1);
  assert.equal(s.array, 'resync');
  assert.equal(logic.disk(s, 'vdc').status, 'resync');
  assert.equal(box(s), '[2/2] [UU]');
  const lines = logic.mdstatLines(s.mdstat);
  assert.equal(lines[1], 'md0 : active raid1 vdc[1] vdb[0]');
  assert.equal(lines[2], '      2094080 blocks super 1.2 [2/2] [UU]');
  assert.equal(lines[3], '      [=>...................]  resync =  9.6% (201344/2094080) finish=0.1min speed=201344K/sec');
  const s2 = at('book-primjer3', 2);
  assert.equal(s2.ev.resyncDone, true);
  assert.equal(s2.array, 'optimal');
  assert.equal(s2.mdstat.resync, null);
  assert.deepEqual(at('book-primjer3', 0).mdstat, { created: false });
});

test('rule 3: --fail: (F), [2/1] [U_], degraded; no writes to the failed member; the file is still readable', () => {
  const s = at('book-primjer3', 5);
  assert.equal(box(s), '[2/1] [U_]');
  assert.equal(s.array, 'degraded');
  assert.equal(logic.mdstatLines(s.mdstat)[1], 'md0 : active raid1 vdc[1](F) vdb[0]');
  assert.equal(s.cat.out, 'ovo je test\n');
  assert.equal(s.cat.from, 'vdb');
  const t = at('two-failures', 2);
  assert.deepEqual(t.ev.to, ['vdb']);
  assert.deepEqual(t.ev.skipped, ['vdc']);
  assert.notDeepEqual(blocks(t, 'vdb'), blocks(t, 'vdc'), 'vdc is stale');
  assert.equal(box(at('corruption', 2)), '[2/1] [_U]', 'the map is in role order');
});

test('rule 4: --re-add resyncs the member from the active one: [2/2] [UU]', () => {
  const s = at('book-primjer3', 6);
  assert.equal(box(s), '[2/2] [UU]');
  assert.equal(s.array, 'optimal');
  assert.deepEqual(s.ev.copied, [], 'nothing was written while it was out');
  assert.deepEqual(s.disks.map((d) => d.status), ['ok', 'ok']);
  const { s: r, evs } = run(at('two-failures', 2), [C('readd', { disk: 'vdc' })]);
  assert.deepEqual(evs[0].copied, [0, 1, 2]);
  assert.deepEqual(blocks(r, 'vdb'), blocks(r, 'vdc'));
});

test('rule 5: rm is a mirrored write: mdstat unchanged, cat fails, the bytes stay on both disks unreferenced', () => {
  const before = at('book-primjer3', 6), s = at('book-primjer3', 7);
  assert.deepEqual(s.mdstat, before.mdstat);
  assert.deepEqual(logic.mdstatLines(s.mdstat), logic.mdstatLines(before.mdstat));
  assert.equal(s.array, 'optimal');
  assert.deepEqual(s.ev.to, ['vdb', 'vdc']);
  assert.deepEqual(s.ev.wrote, [0]);
  assert.deepEqual(s.cat, { exit: 1, out: null, err: 'enoent', from: null });
  assert.deepEqual(logic.freedBlocks(s), [1, 2]);
  assert.equal(blocks(s, 'vdc')[1].data, 'ovo je test\n', 'freed, not erased');
  assert.deepEqual(blocks(s, 'vdb'), blocks(s, 'vdc'));
});

test('rule 6: wrong bytes from an application are mirrored; each member alone gives them', () => {
  const s1 = at('corruption', 1);
  assert.equal(box(s1), '[2/2] [UU]');
  assert.deepEqual(s1.mdstat, healthy().mdstat);
  assert.deepEqual(blocks(s1, 'vdb'), blocks(s1, 'vdc'));
  assert.equal(s1.cat.out, logic.GARBAGE);
  assert.equal(at('corruption', 2).cat.from, 'vdc');
  assert.equal(at('corruption', 2).cat.out, logic.GARBAGE);
  assert.equal(at('corruption', 4).cat.from, 'vdb');
  assert.equal(at('corruption', 4).cat.out, logic.GARBAGE);
});

test('rule 6: encryption and renaming to *.locked are mirrored; the array stays healthy', () => {
  const s = at('ransomware-mirror', 3);
  assert.deepEqual(s.fs.files.map((f) => f.name), ['proba.txt.locked', 'vjezba.txt.locked', 'README.txt']);
  assert.equal(box(s), '[2/2] [UU]');
  assert.deepEqual(blocks(s, 'vdb'), blocks(s, 'vdc'));
  assert.equal(blocks(s, 'vdc')[1].data, logic.ENC);
  assert.equal(s.cat.err, 'enoent');
  const s4 = at('ransomware-mirror', 4);
  assert.equal(box(s4), '[2/1] [U_]');
  assert.equal(blocks(s4, 'vdb')[3].data, logic.ENC, 'the survivor holds the same encrypted bytes');
});

test('rule 7: no active member: array failed, [2/0] [__], cat gives an I/O error, writes fail', () => {
  const s = at('two-failures', 3);
  assert.equal(s.array, 'failed');
  assert.equal(box(s), '[2/0] [__]');
  assert.equal(logic.mdstatLines(s.mdstat)[1], 'md0 : active raid1 vdc[1](F) vdb[0](F)');
  assert.deepEqual(s.cat, { exit: 1, out: null, err: 'eio', from: null });
  const w = logic.apply(s, C('tee', { file: 'proba.txt', data: 'x\n' }));
  assert.equal(w.ev.eio, true);
  assert.deepEqual(w.ev.to, []);
});

test('rule 8: only a copy taken before the event restores; the restore is mirrored', () => {
  const s8 = at('with-backup', 8);
  assert.equal(s8.cat.err, 'enoent');
  assert.deepEqual(s8.backup.files.map((f) => [f.name, f.data]), [['proba.txt', 'ovo je test\n']]);
  const s9 = at('with-backup', 9);
  assert.equal(s9.cat.out, 'ovo je test\n');
  assert.deepEqual(s9.ev.to, ['vdb', 'vdc']);
  assert.deepEqual(blocks(s9, 'vdb'), blocks(s9, 'vdc'));
  // a copy taken after the delete has nothing to copy
  const late = run(logic.initial(P({ scene: 'with-backup' })), logic.script(P({ scene: 'with-backup' })).slice(0, 4)
    .concat([C('rm', { file: 'proba.txt' }), C('backup', { file: 'proba.txt' }), C('restore', { file: 'proba.txt' })]));
  assert.equal(late.evs[5].err, 'enoent');
  assert.equal(late.evs[6].err, 'enoent');
  assert.equal(late.s.cat.err, 'enoent');
  // a copy taken after the corruption holds the wrong bytes
  const bad = run(Object.assign(healthy(), { backup: { files: [] } }), [C('corrupt', { file: 'proba.txt' }), C('backup', { file: 'proba.txt' })]);
  assert.equal(bad.s.backup.files[0].data, logic.GARBAGE);
});

test('preset step counts and default', () => {
  assert.deepEqual(Object.fromEntries(logic.SCENE_IDS.map((k) => [k, logic.steps(P({ scene: k }))])),
    { 'book-primjer3': 7, corruption: 4, 'ransomware-mirror': 4, 'two-failures': 3, 'with-backup': 9 });
  assert.equal(logic.steps(logic.defaults), 7);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const scene of logic.SCENE_IDS) {
    const p = P({ scene });
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const scene of logic.SCENE_IDS) {
    const p = P({ scene });
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  for (const scene of logic.SCENE_IDS) {
    const p = P({ scene });
    let s = logic.initial(p);
    for (let n = 1; n <= logic.steps(p); n++) {
      const copy = structuredClone(s);
      const next = logic.step(s, n, p);
      assert.deepEqual(s, copy);
      s = next;
    }
  }
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults), 'meta.steps matches the default preset');
  const presets = Object.fromEntries([...html.matchAll(/\{ id: '([\w-]+)', label: [^,]+, params: (\{[^}]*\})/g)]
    .map((m) => [m[1], Function('return ' + m[2])()]));
  assert.deepEqual(Object.keys(presets).sort(), [...logic.SCENE_IDS].sort(), 'one preset per scene');
  for (const [id, params] of Object.entries(presets)) {
    assert.equal(params.scene, id);
    for (const k of Object.keys(params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  }
});
