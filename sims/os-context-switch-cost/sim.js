/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for os-context-switch-cost: what a context switch costs. Each switch has a direct cost (save and restore the
   processor state, run the scheduler), and then the incoming process runs slowly while it warms the cache and, after a
   change of address space, the TLB. An explorer: derive(params) is the whole state. Rules: SPEC.md (numbers in rule
   order). The timings are illustrative, like ossimulator's threads costs.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  /** The quantum's log slider: 1-2-5 steps from 10 µs to 10 ms. */
  var Q_STEPS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
  var KINDS = ['process', 'thread', 'tagged'];
  var SLOTS = 6;
  var RANGES = {
    direct: [0.5, 10],
    wCache: [0, 200],
    wTlb: [0, 50],
    rate: [0.1, 0.9]
  };
  var defaults = { q: 6, kind: 'process', direct: 2, wCache: 40, wTlb: 10, rate: 0.3 };

  function num(v, key) {
    var x = v === null || v === '' ? NaN : Number(v);
    if (!Number.isFinite(x)) x = defaults[key];
    var r = RANGES[key];
    return Math.min(r[1], Math.max(r[0], x));
  }
  function clean(p) {
    p = p || {};
    var q = p.q === null || p.q === '' ? NaN : Number(p.q);
    q = Number.isFinite(q) ? Math.min(Q_STEPS.length - 1, Math.max(0, Math.round(q))) : defaults.q;
    return {
      q: q,
      kind: KINDS.indexOf(p.kind) >= 0 ? p.kind : 'process',
      direct: num(p.direct, 'direct'),
      wCache: num(p.wCache, 'wCache'),
      wTlb: num(p.wTlb, 'wTlb'),
      rate: Math.round(num(p.rate, 'rate') * 100) / 100
    };
  }

  /** Rule 3: the warm-up after a switch of this kind. */
  function warmOf(kind, wCache, wTlb) {
    var tlb = kind === 'process' ? wTlb : 0;
    return { cache: wCache, tlb: tlb, total: wCache + tlb };
  }
  /** Rule 4: useful work in one quantum. */
  function usefulOf(Q, W, rate) {
    return Q >= W ? Q - W * (1 - rate) : Q * rate;
  }
  /** Rule 4: useful share of CPU time, in %. */
  function pctOf(Q, W, rate, direct) {
    return usefulOf(Q, W, rate) / (Q + direct) * 100;
  }
  /** Rule 8: the value as shown, one decimal, halves up, after dropping floating-point noise. */
  function shown(pct) {
    var x = Math.round(pct * 1e6) / 1e6;
    return Math.round(x * 10) / 10;
  }
  /** Rule 8: the band of a shown value. */
  function band(pct1) {
    return pct1 >= 90 ? 'high' : pct1 >= 50 ? 'mid' : 'low';
  }
  /** Rule 9. */
  function regimeOf(Q, W) {
    if (W === 0) return 'nowarm';
    return Q <= W ? 'thrash' : 'warm';
  }
  /** Rule 10. */
  function curveOf(W, rate, direct) {
    var pts = [];
    for (var i = 0; i <= 60; i++) pts.push(Math.pow(10, 1 + i / 20));
    pts[0] = 10; pts[20] = 100; pts[40] = 1000; pts[60] = 10000;   // exact decades
    if (W >= 10 && W <= 10000 && pts.indexOf(W) < 0) pts.push(W);
    pts.sort(function (a, b) { return a - b; });
    return pts.map(function (Q) { return { Q: Q, usefulPct: pctOf(Q, W, rate, direct) }; });
  }
  /** Rule 11. */
  function savedOf(kind) {
    return [
      { id: 'regs', status: 'saved' },
      { id: 'pc', status: 'saved' },
      { id: 'sp', status: 'saved' },
      { id: 'flags', status: 'saved' },
      { id: 'fpu', status: 'saved' },
      { id: 'ptbr', status: kind === 'thread' ? 'same' : 'saved' }
    ];
  }
  function coldOf(kind) {
    return [
      { id: 'tlb', status: kind === 'process' ? 'flushed' : kind === 'thread' ? 'kept' : 'tagged' },
      { id: 'cache', status: 'cold' }
    ];
  }

  function derive(params) {
    var p = clean(params);
    var Q = Q_STEPS[p.q];
    var warm = warmOf(p.kind, p.wCache, p.wTlb);
    var W = warm.total;
    var useful = usefulOf(Q, W, p.rate);
    var warmTime = Math.min(Q, W);
    var slot = p.direct + Q;
    var timeline = [];
    for (var k = 0; k < SLOTS; k++) {
      timeline.push({ proc: k % 2 === 0 ? 'A' : 'B', start: k * slot, direct: p.direct, warm: warmTime, full: Q - warmTime });
    }
    var usefulPct = useful / slot * 100;
    var pct1 = shown(usefulPct);
    return {
      Q: Q,
      q: p.q,
      kind: p.kind,
      direct: p.direct,
      warm: warm,
      rate: p.rate,
      perQuantum: { direct: p.direct, warm: warmTime * (1 - p.rate), useful: useful },
      warmTime: warmTime,
      fullTime: Q - warmTime,
      usefulPct: usefulPct,
      pct1: pct1,
      band: band(pct1),
      regime: regimeOf(Q, W),
      switchesPerSec: 1e6 / slot,
      window: SLOTS * slot,
      timeline: timeline,
      curve: curveOf(W, p.rate, p.direct),
      saved: savedOf(p.kind),
      cold: coldOf(p.kind)
    };
  }

  var presets = [
    { id: 'desktop', params: { q: 9, kind: 'process' } },
    { id: 'server', params: { q: 6, kind: 'process' } },
    { id: 'too-often', params: { q: 3, kind: 'process' } },
    { id: 'threads', params: { q: 3, kind: 'thread' } },
    { id: 'thrash', params: { q: 1, kind: 'process' } }
  ];

  var logic = {
    defaults: defaults,
    Q_STEPS: Q_STEPS,
    KINDS: KINDS,
    SLOTS: SLOTS,
    RANGES: RANGES,
    presets: presets,
    clean: clean,
    warmOf: warmOf,
    usefulOf: usefulOf,
    pctOf: pctOf,
    shown: shown,
    band: band,
    regimeOf: regimeOf,
    curveOf: curveOf,
    derive: derive,
    initial: derive
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
