// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for geo-lines: the squared-paper model (paper.js) and the page's model (sim.js), rules from SPEC.md,
// tie-breaks first, then the generic block every sim keeps.
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

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const preset = (id) => S(logic.PRESETS.find((p) => p.id === id).params);

// ── tie-breaks first ──

test('tie-break: the ends belong to a segment and the start to a ray (rule 3)', () => {
  const base = { mode: 'parts', ax: 5, ay: 4, bx: 11, by: 7 };
  for (const kind of ['segment', 'ray', 'line']) {
    const atA = S(Object.assign({ kind, tx: 5, ty: 4 }, base));
    assert.equal(atA.on, true, kind + ' A');
    assert.equal(atA.where, 'drawn');
    assert.equal(atA.tAt, 'A');
  }
  const atB = S(Object.assign({ kind: 'segment', tx: 11, ty: 7 }, base));
  assert.equal(atB.on, true);
  assert.equal(atB.tAt, 'B');
  // one step outside each end
  assert.equal(S(Object.assign({ kind: 'segment', tx: 13, ty: 8 }, base)).where, 'outside');
  assert.equal(S(Object.assign({ kind: 'segment', tx: 3, ty: 3 }, base)).where, 'outside');
  assert.equal(S(Object.assign({ kind: 'ray', tx: 3, ty: 3 }, base)).where, 'outside');
  assert.equal(S(Object.assign({ kind: 'ray', tx: 13, ty: 8, reach: 0 }, base)).where, 'beyond');
});

test('tie-break: the end of the drawn part still counts as drawn (rule 3)', () => {
  const base = { mode: 'parts', kind: 'line', ax: 5, ay: 4, bx: 11, by: 7, reach: 2 };
  assert.equal(S(Object.assign({ tx: 15, ty: 9 }, base)).where, 'drawn'); // k = 5 = m + reach
  assert.equal(S(Object.assign({ tx: 17, ty: 10 }, base)).where, 'beyond'); // k = 6
  assert.equal(S(Object.assign({ tx: 1, ty: 2 }, base)).where, 'drawn'); // k = −2
  assert.equal(S(Object.assign({ tx: 1, ty: 2 }, base, { reach: 1 })).where, 'beyond');
});

test('tie-break: B on A moves one square right, or left at the right edge (rule 1)', () => {
  const s = S({ mode: 'parts', ax: 5, ay: 4, bx: 5, by: 4 });
  assert.equal(s.bMoved, true);
  assert.deepEqual(s.b, [6, 4]);
  assert.deepEqual(S({ mode: 'parts', ax: 24, ay: 4, bx: 24, by: 4 }).b, [23, 4]);
  assert.equal(S({ mode: 'parts' }).bMoved, false);
});

test('tie-break: parallel is decided before the point; one line is "same", not parallel (rule 7)', () => {
  const same = S({ mode: 'two', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 9, ty: 3, turn: 0 });
  assert.equal(same.rel, 'same');
  assert.equal(same.at, null);
  const par = S({ mode: 'two', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 9, ty: 4, turn: 0 });
  assert.equal(par.rel, 'parallel');
  assert.equal(par.at, null);
  assert.equal(par.zoomNeeded, null);
  // T on p but q turned: they cross at T
  const atT = S({ mode: 'two', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 9, ty: 3, turn: 12 });
  assert.equal(atT.rel, 'cross');
  assert.deepEqual(atT.at, { x: [9, 1], y: [3, 1] });
});

test('tie-break: perpendicular is a kind of crossing; "they cross" is right with more to say (rule 9)', () => {
  assert.equal(logic.judge('cross', 'perp'), 'more');
  assert.equal(logic.judge('perp', 'perp'), 'yes');
  assert.equal(logic.judge('perp', 'cross'), 'no');
  assert.equal(logic.judge('cross', 'cross'), 'yes');
  assert.equal(logic.judge('par', 'parallel'), 'yes');
  assert.equal(logic.judge('par', 'cross'), 'no');
  assert.equal(logic.judge('cross', 'parallel'), 'no');
  for (const g of ['par', 'perp', 'cross']) assert.equal(logic.judge(g, 'same'), 'no');
});

test('tie-break: S on the edge of the paper is on the paper (rule 8)', () => {
  // p: y = 3; q through (12, 8) with direction (12/5 …): use (2, 1) → S = (2, 3); with direction (1, 0)… use a
  // crossing exactly on the left edge: q through (5, 8), direction (1, 1) → S = (0, 3)
  const s = S({ mode: 'two', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 5, ty: 8, turn: 12 });
  assert.deepEqual(s.at, { x: [0, 1], y: [3, 1] });
  assert.equal(s.inPaper, true);
  assert.equal(s.zoomNeeded, 1);
  // one more square to the left is off the paper
  const o = S({ mode: 'two', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 4, ty: 8, turn: 12 });
  assert.equal(o.inPaper, false);
  assert.equal(o.zoomNeeded, 2);
});

test('tie-break: the set square on T is done, and past T only beyond it (rules 10, 11)', () => {
  const base = { mode: 'slide', tool: 'par', ax: 3, ay: 2, pdx: 2, pdy: 1, tx: 10, ty: 9 };
  assert.equal(S(Object.assign({ j: 7 }, base)).done, true);
  assert.equal(S(Object.assign({ j: 7 }, base)).past, false);
  assert.equal(S(Object.assign({ j: 6 }, base)).past, false);
  assert.equal(S(Object.assign({ j: 8 }, base)).past, true);
  assert.equal(S(Object.assign({ j: -1 }, base)).past, false);
  // T on p: done at once, nothing is past
  const onP = S({ mode: 'slide', tool: 'par', ax: 3, ay: 2, pdx: 2, pdy: 1, tx: 7, ty: 4, j: 0 });
  assert.equal(onP.target, 0);
  assert.equal(onP.onP, true);
  assert.equal(onP.done, true);
  assert.equal(S({ mode: 'slide', tool: 'par', ax: 3, ay: 2, pdx: 2, pdy: 1, tx: 7, ty: 4, j: 3 }).past, false);
});

// ── paper.js: squared-paper geometry ──

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

// ── sim.js: mode 'parts' ──

test('rule 2: the drawn part: a segment A…B, a ray from A, a line both ways', () => {
  const base = { mode: 'parts', ax: 5, ay: 4, bx: 11, by: 7, reach: 2 };
  const seg = S(Object.assign({ kind: 'segment' }, base));
  assert.deepEqual([seg.from, seg.to, seg.reach, seg.ends], [0, 3, 0, 2]);
  const ray = S(Object.assign({ kind: 'ray' }, base));
  assert.deepEqual([ray.from, ray.to, ray.reach, ray.ends], [0, 5, 2, 1]);
  const line = S(Object.assign({ kind: 'line' }, base));
  assert.deepEqual([line.from, line.to, line.reach, line.ends], [-2, 5, 2, 0]);
});

test('rule 2: reach is clamped to where the drawn part reaches the edge of the paper', () => {
  const line = S({ mode: 'parts', kind: 'line', ax: 5, ay: 4, bx: 11, by: 7, reach: 999 });
  // the paper is 0…24 × 0…12; along (2, 1) from (5, 4): s from −2.5 (x = 0) to 8 (y = 12); m = 3
  // → forwards 8 − 3 = 5, backwards ⌈2.5⌉ = 3: the larger, 5
  assert.equal(line.reachMax, 5);
  assert.equal(line.reach, 5);
  assert.equal(S({ mode: 'parts', kind: 'ray', ax: 5, ay: 4, bx: 11, by: 7, reach: 999 }).reachMax, 5);
  assert.equal(S({ mode: 'parts', kind: 'line', ax: 5, ay: 4, bx: 11, by: 7, zoom: '4' }).view.z, 1);
  // backwards the longer way: A near the right edge, B to its left: from (20, 6) to (18, 6), step (−1, 0), m = 2;
  // s from −4 (x = 24) to 20 (x = 0) → forwards 18, backwards 4
  assert.equal(S({ mode: 'parts', kind: 'line', ax: 20, ay: 6, bx: 18, by: 6, reach: 999 }).reachMax, 18);
  assert.equal(S({ mode: 'parts', kind: 'ray', ax: 4, ay: 6, bx: 6, by: 6, reach: 999 }).reachMax, 18);
  assert.equal(S({ mode: 'parts', kind: 'line', ax: 5, ay: 4, bx: 11, by: 7, reach: -3 }).reach, 0);
});

test('rule 3: where T is: drawn, beyond, outside, off', () => {
  assert.equal(preset('segment').where, 'outside');
  assert.equal(preset('segment').on, false);
  assert.equal(preset('segment').onLine, true);
  assert.equal(preset('beyond').where, 'beyond');
  assert.equal(preset('beyond').on, true);
  assert.equal(preset('near').where, 'off');
  assert.equal(preset('near').on, false);
  // the same T as the segment preset: on the ray and the line
  for (const kind of ['ray', 'line']) assert.equal(S({ mode: 'parts', kind, ax: 5, ay: 4, bx: 11, by: 7, tx: 17, ty: 10 }).on, true);
});

test('rule 4: the lengthening that reaches T', () => {
  assert.equal(preset('beyond').need, 4); // k = 7, m = 3
  const back = S({ mode: 'parts', kind: 'line', ax: 5, ay: 4, bx: 11, by: 7, tx: 1, ty: 2, reach: 0 });
  assert.equal(back.need, 2);
  assert.equal(S({ mode: 'parts', kind: 'line', ax: 5, ay: 4, bx: 11, by: 7, tx: 1, ty: 2, reach: 2 }).need, null);
  assert.equal(preset('segment').need, null);
});

test('rule 5: how far T misses the line, in squares straight up/down (or sideways when steep)', () => {
  assert.deepEqual(preset('near').miss, { axis: 'y', by: 1 });
  assert.deepEqual(S({ mode: 'parts', kind: 'line', ax: 5, ay: 1, bx: 7, by: 7, tx: 8, ty: 7 }).miss, { axis: 'x', by: 1 });
  assert.equal(preset('beyond').miss, null);
  // a fraction of a square: the line through (0, 0) and (2, 1) passes (5, 2.5); T = (5, 3) misses by 1/2
  assert.deepEqual(S({ mode: 'parts', kind: 'line', ax: 0, ay: 0, bx: 2, by: 1, tx: 5, ty: 3 }).miss, { axis: 'y', by: 0.5 });
});

test('rule 6: the class\'s answer about T is checked against the figure, not the drawing', () => {
  assert.equal(S(Object.assign({}, logic.PRESETS[1].params, { guess: 'off' })).right, false);
  assert.equal(S(Object.assign({}, logic.PRESETS[1].params, { guess: 'on' })).right, true);
  assert.equal(S(Object.assign({}, logic.PRESETS[2].params, { guess: 'on' })).right, false);
  assert.equal(S(Object.assign({}, logic.PRESETS[0].params, { guess: 'off' })).right, true);
  assert.equal(S(Object.assign({}, logic.PRESETS[0].params, { guess: 'par' })).guess, null); // not a parts answer
  assert.equal(preset('segment').right, null);
});

// ── sim.js: mode 'two' ──

test('rule 7: two lines cross in one point (sjecište), or are parallel; perpendicular at a right angle', () => {
  const m = preset('meet');
  assert.equal(m.rel, 'cross');
  assert.deepEqual(m.at, { x: [7, 1], y: [3, 1] });
  assert.equal(m.corner, true);
  const pp = preset('perp');
  assert.equal(pp.rel, 'perp');
  assert.deepEqual(pp.at, { x: [12, 1], y: [6, 1] });
  assert.equal(S({ mode: 'two', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 12, ty: 8, turn: 0 }).rel, 'parallel');
  assert.equal(S({ mode: 'two', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 12, ty: 8, turn: 24 }).rel, 'perp');
  assert.equal(pp.turnPar, logic.turnOf([2, 1]));
  assert.deepEqual(logic.DIRS[pp.turnPerp], [1, -2]);
});

test('rule 8: turning q towards p sends the crossing away: x = 12 − 5x for steps (x, 1)', () => {
  const xs = [];
  for (const x of [1, 2, 3, 4, 5, 6]) {
    const s = S({ mode: 'two', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 12, ty: 8, turn: logic.turnOf([x, 1]) });
    xs.push(s.at.x[0] / s.at.x[1]);
  }
  assert.deepEqual(xs, [7, 2, -3, -8, -13, -18]);
  const far = preset('far');
  assert.equal(far.inPaper, false);
  assert.equal(far.inView, false);
  assert.equal(far.zoomNeeded, 2);
  assert.equal(S(Object.assign({}, logic.PRESETS[4].params, { zoom: '2' })).inView, true);
  assert.equal(S({ mode: 'two', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 12, ty: 8, turn: logic.turnOf([6, 1]) }).zoomNeeded, 4); // x = −18
  assert.equal(S({ mode: 'two', ax: 0, ay: 0, pdx: 1, pdy: 0, tx: 24, ty: 12, turn: logic.turnOf([6, 1]) }).zoomNeeded, null); // x = −48: not even at zoom 4
});

test('rule 9: the class\'s answer about two lines', () => {
  assert.equal(S(Object.assign({}, logic.PRESETS[4].params, { guess: 'par' })).right, 'no');
  assert.equal(S(Object.assign({}, logic.PRESETS[4].params, { guess: 'cross' })).right, 'yes');
  assert.equal(S(Object.assign({}, logic.PRESETS[5].params, { guess: 'cross' })).right, 'more');
  assert.equal(S(Object.assign({}, logic.PRESETS[5].params, { guess: 'perp' })).right, 'yes');
  assert.equal(S(Object.assign({}, logic.PRESETS[5].params, { guess: 'on' })).guess, null);
});

// ── sim.js: mode 'slide' ──

test('rule 10: the slider\'s reach and the target', () => {
  const s = preset('slide');
  assert.deepEqual([s.target, s.jLo, s.jHi, s.j, s.done], [7, -5, 12, 0, false]);
  assert.equal(S({ mode: 'slide', tool: 'par', ax: 3, ay: 2, pdx: 2, pdy: 1, tx: 10, ty: 9, j: 99 }).j, 12);
  const q = preset('square');
  assert.deepEqual([q.target, q.jLo, q.jHi, q.rel], [13, -1, 14, 'perp']);
  assert.deepEqual(q.edge, [0, 1]);
  assert.equal(S({ mode: 'slide', tool: 'perp', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 15, ty: 9, j: 13 }).done, true);
});

test('rule 11: the legs point towards T', () => {
  assert.equal(preset('slide').legSign, 1);
  assert.equal(S({ mode: 'slide', tool: 'par', ax: 12, ay: 2, pdx: 2, pdy: 1, tx: 3, ty: 9 }).legSign, -1);
  assert.equal(preset('square').legSign, 1);
  assert.equal(S({ mode: 'slide', tool: 'perp', ax: 2, ay: 8, pdx: 1, pdy: 0, tx: 15, ty: 2 }).legSign, -1);
  assert.equal(preset('square').reachT, 6);
});

test('rule 12: params are made valid', () => {
  const s = S({ mode: 'nope', kind: 'circle', ax: -4, ay: 99, tx: 'x' });
  assert.equal(s.mode, 'parts');
  assert.equal(s.kind, 'segment');
  assert.deepEqual(s.a, [0, 12]);
  assert.deepEqual(s.t, [17, 10]);
  assert.deepEqual(logic.dirOf(0, 0), [1, 0]);
  assert.deepEqual(logic.dirOf(-4, -2), [2, 1]);
  assert.deepEqual(logic.dirOf(99, 1), [6, 1]);
  assert.equal(S({ mode: 'two', turn: 999 }).turn, logic.DIRS.length - 1);
  assert.equal(S({ mode: 'two', zoom: '3' }).view.z, 1);
  assert.equal(S({ mode: 'slide', hide: true }).hide, false); // nothing to ask in the construction
  assert.equal(S({ mode: 'parts', hide: 'true' }).hide, false);
  assert.deepEqual(logic.cornerAt(3.5, 2.49), [4, 2]);
  assert.deepEqual(logic.cornerAt(-3, 40), [0, 12]);
});

test('the presets are the SPEC\'s', () => {
  const by = Object.fromEntries(logic.PRESETS.map((p) => [p.id, S(p.params)]));
  assert.deepEqual(Object.keys(by), ['segment', 'beyond', 'near', 'meet', 'far', 'perp', 'slide', 'square']);
  assert.deepEqual([by.segment.kind, by.segment.where], ['segment', 'outside']);
  assert.deepEqual([by.beyond.kind, by.beyond.where, by.beyond.hide], ['line', 'beyond', true]);
  assert.deepEqual([by.near.kind, by.near.where, by.near.hide], ['line', 'off', true]);
  assert.deepEqual([by.meet.rel, by.far.rel, by.perp.rel], ['cross', 'cross', 'perp']);
  assert.deepEqual([by.far.hide, by.perp.hide], [true, true]);
  assert.deepEqual([by.slide.tool, by.square.tool], ['par', 'perp']);
});

// ── gaps found by the fresh review (mutants that survived) ──

test('review: edges and exact checks in paper.js', () => {
  assert.equal(G.inBox({ x: [5, 1], y: [12, 1] }, { x0: 0, y0: 0, x1: 24, y1: 12 }), true);
  assert.deepEqual(G.slide('perp', [2, 3], [1, 0], 0, [15, 9]).slide, [1, 0]);
  assert.deepEqual(G.slide('par', [3, 2], [2, 1], 0, [10, 9]).slide, [1, -2]);
  assert.deepEqual(logic.viewOf(2), { x0: -12, y0: -6, x1: 36, y1: 18, z: 2 });
  assert.deepEqual(logic.viewOf(4), { x0: -36, y0: -18, x1: 60, y1: 30, z: 4 });
});

test('review: the miss at 45° is measured up/down (rule 5 tie-break); none when T is on the line', () => {
  assert.deepEqual(S({ mode: 'parts', kind: 'line', ax: 0, ay: 0, bx: 1, by: 1, tx: 5, ty: 3 }).miss, { axis: 'y', by: 2 });
  assert.equal(preset('segment').miss, null);
});

test('review: reachMax rounds up forwards and backwards', () => {
  assert.equal(S({ mode: 'parts', kind: 'ray', ax: 1, ay: 0, bx: 3, by: 1, reach: 999 }).reachMax, 11);
  assert.equal(S({ mode: 'parts', kind: 'line', ax: 23, ay: 1, bx: 21, by: 0, reach: 99 }).reachMax, 1);
  assert.equal(S({ mode: 'parts', kind: 'line', ax: 20, ay: 6, bx: 22, by: 6, reach: 99 }).reachMax, 20);
});

test('review: a crossing between corners is not on a corner; inPaper ignores the zoom', () => {
  const s = S({ mode: 'two', ax: 2, ay: 3, pdx: 0, pdy: 1, tx: 5, ty: 8, turn: logic.turnOf([2, 1]) });
  assert.deepEqual(s.at, { x: [2, 1], y: [13, 2] });
  assert.equal(s.corner, false);
  assert.equal(S(Object.assign({}, logic.PRESETS[4].params, { zoom: '2' })).inPaper, false);
});

test('review: the slide on the negative side, T on p, legSign 0', () => {
  const base = { mode: 'slide', tool: 'par', ax: 3, ay: 2, pdx: 2, pdy: 1, tx: 10, ty: 2 };
  const s = S(base);
  assert.deepEqual([s.target, s.jLo, s.jHi], [-7, -12, 5]);
  assert.equal(S(Object.assign({}, base, { j: -8 })).past, true);
  assert.equal(S(Object.assign({}, base, { j: -6 })).past, false);
  assert.equal(S(Object.assign({}, base, { j: 3 })).past, false);
  assert.equal(S(Object.assign({}, base, { tx: 7, ty: 4, j: -3 })).past, false);
  assert.equal(S(Object.assign({}, base, { tx: 1, ty: 6 })).legSign, 1);
  const perp = S({ mode: 'slide', tool: 'perp', ax: 2, ay: 3, pdx: 1, pdy: 0, tx: 2, ty: 9 });
  assert.deepEqual([perp.target, perp.done, perp.onP], [0, true, false]);
  assert.ok(Math.abs(preset('slide').reachT - 21 / Math.sqrt(5)) < 1e-9);
  assert.equal(S(Object.assign({}, logic.PRESETS[6].params, { j: 'x' })).j, 0);
});

test('review: params are rounded, empty values take the default, steps are reduced before clamping', () => {
  assert.deepEqual(S({ mode: 'parts', tx: 16.6, ty: 9.5 }).t, [17, 10]);
  assert.deepEqual(S({ mode: 'parts', tx: '', ty: null }).t, [17, 10]);
  assert.deepEqual(logic.dirOf(1, 'x'), [1, 0]);
  assert.deepEqual(logic.dirOf(8, 4), [2, 1]);
  assert.deepEqual(logic.dirOf(12, 6), [2, 1]);
  assert.deepEqual(logic.dirOf(7, 1), [6, 1]);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe and deterministic', () => {
  for (const pr of logic.PRESETS) {
    const s = logic.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.deepEqual(logic.initial(P(pr.params)), s);
  }
});

test('initial does not mutate its params', () => {
  for (const pr of logic.PRESETS) {
    const p = P(pr.params);
    const copy = structuredClone(p);
    logic.initial(p);
    assert.deepEqual(p, copy);
  }
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
