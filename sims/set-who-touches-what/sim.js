/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-who-touches-what: twelve small problems on the set of one fictional production. For each one the learner picks
   who sorts it out: one of the ten departments, the 1st AD ("I don't know whose this is"), or "I fix it myself". The
   owning department fixes its own thing; a wrong department does not touch it and passes it on; the 1st AD sends it to
   the owner; and a well-meant fix by someone from another department makes the visible problem go away at once but
   breaks something they could not see (a stand off its sandbag, a cup that no longer matches the last take, a hot lamp,
   a camera setting changed). Minutes now (until the problem is gone) and minutes later (what the hidden damage costs
   the day) are illustrative. An explorer: the state follows from the params.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. Rules: SPEC.md. */
(function (root) {
  'use strict';

  var dep = typeof module === 'object' && module.exports
    ? require('./departments.js')
    : root.SimdeckModels['set-departments'];
  var crew = dep.crew;

  /** Rule 3: the problems, in the page's order. `thing` is the kind of thing it is about (its owner follows from
      rule 2); `fix` the minutes the owning department needs; `harm` what a fix by an outsider breaks (injury,
      continuity, spoiled take or footage, damage to property) and `cost` the minutes that costs the day later.
      Illustrative minutes. */
  var PROBLEMS = [
    { id: 'flag', thing: 'flag', fix: 2, harm: 'injury', cost: 20 },
    { id: 'cup', thing: 'prop', fix: 2, harm: 'continuity', cost: 30 },
    { id: 'cable', thing: 'cable', fix: 3, harm: 'spoiled', cost: 10 },
    { id: 'curtain', thing: 'lamp', fix: 2, harm: 'injury', cost: 20 },
    { id: 'coat', thing: 'clothing', fix: 5, harm: 'damage', cost: 45 },
    { id: 'monitor', thing: 'camera', fix: 2, harm: 'spoiled', cost: 40 },
    { id: 'pack', thing: 'transmitter', fix: 3, harm: 'spoiled', cost: 15 },
    { id: 'vase', thing: 'dressing', fix: 2, harm: 'continuity', cost: 25 },
    { id: 'shine', thing: 'face', fix: 2, harm: 'continuity', cost: 20 },
    { id: 'armchair', thing: 'owner', fix: 5, harm: 'damage', cost: 30 },
    { id: 'van', thing: 'transport', fix: 4, harm: 'damage', cost: 30 },
    { id: 'track', thing: 'track', fix: 4, harm: 'spoiled', cost: 15 }
  ];
  var IDS = PROBLEMS.map(function (x) { return x.id; });
  var HARMS = ['injury', 'continuity', 'spoiled', 'damage'];

  /** Rule 4: minutes. SELF: an outsider's own fix makes the problem look gone in a minute. PASS: a wrong department's
      head passes it on to the owner. AD: the 1st AD calls the owning head. */
  var SELF = 1;
  var PASS = 3;
  var AD = 2;

  /** Who "you" can be: people of the shared crew (an AD trainee, owns nothing; a grip; an electrician; a props
      assistant; a boom operator). */
  var YOU = ['trainee', 'gr', 'el', 'prop', 'boom'];

  /** The choices for a problem: '' (not decided yet), 'self', 'ad', or a department. */
  var CHOICES = ['self'].concat(dep.DEPTS).concat(['ad']);

  function key(id) { return 'p_' + id; }

  var defaults = { you: 'trainee', sel: 'flag' };
  IDS.forEach(function (id) { defaults[key(id)] = ''; });

  function withDefaults(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  function problem(id) {
    var i = IDS.indexOf(id);
    if (i < 0) throw new Error('unknown problem: ' + id);
    return PROBLEMS[i];
  }
  function ownerOfProblem(id) { return dep.ownerOf(problem(id).thing); }

  /** The same choice for every problem. */
  function all(fn, extra) {
    var o = {};
    IDS.forEach(function (id) { o[key(id)] = fn(id); });
    Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }

  /** "Guessed by the look" (preset look): the department a newcomer would guess from what it looks like. Six of the
      twelve guesses are wrong (SPEC.md, presets). */
  var LOOK = {
    flag: 'electric', cup: 'art', cable: 'grip', curtain: 'electric', coat: 'costume', monitor: 'camera',
    pack: 'costume', vase: 'props', shine: 'makeup', armchair: 'art', van: 'production', track: 'grip'
  };

  /** Presets (SPEC.md "Presets"): only what differs from the defaults. */
  var presets = [
    { id: 'start', params: {} },
    { id: 'self', params: all(function () { return 'self'; }) },
    { id: 'owner', params: all(ownerOfProblem) },
    { id: 'look', params: all(function (id) { return LOOK[id]; }, { sel: 'cup' }) },
    { id: 'ad', params: all(function () { return 'ad'; }) },
    { id: 'grip', params: all(function () { return 'self'; }, { you: 'gr' }) }
  ].map(function (x) { return { id: x.id, params: withDefaults(x.params) }; });

  /** Who you are; anything else reads as the first (the AD trainee). */
  function youOf(p) { return YOU.indexOf(p.you) >= 0 ? p.you : YOU[0]; }
  /** The choice for a problem; anything that is not a known choice reads as not decided (''). */
  function choiceOf(p, id) { var c = p[key(id)]; return CHOICES.indexOf(c) >= 0 ? c : ''; }

  /** Rule 5: the outcome of one choice for one problem, for a person `you`. In this order:
      a. not decided: open, nothing happens yet;
      b. the owning department: fixed, after `fix` minutes;
      c. "myself", and you belong to the owning department: your own department's work, fixed after `fix` (same as b);
      d. "myself" otherwise: the problem looks gone after SELF, and the hidden harm costs `cost` later;
      e. the 1st AD: sends it to the owner, fixed after AD + fix;
      f. any other department (your own included, when it does not own it): they do not touch it, their head passes it
         on, fixed after PASS + fix. */
  function outcome(id, choice, you) {
    var x = problem(id), owner = dep.ownerOf(x.thing);
    if (choice === '' || CHOICES.indexOf(choice) < 0) return { kind: 'open', now: null, later: 0, by: null };
    if (choice === owner) return { kind: 'fixed', now: x.fix, later: 0, by: owner };
    if (choice === 'self') {
      if (dep.deptOf(you) === owner) return { kind: 'own', now: x.fix, later: 0, by: owner };
      return { kind: 'harm', now: SELF, later: x.cost, by: null, harm: x.harm };
    }
    if (choice === 'ad') return { kind: 'routed', now: AD + x.fix, later: 0, by: owner };
    return { kind: 'passed', now: PASS + x.fix, later: 0, by: owner, via: choice };
  }

  /** Rule 6: the day's totals over the twelve problems. */
  function totals(rows) {
    var t = { open: 0, fixed: 0, own: 0, routed: 0, passed: 0, harm: 0, now: 0, later: 0, total: 0 };
    HARMS.forEach(function (h) { t[h] = 0; });
    rows.forEach(function (r) {
      t[r.kind]++;
      if (r.kind === 'harm') t[r.harm]++;
      t.now += r.now || 0;
      t.later += r.later;
    });
    t.total = t.now + t.later;
    return t;
  }

  function rowsFor(choices, you) {
    return PROBLEMS.map(function (x) {
      var o = outcome(x.id, choices[x.id], you);
      o.id = x.id;
      o.owner = dep.ownerOf(x.thing);
      o.head = dep.headOf(o.owner);
      o.choice = choices[x.id];
      return o;
    });
  }

  /** Rule 7: the three plain strategies for the same person, for comparison: everything to the owner, everything to
      the 1st AD, everything yourself. */
  function strategies(you) {
    function by(fn) { var c = {}; IDS.forEach(function (id) { c[id] = fn(id); }); return totals(rowsFor(c, you)); }
    return {
      owner: by(ownerOfProblem),
      ad: by(function () { return 'ad'; }),
      self: by(function () { return 'self'; })
    };
  }

  /** The whole state from the params. */
  function derive(p) {
    var you = youOf(p);
    var choices = {};
    IDS.forEach(function (id) { choices[id] = choiceOf(p, id); });
    var rows = rowsFor(choices, you);
    var sel = IDS.indexOf(p.sel) >= 0 ? p.sel : IDS[0];
    return { you: you, youDept: dep.deptOf(you), sel: sel, rows: rows, totals: totals(rows), compare: strategies(you) };
  }

  var logic = {
    PROBLEMS: PROBLEMS, IDS: IDS, HARMS: HARMS, SELF: SELF, PASS: PASS, AD: AD, YOU: YOU, CHOICES: CHOICES, LOOK: LOOK,
    dep: dep, crew: crew,
    defaults: defaults, presets: presets, withDefaults: withDefaults, key: key,
    problem: problem, ownerOfProblem: ownerOfProblem, youOf: youOf, choiceOf: choiceOf,
    outcome: outcome, totals: totals, rowsFor: rowsFor, strategies: strategies,
    initial: derive, derive: derive
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
