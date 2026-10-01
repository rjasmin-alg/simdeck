import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNative, build, scriptJson } from '../scripts/build.mjs';

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
  assert.match(buildNative(page('', '<script src="../x.js"></script>'), entry, { simDir: d }).errors.join(), /outside the sim's folder and the kit/);
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
    assert.match(buildNative(src, entry, { simDir, kitDir: null }).errors.join(), /outside the sim's folder and the kit/);
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
    const index = readFileSync(join(out, 'index.html'), 'utf8');
    assert.doesNotMatch(index, /\{\{\w+\}\}/, 'all template variables filled');
    assert.doesNotMatch(index, /application\/json/, 'no data blob: the home page is plain HTML');
    assert.doesNotMatch(index, /(src|href)="\//, 'no root-absolute links: the folder can move');
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
