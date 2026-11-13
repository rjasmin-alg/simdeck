// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for ari-constant-difference: the number line model (numberline.js, promotable), then the page's model
// (sim.js), tie-breaks first, then the generic block every sim keeps. Rules: SPEC.md.
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

// ── the number line (numberline.js; moves to models/ with these tests) ──

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

test('tie-break: a subtrahend larger than the minuend is lowered to it (rule 1)', () => {
  assert.deepEqual(logic.numbersOf(P({ a: 120, b: 300 })), { op: 'sub', a: 120, b: 120 });
  assert.deepEqual(logic.numbersOf(P({ a: 1200, b: -4 })), { op: 'sub', a: 1000, b: 0 });
  assert.deepEqual(logic.numbersOf(P({ a: 12.6, b: 'x' })), { op: 'sub', a: 13, b: 0 });
});

test('tie-break: a sum over 1000 lowers the second addend (rule 1)', () => {
  assert.deepEqual(logic.numbersOf(P({ op: 'add', a: 700, b: 600 })), { op: 'add', a: 700, b: 300 });
  assert.deepEqual(logic.numbersOf(P({ op: 'add', a: 300, b: 700 })), { op: 'add', a: 300, b: 700 });
  assert.equal(logic.numbersOf(P({ op: 'mul' })).op, 'sub');
});

test('tie-break: in a sum the target is the addend nearer a ten, the first on a tie (rule 4)', () => {
  assert.equal(logic.targetOf('add', 'right', 398, 245), 'a');
  assert.equal(logic.targetOf('add', 'right', 245, 398), 'b');
  assert.equal(logic.targetOf('add', 'right', 395, 245), 'a');   // 5 and 5: the first
  assert.equal(logic.targetOf('add', 'right', 243, 247), 'a');   // 3 and 3: the first
  assert.equal(logic.targetOf('add', 'one', 245, 398), 'a');     // only the first moves
  assert.equal(logic.targetOf('sub', 'right', 398, 245), 'b');   // a difference: always the subtrahend
});

test('tie-break: rounding goes half up, to the ten first, then to the hundred (rule 5)', () => {
  assert.equal(logic.roundOf(195), 200);
  assert.equal(logic.roundOf(194), 190);
  assert.equal(logic.roundOf(198), 200);
  assert.equal(logic.roundOf(180), 200);
  assert.equal(logic.roundOf(150), 200);   // 50 rounds up
  assert.equal(logic.roundOf(140), 100);
  assert.equal(logic.roundOf(200), 200);
  assert.equal(logic.roundOf(0), 0);
  assert.equal(logic.roundOf(4), 10);      // never aimed at 0: 1…4 go up to 10
  assert.equal(logic.roundOf(1), 10);
  assert.equal(logic.roundOf(5), 10);
});

test('tie-break: k = 0 leaves every way the same', () => {
  for (const op of logic.OPS) for (const way of logic.WAYS) {
    const s = S({ op, a: 523, b: 198, k: 0, way });
    assert.equal(s.same, true, op + ' ' + way);
    assert.equal(s.delta, 0);
  }
});

// ── rules ──

test('rule 2: how each way moves the two numbers', () => {
  const m = (op, way) => logic.moved(op, way, 523, 198, 2);
  assert.deepEqual(m('sub', 'right'), { a2: 525, b2: 200 });
  assert.deepEqual(m('sub', 'one'), { a2: 523, b2: 200 });
  assert.deepEqual(m('sub', 'flip'), { a2: 525, b2: 196 });
  assert.deepEqual(logic.moved('add', 'right', 398, 245, 2), { a2: 400, b2: 243 });
  assert.deepEqual(logic.moved('add', 'one', 398, 245, 2), { a2: 400, b2: 245 });
  assert.deepEqual(logic.moved('add', 'flip', 398, 245, 2), { a2: 400, b2: 247 });
});

test('rule 6: the right way keeps the result for every shift in range; the wrong ways change it by k or 2k', () => {
  for (const op of logic.OPS) {
    for (const [a, b] of [[523, 198], [645, 203], [398, 245], [503, 178], [100, 0], [1000, 1000]]) {
      const n = logic.numbersOf(P({ op, a, b }));
      for (const way of logic.WAYS) {
        const r = logic.kRange(P({ op, a, b, way }));
        for (let k = r.lo; k <= r.hi; k++) {
          const s = S({ op, a, b, k, way });
          const want = way === 'right' ? 0 : way === 'one' ? (op === 'sub' ? -k : k) : 2 * k;
          assert.ok(s.delta === want, `${op} ${n.a} ${n.b} ${way} ${k}: ${s.delta} ≠ ${want}`);
          assert.equal(s.r2, logic.valueOf(op, s.a2, s.b2));
        }
      }
    }
  }
});

test('rule 3: the shift stays where every moved number is in 0…1000 and a difference is not below 0', () => {
  assert.deepEqual(logic.kRange(P({ a: 523, b: 198 })), { lo: -198, hi: 200 });   // K_MAX caps the right
  assert.deepEqual(logic.kRange(P({ a: 998, b: 7 })), { lo: -7, hi: 2 });
  assert.deepEqual(logic.kRange(P({ a: 523, b: 198, way: 'one' })), { lo: -198, hi: 200 });
  assert.deepEqual(logic.kRange(P({ a: 210, b: 198, way: 'one' })), { lo: -198, hi: 12 });
  assert.deepEqual(logic.kRange(P({ a: 210, b: 198, way: 'flip' })), { lo: -6, hi: 198 });
  assert.deepEqual(logic.kRange(P({ op: 'add', a: 398, b: 245 })), { lo: -200, hi: 200 });
  assert.deepEqual(logic.kRange(P({ op: 'add', a: 20, b: 30 })), { lo: -20, hi: 30 });
  assert.deepEqual(logic.kRange(P({ op: 'add', a: 600, b: 300, way: 'flip' })), { lo: -200, hi: 50 });
  assert.deepEqual(logic.kRange(P({ op: 'add', a: 600, b: 300, way: 'one' })), { lo: -200, hi: 100 });
  assert.equal(S({ a: 998, b: 7, k: 50 }).k, 2);
  assert.equal(S({ a: 998, b: 7, k: -50 }).k, -7);
  assert.equal(S({ k: 2.4 }).k, 2);
  assert.equal(S({ k: 'x' }).k, 0);
});

test('rule 5: the round shift makes the target a ten, then a hundred, and is refused out of range', () => {
  assert.deepEqual(logic.roundShift(P({ k: 0 })), { k: 2, from: 198, to: 200, fits: true, why: null });
  assert.deepEqual(logic.roundShift(P({ k: 2 })), { k: 2, from: 200, to: 200, fits: true, why: null });
  assert.deepEqual(logic.roundShift(P({ a: 645, b: 203, k: 0 })), { k: -3, from: 203, to: 200, fits: true, why: null });
  assert.deepEqual(logic.roundShift(P({ a: 503, b: 178, k: 0 })), { k: 2, from: 178, to: 180, fits: true, why: null });
  assert.deepEqual(logic.roundShift(P({ a: 503, b: 178, k: 2 })), { k: 22, from: 180, to: 200, fits: true, why: null });
  assert.deepEqual(logic.roundShift(P({ op: 'add', a: 398, b: 245, k: 0 })), { k: 2, from: 398, to: 400, fits: true, why: null });
  // the second addend as the target: it goes up, so the shift (the first addend's move) goes down
  assert.deepEqual(logic.roundShift(P({ op: 'add', a: 245, b: 398, k: 0 })), { k: -2, from: 398, to: 400, fits: true, why: null });
  // flip in a difference moves the subtrahend down
  assert.deepEqual(logic.roundShift(P({ a: 523, b: 198, k: 0, way: 'flip' })), { k: -2, from: 198, to: 200, fits: true, why: null });
  assert.equal(logic.roundShift(P({ a: 998, b: 7, k: 0 })).fits, false);
  assert.equal(logic.roundShift(P({ a: 998, b: 7, k: 0 })).k, 3);
  assert.equal(logic.roundShift(P({ a: 998, b: 7, k: 0 })).why, 'range');
  // the task would fit, but the shift would pass ±200
  assert.deepEqual(logic.roundShift(P({ a: 523, b: 198, k: 200 })), { k: 202, from: 398, to: 400, fits: false, why: 'cap' });
  assert.equal(logic.roundShift(P({ k: 0 })).why, null);
  // 4 is not rounded down to 0
  assert.equal(logic.roundShift(P({ a: 523, b: 4, k: 0 })).k, 6);
});

test('the state: target, round, lenses with where the right move would land', () => {
  const s = S({});
  assert.equal(s.target, 'b');
  assert.equal(s.targetValue, 200);
  assert.equal(s.targetRound, true);
  assert.deepEqual(s.lenses.map((l) => [l.role, l.from, l.to, l.want, l.ok]), [['b', 198, 200, 200, true], ['a', 523, 525, 525, true]]);
  const one = S({ way: 'one' });
  assert.deepEqual(one.lenses.map((l) => [l.role, l.to, l.want, l.ok]), [['b', 200, 200, true], ['a', 523, 525, false]]);
  const sum = S({ op: 'add', a: 398, b: 245, way: 'flip' });
  assert.deepEqual(sum.lenses.map((l) => [l.role, l.from, l.to, l.want, l.ok]), [['split', 398, 400, 400, true], ['end', 643, 647, 643, false]]);
  for (const l of sum.lenses) assert.ok(l.view.lo <= Math.min(l.from, l.to, l.want) && l.view.hi >= Math.max(l.from, l.to, l.want));
  // the main line of a sum starts at 0; a difference's shows only its stretch
  assert.equal(sum.view.lo, 0);
  assert.ok(s.view.lo > 0 && s.view.lo <= 198 && s.view.hi >= 525);
  assert.equal(S({ k: 3 }).targetRound, false);
  assert.equal(S({ a: 1000, b: 3, k: -3 }).targetRound, false);   // 0 is not called round
  assert.equal(S({ a: 990, b: 3, k: 7 }).targetRound, true);
});

test('every view holds what it shows: the moved points on the main lines, from/to/want in the close-ups, within 0…1000', () => {
  const tasks = [[523, 198], [1000, 0], [1000, 1000], [0, 0], [1000, 199], [900, 0], [3, 2], [600, 400], [999, 1], [50, 20]];
  for (const op of logic.OPS) for (const [a, b] of tasks) for (const way of logic.WAYS) {
    const r = logic.kRange(P({ op, a, b, way }));
    for (const k of [r.lo, -1, 0, 1, 2, r.hi]) {
      if (k < r.lo || k > r.hi) continue;
      const s = S({ op, a, b, k, way });
      const tag = `${op} ${a} ${b} ${way} ${k}`;
      const pts = op === 'sub' ? [s.a, s.b, s.a2, s.b2] : [0, s.a, s.a2, s.a + s.b, s.a2 + s.b2];
      for (const v of pts) assert.ok(v >= s.view.lo && v <= s.view.hi, tag + ' main ' + v);
      assert.ok(s.view.lo >= 0 && s.view.hi <= logic.MAX, tag + ' main in 0…1000');
      for (const l of s.lenses) {
        for (const v of [l.from, l.to].concat(l.wantShown ? [l.want] : [])) assert.ok(v >= l.view.lo && v <= l.view.hi, tag + ' lens ' + v);
        assert.ok(l.view.lo >= 0 && l.view.hi <= logic.MAX, tag + ' lens in 0…1000');
        assert.equal(l.wantShown, !l.ok && l.want >= 0 && l.want <= logic.MAX);
      }
    }
  }
  // the right move of a mistake can leave 0…1000: then "should be" is not shown
  const f = S({ a: 1000, b: 199, way: 'flip', k: -200 });
  assert.equal(f.lenses[0].want, -1);
  assert.equal(f.lenses[0].wantShown, false);
  assert.equal(S({ a: 900, b: 0, way: 'one', k: 200 }).lenses[1].wantShown, false);
  assert.equal(S({ way: 'one' }).lenses[1].wantShown, true);
});

test('the presets give the catalogue\'s numbers (SPEC, Presets)', () => {
  const want = {
    round: [525, 200, 325, 325], take: [642, 200, 442, 442], sum: [400, 243, 643, 643],
    one: [523, 200, 325, 323], same: [400, 247, 643, 647], equal: [613, 288, 325, 325]
  };
  for (const pr of logic.PRESETS) {
    const s = S(pr.params);
    assert.deepEqual([s.a2, s.b2, s.r, s.r2], want[pr.id], pr.id);
    assert.equal(s.k, pr.params.k, pr.id + ': the shift is in range');
  }
  assert.equal(logic.PRESETS.length, 6);
});

test('the task field: what it reads and what it refuses', () => {
  assert.deepEqual(logic.parseTask('523 − 198'), { task: { op: 'sub', a: 523, b: 198 } });
  assert.deepEqual(logic.parseTask(' 523-198 '), { task: { op: 'sub', a: 523, b: 198 } });
  assert.deepEqual(logic.parseTask('398 + 245'), { task: { op: 'add', a: 398, b: 245 } });
  assert.deepEqual(logic.parseTask('5 2 3 – 1 9 8'), { task: { op: 'sub', a: 523, b: 198 } });
  assert.deepEqual(logic.parseTask('1000 - 1000'), { task: { op: 'sub', a: 1000, b: 1000 } });
  assert.deepEqual(logic.parseTask(''), { error: 'empty' });
  assert.deepEqual(logic.parseTask('523'), { error: 'op' });
  assert.deepEqual(logic.parseTask('5 - 3 - 1'), { error: 'op' });
  assert.deepEqual(logic.parseTask('5 + 3 - 1'), { error: 'op' });
  assert.deepEqual(logic.parseTask('-5'), { error: 'num' });
  assert.deepEqual(logic.parseTask('5.5 - 1'), { error: 'num' });
  assert.deepEqual(logic.parseTask('1001 - 1'), { error: 'big' });
  assert.deepEqual(logic.parseTask('5 + 1001'), { error: 'big' });   // big before sum
  assert.deepEqual(logic.parseTask('198 - 523'), { error: 'neg' });
  assert.deepEqual(logic.parseTask('600 + 401'), { error: 'sum' });
  assert.deepEqual(logic.parseTask('600 + 400'), { task: { op: 'add', a: 600, b: 400 } });
  assert.deepEqual(logic.parseTask('523 − 198 ='), { task: { op: 'sub', a: 523, b: 198 } });   // a trailing = as pupils write it
  assert.deepEqual(logic.parseTask('523 − 198 = 325'), { error: 'num' });
  assert.equal(logic.taskText({ op: 'sub', a: 523, b: 198 }), '523 − 198');
  assert.equal(logic.taskText({ op: 'add', a: 398, b: 245 }), '398 + 245');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [{}].concat(logic.PRESETS.map((x) => x.params))) {
    const s = S(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ op: 'add', a: 398, b: 245, k: 7, way: 'flip' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  logic.roundShift(p);
  assert.deepEqual(p, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the model is valid params, and the page is an explorer', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  for (const pr of logic.PRESETS) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    assert.ok(logic.fits(pr.params.op, pr.params.a, pr.params.b), pr.id);
  }
  // every preset has its label and hint in the strings
  for (const pr of logic.PRESETS) {
    assert.ok('p_' + pr.id in strings.hr, 'label for ' + pr.id);
    assert.ok('ph_' + pr.id in strings.hr, 'hint for ' + pr.id);
  }
});
