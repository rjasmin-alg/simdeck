// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for kit view K3 (kit/blockgrid.js): its pure parts (spec checks, the space counter, splitting a long row, the
// arrow routes and their tie-breaks) and its stylesheet section. Run: node --test 'kit/**/*.test.js'
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const bg = require('./blockgrid.js');

const css = fs.readFileSync(path.join(__dirname, 'kit.css'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, 'blockgrid.js'), 'utf8');
/** Cells from a compact form: '.' free, 'f' fill, 's' soft, 'd' dead, 'b' bad, 'g' ghost. */
const K = { '.': undefined, f: 'fill', s: 'soft', d: 'dead', b: 'bad', g: 'ghost' };
const cells = (str, c) => str.split('').map((ch) => ({ kind: K[ch], c }));
const box = (left, top, width, height) => ({ left, top, width, height });

// ── tie-breaks first ──

test('tie-break, route: boxes side by side (vertical overlap) go over the top, never under', () => {
  const r = bg.route(box(0, 100, 40, 40), box(200, 110, 40, 40), 20);
  assert.deepEqual(r.points, [[20, 100], [20, 82], [220, 82], [220, 110]], 'lift 0.9 rem above the higher box');
  assert.deepEqual(r.dir, [0, 1], 'the head points down into the target');
  const back = bg.route(box(200, 110, 40, 40), box(0, 100, 40, 40), 20);
  assert.equal(back.points[1][1], 82, 'the same way back');
});

test('tie-break, route: a box exactly touching the one below counts as below (an elbow, not the arc over the top)', () => {
  const r = bg.route(box(0, 0, 40, 40), box(100, 40, 40, 40), 16);
  assert.deepEqual(r.points[0], [20, 40]);
  assert.deepEqual(r.tip, [120, 40]);
  assert.ok(r.points.every((p) => p[1] >= 40), 'stays between the boxes');
});

test('tie-break, space: refs decide shared when given; without refs a soft cell is shared', () => {
  const s = bg.space([{ cells: [{ kind: 'soft', refs: 1 }, { kind: 'fill', refs: 2 }, { kind: 'soft' }, { kind: 'fill' }, { kind: 'dead', refs: 3 }] }]);
  assert.equal(s.shared, 3, 'soft with refs 1 is not shared; fill with refs 2 is; soft without refs is');
});

test('tie-break, split: a span cut at a line end keeps its label on the first piece only', () => {
  const rows = bg.split({ id: 'p', cells: cells('ffffff'), spans: [{ from: 2, len: 3, label: '7', now: true }] }, 4);
  assert.deepEqual(rows[0].spans, [{ from: 2, len: 2, label: '7', now: true, open: 'end' }]);
  assert.deepEqual(rows[1].spans, [{ from: 0, len: 1, now: true, open: 'start' }]);
});

// ── route ──

test('route: down and up are elbows with the level run just beside the target, or halfway in a small gap; a straight drop has no level run', () => {
  const down = bg.route(box(0, 0, 40, 20), box(100, 60, 40, 20), 16);
  assert.deepEqual(down.points, [[20, 20], [20, 54.4], [120, 54.4], [120, 60]], '0.35 rem above the target, past the rows between');
  assert.deepEqual(down.dir, [0, 1]);
  assert.deepEqual(bg.route(box(0, 0, 40, 20), box(100, 26, 40, 20), 16).points[1], [20, 23], 'halfway when the gap is under 0.7 rem');
  const up = bg.route(box(100, 60, 40, 20), box(0, 0, 40, 20), 16);
  assert.deepEqual(up.points, [[120, 60], [120, 25.6], [20, 25.6], [20, 20]]);
  assert.deepEqual(up.dir, [0, -1]);
  const drop = bg.route(box(0, 0, 40, 20), box(0, 60, 40, 20), 16);
  assert.deepEqual(drop.points, [[20, 20], [20, 60]]);
  assert.deepEqual(drop.tip, [20, 60]);
});

test('route: the lift scales with the rem size', () => {
  assert.equal(bg.route(box(0, 50, 10, 10), box(30, 50, 10, 10), 30).points[1][1], 50 - 27);
  assert.equal(bg.route(box(0, 50, 10, 10), box(30, 50, 10, 10)).points[1][1], 50 - 0.9 * 16, 'default 16 px');
});

// ── space ──

test('space: counts each kind; used is fill, soft, dead and bad, not free or ghost; colours count used cells per owner', () => {
  const s = bg.space([{ cells: cells('ff.s', 1) }, { cells: cells('dbg.', 2) }, { cells: [null, {}, null] }]);
  assert.equal(s.total, 9, 'a null cell is a hole, not counted');
  assert.equal(s.free, 3, 'cells without a kind are free');
  assert.equal(s.used, 5);
  assert.deepEqual(s.kinds, { free: 3, fill: 2, soft: 1, dead: 1, bad: 1, ghost: 1 });
  assert.deepEqual(s.colours, { 1: 3, 2: 2 });
  assert.deepEqual(bg.space([]), { total: 0, free: 0, used: 0, shared: 0, kinds: { free: 0, fill: 0, soft: 0, dead: 0, bad: 0, ghost: 0 }, colours: {} });
});

// ── split ──

test('split: rows of n cells, ids id/line, label and aside on the first line only, brackets cut like spans', () => {
  const rows = bg.split({ id: 'pool', label: 'P', aside: '9', cells: cells('ffff.ssss.'), brackets: [{ from: 3, len: 5, label: 'w' }] }, 4);
  assert.deepEqual(rows.map((r) => r.id), ['pool/0', 'pool/1', 'pool/2']);
  assert.deepEqual(rows.map((r) => r.cells.length), [4, 4, 2]);
  assert.equal(rows[0].label, 'P');
  assert.equal(rows[1].label, undefined);
  assert.equal(rows[2].aside, undefined);
  assert.deepEqual(rows.map((r) => r.brackets), [[{ from: 3, len: 1, label: 'w', open: 'end' }], [{ from: 0, len: 4, open: 'start' }], []]);
});

test('split: a span inside one line is unchanged; spans list absent stays absent; an empty row gives one line', () => {
  const rows = bg.split({ cells: cells('ffffffff'), spans: [{ from: 4, len: 4, label: '2' }] }, 4);
  assert.deepEqual(rows[0].spans, []);
  assert.deepEqual(rows[1].spans, [{ from: 0, len: 4, label: '2' }]);
  assert.equal(bg.split({ cells: cells('ff') }, 4)[0].spans, undefined);
  assert.equal(bg.split({ cells: [] }, 4).length, 1);
});

test('split is pure: it does not change its input', () => {
  const row = { id: 'x', cells: cells('fffff'), spans: [{ from: 1, len: 4, label: 'a' }] };
  const copy = structuredClone(row);
  bg.split(row, 2);
  assert.deepEqual(row, copy);
});

// ── spec checks ──

test('checkSpec: a good spec has no problems', () => {
  assert.deepEqual(bg.checkSpec({
    rows: [
      { id: 'a', label: 'A', cells: [{ kind: 'fill', mark: 'under', now: true }, { kind: 'soft', now: 'gap', mark: 'gap' }, {}], spans: [{ from: 0, len: 3, style: 'dashed' }], brackets: [] },
      { id: 'b', offset: 2, cells: [{ kind: 'ghost' }, { kind: 'dead' }, { kind: 'bad' }], brackets: [{ from: 3, len: 2 }] }
    ],
    links: [{ from: { row: 'a', cell: 0 }, to: { row: 'b', cell: 2 } }, { from: { row: 1 }, to: { row: 'a' }, style: 'dotted' }],
    cols: 5
  }), []);
});

test('checkSpec: finds unknown kinds, marks and styles, bad ranges, duplicate ids, narrow cols and broken links', () => {
  const p = bg.checkSpec({
    rows: [
      { id: 'a', cells: [{ kind: 'used', mark: 'x', now: 'yes' }, {}], spans: [{ from: 1, len: 2 }, { from: -1, len: 1, style: 'wavy' }], brackets: [{ from: 0 }] },
      { id: 'a', cells: [{}] }
    ],
    cols: 1,
    links: [{ from: { row: 'z', cell: 0 }, to: { row: 'a', cell: 5 }, style: 'thick' }, { from: { row: 0, cell: 1 }, to: { row: 0, cell: 1 } }, { to: { row: 0 } }]
  }).join('\n');
  for (const s of ['unknown kind "used"', 'unknown mark "x"', 'now is true, false or "gap"', 'span 1+2 runs past the row', 'span needs from',
    'unknown span style "wavy"', 'bracket needs from', 'row id "a" twice', 'cols 1 is less than the widest row (2)', 'unknown row "z"',
    'cell 5 is not in row', 'unknown style "thick"', 'from and to are the same', 'link 2: no from']) {
    assert.ok(p.includes(s), s);
  }
  assert.deepEqual(bg.checkSpec({ rows: [] }), ['no rows']);
  assert.ok(bg.checkSpec({ rows: [{ cells: [{}, null] }], links: [{ from: { row: 0, cell: 0 }, to: { row: 0, cell: 1 } }] })[0].includes('is a hole'));
});

test('checkSpec: an offset row counts its offset in the span range', () => {
  assert.deepEqual(bg.checkSpec({ rows: [{ offset: 2, cells: cells('ff'), spans: [{ from: 2, len: 2 }] }] }), []);
  assert.ok(bg.checkSpec({ rows: [{ cells: cells('ff'), spans: [{ from: 2, len: 2 }] }] })[0].includes('runs past'));
});

// ── the stylesheet and the source ──

test('kit.css has the K3 section: kinds carried by pattern, marks, spans, brackets, links, meter, swatches, the phone rule', () => {
  for (const sel of ['.sd-bg-cell.sd-soft', '.sd-bg-cell.sd-bg-dead', '.sd-bg-cell.sd-bg-bad::before', '.sd-bg-cell.sd-bg-ghost',
    '.sd-bg-cell.sd-bg-under', '.sd-bg-cell.sd-bg-gap-now', '.sd-bg-refs', "span[data-style='dashed']", "span[data-open='end']",
    '.sd-bg-bracket', '.sd-bg-bpad', '.sd-bg-link--dashed', '.sd-bg-link-x', '.sd-bg-meter[data-over]', '.sd-bg-tick',
    "[data-shape='bg-fill']", "[data-shape='bg-soft']", "[data-shape='bg-dead']", "[data-shape='bg-bad']", "[data-shape='bg-ghost']",
    "[data-shape='bg-span']", "[data-shape='bg-span-dashed']", "[data-shape='bg-span-dotted']", "[data-shape='bg-bracket']",
    "[data-shape='bg-link']", "[data-shape='bg-refs']", '.sd-bg-scroll { overflow-x: auto', '--bg-cw-phone: minmax(1.05rem, max-content)', 'repeat(var(--bg-n), var(--bg-cw-phone))']) {
    assert.ok(css.includes(sel), sel);
  }
  const sec = css.slice(css.indexOf('── view K3'), css.indexOf('small screens: stack'));
  assert.ok(!/#[0-9a-f]{3,8}\b|rgb\(/i.test(sec), 'no colour literals: tokens only');
  assert.ok(!/\d+px/.test(sec.replace(/@media[^{]*/g, '').replace(/\b1px solid/g, '')), 'sizes in rem (1px hairlines aside)');
});

test('the view holds no words, no viewBox and no timers', () => {
  const view = src.slice(src.indexOf('// ── view ──'));
  assert.ok(!/viewBox|setAttribute\('viewBox/.test(view), 'arrows are drawn 1:1 in CSS pixels');
  assert.ok(!/setTimeout|setInterval|Math\.random|Date/.test(src));
  // the only literals with letters are class names, attribute, tag and style names, CSS values and the console message
  const literals = view.match(/'[^'\n]*'/g).filter((s) => /[A-Za-zčćšžđ]/.test(s));
  literals.forEach((s) => assert.ok(/^' ?[a-z/-][a-z0-9 :./(),-]*'$/.test(s) || /^'[0-9.]+rem'$/.test(s) || s.startsWith("'[simdeck]") || s === "'http://www.w3.org/2000/svg'", 'a word in the view: ' + s));
});
