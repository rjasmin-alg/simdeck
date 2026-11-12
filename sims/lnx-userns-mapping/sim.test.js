// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-userns-mapping. Run: node --test sims/lnx-userns-mapping/sim.test.js
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
const ROOTLESS = logic.defaultMap(true, 100000);
const ROOTFUL = logic.defaultMap(false, 100000);
const file = (uidOut, mode) => ({ path: 'x', uidOut, mode });

// ── rule 7, the tie-break: at most one line matches; the kernel refuses overlapping maps ──

test('rule 7: overlapping ranges are refused, inside and outside; adjacent ranges are fine', () => {
  assert.equal(logic.checkMap(ROOTLESS), null);
  assert.equal(logic.checkMap(ROOTFUL), null);
  // the two maps run on the kernel (SPEC.md rule 7)
  assert.deepEqual(logic.checkMap([{ inside: 0, outside: 1000, count: 1 }, { inside: 0, outside: 100000, count: 65536 }]),
    { errno: 'EINVAL', why: 'inside', line: 1, other: 0 });
  assert.deepEqual(logic.checkMap([{ inside: 0, outside: 1000, count: 1 }, { inside: 1, outside: 1000, count: 5 }]),
    { errno: 'EINVAL', why: 'outside', line: 1, other: 0 });
  // a range that ends where the next begins does not overlap
  assert.equal(logic.checkMap([{ inside: 0, outside: 10, count: 5 }, { inside: 5, outside: 15, count: 5 }]), null);
  // the last ID of a range overlaps
  assert.equal(logic.checkMap([{ inside: 0, outside: 10, count: 6 }, { inside: 5, outside: 100, count: 5 }]).why, 'inside');
  assert.equal(logic.checkMap([{ inside: 0, outside: 10, count: 5 }, { inside: 50, outside: 14, count: 5 }]).why, 'outside');
  // a count of 0 and a range past 32 bits are refused too
  assert.equal(logic.checkMap([{ inside: 0, outside: 1000, count: 0 }]).why, 'count');
  assert.equal(logic.checkMap([{ inside: 0, outside: 4294967295, count: 2 }]).why, 'range');
  assert.equal(logic.checkMap([{ inside: 4294967295, outside: 0, count: 2 }]).why, 'range');
  assert.equal(logic.checkMap([{ inside: 4294967295, outside: 0, count: 1 }]), null);
});

test('rule 7: in a valid map the order of the lines changes no translation', () => {
  const rev = ROOTLESS.slice().reverse();
  for (const id of [0, 1, 33, 1000, 65536, 65537]) assert.equal(logic.toOutside(rev, id).id, logic.toOutside(ROOTLESS, id).id, 'out ' + id);
  for (const id of [0, 999, 1000, 1001, 100000, 100032, 165535, 165536]) assert.equal(logic.toInside(rev, id).id, logic.toInside(ROOTLESS, id).id, 'in ' + id);
  // the line found is the one whose range holds the ID (its index in that map)
  assert.equal(logic.toOutside(rev, 33).line, 0);
  assert.equal(logic.toOutside(ROOTLESS, 33).line, 1);
});

test('rule 7: an invalid map would be read first line first (why the kernel refuses it)', () => {
  const bad = [{ inside: 0, outside: 1000, count: 1 }, { inside: 0, outside: 100000, count: 65536 }];
  assert.deepEqual(logic.toOutside(bad, 0), { id: 1000, line: 0 });
  assert.deepEqual(logic.toOutside(bad.slice().reverse(), 0), { id: 100000, line: 0 });
});

// ── rule 1: translation by line ──

test('rule 1: outward, outside + (in − inside); inward, inside + (out − outside)', () => {
  const map = [{ inside: 10, outside: 5000, count: 20 }];
  assert.deepEqual(logic.toOutside(map, 10), { id: 5000, line: 0 });
  assert.deepEqual(logic.toOutside(map, 29), { id: 5019, line: 0 });
  assert.deepEqual(logic.toOutside(map, 30), { id: null, line: null }, 'count is exclusive');
  assert.deepEqual(logic.toOutside(map, 9), { id: null, line: null });
  assert.deepEqual(logic.toInside(map, 5000), { id: 10, line: 0, unmapped: false });
  assert.deepEqual(logic.toInside(map, 5019), { id: 29, line: 0, unmapped: false });
  assert.equal(logic.toInside(map, 5020).unmapped, true);
  // round trip on every mapped ID of the rootless map's edges
  for (const id of [0, 1, 2, 33, 1000, 65535, 65536]) assert.equal(logic.toInside(ROOTLESS, logic.toOutside(ROOTLESS, id).id).id, id);
});

// ── rule 2: the default rootless map ──

test('rule 2: 0 → 1000 by line 1; n ≥ 1 → 100000 + n − 1 by line 2', () => {
  assert.deepEqual(ROOTLESS, [{ inside: 0, outside: 1000, count: 1 }, { inside: 1, outside: 100000, count: 65536 }]);
  assert.deepEqual(logic.toOutside(ROOTLESS, 0), { id: 1000, line: 0 });
  assert.deepEqual(logic.toOutside(ROOTLESS, 1), { id: 100000, line: 1 });
  assert.deepEqual(logic.toOutside(ROOTLESS, 33), { id: 100032, line: 1 });
  assert.deepEqual(logic.toOutside(ROOTLESS, 1000), { id: 100999, line: 1 });
  assert.deepEqual(logic.toOutside(ROOTLESS, 65536), { id: 165535, line: 1 });
  assert.deepEqual(logic.toOutside(ROOTLESS, 65537), { id: null, line: null });
  const m2 = logic.defaultMap(true, 200000);
  assert.equal(logic.toOutside(m2, 33).id, 200032);
  assert.equal(logic.toOutside(m2, 0).id, 1000);
});

test('rule 2: the state carries the /etc/subuid line the map comes from', () => {
  const s = at({ script: 'service-user', subuidStart: 200000 }, 0);
  assert.deepEqual(s.subuid, { user: 'student', start: 200000, count: 65536 });
  assert.deepEqual(s.map[1], { inside: 1, outside: 200000, count: 65536 });
});

test('rule 2: the processes on the host: student, 100032, 100999', () => {
  const s = at({}, 0);
  assert.deepEqual(logic.processes(s, 'h').map((p) => [p.uid, p.name, p.pid, p.line]),
    [[1000, 'student', 4321, 0], [100032, null, 4330, 1], [100999, null, 4335, 1]]);
  assert.deepEqual(logic.processes(s, 'c').map((p) => [p.uid, p.name, p.pid]),
    [[0, 'root', 1], [33, 'www', 7], [1000, 'app', 9]]);
});

// ── rule 3: unmapped is the overflow ID ──

test('rule 3: a host UID on no line is 65534 inside; host root and host 2000 alike', () => {
  assert.deepEqual(logic.toInside(ROOTLESS, 0), { id: 65534, line: null, unmapped: true });
  assert.deepEqual(logic.toInside(ROOTLESS, 2000), { id: 65534, line: null, unmapped: true });
  assert.deepEqual(logic.toInside(ROOTLESS, 99999), { id: 65534, line: null, unmapped: true });
  assert.deepEqual(logic.toInside(ROOTLESS, 165536), { id: 65534, line: null, unmapped: true });
  assert.equal(logic.toInside(ROOTLESS, 1000).id, 0);
  assert.equal(logic.toInside(ROOTLESS, 100032).id, 33);
});

test('rule 3: the container lists host root\'s file as 65534 nobody; on disk it is still 0', () => {
  const s = at({ script: 'host-file-inside' }, 2);
  const c = logic.listing(s, 'c')[0], hh = logic.listing(s, 'h')[0];
  assert.deepEqual([c.uid, c.name, c.unmapped, c.line], [65534, 'nobody', true, null]);
  assert.deepEqual([hh.uid, hh.name], [0, 'root']);
  assert.equal(s.files[0].uidOut, 0);
  assert.ok(s.changed.includes('list:c'));
});

// ── rule 4: root inside has capabilities only over what its namespace owns ──

test('rule 4: container root cannot read host root\'s 0600 file: it is UID 1000, others ---', () => {
  const r = logic.access(ROOTLESS, { side: 'c', uidIn: 0 }, file(0, 0o600), 'r');
  assert.deepEqual(r, { uidOut: 1000, need: 'r', cls: 'others', bits: '---', ok: false, capDenied: true });
  const s = at({ script: 'host-file-inside' }, 3);
  assert.equal(s.result.errno, 'EACCES');
  assert.equal(s.result.check.capDenied, true);
  assert.equal(s.who.uidOut, 1000);
});

test('rule 4: container root passes on a file whose owner is mapped (www\'s 100032)', () => {
  assert.equal(logic.access(ROOTLESS, { side: 'c', uidIn: 0 }, file(100032, 0o600), 'w').cls, 'cap');
  assert.equal(logic.access(ROOTLESS, { side: 'c', uidIn: 0 }, file(100032, 0o600), 'w').ok, true);
  // the user's own file is mapped too (to 0)
  assert.equal(logic.access(ROOTLESS, { side: 'c', uidIn: 0 }, file(1000, 0o000), 'r').cls, 'cap');
  // a host 2000 file is not: the bits decide, as UID 1000
  const r = logic.access(ROOTLESS, { side: 'c', uidIn: 0 }, file(2000, 0o644), 'r');
  assert.deepEqual([r.cls, r.bits, r.ok, r.capDenied], ['others', 'r--', true, true]);
});

test('rule 4: a non-root container process has no capability; it is its host UID', () => {
  const r = logic.access(ROOTLESS, { side: 'c', uidIn: 33 }, file(100032, 0o600), 'w');
  assert.deepEqual([r.uidOut, r.cls, r.ok, r.capDenied], [100032, 'owner', true, false]);
  const r2 = logic.access(ROOTLESS, { side: 'c', uidIn: 1000 }, file(1000, 0o600), 'r');
  assert.deepEqual([r2.uidOut, r2.cls, r2.bits, r2.ok], [100999, 'others', '---', false]);
});

// ── rule 5: the host user is not its subordinate IDs ──

test('rule 5: student cannot write www\'s file (100032, 0644)', () => {
  const r = logic.access(ROOTLESS, { side: 'h', uid: 1000 }, file(100032, 0o644), 'w');
  assert.deepEqual(r, { uidOut: 1000, need: 'w', cls: 'others', bits: 'r--', ok: false, capDenied: false });
  const s = at({ script: 'service-user' }, 3);
  assert.equal(s.action.side, 'h');
  assert.equal(s.result.errno, 'EACCES');
  assert.equal(s.files[0].uidOut, 100032);
  // its own file (container root's) it can write
  assert.equal(logic.access(ROOTLESS, { side: 'h', uid: 1000 }, file(1000, 0o644), 'w').ok, true);
});

test('rules 4, 5: every letter asked for must be set', () => {
  const r = logic.access(ROOTLESS, { side: 'h', uid: 1000 }, file(1000, 0o444), 'rw');
  assert.deepEqual([r.cls, r.bits, r.ok], ['owner', 'r--', false]);
  assert.equal(logic.access(ROOTLESS, { side: 'h', uid: 1000 }, file(1000, 0o644), 'rw').ok, true);
});

test('the container\'s ls marks the line that translated each listed owner', () => {
  logic.SCRIPTS['test-ls'] = { files: [], actions: [{ side: 'c', by: 'web', op: 'create', path: 'b' }, { side: 'c', by: 'sh', op: 'ls', path: null }] };
  try {
    const s = at({ script: 'test-ls' }, 2);
    assert.deepEqual(s.used, [0, 1], 'line 1 for root\'s ls, line 2 for b\'s owner 100032');
    assert.deepEqual(s.changed, ['proc:sh', 'list:c']);
  } finally { delete logic.SCRIPTS['test-ls']; }
});

// ── rule 6: rootful contrast ──

test('rule 6: without a user namespace the map is 0 0 4294967295; root inside is host root', () => {
  assert.deepEqual(ROOTFUL, [{ inside: 0, outside: 0, count: 4294967295 }]);
  assert.deepEqual(logic.toOutside(ROOTFUL, 0), { id: 0, line: 0 });
  assert.equal(logic.toOutside(ROOTFUL, 33).id, 33);
  assert.equal(logic.toInside(ROOTFUL, 0).unmapped, false);
  const r = logic.access(ROOTFUL, { side: 'c', uidIn: 0 }, file(0, 0o600), 'r');
  assert.deepEqual([r.cls, r.ok], ['root', true]);
  const s = at({ script: 'rootful', rootless: false }, 1);
  assert.equal(s.files[0].uidOut, 0);
  assert.deepEqual(logic.listing(s, 'h').map((f) => [f.uid, f.name]), [[0, 'root']]);
});

test('rule 6: the toggle turns any script rootful (cross-checks)', () => {
  assert.equal(at({ script: 'root-inside', rootless: false }, 1).files[0].uidOut, 0);
  assert.equal(at({ script: 'service-user', rootless: false }, 1).files[0].uidOut, 33);
  const s3 = at({ script: 'service-user', rootless: false }, 3);
  assert.equal(s3.result.errno, 'EACCES', 'student is still not 33');
  const h2 = at({ script: 'host-file-inside', rootless: false }, 2);
  assert.deepEqual(logic.listing(h2, 'c').map((f) => [f.uid, f.name, f.unmapped]), [[0, 'root', false]]);
  const h3 = at({ script: 'host-file-inside', rootless: false }, 3);
  assert.equal(h3.result.ok, true);
  assert.equal(h3.result.check.cls, 'root');
});

// ── the presets' numbers (SPEC.md table) ──

test('preset root-inside: a is host 1000 student, by line 1', () => {
  const s1 = at({ script: 'root-inside' }, 1);
  assert.deepEqual([s1.who.uidIn, s1.who.uidOut, s1.who.line], [0, 1000, 0]);
  assert.deepEqual(s1.used, [0]);
  assert.deepEqual(s1.files, [{ path: 'a', uidOut: 1000, mode: 0o644, isNew: true }]);
  assert.deepEqual(s1.changed, ['proc:sh', 'file:a']);
  assert.deepEqual(logic.listing(s1, 'c').map((f) => [f.uid, f.name]), [[0, 'root']]);
  const s2 = at({ script: 'root-inside' }, 2);
  assert.deepEqual([s2.action.side, s2.action.op], ['h', 'ls']);
  assert.deepEqual(logic.listing(s2, 'h').map((f) => [f.uid, f.name, f.line]), [[1000, 'student', 0]]);
  assert.equal(s2.files[0].isNew, false);
  assert.deepEqual(s2.changed, ['list:h']);
  assert.deepEqual(s2.used, [0], 'the line that covers host 1000, and only it (used is per step)');
});

test('preset service-user: b is host 100032 with no name; S = 200000 gives 200032', () => {
  const s1 = at({ script: 'service-user' }, 1);
  assert.deepEqual([s1.who.user, s1.who.uidIn, s1.who.uidOut, s1.who.line], ['www', 33, 100032, 1]);
  assert.deepEqual(logic.listing(s1, 'h').map((f) => [f.uid, f.name]), [[100032, null]]);
  assert.deepEqual(logic.listing(s1, 'c').map((f) => [f.uid, f.name]), [[33, 'www']]);
  assert.equal(at({ script: 'service-user', subuidStart: 200000 }, 1).files[0].uidOut, 200032);
  assert.equal(at({ script: 'service-user', subuidStart: 200000 }, 3).result.errno, 'EACCES');
  assert.deepEqual(at({ script: 'service-user' }, 2).used, [1]);
  const s3 = at({ script: 'service-user' }, 3);
  assert.deepEqual(s3.used, [1], 'the line that covers the file\'s owner');
  assert.deepEqual(s3.changed, ['file:b']);
});

test('preset host-file-inside: host lists 0 root, container lists 65534, container root refused', () => {
  const s1 = at({ script: 'host-file-inside' }, 1);
  assert.deepEqual([s1.action.side, s1.action.op], ['h', 'ls']);
  assert.deepEqual(s1.used, []);
  const s2 = at({ script: 'host-file-inside' }, 2);
  assert.deepEqual([s2.action.side, s2.action.by], ['c', 'sh']);
  assert.deepEqual(s2.used, [0], 'only the process\'s own line; the file is on none');
  const s3 = at({ script: 'host-file-inside' }, 3);
  assert.deepEqual([s3.result.ok, s3.result.check.bits, s3.result.check.need], [false, '---', 'r']);
  assert.equal(s3.files[0].mode, 0o600);
  assert.deepEqual(s3.used, [0], 'the process\'s line only; the file is on none');
  assert.deepEqual(s3.changed, ['proc:sh', 'file:secret']);
});

test('preset rootful: the preset itself turns the user namespace off', () => {
  const pr = logic.PRESETS.find((x) => x.id === 'rootful');
  assert.equal(pr.params.rootless, false);
  const s = kit.stateAt(logic, P(pr.params), 1);
  assert.deepEqual(s.map, ROOTFUL);
  assert.equal(s.files[0].uidOut, 0);
  for (const x of logic.PRESETS.filter((y) => y.id !== 'rootful')) assert.equal(x.params.rootless, true, x.id);
});

test('steps per preset: 2, 3, 3, 2; sim.json steps is the default\'s', () => {
  assert.deepEqual(logic.PRESETS.map((p) => logic.steps(p.params)), [2, 3, 3, 2]);
  assert.equal(logic.steps({}), 2);
});

test('a created file is 0644 and only the newest is new', () => {
  assert.equal(logic.NEW_MODE, 0o644);
  assert.equal(logic.lsString(0o644), '-rw-r--r--');
  assert.equal(logic.lsString(0o600), '-rw-------');
  assert.equal(logic.octal(0o600), '600');
  assert.equal(logic.classBits(0o640, 1), 'r--');
});

test('params are normalised: unknown script, start and rootless fall back', () => {
  assert.deepEqual(logic.norm({ script: 'nope', subuidStart: 5 }), { script: 'root-inside', rootless: true, subuidStart: 100000 });
  assert.equal(logic.norm({ subuidStart: '200000' }).subuidStart, 200000);
  assert.equal(logic.norm({ rootless: 0 }).rootless, false);
  assert.equal(logic.norm({ rootless: 'false' }).rootless, false);
});

// ── generic checks every sim keeps ──

const ALL_PARAMS = [];
for (const script of logic.SCRIPT_IDS) for (const rootless of [true, false]) for (const subuidStart of logic.SUBUID_STARTS) ALL_PARAMS.push(P({ script, rootless, subuidStart }));

test('state is JSON-safe at every step', () => {
  for (const p of ALL_PARAMS) {
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const p of ALL_PARAMS) {
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ script: 'service-user' });
  const s0 = kit.stateAt(logic, p, 1);
  const copy = structuredClone(s0);
  logic.step(s0, 2, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('strings: every preset, goal, ordinal and access class has its words', () => {
  for (const lang of ['hr', 'en']) {
    const tb = strings[lang];
    for (const pr of logic.PRESETS) {
      for (const k of ['preset_' + pr.id, 'preset_' + pr.id + '_hint', 'goal_' + pr.id]) assert.ok(tb[k], lang + ' ' + k);
    }
    for (const k of ['ord_0', 'ord_1', 'cls_owner', 'cls_others', 'cls_cap', 'cls_root']) assert.ok(tb[k], lang + ' ' + k);
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
