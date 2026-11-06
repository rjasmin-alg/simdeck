/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-tco: two options built from the same eight cost lines, compared over a horizon. Explorer: the state
   is a pure function of the params (compute). Rules: SPEC.md. The sums are in tco.js (promotable to models/); this
   file adds the lines, params, presets and the page's derived numbers.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var T = typeof module === 'object' && module.exports
    ? require('./tco.js')
    : root.SimdeckModels.tco;

  var RATE = 50;                // € per staff hour (SPEC.md, cost lines)
  var H_MIN = 1, H_MAX = 7;

  /** The eight lines, in stage order (SPEC.md table). group: the legend's three kinds. */
  var LINES = [
    { key: 'purchase', when: 'start', max: 40000, step: 500, group: 'price' },
    { key: 'setup', when: 'start', max: 20000, step: 500, group: 'once' },
    { key: 'training', when: 'start', max: 10000, step: 250, group: 'once' },
    { key: 'power', when: 'year', max: 5000, step: 100, group: 'running' },
    { key: 'space', when: 'year', max: 5000, step: 100, group: 'running' },
    { key: 'support', when: 'year', max: 30000, step: 100, group: 'running' },
    { key: 'staff', when: 'year', max: 1000, step: 10, group: 'running', unit: RATE },
    { key: 'exit', when: 'end', max: 20000, step: 500, group: 'once' }
  ];
  var KEYS = LINES.map(function (l) { return l.key; });
  var PAIRS = ['servers', 'build', 'exit'];

  function opt(o) { var x = {}; KEYS.forEach(function (k) { x[k] = o[k] || 0; }); return x; }
  var OPTIONS = {
    servers: [
      opt({ purchase: 6000, setup: 1500, power: 1200, space: 1000, staff: 70, exit: 1000 }),
      opt({ purchase: 10000, setup: 1500, power: 700, space: 600, support: 1200, staff: 30, exit: 1000 })
    ],
    build: [
      opt({ purchase: 4000, power: 400, space: 500, staff: 500, exit: 1000 }),
      opt({ setup: 7500, training: 2500, support: 15000, staff: 80, exit: 6000 })
    ],
    exit: [
      opt({ setup: 1000, training: 500, support: 8400, staff: 20, exit: 9000 }),
      opt({ purchase: 12000, setup: 2500, training: 1000, power: 900, space: 900, support: 1000, staff: 80, exit: 1500 })
    ]
  };

  /** Params of a pair of options, the switches and the horizon. */
  function paramsOf(pair, on, horizon) {
    var p = { horizon: horizon, pair: pair };
    KEYS.forEach(function (k) {
      p['a_' + k] = OPTIONS[pair][0][k];
      p['b_' + k] = OPTIONS[pair][1][k];
      p['on_' + k] = on && k in on ? on[k] : true;
    });
    return p;
  }
  function only(key) { var on = {}; KEYS.forEach(function (k) { on[k] = k === key; }); return on; }

  var defaults = paramsOf('servers', null, 5);

  /** Presets, SPEC.md table; expected numbers there. Each carries every param, so a preset is a whole scenario. */
  var presets = [
    { id: 'cheaper-purchase', params: paramsOf('servers', null, 5) },
    { id: 'short-horizon', params: paramsOf('servers', null, 2) },
    { id: 'price-only', params: paramsOf('servers', only('purchase'), 5) },
    { id: 'build-vs-buy', params: paramsOf('build', null, 5) },
    { id: 'staff-free', params: paramsOf('build', { staff: false }, 5) },
    { id: 'exit-cost', params: paramsOf('exit', null, 5) }
  ];

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function snap(x, step) { return Math.round(x / step) * step; }
  function num(v, dflt) { var x = Number(v); return Number.isFinite(x) ? x : dflt; }

  /** Params made safe (a URL may carry anything): amounts in range on their step, switches boolean. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {
      horizon: clamp(Math.round(num(q.horizon, defaults.horizon)), H_MIN, H_MAX),
      pair: PAIRS.indexOf(q.pair) >= 0 ? q.pair : defaults.pair
    };
    LINES.forEach(function (l) {
      ['a_', 'b_'].forEach(function (s) {
        out[s + l.key] = clamp(snap(num(q[s + l.key], defaults[s + l.key]), l.step), 0, l.max);
      });
      out['on_' + l.key] = q['on_' + l.key] !== false && q['on_' + l.key] !== 'false' && q['on_' + l.key] !== 0;
    });
    return out;
  }

  /** The amounts of option 'a' or 'b' and the switches, as plain { key: value } objects. */
  function amountsOf(p, side) { var x = {}; KEYS.forEach(function (k) { x[k] = p[side + '_' + k]; }); return x; }
  function switchesOf(p) { var x = {}; KEYS.forEach(function (k) { x[k] = p['on_' + k]; }); return x; }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var H = p.horizon;
    var A = amountsOf(p, 'a'), B = amountsOf(p, 'b'), on = switchesOf(p);
    var rows = LINES.map(function (l) {
      return {
        key: l.key, when: l.when, group: l.group, on: on[l.key], staff: !!l.unit,
        a: A[l.key], b: B[l.key],
        aOver: T.lineOver(l, A[l.key], H), bOver: T.lineOver(l, B[l.key], H)
      };
    });
    var ta = T.total(LINES, A, on, H), tb = T.total(LINES, B, on, H);
    var groups = function (side) {
      var g = { price: 0, once: 0, running: 0 };
      rows.forEach(function (r) { if (r.on) g[r.group] += r[side + 'Over']; });
      return g;
    };
    var s = T.strip(LINES, A, B, on, H_MAX);
    var win = T.cheaper(ta, tb), quote = T.cheaper(A.purchase, B.purchase);
    return {
      p: p,
      rows: rows,
      total: { a: ta, b: tb },
      groups: { a: groups('a'), b: groups('b') },
      winner: win,
      diff: Math.abs(ta - tb),
      quote: quote,
      quoteDiff: Math.abs(A.purchase - B.purchase),
      share: {                                                   // rule 6
        a: on.purchase ? T.share(A.purchase, ta) : null,
        b: on.purchase ? T.share(B.purchase, tb) : null
      },
      flip: quote !== 'tie' && win !== 'tie' && quote !== win,   // rule 7
      strip: s,
      crossing: T.crossing(s),
      nothing: KEYS.every(function (k) { return !on[k]; })
    };
  }

  /** Rule 9: the marks that changed between two states (only the winner). */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    return prev.winner !== next.winner ? ['winner'] : [];
  }

  /** Caption: the main sentence and the notes that apply, in order (SPEC.md "Captions"). */
  function captionKey(s) {
    if (s.nothing) return { key: 'capNothing', notes: [] };
    var notes = [];
    if (s.flip) notes.push('nFlip');
    if (s.crossing) notes.push('nHorizon');
    return { key: s.winner === 'tie' ? 'capTie' : 'capCheaper', notes: notes };
  }

  var logic = {
    RATE: RATE, H_MIN: H_MIN, H_MAX: H_MAX, LINES: LINES, KEYS: KEYS, PAIRS: PAIRS, OPTIONS: OPTIONS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    paramsOf: paramsOf,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
