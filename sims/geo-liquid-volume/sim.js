/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for geo-liquid-volume: pouring water into a narrower or a wider vessel changes how high it stands, not how
   much there is; two vessels are compared by pouring one into the other; measuring with a cup as the unit, then with
   the litre and the decilitre (1 l = 10 dl). MAT OŠ D.3.4, D.4.1.
   Three modes: two vessels and pouring (pour), a big vessel filled cup by cup (cup), litre bottles filled decilitre
   by decilitre (litre). Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. `vessels` is the reusable part: pure functions over plain numbers,
   no strings. */
(function (root) {
  'use strict';

  var MODES = ['pour', 'cup', 'litre'];

  /** Round vessels seen from the side: frustum segments from the bottom, [height, bottom width, top width] in cm,
      and the capacity in whole dl (SPEC, Vessels). */
  var VESSELS = {
    tall: { cap: 4, seg: [[20, 5, 5]] },
    wide: { cap: 4, seg: [[8, 8, 8]] },
    cup: { cap: 2, seg: [[6, 6, 7]] },
    dl: { cap: 1, seg: [[6, 4.4, 4.8]] },
    vase: { cap: 8, seg: [[4, 5, 9], [6, 9, 9], [5, 9, 3.5], [10, 3.5, 3.5]] },
    bowl: { cap: 9, seg: [[5, 13, 17]] },
    bottle: { cap: 10, seg: [[18, 8, 8], [3, 8, 2.5], [5, 2.5, 2.5]] },
    jug: { cap: 16, seg: [[16.8, 11, 11]] },
    pot: { cap: 30, seg: [[13, 17, 17]] }
  };
  var POUR_IDS = ['tall', 'wide', 'cup', 'vase', 'bowl', 'bottle', 'jug', 'pot'];
  var BIG_IDS = ['bottle', 'jug', 'pot'];
  var UNIT_IDS = ['cup', 'wide', 'dl'];
  var BOTTLES = 5, BOTTLE_DL = 10, DL_MAX = BOTTLES * BOTTLE_DL;
  var SAME_LEVEL = 0.05;

  function int(v, lo, hi, dflt) {
    var n = v === '' || v == null || typeof v === 'boolean' ? NaN : Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }

  var vessels = {
    /** A frustum's volume in cm³. */
    frustum: function (h, a, b) { return Math.PI * h * (a * a + a * b + b * b) / 12; },
    /** The drawn shape's volume in cm³. */
    shapeVolume: function (seg) {
      return seg.reduce(function (t, s) { return t + vessels.frustum(s[0], s[1], s[2]); }, 0);
    },
    height: function (seg) { return seg.reduce(function (t, s) { return t + s[0]; }, 0); },
    /** The widest part, in cm. */
    width: function (seg) { return seg.reduce(function (t, s) { return Math.max(t, s[1], s[2]); }, 0); },

    /** Rule 2: the height (cm) of v dl in a vessel of capacity cap; the shape is scaled to hold cap exactly. */
    level: function (seg, cap, v) {
      if (v <= 0) return 0;
      var G = vessels.shapeVolume(seg);
      if (v >= cap) return vessels.height(seg);
      var target = v / cap * G, y = 0;
      for (var i = 0; i < seg.length; i++) {
        var h = seg[i][0], a = seg[i][1], b = seg[i][2], f = vessels.frustum(h, a, b);
        if (target >= f) { target -= f; y += h; continue; }
        var lo = 0, hi = h;
        for (var k = 0; k < 60; k++) {
          var m = (lo + hi) / 2, w = a + (b - a) * m / h;
          if (vessels.frustum(m, a, w) < target) lo = m; else hi = m;
        }
        return y + (lo + hi) / 2;
      }
      return y;
    },
    /** The width of the vessel at height y (for drawing the water's top). */
    widthAt: function (seg, y) {
      var base = 0;
      for (var i = 0; i < seg.length; i++) {
        var h = seg[i][0];
        if (y <= base + h || i === seg.length - 1) {
          var r = Math.max(0, Math.min(1, (y - base) / h));
          return seg[i][1] + (seg[i][2] - seg[i][1]) * r;
        }
        base += h;
      }
      return 0;
    },

    /** Rule 3: pour from x (amount ax, capacity cx) into y (ay, cy). */
    pour: function (ax, cx, ay, cy) {
      var m = Math.min(ax, cy - ay);
      var refused = ax <= 0 ? 'empty' : ay >= cy ? 'full' : null;
      if (refused) m = 0;
      return {
        moved: m, ax: ax - m, ay: ay + m, refused: refused,
        // rule 5: full into empty decides which holds more (tie-break order: left over, room, same)
        verdict: refused || ax !== cx || ay !== 0 ? null : ax - m > 0 ? 'from' : ay + m < cy ? 'to' : 'same'
      };
    },

    /** Rule 7: measuring a capacity C with a unit of u dl. */
    measure: function (C, u) {
      var full = Math.floor(C / u), rest = C % u;
      return { full: full, rest: rest, exact: rest === 0, kMax: full + (rest ? 1 : 0) };
    },

    /** Rule 10: n dl in litres and decilitres, and the bottles' fills. */
    litres: function (n) {
      var b = [];
      for (var i = 0; i < BOTTLES; i++) b.push(Math.min(BOTTLE_DL, Math.max(0, n - BOTTLE_DL * i)));
      return { l: Math.floor(n / BOTTLE_DL), dl: n % BOTTLE_DL, bottles: b };
    }
  };

  function cap(id) { return VESSELS[id].cap; }
  function lev(id, v) { return vessels.level(VESSELS[id].seg, VESSELS[id].cap, v); }

  var logic = {
    MODES: MODES, VESSELS: VESSELS, POUR_IDS: POUR_IDS, BIG_IDS: BIG_IDS, UNIT_IDS: UNIT_IDS,
    BOTTLES: BOTTLES, BOTTLE_DL: BOTTLE_DL, DL_MAX: DL_MAX, SAME_LEVEL: SAME_LEVEL, vessels: vessels,

    defaults: {
      mode: 'pour', a: 'tall', b: 'wide', fa: 4, fb: 0,
      big: 'jug', unit: 'cup', k: 0,
      dl: 0,
      hide: false
    },

    /** The presets (SPEC, Presets). Keys 1–7. */
    PRESETS: [
      { id: 'same', params: { mode: 'pour', a: 'tall', b: 'wide', fa: 4, fb: 0 } },
      { id: 'which', params: { mode: 'pour', a: 'vase', b: 'bowl', fa: 8, fb: 0, hide: true } },
      { id: 'overflow', params: { mode: 'pour', a: 'jug', b: 'bottle', fa: 16, fb: 0, hide: true } },
      { id: 'cups', params: { mode: 'cup', big: 'jug', unit: 'cup', k: 0, hide: true } },
      { id: 'glasses', params: { mode: 'cup', big: 'pot', unit: 'wide', k: 0 } },
      { id: 'litre', params: { mode: 'litre', dl: 0 } },
      { id: 'l-dl', params: { mode: 'litre', dl: 23, hide: true } }
    ],

    // ── mode 'pour': two vessels ──
    pourState: function (p) {
      var a = pick(p.a, POUR_IDS, 'tall'), b = pick(p.b, POUR_IDS, 'wide');
      var fa = int(p.fa, 0, cap(a), p.fa === undefined ? Math.min(logic.defaults.fa, cap(a)) : 0);
      var fb = int(p.fb, 0, cap(b), 0);
      return {
        a: a, b: b, fa: fa, fb: fb, capA: cap(a), capB: cap(b),
        levelA: lev(a, fa), levelB: lev(b, fb),
        heightA: vessels.height(VESSELS[a].seg), heightB: vessels.height(VESSELS[b].seg),
        total: fa + fb, fullA: fa === cap(a), fullB: fb === cap(b)
      };
    },

    // ── mode 'cup': a big vessel filled with a small one ──
    cupState: function (p) {
      var big = pick(p.big, BIG_IDS, 'jug'), unit = pick(p.unit, UNIT_IDS, 'cup');
      var C = cap(big), u = cap(unit), m = vessels.measure(C, u);
      var k = int(p.k, 0, m.kMax, 0);
      var inBig = Math.min(k * u, C);
      return {
        big: big, unit: unit, k: k, C: C, u: u, full: m.full, rest: m.rest, exact: m.exact, kMax: m.kMax,
        inBig: inBig, level: lev(big, inBig), done: inBig === C,
        // the last unit did not go in completely: what it keeps
        left: k * u - inBig,
        height: vessels.height(VESSELS[big].seg)
      };
    },

    // ── mode 'litre': litre bottles filled by the decilitre ──
    litreState: function (p) {
      var n = int(p.dl, 0, DL_MAX, 0), r = vessels.litres(n);
      return {
        dl: n, l: r.l, rest: r.dl, bottles: r.bottles,
        // rule 11
        wholeLitre: n > 0 && r.dl === 0,
        // rule 13: the parts added
        mixed: r.l > 0 && r.dl > 0
      };
    },

    /** Everything the page shows (an explorer: one state, no steps). */
    initial: function (p) {
      var mode = pick(p.mode, MODES, 'pour');
      var s = mode === 'pour' ? logic.pourState(p) : mode === 'cup' ? logic.cupState(p) : logic.litreState(p);
      s.mode = mode;
      s.hide = p.hide === true;
      return s;
    },

    // ── actions: each returns a params patch and what happened ──

    /** Rules 3–5: pour 'ab' (left into right) or 'ba'. */
    pour: function (p, dir) {
      var s = logic.pourState(p);
      var ab = dir !== 'ba';
      var r = ab ? vessels.pour(s.fa, s.capA, s.fb, s.capB) : vessels.pour(s.fb, s.capB, s.fa, s.capA);
      var x = ab ? s.a : s.b, y = ab ? s.b : s.a;
      var ax = ab ? s.fa : s.fb, ay = ab ? s.fb : s.fa;
      // the layer the poured water made in X, and the layer it makes in Y
      var before = lev(x, ax) - lev(x, ax - r.moved), after = lev(y, ay + r.moved) - lev(y, ay);
      var d = after - before;
      return {
        patch: r.refused ? {} : ab ? { fa: r.ax, fb: r.ay } : { fa: r.ay, fb: r.ax },
        dir: ab ? 'ab' : 'ba', moved: r.moved, refused: r.refused, verdict: r.verdict, left: r.ax,
        // rule 4: the poured water's height in X before and in Y after
        hFrom: before, hTo: after, change: r.moved ? (Math.abs(d) <= SAME_LEVEL ? 'same' : d < 0 ? 'lower' : 'higher') : null
      };
    },
    /** Rule 6. */
    fill: function (p, side) {
      var s = logic.pourState(p);
      return side === 'b' ? { fb: s.capB } : { fa: s.capA };
    },
    empty: function (p, side) { return side === 'b' ? { fb: 0 } : { fa: 0 }; },

    /** Rule 8: one more unit, refused when the big vessel is full. */
    addUnit: function (p) {
      var s = logic.cupState(p);
      return s.done ? { patch: {}, refused: 'done' } : { patch: { k: s.k + 1 }, refused: null };
    },
    fillUp: function (p) { return { k: logic.cupState(p).kMax }; },
    /** Rule 9: a new unit keeps a full big vessel full. */
    setUnit: function (p, unit) {
      var s = logic.cupState(p), u = pick(unit, UNIT_IDS, s.unit);
      var patch = { unit: u };
      patch.k = s.done ? logic.cupState({ big: s.big, unit: u }).kMax : 0;
      return patch;
    },

    /** Rule 10: add d dl (±1, ±10); refused past 0 or 50. */
    addDl: function (p, d) {
      var n = logic.litreState(p).dl, m = n + d;
      return m < 0 || m > DL_MAX ? { patch: {}, refused: 'limit' } : { patch: { dl: m }, refused: null };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
