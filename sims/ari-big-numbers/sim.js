/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ari-big-numbers: numbers to a million (SPEC.md). Three demos of one idea, the place-value table of classes
   of three: counting over the edge (every 9 turns to 0 and carries once), reading a number by its classes, comparing
   two numbers from the highest place down. Plus the number line that zooms with each demo.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Words are tokens (keys into strings.js).
   digitsOf and parseNumber are from sims/ari-times-ten/sim.js @ ef865ee (itself from ari-place-value; not in models/
   yet; COMMON.md §6), base 10 only here, 0 allowed. The number line is numberline.js (from ari-constant-difference).
   The page loads this as a classic script (window.SimLogic) after numberline.js; node tests require() it. */
(function (root) {
  'use strict';

  var NL = typeof module === 'object' && module.exports ? require('./numberline.js') : root.SimdeckModels['number-line'];

  var MAX = 1000000;          // grade 4 counts to a million (MAT OŠ A.4.1)
  var PLACES = 7;             // M ST DT T S D J
  var MODES = ['count', 'read', 'compare'];
  var DIRS = ['on', 'back'];
  var MAX_COUNT = 10;
  var MAX_E = 5;

  // ── from sims/ari-times-ten/sim.js @ ef865ee (base 10 here) ──
  /** Digits of a non-negative integer v, ones first. 0 is [0]. */
  function digitsOf(v) {
    var out = [], x = Math.floor(Math.abs(v));
    do { out.push(x % 10); x = Math.floor(x / 10); } while (x > 0);
    return out;
  }
  /** Read a typed number: { value } or { error: 'empty'|'digit'|'max', at }. Any whitespace is ignored (a number may
      be typed in classes: 345 678). Changed here: base 10 only, 0 is allowed. */
  function parseNumber(text) {
    var s = String(text == null ? '' : text).replace(/\s+/g, '');
    if (!s) return { error: 'empty', at: '' };
    var v = 0;
    for (var i = 0; i < s.length; i++) {
      var d = '0123456789'.indexOf(s[i]);
      if (d < 0) return { error: 'digit', at: s[i] };
      v = v * 10 + d;
      if (v > MAX) return { error: 'max', at: s };
    }
    return { value: v };
  }
  // ── end of the copy ──

  function round(v, lo, hi, dflt) {
    var x = Math.round(Number(v));
    if (v === '' || v == null || typeof v === 'boolean' || !isFinite(x)) return dflt;
    return Math.min(hi, Math.max(lo, x));
  }

  var defaults = { mode: 'count', n: 99997, m: 345687, e: 0, dir: 'on', count: 5, mistake: false };

  /** The params, whole and in range (SPEC "Params"). */
  function numbersOf(p) {
    var e = round(p.e, 0, MAX_E, 0);
    return {
      mode: MODES.indexOf(p.mode) >= 0 ? p.mode : 'count',
      n: round(p.n, 0, MAX, defaults.n),
      m: round(p.m, 0, MAX, defaults.m),
      e: e, by: Math.pow(10, e),
      dir: DIRS.indexOf(p.dir) >= 0 ? p.dir : 'on',
      count: round(p.count, 1, MAX_COUNT, defaults.count),
      mistake: p.mistake === true || p.mistake === 'true' || p.mistake === 1
    };
  }

  // ── count (rules 1–5) ──

  /** One count from v by 10^e (rules 1–3): { from, to, rolled: [places], grew, carries: [places] }. rolled are the
      places that turned 9 → 0 (on) or 0 → 9 (back), from e up; grew the place that grew (shrank) by 1; carries the
      places that received a carry (on) or lent one (back): e + 1 … grew. Assumes the result is in range. */
  function changeOf(v, e, dir) {
    var ds = digitsOf(v), rolled = [], k = e;
    var full = dir === 'on' ? 9 : 0;
    while (k < ds.length && ds[k] === full) { rolled.push(k); k++; }
    var by = Math.pow(10, e);
    var carries = [];
    for (var c = e + 1; c <= k; c++) carries.push(c);
    return { from: v, to: dir === 'on' ? v + by : v - by, rolled: rolled, grew: k, carries: carries };
  }

  /** The whole count demo: values (start and every count), changes, fit, end (rule 4), states. */
  function countOf(p) {
    var x = numbersOf(p), by = x.by;
    var room = x.dir === 'on' ? Math.floor((MAX - x.n) / by) : Math.floor(x.n / by);
    var fit = Math.min(x.count, room);
    var values = [x.n], changes = [], states = [{ phase: 'start', i: 0, k: null }];
    for (var i = 1; i <= fit; i++) {
      var ch = changeOf(values[i - 1], x.e, x.dir);
      changes.push(ch);
      values.push(ch.to);
      states.push({ phase: 'count', i: i, k: null });
    }
    var end = fit < x.count;
    if (end) states.push({ phase: 'end', i: fit, k: null });
    return { mode: 'count', n: x.n, e: x.e, by: by, dir: x.dir, count: x.count, values: values, changes: changes,
      fit: fit, end: end, states: states, steps: states.length - 1 };
  }

  // ── read (rules 6–9) ──

  /** Classes from the right (rule 6): [{ c, value, digits: [ones first, as many as written] }], the highest first. */
  function classesOf(n) {
    var ds = digitsOf(n), out = [];
    for (var c = 0; c * 3 < ds.length; c++) {
      var part = ds.slice(c * 3, c * 3 + 3);
      out.unshift({ c: c, value: part.reduce(function (s, d, i) { return s + d * Math.pow(10, i); }, 0), digits: part });
    }
    return out;
  }

  /** Words of a number 1…999 (tokens). fem: 1 and 2 as feminine (the thousands class, hr). */
  function threeOf(v, lang, fem) {
    var out = [], h = Math.floor(v / 100), r = v % 100, t = Math.floor(r / 10), u = r % 10;
    if (lang === 'en') {
      if (h) out.push('u' + h, 'hundred');
      if (h && r) out.push('and');
      if (r >= 10 && r <= 19) out.push('e' + r);
      else if (t && u) out.push('t' + t, '-', 'u' + u);
      else if (t) out.push('t' + t);
      else if (u) out.push('u' + u);
      return out;
    }
    if (h) out.push('h' + h);
    if (r >= 10 && r <= 19) out.push('e' + r);
    else {
      if (t) out.push('t' + t);
      if (u) out.push(fem && u <= 2 ? 'f' + u : 'u' + u);
    }
    return out;
  }

  /** The plural form of a Croatian count: 0 (1, 21 …), 1 (2–4, 22–24 …), 2 (5+, 11–14). As the kit's pluralIndex. */
  function hrForm(v) {
    if (v % 10 === 1 && v % 100 !== 11) return 0;
    if (v % 10 >= 2 && v % 10 <= 4 && (v % 100 < 12 || v % 100 > 14)) return 1;
    return 2;
  }

  /** The words of one class (rule 7, 8): tokens, empty for 000. c = 0 ones, 1 thousands, 2 millions. */
  function classWordsOf(value, c, lang) {
    if (!value) return [];
    if (c === 0) return threeOf(value, lang, false);
    var name = c === 1 ? 'k' : 'm';
    if (value === 1) return [c === 1 ? 'k1' : 'm1'];               // tisuću / one thousand; milijun / one million
    if (lang === 'en') return threeOf(value, lang, false).concat([name + 'C']);
    return threeOf(value, lang, c === 1).concat([name + 'ABC'[hrForm(value)]]);
  }

  /** The whole number in words (rule 7, 8): tokens. '-' joins two tokens with a hyphen (en forty-five). */
  function wordsOf(n, lang) {
    if (n === 0) return ['zero'];
    var cls = classesOf(n), out = [];
    cls.forEach(function (k, i) {
      var w = classWordsOf(k.value, k.c, lang);
      // en: "thirty thousand and five": "and" before a ones class under 100 that follows a higher class
      if (lang === 'en' && k.c === 0 && i > 0 && k.value > 0 && k.value < 100) out.push('and');
      out = out.concat(w);
    });
    return out;
  }

  function readOf(p) {
    var x = numbersOf(p), cls = classesOf(x.n);
    var states = [{ phase: 'digits', i: 0, k: null }, { phase: 'classes', i: 1, k: null }];
    cls.forEach(function (k, j) { states.push({ phase: 'class', i: j + 2, k: k.c }); });
    states.push({ phase: 'words', i: cls.length + 2, k: null });
    return { mode: 'read', n: x.n, classes: cls, states: states, steps: states.length - 1 };
  }

  // ── compare (rules 10–14) ──

  function compareOf(p) {
    var x = numbersOf(p), a = x.n, b = x.m;
    var da = digitsOf(a), db = digitsOf(b);
    var top = Math.max(da.length, db.length) - 1;
    var places = [], decide = null, verdict = '=';
    var states = [{ phase: 'start', i: 0, k: top }];
    for (var k = top; k >= 0; k--) {
      var ya = da[k] || 0, yb = db[k] || 0;                  // rule 10: no digit counts as 0
      places.push({ k: k, a: ya, b: yb });
      states.push({ phase: 'place', i: places.length, k: k });
      if (ya !== yb) { decide = k; verdict = ya < yb ? '<' : '>'; break; }   // rule 12
    }
    states.push({ phase: 'verdict', i: places.length + 1, k: decide == null ? 0 : decide });
    return { mode: 'compare', a: a, b: b, top: top, places: places, decide: decide, verdict: verdict,
      states: states, steps: states.length - 1 };
  }

  function demoOf(p) {
    var mode = numbersOf(p).mode;
    return mode === 'read' ? readOf(p) : mode === 'compare' ? compareOf(p) : countOf(p);
  }

  // ── the number line (rules 15–17) ──

  /** The stretch of length U (a power of ten) that holds v; over a million: the whole line; past it: slid left. */
  function stretchOf(v, U) {
    if (U >= MAX) return { lo: 0, hi: MAX, step: MAX / 10 };
    var lo = Math.floor(v / U) * U;
    if (lo + U > MAX) lo = MAX - U;
    return { lo: lo, hi: lo + U, step: U / 10 };
  }
  function withMinor(v) { return { lo: v.lo, hi: v.hi, step: v.step, minor: NL.minorStep(v.step) }; }

  /** The line at a state: { view: { lo, hi, step, minor }, points: [{ v, role }] }. role: 'now' (count, read),
      'done' (count, a count before), 'a', 'b' (compare). */
  function lineOf(p, s) {
    var D = demoOf(p);
    if (D.mode === 'count') {
      // one count wider on each side where that stays in the range, so every tick is a count (n + j · by)
      var mn = Math.min.apply(null, D.values), mx = Math.max.apply(null, D.values);
      var lo = mn - D.by >= 0 ? mn - D.by : mn;
      var hi = mx + D.by <= MAX ? mx + D.by : mx;
      var i = s.phase === 'start' ? 0 : s.i;
      var pts = D.values.slice(0, i + 1).map(function (v, j) { return { v: v, role: j === i ? 'now' : 'done' }; });
      return { view: { lo: lo, hi: hi, step: D.by, minor: 0 }, points: pts };
    }
    if (D.mode === 'read') {
      var n = D.n, v = { lo: 0, hi: MAX, step: MAX / 10 }, at = n;
      if (s.phase === 'class' && s.k >= 1) {
        v = stretchOf(n, Math.pow(1000, s.k + 1));
        at = Math.floor(n / Math.pow(1000, s.k)) * Math.pow(1000, s.k);
      } else if (s.phase === 'class' || s.phase === 'words') {
        v = stretchOf(n, 1000);
      }
      return { view: withMinor(v), points: [{ v: at, role: 'now' }] };
    }
    var k = s.k == null ? D.top : s.k;
    return { view: withMinor(stretchOf(D.a, Math.pow(10, k + 1))), points: [{ v: D.a, role: 'a' }, { v: D.b, role: 'b' }] };
  }

  // ── the typical mistakes (SPEC "Typical mistakes") ──

  /** { applies, reason, … } for the mode of p. count: { at (the count index, 1-based), right, wrong }; read:
      { groups: ['300', '05'], wrong }; compare: { wrong ('<' | '>'), k (the place the pupil compared, from the left) }. */
  function mistakeOf(p) {
    var D = demoOf(p), out = { mode: D.mode, applies: false, reason: null };
    if (D.mode === 'count') {
      var idx = -1;
      D.changes.forEach(function (ch, j) { if (idx < 0 && ch.carries.length) idx = j; });
      if (idx < 0) { out.reason = D.dir === 'on' ? 'nocarry' : 'noborrow'; return out; }
      var ch = D.changes[idx];
      out.applies = true;
      out.at = idx + 1;
      out.from = ch.from;
      out.right = ch.to;
      if (D.dir === 'on') {
        // the 10 written in the square of place e: the digits above e stay, then "10", then the digits below e
        var hiPart = Math.floor(ch.from / Math.pow(10, D.e + 1)), loPart = ch.from % D.by;
        out.wrong = Number((hiPart ? String(hiPart) : '') + '10' + (D.e ? String(loPart + D.by).slice(1) : ''));
      } else {
        // the borrow is lost: the rolled 0s turn to 9, the place that should lend keeps its digit
        var ds = digitsOf(ch.from);
        ch.rolled.forEach(function (k) { ds[k] = 9; });
        out.wrong = ds.reduce(function (s, d, i) { return s + d * Math.pow(10, i); }, 0);
      }
      // tie-break: 9 + 1 with nothing on the left is written 10 either way: nothing to see
      if (out.wrong === out.right) { out.applies = false; out.reason = 'same'; }
      return out;
    }
    if (D.mode === 'read') {
      var txt = String(D.n);
      if (txt.length < 4 || txt.length > 5) { out.reason = txt.length < 4 ? 'short' : txt.length === 6 ? 'six' : 'long'; return out; }
      out.applies = true;
      out.groups = [txt.slice(0, 3), txt.slice(3)];
      out.wrong = Number(out.groups[0]) * 1000 + Number(out.groups[1]);
      return out;
    }
    var sa = String(D.a), sb = String(D.b);
    if (sa.length === sb.length) { out.reason = 'same'; return out; }
    for (var j = 0; j < Math.min(sa.length, sb.length); j++) {
      if (sa[j] !== sb[j]) {
        var w = sa[j] < sb[j] ? '<' : '>';
        if (w === D.verdict) { out.reason = 'agrees'; return out; }
        out.applies = true;
        out.wrong = w;
        out.col = j;
        return out;
      }
    }
    out.reason = 'agrees';
    return out;
  }

  var PRESETS = [
    { id: 'over-9999', params: { mode: 'count', n: 9997, e: 0, dir: 'on', count: 5, mistake: false } },
    { id: 'over-99999', params: { mode: 'count', n: 99997, e: 0, dir: 'on', count: 5, mistake: false } },
    { id: 'back-thousands', params: { mode: 'count', n: 102000, e: 3, dir: 'back', count: 5, mistake: true } },
    { id: 'million', params: { mode: 'count', n: 999997, e: 0, dir: 'on', count: 4, mistake: false } },
    { id: 'read', params: { mode: 'read', n: 345678, mistake: false } },
    { id: 'read-zeros', params: { mode: 'read', n: 30005, mistake: true } },
    { id: 'compare', params: { mode: 'compare', n: 345678, m: 345687, mistake: false } },
    { id: 'compare-length', params: { mode: 'compare', n: 9876, m: 12345, mistake: true } }
  ];

  var logic = {
    MAX: MAX, PLACES: PLACES, MODES: MODES, DIRS: DIRS, MAX_COUNT: MAX_COUNT, MAX_E: MAX_E, PRESETS: PRESETS,
    defaults: defaults,
    digitsOf: digitsOf, parseNumber: parseNumber, numbersOf: numbersOf, changeOf: changeOf, countOf: countOf,
    classesOf: classesOf, classWordsOf: classWordsOf, wordsOf: wordsOf, hrForm: hrForm, readOf: readOf,
    compareOf: compareOf, demoOf: demoOf, stretchOf: stretchOf, lineOf: lineOf, mistakeOf: mistakeOf,

    /** count: the counts that fit, plus the end step; read: classes + 2; compare: places compared + 1. */
    steps: function (p) { return demoOf(p).steps; },

    initial: function (p) { var x = demoOf(p || defaults).states[0]; return { phase: x.phase, i: x.i, k: x.k }; },

    /** The state after step n: the demo's n-th state (a plan computed from the params, so replay is exact). */
    step: function (s, n, p) {
      var st = demoOf(p).states;
      var x = st[Math.min(n, st.length - 1)];
      return { phase: x.phase, i: x.i, k: x.k };
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
