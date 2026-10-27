/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for link-aggregation: clients send flows through switch SW to server S over N member links of 1 Gbit/s
   (one bond). SW hashes each flow's headers to one member (hash mod number of up members); flows on a member share
   its 1 Gbit/s max-min fair; a failed member is removed and every flow is re-hashed. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rates are in Mbit/s (1 Gbit/s = 1000).
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  var CAPACITY = 1000;     // one member link, Mbit/s
  var MAX_MEMBERS = 4;
  var MAX_FLOWS = 8;

  /** Server S, the destination of every flow. Only the last MAC byte and last IP octet enter the hash. */
  var SERVER = { mac: '02:00:00:0b:00:10', ip: '192.168.10.10', port: 5000 };

  /** The seeded clients C1…C8, in the order flows are added; `port` is each client's source port. */
  var CLIENTS = [
    { id: 'C1', mac: '02:00:00:0a:00:3a', ip: '192.168.10.21', port: 50612 },
    { id: 'C2', mac: '02:00:00:0a:00:5c', ip: '192.168.10.22', port: 51088 },
    { id: 'C3', mac: '02:00:00:0a:00:71', ip: '192.168.10.23', port: 49733 },
    { id: 'C4', mac: '02:00:00:0a:00:8e', ip: '192.168.10.24', port: 52310 },
    { id: 'C5', mac: '02:00:00:0a:00:24', ip: '192.168.10.25', port: 50944 },
    { id: 'C6', mac: '02:00:00:0a:00:9b', ip: '192.168.10.26', port: 53217 },
    { id: 'C7', mac: '02:00:00:0a:00:46', ip: '192.168.10.27', port: 49906 },
    { id: 'C8', mac: '02:00:00:0a:00:d2', ip: '192.168.10.28', port: 51475 }
  ];
  /** With sameClient, every flow is from C1, flow k from source port C1_PORTS[k]. C1_PORTS[0] = C1's own port. */
  var C1_PORTS = [50612, 50613, 50614, 50615, 50616, 50617, 50618, 50619];

  var POLICIES = ['layer2', 'layer2+3', 'layer3+4'];
  /** Which header fields each policy reads (SPEC rule 2). */
  var INPUTS = { 'layer2': ['mac'], 'layer2+3': ['mac', 'ip'], 'layer3+4': ['ip', 'port'] };
  var FAILS = ['none', 'link1', 'link2', 'all'];

  var defaults = { members: 2, policy: 'layer2', flows: 1, fail: 'none', sameClient: false, demand: 1000 };
  var RANGES = { members: [2, MAX_MEMBERS, 1], flows: [1, MAX_FLOWS, 1], demand: [100, CAPACITY, 100] };

  function P(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  function lastByte(mac) { return parseInt(mac.split(':').pop(), 16); }
  function lastOctet(ip) { return Number(ip.split('.').pop()); }

  /** Rule 2: the simplified hash of one flow under one policy. */
  function hashOf(f, policy) {
    var mac = lastByte(f.srcMac) ^ lastByte(f.dstMac);
    var ip = lastOctet(f.srcIp) ^ lastOctet(f.dstIp);
    if (policy === 'layer2') return mac;
    if (policy === 'layer2+3') return mac ^ ip;
    return (f.srcPort ^ f.dstPort) ^ ip;               // layer3+4
  }

  /** The flows F1…Fn, in a fixed order (SPEC "Flows"). */
  function flowsOf(p) {
    var out = [];
    for (var k = 0; k < p.flows; k++) {
      var c = p.sameClient ? CLIENTS[0] : CLIENTS[k];
      out.push({
        id: 'F' + (k + 1), client: c.id, srcMac: c.mac, dstMac: SERVER.mac, srcIp: c.ip, dstIp: SERVER.ip,
        srcPort: p.sameClient ? C1_PORTS[k] : c.port, dstPort: SERVER.port, demand: p.demand
      });
    }
    return out;
  }

  /** A flow's identity, for "changed" marks: the same headers are the same flow. */
  function flowKey(f) { return [f.srcMac, f.srcIp, f.srcPort, f.dstMac, f.dstIp, f.dstPort].join('|'); }

  function membersOf(p) {
    var out = [];
    for (var i = 1; i <= p.members; i++) {
      var down = p.fail === 'all' || p.fail === 'link' + i;
      out.push({ id: i, up: !down });
    }
    return out;
  }

  /** Rules 1, 2, 4: member id of each flow = up[hash mod up.length]; null when no member is up (rule 6). */
  function assign(flows, members, policy) {
    var up = members.filter(function (m) { return m.up; }).map(function (m) { return m.id; });
    var a = {}, hash = {}, index = {};
    flows.forEach(function (f) {
      hash[f.id] = hashOf(f, policy);
      index[f.id] = up.length ? hash[f.id] % up.length : null;
      a[f.id] = up.length ? up[index[f.id]] : null;
    });
    return { up: up, assignment: a, hash: hash, index: index };
  }

  /**
   * Rule 3: max-min fair share of `capacity` among `demands` (in the given order). Water-filling: the smallest
   * demands are met first; the rest split what is left equally. Equal demands tie by position (stable sort).
   */
  function share(demands, capacity) {
    var order = demands.map(function (d, i) { return i; }).sort(function (x, y) { return demands[x] - demands[y] || x - y; });
    var out = demands.map(function () { return 0; });
    var left = capacity;
    order.forEach(function (i, k) {
      var r = Math.min(demands[i], left / (order.length - k));
      out[i] = r;
      left -= r;
    });
    return out;
  }

  function rates(flows, members, assignment) {
    var rate = {}, load = {};
    members.forEach(function (m) {
      var on = flows.filter(function (f) { return assignment[f.id] === m.id; });
      var r = m.up ? share(on.map(function (f) { return f.demand; }), CAPACITY) : on.map(function () { return 0; });
      on.forEach(function (f, i) { rate[f.id] = r[i]; });
      load[m.id] = r.reduce(function (s, x) { return s + x; }, 0);
    });
    var inOrder = {};
    flows.forEach(function (f) { inOrder[f.id] = rate[f.id] || 0; });     // bond down: nothing delivered
    return { rate: inOrder, memberLoad: load };
  }

  /** The derived state for one set of params (SPEC.md "State"). */
  function derive(p) {
    var flows = flowsOf(p);
    var members = membersOf(p);
    var a = assign(flows, members, p.policy);
    var r = rates(flows, members, a.assignment);
    var sum = function (o) { return Object.keys(o).reduce(function (s, k) { return s + o[k]; }, 0); };
    var s = {
      members: members, up: a.up, flows: flows, policy: p.policy,
      hash: a.hash, index: a.index, assignment: a.assignment, rate: r.rate, memberLoad: r.memberLoad,
      perMember: {}, offered: 0, delivered: 0, fastest: 0, capacity: a.up.length * CAPACITY,
      bondDown: a.up.length === 0, samePair: false, failover: null
    };
    members.forEach(function (m) { s.perMember[m.id] = flows.filter(function (f) { return a.assignment[f.id] === m.id; }).map(function (f) { return f.id; }); });
    s.offered = flows.reduce(function (t, f) { return t + f.demand; }, 0);
    s.delivered = sum(r.rate);
    flows.forEach(function (f) { s.fastest = Math.max(s.fastest, r.rate[f.id]); });
    // every flow reads the same hash inputs under this policy: they cannot be spread (the same-pair case)
    s.samePair = flows.length > 1 && flows.every(function (f) {
      return INPUTS[p.policy].every(function (k) {
        var g = flows[0];
        if (k === 'mac') return f.srcMac === g.srcMac && f.dstMac === g.dstMac;
        if (k === 'ip') return f.srcIp === g.srcIp && f.dstIp === g.dstIp;
        return f.srcPort === g.srcPort && f.dstPort === g.dstPort;
      });
    });
    // rule 4: against the same settings with every member up, which flows moved and which came from healthy links
    if (p.fail !== 'none') {
      var healthy = assign(flows, membersOf(P(Object.assign({}, p, { fail: 'none' }))), p.policy).assignment;
      var failed = members.filter(function (m) { return !m.up; }).map(function (m) { return m.id; });
      var moved = flows.filter(function (f) { return healthy[f.id] !== a.assignment[f.id]; }).map(function (f) { return f.id; });
      s.failover = {
        failed: failed, before: healthy, moved: moved,
        fromFailed: moved.filter(function (id) { return failed.indexOf(healthy[id]) >= 0; }),
        fromHealthy: moved.filter(function (id) { return failed.indexOf(healthy[id]) < 0; })
      };
    }
    return s;
  }

  /**
   * SPEC "Changed": the flows whose member differs from the state before the last input, matched by their headers
   * (a flow that is new, or a different flow at the same position, is not "moved"); a flow with no link before or
   * now (bond down) did not move either. Rule 5: the same assignment marks nothing. No state before → nothing.
   */
  function changed(before, now) {
    if (!before) return [];
    var was = {};
    before.flows.forEach(function (f) { was[flowKey(f)] = before.assignment[f.id]; });
    return now.flows.filter(function (f) {
      var k = flowKey(f);
      return k in was && was[k] !== null && now.assignment[f.id] !== null && was[k] !== now.assignment[f.id];
    }).map(function (f) { return f.id; });
  }

  /** Links that are up and carry no flow. */
  function idleMembers(s) {
    return s.up.filter(function (id) { return s.perMember[id].length === 0; });
  }

  /** Up links whose flows want more than the link carries (SPEC "Captions"). */
  function overloaded(s) {
    var demand = {};
    s.flows.forEach(function (f) { demand[f.id] = f.demand; });
    return s.up.filter(function (id) {
      return s.perMember[id].reduce(function (t, fid) { return t + demand[fid]; }, 0) > CAPACITY;
    });
  }

  var presets = [
    { id: 'one-flow', params: { members: 2, policy: 'layer2', flows: 1, fail: 'none', sameClient: false, demand: 1000 } },
    { id: 'same-pair', params: { members: 2, policy: 'layer2', flows: 4, fail: 'none', sameClient: true, demand: 1000 } },
    { id: 'many-clients', params: { members: 2, policy: 'layer2', flows: 8, fail: 'none', sameClient: false, demand: 200 } },
    { id: 'fail', params: { members: 2, policy: 'layer2', flows: 8, fail: 'link2', sameClient: false, demand: 200 } },
    { id: 'four-links', params: { members: 4, policy: 'layer2', flows: 3, fail: 'none', sameClient: false, demand: 1000 } }
  ];

  var logic = {
    CAPACITY: CAPACITY, SERVER: SERVER, CLIENTS: CLIENTS, C1_PORTS: C1_PORTS, POLICIES: POLICIES, INPUTS: INPUTS,
    FAILS: FAILS, RANGES: RANGES, MAX_MEMBERS: MAX_MEMBERS, MAX_FLOWS: MAX_FLOWS,
    defaults: defaults,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    derive: derive, hashOf: hashOf, flowsOf: flowsOf, membersOf: membersOf, assign: assign, share: share,
    changed: changed, idleMembers: idleMembers, overloaded: overloaded, lastByte: lastByte, lastOctet: lastOctet,
    flowKey: flowKey, withDefaults: P, presets: presets
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
