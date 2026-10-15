/* SPDX-License-Identifier: AGPL-3.0-or-later
   Model for lnx-netfilter-path: a packet through the netfilter hooks of a Linux router. One step moves the packet by
   one box: at a hook every base chain attached to it runs in priority order (first match per chain, the policy when
   nothing matches; accept ends only the chain, drop ends everything; a nat chain sees only a connection's first
   packet), at the routing decision the output interface is chosen. Rules and numbers: SPEC.md.
   Pure: no DOM, no Math.random, no Date, no timers. State is plain JSON.
   The page loads this as a classic script (window.SimLogic); node tests require() it. */
(function (root) {
  'use strict';

  /** The router's interfaces (RFC 5737 documentation address on the WAN side). */
  var IFACES = { eth0: { addr: '198.51.100.10', net: null }, eth1: { addr: '10.0.0.1', net: '10.0.0.0/24' } };
  var LOCAL_ADDRS = ['198.51.100.10', '10.0.0.1'];
  /** The route table: longest prefix wins; the default route last. */
  var ROUTES = [{ dst: '10.0.0.0/24', oif: 'eth1' }, { dst: 'default', oif: 'eth0' }];
  /** The hosts around the router, by side (not by role: either may be the client of a connection). */
  var HOSTS = { '203.0.113.7': 'outside', '10.0.0.5': 'inside', '198.51.100.10': 'rtr', '10.0.0.1': 'rtr' };

  /** The packets the student can send (SPEC.md "Packets"). from: who sends it; iif null = a local process. */
  var PACKETS = {
    'ssh-in': { from: 'outside', p: { src: '203.0.113.7', sport: 51000, dst: '198.51.100.10', dport: 22, proto: 'tcp', iif: 'eth0', oif: null } },
    'port-fwd': { from: 'outside', p: { src: '203.0.113.7', sport: 51000, dst: '198.51.100.10', dport: 8080, proto: 'tcp', iif: 'eth0', oif: null } },
    'lan-out': { from: 'inside', p: { src: '10.0.0.5', sport: 50000, dst: '203.0.113.7', dport: 443, proto: 'tcp', iif: 'eth1', oif: null } },
    'local-out': { from: 'rtr', p: { src: '198.51.100.10', sport: 40000, dst: '203.0.113.7', dport: 443, proto: 'tcp', iif: null, oif: null } }
  };
  var PACKET_IDS = Object.keys(PACKETS);

  var HOOKS = ['prerouting', 'input', 'forward', 'output', 'postrouting'];
  /** Where conntrack applies a recorded translation: destination NAT before routing, source NAT after it. */
  var NAT_POINT = { prerouting: 'dst', output: 'dst', postrouting: 'src', input: 'src' };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── addresses ──

  function ipNum(a) { return String(a).split('.').reduce(function (n, x) { return n * 256 + Number(x); }, 0); }
  /** Is address a in prefix 'net/len' ('default' matches everything)? */
  function inNet(a, net) {
    if (net === 'default') return true;
    var f = net.split('/'), len = Number(f[1]);
    var size = Math.pow(2, 32 - len);
    return Math.floor(ipNum(a) / size) === Math.floor(ipNum(f[0]) / size);
  }
  function prefixLen(net) { return net === 'default' ? 0 : Number(net.split('/')[1]); }
  function isLocal(a) { return LOCAL_ADDRS.indexOf(a) >= 0; }

  /** The route for a destination: the matching route with the longest prefix (ties: the earlier row). */
  function routeOf(dst) {
    var best = -1;
    ROUTES.forEach(function (r, i) {
      if (inNet(dst, r.dst) && (best < 0 || prefixLen(r.dst) > prefixLen(ROUTES[best].dst))) best = i;
    });
    return { at: best, oif: best >= 0 ? ROUTES[best].oif : null };
  }

  /**
   * The routing decision after prerouting (rules 2, 8): local destination → input; else, with forwarding off, drop;
   * else forward through the route's interface. It reads the destination as it is now, after any DNAT.
   */
  function routeDecision(dst, ipForward) {
    if (isLocal(dst)) return { to: 'input', oif: null, route: -1, local: true };
    var r = routeOf(dst);
    if (!ipForward) return { to: 'dropped', oif: null, route: r.at, local: false };
    return { to: 'forward', oif: r.oif, route: r.at, local: false };
  }

  // ── the ruleset ──

  /** Rule match fields: iif, oif, saddr (prefix), dport, ct ('established' = established or related). */
  function chainsOf(p) {
    var fwd = [
      { m: { ct: 'established' }, v: 'accept' },
      { m: { iif: 'eth1', oif: 'eth0' }, v: 'accept' }
    ];
    if (p.fwdRule === '80' || p.fwdRule === '8080') fwd.push({ m: { dport: Number(p.fwdRule) }, v: 'accept' });
    var chains = [
      { name: 'nat_pre', hook: 'prerouting', type: 'nat', prio: -100, policy: 'accept',
        rules: [{ m: { iif: 'eth0', dport: 8080 }, v: 'dnat', to: { addr: '10.0.0.5', port: 80 } }] },
      { name: 'filter_in', hook: 'input', type: 'filter', prio: 0, policy: p.inputPolicy === 'accept' ? 'accept' : 'drop',
        rules: [{ m: { ct: 'established' }, v: 'accept' }, { m: { dport: 22 }, v: 'accept' }] },
      { name: 'filter_fwd', hook: 'forward', type: 'filter', prio: 0, policy: 'drop', rules: fwd },
      { name: 'nat_post', hook: 'postrouting', type: 'nat', prio: 100, policy: 'accept',
        rules: [{ m: { saddr: '10.0.0.0/24', oif: 'eth0' }, v: 'masquerade' }] }
    ];
    if (p.extra === '10' || p.extra === '0') {
      chains.push({ name: 'extra', hook: 'input', type: 'filter', prio: Number(p.extra), policy: 'drop',
        rules: [{ m: { saddr: '10.0.0.0/24' }, v: 'accept' }] });
    }
    return chains;
  }

  /**
   * The base chains at a hook in the order they run (rule 4): ascending priority; equal priority → by name (nft
   * leaves the order undefined; the model picks one and the page warns). Returns { chains, tie }.
   */
  function chainsAt(chains, hook) {
    var at = chains.filter(function (c) { return c.hook === hook; });
    at.sort(function (a, b) { return a.prio - b.prio || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0); });
    var tie = false;
    for (var i = 1; i < at.length; i++) if (at[i].prio === at[i - 1].prio) tie = true;
    return { chains: at, tie: tie };
  }

  /** The match fields of a rule that this packet fails (empty = the rule matches). ctState: 'new' | 'established'. */
  function missOf(rule, pkt, ctState) {
    var m = rule.m, miss = [];
    if (m.iif !== undefined && pkt.iif !== m.iif) miss.push('iif');
    if (m.oif !== undefined && pkt.oif !== m.oif) miss.push('oif');
    if (m.saddr !== undefined && !inNet(pkt.src, m.saddr)) miss.push('saddr');
    if (m.dport !== undefined && pkt.dport !== m.dport) miss.push('dport');
    if (m.ct !== undefined && ctState !== m.ct) miss.push('ct');
    return miss;
  }

  /**
   * Run one chain over a packet (rule 5): rules top down; the first rule that matches decides (accept, drop or a NAT
   * statement, which is terminal and accepts); no match → the policy. Returns { at: deciding rule index
   * (rules.length = the policy), verdict: 'accept' | 'drop' | 'dnat' | 'masquerade', miss: [[fields] per rule read] }.
   */
  function runChain(chain, pkt, ctState) {
    var miss = [];
    for (var i = 0; i < chain.rules.length; i++) {
      var ms = missOf(chain.rules[i], pkt, ctState);
      miss.push(ms);
      if (!ms.length) return { at: i, verdict: chain.rules[i].v, miss: miss };
    }
    return { at: chain.rules.length, verdict: chain.policy, miss: miss };
  }

  // ── conntrack ──

  function tupleOf(p) { return { src: p.src, sport: p.sport, dst: p.dst, dport: p.dport }; }
  function invert(t) { return { src: t.dst, sport: t.dport, dst: t.src, dport: t.sport }; }
  function sameTuple(a, b) { return a.src === b.src && a.sport === b.sport && a.dst === b.dst && a.dport === b.dport; }

  /** Find the packet's connection: its tuple is a recorded original (dir orig) or reply (dir reply) tuple. */
  function ctLookup(table, pkt) {
    var t = tupleOf(pkt);
    for (var i = 0; i < table.length; i++) {
      if (sameTuple(table[i].orig, t)) return { idx: i, dir: 'orig' };
      if (sameTuple(table[i].reply, t)) return { idx: i, dir: 'reply' };
    }
    return null;
  }

  /**
   * The translation conntrack applies to a later packet at a NAT point (rule 7): the packet must end up as the
   * inverse of the other direction's tuple. kind 'dst' rewrites dst/dport, 'src' rewrites src/sport. Returns the list
   * of fields it changed.
   */
  function ctTranslate(entry, dir, pkt, kind) {
    var want = invert(dir === 'orig' ? entry.reply : entry.orig);
    var fields = kind === 'dst' ? ['dst', 'dport'] : ['src', 'sport'];
    var changed = [];
    fields.forEach(function (f) { if (pkt[f] !== want[f]) { pkt[f] = want[f]; changed.push(f); } });
    return changed;
  }

  // ── one step at each kind of box ──

  /**
   * Run every base chain at a hook (rules 4–7). Mutates s.packet, s.conntrack, s.ct; returns { trace, dropped,
   * changed, tie }. The order inside the step: match rules top down → apply the verdict → apply any NAT → move.
   */
  function runHook(s, hook) {
    var out = { trace: [], dropped: false, changed: [], tie: false };
    var pkt = s.packet;
    // conntrack looks the packet up where it enters the ruleset (prerouting for packets from a wire, output for local)
    if ((hook === 'prerouting' || hook === 'output') && !s.ct) {
      var found = ctLookup(s.conntrack, pkt);
      if (found) {
        s.ct = { idx: found.idx, dir: found.dir, state: 'established' };
        if (s.conntrack[found.idx].status !== 'established') { s.conntrack[found.idx].status = 'established'; out.changed.push('ct:' + found.idx); }
      } else {
        s.conntrack.push({ orig: tupleOf(pkt), reply: invert(tupleOf(pkt)), nat: [], status: 'new' });
        s.ct = { idx: s.conntrack.length - 1, dir: 'orig', state: 'new' };
        out.changed.push('ct:' + s.ct.idx);
      }
    }
    var ordered = chainsAt(s.chains, hook);
    out.tie = ordered.tie;
    for (var i = 0; i < ordered.chains.length; i++) {
      var ch = ordered.chains[i];
      if (ch.type === 'nat' && s.ct && s.ct.state !== 'new') {
        // rule 7: a nat chain sees only the first packet; conntrack repeats (or reverses) the recorded translation
        var entry = s.conntrack[s.ct.idx];
        var ch7 = ctTranslate(entry, s.ct.dir, pkt, NAT_POINT[hook]);
        out.trace.push({ hook: hook, chain: ch.name, rule: null, verdict: ch7.length ? 'ct-nat' : 'skip', fields: ch7 });
        ch7.forEach(function (f) { out.changed.push('pkt:' + f); });
        continue;
      }
      var r = runChain(ch, pkt, s.ct ? s.ct.state : 'new');
      var step = { hook: hook, chain: ch.name, rule: r.at, verdict: r.verdict, miss: r.miss, fields: [] };
      out.trace.push(step);
      if (r.at < ch.rules.length) out.changed.push('rule:' + ch.name + ':' + r.at);
      if (r.verdict === 'drop') { out.dropped = true; break; } // rule 6: drop is final
      if (r.verdict === 'dnat') { // rule 3: the destination, before the routing decision
        var to = ch.rules[r.at].to;
        if (pkt.dst !== to.addr) step.fields.push('dst');
        if (pkt.dport !== to.port) step.fields.push('dport');
        pkt.dst = to.addr; pkt.dport = to.port;
      } else if (r.verdict === 'masquerade') { // rule 3: the source, after it: the output interface's address
        var addr = IFACES[pkt.oif].addr;
        if (pkt.src !== addr) step.fields.push('src');
        pkt.src = addr;
      }
      if (step.fields.length && s.ct) {
        var e = s.conntrack[s.ct.idx];
        e.reply = invert(tupleOf(pkt)); // the reply now comes back to the translated address
        e.nat.push(r.verdict === 'dnat' ? 'dnat' : 'snat');
        out.changed.push('ct:' + s.ct.idx);
      }
      step.fields.forEach(function (f) { out.changed.push('pkt:' + f); });
      // accept (and a NAT statement) ends only this chain: the next chain at this hook still runs (rule 6)
    }
    return out;
  }

  /** The box after a hook, for a packet that was not dropped (rule 1). */
  function afterHook(hook) {
    return { prerouting: 'route', input: 'local', forward: 'postrouting', output: 'postrouting', postrouting: 'out' }[hook];
  }

  // ── frames ──

  function blank() { return { trace: [], visited: [] }; }

  /** The packet as its sender puts it on the wire (or hands it to the stack). */
  function startPacket(s, pkt, dir) {
    s.packet = clone(pkt);
    s.orig = clone(pkt);
    s.dir = dir;
    s.ct = null;
    s.trace = [];
    s.visited = [];
  }

  /** The reply to a packet that arrived (at 'local' or 'out'): addresses and ports swapped, sent by the other end. */
  function replyOf(pkt, at) {
    var r = { src: pkt.dst, sport: pkt.dport, dst: pkt.src, dport: pkt.sport, proto: pkt.proto, iif: null, oif: null };
    if (at === 'out') r.iif = pkt.oif; // the other end answers back over the same interface
    return r;
  }

  function initialOf(p) {
    var id = PACKETS[p.packet] ? p.packet : 'ssh-in';
    var def = PACKETS[id];
    var s = {
      packetId: id,
      from: def.from,
      dir: 'orig',
      packet: null, orig: null,
      at: def.p.iif ? 'in' : 'local',
      dropAt: null,
      next: def.p.iif ? 'prerouting' : 'route-out',
      visited: [],
      ct: null,
      conntrack: [],
      chains: chainsOf(p),
      ipForward: p.ipForward !== false,
      route: null,
      trace: [],
      event: { kind: 'start' },
      changed: []
    };
    startPacket(s, def.p, 'orig');
    return s;
  }

  /** Every state from step 0 to the end, for the params. */
  function framesOf(p) {
    var s = initialOf(p);
    var frames = [clone(s)];
    var guard = 0;
    while (s.next && guard++ < 40) {
      var box = s.next;
      s.changed = [];
      s.route = null;
      s.at = box;
      if (box !== 'dropped' && s.visited.indexOf(box) < 0) s.visited.push(box);
      if (HOOKS.indexOf(box) >= 0) {
        var r = runHook(s, box);
        r.trace.forEach(function (x) { s.trace.push(x); });
        s.changed = s.changed.concat(r.changed);
        s.event = { kind: 'hook', hook: box, tie: r.tie, dropped: r.dropped, first: s.visited.length === 1 };
        if (r.dropped) { s.dropAt = box; s.next = 'dropped'; } else s.next = afterHook(box);
      } else if (box === 'route') {
        var d = routeDecision(s.packet.dst, s.ipForward);
        s.route = d;
        if (d.oif) { s.packet.oif = d.oif; s.changed.push('pkt:oif'); }
        // what rewrote the destination before this decision: a DNAT rule (rule 2) or conntrack (rule 7)
        var pre = s.trace.filter(function (x) { return x.hook === 'prerouting' && x.fields && x.fields.length; })[0];
        s.event = { kind: 'route', to: d.to, rewrite: pre ? (pre.verdict === 'dnat' ? 'dnat' : 'ct') : null };
        if (d.to === 'dropped') s.dropAt = 'route';
        s.next = d.to;
      } else if (box === 'route-out') {
        var ro = routeOf(s.packet.dst);
        s.route = { to: 'output', oif: ro.oif, route: ro.at, local: false };
        s.packet.oif = ro.oif;
        s.changed.push('pkt:oif');
        s.event = { kind: 'route-out', first: s.visited.length === 1 };
        s.next = 'output';
      } else if (box === 'local' || box === 'out') {
        s.event = { kind: box };
        s.next = null;
      } else if (box === 'dropped') {
        // a connection whose first packet is dropped is never recorded ([ct] in SPEC.md)
        if (s.ct && s.ct.state === 'new') { s.conntrack.splice(s.ct.idx, 1); s.ct = null; s.changed.push('ct:gone'); }
        s.event = { kind: 'dropped', where: s.dropAt };
        s.next = null;
      }
      s.changed = s.changed.filter(function (m, i) { return s.changed.indexOf(m) === i; });
      frames.push(clone(s));
      if (p.reply && s.dir === 'orig' && (box === 'local' || box === 'out')) {
        // the reply walks next: swap the card, keep the conntrack table; its first box is the next frame
        startPacket(s, replyOf(s.packet, box), 'reply');
        s.from = box === 'out' ? (HOSTS[s.packet.src] || 'outside') : 'rtr';
        s.next = s.packet.iif ? 'prerouting' : 'route-out';
      }
    }
    return frames;
  }

  /** Frames for the page's params (memoised on the params that shape them). */
  var memo = {};
  function frames(p) {
    var key = [p.packet, p.reply ? 1 : 0, p.ipForward === false ? 0 : 1, p.inputPolicy, p.fwdRule, p.extra].join('|');
    if (!memo[key]) memo[key] = framesOf(p);
    return memo[key];
  }
  function stateAt(p, n) { var fr = frames(p); return clone(fr[Math.max(0, Math.min(n, fr.length - 1))]); }

  var logic = {
    /** Parameter defaults (task: ipForward on, inputPolicy drop, fwdRule dport 80). */
    defaults: { packet: 'ssh-in', reply: false, ipForward: true, inputPolicy: 'drop', fwdRule: '80', extra: 'none' },

    /** One step per box the packet enters, from its first box to its last (and the reply's, with reply on). */
    steps: function (p) { return frames(p).length - 1; },

    initial: function (p) { return stateAt(p, 0); },
    step: function (s, n, p) { return stateAt(p, n); },

    // pure helpers, for the page and the tests
    IFACES: IFACES, LOCAL_ADDRS: LOCAL_ADDRS, ROUTES: ROUTES, HOSTS: HOSTS, PACKETS: PACKETS, PACKET_IDS: PACKET_IDS,
    HOOKS: HOOKS, NAT_POINT: NAT_POINT,
    inNet: inNet, isLocal: isLocal, routeOf: routeOf, routeDecision: routeDecision, chainsOf: chainsOf,
    chainsAt: chainsAt, missOf: missOf, runChain: runChain, ctLookup: ctLookup, ctTranslate: ctTranslate,
    invert: invert, tupleOf: tupleOf, framesOf: framesOf, frames: frames
  };

  if (typeof module === 'object' && module.exports) module.exports = logic;
  else root.SimLogic = logic;
})(typeof globalThis !== 'undefined' ? globalThis : this);
