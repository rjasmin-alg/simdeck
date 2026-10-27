/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for intervlan-routing: one frame from P1 (VLAN 10) to Q1 (VLAN 20), or to P2 in its own VLAN, in the Grafo
   d.o.o. head office (URM ch12). Mode `roas`: SW1 sends it up the trunk to R1, whose subinterfaces route it and send
   it back down the same trunk. Mode `l3`: SW1's own VLAN interfaces (SVIs) route it inside the switch. One step: the
   frame crosses one link, or one device takes it in and decides. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. The port helpers (parseLink, carries,
   tagOnLink, arrivalVlan) are copied from sims/vlan/sim.js @ 14623bd; the rest are pure functions over plain data
   with no strings, so they can move to models/ unchanged. */
(function (root) {
  'use strict';

  // ── from sims/vlan/sim.js @ 14623bd (port model: access/trunk, tagging rules) ──

  /** 'trunk' → { mode: 'trunk' }; 'access-10' → { mode: 'access', vlan: 10 }. */
  function parseLink(link) {
    if (link === 'trunk') return { mode: 'trunk', vlan: null };
    var m = /^access-(\d+)$/.exec(link);
    if (!m) throw new Error('unknown link ' + link);
    return { mode: 'access', vlan: Number(m[1]) };
  }
  /** Can a frame of `vlan` leave on this port? A trunk carries every VLAN; an access port only the one it is in. */
  function carries(link, vlan) {
    var l = parseLink(link);
    return l.mode === 'trunk' || l.vlan === vlan;
  }
  /** The VLAN ID in the tag the frame wears on the wire: its VLAN on a trunk, none (untagged) on an access port. */
  function tagOnLink(link, vlan) {
    return parseLink(link).mode === 'trunk' ? vlan : null;
  }
  /** The VLAN a switch puts an arriving frame in: the tag's on a trunk, its own port's on an access port. */
  function arrivalVlan(link, tag) {
    var l = parseLink(link);
    return l.mode === 'trunk' ? tag : l.vlan;
  }

  // ── addresses ──

  var MAC = { P1: '02:00:00:00:00:0a', P2: '02:00:00:00:00:0b', Q1: '02:00:00:00:00:0c', R1: '02:00:00:00:00:01',
    SW1: '02:00:00:00:00:fe' };
  var SIZE_UNTAGGED = 1518, TAG_BYTES = 4, TTL0 = 64;

  function ipNum(ip) { return ip.split('.').reduce(function (a, x) { return a * 256 + Number(x); }, 0); }
  function ipStr(n) { return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }
  function maskOf(prefix) { return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0; }
  /** Rule 1: the network part, ip AND mask. */
  function netOf(ip, prefix) { return ipStr((ipNum(ip) & maskOf(prefix)) >>> 0); }
  function maskStr(prefix) { return ipStr(maskOf(prefix)); }

  // ── the scene ──

  var MODES = ['roas', 'l3'];
  var DSTS = ['q1', 'p2'];
  var FAULTS = ['none', 'access-port', 'vid-mismatch'];

  function norm(p) {
    var mode = MODES.indexOf(p.mode) >= 0 ? p.mode : 'roas';
    return { mode: mode, dst: DSTS.indexOf(p.dst) >= 0 ? p.dst : 'q1',
      fault: mode === 'roas' && FAULTS.indexOf(p.fault) >= 0 ? p.fault : 'none' };
  }

  /** The head office for these params (SPEC.md "Scene"). */
  function sceneOf(params) {
    var p = norm(params);
    var roas = p.mode === 'roas';
    var hosts = [
      { id: 'P1', ip: '192.168.1.2', prefix: 26, gw: '192.168.1.1', mac: MAC.P1, port: 'Fa0/1', vlan: 10, link: 'p1' },
      { id: 'Q1', ip: '192.168.1.66', prefix: 27, gw: '192.168.1.65', mac: MAC.Q1, port: 'Fa0/2', vlan: 20, link: 'q1' },
      { id: 'P2', ip: '192.168.1.3', prefix: 26, gw: '192.168.1.1', mac: MAC.P2, port: 'Fa0/5', vlan: 10, link: 'p2' }
    ];
    var ports = { 'Fa0/1': 'access-10', 'Fa0/2': 'access-20', 'Fa0/5': 'access-10' };
    var links = {
      p1: { a: 'P1', b: 'SW1', bPort: 'Fa0/1' },
      q1: { a: 'Q1', b: 'SW1', bPort: 'Fa0/2' },
      p2: { a: 'P2', b: 'SW1', bPort: 'Fa0/5' }
    };
    // SW1's MAC table, learnt while the network worked (SPEC.md "Tables"); rows in VLAN, then port order
    var macTable = [{ vlan: 10, mac: MAC.P1, port: 'Fa0/1' }, { vlan: 10, mac: MAC.P2, port: 'Fa0/5' }];
    var router = null, svis = [];
    if (roas) {
      ports['Gi0/1'] = p.fault === 'access-port' ? 'access-10' : 'trunk';
      links.trunk = { a: 'SW1', aPort: 'Gi0/1', b: 'R1', bPort: 'Gi0/0' };
      router = { id: 'R1', port: 'Gi0/0', mac: MAC.R1, subifs: [
        { name: 'Gi0/0.10', vid: 10, ip: '192.168.1.1', prefix: 26 },
        { name: 'Gi0/0.20', vid: p.fault === 'vid-mismatch' ? 21 : 20, ip: '192.168.1.65', prefix: 27 }] };
      macTable.push({ vlan: 10, mac: MAC.R1, port: 'Gi0/1' });
    } else {
      svis = [{ vlan: 10, ip: '192.168.1.1', prefix: 26 }, { vlan: 20, ip: '192.168.1.65', prefix: 27 }];
      macTable.push({ vlan: 10, mac: MAC.SW1, port: 'vlan 10', self: true });
    }
    macTable.push({ vlan: 20, mac: MAC.Q1, port: 'Fa0/2' });
    // R1 is learnt in VLAN 20 only while its VLAN 20 frames reach SW1 (no fault)
    if (roas && p.fault === 'none') macTable.push({ vlan: 20, mac: MAC.R1, port: 'Gi0/1' });
    if (!roas) macTable.push({ vlan: 20, mac: MAC.SW1, port: 'vlan 20', self: true });
    return {
      mode: p.mode, dst: p.dst, fault: p.fault,
      hosts: hosts, src: 'P1', target: p.dst === 'p2' ? 'P2' : 'Q1',
      sw: { id: 'SW1', vlans: [10, 20], ports: ports, mac: roas ? null : MAC.SW1, svis: svis, macTable: macTable },
      router: router, links: links
    };
  }

  function hostById(scene, id) { return scene.hosts.filter(function (h) { return h.id === id; })[0] || null; }

  // ── the devices' rules (pure, over plain data) ──

  /** Rule 1: the sender ANDs its mask. Same network → the destination's own MAC; else the gateway's. */
  function hostDecision(host, dstIp) {
    var own = netOf(host.ip, host.prefix), theirs = netOf(dstIp, host.prefix);
    return { own: own, theirs: theirs, mask: maskStr(host.prefix), local: own === theirs, nextHop: own === theirs ? dstIp : host.gw };
  }

  /** Rules 2 and 3 at ingress: the VLAN the switch puts the frame in, or why it drops it. A trunk only takes a VID the
      switch has (rule 5's other end: vid-mismatch). */
  function switchIngress(sw, port, frame) {
    var cfg = sw.ports[port];
    var vlan = arrivalVlan(cfg, frame.vid);
    if (sw.vlans.indexOf(vlan) < 0) return { vlan: null, drop: 'unknown-vlan' };
    return { vlan: vlan, drop: null };
  }

  /** Rule 3: look the destination MAC up in this VLAN's table only. First matching row wins (rows are unique per VLAN
      and MAC). */
  function macLookup(sw, vlan, mac) {
    var rows = sw.macTable;
    for (var i = 0; i < rows.length; i++) if (rows[i].vlan === vlan && rows[i].mac === mac) return { row: i, port: rows[i].port, self: !!rows[i].self };
    return null;
  }

  /** Rules 2 and 4 at egress: the frame as it leaves `port` in `vlan`: tagged on a trunk (+4 bytes), untagged on an
      access port. */
  function switchEgress(sw, port, frame, vlan) {
    var cfg = sw.ports[port];
    if (!carries(cfg, vlan)) return null;
    var out = copy(frame);
    out.vid = tagOnLink(cfg, vlan);
    out.size = SIZE_UNTAGGED + (out.vid === null ? 0 : TAG_BYTES);
    return out;
  }

  /** Rules 5 and 9: the subinterface whose 802.1Q VID equals the tag's. The subinterface's name plays no part; an
      untagged frame matches none (no native subinterface is configured). */
  function subifFor(router, vid) {
    if (vid === null || vid === undefined) return { subif: null, drop: 'untagged' };
    for (var i = 0; i < router.subifs.length; i++) if (router.subifs[i].vid === vid) return { subif: i, drop: null };
    return { subif: null, drop: 'no-subif' };
  }

  /** Rule 6: longest-prefix match over the connected networks (subinterfaces or SVIs); ties go to the first listed. */
  function routeLookup(ifaces, dstIp) {
    var best = -1;
    for (var i = 0; i < ifaces.length; i++) {
      var f = ifaces[i];
      if (netOf(dstIp, f.prefix) !== netOf(f.ip, f.prefix)) continue;
      if (best < 0 || f.prefix > ifaces[best].prefix) best = i;
    }
    return best < 0 ? null : { iface: best, net: netOf(dstIp, ifaces[best].prefix) + '/' + ifaces[best].prefix };
  }

  /** Rule 6: the routed packet in a new frame: the router's MAC as source, the next host's as destination, TTL − 1.
      `vid` is the egress subinterface's VID (router on a stick) or null (inside the L3 switch). */
  function rewrite(frame, srcMac, dstMac, vid) {
    var out = copy(frame);
    out.srcMac = srcMac;
    out.dstMac = dstMac;
    out.ttl = frame.ttl - 1;
    out.vid = vid;
    out.size = SIZE_UNTAGGED + (vid === null ? 0 : TAG_BYTES);
    return out;
  }

  function copy(o) { return JSON.parse(JSON.stringify(o)); }

  var FIELDS = ['dstMac', 'srcMac', 'vid', 'size', 'srcIp', 'dstIp', 'ttl'];
  /** The frame fields that differ between two frames (none when either is missing). */
  function changedFields(a, b) {
    if (!a || !b) return [];
    return FIELDS.filter(function (f) { return a[f] !== b[f]; });
  }

  // ── steps ──

  function next(s) {
    var out = copy(s);
    out.events = [];
    out.lookup = null;
    out.macHit = null;
    out.inPort = null;
    out.linkChanged = null;
    return out;
  }

  /** Put the frame on a link towards node `to`, arriving on port `toPort`; counts the link (rule 7). */
  function onLink(out, link, to, toPort) {
    out.at = link;
    out.phase = 'wire';
    out.toward = { node: to, port: toPort };
    out.linkUses[link] = (out.linkUses[link] || 0) + 1;
    out.linkChanged = link;
    out.hops.push({ link: link, vid: out.frame.vid });
  }

  function drop(out, at, reason) {
    out.at = at;
    out.phase = 'dropped';
    out.outcome = 'dropped';
    out.dropReason = reason;
    out.events.push('drop-' + reason);
  }

  var logic = {
    defaults: { mode: 'roas', dst: 'q1', fault: 'none' },
    modes: MODES,
    dsts: DSTS,
    faults: FAULTS,
    MAC: MAC,

    /** Steps for these params: replayed to the outcome (8, 5, 4, 4, 6 for the presets; never more than 8). */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (s.outcome === null && n < 20) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** Step 0: P1 holds a packet for the target; nothing is on a wire yet. */
    initial: function (p) {
      var scene = sceneOf(p), links = {};
      Object.keys(scene.links).forEach(function (k) { links[k] = 0; });
      return { mode: scene.mode, at: 'P1', phase: 'ready', toward: null, vlan: null, outPort: null, frame: null,
        decision: null, lookup: null, macHit: null, inPort: null, inSubif: null, outSubif: null, hops: [], linkUses: links, linkChanged: null, changed: [], outcome: null,
        dropReason: null, events: [] };
    },

    /** State after step n, from the state after step n − 1. */
    step: function (s, n, p) {
      var scene = sceneOf(p), sw = scene.sw, r = scene.router;
      var out = next(s), before = s.frame;
      var target = hostById(scene, scene.target);

      if (s.phase === 'ready') {
        // rule 1: P1 ANDs its mask and picks the MAC: the target's own, or the gateway's
        var h = hostById(scene, s.at);
        var d = hostDecision(h, target.ip);
        var gwMac = scene.mode === 'roas' ? r.mac : sw.mac;
        out.decision = d;
        out.frame = { dstMac: d.local ? target.mac : gwMac, srcMac: h.mac, vid: null, size: SIZE_UNTAGGED,
          srcIp: h.ip, dstIp: target.ip, ttl: TTL0 };
        out.events.push(d.local ? 'host-local' : 'host-remote');
        onLink(out, h.link, 'SW1', scene.links[h.link].bPort);
      } else if (s.phase === 'wire' && s.toward.node === 'SW1') {
        // rules 2, 3: ingress assigns or reads the VLAN; the MAC table of that VLAN gives the port
        var port = s.toward.port;
        var ing = switchIngress(sw, port, s.frame);
        out.toward = null;
        if (ing.drop) { drop(out, 'SW1', ing.drop); out.inPort = port; }
        else {
          out.at = 'SW1';
          out.vlan = ing.vlan;
          out.inPort = port;
          out.events.push(parseLink(sw.ports[port]).mode === 'trunk' ? 'ingress-trunk' : 'ingress-access');
          var hit = macLookup(sw, ing.vlan, s.frame.dstMac);
          out.lookup = { table: 'mac', vlan: ing.vlan, mac: s.frame.dstMac, row: hit ? hit.row : null };
          if (!hit) drop(out, 'SW1', 'no-mac');
          else if (hit.self) { out.phase = 'to-svi'; out.events.push('to-svi'); }
          else { out.phase = 'switched'; out.outPort = hit.port; out.events.push('mac-hit'); }
        }
      } else if (s.phase === 'switched') {
        // rules 2, 4: egress tags on a trunk, strips on an access port; onto the link
        var eg = switchEgress(sw, s.outPort, s.frame, s.vlan);
        out.frame = eg;
        out.events.push(eg.vid === null ? (s.frame.vid === null ? 'egress-untagged' : 'egress-untag') : 'egress-tag');
        var lk = linkAt(scene, 'SW1', s.outPort);
        var far = lk.a === 'SW1' ? { node: lk.b, port: lk.bPort } : { node: lk.a, port: null };
        onLink(out, lk.id, far.node, far.port);
        out.vlan = null;
        out.outPort = null;
      } else if (s.phase === 'to-svi') {
        // rules 6, 8: SW1 routes inside itself: TTL − 1, connected net on an SVI, a new frame in that VLAN, no tag
        var rt = routeLookup(sw.svis, s.frame.dstIp);
        out.lookup = { table: 'route', iface: rt.iface, net: rt.net };
        var egressVlan = sw.svis[rt.iface].vlan;
        out.frame = rewrite(s.frame, sw.mac, target.mac, null);
        out.vlan = egressVlan;
        out.events.push('route', 'ttl');
        var hit2 = macLookup(sw, egressVlan, out.frame.dstMac);
        out.macHit = { vlan: egressVlan, row: hit2.row };
        out.phase = 'switched';
        out.outPort = hit2.port;
        out.at = 'SW1';
      } else if (s.phase === 'wire' && r && s.toward.node === r.id) {
        // rules 5, 9: the tag's VID picks the subinterface; untagged or unknown VID → dropped
        var m = subifFor(r, s.frame.vid);
        out.toward = null;
        out.lookup = { table: 'subif', vid: s.frame.vid, row: m.subif };
        if (m.drop) drop(out, r.id, m.drop);
        else { out.at = r.id; out.phase = 'received'; out.inSubif = m.subif; out.events.push('subif-match'); }
      } else if (s.phase === 'received') {
        // rules 6, 7: route, rewrite, tag with the egress subinterface's VID, back down the same trunk
        var rr = routeLookup(r.subifs, s.frame.dstIp);
        out.lookup = { table: 'route', iface: rr.iface, net: rr.net };
        out.outSubif = rr.iface;
        out.frame = rewrite(s.frame, r.mac, target.mac, r.subifs[rr.iface].vid);
        out.events.push('route', 'ttl', 'egress-tag');
        onLink(out, 'trunk', 'SW1', 'Gi0/1');
      } else if (s.phase === 'wire') {
        // a host takes the frame: its own MAC, untagged, its own IP
        var hh = hostById(scene, s.toward.node);
        out.toward = null;
        out.at = hh.id;
        if (s.frame.dstMac === hh.mac && s.frame.vid === null && s.frame.dstIp === hh.ip) {
          out.phase = 'delivered';
          out.outcome = 'delivered';
          out.events.push('deliver');
        } else drop(out, hh.id, 'not-mine');
      } else {
        throw new Error('no step after ' + s.phase);
      }
      out.changed = changedFields(before, out.frame);
      return out;
    },

    sceneOf: sceneOf,
    netOf: netOf,
    maskStr: maskStr,
    hostDecision: hostDecision,
    switchIngress: switchIngress,
    macLookup: macLookup,
    switchEgress: switchEgress,
    subifFor: subifFor,
    routeLookup: routeLookup,
    rewrite: rewrite,
    changedFields: changedFields,
    parseLink: parseLink,
    carries: carries,
    tagOnLink: tagOnLink,
    arrivalVlan: arrivalVlan
  };

  /** The link at `node`'s `port`, with its id. */
  function linkAt(scene, node, port) {
    var ids = Object.keys(scene.links);
    for (var i = 0; i < ids.length; i++) {
      var l = scene.links[ids[i]];
      if ((l.a === node && l.aPort === port) || (l.b === node && l.bPort === port)) return { id: ids[i], a: l.a, aPort: l.aPort, b: l.b, bPort: l.bPort };
    }
    throw new Error('no link at ' + node + ' ' + port);
  }

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
