/* SPDX-License-Identifier: AGPL-3.0-or-later
   The crew and its chain (catalogue §5.25): departments with their heads, the 1st AD in the middle of the floor, and
   who passes a message to whom, hop by hop. Built here first, because set-stop-for-safety (the planned hub of this
   model) was not merged when set-chain-of-command was built; set-stop-for-safety and set-who-touches-what read the same
   crew. Pure functions over plain data, no words and no dependencies, ready for the coordinator to promote to
   models/set-crew.js unchanged (models/README.md). In a page it registers on globalThis.SimdeckModels['set-crew'];
   under node it is module.exports.
   One fictional production; the roles are generic, no names. Rules: SPEC.md rules 1-3.
   Copied unchanged from sims/set-chain-of-command/crew.js @ d7b6298 (COMMON.md §6: models/ has no set-crew yet); only
   this comment differs. set-stop-for-safety reads the people, their departments and heads and their line up. */
(function (root) {
  'use strict';

  /** The people on the floor (SPEC.md rule 1). `dept` is their department, `head` marks its head, `via` is the one
      person they pass messages through (their line up); the 1st AD has none, so the lines form one tree rooted at the
      1st AD. `decides` names what a head decides (an id, the page gives the words). Order is the drawing order and the
      tie-break order everywhere. */
  var PEOPLE = [
    { id: 'prod', dept: 'production', head: true, via: 'ad1', decides: 'money' },
    { id: 'dir', dept: 'direction', head: true, via: 'ad1', decides: 'shot' },
    { id: 'ad1', dept: 'ad', head: true, via: null, decides: 'floor' },
    { id: 'trainee', dept: 'ad', head: false, via: 'ad1' },
    { id: 'actor', dept: 'cast', head: false, via: 'ad1' },
    { id: 'dop', dept: 'camera', head: true, via: 'ad1', decides: 'look' },
    { id: 'snd', dept: 'sound', head: true, via: 'ad1', decides: 'sound' },
    { id: 'pmast', dept: 'props', head: true, via: 'ad1', decides: 'props' },
    { id: 'op', dept: 'camera', head: false, via: 'dop' },
    { id: 'gaf', dept: 'electric', head: true, via: 'dop', decides: 'lamps' },
    { id: 'kg', dept: 'grip', head: true, via: 'dop', decides: 'stands' },
    { id: 'boom', dept: 'sound', head: false, via: 'snd' },
    { id: 'prop', dept: 'props', head: false, via: 'pmast' },
    { id: 'el', dept: 'electric', head: false, via: 'gaf' },
    { id: 'gr', dept: 'grip', head: false, via: 'kg' }
  ];

  var BY_ID = {};
  PEOPLE.forEach(function (p, i) { BY_ID[p.id] = { p: p, i: i }; });

  function person(id) {
    var e = BY_ID[id];
    if (!e) throw new Error('unknown person: ' + id);
    return e.p;
  }

  /** The head of a department (rule 1: every department has exactly one, except the cast, who go through the 1st AD:
      null). */
  function headOf(dept) {
    for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i].dept === dept && PEOPLE[i].head) return PEOPLE[i].id;
    return null;
  }

  /** The chain from a person up to the 1st AD, the person first. */
  function upChain(id) {
    var out = [id];
    var p = person(id);
    while (p.via) { out.push(p.via); p = person(p.via); }
    return out;
  }

  /** Rule 2: the path along the lines from a to b, both ends included: up from a to the first person both chains
      share, then down to b. The lines form a tree, so the path is unique. */
  function path(a, b) {
    if (a === b) return [a];
    var ua = upChain(a), ub = upChain(b);
    var meet = -1, j = -1;
    for (var i = 0; i < ua.length; i++) { j = ub.indexOf(ua[i]); if (j >= 0) { meet = i; break; } }
    return ua.slice(0, meet + 1).concat(ub.slice(0, j).reverse());
  }

  /** The lines of the chain: each person's line up, as [person, via] pairs, in PEOPLE order. */
  function lines() {
    return PEOPLE.filter(function (p) { return p.via; }).map(function (p) { return [p.id, p.via]; });
  }

  /** Rule 3: n people who may all talk to each other have n(n-1)/2 possible lines; through the heads each person has
      one line up, n - 1 lines in all (a tree). */
  function linksAll(n) { return n * (n - 1) / 2; }
  function linksChain(n) { return n > 0 ? n - 1 : 0; }

  /** True when a and b share a line of the chain. */
  function isLine(a, b) { return person(a).via === b || person(b).via === a; }

  var model = {
    PEOPLE: PEOPLE,
    person: person,
    index: function (id) { return BY_ID[id].i; },
    headOf: headOf,
    upChain: upChain,
    path: path,
    lines: lines,
    isLine: isLine,
    linksAll: linksAll,
    linksChain: linksChain
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['set-crew'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
