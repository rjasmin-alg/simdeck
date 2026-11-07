/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-ale-risk: a register of five risks, each a loss per event and a yearly frequency (ALE = SLE × ARO),
   each accepted, reduced by a control, transferred to an insurer or avoided; the expected yearly cost of each choice
   against the expected loss it removes, and many simulated years, untreated and with the choices, for the worst year.
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. ALE, treatments and the simulated
   years are in risk.js (promotable to models/); this file adds the register, params, presets and the page's numbers.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var M = typeof module === 'object' && module.exports
    ? require('./risk.js')
    : root.SimdeckModels.risk;

  /** The register: id and what the control acts on ('aro' the frequency, 'sle' the loss per event). */
  var RISKS = ['laptop', 'fraud', 'ransom', 'outage', 'portal'];
  var KIND = { laptop: 'sle', fraud: 'aro', ransom: 'sle', outage: 'aro', portal: 'aro' };
  var TREAT = ['accept', 'reduce', 'transfer', 'avoid'];
  var LOSS = [0, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];   // € per event; 0 = not in the register
  var FREQ = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 4, 12];                                // events per year
  var YEARS = [100, 1000];
  var SEED_MAX = 999999;

  /** Ranges: key → [min, max, step]. Per risk: control cost (€/yr), control effect (%), benefit given up (€/yr). */
  var RANGES = { ded: [0, 100000, 1000], load: [100, 300, 10], seed: [1, SEED_MAX, 1] };
  RISKS.forEach(function (id) {
    RANGES[id + 'C'] = [0, 100000, 500];
    RANGES[id + 'E'] = [0, 100, 5];
    RANGES[id + 'A'] = [0, 200000, 1000];
  });

  /** The illustrative register: [loss €, frequency /yr, control cost €/yr, control effect %, benefit given up €/yr]. */
  var BASE = {
    laptop: [2000, 4, 2000, 50, 40000],
    fraud: [50000, 0.5, 3000, 90, 60000],
    ransom: [500000, 0.05, 15000, 80, 200000],
    outage: [20000, 0.5, 20000, 90, 30000],
    portal: [200000, 0.1, 15000, 50, 12000]
  };

  /** A whole scenario: the base register with some rows replaced, a treatment per risk (accept when not named). */
  function scenario(treat, over, sel) {
    var p = { risk: sel || 'ransom', ded: 10000, load: 150, years: 100, seed: 1 };
    RISKS.forEach(function (id) {
      var r = (over && over[id]) || BASE[id];
      p[id + 'L'] = r[0]; p[id + 'F'] = r[1]; p[id + 'C'] = r[2]; p[id + 'E'] = r[3]; p[id + 'A'] = r[4];
      p[id + 'T'] = (treat && treat[id]) || 'accept';
    });
    return p;
  }
  function only(id, row) {
    var o = {};
    RISKS.forEach(function (x) { o[x] = x === id ? row : [0].concat(BASE[x].slice(1)); });
    return o;
  }

  /** Presets, SPEC.md table; expected numbers there. Each carries every param, so a preset is a whole scenario. */
  var presets = [
    { id: 'register', params: scenario() },
    { id: 'controls', params: scenario({ laptop: 'reduce', fraud: 'reduce', ransom: 'reduce', outage: 'reduce', portal: 'avoid' }, null, 'outage') },
    { id: 'insure', params: scenario({ ransom: 'transfer', portal: 'transfer' }) },
    { id: 'rare', params: scenario(null, only('ransom', [1000000, 0.01, 15000, 80, 200000])) },
    { id: 'break-even', params: scenario({ ransom: 'reduce' }, { ransom: [500000, 0.05, 20000, 80, 200000] }) }
  ];

  var defaults = Object.assign({}, presets[0].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;   // empty, boolean, object…
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function oneOf(list, v, dflt) {
    var x = num(v, NaN);
    return list.indexOf(x) >= 0 ? x : dflt;
  }

  /** "Run again": the next seed, back to 1 after the last. */
  function nextSeed(seed) { return seed >= SEED_MAX ? 1 : seed + 1; }

  /** Params made safe (a URL may carry anything): ranges clamped and snapped to the step; a loss, frequency, year count,
      treatment or risk outside its list takes the default. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {};
    Object.keys(RANGES).forEach(function (k) {
      var r = RANGES[k];
      out[k] = clamp(Math.round(num(q[k], defaults[k]) / r[2]) * r[2], r[0], r[1]);
    });
    RISKS.forEach(function (id) {
      out[id + 'L'] = oneOf(LOSS, q[id + 'L'], defaults[id + 'L']);
      out[id + 'F'] = oneOf(FREQ, q[id + 'F'], defaults[id + 'F']);
      out[id + 'T'] = TREAT.indexOf(q[id + 'T']) >= 0 ? q[id + 'T'] : defaults[id + 'T'];
    });
    out.risk = RISKS.indexOf(q.risk) >= 0 ? q.risk : defaults.risk;
    out.years = oneOf(YEARS, q.years, defaults.years);
    return out;
  }

  /** Rule 9: the chart's axis: 0 to the largest of both worst years and both expected lines, on nice steps (at least
      a quarter of it). */
  function axis(top) {
    var step = M.niceStep(top, 4);
    var hi = Math.max(step, Math.ceil(top / step) * step);
    var ticks = [];
    for (var v = 0; v <= hi + 1e-9; v += step) ticks.push(v);
    return { hi: hi, step: step, ticks: ticks };
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var g = { ded: p.ded, load: p.load };
    var risks = RISKS.map(function (id) {
      var x = M.treat({
        sle: p[id + 'L'], f100: Math.round(p[id + 'F'] * 100), kind: KIND[id], t: p[id + 'T'],
        cost: p[id + 'C'], eff: p[id + 'E'], avoid: p[id + 'A']
      }, g);
      x.id = id;
      x.kind = KIND[id];
      x.eff = p[id + 'E'];                                  // the control's effect, %
      x.keep = Math.min(x.sle, p.ded);                      // the loss kept per event when insured
      x.belowDed = x.t === 'transfer' && x.sle <= p.ded;   // the insurer would pay nothing
      return x;
    });
    var tot = { ale: 0, res: 0, cost: 0 };
    risks.forEach(function (x) { tot.ale += x.ale; tot.res += x.res; tot.cost += x.cost; });
    tot.exp = tot.res + tot.cost;                 // the expected yearly cost of risk with the choices
    tot.save = tot.ale - tot.exp;                 // what the choices save on average (negative: they cost more)
    var sim = M.years(risks, p.years, p.seed);
    var before = M.summary(sim.u, 0), after = M.summary(sim.k, sim.fixed);
    var ax = axis(Math.max(before.worst, after.worst, tot.ale, tot.exp, 1));
    var none = risks.every(function (x) { return x.t === 'accept' || x.t === 'off'; });
    return {
      p: p,
      risks: risks,
      tot: tot,
      none: none,                                  // nothing treated: both columns are the same
      empty: risks.every(function (x) { return x.t === 'off'; }),
      years: { u: sim.u, k: sim.k, fixed: sim.fixed },
      before: before,
      after: after,
      quiet: p.years - before.hit,                 // untreated years with no loss at all
      times: tot.ale ? M.hup(10 * before.worst, tot.ale) : null,   // worst untreated year ÷ ALE, in tenths
      outcome: none ? 'none' : tot.save > 0 ? 'save' : tot.save === 0 ? 'even' : 'cost',
      axis: ax
    };
  }

  /** Rule 10: the marks that changed between two states (the outcome moves between none, save, even and cost). */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    return prev.outcome !== next.outcome ? ['outcome'] : [];
  }

  /** Caption: the main sentence and the notes that apply, in order (SPEC.md "Captions"). */
  function captionKey(s) {
    if (s.empty) return { key: 'capEmpty', notes: [] };
    var notes = [];
    if (s.risks.some(function (x) { return x.t === 'reduce' && x.verdict !== 'worth'; })) notes.push('nNotWorth');
    if (s.risks.some(function (x) { return x.t === 'transfer' && !x.belowDed && x.net < 0; })) notes.push('nInsure');
    if (s.risks.some(function (x) { return x.belowDed; })) notes.push('nBelowDed');
    if (2 * s.quiet >= s.p.years && s.before.hit > 0) notes.push('nQuiet');   // no loss at all: capNoLoss says it
    var key = s.none ? (s.before.worst === 0 ? 'capNoLoss' : 'capNone') : s.outcome === 'save' ? 'capSave' : s.outcome === 'even' ? 'capEven' : 'capCost';
    return { key: key, notes: notes };
  }

  var logic = {
    RISKS: RISKS, KIND: KIND, TREAT: TREAT, LOSS: LOSS, FREQ: FREQ, YEARS: YEARS, RANGES: RANGES, SEED_MAX: SEED_MAX,
    BASE: BASE,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    nextSeed: nextSeed,
    axis: axis,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
