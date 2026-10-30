/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for ssh-tunnels: one SSH connection from democli1 to demosrv1 (192.168.122.57), one forwarding on it (local,
   remote or dynamic), and the connections an application makes through it. Each connection becomes a channel inside
   the one encrypted connection; the far end opens a plain TCP connection to the target as it resolves and reaches it.
   Step 1 sets up the session and the listener; the first connection then takes four steps (connect, open, target,
   data); every further one (dynamic's second site, each T press) takes one. Rules and numbers: SPEC.md.
   Hosts and the client/server lanes are ssh-key-auth's (sims/ssh-key-auth/sim.js @ b7dd63e); no function of it is
   reused, so nothing is copied but the names.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON. The page loads this as a classic script
   (window.SimLogic); node tests require() it. No words: the page words everything from codes. Host names, addresses
   and message names are data, not language. */
(function (root) {
  'use strict';

  var CLIENT = 'democli1';
  var SERVER = 'demosrv1';
  var HOST = '192.168.122.57';
  var DB = 'db1';
  var DB_ADDR = '192.168.180.20';
  var LOOP = '127.0.0.1';
  var ANY = '0.0.0.0';
  var SITES = ['www.example.com', 'www.example.org'];   // reserved example names; port 80, plain HTTP
  var SOCKS_PORT = 1080;
  var MAX_EXTRA = 2;                                     // T presses: at most 8 steps in a run (the scene stays one screen)

  /** Targets the choice offers, as written in the forwarding (rule 7: localhost is the far end's). */
  var TARGETS = {
    'localhost:80': { host: 'localhost', port: 80 },
    'localhost:22': { host: 'localhost', port: 22 },
    'db1:5432': { host: DB_ADDR, port: 5432 }
  };
  /** The listening port for each target port (the task's presets). */
  var LISTEN_PORT = { 80: 8080, 22: 2222, 5432: 5432 };

  /** What listens on each host before any tunnel (SPEC.md, Scene). role: the page's word for the program. */
  var SERVICES = {
    democli1: [{ role: 'ssh', addr: ANY, port: 22 }, { role: 'web', addr: ANY, port: 80 }],
    demosrv1: [{ role: 'ssh', addr: ANY, port: 22 }, { role: 'web', addr: LOOP, port: 80 }],
    db1: [{ role: 'db', addr: ANY, port: 5432 }]
  };

  /** The presets' params (the page lists them; the tests read them). */
  var PRESETS = {
    'local-to-loopback': { kind: 'L', target: 'localhost:80', remoteBindAny: false, mixup: false },
    'local-to-internal': { kind: 'L', target: 'db1:5432', remoteBindAny: false, mixup: false },
    'remote': { kind: 'R', target: 'localhost:22', remoteBindAny: false, mixup: false },
    'dynamic': { kind: 'D', target: 'localhost:80', remoteBindAny: false, mixup: false },
    'localhost-mixup': { kind: 'L', target: 'localhost:80', remoteBindAny: false, mixup: true }
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function kindOf(p) { return p.kind === 'R' || p.kind === 'D' ? p.kind : 'L'; }
  function targetOf(p) { return TARGETS[p.target] || TARGETS['localhost:80']; }
  /** The tunnel a T press belongs to: kind and target ('D' alone, its target does not apply). */
  function tunnelKey(p) { var k = kindOf(p); return k === 'D' ? 'D' : k + ' ' + (TARGETS[p.target] ? p.target : 'localhost:80'); }
  /** T presses are kept as "<tunnel> <count>" so they belong to one tunnel: a change of kind or target drops them
      (the kit keeps params without a control across other changes). */
  function sendKey(p, count) { return count > 0 ? tunnelKey(p) + ' ' + count : ''; }
  function extraOf(p) {
    var str = String(p.extra || ''), i = str.lastIndexOf(' ');
    if (i < 0 || str.slice(0, i) !== tunnelKey(p)) return 0;
    var e = Math.floor(Number(str.slice(i + 1)) || 0);
    return Math.max(0, Math.min(MAX_EXTRA, e));
  }

  /** Rule 2/3: the far end (the host that opens the connection to the target) and the near end (the listener's). */
  function ends(kind) { return kind === 'R' ? { near: SERVER, far: CLIENT } : { near: CLIENT, far: SERVER }; }

  /** Rule 5: the listening socket of the forwarding. */
  function listener(kind, target, remoteBindAny) {
    if (kind === 'D') return { host: CLIENT, addr: LOOP, port: SOCKS_PORT };
    var port = LISTEN_PORT[target.port];
    if (kind === 'R') return { host: SERVER, addr: remoteBindAny ? ANY : LOOP, port: port };
    return { host: CLIENT, addr: LOOP, port: port };
  }

  /** Who can connect to a socket bound to addr (UL ch18 table): 'local' = only processes on that host. */
  function reach(addr) { return addr === LOOP ? 'local' : 'any'; }

  /** Rule 2, 3, 6, 7: where a target lands when the far end resolves and reaches it.
      → { host, addr, port, role, seg: 'loop' | 'net' } or { fail: 'unreachable', host, addr, port }. */
  function resolve(far, target) {
    if (target.host === 'localhost' || target.host === LOOP) {
      var svc = (SERVICES[far] || []).filter(function (x) { return x.port === target.port; })[0];
      return { host: far, addr: LOOP, port: target.port, role: svc ? svc.role : null, seg: 'loop' };
    }
    if (target.host === DB_ADDR) {
      // db1 sits on the internal network behind demosrv1: only the server reaches it
      if (far !== SERVER) return { fail: 'unreachable', host: DB, addr: DB_ADDR, port: target.port };
      return { host: DB, addr: DB_ADDR, port: target.port, role: 'db', seg: 'net' };
    }
    // a web site on the Internet (dynamic forwarding); reached from the server
    return { host: target.host, addr: null, port: target.port, role: 'site', seg: 'net' };
  }

  /** Lanes of the chart: A = the client's side program (app or target), C = SSH client, S = SSH server,
      B = beyond the server (target or app). Rule 2/3: who opens each connection. */
  function lanesFor(kind) {
    return kind === 'R'
      ? { app: 'B', near: 'S', far: 'C', tgt: 'A' }
      : { app: 'A', near: 'C', far: 'S', tgt: 'B' };
  }

  /** The destination the application asks for on connection i (0-based). D: alternates the sites (rule 4). */
  function wanted(kind, target, i) {
    return kind === 'D' ? { host: SITES[i % SITES.length], port: 80 } : { host: target.host, port: target.port };
  }

  /** Steps of a run: setup, four for the first connection, one per further connection. */
  function steps(p) { return 5 + (kindOf(p) === 'D' ? 1 : 0) + extraOf(p); }

  function initial(p) {
    var kind = kindOf(p), target = targetOf(p);
    return {
      kind: kind,
      target: kind === 'D' ? null : target,
      gatewayPorts: !!p.remoteBindAny,
      mixup: kind === 'L' && target.host === 'localhost' && target.port === 80 && !!p.mixup,
      session: false,
      tunnels: [],
      flows: [],
      rows: [],
      phase: 'start',
      ev: { kind: 'start', tunnel: kind },
      extra: extraOf(p)
    };
  }

  // ── one connection through the tunnel, phase by phase ──

  function phaseConnect(s, n, i) {
    var kind = s.kind, tun = s.tunnels[0], ln = lanesFor(kind);
    var want = wanted(kind, s.target || {}, i);
    var appHost = tun.bind.host;   // the application runs on the listener's host
    var f = {
      ch: i + 1,
      app: { host: appHost },
      listener: clone(tun.bind),
      req: want,                   // what the far end is asked to reach, as written
      dst: null,                   // where it lands (rule 7), set in the target phase
      segs: [{ at: appHost === CLIENT ? 'cli' : 'srv', kind: 'loop', enc: false, wire: false, dir: kind === 'R' ? 'l' : 'r', n: n }],
      phase: 'connect',
      fail: null,
      n: n
    };
    s.flows.push(f);
    s.rows.push({ k: 'connect', n: n, ch: f.ch, from: ln.app, to: ln.near, addr: tun.bind.addr === ANY ? LOOP : tun.bind.addr, port: tun.bind.port });
    if (kind === 'D') s.rows.push({ k: 'socks', n: n, ch: f.ch, from: ln.app, to: ln.near, host: want.host, port: want.port });
    return f;
  }

  function phaseOpen(s, n, f) {
    var kind = s.kind, ln = lanesFor(kind), tun = s.tunnels[0];
    f.phase = 'open';
    f.segs.push({ at: 'pipe', kind: 'ssh', enc: true, wire: true, dir: kind === 'R' ? 'l' : 'r', n: n });
    // direct-tcpip carries the target as written; forwarded-tcpip the address and port that was connected (RFC 4254 §7)
    s.rows.push(kind === 'R'
      ? { k: 'open', n: n, ch: f.ch, from: ln.near, to: ln.far, type: 'forwarded-tcpip', host: 'localhost', port: tun.bind.port }
      : { k: 'open', n: n, ch: f.ch, from: ln.near, to: ln.far, type: 'direct-tcpip', host: f.req.host, port: f.req.port });
  }

  function phaseTarget(s, n, f) {
    var kind = s.kind, ln = lanesFor(kind), far = ends(kind).far;
    var dst = resolve(far, f.req);
    f.phase = 'target';
    f.dst = dst;
    if (dst.fail) {
      // rule 3 tie-break: the far end cannot reach the target; the channel is refused
      f.fail = dst.fail;
      f.segs.push({ at: far === CLIENT ? 'cli' : 'srv', kind: 'fail', enc: false, wire: true, dir: kind === 'R' ? 'l' : 'r', n: n });
      s.rows.push({ k: 'tconnect', n: n, ch: f.ch, from: ln.far, to: ln.tgt, host: dst.addr, port: dst.port, fail: true });
      s.rows.push({ k: 'openFail', n: n, ch: f.ch, from: ln.far, to: ln.near });
      return;
    }
    var at = dst.seg === 'net' ? 'net' : far === CLIENT ? 'cli' : 'srv';
    f.segs.push({ at: at, kind: dst.seg, enc: false, wire: dst.seg === 'net', dir: kind === 'R' ? 'l' : 'r', n: n });
    s.rows.push({ k: 'tconnect', n: n, ch: f.ch, from: ln.far, to: ln.tgt, host: dst.addr || dst.host, port: dst.port, fail: false });
    s.rows.push({ k: 'confirm', n: n, ch: f.ch, from: ln.far, to: ln.near });
  }

  function phaseData(s, n, f) {
    var kind = s.kind, ln = lanesFor(kind);
    if (f.fail) {
      f.phase = 'closed';
      s.rows.push({ k: 'close', n: n, ch: f.ch, from: ln.near, to: ln.app });
      return;
    }
    f.phase = 'data';
    f.segs.forEach(function (g) { g.data = n; });
    s.rows.push({ k: 'data', n: n, ch: f.ch, from: ln.app, to: ln.near, seg: 0 });
    s.rows.push({ k: 'chdata', n: n, ch: f.ch, from: ln.near, to: ln.far, seg: 1 });
    s.rows.push({ k: 'data', n: n, ch: f.ch, from: ln.far, to: ln.tgt, seg: 2 });
  }

  /** Flags the captions need about a flow: the encrypted map of its segments (rule 6). */
  function encOf(f) { return f.segs.map(function (g) { return g.enc; }); }
  function plainOnWire(f) { return f.segs.some(function (g) { return g.wire && !g.enc && g.kind !== 'fail'; }); }

  function evOf(kind, f, s) {
    return { kind: kind, ch: f.ch, tunnel: s.kind, req: f.req, dst: f.dst, fail: f.fail, listener: f.listener,
      enc: encOf(f), plainOnWire: plainOnWire(f), mixup: s.mixup, channels: s.flows.length };
  }

  /** State after step n, from the state after step n − 1. */
  function step(prev, n, p) {
    var s = clone(prev);
    var kind = s.kind;
    if (n > steps(p)) { s.ev = { kind: 'idle' }; return s; }
    if (n === 1) {
      // rule 2/3/4/5: the session, the request (remote only), the listener
      var bind = listener(kind, s.target || {}, s.gatewayPorts);
      s.session = true;
      s.tunnels.push({ kind: kind, bind: bind, target: s.target ? clone(s.target) : null, n: n });
      s.rows.push({ k: 'session', n: n, from: 'C', to: 'S', port: 22 });
      if (kind === 'R') {
        s.rows.push({ k: 'fwdReq', n: n, from: 'C', to: 'S', host: 'localhost', port: bind.port });
        s.rows.push({ k: 'fwdOk', n: n, from: 'S', to: 'C' });
      }
      s.rows.push({ k: 'listen', n: n, lane: kind === 'R' ? 'S' : 'C', addr: bind.addr, port: bind.port, socks: kind === 'D' });
      s.phase = 'setup';
      s.ev = { kind: 'setup', tunnel: kind, listener: bind, reach: reach(bind.addr), target: s.target,
        gatewayPorts: s.gatewayPorts, mixup: s.mixup };
      return s;
    }
    var f;
    if (n <= 5) {
      // the first connection, one phase per step
      if (n === 2) { f = phaseConnect(s, n, 0); s.ev = evOf('connect', f, s); }
      else {
        f = s.flows[0];
        if (n === 3) { phaseOpen(s, n, f); s.ev = evOf('open', f, s); }
        else if (n === 4) { phaseTarget(s, n, f); s.ev = evOf('target', f, s); }
        else { phaseData(s, n, f); s.ev = evOf('data', f, s); }
      }
      s.phase = s.ev.kind;
      return s;
    }
    // a further connection: all four phases in one step (rule 1: a new channel in the same connection)
    f = phaseConnect(s, n, s.flows.length);
    phaseOpen(s, n, f);
    phaseTarget(s, n, f);
    phaseData(s, n, f);
    s.phase = 'more';
    s.ev = evOf('more', f, s);
    s.ev.extra = n > 5 + (kind === 'D' ? 1 : 0);
    return s;
  }

  /** May T add a connection? Only up to MAX_EXTRA. */
  function canSend(p) { return extraOf(p) < MAX_EXTRA; }
  /** The value of `extra` after one more T press. */
  function sendMore(p) { return sendKey(p, Math.min(MAX_EXTRA, extraOf(p) + 1)); }

  var logic = {
    CLIENT: CLIENT, SERVER: SERVER, HOST: HOST, DB: DB, DB_ADDR: DB_ADDR, LOOP: LOOP, ANY: ANY, SITES: SITES,
    SOCKS_PORT: SOCKS_PORT, MAX_EXTRA: MAX_EXTRA, TARGETS: TARGETS, LISTEN_PORT: LISTEN_PORT, SERVICES: SERVICES,
    PRESETS: PRESETS,
    listener: listener, reach: reach, resolve: resolve, lanesFor: lanesFor, ends: ends, wanted: wanted, canSend: canSend, sendKey: sendKey, sendMore: sendMore,

    defaults: { kind: 'L', target: 'localhost:80', remoteBindAny: false, mixup: false, extra: '' },

    steps: steps,

    initial: initial,

    step: function (s, n, p) { return step(s, n, p); }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
