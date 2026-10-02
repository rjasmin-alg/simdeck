// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for vlsm's model. Run: node --test sims/vlsm/
// Numbers from the URM book, ch. 9 (09-podmrezavanje.md): Primjer 1 (Grafo d.o.o.), Primjer 2 (one mask for all), the
// smallest-first paragraph of "Izrada adresne sheme", and the fragment's exercises (vlsm.html).
// Tie-breaks and edges first, then the book's numbers, then the steps, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const ranges = (s) => s.units.map((u) => (u.fits ? `${u.start}-${u.start + u.size - 1}` : 'X'));

// ── tie-breaks and edges ──

test('tie-break: equal blocks keep the list order when largest first', () => {
  // Uprava (12) and Podružnica (10) are both /28; Uprava is first in the list, so it goes first.
  assert.deepEqual(logic.order([64, 32, 16, 16, 8, 4], 'largest'), [0, 1, 2, 3, 4, 5]);
  // Swapped needs (Uprava 10, Podružnica 12) still give the same /28 blocks, so the list order still decides.
  const s = logic.plan(P({ h2: 10, h3: 12 }));
  assert.deepEqual(s.seq, [0, 1, 2, 3, 4, 5]);
  assert.equal(s.units[2].start, 96);
  assert.equal(s.units[3].start, 112);
  // Equal blocks out of list order: the earlier index wins among equals wherever they stand.
  assert.deepEqual(logic.order([4, 64, 4, 64], 'largest'), [1, 3, 0, 2]);
});

test('tie-break: smallest first is the exact reverse of largest first (the book: branch before management)', () => {
  assert.deepEqual(logic.order([64, 32, 16, 16, 8, 4], 'smallest'), [5, 4, 3, 2, 1, 0]);
  assert.deepEqual(logic.order([4, 64, 4, 64], 'smallest'), [2, 0, 3, 1]);
});

test('tie-break: one mask for all keeps the list order', () => {
  assert.deepEqual(logic.order([64, 64, 64], 'list'), [0, 1, 2]);
  assert.deepEqual(logic.plan(P({ scheme: 'fixed' })).seq, [0, 1, 2, 3, 4, 5]);
});

test('prefix edges: 2^(32 − n) − 2 ≥ hosts, exactly at the boundary, never above /30', () => {
  assert.equal(logic.prefixFor(62), 26); // 64 − 2 = 62: fits exactly
  assert.equal(logic.prefixFor(63), 25);
  assert.equal(logic.prefixFor(6), 29);  // the guests: 8 − 2 = 6, no spare place (the book says so)
  assert.equal(logic.prefixFor(7), 28);
  assert.equal(logic.prefixFor(2), 30);
  assert.equal(logic.prefixFor(1), 30);  // /31 is the link exception, not used here
  assert.equal(logic.prefixFor(100), 25);
  assert.equal(logic.prefixFor(126), 25);
  assert.equal(logic.prefixFor(127), 24);
  for (let h = logic.minHosts; h <= logic.maxHosts; h++) {
    const n = logic.prefixFor(h);
    assert.ok(logic.usable(n) >= h, `${h} fits /${n}`);
    assert.ok(n === 30 || logic.usable(n + 1) < h, `/${n} is the smallest for ${h}`);
  }
});

test('alignment: every placed block starts at a multiple of its own size, and no two overlap', () => {
  const cases = [P(), P({ scheme: 'smallest' }), P({ scheme: 'fixed' }), P({ h0: 100 }), P({ h0: 100, h1: 100 }),
    P({ h0: 1, h1: 100, h2: 30, h3: 7, h4: 62, h5: 15, scheme: 'smallest' })];
  for (const p of cases) {
    const placed = logic.plan(p).units.filter((u) => u.fits).sort((a, b) => a.start - b.start);
    for (const u of placed) {
      assert.equal(u.start % u.size, 0, `${u.id} at ${u.start} is aligned to ${u.size}`);
      assert.ok(u.start + u.size <= logic.space, `${u.id} stays inside the /24`);
    }
    for (let i = 1; i < placed.length; i++) assert.ok(placed[i].start >= placed[i - 1].start + placed[i - 1].size, 'no overlap');
  }
});

test('a block that does not fit is left out and the cursor stays (later blocks may still fit)', () => {
  // 128, 128 fill the /24; the next 64 does not fit, and neither does anything after it.
  const a = logic.allocate([128, 128, 64, 4], [0, 1, 2, 3], 256);
  assert.deepEqual(a.start, [0, 128, null, null]);
  assert.equal(a.end, 256);
  // Cursor kept: after 128 + 64 the next 128 does not fit (192 + 128 > 256), but a later 32 still does, at 192.
  const b = logic.allocate([128, 64, 128, 32], [0, 1, 2, 3], 256);
  assert.deepEqual(b.start, [0, 128, null, 192]);
});

test('largest first never leaves a hole (each block is at least as big as the next)', () => {
  for (let h0 = 1; h0 <= 100; h0 += 9) for (let h4 = 1; h4 <= 100; h4 += 11) {
    assert.deepEqual(logic.plan(P({ h0, h4 })).holes, [], `h0 ${h0} h4 ${h4}`);
  }
});

test('the sums add up: used + holes + reserve = 256, needed counts the blocks that did not fit', () => {
  for (const p of [P(), P({ scheme: 'smallest' }), P({ scheme: 'fixed' }), P({ h0: 100, h1: 100 })]) {
    const s = logic.plan(p);
    assert.equal(s.used + s.holeTotal + s.reserve, logic.space);
    assert.equal(s.needed, s.units.reduce((t, u) => t + u.size, 0));
    assert.equal(s.unplaced, s.units.filter((u) => !u.fits).length);
  }
});

// ── the book's numbers ──

test('Primjer 1, step 1: prefixes /26 /27 /28 /28 /29 /30, blocks 64 32 16 16 8 4, usable 62 30 14 14 6 2', () => {
  const s = logic.plan(P());
  assert.deepEqual(s.units.map((u) => u.prefix), [26, 27, 28, 28, 29, 30]);
  assert.deepEqual(s.units.map((u) => u.size), [64, 32, 16, 16, 8, 4]);
  assert.deepEqual(s.units.map((u) => u.usable), [62, 30, 14, 14, 6, 2]);
  assert.deepEqual(s.units.map((u) => logic.format(logic.mask(u.prefix))),
    ['255.255.255.192', '255.255.255.224', '255.255.255.240', '255.255.255.240', '255.255.255.248', '255.255.255.252']);
});

test('Primjer 1, step 2: .0–.63, .64–.95, .96–.111, .112–.127, .128–.135, .136–.139; 140 used, 116 reserve', () => {
  const s = logic.plan(P());
  assert.deepEqual(ranges(s), ['0-63', '64-95', '96-111', '112-127', '128-135', '136-139']);
  assert.equal(logic.format(s.units[0].network), '192.168.1.0');
  assert.equal(logic.format(s.units[0].broadcast), '192.168.1.63');
  assert.equal(logic.format(s.units[2].network), '192.168.1.96');
  assert.equal(logic.format(s.units[2].broadcast), '192.168.1.111');
  assert.equal(logic.format(s.units[5].network), '192.168.1.136');
  assert.equal(logic.format(s.units[5].broadcast), '192.168.1.139');
  assert.equal(s.used, 140);
  assert.equal(s.reserve, 116);
  assert.equal(s.holeTotal, 0);
  assert.equal(s.unplaced, 0);
});

test('Primjer 2: one /26 for all six needs 6 × 64 = 384 > 256; four fit, guests and link do not; VLSM needs 140', () => {
  const s = logic.plan(P({ scheme: 'fixed' }));
  assert.ok(s.units.every((u) => u.prefix === 26));
  assert.equal(s.needed, 384);
  assert.equal(s.vlsmNeeded, 140);
  assert.deepEqual(ranges(s), ['0-63', '64-127', '128-191', '192-255', 'X', 'X']);
  assert.equal(s.unplaced, 2);
  assert.equal(s.reserve, 0);
});

test('smallest first (ch. 9): link .0, guests .8, branch .16, management .32, production .64, sales .128; 52 in 3 holes, 64 left', () => {
  const s = logic.plan(P({ scheme: 'smallest' }));
  assert.deepEqual(ranges(s), ['128-191', '64-95', '32-47', '16-31', '8-15', '0-3']);
  assert.deepEqual(s.holes.map((o) => [o.start, o.size]), [[4, 4], [48, 16], [96, 32]]);
  assert.equal(s.used, 140);
  assert.equal(s.holeTotal, 52);
  assert.equal(s.reserve, 64);
});

test('fragment exercise 2: Sales with 100 hosts gets /25 and still goes first; the rest shift by 64', () => {
  const s = logic.plan(P({ h0: 100 }));
  assert.equal(s.units[0].prefix, 25);
  assert.equal(s.units[0].usable, 126);
  assert.deepEqual(s.seq, [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(ranges(s), ['0-127', '128-159', '160-175', '176-191', '192-199', '200-203']);
  assert.equal(s.reserve, 52);
});

test('preset full: Sales and Production with 100 hosts each fill the /24; the other four do not fit', () => {
  const s = logic.plan(P({ h0: 100, h1: 100 }));
  assert.deepEqual(ranges(s), ['0-127', '128-255', 'X', 'X', 'X', 'X']);
  assert.equal(s.unplaced, 4);
  assert.equal(s.reserve, 0);
});

// ── steps ──

test('the steps follow the book\'s procedure: needs, sizes, order, six placements, result', () => {
  assert.equal(logic.steps, 9);
  assert.deepEqual([...Array(10).keys()].map((n) => at({}, n).phase),
    ['needs', 'sizes', 'order', 'place', 'place', 'place', 'place', 'place', 'place', 'summary']);
  assert.deepEqual([...Array(10).keys()].map((n) => at({}, n).placed), [0, 0, 0, 1, 2, 3, 4, 5, 6, 6]);
});

test('each placement step places the next block in order; the cursor is the end of the blocks before it', () => {
  const steps = [3, 4, 5, 6, 7, 8].map((n) => at({ scheme: 'smallest' }, n));
  assert.deepEqual(steps.map((s) => s.current), [5, 4, 3, 2, 1, 0]);
  assert.deepEqual(steps.map((s) => s.cursor), [0, 4, 16, 32, 48, 96]);
  assert.equal(at({}, 2).current, null);
  assert.equal(at({}, 9).current, null);
});

test('the cursor skips blocks that did not fit', () => {
  // fixed: guests (step 7) and link (step 8) do not fit; the cursor before the link is still 256
  assert.equal(at({ scheme: 'fixed' }, 7).cursor, 256);
  assert.equal(at({ scheme: 'fixed' }, 8).cursor, 256);
  assert.equal(at({ h0: 100, h1: 100 }, 6).cursor, 256);
});

test('a param change recomputes the numbers at the same step', () => {
  const s = at({ h0: 100 }, 4);
  assert.equal(s.phase, 'place');
  assert.equal(s.current, 1);
  assert.equal(s.units[1].start, 128);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  for (let n = 0; n <= logic.steps; n++) {
    const s = at({ h0: 100, h1: 100, scheme: 'smallest' }, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ scheme: 'smallest', h3: 40 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  for (let n = 1; n <= logic.steps; n++) { s = logic.step(s, n, p); forward.push(s); }
  for (let n = logic.steps; n >= 0; n--) assert.deepEqual(kit.stateAt(logic, p, n), forward[n]);
});

test('step does not mutate its input', () => {
  const p = P();
  const s0 = logic.initial(p);
  const copy = structuredClone(s0);
  logic.step(s0, 1, p);
  assert.deepEqual(s0, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every unit has a name in both languages', () => {
  for (const lang of ['hr', 'en']) for (const id of logic.units) assert.ok(strings[lang][id], `${lang} ${id}`);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps, 'meta.steps matches the model');
  const blocks = [...html.matchAll(/params:\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.ok(blocks.length >= 5, 'found preset params');
  for (const b of blocks) {
    for (const k of b.matchAll(/(\w+):/g)) assert.ok(k[1] in logic.defaults, `preset param ${k[1]} is a model param`);
    for (const m of b.matchAll(/h\d:\s*(\d+)/g)) assert.ok(+m[1] >= logic.minHosts && +m[1] <= logic.maxHosts, `hosts ${m[1]} in range`);
    const sc = b.match(/scheme:\s*'([^']+)'/);
    if (sc) assert.ok(logic.schemes.includes(sc[1]), `scheme ${sc[1]}`);
  }
});
