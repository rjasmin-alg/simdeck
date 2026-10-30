/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for port-forwarding: router R between a LAN (A, B and the server S) and the internet (an outside client K
   and the web server W) keeps two tables: the translation table, whose rows outbound packets make (PAT, as in
   sims/nat and URM ch. 11, Primjer 4), and the port forwards, static rows an administrator writes so that a packet
   from outside to one outside port reaches one inside socket (RFC 3022 §2, "static address maps"). One step moves
   one packet one hop. R decides in a fixed order: (1) a row of a known connection, (2) for a packet to R's outside
   address, a forward, which rewrites the destination only and records the connection, (3) otherwise drop; and an
   outbound packet of a new connection gets a new PAT row. Rules and numbers: SPEC.md.
   A row is a connection as R tracks it: its two directions as R receives them, orig (as the opener sent it) and
   reply (as the answer will arrive), so one lookup finds both later packets of the opener and the answers.
   Pure: no DOM, no Math.random, no Date, no timers. Addresses are strings ("a.b.c.d"), ports numbers; state is
   plain JSON. classify, addForward, freePort and the scene walk are pure functions over plain data, ready for
   models/ (lnx-container-ports puts a container, 10.88.0.5, behind the same rules). */
(function (root) {
  'use strict';

  /** The scene. 192.168.1.0/24 is private (RFC 1918); 203.0.113.0/24 and 198.51.100.0/24 are documentation blocks
      (RFC 5737). A, B, W, 203.0.113.5, port 51000 and 61000 are the book's (URM ch. 11, Primjer 4); S and K are
      the task's. */
  var NODES = {
    A: { ip: '192.168.1.10', side: 'in' },
    B: { ip: '192.168.1.11', side: 'in' },
    S: { ip: '192.168.1.20', side: 'in' },
    R: { ip: '192.168.1.1', side: 'router' },
    K: { ip: '198.51.100.77', side: 'out' },
    W: { ip: '198.51.100.10', side: 'out' }
  };
  var NET = { outside: '203.0.113.5', inside: '192.168.1.', first: 61000 };
  var SRC_PORT = 51000;          // A's and B's source port (Primjer 4)
  var CLIENT_PORT = 40000;       // K's source port (task file)
  var WEB = { ip: '198.51.100.10', port: 443 };
  /** The page's one forward: TCP 8080 → S:80 (task file, preset add-forward). */
  var FORWARD = { proto: 'tcp', extPort: 8080, to: { ip: '192.168.1.20', port: 80 } };

  function ep(ip, port) { return { ip: ip, port: port }; }
  function same(a, b) { return !!a && !!b && a.ip === b.ip && a.port === b.port; }
  function pk(proto, src, dst) { return { proto: proto, src: ep(src.ip, src.port), dst: ep(dst.ip, dst.port) }; }
  function nodeOf(ip) {
    for (var k in NODES) if (NODES[k].ip === ip) return k;
    return null;
  }
  function inside(net, ip) { return ip.indexOf(net.inside) === 0; }

  // from sims/nat/sim.js @ ff047ee
  /** The lowest port from `first` up that no row of the table uses on outside address `ip`. */
  function freePort(table, ip, first) {
    var port = first;
    for (;;) {
      var taken = table.some(function (r) { return r.outside.ip === ip && r.outside.port === port; });
      if (!taken) return port;
      port++;
    }
  }

  /** Every outside socket in use: each row's endpoints on the outside address, and every forward's port (any
      protocol), so a dynamic port never lands on a forwarded one (rule 7). In nat's freePort shape. */
  function usedOutside(net, table, forwards) {
    var used = [];
    table.forEach(function (r) {
      [r.orig.src, r.orig.dst, r.reply.src, r.reply.dst].forEach(function (e) {
        if (e.ip === net.outside) used.push({ outside: e });
      });
    });
    forwards.forEach(function (f) { used.push({ outside: ep(net.outside, f.extPort) }); });
    return used;
  }
  function nextPort(net, table, forwards) { return freePort(usedOutside(net, table, forwards), net.outside, net.first); }

  /** Add a forward. A second forward on the same protocol and outside port is refused: one outside port names one
      inside socket (rule 8). The same inside socket may have several forwards. A forward may name one address of R
      (`addr`, a container published on 127.0.0.1 only, C4); without it, it holds the port on every address, so it
      clashes with any forward on that port, and two bound to different addresses do not (C5). Returns
      { forwards, refused, clash (index of the forward in the way, or -1) }. */
  function addForward(forwards, f) {
    var clash = -1;
    forwards.forEach(function (g, i) {
      if (clash < 0 && g.proto === f.proto && g.extPort === f.extPort && (!g.addr || !f.addr || g.addr === f.addr)) clash = i;
    });
    if (clash >= 0) return { forwards: forwards, refused: true, clash: clash };
    var made = { proto: f.proto, extPort: f.extPort, to: ep(f.to.ip, f.to.port) };
    if (f.addr) made.addr = f.addr;
    return { forwards: forwards.concat([made]), refused: false, clash: -1 };
  }

  /** How one row compares with a packet: hit (the packet is one direction of the row's connection), the direction
      ('orig' or 'reply'), and on a miss the fields that differ from the nearer direction (proto, src, dst), each
      given as the row's view column it shows in; on a tie, the direction sent to the packet's destination address. */
  function compareRow(r, pkt) {
    function diff(tu) {
      var d = [];
      if (r.proto !== pkt.proto) d.push('proto');
      if (!same(tu.src, pkt.src)) d.push(colOf(r, tu.src));
      if (!same(tu.dst, pkt.dst)) d.push(colOf(r, tu.dst));
      return d;
    }
    var o = diff(r.orig), p = diff(r.reply);
    if (!o.length) return { hit: true, dir: 'orig', miss: [] };
    if (!p.length) return { hit: true, dir: 'reply', miss: [] };
    // the nearer direction; on a tie, the one sent to the same address as the packet (the way it travels)
    var m = p.length < o.length || (p.length === o.length && r.reply.dst.ip === pkt.dst.ip && r.orig.dst.ip !== pkt.dst.ip) ? p : o;
    return { hit: false, dir: null, miss: m.filter(function (k, i) { return m.indexOf(k) === i; }) };
  }

  /** The view of a row as the book draws it (Primjer 4): the inside socket, R's outside socket and the remote end.
      A forward's row: inside is the forward's target, outside the forwarded port, remote the opener. A hairpin row
      with the source rewritten keeps that rewritten source as `as`. */
  function viewOf(r) {
    if (r.by === 'out') return { inside: r.orig.src, outside: r.reply.dst, remote: r.orig.dst, as: null };
    return { inside: r.reply.src, outside: r.orig.dst, remote: r.orig.src, as: same(r.reply.dst, r.orig.src) ? null : r.reply.dst };
  }
  function colOf(r, e) {
    var v = viewOf(r);
    if (same(e, v.inside)) return 'inside';
    if (same(e, v.outside)) return 'outside';
    return 'remote';
  }

  /**
   * R receives pkt on side `from` ('in' or 'out'). net: { outside, inside, first }; hairpin: NAT loopback on.
   * Returns { rule, row, fwd, out, table, compare, fwdCompare, port }:
   *   rule 'row'      a row of a known connection matches (1); out is the packet rewritten back to the other
   *                   direction of that connection;
   *   rule 'forward'  a packet to R's outside address matches a forward (2): the destination becomes the forward's
   *                   target, the source stays (or, with hairpin from inside, becomes R's outside address at the next
   *                   free port); a row is added;
   *   rule 'new'      an outbound packet of a new connection (4): the source becomes R's outside address at the next
   *                   free port; a row is added;
   *   rule 'drop'     neither (3): out is null.
   * compare lists every row's comparison in table order (rows below a hit are not read); fwdCompare the forwards'
   * (null when they were not read). The input table is not changed.
   */
  function classify(net, table, forwards, pkt, from, hairpin) {
    var compare = [], i, c;
    for (i = 0; i < table.length; i++) {
      c = compareRow(table[i], pkt);
      compare.push(c);
      if (c.hit) {
        var r = table[i], back = c.dir === 'orig' ? r.reply : r.orig;
        return { rule: 'row', row: i, fwd: -1, out: pk(pkt.proto, back.dst, back.src), table: table, compare: compare, fwdCompare: null, port: null };
      }
    }
    if (pkt.dst.ip === net.outside) {
      var fwdCompare = [];
      for (i = 0; i < forwards.length; i++) {
        var f = forwards[i], miss = [];
        if (f.proto !== pkt.proto) miss.push('proto');
        if (f.addr && f.addr !== pkt.dst.ip) miss.push('addr');
        if (f.extPort !== pkt.dst.port) miss.push('extPort');
        fwdCompare.push({ hit: !miss.length, miss: miss });
        if (!miss.length) {
          var src = pkt.src, port = null;
          if (from === 'in' && hairpin) { port = nextPort(net, table, forwards); src = ep(net.outside, port); }
          var row = { proto: pkt.proto, by: 'forward', fwd: i, orig: pk(pkt.proto, pkt.src, pkt.dst), reply: pk(pkt.proto, f.to, src) };
          return { rule: 'forward', row: table.length, fwd: i, out: pk(pkt.proto, src, f.to), table: table.concat([row]), compare: compare, fwdCompare: fwdCompare, port: port };
        }
      }
      return { rule: 'drop', row: -1, fwd: -1, out: null, table: table, compare: compare, fwdCompare: fwdCompare, port: null };
    }
    if (from === 'in' && !inside(net, pkt.dst.ip)) {
      var p = nextPort(net, table, forwards), outSrc = ep(net.outside, p);
      var made = { proto: pkt.proto, by: 'out', fwd: -1, orig: pk(pkt.proto, pkt.src, pkt.dst), reply: pk(pkt.proto, pkt.dst, outSrc) };
      return { rule: 'new', row: table.length, fwd: -1, out: pk(pkt.proto, outSrc, pkt.dst), table: table.concat([made]), compare: compare, fwdCompare: null, port: p };
    }
    return { rule: 'drop', row: -1, fwd: -1, out: null, table: table, compare: compare, fwdCompare: null, port: null };
  }

  /** The next node for a packet leaving `at`: on the LAN a host reaches an address of its own network directly and
      everything else through R; R sends to the node that owns the destination; outside hosts reach only R. */
  function nextHop(net, at, pkt) {
    if (at === 'R') return nodeOf(pkt.dst.ip);
    if (NODES[at].side === 'in' && inside(net, pkt.dst.ip)) return nodeOf(pkt.dst.ip);
    return 'R';
  }

  /** The packets each scene sends, in order. reply: the receiver answers and the answer is walked too. */
  function sendsOf(p) {
    var probe = { from: 'K', proto: p.proto, src: ep(NODES.K.ip, CLIENT_PORT), dst: ep(NET.outside, Number(p.extPort)) };
    var out = function (who) { return { from: who, proto: 'tcp', src: ep(NODES[who].ip, SRC_PORT), dst: ep(WEB.ip, WEB.port) }; };
    if (p.scene === 'book') return [out('A'), out('B'), probe];
    if (p.scene === 'mixed') return [{ from: 'W', proto: 'tcp', src: ep(WEB.ip, WEB.port), dst: ep(NET.outside, NET.first), answer: 'A' }, probe];
    if (p.scene === 'inside') return [Object.assign({}, probe, { from: 'A', src: ep(NODES.A.ip, SRC_PORT), reply: true })];
    return [Object.assign({}, probe, { reply: true })];
  }

  /** The table a scene starts with: mixed starts after the book's two outbound packets (rows 61000 and 61001). */
  function startTable(p, forwards) {
    var table = [];
    if (p.scene === 'mixed') {
      ['A', 'B'].forEach(function (who) {
        table = classify(NET, table, forwards, pk('tcp', ep(NODES[who].ip, SRC_PORT), WEB), 'in', false).table;
      });
    }
    return table;
  }

  /**
   * Every hop of the scene, in order: { from, to, came (the node the packet reached R from, on a hop out of R),
   * opener (the node that opened the connection), pkt (as on this wire), was (as it reached R, on a hop out of R),
   * decision (R's, on the hop out of R or on a drop at R), drop ('R', a host, or null), deliver (the packet reached
   * its owner), flow (index of the send), answer (this packet answers flow's request), called (on an answer: the
   * address the opener called), unexpected (an answer that is not from that address) }, and the table and forwards after each hop.
   */
  function walk(p) {
    var forwards = p.forward ? addForward([], FORWARD).forwards : [];
    var start = startTable(p, forwards), table = start, hops = [];
    function hopOf(from, to, pkt, flow, answer, who) {
      return { from: from, to: to, came: from, opener: who, called: null, pkt: pkt, was: null, decision: null, drop: null, deliver: false, flow: flow, answer: answer, unexpected: false, table: table };
    }
    sendsOf(p).forEach(function (s, flow) {
      var pkt = pk(s.proto, s.src, s.dst), at = s.from, answer = !!s.answer, opener = null;
      var who = s.answer || s.from;
      for (;;) {
        var to = nextHop(NET, at, pkt), hop = hopOf(at, to, pkt, flow, answer, who);
        if (to === 'R') {
          var d = classify(NET, table, forwards, pkt, NODES[at].side, !!p.hairpin);
          if (d.rule === 'drop') { hop.decision = d; hop.drop = 'R'; hops.push(hop); return; }
          hops.push(hop);
          table = d.table;
          to = nodeOf(d.out.dst.ip);
          hop = hopOf('R', to, d.out, flow, answer, who);
          hop.came = at;
          hop.was = pkt;
          hop.decision = d;
          pkt = d.out;
        }
        hops.push(hop);
        // the packet reached host `to`; an answer must come from the address the opener called
        if (opener) {
          hop.called = opener.dst;
          hop.unexpected = !(same(pkt.src, opener.dst) && same(pkt.dst, opener.src));
          if (hop.unexpected) { hop.drop = to; return; }
        }
        hop.deliver = true;
        if (!s.reply || answer) return;
        opener = { src: s.src, dst: s.dst };
        answer = true;
        pkt = pk(pkt.proto, pkt.dst, pkt.src);
        at = to;
      }
    });
    return { start: start, forwards: forwards, hops: hops };
  }

  function stepsFor(p) { return walk(p).hops.length; }

  /** Everything the page shows after step n: the hop of step n (null at 0), the tables after it, the next port R
      would hand out, and the next hop (what step n + 1 will move). */
  function analyze(p, n) {
    var w = walk(p), hop = n > 0 ? w.hops[n - 1] : null;
    var table = hop ? hop.table : w.start;
    return {
      scene: p.scene,
      hop: hop,
      table: table,
      forwards: w.forwards,
      nextPort: nextPort(NET, table, w.forwards),
      next: w.hops[n] ? { from: w.hops[n].from, to: w.hops[n].to } : null,
      total: w.hops.length
    };
  }

  // ── Container host (preset task lnx-container-ports, SPEC.md "Container host") ──
  // The same rules with R as a container host: its outside address 192.0.2.10 (eth0), the container bridge
  // 10.88.0.0/16 (host side 10.88.0.1) as the inside network, containers web 10.88.0.5 and web2 10.88.0.6 listening
  // on tcp/80, and an outside client C. Publishing a port (`run -p 8080:80`) writes one forward (a DNAT rule) by a
  // step. Two differences from a router: a forward may be bound to one host address, and a packet to the host's own
  // address that matches nothing reaches the host's own stack, where nothing listens on that port, so the host
  // answers with a reset ("connection refused") instead of dropping it. The host's own connections (C3) go straight
  // onto the bridge and their answers come back to it, untranslated.

  var CNODES = {
    C: { ip: '203.0.113.7', side: 'out' },
    H: { ip: '10.88.0.1', side: 'router' },
    web: { ip: '10.88.0.5', side: 'in' },
    web2: { ip: '10.88.0.6', side: 'in' }
  };
  var CNET = { outside: '192.0.2.10', inside: '10.88.', first: 61000 };
  var C_PORT = 51000;            // the client's source port (task file)
  var H_PORT = 52000;            // the host's own source port for its request to web (C3)
  var CPORT = 80;                // both containers listen on tcp/80

  function cnodeOf(ip) {
    if (ip === CNET.outside) return 'H';
    for (var k in CNODES) if (CNODES[k].ip === ip) return k;
    return null;
  }
  /** A publish command: `run -d [-p [addr:]extPort:80] name`. */
  function run(name, extPort, addr) {
    return { run: name, publish: extPort ? { addr: addr || null, extPort: extPort } : null };
  }
  function probe(extPort, reply) {
    return { from: 'C', src: ep(CNODES.C.ip, C_PORT), dst: ep(CNET.outside, extPort), reply: !!reply };
  }

  /** The four scenes: the commands and packets each runs, in order; `start` runs before step 1. */
  var CSCENES = {
    publish: { start: [], events: [run('web', 8080), probe(8080, true)] },
    unpublished: { start: [], events: [run('web', null), probe(80, false),
      { from: 'H', src: ep(CNODES.H.ip, H_PORT), dst: ep(CNODES.web.ip, CPORT), reply: true }] },
    loopback: { start: [], events: [run('web', 8080, '127.0.0.1'), probe(8080, false)] },
    taken: { start: [run('web', 8080)], events: [run('web2', 8080), run('web2', 8081), probe(8081, false)] }
  };

  /** Run one publish command on the forwards: { forwards, refused, clash, fwd (index of the new forward, or -1) }. */
  function publish(forwards, cmd) {
    if (!cmd.publish) return { forwards: forwards, refused: false, clash: -1, fwd: -1 };
    var f = { proto: 'tcp', extPort: cmd.publish.extPort, to: ep(CNODES[cmd.run].ip, CPORT) };
    if (cmd.publish.addr) f.addr = cmd.publish.addr;
    var r = addForward(forwards, f);
    return { forwards: r.forwards, refused: r.refused, clash: r.clash, fwd: r.refused ? -1 : r.forwards.length - 1 };
  }

  /** Every step of a container scene, in the hop shape of walk(), plus `cmd` hops ({ cmd, refused, clash, fwd }) and
      `forwards` after each step. A packet that reaches H and matches nothing: H answers with a reset (hop H → sender,
      `pkt.flag` 'rst', decision rule 'refused'). */
  function walkContainer(p) {
    var sc = CSCENES[p.cscene] || CSCENES.publish;
    var forwards = [], table = [], hops = [];
    sc.start.forEach(function (cmd) { forwards = publish(forwards, cmd).forwards; });
    var start = { table: table, forwards: forwards };
    function hopOf(from, to, pkt, flow, answer, who) {
      return { from: from, to: to, came: from, opener: who, called: null, pkt: pkt, was: null, decision: null, drop: null,
        deliver: false, flow: flow, answer: answer, unexpected: false, cmd: null, local: false, table: table, forwards: forwards };
    }
    sc.events.forEach(function (e, flow) {
      if (e.run) {
        var r = publish(forwards, e);
        forwards = r.forwards;
        var hop = hopOf('H', 'H', null, flow, false, 'H');
        hop.cmd = { run: e.run, publish: e.publish, refused: r.refused, clash: r.clash, fwd: r.fwd };
        hops.push(hop);
        return;
      }
      var pkt = pk('tcp', e.src, e.dst), at = e.from, answer = false, opener = null;
      for (;;) {
        var to = at === 'H' ? cnodeOf(pkt.dst.ip) : 'H', h = hopOf(at, to, pkt, flow, answer, e.from);
        if (at === 'H' && e.from === 'H' && !answer) h.local = true;
        if (to === 'H' && !(answer && e.from === 'H')) {
          var d = classify(CNET, table, forwards, pkt, CNODES[at].side, false);
          hops.push(h);
          if (d.rule === 'drop') {
            // nothing matched and the packet is for the host itself: no socket listens there, the host resets it
            var rst = { proto: pkt.proto, src: ep(pkt.dst.ip, pkt.dst.port), dst: ep(pkt.src.ip, pkt.src.port), flag: 'rst' };
            var back = hopOf('H', at, rst, flow, true, e.from);
            back.came = at;
            back.was = pkt;
            back.decision = Object.assign({}, d, { rule: 'refused' });
            back.refused = true;
            hops.push(back);
            return;
          }
          table = d.table;
          to = cnodeOf(d.out.dst.ip);
          h = hopOf('H', to, d.out, flow, answer, e.from);
          h.came = at;
          h.was = pkt;
          h.decision = d;
          pkt = d.out;
        }
        hops.push(h);
        if (opener) {
          h.called = opener.dst;
          h.unexpected = !(same(pkt.src, opener.dst) && same(pkt.dst, opener.src));
          if (h.unexpected) { h.drop = to; return; }
        }
        h.deliver = true;
        if (!e.reply || answer) return;
        opener = { src: e.src, dst: e.dst };
        answer = true;
        pkt = pk(pkt.proto, pkt.dst, pkt.src);
        at = to;
      }
    });
    return { start: start, hops: hops };
  }

  function analyzeContainer(p, n) {
    var w = walkContainer(p), hop = n > 0 ? w.hops[n - 1] : null;
    return {
      host: 'container',
      scene: p.cscene,
      hop: hop,
      table: hop ? hop.table : w.start.table,
      forwards: hop ? hop.forwards : w.start.forwards,
      nextPort: null,
      next: w.hops[n] ? { from: w.hops[n].from, to: w.hops[n].to } : null,
      total: w.hops.length
    };
  }

  var logic = {
    /** The book's worked example (URM ch. 11, Primjer 4): A and B go out, a packet from outside reaches 61050. */
    defaults: { container: false, scene: 'book', forward: false, proto: 'tcp', extPort: '61050', hairpin: false, cscene: 'publish' },

    scenes: ['book', 'mixed', 'outside', 'inside'],
    protos: ['tcp', 'udp'],
    /** Outside ports K calls: the forward's 8080, the book's 61050, and 61000, a port the table holds for A. */
    extPorts: ['8080', '61050', '61000'],
    /** container: R is a container host (preset task lnx-container-ports) instead of the book's home router. */
    cscenes: ['publish', 'unpublished', 'loopback', 'taken'],

    /** Steps depend on the scene and on what R decides; sim.json's 5 is the default's (the book's). */
    steps: function (p) {
      var q = Object.assign({}, logic.defaults, p);
      return q.container ? walkContainer(q).hops.length : stepsFor(q);
    },

    initial: function (p) { return Object.assign({ phase: 'start' }, analyzeAny(p, 0)); },

    /** Step n replays the scene from its start, so a param change recomputes at the same step. */
    step: function (s, n, p) { return Object.assign({ phase: 'hop' }, analyzeAny(p, n)); },

    nodes: NODES,
    net: NET,
    srcPort: SRC_PORT,
    clientPort: CLIENT_PORT,
    web: WEB,
    forward: FORWARD,
    viewOf: viewOf,
    compareRow: compareRow,
    classify: classify,
    addForward: addForward,
    freePort: freePort,
    nextPort: nextPort,
    nextHop: nextHop,
    walk: walk,
    stepsFor: stepsFor,
    analyze: analyze,
    cnodes: CNODES,
    cnet: CNET,
    cport: CPORT,
    walkContainer: walkContainer,
    analyzeContainer: analyzeContainer
  };

  function analyzeAny(p, n) {
    return p.container ? analyzeContainer(p, n) : Object.assign({ host: 'router' }, analyze(p, n));
  }

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
