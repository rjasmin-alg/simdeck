// Tests for the kit's pure core and its stylesheet. Run: node --test 'kit/**/*.test.js'
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const kit = require('./kit.js');

const css = fs.readFileSync(path.join(__dirname, 'kit.css'), 'utf8');

test('rng is deterministic per seed and in range', () => {
  const a = kit.rng(42), b = kit.rng(42), c = kit.rng(43);
  const xs = Array.from({ length: 100 }, () => a());
  assert.deepEqual(xs, Array.from({ length: 100 }, () => b()));
  assert.notDeepEqual(xs, Array.from({ length: 100 }, () => c()));
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  const r = kit.rng(7);
  assert.ok(Array.from({ length: 200 }, () => r.int(6)).every((x) => Number.isInteger(x) && x >= 0 && x < 6));
});

test('stateAt replays step n with n = 1..N', () => {
  const def = { initial: () => ({ seen: [] }), step: (s, n) => ({ seen: s.seen.concat(n) }) };
  assert.deepEqual(kit.stateAt(def, {}, 0), { seen: [] });
  assert.deepEqual(kit.stateAt(def, {}, 3), { seen: [1, 2, 3] });
});

test('defaultsOf takes spec values, then def.defaults; skips buttons', () => {
  const def = { params: [{ key: 'a', type: 'range', value: 1 }, { key: 'b', type: 'toggle', value: false }, { type: 'button', label: 'x' }], defaults: { b: true } };
  assert.deepEqual(kit.defaultsOf(def), { a: 1, b: true });
});

test('stepsOf accepts a number or a function of params', () => {
  assert.equal(kit.stepsOf({ steps: 12 }, {}), 12);
  assert.equal(kit.stepsOf({ steps: (p) => p.k * 2 }, { k: 4 }), 8);
  assert.equal(kit.stepsOf({}, {}), 0);
});

// ── stylesheet rules ──

const tokenBlock = (marker) => {
  const i = css.indexOf(marker);
  return new Set([...css.slice(i, css.indexOf('/* end tokens */', i)).matchAll(/(--[\w-]+):/g)].map((m) => m[1]));
};

test('dark theme redefines every light colour token', () => {
  const light = tokenBlock('/* tokens:light */');
  const dark = tokenBlock('/* tokens:dark */');
  assert.ok(light.size >= 20);
  assert.deepEqual([...light].filter((t) => !dark.has(t)), []);
  assert.deepEqual([...dark].filter((t) => !light.has(t)), []);
});

function undefinedVars(sources) {
  const all = sources.join('\n');
  const defined = new Set([...all.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  // Custom properties set from script, e.g. style: { '--bits': ... }
  for (const m of all.matchAll(/'(--[\w-]+)'\s*:/g)) defined.add(m[1]);
  return [...new Set([...all.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))].filter((v) => !defined.has(v));
}

test('every var(--x) in the kit and template is defined', () => {
  const page = fs.readFileSync(path.join(__dirname, 'template', 'index.html'), 'utf8');
  assert.deepEqual(undefinedVars([css, page]), []);
});

test('the undefined-var check can fail', () => {
  assert.deepEqual(undefinedVars([':root{--a:1} x{color:var(--a);background:var(--nope)}']), ['--nope']);
});

test('palette contrast passes in both themes (kit/tools/contrast.mjs)', () => {
  execFileSync(process.execPath, [path.join(__dirname, 'tools', 'contrast.mjs')], { stdio: 'pipe' });
});

test('no font size under the 16 px floor in kit.css', () => {
  // px sizes must be >= 16; rem/em sizes are checked in the browser (kit/tools/check-page.mjs).
  const bad = [...css.matchAll(/font-size:\s*([\d.]+)px/g)].filter((m) => Number(m[1]) < 16);
  assert.deepEqual(bad.map((m) => m[0]), []);
});
