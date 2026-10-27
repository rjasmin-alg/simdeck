/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for link-state-spf: link-state routing on five routers A–E. Each router originates one LSA listing only its
   own links (RFC 2328 §12), the LSAs are flooded round by round (a newer copy is stored and sent on, a copy already
   held is dropped, §13), and once every link-state database is complete the selected source runs Dijkstra on its own
   copy, one router made final per step, keeping equal-cost next hops (§16.1). A cost change on B–C or a failed link
   makes the routers at its ends originate new LSAs with sequence + 1, which flood and trigger a new SPF run.
   Rules, tie-breaks and every expected number: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The flooding and SPF functions work on plain
   data (links, LSDBs, LSAs), so they can move to models/ unchanged. */
(function (root) {
  'use strict';

  var MAX_STEPS = 20;       // contract: a stepper has at most 20 steps
  var ROUTERS = ['A', 'B', 'C', 'D', 'E'];
  /** The graph (task file, derived): [a, b, cost]. B–C is the cost the student changes. */
  var LINKS = [['A', 'B', 2], ['A', 'C', 5], ['B', 'C', 1], ['B', 'D', 4], ['C', 'D', 1], ['C', 'E', 6], ['D', 'E', 2]];
  var FAILS = ['none', 'C-D', 'B-D'];

  function linkId(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
  function byName(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function union(a, b) { return a.concat(b.filter(function (x) { return a.indexOf(x) < 0; })).sort(byName); }

  /** The links of the network before (after = false) or after (after = true) the change the params ask for. */
  function linksOf(p, after) {
    return LINKS.map(function (l) {
      var id = linkId(l[0], l[1]);
      return { id: id, a: l[0], b: l[1], cost: after && id === 'B-C' ? p.costBC : l[2], up: !(after && p.fail === id) };
    });
  }

  /** The change the params ask for, or null: B–C's new cost and/or a failed link, and the routers at their ends. */
  function changeOf(p) {
    var cost = p.costBC !== 1 ? { from: 1, to: p.costBC } : null;
    var fail = p.fail && p.fail !== 'none' ? p.fail : null;
    if (!cost && !fail) return null;
    var ends = [];
    if (cost) ends = union(ends, ['B', 'C']);
    if (fail) ends = union(ends, fail.split('-'));
    return { cost: cost, fail: fail, ends: ends };
  }

  /** Neighbours of r over the links that are up, in name order. */
  function neighbours(links, r) {
    var out = [];
    links.forEach(function (l) {
      if (!l.up) return;
      if (l.a === r) out.push(l.b);
      else if (l.b === r) out.push(l.a);
    });
    return out.sort(byName);
  }

  /** Rule 1: r's LSA lists only r's own links that are up, with their costs: [[neighbour, cost]] in name order. */
  function lsaOf(links, r, seq) {
    var out = [];
    links.forEach(function (l) {
      if (!l.up) return;
      if (l.a === r) out.push([l.b, l.cost]);
      else if (l.b === r) out.push([l.a, l.cost]);
    });
    out.sort(function (x, y) { return byName(x[0], y[0]); });
    return { origin: r, seq: seq, links: out };
  }

  function key(o, seq) { return o + '#' + seq; }

  /** Every router's LSA at sequence seq: the catalogue { 'A#1': lsa } and a full LSDB { r: { o: seq } }. */
  function everyone(links, seq) {
    var lsas = {}, lsdb = {};
    ROUTERS.forEach(function (o) { lsas[key(o, seq)] = lsaOf(links, o, seq); });
    ROUTERS.forEach(function (r) { lsdb[r] = {}; ROUTERS.forEach(function (o) { lsdb[r][o] = seq; }); });
    return { lsas: lsas, lsdb: lsdb };
  }

  /** The newest sequence number of each origin in the catalogue. */
  function latestOf(lsas) {
    var out = {};
    Object.keys(lsas).forEach(function (k) { var l = lsas[k]; if (out[l.origin] == null || l.seq > out[l.origin]) out[l.origin] = l.seq; });
    return out;
  }

  /** Rule 2's end: every router holds the newest LSA of every origin. */
  function complete(lsdb, lsas) {
    var latest = latestOf(lsas);
    return ROUTERS.every(function (r) {
      return ROUTERS.every(function (o) { return lsdb[r][o] != null && lsdb[r][o] === latest[o]; });
    });
  }

  /**
   * One flood round (rule 2). Every pending item { at, o, from } is an LSA that router `at` stored in the previous
   * round (or originated, from = null); `at` sends its copy to every neighbour except the one it came from. All copies
   * are delivered at once, processed in the order receiver, sender, origin: a copy newer than the one held (or the
   * first one) is stored and becomes pending for the next round ('new'); a copy already held is dropped ('dup').
   * held: the receiver's sequence number of that origin before this copy (null: none).
   */
  function floodRound(lsdb, pending, links) {
    var sent = [];
    pending.forEach(function (it) {
      neighbours(links, it.at).forEach(function (n) {
        if (n === it.from) return;
        sent.push({ o: it.o, seq: lsdb[it.at][it.o], from: it.at, to: n, fate: null, held: null });
      });
    });
    sent.sort(function (x, y) { return byName(x.to, y.to) || byName(x.from, y.from) || byName(x.o, y.o); });
    var db = clone(lsdb), next = [];
    sent.forEach(function (c) {
      var held = db[c.to][c.o];
      c.held = held == null ? null : held;
      if (held == null || c.seq > held) {
        db[c.to][c.o] = c.seq;
        c.fate = 'new';
        next.push({ at: c.to, o: c.o, from: c.from });
      } else c.fate = 'dup';
    });
    sent.sort(function (x, y) { return byName(x.from, y.from) || byName(x.to, y.to) || byName(x.o, y.o); });
    next.sort(function (x, y) { return byName(x.at, y.at) || byName(x.o, y.o); });
    return { lsdb: db, sent: sent, pending: next };
  }

  /**
   * The graph one router sees: built from its own LSDB only (rule 3). An edge u→v with u's cost counts only when v's
   * LSA lists u too (the two-way check, RFC 2328 §16.1). { u: [[v, cost]] } in name order.
   */
  function graphOf(db, lsas) {
    var held = {};
    Object.keys(db).forEach(function (o) { var l = lsas[key(o, db[o])]; if (l) held[o] = l; });
    var g = {};
    Object.keys(held).sort(byName).forEach(function (u) {
      g[u] = held[u].links.filter(function (e) {
        var back = held[e[0]];
        return back && back.links.some(function (x) { return x[0] === u; });
      }).map(function (e) { return [e[0], e[1]]; });
    });
    return g;
  }

  /** Dijkstra before its first pick: the source at 0, every other router unknown (rule 4). */
  function spfInit(source) {
    var dist = {}, nextHop = {}, parents = {};
    ROUTERS.forEach(function (r) { dist[r] = null; nextHop[r] = []; parents[r] = []; });
    dist[source] = 0;
    return { dist: dist, nextHop: nextHop, parents: parents, final: [] };
  }

  /** Rule 5: the tentative router with the smallest distance, equal distances by name. null when none is left. */
  function pickOf(spf) {
    var best = null;
    ROUTERS.forEach(function (r) {
      if (spf.final.indexOf(r) >= 0 || spf.dist[r] == null) return;
      if (best == null || spf.dist[r] < spf.dist[best] || (spf.dist[r] === spf.dist[best] && r < best)) best = r;
    });
    return best;
  }

  /**
   * One SPF step (rules 4–7): pick, mark final, relax the neighbours that are not final yet in name order. A shorter
   * offer replaces distance, next hops and parent; an equal one adds its next hops and parent (ECMP). The next hop
   * through the source is the neighbour itself; through any other router, that router's next hops.
   * relaxed: [{ r, how: 'new' | 'better' | 'equal' | 'worse', offer, via, old: { dist, nextHop, parents } }].
   */
  function spfStep(spf, graph, source) {
    var out = clone(spf);
    var u = pickOf(out);
    out.picked = u;
    out.relaxed = [];
    if (u == null) return out;
    out.final.push(u);
    (graph[u] || []).forEach(function (e) {
      var v = e[0];
      if (out.final.indexOf(v) >= 0) return;
      var d = out.dist[u] + e[1];
      var nh = u === source ? [v] : out.nextHop[u].slice();
      var old = { dist: out.dist[v], nextHop: out.nextHop[v].slice(), parents: out.parents[v].slice() };
      var how;
      if (out.dist[v] == null || d < out.dist[v]) {
        how = out.dist[v] == null ? 'new' : 'better';
        out.dist[v] = d; out.nextHop[v] = nh; out.parents[v] = [u];
      } else if (d === out.dist[v]) {
        how = 'equal';
        out.nextHop[v] = union(out.nextHop[v], nh); out.parents[v] = union(out.parents[v], [u]);
      } else how = 'worse';
      out.relaxed.push({ r: v, how: how, offer: d, via: u, old: old });
    });
    return out;
  }

  /** The shortest-path tree so far: an edge from each final router to each of its parents; ecmp when it has two or more. */
  function treeOf(spf) {
    var out = [];
    spf.final.forEach(function (r) {
      spf.parents[r].forEach(function (p) { out.push({ a: p, b: r, ecmp: spf.parents[r].length > 1 }); });
    });
    return out;
  }

  /** Rule 7: the routing table of the source, one row per reachable destination in name order. */
  function tableOf(spf, source) {
    return ROUTERS.filter(function (r) { return r !== source && spf.final.indexOf(r) >= 0; }).map(function (r) {
      return { dest: r, cost: spf.dist[r], via: spf.nextHop[r].slice() };
    });
  }

  /** A whole SPF run on graph from source (for the converged start and the tests). */
  function runSpf(graph, source) {
    var s = spfInit(source);
    while (pickOf(s) != null) s = spfStep(s, graph, source);
    return s;
  }

  function base(kind, s) {
    return {
      kind: kind, round: s.round, change: s.change, links: s.links, lsas: s.lsas, lsdb: s.lsdb, pending: s.pending,
      inFlight: [], originated: [], spf: s.spf, tree: s.tree, table: s.table, oldTable: s.oldTable, end: false
    };
  }

  var logic = {
    MAX_STEPS: MAX_STEPS,
    ROUTERS: ROUTERS,
    LINKS: LINKS,
    FAILS: FAILS,

    /** source: whose SPF the page shows; costBC: B–C's cost after the change (1 = no change); fail: a link that
        fails; showFlood: originate and flood as steps (off: the LSDBs are complete from the start). */
    defaults: { source: 'A', costBC: 1, fail: 'none', showFlood: true },

    /** Steps for these params: replay to the end of the run (SPEC.md "Steps"), at most 20. */
    steps: function (p) {
      var k = JSON.stringify([p.source, p.costBC, p.fail, p.showFlood]);
      if (stepsCache[k] != null) return stepsCache[k];
      var s = logic.initial(p), n = 0;
      while (!s.end && n < MAX_STEPS) { n++; s = logic.step(s, n, p); }
      stepsCache[k] = n;
      return n;
    },

    /**
     * Step 0. Without a change: no LSDB holds anything yet (showFlood on), or every LSDB is complete already (off).
     * With a change: the network before it has converged: every LSDB holds every LSA at sequence 1 and the source's
     * routing table is the one computed on it.
     */
    initial: function (p) {
      var ch = changeOf(p);
      var before = linksOf(p, false);
      var s = { kind: 'start', round: 0, change: ch, links: before, lsas: {}, lsdb: {}, pending: [], inFlight: [], originated: [],
        spf: null, tree: [], table: [], oldTable: null, end: false };
      if (ch || !p.showFlood) {
        var all = everyone(before, 1);
        s.lsas = all.lsas;
        s.lsdb = all.lsdb;
      } else ROUTERS.forEach(function (r) { s.lsdb[r] = {}; });
      if (ch) {
        s.table = tableOf(runSpf(graphOf(s.lsdb[p.source], s.lsas), p.source), p.source);
        s.oldTable = clone(s.table);
      }
      return s;
    },

    /** One step: change → originate → flood rounds → SPF picks → routing table (SPEC.md "One step"). */
    step: function (s, n, p) {
      var out;
      var spfNext = function (kind) {
        var o = base(kind, s);
        var sp = spfStep(s.spf || spfInit(p.source), graphOf(s.lsdb[p.source], s.lsas), p.source);
        o.spf = sp;
        o.tree = treeOf(sp);
        return o;
      };
      if (s.kind === 'start' && s.change) {
        out = base('change', s);
        out.links = linksOf(p, true);
        if (!p.showFlood) {   // rule 8 with the flooding hidden: the new LSAs are everywhere at once
          out.lsas = clone(s.lsas);
          out.lsdb = clone(s.lsdb);
          s.change.ends.forEach(function (r) {
            var seq = s.lsdb[r][r] + 1;
            out.lsas[key(r, seq)] = lsaOf(out.links, r, seq);
            ROUTERS.forEach(function (x) { out.lsdb[x][r] = seq; });
          });
          out.originated = s.change.ends.slice();
        }
      } else if ((s.kind === 'start' || s.kind === 'change') && p.showFlood) {
        out = base('originate', s);
        out.lsas = clone(s.lsas);
        out.lsdb = clone(s.lsdb);
        var who = s.change ? s.change.ends : ROUTERS;
        who.forEach(function (r) {
          var seq = (s.lsdb[r][r] || 0) + 1;
          out.lsas[key(r, seq)] = lsaOf(s.links, r, seq);
          out.lsdb[r][r] = seq;
        });
        out.originated = who.slice();
        out.pending = who.map(function (r) { return { at: r, o: r, from: null }; });
      } else if ((s.kind === 'originate' || s.kind === 'flood') && !complete(s.lsdb, s.lsas) && s.pending.length) {
        out = base('flood', s);
        var f = floodRound(s.lsdb, s.pending, s.links);
        out.round = s.round + 1;
        out.lsdb = f.lsdb;
        out.inFlight = f.sent;
        out.pending = f.pending;
      } else if (s.kind !== 'spf' || pickOf(s.spf) != null) {
        out = spfNext('spf');
      } else {
        out = base('table', s);
        out.table = tableOf(s.spf, p.source);
        out.end = true;
      }
      if (out.kind !== 'flood') out.pending = out.kind === 'originate' ? out.pending : [];
      if (n >= MAX_STEPS) out.end = true;
      return out;
    },

    linkId: linkId, linksOf: linksOf, changeOf: changeOf, neighbours: neighbours, lsaOf: lsaOf, key: key, everyone: everyone,
    latestOf: latestOf, complete: complete, floodRound: floodRound, graphOf: graphOf, spfInit: spfInit, pickOf: pickOf,
    spfStep: spfStep, treeOf: treeOf, tableOf: tableOf, runSpf: runSpf
  };
  var stepsCache = {};

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
