/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-routing-decision: the three places a host keeps what it needs to talk to the network (the address on
   the interface, the kernel's routing table, the name files), and the route lookup. One step runs one command of the
   chosen script on demosrv1; a command goes through up to three phases in a fixed order (the name, the route lookup,
   the packet to the next hop and back) and the first phase that fails ends it. The `break` param spoils one place
   before step 0; the same script then shows which command fails. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  // from sims/routing-table/sim.js @ 7bd975d (parse, format, mask, match); models/ has no IPv4 model yet
  /** "10.1.2.55" → unsigned 32-bit number, or null if it is not a dotted-quad IPv4 address. */
  function parse(str) {
    var parts = String(str).split('.');
    if (parts.length !== 4) return null;
    var v = 0;
    for (var i = 0; i < 4; i++) {
      if (!/^\d{1,3}$/.test(parts[i])) return null;
      var n = Number(parts[i]);
      if (n > 255) return null;
      v = v * 256 + n;
    }
    return v;
  }

  /** Unsigned 32-bit number → "a.b.c.d". */
  function format(v) {
    return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
  }

  /** The mask of a prefix length: p ones from the left, then zeros. p = 0 is 0.0.0.0, p = 32 is 255.255.255.255. */
  function mask(p) {
    return p <= 0 ? 0 : (0xffffffff << (32 - p)) >>> 0; // a shift by 32 would be a shift by 0, hence the p = 0 case
  }

  /** An entry matches when the first `prefix` bits of the destination equal those of the entry's network.
      Prefix 0 compares no bit, so the default route matches every address. */
  function match(dest, net, prefix) {
    var m = mask(prefix);
    return ((dest & m) >>> 0) === ((net & m) >>> 0);
  }
  // end of the copy from sims/routing-table

  // ── the book's machines (UL ch14) ──

  var HOST = 'demosrv1';
  var DEV = 'enp1s0';
  var ADDR = { ip: '192.168.122.57', prefix: 24 };
  var GW = '192.168.122.1';
  var PROFILE = 'cloud-init enp1s0';
  /** Who answers on the LAN: the gateway (also the name server), democli1, and demosrv1 itself. */
  var LAN_HOSTS = { '192.168.122.1': 'gw', '192.168.122.186': 'democli1', '192.168.122.57': 'demosrv1' };
  /** Who answers beyond the gateway (www.example.org is modelled as 203.0.113.10, RFC 5737). */
  var FAR_HOSTS = ['1.1.1.1', '203.0.113.10', '8.8.8.8'];
  /** The only name server in the model: the gateway. */
  var DNS_SERVER = GW;
  /** What the name server knows. */
  var ZONE = { demosrv1: '192.168.122.57', democli1: '192.168.122.186', 'www.example.org': '203.0.113.10' };
  /** The breaks (task "Params"): the stale line of ch14 Primjer 2 (mirrored to democli1, NOTES.md) and a name server
      address where nobody answers. */
  var STALE = { ip: '192.168.122.99', names: ['democli1'] };
  var BAD_NS = '192.168.122.250';
  var BREAKS = ['none', 'address', 'route', 'resolver', 'hosts'];
  /** nss-myhostname's answer for the local name when the host has no address (nss-myhostname(8), check). */
  var MYHOSTNAME_NOADDR = '127.0.0.2';

  /** The command scripts, one per preset (task "Presets"; deviations in NOTES.md). A ping with a name uses the name
      or the address by the `target` param. */
  var SCRIPTS = {
    healthy: [
      { k: 'addr' },
      { k: 'routes' },
      { k: 'routeGet', ip: '1.1.1.1' },
      { k: 'routeGet', ip: '192.168.122.186' },
      { k: 'getent', name: 'democli1' },
      { k: 'ping', name: 'democli1', ip: '192.168.122.186' }
    ],
    'stale-hosts': [
      { k: 'ping', ip: '192.168.122.186' },
      { k: 'getent', name: 'democli1' },
      { k: 'ping', name: 'democli1', ip: '192.168.122.186' },
      { k: 'nsswitch' },
      { k: 'hostsDel', ip: '192.168.122.99' },
      { k: 'getent', name: 'democli1' }
    ],
    'no-default': [
      { k: 'routes' },
      { k: 'ping', ip: '192.168.122.1' },
      { k: 'getent', name: 'www.example.org' },
      { k: 'ping', name: 'www.example.org', ip: '203.0.113.10' }
    ],
    'no-address': [
      { k: 'addr' },
      { k: 'routes' },
      { k: 'ping', ip: '192.168.122.1' },
      { k: 'getent', name: 'www.example.org' },
      { k: 'getent', name: 'demosrv1' }
    ],
    'bad-resolver': [
      { k: 'resolv' },
      { k: 'ping', ip: '1.1.1.1' },
      { k: 'getent', name: 'www.example.org' },
      { k: 'dnsFix', ns: '192.168.122.1' }
    ],
    'longest-prefix': [
      { k: 'routeAdd', dst: '10.0.0.0', prefix: 8, via: '192.168.122.254' },
      { k: 'routeAdd', dst: '10.1.0.0', prefix: 16, via: '192.168.122.253' },
      { k: 'routeGet', ip: '10.1.2.3' },
      { k: 'routeGet', ip: '10.2.0.1' },
      { k: 'routeGet', ip: '8.8.8.8' }
    ]
  };
  var SCRIPT_IDS = ['healthy', 'stale-hosts', 'no-default', 'no-address', 'bad-resolver', 'longest-prefix'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── routes ──

  /** The connected route of an address (rule 4): the network of the prefix, on the link, from the kernel. */
  function connectedOf(addr, dev) {
    return { dst: format((parse(addr.ip) & mask(addr.prefix)) >>> 0), prefix: addr.prefix, via: null, dev: dev,
      metric: 100, proto: 'kernel', scope: 'link', src: addr.ip };
  }
  /** The default route DHCP gives through the profile (ch14 "Sučelje, adresa i ruta"). */
  function defaultOf(addr, dev) {
    return { dst: '0.0.0.0', prefix: 0, via: GW, dev: dev, metric: 100, proto: 'dhcp', scope: null, src: addr.ip };
  }

  /** Kernel listing order: by network, then the longer prefix first (fib_trie keeps a key's aliases so), then metric
      (check); a new route goes after its equals. */
  function insertRoute(routes, r) {
    var key = function (x) { return [parse(x.dst), x.prefix, x.metric]; };
    var k = key(r);
    var at = routes.length;
    for (var i = 0; i < routes.length; i++) {
      var o = key(routes[i]);
      if (o[0] > k[0] || (o[0] === k[0] && (o[1] < k[1] || (o[1] === k[1] && o[2] > k[2])))) { at = i; break; }
    }
    routes.splice(at, 0, r);
  }

  /** The line `ip route` prints for a route (proto boot and metric 0 are not printed). */
  function routeLine(r) {
    var s = (r.prefix === 0 ? 'default' : r.dst + '/' + r.prefix);
    if (r.via) s += ' via ' + r.via;
    s += ' dev ' + r.dev;
    if (r.proto && r.proto !== 'boot') s += ' proto ' + r.proto;
    if (r.scope) s += ' scope ' + r.scope;
    if (r.src) s += ' src ' + r.src;
    if (r.metric) s += ' metric ' + r.metric;
    return s;
  }

  /**
   * Route lookup (rules 2 and 3) over a table of { dst, prefix, metric }: of the routes whose prefix contains the
   * destination, the longest prefix wins (default = 0/0 matches everything with length 0); equal length, the lowest
   * metric; equal metric, the first in table order. Returns the matching indices in table order, the winner (-1: no
   * route) and the matching indices ordered best first.
   */
  function lookup(table, destIp) {
    var dest = parse(destIp);
    var matches = [];
    table.forEach(function (r, i) { if (match(dest, parse(r.dst), r.prefix)) matches.push(i); });
    var order = matches.slice().sort(function (a, b) {
      var ra = table[a], rb = table[b];
      if (ra.prefix !== rb.prefix) return rb.prefix - ra.prefix;   // longer prefix first
      if (ra.metric !== rb.metric) return ra.metric - rb.metric;   // then lower metric
      return a - b;                                                // then table order
    });
    return { dest: destIp, matches: matches, winner: order.length ? order[0] : -1, order: order };
  }

  /** Whether an address is on the host's own link: the winning route has no `via` (rule 5). */
  function onLink(cfg, ip) {
    var lk = lookup(cfg.routes, ip);
    return lk.winner >= 0 && !cfg.routes[lk.winner].via;
  }

  /** `ip route get` (rules 2–6): the winning route, the next hop (`via`, or none on the link) and the source address. */
  function routeGet(cfg, ip) {
    var lk = lookup(cfg.routes, ip);
    if (lk.winner < 0) return { ok: false, lookup: lk };
    var r = cfg.routes[lk.winner];
    // rule 6: the source is the route's preferred source, else the interface's address
    var src = r.src || (cfg.iface.addr ? cfg.iface.addr.ip : null);
    return { ok: true, lookup: lk, row: lk.winner, via: r.via, dev: r.dev, src: src, hop: r.via || ip };
  }

  // ── the configuration of the three places ──

  /** The healthy demosrv1 (ch14): enp1s0 up with 192.168.122.57/24, the default and the connected route, the
      hosts: line, /etc/hosts with localhost and the host's own name, the name server from the profile. */
  function healthyConfig() {
    var iface = { name: DEV, admin: 'up', addr: clone(ADDR) };
    var cfg = {
      iface: iface,
      routes: [],
      nsswitch: ['files', 'dns', 'myhostname'],
      hosts: [{ ip: '127.0.0.1', names: ['localhost', 'localhost.localdomain'] }, { ip: ADDR.ip, names: [HOST] }],
      profile: { name: PROFILE, dns: GW },
      resolv: { nameserver: GW },
      dnsZone: clone(ZONE)
    };
    insertRoute(cfg.routes, defaultOf(iface.addr, DEV));
    insertRoute(cfg.routes, connectedOf(iface.addr, DEV));
    return cfg;
  }

  /**
   * Rule 4: remove the address (or set the link down). With the device's last IPv4 address gone the kernel flushes
   * every route on the device, the connected route and the DHCP default route among them (check); with the link down
   * every route on the device goes too.
   */
  function delAddr(cfg) {
    cfg.iface.addr = null;
    cfg.routes = cfg.routes.filter(function (r) { return r.dev !== cfg.iface.name; });
  }
  function setLink(cfg, admin) {
    cfg.iface.admin = admin;
    if (admin === 'down') cfg.routes = cfg.routes.filter(function (r) { return r.dev !== cfg.iface.name; });
    else syncConnected(cfg);
  }
  /** Rule 4 the other way: an address on an interface that is up has its connected route. */
  function syncConnected(cfg) {
    var a = cfg.iface.addr;
    if (!a || cfg.iface.admin !== 'up') return;
    var c = connectedOf(a, cfg.iface.name);
    var has = cfg.routes.some(function (r) { return r.proto === 'kernel' && r.dst === c.dst && r.prefix === c.prefix; });
    if (!has) insertRoute(cfg.routes, c);
  }

  /** The configuration at step 0 for a break (task "Params"). */
  function configFor(brk) {
    var cfg = healthyConfig();
    if (brk === 'address') delAddr(cfg);
    else if (brk === 'route') cfg.routes = cfg.routes.filter(function (r) { return r.prefix !== 0; });
    else if (brk === 'resolver') { cfg.profile.dns = BAD_NS; cfg.resolv.nameserver = BAD_NS; }
    else if (brk === 'hosts') cfg.hosts.push(clone(STALE));
    return cfg;
  }

  // ── names (rule 1) ──

  /**
   * Resolve a name by the sources of the hosts: line, in order, until one has a result. files: a line of /etc/hosts
   * naming it. dns: needs a route to the name server of /etc/resolv.conf (else unavailable) and someone answering
   * there (else a time-out); the zone has the name or not. myhostname: the host's own name, to its address (none:
   * 127.0.0.2). Returns the trace of the sources, the address (or null) and, on failure, whether a source was
   * unavailable ('tempfail') or every source said no ('notfound').
   */
  function resolve(cfg, name) {
    var trace = [], ip = null, from = null, unavail = false, dns = null;
    for (var i = 0; i < cfg.nsswitch.length; i++) {
      var src = cfg.nsswitch[i];
      if (ip) { trace.push({ src: src, result: 'skip' }); continue; }
      if (src === 'files') {
        var line = -1;
        cfg.hosts.forEach(function (hl, k) { if (line < 0 && hl.names.indexOf(name) >= 0) line = k; });
        if (line >= 0) { ip = cfg.hosts[line].ip; from = 'files'; trace.push({ src: src, result: 'hit', ip: ip, line: line }); }
        else trace.push({ src: src, result: 'miss' });
      } else if (src === 'dns') {
        var ns = cfg.resolv.nameserver;
        var rg = routeGet(cfg, ns);
        dns = { ns: ns, lookup: rg.lookup, ok: rg.ok, hop: rg.ok ? rg.hop : null };
        if (!rg.ok) { unavail = true; trace.push({ src: src, result: 'unavail', why: 'noroute', ns: ns }); }
        else if (!serverAnswers(ns)) { unavail = true; trace.push({ src: src, result: 'unavail', why: 'timeout', ns: ns }); }
        else if (cfg.dnsZone[name]) { ip = cfg.dnsZone[name]; from = 'dns'; trace.push({ src: src, result: 'hit', ip: ip, ns: ns }); }
        else trace.push({ src: src, result: 'miss', ns: ns });
      } else if (src === 'myhostname') {
        if (name === HOST) {
          ip = cfg.iface.addr ? cfg.iface.addr.ip : MYHOSTNAME_NOADDR;
          from = 'myhostname';
          trace.push({ src: src, result: 'hit', ip: ip });
        } else trace.push({ src: src, result: 'miss' });
      }
    }
    return { name: name, ip: ip, from: from, trace: trace, dns: dns, err: ip ? null : unavail ? 'tempfail' : 'notfound' };
  }
  function serverAnswers(ns) { return ns === DNS_SERVER; }

  /** Whether an echo request to ip, sent to hop, comes back: someone must be at the next hop on the link, and an
      address beyond the gateway answers only through the gateway (rule 6's other side). */
  function answers(ip, hop) {
    if (!LAN_HOSTS[hop]) return false;
    if (hop === ip) return true;
    return hop === GW && FAR_HOSTS.indexOf(ip) >= 0;
  }

  // ── outputs (data, as the book prints them; shortened where NOTES.md says) ──

  function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
  function brAddrLines(cfg) {
    var i = cfg.iface;
    var state = i.admin === 'up' ? 'UP' : 'DOWN';
    return [pad('lo', 16) + ' ' + pad('UNKNOWN', 14) + ' 127.0.0.1/8',
      pad(i.name, 16) + ' ' + pad(state, 14) + (i.addr ? ' ' + i.addr.ip + '/' + i.addr.prefix : '')];
  }
  function getentLine(ip, names) { return pad(ip, 15) + ' ' + names.join(' '); }

  // ── the commands ──

  /** The command line of a command (data). */
  function commandText(cmd, p) {
    switch (cmd.k) {
      case 'addr': return ['ip -br addr'];
      case 'routes': return ['ip route'];
      case 'routeGet': return ['ip route get ' + cmd.ip];
      case 'getent': return ['getent hosts ' + cmd.name];
      case 'ping': return ['ping -c1 -W1 ' + pingTarget(cmd, p)];
      case 'nsswitch': return ["grep -n '^hosts' /etc/nsswitch.conf"];
      case 'resolv': return ['cat /etc/resolv.conf'];
      case 'hostsDel': return ["sudo sed -i '/^" + cmd.ip.replace(/\./g, '\\.') + "/d' /etc/hosts"];
      case 'routeAdd': return ['sudo ip route add ' + cmd.dst + '/' + cmd.prefix + ' via ' + cmd.via];
      case 'dnsFix': return ["sudo nmcli connection modify '" + PROFILE + "' ipv4.dns " + cmd.ns, "sudo nmcli connection up '" + PROFILE + "'"];
    }
    return [];
  }
  function pingTarget(cmd, p) { return cmd.name && p.target !== 'by-address' ? cmd.name : cmd.ip; }

  /**
   * Run one command on a configuration (changed in place for the commands that change it). Returns what the page
   * shows: the phases ({ phase: 'read' | 'name' | 'route' | 'link' | 'change', place, result: 'ok' | 'fail' | 'info' |
   * 'pending' }), the lookup the routing table shows, the name trace, the packet, the output lines and the exit
   * status, the ladder rung that failed (rule 7) and the marks of what changed or was read.
   */
  function run(cfg, cmd, p) {
    var r = { phases: [], lookup: null, name: null, packet: null, out: [], exit: 0, rung: null, changed: [], dest: null };
    switch (cmd.k) {
      case 'addr': {
        r.out = brAddrLines(cfg);
        var ok = !!cfg.iface.addr && cfg.iface.admin === 'up';
        r.phases.push({ phase: 'read', place: 'iface', result: ok ? 'ok' : 'fail' });
        if (!ok) r.rung = cfg.iface.admin === 'up' ? 'address' : 'link';
        r.changed.push('iface');
        break;
      }
      case 'routes': {
        r.out = cfg.routes.map(routeLine);
        var hasDefault = cfg.routes.some(function (x) { return x.prefix === 0; });
        r.phases.push({ phase: 'read', place: 'route', result: hasDefault ? 'ok' : 'fail' });
        if (!hasDefault) r.rung = cfg.iface.addr ? 'route' : 'address';
        r.changed.push('routes');
        break;
      }
      case 'routeGet': {
        r.dest = cmd.ip;
        routePhase(cfg, cmd.ip, r);
        if (r.phases[0].result === 'ok') {
          var g = r.route;
          r.out = [cmd.ip + (g.via ? ' via ' + g.via : '') + ' dev ' + g.dev + ' src ' + g.src + ' uid 1000', '    cache'];
        } else { r.out = ['RTNETLINK answers: Network is unreachable']; r.exit = 2; }
        break;
      }
      case 'getent': {
        namePhase(cfg, cmd.name, r);
        var hit = r.name.trace.filter(function (x) { return x.result === 'hit'; })[0];
        if (r.name.ip) r.out = [getentLine(r.name.ip, hit.src === 'files' ? cfg.hosts[hit.line].names : [cmd.name])];
        else r.exit = 2;
        break;
      }
      case 'ping': {
        var byName = !!cmd.name && p.target !== 'by-address';
        var shown = pingTarget(cmd, p);
        var ip = cmd.ip;
        if (byName) {
          namePhase(cfg, cmd.name, r);
          if (!r.name.ip) {
            r.out = ['ping: ' + cmd.name + ': ' + (r.name.err === 'tempfail' ? 'Temporary failure in name resolution' : 'Name or service not known')];
            r.exit = 2;
            r.phases.push({ phase: 'route', place: 'route', result: 'pending' }, { phase: 'link', place: 'link', result: 'pending' });
            break;
          }
          ip = r.name.ip;
        }
        r.dest = ip;
        routePhase(cfg, ip, r);
        if (r.phases[r.phases.length - 1].result !== 'ok') {
          r.out = ['ping: connect: Network is unreachable'];
          r.exit = 2;
          r.phases.push({ phase: 'link', place: 'link', result: 'pending' });
          break;
        }
        var hop = r.route.hop;
        var back = answers(ip, hop);
        r.packet = { to: ip, hop: hop, via: r.route.via, reply: back, kind: 'ping' };
        r.phases.push({ phase: 'link', place: 'link', result: back ? 'ok' : 'fail' });
        var head = byName ? shown + ' (' + ip + ')' : ip;
        r.out = ['PING ' + head + ' 56(84) bytes of data.'];
        if (back) r.out.push('64 bytes from ' + head + ': icmp_seq=1 …');
        r.out.push('--- ' + shown + ' ping statistics ---',
          '1 packets transmitted, ' + (back ? '1 received, 0%' : '0 received, 100%') + ' packet loss …');
        if (!back) { r.exit = 1; r.rung = 'other'; }
        break;
      }
      case 'nsswitch':
        r.out = ['10:hosts:      ' + cfg.nsswitch.join(' ').replace('files dns', 'files  dns')];
        r.phases.push({ phase: 'read', place: 'name', result: 'info' });
        r.changed.push('nsswitch');
        break;
      case 'resolv':
        r.out = ['# Generated by NetworkManager', 'search lab.local', 'nameserver ' + cfg.resolv.nameserver];
        r.phases.push({ phase: 'read', place: 'name', result: 'info' });
        r.changed.push('resolv');
        break;
      case 'hostsDel': {
        var before = cfg.hosts.length;
        cfg.hosts = cfg.hosts.filter(function (hl) { return hl.ip !== cmd.ip; });
        r.phases.push({ phase: 'change', place: 'name', result: before !== cfg.hosts.length ? 'ok' : 'info' });
        r.changed.push('hosts');
        r.removed = before - cfg.hosts.length;
        break;
      }
      case 'routeAdd': {
        // the gateway must be on the link: its lookup must end on a route without via (check)
        r.lookup = Object.assign({ purpose: 'gateway' }, lookup(cfg.routes, cmd.via));
        if (!onLink(cfg, cmd.via)) {
          r.out = ['Error: Nexthop has invalid gateway.'];
          r.exit = 2;
          r.phases.push({ phase: 'change', place: 'route', result: 'fail' });
          r.rung = cfg.iface.addr ? 'route' : 'address';
          break;
        }
        var nr = { dst: cmd.dst, prefix: cmd.prefix, via: cmd.via, dev: cfg.iface.name, metric: 0, proto: 'boot', scope: null, src: null };
        insertRoute(cfg.routes, nr);
        r.phases.push({ phase: 'change', place: 'route', result: 'ok' });
        r.added = cmd.dst + '/' + cmd.prefix;
        r.lookup = null;
        r.changed.push('routes');
        break;
      }
      case 'dnsFix': {
        // the profile is the input, /etc/resolv.conf the output: modify the profile, then bring it up again, which
        // also puts back its address and the routes it gives (check)
        cfg.profile.dns = cmd.ns;
        var hadAddr = !!cfg.iface.addr, hadDefault = cfg.routes.some(function (x) { return x.prefix === 0; });
        cfg.iface.admin = 'up';
        cfg.iface.addr = clone(ADDR);
        syncConnected(cfg);
        if (!hadDefault) insertRoute(cfg.routes, defaultOf(cfg.iface.addr, cfg.iface.name));
        cfg.resolv.nameserver = cmd.ns;
        r.out = ['Connection successfully activated (D-Bus active path: /org/freedesktop/NetworkManager/ActiveConnection/3)'];
        r.phases.push({ phase: 'change', place: 'name', result: 'ok' });
        r.changed.push('profile', 'resolv');
        if (!hadAddr) r.changed.push('iface');
        if (!hadDefault || !hadAddr) r.changed.push('routes');
        break;
      }
    }
    return r;
  }

  /** Phase 1 of a command with a name (rule 1). */
  function namePhase(cfg, name, r) {
    var res = resolve(cfg, name);
    r.name = res;
    if (res.dns && res.trace.some(function (t) { return t.src === 'dns' && t.result !== 'skip'; })) {
      r.lookup = Object.assign({ purpose: 'dns' }, res.dns.lookup);
      if (res.dns.ok) r.packet = { to: res.dns.ns, hop: res.dns.hop, via: null, reply: serverAnswers(res.dns.ns), kind: 'dns' };
    }
    r.phases.push({ phase: 'name', place: 'name', result: res.ip ? 'ok' : 'fail' });
    // rule 7: no route to the name server is the address or route rung, not the name's fault
    var noRoute = res.trace.some(function (x) { return x.why === 'noroute'; });
    if (!res.ip) r.rung = noRoute ? rungOfNoRoute(cfg) : 'name';
    r.changed.push('name:' + (res.from || 'none'));
  }

  /** Rule 7: the rung a failed route lookup belongs to. */
  function rungOfNoRoute(cfg) { return cfg.iface.admin !== 'up' ? 'link' : cfg.iface.addr ? 'route' : 'address'; }

  /** Phase 2: the route lookup (rules 2–6). */
  function routePhase(cfg, ip, r) {
    var g = routeGet(cfg, ip);
    r.lookup = Object.assign({ purpose: 'dest' }, g.lookup);
    r.route = g;
    r.phases.push({ phase: 'route', place: 'route', result: g.ok ? 'ok' : 'fail' });
    if (!g.ok) r.rung = rungOfNoRoute(cfg);
    r.packet = null; // a DNS query of the name phase is not drawn: the step is about this lookup
  }

  function scriptOf(p) { return SCRIPTS[p.script] || SCRIPTS.healthy; }

  /** The places that are broken now (a command may have repaired one): 'iface', 'route', 'resolv', 'hosts'. */
  function faults(s) {
    var out = [];
    if (!s.iface.addr || s.iface.admin !== 'up') out.push('iface');
    else if (!s.routes.some(function (r) { return r.prefix === 0; })) out.push('route');
    if (s.resolv.nameserver !== DNS_SERVER) out.push('resolv');
    if (s.hosts.some(function (hl) { return hl.ip === STALE.ip; })) out.push('hosts');
    return out;
  }

  /** LAN addresses the script sends to where nobody is (the page draws them as one empty node), over every step. */
  function strangers(p) {
    var s = logic.initial(p), out = [];
    for (var n = 1; n <= logic.steps(p); n++) {
      s = logic.step(s, n, p);
      var hop = s.packet && s.packet.hop;
      if (hop && !LAN_HOSTS[hop] && out.indexOf(hop) < 0) out.push(hop);
    }
    return out;
  }

  var logic = {
    HOST: HOST,
    GW: GW,
    ADDR: ADDR,
    PROFILE: PROFILE,
    STALE: STALE,
    BAD_NS: BAD_NS,
    BREAKS: BREAKS,
    SCRIPTS: SCRIPTS,
    SCRIPT_IDS: SCRIPT_IDS,
    LAN_HOSTS: LAN_HOSTS,
    FAR_HOSTS: FAR_HOSTS,
    ZONE: ZONE,
    parse: parse,
    format: format,
    match: match,
    lookup: lookup,
    routeGet: routeGet,
    routeLine: routeLine,
    insertRoute: insertRoute,
    connectedOf: connectedOf,
    healthyConfig: healthyConfig,
    configFor: configFor,
    delAddr: delAddr,
    setLink: setLink,
    resolve: resolve,
    answers: answers,
    run: run,
    commandText: commandText,
    scriptOf: scriptOf,
    faults: faults,
    strangers: strangers,

    /** Parameter defaults (task "Params"; `script` picks the preset's command list). */
    defaults: { script: 'healthy', break: 'none', target: 'by-name' },

    /** One step per command: 6, 6, 4, 5, 4, 5. */
    steps: function (p) { return scriptOf(p).length; },

    /** Step 0: the configuration with the break applied, no command run yet. */
    initial: function (p) {
      var cfg = configFor(p.break);
      return Object.assign(cfg, {
        broke: p.break,
        cmd: null, text: [], phases: [], lookup: null, name: null, packet: null, route: null, dest: null, out: [], exit: null,
        event: { kind: 'start', rung: null, changed: p.break === 'none' ? [] : ['broken'] }
      });
    },

    /** State after step n: run command n on the configuration left by the commands before it. */
    step: function (prev, n, p) {
      var s = clone(prev);
      var cmd = scriptOf(p)[n - 1];
      var cfg = { iface: s.iface, routes: s.routes, nsswitch: s.nsswitch, hosts: s.hosts, profile: s.profile, resolv: s.resolv, dnsZone: s.dnsZone };
      var r = run(cfg, cmd, p);
      s.iface = cfg.iface; s.routes = cfg.routes; s.hosts = cfg.hosts; s.profile = cfg.profile; s.resolv = cfg.resolv;
      s.cmd = cmd;
      s.text = commandText(cmd, p);
      s.phases = r.phases;
      s.lookup = r.lookup;
      s.name = r.name;
      s.packet = r.packet;
      s.route = r.route ? { ok: r.route.ok, row: r.route.ok ? r.route.row : -1, via: r.route.via || null, src: r.route.src || null, hop: r.route.hop || null } : null;
      s.dest = r.dest;
      s.out = r.out;
      s.exit = r.exit;
      s.event = { kind: cmd.k, rung: r.rung, changed: r.changed, added: r.added || null, removed: r.removed == null ? null : r.removed };
      return s;
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
