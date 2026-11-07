/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cmp-sod-toxic: a small firm's team of 3-12 people, eight duties in four toxic pairs (request and approve
   a purchase, create and pay a supplier, write code and deploy it, run the backups and manage the logs). The student
   assigns duties, the conflict matrix lights up where one person holds both duties of a pair, and each conflict is
   split, covered by a compensating control or accepted with a signature; with fewer people (or a deputy for every
   duty) some conflicts cannot be separated. Explorer: the state is a pure function of the params (compute). Rules:
   SPEC.md. Duties, conflicts, sharing out, splitting and the control live in sod.js (promotable to models/); this file
   adds the params, presets, resolutions, the page's numbers and the caption.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. */
(function (root) {
  'use strict';

  var D = typeof module === 'object' && module.exports
    ? require('./sod.js')
    : root.SimdeckModels.sod;

  var RES = ['open', 'control', 'accept'];      // a conflict's resolution, digit k (base 3) of r<i> is pair k's
  var RES_MAX = 80;                             // 3^4 − 1
  var N = D.MAX_TEAM;

  /** Every param: team, deputies, edit, and per person m<i> (duties, a mask) and r<i> (resolutions, base 3). */
  function P(over) {
    var p = { team: 6, deputies: false, edit: false };
    for (var i = 0; i < N; i++) { p['m' + i] = 0; p['r' + i] = 0; }
    return Object.assign(p, over);
  }
  /** Masks from a list of duty lists, for presets. */
  function masksOf(list) {
    var out = {};
    list.forEach(function (ds, i) { out['m' + i] = ds.reduce(function (m, d) { return m | (1 << d); }, 0); });
    return out;
  }
  /** Rule 10: the presets, SPEC.md table; expected numbers there. */
  var presets = [
    { id: 'mixed', params: P(Object.assign({ team: 6, edit: true }, masksOf([
      [D.REQUEST, D.APPROVE, D.CREATE], [D.CODE, D.DEPLOY], [D.PAY], [D.BACKUPS, D.LOGS], [D.PAY], [D.CODE]]))) },
    { id: 'separated', params: P({ team: 6 }) },
    { id: 'cover', params: P({ team: 6, deputies: true }) },
    { id: 'three', params: P({ team: 3, r1: 9 }) },
    { id: 'own-log', params: P(Object.assign({ team: 3, edit: true, r1: 36 }, masksOf([
      [D.REQUEST, D.CREATE], [D.CODE, D.DEPLOY, D.BACKUPS, D.LOGS], [D.APPROVE, D.PAY]]))) },
    { id: 'eight', params: P({ team: 8, deputies: true }) }
  ];
  var defaults = Object.assign({}, presets[0].params);

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function num(v, dflt) {
    if (typeof v === 'string' ? v.trim() === '' : typeof v !== 'number') return dflt;
    var x = Number(v);
    return Number.isFinite(x) ? x : dflt;
  }
  function bool(v, dflt) {
    if (v === true || v === 'true' || v === 1 || v === '1') return true;
    if (v === false || v === 'false' || v === 0 || v === '0') return false;
    return dflt;
  }

  /** Rule 9: params made safe (a URL may carry anything). A mask loses the duties its person may not hold. */
  function normalise(p) {
    var q = Object.assign({}, defaults, p);
    var out = {
      team: clamp(Math.round(num(q.team, defaults.team)), D.MIN_TEAM, D.MAX_TEAM),
      deputies: bool(q.deputies, defaults.deputies),
      edit: bool(q.edit, defaults.edit)
    };
    for (var i = 0; i < N; i++) {
      out['m' + i] = clamp(Math.round(num(q['m' + i], 0)), 0, D.ALL) & D.eligibleMask(D.deptOf(i));
      out['r' + i] = clamp(Math.round(num(q['r' + i], 0)), 0, RES_MAX);
    }
    return out;
  }

  /** Rule 9: the resolution of person i's conflict in pair k: digit k of r<i> in base 3. */
  function resOf(p, i, k) { return RES[Math.floor(p['r' + i] / Math.pow(3, k)) % 3]; }
  /** Rule 9: r<i> with digit k set to res (for the page). */
  function withRes(r, k, res) {
    var w = Math.pow(3, k), old = Math.floor(r / w) % 3;
    return r + (RES.indexOf(res) - old) * w;
  }

  /** Rule 9: the masks in use: the student's (edit on) for the first `team` people, or the shared-out ones. */
  function masksIn(p) {
    if (!p.edit) return D.share(p.team, p.deputies);
    var out = [];
    for (var i = 0; i < p.team; i++) out.push(p['m' + i]);
    return out;
  }

  /** Rule 11: what a resolution does to a conflict: 'open' (nothing finds it), 'detected' (a control that holds),
      'accepted' (signed; nothing finds it, but it is a decision on record). A control that does not hold is open. */
  function outcomeOf(res, ctl) {
    if (res === 'accept') return 'accepted';
    if (res === 'control' && ctl.ok) return 'detected';
    return 'open';
  }
  var WORST = ['detected', 'accepted', 'open'];   // rule 11: a matrix cell shows its worst conflict

  /** Everything the page shows, from the params. */
  function compute(params) {
    var p = normalise(params);
    var people = D.team(p.team), depts = people.map(function (x) { return x.dept; });
    var masks = masksIn(p);
    var min = D.minimum(p.team, p.deputies);
    var counts = { conflicts: 0, open: 0, detected: 0, accepted: 0, badControl: 0 };
    var pairState = [null, null, null, null];
    var list = D.conflicts(masks).map(function (c) {
      var res = resOf(p, c.person, c.pair);
      var ctl = D.control(masks, c.person, c.pair);
      var out = outcomeOf(res, ctl);
      counts.conflicts++; counts[out]++;
      if (res === 'control' && !ctl.ok) counts.badControl++;
      if (pairState[c.pair] === null || WORST.indexOf(out) > WORST.indexOf(pairState[c.pair])) pairState[c.pair] = out;
      return { person: c.person, pair: c.pair, res: res, outcome: out, ctl: ctl,
        canSplit: D.split(masks, c.person, c.pair, depts) !== null };
    });
    var short = D.uncovered(masks, p.deputies);
    var verdict = short.length || counts.open ? 'finding' : counts.conflicts ? 'managed' : 'clean';
    return {
      p: p,
      people: people,
      office: people.filter(function (x) { return x.dept === D.OFFICE; }).length,
      it: people.filter(function (x) { return x.dept === D.IT; }).length,
      need: D.need(p.deputies),
      masks: masks,
      holders: D.holders(masks),
      short: short,
      matrix: D.matrix(masks),
      conflicts: list,
      pairState: pairState,
      counts: counts,
      min: min.total,
      minShort: min.short,
      avoidable: Math.max(0, counts.conflicts - min.total),
      verdict: verdict
    };
  }

  /** Rule 12: the caption: the main sentence by verdict, then at most two notes in this order of priority. A control
      without a reviewer (rule 8b) cannot happen in this team: for the money and production pairs the other
      department is always a reviewer, and for backups + logs the reason is always 'logs'. */
  function captionKey(s) {
    var notes = [];
    if (s.short.length) notes.push('nShort');
    if (s.conflicts.some(function (c) { return c.res === 'control' && c.ctl.why === 'logs'; })) notes.push('nLogs');
    if (s.min > 0) notes.push('nForced');
    if (s.avoidable > 0) notes.push('nAvoidable');
    var c = s.counts;
    var key = c.conflicts === 0 ? (s.short.length ? 'capShort' : 'capClean')
      : c.open ? 'capOpen' : !c.accepted ? 'capDetected' : !c.detected ? 'capAccepted' : 'capManaged';
    return { key: key, notes: notes.slice(0, 2) };
  }

  /** The people in column order: the office, then IT, each by id. */
  function columns(people) {
    return people.slice().sort(function (x, y) { return x.dept - y.dept || x.id - y.id; });
  }

  var logic = {
    RES: RES, RES_MAX: RES_MAX, MAX_TEAM: N,
    defaults: defaults,
    presets: presets,
    steps: 0,
    initial: function (p) { return compute(p); },
    compute: compute,
    normalise: normalise,
    resOf: resOf,
    withRes: withRes,
    masksIn: masksIn,
    outcomeOf: outcomeOf,
    captionKey: captionKey,
    columns: columns
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
