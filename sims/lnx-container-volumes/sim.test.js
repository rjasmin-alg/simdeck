// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-container-volumes. Run: node --test sims/lnx-container-volumes/
// Tie-breaks first, then one test per rule (SPEC.md), the presets' numbers, the helpers copied from
// lnx-overlayfs-layers, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const L = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, L.defaults, over);
const frames = (over) => L.frames(P(over));
const last = (over) => { const fr = frames(over); return fr[fr.length - 1]; };

const DB = { name: 'db', files: { '/etc/db.conf': { kind: 'file', text: 'c' }, '/data/schema.sql': { kind: 'file', text: 's' } }, declaredVolumes: [] };
/** A fresh state over an image, with commands applied one by one (each a step). */
function run(image, cmds, hostDirs) {
  let s = L.fresh(P());
  s.image = structuredClone(image);
  s.hostDirs = structuredClone(hostDirs || {});
  s = L.finish(s, null);
  const out = [];
  for (const cmd of cmds) { s = L.step1(structuredClone(s), cmd); out.push(s); }
  return out;
}
const db = (s) => L.containerOf(s, 'db');
const sees = (s) => L.merged(s, L.current(s));
const vol = (s, name) => L.volumeOf(s, name);

// ── tie-breaks ──

test('rule 10: two mounts on one target are refused at run, and no container is made', () => {
  const [s] = run(DB, [{ op: 'run', name: 'db', volumes: [{ source: 'a', target: '/data' }, { source: 'b', target: '/data' }] }]);
  assert.equal(s.result.what, 'refused');
  assert.equal(s.result.why, 'duplicate');
  assert.equal(s.result.target, '/data');
  assert.equal(s.containers.length, 0);
  assert.equal(s.volumes.length, 0);
});

test('rule 1 tie-break: the deepest mount target wins; a sibling path stays in the outer mount', () => {
  const [, s] = run(DB, [
    { op: 'run', name: 'db', volumes: [{ source: 'outer', target: '/data' }, { source: 'inner', target: '/data/sub' }] },
    { op: 'write', c: 'db', path: '/data/sub/f', text: 'x' }
  ]);
  assert.equal(s.result.store, 'vol:inner');
  assert.deepEqual(Object.keys(vol(s, 'inner').files), ['/f']);
  assert.ok(!vol(s, 'outer').files['/sub/f']);
  // order of the -v flags does not matter
  const [, t] = run(DB, [
    { op: 'run', name: 'db', volumes: [{ source: 'inner', target: '/data/sub' }, { source: 'outer', target: '/data' }] },
    { op: 'write', c: 'db', path: '/data/subway', text: 'x' }
  ]);
  assert.equal(t.result.store, 'vol:outer', '/data/subway is not under /data/sub');
  assert.equal(L.resolve(db(t), '/data/sub/f').store, 'vol:inner');
});

test('rule 6 tie-break: a -v on the image\'s VOLUME path replaces the anonymous volume', () => {
  const img = Object.assign({}, DB, { declaredVolumes: ['/data'] });
  const [s] = run(img, [{ op: 'run', name: 'db', volumes: [{ source: 'dbdata', target: '/data' }] }]);
  assert.deepEqual(s.volumes.map((v) => v.name), ['dbdata']);
  assert.equal(db(s).mounts.length, 1);
});

test('rule 7 tie-break: a volume that is not empty is not filled again', () => {
  const [, , , , s] = run(DB, [
    { op: 'run', name: 'db', volumes: [{ source: 'dbdata', target: '/data' }] },
    { op: 'write', c: 'db', path: '/data/schema.sql', text: 'changed' },
    { op: 'stop', c: 'db' }, { op: 'rm', c: 'db' },
    { op: 'run', name: 'db', volumes: [{ source: 'dbdata', target: '/data' }] }
  ]);
  assert.deepEqual(s.result.populated, []);
  assert.equal(vol(s, 'dbdata').files['/schema.sql'].text, 'changed');
});

// ── rules ──

test('rule 1: a write outside every mount goes to the container\'s writable layer', () => {
  const [, s] = run(DB, [{ op: 'run', name: 'db' }, { op: 'write', c: 'db', path: '/data/rows.db', text: 'r' }]);
  assert.equal(s.result.store, 'layer:' + db(s).id);
  assert.deepEqual(Object.keys(db(s).upper), ['/data/rows.db']);
  assert.equal(sees(s)['/data/rows.db'].from, 'layer:' + db(s).id);
});

test('rule 1: a write under a mount target goes to the mount\'s source, not the layer', () => {
  const [, s] = run(DB, [{ op: 'run', name: 'db', volumes: [{ source: 'dbdata', target: '/data' }] }, { op: 'write', c: 'db', path: '/data/rows.db', text: 'r' }]);
  assert.equal(s.result.store, 'vol:dbdata');
  assert.equal(s.result.rel, '/rows.db');
  assert.deepEqual(db(s).upper, {});
  assert.equal(vol(s, 'dbdata').files['/rows.db'].text, 'r');
});

test('rule 2: stop keeps the container and its layer; start sees the same data', () => {
  const fr = frames({ scene: 'layer-lost' });
  assert.equal(fr[3].cmd.op, 'stop');
  assert.equal(db(fr[3]).running, false);
  assert.equal(db(fr[3]).alive, true);
  assert.deepEqual(Object.keys(db(fr[3]).upper), ['/data/rows.db']);
  assert.equal(fr[4].cmd.op, 'start');
  assert.equal(db(fr[4]).id, db(fr[2]).id);
  assert.equal(sees(fr[4])['/data/rows.db'].text, 'row 1');
});

test('rule 3: rm deletes the container and its layer; named volumes and host directories stay', () => {
  const fr = frames({ scene: 'layer-lost' });
  assert.equal(fr[5].cmd.op, 'rm');
  assert.equal(L.current(fr[5]), null);
  assert.deepEqual(fr[5].lost.map((x) => x.row + ' ' + x.path), ['layer:3f2a /data/rows.db']);
  const named = frames({ scene: 'named-survives' });
  assert.equal(named[4].cmd.op, 'rm');
  assert.deepEqual(named[4].result.kept, ['dbdata']);
  assert.deepEqual(Object.keys(vol(named[4], 'dbdata').files).sort(), ['/rows.db', '/schema.sql']);
  const bind = frames({ scene: 'bind-hides' });
  assert.equal(bind[6].cmd.op, 'rm');
  assert.equal(bind[6].hostDirs['/srv/site']['/index.html'].text, 'hi\nbye');
});

test('rule 3: rm refuses a running container; -f stops it first', () => {
  const [, s] = run(DB, [{ op: 'run', name: 'db' }, { op: 'rm', c: 'db' }]);
  assert.equal(s.result.what, 'refused');
  assert.equal(s.result.why, 'running');
  assert.ok(db(s));
  const [, t] = run(DB, [{ op: 'run', name: 'db' }, { op: 'rm', c: 'db', force: true }]);
  assert.equal(t.result.what, 'removed');
});

test('rule 3: rm without -v keeps an anonymous volume, orphaned', () => {
  const fr = frames({ scene: 'anon-orphan' });
  assert.equal(fr[4].cmd.op, 'rm');
  assert.deepEqual(fr[4].result.kept, ['a91c3e']);
  assert.deepEqual(vol(fr[4], 'a91c3e').usedBy, []);
  assert.deepEqual(fr[4].lost, []);
});

test('rule 4: rm -v also removes the anonymous volumes; named ones stay', () => {
  const s = last({ scene: 'rm-flags', rmV: true });
  assert.equal(s.cmd.op, 'rm');
  assert.deepEqual(s.result.gone, ['a91c3e']);
  assert.deepEqual(s.result.kept, ['dblogs']);
  assert.deepEqual(s.volumes.map((v) => v.name), ['dblogs']);
  assert.deepEqual(s.lost.map((x) => x.row + ' ' + x.path), ['vol:a91c3e /data/rows.db', 'vol:a91c3e /data/schema.sql']);
  const t = last({ scene: 'rm-flags', rmV: false });
  assert.deepEqual(t.volumes.map((v) => v.name), ['dblogs', 'a91c3e']);
});

test('rule 5: a run --rm container is removed with its anonymous volumes when it exits; named ones stay', () => {
  const img = Object.assign({}, DB, { declaredVolumes: ['/data'] });
  const [s, x] = run(img, [{ op: 'run', name: 'db', rm: true, volumes: [{ source: 'logs', target: '/var/log/db' }] }, { op: 'exit', c: 'db' }]);
  assert.deepEqual(s.volumes.map((v) => v.name), ['logs', 'a91c3e']);
  assert.equal(x.result.what, 'removed');
  assert.equal(x.result.auto, true);
  assert.deepEqual(x.volumes.map((v) => v.name), ['logs']);
  assert.equal(L.current(x), null);
  // without --rm the exit only stops it
  const [, y] = run(img, [{ op: 'run', name: 'db' }, { op: 'exit', c: 'db' }]);
  assert.equal(y.result.what, 'exited');
  assert.equal(db(y).running, false);
  assert.equal(y.volumes.length, 1);
});

test('rule 6: an image VOLUME gives every new run a new anonymous volume; the old one stays orphaned', () => {
  const fr = frames({ scene: 'anon-orphan' });
  assert.deepEqual(fr[1].result.made, ['a91c3e']);
  assert.deepEqual(fr[5].result.made, ['7d20b5']);
  assert.deepEqual(fr[6].result.entries, ['/data/schema.sql'], 'the new container sees no rows.db');
  assert.deepEqual(fr[7].result.list.map((v) => [v.name, v.anon, v.users.length]), [['a91c3e', true, 0], ['7d20b5', true, 1]]);
  assert.ok(vol(fr[7], 'a91c3e').files['/rows.db'], 'the first one holds the data');
});

test('rule 7: an empty volume is filled with the image\'s files at the target, unless nocopy', () => {
  const fr = frames({ scene: 'named-survives' });
  assert.deepEqual(fr[1].result.populated, ['/data/schema.sql']);
  assert.deepEqual(fr[1].changed.filter((x) => x.row === 'vol:dbdata').map((x) => x.path), ['/data/schema.sql']);
  assert.equal(sees(fr[1])['/data/schema.sql'].from, 'vol:dbdata');
  const [s] = run(DB, [{ op: 'run', name: 'db', volumes: [{ source: 'dbdata', target: '/data', nocopy: true }] }]);
  assert.deepEqual(vol(s, 'dbdata').files, {});
  assert.ok(!sees(s)['/data/schema.sql'], 'the empty volume hides the image\'s file');
});

test('rule 7: a bind mount is never filled and hides the image\'s files at the target', () => {
  const fr = frames({ scene: 'bind-hides' });
  assert.deepEqual(fr[1].hostDirs['/srv/site'], {});
  assert.ok(!sees(fr[1])['/var/www/html/index.html']);
  assert.deepEqual(fr[1].gone, ['/var/www/html/index.html']);
  assert.ok(fr[1].image.files['/var/www/html/index.html'], 'hidden, not deleted');
  assert.deepEqual(fr[2].result.entries, []);
});

test('rule 8: a bind mount shows changes at once in both directions', () => {
  const fr = frames({ scene: 'bind-hides' });
  assert.equal(fr[3].cmd.op, 'host-write');
  assert.equal(sees(fr[3])['/var/www/html/index.html'].text, 'hi');
  assert.ok(fr[3].changed.some((x) => x.row === 'sees' && x.path === '/var/www/html/index.html'));
  assert.equal(fr[4].cmd.op, 'write');
  assert.equal(fr[4].hostDirs['/srv/site']['/index.html'].text, 'hi\nbye');
});

test('rule 9: volume prune removes the volumes no container uses, running or stopped', () => {
  const s = last({ scene: 'anon-orphan' });
  assert.deepEqual(s.result.gone, ['a91c3e']);
  assert.deepEqual(s.volumes.map((v) => v.name), ['7d20b5']);
  assert.deepEqual(s.lost.map((x) => x.path), ['/data/rows.db', '/data/schema.sql']);
  // a stopped container still uses its volume
  const [, , x] = run(DB, [{ op: 'run', name: 'db', volumes: [{ source: 'dbdata', target: '/data' }] }, { op: 'stop', c: 'db' }, { op: 'prune' }]);
  assert.deepEqual(x.result.gone, []);
  assert.deepEqual(x.volumes.map((v) => v.name), ['dbdata']);
});

test('rule 9: prune keeps an anonymous volume of a stopped container, and deletes an unused named one', () => {
  const img = Object.assign({}, DB, { declaredVolumes: ['/data'] });
  const [, , x] = run(img, [{ op: 'run', name: 'db' }, { op: 'stop', c: 'db' }, { op: 'prune' }]);
  assert.deepEqual(x.result.gone, []);
  assert.deepEqual(x.volumes.map((v) => v.name), ['a91c3e']);
  const [, , , y] = run(DB, [{ op: 'run', name: 'db', volumes: [{ source: 'dbdata', target: '/data' }] }, { op: 'stop', c: 'db' }, { op: 'rm', c: 'db' }, { op: 'prune' }]);
  assert.deepEqual(y.result.gone, ['dbdata']);
});

test('rule 4: rm -v keeps an anonymous volume another alive container still uses', () => {
  const s = run(DB, [{ op: 'run', name: 'db', volumes: [{ target: '/data' }] }])[0];
  // a second container mounting the same anonymous volume by its name
  const [, , t] = run(DB, [
    { op: 'run', name: 'db', volumes: [{ target: '/data' }] },
    { op: 'run', name: 'db2', volumes: [{ source: s.volumes[0].name, target: '/data' }] },
    { op: 'rm', c: 'db', v: true, force: true }
  ]);
  assert.deepEqual(t.result.gone, []);
  assert.deepEqual(t.volumes.map((v) => v.name), ['a91c3e']);
});

test('a run with the name of an alive container is refused, running or stopped; a removed name is free', () => {
  const [, s] = run(DB, [{ op: 'run', name: 'db' }, { op: 'run', name: 'db' }]);
  assert.equal(s.result.why, 'name');
  const [, , t] = run(DB, [{ op: 'run', name: 'db' }, { op: 'stop', c: 'db' }, { op: 'run', name: 'db' }]);
  assert.equal(t.result.why, 'name');
  assert.equal(t.containers.length, 1);
  const [, , u] = run(DB, [{ op: 'run', name: 'db' }, { op: 'rm', c: 'db', force: true }, { op: 'run', name: 'db' }]);
  assert.equal(u.result.what, 'created');
});

test('rule 1 tie-break in the view: a nested mount shows over the outer one, whatever the -v order', () => {
  const img = { name: 'x', files: { '/data/sub/a': { kind: 'file', text: 'img' } }, declaredVolumes: [] };
  for (const order of [['outer', 'inner'], ['inner', 'outer']]) {
    const vols = order.map((n) => ({ source: n, target: n === 'inner' ? '/data/sub' : '/data' }));
    const [s] = run(img, [{ op: 'run', name: 'db', volumes: vols }]);
    assert.equal(sees(s)['/data/sub/a'].from, 'vol:inner', order.join(','));
    assert.deepEqual(Object.keys(vol(s, 'outer').files), ['/sub/a'], 'outer was filled from the image too');
  }
});

test('rule 7: populate takes only files under the target, not a sibling with the same prefix', () => {
  const img = { name: 'x', files: { '/data/a': { kind: 'file', text: 'a' }, '/database/b': { kind: 'file', text: 'b' } }, declaredVolumes: [] };
  const [s] = run(img, [{ op: 'run', name: 'db', volumes: [{ source: 'v', target: '/data' }] }]);
  assert.deepEqual(Object.keys(vol(s, 'v').files), ['/a']);
});

test('rule 7: a volume that already exists but is empty is filled on its next mount', () => {
  const [, , s] = run(DB, [
    { op: 'run', name: 'db', volumes: [{ source: 'dbdata', target: '/data', nocopy: true }] },
    { op: 'rm', c: 'db', force: true },
    { op: 'run', name: 'db', volumes: [{ source: 'dbdata', target: '/data' }] }
  ]);
  assert.deepEqual(s.result.made, []);
  assert.deepEqual(s.result.populated, ['/data/schema.sql']);
});

test('rule 8: a host write marks the host directory\'s cell; a host append keeps the old text', () => {
  const fr = frames({ scene: 'bind-hides' });
  assert.ok(fr[3].changed.some((x) => x.row === 'bind:/srv/site' && x.path === '/var/www/html/index.html'));
  assert.equal(fr[3].result.isNew, true);
  assert.equal(fr[4].result.isNew, false, 'the inside append changes the host file');
  const [, s] = run(DB, [{ op: 'run', name: 'db', volumes: [{ source: '/srv/db', target: '/data' }] }, { op: 'host-write', path: '/srv/db/x', text: 'a' }], { '/srv/db': { '/x': { kind: 'file', text: 'old' } } });
  assert.equal(s.hostDirs['/srv/db']['/x'].text, 'a');
  const [, t] = run(DB, [{ op: 'run', name: 'db', volumes: [{ source: '/srv/db', target: '/data' }] }, { op: 'host-write', path: '/srv/db/x', text: 'a', append: true }], { '/srv/db': { '/x': { kind: 'file', text: 'old' } } });
  assert.equal(t.hostDirs['/srv/db']['/x'].text, 'old\na');
});

test('rule 3: rm -f of a stopped container removes it too', () => {
  const [, , s] = run(DB, [{ op: 'run', name: 'db' }, { op: 'stop', c: 'db' }, { op: 'rm', c: 'db', force: true }]);
  assert.equal(s.result.what, 'removed');
});

test('a write in a stopped container is refused', () => {
  const [, , s] = run(DB, [{ op: 'run', name: 'db' }, { op: 'stop', c: 'db' }, { op: 'write', c: 'db', path: '/data/x', text: 'x' }]);
  assert.equal(s.result.what, 'refused');
  assert.deepEqual(db(s).upper, {});
});

// ── presets: the numbers in SPEC.md ──

test('step counts per preset: 7, 6, 8, 6, 4 (the same for every kind and rm -v)', () => {
  const want = { 'layer-lost': 7, 'named-survives': 6, 'anon-orphan': 8, 'bind-hides': 6, 'rm-flags': 4 };
  for (const id of L.SCENE_IDS) {
    for (const rmV of [false, true]) assert.equal(L.steps(P({ scene: id, rmV })), want[id], id);
  }
  for (const kind of Object.keys(L.KIND)) assert.equal(L.steps(P({ kind })), 7, kind);
});

test('layer-lost per kind: where rows.db is after rm and run again', () => {
  const after = (kind, rmV) => last({ kind, rmV }).result;
  assert.deepEqual(after('layer', false), { what: 'missing' });
  assert.deepEqual(after('named', false), { what: 'read', from: 'vol:dbdata', text: 'row 1' });
  assert.deepEqual(after('anon', false), { what: 'missing' }, 'a new anonymous volume');
  assert.equal(last({ kind: 'anon' }).volumes.length, 2);
  assert.equal(last({ kind: 'anon', rmV: true }).volumes.length, 1);
  assert.deepEqual(after('bind', false), { what: 'read', from: 'bind:/srv/db', text: 'row 1' });
  assert.ok(!sees(frames({ kind: 'bind' })[1])['/data/schema.sql'], 'the bind hides the image\'s schema.sql');
});

test('named-survives: the data is back, volume ls lists dbdata', () => {
  const fr = frames({ scene: 'named-survives' });
  assert.equal(sees(fr[5])['/data/rows.db'].text, 'row 1');
  assert.notEqual(L.current(fr[5]).id, db(fr[2]).id, 'a new container');
  assert.deepEqual(fr[6].result.list.map((v) => v.name), ['dbdata']);
});

test('the changed and lost marks of a step are its own', () => {
  const fr = frames({ scene: 'layer-lost' });
  assert.deepEqual(fr[3].changed, []);
  assert.deepEqual(fr[6].lost, []);
  assert.deepEqual(fr[2].changed.map((x) => x.row), ['layer:3f2a', 'sees']);
});

test('columns: every container path of the run, fixed and sorted', () => {
  assert.deepEqual(L.columns(P()), ['/data/rows.db', '/data/schema.sql', '/etc/db.conf']);
  assert.deepEqual(L.columns(P({ scene: 'rm-flags' })), ['/data/rows.db', '/data/schema.sql', '/etc/db.conf', '/var/log/db/db.log']);
});

// ── helpers copied from lnx-overlayfs-layers (their own tests, kept) ──

test('overlay helpers: paths sort component by component; the stack is read top-down', () => {
  assert.deepEqual(L.sortPaths(['/a-b/x', '/a/b', '/a']), ['/a', '/a/b', '/a-b/x']);
  const stack = [{ id: 'up', files: { '/x': { kind: 'file', text: 'u' } } }, { id: 'img', files: { '/x': { kind: 'file', text: 'i' }, '/y': { kind: 'file', text: 'y' } } }];
  assert.equal(L.lookupIn(stack, '/x').hit, 'up');
  assert.equal(L.lookupIn(stack, '/y').hit, 'img');
  assert.deepEqual(Object.keys(L.mergedIn(stack)), ['/x', '/y']);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (const id of L.SCENE_IDS) {
    const p = P({ scene: id });
    for (let n = 0; n <= L.steps(p); n++) {
      const s = kit.stateAt(L, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const id of L.SCENE_IDS) {
    const p = P({ scene: id, kind: 'anon' });
    const forward = [];
    let s = L.initial(p);
    forward.push(s);
    for (let n = 1; n <= L.steps(p); n++) { s = L.step(s, n, p); forward.push(s); }
    for (let n = L.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(L, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({ scene: 'anon-orphan' });
  const s0 = L.initial(p);
  const copy = structuredClone(s0);
  L.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, L.steps(L.defaults), 'meta.steps matches the model');
  const keys = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]));
  assert.ok(keys.length > 0, 'found preset params');
  for (const k of keys) assert.ok(k in L.defaults, `preset param ${k} is a model param`);
  const scenes = [...html.matchAll(/scene:\s*'([\w-]+)'/g)].map((m) => m[1]);
  for (const id of scenes) assert.ok(L.SCENE_IDS.includes(id), id);
});
