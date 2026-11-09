// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the Linux directory tree poster. Run: node --test sims/linux-dirs/
// Order: tie-breaks, then the rules of SPEC.md §2, then the expected numbers of SPEC.md §3, then the generic block.
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
const S = (over) => logic.initial(P(over));
const node = (path) => logic.BY_PATH[path];

// ── tie-breaks (SPEC.md §4) ──

test('tie-break: a filter beats the view', () => {
  // The boot-and-disks view lights four nodes; with a filter set, only the filter decides.
  assert.deepEqual(S({ view: 'boot-and-disks' }).lit, ['/boot', '/boot/efi', '/dev', '/mnt']);
  assert.deepEqual(S({ view: 'boot-and-disks', filter: 'may-be-lost' }).lit, ['/run', '/run/log/journal', '/tmp']);
  // and the behaviour view's words go with its lit set
  assert.equal(S({ view: 'behaviour' }).badges, true);
  assert.equal(S({ view: 'behaviour', filter: 'variable' }).badges, false);
});

test('tie-break: hidden beats lit and selected (ring book)', () => {
  assert.deepEqual(S({ ring: 'book', view: 'where-are-logs' }).lit, []);
  assert.deepEqual(S({ ring: 'book', filter: 'variable' }).lit, ['/tmp', '/var']);
  const s = S({ ring: 'book', sel: '/usr/bin' });
  assert.equal(s.selected, null);
  assert.deepEqual(s.path, []);
  assert.ok(s.nodes.every((n) => !n.onPath && !n.lit));
  assert.equal(S({ ring: 'book', sel: '/usr' }).selected, '/usr');
});

test('tie-break: an unknown sel, filter, view or ring is none, not an error', () => {
  for (const sel of ['/nope', 'usr', '/usr/', '', null, undefined, 'constructor', '__proto__']) {
    const s = S({ sel });
    assert.equal(s.selected, null, String(sel));
    assert.deepEqual(s.path, []);
  }
  for (const k of ['constructor', 'toString', '__proto__', 'none', 'x', null]) {
    const s = S({ filter: k, view: k });
    assert.equal(s.filter, null, String(k));
    assert.equal(s.view, null, String(k));
    assert.deepEqual(s.lit, []);
  }
  assert.equal(S({ ring: 'x' }).ring, 'all');
  assert.equal(S({}).filter, null);
  assert.equal(S({}).view, null);
  assert.deepEqual(logic.pathTo('constructor'), []);
  assert.deepEqual(logic.locate('/constructor'), { node: '/', onPoster: false });
});

test('tie-break: locate matches whole names; doubled and trailing slashes are ignored', () => {
  assert.deepEqual(logic.locate('/usr2/x'), { node: '/', onPoster: false });
  assert.deepEqual(logic.locate('/variable'), { node: '/', onPoster: false });
  assert.deepEqual(logic.locate('/usr//local/'), { node: '/usr/local', onPoster: true });
  assert.deepEqual(logic.locate('//'), { node: '/', onPoster: true });
});

test('tie-break: lists are in poster order', () => {
  const order = logic.NODES.map((n) => n.path);
  const sorted = (xs) => xs.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
  for (const f of logic.FILTER_IDS) assert.deepEqual(logic.byFilter(f, 'all'), sorted(logic.byFilter(f, 'all')));
  for (const v of logic.VIEW_IDS) assert.deepEqual(S({ view: v }).lit, sorted(S({ view: v }).lit));
  // poster order is ls order: alphabetical under each parent
  const kids = (p) => logic.NODES.filter((n) => n.parent === p).map((n) => n.path);
  for (const p of order) assert.deepEqual(kids(p), kids(p).slice().sort(), p);
});

// ── rule 1: the tree starts at / ──

test('rule 1: every node is read from /, one name at a time', () => {
  assert.deepEqual(logic.pathTo('/usr/local'), ['/', '/usr', '/usr/local']);
  assert.deepEqual(logic.pathTo('/'), ['/']);
  assert.deepEqual(logic.pathTo('/run/log/journal'), ['/', '/run', '/run/log/journal']);
  for (const n of logic.NODES) {
    const chain = logic.pathTo(n.path);
    assert.equal(chain[0], '/', n.path);
    assert.equal(chain[chain.length - 1], n.path);
    for (let i = 1; i < chain.length; i++) assert.ok(chain[i].startsWith(chain[i - 1] === '/' ? '/' : chain[i - 1] + '/'), n.path);
  }
  const s = S({ sel: '/var/log' });
  assert.deepEqual(s.path, ['/', '/var', '/var/log']);
  assert.deepEqual(s.nodes.filter((n) => n.onPath).map((n) => n.path), ['/', '/var', '/var/log']);
});

test('rule 1: a relative path is not read from the tree', () => {
  assert.equal(logic.locate('fstab'), null);
  assert.equal(logic.locate('etc/fstab'), null);
  assert.equal(logic.locate(''), null);
  assert.deepEqual(logic.locate('/etc/fstab'), { node: '/etc', onPoster: false });
});

// ── rule 2: split by behaviour, not topic ──

test('rule 2: the five primaries of UL ch05', () => {
  const primary = (p) => node(p).b[0];
  assert.equal(primary('/usr'), 'static');
  assert.ok(node('/usr').b.includes('shareable'));
  assert.equal(primary('/var'), 'variable');
  assert.equal(primary('/tmp'), 'may-be-lost');
  assert.equal(primary('/etc'), 'host-specific');
  assert.equal(primary('/home'), 'per-user');
  // the behaviour view shows exactly these five, one word each
  const s = S({ view: 'behaviour' });
  assert.deepEqual(s.lit, ['/etc', '/home', '/tmp', '/usr', '/var']);
  assert.deepEqual(s.nodes.filter((n) => n.lit).map((n) => n.primary), ['host-specific', 'per-user', 'may-be-lost', 'static', 'variable']);
});

test('rule 2: the six of ring 1 are the six names of ls -ld / /etc /home /tmp /usr /var', () => {
  assert.deepEqual(logic.NODES.filter((n) => n.ring === 1).map((n) => n.path), ['/', '/etc', '/home', '/tmp', '/usr', '/var']);
  assert.deepEqual(S({ ring: 'book' }).nodes.map((n) => n.path), ['/', '/etc', '/home', '/tmp', '/usr', '/var']);
});

test('rule 2: static & shareable needs both badges', () => {
  // /etc and /boot are static but host-specific: not lit
  assert.ok(node('/etc').b.includes('static'));
  assert.ok(node('/boot').b.includes('static'));
  assert.deepEqual(logic.byFilter('static-shareable', 'all'), ['/opt', '/usr', '/usr/bin', '/usr/local']);
});

test('rule 2: badges come from the known vocabulary, no doubles', () => {
  for (const n of logic.NODES) {
    for (const b of n.b) assert.ok(logic.BEHAVIOURS.includes(b), n.path + ' ' + b);
    assert.equal(new Set(n.b).size, n.b.length, n.path);
    // shareable and host-specific (unshareable) exclude each other (FHS ch. 2)
    assert.ok(!(n.b.includes('shareable') && n.b.includes('host-specific')), n.path);
    assert.ok(!(n.b.includes('static') && n.b.includes('variable')), n.path);
  }
});

// ── rule 3: written while running → /var; logs → /var/log; add-ons → /opt outside /usr ──

test('rule 3: nothing under /usr is variable, everything under /var is', () => {
  const under = (p) => logic.NODES.filter((n) => n.path === p || n.path.startsWith(p + '/'));
  for (const n of under('/usr')) assert.ok(!n.b.includes('variable') && n.b.includes('static'), n.path);
  for (const n of under('/var')) assert.ok(n.b.includes('variable'), n.path);
  assert.equal(node('/var/log').parent, '/var');
  assert.equal(node('/var/log').fhs, '5.10');
  assert.equal(node('/opt').parent, '/');
  assert.equal(node('/opt').fhs, '3.13');
});

// ── rule 4: second-ring cards follow FHS 3.0 ──

test('rule 4: FHS 3.0 sections', () => {
  const want = {
    '/': '3', '/boot': '3.5', '/dev': '3.6', '/etc': '3.7', '/home': '3.8', '/mnt': '3.12', '/opt': '3.13',
    '/root': '3.14', '/run': '3.15', '/srv': '3.17', '/tmp': '3.18', '/usr': '4', '/usr/bin': '4.4',
    '/usr/local': '4.9', '/var': '5', '/var/lib': '5.8', '/var/log': '5.10', '/proc': '6.1.5',
    '/boot/efi': null, '/run/log/journal': null
  };
  assert.deepEqual(Object.fromEntries(logic.NODES.map((n) => [n.path, n.fhs])), want);
});

test('rule 4: /run is lost at reboot and not on a disk; /proc is virtual', () => {
  assert.ok(['variable', 'may-be-lost', 'virtual'].every((b) => node('/run').b.includes(b)));
  assert.deepEqual(node('/proc').b, ['virtual']);
  assert.deepEqual(logic.byFilter('virtual', 'all'), ['/proc', '/run', '/run/log/journal']);
});

test('rule 4: every example file lies under its own node and every chapter is a chapter of the book', () => {
  for (const n of logic.NODES) {
    for (const ch of [n.ch, n.ex && n.ex.ch].filter(Boolean)) assert.ok(Number.isInteger(ch) && ch >= 1 && ch <= 23, n.path);
    if (!n.ex || n.path === '/') continue;
    const at = logic.locate(n.ex.file.replace('[pid]', '1'));
    assert.ok(logic.pathTo(at.node).includes(n.path), n.path + ' ' + n.ex.file);
  }
});

test('rule 4: chapters and examples as in SPEC.md §1', () => {
  const want = {
    '/': [5, '/etc/fstab', 5], '/boot': [11], '/boot/efi': [11], '/dev': [11, '/dev/vdb1', 11], '/etc': [5, '/etc/fstab', 5],
    '/home': [5, '/home/student', 5], '/mnt': [11, '/mnt/vjezba', 11], '/opt': [5], '/proc': [8, '/proc/[pid]/stat', 8],
    '/root': [5], '/run': [13, '/run/log/journal', 13], '/run/log/journal': [13], '/srv': [18, '/srv/zajednicko', 18],
    '/tmp': [5], '/usr': [5, '/usr/share/doc', 5], '/usr/bin': [5, '/usr/bin/vi', 5],
    '/usr/local': [10, '/usr/local/sbin/arhiva.sh', 10], '/var': [5, '/var/spool/mail/student', 20],
    '/var/lib': [13, '/var/lib/nfs', 7], '/var/log': [5, '/var/log/messages', 13]
  };
  for (const n of logic.NODES) {
    const s = S({ sel: n.path }).nodes.find((x) => x.path === n.path);
    const got = s.example ? [s.chapter, s.example.file, s.example.chapter] : [s.chapter];
    assert.deepEqual(got, want[n.path], n.path);
  }
});

// ── rule 5: local layout is the site's ──

test('rule 5: a directory not on the poster is not an error', () => {
  assert.deepEqual(logic.locate('/etc/systemd/system'), { node: '/etc', onPoster: false });
  assert.deepEqual(logic.locate('/usr/local/sbin/arhiva.sh'), { node: '/usr/local', onPoster: false });
  assert.deepEqual(logic.locate('/srv/zajednicko'), { node: '/srv', onPoster: false });
  assert.deepEqual(logic.locate('/var/log'), { node: '/var/log', onPoster: true });
  assert.deepEqual(logic.locate('/run/log'), { node: '/run', onPoster: false });
});

// ── expected numbers (SPEC.md §1, §3) ──

test('numbers: 20 nodes, 6 in ring 1, 13 under /, 6 at depth 2', () => {
  assert.equal(logic.NODES.length, 20);
  assert.equal(logic.NODES.filter((n) => n.ring === 1).length, 6);
  assert.equal(logic.NODES.filter((n) => logic.depthOf(n.path) === 1).length, 13);
  assert.equal(logic.NODES.filter((n) => logic.depthOf(n.path) === 2).length, 6);
  assert.equal(new Set(logic.NODES.map((n) => n.key)).size, 20);
});

test('numbers: lit sets per filter, ring all and ring book', () => {
  const all = {
    'none': [],
    'static-shareable': ['/opt', '/usr', '/usr/bin', '/usr/local'],
    'variable': ['/run', '/run/log/journal', '/tmp', '/var', '/var/lib', '/var/log'],
    'host-specific': ['/boot', '/boot/efi', '/dev', '/etc', '/srv'],
    'may-be-lost': ['/run', '/run/log/journal', '/tmp'],
    'virtual': ['/proc', '/run', '/run/log/journal']
  };
  const book = { 'none': [], 'static-shareable': ['/usr'], 'variable': ['/tmp', '/var'], 'host-specific': ['/etc'], 'may-be-lost': ['/tmp'], 'virtual': [] };
  for (const f of logic.FILTER_IDS) {
    assert.deepEqual(S({ filter: f }).lit, all[f], f);
    assert.deepEqual(S({ filter: f, ring: 'book' }).lit, book[f], 'book ' + f);
  }
});

test('numbers: lit sets per view', () => {
  const want = {
    'none': [], 'book-six': [], 'behaviour': ['/etc', '/home', '/tmp', '/usr', '/var'],
    'where-are-logs': ['/run/log/journal', '/var/log'], 'boot-and-disks': ['/boot', '/boot/efi', '/dev', '/mnt'],
    'virtual': ['/proc', '/run', '/run/log/journal']
  };
  for (const v of logic.VIEW_IDS) assert.deepEqual(S({ view: v }).lit, want[v], v);
  // the descriptions only under ring book: there is no room for twenty
  assert.equal(S({ view: 'book-six', ring: 'book' }).describe, true);
  assert.equal(S({ view: 'book-six', ring: 'all' }).describe, false);
});

// ── generic checks every sim keeps ──

test('a reference page: no steps, and step changes nothing', () => {
  assert.equal(logic.steps, 0);
  const s = S({ filter: 'variable', sel: '/var/log' });
  assert.deepEqual(logic.step(s, 1, P({})), s);
});

test('state is JSON-safe for every param combination', () => {
  for (const filter of logic.FILTER_IDS) for (const ring of ['book', 'all']) for (const view of logic.VIEW_IDS) {
    for (const sel of ['', '/usr/local', '/etc']) {
      const s = S({ filter, ring, view, sel });
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    }
  }
});

test('deterministic, and the model data is not mutated', () => {
  const before = structuredClone(logic.NODES);
  const a = S({ filter: 'variable', sel: '/var/lib' });
  a.nodes[0].behaviours.push('x');
  a.lit.push('x');
  assert.deepEqual(S({ filter: 'variable', sel: '/var/lib' }), logic.initial(P({ filter: 'variable', sel: '/var/lib' })));
  assert.deepEqual(logic.NODES, before);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every node has a description in both languages', () => {
  for (const lang of ['hr', 'en']) for (const n of logic.NODES) assert.ok(strings[lang]['d_' + n.key], lang + ' ' + n.path);
});

test('every preset in the page is valid for the model', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'reference');
  assert.equal(meta.steps, undefined);
  const presets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.equal(presets.length, 5);
  for (const body of presets) {
    for (const [, k, v] of body.matchAll(/(\w+):\s*'([^']*)'/g)) {
      assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
      if (k === 'filter') assert.ok(logic.FILTER_IDS.includes(v), v);
      if (k === 'view') assert.ok(logic.VIEW_IDS.includes(v), v);
      if (k === 'ring') assert.ok(['book', 'all'].includes(v), v);
    }
  }
});
