// SPDX-License-Identifier: AGPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNative, build, scriptJson, kitTokens, pageScript } from '../scripts/build.mjs';
import { thumbKey } from '../lib/thumbs.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const entry = { id: 'x', title: 'X </script>', concept: 'c', class: 'stepper', lang: 'hr', steps: 3 };

function simDir(files) {
  const d = mkdtempSync(join(tmpdir(), 'simdeck-test-'));
  for (const [k, v] of Object.entries(files)) writeFileSync(join(d, k), v);
  return d;
}
const page = (head = '', body = '') => `<!doctype html><html lang="hr"><head>${head}</head><body>${body}</body></html>`;

test('inlines local scripts and stylesheets, leaves the network ones to the offline check', () => {
  const d = simDir({ 'a.js': 'window.A = 1;', 'b.css': 'body{color:red}' });
  const r = buildNative(page('<link rel="stylesheet" href="b.css">', '<script src="a.js"></script>'), entry, { simDir: d });
  assert.deepEqual(r.errors, []);
  assert.match(r.html, /<style>\/\* b.css \*\/\nbody\{color:red\}<\/style>/);
  assert.match(r.html, /<script>\/\* a.js \*\/\nwindow.A = 1;<\/script>/);
  assert.doesNotMatch(r.html, /src="a.js"/);
});

test('refuses missing files and files outside the sim folder', () => {
  const d = simDir({});
  assert.match(buildNative(page('', '<script src="nope.js"></script>'), entry, { simDir: d }).errors.join(), /not found/);
  assert.match(buildNative(page('', '<script src="../x.js"></script>'), entry, { simDir: d }).errors.join(), /outside the sim's folder, the kit and models\//);
});

test('refuses anything loaded from the network', () => {
  const d = simDir({});
  for (const bad of ['<script src="https://cdn.x/a.js"></script>', '<link rel="stylesheet" href="//fonts.x/c.css">', '<img src="http://x/a.png">', '<style>a{background:url(https://x/y.png)}</style>']) {
    assert.match(buildNative(page('', bad), entry, { simDir: d }).errors.join(), /network/, bad);
  }
  assert.deepEqual(buildNative(page('', '<a href="https://example.org">ok</a>'), entry, { simDir: d }).errors, []);
});

test('inlines the kit the way the template links it, with its fonts as data: URIs', () => {
  const root = mkdtempSync(join(tmpdir(), 'simdeck-kit-'));
  const kitDir = join(root, 'kit');
  mkdirSync(join(kitDir, 'fonts'), { recursive: true });
  writeFileSync(join(kitDir, 'kit.css'), "@font-face{src:url('fonts/a.woff2') format('woff2')} body{color:red}");
  writeFileSync(join(kitDir, 'kit.js'), 'window.Simdeck = {};');
  writeFileSync(join(kitDir, 'fonts', 'a.woff2'), 'FONT');
  const simDir = join(root, 'sims', 'x');
  mkdirSync(simDir, { recursive: true });
  writeFileSync(join(simDir, 'sim.js'), 'window.SimLogic = {};');
  const src = page('<link rel="stylesheet" href="../../kit/kit.css"><script src="../../kit/kit.js"></script>', '<script src="sim.js"></script>');
  try {
    const r = buildNative(src, entry, { simDir, kitDir });
    assert.deepEqual(r.errors, []);
    assert.match(r.html, /window.Simdeck = \{\};/);
    assert.match(r.html, /window.SimLogic = \{\};/);
    assert.match(r.html, new RegExp(`url\\("data:font/woff2;base64,${Buffer.from('FONT').toString('base64')}"\\)`));
    assert.doesNotMatch(r.html, /href="..\/..\/kit|src="..\/..\/kit|fonts\/a.woff2/);
    assert.match(buildNative(src, entry, { simDir, kitDir: null }).errors.join(), /outside the sim's folder, the kit and models\//);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('replaces the page placeholder #simdeck-meta with one from sim.json', () => {
  const d = simDir({});
  const placeholder = '<script type="application/json" id="simdeck-meta">{"id":"proto","kind":"native"}</script>';
  const r = buildNative(page(placeholder), entry, { simDir: d });
  assert.deepEqual(r.errors, []);
  assert.equal(r.html.match(/id="simdeck-meta"/g).length, 1);
  assert.doesNotMatch(r.html, /proto/);
});

test('scriptJson cannot close its script element', () => {
  assert.doesNotMatch(scriptJson({ a: '</script><!--' }), /<\//);
});

test('the real repository builds every page, and only finished ones', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'simdeck-dist-')), 'site');
  try {
    const r = build({ root: ROOT, out, log: () => {} });
    assert.deepEqual(r.errors, []);
    assert.ok(r.ok);
    assert.ok(existsSync(join(out, 'index.html')));
    assert.ok(r.entries.every((e) => e.status === 'ready'));
    for (const e of r.entries) {
      const html = readFileSync(join(out, 'sims', e.id, 'index.html'), 'utf8');
      assert.match(html, /id="simdeck-meta"/, e.id);
      assert.doesNotMatch(html, /<script[^>]+src=/, `${e.id} is self-contained`);
    }
    for (const c of r.courses) assert.ok(existsSync(join(out, 'courses', c.id, 'index.html')), c.id);
    // The home page is the tree (learn.json); the finder, the old home page, is find/index.html.
    const tree = readFileSync(join(out, 'index.html'), 'utf8');
    const index = readFileSync(join(out, 'find', 'index.html'), 'utf8');
    for (const [name, page] of [['tree', tree], ['finder', index]]) {
      assert.doesNotMatch(page, /\{\{\w+\}\}/, `${name}: all template variables filled`);
      assert.doesNotMatch(page, /application\/json/, `${name}: no data blob, plain HTML`);
      assert.doesNotMatch(page, /(src|href)="\//, `${name}: no root-absolute links, the folder can move`);
      assert.doesNotMatch(page, /courses\//, `${name}: names no courses (owner, 2026-10-03)`);
    }
    // Every sim learn.json places is on the tree. A newly finished sim may be in no leaf yet (a warning, not an error:
    // a task may change only its own folder, so the coordinator places it), and then it is in the finder only.
    const leaves = (n) => (n.children ? n.children.flatMap(leaves) : [n]);
    const placed = new Set(JSON.parse(readFileSync(join(ROOT, 'learn.json'), 'utf8')).nodes.flatMap(leaves)
      .flatMap((l) => l.sims.map((s) => s.split('#')[0])));
    for (const e of r.entries.filter((x) => placed.has(x.id))) {
      assert.match(tree, new RegExp(`href="sims/${e.id}/index\\.html`), `${e.id} is in the tree`);
    }
    assert.ok(placed.size > 200, 'the tree places most sims');
    assert.equal((tree.match(/<section class="node root"/g) ?? []).length, 1, 'one root: the areas');
    assert.match(tree, /<section class="node leaf" id="[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+"/, 'a leaf\'s id is its path, the deep link');
    assert.match(tree, /<form class="search" action="find\/index\.html"/, 'the tree\'s search goes to the finder');
    assert.match(tree, /location\.replace\('find\/index\.html' \+ location\.search/, 'an old ?set= link opens in the finder');
    assert.match(index, /<body data-site-url="https:\/\/materijali\.online\/simdeck\/find\/">/, 'the address "copy link" shares');
    assert.match(index, /class="to-tree" data-lang-link href="\.\.\/index\.html"/, 'the finder links back to the tree');
    assert.equal((index.match(/<article class="tile" /g) ?? []).length, r.entries.length, 'one tile per finished sim');
    assert.equal((index.match(/class="chip" /g) ?? []).length, new Set(r.entries.map((e) => e.topic)).size, 'one chip per topic in use');
    assert.match(index, /<a class="tile-link" data-lang-link href="\.\.\/sims\//, 'the finder links sims from one folder down');
    for (const f of ['atkinson-hyperlegible-latin-400-normal.woff2', 'atkinson-hyperlegible-latin-ext-700-normal.woff2']) assert.ok(existsSync(join(out, 'fonts', f)), f);
    assert.match(tree, /url\('fonts\/atkinson-hyperlegible-latin-400-normal\.woff2'\)/, 'the kit\'s font, from the copy next to the page');
    assert.match(index, /url\('\.\.\/fonts\/atkinson-hyperlegible-latin-400-normal\.woff2'\)/, 'the finder takes it from one folder up');
  } finally {
    rmSync(dirname(out), { recursive: true, force: true });
  }
});

test('thumbnails: a cached one is used only when it was shot from this build of the sim; else a placeholder', () => {
  const d = mkdtempSync(join(tmpdir(), 'simdeck-thumbs-'));
  const out = join(d, 'site');
  const cache = join(d, 'cache');
  try {
    // First build without a cache: every tile has a placeholder, and no thumbs/ folder.
    let r = build({ root: ROOT, out, log: () => {}, thumbs: cache });
    assert.ok(r.ok, r.errors.join());
    let index = readFileSync(join(out, 'find', 'index.html'), 'utf8');
    assert.doesNotMatch(index, /<img src="\.\.\/thumbs\//);
    assert.match(index, /<article class="tile" data-id="vlan"[^]*?<span class="ph" aria-hidden="true">V<\/span>/);
    assert.ok(!existsSync(join(out, 'thumbs')));
    // A thumbnail keyed by vlan's built file is copied as thumbs/vlan-light.webp; a stale key for nat is not.
    mkdirSync(cache);
    writeFileSync(join(cache, thumbKey(readFileSync(join(out, 'sims', 'vlan', 'index.html'), 'utf8'))), 'webp');
    writeFileSync(join(cache, thumbKey('an older build of nat')), 'webp');
    r = build({ root: ROOT, out, log: () => {}, thumbs: cache });
    index = readFileSync(join(out, 'find', 'index.html'), 'utf8');
    const tree = readFileSync(join(out, 'index.html'), 'utf8');
    assert.equal(readFileSync(join(out, 'thumbs', 'vlan-light.webp'), 'utf8'), 'webp');
    assert.match(tree, /<a class="sim" data-lang-link href="sims\/vlan\/index\.html"[^>]*><span class="pic"><img src="thumbs\/vlan-light\.webp"/, 'the tree uses it too');
    assert.ok(!existsSync(join(out, 'thumbs', 'nat-light.webp')));
    assert.match(index, /<article class="tile" data-id="vlan"[^>]*>[^]*?<img src="\.\.\/thumbs\/vlan-light\.webp" alt="" width="560" height="350"/);
    assert.match(index, /<article class="tile" data-id="nat"[^]*?<span class="ph"/);
    assert.notEqual(thumbKey('a'), thumbKey('b'));
    assert.equal(thumbKey('a'), thumbKey('a'));
    assert.match(thumbKey('a'), /^[0-9a-f]{64}-light\.webp$/);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('kitTokens: the kit\'s light tokens on :root, the dark ones when the OS asks, and its fonts', () => {
  const css = readFileSync(join(ROOT, 'kit', 'kit.css'), 'utf8');
  const t = kitTokens(css);
  assert.match(t, /^@font-face \{[^}]*url\('fonts\/atkinson/m);
  assert.match(t, /:root \{ --bg: #fbfaf6;[^}]*--c8: #4b5567; color-scheme: light; \}/);
  assert.match(t, /@media \(prefers-color-scheme: dark\) \{ :root:not\(\[data-theme="light"\]\) \{ --bg: #0d1626;/);
  assert.throws(() => kitTokens('body {}'), /tokens:light/);
});

test('pageScript: the page\'s words and core.mjs\'s set-link functions are inlined in front of site/index.js', () => {
  const js = pageScript('/* page */ x("</script>")');
  assert.match(js, /^var STR = \{"hr":\{"sims":\["simulator","simulatora","simulatora"\]/);
  assert.match(js, /\nfunction parseSet\(str, known, max = 30\) \{/);
  assert.match(js, /\nfunction setParam\(ids\) \{/);
  assert.match(js, /\nfunction plural\(lang, n, forms\) \{/);
  assert.doesNotMatch(js, /<\/script/i, 'cannot close its script element');
  // The inlined functions run on their own, as they do in the page.
  const run = new Function(`${js.replace(/\/\* page \*\/.*$/s, '')}; return { parseSet, setParam, plural };`)();
  assert.deepEqual(run.parseSet('a,b:c,a,x', new Set(['a', 'b#c'])), { items: ['a', 'b#c'], skipped: ['x'] });
  assert.equal(run.setParam(['a', 'b#c']), 'a,b:c');
  assert.equal(run.plural('hr', 22, ['a', 'b', 'c']), 'b');
});

test('the real repository also builds with drafts (the admin preview), so every sim page is exercised', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'simdeck-drafts-')), 'site');
  try {
    const r = build({ root: ROOT, out, drafts: true, log: () => {} });
    assert.ok(r.ok, r.errors.join());
    assert.ok(r.entries.length > 0);
    for (const e of r.entries) assert.match(readFileSync(join(out, 'sims', e.id, 'index.html'), 'utf8'), /id="simdeck-meta"/, e.id);
  } finally {
    rmSync(dirname(out), { recursive: true, force: true });
  }
});

test('never empties a folder simdeck did not build', () => {
  const out = mkdtempSync(join(tmpdir(), 'simdeck-usb-'));
  writeFileSync(join(out, 'my-thesis.pdf'), 'x');
  try {
    const r = build({ root: ROOT, out, log: () => {} });
    assert.equal(r.ok, false);
    assert.match(r.errors.join(), /not built by simdeck/);
    assert.ok(existsSync(join(out, 'my-thesis.pdf')));
    rmSync(join(out, 'my-thesis.pdf'));
    assert.ok(build({ root: ROOT, out, log: () => {} }).ok, 'empty folder is fine');
    assert.ok(build({ root: ROOT, out, log: () => {} }).ok, 'and a stamped one can be rebuilt');
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('a broken manifest stops the build before dist/ is touched', () => {
  const root = mkdtempSync(join(tmpdir(), 'simdeck-bad-'));
  const out = join(root, 'dist');
  mkdirSync(out);
  writeFileSync(join(out, 'keep'), '');
  writeFileSync(join(root, 'site.json'), '{}');
  writeFileSync(join(root, 'tags.json'), '{"topics":{},"tags":{}}');
  mkdirSync(join(root, 'sims', 'a'), { recursive: true });
  writeFileSync(join(root, 'sims', 'a', 'index.html'), page());
  try {
    const r = build({ root, out, log: () => {} });
    assert.equal(r.ok, false);
    assert.match(r.errors.join(), /no sim.json/);
    assert.ok(existsSync(join(out, 'keep')), 'previous dist kept');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('home and course pages carry both languages, the switch and the language script', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'simdeck-lang-')), 'site');
  try {
    const r = build({ root: ROOT, out, drafts: true, log: () => {} });
    assert.ok(r.ok, r.errors.join());
    const index = readFileSync(join(out, 'index.html'), 'utf8');
    assert.match(index, /<html lang="hr">/, 'site.json lang is the default');
    assert.match(index, /data-lang-switch/);
    assert.match(index, /simdeck\.lang/, 'site/lang.js is inlined');
    assert.match(index, /<h1><span data-l="hr" lang="hr">Što želite danas naučiti\?<\/span><span data-l="en" lang="en">What do you want to learn about today\?<\/span><\/h1>/);
    assert.match(index, /data-en="Or look a concept up right away…"/);
    assert.match(index, /html\[lang="hr"\] \[data-l="en"\]/, 'the CSS hides the other language');
    const finder = readFileSync(join(out, 'find', 'index.html'), 'utf8');
    assert.match(finder, /data-lang-switch/);
    assert.match(finder, /simdeck\.lang/, 'site/lang.js is inlined');
    assert.match(finder, /<span data-l="hr" lang="hr">Računalne mreže<\/span><span data-l="en" lang="en">Computer networks<\/span>/);
    assert.match(finder, /data-en="Find a simulator, a concept or a command…"/);
    assert.match(finder, /html\[lang="hr"\] \[data-l="en"\]/, 'the CSS hides the other language');
    const course = readFileSync(join(out, 'courses', 'linux-essentials', 'index.html'), 'utf8');
    assert.match(course, /<span data-l="hr" lang="hr">Mreža<\/span><span data-l="en" lang="en">Networking<\/span>/);
    assert.match(course, /href="\.\.\/\.\.\/sims\/dhcp-dora\/index.html\?lang=hr"/, 'sims linked in the course language');
    assert.match(course, /data-lang-switch/);
  } finally {
    rmSync(dirname(out), { recursive: true, force: true });
  }
});

test('licences (AGPL §13): every page links the licence and the source; the licence texts and page are built', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'simdeck-licence-')), 'site');
  try {
    const r = build({ root: ROOT, out, drafts: true, log: () => {} });
    assert.ok(r.ok, r.errors.join());
    assert.equal(readFileSync(join(out, 'licences', 'AGPL-3.0.txt'), 'utf8'), readFileSync(join(ROOT, 'LICENSE'), 'utf8'));
    assert.match(readFileSync(join(out, 'licences', 'OFL-1.1.txt'), 'utf8'), /SIL OPEN FONT LICENSE Version 1\.1/);
    const index = readFileSync(join(out, 'index.html'), 'utf8');
    assert.match(index, /<footer><p class="h-licence">simdeck · <a href="licences\/AGPL-3\.0\.txt">AGPL-3\.0-or-later<\/a> · <a href="source\.tar\.gz">/);
    assert.match(index, /href="licences\/index\.html"/);
    const course = readFileSync(join(out, 'courses', 'linux-essentials', 'index.html'), 'utf8');
    assert.match(course, /href="\.\.\/\.\.\/source\.tar\.gz"/);
    const lic = readFileSync(join(out, 'licences', 'index.html'), 'utf8');
    assert.doesNotMatch(lic, /\{\{\w+\}\}/);
    assert.match(lic, /href="\.\.\/index\.html"/, 'back to the home page');
    assert.match(lic, /Atkinson Hyperlegible/);
    for (const e of r.entries) {
      const html = readFileSync(join(out, 'sims', e.id, 'index.html'), 'utf8');
      const m = /<script type="application\/json" id="simdeck-site">(.*?)<\/script>/.exec(html);
      assert.ok(m, `${e.id}: the kit's help gets the links`);
      assert.deepEqual(JSON.parse(m[1]), { licence: '../../licences/AGPL-3.0.txt', source: '../../source.tar.gz', licences: '../../licences/index.html' });
    }
  } finally {
    rmSync(dirname(out), { recursive: true, force: true });
  }
});

test('a public repo in site.json "source" becomes the sims\' source link as is', () => {
  const d = simDir({});
  const r = buildNative(page(), entry, { simDir: d, site: { source: 'https://git.example/simdeck' } });
  assert.match(r.html, /"source":"https:\/\/git\.example\/simdeck"/);
});
