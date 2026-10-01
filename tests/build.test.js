import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNative, build, scriptJson, KIT_MARKER } from '../scripts/build.mjs';

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
  const r = buildNative(page('<link rel="stylesheet" href="b.css">', '<script src="a.js"></script>'), entry, { simDir: d, kit: null });
  assert.deepEqual(r.errors, []);
  assert.match(r.html, /<style>\/\* b.css \*\/\nbody\{color:red\}<\/style>/);
  assert.match(r.html, /<script>\/\* a.js \*\/\nwindow.A = 1;<\/script>/);
  assert.doesNotMatch(r.html, /src="a.js"/);
});

test('refuses missing files and files outside the sim folder', () => {
  const d = simDir({});
  assert.match(buildNative(page('', '<script src="nope.js"></script>'), entry, { simDir: d }).errors.join(), /not found/);
  assert.match(buildNative(page('', '<script src="../x.js"></script>'), entry, { simDir: d }).errors.join(), /outside the sim's folder/);
});

test('refuses anything loaded from the network', () => {
  const d = simDir({});
  for (const bad of ['<script src="https://cdn.x/a.js"></script>', '<link rel="stylesheet" href="//fonts.x/c.css">', '<img src="http://x/a.png">', '<style>a{background:url(https://x/y.png)}</style>']) {
    assert.match(buildNative(page('', bad), entry, { simDir: d }).errors.join(), /network/, bad);
  }
  assert.deepEqual(buildNative(page('', '<a href="https://example.org">ok</a>'), entry, { simDir: d }).errors, []);
});

test('replaces the kit marker once, and rejects two', () => {
  const d = simDir({});
  const r = buildNative(page(KIT_MARKER), entry, { simDir: d, kit: '<style data-simdeck-kit>k</style>' });
  assert.match(r.html, /data-simdeck-kit/);
  assert.doesNotMatch(r.html, /simdeck:kit/);
  assert.match(buildNative(page(KIT_MARKER + KIT_MARKER), entry, { simDir: d, kit: '' }).errors.join(), /2 times/);
});

test('adds #simdeck-meta with the back link, safely escaped', () => {
  const d = simDir({});
  const r = buildNative(page(), entry, { simDir: d });
  const m = /<script type="application\/json" id="simdeck-meta">(.*?)<\/script>/.exec(r.html);
  assert.ok(m, 'meta block present');
  const meta = JSON.parse(m[1]);
  assert.equal(meta.title, 'X </script>');
  assert.equal(meta.index, '../../index.html');
  assert.equal(meta.steps, 3);
  assert.match(buildNative(page('<script type="application/json" id="simdeck-meta">{}</script>'), entry, { simDir: d }).errors.join(), /must not define/);
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
