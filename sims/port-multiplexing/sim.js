/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for port-multiplexing: many connections on one server port, kept apart by the 5-tuple. One step is one event:
   a program opens a connection (its OS picks a source port, the SYN or first datagram reaches the server, which adds a
   row), a program sends one data segment (the server demultiplexes it), or the server replies (ports swapped; the
   client demultiplexes it). On arrival the receiver reads its socket table top down: established rows (exact
   5-tuple) first, then the listening sockets (a new TCP connection only with SYN), else reject (RST for TCP, ICMP
   port unreachable for UDP). Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** The dynamic (ephemeral) port range of the IANA registry (RFC 6335): the client OS takes ports from here. */
  var DYN_LO = 49152, DYN_HI = 65535;
  /** Payload bytes of one data segment from a client, and of one reply. SYN carries none. */
  var SEND_BYTES = 400, REPLY_BYTES = 1200;
  /** The port the OS hands out for every new connection when forcePort is 'reuse' (URM ch13 Primjer 2). */
  var REUSE_PORT = 51000;
  /** How many connections the student may add with the open button, and the most opens a demo has in all (the table
      must fit on one screen: 8 rows, the listening socket and the implicit row). */
  var MAX_ADDS = 4, MAX_OPENS = 8;

  /** The client hosts the student can open from (param `client`), in scene order. RFC 1918 and RFC 5737 addresses. */
  var CLIENTS = [
    { id: 'c50', ip: '192.168.1.50' },
    { id: 'c60', ip: '192.168.1.60' },
    { id: 'c7', ip: '198.51.100.7' },
    { id: 'c8', ip: '198.51.100.8' }
  ];
  var CLIENT_IDS = CLIENTS.map(function (c) { return c.id; });

  /** The servers: a web server on TCP 443 (and UDP 443 for HTTP/3), an SSH server on 22, a game server on its own port. */
  var SERVERS = {
    web: { ip: '203.0.113.10', kind: 'web', listen: [{ proto: 'tcp', port: 443 }] },
    web3: { ip: '203.0.113.10', kind: 'web', listen: [{ proto: 'tcp', port: 443 }, { proto: 'udp', port: 443 }] },
    ssh: { ip: '203.0.113.22', kind: 'ssh', listen: [{ proto: 'tcp', port: 22 }] },
    game: { ip: '203.0.113.40', kind: 'game', listen: [{ proto: 'tcp', port: 41800 }] }
  };

  /**
   * The scenes (one per preset). procs: the programs on each host at step 0. script: the events, one per step.
   * open: { k, id (the connection), host, prog, proto, to (server key), dport, port (the book's number, or none: the
   * OS picks) }; send / reply: { k, id }.
   */
  var SCENES = {
    'three-programs': {
      view: 'client',
      servers: ['web', 'ssh', 'game'],
      procs: { c50: [{ id: 'browser', kind: 'browser', tab: 0 }, { id: 'ssh', kind: 'ssh', tab: 0 }, { id: 'game', kind: 'game', tab: 0 }] },
      script: [
        { k: 'open', id: 'k1', host: 'c50', prog: 'browser', proto: 'tcp', to: 'web', dport: 443, port: 52140 },
        { k: 'open', id: 'k2', host: 'c50', prog: 'ssh', proto: 'tcp', to: 'ssh', dport: 22, port: 52141 },
        { k: 'open', id: 'k3', host: 'c50', prog: 'game', proto: 'tcp', to: 'game', dport: 41800, port: 53217 },
        { k: 'send', id: 'k1' }, { k: 'send', id: 'k2' }, { k: 'send', id: 'k3' },
        { k: 'reply', id: 'k2' }, { k: 'reply', id: 'k1' }, { k: 'reply', id: 'k3' }
      ]
    },
    'two-tabs': {
      view: 'server',
      servers: ['web'],
      procs: { c50: [{ id: 'tab1', kind: 'browser', tab: 1 }, { id: 'tab2', kind: 'browser', tab: 2 }] },
      script: [
        { k: 'open', id: 'k1', host: 'c50', prog: 'tab1', proto: 'tcp', to: 'web', dport: 443, port: 51000 },
        { k: 'open', id: 'k2', host: 'c50', prog: 'tab2', proto: 'tcp', to: 'web', dport: 443, port: 51001 },
        { k: 'send', id: 'k1' }, { k: 'send', id: 'k2' },
        { k: 'reply', id: 'k2' }, { k: 'reply', id: 'k1' }
      ]
    },
    'many-clients': {
      view: 'server',
      servers: ['web'],
      procs: {
        c50: [{ id: 'tab1', kind: 'browser', tab: 1 }, { id: 'tab2', kind: 'browser', tab: 2 }],
        c60: [{ id: 'tab1', kind: 'browser', tab: 1 }],
        c7: [{ id: 'tab1', kind: 'browser', tab: 1 }],
        c8: [{ id: 'tab1', kind: 'browser', tab: 1 }]
      },
      script: [
        { k: 'open', id: 'k1', host: 'c50', prog: 'tab1', proto: 'tcp', to: 'web', dport: 443, port: 51000 },
        { k: 'open', id: 'k2', host: 'c60', prog: 'tab1', proto: 'tcp', to: 'web', dport: 443, port: 51000 },
        { k: 'open', id: 'k3', host: 'c7', prog: 'tab1', proto: 'tcp', to: 'web', dport: 443, port: 50122 },
        { k: 'open', id: 'k4', host: 'c8', prog: 'tab1', proto: 'tcp', to: 'web', dport: 443, port: 58410 },
        { k: 'open', id: 'k5', host: 'c50', prog: 'tab2', proto: 'tcp', to: 'web', dport: 443, port: 51001 },
        { k: 'send', id: 'k2' }, { k: 'send', id: 'k1' }, { k: 'send', id: 'k3' }, { k: 'send', id: 'k4' }, { k: 'send', id: 'k5' }
      ]
    },
    'port-clash': {
      view: 'server',
      servers: ['web'],
      procs: { c50: [{ id: 'tab1', kind: 'browser', tab: 1 }, { id: 'tab2', kind: 'browser', tab: 2 }] },
      script: [
        { k: 'open', id: 'k1', host: 'c50', prog: 'tab1', proto: 'tcp', to: 'web', dport: 443, port: 51000 },
        { k: 'send', id: 'k1' },
        { k: 'reply', id: 'k1' },
        { k: 'open', id: 'k2', host: 'c50', prog: 'tab2', proto: 'tcp', to: 'web', dport: 443 },
        { k: 'send', id: 'k1' }
      ]
    },
    'quic-too': {
      view: 'server',
      servers: ['web3'],
      procs: { c50: [{ id: 'browser', kind: 'browser', tab: 0 }] },
      script: [
        { k: 'open', id: 'k1', host: 'c50', prog: 'browser', proto: 'tcp', to: 'web3', dport: 443, port: 51002 },
        { k: 'open', id: 'k2', host: 'c50', prog: 'browser', proto: 'udp', to: 'web3', dport: 443, port: 51002 },
        { k: 'send', id: 'k1' }, { k: 'send', id: 'k2' },
        { k: 'reply', id: 'k2' }
      ]
    }
  };
  var SCENE_IDS = Object.keys(SCENES);

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function clientOf(id) { return CLIENTS.filter(function (c) { return c.id === id; })[0]; }

  // ── the user's added connections (param `adds`) ──

  /**
   * The param `adds` packs the open button's clicks into one number, three decimal digits per click, the first click
   * lowest: digits = (step after which it happens) × 10 + (client index + 1). 0 = no clicks.
   */
  function decodeAdds(v) {
    var out = [];
    v = Math.max(0, Math.floor(Number(v) || 0));
    while (v > 0 && out.length < MAX_ADDS) {
      var g = v % 1000;
      v = Math.floor(v / 1000);
      var ci = (g % 10) - 1;
      if (ci >= 0 && ci < CLIENTS.length) out.push({ after: Math.floor(g / 10), client: CLIENTS[ci].id });
    }
    return out;
  }
  function encodeAdds(list) {
    var v = 0;
    for (var i = list.length - 1; i >= 0; i--) {
      v = v * 1000 + list[i].after * 10 + (CLIENT_IDS.indexOf(list[i].client) + 1);
    }
    return v;
  }
  /** The value of `adds` after one more click at step n from client id (unchanged at MAX_ADDS clicks). */
  function addClick(v, n, client) {
    var list = decodeAdds(v);
    if (list.length >= MAX_ADDS) return v;
    list.push({ after: Math.max(0, Math.min(99, n)), client: client });
    return encodeAdds(list);
  }

  /** How many more connections the open button may add for these params (0 = the button is used up). */
  function addsLeft(p) {
    var scene = SCENES[p.scene] || SCENES[SCENE_IDS[0]];
    var opens = scene.script.filter(function (e) { return e.k === 'open'; }).length;
    var n = decodeAdds(p.adds).length;
    return Math.max(0, Math.min(MAX_ADDS - n, MAX_OPENS - opens - n));
  }

  /** The scene's events with the user's opens put in, each after the step it was clicked at (in click order). */
  function eventsOf(p) {
    var scene = SCENES[p.scene] || SCENES[SCENE_IDS[0]];
    var evs = scene.script.map(function (e) { return Object.assign({ by: 'script' }, e); });
    var scripted = scene.script.filter(function (e) { return e.k === 'open'; }).length;
    decodeAdds(p.adds).slice(0, Math.max(0, MAX_OPENS - scripted)).forEach(function (a, i) {
      var at = Math.min(a.after, evs.length);
      evs.splice(at, 0, { k: 'open', by: 'user', id: 'u' + (i + 1), host: a.client, prog: null, proto: 'tcp', to: scene.servers[0], dport: 443 });
    });
    return evs;
  }

  // ── the client OS: picking a source port ──

  /** Is this port in use by a socket of this protocol on this host (a connection, or a failed attempt's port)? */
  function portUsed(host, proto, port) {
    return host.procs.some(function (pr) {
      return pr.socks.some(function (k) { return k.proto === proto && k.port === port && k.conn; });
    });
  }

  /**
   * The source port for a new connection (rule 3): with forcePort 'reuse' always REUSE_PORT; else the book's number
   * when the script gives one; else the next free port of the dynamic range after the last one this host used
   * (wrapping to 49152), per protocol.
   */
  function pickPort(host, proto, want, forcePort) {
    if (forcePort === 'reuse') return REUSE_PORT;
    if (want) return want;
    var p = host.next >= DYN_LO && host.next <= DYN_HI ? host.next : DYN_LO;
    for (var i = 0; i <= DYN_HI - DYN_LO; i++) {
      if (!portUsed(host, proto, p)) return p;
      p = p >= DYN_HI ? DYN_LO : p + 1;
    }
    return null; // port exhaustion: out of scope, never reached in the presets
  }

  // ── the receiver: the socket table and demultiplexing ──

  /**
   * The receiver's socket table, top to bottom: its connections in the order they were made (local = this side),
   * then, on a server, its listening (TCP) or bound (UDP) sockets. side: 'server' | 'client'; ip: the receiver.
   */
  function tableOf(s, side, ip) {
    var rows = [];
    s.conns.forEach(function (c) {
      if (side === 'server' && c.sip === ip) rows.push({ key: c.id, conn: c.id, proto: c.proto, lip: c.sip, lport: c.sport, rip: c.cip, rport: c.cport });
      if (side === 'client' && c.cip === ip) rows.push({ key: c.id, conn: c.id, proto: c.proto, lip: c.cip, lport: c.cport, rip: c.sip, rport: c.sport });
    });
    if (side === 'server') {
      s.servers.filter(function (x) { return x.ip === ip; }).forEach(function (x) {
        x.listen.forEach(function (l) {
          rows.push({ key: 'L:' + l.proto + ':' + l.port, listen: true, proto: l.proto, lip: '*', lport: l.port, rip: '*', rport: '*', flag: l.proto === 'tcp' ? 'SYN' : '*' });
        });
      });
    }
    return rows;
  }

  /** The fields of a table row this segment fails (empty = it matches). A '*' matches anything. */
  function missOf(row, seg) {
    var miss = [];
    if (row.proto !== seg.proto) miss.push('proto');
    if (row.lip !== '*' && row.lip !== seg.dip) miss.push('lip');
    if (row.lport !== seg.dport) miss.push('lport');
    if (row.rip !== '*' && row.rip !== seg.sip) miss.push('rip');
    if (row.rport !== '*' && row.rport !== seg.sport) miss.push('rport');
    if (row.flag === 'SYN' && seg.flag !== 'SYN') miss.push('flag');
    return miss;
  }

  /**
   * Demultiplex one arriving segment (rules 1, 2, 5, 8): read the table top down; the first row that matches
   * decides. Connections come before the listening sockets, so an exact match on an established connection wins
   * over the listening socket (the tie-break). Returns { read: [{ key, miss }], at (the deciding row, or rows.length
   * for none), result, key }: result 'deliver' (a connection takes data), 'same' (a SYN that is an existing
   * connection's pair: not a new connection), 'new' (a listening socket takes it: a new connection), 'reject' (no
   * socket: RST for TCP, ICMP port unreachable for UDP).
   */
  function demux(rows, seg) {
    var read = [];
    for (var i = 0; i < rows.length; i++) {
      var miss = missOf(rows[i], seg);
      read.push({ key: rows[i].key, miss: miss });
      if (!miss.length) {
        var res = rows[i].listen ? 'new' : seg.flag === 'SYN' ? 'same' : 'deliver';
        return { read: read, at: i, result: res, key: rows[i].key };
      }
    }
    return { read: read, at: rows.length, result: 'reject', key: null, answer: seg.proto === 'tcp' ? 'rst' : 'icmp' };
  }

  /** Segment fields named by the table's columns, on the receiving side. */
  var SEG_FIELD = { proto: 'proto', lip: 'dip', lport: 'dport', rip: 'sip', rport: 'sport', flag: 'flag' };

  /**
   * The segment fields that decided the lookup, for the page's "changed" mark: for a delivery, the fields in which
   * the rows read before the winner differed; for a new connection, those and the SYN; for 'same', the whole pair
   * and the protocol (all equal to the row's).
   */
  function decidingFields(look) {
    if (look.result === 'reject') return [];
    if (look.result === 'same') return ['proto', 'sip', 'sport', 'dip', 'dport'];
    var out = [];
    look.read.slice(0, look.at).forEach(function (r) {
      r.miss.forEach(function (m) {
        var f = SEG_FIELD[m];
        if (f === 'flag' && !look.flag) return; // a UDP datagram has no flags: its protocol told the rows apart
        if (out.indexOf(f) < 0) out.push(f);
      });
    });
    if (look.result === 'new' && look.flag === 'SYN' && out.indexOf('flag') < 0) out.push('flag');
    return out;
  }

  // ── the state ──

  function hostState(id, procs) {
    return { id: id, ip: clientOf(id).ip, next: 0, procs: (procs || []).map(function (pr) { return Object.assign({ socks: [] }, pr); }) };
  }
  function hostOf(s, id) { return s.hosts.filter(function (h) { return h.id === id; })[0]; }
  function procOf(host, id) { return host.procs.filter(function (p) { return p.id === id; })[0]; }
  function connOf(s, id) { return s.conns.filter(function (c) { return c.id === id; })[0]; }
  function serverAt(s, ip) { return s.servers.filter(function (x) { return x.ip === ip; })[0]; }

  /** Add a host the student opened from, keeping the scene's host order (CLIENTS order). */
  function ensureHost(s, id) {
    var h = hostOf(s, id);
    if (h) return h;
    h = hostState(id, []);
    s.hosts.push(h);
    s.hosts.sort(function (a, b) { return CLIENT_IDS.indexOf(a.id) - CLIENT_IDS.indexOf(b.id); });
    return h;
  }

  function initial(p) {
    var scene = SCENES[p.scene] || SCENES[SCENE_IDS[0]];
    var s = {
      scene: SCENES[p.scene] ? p.scene : SCENE_IDS[0],
      hosts: CLIENT_IDS.filter(function (id) { return scene.procs[id]; }).map(function (id) { return hostState(id, scene.procs[id]); }),
      servers: scene.servers.map(function (k) { return { key: k, ip: SERVERS[k].ip, kind: SERVERS[k].kind, listen: clone(SERVERS[k].listen) }; }),
      conns: [],
      seg: null,
      look: null,
      event: { kind: 'start' },
      changed: []
    };
    return s;
  }

  /** Apply one event to a copy of s. */
  function apply(s0, ev, p) {
    var s = clone(s0);
    s.changed = [];
    s.seg = null;
    s.look = null;
    var mark = function (m) { if (s.changed.indexOf(m) < 0) s.changed.push(m); };

    if (ev.k === 'open') {
      var host = ensureHost(s, ev.host);
      var prog = ev.prog ? procOf(host, ev.prog) : null;
      if (!prog) { // a new tab the student opened
        var tabs = host.procs.filter(function (x) { return x.kind === 'browser'; }).length;
        prog = { id: 'utab' + ev.id, kind: 'browser', tab: tabs + 1, socks: [], user: true };
        host.procs.push(prog);
      }
      var srv = SERVERS[ev.to];
      var port = pickPort(host, ev.proto, ev.port, p.forcePort);
      // "again": under reuse, only when this host already used that port
      var again = p.forcePort === 'reuse' && host.procs.some(function (x) { return x.socks.some(function (k) { return k.port === port; }); });
      host.next = Math.max(host.next, port + 1);
      var seg = { proto: ev.proto, sip: host.ip, sport: port, dip: srv.ip, dport: ev.dport, flag: ev.proto === 'tcp' ? 'SYN' : '', bytes: ev.proto === 'tcp' ? 0 : SEND_BYTES, dir: 'up' };
      var rows = tableOf(s, 'server', srv.ip);
      var look = demux(rows, seg);
      look.side = 'server'; look.ip = srv.ip; look.flag = seg.flag;
      var sock = { id: ev.id, proto: ev.proto, port: port, conn: null, fail: false };
      prog.socks.push(sock);
      if (look.result === 'new') {
        var c = { id: ev.id, proto: ev.proto, cip: host.ip, cport: port, sip: srv.ip, sport: ev.dport, host: host.id, prog: prog.id, skind: srv.kind, bytes: seg.bytes };
        s.conns.push(c);
        sock.conn = c.id;
        look.conn = c.id;
        mark('conn:' + c.id);
      } else {
        sock.fail = true;
        if (look.key) mark('conn:' + look.key);
      }
      look.decide = decidingFields(look);
      look.decide.forEach(function (f) { mark('seg:' + f); });
      mark('prog:' + host.id + ':' + prog.id);
      s.seg = seg;
      s.look = look;
      s.event = { kind: 'open', by: ev.by, conn: ev.id, host: host.id, prog: prog.id, proto: ev.proto, server: srv.ip, result: look.result, forced: again };
      return s;
    }

    // send (client → server) or reply (server → client) on an existing connection
    var cn = connOf(s, ev.id);
    if (!cn) {
      // the connection was never made (its SYN was rejected): the program has nothing to send on
      var who = {};
      s.hosts.forEach(function (hs) {
        hs.procs.forEach(function (pr) { pr.socks.forEach(function (k) { if (k.id === ev.id) who = { host: hs.id, prog: pr.id }; }); });
      });
      s.event = { kind: 'none', what: ev.k, conn: ev.id, host: who.host || null, prog: who.prog || null };
      return s;
    }
    var up = ev.k === 'send';
    var sg = up
      ? { proto: cn.proto, sip: cn.cip, sport: cn.cport, dip: cn.sip, dport: cn.sport, flag: cn.proto === 'tcp' ? 'ACK' : '', bytes: SEND_BYTES, dir: 'up' }
      : { proto: cn.proto, sip: cn.sip, sport: cn.sport, dip: cn.cip, dport: cn.cport, flag: cn.proto === 'tcp' ? 'ACK' : '', bytes: REPLY_BYTES, dir: 'down' };
    var side = up ? 'server' : 'client';
    var lk = demux(tableOf(s, side, sg.dip), sg);
    lk.side = side; lk.ip = sg.dip; lk.flag = sg.flag;
    if (lk.result === 'deliver') {
      var hit = connOf(s, lk.key);
      hit.bytes += sg.bytes;
      lk.conn = hit.id;
      mark('conn:' + hit.id);
      mark(up ? 'srv:' + hit.sip : 'prog:' + hit.host + ':' + hit.prog);
    }
    lk.decide = decidingFields(lk);
    lk.decide.forEach(function (f) { mark('seg:' + f); });
    s.seg = sg;
    s.look = lk;
    s.event = { kind: ev.k, conn: cn.id, host: cn.host, prog: cn.prog, proto: cn.proto, result: lk.result };
    return s;
  }

  /** Every state from step 0 to the end (memoised on the params that shape them). */
  var memo = {};
  function framesOf(p) {
    var key = [p.scene, p.forcePort, p.adds].join('|');
    if (memo[key]) return memo[key];
    var s = initial(p);
    var frames = [s];
    eventsOf(p).forEach(function (ev) { s = apply(s, ev, p); frames.push(s); });
    memo[key] = frames;
    return frames;
  }
  function stateAt(p, n) { var fr = framesOf(p); return clone(fr[Math.max(0, Math.min(n, fr.length - 1))]); }

  var logic = {
    /** Parameter defaults: preset 1 (URM ch13 Primjer 1), the client's view. */
    defaults: { scene: 'three-programs', client: 'c50', forcePort: 'auto', view: 'client', adds: 0 },

    /** One step per event: the scene's script plus the connections the student added. */
    steps: function (p) { return eventsOf(p).length; },

    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    DYN_LO: DYN_LO, DYN_HI: DYN_HI, SEND_BYTES: SEND_BYTES, REPLY_BYTES: REPLY_BYTES, REUSE_PORT: REUSE_PORT,
    MAX_ADDS: MAX_ADDS, MAX_OPENS: MAX_OPENS, CLIENTS: CLIENTS, CLIENT_IDS: CLIENT_IDS, SERVERS: SERVERS, SCENES: SCENES, SCENE_IDS: SCENE_IDS,
    addsLeft: addsLeft, decodeAdds: decodeAdds, encodeAdds: encodeAdds, addClick: addClick, eventsOf: eventsOf, pickPort: pickPort,
    tableOf: tableOf, missOf: missOf, demux: demux, decidingFields: decidingFields, framesOf: framesOf,
    hostOf: hostOf, connOf: connOf, serverAt: serverAt
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
