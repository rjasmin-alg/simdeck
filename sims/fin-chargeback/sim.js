/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-chargeback: a shared IT cost (a fixed cost plus each department's variable cost) allocated to five
   departments by a key (users, VMs, storage, tickets); showback shows the bills, chargeback charges them, and a
   department whose bill is above its outside offer leaves, which raises everyone else's price (the spiral).
   Explorer: the state is a pure function of the params (compute). Rules: SPEC.md. The sums are in allocation.js
   (promotable to models/); this file adds the departments, rates, params, presets and the page's derived numbers.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var A = typeof module === 'object' && module.exports
    ? require('./allocation.js')
    : root.SimdeckModels.allocation;

  var KEYS = ['users', 'vms', 'tb', 'tickets'];
  /** Variable cost a month per unit of each key, € (SPEC.md, costs). */
  var RATE = { users: 10, vms: 20, tb: 10, tickets: 5 };

  /** The departments at 100 % usage: units of each key, and the outside offer a month (€). Order = tie-break order. */
  var DEPTS = [
    { id: 'sales', units: { users: 56, vms: 12, tb: 8, tickets: 60 }, quote: 10000 },
    { id: 'acct', units: { users: 28, vms: 16, tb: 12, tickets: 40 }, quote: 5500 },
    { id: 'dev', units: { users: 40, vms: 120, tb: 52, tickets: 48 }, quote: 34000 },
    { id: 'sup', units: { users: 100, vms: 16, tb: 8, tickets: 200 }, quote: 13000 },
    { id: 'mkt', units: { users: 24, vms: 36, tb: 20, tickets: 52 }, quote: 8000 }
  ];
  var IDS = DEPTS.map(function (d) { return d.id; });

  /** Params: key → [min, max, step] for the numbers; key and mode are choices; out_<id> booleans. */
  var RANGES = { fixed: [0, 60000, 5000] };
  var USE = [50, 200, 25];
  IDS.forEach(function (id) { RANGES['use_' + id] = USE; });
  var MODES = ['show', 'charge'];

  function params(key, mode, fixed, over) {
    var p = { key: key, mode: mode, fixed: fixed };
    IDS.forEach(function (id) { p['use_' + id] = 100; p['out_' + id] = false; });
    return Object.assign(p, over || {});
  }

  /** Presets, SPEC.md table; expected numbers there. Each carries every param, so a preset is a whole scenario. */
  var presets = [
    { id: 'by-users', params: params('users', 'show', 30000) },
    { id: 'by-vms', params: params('vms', 'show', 30000) },
    { id: 'dev-grows', params: params('vms', 'show', 30000, { use_dev: 200 }) },
    { id: 'charged', params: params('tb', 'charge', 30000) },
    { id: 'one-leaves', params: params('tb', 'charge', 30000, { out_mkt: true }) },
    { id: 'spiral', params: params('users', 'charge', 30000) }
  ];

  var defaults = Object.assign({}, presets[0].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;   // empty, boolean, object…
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function bool(v, dflt) {
    if (v === true || v === 'true') return true;
    if (v === false || v === 'false') return false;
    return dflt;
  }

  /** Params made safe (a URL may carry anything): numbers clamped and snapped, choices and switches checked. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {
      key: KEYS.indexOf(q.key) >= 0 ? q.key : defaults.key,
      mode: MODES.indexOf(q.mode) >= 0 ? q.mode : defaults.mode
    };
    Object.keys(RANGES).forEach(function (k) {
      var r = RANGES[k];
      out[k] = clamp(Math.round(num(q[k], defaults[k]) / r[2]) * r[2], r[0], r[1]);
    });
    IDS.forEach(function (id) { out['out_' + id] = bool(q['out_' + id], defaults['out_' + id]); });
    return out;
  }

  /** Rule 2: the departments at the params' usage: units, variable cost and offer scale with usage (whole numbers:
      every base value is a multiple of 4 and usage moves in quarters). */
  function departments(p) {
    return DEPTS.map(function (d) {
      var use = p['use_' + d.id], u = {}, v = 0;
      KEYS.forEach(function (k) { u[k] = d.units[k] * use / 100; v += RATE[k] * u[k]; });
      return { id: d.id, units: u, variable: v, quote: d.quote * use / 100 };
    });
  }

  /** €, rounded up to a multiple of 5 000, at least 10 000: a bar chart's scale. */
  function scaleOf(x) { return Math.max(10000, Math.ceil(x / 5000) * 5000); }

  /** Everything the page shows, from the params. */
  function compute(input) {
    var p = normalise(input);
    var depts = departments(p);
    var key = p.key;
    var inIds = IDS.filter(function (id) { return !p['out_' + id]; });
    var rounds = A.spiral(p.fixed, depts, inIds, key, p.mode === 'charge');
    var last = rounds[rounds.length - 1];
    var all = A.round(p.fixed, depts, IDS, key);           // everyone in: the baseline
    var start = rounds[0];
    var leftAt = {};
    rounds.forEach(function (r, i) { if (r.leaves) leftAt[r.leaves] = i; });

    var rows = depts.map(function (d) {
      var forced = !!p['out_' + d.id];
      var r = leftAt[d.id];
      var status, bill = null;
      if (forced) status = 'forced';
      else if (r !== undefined) { status = 'left'; bill = rounds[r].bills[d.id]; }
      else { bill = last.bills[d.id]; status = last.over.indexOf(d.id) >= 0 ? 'over' : 'in'; }
      return {
        id: d.id, use: p['use_' + d.id], units: d.units[key], variable: d.variable, quote: d.quote,
        status: status, round: r === undefined ? null : r, bill: bill, allBill: all.bills[d.id]
      };
    });

    var departed = rounds.filter(function (r) { return r.leaves; }).map(function (r) { return r.leaves; });
    var outcome = !start.in.length ? 'empty'
      : p.mode === 'show' ? 'show'
        : !departed.length ? 'stable'
          : last.in.length ? 'spiral' : 'collapse';

    var top = 0;
    rows.forEach(function (x) { top = Math.max(top, x.quote, x.bill || 0); });
    var ctop = all.company;
    rounds.forEach(function (r) { ctop = Math.max(ctop, r.company); });

    var forced = rows.filter(function (x) { return x.status === 'forced'; });
    var forcedBill = forced.reduce(function (s, x) { return s + x.allBill; }, 0);
    var forcedVar = forced.reduce(function (s, x) { return s + x.variable; }, 0);

    return {
      p: p,
      key: key,
      rows: rows,                                // rules 4–6, per department
      rounds: rounds,                            // rule 8
      departed: departed,
      outcome: outcome,
      baseline: all.company,                     // rule 7: everyone in
      baseVar: all.total - p.fixed,
      company: last.company,
      // the first round's most-over department (showback: who would leave first if charged)
      firstOver: start.in.length ? A.leaver(start.total, depts.filter(function (d) { return start.in.indexOf(d.id) >= 0; }), key) : null,
      forced: { ids: forced.map(function (x) { return x.id; }), bill: forcedBill, variable: forcedVar, shifted: forcedBill - forcedVar },
      scale: scaleOf(top),
      cscale: scaleOf(ctop)
    };
  }

  /** Rule 9: the marks that changed between two states: departments whose status changed, and the result. */
  function flipped(prev, next) {
    if (!prev || !next) return [];
    var out = [];
    next.rows.forEach(function (x, i) {
      var y = prev.rows[i];
      if (!y || y.status !== x.status || y.round !== x.round) out.push(x.id);
    });
    if (prev.outcome !== next.outcome || prev.departed.length !== next.departed.length) out.push('result');
    return out;
  }

  /** Caption: the main sentence and the notes that apply, in order (SPEC.md "Captions"). */
  function captionKey(s) {
    if (s.outcome === 'empty') return { before: [], key: s.p.fixed ? 'capEmpty' : 'capEmptyFree', notes: [] };
    var key = {
      show: 'capShow', stable: 'capStable', collapse: 'capCollapse',
      spiral: s.departed.length === 1 ? 'capSpiral1' : 'capSpiralN'
    }[s.outcome];
    var before = [], notes = [];
    if (s.forced.ids.length) {          // what was done by hand comes first: it is what the rest follows from
      var one = s.forced.ids.length === 1;
      var sign = s.forced.shifted > 0 ? '' : s.forced.shifted < 0 ? 'Sub' : 'Even';
      before.push('nForced' + sign + (one ? '' : 'N'));
    }
    if (s.outcome === 'show' && s.firstOver) notes.push('nWould');
    if (s.company !== s.baseline) notes.push('nTotal');
    return { before: before, key: key, notes: notes };
  }

  var logic = {
    KEYS: KEYS, RATE: RATE, DEPTS: DEPTS, IDS: IDS, RANGES: RANGES, MODES: MODES,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    departments: departments,
    flipped: flipped,
    captionKey: captionKey
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
