/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for hop-rewrite: one ping from A to B across one or two routers. Each router strips the frame, looks up
   the destination, decrements TTL (drops at 0 and sends ICMP Time Exceeded), recomputes the header checksum,
   finds the next-hop MAC and builds a new frame. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The byte helpers (checksum,
   incremental update, CRC-32) and the scene take plain data and hold no strings, so they can move to models/
   unchanged for the other path pages (traceroute, packet-journey). */
(function (root) {
  'use strict';

  var mac = function (x) { return '02:00:00:00:00:' + x; };

  /** The scene for 1 or 2 routers (SPEC.md "Scene"). Nodes in wire order; segment k joins nodes k-1 and k. */
  function sceneOf(p) {
    var two = Number(p.routers) === 2;
    var A = { id: 'A', kind: 'host', ip: '192.168.1.10', mac: mac('0a') };
    var R1 = { id: 'R1', kind: 'router', ifs: [
      { name: 'Gi0/0', ip: '192.168.1.1', mac: mac('11') },
      { name: 'Gi0/1', ip: two ? '10.0.0.1' : '192.168.2.1', mac: mac('12') }] };
    var R2 = { id: 'R2', kind: 'router', ifs: [
      { name: 'Gi0/0', ip: '10.0.0.2', mac: mac('21') },
      { name: 'Gi0/1', ip: '192.168.3.1', mac: mac('22') }] };
    var B = { id: 'B', kind: 'host', ip: two ? '192.168.3.20' : '192.168.2.20', mac: mac('14') };
    var nodes = two ? [A, R1, R2, B] : [A, R1, B];
    var nets = two ? ['192.168.1.0/24', '10.0.0.0/30', '192.168.3.0/24'] : ['192.168.1.0/24', '192.168.2.0/24'];
    // forward routes to B's network: connected (via null) or via the next router's address
    var routes = two
      ? { R1: { net: '192.168.3.0/24', iface: 'Gi0/1', via: '10.0.0.2' }, R2: { net: '192.168.3.0/24', iface: 'Gi0/1', via: null } }
      : { R1: { net: '192.168.2.0/24', iface: 'Gi0/1', via: null } };
    return { nodes: nodes, nets: nets, routes: routes, src: A.ip, dst: B.ip };
  }

  function node(scene, id) { return scene.nodes.filter(function (n) { return n.id === id; })[0]; }
  function indexOf(scene, id) { for (var i = 0; i < scene.nodes.length; i++) if (scene.nodes[i].id === id) return i; return -1; }
  /** The address a node has on segment k (1-based): a host its own, a router the interface facing that segment. */
  function onSegment(n, side) { return n.kind === 'host' ? { ip: n.ip, mac: n.mac, name: null } : n.ifs[side]; }
  /** Left end (sender side) and right end of segment k. */
  function ends(scene, k) {
    return { left: onSegment(scene.nodes[k - 1], 1), right: onSegment(scene.nodes[k], 0),
      leftId: scene.nodes[k - 1].id, rightId: scene.nodes[k].id };
  }

  // ── bytes ──

  function ipBytes(ip) { return ip.split('.').map(Number); }
  function macBytes(m) { return m.split(':').map(function (x) { return parseInt(x, 16); }); }
  function hex4(n) { return '0x' + ('0000' + n.toString(16)).slice(-4); }
  function hex8(n) { return '0x' + ('00000000' + (n >>> 0).toString(16)).slice(-8); }

  /** One's complement sum of 16-bit words, folded (RFC 1071). */
  function sum16(bytes) {
    var s = 0;
    for (var i = 0; i < bytes.length; i += 2) s += (bytes[i] << 8) + (bytes[i + 1] || 0);
    while (s > 0xffff) s = (s & 0xffff) + Math.floor(s / 0x10000);
    return s;
  }
  function checksumOf(bytes) { return (~sum16(bytes)) & 0xffff; }

  /** The 20 B IPv4 header (SPEC.md "The packet"), with the checksum field filled in when csum is given. */
  function headerBytes(ip, csum) {
    var c = csum == null ? 0 : csum;
    return [0x45, 0x00, 0x00, ip.len, ip.id >> 8, ip.id & 0xff, 0x40, 0x00, ip.ttl, ip.proto, c >> 8, c & 0xff]
      .concat(ipBytes(ip.src), ipBytes(ip.dst));
  }
  /** Rule 5: the header checksum over the header with the field zeroed (RFC 791). */
  function headerChecksum(ip) { return checksumOf(headerBytes(ip, null)); }
  /** RFC 1624 eq. 3: HC' = ~(~HC + ~m + m'), m and m' the old and new 16-bit word. */
  function incrementalChecksum(hc, m, m2) {
    return (~sum16([(~hc >> 8) & 0xff, ~hc & 0xff, (~m >> 8) & 0xff, ~m & 0xff, m2 >> 8, m2 & 0xff])) & 0xffff;
  }

  /** The ICMP echo request (64 B) the packet carries; it only feeds the FCS. */
  var ECHO = (function () {
    var b = [8, 0, 0, 0, 0, 1, 0, 1];
    for (var i = 0; i < 56; i++) b.push(0);
    var c = checksumOf(b);
    b[2] = c >> 8; b[3] = c & 0xff;
    return b;
  })();

  var CRC_TABLE = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t.push(c >>> 0);
    }
    return t;
  })();
  /** CRC-32 (IEEE 802.3, reflected, as zlib.crc32). */
  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  /** Rule 6: the FCS of the frame dst | src | 0x0800 | header | echo. */
  function fcsOf(dstMac, srcMac, ip) {
    return crc32(macBytes(dstMac).concat(macBytes(srcMac), [0x08, 0x00], headerBytes(ip, ip.csum), ECHO));
  }

  function makeFrame(dstMac, srcMac, ip) {
    return { dstMac: dstMac, srcMac: srcMac, type: '0x0800', fcs: hex8(fcsOf(dstMac, srcMac, ip)) };
  }
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  /** What the history and the marks compare: one flat row. */
  function rowOf(segment, net, frame, ip) {
    return { segment: segment, net: net, dstMac: frame.dstMac, srcMac: frame.srcMac, fcs: frame.fcs,
      src: ip.src, dst: ip.dst, ttl: ip.ttl, csum: hex4(ip.csum) };
  }

  var FIELDS = ['dstMac', 'srcMac', 'fcs', 'ttl', 'csum', 'src', 'dst'];

  /** The fields of state s whose values differ from s.ref (the packet on the previous segment). */
  function changed(s) {
    if (!s.ref) return [];
    var cur = { ttl: s.ip.ttl, csum: hex4(s.ip.csum), src: s.ip.src, dst: s.ip.dst };
    if (s.frame) { cur.dstMac = s.frame.dstMac; cur.srcMac = s.frame.srcMac; cur.fcs = s.frame.fcs; }
    return FIELDS.filter(function (f) { return f in cur && cur[f] !== s.ref[f]; });
  }

  function base(s) {
    var out = copy(s);
    out.ref = null;
    out.arpMsg = null;
    out.icmp = null;
    out.actor = null;
    return out;
  }

  /** The router's work at node index i (rule 2–5, 8): fills out.work, out.frame or out.dropped / out.held. */
  function process(out, s, scene, i, p) {
    var r = scene.nodes[i], route = scene.routes[r.id];
    var nextNode = scene.nodes[i + 1];
    var egress = r.ifs[1];
    var nextHop = route.via || scene.dst;
    var nextMac = onSegment(nextNode, 0).mac;
    var ttlIn = s.ip.ttl, csumIn = s.ip.csum;
    out.at = r.id; out.actor = r.id; out.phase = 'process';
    out.ref = s.history[s.history.length - 1];
    out.frame = null;
    out.ip.ttl = ttlIn - 1;                                 // rule 3: every router, at least one
    var work = { node: r.id, kind: 'router', inIface: r.ifs[0].name, inMac: r.ifs[0].mac,
      lookup: { dst: scene.dst, net: route.net, iface: route.iface, via: route.via },
      ttlIn: ttlIn, ttlOut: ttlIn - 1, expired: ttlIn - 1 <= 0, csumIn: hex4(csumIn), csumOut: null,
      nextHop: null, arp: null, nextMac: null, egress: null };
    out.work = work;
    if (work.expired) {                                     // rule 4: checked after the decrement
      out.ip.ttl = 0;
      out.dropped = { at: r.id, reason: 'ttl' };
      return;
    }
    out.ip.csum = headerChecksum(out.ip);                   // rule 5
    work.csumOut = hex4(out.ip.csum);
    work.nextHop = nextHop;
    work.egress = { name: egress.name, ip: egress.ip, mac: egress.mac };
    var cold = p.coldArp && r.id === 'R1';
    if (cold && !s.learned) {                               // rule 8: the packet waits for ARP
      work.arp = 'miss';
      out.held = true;
      return;
    }
    work.arp = 'hit';
    work.nextMac = nextMac;
    out.frame = makeFrame(nextMac, egress.mac, out.ip);     // rule 2, rule 6
  }

  var logic = {
    defaults: { ttl0: 64, routers: 1, showChecksum: true, coldArp: false },

    /** Steps for these params: replayed to the end (5 for the defaults, at most 9). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (!s.done && n < 50) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** Step 0: A holds the packet; no frame yet. */
    initial: function (p) {
      var scene = sceneOf(p);
      var ip = { ttl: Math.max(1, Math.min(64, Number(p.ttl0) || 1)), proto: 1, csum: 0, src: scene.src, dst: scene.dst,
        len: 84, id: 0x1c46 };
      ip.csum = headerChecksum(ip);
      return { phase: 'start', at: 'A', actor: null, segment: 0, frame: null, ip: ip, ref: null, work: null,
        history: [], dropped: null, held: false, learned: false, arpMsg: null, icmp: null, delivered: false, done: false };
    },

    /** State after step n, from the state after step n - 1. */
    step: function (s, n, p) {
      var scene = sceneOf(p);
      var out = base(s);
      var i = indexOf(scene, s.at);
      var k, e;

      if (s.phase === 'start' || (s.phase === 'process' && !s.dropped && !s.held) || s.phase === 'arpRep') {
        // cross the next segment, in the frame as built (A builds its own at the start)
        k = s.segment + 1;
        e = ends(scene, k);
        if (s.phase === 'start') out.frame = makeFrame(e.right.mac, e.left.mac, out.ip);
        if (s.phase === 'arpRep') {
          out.frame = makeFrame(e.right.mac, e.left.mac, out.ip);
          out.work.arp = 'learned';
          out.work.nextMac = e.right.mac;
          out.held = false;
        }
        out.phase = 'cross';
        out.segment = k;
        out.at = e.rightId;
        out.actor = e.leftId;
        out.ref = s.history.length ? s.history[s.history.length - 1] : null;
        out.history.push(rowOf(k, scene.nets[k - 1], out.frame, out.ip));
      } else if (s.phase === 'cross' && node(scene, s.at).kind === 'router') {
        process(out, s, scene, i, p);
      } else if (s.phase === 'process' && s.held) {
        e = ends(scene, s.segment + 1);
        out.phase = 'arpReq';
        out.actor = s.at;
        out.ref = s.ref;
        out.arpMsg = { kind: 'req', from: e.leftId, to: e.rightId, targetIp: e.right.ip, senderIp: e.left.ip, senderMac: e.left.mac,
          dstMac: 'ff:ff:ff:ff:ff:ff' };
      } else if (s.phase === 'arpReq') {
        e = ends(scene, s.segment + 1);
        out.phase = 'arpRep';
        out.actor = e.rightId;
        out.ref = s.ref;
        out.learned = true;
        out.arpMsg = { kind: 'rep', from: e.rightId, to: e.leftId, targetIp: e.left.ip, senderIp: e.right.ip, senderMac: e.right.mac,
          dstMac: e.left.mac };
      } else if (s.phase === 'cross') {                       // at B: a host accepts, rule 3 (no decrement)
        var b = node(scene, s.at);
        out.phase = 'arrive';
        out.actor = b.id;
        out.ref = s.history[s.history.length - 1];
        out.work = { node: b.id, kind: 'host', macOk: s.frame.dstMac === b.mac, ipOk: s.ip.dst === b.ip,
          csumOk: headerChecksum(s.ip) === s.ip.csum, ttl: s.ip.ttl };
        out.delivered = out.work.macOk && out.work.ipOk && out.work.csumOk && s.ip.ttl >= 1;
      } else if (s.phase === 'process' && s.dropped) {        // rule 4: ICMP Time Exceeded back to the source
        var r = node(scene, s.at);
        var back = r.ifs[0];
        var prev = scene.nodes[i - 1];
        out.phase = 'icmp';
        out.actor = r.id;
        out.icmp = { from: r.id, type: 11, code: 0, src: back.ip, dst: scene.src, ttl: 64,
          path: scene.nodes.slice(0, i + 1).map(function (x) { return x.id; }).reverse(),
          dstMac: onSegment(prev, 1).mac, srcMac: back.mac };
      } else if (s.phase === 'arrive' || s.phase === 'icmp') {
        out.phase = 'summary';
        out.actor = null;
        out.ref = s.history[0];
        if (s.dropped) out.ref = null;
        out.done = true;
      } else {
        throw new Error('no step after ' + s.phase);
      }
      return out;
    },

    sceneOf: sceneOf,
    changed: changed,
    headerChecksum: headerChecksum,
    incrementalChecksum: incrementalChecksum,
    checksumOf: checksumOf,
    crc32: crc32,
    fcsOf: fcsOf,
    hex4: hex4,
    ECHO: ECHO
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
