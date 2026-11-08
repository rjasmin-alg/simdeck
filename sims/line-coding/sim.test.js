// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for line-coding's model (SPEC.md). Run: node --test sims/line-coding/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
/** The state for a bit string at a drift (own bits, not a pattern). */
const of = (bits, drift = 0) => logic.derive(P({ pattern: 'own', code: logic.codeOf(bits), drift }));
const preset = (id) => logic.derive(P(logic.presets.find((p) => p.id === id).params));
const times = (edges) => edges.map((e) => e.t);
const lvl = (segs) => segs.map((s) => [s.level, s.from, s.to]);

// ── tie-breaks first ──

test('tie-break rule 5: an instant exactly on the run\'s end belongs to the next run (exact halves round down)', () => {
  // run of 3 at +20 %: instants 0.6, 1.8, 3.0 → 3.0 is the end, so 2 samples (round(2.5) would give 3)
  assert.deepEqual(logic.readNrz('111', 20).samples.map((s) => s.t), [0.6, 1.8]);
  assert.deepEqual(logic.readNrz('111', 20).errors, [{ cell: 2, kind: 'lost' }]);
  // run of 2 at −20 %: instants 0.4, 1.2, 2.0 → 2 samples, read correctly (round(2.5) would give 3)
  assert.deepEqual(logic.readNrz('00', -20).samples.map((s) => s.t), [0.4, 1.2]);
  assert.deepEqual(logic.readNrz('00', -20).errors, []);
  // the next run re-aligns at the transition: 111 then 0 at +20 % samples the 0 at 3.6
  assert.deepEqual(logic.readNrz('1110', 20).samples.map((s) => [s.t, s.bit]), [[0.6, 1], [1.8, 1], [3.6, 0]]);
  // every tie in range, as listed in SPEC.md
  const ties = { '-20': [2, 6, 10, 14], '-12': [11], '-4': [12], '4': [13], '12': [14], '20': [3, 9, 15] };
  for (const [d, ks] of Object.entries(ties)) {
    for (const k of ks) {
      const x = (k * 100) / (100 + Number(d));
      assert.equal(logic.readNrz('0'.repeat(k), Number(d)).samples.length, x - 0.5, `d ${d}, k ${k}`);
    }
  }
});

test('tie-break rule 5: an instant exactly on a cell boundary inside a run falls in the later cell', () => {
  const s = logic.readNrz('1111', 20).samples;   // 0.6, 1.8, 3.0
  assert.deepEqual(s.map((x) => x.t), [0.6, 1.8, 3]);
  assert.deepEqual(s.map((x) => x.cell), [0, 1, 3]);
  assert.deepEqual(logic.readNrz('1111', 20).errors, [{ cell: 2, kind: 'lost' }]);
});

test('tie-break: a pattern other than own wins over code; own uses code', () => {
  assert.equal(logic.bitsFrom({ pattern: '1101', code: logic.codeOf('0') }), '1101');
  assert.equal(logic.bitsFrom({ pattern: 'own', code: logic.codeOf('0010') }), '0010');
  assert.equal(logic.bitsFrom({ pattern: 'nonsense', code: logic.codeOf('01') }), '01');
  assert.equal(logic.codeOf('1001'), 25);
  assert.equal(logic.bitsOf(25), '1001');
  assert.equal(logic.bitsOf(logic.codeOf('0000000000000000')), '0000000000000000', 'leading zeros kept');
  assert.equal(logic.bitsOf(logic.CODE_MAX).length, logic.MAX_BITS);
  assert.equal(logic.bitsOf(logic.CODE_MIN).length, logic.MIN_BITS);
});

// ── rules ──

test('rule 1: NRZ-L holds the level for the whole cell, 1 high, 0 low; equal neighbours make no transition', () => {
  assert.deepEqual(lvl(logic.nrz('1001')), [[1, 0, 1], [0, 1, 3], [1, 3, 4]]);
  assert.deepEqual(times(of('1001').edges.nrz), [1, 3]);
  assert.deepEqual(of('1001').edges.nrz.map((e) => e.dir), ['down', 'up']);
  assert.deepEqual(of('0110').edges.nrz.map((e) => e.kind), ['boundary', 'boundary']);
  assert.equal(of('1111').transitions.nrz, 0);
});

test('rule 2: Manchester has a transition in the middle of every cell, low→high = 1, high→low = 0', () => {
  const s = of('1001');
  const mid = s.edges.man.filter((e) => e.kind === 'mid');
  assert.deepEqual(times(mid), [0.5, 1.5, 2.5, 3.5]);
  assert.deepEqual(mid.map((e) => e.dir), ['up', 'down', 'down', 'up']);
  assert.deepEqual(lvl(logic.manchester('1')), [[0, 0, 0.5], [1, 0.5, 1]]);
  assert.deepEqual(lvl(logic.manchester('0')), [[1, 0, 0.5], [0, 0.5, 1]]);
});

test('rule 3: equal neighbours need a boundary jump, which is not a bit; different neighbours none', () => {
  const s = of('1001');
  const jumps = s.edges.man.filter((e) => e.kind === 'boundary');
  assert.deepEqual(jumps.map((e) => [e.t, e.dir]), [[2, 'up']]);         // between the two 0s: back up
  assert.deepEqual(of('1101').edges.man.filter((e) => e.kind === 'boundary').map((e) => [e.t, e.dir]), [[1, 'down']]);
  assert.equal(of('10101010').transitions.manBoundary, 0);
  assert.equal(of('0000').transitions.manBoundary, 3);
  // jumps never count as bits: the receiver reads one bit per cell
  assert.deepEqual(s.readMan, [1, 0, 0, 1]);
});

test('rule 4: the Manchester receiver reads the direction of the mid-cell transition, not the level', () => {
  // a 0 and a 1 spend the same time high and low; only the direction tells them apart
  const one = logic.manchester('1'), zero = logic.manchester('0');
  const time = (segs, level) => segs.filter((x) => x.level === level).reduce((a, x) => a + x.to - x.from, 0);
  assert.equal(time(one, 1), time(zero, 1));
  assert.deepEqual(of('0').readMan, [0]);
  assert.deepEqual(of('1').readMan, [1]);
  // a falling edge read as a 0 whatever level follows the cell: 00 and 01 both start with a 0
  assert.equal(of('00').readMan[0], 0);
  assert.equal(of('01').readMan[0], 0);
});

test('rule 5: NRZ re-aligns on transitions; at +10 % a run of 6 loses a bit, a run of 5 does not', () => {
  assert.deepEqual(of('000001', 10).errors.nrz, []);
  assert.deepEqual(of('0000001', 10).errors.nrz, [{ cell: 5, kind: 'lost' }]);
  assert.equal(of('0000001', 10).readNrz.length, 6);
  // at −10 % a run of 5 gains a bit, a run of 4 does not
  assert.deepEqual(of('00001', -10).errors.nrz, []);
  assert.deepEqual(of('000001', -10).errors.nrz, [{ cell: 4, kind: 'extra' }]);
  assert.equal(of('000001', -10).readNrz.length, 7);
  // the first failing run length per drift (SPEC.md table)
  const first = (d) => { let k = 1; while (k <= 16 && logic.readNrz('0'.repeat(k), d).errors.length === 0) k++; return k > 16 ? null : k; };
  const want = { '-20': 3, '-14': 4, '-11': 5, '-9': 6, '-7': 7, '-6': 8, '-5': 10, '-4': 13, '-3': null, '0': null, '3': null,
    '4': 13, '5': 11, '6': 9, '7': 8, '8': 7, '10': 6, '12': 5, '15': 4, '20': 3 };
  for (const [d, k] of Object.entries(want)) assert.equal(first(Number(d)), k, `drift ${d}`);
  // no drift: every string is read as sent
  for (const b of logic.PATTERNS) assert.deepEqual(of(b, 0).readNrz.join(''), b);
});

test('rule 5: the receiver samples at (j + ½)·(1 + d) from the start of each run', () => {
  const s = logic.readNrz('00000000', 10).samples.map((x) => x.t);
  assert.deepEqual(s, [0.55, 1.65, 2.75, 3.85, 4.95, 6.05, 7.15]);
});

test('rule 6: Manchester reads every string correctly at every drift in range; the bound is a third', () => {
  for (let n = 1; n <= 10; n++) {
    for (let c = 0; c < 1 << n; c++) {
      const b = c.toString(2).padStart(n, '0');
      for (let d = logic.DRIFT_MIN; d <= logic.DRIFT_MAX; d++) {
        const s = of(b, d);
        assert.equal(s.readMan.join(''), b, `${b} at ${d}`);
        assert.deepEqual(s.errors.man, []);
      }
    }
  }
  const edges = (b) => logic.edgesOf(logic.manchester(b));
  assert.deepEqual(logic.readMan('0011', 33, edges('0011')).errors, []);
  assert.deepEqual(logic.readMan('0000', -33, edges('0000')).errors, []);
  // past +⅓ the window swallows the next mid-cell transition and takes the following boundary jump as a bit
  assert.deepEqual(logic.readMan('0011', 34, edges('0011')).errors,
    [{ cell: 0, kind: 'lost' }, { cell: 1, kind: 'wrong' }, { cell: 3, kind: 'lost' }]);
  // past −⅓ the window ends before a boundary jump, which is taken for an extra bit
  assert.deepEqual(logic.readMan('0000', -34, edges('0000')).errors,
    [{ cell: 1, kind: 'extra' }, { cell: 2, kind: 'extra' }, { cell: 3, kind: 'extra' }]);
});

test('rule 7: transitions per lane: NRZ at most one per bit, Manchester one or two', () => {
  for (const b of ['1', '0110', '1111000', ...logic.PATTERNS]) {
    const s = of(b);
    assert.ok(s.transitions.nrz <= s.n - 1);
    assert.equal(s.transitions.manMid, s.n);
    assert.equal(s.transitions.man, s.transitions.manMid + s.transitions.manBoundary);
    assert.ok(s.transitions.man <= 2 * s.n - 1);
  }
});

test('rule 8: an all-equal string has no NRZ transitions; the string stays within 1–16 bits', () => {
  assert.equal(of('0000000000000000').noTransitions, true);
  assert.equal(of('1').noTransitions, true);
  assert.equal(of('10').noTransitions, false);
  assert.equal(logic.edit('1'.repeat(16), 'add'), '1'.repeat(16));
  assert.equal(logic.edit('1', 'remove'), '1');
  assert.equal(logic.edit('10', 'add'), '100');
  assert.equal(logic.edit('100', 'remove'), '10');
  assert.equal(logic.edit('100', 'flip', 1), '110');
  assert.equal(logic.edit('100', 'flip', 3), '100', 'out of range');
  assert.equal(logic.derive(P({ pattern: 'own', code: 1 })).n, 1, 'code below the range is clamped');
  assert.equal(logic.derive(P({ pattern: 'own', code: 1e9 })).n, 16, 'code above the range is clamped');
});

test('defaults and preset params as in SPEC.md', () => {
  assert.deepEqual(logic.defaults, { pattern: 'own', code: 25, drift: 0, showClock: false, lanes: 'both' });
  const want = {
    'book-1001': ['1001', 0, false], 'book-1101': ['1101', 0, false], 'long-run': ['0000000011111111', 10, false],
    alternating: ['10101010', 10, false], 'all-ones': ['1111111111111111', 0, true]
  };
  assert.deepEqual(logic.presets.map((p) => p.id), Object.keys(want));
  for (const p of logic.presets) {
    assert.deepEqual([p.params.pattern, p.params.drift, p.params.showClock, p.params.lanes], [...want[p.id], 'both'], p.id);
  }
});

test('drift is rounded and clamped to ±20 %; longest run', () => {
  assert.equal(logic.derive(P({ drift: 35 })).drift, 20);
  assert.equal(logic.derive(P({ drift: -35 })).drift, -20);
  assert.equal(logic.derive(P({ drift: 9.6 })).drift, 10);
  assert.equal(logic.derive(P({ drift: 'x' })).drift, 0);
  assert.equal(of('0110001', 0).longestRun, 3);
  assert.equal(of('1', 0).longestRun, 1);
  assert.equal(preset('long-run').longestRun, 8);
});

test('presets: the expected numbers in SPEC.md', () => {
  const want = {
    'book-1001': { bits: '1001', nrz: 2, man: 5, mid: 4, bnd: 1, readN: 4, errN: [] },
    'book-1101': { bits: '1101', nrz: 2, man: 5, mid: 4, bnd: 1, readN: 4, errN: [] },
    'long-run': { bits: '0000000011111111', nrz: 1, man: 30, mid: 16, bnd: 14, readN: 14,
      errN: [{ cell: 5, kind: 'lost' }, { cell: 13, kind: 'lost' }] },
    alternating: { bits: '10101010', nrz: 7, man: 8, mid: 8, bnd: 0, readN: 8, errN: [] },
    'all-ones': { bits: '1111111111111111', nrz: 0, man: 31, mid: 16, bnd: 15, readN: 16, errN: [] }
  };
  for (const [id, w] of Object.entries(want)) {
    const s = preset(id);
    assert.equal(s.bits, w.bits, id);
    assert.deepEqual([s.transitions.nrz, s.transitions.man, s.transitions.manMid, s.transitions.manBoundary], [w.nrz, w.man, w.mid, w.bnd], id);
    assert.equal(s.readNrz.length, w.readN, id);
    assert.deepEqual(s.errors.nrz, w.errN, id);
    assert.equal(s.readMan.join(''), w.bits, id);
  }
  assert.deepEqual(times(preset('book-1001').edges.man.filter((e) => e.kind === 'boundary')), [2]);
  assert.deepEqual(times(preset('book-1101').edges.man.filter((e) => e.kind === 'boundary')), [1]);
  assert.equal(preset('all-ones').noTransitions, true);
});

test('changed: the clicked cell and the transitions it added or removed', () => {
  const a = of('1001');
  assert.deepEqual(logic.changed(null, a), { cells: [], nrz: [], man: [] });
  assert.deepEqual(logic.changed(a, a), { cells: [], nrz: [], man: [] });
  // 1001 → 1101: NRZ edge at 1 goes, one at 2 comes; Manchester: jump at 2 goes, one at 1 comes, mid 1.5 flips
  assert.deepEqual(logic.changed(a, of('1101')), { cells: [1], nrz: [1, 2], man: [1, 1.5, 2] });
  // a longer string: only the added cell; a shorter one: nothing
  assert.deepEqual(logic.changed(a, of('10010')), { cells: [4], nrz: [], man: [] });
  assert.deepEqual(logic.changed(a, of('100')), { cells: [], nrz: [], man: [] });
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = logic.initial(P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ pattern: '0000000011111111', drift: -13 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model, on the controls\' scale, and named in both tables', () => {
  for (const p of logic.presets) {
    assert.deepEqual(Object.keys(p.params).sort(), Object.keys(logic.defaults).sort(), `${p.id} sets every param`);
    assert.ok(p.params.pattern === 'own' || logic.PATTERNS.includes(p.params.pattern), `${p.id} pattern`);
    assert.equal(logic.bitsOf(p.params.code), logic.bitsFrom(p.params), `${p.id} code matches its pattern`);
    assert.ok(Number.isInteger(p.params.drift) && p.params.drift >= logic.DRIFT_MIN && p.params.drift <= logic.DRIFT_MAX);
    assert.ok(['both', 'nrz', 'manchester'].includes(p.params.lanes));
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id.replace(/-/g, '_')], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id.replace(/-/g, '_')], `${lang} hint of ${p.id}`);
    }
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
