/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for cdn-anycast: one CDN network (AS64500) announces the same prefix, 203.0.113.0/24, from three edge sites
   (PoPs) ZG, VIE and FRA, so the one address 203.0.113.10 lives in three places. Five other ASes learn the prefix by
   eBGP and each picks its best path (local preference, then AS-path length, then the lowest router ID of the
   advertising neighbour); the PoP an AS reaches is where its best path ends. An explorer: the state is the converged
   result for the params (which PoPs announce, which links are up, one local preference). Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.
   The BGP engine (ridNum, cmpPath, decidedBy, decide, copyRoute, sameRoute, rerun, sortRib, pathOut, neighbours,
   round) is from sims/bgp-path-selection/sim.js @ 969c181 (models/ has no BGP model yet; COMMON.md §6). New here:
   several origins with one ASN (the PoPs), links that start down, and running the rounds to convergence. */
(function (root) {
  'use strict';

  var PREFIX = '203.0.113.0/24';   // RFC 5737 TEST-NET-3
  var ADDRESS = '203.0.113.10';    // the service address inside it
  var CDN_ASN = 64500;             // RFC 5398 documentation ASNs 64496–64511
  var LP_DEFAULT = 100;
  var MAX_ROUNDS = 30;             // guard: every param combination converges in at most 5 (tested)

  // ── scene ──

  /** PoPs first, then the other ASes in the side column's order. Router IDs: SPEC.md "Scene". */
  var ASES = [
    { id: 'ZG', asn: CDN_ASN, routerId: '192.0.2.10', pop: true },
    { id: 'VIE', asn: CDN_ASN, routerId: '192.0.2.20', pop: true },
    { id: 'FRA', asn: CDN_ASN, routerId: '192.0.2.30', pop: true },
    { id: '64501', asn: 64501, routerId: '192.0.2.1', client: true },
    { id: '64502', asn: 64502, routerId: '192.0.2.2', client: true },
    { id: '64503', asn: 64503, routerId: '192.0.2.3' },
    { id: '64504', asn: 64504, routerId: '192.0.2.4', client: true },
    { id: '64505', asn: 64505, routerId: '192.0.2.5', client: true }
  ];
  var LINKS = [
    { id: 'ZG-64501', a: 'ZG', b: '64501' },
    { id: 'VIE-64502', a: 'VIE', b: '64502' },
    { id: 'VIE-64503', a: 'VIE', b: '64503', param: 'link64503VIE' },
    { id: 'FRA-64503', a: 'FRA', b: '64503', param: 'link64503FRA' },
    { id: 'FRA-64504', a: 'FRA', b: '64504' },
    { id: '64501-64502', a: '64501', b: '64502', param: 'link64501_64502' },
    { id: '64502-64503', a: '64502', b: '64503' },
    { id: '64503-64504', a: '64503', b: '64504' },
    { id: '64503-64505', a: '64503', b: '64505' }
  ];
  var POP_PARAM = { ZG: 'popZG', VIE: 'popVIE', FRA: 'popFRA' };

  /**
   * The internet for these params: which PoPs announce (up), which links are up, and the local preference AS64503
   * gives to routes from FRA. lp: { receiver: { neighbour: value } }, everything else LP_DEFAULT.
   */
  function sceneOf(p) {
    var lp = Number(p.lpAs64503) === 200 ? 200 : LP_DEFAULT;
    return {
      prefix: PREFIX, address: ADDRESS,
      ases: ASES,
      links: LINKS,
      pops: ASES.filter(function (a) { return a.pop; }).map(function (a) { return { id: a.id, up: p[POP_PARAM[a.id]] !== false }; }),
      linkUp: LINKS.map(function (l) { return { id: l.id, up: !l.param || p[l.param] !== false }; }),
      lp: { '64503': { FRA: lp } },
      prepend: {}
    };
  }

  function asOf(scene, id) { for (var i = 0; i < scene.ases.length; i++) if (scene.ases[i].id === id) return scene.ases[i]; return null; }
  function order(scene, id) { for (var i = 0; i < scene.ases.length; i++) if (scene.ases[i].id === id) return i; return -1; }
  function linkUp(st, id) { for (var i = 0; i < st.links.length; i++) if (st.links[i].id === id) return st.links[i].up; return false; }

  // ── the BGP engine, from sims/bgp-path-selection/sim.js @ 969c181 ──

  /** Neighbours of id over links that are up, in link order: [{ id, link }]. */
  function neighbours(scene, st, id) {
    var out = [];
    scene.links.forEach(function (l) {
      if (!linkUp(st, l.id)) return;
      if (l.a === id) out.push({ id: l.b, link: l.id });
      else if (l.b === id) out.push({ id: l.a, link: l.id });
    });
    return out;
  }

  /** Rule 2: LOCAL_PREF is set by the receiving AS, per neighbour; it is never part of what is sent. */
  function lpFor(scene, receiver, from) {
    var t = scene.lp && scene.lp[receiver];
    return t && t[from] != null ? t[from] : LP_DEFAULT;
  }

  /** Router ID as a number, so 192.0.2.10 sorts after 192.0.2.9. */
  function ridNum(rid) { return rid.split('.').reduce(function (n, x) { return n * 256 + Number(x); }, 0); }

  /**
   * Total order on stored paths, best first: the locally originated route; then highest LOCAL_PREF; then the
   * shortest AS_PATH; then the lowest router ID of the advertising neighbour (rule 5). The neighbour's scene order is
   * a last guard, never reached with unique router IDs and one session per neighbour.
   */
  function cmpPath(scene, x, y) {
    if (!!x.local !== !!y.local) return x.local ? -1 : 1;
    return (y.lp - x.lp) || (x.path.length - y.path.length) ||
      (ridNum(asOf(scene, x.from).routerId) - ridNum(asOf(scene, y.from).routerId)) ||
      (order(scene, x.from) - order(scene, y.from));
  }

  /** Which rule put x ahead of y: 'local' | 'lp' | 'len' | 'rid' | 'order'. */
  function decidedBy(scene, x, y) {
    if (!!x.local !== !!y.local) return 'local';
    if (x.lp !== y.lp) return 'lp';
    if (x.path.length !== y.path.length) return 'len';
    if (asOf(scene, x.from).routerId !== asOf(scene, y.from).routerId) return 'rid';
    return 'order';
  }

  /** The best of an AS's stored paths: { best, runner, by }; by is 'only' for a single path, null for none. */
  function decide(scene, rib) {
    if (!rib.length) return { best: null, runner: null, by: null };
    var sorted = rib.slice().sort(function (x, y) { return cmpPath(scene, x, y); });
    if (sorted.length === 1) return { best: sorted[0], runner: null, by: sorted[0].local ? 'local' : 'only' };
    return { best: sorted[0], runner: sorted[1], by: decidedBy(scene, sorted[0], sorted[1]) };
  }

  function copyRoute(r) { return r ? { from: r.from, path: r.path.slice(), lp: r.lp, local: !!r.local } : null; }
  function sameRoute(x, y) {
    if (!x || !y) return !x && !y;
    return x.from === y.from && x.lp === y.lp && x.path.join(' ') === y.path.join(' ');
  }

  /** Reruns the decision for id; returns whether its best changed. Mutates st. */
  function rerun(scene, st, id) {
    var a = st.ases[id];
    var d = decide(scene, a.rib);
    var was = a.best;
    a.best = copyRoute(d.best);
    a.by = d.by;
    return !sameRoute(was, a.best);
  }

  function sortRib(scene, rib) {
    rib.sort(function (x, y) { return (x.local ? -1 : 0) - (y.local ? -1 : 0) || order(scene, x.from) - order(scene, y.from); });
  }

  /** The path id sends to neighbour to: its own ASN (plus any prepends towards that neighbour), then its best path. */
  function pathOut(scene, id, to, best) {
    var me = asOf(scene, id), extra = (scene.prepend && scene.prepend[id] && scene.prepend[id][to]) || 0;
    var out = [];
    for (var i = 0; i <= extra; i++) out.push(me.asn);
    return out.concat(best.path);
  }

  /**
   * One synchronous round. Every AS in senders sends its best path to every neighbour over a link that is up, or a
   * withdrawal when it has none; all messages are taken before any is received. A receiver drops a path that
   * already holds its own ASN (loop prevention; this is also why one PoP never learns the prefix from another: every
   * path holds 64500); the message still replaces what that neighbour sent before. Every AS that received something
   * reruns the decision. Returns the ids whose best changed.
   */
  function round(scene, st, senders) {
    var msgs = [];
    scene.ases.forEach(function (a) {
      if (senders.indexOf(a.id) < 0) return;
      var best = st.ases[a.id].best;
      neighbours(scene, st, a.id).forEach(function (nb) {
        msgs.push(best
          ? { from: a.id, to: nb.id, kind: 'announce', path: pathOut(scene, a.id, nb.id, best) }
          : { from: a.id, to: nb.id, kind: 'withdraw', path: null });
      });
    });
    var touched = [];
    msgs.forEach(function (m) {
      var r = st.ases[m.to], me = asOf(scene, m.to);
      r.rib = r.rib.filter(function (e) { return e.from !== m.from; });
      if (m.kind === 'announce' && m.path.indexOf(me.asn) < 0) {
        r.rib.push({ from: m.from, path: m.path.slice(), lp: lpFor(scene, m.to, m.from) });
        sortRib(scene, r.rib);
      }
      if (touched.indexOf(m.to) < 0) touched.push(m.to);
    });
    return scene.ases.map(function (a) { return a.id; }).filter(function (id) {
      return touched.indexOf(id) >= 0 && rerun(scene, st, id);
    });
  }

  // ── new here: many origins, run to convergence ──

  /**
   * The converged tables for a scene. Every PoP that announces holds a local route (empty AS path; each PoP adds
   * 64500 when it sends, rule 1); the others start empty. Rounds run until no best changes.
   */
  function converge(scene) {
    var st = { ases: {}, links: scene.linkUp.map(function (l) { return { id: l.id, up: l.up }; }) };
    scene.ases.forEach(function (a) { st.ases[a.id] = { rib: [], best: null, by: null }; });
    var senders = [];
    scene.pops.forEach(function (p) {
      if (!p.up) return;
      st.ases[p.id].rib.push({ from: null, path: [], lp: LP_DEFAULT, local: true });
      rerun(scene, st, p.id);
      senders.push(p.id);
    });
    var rounds = 0;
    while (senders.length && rounds < MAX_ROUNDS) { rounds++; senders = round(scene, st, senders); }
    st.rounds = rounds;
    st.converged = !senders.length;
    return st;
  }

  /**
   * Where id's traffic goes, hop by hop: [id, next, …, pop], following each AS's own best (its from), or null when
   * id has no path. The PoP is where the chain ends, at a locally originated route.
   */
  function hopsOf(st, id) {
    var out = [id], cur = id;
    while (st.ases[cur].best && !st.ases[cur].best.local) {
      cur = st.ases[cur].best.from;
      if (out.indexOf(cur) >= 0) return null;   // never: a converged table has no forwarding loop (tested)
      out.push(cur);
    }
    return st.ases[cur].best && st.ases[cur].best.local ? out : null;
  }

  /**
   * The state the page draws (SPEC.md "State"): the announcements, the links, every AS's stored paths and best,
   * and for every non-PoP AS the AS path it selected, the hops and the PoP it reaches.
   */
  function stateOf(p) {
    var scene = sceneOf(p);
    var st = converge(scene);
    var best = {};
    scene.ases.forEach(function (a) {
      if (a.pop) return;
      var b = st.ases[a.id].best, hops = hopsOf(st, a.id);
      best[a.id] = b && hops ? { path: b.path.slice(), pop: hops[hops.length - 1], hops: hops, from: b.from, lp: b.lp, by: st.ases[a.id].by } : null;
    });
    var ases = {};
    scene.ases.forEach(function (a) { ases[a.id] = { rib: st.ases[a.id].rib, by: st.ases[a.id].by }; });
    return {
      prefix: PREFIX, address: ADDRESS,
      announcements: scene.pops.map(function (x) { return { pop: x.id, up: x.up }; }),
      links: scene.links.map(function (l, i) { return { id: l.id, a: l.a, b: l.b, up: scene.linkUp[i].up }; }),
      lp: LP_DEFAULT !== lpFor(scene, '64503', 'FRA') ? { '64503': { FRA: lpFor(scene, '64503', 'FRA') } } : {},
      ases: ases,
      best: best,
      rounds: st.rounds,
      converged: st.converged
    };
  }

  /** Non-PoP ASes whose PoP differs between two states (null = unreachable), in scene order. Nothing before → []. */
  function moved(prev, cur) {
    if (!prev) return [];
    return ASES.map(function (a) { return a.id; }).filter(function (id) {
      if (!(id in cur.best)) return false;
      var a = prev.best[id], b = cur.best[id];
      return (a ? a.pop : null) !== (b ? b.pop : null);
    });
  }
  /** How many client groups each PoP serves: { ZG: n, VIE: n, FRA: n }. */
  function loadOf(s) {
    var out = {};
    s.announcements.forEach(function (x) { out[x.pop] = 0; });
    ASES.forEach(function (a) { if (a.client && s.best[a.id]) out[s.best[a.id].pop]++; });
    return out;
  }

  var logic = {
    PREFIX: PREFIX, ADDRESS: ADDRESS, CDN_ASN: CDN_ASN, LP_DEFAULT: LP_DEFAULT,
    ASES: ASES, LINKS: LINKS, POP_PARAM: POP_PARAM,

    defaults: { popZG: true, popVIE: true, popFRA: true, link64501_64502: true, link64503VIE: true, link64503FRA: true, lpAs64503: 100 },

    /** SPEC.md "Presets": each changes one param from the defaults, or none. */
    presets: [
      { id: 'three-pops', params: {} },
      { id: 'withdraw-zg', params: { popZG: false } },
      { id: 'nearest-is-not-closest', params: {} },
      { id: 'local-pref-wins', params: { lpAs64503: 200 } }
    ],

    /** Explorer: the converged state for the params. */
    initial: function (p) { return stateOf(p); },

    sceneOf: sceneOf, asOf: asOf, lpFor: lpFor, ridNum: ridNum, cmpPath: cmpPath, decidedBy: decidedBy, decide: decide,
    converge: converge, hopsOf: hopsOf, stateOf: stateOf, moved: moved, loadOf: loadOf, pathOut: pathOut, round: round
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
