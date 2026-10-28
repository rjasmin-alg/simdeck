/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for vlan-trunk: two switches SW1 and SW2 joined by one cable Gi0/1–Gi0/1, each with Ra (VLAN 10,
   accounting) on Fa0/1, Pr (VLAN 20, sales) on Fa0/2 and M in the switch's native VLAN on Fa0/3 (URM ch07,
   Primjer 5). Hosts send untagged frames; one step moves every frame in flight one hop: from a host onto its
   access link, into a switch (ingress: which VLAN; forwarding: which ports of that VLAN), out of a port (egress:
   tag, untag or drop) onto the next link, and onto a host's link, where the host takes it. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. parseLink is copied from
   sims/vlan/sim.js @ 14623bd; ingress and egress generalise its carries, tagOnLink and arrivalVlan with the native
   VLAN and the allowed list. The port functions (validVid, inAllowed, ingress, egress, frameLen, portsInVlan,
   macTable, forward) are pure functions over plain data with no strings, ready for models/. */
(function (root) {
  'use strict';

  // ── from sims/vlan/sim.js @ 14623bd ──

  /** 'trunk' → { mode: 'trunk' }; 'access-10' → { mode: 'access', vlan: 10 }. The same setting on both ends. */
  function parseLink(link) {
    if (link === 'trunk') return { mode: 'trunk', vlan: null };
    var m = /^access-(\d+)$/.exec(link);
    if (!m) throw new Error('unknown link ' + link);
    return { mode: 'access', vlan: Number(m[1]) };
  }

  // ── 802.1Q (SPEC.md rules 2–6, 10) ──

  var SIZE_UNTAGGED = 1518, TAG_BYTES = 4, TPID = '0x8100', VID_MIN = 1, VID_MAX = 4094;
  var ALL = [[VID_MIN, VID_MAX]];

  /** Rule 6: a VID is 12 bits, 0 and 4095 are reserved, so 1–4094 can be assigned. */
  function validVid(v) { return v === Math.floor(v) && v >= VID_MIN && v <= VID_MAX; }

  /** Rule 5: is VLAN v in an allowed list (ranges [lo, hi], inclusive)? */
  function inAllowed(allowed, v) {
    for (var i = 0; i < allowed.length; i++) if (v >= allowed[i][0] && v <= allowed[i][1]) return true;
    return false;
  }

  /** The allowed list without one VLAN: [[1, 4094]] minus 20 → [[1, 19], [21, 4094]]. */
  function without(allowed, v) {
    var out = [];
    allowed.forEach(function (r) {
      if (v < r[0] || v > r[1]) { out.push([r[0], r[1]]); return; }
      if (r[0] <= v - 1) out.push([r[0], v - 1]);
      if (v + 1 <= r[1]) out.push([v + 1, r[1]]);
    });
    return out;
  }

  /** Rules 2, 4, 5, 10: the VLAN a frame arriving with `tag` (a VID or null) belongs to on this port, or why it is
      dropped. Access: untagged → the port's VLAN; tagged → dropped. Trunk: tagged → its VID; untagged → the port's
      native VLAN; a VLAN outside the allowed list → dropped. `how` says where the VLAN came from. */
  function ingress(port, tag) {
    if (port.mode === 'access') {
      if (tag !== null) return { drop: 'tagged-on-access' };
      return { vlan: port.vlan, how: 'port' };
    }
    var v = tag === null ? port.native : tag;
    if (!inAllowed(port.allowed, v)) return { drop: 'not-allowed', vlan: v };
    return { vlan: v, how: tag === null ? 'native' : 'tag' };
  }

  /** Rules 2, 3, 5: what a frame of VLAN `vlan` wears when it leaves this port, or why it does not leave. Access: only
      its own VLAN, untagged. Trunk: tagged with the VID, except the native VLAN, which leaves untagged; a VLAN
      outside the allowed list is not sent. */
  function egress(port, vlan) {
    if (port.mode === 'access') return port.vlan === vlan ? { tag: null } : { drop: 'other-vlan' };
    if (!inAllowed(port.allowed, vlan)) return { drop: 'not-allowed' };
    return { tag: vlan === port.native ? null : vlan };
  }

  /** Rule 6: 1518 bytes untagged, 4 more with the tag. */
  function frameLen(tag) { return SIZE_UNTAGGED + (tag === null ? 0 : TAG_BYTES); }

  // ── the scene ──

  var LINKS = ['trunk', 'access-10', 'access-20'];
  var SENDS = ['ra1-ra2', 'pr1-pr2', 'pr1-bcast', 'm1-m2', 'both'];
  var SWITCHES = ['SW1', 'SW2'];
  var UPLINK = 'Gi0/1';
  var BCAST = 'ff:ff:ff:ff:ff:ff';
  /** Host ids, their switch, port and MAC; VLAN 10/20 fixed, M in its switch's native VLAN (SPEC.md "Scene"). */
  var HOSTS = [
    { id: 'Ra1', sw: 'SW1', port: 'Fa0/1', vlan: 10, mac: '02:00:00:00:00:11' },
    { id: 'Pr1', sw: 'SW1', port: 'Fa0/2', vlan: 20, mac: '02:00:00:00:00:21' },
    { id: 'M1', sw: 'SW1', port: 'Fa0/3', vlan: 'native', mac: '02:00:00:00:00:31' },
    { id: 'Ra2', sw: 'SW2', port: 'Fa0/1', vlan: 10, mac: '02:00:00:00:00:12' },
    { id: 'Pr2', sw: 'SW2', port: 'Fa0/2', vlan: 20, mac: '02:00:00:00:00:22' },
    { id: 'M2', sw: 'SW2', port: 'Fa0/3', vlan: 'native', mac: '02:00:00:00:00:32' }
  ];
  var SEND = {
    'ra1-ra2': [['Ra1', 'Ra2']],
    'pr1-pr2': [['Pr1', 'Pr2']],
    'pr1-bcast': [['Pr1', 'broadcast']],
    'm1-m2': [['M1', 'M2'], ['Ra1', 'Ra2']],
    both: [['Ra1', 'Ra2'], ['Pr1', 'Pr2']]
  };
  var STEPS = 5;

  function clampVlan(v, d) {
    v = Math.round(Number(v));
    return v >= 1 && v <= 99 ? v : d;
  }

  function norm(p) {
    return {
      link: LINKS.indexOf(p.link) >= 0 ? p.link : 'trunk',
      native1: clampVlan(p.native1, 1),
      native2: clampVlan(p.native2, 1),
      allow20: p.allow20 !== false,
      send: SENDS.indexOf(p.send) >= 0 ? p.send : 'both'
    };
  }

  /** Both switches for these params: ports['SW1']['Gi0/1'] = { mode, vlan | native + allowed }, the hosts with their
      VLANs, and the links (host links named by the host, the cable between the switches 'isl'). */
  function sceneOf(params) {
    var p = norm(params);
    var l = parseLink(p.link);
    var native = { SW1: p.native1, SW2: p.native2 };
    var allowed = p.allow20 ? ALL : without(ALL, 20);
    var ports = {}, hosts = {};
    SWITCHES.forEach(function (sw) { ports[sw] = {}; });
    HOSTS.forEach(function (x) {
      var v = x.vlan === 'native' ? native[x.sw] : x.vlan;
      hosts[x.id] = { id: x.id, sw: x.sw, port: x.port, vlan: v, mac: x.mac };
      ports[x.sw][x.port] = { mode: 'access', vlan: v, host: x.id };
    });
    SWITCHES.forEach(function (sw) {
      ports[sw][UPLINK] = l.mode === 'trunk'
        ? { mode: 'trunk', native: native[sw], allowed: allowed.map(function (r) { return [r[0], r[1]]; }), peer: sw === 'SW1' ? 'SW2' : 'SW1' }
        : { mode: 'access', vlan: l.vlan, peer: sw === 'SW1' ? 'SW2' : 'SW1' };
    });
    return { params: p, ports: ports, hosts: hosts, uplink: UPLINK, send: SEND[p.send] };
  }

  function portNames(scene, sw) { return Object.keys(scene.ports[sw]).sort(); }

  /** Every port of `sw` that carries VLAN v: access ports in v and the trunk (its allowed list is checked on egress,
      rule 5). The flood set is this minus the ingress port (rule 7). */
  function portsInVlan(scene, sw, v) {
    return portNames(scene, sw).filter(function (n) {
      var pt = scene.ports[sw][n];
      return pt.mode === 'trunk' || pt.vlan === v;
    });
  }

  /** The way a frame from `host` would reach switch `sw`: its VLAN there and the port, or null when no frame of that
      host gets there (dropped or no port). Used for the pre-learned MAC tables. */
  function arrival(scene, host, sw) {
    var x = scene.hosts[host];
    if (x.sw === sw) return { vlan: x.vlan, port: x.port };
    var out = scene.ports[x.sw][UPLINK];
    var e = egress(out, x.vlan);
    if (e.drop) return null;
    var i = ingress(scene.ports[sw][UPLINK], e.tag);
    if (i.drop) return null;
    return { vlan: i.vlan, port: UPLINK };
  }

  /** The MAC table of `sw`, learnt before step 1 from every host's frames by the same rules (MAC learning itself is
      mac-table's concept): rows { host, mac, vlan, port }, in host order. A host whose frames never reach `sw` has
      no row. */
  function macTable(scene, sw) {
    var rows = [];
    HOSTS.forEach(function (x) {
      var a = arrival(scene, x.id, sw);
      if (a) rows.push({ host: x.id, mac: x.mac, vlan: a.vlan, port: a.port });
    });
    return rows;
  }

  /** The forwarding decision inside VLAN v (rule 7): broadcast → every port of v but the ingress; a destination
      learnt in v → its port; unknown in v → flooded like a broadcast. A learnt port equal to the ingress port is
      filtered (empty). */
  function forward(scene, sw, v, inPort, dst) {
    var flood = portsInVlan(scene, sw, v).filter(function (n) { return n !== inPort; });
    if (dst === 'broadcast') return { ports: flood, how: 'broadcast' };
    var row = macTable(scene, sw).filter(function (r) { return r.host === dst && r.vlan === v; })[0];
    if (!row) return { ports: flood, how: 'unknown' };
    return { ports: row.port === inPort ? [] : [row.port], how: 'known' };
  }

  /** The far end of the port `port` of `sw`: a host, or the other switch's uplink. */
  function peerOf(scene, sw, port) {
    var pt = scene.ports[sw][port];
    if (pt.host) return { host: pt.host };
    return { sw: pt.peer, port: UPLINK };
  }

  function linkId(sw, port, scene) {
    var pt = scene.ports[sw][port];
    return pt.host ? pt.host : 'isl';
  }

  // ── stepping ──

  function copy(f) { return JSON.parse(JSON.stringify(f)); }

  /** Step 0: the frames wait at their hosts, untagged. */
  function initial(params) {
    var scene = sceneOf(params);
    var frames = scene.send.map(function (pair, i) {
      var src = scene.hosts[pair[0]];
      return {
        id: 'f' + (i + 1), src: pair[0], dst: pair[1], srcVlan: src.vlan,
        dstMac: pair[1] === 'broadcast' ? BCAST : scene.hosts[pair[1]].mac, srcMac: src.mac,
        tag: null, len: frameLen(null), vlan: null,
        where: { kind: 'host', host: pair[0] },
        status: 'ready', change: null, leak: false
      };
    });
    return { frames: frames, delivered: [], dropped: [], events: [] };
  }

  /** One hop for every frame that is not finished (SPEC.md "One step"). Copies of a flooded frame get ids
      `<id>.<port>`. */
  function step(s, n, params) {
    var scene = sceneOf(params);
    var out = { frames: [], delivered: s.delivered.slice(), dropped: s.dropped.slice(), events: [] };

    function ev(f, code, extra) {
      var e = { f: f.id, code: code };
      if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; });
      out.events.push(e);
    }
    function drop(f, where, port, reason) {
      f.status = 'dropped';
      out.dropped.push({ frame: f.id, where: where, port: port, reason: reason });
    }
    /** Put a frame onto the link behind `port` of `sw`; a host at the far end takes it at once. */
    function onto(f, sw, port, tag) {
      var before = f.tag;
      f.tag = tag;
      f.len = frameLen(tag);
      f.change = before === tag ? null : before === null ? 'added' : tag === null ? 'removed' : 'retagged';
      var peer = peerOf(scene, sw, port);
      f.where = { kind: 'link', link: linkId(sw, port, scene), from: sw, fromPort: port,
        to: peer.host || peer.sw, toPort: peer.port || null };
      if (peer.host) {
        if (f.dst === 'broadcast' || f.dst === peer.host) {
          f.status = 'delivered';
          out.delivered.push({ frame: f.id, host: peer.host, leak: f.leak });
          ev(f, 'deliver', { sw: sw, port: port, host: peer.host });
        } else {
          f.status = 'ignored';
          ev(f, 'ignore', { sw: sw, port: port, host: peer.host });
        }
      } else {
        f.status = 'moving';
        ev(f, 'out', { sw: sw, port: port });
      }
    }

    s.frames.forEach(function (f0) {
      if (f0.status === 'delivered' || f0.status === 'ignored' || f0.status === 'dropped') {
        var done = copy(f0);
        done.change = null;
        out.frames.push(done);
        return;
      }
      var f = copy(f0);
      f.change = null;
      var w = f0.where;
      if (w.kind === 'host') {
        // rule 1: the host sends an untagged frame onto its access link
        var x = scene.hosts[w.host];
        f.where = { kind: 'link', link: w.host, from: w.host, fromPort: null, to: x.sw, toPort: x.port };
        f.status = 'moving';
        ev(f, 'send', { host: w.host });
        out.frames.push(f);
      } else if (w.kind === 'link') {
        // ingress (rules 2, 4, 5, 10), then forwarding inside that VLAN (rule 7)
        var sw = w.to, port = w.toPort;
        var ing = ingress(scene.ports[sw][port], f.tag);
        if (ing.drop) {
          f.where = { kind: 'switch', sw: sw, inPort: port, out: [], how: null };
          drop(f, sw, port, ing.drop);
          ev(f, 'drop-in', { sw: sw, port: port, reason: ing.drop, vlan: ing.vlan === undefined ? null : ing.vlan });
          out.frames.push(f);
          return;
        }
        var prevVlan = f.vlan;
        f.vlan = ing.vlan;
        if (ing.vlan !== f.srcVlan) f.leak = true;
        var fw = forward(scene, sw, ing.vlan, port, f.dst);
        f.where = { kind: 'switch', sw: sw, inPort: port, out: fw.ports, how: fw.how };
        ev(f, 'in', { sw: sw, port: port, how: ing.how, vlan: ing.vlan, from: prevVlan, fwd: fw.how, out: fw.ports });
        if (!fw.ports.length) {
          drop(f, sw, port, 'no-port');
          ev(f, 'drop-fwd', { sw: sw, vlan: ing.vlan });
        } else f.status = 'moving';
        out.frames.push(f);
      } else {
        // egress per port (rules 2, 3, 5), onto the next link; a flood makes one copy per port
        var many = w.out.length > 1;
        w.out.forEach(function (port) {
          var g = copy(f);
          if (many) g.id = f.id + '.' + port;
          var e = egress(scene.ports[w.sw][port], f.vlan);
          if (e.drop) {
            g.where = { kind: 'switch', sw: w.sw, inPort: w.inPort, out: [port], how: w.how };
            drop(g, w.sw, port, e.drop);
            ev(g, 'drop-out', { sw: w.sw, port: port, reason: e.drop, vlan: f.vlan });
          } else onto(g, w.sw, port, e.tag);
          out.frames.push(g);
        });
      }
    });
    return out;
  }

  var logic = {
    /** URM ch07 Primjer 5 (a): a trunk, both VLANs sent at once, native VLAN 1 on both ends. */
    defaults: { link: 'trunk', native1: 1, native2: 1, allow20: true, send: 'both' },
    steps: STEPS,
    links: LINKS,
    sends: SENDS,
    hosts: HOSTS,
    uplink: UPLINK,
    tpid: TPID,
    sizeUntagged: SIZE_UNTAGGED,
    tagBytes: TAG_BYTES,
    bcast: BCAST,
    initial: initial,
    step: step,

    parseLink: parseLink,
    validVid: validVid,
    inAllowed: inAllowed,
    without: without,
    ingress: ingress,
    egress: egress,
    frameLen: frameLen,
    sceneOf: sceneOf,
    portsInVlan: portsInVlan,
    macTable: macTable,
    forward: forward,
    norm: norm
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
