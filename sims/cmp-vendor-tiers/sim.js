/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-vendor-tiers: supplier risk for a small made-up firm. Thirty suppliers, each with what it reaches
   (personal data, production access, a critical service), whether it is hard to replace, its yearly spend and a
   likelihood level. Its risk is the risk register's expected yearly loss (scoring.js, copied from cmp-risk-register):
   the impact level follows from what it reaches. A tier rule (by reach, or by spend with the same tier sizes) puts it
   in tier 1, 2 or 3, and the tier sets the depth of the check: contract clauses with audit rights, certification
   evidence, a short questionnaire. Assessment hours are limited: tiered checking spends the budget in the rule's
   order; the common alternative sends one questionnaire to everyone. Risk covered = risk × the share the check
   covers. Revealed: a subcontractor of one supplier (covered only by the contract's subcontractor clauses) and five
   suppliers on one shared provider (a joint outage no single-supplier check covers).
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md; words: strings.js.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';
  var M = typeof module === 'object' && module.exports
    ? require('./scoring.js')
    : root.SimdeckModels.scoring;

  /** Rule 1: the register, in its own order (the order contracts were signed; also the last tie-break).
      pd personal data, acc production access, crit a critical service, hard hard to replace (0/1); spend in
      thousands of euros a year; l the likelihood level (1–5); shared: runs on the shared provider (rule 8). */
  function S(id, pd, acc, crit, hard, spend, l, shared) {
    return { id: id, pd: pd, acc: acc, crit: crit, hard: hard, spend: spend, l: l, shared: shared };
  }
  var SUPPLIERS = [
    S('erp', 1, 1, 1, 1, 60, 2, 0), S('clean', 0, 0, 0, 0, 28, 2, 0), S('courier', 1, 0, 1, 0, 120, 3, 0),
    S('msp', 1, 1, 0, 0, 18, 2, 0), S('office', 0, 0, 0, 0, 10, 1, 0), S('host', 1, 1, 1, 1, 40, 1, 1),
    S('acct', 1, 0, 0, 0, 22, 2, 0), S('goods', 0, 0, 1, 1, 400, 2, 0), S('news', 1, 0, 0, 0, 4, 3, 1),
    S('isp', 0, 0, 1, 0, 14, 4, 0), S('telco', 0, 0, 0, 0, 18, 3, 0), S('pay', 1, 0, 1, 0, 10, 2, 0),
    S('mail', 1, 0, 1, 1, 12, 1, 1), S('alarm', 0, 0, 0, 0, 16, 2, 0), S('web', 0, 1, 0, 0, 20, 3, 0),
    S('callc', 1, 0, 0, 0, 45, 3, 0), S('pack', 0, 0, 1, 0, 90, 2, 0), S('recruit', 1, 0, 0, 0, 6, 2, 0),
    S('backup', 1, 1, 0, 0, 10, 1, 1), S('insur', 0, 0, 0, 0, 25, 1, 0), S('pspay', 1, 0, 1, 1, 30, 1, 0),
    S('legal', 1, 0, 0, 0, 15, 1, 0), S('print', 0, 0, 0, 0, 8, 3, 0), S('wms', 0, 0, 1, 1, 24, 2, 1),
    S('audit', 1, 0, 0, 0, 12, 1, 0), S('hw', 0, 0, 0, 0, 35, 3, 0), S('train', 1, 0, 0, 0, 5, 2, 0),
    S('travel', 1, 0, 0, 0, 8, 2, 0), S('coffee', 0, 0, 0, 0, 3, 1, 0), S('domain', 0, 0, 1, 0, 1, 1, 0)
  ];
  /** Rule 4: the depths of checking: hours of assessment work per supplier and the share of its risk covered (%). */
  var DEPTHS = {
    audit: { hours: 10, cover: 80 },     // contract clauses with audit rights
    cert: { hours: 4, cover: 50 },       // certification evidence
    quest: { hours: 2, cover: 20 }       // a short questionnaire
  };
  var DEPTH_OF_TIER = { 1: 'audit', 2: 'cert', 3: 'quest' };
  /** Rule 8: behind the suppliers. The subcontractor of `parent` (its own likelihood and impact levels; the share of
      its risk the parent's contract clauses cover); the shared provider's likelihood level. */
  var SUB = { parent: 'msp', l: 1, i: 5, cover: 50 };
  var PROVIDER = { l: 1 };

  var VIEWS = ['same', 'tiered'];
  var RULES = ['reach', 'spend'];
  var BUDGET = { min: 10, max: 160, step: 10 };

  // ── rules 1–3: risk and tiers ──

  /** Rule 1: the impact level from what a supplier reaches: 1 + 2 personal data + 2 production access + 1 critical
      service + 1 more when that service is hard to replace, at most 5. */
  function impact(x) { return Math.min(5, 1 + 2 * x.pd + 2 * x.acc + x.crit + (x.crit && x.hard ? 1 : 0)); }
  /** Rule 1: the supplier's risk, € a year: the risk register's expected loss at (likelihood, impact). */
  function risk(x) { return M.loss(x.l, impact(x)); }

  /** Rule 2: tier by reach: 1 = production access, or a critical service that is hard to replace; 2 = personal
      data, or a critical service that is easy to replace; 3 = the rest. */
  function tierByReach(x) {
    if (x.acc || (x.crit && x.hard)) return 1;
    if (x.pd || x.crit) return 2;
    return 3;
  }

  /** Rule 3: tier by spend: the same tier sizes as by reach, filled from the largest yearly spend down
      (ties: register order). Returns { id: tier }. */
  function tiersBySpend(list) {
    var n1 = list.filter(function (x) { return tierByReach(x) === 1; }).length;
    var n2 = list.filter(function (x) { return tierByReach(x) === 2; }).length;
    var out = {};
    spendOrder(list).forEach(function (id, k) { out[id] = k < n1 ? 1 : k < n1 + n2 ? 2 : 3; });
    return out;
  }
  function spendOrder(list) {
    return list.map(function (x, k) { return { id: x.id, s: x.spend, k: k }; })
      .sort(function (a, b) { return b.s - a.s || a.k - b.k; })
      .map(function (x) { return x.id; });
  }

  /** Rule 5: the order tiered checking spends the hours in. reach: tier ascending, impact descending, register order;
      spend: the spend order (which is tier order by construction). */
  function priority(list, rule, tiers) {
    if (rule === 'spend') return spendOrder(list);
    return list.map(function (x, k) { return { id: x.id, t: tiers[x.id], i: impact(x), k: k }; })
      .sort(function (a, b) { return a.t - b.t || b.i - a.i || a.k - b.k; })
      .map(function (x) { return x.id; });
  }

  // ── rules 5–7: spending the hours ──

  /** Rule 5: walk the order; a supplier gets the depth `want(id)` when its hours fit in what is left (equal fits),
      else it stays unchecked and the walk goes on (a cheaper check further down may still fit). Returns { id: depth
      or null } and the hours used. */
  function allocate(order, want, budget) {
    var left = budget, depth = {};
    order.forEach(function (id) {
      var d = want(id), h = DEPTHS[d].hours;
      if (h <= left) { depth[id] = d; left -= h; } else depth[id] = null;
    });
    return { depth: depth, hours: budget - left };
  }

  /** Rule 7: a supplier's risk covered by a depth (null: nothing), whole euros. */
  function covered(r, depth) { return depth ? M.hup(r * DEPTHS[depth].cover, 100) : 0; }

  // ── params, presets ──

  function P(over) {
    return Object.assign({ view: 'same', rule: 'reach', budget: 60, reveal: false }, over);
  }
  /** Rule 9: the presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'same', params: P({}) },
    { id: 'tiered', params: P({ view: 'tiered' }) },
    { id: 'enough', params: P({ view: 'tiered', budget: 160 }) },
    { id: 'spend', params: P({ view: 'tiered', budget: 160, rule: 'spend' }) },
    { id: 'reveal', params: P({ view: 'tiered', budget: 160, reveal: true }) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  function oneOf(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }
  /** Rule 9: params made safe. budget: a number, rounded to the step (halves up), clamped; reveal: true or "true". */
  function normalise(params) {
    var q = Object.assign({}, defaults, params);
    var b = typeof q.budget === 'string' ? (q.budget.trim() === '' ? NaN : Number(q.budget)) : q.budget;
    if (typeof b !== 'number' || !Number.isFinite(b)) b = defaults.budget;
    b = Math.floor(b / BUDGET.step + 0.5) * BUDGET.step;
    return {
      view: oneOf(q.view, VIEWS, defaults.view),
      rule: oneOf(q.rule, RULES, defaults.rule),
      budget: Math.min(BUDGET.max, Math.max(BUDGET.min, b)),
      reveal: q.reveal === true || q.reveal === 'true'
    };
  }

  /** Rule 7: the totals of one strategy: hours, risk covered, its share of all risk (%), per hour (€), the unchecked
      suppliers and their share of all risk (%). */
  function totals(rows, key, hours, extra, total) {
    var cov = rows.reduce(function (a, x) { return a + x[key].covered; }, 0) + extra;
    var open = rows.filter(function (x) { return !x[key].depth; });
    return {
      hours: hours,
      covered: cov,
      pct: M.hup(cov * 100, total),
      perHour: hours ? M.hup(cov, hours) : 0,
      unchecked: open.map(function (x) { return x.id; }),
      uncheckedPct: M.hup(open.reduce(function (a, x) { return a + x.risk; }, 0) * 100, total)
    };
  }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var spendTiers = tiersBySpend(SUPPLIERS);
    var tiers = {};
    SUPPLIERS.forEach(function (x) { tiers[x.id] = p.rule === 'spend' ? spendTiers[x.id] : tierByReach(x); });
    var order = priority(SUPPLIERS, p.rule, tiers);
    var tier = allocate(order, function (id) { return DEPTH_OF_TIER[tiers[id]]; }, p.budget);       // rule 5
    var same = allocate(SUPPLIERS.map(function (x) { return x.id; }), function () { return 'quest'; }, p.budget); // rule 6

    var rows = order.map(function (id) {
      var x = SUPPLIERS.filter(function (y) { return y.id === id; })[0], r = risk(x);
      return {
        id: id, pd: x.pd, acc: x.acc, crit: x.crit, hard: x.hard, spend: x.spend, shared: x.shared,
        i: impact(x), l: x.l, risk: r, tier: tiers[id], reach: tierByReach(x), bySpend: spendTiers[id],
        tiered: { depth: tier.depth[id], covered: covered(r, tier.depth[id]) },
        same: { depth: same.depth[id], covered: covered(r, same.depth[id]) }
      };
    });
    var base = rows.reduce(function (a, x) { return a + x.risk; }, 0);

    // rule 8: behind the suppliers
    var extra = null, total = base, extraT = 0, extraS = 0;
    if (p.reveal) {
      var parent = rows.filter(function (x) { return x.id === SUB.parent; })[0];
      var subRisk = M.loss(SUB.l, SUB.i);
      var shared = SUPPLIERS.filter(function (x) { return x.shared; })      // register order, whatever the rule
        .map(function (x) { return rows.filter(function (y) { return y.id === x.id; })[0]; });
      var joint = M.ale(shared.reduce(function (a, x) { return a + M.SCALE.eur[x.i - 1]; }, 0), M.SCALE.f100[PROVIDER.l - 1]);
      var subCov = function (d) { return d === 'audit' ? M.hup(subRisk * SUB.cover, 100) : 0; };
      extra = {
        sub: { parent: SUB.parent, risk: subRisk, tiered: subCov(parent.tiered.depth), same: subCov(parent.same.depth) },
        shared: { ids: shared.map(function (x) { return x.id; }), risk: joint, tiered: 0, same: 0 }
      };
      total = base + subRisk + joint;
      extraT = extra.sub.tiered;
      extraS = extra.sub.same;
    }

    var t1 = rows.filter(function (x) { return x.tier === 1; }).reduce(function (a, x) { return a + x.risk; }, 0);
    return {
      p: p, rows: rows, base: base, total: total, extra: extra,
      tier1: { risk: t1, pct: M.hup(t1 * 100, total) },
      tiered: totals(rows, 'tiered', tier.hours, extraT, total),
      same: totals(rows, 'same', same.hours, extraS, total)
    };
  }

  // ── rule 10: the caption ──

  /** Rule 10: by spend, the riskiest supplier that spend puts in a lower tier than reach would, and the supplier spend
      lifts the most tiers (then the highest spend) into a higher one. Ties: register order. */
  function spendMisfits(s) {
    var down = null, up = null;
    SUPPLIERS.forEach(function (x) {
      var r = s.rows.filter(function (y) { return y.id === x.id; })[0];
      if (r.bySpend > r.reach && (down === null || r.risk > down.risk)) down = r;
      if (r.bySpend < r.reach && (up === null || r.reach - r.bySpend > up.reach - up.bySpend ||
        (r.reach - r.bySpend === up.reach - up.bySpend && r.spend > up.spend))) up = r;
    });
    return { down: down ? down.id : null, up: up ? up.id : null };
  }

  /** The main line by the view shown, then at most two notes, the first that apply in this order:
      the subcontractor (nSubOn when the shown strategy covers any of it, else nSubOff) and the shared provider
      (reveal on); a misfit by spend (rule spend, tiered view); suppliers left unchecked in the shown view (nOut);
      tier 1's share of the risk (nTopSame or nTopTiered by the view, always). */
  function captionKey(s) {
    var p = s.p, view = s[p.view], notes = [];
    if (s.extra) {
      notes.push(s.extra.sub[p.view] > 0 ? 'nSubOn' : 'nSubOff');
      notes.push('nShared');
    }
    if (p.rule === 'spend' && p.view === 'tiered') notes.push('nSpend');
    if (view.unchecked.length) notes.push('nOut');
    notes.push(p.view === 'same' ? 'nTopSame' : 'nTopTiered');
    return { key: p.view === 'same' ? 'capSame' : 'capTiered', notes: notes.slice(0, 2) };
  }

  var logic = {
    SUPPLIERS: SUPPLIERS, DEPTHS: DEPTHS, DEPTH_OF_TIER: DEPTH_OF_TIER, SUB: SUB, PROVIDER: PROVIDER,
    VIEWS: VIEWS, RULES: RULES, BUDGET: BUDGET,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    impact: impact,
    risk: risk,
    tierByReach: tierByReach,
    tiersBySpend: tiersBySpend,
    spendOrder: spendOrder,
    priority: priority,
    allocate: allocate,
    covered: covered,
    spendMisfits: spendMisfits,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
