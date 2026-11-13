/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-bonding-modes: server S sends flows to clients C1…C8 through its bond (bond0) over 2–4 member links
   eth0…eth3 of 1 Gbit/s to switch SW. The bonding mode decides which member carries each flow: active-backup (one
   member), balance-rr (every member in turn), balance-xor and 802.3ad (hash mod up members); the switch's config
   (none / static / LACP) decides whether the mode works. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Rates are in Mbit/s (1 Gbit/s = 1000).
   The page loads this as a classic script (window.SimLogic); node tests require() it.
   hashOf, share, flowKey, lastByte and lastOctet are copied from sims/link-aggregation/sim.js @ ce4cc97 (not in
   models/ yet; NOTES.md "Shared requests"). */
(function (root) {
  'use strict';

  var CAPACITY = 1000;      // one member link, Mbit/s
  var MAX_MEMBERS = 4;
  var MAX_FLOWS = 8;
  /** Every flow is a bulk transfer that wants more than any bond here can give (4 links), so the links decide. */
  var GREEDY = MAX_MEMBERS * CAPACITY;
  /** Rule 2: the share of balance-rr's raw rate TCP keeps when its frames arrive out of order (a stage choice). */
  var RR_PENALTY = 0.8;
  /** Rule 1: the primary member (set, so the bond returns to eth0 when it is back). */
  var PRIMARY = 0;

  /** Server S, the sender (the end whose bond is modelled, rule 6). Last MAC byte and last IP octet enter the hash. */
  var SERVER = { mac: '02:00:00:0b:00:10', ip: '192.168.10.10', port: 5000 };
  /** The default gateway: with `gateway` on, every frame from S carries its MAC as the destination. */
  var GATEWAY = { mac: '02:00:00:0a:00:01', ip: '192.168.10.1' };

  /** The host's seeded clients C1…C8 (sims/link-aggregation SPEC.md), in the order flows are added. */
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
  /** Behind the gateway the clients sit in another network; the last octet (the hash input) is kept. */
  var REMOTE_PREFIX = '10.20.30.';

  var MODES = ['active-backup', 'balance-rr', 'balance-xor', '802.3ad'];
  /** Mode numbers (bonding's `mode` option). */
  var MODE_NO = { 'active-backup': 1, 'balance-rr': 0, 'balance-xor': 2, '802.3ad': 4 };
  /** What each mode needs on the switch (rules 1–4); null = nothing. */
  var NEEDS = { 'active-backup': null, 'balance-rr': 'static', 'balance-xor': 'static', '802.3ad': 'lacp' };
  var POLICIES = ['layer2', 'layer3+4'];
  /** Which header fields each policy reads. */
  var INPUTS = { 'layer2': ['mac'], 'layer3+4': ['ip', 'port'] };
  var SWITCH = ['none', 'static', 'lacp'];
  var FAILS = ['none', 'eth0', 'eth1'];

  var defaults = { mode: 'active-backup', members: 2, fail: 'none', policy: 'layer2', switchCfg: 'none', flows: 4, gateway: false };
  var RANGES = { members: [2, MAX_MEMBERS, 1], flows: [1, MAX_FLOWS, 1] };

  function P(over) {
    var p = {};
    Object.keys(defaults).forEach(function (k) { p[k] = defaults[k]; });
    Object.keys(over || {}).forEach(function (k) { p[k] = over[k]; });
    return p;
  }

  // ── copied from sims/link-aggregation/sim.js @ ce4cc97 ──

  function lastByte(mac) { return parseInt(mac.split(':').pop(), 16); }
  function lastOctet(ip) { return Number(ip.split('.').pop()); }

  /** The simplified hash of one flow under one policy (host rule 2; layer2+3 is not offered here). */
  function hashOf(f, policy) {
    var mac = lastByte(f.srcMac) ^ lastByte(f.dstMac);
    var ip = lastOctet(f.srcIp) ^ lastOctet(f.dstIp);
    if (policy === 'layer2') return mac;
    if (policy === 'layer2+3') return mac ^ ip;
    return (f.srcPort ^ f.dstPort) ^ ip;               // layer3+4
  }

  /** A flow's identity, for "changed" marks: the same headers are the same flow. */
  function flowKey(f) { return [f.srcMac, f.srcIp, f.srcPort, f.dstMac, f.dstIp, f.dstPort].join('|'); }

  /**
   * Max-min fair share of `capacity` among `demands` (in the given order). Water-filling: the smallest demands are
   * met first; the rest split what is left equally. Equal demands tie by position (stable sort).
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

  // ── new on this page ──

  /** The flows F1…Fn from S to C1…Cn, in a fixed order (SPEC "Flows"). */
  function flowsOf(p) {
    var out = [];
    for (var k = 0; k < p.flows; k++) {
      var c = CLIENTS[k];
      out.push({
        id: 'F' + (k + 1), client: c.id, srcMac: SERVER.mac, dstMac: p.gateway ? GATEWAY.mac : c.mac,
        srcIp: SERVER.ip, dstIp: p.gateway ? REMOTE_PREFIX + lastOctet(c.ip) : c.ip,
        srcPort: SERVER.port, dstPort: c.port, demand: GREEDY
      });
    }
    return out;
  }

  /** Members eth0…eth(n−1); `fail` names one of them, or none. */
  function membersOf(p) {
    var out = [];
    for (var i = 0; i < p.members; i++) out.push({ id: i, up: p.fail !== 'eth' + i });
    return out;
  }

  /** Rules 1 and 4 (no partner): the primary if up, otherwise the lowest-numbered up member; null if none is up. */
  function firstUp(up) {
    if (up.indexOf(PRIMARY) >= 0) return PRIMARY;
    return up.length ? Math.min.apply(null, up) : null;
  }

  /** Rule 4: does the switch answer LACP? Only with LACP configured on its ports. */
  function lacpPartner(p) { return p.switchCfg === 'lacp'; }

  /**
   * Which member carries each flow: a member id, 'all' (balance-rr, every up member in turn) or null (no member up).
   * `how` says which rule decided: 'active' (rule 1), 'rr' (rule 2), 'hash' (rules 3, 4, 5), 'single' (rule 4,
   * no LACP partner).
   */
  function assign(flows, members, p) {
    var up = members.filter(function (m) { return m.up; }).map(function (m) { return m.id; });
    var a = {}, hash = {}, index = {}, how, active = null;
    if (p.mode === 'active-backup' || (p.mode === '802.3ad' && !lacpPartner(p))) {
      how = p.mode === 'active-backup' ? 'active' : 'single';
      active = firstUp(up);
      flows.forEach(function (f) { a[f.id] = active; });
    } else if (p.mode === 'balance-rr') {
      how = 'rr';
      flows.forEach(function (f) { a[f.id] = up.length ? 'all' : null; });
    } else {
      how = 'hash';
      flows.forEach(function (f) {
        hash[f.id] = hashOf(f, p.policy);
        index[f.id] = up.length ? hash[f.id] % up.length : null;
        a[f.id] = up.length ? up[index[f.id]] : null;
      });
    }
    return { up: up, how: how, active: how === 'active' ? active : null, single: how === 'single' ? active : null,
      assignment: a, hash: hash, index: index };
  }

  /** Rates per flow and load per member (rules 1–4); `perMember` lists the flows on each member (rr: every flow). */
  function rates(flows, members, a) {
    var rate = {}, load = {}, perMember = {};
    members.forEach(function (m) { load[m.id] = 0; perMember[m.id] = []; });
    if (a.how === 'rr') {
      var n = a.up.length;
      var total = n * CAPACITY * (n >= 2 ? RR_PENALTY : 1);
      var r = share(flows.map(function (f) { return f.demand; }), total);
      flows.forEach(function (f, i) { rate[f.id] = r[i]; });
      a.up.forEach(function (id) {
        perMember[id] = flows.map(function (f) { return f.id; });
        load[id] = total / n;
      });
    } else {
      members.forEach(function (m) {
        var on = flows.filter(function (f) { return a.assignment[f.id] === m.id; });
        var r = m.up ? share(on.map(function (f) { return f.demand; }), CAPACITY) : on.map(function () { return 0; });
        on.forEach(function (f, i) { rate[f.id] = r[i]; });
        perMember[m.id] = on.map(function (f) { return f.id; });
        load[m.id] = r.reduce(function (s, x) { return s + x; }, 0);
      });
    }
    var inOrder = {};
    flows.forEach(function (f) { inOrder[f.id] = rate[f.id] || 0; });
    return { rate: inOrder, memberLoad: load, perMember: perMember };
  }

  /** Warnings (task "Scene"): reordering, MAC flapping, LACP without partner. Codes, in this order. */
  function warningsOf(p, a, used) {
    var w = [];
    if (a.how === 'rr' && a.up.length >= 2) w.push('reorder');
    if ((p.mode === 'balance-rr' || p.mode === 'balance-xor') && p.switchCfg !== 'static' && used.length >= 2) w.push('macFlap');
    if (p.mode === '802.3ad' && !lacpPartner(p)) w.push('noPartner');
    return w;
  }

  /** The derived state for one set of params (SPEC.md "State"). */
  function derive(p) {
    var flows = flowsOf(p);
    var members = membersOf(p);
    var a = assign(flows, members, p);
    var r = rates(flows, members, a);
    var used = a.up.filter(function (id) { return r.perMember[id].length > 0; });
    var need = NEEDS[p.mode];
    var s = {
      mode: p.mode, members: members, up: a.up, how: a.how, active: a.active, single: a.single,
      switchCfg: p.switchCfg, switchNeeds: need, switchOk: need === null || need === p.switchCfg,
      policy: p.policy, gateway: p.gateway, flows: flows, hash: a.hash, index: a.index,
      assignment: a.assignment, rate: r.rate, memberLoad: r.memberLoad, perMember: r.perMember, used: used,
      delivered: 0, fastest: 0, capacity: a.up.length * CAPACITY, warnings: [], unreliable: false, failover: null
    };
    flows.forEach(function (f) { s.delivered += r.rate[f.id]; s.fastest = Math.max(s.fastest, r.rate[f.id]); });
    s.warnings = warningsOf(p, a, used);
    s.unreliable = s.warnings.indexOf('macFlap') >= 0;
    // rule 1 / rule 5: against the same settings with every member up
    if (p.fail !== 'none') {
      var healthy = assign(flows, membersOf(P(Object.assign({}, p, { fail: 'none' }))), p);
      var failed = members.filter(function (m) { return !m.up; }).map(function (m) { return m.id; });
      var moved = a.how === 'rr' ? [] : flows.filter(function (f) { return healthy.assignment[f.id] !== a.assignment[f.id]; })
        .map(function (f) { return f.id; });
      s.failover = {
        failed: failed, before: healthy.assignment, moved: moved,
        fromFailed: moved.filter(function (id) { return failed.indexOf(healthy.assignment[id]) >= 0; }),
        fromHealthy: moved.filter(function (id) { return failed.indexOf(healthy.assignment[id]) < 0; }),
        activeBefore: healthy.active, activeMoved: healthy.active !== a.active
      };
    }
    return s;
  }

  /**
   * SPEC "Changed": flows whose member differs from the state before the last input, matched by their headers (a
   * new flow is not "moved"; 'all' ↔ one member counts as a move). No state before → nothing.
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

  /** SPEC "Changed": the active-member star moved (both states in active-backup, both with an active member). */
  function activeChanged(before, now) {
    return !!before && before.active !== null && now.active !== null && before.active !== now.active;
  }

  var presets = [
    { id: 'active-backup-fail', params: { mode: 'active-backup', members: 2, flows: 4, fail: 'eth0', switchCfg: 'none', policy: 'layer2', gateway: false } },
    { id: 'rr-one-flow', params: { mode: 'balance-rr', members: 2, flows: 1, fail: 'none', switchCfg: 'static', policy: 'layer2', gateway: false } },
    { id: 'lacp-layer2-gateway', params: { mode: '802.3ad', members: 2, flows: 4, fail: 'none', switchCfg: 'lacp', policy: 'layer2', gateway: true } },
    { id: 'lacp-no-partner', params: { mode: '802.3ad', members: 2, flows: 4, fail: 'none', switchCfg: 'none', policy: 'layer2', gateway: false } },
    { id: 'xor-fail-rehash', params: { mode: 'balance-xor', members: 3, flows: 6, fail: 'eth1', switchCfg: 'static', policy: 'layer3+4', gateway: false } }
  ];

  var logic = {
    CAPACITY: CAPACITY, GREEDY: GREEDY, RR_PENALTY: RR_PENALTY, PRIMARY: PRIMARY, SERVER: SERVER, GATEWAY: GATEWAY,
    CLIENTS: CLIENTS, MODES: MODES, MODE_NO: MODE_NO, NEEDS: NEEDS, POLICIES: POLICIES, INPUTS: INPUTS, SWITCH: SWITCH,
    FAILS: FAILS, RANGES: RANGES, MAX_MEMBERS: MAX_MEMBERS, MAX_FLOWS: MAX_FLOWS,
    defaults: defaults,
    /** Explorer: no steps; the state is derived from the params. */
    initial: function (p) { return derive(p); },
    derive: derive, hashOf: hashOf, flowsOf: flowsOf, membersOf: membersOf, assign: assign, share: share,
    firstUp: firstUp, changed: changed, activeChanged: activeChanged, lastByte: lastByte, lastOctet: lastOctet,
    flowKey: flowKey, withDefaults: P, presets: presets
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
