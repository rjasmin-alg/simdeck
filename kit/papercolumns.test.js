// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for kit view K5 (kit/papercolumns.js): its pure parts (digits in any base, where a row's cells go, the layout
// of the paper, spec checks, which audience a page shows) and its stylesheet section.
// Run: node --test 'kit/**/*.test.js'
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pc = require('./papercolumns.js');

const css = fs.readFileSync(path.join(__dirname, 'kit.css'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, 'papercolumns.js'), 'utf8');
const places = (r) => pc.rowCells(r).map((x) => [x.k, typeof x.cell === 'object' ? x.cell.text : x.cell]);

// ── tie-breaks first ──

test('tie-break, digits: 0 is one digit 0, in every base', () => {
  for (let b = 2; b <= 16; b++) {
    assert.deepEqual(pc.digits(0, b), [0], `base ${b}`);
    assert.equal(pc.numeral(0, b), '0', `base ${b}`);
  }
});

test('tie-break, digits: a value equal to the base is "10" (it reaches the next place), one less is one digit', () => {
  for (let b = 2; b <= 16; b++) {
    assert.equal(pc.numeral(b, b), '10', `base ${b}`);
    assert.equal(pc.numeral(b - 1, b), pc.DIGITS[b - 1], `base ${b}`);
  }
});

test('tie-break, cells: null, undefined and "" leave a square empty; 0 and "0" are digits', () => {
  assert.deepEqual(places({ cells: [0, null, '', undefined, '0', { text: '' }, { text: 0 }] }), [[0, 0], [4, '0'], [6, 0]]);
});

test('tie-break, text: a space leaves its square empty but still takes its place', () => {
  assert.deepEqual(places({ text: '4 7' }), [[2, '4'], [0, '7']]);
});

test('tie-break, audience: the URL wins over the stored choice; an unknown value in either is ignored', () => {
  assert.equal(pc.audienceOf('?audience=child', 'adult'), 'child');
  assert.equal(pc.audienceOf('?audience=pupil', 'adult'), 'adult', 'unknown in the URL: the stored choice');
  assert.equal(pc.audienceOf('?audience=pupil', 'pupil'), 'teacher', 'unknown in both: the default');
  assert.equal(pc.audienceOf('', null), 'teacher', 'nothing: teacher, the first value');
  assert.equal(pc.audienceOf('?lang=en&audience=adult&step=3', undefined), 'adult', 'among other keys');
});

// ── digits in any base ──

test('digits: by place, ones first; numerals use 0–9 then A–F', () => {
  assert.deepEqual(pc.digits(457, 10), [7, 5, 4]);
  assert.deepEqual(pc.digits(935, 16), [7, 10, 3]);
  assert.equal(pc.numeral(935, 16), '3A7');
  assert.equal(pc.numeral(1440, 16), '5A0');
  assert.equal(pc.numeral(18, 2), '10010');
  assert.equal(pc.numeral(255, 16), 'FF');
  assert.equal(pc.numeral(64, 8), '100');
  assert.equal(pc.DIGITS, '0123456789ABCDEF');
  assert.deepEqual(pc.digits(457), [7, 5, 4], 'base 10 by default');
});

test('digits: every value round-trips through its numeral in every base', () => {
  for (let b = 2; b <= 16; b++) {
    for (const v of [1, 7, 15, 16, 255, 256, 999999999, 2 ** 40 + 3]) {
      assert.equal(parseInt(pc.numeral(v, b), b), v, `${v} in base ${b}`);
      assert.equal(pc.digits(v, b).length, pc.numeral(v, b).length);
      assert.ok(pc.digits(v, b).every((d) => d >= 0 && d < b));
    }
  }
});

// ── where cells go ──

test('cells: indexed by place from at (0 = the ones); at shifts a partial product left', () => {
  assert.deepEqual(places({ cells: ['7', '5', '4'] }), [[0, '7'], [1, '5'], [2, '4']]);
  assert.deepEqual(places({ cells: ['1', '7', '3', '1'], at: 1 }), [[1, '1'], [2, '7'], [3, '3'], [4, '1']]);
});

test('text: left to right, one character per square, its last character at place at (right of the ones when negative)', () => {
  assert.deepEqual(places({ text: '846:3=282', at: -6 }),
    [[2, '8'], [1, '4'], [0, '6'], [-1, ':'], [-2, '3'], [-3, '='], [-4, '2'], [-5, '8'], [-6, '2']]);
  assert.deepEqual(places({ text: '24', at: 1 }), [[2, '2'], [1, '4']]);
});

// ── layout ──

test('layout: columns from the widest row, a sign column when a row has a sign, place k at grid column sign + cols - k', () => {
  const L = pc.layout({ rows: [{ kind: 'carry', cells: [null, '1'] }, { cells: ['7', '5', '4'] }, { cells: ['8', '6', '3'], sign: '+' }, { kind: 'result', rule: true, cells: [] }] });
  assert.equal(L.cols, 3);
  assert.equal(L.right, 0);
  assert.equal(L.sign, 1);
  assert.deepEqual([L.gc(0), L.gc(1), L.gc(2)], [4, 3, 2], 'ones in the last square, the sign in column 1');
  assert.equal(L.lastSquare, 4);
  assert.equal(L.aside, 0, 'no aside column');
  assert.equal(L.first, 1, 'no place row: rows[0] is grid row 1');
});

test('layout: cols given keeps room for digits not written yet (the final carry); places push the rows down one', () => {
  const L = pc.layout({ cols: 4, places: ['J', 'D', 'S', 'T'], rows: [{ cells: ['7', '5', '4'] }] });
  assert.equal(L.cols, 4);
  assert.equal(L.sign, 0, 'no sign anywhere: no sign column');
  assert.equal(L.gc(0), 4);
  assert.equal(L.first, 2);
});

test('layout: squares right of the ones for the division line; the band and the aside', () => {
  const L = pc.layout({ rows: [{ text: '846:3=282', at: -6 }, { text: '24', at: 1, aside: 'r' }], band: [1] });
  assert.equal(L.cols, 3);
  assert.equal(L.right, 6);
  assert.equal(L.gc(2), 1);
  assert.equal(L.gc(-6), 9);
  assert.equal(L.lastSquare, 9);
  assert.equal(L.aside, 10, 'the aside column after the last square');
  assert.equal(pc.layout({ rows: [{ cells: ['1'] }], asideHead: 'x' }).aside, 2, 'a head alone makes the column');
});

test('layout: a band on a place no row reaches still widens the paper', () => {
  assert.equal(pc.layout({ rows: [{ cells: ['1'] }], band: [{ k: 3 }] }).cols, 4);
});

// ── spec checks ──

test('checkSpec: a good spec has no problems (addition, partial products, division, subtraction marks)', () => {
  assert.deepEqual(pc.checkSpec({ cols: 4, places: ['J', 'D', 'S', 'T'], band: [0, { k: 1, from: 1, to: 2 }],
    rows: [{ kind: 'carry', cells: [null, { text: '1', now: true, label: 'carry 1' }] }, { cells: ['7', '5', '4'] },
      { cells: ['8', '6', '3'], sign: '+', aside: '= 368' }, { kind: 'result', rule: true, cells: ['5', { text: '2', x: 'wrong' }] }], asideHead: 'dec' }), []);
  assert.deepEqual(pc.checkSpec({ rows: [{ text: '457·36' }, { text: '1371', at: 1 }, { text: '2742', sign: '+' }, { kind: 'result', rule: { from: 4, to: 0 }, text: '16452' }] }), []);
  assert.deepEqual(pc.checkSpec({ rows: [{ text: '846:3=282', at: -6 }, { text: '24', at: 1 }, { text: '06' }, { text: '0' }], band: [{ k: 1, from: 0, to: 1 }] }), []);
  assert.deepEqual(pc.checkSpec({ rows: [{ kind: 'carry', cells: ['12', '3'] }, { cells: [{ text: '2', x: true }, { text: '4', x: true }, '5'] },
    { cells: ['7', { text: '1', tag: '+1' }], sign: '−' }, { kind: 'result', rule: true, cells: ['5', '2', '4'] }] }), []);
});

test('checkSpec: lists every problem', () => {
  assert.deepEqual(pc.checkSpec({}), ['no rows']);
  const p = pc.checkSpec({ cols: 2, places: ['a', 'b', 'c'], band: [5, { k: 0, from: 1, to: 9 }, {}],
    rows: [{ kind: 'sum', cells: ['1'] }, { text: '12', cells: ['1'] }, { cells: ['1', '2', '3'] }, { cells: [{ text: '1', x: 'yes' }] },
      { cells: ['1'], rule: { from: 0, to: 1 } }, { cells: ['1'], rule: { from: 7, to: 0 } }, { text: 5 }, { cells: ['1'], at: 0.5 }] });
  const has = (re) => assert.ok(p.some((x) => re.test(x)), `${re} in ${JSON.stringify(p, null, 1)}`);
  has(/row 0: unknown kind "sum"/);
  has(/row 1: give text or cells, not both/);
  has(/row 2: a cell at place 2 is off the paper/);
  has(/row 3, place 0: x is true, false or "wrong"/);
  has(/row 4: rule needs from ≥ to/);
  has(/row 5: rule 7…0 runs off the paper/);
  has(/row 6: text is a string/);
  has(/row 7: at is a whole number/);
  has(/band 0: place 5 is off the paper/);
  has(/band 1: rows 1…9 are not rows of the paper/);
  has(/band 2: no place k/);
  has(/places has 3 labels for 2 columns/);
});

// ── the view's source and stylesheet ──

test('every localStorage access is inside a try (the page works without storage)', () => {
  const lines = src.split('\n').filter((l) => /localStorage\./.test(l));
  assert.ok(lines.length >= 2, 'reads and writes the choice');
  for (const l of lines) assert.match(l, /try \{/, l.trim());
});

test('the shared storage key is one for all ari- pages', () => {
  assert.equal(pc.AUDIENCE_KEY, 'simdeck.ari.audience');
  assert.deepEqual(pc.AUDIENCES, ['teacher', 'adult', 'child'], 'teacher first: the default');
});

test('stylesheet: the K5 section exists and every var(--x) it uses is defined in kit.css', () => {
  const start = css.indexOf('/* ── view K5: paper columns');
  assert.ok(start > 0, 'section present');
  const end = css.indexOf('/* ── view K3', start);   // K5 sits just before K3
  const sec = css.slice(start, end);
  for (const cls of ['.sd-paper-box', '.sd-paper', '.sd-pc-c', '.sd-pc-pl', '.sd-pc-small', '.sd-pc-res', '.sd-pc-sign', '.sd-pc-wide',
    '.sd-pc-band', '.sd-pc-rule', '.sd-pc-x', '.sd-pc-x--wrong', '.sd-pc-tag', '.sd-pc-aside', '.sd-pc-asidebg', '.sd-pc-aud', "data-shape='pc-band'", "data-shape='pc-carry'"]) {
    assert.ok(sec.includes(cls), cls);
  }
  const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  for (const v of ['--pc-w', '--pc-xw', '--pc-h']) {   // set by the view on the element, from the spec
    assert.ok(src.includes(`'${v}'`), `${v} is set by the view`);
    defined.add(v);
  }
  for (const m of sec.matchAll(/var\((--[\w-]+)(\s*,)?/g)) {
    if (m[2]) continue;   // has a fallback
    assert.ok(defined.has(m[1]), `${m[1]} is defined`);
  }
  for (const m of sec.matchAll(/font-size:\s*([^;}]+)/g)) {
    assert.ok(/max\(16px|var\(--fs-|calc\(var\(--pc-cell\) \* 0\.[67]\)/.test(m[1]), `font-size ${m[1]} keeps the 16 px floor or is a digit`);
  }
  assert.ok(!/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i.test(sec), 'kit tokens only');
});
