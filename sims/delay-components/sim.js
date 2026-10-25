/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for delay-components: the four kinds of delay of one packet over one hop (source, link 1, router, link 2,
   destination), as the six numbered segments of the URM ch06 figure. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var C = 299792458;                 // m/s, light in vacuum
  var FIBRE_N = 1.468;               // group index (ITU-T G.650.1 §5.4.2.3 c; value typical, SPEC rule 4)
  var COPPER_VF = 0.66;              // velocity factor of copper (SPEC rule 4, check)
  var LOAD_CAP = 95;                 // % (SPEC rule 5)
  var EPS = 1e-12;                   // s; smaller differences are float noise

  /** Speed of the signal in each medium, m/s. */
  var SPEED = { fibre: C / FIBRE_N, copper: COPPER_VF * C, radio: C };

  /** Distance ladder in km: 1, 1.5, 2, 3, 5, 7 per decade from 0.1 to 30 000, then GEO altitude and 40 000. */
  var DISTANCES = (function () {
    var out = [];
    [0.1, 1, 10, 100, 1000, 10000].forEach(function (dec) {
      [1, 1.5, 2, 3, 5, 7].forEach(function (m) { var v = +(m * dec).toPrecision(3); if (v <= 30000) out.push(v); });
    });
    return out.concat([35786, 40000]);
  })();
  function distIndex(km) { return DISTANCES.indexOf(km); }

  var SIZES = [64, 576, 1500, 9000];          // bytes
  var RATES = [10, 50, 100, 1000, 10000];     // Mb/s
  var MEDIA = ['fibre', 'copper', 'radio'];

  var defaults = { size: 1500, rate: 100, distance: distIndex(100), medium: 'fibre', load: 0, proc: 20 };

  function P(over) { var p = {}; Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; }); Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; }); return p; }

  /** The six segments' times and the total for one set of params (SPEC rules 1–7). */
  function delays(p) {
    var L = 8 * p.size;
    var R = p.rate * 1e6;
    var km = p.km != null ? p.km : DISTANCES[p.distance];   // km: tests may pass any distance, d = 0 included
    var d = km * 1000;
    var s = SPEED[p.medium];
    var U = Math.min(Math.max(p.load, 0), LOAD_CAP) / 100;
    var trans = L / R;
    var prop = d / s;
    var proc = p.proc / 1e6;
    var ahead = U / (1 - U);
    var queue = trans * ahead;
    var segments = [
      { n: 1, kind: 'trans', link: 1, t: trans },
      { n: 2, kind: 'prop', link: 1, t: prop },
      { n: 3, kind: 'proc', link: 0, t: proc },
      { n: 4, kind: 'queue', link: 0, t: queue },
      { n: 5, kind: 'trans', link: 2, t: trans },
      { n: 6, kind: 'prop', link: 2, t: prop }
    ];
    var total = segments.reduce(function (a, x) { return a + x.t; }, 0);
    return {
      L: L, R: R, km: km, d: d, s: s, U: U, tProc: proc,
      trans: trans, prop: prop, proc: proc, queue: queue, router: trans / (1 - U), ahead: ahead,
      atCap: p.load >= LOAD_CAP, segments: segments, total: total
    };
  }

  /** Numbers of the segments whose time differs between two states (SPEC "Changed"). */
  function changed(before, now) {
    if (!before) return [];
    return now.segments.filter(function (x, i) { return Math.abs(x.t - before.segments[i].t) > EPS; }).map(function (x) { return x.n; });
  }

  /** Which params differ between two param sets, in the defaults' order. */
  function paramsChanged(a, b) {
    if (!a) return [];
    return Object.keys(defaults).filter(function (k) { return a[k] !== b[k]; });
  }

  /**
   * Which caption fits the change from params a to params b (a null: no ghost bar). Language-neutral key; the page
   * fills it. Rate or size alone, distance and/or medium, load, processing, else "several at once".
   */
  function captionKey(a, b) {
    var ch = paramsChanged(a, b);
    if (!ch.length) return 'capTotal';
    var x = delays(a), y = delays(b);
    var only = function (keys) { return ch.every(function (k) { return keys.indexOf(k) >= 0; }); };
    if (ch.length === 1 && ch[0] === 'rate') return y.trans < x.trans ? 'capFaster' : 'capSlower';
    if (ch.length === 1 && ch[0] === 'size') return y.trans < x.trans ? 'capSmaller' : 'capBigger';
    if (only(['distance', 'medium'])) {
      if (ch.length === 2) return 'capPath';
      if (ch[0] === 'medium') return 'capMedium';
      return y.prop > x.prop ? 'capFarther' : 'capNearer';
    }
    if (only(['load'])) return y.U === 0 ? 'capLoadZero' : y.atCap ? 'capLoadCap' : 'capLoad';
    if (only(['proc'])) return 'capProc';
    return 'capMany';
  }

  /**
   * The ghost bar's params after a change from prev to next (SPEC "Ghost bar"): a run of changes to one and the same
   * param (a slider drag, arrow keys) keeps the baseline from before the run; any other change starts a new one.
   * ghost = { before, run } where run is the param being changed in the current run (or null).
   */
  function nextGhost(ghost, prev, next) {
    if (!prev) return { before: null, run: null };
    var ch = paramsChanged(prev, next);
    if (!ch.length) return ghost;
    var run = ch.length === 1 ? ch[0] : null;
    if (run && ghost && ghost.run === run && ghost.before) return { before: ghost.before, run: run };
    return { before: prev, run: run };
  }

  /**
   * Shares of a bar's length per segment (SPEC "Bar layout"): each at least minShare, the rest in proportion.
   * Repeats until no free segment falls under the minimum. Sums to 1.
   */
  function barLayout(times, minShare) {
    var n = times.length;
    var total = times.reduce(function (a, x) { return a + x; }, 0);
    if (!(total > 0) || n * minShare >= 1) return times.map(function () { return 1 / n; });
    var fixed = times.map(function () { return false; });
    for (;;) {
      var room = 1 - minShare * fixed.filter(Boolean).length;
      var free = times.reduce(function (a, x, i) { return fixed[i] ? a : a + x; }, 0);
      var more = false;
      times.forEach(function (x, i) {
        if (!fixed[i] && (free > 0 ? x / free * room : 0) < minShare) { fixed[i] = true; more = true; }
      });
      if (!more) {
        return times.map(function (x, i) { return fixed[i] ? minShare : x / free * room; });
      }
      if (fixed.every(Boolean)) return times.map(function () { return 1 / n; });
    }
  }

  /** A time in ms as a language-neutral string (SPEC "Display"): 2 / 3 / 4 significant digits, zeros dropped. */
  function msText(sec) {
    var v = sec * 1000;
    if (v === 0) return '0';
    var sig = v < 1 ? 2 : v < 100 ? 3 : 4;
    var out = Number(v.toPrecision(sig));
    if (out < 1e-12) return '0';
    return String(out).indexOf('e') >= 0 ? out.toFixed(12).replace(/0+$/, '') : String(out);
  }

  /** Presets: the "before" bar and the settings ("after") the preset loads. */
  var presets = [
    { id: 'slow-fast-link', before: { size: 1500, rate: 10, distance: distIndex(100), medium: 'fibre' },
      params: { size: 1500, rate: 1000, distance: distIndex(100), medium: 'fibre' } },
    { id: 'near-far', before: { rate: 1000, distance: distIndex(0.1), medium: 'fibre' },
      params: { rate: 1000, distance: distIndex(7000), medium: 'fibre' } },
    { id: 'satellite', before: { rate: 50, distance: distIndex(100), medium: 'fibre' },
      params: { rate: 50, distance: distIndex(35786), medium: 'radio' } },
    { id: 'busy-router', before: { rate: 100, load: 0 },
      params: { rate: 100, load: 90 } },
    { id: 'small-packet', before: { size: 1500, rate: 10 },
      params: { size: 64, rate: 10 } }
  ];

  var logic = {
    C: C, SPEED: SPEED, LOAD_CAP: LOAD_CAP, DISTANCES: DISTANCES, SIZES: SIZES, RATES: RATES, MEDIA: MEDIA,
    defaults: defaults,
    /** Explorer: no steps; the state is the delays of the current params. */
    initial: function (p) { return delays(p); },
    delays: delays, changed: changed, paramsChanged: paramsChanged, captionKey: captionKey, nextGhost: nextGhost, barLayout: barLayout, msText: msText,
    distIndex: distIndex, withDefaults: P, presets: presets
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
