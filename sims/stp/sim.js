/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for stp: classic spanning tree (IEEE 802.1D-1998 clause 8 terms; not RSTP). Switches exchange BPDUs, elect
   the root bridge (lowest bridge ID), pick one root port each and one designated port per link; every other port
   blocks. Port states run blocking → listening → learning → forwarding on the forward-delay timer; received
   information ages out after max age. With STP off a broadcast is flooded on every port and never dies.
   Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The engine (scene, BPDU
   compare, tick, flood) takes plain data and holds no strings, so it can move to models/ unchanged; the
   broadcast-storm presets add scenes (more switches, a router, a loop-free tree) to sceneOf. */
(function (root) {
  'use strict';

  var HELLO = 2, MAX_AGE = 20, FWD_DELAY = 15;
  var CUT_AT = 40;          // when cutLink takes effect: 10 s after the tree is forwarding (t = 30 s)
  var HORIZON = 200;        // no scene here needs more; a guard against a run that never settles
  var FLOOD_STEPS = 6;      // STP off: steps of the endless flood shown
  var COST = { 10: 100, 100: 19, 1000: 4, 10000: 2 };   // rule 7: 802.1D-1998 short path costs, by Mb/s

  // ── scene ──

  function mac(n) { return '02:00:00:00:00:0' + n; }
  function hex(n, w) { var s = n.toString(16); while (s.length < w) s = '0' + s; return s; }
  /** Rule 1: bridge ID = 16-bit priority, then the 48-bit MAC; as 16 hex digits it compares as a string. */
  function bidOf(prio, m) { return hex(prio, 4) + m.split(':').join(''); }
  /** Rule 2: port ID = priority 128, then the port number (128.1 = 0x8001). */
  function portIdOf(n) { return 128 * 256 + n; }

  /**
   * The scene for these params. nodes: switches (with prio, mac, bid), hosts and routers; links: { id, a, pa, b,
   * pb, speed, cost }, pa/pb the port number on a switch end (null on a host or router). sceneOf takes p.topo.
   */
  function sceneOf(p) {
    var sw = function (id, n, prio) { return { id: id, kind: 'switch', prio: prio, mac: mac(n), bid: bidOf(prio, mac(n)) }; };
    var link = function (id, a, pa, b, pb, speed) { return { id: id, a: a, pa: pa, b: b, pb: pb, speed: speed, cost: COST[speed] }; };
    if (p.topo === 'pair') {
      return {
        topo: 'pair',
        nodes: [sw('S1', 1, Number(p.prioS1)), sw('S2', 2, Number(p.prioS2)), { id: 'H1', kind: 'host' }, { id: 'H2', kind: 'host' }],
        // crossed on purpose: S1 p1 meets S2 p2 (task preset 5)
        links: [link('L1', 'S1', 1, 'S2', 2, 1000), link('L2', 'S1', 2, 'S2', 1, 1000),
          link('h1', 'H1', null, 'S1', 3, 1000), link('h2', 'S2', 3, 'H2', null, 1000)],
        sender: 'H1'
      };
    }
    return {
      topo: 'triangle',
      nodes: [sw('S1', 1, Number(p.prioS1)), sw('S2', 2, Number(p.prioS2)), sw('S3', 3, Number(p.prioS3)),
        { id: 'H1', kind: 'host' }, { id: 'H3', kind: 'host' }],
      links: [link('S1-S2', 'S1', 1, 'S2', 1, 1000), link('S1-S3', 'S1', 2, 'S3', 1, p.slowLink === 'S1-S3' ? 100 : 1000),
        link('S2-S3', 'S2', 2, 'S3', 2, 1000), link('h1', 'H1', null, 'S1', 3, 1000), link('h3', 'S3', 3, 'H3', null, 1000)],
      sender: 'H1'
    };
  }

  function nodeOf(scene, id) { for (var i = 0; i < scene.nodes.length; i++) if (scene.nodes[i].id === id) return scene.nodes[i]; return null; }
  function linkOf(scene, id) { for (var i = 0; i < scene.links.length; i++) if (scene.links[i].id === id) return scene.links[i]; return null; }
  function isSwitch(scene, id) { var n = nodeOf(scene, id); return !!n && n.kind === 'switch'; }

  /** Every switch port, in scene order: { key 'S1:1', bridge, port, link, peer, peerPort }. */
  function portsOf(scene) {
    var out = [];
    scene.nodes.forEach(function (n) {
      if (n.kind !== 'switch') return;
      scene.links.forEach(function (l) {
        if (l.a === n.id) out.push({ key: n.id + ':' + l.pa, bridge: n.id, port: l.pa, link: l.id, peer: l.b, peerPort: l.pb });
        if (l.b === n.id) out.push({ key: n.id + ':' + l.pb, bridge: n.id, port: l.pb, link: l.id, peer: l.a, peerPort: l.pa });
      });
    });
    var order = scene.nodes.map(function (n) { return n.id; });
    out.sort(function (x, y) { return order.indexOf(x.bridge) - order.indexOf(y.bridge) || x.port - y.port; });
    return out;
  }

  // ── BPDU compare (rule 2) ──

  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  /** Priority vector compare: root BID, root path cost, sender BID, sender port ID; the first difference decides. */
  function cmpVec(x, y) {
    return cmp(x.root, y.root) || cmp(x.cost, y.cost) || cmp(x.bridge, y.bridge) || cmp(x.port, y.port);
  }
  /** Which field decided cmpVec(x, y): 'root' | 'cost' | 'bridge' | 'port' | null (equal). */
  function decidedBy(x, y) {
    if (x.root !== y.root) return 'root';
    if (x.cost !== y.cost) return 'cost';
    if (x.bridge !== y.bridge) return 'bridge';
    if (x.port !== y.port) return 'port';
    return null;
  }

  // ── STP engine ──

  /** Step 0 with STP on: just powered on. Every switch is its own root, every port blocking, nothing heard. */
  function initialStp(scene, p) {
    var bridges = scene.nodes.filter(function (n) { return n.kind === 'switch'; }).map(function (n) {
      return { id: n.id, bid: n.bid, root: n.bid, cost: 0, rootPort: null };
    });
    var ports = portsOf(scene).map(function (q) {
      return { key: q.key, bridge: q.bridge, port: q.port, link: q.link, peer: q.peer, peerPort: q.peerPort,
        role: null, state: 'blocking', since: 0, stored: null };
    });
    return {
      mode: 'stp', t: 0, phase: 'power', cutAt: p.topo === 'triangle' && p.cutLink && p.cutLink !== 'none' ? CUT_AT : null,
      cut: p.topo === 'triangle' && p.cutLink && p.cutLink !== 'none' ? p.cutLink : null,
      links: scene.links.map(function (l) { return { id: l.id, up: true }; }),
      bridges: bridges, ports: ports, bpdus: [], changes: [], confirm: false, done: false, frame: null
    };
  }

  function bridgeOf(st, id) { for (var i = 0; i < st.bridges.length; i++) if (st.bridges[i].id === id) return st.bridges[i]; return null; }
  function portByKey(st, key) { for (var i = 0; i < st.ports.length; i++) if (st.ports[i].key === key) return st.ports[i]; return null; }
  function portAt(st, bridge, n) { return portByKey(st, bridge + ':' + n); }
  function linkUp(st, id) { for (var i = 0; i < st.links.length; i++) if (st.links[i].id === id) return st.links[i].up; return false; }

  /** What a bridge offers on one of its ports (the BPDU it sends there). */
  function offerOf(b, q) { return { root: b.root, cost: b.cost, bridge: b.bid, port: portIdOf(q.port) }; }

  /**
   * Rules 3–6: from the received information, each bridge's root and root port, then every port's role.
   * Root port (rule 4): lowest (root, advertised cost + link cost, sender BID, sender port, own port ID).
   * Designated (rule 5): the bridge's own offer beats what the port has stored; the port then stores its own offer
   * (IEEE 802.1D: a designated port holds the bridge's information). Everything else blocks (rule 6).
   * Mutates st (a copy made by the caller).
   */
  function recompute(scene, st) {
    st.bridges.forEach(function (b) {
      var best = null, bestPort = null;
      st.ports.forEach(function (q) {
        if (q.bridge !== b.id || !q.stored || q.stored.own || !linkUp(st, q.link)) return;
        var cost = q.stored.cost + linkOf(scene, q.link).cost;
        var v = { root: q.stored.root, cost: cost, bridge: q.stored.bridge, port: q.stored.port, own: portIdOf(q.port) };
        if (!best || cmpVec(v, best) < 0 || (cmpVec(v, best) === 0 && v.own < best.own)) { best = v; bestPort = q.port; }
      });
      if (best && best.root < b.bid) { b.root = best.root; b.cost = best.cost; b.rootPort = bestPort; }
      else { b.root = b.bid; b.cost = 0; b.rootPort = null; }
    });
    st.ports.forEach(function (q) {
      if (!linkUp(st, q.link)) { q.role = 'disabled'; q.stored = null; return; }
      var b = bridgeOf(st, q.bridge);
      if (q.port === b.rootPort) { q.role = 'root'; return; }
      var mine = offerOf(b, q);
      if (!q.stored || q.stored.own || cmpVec(mine, q.stored) < 0) {
        q.role = 'designated';
        q.stored = { root: mine.root, cost: mine.cost, bridge: mine.bridge, port: mine.port, own: true };
      } else {
        q.role = 'blocked';
      }
    });
  }

  /** Rule 8: port states on the forward-delay timer. Only a root or designated port leaves blocking. */
  function advanceStates(st) {
    st.ports.forEach(function (q) {
      if (q.role === 'disabled') { q.state = 'disabled'; return; }
      if (q.role === 'blocked') { if (q.state !== 'blocking') { q.state = 'blocking'; q.since = st.t; } return; }
      if (q.state === 'blocking' || q.state === 'disabled') { q.state = 'listening'; q.since = st.t; }
      else if (q.state === 'listening' && st.t - q.since >= FWD_DELAY) { q.state = 'learning'; q.since = st.t; }
      else if (q.state === 'learning' && st.t - q.since >= FWD_DELAY) { q.state = 'forwarding'; q.since = st.t; }
    });
  }

  /**
   * One BPDU round. all: every port sends (the claims at power-on). Otherwise the root sends on its designated
   * ports, and a non-root bridge relays on its designated ports when its root port heard a BPDU at the last hello
   * (802.1D-1998: a non-root bridge transmits on receiving from the root). newRoots: only these bridges send (one
   * that has just become root sends at once). Sends are taken from the state before anything is received.
   * Receive (rule 2, 802.1D supersedes): the port stores a BPDU that is better than or equal to what it holds;
   * a worse one is ignored. Returns the messages with their result: 'stored', 'refreshed' or 'ignored'.
   */
  function round(scene, st, opt) {
    var msgs = [];
    st.bridges.forEach(function (b) {
      if (opt.only && opt.only.indexOf(b.id) < 0) return;
      var isRoot = b.root === b.bid;
      var rp = b.rootPort != null ? portAt(st, b.id, b.rootPort) : null;
      var relay = rp && rp.stored && !rp.stored.own && rp.stored.at === st.t - HELLO;
      if (!opt.all && !isRoot && !relay) return;
      st.ports.forEach(function (q) {
        if (q.bridge !== b.id || !linkUp(st, q.link) || !isSwitch(scene, q.peer)) return;
        if (!opt.all && q.role !== 'designated') return;
        msgs.push({ from: b.id, fromPort: q.port, to: q.peer, toPort: q.peerPort, link: q.link, vec: offerOf(b, q) });
      });
    });
    msgs.forEach(function (m) {
      var q = portAt(st, m.to, m.toPort);
      var s = q.stored;
      if (!s || cmpVec(m.vec, s) < 0) {
        m.result = 'stored';
        m.over = s ? { root: s.root, cost: s.cost, bridge: s.bridge, port: s.port, own: !!s.own } : null;
        q.stored = { root: m.vec.root, cost: m.vec.cost, bridge: m.vec.bridge, port: m.vec.port, at: st.t };
      } else if (cmpVec(m.vec, s) === 0 && !s.own) {
        m.result = 'refreshed';
        q.stored.at = st.t;
      } else {
        m.result = 'ignored';
        m.over = { root: s.root, cost: s.cost, bridge: s.bridge, port: s.port, own: !!s.own, age: s.own ? null : st.t - s.at };
      }
    });
    return msgs;
  }

  /** Rule 8: received information older than max age is dropped. Returns the keys of the ports that lost it. */
  function ageOut(st) {
    var out = [];
    st.ports.forEach(function (q) {
      if (q.stored && !q.stored.own && st.t - q.stored.at >= MAX_AGE) {
        out.push({ key: q.key, stored: { root: q.stored.root, cost: q.stored.cost, bridge: q.stored.bridge, port: q.stored.port } });
        q.stored = null;
      }
    });
    return out;
  }

  /** What a step compares to decide whether something changed (the stored information without its age). */
  function snapshot(st) {
    return JSON.stringify({
      b: st.bridges.map(function (b) { return [b.root, b.cost, b.rootPort]; }),
      p: st.ports.map(function (q) { return [q.role, q.state, q.stored ? [q.stored.root, q.stored.cost, q.stored.bridge, q.stored.port, !!q.stored.own] : null]; }),
      l: st.links.map(function (l) { return l.up; })
    });
  }
  function rolesOf(st) { return JSON.stringify(st.bridges.map(function (b) { return [b.root, b.rootPort]; }).concat(st.ports.map(function (q) { return q.role; }))); }

  /**
   * One second of time at st.t: age out → recompute → BPDU round (every 2 s) → the scheduled cut → recompute,
   * and a bridge that became root sends at once → port timers. Returns what happened.
   */
  function tick(scene, st, first) {
    var ev = { aged: [], bpdus: [], cut: null, newRoots: [], preCut: [] };
    ev.aged = ageOut(st);
    recompute(scene, st);
    if (first || st.t % HELLO === 0) ev.bpdus = round(scene, st, { all: !!first });
    recompute(scene, st);
    if (st.cutAt === st.t) {
      var wasRoot = st.bridges.filter(function (b) { return b.root === b.bid; }).map(function (b) { return b.id; });
      st.links.forEach(function (l) { if (l.id === st.cut) l.up = false; });
      ev.cut = st.cut;
      ev.preCut = ev.bpdus;    // the routine hello just before the cut; the page shows what follows it
      ev.bpdus = [];
      recompute(scene, st);
      ev.newRoots = st.bridges.filter(function (b) { return b.root === b.bid && wasRoot.indexOf(b.id) < 0; }).map(function (b) { return b.id; });
      if (ev.newRoots.length) { ev.bpdus = round(scene, st, { only: ev.newRoots }); recompute(scene, st); }
    }
    advanceStates(st);
    return ev;
  }

  /** No port timer running, no confirming hello due, no cut still to come. Ageing is checked by running on. */
  function settled(st) {
    return st.ports.every(function (q) { return q.state === 'blocking' || q.state === 'forwarding' || q.state === 'disabled'; }) &&
      (st.cutAt == null || st.t >= st.cutAt) && !st.confirm;
  }

  /** Who changed what between two states: roles, states, roots and root ports (for marks and captions). */
  function diff(a, b) {
    var out = [];
    b.bridges.forEach(function (nb, i) {
      var ob = a.bridges[i];
      if (ob.root !== nb.root || ob.cost !== nb.cost || ob.rootPort !== nb.rootPort) {
        out.push({ kind: 'bridge', bridge: nb.id, root: nb.root, cost: nb.cost, rootPort: nb.rootPort, wasRoot: ob.root, wasRootPort: ob.rootPort });
      }
    });
    b.ports.forEach(function (nq, i) {
      var oq = a.ports[i];
      if (oq.role !== nq.role) out.push({ kind: 'role', key: nq.key, bridge: nq.bridge, port: nq.port, from: oq.role, to: nq.role });
      if (oq.state !== nq.state) out.push({ kind: 'state', key: nq.key, bridge: nq.bridge, port: nq.port, from: oq.state, to: nq.state });
    });
    return out;
  }

  /** Advance to the next step: the next second in which something changes (see SPEC.md "One step"). */
  function stepStp(scene, s0) {
    var st = JSON.parse(JSON.stringify(s0));
    if (st.phase === 'power') {
      st.phase = 'claims';
      var ev0 = tick(scene, st, true);
      return finish(st, s0, ev0, 'claims', true);
    }
    // settled: nothing can change within max age + a hello (no port timer runs, no information ages out, no cut
    // is due); the last step then sends one broadcast over the tree
    var window = settled(st) ? MAX_AGE + HELLO : HORIZON;
    for (var guard = 0; guard < window; guard++) {
      st.t += 1;
      var before = snapshot(st), rolesBefore = rolesOf(st);
      var ev = tick(scene, st, false);
      var bpduChange = rolesOf(st) !== rolesBefore || ev.bpdus.some(function (m) { return m.result === 'stored'; }) || ev.aged.length || ev.cut;
      var changed = snapshot(st) !== before || ev.cut;
      var isHello = st.t % HELLO === 0;
      if (changed || (st.confirm && isHello)) {
        var kind = ev.cut ? 'cut' : ev.aged.length ? 'aged' : bpduChange ? 'round' : changed ? 'timer' : 'stable';
        return finish(st, s0, ev, kind, bpduChange);
      }
    }
    var fin = JSON.parse(JSON.stringify(s0));
    fin.phase = 'frame';
    fin.frame = floodTree(scene, fin);
    fin.bpdus = []; fin.changes = []; fin.aged = []; fin.cutNow = null; fin.newRoots = []; fin.done = true;
    return fin;
  }

  function finish(st, s0, ev, kind, bpduChange) {
    st.phase = kind;
    st.bpdus = ev.bpdus;
    st.aged = ev.aged;
    st.cutNow = ev.cut;
    st.newRoots = ev.newRoots;
    st.changes = diff(s0, st);
    // after a step that changed the tree, the next hello is shown too: it confirms that nothing changes any more
    st.confirm = kind === 'stable' ? false : kind === 'timer' ? !!s0.confirm : !!bpduChange;
    return st;
  }

  /**
   * A broadcast from the scene's sender over the current tree, run to the end (STP on): a switch forwards a frame
   * that came in on a forwarding port out of every other forwarding port; a frame arriving at a port that is not
   * forwarding is discarded there. Returns the hops in order and the copies each host received.
   */
  function floodTree(scene, st) {
    var first = firstFrame(scene);
    var hops = [], frames = first ? [first] : [], recv = {};
    for (var guard = 0; frames.length && guard < 32; guard++) {
      var next = [];
      frames.forEach(function (f) {
        var q = isSwitch(scene, f.to) ? portAt(st, f.to, f.toPort) : null;
        var drop = q && q.state !== 'forwarding';
        hops.push({ from: f.from, to: f.to, link: f.link, drop: !!drop, wave: guard });
        if (drop) return;
        next = next.concat(arrive(scene, f, recv, function (bridge, port) { var pq = portAt(st, bridge, port); return pq && pq.state === 'forwarding'; }, function (id) { return linkUp(st, id); }));
      });
      frames = next;
    }
    return { hops: hops, recv: recv };
  }

  function firstFrame(scene) {
    var l = scene.links.filter(function (k) { return k.a === scene.sender || k.b === scene.sender; })[0];
    if (!l) return null;
    var to = l.a === scene.sender ? l.b : l.a;
    return { from: scene.sender, to: to, toPort: l.a === scene.sender ? l.pb : l.pa, link: l.id };
  }

  /**
   * A frame f arrives at f.to. A host counts it; a router does not forward a broadcast (it ends the broadcast
   * domain); a switch floods it out of every other port whose link is up and that may send (rule 9 when STP is off:
   * every port may). Returns the new frames.
   */
  function arrive(scene, f, recv, maySend, up) {
    var n = nodeOf(scene, f.to);
    if (n.kind !== 'switch') { if (n.kind === 'host') recv[n.id] = (recv[n.id] || 0) + 1; return []; }
    var out = [];
    scene.links.forEach(function (l) {
      if (l.id === f.link || !up(l.id)) return;
      var mine = l.a === n.id ? l.pa : l.b === n.id ? l.pb : null;
      if (mine == null || !maySend(n.id, mine)) return;
      var to = l.a === n.id ? l.b : l.a;
      out.push({ from: n.id, to: to, toPort: l.a === n.id ? l.pb : l.pa, link: l.id });
    });
    return out;
  }

  // ── STP off: the endless flood (rule 9) ──

  function initialFlood(scene) {
    return { mode: 'flood', t: 0, phase: 'power', frames: [], recv: {}, total: 0, inFlight: 0, wave: 0, done: false };
  }
  /** One step: every frame on the wire arrives; every switch that got one floods it on (all from one snapshot). */
  function stepFlood(scene, s0) {
    var st = JSON.parse(JSON.stringify(s0));
    var recv = st.recv;
    var next = [];
    if (st.phase === 'power') next = firstFrame(scene) ? [firstFrame(scene)] : [];
    else st.frames.forEach(function (f) { next = next.concat(arrive(scene, f, {}, function () { return true; }, function () { return true; })); });
    next.forEach(function (f) { if (!isSwitch(scene, f.to)) recv[f.to] = (recv[f.to] || 0) + 1; });
    st.phase = 'flood';
    st.wave += 1;
    st.frames = next;
    st.inFlight = next.length;
    st.total += next.length;
    st.recv = recv;
    return st;
  }

  // ── the stepper ──

  var logic = {
    HELLO: HELLO, MAX_AGE: MAX_AGE, FWD_DELAY: FWD_DELAY, CUT_AT: CUT_AT, COST: COST, FLOOD_STEPS: FLOOD_STEPS,

    defaults: { stp: true, topo: 'triangle', prioS1: 32768, prioS2: 32768, prioS3: 32768, cutLink: 'none', slowLink: 'none' },

    /** Steps for these params: replay to the end (the run settles; SPEC.md "Steps"). */
    steps: function (p) {
      var key = JSON.stringify(p);
      if (stepsCache[key] != null) return stepsCache[key];
      var s = logic.initial(p), n = 0;
      while (!s.done && n < 40) { n++; s = logic.step(s, n, p); }
      stepsCache[key] = n;
      return n;
    },

    initial: function (p) {
      var scene = sceneOf(p);
      return p.stp ? initialStp(scene, p) : initialFlood(scene);
    },

    step: function (s, n, p) {
      var scene = sceneOf(p);
      if (s.mode === 'flood') {
        var f = stepFlood(scene, s);
        f.done = n >= FLOOD_STEPS;
        return f;
      }
      return stepStp(scene, s);
    },

    sceneOf: sceneOf, portsOf: portsOf, bidOf: bidOf, portIdOf: portIdOf, cmpVec: cmpVec, decidedBy: decidedBy,
    offerOf: offerOf, recompute: recompute, round: round, tick: tick, floodTree: floodTree, arrive: arrive,
    initialStp: initialStp, stepStp: stepStp, initialFlood: initialFlood, stepFlood: stepFlood,
    bridgeOf: bridgeOf, portAt: portAt, nodeOf: nodeOf, linkOf: linkOf
  };
  var stepsCache = {};

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
