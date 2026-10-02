// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the web server Amdahl model (sim.js). Run: node --test sims/webserver-amdahl/
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
const preset = (id) => at(logic.presets.find((x) => x.id === id).params);
const equal = { f1: 20, f2: 20, f3: 20, f4: 20, f5: 20 };

// ── tie-breaks ──

test('bottleneck tie: equal parts go to the lowest number', () => {
  assert.equal(at(equal).bottleneck, 1);
});

test('bottleneck tie after a speedup: the lowest of the parts still tied', () => {
  assert.equal(at({ ...equal, s1: 2 }).bottleneck, 2);
  assert.equal(at({ ...equal, s1: 2, s2: 2, s3: 2 }).bottleneck, 4);
});

test('bottleneck is the part with the most new time, not the largest share', () => {
  // network 45% at 10× takes 4.5% of the old time; the database (25%) now takes the most.
  assert.equal(preset('network-10x').bottleneck, 2);
  assert.equal(preset('baseline').bottleneck, 1);
});

test('speedup exactly 1 is serial; anything above is sped up', () => {
  assert.equal(logic.isSerial(1), true);
  assert.equal(logic.isSerial(1.5), false);
  const s = at({ s3: 1.5 });
  assert.equal(s.parts[2].serial, false);
  near(s.serial, 0.85, 'serial');
});

// ── the law on a request ──

test('the baseline: the original fractions, nothing sped up, speedup 1, ceiling 1', () => {
  assert.deepEqual(logic.FRACTIONS, [45, 25, 15, 10, 5]);
  assert.equal(logic.FRACTIONS.reduce((a, b) => a + b, 0), 100);
  const s = preset('baseline');
  near(s.speedup, 1);
  near(s.serial, 1);
  near(s.ceiling, 1);
  assert.equal(s.progress, null, 'no way to go when the ceiling is 1×');
  assert.equal(s.equivalentN, 1);
});

test('the worked examples in the explanation: speedup and ceiling of each preset', () => {
  const cases = {
    'network-10x': [1 / 0.595, 1 / 0.55], // 1.68×, 1.82×
    'database-10x': [1 / 0.775, 1 / 0.75], // 1.29×, 1.33×
    'cpu-10x': [1 / 0.865, 1 / 0.85], // 1.16×, 1.18× (the original's 1.20× was above its own ceiling)
    'disk-50x': [1 / 0.902, 1 / 0.9], // 1.11×, 1.11×
    'cache-100x': [1 / 0.9505, 1 / 0.95], // 1.05×, 1.05×
    'network-database-10x': [1 / 0.37, 1 / 0.3] // 2.70×, 3.33×
  };
  for (const [id, [sp, ceil]] of Object.entries(cases)) {
    const s = preset(id);
    near(s.speedup, sp, `${id} speedup`);
    near(s.ceiling, ceil, `${id} ceiling`);
    assert.ok(s.speedup < s.ceiling, `${id} under its ceiling`);
  }
  // the rounded figures written in strings.js
  assert.equal((1 / 0.595).toFixed(2), '1.68');
  assert.equal((1 / 0.865).toFixed(2), '1.16');
  assert.equal((1 / 0.37).toFixed(2), '2.70');
});

test('a twice faster CPU gives 1.08×, not 2× (the counter-intuitive note)', () => {
  assert.equal(at({ s3: 2 }).speedup.toFixed(2), '1.08');
});

test('limit of a part: the speedup if that part took no time, the others as they are', () => {
  const s = preset('baseline');
  near(s.parts[0].limit, 1 / 0.55, 'network');
  near(s.parts[2].limit, 1 / 0.85, 'logic');
  const t = preset('network-10x');
  near(t.parts[1].limit, 1 / (0.045 + 0.30), 'database, with the network already 10×');
  near(at({ s1: 1e9 }).speedup, s.parts[0].limit, 'an infinite speedup reaches the limit');
});

test('limit is null (unbounded) only when the other parts take no time', () => {
  const s = at({ f1: 99, f2: 1, f3: 1, f4: 1, f5: 1, s2: 1e9, s3: 1e9, s4: 1e9, s5: 1e9 });
  assert.equal(s.parts[0].limit, null);
  assert.notEqual(s.parts[1].limit, null);
});

test('progress toward the ceiling: (S − 1) / (ceiling − 1)', () => {
  const s = preset('network-10x');
  near(s.progress, (1 / 0.595 - 1) / (1 / 0.55 - 1));
  assert.equal(at({ s1: 4, s2: 4, s3: 4, s4: 4, s5: 4 }).progress, null, 'no ceiling');
});

test('every part sped up: no ceiling (null), and one factor for all gives that factor', () => {
  const s = at({ s1: 4, s2: 4, s3: 4, s4: 4, s5: 4 });
  assert.equal(s.ceiling, null);
  near(s.serial, 0);
  near(s.speedup, 4);
  near(s.equivalentN, 4);
});

test('equivalent n: the one factor on the sped-up parts that gives the same speedup', () => {
  near(preset('network-10x').equivalentN, 10);
  const s = at({ s1: 2, s2: 5 });
  near(logic.amdahl(s.serial, s.equivalentN), s.speedup, 'classic Amdahl at n_eq');
});

test('fractions that do not add up to 100 are scaled, so the baseline stays 1×', () => {
  const a = at({ f1: 90, s1: 10 });
  assert.equal(a.weightSum, 145);
  near(a.parts[0].share, 90 / 145);
  near(at({ f1: 90 }).speedup, 1, 'baseline with a sum of 145');
  near(at({ f1: 90, f2: 50, f3: 30, f4: 20, f5: 10, s1: 10 }).speedup, preset('network-10x').speedup, 'doubled weights, same result');
});

test('time after: each part takes share / speedup, and the parts add up to 1 / S', () => {
  const s = at({ s1: 9, s4: 2 });
  near(s.parts[0].after, 0.05);
  near(s.parts[3].after, 0.05);
  near(s.parts.reduce((a, c) => a + c.after, 0), 1 / s.speedup);
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

test('every component has a name and a counter-intuitive note in both languages', () => {
  const note = { network: 'counterNetwork', database: 'counterDatabase', cpu: 'counterCpu', disk: 'counterDisk', cache: 'counterCache' };
  for (const l of ['hr', 'en']) {
    for (const id of logic.COMPONENTS) {
      assert.ok(strings[l][id], `${l} ${id}`);
      assert.ok(strings[l][note[id]], `${l} ${note[id]}`);
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
    assert.ok(pr.params.sel >= 1 && pr.params.sel <= logic.PARTS, `${pr.id}: sel`);
    assert.ok(html.includes(`'${pr.id}'`) || new RegExp(`\\b${pr.id}:`).test(html), `${pr.id}: label in index.html`);
  }
});
