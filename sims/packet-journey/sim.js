/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for packet-journey: one click on example.com from a classroom laptop, the URM ch16 path (computer, access
   point, switch, router with NAT, the Internet, the server), phase by phase: DHCP, DNS, local or remote, ARP, TCP,
   TLS, HTTP, closing. One step: one message (or one DHCP / FIN pair) or one decision with nothing on the wire. The
   next phase follows from the state (caches, tables, open connections), never from the preset. Rules: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers; state is plain JSON. The device rules (netOf, decide,
   arpLookup, dnsLookup, switchAction, routerForward, natOut, natIn) are pure functions over plain data with no
   strings, so they can move to models/ unchanged. */
(function (root) {
  'use strict';

  // ── the scene (SPEC.md "Scene"; derived values marked there) ──

  var HOST = { ip: '192.168.1.23', prefix: 24, mac: 'aa:23' };
  var ROUTER = { lan: '192.168.1.1', pub: '198.51.100.7', lanMac: 'bb:01', wanMac: 'bb:02', nextMac: 'cc:01' };
  var SERVER = { name: 'example.com', ip: '203.0.113.10' };
  var BCAST_MAC = 'ff:ff:ff:ff:ff:ff';
  var TTL0 = 64, INTERNET_HOPS = 10, DNS_TTL = 300;
  var PORTS = { client: 51000, pub: 40001, dnsClient: 50500, dns: 53, dhcpClient: 68, dhcpServer: 67, http: 80, https: 443 };
  var PATHS = { out: ['PC', 'AP', 'SW', 'R'], wan: ['R', 'NET', 'SRV'], full: ['PC', 'AP', 'SW', 'R', 'NET', 'SRV'] };
  var CHAIN = ['dhcp', 'dns', 'local', 'arp', 'switch', 'router', 'nat', 'tcp', 'tls', 'http', 'close'];
  var OBJECTS = ['/', '/logo.png'];
  // the switch's table is learnt (switch learning is out of scope): the laptop behind the AP, the router on its port
  var SW_TABLE = { 'aa:23': 'ap', 'bb:01': 'router' };

  function norm(p) {
    p = p || {};
    var joined = p.joined !== false;
    var connOpen = joined && p.connOpen === true;
    // an open connection was made to the name's address, so the host still holds it (the browser keeps the
    // connection by name and port): DNS is absent with it
    return { scheme: p.scheme === 'https' ? 'https' : 'http', joined: joined, dnsWarm: p.dnsWarm === true || connOpen,
      arpWarm: p.arpWarm === true, connOpen: connOpen, close: p.close === true };
  }

  // ── the devices' rules ──

  function ipNum(ip) { return ip.split('.').reduce(function (a, x) { return a * 256 + Number(x); }, 0); }
  function ipStr(n) { return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }
  function maskOf(prefix) { return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0; }
  /** Rule 4: the network part, ip AND mask. */
  function netOf(ip, prefix) { return ipStr((ipNum(ip) & maskOf(prefix)) >>> 0); }

  /** Rule 4: the host ANDs its own and the destination address with its mask. Same network → the destination is the
      next hop; else the default gateway. */
  function decide(host, dstIp) {
    var own = netOf(host.ip, host.prefix), theirs = netOf(dstIp, host.prefix);
    var local = own === theirs;
    return { dst: dstIp, own: own, theirs: theirs, mask: ipStr(maskOf(host.prefix)), local: local, nextHop: local ? dstIp : host.gw };
  }
  /** Rule 5: the next hop's MAC from the ARP table, or null (a miss). */
  function arpLookup(arp, ip) { return Object.prototype.hasOwnProperty.call(arp, ip) ? arp[ip] : null; }
  /** Rule 2: the host's cache for a name, or null. */
  function dnsLookup(cache, name) { return Object.prototype.hasOwnProperty.call(cache, name) ? cache[name] : null; }
  /** Rule 6: the switch floods a broadcast or an unknown destination, else forwards to the one port. It never builds
      a frame: the caller sends the same frame on. */
  function switchAction(table, dstMac) {
    if (dstMac === BCAST_MAC || !Object.prototype.hasOwnProperty.call(table, dstMac)) return { flood: true, port: null };
    return { flood: false, port: table[dstMac] };
  }
  /** Rule 7: the router forwards: IP addresses unchanged, TTL − 1, both MACs new. NAT (rule 8) is separate. */
  function routerForward(pkt, srcMac, dstMac) {
    var out = copy(pkt);
    out.l2 = { src: srcMac, dst: dstMac };
    out.l3.ttl = pkt.l3.ttl - 1;
    return out;
  }
  function sock(ip, port) { return ip + ':' + port; }
  /** Rule 8, outbound: the row for this private socket, or a new one with the next public port. */
  function natOut(nat, priv) {
    for (var i = 0; i < nat.length; i++) if (nat[i].priv === priv) return { row: i, pub: nat[i].pub, created: false };
    return { row: nat.length, pub: sock(ROUTER.pub, PORTS.pub + nat.length), created: true };
  }
  /** Rule 8, inbound: the private socket for a public one, or null (no mapping: the router would drop it). */
  function natIn(nat, pub) {
    for (var i = 0; i < nat.length; i++) if (nat[i].pub === pub) return { row: i, priv: nat[i].priv };
    return null;
  }

  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function dportOf(p) { return p.scheme === 'https' ? PORTS.https : PORTS.http; }
  function openConn(s, p) {
    var dport = dportOf(p);
    return s.conns.filter(function (c) { return c.dst === SERVER.ip && c.dport === dport && c.state === 'established'; })[0] || null;
  }
  function inboundTtl() { return TTL0 - INTERNET_HOPS - 1; }

  // ── packets ──

  function pkt(kind, dir, path, l2, l3, l4, app, o) {
    o = o || {};
    return { kind: kind, dir: dir, path: path, cast: l2.dst === BCAST_MAC ? 'broadcast' : 'unicast', view: o.view || 'lan',
      l2: l2, l3: l3, l4: l4, app: app || null, nat: o.nat || null, changed: o.changed || [] };
  }
  var toR = { src: HOST.mac, dst: ROUTER.lanMac }, fromR = { src: ROUTER.lanMac, dst: HOST.mac };

  /** A TCP segment between the client and the server, on the client's link (SPEC.md "Where a header card shows a
      packet"). Outbound carries the NAT note for the source, inbound the reversed destination. */
  function tcpPkt(s, p, kind, dir, flags, app, natRow) {
    var cl = sock(HOST.ip, PORTS.client), dport = dportOf(p);
    var pub = s.nat[natRow] ? s.nat[natRow].pub : null;
    var out = dir === 'out';
    var path = out ? PATHS.full : PATHS.full.slice().reverse();
    return pkt(kind, dir, path, out ? toR : fromR,
      { src: out ? HOST.ip : SERVER.ip, dst: out ? SERVER.ip : HOST.ip, ttl: out ? TTL0 : inboundTtl() },
      { proto: 'tcp', sport: out ? PORTS.client : dport, dport: out ? dport : PORTS.client, flags: flags }, app,
      { nat: pub ? { field: out ? 'src' : 'dst', wire: cl, pub: pub } : null });
  }

  function capture(out, pk, filter) {
    out.capture.push({ n: out.capture.length + 1, filter: filter, kind: pk.kind, dir: pk.dir,
      src: pk.l3 ? pk.l3.src : pk.l2.src, dst: pk.l3 ? pk.l3.dst : pk.l2.dst,
      sport: pk.l4 ? pk.l4.sport : null, dport: pk.l4 ? pk.l4.dport : null, flags: pk.l4 && pk.l4.flags ? pk.l4.flags : null,
      app: pk.app ? copy(pk.app) : null });
    out.newCapture.push(out.capture.length - 1);
  }
  function filterOf(pk) { return pk.app ? pk.app.proto : 'tcp'; }
  function send(out, pk) {
    out.packets.push(pk);
    capture(out, pk, filterOf(pk));
    if (pk.path.indexOf('SW') >= 0) viaSwitch(out, pk);
  }

  function mark(out, phase, st) {
    if (out.chain[phase] === 'pending') { out.chain[phase] = st; out.chainChanged.push(phase); }
  }
  /** A frame crossed the switch: its phase is done at the first one (SPEC.md chain table). */
  function viaSwitch(out, pk) {
    out.sw = switchAction(SW_TABLE, pk.l2.dst);
    mark(out, 'switch', 'done');
  }

  // ── phases ──

  /** The phase after the next hop's MAC is known. */
  function afterArp(s, p) {
    if (s.target === 'resolver') return 'dns-q';
    return openConn(s, p) ? 'req' : 'syn';
  }

  var PHASE = {
    dhcp1: function (s, p, out) {
      var disc = pkt('dhcp-discover', 'out', PATHS.out, { src: HOST.mac, dst: BCAST_MAC }, { src: '0.0.0.0', dst: '255.255.255.255', ttl: TTL0 },
        { proto: 'udp', sport: PORTS.dhcpClient, dport: PORTS.dhcpServer }, { proto: 'dhcp', msg: 'discover' });
      var offer = pkt('dhcp-offer', 'in', PATHS.out.slice().reverse(), { src: ROUTER.lanMac, dst: BCAST_MAC }, { src: ROUTER.lan, dst: '255.255.255.255', ttl: TTL0 },
        { proto: 'udp', sport: PORTS.dhcpServer, dport: PORTS.dhcpClient }, { proto: 'dhcp', msg: 'offer', yiaddr: HOST.ip });
      send(out, disc); send(out, offer);
      out.next = 'dhcp2';
    },
    dhcp2: function (s, p, out) {
      var req = pkt('dhcp-request', 'out', PATHS.out, { src: HOST.mac, dst: BCAST_MAC }, { src: '0.0.0.0', dst: '255.255.255.255', ttl: TTL0 },
        { proto: 'udp', sport: PORTS.dhcpClient, dport: PORTS.dhcpServer }, { proto: 'dhcp', msg: 'request', requested: HOST.ip });
      var ack = pkt('dhcp-ack', 'in', PATHS.out.slice().reverse(), { src: ROUTER.lanMac, dst: BCAST_MAC }, { src: ROUTER.lan, dst: '255.255.255.255', ttl: TTL0 },
        { proto: 'udp', sport: PORTS.dhcpServer, dport: PORTS.dhcpClient },
        { proto: 'dhcp', msg: 'ack', yiaddr: HOST.ip, prefix: HOST.prefix, router: ROUTER.lan, dns: ROUTER.lan });
      send(out, req); send(out, ack);
      // rule 1: the ACK carries the address, mask, gateway and DNS server
      out.host = { ip: HOST.ip, prefix: HOST.prefix, gw: ack.app.router, dns: ack.app.dns };
      out.wrote.push({ table: 'host', key: 'addr' });
      mark(out, 'dhcp', 'done');
      out.next = 'click';
    },
    click: function (s, p, out) {
      // rule 1: a host that already had its address at the click never sends DHCP
      mark(out, 'dhcp', 'absent');
      // rule 2: the host's caches first; a hit sends nothing
      var hit = dnsLookup(s.dnsCache, SERVER.name);
      out.lookup = { table: 'dns', key: SERVER.name, hit: !!hit };
      if (hit) { out.dstIp = hit.ip; mark(out, 'dns', 'absent'); out.target = 'server'; }
      else out.target = 'resolver';
      out.next = 'decide';
    },
    decide: function (s, p, out) {
      var dst = s.target === 'resolver' ? s.host.dns : s.dstIp;
      var d = decide(s.host, dst);
      out.decision = d;
      mark(out, 'local', 'done');
      var mac = arpLookup(s.arp, d.nextHop);
      out.lookup = { table: 'arp', key: d.nextHop, hit: !!mac };
      if (mac) { mark(out, 'arp', 'absent'); out.next = afterArp(s, p); }
      else out.next = 'arp-req';
    },
    'arp-req': function (s, p, out) {
      var q = pkt('arp-req', 'out', PATHS.out, { src: HOST.mac, dst: BCAST_MAC }, null, null,
        { proto: 'arp', op: 'request', spa: HOST.ip, tpa: s.decision.nextHop });
      send(out, q);
      out.next = 'arp-rep';
    },
    'arp-rep': function (s, p, out) {
      var r = pkt('arp-rep', 'in', PATHS.out.slice().reverse(), fromR, null, null,
        { proto: 'arp', op: 'reply', spa: s.decision.nextHop, sha: ROUTER.lanMac, tpa: HOST.ip });
      send(out, r);
      out.arp[s.decision.nextHop] = ROUTER.lanMac;
      out.wrote.push({ table: 'arp', key: s.decision.nextHop });
      mark(out, 'arp', 'done');
      out.next = afterArp(s, p);
    },
    'dns-q': function (s, p, out) {
      var q = pkt('dns-q', 'out', PATHS.out, toR, { src: HOST.ip, dst: s.host.dns, ttl: TTL0 },
        { proto: 'udp', sport: PORTS.dnsClient, dport: PORTS.dns }, { proto: 'dns', qr: 'query', name: SERVER.name, type: 'A' });
      send(out, q);
      out.next = 'dns-a';
    },
    'dns-a': function (s, p, out) {
      var a = pkt('dns-a', 'in', PATHS.out.slice().reverse(), fromR, { src: s.host.dns, dst: HOST.ip, ttl: TTL0 },
        { proto: 'udp', sport: PORTS.dns, dport: PORTS.dnsClient },
        { proto: 'dns', qr: 'answer', name: SERVER.name, type: 'A', ip: SERVER.ip, ttl: DNS_TTL });
      send(out, a);
      // rule 3: the answer is stored with its TTL
      out.dnsCache[SERVER.name] = { ip: SERVER.ip, ttl: DNS_TTL };
      out.wrote.push({ table: 'dns', key: SERVER.name });
      out.dstIp = SERVER.ip;
      mark(out, 'dns', 'done');
      out.target = 'server';
      out.next = 'decide';
    },
    syn: function (s, p, out) {
      // rule 9: a new connection from the ephemeral port; the SYN stops at the router this step (its hop is next)
      var k = tcpPkt(s, p, 'syn', 'out', ['SYN'], null, -1);
      k.path = PATHS.out;
      send(out, k);
      out.conns.push({ sport: PORTS.client, dst: SERVER.ip, dport: dportOf(p), state: 'syn-sent' });
      out.wrote.push({ table: 'conn', key: PORTS.client });
      out.next = 'hop';
    },
    hop: function (s, p, out) {
      // rules 7, 8: the router forwards the SYN it holds: TTL − 1, both MACs new, NAPT rewrites the source
      var inPk = s.packets[0];
      var priv = sock(inPk.l3.src, inPk.l4.sport);
      var m = natOut(s.nat, priv);
      out.nat.push({ priv: priv, pub: m.pub });
      out.wrote.push({ table: 'nat', key: m.row });
      out.natUse = { row: m.row, dir: 'out', created: true };
      var fw = routerForward(inPk, ROUTER.wanMac, ROUTER.nextMac);
      var pub = m.pub.split(':');
      fw.l3.src = pub[0];
      fw.l4.sport = Number(pub[1]);
      fw.path = PATHS.wan;
      fw.view = 'wan';
      fw.kind = 'hop';
      fw.nat = { field: 'src', wire: priv, pub: m.pub };
      fw.changed = ['l2.src', 'l2.dst', 'l3.ttl', 'l3.src', 'l4.sport'];
      fw.was = { 'l2.src': inPk.l2.src, 'l2.dst': inPk.l2.dst, 'l3.ttl': inPk.l3.ttl, 'l3.src': inPk.l3.src, 'l4.sport': inPk.l4.sport };
      out.packets.push(fw);          // no capture line: the client's link never sees this side
      mark(out, 'router', 'done');
      mark(out, 'nat', 'done');
      out.next = 'synack';
    },
    synack: function (s, p, out) {
      var k = inbound(s, p, out, 'synack', ['SYN', 'ACK'], null);
      send(out, k);
      out.conns[0].state = 'established';
      out.wrote.push({ table: 'conn', key: PORTS.client });
      out.next = 'ack';
    },
    ack: function (s, p, out) {
      send(out, outbound(s, p, out, 'ack', ['ACK'], null));
      mark(out, 'tcp', 'done');
      out.next = p.scheme === 'https' ? 'tls1' : 'req';
    },
    tls1: function (s, p, out) {
      send(out, outbound(s, p, out, 'tls1', ['PSH', 'ACK'], { proto: 'tls', msg: 'client-hello' }));
      out.next = 'tls2';
    },
    tls2: function (s, p, out) {
      send(out, inbound(s, p, out, 'tls2', ['PSH', 'ACK'], { proto: 'tls', msg: 'server-hello' }));
      mark(out, 'tls', 'done');
      out.next = 'req';
    },
    req: function (s, p, out) {
      if (s.reqs === 0 && !s.handshake) {
        // rules 9, 10: the request goes on the connection that is already open: no handshake, no TLS handshake
        mark(out, 'tcp', 'absent');
        if (p.scheme === 'https') mark(out, 'tls', 'absent');
        out.lookup = { table: 'conn', key: PORTS.client, hit: true };
      }
      var path = OBJECTS[s.reqs] || OBJECTS[OBJECTS.length - 1];
      var get = { proto: 'http', msg: 'get', path: path, host: SERVER.name };
      var app = p.scheme === 'https' ? { proto: 'tls', msg: 'app-data', inner: get } : get;
      var k = outbound(s, p, out, 'req', ['PSH', 'ACK'], app);
      send(out, k);
      out.reqs = s.reqs + 1;
      out.next = 'resp';
    },
    resp: function (s, p, out) {
      var ok = { proto: 'http', msg: '200', path: OBJECTS[s.reqs - 1] };
      var app = p.scheme === 'https' ? { proto: 'tls', msg: 'app-data', inner: ok } : ok;
      send(out, inbound(s, p, out, 'resp', ['PSH', 'ACK'], app));
      if (s.reqs < requests(p)) { out.next = 'req'; return; }
      mark(out, 'http', 'done');
      // rule 12: the connection stays open unless the browser closes it
      if (p.close) out.next = 'fin-c';
      else { mark(out, 'close', 'absent'); out.next = null; }
    },
    'fin-c': function (s, p, out) {
      send(out, outbound(s, p, out, 'fin', ['FIN', 'ACK'], null));
      send(out, inbound(s, p, out, 'fin-ack', ['ACK'], null));
      out.conns[0].state = 'fin-wait-2';
      out.wrote.push({ table: 'conn', key: PORTS.client });
      out.next = 'fin-s';
    },
    'fin-s': function (s, p, out) {
      send(out, inbound(s, p, out, 'fin', ['FIN', 'ACK'], null));
      send(out, outbound(s, p, out, 'fin-ack', ['ACK'], null));
      out.conns[0].state = 'time-wait';
      out.wrote.push({ table: 'conn', key: PORTS.client });
      mark(out, 'close', 'done');
      out.next = null;
    }
  };

  /** A later packet of the connection, client → server, across the whole path: the router reuses the NAT row
      (rule 8) and forwards it (rule 7). The card shows it on the client's link. */
  function outbound(s, p, out, kind, flags, app) {
    var priv = sock(HOST.ip, PORTS.client);
    var m = natOut(out.nat, priv);
    if (m.created) { out.nat.push({ priv: priv, pub: m.pub }); out.wrote.push({ table: 'nat', key: m.row }); }
    out.natUse = { row: m.row, dir: 'out', created: m.created };
    mark(out, 'router', 'done');
    mark(out, 'nat', 'done');
    return tcpPkt(out, p, kind, 'out', flags, app, m.row);
  }
  /** Server → client across the whole path: the router finds the mapping and reverses it (rule 8). */
  function inbound(s, p, out, kind, flags, app) {
    // the server answers the socket it saw: the public one the router gave this connection
    var seen = natOut(out.nat, sock(HOST.ip, PORTS.client));
    var m = seen.created ? null : natIn(out.nat, seen.pub);
    out.natUse = { row: m ? m.row : null, dir: 'in', created: false };
    return tcpPkt(out, p, kind, 'in', flags, app, m ? m.row : -1);
  }

  function requests(p) { return p.connOpen ? 2 : 1; }

  // ── the controller's model ──

  var logic = {
    defaults: { scheme: 'http', joined: true, dnsWarm: false, arpWarm: false, connOpen: false, close: false },
    CHAIN: CHAIN,
    HOST: HOST,
    ROUTER: ROUTER,
    SERVER: SERVER,
    PORTS: PORTS,
    BCAST_MAC: BCAST_MAC,
    INTERNET_HOPS: INTERNET_HOPS,

    norm: norm,

    /** Steps for these params: replayed to the end (13, 8, 12, 17, 6 for the presets; at most 19). */
    steps: function (params) {
      var s = logic.initial(params), n = 0;
      while (s.next && n < 40) { n++; s = logic.step(s, n, params); }
      return n;
    },

    /** Step 0: nothing has happened; the caches and connections are what the params say. */
    initial: function (params) {
      var p = norm(params);
      var chain = {};
      CHAIN.forEach(function (k) { chain[k] = 'pending'; });
      if (p.scheme === 'http') chain.tls = 'unused';
      var dnsCache = {}, arp = {}, conns = [], nat = [];
      if (p.dnsWarm) dnsCache[SERVER.name] = { ip: SERVER.ip, ttl: DNS_TTL };
      if (p.arpWarm) arp[ROUTER.lan] = ROUTER.lanMac;
      if (p.connOpen) {
        conns.push({ sport: PORTS.client, dst: SERVER.ip, dport: dportOf(p), state: 'established' });
        nat.push({ priv: sock(HOST.ip, PORTS.client), pub: sock(ROUTER.pub, PORTS.pub) });
      }
      return {
        phase: null, next: p.joined ? 'click' : 'dhcp1',
        host: p.joined ? { ip: HOST.ip, prefix: HOST.prefix, gw: ROUTER.lan, dns: ROUTER.lan } : null,
        target: null, dstIp: null, decision: null, lookup: null,
        packets: [], sw: null, natUse: null,
        dnsCache: dnsCache, arp: arp, conns: conns, nat: nat,
        chain: chain, chainChanged: [], capture: [], newCapture: [], wrote: [],
        reqs: 0, handshake: false
      };
    },

    /** State after step n, from the state after step n − 1. */
    step: function (s, n, params) {
      var p = norm(params);
      if (!s.next) throw new Error('no step after the end');
      var out = copy(s);
      out.phase = s.next;
      out.packets = [];
      out.lookup = null;
      out.sw = null;
      out.natUse = null;
      out.chainChanged = [];
      out.newCapture = [];
      out.wrote = [];
      if (out.phase === 'syn') out.handshake = true;
      PHASE[out.phase](s, p, out);
      return out;
    },

    netOf: netOf,
    decide: decide,
    arpLookup: arpLookup,
    dnsLookup: dnsLookup,
    switchAction: switchAction,
    routerForward: routerForward,
    natOut: natOut,
    natIn: natIn,
    SW_TABLE: SW_TABLE
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
