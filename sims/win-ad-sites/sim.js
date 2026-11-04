/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for win-ad-sites: sites, site links and the KCC (SPEC.md). Explorer: the params give one state, derived at
   once: the inter-site spanning tree, the bridgehead of each site, the worst-case arrival of one change at every DC,
   which DCs hold it at the clock, and the DC each site's client is sent to.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. No strings: words live in strings.js. */
(function (root) {
  'use strict';

  var SITES = ['HQ', 'Branch', 'Colo'];
  /** DCs per site, in name order. DC01 holds the PDC emulator role while HQ has DCs. */
  var DCS = { HQ: ['DC01', 'DC02'], Branch: ['DC04'], Colo: ['DC03'] };
  var ALL_DCS = ['DC01', 'DC02', 'DC03', 'DC04'];
  var SUBNETS = { HQ: '10.10.0.0/16', Branch: '10.20.0.0/16', Colo: '10.30.0.0/16' };
  var CLIENT_IP = { HQ: '10.10.0.50', Branch: '10.20.0.50', Colo: '10.30.0.50' };
  /** Links: [id, a, b]; the params are cost<id> and interval<id>. BC exists only with linkBC. */
  var LINKS = [['HB', 'HQ', 'Branch'], ['HC', 'HQ', 'Colo'], ['BC', 'Branch', 'Colo']];
  var NOTIFY_S = 15; // rule 1: first change notification within a site, seconds after the change

  function cmpStr(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

  function siteOf(dc) {
    for (var i = 0; i < SITES.length; i++) if (DCS[SITES[i]].indexOf(dc) >= 0) return SITES[i];
    return null;
  }

  /** The sites, each with its DCs (none at HQ without hqDcs) and its subnet (none without subnets). */
  function sitesOf(p) {
    return SITES.map(function (id) {
      return { id: id, dcs: id === 'HQ' && !p.hqDcs ? [] : DCS[id].slice(), subnets: p.subnets ? [SUBNETS[id]] : [] };
    });
  }

  function linksOf(p) {
    return LINKS.filter(function (l) { return l[0] !== 'BC' || p.linkBC; }).map(function (l) {
      return { id: l[0], a: l[1], b: l[2], cost: p['cost' + l[0]], intervalMin: p['interval' + l[0]] };
    });
  }

  /**
   * Least-cost path between two sites over the given links (rule 3), as { sites, links, cost } or null.
   * Tie-break (rule 5): fewer hops, then the list of site names compared in order. Three sites: every simple path is
   * listed and the best kept, so the tie-break is exact.
   */
  function bestPath(links, from, to) {
    var best = null;
    function better(c) {
      if (!best) return true;
      if (c.cost !== best.cost) return c.cost < best.cost;
      if (c.links.length !== best.links.length) return c.links.length < best.links.length;
      return cmpStr(c.sites.join('>'), best.sites.join('>')) < 0;
    }
    function walk(site, sites, ls, cost) {
      if (site === to) { var c = { sites: sites, links: ls, cost: cost }; if (better(c)) best = c; return; }
      links.forEach(function (l) {
        var next = l.a === site ? l.b : l.b === site ? l.a : null;
        if (!next || sites.indexOf(next) >= 0) return;
        walk(next, sites.concat([next]), ls.concat([l.id]), cost + l.cost);
      });
    }
    walk(from, [from], [], 0);
    return best;
  }

  /**
   * The edges the ISTG may use between sites that hold DCs (rule 3). Bridging on: every pair, over its least-cost
   * path through any sites (a path of several links is one bridged route). Bridging off: only a direct link, and a
   * site without DCs breaks the route (store and forward needs a DC in every site on the way).
   * A route's interval is its link's; a bridged route replicates as often as its largest interval allows.
   */
  function siteEdges(sites, links, bridging) {
    var withDc = sites.filter(function (s) { return s.dcs.length; }).map(function (s) { return s.id; });
    var out = [];
    for (var i = 0; i < withDc.length; i++) for (var j = i + 1; j < withDc.length; j++) {
      var a = withDc[i], b = withDc[j];
      var path = bridging ? bestPath(links, a, b) : bestPath(links.filter(function (l) {
        return (l.a === a && l.b === b) || (l.a === b && l.b === a);
      }), a, b);
      if (!path) continue;
      var intervals = path.links.map(function (id) { return links.filter(function (l) { return l.id === id; })[0].intervalMin; });
      out.push({ a: a, b: b, sites: path.sites, links: path.links, cost: path.cost,
        intervalMin: Math.max.apply(null, intervals), bridged: path.links.length > 1 });
    }
    return out;
  }

  /**
   * The ISTG's least-cost spanning tree over the sites with DCs (Kruskal). Equal costs: fewer links, then the two
   * site names in alphabetical order (rule 5). Sites it cannot join stay apart (a forest).
   */
  function spanningTree(edges) {
    var sorted = edges.slice().sort(function (x, y) {
      return x.cost - y.cost || x.links.length - y.links.length ||
        cmpStr([x.a, x.b].sort().join('-'), [y.a, y.b].sort().join('-'));
    });
    var group = {};
    function find(s) { while (group[s] && group[s] !== s) s = group[s]; return s; }
    var tree = [];
    sorted.forEach(function (e) {
      var ra = find(e.a), rb = find(e.b);
      if (ra === rb) return;
      group[ra] = rb; group[rb] = rb;
      tree.push(e);
    });
    return tree;
  }

  /** One bridgehead per site with DCs: the ISTG's pick, here the first DC by name (real ones: random among eligible). */
  function bridgeheadsOf(sites) {
    var out = {};
    sites.forEach(function (s) { if (s.dcs.length) out[s.id] = s.dcs[0]; });
    return out;
  }

  /** The DC of a site's client (rule 6, 8). { site, how: 'site' | 'coverage' | 'any', dcs, coveredBy }. */
  function locate(sites, links, clientSite) {
    var byId = {};
    sites.forEach(function (s) { byId[s.id] = s; });
    var all = [];
    sites.forEach(function (s) { all = all.concat(s.dcs); });
    all.sort(cmpStr);
    var own = byId[clientSite];
    if (!own.subnets.length) return { site: null, how: 'any', dcs: all, coveredBy: null };
    if (own.dcs.length) return { site: clientSite, how: 'site', dcs: own.dcs.slice(), coveredBy: null };
    // automatic site coverage: the nearest site with DCs by link cost (rule 8); ties: more DCs, then the site name
    var best = null;
    sites.forEach(function (s) {
      if (s.id === clientSite || !s.dcs.length) return;
      var path = bestPath(links, clientSite, s.id);
      if (!path) return;
      if (!best || path.cost < best.path.cost || (path.cost === best.path.cost &&
        (s.dcs.length > best.n || (s.dcs.length === best.n && cmpStr(s.id, best.site) < 0)))) {
        best = { site: s.id, path: path, n: s.dcs.length };
      }
    });
    if (!best) return { site: clientSite, how: 'none', dcs: [], coveredBy: null };
    return { site: clientSite, how: 'coverage', dcs: byId[best.site].dcs.slice(), coveredBy: best.site, cost: best.path.cost };
  }

  /**
   * Worst-case arrival of the change at every DC (rule 4): within a site, a ring in name order, each hop 15 s after
   * the DC before it got the change (rule 1); between sites, from bridgehead to bridgehead along the tree, a full
   * interval of the route (the poll just missed it). Several sources start at t = 0 (the change and, for a password,
   * the PDC that got it at once: rule 7). Multi-source shortest times; on equal times the first found is kept, in
   * the order DC name, then intra before inter.
   * Returns { DCxx: { t (seconds) | null, from: { kind: 'origin' | 'pdc' | 'intra' | 'inter', dc, edge } } }.
   */
  function arrivals(sites, tree, sources) {
    var heads = bridgeheadsOf(sites);
    var adj = {};
    var dcs = [];
    sites.forEach(function (s) {
      dcs = dcs.concat(s.dcs);
      s.dcs.forEach(function (d) { adj[d] = []; });
      var n = s.dcs.length;
      if (n > 1) s.dcs.forEach(function (d, i) {
        var right = s.dcs[(i + 1) % n], left = s.dcs[(i - 1 + n) % n];
        adj[d].push({ to: right, w: NOTIFY_S, kind: 'intra' });
        if (left !== right) adj[d].push({ to: left, w: NOTIFY_S, kind: 'intra' });
      });
    });
    tree.forEach(function (e) {
      var ha = heads[e.a], hb = heads[e.b];
      adj[ha].push({ to: hb, w: e.intervalMin * 60, kind: 'inter', edge: e });
      adj[hb].push({ to: ha, w: e.intervalMin * 60, kind: 'inter', edge: e });
    });
    Object.keys(adj).forEach(function (d) {
      adj[d].sort(function (x, y) { return (x.kind === 'intra' ? 0 : 1) - (y.kind === 'intra' ? 0 : 1) || cmpStr(x.to, y.to); });
    });
    var out = {};
    ALL_DCS.forEach(function (d) { out[d] = { t: null, from: null }; });
    sources.forEach(function (src) {
      if (adj[src.dc] && out[src.dc].t === null) out[src.dc] = { t: 0, from: { kind: src.kind, dc: src.by || null } };
    });
    var done = {};
    for (;;) {
      var cur = null;
      dcs.slice().sort(cmpStr).forEach(function (d) {
        if (done[d] || out[d].t === null) return;
        if (cur === null || out[d].t < out[cur].t) cur = d;
      });
      if (cur === null) break;
      done[cur] = true;
      adj[cur].forEach(function (x) {
        var t = out[cur].t + x.w;
        if (out[x.to].t === null || t < out[x.to].t) {
          out[x.to] = { t: t, from: x.kind === 'inter'
            ? { kind: 'inter', dc: cur, edge: { a: siteOf(cur), b: siteOf(x.to), sites: orient(x.edge.sites, siteOf(cur)), links: orientLinks(x.edge, siteOf(cur)), intervalMin: x.edge.intervalMin, bridged: x.edge.bridged } }
            : { kind: 'intra', dc: cur } };
        }
      });
    }
    return out;
  }

  function orient(sites, from) { return sites[0] === from ? sites.slice() : sites.slice().reverse(); }
  function orientLinks(e, from) { return e.sites[0] === from ? e.links.slice() : e.links.slice().reverse(); }

  var logic = {
    SITES: SITES, DCS: DCS, ALL_DCS: ALL_DCS, SUBNETS: SUBNETS, CLIENT_IP: CLIENT_IP, NOTIFY_S: NOTIFY_S,

    defaults: {
      costHB: 100, costHC: 100, costBC: 100,
      intervalHB: 180, intervalHC: 180, intervalBC: 180,
      bridging: true, subnets: true, linkBC: false, hqDcs: true,
      origin: 'HQ', password: true, clock: 15, edit: 'HB'
    },

    steps: 0,

    /** The whole derived state for these params (SPEC.md "State"). */
    initial: function (p) {
      var sites = sitesOf(p);
      var links = linksOf(p);
      var byId = {};
      sites.forEach(function (s) { byId[s.id] = s; });
      var edges = siteEdges(sites, links, p.bridging);
      var tree = spanningTree(edges);
      var heads = bridgeheadsOf(sites);
      var pdc = byId.HQ.dcs.length ? 'DC01' : 'DC03';
      // the change: written on the origin site's bridgehead, or on the DC covering a site without one (rule 8)
      var originDc = heads[p.origin] || null, covered = false;
      if (!originDc) {
        var loc = locate(sites.map(function (s) { return { id: s.id, dcs: s.dcs, subnets: [SUBNETS[s.id]] }; }), links, p.origin);
        originDc = loc.dcs[0] || null;
        covered = true;
      }
      var sources = [{ dc: originDc, kind: 'origin' }];
      if (p.password && pdc !== originDc) sources.push({ dc: pdc, kind: 'pdc', by: originDc });
      var arr = arrivals(sites, tree, sources);
      var has = {};
      ALL_DCS.forEach(function (d) { has[d] = arr[d].t !== null && arr[d].t <= p.clock; });
      var clients = {};
      SITES.forEach(function (sid) {
        var c = locate(sites, links, sid);
        c.ip = CLIENT_IP[sid];
        if (p.password) {
          // rule 7: a DC without the new password sends the logon on to the PDC, which has it
          var lacking = c.dcs.filter(function (d) { return !has[d]; });
          c.logon = !c.dcs.length ? 'none' : !lacking.length ? 'local' : lacking.length === c.dcs.length ? 'pdc' : 'depends';
          c.lacking = lacking;
        } else { c.logon = null; c.lacking = []; }
        clients[sid] = c;
      });
      return {
        sites: sites, links: links, bridging: p.bridging,
        change: { at: 0, site: p.origin, dc: originDc, covered: covered, kind: p.password ? 'password' : 'phone' },
        pdc: pdc, bridgeheads: heads, edges: edges, tree: tree,
        arrival: arr, clock: p.clock, has: has, clients: clients
      };
    },

    bestPath: bestPath, siteEdges: siteEdges, spanningTree: spanningTree, locate: locate, arrivals: arrivals,
    sitesOf: sitesOf, linksOf: linksOf, siteOf: siteOf,

    /** Is this site link used by the tree, directly or as part of a bridged route? */
    linkUsed: function (s, id) { return s.tree.some(function (e) { return e.links.indexOf(id) >= 0; }); },

    /** Arrival times after the clock, ascending, without repeats; the next one is the first. */
    nextArrival: function (s) {
      var ts = ALL_DCS.map(function (d) { return s.arrival[d].t; }).filter(function (t) { return t !== null && t > s.clock; });
      return ts.length ? Math.min.apply(null, ts) : null;
    },

    /** The last arrival (seconds), or 0 when nothing travels. */
    lastArrival: function (s) {
      var ts = ALL_DCS.map(function (d) { return s.arrival[d].t; }).filter(function (t) { return t !== null; });
      return ts.length ? Math.max.apply(null, ts) : 0;
    },

    /** The DCs whose arrival is exactly at the clock (the packets drawn now). */
    arrivingNow: function (s) {
      return ALL_DCS.filter(function (d) { return s.arrival[d].t === s.clock && s.arrival[d].from && s.arrival[d].from.kind !== 'origin'; });
    },

    /** What differs between two states (the "changed" mark): DCs whose arrival or holding changed, clients whose DC
     * choice or logon changed, links whose use changed. */
    diff: function (a, b) {
      var out = { dcs: [], clients: [], links: [] };
      if (!a || !b) return out;
      ALL_DCS.forEach(function (d) {
        if (a.arrival[d].t !== b.arrival[d].t || a.has[d] !== b.has[d]) out.dcs.push(d);
      });
      SITES.forEach(function (sid) {
        var x = a.clients[sid], y = b.clients[sid];
        if (x.how !== y.how || x.dcs.join() !== y.dcs.join() || x.logon !== y.logon) out.clients.push(sid);
      });
      LINKS.forEach(function (l) {
        var ua = a.links.some(function (k) { return k.id === l[0]; }) && logic.linkUsed(a, l[0]);
        var ub = b.links.some(function (k) { return k.id === l[0]; }) && logic.linkUsed(b, l[0]);
        if (ua !== ub) out.links.push(l[0]);
      });
      return out;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
