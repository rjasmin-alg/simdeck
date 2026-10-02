// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the Amdahl model (sim.js). Run: node --test sims/amdahl/
// The model's rules first (tie-breaks first of all), then the generic block every sim keeps.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => kit.stateAt(logic, P(over), 0);
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-3, `${msg || ''} ${a} ≈ ${b}`);
const custom = (over) => P(Object.assign(logic.profileParams('custom'), over));

// ── tie-breaks ──

test('bottleneck tie: equal parts go to the lowest number', () => {
  assert.equal(at(custom()).bottleneck, 1);
});

test('bottleneck tie after a speedup: the lowest of the parts still tied', () => {
  assert.equal(at(custom({ s1: 2 })).bottleneck, 2);
  assert.equal(at(custom({ s1: 2, s2: 2, s3: 2 })).bottleneck, 4);
});

test('bottleneck is the part with the most new time, not the largest share', () => {
  // CPU 40% at 4× takes 10% of the old time; memory (25%) now takes the most.
  assert.equal(at({ s1: 4 }).bottleneck, 2);
});

test('speedup exactly 1 is serial; anything above is sped up', () => {
  assert.equal(logic.isSerial(1), true);
  assert.equal(logic.isSerial(1.5), false);
  const s = at({ s1: 1.5 });
  assert.equal(s.parts[0].serial, false);
  near(s.serial, 0.6, 'serial');
});

// ── the law ──

test('nothing sped up: speedup 1, all serial, ceiling 1, equivalent n 1', () => {
  const s = at({});
  near(s.speedup, 1);
  near(s.serial, 1);
  near(s.ceiling, 1);
  assert.equal(s.equivalentN, 1);
});

test('generalised Amdahl: S = 1 / Σ fᵢ/sᵢ (the bottleneck example in the explanation)', () => {
  near(at({ s1: 4 }).speedup, 1 / 0.7, 'CPU 40% at 4×'); // 1.43×
  near(at({ s2: 4 }).speedup, 1 / 0.8125, 'memory 25% at 4×'); // 1.23×
  assert.ok(at({ s1: 4 }).speedup > at({ s2: 4 }).speedup, 'the larger part pays more');
});

test('ceiling is 1 / serial fraction, and the speedup stays under it', () => {
  const s = at(Object.assign(logic.profileParams('hpc'), { s1: 16 }));
  near(s.speedup, 1 / (0.7 / 16 + 0.3), 'HPC computation 16×'); // 2.91×
  near(s.ceiling, 1 / 0.3, 'ceiling'); // 3.33×
  assert.ok(s.speedup < s.ceiling);
  near(at(Object.assign(logic.profileParams('hpc'), { s1: 1e9 })).speedup, 1 / 0.3, 'infinite speedup reaches the ceiling');
});

test('every part sped up: no ceiling (null), and one factor for all gives that factor', () => {
  const s = at({ s1: 4, s2: 4, s3: 4, s4: 4, s5: 4 });
  assert.equal(s.ceiling, null);
  near(s.serial, 0);
  near(s.speedup, 4);
  near(s.equivalentN, 4);
});

test('equivalent n: the one factor on the sped-up parts that gives the same speedup', () => {
  near(at({ s1: 4 }).equivalentN, 4, 'only the CPU at 4×');
  const s = at({ s1: 2, s2: 5 });
  near(s.equivalentN, 0.65 / (0.4 / 2 + 0.25 / 5));
  near(logic.amdahl(s.serial, s.equivalentN), s.speedup, 'classic Amdahl at n_eq');
});

test('fractions that do not add up to 100 are scaled, so the baseline stays 1×', () => {
  const a = at(custom({ f1: 50, f2: 50, f3: 50, f4: 50, f5: 50, s1: 3 }));
  const b = at(custom({ s1: 3 }));
  assert.equal(a.weightSum, 250);
  near(a.speedup, b.speedup);
  near(at({ f1: 80 }).speedup, 1, 'baseline with a sum of 140');
  near(at({ f1: 80 }).parts[0].share, 80 / 140);
});

test('time after: each part takes share / speedup, and the parts add up to 1 / S', () => {
  const s = at({ s1: 4, s3: 2 });
  near(s.parts[0].after, 0.1);
  near(s.parts[2].after, 0.1);
  near(s.parts.reduce((a, c) => a + c.after, 0), 1 / s.speedup);
});

test('classic Amdahl and Gustafson: the numbers in the explanation', () => {
  near(logic.amdahl(0.05, 100), 1 / 0.0595); // 16.8×
  near(logic.gustafson(0.05, 100), 95.05); // 95.1×
  near(logic.amdahl(0.2, 10), 1 / 0.28); // 3.6×
  near(logic.amdahl(0.2, 20), 1 / 0.24); // 4.2×
  near(1 / (0.7 + 0.3 / 100), 1.4225); // game loading, 1.42×
  near(logic.amdahl(0.5, 1e12), 2, 'ceiling 1/s');
  near(logic.amdahl(0.3, 1), 1, 'one processor');
  near(logic.gustafson(0.3, 1), 1, 'one processor');
});

test('every profile has five parts adding up to 100%', () => {
  for (const [id, f] of Object.entries(logic.PROFILES)) {
    assert.equal(f.length, logic.PARTS, id);
    assert.equal(f.reduce((a, b) => a + b, 0), 100, id);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const pr of logic.presets) {
    const s = at(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
  const all = at({ s1: 2, s2: 2, s3: 2, s4: 2, s5: 2 });
  assert.deepEqual(JSON.parse(JSON.stringify(all)), all, 'no ceiling');
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ s1: 3.5, f2: 60 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  const glossary = require('../../kit/glossary.js');
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every profile part has a name in both languages', () => {
  for (const l of ['hr', 'en']) {
    for (const id of Object.keys(logic.PROFILES)) {
      for (let i = 1; i <= logic.PARTS; i++) assert.ok(strings[l][id + i], `${l} ${id}${i}`);
    }
  }
});

test('every preset is valid for the model and has a label in the page', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  const ids = logic.presets.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  assert.ok(ids.length <= 9, 'keys 1–9');
  for (const pr of logic.presets) {
    for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k} is a model param`);
    assert.ok(pr.params.profile in logic.PROFILES, `${pr.id}: profile`);
    assert.ok(html.includes(`'${pr.id}'`) || new RegExp(`\\b${pr.id}:`).test(html), `${pr.id}: label in index.html`);
  }
});
