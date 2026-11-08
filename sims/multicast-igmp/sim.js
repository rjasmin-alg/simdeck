/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for multicast-igmp: hosts join and leave a group; with IGMP snooping the switch keeps the stream off the
   ports that did not ask for it. Router R (the IGMP querier, the stream comes in through it) sits on switch port 5,
   hosts H1–H4 on ports 1–4, one VLAN. Rules and their sources: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   One step = one scripted event (join, leave, query, time jump), the IGMP messages it causes delivered and the switch
   and router tables updated, timers checked, then one frame of the 239.1.1.1 stream forwarded and counted.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // ── constants (RFC 2236 §8 defaults; SPEC.md "Numbers") ──
  var QI = 125;            // Query Interval, s (§8.2)
  var QRI = 10;            // Query Response Interval = Max Response Time, s (§8.3)
  var RV = 2;              // Robustness Variable (§8.1)
  var GMI = RV * QI + QRI; // Group Membership Interval = 260 s (§8.4)
  var LMQI = 1;            // Last Member Query Interval, s (§8.8)
  var LMQC = RV;           // Last Member Query Count = 2 (§8.9)

  var STREAM = '239.1.1.1';     // the one stream that arrives at R from upstream
  var ALL_SYSTEMS = '224.0.0.1';
  var ALL_ROUTERS = '224.0.0.2';
  var ROUTER_PORT = 5;

  /** The default scene: one host per port. Tests pass others (two hosts behind a hub on one port). */
  var SCENE = { hosts: { H1: 1, H2: 2, H3: 3, H4: 4 }, routerPort: ROUTER_PORT };

  // ── addresses ──

  function ipToInt(ip) {
    var o = ip.split('.').map(Number);
    return ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3];
  }
  function hex2(n) { return (n < 16 ? '0' : '') + n.toString(16).toUpperCase(); }

  /** RFC 1112 §6.4: 01-00-5E followed by a 0 bit and the low 23 bits of the group address. */
  function groupMac(ip) {
    var low = ipToInt(ip) & 0x7fffff;
    return ['01', '00', '5E', hex2(low >> 16), hex2((low >> 8) & 0xff), hex2(low & 0xff)].join('-');
  }
  /** The group bit: the lowest bit of the first octet of the destination MAC (URM ch07 Primjer 1). */
  function isGroupMac(mac) { return (parseInt(mac.slice(0, 2), 16) & 1) === 1; }
  /** 224.0.0.0/24: link-local control groups, always flooded (RFC 4541 §2.1.2 item 2). */
  function isLinkLocal(ip) { return ip.indexOf('224.0.0.') === 0; }
  /** The 32 bits of an IPv4 address, most significant first, as a string of 0 and 1. */
  function bitsOf(ip) {
    var n = ipToInt(ip), s = '';
    for (var i = 31; i >= 0; i--) s += (Math.floor(n / Math.pow(2, i)) % 2).toString();
    return s;
  }

  // ── scripts: one event per step ──
  // do: tick (nothing happens, the stream flows), join, leave, silent (the host hangs: no Leave, no answers),
  // query (general query, RFC 2236 §3), gsq (the querier's next group-specific query), wait (time passes).
  // `before` is a script whose end state is this one's start ("after preset 2").

  var SCRIPTS = {
    h1: { events: [
      { t: 0, do: 'tick' },
      { t: 1, do: 'join', host: 'H1', group: STREAM },
      { t: 2, do: 'tick' }
    ] },
    h1h3: { events: [
      { t: 0, do: 'tick' },
      { t: 1, do: 'join', host: 'H1', group: STREAM },
      { t: 2, do: 'join', host: 'H3', group: STREAM },
      { t: 3, do: 'tick' }
    ] },
    leave: { before: 'h1h3', events: [
      { t: 4, do: 'tick' },
      { t: 5, do: 'leave', host: 'H3', group: STREAM },
      { t: 5, do: 'gsq' },
      { t: 6, do: 'gsq' },
      { t: 7, do: 'wait' },
      { t: 8, do: 'tick' }
    ] },
    silent: { events: [
      { t: 0, do: 'join', host: 'H2', group: STREAM },
      { t: 5, do: 'silent', host: 'H2' },
      { t: QI, do: 'query' },
      { t: 2 * QI, do: 'query' },
      { t: GMI, do: 'wait' },
      { t: GMI + 1, do: 'tick' }
    ] },
    overlap: { before: 'h1only', events: [
      { t: 1, do: 'tick' },
      { t: 2, do: 'join', host: 'H4', group: '224.1.1.1' },
      { t: QI, do: 'query' },
      { t: QI + 1, do: 'tick' }
    ] },
    // only as the start of `overlap`: H1 is already in 239.1.1.1
    h1only: { events: [{ t: 0, do: 'join', host: 'H1', group: STREAM }] }
  };

  // ── helpers over plain data ──

  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function sortNum(a) { return a.slice().sort(function (x, y) { return x - y; }); }
  function hostsOn(scene, port) { return Object.keys(scene.hosts).filter(function (h) { return scene.hosts[h] === port; }); }
  function hostPorts(scene) {
    var out = [];
    Object.keys(scene.hosts).forEach(function (h) { if (out.indexOf(scene.hosts[h]) < 0) out.push(scene.hosts[h]); });
    return sortNum(out);
  }
  function allPorts(scene) { return sortNum(hostPorts(scene).concat([scene.routerPort])); }
  /** The switch's table key for a group: the group itself, or its MAC on a MAC-based table (RFC 4541 §2.1.2 item 5). */
  function keyOf(group, p) { return p.keyBy === 'mac' ? groupMac(group) : group; }
  function isMember(s, host, group) { return (s.members[host] || []).indexOf(group) >= 0; }

  /** Ports a switch sends a frame to that came in on `ingress` for `group` (data, not IGMP). */
  function dataPorts(s, scene, p, group, ingress) {
    var others = allPorts(scene).filter(function (x) { return x !== ingress; });
    if (!p.snooping || isLinkLocal(group)) return others;                       // rules 2 and 8: flood
    var e = s.table[keyOf(group, p)];
    var members = e ? Object.keys(e.ports).map(Number) : [];
    // rule 4: member ports and the router port; unregistered (no entry): the router port only (RFC 4541 §2.1.2 item 3)
    return others.filter(function (x) { return x === scene.routerPort || members.indexOf(x) >= 0; });
  }

  /** Where a host's IGMP message (report or leave) goes: the router port with snooping, else every other port. */
  function upPorts(scene, p, ingress) {
    if (p.snooping) return [scene.routerPort];
    return allPorts(scene).filter(function (x) { return x !== ingress; });
  }

  // ── the step ──

  function blank(scene) {
    var members = {}, received = {}, used = {}, history = {};
    Object.keys(scene.hosts).forEach(function (h) { members[h] = []; received[h] = 0; used[h] = 0; history[h] = []; });
    return {
      clock: 0, members: members, down: [], table: {}, router: { groups: {}, pendingQuery: null },
      inFlight: [], fwd: [], received: received, used: used, history: history, events: [], changed: []
    };
  }

  /** A host's report for a group, from its port: delivered, and the switch and router learn from it. */
  function report(s, scene, p, host, group, cause) {
    var port = scene.hosts[host];
    var to = upPorts(scene, p, port);
    s.inFlight.push({ type: 'report', from: host, port: port, group: group, dst: group, to: to, cause: cause });
    s.events.push({ code: 'report', host: host, port: port, group: group, to: to, cause: cause });
    if (p.snooping) {
      var key = keyOf(group, p);
      var e = s.table[key] || (s.table[key] = { groups: [], ports: {}, leaving: [] });
      if (e.groups.indexOf(group) < 0) e.groups.push(group);
      var had = e.ports[port] != null;
      e.ports[port] = s.clock + GMI;
      e.leaving = e.leaving.filter(function (x) { return x !== port; });
      s.events.push({ code: had ? 'refresh' : 'add-port', key: key, port: port, until: s.clock + GMI });
      if (s.changed.indexOf(key) < 0) s.changed.push(key);
    }
    var known = s.router.groups[group] != null;
    s.router.groups[group] = s.clock + GMI;
    if (!known) s.events.push({ code: 'router-add', group: group });
  }

  /** A query from R: to every host port (general, rule 5) or to the group's member ports (group-specific, rule 6). */
  function query(s, scene, p, group) {
    var ports;
    if (!group || !p.snooping) ports = hostPorts(scene);
    else {
      var e = s.table[keyOf(group, p)];
      ports = e ? sortNum(Object.keys(e.ports).map(Number)) : [];
    }
    var type = group ? 'gsq' : 'gq';
    s.inFlight.push({ type: type, from: 'R', port: scene.routerPort, group: group || null, dst: group || ALL_SYSTEMS, to: ports });
    s.events.push({ code: type, group: group || null, to: ports, n: group ? LMQC - s.router.pendingQuery.left : null });
    // members on those ports answer, one report per group (report suppression out of scope)
    Object.keys(scene.hosts).forEach(function (h) {
      if (ports.indexOf(scene.hosts[h]) < 0 || s.down.indexOf(h) >= 0) return;
      s.members[h].forEach(function (g) { if (!group || g === group) report(s, scene, p, h, g, type); });
    });
    ports.forEach(function (port) {
      var quiet = hostsOn(scene, port).every(function (h) {
        return s.down.indexOf(h) >= 0 || (group ? !isMember(s, h, group) : !s.members[h].length);
      });
      if (quiet) s.events.push({ code: 'no-answer', port: port, group: group || null });
    });
  }

  function leave(s, scene, p, host, group) {
    var port = scene.hosts[host];
    s.members[host] = s.members[host].filter(function (g) { return g !== group; });
    var to = upPorts(scene, p, port);
    s.inFlight.push({ type: 'leave', from: host, port: port, group: group, dst: ALL_ROUTERS, to: to });
    s.events.push({ code: 'leave', host: host, port: port, group: group, to: to });
    // rule 6: the port's entry now lives only for Last Member Query Count × Interval, unless a report comes
    var until = s.clock + LMQC * LMQI;
    if (p.snooping) {
      var key = keyOf(group, p), e = s.table[key];
      if (e && e.ports[port] != null) {
        e.ports[port] = Math.min(e.ports[port], until);
        if (e.leaving.indexOf(port) < 0) e.leaving.push(port);
        s.events.push({ code: 'shorten', key: key, port: port, until: e.ports[port] });
        if (s.changed.indexOf(key) < 0) s.changed.push(key);
      }
    }
    if (s.router.groups[group] != null) {
      s.router.groups[group] = Math.min(s.router.groups[group], until);
      s.router.pendingQuery = { group: group, left: LMQC };
    }
  }

  /** Timers: a port (and the router's group) with no report until its time is removed (rules 5 and 6). */
  function expire(s) {
    Object.keys(s.table).forEach(function (key) {
      var e = s.table[key];
      Object.keys(e.ports).forEach(function (port) {
        if (e.ports[port] <= s.clock) {
          var after = e.leaving.indexOf(Number(port)) >= 0 ? 'leave' : 'gmi';
          delete e.ports[port];
          e.leaving = e.leaving.filter(function (x) { return x !== Number(port); });
          s.events.push({ code: 'expire-port', key: key, port: Number(port), after: after });
          if (s.changed.indexOf(key) < 0) s.changed.push(key);
        }
      });
      if (!Object.keys(e.ports).length) { delete s.table[key]; s.events.push({ code: 'expire-key', key: key }); }
    });
    Object.keys(s.router.groups).forEach(function (g) {
      if (s.router.groups[g] <= s.clock) { delete s.router.groups[g]; s.events.push({ code: 'router-expire', group: g }); }
    });
    if (s.router.pendingQuery && s.router.groups[s.router.pendingQuery.group] == null) s.router.pendingQuery = null;
  }

  /** One frame of the stream: R forwards it onto the LAN only while it knows a member there. */
  function stream(s, scene, p) {
    s.fwd = [];
    if (s.router.groups[STREAM] == null) {
      s.events.push({ code: 'no-stream' });
      Object.keys(scene.hosts).forEach(function (h) { s.history[h].push('none'); });
      return;
    }
    var ports = dataPorts(s, scene, p, STREAM, scene.routerPort);
    s.fwd = ports.filter(function (x) { return x !== scene.routerPort; });
    s.inFlight.push({ type: 'stream', from: 'R', port: scene.routerPort, group: STREAM, dst: STREAM, to: s.fwd });
    s.events.push({ code: 'stream', to: s.fwd, mode: p.snooping ? 'snoop' : 'flood', copies: s.fwd.length });
    var mac = groupMac(STREAM);
    Object.keys(scene.hosts).forEach(function (h) {
      if (s.fwd.indexOf(scene.hosts[h]) < 0) { s.history[h].push('none'); return; }
      s.received[h]++;
      // who takes it: a member uses it; the NIC drops a MAC it does not listen to; the IP layer drops a group it did
      // not join that shares the MAC (rule 9); a hung host takes nothing
      var how;
      if (s.down.indexOf(h) >= 0) how = 'down';
      else if (isMember(s, h, STREAM)) how = 'use';
      else if (s.members[h].some(function (g) { return groupMac(g) === mac; })) how = 'ip';
      else how = 'nic';
      if (how === 'use') s.used[h]++;
      s.history[h].push(how);
      s.events.push({ code: 'rx', host: h, how: how });
    });
  }

  /** Apply one scripted event to s (a copy is made); scene and params as given. */
  function apply(s0, ev, scene, p) {
    var s = copy(s0);
    s.clock = ev.t;
    s.inFlight = [];
    s.events = [{ code: 'event', do: ev.do, host: ev.host || null, group: ev.group || null, t: ev.t }];
    s.changed = [];
    // (1) the scripted event, (2) its IGMP messages delivered and the tables updated
    if (ev.do === 'join') {
      if (!isMember(s, ev.host, ev.group)) s.members[ev.host].push(ev.group);
      report(s, scene, p, ev.host, ev.group, 'join');
    } else if (ev.do === 'leave') {
      leave(s, scene, p, ev.host, ev.group);
    } else if (ev.do === 'silent') {
      if (s.down.indexOf(ev.host) < 0) s.down.push(ev.host);
    } else if (ev.do === 'query') {
      query(s, scene, p, null);
    } else if (ev.do === 'gsq') {
      if (s.router.pendingQuery && s.router.pendingQuery.left > 0) {
        s.router.pendingQuery.left--;
        query(s, scene, p, s.router.pendingQuery.group);
        if (!s.router.pendingQuery.left) s.router.pendingQuery = null;
      }
    }
    expire(s);
    // (3) one frame of the stream, (4) counters
    stream(s, scene, p);
    return s;
  }

  function scriptOf(p) { return SCRIPTS[p.script] || SCRIPTS[logic.defaults.script]; }

  /** The state a script starts from: blank, or the end of its `before` script (same params). */
  function startOf(name, scene, p) {
    var sc = SCRIPTS[name];
    var s = sc.before ? startOf(sc.before, scene, p) : blank(scene);
    if (sc.before) {
      SCRIPTS[sc.before].events.forEach(function (ev) { s = apply(s, ev, scene, p); });
      // the start is a fresh scene for the counters and the per-step marks
      Object.keys(scene.hosts).forEach(function (h) { s.received[h] = 0; s.used[h] = 0; s.history[h] = []; });
      s.events = [];
      s.inFlight = [];
      s.changed = [];
    }
    return s;
  }

  var logic = {
    QI: QI, QRI: QRI, RV: RV, GMI: GMI, LMQI: LMQI, LMQC: LMQC,
    STREAM: STREAM, ALL_SYSTEMS: ALL_SYSTEMS, ALL_ROUTERS: ALL_ROUTERS, ROUTER_PORT: ROUTER_PORT,
    SCENE: SCENE, SCRIPTS: SCRIPTS,
    groupMac: groupMac, isGroupMac: isGroupMac, isLinkLocal: isLinkLocal, bitsOf: bitsOf, keyOf: keyOf,
    dataPorts: dataPorts, upPorts: upPorts, apply: apply, startOf: startOf,

    /** Parameter defaults: snooping on, a table keyed by group address, the "two receivers" script. */
    defaults: { snooping: true, keyBy: 'ip', script: 'h1h3' },

    /** One step per scripted event: h1 3, h1h3 4, leave 6, silent 6, overlap 4. */
    steps: function (p) { return scriptOf(p).events.length; },

    initial: function (p) {
      var name = SCRIPTS[p.script] ? p.script : logic.defaults.script;
      return startOf(name, SCENE, p);
    },

    step: function (s, n, p) { return apply(s, scriptOf(p).events[n - 1], SCENE, p); },

    /** Run a script on any scene (tests): the list of states, step 0 first. */
    run: function (scene, events, p, start) {
      var s = start || blank(scene), out = [s];
      events.forEach(function (ev) { s = apply(s, ev, scene, p); out.push(s); });
      return out;
    },
    blank: blank
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
