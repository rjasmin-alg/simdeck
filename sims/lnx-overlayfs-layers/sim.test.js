// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-overlayfs-layers' model: tie-breaks first, then one test per rule (SPEC.md), then the presets'
// numbers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const { KB, MB } = logic;
const P = (over) => Object.assign({}, logic.defaults, over);
const steps = (p) => kit.stepsOf(logic, p);
const at = (p, n) => kit.stateAt(logic, p, n);
const all = (p) => Array.from({ length: steps(p) + 1 }, (_, n) => at(p, n));
const upper = (s, c) => s.containers.find((x) => x.id === c).upper;
const layer = (s, id) => s.layers.find((l) => l.id === id).files;

/** A small hand-made state: L1 below L2, one container A. */
function mk(l1, l2, up) {
  const layers = [{ id: 'L1', ro: true, files: l1 }];
  if (l2) layers.push({ id: 'L2', ro: true, files: l2 });
  return { layers, containers: [{ id: 'A', upper: up || {} }] };
}
const F = (size) => ({ size, kind: 'file' });
const D = () => ({ size: 0, kind: 'dir' });

const PRESETS = {
  'edit-config': { scene: 'edit-config' },
  'big-file': { scene: 'big-file' },
  'delete': { scene: 'delete' },
  'two-containers': { scene: 'two-containers' },
  'build-rm': { scene: 'build-rm' },
  'opaque': { scene: 'opaque' }
};

// ── tie-breaks (rule 10) ──

test('tie-break: paths sort component by component, a directory right before its entries', () => {
  const list = ['/var/cache/dnf/metadata', '/app-old', '/app/main.py', '/etc/os-release', '/app', '/var/cache/dnf'];
  assert.deepEqual(logic.sortPaths(list), ['/app', '/app/main.py', '/app-old', '/etc/os-release', '/var/cache/dnf', '/var/cache/dnf/metadata']);
  assert.ok(logic.comparePaths('/a/b', '/a/b') === 0);
});

test('tie-break: the grid columns and every merged view come out in path order', () => {
  for (const o of Object.values(PRESETS)) {
    const cols = logic.columns(P(o));
    assert.deepEqual(cols, logic.sortPaths(cols));
  }
  const s = mk({ '/z': F(1), '/a/b': F(1), '/a': D() });
  assert.deepEqual(Object.keys(logic.merged(s, 'A')), ['/a', '/a/b', '/z']);
});

test('tie-break: two commands on one path in one step apply in order; the later one wins', () => {
  const s = mk({ '/f': F(KB) });
  logic.applyAll(s, [{ c: 'A', op: 'chmod', path: '/f', mode: '600' }, { c: 'A', op: 'chmod', path: '/f', mode: '644' }]);
  assert.equal(upper(s, 'A')['/f'].mode, '644');
  const t = mk({ '/f': F(KB) });
  logic.applyAll(t, [{ c: 'A', op: 'rm', path: '/f' }, { c: 'A', op: 'create', path: '/f', bytes: 3 }]);
  assert.equal(upper(t, 'A')['/f'].kind, 'file', 'create after rm: the file wins over the whiteout');
  assert.equal(logic.merged(t, 'A')['/f'].size, 3);
});

// ── rules ──

test('rule 1: lookup goes top-down, upper first, then the topmost image layer; the first hit wins', () => {
  const s = mk({ '/f': F(1) }, { '/f': F(2) });
  let r = logic.lookup(s, 'A', '/f');
  assert.deepEqual(r.visited, ['upper:A', 'L2']);
  assert.equal(r.hit, 'L2');
  assert.equal(r.entry.size, 2);
  upper(s, 'A')['/f'] = F(3);
  r = logic.lookup(s, 'A', '/f');
  assert.deepEqual(r.visited, ['upper:A']);
  assert.equal(r.hit, 'upper:A');
  r = logic.lookup(s, 'A', '/none');
  assert.deepEqual(r.visited, ['upper:A', 'L2', 'L1']);
  assert.equal(r.hit, null);
});

test('rule 2: directories in several layers merge; a non-directory above hides the name and what is under it', () => {
  const s = mk({ '/app': D(), '/app/a': F(1), '/app/b': F(1) }, { '/app': D(), '/app/c': F(1) });
  assert.deepEqual(logic.list(s, 'A', '/app').map((e) => [e.path, e.from]), [['/app/a', 'L1'], ['/app/b', 'L1'], ['/app/c', 'L2']]);
  const t = mk({ '/x': D(), '/x/y': F(1) }, { '/x': F(5) });
  assert.equal(logic.merged(t, 'A')['/x'].kind, 'file');
  assert.equal(logic.lookup(t, 'A', '/x/y').hit, null, 'the file /x in L2 hides L1\'s directory /x and its entry');
  const g = mk({ '/var': D(), '/var/cache': D(), '/var/cache/dnf': D(), '/var/cache/dnf/metadata': F(1) }, { '/var/cache': { size: 0, kind: 'whiteout' } });
  assert.equal(logic.lookup(g, 'A', '/var/cache/dnf/metadata').stop, 'whiteout', 'a whiteout two levels up hides it');
  assert.deepEqual(Object.keys(logic.merged(g, 'A')), ['/var']);
});

test('rule 3: a read is served from the layer that holds the file; nothing is copied', () => {
  const s = mk({ '/f': F(3 * KB) });
  const out = logic.apply(s, { c: 'A', op: 'read', path: '/f' });
  assert.equal(out.result.what, 'read');
  assert.equal(out.result.from, 'L1');
  assert.deepEqual(upper(s, 'A'), {});
  assert.deepEqual(out.changed, []);
});

test('rule 4: the first write copies the whole file up; a metadata change does too; the next write copies nothing', () => {
  const s = mk({ '/big': F(200 * MB), '/m': F(KB) });
  let out = logic.apply(s, { c: 'A', op: 'append', path: '/big', bytes: 9 });
  assert.equal(out.result.what, 'copyup');
  assert.equal(out.result.copied, 200 * MB);
  assert.equal(upper(s, 'A')['/big'].size, 200 * MB + 9, 'per file, not per block');
  assert.equal(upper(s, 'A')['/big'].copied, true);
  assert.equal(layer(s, 'L1')['/big'].size, 200 * MB, 'the lower file is untouched');
  out = logic.apply(s, { c: 'A', op: 'append', path: '/big', bytes: 9 });
  assert.equal(out.result.what, 'write');
  assert.equal(logic.upperBytes(s, 'A'), 200 * MB + 18);
  out = logic.apply(s, { c: 'A', op: 'chmod', path: '/m', mode: '640' });
  assert.equal(out.result.what, 'copyup');
  assert.equal(upper(s, 'A')['/m'].size, KB, 'chmod copies the whole file');
  assert.equal(layer(s, 'L1')['/m'].mode, undefined);
  const t = mk({ '/app': D(), '/app/a': F(1) });
  logic.apply(t, { c: 'A', op: 'chmod', path: '/app', mode: '700' });
  assert.equal(upper(t, 'A')['/app'].kind, 'dir', 'a directory is copied up as a directory');
  assert.equal(logic.lookup(t, 'A', '/app/a').hit, 'L1', 'its entries stay visible');
});

test('rule 5: deleting a lower name leaves a whiteout in upper; the merged view hides it; the layer keeps it', () => {
  const s = mk({ '/usr/bin/vi': F(MB), '/usr/bin/ls': F(KB) });
  const out = logic.apply(s, { c: 'A', op: 'rm', path: '/usr/bin/vi' });
  assert.equal(out.result.what, 'whiteout');
  assert.deepEqual(upper(s, 'A')['/usr/bin/vi'], { size: 0, kind: 'whiteout' });
  assert.equal(logic.merged(s, 'A')['/usr/bin/vi'], undefined);
  assert.equal(layer(s, 'L1')['/usr/bin/vi'].size, MB);
  const r = logic.lookup(s, 'A', '/usr/bin/vi');
  assert.equal(r.stop, 'whiteout');
  assert.deepEqual(r.visited, ['upper:A'], 'the lookup stops at the whiteout');
  // a copied-up version is dropped and the whiteout takes its place
  const t = mk({ '/f': F(10) });
  logic.apply(t, { c: 'A', op: 'append', path: '/f', bytes: 1 });
  const o2 = logic.apply(t, { c: 'A', op: 'rm', path: '/f' });
  assert.equal(o2.result.dropped, 11);
  assert.deepEqual(upper(t, 'A')['/f'], { size: 0, kind: 'whiteout' }, 'the whiteout takes no data');
  assert.equal(logic.upperBytes(t, 'A'), 0);
});

test('rule 6: deleting an upper-only name removes it, with no whiteout', () => {
  const s = mk({ '/etc/os-release': F(KB) });
  logic.apply(s, { c: 'A', op: 'create', path: '/tmp/new.txt', bytes: 3 });
  const out = logic.apply(s, { c: 'A', op: 'rm', path: '/tmp/new.txt' });
  assert.equal(out.result.what, 'removed');
  assert.deepEqual(out.changed, [{ row: 'upper:A', path: '/tmp/new.txt' }]);
  assert.deepEqual(upper(s, 'A'), {});
  assert.equal(logic.lookup(s, 'A', '/tmp/new.txt').stop, null);
});

test('rule 7 (rm -rf): the upper entries under the directory go, one whiteout stays, 0 B', () => {
  const s = mk({ '/app': D(), '/app/a': F(5) });
  logic.apply(s, { c: 'A', op: 'append', path: '/app/a', bytes: 1 });
  logic.apply(s, { c: 'A', op: 'create', path: '/app/new', bytes: 7 });
  const out = logic.apply(s, { c: 'A', op: 'rmrf', path: '/app' });
  assert.equal(out.result.dropped, 13);
  assert.deepEqual(upper(s, 'A'), { '/app': { size: 0, kind: 'whiteout' } });
  assert.equal(logic.upperBytes(s, 'A'), 0);
});

test('rule 7: rm -rf of a lower directory then mkdir makes an opaque directory that hides the lower entries', () => {
  const s = mk({ '/app': D(), '/app/a': F(1) }, { '/app': D(), '/app/b': F(1) });
  logic.apply(s, { c: 'A', op: 'rmrf', path: '/app' });
  assert.equal(upper(s, 'A')['/app'].kind, 'whiteout');
  assert.deepEqual(Object.keys(logic.merged(s, 'A')), []);
  const out = logic.apply(s, { c: 'A', op: 'mkdir', path: '/app' });
  assert.equal(out.result.what, 'opaque');
  assert.equal(upper(s, 'A')['/app'].kind, 'opaque');
  assert.deepEqual(Object.keys(logic.merged(s, 'A')), ['/app']);
  assert.deepEqual(logic.list(s, 'A', '/app'), []);
  assert.equal(logic.lookup(s, 'A', '/app/b').stop, 'opaque');
  assert.equal(Object.keys(layer(s, 'L1')).length + Object.keys(layer(s, 'L2')).length, 4, 'the lower layers keep everything');
  // the opaque directory hides only what is below it: a file created in it is listed
  logic.apply(s, { c: 'A', op: 'create', path: '/app/b', bytes: 2 });
  assert.deepEqual(logic.list(s, 'A', '/app').map((e) => [e.path, e.from]), [['/app/b', 'upper:A']]);
  // deleting it leaves no whiteout: the lower /app/b is already hidden by the opaque directory
  assert.equal(logic.apply(s, { c: 'A', op: 'rm', path: '/app/b' }).result.what, 'removed');
  assert.equal(upper(s, 'A')['/app/b'], undefined);
  // an opaque directory two levels up stops the lookup too
  const g = mk({ '/a': D(), '/a/b': D(), '/a/b/c': F(1) }, null, { '/a': { size: 0, kind: 'opaque' } });
  assert.equal(logic.lookup(g, 'A', '/a/b/c').stop, 'opaque');
  // mkdir over a name the stack already shows changes nothing
  const e = mk({ '/app': D() });
  assert.equal(logic.apply(e, { c: 'A', op: 'mkdir', path: '/app' }).result.what, 'exists');
  assert.deepEqual(upper(e, 'A'), {});
  // mkdir with nothing below is a plain directory
  const t = mk({});
  assert.equal(logic.apply(t, { c: 'A', op: 'mkdir', path: '/new' }).result.what, 'mkdir');
  assert.equal(upper(t, 'A')['/new'].kind, 'dir');
});

test('rule 8: two containers share the lower layers; a change in one is invisible in the other', () => {
  for (const c of ['A', 'B']) {
    const p = P({ scene: 'two-containers', container: c });
    const o = c === 'A' ? 'B' : 'A';
    const s5 = at(p, 5);
    assert.equal(s5.cmd.c, o);
    assert.equal(s5.result.from, 'L2', `${o} still reads the image's original`);
    assert.equal(s5.bytesUpper[c], KB + 9);
    assert.equal(s5.bytesUpper[o], 0);
    const s6 = at(p, 6);
    assert.equal(upper(s6, o)['/var/www/html/index.html'].size, KB + 9, `${o} copies up its own`);
    assert.equal(logic.merged(s6, c)['/var/www/html/index.html'].from, 'upper:' + c);
    for (const s of all(p)) assert.equal(layer(s, 'L2')['/var/www/html/index.html'].size, KB, 'L2 is never written');
  }
});

test('rule 9: each RUN is saved as a new read-only layer; a later rm adds a whiteout-only layer; the image does not shrink', () => {
  const p = P({ scene: 'build-rm' });
  const fr = all(p);
  assert.deepEqual(fr.map((s) => s.layers.map((l) => l.id).join(',')), ['L1', 'L1', 'L1,L2', 'L1,L2', 'L1,L2,L3', 'L1,L2,L3']);
  assert.equal(fr[1].bytesUpper.build, 150 * MB);
  assert.equal(fr[2].imageBytes, 151 * MB + KB);
  assert.deepEqual(layer(fr[4], 'L3'), { '/var/cache/dnf': { size: 0, kind: 'whiteout' } }, 'whiteouts only');
  assert.equal(fr[4].imageBytes, 151 * MB + KB, 'not less');
  assert.ok(fr[4].layers.every((l) => l.ro));
  assert.deepEqual(fr[2].containers, [], 'the build container is gone once its upper is saved');
  assert.deepEqual(fr[2].changed.map((x) => x.row + ' ' + x.path), ['L2 /usr/bin/gcc', 'L2 /usr/libexec/gcc/cc1', 'L2 /var/cache/dnf', 'L2 /var/cache/dnf/metadata']);
  assert.deepEqual(fr[4].changed.map((x) => x.row + ' ' + x.path), ['L3 /var/cache/dnf']);
  assert.equal(fr[5].result.what, 'missing', 'ls of a whited-out directory: no such file');
  assert.equal(fr[5].result.stop, 'whiteout');
  assert.equal(logic.lookup(fr[5], 'A', '/var/cache/dnf/metadata').stop, 'whiteout', 'the entries under it are hidden too');
  assert.equal(logic.seenBytes(fr[5], 'A'), 101 * MB + KB);
});

// ── the presets' numbers (SPEC.md) ──

test('step counts per preset: 5, 4, 6, 6, 5, 4', () => {
  assert.deepEqual(Object.values(PRESETS).map((o) => steps(P(o))), [5, 4, 6, 6, 5, 4]);
  assert.equal(steps(P({})), 5, 'the default is edit-config');
});

test('edit-config: upper 0 → 3082 → 3082 → 3095 → 4119 B; L1 unchanged', () => {
  const fr = all(P({ scene: 'edit-config' }));
  assert.deepEqual(fr.map((s) => s.bytesUpper.A), [0, 0, 3082, 3082, 3095, 4119]);
  assert.deepEqual(fr.map((s) => s.result && s.result.what), [null, 'read', 'copyup', 'read', 'write', 'copyup']);
  assert.equal(fr[3].result.from, 'upper:A', 'the second cat reads upper\'s version');
  for (const s of fr) assert.equal(logic.sumFiles(layer(s, 'L1')), 4 * KB);
});

test('big-file: appending one line puts 200 MB in upper; rm drops the copy and leaves a whiteout', () => {
  const fr = all(P({ scene: 'big-file' }));
  assert.deepEqual(fr.map((s) => s.bytesUpper.A), [0, 0, 200 * MB + 9, 200 * MB + 18, 0]);
  assert.equal(fr[4].result.what, 'whiteout');
  for (const s of fr) assert.equal(s.imageBytes, 205 * MB + KB);
});

test('delete: whiteout for vi, plain removal for new.txt, ls hides vi; L1 keeps its three cells', () => {
  const fr = all(P({ scene: 'delete' }));
  assert.deepEqual(fr.map((s) => s.result && s.result.what), [null, 'new', 'whiteout', 'missing', 'removed', 'missing', 'list']);
  assert.equal(fr[3].result.stop, 'whiteout');
  assert.equal(fr[5].result.stop, null);
  assert.deepEqual(fr[5].lookup.visited, ['upper:A', 'L1']);
  assert.deepEqual(fr[6].result.entries.map((e) => e.path), ['/usr/bin/ls']);
  assert.deepEqual(Object.keys(upper(fr[6], 'A')), ['/usr/bin/vi']);
  for (const s of fr) assert.equal(Object.keys(layer(s, 'L1')).length, 3);
});

test('opaque: ls lists 3 from two layers; after rm -rf and mkdir, ls lists 0', () => {
  const fr = all(P({ scene: 'opaque' }));
  assert.equal(fr[1].result.entries.length, 3);
  assert.equal(upper(fr[2], 'A')['/app'].kind, 'whiteout');
  assert.equal(upper(fr[3], 'A')['/app'].kind, 'opaque');
  assert.equal(fr[4].result.entries.length, 0);
});

test('changed marks: the copied-up cell and the merged cell that changed; rm marks the name that vanished', () => {
  const s2 = at(P({}), 2);
  assert.deepEqual(s2.changed, [{ row: 'upper:A', path: '/etc/web/server.conf' }, { row: 'merged:A', path: '/etc/web/server.conf' }]);
  const d2 = at(P({ scene: 'delete' }), 2);
  assert.deepEqual(d2.gone, [{ row: 'merged:A', path: '/usr/bin/vi', kind: 'file' }]);
  const b1 = at(P({ scene: 'build-rm' }), 1);
  assert.equal(b1.changed.filter((x) => x.row === 'merged:build').length, 4, 'a new container: compared with the image alone');
  const b5 = at(P({ scene: 'build-rm' }), 5);
  assert.deepEqual(b5.changed, [], 'a fresh container on the image sees the image: nothing changed');
  const s4 = at(P({}), 4);
  assert.deepEqual(s4.changed, [{ row: 'upper:A', path: '/etc/web/server.conf' }, { row: 'merged:A', path: '/etc/web/server.conf' }], 'a size change marks the merged cell');
  const d3 = at(P({ scene: 'delete' }), 3);
  assert.deepEqual(d3.changed, [], 'a read changes nothing');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const o of Object.values(PRESETS).concat([{ scene: 'two-containers', container: 'B' }])) {
    const p = P(o);
    for (let n = 0; n <= steps(p); n++) {
      const s = at(p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const o of Object.values(PRESETS)) {
    const p = P(o);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input, and states handed out are copies', () => {
  const p = P({ scene: 'big-file' });
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
  const s2 = at(p, 2);
  s2.containers[0].upper['/var/log/app.log'].size = 1;
  assert.equal(at(p, 2).containers[0].upper['/var/log/app.log'].size, 200 * MB + 9);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, steps(P({})), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
  for (const id of Object.keys(PRESETS)) assert.ok(html.includes(`id: '${id}'`), `preset ${id} in the page`);
});
