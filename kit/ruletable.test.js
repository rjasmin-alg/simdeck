// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for kit view K4 (kit/ruletable.js): its pure evaluation modes, tie-breaks and spec checks, and its stylesheet
// section. Run: node --test 'kit/**/*.test.js'
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const rt = require('./ruletable.js');

const css = fs.readFileSync(path.join(__dirname, 'kit.css'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, 'ruletable.js'), 'utf8');
const ev = rt.evaluate;
/** Rows from a compact form: 'y' matches, 'n' does not, '.' not compared; effect a/d; rank from the list. */
const R = (hits, effects, ranks) => hits.split('').map((c, i) => ({
  hit: c === 'y' ? true : c === 'n' ? false : null,
  effect: effects ? (effects[i] === 'd' ? 'deny' : 'allow') : undefined,
  rank: ranks ? ranks[i] : undefined
}));

// ── tie-breaks first ──

test('tie-break, first match: of two matching rows the earlier wins, and every row below it is skipped', () => {
  const r = ev('first', R('nyny'), 3, true);
  assert.deepEqual(r.marks, ['no', 'win', 'skip', 'skip']);
  assert.deepEqual(r.win, [1]);
  assert.equal(r.implicit, 'skip');
});

test('tie-break, most specific: equal ranks, the earlier row wins', () => {
  const r = ev('specific', R('yyy', null, [2, 3, 3]), 2, true);
  assert.deepEqual(r.marks, ['beaten', 'win', 'beaten']);
  const s = ev('specific', R('yy', null, [1, 1]), 1, true);
  assert.deepEqual(s.win, [0]);
});

test('tie-break, deny wins: a matching deny beats every allow wherever it stands; several denies all win', () => {
  assert.deepEqual(ev('deny', R('yyy', 'aad'), 2, true).marks, ['beaten', 'beaten', 'win']);
  assert.deepEqual(ev('deny', R('yyny', 'dadd'), 3, true).marks, ['win', 'beaten', 'no', 'win']);
});

test('tie-break, deny wins: with no matching deny, every matching allow wins (allows add up); no effect counts as allow', () => {
  const r = ev('deny', R('yny', 'ada'), 2, true);
  assert.deepEqual(r.marks, ['win', 'no', 'win']);
  assert.deepEqual(ev('deny', [{ hit: true }, { hit: true }], 1, true).win, [0, 1]);
});

test('tie-break: a rank that is not a number counts as 0', () => {
  assert.deepEqual(ev('specific', [{ hit: true, rank: 0.5 }, { hit: true }], 1, true).win, [0]);
  assert.deepEqual(ev('specific', [{ hit: true, rank: -1 }, { hit: true, rank: '9' }], 1, true).win, [1]);
});

// ── the modes ──

test('first: the winner is known at once, before done; rows below the pointer are pending until then', () => {
  const r = ev('first', R('ny..'), 1, false);
  assert.deepEqual(r.marks, ['no', 'win', 'skip', 'skip']);
  assert.equal(r.decided, false, 'the outcome waits for done');
  assert.deepEqual(ev('first', R('nn..'), 1, false).marks, ['no', 'no', 'pending', 'pending']);
});

test('first: a match result below the pointer is not read yet', () => {
  assert.deepEqual(ev('first', R('nnyy'), 1, false).marks, ['no', 'no', 'pending', 'pending']);
});

test('first: the implicit row wins only when the pointer reaches it', () => {
  assert.equal(ev('first', R('nnn'), 2, false).implicit, 'pending');
  assert.equal(ev('first', R('nnn'), 3, true).implicit, 'win');
  assert.equal(ev('first', R('nnn'), 9, true).implicit, 'win', 'a pointer past the end is the implicit row');
  assert.equal(ev('first', R('nyn'), 3, true).implicit, 'skip');
});

test('specific and deny: every row is read (nothing skipped); matches stay candidates (hit) until done', () => {
  for (const mode of ['specific', 'deny']) {
    const r = ev(mode, R('yny', 'ada', [1, 2, 3]), 2, false);
    assert.deepEqual(r.marks, ['hit', 'no', 'hit'], mode);
    assert.deepEqual(r.win, [], mode);
    assert.equal(r.implicit, 'pending', mode);
  }
});

test('specific: the highest rank wins regardless of order', () => {
  assert.deepEqual(ev('specific', R('yyy', null, [3, 1, 2]), 2, true).win, [0]);
  assert.deepEqual(ev('specific', R('yyy', null, [1, 2, 3]), 2, true).win, [2]);
});

test('specific and deny: no match at all, the implicit row wins when done', () => {
  assert.equal(ev('specific', R('nn'), 1, true).implicit, 'win');
  assert.equal(ev('deny', R('nn'), 1, true).implicit, 'win');
  assert.equal(ev('deny', R('yn'), 1, true).implicit, 'skip');
});

test('the same rows give three different winners in the three modes (the §5.1 contrast)', () => {
  const rows = R('yyy', 'ada', [1, 3, 2]);
  assert.deepEqual(ev('first', rows, 2, true).win, [0]);
  assert.deepEqual(ev('specific', rows, 2, true).win, [1]);
  assert.deepEqual(ev('deny', rows, 2, true).win, [1]);
  const rows2 = R('yyy', 'aad', [1, 3, 2]);
  assert.deepEqual(ev('deny', rows2, 2, true).win, [2]);
});

test("at 'all' (an explorer): every row is read, the implicit row too", () => {
  assert.deepEqual(ev('first', R('nny'), 'all', true).marks, ['no', 'no', 'win']);
  assert.equal(ev('first', R('nnn'), 'all', true).implicit, 'win');
  assert.deepEqual(ev('specific', R('yny', null, [1, 0, 2]), 'all', true).marks, ['beaten', 'no', 'win']);
  assert.ok(rt.checkSpec({ columns: [{ key: 'a' }], rows: [], at: 'some' })[0].includes('row index or "all"'));
});

test('no pointer: nothing is read', () => {
  const r = ev('first', R('yy'), -1, false);
  assert.deepEqual(r.marks, ['pending', 'pending']);
  assert.equal(r.implicit, 'pending');
  assert.deepEqual(ev('first', R('yy'), null, false).marks, ['pending', 'pending']);
});

test("a row's own mark overrides the mode (a page with its own rule), and win lists it", () => {
  const rows = R('yyn');
  rows[1].mark = 'win';
  rows[0].mark = 'hit';
  const r = ev('first', rows, 2, true);
  assert.deepEqual(r.marks, ['hit', 'win', 'skip']);
  assert.deepEqual(r.win, [1]);
});

test('evaluate is pure: it does not change its input', () => {
  const rows = R('yny', 'ada', [1, 2, 3]);
  const copy = JSON.parse(JSON.stringify(rows));
  ev('deny', rows, 2, true);
  ev('first', rows, 2, true);
  assert.deepEqual(rows, copy);
});

// ── spec checks ──

test('checkSpec: a good spec has no problems', () => {
  assert.deepEqual(rt.checkSpec({
    mode: 'first', columns: [{ key: 'src' }, { key: 'dst' }], extra: [{ key: 'so' }],
    rows: [{ cells: { src: 'any', so: 'x' }, hit: false, miss: ['src'] }, { hit: true, effect: 'deny' }],
    implicit: { text: 'x', effect: 'deny' }, at: 2
  }), []);
});

test('checkSpec: finds unknown modes, columns, effects, marks, bad miss, missing ranks and a pointer past the end', () => {
  const p = rt.checkSpec({
    mode: 'last', columns: [{ key: 'a' }, { key: 'a' }, {}],
    rows: [{ cells: { b: 1 }, hit: 'yes', effect: 'block', mark: 'won' }, { hit: true, miss: ['a', 'z'] }],
    at: 2
  }).join('\n');
  for (const s of ['unknown mode "last"', 'column "a" twice', 'a column has no key', 'unknown column "b"', 'hit is true, false or null',
    'unknown effect "block"', 'unknown mark "won"', 'unknown column "z"', 'not a "no"', 'past the last row']) {
    assert.ok(p.includes(s), s);
  }
  assert.ok(rt.checkSpec({ rows: [] }).includes('no columns'));
  assert.ok(rt.checkSpec({ mode: 'specific', columns: [{ key: 'a' }], rows: [{ hit: true }] })[0].includes('needs a rank'));
  assert.deepEqual(rt.checkSpec({ columns: [{ key: 'a' }], rows: [{ hit: false }], implicit: { text: 'x' }, at: 1 }), [], 'at the implicit row');
});

// ── the stylesheet and the source ──

test('kit.css has the K4 section: marks carried by shape, the implicit row, the legend swatches, the phone rule', () => {
  for (const sel of ["tr[data-mark='win']", "tr[data-mark='hit']", "tr[data-mark='beaten']", "tr[data-mark='skip']", 'tr.sd-rt-implicit',
    '.sd-rt-miss::before', '.sd-rt-verdict[data-ok=\'true\']', "[data-shape='rt-win']", "[data-shape='rt-skip']", "[data-shape='rt-beaten']",
    "[data-shape='rt-no']", "[data-shape='rt-hit']", "[data-shape='rt-warn']", "[data-shape='rt-verdict']", '.sd-rt-scroll { overflow-x: auto']) {
    assert.ok(css.includes(sel), sel);
  }
  const sec = css.slice(css.indexOf('view K4'), css.indexOf('small screens: stack'));
  assert.ok(!/#[0-9a-f]{3,8}\b|rgb\(/i.test(sec), 'no colour literals: tokens only');
  assert.ok(!/\d+px/.test(sec.replace(/@media[^{]*/g, '')), 'sizes in rem');
});

test('the view holds no words, no SVG and no timers', () => {
  const view = src.slice(src.indexOf('// ── view ──'));
  assert.ok(!/<svg|viewBox|createElementNS/.test(view));
  assert.ok(!/setTimeout|setInterval|Math\.random|Date/.test(src));
  // the only literals with letters are class names, attribute and tag names, mode names and the console message
  const literals = view.match(/'[^'\n]*'/g).filter((s) => /[A-Za-zčćšžđ]/.test(s));
  literals.forEach((s) => assert.ok(/^' ?[a-z][a-z0-9 -]*'$/.test(s) || s.startsWith("'[simdeck]"), 'a word in the view: ' + s));
});
