// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for geo-perimeter-area: unit squares on squared paper (logic.area) and the three modes (sim.js), rules from
// SPEC.md, tie-breaks first; then the squared-paper model copied from geo-lines (paper.js, its own tests kept); then
// the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const G = require('./paper.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const A = logic.area;
const rows = A.fromRows;
const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const preset = (id) => S(logic.PRESETS.find((p) => p.id === id).params);
const m = (cells) => A.measure(A.norm(cells));
const ek = (e) => e.from.join(',') + '>' + e.to.join(',');

// ── tie-breaks first ──

test('tie-break: squares touching only at a corner are two shapes, each with its own P and o (rule 3)', () => {
  const diag = rows(['.#', '#.'], 0, 0);
  assert.equal(A.pieces(diag).length, 2);
  const s = S({ mode: 'paint', cells: diag });
  assert.deepEqual(s.pieces.map((p) => [p.P, p.o]), [[1, 4], [1, 4]]);
  assert.equal(s.o, 8);
  // sharing a whole side makes one shape
  assert.equal(A.pieces(rows(['##'], 0, 0)).length, 1);
});

test('tie-break: the walk turns left first, so it stays with its square where two meet at a corner (rule 4)', () => {
  // one shape (joined round the left), two of its squares touching only at the corner (2, 1)
  const pinch = rows(['###', '#.#', '##.'], 0, 0);
  const w = A.walk(pinch);
  assert.deepEqual(w.slice(0, 6).map((e) => e.from), [[0, 0], [1, 0], [2, 0], [2, 1], [1, 1], [1, 2]]);
  // it comes back through (2, 1) and goes on along (2, 1)'s square: one loop of 16, no hole
  assert.equal(w.length, 16);
  assert.equal(S({ mode: 'paint', cells: pinch }).holes, 0);
  // two shapes meeting at a corner: each walk stays round its own square
  const two = A.walk(rows(['.#', '#.'], 0, 0));
  assert.deepEqual(two.map((e) => [e.piece, e.n]), [[0, 1], [0, 2], [0, 3], [0, 4], [1, 1], [1, 2], [1, 3], [1, 4]]);
});

test('tie-break: a side on the paper\'s border is edge; squares off the paper, duplicates and non-whole are dropped (rules 1, 2)', () => {
  assert.deepEqual(m([[0, 0]]), { P: 1, o: 4, edgeCells: 1, loops: 1 });
  assert.deepEqual(m([[23, 11], [22, 11]]).o, 6);
  assert.deepEqual(A.norm([[1, 1], [1, 1], [24, 0], [0, 12], [-1, 0], [1.5, 2], ['2', 2], null, [3], [2, 3]]), [[2, 3], [1, 1]]);
  assert.deepEqual(A.norm('nope'), []);
  assert.deepEqual(A.norm([[1, 2, 3], [4, 5]]), [[4, 5]]);
});

test('tie-break: a hole\'s edge is edge too: the ring has o = 16, one hole (rule 5)', () => {
  const ring = rows(['###', '#.#', '###'], 4, 4);
  const s = S({ mode: 'paint', cells: ring });
  assert.equal(s.P, 8);
  assert.equal(s.o, 16);
  assert.equal(s.holes, 1);
  // the walk: outer loop of 12, then from the lowest, leftmost unwalked side round the hole, clockwise
  const w = A.walk(ring);
  assert.equal(w.length, 16);
  assert.deepEqual(w.slice(12).map((e) => e.from), [[5, 5], [5, 6], [6, 6], [6, 5]]);
  assert.deepEqual(w.slice(12).map((e) => e.n), [13, 14, 15, 16]);
  assert.deepEqual(w.map((e) => e.loop), Array(12).fill(0).concat([1, 1, 1, 1]));
  const at = S({ mode: 'walk', cells: ring, k: 12 });
  assert.equal(at.jump, true);
  assert.equal(at.inHole, false);
  assert.equal(S({ mode: 'walk', cells: ring, k: 13 }).inHole, true);
  assert.equal(S({ mode: 'walk', cells: ring, k: 13 }).jump, false);
  assert.equal(S({ mode: 'walk', cells: ring, k: 11 }).jump, false);
});

test('tie-break: b snaps to the largest short side not above it (rule 7)', () => {
  assert.deepEqual([S({ mode: 'twelve', n: 12, b: 5 }).b, S({ mode: 'twelve', n: 12, b: 5 }).a], [3, 4]);
  assert.equal(S({ mode: 'twelve', n: 12, b: 0 }).b, 1);
  assert.equal(S({ mode: 'twelve', n: 12, b: 2 }).b, 2);
  assert.equal(S({ mode: 'twelve', n: 16, b: 3 }).b, 2);
  assert.equal(S({ mode: 'twelve', n: 13, b: 3 }).b, 1);
});

test('tie-break: asking first leaves the row of the table empty; the walk is never hidden (rules 8, 9)', () => {
  const asked = S({ mode: 'twelve', n: 12, b: 2, seen: 1, hide: true });
  assert.equal(asked.hide, true);
  assert.equal(asked.seen, 1);
  assert.equal(S({ mode: 'twelve', n: 12, b: 2, seen: 1 }).seen, 3);
  assert.equal(S({ mode: 'walk', hide: true }).hide, false);
  assert.equal(S({ mode: 'paint', hide: 'true' }).hide, false);
  assert.equal(S({ mode: 'paint', hide: true }).hide, true);
});

// ── unit squares (logic.area, for models/squared-paper.js) ──

test('rule 1: squares in reading order, top row first', () => {
  assert.deepEqual(A.norm([[1, 0], [0, 0], [5, 3], [0, 1]]), [[5, 3], [0, 1], [0, 0], [1, 0]]);
  assert.deepEqual(rows(['#.', '##'], 2, 2), [[2, 3], [2, 2], [3, 2]]);
  assert.deepEqual(A.rect(3, 2, 1, 1), [[1, 2], [2, 2], [3, 2], [1, 1], [2, 1], [3, 1]]);
});

test('rule 2: the edge is every side next to an uncoloured square, its square on the left', () => {
  const es = A.edges([[2, 3]]);
  assert.deepEqual(es.map(ek), ['2,3>3,3', '3,3>3,4', '3,4>2,4', '2,4>2,3']);
  // two squares side by side: the shared side is not edge
  const two = A.edges([[2, 3], [3, 3]]).map(ek);
  assert.equal(two.length, 6);
  assert.ok(!two.includes('3,3>3,4') && !two.includes('3,4>3,3'));
  // every edge has its square on the left: d turned a quarter left points into the square
  for (const e of A.edges(logic.SHAPES.eight)) {
    const mid = [e.from[0] + e.d[0] / 2 - e.d[1] / 2, e.from[1] + e.d[1] / 2 + e.d[0] / 2];
    assert.deepEqual([Math.floor(mid[0]), Math.floor(mid[1])], e.cell);
  }
});

test('rule 3: shapes in the reading order of their first square', () => {
  const s = preset('same-perimeter');
  assert.deepEqual(s.pieces.map((p) => [p.P, p.o]), [[5, 12], [9, 12]]);
  assert.deepEqual(s.pieces[0].cells[0], [3, 6]);
  // each shape's squares in reading order (the page numbers them so)
  assert.deepEqual(A.pieces(rows(['#..', '##.', '.##'], 0, 0))[0], [[0, 2], [0, 1], [1, 1], [1, 0], [2, 0]]);
});

test('rule 4: the walk starts at the lowest, leftmost square\'s bottom side and goes anticlockwise', () => {
  // the lowest row first, then the leftmost square in it: not the leftmost column
  assert.deepEqual(A.walk([[5, 6], [6, 5], [6, 6]])[0].from, [6, 5]);
  const w = A.walk(logic.SHAPES.rect34);
  assert.equal(w.length, 14);
  assert.deepEqual(w[0].from, [10, 4]);
  assert.deepEqual(w.slice(0, 5).map((e) => e.d), [[1, 0], [1, 0], [1, 0], [1, 0], [0, 1]]);
  assert.deepEqual(w.map((e) => e.n), Array.from({ length: 14 }, (_, i) => i + 1));
  // a closed loop: each side starts where the last ended, and it ends where it began
  for (let i = 1; i < w.length; i++) assert.deepEqual(w[i].from, w[i - 1].to);
  assert.deepEqual(w[13].to, w[0].from);
  // the U: into the notch and out again
  const u = A.walk(logic.SHAPES.u);
  assert.equal(u.length, 18);
  assert.deepEqual(u.map((e) => e.from.join(',')).slice(4, 14),
    ['14,4', '14,5', '14,6', '14,7', '13,7', '13,6', '13,5', '12,5', '11,5', '11,6']);
});

test('rule 4: every side of the edge is walked once (300 seeded shapes)', () => {
  const r = kit.rng(4242);
  for (let i = 0; i < 300; i++) {
    const c = [];
    const n = 1 + r.int(40);
    for (let j = 0; j < n; j++) c.push([3 + r.int(8), 2 + r.int(6)]);
    const cells = A.norm(c);
    const w = A.walk(cells).map(ek);
    const es = A.edges(cells).map(ek);
    assert.equal(new Set(w).size, w.length);
    assert.deepEqual(w.slice().sort(), es.slice().sort());
  }
});

test('rule 5: P and o of the preset shapes; the squares on the edge', () => {
  assert.deepEqual(m(logic.SHAPES.eight), { P: 8, o: 14, edgeCells: 7, loops: 1 });
  assert.deepEqual(m(logic.SHAPES.notch), { P: 8, o: 12, edgeCells: 7, loops: 1 });
  assert.deepEqual(m(logic.SHAPES.rect34), { P: 12, o: 14, edgeCells: 10, loops: 1 });
  assert.deepEqual(m(logic.SHAPES.u), { P: 8, o: 18, edgeCells: 8, loops: 1 });
  assert.deepEqual(m(logic.SHAPES.sameO), { P: 14, o: 24, edgeCells: 13, loops: 2 });
  assert.deepEqual(m([]), { P: 0, o: 0, edgeCells: 0, loops: 0 });
});

test('rule 6: one more square changes P by 1 and o by 4 − 2k', () => {
  assert.deepEqual(A.toggle([], [5, 5]), { add: true, dP: 1, dO: 4, shared: 0 });
  assert.deepEqual(A.toggle(logic.SHAPES.notch, [12, 6]), { add: true, dP: 1, dO: 0, shared: 2 });
  assert.deepEqual(A.toggle(logic.SHAPES.u, [11, 6]), { add: true, dP: 1, dO: 2, shared: 1 });
  assert.deepEqual(A.toggle(logic.SHAPES.notch, [11, 5]), { add: false, dP: -1, dO: 4, shared: 4 });
  assert.deepEqual(A.toggle(logic.SHAPES.notch, [10, 4]), { add: false, dP: -1, dO: 0, shared: 2 });
  // against counting: each case agrees with measuring before and after
  const plus = (cells, c) => m(cells.concat([c]));
  assert.deepEqual([plus(logic.SHAPES.notch, [12, 6]).P, plus(logic.SHAPES.notch, [12, 6]).o], [9, 12]);
  assert.deepEqual([plus(logic.SHAPES.u, [11, 6]).P, plus(logic.SHAPES.u, [11, 6]).o], [9, 20]);
  const u2 = m(logic.SHAPES.u.concat([[11, 5], [12, 5]]));
  assert.deepEqual([u2.P, u2.o], [10, 16]);
  for (const c of [[9, 4], [11, 5], [12, 6], [14, 7], [10, 4]]) {
    const t = A.toggle(logic.SHAPES.notch, c);
    const after = t.add ? logic.SHAPES.notch.concat([c]) : logic.SHAPES.notch.filter((q) => q[0] !== c[0] || q[1] !== c[1]);
    assert.equal(m(after).o - m(logic.SHAPES.notch).o, t.dO, c.join(','));
  }
});

test('rule 7: the rectangles of n squares, short side first; o counted is a + b + a + b', () => {
  const tab = (n) => S({ mode: 'twelve', n }).rects.map((r) => [r.b, r.a, r.o]);
  assert.deepEqual(tab(12), [[1, 12, 26], [2, 6, 16], [3, 4, 14]]);
  assert.deepEqual(tab(16), [[1, 16, 34], [2, 8, 20], [4, 4, 16]]);
  assert.deepEqual(tab(18), [[1, 18, 38], [2, 9, 22], [3, 6, 18]]);
  assert.deepEqual(tab(20), [[1, 20, 42], [2, 10, 24], [4, 5, 18]]);
  assert.deepEqual(A.rects(24), [{ b: 1, a: 24 }, { b: 2, a: 12 }, { b: 3, a: 8 }, { b: 4, a: 6 }]);
  assert.deepEqual(A.rects(24).map((r) => m(A.rect(r.a, r.b, 0, 0)).o), [50, 28, 22, 20]);
  assert.deepEqual(tab(13), [[1, 13, 28]]);
  assert.deepEqual(tab(1), [[1, 1, 4]]);
  for (let n = 1; n <= logic.N_MAX; n++) {
    for (const r of S({ mode: 'twelve', n }).rects) {
      assert.equal(r.o, r.sides.reduce((a, b) => a + b, 0));
      assert.equal(r.P, n);
    }
  }
  // it lies in the middle of the paper, long side along it
  const s = S({ mode: 'twelve', n: 12, b: 2 });
  assert.deepEqual([s.x0, s.y0, s.cells.length], [9, 5, 12]);
  assert.deepEqual(s.cells[0], [9, 6]);
  // odd remainders round down; even 1 × 20 leaves two squares each side
  assert.deepEqual([S({ mode: 'twelve', n: 12, b: 3 }).x0, S({ mode: 'twelve', n: 12, b: 3 }).y0], [10, 4]);
  assert.deepEqual([S({ mode: 'twelve', n: 13 }).x0, S({ mode: 'twelve', n: 13 }).y0], [5, 5]);
  assert.deepEqual(S({ mode: 'twelve', n: 20, b: 1 }).x0, 2);
  assert.equal(S({ mode: 'twelve', n: 12, b: 3 }).square, false);
});

test('rule 8: the table fills as the rectangles are built; then o from smallest to largest', () => {
  let seen = 0;
  for (const b of [1, 2, 3]) {
    const s = S({ mode: 'twelve', n: 12, b, seen });
    seen = s.seen;
    assert.equal(s.allSeen, b === 3);
  }
  assert.equal(seen, 7);
  const s = S({ mode: 'twelve', n: 12, b: 3, seen: 15 });
  assert.equal(s.seen, 7);
  assert.equal(S({ mode: 'twelve', n: 13, seen: 15 }).seen, 1);
  assert.equal(S({ mode: 'twelve', n: 13, seen: 0 }).allSeen, true);
  assert.deepEqual([s.oMin, s.oMax], [14, 26]);
});

test('rule 10: o and P can be the same number (4 × 4)', () => {
  const s = preset('sixteen');
  assert.deepEqual([s.o, s.P, s.square, s.sameNumber], [16, 16, true, true]);
  assert.equal(preset('twelve').sameNumber, false);
  assert.equal(S({ mode: 'paint', cells: [] }).sameNumber, false);
  assert.equal(S({ mode: 'paint', cells: A.rect(4, 4, 0, 0) }).sameNumber, true);
  // two shapes whose sums match are not one shape's o and P: P 24 + 2, o 20 + 6
  const s2 = S({ mode: 'paint', cells: A.rect(6, 4, 10, 4).concat([[1, 1], [2, 1]]) });
  assert.deepEqual([s2.P, s2.o, s2.sameNumber], [26, 26, false]);
  assert.equal(S({ mode: 'walk', cells: A.rect(6, 4, 10, 4).concat([[1, 1], [2, 1]]) }).sameNumber, false);
});

test('rule 11: params are made valid', () => {
  assert.equal(S({ mode: 'nope' }).mode, 'paint');
  assert.equal(S({ mode: 'twelve', n: 99 }).n, 20);
  assert.equal(S({ mode: 'twelve', n: 0 }).n, 1);
  assert.equal(S({ mode: 'twelve', n: '' }).n, 12);
  assert.equal(S({ mode: 'twelve', n: null }).n, 12);
  assert.equal(S({ mode: 'twelve', n: 'x' }).n, 12);
  assert.equal(S({ mode: 'twelve', n: 11.6 }).n, 12);
  assert.equal(S({ mode: 'walk', cells: logic.SHAPES.rect34, k: 99 }).k, 14);
  assert.equal(S({ mode: 'walk', cells: logic.SHAPES.rect34, k: -3 }).k, 0);
  assert.equal(S({ mode: 'paint', cells: 'x' }).P, 0);
  assert.deepEqual(logic.cellAt(3.99, 2.01), [3, 2]);
  assert.deepEqual(logic.cellAt(-1, 99), [0, 11]);
  assert.deepEqual(logic.cellAt(24, 12), [23, 11]);
});

test('rule 11: the URL\'s cells round-trip; anything else decodes to no squares', () => {
  for (const k of Object.keys(logic.SHAPES)) assert.deepEqual(logic.decode(logic.encode(logic.SHAPES[k])), logic.SHAPES[k]);
  assert.equal(logic.encode([]), '');
  assert.equal(logic.encode([[0, 0]]), '1');
  assert.equal(logic.encode([[23, 1]]), '0.800000');
  assert.equal(logic.encode(logic.SHAPES.eight), '0.0.0.0.0.800.3c00.1c00');
  assert.deepEqual(logic.decode(''), []);
  assert.deepEqual(logic.decode('zz'), []);
  assert.deepEqual(logic.decode('1x'), []);
  assert.deepEqual(logic.decode('1.-1'), []);
  assert.equal(logic.encode([[0, 0], [0, 0]]), '1');
  assert.deepEqual(logic.decode(42), []);
  const all = [];
  for (let y = 0; y < logic.H; y++) for (let x = 0; x < logic.W; x++) all.push([x, y]);
  assert.deepEqual(logic.decode(logic.encode(all)), A.norm(all));
});

test('the walk: where it is, the shape it is on, the end', () => {
  const s0 = preset('walk');
  assert.deepEqual([s0.k, s0.o, s0.P, s0.done, s0.edgeCells], [0, 14, 12, false, 10]);
  assert.deepEqual(s0.at, [10, 4]);
  assert.deepEqual(s0.next.from, [10, 4]);
  const s5 = S({ mode: 'walk', cells: logic.SHAPES.rect34, k: 5 });
  assert.deepEqual([s5.at, s5.pieceN, s5.done, s5.pieceDone], [[14, 5], 5, false, false]);
  const end = S({ mode: 'walk', cells: logic.SHAPES.rect34, k: 14 });
  assert.deepEqual([end.done, end.pieceDone, end.pieceN, end.next], [true, true, 14, null]);
  assert.deepEqual(end.at, [10, 4]);
  // two shapes: the second starts at 1 again
  const two = S({ mode: 'walk', cells: logic.SHAPES.sameO, k: 12 });
  assert.deepEqual([two.pieceDone, two.pieceN, two.piece], [true, 12, 1]);
  assert.equal(two.lastPiece, 0);
  assert.equal(two.jump, false);
  const two1 = S({ mode: 'walk', cells: logic.SHAPES.sameO, k: 13 });
  assert.deepEqual([two1.pieceN, two1.piece, two1.lastPiece], [1, 1, 1]);
  assert.equal(S({ mode: 'walk', cells: rows(['###', '#.#', '###'], 4, 4) }).holes, 1);
  // no squares: nothing to walk
  const none = S({ mode: 'walk', cells: [] });
  assert.deepEqual([none.o, none.k, none.at, none.done], [0, 0, null, true]);
});

test('the presets are the SPEC\'s', () => {
  const e = preset('eight');
  assert.deepEqual([e.mode, e.P, e.o, e.hide, e.edgeCells], ['paint', 8, 14, true, 7]);
  const n = preset('notch');
  assert.deepEqual([n.P, n.o], [8, 12]);
  const so = preset('same-perimeter');
  assert.deepEqual(so.pieces.map((p) => [p.P, p.o]), [[5, 12], [9, 12]]);
  const tw = preset('twelve');
  assert.deepEqual([tw.mode, tw.n, tw.b, tw.a, tw.o, tw.P, tw.hide, tw.seen], ['twelve', 12, 1, 12, 26, 12, true, 0]);
  const sx = preset('sixteen');
  assert.deepEqual([sx.n, sx.b, sx.a, sx.o, sx.P, sx.seen], [16, 4, 4, 16, 16, 4]);
  const w = preset('walk');
  assert.deepEqual([w.mode, w.o, w.P], ['walk', 14, 12]);
  const u = preset('walk-u');
  assert.deepEqual([u.o, u.P, u.edgeCells], [18, 8, 8]);
  const bl = preset('blank');
  assert.deepEqual([bl.P, bl.o, bl.pieces.length], [0, 0, 0]);
  const d = logic.initial(logic.defaults);
  assert.deepEqual([d.mode, d.P, d.o, d.hide], ['paint', 8, 14, false]);
  assert.deepEqual(logic.PRESETS.map((p) => p.id), ['eight', 'notch', 'same-perimeter', 'twelve', 'sixteen', 'walk', 'walk-u', 'blank']);
});

// ── the squared-paper model, copied from sims/geo-lines (its tests kept, COMMON.md §6) ──

test('paper: lineDir is the shortest step, pointing right or up', () => {
  assert.deepEqual(G.lineDir([4, 2]), [2, 1]);
  assert.deepEqual(G.lineDir([-2, -1]), [2, 1]);
  assert.deepEqual(G.lineDir([-2, 1]), [2, -1]);
  assert.deepEqual(G.lineDir([0, -3]), [0, 1]);
  assert.deepEqual(G.lineDir([0, 0]), [0, 0]);
  assert.deepEqual(G.stepOf([5, 4], [11, 7]), { u: [2, 1], m: 3 });
  assert.deepEqual(G.stepOf([5, 4], [5, 4]), { u: [0, 0], m: 0 });
});

test('paper: directions are every shortest step up to maxC, by angle from (1, 0)', () => {
  const d = G.directions(6);
  assert.equal(d.length, 48);
  assert.deepEqual(d[0], [1, 0]);
  assert.deepEqual(d[1], [6, 1]);
  assert.deepEqual(d[12], [1, 1]);
  assert.deepEqual(d[24], [0, 1]);
  assert.deepEqual(d[47], [6, -1]);
  // strictly increasing angle (as a direction pointing up)
  const up = (v) => (v[1] < 0 || (v[1] === 0 && v[0] < 0) ? [-v[0], -v[1]] : v);
  for (let i = 1; i < d.length; i++) assert.ok(G.cross(up(d[i - 1]), up(d[i])) > 0, i);
  assert.equal(new Set(d.map(String)).size, 48);
  assert.deepEqual(G.directions(1), [[1, 0], [1, 1], [0, 1], [1, -1]]);
});

test('paper: along gives the whole step k of a corner on the line, null off it', () => {
  assert.deepEqual(G.along([5, 4], [2, 1], [17, 10]), { on: true, k: 6 });
  assert.deepEqual(G.along([5, 4], [2, 1], [1, 2]), { on: true, k: -2 });
  assert.deepEqual(G.along([5, 4], [2, 1], [17, 9]), { on: false, k: null });
  assert.equal(G.inFigure('segment', 3, 3), true);
  assert.equal(G.inFigure('segment', 4, 3), false);
  assert.equal(G.inFigure('segment', -1, 3), false);
  assert.equal(G.inFigure('ray', 99, 3), true);
  assert.equal(G.inFigure('ray', -1, 3), false);
  assert.equal(G.inFigure('line', -99, 3), true);
});

test('paper: meet is exact, with fractions in lowest terms', () => {
  assert.deepEqual(G.meet([2, 3], [1, 0], [12, 8], [1, 1]), { kind: 'cross', at: { x: [7, 1], y: [3, 1] } });
  assert.deepEqual(G.meet([4, 2], [2, 1], [13, 4], [1, -2]), { kind: 'perp', at: { x: [12, 1], y: [6, 1] } });
  // a crossing between corners: y = 0 and the line through (0, 1) with step (3, -2) → x = 3/2
  assert.deepEqual(G.meet([0, 0], [1, 0], [0, 1], [3, -2]), { kind: 'cross', at: { x: [3, 2], y: [0, 1] } });
  assert.deepEqual(G.rat(-0, 5), [0, 1]);
  assert.deepEqual(G.rat(4, -6), [-2, 3]);
  assert.equal(G.inBox({ x: [3, 2], y: [0, 1] }, { x0: 0, y0: 0, x1: 1.5, y1: 1 }), true);
  assert.equal(G.inBox({ x: [3, 2], y: [0, 1] }, { x0: 0, y0: 0, x1: 1, y1: 1 }), false);
});

test('paper: clip gives the stretch inside the box, null when the line misses it', () => {
  assert.deepEqual(G.clip([5, 4], [2, 1], { x0: 0, y0: 0, x1: 24, y1: 12 }), [-2.5, 8]);
  assert.deepEqual(G.clip([0, 5], [1, 0], { x0: 0, y0: 0, x1: 24, y1: 12 }), [0, 24]);
  assert.equal(G.clip([0, 13], [1, 0], { x0: 0, y0: 0, x1: 24, y1: 12 }), null);
  assert.equal(G.clip([30, 0], [1, 1], { x0: 0, y0: 0, x1: 24, y1: 12 }), null);
});

test('paper: the set square slides one grid line per step and lands on T at target', () => {
  // parallel to (2, 1) through (3, 2); T = (10, 9): cross((2, 1), (7, 7)) = 7
  const s = G.slide('par', [3, 2], [2, 1], 7, [10, 9]);
  assert.equal(s.target, 7);
  assert.deepEqual(s.edge, [2, 1]);
  assert.deepEqual(s.corner, { x: [8, 5], y: [24, 5] }); // (3, 2) + 7/5 · (−1, 2)
  // the drawing leg through the corner with direction edge goes through T
  const c = [s.corner.x[0] / s.corner.x[1], s.corner.y[0] / s.corner.y[1]];
  assert.ok(Math.abs(G.cross(s.edge, [10 - c[0], 9 - c[1]])) < 1e-9);
  // perpendicular: the ruler on p = (1, 0) through (2, 3); T = (15, 9): dot = 13; the corner is on p at x = 15
  const q = G.slide('perp', [2, 3], [1, 0], 13, [15, 9]);
  assert.equal(q.target, 13);
  assert.deepEqual(q.edge, [0, 1]);
  assert.deepEqual(q.corner, { x: [15, 1], y: [3, 1] });
  assert.equal(G.slide('perp', [2, 3], [1, 0], 0, [15, 9]).corner.x[0], 2);
});

test('paper: edges and exact checks', () => {
  assert.equal(G.inBox({ x: [5, 1], y: [12, 1] }, { x0: 0, y0: 0, x1: 24, y1: 12 }), true);
  assert.deepEqual(G.slide('perp', [2, 3], [1, 0], 0, [15, 9]).slide, [1, 0]);
  assert.deepEqual(G.slide('par', [3, 2], [2, 1], 0, [10, 9]).slide, [1, -2]);
});

// ── generic checks every sim keeps ──

// ── generic checks every sim keeps ──

test('state is JSON-safe and deterministic', () => {
  for (const pr of logic.PRESETS) {
    for (let k = 0; k <= 20; k += 4) {
      const s = logic.initial(P(Object.assign({}, pr.params, { k })));
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
      assert.deepEqual(logic.initial(P(Object.assign({}, pr.params, { k }))), s);
    }
  }
});

test('initial does not mutate its params', () => {
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    const copy = structuredClone(p);
    logic.initial(p);
    assert.deepEqual(p, copy);
  }
  const shapes = structuredClone(logic.SHAPES);
  for (const k of Object.keys(shapes)) logic.initial(P({ mode: 'walk', cells: logic.SHAPES[k], k: 3 }));
  assert.deepEqual(logic.SHAPES, shapes);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('the page is an explorer and its presets are the model\'s', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, k);
  for (const pr of logic.PRESETS) {
    assert.ok(strings.hr['p_' + pr.id] && strings.en['p_' + pr.id], pr.id);
  }
  const sj = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  for (const e of sj.entries || []) assert.ok(logic.PRESETS.some((p) => p.id === e.preset), e.preset);
});
