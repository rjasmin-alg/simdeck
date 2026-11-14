// SPDX-License-Identifier: AGPL-3.0-or-later
// Tests for dat-dice-sums. Run: node --test sims/dat-dice-sums/
// Rules and expected numbers: SPEC.md (checked first with an independent Python script, NOTES.md).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = require('../../kit/kit.js');
const logic = require('./sim.js');
const strings = require('./strings.js');

const D = logic.dice;
const P = (over) => Object.assign({}, logic.defaults, over);
const S = (over) => logic.initial(P(over));
/** A generator that hands out fixed dice values (each draw r() gives (v − 1) / 6 + a little). */
function fixed(values) {
  let i = 0;
  const next = () => (values[i++ % values.length] - 1) / 6 + 0.01;
  next.int = (n) => Math.floor(next() * n);
  return next;
}

// ── tie-breaks first ──

test('rule 5 tie-break: 4 is more likely than 2, 3, 11, 12, less likely than 5 … 9, as likely as 10 (lists increasing)', () => {
  const c = D.compare(4);
  assert.deepEqual(c.more, [2, 3, 11, 12]);
  assert.deepEqual(c.less, [5, 6, 7, 8, 9]);
  assert.deepEqual(c.same, [10]);
  assert.equal(c.most, false);
});

test('rule 5 tie-break: every possible sum is as likely as its mirror 14 − k, and 7 as likely as none', () => {
  for (const k of logic.SUMS) assert.deepEqual(D.compare(k).same, k === 7 ? [] : [14 - k], String(k));
  const c = D.compare(7);
  assert.equal(c.most, true);
  assert.deepEqual(c.more, [2, 3, 4, 5, 6, 8, 9, 10, 11, 12]);
  assert.deepEqual(c.less, []);
});

test('rule 5 tie-break: 7 alone is the most likely; 2 and 12 together the least likely possible sums', () => {
  assert.deepEqual(D.mostLikely(), [7]);
  assert.deepEqual(D.leastLikely(), [2, 12]);
  for (const k of logic.SUMS) assert.equal(D.compare(k).most, k === 7);
});

test('rule 5 tie-break: an impossible sum has no comparison', () => {
  for (const k of [0, 1, 13, 14]) assert.equal(D.compare(k), null);
  assert.equal(S({ mode: 'pairs', k: 1 }).cmp, null);
  assert.equal(S({ mode: 'pairs', ev: 'even' }).cmp, null);
});

test('rule 6 tie-break: the most frequent sums are every sum with the biggest count, increasing; none before a throw', () => {
  const c = Array(15).fill(0);
  assert.deepEqual(D.leaders(c), []);
  c[9] = 3; c[5] = 3; c[7] = 2;
  assert.deepEqual(D.leaders(c), [5, 9]);
  assert.deepEqual(S({ n: 0 }).leaders, []);
});

test('rule 8 tie-break: equal ways and more than 0 is fair; 0 and 0 is no game; else unfair for the one with more', () => {
  const own = (a, b) => { const o = {}; for (const s of logic.SUMS) o[s] = a.includes(s) ? 'a' : b.includes(s) ? 'b' : 'n'; return o; };
  assert.equal(D.fairness(own([7], [2, 3, 11, 12])).verdict, 'fair');
  assert.equal(D.fairness(own([], [])).verdict, 'nogame');
  assert.equal(D.fairness(own([], [])).favours, null);
  const u = D.fairness(own([5, 6, 7, 8, 9], [2, 3, 4, 10, 11, 12]));
  assert.deepEqual([u.a, u.b, u.again, u.verdict, u.favours], [24, 12, 0, 'unfair', 'a']);
  assert.deepEqual(u.sums.a.length < u.sums.b.length, true);  // fewer sums, more ways
  const v = D.fairness(own([6, 7, 8], [2, 3, 4, 5, 9, 10, 11, 12]));
  assert.deepEqual([v.a, v.b, v.favours], [16, 20, 'b']);
  assert.equal(D.fairness(own([7], [])).favours, 'a');
});

test('rule 1 tie-break: unknown choices and non-numbers fall back; numbers round and clamp', () => {
  const s = S({ mode: 'dice', seed: 'x', n: 2000.4 });
  assert.equal(s.mode, 'throw');
  assert.equal(s.seed, 0);
  assert.equal(s.n, 1000);
  const q = S({ mode: 'pairs', ev: 'big', k: -3 });
  assert.deepEqual([q.ev, q.k], ['sum', 0]);
  assert.equal(S({ mode: 'pairs', k: 6.6 }).k, 7);
  assert.equal(S({ mode: 'fair', o5: 'z' }).owners[5], 'b');
  assert.equal(S({ mode: 'fair', o4: 'z' }).owners[4], 'a');
  assert.equal(S({ ways: 'true' }).ways, false);
});

// ── the rules ──

test('rule 2: the generator is the kit\'s mulberry32; the streams of SPEC rule 2', () => {
  const a = D.rng(12345), b = kit.rng(12345);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
  assert.equal(D.stream(1, 0)(), kit.rng(1)());
  assert.deepEqual(D.throws(1, 0, 5), [[4, 1], [4, 6], [6, 2], [4, 5], [3, 6]]);
  assert.deepEqual(D.throws(42, 0, 5), [[4, 3], [6, 5], [2, 4], [2, 4], [6, 3]]);
  assert.deepEqual(D.throws(1, 1, 3), [[2, 5], [6, 1], [4, 4]]);
});

test('rule 2: the model takes any generator (fixed throws)', () => {
  assert.deepEqual(D.throwsFrom(fixed([1, 6, 6, 1, 3, 3]), 3), [[1, 6], [6, 1], [3, 3]]);
  assert.deepEqual(D.throwsFrom(kit.rng(7), 4), D.throws(7, 0, 4));
});

test('rule 2: a throw is two dice 1 … 6; the first n throws do not depend on how many follow', () => {
  const long = D.throws(99, 0, 500);
  for (const [a, b] of long) { assert.ok(a >= 1 && a <= 6); assert.ok(b >= 1 && b <= 6); }
  assert.deepEqual(D.throws(99, 0, 37), long.slice(0, 37));
  assert.notDeepEqual(D.throws(99, 1, 20), D.throws(99, 0, 20));
});

test('rule 3: 36 ordered pairs; ways 1 … 6 … 1 for 2 … 12, 0 outside; 21 unordered pairs with 3 for 7', () => {
  const pairs = D.pairs();
  assert.equal(pairs.length, 36);
  assert.deepEqual(pairs[0], [1, 1]);
  assert.deepEqual(pairs[5], [1, 6]);
  assert.deepEqual(pairs[30], [6, 1]);
  const ways = [];
  for (let s = 0; s <= 14; s++) ways.push(D.ways(s));
  assert.deepEqual(ways, [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0, 0]);
  for (let s = 0; s <= 14; s++) assert.equal(pairs.filter(([a, b]) => a + b === s).length, D.ways(s), String(s));
  assert.equal(ways.reduce((x, y) => x + y), 36);
  assert.equal(D.unordered().length, 21);
  assert.equal(D.unordered().filter(([a, b]) => a + b === 7).length, 3);
});

test('rule 4: events and their kind: sum k, even 18, odd 18, less than 13 certain; 0, 1, 13, 14 impossible', () => {
  assert.deepEqual([D.event('sum', 7).ways, D.event('sum', 7).kind], [6, 'possible']);
  assert.deepEqual([D.event('sum', 2).ways, D.event('sum', 2).kind], [1, 'possible']);
  for (const k of [0, 1, 13, 14]) assert.deepEqual([D.event('sum', k).ways, D.event('sum', k).kind], [0, 'impossible'], String(k));
  assert.equal(D.event('even', 0).ways, 18);
  assert.equal(D.event('odd', 0).ways, 18);
  assert.deepEqual([D.event('lt13', 0).ways, D.event('lt13', 0).kind], [36, 'certain']);
  const even = S({ mode: 'pairs', ev: 'even' });
  assert.deepEqual(even.pairs[even.lit[0]], [1, 1]);
  assert.ok(even.lit.every((i) => (even.pairs[i][0] + even.pairs[i][1]) % 2 === 0));
  const odd = S({ mode: 'pairs', ev: 'odd' });
  assert.deepEqual(odd.pairs[odd.lit[0]], [1, 2]);
  const s = S({ mode: 'pairs', ev: 'sum', k: 7 });
  assert.deepEqual(s.lit.map((i) => s.pairs[i]), [[1, 6], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1]]);
});

test('rule 6: the tally counts the first n throws; the last throw; rows 1 and 13 stay 0', () => {
  const s = S({ seed: 1, n: 5 });
  assert.deepEqual(s.last, [3, 6]);
  assert.deepEqual(s.recent, [5, 10, 8, 9, 9]);
  assert.equal(s.counts[9], 2);
  assert.deepEqual(s.leaders, [9]);
  assert.equal(s.counts.reduce((a, b) => a + b), 5);
  const big = S({ seed: 5, n: 1000 });
  assert.equal(big.counts.reduce((a, b) => a + b), 1000);
  for (const x of [0, 1, 13, 14]) assert.equal(big.counts[x], 0);
  assert.equal(S({ n: 0 }).last, null);
});

test('rule 6: tally marks while the biggest count is at most 40, bars beyond', () => {
  // find a throw count where the biggest count passes 40, for seed 3
  let n = 1;
  while (S({ seed: 3, n }).max <= 40) n++;
  assert.equal(S({ seed: 3, n: n - 1 }).max, 40);
  assert.equal(S({ seed: 3, n: n - 1 }).tally, true);
  assert.equal(S({ seed: 3, n }).tally, false);
});

test('rule 6: more throws go up to 1000 and are refused only at 1000; new throws take the next seed', () => {
  assert.deepEqual(logic.more(P({ n: 950 }), 'n', 100).patch, { n: 1000 });
  assert.equal(logic.more(P({ n: 950 }), 'n', 100).refused, null);
  assert.deepEqual(logic.more(P({ n: 1000 }), 'n', 1), { patch: {}, refused: 'limit' });
  assert.deepEqual(logic.more(P({ n: 3 }), 'n', 10).patch, { n: 13 });
  assert.deepEqual(logic.fresh(P({ seed: 41, n: 7, rn: 3, rr: 10, fn: 5 })), { seed: 42, n: 0, rn: 0, rr: 0, fn: 0 });
  assert.equal(logic.nextSeed(999999), 1);
  assert.equal(logic.nextSeed(0), 1);
});

test('rule 6: over 1000 throws, 7 is most often the most frequent sum (SPEC: 89 % of seeds)', () => {
  let top7 = 0;
  for (let seed = 1; seed <= 200; seed++) { const l = S({ seed, n: 1000 }).leaders; if (l.length === 1 && l[0] === 7) top7++; }
  assert.ok(top7 >= 160 && top7 <= 195, String(top7));
});

test('rule 7: the race: the sum moves its player; first to 10 wins and stops; seeds 1 and 7', () => {
  const r1 = S({ mode: 'race', seed: 1, rn: 100 });
  assert.deepEqual([r1.winner, r1.rn, r1.len, r1.done], [6, 56, 56, true]);
  assert.equal(r1.pos[6], 10);
  assert.equal(r1.pos.reduce((a, b) => a + b), 56);
  assert.equal(r1.pos[1], 0);
  assert.deepEqual([S({ mode: 'race', seed: 7, rn: 100 }).winner, S({ mode: 'race', seed: 7, rn: 100 }).rn], [6, 52]);
  const half = S({ mode: 'race', seed: 1, rn: 20 });
  assert.equal(half.done, false);
  assert.equal(half.winner, -1);
  assert.equal(half.pos.reduce((a, b) => a + b), 20);
  assert.deepEqual(half.last, D.throws(1, 2, 20)[19]);
  // the fixed generator: two 7s and a 2
  assert.deepEqual(D.race(D.throwsFrom(fixed([3, 4, 1, 6, 1, 1]), 3), 100).pos.slice(2, 8), [1, 0, 0, 0, 0, 2]);
});

test('rule 7: race throws stop at the finish (refused after it); to the finish; a race ends within 100 throws', () => {
  const p = P({ mode: 'race', seed: 1, rn: 50 });
  assert.deepEqual(logic.raceMore(p, 10).patch, { rn: 56 });
  assert.deepEqual(logic.raceMore(P({ mode: 'race', seed: 1, rn: 0 }), Infinity).patch, { rn: 56 });
  assert.deepEqual(logic.raceMore(P({ mode: 'race', seed: 1, rn: 56 }), 1), { patch: {}, refused: 'done' });
  for (let seed = 1; seed <= 300; seed++) {
    const n = D.raceLength(seed, logic.SALT.race);
    assert.ok(n >= 10 && n <= 100, String(seed));
  }
});

test('rule 7: many races: winners counted per player; 1 never, 7 most; up to 100 races', () => {
  const s = S({ mode: 'race', seed: 1, rr: 100 });
  assert.equal(s.wins.reduce((a, b) => a + b), 100);
  assert.equal(s.wins[1], 0);
  assert.equal(s.wins[0], 0);
  assert.deepEqual(s.winLeaders, [7]);
  // race j of the winners column is salt 3 + j, not the race shown (salt 2)
  for (const seed of [1, 2, 3]) {
    const w = S({ mode: 'race', seed, rr: 2 }).wins;
    const j0 = D.race(D.throws(seed, 3, 100), 100).winner, j1 = D.race(D.throws(seed, 4, 100), 100).winner;
    const want = Array(13).fill(0); want[j0]++; want[j1]++;
    assert.deepEqual(w, want, String(seed));
  }
  assert.notDeepEqual(D.throws(1, 3, 10), D.throws(1, 2, 10));
  assert.deepEqual(logic.racesMore(P({ rr: 95 }), 10).patch, { rr: 100 });
  assert.equal(logic.racesMore(P({ rr: 100 }), 10).refused, 'limit');
  // SPEC: over 3000 races (salt 2), 7 1253, 6 631, 8 609, 2 and 12 never
  const w = Array(13).fill(0);
  for (let seed = 1; seed <= 3000; seed++) w[D.race(D.throws(seed, logic.SALT.race, 100), 100).winner]++;
  assert.deepEqual([w[1], w[2], w[3], w[6], w[7], w[8], w[11], w[12]], [0, 0, 6, 631, 1253, 609, 4, 0]);
});

test('rule 8: the presets\' ways: parity 18 : 18, unfair 24 : 12, seven 6 : 6; the others of SPEC', () => {
  const f = (id) => S(logic.PRESETS.find((x) => x.id === id).params).fair;
  assert.deepEqual([f('parity').a, f('parity').b, f('parity').verdict], [18, 18, 'fair']);
  assert.deepEqual([f('unfair').a, f('unfair').b, f('unfair').verdict, f('unfair').sums.a.length, f('unfair').sums.b.length], [24, 12, 'unfair', 5, 6]);
  assert.deepEqual([f('seven').a, f('seven').b, f('seven').again, f('seven').verdict], [6, 6, 24, 'fair']);
  const own = (a, b) => { const o = {}; for (const s of logic.SUMS) o[s] = a.includes(s) ? 'a' : b.includes(s) ? 'b' : 'n'; return o; };
  assert.deepEqual([D.fairness(own([2, 3, 4, 5, 6], [8, 9, 10, 11, 12])).a, D.fairness(own([2, 3, 4, 5, 6], [8, 9, 10, 11, 12])).b], [15, 15]);
  assert.deepEqual([D.fairness(own([2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12])).a, D.fairness(own([2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12])).b], [21, 15]);
});

test('rule 8: playing: each throw is a win for its sum\'s owner or again; owners cycle a → b → n → a and the game restarts', () => {
  const s = S({ mode: 'fair', seed: 1, fn: 3 });  // seed 1 salt 1: 7, 7, 8
  assert.deepEqual(s.score, { a: 1, b: 2, n: 0 });
  assert.deepEqual(s.last, [4, 4]);
  const t = S({ mode: 'fair', seed: 4, fn: 1000 });
  assert.equal(t.score.a + t.score.b + t.score.n, 1000);
  assert.deepEqual(logic.cycle(P({ o7: 'b', fn: 9 }), 7), { o7: 'n', fn: 0 });
  assert.deepEqual(logic.cycle(P({ o7: 'n' }), 7), { o7: 'a', fn: 0 });
  assert.deepEqual(logic.cycle(P(), 4), { o4: 'b', fn: 0 });
  assert.deepEqual(logic.cycle(P(), 13), {});
  assert.deepEqual(logic.more(P({ fn: 1000 }), 'fn', 1).refused, 'limit');
});

test('rule 9: ask first is a plain flag; the numbers are still computed', () => {
  const s = S({ mode: 'fair', ways: false });
  assert.equal(s.ways, false);
  assert.equal(s.fair.a, 18);
  assert.equal(S({ ways: true }).ways, true);
});

test('presets: the expected numbers of SPEC, Presets', () => {
  const pr = (id) => S(logic.PRESETS.find((x) => x.id === id).params);
  assert.deepEqual([pr('throw').mode, pr('throw').n, pr('throw').ways], ['throw', 0, false]);
  assert.deepEqual([pr('many').n, pr('many').ways], [1000, true]);
  assert.deepEqual([pr('pairs7').evWays, pr('pairs7').kind, pr('pairs7').cmp.most], [6, 'possible', true]);
  assert.deepEqual([pr('never').evWays, pr('never').kind], [0, 'impossible']);
  assert.deepEqual([pr('race').rn, pr('race').rr, pr('race').pos[1]], [0, 0, 0]);
  assert.equal(logic.PRESETS.length, 8);
});

// ── generic checks every sim keeps ──

test('state is JSON-safe in every mode and preset', () => {
  for (const pr of logic.PRESETS) {
    const s = logic.initial(P(pr.params));
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
  for (const mode of logic.MODES) {
    const s = S({ mode, seed: 9, n: 50, rn: 30, rr: 5, fn: 20 });
    assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
  }
});

test('the model is deterministic and does not mutate its params', () => {
  for (const pr of logic.PRESETS) {
    const p = P(Object.assign({ seed: 17 }, pr.params)), copy = structuredClone(p);
    assert.deepEqual(logic.initial(p), logic.initial(p));
    logic.more(p, 'n', 10); logic.raceMore(p, 10); logic.racesMore(p, 10); logic.fresh(p); logic.cycle(p, 7);
    assert.deepEqual(p, copy);
  }
});

test('an explorer: no steps', () => {
  assert.equal(logic.steps, undefined);
  assert.equal(kit.stepsOf(logic, P()), 0);
});

test('both languages: same keys, plural forms and placeholders', () => {
  assert.deepEqual(kit.checkStrings(strings), []);
  for (const pr of logic.PRESETS) assert.ok(strings.hr['p_' + pr.id] && strings.hr['ph_' + pr.id] && strings.en['p_' + pr.id], pr.id);
  for (const m of logic.MODES) assert.ok(strings.hr['mode_' + m] && strings.en['mode_' + m], m);
  for (const k of ['impossible', 'possible', 'certain']) assert.ok(strings.hr['kind_' + k] && strings.en['kind_' + k], k);
});

test('every preset param is a model param; the page and sim.json agree with the model', () => {
  for (const pr of logic.PRESETS) for (const k of Object.keys(pr.params)) assert.ok(k in logic.defaults, `${pr.id}: ${k}`);
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const meta = JSON.parse(html.match(/<script type="application\/json" id="simdeck-meta">([\s\S]*?)<\/script>/)[1]);
  assert.equal(meta.class, 'explorer');
  const sim = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim.json'), 'utf8'));
  const ids = logic.PRESETS.map((x) => x.id);
  for (const e of sim.entries) assert.ok(ids.includes(e.preset), e.preset);
});
