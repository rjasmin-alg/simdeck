// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-mental-strategies: the number line model copied from ari-constant-difference (its tests come with it),
// then the page's model (sim.js), tie-breaks first, then the generic block every sim keeps. Rules: SPEC.md.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const NL = require('./numberline.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
const W = (over, id) => S(over).ways.find((w) => w.id === id);
const sizes = (over, id) => W(over, id).jumps.map((j) => j.size);
const kinds = (over, id) => W(over, id).jumps.map((j) => j.kind);

// ── the number line (numberline.js, copied from sims/ari-constant-difference @ f2a51d4 with these tests) ──

test('number line: a nice step is 1, 2 or 5 · 10^k, the smallest giving at most maxTicks parts', () => {
  assert.equal(NL.niceStep(10, 10), 1);
  assert.equal(NL.niceStep(11, 10), 2);       // tie-break: 11 / 1 > 10, so 2
  assert.equal(NL.niceStep(20, 10), 2);       // exactly 10 parts is allowed
  assert.equal(NL.niceStep(21, 10), 5);
  assert.equal(NL.niceStep(350, 10), 50);
  assert.equal(NL.niceStep(1000, 10), 100);
  assert.equal(NL.niceStep(0, 10), 1);        // never below 1: whole numbers
  assert.equal(NL.niceStep(1e6, 10), 1e5);
});

test('number line: minor ticks are tenths of 1·10^k, halves of 2·10^k, fifths of 5·10^k, whole only', () => {
  assert.equal(NL.minorStep(1), 0);
  assert.equal(NL.minorStep(2), 1);
  assert.equal(NL.minorStep(5), 1);
  assert.equal(NL.minorStep(10), 1);
  assert.equal(NL.minorStep(20), 10);
  assert.equal(NL.minorStep(50), 10);
  assert.equal(NL.minorStep(100), 10);
});

test('number line: a view covers its values with padding, snapped to its step, never below the floor', () => {
  const v = NL.view([198, 523, 200, 525]);
  assert.deepEqual(v, { lo: 150, hi: 600, step: 50, minor: 10 });
  assert.ok(v.lo <= 198 && v.hi >= 525);
  assert.equal(v.lo % v.step, 0);
  assert.equal(v.hi % v.step, 0);
  // a narrow stretch is widened to minSpan, the odd unit on the right (tie-break)
  assert.deepEqual(NL.view([198, 200], { pad: 0, minSpan: 9 }), { lo: 195, hi: 204, step: 1, minor: 0 });
  // the floor: nothing below 0 unless asked
  assert.equal(NL.view([0, 643]).lo, 0);
  assert.deepEqual(NL.view([3, 5]), { lo: 0, hi: 12, step: 2, minor: 1 });   // the stretch slides right, not shrinks
  assert.ok(NL.view([3, 5], { floor: null }).lo < 0);
  // the ceiling: the stretch slides left and hi is cut to it
  assert.deepEqual(NL.view([600, 1000], { ceil: 1000 }), { lo: 500, hi: 1000, step: 50, minor: 10 });
  assert.ok(NL.view([0, 1000], { ceil: 1000 }).hi === 1000);
  assert.ok(NL.view([0, 1000]).hi > 1000);
  // never more major parts than maxTicks: snapping 1…21 to steps of 2 would give 11, so the step widens to 5
  assert.deepEqual(NL.view([1, 21], { pad: 0 }), { lo: 0, hi: 25, step: 5, minor: 1 });
  for (const vals of [[0, 999], [7, 13], [150, 151], [988, 1000], [1, 9999]]) {
    const w = NL.view(vals);
    assert.ok((w.hi - w.lo) / w.step <= 10, JSON.stringify(vals));
  }
});

test('number line: ticks, positions, free labels, jumps and the value under a drag', () => {
  const v = { lo: 190, hi: 210, step: 5, minor: 1 };
  const t = NL.ticks(v);
  assert.equal(t.length, 21);
  assert.deepEqual(t.filter((x) => x.major).map((x) => x.v), [190, 195, 200, 205, 210]);
  assert.equal(NL.ticks(v, 10).length, 5);    // too many minor ticks: majors only
  assert.equal(NL.pos(200, v), 0.5);
  assert.equal(NL.pos(190, v), 0);
  // a label at a point (tie-break: always hidden) or closer than minFrac to one is left out
  assert.deepEqual(NL.freeLabels(v, [200], 0), [190, 195, 205, 210]);
  assert.deepEqual(NL.freeLabels(v, [199], 0.06), [190, 195, 205, 210]);
  assert.deepEqual(NL.freeLabels(v, [201], 0.25), [190, 195, 210]);
  assert.deepEqual(NL.freeLabels(v, [190, 210]), [195, 200, 205]);
  assert.deepEqual(NL.jump(198, 200), { from: 198, to: 200, size: 2, dir: 'right' });
  assert.deepEqual(NL.jump(203, 200), { from: 203, to: 200, size: -3, dir: 'left' });
  assert.equal(NL.jump(5, 5).dir, 'none');
  assert.equal(NL.valueAt(0.5, v), 200);
  assert.equal(NL.valueAt(0.625, { lo: 0, hi: 4 }), 3);    // 2.5 rounds half up
  assert.equal(NL.valueAt(0.5, { lo: 0, hi: 5 }), 3);
  assert.equal(NL.valueAt(-1, v), 190);
  assert.equal(NL.valueAt(2, v), 210);
});

// ── tie-breaks of the page's model ──

test('tie-break: the task is made valid as in ari-constant-difference (rule 1)', () => {
  assert.deepEqual(logic.numbersOf(P({ op: 'sub', a: 120, b: 300 })), { op: 'sub', a: 120, b: 120 });
  assert.deepEqual(logic.numbersOf(P({ op: 'add', a: 700, b: 600 })), { op: 'add', a: 700, b: 300 });
  assert.deepEqual(logic.numbersOf(P({ op: 'mul', a: 12.6, b: 'x' })), { op: 'add', a: 13, b: 0 });
  assert.deepEqual(logic.numbersOf(P({ a: 'x', b: 5 })), { op: 'add', a: 0, b: 5 });
  assert.deepEqual(logic.numbersOf(P({ op: 'sub', a: 1200, b: -4 })), { op: 'sub', a: 1000, b: 0 });
});

test('tie-break: to a round number takes a jump of exactly b, and a hundred or a ten has none (rule 3)', () => {
  assert.equal(logic.toRound('add', 347, 53), 53);    // exactly b: allowed
  assert.equal(logic.toRound('add', 347, 52), 3);     // the hundred is too far: the ten
  assert.equal(logic.toRound('add', 347, 2), 0);      // the ten too
  assert.equal(logic.toRound('add', 400, 285), 0);    // already a hundred, and a ten
  assert.equal(logic.toRound('add', 340, 285), 60);   // a ten, not a hundred: the hundred
  assert.equal(logic.toRound('add', 340, 25), 0);     // a ten: no ten jump
  assert.equal(logic.toRound('sub', 632, 285), 32);   // down in a difference
  assert.equal(logic.toRound('sub', 632, 31), 2);
  assert.equal(logic.toRound('sub', 632, 32), 32);
  assert.equal(logic.toRound('sub', 600, 285), 0);
  assert.deepEqual(sizes({ a: 400, b: 25 }, 'round'), [20, 5]);
  assert.deepEqual(sizes({ a: 347, b: 53 }, 'round'), [53]);
  assert.deepEqual(sizes({ a: 347, b: 25 }, 'round'), [3, 20, 2]);
});

test('tie-break: compensation rounds b to a hundred within 10, else to a ten, half up; below 10 not at all (rule 4)', () => {
  assert.equal(logic.roundOf(198), 200);
  assert.equal(logic.roundOf(190), 200);   // exactly 10 from the hundred: the hundred
  assert.equal(logic.roundOf(210), 200);
  assert.equal(logic.roundOf(189), 190);   // 11 away: the ten
  assert.equal(logic.roundOf(211), 210);
  assert.equal(logic.roundOf(285), 290);
  assert.equal(logic.roundOf(245), 250);   // 5 rounds up
  assert.equal(logic.roundOf(244), 240);
  assert.equal(logic.roundOf(250), 250);   // a ten already
  assert.equal(logic.roundOf(95), 100);
  assert.equal(logic.roundOf(10), 10);     // the hundred 0 is never aimed at
  assert.equal(logic.roundOf(14), 10);
  assert.equal(logic.roundOf(15), 20);
  assert.equal(logic.roundOf(9), 9);       // below 10: nothing to compensate
  assert.equal(logic.roundOf(0), 0);
  assert.equal(logic.roundOf(995), 1000);
  assert.equal(logic.roundOf(300), 300);
  assert.equal(logic.NEAR, 10);
});

test('tie-break: compensation goes round jumps first when its own order leaves 0…1000, else out (rule 4)', () => {
  // 999 − 198 = 1001 − 200 leaves 1000: −200 first, then +2
  const f = W({ op: 'sub', a: 999, b: 198 }, 'comp');
  assert.deepEqual([f.order, f.over, f.jumps.map((j) => j.size), f.end], ['fix', 1001, [-200, 2], 801]);
  const g = W({ a: 1, b: 298 }, 'comp');
  assert.deepEqual([g.order, g.over, g.jumps.map((j) => j.size), g.end], ['fix', -1, [300, -2], 299]);
  // both orders leave: out, no jumps; over is the first number outside in the constant-sum order
  const o = W({ a: 2, b: 995 }, 'comp');
  assert.deepEqual([o.order, o.out, o.over, o.count], ['out', true, -3, 0]);
  // a mistaken difference below 0 in both orders (200 − 198 → 198 − 200)
  const m = W({ op: 'sub', a: 200, b: 198, mistake: true }, 'comp');
  assert.deepEqual([m.order, m.over], ['out', -2]);
  assert.equal(W({ a: 950, b: 48, mistake: true }, 'comp').over, 1002);
  // the usual order stays when it fits
  assert.equal(W({}, 'comp').order, 'shift');
  assert.equal(W({}, 'comp').over, null);
  assert.equal(logic.leaves(5, [-3, -3]), -1);
  assert.equal(logic.leaves(5, [3, -8]), null);   // 0 is inside
  assert.equal(logic.leaves(999, [1, 1]), 1001);
});

test('tie-break: a carry-free jump to a round number is "place"; then "round" before "cross" (rule 5)', () => {
  assert.equal(logic.kindOf(632, -32), 'place');   // lands on 600 without a borrow
  assert.equal(logic.kindOf(347, 53), 'round');    // lands on 400 with carries
  assert.equal(logic.kindOf(400, -53), 'round');   // leaves 400 with borrows
  assert.equal(logic.kindOf(400, -50), 'round');
  assert.equal(logic.kindOf(330, -5), 'round');
  assert.equal(logic.kindOf(547, 80), 'cross');
  assert.equal(logic.kindOf(627, 5), 'cross');
  assert.equal(logic.kindOf(398, 45), 'cross');
  assert.equal(logic.kindOf(600, -253), 'cross');  // leaves a hundred, but |s| has hundreds: the thousand counts
  assert.equal(logic.kindOf(700, 300), 'round');   // 7 + 3 carries, lands on 1000
  assert.equal(logic.kindOf(347, -15), 'place');
  assert.equal(logic.kindOf(332, 300), 'place');
  assert.equal(logic.kindOf(0, 1000), 'place');
  assert.equal(logic.kindOf(1000, -1000), 'place');
});

test('tie-break: every way tied for easiest is marked (rule 6)', () => {
  // 324 + 152: split +100 +50 +2, round +76 +70 +6, comp +2 +100 +50: all 3 jumps without a crossing: none marked
  const s = S({ a: 324, b: 152 });
  assert.deepEqual(s.ways.map((w) => [w.id, w.cross, w.count, w.best]), [['split', 0, 3, false], ['round', 0, 3, false], ['comp', 0, 3, false]]);
  // 999 − 198: split and round tie (3 jumps, none crossing); comp's +2 from 799 crosses
  assert.deepEqual(S({ op: 'sub', a: 999, b: 198 }).ways.map((w) => w.best), [true, true, false]);
  // fewer crossings beat fewer jumps
  const n = S({ a: 398, b: 245 });
  assert.deepEqual(n.ways.map((w) => w.best), [false, true, false]);
  // b = 0: no jumps anywhere, all tied: none marked
  assert.deepEqual(S({ a: 500, b: 0 }).ways.map((w) => [w.count, w.best]), [[0, false], [0, false], [0, false]]);
  // compensation out, the other two tied: none marked
  assert.deepEqual(S({ op: 'add', a: 950, b: 48, mistake: true }).ways.map((w) => [w.ok, w.best]), [[true, false], [true, false], [false, false]]);
});

test('tie-break: the mistake and an out-of-range path are never the easiest (rule 6)', () => {
  const m = S({ op: 'sub', a: 523, b: 198, mistake: true });
  assert.deepEqual(m.ways.map((w) => [w.id, w.ok, w.best]), [['split', true, false], ['round', true, true], ['comp', false, false]]);
  // 432 + 247 with the mistake: 432 + 3 + 200 + 50 = 685 (right: 429 + 250 = 679), 3 jumps without a crossing, as
  // split's +200 +40 +7; it ties the best but is not marked
  const t = S({ a: 432, b: 247, mistake: true });
  assert.deepEqual(t.ways.map((w) => [w.cross, w.count, w.best]), [[0, 3, true], [0, 4, false], [0, 3, false]]);
  assert.equal(t.ways[2].end, 685);
  // a mistake with k = 0 changes nothing: compensation is right
  assert.equal(W({ a: 432, b: 250, mistake: true }, 'comp').ok, true);
  const o = S({ op: 'add', a: 2, b: 995 });
  const c = o.ways[2];
  assert.equal(c.out, true);
  assert.equal(c.count, 0);
  assert.equal(c.best, false);
});

test('tie-break: one number sits in the middle of the empty line; gaps never below their floor (rule 7)', () => {
  assert.deepEqual(logic.emptyScale([500, 500]), [[500, 0.5]]);
  assert.deepEqual(S({ a: 500, b: 0 }).line, { kind: 'empty', pts: [[500, 0.5]] });
  const pts = logic.emptyScale([347, 632, 400, 350, 349]);
  assert.deepEqual(pts.map((p) => p[0]), [347, 349, 350, 400, 632]);
  assert.equal(pts[0][1], 0);
  assert.equal(pts[pts.length - 1][1], 1);
  // the shares: 2/285, 1/285, 50/285, 232/285 → 0.08, 0.08, 50/285, 232/285, normalised
  const w = [0.08, 0.08, 50 / 285, 232 / 285], sum = w.reduce((p, q) => p + q);
  assert.ok(Math.abs(pts[1][1] - 0.08 / sum) < 1e-12);
  assert.ok(Math.abs(pts[3][1] - (0.16 + 50 / 285) / sum) < 1e-12);
  assert.ok(Math.abs(logic.emptyScale([0, 1, 1000], 0)[1][1] - 0.001) < 1e-12);
  // numeric order, not text order
  assert.deepEqual(logic.emptyScale([98, 103, 100, 5, 1000]).map((p) => p[0]), [5, 98, 100, 103, 1000]);
});

// ── rules ──

test('rule 2: split by place, largest first, zeros left out', () => {
  assert.deepEqual(logic.parts(285), [200, 80, 5]);
  assert.deepEqual(logic.parts(205), [200, 5]);
  assert.deepEqual(logic.parts(80), [80]);
  assert.deepEqual(logic.parts(1000), [1000]);
  assert.deepEqual(logic.parts(0), []);
  assert.deepEqual(sizes({}, 'split'), [200, 80, 5]);
  assert.deepEqual(sizes({ op: 'sub', a: 632 }, 'split'), [-200, -80, -5]);
});

test('rule 3: to a round number first, then the rest split by place', () => {
  assert.deepEqual(sizes({}, 'round'), [53, 200, 30, 2]);
  assert.deepEqual(sizes({ op: 'sub', a: 632 }, 'round'), [-32, -200, -50, -3]);
  assert.deepEqual(W({}, 'round').jumps.map((j) => j.to), [400, 600, 630, 632]);
});

test('rule 4: compensation moves the first number by −k in a sum, +k in a difference, then the round number by place', () => {
  assert.deepEqual(sizes({}, 'comp'), [-5, 200, 90]);                    // 347 + 285 = 342 + 290
  assert.deepEqual(sizes({ op: 'sub', a: 632 }, 'comp'), [5, -200, -90]); // 632 − 285 = 637 − 290
  assert.deepEqual(sizes({ op: 'sub', a: 523, b: 198 }, 'comp'), [2, -200]);
  assert.deepEqual(sizes({ a: 398, b: 244 }, 'comp'), [4, 200, 40]);     // 244 rounds down: the first number takes
  assert.deepEqual(sizes({ a: 347, b: 300 }, 'comp'), [300]);            // already round: no shift
  assert.deepEqual(sizes({ a: 347, b: 7 }, 'comp'), [7]);                // below 10: one jump
  assert.deepEqual(sizes({ a: 347, b: 0 }, 'comp'), []);
  const c = W({}, 'comp');
  assert.deepEqual([c.k, c.R, c.shift, c.a1], [5, 290, -5, 342]);
  // the mistake: the other way, 2k off
  assert.deepEqual(sizes({ mistake: true }, 'comp'), [5, 200, 90]);
  assert.equal(W({ mistake: true }, 'comp').end, 642);
  assert.equal(W({ op: 'sub', a: 523, b: 198, mistake: true }, 'comp').end, 321);
  // the mistake only touches compensation
  assert.deepEqual(sizes({ mistake: true }, 'split'), sizes({}, 'split'));
  assert.deepEqual(sizes({ mistake: true }, 'round'), sizes({}, 'round'));
  // out of 0…1000
  assert.equal(W({ op: 'sub', a: 999, b: 198 }, 'comp').out, false);  // 1001 − 200: the other order
  assert.equal(W({ op: 'add', a: 2, b: 298 }, 'comp').order, 'shift'); // 0 + 300
  assert.equal(W({ op: 'add', a: 950, b: 48, mistake: true }, 'comp').out, true);  // 952 + 50 = 1002, 1000 + 2
});

test('rule 5 + every way lands on the result: a sweep over tasks, both operations', () => {
  const as = [0, 1, 7, 50, 99, 100, 347, 398, 400, 523, 632, 950, 999, 1000];
  const bs = [0, 1, 4, 5, 9, 10, 45, 49, 50, 99, 100, 198, 245, 250, 285, 500, 999, 1000];
  let paths = 0;
  for (const op of logic.OPS) for (const a of as) for (const b of bs) {
    if (!logic.fits(op, a, b)) continue;
    const s = S({ op, a, b });
    for (const w of s.ways) {
      const tag = `${op} ${a} ${b} ${w.id}`;
      if (w.out) { assert.equal(w.id, 'comp', tag); continue; }
      assert.equal(w.end, s.r, tag);
      assert.equal(w.ok, true, tag);
      let x = a;
      for (const j of w.jumps) {
        assert.equal(j.from, x, tag);
        assert.ok(j.size !== 0, tag + ' no empty jump');
        assert.ok(j.to >= 0 && j.to <= logic.MAX, tag + ' in 0…1000');
        assert.equal(j.kind, logic.kindOf(j.from, j.size));
        x = j.to;
      }
      paths++;
      // splitting and to a round number move only one way: forwards in a sum, backwards in a difference
      if (w.id !== 'comp') for (const j of w.jumps) assert.equal(Math.sign(j.size), op === 'add' ? 1 : -1, tag);
    }
  }
  assert.ok(paths > 600);
});

test('rule 7: the line holds every landing, the same number at the same place on each line', () => {
  for (const pr of logic.PRESETS.concat([{ params: { op: 'add', a: 1, b: 2 } }, { params: { op: 'sub', a: 1000, b: 999 } }, { params: { op: 'add', a: 1, b: 298 } }])) {
    for (const scale of [false, true]) {
      const s = S(Object.assign({}, pr.params, { scale }));
      const xs = [s.a, s.r].concat(...s.ways.map((w) => w.jumps.map((j) => j.to)));
      for (const v of xs) {
        const x = logic.xOf(s.line, v);
        assert.ok(x >= 0 && x <= 1, `${JSON.stringify(pr.params)} ${scale} ${v}`);
      }
      // in order: a larger number never sits left of a smaller one
      const sorted = [...new Set(xs)].sort((p, q) => p - q);
      for (let i = 1; i < sorted.length; i++) assert.ok(logic.xOf(s.line, sorted[i]) > logic.xOf(s.line, sorted[i - 1]));
      if (scale) {
        assert.equal(s.line.kind, 'scale');
        assert.ok(s.line.view.lo >= 0 && s.line.view.hi <= logic.MAX);
      }
    }
  }
  // to scale: the number line's view over every mark (1 + 298 goes to 301), padded 4 % (unpadded 320…480)
  assert.deepEqual(S({ a: 324, b: 152, scale: true }).line.view, { lo: 300, hi: 500, step: 20, minor: 10 });
  assert.ok(S({ a: 1, b: 298, scale: true }).line.view.hi >= 301);
  // between two marked numbers, in proportion
  const line = { kind: 'empty', pts: [[300, 0], [400, 0.5], [500, 1]] };
  assert.equal(logic.xOf(line, 350), 0.25);
  assert.equal(logic.xOf(line, 200), 0);
  assert.equal(logic.xOf(line, 900), 1);
});

test('rule 8: j is clamped to the longest path, each line shows its own first jumps, a short path waits', () => {
  const s = S({ j: 2 });
  assert.equal(s.jmax, 4);
  assert.deepEqual(s.ways.map((w) => [w.shown, w.done, w.at]), [[2, false, 627], [2, false, 600], [2, false, 542]]);
  assert.deepEqual(S({ op: 'sub', a: 523, b: 198, j: 3 }).ways.map((w) => [w.shown, w.done]), [[3, true], [3, false], [2, true]]);
  assert.equal(s.done, false);
  assert.deepEqual(S({ j: 0 }).ways.map((w) => [w.shown, w.at]), [[0, 347], [0, 347], [0, 347]]);
  assert.equal(S({ j: 99 }).j, 4);
  assert.equal(S({ j: -3 }).j, 0);
  assert.equal(S({ j: 'x' }).j, 4);
  assert.equal(S({}).done, true);
  assert.equal(S({ a: 500, b: 0 }).jmax, 0);
});

test('the presets give SPEC\'s numbers', () => {
  const want = {
    cat: [632, [[200, 80, 5], [53, 200, 30, 2], [-5, 200, 90]], ['round']],
    back: [347, [[-200, -80, -5], [-32, -200, -50, -3], [5, -200, -90]], ['round']],
    place: [688, [[200, 50, 6], [68, 100, 80, 8], [-4, 200, 60]], ['split']],
    near: [643, [[200, 40, 5], [2, 200, 40, 3], [-5, 200, 50]], ['round']],
    comp: [325, [[-100, -90, -8], [-23, -100, -70, -5], [2, -200]], ['comp']],
    wrong: [325, [[-100, -90, -8], [-23, -100, -70, -5], [-2, -200]], ['round']]
  };
  const crosses = { cat: [2, 0, 1], back: [2, 0, 1], place: [0, 0, 1], near: [2, 0, 1], comp: [2, 0, 0], wrong: [2, 0, 0] };
  for (const pr of logic.PRESETS) {
    const s = S(pr.params);
    assert.equal(s.r, want[pr.id][0], pr.id);
    assert.deepEqual(s.ways.map((w) => w.jumps.map((j) => j.size)), want[pr.id][1], pr.id);
    assert.deepEqual(s.ways.filter((w) => w.best).map((w) => w.id), want[pr.id][2], pr.id);
    assert.deepEqual(s.ways.map((w) => w.cross), crosses[pr.id], pr.id);
    assert.equal(s.jmax, 4, pr.id);
  }
  assert.deepEqual(kinds({}, 'round'), ['round', 'place', 'place', 'place']);
  assert.deepEqual(kinds({ op: 'sub', a: 632 }, 'round'), ['place', 'place', 'round', 'round']);
  assert.equal(logic.PRESETS.length, 6);
});

test('the task field: what it reads and what it refuses', () => {
  assert.deepEqual(logic.parseTask('347 + 285'), { task: { op: 'add', a: 347, b: 285 } });
  assert.deepEqual(logic.parseTask(' 632-285 '), { task: { op: 'sub', a: 632, b: 285 } });
  assert.deepEqual(logic.parseTask('6 3 2 – 2 8 5 ='), { task: { op: 'sub', a: 632, b: 285 } });
  assert.deepEqual(logic.parseTask(''), { error: 'empty' });
  assert.deepEqual(logic.parseTask('347'), { error: 'op' });
  assert.deepEqual(logic.parseTask('5 + 3 - 1'), { error: 'op' });
  assert.deepEqual(logic.parseTask('5.5 + 1'), { error: 'num' });
  assert.deepEqual(logic.parseTask('1001 - 1'), { error: 'big' });
  assert.deepEqual(logic.parseTask('5 + 1001'), { error: 'big' });
  assert.deepEqual(logic.parseTask('285 - 632'), { error: 'neg' });
  assert.deepEqual(logic.parseTask('600 + 401'), { error: 'sum' });
  assert.deepEqual(logic.parseTask('600 + 400'), { task: { op: 'add', a: 600, b: 400 } });
  assert.deepEqual(logic.parseTask('500 − 500'), { task: { op: 'sub', a: 500, b: 500 } });   // a difference of 0
  assert.equal(logic.taskText({ op: 'sub', a: 632, b: 285 }), '632 − 285');
  assert.equal(logic.taskText({ op: 'add', a: 347, b: 285 }), '347 + 285');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset, the defaults and both lines', () => {
  for (const p of [{}, { scale: true }, { j: 1 }].concat(logic.PRESETS.map((x) => x.params))) {
    const s = S(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ op: 'sub', a: 523, b: 198, j: 2, mistake: true });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid params with its strings, and the page is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.PRESETS) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.ok(logic.fits(pr.params.op, pr.params.a, pr.params.b), pr.id);
    assert.ok('p_' + pr.id in strings.hr, 'label for ' + pr.id);
    assert.ok('ph_' + pr.id in strings.hr, 'hint for ' + pr.id);
  }
  for (const w of logic.WAYS) assert.ok('w_' + w in strings.hr, 'name of ' + w);
});
