// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for geo-compass: the compass on squared paper (logic.compass) and the three modes (sim.js), rules from
// SPEC.md, tie-breaks first; then the squared-paper model copied from geo-lines (paper.js, its own tests kept);
// then the generic block every sim keeps.
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

const C = logic.compass;
const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const preset = (id) => S(logic.PRESETS.find((p) => p.id === id).params);

// ── tie-breaks first ──

test('tie-break: a point on the circle is "on", and belongs to the disc too (rules 4, 5)', () => {
  assert.equal(C.side([12, 6], 5, [15, 10]), 'on');
  assert.deepEqual(C.belongs([12, 6], 5, [15, 10]), { circle: true, disc: true });
  assert.deepEqual(C.belongs([12, 6], 5, [17, 7]), { circle: false, disc: false });
  assert.deepEqual(C.belongs([12, 6], 5, [14, 8]), { circle: false, disc: true });
});

test('tie-break: the centre is inside: in the disc, not on the circle (rules 4, 5)', () => {
  assert.equal(C.side([12, 6], 4, [12, 6]), 'in');
  assert.deepEqual(C.belongs([12, 6], 4, [12, 6]), { circle: false, disc: true });
  const s = preset('centre');
  assert.equal(s.centre, true);
  assert.equal(s.where, 'in');
  assert.equal(s.d2, 0);
});

test('tie-break: a circle touching the edge of the paper is on it; S is kept so the circle fits (rule 1)', () => {
  assert.deepEqual(S({ mode: 'circle', r: 4, sx: 4, sy: 4 }).s, [4, 4]);
  assert.deepEqual(S({ mode: 'circle', r: 4, sx: 1, sy: 1 }).s, [4, 4]);
  assert.deepEqual(S({ mode: 'circle', r: 4, sx: 24, sy: 12 }).s, [20, 8]);
  assert.deepEqual(S({ mode: 'circle', r: 6, sx: 12, sy: 2 }).s, [12, 6]);
  assert.deepEqual(S({ mode: 'point', r: 6, sx: 0, sy: 12 }).s, [6, 6]);
});

test('tie-break: the disc is coloured only when the circle is closed (rule 3)', () => {
  assert.equal(S({ mode: 'circle', sweep: 11, fill: true }).fill, false);
  assert.equal(S({ mode: 'circle', sweep: 12, fill: true }).fill, true);
  assert.equal(S({ mode: 'circle', sweep: 12, fill: false }).fill, false);
  assert.equal(S({ mode: 'point', fill: false }).fill, true);
});

test('tie-break: a miss is never 0 mm unless T is on the circle (rule 6)', () => {
  assert.equal(C.missMm(25, 5), 0);
  assert.equal(C.missMm(26, 5), 1);
  // a difference under half a millimetre still shows as 1 mm (not reachable on this paper, but kept)
  assert.equal(C.missMm(10001, 100), 1);
  assert.equal(C.missMm(0, 4), 40);
});

test('tie-break: equal sides make a square: one given segment, the compass stays open (rule 9)', () => {
  const s = S({ mode: 'build', a: 5, b: 5, step: 5 });
  assert.equal(s.shape, 'square');
  assert.equal(s.given.b, null);
  assert.deepEqual(s.compass, { needle: [2, 2], pencil: [7, 2] });
  const r = S({ mode: 'build', a: 5, b: 4, step: 5 });
  assert.equal(r.shape, 'rect');
  assert.deepEqual(r.given.b, [[14, 8], [18, 8]]);
  assert.deepEqual(r.compass, { needle: [14, 8], pencil: [18, 8] });
  // a square needs a ≤ 6 (b's limit, the paper's height); a = 9 with b = 6 stays a rectangle
  assert.equal(S({ mode: 'build', a: 9, b: 6 }).shape, 'rect');
});

// ── the compass (logic.compass, for models/squared-paper.js) ──

test('compass: dist2 is whole and exact', () => {
  assert.equal(C.dist2([12, 6], [15, 10]), 25);
  assert.equal(C.dist2([12, 6], [17, 7]), 26);
  assert.equal(C.dist2([12, 6], [12, 6]), 0);
  assert.equal(C.dist2([0, 0], [-3, 4]), 25);
});

test('compass: side compares d² with r² exactly', () => {
  assert.equal(C.side([0, 0], 5, [3, 4]), 'on');
  assert.equal(C.side([0, 0], 5, [5, 1]), 'out');
  assert.equal(C.side([0, 0], 5, [4, 2]), 'in');
  assert.equal(C.side([0, 0], 5, [0, 5]), 'on');
  assert.equal(C.side([0, 0], 5, [0, 6]), 'out');
});

test('compass: a length is whole cm or about c cm m mm (rule 6)', () => {
  assert.deepEqual(C.length(25), { exact: true, cm: 5, mm: 0 });
  assert.deepEqual(C.length(26), { exact: false, cm: 5, mm: 1 });
  assert.deepEqual(C.length(8), { exact: false, cm: 2, mm: 8 });
  assert.deepEqual(C.length(0), { exact: true, cm: 0, mm: 0 });
  assert.deepEqual(C.length(2), { exact: false, cm: 1, mm: 4 });
  // 9.96 rounds to 10.0 cm: 10 cm 0 mm, not "9 cm 10 mm"
  assert.deepEqual(C.length(99.2), { exact: false, cm: 10, mm: 0 });
});

// ── mode 'circle' ──

test('rule 1: r is whole and clamped 1…6; a drag of the pencil rounds to whole cm', () => {
  assert.equal(S({ mode: 'circle', r: 0 }).r, 1);
  assert.equal(S({ mode: 'circle', r: 9 }).r, 6);
  assert.equal(S({ mode: 'circle', r: 3.4 }).r, 3);
  assert.equal(logic.radiusAt([12, 6], 15.4, 6), 3);
  assert.equal(logic.radiusAt([12, 6], 15.6, 6), 4);
  assert.equal(logic.radiusAt([12, 6], 12, 6), 1);
  assert.equal(logic.radiusAt([12, 6], 24, 12), 6);
});

test('rule 2: the compass turns in twelfths; marks at each twelfth; closed at 12', () => {
  assert.equal(S({ mode: 'circle', sweep: 0 }).marks, 1);
  assert.equal(S({ mode: 'circle', sweep: 5 }).marks, 6);
  assert.equal(S({ mode: 'circle', sweep: 11 }).marks, 12);
  assert.equal(S({ mode: 'circle', sweep: 11 }).closed, false);
  const full = S({ mode: 'circle', sweep: 12 });
  assert.equal(full.closed, true);
  assert.equal(full.marks, 12);
  assert.equal(S({ mode: 'circle', sweep: 20 }).sweep, 12);
  assert.equal(S({ mode: 'circle', sweep: -3 }).sweep, 0);
});

// ── mode 'point' ──

test('rule 4: inside, on, outside by d² against r²', () => {
  assert.equal(preset('inside').where, 'in');
  assert.equal(preset('inside').d2, 8);
  assert.equal(preset('slanted').where, 'on');
  assert.equal(preset('slanted').d2, 25);
  assert.equal(preset('near').where, 'out');
  assert.equal(preset('near').d2, 26);
  assert.equal(preset('edge').where, 'on');
  assert.equal(S({ mode: 'point', r: 4, tx: 12, ty: 11 }).where, 'out');
  assert.equal(S({ mode: 'point', r: 4, tx: 12, ty: 10 }).where, 'on');
  assert.equal(S({ mode: 'point', r: 4, tx: 12, ty: 9 }).where, 'in');
});

test('rule 5: belonging: the circle only "on", the disc "in" or "on"', () => {
  const b = (id) => [preset(id).inCircle, preset(id).inDisc];
  assert.deepEqual(b('centre'), [false, true]);
  assert.deepEqual(b('inside'), [false, true]);
  assert.deepEqual(b('slanted'), [true, true]);
  assert.deepEqual(b('near'), [false, false]);
  assert.deepEqual(b('edge'), [true, true]);
});

test('rule 6: the distance and the miss of the presets', () => {
  assert.deepEqual(preset('near').dist, { exact: false, cm: 5, mm: 1 });
  assert.equal(preset('near').miss, 1);
  assert.deepEqual(preset('inside').dist, { exact: false, cm: 2, mm: 8 });
  assert.equal(preset('inside').miss, 12);
  assert.deepEqual(preset('slanted').dist, { exact: true, cm: 5, mm: 0 });
  assert.equal(preset('slanted').miss, 0);
});

test('rule 7: the class\'s answer is checked against the question asked', () => {
  // inside, asked about the circle: "yes" is the typical mistake
  assert.equal(S(Object.assign({}, logic.PRESETS[2].params, { guess: 'yes' })).right, false);
  assert.equal(S(Object.assign({}, logic.PRESETS[2].params, { guess: 'no' })).right, true);
  // the same point asked about the disc: "yes"
  assert.equal(S(Object.assign({}, logic.PRESETS[2].params, { ask: 'disc', guess: 'yes' })).right, true);
  // on the edge, asked about the disc: yes
  assert.equal(S(Object.assign({}, logic.PRESETS[5].params, { guess: 'yes' })).right, true);
  assert.equal(S(Object.assign({}, logic.PRESETS[5].params, { guess: 'no' })).right, false);
  // near: "yes" (it looks on) is wrong
  assert.equal(S(Object.assign({}, logic.PRESETS[4].params, { guess: 'yes' })).right, false);
  // no answer, or an answer that is not yes/no
  assert.equal(S({ mode: 'point' }).right, null);
  assert.equal(S({ mode: 'point', guess: 'on' }).right, null);
  // only mode point asks
  assert.equal(S({ mode: 'circle', hide: true, guess: 'yes' }).hide, false);
  assert.equal(S({ mode: 'circle', hide: true, guess: 'yes' }).guess, null);
  assert.equal(S({ mode: 'build', hide: true }).hide, false);
});

// ── mode 'build' ──

test('rule 8: the construction\'s points and what each step adds', () => {
  const s = (step) => S({ mode: 'build', a: 7, b: 4, step });
  const z = s(0);
  assert.deepEqual([z.A, z.B, z.C, z.D], [[2, 2], [9, 2], [9, 6], [2, 6]]);
  assert.deepEqual(z.pts, []);
  assert.equal(z.line, false);
  assert.equal(z.compass, null);
  assert.equal(z.open, 0);
  assert.deepEqual(z.given.a, [[14, 10], [21, 10]]);
  assert.deepEqual(z.given.b, [[14, 8], [18, 8]]);
  assert.equal(s(1).line, true);
  assert.equal(s(1).ruler, 'p');
  assert.deepEqual(s(1).pts, ['A']);
  assert.deepEqual(s(2).compass, { needle: [14, 10], pencil: [21, 10] });
  assert.equal(s(2).open, 7);
  assert.deepEqual(s(3).compass, { needle: [2, 2], pencil: [9, 2] });
  assert.deepEqual(s(3).pts, ['A', 'B']);
  assert.deepEqual(s(3).arcs, [{ c: [2, 2], r: 7, at: [9, 2] }]);
  assert.equal(s(3).perps, false);
  assert.equal(s(4).perps, true);
  assert.equal(s(4).square, true);
  assert.equal(s(4).compass, null);
  assert.deepEqual(s(5).compass, { needle: [14, 8], pencil: [18, 8] });
  assert.equal(s(5).open, 4);
  assert.deepEqual(s(6).pts, ['A', 'B', 'C', 'D']);
  assert.equal(s(6).arcs.length, 3);
  assert.deepEqual(s(6).compass, { needle: [9, 2], pencil: [9, 6] });
  assert.equal(s(6).sides, false);
  const last = s(7);
  assert.equal(last.last, true);
  assert.equal(last.sides, true);
  assert.equal(last.ruler, null);
  assert.deepEqual(last.compass, { needle: [2, 6], pencil: [9, 6] });
  assert.equal(last.dc2, 49);
  assert.equal(last.arcs.length, 4);
  // every arc is made with the opening of its step and goes through its point
  for (const arc of last.arcs) assert.equal(C.dist2(arc.c, arc.at), arc.r * arc.r);
  assert.equal(s(9).step, 7);
  assert.equal(s(-1).step, 0);
});

test('rule 9: the square preset: b = a, no given b, the compass stays open on A and B', () => {
  assert.equal(preset('square').shape, 'square');
  assert.equal(preset('rect').shape, 'rect');
  const s = (step) => S(Object.assign({}, logic.PRESETS[7].params, { step }));
  assert.deepEqual([s(0).B, s(0).C, s(0).D], [[7, 2], [7, 7], [2, 7]]);
  assert.equal(s(0).given.b, null);
  assert.deepEqual(s(5).compass, { needle: [2, 2], pencil: [7, 2] });
  assert.equal(s(5).open, 5);
  assert.equal(s(7).dc2, 25);
});

test('rule 10: params are made valid', () => {
  assert.equal(S({ mode: 'x' }).mode, 'circle');
  assert.equal(S({ mode: 'point', ask: 'x' }).ask, 'circle');
  assert.equal(S({ mode: 'point', r: '' }).r, 4);
  assert.equal(S({ mode: 'point', r: null }).r, 4);
  assert.deepEqual(S({ mode: 'point', tx: 'x', ty: 99 }).t, [14, 12]);
  assert.deepEqual(S({ mode: 'point', tx: -2, ty: 3.6 }).t, [0, 4]);
  assert.equal(S({ mode: 'build', a: 0, b: 30 }).a, 1);
  assert.equal(S({ mode: 'build', a: 0, b: 30 }).b, 6);
  assert.equal(S({ mode: 'point', hide: 'true' }).hide, false);
  assert.equal(S({ mode: 'point', hide: true }).hide, true);
  assert.deepEqual(logic.cornerAt(3.5, 2.49), [4, 2]);
  assert.deepEqual(logic.cornerAt(-1, 30), [0, 12]);
});

test('review: neighbouring steps, the opening, more clamps, the square only for a = b', () => {
  const s = (step) => S({ mode: 'build', a: 7, b: 4, step });
  assert.deepEqual(s(2).arcs, []);
  assert.deepEqual(s(5).arcs, [{ c: [2, 2], r: 7, at: [9, 2] }]);
  assert.deepEqual(s(6).arcs, [{ c: [2, 2], r: 7, at: [9, 2] }, { c: [2, 2], r: 4, at: [2, 6] }, { c: [9, 2], r: 4, at: [9, 6] }]);
  assert.deepEqual(s(7).arcs[3], { c: [2, 6], r: 7, at: [9, 6] });
  assert.deepEqual(s(5).pts, ['A', 'B']);
  assert.deepEqual(s(2).pts, ['A']);
  assert.equal(s(3).square, false);
  assert.equal(s(5).square, false);
  assert.equal(s(3).perps, false);
  assert.equal(s(0).ruler, null);
  assert.equal(s(2).ruler, null);
  assert.equal(s(6).last, false);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map((k) => s(k).open), [0, 0, 7, 7, 7, 4, 4, 4]);
  assert.equal(S({ mode: 'build', a: 4, b: 5 }).shape, 'rect');
  assert.equal(S({ mode: 'build', a: 99 }).a, 9);
  assert.equal(S({ mode: 'build', a: '', b: '' }).a, 7);
  assert.equal(S({ mode: 'build', a: '', b: '' }).b, 4);
  assert.deepEqual(logic.cornerAt(2.49, 3.5), [2, 4]);
  assert.deepEqual(logic.cornerAt(30, -1), [24, 0]);
  assert.deepEqual(S({ mode: 'circle', sx: '', sy: null }).s, [12, 6]);
  assert.equal(C.missMm(34, 5), 8);
  assert.equal(C.missMm(16, 5), 10);
});

test('the presets are the SPEC\'s', () => {
  assert.deepEqual(logic.defaults, { mode: 'circle', r: 4, sx: 12, sy: 6, tx: 14, ty: 8, sweep: 0, fill: true,
    ask: 'circle', a: 7, b: 4, step: 0, hide: false, guess: '' });
  assert.deepEqual(Object.fromEntries(logic.PRESETS.map((p) => [p.id, p.params])), {
    draw: { mode: 'circle', r: 4, sx: 12, sy: 6, sweep: 0, fill: true },
    centre: { mode: 'point', r: 4, sx: 12, sy: 6, tx: 12, ty: 6, ask: 'circle', hide: true },
    inside: { mode: 'point', r: 4, sx: 12, sy: 6, tx: 14, ty: 8, ask: 'circle', hide: true },
    slanted: { mode: 'point', r: 5, sx: 12, sy: 6, tx: 15, ty: 10, ask: 'circle', hide: true },
    near: { mode: 'point', r: 5, sx: 12, sy: 6, tx: 17, ty: 7, ask: 'circle', hide: true },
    edge: { mode: 'point', r: 4, sx: 12, sy: 6, tx: 16, ty: 6, ask: 'disc', hide: true },
    rect: { mode: 'build', a: 7, b: 4, step: 0 },
    square: { mode: 'build', a: 5, b: 5, step: 0 }
  });
  assert.deepEqual(logic.PRESETS.map((p) => p.id), ['draw', 'centre', 'inside', 'slanted', 'near', 'edge', 'rect', 'square']);
  const d = preset('draw');
  assert.deepEqual([d.mode, d.r, d.s, d.sweep], ['circle', 4, [12, 6], 0]);
  for (const id of ['centre', 'inside', 'slanted', 'near', 'edge']) assert.equal(preset(id).hide, true, id);
  assert.equal(preset('edge').ask, 'disc');
  assert.equal(preset('rect').dc2, 49);
  assert.deepEqual([preset('square').a, preset('square').b], [5, 5]);
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

test('state is JSON-safe and deterministic', () => {
  for (const pr of logic.PRESETS) {
    for (let step = 0; step <= logic.LAST; step++) {
      const s = logic.initial(P(Object.assign({}, pr.params, { step, sweep: step })));
      assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
      assert.deepEqual(logic.initial(P(Object.assign({}, pr.params, { step, sweep: step }))), s);
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
