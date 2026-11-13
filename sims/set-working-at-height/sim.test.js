// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for set-working-at-height's model (rules in SPEC.md). Run: node --test sims/set-working-at-height/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../../kit/kit.js');
const glossary = require('../../kit/glossary.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const P = (over) => logic.withDefaults(over);
const D = (over) => logic.derive(P(over));
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) < (eps || 1e-9), `${msg || ''} ${a} ≈ ${b}`);
const preset = (id) => logic.presets.find((x) => x.id === id).params;
const ev = (over) => Object.assign({ kind: 'pass', k: 2, i: 0, t: 1, v: 0, u: 0, a: 0, r: 0 }, over);

// ── tie-breaks first ──

test('tie-break (rule 2): an energy on a band boundary belongs to the band above', () => {
  assert.equal(logic.band(10), 1);
  assert.equal(logic.band(10 - 1e-12), 1, 'within EPS counts as on the boundary');
  assert.equal(logic.band(9.999), 0);
  assert.equal(logic.band(100), 2);
  assert.equal(logic.band(99.999), 1);
  assert.equal(logic.band(0), 0);
});

test('tie-break (rule 6): a candidate happens only when v is strictly below the access ratio', () => {
  const ratio = logic.RATE.platform.hand / logic.LMAX.hand;
  assert.equal(logic.happens(ev({ kind: 'hand', v: ratio }), 'platform'), false);
  assert.equal(logic.happens(ev({ kind: 'hand', v: ratio - 1e-12 }), 'platform'), true);
  assert.equal(logic.happens(ev({ kind: 'hand', v: ratio }), 'ladder'), true, 'ratio 1 on a ladder');
  assert.equal(logic.happens(ev({ kind: 'edge', v: 0.999999 }), 'lift'), true);
});

test('tie-break (rule 9): a landing on the tape counts as inside the zone', () => {
  const p = logic.clean({ zone: 'closed', zoneR: 2 });
  assert.equal(logic.inZone(2, p), true);
  assert.equal(logic.inZone(2 + 1e-12, p), true, 'within EPS');
  assert.equal(logic.inZone(2.001, p), false);
  assert.equal(logic.inZone(0, logic.clean({ zone: 'open' })), false, 'no zone, nothing is inside');
});

test('tie-break (rule 10): a hit needs r strictly below the chance', () => {
  const open = logic.clean({ traffic: 'busy' });
  assert.equal(logic.isHit(0.2, 0, open), false, 'r = share is no hit');
  assert.equal(logic.isHit(0.2 - 1e-12, 0, open), true);
  const taped = logic.clean({ traffic: 'through', zone: 'taped', zoneR: 2 });
  assert.equal(logic.isHit(0.2, 1, taped), false, 'inside tape: 0.4 × 0.5 = 0.2, r = 0.2 is no hit');
  assert.equal(logic.isHit(0.1999, 1, taped), true);
  assert.equal(logic.isHit(0.3, 2.5, taped), true, 'outside the tape: the full share');
  assert.equal(logic.isHit(0, 1, logic.clean({ zone: 'closed', zoneR: 2 })), false, 'nothing is a hit inside a closed zone, even r = 0');
  // through derive: the seeded week's hits are exactly the landings with r < p
  const s = logic.derive(P({}));
  const evs = logic.events(1).filter((e) => logic.happens(e, 'ladder'));
  assert.equal(s.counts.hits, evs.filter((e) => e.r < 0.2).length);
});

test('rule 5: events are sorted by time (ties by kind order, then the order drawn, cannot occur with these draws)', () => {
  for (const seed of [1, 2, 17, 99]) {
    const e = logic.events(seed);
    for (let i = 1; i < e.length; i++) {
      const a = e[i - 1], b = e[i];
      assert.ok(a.t < b.t || (a.t === b.t && (a.k < b.k || (a.k === b.k && a.i < b.i))), `seed ${seed} at ${i}`);
    }
  }
});

// ── rules ──

test('rule 1: E = m·g·h and v = √(2gh); a 1 kg clamp from 6 m is 58.86 J at 10.85 m/s', () => {
  near(logic.energy(1, 6), 58.86, 1e-9);
  near(logic.speed(6), 10.8499, 1e-4);
  const s = D({ item: 'clamp', height: 6 });
  near(s.energy, 58.86);
  assert.equal(s.band, 1);
  near(D({ item: 'spanner', height: 10 }).energy, 49.05);
  near(D({ item: 'lamp', height: 10 }).energy, 245.25);
  assert.equal(D({ item: 'lamp', height: 6 }).band, 2, '147 J: even with a hard hat');
  assert.equal(D({ item: 'spanner', height: 2 }).band, 0, '9.81 J: a knock');
  near(D({ item: 'clamp', height: 4 }).energy, 2 * D({ item: 'clamp', height: 2 }).energy, 1e-9, 'twice the height, twice the energy');
});

test('rule 3: the worker\'s fall is 80·g·h; what stops it depends on the access', () => {
  near(D({ height: 2 }).fall, 1569.6);
  near(D({ height: 6 }).fall, 4708.8);
  assert.deepEqual(D({ access: 'ladder' }).fallStop, []);
  assert.deepEqual(D({ access: 'platform' }).fallStop, ['rails']);
  assert.deepEqual(D({ access: 'lift' }).fallStop, ['rails', 'harness']);
});

test('rule 4: not trained, the worker does not go up: no drops, no expected hits, blocked', () => {
  for (const access of logic.ACCESS_IDS) {
    const s = D({ access, trained: false });
    assert.equal(s.blocked, true);
    assert.equal(s.drops.length, 0);
    assert.equal(s.counts.dropped, 0);
    assert.equal(s.expected, 0);
  }
  assert.equal(D({}).blocked, false);
});

test('rule 5: the events depend on the seed only, with each kind\'s highest rate', () => {
  const a = logic.events(3), b = logic.events(3), c = logic.events(4);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  for (const e of a) assert.ok(e.t >= 0 && e.t < logic.HOURS);
  // over many seeds the counts per kind approach λmax × HOURS
  const tot = { hand: 0, edge: 0, pass: 0 };
  for (let s = 1; s <= 400; s++) for (const e of logic.events(s)) tot[e.kind]++;
  for (const k of logic.KINDS) near(tot[k] / 400, logic.LMAX[k] * logic.HOURS, 0.06 * logic.LMAX[k] * logic.HOURS, k);
  // the same seed gives the same drops whatever else changes: the zone and the tether only change outcomes
  const open = D({ seed: 5 }), closed = D({ seed: 5, zone: 'closed' }), tied = D({ seed: 5, tether: true });
  assert.deepEqual(open.drops.map((d) => d.t), closed.drops.map((d) => d.t));
  assert.deepEqual(open.drops.map((d) => d.t), tied.drops.map((d) => d.t));
});

test('rule 6: a platform or a lift drops fewer from the hand, a subset of the ladder\'s', () => {
  const lad = D({ seed: 2 }), plat = D({ seed: 2, access: 'platform' }), lift = D({ seed: 2, access: 'lift' });
  const lt = new Set(lad.drops.map((d) => d.t));
  assert.ok(plat.drops.every((d) => lt.has(d.t)), 'platform drops are among the ladder\'s');
  assert.ok(plat.byKind.hand < lad.byKind.hand);
  assert.equal(plat.byKind.edge, lad.byKind.edge);
  assert.equal(plat.byKind.pass, lad.byKind.pass);
  assert.deepEqual(plat.drops.map((d) => d.t), lift.drops.map((d) => d.t), 'platform and lift drop alike');
});

test('rule 7: the tether catches hand drops; the toe board stops edge drops off a platform or lift; hand-ups are never stopped', () => {
  assert.equal(logic.stopper('hand', logic.clean({ tether: true })), 'tether');
  assert.equal(logic.stopper('hand', logic.clean({ tether: false, access: 'lift' })), null);
  assert.equal(logic.stopper('edge', logic.clean({ access: 'ladder', tether: true })), null);
  assert.equal(logic.stopper('edge', logic.clean({ access: 'platform' })), 'toeboard');
  assert.equal(logic.stopper('edge', logic.clean({ access: 'lift' })), 'toeboard');
  for (const access of logic.ACCESS_IDS) assert.equal(logic.stopper('pass', logic.clean({ access, tether: true })), null);
  const s = D({ access: 'platform', tether: true });
  assert.equal(s.counts.caught, s.byKind.hand);
  assert.equal(s.counts.stopped, s.byKind.edge);
  assert.equal(s.counts.landed, s.byKind.pass);
  assert.ok(s.drops.every((d) => d.stop || d.kind === 'pass'));
  assert.equal(s.counts.dropped, s.counts.caught + s.counts.stopped + s.counts.landed);
});

test('rule 8: landings lie within R(h) = 0.5 + 0.3·h of the point below', () => {
  near(logic.landR(6), 2.3);
  near(logic.landR(2), 1.1);
  for (const height of [2, 6, 10]) {
    const s = D({ height, seed: 7 });
    for (const d of s.drops) {
      assert.ok(d.d <= s.landR + 1e-12);
      near(Math.hypot(d.x, d.y), d.d, 1e-9);
    }
  }
  // the direction is 2π·a of the event's own draw
  const evs = logic.events(7).filter((e) => logic.happens(e, 'ladder'));
  const s7 = D({ seed: 7, height: 6 });
  evs.forEach((e, i) => {
    near(s7.drops[i].x, s7.drops[i].d * Math.cos(2 * Math.PI * e.a), 1e-9);
    near(s7.drops[i].y, s7.drops[i].d * Math.sin(2 * Math.PI * e.a), 1e-9);
  });
  // the same drop lands proportionally farther from higher up
  const lo = D({ height: 2, seed: 7 }), hi = D({ height: 10, seed: 7 });
  near(hi.drops[0].d / lo.drops[0].d, logic.landR(10) / logic.landR(2), 1e-9);
});

test('rule 10: a closed zone covering the circle leaves no hits; an open one takes the share; tape halves inside', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const closed = D({ seed, zone: 'closed', zoneR: 3 });
    assert.equal(closed.counts.hits, 0, `seed ${seed}`);
    assert.ok(closed.drops.every((d) => d.stop || d.inside));
  }
  const p = logic.clean({ zone: 'taped', zoneR: 2 });
  assert.equal(logic.zoneFactor(1, p), 0.5);
  assert.equal(logic.zoneFactor(2.5, p), 1);
  assert.equal(logic.zoneFactor(1, logic.clean({ zone: 'closed', zoneR: 2 })), 0);
  assert.equal(logic.zoneFactor(2.5, logic.clean({ zone: 'closed', zoneR: 2 })), 1, 'outside the tape, people walk right up to it');
  assert.equal(logic.zoneFactor(0, logic.clean({ zone: 'open' })), 1);
  // the hits of a too-small closed zone all land outside it
  const small = D({ zone: 'closed', zoneR: 1.5 });
  assert.ok(small.counts.hits > 0);
  assert.ok(small.drops.filter((d) => d.hit).every((d) => d.d > 1.5 && !d.inside));
  assert.ok(small.drops.some((d) => d.inside) && small.drops.filter((d) => d.inside).every((d) => d.d <= 1.5));
  assert.ok(D({}).drops.every((d) => !d.inside), 'an open zone has no inside');
  // the shares, exactly
  assert.deepEqual(logic.SHARE, { few: 0.05, busy: 0.2, through: 0.4 });
  near(logic.expected(logic.clean({ traffic: 'few' })), 20 * 2.25 * 0.05);
  // traffic: more people below, at least as many hits on the same week
  for (let seed = 1; seed <= 10; seed++) {
    const f = D({ seed, traffic: 'few' }).counts.hits, b = D({ seed, traffic: 'busy' }).counts.hits, t = D({ seed, traffic: 'through' }).counts.hits;
    assert.ok(f <= b && b <= t, `seed ${seed}: ${f} ${b} ${t}`);
  }
});

test('rule 11: expected hits, and the seeded average approaches it', () => {
  near(logic.expected(logic.clean({})), 9.0);
  near(logic.expected(logic.clean({ zone: 'closed', zoneR: 3 })), 0);
  near(logic.expected(logic.clean({ zone: 'closed', zoneR: 1.5 })), 9 * (1 - (1.5 / 2.3) ** 2));
  near(logic.expected(logic.clean({ zone: 'taped', zoneR: 3 })), 4.5);
  near(logic.expected(logic.clean({ access: 'platform', tether: true })), 1.0);
  near(logic.expected(logic.clean({ access: 'lift' })), 20 * 1.25 * 0.2, 1e-9, 'the toe board stops edge drops');
  near(logic.expected(logic.clean({ traffic: 'through' })), 18);
  for (const over of [{}, { zone: 'closed', zoneR: 1.5 }, { zone: 'taped', zoneR: 2, height: 8 }, { access: 'platform' }]) {
    let tot = 0;
    for (let seed = 1; seed <= 99; seed++) tot += D(Object.assign({ seed }, over)).counts.hits;
    const ex = logic.expected(logic.clean(over));
    near(tot / 99, ex, 0.25 * ex + 0.3, JSON.stringify(over));
  }
});

test('rule 12: params are cleaned: unknown ids, out-of-range numbers, snapping, the seed', () => {
  const q = logic.clean({ access: 'crane', item: 'piano', traffic: 'x', zone: 'y', height: 99, zoneR: -3, seed: 0, tether: 'yes', trained: 0 });
  assert.equal(q.access, 'ladder');
  assert.equal(q.item, 'clamp');
  assert.equal(q.traffic, 'busy');
  assert.equal(q.zone, 'open');
  assert.equal(q.height, 10);
  assert.equal(q.zoneR, 1);
  assert.equal(q.seed, 1);
  assert.equal(q.tether, false);
  assert.equal(q.trained, true, 'only false switches training off');
  assert.equal(logic.clean({ height: 6.3 }).height, 6.5);
  assert.equal(logic.clean({ seed: 2.5 }).seed, 1);
  assert.equal(logic.clean({ seed: 100 }).seed, 1);
  assert.deepEqual(logic.nextSeed({ seed: 99 }), { seed: 1 });
  assert.deepEqual(logic.nextSeed({ seed: 4 }), { seed: 5 });
  assert.equal(logic.clean({ trained: false }).trained, false);
  const nan = logic.clean({ height: 'high', zoneR: NaN });
  assert.equal(nan.height, logic.defaults.height, 'not a number: the default, not the minimum');
  assert.equal(nan.zoneR, logic.defaults.zoneR);
  assert.equal(logic.clean({ tether: true }).tether, true);
});

test('rule 11: each event falls in one of the five days of four hours', () => {
  assert.equal(logic.DAYS, 5);
  assert.equal(logic.dayOf(0), 0);
  assert.equal(logic.dayOf(3.999), 0);
  assert.equal(logic.dayOf(4), 1, 'a day boundary starts the next day');
  assert.equal(logic.dayOf(19.999), 4);
  assert.equal(logic.dayOf(20), 4, 'capped at the last day');
  for (const d of D({ seed: 9 }).drops) assert.equal(d.day, Math.floor(d.t / 4));
});

test('preset params are those of SPEC.md', () => {
  const want = {
    ladder: {}, zone: { zone: 'closed', zoneR: 3 }, small: { zone: 'closed', zoneR: 1.5 }, taped: { zone: 'taped', zoneR: 3 },
    layers: { access: 'platform', tether: true }, low: { height: 2 }
  };
  for (const x of logic.presets) assert.deepEqual(x.params, P(want[x.id]), x.id);
  assert.deepEqual(logic.defaults, { access: 'ladder', trained: true, item: 'clamp', height: 6, traffic: 'busy', zone: 'open', zoneR: 3, tether: false, seed: 1 });
});

test('presets match SPEC.md: energy, expected hits and the seed-1 counts', () => {
  const want = {
    ladder: { e: 58.86, x: 9, c: { dropped: 49, landed: 49, hits: 6 } },
    zone: { e: 58.86, x: 0, c: { dropped: 49, landed: 49, hits: 0 } },
    small: { e: 58.86, x: 5.172, c: { dropped: 49, landed: 49, hits: 3 } },
    taped: { e: 58.86, x: 4.5, c: { dropped: 49, landed: 49, hits: 3 } },
    layers: { e: 58.86, x: 1, c: { dropped: 41, caught: 20, stopped: 12, landed: 9, hits: 3 } },
    low: { e: 19.62, x: 9, c: { dropped: 49, landed: 49, hits: 6 } }
  };
  assert.deepEqual(logic.presets.map((x) => x.id), Object.keys(want));
  for (const x of logic.presets) {
    const s = logic.derive(x.params), w = want[x.id];
    near(s.energy, w.e, 1e-9, x.id);
    near(s.expected, w.x, 1e-3, x.id);
    for (const k of Object.keys(w.c)) assert.equal(s.counts[k], w.c[k], `${x.id} ${k}`);
  }
  near(D(preset('low')).fall, 1569.6);
});

// ── generic checks every sim keeps ──

/** A spread of params: every choice, and every preset. */
function* someParams() {
  for (const access of logic.ACCESS_IDS) for (const item of logic.ITEM_IDS) for (const zone of logic.ZONE_IDS)
    for (const traffic of logic.TRAFFIC_IDS) for (const tether of [false, true])
      yield P({ access, item, zone, traffic, tether, height: 7.5, zoneR: 2, seed: 11 });
  yield P({ trained: false });
  for (const x of logic.presets) yield x.params;
}

test('state is JSON-safe over the whole spread', () => {
  for (const p of someParams()) {
    const s = logic.initial(p);
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
    assert.ok(isFinite(s.energy) && isFinite(s.expected) && isFinite(s.fall));
  }
});

test('the model is deterministic and does not mutate its params', () => {
  const p = P({ access: 'lift', zone: 'taped', tether: true, seed: 42 });
  const copy = structuredClone(p);
  assert.deepEqual(logic.initial(p), logic.initial(p));
  assert.deepEqual(p, copy);
  assert.equal(kit.stepsOf(logic, p), 0, 'explorer: no steps');
});

test('mulberry32 matches the kit\'s Simdeck.rng', () => {
  const a = logic.rng(12345), b = kit.rng(12345);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
});

test('both languages: same keys, plural forms and placeholders; every [[term]] in the glossary', () => {
  assert.deepEqual(kit.checkStrings(strings, { glossary: kit.glossaryIndex(glossary) }), []);
});

test('every preset is valid for the model and named in both tables; the page is an explorer', () => {
  for (const x of logic.presets) {
    assert.deepEqual(Object.keys(x.params).sort(), Object.keys(logic.defaults).sort(), x.id);
    assert.deepEqual(logic.clean(x.params), x.params, x.id + ' is already clean');
    for (const lang of ['hr', 'en']) {
      assert.ok(strings[lang]['preset_' + x.id], `${lang} name of ${x.id}`);
      assert.ok(strings[lang]['hint_' + x.id], `${lang} hint of ${x.id}`);
    }
  }
  for (const lang of ['hr', 'en']) {
    for (const k of logic.ACCESS_IDS) for (const pre of ['access_', 'blocked_', 'fallStop_']) assert.ok(strings[lang][pre + k], `${lang} ${pre}${k}`);
    for (const k of logic.ITEM_IDS) assert.ok(strings[lang]['item_' + k]);
    for (const k of logic.TRAFFIC_IDS) assert.ok(strings[lang]['traffic_' + k]);
    for (const k of logic.ZONE_IDS) assert.ok(strings[lang]['zone_' + k]);
    for (const b of [0, 1, 2]) assert.ok(strings[lang]['band_' + b]);
  }
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  assert.equal(meta.steps, undefined);
});
