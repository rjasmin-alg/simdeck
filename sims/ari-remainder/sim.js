/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-remainder: dealing n sweets among d children round by round (SPEC.md).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   A round gives every child one sweet and is dealt only when the bowl has at least d; what is left when it has fewer
   is the remainder. The arithmetic part (numbersOf, dealOf, checkOf, mistakeOf) works on plain values.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var MIN_D = 2, MAX_D = 10, MAX_N = 100;
  var MAX_ROUNDS = 18; // q + 2 steps, at most 20 (a stepper's limit)

  /** The largest n for d children: up to 100, and at most 18 rounds (n ≤ 18 · d + d − 1). */
  function maxN(d) { return Math.min(MAX_N, (MAX_ROUNDS + 1) * d - 1); }

  /** The numbers the params name, whole and in range: d 2 … 10 first, then n 1 … maxN(d). Rounded, as the kit's
      ranges round a URL value (?d=2.6 is 3 children, so n may go to 56). */
  function numbersOf(p) {
    var q = function (v, lo, hi) { var x = Number(v); return isFinite(x) ? Math.min(hi, Math.max(lo, Math.round(x))) : lo; };
    var d = q(p.d, MIN_D, MAX_D);
    return { n: q(p.n, 1, maxN(d)), d: d };
  }

  /** Rule 1: a round is dealt only when everyone gets one (rule 2: exactly d is enough). */
  function canDeal(pile, d) { return pile >= d; }

  /** The whole deal: q rounds, the remainder r, and the bowl before each round and after the last ([n, …, r]). */
  function dealOf(p) {
    var x = numbersOf(p);
    var pile = x.n, piles = [pile], q = 0;
    while (canDeal(pile, x.d)) { pile -= x.d; q++; piles.push(pile); }
    return { n: x.n, d: x.d, q: q, r: pile, piles: piles };
  }

  /** Rule 4: the check of an answer (q, r) for n : d. Both parts must hold. */
  function checkOf(n, d, q, r) {
    var back = q * d + r;
    return { back: back, equal: back === n, less: r < d, ok: back === n && r < d };
  }

  /** Rule 5: the answer that stops one round early, with its check; null when no round was dealt. */
  function mistakeOf(p) {
    var D = dealOf(p);
    if (D.q === 0) return null;
    var q = D.q - 1, r = D.r + D.d;
    return { q: q, r: r, check: checkOf(D.n, D.d, q, r), oneMore: r - D.d };
  }

  function stepsOf(p) { return dealOf(p).q + 2; }

  var PRESETS = [
    { id: 'sweets', params: { n: 23, d: 4 } },
    { id: 'exact', params: { n: 24, d: 4 } },
    { id: 'fewer', params: { n: 3, d: 5 } },
    { id: 'largest', params: { n: 47, d: 6 } },
    { id: 'too-big', params: { n: 31, d: 4, mistake: true } },
    { id: 'hundred', params: { n: 100, d: 7 } }
  ];

  var logic = {
    MIN_D: MIN_D, MAX_D: MAX_D, MAX_N: MAX_N, MAX_ROUNDS: MAX_ROUNDS, PRESETS: PRESETS,
    maxN: maxN, numbersOf: numbersOf, canDeal: canDeal, dealOf: dealOf, checkOf: checkOf, mistakeOf: mistakeOf,

    defaults: { n: 23, d: 4, mistake: false },

    /** q rounds, the round that fails, the check. */
    steps: stepsOf,

    initial: function (p) {
      return { phase: 'start', k: 0, pile: numbersOf(p).n };
    },

    /** From the state before: deal a round while the bowl has at least d, then the failed round, then the check. */
    step: function (s, n, p) {
      var d = numbersOf(p).d;
      if (s.phase === 'start' || s.phase === 'round') {
        if (canDeal(s.pile, d)) return { phase: 'round', k: s.k + 1, pile: s.pile - d };
        return { phase: 'short', k: s.k, pile: s.pile };
      }
      return { phase: 'check', k: s.k, pile: s.pile };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
