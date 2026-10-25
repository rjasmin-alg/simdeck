/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for dhcp-relay: a client without an address on a subnet with no DHCP server gets one through a relay agent
   on its router. The relay takes the client's broadcast, writes its interface address into giaddr, and sends the
   message to the server as unicast; the server picks the scope that contains giaddr and answers to the relay, which
   delivers the answer on the client's segment. Rules and expected numbers: SPEC.md.
   One step: one message crosses one segment, and the device it reaches applies its rule (the relay rewrites, the
   server picks a scope, the client stores); or the client's timer fires (a retransmission, the link-local fallback).
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Times are seconds from the start.
   The page loads this as a classic script (window.SimLogic); node tests require() it.
   Shapes reused from sims/dhcp-dora/sim.js @ cb30ee5 (no models/dhcp-lease yet; no function copied verbatim): the
   DORA order, the message records (type, from, to, src, dst, cast, yiaddr) and the client's configured state
   (address, mask, router, DNS). New here:
   the relay rewrite (relayForward, relayDeliver), the scope chosen by giaddr (scopeFor) and the multi-segment path. */
(function (root) {
  'use strict';

  var BCAST = '255.255.255.255';
  var ZERO = '0.0.0.0';
  var MAC = '52:54:00:4a:1c:07';                                          // derived
  var SERVER = '192.168.1.99';                                            // URM ch14 "DHCP preko granica podmreža"
  var DNS = SERVER;                                                       // URM ch14 Primjer 2: option 6 = .99
  var MAX_HOPS = 16;                                                      // RFC 1542 §4.1.1
  var SEND_AT = [0, 4, 12, 28];                                           // first DISCOVER, then 4, 8, 16 s later (RFC 2131 §4.1, no ±1 s)
  var GIVE_UP = 60;                                                       // the next wait (32 s) ends here: link-local (derived, check)
  var LINK_LOCAL = '169.254.28.7';                                        // 169.254/16 (RFC 3927); last two MAC bytes, derived
  var LINK_LOCAL_MASK = '255.255.0.0';

  /** The server's scopes (URM ch12 Primjer 1 address table; ch14 Primjer 2 for .116; .20 and .100 derived). The
      server's own interface is in `admin` (Uprava). */
  var SCOPES = [
    { id: 'branch', net: '192.168.1.112', prefix: 28, mask: '255.255.255.240', router: '192.168.1.113', first: '192.168.1.116', last: '192.168.1.126' },
    { id: 'sales', net: '192.168.1.0', prefix: 26, mask: '255.255.255.192', router: '192.168.1.1', first: '192.168.1.20', last: '192.168.1.62' },
    { id: 'admin', net: '192.168.1.96', prefix: 28, mask: '255.255.255.240', router: '192.168.1.97', first: '192.168.1.100', last: '192.168.1.110' }
  ];

  /** Where the client sits: its segment, the router at the subnet boundary (the relay, when on) and the lanes from
      left to right, each a device on the path (URM ch12 Primjer 1: R2 .113 and .138, R1 .137, .1 and .97). */
  var PLACES = {
    branch: { scope: 'branch', relay: { id: 'R2', ip: '192.168.1.113' }, lanes: ['C', 'R2', 'R1', 'S'], via: ['R1'] },
    sales: { scope: 'sales', relay: { id: 'R1', ip: '192.168.1.1' }, lanes: ['C', 'R1', 'S'], via: [] },
    admin: { scope: 'admin', relay: null, lanes: ['C', 'S'], via: [] }
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── addresses ──

  function toInt(ip) { return ip.split('.').reduce(function (a, b) { return a * 256 + Number(b); }, 0); }
  /** Is ip inside net/prefix? */
  function inSubnet(ip, net, prefix) {
    var size = Math.pow(2, 32 - prefix);
    return Math.floor(toInt(ip) / size) === Math.floor(toInt(net) / size);
  }
  function scopeById(id) { for (var i = 0; i < SCOPES.length; i++) if (SCOPES[i].id === id) return SCOPES[i]; return null; }

  /** Rule 4 (RFC 2131 §4.3.1): the scope for a request. giaddr ≠ 0: the scope that contains giaddr; else the scope of
      the interface the server received it on. null when no scope matches. */
  function scopeFor(giaddr, recvIp) {
    var key = giaddr && giaddr !== ZERO ? giaddr : recvIp;
    for (var i = 0; i < SCOPES.length; i++) if (inSubnet(key, SCOPES[i].net, SCOPES[i].prefix)) return SCOPES[i];
    return null;
  }

  // ── the relay agent (rules 3, 5, 6) ──

  /** Rule 3 (RFC 2131 §4.1, RFC 1542 §4.1.1): a client message the relay received on interface ifIp goes on to the
      server as unicast, port 67. giaddr is written only when it is 0; hops goes up by one; a message that arrives
      with hops over MAX_HOPS is dropped (null). The source address is the relay's receiving interface (the RFCs leave it open; check). */
  function relayForward(m, ifIp, server) {
    if (m.hops > MAX_HOPS) return null;
    var out = clone(m);
    var wrote = [];
    if (m.giaddr === ZERO) { out.giaddr = ifIp; wrote.push('giaddr'); }
    out.hops = m.hops + 1;
    wrote.push('hops');
    out.src = ifIp + ':67';
    out.dst = server + ':67';
    out.cast = 'unicast';
    out.wrote = wrote;
    return out;
  }

  /** Rule 6 (RFC 1542 §4.1.2): a server reply the relay received at giaddr goes on the client's segment to port 68:
      broadcast when the client set the BROADCAST bit, else unicast to yiaddr (at chaddr). Fields stay as they are. */
  function relayDeliver(m, ifIp) {
    var out = clone(m);
    out.src = ifIp + ':67';
    out.dst = (m.flagB ? BCAST : m.yiaddr) + ':68';
    out.cast = m.flagB ? 'broadcast' : 'unicast';
    out.wrote = [];
    return out;
  }

  // ── the server (rules 4, 5, 8) ──

  /** Where the server sends a reply (RFC 2131 §4.1): to the relay at giaddr, port 67, as unicast when giaddr ≠ 0;
      else on its own segment to port 68, broadcast with the BROADCAST bit, unicast to yiaddr without it. */
  function replyTo(m) {
    if (m.giaddr !== ZERO) return { dst: m.giaddr + ':67', cast: 'unicast' };
    return m.flagB ? { dst: BCAST + ':68', cast: 'broadcast' } : { dst: m.yiaddr + ':68', cast: 'unicast' };
  }

  /** The server's answer to a DISCOVER or REQUEST received on its interface: { scope, reply } or null (no scope). */
  function serverAnswer(m, binding) {
    var sc = scopeFor(m.giaddr, SERVER);
    if (!sc) return null;
    var type = m.type === 'DISCOVER' ? 'OFFER' : 'ACK';
    var yi = m.type === 'DISCOVER' ? (binding ? binding.addr : sc.first) : m.o50;
    var r = { type: type, giaddr: m.giaddr, hops: m.hops, yiaddr: yi, flagB: m.flagB, chaddr: m.chaddr,
      o54: SERVER, opts: { mask: sc.mask, router: sc.router, dns: DNS }, src: SERVER + ':67' };
    var to = replyTo(r);
    r.dst = to.dst;
    r.cast = to.cast;
    r.wrote = ['yiaddr'];
    return { scope: sc.id, reply: r };
  }

  // ── the client (rules 1, 7, 9) ──

  function clientRequest(type, o50) {
    var m = { type: type, giaddr: ZERO, hops: 0, yiaddr: ZERO, flagB: true, chaddr: MAC, src: ZERO + ':68', dst: BCAST + ':67', cast: 'broadcast', wrote: [] };
    if (o50) { m.o50 = o50; m.o54 = SERVER; }
    return m;
  }

  // ── the run ──

  /** Put a message on segment from → to. lost: the receiver does not take it (✕). */
  function cross(s, m, from, to, lost) {
    m.n = s.msgs.length + 1;
    m.t = s.t;
    m.from = from;
    m.to = to;
    m.via = from !== 'C' && to !== 'C' ? PLACES[s.p.client].via.slice() : [];
    m.lost = !!lost;
    m.attempt = s.attempts;
    s.msgs.push(m);
    return m;
  }

  function sendFromClient(s, m) {
    var pl = PLACES[s.p.client];
    var to = pl.relay ? pl.relay.id : 'S';
    var r = { msg: null, did: null };
    if (to === 'S') {                                                      // same subnet: the server hears it directly
      var e = cross(s, m, 'C', 'S', !s.p.server);
      r.msg = e.n;
      r.did = s.p.server ? serverTakes(s, e) : 'serverDown';
      return r;
    }
    var d = cross(s, m, 'C', to, !s.p.relay);
    r.msg = d.n;
    if (!s.p.relay) { r.did = 'noRelay'; return r; }                       // rule 2: a router does not forward broadcasts
    s.pending = { kind: 'relayOut', msg: d.n };
    r.did = 'relayTakes';
    return r;
  }

  /** The server took request e: scope, binding, and the reply waiting to go (rules 4, 5). */
  function serverTakes(s, e) {
    var ans = serverAnswer(e, s.binding);
    s.scope = ans.scope;
    if (ans.reply.type === 'ACK') s.binding = { addr: ans.reply.yiaddr, mac: e.chaddr };
    s.pending = { kind: 'reply', reply: ans.reply };
    return ans.reply.type === 'OFFER' ? 'offer' : 'ack';
  }

  /** When nothing came back: the next DISCOVER, or the fallback (rule 9). */
  function waitAgain(s) {
    s.pending = s.attempts < SEND_AT.length ? { kind: 'resend', at: SEND_AT[s.attempts] } : { kind: 'giveUp', at: GIVE_UP };
  }

  /** The client receives an OFFER (asks for it next) or an ACK (stores address, mask, router and DNS: rule 8). */
  function clientTakes(s, m) {
    if (m.type === 'OFFER') {
      s.phase = 'REQUESTING';
      s.offer = m.yiaddr;
      s.pending = { kind: 'request' };
      return { did: 'offerIn', type: 'OFFER', msg: m.n, addr: m.yiaddr };
    }
    s.phase = 'BOUND';
    s.client = { ip: m.yiaddr, mask: m.opts.mask, gw: m.opts.router, dns: m.opts.dns };
    return { did: 'configured', type: 'ACK', msg: m.n, addr: m.yiaddr };
  }

  function msgOf(s, n) { for (var i = 0; i < s.msgs.length; i++) if (s.msgs[i].n === n) return s.msgs[i]; return null; }

  var logic = {
    BCAST: BCAST, ZERO: ZERO, MAC: MAC, SERVER: SERVER, DNS: DNS, MAX_HOPS: MAX_HOPS, SEND_AT: SEND_AT, GIVE_UP: GIVE_UP,
    LINK_LOCAL: LINK_LOCAL, LINK_LOCAL_MASK: LINK_LOCAL_MASK, SCOPES: SCOPES, PLACES: PLACES,

    /** Parameter defaults. */
    defaults: { client: 'branch', relay: true, server: true },

    /** Steps for these params: the run replayed to its end. */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (!s.done && n < 40) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** State at step 0: the client has no address, nothing has been sent. */
    initial: function (p) {
      return {
        t: 0,
        p: { client: p.client, relay: !!p.relay, server: !!p.server },
        phase: 'INIT',
        msgs: [],
        client: null,
        attempts: 0,
        scope: null,
        binding: null,
        offer: null,
        pending: { kind: 'resend', at: 0 },
        last: null,
        done: false
      };
    },

    /** State after step n, from the state after step n - 1: one message crosses one segment, or the client's timer fires. */
    step: function (prev, n, p) {
      var s = clone(prev);
      var pe = s.pending, r, m;
      s.pending = null;
      if (pe.kind === 'resend') {                                          // rule 1; rule 9 for the second and later
        s.t = pe.at;
        s.attempts++;
        s.phase = 'SELECTING';
        r = sendFromClient(s, clientRequest('DISCOVER'));
        r.type = 'DISCOVER';
        r.attempt = s.attempts;
        if (r.did === 'noRelay' || r.did === 'serverDown') waitAgain(s);
      } else if (pe.kind === 'request') {                                  // rule 7: same path as the DISCOVER
        r = sendFromClient(s, clientRequest('REQUEST', s.offer));
        r.type = 'REQUEST';
        r.addr = s.offer;
      } else if (pe.kind === 'relayOut') {                                 // rule 3
        var pl = PLACES[s.p.client];
        var fwd = relayForward(msgOf(s, pe.msg), pl.relay.ip, SERVER);
        m = cross(s, fwd, pl.relay.id, 'S', !s.p.server);
        r = { did: s.p.server ? 'relayed' : 'lostAtServer', type: m.type, msg: m.n, relay: pl.relay.id };
        if (s.p.server) r.server = serverTakes(s, m);
        else waitAgain(s);
      } else if (pe.kind === 'reply') {                                    // rules 5, 6, 7
        var rp = pe.reply, pl2 = PLACES[s.p.client];
        if (pl2.relay) {
          m = cross(s, rp, 'S', pl2.relay.id);
          s.pending = { kind: 'relayIn', msg: m.n };
          r = { did: 'toRelay', type: m.type, msg: m.n, relay: pl2.relay.id };
        } else {
          m = cross(s, rp, 'S', 'C');
          r = clientTakes(s, m);
        }
      } else if (pe.kind === 'relayIn') {                                  // rule 6
        var pl3 = PLACES[s.p.client];
        m = cross(s, relayDeliver(msgOf(s, pe.msg), pl3.relay.ip), pl3.relay.id, 'C');
        r = clientTakes(s, m);
      } else {                                                             // rule 9: give up, link-local
        s.t = pe.at;
        s.phase = 'LINKLOCAL';
        s.client = { ip: LINK_LOCAL, mask: LINK_LOCAL_MASK, gw: null, dns: null };
        r = { did: 'linkLocal', attempts: s.attempts };
      }
      r.t = s.t;
      s.last = r;
      s.n = n;
      s.done = !s.pending;
      return s;
    },

    scopeFor: scopeFor,
    scopeById: scopeById,
    inSubnet: inSubnet,
    relayForward: relayForward,
    relayDeliver: relayDeliver,
    replyTo: replyTo,
    serverAnswer: serverAnswer,
    msg: msgOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
