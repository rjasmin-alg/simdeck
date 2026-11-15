// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for os-context-switch-cost: the rules of SPEC.md, tie-breaks first, then the presets' numbers, then the
// generic block. Run: node --test sims/os-context-switch-cost/sim.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const at = (over) => logic.derive(P(over));
const preset = (id) => logic.presets.find((p) => p.id === id).params;
const qOf = (Q) => logic.Q_STEPS.indexOf(Q);
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg || ''} ${a} ≈ ${b}`);

// ── tie-breaks first ──

test('tie-break rule 4: at Q = W both branches give W·rate (continuous)', () => {
  assert.equal(logic.usefulOf(50, 50, 0.3), 50 * 0.3);
  near(logic.usefulOf(50, 50, 0.3), 50 - 50 * 0.7);
  const s = at({ q: qOf(50) });
  near(s.perQuantum.useful, 15);
  near(s.usefulPct, 15 / 52 * 100);
  assert.equal(s.warmTime, 50);
  assert.equal(s.fullTime, 0);
  // just either side
  near(logic.usefulOf(51, 50, 0.3), 16);
  near(logic.usefulOf(49, 50, 0.3), 14.7);
});

test('tie-break rule 9: Q = W is thrash (no full-speed time left), W = 0 is nowarm even at Q = 10', () => {
  assert.equal(at({ q: qOf(50) }).regime, 'thrash');
  assert.equal(at({ q: qOf(100) }).regime, 'warm');
  assert.equal(at({ q: qOf(20) }).regime, 'thrash');
  assert.equal(at({ q: 0, kind: 'thread', wCache: 0 }).regime, 'nowarm');
  assert.equal(logic.regimeOf(10, 0), 'nowarm');
  assert.equal(logic.regimeOf(10, 10), 'thrash');
  assert.equal(logic.regimeOf(11, 10), 'warm');
});

test('tie-break rule 8: exactly 90.0 is high, exactly 50.0 is mid; the band follows the shown value', () => {
  assert.equal(logic.band(90), 'high');
  assert.equal(logic.band(89.9), 'mid');
  assert.equal(logic.band(50), 'mid');
  assert.equal(logic.band(49.9), 'low');
  assert.equal(logic.shown(89.95), 90);
  assert.equal(logic.shown(89.9499), 89.9);
  assert.equal(logic.shown(89.9499999999999), 90, 'floating-point noise is dropped before rounding');
  assert.equal(logic.shown(49.95), 50);
  // reached by slider settings
  const fifty = at({ q: 0, direct: 10, kind: 'thread', wCache: 0 });
  assert.equal(fifty.pct1, 50);
  assert.equal(fifty.band, 'mid');
  const ninety = at({ q: qOf(100), direct: 10, kind: 'thread', wCache: 5, rate: 0.8 });
  assert.equal(ninety.pct1, 90);
  assert.equal(ninety.band, 'high');
});

test('tie-break rule 8 through derive: the band follows the shown value, not the raw one', () => {
  const up = at({ q: qOf(100), direct: 2, wCache: 0, wTlb: 15, rate: 0.45 });
  assert.ok(up.usefulPct < 90 && up.usefulPct > 89.95, String(up.usefulPct));
  assert.equal(up.pct1, 90);
  assert.equal(up.band, 'high');
  const half = at({ q: qOf(50), direct: 0.5, wCache: 0, wTlb: 45, rate: 0.45 });
  assert.ok(half.usefulPct < 50, String(half.usefulPct));
  assert.equal(half.pct1, 50);
  assert.equal(half.band, 'mid');
});

test('the quantum slider: 1-2-5 steps from 10 µs to 10 ms', () => {
  assert.deepEqual(logic.Q_STEPS, [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]);
  assert.deepEqual(logic.Q_STEPS.map((Q, q) => at({ q }).Q), logic.Q_STEPS);
});

test('tie-break: bad params fall back to defaults and are clamped', () => {
  const s = logic.derive({ q: 'x', kind: 'nope', direct: NaN, wCache: 999, wTlb: -5, rate: 0.333 });
  assert.equal(s.Q, 1000);
  assert.equal(s.kind, 'process');
  assert.equal(s.direct, 2);
  assert.equal(s.warm.cache, 200);
  assert.equal(s.warm.tlb, 0);
  assert.equal(s.rate, 0.33);
  assert.equal(logic.derive({ q: 99 }).Q, 10000);
  assert.equal(logic.derive({ q: -3 }).Q, 10);
  assert.equal(logic.derive({ q: 2.6 }).Q, 100);
  assert.equal(logic.derive({ rate: 0.30000000000000004 }).rate, 0.3);
  assert.equal(logic.derive({ rate: 5 }).rate, 0.9);
  assert.equal(logic.derive({ direct: 0 }).direct, 0.5);
  assert.equal(logic.derive({ direct: null, q: '' }).direct, 2, 'null and empty are missing, not 0');
  assert.equal(logic.derive({ direct: null, q: '' }).Q, 1000);
  assert.equal(logic.derive({ q: null }).Q, 1000);
  assert.deepEqual(logic.derive(undefined), logic.derive(logic.defaults));
});

// ── rules ──

test('rule 1: each switch costs direct µs during which nothing runs', () => {
  const a = at({ q: qOf(100), direct: 2 }), b = at({ q: qOf(100), direct: 10 });
  assert.equal(a.perQuantum.direct, 2);
  assert.equal(b.perQuantum.direct, 10);
  near(a.usefulPct, 65 / 102 * 100);
  near(b.usefulPct, 65 / 110 * 100);
  assert.equal(b.perQuantum.useful, a.perQuantum.useful, 'direct cost does not change the work inside the quantum');
});

test('rule 2: during warm-up the process runs at rate of full speed', () => {
  near(at({ q: qOf(100), rate: 0.3 }).perQuantum.useful, 100 - 50 * 0.7);
  near(at({ q: qOf(100), rate: 0.9 }).perQuantum.useful, 100 - 50 * 0.1);
  near(at({ q: qOf(100), rate: 0.1 }).perQuantum.useful, 100 - 50 * 0.9);
});

test('rule 3: process pays cache + TLB, thread and tagged only the cache', () => {
  assert.deepEqual(at({ kind: 'process' }).warm, { cache: 40, tlb: 10, total: 50 });
  assert.deepEqual(at({ kind: 'thread' }).warm, { cache: 40, tlb: 0, total: 40 });
  assert.deepEqual(at({ kind: 'tagged' }).warm, { cache: 40, tlb: 0, total: 40 });
  assert.equal(at({ kind: 'thread', wTlb: 50 }).warm.total, 40, 'wTlb is ignored without a TLB flush');
  assert.equal(at({ kind: 'process', wTlb: 50 }).warm.total, 90);
});

test('rule 4: useful = Q − W(1 − rate) when Q ≥ W, else Q·rate; useful % over Q + direct', () => {
  near(logic.usefulOf(100, 50, 0.3), 65);
  near(logic.usefulOf(20, 50, 0.3), 6);
  near(logic.usefulOf(10, 50, 0.3), 3);
  near(at({ q: 0 }).usefulPct, 25);
  near(at({ q: 0, kind: 'thread', wCache: 0 }).usefulPct, 10 / 12 * 100);
  near(at({ q: qOf(100), kind: 'thread', wCache: 0 }).usefulPct, 100 / 102 * 100);
});

test('rule 5: switches per second = 10⁶ / (Q + direct)', () => {
  near(at({ q: 9 }).switchesPerSec, 1e6 / 10002);
  near(at({ q: 0, direct: 10 }).switchesPerSec, 50000);
  near(at({ q: qOf(100), direct: 0.5 }).switchesPerSec, 1e6 / 100.5);
});

test('rule 6: a quantum\'s time splits into direct, warm-up stalls and useful work', () => {
  for (const q of logic.Q_STEPS.keys()) for (const kind of logic.KINDS) for (const rate of [0.1, 0.3, 0.9]) {
    const s = at({ q, kind, rate });
    const pq = s.perQuantum;
    near(pq.direct + pq.warm + pq.useful, s.Q + s.direct, `q ${q} ${kind} ${rate}`);
    near(s.warmTime + s.fullTime, s.Q);
    assert.equal(s.warmTime, Math.min(s.Q, s.warm.total));
    near(pq.warm, s.warmTime * (1 - s.rate));
  }
  const s = at(preset('too-often'));
  assert.equal(s.perQuantum.direct, 2);
  near(s.perQuantum.warm, 35);
  near(s.perQuantum.useful, 65);
  const t = at(preset('thrash'));
  assert.equal(t.warmTime, 20);
  assert.equal(t.fullTime, 0);
  near(t.perQuantum.warm, 14);
});

test('rule 7: six slots alternate A and B, each a switch, then warm-up, then full speed', () => {
  const s = at(preset('too-often'));
  assert.equal(s.timeline.length, 6);
  assert.deepEqual(s.timeline.map((x) => x.proc), ['A', 'B', 'A', 'B', 'A', 'B']);
  assert.deepEqual(s.timeline.map((x) => x.start), [0, 102, 204, 306, 408, 510]);
  for (const x of s.timeline) assert.deepEqual([x.direct, x.warm, x.full], [2, 50, 50]);
  assert.equal(s.window, 612);
  assert.equal(at({ q: 9 }).window, 6 * 10002, 'the window grows with Q');
  const t = at(preset('thrash'));
  for (const x of t.timeline) assert.deepEqual([x.warm, x.full], [20, 0]);
});

test('rule 8: bands of the presets', () => {
  assert.equal(at(preset('desktop')).band, 'high');
  assert.equal(at(preset('server')).band, 'high');
  assert.equal(at(preset('too-often')).band, 'mid');
  assert.equal(at(preset('threads')).band, 'mid');
  assert.equal(at(preset('thrash')).band, 'low');
  assert.equal(at(preset('too-often')).pct1, 63.7);
});

test('rule 10: the curve spans 10 µs … 10 ms by twentieths of a decade, with the kink at W, ascending', () => {
  const s = at({});
  const Qs = s.curve.map((c) => c.Q);
  assert.equal(Qs[0], 10);
  assert.equal(Qs[Qs.length - 1], 10000);
  assert.ok(Qs.includes(100) && Qs.includes(1000), 'exact decades');
  assert.ok(Qs.includes(50), 'kink at W = 50');
  assert.equal(Qs.length, 62);
  for (let i = 1; i < Qs.length; i++) assert.ok(Qs[i] > Qs[i - 1]);
  for (const c of s.curve) near(c.usefulPct, logic.pctOf(c.Q, 50, 0.3, 2));
  assert.equal(at({ kind: 'thread', wCache: 0 }).curve.length, 61, 'no kink when W = 0');
  assert.equal(at({ kind: 'thread', wCache: 100 }).curve.length, 61, 'W on a decade is not doubled');
  assert.equal(at({ wCache: 5, kind: 'thread' }).curve.length, 61, 'W below 10 µs is off the chart');
  const cur = s.curve.find((c) => c.Q === s.Q);
  near(cur.usefulPct, s.usefulPct, 'the current Q is on the curve');
});

test('rule 11: saved state and what goes cold, per kind', () => {
  const ids = (l) => l.map((x) => x.id + ':' + x.status);
  assert.deepEqual(ids(at({ kind: 'process' }).saved), ['regs:saved', 'pc:saved', 'sp:saved', 'flags:saved', 'fpu:saved', 'ptbr:saved']);
  assert.deepEqual(ids(at({ kind: 'thread' }).saved), ['regs:saved', 'pc:saved', 'sp:saved', 'flags:saved', 'fpu:saved', 'ptbr:same']);
  assert.deepEqual(ids(at({ kind: 'tagged' }).saved), ['regs:saved', 'pc:saved', 'sp:saved', 'flags:saved', 'fpu:saved', 'ptbr:saved']);
  assert.deepEqual(ids(at({ kind: 'process' }).cold), ['tlb:flushed', 'cache:cold']);
  assert.deepEqual(ids(at({ kind: 'thread' }).cold), ['tlb:kept', 'cache:cold']);
  assert.deepEqual(ids(at({ kind: 'tagged' }).cold), ['tlb:tagged', 'cache:cold']);
});

test('presets: the task\'s numbers', () => {
  const row = (id) => { const s = at(preset(id)); return [s.Q, s.kind, Math.round(s.usefulPct * 1000) / 1000, Math.round(s.switchesPerSec * 100) / 100, s.regime]; };
  assert.deepEqual(row('desktop'), [10000, 'process', 99.63, 99.98, 'warm']);
  assert.deepEqual(row('server'), [1000, 'process', 96.307, 998, 'warm']);
  assert.deepEqual(row('too-often'), [100, 'process', 63.725, 9803.92, 'warm']);
  assert.deepEqual(row('threads'), [100, 'thread', 70.588, 9803.92, 'warm']);
  assert.deepEqual(row('thrash'), [20, 'process', 27.273, 45454.55, 'thrash']);
  assert.equal(at({ q: qOf(100), kind: 'tagged' }).pct1, 70.6);
  assert.deepEqual(at({}), at(preset('server')), 'the defaults are the server preset');
});

// ── generic checks every sim keeps ──

function everyParams() {
  const out = [];
  for (let q = 0; q < logic.Q_STEPS.length; q++) for (const kind of logic.KINDS) {
    out.push({ q, kind });
    out.push({ q, kind, direct: 10, wCache: 200, wTlb: 50, rate: 0.9 });
    out.push({ q, kind, direct: 0.5, wCache: 0, wTlb: 0, rate: 0.1 });
  }
  return out;
}

test('state is JSON-safe', () => {
  for (const p of everyParams()) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s, JSON.stringify(p));
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ q: 3, kind: 'thread' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables; every item and kind has words', () => {
  for (const p of logic.presets) {
    for (const k of Object.keys(p.params)) assert.ok(k in logic.defaults, `${p.id}: ${k} is a model param`);
    assert.deepEqual(logic.clean(P(p.params)), P(p.params), `${p.id} is already clean`);
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
      assert.ok(strings[lang]['hint_' + p.id], `${lang} hint of ${p.id}`);
    }
  }
  const s = at({});
  for (const lang of ['hr', 'en']) {
    for (const k of logic.KINDS) assert.ok(strings[lang]['kind_' + k], `${lang} kind ${k}`);
    for (const x of s.saved.concat(s.cold)) assert.ok(strings[lang]['item_' + x.id], `${lang} item ${x.id}`);
    for (const st of ['saved', 'same', 'flushed', 'kept', 'tagged', 'cold']) assert.ok(strings[lang]['st_' + st], `${lang} status ${st}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
