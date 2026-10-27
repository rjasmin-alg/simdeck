/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ipv6-ndp: host A looks up a neighbour's MAC twice on the same three hosts, with ARP (IPv4 lane) and
   with NDP (IPv6 lane). One event per step, the two lanes alternating: lookup miss, request sent, which NICs take
   it, who answers, the reply, the cache entry. The ARP request is a broadcast every CPU looks at; the neighbour
   solicitation goes to the target's solicited-node group, and NICs not in it drop it in hardware.
   Rules and numbers: SPEC.md (RFC 826, RFC 4861, RFC 4291 §2.7.1, RFC 2464 §7).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. The address helpers and the scene take plain data and hold no strings,
   so they can move to models/ unchanged. */
(function (root) {
  'use strict';

  var BROADCAST = 'ff:ff:ff:ff:ff:ff';
  var ALL_NODES = 'ff02::1';

  /** RFC 4861 §10: RETRANS_TIMER 1 000 ms, MAX_MULTICAST_SOLICIT 3. The ARP lane copies both (SPEC.md). */
  var C = { retransTimer: 1, maxMulticastSolicit: 3, ndpHopLimit: 255 };

  // ── addresses: 8 groups of 16 bits ──
  // parse, compress, groupsOfOctets, eui64 (trimmed) and solicitedNode: from sims/ipv6-slaac/sim.js @ 06c1f7e

  /** '2001:db8::1' → [0x2001, 0xdb8, 0, 0, 0, 0, 0, 1]. */
  function parse(str) {
    var halves = str.split('::');
    var head = halves[0] ? halves[0].split(':') : [];
    var tail = halves.length > 1 && halves[1] ? halves[1].split(':') : [];
    var fill = halves.length > 1 ? 8 - head.length - tail.length : 0;
    var out = head.map(function (g) { return parseInt(g, 16); });
    for (var i = 0; i < fill; i++) out.push(0);
    return out.concat(tail.map(function (g) { return parseInt(g, 16); }));
  }

  /** RFC 5952 §4: lower case, no leading zeros, the longest run of two or more zero groups as :: (the first on a tie). */
  function compress(groups) {
    var best = -1, bestLen = 1, i = 0;
    while (i < 8) {
      if (groups[i] !== 0) { i++; continue; }
      var j = i;
      while (j < 8 && groups[j] === 0) j++;
      if (j - i > bestLen) { best = i; bestLen = j - i; }
      i = j;
    }
    var hex = groups.map(function (g) { return g.toString(16); });
    if (best < 0) return hex.join(':');
    return hex.slice(0, best).join(':') + '::' + hex.slice(best + bestLen).join(':');
  }

  function same(a, b) { return compress(parse(a)) === compress(parse(b)); }
  function hex2(b) { return ('0' + b.toString(16)).slice(-2); }

  function groupsOfOctets(oct) {
    var out = [];
    for (var i = 0; i < oct.length; i += 2) out.push(oct[i] * 256 + oct[i + 1]);
    return out;
  }

  /** RFC 4291 §2.5.1, RFC 2464 §4: modified EUI-64 interface ID of a MAC, as 4 groups. */
  function eui64(mac) {
    var m = mac.split(':').map(function (x) { return parseInt(x, 16); });
    var iid = m.slice(0, 3).concat([0xff, 0xfe], m.slice(3));
    iid[0] = iid[0] ^ 0x02;
    return groupsOfOctets(iid);
  }

  /** prefix (its first 64 bits) + the interface ID of mac. */
  function withIid(prefix, mac) { return compress(parse(prefix).slice(0, 4).concat(eui64(mac))); }

  /** RFC 4291 §2.7.1: ff02::1:ff00:0/104 + the low 24 bits of the address. */
  function solicitedNode(addr) {
    var g = parse(addr);
    return compress([0xff02, 0, 0, 0, 0, 1, 0xff00 | (g[6] & 0xff), g[7]]);
  }

  /** RFC 2464 §7: 33:33 + the low 32 bits of an IPv6 multicast address. */
  function multicastMac(addr) {
    var g = parse(addr);
    return ['33', '33', hex2(g[6] >> 8), hex2(g[6] & 0xff), hex2(g[7] >> 8), hex2(g[7] & 0xff)].join(':');
  }

  // ── the scene (SPEC.md "Scene") ──

  var MAC = {
    A: '00:00:5e:00:53:0a', B: '00:04:61:9d:f1:56', C: '00:00:5e:00:53:0c', Ccollide: '10:34:56:9d:f1:56',
    R: '00:00:5e:00:53:01', fake: '00:00:5e:00:53:66'
  };
  var V4 = { A: '192.168.1.10', B: '192.168.1.20', C: '192.168.1.30', absent: '192.168.1.99' };
  var ABSENT_V6 = 'fe80::99';
  var GLOBAL_PREFIX = '2001:db8:1::';
  var X_ADDR = '2001:db8:ff::66';
  var HOSTS = ['A', 'B', 'C'];

  /** The hosts of a run: id, MAC, IPv4, IPv6 addresses (link-local first), groups and NIC filters. */
  function hosts(p) {
    var out = {};
    HOSTS.forEach(function (id) {
      var mac = id === 'C' && p.collide && !p.forged ? MAC.Ccollide : MAC[id];
      var v6 = [withIid('fe80::', mac)];
      if (id === 'A' && p.forged) v6.push(withIid(GLOBAL_PREFIX, mac));
      var groups = [ALL_NODES];
      v6.forEach(function (a) { var g = solicitedNode(a); if (groups.indexOf(g) < 0) groups.push(g); });   // rule 2
      out[id] = {
        id: id, mac: mac, v4: V4[id], ll: v6[0], v6: v6, groups: groups,
        nic4: [mac, BROADCAST],
        nic6: [mac].concat(groups.map(multicastMac))                                                         // rule 3
      };
    });
    return out;
  }

  /** The target's addresses and owner (null when absent). */
  function target(p, H) {
    if (p.target === 'absent') return { owner: null, v4: V4.absent, v6: ABSENT_V6 };
    var o = H[p.target] || H.B;
    return { owner: o.id, v4: o.v4, v6: o.ll };
  }

  /** Rule 3: which hosts' NICs pass a frame up (every host but the sender sees it on the link). */
  function nicAccepts(H, frame, nicKey) {
    var acc = [], drop = [];
    HOSTS.forEach(function (id) {
      if (id === frame.from) return;
      (H[id][nicKey].indexOf(frame.dstMac) >= 0 ? acc : drop).push(id);
    });
    return { accepted: acc, dropped: drop };
  }

  /** Rule 5: of the hosts that took an NS, the owner of the target answers; the rest discard it. */
  function nsVerdicts(H, accepted, targetAddr) {
    var v = {};
    accepted.forEach(function (id) { v[id] = H[id].v6.some(function (a) { return same(a, targetAddr); }) ? 'mine' : 'notMine'; });
    return v;
  }

  /** Rule 7: an NDP message is valid only with hop limit 255. */
  function ndpValid(msg) { return msg.hopLimit === C.ndpHopLimit; }

  // ── events per lane ──

  function laneEvents(p) {
    var t = target(p, hosts(p));
    var ev = [{ phase: 'miss', k: 0 }];
    if (t.owner) return ev.concat([{ phase: 'req', k: 1 }, { phase: 'filter', k: 1 }, { phase: 'check', k: 1 },
      { phase: 'reply', k: 1 }, { phase: 'cache', k: 1 }]);
    for (var k = 1; k <= C.maxMulticastSolicit; k++) ev.push({ phase: 'req', k: k }, { phase: 'filter', k: k });
    return ev.concat([{ phase: 'giveup', k: C.maxMulticastSolicit }]);
  }

  var FORGED = [{ phase: 'forge' }, { phase: 'forward' }, { phase: 'accept' }, { phase: 'drop' }];

  /** The run: which lane each step belongs to. Both lanes: IPv4 and IPv6 alternate, IPv4 first. */
  function schedule(p) {
    if (p.forged) return FORGED.map(function (e) { return { lane: 'v6', ev: e }; });
    var ev = laneEvents(p), out = [];
    ev.forEach(function (e) {
      if (p.lanes !== 'v6') out.push({ lane: 'v4', ev: e });
      out.push({ lane: 'v6', ev: e });
    });
    return out;
  }

  function lanesOf(p) { return p.forged ? 'v6' : p.lanes; }

  // ── state ──

  function emptyTables() { var o = {}; HOSTS.forEach(function (id) { o[id] = []; }); return o; }

  function laneState(kind, p, H) {
    var s = { kind: kind, phase: 'start', k: 0, t: 0, frame: null, accepted: [], dropped: [], verdicts: {},
      inspected: [], table: emptyTables(), timer: null, result: null };
    if (kind === 'v6' && p.forged) {     // an earlier lookup left B in A's cache
      s.table.A.push({ ip: H.B.ll, mac: H.B.mac, state: 'REACHABLE', mark: null });
    }
    return s;
  }

  function clearMarks(table) {
    Object.keys(table).forEach(function (id) { table[id].forEach(function (e) { e.mark = null; }); });
  }
  function find(rows, ip) { for (var i = 0; i < rows.length; i++) if (rows[i].ip === ip) return rows[i]; return null; }

  function requestFrame(kind, H, t, k) {
    var a = H.A;
    if (kind === 'v4') {
      return { kind: 'arp-req', cast: 'broadcast', from: 'A', to: null, srcMac: a.mac, dstMac: BROADCAST,
        senderIp: a.v4, senderMac: a.mac, targetIp: t.v4, k: k };
    }
    var group = solicitedNode(t.v6);
    return { kind: 'ns', cast: 'multicast', from: 'A', to: null, srcMac: a.mac, dstMac: multicastMac(group),     // rule 3, 4
      src: a.ll, dst: group, hopLimit: C.ndpHopLimit, type: 135, target: t.v6, slla: a.mac, k: k };
  }

  function replyFrame(kind, H, owner) {
    var a = H.A, o = H[owner];
    if (kind === 'v4') {
      return { kind: 'arp-rep', cast: 'unicast', from: owner, to: 'A', srcMac: o.mac, dstMac: a.mac,
        senderIp: o.v4, senderMac: o.mac, targetIp: a.v4 };
    }
    return { kind: 'na', cast: 'unicast', from: owner, to: 'A', srcMac: o.mac, dstMac: a.mac,                    // rule 6
      src: o.ll, dst: a.ll, hopLimit: C.ndpHopLimit, type: 136, target: o.ll, S: 1, O: 1, R: 0, tlla: o.mac };
  }

  function stepLane(s, ev, p, H) {
    var out = JSON.parse(JSON.stringify(s));
    clearMarks(out.table);
    out.phase = ev.phase;
    out.k = ev.k || 0;
    out.accepted = []; out.dropped = []; out.verdicts = {};
    var t = target(p, H), v6 = s.kind === 'v6';
    var a = out.table.A;
    switch (ev.phase) {
      case 'miss':
        out.frame = null;
        break;
      case 'req':
        out.t = (ev.k - 1) * C.retransTimer;
        out.frame = requestFrame(s.kind, H, t, ev.k);
        if (v6) {
          if (!find(a, t.v6)) a.push({ ip: t.v6, mac: null, state: 'INCOMPLETE', mark: 'new' });            // rule 4
          out.timer = 'running';
        }
        break;
      case 'filter':
        var nic = nicAccepts(H, out.frame, v6 ? 'nic6' : 'nic4');
        out.accepted = nic.accepted; out.dropped = nic.dropped;
        out.inspected = out.inspected.concat(nic.accepted);
        if (!t.owner) out.verdicts = v6 ? nsVerdicts(H, nic.accepted, t.v6) : arpVerdicts(H, nic.accepted, t.v4);
        break;
      case 'check':
        out.accepted = s.accepted.slice();
        out.dropped = s.dropped.slice();
        if (v6) {
          out.verdicts = nsVerdicts(H, s.accepted, t.v6);
          Object.keys(out.verdicts).forEach(function (id) {                                                      // rule 5
            if (out.verdicts[id] !== 'mine') return;
            var e = find(out.table[id], H.A.ll);
            if (e) { e.mac = H.A.mac; e.mark = 'refreshed'; }
            else out.table[id].push({ ip: H.A.ll, mac: H.A.mac, state: 'STALE', mark: 'new' });
          });
        } else {
          out.verdicts = arpVerdicts(H, s.accepted, t.v4);
          s.accepted.forEach(function (id) {                                                                      // rule 1
            var e = find(out.table[id], H.A.v4);
            if (e) { e.mac = H.A.mac; e.mark = 'refreshed'; }
            else if (out.verdicts[id] === 'mine') out.table[id].push({ ip: H.A.v4, mac: H.A.mac, state: null, mark: 'new' });
          });
        }
        break;
      case 'reply':
        out.frame = replyFrame(s.kind, H, t.owner);
        break;
      case 'cache':
        out.accepted = ['A'];
        if (v6) {
          if (ndpValid(out.frame)) {                                                                              // rule 6, 7
            var e6 = find(a, t.v6);
            e6.mac = out.frame.tlla; e6.state = 'REACHABLE'; e6.mark = 'new';
            out.timer = 'stopped';
          } else {
            out.result = 'dropped';
            break;
          }
        } else {
          var e4 = find(a, t.v4);
          if (e4) { e4.mac = out.frame.senderMac; e4.mark = 'refreshed'; }
          else a.push({ ip: t.v4, mac: out.frame.senderMac, state: null, mark: 'new' });
        }
        out.result = 'resolved';
        break;
      case 'giveup':                                                                                              // rule 8
        out.t = C.maxMulticastSolicit * C.retransTimer;
        out.frame = null;
        if (v6) { out.table.A = a.filter(function (e) { return e.ip !== t.v6; }); out.timer = 'expired'; }
        out.result = 'unreachable';
        break;
      case 'forge':
        out.frame = { kind: 'na', cast: 'unicast', forged: true, from: 'X', to: 'R', srcMac: null, dstMac: null,
          src: X_ADDR, dst: H.A.v6[1], hopLimit: C.ndpHopLimit, type: 136, target: H.B.ll, S: 0, O: 1, R: 0, tlla: MAC.fake };
        break;
      case 'forward':                                       // a router decrements the hop limit (RFC 8200 §3)
        out.frame.from = 'R'; out.frame.to = 'A'; out.frame.srcMac = MAC.R; out.frame.dstMac = H.A.mac;
        out.frame.hopLimit = s.frame.hopLimit - 1;
        break;
      case 'accept':
        out.accepted = H.A.nic6.indexOf(out.frame.dstMac) >= 0 ? ['A'] : [];
        out.inspected = out.inspected.concat(out.accepted);
        break;
      case 'drop':
        out.accepted = ['A'];
        if (ndpValid(out.frame)) {                         // never in this run: what a valid NA with O = 1 would do
          var eb = find(a, out.frame.target);
          if (eb) { eb.mac = out.frame.tlla; eb.state = 'STALE'; eb.mark = 'new'; }
          out.result = 'overridden';
        } else {
          var kept = find(a, out.frame.target);
          if (kept) kept.mark = 'hit';
          out.result = 'dropped';
        }
        break;
      default:
        throw new Error('unknown event ' + ev.phase);
    }
    return out;
  }

  /** Rule 1: of the hosts that took an ARP request, the owner of the target IP answers. */
  function arpVerdicts(H, accepted, targetIp) {
    var v = {};
    accepted.forEach(function (id) { v[id] = H[id].v4 === targetIp ? 'mine' : 'notMine'; });
    return v;
  }

  var logic = {
    BROADCAST: BROADCAST,
    ALL_NODES: ALL_NODES,
    C: C,
    MAC: MAC,
    X_ADDR: X_ADDR,

    /** Parameter defaults. The page's controls describe how each one is shown. */
    defaults: { target: 'B', collide: false, lanes: 'both', forged: false },

    /** Steps for these params: 6 events per lane for a found target, 8 for an absent one, 4 for the forged NA. */
    steps: function (p) { return schedule(p).length; },

    initial: function (p) {
      var H = hosts(p), ln = lanesOf(p);
      return { n: 0, lane: null, lanes: ln, v4: ln === 'v6' ? null : laneState('v4', p, H), v6: laneState('v6', p, H),
        done: false };
    },

    step: function (s, n, p) {
      var sched = schedule(p), it = sched[n - 1];
      if (!it) throw new Error('no step ' + n);
      var H = hosts(p);
      var out = { n: n, lane: it.lane, lanes: s.lanes, v4: s.v4, v6: s.v6, done: n === sched.length };
      out[it.lane] = stepLane(s[it.lane], it.ev, p, H);
      return out;
    },

    stepLane: stepLane,
    laneState: laneState,
    hosts: hosts,
    target: target,
    lanesOf: lanesOf,
    schedule: schedule,
    nicAccepts: nicAccepts,
    nsVerdicts: nsVerdicts,
    ndpValid: ndpValid,
    parse: parse,
    compress: compress,
    eui64: eui64,
    withIid: withIid,
    solicitedNode: solicitedNode,
    multicastMac: multicastMac
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
