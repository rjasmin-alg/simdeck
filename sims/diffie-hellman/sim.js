/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for diffie-hellman: a shared secret over a public channel, with paint (colour mixing) and numbers (modular
   arithmetic) side by side. Rules and numbers: SPEC.md.
   Every value carries both forms, { num, paint }: num an integer mod p, paint a mixture of paint ids with counts.
   Alice and Bob each fill five slots (pub, secret, mine, theirs, shared); Eve copies what crosses the wire; with
   `mallory` an active attacker swaps A and B for her own M.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Words live in strings.js. */
(function (root) {
  'use strict';

  var PAINTS = ['Y', 'R', 'T', 'V']; // common (yellow), Alice (red), Bob (teal), Mallory (violet); the fixed order
  var MALLORY_M = 3;                 // Mallory's secret exponent (SPEC.md, preset mallory)

  var PHASES = {
    honest: ['agree', 'alicePick', 'bobPick', 'aliceCompute', 'bobCompute', 'sendA', 'sendB',
      'aliceShared', 'bobShared', 'compare', 'eveView'],
    mallory: ['agree', 'alicePick', 'bobPick', 'aliceCompute', 'bobCompute', 'catchA', 'forgeToBob', 'catchB',
      'forgeToAlice', 'aliceShared', 'bobShared', 'compare', 'malloryView']
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** b^e mod m for small integers, by repeated squaring (exact while m² < 2^53). */
  function powMod(b, e, m) {
    var r = 1 % m;
    b = ((b % m) + m) % m;
    while (e > 0) {
      if (e & 1) r = (r * b) % m;
      b = (b * b) % m;
      e = Math.floor(e / 2);
    }
    return r;
  }

  /** The order of g mod p: the smallest k ≥ 1 with g^k = 1 (rule 7). g must be coprime to p. */
  function order(g, p) {
    var x = g % p, k = 1;
    while (x !== 1) { x = (x * g) % p; k++; }
    return k;
  }

  /** Eve's search (rule 5): try x = 1 … p−2 until g^x mod p = A. Returns { x, tries, space } or x null. */
  function discreteLog(g, A, p) {
    var space = p - 2;
    for (var x = 1; x <= space; x++) if (powMod(g, x, p) === A) return { x: x, tries: x, space: space };
    return { x: null, tries: space, space: space };
  }

  /** Paint: mixing adds the counts (commutative); there is no way back (rule 6). */
  function mix() {
    var out = {};
    for (var i = 0; i < arguments.length; i++) {
      var m = arguments[i];
      PAINTS.forEach(function (id) { if (m[id]) out[id] = (out[id] || 0) + m[id]; });
    }
    var sorted = {};
    PAINTS.forEach(function (id) { if (out[id]) sorted[id] = out[id]; });
    return sorted;
  }
  function samePaint(x, y) { return JSON.stringify(mix(x)) === JSON.stringify(mix(y)); }
  function paint(id) { var o = {}; o[id] = 1; return o; }

  function val(num, pt) { return { num: num, paint: pt }; }
  /** One side's slots: secret (a or b), sent (A or B), received (what arrived), shared (s). p and g are s.pub. */
  function party() { return { secret: null, sent: null, received: null, shared: null }; }

  function clampInt(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(v))); }
  /** The params the model uses, clamped: a and b to 2 … p−2 (the page's ranges do the same). */
  function norm(p) {
    var P = p.p === 97 ? 97 : 23;
    var g = [5, 2, 22].indexOf(p.g) >= 0 ? p.g : 5;
    return { p: P, g: g, a: clampInt(p.a, 2, P - 2), b: clampInt(p.b, 2, P - 2), mallory: !!p.mallory };
  }

  function seen(s, id) { if (s.eve.seen.indexOf(id) < 0) s.eve.seen.push(id); s.changed.push('eve-' + id); }

  var logic = {
    PAINTS: PAINTS,
    MALLORY_M: MALLORY_M,
    PHASES: PHASES,

    defaults: { mode: 'both', p: 23, g: 5, a: 6, b: 15, mallory: false },
    primes: [23, 97],
    gens: [5, 2, 22],

    /** 11 steps honest, 13 with Mallory (SPEC.md "Steps"). */
    steps: function (p) { return logic.phasesOf(p).length; },
    phasesOf: function (p) { return p.mallory ? PHASES.mallory : PHASES.honest; },
    norm: norm,

    initial: function (params) {
      var q = norm(params);
      return {
        phase: 'start',
        p: q.p,
        g: q.g,
        pub: { p: q.p, g: q.g, paint: paint('Y') },   // agreed in the open at step 1; the common paint
        alice: party(),
        bob: party(),
        eve: { seen: [], product: null, search: null, order: null },
        mallory: { active: q.mallory, m: null, M: null, caught: [], aliceSide: null, bobSide: null },
        known: { alice: [], bob: [], mid: [] },   // filled slots per column: pub secret mine theirs shared; mid: m M product search aliceSide bobSide
        wire: null,                                // { what, from, to, caughtBy }: the value crossing in this step
        compare: null,                             // { equal, alice, bob }
        log: [],
        changed: []
      };
    },

    step: function (prev, n, params) {
      var s = clone(prev);
      var q = norm(params);
      var P = q.p, G = q.g;
      var phase = logic.phasesOf(params)[n - 1];
      var A = s.alice, B = s.bob, M = s.mallory;
      s.phase = phase;
      s.changed = [];
      s.wire = null;
      function know(who, id) { if (s.known[who].indexOf(id) < 0) s.known[who].push(id); s.changed.push(who + '-' + id); }

      switch (phase) {
        case 'agree':         // 1. p and g in the open; Eve (or Mallory) copies them (rule 1, 3)
          know('alice', 'pub'); know('bob', 'pub');
          seen(s, 'pub');
          s.wire = { what: 'pub', from: 'alice', to: 'bob', caughtBy: null };
          break;
        case 'alicePick':     // 2. Alice's secret a: never leaves her column
          A.secret = val(q.a, paint('R'));
          know('alice', 'secret');
          break;
        case 'bobPick':       // 3. Bob's secret b
          B.secret = val(q.b, paint('T'));
          know('bob', 'secret');
          break;
        case 'aliceCompute':  // 4. A = g^a mod p; paint: common + red
          A.sent = val(powMod(G, q.a, P), mix(s.pub.paint, A.secret.paint));
          know('alice', 'mine');
          break;
        case 'bobCompute':    // 5. B = g^b mod p
          B.sent = val(powMod(G, q.b, P), mix(s.pub.paint, B.secret.paint));
          know('bob', 'mine');
          break;
        case 'sendA':         // 6. A crosses; Eve copies it
          B.received = clone(A.sent);
          know('bob', 'theirs');
          s.wire = { what: 'A', from: 'alice', to: 'bob', caughtBy: null };
          seen(s, 'A');
          break;
        case 'sendB':         // 7. B crosses; Eve copies it
          A.received = clone(B.sent);
          know('alice', 'theirs');
          s.wire = { what: 'B', from: 'bob', to: 'alice', caughtBy: null };
          seen(s, 'B');
          break;
        case 'catchA':        // 6'. Mallory catches A: Bob gets nothing (rule 8)
          M.caught.push('A');
          s.wire = { what: 'A', from: 'alice', to: 'bob', caughtBy: 'mallory' };
          seen(s, 'A');
          break;
        case 'forgeToBob':    // 7'. Mallory picks m, computes M = g^m, sends it to Bob as if it were A
          M.m = val(MALLORY_M, paint('V'));
          M.M = val(powMod(G, MALLORY_M, P), mix(s.pub.paint, M.m.paint));
          know('mid', 'm'); know('mid', 'M');
          B.received = clone(M.M);
          know('bob', 'theirs');
          s.wire = { what: 'M', from: 'mallory', to: 'bob', caughtBy: null };
          break;
        case 'catchB':        // 8'. Mallory catches B
          M.caught.push('B');
          s.wire = { what: 'B', from: 'bob', to: 'alice', caughtBy: 'mallory' };
          seen(s, 'B');
          break;
        case 'forgeToAlice':  // 9'. Mallory sends M to Alice as if it were B
          A.received = clone(M.M);
          know('alice', 'theirs');
          s.wire = { what: 'M', from: 'mallory', to: 'alice', caughtBy: null };
          break;
        case 'aliceShared':   // 8. s = (what arrived)^a mod p; paint: what arrived + red (rule 2)
          A.shared = val(powMod(A.received.num, q.a, P), mix(A.received.paint, A.secret.paint));
          know('alice', 'shared');
          break;
        case 'bobShared':     // 9. s = (what arrived)^b mod p
          B.shared = val(powMod(B.received.num, q.b, P), mix(B.received.paint, B.secret.paint));
          know('bob', 'shared');
          break;
        case 'compare':       // 10. the sim's view: equal (honest) or different (Mallory, rule 8)
          s.compare = { equal: A.shared.num === B.shared.num && samePaint(A.shared.paint, B.shared.paint),
            equalNum: A.shared.num === B.shared.num, equalPaint: samePaint(A.shared.paint, B.shared.paint) };
          s.changed.push('alice-shared', 'bob-shared');
          break;
        case 'eveView':       // 11. Eve's shortcut (rule 4), her search (rule 5), the order of g (rule 7)
          var prod = val((A.sent.num * B.sent.num) % P, mix(A.sent.paint, B.sent.paint));
          prod.equalsS = prod.num === A.shared.num;
          prod.paintEqualsS = samePaint(prod.paint, A.shared.paint);
          s.eve.product = prod;
          var dl = discreteLog(G, A.sent.num, P);
          dl.s = dl.x === null ? null : powMod(B.sent.num, dl.x, P);
          dl.isA = dl.x === q.a;
          s.eve.search = dl;
          s.eve.order = order(G, P);
          know('mid', 'product'); know('mid', 'search');
          break;
        case 'malloryView':   // 13. Mallory holds both keys: A^m = M^a, B^m = M^b (rule 8)
          M.aliceSide = val(powMod(A.sent.num, MALLORY_M, P), mix(A.sent.paint, M.m.paint));
          M.bobSide = val(powMod(B.sent.num, MALLORY_M, P), mix(B.sent.paint, M.m.paint));
          know('mid', 'aliceSide'); know('mid', 'bobSide');
          break;
      }
      s.log.push(phase);
      return s;
    },

    powMod: powMod,
    order: order,
    discreteLog: discreteLog,
    mix: mix,
    samePaint: samePaint
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
