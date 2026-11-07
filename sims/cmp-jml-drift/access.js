/* SPDX-License-Identifier: AGPL-3.0-or-later
   People × roles × rights over time (catalogue §5.24; the hub is cmp-jml-drift, cmp-sod-toxic and
   cmp-privileged-access read the same assignments). A department of four teams, each team's job needing five rights;
   two years of joiners, movers, leavers and one-off requests drawn once from a seed, then replayed under a set of
   controls (HR-driven leavers, roles, removal on move, a quarterly access review). SPEC.md rules 1-8.
   Pure functions over plain data, no words and no dependencies, ready to be promoted to models/access-rights.js
   unchanged (models/README.md). Rights are bit masks (right r is bit r). In a page it registers on
   globalThis.SimdeckModels['access-rights']; under node it is module.exports. */
(function (root) {
  'use strict';

  /** Rule 1: the department. */
  var TEAMS = 4;                // sales, finance, support, logistics (words in strings.js)
  var PER_TEAM = 5;             // rights each team's job needs; right r belongs to team ⌊r / 5⌋
  var RIGHTS = TEAMS * PER_TEAM;
  var SIZE = 12;                // people per team at the start; every leaver is replaced in the same team
  var MONTHS = 24;
  var EVERY = 3;                // the review runs at the end of months 3, 6, … 24
  /** Rule 2: monthly chances per person (illustrative). */
  var LEAVE = 0.02;             // ≈ 21 % a year
  var TOLD = 0.5;               // without HR's record, the manager tells IT on the last day half the time
  var MOVE = 0.015;             // ≈ 17 % a year
  var REQUEST = 0.05;           // asks for one right outside the job, about every 20 months
  var DRAWS = 6;                // draws per active person per month, always all six

  /** mulberry32, the same generator as Simdeck.rng in kit/kit.js: a function returning [0, 1). */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** The rights team t's job needs. */
  function teamMask(t) { return ((1 << PER_TEAM) - 1) << (PER_TEAM * t); }
  function teamOf(right) { return Math.floor(right / PER_TEAM); }
  /** The rights a set of roles (a mask of teams) grants. */
  function rolesMask(roles) {
    var m = 0;
    for (var t = 0; t < TEAMS; t++) if (roles & (1 << t)) m |= teamMask(t);
    return m;
  }
  function popcount(x) {
    var n = 0;
    while (x) { x &= x - 1; n++; }
    return n;
  }
  /** Rule 2: the k-th right (0…14) outside team t, in right order. */
  function outsideRight(t, k) {
    var i = -1;
    for (var r = 0; r < RIGHTS; r++) {
      if (teamOf(r) === t) continue;
      if (++i === k) return r;
    }
    return -1;
  }
  /** Rule 2: an event happens when its draw is strictly below its chance (equal: it does not). */
  function fires(u, p) { return u < p; }
  /** Rule 2: the team a mover goes to: one of the other three, from a draw in [0, 1). */
  function moveTo(from, u) { return (from + 1 + Math.floor(u * (TEAMS - 1))) % TEAMS; }

  /** Rule 2: two years of events, the same under every set of controls. Each month every active person, in id order,
      takes six draws: leave, told, move, where to, request, which right. A leaver neither moves nor requests. Then
      one joiner per leaver, in the leaver's order, into the leaver's team, with a seventh draw picking the colleague
      whose account IT copies (among the team's people active after this month's leavers, before its joiners, by id).
      A mover's request is for a right outside the new team. */
  function events(seed) {
    var r = rng(seed);
    var team = {}, ids = [], next = TEAMS * SIZE + 1;
    for (var id = 1; id < next; id++) { team[id] = Math.floor((id - 1) / SIZE); ids.push(id); }
    var start = ids.map(function (i) { return { id: i, team: team[i] }; });
    var months = [null];
    for (var m = 1; m <= MONTHS; m++) {
      var leaves = [], moves = [], requests = [], joins = [];
      ids.forEach(function (i) {
        var u = [];
        for (var k = 0; k < DRAWS; k++) u.push(r());
        if (fires(u[0], LEAVE)) { leaves.push({ id: i, team: team[i], told: fires(u[1], TOLD) }); return; }
        var t = team[i];
        if (fires(u[2], MOVE)) { var to = moveTo(t, u[3]); moves.push({ id: i, from: t, to: to }); t = to; }
        if (fires(u[4], REQUEST)) requests.push({ id: i, right: outsideRight(t, Math.floor(u[5] * (RIGHTS - PER_TEAM))) });
      });
      var gone = {};
      leaves.forEach(function (x) { gone[x.id] = true; });
      var stay = ids.filter(function (i) { return !gone[i]; });
      leaves.forEach(function (x) {
        var mates = stay.filter(function (i) { return team[i] === x.team; });
        var u = r();
        joins.push({ id: next, team: x.team, copy: mates.length ? mates[Math.floor(u * mates.length)] : null });
        team[next] = x.team;
        next++;
      });
      moves.forEach(function (x) { team[x.id] = x.to; });
      ids = stay.concat(joins.map(function (x) { return x.id; }));
      months.push({ leaves: leaves, joins: joins, moves: moves, requests: requests });
    }
    return { start: start, months: months };
  }

  /** The rights an account holds. */
  function rightsOf(a) { return a.direct | rolesMask(a.roles); }
  /** Rights the account holds that its current job does not need (all of them once the person has left). */
  function excessOf(a) { return a.left === null ? rightsOf(a) & ~teamMask(a.team) : rightsOf(a); }
  /** Rule 6: the lines an access review lists for an account: one per role it holds, one per right granted directly. */
  function linesOf(a) { return popcount(a.roles) + popcount(a.direct); }

  /** Rule 3: a new account: the role, or the job's rights plus a copy of the colleague's. */
  function account(id, team, ctl, copy) {
    var a = { id: id, team: team, left: null, on: true, roles: 0, direct: 0 };
    if (ctl.roles) a.roles = 1 << team;
    else a.direct = teamMask(team) | (copy ? rightsOf(copy) : 0);
    return a;
  }

  /** Rule 6: where an account sits in the review list, a fixed number in [0, 1) per person and seed (the list is
      sorted by name, and a name says nothing about the person's rights). */
  function nameKey(seed, id) {
    return rng(((seed >>> 0) ^ Math.imul(id, 0x9e3779b1)) >>> 0)();
  }
  /** Rule 6: accounts in list order: by key(id), ties by id. */
  function orderOf(list, key) {
    return list.slice().sort(function (x, y) { return key(x.id) - key(y.id) || x.id - y.id; });
  }
  /** Rule 6: an account's review lines in list order: its roles (100 + team), then its direct rights. */
  function lineList(a) {
    var out = [];
    for (var t = 0; t < TEAMS; t++) if (a.roles & (1 << t)) out.push(100 + t);
    for (var r = 0; r < RIGHTS; r++) if (a.direct & (1 << r)) out.push(r);
    return out;
  }

  /** Rule 6: one access review at the end of month m. Each reviewer gets the lines of their scope (one reviewer: the
      whole department; team leads: the accounts of their team, a leaver's by the team they left), sorted by name
      (nameKey, ties by id), each account's lines in lineList order. The reviewer reads the first `care` lines with
      care and approves the rest unread. A read line that the job does not need is removed; a read line of a leaver
      closes the account. */
  function review(accts, m, ctl, seed) {
    var groups = {};
    accts.forEach(function (a) {
      if (!a.on) return;
      var g = ctl.review === 'teams' ? a.team : 0;
      (groups[g] = groups[g] || []).push(a);
    });
    var out = { month: m, lines: 0, reviewers: 0, perReviewer: 0, checked: 0,
      excess: 0, removed: 0, orphans: 0, closed: 0 };
    Object.keys(groups).sort(function (x, y) { return x - y; }).forEach(function (g) {
      var list = orderOf(groups[g], function (id) { return nameKey(seed, id); });
      var L = 0;
      list.forEach(function (a) { L += linesOf(a); });
      out.reviewers++; out.lines += L; if (L > out.perReviewer) out.perReviewer = L;
      var left = ctl.care;                                  // lines still to be read with care
      list.forEach(function (a) {
        var orphan = a.left !== null, before = popcount(excessOf(a)), hit = false;
        if (orphan) out.orphans++; else out.excess += before;
        lineList(a).forEach(function (line) {
          if (left <= 0) return;                            // approved unread
          left--; out.checked++;
          if (orphan) { hit = true; return; }
          if (line >= 100) { if (line - 100 !== a.team) a.roles &= ~(1 << (line - 100)); }
          else if (teamOf(line) !== a.team) a.direct &= ~(1 << line);
        });
        if (orphan && hit) { a.on = false; out.closed++; }
        if (!orphan) out.removed += before - popcount(excessOf(a));
      });
    });
    return out;
  }

  /** a ÷ b in tenths, halves up, in integers (b > 0). */
  function tenths(a, b) { return Math.floor((20 * a + b) / (2 * b)); }

  /** Rule 7: what one month ends with. */
  function snapshot(accts) {
    var people = 0, excess = 0, orphans = 0, orphanRights = 0, lines = 0;
    accts.forEach(function (a) {
      if (!a.on) return;
      lines += linesOf(a);
      if (a.left === null) { people++; excess += popcount(excessOf(a)); }
      else { orphans++; orphanRights += popcount(rightsOf(a)); }
    });
    return { people: people, excess: excess, excess10: people ? tenths(excess, people) : 0,
      orphans: orphans, orphanRights: orphanRights, lines: lines };
  }

  /** Rules 3-7: replay the events under a set of controls { hr, roles, move, review: 'off' | 'one' | 'teams', care }.
      Each month in this order: leavers, joiners, movers, requests, then the review at the end of every third month.
      Returns the month-end numbers 0…24, the reviews, the unneeded rights joiners got with a copy per month (0…24),
      and the accounts at the end of month `at` (copies). */
  function replay(ev, ctl, seed, at) {
    var accts = ev.start.map(function (p) { return account(p.id, p.team, ctl, null); });
    var byId = {};
    accts.forEach(function (a) { byId[a.id] = a; });
    var series = [snapshot(accts)], reviews = [], copied = [0], held = at === 0 ? copy(accts) : null;
    for (var m = 1; m <= MONTHS; m++) {
      var e = ev.months[m];
      e.leaves.forEach(function (x) {
        var a = byId[x.id];
        a.left = m;
        if (ctl.hr || x.told) a.on = false;          // closed on the last day
      });
      var c = 0;
      e.joins.forEach(function (x) {
        var a = account(x.id, x.team, ctl, x.copy === null ? null : byId[x.copy]);
        accts.push(a); byId[a.id] = a;
        c += popcount(excessOf(a));                 // surplus a joiner got with the copy
      });
      copied.push(c);
      e.moves.forEach(function (x) {
        var a = byId[x.id];
        a.team = x.to;
        if (ctl.roles) {
          if (ctl.move) a.roles &= ~(1 << x.from);
          a.roles |= 1 << x.to;
        } else {
          if (ctl.move) a.direct &= ~teamMask(x.from);
          a.direct |= teamMask(x.to);
        }
      });
      e.requests.forEach(function (x) { byId[x.id].direct |= 1 << x.right; });
      if (ctl.review !== 'off' && m % EVERY === 0) reviews.push(review(accts, m, ctl, seed));
      series.push(snapshot(accts));
      if (m === at) held = copy(accts);
    }
    return { series: series, reviews: reviews, copied: copied, accounts: held };
  }
  function copy(accts) { return accts.map(function (a) { return Object.assign({}, a); }); }

  var model = {
    TEAMS: TEAMS, PER_TEAM: PER_TEAM, RIGHTS: RIGHTS, SIZE: SIZE, MONTHS: MONTHS, EVERY: EVERY,
    LEAVE: LEAVE, TOLD: TOLD, MOVE: MOVE, REQUEST: REQUEST, DRAWS: DRAWS,
    rng: rng,
    teamMask: teamMask,
    teamOf: teamOf,
    rolesMask: rolesMask,
    popcount: popcount,
    outsideRight: outsideRight,
    fires: fires,
    moveTo: moveTo,
    events: events,
    rightsOf: rightsOf,
    excessOf: excessOf,
    linesOf: linesOf,
    account: account,
    nameKey: nameKey,
    lineList: lineList,
    orderOf: orderOf,
    review: review,
    snapshot: snapshot,
    tenths: tenths,
    replay: replay
  };

  if (typeof module === 'object' && module.exports) module.exports = model;
  else (root.SimdeckModels = root.SimdeckModels || {})['access-rights'] = model;
})(typeof globalThis !== 'undefined' ? globalThis : this);
