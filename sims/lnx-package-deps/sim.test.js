// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-package-deps. Run: node --test sims/lnx-package-deps/sim.test.js
// Rules and numbers: SPEC.md. Tie-breaks first, then one test per rule, then the presets' numbers, then the generic block.
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
const end = (over) => at(over, logic.steps(P(over)));
const pkg = (name, ver, provides, requires, conflicts) =>
  ({ name, ver, provides: [name].concat(provides || []), requires: requires || [], conflicts: conflicts || [] });
const cand = (p, repo, priority, installed) => ({ pkg: p, repo, priority, installed: !!installed });
const names = (list) => list.map((c) => c.pkg.name);

/** A custom scene: an install request over the given repos and installed set, run by the real step. */
function scene({ name, repos, installed = [], op = 'install' }) {
  const s = logic.initial(P({ request: op === 'install' ? 'install-htop' : 'remove-htop' }));
  s.request = { op, name };
  s.queue = [{ cap: name, by: null }];
  s.repos = repos.map((r) => ({ id: r.id, enabled: r.enabled !== false, priority: r.priority ?? 99, meta: r.meta || 'cached', pkgs: r.pkgs }));
  s.installed = installed;
  return s;
}
function run(s) {
  const out = [s];
  while (!s.done && out.length < 40) { s = logic.step(s, out.length, {}); out.push(s); }
  return out;
}

// ── rule 4, the tie-break, key by key ──

test('rule 4 (a): an installed candidate beats everything else', () => {
  const r = logic.rank([cand(pkg('z', '9'), 'epel', 1), cand(pkg('a', '1'), 'baseos', 99, true)], 'cap');
  assert.deepEqual(names(r), ['a', 'z']);
  assert.equal(logic.decidingKey(r, 'cap'), 'installed');
});

test('rule 4 (b): the lower priority value beats name match and version', () => {
  const r = logic.rank([cand(pkg('cap', '9.0'), 'epel', 99), cand(pkg('other', '1.0', ['cap']), 'baseos', 10)], 'cap');
  assert.deepEqual(names(r), ['other', 'cap']);
  assert.equal(logic.decidingKey(r, 'cap'), 'priority');
});

test('rule 4 (c): with equal priority, the name equal to the capability beats a higher version', () => {
  const r = logic.rank([cand(pkg('alt', '9.0', ['mail']), 'baseos', 99), cand(pkg('mail', '1.0'), 'epel', 99)], 'mail');
  assert.deepEqual(names(r), ['mail', 'alt']);
  assert.equal(logic.decidingKey(r, 'mail'), 'name');
});

test('rule 4 (d): then the highest version, compared segment by segment', () => {
  const r = logic.rank([cand(pkg('a', '2.9-1', ['x']), 'baseos', 99), cand(pkg('b', '2.10-1', ['x']), 'baseos', 99)], 'x');
  assert.deepEqual(names(r), ['b', 'a']);
  assert.equal(logic.decidingKey(r, 'x'), 'version');
});

test('rule 4 (e): then the alphabetically first name', () => {
  const r = logic.rank([cand(pkg('zeta', '1.0', ['x']), 'baseos', 99), cand(pkg('alpha', '1.0', ['x']), 'epel', 99)], 'x');
  assert.deepEqual(names(r), ['alpha', 'zeta']);
  assert.equal(logic.decidingKey(r, 'x'), 'alpha');
  assert.equal(logic.decidingKey(r.slice(0, 1), 'x'), null);
});

test('rule 4: rank does not reorder its input', () => {
  const list = [cand(pkg('b', '1', ['x']), 'baseos', 99), cand(pkg('a', '1', ['x']), 'baseos', 99)];
  logic.rank(list, 'x');
  assert.deepEqual(names(list), ['b', 'a']);
});

test('rule 4 (d): vercmp, rpm-style', () => {
  assert.equal(logic.vercmp('2.10', '2.9'), 1);
  assert.equal(logic.vercmp('2.9', '2.10'), -1);
  assert.equal(logic.vercmp('3.3.0-5.el10_0', '3.3.0-5.el10_0'), 0);
  assert.equal(logic.vercmp('1.0.1', '1.0'), 1);
  assert.equal(logic.vercmp('1.0a', '1.0'), 1);
  assert.equal(logic.vercmp('1.1', '1.a'), 1); // a number is newer than letters
  assert.equal(logic.vercmp('3.3b', '3.3a'), 1);
});

test('rule 4 in the resolver: the higher version provider is chosen and the key is recorded', () => {
  const s = scene({ name: 'app', repos: [{ id: 'baseos', pkgs: [pkg('app', '1', [], ['libx.so.1']), pkg('x-old', '1.0', ['libx.so.1']), pkg('x-new', '2.0', ['libx.so.1'])] }] });
  const st = run(s);
  assert.equal(st[2].last.pkg, 'x-new');
  assert.equal(st[2].last.key, 'version');
  assert.deepEqual(st[2].last.cands.map((c) => c.name), ['x-new', 'x-old']);
});

// ── rule 1: a requirement names a capability ──

test('rule 1: libhwloc.so.15 is satisfied by hwloc-libs, a package of another name', () => {
  const s = at({}, 2);
  assert.equal(s.last.cap, 'libhwloc.so.15');
  assert.equal(s.last.by, 'htop');
  assert.equal(s.last.pkg, 'hwloc-libs');
  assert.deepEqual(logic.providers(logic.REQUESTS['install-htop'].repos.baseos.map((n) => logic.PKGS[n]), 'libhwloc.so.15').map((p) => p.name), ['hwloc-libs']);
  // every package provides its own name, so the request is a capability too
  for (const n of Object.keys(logic.PKGS)) assert.ok(logic.PKGS[n].provides.includes(n), n);
});

// ── rule 2: already satisfied ──

test('rule 2: an installed provider satisfies the capability; nothing is added', () => {
  const s = at({ request: 'install-tmux' }, 2);
  assert.equal(s.last.kind, 'installed');
  assert.equal(s.last.pkg, 'libevent');
  assert.deepEqual(s.plan.map((r) => r.name), ['tmux']);
  assert.equal(at({ request: 'install-tmux' }, 3).last.pkg, 'ncurses-libs');
  // install htop while hwloc-libs is installed: only htop
  const k = end({ keepLibs: true });
  assert.deepEqual(k.plan.map((r) => r.name), ['htop']);
  assert.equal(k.resolved[1].kind, 'installed');
});

test('rule 2: a provider already in the plan satisfies it too', () => {
  const s = scene({ name: 'app', repos: [{ id: 'baseos', pkgs: [pkg('app', '1', [], ['liba', 'libb']), pkg('ab', '1', ['liba', 'libb'])] }] });
  const st = run(s);
  assert.equal(st[2].last.kind, 'chosen');
  assert.equal(st[3].last.kind, 'planned');
  assert.equal(st[3].last.pkg, 'ab');
  assert.equal(st[st.length - 1].plan.length, 2);
});

test('rule 2: an installed provider wins over a repository one even when that one is newer', () => {
  const s = scene({ name: 'app', repos: [{ id: 'baseos', pkgs: [pkg('app', '1', [], ['libx']), pkg('x', '9', ['libx'])] }], installed: [Object.assign(pkg('x', '1', ['libx']), { from: 'baseos', reason: 'dep' })] });
  const st = run(s);
  assert.equal(st[2].last.kind, 'installed');
  assert.deepEqual(st[st.length - 1].plan.map((r) => r.name), ['app']);
});

// ── rule 3: dependencies cross repositories ──

test('rule 3: htop from epel pulls hwloc-libs and ocl-icd from baseos', () => {
  const s = end({});
  assert.deepEqual(s.plan, [
    { name: 'htop', ver: '3.3.0-5.el10_0', repo: 'epel', section: 'install' },
    { name: 'hwloc-libs', ver: '2.11.1-4.el10', repo: 'baseos', section: 'dep' },
    { name: 'ocl-icd', ver: '2.3.2-8.el10', repo: 'baseos', section: 'dep' }
  ]);
});

// ── rule 5: conflicts and missing providers ──

test('rule 5: conflictsWith works in both directions, never with itself', () => {
  const a = pkg('mta-a', '1', ['mail'], [], ['mta-b']);
  const b = pkg('mta-b', '2', ['mail']);
  assert.equal(logic.conflictsWith(a, b), true);
  assert.equal(logic.conflictsWith(b, a), true);
  assert.equal(logic.conflictsWith(pkg('x', '1', ['c'], [], ['c']), pkg('x', '1', ['c'])), false);
  assert.equal(logic.conflictsWith(pkg('p', '1'), pkg('q', '1')), false);
});

test('rule 5: a conflicting candidate is rejected and the next one is chosen', () => {
  const s = scene({
    name: 'app',
    repos: [{ id: 'baseos', pkgs: [pkg('app', '1', [], ['mail']), pkg('mta-b', '2', ['mail'], [], ['mta-a']), pkg('mta-c', '1', ['mail'])] }],
    installed: [Object.assign(pkg('mta-a', '1', ['other']), { from: 'baseos', reason: 'user' })]
  });
  const st = run(s);
  assert.equal(st[2].last.kind, 'chosen');
  assert.equal(st[2].last.pkg, 'mta-c');
  assert.deepEqual(st[2].last.cands, [
    { name: 'mta-b', ver: '2', repo: 'baseos', rejected: 'mta-a' },
    { name: 'mta-c', ver: '1', repo: 'baseos', rejected: null }
  ]);
  assert.equal(st[st.length - 1].problem, null);
});

test('rule 5: a conflict with a planned package also rejects', () => {
  const s = scene({ name: 'app', repos: [{ id: 'baseos', pkgs: [pkg('app', '1', [], ['libx', 'liby']), pkg('x', '1', ['libx']), pkg('y', '1', ['liby'], [], ['x'])] }] });
  const st = run(s);
  const fin = st[st.length - 1];
  assert.equal(fin.problem.kind, 'conflict');
  assert.equal(fin.problem.pkg, 'y');
  assert.equal(fin.problem.with, 'x');
  assert.equal(fin.problem.withInstalled, false);
  assert.equal(fin.problem.withRepo, 'baseos');
  assert.equal(fin.problem.repo, 'baseos');
});

test('rule 5: the conflict preset stops at once and nothing changes', () => {
  const s1 = at({ request: 'install-mta-b' }, 1);
  assert.equal(s1.last.kind, 'conflict');
  assert.deepEqual(s1.problem, { kind: 'conflict', cap: 'mta-b', by: null, pkg: 'mta-b', ver: '2.0-1', repo: 'baseos', with: 'mta-a', withVer: '1.0-1', withInstalled: true, withRepo: '@System' });
  assert.deepEqual(s1.plan, []);
  const fin = end({ request: 'install-mta-b' });
  assert.equal(fin.done, true);
  assert.equal(fin.order, null);
  assert.deepEqual(fin.installed, at({ request: 'install-mta-b' }, 0).installed);
});

test('rule 5: no provider of the request is "no match"; of a dependency, "nothing provides"', () => {
  const s = at({ epel: false }, 1);
  assert.equal(s.problem.kind, 'nomatch');
  assert.equal(s.problem.cap, 'htop');
  const st = run(scene({ name: 'app', repos: [{ id: 'baseos', pkgs: [pkg('app', '1', [], ['libgone.so.1'])] }] }));
  const fin = st[st.length - 1];
  assert.equal(fin.problem.kind, 'nothing');
  assert.equal(fin.problem.cap, 'libgone.so.1');
  assert.equal(fin.problem.by, 'app');
  assert.equal(fin.order, null);
});

test('rule 5: a disabled repository offers no candidates', () => {
  const st = run(scene({ name: 'app', repos: [{ id: 'baseos', pkgs: [] }, { id: 'epel', enabled: false, pkgs: [pkg('app', '1')] }] }));
  assert.equal(st[1].problem.kind, 'nomatch');
});

// ── rule 6: install order ──

test('rule 6: a package goes in after what it requires; the book order', () => {
  assert.deepEqual(end({}).order, ['ocl-icd', 'hwloc-libs', 'htop']);
  assert.equal(at({}, 4).order, null);
  assert.deepEqual(at({}, 5).order, ['ocl-icd', 'hwloc-libs', 'htop']);
});

test('rule 6: equal depth keeps plan order', () => {
  const list = [pkg('top', '1', [], ['lb', 'la']), pkg('b', '1', ['lb']), pkg('a', '1', ['la'])];
  assert.deepEqual(logic.depthOrder(list), ['b', 'a', 'top']);
  assert.deepEqual(logic.depthOrder(list, true), ['top', 'b', 'a']);
  // a longer chain sinks deeper than a short one
  const chain = [pkg('top', '1', [], ['l1', 'l3']), pkg('m', '1', ['l1'], ['l2']), pkg('leaf', '1', ['l2']), pkg('side', '1', ['l3'])];
  assert.deepEqual(logic.depthOrder(chain), ['leaf', 'side', 'm', 'top']);
  // a cycle does not hang
  assert.equal(logic.depthOrder([pkg('x', '1', ['lx'], ['ly']), pkg('y', '1', ['ly'], ['lx'])]).length, 2);
});

// ── rule 7: remove and unused dependencies ──

test('rule 7: removing htop removes its unused dependencies, erase order reversed', () => {
  const s = end({ request: 'remove-htop' });
  assert.deepEqual(s.plan.map((r) => [r.name, r.repo, r.section]),
    [['htop', '@epel', 'remove'], ['hwloc-libs', '@baseos', 'unused'], ['ocl-icd', '@baseos', 'unused']]);
  assert.deepEqual(s.order, ['htop', 'hwloc-libs', 'ocl-icd']);
  assert.deepEqual(s.installed.map((p) => p.name), ['glibc', 'ncurses-libs', 'libevent']);
});

test('rule 7: a dependency still required by a package that stays is kept, and so are its own', () => {
  const s2 = at({ request: 'remove-htop', keepLibs: true }, 2);
  assert.equal(s2.last.kind, 'keptNeeded');
  assert.equal(s2.last.pkg, 'hwloc-libs');
  assert.equal(s2.last.needer, 'hwloc');
  assert.equal(s2.last.with, 'libhwloc.so.15');
  assert.deepEqual(s2.queue, []);
  const s = end({ request: 'remove-htop', keepLibs: true });
  assert.deepEqual(s.plan.map((r) => r.name), ['htop']);
  assert.ok(s.installed.some((p) => p.name === 'hwloc-libs'));
  assert.ok(s.installed.some((p) => p.name === 'ocl-icd'));
  assert.ok(!s.installed.some((p) => p.name === 'htop'));
});

test('rule 7: a package the user installed is kept even when nothing needs it', () => {
  const s = scene({ name: 'app', op: 'remove', repos: [{ id: 'baseos', pkgs: [] }], installed: [
    Object.assign(pkg('app', '1', [], ['liba', 'libb']), { from: 'baseos', reason: 'user' }),
    Object.assign(pkg('a', '1', ['liba']), { from: 'baseos', reason: 'user' }),
    Object.assign(pkg('b', '1', ['libb']), { from: 'baseos', reason: 'dep' })
  ] });
  const st = run(s);
  assert.equal(st[2].last.kind, 'keptUser');
  assert.equal(st[3].last.kind, 'unused');
  assert.deepEqual(st[st.length - 1].installed.map((p) => p.name), ['a']);
});

test('rule 7: removing what is not installed stops', () => {
  const st = run(scene({ name: 'ghost', op: 'remove', repos: [{ id: 'baseos', pkgs: [] }], installed: [] }));
  assert.equal(st[1].problem.kind, 'notinstalled');
  assert.equal(st.length, 3);
});

test('rule 6: depth is the longest chain, not the sum of the branches', () => {
  const list = [pkg('q', '1', [], ['lr']), pkg('r', '1', ['lr'], ['ls']), pkg('s', '1', ['ls'], ['lt']), pkg('t', '1', ['lt']),
    pkg('top', '1', [], ['la', 'lb']), pkg('a', '1', ['la'], ['lc']), pkg('b', '1', ['lb']), pkg('c', '1', ['lc'])];
  assert.deepEqual(logic.depthOrder(list), ['t', 'b', 'c', 's', 'a', 'r', 'top', 'q']);
});

test('execute: packages enter the installed list in the computed order', () => {
  assert.deepEqual(end({}).installed.slice(-3).map((p) => p.name), ['ocl-icd', 'hwloc-libs', 'htop']);
});

test('rule 7: a capability whose provider is already planned for erasing adds nothing', () => {
  const st = run(scene({ name: 'app', op: 'remove', repos: [{ id: 'baseos', pkgs: [] }], installed: [
    Object.assign(pkg('app', '1', [], ['liba', 'libb']), { from: 'baseos', reason: 'user' }),
    Object.assign(pkg('x', '1', ['liba', 'libb']), { from: 'baseos', reason: 'dep' })
  ] }));
  assert.equal(st[2].last.kind, 'unused');
  assert.equal(st[3].last.kind, 'going');
  assert.equal(st[3].last.pkg, 'x');
  assert.deepEqual(st[st.length - 1].order, ['app', 'x']);
});

test('rule 7: a staying package that requires any capability of the provider keeps it', () => {
  const st = run(scene({ name: 'app', op: 'remove', repos: [{ id: 'baseos', pkgs: [] }], installed: [
    Object.assign(pkg('app', '1', [], ['liba']), { from: 'baseos', reason: 'user' }),
    Object.assign(pkg('x', '1', ['liba', 'libb']), { from: 'baseos', reason: 'dep' }),
    Object.assign(pkg('y', '1', [], ['libb']), { from: 'baseos', reason: 'user' })
  ] }));
  assert.equal(st[2].last.kind, 'keptNeeded');
  assert.equal(st[2].last.needer, 'y');
  assert.equal(st[2].last.with, 'libb');
});

test('rule 8: a remove does not download metadata, even for a repository that has none', () => {
  const st = run(scene({ name: 'app', op: 'remove', repos: [{ id: 'epel', meta: 'new', pkgs: [] }], installed: [
    Object.assign(pkg('app', '1'), { from: 'epel', reason: 'user' })] }));
  for (const s of st) assert.equal(s.repos[0].meta, 'new');
  const inst = run(scene({ name: 'app', repos: [{ id: 'epel', meta: 'new', pkgs: [pkg('app', '1')] }] }));
  assert.equal(inst[1].repos[0].meta, 'downloaded');
});

// ── rule 8: metadata per repository ──

test('rule 8: the first install step downloads the new repository\'s metadata only', () => {
  assert.deepEqual(at({}, 0).repos.map((r) => r.meta), ['cached', 'new']);
  const s1 = at({}, 1);
  assert.deepEqual(s1.repos.map((r) => r.meta), ['cached', 'downloaded']);
  assert.ok(s1.changed.includes('meta:epel'));
  assert.ok(!at({}, 2).changed.includes('meta:epel'));
  assert.deepEqual(at({ epel: false }, 1).repos.map((r) => r.meta), ['cached', 'off']);
  // a remove does not read repository metadata
  assert.deepEqual(end({ request: 'remove-htop' }).repos.map((r) => r.meta), ['cached', 'cached']);
});

// ── the end of the transaction ──

test('execute: the request is marked user, the rest dep, with their repository', () => {
  const s = end({});
  const by = Object.fromEntries(s.installed.map((p) => [p.name, p.reason + '@' + p.from]));
  assert.equal(by.htop, 'user@epel');
  assert.equal(by['hwloc-libs'], 'dep@baseos');
  assert.equal(by['ocl-icd'], 'dep@baseos');
  assert.equal(at({}, 5).installed.length, 3);
  assert.equal(s.installed.length, 6);
});

test('an empty plan ends at the summary (Nothing to do)', () => {
  const st = run(scene({ name: 'app', repos: [{ id: 'baseos', pkgs: [pkg('app', '1')] }], installed: [Object.assign(pkg('app', '1'), { from: 'baseos', reason: 'user' })] }));
  assert.equal(st.length, 3);
  assert.equal(st[2].last.kind, 'summary');
  assert.equal(st[2].done, true);
});

// ── presets: SPEC.md table ──

test('presets: steps, plan and outcome as in SPEC.md', () => {
  const want = {
    'htop-epel': [6, 'install:htop dep:hwloc-libs dep:ocl-icd', null],
    'already-there': [6, 'install:tmux', null],
    'epel-off': [2, '', 'nomatch'],
    'remove-htop': [6, 'remove:htop unused:hwloc-libs unused:ocl-icd', null],
    'remove-kept': [5, 'remove:htop', null],
    conflict: [2, '', 'conflict']
  };
  assert.deepEqual(logic.PRESETS.map((p) => p.id), Object.keys(want));
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    const s = kit.stateAt(logic, p, logic.steps(p));
    assert.equal(logic.steps(p), want[pr.id][0], pr.id);
    assert.equal(s.plan.map((r) => r.section + ':' + r.name).join(' '), want[pr.id][1], pr.id);
    assert.equal(s.problem && s.problem.kind, want[pr.id][2], pr.id);
    assert.equal(s.done, true, pr.id);
  }
  assert.deepEqual(logic.summary(end({})), { op: 'install', n: 3, deps: 2 });
  assert.deepEqual(logic.summary(end({ request: 'remove-htop' })), { op: 'remove', n: 3, deps: 2 });
  assert.equal(logic.steps(P({ keepLibs: true })), 5);
  assert.equal(logic.steps(P({ request: 'install-tmux', epel: false })), 6);
});

test('params are normalised', () => {
  assert.deepEqual(logic.norm({ request: 'nope', epel: 0 }), { request: 'install-htop', epel: false, keepLibs: false });
  assert.equal(logic.steps({}), 6);
});

// ── generic checks every sim keeps ──

const ALL = logic.PRESETS.map((p) => p.params).concat([{ keepLibs: true }, { request: 'install-tmux', epel: false }]);

test('state is JSON-safe at every step', () => {
  for (const pr of ALL) {
    const p = P(pr);
    for (let n = 0; n <= logic.steps(p); n++) {
      const s = kit.stateAt(logic, p, n);
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('replay is deterministic and step back equals replay', () => {
  for (const pr of ALL) {
    const p = P(pr);
    const forward = [];
    let s = logic.initial(p);
    forward.push(s);
    for (let n = 1; n <= logic.steps(p); n++) { s = logic.step(s, n, p); forward.push(s); }
    for (let n = logic.steps(p); n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
  }
});

test('step does not mutate its input', () => {
  const p = P({});
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('strings: every preset, request, action kind and tie-break key has its words', () => {
  const kinds = ['chosen', 'chosenCross', 'chosenDep', 'installed', 'installedReq', 'conflictAll', 'planned', 'nomatch', 'nothing', 'conflict', 'remove', 'unused', 'keptNeeded', 'keptUser', 'going', 'none', 'notinstalled'];
  for (const lang of ['hr', 'en']) {
    const tb = strings[lang];
    for (const pr of logic.PRESETS) { assert.ok(tb['preset_' + pr.id], lang + pr.id); assert.ok(tb['preset_' + pr.id + '_hint'], lang + pr.id); }
    for (const id of logic.REQUEST_IDS) assert.ok(tb['req_' + id], lang + id);
    for (const k of kinds) assert.ok(tb['cap_' + k], lang + k);
    for (const k of ['installed', 'priority', 'name', 'version', 'alpha']) assert.ok(tb['key_' + k], lang + k);
  }
});

test('the page: meta steps match the default; presets come from the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(logic.defaults));
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  assert.equal(sim.steps, logic.steps(logic.defaults));
  assert.match(html, /L\.PRESETS\.map/);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, k);
  for (const e of sim.entries || []) assert.ok(logic.PRESETS.some((x) => x.id === e.preset), e.preset);
});
