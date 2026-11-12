// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-nfs-root-squash. Run: node --test sims/lnx-nfs-root-squash/sim.test.js
// Rules and numbers: SPEC.md. Tie-break first, then one test per rule, then the presets' numbers, then the generic block.
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
const at = (over, n) => kit.stateAt(logic, P(over), n);
const exp = (squash, ro) => ({ ro: !!ro, squash, anonuid: 65534, anongid: 65534 });

// ── rule 7, the tie-break: the export check comes before mapping and bits ──

test('rule 7: ro refuses a write the bits would allow, before mapping and the check', () => {
  // client root under no_root_squash would pass every check; ro still refuses
  const s = at({ script: 'book-ro', ro: true, squash: 'no_root_squash' }, 2);
  assert.equal(s.result.errno, 'EROFS');
  assert.equal(s.phases.export, 'refused');
  assert.equal(s.phases.map, 'skipped');
  assert.equal(s.phases.perm, 'skipped');
  assert.equal(s.mapped, null);
  assert.equal(s.check, null);
  // a write on a file whose owner bits allow it (uid-collision step 2) is refused on ro too
  const w = at({ script: 'uid-collision', ro: true }, 2);
  assert.equal(w.result.errno, 'EROFS');
  assert.equal(w.check, null);
  // and the same write passes on rw
  assert.equal(at({ script: 'uid-collision', ro: false }, 2).result.errno, null);
});

test('rule 7: the export check alone, for every op', () => {
  assert.equal(logic.exportCheck(exp('root_squash', true), 'create'), 'EROFS');
  assert.equal(logic.exportCheck(exp('root_squash', true), 'write'), 'EROFS');
  assert.equal(logic.exportCheck(exp('root_squash', true), 'read'), null);
  assert.equal(logic.exportCheck(exp('root_squash', false), 'create'), null);
  assert.equal(logic.exportCheck(exp('root_squash', false), 'write'), null);
});

// ── rule 1: numbers, not names ──

test('rule 1: the request carries numbers; the server reads them with its own names', () => {
  const s = at({ script: 'uid-collision', ro: false }, 1);
  assert.equal(s.request.clientUser, 'student');
  assert.equal(s.request.uid, 1000);
  assert.equal(s.request.gid, 1000);
  assert.equal(s.mapped.uid, 1000);
  assert.equal(logic.serverName(s.mapped.uid), 'ana');
  assert.equal(s.mapped.kind, 'collision');
  // student is the owner of ana's file: the owner class decides
  assert.equal(s.check.cls, 'owner');
  assert.equal(s.result.ok, true);
  assert.equal(s.result.content, 'plan.txt');
});

test('rule 1: names never enter the decision (a renamed client user with the same uid decides the same)', () => {
  const file = { uid: 1000, gid: 1000, mode: 0o600 };
  assert.deepEqual(logic.permCheck(1000, 1000, file, 'r'), { cls: 'owner', need: 'r', bits: 'rw-', ok: true });
  assert.equal(logic.mapKind(exp('root_squash'), { name: 'ana', uid: 1000 }, { uid: 1000, gid: 1000 }), 'kept');
  assert.equal(logic.mapKind(exp('root_squash'), { name: 'student', uid: 1000 }, { uid: 1000, gid: 1000 }), 'collision');
});

// ── rule 2: ro ──

test('rule 2: ro refuses sudo touch with EROFS, exit 1; reads still work', () => {
  const s1 = at({ script: 'book-ro' }, 1);
  assert.equal(s1.result.errno, null);
  assert.equal(s1.result.exit, 0);
  assert.equal(s1.result.content, 'proba.txt');
  const s2 = at({ script: 'book-ro' }, 2);
  assert.equal(s2.request.clientUser, 'root');
  assert.equal(s2.request.via, 'sudo');
  assert.equal(s2.result.errno, 'EROFS');
  assert.equal(s2.result.exit, 1);
  assert.equal(s2.files.length, 1, 'nothing created');
  assert.ok(s2.changed.includes('phase:export'));
});

// ── rule 3: root_squash ──

test('rule 3: root_squash maps uid 0 and gid 0 to 65534, and nothing else', () => {
  assert.deepEqual(logic.mapIds(exp('root_squash'), 0, 0), { uid: 65534, gid: 65534 });
  assert.deepEqual(logic.mapIds(exp('root_squash'), 1, 1), { uid: 1, gid: 1 });
  assert.deepEqual(logic.mapIds(exp('root_squash'), 1000, 1000), { uid: 1000, gid: 1000 });
  // uid and gid separately
  assert.deepEqual(logic.mapIds(exp('root_squash'), 1000, 0), { uid: 1000, gid: 65534 });
  assert.deepEqual(logic.mapIds(exp('root_squash'), 0, 50), { uid: 65534, gid: 50 });
  // anonuid / anongid are honoured
  assert.deepEqual(logic.mapIds({ squash: 'root_squash', anonuid: 150, anongid: 100 }, 0, 0), { uid: 150, gid: 100 });
  // the default anonymous ids are 65534 when the export does not say
  assert.deepEqual(logic.mapIds({ squash: 'root_squash' }, 0, 0), { uid: 65534, gid: 65534 });
});

test('rule 3: bin (1) is not squashed and writes its own file', () => {
  const s1 = at({ script: 'bin-not-squashed', ro: false, squash: 'root_squash' }, 1);
  assert.equal(s1.mapped.uid, 65534);
  assert.equal(s1.result.errno, 'EACCES');
  const s2 = at({ script: 'bin-not-squashed', ro: false, squash: 'root_squash' }, 2);
  assert.equal(s2.mapped.uid, 1);
  assert.equal(s2.mapped.kind, 'keptSystem');
  assert.equal(s2.check.cls, 'owner');
  assert.equal(s2.result.errno, null);
  assert.ok(!s2.changed.includes('mapped'), 'nothing mapped');
});

// ── rule 4: no_root_squash ──

test('rule 4: no_root_squash keeps uid 0; root passes the check', () => {
  assert.deepEqual(logic.mapIds(exp('no_root_squash'), 0, 0), { uid: 0, gid: 0 });
  assert.deepEqual(logic.mapIds(exp('no_root_squash'), 1000, 1000), { uid: 1000, gid: 1000 });
  const s = at({ script: 'no-root-squash', ro: false, squash: 'no_root_squash' }, 2);
  assert.equal(s.mapped.kind, 'rootKept');
  assert.equal(s.check.cls, 'root');
  assert.equal(s.result.errno, null);
  assert.equal(s.result.content, 'tajna');
});

// ── rule 5: all_squash ──

test('rule 5: all_squash maps every uid and gid to 65534', () => {
  for (const [u, g] of [[0, 0], [1, 1], [1000, 1000], [1000, 0]]) {
    assert.deepEqual(logic.mapIds(exp('all_squash'), u, g), { uid: 65534, gid: 65534 });
  }
  const s = at({ script: 'all-squash', ro: false, squash: 'all_squash' }, 1);
  assert.equal(s.mapped.kind, 'squashedAll');
  assert.equal(s.result.owner.uid, 65534);
  assert.equal(s.result.owner.gid, 65534);
});

// ── rule 6: then the bits, with the mapped ids ──

test('rule 6: squashed root is others and cannot read 0600; client uid 1000 can', () => {
  const root = at({ script: 'root-squashed', ro: false }, 2);
  assert.equal(root.check.cls, 'others');
  assert.equal(root.check.bits, '---');
  assert.equal(root.result.errno, 'EACCES');
  assert.equal(root.result.exit, 1);
  const student = at({ script: 'root-squashed', ro: false }, 3);
  assert.equal(student.check.cls, 'owner');
  assert.equal(student.result.errno, null);
});

test('rule 6: class order owner → group → others; the first match decides', () => {
  const file = { uid: 1000, gid: 50, mode: 0o047 }; // ---r--rwx: owner ---, group r--, others rwx
  assert.equal(logic.permCheck(1000, 50, file, 'r').cls, 'owner');
  assert.equal(logic.permCheck(1000, 50, file, 'r').ok, false, 'owner decides even though group and others could read');
  assert.equal(logic.permCheck(7, 50, file, 'r').cls, 'group');
  assert.equal(logic.permCheck(7, 50, file, 'r').ok, true);
  assert.equal(logic.permCheck(7, 50, file, 'w').ok, false, 'group decides even though others could write');
  assert.equal(logic.permCheck(7, 8, file, 'w').cls, 'others');
  assert.equal(logic.permCheck(7, 8, file, 'w').ok, true);
  // uid 0 passes every check
  assert.equal(logic.permCheck(0, 0, { uid: 5, gid: 5, mode: 0 }, 'wx').ok, true);
  assert.equal(logic.permCheck(0, 0, { uid: 5, gid: 5, mode: 0 }, 'wx').cls, 'root');
  // gid 0 alone is no privilege
  assert.equal(logic.permCheck(5, 0, { uid: 6, gid: 7, mode: 0 }, 'r').ok, false);
  assert.equal(logic.permCheck(5, 0, { uid: 6, gid: 7, mode: 0o070 }, 'r').cls, 'others', 'gid 0 matches no other group');
});

test('rule 6: create needs w and x on the directory', () => {
  const dir = { uid: 0, gid: 0, mode: 0o755 };
  assert.equal(logic.permCheck(65534, 65534, dir, 'wx').ok, false);
  assert.equal(logic.permCheck(65534, 65534, { uid: 0, gid: 0, mode: 0o776 }, 'wx').ok, false, 'w without x');
  assert.equal(logic.permCheck(65534, 65534, { uid: 0, gid: 0, mode: 0o773 }, 'wx').ok, true);
  // book-ro with rw: the directory 0755 refuses squashed root, no_root_squash lets root create
  const sq = at({ script: 'book-ro', ro: false, squash: 'root_squash' }, 2);
  assert.equal(sq.check.target, 'dir');
  assert.equal(sq.check.need, 'wx');
  assert.equal(sq.check.bits, 'r-x');
  assert.equal(sq.result.errno, 'EACCES');
  assert.ok(sq.changed.includes('file:.'));
  const kept = at({ script: 'book-ro', ro: false, squash: 'no_root_squash' }, 2);
  assert.equal(kept.result.errno, null);
  assert.equal(kept.result.owner.uid, 0);
});

// ── rule 8: a new file gets the mapped ids ──

test('rule 8: the created file is owned by the mapped ids, mode 0644', () => {
  const sq = at({ script: 'root-squashed', ro: false }, 1);
  const a = logic.findFile(sq, 'a.txt');
  assert.deepEqual([a.uid, a.gid, a.mode, a.isNew], [65534, 65534, 0o644, true]);
  assert.equal(logic.serverName(a.uid), 'nobody');
  assert.ok(sq.changed.includes('file:a.txt'));
  assert.ok(sq.changed.includes('mapped'));
  const col = logic.findFile(at({ script: 'uid-collision', ro: false }, 3), 'biljeska.txt');
  assert.deepEqual([col.uid, col.gid], [1000, 1000]);
  assert.equal(logic.serverName(col.uid), 'ana');
  const nr = logic.findFile(at({ script: 'no-root-squash', ro: false, squash: 'no_root_squash' }, 1), 'b.txt');
  assert.deepEqual([nr.uid, nr.gid], [0, 0]);
  // the file stays in later steps, no longer new
  const later = logic.findFile(at({ script: 'root-squashed', ro: false }, 2), 'a.txt');
  assert.equal(later.isNew, false);
});

test('rules 3 and 8 end to end: uid and gid are mapped separately and the new file gets both', () => {
  // a client user with uid 1000 and gid 0, which no preset has: added for this test only
  logic.CLIENT.users.push({ name: 'mixed', uid: 1000, gid: 0 });
  logic.SCRIPTS['test-mixed'] = { dir: { uid: 0, gid: 0, mode: 0o777 }, files: [], requests: [{ user: 'mixed', op: 'create', name: 'm.txt', via: null }] };
  try {
    const p = { script: 'test-mixed', ro: false, squash: 'root_squash' };
    const s = kit.stateAt(logic, p, 1);
    assert.deepEqual([s.request.uid, s.request.gid], [1000, 0], 'the request carries the sent gid');
    assert.deepEqual([s.mapped.uid, s.mapped.gid], [1000, 65534]);
    assert.deepEqual(s.result.owner, { uid: 1000, gid: 65534 });
    assert.ok(s.changed.includes('mapped'), 'a gid-only mapping is marked too');
    const m = logic.findFile(s, 'm.txt');
    assert.deepEqual([m.uid, m.gid], [1000, 65534]);
  } finally {
    logic.CLIENT.users.pop();
    delete logic.SCRIPTS['test-mixed'];
  }
});

test('rule 6: owner needs only the uid; anonymous ids come from anonuid and anongid separately', () => {
  assert.deepEqual(logic.permCheck(1000, 50, { uid: 1000, gid: 1000, mode: 0o600 }, 'r'), { cls: 'owner', need: 'r', bits: 'rw-', ok: true });
  assert.equal(logic.permCheck(1000, 50, { uid: 1000, gid: 1000, mode: 0o200 }, 'w').ok, true, 'w without r is enough to write');
  assert.deepEqual(logic.mapIds({ squash: 'all_squash', anonuid: 150, anongid: 100 }, 1000, 1000), { uid: 150, gid: 100 });
  assert.deepEqual(logic.mapIds({ squash: 'root_squash', anonuid: 0, anongid: 0 }, 0, 0), { uid: 0, gid: 0 });
});

test('phases, ok, need and changed on each path', () => {
  // EACCES on a file: send, export, map ok; perm refused; apply skipped; the refused row is marked
  const den = at({ script: 'root-squashed', ro: false }, 2);
  assert.deepEqual(den.phases, { send: 'ok', export: 'ok', map: 'ok', perm: 'refused', apply: 'skipped' });
  assert.equal(den.result.ok, false);
  assert.equal(den.result.content, null);
  assert.ok(den.changed.includes('file:tajna'));
  // success: every phase ok
  const ok = at({ script: 'uid-collision', ro: false }, 2);
  assert.deepEqual(ok.phases, { send: 'ok', export: 'ok', map: 'ok', perm: 'ok', apply: 'ok' });
  assert.equal(ok.result.ok, true);
  assert.equal(ok.check.need, 'w');
  assert.equal(ok.check.name, 'plan.txt');
  assert.ok(ok.changed.includes('file:plan.txt'), 'the written file is marked');
  assert.ok(!ok.changed.includes('mapped'));
  assert.equal(at({ script: 'uid-collision', ro: false }, 1).check.need, 'r');
  // EROFS: refused at the export, everything after skipped
  const ro = at({ script: 'book-ro' }, 2);
  assert.deepEqual(ro.phases, { send: 'ok', export: 'refused', map: 'skipped', perm: 'skipped', apply: 'skipped' });
  assert.equal(ro.result.ok, false);
  // a create checks the directory row '.'
  const cr = at({ script: 'root-squashed', ro: false }, 1);
  assert.equal(cr.check.name, '.');
  assert.equal(cr.check.target, 'dir');
  assert.equal(cr.phases.apply, 'ok');
});

// ── every preset's numbers (SPEC.md, Presets and expected numbers) ──

const TABLE = {
  'book-ro': [['student', 'read', [1000, 1000], 'others', true, null, null], ['root', 'create', null, null, null, 'EROFS', null]],
  'root-squashed': [['root', 'create', [65534, 65534], 'others', true, null, 65534], ['root', 'read', [65534, 65534], 'others', false, 'EACCES', null],
    ['student', 'read', [1000, 1000], 'owner', true, null, null]],
  'uid-collision': [['student', 'read', [1000, 1000], 'owner', true, null, null], ['student', 'write', [1000, 1000], 'owner', true, null, null],
    ['student', 'create', [1000, 1000], 'others', true, null, 1000]],
  'no-root-squash': [['root', 'create', [0, 0], 'root', true, null, 0], ['root', 'read', [0, 0], 'root', true, null, null]],
  'bin-not-squashed': [['root', 'write', [65534, 65534], 'others', false, 'EACCES', null], ['bin', 'write', [1, 1], 'owner', true, null, null]],
  'all-squash': [['student', 'create', [65534, 65534], 'others', true, null, 65534], ['student', 'read', [65534, 65534], 'others', false, 'EACCES', null]]
};

test('presets: every step as SPEC.md lists it, and the task\'s step counts', () => {
  const counts = { 'book-ro': 2, 'root-squashed': 3, 'uid-collision': 3, 'no-root-squash': 2, 'bin-not-squashed': 2, 'all-squash': 2 };
  assert.deepEqual(logic.PRESETS.map((x) => x.id), Object.keys(TABLE));
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    assert.equal(logic.steps(p), counts[pr.id], pr.id);
    TABLE[pr.id].forEach(([user, op, mapped, cls, ok, errno, owner], i) => {
      const s = kit.stateAt(logic, p, i + 1);
      const where = `${pr.id} step ${i + 1}`;
      assert.equal(s.request.clientUser, user, where);
      assert.equal(s.request.op, op, where);
      assert.deepEqual(s.mapped && [s.mapped.uid, s.mapped.gid], mapped, where);
      assert.equal(s.check && s.check.cls, cls, where);
      assert.equal(s.check && s.check.ok, ok, where);
      assert.equal(s.result.errno, errno, where);
      assert.equal(s.result.exit, errno ? 1 : 0, where);
      assert.equal(s.result.owner && s.result.owner.uid, owner, where);
    });
  }
});

test('presets: the cross-checks (SPEC.md) with the params changed', () => {
  const r = (over, n) => at(over, n).result;
  assert.equal(r({ script: 'root-squashed', ro: false, squash: 'no_root_squash' }, 1).owner.uid, 0);
  assert.equal(r({ script: 'root-squashed', ro: false, squash: 'no_root_squash' }, 2).errno, null);
  assert.equal(r({ script: 'root-squashed', ro: false, squash: 'all_squash' }, 3).errno, 'EACCES');
  assert.equal(r({ script: 'bin-not-squashed', ro: false, squash: 'all_squash' }, 2).errno, 'EACCES');
  assert.equal(r({ script: 'uid-collision', ro: true }, 1).errno, null);
  assert.equal(r({ script: 'uid-collision', ro: true }, 3).errno, 'EROFS');
});

test('mapKind: every kind', () => {
  const k = (sq, name, uid) => {
    const u = { name, uid, gid: uid };
    return logic.mapKind(exp(sq), u, logic.mapIds(exp(sq), uid, uid));
  };
  assert.equal(k('root_squash', 'root', 0), 'squashedRoot');
  assert.equal(k('all_squash', 'root', 0), 'squashedRoot');
  assert.equal(k('no_root_squash', 'root', 0), 'rootKept');
  assert.equal(k('all_squash', 'student', 1000), 'squashedAll');
  assert.equal(k('all_squash', 'bin', 1), 'squashedAll');
  assert.equal(k('root_squash', 'student', 1000), 'collision');
  assert.equal(k('root_squash', 'bin', 1), 'keptSystem');
  assert.equal(k('no_root_squash', 'bin', 1), 'kept');
});

test('exportfs -v words for each squash option', () => {
  assert.deepEqual(logic.squashWords('root_squash'), ['root_squash', 'no_all_squash']);
  assert.deepEqual(logic.squashWords('no_root_squash'), ['no_root_squash', 'no_all_squash']);
  assert.deepEqual(logic.squashWords('all_squash'), ['root_squash', 'all_squash']);
});

test('nine bits: ls strings and octal', () => {
  assert.equal(logic.lsString('file', 0o600), '-rw-------');
  assert.equal(logic.lsString('dir', 0o755), 'drwxr-xr-x');
  assert.equal(logic.octal(0o644), '644');
  assert.equal(logic.octal(0o7), '007');
  assert.equal(logic.classBits(0o640, 'owner'), 'rw-');
  assert.equal(logic.classBits(0o640, 'group'), 'r--');
  assert.equal(logic.classBits(0o640, 'others'), '---');
});

test('the log keeps one line per request; step 0 has no request', () => {
  const s0 = at({ script: 'root-squashed', ro: false }, 0);
  assert.equal(s0.request, null);
  assert.equal(s0.result, null);
  assert.deepEqual(s0.log, []);
  const s3 = at({ script: 'root-squashed', ro: false }, 3);
  assert.deepEqual(s3.log.map((l) => [l.n, l.clientUser, l.op, l.name, l.errno]),
    [[1, 'root', 'create', 'a.txt', null], [2, 'root', 'read', 'tajna', 'EACCES'], [3, 'student', 'read', 'tajna', null]]);
});

test('params are normalised: unknown script and squash fall back to the defaults', () => {
  assert.deepEqual(logic.norm({ script: 'nope', squash: 'x' }), { script: 'book-ro', ro: true, squash: 'root_squash' });
  assert.equal(logic.norm({ ro: 0 }).ro, false);
  assert.equal(logic.steps({}), 2);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ script: 'root-squashed', ro: false });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('strings: every preset, mapping kind, op and readable file has its words', () => {
  for (const lang of ['hr', 'en']) {
    const tb = strings[lang];
    for (const pr of logic.PRESETS) { assert.ok(tb['preset_' + pr.id], lang + pr.id); assert.ok(tb['preset_' + pr.id + '_hint'], lang + pr.id); }
    for (const k of ['notReached', 'squashedRoot', 'squashedAll', 'rootKept', 'collision', 'keptSystem', 'kept']) assert.ok(tb['map_' + k], lang + k);
    for (const op of ['read', 'write', 'create']) assert.ok(tb['op_' + op], lang + op);
    for (const id of logic.SCRIPT_IDS) {
      for (const r of logic.SCRIPTS[id].requests) if (r.op === 'read') assert.ok(tb['content_' + r.name.replace(/\W/g, '_')], lang + r.name);
    }
  }
});

test('the page: meta steps match the default script; presets come from the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults));
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults));
  assert.match(html, /L\.PRESETS\.map/);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, k);
  for (const e of sim.entries || []) assert.ok(logic.PRESETS.some((x) => x.id === e.preset), e.preset);
});
