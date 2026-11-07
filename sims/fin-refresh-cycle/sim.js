/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for fin-refresh-cycle: a fleet of devices replaced every n years, all at once or in staggered cohorts. The
   capital cost per device per year (the straight-line depreciation down to the resale value) falls as the cycle
   lengthens; support, repairs and lost staff time rise with age; the lowest sum is the economic life. Ten years of the
   fleet: yearly cash, depreciation, support and repairs, lost staff time. Explorer: the state is a pure function of
   the params (compute). Rules: SPEC.md.
   The depreciation schedule, book value and disposal come from asset.js (copied from fin-depreciation, promotable to
   models/asset.js). The age-cost curve (resale, failures, support, staff time) and the cohort timeline are new here
   and are pure functions over plain numbers too. Pure: no DOM, no Math.random, no Date, no timers. State is JSON. */
(function (root) {
  'use strict';

  var node = typeof module === 'object' && module.exports;
  var As = node ? require('./asset.js') : root.SimdeckModels.asset;

  // Fixed, illustrative (SPEC.md "Params"): one device type, one fleet.
  var FLEET = 240, PRICE = 1200, KEEP = 0.5, WARRANTY = 3;
  var SUPPORT = 0.08, REPAIR = 0.25, FAIL1 = 0.05, FAILGROW = 1.5, HOURS_FAIL = 6, HOURLY = 40;
  var YEARS = 10, CYCLE_MIN = 2, CYCLE_MAX = 8, SLOW_MAX = 4, SLOW_STEP = 0.5;

  var defaults = { cycle: 4, cohorts: 1, slow: 1, staff: true };

  /** Presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'wall', params: { cycle: 4, cohorts: 1, slow: 1, staff: true } },
    { id: 'staggered', params: { cycle: 4, cohorts: 4, slow: 1, staff: true } },
    { id: 'stretched', params: { cycle: 7, cohorts: 1, slow: 1, staff: true } },
    { id: 'budget', params: { cycle: 7, cohorts: 1, slow: 1, staff: false } },
    { id: 'slow', params: { cycle: 3, cohorts: 3, slow: 3, staff: true } }
  ];

  var tidy = As.tidy;
  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  /** A number, or the default for anything else (null, '', true, 'x', Infinity: rule 1). */
  function num(v, dflt) {
    if (typeof v !== 'number' && !(typeof v === 'string' && v.trim() !== '')) return dflt;
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function bool(v, dflt) {
    if (v === true || v === 'true' || v === 1 || v === '1') return true;
    if (v === false || v === 'false' || v === 0 || v === '0') return false;
    return dflt;
  }

  /** Params made safe (a URL may carry anything); cohorts after the cycle (rule 1). */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var cycle = clamp(Math.round(num(q.cycle, defaults.cycle)), CYCLE_MIN, CYCLE_MAX);
    return {
      cycle: cycle,
      cohorts: clamp(Math.round(num(q.cohorts, defaults.cohorts)), 1, cycle),
      slow: clamp(Math.round(num(q.slow, defaults.slow) / SLOW_STEP) * SLOW_STEP, 0, SLOW_MAX),
      staff: bool(q.staff, defaults.staff)
    };
  }

  // ── per device, by age a (1 = the year bought): rule 3 ──

  function resale(a) { return tidy(PRICE * Math.pow(KEEP, a)); }
  function failRate(a) { return FAIL1 * Math.pow(FAILGROW, a - 1); }
  /** Support contract and repairs, paid in cash; nothing in warranty. */
  function supRep(a) { return a > WARRANTY ? SUPPORT * PRICE + failRate(a) * REPAIR * PRICE : 0; }
  /** Lost staff time in euros (not paid out): downtime per failure plus slowness growing with age. The per-device
      amounts are left untidied (exact to the float) and tidied only once summed, so a sum on a .5 boundary rounds as
      the exact fraction does (rule 9). */
  function staffCost(a, slow, staff) {
    return staff ? HOURLY * (HOURS_FAIL * failRate(a) + slow * (a - 1)) : 0;
  }

  /** The asset-model schedule of one device kept n years (rule 4): straight-line down to the resale value. */
  function deviceSchedule(n) { return As.schedule(PRICE, n, resale(n), 'sl'); }

  /** Cost per device per year for cycle n (rule 5): capital, mean support and repairs, mean staff time, total. */
  function perDevice(n, slow, staff) {
    var sr = 0, st = 0;
    for (var a = 1; a <= n; a++) { sr += supRep(a); st += staffCost(a, slow, staff); }
    var capital = (PRICE - resale(n)) / n;            // = deviceSchedule(n)[k].dep, untidied (rule 9; tested)
    var out = { cycle: n, capital: capital, supRep: tidy(sr / n), staff: tidy(st / n) };
    out.total = tidy(out.capital + out.supRep + out.staff);
    return out;
  }

  /** The cycle with the lowest total among points in ascending cycle order (rule 5). Tie-break: `<=`, so on equal
      (tidied) totals the later, longer cycle wins. */
  function lowest(points) {
    var best = null;
    points.forEach(function (d) { if (best === null || d.total <= best.total) best = d; });
    return best.cycle;
  }

  /** The curve over every cycle and its minimum, the economic life (rule 5). */
  function curve(slow, staff) {
    var pts = [];
    for (var n = CYCLE_MIN; n <= CYCLE_MAX; n++) pts.push(perDevice(n, slow, staff));
    return { points: pts, econ: lowest(pts) };
  }

  // ── the fleet: rules 2, 6, 7 ──

  /** Cohort sizes (the first N mod c get one more) and offsets ⌊i·n/c⌋. */
  function cohortsOf(n, c) {
    var out = [];
    for (var i = 0; i < c; i++) out.push({ size: Math.floor(FLEET / c) + (i < FLEET % c ? 1 : 0), offset: Math.floor(i * n / c) });
    return out;
  }
  /** A cohort's age in year y (y may be 0: the year before the run). */
  function ageIn(y, n, offset) { return (((y - 1 - offset) % n) + n) % n + 1; }

  /** The fleet's book value at the end of year y (rule 7). */
  function fleetBook(n, c, y) {
    var sched = deviceSchedule(n), v = 0;
    cohortsOf(n, c).forEach(function (k) { v += k.size * As.bookAt(sched, PRICE, ageIn(y, n, k.offset)); });
    return tidy(v);
  }

  function fleetYears(p) {
    var n = p.cycle, R = resale(n), slDep = (PRICE - R) / n, co = cohortsOf(n, p.cohorts), rows = [];
    for (var y = 1; y <= YEARS; y++) {
      var r = { year: y, bought: 0, purchases: 0, resale: 0, supRep: 0, staff: 0, dep: 0 };
      co.forEach(function (k) {
        var a = ageIn(y, n, k.offset);
        if (a === 1) r.bought += k.size;
        r.supRep += k.size * supRep(a);
        r.staff += k.size * staffCost(a, p.slow, p.staff);
        r.dep += k.size * slDep;                      // asset.js 'sl' amount, untidied so 240 × it rounds exactly
      });
      r.purchases = r.bought * PRICE;
      r.resale = tidy(r.bought * R);
      r.supRep = tidy(r.supRep);
      r.staff = tidy(r.staff);
      r.dep = tidy(r.dep);
      r.cash = tidy(r.purchases - r.resale + r.supRep);
      r.expense = tidy(r.dep + r.supRep);
      rows.push(r);
    }
    return rows;
  }

  /** A series shown in whole euros: differences of its rounded cumulative sums (rule 9). */
  function shownSeries(xs) {
    var out = [], acc = 0, prev = 0;
    xs.forEach(function (x) { acc = tidy(acc + x); var r = As.roundMoney(acc); out.push(r - prev); prev = r; });
    return out;
  }
  function sum(xs) { return xs.reduce(function (a, x) { return a + x; }, 0); }

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var cv = curve(p.slow, p.staff);
    var alt = curve(p.slow, !p.staff).econ;
    var rows = fleetYears(p);
    var col = function (k) { return rows.map(function (r) { return r[k]; }); };
    var shown = { cash: shownSeries(col('cash')), expense: shownSeries(col('expense')), dep: shownSeries(col('dep')), staff: shownSeries(col('staff')) };
    var exactCash = tidy(sum(col('cash')));
    var peak = rows[0];
    rows.forEach(function (r) { if (r.cash > peak.cash) peak = r; });   // strict: the earliest wins a tie (rule 8)
    var chosen = cv.points[p.cycle - CYCLE_MIN], best = cv.points[cv.econ - CYCLE_MIN];
    var sched = deviceSchedule(p.cycle);
    return {
      p: p,
      curve: cv.points,
      econ: cv.econ,
      econAlt: alt,
      chosen: chosen,
      excess: tidy(chosen.total - best.total),             // € per device a year above the economic life
      excessFleet: tidy((chosen.total - best.total) * FLEET),
      cohorts: cohortsOf(p.cycle, p.cohorts),
      years: rows,
      shown: shown,
      totals: { cash: sum(shown.cash), expense: sum(shown.expense), dep: sum(shown.dep), staff: sum(shown.staff) },
      peak: { year: peak.year, cash: peak.cash, ratio: tidy(peak.cash / (exactCash / YEARS)) },
      wallYears: rows.filter(function (r) { return r.bought === FLEET; }).map(function (r) { return r.year; }),
      book: { start: fleetBook(p.cycle, p.cohorts, 0), end: fleetBook(p.cycle, p.cohorts, YEARS) },
      sale: As.disposal(sched, PRICE, p.cycle, resale(p.cycle)).outcome
    };
  }

  /** Changed marks (rule 10): 'econ' when the economic life moved, and the total rows whose shown value changed
      ('total': the chosen cycle's cost per device a year). */
  function changed(prev, next) {
    if (!prev || !next) return [];
    var out = prev.econ !== next.econ ? ['econ'] : [];
    if (As.roundMoney(prev.chosen.total) !== As.roundMoney(next.chosen.total)) out.push('total');
    ['cash', 'expense', 'staff'].forEach(function (k) { if (prev.totals[k] !== next.totals[k]) out.push(k); });
    if (prev.peak.ratio !== next.peak.ratio) out.push('ratio');
    return out;
  }

  /** Caption keys (SPEC.md "Captions"). */
  function captionKey(s) {
    var n = s.p.cycle, c = s.p.cohorts;
    return {
      lead: c === 1 ? 'leadOne' : c === n ? 'leadEvery' : 'leadSome',
      econ: n === s.econ ? 'atEcon' : n < s.econ ? 'belowEcon' : 'aboveEcon',
      cash: c === 1 ? 'cashWall' : c === n ? 'cashFlat' : 'cashSpread',
      note: !s.p.staff ? 'nBudget' : c === 1 ? 'nStagger' : 'nSame'
    };
  }

  var logic = {
    FLEET: FLEET, PRICE: PRICE, KEEP: KEEP, WARRANTY: WARRANTY, SUPPORT: SUPPORT, REPAIR: REPAIR, FAIL1: FAIL1,
    FAILGROW: FAILGROW, HOURS_FAIL: HOURS_FAIL, HOURLY: HOURLY, YEARS: YEARS,
    CYCLE_MIN: CYCLE_MIN, CYCLE_MAX: CYCLE_MAX, SLOW_MAX: SLOW_MAX, SLOW_STEP: SLOW_STEP,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    resale: resale,
    failRate: failRate,
    supRep: supRep,
    staffCost: staffCost,
    perDevice: perDevice,
    lowest: lowest,
    curve: curve,
    cohortsOf: cohortsOf,
    ageIn: ageIn,
    fleetBook: fleetBook,
    fleetYears: fleetYears,
    shownSeries: shownSeries,
    changed: changed,
    captionKey: captionKey
  };

  if (node) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
