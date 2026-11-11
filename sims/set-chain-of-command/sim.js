/* SPDX-License-Identifier: AGPL-3.0-or-later
   set-chain-of-command: five requests cross the set, either straight to whoever is nearest or through the department
   head and the 1st AD. Both ways run side by side from the same start, one minute per step; the page draws one and
   counts both. Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON.
   The crew and its lines come from crew.js (the shared crew model, catalogue §5.25). Rules: SPEC.md. */
(function (root) {
  'use strict';

  var crew = typeof module === 'object' && module.exports
    ? require('./crew.js')
    : root.SimdeckModels['set-crew'];

  /** The five requests (SPEC.md rule 4), in tie-break order. `approvers` must say yes, in this order; `doer` carries it
      out; `near` is who stands nearest to the one asking (the direct way). A safety request's approvers are the 1st AD
      (who halts the work) and the head of the department that owns the hazard. */
  var REQUESTS = [
    { id: 'lamp', from: 'op', approvers: ['dop', 'gaf'], doer: 'el', near: 'el', safety: false },
    { id: 'overtime', from: 'dir', approvers: ['prod'], doer: 'ad1', near: 'dop', safety: false },
    { id: 'actor', from: 'actor', approvers: ['ad1'], doer: 'ad1', near: 'boom', safety: false },
    { id: 'exit', from: 'trainee', approvers: ['ad1', 'kg'], doer: 'gr', near: 'el', safety: true },
    { id: 'prop', from: 'dir', approvers: ['prod', 'pmast'], doer: 'prop', near: 'prop', safety: false }
  ];
  var REQ_INDEX = {};
  REQUESTS.forEach(function (r, i) { REQ_INDEX[r.id] = i; });

  var MODES = ['direct', 'chain'];

  function spec(id) { return REQUESTS[REQ_INDEX[id]]; }

  /** Rules 5 and 6: the route through the chain from `start`, visiting the approvers still to say yes, then the doer.
      Returns { route, how } where how[i] is the kind of hop route[i] -> route[i + 1]: 'line' along a line of the chain,
      'call' a safety call (out loud or on the radio, heard at once, not a line). */
  function chainRoute(start, r, left) {
    var route = [start], how = [];
    function add(to, kind) {
      if (route[route.length - 1] === to) return;
      route.push(to); how.push(kind);
    }
    function walk(to) {
      var p = crew.path(route[route.length - 1], to);
      for (var i = 1; i < p.length; i++) add(p[i], 'line');
    }
    if (r.safety) {
      // rule 6: straight to the 1st AD, the 1st AD straight to the owning head, the head sends their own crew
      add('ad1', 'call');
      add(crew.headOf(crew.person(r.doer).dept), 'call');
      walk(r.doer);
    } else {
      left.forEach(walk);
      walk(r.doer);
    }
    return { route: route, how: how };
  }

  function newReq(r) {
    return {
      id: r.id, status: 'idle', at: r.from, route: [r.from], how: [], hop: 0,
      sent: 0, ended: 0, arrived: 0, yes: [], direct: false, counterDue: 0, counterFrom: null
    };
  }

  function newRun(p) {
    return { reqs: REQUESTS.filter(function (r) { return !!p[r.id]; }).map(newReq), events: [], two: [] };
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /** Rule 7: what reaching `to` does to a request. */
  function arrive(q, r, to, m, mode, events) {
    if (r.approvers.indexOf(to) >= 0 && q.yes.indexOf(to) < 0) {
      q.yes.push(to);
      events.push({ kind: 'yes', req: q.id, at: to });
    }
    if (q.hop < q.route.length - 1) return;
    if (!q.direct) {
      q.status = 'done'; q.ended = m;
      events.push({ kind: 'done', req: q.id, at: to });
      return;
    }
    // rule 8: the direct way, at the person nearest
    q.direct = false;
    var near = crew.person(to);
    if (r.approvers.indexOf(to) >= 0) {
      // D1: the nearest is one of those who decide; from here it goes on through the chain
      var left = r.approvers.filter(function (a) { return q.yes.indexOf(a) < 0; });
      var rest = chainRoute(to, r, left);
      q.route = q.route.concat(rest.route.slice(1));
      q.how = q.how.concat(rest.how);
      if (q.hop === q.route.length - 1) { q.status = 'done'; q.ended = m; events.push({ kind: 'done', req: q.id, at: to }); }
      return;
    }
    if (!near.head && near.dept === crew.person(r.doer).dept) {
      // D2: someone from the doer's department, not its head: does it at once, without the yes it needs
      q.status = 'unapproved'; q.ended = m;
      events.push({ kind: 'unapproved', req: q.id, at: to });
      var head = crew.headOf(near.dept);
      if (head && head !== r.from) { q.counterDue = m + 1; q.counterFrom = head; }
      return;
    }
    // D3: nobody here may decide it or do it: it stops here
    q.status = 'lost'; q.ended = m;
    events.push({ kind: 'lost', req: q.id, at: to });
  }

  /** One minute of one way (mode). */
  function minute(run, m, mode) {
    var out = clone(run);
    var events = [];
    out.events = events;

    // rule 9: a head finds their crew member on someone else's job and calls them back: two orders for one person
    out.reqs.forEach(function (q) {
      if (q.status === 'unapproved' && q.counterDue === m) {
        events.push({ kind: 'counter', req: q.id, from: q.counterFrom, to: q.at });
        if (out.two.indexOf(q.at) < 0) out.two.push(q.at);
      }
    });

    // rule 10: each person sends or passes on one message a minute; safety first, then the longest held, then list order
    var held = {};
    out.reqs.forEach(function (q, i) {
      if (q.status !== 'idle' && q.status !== 'moving') return;
      (held[q.at] = held[q.at] || []).push(i);
    });
    var holders = Object.keys(held).sort(function (a, b) { return crew.index(a) - crew.index(b); });
    var moves = [];
    holders.forEach(function (who) {
      var list = held[who].slice().sort(function (a, b) {
        var qa = out.reqs[a], qb = out.reqs[b];
        var sa = spec(qa.id).safety ? 0 : 1, sb = spec(qb.id).safety ? 0 : 1;
        if (sa !== sb) return sa - sb;
        if (qa.arrived !== qb.arrived) return qa.arrived - qb.arrived;
        return REQ_INDEX[qa.id] - REQ_INDEX[qb.id];
      });
      moves.push(list[0]);
      for (var k = 1; k < list.length; k++) {
        var w = out.reqs[list[k]];
        if (w.status === 'moving') events.push({ kind: 'wait', req: w.id, at: who, behind: out.reqs[list[0]].id });
      }
    });

    moves.forEach(function (i) {
      var q = out.reqs[i], r = spec(q.id);
      if (q.status === 'idle') {
        q.status = 'moving'; q.sent = m;
        if (mode === 'direct') { q.route = [r.from, r.near]; q.how = ['direct']; q.direct = true; }
        else { var c = chainRoute(r.from, r, r.approvers); q.route = c.route; q.how = c.how; }
      }
      var from = q.at, to = q.route[q.hop + 1], how = q.how[q.hop];
      q.hop += 1; q.at = to; q.arrived = m;
      events.push({ kind: 'hop', req: q.id, from: from, to: to, how: how });
      arrive(q, r, to, m, mode, events);
    });
    return out;
  }

  /** Rule 11: what the scoreboard counts for one way. */
  function tally(run) {
    var t = { total: run.reqs.length, done: 0, unapproved: 0, lost: 0, open: 0, two: run.two.length, minutes: 0, mean: null };
    run.reqs.forEach(function (q) {
      if (q.status === 'done') { t.done += 1; t.minutes += q.ended - q.sent + 1; }
      else if (q.status === 'unapproved') t.unapproved += 1;
      else if (q.status === 'lost') t.lost += 1;
      else t.open += 1;
    });
    if (t.done > 0) t.mean = t.minutes / t.done;
    return t;
  }

  var logic = {
    defaults: { mode: 'chain', lamp: true, overtime: true, actor: true, exit: true, prop: true, crew: 40 },

    /** One step is one minute (illustrative); the slowest preset ends at minute 7 (SPEC.md, expected numbers). */
    steps: 7,

    REQUESTS: REQUESTS,
    MODES: MODES,
    crew: crew,
    chainRoute: chainRoute,
    tally: tally,
    spec: spec,

    initial: function (p) {
      return { minute: 0, runs: { direct: newRun(p), chain: newRun(p) } };
    },

    step: function (s, n) {
      return { minute: n, runs: { direct: minute(s.runs.direct, n, 'direct'), chain: minute(s.runs.chain, n, 'chain') } };
    },

    /** The minutes it took to get an answer (rule 11), or null while open, lost or done without a yes. */
    answerTime: function (q) { return q.status === 'done' ? q.ended - q.sent + 1 : null; }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
