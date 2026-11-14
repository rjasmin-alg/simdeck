/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for dat-dice-sums: two dice. An event is certain, possible or impossible; a sum of 7 can happen in 6 ways and
   2 or 12 in one, so 7 comes up most often over many throws, though one throw can give anything; a game is fair when
   each player has as many ways to win. MAT OŠ E.4.2. Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. Randomness comes from a seeded generator (mulberry32, the kit's
   Simdeck.rng, inlined so the model stands alone); throwsFrom() takes any generator. State is plain JSON. The page
   loads this as a classic script (window.SimLogic); node tests require() it. `dice` is the reusable part: pure
   functions over plain numbers, no strings. */
(function (root) {
  'use strict';

  var MODES = ['throw', 'pairs', 'race', 'fair'];
  var EVENTS = ['sum', 'even', 'odd', 'lt13'];
  var OWNERS = ['a', 'b', 'n'];
  var SEED_MAX = 999999;
  var N_MAX = 1000;          // throws (throw mode, fair game)
  var RACE_MAX = 100;        // a race always ends within 100 throws (rule 7)
  var RACES_MAX = 100;       // races in the winners column
  var GOAL = 10;             // the race's finish
  var TALLY_MAX = 40;        // tally marks up to this count, bars beyond (rule 6)
  var SUMS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  var SALT = { throw: 0, fair: 1, race: 2, races: 3 };

  /** mulberry32, the kit's generator: r() -> [0, 1), r.int(n) -> 0 … n − 1 (rule 2). */
  function rng(seed) {
    var a = seed >>> 0;
    var next = function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.int = function (n) { return Math.floor(next() * n); };
    return next;
  }

  function int(v, lo, hi, dflt) {
    var n = v === '' || v == null || typeof v === 'boolean' ? NaN : Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }
  function range(a, b) { var out = []; for (var i = a; i <= b; i++) out.push(i); return out; }

  var dice = {
    rng: rng,
    /** Rule 2: the generator of one stream of throws. */
    stream: function (seed, salt) { return rng(((seed >>> 0) + Math.imul(salt, 0x9E3779B1)) >>> 0); },
    /** Rule 2: n throws [first, second] from any generator with .int(6). */
    throwsFrom: function (gen, n) {
      var out = [];
      for (var i = 0; i < n; i++) { var a = 1 + gen.int(6), b = 1 + gen.int(6); out.push([a, b]); }
      return out;
    },
    throws: function (seed, salt, n) { return dice.throwsFrom(dice.stream(seed, salt), n); },

    /** Rule 3: the 36 ordered pairs, first die down, second across. */
    pairs: function () {
      var out = [];
      for (var a = 1; a <= 6; a++) for (var b = 1; b <= 6; b++) out.push([a, b]);
      return out;
    },
    /** Rule 3: how many pairs give the sum s. */
    ways: function (s) { return s < 2 || s > 12 ? 0 : s <= 7 ? s - 1 : 13 - s; },
    /** Rule 3: the unordered pairs (the typical mistake): 21, and 3 of them for 7. */
    unordered: function () { return dice.pairs().filter(function (p) { return p[0] <= p[1]; }); },

    /** Rule 4: does the pair belong to the event? */
    inEvent: function (ev, k, a, b) {
      var s = a + b;
      if (ev === 'even') return s % 2 === 0;
      if (ev === 'odd') return s % 2 === 1;
      if (ev === 'lt13') return s < 13;
      return s === k;
    },
    /** Rule 4: the pairs of an event (indices 0 … 35 into pairs()), and its kind. */
    event: function (ev, k) {
      var idx = [];
      dice.pairs().forEach(function (p, i) { if (dice.inEvent(ev, k, p[0], p[1])) idx.push(i); });
      return { idx: idx, ways: idx.length, kind: idx.length === 0 ? 'impossible' : idx.length === 36 ? 'certain' : 'possible' };
    },
    /** Rule 5: k against every other possible sum; null when k is impossible. */
    compare: function (k) {
      var w = dice.ways(k);
      if (w === 0) return null;
      var more = [], less = [], same = [];
      SUMS.forEach(function (j) {
        if (j === k) return;
        var x = dice.ways(j);
        if (w > x) more.push(j); else if (w < x) less.push(j); else same.push(j);
      });
      var top = Math.max.apply(null, SUMS.map(dice.ways));
      return { ways: w, more: more, less: less, same: same, most: w === top };
    },
    /** Rule 5: the most likely and the least likely possible sums. */
    mostLikely: function () { var m = Math.max.apply(null, SUMS.map(dice.ways)); return SUMS.filter(function (s) { return dice.ways(s) === m; }); },
    leastLikely: function () { var m = Math.min.apply(null, SUMS.map(dice.ways)); return SUMS.filter(function (s) { return dice.ways(s) === m; }); },

    /** Rule 6: counts of the sums 0 … 14 in a list of throws. */
    tally: function (list) {
      var c = range(0, 14).map(function () { return 0; });
      list.forEach(function (t) { c[t[0] + t[1]]++; });
      return c;
    },
    /** Rule 6: the sums with the biggest count, increasing; none when nothing is counted. */
    leaders: function (counts) {
      var m = Math.max.apply(null, counts);
      if (m <= 0) return [];
      return counts.reduce(function (a, v, s) { if (v === m) a.push(s); return a; }, []);
    },

    /** Rule 7: play a race to the finish (or to `limit` throws) from a list of throws. */
    race: function (list, limit) {
      var pos = range(0, 12).map(function () { return 0; }), winner = -1, n = 0;
      for (var i = 0; i < list.length && i < limit && winner < 0; i++) {
        var s = list[i][0] + list[i][1];
        pos[s]++; n++;
        if (pos[s] >= GOAL) winner = s;
      }
      return { pos: pos, winner: winner, n: n };
    },
    /** Rule 7: how many throws the race of this stream takes to finish. */
    raceLength: function (seed, salt) { return dice.race(dice.throws(seed, salt, RACE_MAX), RACE_MAX).n; },

    /** Rule 8: Ana's, Bruno's and the "again" ways, and the verdict. owners[s] for s = 2 … 12. */
    fairness: function (owners) {
      var w = { a: 0, b: 0, n: 0 }, sums = { a: [], b: [], n: [] };
      SUMS.forEach(function (s) { var o = owners[s]; w[o] += dice.ways(s); sums[o].push(s); });
      var verdict = w.a === w.b ? (w.a > 0 ? 'fair' : 'nogame') : 'unfair';
      return { a: w.a, b: w.b, again: w.n, sums: sums, verdict: verdict, favours: verdict === 'unfair' ? (w.a > w.b ? 'a' : 'b') : null };
    }
  };

  function ownersOf(p) {
    var o = {};
    SUMS.forEach(function (s) { o[s] = pick(p['o' + s], OWNERS, s % 2 === 0 ? 'a' : 'b'); });
    return o;
  }
  function nextSeed(seed) { return (int(seed, 0, SEED_MAX, 0) % SEED_MAX) + 1; }

  var defaults = { mode: 'throw', seed: 0, n: 0, ways: false, ev: 'sum', k: 7, rn: 0, rr: 0, fn: 0 };
  SUMS.forEach(function (s) { defaults['o' + s] = s % 2 === 0 ? 'a' : 'b'; });

  function owners(a, b) {
    var out = {};
    SUMS.forEach(function (s) { out['o' + s] = a.indexOf(s) >= 0 ? 'a' : b.indexOf(s) >= 0 ? 'b' : 'n'; });
    return out;
  }

  var logic = {
    MODES: MODES, EVENTS: EVENTS, OWNERS: OWNERS, SUMS: SUMS, SALT: SALT, GOAL: GOAL,
    SEED_MAX: SEED_MAX, N_MAX: N_MAX, RACE_MAX: RACE_MAX, RACES_MAX: RACES_MAX, TALLY_MAX: TALLY_MAX,
    dice: dice, nextSeed: nextSeed,

    defaults: defaults,

    /** The presets (SPEC, Presets). Keys 1–8. */
    PRESETS: [
      { id: 'throw', params: { mode: 'throw', n: 0, ways: false } },
      { id: 'many', params: { mode: 'throw', n: 1000, ways: true } },
      { id: 'pairs7', params: { mode: 'pairs', ev: 'sum', k: 7 } },
      { id: 'never', params: { mode: 'pairs', ev: 'sum', k: 1 } },
      { id: 'race', params: { mode: 'race', rn: 0, rr: 0, ways: false } },
      { id: 'parity', params: Object.assign({ mode: 'fair', fn: 0, ways: false }, owners([2, 4, 6, 8, 10, 12], [3, 5, 7, 9, 11])) },
      { id: 'unfair', params: Object.assign({ mode: 'fair', fn: 0, ways: false }, owners([5, 6, 7, 8, 9], [2, 3, 4, 10, 11, 12])) },
      { id: 'seven', params: Object.assign({ mode: 'fair', fn: 0, ways: false }, owners([7], [2, 3, 11, 12])) }
    ],

    /** Everything the page shows (an explorer: one state, no steps). Only the current mode's part is computed. */
    initial: function (p) {
      var mode = pick(p.mode, MODES, 'throw');
      var seed = int(p.seed, 0, SEED_MAX, 0);
      var s = { mode: mode, seed: seed, ways: p.ways === true };

      if (mode === 'throw') {
        var n = int(p.n, 0, N_MAX, 0), list = dice.throws(seed, SALT.throw, n), counts = dice.tally(list);
        var max = Math.max.apply(null, counts);
        s.n = n;
        s.counts = counts;
        s.last = n ? list[n - 1] : null;
        s.recent = list.slice(Math.max(0, n - 8)).map(function (t) { return t[0] + t[1]; });
        s.leaders = dice.leaders(counts);
        s.max = max;
        s.tally = max <= TALLY_MAX;
      }

      if (mode === 'pairs') {
        var ev = pick(p.ev, EVENTS, 'sum'), k = int(p.k, 0, 14, 7), e = dice.event(ev, k);
        s.ev = ev; s.k = k;
        s.pairs = dice.pairs();
        s.lit = e.idx; s.evWays = e.ways; s.kind = e.kind;
        s.cmp = ev === 'sum' ? dice.compare(k) : null;
      }

      if (mode === 'race') {
        var full = dice.throws(seed, SALT.race, RACE_MAX), len = dice.race(full, RACE_MAX).n;
        var rn = Math.min(int(p.rn, 0, RACE_MAX, 0), len), r = dice.race(full, rn);
        var rr = int(p.rr, 0, RACES_MAX, 0), wins = range(0, 12).map(function () { return 0; }), lens = [];
        for (var j = 0; j < rr; j++) {
          var rj = dice.race(dice.throws(seed, SALT.races + j, RACE_MAX), RACE_MAX);
          wins[rj.winner]++; lens.push(rj.n);
        }
        s.rn = rn; s.len = len; s.pos = r.pos; s.winner = r.winner; s.done = r.winner >= 0;
        s.last = rn ? full[rn - 1] : null;
        s.rr = rr; s.wins = wins;
        s.winLeaders = rr ? dice.leaders(wins) : [];
      }

      if (mode === 'fair') {
        var own = ownersOf(p), f = dice.fairness(own), fn = int(p.fn, 0, N_MAX, 0);
        var fl = dice.throws(seed, SALT.fair, fn), score = { a: 0, b: 0, n: 0 };
        fl.forEach(function (t) { score[own[t[0] + t[1]]]++; });
        s.owners = own; s.fair = f; s.fn = fn; s.score = score;
        s.last = fn ? fl[fn - 1] : null;
        s.pairs = dice.pairs();
      }
      return s;
    },

    // ── actions: each returns a params patch and what happened ──

    /** Rules 6 and 8: d more throws, up to 1000. key: 'n' (throw mode) or 'fn' (fair game). */
    more: function (p, key, d) {
      var now = int(p[key], 0, N_MAX, 0);
      if (now >= N_MAX) return { patch: {}, refused: 'limit' };
      var to = Math.min(N_MAX, now + d), patch = {}; patch[key] = to;
      return { patch: patch, refused: null, from: now, to: to };
    },
    /** Rule 7: d more race throws, stopping at the finish; d = Infinity runs to the finish. */
    raceMore: function (p, d) {
      var s = logic.initial(Object.assign({}, p, { mode: 'race', rr: 0 }));
      if (s.done) return { patch: {}, refused: 'done' };
      var to = Math.min(s.len, s.rn + d);
      return { patch: { rn: to }, refused: null, from: s.rn, to: to };
    },
    /** Rule 7: d more races in the winners column, up to 100. */
    racesMore: function (p, d) {
      var now = int(p.rr, 0, RACES_MAX, 0);
      if (now >= RACES_MAX) return { patch: {}, refused: 'limit' };
      return { patch: { rr: Math.min(RACES_MAX, now + d) }, refused: null, from: now };
    },
    /** Rules 6 and 7: new throws (the next seed), everything thrown back to 0. */
    fresh: function (p) { return { seed: nextSeed(p.seed), n: 0, rn: 0, rr: 0, fn: 0 }; },
    /** Rule 8: the next owner of sum s (a → b → n → a); the game's throws start again. */
    cycle: function (p, s) {
      if (SUMS.indexOf(s) < 0) return {};
      var o = ownersOf(p)[s], patch = { fn: 0 };
      patch['o' + s] = OWNERS[(OWNERS.indexOf(o) + 1) % OWNERS.length];
      return patch;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
