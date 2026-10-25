// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for delay-components' model (rules in SPEC.md). Run: node --test sims/delay-components/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.delays(P(over));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} ≈ ${b} (±${tol})`);
const ms = (s) => s * 1000;
const KM = (km) => logic.distIndex(km);
const seg = (st, n) => st.segments[n - 1].t;

// ── tie-breaks and layout rules first ──

test('tie-break: changed ignores float noise and marks nothing without a ghost bar', () => {
  const a = D({});
  assert.deepEqual(logic.changed(null, a), []);
  assert.deepEqual(logic.changed(a, D({})), []);
  // the same total reached by another route is still "unchanged" per segment only where the time is equal
  const b = JSON.parse(JSON.stringify(a));
  b.segments[1].t += 1e-15;
  assert.deepEqual(logic.changed(b, a), []);
  b.segments[1].t += 1e-9;
  assert.deepEqual(logic.changed(b, a), [2]);
});

test('tie-break: bar layout gives equal times equal shares and keeps the order', () => {
  const sh = logic.barLayout([1, 1, 1, 1, 1, 1], 0.03);
  sh.forEach((x) => near(x, 1 / 6, 1e-12));
  const s2 = logic.barLayout([2, 1, 0, 0, 2, 1], 0.03);
  near(s2[0], s2[4], 1e-12, 'equal times');
  near(s2[2], 0.03, 1e-12, 'zero gets the minimum');
  near(s2[3], 0.03, 1e-12);
  near(s2[0], 2 * s2[1], 1e-12, 'the rest in proportion');
});

test('rule 7: a segment under the minimum is drawn at exactly the minimum; shares sum to 1', () => {
  const st = D({ rate: 1000, distance: KM(7000) });           // transmission 0.012 ms beside 34.3 ms
  const sh = logic.barLayout(st.segments.map((x) => x.t), 0.025);
  near(sh.reduce((a, x) => a + x, 0), 1, 1e-12, 'sum');
  for (const n of [1, 3, 4, 5]) near(sh[n - 1], 0.025, 1e-12, `segment ${n}`);
  near(sh[1], sh[5], 1e-12, 'both propagations');
  assert.ok(sh[1] > 0.4);
});

test('rule 7: raising small segments can push a middle one under the minimum; it is fixed too', () => {
  // proportional shares 0.0001, 0.036, 0.9639: the 0.036 one drops below 0.035 once the first is raised
  const sh = logic.barLayout([0.0001, 0.036, 0.9639], 0.035);
  near(sh[0], 0.035, 1e-12);
  near(sh[1], 0.035, 1e-12);
  near(sh[2], 0.93, 1e-12);
});

test('bar layout: all zero, or minimums that fill the bar, give equal shares', () => {
  logic.barLayout([0, 0, 0, 0, 0, 0], 0.03).forEach((x) => near(x, 1 / 6, 1e-12));
  logic.barLayout([5, 1, 1, 1, 1, 1], 0.2).forEach((x) => near(x, 1 / 6, 1e-12));
});

test('load cap: above 95 % is taken as 95 % and flagged', () => {
  const a = D({ load: 95 }), b = D({ load: 100 });
  assert.equal(a.atCap, true);
  assert.equal(D({ load: 90 }).atCap, false);
  near(b.queue, a.queue, 1e-15);
  assert.ok(Number.isFinite(b.total));
});

// ── rules of this model ──

test('rule 1: the total is the sum of the six segments, two transmissions and two propagations', () => {
  const st = D({ load: 50, proc: 200, distance: KM(3000), medium: 'copper' });
  assert.deepEqual(st.segments.map((x) => x.n), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(st.segments.map((x) => x.kind), ['trans', 'prop', 'proc', 'queue', 'trans', 'prop']);
  near(st.total, st.segments.reduce((a, x) => a + x.t, 0), 1e-15);
  near(st.total, 2 * st.trans + 2 * st.prop + st.proc + st.queue, 1e-15);
  near(ms(D({}).total), 1.2393, 1e-4, 'defaults');
});

test('rule 2: transmission = L/R and does not depend on distance, medium or load', () => {
  near(ms(D({ size: 1500, rate: 10 }).trans), 1.2, 1e-12);
  near(ms(D({ size: 1500, rate: 1000 }).trans), 0.012, 1e-12);
  near(ms(D({ size: 64, rate: 10 }).trans), 0.0512, 1e-12);
  near(ms(D({ size: 1500, rate: 50 }).trans), 0.24, 1e-12);
  const a = D({}), b = D({ distance: KM(40000), medium: 'radio', load: 80 });
  assert.equal(seg(a, 1), seg(b, 1));
  assert.equal(seg(a, 5), seg(b, 5));
});

test('rule 3: propagation = d/s and does not depend on size, rate or load', () => {
  near(ms(D({ distance: KM(100) }).prop), 0.4897, 1e-4);
  const a = D({}), b = D({ size: 9000, rate: 10, load: 95, proc: 1000 });
  assert.equal(seg(a, 2), seg(b, 2));
  assert.equal(seg(a, 6), seg(b, 6));
});

test('rule 4: speed per medium: fibre c/1.468, copper 0.66 c, radio c', () => {
  near(logic.SPEED.fibre, 2.0422e8, 1e4);
  near(1e9 / logic.SPEED.fibre, 4.897, 1e-3, 'µs per km in fibre');
  near(logic.SPEED.copper / logic.C, 0.66, 1e-12);
  assert.equal(logic.SPEED.radio, 299792458);
  const f = D({ medium: 'fibre' }).prop, c = D({ medium: 'copper' }).prop, r = D({ medium: 'radio' }).prop;
  assert.ok(r < f && f < c, 'radio fastest, copper slowest');
});

test('rule 5: queuing = t·U/(1−U); the router time doubles at 50 %; packets ahead U/(1−U)', () => {
  near(D({ load: 0 }).queue, 0, 0);
  near(ms(D({ load: 50 }).queue), 0.12, 1e-12);
  near(ms(D({ load: 50 }).router), 0.24, 1e-12);
  near(ms(D({ load: 0 }).router), 0.12, 1e-12);
  near(ms(D({ load: 90 }).queue), 1.08, 1e-12);
  near(D({ load: 90 }).ahead, 9, 1e-12);
  near(ms(D({ load: 95 }).queue), 2.28, 1e-12);
  // it uses link 2's transmission time, so a slower link or a bigger packet queues longer at the same load
  near(D({ load: 50, rate: 10 }).queue, D({ load: 50, rate: 10 }).trans, 1e-15);
  // and it is the only segment load changes
  assert.deepEqual(logic.changed(D({ load: 0 }), D({ load: 70 })), [4]);
});

test('rule 6: processing is one constant at the router; the end hosts add none', () => {
  const st = D({ proc: 370 });
  near(seg(st, 3), 0.37e-3, 1e-15);
  assert.equal(st.segments.filter((x) => x.kind === 'proc').length, 1);
  near(ms(D({}).proc), 0.02, 1e-15);
  assert.deepEqual(logic.changed(D({}), D({ proc: 500 })), [3]);
});

test('rule 7: zero load gives a queue of exactly 0; zero distance a propagation of exactly 0', () => {
  assert.equal(D({ load: 0 }).queue, 0);
  assert.equal(logic.delays(Object.assign(P({}), { km: 0 })).prop, 0);
});

test('each param drives only its own segments (the task\'s "what the params drive live")', () => {
  assert.deepEqual(logic.changed(D({}), D({ size: 64 })), [1, 5]);
  assert.deepEqual(logic.changed(D({}), D({ rate: 10 })), [1, 5]);
  assert.deepEqual(logic.changed(D({}), D({ distance: KM(1000) })), [2, 6]);
  assert.deepEqual(logic.changed(D({}), D({ medium: 'radio' })), [2, 6]);
  // with a queue, size and rate move the queue too (it counts in packets of link 2's length)
  assert.deepEqual(logic.changed(D({ load: 50 }), D({ load: 50, rate: 10 })), [1, 4, 5]);
});

// ── presets: the task's expected numbers ──

const preset = (id) => logic.presets.find((x) => x.id === id);
const pair = (id) => [D(preset(id).before), D(preset(id).params)];

test('preset slow-fast-link: transmission 1.2 → 0.012 ms, propagation 0.49 ms in both', () => {
  const [a, b] = pair('slow-fast-link');
  assert.equal(logic.msText(a.trans), '1.2');
  assert.equal(logic.msText(b.trans), '0.012');
  assert.equal(logic.msText(a.prop), '0.49');
  assert.equal(a.prop, b.prop);
  assert.deepEqual(logic.changed(a, b), [1, 5]);
});

test('preset near-far: propagation 0.00049 → 34.3 ms, transmission 0.012 ms in both', () => {
  const [a, b] = pair('near-far');
  assert.equal(logic.msText(a.prop), '0.00049');
  assert.equal(logic.msText(b.prop), '34.3');
  assert.equal(logic.msText(a.trans), '0.012');
  assert.deepEqual(logic.changed(a, b), [2, 6]);
});

test('preset satellite: 238.7 ms one way, transmission 0.24 ms, round trip about 477 ms', () => {
  const [a, b] = pair('satellite');
  assert.equal(logic.msText(2 * b.prop), '238.7');
  assert.equal(logic.msText(b.prop), '119.4');
  assert.equal(logic.msText(b.trans), '0.24');
  near(ms(4 * b.prop), 477.5, 0.05);
  assert.equal(logic.msText(a.prop), '0.49');
  assert.deepEqual(logic.changed(a, b), [2, 6]);
});

test('preset busy-router: queuing 0 → 1.08 ms; nothing else changes', () => {
  const [a, b] = pair('busy-router');
  assert.equal(a.queue, 0);
  assert.equal(logic.msText(b.queue), '1.08');
  assert.deepEqual(logic.changed(a, b), [4]);
});

test('preset small-packet: transmission 1.2 → 0.051 ms; propagation unchanged', () => {
  const [a, b] = pair('small-packet');
  assert.equal(logic.msText(a.trans), '1.2');
  assert.equal(logic.msText(b.trans), '0.051');
  assert.deepEqual(logic.changed(a, b), [1, 5]);
});

test('every preset distance is on the ladder, and the ladder rises from 0.1 to 40 000 km', () => {
  for (const p of logic.presets) for (const x of [p.before, p.params]) if ('distance' in x) assert.ok(x.distance >= 0, p.id);
  const L = logic.DISTANCES;
  assert.equal(L[0], 0.1);
  assert.equal(L[L.length - 1], 40000);
  for (let i = 1; i < L.length; i++) assert.ok(L[i] > L[i - 1]);
  assert.equal(L.length, 36);
  assert.equal(L[logic.defaults.distance], 100);
});

test('msText: significant digits by size, zeros dropped', () => {
  assert.equal(logic.msText(0), '0');
  assert.equal(logic.msText(1.08e-3), '1.08');
  assert.equal(logic.msText(1.2e-3), '1.2');
  assert.equal(logic.msText(34.277e-3), '34.3');
  assert.equal(logic.msText(477.48e-3), '477.5');
  assert.equal(logic.msText(4.9e-10), '0.00000049');
});

// ── ghost bar and captions (pure parts of the page) ──

test('paramsChanged: the keys that differ, in the defaults\' order; none without a ghost', () => {
  assert.deepEqual(logic.paramsChanged(null, P({})), []);
  assert.deepEqual(logic.paramsChanged(P({}), P({})), []);
  assert.deepEqual(logic.paramsChanged(P({}), P({ proc: 30, size: 64 })), ['size', 'proc']);
});

test('tie-break: a run of changes to one param keeps the baseline; another param starts a new one', () => {
  let g = logic.nextGhost({ before: null, run: null }, null, P({}));
  assert.equal(g.before, null, 'first render: no ghost');
  const a = P({}), b = P({ distance: KM(150) }), c = P({ distance: KM(7000) });
  g = logic.nextGhost(g, a, b);
  assert.deepEqual([g.before, g.run], [a, 'distance']);
  g = logic.nextGhost(g, b, c);
  assert.deepEqual([g.before, g.run], [a, 'distance'], 'dragging on keeps the start');
  const d = P({ distance: KM(7000), load: 50 });
  g = logic.nextGhost(g, c, d);
  assert.deepEqual([g.before, g.run], [c, 'load'], 'another param: the previous settings');
  assert.equal(logic.nextGhost(g, d, d), g, 'no change (a re-render) keeps it');
  const e = P({ size: 64, rate: 10 });
  g = logic.nextGhost(g, d, e);
  assert.deepEqual([g.before, g.run], [d, null], 'several at once: no run');
  const f = P({ size: 64, rate: 50 });
  assert.deepEqual(logic.nextGhost(g, e, f).before, e, 'after a multi-param change the next change starts fresh');
});

test('captionKey: one sentence per kind of change', () => {
  const k = (a, b) => logic.captionKey(a && P(a), P(b));
  assert.equal(k(null, {}), 'capTotal');
  assert.equal(k({}, {}), 'capTotal');
  assert.equal(k({ rate: 10 }, { rate: 1000 }), 'capFaster');
  assert.equal(k({ rate: 1000 }, { rate: 10 }), 'capSlower');
  assert.equal(k({ size: 1500 }, { size: 64 }), 'capSmaller');
  assert.equal(k({ size: 64 }, { size: 9000 }), 'capBigger');
  assert.equal(k({ distance: KM(100) }, { distance: KM(7000) }), 'capFarther');
  assert.equal(k({ distance: KM(7000) }, { distance: KM(100) }), 'capNearer');
  assert.equal(k({ medium: 'fibre' }, { medium: 'radio' }), 'capMedium');
  assert.equal(k({}, { medium: 'radio', distance: KM(35786) }), 'capPath');
  assert.equal(k({ load: 50 }, { load: 0 }), 'capLoadZero');
  assert.equal(k({}, { load: 90 }), 'capLoad');
  assert.equal(k({}, { load: 95 }), 'capLoadCap');
  assert.equal(k({}, { proc: 500 }), 'capProc');
  assert.equal(k({}, { size: 64, rate: 10 }), 'capMany');
  assert.equal(k({}, { load: 50, proc: 30 }), 'capMany');
  // the presets read as the task's captions
  const pk = (id) => { const p = logic.presets.find((x) => x.id === id); return logic.captionKey(P(p.before), P(p.params)); };
  assert.equal(pk('slow-fast-link'), 'capFaster');
  assert.equal(pk('busy-router'), 'capLoad');
  assert.equal(pk('satellite'), 'capPath');
});

test('every preset value is one the page\'s controls can show', () => {
  for (const p of logic.presets) {
    for (const x of [p.before, p.params]) {
      const q = P(x);
      assert.ok(logic.SIZES.includes(q.size), `${p.id} size`);
      assert.ok(logic.RATES.includes(q.rate), `${p.id} rate`);
      assert.ok(logic.MEDIA.includes(q.medium), `${p.id} medium`);
      assert.ok(Number.isInteger(q.distance) && q.distance >= 0 && q.distance < logic.DISTANCES.length, `${p.id} distance`);
      assert.ok(Number.isInteger(q.load / 5) && q.load >= 0 && q.load <= logic.LOAD_CAP, `${p.id} load`);
      assert.ok(Number.isInteger(q.proc / 10) && q.proc >= 0 && q.proc <= 1000, `${p.id} proc`);
    }
  }
});

test('msText: values that round to nothing are 0', () => {
  assert.equal(logic.msText(1e-18), '0');
});

// ── generic checks every sim keeps ──

test('state is JSON-safe', () => {
  for (const p of logic.presets) {
    const s = logic.initial(P(p.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ load: 40, medium: 'copper' });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables', () => {
  for (const p of logic.presets) {
    for (const x of [p.before, p.params]) for (const k of Object.keys(x)) assert.ok(k in logic.defaults, `${p.id}: ${k}`);
    for (const lang of ['hr', 'en']) assert.ok(strings[lang]['preset_' + p.id], `${lang} name of ${p.id}`);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
