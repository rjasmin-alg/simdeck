// SPDX-License-Identifier: AGPL-3.0-or-later
// The pure parts of the contract checks (lib/contract.mjs), each fed a bad sample it must catch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULES, applyExceptions, colourLiterals, exceptionProblems, gateDir, outsideScope, pageCss, undefinedVars } from '../lib/contract.mjs';

test('undefinedVars: catches a var(--x) nobody defines; CSS and script definitions count', () => {
  assert.deepEqual(undefinedVars([':root{--a:1} x{color:var(--a);background:var(--nope)}']), ['--nope']);
  assert.deepEqual(undefinedVars(['x{width:calc(var(--bits) * 2)}', "h('div', { style: { '--bits': '4' } })"]), []);
  assert.deepEqual(undefinedVars(["el.style.setProperty('--w', 3); x{width:var(--w)}"]), []);
  assert.deepEqual(undefinedVars(['x{color:var( --spaced )}']), ['--spaced']);
});

test('colourLiterals: hex and colour functions in declarations fail; tokens, selectors and url(#…) pass', () => {
  assert.deepEqual(colourLiterals('a{color:#f00}'), ['color: #f00']);
  assert.equal(colourLiterals('a{background: rgb(0 0 0 / 50%)} b{border:1px solid hsl(0 0% 0%)} c{fill:oklch(0.5 0.1 20)}').length, 3);
  assert.equal(colourLiterals('a{box-shadow: 0 0 0 2px #00000080}').length, 1);
  assert.deepEqual(colourLiterals('#add:hover{color:var(--c1)} #face{fill:url(#fade)} /* #fff */ a{color:currentColor}'), []);
  assert.deepEqual(colourLiterals('[data-sim="x"] .a { color: var(--muted); grid-area: 1 / 2 }'), []);
});

test('pageCss: only the page\'s own style blocks', () => {
  assert.equal(pageCss('<link rel="stylesheet" href="k.css"><style>a{}</style><p>x</p><style media="print">b{}</style>'), 'a{}\nb{}');
});

test('outsideScope: anything not under the sim\'s folder, renames as two paths, de-duplicated', () => {
  const changed = ['sims/a/sim.js', 'sims/a/index.html', 'sims/ab/sim.js', 'kit/kit.css', 'kit/kit.css', ''];
  assert.deepEqual(outsideScope(changed, 'sims/a/'), ['kit/kit.css', 'sims/ab/sim.js']);
  assert.deepEqual(outsideScope(['sims/a/x'], 'sims/a/'), []);
  // A file moved out of the folder shows up (with --no-renames) as a deletion inside and an addition outside.
  assert.deepEqual(outsideScope(['sims/a/model.js', 'models/model.js'], 'sims/a/'), ['models/model.js']);
});

test('exceptionProblems: unknown rules, rules that cannot be waived, duplicates', () => {
  assert.deepEqual(exceptionProblems([{ rule: 'one-screen', why: 'poster' }]), []);
  assert.match(exceptionProblems([{ rule: 'fit', why: 'x' }])[0], /unknown rule "fit"/);
  for (const r of ['manifest', 'tests', 'offline', 'scope', 'kit']) assert.match(exceptionProblems([{ rule: r, why: 'x' }])[0], /cannot be waived/);
  assert.match(exceptionProblems([{ rule: 'keys', why: 'a' }, { rule: 'keys', why: 'b' }]).join(), /declared twice/);
});

test('applyExceptions: a declared rule waives its failing checks only; unused and non-waivable are not waivers', () => {
  const results = [
    { rule: 'one-screen', ok: false }, { rule: 'one-screen', ok: false }, { rule: 'keys', ok: false },
    { rule: 'motion', ok: true }, { rule: 'scope', ok: false },
  ];
  const r = applyExceptions(results, [{ rule: 'one-screen', why: 'x' }, { rule: 'motion', why: 'y' }, { rule: 'scope', why: 'z' }]);
  assert.deepEqual(r.waived, { 'one-screen': 2 });
  assert.deepEqual(r.failed.map((x) => x.rule), ['keys', 'scope']);
  assert.deepEqual(r.unused, ['motion']);
  assert.equal(applyExceptions(results, []).failed.length, 4);
});

test('every rule says whether it can be waived and what it checks', () => {
  for (const [k, v] of Object.entries(RULES)) {
    assert.equal(typeof v.waivable, 'boolean', k);
    assert.ok(v.what.length > 10, k);
  }
});

test('gateDir: stable per checkout and sim, different for two worktrees', () => {
  assert.equal(gateDir('/w/a', 'x'), gateDir('/w/a', 'x'));
  assert.notEqual(gateDir('/w/a', 'x'), gateDir('/w/b', 'x'));
  assert.notEqual(gateDir('/w/a', 'x'), gateDir('/w/a', 'y'));
});
