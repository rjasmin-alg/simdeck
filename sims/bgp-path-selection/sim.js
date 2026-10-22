/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for bgp-path-selection: one prefix spreads between five autonomous systems by eBGP announcements, in
   synchronous rounds. Each AS keeps the path it last heard from every neighbour, drops a path that already holds its
   own ASN (loop prevention), and picks its best by local preference, then AS-path length, then the lowest router ID
   of the advertising neighbour (RFC 4271 §9.1.2.2). An AS whose best changed tells every neighbour in the next round,
   with its own ASN prepended, or withdraws the prefix when it has no path left. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The engine (decide, round,
   fail) takes a plain scene and holds no strings, so it can move to models/ unchanged for bgp-hijack and
   peering-transit. */
(function (root) {
  'use strict';

  var PREFIX = '203.0.113.0/24';   // RFC 5737 documentation prefix
  var LP_DEFAULT = 100;
  var MAX_STEPS = 40;              // guard: no param combination here needs more than 11

  // ── scene ──

  /**
   * The page's internet for these params. ases in drawing order (O, A, B, C, D); ASNs from RFC 5398. Router IDs are
   * chosen so that only the ties the presets are about occur: A < B (C's tie), O < C (B's tie at prepend 2, where
   * B keeps its direct path). lp: { receiver: { neighbour: value } }, everything else LP_DEFAULT.
   * prepend: { sender: { towards: count } } extra copies of the sender's ASN. fail: the link that fails once the
   * network has converged, or null.
   */
  function sceneOf(p) {
    var lpC = Number(p.dLocalPrefFromC) || LP_DEFAULT;
    var prep = Math.max(0, Math.min(3, Number(p.prependOtoB) || 0));
    return {
      prefix: PREFIX,
      origin: 'O',
      ases: [
        { id: 'O', asn: 64496, routerId: '192.0.2.3' },
        { id: 'A', asn: 64497, routerId: '192.0.2.1' },
        { id: 'B', asn: 64498, routerId: '192.0.2.2' },
        { id: 'C', asn: 64499, routerId: '192.0.2.4' },
        { id: 'D', asn: 64500, routerId: '192.0.2.5' }
      ],
      links: [
        { id: 'O-A', a: 'O', b: 'A' }, { id: 'O-B', a: 'O', b: 'B' }, { id: 'A-C', a: 'A', b: 'C' },
        { id: 'B-C', a: 'B', b: 'C' }, { id: 'B-D', a: 'B', b: 'D' }, { id: 'C-D', a: 'C', b: 'D' }
      ],
      lp: { D: { C: lpC } },
      prepend: { O: { B: prep } },
      fail: p.failLink === 'O-B' || p.failLink === 'O-A' ? p.failLink : null
    };
  }

  function asOf(scene, id) { for (var i = 0; i < scene.ases.length; i++) if (scene.ases[i].id === id) return scene.ases[i]; return null; }
  function order(scene, id) { for (var i = 0; i < scene.ases.length; i++) if (scene.ases[i].id === id) return i; return -1; }
  function linkUp(st, id) { for (var i = 0; i < st.links.length; i++) if (st.links[i].id === id) return st.links[i].up; return false; }

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

  /** Rule 3: LOCAL_PREF is set by the receiving AS, per neighbour; it is never part of what is sent. */
  function lpFor(scene, receiver, from) {
    var t = scene.lp && scene.lp[receiver];
    return t && t[from] != null ? t[from] : LP_DEFAULT;
  }

  /** Router ID as a number, so 192.0.2.10 sorts after 192.0.2.9. */
  function ridNum(rid) { return rid.split('.').reduce(function (n, x) { return n * 256 + Number(x); }, 0); }

  // ── the decision (rules 3–6) ──

  /**
   * Total order on stored paths, best first: the locally originated route; then highest LOCAL_PREF (rule 3); then
   * the shortest AS_PATH (rule 4); ORIGIN and MED are equal for every path here (rule 5); then the lowest router ID
   * of the advertising neighbour (rule 6). The neighbour's scene order is a last guard, never reached with unique
   * router IDs and one session per neighbour (rule 6's peer address, SPEC.md).
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

  /**
   * The best of an AS's stored paths: { best, runner, by }. by is the rule that beat the runner-up, 'only' for a
   * single path, null for none.
   */
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

  // ── rounds ──

  /** Step 0: the origin has its prefix (a local route); no one else knows it. The origin sends in round 1. */
  function initialOf(scene) {
    var ases = {};
    scene.ases.forEach(function (a) { ases[a.id] = { rib: [], best: null, by: null }; });
    ases[scene.origin].rib.push({ from: null, path: [], lp: LP_DEFAULT, local: true });
    var st = {
      round: 0, phase: 'origin', ases: ases,
      links: scene.links.map(function (l) { return { id: l.id, up: true }; }),
      msgs: [], changed: [scene.origin], failed: null, lost: [], failDone: false, done: false
    };
    rerun(scene, st, scene.origin);
    return st;
  }

  /** The path id sends to neighbour to: its own ASN (plus any prepends towards that neighbour), then its best path. */
  function pathOut(scene, id, to, best) {
    var me = asOf(scene, id), extra = (scene.prepend && scene.prepend[id] && scene.prepend[id][to]) || 0;
    var out = [];
    for (var i = 0; i <= extra; i++) out.push(me.asn);
    return out.concat(best.path);
  }

  /**
   * One synchronous round (SPEC.md "One step"). (1) Every AS in senders sends its best path to every neighbour over
   * a link that is up, or a withdrawal when it has none; all messages are taken before any is received. (2) A
   * receiver drops a path that already holds its own ASN (rule 2); the message still replaces what that neighbour
   * sent before, so the old path from it is gone too (RFC 4271 §9: a new route replaces the older one). A withdrawal
   * removes the neighbour's path (rule 7). (3) Every AS that received something reruns the decision.
   * Returns the messages with their result and the ids whose best changed.
   */
  function round(scene, st, senders) {
    var msgs = [];
    scene.ases.forEach(function (a) {
      if (senders.indexOf(a.id) < 0) return;
      var best = st.ases[a.id].best;
      neighbours(scene, st, a.id).forEach(function (nb) {
        msgs.push(best
          ? { from: a.id, to: nb.id, link: nb.link, kind: 'announce', path: pathOut(scene, a.id, nb.id, best) }
          : { from: a.id, to: nb.id, link: nb.link, kind: 'withdraw', path: null });
      });
    });
    var touched = [];
    msgs.forEach(function (m) {
      var r = st.ases[m.to], me = asOf(scene, m.to);
      var old = null;
      r.rib = r.rib.filter(function (e) { if (e.from === m.from) { old = e; return false; } return true; });
      m.removed = old ? old.path.slice() : null;
      if (m.kind === 'withdraw') m.result = 'withdrawn';
      else if (m.path.indexOf(me.asn) >= 0) m.result = 'loop';
      else {
        m.result = 'stored';
        r.rib.push({ from: m.from, path: m.path.slice(), lp: lpFor(scene, m.to, m.from) });
        sortRib(scene, r.rib);
      }
      if (touched.indexOf(m.to) < 0) touched.push(m.to);
    });
    var changed = scene.ases.map(function (a) { return a.id; }).filter(function (id) {
      return touched.indexOf(id) >= 0 && rerun(scene, st, id);
    });
    return { msgs: msgs, changed: changed };
  }

  /**
   * The scene's link fails (rule 7, a failure in place of a withdrawal): both ends forget what they heard over it
   * and rerun the decision. Returns the removed entries and the ids whose best changed.
   */
  function fail(scene, st, linkId) {
    var l = null;
    scene.links.forEach(function (k) { if (k.id === linkId) l = k; });
    st.links.forEach(function (k) { if (k.id === linkId) k.up = false; });
    var lost = [];
    [[l.a, l.b], [l.b, l.a]].forEach(function (pair) {
      var a = st.ases[pair[0]];
      a.rib = a.rib.filter(function (e) {
        if (e.from === pair[1]) { lost.push({ at: pair[0], from: pair[1], path: e.path.slice() }); return false; }
        return true;
      });
    });
    var changed = [l.a, l.b].sort(function (x, y) { return order(scene, x) - order(scene, y); })
      .filter(function (id) { return rerun(scene, st, id); });
    return { lost: lost, changed: changed };
  }

  /**
   * Step n. The ASes whose best changed in the previous step send (a round). When no one has anything to send the
   * network has converged: the scene's link then fails, if it has one still to fail, else the run ends.
   */
  function stepOf(scene, s0) {
    var st = JSON.parse(JSON.stringify(s0));
    st.round = s0.round + 1;
    st.msgs = []; st.lost = []; st.failed = null;
    var senders = s0.changed;
    if (!senders.length) {
      if (scene.fail && !st.failDone) {
        var f = fail(scene, st, scene.fail);
        st.phase = 'fail'; st.failed = scene.fail; st.failDone = true; st.lost = f.lost; st.changed = f.changed;
        return st;
      }
      st.phase = 'converged'; st.changed = []; st.done = true;
      return st;
    }
    var r = round(scene, st, senders);
    st.phase = 'round'; st.msgs = r.msgs; st.changed = r.changed;
    return st;
  }

  /** The best path of id as the AS sequence traffic follows: [id, next, …, origin], from the AS path. */
  function pathIds(scene, st, id) {
    var b = st.ases[id].best;
    if (!b) return null;
    var out = [id];
    b.path.forEach(function (asn) {
      var a = scene.ases.filter(function (x) { return x.asn === asn; })[0];
      if (a && out[out.length - 1] !== a.id) out.push(a.id);
    });
    return out;
  }

  // ── the stepper ──

  var stepsCache = {};

  var logic = {
    PREFIX: PREFIX, LP_DEFAULT: LP_DEFAULT,

    defaults: { dLocalPrefFromC: 100, failLink: 'none', prependOtoB: 0, watch: 'D' },

    /** Steps for these params: replay until the run converges (SPEC.md "Steps"). */
    steps: function (p) {
      var key = JSON.stringify([p.dLocalPrefFromC, p.failLink, p.prependOtoB]);
      if (stepsCache[key] != null) return stepsCache[key];
      var s = logic.initial(p), n = 0;
      while (!s.done && n < MAX_STEPS) { n++; s = logic.step(s, n, p); }
      stepsCache[key] = n;
      return n;
    },

    initial: function (p) { return initialOf(sceneOf(p)); },

    step: function (s, n, p) { return stepOf(sceneOf(p), s); },

    sceneOf: sceneOf, asOf: asOf, lpFor: lpFor, ridNum: ridNum, cmpPath: cmpPath, decidedBy: decidedBy, decide: decide,
    initialOf: initialOf, stepOf: stepOf, round: round, fail: fail, pathOut: pathOut, pathIds: pathIds, neighbours: neighbours
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
