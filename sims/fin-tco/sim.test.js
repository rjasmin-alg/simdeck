// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for fin-tco. Run: node --test sims/fin-tco/
// Rules and expected numbers: SPEC.md. Tie-breaks first, then the tco module's rules (promotable with it), then the
// page model, then the template's generic block.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const T = require('./tco.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.compute(P(over));
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const allOn = () => Object.fromEntries(logic.KEYS.map((k) => ['on_' + k, true]));
const allOff = () => Object.fromEntries(logic.KEYS.map((k) => ['on_' + k, false]));
const L = (key) => logic.LINES.find((l) => l.key === key);

// ── tie-breaks ──

test('rule 1: equal totals tie; no winner, no difference, no flip', () => {
  assert.equal(T.cheaper(100, 100), 'tie');
  assert.equal(T.cheaper(99, 100), 'a');
  assert.equal(T.cheaper(100, 99), 'b');
  // B made identical to A
  const same = {};
  for (const k of logic.KEYS) same['b_' + k] = logic.defaults['a_' + k];
  const s = S(same);
  assert.equal(s.winner, 'tie');
  assert.equal(s.diff, 0);
  assert.equal(s.quote, 'tie');
  assert.equal(s.flip, false);
  assert.deepEqual(logic.captionKey(s), { key: 'capTie', notes: [] });
});

test('rule 1: a tie on the quote is never a flip, even when the totals differ', () => {
  const s = S({ b_purchase: 6000 });
  assert.equal(s.quote, 'tie');
  assert.equal(s.winner, 'b');
  assert.equal(s.flip, false);
});

test('rule 1: a tie in the totals is never a flip, even when the quote has a winner', () => {
  // A: 6 000 + 1 500 + 1 000 once, 5 700 a year; B: 12 500 once, 4 000 a year. B's support 1 200 → 2 200 makes the
  // yearly parts 5 700 / 5 000, so at H 5: 8 500 + 28 500 = 37 000 vs 12 500 + 25 000 = 37 500. Move B's purchase to
  // 9 500: 37 000 / 37 000.
  const s = S({ b_support: 2200, b_purchase: 9500 });
  assert.equal(s.total.a, s.total.b);
  assert.equal(s.winner, 'tie');
  assert.equal(s.quote, 'a');
  assert.equal(s.flip, false);
});

test('rule 8: a tie inside the strip; the crossing names the last strict win and the first other one', () => {
  const s = S({ a_power: 1500 });
  assert.deepEqual(s.strip, ['a', 'tie', 'b', 'b', 'b', 'b', 'b']);
  assert.deepEqual(s.crossing, { early: 'a', upTo: 1, late: 'b', from: 3 });
});

test('rule 8: no crossing when either end of the strip is a tie or both ends agree', () => {
  assert.equal(T.crossing(['tie', 'a', 'a']), null);
  assert.equal(T.crossing(['a', 'a', 'tie']), null);
  assert.equal(T.crossing(['a', 'b', 'a']), null);   // cannot happen (linear), but the ends decide
  assert.equal(T.crossing(['b', 'b', 'b']), null);
  assert.deepEqual(T.crossing(['b', 'a', 'a']), { early: 'b', upTo: 1, late: 'a', from: 2 });
});

test('rule 6: the share rounds half up and is null for a zero total', () => {
  assert.equal(T.share(1, 8), 13);        // 12.5 → 13
  assert.equal(T.share(1, 200), 1);       // 0.5 → 1
  assert.equal(T.share(1, 201), 0);       // 0.497… → 0
  assert.equal(T.share(2, 3), 67);
  assert.equal(T.share(0, 100), 0);
  assert.equal(T.share(5, 0), null);
});

// ── tco.js ──

test('rule 2: a start or end line counts once whatever the horizon; a yearly line × H; staff × rate × H', () => {
  for (const H of [1, 3, 7]) {
    assert.equal(T.lineOver(L('purchase'), 6000, H), 6000);
    assert.equal(T.lineOver(L('setup'), 1500, H), 1500);
    assert.equal(T.lineOver(L('training'), 250, H), 250);
    assert.equal(T.lineOver(L('exit'), 1000, H), 1000);
    assert.equal(T.lineOver(L('power'), 1200, H), 1200 * H);
    assert.equal(T.lineOver(L('space'), 1000, H), 1000 * H);
    assert.equal(T.lineOver(L('support'), 1200, H), 1200 * H);
    assert.equal(T.lineOver(L('staff'), 70, H), 70 * 50 * H);
  }
  assert.equal(logic.RATE, 50);
});

test('rule 2: a line switched off adds nothing, to both options', () => {
  const on = S({});
  const off = S({ on_support: false });
  assert.equal(on.total.a - off.total.a, 0);                    // A has no support
  assert.equal(on.total.b - off.total.b, 1200 * 5);
  const noStaff = S({ on_staff: false });
  assert.equal(on.total.a - noStaff.total.a, 70 * 50 * 5);
  assert.equal(on.total.b - noStaff.total.b, 30 * 50 * 5);
});

test('rule 3: the total is the sum of the lines over H, and once + H × yearly', () => {
  for (const H of [1, 2, 5, 7]) {
    const s = S({ horizon: H });
    for (const side of ['a', 'b']) {
      const sum = s.rows.reduce((x, r) => x + (r.on ? r[side + 'Over'] : 0), 0);
      assert.equal(s.total[side], sum);
      const g = s.groups[side];
      assert.equal(g.price + g.once + g.running, sum);
    }
  }
  const A = { purchase: 6000, setup: 1500, training: 0, power: 1200, space: 1000, support: 0, staff: 70, exit: 1000 };
  const on = Object.fromEntries(logic.KEYS.map((k) => [k, true]));
  assert.deepEqual(T.parts(logic.LINES, A, on), { once: 8500, yearly: 5700 });
  assert.equal(T.total(logic.LINES, A, on, 4), 8500 + 4 * 5700);
  // a switched-off line leaves the parts, the kind groups and the total alike; a missing switch is off
  assert.deepEqual(T.parts(logic.LINES, A, Object.assign({}, on, { power: false, exit: false })), { once: 7500, yearly: 4500 });
  assert.equal(T.total(logic.LINES, A, {}, 5), 0);
  const s = S({ on_power: false, on_setup: false });
  for (const side of ['a', 'b']) {
    const g = s.groups[side];
    assert.equal(g.price + g.once + g.running, s.total[side]);
  }
});

test('rule 4: the lower total is cheaper, by the difference', () => {
  const s = S({});
  assert.equal(s.winner, 'b');
  assert.equal(s.diff, s.total.a - s.total.b);
  const t = S({ horizon: 1 });
  assert.equal(t.winner, 'a');
  assert.equal(t.diff, t.total.b - t.total.a);
});

test('rule 5: the quote ranks by the purchase price alone, even with the purchase line off', () => {
  assert.equal(S({}).quote, 'a');
  assert.equal(S({ on_purchase: false }).quote, 'a');
  assert.equal(S({ on_purchase: false }).quoteDiff, 4000);
  assert.equal(S({ a_purchase: 12000 }).quote, 'b');
});

test('rule 6: the purchase share only with the purchase on and a total above 0', () => {
  assert.deepEqual(S({}).share, { a: 16, b: 31 });
  assert.deepEqual(S({ on_purchase: false }).share, { a: null, b: null });
  assert.deepEqual(S(allOff()).share, { a: null, b: null });
  assert.deepEqual(S(Object.assign(allOff(), { on_purchase: true })).share, { a: 100, b: 100 });
  assert.deepEqual(S(Object.assign(allOff(), { on_purchase: true, a_purchase: 0, b_purchase: 0 })).share, { a: null, b: null });
});

test('rule 7: the flip needs a strict winner on the quote and the other strict winner in total', () => {
  assert.equal(S({}).flip, true);                          // quote A, total B
  assert.equal(S({ horizon: 2 }).flip, false);             // quote A, total A
  assert.equal(S(preset('build-vs-buy')).flip, false);     // quote B, total B
  assert.equal(S(preset('staff-free')).flip, true);        // quote B, total A
});

test('rule 8: the strip ranks every horizon 1…7 with the switches as they are', () => {
  assert.deepEqual(S({}).strip, ['a', 'a', 'b', 'b', 'b', 'b', 'b']);
  assert.deepEqual(S({ horizon: 1 }).strip, S({ horizon: 7 }).strip);
  assert.deepEqual(S(Object.assign({}, preset('exit-cost'), { on_exit: false })).strip, ['a', 'a', 'a', 'a', 'a', 'b', 'b']);
  assert.deepEqual(S(allOff()).strip, Array(7).fill('tie'));
  assert.deepEqual(S({}).crossing, { early: 'a', upTo: 2, late: 'b', from: 3 });
  assert.equal(S(preset('price-only')).crossing, null);
});

test('rule 9: the winner mark appears only when the winner changes', () => {
  const a = S({ horizon: 2 }), b = S({ horizon: 3 }), c = S({ horizon: 4 });
  assert.deepEqual(logic.flipped(a, b), ['winner']);
  assert.deepEqual(logic.flipped(b, c), []);
  const tie = S({ b_support: 2200, b_purchase: 9500 });
  assert.deepEqual(logic.flipped(b, tie), ['winner']);
  assert.deepEqual(logic.flipped(null, a), []);
});

// ── the page model ──

test('presets: the SPEC table, totals, winner, quote, shares and strip', () => {
  const W = (x) => x.map((w) => ({ a: 'A', b: 'B', tie: '=' })[w]).join('');
  const expect = {
    'cheaper-purchase': [37000, 32500, 'b', 4500, 'a', { a: 16, b: 31 }, 'AABBBBB', true],
    'short-horizon': [19900, 20500, 'a', 600, 'a', { a: 30, b: 49 }, 'AABBBBB', false],
    'price-only': [6000, 10000, 'a', 4000, 'a', { a: 100, b: 100 }, 'AAAAAAA', false],
    'build-vs-buy': [134500, 111000, 'b', 23500, 'b', { a: 3, b: 0 }, 'ABBBBBB', false],
    'staff-free': [9500, 91000, 'a', 81500, 'b', { a: 42, b: 0 }, 'AAAAAAA', true],
    'exit-cost': [57500, 51000, 'b', 6500, 'a', { a: 0, b: 24 }, 'AABBBBB', true]
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(expect));
  for (const x of logic.presets) {
    const s = logic.compute(x.params);
    const e = expect[x.id];
    assert.deepEqual([s.total.a, s.total.b, s.winner, s.diff, s.quote, s.share, W(s.strip), s.flip], e, x.id);
  }
  const off = S(Object.assign({}, preset('exit-cost'), { on_exit: false }));
  assert.deepEqual([off.total.a, off.total.b, off.winner], [48500, 49500, 'a']);
  const tie2 = S({ a_power: 1500 });
  assert.deepEqual([tie2.total.a, tie2.total.b, W(tie2.strip)], [38500, 32500, 'A=BBBBB']);
});

test('presets: each carries every param, and the switches each SPEC row names', () => {
  for (const x of logic.presets) assert.deepEqual(Object.keys(x.params).sort(), Object.keys(logic.defaults).sort(), x.id);
  assert.deepEqual(preset('cheaper-purchase'), logic.defaults);
  for (const k of logic.KEYS) {
    assert.equal(preset('price-only')['on_' + k], k === 'purchase');
    assert.equal(preset('staff-free')['on_' + k], k !== 'staff');
    assert.equal(preset('exit-cost')['on_' + k], true);
  }
  assert.deepEqual(logic.presets.map((x) => x.params.pair), ['servers', 'servers', 'servers', 'build', 'build', 'exit']);
  assert.deepEqual(logic.presets.map((x) => x.params.horizon), [5, 2, 5, 5, 5, 5]);
});

test('captions: the main sentence and the notes in order', () => {
  const k = (over) => logic.captionKey(S(over));
  assert.deepEqual(k({}), { key: 'capCheaper', notes: ['nFlip', 'nHorizon'] });
  assert.deepEqual(k({ horizon: 2 }), { key: 'capCheaper', notes: ['nHorizon'] });
  assert.deepEqual(k(preset('price-only')), { key: 'capCheaper', notes: [] });
  assert.deepEqual(k(preset('staff-free')), { key: 'capCheaper', notes: ['nFlip'] });
  assert.deepEqual(k(allOff()), { key: 'capNothing', notes: [] });
  // everything off but a line both options have at 0: a tie, not "nothing switched on"
  assert.deepEqual(k(Object.assign(allOff(), { on_training: true })), { key: 'capTie', notes: [] });
  // a tie at the chosen horizon keeps the horizon note when the strip crosses (A = B at 2 years)
  assert.deepEqual(k({ a_power: 1500, horizon: 2 }), { key: 'capTie', notes: ['nHorizon'] });
});

test('rows: one per line in stage order, with the amount and what it adds over H', () => {
  const s = S({ horizon: 3 });
  assert.deepEqual(s.rows.map((r) => r.key), ['purchase', 'setup', 'training', 'power', 'space', 'support', 'staff', 'exit']);
  const staff = s.rows.find((r) => r.key === 'staff');
  assert.deepEqual([staff.a, staff.aOver, staff.b, staff.bOver, staff.staff], [70, 10500, 30, 4500, true]);
  const exit = s.rows.find((r) => r.key === 'exit');
  assert.deepEqual([exit.when, exit.aOver, exit.group], ['end', 1000, 'once']);
  assert.deepEqual(s.rows.map((r) => r.group), ['price', 'once', 'once', 'running', 'running', 'running', 'running', 'once']);
});

test('normalise: clamps and snaps amounts per line, defaults non-numbers, reads switches', () => {
  const p = logic.normalise({ horizon: 99, a_purchase: 123456, b_staff: -5, a_training: 380, b_power: 'x', pair: 'nope' });
  assert.equal(p.horizon, logic.H_MAX);
  assert.equal(p.a_purchase, 40000);
  assert.equal(p.b_staff, 0);
  assert.equal(p.a_training, 500);          // 380 snaps to the 250 step: 500
  assert.equal(p.b_power, logic.defaults.b_power);
  assert.equal(p.pair, 'servers');
  assert.equal(logic.normalise({ horizon: 0 }).horizon, logic.H_MIN);
  assert.equal(logic.normalise({ horizon: 'q' }).horizon, 5);
  assert.equal(logic.normalise({ horizon: 2.5 }).horizon, 3);
  assert.equal(logic.normalise({ a_power: Infinity }).a_power, logic.defaults.a_power);
  assert.equal(logic.normalise({ a_staff: 74 }).a_staff, 70);
  assert.equal(logic.normalise({ on_exit: false }).on_exit, false);
  assert.equal(logic.normalise({ on_exit: 'false' }).on_exit, false);
  assert.equal(logic.normalise({ on_exit: 0 }).on_exit, false);
  assert.equal(logic.normalise({ on_exit: true }).on_exit, true);
  assert.equal(logic.normalise({}).on_exit, true);
  assert.equal(logic.normalise({ pair: 'build' }).pair, 'build');
});

test('lines and ranges are the SPEC table', () => {
  assert.deepEqual(logic.LINES.map((l) => [l.key, l.when, l.max, l.step]), [
    ['purchase', 'start', 40000, 500], ['setup', 'start', 20000, 500], ['training', 'start', 10000, 250],
    ['power', 'year', 5000, 100], ['space', 'year', 5000, 100], ['support', 'year', 30000, 100],
    ['staff', 'year', 1000, 10], ['exit', 'end', 20000, 500]
  ]);
  assert.deepEqual([logic.H_MIN, logic.H_MAX, logic.defaults.horizon], [1, 7, 5]);
  // every preset amount sits on its line's step and within range
  for (const x of logic.presets) for (const l of logic.LINES) for (const s of ['a_', 'b_']) {
    const v = x.params[s + l.key];
    assert.ok(v >= 0 && v <= l.max && v % l.step === 0, `${x.id} ${s}${l.key} ${v}`);
  }
});

// ── generic checks every sim keeps ──

test('state is JSON-safe for every preset and the defaults', () => {
  for (const p of [logic.defaults].concat(logic.presets.map((x) => x.params))) {
    const s = logic.initial(P(p));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('compute is deterministic and does not mutate its input', () => {
  const p = P(preset('staff-free'));
  const copy = structuredClone(p);
  assert.deepEqual(logic.compute(p), logic.compute(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every line and pair has its words; every preset its label and hint; the page uses the model\'s presets', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
  assert.match(html, /presets:\s*L\.presets\.map/);
  for (const lang of ['hr', 'en']) {
    for (const k of logic.KEYS) assert.ok(strings[lang]['line_' + k], `${lang} line ${k}`);
    for (const pr of logic.PAIRS) for (const s of ['A', 'B']) assert.ok(strings[lang]['pair_' + pr + s], `${lang} pair ${pr}${s}`);
    for (const x of logic.presets) {
      assert.ok(strings[lang][labelKey(x.id)], `${lang} label for ${x.id}`);
      assert.ok(strings[lang][labelKey(x.id) + 'Hint'], `${lang} hint for ${x.id}`);
    }
  }
});

/** Preset id → string key: build-vs-buy → pBuildVsBuy. */
function labelKey(id) { return 'p' + id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(''); }
