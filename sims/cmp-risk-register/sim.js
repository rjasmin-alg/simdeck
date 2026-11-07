/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-risk-register: twelve IT risks of a made-up firm on a 5 × 5 likelihood × impact matrix, each
   accepted, reduced, transferred or avoided; the appetite line in score or in money; who signs each residual; the
   register ranked by score or by money. Explorer: the state is a pure function of the params (compute).
   Rules: SPEC.md. Scoring, treatments, appetite and ranks are in scoring.js (promotable to models/); this file adds
   the register, params, presets, the matrix cells, the captions and the changed marks.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var M = typeof module === 'object' && module.exports
    ? require('./scoring.js')
    : root.SimdeckModels.scoring;

  /** Rule 7: the register in order: [L, I, reduce dL, reduce dI, control € a year, benefit given up € a year]. */
  var RISKS = ['phish', 'ransom', 'laptop', 'fire', 'saas', 'patch', 'leaver', 'change', 'flood', 'share', 'invoice', 'power'];
  var BASE = {
    phish: [4, 3, 2, 0, 6000, 300000],
    ransom: [2, 5, 0, 2, 15000, 400000],
    laptop: [5, 1, 1, 0, 3000, 40000],
    fire: [1, 5, 0, 2, 12000, 35000],
    saas: [3, 3, 0, 1, 18000, 30000],
    patch: [3, 4, 2, 0, 12000, 60000],
    leaver: [3, 2, 2, 0, 2000, 15000],
    change: [4, 2, 1, 0, 4000, 25000],
    flood: [2, 2, 1, 0, 5000, 80000],
    share: [2, 4, 1, 0, 5000, 20000],
    invoice: [2, 3, 1, 0, 1000, 30000],
    power: [4, 1, 2, 0, 2500, 50000]
  };
  var VIEWS = ['score', 'money'];
  var APP_M = [5000, 10000, 25000, 50000, 100000];
  var APP_S = [1, 24];
  var LEVELS = [1, 2, 3, 4, 5];

  /** A whole scenario: every risk at its base position, the named treatments (accept otherwise). */
  function scenario(view, treat, sel) {
    var p = { view: view, appS: 8, appM: 25000, risk: sel };
    RISKS.forEach(function (id) {
      p[id + 'L'] = BASE[id][0];
      p[id + 'I'] = BASE[id][1];
      p[id + 'T'] = (treat && treat[id]) || 'accept';
    });
    return p;
  }
  var SCORE4 = { phish: 'reduce', ransom: 'reduce', saas: 'reduce', patch: 'reduce' };

  /** Presets, SPEC.md table; each carries every param, so a preset is a whole scenario. */
  var presets = [
    { id: 'register', params: scenario('score', null, 'phish') },
    { id: 'treated', params: scenario('score', SCORE4, 'saas') },
    { id: 'money', params: scenario('money', SCORE4, 'fire') },
    { id: 'by-money', params: scenario('money', { phish: 'reduce', ransom: 'reduce', fire: 'reduce', patch: 'reduce', share: 'reduce' }, 'fire') },
    { id: 'insure', params: scenario('money', { phish: 'reduce', patch: 'reduce', share: 'reduce', ransom: 'transfer', fire: 'transfer' }, 'ransom') }
  ];
  var defaults = Object.assign({}, presets[0].params);

  function has(list, v) { return list.indexOf(v) >= 0; }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;   // empty, boolean, object…
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function intIn(v, lo, hi, dflt) { return Math.min(hi, Math.max(lo, Math.round(num(v, dflt)))); }

  /** Rule 8: params made safe (a URL may carry anything). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {
      view: has(VIEWS, q.view) ? q.view : defaults.view,
      appS: intIn(q.appS, APP_S[0], APP_S[1], defaults.appS),
      appM: has(APP_M, num(q.appM, NaN)) ? num(q.appM, NaN) : defaults.appM,
      risk: has(RISKS, q.risk) ? q.risk : defaults.risk
    };
    RISKS.forEach(function (id) {
      out[id + 'L'] = intIn(q[id + 'L'], 1, 5, BASE[id][0]);
      out[id + 'I'] = intIn(q[id + 'I'], 1, 5, BASE[id][1]);
      out[id + 'T'] = has(M.TREATMENTS, q[id + 'T']) ? q[id + 'T'] : 'accept';
    });
    return out;
  }

  /** The 25 cells, likelihood 5 (top row) to 1, impact 1 to 5: each cell's value in both units and whether it is above
      the appetite of the current view, with the edges of the staircase (left: the cell to the left is within; bottom:
      the cell below is within). */
  function cells(view, appS, appM) {
    var app = view === 'money' ? appM : appS;
    function val(l, i) { return view === 'money' ? M.loss(l, i) : M.score(l, i); }
    var out = [];
    for (var l = 5; l >= 1; l--) {
      for (var i = 1; i <= 5; i++) {
        var up = M.above(val(l, i), app);
        out.push({
          l: l, i: i, score: M.score(l, i), eur: M.loss(l, i), above: up,
          edgeL: up && i > 1 && !M.above(val(l, i - 1), app),
          edgeB: up && l > 1 && !M.above(val(l - 1, i), app)
        });
      }
    }
    return out;
  }

  /** Rule 10: the pair with equal inherent scores whose losses differ most (ratio ≥ 2; first pair on equal ratios). */
  function tiePair(risks) {
    var best = null;
    for (var a = 0; a < risks.length; a++) {
      for (var b = a + 1; b < risks.length; b++) {
        var x = risks[a], y = risks[b];
        if (x.s0 !== y.s0) continue;
        var hi = Math.max(x.e0, y.e0), lo = Math.min(x.e0, y.e0);
        if (hi < 2 * lo) continue;
        if (!best || hi * best.lo > best.hi * lo) best = { a: x.id, b: y.id, hi: hi, lo: lo, s: x.s0 };
      }
    }
    return best;
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var money = p.view === 'money';
    var risks = RISKS.map(function (id, k) {
      var b = BASE[id];
      var x = M.treat({ l: p[id + 'L'], i: p[id + 'I'], t: p[id + 'T'], dl: b[2], di: b[3], cost: b[4], avoid: b[5] });
      x.id = id;
      x.n = k + 1;
      x.sigScore = M.signer(x.t, x.s1, p.appS);
      x.sigMoney = M.signer(x.t, x.e1, p.appM);
      x.needScore = M.above(x.s0, p.appS);
      x.needMoney = M.above(x.e0, p.appM);
      x.signer = money ? x.sigMoney : x.sigScore;
      x.need = money ? x.needMoney : x.needScore;
      return x;
    });
    var rS = M.ranks(risks.map(function (x) { return x.s0; }));
    var rM = M.ranks(risks.map(function (x) { return x.e0; }));
    risks.forEach(function (x, k) {
      x.rankScore = rS[k];
      x.rankMoney = rM[k];
      x.rank = money ? rM[k] : rS[k];
      x.move = money ? rS[k] - rM[k] : rM[k] - rS[k];   // > 0: higher in this view than in the other
      x.tied = (money ? rM : rS).filter(function (r) { return r === x.rank; }).length > 1;
    });
    var order = M.order(risks.map(function (x) { return money ? x.e0 : x.s0; })).map(function (k) { return RISKS[k]; });
    var tot = { cost: 0, e0: 0, e1: 0, need: 0, board: 0 };
    risks.forEach(function (x) {
      tot.cost += x.cost; tot.e0 += x.e0; tot.e1 += x.e1;
      if (x.need) tot.need++;
      if (x.signer === 'board') tot.board++;
    });
    tot.exp = tot.e1 + tot.cost;                  // the expected yearly cost with the treatments
    var top = order[0];
    return {
      p: p,
      view: p.view,
      app: money ? p.appM : p.appS,
      risks: risks,
      order: order,
      sel: p.risk,
      cells: cells(p.view, p.appS, p.appM),
      tot: tot,
      top: top,
      up: risks.filter(function (x) { return x.sigMoney === 'board' && x.sigScore === 'owner'; }).map(function (x) { return x.id; }),
      down: risks.filter(function (x) { return x.sigScore === 'board' && x.sigMoney === 'owner'; }).map(function (x) { return x.id; }),
      notWorth: risks.filter(function (x) { return (x.t === 'reduce' || x.t === 'transfer') && x.net < 0; }).map(function (x) { return x.id; }),
      noEffect: risks.filter(function (x) { return x.noEffect; }).map(function (x) { return x.id; }),
      tie: tiePair(risks)
    };
  }

  /** Rule 9: the ids whose current rank or signer changed between two states. */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    var out = [];
    next.risks.forEach(function (x, k) {
      var y = prev.risks[k];
      if (y && (y.rank !== x.rank || y.signer !== x.signer)) out.push(x.id);
    });
    return out;
  }

  /** Rule 10: the caption's main sentence and at most two notes, in order. */
  function captionKey(s) {
    var notes = [];
    if (s.noEffect.length) notes.push('nNoEffect');
    var key;
    if (s.view === 'score') {
      key = s.tot.board ? 'capScoreBoard' : 'capScoreOk';
      if (s.tie) notes.push('nTie');
    } else {
      key = s.tot.board ? 'capMoneyBoard' : 'capMoneyOk';
      if (s.up.length) notes.push('nUp');
      if (s.down.length) notes.push('nDown');
      if (s.notWorth.length) notes.push('nNotWorth');
    }
    return { key: key, notes: notes.slice(0, 2) };
  }

  var logic = {
    RISKS: RISKS, BASE: BASE, VIEWS: VIEWS, APP_M: APP_M, APP_S: APP_S, LEVELS: LEVELS, TREATMENTS: M.TREATMENTS,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    cells: cells,
    tiePair: tiePair,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
