/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for arp-local-remote: host A sends a ping. It ANDs its own address and the destination with its mask,
   picks the destination (local) or the default gateway (remote) as the next hop, looks the next hop up in its ARP
   table and, on a miss, resolves it with an ARP request (broadcast) and reply (unicast). Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The scene and the
   functions over it (ip/and/decide/hear/reply) take plain data and hold no strings, so they can move to models/
   unchanged when net-hop-rewrite and the other path pages reuse the K2 topology. */
(function (root) {
  'use strict';

  var BROADCAST = 'ff:ff:ff:ff:ff:ff';

  /** The two segments. Stations in wire order, left to right; R is the default gateway, its other side the cloud. */
  var NETS = {
    lan: {
      stations: [
        { id: 'A', ip: '192.168.1.10', mac: '02:00:00:aa:aa:aa' },
        { id: 'B', ip: '192.168.1.20', mac: '02:00:00:bb:bb:bb' },
        { id: 'C', ip: '192.168.1.30', mac: '02:00:00:cc:cc:cc' },
        { id: 'R', ip: '192.168.1.1', mac: '02:00:00:00:00:01' }
      ],
      gateway: '192.168.1.1',
      fixedMask: null,      // A's mask is the param
      packets: null         // one packet, to the dst param
    },
    lan28: {
      stations: [
        { id: 'A', ip: '192.168.5.77', mac: '02:00:00:aa:aa:aa' },
        { id: 'B', ip: '192.168.5.70', mac: '02:00:00:bb:bb:bb' },
        { id: 'C', ip: '192.168.5.74', mac: '02:00:00:cc:cc:cc' },
        { id: 'R', ip: '192.168.5.65', mac: '02:00:00:00:00:01' }
      ],
      gateway: '192.168.5.65',
      fixedMask: 28,
      packets: ['192.168.5.70', '192.168.5.90'] // URM ch08 Primjer 6: 192.168.5.64/28; destinations derived
    }
  };

  /** The order of the phases of one packet (SPEC.md "One step"). A cache hit goes from lookup straight to send. */
  var PHASES = ['andSrc', 'andDst', 'decide', 'lookup', 'arpReq', 'arpHear', 'arpRep', 'send'];

  function ipToInt(ip) {
    return ip.split('.').reduce(function (acc, o) { return acc * 256 + Number(o); }, 0);
  }
  function intToIp(n) {
    return [24, 16, 8, 0].map(function (s) { return Math.floor(n / Math.pow(2, s)) % 256; }).join('.');
  }
  /** Mask of a prefix length as a 32-bit unsigned number. */
  function maskInt(prefix) { return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0; }
  function maskIp(prefix) { return intToIp(maskInt(prefix)); }
  /** ip AND mask, dotted decimal. */
  function and(ip, prefix) { return intToIp((ipToInt(ip) & maskInt(prefix)) >>> 0); }
  /** 32 bits, most significant first. */
  function bits(ip) {
    var n = ipToInt(ip), out = [];
    for (var i = 31; i >= 0; i--) out.push(Math.floor(n / Math.pow(2, i)) % 2);
    return out;
  }

  /** Rule 1 and 2: equal AND results → local, the next hop is the destination; else remote, via the gateway. */
  function decide(srcIp, dstIp, prefix, gateway) {
    var netSrc = and(srcIp, prefix), netDst = and(dstIp, prefix);
    var local = netSrc === netDst;
    return { netSrc: netSrc, netDst: netDst, decision: local ? 'local' : 'remote', nextHop: local ? dstIp : gateway };
  }

  function netOf(p) { return NETS[p.net] || NETS.lan; }
  function maskOf(p) { var net = netOf(p); return net.fixedMask || p.mask; }
  function packetsOf(p) { var net = netOf(p); return net.packets || [p.dst]; }
  function station(net, id) { return net.stations.filter(function (s) { return s.id === id; })[0]; }
  function stationByIp(net, ip) { return net.stations.filter(function (s) { return s.ip === ip; })[0] || null; }

  function copyArp(arp) {
    var out = {};
    Object.keys(arp).forEach(function (k) {
      out[k] = arp[k].map(function (e) { return { ip: e.ip, mac: e.mac, state: 'old' }; });
    });
    return out;
  }
  function findEntry(table, ip) {
    for (var i = 0; i < table.length; i++) if (table[i].ip === ip) return table[i];
    return null;
  }

  /** Rule 5 and 6: every station but the sender hears a broadcast request. A station that already has the sender
      updates (refreshes) that entry; only the owner of the target IP adds the sender if it had none, and answers.
      Returns { arp, heardBy, answeredBy }; arp is a fresh copy. */
  function hear(arp, stations, frame) {
    var out = copyArp(arp);
    var heardBy = [], answeredBy = null;
    stations.forEach(function (s) {
      if (s.mac === frame.srcMac) return;
      heardBy.push(s.id);
      var table = out[s.id];
      var e = findEntry(table, frame.srcIp);
      if (e) { e.mac = frame.srcMac; e.state = 'refreshed'; }         // RFC 826: merge, whoever hears it
      if (s.ip === frame.targetIp) {
        answeredBy = s.id;
        if (!e) table.push({ ip: frame.srcIp, mac: frame.srcMac, state: 'new' }); // only the target adds
      }
    });
    return { arp: out, heardBy: heardBy, answeredBy: answeredBy };
  }

  /** The asker learns the target's address from the unicast reply (add, or update if present). */
  function learn(arp, id, ip, mac) {
    var out = copyArp(arp);
    var e = findEntry(out[id], ip);
    if (e) { e.mac = mac; e.state = 'refreshed'; } else out[id].push({ ip: ip, mac: mac, state: 'new' });
    return out;
  }

  /** A's table at step 0: empty, or (cache on) every next hop this run will need, in the order they are needed. */
  function initialArp(p) {
    var net = netOf(p), arp = {};
    net.stations.forEach(function (s) { arp[s.id] = []; });
    if (p.cache) {
      var a = station(net, 'A');
      packetsOf(p).forEach(function (dst) {
        var hop = decide(a.ip, dst, maskOf(p), net.gateway).nextHop;
        var owner = stationByIp(net, hop);
        if (owner && !findEntry(arp.A, hop)) arp.A.push({ ip: hop, mac: owner.mac, state: 'old' });
      });
    }
    return arp;
  }

  function packetState(s, pkt, p) {
    var dst = packetsOf(p)[pkt];
    return {
      pkt: pkt, packets: packetsOf(p).length, phase: 'start', src: 'A', dstIp: dst, mask: maskOf(p),
      netSrc: null, netDst: null, decision: null, nextHop: null, hit: null,
      arp: s ? copyArp(s.arp) : initialArp(p), frame: null, heardBy: [], answeredBy: null, deliveredTo: null, done: false
    };
  }

  var logic = {
    BROADCAST: BROADCAST,
    NETS: NETS,
    PHASES: PHASES,

    /** Parameter defaults. The page's controls describe how each one is shown. */
    defaults: { net: 'lan', dst: '192.168.1.20', mask: 24, cache: false },

    /** Steps for these params: 8 per packet, 5 on a cache hit (steps 5–7 skipped). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (!s.done && n < 100) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** State at step 0: nothing computed yet for the first packet. */
    initial: function (p) { return packetState(null, 0, p); },

    /** State after step n, from the state after step n - 1. */
    step: function (s, n, p) {
      var net = netOf(p);
      var a = station(net, 'A');
      if (s.phase === 'send') {                           // next packet, its first phase
        var next = packetState(s, s.pkt + 1, p);
        s = next;
      }
      var out = JSON.parse(JSON.stringify(s));
      out.arp = copyArp(s.arp);
      out.heardBy = [];
      out.answeredBy = null;
      out.frame = null;
      out.deliveredTo = null;
      var d = decide(a.ip, s.dstIp, s.mask, net.gateway);
      var hopOwner = stationByIp(net, d.nextHop);

      switch (s.phase) {
        case 'start':
          out.phase = 'andSrc'; out.netSrc = d.netSrc;
          break;
        case 'andSrc':
          out.phase = 'andDst'; out.netDst = d.netDst;
          break;
        case 'andDst':
          out.phase = 'decide'; out.decision = d.decision; out.nextHop = d.nextHop;
          break;
        case 'decide':
          out.phase = 'lookup'; out.hit = !!findEntry(s.arp.A, d.nextHop);
          break;
        case 'lookup':
          if (s.hit) {
            out.phase = 'send';
          } else {
            out.phase = 'arpReq';
            out.frame = { kind: 'arp-req', dstMac: BROADCAST, srcMac: a.mac, srcIp: a.ip, targetIp: d.nextHop, from: 'A', to: null };
          }
          break;
        case 'arpReq':
          out.phase = 'arpHear';
          var heard = hear(s.arp, net.stations, s.frame);
          out.arp = heard.arp; out.heardBy = heard.heardBy; out.answeredBy = heard.answeredBy;
          out.frame = s.frame;
          break;
        case 'arpHear':
          out.phase = 'arpRep';
          out.frame = { kind: 'arp-rep', dstMac: a.mac, srcMac: hopOwner.mac, srcIp: hopOwner.ip, targetIp: a.ip, from: hopOwner.id, to: 'A' };
          out.arp = learn(s.arp, 'A', hopOwner.ip, hopOwner.mac);
          break;
        case 'arpRep':
          out.phase = 'send';
          break;
        default:
          throw new Error('no step after ' + s.phase);
      }
      if (out.phase === 'send') {
        var entry = findEntry(out.arp.A, d.nextHop);
        out.frame = { kind: 'ip', dstMac: entry.mac, srcMac: a.mac, srcIp: a.ip, dstIp: s.dstIp, from: 'A', to: hopOwner.id };
        out.deliveredTo = hopOwner.id;
        out.done = s.pkt + 1 >= s.packets;
      }
      return out;
    },

    ipToInt: ipToInt,
    intToIp: intToIp,
    maskIp: maskIp,
    and: and,
    bits: bits,
    decide: decide,
    hear: hear,
    learn: learn,
    netOf: netOf,
    maskOf: maskOf,
    packetsOf: packetsOf,
    stationByIp: stationByIp
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
