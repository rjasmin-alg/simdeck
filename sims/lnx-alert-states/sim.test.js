// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for lnx-alert-states. Rules and expected numbers: SPEC.md. Run: node --test sims/lnx-alert-states/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over, n) => kit.stateAt(logic, P(over), n);
const end = (over) => at(over, logic.steps(P(over)));
const letters = (over) => end(over).history.map((x) => x.alert[0]).join('');
/** A one-off metric: replaces a series for the run, so a rule can be tested on the values it needs. */
function withSeries(values, over, fn) {
  logic.SERIES.test = values;
  try { return fn(P(Object.assign({ series: 'test' }, over))); } finally { delete logic.SERIES.test; }
}
const lettersOf = (values, over) => withSeries(values, over, (p) => kit.stateAt(logic, p, values.length).history.map((x) => x.alert[0]).join(''));

// ── tie-breaks first ──

test('tie-break: for 0 goes inactive → pending → firing in one step, never seen pending', () => {
  const s = at({ series: 'flapping', forMin: 0 }, 1);
  assert.equal(s.alert, 'firing');
  assert.equal(s.activeAt, 1);
  assert.equal(s.firedAt, 1);
  assert.equal(s.event, 'fired');
  assert.ok(!letters({ series: 'flapping', forMin: 0 }).includes('p'));
});

test('tie-break: for 1 needs a second step; one transition per step otherwise', () => {
  const s1 = at({ series: 'flapping', forMin: 1 }, 1);
  assert.equal(s1.alert, 'pending');
  assert.equal(at({ series: 'flapping', forMin: 1 }, 2).alert, 'firing');
});

test('tie-break: true while firing stays firing; false while inactive stays inactive', () => {
  assert.equal(at({}, 9).event, 'firing');
  assert.equal(at({}, 9).alert, 'firing');
  assert.equal(at({}, 1).event, 'idle');
  assert.equal(at({}, 1).alert, 'inactive');
});

// ── rule 1: only scraped samples ──

test('rule 1: scrapes at minute 1 and every scrape minutes', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].filter((t) => logic.isScrape(P({ scrape: 2 }), t)), [1, 3, 5, 7]);
  assert.deepEqual([1, 2, 3, 6, 10, 11].filter((t) => logic.isScrape(P({ scrape: 5 }), t)), [1, 6, 11]);
  assert.equal(logic.isScrape(P({ scrape: 1 }), 0), false);
});

test('rule 1: between scrapes the rule sees the last sample', () => {
  const s = at({ scrape: 2 }, 12); // 95 scraped at 11, real value 60 at 12
  assert.deepEqual(s.lastSample, { t: 11, v: 95 });
  assert.equal(s.cond, true);
  assert.equal(s.history[11].sampled, false);
  assert.equal(s.history[11].v, 60);
  assert.equal(s.history[11].cond, true, 'history records the condition on the held sample');
  assert.equal(at({}, 1).history[0].cond, false);
});

test('rule 1: a spike between two scrapes is never seen', () => {
  assert.equal(letters({ series: 'one-spike', forMin: 0, scrape: 2 }), 'iiiiiiiiii');
  assert.equal(end({ series: 'one-spike', forMin: 0, scrape: 2 }).fired, 0);
  assert.equal(letters({ series: 'one-spike', forMin: 0, scrape: 1 }), 'iiiiifiiii');
  assert.equal(letters({ series: 'one-spike', forMin: 0, scrape: 5 }), 'iiiiifffff');
});

test('rule 1: no sample yet means no data; the condition is strictly greater', () => {
  const s0 = logic.initial(P({}));
  assert.equal(s0.lastSample, null);
  assert.equal(s0.cond, false);
  assert.equal(lettersOf([90, 91], { forMin: 0, threshold: 90 }), 'if');
});

// ── rule 2 ──

test('rule 2: inactive + true → pending with activeAt = t', () => {
  const s = at({}, 3);
  assert.equal(s.alert, 'pending');
  assert.equal(s.activeAt, 3);
  assert.equal(s.event, 'pending');
  assert.equal(at({}, 4).activeAt, 3, 'activeAt stays while pending');
  assert.equal(at({}, 4).event, 'held');
});

// ── rule 3 ──

test('rule 3: for 5 fires at the 6th consecutive true evaluation (t − activeAt ≥ for)', () => {
  assert.equal(at({}, 7).alert, 'pending');
  const s = at({}, 8);
  assert.equal(s.alert, 'firing');
  assert.equal(s.firedAt, 8);
  assert.equal(s.activeAt, 3, 'activeAt is kept while firing');
  assert.equal(s.fired, 1);
  for (let f = 0; f <= 6; f++) assert.equal(at({ forMin: f }, 3 + f).alert, 'firing', `for ${f}`);
  for (let f = 1; f <= 6; f++) assert.equal(at({ forMin: f }, 2 + f).alert, 'pending', `for ${f} one step early`);
});

// ── rule 4 ──

test('rule 4: pending + false → inactive, and the timer restarts', () => {
  const s = at({ series: 'short-spike' }, 6);
  assert.equal(s.alert, 'inactive');
  assert.equal(s.activeAt, null);
  assert.equal(s.event, 'reset');
  assert.equal(letters({ series: 'flapping' }), 'ppi'.repeat(5));
  assert.equal(at({ series: 'flapping' }, 4).activeAt, 4, 'a new pending alert has a new activeAt');
  // two true, one false, four true with for 3: the first two do not count
  assert.equal(lettersOf([95, 95, 50, 95, 95, 95, 95], { forMin: 3 }), 'ppipppf');
});

// ── rule 5 ──

test('rule 5: firing + false → resolved, cycles + 1', () => {
  const s = at({}, 12);
  assert.equal(s.alert, 'inactive');
  assert.equal(s.event, 'resolved');
  assert.equal(s.cycles, 1);
  assert.equal(s.firedAt, null);
  assert.equal(s.activeAt, null);
  const k = withSeries([95, 50, 50, 50], { forMin: 0, keepFiringFor: 2 }, (p) => kit.stateAt(logic, p, 4));
  assert.equal(k.event, 'resolved');
  assert.equal(k.keepSince, null, 'resolving clears keepSince');
});

test('rule 5: keep_firing_for counts from the first false evaluation, and a true one resets it', () => {
  const p = { series: 'flapping', forMin: 1, keepFiringFor: 3 };
  assert.equal(letters(p), 'p' + 'f'.repeat(14));
  const s3 = at(p, 3);
  assert.equal(s3.event, 'kept');
  assert.equal(s3.keepSince, 3);
  assert.equal(logic.resolvesAt(s3, P(p)), 6);
  assert.equal(at(p, 4).keepSince, null, 'true again resets keepSince');
  const e = end(p);
  assert.deepEqual(e.history.filter((x) => x.kept).map((x) => x.t), [3, 6, 9, 12, 15]);
  assert.equal(e.fired, 1);
  assert.equal(e.cycles, 0);
  assert.equal(logic.resolvesAt(e, P(p)), 18);
  // false for exactly keep_firing_for evaluations: kept at the first ones, resolved at keepSince + keep
  assert.equal(lettersOf([95, 50, 50, 50, 50], { forMin: 0, keepFiringFor: 3 }), 'ffffi');
  assert.equal(lettersOf([95, 50, 50], { forMin: 0, keepFiringFor: 1 }), 'ffi');
  assert.equal(logic.resolvesAt(at({}, 9), P({})), null, 'no keep_firing_for, no resolve time');
});

test('rule 5: keep_firing_for does not hold a pending alert', () => {
  assert.equal(lettersOf([95, 50], { forMin: 5, keepFiringFor: 3 }), 'pi');
});

// ── rule 6: counters ──

test('rule 6: cycles counts firing → inactive, fired counts → firing', () => {
  const s = end({ series: 'flapping', forMin: 0 });
  assert.equal(s.cycles, 5);
  assert.equal(s.fired, 5);
  assert.equal(end({ series: 'flapping' }).cycles, 0, 'pending → inactive is not a cycle');
});

// ── presets (SPEC.md table) ──

test('presets: states and counters from SPEC.md', () => {
  const rows = [
    [{ series: 'sustained' }, 'iipppppffffiiii', 1, 1],
    [{ series: 'flapping', forMin: 5 }, 'ppi'.repeat(5), 0, 0],
    [{ series: 'flapping', forMin: 0 }, 'ffi'.repeat(5), 5, 5],
    [{ series: 'flapping', forMin: 1, keepFiringFor: 3 }, 'p' + 'f'.repeat(14), 1, 0],
    [{ series: 'short-spike' }, 'iiippiiiii', 0, 0],
    [{ series: 'one-spike', forMin: 0, scrape: 2 }, 'iiiiiiiiii', 0, 0]
  ];
  for (const [p, want, fired, cycles] of rows) {
    assert.equal(letters(p), want, JSON.stringify(p));
    assert.equal(end(p).fired, fired);
    assert.equal(end(p).cycles, cycles);
  }
  assert.equal(letters({ scrape: 2 }), 'iipppppfffffiii');
  assert.equal(letters({ scrape: 5 }), 'iiiiipppppfffff');
});

test('steps follow the series', () => {
  assert.equal(logic.steps(P({})), 15);
  assert.equal(logic.steps(P({ series: 'flapping' })), 15);
  assert.equal(logic.steps(P({ series: 'short-spike' })), 10);
  assert.equal(logic.steps(P({ series: 'one-spike' })), 10);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe at every step', () => {
  const p = { series: 'flapping', forMin: 1, keepFiringFor: 3, scrape: 2 };
  for (let n = 0; n <= logic.steps(P(p)); n++) {
    const s = at(p, n);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('replay is deterministic and step back equals replay', () => {
  const p = P({ series: 'flapping', forMin: 0, keepFiringFor: 2, scrape: 2 });
  const forward = [];
  let s = logic.initial(p);
  forward.push(s);
  const n = logic.steps(p);
  for (let i = 1; i <= n; i++) { s = logic.step(s, i, p); forward.push(s); }
  for (let i = n; i >= 0; i--) assert.deepEqual(kit.stateAt(logic, p, i), forward[i]);
});

test('step does not mutate its input', () => {
  const p = P({});
  const s = kit.stateAt(logic, p, 5);
  const copy = structuredClone(s);
  logic.step(s, 6, p);
  assert.deepEqual(s, copy);
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset in the page is valid for the model', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.steps, logic.steps(P({})), 'meta.steps matches the default run');
  const presets = [...html.matchAll(/params:\s*\{([^}]*)\}/g)];
  assert.equal(presets.length, 6);
  for (const m of presets) {
    const keys = [...m[1].matchAll(/(\w+):/g)].map((k) => k[1]);
    for (const k of keys) assert.ok(k in logic.defaults, `preset param ${k} is a model param`);
    const series = m[1].match(/series:\s*'([^']+)'/);
    assert.ok(series && series[1] in logic.SERIES, 'each preset names its series');
  }
});
