/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for bgp-hijack: a second AS announces a prefix that belongs to another, and route origin validation drops it.
   Eight autonomous systems exchange eBGP announcements in synchronous rounds, as in bgp-path-selection: each AS keeps
   the path it last heard from every neighbour for every prefix, drops a path that already holds its own ASN, and picks
   its best per prefix by local preference, then AS-path length, then the lowest router ID of the neighbour
   (RFC 4271 §9.1.2.2). New here: routes carry a prefix; an AS with origin validation on checks every route against
   the published ROAs (RFC 6811 §2) and drops Invalid ones before the decision; and each AS forwards the test address
   by the longest matching prefix, followed hop by hop to where the traffic really ends. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it.
   The decision functions (ridNum, cmpPath, decidedBy, decide, pathOut) are from sims/bgp-path-selection/sim.js @ 969c181,
   unchanged; round and the state keep a prefix per route (NOTES.md "Shared requests"). */
(function (root) {
  'use strict';

  var LEGIT = '203.0.113.0/24';    // RFC 5737 documentation prefix, held by AS64496
  var MORE = '203.0.113.0/25';     // the more-specific half that covers the test address
  var TARGET = '203.0.113.10';     // the test address
  var LP_DEFAULT = 100;
  var MAX_STEPS = 40;              // guard: no param combination here needs more than 6
  var MAX_HOPS = 16;               // guard for the hop-by-hop trace

  // ── addresses ──

  function ipNum(ip) { return ip.split('.').reduce(function (n, x) { return n * 256 + Number(x); }, 0); }
  function lenOf(prefix) { return Number(prefix.split('/')[1]); }
  function netOf(prefix) { return ipNum(prefix.split('/')[0]); }
  /** Does prefix contain address ip? */
  function covers(prefix, ip) {
    var len = lenOf(prefix), size = Math.pow(2, 32 - len);
    return Math.floor(ipNum(ip) / size) === Math.floor(netOf(prefix) / size);
  }
  /** Rule 4: a ROA prefix covers a route prefix when the route is the same or more specific and inside it. */
  function prefixCovers(roaPrefix, routePrefix) {
    return lenOf(routePrefix) >= lenOf(roaPrefix) && covers(roaPrefix, routePrefix.split('/')[0]);
  }

  // ── scene ──

  /** Which ASes validate for each rovDeployment value (SPEC.md "Scene"). */
  var ROV = {
    none: [],
    half: ['O', 'B', 'C', 'F'],
    all: ['O', 'A', 'B', 'C', 'D', 'E', 'F', 'X']
  };

  /**
   * The page's internet for these params. ases in drawing order; ASNs from RFC 5398. O holds 203.0.113.0/24 and the
   * test address; X is the AS that announces a conflicting route. Router IDs settle the ties of C, X and O (A before
   * B, E before F) in a fixed, stated way. conflict: none | same-prefix | more-specific. roa: the prefix holder has
   * published 203.0.113.0/24, maxLength 24, AS64496. rovDeployment: none | half | all.
   */
  function sceneOf(p) {
    var conflict = p.conflict === 'same-prefix' || p.conflict === 'more-specific' ? p.conflict : 'none';
    var rov = ROV[p.rovDeployment] ? p.rovDeployment : 'none';
    return {
      target: TARGET,
      home: 'O',
      origin: { as: 'O', prefix: LEGIT },
      hijack: conflict === 'none' ? null : { as: 'X', prefix: conflict === 'same-prefix' ? LEGIT : MORE },
      roas: p.roa ? [{ prefix: LEGIT, maxLength: 24, origin: 64496 }] : [],
      rov: ROV[rov].slice(),
      ases: [
        { id: 'O', asn: 64496, routerId: '192.0.2.7' },
        { id: 'A', asn: 64497, routerId: '192.0.2.1' },
        { id: 'B', asn: 64498, routerId: '192.0.2.2' },
        { id: 'C', asn: 64499, routerId: '192.0.2.3' },
        { id: 'D', asn: 64500, routerId: '192.0.2.4' },
        { id: 'E', asn: 64501, routerId: '192.0.2.5' },
        { id: 'F', asn: 64502, routerId: '192.0.2.6' },
        { id: 'X', asn: 64511, routerId: '192.0.2.8' }
      ],
      links: [
        { id: 'O-A', a: 'O', b: 'A' }, { id: 'O-B', a: 'O', b: 'B' }, { id: 'A-C', a: 'A', b: 'C' },
        { id: 'B-C', a: 'B', b: 'C' }, { id: 'C-D', a: 'C', b: 'D' }, { id: 'A-E', a: 'A', b: 'E' },
        { id: 'B-F', a: 'B', b: 'F' }, { id: 'E-X', a: 'E', b: 'X' }, { id: 'F-X', a: 'F', b: 'X' }
      ],
      lp: {}, prepend: {}
    };
  }

  function asOf(scene, id) { for (var i = 0; i < scene.ases.length; i++) if (scene.ases[i].id === id) return scene.ases[i]; return null; }
  function order(scene, id) { for (var i = 0; i < scene.ases.length; i++) if (scene.ases[i].id === id) return i; return -1; }
  function idOfAsn(scene, asn) { for (var i = 0; i < scene.ases.length; i++) if (scene.ases[i].asn === asn) return scene.ases[i].id; return null; }

  /** Neighbours of id, in link order: [{ id, link }]. */
  function neighbours(scene, id) {
    var out = [];
    scene.links.forEach(function (l) {
      if (l.a === id) out.push({ id: l.b, link: l.id });
      else if (l.b === id) out.push({ id: l.a, link: l.id });
    });
    return out;
  }

  function lpFor(scene, receiver, from) {
    var t = scene.lp && scene.lp[receiver];
    return t && t[from] != null ? t[from] : LP_DEFAULT;
  }

  // ── origin validation (rules 4, 7) ──

  /** The origin AS of a route: the last ASN of its path, or the AS's own for a local route (RFC 6811 §2). */
  function originOf(scene, at, r) { return r.local ? asOf(scene, at).asn : r.path[r.path.length - 1]; }

  /**
   * RFC 6811 §2: 'valid' when a ROA covers the prefix with the same origin AS and the prefix length is at most its
   * maxLength; 'invalid' when some ROA covers it but none matches; 'notfound' when no ROA covers it. Only the prefix
   * and the origin AS are read, never the rest of the path (rule 7).
   */
  function validate(roas, prefix, originAsn) {
    var covered = roas.filter(function (r) { return prefixCovers(r.prefix, prefix); });
    if (!covered.length) return 'notfound';
    return covered.some(function (r) { return r.origin === originAsn && lenOf(prefix) <= r.maxLength; }) ? 'valid' : 'invalid';
  }

  // ── the decision (rule 1), from sims/bgp-path-selection/sim.js @ 969c181 ──

  /** Router ID as a number, so 192.0.2.10 sorts after 192.0.2.9. */
  function ridNum(rid) { return rid.split('.').reduce(function (n, x) { return n * 256 + Number(x); }, 0); }

  /**
   * Total order on stored paths of one prefix, best first: the locally originated route; then highest LOCAL_PREF;
   * then the shortest AS_PATH; ORIGIN and MED are equal for every path here; then the lowest router ID of the
   * advertising neighbour. The neighbour's scene order is a last guard, never reached with unique router IDs.
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

  /** The best of stored paths for one prefix: { best, runner, by }. */
  function decide(scene, rib) {
    if (!rib.length) return { best: null, runner: null, by: null };
    var sorted = rib.slice().sort(function (x, y) { return cmpPath(scene, x, y); });
    if (sorted.length === 1) return { best: sorted[0], runner: null, by: sorted[0].local ? 'local' : 'only' };
    return { best: sorted[0], runner: sorted[1], by: decidedBy(scene, sorted[0], sorted[1]) };
  }

  /** The path id sends to neighbour to: its own ASN (plus any prepends towards that neighbour), then its best path. */
  function pathOut(scene, id, to, best) {
    var me = asOf(scene, id), extra = (scene.prepend && scene.prepend[id] && scene.prepend[id][to]) || 0;
    var out = [];
    for (var i = 0; i <= extra; i++) out.push(me.asn);
    return out.concat(best.path);
  }

  // ── per-prefix tables ──

  function copyRoute(r) {
    return r ? { prefix: r.prefix, from: r.from, path: r.path.slice(), lp: r.lp, local: !!r.local, valid: r.valid } : null;
  }
  function sameRoute(x, y) {
    if (!x || !y) return !x && !y;
    return x.from === y.from && !!x.local === !!y.local && x.lp === y.lp && x.path.join(' ') === y.path.join(' ');
  }
  /** Prefixes an AS has entries for, shortest first (then by address). */
  function prefixesOf(a) {
    var out = [];
    a.rib.forEach(function (e) { if (out.indexOf(e.prefix) < 0) out.push(e.prefix); });
    Object.keys(a.best).forEach(function (p) { if (out.indexOf(p) < 0) out.push(p); });
    return out.sort(function (x, y) { return lenOf(x) - lenOf(y) || netOf(x) - netOf(y); });
  }

  /** Reruns the decision for one prefix at id; returns whether its best changed. Mutates st. */
  function rerun(scene, st, id, prefix) {
    var a = st.ases[id];
    var d = decide(scene, a.rib.filter(function (e) { return e.prefix === prefix; }));
    var was = a.best[prefix] || null;
    if (d.best) { a.best[prefix] = copyRoute(d.best); a.by[prefix] = d.by; }
    else { delete a.best[prefix]; delete a.by[prefix]; }
    return !sameRoute(was, d.best);
  }

  function sortRib(scene, rib) {
    rib.sort(function (x, y) {
      return lenOf(x.prefix) - lenOf(y.prefix) || (x.local ? -1 : 0) - (y.local ? -1 : 0) || order(scene, x.from) - order(scene, y.from);
    });
  }

  /** Adds a locally originated route for prefix at id (rule 1: it beats anything learned). */
  function originate(scene, st, id, prefix) {
    var a = st.ases[id];
    var v = scene.rov.indexOf(id) >= 0 ? validate(scene.roas, prefix, asOf(scene, id).asn) : null;
    a.rib.push({ prefix: prefix, from: null, path: [], lp: LP_DEFAULT, local: true, valid: v });
    sortRib(scene, a.rib);
    return rerun(scene, st, id, prefix);
  }

  // ── forwarding (rule 2) ──

  /**
   * Where id sends traffic for the test address by its own table: the longest matching prefix among its best routes,
   * whatever its origin. The home AS (where the address lives) delivers it itself: its internal routes are more
   * specific than anything announced (SPEC.md). Returns { prefix, via (null: delivered here), origin } or null.
   */
  function lookup(scene, st, id) {
    var a = st.ases[id];
    if (id === scene.home) return { prefix: null, via: null, origin: asOf(scene, id).asn, home: true };
    var hit = null;
    Object.keys(a.best).forEach(function (p) {
      if (!covers(p, scene.target)) return;
      if (!hit || lenOf(p) > lenOf(hit)) hit = p;
    });
    if (!hit) return null;
    var r = a.best[hit];
    return { prefix: hit, via: r.local ? null : r.from, origin: originOf(scene, id, r) };
  }

  /**
   * Every AS's forwarding: its own lookup, then the packet followed hop by hop to where it is delivered. dest is the
   * AS that delivers it (null: dropped for lack of a route, or a loop); hops the ASes it passes, from id to dest.
   */
  function forwarding(scene, st) {
    var look = {};
    scene.ases.forEach(function (a) { look[a.id] = lookup(scene, st, a.id); });
    var out = {};
    scene.ases.forEach(function (a) {
      var l = look[a.id];
      if (!l) { out[a.id] = null; return; }
      var hops = [a.id], cur = a.id, dest = null;
      for (var i = 0; i < MAX_HOPS; i++) {
        var c = look[cur];
        if (!c) break;
        if (!c.via) { dest = cur; break; }
        if (hops.indexOf(c.via) >= 0) break;
        hops.push(c.via);
        cur = c.via;
      }
      out[a.id] = { prefix: l.prefix, via: l.via, origin: l.origin, dest: dest, hops: hops };
    });
    return out;
  }

  function sameFwd(x, y) {
    if (!x || !y) return !x && !y;
    return x.via === y.via && x.dest === y.dest && x.prefix === y.prefix;
  }

  /** Puts the forwarding into st and returns the ids whose forwarding changed against prev (scene order). */
  function refwd(scene, st, prev) {
    var f = forwarding(scene, st);
    var changed = [];
    scene.ases.forEach(function (a) {
      st.ases[a.id].fwd = f[a.id];
      if (prev && !sameFwd(prev.ases[a.id].fwd, f[a.id])) changed.push(a.id);
    });
    return changed;
  }

  // ── rounds ──

  /**
   * One synchronous round (SPEC.md "One step"). (1) Every AS in send sends, for every prefix in its list, its best
   * path to every neighbour, or a withdrawal when it has none; all messages are taken before any is received. (2) A
   * receiver removes what that neighbour sent before for the prefix; drops the path if it holds its own ASN (loop);
   * if it validates, labels the route Valid / Invalid / NotFound and drops an Invalid one (rule 5); else stores it.
   * (3) Every receiver reruns the decision for the prefixes it heard. Returns the messages and the next senders.
   */
  function round(scene, st, send) {
    var msgs = [];
    scene.ases.forEach(function (a) {
      var list = send.filter(function (x) { return x.id === a.id; }).map(function (x) { return x.prefix; });
      if (!list.length) return;
      neighbours(scene, a.id).forEach(function (nb) {
        list.forEach(function (prefix) {
          var best = st.ases[a.id].best[prefix];
          msgs.push(best
            ? { from: a.id, to: nb.id, link: nb.link, prefix: prefix, kind: 'announce', path: pathOut(scene, a.id, nb.id, best) }
            : { from: a.id, to: nb.id, link: nb.link, prefix: prefix, kind: 'withdraw', path: null });
        });
      });
    });
    var touched = [];
    msgs.forEach(function (m) {
      var r = st.ases[m.to], me = asOf(scene, m.to), rov = scene.rov.indexOf(m.to) >= 0;
      var old = null;
      r.rib = r.rib.filter(function (e) {
        if (e.from === m.from && e.prefix === m.prefix) { old = e; return false; }
        return true;
      });
      m.removed = old ? old.path.slice() : null;
      m.valid = null;
      if (m.kind === 'withdraw') m.result = 'withdrawn';
      else if (m.path.indexOf(me.asn) >= 0) m.result = 'loop';
      else {
        if (rov) m.valid = validate(scene.roas, m.prefix, m.path[m.path.length - 1]);
        if (m.valid === 'invalid') m.result = 'invalid';
        else {
          m.result = 'stored';
          r.rib.push({ prefix: m.prefix, from: m.from, path: m.path.slice(), lp: lpFor(scene, m.to, m.from), valid: m.valid });
          sortRib(scene, r.rib);
        }
      }
      var key = m.to + ' ' + m.prefix;
      if (touched.indexOf(key) < 0) touched.push(key);
    });
    var next = [];
    scene.ases.forEach(function (a) {
      prefixesHeard(touched, a.id).forEach(function (prefix) {
        if (rerun(scene, st, a.id, prefix)) next.push({ id: a.id, prefix: prefix });
      });
    });
    return { msgs: msgs, send: next };
  }

  function prefixesHeard(touched, id) {
    return touched.filter(function (k) { return k.split(' ')[0] === id; }).map(function (k) { return k.split(' ')[1]; })
      .sort(function (x, y) { return lenOf(x) - lenOf(y); });
  }

  function emptyState(scene) {
    var ases = {};
    scene.ases.forEach(function (a) {
      ases[a.id] = { rib: [], best: {}, by: {}, rov: scene.rov.indexOf(a.id) >= 0, fwd: null };
    });
    return {
      round: 0, phase: 'origin', ases: ases, roas: scene.roas.map(function (r) { return Object.assign({}, r); }),
      announcements: [{ as: scene.origin.as, origin: asOf(scene, scene.origin.as).asn, prefix: scene.origin.prefix }],
      pending: null, msgs: [], send: [], changed: [], done: false
    };
  }

  /**
   * One step from s0: a round of the ASes in s0.send (and the pending origin, which starts announcing now); when no
   * one has anything to send, the network has converged and the run ends. Forwarding is recomputed after the round.
   */
  function advance(scene, s0) {
    var st = JSON.parse(JSON.stringify(s0));
    st.round = s0.round + 1;
    st.msgs = [];
    var send = s0.send.slice();
    if (st.pending) {
      var h = st.pending;
      if (originate(scene, st, h.as, h.prefix)) send.push({ id: h.as, prefix: h.prefix });
      st.announcements.push({ as: h.as, origin: asOf(scene, h.as).asn, prefix: h.prefix });
      st.pending = null;
      st.started = h.as;
    } else st.started = null;
    if (!send.length) {
      st.phase = 'converged'; st.send = []; st.done = true; st.changed = refwd(scene, st, s0);
      return st;
    }
    var r = round(scene, st, send);
    st.phase = 'round'; st.msgs = r.msgs; st.send = r.send;
    st.changed = refwd(scene, st, s0);
    return st;
  }

  /**
   * Step 0. Without a conflict: the origin has its prefix (a local route) and sends in round 1. With one: the
   * legitimate prefix has already spread and converged (the same rounds, run here); the conflicting AS starts
   * announcing in round 1.
   */
  function initialOf(scene) {
    var st = emptyState(scene);
    originate(scene, st, scene.origin.as, scene.origin.prefix);
    st.send = [{ id: scene.origin.as, prefix: scene.origin.prefix }];
    refwd(scene, st, null);
    if (!scene.hijack) return st;
    var n = 0;
    while (!st.done && n < MAX_STEPS) { n++; st = advance(scene, st); }
    st.round = 0; st.phase = 'ready'; st.done = false; st.msgs = []; st.changed = []; st.send = [];
    st.pending = { as: scene.hijack.as, prefix: scene.hijack.prefix };
    return st;
  }

  function stepOf(scene, s0) { return advance(scene, s0); }

  /** Ids whose traffic for the target ends at dest, in scene order. */
  function endingAt(scene, st, dest) {
    return scene.ases.map(function (a) { return a.id; }).filter(function (id) { return st.ases[id].fwd && st.ases[id].fwd.dest === dest; });
  }

  // ── the stepper ──

  var stepsCache = {};

  var logic = {
    LEGIT: LEGIT, MORE: MORE, TARGET: TARGET, LP_DEFAULT: LP_DEFAULT, ROV: ROV,

    defaults: { conflict: 'none', roa: false, rovDeployment: 'none' },

    /** Steps for these params: replay until the run converges (SPEC.md "Steps"). */
    steps: function (p) {
      var key = JSON.stringify([p.conflict, !!p.roa, p.rovDeployment]);
      if (stepsCache[key] != null) return stepsCache[key];
      var s = logic.initial(p), n = 0;
      while (!s.done && n < MAX_STEPS) { n++; s = logic.step(s, n, p); }
      stepsCache[key] = n;
      return n;
    },

    initial: function (p) { return initialOf(sceneOf(p)); },

    step: function (s, n, p) { return stepOf(sceneOf(p), s); },

    sceneOf: sceneOf, asOf: asOf, idOfAsn: idOfAsn, neighbours: neighbours, ipNum: ipNum, covers: covers,
    prefixCovers: prefixCovers, validate: validate, originOf: originOf, ridNum: ridNum, cmpPath: cmpPath,
    decidedBy: decidedBy, decide: decide, pathOut: pathOut, prefixesOf: prefixesOf, lookup: lookup,
    forwarding: forwarding, round: round, initialOf: initialOf, stepOf: stepOf, endingAt: endingAt
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
