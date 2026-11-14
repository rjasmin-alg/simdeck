/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for geo-units: a unit is an agreed amount and measuring counts how many fit; 1 cm = 10 mm, 1 dm = 10 cm,
   1 m = 10 dm, 1 km = 1000 m; 1 dag = 10 g, 1 kg = 100 dag, 1 t = 1000 kg; 1 l = 10 dl; a smaller unit gives a
   bigger number; converting moves the digits in a table of units (3 m 4 dm = 34 dm). MAT OŠ D.3.1, D.3.2, D.4.1.
   Three modes: a ruler that zooms, with things measured by laying a unit along them (ruler); a two-pan balance with
   weights (balance); the table of units (table). Rules and expected numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. `units` is the reusable part: pure functions over plain numbers,
   no strings. */
(function (root) {
  'use strict';

  var MODES = ['ruler', 'balance', 'table'];

  /** Units, smallest first, each with its size in the family's smallest unit (SPEC, Units). */
  var FAMILIES = {
    length: [['mm', 1], ['cm', 10], ['dm', 100], ['m', 1000], ['km', 1000000]],
    mass: [['g', 1], ['dag', 10], ['kg', 1000], ['t', 1000000]],
    volume: [['dl', 1], ['l', 10]]
  };
  var RULER_UNITS = ['mm', 'cm', 'dm', 'm', 'km'];
  /** Ruler things, in mm (SPEC, Params). */
  var THINGS = { ant: 5, fingers: 100, pencil: 140, desk: 1200, board: 3400, path: 1000000 };
  var THING_IDS = ['ant', 'fingers', 'pencil', 'desk', 'board', 'path'];
  /** Balance items, in g, with a drawn size (relative width) and a shape. */
  var ITEMS = {
    clip: { g: 1, size: 0.45, shape: 'clip' },
    chocolate: { g: 100, size: 1.0, shape: 'bar' },
    apple: { g: 150, size: 0.8, shape: 'round' },
    pillow: { g: 300, size: 1.6, shape: 'pillow' },
    stone: { g: 800, size: 0.7, shape: 'stone' },
    flour: { g: 1000, size: 1.0, shape: 'bag' },
    bag: { g: 2350, size: 1.3, shape: 'schoolbag' },
    kg1: { g: 1000, size: 0.75, shape: 'weight' },
    dag1: { g: 10, size: 0.4, shape: 'weight' }
  };
  var ITEM_IDS = ['clip', 'chocolate', 'apple', 'pillow', 'stone', 'flour', 'bag', 'kg1', 'dag1'];
  /** The weights, in g: 1 g, 2 g, 5 g, 1 dag, 2 dag, 5 dag, 10 dag, 20 dag, 50 dag, 1 kg, 2 kg, 5 kg. */
  var WEIGHTS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
  var W_MAX = 30;
  /** The ruler's levels (rule 7): 10 m and 100 m are steps of the ruler, not units. */
  var LEVELS = [
    { f: 1, u: 'mm', k: 1, unit: true }, { f: 10, u: 'cm', k: 1, unit: true }, { f: 100, u: 'dm', k: 1, unit: true },
    { f: 1000, u: 'm', k: 1, unit: true }, { f: 10000, u: 'm', k: 10, unit: false }, { f: 100000, u: 'm', k: 100, unit: false },
    { f: 1000000, u: 'km', k: 1, unit: true }
  ];
  var ZOOM_MAX = 40, MARK_MIN = 0.006, FIT = 1.15;
  /** The table's columns, largest first (rule 11): [unit, place within the unit, worth in the smallest unit]. */
  var COLUMNS = {
    length: [['km', 1, 1000000], ['m', 100, 100000], ['m', 10, 10000], ['m', 1, 1000], ['dm', 1, 100], ['cm', 1, 10], ['mm', 1, 1]],
    volume: [['l', 100, 1000], ['l', 10, 100], ['l', 1, 10], ['dl', 1, 1]]
  };
  var TABLE_DEFAULT = { length: { from: 'dm', to: 'm' }, volume: { from: 'l', to: 'dl' } };
  var N_MAX = { km: 9, l: 999 }, N_TOP = 1000, OVER = 1000000;

  function int(v, lo, hi, dflt) {
    var n = v === '' || v == null || typeof v === 'boolean' ? NaN : Math.round(Number(v));
    if (!isFinite(n)) n = dflt;
    return Math.min(hi, Math.max(lo, n));
  }
  function pick(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }

  var units = {
    /** The size of unit u in its family's smallest unit, or 0. */
    size: function (fam, u) {
      var row = FAMILIES[fam].filter(function (r) { return r[0] === u; })[0];
      return row ? row[1] : 0;
    },
    ids: function (fam) { return FAMILIES[fam].map(function (r) { return r[0]; }); },

    /** Rule 3: an amount written largest unit first, zeros left out: [[n, u], …]. `below` limits to smaller units. */
    mixed: function (a, fam, below) {
      var out = [];
      FAMILIES[fam].slice().reverse().forEach(function (r) {
        if (below != null && r[1] >= below) return;
        if (a >= r[1]) { out.push([Math.floor(a / r[1]), r[0]]); a %= r[1]; }
      });
      return out;
    },

    /** Rule 2: how many whole units fit, and what is left. */
    measure: function (a, fam, u) {
      var f = units.size(fam, u), count = Math.floor(a / f), rest = a - count * f;
      return { count: count, rest: rest, exact: rest === 0, less: count === 0, f: f };
    },

    /** Rule 3: the reading of a in u: the count in u, then the rest in the smaller units. */
    reading: function (a, fam, u) {
      var m = units.measure(a, fam, u);
      return (m.count ? [[m.count, u]] : []).concat(units.mixed(m.rest, fam, m.f));
    },

    /** Rule 4 (tie-break): the largest unit in which a is a whole number of at least 1. */
    best: function (a, fam) {
      var rs = FAMILIES[fam];
      for (var i = rs.length - 1; i >= 0; i--) if (a >= rs[i][1] && a % rs[i][1] === 0) return rs[i][0];
      return rs[0][0];
    },

    /** Rule 6: the view's width in mm at a zoom, and the zoom that fits a length (tie-break: the smallest). */
    viewWidth: function (z) { return 12 * Math.pow(10, z / 8); },
    fitZoom: function (len) {
      for (var z = 0; z <= ZOOM_MAX; z++) if (units.viewWidth(z) >= FIT * len) return z;
      return ZOOM_MAX;
    },

    /** Rule 7: the levels with their spacing as a part of the view; the finest mark and the finest unit. */
    scale: function (z) {
      var W = units.viewWidth(z);
      var levels = LEVELS.map(function (l) { return { f: l.f, u: l.u, k: l.k, unit: l.unit, frac: l.f / W }; });
      var fine = levels.filter(function (l) { return l.frac >= MARK_MIN; });
      return {
        W: W, levels: levels,
        fine: fine.length ? fine[0] : levels[levels.length - 1],
        fineUnit: fine.filter(function (l) { return l.unit; })[0] || levels[levels.length - 1]
      };
    },

    /** Rule 9: which pan goes down, and how far the beam turns (+ to the right, − to the left). */
    side: function (mL, mR) { return mL > mR ? 'left' : mR > mL ? 'right' : 'level'; },
    tilt: function (mL, mR) {
      if (mL === mR) return 0;
      var r = Math.abs(mL - mR) / Math.max(mL, mR), a = 3 + 9 * Math.min(1, 5 * r);
      return mR > mL ? a : -a;
    },
    /** Rule 10: the fewest weights for a mass, largest first (exact for 1–2–5 weights). */
    fewest: function (g) {
      var out = [];
      WEIGHTS.slice().reverse().forEach(function (w) { while (g >= w) { out.push(w); g -= w; } });
      return out;
    },
    normWeights: function (w) {
      if (!Array.isArray(w)) return [];
      return w.filter(function (x) { return typeof x === 'number' && WEIGHTS.indexOf(x) >= 0; })
        .slice(0, W_MAX).sort(function (a, b) { return b - a; });
    },

    /** Rule 11: the table of units. */
    nMax: function (fam, u) { return N_MAX[u] || N_TOP; },
    /** The column index of unit u's ones. */
    col: function (fam, u) {
      var cs = COLUMNS[fam];
      for (var i = 0; i < cs.length; i++) if (cs[i][0] === u && cs[i][1] === 1) return i;
      return -1;
    },
    table: function (fam, n, from, to) {
      var cs = COLUMNS[fam];
      n = int(n, 1, units.nMax(fam, from), 1);
      var A = n * units.size(fam, from), ff = units.size(fam, from), ft = units.size(fam, to);
      var digits = cs.map(function (c) { return Math.floor(A / c[2]) % 10; });
      var cFrom = units.col(fam, from), cTo = units.col(fam, to);
      // the leftmost column holding a digit of A (A >= 1, and the last column is worth 1)
      var first = 0;
      while (cs[first][2] > A) first++;
      // shown: the whole table, so every unit can be chosen to read in
      var left = 0, right = cs.length - 1;
      var whole = Math.floor(A / ft), rest = A % ft;
      var zeros = [];
      for (var i = cFrom + 1; i <= cTo; i++) zeros.push(i);
      return {
        fam: fam, n: n, from: from, to: to, amount: A, digits: digits, cols: cs.map(function (c) { return { u: c[0], place: c[1], worth: c[2] }; }),
        cFrom: cFrom, cTo: cTo, first: first, left: left, right: right,
        whole: whole, rest: rest, exact: rest === 0, reading: units.reading(A, fam, to), mixed: units.mixed(A, fam),
        zeros: zeros, steps: Math.abs(cTo - cFrom), factor: ff / ft, dir: ff > ft ? 'smaller' : ff < ft ? 'bigger' : 'same',
        over: whole > OVER,
        // rule 13: one zero for every conversion
        mistake: ff / ft >= 100 ? n * 10 : null
      };
    }
  };

  var logic = {
    MODES: MODES, FAMILIES: FAMILIES, RULER_UNITS: RULER_UNITS, THINGS: THINGS, THING_IDS: THING_IDS,
    ITEMS: ITEMS, ITEM_IDS: ITEM_IDS, WEIGHTS: WEIGHTS, W_MAX: W_MAX, ZOOM_MAX: ZOOM_MAX, MARK_MIN: MARK_MIN,
    COLUMNS: COLUMNS, N_TOP: N_TOP, OVER: OVER, units: units,

    defaults: {
      mode: 'ruler', thing: 'pencil', unit: 'cm', zoom: 10,
      item: 'apple', vs: 'none', w: [],
      qty: 'length', n: 34, from: 'dm', to: 'm',
      hide: false
    },

    /** The presets (SPEC, Presets). Keys 1–8. */
    PRESETS: [
      { id: 'zoom', params: { mode: 'ruler', thing: 'path', unit: 'km', zoom: 40 } },
      { id: 'pencil', params: { mode: 'ruler', thing: 'pencil', unit: 'cm', zoom: 10, hide: true } },
      { id: 'apple', params: { mode: 'balance', item: 'apple', vs: 'none', w: [], hide: true } },
      { id: 'kg-dag', params: { mode: 'balance', item: 'kg1', vs: 'none', w: [500, 200, 200, 100] } },
      { id: 'big-light', params: { mode: 'balance', item: 'pillow', vs: 'stone', w: [] } },
      { id: 'table-m', params: { mode: 'table', qty: 'length', n: 34, from: 'dm', to: 'm', hide: true } },
      { id: 'table-cm', params: { mode: 'table', qty: 'length', n: 3, from: 'm', to: 'cm' } },
      { id: 'table-l', params: { mode: 'table', qty: 'volume', n: 3, from: 'l', to: 'dl', hide: true } }
    ],

    // ── mode 'ruler': things from one 0, a unit laid along the chosen one, a ruler that zooms ──
    ruler: function (p) {
      var thing = pick(p.thing, THING_IDS, 'pencil'), unit = pick(p.unit, RULER_UNITS, 'cm');
      var zoom = int(p.zoom, 0, ZOOM_MAX, units.fitZoom(THINGS[thing]));
      var len = THINGS[thing], m = units.measure(len, 'length', unit), sc = units.scale(zoom);
      return {
        thing: thing, unit: unit, zoom: zoom, len: len, W: sc.W, scale: sc,
        count: m.count, rest: m.rest, exact: m.exact, less: m.less, f: m.f,
        reading: units.reading(len, 'length', unit), best: units.best(len, 'length'),
        // rule 8: bands too narrow to draw
        tooSmall: m.f / sc.W < MARK_MIN,
        fits: units.fitZoom(len),
        things: THING_IDS.map(function (id) { return { id: id, len: THINGS[id], frac: THINGS[id] / sc.W }; })
      };
    },

    // ── mode 'balance': a thing against weights or against another thing ──
    balance: function (p) {
      var item = pick(p.item, ITEM_IDS, 'apple'), vs = pick(p.vs, ['none'].concat(ITEM_IDS), 'none');
      var w = vs === 'none' ? units.normWeights(p.w) : [];
      var mL = ITEMS[item].g, sum = w.reduce(function (t, x) { return t + x; }, 0);
      var mR = vs === 'none' ? sum : ITEMS[vs].g;
      var side = units.side(mL, mR);
      return {
        item: item, vs: vs, w: w, mL: mL, mR: mR, sum: sum, side: side, tilt: units.tilt(mL, mR),
        full: w.length >= W_MAX,
        // rule 10: level with weights: the weights say the item's mass
        weighed: side === 'level' && vs === 'none' && w.length > 0,
        massL: units.mixed(mL, 'mass'), massR: units.mixed(mR, 'mass'), sumMixed: units.mixed(sum, 'mass'),
        fewest: units.fewest(mL),
        bigger: vs !== 'none' ? (ITEMS[item].size > ITEMS[vs].size ? 'left' : ITEMS[vs].size > ITEMS[item].size ? 'right' : 'same') : null
      };
    },

    // ── mode 'table': the table of units ──
    table: function (p) {
      var qty = pick(p.qty, ['length', 'volume'], 'length');
      var ids = units.ids(qty), d = TABLE_DEFAULT[qty];
      var from = pick(p.from, ids, d.from), to = pick(p.to, ids, d.to);
      var s = units.table(qty, int(p.n, 1, N_TOP, logic.defaults.n), from, to);
      s.qty = qty;
      s.units = ids;
      return s;
    },

    /** Everything the page shows (an explorer: one state, no steps). */
    initial: function (p) {
      var mode = pick(p.mode, MODES, 'ruler');
      var s = mode === 'ruler' ? logic.ruler(p) : mode === 'balance' ? logic.balance(p) : logic.table(p);
      s.mode = mode;
      s.hide = p.hide === true;
      return s;
    },

    /** Rule 9: one more weight on the right pan (refused when full: the list comes back unchanged). */
    addWeight: function (w, g) {
      var list = units.normWeights(w);
      if (WEIGHTS.indexOf(g) < 0 || list.length >= W_MAX) return list;
      return units.normWeights(list.concat([g]));
    },
    removeWeight: function (w, g) {
      var list = units.normWeights(w), i = list.indexOf(g);
      if (i >= 0) list.splice(i, 1);
      return list;
    },
    /** The weights in the URL: "w=100.50.5" (grams, largest first). */
    encodeW: function (w) { return units.normWeights(w).join('.'); },
    decodeW: function (s) {
      return units.normWeights(String(s || '').split('.').filter(Boolean).map(Number));
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
