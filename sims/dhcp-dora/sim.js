/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for dhcp-dora: one client gets an address by DISCOVER, OFFER, REQUEST, ACK, keeps it by renewing at T1 and
   rebinding at T2, and loses it at expiry. One or two servers; a server can go down, the client can leave.
   Rules and expected numbers: SPEC.md. One step is one protocol event, checked in this order: (1) a scripted event
   due at the current time, (2) the oldest message in flight is delivered and its receivers react, (3) time moves to
   the next timer (scripted event, client timer, server lease expiry) and that one fires.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. Times are seconds from the start.
   The page loads this as a classic script (window.SimLogic); node tests require() it. The timer functions and the
   server and client reactions take plain data and hold no strings, so they can move to models/ (dhcp-lease)
   unchanged when the other DHCP pages reuse them. */
(function (root) {
  'use strict';

  var BCAST = '255.255.255.255';
  var CLIENT = { id: 'C', mac: '52:54:00:37:ea:d6', name: 'democli1' }; // UL ch18, "Što poslužitelj pamti"
  var OPTS = { mask: '255.255.255.0', router: '192.168.180.1', dns: '192.168.180.1' };
  var NEW_DNS = '192.168.180.53';                                          // the option change (derived)
  var POOL_A = ['192.168.180.100', '192.168.180.101', '192.168.180.102'];
  var POOL_B = ['192.168.180.150', '192.168.180.151', '192.168.180.152'];
  var LEASES = [600, 7200, 691200];                                         // 600 s, 2 h, 8 days
  var DOWN_BEFORE = 10;                                                     // a server fails 10 s before T1 or T2

  // ── timers (RFC 2131 §4.4.5): exact, no fuzz ──

  /** T1, T2 and expiry of a lease that starts at `start`. */
  function timers(start, lease) {
    return { t1: start + 0.5 * lease, t2: start + 0.875 * lease, exp: start + lease };
  }
  /** When an unanswered REQUEST is sent again: half the time left to the next timer, at least 60 s; null if that is
      not before the next timer (the model retries once per state). */
  function retryAt(now, next) {
    var at = now + Math.max(60, (next - now) / 2);
    return at < next ? at : null;
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function server(s, id) { for (var i = 0; i < s.servers.length; i++) if (s.servers[i].id === id) return s.servers[i]; return null; }
  function serverByIp(s, ip) { for (var i = 0; i < s.servers.length; i++) if (s.servers[i].ip === ip) return s.servers[i]; return null; }
  function bindingOf(srv, mac) { for (var i = 0; i < srv.leases.length; i++) if (srv.leases[i].mac === mac) return srv.leases[i]; return null; }
  function msg(s, n) { for (var i = 0; i < s.msgs.length; i++) if (s.msgs[i].n === n) return s.msgs[i]; return null; }

  /** The address a server would offer this client: its current binding, else the first pool address nobody else holds
      or has been offered; null when the pool is used up. */
  function freeAddr(srv, mac) {
    var b = bindingOf(srv, mac);
    if (b) return b.addr;
    for (var i = 0; i < srv.pool.length; i++) {
      var a = srv.pool[i];
      var taken = srv.leases.some(function (l) { return l.addr === a; }) || (srv.offered && srv.offered.addr === a && srv.offered.mac !== mac);
      if (!taken) return a;
    }
    return null;
  }

  /** A failover partner keeps a copy of the other's bindings (hot standby: it answers only while the primary is down). */
  function partnerOf(s, srv) {
    for (var i = 0; i < s.servers.length; i++) {
      var o = s.servers[i];
      if (o.id !== srv.id && (o.partner || srv.partner)) return o;
    }
    return null;
  }
  function replicate(s, srv) {
    var p = partnerOf(s, srv);
    if (!p || !p.up) return null;
    p.leases = clone(srv.leases);
    return p.id;
  }

  // ── messages ──

  /** Put a message on the wire. Receivers that are down lose it; with none left it is lost at once. */
  function send(s, m) {
    m.n = s.msgs.length + 1;
    m.t = s.t;
    m.lost = m.to.filter(function (id) { return id !== 'C' && !server(s, id).up; });
    m.got = [];
    m.ignored = [];
    m.react = {};
    m.state = m.lost.length === m.to.length ? 'lost' : 'flight';
    s.msgs.push(m);
    s.rows.push({ kind: 'msg', n: m.n });
    if (m.state === 'flight') s.queue.push(m.n);
    return m;
  }
  function note(s, lane, what, extra) {
    var r = { kind: 'note', t: s.t, lane: lane, what: what };
    if (extra) Object.keys(extra).forEach(function (k) { r[k] = extra[k]; });
    s.rows.push(r);
    return r;
  }
  function optsOf(srv) { return { mask: srv.opts.mask, router: srv.opts.router, dns: srv.opts.dns }; }

  // client → servers
  function discover(s, cause) {
    return send(s, { type: 'DISCOVER', from: 'C', to: s.servers.map(function (x) { return x.id; }), bcast: true, cause: cause,
      src: '0.0.0.0:68', dst: BCAST + ':67', f: { ciaddr: '0.0.0.0', yiaddr: '0.0.0.0', chaddr: CLIENT.mac, flagB: s.p.bcastFlag } });
  }
  function requestSelecting(s, srv, addr) {
    return send(s, { type: 'REQUEST', kind: 'selecting', from: 'C', to: s.servers.map(function (x) { return x.id; }), bcast: true, cause: 'offer',
      src: '0.0.0.0:68', dst: BCAST + ':67', f: { ciaddr: '0.0.0.0', yiaddr: '0.0.0.0', chaddr: CLIENT.mac, flagB: s.p.bcastFlag, o50: addr, o54: srv.ip } });
  }
  function requestRenew(s, cause) {
    var srv = server(s, s.client.serverId);
    return send(s, { type: 'REQUEST', kind: 'renewing', from: 'C', to: [srv.id], bcast: false, cause: cause,
      src: s.client.addr + ':68', dst: srv.ip + ':67', f: { ciaddr: s.client.addr, yiaddr: '0.0.0.0', chaddr: CLIENT.mac, flagB: false } });
  }
  function requestRebind(s, cause) {
    return send(s, { type: 'REQUEST', kind: 'rebinding', from: 'C', to: s.servers.map(function (x) { return x.id; }), bcast: true, cause: cause,
      src: s.client.addr + ':68', dst: BCAST + ':67', f: { ciaddr: s.client.addr, yiaddr: '0.0.0.0', chaddr: CLIENT.mac, flagB: false } });
  }
  function release(s) {
    var srv = server(s, s.client.serverId);
    return send(s, { type: 'RELEASE', from: 'C', to: [srv.id], bcast: false, cause: 'leave',
      src: s.client.addr + ':68', dst: srv.ip + ':67', f: { ciaddr: s.client.addr, yiaddr: '0.0.0.0', chaddr: CLIENT.mac, flagB: false, o54: srv.ip } });
  }
  // server → client. OFFER and ACK to a client without an address are broadcast when it set the BROADCAST flag, else
  // unicast to yiaddr / chaddr; to a client with an address (ciaddr) they are unicast to it (RFC 2131 §4.1).
  function reply(s, srv, type, addr, ciaddr) {
    var bcast = type === 'NAK' || (!ciaddr && s.p.bcastFlag);
    var f = { ciaddr: ciaddr || '0.0.0.0', yiaddr: type === 'NAK' ? '0.0.0.0' : addr, chaddr: CLIENT.mac, flagB: !ciaddr && s.p.bcastFlag, o54: srv.ip };
    if (type !== 'NAK') { f.o51 = s.p.lease; f.opts = optsOf(srv); }
    return send(s, { type: type, from: srv.id, to: ['C'], bcast: bcast, cause: 'reply',
      src: srv.ip + ':67', dst: (bcast ? BCAST : ciaddr || addr) + ':68', f: f });
  }

  // ── reactions ──

  /** A server receives a client message. Returns what it did: 'offer', 'ack', 'nak', 'freed', 'released',
      'standby', 'full', 'silent' (no record of this lease), or null (not for it). */
  function serverHears(s, srv, m) {
    var mac = m.f.chaddr, b;
    if (m.type === 'DISCOVER') {                                           // rule 2
      var primary = partnerOf(s, srv);
      if (srv.partner && primary && primary.up) return { srv: srv.id, did: 'standby' };
      var addr = freeAddr(srv, mac);
      if (!addr) return { srv: srv.id, did: 'full' };
      srv.offered = { addr: addr, mac: mac };
      return { srv: srv.id, did: 'offer', addr: addr, reply: reply(s, srv, 'OFFER', addr).n };
    }
    if (m.type === 'REQUEST' && m.kind === 'selecting') {                  // rule 4
      if (m.f.o54 === srv.ip) {
        b = bindingOf(srv, mac);
        if (b) { b.addr = m.f.o50; b.expires = s.t + s.p.lease; } else srv.leases.push({ addr: m.f.o50, mac: mac, expires: s.t + s.p.lease });
        srv.offered = null;
        return { srv: srv.id, did: 'ack', addr: m.f.o50, copy: replicate(s, srv), reply: reply(s, srv, 'ACK', m.f.o50).n };
      }
      if (srv.offered && srv.offered.mac === mac) {
        var freed = srv.offered.addr;
        srv.offered = null;
        return { srv: srv.id, did: 'freed', addr: freed };
      }
      return null;
    }
    if (m.type === 'REQUEST') {                                            // rules 7, 8
      b = bindingOf(srv, mac);
      if (b && b.addr === m.f.ciaddr) {
        b.expires = s.t + s.p.lease;
        return { srv: srv.id, did: 'ack', addr: b.addr, copy: replicate(s, srv), reply: reply(s, srv, 'ACK', b.addr, m.f.ciaddr).n };
      }
      if (m.kind === 'renewing') return { srv: srv.id, did: 'nak', reply: reply(s, srv, 'NAK', null, m.f.ciaddr).n };
      return { srv: srv.id, did: 'silent' };
    }
    if (m.type === 'RELEASE') {                                            // rule 11
      b = bindingOf(srv, mac);
      if (!b) return null;
      srv.leases = srv.leases.filter(function (l) { return l !== b; });
      return { srv: srv.id, did: 'released', addr: b.addr, copy: replicate(s, srv) };
    }
    return null;
  }

  function bind(s, m) {
    var c = s.client, srv = server(s, m.from);
    var how = c.state === 'REQUESTING' ? 'new' : c.state === 'RENEWING' ? 'renew' : 'rebind';
    var tm = timers(s.t, m.f.o51);
    var before = c.opts;
    c.state = 'BOUND';
    c.addr = m.f.yiaddr;
    c.serverId = srv.id;
    c.leaseStart = s.t;
    c.lease = m.f.o51;
    c.t1 = tm.t1; c.t2 = tm.t2; c.exp = tm.exp;
    c.retry = null; c.retried = false;
    c.opts = clone(m.f.opts);
    c.acks++;
    return { how: how, addr: c.addr, srv: srv.id, dnsChanged: !!(before && before.dns !== c.opts.dns), dns: c.opts.dns };
  }

  /** The client receives a server message. */
  function clientHears(s, m) {
    var c = s.client;
    if (c.state === 'OFF') { m.ignored.push('C'); return { did: 'off' }; }
    if (m.type === 'OFFER') {
      if (c.state !== 'SELECTING') { m.ignored.push('C'); return { did: 'lateOffer', srv: m.from, addr: m.f.yiaddr }; } // rule 3
      var srv = server(s, m.from);
      c.state = 'REQUESTING';
      c.serverId = srv.id;
      return { did: 'choose', srv: srv.id, addr: m.f.yiaddr, reply: requestSelecting(s, srv, m.f.yiaddr).n };
    }
    if (m.type === 'ACK') {
      var waiting = (c.state === 'REQUESTING' && c.serverId === m.from) || c.state === 'RENEWING' || c.state === 'REBINDING';
      if (!waiting) { m.ignored.push('C'); return { did: 'ackIgnored', srv: m.from }; }
      var r = bind(s, m);
      r.did = 'bound';
      return r;
    }
    if (m.type === 'NAK') {                                                // rule 11
      if (c.state !== 'REQUESTING' && c.state !== 'RENEWING' && c.state !== 'REBINDING') { m.ignored.push('C'); return { did: 'ackIgnored', srv: m.from }; }
      var lost = c.addr;
      toInit(s);
      c.startAt = s.t;
      return { did: 'nak', srv: m.from, addr: lost };
    }
    return null;
  }

  function toInit(s) {
    var c = s.client;
    c.state = 'INIT';
    c.addr = null; c.serverId = null; c.leaseStart = null; c.lease = null; c.t1 = null; c.t2 = null; c.exp = null;
    c.retry = null; c.retried = false; c.opts = null; c.startAt = null;
  }

  // ── time ──

  /** The client's next timer: { at, what } or null. */
  function clientNext(s) {
    var c = s.client;
    switch (c.state) {
      case 'INIT': return c.startAt === null ? null : { at: c.startAt, what: 'start' };
      case 'BOUND': return { at: c.t1, what: 't1' };
      case 'RENEWING': return c.retry !== null && !c.retried ? { at: c.retry, what: 'retry' } : { at: c.t2, what: 't2' };
      case 'REBINDING': return c.retry !== null && !c.retried ? { at: c.retry, what: 'retry' } : { at: c.exp, what: 'expiry' };
      default: return null;                                                // SELECTING, REQUESTING wait for messages; OFF
    }
  }
  /** The earliest server lease expiry on a server that is up: { at, srv, addr } or null (server order breaks ties). */
  function serverNext(s) {
    var best = null;
    s.servers.forEach(function (srv) {
      if (!srv.up) return;
      srv.leases.forEach(function (l) { if (!best || l.expires < best.at) best = { at: l.expires, srv: srv.id, addr: l.addr }; });
    });
    return best;
  }
  function eventNext(s) {
    for (var i = 0; i < s.events.length; i++) if (!s.events[i].done) return s.events[i];
    return null;
  }

  function applyEvent(s, e) {
    e.done = true;
    var c = s.client;
    if (e.kind === 'down') {
      server(s, e.srv).up = false;
      note(s, e.srv, 'down');
      return { did: 'down', srv: e.srv };
    }
    if (e.kind === 'opt') {
      s.servers.forEach(function (srv) { srv.opts.dns = NEW_DNS; });
      note(s, s.servers[0].id, 'opt', { dns: NEW_DNS });
      return { did: 'opt', dns: NEW_DNS, old: OPTS.dns };
    }
    // the client leaves: switched off (nothing sent), or it releases the lease first
    if (c.state !== 'BOUND') { note(s, 'C', 'off'); c.state = 'OFF'; return { did: 'off', addr: null }; }
    var addr = c.addr, srv = c.serverId;
    if (e.kind === 'release') {
      var m = release(s);
      c.state = 'OFF';
      return { did: 'release', addr: addr, srv: srv, msg: m.n, lost: m.state === 'lost' };
    }
    note(s, 'C', 'off', { addr: addr });
    c.state = 'OFF';
    var b = bindingOf(server(s, srv), CLIENT.mac);
    return { did: 'off', addr: addr, srv: srv, until: b ? b.expires : null };
  }

  function clientTimer(s, what) {
    var c = s.client, m;
    if (what === 'start') {
      c.startAt = null;
      m = discover(s, s.client.acks || s.restarted ? 'again' : 'start');
      c.state = 'SELECTING';
      if (m.state === 'lost') { toInit(s); return { did: 'discover', msg: m.n, lost: true }; }  // rule 10: nobody up
      return { did: 'discover', msg: m.n, lost: false };
    }
    if (what === 't1') {                                                   // rule 7
      c.state = 'RENEWING';
      m = requestRenew(s, 't1');
      c.retry = retryAt(s.t, c.t2); c.retried = false;
      return { did: 'renew', msg: m.n, lost: m.state === 'lost', retry: c.retry };
    }
    if (what === 't2') {                                                   // rule 8
      c.state = 'REBINDING';
      m = requestRebind(s, 't2');
      c.retry = retryAt(s.t, c.exp); c.retried = false;
      return { did: 'rebind', msg: m.n, lost: m.state === 'lost', lostTo: m.lost, retry: c.retry };
    }
    if (what === 'retry') {                                                // rule 9
      c.retried = true;
      m = c.state === 'RENEWING' ? requestRenew(s, 'retry') : requestRebind(s, 'retry');
      return { did: 'retry', phase: c.state, msg: m.n, lost: m.state === 'lost', lostTo: m.lost };
    }
    // expiry: rule 10
    var addr = c.addr;
    toInit(s);
    s.restarted = true;
    s.lostAddr = addr;
    m = discover(s, 'expiry');
    c.state = 'SELECTING';
    if (m.state === 'lost') toInit(s);
    return { did: 'expire', addr: addr, msg: m.n, lost: m.state === 'lost' };
  }

  function serverExpire(s, x) {
    var srv = server(s, x.srv);
    srv.leases = srv.leases.filter(function (l) { return !(l.addr === x.addr && l.expires === x.at); });
    note(s, srv.id, 'expire', { addr: x.addr });
    return { did: 'serverExpire', srv: srv.id, addr: x.addr, copy: replicate(s, srv) };
  }

  function deliver(s) {
    var n = s.queue.shift();
    var m = msg(s, n);
    m.state = 'done';
    if (m.to[0] === 'C') {
      m.got = ['C'];
      var selecting = m.type === 'OFFER' && s.client.state === 'SELECTING';
      var r = clientHears(s, m) || { did: 'none' };
      r.msg = n;
      m.react.C = r.did;
      // offers answer the same DISCOVER and arrive together: the client takes the first, the others come too late
      if (selecting) {
        r.late = [];
        s.queue.slice().forEach(function (k) {
          var o = msg(s, k);
          if (o.type !== 'OFFER') return;
          s.queue.splice(s.queue.indexOf(k), 1);
          o.state = 'done';
          o.got = ['C'];
          o.ignored.push('C');
          o.react.C = 'lateOffer';
          r.late.push({ srv: o.from, addr: o.f.yiaddr, msg: k });
        });
      }
      return r;
    }
    var acts = [];
    m.to.forEach(function (id) {
      var srv = server(s, id);
      if (!srv.up) { if (m.lost.indexOf(id) < 0) m.lost.push(id); return; }
      m.got.push(id);
      var a = serverHears(s, srv, m);
      if (a) { acts.push(a); m.react[id] = a.did; if (a.did === 'freed') m.freed = a.addr; }
      else m.ignored.push(id);
      if (a && (a.did === 'standby' || a.did === 'full' || a.did === 'silent')) m.ignored.push(id);
    });
    // a DISCOVER nobody offers to leaves the client in INIT (rule 10)
    var offered = acts.some(function (a) { return a.did === 'offer'; });
    if (m.type === 'DISCOVER' && !offered) toInit(s);
    return { did: 'delivered', type: m.type, kind: m.kind || null, msg: n, acts: acts };
  }

  /** Nothing can happen any more, or the demo has made its point (SPEC.md "End of a run"). */
  function finished(s) {
    if (s.queue.length) return false;
    var c = s.client;
    var pending = eventNext(s);
    if (s.last.did === 'bound' && c.acks >= 2 && !pending) return true;   // kept (or regained) the address
    if (c.state === 'INIT' && c.startAt === null && !pending) return true; // no offer: stays without an address
    return !pending && !clientNext(s) && !serverNext(s);
  }

  var logic = {
    CLIENT: CLIENT,
    OPTS: OPTS,
    NEW_DNS: NEW_DNS,
    LEASES: LEASES,
    BCAST: BCAST,

    /** Parameter defaults. */
    defaults: { lease: 600, serverB: 'none', failAt: 'none', leave: 'stay', optChange: false, bcastFlag: true },

    /** Steps for these params: the run replayed to its end. */
    steps: function (p) {
      var s = logic.initial(p), n = 0;
      while (!s.done && n < 60) { n++; s = logic.step(s, n, p); }
      return n;
    },

    /** Scripted events of a run, in time order (SPEC.md "Params"). */
    events: function (p) {
      var L = p.lease, ev = [];
      if (p.optChange && p.failAt === 'none') ev.push({ at: L / 8, kind: 'opt' }); // one story at a time
      if (p.leave !== 'stay') ev.push({ at: L * 5 / 12, kind: p.leave === 'release' ? 'release' : 'off' });
      if (p.failAt === 't1') ev.push({ at: 0.5 * L - DOWN_BEFORE, kind: 'down', srv: 'A' });
      if (p.failAt === 't2') ev.push({ at: 0.875 * L - DOWN_BEFORE, kind: 'down', srv: 'A' });
      ev.sort(function (a, b) { return a.at - b.at; });
      ev.forEach(function (e) { e.done = false; });
      return ev;
    },

    /** State at step 0: the client has no address, nothing has been sent. */
    initial: function (p) {
      var servers = [{ id: 'A', ip: '192.168.180.1', up: true, partner: false, pool: POOL_A.slice(), leases: [], offered: null, opts: clone(OPTS) }];
      if (p.serverB === 'plain') servers.push({ id: 'B', ip: '192.168.180.2', up: true, partner: false, pool: POOL_B.slice(), leases: [], offered: null, opts: clone(OPTS) });
      if (p.serverB === 'partner') servers.push({ id: 'B', ip: '192.168.180.2', up: true, partner: true, pool: POOL_A.slice(), leases: [], offered: null, opts: clone(OPTS) });
      return {
        t: 0,
        p: { lease: p.lease, bcastFlag: !!p.bcastFlag },
        client: { state: 'INIT', addr: null, serverId: null, leaseStart: null, lease: null, t1: null, t2: null, exp: null,
          retry: null, retried: false, opts: null, startAt: 0, acks: 0 },
        servers: servers,
        msgs: [],
        rows: [],
        queue: [],
        events: logic.events(p),
        hist: [{ at: 0, state: 'INIT' }],
        restarted: false,
        lostAddr: null,
        last: null,
        done: false
      };
    },

    /** State after step n, from the state after step n - 1: exactly one protocol event. */
    step: function (prev, n, p) {
      var s = clone(prev);
      var e = eventNext(s), r;
      if (e && e.at <= s.t) r = applyEvent(s, e);                         // (1)
      else if (s.queue.length) r = deliver(s);                             // (2)
      else {                                                               // (3) the next timer
        var ce = clientNext(s), se = serverNext(s);
        var at = Math.min(e ? e.at : Infinity, ce ? ce.at : Infinity, se ? se.at : Infinity);
        if (at === Infinity) throw new Error('nothing left to happen at step ' + n);
        s.t = Math.max(s.t, at);
        if (e && e.at === at) r = applyEvent(s, e);                        // ties: scripted event, client, server
        else if (ce && ce.at === at) r = clientTimer(s, ce.what);
        else r = serverExpire(s, se);
      }
      r.t = s.t;
      s.last = r;
      s.n = n;
      var hs = s.client.state === 'SELECTING' || s.client.state === 'REQUESTING' ? 'INIT' : s.client.state;
      if (s.hist[s.hist.length - 1].state !== hs) {
        if (s.hist[s.hist.length - 1].at === s.t) s.hist.pop();
        if (!s.hist.length || s.hist[s.hist.length - 1].state !== hs) s.hist.push({ at: s.t, state: hs });
      }
      s.done = finished(s);
      return s;
    },

    timers: timers,
    retryAt: retryAt,
    freeAddr: freeAddr,
    serverHears: serverHears,
    msg: msg,
    server: server,
    serverByIp: serverByIp,
    bindingOf: bindingOf
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
