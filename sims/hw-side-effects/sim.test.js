// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for the hardware side-effects model (sim.js). Run: node --test sims/hw-side-effects/
// The model's rules first (tie-breaks first of all), then the generic block every sim keeps. Numbers: SPEC.md.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => kit.stateAt(logic, P(over), 0);
const preset = (id) => at(logic.presets.find((x) => x.id === id).params);
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} ≈ ${b}`);
const ONES = logic.SECRET.filter((b) => b === 1).length;

// ── tie-breaks ──

test('a toughness exactly at the chance keeps no trace; just below it does', () => {
  assert.equal(logic.leaves(1, 0.5, 0.5), false);
  assert.equal(logic.leaves(1, 0.4999, 0.5), true);
});

test('a 0-bit never leaves a trace, at any chance', () => {
  assert.equal(logic.leaves(0, 0, 1), false);
  const st = at({ speed: logic.MAX, density: logic.MAX });
  for (const ax of [st.speed, st.space]) for (const c of ax.cells) if (c.bit === 0) assert.equal(c.trace, false);
});

test('at level 0 the chance is exactly 0 and nothing leaks, even for the weakest bit', () => {
  assert.equal(logic.chance(0, false), 0);
  const st = at({ speed: 0, density: 0 });
  assert.equal(st.p, 0);
  assert.equal(st.seen, 0);
  assert.equal(st.speed.traces + st.space.traces, 0);
});

test('levels outside 0 … MAX are clamped', () => {
  assert.equal(logic.chance(-3, false), 0);
  assert.equal(logic.chance(logic.MAX + 5, false), logic.PMAX);
});

// ── the probability model (illustrative) ──

test('chance per bit = PMAX × (level / MAX)², a quarter of it with mitigations', () => {
  near(logic.chance(logic.MAX, false), 0.8);
  near(logic.chance(5, false), 0.2);
  near(logic.chance(6, false), 0.288);
  near(logic.chance(logic.MAX, true), 0.2);
  near(logic.chance(5, true), 0.05);
});

test('the chance rises strictly with each level on each axis', () => {
  for (const mit of [false, true]) for (let x = 1; x <= logic.MAX; x++) assert.ok(logic.chance(x, mit) > logic.chance(x - 1, mit), `${x} ${mit}`);
});

test('either kind: 1 − (1 − ps)(1 − pd); both at maximum is the highest, both at 0 is none', () => {
  near(logic.either(0.8, 0.8), 0.96);
  near(logic.either(0.2, 0), 0.2);
  assert.equal(logic.either(0, 0), 0);
  let best = -1, arg = null;
  for (let s = 0; s <= logic.MAX; s++) for (let d = 0; d <= logic.MAX; d++) {
    const p = at({ speed: s, density: d }).p;
    if (p > best) { best = p; arg = [s, d]; }
    if (s > 0) assert.ok(p > at({ speed: s - 1, density: d }).p, `speed ${s} ${d}`);
    if (d > 0) assert.ok(p > at({ speed: s, density: d - 1 }).p, `density ${s} ${d}`);
  }
  assert.deepEqual(arg, [logic.MAX, logic.MAX]);
});

test('each slider drives only its own kind of trace', () => {
  const a = at({ speed: 8, density: 2 }), b = at({ speed: 8, density: 9 });
  assert.deepEqual(a.speed, b.speed);
  const c = at({ speed: 1, density: 7 }), d = at({ speed: 10, density: 7 });
  assert.deepEqual(c.space, d.space);
});

test('the share of secret 1-bits with a trace follows the chance: floor(chance × ones + ½) on each axis', () => {
  for (const mit of [false, true]) for (let x = 0; x <= logic.MAX; x++) {
    const st = at({ speed: x, density: x, mitigate: mit });
    const want = (p) => { let n = 0; for (let r = 0; r < ONES; r++) if ((r + 0.5) / ONES < p) n++; return n; };
    assert.equal(st.speed.traces, want(st.speed.p), `speed ${x}`);
    assert.equal(st.space.traces, want(st.space.p), `space ${x}`);
  }
});

test('a higher level never removes a trace', () => {
  for (const ax of ['speed', 'space']) for (let x = 1; x <= logic.MAX; x++) {
    const lo = at({ speed: x - 1, density: x - 1 })[ax], hi = at({ speed: x, density: x })[ax];
    lo.cells.forEach((c, i) => { if (c.trace) assert.ok(hi.cells[i].trace, `${ax} ${x} bit ${i}`); });
  }
});

test('the other program sees the 1-bits traced on either axis; the two axes miss different bits', () => {
  const st = at({ speed: logic.MAX, density: logic.MAX });
  const union = logic.SECRET.filter((b, i) => st.speed.cells[i].trace || st.space.cells[i].trace).length;
  assert.equal(st.seen, union);
  assert.ok(st.speed.traces < ONES && st.space.traces < ONES, 'neither alone sees every bit');
  assert.equal(st.seen, ONES, 'together they see every 1-bit');
});

test('the victim\'s side never changes: result correct, checks pass, at every setting', () => {
  for (const pr of logic.presets) {
    const st = at(pr.params);
    assert.equal(st.victimCorrect, true, pr.id);
    assert.equal(st.checksPass, true, pr.id);
    assert.deepEqual(st.speed.cells.map((c) => c.bit), logic.SECRET);
    assert.deepEqual(st.space.cells.map((c) => c.bit), logic.SECRET);
  }
});

// ── trust ──

test('trust changes the risk, not the traces: trusted is 0, hostile is the leak chance', () => {
  const h = at({ speed: 9, density: 9, trust: 'hostile' }), t = at({ speed: 9, density: 9, trust: 'trusted' });
  assert.deepEqual(h.speed, t.speed);
  assert.deepEqual(h.space, t.space);
  assert.equal(h.p, t.p);
  assert.equal(h.risk, h.p);
  assert.equal(t.risk, 0);
  assert.equal(logic.risk(0.5, 'trusted'), 0);
  assert.equal(logic.risk(0.5, 'hostile'), 0.5);
});

test('the trust limit binds only with someone hostile and a leak chance above 0', () => {
  assert.equal(at({ speed: 5, trust: 'hostile' }).trustBinds, true);
  assert.equal(at({ speed: 5, trust: 'trusted' }).trustBinds, false);
  assert.equal(at({ speed: 0, density: 0, trust: 'hostile' }).trustBinds, false);
});

test('limits: four physical, then trust, the only one that is not', () => {
  assert.deepEqual(logic.LIMITS.map((l) => l.id), ['light', 'heat', 'quantum', 'atoms', 'trust']);
  assert.deepEqual(logic.LIMITS.filter((l) => !l.physical).map((l) => l.id), ['trust']);
});

// ── cost ──

test('cost: 1× at both maximum without mitigations; everything off is 2.5× time, 4× area, 2.4× energy', () => {
  const top = logic.cost(logic.MAX, logic.MAX, false);
  assert.deepEqual(top, { time: 1, size: 1, area: 1, energy: 1 });
  const off = logic.cost(0, 0, false);
  near(off.time, 2.5); near(off.size, 2); near(off.area, 4); near(off.energy, 2.4);
});

test('cost never falls as an optimisation is turned down, and mitigations add time and energy, not area', () => {
  for (let x = 1; x <= logic.MAX; x++) {
    const a = logic.cost(x, x, false), b = logic.cost(x - 1, x - 1, false);
    assert.ok(b.time > a.time && b.area > a.area && b.energy > a.energy, `${x}`);
  }
  const m = logic.cost(7, 7, true), n = logic.cost(7, 7, false);
  near(m.time, n.time * 1.25); near(m.energy, n.energy * 1.1); assert.equal(m.area, n.area);
});

// ── presets: what each one is for ──

test('presets show what their labels say', () => {
  const safe = preset('safe'), speed = preset('speed'), space = preset('space'), both = preset('both');
  assert.equal(safe.p, 0, 'everything off: no leak');
  assert.ok(safe.cost.time > both.cost.time && safe.cost.area > both.cost.area && safe.cost.energy > both.cost.energy, 'but costly');
  assert.ok(speed.speed.traces > 0 && speed.space.traces === 0, 'speed only: cache traces');
  assert.ok(space.space.traces > 0 && space.speed.traces === 0, 'space only: row traces');
  assert.ok(both.p > speed.p && both.p > space.p, 'both: the highest');
  const mit = preset('mitigated');
  assert.ok(mit.p < both.p && mit.cost.time > both.cost.time, 'mitigations: lower chance, slower');
  const trusted = preset('trusted');
  assert.equal(trusted.p, both.p, 'trusted: the same leak');
  assert.equal(trusted.risk, 0, 'but no risk');
});

// ── pinned numbers (SPEC.md) ──

test('defaults and the secret are as SPEC.md says: 16 bits, 9 ones', () => {
  assert.deepEqual(logic.defaults, { speed: 6, density: 4, mitigate: false, trust: 'hostile' });
  assert.equal(logic.SECRET.join(''), '1011001011100101');
  assert.equal(at({}).ones, 9);
});

test('chance per bit at every level, with and without mitigations', () => {
  for (let x = 0; x <= logic.MAX; x++) {
    near(logic.chance(x, false), 0.8 * (x / 10) ** 2);
    near(logic.chance(x, true), 0.2 * (x / 10) ** 2);
  }
});

test('the bits each axis traces at level 10 are pinned (rank orders and secret)', () => {
  const st = at({ speed: 10, density: 10 });
  const idx = (ax) => ax.cells.filter((c) => c.trace).map((c) => c.i);
  assert.deepEqual(idx(st.speed), [0, 3, 8, 9, 10, 13, 15]);
  assert.deepEqual(idx(st.space), [0, 2, 6, 8, 9, 13, 15]);
  const m = at({ speed: 10, density: 10, mitigate: true });
  assert.deepEqual(idx(m.speed), [3, 8]);
  assert.deepEqual(idx(m.space), [6, 9]);
});

test('mitigations act on both axes', () => {
  const m = at({ speed: 10, density: 10, mitigate: true });
  near(m.speed.p, 0.2);
  near(m.space.p, 0.2);
});

test('risk equals the leak chance at every setting when hostile, 0 when trusted', () => {
  for (let s = 0; s <= logic.MAX; s += 2) for (let d = 0; d <= logic.MAX; d += 2) {
    assert.equal(at({ speed: s, density: d, trust: 'hostile' }).risk, at({ speed: s, density: d }).p);
    assert.equal(at({ speed: s, density: d, trust: 'trusted' }).risk, 0);
  }
});

test('the trust limit does not bind while no bit has left a trace, even with a chance above 0', () => {
  const st = at({ speed: 2, density: 0 });
  assert.ok(st.p > 0);
  assert.equal(st.seen, 0);
  assert.equal(st.trustBinds, false);
});

test('cost: speed sets time and part of energy, density sets size and the rest of energy', () => {
  const a = logic.cost(0, 10, false), b = logic.cost(10, 0, false);
  near(a.time, 2.5); near(a.size, 1); near(a.area, 1); near(a.energy, 1.6);
  near(b.time, 1); near(b.size, 2); near(b.area, 4); near(b.energy, 1.8);
  const m = logic.cost(0, 0, true);
  near(m.time, 3.125); near(m.energy, 2.64); near(m.area, 4);
});

test('cost clamps levels like chance does', () => {
  assert.deepEqual(logic.cost(-5, 15, false), logic.cost(0, 10, false));
  assert.equal(at({ speed: 14 }).speed.level, logic.MAX);
  assert.equal(at({ density: -2 }).space.level, 0);
});

test('presets: order and every number in the SPEC.md table', () => {
  assert.deepEqual(logic.presets.map((x) => x.id), ['safe', 'speed', 'space', 'both', 'mitigated', 'trusted']);
  const row = (id) => { const s = preset(id); return [s.speed.traces, s.space.traces, s.seen, Math.round(s.p * 100), Math.round(s.risk * 100)]; };
  assert.deepEqual(row('safe'), [0, 0, 0, 0, 0]);
  assert.deepEqual(row('speed'), [7, 0, 7, 80, 80]);
  assert.deepEqual(row('space'), [0, 7, 7, 80, 80]);
  assert.deepEqual(row('both'), [7, 7, 9, 96, 96]);
  assert.deepEqual(row('mitigated'), [2, 2, 4, 36, 36]);
  assert.deepEqual(row('trusted'), [7, 7, 9, 96, 0]);
  near(preset('mitigated').cost.time, 1.25);
  near(preset('mitigated').cost.energy, 1.1);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset', () => {
  for (const pr of logic.presets) {
    const s = at(pr.params);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, pr.id);
  }
});

test('deterministic, and initial does not mutate its params', () => {
  const p = P({ speed: 7, density: 3, mitigate: true });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'an explorer');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
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
    if ('trust' in pr.params) assert.ok(logic.TRUST.includes(pr.params.trust), `${pr.id}: trust value`);
    assert.ok(new RegExp(`\\b${pr.id}:`).test(html), `${pr.id}: label in index.html`);
  }
});
